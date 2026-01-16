import React, { useEffect, useCallback } from 'react';
import { X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import ArtifactContent from './ArtifactContent';
import type { Artifact } from './ArtifactContent';

export interface FullScreenArtifactProps {
  /** The artifact to display in full-screen */
  artifact: Artifact;
  /** Whether full-screen mode is active */
  isFullScreen: boolean;
  /** Callback to exit full-screen mode */
  onExitFullScreen: () => void;
  /** Callback when artifact content changes */
  onChange?: (data: any) => void;
  /** Callback when artifact form is submitted */
  onSubmit?: (data: any) => void;
}

/**
 * Full-screen animation variants
 */
const fullScreenVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

/**
 * Header animation variants
 */
const headerVariants: Variants = {
  hidden: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      delay: 0.05,
    },
  },
};

/**
 * Content animation variants
 */
const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  },
};

/**
 * FullScreenArtifact Component
 *
 * Displays an artifact in full-screen mode, hiding all other UI elements.
 * Features:
 * - Fills entire viewport
 * - Escape key to exit
 * - Preserves artifact state
 * - Smooth entry/exit animations
 * - Accessible controls
 */
export default function FullScreenArtifact({
  artifact,
  isFullScreen,
  onExitFullScreen,
  onChange,
  onSubmit,
}: FullScreenArtifactProps) {
  /**
   * Handle Escape key press to exit full-screen
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        event.preventDefault();
        onExitFullScreen();
      }
    },
    [isFullScreen, onExitFullScreen]
  );

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling in full-screen mode
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isFullScreen, handleKeyDown]);

  /**
   * Prevent rendering if not in full-screen mode
   */
  if (!isFullScreen) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isFullScreen && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#061623] flex flex-col"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fullScreenVariants}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen artifact view"
        >
          {/* Full-screen Header */}
          <motion.header
            className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-6 flex-shrink-0"
            variants={headerVariants}
          >
            {/* Artifact Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Artifact Type Badge */}
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-[#30714C] text-white flex-shrink-0">
                {artifact.type.replace('_', ' ').toUpperCase()}
              </span>

              {/* Artifact Title */}
              <h2 className="text-white font-medium truncate">{artifact.title}</h2>

              {/* Full-screen indicator */}
              <span className="text-white/40 text-xs hidden sm:inline">
                (Full screen)
              </span>
            </div>

            {/* Exit Controls */}
            <div className="flex items-center gap-2">
              {/* Exit Full-screen Button */}
              <button
                onClick={onExitFullScreen}
                className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label="Exit full screen"
                title="Exit full screen (Esc)"
              >
                <Minimize2 size={18} />
                <span className="text-sm hidden sm:inline">Exit</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onExitFullScreen}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </motion.header>

          {/* Full-screen Content Area */}
          <motion.main
            className="flex-1 overflow-y-auto overflow-x-hidden"
            variants={contentVariants}
          >
            <div className="max-w-[1400px] mx-auto p-6">
              <ArtifactContent
                artifact={artifact}
                onClose={onExitFullScreen}
                onChange={onChange}
                onSubmit={onSubmit}
              />
            </div>
          </motion.main>

          {/* Keyboard Shortcuts Hint */}
          <motion.div
            className="h-8 bg-[#0D2233] border-t border-[#061623] flex items-center justify-center px-4 flex-shrink-0"
            variants={headerVariants}
          >
            <p className="text-white/40 text-xs text-center">
              Press <kbd className="px-1.5 py-0.5 bg-[#061623] rounded text-white/60">Esc</kbd> to
              exit full screen
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage full-screen artifact state
 */
export function useFullScreenArtifact() {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [fullScreenArtifact, setFullScreenArtifact] = React.useState<Artifact | null>(null);

  const enterFullScreen = useCallback((artifact: Artifact) => {
    setFullScreenArtifact(artifact);
    setIsFullScreen(true);
  }, []);

  const exitFullScreen = useCallback(() => {
    setIsFullScreen(false);
    // Keep artifact data for smooth exit animation
    setTimeout(() => {
      setFullScreenArtifact(null);
    }, 200);
  }, []);

  const toggleFullScreen = useCallback(
    (artifact?: Artifact) => {
      if (isFullScreen) {
        exitFullScreen();
      } else if (artifact) {
        enterFullScreen(artifact);
      }
    },
    [isFullScreen, enterFullScreen, exitFullScreen]
  );

  return {
    isFullScreen,
    fullScreenArtifact,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen,
  };
}

/**
 * Portal component to render full-screen artifact at document root
 * This ensures it's above all other content and not affected by parent styles
 */
export function FullScreenArtifactPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  // Use React Portal to render at document body level
  if (typeof document !== 'undefined') {
    const portalRoot = document.getElementById('fullscreen-portal') || document.body;
    return ReactDOM.createPortal(children, portalRoot);
  }

  return null;
}

// Import ReactDOM for portal
import ReactDOM from 'react-dom';
