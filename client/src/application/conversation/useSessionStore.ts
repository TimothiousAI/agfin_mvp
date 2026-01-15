import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Database } from '../../../../shared/types/database';

/**
 * Session State Management Store
 *
 * Manages conversation session state including:
 * - Current active session
 * - Session list cache
 * - Pinned sessions
 * - Archived sessions
 * - CRUD operations with optimistic updates
 */

// Database session type
type DbSession = Database['public']['Tables']['agfin_ai_bot_sessions']['Row'];

// Extended session type with UI state
export interface Session extends DbSession {
  // Additional UI-only fields
  isPinned?: boolean;
  isArchived?: boolean;
  message_count?: number;
  first_message?: string;
}

interface SessionStore {
  // State
  currentSessionId: string | null;
  sessions: Session[];
  pinnedSessionIds: Set<string>;
  archivedSessionIds: Set<string>;

  // Session Management
  setCurrentSession: (sessionId: string | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;

  // Pin/Unpin Operations
  pinSession: (sessionId: string) => void;
  unpinSession: (sessionId: string) => void;
  togglePin: (sessionId: string) => void;

  // Archive Operations
  archiveSession: (sessionId: string) => void;
  unarchiveSession: (sessionId: string) => void;
  toggleArchive: (sessionId: string) => void;

  // Optimistic Updates (for smooth UX before API confirmation)
  optimisticallyUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  revertOptimisticUpdate: (sessionId: string, previousSession: Session) => void;

  // Computed Getters
  getSession: (sessionId: string) => Session | undefined;
  getCurrentSession: () => Session | undefined;
  getActiveSessions: () => Session[];
  getPinnedSessions: () => Session[];
  getArchivedSessions: () => Session[];

  // Utilities
  clearAll: () => void;
  reset: () => void;
}

const initialState = {
  currentSessionId: null,
  sessions: [],
  pinnedSessionIds: new Set<string>(),
  archivedSessionIds: new Set<string>(),
};

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Session Management
        setCurrentSession: (sessionId) => {
          set({ currentSessionId: sessionId }, false, 'setCurrentSession');
        },

        setSessions: (sessions) => {
          set({ sessions }, false, 'setSessions');
        },

        addSession: (session) => {
          set(
            (state) => ({
              sessions: [session, ...state.sessions],
            }),
            false,
            'addSession'
          );
        },

        updateSession: (sessionId, updates) => {
          set(
            (state) => ({
              sessions: state.sessions.map((session) =>
                session.id === sessionId
                  ? { ...session, ...updates, updated_at: new Date().toISOString() }
                  : session
              ),
            }),
            false,
            'updateSession'
          );
        },

        removeSession: (sessionId) => {
          set(
            (state) => {
              const newPinnedIds = new Set(state.pinnedSessionIds);
              const newArchivedIds = new Set(state.archivedSessionIds);
              newPinnedIds.delete(sessionId);
              newArchivedIds.delete(sessionId);

              return {
                sessions: state.sessions.filter((s) => s.id !== sessionId),
                pinnedSessionIds: newPinnedIds,
                archivedSessionIds: newArchivedIds,
                currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
              };
            },
            false,
            'removeSession'
          );
        },

        // Pin/Unpin Operations
        pinSession: (sessionId) => {
          set(
            (state) => {
              const newPinnedIds = new Set(state.pinnedSessionIds);
              newPinnedIds.add(sessionId);

              return {
                pinnedSessionIds: newPinnedIds,
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, isPinned: true } : s
                ),
              };
            },
            false,
            'pinSession'
          );
        },

        unpinSession: (sessionId) => {
          set(
            (state) => {
              const newPinnedIds = new Set(state.pinnedSessionIds);
              newPinnedIds.delete(sessionId);

              return {
                pinnedSessionIds: newPinnedIds,
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, isPinned: false } : s
                ),
              };
            },
            false,
            'unpinSession'
          );
        },

        togglePin: (sessionId) => {
          const state = get();
          if (state.pinnedSessionIds.has(sessionId)) {
            state.unpinSession(sessionId);
          } else {
            state.pinSession(sessionId);
          }
        },

        // Archive Operations
        archiveSession: (sessionId) => {
          set(
            (state) => {
              const newArchivedIds = new Set(state.archivedSessionIds);
              newArchivedIds.add(sessionId);

              return {
                archivedSessionIds: newArchivedIds,
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, isArchived: true } : s
                ),
                // Clear current session if archiving the active one
                currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
              };
            },
            false,
            'archiveSession'
          );
        },

        unarchiveSession: (sessionId) => {
          set(
            (state) => {
              const newArchivedIds = new Set(state.archivedSessionIds);
              newArchivedIds.delete(sessionId);

              return {
                archivedSessionIds: newArchivedIds,
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, isArchived: false } : s
                ),
              };
            },
            false,
            'unarchiveSession'
          );
        },

        toggleArchive: (sessionId) => {
          const state = get();
          if (state.archivedSessionIds.has(sessionId)) {
            state.unarchiveSession(sessionId);
          } else {
            state.archiveSession(sessionId);
          }
        },

        // Optimistic Updates
        optimisticallyUpdateSession: (sessionId, updates) => {
          // Same as updateSession but used to signal optimistic update intent
          get().updateSession(sessionId, updates);
        },

        revertOptimisticUpdate: (sessionId, previousSession) => {
          set(
            (state) => ({
              sessions: state.sessions.map((session) =>
                session.id === sessionId ? previousSession : session
              ),
            }),
            false,
            'revertOptimisticUpdate'
          );
        },

        // Computed Getters
        getSession: (sessionId) => {
          return get().sessions.find((s) => s.id === sessionId);
        },

        getCurrentSession: () => {
          const state = get();
          if (!state.currentSessionId) return undefined;
          return state.sessions.find((s) => s.id === state.currentSessionId);
        },

        getActiveSessions: () => {
          const state = get();
          return state.sessions.filter((s) => !state.archivedSessionIds.has(s.id));
        },

        getPinnedSessions: () => {
          const state = get();
          return state.sessions.filter((s) => state.pinnedSessionIds.has(s.id));
        },

        getArchivedSessions: () => {
          const state = get();
          return state.sessions.filter((s) => state.archivedSessionIds.has(s.id));
        },

        // Utilities
        clearAll: () => {
          set(
            {
              currentSessionId: null,
              sessions: [],
            },
            false,
            'clearAll'
          );
        },

        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'agfin-session-storage',
        // Only persist essential state, not derived data
        partialize: (state) => ({
          currentSessionId: state.currentSessionId,
          pinnedSessionIds: Array.from(state.pinnedSessionIds),
          archivedSessionIds: Array.from(state.archivedSessionIds),
        }),
        // Restore Sets from Arrays on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.pinnedSessionIds = new Set(state.pinnedSessionIds as unknown as string[]);
            state.archivedSessionIds = new Set(state.archivedSessionIds as unknown as string[]);
          }
        },
      }
    ),
    { name: 'SessionStore' }
  )
);

// Selector hooks for optimized re-renders
export const useCurrentSessionId = () => useSessionStore((state) => state.currentSessionId);
export const useCurrentSession = () => useSessionStore((state) => state.getCurrentSession());
export const useActiveSessions = () => useSessionStore((state) => state.getActiveSessions());
export const usePinnedSessions = () => useSessionStore((state) => state.getPinnedSessions());
export const useArchivedSessions = () => useSessionStore((state) => state.getArchivedSessions());

export default useSessionStore;
