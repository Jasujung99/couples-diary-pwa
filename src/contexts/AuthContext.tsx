"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { AuthState, AuthContextType, LoginCredentials, User } from "@/types/auth";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status, update } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    partner: null,
    hasPartner: false,
  });

  useEffect(() => {
    if (status === "loading") {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Type assertion for extended user properties
      const sessionUser = session.user as any;
      const user: User = {
        id: sessionUser.id || "",
        email: sessionUser.email || "",
        name: sessionUser.name || "",
        avatar: sessionUser.image || undefined,
        provider: sessionUser.provider || "google",
        providerId: sessionUser.providerId || "",
        partnerId: sessionUser.partnerId || undefined,
        relationshipStartDate: sessionUser.relationshipStartDate || undefined,
        preferences: sessionUser.preferences || {
          theme: "light",
          notifications: true,
          language: "ko",
        },
        createdAt: sessionUser.createdAt || new Date(),
        updatedAt: sessionUser.updatedAt || new Date(),
      };

      const sessionPartner = (session as any).partner;
      const partner: User | null = sessionPartner ? {
        id: sessionPartner.id || "",
        email: sessionPartner.email || "",
        name: sessionPartner.name || "",
        avatar: sessionPartner.avatar || undefined,
        provider: sessionPartner.provider || "google",
        providerId: sessionPartner.providerId || "",
        partnerId: sessionPartner.partnerId || undefined,
        relationshipStartDate: sessionPartner.relationshipStartDate || undefined,
        preferences: {
          theme: sessionPartner.theme || "light",
          notifications: sessionPartner.notifications || true,
          language: sessionPartner.language || "ko",
        },
        createdAt: sessionPartner.createdAt || new Date(),
        updatedAt: sessionPartner.updatedAt || new Date(),
      } : null;

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        partner,
        hasPartner: (session as any).hasPartner || false,
      });
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        partner: null,
        hasPartner: false,
      });
    }
  }, [session, status]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // 개발 환경에서 디버깅 정보 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log(`AuthContext: ${credentials.provider} 로그인 시도`);
      }

      const result = await signIn(credentials.provider, {
        redirect: false,
        callbackUrl: "/",
      });

      // 개발 환경에서 결과 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext 로그인 결과:', result);
      }

      if (result?.error) {
        console.error('AuthContext 로그인 오류:', result.error);
        throw new Error(result.error);
      }

      // 성공적으로 로그인한 경우 세션 확인
      if (result?.ok) {
        // 세션 업데이트를 위해 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        await update();
      }

      return result;
    } catch (error) {
      console.error('AuthContext 로그인 예외:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const invitePartner = async (email: string) => {
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      return await response.json();
    } catch (error) {
      console.error("Invite partner error:", error);
      throw error;
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      }

      // Refresh the session to get updated user data
      await update();
      
      return await response.json();
    } catch (error) {
      console.error("Accept invitation error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      await update();
    } catch (error) {
      console.error("Refresh user error:", error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    invitePartner,
    acceptInvitation,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}