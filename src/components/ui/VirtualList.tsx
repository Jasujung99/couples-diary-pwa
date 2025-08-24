'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { throttle } from '@/utils/performance';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }, 16), // ~60fps
    [onScroll]
  );

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label="Virtual list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              role="listitem"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized virtual list for diary entries
export interface DiaryEntryItem {
  id: string;
  date: string;
  content: string;
  author: string;
  mood: string;
}

interface VirtualDiaryListProps {
  entries: DiaryEntryItem[];
  onEntryClick?: (entry: DiaryEntryItem) => void;
  className?: string;
}

export const VirtualDiaryList: React.FC<VirtualDiaryListProps> = ({
  entries,
  onEntryClick,
  className
}) => {
  const renderDiaryEntry = useCallback((entry: DiaryEntryItem, index: number) => (
    <div
      className="p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onEntryClick?.(entry)}
      role="button"
      tabIndex={0}
      aria-label={`Diary entry from ${entry.author} on ${entry.date}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEntryClick?.(entry);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{entry.author}</span>
        <span className="text-xs text-muted-foreground">{entry.date}</span>
      </div>
      <p className="text-sm text-foreground/80 line-clamp-2">{entry.content}</p>
      <div className="mt-2">
        <span className="text-xs px-2 py-1 bg-muted rounded-full">
          {entry.mood}
        </span>
      </div>
    </div>
  ), [onEntryClick]);

  return (
    <VirtualList
      items={entries}
      itemHeight={120}
      containerHeight={600}
      renderItem={renderDiaryEntry}
      className={className}
    />
  );
};