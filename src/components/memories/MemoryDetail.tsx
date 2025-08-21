'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Tag, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Memory } from '@/types';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface MemoryDetailProps {
  memory: Memory;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MemoryDetail({ memory, onEdit, onDelete, onClose }: MemoryDetailProps) {
  const { colors } = useTheme();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const nextPhoto = () => {
    if (memory.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % memory.photos.length);
    }
  };

  const prevPhoto = () => {
    if (memory.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + memory.photos.length) % memory.photos.length);
    }
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: colors.ink + '80' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ backgroundColor: colors.bg }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.line + '30' }}>
          <h2 
            className="text-xl font-semibold line-clamp-1"
            style={{ color: colors.ink }}
          >
            {memory.title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={onEdit}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit size={16} />
              수정
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 text-red-600"
            >
              <Trash2 size={16} />
              삭제
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-opacity-10"
              style={{ backgroundColor: colors.line + '20' }}
            >
              <X size={20} style={{ color: colors.ink }} />
            </button>
          </div>
        </div>

        {/* Photo Gallery */}
        {memory.photos && memory.photos.length > 0 && (
          <div className="relative">
            <div className="aspect-video relative">
              <Image
                src={memory.photos[currentPhotoIndex].url}
                alt={memory.title}
                fill
                className="object-cover"
              />
              
              {/* Photo Navigation */}
              {memory.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full"
                    style={{ backgroundColor: colors.bg + 'CC' }}
                  >
                    <ChevronLeft size={20} style={{ color: colors.ink }} />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full"
                    style={{ backgroundColor: colors.bg + 'CC' }}
                  >
                    <ChevronRight size={20} style={{ color: colors.ink }} />
                  </button>
                  
                  {/* Photo Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {memory.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPhotoIndex ? 'opacity-100' : 'opacity-50'
                        }`}
                        style={{ backgroundColor: colors.bg }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location and Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin size={18} style={{ color: colors.forest }} />
              <span 
                className="text-lg"
                style={{ color: colors.ink }}
              >
                {memory.location}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar size={18} style={{ color: colors.forest }} />
              <span 
                className="text-lg"
                style={{ color: colors.ink }}
              >
                {formatDate(memory.date)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} style={{ color: colors.forest }} />
                <span 
                  className="font-medium"
                  style={{ color: colors.forest }}
                >
                  태그
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: memory.color || colors.lilac,
                      color: colors.forest 
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photo Thumbnails */}
          {memory.photos && memory.photos.length > 1 && (
            <div>
              <h4 
                className="font-medium mb-3"
                style={{ color: colors.forest }}
              >
                모든 사진 ({memory.photos.length}장)
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {memory.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      index === currentPhotoIndex ? 'border-current' : 'border-transparent'
                    }`}
                    style={{ 
                      borderColor: index === currentPhotoIndex ? colors.gold : 'transparent'
                    }}
                  >
                    <Image
                      src={photo.thumbnail || photo.url}
                      alt={`${memory.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{ backgroundColor: colors.ink + '80' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-6 rounded-2xl max-w-sm w-full"
              style={{ backgroundColor: colors.bg }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 
                className="text-lg font-semibold mb-3"
                style={{ color: colors.ink }}
              >
                추억 삭제
              </h3>
              <p 
                className="mb-6"
                style={{ color: colors.forest }}
              >
                이 추억을 정말 삭제하시겠습니까? 삭제된 추억은 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  삭제
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}