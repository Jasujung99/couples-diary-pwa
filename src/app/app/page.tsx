'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Welcome Home
        </h1>
        
        <div className="space-y-4">
          <Card variant="elevated" className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Today&apos;s Diary
            </h2>
            <p className="text-foreground/60">
              Share your thoughts and feelings with your partner
            </p>
          </Card>
          
          <Card variant="elevated" className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Upcoming Dates
            </h2>
            <p className="text-foreground/60">
              Plan your next adventure together
            </p>
          </Card>
          
          <Card variant="elevated" className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Recent Memories
            </h2>
            <p className="text-foreground/60">
              Cherish the moments you&apos;ve shared
            </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}