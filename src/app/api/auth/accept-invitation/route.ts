import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await request.json();

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
        inviter: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if invitation is already accepted or rejected
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation has already been processed" },
        { status: 400 }
      );
    }

    // Check if the current user's email matches the invitation
    if (invitation.inviteeEmail !== session.user?.email) {
      return NextResponse.json(
        { error: "This invitation is not for your email address" },
        { status: 400 }
      );
    }

    // Check if either user already has a partner
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { partnerId: true },
    });

    const inviterUser = await prisma.user.findUnique({
      where: { id: invitation.inviterId },
      select: { partnerId: true },
    });

    if (currentUser?.partnerId || inviterUser?.partnerId) {
      return NextResponse.json(
        { error: "One of the users already has a partner" },
        { status: 400 }
      );
    }

    // Start transaction to connect partners
    const result = await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.partnerInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      // Connect the partners
      const updatedInviter = await tx.user.update({
        where: { id: invitation.inviterId },
        data: { 
          partnerId: session.user.id,
          relationshipStartDate: new Date(),
        },
      });

      const updatedInvitee = await tx.user.update({
        where: { id: session.user.id },
        data: { 
          partnerId: invitation.inviterId,
          relationshipStartDate: new Date(),
        },
      });

      return { inviter: updatedInviter, invitee: updatedInvitee };
    });

    return NextResponse.json({
      message: "Partner invitation accepted successfully",
      partner: {
        id: result.inviter.id,
        name: result.inviter.name,
        email: result.inviter.email,
        avatar: result.inviter.avatar,
      },
      relationshipStartDate: result.invitee.relationshipStartDate,
    });

  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}