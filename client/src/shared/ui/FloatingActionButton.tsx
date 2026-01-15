import { ReactNode, useState, useEffect, useRef } from 'react';
import { Plus, Upload, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  /** Primary action when FAB is clicked (if not expandable) */
  onClick?: () => void;
  /** Icon for the FAB (default: Plus) */
  icon?: ReactNode;
  /** Show/hide FAB based on scroll direction */
  hideOnScroll?: boolean;
  /** Multiple actions (makes FAB expandable) */
  actions?: FABAction[];
  /** Position offset from bottom-right */
  bottomOffset?: number;
  rightOffset?: number;
}

/**
 * Floating Action Button (FAB) Component
 *
 * Features:
 * - Fixed position bottom-right corner
 * - Primary action button with Agrellus green styling
 * - Expandable to show multiple actions
 * - Auto-hide on scroll down, show on scroll up
 * - Touch-friendly 56x56px size
 * - Smooth animations with Framer Motion
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * // Simple FAB
 * <FloatingActionButton
 *   onClick={() => console.log('New message')}
 *   icon={<MessageSquare />}
 * />
 *
 * // Expandable FAB with multiple actions
 * <FloatingActionButton
 *   actions={[
 *     { icon: <MessageSquare />, label: 'New message', onClick: handleNewMessage },
 *     { icon: <Upload />, label: 'Upload document', onClick: handleUpload },
 *   ]}
 * />
 * ```
 */
export function FloatingActionButton({
  onClick,
  icon = <Plus size={24} />,
  hideOnScroll = true,
  actions = [],
  bottomOffset = 24,
  rightOffset = 24,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

  const isExpandable = actions.length > 0;

  // Handle scroll to show/hide FAB
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Only update if scroll delta exceeds threshold
      if (Math.abs(scrollDelta) > scrollThreshold) {
        if (scrollDelta > 0 && currentScrollY > 100) {
          // Scrolling down - hide FAB
          setIsVisible(false);
          setIsExpanded(false); // Close expanded menu when hiding
        } else if (scrollDelta < 0) {
          // Scrolling up - show FAB
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hideOnScroll]);

  // Close expanded menu when clicking outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-fab]')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  const handleMainButtonClick = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <div
      data-fab
      className="fixed z-30"
      style={{
        bottom: `${bottomOffset}px`,
        right: `${rightOffset}px`,
      }}
    >
      {/* Expanded Action Buttons */}
      <AnimatePresence>
        {isExpanded && isExpandable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Action Label */}
                <span className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>

                {/* Action Button */}
                <button
                  onClick={() => handleActionClick(action)}
                  className="flex items-center justify-center w-12 h-12 bg-[#30714C] text-white rounded-full shadow-lg hover:bg-[#3d8a5f] transition-colors active:scale-95"
                  aria-label={action.label}
                  style={action.color ? { backgroundColor: action.color } : undefined}
                >
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleMainButtonClick}
            className="flex items-center justify-center w-14 h-14 bg-[#30714C] text-white rounded-full shadow-xl hover:bg-[#3d8a5f] transition-colors active:scale-95"
            aria-label={isExpandable ? 'Open actions menu' : 'Primary action'}
            aria-expanded={isExpandable ? isExpanded : undefined}
          >
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {icon}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
