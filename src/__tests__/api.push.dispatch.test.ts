import handler from '@/pages/api/push/dispatch';
import { createMockReqRes } from './testUtils';

describe('API /api/push/dispatch', () => {
  it('title 없이 요청하면 400', async () => {
    const { req, res } = createMockReqRes('POST', { body: {} });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('정상 요청 시 200', async () => {
    const { req, res } = createMockReqRes('POST', { body: { title: 'Hello', body: 'World', url: '/' } });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ ok: true });
  });
});
