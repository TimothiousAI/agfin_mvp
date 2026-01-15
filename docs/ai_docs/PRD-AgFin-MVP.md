# Product Requirements Document: AgFin Crop Finance MVP

**Version:** 1.4
**Date:** January 2026
**Status:** Draft
**Changelog:**
- v1.4 - Major architecture updates: Local Supabase (supabase start), Clerk OTP authentication, Claude.ai-style chat-first interface, Anthropic tool_runner pattern (see ai_docs/)
- v1.3 - Added Docling processing configuration, mem0 memory architecture (Sections 7.2, 7.13, 8, Appendix)
- v1.2 - Added Agrellus brand-aligned Design System (Section 7.12)
- v1.1 - Added comprehensive UI/UX specifications (Sections 7.7-7.11, Accessibility, Responsive Design, Animation Guidelines)

---

## 1. Executive Summary

AgFin is an AI-powered crop loan application platform designed for agricultural lenders. The MVP focuses on an **Analyst-as-Proxy** workflow where loan analysts collect, validate, and audit farmer application data through a conversational AI interface backed by intelligent document extraction.

The platform transforms unstructured financial documents (IRS Schedule F, Balance Sheets, Crop Insurance policies, etc.) into structured loan application data through AI-powered OCR and extraction. Analysts interact primarily through a chat interface that guides them through data collection while providing non-linear navigation to any of the 9 required document types or 5 data modules.

**MVP Goal:** Deliver a functional Analyst Portal that enables complete loan application data collection, AI-assisted document extraction, compliance-ready audit trails, and PDF generation for manual underwriting—all through a conversational AI-first interface.

---

## 2. Mission

### Mission Statement
Streamline agricultural loan origination by combining conversational AI guidance with intelligent document processing, reducing application processing time while maintaining compliance-grade audit trails.

### Core Principles

1. **AI-First Interface:** The conversational agent is the primary interface—all functionality flows through or from the chat.
2. **Document-Driven Data:** Prioritize document upload and AI extraction over manual data entry wherever possible.
3. **Non-Linear Navigation:** Analysts are never locked into sequential workflows—they can jump to any document or module at any time.
4. **Immutable Audit Trail:** Every data change is logged with source attribution (AI-extracted, proxy-entered, proxy-edited, auditor-verified).
5. **Single-Entity Focus:** MVP is scoped to one legal farming entity per application to reduce complexity.

---

## 3. Target Users

### Primary Persona: Loan Analyst

| Attribute | Description |
|-----------|-------------|
| **Role** | Agricultural Loan Analyst at a crop finance lender |
| **Technical Comfort** | Moderate - comfortable with web applications, document scanning |
| **Daily Volume** | 5-15 applications in various stages |
| **Key Pain Points** | Manual data entry from PDFs, context switching between documents, audit compliance burden |
| **Goals** | Fast, accurate data collection; reduced paperwork; clear audit trail |

### User Needs

- Quick application initialization with minimal friction
- Ability to upload documents and have AI extract relevant data
- Non-linear workflow to match how documents arrive (out of order)
- Side-by-side document viewing during audit
- Confidence scores to prioritize human review
- Exportable audit trail for compliance

---

## 4. MVP Scope

### In Scope: Core Functionality

- ✅ Analyst authentication via Clerk OTP (email/SMS, whitelist via Clerk Dashboard)
- ✅ Application CRUD (create, list, view, status management)
- ✅ Conversational AI interface as primary UI
- ✅ 9 document type upload with dedicated slots
- ✅ AI-powered document extraction via Docling OCR
- ✅ 5 data module forms (Identity, Lands, Financial, Operations, Summary)
- ✅ Progress panel tracking document/module completion status
- ✅ Dual-pane audit view (PDF left, extracted data right)
- ✅ Field-level confidence scores with <90% flagging
- ✅ Override justification capture (dropdown + audit log)
- ✅ Data certification and lock mechanism
- ✅ PDF generation of final application
- ✅ Comprehensive audit trail export

### In Scope: Technical

- ✅ Vite + React + TypeScript frontend
- ✅ Express.js + TypeScript backend
- ✅ Python FastAPI AI service (AgFin AI Bot)
- ✅ Local Supabase (supabase start) with PostgreSQL + pgvector
- ✅ Local Supabase Storage for document files (S3-compatible, runs via Docker)
- ✅ Clerk for OTP authentication (email/SMS)
- ✅ Docling for document OCR and table extraction
- ✅ Anthropic Claude with tool_runner pattern for conversational AI agent

### Out of Scope: Deferred to Future Phases

- ❌ Farmer self-service portal (external applicant flow)
- ❌ Multi-entity applications (multiple farming entities per application)
- ❌ Automated underwriting / KPI calculations (DSCR, LTV)
- ❌ JSON Rule Engine for compliance validation
- ❌ Digital signature capture (DocuSign integration)
- ❌ Mobile-native applications
- ❌ Real-time collaboration between analysts
- ❌ Integration with external CRM systems
- ❌ Automated email notifications to farmers
- ❌ Advanced analytics and reporting dashboards

---

## 5. User Stories

### Primary User Stories

**US-1: Application Creation**
> As an Analyst, I want to quickly create a new loan application with basic farmer info, so that I can begin data collection without unnecessary steps.

*Example:* Analyst clicks "CREATE NEW APPLICATION", enters farmer name, email, phone in a modal, and is immediately redirected to the conversational interface with a "PROXY MODE" banner.

