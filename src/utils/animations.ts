import { Variants, Transition } from 'framer-motion';

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Base transition configurations optimized for performance
export const transitions = {
  fast: { 
    duration: 0.15, 
    ease: [0.4, 0, 0.2, 1],
    // Use transform and opacity for better performance
    type: 'tween'
  } as Transition,
  normal: { 
    duration: 0.3, 
    ease: [0.4, 0, 0.2, 1],
    type: 'tween'
  } as Transition,
  slow: { 
    duration: 0.5, 
    ease: [0.4, 0, 0.2, 1],
    type: 'tween'
  } as Transition,
  spring: { 
    type: 'spring', 
    stiffness: 300, 
    damping: 30,
    mass: 1
  } as Transition,
  bounce: { 
    type: 'spring', 
    stiffness: 400, 
    damping: 10,
    mass: 0.8
  } as Transition,
} as const;

// Get transition with reduced motion support
export const getTransition = (transition: keyof typeof transitions): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0.01, ease: 'linear' };
  }
  return transitions[transition];
};

// Performance-optimized animation properties
export const performantProps = {
  // Use transform and opacity for hardware acceleration
  layoutId: undefined, // Avoid layout animations when possible
  style: { willChange: 'transform, opacity' },
  // Reduce motion blur
  transformTemplate: ({ x, y, rotate, scale }: any) => 
    `translate3d(${x}, ${y}, 0) rotate(${rotate}) scale(${scale})`,
};

// Common animation variants
export const fadeInUp: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    transition: getTransition('fast')
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: getTransition('normal')
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: getTransition('fast')
  }
};

export const fadeIn: Variants = {
  initial: { 
    opacity: 0,
    transition: getTransition('fast')
  },
  animate: { 
    opacity: 1,
    transition: getTransition('normal')
  },
  exit: { 
    opacity: 0,
    transition: getTransition('fast')
  }
};

export const slideInFromBottom: Variants = {
  initial: { 
    opacity: 0, 
    y: '100%',
    transition: getTransition('fast')
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: getTransition('normal')
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: getTransition('fast')
  }
};

export const scaleIn: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    transition: getTransition('fast')
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: getTransition('spring')
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: getTransition('fast')
  }
};

export const buttonPress: Variants = {
  initial: { scale: 1 },
  pressed: { 
    scale: 0.98,
    transition: getTransition('fast')
  }
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.1,
      delayChildren: prefersReducedMotion() ? 0 : 0.1,
    }
  }
};

export const staggerItem: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: getTransition('normal')
  }
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    x: 20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: getTransition('normal')
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: getTransition('fast')
  }
};

// Sheet/modal animations
export const sheetVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: '100%' 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: getTransition('normal')
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: getTransition('fast')
  }
};

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: getTransition('fast')
  },
  exit: { 
    opacity: 0,
    transition: getTransition('fast')
  }
};