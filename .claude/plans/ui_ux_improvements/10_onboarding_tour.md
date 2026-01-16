# Implementation Plan: Feature Tour Onboarding Experience

**Scope**: Add an interactive onboarding tour that introduces new users to AgFin's key features through guided tooltips with highlight overlays
**Services Affected**: client
**Estimated Steps**: 14

---

## Overview

This feature implements a guided onboarding tour for first-time users (PRD Section 7.11). The tour will highlight 4 key capabilities: chat interface, document upload, progress panel, and audit view. The implementation uses a step-based approach with highlight overlays, dismissible tooltips, localStorage persistence for completion state, and full accessibility support including prefers-reduced-motion.

---

## Prerequisites

- [ ] Existing tooltip.tsx component (Radix UI based) - already present
- [ ] Dialog components for welcome modal - already present
- [ ] Framer Motion for animations - already present
- [ ] reducedMotion.ts utilities - already present

---

## Implementation Steps

### Phase 1: Onboarding Store and Persistence

**Step 1.1**: Create onboarding Zustand store with localStorage persistence

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\useOnboardingStore.ts`
- Changes: New file with tour state management

```typescript
import { create } from 'zustand';

const STORAGE_KEY = 'agfin-onboarding-state';

export interface OnboardingState {
  // Tour state
  hasCompletedTour: boolean;
  tourActive: boolean;
  currentStep: number;
  showWelcomeModal: boolean;

  // Actions
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  setShowWelcomeModal: (show: boolean) => void;
}

// Load from localStorage
const loadPersistedState = (): Partial<OnboardingState> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save to localStorage
const saveToLocalStorage = (state: Partial<OnboardingState>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hasCompletedTour: state.hasCompletedTour,
    }));
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
};

const persisted = loadPersistedState();

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedTour: persisted.hasCompletedTour ?? false,
  tourActive: false,
  currentStep: 0,
  showWelcomeModal: false,

  startTour: () => set({ tourActive: true, currentStep: 0 }),

  nextStep: () => {
    const { currentStep } = get();
    const totalSteps = 4; // Will be defined in tour config
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().completeTour();
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  skipTour: () => {
    set({ tourActive: false, hasCompletedTour: true, currentStep: 0 });
    saveToLocalStorage({ hasCompletedTour: true });
  },

  completeTour: () => {
    set({ tourActive: false, hasCompletedTour: true, currentStep: 0 });
    saveToLocalStorage({ hasCompletedTour: true });
  },

  resetTour: () => {
    set({ hasCompletedTour: false, tourActive: false, currentStep: 0 });
    saveToLocalStorage({ hasCompletedTour: false });
  },

  setShowWelcomeModal: (show: boolean) => set({ showWelcomeModal: show }),
}));
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 2: Tour Step Configuration

**Step 2.1**: Create tour steps configuration

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\tourSteps.ts`
- Changes: Define the 4 tour steps with targets and content

```typescript
export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  interactivePrompt?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'chat-interface',
    targetSelector: '[data-tour="chat-input"]',
    title: 'Chat Interface',
    description: 'This is your primary workspace. Ask the AI assistant anything about loan applications, upload documents, or get help with certification tasks.',
    position: 'top',
    highlightPadding: 8,
    interactivePrompt: 'Try typing "Start a new loan application"',
  },
  {
    id: 'document-upload',
    targetSelector: '[data-tour="document-upload"]',
    title: 'Document Upload',
    description: 'Upload supporting documents here. Our AI-powered OCR will automatically extract relevant information and populate application fields.',
    position: 'left',
    highlightPadding: 12,
  },
  {
    id: 'progress-panel',
    targetSelector: '[data-tour="progress-panel"]',
    title: 'Progress Tracking',
    description: 'Track your application progress across all modules. See which sections are complete, pending review, or need attention.',
    position: 'left',
    highlightPadding: 8,
  },
  {
    id: 'audit-view',
    targetSelector: '[data-tour="audit-view"]',
    title: 'Audit & Review',
    description: 'Review extracted data, verify field values, and track the source of each piece of information for compliance.',
    position: 'bottom',
    highlightPadding: 8,
  },
];

