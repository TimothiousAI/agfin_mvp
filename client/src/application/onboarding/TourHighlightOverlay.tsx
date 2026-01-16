import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '@/shared/accessibility/reducedMotion';

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourHighlightOverlayProps {
  targetSelector: string;
  padding?: number;
  visible: boolean;
  onClick?: () => void;
}

export function TourHighlightOverlay({
  targetSelector,
  padding = 8,
  visible,
  onClick,
}: TourHighlightOverlayProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!visible) {
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const bounds = element.getBoundingClientRect();
        setRect({
          top: bounds.top - padding,
          left: bounds.left - padding,
          width: bounds.width + padding * 2,
          height: bounds.height + padding * 2,
        });
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(updateRect);
    };

    updateRect();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      setRect(null);
    };
  }, [targetSelector, padding, visible]);

  const animationProps = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  return (
    <AnimatePresence>
      {visible && rect && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-auto"
          onClick={onClick}
          {...animationProps}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          {/* SVG overlay with cutout */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="tour-highlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#tour-highlight-mask)"
              style={{ pointerEvents: 'auto' }}
            />
          </svg>

          {/* Highlight border */}
          <motion.div
            className="absolute border-2 border-[#30714C] rounded-lg pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    boxShadow: [
                      '0 0 0 0 rgba(48, 113, 76, 0.4)',
                      '0 0 0 8px rgba(48, 113, 76, 0)',
                    ],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
