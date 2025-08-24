/**
 * Accessibility utilities for the couples diary app
 */

// ARIA label generators
export const generateAriaLabel = {
  diaryEntry: (date: string, mood: string, author: string) => 
    `Diary entry from ${author} on ${date} with ${mood} mood`,
  
  dateCard: (title: string, date: string, status: string) =>
    `Date plan: ${title} on ${date}, status: ${status}`,
  
  memoryCard: (title: string, date: string, location?: string) =>
    `Memory: ${title} from ${date}${location ? ` at ${location}` : ''}`,
  
  milestoneCard: (title: string, daysAgo: number) =>
    `Milestone: ${title}, ${daysAgo} days ago`,
  
  navigationTab: (tabName: string, isActive: boolean) =>
    `${tabName} tab${isActive ? ', currently selected' : ''}`,
  
  mediaItem: (type: 'image' | 'video', index: number, total: number) =>
    `${type} ${index + 1} of ${total}`,
  
  button: (action: string, state?: string) =>
    `${action}${state ? `, ${state}` : ''}`,
  
  formField: (fieldName: string, required: boolean, error?: string) =>
    `${fieldName}${required ? ', required' : ''}${error ? `, error: ${error}` : ''}`
};

// Keyboard navigation helpers
export const keyboardNavigation = {
  // Handle arrow key navigation in grids
  handleGridNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    columns: number,
    onIndexChange: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
        newIndex = Math.min(currentIndex + 1, totalItems - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + columns, totalItems - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - columns, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = totalItems - 1;
        break;
      default:
        return false;
    }
    
    if (newIndex !== currentIndex) {
      event.preventDefault();
      onIndexChange(newIndex);
      return true;
    }
    
    return false;
  },

  // Handle list navigation
  handleListNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onIndexChange: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + 1, totalItems - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = totalItems - 1;
        break;
      default:
        return false;
    }
    
    if (newIndex !== currentIndex) {
      event.preventDefault();
      onIndexChange(newIndex);
      return true;
    }
    
    return false;
  },

  // Handle tab navigation
  handleTabNavigation: (
    event: KeyboardEvent,
    tabs: string[],
    currentTab: string,
    onTabChange: (tab: string) => void
  ) => {
    const currentIndex = tabs.indexOf(currentTab);
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return false;
    }
    
    if (newIndex !== currentIndex) {
      event.preventDefault();
      onTabChange(tabs[newIndex]);
      return true;
    }
    
    return false;
  }
};

// Focus management
export const focusManagement = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restore focus to previous element
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  },

  // Get next focusable element
  getNextFocusableElement: (currentElement: HTMLElement, direction: 'next' | 'previous' = 'next') => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (direction === 'next') {
      return focusableElements[currentIndex + 1] || focusableElements[0];
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }
  }
};

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Reduced motion detection
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast detection
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Color scheme detection
export const getPreferredColorScheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Skip link component helper
export const createSkipLink = (targetId: string, text: string) => {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded',
    children: text
  };
};