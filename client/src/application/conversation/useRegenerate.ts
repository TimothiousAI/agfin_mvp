import { useCallback, useState } from 'react';
import { useChatStore } from './useChatStore';

export interface UseRegenerateOptions {
  /** Callback to send a new message (triggers new AI response) */
  onSendMessage: (message: string) => void;
  /** Whether regeneration is enabled */
  enabled?: boolean;
}

export interface UseRegenerateReturn {
  /** Whether regenerate is available */
  canRegenerate: boolean;
  /** Whether currently regenerating */
  isRegenerating: boolean;
  /** Handler to regenerate the last response */
  handleRegenerate: (assistantMessageId: string) => void;
}

/**
 * useRegenerate Hook
 *
 * Provides regenerate functionality:
 * - Removes the last assistant message
 * - Re-sends the last user message
 * - Tracks regeneration state
 */
export function useRegenerate({
  onSendMessage,
  enabled = true,
}: UseRegenerateOptions): UseRegenerateReturn {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isStreaming = useChatStore((state) => state.isStreaming);
  const lastUserMessage = useChatStore((state) => state.lastUserMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);

  const canRegenerate = enabled &&
                        !isStreaming &&
                        !!lastUserMessage;

  const handleRegenerate = useCallback((assistantMessageId: string) => {
    if (!canRegenerate || !lastUserMessage) return;

    setIsRegenerating(true);

    // Remove the assistant message we're regenerating
    removeMessage(assistantMessageId);

    // Re-send the last user message to get a new response
    onSendMessage(lastUserMessage);

    // Reset regenerating state after a short delay
    // (actual streaming state will be handled by the stream hook)
    setTimeout(() => {
      setIsRegenerating(false);
    }, 500);
  }, [canRegenerate, lastUserMessage, removeMessage, onSendMessage]);

  return {
    canRegenerate,
    isRegenerating,
    handleRegenerate,
  };
}

export default useRegenerate;
