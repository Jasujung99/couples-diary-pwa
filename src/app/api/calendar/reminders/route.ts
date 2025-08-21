import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ReminderRequest {
  eventId: string;
  eventType: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  body: string;
  scheduledTime: string;
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ReminderRequest = await request.json();
    const { eventId, eventType, title, body: notificationBody, scheduledTime, data } = body;

    // Validate required fields
    if (!eventId || !eventType || !title || !notificationBody || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    
    // Don't schedule reminders for past times
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule reminders for past times' },
        { status: 400 }
      );
    }

    // Create reminder in database
    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        eventId,
        eventType,
        title,
        body: notificationBody,
        scheduledTime: scheduledDate,
        data: data || {},
        status: 'scheduled'
      }
    });

    // In a real implementation, you would integrate with a push notification service
    // For now, we'll just store it in the database
    console.log('Reminder scheduled:', {
      id: reminder.id,
      eventId,
      scheduledTime: scheduledDate,
      title
    });

    return NextResponse.json({
      data: reminder,
      success: true,
      message: 'Reminder scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status') || 'scheduled';

    let whereClause: any = {
      userId: session.user.id,
      status
    };

    if (eventId) {
      whereClause.eventId = eventId;
    }

    const reminders = await prisma.reminder.findMany({
      where: whereClause,
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    return NextResponse.json({
      data: reminders,
      success: true
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const reminderId = searchParams.get('reminderId');

    if (!eventId && !reminderId) {
      return NextResponse.json(
        { error: 'Either eventId or reminderId is required' },
        { status: 400 }
      );
    }

    let whereClause: any = {
      userId: session.user.id
    };

    if (reminderId) {
      whereClause.id = reminderId;
    } else if (eventId) {
      whereClause.eventId = eventId;
    }

    // Update reminder status to cancelled instead of deleting
    const updatedReminders = await prisma.reminder.updateMany({
      where: whereClause,
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      data: { count: updatedReminders.count },
      success: true,
      message: 'Reminder(s) cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}