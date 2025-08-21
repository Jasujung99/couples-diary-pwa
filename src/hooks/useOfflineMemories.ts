/**
 * Offline-aware memories hook
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineMemory } from '@/lib/offlineStorage';
import { backgroundSync } from '@/lib/backgroundSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface Memory {
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
}

export function useOfflineMemories(coupleId: string) {
  const [memories, setMemories] = useState<OfflineMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  // Load memories from offline storage and API
  const loadMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load from offline storage first
      const offlineMemories = await offlineStorage.getMemories(coupleId);
      setMemories(offlineMemories);

      // If online, try to fetch fresh data
      if (isOnline) {
        try {
          const response = await fetch(`/api/memories?coupleId=${coupleId}`);
          if (response.ok) {
            const onlineMemories = await response.json();
            
            // Merge online memories with offline storage
            const mergedMemories = await mergeMemories(onlineMemories, offlineMemories);
            setMemories(mergedMemories);

            // Update offline storage with fresh data
            for (const memory of onlineMemories) {
              await offlineStorage.saveMemory({
                ...memory,
                syncStatus: 'synced'
              });
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch online memories, using offline data:', fetchError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, [coupleId, isOnline]);

  // Merge online and offline memories
  const mergeMemories = async (onlineMemories: Memory[], offlineMemories: OfflineMemory[]): Promise<OfflineMemory[]> => {
    const onlineIds = new Set(onlineMemories.map(memory => memory.id));
    const offlinePendingMemories = offlineMemories.filter(memory => 
      memory.syncStatus === 'pending' && !onlineIds.has(memory.id)
    );

    const mergedMemories = [
      ...onlineMemories.map(memory => ({ ...memory, syncStatus: 'synced' as const })),
      ...offlinePendingMemories
    ];

    return mergedMemories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Create new memory
  const createMemory = useCallback(async (memoryData: Omit<Memory, 'id' | 'createdAt'>) => {
    try {
      const newMemory: OfflineMemory = {
        ...memoryData,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Save to offline storage immediately
      await offlineStorage.saveMemory(newMemory);
      setMemories(prev => [newMemory, ...prev]);

      // Add to sync queue
      await backgroundSync.addToQueue('memory', 'create', newMemory);

      return newMemory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory');
      throw err;
    }
  }, []);

  // Update memory
  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    try {
      const existingMemory = await offlineStorage.getMemory(id);
      if (!existingMemory) {
        throw new Error('Memory not found');
      }

      const updatedMemory: OfflineMemory = {
        ...existingMemory,
        ...updates,
        syncStatus: 'pending'
      };

      // Update offline storage
      await offlineStorage.saveMemory(updatedMemory);
      setMemories(prev => prev.map(memory => 
        memory.id === id ? updatedMemory : memory
      ));

      // Add to sync queue
      await backgroundSync.addToQueue('memory', 'update', updatedMemory);

      return updatedMemory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory');
      throw err;
    }
  }, []);

  // Delete memory
  const deleteMemory = useCallback(async (id: string) => {
    try {
      // Remove from offline storage
      await offlineStorage.deleteMemory(id);
      setMemories(prev => prev.filter(memory => memory.id !== id));

      // Add to sync queue if it was synced before
      const memory = memories.find(m => m.id === id);
      if (memory && memory.syncStatus === 'synced') {
        await backgroundSync.addToQueue('memory', 'delete', { id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
      throw err;
    }
  }, [memories]);

  // Get memories by date range
  const getMemoriesByDateRange = useCallback((startDate: string, endDate: string): OfflineMemory[] => {
    return memories.filter(memory => {
      const memoryDate = memory.date;
      return memoryDate >= startDate && memoryDate <= endDate;
    });
  }, [memories]);

  // Get memories by tags
  const getMemoriesByTags = useCallback((tags: string[]): OfflineMemory[] => {
    return memories.filter(memory => 
      tags.some(tag => memory.tags.includes(tag))
    );
  }, [memories]);

  // Get pending sync memories
  const getPendingMemories = useCallback((): OfflineMemory[] => {
    return memories.filter(memory => memory.syncStatus === 'pending');
  }, [memories]);

  // Refresh data
  const refresh = useCallback(() => {
    loadMemories();
  }, [loadMemories]);

  // Load memories on mount and when online status changes
  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return {
    memories,
    loading,
    error,
    isOnline,
    createMemory,
    updateMemory,
    deleteMemory,
    getMemoriesByDateRange,
    getMemoriesByTags,
    getPendingMemories,
    refresh
  };
}