**US-2: Document-First Data Collection**
> As an Analyst, I want to upload documents and have AI extract the relevant data, so that I spend less time on manual data entry.

*Example:* Analyst uploads an IRS Schedule F PDF. Within 5 seconds, the system extracts gross farm income, expenses, and tax ID, populating the corresponding module fields with confidence scores.

**US-3: Non-Linear Navigation**
> As an Analyst, I want to jump between any document slot or data module at any time, so that I can work with whatever information arrives first.

*Example:* Mid-conversation about identity details, the analyst receives the Balance Sheet via email. They click "Balance Sheet" in the Progress Panel and immediately pivot to upload it, then return to the conversation.

**US-4: AI-Assisted Guidance**
> As an Analyst, I want the AI assistant to guide me through missing data and suggest next steps, so that I don't miss any required fields.

*Example:* After uploading 6 of 9 documents, the AI says: "Great progress! You're still missing the Lease Agreement, Equipment List, and Prior Year Crop Insurance. Would you like to upload those now or continue with manual entry for the remaining fields?"

**US-5: Confidence-Based Review**
> As an Analyst, I want to see which extracted fields have low confidence scores, so that I can prioritize my review efforts.

*Example:* The Progress Panel shows "Balance Sheet" with a yellow warning icon. Clicking it reveals 3 fields with <90% confidence that require manual verification.

**US-6: Dual-Pane Audit**
> As an Analyst, I want to view the source document alongside extracted data, so that I can verify accuracy efficiently.

*Example:* In audit mode, the left pane shows the Schedule F PDF with the "Gross Income" line highlighted; the right pane shows the extracted value "$450,000" with an editable input and confidence badge "87%".

**US-7: Override Justification**
> As an Analyst, I want to be required to provide a reason when I change AI-extracted data, so that we maintain a compliant audit trail.

*Example:* Analyst changes "Gross Income" from $450,000 to $452,000. A modal appears requiring selection from: "AI Extraction Error", "Document Ambiguity", "Farmer-Provided Correction", or "Data Missing/Illegible".

**US-8: Application Export**
> As an Analyst, I want to generate a final PDF application with full audit trail, so that I can submit it for manual underwriting.

*Example:* After certification, analyst clicks "DOWNLOAD FINAL APPLICATION" and receives a ZIP containing the signed PDF and a CSV audit report detailing every field change and justification.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite + React)                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Conversation│  │   Chat Center   │  │   Artifact Panel    │  │
│  │   Sidebar   │  │ (Primary UI)    │  │ (Documents/Modules) │  │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │   Apps   │  │   Docs   │  │   AgFin AI Bot   │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │     Routes       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌───────────────┐ ┌─────────────────┐
│    Supabase      │ │  AgFin AI Bot │ │     Docling     │
│  (PostgreSQL +   │ │   (FastAPI +  │ │  (OCR Service)  │
│    Storage)      │ │    Claude)    │ │                 │
└──────────────────┘ └───────────────┘ └─────────────────┘
```

### Directory Structure (Vertical Slice Architecture)

```
agfin/
├── core/                           # Foundation infrastructure
│   ├── config.ts                   # Environment configuration
│   ├── database.ts                 # Supabase client setup
│   ├── logging.ts                  # Structured logging
│   └── middleware.ts               # Auth, CORS, error handling
│
├── shared/                         # Cross-feature utilities (3+ features)
│   ├── ui/                         # shadcn/ui primitives
│   ├── schemas/                    # Common Zod schemas
│   └── utils/                      # Date, string, validation utilities
│
├── auth/                           # Authentication slice (Clerk)
│   ├── clerk-provider.tsx          # ClerkProvider wrapper
│   ├── sign-in/                    # Clerk SignIn page with OTP
│   ├── middleware.ts               # Clerk auth middleware
│   └── index.ts
│
├── application/                    # THE CORE SLICE
│   ├── shell/                      # Three-column layout
│   │   ├── ConversationSidebar.tsx
│   │   ├── ChatCenter.tsx
│   │   ├── ProgressPanel.tsx
│   │   └── ArtifactPanel.tsx
│   │
│   ├── conversation/               # Chat feature
│   │   ├── conversation.routes.ts
│   │   ├── conversation.service.ts
│   │   ├── ChatInput.tsx
│   │   ├── MessageList.tsx
│   │   └── WelcomeScreen.tsx
│   │
│   ├── documents/                  # Document processing
│   │   ├── documents.routes.ts
│   │   ├── documents.service.ts
│   │   ├── upload/
│   │   ├── extraction/
│   │   └── types/                  # 9 document schemas
│   │
│   ├── modules/                    # 5 data modules
│   │   ├── identity/
│   │   ├── lands/
│   │   ├── financial/
│   │   ├── operations/
│   │   └── summary/
│   │
│   ├── audit/                      # Audit workflow
│   │   ├── audit.routes.ts
│   │   ├── DualPaneReview.tsx
│   │   └── JustificationModal.tsx
│   │
│   └── certification/              # Final certification
│       ├── certification.routes.ts
│       ├── CertificationView.tsx
│       └── pdf-generator.ts
│
└── dashboard/                      # Dashboard slice
    ├── DashboardPage.tsx
    └── index.ts
