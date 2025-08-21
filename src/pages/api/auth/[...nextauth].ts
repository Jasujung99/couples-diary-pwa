import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 디버깅용 콘솔 로그 추가
console.log("NextAuth API 라우트 초기화됨");
console.log("환경변수 확인(실제 값은 로그되지 않음):");
console.log("GOOGLE_CLIENT_ID 존재:", !!process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET 존재:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("NEXTAUTH_URL 존재:", !!process.env.NEXTAUTH_URL);
console.log("NEXTAUTH_SECRET 존재:", !!process.env.NEXTAUTH_SECRET);

export default NextAuth(authOptions);