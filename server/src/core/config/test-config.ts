/**
 * Test script to verify environment configuration validation
 * Run with: npx ts-node src/core/config/test-config.ts
 */

import { config, isDevelopment, isProduction } from './index';

console.log('✅ Environment Configuration Test\n');
console.log('Configuration loaded successfully!');
console.log('----------------------------------');
console.log('NODE_ENV:', config.NODE_ENV);
console.log('PORT:', config.PORT);
console.log('CORS_ORIGIN:', config.CORS_ORIGIN);
console.log('\nEnvironment Helpers:');
console.log('isDevelopment:', isDevelopment);
console.log('isProduction:', isProduction);
console.log('\nOptional Variables (may be undefined):');
console.log('DATABASE_URL:', config.DATABASE_URL || '(not set)');
console.log('SUPABASE_URL:', config.SUPABASE_URL || '(not set)');
console.log('CLERK_PUBLISHABLE_KEY:', config.CLERK_PUBLISHABLE_KEY || '(not set)');
console.log('ANTHROPIC_API_KEY:', config.ANTHROPIC_API_KEY ? '***' + config.ANTHROPIC_API_KEY.slice(-4) : '(not set)');
console.log('OPENAI_API_KEY:', config.OPENAI_API_KEY ? '***' + config.OPENAI_API_KEY.slice(-4) : '(not set)');
console.log('\n✅ All validations passed! Config is type-safe and ready to use.');
