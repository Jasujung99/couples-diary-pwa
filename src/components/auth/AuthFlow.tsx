"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/utils/animations";

interface AuthFlowProps {
  onAuthSuccess?: () => void;
  forceOnboarding?: boolean;
}

type FlowStep = 'onboarding' | 'auth' | 'complete';

export function AuthFlow({ onAuthSuccess, forceOnboarding = false }: AuthFlowProps) {
  const { authState } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('onboarding');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding before
  useEffect(() => {
    const completed = localStorage.getItem('onboarding-completed');
    if (completed && !forceOnboarding) {
      setHasCompletedOnboarding(true);
      setCurrentStep('auth');
    }
  }, [forceOnboarding]);

  // Handle authentication success
  useEffect(() => {
    if (authState.isAuthenticated && currentStep !== 'complete') {
      setCurrentStep('complete');
      onAuthSuccess?.();
    }
  }, [authState.isAuthenticated, currentStep, onAuthSuccess]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setHasCompletedOnboarding(true);
    setCurrentStep('auth');
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setHasCompletedOnboarding(true);
    setCurrentStep('auth');
  };

  const handleAuthSuccess = () => {
    setCurrentStep('complete');
    onAuthSuccess?.();
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
    // Error is already handled in AuthScreen component
  };

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink/70">로딩 중...</p>
        </motion.div>
      </div>
    );
  }

  // If already authenticated, don't show auth flow
  if (authState.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentStep === 'onboarding' && (
          <motion.div
            key="onboarding"
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <OnboardingScreen
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          </motion.div>
        )}

        {currentStep === 'auth' && (
          <motion.div
            key="auth"
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AuthScreen
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}