export const TOTAL_STEPS = TOUR_STEPS.length;
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 3: Tour Overlay Component

**Step 3.1**: Create the highlight overlay component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\TourHighlightOverlay.tsx`
- Changes: Full-screen overlay with cutout for highlighted element

```typescript
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
  const rafRef = useRef<number>();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!visible) {
      setRect(null);
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
      }
      rafRef.current = requestAnimationFrame(updateRect);
    };

    updateRect();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
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
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 4: Tour Tooltip Component

**Step 4.1**: Create the tour tooltip with step indicator

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\TourTooltip.tsx`
- Changes: Positioned tooltip with navigation buttons

```typescript
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
          className="fixed z-[101] w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          style={position}
          {...animationVariants}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          role="dialog"
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
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 5: Welcome Modal Component

**Step 5.1**: Create the welcome modal with quick overview

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\WelcomeModal.tsx`
- Changes: Initial modal shown to new users

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { MessageSquare, Upload, BarChart3, CheckCircle2, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat Interface',
    description: 'Conversational AI assistant for all tasks',
  },
  {
    icon: Upload,
    title: 'Smart Documents',
    description: 'AI-powered OCR extracts data automatically',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Real-time visibility into application status',
  },
  {
    icon: CheckCircle2,
    title: 'Audit Trail',
    description: 'Complete traceability for compliance',
  },
];

export function WelcomeModal({
  open,
  onOpenChange,
  onStartTour,
  onSkip,
}: WelcomeModalProps) {
  const handleStartTour = () => {
    onOpenChange(false);
    onStartTour();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#30714C] flex items-center justify-center">
            <span className="text-2xl font-bold text-white">Ag</span>
          </div>

          <DialogTitle className="text-2xl">Welcome to AgFin</DialogTitle>
          <DialogDescription className="text-base">
            Your AI-powered crop loan application platform
          </DialogDescription>
        </DialogHeader>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 py-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
            >
              <feature.icon className="w-5 h-5 text-[#30714C] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-[#061623]">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Time estimate */}
        <p className="text-center text-sm text-gray-500 mb-4">
          Take a quick 30-second tour to get started
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleStartTour}
            className="w-full bg-[#30714C] hover:bg-[#25563A] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Tour
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-gray-500 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 6: Main Tour Provider Component

**Step 6.1**: Create the tour provider that orchestrates everything

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\TourProvider.tsx`
- Changes: Context provider and tour orchestration

```typescript
import { useEffect } from 'react';
import { useOnboardingStore } from './useOnboardingStore';
import { TOUR_STEPS, TOTAL_STEPS } from './tourSteps';
import { TourHighlightOverlay } from './TourHighlightOverlay';
import { TourTooltip } from './TourTooltip';
import { WelcomeModal } from './WelcomeModal';

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const {
    hasCompletedTour,
    tourActive,
    currentStep,
    showWelcomeModal,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    setShowWelcomeModal,
  } = useOnboardingStore();

  // Show welcome modal for first-time users after a brief delay
  useEffect(() => {
    if (!hasCompletedTour && !tourActive) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000); // Delay to let the app load
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, tourActive, setShowWelcomeModal]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!tourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        previousStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, nextStep, previousStep, skipTour]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!tourActive) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const element = document.querySelector(step.targetSelector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [tourActive, currentStep]);

  const currentTourStep = TOUR_STEPS[currentStep];

  return (
    <>
      {children}

      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
        onStartTour={startTour}
        onSkip={skipTour}
      />

      {/* Tour Overlay */}
      {tourActive && currentTourStep && (
        <>
          <TourHighlightOverlay
            targetSelector={currentTourStep.targetSelector}
            padding={currentTourStep.highlightPadding}
            visible={tourActive}
            onClick={nextStep}
          />

          <TourTooltip
            step={currentTourStep}
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            visible={tourActive}
            onNext={nextStep}
            onPrevious={previousStep}
            onSkip={skipTour}
          />
        </>
      )}
    </>
  );
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 7: Index Export

**Step 7.1**: Create barrel export for onboarding module

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\index.ts`
- Changes: Export all onboarding components

