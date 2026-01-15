/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic US format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const digits = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digits.length === 10;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if string is empty or only whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is an object (not null or array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard for non-null values
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validate minimum length
 */
export function hasMinLength(str: string, minLength: number): boolean {
  return str.length >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(str: string, maxLength: number): boolean {
  return str.length <= maxLength;
}

/**
 * Validate string is within length range
 */
export function isLengthBetween(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}
