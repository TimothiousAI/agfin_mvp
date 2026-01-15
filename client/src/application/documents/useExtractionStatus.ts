import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Document extraction status types
 */
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'processed' | 'failed' | 'error';

export interface ExtractionStatusData {
  documentId: string;
  status: ExtractionStatus;
  progress?: number;
  message?: string;
  error?: string;
  confidence_score?: number;
  extracted_at?: string;
}

export interface UseExtractionStatusOptions {
  /** Document ID to poll */
  documentId: string | null;
  /** Enable polling (default: true) */
  enabled?: boolean;
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
  /** Max polling duration in milliseconds (default: 300000 = 5 minutes) */
  maxPollingDuration?: number;
  /** Callback when extraction completes */
  onComplete?: (data: ExtractionStatusData) => void;
  /** Callback when extraction fails */
  onError?: (error: string) => void;
  /** Callback on each status update */
  onStatusUpdate?: (data: ExtractionStatusData) => void;
}

export interface UseExtractionStatusReturn {
  /** Current extraction status */
  status: ExtractionStatus | null;
  /** Current extraction data */
  data: ExtractionStatusData | null;
  /** Whether currently polling */
  isPolling: boolean;
  /** Error message if any */
  error: string | null;
  /** Elapsed time in seconds since polling started */
  elapsedTime: number;
  /** Start polling manually */
  startPolling: () => void;
  /** Stop polling manually */
  stopPolling: () => void;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook to poll document extraction status
 *
 * Automatically polls the backend for extraction status updates
 * and handles completion, errors, and timeouts.
 *
 * @example
 * ```tsx
 * const { status, isPolling, elapsedTime } = useExtractionStatus({
 *   documentId: doc.id,
 *   onComplete: (data) => {
 *     console.log('Extraction completed!', data);
 *   },
 *   onError: (error) => {
 *     console.error('Extraction failed:', error);
 *   }
 * });
 * ```
 */
export function useExtractionStatus(
  options: UseExtractionStatusOptions
): UseExtractionStatusReturn {
  const {
    documentId,
    enabled = true,
    pollingInterval = 2000,
    maxPollingDuration = 300000, // 5 minutes
    onComplete,
    onError,
    onStatusUpdate,
  } = options;

  const [status, setStatus] = useState<ExtractionStatus | null>(null);
  const [data, setData] = useState<ExtractionStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch current extraction status from API
   */
  const fetchStatus = useCallback(async (docId: string): Promise<ExtractionStatusData | null> => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${docId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const doc = await response.json();

      return {
        documentId: doc.id,
        status: doc.extraction_status,
        confidence_score: doc.confidence_score,
        message: getStatusMessage(doc.extraction_status),
      };
    } catch (err) {
      console.error('Error fetching extraction status:', err);
      return null;
    }
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (elapsedTimeIntervalRef.current) {
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Handle status update
   */
  const handleStatusUpdate = useCallback(
    (statusData: ExtractionStatusData) => {
      setStatus(statusData.status);
      setData(statusData);

      // Call update callback
      if (onStatusUpdate) {
        onStatusUpdate(statusData);
      }

      // Check if completed
      if (statusData.status === 'completed' || statusData.status === 'processed') {
        stopPolling();
        if (onComplete) {
          onComplete(statusData);
        }
      }

      // Check if failed
      if (statusData.status === 'failed' || statusData.status === 'error') {
        stopPolling();
        const errorMsg = statusData.error || 'Extraction failed';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    },
    [onComplete, onError, onStatusUpdate, stopPolling]
  );

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (!documentId || isPolling) return;

    setIsPolling(true);
    setError(null);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    // Start elapsed time counter
    elapsedTimeIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    // Initial fetch
    fetchStatus(documentId).then((statusData) => {
      if (statusData) {
        handleStatusUpdate(statusData);
      }
    });

    // Set up polling interval
    pollingIntervalRef.current = setInterval(async () => {
      const statusData = await fetchStatus(documentId);
      if (statusData) {
        handleStatusUpdate(statusData);
      }
    }, pollingInterval);

    // Set up max duration timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      const errorMsg = 'Extraction timed out';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }, maxPollingDuration);
  }, [documentId, isPolling, pollingInterval, maxPollingDuration, fetchStatus, handleStatusUpdate, onError, stopPolling]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopPolling();
    setStatus(null);
    setData(null);
    setError(null);
    setElapsedTime(0);
    startTimeRef.current = null;
  }, [stopPolling]);

  /**
   * Auto-start polling when enabled and documentId is set
   */
  useEffect(() => {
    if (enabled && documentId && !isPolling) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, documentId, isPolling, startPolling, stopPolling]);

  return {
    status,
    data,
    isPolling,
    error,
    elapsedTime,
    startPolling,
    stopPolling,
    reset,
  };
}

/**
 * Get user-friendly status message
 */
function getStatusMessage(status: ExtractionStatus): string {
  switch (status) {
    case 'pending':
      return 'Waiting to start processing...';
    case 'processing':
      return 'Processing document...';
    case 'completed':
    case 'processed':
      return 'Extraction completed';
    case 'failed':
    case 'error':
      return 'Extraction failed';
    default:
      return 'Unknown status';
  }
}
