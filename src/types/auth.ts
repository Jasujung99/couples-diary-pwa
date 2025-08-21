export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'kakao';
  providerId: string;
  partnerId?: string;
  relationshipStartDate?: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  partner: User | null;
  hasPartner: boolean;
}

export interface LoginCredentials {
  provider: 'google' | 'kakao';
  token: string;
}

export interface PartnerInvitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  invitePartner: (email: string) => Promise<any>;
  acceptInvitation: (token: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}