import { Send, Paperclip } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatCenterProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  applicationContext?: string;
  isLoading?: boolean;
}

export function ChatCenter({
  messages = [],
  onSendMessage,
  applicationContext,
  isLoading = false,
}: ChatCenterProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          {isLoading && (
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-3xl rounded-lg px-4 py-3
                      ${
                        message.role === 'user'
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
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
          </div>

          {/* Helper Text */}
          <p className="text-white/40 text-xs mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
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
