/**
 * TypingIndicator Component
 *
 * Displays a pulsing dot animation while the AI assistant is typing.
 * - 3 pulsing dots in assistant bubble style
 * - Animation: 1.2s loop, 200ms stagger between dots
 * - Appears during AI response
 * - Smooth fade in/out
 * - Accessible (aria-label)
 */

export interface TypingIndicatorProps {
  /** Whether to show the typing indicator */
  isTyping?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

export function TypingIndicator({ isTyping = true, className = '' }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in ${className}`}
      role="status"
      aria-label="AI assistant is typing"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-[#0D2233] text-white">
        A
      </div>

      {/* Typing bubble */}
      <div className="flex flex-col items-start">
        {/* Role label */}
        <div className="text-xs text-gray-500 mb-1 px-1">AgFin Assistant</div>

        {/* Bubble with dots */}
        <div className="bg-[#0D2233] text-white rounded-lg px-4 py-3 flex items-center gap-1">
          <span className="sr-only">AI assistant is typing</span>
          <div
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{
              animationDuration: '1.2s',
              animationDelay: '0s',
            }}
          />
          <div
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{
              animationDuration: '1.2s',
              animationDelay: '0.2s',
            }}
          />
          <div
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{
              animationDuration: '1.2s',
              animationDelay: '0.4s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
