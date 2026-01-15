/**
 * Animation configuration for panel animations
 * Uses spring physics for natural, smooth transitions
 */

// Type definitions for Framer Motion animations
type Transition = {
  type?: 'spring' | 'tween' | 'inertia';
  stiffness?: number;
  damping?: number;
  duration?: number;
  mass?: number;
  delay?: number;
  delayChildren?: number;
  staggerChildren?: number;
};

type Variant = {
  x?: string | number;
  y?: string | number;
  opacity?: number;
  scale?: number;
  transition?: Transition;
};

type Variants = {
  [key: string]: Variant;
};

const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Sidebar slide animation
 * Animates from translateX(-100%) when collapsed to translateX(0) when expanded
 */
export const sidebarVariants: Variants = {
  collapsed: {
    x: '-100%',
    opacity: 0,
    transition: springTransition,
  },
  expanded: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
};

/**
 * Artifact panel slide animation
 * Animates from translateX(100%) when collapsed to translateX(0) when expanded
 */
export const artifactPanelVariants: Variants = {
  closed: {
    x: '100%',
    opacity: 0,
    transition: springTransition,
  },
  open: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
};

/**
 * Content reflow animation
 * Smoothly animates width changes when panels open/close
 */
export const contentReflowVariants: Variants = {
  animate: {
    transition: springTransition,
  },
};

/**
 * Fade animation for panel toggle buttons
 */
export const toggleButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15 },
  },
};

/**
 * Check if user prefers reduced motion
 * Returns true if prefers-reduced-motion is set
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation config that respects user's motion preferences
 * If user prefers reduced motion, returns instant transition
 */
export function getAccessibleTransition(
  transition: Transition = springTransition
): Transition {
  if (prefersReducedMotion()) {
    return {
      type: 'tween',
      duration: 0.01, // Nearly instant, but not jarring
    };
  }
  return transition;
}

/**
 * Get sidebar variants with accessibility support
 */
export function getSidebarVariants(): Variants {
  const transition = getAccessibleTransition();
  return {
    collapsed: {
      x: '-100%',
      opacity: 0,
      transition,
    },
    expanded: {
      x: 0,
      opacity: 1,
      transition,
    },
  };
}

/**
 * Get artifact panel variants with accessibility support
 */
export function getArtifactPanelVariants(): Variants {
  const transition = getAccessibleTransition();
  return {
    closed: {
      x: '100%',
      opacity: 0,
      transition,
    },
    open: {
      x: 0,
      opacity: 1,
      transition,
    },
  };
}

/**
 * Panel resize animation config
 * Smoother animation for interactive resizing
 */
export const resizeTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.5,
};

/**
 * Stagger animation for list items
 * Useful for animating conversation list or artifact tabs
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};
