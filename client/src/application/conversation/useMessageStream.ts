import { useEffect, useRef, useCallback } from 'react';

/**
 * useMessageStream Hook
 *
 * Handles Server-Sent Events (SSE) streaming for AI chat messages.
 * - Connects to /api/agfin-ai-bot/stream
 * - Appends tokens to current message
 * - Handles stream events (start, token, end, error)
 * - Cleanup on unmount
 * - Retry on disconnect
 */

export interface StreamEvent {
  type: 'start' | 'token' | 'end' | 'error';
  data?: string;
  error?: string;
}

export interface UseMessageStreamOptions {
  /** Session ID for the conversation */
  sessionId: string;
  /** Callback when a new token arrives */
  onToken?: (token: string) => void;
  /** Callback when streaming starts */
  onStart?: () => void;
  /** Callback when streaming ends */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Enable automatic retry on disconnect (default: true) */
  autoRetry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;
}

export interface UseMessageStreamReturn {
  /** Whether stream is currently active */
  isStreaming: boolean;
  /** Start streaming with a message */
  startStream: (message: string) => void;
  /** Stop the current stream */
  stopStream: () => void;
  /** Current error if any */
  error: string | null;
}

export function useMessageStream({
  sessionId,
  onToken,
  onStart,
  onEnd,
  onError,
  autoRetry = true,
  maxRetries = 3,
  retryDelay = 1000,
}: UseMessageStreamOptions): UseMessageStreamReturn {
  const eventSourceRef = useRef<EventSource | null>(null);
  const isStreamingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRef = useRef<string | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    isStreamingRef.current = false;
  }, []);

  // Stop stream
  const stopStream = useCallback(() => {
    cleanup();
    retryCountRef.current = 0;
    errorRef.current = null;
  }, [cleanup]);

  // Start stream
  const startStream = useCallback(
    (message: string) => {
      // Clean up any existing stream
      cleanup();

      // Reset state
      errorRef.current = null;
      isStreamingRef.current = true;

      try {
        // Create EventSource connection
        const url = new URL('/api/agfin-ai-bot/stream', window.location.origin);
        url.searchParams.set('sessionId', sessionId);
        url.searchParams.set('message', encodeURIComponent(message));

        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        // Handle stream start
        eventSource.addEventListener('start', () => {
          console.log('[Stream] Started');
          retryCountRef.current = 0; // Reset retry count on successful connection
          onStart?.();
        });

        // Handle incoming tokens
        eventSource.addEventListener('token', (event) => {
          const data = event.data;
          if (data) {
            onToken?.(data);
          }
        });

        // Handle stream end
        eventSource.addEventListener('end', () => {
          console.log('[Stream] Ended');
          isStreamingRef.current = false;
          onEnd?.();
          cleanup();
        });

        // Handle errors
        eventSource.addEventListener('error', (event: any) => {
          const errorMessage = event.data || 'Stream error occurred';
          console.error('[Stream] Error:', errorMessage);
          errorRef.current = errorMessage;
          onError?.(errorMessage);

          // Don't retry on explicit errors from server
          isStreamingRef.current = false;
          cleanup();
        });

        // Handle connection errors (EventSource onerror)
        eventSource.onerror = (event) => {
          console.error('[Stream] Connection error:', event);

          // Retry logic
          if (autoRetry && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const delay = retryDelay * retryCountRef.current;

            console.log(`[Stream] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);

            retryTimeoutRef.current = setTimeout(() => {
              if (isStreamingRef.current) {
                startStream(message);
              }
            }, delay);
          } else {
            const error = 'Failed to connect to stream after multiple attempts';
            errorRef.current = error;
            onError?.(error);
            isStreamingRef.current = false;
            cleanup();
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start stream';
        console.error('[Stream] Failed to start:', errorMessage);
        errorRef.current = errorMessage;
        onError?.(errorMessage);
        isStreamingRef.current = false;
      }
    },
    [sessionId, onToken, onStart, onEnd, onError, autoRetry, maxRetries, retryDelay, cleanup]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isStreaming: isStreamingRef.current,
    startStream,
    stopStream,
    error: errorRef.current,
  };
}

export default useMessageStream;
