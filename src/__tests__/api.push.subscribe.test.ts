import handler from '@/pages/api/push/subscribe';
import { createMockReqRes } from './testUtils';

describe('API /api/push/subscribe', () => {
  it('POST 구독 등록 성공', async () => {
    const { req, res } = createMockReqRes('POST', { body: { endpoint: 'https://e/1' } });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(201);
    expect(res._json).toEqual({ ok: true });
  });

  it('GET 구독 카운트 조회', async () => {
    const { req, res } = createMockReqRes('GET');
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveProperty('count');
    expect(typeof res._json.count).toBe('number');
  });

  it('DELETE 구독 해제 성공', async () => {
    const post = createMockReqRes('POST', { body: { endpoint: 'https://e/2' } });
    // @ts-ignore
    await handler(post.req, post.res);
    const del = createMockReqRes('DELETE', { query: { endpoint: 'https://e/2' } });
    // @ts-ignore
    await handler(del.req, del.res);
    expect(del.res._status).toBe(200);
    expect(del.res._json).toEqual({ ok: true });
  });
});
