/**
 * Tests for offline storage functionality
 */

import { offlineStorage, OfflineDiaryEntry, SyncQueueItem } from '../offlineStorage';

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: jest.fn(),
  objectStoreNames: { contains: jest.fn() },
  createObjectStore: jest.fn(),
  close: jest.fn()
};

const mockIDBObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn()
};

const mockIDBTransaction = {
  objectStore: jest.fn(() => mockIDBObjectStore),
  oncomplete: null,
  onerror: null
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

// Mock IndexedDB globally
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn(() => {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        request.result = mockIDBDatabase;
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    })
  }
});

mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);

describe('OfflineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Diary Entries', () => {
    const mockEntry: OfflineDiaryEntry = {
      id: 'test-entry-1',
      authorId: 'user-1',
      coupleId: 'couple-1',
      mood: 'happy',
      content: 'Test diary entry',
      media: [],
      date: '2024-01-01',
      status: 'waiting',
      isEncrypted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      syncStatus: 'pending'
    };

    it('should save diary entry', async () => {
      mockIDBObjectStore.put.mockImplementation((entry) => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.saveDiaryEntry(mockEntry)).resolves.toBeUndefined();
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(mockEntry);
    });

    it('should get diary entries by couple ID', async () => {
      const mockEntries = [mockEntry];
      const mockIndex = {
        getAll: jest.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockEntries;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        })
      };

      mockIDBObjectStore.index.mockReturnValue(mockIndex);

      const result = await offlineStorage.getDiaryEntries('couple-1');
      expect(result).toEqual(mockEntries);
      expect(mockIndex.getAll).toHaveBeenCalledWith('couple-1');
    });

    it('should get single diary entry', async () => {
      mockIDBObjectStore.get.mockImplementation((id) => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          request.result = id === 'test-entry-1' ? mockEntry : null;
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      const result = await offlineStorage.getDiaryEntry('test-entry-1');
      expect(result).toEqual(mockEntry);
    });

    it('should delete diary entry', async () => {
      mockIDBObjectStore.delete.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.deleteDiaryEntry('test-entry-1')).resolves.toBeUndefined();
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('test-entry-1');
    });
  });

  describe('Sync Queue', () => {
    const mockSyncItem: SyncQueueItem = {
      id: 'sync-1',
      type: 'diary',
      action: 'create',
      data: { id: 'test-entry-1' },
      timestamp: '2024-01-01T00:00:00Z',
      retryCount: 0
    };

    it('should add item to sync queue', async () => {
      mockIDBObjectStore.put.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.addToSyncQueue(mockSyncItem)).resolves.toBeUndefined();
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(mockSyncItem);
    });

    it('should get sync queue items', async () => {
      const mockItems = [mockSyncItem];
      mockIDBObjectStore.getAll.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          request.result = mockItems;
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      const result = await offlineStorage.getSyncQueue();
      expect(result).toEqual(mockItems);
    });

    it('should remove sync queue item', async () => {
      mockIDBObjectStore.delete.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.removeSyncQueueItem('sync-1')).resolves.toBeUndefined();
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('sync-1');
    });
  });

  describe('Storage Management', () => {
    it('should clear all data', async () => {
      mockIDBObjectStore.clear.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.clearAllData()).resolves.toBeUndefined();
      expect(mockIDBObjectStore.clear).toHaveBeenCalledTimes(5); // 5 stores
    });

    it('should get storage usage', async () => {
      // Mock navigator.storage.estimate
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            usage: 1024 * 1024, // 1MB
            quota: 1024 * 1024 * 100 // 100MB
          })
        },
        configurable: true
      });

      const result = await offlineStorage.getStorageUsage();
      expect(result).toEqual({
        used: 1024 * 1024,
        quota: 1024 * 1024 * 100
      });
    });
  });
});