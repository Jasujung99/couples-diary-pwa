'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Trophy, Star } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMilestones } from '@/hooks/useMilestones';
import { MilestoneCard } from './MilestoneCard';
import { MilestoneCelebration } from './MilestoneCelebration';
import { useState, useEffect } from 'react';

export function MilestoneTracker() {
  const { colors } = useTheme();
  const { milestoneData, loading, error } = useMilestones();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState(null);

  // Check for new milestones to celebrate
  useEffect(() => {
    if (milestoneData?.upcomingMilestones?.length > 0) {
      const todayMilestone = milestoneData.upcomingMilestones.find(
        milestone => milestone.daysUntil === 0
      );
      
      if (todayMilestone) {
        setCelebratingMilestone(todayMilestone);
        setShowCelebration(true);
      }
    }
  }, [milestoneData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: colors.gold }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: colors.forest }}>
          마일스톤을 불러오는 중 오류가 발생했습니다: {error}
        </p>
      </div>
    );
  }

  if (!milestoneData) {
    return (
      <div className="text-center py-12">
        <Heart size={48} style={{ color: colors.line }} className="mx-auto mb-4" />
        <p 
          className="text-lg mb-2"
          style={{ color: colors.forest }}
        >
          관계 시작일을 설정해주세요
        </p>
        <p 
          className="text-sm"
          style={{ color: colors.line }}
        >
          설정에서 관계 시작일을 입력하면 마일스톤을 추적할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <motion.div
        className="text-center p-6 rounded-3xl"
        style={{ backgroundColor: colors.goldSoft }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Trophy size={32} style={{ color: colors.gold }} className="mx-auto mb-3" />
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: colors.ink }}
        >
          함께한 지 {milestoneData.daysTogether}일
        </h2>
        {milestoneData.nextMilestone && (
          <p 
            className="text-sm"
            style={{ color: colors.forest }}
          >
            다음 마일스톤 &quot;{milestoneData.nextMilestone.name}&quot;까지 {milestoneData.nextMilestone.daysUntil}일
          </p>
        )}
      </motion.div>

      {/* Upcoming Milestones */}
      {milestoneData.upcomingMilestones.length > 0 && (
        <div>
          <h3 
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: colors.ink }}
          >
            <Star size={20} style={{ color: colors.gold }} />
            다가오는 마일스톤
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {milestoneData.upcomingMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.days}
                milestone={milestone}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Milestones */}
      {milestoneData.recentMilestones.length > 0 && (
        <div>
          <h3 
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: colors.ink }}
          >
            <Calendar size={20} style={{ color: colors.forest }} />
            최근 달성한 마일스톤
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {milestoneData.recentMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.days}
                milestone={milestone}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Milestones */}
      <div>
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: colors.ink }}
        >
          모든 마일스톤
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestoneData.milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.days}
              milestone={milestone}
            />
          ))}
        </div>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && celebratingMilestone && (
          <MilestoneCelebration
            milestone={celebratingMilestone}
            onClose={() => {
              setShowCelebration(false);
              setCelebratingMilestone(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}