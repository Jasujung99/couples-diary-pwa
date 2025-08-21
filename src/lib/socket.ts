import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export interface SocketUser {
  userId: string;
  partnerId?: string;
  coupleId: string;
}

// Socket.io server initialization
export const initSocket = (server: NetServer): ServerIO => {
  const io = new ServerIO(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return next(new Error('Unauthorized'));
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, partnerId: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Generate coupleId (consistent for both partners)
      const coupleId = user.partnerId 
        ? [user.id, user.partnerId].sort().join('-')
        : user.id;

      socket.data = {
        userId: user.id,
        partnerId: user.partnerId,
        coupleId
      } as SocketUser;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userData = socket.data as SocketUser;
    console.log(`User ${userData.userId} connected to couple ${userData.coupleId}`);

    // Join couple room
    socket.join(userData.coupleId);

    // Notify partner of online status
    if (userData.partnerId) {
      socket.to(userData.coupleId).emit('partner-online', {
        userId: userData.userId,
        timestamp: new Date()
      });
    }

    // Handle diary entry events
    socket.on('diary-entry-created', (data) => {
      // Broadcast to partner
      socket.to(userData.coupleId).emit('new-diary-entry', {
        entryId: data.entryId,
        authorId: userData.userId,
        authorName: data.authorName,
        mood: data.mood,
        date: data.date,
        timestamp: new Date()
      });
    });

    socket.on('diary-entry-replied', (data) => {
      // Broadcast to partner that both entries are now complete
      socket.to(userData.coupleId).emit('diary-exchange-complete', {
        date: data.date,
        timestamp: new Date()
      });
    });

    // Handle date planning events
    socket.on('date-plan-created', (data) => {
      socket.to(userData.coupleId).emit('new-date-plan', {
        datePlanId: data.datePlanId,
        title: data.title,
        scheduledAt: data.scheduledAt,
        location: data.location,
        createdBy: userData.userId,
        createdByName: data.createdByName,
        timestamp: new Date()
      });
    });

    socket.on('date-plan-updated', (data) => {
      socket.to(userData.coupleId).emit('date-plan-changed', {
        datePlanId: data.datePlanId,
        changes: data.changes,
        updatedBy: userData.userId,
        updatedByName: data.updatedByName,
        timestamp: new Date()
      });
    });

    socket.on('checklist-updated', (data) => {
      socket.to(userData.coupleId).emit('checklist-changed', {
        datePlanId: data.datePlanId,
        checklist: data.checklist,
        updatedBy: userData.userId,
        updatedByName: data.updatedByName,
        timestamp: new Date()
      });
    });

    socket.on('checklist-item-completed', (data) => {
      socket.to(userData.coupleId).emit('checklist-item-done', {
        datePlanId: data.datePlanId,
        itemId: data.itemId,
        itemText: data.itemText,
        completedBy: userData.userId,
        completedByName: data.completedByName,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('diary-typing-start', () => {
      socket.to(userData.coupleId).emit('partner-typing-diary', {
        userId: userData.userId,
        timestamp: new Date()
      });
    });

    socket.on('diary-typing-stop', () => {
      socket.to(userData.coupleId).emit('partner-stopped-typing-diary', {
        userId: userData.userId,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userData.userId} disconnected from couple ${userData.coupleId}`);
      
      // Notify partner of offline status
      if (userData.partnerId) {
        socket.to(userData.coupleId).emit('partner-offline', {
          userId: userData.userId,
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

// Helper function to emit to a specific couple
export const emitToCouple = (io: ServerIO, coupleId: string, event: string, data: any) => {
  io.to(coupleId).emit(event, data);
};

// Helper function to emit to a specific user's partner
export const emitToPartner = (io: ServerIO, coupleId: string, excludeUserId: string, event: string, data: any) => {
  io.to(coupleId).emit(event, { ...data, excludeUserId });
};