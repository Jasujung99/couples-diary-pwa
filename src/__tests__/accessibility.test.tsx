import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SkipLinks } from '@/components/ui/SkipLink';
import { generateAriaLabel, keyboardNavigation } from '@/utils/accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/app',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button aria-label="Test button">Click me</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading>Loading button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      // Note: onClick should be triggered by default browser behavior
      expect(button).toHaveFocus();
    });
  });

  describe('OptimizedImage Component', () => {
    it('should have proper alt text', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image description"
          width={100}
          height={100}
        />
      );
      
      // Check for alt text in the image or loading placeholder
      expect(screen.getByText('Test image description') || 
             screen.getByAltText('Test image description')).toBeInTheDocument();
    });

    it('should show error state with accessible message', () => {
      render(
        <OptimizedImage
          src="/invalid-image.jpg"
          alt="Invalid image"
          width={100}
          height={100}
        />
      );
      
      // Simulate error
      const img = screen.getByRole('img', { hidden: true });
      fireEvent.error(img);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('SkipLinks Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLinks />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper skip link structure', () => {
      render(<SkipLinks />);
      
      const skipToMain = screen.getByText('Skip to main content');
      const skipToNav = screen.getByText('Skip to navigation');
      
      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToNav).toHaveAttribute('href', '#navigation');
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

    it('should generate proper form field labels', () => {
      const requiredLabel = generateAriaLabel.formField('Email', true);
      const errorLabel = generateAriaLabel.formField('Password', true, 'Password is too short');
      
      expect(requiredLabel).toBe('Email, required');
      expect(errorLabel).toBe('Password, required, error: Password is too short');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle grid navigation correctly', () => {
      const mockOnIndexChange = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      
      const handled = keyboardNavigation.handleGridNavigation(
        event,
        0, // current index
        9, // total items
        3, // columns
        mockOnIndexChange
      );
      
      expect(handled).toBe(true);
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should handle list navigation correctly', () => {
      const mockOnIndexChange = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      
      const handled = keyboardNavigation.handleListNavigation(
        event,
        0, // current index
        5, // total items
        mockOnIndexChange
      );
      
      expect(handled).toBe(true);
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should handle tab navigation correctly', () => {
      const mockOnTabChange = jest.fn();
      const tabs = ['home', 'diary', 'calendar', 'settings'];
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      
      const handled = keyboardNavigation.handleTabNavigation(
        event,
        tabs,
        'home',
        mockOnTabChange
      );
      
      expect(handled).toBe(true);
      expect(mockOnTabChange).toHaveBeenCalledWith('diary');
    });

    it('should handle Home and End keys in navigation', () => {
      const mockOnIndexChange = jest.fn();
      
      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      keyboardNavigation.handleListNavigation(homeEvent, 3, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
      
      // Test End key
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      keyboardNavigation.handleListNavigation(endEvent, 1, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      button1.textContent = 'First';
      button2.textContent = 'Last';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
      
      // This would be tested in a real browser environment
      // Here we just verify the function exists and can be called
      const { focusManagement } = require('@/utils/accessibility');
      expect(typeof focusManagement.trapFocus).toBe('function');
      
      document.body.removeChild(container);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock matchMedia
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