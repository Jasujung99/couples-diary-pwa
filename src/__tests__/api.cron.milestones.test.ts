import handler from '@/pages/api/cron/milestones';
import { createMockReqRes } from './testUtils';

describe('API /api/cron/milestones', () => {
  it('GET 호출 시 200', async () => {
    const { req, res } = createMockReqRes('GET');
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
  });

  it('POST 호출 시 200', async () => {
    const { req, res } = createMockReqRes('POST', { body: { title: '마일스톤', body: '임박 알림', url: '/memories' } });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
  });
});
