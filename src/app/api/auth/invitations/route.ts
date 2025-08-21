import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all invitations sent by the current user
    const sentInvitations = await prisma.partnerInvitation.findMany({
      where: {
        inviterId: session.user.id,
      },
      select: {
        id: true,
        inviteeEmail: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all invitations received by the current user
    const receivedInvitations = await prisma.partnerInvitation.findMany({
      where: {
        inviteeEmail: session.user.email,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      invitations: sentInvitations,
      receivedInvitations: receivedInvitations.map(inv => ({
        id: inv.id,
        inviterName: inv.inviter.name,
        inviterEmail: inv.inviter.email,
        inviterAvatar: inv.inviter.avatar,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        token: inv.token, // Include token for acceptance
      })),
    });

  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}