import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      coupleId, 
      includeMedia, 
      encryptExport, 
      dateRange, 
      includePartnerData 
    } = await request.json();

    // Verify user access to couple data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get diary entries
    const diaryEntries = await prisma.diaryEntry.findMany({
      where: {
        coupleId,
        ...(dateRange && {
          date: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          }
        }),
        ...(includePartnerData ? {} : { authorId: session.user.id }),
      },
      include: {
        media: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Get date plans
    const datePlans = await prisma.datePlan.findMany({
      where: { coupleId },
      include: {
        checklist: true,
        creator: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    // Get memories
    const memories = await prisma.memory.findMany({
      where: { coupleId },
      include: {
        photos: true,
        creator: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate statistics
    const daysTogether = user.relationshipStartDate 
      ? Math.floor((new Date().getTime() - user.relationshipStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.id,
        coupleId,
        version: '1.0',
        isEncrypted: encryptExport,
      },
      userData: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          relationshipStartDate: user.relationshipStartDate,
          preferences: user.preferences,
        },
        partner: includePartnerData && user.partner ? {
          id: user.partner.id,
          name: user.partner.name,
          email: user.partner.email,
          relationshipStartDate: user.partner.relationshipStartDate,
          preferences: user.partner.preferences,
        } : undefined,
      },
      diaryEntries: diaryEntries.map(entry => ({
        ...entry,
        media: includeMedia ? entry.media : entry.media.map(m => ({ ...m, url: '[MEDIA_REMOVED]' })),
      })),
      datePlans,
      memories: memories.map(memory => ({
        ...memory,
        photos: includeMedia ? memory.photos : memory.photos.map(p => ({ ...p, url: '[MEDIA_REMOVED]' })),
      })),
      statistics: {
        totalEntries: diaryEntries.length,
        totalDates: datePlans.length,
        totalMemories: memories.length,
        daysTogether,
        firstEntry: diaryEntries[0]?.date,
        lastEntry: diaryEntries[diaryEntries.length - 1]?.date,
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}