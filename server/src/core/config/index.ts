import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Server environment configuration schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number).pipe(z.number().min(1).max(65535)),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  // AI Services
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

/**
 * Validate and parse environment variables
 * Throws descriptive error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      }).join('\n');

      throw new Error(
        `❌ Environment validation failed:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Validate and export configuration
export const config = validateEnv();

// Type-safe config object
export type Config = z.infer<typeof envSchema>;

// Helper to check if in production
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
