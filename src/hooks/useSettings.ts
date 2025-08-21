'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export interface NotificationSettings {
  enabled: boolean;
  diaryEntries: boolean;
  dateReminders: boolean;
  milestones: boolean;
}

export interface UserSettings {
  notifications: NotificationSettings;
  dataExport: {
    includeMedia: boolean;
    encryptExport: boolean;
    includePartnerData: boolean;
  };
  breakupMode: {
    archiveData: boolean;
    deleteSharedData: boolean;
    exportBeforeBreakup: boolean;
    allowDataRecovery: boolean;
    recoveryPeriodDays: number;
  };
}

export function useSettings() {
  const { authState, refreshUser } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { user } = authState;

  // 초기 설정값 정의
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      enabled: user?.preferences?.notifications || false,
      diaryEntries: true,
      dateReminders: true,
      milestones: true,
    },
    dataExport: {
      includeMedia: true,
      encryptExport: true,
      includePartnerData: true,
    },
    breakupMode: {
      archiveData: true,
      deleteSharedData: false,
      exportBeforeBreakup: true,
      allowDataRecovery: true,
      recoveryPeriodDays: 30,
    },
  });

  // 서버에서 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({
            ...prev,
            ...data.settings,
          }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // 알림 설정 저장
  const saveNotificationSettings = useCallback(async (newSettings: NotificationSettings) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/users/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          notifications: newSettings,
        }));

        // 사용자 정보 업데이트 (preferences가 변경됨)
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    }
  }, [user, refreshUser]);

  // 파트너 연결 해제
  const disconnectPartner = useCallback(async () => {
    if (!user || !authState.hasPartner) return false;

    try {
      const response = await fetch('/api/couples/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to disconnect partner:', error);
      return false;
    }
  }, [user, authState.hasPartner, refreshUser]);

  return {
    settings,
    setSettings,
    mode,
    toggleTheme,
    saveNotificationSettings,
    disconnectPartner,
  };
}
