# Docker Compose Setup Guide

## Overview

This project includes Docker Compose configuration for local development with:
- **Supabase** (PostgreSQL + Auth + Storage + Studio)
- **Docling OCR Service** for document processing

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+ (included with Docker Desktop)

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.docker-compose .env
   ```

2. **Start all services:**
   ```bash
   docker compose up -d
   ```

3. **Check service status:**
   ```bash
   docker compose ps
   ```

4. **View logs:**
   ```bash
   docker compose logs -f
   ```

5. **Stop services:**
   ```bash
   docker compose down
   ```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 3001 | http://localhost:3001 |
| Supabase Studio | 54323 | http://localhost:54323 |
| Supabase API | 54321 | http://localhost:54321 |
| Supabase DB | 54322 | postgresql://localhost:54322 |
| Docling OCR | 5001 | http://localhost:5001 |

## Supabase Configuration

### Default Keys (Development Only)

The following keys are pre-configured for local development:

**Anon Key (Public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Service Role Key (Backend):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**⚠️ WARNING:** These are demo keys. Generate new keys for production!

### Accessing Supabase Studio

1. Open http://localhost:54323
2. Use the dashboard to:
   - Create tables
   - Manage users
   - Configure storage buckets
   - Set up auth providers

### Database Connection

Connect to PostgreSQL directly:
```bash
psql postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres
```

## Docling OCR Service

The Docling service provides document processing capabilities:

**Health Check:**
```bash
curl http://localhost:5001/health
```

**Process Document:**
```bash
curl -X POST http://localhost:5001/process \
  -F "file=@document.pdf"
```

## Environment Variables

Edit `.env` to customize:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | (see .env.docker-compose) |
| `JWT_SECRET` | Supabase JWT secret | (see .env.docker-compose) |
| `SITE_URL` | Your app URL | http://localhost:5173 |
| `DISABLE_SIGNUP` | Disable user registration | false |

## Troubleshooting

### Services not starting

1. Check Docker is running:
   ```bash
   docker info
   ```

2. Check for port conflicts:
   ```bash
   lsof -i :54321
   lsof -i :54322
   lsof -i :5001
   ```

3. View service logs:
   ```bash
   docker compose logs supabase-db
   docker compose logs docling
   ```

### Reset everything

```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Restart fresh
```

## Data Persistence

Data is persisted in Docker volumes:
- `supabase-db-data` - PostgreSQL database
- `supabase-storage-data` - File storage

To backup:
```bash
docker run --rm -v agfin-supabase-db-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

## Production Deployment

**DO NOT use this Docker Compose in production!**

For production:
1. Use managed Supabase (https://supabase.com)
2. Deploy Docling to a cloud service
3. Generate new JWT secrets and keys
4. Configure proper security groups and firewalls
