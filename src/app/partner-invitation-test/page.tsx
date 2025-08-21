"use client";

import React from "react";
import { PartnerInvitationFlow } from "@/components/auth/PartnerInvitationFlow";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "next-auth/react";

export default function PartnerInvitationTestPage() {
  const handleComplete = () => {
    console.log("Partner invitation flow completed");
  };

  const handleSkip = () => {
    console.log("Partner invitation flow skipped");
  };

  return (
    <SessionProvider>
      <AuthProvider>
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-ink mb-2">
                파트너 초대 시스템 테스트
              </h1>
              <p className="text-ink/70">
                파트너 초대 및 수락 플로우를 테스트해보세요
              </p>
            </div>

            <PartnerInvitationFlow
              onComplete={handleComplete}
              onSkip={handleSkip}
              showSkipOption={true}
            />
          </div>
        </div>
      </AuthProvider>
    </SessionProvider>
  );
}