# AgFin Crop Finance MVP

AI-powered crop loan application platform for agricultural lenders with intelligent document extraction and conversational AI interface.

## Quick Start

### Prerequisites

- **Node.js 20.x LTS** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://python.org/)
- **Docker Desktop** - [Download](https://docker.com/products/docker-desktop)
- **Clerk Account** - [Sign up](https://clerk.com/) for OTP authentication
- **API Keys:**
  - Anthropic API key (Claude)
  - OpenAI API key (embeddings)

### 1. Clone and Install

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd ai-service
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

Create `.env` files in the root directory:

```bash
# .env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

ANTHROPIC_API_KEY=sk-ant-your_key
OPENAI_API_KEY=sk-your_key

DOCLING_URL=http://localhost:5001
AGFIN_AI_BOT_URL=http://localhost:8000
```

### 3. Start Infrastructure

```bash
# Start Supabase and Docling services
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

### 4. Run Database Migrations

```bash
cd supabase
npx supabase db push
cd ..
```

### 5. Start Development Servers

```bash
# Option 1: Start all at once
./init.sh

# Option 2: Start individually
npm run dev                    # Frontend (5173) + Backend (3001)
cd ai-service && uvicorn main:app --port 8000 --reload  # AI Service
```

### 6. Open Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **AI Service:** http://localhost:8000/docs
- **Supabase Studio:** http://localhost:54323

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │           Three-Column Layout (Claude.ai-style)                  │    │
│  │  ┌──────────────┬───────────────────┬─────────────────────┐     │    │
│  │  │ Conversation │                   │                     │     │    │
│  │  │   Sidebar    │   Chat Center     │  Artifact Panel     │     │    │
│  │  │   (280px)    │    (Primary)      │    (400px)          │     │    │
│  │  │              │                   │                     │     │    │
│  │  │ • Sessions   │ • AI Chat         │ • Documents         │     │    │
│  │  │ • Search     │ • Typing Indicator│ • Module Forms      │     │    │
│  │  │ • Pinning    │ • Streaming       │ • Extraction View   │     │    │
│  │  └──────────────┴───────────────────┴─────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                        │
│  ┌─────────────────────────┐      ┌─────────────────────────────────┐   │
│  │   Express.js Backend    │      │      FastAPI AI Service         │   │
│  │      :3001              │◄────►│          :8000                  │   │
│  │                         │      │                                 │   │
│  │ • Applications API      │      │ • Claude Agent                  │   │
│  │ • Documents API         │      │ • Tool Registry (8 tools)       │   │
│  │ • Modules API           │      │ • SSE Streaming                 │   │
│  │ • Clerk Auth            │      │ • mem0 Memory                   │   │
│  └─────────────────────────┘      └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA & SERVICES                                     │
│  ┌─────────────────────────┐      ┌─────────────────────────────────┐   │
│  │      Supabase           │      │         Docling                 │   │
│  │       :54321            │      │          :5001                  │   │
│  │                         │      │                                 │   │
│  │ • PostgreSQL            │      │ • PDF OCR                       │   │
│  │ • pgvector (embeddings) │      │ • Table Extraction              │   │
│  │ • Storage (documents)   │      │ • Field Detection               │   │
│  │ • Row Level Security    │      │ • Confidence Scoring            │   │
│  └─────────────────────────┘      └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
agfin_app/
├── client/                 # React frontend (Vite + TypeScript)
│   └── src/
│       ├── application/    # Core features (shell, documents, modules)
│       ├── auth/           # Clerk authentication
│       ├── shared/         # Reusable UI components
│       └── core/           # Config, database client
│
├── server/                 # Express.js backend (TypeScript)
│   └── src/
│       ├── api/            # REST endpoints
│       ├── application/    # Business logic services
│       ├── auth/           # Clerk middleware
│       └── core/           # Config, logging
│
├── ai-service/             # Python FastAPI AI service
│   └── src/
│       ├── agents/         # Claude client, tools
│       ├── chat/           # Chat endpoints
│       └── memory/         # mem0 integration
│
├── supabase/               # Database migrations
├── deploy/                 # Production configs
├── docs/                   # Documentation
│   └── ai_docs/            # Specs, PRD, brand guide
│
├── docker-compose.yml      # Local infrastructure
├── init.sh                 # Startup script
├── package.json            # npm workspaces
├── CLAUDE.md               # Claude Code development guide
└── README.md               # This file
```

## Features

### Conversational AI Interface
- Claude.ai-style chat as the primary UI
- Natural language for all operations
- Context-aware suggestions
- SSE streaming responses

### Document Processing
- 9 document types supported (Schedule F, Balance Sheet, etc.)
- Docling OCR with table extraction
- Confidence scoring (auto-accept ≥90%)
- Field-to-module mapping

### Data Modules
1. **M1: Identity & Entity** - Applicant info, SSN, EIN
2. **M2: Lands Farmed** - Tracts, acres, counties
3. **M3: Financial Statement** - Assets, liabilities
4. **M4: Projected Operations** - Yields, prices
5. **M5: Summary & Ratios** - Calculated fields

### Audit & Certification
- Dual-pane review (PDF + extracted data)
- Mandatory override justifications
- Immutable audit trail
- PDF export with full package

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js 20, Express.js, TypeScript, Zod |
| AI Service | Python 3.11, FastAPI, Anthropic Claude SDK |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Clerk (OTP email/SMS) |
| OCR | Docling |
| Memory | mem0 + OpenAI embeddings |

## NPM Scripts

```bash
npm run dev          # Start frontend + backend
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
npm run build        # Build all
npm run test         # Run tests
npm run lint         # Lint all
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase API URL (localhost:54321) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) |
| `DOCLING_URL` | Docling service URL |
| `AGFIN_AI_BOT_URL` | AI service URL |

## Documentation

- **CLAUDE.md** - Development guide for Claude Code
- **docs/ai_docs/spec.md** - Full application specification
- **docs/ai_docs/PRD-AgFin-MVP.md** - Product requirements
- **docs/ai_docs/AgBrandSkill.md** - Brand guidelines
- **docs/testing-plan.md** - Testing procedures
- **docs/accessibility-checklist.md** - WCAG 2.1 AA checklist

## License

Private - Agrellus/AgFin
