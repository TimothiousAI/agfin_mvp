/**
 * Keyboard Shortcut System
 *
 * Global keyboard event listener with support for:
 * - Shortcut registration/deregistration
 * - Modifier keys (Cmd, Ctrl, Shift, Alt)
 * - Mac/Windows key normalization
 * - Input field prevention (configurable)
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  /** If true, shortcut works even when typing in input fields */
  allowInInputs?: boolean;
  /** Custom handler for this specific shortcut */
  handler: (event: KeyboardEvent) => void;
  /** Description for help/documentation */
  description?: string;
}

export interface ShortcutRegistration {
  id: string;
  shortcut: KeyboardShortcut;
}

/**
 * Check if the target element is an input field where we should ignore shortcuts
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Normalize modifier keys for cross-platform compatibility
 * On Mac: Cmd (Meta) is primary, Ctrl is secondary
 * On Windows/Linux: Ctrl is primary, Meta (Win key) is secondary
 */
function normalizeEvent(event: KeyboardEvent): {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
} {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  return {
    key: event.key,
    // On Mac, treat Cmd as Ctrl for cross-platform shortcuts
    ctrl: isMac ? event.metaKey : event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    // Preserve actual meta key state
    meta: event.metaKey
  };
}

/**
 * Check if keyboard event matches a shortcut definition
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const normalized = normalizeEvent(event);

  // Key must match (case-insensitive)
  if (normalized.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers - all must match exactly
  if (!!shortcut.ctrl !== normalized.ctrl) return false;
  if (!!shortcut.alt !== normalized.alt) return false;
  if (!!shortcut.shift !== normalized.shift) return false;
  if (!!shortcut.meta !== normalized.meta) return false;

  return true;
}

/**
 * Generate a unique key for a shortcut (for internal mapping)
 */
export function getShortcutKey(shortcut: Omit<KeyboardShortcut, 'handler' | 'allowInInputs' | 'description'>): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Meta');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

/**
 * Format shortcut for display (platform-aware)
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler' | 'allowInInputs' | 'description'>): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.meta && !isMac) parts.push('Win');

  // Format key
  const key = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key;
  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

/**
 * React hook for keyboard shortcut management
 *
 * @example
 * ```tsx
 * const shortcuts: ShortcutRegistration[] = [
 *   {
 *     id: 'save',
 *     shortcut: {
 *       key: 's',
 *       ctrl: true,
 *       handler: () => console.log('Save!'),
 *       description: 'Save current document'
 *     }
 *   },
 *   {
 *     id: 'search',
 *     shortcut: {
 *       key: 'k',
 *       ctrl: true,
 *       allowInInputs: false,
 *       handler: () => openSearch(),
 *       description: 'Open search'
 *     }
 *   }
 * ];
 *
 * useKeyboardShortcuts(shortcuts);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutRegistration[],
  options?: {
    /** If true, all shortcuts are disabled */
    disabled?: boolean;
  }
) {
  const shortcutsRef = useRef(shortcuts);
  const disabledRef = useRef(options?.disabled ?? false);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    disabledRef.current = options?.disabled ?? false;
  }, [options?.disabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // If disabled, don't process any shortcuts
    if (disabledRef.current) return;

    const shortcuts = shortcutsRef.current;

    // Check if we're in an input field
    const inInputField = isInputElement(event.target);

    // Find matching shortcut
    for (const registration of shortcuts) {
      const { shortcut } = registration;

      // Skip if in input field and shortcut doesn't allow it
      if (inInputField && !shortcut.allowInInputs) continue;

      // Check if event matches this shortcut
      if (matchesShortcut(event, shortcut)) {
        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Execute handler
        try {
          shortcut.handler(event);
        } catch (error) {
          console.error(`Error executing shortcut handler for "${registration.id}":`, error);
        }

        // Only handle first matching shortcut
        break;
      }
    }
  }, []);

  useEffect(() => {
    // Register global keydown listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      // Cleanup on unmount
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
}

/**
 * Hook for registering a single keyboard shortcut
 *
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   handler: () => openCommandPalette()
 * });
 * ```
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  options?: {
    disabled?: boolean;
  }
) {
  useKeyboardShortcuts(
    [{ id: 'single-shortcut', shortcut }],
    options
  );
}

/**
 * Check if current platform is Mac
 */
export function isMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
}

/**
 * Get the primary modifier key for the current platform
 * Returns 'meta' on Mac, 'ctrl' on Windows/Linux
 */
export function getPrimaryModifier(): 'meta' | 'ctrl' {
  return isMacPlatform() ? 'meta' : 'ctrl';
}
