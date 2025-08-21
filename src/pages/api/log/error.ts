import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const {
      message,
      stack,
      digest,
      at,
      meta,
    } = req.body || {};

    const ua = req.headers['user-agent'] || 'unknown';

    // MVP: 서버 콘솔에 기록
    // 실제 환경에서는 외부 로깅 서비스(Sentry 등) 또는 DB로 전송
    console.error('[ClientError]', {
      message,
      digest,
      at,
      ua,
      meta,
      stack,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[ClientError][Failure]', e);
    return res.status(200).json({ ok: true });
  }
}
