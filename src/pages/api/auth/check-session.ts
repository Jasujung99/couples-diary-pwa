import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 서버 세션 확인
    const session = await getServerSession(req, res, authOptions);

    // 쿠키 정보 수집 (민감 정보 제외)
    const cookies = req.cookies;
    const sanitizedCookies = Object.keys(cookies).reduce((acc, key) => {
      // 쿠키 이름만 포함, 값은 마스킹
      acc[key] = key.includes('csrf') ? '[MASKED]' : '[PRESENT]';
      return acc;
    }, {} as Record<string, string>);

    // 응답
    res.status(200).json({
      authenticated: !!session,
      sessionExists: !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
      } : null,
      cookies: sanitizedCookies,
      cookieCount: Object.keys(cookies).length,
    });
  } catch (error) {
    console.error('세션 확인 중 오류:', error);
    res.status(500).json({ error: '세션 확인 중 오류가 발생했습니다.' });
  }
}
