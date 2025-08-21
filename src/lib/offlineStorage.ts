/**
 * IndexedDB storage for offline data persistence
 * Handles diary entries, date plans, memories, and sync queue
 */

export interface OfflineDiaryEntry {
  id: string;
  authorId: string;
  coupleId: string;
  mood: string;
  content: string;
  media: any[];
  date: string;
  status: 'waiting' | 'replied';
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface OfflineDatePlan {
  id: string;
  coupleId: string;
  title: string;
  scheduledAt: string;
  location: string;
  notes?: string;
  budget: number;
  checklist: any[];
  createdBy: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface OfflineMemory {
  id: string;
  coupleId: string;
  title: string;
  location: string;
  date: string;
  photos: any[];
  tags: string[];
  color: string;
  createdBy: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SyncQueueItem {
  id: string;
  type: 'diary' | 'date' | 'memory';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'CouplesDiaryOffline';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Diary entries store
        if (!db.objectStoreNames.contains('diaryEntries')) {
          const diaryStore = db.createObjectStore('diaryEntries', { keyPath: 'id' });
          diaryStore.createIndex('coupleId', 'coupleId', { unique: false });
          diaryStore.createIndex('date', 'date', { unique: false });
          diaryStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Date plans store
        if (!db.objectStoreNames.contains('datePlans')) {
          const dateStore = db.createObjectStore('datePlans', { keyPath: 'id' });
          dateStore.createIndex('coupleId', 'coupleId', { unique: false });
          dateStore.createIndex('scheduledAt', 'scheduledAt', { unique: false });
          dateStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Memories store
        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('coupleId', 'coupleId', { unique: false });
          memoryStore.createIndex('date', 'date', { unique: false });
          memoryStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Diary entries methods
  async saveDiaryEntry(entry: OfflineDiaryEntry): Promise<void> {
    const store = await this.getStore('diaryEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDiaryEntries(coupleId: string): Promise<OfflineDiaryEntry[]> {
    const store = await this.getStore('diaryEntries');
    const index = store.index('coupleId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(coupleId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getDiaryEntry(id: string): Promise<OfflineDiaryEntry | null> {
    const store = await this.getStore('diaryEntries');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDiaryEntry(id: string): Promise<void> {
    const store = await this.getStore('diaryEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Date plans methods
  async saveDatePlan(datePlan: OfflineDatePlan): Promise<void> {
    const store = await this.getStore('datePlans', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(datePlan);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDatePlans(coupleId: string): Promise<OfflineDatePlan[]> {
    const store = await this.getStore('datePlans');
    const index = store.index('coupleId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(coupleId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getDatePlan(id: string): Promise<OfflineDatePlan | null> {
    const store = await this.getStore('datePlans');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDatePlan(id: string): Promise<void> {
    const store = await this.getStore('datePlans', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Memories methods
  async saveMemory(memory: OfflineMemory): Promise<void> {
    const store = await this.getStore('memories', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(memory);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMemories(coupleId: string): Promise<OfflineMemory[]> {
    const store = await this.getStore('memories');
    const index = store.index('coupleId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(coupleId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getMemory(id: string): Promise<OfflineMemory | null> {
    const store = await this.getStore('memories');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMemory(id: string): Promise<void> {
    const store = await this.getStore('memories', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue methods
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const store = await this.getStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // User preferences methods
  async saveUserPreference(key: string, value: any): Promise<void> {
    const store = await this.getStore('userPreferences', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserPreference(key: string): Promise<any> {
    const store = await this.getStore('userPreferences');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) return;

    const storeNames = ['diaryEntries', 'datePlans', 'memories', 'syncQueue', 'userPreferences'];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    const promises = storeNames.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const offlineStorage = new OfflineStorage();