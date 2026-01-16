import { useEffect } from 'react';
import { useOnboardingStore } from './useOnboardingStore';
import { TOUR_STEPS, TOTAL_STEPS } from './tourSteps';
import { TourHighlightOverlay } from './TourHighlightOverlay';
import { TourTooltip } from './TourTooltip';
import { WelcomeModal } from './WelcomeModal';
import { useAnnouncer } from '@/shared/accessibility/announcer';

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

  const { announce } = useAnnouncer();

  const currentTourStep = TOUR_STEPS[currentStep];

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

  // Announce step changes to screen readers
  useEffect(() => {
    if (tourActive && currentTourStep) {
      announce(
        `Tour step ${currentStep + 1} of ${TOTAL_STEPS}: ${currentTourStep.title}. ${currentTourStep.description}`,
        'polite'
      );
    }
  }, [tourActive, currentStep, currentTourStep, announce]);

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
