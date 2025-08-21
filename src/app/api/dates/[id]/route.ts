import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dates/[id] - Get a specific date plan
export async function GET(
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

    const datePlan = await prisma.datePlan.findFirst({
      where: { 
        id,
        coupleId 
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

    if (!datePlan) {
      return NextResponse.json(
        { error: 'Date plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: datePlan });
  } catch (error) {
    console.error('Error fetching date plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/dates/[id] - Update a date plan
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
    const { title, scheduledAt, location, notes, budget, checklist, status } = body;

    const datePlan = await prisma.datePlan.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(location && { location }),
        ...(notes !== undefined && { notes }),
        ...(budget !== undefined && { budget }),
        ...(checklist && { checklist }),
        ...(status && { status })
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
    console.error('Error updating date plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/dates/[id] - Delete a date plan
export async function DELETE(
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

    await prisma.datePlan.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Date plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting date plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}