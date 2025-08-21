/**
 * Hook for monitoring network status and offline functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { backgroundSync } from '@/lib/backgroundSync';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  syncStatus: {
    pending: number;
    failed: number;
    inProgress: boolean;
  };
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
    lastOnline: null,
    syncStatus: {
      pending: 0,
      failed: 0,
      inProgress: false
    }
  });

  useEffect(() => {
    let lastOnlineTime: Date | null = null;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      if (isOnline && !networkStatus.isOnline) {
        lastOnlineTime = new Date();
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          isConnecting: false,
          lastOnline: lastOnlineTime
        }));
      } else if (!isOnline) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: false,
          isConnecting: false
        }));
      }
    };

    const updateSyncStatus = async () => {
      try {
        const queueStatus = await backgroundSync.getQueueStatus();
        const inProgress = backgroundSync.isSyncInProgress();
        
        setNetworkStatus(prev => ({
          ...prev,
          syncStatus: {
            pending: queueStatus.pending,
            failed: queueStatus.failed,
            inProgress
          }
        }));
      } catch (error) {
        console.error('Failed to update sync status:', error);
      }
    };

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update sync status periodically
    const syncStatusInterval = setInterval(updateSyncStatus, 5000);

    // Initial status update
    updateOnlineStatus();
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(syncStatusInterval);
    };
  }, [networkStatus.isOnline]);

  const triggerSync = async () => {
    if (!networkStatus.isOnline) return;

    setNetworkStatus(prev => ({
      ...prev,
      isConnecting: true
    }));

    try {
      await backgroundSync.triggerSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setNetworkStatus(prev => ({
        ...prev,
        isConnecting: false
      }));
    }
  };

  const retryFailedSync = async () => {
    try {
      await backgroundSync.retryFailedItems();
    } catch (error) {
      console.error('Retry failed sync items failed:', error);
    }
  };

  const clearFailedSync = async () => {
    try {
      await backgroundSync.clearFailedItems();
    } catch (error) {
      console.error('Clear failed sync items failed:', error);
    }
  };

  return {
    ...networkStatus,
    triggerSync,
    retryFailedSync,
    clearFailedSync
  };
}