'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { NotificationSettings } from '@/hooks/useSettings';

interface NotificationSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<boolean>;
}

export function NotificationSettingsSheet({ 
  open, 
  onOpenChange, 
  settings, 
  onSave 
}: NotificationSettingsSheetProps) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setLoading(false);
    setSuccess(false);
    setNotificationSettings(settings);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await onSave(notificationSettings);
      if (result) {
        setSuccess(true);

        // 성공 후 1.5초 뒤 창 닫기
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        alert('알림 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('알림 설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'granted') {
      updateSetting('enabled', true);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSetting('enabled', true);
      } else {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      alert('알림 권한 요청에 실패했습니다.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>알림 설정</SheetTitle>
          <SheetDescription>
            앱 내 알림 및 푸시 알림 설정을 관리합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {success ? (
            <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-3">
              <CheckCircle size={20} className="text-primary" />
              <div>
                <h3 className="font-medium text-foreground">설정 저장 완료</h3>
                <p className="text-sm text-foreground/60">
                  알림 설정이 성공적으로 저장되었습니다.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-foreground">알림 활성화</h3>
                    <p className="text-sm text-foreground/60">모든 알림 켜기/끄기</p>
                  </div>
                  <Button 
                    variant={notificationSettings.enabled ? "primary" : "outline"}
                    onClick={notificationSettings.enabled 
                      ? () => updateSetting('enabled', false)
                      : requestNotificationPermission
                    }
                    className="gap-2"
                  >
                    <Bell size={16} />
                    {notificationSettings.enabled ? '켜짐' : '꺼짐'}
                  </Button>
                </div>

                {notificationSettings.enabled && (
                  <div className="p-3 bg-background rounded-lg space-y-3">
                    <h3 className="text-sm font-medium text-foreground">알림 유형</h3>

                    <label className="flex items-center justify-between text-sm text-foreground/80">
                      <span>다이어리 입력</span>
                      <input 
                        type="checkbox"
                        checked={notificationSettings.diaryEntries}
                        onChange={(e) => updateSetting('diaryEntries', e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between text-sm text-foreground/80">
                      <span>데이트 알림</span>
                      <input 
                        type="checkbox"
                        checked={notificationSettings.dateReminders}
                        onChange={(e) => updateSetting('dateReminders', e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between text-sm text-foreground/80">
                      <span>마일스톤 (기념일)</span>
                      <input 
                        type="checkbox"
                        checked={notificationSettings.milestones}
                        onChange={(e) => updateSetting('milestones', e.target.checked)}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
