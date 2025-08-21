"use client";

import React from "react";
import { InvitationAcceptance } from "@/components/auth/InvitationAcceptance";
import { useRouter } from "next/navigation";

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  return <InvitationPageClient token={token} />;
}

function InvitationPageClient({ token }: { token: string }) {
  const router = useRouter();

  const handleAccepted = () => {
    // Redirect to main app after successful acceptance
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  const handleRejected = () => {
    // Redirect to home after rejection
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <InvitationAcceptance
        token={token}
        onAccepted={handleAccepted}
        onRejected={handleRejected}
      />
    </div>
  );
}