---
description: Start AgFin development servers (all services)
---

# Start

Start all AgFin development servers.

## Services

| Service | Port | Command |
|---------|------|---------|
| Frontend | 5173 | `cd client && npm run dev` |
| Backend | 3001 | `cd server && npm run dev` |
| AI Service | 8000 | `cd ai-service && uvicorn main:app --reload --port 8000` |
| Supabase | 54321 | `docker-compose up -d` |
| Docling | 5001 | Started via docker-compose |

## Workflow

1. **Check Docker**
   - Verify Docker is running
   - Start infrastructure: `docker-compose up -d`

2. **Wait for Services**
   - Check Supabase health: `curl http://localhost:54321/rest/v1/`
   - Check Docling health: `curl http://localhost:5001/health`

3. **Start Development Servers**
   - Option 1: Use init.sh script
   - Option 2: Start manually in separate terminals

## Quick Start Commands

```bash
# Start infrastructure
docker-compose up -d

# Wait for services
sleep 10

# Start all dev servers (use ./init.sh or run manually)
./init.sh

# OR manually in separate terminals:
# Terminal 1: cd client && npm run dev
# Terminal 2: cd server && npm run dev
# Terminal 3: cd ai-service && uvicorn main:app --reload --port 8000
```

## Health Checks

```bash
# Frontend
curl http://localhost:5173

# Backend
curl http://localhost:3001/health

# AI Service
curl http://localhost:8000/health

# Supabase
curl http://localhost:54321/rest/v1/

# Docling
curl http://localhost:5001/health
```

## Report

```markdown
# Service Status

| Service | Port | Status |
|---------|------|--------|
| Frontend | 5173 | ✅/❌ |
| Backend | 3001 | ✅/❌ |
| AI Service | 8000 | ✅/❌ |
| Supabase | 54321 | ✅/❌ |
| Docling | 5001 | ✅/❌ |

**URLs**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- AI Service: http://localhost:8000/docs
- Supabase Studio: http://localhost:54323
```
