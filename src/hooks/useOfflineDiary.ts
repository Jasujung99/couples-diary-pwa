/**
 * Offline-aware diary hook that handles local storage and sync
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineDiaryEntry } from '@/lib/offlineStorage';
import { backgroundSync } from '@/lib/backgroundSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface DiaryEntry {
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
}

export function useOfflineDiary(coupleId: string) {
  const [entries, setEntries] = useState<OfflineDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  // Load entries from offline storage and API
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load from offline storage first
      const offlineEntries = await offlineStorage.getDiaryEntries(coupleId);
      setEntries(offlineEntries);

      // If online, try to fetch fresh data
      if (isOnline) {
        try {
          const response = await fetch(`/api/diary/entries?coupleId=${coupleId}`);
          if (response.ok) {
            const onlineEntries = await response.json();
            
            // Merge online entries with offline storage
            const mergedEntries = await mergeEntries(onlineEntries, offlineEntries);
            setEntries(mergedEntries);

            // Update offline storage with fresh data
            for (const entry of onlineEntries) {
              await offlineStorage.saveDiaryEntry({
                ...entry,
                syncStatus: 'synced'
              });
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch online entries, using offline data:', fetchError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diary entries');
    } finally {
      setLoading(false);
    }
  }, [coupleId, isOnline]);

  // Merge online and offline entries, prioritizing online data
  const mergeEntries = async (onlineEntries: DiaryEntry[], offlineEntries: OfflineDiaryEntry[]): Promise<OfflineDiaryEntry[]> => {
    const onlineIds = new Set(onlineEntries.map(entry => entry.id));
    const offlinePendingEntries = offlineEntries.filter(entry => 
      entry.syncStatus === 'pending' && !onlineIds.has(entry.id)
    );

    const mergedEntries = [
      ...onlineEntries.map(entry => ({ ...entry, syncStatus: 'synced' as const })),
      ...offlinePendingEntries
    ];

    return mergedEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Create new diary entry
  const createEntry = useCallback(async (entryData: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEntry: OfflineDiaryEntry = {
        ...entryData,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Save to offline storage immediately
      await offlineStorage.saveDiaryEntry(newEntry);
      setEntries(prev => [newEntry, ...prev]);

      // Add to sync queue
      await backgroundSync.addToQueue('diary', 'create', newEntry);

      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create diary entry');
      throw err;
    }
  }, []);

  // Update diary entry
  const updateEntry = useCallback(async (id: string, updates: Partial<DiaryEntry>) => {
    try {
      const existingEntry = await offlineStorage.getDiaryEntry(id);
      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      const updatedEntry: OfflineDiaryEntry = {
        ...existingEntry,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Update offline storage
      await offlineStorage.saveDiaryEntry(updatedEntry);
      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ));

      // Add to sync queue
      await backgroundSync.addToQueue('diary', 'update', updatedEntry);

      return updatedEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update diary entry');
      throw err;
    }
  }, []);

  // Delete diary entry
  const deleteEntry = useCallback(async (id: string) => {
    try {
      // Remove from offline storage
      await offlineStorage.deleteDiaryEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));

      // Add to sync queue if it was synced before
      const entry = entries.find(e => e.id === id);
      if (entry && entry.syncStatus === 'synced') {
        await backgroundSync.addToQueue('diary', 'delete', { id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diary entry');
      throw err;
    }
  }, [entries]);

  // Get entry by ID
  const getEntry = useCallback(async (id: string): Promise<OfflineDiaryEntry | null> => {
    return await offlineStorage.getDiaryEntry(id);
  }, []);

  // Get entries by date range
  const getEntriesByDateRange = useCallback((startDate: string, endDate: string): OfflineDiaryEntry[] => {
    return entries.filter(entry => {
      const entryDate = entry.date;
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries]);

  // Get pending sync entries
  const getPendingEntries = useCallback((): OfflineDiaryEntry[] => {
    return entries.filter(entry => entry.syncStatus === 'pending');
  }, [entries]);

  // Refresh data
  const refresh = useCallback(() => {
    loadEntries();
  }, [loadEntries]);

  // Load entries on mount and when online status changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    error,
    isOnline,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getEntriesByDateRange,
    getPendingEntries,
    refresh
  };
}