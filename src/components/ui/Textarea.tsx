'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outline';
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          // Base styles
          'w-full px-3 py-2 text-sm rounded-lg transition-colors',
          'placeholder:text-foreground/40 focus:outline-none focus:ring-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-none',
          
          // Variant styles
          variant === 'default' && [
            'bg-bgSoft border border-line/20',
            'focus:ring-gold/20 focus:border-gold',
            'text-foreground',
          ],
          
          variant === 'outline' && [
            'bg-transparent border border-line/40',
            'focus:ring-gold/20 focus:border-gold',
            'text-foreground',
          ],
          
          // Error state
          error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
          
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';