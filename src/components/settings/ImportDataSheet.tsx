'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataExportManager } from '@/lib/dataExport';

interface ImportDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportDataSheet({ open, onOpenChange, onSuccess }: ImportDataSheetProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const resetState = () => {
    setLoading(false);
    setSuccess(false);
    setPassword('');
    setNeedsPassword(false);
    setFile(null);
    setErrorMessage('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMessage('');
    setNeedsPassword(false);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const fileContent = await file.text();
      const exportManager = new DataExportManager();
      const result = await exportManager.importCoupleData(fileContent, password || undefined);

      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }

        // 성공 후 2초 뒤 창 닫기
        setTimeout(() => {
          onOpenChange(false);
          resetState();
        }, 2000);
      } else {
        if (result.message.includes('Password required')) {
          setNeedsPassword(true);
          setErrorMessage('암호화된 파일입니다. 암호를 입력해주세요.');
        } else {
          setErrorMessage(result.message);
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setErrorMessage('가져오기에 실패했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>데이터 가져오기</SheetTitle>
          <SheetDescription>
            이전에 내보낸 데이터를 가져옵니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {success ? (
            <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-3">
              <CheckCircle size={20} className="text-primary" />
              <div>
                <h3 className="font-medium text-foreground">가져오기 완료</h3>
                <p className="text-sm text-foreground/60">
                  데이터가 성공적으로 가져와졌습니다.
                </p>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-foreground">{errorMessage}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">백업 파일 선택</label>
                <Input 
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">
                  .json 형식의 파일만 가능합니다.
                </p>
              </div>

              {needsPassword && (
                <div className="mt-2">
                  <label className="text-sm font-medium">암호 입력</label>
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="내보내기 시 설정한 암호"
                    className="mt-1"
                  />
                </div>
              )}

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
                  onClick={handleImport}
                  disabled={loading || !file || (needsPassword && !password)}
                  className="flex-1"
                >
                  {loading ? '가져오는 중...' : '가져오기'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
