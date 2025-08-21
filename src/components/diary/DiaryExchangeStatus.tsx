'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Heart, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DiaryEntry } from '@/types';
import { formatDate } from '@/utils/date';

interface DiaryExchangeStatusProps {
  entries: DiaryEntry[];
  currentUserId: string;
  partnerName?: string;
  className?: string;
}

interface DayStatus {
  date: string;
  userEntry?: DiaryEntry;
  partnerEntry?: DiaryEntry;
  status: 'both-written' | 'user-only' | 'partner-only' | 'none';
}

export function DiaryExchangeStatus({ 
  entries, 
  currentUserId, 
  partnerName = 'Partner',
  className = '' 
}: DiaryExchangeStatusProps) {
  // Group entries by date and determine status
  const getDayStatuses = (): DayStatus[] => {
    const entriesByDate = new Map<string, { user?: DiaryEntry; partner?: DiaryEntry }>();
    
    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      const existing = entriesByDate.get(dateKey) || {};
      
      if (entry.authorId === currentUserId) {
        existing.user = entry;
      } else {
        existing.partner = entry;
      }
      
      entriesByDate.set(dateKey, existing);
    });

    // Convert to array and determine status
    const dayStatuses: DayStatus[] = [];
    entriesByDate.forEach((entries, dateKey) => {
      const { user, partner } = entries;
      let status: DayStatus['status'] = 'none';
      
      if (user && partner) {
        status = 'both-written';
      } else if (user) {
        status = 'user-only';
      } else if (partner) {
        status = 'partner-only';
      }
      
      dayStatuses.push({
        date: dateKey,
        userEntry: user,
        partnerEntry: partner,
        status,
      });
    });

    // Sort by date (most recent first)
    return dayStatuses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const dayStatuses = getDayStatuses();
  const recentStatuses = dayStatuses.slice(0, 7); // Show last 7 days

  const getStatusIcon = (status: DayStatus['status']) => {
    switch (status) {
      case 'both-written':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'user-only':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partner-only':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusText = (status: DayStatus['status']) => {
    switch (status) {
      case 'both-written':
        return 'Both wrote entries';
      case 'user-only':
        return 'Waiting for partner';
      case 'partner-only':
        return 'You haven\'t written yet';
      default:
        return 'No entries';
    }
  };

  const getStatusColor = (status: DayStatus['status']) => {
    switch (status) {
      case 'both-written':
        return 'bg-green-50 border-green-200';
      case 'user-only':
        return 'bg-yellow-50 border-yellow-200';
      case 'partner-only':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (recentStatuses.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined" className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-gold" />
        <h3 className="font-semibold text-foreground">Recent Exchange Status</h3>
      </div>

      <div className="space-y-3">
        {recentStatuses.map((dayStatus, index) => (
          <motion.div
            key={dayStatus.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${getStatusColor(dayStatus.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(dayStatus.status)}
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {formatDate(dayStatus.date)}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {getStatusText(dayStatus.status)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* User indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  dayStatus.userEntry 
                    ? 'bg-gold text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <User className="w-3 h-3" />
                </div>

                {/* Partner indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  dayStatus.partnerEntry 
                    ? 'bg-mint text-forest' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Heart className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Show moods if both entries exist */}
            {dayStatus.status === 'both-written' && dayStatus.userEntry && dayStatus.partnerEntry && (
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-current/10">
                <div className="flex items-center gap-1 text-xs text-foreground/60">
                  <span>You:</span>
                  <span className="text-base">
                    {dayStatus.userEntry.mood === 'happy' ? '😊' : 
                     dayStatus.userEntry.mood === 'loved' ? '😍' : 
                     dayStatus.userEntry.mood === 'peaceful' ? '😌' : 
                     dayStatus.userEntry.mood === 'grateful' ? '🤗' : 
                     dayStatus.userEntry.mood === 'romantic' ? '🥰' : 
                     dayStatus.userEntry.mood === 'tired' ? '😴' : 
                     dayStatus.userEntry.mood === 'sad' ? '😔' : 
                     dayStatus.userEntry.mood === 'frustrated' ? '😤' : '😊'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-foreground/60">
                  <span>{partnerName}:</span>
                  <span className="text-base">
                    {dayStatus.partnerEntry.mood === 'happy' ? '😊' : 
                     dayStatus.partnerEntry.mood === 'loved' ? '😍' : 
                     dayStatus.partnerEntry.mood === 'peaceful' ? '😌' : 
                     dayStatus.partnerEntry.mood === 'grateful' ? '🤗' : 
                     dayStatus.partnerEntry.mood === 'romantic' ? '🥰' : 
                     dayStatus.partnerEntry.mood === 'tired' ? '😴' : 
                     dayStatus.partnerEntry.mood === 'sad' ? '😔' : 
                     dayStatus.partnerEntry.mood === 'frustrated' ? '😤' : '😊'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}