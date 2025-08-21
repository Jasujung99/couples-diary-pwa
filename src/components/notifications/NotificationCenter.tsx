'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Heart, MessageCircle, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

const NOTIFICATION_ICONS = {
  'diary-entry': MessageCircle,
  'diary-complete': Check,
  'partner-online': User,
  'partner-offline': User,
  'calendar-reminder': Bell,
};

const NOTIFICATION_COLORS = {
  'diary-entry': 'text-gold',
  'diary-complete': 'text-mint',
  'partner-online': 'text-green-500',
  'partner-offline': 'text-gray-400',
  'calendar-reminder': 'text-blue-500',
};

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();
  const {
    permission,
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendLocalTestNotification,
  } = usePushNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle notification-specific actions
    switch (notification.type) {
      case 'diary-entry':
        // Navigate to diary page or specific entry
        if (notification.data?.entryId) {
          // TODO: Navigate to diary entry
          console.log('Navigate to diary entry:', notification.data.entryId);
        }
        break;
      case 'diary-complete':
        // Navigate to diary page for the specific date
        if (notification.data?.date) {
          // TODO: Navigate to diary for date
          console.log('Navigate to diary for date:', notification.data.date);
        }
        break;
    }
  };

  const formatNotificationTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 z-50"
            >
              <Card variant="elevated" className="max-h-96 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-line/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {isSupported && (permission !== 'granted' || !isSubscribed) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={subscribe}
                          className="text-xs"
                        >
                          Enable Push
                        </Button>
                      )}
                      {isSupported && permission === 'granted' && isSubscribed && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              sendLocalTestNotification('Test Notification', {
                                body: 'This is a test notification',
                                url: '/',
                              })
                            }
                            className="text-xs"
                          >
                            Send test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={unsubscribe}
                            className="text-xs"
                          >
                            Disable
                          </Button>
                        </>
                      )}
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-foreground/60">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-line/20">
                      {notifications.map((notification) => {
                        const Icon = NOTIFICATION_ICONS[notification.type];
                        const iconColor = NOTIFICATION_COLORS[notification.type];
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-4 hover:bg-bgSoft cursor-pointer transition-colors ${
                              !notification.read ? 'bg-goldSoft/10' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex gap-3">
                              <div className={`flex-shrink-0 ${iconColor}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm text-foreground">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-foreground/70 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-foreground/50 mt-2">
                                      {formatNotificationTime(notification.timestamp)}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-gold rounded-full" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeNotification(notification.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-line/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="w-full text-xs text-foreground/60"
                    >
                      Clear all notifications
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}