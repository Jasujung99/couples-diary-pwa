'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Settings
        </h1>
        
        <Card variant="elevated" className="p-6">
          <p className="text-foreground/60 text-center">
            Settings panel coming soon...
          </p>
        </Card>
      </motion.div>
    </div>
  );
}