import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, RotateCcw } from 'lucide-react';
import { MessageBubble, type MessageBubbleProps } from './MessageBubble';
import { useChatStore } from './useChatStore';

/**
 * EditableMessageBubble Component
 *
 * Wraps MessageBubble with editing capability for user messages.
 * Features:
 * - Pencil icon appears on hover for user messages
 * - Transforms message into editable textarea when editing
 * - Save and Cancel buttons with keyboard shortcuts
 * - Save & Regenerate option to resend the message
 */

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
  }, [isEditing, editedContent.length]);

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
