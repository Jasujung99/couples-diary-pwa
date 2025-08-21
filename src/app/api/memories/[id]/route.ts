import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Create coupleId from sorted user IDs for consistency
    const coupleId = [user.id, user.partnerId].sort().join('-');

    // Check if memory exists and belongs to the couple
    const existingMemory = await prisma.memory.findFirst({
      where: {
        id: params.id,
        coupleId
      }
    });

    if (!existingMemory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    const memory = await prisma.memory.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(location && { location }),
        ...(date && { date: new Date(date) }),
        ...(photos && { photos }),
        ...(tags && { tags }),
        ...(color && { color })
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ data: memory, success: true });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Create coupleId from sorted user IDs for consistency
    const coupleId = [user.id, user.partnerId].sort().join('-');

    // Check if memory exists and belongs to the couple
    const existingMemory = await prisma.memory.findFirst({
      where: {
        id: params.id,
        coupleId
      }
    });

    if (!existingMemory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    await prisma.memory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}