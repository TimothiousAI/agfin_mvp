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
