'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Memory } from '@/types';
import { useMemories } from '@/hooks/useMemories';
import { MemoryCard } from './MemoryCard';
import { MemoryForm } from './MemoryForm';
import { MemoryDetail } from './MemoryDetail';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function MemoryList() {
  const { colors } = useTheme();
  const { memories, loading, error, createMemory, updateMemory, deleteMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const filteredMemories = memories.filter(memory =>
    memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateMemory = async (memoryData: Partial<Memory>) => {
    setFormLoading(true);
    try {
      await createMemory(memoryData);
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateMemory = async (memoryData: Partial<Memory>) => {
    if (!editingMemory) return;
    
    setFormLoading(true);
    try {
      await updateMemory(editingMemory.id, memoryData);
      setEditingMemory(null);
      setSelectedMemory(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    const success = await deleteMemory(memoryId);
    if (success) {
      setSelectedMemory(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: colors.gold }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: colors.forest }}>
          추억을 불러오는 중 오류가 발생했습니다: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 
          className="text-2xl font-bold"
          style={{ color: colors.ink }}
        >
          우리의 추억
        </h1>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          추억 추가
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
          style={{ color: colors.line }}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="추억 검색..."
          className="pl-10"
        />
      </div>

      {/* Memory Grid */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12">
          <p 
            className="text-lg mb-4"
            style={{ color: colors.forest }}
          >
            {searchQuery ? '검색 결과가 없습니다' : '아직 추억이 없습니다'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowForm(true)}>
              첫 번째 추억 만들기
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onClick={() => setSelectedMemory(memory)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Memory Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MemoryForm
            onSubmit={handleCreateMemory}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Edit Memory Form Modal */}
      <AnimatePresence>
        {editingMemory && (
          <MemoryForm
            memory={editingMemory}
            onSubmit={handleUpdateMemory}
            onCancel={() => setEditingMemory(null)}
            loading={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && !editingMemory && (
          <MemoryDetail
            memory={selectedMemory}
            onEdit={() => setEditingMemory(selectedMemory)}
            onDelete={() => handleDeleteMemory(selectedMemory.id)}
            onClose={() => setSelectedMemory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}