import { useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { formatDistanceToNow } from 'date-fns';
import { Pencil } from 'lucide-react';
import type { Database } from '../../../../shared/types/database';
import { RegenerateButton } from './RegenerateButton';
import { useChatStore } from './useChatStore';
import { useEditMessage } from './useChatApi';
import { EditableMessageBubble } from './EditableMessageBubble';

/**
 * MessageList Component
 *
 * Scrollable message container with:
 * - Virtual scrolling for performance (react-virtuoso)
 * - Auto-scroll to bottom on new messages
 * - Scroll-to-bottom button when scrolled up
 * - Message grouping by sender
 * - Timestamp display between groups
 * - Loading skeleton for history
 */

type DbMessage = Database['public']['Tables']['agfin_ai_bot_messages']['Row'];

export interface Message extends DbMessage {
  // Additional UI-only fields can be added here
  isStreaming?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  sessionId?: string;
  onLoadMore?: () => void;
  /** Callback when regenerate is requested */
  onRegenerate?: (messageId: string) => void;
  /** Whether a regeneration is in progress */
  isRegenerating?: boolean;
  /** Whether regenerate functionality is available */
  canRegenerate?: boolean;
  /** Callback when message is edited and regeneration is requested */
  onRegenerateFromMessage?: (messageId: string, content: string) => void;
}

export function MessageList({
  messages,
  isLoading = false,
  sessionId,
  onLoadMore,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  onRegenerateFromMessage,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const previousMessageCount = useRef(messages.length);

  // Editing state from store
  const { editingMessageId, cancelEditing } = useChatStore();
  const editMessage = useEditMessage();

  // Auto-scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (messages.length > previousMessageCount.current && isNearBottom) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, isNearBottom]);

  // Scroll to bottom on mount
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'auto',
      });
    }
  }, [sessionId]); // Only on session change

  const handleAtBottomStateChange = (atBottom: boolean) => {
    setIsNearBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    virtuosoRef.current?.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
    });
  };

  // Group messages by sender for visual separation
  const shouldShowTimestamp = (currentIndex: number): boolean => {
    if (currentIndex === 0) return true;

    const current = messages[currentIndex];
    const previous = messages[currentIndex - 1];

    // Show timestamp if sender changed
    if (current.role !== previous.role) return true;

    // Show timestamp if more than 5 minutes apart
    const currentTime = new Date(current.created_at).getTime();
    const previousTime = new Date(previous.created_at).getTime();
    const diffMinutes = (currentTime - previousTime) / 1000 / 60;

    return diffMinutes > 5;
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">No messages yet</p>
          <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        atBottomStateChange={handleAtBottomStateChange}
        followOutput="smooth"
        initialTopMostItemIndex={messages.length - 1}
        startReached={onLoadMore}
        components={{
          Header: isLoading ? LoadingSkeleton : undefined,
        }}
        itemContent={(index, message) => {
          const isLastAssistant =
            message.role === 'assistant' &&
            index === messages.length - 1;
          const isEditingThis = editingMessageId === message.id;

          return (
            <MessageItem
              message={message}
              showTimestamp={shouldShowTimestamp(index)}
              isLastAssistantMessage={isLastAssistant}
              onRegenerate={isLastAssistant ? () => onRegenerate?.(message.id) : undefined}
              isRegenerating={isRegenerating}
              canRegenerate={canRegenerate}
              isEditing={isEditingThis}
              onStartEdit={() => useChatStore.getState().startEditing(message.id)}
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
              onCancelEdit={cancelEditing}
            />
          );
        }}
        style={{ height: '100%' }}
      />

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="
            absolute bottom-4 right-4
            bg-white shadow-lg rounded-full p-3
            hover:bg-gray-50 transition-colors
            border border-gray-200
            z-10
          "
          aria-label="Scroll to bottom"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  showTimestamp: boolean;
  /** Whether this is the last assistant message */
  isLastAssistantMessage?: boolean;
  /** Callback to regenerate this message */
  onRegenerate?: () => void;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
  /** Whether regenerate is available */
  canRegenerate?: boolean;
  /** Whether this message is being edited */
  isEditing?: boolean;
  /** Callback when edit is triggered */
  onStartEdit?: () => void;
  /** Callback when edit is completed */
  onEdit?: (content: string, regenerate: boolean) => void;
  /** Callback when edit is cancelled */
  onCancelEdit?: () => void;
}

function MessageItem({
  message,
  showTimestamp,
  isLastAssistantMessage = false,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  isEditing = false,
  onStartEdit,
  onEdit,
  onCancelEdit,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const timestamp = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  });

  // Show regenerate button on last assistant message when not streaming
  const showRegenerate = isAssistant &&
                         isLastAssistantMessage &&
                         !message.isStreaming &&
                         canRegenerate &&
                         onRegenerate;

  // Use EditableMessageBubble for user messages
  if (isUser && onEdit && onCancelEdit) {
    return (
      <div className="py-2">
        {/* Timestamp separator */}
        {showTimestamp && (
          <div className="flex items-center justify-center my-4">
            <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {timestamp}
            </div>
          </div>
        )}

        <EditableMessageBubble
          message={message}
          showAvatar={true}
          isEditing={isEditing}
          onEdit={onEdit}
          onCancelEdit={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div
      className="px-6 py-2"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Timestamp separator */}
      {showTimestamp && (
        <div className="flex items-center justify-center my-4">
          <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {timestamp}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} relative group`}>
        <div
          className={`
            max-w-[80%] rounded-lg px-4 py-3
            ${isUser
              ? 'bg-[#30714C] text-white ml-auto'
              : 'bg-[#0D2233] text-white mr-auto'
            }
          `}
        >
          {/* Role label */}
          <div className="text-xs opacity-70 mb-1">
            {isUser ? 'You' : 'AgFin Assistant'}
          </div>

          {/* Content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-200" />
            </div>
          )}

          {/* Regenerate button for last assistant message */}
          {showRegenerate && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
              <RegenerateButton
                onRegenerate={onRegenerate}
                loading={isRegenerating}
                disabled={isRegenerating}
              />
            </div>
          )}
        </div>

        {/* Edit button for user messages - appears on hover */}
        {isUser && showActions && !message.isStreaming && onStartEdit && (
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

function LoadingSkeleton() {
  return (
    <div className="px-6 py-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 animate-pulse"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;
