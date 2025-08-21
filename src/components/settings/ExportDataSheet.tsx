'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataExportManager, ExportOptions, ExportResult } from '@/lib/dataExport';

interface ExportDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  coupleId: string;
}

export function ExportDataSheet({ open, onOpenChange, userId, coupleId }: ExportDataSheetProps) {
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeMedia: true,
    encryptExport: true,
    includePartnerData: true,
  });

  const [exportPassword, setExportPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const handleExport = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const exportManager = new DataExportManager();
      const result = await exportManager.exportCoupleData(
        userId,
        coupleId,
        {
          includeMedia: !!exportOptions.includeMedia,
          encryptExport: !!exportOptions.encryptExport,
          exportPassword: exportOptions.encryptExport ? exportPassword : undefined,
          includePartnerData: !!exportOptions.includePartnerData,
        }
      );

      setExportResult(result);
      exportManager.downloadExport(result);

      // 성공 후 2초 뒤 창 닫기
      setTimeout(() => {
        onOpenChange(false);
        setExportResult(null);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 자동 생성
  const generatePassword = () => {
    const exportManager = new DataExportManager();
    const password = exportManager.generateExportPassword();
    setExportPassword(password);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>데이터 내보내기</SheetTitle>
          <SheetDescription>
            다이어리 내용, 추억, 약속 등을 JSON 형식으로 내보냅니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {exportResult ? (
            <div className="p-4 bg-primary/10 rounded-lg space-y-2">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Download size={16} className="text-primary" />
                내보내기 완료
              </h3>
              <p className="text-sm text-foreground/60">
                {exportResult.size / 1024 < 1000 
                  ? `파일 크기: ${Math.round(exportResult.size / 1024)} KB` 
                  : `파일 크기: ${(exportResult.size / (1024 * 1024)).toFixed(2)} MB`}
              </p>
              {exportResult.isEncrypted && (
                <p className="text-sm text-foreground/60">
                  파일이 암호화되었습니다. 복원 시 암호가 필요합니다.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!exportOptions.includeMedia}
                  onChange={(e) => setExportOptions(prev => ({...prev, includeMedia: e.target.checked}))}
                />
                미디어 파일 포함 (크기가 커질 수 있음)
              </label>

              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!exportOptions.encryptExport}
                  onChange={(e) => setExportOptions(prev => ({...prev, encryptExport: e.target.checked}))}
                />
                파일 암호화
              </label>

              {exportOptions.encryptExport && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      placeholder="내보내기 파일 암호 입력"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generatePassword}
                    >
                      생성
                    </Button>
                  </div>

                  <p className="text-xs text-foreground/60">
                    이 암호를 잊어버리면 데이터를 복구할 수 없습니다.
                  </p>
                </div>
              )}

              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!exportOptions.includePartnerData}
                  onChange={(e) => setExportOptions(prev => ({...prev, includePartnerData: e.target.checked}))}
                />
                파트너 데이터 포함
              </label>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              {exportResult ? '닫기' : '취소'}
            </Button>

            {!exportResult && (
              <Button 
                variant="primary"
                onClick={handleExport}
                disabled={loading || (exportOptions.encryptExport && !exportPassword)}
                className="flex-1"
              >
                {loading ? '내보내는 중...' : '내보내기'}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
