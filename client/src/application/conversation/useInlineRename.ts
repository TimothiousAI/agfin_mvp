import { useState, useCallback } from 'react';
import { useUpdateSession } from './useSessionsApi';
import { toast } from '../../shared/ui/use-toast';

interface UseInlineRenameOptions {
  onSuccess?: (sessionId: string, newTitle: string) => void;
  onError?: (sessionId: string, error: Error) => void;
}

export function useInlineRename(options: UseInlineRenameOptions = {}) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

  const updateSession = useUpdateSession();

  const startEditing = useCallback((sessionId: string) => {
    setEditingSessionId(sessionId);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingSessionId(null);
  }, []);

  const saveTitle = useCallback(
    async (sessionId: string, newTitle: string) => {
      setSavingSessionId(sessionId);

      try {
        await updateSession.mutateAsync({
          sessionId,
          updates: { title: newTitle },
        });

        toast({
          title: 'Session renamed',
          description: `Title updated to "${newTitle}"`,
          variant: 'success',
          duration: 3000,
        });

        options.onSuccess?.(sessionId, newTitle);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to rename session');

        toast({
          title: 'Rename failed',
          description: err.message,
          variant: 'error',
          duration: 5000,
        });

        options.onError?.(sessionId, err);
      } finally {
        setSavingSessionId(null);
        setEditingSessionId(null);
      }
    },
    [updateSession, options]
  );

  const isEditing = useCallback(
    (sessionId: string) => editingSessionId === sessionId,
    [editingSessionId]
  );

  const isSaving = useCallback(
    (sessionId: string) => savingSessionId === sessionId,
    [savingSessionId]
  );

  return {
    editingSessionId,
    savingSessionId,
    startEditing,
    cancelEditing,
    saveTitle,
    isEditing,
    isSaving,
  };
}

export default useInlineRename;
