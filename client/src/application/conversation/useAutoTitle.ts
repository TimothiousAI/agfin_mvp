import { useEffect, useRef } from 'react';
import { useChatStore } from './useChatStore';
import { useSessionStore } from './useSessionStore';
import { useGenerateSessionTitle } from './useSessionsApi';

/**
 * useAutoTitle Hook
 *
 * Automatically generates a session title after the first complete exchange.
 * Monitors for:
 * - First user message
 * - First complete assistant response (not streaming)
 * - Session still has default title
 */
export function useAutoTitle(sessionId: string | null) {
  const { messages } = useChatStore();
  const { getSession } = useSessionStore();
  const generateTitle = useGenerateSessionTitle();

  // Track if we've already attempted title generation for this session
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip if no session
    if (!sessionId) return;

    // Skip if already attempted for this session
    if (attemptedRef.current.has(sessionId)) return;

    // Get current session
    const session = getSession(sessionId);
    if (!session) return;

    // Skip if title is already customized
    if (session.title !== 'New Conversation') {
      attemptedRef.current.add(sessionId);
      return;
    }

    // Find first user message and first complete assistant response
    const userMessages = messages.filter(m => m.role === 'user' && !m.isStreaming);
    const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.isStreaming);

    // Need at least one of each, and assistant must be complete (not streaming)
    if (userMessages.length === 0 || assistantMessages.length === 0) {
      return;
    }

    const firstUserMessage = userMessages[0];
    const firstAssistantMessage = assistantMessages[0];

    // Verify assistant message has content (not empty or placeholder)
    if (!firstAssistantMessage.content || firstAssistantMessage.content.length < 10) {
      return;
    }

    // Mark as attempted to prevent duplicate calls
    attemptedRef.current.add(sessionId);

    // Generate title
    generateTitle.mutate({
      sessionId,
      userMessage: firstUserMessage.content,
      assistantResponse: firstAssistantMessage.content,
    });

  }, [sessionId, messages, getSession, generateTitle]);

  // Clear attempted set when session changes
  useEffect(() => {
    return () => {
      // Keep the set but it will naturally not trigger for new sessions
    };
  }, [sessionId]);

  return {
    isGenerating: generateTitle.isPending,
    error: generateTitle.error,
  };
}

export default useAutoTitle;
