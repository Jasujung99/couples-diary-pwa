'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { authState } = useAuth();
  const { mode, toggleTheme } = useTheme();
  
  const user = authState.user;
  const partner = authState.partner;
  
  // Calculate days together (D+)
  const getDaysCount = () => {
    if (!user?.relationshipStartDate) return 0;
    const startDate = new Date(user.relationshipStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysCount = getDaysCount();

  return (
    <motion.header 
      className={cn(
        'sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50',
        'px-4 py-3 flex items-center justify-between',
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Couple Names and D+ Counter */}
      <div className="flex items-center space-x-3">
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center space-x-1">
            <span className="text-lg font-semibold text-foreground">
              {user?.name || 'You'}
            </span>
            <Heart className="w-4 h-4 text-accent fill-accent" />
            <span className="text-lg font-semibold text-foreground">
              {partner?.name || 'Partner'}
            </span>
          </div>
        </motion.div>
        
        {daysCount > 0 && (
          <motion.div 
            className="bg-accent/10 text-accent px-3 py-1 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className="text-sm font-medium">
              D+{daysCount}
            </span>
          </motion.div>
        )}
      </div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-10 h-10 p-0 rounded-full"
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        >
          <motion.div
            key={mode}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </motion.header>
  );
}