/**
 * Test page for offline functionality
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOfflineDiary } from '@/hooks/useOfflineDiary';
import { useOfflineDatePlanning } from '@/hooks/useOfflineDatePlanning';
import { useOfflineMemories } from '@/hooks/useOfflineMemories';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineSyncStatus } from '@/components/offline/OfflineSyncStatus';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function OfflineTestPage() {
  const { isOnline } = useNetworkStatus();
  const diary = useOfflineDiary('test-couple');
  const datePlanning = useOfflineDatePlanning('test-couple');
  const memories = useOfflineMemories('test-couple');

  const [diaryContent, setDiaryContent] = useState('');
  const [dateTitle, setDateTitle] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');

  const handleCreateDiaryEntry = async () => {
    if (!diaryContent.trim()) return;

    try {
      await diary.createEntry({
        authorId: 'test-user',
        coupleId: 'test-couple',
        mood: 'happy',
        content: diaryContent,
        media: [],
        date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        isEncrypted: false
      });
      setDiaryContent('');
    } catch (error) {
      console.error('Failed to create diary entry:', error);
    }
  };

  const handleCreateDatePlan = async () => {
    if (!dateTitle.trim()) return;

    try {
      await datePlanning.createDatePlan({
        coupleId: 'test-couple',
        title: dateTitle,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        location: 'Test Location',
        budget: 100,
        checklist: [],
        createdBy: 'test-user',
        status: 'planned'
      });
      setDateTitle('');
    } catch (error) {
      console.error('Failed to create date plan:', error);
    }
  };

  const handleCreateMemory = async () => {
    if (!memoryTitle.trim()) return;

    try {
      await memories.createMemory({
        coupleId: 'test-couple',
        title: memoryTitle,
        location: 'Test Location',
        date: new Date().toISOString().split('T')[0],
        photos: [],
        tags: ['test'],
        color: '#FF6B6B',
        createdBy: 'test-user'
      });
      setMemoryTitle('');
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bgSoft to-lilac p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-ink mb-2">
            Offline Functionality Test
          </h1>
          <p className="text-forest/70">
            Test the PWA offline capabilities - try disconnecting your internet!
          </p>
        </motion.div>

        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <OfflineSyncStatus />
        </motion.div>

        {/* Test Controls */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Diary Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-line/20"
          >
            <h2 className="text-xl font-semibold text-ink mb-4">Diary Entries</h2>
            
            <div className="space-y-4">
              <Input
                placeholder="Write a diary entry..."
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
              />
              
              <Button 
                onClick={handleCreateDiaryEntry}
                disabled={!diaryContent.trim()}
                className="w-full"
              >
                Add Entry {!isOnline && '(Offline)'}
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-forest/60 mb-2">
                Entries: {diary.entries.length}
              </p>
              <p className="text-sm text-forest/60">
                Pending: {'getPendingEntries' in diary ? diary.getPendingEntries().length : 0}
              </p>
            </div>

            <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {diary.entries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="truncate">{entry.content}</p>
                  <p className="text-xs text-forest/50 mt-1">
                    {entry.syncStatus === 'pending' ? '⏳ Pending' : '✅ Synced'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Date Planning Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-line/20"
          >
            <h2 className="text-xl font-semibold text-ink mb-4">Date Plans</h2>
            
            <div className="space-y-4">
              <Input
                placeholder="Date plan title..."
                value={dateTitle}
                onChange={(e) => setDateTitle(e.target.value)}
              />
              
              <Button 
                onClick={handleCreateDatePlan}
                disabled={!dateTitle.trim()}
                className="w-full"
              >
                Add Plan {!isOnline && '(Offline)'}
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-forest/60 mb-2">
                Plans: {datePlanning.datePlans.length}
              </p>
              <p className="text-sm text-forest/60">
                Pending: {datePlanning.getPendingPlans().length}
              </p>
            </div>

            <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {datePlanning.datePlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="truncate">{plan.title}</p>
                  <p className="text-xs text-forest/50 mt-1">
                    {plan.syncStatus === 'pending' ? '⏳ Pending' : '✅ Synced'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Memories Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-line/20"
          >
            <h2 className="text-xl font-semibold text-ink mb-4">Memories</h2>
            
            <div className="space-y-4">
              <Input
                placeholder="Memory title..."
                value={memoryTitle}
                onChange={(e) => setMemoryTitle(e.target.value)}
              />
              
              <Button 
                onClick={handleCreateMemory}
                disabled={!memoryTitle.trim()}
                className="w-full"
              >
                Add Memory {!isOnline && '(Offline)'}
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-forest/60 mb-2">
                Memories: {memories.memories.length}
              </p>
              <p className="text-sm text-forest/60">
                Pending: {memories.getPendingMemories().length}
              </p>
            </div>

            <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {memories.memories.slice(0, 3).map((memory) => (
                <div key={memory.id} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="truncate">{memory.title}</p>
                  <p className="text-xs text-forest/50 mt-1">
                    {memory.syncStatus === 'pending' ? '⏳ Pending' : '✅ Synced'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 rounded-lg p-6 border border-blue-200"
        >
          <h3 className="font-semibold text-blue-900 mb-2">How to Test Offline Functionality</h3>
          <ol className="text-blue-800 space-y-1 text-sm">
            <li>1. Create some entries while online (they should sync immediately)</li>
            <li>2. Disconnect your internet or enable airplane mode</li>
            <li>3. Create more entries - they'll be saved locally with "Pending" status</li>
            <li>4. Reconnect to the internet - pending items should sync automatically</li>
            <li>5. Check the sync status component for detailed information</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}