import { logClientError } from '@/utils/logError';

describe('logClientError', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.clearAllMocks();
  });

  it('POST /api/log/error 로 에러 페이로드를 전송한다', async () => {
    await logClientError({ message: 'oops', stack: 'trace' });

    expect(global.fetch).toHaveBeenCalledWith('/api/log/error', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.message).toBe('oops');
    expect(body.stack).toBe('trace');
    expect(typeof body.at).toBe('string');
  });
});
