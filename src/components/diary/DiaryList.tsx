'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { DiaryEntry } from './DiaryEntry';
import { DiaryComposer } from './DiaryComposer';
import { DiaryExchangeStatus } from './DiaryExchangeStatus';
import { DiaryEntry as DiaryEntryType, MediaItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface DiaryListProps {
  entries: DiaryEntryType[];
  onCreateEntry: (entry: {
    mood: string;
    content: string;
    media: MediaItem[];
  }) => Promise<void>;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

type FilterType = 'all' | 'waiting' | 'replied';
type SortType = 'newest' | 'oldest';

export function DiaryList({
  entries,
  onCreateEntry,
  onRefresh: _onRefresh,
  isLoading = false,
  className = ''
}: DiaryListProps) {
  const { authState } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user can write today's entry
  const today = new Date().toDateString();
  const hasWrittenToday = entries.some(entry =>
    entry.authorId === authState.user?.id &&
    new Date(entry.date).toDateString() === today
  );

  // Filter and sort entries
  const filteredEntries = entries
    .filter(entry => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return entry.content.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(entry => {
      // Status filter
      if (filter === 'all') return true;
      return entry.status === filter;
    })
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const dateKey = new Date(entry.date).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
    return groups;
  }, {} as Record<string, DiaryEntryType[]>);

  const handleCreateEntry = async (entryData: {
    mood: string;
    content: string;
    media: MediaItem[];
  }) => {
    setIsSubmitting(true);
    try {
      await onCreateEntry(entryData);
      setShowComposer(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToEntry = () => {
    setShowComposer(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Our Diary
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Share your daily moments together
          </p>
        </div>

        {!hasWrittenToday && !showComposer && (
          <Button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Write Today
          </Button>
        )}
      </div>

      {/* Exchange Status */}
      {entries.length > 0 && authState.user && (
        <DiaryExchangeStatus
          entries={entries}
          currentUserId={authState.user.id}
          partnerName={authState.partner?.name}
        />
      )}

      {/* Composer */}
      <AnimatePresence>
        {showComposer && (
          <DiaryComposer
            onSubmit={handleCreateEntry}
            onCancel={() => setShowComposer(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground/60">Filter:</span>
            {(['all', 'waiting', 'replied'] as FilterType[]).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
              >
                {filterType === 'all' ? 'All' :
                  filterType === 'waiting' ? 'Waiting' : 'Replied'}
              </Button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium text-foreground/60">Sort:</span>
              <Button
                variant={sort === 'newest' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSort('newest')}
              >
                Newest
              </Button>
              <Button
                variant={sort === 'oldest' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSort('oldest')}
              >
                Oldest
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Entries */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-bgSoft rounded-full" />
                  <div className="space-y-1">
                    <div className="w-20 h-4 bg-bgSoft rounded" />
                    <div className="w-16 h-3 bg-bgSoft rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-bgSoft rounded" />
                  <div className="w-3/4 h-4 bg-bgSoft rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-3">
              <Calendar className="w-12 h-12 text-foreground/20 mx-auto" />
              <div>
                <h3 className="font-medium text-foreground">
                  {searchQuery || filter !== 'all'
                    ? 'No entries found'
                    : 'Start your diary journey'
                  }
                </h3>
                <p className="text-sm text-foreground/60 mt-1">
                  {searchQuery || filter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Write your first entry to begin sharing daily moments'
                  }
                </p>
              </div>
              {!hasWrittenToday && !searchQuery && filter === 'all' && (
                <Button
                  onClick={() => setShowComposer(true)}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </div>
          </Card>
        ) : (
          Object.entries(groupedEntries).map(([dateKey, dayEntries]) => (
            <div key={dateKey} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-line/30 flex-1" />
                <span className="text-sm font-medium text-foreground/60 px-3">
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <div className="h-px bg-line/30 flex-1" />
              </div>

              {/* Entries for this date */}
              <div className="space-y-4">
                {dayEntries.map((entry) => (
                  <DiaryEntry
                    key={entry.id}
                    entry={entry}
                    isOwn={entry.authorId === authState.user?.id}
                    partnerName={authState.partner?.name}
                    onReply={handleReplyToEntry}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}