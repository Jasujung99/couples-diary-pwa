"use client";

import { AuthFlow } from "@/components/auth/AuthFlow";

export default function OnboardingTestPage() {
  return (
    <AuthFlow 
      forceOnboarding={true}
      onAuthSuccess={() => {
        console.log("Auth success!");
      }}
    />
  );
}