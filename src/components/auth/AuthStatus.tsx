"use client";

import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, calculateDaysTogether, formatDaysCounter } from "@/utils/auth";

export function AuthStatus() {
  const { authState } = useAuth();

  if (authState.isLoading) {
    return (
      <div className="p-4 bg-bgSoft rounded-lg">
        <p className="text-ink/60">Loading authentication...</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="p-4 bg-bgSoft rounded-lg">
        <p className="text-ink/60">Not authenticated</p>
      </div>
    );
  }

  const user = authState.user;
  const partner = authState.partner;
  const daysTogether = calculateDaysTogether(user?.relationshipStartDate);

  return (
    <div className="p-4 bg-bgSoft rounded-lg space-y-3">
      <div>
        <h3 className="font-medium text-ink">Authentication Status</h3>
        <p className="text-sm text-ink/60">✅ Authenticated</p>
      </div>
      
      <div>
        <h4 className="font-medium text-ink">User Info</h4>
        <p className="text-sm text-ink/80">Name: {getUserDisplayName(user)}</p>
        <p className="text-sm text-ink/80">Email: {user?.email}</p>
        <p className="text-sm text-ink/80">Provider: {user?.provider}</p>
      </div>

      {authState.hasPartner && partner ? (
        <div>
          <h4 className="font-medium text-ink">Partner Info</h4>
          <p className="text-sm text-ink/80">Name: {getUserDisplayName(partner)}</p>
          <p className="text-sm text-ink/80">Email: {partner.email}</p>
          <p className="text-sm text-ink/80">
            Together: {formatDaysCounter(daysTogether)}
          </p>
        </div>
      ) : (
        <div>
          <h4 className="font-medium text-ink">Partner Status</h4>
          <p className="text-sm text-ink/60">No partner connected</p>
        </div>
      )}
    </div>
  );
}