'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Plus, User, Clock } from 'lucide-react';
import { ChecklistItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface ChecklistManagerProps {
  checklist: ChecklistItem[];
  onUpdateChecklist: (checklist: ChecklistItem[]) => Promise<void>;
  isLoading?: boolean;
  currentUserId?: string;
  partnerName?: string;
}

export function ChecklistManager({ 
  checklist, 
  onUpdateChecklist, 
  isLoading,
  currentUserId,
  partnerName 
}: ChecklistManagerProps) {
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const addItem = async () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
      assignedTo: currentUserId
    };

    try {
      await onUpdateChecklist([...checklist, newItem]);
      setNewItemText('');
      setIsAddingItem(false);
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const toggleItem = async (itemId: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? new Date() : undefined
          }
        : item
    );

    try {
      await onUpdateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Error toggling checklist item:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    
    try {
      await onUpdateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Error removing checklist item:', error);
    }
  };

  const assignItem = async (itemId: string, assignedTo: string | undefined) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, assignedTo } : item
    );

    try {
      await onUpdateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Error assigning checklist item:', error);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercentage = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with Progress */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            준비 체크리스트
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {completedCount} / {checklist.length} 완료
          </div>
        </div>

        {/* Progress Bar */}
        {checklist.length > 0 && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-center text-gray-500">
              {progressPercentage}% 완료
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-2">
          <AnimatePresence>
            {checklist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border ${
                  item.completed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    disabled={isLoading}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm ${
                        item.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.text}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {item.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>
                            {item.assignedTo === currentUserId ? '나' : partnerName || '파트너'}
                          </span>
                        </div>
                      )}
                      {item.completedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(item.completedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Assignment Toggle */}
                    {!item.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => assignItem(
                          item.id,
                          item.assignedTo === currentUserId ? undefined : currentUserId
                        )}
                        disabled={isLoading}
                        className="p-1 text-xs"
                      >
                        {item.assignedTo === currentUserId ? '할당 해제' : '내가 할게'}
                      </Button>
                    )}

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add New Item */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {isAddingItem ? (
            <div className="flex gap-2">
              <Input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="새 체크리스트 항목 추가"
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                autoFocus
              />
              <Button
                onClick={addItem}
                disabled={!newItemText.trim() || isLoading}
                size="sm"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemText('');
                }}
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsAddingItem(true)}
              disabled={isLoading}
              className="w-full justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}