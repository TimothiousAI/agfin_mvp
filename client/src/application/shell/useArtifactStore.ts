import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Artifact } from './ArtifactContent';

/**
 * Artifact Store State Interface
 */
interface ArtifactStoreState {
  // Core artifact state
  /** Array of currently open artifacts */
  artifacts: Artifact[];

  /** ID of the currently active (displayed) artifact */
  activeArtifactId: string | null;

  /** Whether an artifact is in full-screen mode */
  isFullScreen: boolean;

  /** ID of the artifact in full-screen mode (if any) */
  fullScreenArtifactId: string | null;

  // Artifact management actions
  /** Add a new artifact and set it as active */
  addArtifact: (artifact: Artifact) => void;

  /** Remove an artifact by ID */
  removeArtifact: (artifactId: string) => void;

  /** Switch to a different active artifact */
  setActiveArtifact: (artifactId: string) => void;

  /** Update an existing artifact's data */
  updateArtifact: (artifactId: string, updates: Partial<Artifact>) => void;

  /** Reorder artifacts based on new order of IDs */
  reorderArtifacts: (artifactIds: string[]) => void;

  /** Close all artifacts */
  clearArtifacts: () => void;

  /** Get an artifact by ID */
  getArtifact: (artifactId: string) => Artifact | undefined;

  /** Get the currently active artifact */
  getActiveArtifact: () => Artifact | undefined;

  // Full-screen actions
  /** Enter full-screen mode for a specific artifact */
  enterFullScreen: (artifactId: string) => void;

  /** Exit full-screen mode */
  exitFullScreen: () => void;

  /** Toggle full-screen mode for the active artifact */
  toggleFullScreen: () => void;

  // Utility actions
  /** Check if a specific artifact is open */
  isArtifactOpen: (artifactId: string) => boolean;

  /** Get total number of open artifacts */
  getArtifactCount: () => number;
}

/**
 * Maximum number of artifacts that can be open simultaneously
 */
const MAX_OPEN_ARTIFACTS = 10;

/**
 * Artifact Store
 *
 * Manages the state of open artifacts in the application.
 * Features:
 * - Add, remove, and reorder artifacts
 * - Track active artifact
 * - Full-screen mode management
 * - Automatic active artifact switching when closing
 * - Maximum artifact limit
 */
