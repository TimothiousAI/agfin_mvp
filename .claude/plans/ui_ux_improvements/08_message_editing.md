# Implementation Plan: Message Editing Capability

**Scope**: Add inline editing capability for user messages in the chat interface, allowing users to edit and re-send messages with the option to regenerate AI responses.
**Services Affected**: client | server (proxy) | ai-service
**Estimated Steps**: 12

---

## Overview

This feature enables users to edit their previously sent messages in the chat conversation. When a message is edited, the user can choose to either keep subsequent messages or discard them and regenerate the AI response from that point. This follows the PRD Section 7.1 requirement for message editing capability.

The implementation adds an edit button (pencil icon) that appears on hover for user messages, transforms the message bubble into an editable textarea, and provides save/cancel actions. The backend will support updating message content and optionally deleting subsequent messages for regeneration.

---

## Prerequisites

- [ ] Existing chat functionality working (MessageList, MessageBubble, useChatStore)
- [ ] Database tables `agfin_ai_bot_messages` accessible via AI service

---

## Implementation Steps

### Phase 1: Database/API Layer (AI Service)

**Step 1.1**: Add `update_message` method to DatabaseClient
- File: `C:\Users\timca\Business\agfin_app\ai-service\src\database\connection.py`
- Changes: Add method to update message content by ID

```python
async def update_message(
    self,
    message_id: str,
    content: str
) -> bool:
    """
    Update a message's content.

    Args:
        message_id: UUID of the message to update
        content: New message content

    Returns:
        True if update successful, False if message not found
    """
    if not self.pool:
        await self.connect()

    query = """
        UPDATE agfin_ai_bot_messages
        SET content = $2
        WHERE id = $1
        RETURNING id
    """

    result = await self.pool.fetchval(query, message_id, content)
    return result is not None
```

**Step 1.2**: Add `delete_messages_after` method to DatabaseClient
- File: `C:\Users\timca\Business\agfin_app\ai-service\src\database\connection.py`
- Changes: Add method to delete all messages after a given message (for regeneration)

```python
async def delete_messages_after(
    self,
    session_id: str,
    message_id: str
) -> int:
    """
    Delete all messages in a session that were created after the specified message.

    Args:
        session_id: UUID of the chat session
        message_id: UUID of the message - all messages after this will be deleted

    Returns:
        Number of messages deleted
    """
    if not self.pool:
        await self.connect()

    # Get the timestamp of the reference message
    get_timestamp_query = """
        SELECT created_at FROM agfin_ai_bot_messages
        WHERE id = $1 AND session_id = $2
    """

    timestamp = await self.pool.fetchval(get_timestamp_query, message_id, session_id)
    if not timestamp:
        return 0

    # Delete all messages created after this timestamp
    delete_query = """
        DELETE FROM agfin_ai_bot_messages
        WHERE session_id = $1 AND created_at > $2
        RETURNING id
    """

    deleted = await self.pool.fetch(delete_query, session_id, timestamp)
    return len(deleted)
```

**Step 1.3**: Add edit message endpoint to chat router
- File: `C:\Users\timca\Business\agfin_app\ai-service\src\routers\chat.py`
- Changes: Add PATCH endpoint for editing messages

```python
class EditMessageRequest(BaseModel):
    """Request model for editing a message."""
    content: str = Field(..., min_length=1, description="New message content")
    regenerate: bool = Field(False, description="Whether to delete subsequent messages and regenerate")


class EditMessageResponse(BaseModel):
    """Response model for edit message endpoint."""
    message_id: str
    content: str
    messages_deleted: int = 0


@router.patch("/messages/{message_id}", response_model=EditMessageResponse)
async def edit_message(message_id: str, request: EditMessageRequest):
    """
    Edit a user message in a chat session.

    Updates the message content and optionally deletes all subsequent messages
    if regeneration is requested.

    Args:
        message_id: UUID of the message to edit
        request: EditMessageRequest with new content and regenerate flag

    Returns:
        EditMessageResponse with updated message details

    Raises:
        HTTPException: If message not found or not a user message
    """
    try:
        db = await get_db_client()

        # Get the message to verify it exists and is a user message
        verify_query = """
            SELECT id, session_id, role, content
            FROM agfin_ai_bot_messages
            WHERE id = $1
        """

        # Note: This requires adding a get_message method or inline query
        message = await db.pool.fetchrow(verify_query, message_id)

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Message {message_id} not found"
            )

        if message["role"] != "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only user messages can be edited"
            )

        # Update the message content
        success = await db.update_message(message_id, request.content)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message"
            )

        # If regenerate requested, delete subsequent messages
        messages_deleted = 0
        if request.regenerate:
            messages_deleted = await db.delete_messages_after(
                str(message["session_id"]),
                message_id
            )
            logger.info(f"Deleted {messages_deleted} messages after {message_id} for regeneration")

        return EditMessageResponse(
            message_id=message_id,
            content=request.content,
            messages_deleted=messages_deleted
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Edit message error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to edit message: {str(e)}"
        )
```

