import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Session Search Component
 * Provides search/filter functionality for conversation sessions
 * Features debounced input (300ms) and clear button
 */

export interface SessionSearchProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SessionSearch({
  onSearchChange,
  placeholder = 'Search conversations...',
  className = '',
}: SessionSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Notify parent of search changes
  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedValue('');
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="
          block w-full pl-10 pr-10 py-2
          text-sm
          border border-gray-300 rounded-md
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          placeholder-gray-400
          transition-colors
        "
        aria-label="Search conversations"
      />

      {/* Clear Button */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 pr-3
            flex items-center
            text-gray-400 hover:text-gray-600
            transition-colors
          "
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Hook to filter sessions based on search query
 * Searches in session title and first message
 */
export function useSessionFilter<T extends { title?: string; first_message?: string }>(
  sessions: T[],
  searchQuery: string
): T[] {
  return sessions.filter((session) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const title = session.title?.toLowerCase() || '';
    const firstMessage = session.first_message?.toLowerCase() || '';

    return title.includes(query) || firstMessage.includes(query);
  });
}

/**
 * Empty Search Results Component
 */
export function EmptySearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Search className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-700 mb-1">
        No conversations found
      </p>
      <p className="text-xs text-gray-500">
        No results for "{query}"
      </p>
    </div>
  );
}

export default SessionSearch;
