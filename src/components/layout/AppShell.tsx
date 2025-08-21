'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { cn } from '@/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { authState } = useAuth();

  // Don't render shell if user is not authenticated or doesn't have a partner
  if (!authState.isAuthenticated || !authState.hasPartner) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <motion.main 
        className="flex-1 pb-20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
      
      {/* Bottom Navigation */}
      <TabNavigation />
    </div>
  );
}