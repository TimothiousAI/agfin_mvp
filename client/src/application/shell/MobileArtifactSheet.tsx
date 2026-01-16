import type { ReactNode } from 'react';
import { useEffect, useState, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

interface MobileArtifactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  /** Initial snap point: 'half' or 'full' */
  initialSnap?: 'half' | 'full';
}

/**
 * Snap point positions
 */
const SNAP_POINTS = {
  half: '50vh',
  full: '85vh',
} as const;

const SNAP_POINTS_PX = {
  half: 0.5,
  full: 0.85,
} as const;

/**
 * Mobile Artifact Sheet Component (Bottom Sheet)
 *
 * Features:
 * - Slides up from bottom with smooth animation
 * - Drag handle for visual affordance
 * - Snap points: half screen (50%) and full screen (85%)
 * - Swipe down to close gesture
 * - Backdrop overlay (tap to close)
 * - Keyboard avoidance (max 85vh to avoid keyboard)
 * - Touch-optimized dragging
 * - Rounded top corners for modern mobile UX
 *
 * @example
 * ```tsx
 * const [sheetOpen, setSheetOpen] = useState(false);
 *
 * <MobileArtifactSheet
 *   isOpen={sheetOpen}
 *   onClose={() => setSheetOpen(false)}
 *   initialSnap="half"
 * >
 *   <ArtifactContent />
 * </MobileArtifactSheet>
 * ```
 */
export function MobileArtifactSheet({
  isOpen,
  onClose,
  children,
  initialSnap = 'half',
}: MobileArtifactSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<'half' | 'full'>(initialSnap);
  useAnimation(); // Required for drag gesture to work, but value not directly used
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard (focus on first input when opened)
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    // Focus first input if exists
    const firstInput = sheetRef.current.querySelector<HTMLElement>(
      'input, textarea, select'
    );
    firstInput?.focus();
  }, [isOpen]);

  // Handle drag gesture
  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Dragging down (positive offset)
    const dragThreshold = 100;
    if (info.offset.y > dragThreshold) {
      // If dragged significantly down, close
      onClose();
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const windowHeight = window.innerHeight;
    const currentHeight = sheetRef.current?.getBoundingClientRect().height || 0;
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;

    // Close if dragged down significantly or with high velocity
    if (dragDistance > 150 || dragVelocity > 500) {
      onClose();
      return;
    }

    // Snap to nearest point based on current position and velocity
    const currentHeightPercent = currentHeight / windowHeight;

    if (dragVelocity < -500) {
      // Fast swipe up -> snap to full
      setCurrentSnap('full');
    } else if (dragVelocity > 500) {
      // Fast swipe down -> close or snap to half
      if (currentSnap === 'full') {
        setCurrentSnap('half');
      } else {
        onClose();
      }
    } else {
      // Slow drag -> snap to nearest
      const midpoint = (SNAP_POINTS_PX.half + SNAP_POINTS_PX.full) / 2;
      if (currentHeightPercent > midpoint) {
        setCurrentSnap('full');
      } else {
        setCurrentSnap('half');
      }
    }
  };

  // Get height for current snap point
  const getHeight = () => {
    return SNAP_POINTS[currentSnap];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: getHeight() }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-[#061623] z-50 shadow-2xl flex flex-col rounded-t-2xl"
            style={{ maxHeight: '85vh' }}
            role="dialog"
            aria-modal="true"
            aria-label="Artifact viewer"
          >
            {/* Drag Handle Area - Extra touch target area */}
            <div
              className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
              onDoubleClick={() => {
                // Double tap to toggle between half and full
                setCurrentSnap(currentSnap === 'half' ? 'full' : 'half');
              }}
            >
              {/* Visual Drag Handle */}
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
              <h3 className="text-white font-medium text-lg">Artifact</h3>

              <div className="flex items-center gap-1">
                {/* Minimize Button - Snap to half */}
                {currentSnap === 'full' && (
                  <button
                    onClick={() => setCurrentSnap('half')}
                    className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors active:scale-95"
                    aria-label="Minimize"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}

                {/* Close Button - 44x44px touch target */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors active:scale-95"
                  aria-label="Close artifact"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sheet Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {children || (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/60 text-sm">Artifact content</p>
                </div>
              )}
            </div>

            {/* Snap Point Indicator (optional visual feedback) */}
            <div className="absolute top-16 right-4 flex flex-col gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  currentSnap === 'full' ? 'bg-[#30714C]' : 'bg-white/20'
                }`}
              />
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  currentSnap === 'half' ? 'bg-[#30714C]' : 'bg-white/20'
                }`}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
