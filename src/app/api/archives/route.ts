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

    const archiveData = await request.json();

    // Create archive record
    const archive = await prisma.breakupArchive.create({
      data: {
        id: archiveData.id,
        userId: session.user.id,
        coupleId: archiveData.coupleId,
        reason: archiveData.reason,
        recoveryExpiresAt: new Date(archiveData.recoveryExpiresAt),
        isRecoverable: archiveData.isRecoverable,
        encryptedData: archiveData.archiveData.encryptedData,
        checksum: archiveData.archiveData.checksum,
        keyHint: archiveData.archiveData.keyHint,
      }
    });

    return NextResponse.json({
      success: true,
      data: { archiveId: archive.id }
    });
  } catch (error) {
    console.error('Archive creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const archives = await prisma.breakupArchive.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        coupleId: true,
        archivedAt: true,
        reason: true,
        recoveryExpiresAt: true,
        isRecoverable: true,
        keyHint: true,
      },
      orderBy: { archivedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: archives
    });
  } catch (error) {
    console.error('Get archives error:', error);
    return NextResponse.json(
      { error: 'Failed to get archives' },
      { status: 500 }
    );
  }
}