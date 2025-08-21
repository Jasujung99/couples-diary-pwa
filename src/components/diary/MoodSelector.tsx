'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'loved', emoji: '😍', label: 'Loved', color: 'bg-pink-100 text-pink-800' },
  { id: 'peaceful', emoji: '😌', label: 'Peaceful', color: 'bg-green-100 text-green-800' },
  { id: 'grateful', emoji: '🤗', label: 'Grateful', color: 'bg-blue-100 text-blue-800' },
  { id: 'romantic', emoji: '🥰', label: 'Romantic', color: 'bg-rose-100 text-rose-800' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-800' },
  { id: 'sad', emoji: '😔', label: 'Sad', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated', color: 'bg-orange-100 text-orange-800' },
];

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
  className?: string;
}

export function MoodSelector({ selectedMood, onMoodSelect, className = '' }: MoodSelectorProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      <label className="text-sm font-medium text-foreground block">
        How are you feeling today?
      </label>
      
      <div className="grid grid-cols-4 gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <motion.button
            key={mood.id}
            type="button"
            onClick={() => onMoodSelect(mood.id)}
            className={clsx(
              'p-3 rounded-lg border-2 transition-all duration-200',
              'flex flex-col items-center gap-1 text-center',
              'hover:scale-105 active:scale-95',
              selectedMood === mood.id
                ? 'border-gold bg-goldSoft shadow-md'
                : 'border-line/20 bg-bgSoft hover:border-line/40'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs font-medium text-foreground">
              {mood.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}