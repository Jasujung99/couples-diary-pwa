import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { 
  performanceMetrics, 
  memoryMonitor, 
  imageOptimization,
  animationOptimization,
  debounce,
  throttle 
} from '@/utils/performance';
import { VirtualList } from '@/components/ui/VirtualList';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Metrics', () => {
    it('should track render times', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const startTime = 100;
      mockPerformance.now.mockReturnValue(116); // 16ms render time
      
      performanceMetrics.trackRender('TestComponent', startTime);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'TestComponent render time: 16.00ms'
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn about slow renders', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const startTime = 100;
      mockPerformance.now.mockReturnValue(120); // 20ms render time (slow)
      
      performanceMetrics.trackRender('SlowComponent', startTime);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Slow render detected: SlowComponent took 20.00ms'
      );
      
      process.env.NODE_ENV = originalEnv;
      consoleWarnSpy.mockRestore();
    });

    it('should track image load times', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const startTime = 100;
      mockPerformance.now.mockReturnValue(250); // 150ms load time
      
      performanceMetrics.trackImageLoad('/test-image.jpg', startTime);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Image load time for /test-image.jpg: 150.00ms'
      );
      
      consoleSpy.mockRestore();
    });

    it('should track API call times', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const startTime = 100;
      mockPerformance.now.mockReturnValue(300); // 200ms response time
      
      performanceMetrics.trackApiCall('/api/diary', startTime, true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'API /api/diary success: 200.00ms'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Monitor', () => {
    it('should check memory usage', () => {
      const memoryUsage = memoryMonitor.checkMemoryUsage();
      
      expect(memoryUsage).toEqual({
        used: 1, // 1MB
        total: 2, // 2MB
        limit: 4  // 4MB
      });
    });

    it('should log memory usage in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      memoryMonitor.logMemoryUsage('test context');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Memory usage (test context):',
        { used: 1, total: 2, limit: 4 }
      );
      
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('Image Optimization', () => {
    it('should generate responsive image sizes', () => {
      const breakpoints = {
        '768': 400,
        '1024': 600,
        '1440': 800
      };
      
      const sizes = imageOptimization.generateSizes(breakpoints);
      
      expect(sizes).toBe(
        '(max-width: 768px) 400px, (max-width: 1024px) 600px, (max-width: 1440px) 800px'
      );
    });

    it('should calculate optimal image size', () => {
      const optimal = imageOptimization.calculateOptimalSize(400, 300, 2);
      
      expect(optimal).toEqual({
        width: 800,
        height: 600
      });
    });

    it('should generate blur data URL', () => {
      const blurDataURL = imageOptimization.generateBlurDataURL(100, 100, '#ff0000');
      
      expect(blurDataURL).toContain('data:image/svg+xml;base64,');
      expect(blurDataURL).toContain('fill="#ff0000"');
    });
  });

  describe('Animation Optimization', () => {
    it('should detect if device can handle complex animations', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false, // No reduced motion
          media: query,
        })),
      });

      // Mock good connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g' },
        writable: true
      });
      
      const canHandle = animationOptimization.canHandleComplexAnimations();
      expect(canHandle).toBe(true);
    });

    it('should return false for reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      });
      
      const canHandle = animationOptimization.canHandleComplexAnimations();
      expect(canHandle).toBe(false);
    });

    it('should get optimal animation settings', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
        })),
      });
      
      const settings = animationOptimization.getOptimalAnimationSettings();
      
      expect(settings).toEqual({
        enableParallax: true,
        enableComplexTransitions: true,
        staggerDelay: 0.1,
        animationDuration: 0.3
      });
    });
  });

  describe('Virtual List Performance', () => {
    it('should render only visible items', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        content: `Item ${i}`
      }));

      const renderItem = jest.fn((item) => (
        <div key={item.id}>{item.content}</div>
      ));

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={renderItem}
        />
      );

      // Should only render visible items + overscan
      // Container height 300px / item height 50px = 6 visible items
      // Plus overscan of 5 on each side = ~16 items total
      expect(renderItem).toHaveBeenCalledTimes(16);
    });

    it('should have proper ARIA attributes', () => {
      const items = [{ id: '1', content: 'Test item' }];
      
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.content}</div>}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Virtual list');
      
      const listItem = screen.getByRole('listitem');
      expect(listItem).toBeInTheDocument();
    });
  });

  describe('Debounce and Throttle', () => {
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

  describe('Lazy Loading Performance', () => {
    it('should not load images outside viewport', async () => {
      // Mock IntersectionObserver
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };

      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockObserver)
      });

      const { OptimizedImage } = require('@/components/ui/OptimizedImage');
      
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={100}
          height={100}
          lazy={true}
        />
      );

      expect(mockObserver.observe).toHaveBeenCalled();
    });
  });
});