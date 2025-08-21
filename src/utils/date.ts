import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${formatTime(dateObj)}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${formatTime(dateObj)}`;
  }
  
  return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return d1.toDateString() === d2.toDateString();
}

export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Korean date formatting functions
export function formatDateKorean(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return '오늘';
  }
  
  if (isYesterday(dateObj)) {
    return '어제';
  }
  
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTimeKorean(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTimeKorean(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `오늘 ${formatTimeKorean(dateObj)}`;
  }
  
  if (isYesterday(dateObj)) {
    return `어제 ${formatTimeKorean(dateObj)}`;
  }
  
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatMonthYearKorean(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  });
}

export function getWeekdayKorean(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return weekdays[dateObj.getDay()];
}

export function calculateDaysTogether(startDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const today = new Date();
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getNextMilestone(startDate: Date | string): { days: number; label: string; date: Date } | null {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const daysTogether = calculateDaysTogether(start);
  
  const milestones = [
    { days: 100, label: 'D+100' },
    { days: 200, label: 'D+200' },
    { days: 300, label: 'D+300' },
    { days: 365, label: '1주년' },
    { days: 500, label: 'D+500' },
    { days: 730, label: '2주년' },
    { days: 1000, label: 'D+1000' },
    { days: 1095, label: '3주년' },
    { days: 1460, label: '4주년' },
    { days: 1825, label: '5주년' }
  ];
  
  const nextMilestone = milestones.find(milestone => milestone.days > daysTogether);
  
  if (!nextMilestone) return null;
  
  const milestoneDate = new Date(start);
  milestoneDate.setDate(milestoneDate.getDate() + nextMilestone.days);
  
  return {
    days: nextMilestone.days,
    label: nextMilestone.label,
    date: milestoneDate
  };
}