export const useArtifactStore = create<ArtifactStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      artifacts: [],
      activeArtifactId: null,
      isFullScreen: false,
      fullScreenArtifactId: null,

      // Artifact management actions
      addArtifact: (artifact: Artifact) => {
        const state = get();

        // Check if artifact already exists
        const existingIndex = state.artifacts.findIndex((a) => a.id === artifact.id);

        if (existingIndex !== -1) {
          // Artifact already open - just switch to it
          set({ activeArtifactId: artifact.id });
          return;
        }

        // Check maximum artifact limit
        if (state.artifacts.length >= MAX_OPEN_ARTIFACTS) {
          console.warn(`Maximum ${MAX_OPEN_ARTIFACTS} artifacts can be open at once`);
          // Remove oldest artifact (first in array)
          const newArtifacts = state.artifacts.slice(1);
          set({
            artifacts: [...newArtifacts, artifact],
            activeArtifactId: artifact.id,
          });
          return;
        }

        // Add new artifact
        set({
          artifacts: [...state.artifacts, artifact],
          activeArtifactId: artifact.id,
        });
      },

      removeArtifact: (artifactId: string) => {
        const state = get();
        const newArtifacts = state.artifacts.filter((a) => a.id !== artifactId);

        // If removing the active artifact, switch to another one
        let newActiveArtifactId = state.activeArtifactId;
        if (state.activeArtifactId === artifactId) {
          // Try to switch to the next artifact, or the previous one, or null
          const currentIndex = state.artifacts.findIndex((a) => a.id === artifactId);
          if (newArtifacts.length > 0) {
            // Switch to next artifact if available, otherwise previous
            const nextIndex = Math.min(currentIndex, newArtifacts.length - 1);
            newActiveArtifactId = newArtifacts[nextIndex]?.id || null;
          } else {
            newActiveArtifactId = null;
          }
        }

        // Exit full-screen if removing the full-screen artifact
        const newFullScreenState =
          state.fullScreenArtifactId === artifactId
            ? { isFullScreen: false, fullScreenArtifactId: null }
            : {};

        set({
          artifacts: newArtifacts,
          activeArtifactId: newActiveArtifactId,
          ...newFullScreenState,
        });
      },

      setActiveArtifact: (artifactId: string) => {
        const state = get();

        // Verify artifact exists
        const artifactExists = state.artifacts.some((a) => a.id === artifactId);
        if (!artifactExists) {
          console.warn(`Artifact ${artifactId} not found`);
          return;
        }

        set({ activeArtifactId: artifactId });
      },

      updateArtifact: (artifactId: string, updates: Partial<Artifact>) => {
        set((state) => ({
          artifacts: state.artifacts.map((artifact) =>
            artifact.id === artifactId
              ? { ...artifact, ...updates }
              : artifact
          ),
        }));
      },

      reorderArtifacts: (artifactIds: string[]) => {
        const state = get();

        // Create a map for quick lookup
        const artifactMap = new Map(state.artifacts.map((a) => [a.id, a]));

        // Reorder based on provided IDs
        const reorderedArtifacts = artifactIds
          .map((id) => artifactMap.get(id))
          .filter((a): a is Artifact => a !== undefined);

        // Ensure we didn't lose any artifacts
        if (reorderedArtifacts.length !== state.artifacts.length) {
          console.warn('Artifact order mismatch - some artifacts may have been lost');
        }

        set({ artifacts: reorderedArtifacts });
      },

      clearArtifacts: () => {
        set({
          artifacts: [],
          activeArtifactId: null,
          isFullScreen: false,
          fullScreenArtifactId: null,
        });
      },

      getArtifact: (artifactId: string) => {
        return get().artifacts.find((a) => a.id === artifactId);
      },

      getActiveArtifact: () => {
        const state = get();
        if (!state.activeArtifactId) return undefined;
        return state.artifacts.find((a) => a.id === state.activeArtifactId);
      },

      // Full-screen actions
      enterFullScreen: (artifactId: string) => {
        const state = get();

        // Verify artifact exists
        const artifactExists = state.artifacts.some((a) => a.id === artifactId);
        if (!artifactExists) {
          console.warn(`Cannot enter full-screen: artifact ${artifactId} not found`);
          return;
        }

        set({
          isFullScreen: true,
          fullScreenArtifactId: artifactId,
          activeArtifactId: artifactId, // Ensure this artifact is active
        });
      },

      exitFullScreen: () => {
        set({
          isFullScreen: false,
          fullScreenArtifactId: null,
        });
      },

      toggleFullScreen: () => {
        const state = get();

        if (state.isFullScreen) {
          // Exit full-screen
          set({
            isFullScreen: false,
            fullScreenArtifactId: null,
          });
        } else {
          // Enter full-screen with active artifact
          if (state.activeArtifactId) {
            set({
              isFullScreen: true,
              fullScreenArtifactId: state.activeArtifactId,
            });
          } else {
            console.warn('Cannot enter full-screen: no active artifact');
          }
        }
      },

      // Utility actions
      isArtifactOpen: (artifactId: string) => {
        return get().artifacts.some((a) => a.id === artifactId);
      },

      getArtifactCount: () => {
        return get().artifacts.length;
      },
    }),
    {
      name: 'artifact-storage',
      // Only persist artifacts and active ID, not full-screen state
      partialize: (state) => ({
        artifacts: state.artifacts,
        activeArtifactId: state.activeArtifactId,
      }),
    }
  )
);

/**
 * Hook to subscribe to specific artifact
 * Useful for components that only care about one artifact
 */
export function useArtifact(artifactId: string) {
  return useArtifactStore((state) =>
    state.artifacts.find((a) => a.id === artifactId)
  );
}

/**
 * Hook to get only the active artifact
 * More efficient than subscribing to entire artifacts array
 */
export function useActiveArtifact() {
  const activeArtifactId = useArtifactStore((state) => state.activeArtifactId);
  const artifacts = useArtifactStore((state) => state.artifacts);

  if (!activeArtifactId) return null;
  return artifacts.find((a) => a.id === activeArtifactId) || null;
}

/**
 * Hook to get full-screen state for a specific artifact
 */
export function useArtifactFullScreen(artifactId: string) {
  const isFullScreen = useArtifactStore((state) => state.isFullScreen);
  const fullScreenArtifactId = useArtifactStore((state) => state.fullScreenArtifactId);

  return {
    isFullScreen: isFullScreen && fullScreenArtifactId === artifactId,
    isAnyArtifactFullScreen: isFullScreen,
  };
}

/**
 * Selector hook for artifact count
 * Useful for showing badge counts
 */
export function useArtifactCount() {
  return useArtifactStore((state) => state.artifacts.length);
}

/**
 * Selector hook for checking if artifacts panel should be open
 */
export function useHasArtifacts() {
  return useArtifactStore((state) => state.artifacts.length > 0);
}
