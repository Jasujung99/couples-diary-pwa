'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryList } from '@/components/diary';
import { TypingIndicator } from '@/components/diary/TypingIndicator';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useDiary } from '@/hooks/useDiary';
import { useOfflineDiary } from '@/hooks/useOfflineDiary';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { MediaItem } from '@/types';
import { WifiOff, Wifi } from 'lucide-react';

export default function DiaryPage() {
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();
  
  // Use offline diary when offline, regular diary when online
  const coupleId = session?.user?.coupleId || 'default';
  const offlineDiary = useOfflineDiary(coupleId);
  const onlineDiary = useDiary();
  
  // Choose which diary to use based on online status
  const diary = isOnline ? onlineDiary : offlineDiary;
  
  const { 
    isConnected, 
    isPartnerOnline, 
    isPartnerTyping 
  } = useSocket();

  const handleCreateEntry = async (entryData: {
    mood: string;
    content: string;
    media: MediaItem[];
  }) => {
    await diary.createEntry({
      ...entryData,
      authorId: session?.user?.id || 'unknown',
      coupleId: coupleId,
      date: new Date().toISOString().split('T')[0],
      status: 'waiting',
      isEncrypted: false
    });
  };

  if (diary.error) {
    return (
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <p className="text-red-500 mb-4">Error loading diary entries</p>
          <p className="text-sm text-foreground/60 mb-4">{diary.error}</p>
          <button
            onClick={diary.refresh || diary.refreshEntries}
            className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with notifications and connection status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Our Diary</h1>
          <div className="flex items-center gap-4 mt-1">
            <div className={`flex items-center gap-2 text-sm ${
              isOnline ? 'text-green-600' : 'text-amber-600'
            }`}>
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            <div className={`flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            {isPartnerOnline && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Partner online
              </div>
            )}

            {/* Show pending sync count if offline */}
            {!isOnline && 'getPendingEntries' in diary && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <span>{diary.getPendingEntries().length} pending</span>
              </div>
            )}
          </div>
        </div>
        
        <NotificationCenter />
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {isPartnerTyping && (
          <motion.div className="mb-4">
            <TypingIndicator partnerName="Your partner" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main diary content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DiaryList
          entries={diary.entries}
          onCreateEntry={handleCreateEntry}
          onRefresh={diary.refresh || diary.refreshEntries}
          isLoading={diary.loading || diary.isLoading}
        />
      </motion.div>
    </div>
  );
}