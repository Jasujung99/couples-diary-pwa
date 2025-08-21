import { User } from "@/types/auth";

/**
 * Calculate the number of days since the relationship started
 */
export function calculateDaysTogether(startDate: Date | null | undefined): number {
  if (!startDate) return 0;
  
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format the D+ counter display
 */
export function formatDaysCounter(days: number): string {
  if (days === 0) return "D-Day";
  return `D+${days}`;
}

/**
 * Check if a user has completed their profile setup
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  
  return !!(
    user.name &&
    user.email &&
    user.preferences?.theme &&
    typeof user.preferences?.notifications === "boolean" &&
    user.preferences?.language
  );
}

/**
 * Check if both partners are connected
 */
export function arePartnersConnected(user: User | null, partner: User | null): boolean {
  return !!(user?.partnerId && partner?.id && user.partnerId === partner.id);
}

/**
 * Get the couple ID for shared resources
 */
export function getCoupleId(user: User | null): string | null {
  if (!user?.partnerId) return null;
  
  // Create a consistent couple ID by sorting user IDs
  const ids = [user.id, user.partnerId].sort();
  return ids.join("-");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if an invitation token is expired
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Get user display name with fallback
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Unknown User";
  return user.name || user.email.split("@")[0] || "User";
}

/**
 * Get user avatar with fallback
 */
export function getUserAvatar(user: User | null): string {
  if (!user?.avatar) {
    // Generate a simple avatar based on user name initials
    const name = getUserDisplayName(user);
    const initials = name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#E2E0F4"/>
        <text x="20" y="26" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="#111214">
          ${initials}
        </text>
      </svg>
    `)}`;
  }
  
  return user.avatar;
}