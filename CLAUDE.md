# CLAUDE.md - AgFin Crop Finance MVP

## Project Overview

AgFin is an **AI-powered crop loan application platform** for agricultural lenders. It implements an Analyst-as-Proxy workflow where loan analysts collect, validate, and audit farmer application data through a conversational AI interface backed by intelligent document extraction.

**Key Concept:** Claude.ai-style chat interface as the PRIMARY UI - all functionality flows through or from the chat.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React)                        │
│         localhost:5173 │ client/                                │
│  ┌─────────────┬─────────────────┬─────────────────────────┐    │
│  │ Conversation│   Chat Center   │    Artifact Panel       │    │
│  │   Sidebar   │  (Primary UI)   │ (Documents/Modules)     │    │
│  └─────────────┴─────────────────┴─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                           │
│              localhost:3001 │ server/                            │
│  ┌──────────┬──────────┬──────────┬──────────────────────────┐  │
│  │   Auth   │   Apps   │   Docs   │    AgFin AI Bot Proxy    │  │
│  │  Routes  │  Routes  │  Routes  │        Routes            │  │
│  └──────────┴──────────┴──────────┴──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Supabase     │  │   AI Service    │  │     Docling     │
│   PostgreSQL +  │  │   (FastAPI +    │  │  (OCR Service)  │
│    Storage      │  │    Claude)      │  │                 │
│ localhost:54321 │  │ localhost:8000  │  │ localhost:5001  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Directory Structure

```
agfin_app/
├── client/                     # Vite + React + TypeScript frontend
│   └── src/
│       ├── application/        # Core application features
│       │   ├── shell/          # Three-column layout (AppLayout, ChatCenter, ArtifactPanel)
│       │   ├── conversation/   # Chat state, API hooks, session management
│       │   ├── documents/      # Document upload, extraction, viewer
│       │   ├── modules/        # M1-M5 data module forms
│       │   ├── audit/          # Audit workflow, dual-pane review
│       │   └── certification/  # Final certification, PDF export
│       ├── auth/               # Clerk authentication (OTP sign-in)
│       ├── shared/             # Shared UI components, hooks, utilities
│       │   ├── ui/             # shadcn/ui components (button, dialog, etc.)
│       │   ├── hooks/          # useAutoSave, useFormPersistence, etc.
│       │   ├── performance/    # Web Vitals, monitoring, lazy loading
│       │   └── accessibility/  # ARIA helpers, keyboard nav, announcer
│       └── core/               # Database client, query config
│
├── server/                     # Express.js + TypeScript backend
│   └── src/
│       ├── api/                # Route handlers (applications, documents)
│       ├── application/        # Business logic services
│       │   ├── documents/      # Docling service, extraction, mapping
│       │   └── certification/  # PDF generation, export service
│       ├── auth/               # Clerk middleware, user sync
│       └── core/               # Config, database, logging, middleware
│
├── ai-service/                 # Python FastAPI AI agent service
│   └── src/
│       ├── agents/             # Claude client, tool registry
│       ├── chat/               # Chat endpoints, streaming
│       ├── memory/             # mem0 semantic memory client
│       └── tools/              # AI agent tools (8 total)
│
├── supabase/                   # Database migrations and config
│   └── migrations/             # SQL migration files
│
├── deploy/                     # Production deployment configs
│
├── docs/                       # Documentation
│   └── ai_docs/                # Reference docs (spec, PRD, brand, Anthropic guides)
│
├── docker-compose.yml          # Local Supabase + Docling services
├── init.sh                     # Start all services script
└── package.json                # npm workspaces root
```

## Running the Project

### Prerequisites
- Node.js 20.x LTS
- Python 3.11+
- Docker Desktop
- Clerk account (for auth)
- API keys: Anthropic, OpenAI (for embeddings)

### Quick Start

```bash
# 1. Install dependencies
npm install
cd ai-service && pip install -r requirements.txt && cd ..

# 2. Start infrastructure (Supabase + Docling)
docker-compose up -d

# 3. Wait for services to be healthy
docker-compose ps  # All should show "healthy"

# 4. Run database migrations
cd supabase && npx supabase db push && cd ..

# 5. Start all services
./init.sh
# OR manually:
npm run dev              # Frontend + Backend (ports 5173, 3001)
cd ai-service && uvicorn main:app --port 8000  # AI service
```

### Service Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 3001 | http://localhost:3001 |
| AI Service (FastAPI) | 8000 | http://localhost:8000 |
| Supabase API | 54321 | http://localhost:54321 |
| Supabase Studio | 54323 | http://localhost:54323 |
| Docling OCR | 5001 | http://localhost:5001 |

## Technology Stack

