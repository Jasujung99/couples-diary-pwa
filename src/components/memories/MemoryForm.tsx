'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Tag, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Memory, MediaItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MediaUpload } from '@/components/diary/MediaUpload';
import Image from 'next/image';

interface MemoryFormProps {
  memory?: Memory;
  onSubmit: (memoryData: Partial<Memory>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const COLOR_OPTIONS = [
  '#E2E0F4', // lilac
  '#F2EFE6', // sand
  '#F1F4FA', // ice
  '#D8E7C5', // mint
  '#F1E08C', // goldSoft
  '#EFE6D9', // sandDeep
];

export function MemoryForm({ memory, onSubmit, onCancel, loading }: MemoryFormProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    title: memory?.title || '',
    location: memory?.location || '',
    date: memory?.date ? new Date(memory.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    photos: memory?.photos || [],
    tags: memory?.tags || [],
    color: memory?.color || COLOR_OPTIONS[0]
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.location.trim()) {
      return;
    }

    await onSubmit({
      ...formData,
      date: new Date(formData.date)
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMediaUpload = (media: MediaItem[]) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...media]
    }));
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: colors.ink + '80' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.bg }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: colors.ink }}
          >
            {memory ? '추억 수정' : '새로운 추억'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-opacity-10"
            style={{ backgroundColor: colors.line + '20' }}
          >
            <X size={20} style={{ color: colors.ink }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              제목
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="추억의 제목을 입력하세요"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              장소
            </label>
            <div className="relative">
              <MapPin 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: colors.line }}
              />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="장소를 입력하세요"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              날짜
            </label>
            <div className="relative">
              <Calendar 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: colors.line }}
              />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              사진
            </label>
            <MediaUpload
              onUpload={handleMediaUpload}
              maxFiles={10}
              acceptedTypes={['image/*']}
            />
            
            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {formData.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt="Memory photo"
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.ink }}
                    >
                      <X size={12} style={{ color: colors.bg }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              태그
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag 
                  size={18} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: colors.line }}
                />
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="태그 추가"
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                variant="secondary"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            </div>
            
            {/* Tag List */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: colors.lilac,
                      color: colors.forest 
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.forest }}
            >
              색상
            </label>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-current' : 'border-transparent'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    borderColor: formData.color === color ? colors.ink : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !formData.title.trim() || !formData.location.trim()}
            >
              {loading ? '저장 중...' : memory ? '수정' : '저장'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}