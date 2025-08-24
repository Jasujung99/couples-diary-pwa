'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { OptimizedImage, GalleryImage } from './OptimizedImage';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
  columns?: number;
  gap?: number;
  onItemClick?: (item: MediaItem, index: number) => void;
}

interface MediaViewerProps {
  items: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentItem = items[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  }, [isOpen, onClose, goToPrevious, goToNext]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <div className="text-white">
            <span className="text-sm opacity-75">
              {currentIndex + 1} of {items.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement download
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement share
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Media Content */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {currentItem.type === 'image' ? (
            <OptimizedImage
              src={currentItem.url}
              alt={currentItem.alt || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              priority
              quality={90}
              lazy={false}
            />
          ) : (
            <video
              src={currentItem.url}
              controls
              className="max-w-full max-h-full"
              autoPlay
            />
          )}
        </motion.div>

        {/* Caption */}
        {currentItem.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <p className="text-white text-center">{currentItem.caption}</p>
          </div>
        )}

        {/* Thumbnails */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={cn(
                  'flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden',
                  index === currentIndex ? 'border-white' : 'border-white/30'
                )}
              >
                <OptimizedImage
                  src={item.url}
                  alt={item.alt || `Thumbnail ${index + 1}`}
                  width={48}
                  height={48}
                  objectFit="cover"
                  quality={50}
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items,
  className,
  columns = 3,
  gap = 4,
  onItemClick
}) => {
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    initialIndex: 0
  });

  const handleItemClick = (item: MediaItem, index: number) => {
    setViewerState({ isOpen: true, initialIndex: index });
    onItemClick?.(item, index);
  };

  const closeViewer = () => {
    setViewerState({ isOpen: false, initialIndex: 0 });
  };

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No media to display
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn(
          'grid gap-4',
          className
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap * 0.25}rem`
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
            onClick={() => handleItemClick(item, index)}
          >
            <GalleryImage
              src={item.url}
              alt={item.alt || `Media ${index + 1}`}
              fill
              className="transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            
            {/* Video indicator */}
            {item.type === 'video' && (
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Video
              </div>
            )}
            
            {/* Caption preview */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs truncate">{item.caption}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <MediaViewer
        items={items}
        initialIndex={viewerState.initialIndex}
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
      />
    </>
  );
};