**Validation**: `cd ai-service && python -m pytest tests/ -v`

---

### Phase 2: Backend Proxy (Express Server)

**Step 2.1**: Add proxy route for message editing
- File: `C:\Users\timca\Business\agfin_app\server\src\index.ts`
- Changes: Add route to proxy edit requests to AI service (if not already proxying /api/agfin-ai-bot)

Note: The Express server may need to add a proxy configuration for the AI service endpoints. Check if the `/api/agfin-ai-bot` routes are being proxied. If not, add:

```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

// Proxy AI bot requests to AI service
app.use('/api/agfin-ai-bot', createProxyMiddleware({
  target: process.env.AGFIN_AI_BOT_URL || 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/agfin-ai-bot': '/api/agfin-ai-bot'
  }
}));
```

**Validation**: `cd server && npm run build && npm run lint`

---

### Phase 3: Frontend State Management

**Step 3.1**: Add editing state and actions to useChatStore
- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useChatStore.ts`
- Changes: Add state for tracking which message is being edited

```typescript
interface ChatState {
  // Existing state...
  messages: Message[];
  isTyping: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;

  // New editing state
  editingMessageId: string | null;
  isEditing: boolean;

  // Existing actions...
  addMessage: (message: Message) => void;
  // ...

  // New editing actions
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
  updateMessage: (messageId: string, content: string) => void;
  removeMessagesAfter: (messageId: string) => void;
}

// Add to the store implementation:
editingMessageId: null,
isEditing: false,

startEditing: (messageId: string) => {
  set({
    editingMessageId: messageId,
    isEditing: true,
  });
},

cancelEditing: () => {
  set({
    editingMessageId: null,
    isEditing: false,
  });
},

updateMessage: (messageId: string, content: string) => {
  set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, content } : msg
    ),
    editingMessageId: null,
    isEditing: false,
  }));
},

removeMessagesAfter: (messageId: string) => {
  set((state) => {
    const messageIndex = state.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return state;

    return {
      messages: state.messages.slice(0, messageIndex + 1),
    };
  });
},
```

**Step 3.2**: Add useEditMessage hook to useChatApi
- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useChatApi.ts`
- Changes: Add mutation hook for editing messages

```typescript
interface EditMessageRequest {
  messageId: string;
  content: string;
  regenerate: boolean;
}

interface EditMessageResponse {
  message_id: string;
  content: string;
  messages_deleted: number;
}

/**
 * useEditMessage Hook
 *
 * Edits a user message with optional regeneration of subsequent messages
 */
export function useEditMessage() {
  const queryClient = useQueryClient();
  const { updateMessage, removeMessagesAfter, setError } = useChatStore();

  return useMutation({
    mutationFn: async ({ messageId, content, regenerate }: EditMessageRequest) => {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          regenerate,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to edit message' }));
        throw new Error(error.message || error.detail || 'Failed to edit message');
      }

      return response.json() as Promise<EditMessageResponse>;
    },
    onMutate: async ({ messageId, content, regenerate }: EditMessageRequest) => {
      // Optimistic update
      updateMessage(messageId, content);

      if (regenerate) {
        removeMessagesAfter(messageId);
      }

      return { messageId, content };
    },
    onSuccess: (data, variables) => {
      // Invalidate chat history to ensure consistency
      // Note: We need the sessionId here - may need to pass it in variables
      // queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });
    },
    onError: (error, _variables, context) => {
      console.error('Failed to edit message:', error);
      setError(error instanceof Error ? error.message : 'Failed to edit message');

      // Could implement rollback here if needed
    },
    retry: 1,
  });
}
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 4: Frontend UI Components

**Step 4.1**: Create EditableMessageBubble component
- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\EditableMessageBubble.tsx`
- Changes: New component that wraps MessageBubble with editing capability

