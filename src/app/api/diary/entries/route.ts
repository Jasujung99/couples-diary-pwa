import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DiaryEntry, MediaItem } from '@/types';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

// GET /api/diary/entries - Get diary entries for the couple
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate coupleId (consistent for both partners)
    const coupleId = user.partnerId 
      ? [user.id, user.partnerId].sort().join('-')
      : user.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') as 'waiting' | 'replied' | null;

    const where: { coupleId: string; status?: 'waiting' | 'replied' } = { coupleId };
    if (status) {
      where.status = status;
    }

    const entries = await prisma.diaryEntry.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform entries to match our type
    const transformedEntries: DiaryEntry[] = entries.map(entry => ({
      id: entry.id,
      authorId: entry.authorId,
      coupleId: entry.coupleId,
      mood: entry.mood,
      content: entry.content,
      media: Array.isArray(entry.media) ? entry.media as unknown as MediaItem[] : [],
      date: entry.date,
      status: entry.status as 'waiting' | 'replied',
      isEncrypted: entry.isEncrypted,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }));

    return NextResponse.json({
      data: transformedEntries,
      success: true
    });

  } catch (error) {
    console.error('Error fetching diary entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diary entries' },
      { status: 500 }
    );
  }
}

// POST /api/diary/entries - Create a new diary entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { mood, content, media = [], date } = body;

    // Validation
    if (!mood || !content?.trim()) {
      return NextResponse.json(
        { error: 'Mood and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Generate coupleId (consistent for both partners)
    const coupleId = user.partnerId 
      ? [user.id, user.partnerId].sort().join('-')
      : user.id;

    // Check if user already wrote an entry for this date
    const entryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        authorId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'You have already written an entry for this date' },
        { status: 400 }
      );
    }

    // Check if partner has written an entry for this date
    let status: 'waiting' | 'replied' = 'waiting';
    if (user.partnerId) {
      const partnerEntry = await prisma.diaryEntry.findFirst({
        where: {
          authorId: user.partnerId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (partnerEntry) {
        status = 'replied';
        // Update partner's entry status to 'replied' as well
        await prisma.diaryEntry.update({
          where: { id: partnerEntry.id },
          data: { status: 'replied' }
        });
      }
    }

    // Create the diary entry
    const entry = await prisma.diaryEntry.create({
      data: {
        authorId: user.id,
        coupleId,
        mood,
        content: content.trim(),
        media: media || [],
        date: entryDate,
        status,
        isEncrypted: true // For now, we'll implement encryption later
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Transform entry to match our type
    const transformedEntry: DiaryEntry = {
      id: entry.id,
      authorId: entry.authorId,
      coupleId: entry.coupleId,
      mood: entry.mood,
      content: entry.content,
      media: Array.isArray(entry.media) ? entry.media as unknown as MediaItem[] : [],
      date: entry.date,
      status: entry.status as 'waiting' | 'replied',
      isEncrypted: entry.isEncrypted,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };

    // Emit Socket.io event for real-time notification
    try {
      const res = NextResponse.next();
      const server = (res as any).socket?.server as NetServer & { io?: ServerIO };
      
      if (server?.io && user.partnerId) {
        server.io.to(coupleId).emit('new-diary-entry', {
          entryId: entry.id,
          authorId: user.id,
          authorName: user.name,
          mood: entry.mood,
          date: entry.date.toISOString(),
          timestamp: new Date()
        });

        // If this completes an exchange, emit completion event
        if (status === 'replied') {
          server.io.to(coupleId).emit('diary-exchange-complete', {
            date: entry.date.toISOString(),
            timestamp: new Date()
          });
        }
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }

    return NextResponse.json({
      data: transformedEntry,
      success: true,
      message: 'Diary entry created successfully'
    });

  } catch (error) {
    console.error('Error creating diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to create diary entry' },
      { status: 500 }
    );
  }
}