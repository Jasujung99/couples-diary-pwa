/**
 * Background sync functionality for offline diary entries
 * Handles syncing data when connection is restored
 */

import { offlineStorage, SyncQueueItem } from './offlineStorage';

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedItems: number;
  failedItems: number;
}

class BackgroundSync {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.registerServiceWorkerSync();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerSync();
      }
    });
  }

  private async registerServiceWorkerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Register background sync
        await registration.sync.register('background-sync');
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  async addToQueue(type: 'diary' | 'date' | 'memory', action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${type}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    await offlineStorage.addToSyncQueue(queueItem);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.triggerSync();
    }
  }

  async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, error: 'Sync already in progress or offline', syncedItems: 0, failedItems: 0 };
    }

    this.syncInProgress = true;
    let syncedItems = 0;
    let failedItems = 0;

    try {
      const queueItems = await offlineStorage.getSyncQueue();
      
      for (const item of queueItems) {
        try {
          const success = await this.syncItem(item);
          if (success) {
            await offlineStorage.removeSyncQueueItem(item.id);
            syncedItems++;
          } else {
            // Increment retry count
            item.retryCount++;
            if (item.retryCount >= this.maxRetries) {
              // Remove from queue after max retries
              await offlineStorage.removeSyncQueueItem(item.id);
              failedItems++;
            } else {
              // Update retry count
              await offlineStorage.updateSyncQueueItem(item);
              failedItems++;
            }
          }
        } catch (error) {
          console.error('Error syncing item:', error);
          item.retryCount++;
          item.lastError = error instanceof Error ? error.message : 'Unknown error';
          
          if (item.retryCount >= this.maxRetries) {
            await offlineStorage.removeSyncQueueItem(item.id);
          } else {
            await offlineStorage.updateSyncQueueItem(item);
          }
          failedItems++;
        }
      }

      return { success: true, syncedItems, failedItems };
    } catch (error) {
      console.error('Background sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedItems,
        failedItems
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      let url = '';
      let method = 'POST';
      let body = JSON.stringify(item.data);

      switch (item.type) {
        case 'diary':
          url = `${baseUrl}/api/diary/entries`;
          if (item.action === 'update') {
            url = `${baseUrl}/api/diary/entries/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            url = `${baseUrl}/api/diary/entries/${item.data.id}`;
            method = 'DELETE';
            body = '';
          }
          break;

        case 'date':
          url = `${baseUrl}/api/dates`;
          if (item.action === 'update') {
            url = `${baseUrl}/api/dates/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            url = `${baseUrl}/api/dates/${item.data.id}`;
            method = 'DELETE';
            body = '';
          }
          break;

        case 'memory':
          url = `${baseUrl}/api/memories`;
          if (item.action === 'update') {
            url = `${baseUrl}/api/memories/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            url = `${baseUrl}/api/memories/${item.data.id}`;
            method = 'DELETE';
            body = '';
          }
          break;

        default:
          throw new Error(`Unknown sync item type: ${item.type}`);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if available
          ...(this.getAuthHeaders())
        },
        body: method === 'DELETE' ? undefined : body
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local storage with synced data
      if (item.action !== 'delete') {
        const syncedData = await response.json();
        await this.updateLocalStorage(item.type, { ...item.data, ...syncedData, syncStatus: 'synced' });
      }

      return true;
    } catch (error) {
      console.error(`Failed to sync ${item.type} ${item.action}:`, error);
      return false;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    // Get auth token from localStorage or session
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    }
    return {};
  }

  private async updateLocalStorage(type: string, data: any): Promise<void> {
    switch (type) {
      case 'diary':
        await offlineStorage.saveDiaryEntry(data);
        break;
      case 'date':
        await offlineStorage.saveDatePlan(data);
        break;
      case 'memory':
        await offlineStorage.saveMemory(data);
        break;
    }
  }

  async getQueueStatus(): Promise<{ pending: number; failed: number }> {
    const queueItems = await offlineStorage.getSyncQueue();
    const pending = queueItems.filter(item => item.retryCount < this.maxRetries).length;
    const failed = queueItems.filter(item => item.retryCount >= this.maxRetries).length;
    return { pending, failed };
  }

  async clearFailedItems(): Promise<void> {
    const queueItems = await offlineStorage.getSyncQueue();
    const failedItems = queueItems.filter(item => item.retryCount >= this.maxRetries);
    
    for (const item of failedItems) {
      await offlineStorage.removeSyncQueueItem(item.id);
    }
  }

  async retryFailedItems(): Promise<void> {
    const queueItems = await offlineStorage.getSyncQueue();
    const failedItems = queueItems.filter(item => item.retryCount >= this.maxRetries);
    
    for (const item of failedItems) {
      item.retryCount = 0;
      item.lastError = undefined;
      await offlineStorage.updateSyncQueueItem(item);
    }

    if (this.isOnline) {
      this.triggerSync();
    }
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const backgroundSync = new BackgroundSync();