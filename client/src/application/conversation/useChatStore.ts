import { create } from 'zustand';
import type { Database } from '../../../../shared/types/database';

/**
 * useChatStore - Zustand Store for Chat State Management
 *
 * Manages chat conversation state including:
 * - Current messages array
 * - Is typing/streaming state
 * - Send message action
 * - Add message action
 * - Update streaming message
 * - Clear messages
 */

type DbMessage = Database['public']['Tables']['agfin_ai_bot_messages']['Row'];

export interface Message extends DbMessage {
  isStreaming?: boolean;
}

interface ChatState {
  // State
  messages: Message[];
  isTyping: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
  lastUserMessage: string | null;
  lastUserMessageId: string | null;

  // Editing state
  editingMessageId: string | null;
  isEditing: boolean;

  // Actions
  addMessage: (message: Message) => void;
  sendMessage: (content: string, role: 'user' | 'assistant') => void;
  updateStreamingMessage: (messageId: string, content: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  startStreamingMessage: (messageId: string) => void;
  completeStreamingMessage: () => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setError: (error: string | null) => void;
  setLastUserMessage: (content: string, id: string) => void;
  removeMessage: (messageId: string) => void;

  // Editing actions
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
  updateMessage: (messageId: string, content: string) => void;
  removeMessagesAfter: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isTyping: false,
  isStreaming: false,
  streamingMessageId: null,
  error: null,
  lastUserMessage: null,
  lastUserMessageId: null,

  // Editing state
  editingMessageId: null,
  isEditing: false,

  // Add a message to the chat
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // Send a message (creates optimistic message)
  sendMessage: (content: string, role: 'user' | 'assistant' = 'user') => {
    const message: Message = {
      id: `temp-${Date.now()}`,
      session_id: '', // Will be set by API
      role,
      content,
      created_at: new Date().toISOString(),
      isStreaming: role === 'assistant',
    };

    set((state) => ({
      messages: [...state.messages, message],
      isTyping: role === 'user', // Set typing when user sends message
      error: null,
    }));
  },

  // Update a streaming message's content
  updateStreamingMessage: (messageId: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, isStreaming: true }
          : msg
      ),
    }));
  },

  // Set typing indicator state
  setIsTyping: (isTyping: boolean) => {
    set({ isTyping });
  },

  // Set streaming state
  setIsStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },

  // Start streaming a new message
  startStreamingMessage: (messageId: string) => {
    const message: Message = {
      id: messageId,
      session_id: '', // Will be set by API
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, message],
      streamingMessageId: messageId,
      isStreaming: true,
      isTyping: false,
    }));
  },

  // Complete the streaming message
  completeStreamingMessage: () => {
    const { streamingMessageId } = get();

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === streamingMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ),
      streamingMessageId: null,
      isStreaming: false,
      isTyping: false,
    }));
  },

  // Clear all messages
  clearMessages: () => {
    set({
      messages: [],
      isTyping: false,
      isStreaming: false,
      streamingMessageId: null,
      error: null,
      lastUserMessage: null,
      lastUserMessageId: null,
    });
  },

  // Set messages (for loading from API)
  setMessages: (messages: Message[]) => {
    set({ messages });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error, isTyping: false, isStreaming: false });
  },

  // Set last user message (for regeneration)
  setLastUserMessage: (content: string, id: string) => {
    set({ lastUserMessage: content, lastUserMessageId: id });
  },

  // Remove a message by ID
  removeMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },

  // Start editing a message
  startEditing: (messageId: string) => {
    set({
      editingMessageId: messageId,
      isEditing: true,
    });
  },

  // Cancel editing
  cancelEditing: () => {
    set({
      editingMessageId: null,
      isEditing: false,
    });
  },

  // Update a message's content (for editing)
  updateMessage: (messageId: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
      editingMessageId: null,
      isEditing: false,
    }));
  },

  // Remove all messages after a given message (for regeneration)
  removeMessagesAfter: (messageId: string) => {
    set((state) => {
      const messageIndex = state.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return state;

      return {
        messages: state.messages.slice(0, messageIndex + 1),
      };
    });
  },
}));

export default useChatStore;
