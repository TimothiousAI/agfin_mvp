# AgFin Crop Finance MVP - Application Specification

**Generated from:** `PRD-AgFin-MVP.md`
**Date:** January 2026
**Version:** 1.0

> **Note to Initializer Agent:** This specification is accompanied by:
> - **Product Requirements Document** (`PRD-AgFin-MVP.md`) - Business context, user stories, acceptance criteria
> - **Brand Guidelines** (`AgBrandSkill.md`) - Complete Agrellus brand styling reference
> - **AI Agent Reference** (`ai_docs/`) - Anthropic tool use guidelines, agent best practices, and Clerk OTP documentation
>
> Please read these documents for comprehensive context before creating the project roadmap.

---

```xml
<project_specification>
  <project_name>AgFin Crop Finance MVP</project_name>

  <overview>
    AgFin is an AI-powered crop loan application platform designed for agricultural lenders, implementing an Analyst-as-Proxy workflow where loan analysts collect, validate, and audit farmer application data through a conversational AI interface backed by intelligent document extraction. The platform transforms unstructured financial documents (IRS Schedule F, Balance Sheets, Crop Insurance policies) into structured loan application data through Docling-powered OCR. Analysts interact primarily through a chat interface that guides them through data collection while providing non-linear navigation to any of the 9 required document types or 5 data modules. The MVP delivers a functional Analyst Portal enabling complete loan application data collection, AI-assisted document extraction with confidence scoring, compliance-ready audit trails with mandatory justifications, and PDF generation for manual underwriting.
  </overview>

  <technology_stack>
    <frontend>
      <framework>Vite 5.x + React 18.x + TypeScript 5.x</framework>
      <styling>Tailwind CSS 3.x with Agrellus brand colors (#30714C primary)</styling>
      <state_management>TanStack Query 5.x (server state) + Zustand 4.x (client state)</state_management>
      <routing>React Router 6.x</routing>
      <forms>React Hook Form 7.x + Zod 3.x validation</forms>
      <components>shadcn/ui (Radix UI primitives)</components>
      <animations>Framer Motion 10.x</animations>
      <port>5173</port>
    </frontend>
    <backend>
      <runtime>Node.js 20.x LTS + Express.js 4.x + TypeScript 5.x</runtime>
      <database>Local Supabase (supabase start) with PostgreSQL + pgvector extension</database>
      <storage>Local Supabase Storage (S3-compatible, runs locally via Docker)</storage>
      <auth>Clerk (OTP email/SMS, whitelist-based via Clerk Dashboard)</auth>
      <validation>Zod 3.x request validation</validation>
      <port>3001</port>
    </backend>
    <ai_service>
      <runtime>Python 3.11+ + FastAPI 0.100+</runtime>
      <llm>Anthropic Claude via SDK with tool_runner pattern</llm>
      <memory>mem0 with local Supabase pgvector backend</memory>
      <embeddings>OpenAI text-embedding-3-small (1536 dimensions)</embeddings>
      <framework>Anthropic SDK tool_runner (beta) - see ai_docs/anthropic-tool-use-guide.md</framework>
      <tool_design>Follow Anthropic agent tool guidelines - detailed descriptions, single-purpose tools, proper error handling</tool_design>
      <port>8000</port>
    </ai_service>
    <document_processing>
      <service>Docling (quay.io/docling-project/docling-serve:latest)</service>
      <capabilities>OCR, table extraction</capabilities>
      <timeout>120 seconds per document</timeout>
      <port>5001</port>
    </document_processing>
    <communication>
      <api>REST API with Zod-validated endpoints</api>
      <realtime>Server-Sent Events (SSE) for streaming AI responses</realtime>
    </communication>
  </technology_stack>

  <prerequisites>
    <environment_setup>
      - Node.js 20.x LTS installed
      - Python 3.11+ installed
      - Docker and Docker Compose for local Supabase and Docling service
      - Supabase CLI installed (npx supabase init, npx supabase start)
      - Local Supabase running with pgvector extension enabled
      - Clerk account with application configured for OTP (email/SMS)
      - API keys configured:
        - SUPABASE_URL=http://localhost:54321 (local Supabase)
        - SUPABASE_ANON_KEY (from supabase start output)
        - SUPABASE_SERVICE_ROLE_KEY (from supabase start output)
        - VITE_CLERK_PUBLISHABLE_KEY (frontend)
        - CLERK_SECRET_KEY (backend)
        - ANTHROPIC_API_KEY (for Claude)
        - OPENAI_API_KEY (for embeddings/mem0)
      - Analyst email whitelist configured in Clerk Dashboard
    </environment_setup>
    <directory_structure>
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
      │   ├── documents/                  # Document processing
      │   ├── modules/                    # 5 data modules
      │   ├── audit/                      # Audit workflow
      │   └── certification/              # Final certification
      │
      └── dashboard/                      # Dashboard slice
    </directory_structure>
  </prerequisites>

  <core_features>
    <authentication>
      - Clerk OTP email/SMS-based passwordless login (see ai_docs/clerk-otp-authentication.md)
      - Whitelist-controlled analyst access via Clerk Dashboard
      - Clerk JWT session tokens with automatic refresh
      - Protected routes via Clerk middleware (clerkMiddleware)
      - After successful login, redirect directly to chat interface (Claude.ai-style UX)
    </authentication>
    <application_management>
      - Create new loan applications with farmer info (name, email, phone)
      - List all analyst's applications with status filtering
      - View application detail with all documents and modules
      - Status progression: draft → awaiting_documents → awaiting_audit → certified → locked
    </application_management>
    <conversational_ai>
      - Claude.ai-style chat interface as THE PRIMARY UI (no separate dashboard - chat IS the app)
      - After login, user lands directly on chat - AI agent handles all actions
      - Natural language interface for ALL operations (create apps, upload docs, review data, certify)
      - AI agent uses Anthropic tool_runner pattern with well-designed tools
      - Tools designed per Anthropic guidelines (see ai_docs/anthropic-tool-use-guide.md):
        - Detailed descriptions explaining what, when, how for each tool
        - Single-purpose tools with clear input schemas
        - Proper error handling with is_error responses
        - Parallel tool execution for independent operations
      - Agent tools include: query_application, upload_document, extract_fields, update_module, request_audit, certify_application
      - Document requests happen IN CHAT - agent prompts user to upload when needed
      - Streaming message responses with typing indicator
      - Proactive prompts for missing required data
      - mem0 semantic memory for cross-session context
    </conversational_ai>
    <document_processing>
      - 9 document type slots with dedicated upload
      - Drag-and-drop upload to Supabase Storage via presigned URLs
      - Docling OCR extraction with table detection
      - Field-level confidence scoring (90% auto-accept threshold)
      - Document-to-module field mapping
      - Classification failure handling (3 attempts, then bypass option)
    </document_processing>
    <data_modules>
      - M1: Identity & Entity (name, DOB, SSN, entity, EIN, partners)
      - M2: Lands Farmed (tracts, acres dry/irrigated, counties)
      - M3: Financial Statement (assets, liabilities, net worth)
      - M4: Projected Operations (yields, prices, expenses, loan amount)
      - M5: Summary & Ratios (calculated: total income, net cash, DSCR)
      - Data source tracking: ai_extracted, proxy_entered, proxy_edited, auditor_verified
    </data_modules>
    <audit_workflow>
      - Dual-pane view: PDF left, extracted fields right
      - Mandatory interaction for fields below 90% confidence
      - Override justification capture with 4 standardized reasons
      - Mark document audited gate (all flags resolved)
      - Immutable audit trail logging
    </audit_workflow>
    <certification_and_export>
      - Certification gate requiring all documents audited
      - Certification statement checkbox with legal language
      - Immutable data lock preventing further edits
      - PDF generation with all application data
      - Audit trail CSV export with before/after values
      - ZIP download of complete package
    </certification_and_export>
    <navigation_and_ux>
      - Three-column layout: Sidebar (280px) + Chat Center (flex) + Artifact Panel (400px)
      - Conversation sidebar with session grouping by date
      - Progress panel showing document/module status
      - Non-linear navigation to any document or module
      - Command palette (Cmd/Ctrl+K) for power users
      - Keyboard shortcuts for common actions
    </navigation_and_ux>
  </core_features>

  <database_schema>
    <tables>
      <users>
        - id: UUID PRIMARY KEY
        - email: TEXT UNIQUE NOT NULL
        - role: TEXT DEFAULT 'analyst'
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - Note: Managed by Supabase Auth
      </users>
      <applications>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - analyst_id: UUID REFERENCES auth.users(id) NOT NULL
        - farmer_name: TEXT NOT NULL
        - farmer_email: TEXT NOT NULL
        - farmer_phone: TEXT
        - status: TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_documents', 'awaiting_audit', 'certified', 'locked'))
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - updated_at: TIMESTAMPTZ DEFAULT NOW()
        - RLS: Analysts see only their own applications
      </applications>
      <documents>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - application_id: UUID REFERENCES applications(id) ON DELETE CASCADE
        - document_type: TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'schedule_f', 'organization_docs', 'balance_sheet', 'fsa_578', 'current_crop_insurance', 'prior_crop_insurance', 'lease_agreement', 'equipment_list'))
        - storage_path: TEXT
        - extraction_status: TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'processed', 'audited', 'error'))
        - confidence_score: DECIMAL(5,4)
        - metadata: JSONB
        - created_at: TIMESTAMPTZ DEFAULT NOW()
      </documents>
      <module_data>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - application_id: UUID REFERENCES applications(id) ON DELETE CASCADE
        - module_number: INT NOT NULL CHECK (module_number BETWEEN 1 AND 5)
        - field_id: TEXT NOT NULL
        - value: JSONB NOT NULL
        - source: TEXT NOT NULL CHECK (source IN ('ai_extracted', 'proxy_entered', 'proxy_edited', 'auditor_verified'))
        - source_document_id: UUID REFERENCES documents(id)
        - confidence_score: DECIMAL(5,4)
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - updated_at: TIMESTAMPTZ DEFAULT NOW()
        - UNIQUE(application_id, module_number, field_id)
      </module_data>
      <audit_trail>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - application_id: UUID REFERENCES applications(id) ON DELETE CASCADE
        - user_id: UUID REFERENCES auth.users(id) NOT NULL
        - field_id: TEXT
        - old_value: TEXT
        - new_value: TEXT
        - justification: TEXT CHECK (justification IN ('ai_extraction_error', 'document_ambiguity', 'farmer_provided_correction', 'data_missing_illegible'))
        - action: TEXT NOT NULL
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - Note: Write-once, append-only design. Justification MANDATORY for field overrides.
      </audit_trail>
      <agfin_ai_bot_sessions>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - user_id: UUID REFERENCES auth.users(id) NOT NULL
        - application_id: UUID REFERENCES applications(id)
        - title: TEXT
        - workflow_mode: TEXT DEFAULT 'continue'
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - last_message_at: TIMESTAMPTZ DEFAULT NOW()
      </agfin_ai_bot_sessions>
      <agfin_ai_bot_messages>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - session_id: UUID REFERENCES agfin_ai_bot_sessions(id) ON DELETE CASCADE
        - role: TEXT NOT NULL CHECK (role IN ('user', 'assistant'))
        - content: TEXT NOT NULL
        - created_at: TIMESTAMPTZ DEFAULT NOW()
      </agfin_ai_bot_messages>
      <agfin_ai_bot_memories>
        - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        - user_id: UUID REFERENCES auth.users(id)
        - content: TEXT NOT NULL
        - embedding: vector(1536)
        - metadata: JSONB
        - created_at: TIMESTAMPTZ DEFAULT NOW()
        - INDEX: ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
      </agfin_ai_bot_memories>
    </tables>
    <row_level_security>
      - applications: SELECT/INSERT/UPDATE/DELETE WHERE analyst_id = auth.uid()
      - documents: Via application ownership
      - module_data: Via application ownership
      - audit_trail: SELECT via application ownership, INSERT requires auth
      - agfin_ai_bot_sessions: WHERE user_id = auth.uid()
    </row_level_security>
  </database_schema>

  <api_endpoints_summary>
    <authentication>
      - Authentication handled entirely by Clerk SDK (no custom endpoints)
      - Clerk middleware validates JWT on all protected routes
      - See ai_docs/clerk-otp-authentication.md for implementation details
    </authentication>
    <applications>
      - GET /api/applications - List analyst's applications
      - POST /api/applications - Create new application
      - GET /api/applications/:id - Get application with documents and modules
      - PATCH /api/applications/:id/status - Update application status
    </applications>
    <documents>
      - POST /api/documents/upload-url - Get presigned upload URL
      - POST /api/documents/:id/process - Trigger Docling extraction
      - GET /api/documents/:id/extraction - Get extracted fields
      - GET /api/documents/:id - Get document metadata
    </documents>
    <modules>
      - GET /api/modules/:applicationId/:moduleNumber - Get module data
      - PUT /api/modules/:applicationId/:moduleNumber/:fieldId - Update field
    </modules>
    <agfin_ai_bot>
      - POST /api/agfin-ai-bot/chat - Send message (non-streaming)
      - POST /api/agfin-ai-bot/stream - Send message (SSE streaming)
      - GET /api/agfin-ai-bot/sessions - List user's sessions
      - POST /api/agfin-ai-bot/sessions - Create new session
    </agfin_ai_bot>
    <audit>
      - POST /api/audit/:documentId/override - Log field override with justification
      - POST /api/audit/:documentId/mark-audited - Mark document as audited
      - GET /api/audit/:applicationId - Get audit trail for application
    </audit>
    <certification>
      - POST /api/certification/:applicationId/certify - Certify and lock application
      - GET /api/certification/:applicationId/pdf - Generate PDF
      - GET /api/certification/:applicationId/export - Download ZIP package
    </certification>
  </api_endpoints_summary>

  <ui_layout>
    <design_inspiration>
      Claude.ai-style interface - chat is the primary and central experience:
      - Clean, focused chat interface as the main workspace
      - After login, user lands DIRECTLY on chat (no intermediate dashboard)
      - Minimal chrome - let the conversation be the hero
      - Side panels for context (conversations, artifacts) but chat is always center stage
      - Agent handles all actions through natural conversation
    </design_inspiration>
    <main_structure>
      Three-column layout similar to Claude.ai:
      - Conversation Sidebar (280px fixed, collapsible): Session list, search, pinning - like Claude.ai's left sidebar
      - Chat Center (flex-grow): THE PRIMARY UI - all interactions happen here
      - Artifact Panel (400px collapsible): Forms, documents, extraction results - slides in when needed
      Dark theme default (#061623 background) for extended screen use
      Login → Chat (no intermediate screens)
    </main_structure>
    <component_regions>
      <sidebar>
        - Header: Agrellus logo on #30714C background (64px height)
        - Session list grouped by date (Today, Yesterday, Previous 7 Days, Older)
        - Search input for filtering conversations
        - Pin/archive functionality via right-click context menu
      </sidebar>
      <chat_center>
        - Header: Current application context (if any), minimal - like Claude.ai header
        - MessageList: Scrollable conversation with user/assistant styling (Claude.ai bubble style)
        - ChatInput: Auto-resize textarea with send button, Shift+Enter for newline - bottom-anchored like Claude.ai
        - WelcomeScreen: Empty state with suggested prompts ("Start a new loan application", "Upload a document", "Check application status")
        - TypingIndicator: 3 pulsing dots during AI response
        - Document Upload Zone: Inline dropzone that appears when agent requests documents
        - Agent can trigger artifact panel to show forms/documents while continuing conversation
      </chat_center>
      <artifact_panel>
        - Tab bar for multiple open artifacts
        - Full-screen toggle button
        - Content area: Document viewer, module forms, extraction preview
        - Download/export button per artifact
      </artifact_panel>
      <progress_panel>
        - Document slots (1-9) with status indicators
        - Module completion (1-5) with percentage
        - Click-to-navigate to any item
        - Warning badges for low confidence fields
      </progress_panel>
    </component_regions>
    <modals_overlays>
      <create_application_modal>
        Form fields: Farmer name, email, phone
        Actions: Create, Cancel
      </create_application_modal>
      <justification_modal>
        Trigger: When modifying AI-extracted field
        Options: AI Extraction Error, Document Ambiguity, Farmer-Provided Correction, Data Missing/Illegible
        Required: Cannot save without selection
      </justification_modal>
      <certification_modal>
        Checklist: All documents audited, all modules complete
        Checkbox: Certification statement agreement
        Actions: Certify & Lock, Cancel
      </certification_modal>
      <command_palette>
        Trigger: Cmd/Ctrl+K
        Features: Fuzzy search, navigation commands, action commands
      </command_palette>
    </modals_overlays>
  </ui_layout>

  <design_system>
    <color_palette>
      <primary>
        - Agrellus Green: #30714C (CTAs, links, success states)
        - Agrellus Green Hover: #265d3d
        - Wheat Gold: #DDC66F (highlights, attention indicators)
      </primary>
      <dark_theme>
        - Background Dark: #061623 (primary background)
        - Background Card: #0D2233 (cards, panels)
        - Background Subtle: #193B28 (green-tinted areas)
        - Border: #193B28 (dividers)
        - Border Light: #E3E3E3 (input borders on light surfaces)
      </dark_theme>
      <light_theme>
        - Background: #FFFFFF (forms, document viewer)
        - Background Subtle: #F7F7F7 (alternating rows)
      </light_theme>
      <text>
        - Primary on Dark: #FFFFFF
        - Primary on Light: #061623
        - Secondary: #585C60
      </text>
      <semantic>
        - Success: bg #F0FDF4, border #30714C, text #30714C
        - Warning: bg #FFF3CD, border #D6A800, text #856404
        - Error: bg #FFEDED, border #C1201C, text #C1201C
      </semantic>
    </color_palette>
    <typography>
      - Primary Font: 'Lato', -apple-system, BlinkMacSystemFont, sans-serif
      - Monospace: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas
      - Display: 36px, weight 700, line-height 1.2
      - H1: 28px, weight 700, line-height 1.25
      - H2: 24px, weight 700, line-height 1.3
      - H3: 20px, weight 600, line-height 1.35
      - H4: 18px, weight 600, line-height 1.4
      - Body Large: 16px, weight 400, line-height 1.5
      - Body: 14px, weight 400, line-height 1.5
      - Caption: 12px, weight 400, line-height 1.4
    </typography>
    <spacing>
      - xs: 4px (tight, inline)
      - sm: 8px (small gaps, icon margins)
      - md: 12px (default padding)
      - lg: 16px (section padding)
      - xl: 20px (large sections)
      - 2xl: 24px (card padding)
      - 3xl: 32px (page sections)
    </spacing>
    <border_radius>
      - sm: 4px (tags, small buttons)
      - md: 6px (inputs, standard buttons)
      - lg: 8px (cards, alerts)
      - xl: 12px (large cards, modals)
      - full: 9999px (pills, avatars)
    </border_radius>
    <shadows>
      - Subtle: 0 1px 2px rgba(0, 0, 0, 0.05)
      - Card: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
      - Modal: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
    </shadows>
    <components>
      <buttons>
        - Primary: bg-[#30714C] text-white hover:bg-[#265d3d] font-semibold px-4 py-2.5 rounded-lg
        - Secondary: bg-transparent border-[1.5px] border-[#30714C] text-[#30714C] font-semibold
        - Destructive: bg-[#C1201C] text-white hover:bg-[#a11a17]
        - Ghost: bg-transparent text-white hover:bg-white/10
      </buttons>
      <cards>
        - Dark: bg-[#0D2233] border border-[#193B28] rounded-xl
        - Light: bg-[#F7F7F7] border border-[#E3E3E3] rounded-lg
      </cards>
      <inputs>
        - bg-white border border-[#E3E3E3] rounded-md px-4 py-3
        - Focus: border-[#30714C] ring-2 ring-[#30714C]/10
      </inputs>
      <chat_messages>
        - User: ml-auto bg-[#30714C] text-white rounded-lg px-4 py-3 max-w-[80%]
        - Assistant: mr-auto bg-[#0D2233] text-white rounded-lg px-4 py-3 max-w-[80%]
      </chat_messages>
      <badges>
        - Confidence (>=90%): bg-[#F0FDF4] border-[#30714C] text-[#30714C]
        - Confidence (70-89%): bg-[#FFF3CD] border-[#D6A800] text-[#856404]
        - Confidence (<70%): bg-[#FFEDED] border-[#C1201C] text-[#C1201C]
        - Source AI: bg-blue-100 text-blue-800 border-blue-200
        - Source Manual: bg-gray-100 text-gray-800 border-gray-200
        - Source Modified: bg-yellow-100 text-yellow-800 border-yellow-200
        - Source Verified: bg-green-100 text-green-800 border-green-200
      </badges>
    </components>
    <animations>
      - Micro-interactions (hover, focus): 150ms ease-out
      - Panel transitions: 200ms ease-in-out
      - Page transitions: 300ms ease-in-out
      - Message fade-in: opacity 0→1, translateY 8px→0, 150ms stagger
      - Typing indicator: 3 pulsing dots, 1.2s loop, 200ms stagger
      - Artifact panel slide: translateX 100%→0 from right
      - Sidebar slide: translateX -100%→0 from left
      - Modal: opacity 0→1, scale 0.95→1
      - Toast: translateY 100%→0, auto-dismiss 4s
      - Framer Motion defaults: { panel: { type: "spring", stiffness: 300, damping: 30 }, fade: { duration: 0.15, ease: "easeOut" }, slide: { duration: 0.2, ease: "easeInOut" } }
      - Respect prefers-reduced-motion: disable non-essential animations
    </animations>
  </design_system>

  <key_interactions>
    <application_creation>
      1. Analyst clicks "Create New Application" button
      2. Modal appears with form: farmer name, email, phone
      3. Submit triggers POST /api/applications
      4. On success, redirect to application detail with chat interface
      5. AgFin AI Bot welcomes analyst with suggested first steps
    </application_creation>
    <document_upload_flow>
      1. Analyst clicks document slot in Progress Panel (or AI suggests)
      2. Drag-drop zone appears in Artifact Panel
      3. File dropped triggers presigned URL fetch
      4. Direct upload to Supabase Storage
      5. POST /api/documents/:id/process triggers Docling
      6. Polling or SSE for extraction status
      7. On complete, extracted fields shown with confidence badges
      8. Fields >=90% auto-applied to modules
      9. Fields <90% flagged for manual review
    </document_upload_flow>
    <chat_interaction>
      1. Analyst types message in ChatInput
      2. Enter key or click sends POST /api/agfin-ai-bot/stream
      3. User message immediately appears in MessageList
      4. TypingIndicator shows while waiting
      5. SSE stream receives tokens, updates message in real-time
      6. AI may trigger artifact (form, document) to slide in from right
      7. Completed response saved to session history
      8. New memories extracted and stored in pgvector
    </chat_interaction>
    <field_override>
      1. Analyst edits AI-extracted field in module form
      2. On blur/save, JustificationModal appears
      3. Analyst selects from 4 reasons (required)
      4. POST /api/audit/:documentId/override logs change
      5. Field updated with source='proxy_edited'
      6. Audit trail entry created (immutable)
    </field_override>
    <audit_review>
      1. Analyst opens document in audit mode
      2. DualPaneView shows: PDF left, extracted fields right
      3. Fields <90% highlighted with warning badge
      4. Analyst must interact with each flagged field (confirm/edit)
      5. If edited, justification required
      6. When all flags resolved, "Mark Audited" button enabled
      7. POST /api/audit/:documentId/mark-audited
      8. Document status → 'audited'
    </audit_review>
    <certification>
      1. All documents must be 'audited' status
      2. All required module fields must be populated
      3. Analyst clicks "Certify Application"
      4. CertificationModal shows checklist and statement
      5. Analyst checks certification agreement checkbox
      6. POST /api/certification/:applicationId/certify
      7. Application status → 'locked' (immutable)
      8. PDF generation triggered
      9. Download ZIP available (PDF + audit CSV)
    </certification>
  </key_interactions>

  <implementation_steps>
    <step number="1">
      <title>Phase 1: Foundation (Core Infrastructure)</title>
      <tasks>
        - Set up VSA directory structure per PRD Section 6
        - Initialize local Supabase (npx supabase init, npx supabase start)
        - Enable pgvector extension in local Supabase
        - Create database schema migrations
        - Implement core/config.ts with Zod environment validation
        - Implement core/database.ts with typed Supabase clients (local connection)
        - Set up Clerk authentication (see ai_docs/clerk-otp-authentication.md)
        - Configure ClerkProvider in app layout
        - Implement Clerk middleware for protected routes
        - Set up Row Level Security policies (use Clerk user ID)
        - Create shared/ui/ with shadcn/ui components
        - Configure Tailwind with Agrellus brand colors (see AgBrandSkill.md)
        - Create Claude.ai-style three-column shell layout
        - Implement direct login → chat flow (no intermediate dashboard)
        - Implement basic applications CRUD via chat commands
      </tasks>
    </step>
    <step number="2">
      <title>Phase 2: Document Pipeline (AI Extraction)</title>
      <tasks>
        - Set up Docling service in Docker Compose
        - Implement documents.routes.ts (upload-url, process, extraction)
        - Implement docling.service.ts with timeout and retry
        - Create 9 document type schemas in documents/types/
        - Implement presigned URL upload flow
        - Build DocumentUpload component with react-dropzone
        - Implement field extraction processing
        - Create confidence scoring logic (90% threshold)
        - Implement document-to-module field mapping
        - Build Progress Panel with status indicators
        - Create document viewer component
      </tasks>
    </step>
    <step number="3">
      <title>Phase 3: Conversational Interface (AI Chat)</title>
      <tasks>
        - Set up AgFin AI Bot Python service with Anthropic SDK
        - Configure mem0 with local Supabase pgvector
        - Implement chat.py and stream.py routers
        - Design agent tools following Anthropic guidelines (see ai_docs/anthropic-tool-use-guide.md):
          - query_application: Get application status and data
          - create_application: Create new loan application
          - upload_document: Handle document upload requests
          - extract_fields: Trigger Docling extraction
          - update_module: Update module field values
          - request_audit: Flag fields for audit review
          - certify_application: Complete certification process
        - Each tool with detailed descriptions, proper input schemas, error handling
        - Use Anthropic tool_runner pattern for automatic tool execution loop
        - Build system prompts with application context
        - Implement Claude.ai-style ChatCenter component
        - Build ChatInput (bottom-anchored, auto-resize, keyboard shortcuts)
        - Create MessageList with streaming support
        - Implement inline document upload zone (triggered by agent)
        - Implement TypingIndicator component
        - Build WelcomeScreen with suggested prompts
        - Implement ConversationSidebar (Claude.ai-style session list)
        - Create proactive prompt generation
        - Build Artifact Panel with form/document rendering
        - Implement 5 data module forms (Identity, Lands, Financial, Operations, Summary)
      </tasks>
    </step>
    <step number="4">
      <title>Phase 4: Audit & Certification (Compliance)</title>
      <tasks>
        - Implement DualPaneReview component (PDF + fields)
        - Build JustificationModal with 4 reasons
        - Implement audit.routes.ts (override, mark-audited)
        - Create immutable audit_trail logging
        - Build application lock trigger in database
        - Implement CertificationView with checklist
        - Create certification statement checkbox
        - Build PDF generation service
        - Implement audit trail CSV export
        - Create ZIP package download endpoint
        - Implement Command Palette (Cmd/Ctrl+K)
        - Add keyboard shortcuts
        - Final integration testing
      </tasks>
    </step>
  </implementation_steps>

  <success_criteria>
    <functionality>
      - Analyst can create new application in less than 30 seconds
      - Document upload triggers AI extraction within 5 seconds
      - All 9 document types supported with field mapping
      - All 5 data modules can be populated (manual or extracted)
      - Progress panel accurately reflects completion status
      - Dual-pane audit view renders PDF and data side-by-side
      - Override justification is mandatory and logged
      - Data lock prevents post-certification edits
      - PDF export contains all application data
      - Audit trail export contains all changes with justifications
    </functionality>
    <user_experience>
      - Analyst can complete simple application in less than 30 minutes
      - Non-linear navigation feels seamless
      - AI suggestions are helpful, not intrusive
      - Confidence flags clearly guide review priority
      - Context-switch latency less than 300ms
      - Auto-save reliability 100%
      - Zero data loss on browser refresh
    </user_experience>
    <technical_quality>
      - Field-level confidence scoring accuracy greater than 85%
      - Audit trail completeness 100%
      - All API endpoints validated with Zod
      - Row Level Security enforced on all tables
      - Service role key never exposed to client
      - Sensitive fields (SSN, EIN) encrypted
    </technical_quality>
    <design_polish>
      - Consistent Agrellus brand colors throughout
      - Dark theme as default for extended use
      - Responsive layout (mobile/tablet/desktop)
      - Full keyboard navigation support
      - Screen reader compatible (ARIA labels)
      - Animations respect prefers-reduced-motion
      - Minimum 44x44px touch targets on mobile
    </design_polish>
    <accessibility>
      - Full Tab, Enter, Escape keyboard support
      - Visible focus rings on all interactive elements
      - ARIA labels on all buttons and inputs
      - No information conveyed by color alone
      - High contrast mode support
      - Reduced motion preference respected
    </accessibility>
  </success_criteria>

  <keyboard_shortcuts>
    - Enter: Send message
    - Shift+Enter: New line in message
    - Cmd/Ctrl+K: Open command palette
    - Cmd/Ctrl+N: New application
    - Cmd/Ctrl+\: Toggle artifact panel
    - Escape: Stop AI generation / Close modal
    - /: Focus chat input
    - Cmd/Ctrl+S: Save current form
    - Cmd/Ctrl+]: Next document/module
    - Cmd/Ctrl+[: Previous document/module
  </keyboard_shortcuts>

  <responsive_breakpoints>
    <mobile>
      - Width: less than 768px
      - Layout: Single column, chat only
      - Sidebar: Collapsible with hamburger menu
      - Artifact: Slide-over modal
      - Document upload: Bottom sheet
      - Quick actions: Floating action button
    </mobile>
    <tablet>
      - Width: 768px to 1024px
      - Layout: Two column (Chat + Artifact)
      - Sidebar: Hidden by default, toggle to show
      - Artifact: Overlays chat when open
      - Touch targets: 44x44px minimum
    </tablet>
    <desktop>
      - Width: greater than 1024px
      - Layout: Full three-column
      - All panels visible simultaneously
    </desktop>
  </responsive_breakpoints>
</project_specification>
```