```typescript
export { TourProvider } from './TourProvider';
export { WelcomeModal } from './WelcomeModal';
export { TourTooltip } from './TourTooltip';
export { TourHighlightOverlay } from './TourHighlightOverlay';
export { useOnboardingStore } from './useOnboardingStore';
export { TOUR_STEPS, TOTAL_STEPS, type TourStep } from './tourSteps';
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 8: Add Tour Data Attributes to Target Elements

**Step 8.1**: Add data-tour attribute to ChatInput

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\ChatInput.tsx`
- Changes: Add `data-tour="chat-input"` to the main input container

```typescript
// Find the main container div for the chat input and add:
data-tour="chat-input"
```

**Step 8.2**: Add data-tour attribute to DocumentUpload area

- File: `C:\Users\timca\Business\agfin_app\client\src\application\documents\DocumentUpload.tsx`
- Changes: Add `data-tour="document-upload"` to the upload trigger/dropzone

```typescript
// Find the main upload container and add:
data-tour="document-upload"
```

**Step 8.3**: Add data-tour attribute to ProgressPanel

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ProgressPanel.tsx`
- Changes: Add `data-tour="progress-panel"` to the progress section

```typescript
// Find the main progress container and add:
data-tour="progress-panel"
```

**Step 8.4**: Add data-tour attribute to Audit view

- File: `C:\Users\timca\Business\agfin_app\client\src\application\audit\DualPaneReview.tsx`
- Changes: Add `data-tour="audit-view"` to the audit panel

```typescript
// Find the main audit container and add:
data-tour="audit-view"
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build`

---

### Phase 9: Integrate TourProvider into App

**Step 9.1**: Wrap the app with TourProvider

- File: `C:\Users\timca\Business\agfin_app\client\src\App.tsx`
- Changes: Add TourProvider wrapper inside the authentication boundary

```typescript
import { TourProvider } from '@/application/onboarding';

// Inside the authenticated routes, wrap with TourProvider:
<TourProvider>
  {/* existing app content */}
</TourProvider>
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build`

---

### Phase 10: Add Re-trigger Tour Option

**Step 10.1**: Add command to trigger tour from command palette

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\commands\default-commands.tsx`
- Changes: Add a new command to restart the tour

```typescript
import { GraduationCap } from 'lucide-react';
import { useOnboardingStore } from '@/application/onboarding';

// Add to navigation or help commands:
{
  id: 'help.restart-tour',
  label: 'Restart Feature Tour',
  description: 'Take the guided tour of AgFin features again',
  category: 'help',
  keywords: ['tour', 'onboarding', 'help', 'guide', 'tutorial'],
  icon: <GraduationCap className="h-4 w-4" />,
  action: () => {
    const { resetTour, startTour } = useOnboardingStore.getState();
    resetTour();
    startTour();
  }
}
```

**Step 10.2**: Add help menu trigger in sidebar header

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\AppLayout.tsx`
- Changes: Add a help dropdown menu with tour restart option

```typescript
import { HelpCircle, GraduationCap, Keyboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useOnboardingStore } from '@/application/onboarding';

// In the header section, add a help menu:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button
      className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
      aria-label="Help menu"
    >
      <HelpCircle size={20} />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem
      onClick={() => {
        const store = useOnboardingStore.getState();
        store.resetTour();
        store.startTour();
      }}
    >
      <GraduationCap className="w-4 h-4 mr-2" />
      Restart Feature Tour
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setShowKeyboardHelp(true)}>
      <Keyboard className="w-4 h-4 mr-2" />
      Keyboard Shortcuts
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

### Phase 11: Accessibility Enhancements

