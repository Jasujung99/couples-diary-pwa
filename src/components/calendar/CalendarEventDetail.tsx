'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Heart, 
  BookOpen, 
  Camera, 
  CheckCircle,
  DollarSign,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePlan, DiaryEntry, Memory } from '@/types';

interface CalendarEvent {
  id: string;
  type: 'date' | 'diary' | 'memory' | 'milestone';
  title: string;
  date: Date;
  color: string;
  data?: DatePlan | DiaryEntry | Memory;
}

interface CalendarEventDetailProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export function CalendarEventDetail({ 
  event, 
  onClose, 
  onEdit, 
  onDelete 
}: CalendarEventDetailProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'date':
        return <Calendar className="w-5 h-5" />;
      case 'diary':
        return <BookOpen className="w-5 h-5" />;
      case 'memory':
        return <Camera className="w-5 h-5" />;
      case 'milestone':
        return <Heart className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const renderDatePlanDetails = (datePlan: DatePlan) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <Clock className="w-4 h-4" />
        <span>{formatTime(new Date(datePlan.scheduledAt))}</span>
      </div>
      
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <MapPin className="w-4 h-4" />
        <span>{datePlan.location}</span>
      </div>

      {datePlan.budget > 0 && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <DollarSign className="w-4 h-4" />
          <span>예산: {datePlan.budget.toLocaleString('ko-KR')}원</span>
        </div>
      )}

      {datePlan.notes && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">{datePlan.notes}</p>
        </div>
      )}

      {datePlan.checklist && datePlan.checklist.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">체크리스트</h4>
          <div className="space-y-1">
            {datePlan.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <CheckCircle 
                  className={`w-4 h-4 ${
                    item.completed 
                      ? 'text-green-500' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`} 
                />
                <span className={`text-sm ${
                  item.completed 
                    ? 'text-gray-500 line-through' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {datePlan.checklist.filter(item => item.completed).length} / {datePlan.checklist.length} 완료
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
        <User className="w-3 h-3" />
        <span>상태: {
          datePlan.status === 'planned' ? '계획됨' :
          datePlan.status === 'completed' ? '완료됨' : '취소됨'
        }</span>
      </div>
    </div>
  );

  const renderDiaryDetails = (diary: DiaryEntry) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <span className="text-2xl">{diary.mood}</span>
        <span className="text-sm">기분</span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {diary.content.length > 200 
            ? `${diary.content.substring(0, 200)}...` 
            : diary.content
          }
        </p>
      </div>

      {diary.media && diary.media.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">첨부 파일</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {diary.media.length}개의 미디어 파일
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
        <span>상태: {diary.status === 'waiting' ? '답장 대기 중' : '답장 완료'}</span>
      </div>
    </div>
  );

  const renderMemoryDetails = (memory: Memory) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <MapPin className="w-4 h-4" />
        <span>{memory.location}</span>
      </div>

      {memory.photos && memory.photos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">사진</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {memory.photos.length}장의 사진
          </div>
        </div>
      )}

      {memory.tags && memory.tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">태그</h4>
          <div className="flex flex-wrap gap-1">
            {memory.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMilestoneDetails = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-gray-600 dark:text-gray-300">
          특별한 날을 축하해요!
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg text-white"
                style={{ backgroundColor: event.color }}
              >
                {getEventIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(event.date)}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            {event.type === 'date' && event.data && renderDatePlanDetails(event.data as DatePlan)}
            {event.type === 'diary' && event.data && renderDiaryDetails(event.data as DiaryEntry)}
            {event.type === 'memory' && event.data && renderMemoryDetails(event.data as Memory)}
            {event.type === 'milestone' && renderMilestoneDetails()}
          </div>

          {/* Actions */}
          {(event.type === 'date' || event.type === 'diary' || event.type === 'memory') && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="flex-1"
                >
                  편집
                </Button>
              )}
              {onDelete && event.type !== 'milestone' && (event.type === 'date' || event.type === 'diary' || event.type === 'memory') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(event)}
                  className="text-red-600 hover:text-red-700"
                >
                  삭제
                </Button>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}