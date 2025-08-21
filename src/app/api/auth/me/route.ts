import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch complete user data with partner information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            provider: true,
            relationshipStartDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      providerId: user.providerId,
      partnerId: user.partnerId,
      relationshipStartDate: user.relationshipStartDate,
      preferences: {
        theme: user.theme,
        notifications: user.notifications,
        language: user.language,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      user: userData,
      partner: user.partner,
      hasPartner: !!user.partnerId,
    });

  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, theme, notifications, language } = await request.json();

    // Validate input
    const updates: Record<string, unknown> = {};
    if (name && typeof name === "string") updates.name = name;
    if (theme && ["light", "dark"].includes(theme)) updates.theme = theme;
    if (typeof notifications === "boolean") updates.notifications = notifications;
    if (language && typeof language === "string") updates.language = language;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            provider: true,
            relationshipStartDate: true,
            createdAt: true,
          },
        },
      },
    });

    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      provider: updatedUser.provider,
      providerId: updatedUser.providerId,
      partnerId: updatedUser.partnerId,
      relationshipStartDate: updatedUser.relationshipStartDate,
      preferences: {
        theme: updatedUser.theme,
        notifications: updatedUser.notifications,
        language: updatedUser.language,
      },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      message: "Profile updated successfully",
      user: userData,
      partner: updatedUser.partner,
      hasPartner: !!updatedUser.partnerId,
    });

  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}