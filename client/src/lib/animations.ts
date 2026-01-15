/**
 * Animation presets for common UI patterns
 * Respects prefers-reduced-motion user preference
 */

type Variants = {
  [key: string]: any;
};

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Spring configuration for smooth, natural animations
export const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// Reduced spring for subtle animations
export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
};

// Fast spring for snappy interactions
export const snappySpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
};

/**
 * Fade animation preset
 * Usage: <motion.div variants={fadeVariants} initial="hidden" animate="visible" />
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.15 },
  },
};

/**
 * Slide in from bottom preset
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : { ...springConfig },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 20,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 },
  },
};

/**
 * Slide in from right preset (for panels)
 */
export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : { ...springConfig },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : 40,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 },
  },
};

/**
 * Slide in from left preset (for panels)
 */
export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : { ...springConfig },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : -40,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 },
  },
};

/**
 * Scale animation preset (for modals, dialogs)
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : { ...springConfig },
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.95,
    transition: { duration: prefersReducedMotion() ? 0 : 0.15 },
  },
};

/**
 * Panel animation with spring (for side panels, drawers)
 */
export const panelSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 35,
  mass: 1,
};

/**
 * Stagger children animation
 * Usage in parent: <motion.div variants={staggerContainer} />
 * Usage in children: <motion.div variants={staggerItem} />
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.1,
      delayChildren: prefersReducedMotion() ? 0 : 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : { duration: 0.3 },
  },
};

/**
 * Rotate animation (for loading spinners, refresh icons)
 */
export const rotateVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: prefersReducedMotion() ? 0 : 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Pulse animation (for indicators, badges)
 */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: prefersReducedMotion() ? 1 : [1, 1.05, 1],
    transition: {
      duration: prefersReducedMotion() ? 0 : 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce animation (for notifications, alerts)
 */
export const bounceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReducedMotion()
      ? { duration: 0 }
      : {
          type: 'spring',
          stiffness: 500,
          damping: 15,
        },
  },
};
