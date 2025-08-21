import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DiaryEntry, MediaItem } from '@/types';

// GET /api/diary/entries/[id] - Get a specific diary entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const entry = await prisma.diaryEntry.findUnique({
      where: { id },
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

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if user has access to this entry (must be author or partner)
    const coupleId = user.partnerId 
      ? [user.id, user.partnerId].sort().join('-')
      : user.id;

    if (entry.coupleId !== coupleId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    return NextResponse.json({
      data: transformedEntry,
      success: true
    });

  } catch (error) {
    console.error('Error fetching diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diary entry' },
      { status: 500 }
    );
  }
}

// PUT /api/diary/entries/[id] - Update a diary entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await prisma.diaryEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if user is the author of this entry
    if (entry.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { mood, content, media } = body;

    // Validation
    if (mood && typeof mood !== 'string') {
      return NextResponse.json(
        { error: 'Invalid mood format' },
        { status: 400 }
      );
    }

    if (content && (typeof content !== 'string' || content.length > 2000)) {
      return NextResponse.json(
        { error: 'Content must be a string with max 2000 characters' },
        { status: 400 }
      );
    }

    // Update the entry
    const updatedEntry = await prisma.diaryEntry.update({
      where: { id },
      data: {
        ...(mood && { mood }),
        ...(content && { content: content.trim() }),
        ...(media && { media }),
        updatedAt: new Date()
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
      id: updatedEntry.id,
      authorId: updatedEntry.authorId,
      coupleId: updatedEntry.coupleId,
      mood: updatedEntry.mood,
      content: updatedEntry.content,
      media: Array.isArray(updatedEntry.media) ? updatedEntry.media as unknown as MediaItem[] : [],
      date: updatedEntry.date,
      status: updatedEntry.status as 'waiting' | 'replied',
      isEncrypted: updatedEntry.isEncrypted,
      createdAt: updatedEntry.createdAt,
      updatedAt: updatedEntry.updatedAt
    };

    return NextResponse.json({
      data: transformedEntry,
      success: true,
      message: 'Diary entry updated successfully'
    });

  } catch (error) {
    console.error('Error updating diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to update diary entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/diary/entries/[id] - Delete a diary entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await prisma.diaryEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if user is the author of this entry
    if (entry.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the entry
    await prisma.diaryEntry.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Diary entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete diary entry' },
      { status: 500 }
    );
  }
}