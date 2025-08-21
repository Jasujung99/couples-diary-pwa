import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// import { ChecklistItem } from '@/types';

// PUT /api/dates/[id]/checklist - Update checklist for a date plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.partnerId) {
      return NextResponse.json(
        { error: 'No partner found' },
        { status: 400 }
      );
    }

    const coupleId = [user.id, user.partnerId].sort().join('-');
    const { id } = await params;

    // Check if date plan exists and belongs to the couple
    const existingDatePlan = await prisma.datePlan.findFirst({
      where: { 
        id,
        coupleId 
      }
    });

    if (!existingDatePlan) {
      return NextResponse.json(
        { error: 'Date plan not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { checklist } = body;

    if (!Array.isArray(checklist)) {
      return NextResponse.json(
        { error: 'Checklist must be an array' },
        { status: 400 }
      );
    }

    // Validate checklist items
    const validatedChecklist = checklist.map((item: Record<string, unknown>) => ({
      id: (item.id as string) || crypto.randomUUID(),
      text: item.text as string,
      completed: Boolean(item.completed),
      assignedTo: (item.assignedTo as string) || null,
      completedAt: item.completed && !item.completedAt ? new Date().toISOString() : (item.completedAt as string)
    }));

    const datePlan = await prisma.datePlan.update({
      where: { id },
      data: {
        checklist: validatedChecklist
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ data: datePlan });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}