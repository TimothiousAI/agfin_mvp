# Implementation Plan: Stop Generation and Regenerate Buttons

**Scope**: Add stop generation button during streaming and regenerate option on completed assistant messages
**Services Affected**: client
**Estimated Steps**: 12

---

## Overview

This feature adds two critical UX controls to the chat interface as specified in PRD Section 7.1:
1. **Stop Generation Button** - Appears during streaming to allow users to abort AI response generation
2. **Regenerate Button** - Appears on completed assistant messages to request a new response

These controls integrate with the existing `useMessageStream` hook (which already has `stopStream` support) and the `useChatStore` Zustand store (which tracks `isStreaming` state).

---

## Prerequisites

- [x] `useMessageStream` hook exists with `stopStream()` method
- [x] `useChatStore` has `isStreaming` state and `streamingMessageId`
- [x] Keyboard shortcut system available (`useKeyboardShortcuts`)
- [x] Button component with variants available
- [x] Tooltip component available for keyboard hint display

---

## Implementation Steps

### Phase 1: Enhance Chat Store

**Step 1.1**: Add last user message tracking for regenerate functionality

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useChatStore.ts`
- Changes: Add `lastUserMessage` state and `setLastUserMessage` action to enable regeneration

```typescript
// Add to ChatState interface (around line 22)
interface ChatState {
  // ... existing state
  lastUserMessage: string | null;
  lastUserMessageId: string | null;

  // ... existing actions
  setLastUserMessage: (content: string, id: string) => void;
  removeMessage: (messageId: string) => void;
}

// Add to store implementation (around line 43)
export const useChatStore = create<ChatState>((set, get) => ({
  // ... existing initial state
  lastUserMessage: null,
  lastUserMessageId: null,

  // Add new actions
  setLastUserMessage: (content: string, id: string) => {
    set({ lastUserMessage: content, lastUserMessageId: id });
  },

  removeMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },

  // Update clearMessages to also clear lastUserMessage
  clearMessages: () => {
    set({
      messages: [],
      isTyping: false,
      isStreaming: false,
      streamingMessageId: null,
      lastUserMessage: null,
      lastUserMessageId: null,
      error: null,
    });
  },
}));
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 2: Create Stop Generation Button Component

**Step 2.1**: Create StopGenerationButton component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\StopGenerationButton.tsx`
- Changes: New component with stop icon, loading animation, and tooltip showing Escape shortcut

```typescript
import { Square } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export interface StopGenerationButtonProps {
  onStop: () => void;
  disabled?: boolean;
}

