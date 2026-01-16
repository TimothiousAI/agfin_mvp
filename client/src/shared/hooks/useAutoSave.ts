/**
 * Auto-save hook for forms
 *
 * Features:
 * - Debounced save on change (1s delay)
 * - Save on blur
 * - Save before navigation
 * - Conflict detection
 * - Retry failed saves
 * - Visual save indicator
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { debounce } from '../performance';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface UseAutoSaveOptions<T> {
  /**
   * Data to be auto-saved
   */
  data: T;

  /**
   * Function to save data (returns version/etag for conflict detection)
   */
  onSave: (data: T) => Promise<{ version?: string; etag?: string } | void>;

  /**
   * Debounce delay in milliseconds (default: 1000ms)
   */
  debounceMs?: number;

  /**
   * Enable saving on blur events
   */
  saveOnBlur?: boolean;

  /**
   * Enable saving before navigation
   */
  saveBeforeNavigation?: boolean;

  /**
   * Number of retry attempts on failure (default: 3)
   */
  retryAttempts?: number;

  /**
   * Callback when save succeeds
   */
  onSaveSuccess?: (result: any) => void;

  /**
   * Callback when save fails
   */
  onSaveError?: (error: Error) => void;

  /**
   * Callback when conflict is detected
   */
  onConflict?: (serverVersion: string, localVersion: string) => void;

  /**
   * Enable auto-save (default: true)
   */
  enabled?: boolean;

  /**
   * Server version/etag for conflict detection
   */
  serverVersion?: string;
}

export interface UseAutoSaveReturn {
  /**
   * Current save status
   */
  status: SaveStatus;

  /**
   * Whether data has unsaved changes
   */
  isDirty: boolean;

  /**
   * Whether currently saving
   */
  isSaving: boolean;

  /**
   * Last error if save failed
   */
  error: Error | null;

  /**
   * Manually trigger save
   */
  save: () => Promise<void>;

  /**
   * Reset dirty state
   */
  resetDirty: () => void;

  /**
   * Clear error state
   */
  clearError: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1000,
  saveOnBlur = true,
  saveBeforeNavigation = true,
  retryAttempts = 3,
  onSaveSuccess,
  onSaveError,
  onConflict,
  enabled = true,
  serverVersion,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dataRef = useRef(data);
  const serverVersionRef = useRef(serverVersion);
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update refs when data/version changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    serverVersionRef.current = serverVersion;
  }, [serverVersion]);

  /**
   * Perform save with retry logic
   */
  const performSave = useCallback(
    async (attempt: number = 1): Promise<void> => {
      if (!enabled || isSavingRef.current) {
        return;
      }

      try {
        isSavingRef.current = true;
        setStatus('saving');
        setError(null);

        const result = await onSave(dataRef.current);

        // Check for conflicts
        if (result && result.version && serverVersionRef.current) {
          if (result.version !== serverVersionRef.current) {
            setStatus('conflict');
            onConflict?.(result.version, serverVersionRef.current);
            return;
          }
        }

        // Update server version if returned
        if (result && (result.version || result.etag)) {
          serverVersionRef.current = result.version || result.etag;
        }

        setStatus('saved');
        setIsDirty(false);
        onSaveSuccess?.(result);

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 2000);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Retry logic
        if (attempt < retryAttempts) {
          console.warn(`[AutoSave] Save failed, retrying (${attempt}/${retryAttempts})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          return performSave(attempt + 1);
        }

        // All retries exhausted
        console.error('[AutoSave] Save failed after retries:', error);
        setStatus('error');
        setError(error);
        onSaveError?.(error);
      } finally {
        isSavingRef.current = false;
      }
    },
    [enabled, onSave, retryAttempts, onSaveSuccess, onSaveError, onConflict]
  );

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(
    debounce(() => {
      performSave();
    }, debounceMs),
    [performSave, debounceMs]
  );

  /**
   * Manual save trigger
   */
  const save = useCallback(async () => {
    // Cancel any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await performSave();
  }, [performSave]);

  /**
   * Auto-save on data change (debounced)
   */
  useEffect(() => {
    if (!enabled) return;

    setIsDirty(true);
    debouncedSave();

    return () => {
      // Cleanup debounce timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  /**
   * Save on blur (when user leaves form)
   */
  useEffect(() => {
    if (!enabled || !saveOnBlur) return;

    const handleBlur = () => {
      if (isDirty) {
        save();
      }
    };

    // Listen for blur on form elements
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, saveOnBlur, isDirty, save]);

  /**
   * Save before navigation (using beforeunload event)
   * Note: useBlocker requires data router, so we use beforeunload instead
   */

  /**
   * Save before page unload
   */
  useEffect(() => {
    if (!enabled || !saveBeforeNavigation) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Attempt synchronous save (best effort)
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to leave?';

        // Try to save
        save();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveBeforeNavigation, isDirty, save]);

  /**
   * Reset dirty state
   */
  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    isDirty,
    isSaving: status === 'saving',
    error,
    save,
    resetDirty,
    clearError,
  };
}
