'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, Button, Input, Textarea, Sheet } from '@/components/ui';
import { Sun, Moon, Palette } from 'lucide-react';

export function ThemeDemo() {
  const { mode, toggleTheme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Theme System Demo</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {mode === 'light' ? 'Dark' : 'Light'}
          </Button>
        </div>

        {/* Color Palette */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Palette size={20} />
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-12 bg-background border border-border rounded-lg"></div>
              <p className="text-sm text-foreground/60">Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-surface border border-border rounded-lg"></div>
              <p className="text-sm text-foreground/60">Surface</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-surface-elevated border border-border rounded-lg"></div>
              <p className="text-sm text-foreground/60">Elevated</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-accent rounded-lg"></div>
              <p className="text-sm text-foreground/60">Accent</p>
            </div>
          </div>
        </Card>

        {/* Button Variants */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Card>

        {/* Form Components */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Form Components</h2>
          <div className="space-y-4">
            <Input
              label="Email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="We'll never share your email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              variant="filled"
            />
            <Textarea
              label="Message"
              placeholder="Write your message here..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              helperText="Maximum 500 characters"
            />
          </div>
        </Card>

        {/* Sheet Demo */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Sheet Component</h2>
          <Button onClick={() => setIsSheetOpen(true)}>
            Open Sheet
          </Button>
        </Card>

        {/* Card Variants */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card variant="default" padding="md">
            <h3 className="font-semibold text-foreground mb-2">Default Card</h3>
            <p className="text-foreground/60 text-sm">This is a default card with standard styling.</p>
          </Card>
          <Card variant="elevated" padding="md">
            <h3 className="font-semibold text-foreground mb-2">Elevated Card</h3>
            <p className="text-foreground/60 text-sm">This card has elevation and shadow.</p>
          </Card>
          <Card variant="outlined" padding="md">
            <h3 className="font-semibold text-foreground mb-2">Outlined Card</h3>
            <p className="text-foreground/60 text-sm">This card has a prominent border.</p>
          </Card>
        </div>
      </div>

      {/* Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Example Sheet"
        description="This is a bottom sheet component with smooth animations."
      >
        <div className="space-y-4">
          <p className="text-foreground">
            This sheet component supports different sizes, smooth animations, and respects reduced motion preferences.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setIsSheetOpen(false)}>
              Close Sheet
            </Button>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}