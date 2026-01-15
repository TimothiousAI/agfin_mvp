-- AI Bot tables for Claude-powered AgFin assistance
-- Supports chat sessions, message history, and RAG memory with vector embeddings

-- AI Bot Sessions: Chat conversations with context
CREATE TABLE IF NOT EXISTS public.agfin_ai_bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  workflow_mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid workflow modes
  CONSTRAINT ai_bot_sessions_workflow_mode_check CHECK (
    workflow_mode IS NULL OR workflow_mode IN (
      'general_help',
      'document_review',
      'field_completion',
      'audit_preparation'
    )
  )
);

-- AI Bot Messages: Individual chat messages
CREATE TABLE IF NOT EXISTS public.agfin_ai_bot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.agfin_ai_bot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid roles
  CONSTRAINT ai_bot_messages_role_check CHECK (
    role IN ('user', 'assistant')
  )
);

-- AI Bot Memories: Long-term knowledge base with vector embeddings
CREATE TABLE IF NOT EXISTS public.agfin_ai_bot_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,  -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Metadata might include: source, tags, importance, etc.
  CONSTRAINT ai_bot_memories_metadata_check CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

-- Indexes for sessions
CREATE INDEX idx_ai_bot_sessions_user_id ON public.agfin_ai_bot_sessions(user_id);
CREATE INDEX idx_ai_bot_sessions_application_id ON public.agfin_ai_bot_sessions(application_id);
CREATE INDEX idx_ai_bot_sessions_created_at ON public.agfin_ai_bot_sessions(created_at DESC);

-- Indexes for messages
CREATE INDEX idx_ai_bot_messages_session_id ON public.agfin_ai_bot_messages(session_id);
CREATE INDEX idx_ai_bot_messages_created_at ON public.agfin_ai_bot_messages(created_at DESC);

-- Indexes for memories
CREATE INDEX idx_ai_bot_memories_user_id ON public.agfin_ai_bot_memories(user_id);
CREATE INDEX idx_ai_bot_memories_created_at ON public.agfin_ai_bot_memories(created_at DESC);

-- Vector similarity index for RAG (Retrieval Augmented Generation)
-- Using ivfflat for fast approximate nearest neighbor search
-- lists parameter should be roughly sqrt(total_rows), starting with 100 for development
CREATE INDEX idx_ai_bot_memories_embedding ON public.agfin_ai_bot_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- GIN index for metadata queries
CREATE INDEX idx_ai_bot_memories_metadata ON public.agfin_ai_bot_memories USING gin(metadata);

-- Apply updated_at trigger to sessions
CREATE TRIGGER ai_bot_sessions_updated_at
  BEFORE UPDATE ON public.agfin_ai_bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.agfin_ai_bot_sessions IS 'Claude AI chat sessions for AgFin assistance';
COMMENT ON TABLE public.agfin_ai_bot_messages IS 'Individual messages within AI bot chat sessions';
COMMENT ON TABLE public.agfin_ai_bot_memories IS 'Long-term memory for AI bot with vector embeddings for RAG';

COMMENT ON COLUMN public.agfin_ai_bot_sessions.workflow_mode IS 'Optional workflow context: general_help, document_review, field_completion, audit_preparation';
COMMENT ON COLUMN public.agfin_ai_bot_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN public.agfin_ai_bot_memories.embedding IS 'Vector embedding (1536-dim) for semantic similarity search';
COMMENT ON COLUMN public.agfin_ai_bot_memories.metadata IS 'Additional context: source, tags, importance level, etc.';

-- Helper view for recent chat history with message counts
CREATE OR REPLACE VIEW public.agfin_ai_bot_session_summary AS
SELECT
  s.id,
  s.user_id,
  s.application_id,
  s.title,
  s.workflow_mode,
  s.created_at,
  s.updated_at,
  COUNT(m.id) AS message_count,
  MAX(m.created_at) AS last_message_at
FROM public.agfin_ai_bot_sessions s
LEFT JOIN public.agfin_ai_bot_messages m ON m.session_id = s.id
GROUP BY s.id, s.user_id, s.application_id, s.title, s.workflow_mode, s.created_at, s.updated_at;

COMMENT ON VIEW public.agfin_ai_bot_session_summary IS 'Chat sessions with message counts and last activity timestamp';
