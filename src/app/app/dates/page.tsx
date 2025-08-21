'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, CheckCircle } from 'lucide-react';
import { DatePlanList } from '@/components/dates/DatePlanList';
import { ChecklistManager } from '@/components/dates/ChecklistManager';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistItem } from '@/types';

export default function DatesPage() {
  const { authState } = useAuth();
  const { getUpcomingDates, getDatePlan, updateChecklist } = useDatePlanning();
  const [selectedDatePlanId, setSelectedDatePlanId] = useState<string | null>(null);

  const upcomingDates = getUpcomingDates();
  const nextDate = upcomingDates[0];
  const selectedDatePlan = selectedDatePlanId ? getDatePlan(selectedDatePlanId) : null;

  const handleChecklistUpdate = async (checklist: ChecklistItem[]) => {
    if (selectedDatePlanId) {
      await updateChecklist(selectedDatePlanId, checklist);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 text-pink-600 dark:text-pink-400">
            <Heart className="w-6 h-6" />
            <h1 className="text-2xl font-bold">데이트 계획</h1>
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            함께 만들어가는 특별한 순간들
          </p>
        </motion.div>

        {/* Next Date Highlight */}
        {nextDate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6" />
              <h2 className="text-xl font-semibold">다음 데이트</h2>
            </div>
            <h3 className="text-2xl font-bold mb-2">{nextDate.title}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="opacity-90">
                  {new Date(nextDate.scheduledAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
                <p className="opacity-90">{nextDate.location}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {Math.ceil((new Date(nextDate.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm opacity-90">일 남음</div>
              </div>
            </div>
            
            {nextDate.checklist && nextDate.checklist.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">준비 진행률</span>
                  <span className="text-sm font-medium">
                    {Math.round((nextDate.checklist.filter(item => item.completed).length / nextDate.checklist.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((nextDate.checklist.filter(item => item.completed).length / nextDate.checklist.length) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date Plans List */}
          <div className="lg:col-span-2">
            <DatePlanList />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                빠른 작업
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedDatePlanId(nextDate?.id || null)}
                  disabled={!nextDate}
                  className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">다음 데이트 준비하기</span>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Checklist Manager */}
            {selectedDatePlan && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ChecklistManager
                  checklist={selectedDatePlan.checklist || []}
                  onUpdateChecklist={handleChecklistUpdate}
                  currentUserId={authState.user?.id}
                  partnerName={authState.partner?.name}
                />
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                통계
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    이번 달 데이트
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {upcomingDates.filter(date => {
                      const dateMonth = new Date(date.scheduledAt).getMonth();
                      const currentMonth = new Date().getMonth();
                      return dateMonth === currentMonth;
                    }).length}회
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    평균 준비율
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {upcomingDates.length > 0
                      ? Math.round(
                          upcomingDates.reduce((acc, date) => {
                            const checklist = date.checklist || [];
                            const completed = checklist.filter(item => item.completed).length;
                            return acc + (checklist.length > 0 ? (completed / checklist.length) * 100 : 0);
                          }, 0) / upcomingDates.length
                        )
                      : 0}%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}