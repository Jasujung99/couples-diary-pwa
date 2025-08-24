'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, BookOpen, Heart, Settings, MapPin } from 'lucide-react';
import { cn } from '@/utils';
import { generateAriaLabel, keyboardNavigation } from '@/utils/accessibility';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/app',
  },
  {
    id: 'dates',
    label: 'Dates',
    icon: MapPin,
    path: '/app/dates',
  },
  {
    id: 'diary',
    label: 'Diary',
    icon: BookOpen,
    path: '/app/diary',
  },
  {
    id: 'memories',
    label: 'Memories',
    icon: Heart,
    path: '/app/memories',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/app/settings',
  },
];

interface TabNavigationProps {
  className?: string;
}

export function TabNavigation({ className }: TabNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabs.find(tab => pathname === tab.path) || tabs[0];

  const handleTabPress = (tab: TabItem) => {
    if (pathname !== tab.path) {
      router.push(tab.path);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: TabItem) => {
    const tabIds = tabs.map(t => t.id);
    const handled = keyboardNavigation.handleTabNavigation(
      event.nativeEvent,
      tabIds,
      activeTab.id,
      (newTabId) => {
        const newTab = tabs.find(t => t.id === newTabId);
        if (newTab) {
          handleTabPress(newTab);
        }
      }
    );

    if (!handled) {
      // Handle Enter and Space
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTabPress(tab);
      }
    }
  };

  return (
    <motion.nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/90 backdrop-blur-md border-t border-border/50',
        'px-2 py-2 safe-area-pb',
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab.id === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'px-3 py-2 rounded-xl transition-colors duration-200',
                'min-w-[60px] min-h-[60px]',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                isActive 
                  ? 'text-accent' 
                  : 'text-foreground/60 hover:text-foreground active:text-foreground/80'
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              aria-label={generateAriaLabel.navigationTab(tab.label, isActive)}
              tabIndex={isActive ? 0 : -1}
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-accent/10 rounded-xl"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              {/* Icon */}
              <motion.div
                className="relative z-10 mb-1"
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>

              {/* Label */}
              <motion.span 
                className={cn(
                  'relative z-10 text-xs font-medium',
                  isActive ? 'text-accent' : 'text-inherit'
                )}
                animate={{
                  opacity: isActive ? 1 : 0.8,
                  fontWeight: isActive ? 600 : 500,
                }}
                transition={{ duration: 0.2 }}
              >
                {tab.label}
              </motion.span>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 left-1/2 w-1 h-1 bg-accent rounded-full"
                  initial={{ scale: 0, x: '-50%' }}
                  animate={{ scale: 1, x: '-50%' }}
                  exit={{ scale: 0, x: '-50%' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}