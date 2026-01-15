import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  /** Close sidebar when any navigation occurs */
  closeOnNavigation?: boolean;
}

/**
 * Mobile Sidebar Drawer Component
 *
 * Features:
 * - Slides from left with smooth animation
 * - Backdrop overlay (click to close)
 * - Swipe to close gesture (drag left)
 * - Focus trap when open (accessibility)
 * - Close on navigation (optional)
 * - Prevents body scroll when open
 * - Touch-optimized interactions
 *
 * @example
 * ```tsx
 * const [sidebarOpen, setSidebarOpen] = useState(false);
 *
 * <MobileSidebar
 *   isOpen={sidebarOpen}
 *   onClose={() => setSidebarOpen(false)}
 * >
 *   <SidebarContent />
 * </MobileSidebar>
 * ```
 */
export function MobileSidebar({
  isOpen,
  onClose,
  children,
  closeOnNavigation = true,
}: MobileSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const controls = useAnimation();

  // Prevent body scroll when sidebar is open
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

  // Focus trap: Keep focus within sidebar when open
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element when sidebar opens
    firstFocusable?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: Focus previous element
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: Focus next element
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Close on navigation (if enabled)
  useEffect(() => {
    if (!closeOnNavigation || !isOpen) return;

    // Listen for navigation events (clicks on links)
    const handleNavigation = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        onClose();
      }
    };

    document.addEventListener('click', handleNavigation);

    return () => {
      document.removeEventListener('click', handleNavigation);
    };
  }, [isOpen, onClose, closeOnNavigation]);

  // Handle swipe to close gesture
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Dragging left (negative offset)
    if (info.offset.x < -50) {
      onClose();
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged significantly left or with high velocity
    if (info.offset.x < -100 || info.velocity.x < -500) {
      onClose();
    } else {
      // Snap back to open position
      controls.start({ x: 0 });
    }
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

          {/* Sidebar */}
          <motion.aside
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -280, right: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#061623] z-50 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Sidebar Header */}
            <div className="h-14 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Agrellus Logo */}
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#30714C] font-bold text-lg">A</span>
                </div>
                <h2 className="text-white font-semibold text-lg">AgFin</h2>
              </div>

              {/* Close Button - 44x44px touch target */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-11 h-11 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drag Indicator (subtle visual cue) */}
            <div className="absolute top-1/2 right-2 w-1 h-12 bg-white/10 rounded-full -translate-y-1/2" />

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {children || (
                <div className="p-4">
                  <p className="text-white/60 text-sm">Sidebar content</p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
