/**
 * Default Keyboard Shortcuts
 *
 * Core keyboard shortcuts for the application.
 * These shortcuts are registered globally and handle common actions.
 */

import type { ShortcutRegistration } from './useKeyboardShortcuts';

export interface DefaultShortcutHandlers {
  /** Handler for sending a message (Enter key) */
  onSendMessage?: () => void;

  /** Handler for inserting newline (Shift+Enter) */
  onNewLine?: () => void;

  /** Handler for opening command palette (Cmd/Ctrl+K) */
  onOpenCommandPalette?: () => void;

  /** Handler for creating new application (Cmd/Ctrl+N) */
  onNewApplication?: () => void;

  /** Handler for toggling artifact panel (Cmd/Ctrl+\) */
  onToggleArtifactPanel?: () => void;

  /** Handler for escape key (close modal, stop generation) */
  onEscape?: () => void;

  /** Handler for focusing chat input (/) */
  onFocusChatInput?: () => void;
}

/**
 * Get default keyboard shortcuts with provided handlers
 *
 * @example
 * ```tsx
 * const shortcuts = getDefaultShortcuts({
 *   onOpenCommandPalette: () => setCommandPaletteOpen(true),
 *   onNewApplication: () => navigate('/applications/new'),
 *   onEscape: () => closeModal()
 * });
 *
 * useKeyboardShortcuts(shortcuts);
 * ```
 */
export function getDefaultShortcuts(handlers: DefaultShortcutHandlers): ShortcutRegistration[] {
  const shortcuts: ShortcutRegistration[] = [];

  // Enter: Send message (only in chat input, handled by component)
  if (handlers.onSendMessage) {
    shortcuts.push({
      id: 'shortcut.send-message',
      shortcut: {
        key: 'Enter',
        handler: handlers.onSendMessage,
        allowInInputs: true, // This will be handled specifically in the chat input component
        description: 'Send message'
      }
    });
  }

  // Shift+Enter: New line in chat input
  if (handlers.onNewLine) {
    shortcuts.push({
      id: 'shortcut.new-line',
      shortcut: {
        key: 'Enter',
        shift: true,
        handler: handlers.onNewLine,
        allowInInputs: true,
        description: 'Insert new line'
      }
    });
  }

  // Cmd/Ctrl+K: Open command palette
  if (handlers.onOpenCommandPalette) {
    shortcuts.push({
      id: 'shortcut.command-palette',
      shortcut: {
        key: 'k',
        ctrl: true, // This will be normalized to Cmd on Mac
        handler: handlers.onOpenCommandPalette,
        allowInInputs: false,
        description: 'Open command palette'
      }
    });
  }

  // Cmd/Ctrl+N: New application
  if (handlers.onNewApplication) {
    shortcuts.push({
      id: 'shortcut.new-application',
      shortcut: {
        key: 'n',
        ctrl: true,
        handler: handlers.onNewApplication,
        allowInInputs: false,
        description: 'Create new application'
      }
    });
  }

  // Cmd/Ctrl+\: Toggle artifact panel
  if (handlers.onToggleArtifactPanel) {
    shortcuts.push({
      id: 'shortcut.toggle-artifact-panel',
      shortcut: {
        key: '\\',
        ctrl: true,
        handler: handlers.onToggleArtifactPanel,
        allowInInputs: false,
        description: 'Toggle artifact panel'
      }
    });
  }

  // Escape: Close modal / stop generation
  if (handlers.onEscape) {
    shortcuts.push({
      id: 'shortcut.escape',
      shortcut: {
        key: 'Escape',
        handler: handlers.onEscape,
        allowInInputs: true, // Allow in inputs to close autocomplete, etc.
        description: 'Close modal or stop generation'
      }
    });
  }

  // /: Focus chat input
  if (handlers.onFocusChatInput) {
    shortcuts.push({
      id: 'shortcut.focus-chat',
      shortcut: {
        key: '/',
        handler: handlers.onFocusChatInput,
        allowInInputs: false, // Don't trigger if already typing
        description: 'Focus chat input'
      }
    });
  }

  return shortcuts;
}

/**
 * Shortcut display strings for help/documentation
 */
export const SHORTCUT_LABELS = {
  SEND_MESSAGE: 'Enter',
  NEW_LINE: 'Shift+Enter',
  COMMAND_PALETTE: '⌘K / Ctrl+K',
  NEW_APPLICATION: '⌘N / Ctrl+N',
  TOGGLE_ARTIFACT: '⌘\\ / Ctrl+\\',
  ESCAPE: 'Esc',
  FOCUS_CHAT: '/'
} as const;

/**
 * Shortcut categories for help display
 */
export const SHORTCUT_CATEGORIES = {
  CHAT: {
    name: 'Chat',
    shortcuts: [
      { key: SHORTCUT_LABELS.ESCAPE, description: 'Stop AI response generation' },
      { key: SHORTCUT_LABELS.SEND_MESSAGE, description: 'Send message' },
      { key: SHORTCUT_LABELS.NEW_LINE, description: 'New line in message' },
    ]
  },
  MESSAGING: {
    name: 'Messaging',
    shortcuts: [
      { key: SHORTCUT_LABELS.SEND_MESSAGE, description: 'Send message' },
      { key: SHORTCUT_LABELS.NEW_LINE, description: 'New line in message' },
      { key: SHORTCUT_LABELS.FOCUS_CHAT, description: 'Focus chat input' }
    ]
  },
  NAVIGATION: {
    name: 'Navigation',
    shortcuts: [
      { key: SHORTCUT_LABELS.COMMAND_PALETTE, description: 'Open command palette' },
      { key: SHORTCUT_LABELS.NEW_APPLICATION, description: 'Create new application' }
    ]
  },
  INTERFACE: {
    name: 'Interface',
    shortcuts: [
      { key: SHORTCUT_LABELS.TOGGLE_ARTIFACT, description: 'Toggle artifact panel' },
      { key: SHORTCUT_LABELS.ESCAPE, description: 'Close modal or stop' }
    ]
  }
} as const;
