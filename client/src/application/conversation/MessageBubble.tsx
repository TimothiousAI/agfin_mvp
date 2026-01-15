import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../../../shared/types/database';
import 'highlight.js/styles/github-dark.css';

/**
 * MessageBubble Component
 *
 * Renders individual chat messages with:
 * - User message: right-aligned, green (#30714C)
 * - Assistant message: left-aligned, dark (#0D2233)
 * - Markdown rendering support
 * - Code block syntax highlighting
 * - Copy message button
 * - Timestamp on hover
 */

type DbMessage = Database['public']['Tables']['agfin_ai_bot_messages']['Row'];

export interface Message extends DbMessage {
  isStreaming?: boolean;
}

export interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const timestamp = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => {
        setShowCopyButton(false);
        setCopied(false);
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isUser ? 'bg-[#30714C] text-white' : 'bg-[#0D2233] text-white'}
          `}
        >
          {isUser ? 'U' : 'A'}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Role label */}
        <div className="text-xs text-gray-500 mb-1 px-1">
          {isUser ? 'You' : 'AgFin Assistant'}
        </div>

        {/* Bubble */}
        <div
          className={`
            rounded-lg px-4 py-3 relative group
            ${isUser
              ? 'bg-[#30714C] text-white ml-auto'
              : 'bg-[#0D2233] text-white mr-auto'
            }
          `}
        >
          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Customize markdown rendering
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code
                        className="bg-black/20 px-1.5 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative my-2">
                      <pre className="bg-black/30 rounded p-3 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-white/30 pl-3 my-2 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          )}

          {/* Copy button - shows on hover */}
          {showCopyButton && !message.isStreaming && (
            <button
              onClick={handleCopy}
              className="
                absolute -top-8 right-0
                bg-gray-700 text-white px-2 py-1 rounded text-xs
                hover:bg-gray-600 transition-colors
                flex items-center gap-1
              "
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {/* Timestamp - shows on hover */}
        {showCopyButton && (
          <div className="text-xs text-gray-400 mt-1 px-1">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
