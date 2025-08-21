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

    const { coupleId, reason, allowDataRecovery, recoveryPeriodDays } = await request.json();

    // Verify user is part of the couple
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partner: true }
    });

    if (!user || user.partnerId !== coupleId.replace('couple_', '')) {
      return NextResponse.json({ error: 'Not authorized for this couple' }, { status: 403 });
    }

    // Update couple status
    const breakupRecord = await prisma.breakup.create({
      data: {
        coupleId,
        initiatedBy: session.user.id,
        reason,
        allowDataRecovery,
        recoveryExpiresAt: allowDataRecovery 
          ? new Date(Date.now() + recoveryPeriodDays * 24 * 60 * 60 * 1000)
          : null,
        status: 'active',
      }
    });

    // Update user partnership status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { partnerId: null }
    });

    if (user.partner) {
      await prisma.user.update({
        where: { id: user.partner.id },
        data: { partnerId: null }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        breakupId: breakupRecord.id,
        canRecover: allowDataRecovery,
        recoveryExpiresAt: breakupRecord.recoveryExpiresAt,
      }
    });
  } catch (error) {
    console.error('Breakup mode activation error:', error);
    return NextResponse.json(
      { error: 'Failed to activate breakup mode' },
      { status: 500 }
    );
  }
}