export function StopGenerationButton({ onStop, disabled = false }: StopGenerationButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
          disabled={disabled}
          className="gap-2"
          aria-label="Stop generation (Escape)"
        >
          <Square size={14} className="fill-current" />
          <span>Stop</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Stop generation</p>
        <p className="text-white/60 text-xs">Press Escape</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default StopGenerationButton;
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 3: Create Regenerate Button Component

**Step 3.1**: Create RegenerateButton component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\RegenerateButton.tsx`
- Changes: New component with refresh icon for regenerating responses

```typescript
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export interface RegenerateButtonProps {
  onRegenerate: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function RegenerateButton({
  onRegenerate,
  disabled = false,
  loading = false
}: RegenerateButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={disabled || loading}
          loading={loading}
          className="gap-2 text-white/60 hover:text-white"
          aria-label="Regenerate response"
        >
          <RefreshCw size={14} />
          <span>Regenerate</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Generate a new response</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default RegenerateButton;
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 4: Update MessageList Component

**Step 4.1**: Add regenerate button to assistant messages

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\MessageList.tsx`
- Changes: Add RegenerateButton to MessageItem for non-streaming assistant messages, pass onRegenerate callback

```typescript
// Add import at top
import { RegenerateButton } from './RegenerateButton';

// Update MessageListProps interface (around line 26)
export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  sessionId?: string;
  onLoadMore?: () => void;
  onRegenerate?: (messageId: string) => void;
  isRegenerating?: boolean;
  canRegenerate?: boolean;
}

// Update MessageItemProps interface (around line 172)
interface MessageItemProps {
  message: Message;
  showTimestamp: boolean;
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  canRegenerate?: boolean;
}

// Update MessageItem component to show regenerate button (around line 195-225)
function MessageItem({
  message,
  showTimestamp,
  isLastAssistantMessage = false,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const showRegenerate = isAssistant &&
                         isLastAssistantMessage &&
                         !message.isStreaming &&
                         canRegenerate &&
                         onRegenerate;

  // ... existing timestamp and bubble rendering ...

  // Add after message content, before closing div (around line 214)
  {/* Action buttons for assistant messages */}
  {showRegenerate && (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
      <RegenerateButton
        onRegenerate={onRegenerate}
        loading={isRegenerating}
        disabled={isRegenerating}
      />
    </div>
  )}
}

// Update itemContent in Virtuoso (around line 131)
itemContent={(index, message) => {
  const isLastAssistant =
    message.role === 'assistant' &&
    index === messages.length - 1;

  return (
    <MessageItem
      message={message}
      showTimestamp={shouldShowTimestamp(index)}
      isLastAssistantMessage={isLastAssistant}
      onRegenerate={isLastAssistant ? () => onRegenerate?.(message.id) : undefined}
      isRegenerating={isRegenerating}
      canRegenerate={canRegenerate}
    />
  );
}}
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 5: Update ChatInput Component

**Step 5.1**: Add stop button integration to ChatInput

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\ChatInput.tsx`
- Changes: Add isStreaming prop and show StopGenerationButton when streaming

```typescript
// Add import at top
import { StopGenerationButton } from './StopGenerationButton';

// Update ChatInputProps interface (around line 17)
export interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

// Update component signature (around line 26)
export function ChatInput({
  onSend,
  onStop,
  placeholder = 'Type a message...',
  disabled = false,
  isStreaming = false,
  showCharacterCount = false,
  maxLength,
  autoFocus = true,
}: ChatInputProps) {

// Update send button area to conditionally show stop button (around line 134-163)
{/* Send or Stop button */}
{isStreaming && onStop ? (
  <StopGenerationButton onStop={onStop} />
) : (
  <button
    onClick={handleSubmit}
    disabled={disabled || isEmpty}
    className="
      px-6 py-3 rounded-lg font-medium
      bg-[#30714C] text-white
      hover:bg-[#265d3d] active:bg-[#1e4730]
      disabled:bg-gray-300 disabled:cursor-not-allowed
      transition-colors
      flex items-center gap-2
      flex-shrink-0
    "
    aria-label="Send message"
  >
    <span>Send</span>
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  </button>
)}
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 6: Add Escape Keyboard Shortcut

**Step 6.1**: Create chat-specific keyboard shortcuts

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\chatShortcuts.ts`
- Changes: New file with Escape shortcut for stopping generation

```typescript
/**
 * Chat Keyboard Shortcuts
 *
 * Shortcuts specific to the chat interface including:
 * - Escape to stop generation
 */

import type { ShortcutRegistration } from '@/shared/commands/useKeyboardShortcuts';

export interface ChatShortcutHandlers {
  /** Handler for stopping generation (Escape) */
  onStopGeneration?: () => void;
  /** Function to check if streaming is active */
  isStreaming?: () => boolean;
}

/**
 * Get chat keyboard shortcuts with provided handlers
 */
export function getChatShortcuts(handlers: ChatShortcutHandlers): ShortcutRegistration[] {
  const shortcuts: ShortcutRegistration[] = [];

  // Escape: Stop generation
  if (handlers.onStopGeneration) {
    shortcuts.push({
      id: 'chat.stopGeneration',
      shortcut: {
        key: 'Escape',
        handler: (_event) => {
          // Only stop if currently streaming
          if (handlers.isStreaming && !handlers.isStreaming()) {
            return;
          }
          handlers.onStopGeneration!();
        },
        allowInInputs: true, // Allow Escape even when in textarea
        description: 'Stop AI response generation'
      }
    });
  }

  return shortcuts;
}

/**
 * Chat shortcut display strings for help/documentation
 */
export const CHAT_SHORTCUT_LABELS = {
  STOP_GENERATION: 'Esc',
} as const;
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 7: Create useStopGeneration Hook

**Step 7.1**: Create dedicated hook for stop generation logic

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useStopGeneration.ts`
- Changes: New hook that combines keyboard shortcut and store state

```typescript
import { useEffect, useCallback, useMemo } from 'react';
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
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 8: Create useRegenerate Hook

**Step 8.1**: Create dedicated hook for regenerate functionality

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useRegenerate.ts`
- Changes: New hook that handles regeneration logic

```typescript
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
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 9: Update ChatCenter Component

**Step 9.1**: Integrate stop and regenerate functionality into ChatCenter

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ChatCenter.tsx`
- Changes: Connect all the hooks and pass handlers to child components

```typescript
// Update imports
import { Send, Paperclip, Square } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { TooltipProvider } from '@/shared/ui/tooltip';

// Add new props to interface (around line 11)
interface ChatCenterProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  onStopGeneration?: () => void;
  onRegenerate?: (messageId: string) => void;
  applicationContext?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  canRegenerate?: boolean;
  isRegenerating?: boolean;
}

// Update component signature
export function ChatCenter({
  messages = [],
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  applicationContext,
  isLoading = false,
  isStreaming = false,
  canRegenerate = true,
  isRegenerating = false,
}: ChatCenterProps) {

// Update handleKeyDown to include Escape (around line 39)
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  // Note: Escape is handled globally by useStopGeneration hook
};

// Update header to show streaming status (around line 54-59)
{isStreaming ? (
  <div className="flex items-center gap-2 text-white/60 text-sm">
    <div className="w-2 h-2 bg-[#DDC66F] rounded-full animate-pulse" />
    <span>Generating...</span>
  </div>
) : isLoading && (
  <div className="flex items-center gap-2 text-white/60 text-sm">
    <div className="w-2 h-2 bg-[#30714C] rounded-full animate-pulse" />
    <span>Thinking...</span>
  </div>
)}

// Update message rendering to include regenerate button (around line 84-116)
{messages.map((message, index) => {
  const isLastAssistant = message.role === 'assistant' &&
                          index === messages.length - 1;
  const showRegenerate = isLastAssistant &&
                         !message.isStreaming &&
                         canRegenerate &&
                         onRegenerate;

  return (
    <div
      key={message.id}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {/* ... existing message bubble ... */}

      {/* Regenerate button for last assistant message */}
      {showRegenerate && (
        <button
          onClick={() => onRegenerate(message.id)}
          disabled={isRegenerating || isStreaming}
          className="
            mt-2 flex items-center gap-1 text-xs text-white/40
            hover:text-white/60 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Regenerate response"
        >
          <RefreshCw size={12} />
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
})}

// Update send button area (around line 163-176)
{/* Send or Stop Button */}
{isStreaming && onStopGeneration ? (
  <button
    onClick={onStopGeneration}
    className="
      flex-shrink-0 p-3
      bg-[#C1201C] hover:bg-[#a01a17]
      text-white rounded-lg transition-colors
    "
    aria-label="Stop generation (Escape)"
  >
    <Square size={20} className="fill-current" />
  </button>
) : (
  <button
    onClick={handleSend}
    disabled={!inputValue.trim() || isLoading || isStreaming}
    className="
      flex-shrink-0 p-3
      bg-[#30714C] hover:bg-[#3d8a5f]
      text-white rounded-lg transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
    "
    aria-label="Send message"
  >
    <Send size={20} />
  </button>
)}

// Update helper text (around line 180-182)
<p className="text-white/40 text-xs mt-2 text-center">
  {isStreaming
    ? 'Press Escape to stop generation'
    : 'Press Enter to send, Shift+Enter for new line'
  }
</p>
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 10: Update useChatApi Integration

**Step 10.1**: Track last user message in sendMessage

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useChatApi.ts`
- Changes: Update useSendMessage to track last user message for regeneration

```typescript
// Update imports (add setLastUserMessage)
const { addMessage, setError, setLastUserMessage } = useChatStore();

// Update onMutate in useSendMessage (around line 66-78)
onMutate: async ({ content, role = 'user' }: SendMessageRequest) => {
  // Optimistic update - add message immediately
  const optimisticMessage: Message = {
    id: `temp-${Date.now()}`,
    session_id: '',
    role,
    content,
    created_at: new Date().toISOString(),
  };

  addMessage(optimisticMessage);

  // Track last user message for regeneration
  if (role === 'user') {
    setLastUserMessage(content, optimisticMessage.id);
  }

  return { optimisticMessage };
},
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 11: Update KeyboardShortcutsHelp

**Step 11.1**: Add stop generation shortcut to help modal

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\KeyboardShortcutsHelp.tsx`
- Changes: Add chat shortcuts section with Escape shortcut

```typescript
// Add to SHORTCUT_CATEGORIES or equivalent section
{
  name: 'Chat',
  shortcuts: [
    { key: 'Esc', description: 'Stop AI response generation' },
    { key: 'Enter', description: 'Send message' },
    { key: 'Shift+Enter', description: 'New line in message' },
  ]
}
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 12: Export New Components

**Step 12.1**: Update conversation module exports

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\index.ts` (create if not exists)
- Changes: Export all new components and hooks

```typescript
// Components
export { StopGenerationButton } from './StopGenerationButton';
export { RegenerateButton } from './RegenerateButton';

// Hooks
export { useStopGeneration } from './useStopGeneration';
export { useRegenerate } from './useRegenerate';
export { useMessageStream } from './useMessageStream';
export { useChatStore } from './useChatStore';
export { useSendMessage, useChatHistory, useStreamMessage, useClearChat } from './useChatApi';

// Shortcuts
export { getChatShortcuts, CHAT_SHORTCUT_LABELS } from './chatShortcuts';

// Types
export type { Message } from './useChatStore';
export type { UseStopGenerationOptions, UseStopGenerationReturn } from './useStopGeneration';
export type { UseRegenerateOptions, UseRegenerateReturn } from './useRegenerate';
```

**Validation**: `cd client && npm run build`

---

## Acceptance Criteria

- [ ] Stop button appears in place of Send button during streaming
- [ ] Stop button has red/destructive styling for visual distinction
- [ ] Clicking Stop button immediately stops AI response generation
- [ ] Pressing Escape key stops generation when streaming is active
- [ ] Escape shortcut works even when cursor is in textarea
- [ ] Partial response is preserved when generation is stopped
- [ ] Header shows "Generating..." status during streaming
- [ ] Regenerate button appears only on the last assistant message
- [ ] Regenerate button only appears after streaming completes (not during)
- [ ] Clicking Regenerate removes the assistant message and re-sends user message
- [ ] Regenerate button is disabled during streaming or regeneration
- [ ] Helper text updates to show "Press Escape to stop" during streaming
- [ ] Tooltip on Stop button shows "Press Escape" keyboard hint
- [ ] Keyboard Shortcuts Help modal includes chat shortcuts section

---

## Final Validation

```bash
# Run TypeScript type checking
cd client && npx tsc --noEmit

# Run linting
cd client && npm run lint

# Run build
cd client && npm run build

# Run tests (if any)
cd client && npm run test
```

---

## Notes

1. **AbortController vs EventSource.close()**: The current `useMessageStream` uses EventSource which has a `close()` method called in `stopStream()`. This is the correct approach for SSE streams - no AbortController needed.

2. **State Synchronization**: The `isStreaming` state lives in Zustand store (`useChatStore`) and is updated by `useMessageStream` callbacks. The store is the source of truth.

3. **Escape Key Priority**: The Escape shortcut is registered with `allowInInputs: true` to work even when the user is typing in the textarea. This ensures users can always stop generation.

4. **Regenerate UX**: Regeneration removes the existing assistant message before sending, creating a clean slate for the new response. This matches Claude.ai behavior.

5. **Visual Feedback**:
   - Stop button uses destructive (red) variant for immediate recognition
   - Header text changes from "Thinking..." to "Generating..." during streaming
   - Helper text contextually updates based on streaming state

6. **Accessibility**: All buttons include proper aria-labels and keyboard support. The Stop button specifically mentions "Escape" in its aria-label for screen reader users.
