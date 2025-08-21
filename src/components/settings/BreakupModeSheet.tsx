'use client';

import React, { useState } from 'react';
import { HeartCrack, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BreakupModeManager, BreakupModeOptions } from '@/lib/breakupMode';

interface BreakupModeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  coupleId: string;
  onSuccess?: () => void;
}

export function BreakupModeSheet({ open, onOpenChange, userId, coupleId, onSuccess }: BreakupModeSheetProps) {
  const [options, setOptions] = useState<Partial<BreakupModeOptions>>({
    archiveData: true,
    deleteSharedData: false,
    exportBeforeBreakup: true,
    allowDataRecovery: true,
    recoveryPeriodDays: 30,
    reason: '',
  });

  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const resetState = () => {
    setConfirm(false);
    setLoading(false);
    setConfirmText('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const activateBreakupMode = async () => {
    if (!userId || confirmText !== '헤어짐') return;

    setLoading(true);
    try {
      const breakupManager = new BreakupModeManager();
      const result = await breakupManager.activateBreakupMode(
        userId,
        coupleId,
        {
          archiveData: !!options.archiveData,
          deleteSharedData: !!options.deleteSharedData,
          exportBeforeBreakup: !!options.exportBeforeBreakup,
          allowDataRecovery: !!options.allowDataRecovery,
          recoveryPeriodDays: options.recoveryPeriodDays || 30,
          reason: options.reason,
        }
      );

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        alert(`브레이크업 모드 활성화 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Breakup mode activation failed:', error);
      alert('브레이크업 모드 활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="text-destructive flex items-center gap-2">
            <HeartCrack size={18} /> 브레이크업 모드
          </SheetTitle>
          <SheetDescription>
            관계 종료 시 데이터를 안전하게 관리합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-foreground flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive mt-0.5" />
              브레이크업 모드는 파트너와의 연결을 영구적으로 해제하고 데이터 접근을 제한합니다.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <input 
                type="checkbox"
                checked={!!options.archiveData}
                onChange={(e) => setOptions(prev => ({...prev, archiveData: e.target.checked}))}
              />
              데이터 보관 (암호화하여 안전하게 저장)
            </label>

            <label className="text-sm font-medium flex items-center gap-2">
              <input 
                type="checkbox"
                checked={!!options.exportBeforeBreakup}
                onChange={(e) => setOptions(prev => ({...prev, exportBeforeBreakup: e.target.checked}))}
              />
              데이터 내보내기 (백업 파일 다운로드)
            </label>

            <label className="text-sm font-medium flex items-center gap-2">
              <input 
                type="checkbox"
                checked={!!options.deleteSharedData}
                onChange={(e) => setOptions(prev => ({...prev, deleteSharedData: e.target.checked}))}
              />
              공유 데이터 삭제 (모든 다이어리 및 추억 삭제)
            </label>

            <label className="text-sm font-medium flex items-center gap-2">
              <input 
                type="checkbox"
                checked={!!options.allowDataRecovery}
                onChange={(e) => setOptions(prev => ({...prev, allowDataRecovery: e.target.checked}))}
              />
              복구 기간 설정 (마음이 바뀔 경우)
            </label>

            {options.allowDataRecovery && (
              <div className="mt-2 pl-6">
                <label className="text-sm font-medium">복구 가능 기간 (일)</label>
                <Input 
                  type="number"
                  min={1}
                  max={90}
                  value={options.recoveryPeriodDays || 30}
                  onChange={(e) => setOptions(prev => ({
                    ...prev, 
                    recoveryPeriodDays: parseInt(e.target.value) || 30
                  }))}
                  className="mt-1"
                />
              </div>
            )}

            <div className="mt-2">
              <label className="text-sm font-medium">종료 이유 (선택사항)</label>
              <Input 
                value={options.reason || ''}
                onChange={(e) => setOptions(prev => ({...prev, reason: e.target.value}))}
                placeholder="이유를 입력하세요 (나만 볼 수 있음)"
                className="mt-1"
              />
            </div>
          </div>

          {!confirm ? (
            <Button 
              variant="destructive"
              onClick={() => setConfirm(true)}
              className="w-full mt-2"
            >
              <HeartCrack size={16} className="mr-2" />
              브레이크업 모드 활성화
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-foreground">정말 브레이크업 모드를 활성화하시겠습니까?</p>
              <p className="text-xs text-foreground/60">이 작업은 취소할 수 없습니다.</p>

              <div>
                <label className="text-sm font-medium">확인을 위해 '헤어짐'을 입력하세요</label>
                <Input 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="헤어짐"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setConfirm(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button 
                  variant="destructive"
                  onClick={activateBreakupMode}
                  disabled={loading || confirmText !== '헤어짐'}
                  className="flex-1"
                >
                  {loading ? '처리 중...' : '활성화'}
                </Button>
              </div>
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
