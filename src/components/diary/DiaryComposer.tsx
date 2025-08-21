'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { MoodSelector } from './MoodSelector';
import { MediaUpload } from './MediaUpload';
import { MediaItem } from '@/types';
import { useSocket } from '@/hooks/useSocket';

interface DiaryComposerProps {
  onSubmit: (entry: {
    mood: string;
    content: string;
    media: MediaItem[];
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function DiaryComposer({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  className = '' 
}: DiaryComposerProps) {
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { emitTypingStart, emitTypingStop } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMediaAdd = async (files: File[]) => {
    try {
      // Create temporary MediaItem objects for immediate preview
      const tempMedia: MediaItem[] = files.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file),
        size: file.size,
        filename: file.name,
      }));
      
      // Add temporary media for immediate preview
      setMedia(prev => [...prev, ...tempMedia]);
      
      // Upload files to server
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/diary/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      const uploadedMedia: MediaItem[] = result.data;
      
      // Replace temporary media with uploaded media
      setMedia(prev => {
        // Remove temporary media
        const withoutTemp = prev.filter(item => !item.id.startsWith('temp-'));
        // Add uploaded media
        return [...withoutTemp, ...uploadedMedia];
      });
      
      // Clean up temporary blob URLs
      tempMedia.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
      
    } catch (error) {
      console.error('Error uploading media:', error);
      // Remove temporary media on error
      setMedia(prev => prev.filter(item => !item.id.startsWith('temp-')));
      setErrors(prev => ({ ...prev, media: 'Failed to upload media. Please try again.' }));
    }
  };

  const handleMediaRemove = (mediaId: string) => {
    setMedia(prev => {
      const item = prev.find(m => m.id === mediaId);
      if (item && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter(m => m.id !== mediaId);
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!mood) {
      newErrors.mood = 'Please select your mood';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Please write something about your day';
    }
    
    if (content.length > 2000) {
      newErrors.content = 'Entry is too long (max 2000 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit({
        mood,
        content: content.trim(),
        media,
      });
      
      // Reset form on success
      setMood('');
      setContent('');
      setMedia([]);
      setErrors({});
    } catch (error) {
      console.error('Failed to submit diary entry:', error);
      setErrors({ submit: 'Failed to save your entry. Please try again.' });
    }
  };

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    emitTypingStart();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 2000);
  }, [emitTypingStart, emitTypingStop]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTypingStop();
  }, [emitTypingStop]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTypingStart();
  };

  const handleCancel = () => {
    // Clean up blob URLs
    media.forEach(item => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    
    // Stop typing indicator
    handleTypingStop();
    
    setMood('');
    setContent('');
    setMedia([]);
    setErrors({});
    onCancel?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card variant="elevated" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Write Today&apos;s Entry
            </h2>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mood Selection */}
          <div>
            <MoodSelector
              selectedMood={mood}
              onMoodSelect={setMood}
            />
            {errors.mood && (
              <p className="text-sm text-red-500 mt-1">{errors.mood}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              What happened today?
            </label>
            <Textarea
              value={content}
              onChange={handleContentChange}
              onBlur={handleTypingStop}
              placeholder="Share your thoughts, feelings, and experiences from today..."
              rows={6}
              maxLength={2000}
              disabled={isSubmitting}
              className={errors.content ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content ? (
                <p className="text-sm text-red-500">{errors.content}</p>
              ) : (
                <div />
              )}
              <p className="text-xs text-foreground/60">
                {content.length}/2000
              </p>
            </div>
          </div>

          {/* Media Upload */}
          <MediaUpload
            media={media}
            onMediaAdd={handleMediaAdd}
            onMediaRemove={handleMediaRemove}
          />

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !mood || !content.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Share with Partner
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}