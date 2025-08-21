'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, CheckCircle, Clock, User } from 'lucide-react';
import { DatePlan } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DatePlanCardProps {
  datePlan: DatePlan;
  onEdit?: (datePlan: DatePlan) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, status: 'planned' | 'completed' | 'cancelled') => void;
  progressPercentage: number;
}

export function DatePlanCard({ 
  datePlan, 
  onEdit, 
  onDelete: _onDelete, 
  onToggleStatus,
  progressPercentage 
}: DatePlanCardProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = new Date(datePlan.scheduledAt) > new Date();
  const isToday = new Date(datePlan.scheduledAt).toDateString() === new Date().toDateString();

  const getStatusColor = () => {
    switch (datePlan.status) {
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return isToday ? 'text-blue-600' : 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (datePlan.status) {
      case 'completed':
        return '완료됨';
      case 'cancelled':
        return '취소됨';
      default:
        return isToday ? '오늘' : isUpcoming ? '예정' : '지나감';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {datePlan.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {progressPercentage > 0 && (
                <span className="text-sm text-gray-500">
                  • {progressPercentage}% 준비 완료
                </span>
              )}
            </div>
          </div>
          
          {datePlan.status === 'planned' && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(datePlan)}
                >
                  편집
                </Button>
              )}
              {onToggleStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(datePlan.id, 'completed')}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {formatDate(datePlan.scheduledAt)} • {formatTime(datePlan.scheduledAt)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{datePlan.location}</span>
        </div>

        {/* Budget */}
        {datePlan.budget > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">
              예산: {datePlan.budget.toLocaleString('ko-KR')}원
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {datePlan.checklist && datePlan.checklist.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">준비 진행률</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {datePlan.checklist.filter(item => item.completed).length} / {datePlan.checklist.length} 항목 완료
            </div>
          </div>
        )}

        {/* Notes */}
        {datePlan.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            {datePlan.notes}
          </div>
        )}

        {/* Creator Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
          <User className="w-3 h-3" />
          <span>생성자: {(datePlan as DatePlan & { creator?: { name: string } }).creator?.name || '알 수 없음'}</span>
          <Clock className="w-3 h-3 ml-2" />
          <span>{new Date(datePlan.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
      </Card>
    </motion.div>
  );
}