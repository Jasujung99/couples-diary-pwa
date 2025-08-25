import type { NextApiRequest, NextApiResponse } from 'next';

type MetricPayload = {
  name: string; // e.g., 'CLS','FID','LCP','TTFB','FCP','INP'
  value: number;
  id?: string;
  label?: string;
  page?: string;
  at?: string;
  meta?: Record<string, unknown>;
};

// MVP: 서버 콘솔 기록. 실제 운영 시 APM/로그 수집기로 전송 가능.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const metric = req.body as MetricPayload;
    const ua = req.headers['user-agent'] || 'unknown';

    console.log('[WebVitals]', {
      ...metric,
      ua,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[WebVitals][Failure]', e);
    return res.status(200).json({ ok: true });
  }
}
