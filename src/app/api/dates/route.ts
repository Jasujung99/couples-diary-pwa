import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dates - Get all date plans for the couple
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user?.partnerId) {
      return NextResponse.json(
        { error: 'No partner found' },
        { status: 400 }
      );
    }

    // Generate coupleId (consistent regardless of who queries)
    const coupleId = [user.id, user.partnerId].sort().join('-');

    const datePlans = await prisma.datePlan.findMany({
      where: { coupleId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json({ data: datePlans });
  } catch (error) {
    console.error('Error fetching date plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dates - Create a new date plan
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, scheduledAt, location, notes, budget, checklist } = body;

    // Validate required fields
    if (!title || !scheduledAt || !location) {
      return NextResponse.json(
        { error: 'Title, scheduled date, and location are required' },
        { status: 400 }
      );
    }

    // Generate coupleId (consistent regardless of who creates)
    const coupleId = [user.id, user.partnerId].sort().join('-');

    const datePlan = await prisma.datePlan.create({
      data: {
        coupleId,
        title,
        scheduledAt: new Date(scheduledAt),
        location,
        notes: notes || null,
        budget: budget || 0,
        checklist: checklist || [],
        createdBy: user.id,
        status: 'planned'
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

    return NextResponse.json({ data: datePlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating date plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}