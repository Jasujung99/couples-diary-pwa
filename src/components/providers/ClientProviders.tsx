'use client';

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { SessionProvider } from "next-auth/react";
import { OfflineIndicator, OfflineToast } from "@/components/offline/OfflineIndicator";
import { OfflineProvider } from "@/components/offline/OfflineProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <OfflineProvider>
              <OfflineIndicator />
              {children}
              <OfflineToast />
            </OfflineProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
