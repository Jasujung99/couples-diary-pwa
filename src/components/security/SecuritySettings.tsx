'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Download, 
  Heart, 
  Lock, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataExportDialog } from './DataExportDialog';
import { BreakupModeDialog } from './BreakupModeDialog';
import { CoupleKeyManager } from '@/lib/keyManager';
import { SecureDiaryService } from '@/lib/secureDiary';
import { BreakupModeManager } from '@/lib/breakupMode';

interface SecuritySettingsProps {
  userId: string;
  coupleId: string;
}

interface EncryptionStatus {
  isEncrypted: boolean;
  keyAvailable: boolean;
  lastEncrypted?: Date;
  encryptionVersion: number;
}

interface BreakupStatus {
  isActive: boolean;
  canRecover: boolean;
  recoveryExpiresAt?: Date;
}

export function SecuritySettings({ userId, coupleId }: SecuritySettingsProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBreakupDialog, setShowBreakupDialog] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    isEncrypted: false,
    keyAvailable: false,
    encryptionVersion: 1,
  });
  const [breakupStatus, setBreakupStatus] = useState<BreakupStatus>({
    isActive: false,
    canRecover: false,
  });
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  const [isInitializingEncryption, setIsInitializingEncryption] = useState(false);
  
  const keyManager = CoupleKeyManager.getInstance();
  const diaryService = new SecureDiaryService();
  const breakupManager = new BreakupModeManager();
  
  useEffect(() => {
    loadSecurityStatus();
  }, [coupleId]);
  
  const loadSecurityStatus = async () => {
    try {
      // Load encryption status
      const encStatus = await diaryService.getEncryptionStatus(coupleId);
      setEncryptionStatus(encStatus);
      
      // Load breakup status
      const bStatus = await breakupManager.getBreakupModeStatus(coupleId);
      setBreakupStatus(bStatus);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  };
  
  const initializeEncryption = async () => {
    try {
      setIsInitializingEncryption(true);
      
      await keyManager.initializeCoupleKeys({
        userId,
        coupleId,
      });
      
      await loadSecurityStatus();
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    } finally {
      setIsInitializingEncryption(false);
    }
  };
  
  const rotateEncryptionKeys = async () => {
    try {
      setIsRotatingKeys(true);
      
      // Rotate keys
      await keyManager.rotateKeys(coupleId);
      
      // Re-encrypt all diary entries with new keys
      await diaryService.reencryptAllEntries(coupleId);
      
      await loadSecurityStatus();
    } catch (error) {
      console.error('Failed to rotate encryption keys:', error);
    } finally {
      setIsRotatingKeys(false);
    }
  };
  
  const handleBreakupActivated = () => {
    loadSecurityStatus();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Security & Privacy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your data security and privacy settings
          </p>
        </div>
      </div>
      
      {/* Breakup Mode Warning */}
      {breakupStatus.isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Breakup Mode Active</span>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">
            Your relationship has ended and data access is restricted.
            {breakupStatus.canRecover && breakupStatus.recoveryExpiresAt && (
              <span className="block mt-1">
                Recovery available until {new Date(breakupStatus.recoveryExpiresAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </motion.div>
      )}
      
      {/* Encryption Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Data Encryption
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                End-to-end encryption for your diary entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {encryptionStatus.isEncrypted ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            <span className={`text-sm font-medium ${
              encryptionStatus.isEncrypted 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {encryptionStatus.isEncrypted ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        {encryptionStatus.isEncrypted ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Encryption Version:</span>
              <span className="text-gray-900 dark:text-white">v{encryptionStatus.encryptionVersion}</span>
            </div>
            {encryptionStatus.lastEncrypted && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Used:</span>
                <span className="text-gray-900 dark:text-white">
                  {encryptionStatus.lastEncrypted.toLocaleDateString()}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={rotateEncryptionKeys}
              disabled={isRotatingKeys || breakupStatus.isActive}
              className="w-full"
            >
              {isRotatingKeys ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Rotating Keys...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Rotate Encryption Keys
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your diary entries are not encrypted. Enable encryption to secure your private data.
              </p>
            </div>
            <Button
              onClick={initializeEncryption}
              disabled={isInitializingEncryption || breakupStatus.isActive}
              className="w-full"
            >
              {isInitializingEncryption ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Initializing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Enable Encryption
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Data Export */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Data Export
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download your diary data and memories
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowExportDialog(true)}
          disabled={breakupStatus.isActive}
          className="w-full"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export My Data
          </div>
        </Button>
      </div>
      
      {/* Breakup Mode */}
      {!breakupStatus.isActive && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Relationship Management
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                End relationship and manage shared data
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              This action will end your relationship and restrict access to shared data. 
              Use this feature if you need to permanently separate your accounts.
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowBreakupDialog(true)}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Activate Breakup Mode
            </div>
          </Button>
        </div>
      )}
      
      {/* Dialogs */}
      <DataExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        userId={userId}
        coupleId={coupleId}
      />
      
      <BreakupModeDialog
        isOpen={showBreakupDialog}
        onClose={() => setShowBreakupDialog(false)}
        userId={userId}
        coupleId={coupleId}
        onBreakupActivated={handleBreakupActivated}
      />
    </div>
  );
}