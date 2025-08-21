'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DiaryList } from '@/components/diary';
import { DiaryEntry, MediaItem } from '@/types';

// Mock data for testing
const mockEntries: DiaryEntry[] = [
  {
    id: '1',
    authorId: 'user1',
    coupleId: 'couple1',
    mood: 'happy',
    content: 'Had a wonderful day today! We went to the park and had a picnic. The weather was perfect and we spent hours just talking and laughing together.',
    media: [],
    date: new Date(),
    status: 'replied',
    isEncrypted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    authorId: 'user2',
    coupleId: 'couple1',
    mood: 'loved',
    content: 'Today was amazing! The picnic was such a great idea. I love how we can just be ourselves together.',
    media: [],
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'replied',
    isEncrypted: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

export default function DiaryTestPage() {
  const handleCreateEntry = async (entryData: {
    mood: string;
    content: string;
    media: MediaItem[];
  }) => {
    console.log('Creating entry:', entryData);
    // In a real implementation, this would call the API
    alert(`Entry created with mood: ${entryData.mood}`);
  };

  const handleRefresh = async () => {
    console.log('Refreshing entries...');
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="py-8"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Diary System Test
            </h1>
            <p className="text-foreground/60">
              Testing the diary entry components and functionality
            </p>
          </div>

          <DiaryList
            entries={mockEntries}
            onCreateEntry={handleCreateEntry}
            onRefresh={handleRefresh}
            isLoading={false}
          />
        </motion.div>
      </div>
    </div>
  );
}