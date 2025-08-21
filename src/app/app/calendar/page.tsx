'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Bell, Plus, Heart } from 'lucide-react';
import { Calendar, CalendarEventDetail, CalendarReminders } from '@/components/calendar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCalendar } from '@/hooks/useCalendar';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useDiary } from '@/hooks/useDiary';
import { useAuth } from '@/contexts/AuthContext';

interface CalendarEvent {
  id: string;
  type: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  date: Date;
  color: string;
  data?: any;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);

  const { authState } = useAuth();
  const { datePlans } = useDatePlanning();
  const { entries: diaryEntries } = useDiary();
  const { events, getUpcomingEvents, isLoading } = useCalendar();

  const upcomingEvents = getUpcomingEvents(7);
  const todayEvents = events.filter(event => 
    event.date.toDateString() === new Date().toDateString()
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleCloseEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  const handleCloseReminders = () => {
    setShowReminders(false);
    setSelectedEvent(null);
  };

  const calculateDaysTogether = () => {
    if (!authState.user?.relationshipStartDate) return 0;
    const startDate = new Date(authState.user.relationshipStartDate);
    const today = new Date();
    return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                캘린더
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                우리의 소중한 순간들을 한눈에
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReminders(true)}
            >
              <Bell className="w-4 h-4 mr-2" />
              알림
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              이벤트 추가
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-pink-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  D+{calculateDaysTogether()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  함께한 날들
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {datePlans.filter(plan => plan.status === 'planned').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  예정된 데이트
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-lg">📝</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {diaryEntries.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  작성한 일기
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-lg">📸</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.type === 'memory').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  소중한 추억
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Calendar
              datePlans={datePlans}
              diaryEntries={diaryEntries}
              memories={[]} // TODO: Add memories when implemented
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
              relationshipStartDate={authState.user?.relationshipStartDate}
            />
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Today's Events */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                오늘의 일정
              </h3>
              {todayEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  오늘은 특별한 일정이 없어요
                </p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {event.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Events */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                다가오는 일정
              </h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  다가오는 일정이 없어요
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.date.toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowReminders(true);
                        }}
                      >
                        <Bell className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showEventDetail && selectedEvent && (
          <CalendarEventDetail
            event={selectedEvent}
            onClose={handleCloseEventDetail}
          />
        )}
      </AnimatePresence>

      {/* Reminders Modal */}
      <AnimatePresence>
        {showReminders && (
          <CalendarReminders
            selectedEvent={selectedEvent || undefined}
            onClose={handleCloseReminders}
          />
        )}
      </AnimatePresence>
    </div>
  );
}