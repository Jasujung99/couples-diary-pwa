/**
 * Performance monitoring and optimization utilities
 */
import React from 'react';

// Performance metrics tracking
export const performanceMetrics = {
  // Track component render times
  trackRender: (componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && renderTime > 16) {
      // Report slow renders (>16ms for 60fps)
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  },

  // Track image loading performance
  trackImageLoad: (src: string, startTime: number) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image load time for ${src}: ${loadTime.toFixed(2)}ms`);
    }
  },

  // Track API response times
  trackApiCall: (endpoint: string, startTime: number, success: boolean) => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`API ${endpoint} ${success ? 'success' : 'error'}: ${responseTime.toFixed(2)}ms`);
    }
  }
};

// Memory usage monitoring
export const memoryMonitor = {
  // Check memory usage
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  },

  // Log memory usage
  logMemoryUsage: (context: string) => {
    const memory = memoryMonitor.checkMemoryUsage();
    if (memory && process.env.NODE_ENV === 'development') {
      console.log(`Memory usage (${context}):`, memory);
    }
  }
};

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sizes
  generateSizes: (breakpoints: { [key: string]: number }) => {
    return Object.entries(breakpoints)
      .map(([media, width]) => `(max-width: ${media}px) ${width}px`)
      .join(', ');
  },

  // Calculate optimal image dimensions
  calculateOptimalSize: (
    containerWidth: number, 
    containerHeight: number, 
    devicePixelRatio: number = window.devicePixelRatio || 1
  ) => {
    return {
      width: Math.ceil(containerWidth * devicePixelRatio),
      height: Math.ceil(containerHeight * devicePixelRatio)
    };
  },

  // Generate blur placeholder
  generateBlurDataURL: (width: number, height: number, color: string = '#f3f4f6') => {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: string, type?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  },

  // Prefetch non-critical resources
  prefetchResource: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Animation performance optimization
export const animationOptimization = {
  // Check if device can handle complex animations
  canHandleComplexAnimations: () => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    
    // Check device capabilities
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === 'slow-2g') {
      return false;
    }
    
    // Check memory constraints
    const memory = memoryMonitor.checkMemoryUsage();
    if (memory && memory.used > memory.limit * 0.8) {
      return false;
    }
    
    return true;
  },

  // Get optimal animation settings based on device
  getOptimalAnimationSettings: () => {
    const canHandleComplex = animationOptimization.canHandleComplexAnimations();
    
    return {
      enableParallax: canHandleComplex,
      enableComplexTransitions: canHandleComplex,
      staggerDelay: canHandleComplex ? 0.1 : 0.05,
      animationDuration: canHandleComplex ? 0.3 : 0.15
    };
  }
};

// Intersection Observer optimization
export const intersectionOptimization = {
  // Create optimized intersection observer
  createOptimizedObserver: (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) => {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  },

  // Batch intersection observer updates
  batchObserverUpdates: (
    observers: IntersectionObserver[],
    elements: Element[]
  ) => {
    requestIdleCallback(() => {
      elements.forEach((element, index) => {
        if (observers[index]) {
          observers[index].observe(element);
        }
      });
    });
  }
};

// React performance hooks
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();
  
  React.useEffect(() => {
    performanceMetrics.trackRender(componentName, startTime);
  });
  
  React.useEffect(() => {
    return () => {
      memoryMonitor.logMemoryUsage(`${componentName} unmount`);
    };
  }, [componentName]);
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};