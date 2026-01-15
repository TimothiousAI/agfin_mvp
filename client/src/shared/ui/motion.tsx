import { motion } from 'framer-motion';
import { AnimatePresence as FramerAnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import {
  fadeVariants,
  slideUpVariants,
  slideInRightVariants,
  slideInLeftVariants,
  scaleVariants,
  prefersReducedMotion,
} from '@/lib/animations';

/**
 * AnimatePresence wrapper
 * Use this to animate components in and out of the DOM
 */
export function AnimatePresence({ children, ...props }: { children: ReactNode; mode?: 'wait' | 'sync' | 'popLayout' }) {
  return (
    <FramerAnimatePresence {...props}>
      {children}
    </FramerAnimatePresence>
  );
}

/**
 * Fade component
 * Simple fade in/out animation
 */
interface FadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function Fade({ children, className, delay = 0 }: FadeProps) {
  const variants = {
    ...fadeVariants,
    visible: {
      ...fadeVariants.visible,
      transition: {
        duration: prefersReducedMotion() ? 0 : 0.2,
        delay: prefersReducedMotion() ? 0 : delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideUp component
 * Slides content up from bottom
 */
interface SlideUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SlideUp({ children, className, delay = 0 }: SlideUpProps) {
  const variants = {
    ...slideUpVariants,
    visible: {
      ...slideUpVariants.visible,
      transition: {
        ...(slideUpVariants.visible as any).transition,
        delay: prefersReducedMotion() ? 0 : delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Panel component
 * Slides in from side with spring animation
 */
interface PanelProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
}

export function Panel({ children, className, direction = 'right' }: PanelProps) {
  const variants = direction === 'right' ? slideInRightVariants : slideInLeftVariants;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale component
 * Scales content from slightly smaller to normal size
 * Perfect for modals and dialogs
 */
interface ScaleProps {
  children: ReactNode;
  className?: string;
}

export function Scale({ children, className }: ScaleProps) {
  return (
    <motion.div
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Backdrop component
 * Animated backdrop for modals
 */
interface BackdropProps {
  className?: string;
  onClick?: () => void;
}

export function Backdrop({ className, onClick }: BackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion() ? 0 : 0.2 }}
      className={className}
      onClick={onClick}
    />
  );
}

/**
 * Export motion for direct use
 */
export { motion };
