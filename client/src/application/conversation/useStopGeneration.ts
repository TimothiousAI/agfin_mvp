import { useCallback, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/shared/commands/useKeyboardShortcuts';
import { getChatShortcuts } from './chatShortcuts';
import { useChatStore } from './useChatStore';

export interface UseStopGenerationOptions {
  /** Callback to abort the stream */
  onStop: () => void;
  /** Whether the feature is enabled */
  enabled?: boolean;
}

export interface UseStopGenerationReturn {
  /** Whether generation can be stopped (is streaming) */
  canStop: boolean;
  /** Handler to stop generation */
  handleStop: () => void;
}

/**
 * useStopGeneration Hook
 *
 * Provides stop generation functionality with:
 * - Escape keyboard shortcut integration
 * - State management via chat store
 * - Streaming state awareness
 */
export function useStopGeneration({
  onStop,
  enabled = true,
}: UseStopGenerationOptions): UseStopGenerationReturn {
  const isStreaming = useChatStore((state) => state.isStreaming);
  const completeStreamingMessage = useChatStore((state) => state.completeStreamingMessage);

  const handleStop = useCallback(() => {
    if (!isStreaming) return;

    // Stop the stream
    onStop();

    // Mark the streaming message as complete (with partial content)
    completeStreamingMessage();
  }, [isStreaming, onStop, completeStreamingMessage]);

  // Register Escape keyboard shortcut
  const shortcuts = useMemo(() => {
    return getChatShortcuts({
      onStopGeneration: handleStop,
      isStreaming: () => isStreaming,
    });
  }, [handleStop, isStreaming]);

  useKeyboardShortcuts(shortcuts, { disabled: !enabled });

  return {
    canStop: isStreaming,
    handleStop,
  };
}

export default useStopGeneration;
