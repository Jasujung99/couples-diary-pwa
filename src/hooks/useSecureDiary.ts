'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiaryEntry, MediaItem, ApiResponse } from '@/types';
import { useSocket } from './useSocket';
import { useSession } from 'next-auth/react';
import { SecureDiaryService } from '@/lib/secureDiary';
import { CoupleKeyManager } from '@/lib/keyManager';

interface UseSecureDiaryOptions {
  autoFetch?: boolean;
  limit?: number;
  coupleId: string;
}

interface UseSecureDiaryReturn {
  entries: DiaryEntry[];
  isLoading: boolean;
  error: string | null;
  encryptionStatus: {
    isEncrypted: boolean;
    keyAvailable: boolean;
  };
  createEntry: (entry: {
    mood: string;
    content: string;
    media: MediaItem[];
    date?: Date;
  }) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<DiaryEntry>;
  deleteEntry: (id: string) => Promise<void>;
  uploadMedia: (files: File[]) => Promise<MediaItem[]>;
  refreshEntries: () => Promise<void>;
  searchEntries: (query: string) => Promise<DiaryEntry[]>;
  initializeEncryption: () => Promise<void>;
  hasWrittenToday: boolean;
}

export function useSecureDiary(options: UseSecureDiaryOptions): UseSecureDiaryReturn {
  const { autoFetch = true, limit = 50, coupleId } = options;
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionStatus, setEncryptionStatus] = useState({
    isEncrypted: false,
    keyAvailable: false,
  });
  
  const { data: session } = useSession();
  const { on, off, emitDiaryEntryCreated, emitDiaryEntryReplied } = useSocket();
  
  const diaryService = new SecureDiaryService();
  const keyManager = CoupleKeyManager.getInstance();

  // Check if user has written today
  const hasWrittenToday = entries.some(entry => {
    const today = new Date().toDateString();
    return new Date(entry.date).toDateString() === today && 
           entry.authorId === session?.user?.id;
  });

  // Load encryption status
  const loadEncryptionStatus = useCallback(async () => {
    try {
      const status = await diaryService.getEncryptionStatus(coupleId);
      setEncryptionStatus({
        isEncrypted: status.isEncrypted,
        keyAvailable: status.keyAvailable,
      });
    } catch (error) {
      console.error('Failed to load encryption status:', error);
    }
  }, [coupleId, diaryService]);

  // Fetch entries with decryption
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const decryptedEntries = await diaryService.getSecureEntries(coupleId, limit);
      setEntries(decryptedEntries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching secure diary entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [coupleId, limit, diaryService]);

  // Create encrypted entry
  const createEntry = useCallback(async (entryData: {
    mood: string;
    content: string;
    media: MediaItem[];
    date?: Date;
  }): Promise<DiaryEntry> => {
    setError(null);
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const result = await diaryService.createSecureEntry(
        coupleId,
        session.user.id,
        entryData.content,
        entryData.mood,
        entryData.media
      );
      
      if (!result.success || !result.entry) {
        throw new Error(result.error || 'Failed to create entry');
      }
      
      // Add new entry to the beginning of the list
      setEntries(prev => [result.entry!, ...prev]);
      
      // Emit Socket.io event for real-time notification
      if (session?.user?.name) {
        emitDiaryEntryCreated({
          entryId: result.entry.id,
          authorName: session.user.name,
          mood: result.entry.mood,
          date: result.entry.date.toString(),
        });

        // Check if this completes an exchange
        const today = new Date().toDateString();
        const isToday = new Date(result.entry.date).toDateString() === today;
        
        if (isToday && result.entry.status === 'replied') {
          emitDiaryEntryReplied({
            date: result.entry.date.toString(),
          });
        }
      }
      
      return result.entry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [coupleId, session?.user?.id, session?.user?.name, diaryService, emitDiaryEntryCreated, emitDiaryEntryReplied]);

  // Update encrypted entry
  const updateEntry = useCallback(async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> => {
    setError(null);
    
    try {
      const result = await diaryService.updateSecureEntry(id, coupleId, updates);
      
      if (!result.success || !result.entry) {
        throw new Error(result.error || 'Failed to update entry');
      }
      
      // Update entry in the list
      setEntries(prev => prev.map(entry => 
        entry.id === id ? result.entry! : entry
      ));
      
      return result.entry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [coupleId, diaryService]);

  // Delete entry
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/diary/entries/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete entry');
      }
      
      // Remove entry from the list
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Upload media (with encryption support)
  const uploadMedia = useCallback(async (files: File[]): Promise<MediaItem[]> => {
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/diary/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result: ApiResponse<MediaItem[]> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload media');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Search encrypted entries
  const searchEntries = useCallback(async (query: string): Promise<DiaryEntry[]> => {
    setError(null);
    
    try {
      const results = await diaryService.searchSecureEntries(coupleId, query, {
        authorId: session?.user?.id,
      });
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    }
  }, [coupleId, session?.user?.id, diaryService]);

  // Initialize encryption
  const initializeEncryption = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      await keyManager.initializeCoupleKeys({
        userId: session.user.id,
        coupleId,
      });
      
      await loadEncryptionStatus();
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }, [session?.user?.id, coupleId, keyManager, loadEncryptionStatus]);

  // Refresh entries
  const refreshEntries = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && coupleId) {
      loadEncryptionStatus();
      fetchEntries();
    }
  }, [autoFetch, coupleId, loadEncryptionStatus, fetchEntries]);

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    const handleNewDiaryEntry = (data: {
      entryId: string;
      authorId: string;
      authorName: string;
      mood: string;
      date: string;
      timestamp: Date;
    }) => {
      // Only refresh if it's not from the current user
      if (session?.user?.id && data.authorId !== session.user.id) {
        refreshEntries();
      }
    };

    const handleDiaryExchangeComplete = (data: {
      date: string;
      timestamp: Date;
    }) => {
      // Update entries to reflect completed exchange
      const exchangeDate = new Date(data.date).toDateString();
      setEntries(prev => 
        prev.map(entry => {
          const entryDate = new Date(entry.date).toDateString();
          return entryDate === exchangeDate 
            ? { ...entry, status: 'replied' as const }
            : entry;
        })
      );
    };

    // Register event listeners
    on('new-diary-entry', handleNewDiaryEntry);
    on('diary-exchange-complete', handleDiaryExchangeComplete);

    // Cleanup
    return () => {
      off('new-diary-entry', handleNewDiaryEntry);
      off('diary-exchange-complete', handleDiaryExchangeComplete);
    };
  }, [session?.user?.id, on, off, refreshEntries]);

  return {
    entries,
    isLoading,
    error,
    encryptionStatus,
    createEntry,
    updateEntry,
    deleteEntry,
    uploadMedia,
    refreshEntries,
    searchEntries,
    initializeEncryption,
    hasWrittenToday,
  };
}