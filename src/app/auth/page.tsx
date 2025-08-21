"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authState } = useAuth();
  
  const forceOnboarding = searchParams.get('force') === 'true';

  // Redirect if already authenticated and not forcing onboarding
  useEffect(() => {
    if (authState.isAuthenticated && !forceOnboarding) {
      router.push('/');
    }
  }, [authState.isAuthenticated, forceOnboarding, router]);

  const handleAuthSuccess = () => {
    // Redirect to main app after successful authentication
    router.push('/');
  };

  // Don't render if already authenticated and not forcing onboarding
  if (authState.isAuthenticated && !forceOnboarding) {
    return null;
  }

  return (
    <AuthFlow 
      onAuthSuccess={handleAuthSuccess} 
      forceOnboarding={forceOnboarding}
    />
  );
}