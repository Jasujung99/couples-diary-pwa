import { useState, useEffect, useCallback } from 'react';
import { Memory } from '@/types';

interface UseMemoriesReturn {
  memories: Memory[];
  loading: boolean;
  error: string | null;
  createMemory: (memoryData: Partial<Memory>) => Promise<Memory | null>;
  updateMemory: (id: string, memoryData: Partial<Memory>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  refreshMemories: () => Promise<void>;
}

export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/memories');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch memories');
      }
      
      setMemories(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMemory = useCallback(async (memoryData: Partial<Memory>): Promise<Memory | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create memory');
      }
      
      const newMemory = result.data;
      setMemories(prev => [newMemory, ...prev]);
      
      return newMemory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating memory:', err);
      return null;
    }
  }, []);

  const updateMemory = useCallback(async (id: string, memoryData: Partial<Memory>): Promise<Memory | null> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update memory');
      }
      
      const updatedMemory = result.data;
      setMemories(prev => 
        prev.map(memory => memory.id === id ? updatedMemory : memory)
      );
      
      return updatedMemory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating memory:', err);
      return null;
    }
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete memory');
      }
      
      setMemories(prev => prev.filter(memory => memory.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting memory:', err);
      return false;
    }
  }, []);

  const refreshMemories = useCallback(async () => {
    await fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    refreshMemories,
  };
}