/**
 * Offline-aware date planning hook
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineDatePlan } from '@/lib/offlineStorage';
import { backgroundSync } from '@/lib/backgroundSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface DatePlan {
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
}

export function useOfflineDatePlanning(coupleId: string) {
  const [datePlans, setDatePlans] = useState<OfflineDatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  // Load date plans from offline storage and API
  const loadDatePlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load from offline storage first
      const offlinePlans = await offlineStorage.getDatePlans(coupleId);
      setDatePlans(offlinePlans);

      // If online, try to fetch fresh data
      if (isOnline) {
        try {
          const response = await fetch(`/api/dates?coupleId=${coupleId}`);
          if (response.ok) {
            const onlinePlans = await response.json();
            
            // Merge online plans with offline storage
            const mergedPlans = await mergePlans(onlinePlans, offlinePlans);
            setDatePlans(mergedPlans);

            // Update offline storage with fresh data
            for (const plan of onlinePlans) {
              await offlineStorage.saveDatePlan({
                ...plan,
                syncStatus: 'synced'
              });
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch online date plans, using offline data:', fetchError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load date plans');
    } finally {
      setLoading(false);
    }
  }, [coupleId, isOnline]);

  // Merge online and offline plans
  const mergePlans = async (onlinePlans: DatePlan[], offlinePlans: OfflineDatePlan[]): Promise<OfflineDatePlan[]> => {
    const onlineIds = new Set(onlinePlans.map(plan => plan.id));
    const offlinePendingPlans = offlinePlans.filter(plan => 
      plan.syncStatus === 'pending' && !onlineIds.has(plan.id)
    );

    const mergedPlans = [
      ...onlinePlans.map(plan => ({ ...plan, syncStatus: 'synced' as const })),
      ...offlinePendingPlans
    ];

    return mergedPlans.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Create new date plan
  const createDatePlan = useCallback(async (planData: Omit<DatePlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPlan: OfflineDatePlan = {
        ...planData,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Save to offline storage immediately
      await offlineStorage.saveDatePlan(newPlan);
      setDatePlans(prev => [newPlan, ...prev]);

      // Add to sync queue
      await backgroundSync.addToQueue('date', 'create', newPlan);

      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create date plan');
      throw err;
    }
  }, []);

  // Update date plan
  const updateDatePlan = useCallback(async (id: string, updates: Partial<DatePlan>) => {
    try {
      const existingPlan = await offlineStorage.getDatePlan(id);
      if (!existingPlan) {
        throw new Error('Date plan not found');
      }

      const updatedPlan: OfflineDatePlan = {
        ...existingPlan,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Update offline storage
      await offlineStorage.saveDatePlan(updatedPlan);
      setDatePlans(prev => prev.map(plan => 
        plan.id === id ? updatedPlan : plan
      ));

      // Add to sync queue
      await backgroundSync.addToQueue('date', 'update', updatedPlan);

      return updatedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update date plan');
      throw err;
    }
  }, []);

  // Delete date plan
  const deleteDatePlan = useCallback(async (id: string) => {
    try {
      // Remove from offline storage
      await offlineStorage.deleteDatePlan(id);
      setDatePlans(prev => prev.filter(plan => plan.id !== id));

      // Add to sync queue if it was synced before
      const plan = datePlans.find(p => p.id === id);
      if (plan && plan.syncStatus === 'synced') {
        await backgroundSync.addToQueue('date', 'delete', { id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete date plan');
      throw err;
    }
  }, [datePlans]);

  // Get pending sync plans
  const getPendingPlans = useCallback((): OfflineDatePlan[] => {
    return datePlans.filter(plan => plan.syncStatus === 'pending');
  }, [datePlans]);

  // Refresh data
  const refresh = useCallback(() => {
    loadDatePlans();
  }, [loadDatePlans]);

  // Load plans on mount and when online status changes
  useEffect(() => {
    loadDatePlans();
  }, [loadDatePlans]);

  return {
    datePlans,
    loading,
    error,
    isOnline,
    createDatePlan,
    updateDatePlan,
    deleteDatePlan,
    getPendingPlans,
    refresh
  };
}