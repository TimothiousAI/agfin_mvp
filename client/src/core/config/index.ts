import { z } from 'zod';

/**
 * Client environment configuration schema
 * Validates Vite environment variables (VITE_* prefix)
 */
const envSchema = z.object({
  // Vite Mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),

  // API
  VITE_API_URL: z.string().url().default('http://localhost:3001'),

  // Supabase (Public keys only)
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),

  // Clerk (Publishable key only)
  VITE_CLERK_PUBLISHABLE_KEY: z.string().optional(),
});

/**
 * Validate and parse Vite environment variables
 * Throws descriptive error if validation fails
 */
function validateEnv() {
  try {
    // Vite exposes env vars via import.meta.env
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      }).join('\n');

      throw new Error(
        `❌ Environment validation failed:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required VITE_* variables are set.`
      );
    }
    throw error;
  }
}

// Validate and export configuration
export const config = validateEnv();

// Type-safe config object
export type Config = z.infer<typeof envSchema>;

// Helper to check environment
export const isProduction = config.MODE === 'production';
export const isDevelopment = config.MODE === 'development';
export const isTest = config.MODE === 'test';
