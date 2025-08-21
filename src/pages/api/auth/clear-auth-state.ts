import { NextApiRequest, NextApiResponse } from 'next';

/**
 * 인증 상태 초기화 API
 * NextAuth 관련 쿠키를 삭제하여 인증 상태를 완전히 초기화합니다.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // NextAuth 쿠키 목록
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
  ];

  // 모든 NextAuth 쿠키 삭제
  cookiesToClear.forEach(name => {
    res.setHeader('Set-Cookie', [
      `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `${name}=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax`,
    ]);
  });

  // 응답
  res.status(200).json({ success: true, message: '인증 상태가 초기화되었습니다.' });
}
