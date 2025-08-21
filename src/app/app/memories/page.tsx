'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { MemoryList } from '@/components/memories/MemoryList';
import { MilestoneTracker } from '@/components/milestones/MilestoneTracker';

type TabType = 'memories' | 'milestones';

export default function MemoriesPage() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('memories');

  const tabs = [
    { id: 'memories' as TabType, label: '추억', icon: Heart },
    { id: 'milestones' as TabType, label: '마일스톤', icon: Trophy }
  ];

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <div 
          className="flex rounded-2xl p-1"
          style={{ backgroundColor: colors.bgSoft }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id ? 'font-medium' : ''
                }`}
                style={{
                  color: activeTab === tab.id ? colors.ink : colors.forest
                }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: colors.bg }}
                    layoutId="activeTab"
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'memories' && <MemoryList />}
        {activeTab === 'milestones' && <MilestoneTracker />}
      </motion.div>
    </div>
  );
}