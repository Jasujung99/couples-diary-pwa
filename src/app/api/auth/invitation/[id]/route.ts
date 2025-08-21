import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid invitation ID is required" },
        { status: 400 }
      );
    }

    // Find the invitation and verify ownership
    const invitation = await prisma.partnerInvitation.findUnique({
      where: { id },
      select: {
        id: true,
        inviterId: true,
        status: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the inviter
    if (invitation.inviterId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own invitations" },
        { status: 403 }
      );
    }

    // Check if invitation can be cancelled (only pending invitations)
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: "Only pending invitations can be cancelled" },
        { status: 400 }
      );
    }

    // Delete the invitation
    await prisma.partnerInvitation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Invitation cancelled successfully",
    });

  } catch (error) {
    console.error("Cancel invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid invitation ID is required" },
        { status: 400 }
      );
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (accepted or rejected)" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.partnerInvitation.findUnique({
      where: { id },
      include: {
        inviter: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the invitee
    if (invitation.inviteeEmail !== session.user.email) {
      return NextResponse.json(
        { error: "You can only respond to invitations sent to you" },
        { status: 403 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: "This invitation has already been processed" },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    if (status === 'rejected') {
      // Simply update the status to rejected
      await prisma.partnerInvitation.update({
        where: { id },
        data: { status: 'rejected' },
      });

      return NextResponse.json({
        message: "Invitation rejected successfully",
      });
    }

    // For acceptance, use the existing accept-invitation endpoint logic
    // This is handled by the accept-invitation route
    return NextResponse.json(
      { error: "Use the accept-invitation endpoint for accepting invitations" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Update invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}