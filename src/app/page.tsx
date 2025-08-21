'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthFlow } from "@/components/auth/AuthFlow";

const ThemeDemo = dynamic(() => import('@/components/ThemeDemo').then(mod => ({ default: mod.ThemeDemo })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-foreground">Loading...</div>
  </div>
});

export default function Home() {
  const { authState } = useAuth();
  const router = useRouter();

  // Redirect authenticated users with partners to the main app
  useEffect(() => {
    if (authState.isAuthenticated && authState.hasPartner && !authState.isLoading) {
      router.push('/app');
    }
  }, [authState.isAuthenticated, authState.hasPartner, authState.isLoading, router]);

  // Show authentication flow if not authenticated
  if (!authState.isAuthenticated && !authState.isLoading) {
    return <AuthFlow onAuthSuccess={() => router.refresh()} />;
  }

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-ink/70">로딩 중...</div>
        </div>
      </div>
    );
  }

  // If authenticated but no partner, show partner invitation flow
  if (authState.isAuthenticated && !authState.hasPartner) {
    // This will be handled by the partner invitation system in task 5
    // For now, show the development links
  }

  // Main app content for authenticated users
  return (
    <main className="min-h-screen bg-bg">
      <div className="p-4">
        <div className="max-w-2xl mx-auto mb-6 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink mb-2">
              환영합니다, {authState.user?.name}님!
            </h1>
            <p className="text-ink/70">
              커플스 다이어리에 성공적으로 로그인했습니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link 
              href="/auth-test"
              className="inline-block px-4 py-2 bg-gold text-ink rounded-lg hover:bg-gold/80 transition-colors text-center"
            >
              Test Authentication System
            </Link>
            
            <Link 
              href="/auth?force=true"
              className="inline-block px-4 py-2 bg-lilac text-ink rounded-lg hover:bg-lilac/80 transition-colors text-center"
            >
              View Onboarding Flow
            </Link>
            
            <Link 
              href="/auth-screens-test"
              className="inline-block px-4 py-2 bg-mint text-ink rounded-lg hover:bg-mint/80 transition-colors text-center"
            >
              Test Individual Screens
            </Link>
            
            <Link 
              href="/onboarding-test"
              className="inline-block px-4 py-2 bg-ice text-ink rounded-lg hover:bg-ice/80 transition-colors text-center"
            >
              Test Onboarding Only
            </Link>
            
            <Link 
              href="/app-shell-test"
              className="inline-block px-4 py-2 bg-accent text-ink rounded-lg hover:bg-accent/80 transition-colors text-center"
            >
              Test App Shell
            </Link>
            
            <Link 
              href="/test-components"
              className="inline-block px-4 py-2 bg-sandDeep text-ink rounded-lg hover:bg-sandDeep/80 transition-colors text-center"
            >
              📋 Implementation Summary
            </Link>
          </div>
        </div>
      </div>
      <ThemeDemo />
    </main>
  );
}
