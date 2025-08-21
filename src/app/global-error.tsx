'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 전역 레벨의 치명적 에러 처리
  return (
    <html>
      <body>
        <div className="min-h-screen w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-black/5 bg-white/70 dark:bg-black/20 backdrop-blur px-5 py-6 shadow-sm">
            <h2 className="text-lg font-semibold">앱에 문제가 발생했어요</h2>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>
            <div className="mt-4">
              <button
                onClick={() => reset()}
                className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
              >
                새로고침
              </button>
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
      </body>
    </html>
  );
}
