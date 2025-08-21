import handler from '@/pages/api/cron/date-reminders';
import { createMockReqRes } from './testUtils';

describe('API /api/cron/date-reminders', () => {
  it('GET 호출 시 200', async () => {
    const { req, res } = createMockReqRes('GET');
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
  });

  it('POST 호출 시 200', async () => {
    const { req, res } = createMockReqRes('POST', { body: { title: '테스트 알림', body: '본문', url: '/calendar' } });
    // @ts-ignore
    await handler(req, res);
    expect(res._status).toBe(200);
  });
});
