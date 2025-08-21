import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Valid token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.partnerInvitation.findUnique({
      where: { token },
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
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Return invitation details (without sensitive information)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        inviterName: invitation.inviter.name,
        inviterEmail: invitation.inviter.email,
        inviterAvatar: invitation.inviter.avatar,
        inviteeEmail: invitation.inviteeEmail,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    });

  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}