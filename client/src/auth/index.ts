/**
 * Authentication module exports
 *
 * This module provides a unified interface for authentication
 * that works with both real Clerk and mock providers.
 */

// Check if we should use mock auth
const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const isDev = import.meta.env.MODE === 'development';
export const USE_MOCK_AUTH = isDev && !hasClerkKey;

// Always export from mock-clerk-provider for now since we don't have keys
export * from './mock-clerk-provider';

// Export authentication hooks (excluding useAuth to avoid conflict)
export { useCurrentUser, useAuthActions, useSession, useAuthState, useUserData } from './hooks';
