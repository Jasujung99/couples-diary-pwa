/**
 * Offline provider component that initializes offline functionality
 */

'use client';

import { useEffect } from 'react';
import { initializeServiceWorker, requestNotificationPermission } from '@/lib/serviceWorker';
import { offlineStorage } from '@/lib/offlineStorage';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize offline functionality
    const initOffline = async () => {
      try {
        // Initialize IndexedDB storage
        await offlineStorage.init();
        console.log('Offline storage initialized');

        // Initialize service worker
        initializeServiceWorker();

        // Request notification permission
        await requestNotificationPermission();

      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
      }
    };

    initOffline();
  }, []);

  return <>{children}</>;
}