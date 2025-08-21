'use client';

import { motion } from 'framer-motion';
import { Calendar, Heart, Star, Trophy, Gift } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Milestone } from '@/hooks/useMilestones';

interface MilestoneCardProps {
  milestone: Milestone;
  onClick?: () => void;
}

const MILESTONE_ICONS = {
  special: Heart,
  weekly: Calendar,
  monthly: Calendar,
  major: Star,
  anniversary: Trophy
};

const MILESTONE_COLORS = {
  special: '#E2E0F4', // lilac
  weekly: '#F1F4FA', // ice
  monthly: '#D8E7C5', // mint
  major: '#F1E08C', // goldSoft
  anniversary: '#E2BC1A' // gold
};

export function MilestoneCard({ milestone, onClick }: MilestoneCardProps) {
  const { colors } = useTheme();
  const Icon = MILESTONE_ICONS[milestone.type];
  const cardColor = MILESTONE_COLORS[milestone.type];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
      style={{ backgroundColor: cardColor }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={20} style={{ color: colors.forest }} />
          <span 
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              milestone.isPassed ? 'bg-green-100 text-green-800' :
              milestone.isUpcoming ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-600'
            }`}
          >
            {milestone.isPassed ? '달성' : 
             milestone.isUpcoming ? '임박' : 
             `D-${milestone.daysUntil}`}
          </span>
        </div>
        
        {milestone.type === 'anniversary' && (
          <Gift size={16} style={{ color: colors.gold }} />
        )}
      </div>

      {/* Milestone Info */}
      <div className="space-y-2">
        <h3 
          className="text-lg font-semibold"
          style={{ color: colors.ink }}
        >
          {milestone.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <span 
            className="text-sm"
            style={{ color: colors.forest }}
          >
            {formatDate(milestone.date)}
          </span>
          
          <span 
            className="text-sm font-medium"
            style={{ color: colors.forest }}
          >
            {milestone.isPassed ? 
              `${milestone.daysTogether}일째` : 
              `${milestone.days}일`}
          </span>
        </div>
      </div>

      {/* Progress Bar for Upcoming Milestones */}
      {!milestone.isPassed && milestone.daysUntil <= 30 && (
        <div className="mt-3">
          <div 
            className="h-1 rounded-full"
            style={{ backgroundColor: colors.line + '30' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colors.gold }}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.max(0, 100 - (milestone.daysUntil / 30) * 100)}%` 
              }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span 
              className="text-xs"
              style={{ color: colors.forest }}
            >
              {milestone.daysUntil}일 남음
            </span>
          </div>
        </div>
      )}

      {/* Celebration Effect for Passed Milestones */}
      {milestone.isPassed && milestone.type === 'major' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{ 
              background: `linear-gradient(45deg, ${colors.gold}20, transparent, ${colors.gold}20)` 
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}