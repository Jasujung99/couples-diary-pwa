/**
 * Comprehensive offline sync status component
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Database,
  Upload,
  Download
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineStorage } from '@/lib/offlineStorage';
import { Button } from '@/components/ui/Button';

interface StorageStats {
  diaryEntries: number;
  datePlans: number;
  memories: number;
  syncQueue: number;
  storageUsed: number;
  storageQuota: number;
}

export function OfflineSyncStatus() {
  const { 
    isOnline, 
    isConnecting, 
    syncStatus, 
    triggerSync, 
    retryFailedSync, 
    clearFailedSync 
  } = useNetworkStatus();

  const [storageStats, setStorageStats] = useState<StorageStats>({
    diaryEntries: 0,
    datePlans: 0,
    memories: 0,
    syncQueue: 0,
    storageUsed: 0,
    storageQuota: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Load storage statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          diaryEntries,
          datePlans,
          memories,
          syncQueue,
          storageUsage
        ] = await Promise.all([
          offlineStorage.getDiaryEntries('default'), // TODO: Use actual coupleId
          offlineStorage.getDatePlans('default'),
          offlineStorage.getMemories('default'),
          offlineStorage.getSyncQueue(),
          offlineStorage.getStorageUsage()
        ]);

        setStorageStats({
          diaryEntries: diaryEntries.length,
          datePlans: datePlans.length,
          memories: memories.length,
          syncQueue: syncQueue.length,
          storageUsed: storageUsage.used,
          storageQuota: storageUsage.quota
        });
      } catch (error) {
        console.error('Failed to load storage stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = storageStats.storageQuota > 0 
    ? (storageStats.storageUsed / storageStats.storageQuota) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-line/20 shadow-sm">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            isOnline ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          
          <div>
            <h3 className="font-semibold text-ink">
              {isOnline ? 'Online' : 'Offline Mode'}
            </h3>
            <p className="text-sm text-forest/60">
              {isOnline 
                ? syncStatus.pending > 0 
                  ? `${syncStatus.pending} items syncing`
                  : 'All data synced'
                : `${storageStats.syncQueue} items waiting to sync`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isConnecting || syncStatus.inProgress) && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          )}
          
          {syncStatus.failed > 0 && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 text-forest/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-line/10">
              {/* Sync Actions */}
              {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={triggerSync}
                    disabled={isConnecting || syncStatus.inProgress}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-3 h-3" />
                    Sync Now
                  </Button>
                  
                  {syncStatus.failed > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={retryFailedSync}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Failed
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearFailedSync}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        Clear Failed
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Storage Statistics */}
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-ink flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Offline Storage
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-forest/60">Diary Entries:</span>
                    <span className="font-medium">{storageStats.diaryEntries}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-forest/60">Date Plans:</span>
                    <span className="font-medium">{storageStats.datePlans}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-forest/60">Memories:</span>
                    <span className="font-medium">{storageStats.memories}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-forest/60">Sync Queue:</span>
                    <span className="font-medium">{storageStats.syncQueue}</span>
                  </div>
                </div>

                {/* Storage Usage */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-forest/60">Storage Used:</span>
                    <span className="font-medium">
                      {formatBytes(storageStats.storageUsed)} / {formatBytes(storageStats.storageQuota)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        storagePercentage > 80 ? 'bg-red-500' : 
                        storagePercentage > 60 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-forest/50 mt-1">
                    {storagePercentage.toFixed(1)}% used
                  </p>
                </div>
              </div>

              {/* Sync Status Details */}
              {!isOnline && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Offline Mode Active</p>
                      <p className="text-amber-700 mt-1">
                        Your data is being saved locally and will sync automatically when you're back online.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isOnline && syncStatus.pending === 0 && syncStatus.failed === 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      All data is synced and up to date
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}