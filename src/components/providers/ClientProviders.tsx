'use client';

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { SessionProvider } from "next-auth/react";
import { OfflineProvider } from "@/components/offline/OfflineProvider";

// 오프라인 인디케이터는 SSR에서 제외
const DynamicOfflineIndicator = dynamic(
  () => import("@/components/offline/OfflineIndicator").then(m => m.OfflineIndicator),
  { ssr: false }
);
const DynamicOfflineToast = dynamic(
  () => import("@/components/offline/OfflineIndicator").then(m => m.OfflineToast),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // 클라이언트 마운트 이후에만 오프라인 UI 렌더링
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <OfflineProvider>
              {mounted && <DynamicOfflineIndicator />}
              {children}
              {mounted && <DynamicOfflineToast />}
            </OfflineProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
