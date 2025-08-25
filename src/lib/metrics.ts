// 간단한 성능/사용자 정의 지표를 서버로 전송
export function sendClientMetric(name: string, value: number, meta?: Record<string, unknown>) {
  try {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name,
        value,
        at: new Date().toISOString(),
        page: typeof location !== 'undefined' ? location.pathname : undefined,
        meta,
      }),
    });
  } catch {
    // swallow
  }
}
