/**
 * Enhanced Command Search Algorithm
 *
 * Provides fuzzy search with:
 * - Relevance scoring and ranking
 * - Typo tolerance
 * - Character highlighting
 * - Result limiting
 */

import { type RegisteredCommand } from './registry';

export interface SearchResult {
  command: RegisteredCommand;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'label' | 'description' | 'keywords';
  indices: [number, number][]; // Start and end positions of matches
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find fuzzy match positions in a string
 * Returns array of [start, end] indices for matched characters
 */
function findMatchIndices(text: string, query: string): [number, number][] | null {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const indices: [number, number][] = [];

  let textIndex = 0;
  let matchStart = -1;

  for (let i = 0; i < queryLower.length; i++) {
    const char = queryLower[i];
    const foundIndex = textLower.indexOf(char, textIndex);

    if (foundIndex === -1) return null; // No match

    // Track consecutive matches for highlighting
    if (matchStart === -1) {
      matchStart = foundIndex;
    } else if (foundIndex !== textIndex) {
      // Gap detected, save previous match
      indices.push([matchStart, textIndex]);
      matchStart = foundIndex;
    }

    textIndex = foundIndex + 1;
  }

  // Save final match
  if (matchStart !== -1) {
    indices.push([matchStart, textIndex]);
  }

  return indices;
}

/**
 * Calculate relevance score for a match
 * Higher score = more relevant
 */
function calculateScore(
  text: string,
  query: string,
  matchIndices: [number, number][] | null,
  fieldWeight: number
): number {
  if (!matchIndices) return 0;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  let score = 0;

  // 1. Exact substring match gets highest score
  if (textLower.includes(queryLower)) {
    score += 100 * fieldWeight;

    // Bonus for match at start
    if (textLower.startsWith(queryLower)) {
      score += 50 * fieldWeight;
    }
  }

  // 2. Consecutive character bonus
  const consecutiveChars = matchIndices.reduce((sum, [start, end]) => sum + (end - start), 0);
  score += (consecutiveChars / query.length) * 30 * fieldWeight;

  // 3. Match position bonus (earlier is better)
  if (matchIndices.length > 0) {
    const firstMatchPos = matchIndices[0][0];
    const positionScore = Math.max(0, 20 - firstMatchPos);
    score += positionScore * fieldWeight;
  }

  // 4. Length ratio (shorter text with match is better)
  const lengthRatio = query.length / text.length;
  score += lengthRatio * 10 * fieldWeight;

  // 5. Typo tolerance (using Levenshtein distance)
  const distance = levenshteinDistance(queryLower, textLower.substring(0, queryLower.length + 2));
  if (distance <= 2) { // Allow up to 2 typos
    score += (3 - distance) * 5 * fieldWeight;
  }

  return score;
}

/**
 * Search commands with enhanced fuzzy matching
 */
export function searchCommands(
  commands: RegisteredCommand[],
  query: string,
  options: {
    maxResults?: number;
    threshold?: number; // Minimum score to include
  } = {}
): SearchResult[] {
  const { maxResults = 10, threshold = 10 } = options;

  if (!query || query.trim() === '') {
    // Return all commands with neutral score
    return commands.slice(0, maxResults).map(cmd => ({
      command: cmd,
      score: 0,
      matches: []
    }));
  }

  const results: SearchResult[] = [];

  for (const command of commands) {
    let totalScore = 0;
    const matches: SearchMatch[] = [];

    // Search in label (highest weight)
    const labelIndices = findMatchIndices(command.label, query);
    if (labelIndices) {
      const labelScore = calculateScore(command.label, query, labelIndices, 3.0);
      totalScore += labelScore;
      matches.push({ field: 'label', indices: labelIndices });
    }

    // Search in description (medium weight)
    if (command.description) {
      const descIndices = findMatchIndices(command.description, query);
      if (descIndices) {
        const descScore = calculateScore(command.description, query, descIndices, 1.5);
        totalScore += descScore;
        matches.push({ field: 'description', indices: descIndices });
      }
    }

    // Search in keywords (medium weight)
    if (command.keywords) {
      for (const keyword of command.keywords) {
        const keywordIndices = findMatchIndices(keyword, query);
        if (keywordIndices) {
          const keywordScore = calculateScore(keyword, query, keywordIndices, 2.0);
          totalScore += keywordScore;
          matches.push({ field: 'keywords', indices: keywordIndices });
          break; // Only count first keyword match
        }
      }
    }

    // Only include if score meets threshold
    if (totalScore >= threshold && matches.length > 0) {
      results.push({
        command,
        score: totalScore,
        matches
      });
    }
  }

  // Sort by score (highest first) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Highlight matching characters in text
 * Returns text with <mark> tags around matches
 */
export function highlightMatches(text: string, indices: [number, number][]): string {
  if (!indices || indices.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  for (const [start, end] of indices) {
    result += text.substring(lastIndex, start);
    result += '<mark>' + text.substring(start, end) + '</mark>';
    lastIndex = end;
  }

  result += text.substring(lastIndex);
  return result;
}

/**
 * Get highlight ranges for React rendering
 * Returns array of {text, highlighted} objects
 */
export function getHighlightRanges(
  text: string,
  indices: [number, number][]
): Array<{ text: string; highlighted: boolean }> {
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }];
  }

  const ranges: Array<{ text: string; highlighted: boolean }> = [];
  let lastIndex = 0;

  for (const [start, end] of indices) {
    if (start > lastIndex) {
      ranges.push({ text: text.substring(lastIndex, start), highlighted: false });
    }
    ranges.push({ text: text.substring(start, end), highlighted: true });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    ranges.push({ text: text.substring(lastIndex), highlighted: false });
  }

  return ranges;
}
