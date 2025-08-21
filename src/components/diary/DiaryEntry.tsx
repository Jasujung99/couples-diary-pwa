'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Calendar, User, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DiaryEntry as DiaryEntryType, MediaItem } from '@/types';
import { formatDate } from '@/utils/date';

interface DiaryEntryProps {
  entry: DiaryEntryType;
  isOwn: boolean;
  partnerName?: string;
  onReply?: () => void;
  className?: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  loved: '😍',
  peaceful: '😌',
  tired: '😴',
  sad: '😔',
  frustrated: '😤',
  grateful: '🤗',
  romantic: '🥰',
};

export function DiaryEntry({ 
  entry, 
  isOwn, 
  partnerName,
  onReply,
  className = '' 
}: DiaryEntryProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const moodEmoji = MOOD_EMOJIS[entry.mood] || '😊';
  const authorName = isOwn ? 'You' : (partnerName || 'Partner');
  const shouldTruncate = entry.content.length > 200;
  const displayContent = shouldTruncate && !showFullContent 
    ? entry.content.slice(0, 200) + '...' 
    : entry.content;

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card 
          variant="elevated" 
          className={`p-4 ${isOwn ? 'ml-8' : 'mr-8'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isOwn ? 'bg-gold text-white' : 'bg-mint text-forest'}
              `}>
                {isOwn ? <User className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {authorName}
                </p>
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <Calendar className="w-3 h-3" />
                  {formatDate(entry.date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodEmoji}</span>
              <div className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${entry.status === 'replied' 
                  ? 'bg-mint text-forest' 
                  : 'bg-goldSoft text-gold'
                }
              `}>
                {entry.status === 'replied' ? 'Replied' : 'Waiting'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>
              
              {shouldTruncate && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-gold hover:text-gold/80 text-sm font-medium mt-2"
                >
                  {showFullContent ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Media */}
            {entry.media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {entry.media.slice(0, 4).map((media, index) => (
                  <motion.button
                    key={media.id}
                    onClick={() => handleMediaClick(media)}
                    className="relative rounded-lg overflow-hidden bg-bgSoft group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.thumbnail || media.url}
                        alt={media.filename}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-foreground/40" />
                      </div>
                    )}
                    
                    {index === 3 && entry.media.length > 4 && (
                      <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{entry.media.length - 4}
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isOwn && entry.status === 'waiting' && onReply && (
            <div className="mt-4 pt-3 border-t border-line/20">
              <Button
                onClick={onReply}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Write Your Entry
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.filename}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}