import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../../core/database';
import { useSessionStore } from './useSessionStore';
import type { Database } from '../../../../shared/types/database';
import type { Session } from './useSessionStore';

/**
 * Sessions API Hooks
 *
 * React Query hooks for managing AI bot chat sessions:
 * - useSessions() - list user's sessions
 * - useCreateSession() - create new session
 * - useUpdateSession() - rename, pin, archive
 * - useDeleteSession() - delete with confirmation
 * - Optimistic updates for smooth UX
 */

type DbSession = Database['public']['Tables']['agfin_ai_bot_sessions']['Row'];
type WorkflowMode = DbSession['workflow_mode'];

/**
 * Session with message count from view
 */
interface SessionWithCount extends DbSession {
  message_count?: number;
  first_message?: string;
}

/**
 * API Helper Functions
 */

async function fetchSessions(limit = 100): Promise<Session[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Try to use the summary view if it exists, fallback to base table
  const { data, error } = await supabase
    .from('agfin_ai_bot_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data as Session[];
}

async function createSessionApi(
  title: string,
  applicationId?: string | null,
  workflowMode?: WorkflowMode
): Promise<Session> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('agfin_ai_bot_sessions')
    .insert({
      user_id: user.id,
      title,
      application_id: applicationId,
      workflow_mode: workflowMode,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Session;
}

async function updateSessionApi(
  sessionId: string,
  updates: {
    title?: string;
    workflow_mode?: WorkflowMode;
    application_id?: string | null;
  }
): Promise<Session> {
  const { data, error } = await supabase
    .from('agfin_ai_bot_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  return data as Session;
}

async function deleteSessionApi(sessionId: string): Promise<void> {
  // First delete all messages in the session
  const { error: messagesError } = await supabase
    .from('agfin_ai_bot_messages')
    .delete()
    .eq('session_id', sessionId);

  if (messagesError) throw messagesError;

  // Then delete the session
  const { error: sessionError } = await supabase
    .from('agfin_ai_bot_sessions')
    .delete()
    .eq('id', sessionId);

  if (sessionError) throw sessionError;
}

/**
 * React Query Hooks
 */

/**
 * Fetch list of user's sessions
 * Automatically syncs with Zustand store
 */
export function useSessions(limit = 100) {
  const setSessions = useSessionStore((state) => state.setSessions);

  return useQuery({
    queryKey: ['sessions', limit],
    queryFn: async () => {
      const sessions = await fetchSessions(limit);
      // Sync with Zustand store
      setSessions(sessions);
      return sessions;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Create a new session
 * Uses optimistic updates for instant UI feedback
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  const { addSession, setCurrentSession } = useSessionStore();

  return useMutation({
    mutationFn: ({
      title,
      applicationId,
      workflowMode,
    }: {
      title: string;
      applicationId?: string | null;
      workflowMode?: WorkflowMode;
    }) => createSessionApi(title, applicationId, workflowMode),

    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<Session[]>(['sessions']);

      // Optimistically add the new session
      const optimisticSession: Session = {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        title: variables.title,
        application_id: variables.applicationId || null,
        workflow_mode: variables.workflowMode || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Session[]>(['sessions'], (old) =>
        old ? [optimisticSession, ...old] : [optimisticSession]
      );

      addSession(optimisticSession);

      return { previousSessions, optimisticSession };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions);
      }
    },

    onSuccess: (newSession, variables, context) => {
      // Replace optimistic session with real one in store
      const store = useSessionStore.getState();
      if (context?.optimisticSession) {
        store.removeSession(context.optimisticSession.id);
      }
      store.addSession(newSession);
      store.setCurrentSession(newSession.id);

      // Invalidate to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * Update session (rename, change workflow mode, link to application)
 * Uses optimistic updates
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();
  const { updateSession, optimisticallyUpdateSession, revertOptimisticUpdate } = useSessionStore();

  return useMutation({
    mutationFn: ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: {
        title?: string;
        workflow_mode?: WorkflowMode;
        application_id?: string | null;
      };
    }) => updateSessionApi(sessionId, updates),

    onMutate: async ({ sessionId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<Session[]>(['sessions']);
      const previousSession = previousSessions?.find(s => s.id === sessionId);

      // Optimistically update the session
      queryClient.setQueryData<Session[]>(['sessions'], (old) =>
        old?.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      );

      optimisticallyUpdateSession(sessionId, updates);

      return { previousSessions, previousSession };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions);
      }
      if (context?.previousSession) {
        revertOptimisticUpdate(variables.sessionId, context.previousSession);
      }
    },

    onSuccess: (updatedSession, variables) => {
      // Update store with confirmed data
      updateSession(variables.sessionId, updatedSession);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * Delete session
 * Removes from both the database and local store
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { removeSession, currentSessionId, setCurrentSession } = useSessionStore();

  return useMutation({
    mutationFn: (sessionId: string) => deleteSessionApi(sessionId),

    onMutate: async (sessionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<Session[]>(['sessions']);

      // Optimistically remove the session
      queryClient.setQueryData<Session[]>(['sessions'], (old) =>
        old?.filter((session) => session.id !== sessionId)
      );

      removeSession(sessionId);

      // If deleting current session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
      }

      return { previousSessions };
    },

    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions);
      }
    },

    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * Pin/Unpin session (stored locally in Zustand)
 * Does not persist to database - UI-only state
 */
export function usePinSession() {
  const { pinSession, unpinSession, pinnedSessionIds } = useSessionStore();

  return {
    pinSession: (sessionId: string) => pinSession(sessionId),
    unpinSession: (sessionId: string) => unpinSession(sessionId),
    isPinned: (sessionId: string) => pinnedSessionIds.has(sessionId),
  };
}

/**
 * Archive/Unarchive session (stored locally in Zustand)
 * Does not persist to database - UI-only state
 */
export function useArchiveSession() {
  const { archiveSession, unarchiveSession, archivedSessionIds } = useSessionStore();

  return {
    archiveSession: (sessionId: string) => archiveSession(sessionId),
    unarchiveSession: (sessionId: string) => unarchiveSession(sessionId),
    isArchived: (sessionId: string) => archivedSessionIds.has(sessionId),
  };
}

export default useSessions;
