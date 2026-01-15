/**
 * Command System Exports
 */

export * from './registry';
export * from './default-commands';
export * from './useKeyboardShortcuts';
export * from './defaultShortcuts';
export * from './navigationShortcuts';

// Export search types and helpers (but not searchCommands function to avoid conflict)
export type { SearchResult, SearchMatch } from './search';
export { highlightMatches, getHighlightRanges } from './search';
