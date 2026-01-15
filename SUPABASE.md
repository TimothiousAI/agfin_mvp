# Supabase Local Development Guide

## Quick Start

### 1. Start Supabase

```bash
npx supabase start
```

This will start all Supabase services locally. The first run will download Docker images (~2GB).

### 2. Connection Strings

After starting, Supabase will output connection details:

**API URL:** `http://127.0.0.1:54321`
**DB URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
**Studio URL:** `http://127.0.0.1:54323`
**Inbucket URL:** `http://127.0.0.1:54324` (Email testing)

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Service Role Key (Backend only):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### 3. Stop Supabase

```bash
npx supabase stop
```

## Database Migrations

### Create a New Migration

```bash
npx supabase migration new migration_name
```

This creates a new SQL file in `supabase/migrations/`.

### Apply Migrations

```bash
npx supabase db reset
```

This will:
1. Drop the database
2. Re-run all migrations
3. Run seed data

### Generate Migration from Schema Changes

If you make changes in Studio, generate a migration:

```bash
npx supabase db diff -f migration_name
```

## pgvector Extension

The pgvector extension is enabled by default (see `supabase/migrations/20260115000000_enable_pgvector.sql`).

### Creating Vector Columns

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536)  -- Dimension matches your embedding model
);

-- Index for similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Vector Similarity Search

```sql
-- Find similar documents using cosine similarity
SELECT
  id,
  content,
  1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

**Operators:**
- `<->` Euclidean distance (L2)
- `<#>` Negative inner product
- `<=>` Cosine distance

## Supabase Studio

Access the web UI at http://127.0.0.1:54323

Features:
- **Table Editor:** Create/edit tables visually
- **SQL Editor:** Run queries with syntax highlighting
- **Auth:** Manage users and authentication
- **Storage:** Create buckets and upload files
- **API Docs:** Auto-generated from your schema

## Environment Variables

Add to your `.env` files:

### Client (`.env` in client/)

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Server (`.env` in server/)

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Common Commands

```bash
# Status of all services
npx supabase status

# View logs
npx supabase logs

# Database shell
npx supabase db shell

# Generate TypeScript types from schema
npx supabase gen types typescript --local > types/supabase.ts

# Link to remote project (for production)
npx supabase link --project-ref your-project-ref

# Push local migrations to remote
npx supabase db push

# Pull remote schema to local
npx supabase db pull
```

## Troubleshooting

### Port Already in Use

If you see port conflicts:

```bash
# Stop Supabase
npx supabase stop

# Check what's using the port
lsof -i :54321
lsof -i :54322

# Kill the process or change ports in config.toml
```

### Database Connection Issues

```bash
# Check if services are running
npx supabase status

# Restart services
npx supabase stop
npx supabase start
```

### Reset Everything

```bash
# This will delete all data and reset to fresh state
npx supabase db reset
```

## Production Deployment

**DO NOT use local Supabase keys in production!**

1. Create a project at https://supabase.com
2. Get your production keys from the project dashboard
3. Update environment variables with production values
4. Push migrations: `npx supabase db push`

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [SQL Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
