'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { scaleIn } from '@/utils/animations';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

export function Card({ 
  children, 
  variant = 'default',
  padding = 'md',
  className,
  animate = false,
  onClick
}: CardProps) {
  const baseClasses = 'rounded-2xl transition-colors duration-200';
  
  const variantClasses = {
    default: 'bg-surface border border-border/50',
    elevated: 'bg-surface-elevated shadow-sm border border-border/30',
    outlined: 'bg-transparent border-2 border-border',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className
  );

  if (animate) {
    return (
      <motion.div
        className={classes}
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}