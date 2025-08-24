'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2 focus:bg-accent focus:text-ink focus:rounded-lg',
        'focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
};

export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>
    </div>
  );
};