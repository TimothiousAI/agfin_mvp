/**
 * Form persistence utilities for zero data loss
 *
 * Features:
 * - Save form state to localStorage
 * - Restore on page load
 * - Sync with server on reconnect
 * - Clear stale drafts
 * - Handle concurrent edits
 */

import { useEffect, useCallback, useState, useRef } from 'react';

export interface PersistenceMetadata {
  /**
   * Unique key for this form data
   */
  key: string;

  /**
   * Timestamp when data was saved
   */
  savedAt: number;

  /**
   * Version/etag for conflict detection
   */
  version?: string;

  /**
   * User ID (for multi-user scenarios)
   */
  userId?: string;
}

export interface PersistedData<T> {
  /**
   * The actual form data
   */
  data: T;

  /**
   * Metadata about the persisted data
   */
  metadata: PersistenceMetadata;
}

export interface FormPersistenceOptions<T> {
  /**
   * Unique key for localStorage (e.g., "form-loan-application-123")
   */
  storageKey: string;

  /**
   * Current form data
   */
  data: T;

  /**
   * Callback to restore data (called on mount if saved data exists)
   */
  onRestore?: (data: T, metadata: PersistenceMetadata) => void;

  /**
   * TTL in milliseconds (default: 7 days)
   */
  ttl?: number;

  /**
   * Auto-save interval in ms (default: 5000ms)
   */
  autoSaveInterval?: number;

  /**
   * Server version for conflict detection
   */
  serverVersion?: string;

  /**
   * User ID for multi-user conflict detection
   */
  userId?: string;

  /**
   * Callback when stale data is detected
   */
  onStaleData?: (savedData: T, metadata: PersistenceMetadata) => void;

  /**
   * Callback when conflict is detected
   */
  onConflict?: (localData: T, serverVersion: string) => void;

  /**
   * Enable persistence (default: true)
   */
  enabled?: boolean;
}

const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/**
 * Save data to localStorage with metadata
 */
export function saveToLocalStorage<T>(
  key: string,
  data: T,
  metadata: Partial<PersistenceMetadata>
): void {
  try {
    const persistedData: PersistedData<T> = {
      data,
      metadata: {
        key,
        savedAt: Date.now(),
        ...metadata,
      },
    };

    localStorage.setItem(key, JSON.stringify(persistedData));
  } catch (error) {
    console.error('[FormPersistence] Failed to save to localStorage:', error);
  }
}

/**
 * Load data from localStorage with validation
 */
export function loadFromLocalStorage<T>(
  key: string,
  ttl: number = DEFAULT_TTL
): PersistedData<T> | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const persistedData: PersistedData<T> = JSON.parse(item);

    // Check if data is stale
    const age = Date.now() - persistedData.metadata.savedAt;
    if (age > ttl) {
      console.warn('[FormPersistence] Data is stale, removing:', key);
      localStorage.removeItem(key);
      return null;
    }

    return persistedData;
  } catch (error) {
    console.error('[FormPersistence] Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear persisted data from localStorage
 */
export function clearFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[FormPersistence] Failed to clear from localStorage:', error);
  }
}

/**
 * Clear all stale drafts from localStorage
 */
export function clearStaleDrafts(
  keyPrefix: string = 'form-',
  ttl: number = DEFAULT_TTL
): number {
  let cleared = 0;

  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(keyPrefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const persistedData: PersistedData<any> = JSON.parse(item);
            const age = Date.now() - persistedData.metadata.savedAt;

            if (age > ttl) {
              localStorage.removeItem(key);
              cleared++;
            }
          } catch {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
            cleared++;
          }
        }
      }
    }
  } catch (error) {
    console.error('[FormPersistence] Failed to clear stale drafts:', error);
  }

  return cleared;
}

/**
 * Hook for form persistence with auto-save and restoration
 */
export function useFormPersistence<T>({
  storageKey,
  data,
  onRestore,
  ttl = DEFAULT_TTL,
  autoSaveInterval = DEFAULT_AUTO_SAVE_INTERVAL,
  serverVersion,
  userId,
  onStaleData,
  onConflict,
  enabled = true,
}: FormPersistenceOptions<T>) {
  const [isRestored, setIsRestored] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  /**
   * Restore data on mount
   */
  useEffect(() => {
    if (!enabled || isRestored) return;

    const persistedData = loadFromLocalStorage<T>(storageKey, ttl);

    if (persistedData) {
      setHasSavedData(true);

      // Check for conflicts
      if (serverVersion && persistedData.metadata.version !== serverVersion) {
        console.warn('[FormPersistence] Version conflict detected');
        onConflict?.(persistedData.data, serverVersion);
      }

      // Check if data is stale but within TTL
      const age = Date.now() - persistedData.metadata.savedAt;
      if (age > autoSaveInterval * 2) {
        onStaleData?.(persistedData.data, persistedData.metadata);
      }

      // Restore data
      onRestore?.(persistedData.data, persistedData.metadata);
    }

    setIsRestored(true);
  }, [enabled, storageKey, ttl, isRestored, serverVersion, onRestore, onStaleData, onConflict, autoSaveInterval]);

  /**
   * Auto-save data at intervals
   */
  useEffect(() => {
    if (!enabled || !isRestored) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save
    autoSaveTimerRef.current = setInterval(() => {
      const serializedData = JSON.stringify(data);

      // Only save if data has changed
      if (serializedData !== lastSavedDataRef.current) {
        saveToLocalStorage(storageKey, data, {
          version: serverVersion,
          userId,
        });

        lastSavedDataRef.current = serializedData;
        console.log('[FormPersistence] Auto-saved to localStorage');
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, isRestored, data, storageKey, autoSaveInterval, serverVersion, userId]);

  /**
   * Save immediately before page unload
   */
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveToLocalStorage(storageKey, data, {
        version: serverVersion,
        userId,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, data, storageKey, serverVersion, userId]);

  /**
   * Manual save
   */
  const save = useCallback(() => {
    if (!enabled) return;

    saveToLocalStorage(storageKey, data, {
      version: serverVersion,
      userId,
    });

    lastSavedDataRef.current = JSON.stringify(data);
    setHasSavedData(true);
  }, [enabled, storageKey, data, serverVersion, userId]);

  /**
   * Manual clear
   */
  const clear = useCallback(() => {
    clearFromLocalStorage(storageKey);
    lastSavedDataRef.current = '';
    setHasSavedData(false);
  }, [storageKey]);

  /**
   * Sync with server (call after successful server save)
   */
  const syncWithServer = useCallback(
    (newServerVersion?: string) => {
      // Update local storage with new version
      saveToLocalStorage(storageKey, data, {
        version: newServerVersion || serverVersion,
        userId,
      });

      lastSavedDataRef.current = JSON.stringify(data);
    },
    [storageKey, data, serverVersion, userId]
  );

  return {
    /**
     * Whether data has been restored from localStorage
     */
    isRestored,

    /**
     * Whether there is saved data in localStorage
     */
    hasSavedData,

    /**
     * Manually save current data
     */
    save,

    /**
     * Clear saved data
     */
    clear,

    /**
     * Sync with server after successful save
     */
    syncWithServer,
  };
}

/**
 * Hook for online/offline detection (for sync)
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
