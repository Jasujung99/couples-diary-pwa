'use client';

import React, { useState } from 'react';
import { User, UserMinus, Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDateKorean } from '@/utils/date';
import type { User as UserType } from '@/types/auth';

interface AccountManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  partner: UserType | null;
  onDisconnect: () => Promise<boolean>;
}

export function AccountManagementSheet({ 
  open, 
  onOpenChange, 
  user, 
  partner,
  onDisconnect 
}: AccountManagementSheetProps) {
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setDisconnectConfirm(false);
    setLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const disconnectPartner = async () => {
    setLoading(true);
    try {
      const result = await onDisconnect();
      if (result) {
        handleClose();
      } else {
        alert('파트너 연결 해제에 실패했습니다.');
        setDisconnectConfirm(false);
      }
    } catch (error) {
      console.error('Failed to disconnect partner:', error);
      alert('파트너 연결 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>계정 관리</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center gap-2">
              <User size={18} className="text-foreground/60" /> 계정 정보
            </h3>

            <div>
              <label className="text-sm font-medium">이름</label>
              <Input value={user?.name || ''} disabled className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium">이메일</label>
              <Input value={user?.email || ''} disabled className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium">가입일</label>
              <Input value={user?.createdAt ? formatDateKorean(user.createdAt) : ''} disabled className="mt-1" />
            </div>
          </div>

          {partner && (
            <div className="space-y-3 pt-4 border-t border-foreground/10">
              <h3 className="text-base font-medium flex items-center gap-2">
                <Heart size={18} className="text-accent" /> 파트너 연결
              </h3>

              <div>
                <label className="text-sm font-medium">파트너</label>
                <Input value={partner?.name || ''} disabled className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">관계 시작일</label>
                <Input 
                  value={user?.relationshipStartDate ? formatDateKorean(user.relationshipStartDate) : ''} 
                  disabled 
                  className="mt-1" 
                />
              </div>

              {!disconnectConfirm ? (
                <Button 
                  variant="destructive"
                  onClick={() => setDisconnectConfirm(true)}
                  className="w-full mt-2"
                >
                  <UserMinus size={16} className="mr-2" />
                  파트너 연결 해제
                </Button>
              ) : (
                <div className="space-y-2 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-foreground">정말 파트너 연결을 해제하시겠습니까?</p>
                  <p className="text-xs text-foreground/60">이 작업은 취소할 수 없으며, 공유 데이터에 접근할 수 없게 됩니다.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setDisconnectConfirm(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={disconnectPartner}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? '처리 중...' : '연결 해제'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex pt-4">
            <Button 
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              닫기
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
