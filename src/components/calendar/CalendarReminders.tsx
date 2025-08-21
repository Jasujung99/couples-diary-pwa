'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Clock, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCalendar } from '@/hooks/useCalendar';

interface CalendarEvent {
  id: string;
  type: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  date: Date;
  color: string;
}

interface CalendarRemindersProps {
  selectedEvent?: CalendarEvent;
  onClose?: () => void;
}

interface ReminderOption {
  label: string;
  value: number; // minutes before event
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: '15분 전', value: 15 },
  { label: '30분 전', value: 30 },
  { label: '1시간 전', value: 60 },
  { label: '2시간 전', value: 120 },
  { label: '1일 전', value: 1440 },
  { label: '1주일 전', value: 10080 }
];

export function CalendarReminders({ selectedEvent, onClose }: CalendarRemindersProps) {
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState<Set<string>>(new Set());
  
  const { scheduleReminder, cancelReminder, getUpcomingEvents } = useCalendar();
  const upcomingEvents = getUpcomingEvents(30); // Next 30 days

  const handleScheduleReminder = async (event: CalendarEvent, minutesBefore: number) => {
    try {
      setIsScheduling(true);
      
      const reminderTime = new Date(event.date);
      reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);
      
      // Don't schedule reminders for past times
      if (reminderTime <= new Date()) {
        alert('과거 시간에는 알림을 설정할 수 없습니다.');
        return;
      }
      
      await scheduleReminder(event, reminderTime);
      setScheduledReminders(prev => new Set([...prev, `${event.id}-${minutesBefore}`]));
      
      // Show success message
      alert(`${event.title}에 대한 알림이 설정되었습니다.`);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      alert('알림 설정에 실패했습니다.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelReminder = async (event: CalendarEvent, minutesBefore: number) => {
    try {
      await cancelReminder(event.id);
      setScheduledReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${event.id}-${minutesBefore}`);
        return newSet;
      });
      
      alert('알림이 취소되었습니다.');
    } catch (error) {
      console.error('Error canceling reminder:', error);
      alert('알림 취소에 실패했습니다.');
    }
  };

  const handleCustomReminder = async () => {
    if (!selectedEvent || !customMinutes) return;
    
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      alert('올바른 시간을 입력해주세요.');
      return;
    }
    
    await handleScheduleReminder(selectedEvent, minutes);
    setCustomMinutes('');
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isReminderScheduled = (eventId: string, minutesBefore: number) => {
    return scheduledReminders.has(`${eventId}-${minutesBefore}`);
  };

  if (selectedEvent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  알림 설정
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEvent.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedEvent.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{formatEventDate(selectedEvent.date)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                알림 시간 선택
              </h4>
              
              {REMINDER_OPTIONS.map((option) => {
                const isScheduled = isReminderScheduled(selectedEvent.id, option.value);
                
                return (
                  <div key={option.value} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                    <Button
                      variant={isScheduled ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => 
                        isScheduled 
                          ? handleCancelReminder(selectedEvent, option.value)
                          : handleScheduleReminder(selectedEvent, option.value)
                      }
                      disabled={isScheduling}
                      className={isScheduled ? 'text-red-600 hover:text-red-700' : ''}
                    >
                      {isScheduled ? '취소' : '설정'}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                사용자 정의 알림
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="분"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCustomReminder}
                  disabled={isScheduling || !customMinutes}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                이벤트 시작 전 몇 분에 알림을 받을지 설정하세요.
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          다가오는 이벤트
        </h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {upcomingEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">다가오는 이벤트가 없습니다.</p>
            </motion.div>
          ) : (
            upcomingEvents.slice(0, 5).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleScheduleReminder(event, 60)} // Default 1 hour before
                  disabled={isScheduling}
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {upcomingEvents.length > 5 && (
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm">
            더 보기 ({upcomingEvents.length - 5}개)
          </Button>
        </div>
      )}
    </Card>
  );
}