'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function AppShellTestPage() {
  const { authState } = useAuth();
  const [mockPartner, setMockPartner] = useState(false);

  // Mock authenticated state for testing
  const mockAuthState = {
    ...authState,
    isAuthenticated: true,
    hasPartner: mockPartner,
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Alex',
      provider: 'google' as const,
      providerId: '123',
      relationshipStartDate: new Date('2024-01-01'),
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    partner: mockPartner ? {
      id: '2',
      email: 'partner@example.com',
      name: 'Jordan',
      provider: 'google' as const,
      providerId: '456',
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } : null,
  };

  // Temporarily override auth context for testing
  React.useEffect(() => {
    // This is just for testing - in real app this would come from actual auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__mockAuthState = mockAuthState;
  }, [mockPartner, mockAuthState]);

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto space-y-6"
      >
        <h1 className="text-2xl font-bold text-foreground text-center">
          App Shell Test
        </h1>
        
        <Card variant="elevated" className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Test Controls
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground/80">Mock Partner Connection:</span>
              <Button
                variant={mockPartner ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setMockPartner(!mockPartner)}
              >
                {mockPartner ? 'Connected' : 'Not Connected'}
              </Button>
            </div>
            
            <div className="text-sm text-foreground/60">
              {mockPartner 
                ? 'App shell with header and navigation should be visible'
                : 'App shell should be hidden (no partner connection)'
              }
            </div>
          </div>
        </Card>

        {mockPartner && (
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              App Shell Features
            </h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>✅ Header with couple names (Alex ❤️ Jordan)</li>
              <li>✅ D+ counter showing days together</li>
              <li>✅ Theme toggle button</li>
              <li>✅ Bottom tab navigation</li>
              <li>✅ Smooth animations and transitions</li>
              <li>✅ Mobile-first responsive design</li>
              <li>✅ Safe area support for notched devices</li>
            </ul>
          </Card>
        )}

        <Card variant="outlined" className="p-4">
          <p className="text-sm text-foreground/60 text-center">
            Navigate to <code className="bg-surface px-2 py-1 rounded">/app</code> to see the full app shell in action
          </p>
        </Card>
      </motion.div>
    </div>
  );
}