import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentSlot } from './DocumentProgress';
import type { ModuleStatus } from './ModuleProgressSection';
import type { CategoryCompletion, Blocker } from './OverallProgress';

/**
 * Progress update event types
 */
export type ProgressEventType =
  | 'document_uploaded'
  | 'document_processing'
  | 'document_complete'
  | 'document_error'
  | 'module_field_changed'
  | 'module_complete'
  | 'extraction_complete'
  | 'application_updated';

/**
 * Progress update event
 */
export interface ProgressEvent {
  type: ProgressEventType;
  applicationId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

/**
 * Progress update subscription options
 */
export interface ProgressUpdateOptions {
  /** Application ID to subscribe to */
  applicationId: string;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Polling interval in ms (fallback if WebSocket unavailable) */
  pollingInterval?: number;
  /** Callback when progress updates */
  onUpdate?: (event: ProgressEvent) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Progress data state
 */
export interface ProgressData {
  documents: DocumentSlot[];
  modules: ModuleStatus[];
  categories: CategoryCompletion[];
  blockers: Blocker[];
  overallPercentage: number;
  readyForCertification: boolean;
  lastUpdated: Date;
}

/**
 * Progress updates hook return type
 */
export interface UseProgressUpdatesReturn {
  /** Current progress data */
  progress: ProgressData | null;
  /** Is data loading */
  isLoading: boolean;
  /** Is connected to live updates */
  isConnected: boolean;
  /** Error state */
  error: Error | null;
  /** Manually trigger refresh */
  refresh: () => Promise<void>;
  /** Optimistically update document status */
  optimisticDocumentUpdate: (documentId: string, status: DocumentSlot['status']) => void;
  /** Optimistically update module progress */
  optimisticModuleUpdate: (moduleNumber: number, percentage: number) => void;
}

/**
 * Real-time Progress Updates Hook
 *
 * Subscribes to application progress changes and provides live updates:
 * - Document uploads, processing, and completion
 * - Module field changes
 * - Extraction completion
 * - Optimistic UI updates for instant feedback
 * - Automatic reconnection on connection loss
 * - Fallback to polling if WebSocket unavailable
 *
 * @example
 * ```tsx
 * const { progress, isLoading, refresh } = useProgressUpdates({
 *   applicationId: 'app-123',
 *   optimistic: true,
 *   onUpdate: (event) => {
 *     console.log('Progress updated:', event.type);
 *   }
 * });
 * ```
 */
export function useProgressUpdates(
  options: ProgressUpdateOptions
): UseProgressUpdatesReturn {
  const { applicationId, optimistic = true, pollingInterval = 30000, onUpdate, onError } = options;

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch current progress data from API
   */
  const fetchProgress = useCallback(async (): Promise<ProgressData> => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/progress`);

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        documents: data.documents || [],
        modules: data.modules || [],
        categories: data.categories || [],
        blockers: data.blockers || [],
        overallPercentage: data.overallPercentage || 0,
        readyForCertification: data.readyForCertification || false,
        lastUpdated: new Date(),
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [applicationId, onError]);

  /**
   * Manually refresh progress data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProgress();
      setProgress(data);

      // Invalidate React Query cache
      queryClient.invalidateQueries({
        queryKey: ['application', applicationId, 'progress'],
      });
    } catch (err) {
      // Error already handled in fetchProgress
    } finally {
      setIsLoading(false);
    }
  }, [fetchProgress, queryClient, applicationId]);

  /**
   * Handle progress update event
   */
  const handleProgressEvent = useCallback(
    (event: ProgressEvent) => {
      onUpdate?.(event);

      // Trigger refresh on any progress event
      refresh();
    },
    [onUpdate, refresh]
  );

  /**
   * Optimistically update document status
   */
  const optimisticDocumentUpdate = useCallback(
    (documentId: string, status: DocumentSlot['status']) => {
      if (!optimistic || !progress) return;

      setProgress((prev) => {
        if (!prev) return prev;

        const updatedDocuments = prev.documents.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                status,
                uploadedAt: status === 'uploaded' ? new Date() : doc.uploadedAt,
                processedAt: status === 'done' ? new Date() : doc.processedAt,
              }
            : doc
        );

        return {
          ...prev,
          documents: updatedDocuments,
          lastUpdated: new Date(),
        };
      });

      // Emit optimistic event
      const event: ProgressEvent = {
        type: `document_${status}` as ProgressEventType,
        applicationId,
        timestamp: new Date(),
        data: { documentId, status },
      };

      handleProgressEvent(event);
    },
    [optimistic, progress, applicationId, handleProgressEvent]
  );

  /**
   * Optimistically update module progress
   */
  const optimisticModuleUpdate = useCallback(
    (moduleNumber: number, percentage: number) => {
      if (!optimistic || !progress) return;

      setProgress((prev) => {
        if (!prev) return prev;

        const updatedModules = prev.modules.map((module) =>
          module.moduleNumber === moduleNumber
            ? {
                ...module,
                completionPercentage: percentage,
                isComplete: percentage === 100,
              }
            : module
        );

        return {
          ...prev,
          modules: updatedModules,
          lastUpdated: new Date(),
        };
      });

      // Emit optimistic event
      const event: ProgressEvent = {
        type: 'module_field_changed',
        applicationId,
        timestamp: new Date(),
        data: { moduleNumber, percentage },
      };

      handleProgressEvent(event);
    },
    [optimistic, progress, applicationId, handleProgressEvent]
  );

  /**
   * Initialize WebSocket connection for real-time updates
   */
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;

    const connectWebSocket = () => {
      try {
        // WebSocket endpoint (adjust protocol based on current location)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/applications/${applicationId}/progress`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[useProgressUpdates] WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Clear polling fallback
          if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const progressEvent: ProgressEvent = JSON.parse(event.data);
            handleProgressEvent(progressEvent);
          } catch (err) {
            console.error('[useProgressUpdates] Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('[useProgressUpdates] WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };

        ws.onclose = () => {
          console.log('[useProgressUpdates] WebSocket disconnected');
          setIsConnected(false);

          // Attempt reconnection after 5 seconds
          reconnectTimer = setTimeout(() => {
            console.log('[useProgressUpdates] Attempting to reconnect...');
            connectWebSocket();
          }, 5000);

          // Start polling fallback
          if (!pollingTimer) {
            pollingTimer = setInterval(() => {
              refresh();
            }, pollingInterval);
          }
        };
      } catch (err) {
        console.error('[useProgressUpdates] Failed to create WebSocket:', err);

        // Fall back to polling
        if (!pollingTimer) {
          pollingTimer = setInterval(() => {
            refresh();
          }, pollingInterval);
        }
      }
    };

