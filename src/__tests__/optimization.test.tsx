import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { generateAriaLabel } from '@/utils/accessibility';
import { debounce, throttle } from '@/utils/performance';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: 'button',
    nav: 'nav',
    div: 'div',
    main: 'main',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Performance and Accessibility Optimizations', () => {
  describe('Button Accessibility', () => {
    it('should render with proper accessibility attributes', () => {
      render(
        <Button aria-label="Test button" disabled>
          Click me
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-label', 'Test button');
    });

    it('should show loading state with proper ARIA attributes', () => {
      render(<Button loading>Loading...</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('ARIA Label Generation', () => {
    it('should generate proper diary entry labels', () => {
      const label = generateAriaLabel.diaryEntry('2024-01-15', 'happy', 'John');
      expect(label).toBe('Diary entry from John on 2024-01-15 with happy mood');
    });

    it('should generate proper navigation tab labels', () => {
      const activeLabel = generateAriaLabel.navigationTab('Home', true);
      const inactiveLabel = generateAriaLabel.navigationTab('Settings', false);
      
      expect(activeLabel).toBe('Home tab, currently selected');
      expect(inactiveLabel).toBe('Settings tab');
    });
  });

  describe('Performance Utilities', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      jest.advanceTimersByTime(100);

      throttledFn('call4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('call4');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should detect reduced motion preference', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      const { prefersReducedMotion } = require('@/utils/accessibility');
      expect(prefersReducedMotion()).toBe(true);
    });
  });
});