'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiaryEntry, MediaItem, ApiResponse } from '@/types';
import { useSocket } from './useSocket';
import { useSession } from 'next-auth/react';

interface UseDiaryOptions {
  autoFetch?: boolean;
  limit?: number;
}

interface UseDiaryReturn {
  entries: DiaryEntry[];
  isLoading: boolean;
  error: string | null;
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
  hasWrittenToday: boolean;
}

export function useDiary(options: UseDiaryOptions = {}): UseDiaryReturn {
  const { autoFetch = true, limit = 50 } = options;
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session } = useSession();
  const { on, off, emitDiaryEntryCreated, emitDiaryEntryReplied } = useSocket();

  // Check if user has written today
  const hasWrittenToday = entries.some(entry => {
    const today = new Date().toDateString();
    return new Date(entry.date).toDateString() === today;
  });

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/diary/entries?limit=${limit}`);
      const result: ApiResponse<DiaryEntry[]> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch entries');
      }
      
      setEntries(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching diary entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Create entry
  const createEntry = useCallback(async (entryData: {
    mood: string;
    content: string;
    media: MediaItem[];
    date?: Date;
  }): Promise<DiaryEntry> => {
    setError(null);
    
    try {
      const response = await fetch('/api/diary/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      const result: ApiResponse<DiaryEntry> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create entry');
      }
      
      // Add new entry to the beginning of the list
      setEntries(prev => [result.data, ...prev]);
      
      // Emit Socket.io event for real-time notification
      if (session?.user?.name) {
        emitDiaryEntryCreated({
          entryId: result.data.id,
          authorName: session.user.name,
          mood: result.data.mood,
          date: result.data.date.toString(),
        });

        // Check if this completes an exchange
        const today = new Date().toDateString();
        const isToday = new Date(result.data.date).toDateString() === today;
        
        if (isToday && result.data.status === 'replied') {
          emitDiaryEntryReplied({
            date: result.data.date.toString(),
          });
        }
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/diary/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result: ApiResponse<DiaryEntry> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update entry');
      }
      
      // Update entry in the list
      setEntries(prev => prev.map(entry => 
        entry.id === id ? result.data : entry
      ));
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

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

  // Upload media
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

  // Refresh entries
  const refreshEntries = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchEntries();
    }
  }, [autoFetch, fetchEntries]);

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
    createEntry,
    updateEntry,
    deleteEntry,
    uploadMedia,
    refreshEntries,
    hasWrittenToday,
  };
}