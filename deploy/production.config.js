/**
 * Production Deployment Configuration
 *
 * This file contains all production deployment settings including:
 * - Environment-specific configurations
 * - Build optimization flags
 * - Asset compression settings
 * - CDN configuration
 * - Health check endpoints
 * - Rollback procedures
 */

module.exports = {
  /**
   * Environment Configuration
   */
  environment: {
    name: 'production',
    nodeEnv: 'production',
    port: process.env.PORT || 3001,
    frontendUrl: process.env.FRONTEND_URL || 'https://app.agrellus.com',
    apiUrl: process.env.API_URL || 'https://api.agrellus.com',
  },

  /**
   * Build Optimization Flags
   */
  build: {
    // Enable all optimizations
    optimize: true,

    // Minification settings
    minify: {
      enabled: true,
      removeConsole: true,
      removeDebugger: true,
      dropComments: true,
    },

    // Source maps (disable in production for security)
    sourceMaps: false,

    // Tree shaking
    treeShaking: true,

    // Code splitting
    codeSplitting: {
      enabled: true,
      chunks: 'all',
      maxInitialRequests: 30,
      maxAsyncRequests: 30,
    },

    // Bundle analysis (for optimization review)
    analyzeBundle: process.env.ANALYZE === 'true',

    // Target browsers
    targets: {
      browsers: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
      ],
    },
  },

  /**
   * Asset Compression
   */
  compression: {
    // Gzip compression
    gzip: {
      enabled: true,
      level: 9, // Maximum compression
      threshold: 1024, // Only compress files >1KB
    },

    // Brotli compression (better than gzip)
    brotli: {
      enabled: true,
      quality: 11, // Maximum quality
      threshold: 1024,
    },

    // Image optimization
    images: {
      formats: ['webp', 'avif', 'jpeg'],
      quality: 85,
      progressive: true,
      lazy: true,
    },

    // Font optimization
    fonts: {
      subset: true,
      preload: ['woff2'],
      display: 'swap',
    },
  },

  /**
   * CDN Configuration
   */
  cdn: {
    // CDN provider (Cloudflare, AWS CloudFront, etc.)
    provider: process.env.CDN_PROVIDER || 'cloudflare',

    // CDN URL for static assets
    url: process.env.CDN_URL || 'https://cdn.agrellus.com',

    // Asset paths to serve from CDN
    paths: {
      static: '/assets',
      images: '/images',
      fonts: '/fonts',
      videos: '/videos',
    },

    // Cache headers
    cacheControl: {
      // Long-term caching for static assets (1 year)
      static: 'public, max-age=31536000, immutable',

      // Short-term caching for HTML (1 hour)
      html: 'public, max-age=3600, must-revalidate',

      // API responses (no caching)
      api: 'no-cache, no-store, must-revalidate',
    },

    // Purge settings
    purge: {
      onDeploy: true,
      patterns: ['/assets/*', '/images/*'],
    },
  },

  /**
   * Health Check Endpoints
   */
  healthChecks: {
    // Basic health check
    basic: {
      path: '/health',
      expectedStatus: 200,
      expectedBody: { status: 'ok' },
    },

    // Detailed health check
    detailed: {
      path: '/health/detailed',
      expectedStatus: 200,
      checks: [
        'database',
        'redis',
        'storage',
        'ai_service',
      ],
    },

    // Readiness probe (for K8s)
    readiness: {
      path: '/health/ready',
      expectedStatus: 200,
    },

    // Liveness probe (for K8s)
    liveness: {
      path: '/health/live',
      expectedStatus: 200,
    },
  },

  /**
   * Database Configuration
   */
  database: {
    // Connection pooling
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },

    // SSL/TLS
    ssl: {
      enabled: true,
      rejectUnauthorized: true,
    },

    // Query logging (disable in production)
    logging: false,

    // Migrations
    migrations: {
      auto: false, // Manual migrations in production
      tableName: 'migrations',
    },
  },

  /**
   * Security Configuration
   */
  security: {
    // HTTPS enforcement
    https: {
      enabled: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },

    // CORS settings
    cors: {
      origin: [
        'https://app.agrellus.com',
        'https://www.agrellus.com',
      ],
      credentials: true,
      maxAge: 86400,
    },

    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Max 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
    },

    // Security headers
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.agrellus.com; style-src 'self' 'unsafe-inline' https://cdn.agrellus.com; img-src 'self' data: https:; font-src 'self' https://cdn.agrellus.com; connect-src 'self' https://api.agrellus.com;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },

  /**
   * Monitoring & Logging
   */
  monitoring: {
    // Application Performance Monitoring (APM)
    apm: {
      enabled: true,
      service: process.env.APM_SERVICE || 'agfin-api',
      environment: 'production',
    },

    // Error tracking
    errorTracking: {
      enabled: true,
      service: process.env.ERROR_TRACKING_SERVICE || 'sentry',
      dsn: process.env.SENTRY_DSN,
      sampleRate: 1.0,
    },

    // Logging
    logging: {
      level: 'info',
      format: 'json',
      destination: process.env.LOG_DESTINATION || 'stdout',
    },

    // Metrics
    metrics: {
      enabled: true,
      interval: 60000, // 1 minute
      endpoints: ['prometheus'],
    },
  },

  /**
   * Rollback Procedures
   */
  rollback: {
    // Strategy
    strategy: 'blue-green', // or 'canary', 'rolling'

    // Automated rollback triggers
    triggers: {
      errorRateThreshold: 0.05, // 5% error rate
      responseTimeThreshold: 5000, // 5 seconds
      healthCheckFailures: 3, // 3 consecutive failures
    },

    // Manual rollback steps
    steps: [
      '1. Identify deployment version to rollback to',
      '2. Run: npm run deploy:rollback -- --version=<VERSION>',
      '3. Verify health checks pass',
      '4. Monitor error rates for 15 minutes',
      '5. Update status page',
      '6. Post-mortem: Document what went wrong',
    ],

    // Backup retention
    backups: {
      database: {
        retention: 30, // days
        frequency: 'daily',
      },
      code: {
        retention: 10, // versions
      },
    },
  },

  /**
   * Deployment Process
   */
  deployment: {
    // Pre-deployment checks
    preChecks: [
      'Run test suite',
      'Run security scan',
      'Run performance audit',
      'Verify environment variables',
      'Database migrations ready',
    ],

    // Deployment steps
    steps: [
      'Build frontend: npm run build --workspace=client',
      'Build backend: npm run build --workspace=server',
      'Run database migrations: npm run migrate:up',
      'Deploy to staging first',
      'Run smoke tests on staging',
      'Deploy to production (blue-green)',
      'Monitor health checks',
      'Verify critical user flows',
      'Enable production traffic',
    ],

    // Post-deployment checks
    postChecks: [
      'Verify health endpoints return 200',
      'Check error rates in monitoring',
      'Test critical user flows manually',
      'Monitor performance metrics',
      'Update status page',
    ],

    // Automated deployment
    ci: {
      provider: 'github-actions',
      branch: 'main',
      autoDeployOn: 'tag', // Deploy on git tags only
      requireApproval: true,
    },
  },

  /**
   * Environment Variables Required
   */
  requiredEnvVars: [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'REDIS_URL',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'AI_SERVICE_URL',
    'AI_SERVICE_API_KEY',
    'CDN_URL',
    'SENTRY_DSN',
  ],

  /**
   * Performance Budgets
   */
  performanceBudgets: {
    // Frontend
    frontend: {
      initialLoad: 3000, // ms
      lcp: 2500, // ms
      fid: 100, // ms
      cls: 0.1,
      bundleSize: 200 * 1024, // 200KB gzipped
    },

    // Backend
    backend: {
      healthCheck: 50, // ms
      apiResponse: 500, // ms
      databaseQuery: 100, // ms
    },
  },

  /**
   * Scaling Configuration
   */
  scaling: {
    // Horizontal scaling
    horizontal: {
      min: 2, // Minimum instances
      max: 10, // Maximum instances
      targetCPU: 70, // Scale at 70% CPU
      targetMemory: 80, // Scale at 80% memory
    },

    // Auto-scaling rules
    autoScaling: {
      scaleUpCooldown: 300, // 5 minutes
      scaleDownCooldown: 600, // 10 minutes
    },
  },
};