```

### Key Design Patterns

| Pattern | Usage |
|---------|-------|
| **Vertical Slice Architecture** | Features organized by business domain, not technical layer |
| **Three-Feature Rule** | Only extract to `shared/` when 3+ features need it |
| **Repository Pattern** | Data access abstracted through repository classes |
| **Service Layer** | Business logic isolated from routes and UI |
| **Zod Schemas** | Runtime validation for all API requests/responses |
| **React Query** | Server state management with caching |
| **Zustand** | Client state for UI concerns (panels, navigation) |

---

## 7. Tools/Features

### 7.1 Conversational AI Interface

**Purpose:** THE PRIMARY INTERFACE for all analyst-application interaction (Claude.ai-style)

**Design Philosophy:**
- Claude.ai-inspired layout: Chat is the central experience
- After login, user lands DIRECTLY on chat interface (no intermediate dashboard)
- Agent handles ALL operations through natural conversation
- Minimal chrome - let the conversation be the hero

**Core Features:**
- Natural language interface for ALL operations (create apps, upload docs, review data, certify)
- AI agent uses Anthropic tool_runner pattern (see ai_docs/anthropic-tool-use-guide.md)
- Agent tools designed per Anthropic guidelines:
  - Detailed descriptions explaining what, when, how
  - Single-purpose tools with clear input schemas
  - Proper error handling with is_error responses
- Document requests happen IN CHAT - agent prompts user to upload when needed
- Context-aware suggestions based on current application state
- Proactive prompts for missing required data

**Chat Interface Details:**
- Streaming message responses with typing indicator
- Markdown rendering with proper formatting
- Code blocks with syntax highlighting and copy button
- Message editing and regeneration capabilities
- Stop generation button during streaming
- Input field with auto-resize textarea
- Token/character count display
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

### 7.2 Document Processing Pipeline

**Purpose:** Transform unstructured documents into structured application data

**Operations:**
1. **Upload:** Secure presigned URL upload to Supabase Storage
2. **Classify:** Verify document matches selected slot type
3. **Extract:** OCR via Docling with table detection
4. **Map:** Route extracted fields to appropriate module schema
5. **Score:** Assign confidence percentage per field

**Supported Document Types:**

| Slot | Document | Key Extractions |
|------|----------|-----------------|
| 1 | Drivers License | Name, DOB, Address |
| 2 | IRS Schedule F | Gross Income, Expenses, Tax ID |
| 3 | Organization Docs | Entity Name, EIN, Partner Names |
| 4 | Balance Sheet | Assets, Liabilities, Net Worth |
| 5 | FSA 578 | Acres, Counties, Farm Numbers |
| 6 | Current Crop Insurance | APH Yields, Coverage Levels |
| 7 | Prior Crop Insurance | Historical Yields |
| 8 | Lease Agreement | Lease Terms, Rent Amounts |
| 9 | Equipment List | Equipment Items, Values |

#### Docling Processing Configuration

**Processing Options:**
| Option | Default | Description |
|--------|---------|-------------|
| OCR | Enabled | Optical character recognition for scanned documents |
| Tables | Enabled | Structured table extraction with headers and rows |
| Images | Disabled | Embedded image extraction (not needed for MVP) |

**Timeout Configuration:**
| Operation | Timeout | Notes |
|-----------|---------|-------|
| Health Check | 5 seconds | Quick service availability verification |
| Document Processing | 120 seconds | Allows for large multi-page documents |

**Retry Strategy:**
- Maximum retries: 3 attempts
- Backoff: Exponential (1s, 2s, 4s)
- Retryable errors: Network failures, timeouts, 5xx server errors, rate limits (429)

**Extraction Response Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `documentType` | string | Classified document category |
| `confidence` | number | Overall extraction confidence (0-1) |
| `fields` | array | Extracted field values with metadata |
| `tables` | array | Structured tables with headers and rows |
| `metadata` | object | Processing info (pages, time, OCR used) |

**Field Extraction Detail:**
```
{
  name: "gross_income",
  value: 125000,
  confidence: 0.94,
  boundingBox: { x, y, width, height },  // Source location in document
  page: 1
}
```

**Table Extraction Detail:**
```
{
  headers: ["Crop", "Acres", "Yield"],
  rows: [
    ["Cotton", 500, 1200],
    ["Corn", 300, 180]
  ],
  confidence: 0.91,
  page: 2
}
```

**Classification Failure Handling:**
- If document fails type validation 3 times, offer "Upload Without Validation" option
- Documents uploaded without validation are flagged for mandatory human review
- All validation attempts are logged in audit trail

### 7.3 Data Modules

**Purpose:** Structured data collection forms for loan application

| Module | Fields | Primary Sources |
|--------|--------|-----------------|
| **M1: Identity & Entity** | Applicant Name, DOB, SSN, Entity Name, EIN, Partners | DL, SF, OD |
| **M2: Lands Farmed** | Tracts, Acres (Dry/Irrigated), Counties | FSA, APP |
| **M3: Financial Statement** | Assets, Liabilities, Net Worth | BS, EL |
| **M4: Projected Operations** | Yields, Prices, Expenses, Loan Amount | APH, APY, APP |
| **M5: Summary & Ratios** | Total Income, Net Cash, Debt Service Margin | CALCULATED |

### 7.4 Progress Panel & Conversation Sidebar

**Purpose:** Real-time status tracking, navigation, and session management

**Progress Panel Features:**
- Visual status per document slot: Missing → Processing → Complete → Audited
- Visual status per module: Incomplete → In Progress → Complete
- Click-to-navigate to any document or module
- Warning indicators for low-confidence extractions
- Proxy-edit flags for analyst-modified fields

**Conversation Sidebar Features:**
- Conversation list grouped by date (Today, Yesterday, Previous 7 days, Older)
- Search conversations by content and farmer name
- Pin important application sessions to top
- Right-click context menu (rename, archive, duplicate, export)
- Auto-generate conversation title from first exchange
- Inline rename by clicking title
- Duplicate conversation for branching workflows
- Archive completed sessions (hidden by default, accessible via filter)

**Sidebar Organization:**
| Section | Content |
|---------|---------|
| Pinned | User-pinned priority sessions |
| Today | Sessions with activity today |
| Yesterday | Previous day's sessions |
| Previous 7 Days | Last week's sessions |
| Older | Grouped by month |

### 7.5 Audit Dual-Pane View

**Purpose:** Side-by-side verification of extracted data

**Features:**
- Left pane: High-fidelity PDF viewer with zoom/pan
- Right pane: Editable extracted fields with confidence badges
- Mandatory interaction for <90% confidence fields
- Override justification capture with standardized reasons
- "Mark Document Audited" gate requiring all flags resolved

### 7.6 Certification & Export

**Purpose:** Final data lock and deliverable generation

**Features:**
- Certification gate requiring all documents audited
- Immutable data lock preventing further edits
- PDF generation with all application data
- Audit trail export (CSV) with before/after values
- ZIP download of complete package

### 7.7 Artifact Panel

**Purpose:** Render forms, documents, and extracted data from chat context

**Features:**
- Slide-in panel from right when artifact generated
- Tabs for multiple open artifacts (document + form simultaneously)
- Full-screen toggle for detailed work
- Close panel to return to chat focus
- Artifact versioning (track field changes over time)
- Download/export button per artifact
- Edit/re-prompt button for iterating with AI

**Artifact Types:**
| Type | Rendering | Actions |
|------|-----------|---------|
| Document PDF | High-fidelity viewer with zoom/pan | Download, Print |
| Data Module Form | Editable form fields | Save, Cancel |
| Extraction Results | Field list with confidence badges | Confirm, Reject, Edit |
| Summary Report | Read-only formatted view | Export PDF |

### 7.8 Command Palette

**Purpose:** Quick access overlay for power users (Cmd/Ctrl+K)

**Features:**
- Fuzzy search across all commands
- Jump to any document slot instantly
- Navigate to any data module
- Switch between applications
- Access common actions without mouse

**Command Categories:**
| Category | Example Commands |
|----------|------------------|
| Navigation | "Go to Balance Sheet", "Open Module 3" |
| Documents | "Upload Schedule F", "Process pending documents" |
| Actions | "Export PDF", "Mark all audited", "Lock application" |
| Search | "Find applications by farmer name" |

### 7.9 Keyboard Shortcuts

**Purpose:** Enable efficient keyboard-driven workflows

| Action | Shortcut |
|--------|----------|
| Send message | `Enter` |
| New line in message | `Shift+Enter` |
| Open command palette | `Cmd/Ctrl+K` |
| New application | `Cmd/Ctrl+N` |
| Toggle artifact panel | `Cmd/Ctrl+\` |
| Stop AI generation | `Escape` |
| Focus chat input | `/` |
| Save current form | `Cmd/Ctrl+S` |
| Next document/module | `Cmd/Ctrl+]` |
| Previous document/module | `Cmd/Ctrl+[` |

### 7.10 Streaming & Loading States

**Purpose:** Provide clear visual feedback during async operations

**Response Streaming Flow:**
1. User sends message → Message appears immediately in chat
2. Typing indicator animates while waiting for API response
3. Response streams word-by-word with smooth text reveal
4. If document extraction triggered → Progress indicator shows percentage
5. Artifacts slide in from right when ready
6. Stop button visible and functional during generation
7. On complete → Regenerate option appears on message

**Loading State Components:**
| State | Visual Treatment |
|-------|------------------|
| Message pending | Pulsing dots typing indicator |
| Document uploading | Progress bar with percentage |
| Document processing | Spinner with "Extracting..." label |
| Form saving | Subtle spinner on save button |
| Page loading | Skeleton loaders for content areas |

### 7.11 Onboarding Experience

**Purpose:** Reduce learning curve for first-time analysts

**First-Time Flow:**
1. Welcome screen with quick platform overview (30 seconds)
2. Feature tour highlights (3-4 key capabilities):
   - Chat interface and AI guidance
   - Document upload slots
   - Progress panel navigation
   - Audit dual-pane view
3. Interactive example prompts to get started:
   - "Create a new loan application for John Smith"
   - "Upload a Schedule F document"
   - "What documents am I missing?"
   - "Show me the financial summary"
4. Dismissible tooltips on first use of each major feature
5. "Quick Tips" panel accessible from help menu

**Onboarding Persistence:**
- Track onboarding completion per user
- Allow re-triggering tour from Settings
- Show contextual tips for unused features after 3 sessions

### 7.12 Design System (Agrellus Brand)

**Brand Reference:** See `specs/ai_docs/AgBrandSkill.md` for complete brand guidelines.

**Theme:** Dark-first (optimized for extended screen use)

#### Color Palette

**Primary Colors:**
| Name | Hex | Usage |
|------|-----|-------|
| **Agrellus Green** | `#30714C` | Primary CTAs, links, success states, accent borders |
| **Wheat Gold** | `#DDC66F` | Highlights, premium features, attention indicators |

**Dark Theme (Primary):**
| Element | Hex | Usage |
|---------|-----|-------|
| Background Dark | `#061623` | Primary application background |
| Background Card | `#0D2233` | Cards, panels, elevated surfaces |
| Background Subtle | `#193B28` | Green-tinted panels, sidebar |
| Border | `#193B28` | Card borders, dividers |
| Border Light | `#E3E3E3` | Input borders on light surfaces |

**Light Theme (Document/Forms):**
| Element | Hex | Usage |
|---------|-----|-------|
| Background | `#FFFFFF` | Form backgrounds, document viewer |
| Background Subtle | `#F7F7F7` | Alternating rows, sections |

**Text Colors:**
| Element | Hex | Context |
|---------|-----|---------|
| Text Primary | `#FFFFFF` | On dark backgrounds |
| Text Primary | `#061623` | On light backgrounds |
| Text Secondary | `#585C60` | Muted, helper text |

**Semantic Colors:**
| State | Background | Border | Text |
|-------|------------|--------|------|
| Success | `#F0FDF4` | `#30714C` | `#30714C` |
| Warning | `#FFF3CD` | `#D6A800` | `#856404` |
| Error | `#FFEDED` | `#C1201C` | `#C1201C` |

#### Typography

**Font Stack:**
```css
/* Primary */
font-family: 'Lato', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace (code, IDs, amounts) */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

**Type Scale:**
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display | 36px | 700 | 1.2 |
| H1 | 28px | 700 | 1.25 |
| H2 | 24px | 700 | 1.3 |
| H3 | 20px | 600 | 1.35 |
| H4 | 18px | 600 | 1.4 |
| Body Large | 16px | 400 | 1.5 |
| Body | 14px | 400 | 1.5 |
| Caption | 12px | 400 | 1.4 |

#### Component Specifications

**Buttons:**
| Type | Background | Text | Border |
|------|------------|------|--------|
| Primary | `#30714C` | `#FFFFFF` | none |
| Primary Hover | `#265d3d` | `#FFFFFF` | none |
| Secondary | transparent | `#30714C` | 1.5px `#30714C` |
| Destructive | `#C1201C` | `#FFFFFF` | none |
| Ghost | transparent | `#FFFFFF` | none |

**Button Styling:**
- Border radius: 8px
- Padding: 10px 16px
- Font weight: 600
- Font size: 14px

**Cards:**
| Variant | Background | Border | Radius |
|---------|------------|--------|--------|
| Dark (default) | `#0D2233` | 1px `#193B28` | 12px |
| Light | `#F7F7F7` | 1px `#E3E3E3` | 8px |
| Elevated | `#0D2233` | none | 12px + shadow |

**Inputs:**
- Background: `#FFFFFF`
- Border: 1px `#E3E3E3`
- Border radius: 6px
- Padding: 12px 16px
- Focus: border `#30714C`, shadow `0 0 0 2px rgba(48, 113, 76, 0.1)`

**Chat Messages:**
| Type | Background | Text | Alignment |
|------|------------|------|-----------|
| User | `#30714C` | `#FFFFFF` | Right |
| Assistant | `#0D2233` | `#FFFFFF` | Left |

#### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, inline |
| sm | 8px | Small gaps, icon margins |
| md | 12px | Default component padding |
| lg | 16px | Section padding |
| xl | 20px | Large sections |
| 2xl | 24px | Card padding, major sections |
| 3xl | 32px | Page sections |

#### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Tags, small buttons |
| md | 6px | Inputs, standard buttons |
| lg | 8px | Cards, alerts |
| xl | 12px | Large cards, modals |
| full | 9999px | Pills, avatars |

#### Shadows

```css
/* Subtle elevation */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Card elevation */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Modal/Dropdown */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

#### Application Layout

**Three-Column Layout:**
```
┌──────────────┬─────────────────────────┬──────────────────┐
│ Conversation │                         │                  │
│   Sidebar    │      Chat Center        │  Artifact Panel  │
│   (280px)    │       (flex-1)          │     (400px)      │
│              │                         │                  │
│ bg: #061623  │      bg: #061623        │   bg: #0D2233    │
│              │                         │                  │
└──────────────┴─────────────────────────┴──────────────────┘
```

**Sidebar Header:**
- Background: `#30714C`
- Contains: Logo (white fill), app name
- Height: 64px

**Chat Header:**
- Background: `#0D2233`
- Contains: Application title, status badge, actions

### 7.13 Memory Architecture

**Purpose:** Provide persistent, context-aware memory for the conversational AI agent

**Dual-Storage Strategy:**

The system uses two complementary storage mechanisms for conversation context:

| Storage Type | Purpose | Persistence |
|--------------|---------|-------------|
| **Session History** | Chronological message log for conversation replay | Per-session, database-backed |
| **Semantic Memory (mem0)** | Long-term knowledge extraction and retrieval | Per-user, vector-indexed |

**Semantic Memory (mem0):**

mem0 provides intelligent memory that understands context and relationships, not just stores messages:

- **Automatic Extraction:** Key facts, preferences, and context are extracted from conversations
- **Semantic Search:** Relevant memories are retrieved based on meaning, not keywords
- **Cross-Session Persistence:** Important context carries across multiple sessions
- **User-Scoped:** Each analyst has their own memory space

**Memory Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Vector Store | Supabase pgvector | PostgreSQL-native vector storage |
| Embedding Model | text-embedding-3-small | OpenAI embedding generation |
| Embedding Dimensions | 1536 | Vector size for semantic matching |
| Collection Name | agfin_ai_bot_memories | Isolated memory namespace |

**Memory Flow:**

```
User Message
     ↓
┌─────────────────────────────────────────┐
│  1. Search semantic memory for context  │
│  2. Retrieve relevant past memories     │
│  3. Inject context into AI prompt       │
│  4. Generate response                   │
│  5. Extract new memories from exchange  │
│  6. Store in vector database            │
└─────────────────────────────────────────┘
     ↓
AI Response (context-aware)
```

**Memory Use Cases:**

| Scenario | Memory Benefit |
|----------|----------------|
| Analyst returns to application after break | AI recalls where they left off |
| Analyst mentions preference ("I prefer to start with Schedule F") | Preference remembered for future sessions |
| Application-specific context | AI recalls farmer name, crop types without re-asking |
| Common corrections | AI learns analyst's correction patterns |

**Session History vs Semantic Memory:**

| Aspect | Session History | Semantic Memory |
|--------|-----------------|-----------------|
| Storage | Relational tables | Vector embeddings |
| Query | Sequential retrieval | Similarity search |
| Scope | Single session | Cross-session |
| Content | Full messages | Extracted facts |
| Use | Conversation display | Context injection |

---

## 8. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Vite | 5.x | Build tool and dev server |
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| React Router | 6.x | Routing |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component library |
| Framer Motion | 10.x | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Zod | 3.x | Request validation |

### AI Service
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.100+ | Web framework |
| Pydantic | 2.x | Data validation |
| Anthropic SDK | latest | Claude API client |
| OpenAI SDK | latest | Embeddings for mem0 |
| mem0 | latest | Semantic conversation memory |

**mem0 Integration Details:**

| Component | Configuration |
|-----------|---------------|
| LLM Provider | OpenAI (gpt-4o) |
| LLM Temperature | 0.2 (low for consistency) |
| Embedder | OpenAI text-embedding-3-small |
| Vector Store | Supabase pgvector |
| Collection | Isolated per environment |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Local Supabase | PostgreSQL database + Storage (via supabase start) |
| Clerk | OTP authentication (email/SMS) with whitelist |
| Docling | Document OCR and extraction |
| Docker | Container orchestration for Supabase and Docling |

---

## 9. Security & Configuration

### Authentication (Clerk)
- **Provider:** Clerk (see ai_docs/clerk-otp-authentication.md)
- **Method:** Email/SMS OTP (One-Time Password)
- **Whitelist:** Only pre-approved analyst emails via Clerk Dashboard
- **Session:** Clerk JWT tokens with automatic 60-second refresh
- **Security:** bcrypt hashing, HaveIBeenPwned integration, NIST 800-63B compliance

### Authorization
- **Roles:** Analyst (MVP), Admin, Underwriter (future)
- **Scope:** Analysts only see their own applications
- **Audit:** All actions tied to analyst ID

### Configuration (Environment Variables)

```bash
# Local Supabase (from supabase start output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend (Vite)
CLERK_SECRET_KEY=sk_test_...            # Backend (Express)

# AI Service
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # For mem0 embeddings
AGFIN_AI_BOT_URL=http://localhost:8000

# Document Processing
DOCLING_URL=http://localhost:5001

# Application
NODE_ENV=development
PORT=3001
```

### Security Scope

**In Scope:**
- ✅ Encrypted storage for SSN, EIN fields (AES-256)
- ✅ Secure presigned URLs for document upload
- ✅ HTTPS in production
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention via parameterized queries

**Out of Scope:**
- ❌ SOC 2 compliance (future)
- ❌ HIPAA compliance (not applicable)
- ❌ Penetration testing (future)

---

## 10. API Specification

### Authentication

```
POST /api/auth/request-otp
Body: { "email": "analyst@lender.com" }
Response: { "success": true, "message": "OTP sent" }

POST /api/auth/verify-otp
Body: { "email": "analyst@lender.com", "otp": "123456" }
Response: { "access_token": "eyJ...", "user": { "id": "...", "email": "..." } }
```

### Applications

```
GET /api/applications
Response: { "applications": [...], "total": 50 }

POST /api/applications
Body: { "farmer_name": "...", "farmer_email": "...", "farmer_phone": "..." }
Response: { "id": "uuid", "status": "draft" }

GET /api/applications/:id
Response: { "id": "...", "status": "...", "modules": {...}, "documents": [...] }

PATCH /api/applications/:id/status
Body: { "status": "awaiting_audit" }
Response: { "success": true }
```

### Documents

```
POST /api/documents/upload-url
Body: { "application_id": "...", "document_type": "schedule_f", "filename": "..." }
Response: { "upload_url": "https://...", "document_id": "..." }

POST /api/documents/:id/process
Response: { "status": "processing" }

GET /api/documents/:id/extraction
Response: { "fields": [...], "confidence_scores": {...} }
```

### AgFin AI Bot

```
POST /api/agfin-ai-bot/chat
Body: { "message": "...", "session_id": "...", "application_id": "..." }
Response: { "response": "...", "artifacts": [...] }

GET /api/agfin-ai-bot/sessions
Response: { "sessions": [...] }

POST /api/agfin-ai-bot/sessions
Body: { "application_id": "..." }
Response: { "session_id": "..." }
```

### Audit

```
POST /api/audit/:document_id/override
Body: {
  "field_id": "gross_income",
  "old_value": "450000",
  "new_value": "452000",
  "justification": "ai_extraction_error"
}
Response: { "audit_entry_id": "..." }

POST /api/audit/:document_id/mark-audited
Response: { "success": true }
```

---

## 11. Success Criteria

### MVP Success Definition
The MVP is successful when an analyst can complete the full workflow: create application → upload documents → review AI extractions → audit data → certify → export PDF, with a complete audit trail.

### Functional Requirements

- ✅ Analyst can create new application in <30 seconds
- ✅ Document upload triggers AI extraction within 5 seconds
- ✅ All 9 document types supported with field mapping
- ✅ All 5 data modules can be populated (manual or extracted)
- ✅ Progress panel accurately reflects completion status
- ✅ Dual-pane audit view renders PDF and data side-by-side
- ✅ Override justification is mandatory and logged
- ✅ Data lock prevents post-certification edits
- ✅ PDF export contains all application data
- ✅ Audit trail export contains all changes with justifications

### Quality Indicators

- Field-level confidence scoring accuracy >85%
- Context-switch latency <300ms
- Auto-save reliability 100%
- Zero data loss on browser refresh
- Audit trail completeness 100%

### User Experience Goals

- Analyst can complete simple application in <30 minutes
- Non-linear navigation feels seamless
- AI suggestions are helpful, not intrusive
- Confidence flags clearly guide review priority

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Full Tab, Enter, Escape support for all interactions |
| Screen Reader | ARIA labels and roles on all interactive elements |
| Focus Management | Visible focus rings, logical focus order |
| High Contrast | Support for high-contrast mode preference |
| Reduced Motion | Respect `prefers-reduced-motion` for animations |
| Touch Targets | Minimum 44x44px touch targets on mobile |
| Color Independence | No information conveyed by color alone |

### Responsive Design Requirements

**Breakpoint Definitions:**

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | <768px | Single column: Chat only, panels as slide-over modals |
| Tablet | 768-1024px | Two column: Collapsible sidebar, Chat + Artifact |
| Desktop | >1024px | Three column: Full layout with all panels visible |

**Mobile Adaptations:**
- Collapsible sidebar with hamburger menu
- Swipe gestures for panel navigation (left = sidebar, right = artifact)
- Bottom sheet for document upload
- Floating action button for quick actions
- Simplified progress indicators

**Tablet Adaptations:**
- Sidebar hidden by default, accessible via toggle
- Artifact panel overlays chat when open
- Touch-optimized form controls
- Larger tap targets for buttons

---

## 12. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal:** Establish the technical foundation and basic application flow

**Deliverables:**
- ✅ VSA directory structure setup
- ✅ Authentication (OTP login)
- ✅ Application CRUD
- ✅ Basic three-column layout shell
- ✅ Conversation sidebar with session list
- ✅ Database schema for applications, documents, modules

**Validation:**
- Analyst can log in and create an application
- Application appears in list view
- Basic navigation between sections works

### Phase 2: Document Pipeline (AI Extraction)

**Goal:** Implement document upload and AI extraction pipeline

**Deliverables:**
- ✅ Document upload to Supabase Storage
- ✅ Docling integration for OCR
- ✅ Field extraction for all 9 document types
- ✅ Confidence score calculation
- ✅ Progress panel with document status
- ✅ Document viewer component

**Validation:**
- Upload Schedule F → See extracted income/expense fields
- Confidence scores display correctly
- Progress panel updates in real-time

### Phase 3: Conversational Interface (AI Chat)

**Goal:** Implement the conversational AI as primary interface

**Deliverables:**
- ✅ AgFin AI Bot chat integration
- ✅ Welcome screen with suggested prompts
- ✅ Context-aware conversation (knows application state)
- ✅ Proactive prompts for missing data
- ✅ Artifact panel for forms/documents from chat
- ✅ Data module forms (5 modules)

**Validation:**
- AI guides analyst through missing fields
- Module forms open in artifact panel from chat
- Data saves correctly to application

### Phase 4: Audit & Certification (Compliance)

**Goal:** Implement audit workflow and final certification

**Deliverables:**
- ✅ Dual-pane audit view
- ✅ Override justification modal
- ✅ Immutable audit trail logging
- ✅ Certification gate (all docs audited)
- ✅ Data lock mechanism
- ✅ PDF generation
- ✅ Export package (PDF + audit CSV)

**Validation:**
- Full workflow completion end-to-end
- Audit trail contains all changes
- PDF contains accurate data
- Locked data cannot be modified

---

## 13. Future Considerations

### Post-MVP Enhancements

- **Farmer Self-Service Portal:** External applicant flow with magic link authentication
- **Multi-Entity Support:** Multiple farming entities per application
- **Automated Underwriting:** DSCR, LTV, and risk scoring calculations
- **Digital Signatures:** DocuSign integration for e-signatures
- **Mobile App:** React Native application for field use

### Integration Opportunities

- **CRM Integration:** Salesforce, HubSpot connector for lead management
- **Accounting Software:** QuickBooks, Xero for financial data import
- **USDA APIs:** FSA data verification, program payment lookups
- **Credit Bureaus:** Automated credit pull integration

### Advanced Features

- **Collaborative Editing:** Multiple analysts on same application
- **Workflow Automation:** Auto-assignment, SLA tracking
- **Advanced Analytics:** Pipeline forecasting, analyst performance
- **Custom Document Types:** User-defined extraction templates
- **AI Model Fine-Tuning:** Domain-specific extraction models

---

## 14. Risks & Mitigations

### Risk 1: AI Extraction Accuracy
**Risk:** Docling OCR may not accurately extract data from poor-quality scans or non-standard document formats.

**Mitigation:**
- Implement confidence scoring with <90% threshold for human review
- "Upload Without Validation" fallback after 3 failed attempts
- Clear UI indicators for fields requiring manual verification

### Risk 2: Scope Creep
**Risk:** Pressure to add multi-entity support or underwriting calculations before MVP completion.

**Mitigation:**
- Strict MVP scope documented and approved
- "Out of Scope" items clearly listed
- Phase-gated development with validation gates

### Risk 3: Performance with Large Documents
**Risk:** Large PDF files (50+ pages) may cause slow extraction or UI lag.

**Mitigation:**
- Asynchronous extraction with status polling
- Document size limits (25MB max)
- Chunked processing for large documents

### Risk 4: Audit Trail Integrity
**Risk:** Audit log data could be corrupted or incomplete, causing compliance issues.

**Mitigation:**
- Write-once, append-only audit table design
- Transaction-level commits for all audit entries
- Regular audit log integrity checks

### Risk 5: Conversation Context Loss
**Risk:** AI assistant may lose context in long conversations, providing irrelevant suggestions.

**Mitigation:**
- mem0 integration for persistent conversation memory
- Session-scoped context with application state injection
- Clear session reset option for fresh start

---

## 15. Appendix

### Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Product Narrative | `docs/Product Narrative - Data Collection (MVP - Analyst Only).md` | Detailed user journey |
| Enhanced App Spec | `docs/enhanced_agfin_app_spec.txt` | UI/UX specifications |
| VSA Setup Guide | `docs/vertical-slice-setup-guide-full.md` | Architecture patterns |
| VSA Patterns | `docs/vsa-patterns.md` | Code organization |
| **Agrellus Brand Guide** | `specs/ai_docs/AgBrandSkill.md` | Brand colors, typography, components |

### Database Schema (Core Tables)

```sql
-- Applications
applications (
  id UUID PRIMARY KEY,
  analyst_id UUID REFERENCES users(id),
  farmer_name TEXT NOT NULL,
  farmer_email TEXT NOT NULL,
  farmer_phone TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Documents
documents (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  document_type TEXT NOT NULL,
  storage_path TEXT,
  extraction_status TEXT DEFAULT 'pending',
  confidence_score DECIMAL,
  created_at TIMESTAMPTZ
)

-- Module Data
module_data (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  module_number INT,
  field_id TEXT,
  value JSONB,
  source TEXT, -- 'ai_extracted', 'proxy_entered', 'proxy_edited', 'auditor_verified'
  source_document_id UUID REFERENCES documents(id),
  confidence_score DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Audit Trail
audit_trail (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  user_id UUID REFERENCES users(id),
  field_id TEXT,
  old_value TEXT,
  new_value TEXT,
  justification TEXT,
  action TEXT,
  created_at TIMESTAMPTZ
)

-- Conversations
agfin_ai_bot_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  application_id UUID REFERENCES applications(id),
  title TEXT,
  workflow_mode TEXT DEFAULT 'continue',
  created_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ
)
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 3001 | http://localhost:3001 |
| AgFin AI Bot | 8000 | http://localhost:8000 |
| Docling | 5001 | http://localhost:5001 |

### Docling Service Configuration

**Docker Image:** `quay.io/docling-project/docling-serve:latest`

**Environment Variables:**
```bash
DOCLING_HOST=0.0.0.0
DOCLING_PORT=5001
LOG_LEVEL=info
```

**Health Check:**
```bash
curl http://localhost:5001/health
```

**Docker Compose Example:**
```yaml
docling:
  image: quay.io/docling-project/docling-serve:latest
  ports:
    - "5001:5001"
  environment:
    - DOCLING_HOST=0.0.0.0
    - DOCLING_PORT=5001
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Animation & Transition Guidelines

**Timing Standards:**

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interactions (hover, focus) | 150ms | ease-out |
| Panel transitions (slide in/out) | 200ms | ease-in-out |
| Page transitions | 300ms | ease-in-out |
| Loading spinners | Continuous | linear |

**Animation Specifications:**

| Element | Animation | Notes |
|---------|-----------|-------|
| Message fade-in | Opacity 0→1, translateY 8px→0 | 150ms delay between messages |
| Typing indicator | 3 pulsing dots | 1.2s loop, staggered 200ms |
| Artifact panel slide | translateX 100%→0 | From right edge |
| Sidebar slide | translateX -100%→0 | From left edge |
| Modal overlay | Opacity 0→1, scale 0.95→1 | Backdrop blur increases |
| Toast notification | translateY 100%→0 | Auto-dismiss after 4s |
| Progress bar | Width transition | Smooth percentage updates |
| Skeleton loaders | Shimmer gradient | Left-to-right pulse |

**Motion Principles:**
- Prefer transforms over layout-triggering properties
- Use `will-change` sparingly for GPU optimization
- Respect `prefers-reduced-motion`: disable non-essential animations
- Ensure animations don't block user interaction
- Loading states should appear within 100ms of action

**Framer Motion Defaults:**
```javascript
const transitions = {
  panel: { type: "spring", stiffness: 300, damping: 30 },
  fade: { duration: 0.15, ease: "easeOut" },
  slide: { duration: 0.2, ease: "easeInOut" }
};
```

---

*This PRD serves as the source of truth for AgFin MVP development. All implementation decisions should align with the scope, architecture, and patterns defined herein.*
