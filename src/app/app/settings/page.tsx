'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Bell, 
  BellOff, 
  Shield, 
  User, 
  UserMinus, 
  LogOut, 
  Heart, 
  HeartCrack,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { calculateDaysTogether, formatDateKorean } from '@/utils/date';
import { DataExportManager, ExportOptions } from '@/lib/dataExport';
import { BreakupModeManager, BreakupModeOptions } from '@/lib/breakupMode';

export default function SettingsPage() {
  const { mode, toggleTheme } = useTheme();
  const { authState, logout } = useAuth();
  const { user, partner } = authState;

  // 내보내기/가져오기 상태
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeMedia: true,
    encryptExport: true,
    includePartnerData: true,
  });
  const [exportLoading, setExportLoading] = useState(false);

  // 알림 설정 상태
  const [notifications, setNotifications] = useState({
    enabled: user?.preferences?.notifications || false,
    diaryEntries: true,
    dateReminders: true,
    milestones: true,
  });

  // 계정 관리 상태
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  // 브레이크업 모드 상태
  const [breakupOpen, setBreakupOpen] = useState(false);
  const [breakupConfirm, setBreakupConfirm] = useState(false);
  const [breakupOptions, setBreakupOptions] = useState<Partial<BreakupModeOptions>>({
    archiveData: true,
    deleteSharedData: false,
    exportBeforeBreakup: true,
    allowDataRecovery: true,
    recoveryPeriodDays: 30,
  });
  const [breakupLoading, setBreakupLoading] = useState(false);

  // 데이터 내보내기 처리
  const handleExport = async () => {
    if (!user) return;

    setExportLoading(true);
    try {
      const exportManager = new DataExportManager();
      const result = await exportManager.exportCoupleData(
        user.id,
        'couple-id', // 실제 커플 ID 필요
        {
          includeMedia: !!exportOptions.includeMedia,
          encryptExport: !!exportOptions.encryptExport,
          exportPassword: exportOptions.encryptExport ? exportPassword : undefined,
          includePartnerData: !!exportOptions.includePartnerData,
        }
      );

      exportManager.downloadExport(result);
      setExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setExportLoading(false);
    }
  };

  // 데이터 가져오기 처리
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const exportManager = new DataExportManager();
      const result = await exportManager.importCoupleData(fileContent);

      if (result.success) {
        alert('데이터를 성공적으로 가져왔습니다.');
        setImportOpen(false);
      } else {
        alert(`가져오기 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('가져오기에 실패했습니다. 파일 형식을 확인해주세요.');
    }
  };

  // 알림 설정 저장
  const saveNotificationSettings = async () => {
    // API 호출 추가 필요
    alert('알림 설정이 저장되었습니다.');
  };

  // 파트너 연결 해제
  const disconnectPartner = async () => {
    // API 호출 추가 필요
    alert('파트너 연결이 해제되었습니다.');
    setDisconnectConfirm(false);
    setAccountModalOpen(false);
  };

  // 브레이크업 모드 활성화
  const activateBreakupMode = async () => {
    if (!user) return;

    setBreakupLoading(true);
    try {
      const breakupManager = new BreakupModeManager();
      const result = await breakupManager.activateBreakupMode(
        user.id,
        'couple-id', // 실제 커플 ID 필요
        {
          archiveData: !!breakupOptions.archiveData,
          deleteSharedData: !!breakupOptions.deleteSharedData,
          exportBeforeBreakup: !!breakupOptions.exportBeforeBreakup,
          allowDataRecovery: !!breakupOptions.allowDataRecovery,
          recoveryPeriodDays: breakupOptions.recoveryPeriodDays || 30,
        }
      );

      if (result.success) {
        alert('브레이크업 모드가 활성화되었습니다.');
        setBreakupOpen(false);
      } else {
        alert(`브레이크업 모드 활성화 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Breakup mode activation failed:', error);
      alert('브레이크업 모드 활성화에 실패했습니다.');
    } finally {
      setBreakupLoading(false);
      setBreakupConfirm(false);
    }
  };

  // 관계 기간 계산
  const relationshipDays = user?.relationshipStartDate 
    ? calculateDaysTogether(user.relationshipStartDate)
    : 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-6">
          설정
        </h1>

        {/* 프로필 카드 */}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-16 h-16 rounded-full" />
              ) : (
                <User size={24} className="text-accent" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{user?.name || '사용자'}</h2>
              <p className="text-sm text-foreground/60">{user?.email}</p>
              {partner && user?.relationshipStartDate && (
                <div className="flex items-center mt-1 text-sm text-foreground/60">
                  <Heart size={14} className="mr-1 text-accent" />
                  <span>
                    {partner.name}님과 함께 {relationshipDays}일째
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 앱 설정 */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">앱 설정</h2>

          <Card variant="elevated" className="overflow-hidden">
            {/* 테마 설정 */}
            <div className="p-4 flex justify-between items-center border-b border-foreground/10">
              <div>
                <h3 className="font-medium text-foreground">테마 설정</h3>
                <p className="text-sm text-foreground/60">라이트 또는 다크 모드</p>
              </div>
              <Button
                variant="outline" 
                onClick={toggleTheme}
                className="gap-2"
              >
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {mode === 'light' ? '다크 모드' : '라이트 모드'}
              </Button>
            </div>

            {/* 알림 설정 */}
            <div className="p-4 flex justify-between items-center border-b border-foreground/10">
              <div>
                <h3 className="font-medium text-foreground">알림 설정</h3>
                <p className="text-sm text-foreground/60">앱 알림 및 푸시 설정</p>
              </div>
              <Button 
                variant={notifications.enabled ? "primary" : "outline"}
                onClick={() => setNotifications(prev => ({...prev, enabled: !prev.enabled}))}
                className="gap-2"
              >
                {notifications.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                {notifications.enabled ? '켜짐' : '꺼짐'}
              </Button>
            </div>

            {/* 데이터 내보내기 */}
            <div className="p-4 flex justify-between items-center border-b border-foreground/10">
              <div>
                <h3 className="font-medium text-foreground">데이터 내보내기</h3>
                <p className="text-sm text-foreground/60">모든 다이어리 및 추억 내보내기</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setExportOpen(true)}
                className="gap-2"
              >
                <Download size={16} />
                내보내기
              </Button>
            </div>

            {/* 데이터 가져오기 */}
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-foreground">데이터 가져오기</h3>
                <p className="text-sm text-foreground/60">백업에서 복원</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="gap-2"
              >
                <Upload size={16} />
                가져오기
              </Button>
            </div>
          </Card>
        </div>

        {/* 계정 관리 */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">계정 관리</h2>

          <Card variant="elevated" className="overflow-hidden">
            {/* 계정 정보 수정 */}
            <div className="p-4 flex justify-between items-center border-b border-foreground/10">
              <div>
                <h3 className="font-medium text-foreground">계정 정보</h3>
                <p className="text-sm text-foreground/60">프로필 및 계정 설정</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setAccountModalOpen(true)}
                className="gap-2"
              >
                <User size={16} />
                관리
              </Button>
            </div>

            {/* 로그아웃 */}
            <div className="p-4 flex justify-between items-center border-b border-foreground/10">
              <div>
                <h3 className="font-medium text-foreground">로그아웃</h3>
                <p className="text-sm text-foreground/60">계정에서 로그아웃</p>
              </div>
              <Button 
                variant="outline"
                onClick={logout}
                className="gap-2"
              >
                <LogOut size={16} />
                로그아웃
              </Button>
            </div>

            {/* 브레이크업 모드 */}
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-foreground text-red-500">브레이크업 모드</h3>
                <p className="text-sm text-foreground/60">관계 종료 및 데이터 관리</p>
              </div>
              <Button 
                variant="destructive"
                onClick={() => setBreakupOpen(true)}
                className="gap-2"
              >
                <HeartCrack size={16} />
                관리
              </Button>
            </div>
          </Card>
        </div>

        {/* 앱 정보 */}
        <Card variant="outlined" className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">앱 정보</h3>
          <p className="text-xs text-foreground/60">버전: 1.0.0</p>
          <p className="text-xs text-foreground/60">© 2025 커플다이어리</p>
        </Card>
      </motion.div>

      {/* 데이터 내보내기 시트 */}
      <Sheet open={exportOpen} onOpenChange={setExportOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>데이터 내보내기</SheetTitle>
            <SheetDescription>
              다이어리 내용, 추억, 약속 등을 JSON 형식으로 내보냅니다.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
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
                <div className="mt-2">
                  <label className="text-sm font-medium">암호</label>
                  <Input 
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="내보내기 파일 암호 입력"
                    className="mt-1"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
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

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => setExportOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                variant="primary"
                onClick={handleExport}
                disabled={exportLoading || (exportOptions.encryptExport && !exportPassword)}
                className="flex-1"
              >
                {exportLoading ? '내보내는 중...' : '내보내기'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 데이터 가져오기 시트 */}
      <Sheet open={importOpen} onOpenChange={setImportOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>데이터 가져오기</SheetTitle>
            <SheetDescription>
              이전에 내보낸 데이터를 가져옵니다.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">백업 파일 선택</label>
              <Input 
                type="file"
                accept=".json"
                onChange={handleImport}
                className="mt-1"
              />
              <p className="text-xs text-foreground/60 mt-1">
                .json 형식의 파일만 가능합니다.
              </p>
            </div>

            <div className="flex pt-4">
              <Button 
                variant="outline"
                onClick={() => setImportOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 계정 관리 시트 */}
      <Sheet open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>계정 관리</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <h3 className="text-base font-medium">계정 정보</h3>

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
                        className="flex-1"
                      >
                        연결 해제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex pt-4">
              <Button 
                variant="outline"
                onClick={() => setAccountModalOpen(false)}
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 브레이크업 모드 시트 */}
      <Sheet open={breakupOpen} onOpenChange={setBreakupOpen}>
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
                  checked={!!breakupOptions.archiveData}
                  onChange={(e) => setBreakupOptions(prev => ({...prev, archiveData: e.target.checked}))}
                />
                데이터 보관 (암호화하여 안전하게 저장)
              </label>

              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!breakupOptions.exportBeforeBreakup}
                  onChange={(e) => setBreakupOptions(prev => ({...prev, exportBeforeBreakup: e.target.checked}))}
                />
                데이터 내보내기 (백업 파일 다운로드)
              </label>

              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!breakupOptions.deleteSharedData}
                  onChange={(e) => setBreakupOptions(prev => ({...prev, deleteSharedData: e.target.checked}))}
                />
                공유 데이터 삭제 (모든 다이어리 및 추억 삭제)
              </label>

              <label className="text-sm font-medium flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={!!breakupOptions.allowDataRecovery}
                  onChange={(e) => setBreakupOptions(prev => ({...prev, allowDataRecovery: e.target.checked}))}
                />
                복구 기간 설정 (마음이 바뀔 경우)
              </label>

              {breakupOptions.allowDataRecovery && (
                <div className="mt-2 pl-6">
                  <label className="text-sm font-medium">복구 가능 기간 (일)</label>
                  <Input 
                    type="number"
                    min={1}
                    max={90}
                    value={breakupOptions.recoveryPeriodDays || 30}
                    onChange={(e) => setBreakupOptions(prev => ({
                      ...prev, 
                      recoveryPeriodDays: parseInt(e.target.value) || 30
                    }))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {!breakupConfirm ? (
              <Button 
                variant="destructive"
                onClick={() => setBreakupConfirm(true)}
                className="w-full mt-2"
              >
                <HeartCrack size={16} className="mr-2" />
                브레이크업 모드 활성화
              </Button>
            ) : (
              <div className="space-y-2 p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm text-foreground">정말 브레이크업 모드를 활성화하시겠습니까?</p>
                <p className="text-xs text-foreground/60">이 작업은 취소할 수 없습니다.</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setBreakupConfirm(false)}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={activateBreakupMode}
                    disabled={breakupLoading}
                    className="flex-1"
                  >
                    {breakupLoading ? '처리 중...' : '활성화'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex pt-4">
              <Button 
                variant="outline"
                onClick={() => setBreakupOpen(false)}
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}