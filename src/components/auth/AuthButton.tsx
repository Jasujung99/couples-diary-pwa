"use client";

import { signIn, signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface AuthButtonProps {
  provider?: "google" | "kakao";
  className?: string;
}

export function AuthButton({ provider = "google", className }: AuthButtonProps) {
  const { authState } = useAuth();

  if (authState.isAuthenticated) {
    return (
      <Button
        onClick={() => signOut()}
        variant="outline"
        className={className}
      >
        Sign Out
      </Button>
    );
  }

  const handleSignIn = () => {
    signIn(provider, { callbackUrl: "/" });
  };

  const providerNames = {
    google: "Google",
    kakao: "Kakao",
  };

  return (
    <Button
      onClick={handleSignIn}
      className={className}
    >
      Sign in with {providerNames[provider]}
    </Button>
  );
}