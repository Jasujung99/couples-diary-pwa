import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 개발 환경에서 환경변수 확인 및 Prisma 연결 테스트
if (process.env.NODE_ENV === 'development') {
  // 중요한 환경변수들이 설정되어 있는지 확인
  const requiredEnvVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  } else {
    console.log('All required environment variables are set');
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  }

  // Prisma 상태 확인
  console.log('Prisma initialized:', Boolean(prisma));

  // Prisma 모델 확인 (Account 모델 존재 확인)
  if (prisma) {
    console.log('Checking Prisma Account model:', Boolean(prisma.account));
  }
}

// NextAuth 핸들러 설정
const handler = NextAuth({
  ...authOptions,
  // 세션 쿠키 설정 추가
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  },
  debug: process.env.NODE_ENV === 'development',
});

export default handler;