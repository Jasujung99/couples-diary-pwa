'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, DollarSign, FileText, Plus } from 'lucide-react';
import { DatePlan, ChecklistItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface DatePlanFormProps {
  datePlan?: DatePlan;
  onSubmit: (datePlan: Omit<DatePlan, 'id' | 'coupleId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DatePlanForm({ datePlan, onSubmit, onCancel, isLoading }: DatePlanFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    scheduledAt: '',
    location: '',
    notes: '',
    budget: 0,
    checklist: [] as ChecklistItem[],
    status: 'planned' as 'planned' | 'completed' | 'cancelled'
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (datePlan) {
      const scheduledDate = new Date(datePlan.scheduledAt);
      const formattedDate = scheduledDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
      
      setFormData({
        title: datePlan.title,
        scheduledAt: formattedDate,
        location: datePlan.location,
        notes: datePlan.notes || '',
        budget: datePlan.budget,
        checklist: datePlan.checklist || [],
        status: datePlan.status
      });
    }
  }, [datePlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.scheduledAt || !formData.location.trim()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        scheduledAt: new Date(formData.scheduledAt),
        notes: formData.notes.trim() || undefined
      });
    } catch (error) {
      console.error('Error submitting date plan:', error);
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem.trim(),
      completed: false
    };
    
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const toggleChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id
          ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date() : undefined }
          : item
      )
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {datePlan ? '데이트 계획 수정' : '새 데이트 계획'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="데이트 제목을 입력하세요"
                required
              />
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                날짜 및 시간 *
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                장소 *
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="데이트 장소를 입력하세요"
                required
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                예산 (원)
              </label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 메모나 특별한 계획을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                준비 체크리스트
              </label>
              
              {/* Add new item */}
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="새 체크리스트 항목 추가"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                />
                <Button
                  type="button"
                  onClick={addChecklistItem}
                  disabled={!newChecklistItem.trim()}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Checklist items */}
              {formData.checklist.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {item.text}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.scheduledAt || !formData.location.trim()}
                className="flex-1"
              >
                {isLoading ? '저장 중...' : datePlan ? '수정' : '생성'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}