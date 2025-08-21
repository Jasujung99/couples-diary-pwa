"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleAuthSuccess = () => {
    router.push(callbackUrl);
  };

  const handleAuthError = (error: string) => {
    console.error('Sign in error:', error);
    // Error is handled in AuthScreen component
  };

  return (
    <AuthScreen
      onSuccess={handleAuthSuccess}
      onError={handleAuthError}
    />
  );
}