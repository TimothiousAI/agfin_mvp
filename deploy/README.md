# Deployment Guide

## Overview

This directory contains production deployment configuration and procedures for the AgFin application.

## Files

- `production.config.js` - Production environment configuration
- `README.md` - This file (deployment guide)

---

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Docker and Docker Compose
- Access to production infrastructure
- Environment variables configured

### Required Services
- PostgreSQL database (Supabase)
- Redis cache
- MinIO object storage
- AI service endpoint
- CDN (Cloudflare or similar)

---

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.agrellus.com
API_URL=https://api.agrellus.com

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/agfin_production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Redis
REDIS_URL=redis://redis.production:6379

# MinIO Object Storage
MINIO_ENDPOINT=storage.agrellus.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_USE_SSL=true
MINIO_BUCKET=agfin-documents

# AI Service
AI_SERVICE_URL=https://ai.agrellus.com
AI_SERVICE_API_KEY=your_ai_api_key

# CDN
CDN_URL=https://cdn.agrellus.com

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
APM_SERVICE=agfin-api

# Optional
ANALYZE=false
LOG_LEVEL=info
```

---

## Deployment Process

### 1. Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Security scan completed (`npm audit`)
- [ ] Performance audit passed (Lighthouse >90)
- [ ] Environment variables verified
- [ ] Database migrations prepared
- [ ] Staging deployment successful
- [ ] Team notification sent

### 2. Build Application

```bash
# Install dependencies
npm ci

# Build frontend
npm run build --workspace=client

# Build backend (if using TypeScript)
npm run build --workspace=server
```

### 3. Database Migrations

```bash
# Run migrations (from server directory)
cd server
npm run migrate:up

# Verify migrations
npm run migrate:status
```

### 4. Deploy to Production

#### Option A: Manual Deployment

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Deploy frontend (to CDN/static hosting)
cd client/dist
# Upload to S3, Cloudflare Pages, or similar

# Deploy backend (to server/container platform)
cd server
# Deploy via Docker, PM2, or similar
```

#### Option B: Automated Deployment (GitHub Actions)

```bash
# Push to main branch (with tag)
git push origin main --tags

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build application
# 3. Deploy to staging
# 4. Run smoke tests
# 5. Deploy to production (with approval)
```

### 5. Post-Deployment Verification

```bash
# Check health endpoints
curl https://api.agrellus.com/health
# Expected: {"status":"ok"}

curl https://api.agrellus.com/health/detailed
# Expected: All checks passing

# Test critical user flows
# 1. Sign in
# 2. Create application
# 3. Upload document
# 4. Complete form
```

### 6. Monitor Deployment

- Check error rates in Sentry
- Monitor performance metrics
- Watch health check status
- Review logs for errors
- Test user flows manually

---

## Rollback Procedure

### Automated Rollback

If automated rollback is triggered (error rate >5%, health checks failing):

```bash
# System will automatically:
# 1. Switch traffic back to previous version
# 2. Send alerts to team
# 3. Generate incident report
```

### Manual Rollback

```bash
# 1. Identify version to rollback to
git log --oneline -10

# 2. Checkout previous version
git checkout v0.9.9

# 3. Rebuild and redeploy
npm run build
npm run deploy

# 4. Verify health checks
curl https://api.agrellus.com/health

# 5. Monitor for 15 minutes

# 6. Database rollback (if needed)
cd server
npm run migrate:down
```

---

## Health Check Endpoints

### Basic Health Check
```
GET /health
Response: { "status": "ok" }
Status: 200 OK
```

### Detailed Health Check
```
GET /health/detailed
Response: {
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok",
    "ai_service": "ok"
  },
  "uptime": 3600,
  "timestamp": "2026-01-15T12:00:00Z"
}
Status: 200 OK
```

### Readiness Probe
```
GET /health/ready
Response: { "ready": true }
Status: 200 OK (ready) or 503 Service Unavailable (not ready)
```

### Liveness Probe
```
GET /health/live
Response: { "alive": true }
Status: 200 OK
```

---

## Monitoring & Alerts

### Metrics to Monitor
- Error rate (<1%)
- Response time (p95 <1s)
- CPU usage (<70%)
- Memory usage (<80%)
- Database connections (<80% pool)
- Queue depth (if using background jobs)

### Alert Thresholds
- **Critical:** Error rate >5%, health check failing
- **High:** Response time >2s, CPU >80%
- **Medium:** Response time >1s, memory >80%
- **Low:** Warning logs, slow queries

### Monitoring Tools
- **APM:** New Relic, Datadog, or similar
- **Error Tracking:** Sentry
- **Logs:** CloudWatch, Papertrail, or similar
- **Uptime:** Pingdom, UptimeRobot

---

## Scaling

### Horizontal Scaling (Add More Instances)

```bash
# Using Docker Compose
docker-compose up --scale api=3

# Using Kubernetes
kubectl scale deployment agfin-api --replicas=3
```

### Vertical Scaling (Increase Resources)

Update instance type/size in infrastructure configuration.

### Auto-Scaling

Configured in `production.config.js`:
- Min: 2 instances
- Max: 10 instances
- Scale at 70% CPU usage

---

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] API keys rotated and stored securely
- [ ] Database credentials encrypted
- [ ] No secrets in source code
- [ ] Dependencies audited (`npm audit`)
- [ ] CSP policy configured
- [ ] Authentication required for all protected routes

---

## Performance Optimization

### Frontend
- [x] Bundle size <200KB (gzipped)
- [x] Code splitting enabled
- [x] Lazy loading for routes
- [x] Images optimized (WebP format)
- [x] Assets served from CDN
- [x] Gzip/Brotli compression
- [x] Service worker for offline support

### Backend
- [x] Database connection pooling
- [x] Query optimization (indexes)
- [x] API response caching
- [x] Rate limiting
- [x] Gzip compression
- [x] CDN for static assets

---

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check DATABASE_URL is correct
- Verify database is running
- Check connection pool settings
- Review firewall rules

#### "Health check failing"
- Check all required services are running
- Verify environment variables
- Review recent code changes
- Check logs for errors

#### "Slow API responses"
- Check database query performance
- Review API response caching
- Check Redis connection
- Monitor server resources (CPU/memory)

#### "Assets not loading"
- Verify CDN configuration
- Check CORS headers
- Review CSP policy
- Check asset paths

---

## Backup & Recovery

### Automated Backups
- **Database:** Daily backups, 30-day retention
- **File storage:** Continuous replication
- **Configuration:** Version controlled in Git

### Recovery Procedure

```bash
# 1. Restore database from backup
psql $DATABASE_URL < backup-2026-01-15.sql

# 2. Restore file storage (if needed)
# Use MinIO/S3 restore tools

# 3. Redeploy application
npm run deploy

# 4. Verify functionality
npm run test:e2e
```

---

## Contact & Support

- **On-Call Engineer:** See PagerDuty rotation
- **DevOps Team:** devops@agrellus.com
- **Incident Response:** #incidents Slack channel

---

## Version History

- **v1.0.0** (2026-01-15): Initial production release
  - Core application features
  - Authentication with Clerk
  - Document upload and OCR
  - Form completion with AI assistance
  - Performance optimization

---

**Last Updated:** 2026-01-15
**Maintained By:** AgFin DevOps Team
