/**
 * Core middleware exports for Express application
 * Centralized location for all application middleware
 */

// Re-export Clerk authentication middleware
export {
  initializeClerkMiddleware,
  requireAuth,
  optionalAuth,
  getAuth,
  isAuthenticated,
  getUserId
} from '../auth/middleware';

// Re-export user sync utilities
export {
  ensureUserExists,
  getOrCreateUser,
  getSupabaseUserId,
  autoSyncUser,
  getSupabaseUserIdFromRequest
} from '../auth/user-sync';

// Error handling middleware can be added here in the future
// Logging middleware can be added here in the future
// Rate limiting middleware can be added here in the future
