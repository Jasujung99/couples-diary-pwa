import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatePlan, DiaryEntry, Memory } from '@/types';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useDiary } from '@/hooks/useDiary';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface CalendarEvent {
  id: string;
  type: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  date: Date;
  color: string;
  data?: DatePlan | DiaryEntry | Memory;
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];
  scheduleReminder: (event: CalendarEvent, reminderTime: Date) => Promise<void>;
  cancelReminder: (eventId: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

export function useCalendar(memories: Memory[] = []): UseCalendarReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { datePlans, refreshDatePlans } = useDatePlanning();
  const { entries: diaryEntries, refreshEntries } = useDiary();
  const { scheduleNotification, cancelNotification } = useNotifications();
  const { authState } = useAuth();

  // Generate all calendar events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    try {
      // Add date plans
      datePlans.forEach(plan => {
        allEvents.push({
          id: `date-${plan.id}`,
          type: 'date',
          title: plan.title,
          date: new Date(plan.scheduledAt),
          color: plan.status === 'completed' ? '#10B981' : plan.status === 'cancelled' ? '#EF4444' : '#3B82F6',
          data: plan
        });
      });

      // Add diary entries
      diaryEntries.forEach(entry => {
        allEvents.push({
          id: `diary-${entry.id}`,
          type: 'diary',
          title: '일기 작성',
          date: new Date(entry.date),
          color: '#8B5CF6',
          data: entry
        });
      });

      // Add memories
      memories.forEach(memory => {
        allEvents.push({
          id: `memory-${memory.id}`,
          type: 'memory',
          title: memory.title,
          date: new Date(memory.date),
          color: memory.color || '#F59E0B',
          data: memory
        });
      });

      // Add relationship milestones
      if (authState.user?.relationshipStartDate) {
        const startDate = new Date(authState.user.relationshipStartDate);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Calculate days since relationship started
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Define milestone intervals
        const milestones = [
          { days: 100, label: 'D+100' },
          { days: 200, label: 'D+200' },
          { days: 300, label: 'D+300' },
          { days: 365, label: '1주년' },
          { days: 500, label: 'D+500' },
          { days: 730, label: '2주년' },
          { days: 1000, label: 'D+1000' },
          { days: 1095, label: '3주년' },
          { days: 1460, label: '4주년' },
          { days: 1825, label: '5주년' }
        ];
        
        milestones.forEach(milestone => {
          const milestoneDate = new Date(startDate);
          milestoneDate.setDate(milestoneDate.getDate() + milestone.days);
          
          // Add milestones for current year and next year
          if (milestoneDate.getFullYear() >= currentYear - 1 && milestoneDate.getFullYear() <= currentYear + 1) {
            allEvents.push({
              id: `milestone-${milestone.days}`,
              type: 'milestone',
              title: milestone.label,
              date: milestoneDate,
              color: '#EC4899'
            });
          }
        });

        // Add monthly anniversaries (same day each month)
        for (let month = 0; month < 12; month++) {
          const monthlyAnniversary = new Date(currentYear, month, startDate.getDate());
          if (monthlyAnniversary >= startDate && monthlyAnniversary.getMonth() !== startDate.getMonth()) {
            const monthsCount = (currentYear - startDate.getFullYear()) * 12 + month - startDate.getMonth();
            if (monthsCount > 0) {
              allEvents.push({
                id: `monthly-${month}`,
                type: 'milestone',
                title: `${monthsCount}개월`,
                date: monthlyAnniversary,
                color: '#F472B6'
              });
            }
          }
        }
      }

      // Sort events by date
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      
    } catch (err) {
      console.error('Error generating calendar events:', err);
      setError('이벤트를 불러오는 중 오류가 발생했습니다.');
    }

    return allEvents;
  }, [datePlans, diaryEntries, memories, authState.user?.relationshipStartDate]);

  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  }, [events]);

  const getEventsForMonth = useCallback((year: number, month: number) => {
    return events.filter(event => 
      event.date.getFullYear() === year && event.date.getMonth() === month
    );
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return events.filter(event => 
      event.date >= now && event.date <= futureDate
    ).slice(0, 10); // Limit to 10 events
  }, [events]);

  const scheduleReminder = useCallback(async (event: CalendarEvent, reminderTime: Date) => {
    try {
      const notificationTitle = `${event.title} 알림`;
      let notificationBody = '';
      
      switch (event.type) {
        case 'date':
          notificationBody = `데이트가 곧 시작됩니다: ${event.title}`;
          break;
        case 'diary':
          notificationBody = '오늘의 일기를 작성해보세요';
          break;
        case 'memory':
          notificationBody = `추억을 되돌아보세요: ${event.title}`;
          break;
        case 'milestone':
          notificationBody = `특별한 날입니다: ${event.title}`;
          break;
      }

      await scheduleNotification({
        id: `reminder-${event.id}`,
        title: notificationTitle,
        body: notificationBody,
        scheduledTime: reminderTime,
        data: {
          eventId: event.id,
          eventType: event.type,
          eventDate: event.date.toISOString()
        }
      });
    } catch (err) {
      console.error('Error scheduling reminder:', err);
      throw new Error('알림 설정에 실패했습니다.');
    }
  }, [scheduleNotification]);

  const cancelReminder = useCallback(async (eventId: string) => {
    try {
      await cancelNotification(`reminder-${eventId}`);
    } catch (err) {
      console.error('Error canceling reminder:', err);
      throw new Error('알림 취소에 실패했습니다.');
    }
  }, [cancelNotification]);

  const refreshEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        refreshDatePlans(),
        refreshEntries()
      ]);
    } catch (err) {
      console.error('Error refreshing events:', err);
      setError('이벤트를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshDatePlans, refreshEntries]);

  // Auto-schedule reminders for upcoming date plans
  useEffect(() => {
    const scheduleUpcomingReminders = async () => {
      const upcomingDates = datePlans.filter(plan => {
        const planDate = new Date(plan.scheduledAt);
        const now = new Date();
        const daysDiff = (planDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 7 && plan.status === 'planned';
      });

      for (const datePlan of upcomingDates) {
        try {
          // Schedule reminder 1 day before
          const reminderTime = new Date(datePlan.scheduledAt);
          reminderTime.setDate(reminderTime.getDate() - 1);
          reminderTime.setHours(20, 0, 0, 0); // 8 PM the day before
          
          if (reminderTime > new Date()) {
            const event: CalendarEvent = {
              id: `date-${datePlan.id}`,
              type: 'date',
              title: datePlan.title,
              date: new Date(datePlan.scheduledAt),
              color: '#3B82F6',
              data: datePlan
            };
            
            await scheduleReminder(event, reminderTime);
          }
        } catch (err) {
          console.error('Error scheduling automatic reminder:', err);
        }
      }
    };

    if (datePlans.length > 0) {
      scheduleUpcomingReminders();
    }
  }, [datePlans, scheduleReminder]);

  // Auto-schedule milestone reminders
  useEffect(() => {
    const scheduleMilestoneReminders = async () => {
      const upcomingMilestones = events.filter(event => {
        if (event.type !== 'milestone') return false;
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 30; // Within next 30 days
      });

      for (const milestone of upcomingMilestones) {
        try {
          // Schedule reminder on the milestone day at 9 AM
          const reminderTime = new Date(milestone.date);
          reminderTime.setHours(9, 0, 0, 0);
          
          if (reminderTime > new Date()) {
            await scheduleReminder(milestone, reminderTime);
          }
        } catch (err) {
          console.error('Error scheduling milestone reminder:', err);
        }
      }
    };

    if (events.length > 0 && authState.user?.relationshipStartDate) {
      scheduleMilestoneReminders();
    }
  }, [events, authState.user?.relationshipStartDate, scheduleReminder]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  return {
    events,
    isLoading,
    error,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
    scheduleReminder,
    cancelReminder,
    refreshEvents
  };
}