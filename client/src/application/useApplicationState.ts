import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Application State Hook
 *
 * Single source of truth for current app/session context.
 * Manages what's active in the three-column layout:
 * - Current chat session
 * - Current loan application
 * - Active artifact panel content
 */

export type ArtifactType = 'progress' | 'document' | 'module' | 'welcome';

export interface ActiveArtifact {
  type: ArtifactType;
  id?: string;
  moduleNumber?: number;
}

interface ApplicationState {
  // Current context
  currentSessionId: string | null;
  currentApplicationId: string | null;
  activeArtifact: ActiveArtifact | null;

  // Actions
  setCurrentSession: (id: string | null) => void;
  setCurrentApplication: (id: string | null) => void;
  showDocument: (documentId: string) => void;
  showModule: (moduleNumber: number) => void;
  showProgress: () => void;
  showWelcome: () => void;
  clearArtifact: () => void;

  // Linked session-application management
  linkSessionToApplication: (sessionId: string, applicationId: string) => void;
  sessionApplicationLinks: Map<string, string>;
}

export const useApplicationState = create<ApplicationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSessionId: null,
      currentApplicationId: null,
      activeArtifact: { type: 'welcome' },
      sessionApplicationLinks: new Map(),

      setCurrentSession: (id) => {
        const links = get().sessionApplicationLinks;
        const linkedAppId = id ? links.get(id) : null;

        set({
          currentSessionId: id,
          // If session has linked application, activate it
          currentApplicationId: linkedAppId || get().currentApplicationId,
          // Show progress if we have an application, otherwise welcome
          activeArtifact: linkedAppId ? { type: 'progress' } : { type: 'welcome' },
        }, false, 'setCurrentSession');
      },

      setCurrentApplication: (id) => {
        set({
          currentApplicationId: id,
          activeArtifact: id ? { type: 'progress' } : { type: 'welcome' },
        }, false, 'setCurrentApplication');
      },

      showDocument: (documentId) => {
        set({
          activeArtifact: { type: 'document', id: documentId },
        }, false, 'showDocument');
      },

      showModule: (moduleNumber) => {
        set({
          activeArtifact: { type: 'module', moduleNumber },
        }, false, 'showModule');
      },

      showProgress: () => {
        set({
          activeArtifact: { type: 'progress' },
        }, false, 'showProgress');
      },

      showWelcome: () => {
        set({
          activeArtifact: { type: 'welcome' },
        }, false, 'showWelcome');
      },

      clearArtifact: () => {
        set({
          activeArtifact: null,
        }, false, 'clearArtifact');
      },

      linkSessionToApplication: (sessionId, applicationId) => {
        const links = new Map(get().sessionApplicationLinks);
        links.set(sessionId, applicationId);

        set({
          sessionApplicationLinks: links,
          // If this is the current session, also activate the application
          ...(get().currentSessionId === sessionId ? {
            currentApplicationId: applicationId,
            activeArtifact: { type: 'progress' },
          } : {}),
        }, false, 'linkSessionToApplication');
      },
    }),
    { name: 'ApplicationState' }
  )
);

// Selector hooks for optimized re-renders
export const useCurrentSessionId = () => useApplicationState((state) => state.currentSessionId);
export const useCurrentApplicationId = () => useApplicationState((state) => state.currentApplicationId);
export const useActiveArtifact = () => useApplicationState((state) => state.activeArtifact);

export default useApplicationState;
