/**
 * Reduced Motion Utilities
 *
 * Respects user's prefers-reduced-motion preference
 * - Provides hook to check motion preference
 * - Utilities for conditional animations
 * - CSS class helpers
 * - Safe animation defaults
 */

import { useState, useEffect } from 'react';

/**
 * Hook to check if user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check initial value
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get safe animation duration based on motion preference
 * @param normalDuration - Duration in ms when motion is allowed
 * @param reducedDuration - Duration in ms when motion is reduced (default: 0)
 * @returns Safe duration value
 */
export function getSafeAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  if (typeof window === 'undefined') return normalDuration;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReduced ? reducedDuration : normalDuration;
}

/**
 * Get safe spring config for animations
 * Returns instant config if reduced motion is preferred
 */
export function getSafeSpringConfig(normalConfig: {
  tension?: number;
  friction?: number;
  duration?: number;
}): typeof normalConfig {
  if (typeof window === 'undefined') return normalConfig;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    return {
      tension: 500,  // Instant
      friction: 50,  // No bounce
      duration: 0,   // Immediate
    };
  }

  return normalConfig;
}

/**
 * Conditional animation class helper
 * Returns animation class only if motion is allowed
 * @param animationClass - CSS class with animation
 * @param staticClass - CSS class without animation (optional)
 * @returns Appropriate class name
 */
export function getMotionClass(
  animationClass: string,
  staticClass: string = ''
): string {
  if (typeof window === 'undefined') return animationClass;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReduced ? staticClass : animationClass;
}

/**
 * Check if animations should be enabled
 * @returns true if animations should run, false if they should be disabled
 */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return true;

  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safe setTimeout that respects reduced motion
 * Executes immediately if reduced motion is preferred
 * @param callback - Function to execute
 * @param delay - Delay in ms (ignored if reduced motion)
 * @returns Timeout ID
 */
export function safeTimeout(
  callback: () => void,
  delay: number
): ReturnType<typeof setTimeout> {
  const actualDelay = getSafeAnimationDuration(delay, 0);
  return setTimeout(callback, actualDelay);
}

/**
 * Safe setInterval that respects reduced motion
 * Uses reduced interval if reduced motion is preferred
 * @param callback - Function to execute
 * @param interval - Interval in ms
 * @param reducedInterval - Interval when reduced motion (default: same as interval)
 * @returns Interval ID
 */
export function safeInterval(
  callback: () => void,
  interval: number,
  reducedInterval?: number
): ReturnType<typeof setInterval> {
  const actualInterval = getSafeAnimationDuration(
    interval,
    reducedInterval ?? interval
  );
  return setInterval(callback, actualInterval);
}

/**
 * Transition styles based on motion preference
 * @param normalTransition - CSS transition value for normal motion
 * @param reducedTransition - CSS transition value for reduced motion (default: 'none')
 * @returns Appropriate transition value
 */
export function getTransitionStyle(
  normalTransition: string,
  reducedTransition: string = 'none'
): string {
  if (typeof window === 'undefined') return normalTransition;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReduced ? reducedTransition : normalTransition;
}

/**
 * Apply reduced motion styles to an element
 * @param element - DOM element to modify
 */
export function applyReducedMotionStyles(element: HTMLElement): void {
  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    element.style.animation = 'none';
    element.style.transition = 'none';
    element.style.animationDuration = '0s';
    element.style.transitionDuration = '0s';
  }
}

/**
 * Animation variants for Framer Motion with reduced motion support
 */
export const motionVariants = {
  /**
   * Fade in animation (or instant appear for reduced motion)
   */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: getSafeAnimationDuration(0.3, 0),
    },
  },

  /**
   * Slide in from bottom (or instant appear for reduced motion)
   */
  slideInFromBottom: {
    initial: shouldAnimate() ? { opacity: 0, y: 20 } : { opacity: 0 },
    animate: { opacity: 1, y: 0 },
    exit: shouldAnimate() ? { opacity: 0, y: 20 } : { opacity: 0 },
    transition: {
      duration: getSafeAnimationDuration(0.3, 0),
    },
  },

  /**
   * Slide in from right (or instant appear for reduced motion)
   */
  slideInFromRight: {
    initial: shouldAnimate() ? { opacity: 0, x: 20 } : { opacity: 0 },
    animate: { opacity: 1, x: 0 },
    exit: shouldAnimate() ? { opacity: 0, x: 20 } : { opacity: 0 },
    transition: {
      duration: getSafeAnimationDuration(0.3, 0),
    },
  },

  /**
   * Scale in (or instant appear for reduced motion)
   */
  scaleIn: {
    initial: shouldAnimate() ? { opacity: 0, scale: 0.95 } : { opacity: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: shouldAnimate() ? { opacity: 0, scale: 0.95 } : { opacity: 0 },
    transition: {
      duration: getSafeAnimationDuration(0.2, 0),
    },
  },
};

/**
 * CSS-in-JS animation styles with reduced motion support
 */
export const animationStyles = {
  /**
   * Fade transition
   */
  fade: {
    transition: getTransitionStyle('opacity 0.3s ease-in-out', 'none'),
  },

  /**
   * Transform transition (for slides, scales, etc.)
   */
  transform: {
    transition: getTransitionStyle(
      'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
      'opacity 0.1s ease-in-out'
    ),
  },

  /**
   * Color transition (always allowed - not motion-sickness inducing)
   */
  color: {
    transition: 'color 0.2s ease-in-out, background-color 0.2s ease-in-out',
  },

  /**
   * All transitions (respects reduced motion)
   */
  all: {
    transition: getTransitionStyle('all 0.3s ease-in-out', 'none'),
  },
};

/**
 * Register global reduced motion media query listener
 * Adds/removes class on document for CSS targeting
 */
export function initReducedMotionListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateClass = (matches: boolean) => {
    if (matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  // Initial update
  updateClass(mediaQuery.matches);

  // Listen for changes
  const handler = (e: MediaQueryListEvent) => updateClass(e.matches);
  mediaQuery.addEventListener('change', handler);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Constants for safe animation durations
 */
export const ANIMATION_DURATIONS = {
  instant: 0,
  fast: getSafeAnimationDuration(150, 0),
  normal: getSafeAnimationDuration(300, 0),
  slow: getSafeAnimationDuration(500, 0),
  slower: getSafeAnimationDuration(800, 0),
} as const;

/**
 * Type guard to check if motion is safe
 */
export function isMotionSafe(): boolean {
  return shouldAnimate();
}
