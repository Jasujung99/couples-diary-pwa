'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { SkipLinks } from '@/components/ui/SkipLink';
import { cn } from '@/utils';
import { usePerformanceMonitor } from '@/utils/performance';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { authState } = useAuth();
  
  // Performance monitoring
  usePerformanceMonitor('AppShell');

  // Don't render shell if user is not authenticated or doesn't have a partner
  if (!authState.isAuthenticated || !authState.hasPartner) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {/* Skip Links for Accessibility */}
      <SkipLinks />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <motion.main 
        id="main-content"
        className="flex-1 pb-20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="main"
        aria-label="Main content"
      >
        {children}
      </motion.main>
      
      {/* Bottom Navigation */}
      <div id="navigation">
        <TabNavigation />
      </div>
    </div>
  );
}