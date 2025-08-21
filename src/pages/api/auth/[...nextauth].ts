import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 개발 환경에서만 환경변수 확인 (조용히)
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === "true") {
  // 필요한 경우 서버 로그로만 확인
}

export default NextAuth(authOptions);