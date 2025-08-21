// import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      provider: "google" | "kakao";
      providerId: string;
      partnerId?: string;
      relationshipStartDate?: Date;
      preferences: {
        theme: "light" | "dark";
        notifications: boolean;
        language: string;
      };
      createdAt: Date;
      updatedAt: Date;
    };
    partner?: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      provider: string;
      providerId: string;
      partnerId?: string;
      relationshipStartDate?: Date;
      theme: string;
      notifications: boolean;
      language: string;
      createdAt: Date;
      updatedAt: Date;
    };
    hasPartner: boolean;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    provider?: "google" | "kakao";
    providerId?: string;
    partnerId?: string;
    relationshipStartDate?: Date;
    preferences?: {
      theme: "light" | "dark";
      notifications: boolean;
      language: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    hasPartner?: boolean;
    partner?: Record<string, unknown>;
  }
}