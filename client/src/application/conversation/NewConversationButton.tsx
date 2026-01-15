import { Plus } from 'lucide-react';

/**
 * New Conversation Button Component
 * Prominent button for creating a new conversation session
 */

export interface NewConversationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function NewConversationButton({
  onClick,
  disabled = false,
  className = '',
}: NewConversationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3
        bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        disabled:bg-gray-400 disabled:cursor-not-allowed
        text-white text-sm font-medium
        rounded-lg
        transition-colors duration-150
        flex items-center justify-center gap-2
        shadow-sm hover:shadow
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label="Start new conversation"
    >
      <Plus className="w-4 h-4" strokeWidth={2.5} />
      <span>New Conversation</span>
    </button>
  );
}

/**
 * Compact version for use in headers or tight spaces
 */
export function NewConversationButtonCompact({
  onClick,
  disabled = false,
  className = '',
}: NewConversationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2
        bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        disabled:bg-gray-400 disabled:cursor-not-allowed
        text-white
        rounded-md
        transition-colors duration-150
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label="Start new conversation"
      title="New Conversation"
    >
      <Plus className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}

export default NewConversationButton;
