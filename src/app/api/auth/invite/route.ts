import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// import { generateJWT } from "@/lib/auth"; // TODO: Use for email tokens
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if user already has a partner
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { partnerId: true, email: true },
    });

    if (currentUser?.partnerId) {
      return NextResponse.json(
        { error: "You already have a partner" },
        { status: 400 }
      );
    }

    // Check if trying to invite themselves
    if (currentUser?.email === email) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if the invitee already has a partner
    const inviteeUser = await prisma.user.findUnique({
      where: { email },
      select: { partnerId: true },
    });

    if (inviteeUser?.partnerId) {
      return NextResponse.json(
        { error: "This user already has a partner" },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.partnerInvitation.findFirst({
      where: {
        inviterId: session.user.id,
        inviteeEmail: email,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const invitation = await prisma.partnerInvitation.create({
      data: {
        inviterId: session.user.id,
        inviteeEmail: email,
        token,
        expiresAt,
        status: "pending",
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email notification (implement email service)
    // For now, we'll just return the invitation details
    
    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        inviteeEmail: invitation.inviteeEmail,
        expiresAt: invitation.expiresAt,
        inviterName: invitation.inviter.name,
      },
    });

  } catch (error) {
    console.error("Invite partner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}