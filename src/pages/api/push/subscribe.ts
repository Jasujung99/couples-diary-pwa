import type { NextApiRequest, NextApiResponse } from 'next';

type Subscription = {
  endpoint: string;
  keys?: { p256dh: string; auth: string };
  expirationTime?: number | null;
};

// In-memory subscription registry for MVP
const registry = new Map<string, Subscription>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const sub = req.body as Subscription;
    if (!sub || !sub.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    registry.set(sub.endpoint, sub);
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const endpoint = (req.query.endpoint as string) || '';
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }
    registry.delete(endpoint);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ count: registry.size });
  }

  res.setHeader('Allow', 'POST,DELETE,GET');
  return res.status(405).end('Method Not Allowed');
}
