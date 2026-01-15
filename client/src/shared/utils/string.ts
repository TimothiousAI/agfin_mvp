/**
 * String manipulation utilities
 */

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Extract initials from name
 */
export function getInitials(name: string, maxLength = 2): string {
  const words = name.trim().split(/\s+/);
  const initials = words
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return initials.slice(0, maxLength);
}

/**
 * Pluralize word based on count
 */
export function pluralize(word: string, count: number): string {
  if (count === 1) return word;

  // Simple pluralization rules
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  }
  return word + 's';
}

/**
 * Remove extra whitespace
 */
export function normalizeWhitespace(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Mask sensitive string (e.g., "abc***xyz")
 */
export function maskString(str: string, visibleChars = 3): string {
  if (str.length <= visibleChars * 2) return '***';
  const start = str.slice(0, visibleChars);
  const end = str.slice(-visibleChars);
  return `${start}***${end}`;
}
