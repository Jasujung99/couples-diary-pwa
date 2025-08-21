import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Kakao Provider Configuration
const KakaoProvider = {
  id: "kakao",
  name: "Kakao",
  type: "oauth" as const,
  authorization: {
    url: "https://kauth.kakao.com/oauth/authorize",
    params: {
      scope: "profile_nickname profile_image account_email",
      response_type: "code",
    },
  },
  token: "https://kauth.kakao.com/oauth/token",
  userinfo: "https://kapi.kakao.com/v2/user/me",
  clientId: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  profile(profile: Record<string, unknown>) {
    return {
      id: String(profile.id),
      name: (profile as any).kakao_account?.profile?.nickname || (profile as any).properties?.nickname,
      email: (profile as any).kakao_account?.email,
      image: (profile as any).kakao_account?.profile?.profile_image_url || (profile as any).properties?.profile_image,
    };
  },
};

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    KakaoProvider as any,
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any; profile?: any }) {
      if (!account || !user.email) return false;

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create new user
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              avatar: user.image,
              provider: account.provider as "google" | "kakao",
              providerId: account.providerAccountId,
              theme: "light",
              notifications: true,
              language: "ko",
            },
          });
        } else {
          // Update existing user's avatar if needed
          if (user.image && existingUser.avatar !== user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: user.image },
            });
          }
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (account && user) {
        // Fetch the full user data from our database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            partner: true,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.hasPartner = !!dbUser.partnerId;
          token.partner = dbUser.partner;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.userId) {
        // Fetch fresh user data for each session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: {
            partner: true,
          },
        });

        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            provider: dbUser.provider as "google" | "kakao",
            providerId: dbUser.providerId,
            partnerId: dbUser.partnerId || undefined,
            relationshipStartDate: dbUser.relationshipStartDate || undefined,
            preferences: {
              theme: dbUser.theme as "light" | "dark",
              notifications: dbUser.notifications,
              language: dbUser.language,
            },
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
          session.partner = dbUser.partner ? {
            ...dbUser.partner,
            avatar: dbUser.partner.avatar || undefined,
            partnerId: dbUser.partner.partnerId || undefined,
            relationshipStartDate: dbUser.partner.relationshipStartDate || undefined,
          } : undefined;
          session.hasPartner = !!dbUser.partnerId;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

// JWT utility functions
export const generateJWT = (payload: object, expiresIn: string = "30d") => {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, { expiresIn } as jwt.SignOptions);
};

export const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
  } catch {
    return null;
  }
};
// Export configuration for NextAuth
// Note: The actual NextAuth handler will be created in the API route