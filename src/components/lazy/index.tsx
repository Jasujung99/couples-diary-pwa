import React, { Suspense } from 'react';
import { createPreloadableLazyComponent } from '@/utils/lazyLoading';

// Loading fallback component
export const ComponentLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-sm text-muted-foreground">{message}</span>
  </div>
);

// Lazy-loaded feature components
export const LazyDiaryList = createPreloadableLazyComponent(
  () => import('@/components/diary/DiaryList')
);

export const LazyDiaryComposer = createPreloadableLazyComponent(
  () => import('@/components/diary/DiaryComposer')
);

export const LazyCalendar = createPreloadableLazyComponent(
  () => import('@/components/calendar/Calendar')
);

export const LazyDatePlanList = createPreloadableLazyComponent(
  () => import('@/components/dates/DatePlanList')
);

export const LazyDatePlanForm = createPreloadableLazyComponent(
  () => import('@/components/dates/DatePlanForm')
);

export const LazyMemoryList = createPreloadableLazyComponent(
  () => import('@/components/memories/MemoryList')
);

export const LazyMemoryForm = createPreloadableLazyComponent(
  () => import('@/components/memories/MemoryForm')
);

export const LazyMilestoneTracker = createPreloadableLazyComponent(
  () => import('@/components/milestones/MilestoneTracker')
);

export const LazySecuritySettings = createPreloadableLazyComponent(
  () => import('@/components/security/SecuritySettings')
);

export const LazyNotificationCenter = createPreloadableLazyComponent(
  () => import('@/components/notifications/NotificationCenter')
);

// Wrapper component with Suspense
export const LazyComponentWrapper = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback || <ComponentLoader />}>
    {children}
  </Suspense>
);