```typescript
import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, RotateCcw } from 'lucide-react';
import { MessageBubble, type MessageBubbleProps } from './MessageBubble';
import { useChatStore } from './useChatStore';

interface EditableMessageBubbleProps extends MessageBubbleProps {
  onEdit: (content: string, regenerate: boolean) => void;
  onCancelEdit: () => void;
  isEditing: boolean;
}

export function EditableMessageBubble({
  message,
  onEdit,
  onCancelEdit,
  isEditing,
  showAvatar = true,
}: EditableMessageBubbleProps) {
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === 'user';

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editedContent.length,
        editedContent.length
      );
    }
  }, [isEditing]);

  // Reset edited content when message changes
  useEffect(() => {
    setEditedContent(message.content);
  }, [message.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editedContent, isEditing]);

  const handleSave = (regenerate: boolean) => {
    if (editedContent.trim() !== message.content) {
      onEdit(editedContent.trim(), regenerate);
    } else {
      onCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditedContent(message.content);
      onCancelEdit();
    }
    // Ctrl/Cmd + Enter to save without regeneration
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave(false);
    }
  };

  // Only show edit for user messages
  if (!isUser) {
    return <MessageBubble message={message} showAvatar={showAvatar} />;
  }

  if (isEditing) {
    return (
      <div className="px-6 py-2">
        <div className="flex justify-end">
          <div className="max-w-[80%] w-full">
            {/* Role label */}
            <div className="text-xs text-gray-500 mb-1 px-1 text-right">You</div>

            {/* Edit textarea */}
            <div className="bg-[#30714C] rounded-lg p-3">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  w-full bg-transparent text-white text-sm
                  resize-none outline-none
                  placeholder:text-white/50
                  min-h-[60px]
                "
                placeholder="Edit your message..."
              />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/20">
                <button
                  onClick={onCancelEdit}
                  className="
                    flex items-center gap-1 px-3 py-1.5
                    text-white/70 hover:text-white
                    text-sm transition-colors
                  "
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={!editedContent.trim()}
                  className="
                    flex items-center gap-1 px-3 py-1.5
                    bg-white/20 hover:bg-white/30 text-white
                    rounded text-sm transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Check size={14} />
                  Save
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!editedContent.trim()}
                  className="
                    flex items-center gap-1 px-3 py-1.5
                    bg-[#DDC66F] hover:bg-[#DDC66F]/90 text-[#061623]
                    rounded text-sm font-medium transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Save and regenerate response"
                >
                  <RotateCcw size={14} />
                  Save & Regenerate
                </button>
              </div>
            </div>

            {/* Helper text */}
            <div className="text-xs text-gray-400 mt-1 text-right">
              Esc to cancel, Ctrl+Enter to save
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal display mode with edit button on hover
  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageBubble message={message} showAvatar={showAvatar} />

      {/* Edit button - appears on hover for user messages */}
      {showActions && !message.isStreaming && (
        <button
          onClick={() => {
            const { startEditing } = useChatStore.getState();
            startEditing(message.id);
          }}
          className="
            absolute top-2 right-2
            p-1.5 rounded bg-gray-700/80 hover:bg-gray-600
            text-white/80 hover:text-white
            transition-all opacity-0 group-hover:opacity-100
          "
          aria-label="Edit message"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}

export default EditableMessageBubble;
```

**Step 4.2**: Update MessageList to use EditableMessageBubble
- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\MessageList.tsx`
- Changes: Import and use EditableMessageBubble for rendering messages

```typescript
// Add imports
import { EditableMessageBubble } from './EditableMessageBubble';
import { useChatStore } from './useChatStore';
import { useEditMessage } from './useChatApi';

// Update MessageListProps
export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  sessionId?: string;
  onLoadMore?: () => void;
  onRegenerateFromMessage?: (messageId: string, content: string) => void;
}

