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
        handler: () => {
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
