'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit3 } from 'lucide-react';

interface TypingIndicatorProps {
  partnerName?: string;
  className?: string;
}

export function TypingIndicator({ partnerName = 'Partner', className = '' }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 text-sm text-foreground/60 ${className}`}
    >
      <Edit3 className="w-4 h-4" />
      <span>{partnerName} is writing...</span>
      
      {/* Animated dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-foreground/40 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}