'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { generateAriaLabel } from '@/utils/accessibility';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outline';
  error?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', error, label, helperText, errorMessage, required, ...props }, ref) => {
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    
    // Generate accessible aria-label
    const ariaLabel = label ? 
      generateAriaLabel.formField(label, !!required, errorMessage) : 
      props['aria-label'];
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
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
          aria-describedby={clsx(
            helperText && helperId,
            error && errorMessage && errorId
          )}
          aria-invalid={error}
          aria-label={ariaLabel}
          {...props}
        />
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-xs text-foreground/60"
          >
            {helperText}
          </p>
        )}
        {error && errorMessage && (
          <p 
            id={errorId}
            className="text-xs text-red-500"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';