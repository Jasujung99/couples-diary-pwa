'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';
import { sheetVariants, overlayVariants } from '@/utils/animations';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: SheetProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-h-[40vh]',
    md: 'max-h-[60vh]',
    lg: 'max-h-[80vh]',
    full: 'h-full',
  };

  const sheetClasses = cn(
    'fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-3xl shadow-2xl',
    sizeClasses[size],
    className
  );

  const overlayClasses = cn(
    'fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm',
    overlayClassName
  );

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={overlayClasses}
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          
          {/* Sheet */}
          <motion.div
            className={sheetClasses}
            variants={sheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4 border-b border-border">
                {title && (
                  <h2 className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-foreground/60 mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}