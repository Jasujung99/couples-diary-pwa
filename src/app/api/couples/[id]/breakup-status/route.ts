import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupleId = params.id;

    // Get breakup status
    const breakup = await prisma.breakup.findFirst({
      where: {
        coupleId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!breakup) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          canRecover: false,
        }
      });
    }

    const canRecover = breakup.allowDataRecovery && 
      breakup.recoveryExpiresAt && 
      new Date() < breakup.recoveryExpiresAt;

    return NextResponse.json({
      success: true,
      data: {
        isActive: true,
        activatedAt: breakup.createdAt,
        activatedBy: breakup.initiatedBy,
        reason: breakup.reason,
        canRecover,
        recoveryExpiresAt: breakup.recoveryExpiresAt,
        archiveId: breakup.archiveId,
      }
    });
  } catch (error) {
    console.error('Get breakup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get breakup status' },
      { status: 500 }
    );
  }
}