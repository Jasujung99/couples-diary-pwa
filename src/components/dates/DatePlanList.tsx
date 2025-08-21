'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';
import { DatePlan } from '@/types';
import { Button } from '@/components/ui/Button';
import { DatePlanCard } from './DatePlanCard';
import { DatePlanForm } from './DatePlanForm';
import { useDatePlanning } from '@/hooks/useDatePlanning';

interface DatePlanListProps {
  filter?: 'all' | 'upcoming' | 'completed';
}

export function DatePlanList({ filter = 'all' }: DatePlanListProps) {
  const {
    datePlans,
    isLoading,
    error,
    createDatePlan,
    updateDatePlan,
    deleteDatePlan,
    getProgressPercentage,
    getUpcomingDates,
    getCompletedDates
  } = useDatePlanning();

  const [showForm, setShowForm] = useState(false);
  const [editingDatePlan, setEditingDatePlan] = useState<DatePlan | undefined>();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'upcoming' | 'completed'>(filter);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFilteredDatePlans = () => {
    switch (currentFilter) {
      case 'upcoming':
        return getUpcomingDates();
      case 'completed':
        return getCompletedDates();
      default:
        return datePlans.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    }
  };

  const handleSubmit = async (datePlanData: Omit<DatePlan, 'id' | 'coupleId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsSubmitting(true);
      
      if (editingDatePlan) {
        await updateDatePlan(editingDatePlan.id, datePlanData);
      } else {
        await createDatePlan(datePlanData);
      }
      
      setShowForm(false);
      setEditingDatePlan(undefined);
    } catch (error) {
      console.error('Error submitting date plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (datePlan: DatePlan) => {
    setEditingDatePlan(datePlan);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 데이트 계획을 삭제하시겠습니까?')) {
      try {
        await deleteDatePlan(id);
      } catch (error) {
        console.error('Error deleting date plan:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, status: 'planned' | 'completed' | 'cancelled') => {
    try {
      await updateDatePlan(id, { status });
    } catch (error) {
      console.error('Error updating date plan status:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDatePlan(undefined);
  };

  const filteredDatePlans = getFilteredDatePlans();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            데이트 계획
          </h2>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={currentFilter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentFilter('all')}
            >
              전체
            </Button>
            <Button
              variant={currentFilter === 'upcoming' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentFilter('upcoming')}
            >
              예정
            </Button>
            <Button
              variant={currentFilter === 'completed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentFilter('completed')}
            >
              완료
            </Button>
          </div>
        </div>

        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          새 데이트 계획
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {getUpcomingDates().length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">예정된 데이트</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {getCompletedDates().length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">완료된 데이트</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {datePlans.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">총 데이트</div>
        </div>
      </div>

      {/* Date Plans List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredDatePlans.length > 0 ? (
            filteredDatePlans.map((datePlan) => (
              <DatePlanCard
                key={datePlan.id}
                datePlan={datePlan}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                progressPercentage={getProgressPercentage(datePlan)}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {currentFilter === 'upcoming' && '예정된 데이트가 없습니다'}
                {currentFilter === 'completed' && '완료된 데이트가 없습니다'}
                {currentFilter === 'all' && '아직 데이트 계획이 없습니다'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                첫 번째 데이트 계획을 만들어보세요!
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                데이트 계획 만들기
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <DatePlanForm
            datePlan={editingDatePlan}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}