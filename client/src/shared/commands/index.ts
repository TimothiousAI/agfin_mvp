/**
 * Commands Module Index
 *
 * Exports all command-related utilities for the application.
 */

// Provider and hooks
export { CommandPaletteProvider, useCommandPalette } from './CommandPaletteProvider';
export { useCommandRegistration } from './useCommandRegistration';

// Command generators
export { getDocumentCommands, DOCUMENT_CONFIGS, type DocumentType } from './document-commands';
export { getModuleCommands, MODULE_CONFIGS } from './module-commands';
export { getApplicationCommands } from './application-commands';
export { getSearchCommands } from './search-commands';
export { getActionCommands } from './action-commands';

// Registry (for advanced use cases)
export * from './registry';

// Default commands (legacy)
export * from './default-commands';

// Keyboard shortcuts
export * from './useKeyboardShortcuts';
export * from './defaultShortcuts';
export * from './navigationShortcuts';

// Search utilities
export type { SearchResult, SearchMatch } from './search';
export { searchCommands, highlightMatches, getHighlightRanges } from './search';
