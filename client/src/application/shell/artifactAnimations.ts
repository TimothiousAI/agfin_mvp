/**
 * Animation configuration specifically for Artifact Panel
 * Provides smooth slide-in/out transitions with spring physics
 */

/**
 * Check if user prefers reduced motion
 * Returns true if prefers-reduced-motion is set
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Transition type definition for framer-motion
 */
export interface TransitionConfig {
  type: 'spring' | 'tween';
  stiffness?: number;
  damping?: number;
  duration?: number;
}

/**
 * Variant type definition for framer-motion animations
 */
export interface VariantConfig {
  [key: string]: {
    x?: string | number;
    y?: string | number;
    opacity?: number;
    scale?: number;
    width?: string;
    transition?: TransitionConfig | { delay?: number; duration?: number; staggerChildren?: number; delayChildren?: number };
  };
}

/**
 * Spring animation configuration for artifact panel
 * Tuned for smooth, natural-feeling transitions
 */
export const artifactSpringConfig: TransitionConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Reduced motion fallback
 * Provides quick tween animation when user prefers reduced motion
 */
export const reducedMotionConfig: TransitionConfig = {
  type: 'tween',
  duration: 0.01, // Nearly instant
};

/**
 * Get transition config that respects user preferences
 */
export function getArtifactTransition(): TransitionConfig {
  return prefersReducedMotion() ? reducedMotionConfig : artifactSpringConfig;
}

/**
 * Artifact panel slide animation variants
 *
 * Slides from right (translateX 100% → 0) when opening
 * Slides to right (translateX 0 → 100%) when closing
 * Content fades in/out during transition
 */
export const artifactSlideVariants: VariantConfig = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: getArtifactTransition(),
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: getArtifactTransition(),
  },
};

/**
 * Content fade-in animation
 * Used for artifact content that appears after panel slides in
 */
export const contentFadeVariants: VariantConfig = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.1, // Slight delay after panel slides in
      duration: 0.2,
    },
  },
};

/**
 * Chat center resize animation
 * Coordinates with artifact panel opening/closing
 * Smoothly adjusts width as panel slides
 */
export const chatCenterResizeVariants: VariantConfig = {
  // Width will be set dynamically based on panel state
  animate: {
    transition: artifactSpringConfig,
  },
};

/**
 * Full-screen mode animation
 * Expands artifact panel to full width
 */
export const fullScreenVariants: VariantConfig = {
  normal: {
    width: '400px',
    transition: artifactSpringConfig,
  },
  fullscreen: {
    width: '100%',
    transition: artifactSpringConfig,
  },
};

/**
 * Header controls fade animation
 * Smoothly shows/hides panel header controls
 */
export const headerControlsVariants: VariantConfig = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Tab bar stagger animation
 * Animates tabs appearing one by one
 */
export const tabBarContainerVariants: VariantConfig = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const tabBarItemVariants: VariantConfig = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};
