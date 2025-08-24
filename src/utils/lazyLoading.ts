import React, { lazy, ComponentType } from 'react';
import { ComponentProps } from 'react';

/**
 * Utility for creating lazy-loaded components with better error handling
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): React.FC<ComponentProps<T>> {
  const LazyComponent = lazy(importFn);
  
  return (props: ComponentProps<T>) => {
    return React.createElement(LazyComponent, props);
  };
}

/**
 * Preload a lazy component to improve perceived performance
 */
export function preloadComponent(importFn: () => Promise<any>) {
  const componentImport = importFn();
  return componentImport;
}

/**
 * Create a lazy component with preloading capability
 */
export function createPreloadableLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  
  const PreloadableComponent = (props: ComponentProps<T>) => {
    return React.createElement(LazyComponent, props);
  };
  
  PreloadableComponent.preload = () => preloadComponent(importFn);
  
  return PreloadableComponent;
}

/**
 * Intersection Observer based lazy loading for images and media
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}