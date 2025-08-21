import { useState, useEffect, useCallback } from 'react';

export interface Milestone {
  days: number;
  name: string;
  type: 'special' | 'weekly' | 'monthly' | 'major' | 'anniversary';
  date: Date;
  isPassed: boolean;
  isUpcoming: boolean;
  daysUntil: number;
  daysTogether: number;
}

export interface MilestoneData {
  daysTogether: number;
  milestones: Milestone[];
  nextMilestone?: Milestone;
  recentMilestones: Milestone[];
  upcomingMilestones: Milestone[];
}

interface UseMilestonesReturn {
  milestoneData: MilestoneData | null;
  loading: boolean;
  error: string | null;
  refreshMilestones: () => Promise<void>;
}

export function useMilestones(): UseMilestonesReturn {
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/milestones');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch milestones');
      }
      
      setMilestoneData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMilestones = useCallback(async () => {
    await fetchMilestones();
  }, [fetchMilestones]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  return {
    milestoneData,
    loading,
    error,
    refreshMilestones,
  };
}