    // Initial data fetch
    refresh();

    // Try WebSocket connection (with fallback to polling)
    connectWebSocket();

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [applicationId, pollingInterval, refresh, handleProgressEvent]);

  return {
    progress,
    isLoading,
    isConnected,
    error,
    refresh,
    optimisticDocumentUpdate,
    optimisticModuleUpdate,
  };
}

/**
 * Calculate overall progress percentage from categories
 */
export function calculateOverallProgress(categories: CategoryCompletion[]): number {
  if (categories.length === 0) return 0;

  const totalItems = categories.reduce((sum, cat) => sum + cat.total, 0);
  const completedItems = categories.reduce((sum, cat) => sum + cat.completed, 0);

  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
}

/**
 * Check if application is ready for certification
 */
export function isReadyForCertification(categories: CategoryCompletion[]): boolean {
  return categories.every((cat) => cat.completed === cat.total);
}

/**
 * Mock progress data for development/testing
 */
export const MOCK_PROGRESS_DATA: ProgressData = {
  documents: [
    { id: 'doc-1', type: 'tax_return', label: 'Tax Return', status: 'done' },
    { id: 'doc-2', type: 'financial_statement', label: 'Financial Statement', status: 'done' },
    { id: 'doc-3', type: 'bank_statement', label: 'Bank Statement', status: 'processing' },
    { id: 'doc-4', type: 'land_deed', label: 'Land Deed', status: 'uploaded' },
    { id: 'doc-5', type: 'crop_insurance', label: 'Crop Insurance', status: 'empty' },
    { id: 'doc-6', type: 'equipment_list', label: 'Equipment List', status: 'empty' },
    { id: 'doc-7', type: 'operating_plan', label: 'Operating Plan', status: 'empty' },
    { id: 'doc-8', type: 'business_license', label: 'Business License', status: 'empty' },
    { id: 'doc-9', type: 'identification', label: 'Government ID', status: 'empty' },
  ],
  modules: [
    {
      moduleNumber: 1,
      moduleName: 'Identity & Entity',
      shortName: 'M1',
      completionPercentage: 80,
      requiredFieldsCompleted: 7,
      requiredFieldsTotal: 9,
      isComplete: false,
    },
    {
      moduleNumber: 2,
      moduleName: 'Lands Farmed',
      shortName: 'M2',
      completionPercentage: 50,
      requiredFieldsCompleted: 2,
      requiredFieldsTotal: 4,
      isComplete: false,
    },
    {
      moduleNumber: 3,
      moduleName: 'Financial Statement',
      shortName: 'M3',
      completionPercentage: 0,
      requiredFieldsCompleted: 0,
      requiredFieldsTotal: 7,
      isComplete: false,
    },
    {
      moduleNumber: 4,
      moduleName: 'Projected Operations',
      shortName: 'M4',
      completionPercentage: 0,
      requiredFieldsCompleted: 0,
      requiredFieldsTotal: 9,
      isComplete: false,
    },
    {
      moduleNumber: 5,
      moduleName: 'Summary & Ratios',
      shortName: 'M5',
      completionPercentage: 0,
      requiredFieldsCompleted: 0,
      requiredFieldsTotal: 4,
      isComplete: false,
    },
  ],
  categories: [
    { category: 'documents', label: 'Documents', completed: 4, total: 9, percentage: 44.4 },
    { category: 'modules', label: 'Modules', completed: 0, total: 5, percentage: 0 },
    { category: 'fields', label: 'Required Fields', completed: 9, total: 33, percentage: 27.3 },
  ],
  blockers: [
    {
      id: 'blocker-1',
      category: 'documents',
      description: '5 documents not uploaded',
      severity: 'critical',
    },
    {
      id: 'blocker-2',
      category: 'modules',
      description: 'Modules 3, 4, and 5 not started',
      severity: 'critical',
    },
  ],
  overallPercentage: 23.9,
  readyForCertification: false,
  lastUpdated: new Date(),
};
