'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface Notification {
  id: string;
  type: 'diary-entry' | 'diary-complete' | 'partner-online' | 'partner-offline' | 'calendar-reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: Record<string, any>;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (title: string, options?: NotificationOptions) => void;
  scheduleNotification: (notification: ScheduledNotification) => Promise<void>;
  cancelNotification: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { on, off } = useSocket();

  // Initialize notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'couples-diary',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }, [permission]);

  // Add notification to the list
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only last 50 notifications

    // Show browser notification if permission granted
    showBrowserNotification(notification.title, {
      body: notification.message,
      data: notification.data,
    });
  }, [showBrowserNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (notification: ScheduledNotification) => {
    try {
      const response = await fetch('/api/calendar/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: notification.id,
          eventType: 'calendar',
          title: notification.title,
          body: notification.body,
          scheduledTime: notification.scheduledTime.toISOString(),
          data: notification.data || {}
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule notification');
      }

      // For now, we'll use setTimeout for client-side scheduling
      // In production, this should be handled by a background service
      const delay = notification.scheduledTime.getTime() - new Date().getTime();
      
      if (delay > 0) {
        setTimeout(() => {
          addNotification({
            type: 'calendar-reminder',
            title: notification.title,
            message: notification.body,
            data: notification.data
          });
        }, delay);
      }

    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }, [addNotification]);

  // Cancel notification
  const cancelNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/calendar/reminders?eventId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel notification');
      }

    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Socket event listeners
  useEffect(() => {
    const handleNewDiaryEntry = (data: {
      entryId: string;
      authorId: string;
      authorName: string;
      mood: string;
      date: string;
      timestamp: Date;
    }) => {
      addNotification({
        type: 'diary-entry',
        title: 'New Diary Entry',
        message: `${data.authorName} wrote a new diary entry with ${data.mood} mood`,
        data: {
          entryId: data.entryId,
          authorId: data.authorId,
          date: data.date,
        },
      });
    };

    const handleDiaryExchangeComplete = (data: {
      date: string;
      timestamp: Date;
    }) => {
      addNotification({
        type: 'diary-complete',
        title: 'Diary Exchange Complete',
        message: `Both of you have written entries for ${new Date(data.date).toLocaleDateString()}`,
        data: {
          date: data.date,
        },
      });
    };

    const handlePartnerOnline = (data: {
      userId: string;
      timestamp: Date;
    }) => {
      addNotification({
        type: 'partner-online',
        title: 'Partner Online',
        message: 'Your partner is now online',
        data: {
          userId: data.userId,
        },
      });
    };

    const handlePartnerOffline = (data: {
      userId: string;
      timestamp: Date;
    }) => {
      addNotification({
        type: 'partner-offline',
        title: 'Partner Offline',
        message: 'Your partner went offline',
        data: {
          userId: data.userId,
        },
      });
    };

    // Register event listeners
    on('new-diary-entry', handleNewDiaryEntry);
    on('diary-exchange-complete', handleDiaryExchangeComplete);
    on('partner-online', handlePartnerOnline);
    on('partner-offline', handlePartnerOffline);

    // Cleanup
    return () => {
      off('new-diary-entry', handleNewDiaryEntry);
      off('diary-exchange-complete', handleDiaryExchangeComplete);
      off('partner-online', handlePartnerOnline);
      off('partner-offline', handlePartnerOffline);
    };
  }, [on, off, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
    showBrowserNotification,
    scheduleNotification,
    cancelNotification,
  };
}