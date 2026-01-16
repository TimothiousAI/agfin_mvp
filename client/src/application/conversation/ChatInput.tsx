import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { StopGenerationButton } from './StopGenerationButton';

/**
 * ChatInput Component
 *
 * Message input with:
 * - Auto-resize textarea (min 1 row, max 6 rows)
 * - Send button (disabled when empty)
 * - Enter to send, Shift+Enter for newline
 * - Character count (optional)
 * - Placeholder text
 * - Bottom-anchored positioning
 * - Focus on mount
 */

export interface ChatInputProps {
  onSend: (message: string) => void;
  /** Callback to stop generation */
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Whether the AI is currently streaming a response */
  isStreaming?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

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
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height
    const lineHeight = 24; // Approximate line height in pixels
    const minRows = 1;
    const maxRows = 6;
    const paddingHeight = 16; // Padding top + bottom

    const scrollHeight = textarea.scrollHeight;
    const minHeight = lineHeight * minRows + paddingHeight;
    const maxHeight = lineHeight * maxRows + paddingHeight;

    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [message]);

  // Focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter adds newline (default behavior)
  };

  const isEmpty = message.trim().length === 0;
  const isOverLimit = maxLength !== undefined && message.length > maxLength;

  return (
    <div className="border-t border-gray-200 bg-white p-4" data-tour="chat-input">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className="
                w-full px-4 py-3 pr-12
                border border-gray-300 rounded-lg
                resize-none overflow-y-auto
                focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                placeholder:text-gray-400
              "
              style={{
                minHeight: '48px',
                maxHeight: '168px', // 6 rows
                lineHeight: '24px',
              }}
            />

            {/* Character count */}
            {showCharacterCount && maxLength && (
              <div
                className={`
                  absolute bottom-2 right-2 text-xs
                  ${isOverLimit ? 'text-red-500' : 'text-gray-400'}
                `}
              >
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send or Stop button */}
          {isStreaming && onStop ? (
            <StopGenerationButton onStop={onStop} />
          ) : (
            <button
              onClick={handleSubmit}
              disabled={disabled || isEmpty || isStreaming}
              className="
                px-6 py-3 rounded-lg font-medium
                bg-[#30714C] text-white
                hover:bg-[#265a3d] active:bg-[#1e4730]
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
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isStreaming ? (
            <>
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Escape</kbd> to stop generation
            </>
          ) : (
            <>
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> to send,{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Shift</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> for new line
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
