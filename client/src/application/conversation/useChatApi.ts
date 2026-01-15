import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from './useChatStore';
import { useMessageStream } from './useMessageStream';
import type { Message } from './useChatStore';

/**
 * useChatApi - API Integration Hooks for Chat
 *
 * Provides React Query hooks for chat operations:
 * - useSendMessage() - POST to chat endpoint
 * - useStreamMessage() - SSE streaming integration
 * - useChatHistory() - load session messages
 * - Error handling and retry
 * - Optimistic message display
 */

const API_BASE_URL = '/api/agfin-ai-bot';

interface SendMessageRequest {
  sessionId: string;
  content: string;
  role?: 'user' | 'assistant';
}

interface SendMessageResponse {
  message: Message;
  sessionId: string;
}

interface ChatHistoryResponse {
  messages: Message[];
  sessionId: string;
}

/**
 * useSendMessage Hook
 *
 * Sends a message to the chat API with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { addMessage, setError } = useChatStore();

  return useMutation({
    mutationFn: async ({ sessionId, content, role = 'user' }: SendMessageRequest) => {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          role,
          content,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to send message' }));
        throw new Error(error.message || 'Failed to send message');
      }

      return response.json() as Promise<SendMessageResponse>;
    },
    onMutate: async ({ content, role = 'user' }: SendMessageRequest) => {
      // Optimistic update - add message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: '',
        role,
        content,
        created_at: new Date().toISOString(),
        metadata: null,
      };

      addMessage(optimisticMessage);

      return { optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: ['chatHistory', variables.sessionId] });
    },
    onError: (error, variables, context) => {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');

      // Remove optimistic message on error
      if (context?.optimisticMessage) {
        // Note: You might want to implement a removeMessage action in the store
        // For now, we'll just set the error state
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * useChatHistory Hook
 *
 * Loads chat history for a session
 */
export function useChatHistory(sessionId: string, options?: { enabled?: boolean }) {
  const { setMessages, setError } = useChatStore();

  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to load chat history' }));
        throw new Error(error.message || 'Failed to load chat history');
      }

      return response.json() as Promise<ChatHistoryResponse>;
    },
    enabled: options?.enabled !== false && !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: (data) => {
      setMessages(data.messages);
    },
    onError: (error) => {
      console.error('Failed to load chat history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat history');
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * useStreamMessage Hook
 *
 * Integrates SSE streaming with chat store and React Query
 */
export function useStreamMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const {
    startStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    setIsTyping,
    setError,
  } = useChatStore();

  const handleStart = () => {
    const messageId = `stream-${Date.now()}`;
    startStreamingMessage(messageId);
    setIsTyping(false);
  };

  const handleToken = (token: string) => {
    const { streamingMessageId, messages } = useChatStore.getState();
    if (streamingMessageId) {
      const currentMessage = messages.find((m) => m.id === streamingMessageId);
      const newContent = (currentMessage?.content || '') + token;
      updateStreamingMessage(streamingMessageId, newContent);
    }
  };

  const handleEnd = () => {
    completeStreamingMessage();
    // Invalidate chat history to refetch and get the final message from server
    queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });
  };

  const handleError = (error: string) => {
    console.error('Streaming error:', error);
    setError(error);
    completeStreamingMessage();
  };

  const stream = useMessageStream({
    sessionId,
    onStart: handleStart,
    onToken: handleToken,
    onEnd: handleEnd,
    onError: handleError,
    autoRetry: true,
    maxRetries: 3,
  });

  return stream;
}

/**
 * useClearChat Hook
 *
 * Clears the current chat session
 */
export function useClearChat() {
  const queryClient = useQueryClient();
  const { clearMessages } = useChatStore();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/clear`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to clear chat' }));
        throw new Error(error.message || 'Failed to clear chat');
      }

      return response.json();
    },
    onSuccess: (data, sessionId) => {
      clearMessages();
      queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });
    },
    onError: (error) => {
      console.error('Failed to clear chat:', error);
    },
  });
}

export default {
  useSendMessage,
  useChatHistory,
  useStreamMessage,
  useClearChat,
};
