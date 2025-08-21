import type { NextApiRequest, NextApiResponse } from 'next';

export function createMockReqRes(
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' = 'GET',
  {
    body,
    query,
    headers,
  }: { body?: any; query?: Record<string, any>; headers?: Record<string, string> } = {}
): { req: Partial<NextApiRequest>; res: NextApiResponse & { _status?: number; _json?: any } } {
  const res: any = {
    _status: 200,
    _json: undefined,
    _headers: {} as Record<string, string>,
    status(code: number) {
      this._status = code;
      return this;
    },
    setHeader(key: string, value: string) {
      this._headers[key] = value;
    },
    json(data: any) {
      this._json = data;
      return this;
    },
    end(msg?: any) {
      this._json = msg;
      return this;
    },
  };

  const req: any = {
    method,
    body,
    query: query || {},
    headers: headers || {},
  };

  return { req, res };
}
