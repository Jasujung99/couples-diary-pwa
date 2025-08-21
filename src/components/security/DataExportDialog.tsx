'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, Calendar, Users, Image, FileText, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataExportManager } from '@/lib/dataExport';

interface DataExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  coupleId: string;
}

interface ExportOptions {
  includeMedia: boolean;
  encryptExport: boolean;
  exportPassword: string;
  dateRange: {
    enabled: boolean;
    start: string;
    end: string;
  };
  includePartnerData: boolean;
}

export function DataExportDialog({ isOpen, onClose, userId, coupleId }: DataExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeMedia: true,
    encryptExport: true,
    exportPassword: '',
    dateRange: {
      enabled: false,
      start: '',
      end: '',
    },
    includePartnerData: true,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const exportManager = new DataExportManager();
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      // Validate options
      if (options.encryptExport && !options.exportPassword) {
        setError('Password is required for encrypted exports');
        return;
      }
      
      if (options.dateRange.enabled && (!options.dateRange.start || !options.dateRange.end)) {
        setError('Please specify both start and end dates');
        return;
      }
      
      // Prepare export options
      const exportOptions = {
        includeMedia: options.includeMedia,
        encryptExport: options.encryptExport,
        exportPassword: options.exportPassword || undefined,
        dateRange: options.dateRange.enabled ? {
          start: new Date(options.dateRange.start),
          end: new Date(options.dateRange.end),
        } : undefined,
        includePartnerData: options.includePartnerData,
      };
      
      // Export data
      const result = await exportManager.exportCoupleData(userId, coupleId, exportOptions);
      
      // Download the file
      exportManager.downloadExport(result);
      
      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const generatePassword = () => {
    const password = exportManager.generateExportPassword();
    setOptions(prev => ({ ...prev, exportPassword: password }));
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
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Export Your Data
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Download your diary data securely
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Export Complete */}
            <AnimatePresence>
              {exportComplete && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Export completed successfully!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            {/* Options */}
            <div className="space-y-6">
              {/* Include Media */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Include Media</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Photos and attachments
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeMedia}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeMedia: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* Include Partner Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Include Partner Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Partner's diary entries and data
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includePartnerData}
                    onChange={(e) => setOptions(prev => ({ ...prev, includePartnerData: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* Date Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Date Range</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Limit export to specific dates
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.dateRange.enabled}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <AnimatePresence>
                  {options.dateRange.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 ml-8"
                    >
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={options.dateRange.start}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                      />
                      <Input
                        type="date"
                        placeholder="End date"
                        value={options.dateRange.end}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Encryption */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Encrypt Export</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Password protect your data
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.encryptExport}
                      onChange={(e) => setOptions(prev => ({ ...prev, encryptExport: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <AnimatePresence>
                  {options.encryptExport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 ml-8"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Keep this password safe - you'll need it to decrypt your data
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isExporting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Data
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}