import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface SocketUser {
  userId: string;
  partnerId?: string;
  coupleId: string;
}

let io: SocketIOServer | null = null;

export const getSocketServer = (server?: HTTPServer): SocketIOServer => {
  if (!io && server) {
    io = new SocketIOServer(server, {
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
        // For now, skip authentication in development
        // In production, you'd want to implement proper token-based auth
        const mockUser = {
          id: 'user-1',
          partnerId: 'user-2'
        };

        // Generate coupleId (consistent for both partners)
        const coupleId = mockUser.partnerId 
          ? [mockUser.id, mockUser.partnerId].sort().join('-')
          : mockUser.id;

        socket.data = {
          userId: mockUser.id,
          partnerId: mockUser.partnerId,
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
        socket.to(userData.coupleId).emit('diary-exchange-complete', {
          date: data.date,
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
        
        if (userData.partnerId) {
          socket.to(userData.coupleId).emit('partner-offline', {
            userId: userData.userId,
            timestamp: new Date()
          });
        }
      });
    });
  }

  return io!;
};

export const getIO = (): SocketIOServer | null => io;