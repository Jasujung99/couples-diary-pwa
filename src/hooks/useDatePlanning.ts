import { useState, useEffect, useCallback } from 'react';
import { DatePlan, ChecklistItem } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

interface UseDatePlanningReturn {
  datePlans: DatePlan[];
  isLoading: boolean;
  error: string | null;
  createDatePlan: (datePlan: Omit<DatePlan, 'id' | 'coupleId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<DatePlan>;
  updateDatePlan: (id: string, updates: Partial<DatePlan>) => Promise<DatePlan>;
  deleteDatePlan: (id: string) => Promise<void>;
  updateChecklist: (id: string, checklist: ChecklistItem[]) => Promise<DatePlan>;
  getDatePlan: (id: string) => DatePlan | undefined;
  getUpcomingDates: () => DatePlan[];
  getCompletedDates: () => DatePlan[];
  getProgressPercentage: (datePlan: DatePlan) => number;
  refreshDatePlans: () => Promise<void>;
}

export function useDatePlanning(): UseDatePlanningReturn {
  const [datePlans, setDatePlans] = useState<DatePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { authState } = useAuth();

  const fetchDatePlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/dates');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch date plans');
      }
      
      setDatePlans(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching date plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDatePlan = useCallback(async (datePlanData: Omit<DatePlan, 'id' | 'coupleId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datePlanData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create date plan');
      }
      
      const newDatePlan = result.data;
      setDatePlans(prev => [...prev, newDatePlan]);
      
      // Emit socket event for real-time updates
      if (socket?.connected) {
        socket.emit('date-plan-created', {
          datePlanId: newDatePlan.id,
          title: newDatePlan.title,
          scheduledAt: newDatePlan.scheduledAt,
          location: newDatePlan.location,
          createdByName: authState.user?.name
        });
      }
      
      return newDatePlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create date plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [socket, authState.user?.name]);

  const updateDatePlan = useCallback(async (id: string, updates: Partial<DatePlan>) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/dates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update date plan');
      }
      
      const updatedDatePlan = result.data;
      setDatePlans(prev => prev.map(plan => plan.id === id ? updatedDatePlan : plan));
      
      // Emit socket event for real-time updates
      if (socket?.connected) {
        socket.emit('date-plan-updated', {
          datePlanId: id,
          changes: updates,
          updatedByName: authState.user?.name
        });
      }
      
      return updatedDatePlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update date plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [socket, authState.user?.name]);

  const deleteDatePlan = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/dates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete date plan');
      }
      
      setDatePlans(prev => prev.filter(plan => plan.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete date plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateChecklist = useCallback(async (id: string, checklist: ChecklistItem[]) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/dates/${id}/checklist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checklist }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update checklist');
      }
      
      const updatedDatePlan = result.data;
      setDatePlans(prev => prev.map(plan => plan.id === id ? updatedDatePlan : plan));
      
      // Emit socket event for real-time updates
      if (socket?.connected) {
        socket.emit('checklist-updated', {
          datePlanId: id,
          checklist,
          updatedByName: authState.user?.name
        });
        
        // Check if any items were just completed and emit specific events
        const originalPlan = datePlans.find(plan => plan.id === id);
        if (originalPlan) {
          const newlyCompleted = checklist.filter(item => {
            const originalItem = originalPlan.checklist?.find(orig => orig.id === item.id);
            return item.completed && originalItem && !originalItem.completed;
          });
          
          newlyCompleted.forEach(item => {
            socket.emit('checklist-item-completed', {
              datePlanId: id,
              itemId: item.id,
              itemText: item.text,
              completedByName: authState.user?.name
            });
          });
        }
      }
      
      return updatedDatePlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update checklist';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [socket, authState.user?.name, datePlans]);

  const getDatePlan = useCallback((id: string) => {
    return datePlans.find(plan => plan.id === id);
  }, [datePlans]);

  const getUpcomingDates = useCallback(() => {
    const now = new Date();
    return datePlans
      .filter(plan => new Date(plan.scheduledAt) >= now && plan.status === 'planned')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [datePlans]);

  const getCompletedDates = useCallback(() => {
    return datePlans
      .filter(plan => plan.status === 'completed')
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [datePlans]);

  const getProgressPercentage = useCallback((datePlan: DatePlan) => {
    if (!datePlan.checklist || datePlan.checklist.length === 0) {
      return 0;
    }
    
    const completedItems = datePlan.checklist.filter(item => item.completed).length;
    return Math.round((completedItems / datePlan.checklist.length) * 100);
  }, []);

  const refreshDatePlans = useCallback(async () => {
    await fetchDatePlans();
  }, [fetchDatePlans]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewDatePlan = (_data: unknown) => {
      // Refresh date plans to get the new one
      fetchDatePlans();
    };

    const handleDatePlanChanged = (_data: unknown) => {
      // Refresh date plans to get the updated one
      fetchDatePlans();
    };

    const handleChecklistChanged = (data: { datePlanId: string; checklist: ChecklistItem[] }) => {
      setDatePlans(prev => prev.map(plan => 
        plan.id === data.datePlanId 
          ? { ...plan, checklist: data.checklist }
          : plan
      ));
    };

    const handleChecklistItemDone = (data: { completedByName: string; itemText: string }) => {
      // Could show a toast notification here
      console.log(`${data.completedByName} completed: ${data.itemText}`);
    };

    socket.on('new-date-plan', handleNewDatePlan);
    socket.on('date-plan-changed', handleDatePlanChanged);
    socket.on('checklist-changed', handleChecklistChanged);
    socket.on('checklist-item-done', handleChecklistItemDone);

    return () => {
      socket.off('new-date-plan', handleNewDatePlan);
      socket.off('date-plan-changed', handleDatePlanChanged);
      socket.off('checklist-changed', handleChecklistChanged);
      socket.off('checklist-item-done', handleChecklistItemDone);
    };
  }, [socket, fetchDatePlans]);

  useEffect(() => {
    fetchDatePlans();
  }, [fetchDatePlans]);

  return {
    datePlans,
    isLoading,
    error,
    createDatePlan,
    updateDatePlan,
    deleteDatePlan,
    updateChecklist,
    getDatePlan,
    getUpcomingDates,
    getCompletedDates,
    getProgressPercentage,
    refreshDatePlans,
  };
}