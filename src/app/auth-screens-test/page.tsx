"use client";

import { useState } from "react";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/Button";

type Screen = 'menu' | 'onboarding' | 'auth';

export default function AuthScreensTestPage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  if (currentScreen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => {
          console.log("Onboarding completed!");
          setCurrentScreen('menu');
        }}
        onSkip={() => {
          console.log("Onboarding skipped!");
          setCurrentScreen('menu');
        }}
      />
    );
  }

  if (currentScreen === 'auth') {
    return (
      <AuthScreen
        onSuccess={() => {
          console.log("Auth success!");
          setCurrentScreen('menu');
        }}
        onError={(error) => {
          console.log("Auth error:", error);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-ink text-center mb-8">
          Authentication Screens Test
        </h1>
        
        <Button
          onClick={() => setCurrentScreen('onboarding')}
          className="w-full"
        >
          Test Onboarding Screen
        </Button>
        
        <Button
          onClick={() => setCurrentScreen('auth')}
          className="w-full"
          variant="outline"
        >
          Test Auth Screen
        </Button>
        
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-ink/60 hover:text-ink underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}