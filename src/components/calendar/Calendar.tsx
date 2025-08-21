'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Heart, BookOpen, Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePlan, DiaryEntry, Memory } from '@/types';

interface CalendarEvent {
  id: string;
  type: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  date: Date;
  color: string;
  data?: DatePlan | DiaryEntry | Memory;
}

interface CalendarProps {
  datePlans?: DatePlan[];
  diaryEntries?: DiaryEntry[];
  memories?: Memory[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  relationshipStartDate?: Date;
}

export function Calendar({
  datePlans = [],
  diaryEntries = [],
  memories = [],
  onDateSelect,
  onEventClick,
  selectedDate,
  relationshipStartDate
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get the first day to display (might be from previous month)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  // Get the last day to display (might be from next month)
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

  // Generate calendar events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

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
        color: '#F59E0B',
        data: memory
      });
    });

    // Add relationship milestones
    if (relationshipStartDate) {
      const startDate = new Date(relationshipStartDate);
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Add monthly milestones (100 days, 200 days, etc.)
      const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const milestones = [100, 200, 300, 365, 500, 730, 1000]; // Days
      
      milestones.forEach(milestone => {
        const milestoneDate = new Date(startDate);
        milestoneDate.setDate(milestoneDate.getDate() + milestone);
        
        if (milestoneDate.getFullYear() === currentYear && milestoneDate.getMonth() === currentMonth) {
          allEvents.push({
            id: `milestone-${milestone}`,
            type: 'milestone',
            title: `D+${milestone}`,
            date: milestoneDate,
            color: '#EC4899'
          });
        }
      });

      // Add anniversary
      const anniversary = new Date(startDate);
      anniversary.setFullYear(currentYear);
      if (anniversary.getMonth() === currentMonth) {
        const years = currentYear - startDate.getFullYear();
        if (years > 0) {
          allEvents.push({
            id: `anniversary-${years}`,
            type: 'milestone',
            title: `${years}주년`,
            date: anniversary,
            color: '#EC4899'
          });
        }
      }
    }

    return allEvents;
  }, [datePlans, diaryEntries, memories, relationshipStartDate, currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayEvents = events.filter(event => 
        event.date.toDateString() === current.toDateString()
      );
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === currentDate.getMonth(),
        isToday: current.toDateString() === new Date().toDateString(),
        isSelected: selectedDate?.toDateString() === current.toDateString(),
        events: dayEvents
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [startDate, endDate, currentDate, events, selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'date':
        return <CalendarIcon className="w-3 h-3" />;
      case 'diary':
        return <BookOpen className="w-3 h-3" />;
      case 'memory':
        return <Camera className="w-3 h-3" />;
      case 'milestone':
        return <Heart className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
          >
            오늘
          </Button>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              월
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              주
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {calendarDays.map((day, index) => (
              <motion.div
                key={day.date.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => handleDateClick(day.date)}
                className={`
                  relative min-h-[80px] p-2 rounded-lg cursor-pointer transition-all duration-200
                  ${day.isCurrentMonth 
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                  }
                  ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                  ${day.isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300' : ''}
                `}
              >
                {/* Date number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${day.isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                  ${index % 7 === 0 && day.isCurrentMonth ? 'text-red-500' : ''}
                  ${index % 7 === 6 && day.isCurrentMonth ? 'text-blue-500' : ''}
                `}>
                  {day.date.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={(e) => handleEventClick(event, e)}
                      className="flex items-center gap-1 px-1 py-0.5 rounded text-xs text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.color }}
                    >
                      {getEventIcon(event.type)}
                      <span className="truncate flex-1">{event.title}</span>
                    </motion.div>
                  ))}
                  
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{day.events.length - 3} 더보기
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}