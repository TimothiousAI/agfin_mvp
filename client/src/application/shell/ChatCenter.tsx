import { Send, Paperclip, Square, RefreshCw, Pencil, Check, X, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAutoTitle } from '../conversation/useAutoTitle';
import { useChatStore } from '../conversation/useChatStore';
import { useEditMessage } from '../conversation/useChatApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatCenterProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  /** Callback to stop generation */
  onStopGeneration?: () => void;
  /** Callback to regenerate a response */
  onRegenerate?: (messageId: string) => void;
  /** Callback when message is edited and regeneration is requested */
  onRegenerateFromMessage?: (messageId: string, content: string) => void;
  applicationContext?: string;
  isLoading?: boolean;
  /** Whether the AI is currently streaming a response */
  isStreaming?: boolean;
  /** Whether regenerate is available */
  canRegenerate?: boolean;
  /** Whether a regeneration is in progress */
  isRegenerating?: boolean;
  /** Current session ID for auto-title generation */
  sessionId?: string | null;
}

export function ChatCenter({
  messages = [],
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onRegenerateFromMessage,
  applicationContext,
  isLoading = false,
  isStreaming = false,
  canRegenerate = true,
  isRegenerating = false,
  sessionId = null,
}: ChatCenterProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Editing state and actions from store
  const { editingMessageId, startEditing, cancelEditing } = useChatStore();
  const editMessage = useEditMessage();

  // Auto-generate session title after first exchange
  useAutoTitle(sessionId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#061623] min-w-0">
      {/* Header Bar with Application Context */}
      <header className="h-14 bg-[#0D2233] border-b border-[#061623] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-medium">
            {applicationContext || 'AgFin Assistant'}
          </h2>
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
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholder for future actions */}
        </div>
      </header>

      {/* Message List Container - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-[#30714C] rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Welcome to AgFin Assistant
              </h3>
              <p className="text-white/60 text-sm max-w-md">
                I'm here to help with farm loans, equipment financing, and agricultural questions.
                Start a conversation below!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastAssistant = message.role === 'assistant' &&
                                        index === messages.length - 1;
                const showRegenerate = isLastAssistant &&
                                       !message.isStreaming &&
                                       canRegenerate &&
                                       onRegenerate;
                const isEditingThis = editingMessageId === message.id;
                const isUserMessage = message.role === 'user';

                return (
                  <MessageBubbleWithEdit
                    key={message.id}
                    message={message}
                    isEditing={isEditingThis}
                    isUserMessage={isUserMessage}
                    showRegenerate={!!showRegenerate}
                    isRegenerating={isRegenerating}
                    isStreaming={isStreaming}
                    onStartEdit={() => startEditing(message.id)}
                    onCancelEdit={cancelEditing}
                    onEdit={(content, regenerate) => {
                      editMessage.mutate(
                        {
                          messageId: message.id,
                          content,
                          regenerate,
                        },
                        {
                          onSuccess: () => {
                            if (regenerate && onRegenerateFromMessage) {
                              onRegenerateFromMessage(message.id, content);
                            }
                          },
                        }
                      );
                    }}
                    onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Chat Input - Anchored at Bottom */}
      <div className="flex-shrink-0 border-t border-[#0D2233] bg-[#061623] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              className="flex-shrink-0 p-2 text-white/60 hover:text-white hover:bg-[#0D2233] rounded-lg transition-colors"
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about farm financing..."
                aria-label="Message input"
                className="
                  w-full px-4 py-3 pr-12
                  bg-[#0D2233] text-white placeholder-white/40
                  border border-[#0D2233] focus:border-[#30714C] focus:outline-none
                  rounded-lg resize-none
                  min-h-[48px] max-h-[200px]
                "
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '48px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
            </div>

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
          </div>

          {/* Helper Text */}
          <p className="text-white/40 text-xs mt-2 text-center">
            {isStreaming
              ? 'Press Escape to stop generation'
              : 'Press Enter to send, Shift+Enter for new line'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to format message time
function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Message bubble component with inline editing support
interface MessageBubbleWithEditProps {
  message: Message;
  isEditing: boolean;
  isUserMessage: boolean;
  showRegenerate: boolean;
  isRegenerating: boolean;
  isStreaming: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEdit: (content: string, regenerate: boolean) => void;
  onRegenerate?: () => void;
}

function MessageBubbleWithEdit({
  message,
  isEditing,
  isUserMessage,
  showRegenerate,
  isRegenerating,
  isStreaming,
  onStartEdit,
  onCancelEdit,
  onEdit,
  onRegenerate,
}: MessageBubbleWithEditProps) {
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Editing mode for user messages
  if (isUserMessage && isEditing) {
    return (
      <div className="flex justify-end">
        <div className="max-w-3xl w-full">
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
    );
  }

  // Normal display mode
  return (
    <div
      className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} relative group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`
          max-w-3xl rounded-lg px-4 py-3 relative
          ${
            isUserMessage
              ? 'bg-[#30714C] text-white'
              : 'bg-[#0D2233] text-white'
          }
        `}
      >
        <div className="flex items-start gap-2">
          {message.role === 'assistant' && (
            <div className="w-6 h-6 bg-[#30714C] rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <p className="text-xs opacity-60 mt-2">
              {formatMessageTime(message.timestamp)}
            </p>

            {/* Streaming indicator */}
            {message.isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              </div>
            )}

            {/* Regenerate button for last assistant message */}
            {showRegenerate && onRegenerate && (
              <button
                onClick={onRegenerate}
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
        </div>

        {/* Edit button for user messages - appears on hover */}
        {isUserMessage && showActions && !message.isStreaming && (
          <button
            onClick={onStartEdit}
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
    </div>
  );
}
