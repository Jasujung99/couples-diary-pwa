import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user?.partnerId) {
      return NextResponse.json({ error: 'No partner found' }, { status: 400 });
    }

    // Create coupleId from sorted user IDs for consistency
    const coupleId = [user.id, user.partnerId].sort().join('-');

    const memories = await prisma.memory.findMany({
      where: { coupleId },
      orderBy: { date: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ data: memories, success: true });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.partnerId) {
      return NextResponse.json({ error: 'No partner found' }, { status: 400 });
    }

    const body = await request.json();
    const { title, location, date, photos, tags, color } = body;

    // Validate required fields
    if (!title || !location || !date) {
      return NextResponse.json(
        { error: 'Title, location, and date are required' },
        { status: 400 }
      );
    }

    // Create coupleId from sorted user IDs for consistency
    const coupleId = [user.id, user.partnerId].sort().join('-');

    const memory = await prisma.memory.create({
      data: {
        coupleId,
        title,
        location,
        date: new Date(date),
        photos: photos || [],
        tags: tags || [],
        color: color || '#E2E0F4', // Default to lilac
        createdBy: user.id
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ data: memory, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}