**Step 11.1**: Add ARIA live region announcements

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\TourProvider.tsx`
- Changes: Announce step changes to screen readers

```typescript
import { useEffect } from 'react';
import { announce } from '@/shared/accessibility/announcer';

// Inside the component, add effect to announce step changes:
useEffect(() => {
  if (tourActive && currentTourStep) {
    announce(
      `Tour step ${currentStep + 1} of ${TOTAL_STEPS}: ${currentTourStep.title}. ${currentTourStep.description}`,
      'polite'
    );
  }
}, [tourActive, currentStep, currentTourStep]);
```

**Step 11.2**: Ensure focus management

- File: `C:\Users\timca\Business\agfin_app\client\src\application\onboarding\TourTooltip.tsx`
- Changes: Focus the tooltip when it appears, trap focus within

```typescript
import { useEffect, useRef } from 'react';

// Add ref to the tooltip container and focus it on mount:
const tooltipRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (visible && tooltipRef.current) {
    tooltipRef.current.focus();
  }
}, [visible, step.id]);

// Add tabIndex and role to the container:
<motion.div
  ref={tooltipRef}
  tabIndex={-1}
  role="dialog"
  aria-modal="true"
  // ... rest of props
>
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

## Acceptance Criteria

- [ ] Welcome modal appears for first-time users after 1 second delay
- [ ] Welcome modal shows 4 feature highlights with icons
- [ ] "Start Tour" button begins the guided tour
- [ ] "Skip for Now" dismisses modal and marks tour as completed
- [ ] Tour shows highlight overlay with cutout around target element
- [ ] Tour tooltip displays step title, description, and progress dots
- [ ] Step indicator shows "Step N of 4" in tooltip header
- [ ] "Next" button advances to next step
- [ ] "Back" button returns to previous step (disabled on step 1)
- [ ] "Skip Tour" button exits tour and marks as completed
- [ ] "Done" button on last step completes the tour
- [ ] Keyboard navigation works: ArrowRight/Enter for next, ArrowLeft for back, Escape to skip
- [ ] Tour completion state persists in localStorage
- [ ] Tour can be re-triggered from command palette
- [ ] Tour can be re-triggered from help menu in header
- [ ] Animations respect prefers-reduced-motion media query
- [ ] Screen reader announces step changes via ARIA live region
- [ ] Focus is managed properly throughout the tour
- [ ] Tour elements have proper ARIA labels and roles

---

## Final Validation

```bash
# Type checking
cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit

# Build
cd C:\Users\timca\Business\agfin_app\client && npm run build

# Lint
cd C:\Users\timca\Business\agfin_app\client && npm run lint

# Manual testing checklist
# 1. Clear localStorage (or use incognito) to test first-time experience
# 2. Verify welcome modal appears after page load
# 3. Click through all 4 tour steps
# 4. Test keyboard navigation
# 5. Test skip functionality
# 6. Verify tour doesn't show again after completion
# 7. Test re-trigger from command palette (Cmd+K, type "tour")
# 8. Test with prefers-reduced-motion enabled
# 9. Test with screen reader (VoiceOver/NVDA)
```

---

## Notes

1. **Tour Target Fallback**: If a target element is not visible or doesn't exist (e.g., user hasn't navigated there yet), the tour should gracefully skip that step or show a message indicating the feature location.

2. **Mobile Considerations**: The tour overlay and tooltip positioning may need adjustments for mobile viewports. Consider showing a simplified tour or skipping certain steps on mobile.

3. **Future Enhancements**:
   - Per-feature first-use tooltips (dismissible hints when first interacting with specific features)
   - Analytics tracking for tour completion rates
   - A/B testing different tour content
   - Video snippets for complex features

4. **Testing Note**: Clear localStorage key `agfin-onboarding-state` to test the first-time user experience repeatedly during development.

5. **Performance**: The highlight overlay uses SVG masks and requestAnimationFrame for smooth updates. Monitor performance on lower-end devices.
