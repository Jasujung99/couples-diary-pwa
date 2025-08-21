'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { MediaItem } from '@/types';

interface MediaUploadProps {
  media: MediaItem[];
  onMediaAdd: (files: File[]) => void;
  onMediaRemove: (mediaId: string) => void;
  maxFiles?: number;
  className?: string;
}

export function MediaUpload({ 
  media, 
  onMediaAdd, 
  onMediaRemove, 
  maxFiles = 5,
  className = '' 
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - media.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      onMediaAdd(filesToAdd);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const canAddMore = media.length < maxFiles;

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-foreground">
        Photos & Media
      </label>
      
      {/* Upload Area */}
      {canAddMore && (
        <motion.div
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-gold bg-goldSoft/20' 
              : 'border-line/30 hover:border-line/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-bgSoft">
                <Camera className="w-6 h-6 text-foreground/60" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Add photos or videos
              </p>
              <p className="text-xs text-foreground/60">
                Drag & drop or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gold hover:text-gold/80 font-medium"
                >
                  browse files
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Media Preview */}
      <AnimatePresence>
        {media.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {media.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group rounded-lg overflow-hidden bg-bgSoft"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-foreground/40" />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => onMediaRemove(item.id)}
                  className="
                    absolute top-2 right-2 p-1 rounded-full bg-ink/80 text-white
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    hover:bg-ink
                  "
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {media.length >= maxFiles && (
        <p className="text-xs text-foreground/60 text-center">
          Maximum {maxFiles} files allowed
        </p>
      )}
    </div>
  );
}