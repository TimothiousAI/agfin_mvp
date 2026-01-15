/**
 * Navigation Keyboard Shortcuts
 *
 * Shortcuts for navigating between documents, modules, and forms.
 * These shortcuts respect context and availability.
 */

import type { ShortcutRegistration } from './useKeyboardShortcuts';

export interface NavigationShortcutHandlers {
  /** Handler for navigating to next document/module (Cmd/Ctrl+]) */
  onNext?: () => void;

  /** Handler for navigating to previous document/module (Cmd/Ctrl+[) */
  onPrevious?: () => void;

  /** Handler for jumping to specific module (Cmd/Ctrl+1-5) */
  onJumpToModule?: (moduleNumber: number) => void;

  /** Handler for saving current form (Cmd/Ctrl+S) */
  onSave?: () => void;

  /** Function to check if navigation is available in current context */
  isNavigationAvailable?: () => boolean;

  /** Function to check if save is available in current context */
  isSaveAvailable?: () => boolean;
}

/**
 * Get navigation keyboard shortcuts with provided handlers
 *
 * @example
 * ```tsx
 * const shortcuts = getNavigationShortcuts({
 *   onNext: () => navigateToNextDocument(),
 *   onPrevious: () => navigateToPreviousDocument(),
 *   onJumpToModule: (num) => jumpToModule(num),
 *   onSave: () => saveForm(),
 *   isNavigationAvailable: () => currentDocument !== null,
 *   isSaveAvailable: () => hasUnsavedChanges
 * });
 *
 * useKeyboardShortcuts(shortcuts);
 * ```
 */
export function getNavigationShortcuts(handlers: NavigationShortcutHandlers): ShortcutRegistration[] {
  const shortcuts: ShortcutRegistration[] = [];

  // Cmd/Ctrl+]: Next document/module
  if (handlers.onNext) {
    shortcuts.push({
      id: 'nav.next',
      shortcut: {
        key: ']',
        ctrl: true,
        handler: (event) => {
          // Check availability before executing
          if (handlers.isNavigationAvailable && !handlers.isNavigationAvailable()) {
            return;
          }
          handlers.onNext!();
        },
        allowInInputs: false,
        description: 'Navigate to next document or module'
      }
    });
  }

  // Cmd/Ctrl+[: Previous document/module
  if (handlers.onPrevious) {
    shortcuts.push({
      id: 'nav.previous',
      shortcut: {
        key: '[',
        ctrl: true,
        handler: (event) => {
          // Check availability before executing
          if (handlers.isNavigationAvailable && !handlers.isNavigationAvailable()) {
            return;
          }
          handlers.onPrevious!();
        },
        allowInInputs: false,
        description: 'Navigate to previous document or module'
      }
    });
  }

  // Cmd/Ctrl+1-5: Jump to module 1-5
  if (handlers.onJumpToModule) {
    for (let i = 1; i <= 5; i++) {
      shortcuts.push({
        id: `nav.module-${i}`,
        shortcut: {
          key: i.toString(),
          ctrl: true,
          handler: (event) => {
            // Check availability before executing
            if (handlers.isNavigationAvailable && !handlers.isNavigationAvailable()) {
              return;
            }
            handlers.onJumpToModule!(i);
          },
          allowInInputs: false,
          description: `Jump to module ${i}`
        }
      });
    }
  }

  // Cmd/Ctrl+S: Save current form
  if (handlers.onSave) {
    shortcuts.push({
      id: 'nav.save',
      shortcut: {
        key: 's',
        ctrl: true,
        handler: (event) => {
          // Check if save is available
          if (handlers.isSaveAvailable && !handlers.isSaveAvailable()) {
            return;
          }
          handlers.onSave!();
        },
        allowInInputs: false, // Don't trigger while typing
        description: 'Save current form'
      }
    });
  }

  return shortcuts;
}

/**
 * Navigation shortcut display strings for help/documentation
 */
export const NAVIGATION_SHORTCUT_LABELS = {
  NEXT: '⌘] / Ctrl+]',
  PREVIOUS: '⌘[ / Ctrl+[',
  MODULE_1: '⌘1 / Ctrl+1',
  MODULE_2: '⌘2 / Ctrl+2',
  MODULE_3: '⌘3 / Ctrl+3',
  MODULE_4: '⌘4 / Ctrl+4',
  MODULE_5: '⌘5 / Ctrl+5',
  SAVE: '⌘S / Ctrl+S'
} as const;

/**
 * Navigation shortcuts organized by category for help display
 */
export const NAVIGATION_CATEGORIES = {
  DOCUMENT_NAVIGATION: {
    name: 'Document Navigation',
    shortcuts: [
      { key: NAVIGATION_SHORTCUT_LABELS.NEXT, description: 'Next document or module' },
      { key: NAVIGATION_SHORTCUT_LABELS.PREVIOUS, description: 'Previous document or module' }
    ]
  },
  MODULE_JUMPING: {
    name: 'Module Navigation',
    shortcuts: [
      { key: NAVIGATION_SHORTCUT_LABELS.MODULE_1, description: 'Jump to module 1' },
      { key: NAVIGATION_SHORTCUT_LABELS.MODULE_2, description: 'Jump to module 2' },
      { key: NAVIGATION_SHORTCUT_LABELS.MODULE_3, description: 'Jump to module 3' },
      { key: NAVIGATION_SHORTCUT_LABELS.MODULE_4, description: 'Jump to module 4' },
      { key: NAVIGATION_SHORTCUT_LABELS.MODULE_5, description: 'Jump to module 5' }
    ]
  },
  FORM_ACTIONS: {
    name: 'Form Actions',
    shortcuts: [
      { key: NAVIGATION_SHORTCUT_LABELS.SAVE, description: 'Save current form' }
    ]
  }
} as const;

/**
 * Helper to check if a module number is valid (1-5)
 */
export function isValidModuleNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 5;
}

/**
 * Helper to format module shortcut for display
 */
export function formatModuleShortcut(moduleNumber: number): string {
  if (!isValidModuleNumber(moduleNumber)) {
    return '';
  }
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  return isMac ? `⌘${moduleNumber}` : `Ctrl+${moduleNumber}`;
}