### Frontend
- **Framework:** Vite 5.x + React 18.x + TypeScript 5.x
- **Styling:** Tailwind CSS 3.x with Agrellus brand colors (#30714C primary)
- **State:** TanStack Query 5.x (server) + Zustand 4.x (client)
- **Components:** shadcn/ui (Radix UI primitives)
- **Animations:** Framer Motion 10.x
- **Forms:** React Hook Form + Zod validation

### Backend
- **Runtime:** Node.js 20.x + Express.js 4.x + TypeScript
- **Validation:** Zod 3.x for all API requests
- **Auth:** Clerk SDK (OTP email/SMS)

### AI Service
- **Runtime:** Python 3.11+ + FastAPI
- **LLM:** Anthropic Claude via SDK with tool_runner pattern
- **Memory:** mem0 with Supabase pgvector backend
- **Embeddings:** OpenAI text-embedding-3-small

### Infrastructure
- **Database:** Supabase (PostgreSQL + pgvector + Storage)
- **OCR:** Docling (quay.io/docling-project/docling-serve)
- **Auth Provider:** Clerk (OTP, whitelist-based)

## Key Patterns

### Claude.ai-Style Chat Interface
The chat is the PRIMARY UI. After login, users land directly on the chat - the AI agent handles all actions through natural conversation. Document requests happen IN CHAT - agent prompts user to upload when needed.

### Anthropic tool_runner Pattern
The AI service uses Anthropic's tool_runner pattern for automatic tool execution. All 8 agent tools follow Anthropic guidelines:
- Detailed descriptions explaining what, when, how
- Single-purpose tools with clear input schemas
- Proper error handling with is_error responses

**Agent Tools:**
1. `query_application` - Retrieve application data
2. `create_application` - Create new loan applications
3. `upload_document` - Trigger document upload UI
4. `extract_fields` - OCR document processing
5. `update_module` - Update module field values
6. `request_audit` - Flag items for review
7. `certify_application` - Lock and certify applications
8. `show_artifact` - Display UI panels

### Three-Column Layout
```
┌──────────────┬─────────────────────────┬──────────────────┐
│ Conversation │                         │                  │
│   Sidebar    │      Chat Center        │  Artifact Panel  │
│   (280px)    │       (flex-1)          │     (400px)      │
└──────────────┴─────────────────────────┴──────────────────┘
```

### Data Source Tracking
All module field values track their source:
- `ai_extracted` - Populated by Docling OCR
- `proxy_entered` - Manually entered by analyst
- `proxy_edited` - AI value modified by analyst
- `auditor_verified` - Confirmed during audit

### Confidence Scoring
- Fields ≥90% confidence: Auto-accepted
- Fields <90% confidence: Flagged for manual review
- Badges: Green (≥90%), Yellow (70-89%), Red (<70%)

## Environment Variables

```bash
# .env (root)
# Supabase (from docker-compose or supabase start)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend
CLERK_SECRET_KEY=sk_test_...            # Backend

# AI Service
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # For mem0 embeddings
AGFIN_AI_BOT_URL=http://localhost:8000

# Document Processing
DOCLING_URL=http://localhost:5001
```

## Testing

### Manual Testing
Test pages are available at `/test/*` routes:
- `/test/m1-form` - Module 1 Identity form
- `/test/m2-form` - Module 2 Lands form
- `/test/m3-form` - Module 3 Financial form
- `/test/command-palette` - Command palette
- `/test/motion` - Animation components
- `/test/auto-save` - Auto-save functionality

### Playwright
```bash
npx playwright test
```

### Testing Checklist
See `docs/testing-plan.md` for comprehensive testing procedures including:
- End-to-end user flows
- Cross-browser testing
- Mobile/tablet responsive testing
- Accessibility audit (WCAG 2.1 AA)
- Performance budgets

## Database

### Core Tables
- `applications` - Loan applications with status tracking
- `documents` - Uploaded documents with extraction status
- `module_data` - JSONB field storage with provenance
- `audit_trail` - Immutable audit log
- `agfin_ai_bot_sessions` - Chat sessions
- `agfin_ai_bot_messages` - Message history
- `agfin_ai_bot_memories` - pgvector semantic memory

### Row Level Security
All tables have RLS policies - analysts only see their own applications.

### Migrations
```bash
cd supabase
npx supabase db push  # Apply migrations
```

## Important Files

| File | Purpose |
|------|---------|
| `client/src/application/shell/AppLayout.tsx` | Three-column layout root |
| `client/src/application/shell/ChatCenter.tsx` | Chat interface |
| `client/src/application/shell/ArtifactPanel.tsx` | Document/form viewer |
| `server/src/api/applications.ts` | Application CRUD endpoints |
| `ai-service/src/agents/registry.ts` | Tool registry |
| `ai-service/src/chat/stream.py` | SSE streaming endpoint |
| `docs/ai_docs/spec.md` | Full application specification |
| `docs/ai_docs/PRD-AgFin-MVP.md` | Product requirements |

## Design System

### Brand Colors (Agrellus)
- Primary Green: `#30714C`
- Wheat Gold: `#DDC66F`
- Background Dark: `#061623`
- Background Card: `#0D2233`

### Typography
- Primary: Lato, system fonts
- Code: ui-monospace, SF Mono

See `docs/ai_docs/AgBrandSkill.md` for complete brand guidelines.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | `Enter` |
| New line | `Shift+Enter` |
| Command palette | `Cmd/Ctrl+K` |
| Toggle artifact | `Cmd/Ctrl+\` |
| Stop generation | `Escape` |
| Focus chat | `/` |
| Save form | `Cmd/Ctrl+S` |

## Common Tasks

### Adding a New AI Tool
1. Create tool in `ai-service/src/tools/`
2. Register in `ai-service/src/agents/registry.ts`
3. Add detailed description following Anthropic guidelines

### Adding a New Module Form
1. Create form in `client/src/application/modules/`
2. Add route in `client/src/App.tsx`
3. Update module service in `server/src/application/`

### Adding a UI Component
1. Use shadcn/ui CLI: `npx shadcn-ui@latest add [component]`
2. Components go to `client/src/shared/ui/`

## Project Status

**100% Complete** - All 182 tasks across 22 epics completed.
See `claude-progress.md` for detailed session history.
