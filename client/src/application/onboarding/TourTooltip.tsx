import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { usePrefersReducedMotion } from '@/shared/accessibility/reducedMotion';
import type { TourStep } from './tourSteps';

interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  visible: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export function TourTooltip({
  step,
  currentStep,
  totalSteps,
  visible,
  onNext,
  onPrevious,
  onSkip,
}: TourTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const target = document.querySelector(step.targetSelector);
      const tooltip = tooltipRef.current;
      if (!target || !tooltip) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const padding = step.highlightPadding || 8;
      const gap = 16;

      let newPosition: TooltipPosition = {};

      switch (step.position) {
        case 'top':
          newPosition = {
            bottom: window.innerHeight - targetRect.top + padding + gap,
            left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          };
          break;
        case 'bottom':
          newPosition = {
            top: targetRect.bottom + padding + gap,
            left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          };
          break;
        case 'left':
          newPosition = {
            top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
            right: window.innerWidth - targetRect.left + padding + gap,
          };
          break;
        case 'right':
          newPosition = {
            top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
            left: targetRect.right + padding + gap,
          };
          break;
      }

      // Clamp to viewport
      if (newPosition.left !== undefined) {
        newPosition.left = Math.max(16, Math.min(newPosition.left, window.innerWidth - tooltipRect.width - 16));
      }
      if (newPosition.top !== undefined) {
        newPosition.top = Math.max(16, Math.min(newPosition.top, window.innerHeight - tooltipRect.height - 16));
      }

      setPosition(newPosition);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step, visible]);

  // Focus tooltip when visible
  useEffect(() => {
    if (visible && tooltipRef.current) {
      tooltipRef.current.focus();
    }
  }, [visible, step.id]);

  const animationVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.9, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 10 }
      };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          ref={tooltipRef}
          tabIndex={-1}
          className="fixed z-[101] w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden outline-none"
          style={position}
          {...animationVariants}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-tooltip-title"
          aria-describedby="tour-tooltip-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#30714C]">
            <span className="text-sm font-medium text-white">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={onSkip}
              className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3
              id="tour-tooltip-title"
              className="text-lg font-semibold text-[#061623] mb-2"
            >
              {step.title}
            </h3>
            <p
              id="tour-tooltip-description"
              className="text-sm text-gray-600 mb-4"
            >
              {step.description}
            </p>

            {/* Interactive prompt */}
            {step.interactivePrompt && (
              <div className="bg-[#DDC66F]/10 border border-[#DDC66F]/30 rounded-md p-3 mb-4">
                <p className="text-sm text-[#30714C] font-medium">
                  {step.interactivePrompt}
                </p>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep
                      ? 'bg-[#30714C]'
                      : idx < currentStep
                      ? 'bg-[#30714C]/40'
                      : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={isFirstStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className="text-gray-500"
              >
                Skip Tour
              </Button>

              <Button
                size="sm"
                onClick={onNext}
                className="flex items-center gap-1 bg-[#30714C] hover:bg-[#25563A]"
              >
                {isLastStep ? 'Done' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