// Inside MessageList component, add:
const { editingMessageId, cancelEditing } = useChatStore();
const editMessage = useEditMessage();

// Update the itemContent render to use EditableMessageBubble:
itemContent={(index, message) => (
  <EditableMessageBubble
    message={message}
    showAvatar={shouldShowTimestamp(index)}
    isEditing={editingMessageId === message.id}
    onEdit={(content, regenerate) => {
      editMessage.mutate({
        messageId: message.id,
        content,
        regenerate,
      }, {
        onSuccess: () => {
          if (regenerate && onRegenerateFromMessage) {
            onRegenerateFromMessage(message.id, content);
          }
        }
      });
    }}
    onCancelEdit={cancelEditing}
  />
)}
```

**Step 4.3**: Update MessageBubble to expose edit trigger
- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\MessageBubble.tsx`
- Changes: Add edit button alongside copy button for user messages

```typescript
// Add to imports
import { Pencil } from 'lucide-react';

// Add to MessageBubbleProps
export interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onEditClick?: () => void;  // New prop
}

// In the MessageBubble component, add edit button near copy button:
{/* Action buttons - show on hover */}
{showCopyButton && !message.isStreaming && (
  <div className="absolute -top-8 right-0 flex items-center gap-1">
    {/* Edit button - only for user messages */}
    {isUser && onEditClick && (
      <button
        onClick={onEditClick}
        className="
          bg-gray-700 text-white px-2 py-1 rounded text-xs
          hover:bg-gray-600 transition-colors
          flex items-center gap-1
        "
        aria-label="Edit message"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    )}

    {/* Existing copy button */}
    <button
      onClick={handleCopy}
      className="..."
    >
      {/* ... existing copy button content ... */}
    </button>
  </div>
)}
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 5: Integration with Chat Flow

**Step 5.1**: Connect edit flow to message regeneration
- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\AppLayout.tsx` (or wherever chat is orchestrated)
- Changes: Handle regeneration callback from MessageList

```typescript
// In the component that manages chat:
const handleRegenerateFromMessage = async (messageId: string, content: string) => {
  // The edited message is now the last user message
  // Trigger a new stream/chat call with the updated content
  if (sessionId) {
    // Start streaming with the edited message content
    startStream(content);
    // OR use the chat API
    // sendMessage.mutate({ sessionId, content });
  }
};

// Pass to MessageList:
<MessageList
  messages={messages}
  sessionId={sessionId}
  onRegenerateFromMessage={handleRegenerateFromMessage}
/>
```

**Validation**: `cd client && npm run build && npm run lint`

---

## Acceptance Criteria

- [ ] Pencil icon appears on hover for user messages only
- [ ] Clicking edit transforms message bubble into textarea
- [ ] Textarea pre-populated with current message content
- [ ] Cancel button (X) or Escape key reverts to original content
- [ ] Save button updates message without regeneration
- [ ] Save & Regenerate button updates message AND triggers new AI response
- [ ] Subsequent messages are removed when regeneration is selected
- [ ] Edit mode disabled during AI streaming
- [ ] Keyboard shortcut Ctrl/Cmd+Enter saves without regeneration
- [ ] Loading state shown during API calls
- [ ] Error toast shown on failed edit
- [ ] Chat history properly updated in database

---

## Final Validation

```bash
# Run full stack validation
cd client && npm run build && npm run lint
cd ../server && npm run build && npm run lint
cd ../ai-service && python -m pytest tests/ -v
```

---

## Notes

### UX Considerations
- The "Save & Regenerate" option uses the wheat gold accent color (#DDC66F) to indicate this is a significant action
- Edit mode automatically focuses the textarea and places cursor at end
- The edit UI maintains the same visual style as the original message bubble
- Helper text shows keyboard shortcuts for power users

### Technical Considerations
- The regeneration flow requires coordination between edit completion and starting a new stream
- Optimistic updates are used for immediate UI feedback, with rollback on error
- The `removeMessagesAfter` action in the store handles local state cleanup for regeneration
- Consider adding a confirmation dialog for "Save & Regenerate" if many subsequent messages exist

### Future Enhancements
- Branch conversation history (fork from edited message)
- Version history for edited messages
- Undo capability for recent edits
- Diff view showing what changed in an edit
