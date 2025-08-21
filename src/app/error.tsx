'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

async function report(error: Error & { digest?: string }) {
  try {
    await fetch('/api/log/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        at: new Date().toISOString(),
      }),
    });
  } catch {
    // no-op
  }
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 보고
    report(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error?.message]);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-black/5 bg-white/70 dark:bg-black/20 backdrop-blur px-5 py-6 shadow-sm">
        <h2 className="text-lg font-semibold">문제가 발생했어요</h2>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2 text-sm"
          >
            홈으로
          </Link>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <details className="mt-4 text-xs opacity-70 whitespace-pre-wrap">
            <summary>디버그 정보</summary>
            <div className="mt-2">{error?.message}</div>
            <pre className="mt-2 overflow-auto">{error?.stack}</pre>
            {error?.digest && <div className="mt-2">digest: {error.digest}</div>}
          </details>
        )}
      </div>
    </div>
  );
}
