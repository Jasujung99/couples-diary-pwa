"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function AuthTestPage() {
  const { authState, invitePartner } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const handleInvitePartner = async () => {
    if (!inviteEmail.trim()) return;
    
    setInviteLoading(true);
    setInviteMessage("");
    
    try {
      await invitePartner(inviteEmail);
      setInviteMessage("Invitation sent successfully!");
      setInviteEmail("");
    } catch (error) {
      setInviteMessage(`Error: ${error instanceof Error ? error.message : "Failed to send invitation"}`);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-2">
            Authentication System Test
          </h1>
          <p className="text-ink/60">
            Testing the authentication foundation for Couples Diary PWA
          </p>
        </div>

        <AuthStatus />

        <div className="p-4 bg-bgSoft rounded-lg space-y-4">
          <h3 className="font-medium text-ink">Authentication Actions</h3>
          
          <div className="flex gap-2">
            <AuthButton provider="google" />
            <AuthButton provider="kakao" />
          </div>
        </div>

        {authState.isAuthenticated && !authState.hasPartner && (
          <div className="p-4 bg-bgSoft rounded-lg space-y-4">
            <h3 className="font-medium text-ink">Partner Invitation</h3>
            
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Partner's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg bg-bg text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
              
              <Button
                onClick={handleInvitePartner}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="w-full"
              >
                {inviteLoading ? "Sending..." : "Send Partner Invitation"}
              </Button>
              
              {inviteMessage && (
                <p className={`text-sm ${inviteMessage.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                  {inviteMessage}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-bgSoft rounded-lg">
          <h3 className="font-medium text-ink mb-2">Implementation Status</h3>
          <ul className="text-sm text-ink/80 space-y-1">
            <li>✅ OAuth providers configured (Google, Kakao)</li>
            <li>✅ AuthContext with user state management</li>
            <li>✅ Authentication API endpoints</li>
            <li>✅ User model and database schema</li>
            <li>✅ JWT token handling</li>
            <li>✅ Partner invitation system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}