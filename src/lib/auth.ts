import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Prisma 인스턴스 확인 로직
const checkPrismaInstance = () => {
  if (!prisma || !prisma.user || !prisma.account) {
    console.error('Prisma instance or required models not available!');
    console.error('prisma available:', !!prisma);
    if (prisma) {
      console.error('prisma.user available:', !!prisma.user);
      console.error('prisma.account available:', !!prisma.account);
      console.error('prisma.session available:', !!prisma.session);
      console.error('prisma.verificationToken available:', !!prisma.verificationToken);
    }
    throw new Error('Prisma instance not properly initialized');
  }
  return true;
};

// 개발 환경에서 한 번 체크
if (process.env.NODE_ENV === 'development') {
  try {
    checkPrismaInstance();
    console.log('Prisma adapter check passed');
  } catch (error) {
    console.error('Prisma adapter check failed:', error);
  }
}

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

// PrismaAdapter 인스턴스 생성 (prisma가 확실히 존재할 때만)
const getAdapter = () => {
  try {
    checkPrismaInstance();
    return PrismaAdapter(prisma);
  } catch (error) {
    console.error('Failed to create PrismaAdapter:', error);
    return undefined; // 실패 시 undefined 반환 (JWT만 사용하는 방식으로 폴백)
  }
};

export const authOptions = {
    // adapter: getAdapter() as any, // 개발 중에는 어댑터 사용 비활성화
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account", // 강제로 계정 선택 화면 표시
          access_type: "offline", // 리프레시 토큰 요청 (필요한 경우)
        },
      },
    }),
    KakaoProvider as any,
  ],
  debug: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버그 모드 활성화
  callbacks: {
    async signIn({ user, account }: { user: any; account: any; profile?: any }) {
      if (!account || !user.email) return false;

      try {
        // 디버깅 로깅
        if (process.env.NODE_ENV === 'development') {
          console.log('Sign-in callback - checking prisma availability');
          console.log('prisma.user exists:', !!prisma.user);
          console.log('prisma.account exists:', !!prisma.account);
        }

        // Prisma 사용 가능 상태 확인
        if (!prisma || !prisma.user) {
          console.warn('Prisma/DB unavailable, skipping user operations but allowing sign-in');
          return true; // DB 문제가 있어도 인증은 허용
        }

        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
              // Create new user - 최소 필수 필드만 포함하여 성공 확률 높임
              await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || "사용자",  // name 필드가 null 허용하지 않으므로 기본값 설정
                  provider: account.provider as "google" | "kakao",
                  providerId: account.providerAccountId || account.id || "unknown",
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
        } catch (dbError) {
          // DB 오류는 로깅하되 인증은 계속 진행
          console.error("DB operation failed during sign in:", dbError);
        }

        return true; // 항상 인증 성공 처리
      } catch (error) {
        console.error("Critical error during sign in:", error);
        // 치명적인 오류가 아니라면 인증은 계속 진행
        return true;
      }
    },
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      // 디버깅을 위한 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('JWT callback - token:', JSON.stringify(token));
        console.log('JWT callback - user:', user ? JSON.stringify(user) : 'undefined');
        console.log('JWT callback - account:', account ? JSON.stringify(account) : 'undefined');
      }

      if (account && user) {
        // Fetch the full user data from our database
        try {
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
          } else {
            console.error(`User not found in database for email: ${user.email}`);
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // 디버깅을 위한 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('Session callback - session:', JSON.stringify(session));
        console.log('Session callback - token:', JSON.stringify(token));
      }
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