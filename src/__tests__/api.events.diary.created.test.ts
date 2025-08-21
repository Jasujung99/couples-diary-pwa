import handler from '@/pages/api/events/diary/created';
import { createMockReqRes } from './testUtils';

describe('API /api/events/diary/created', () => {
  it('POST 시 200 반환', async () => {
    const { req, res } = createMockReqRes('POST', {
      body: { authorName: '민지', dateISO: new Date().toISOString(), preview: '오늘의 한 줄', url: '/diary' },
    });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ ok: true });
  });

  it('POST 이외 메서드는 405', async () => {
    const { req, res } = createMockReqRes('GET');
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(405);
  });
});
