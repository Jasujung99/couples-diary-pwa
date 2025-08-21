export type ClientErrorPayload = {
  message: string;
  stack?: string;
  digest?: string;
  meta?: Record<string, unknown>;
};

export async function logClientError(payload: ClientErrorPayload) {
  try {
    await fetch('/api/log/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, at: new Date().toISOString() }),
      keepalive: true,
    });
  } catch {
    // swallow
  }
}
