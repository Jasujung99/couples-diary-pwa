'use client';

import { Memory } from '@/types';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';

interface MemoryCardProps {
  memory: Memory;
  onClick?: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const { colors } = useTheme();
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const mainPhoto = memory.photos?.[0];

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: memory.color || colors.lilac }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Photo Background */}
      {mainPhoto && (
        <div className="absolute inset-0">
          <Image
            src={mainPhoto.url}
            alt={memory.title}
            fill
            className="object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, ${memory.color}CC, ${memory.color}99)` 
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 min-h-[160px] flex flex-col justify-between">
        <div>
          <h3 
            className="text-lg font-semibold mb-2 line-clamp-2"
            style={{ color: colors.ink }}
          >
            {memory.title}
          </h3>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: colors.forest }} />
              <span 
                className="text-sm line-clamp-1"
                style={{ color: colors.forest }}
              >
                {memory.location}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: colors.forest }} />
              <span 
                className="text-sm"
                style={{ color: colors.forest }}
              >
                {formatDate(memory.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <Tag size={12} style={{ color: colors.forest }} />
            {memory.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: colors.bg + '80',
                  color: colors.forest 
                }}
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: colors.bg + '80',
                  color: colors.forest 
                }}
              >
                +{memory.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Photo Count */}
        {memory.photos && memory.photos.length > 1 && (
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: colors.bg + 'CC',
              color: colors.ink 
            }}
          >
            {memory.photos.length} 장
          </div>
        )}
      </div>
    </motion.div>
  );
}