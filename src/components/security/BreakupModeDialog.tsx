'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Archive, Download, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BreakupModeManager } from '@/lib/breakupMode';

interface BreakupModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  coupleId: string;
  onBreakupActivated: () => void;
}

interface BreakupOptions {
  archiveData: boolean;
  deleteSharedData: boolean;
  exportBeforeBreakup: boolean;
  exportPassword: string;
  reason: string;
  allowDataRecovery: boolean;
  recoveryPeriodDays: number;
}

export function BreakupModeDialog({ 
  isOpen, 
  onClose, 
  userId, 
  coupleId, 
  onBreakupActivated 
}: BreakupModeDialogProps) {
  const [step, setStep] = useState<'confirm' | 'options' | 'processing' | 'complete'>('confirm');
  const [options, setOptions] = useState<BreakupOptions>({
    archiveData: true,
    deleteSharedData: false,
    exportBeforeBreakup: true,
    exportPassword: '',
    reason: '',
    allowDataRecovery: true,
    recoveryPeriodDays: 30,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  
  const breakupManager = new BreakupModeManager();
  
  const handleConfirm = () => {
    setStep('options');
  };
  
  const handleActivateBreakup = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setStep('processing');
      
      // Validate options
      if (options.exportBeforeBreakup && !options.exportPassword) {
        setError('Export password is required');
        setStep('options');
        return;
      }
      
      // Activate breakup mode
      const result = await breakupManager.activateBreakupMode(userId, coupleId, options);
      
      if (!result.success) {
        setError(result.message);
        setStep('options');
        return;
      }
      
      setArchiveId(result.archiveId || null);
      setStep('complete');
      
      // Notify parent component
      setTimeout(() => {
        onBreakupActivated();
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Breakup activation failed:', error);
      setError('Failed to activate breakup mode. Please try again.');
      setStep('options');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOptions(prev => ({ ...prev, exportPassword: password }));
  };
  
  const resetDialog = () => {
    setStep('confirm');
    setError(null);
    setArchiveId(null);
    setIsProcessing(false);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Breakup Mode
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    End relationship and manage data
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={step === 'processing' ? undefined : onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={step === 'processing'}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Error */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            {/* Confirmation Step */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Are you sure?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    This will end your relationship and restrict access to shared data. 
                    This action cannot be easily undone.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Options Step */}
            {step === 'options' && (
              <div className="space-y-6">
                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason (optional)
                  </label>
                  <Input
                    placeholder="Why are you ending the relationship?"
                    value={options.reason}
                    onChange={(e) => setOptions(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                
                {/* Archive Data */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Archive Data</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create encrypted backup of all data
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.archiveData}
                      onChange={(e) => setOptions(prev => ({ ...prev, archiveData: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {/* Export Before Breakup */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Download your data before breakup
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.exportBeforeBreakup}
                        onChange={(e) => setOptions(prev => ({ ...prev, exportBeforeBreakup: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <AnimatePresence>
                    {options.exportBeforeBreakup && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8"
                      >
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Export password"
                            value={options.exportPassword}
                            onChange={(e) => setOptions(prev => ({ ...prev, exportPassword: e.target.value }))}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generatePassword}
                            className="px-3"
                          >
                            Generate
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Allow Data Recovery */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Allow Data Recovery</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable recovery period for reconciliation
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.allowDataRecovery}
                        onChange={(e) => setOptions(prev => ({ ...prev, allowDataRecovery: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <AnimatePresence>
                    {options.allowDataRecovery && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={options.recoveryPeriodDays}
                            onChange={(e) => setOptions(prev => ({ 
                              ...prev, 
                              recoveryPeriodDays: parseInt(e.target.value) || 30 
                            }))}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Delete Shared Data */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Delete Shared Data</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently delete all shared content
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.deleteSharedData}
                      onChange={(e) => setOptions(prev => ({ ...prev, deleteSharedData: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('confirm')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleActivateBreakup}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Activate Breakup Mode
                  </Button>
                </div>
              </div>
            )}
            
            {/* Processing Step */}
            {step === 'processing' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Processing Breakup...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Please wait while we process your request and secure your data.
                  </p>
                </div>
              </div>
            )}
            
            {/* Complete Step */}
            {step === 'complete' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Breakup Mode Activated
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your relationship has been ended and your data has been secured.
                  </p>
                  {archiveId && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Archive ID: {archiveId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}