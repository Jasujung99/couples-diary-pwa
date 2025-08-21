'use client';

import { motion } from 'framer-motion';
import { X, Heart, Star, Trophy, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Milestone } from '@/hooks/useMilestones';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

interface MilestoneCelebrationProps {
  milestone: Milestone;
  onClose: () => void;
}

const CELEBRATION_MESSAGES = {
  special: [
    "특별한 날이에요! 🎉",
    "소중한 순간을 축하해요! ✨",
    "함께한 시간이 빛나네요! 💫"
  ],
  weekly: [
    "또 한 주를 함께했어요! 💕",
    "일주일이 더 쌓였네요! 🌟",
    "꾸준한 사랑이 아름다워요! 💖"
  ],
  monthly: [
    "한 달을 더 함께했어요! 🎊",
    "월간 마일스톤 달성! 🏆",
    "시간이 쌓여가는 게 느껴져요! 💝"
  ],
  major: [
    "대단한 마일스톤이에요! 🎆",
    "정말 의미 있는 날이네요! 🌈",
    "함께한 시간이 자랑스러워요! 👑"
  ],
  anniversary: [
    "기념일을 축하합니다! 🎂",
    "정말 특별한 날이에요! 🎁",
    "사랑이 더욱 깊어졌네요! 💍"
  ]
};

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Set random celebration message
    const messages = CELEBRATION_MESSAGES[milestone.type];
    setMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Generate confetti particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setConfetti(particles);
  }, [milestone.type]);

  const getIcon = () => {
    switch (milestone.type) {
      case 'anniversary':
        return Trophy;
      case 'major':
        return Star;
      default:
        return Heart;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: colors.ink + '90' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: colors.gold,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: [0, 1, 0],
            rotate: 360,
            y: [0, -50, 100]
          }}
          transition={{ 
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      ))}

      <motion.div
        className="relative w-full max-w-md p-8 rounded-3xl text-center"
        style={{ backgroundColor: colors.bg }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-10"
          style={{ backgroundColor: colors.line + '20' }}
        >
          <X size={20} style={{ color: colors.ink }} />
        </button>

        {/* Celebration Icon */}
        <motion.div
          className="mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: colors.goldSoft }}
          >
            <Icon size={40} style={{ color: colors.gold }} />
          </div>
        </motion.div>

        {/* Celebration Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: colors.ink }}
          >
            {milestone.name} 달성!
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: colors.forest }}
          >
            {message}
          </p>
        </motion.div>

        {/* Milestone Details */}
        <motion.div
          className="p-4 rounded-2xl mb-6"
          style={{ backgroundColor: colors.lilac }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4">
            <Sparkles size={20} style={{ color: colors.gold }} />
            <span 
              className="text-lg font-semibold"
              style={{ color: colors.ink }}
            >
              함께한 지 {milestone.days}일
            </span>
            <Sparkles size={20} style={{ color: colors.gold }} />
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onClose}
            className="w-full"
          >
            추억 만들러 가기 💕
          </Button>
        </motion.div>

        {/* Floating Hearts */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ 
                left: `${20 + i * 15}%`,
                bottom: '-10px'
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: -200,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <Heart 
                size={16} 
                style={{ color: colors.gold }}
                fill="currentColor"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}