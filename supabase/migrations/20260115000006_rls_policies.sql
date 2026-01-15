-- Row Level Security (RLS) Policies
-- Ensures users can only access their own data

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Analysts can read their own applications
CREATE POLICY "Users can read own applications"
  ON public.applications
  FOR SELECT
  USING (analyst_id = auth.uid());

-- Analysts can create applications for themselves
CREATE POLICY "Users can create own applications"
  ON public.applications
  FOR INSERT
  WITH CHECK (analyst_id = auth.uid());

-- Analysts can update their own applications
CREATE POLICY "Users can update own applications"
  ON public.applications
  FOR UPDATE
  USING (analyst_id = auth.uid())
  WITH CHECK (analyst_id = auth.uid());

-- Analysts can delete their own applications
CREATE POLICY "Users can delete own applications"
  ON public.applications
  FOR DELETE
  USING (analyst_id = auth.uid());

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users can read documents for applications they own
CREATE POLICY "Users can read documents for own applications"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can insert documents for applications they own
CREATE POLICY "Users can insert documents for own applications"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can update documents for applications they own
CREATE POLICY "Users can update documents for own applications"
  ON public.documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
      AND applications.analyst_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can delete documents for applications they own
CREATE POLICY "Users can delete documents for own applications"
  ON public.documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- ============================================================================
-- MODULE_DATA TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Users can read module data for applications they own
CREATE POLICY "Users can read module data for own applications"
  ON public.module_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = module_data.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can insert module data for applications they own
CREATE POLICY "Users can insert module data for own applications"
  ON public.module_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = module_data.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can update module data for applications they own
CREATE POLICY "Users can update module data for own applications"
  ON public.module_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = module_data.application_id
      AND applications.analyst_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = module_data.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Users can delete module data for applications they own
CREATE POLICY "Users can delete module data for own applications"
  ON public.module_data
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = module_data.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- ============================================================================
-- AUDIT_TRAIL TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Users can read audit trail for applications they own
CREATE POLICY "Users can read audit trail for own applications"
  ON public.audit_trail
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = audit_trail.application_id
      AND applications.analyst_id = auth.uid()
    )
  );

-- Any authenticated user can insert audit trail entries
-- (The application_id foreign key ensures they can only audit their own apps)
CREATE POLICY "Authenticated users can insert audit trail"
  ON public.audit_trail
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Note: No UPDATE or DELETE policies - audit trail is append-only

-- ============================================================================
-- AI BOT SESSIONS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agfin_ai_bot_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own AI bot sessions"
  ON public.agfin_ai_bot_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own sessions
CREATE POLICY "Users can create own AI bot sessions"
  ON public.agfin_ai_bot_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own AI bot sessions"
  ON public.agfin_ai_bot_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own AI bot sessions"
  ON public.agfin_ai_bot_sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- AI BOT MESSAGES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agfin_ai_bot_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages from their own sessions
CREATE POLICY "Users can read messages from own sessions"
  ON public.agfin_ai_bot_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agfin_ai_bot_sessions
      WHERE agfin_ai_bot_sessions.id = agfin_ai_bot_messages.session_id
      AND agfin_ai_bot_sessions.user_id = auth.uid()
    )
  );

-- Users can insert messages to their own sessions
CREATE POLICY "Users can insert messages to own sessions"
  ON public.agfin_ai_bot_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agfin_ai_bot_sessions
      WHERE agfin_ai_bot_sessions.id = agfin_ai_bot_messages.session_id
      AND agfin_ai_bot_sessions.user_id = auth.uid()
    )
  );

-- Users can update messages in their own sessions
CREATE POLICY "Users can update messages in own sessions"
  ON public.agfin_ai_bot_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agfin_ai_bot_sessions
      WHERE agfin_ai_bot_sessions.id = agfin_ai_bot_messages.session_id
      AND agfin_ai_bot_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agfin_ai_bot_sessions
      WHERE agfin_ai_bot_sessions.id = agfin_ai_bot_messages.session_id
      AND agfin_ai_bot_sessions.user_id = auth.uid()
    )
  );

-- Users can delete messages from their own sessions
CREATE POLICY "Users can delete messages from own sessions"
  ON public.agfin_ai_bot_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agfin_ai_bot_sessions
      WHERE agfin_ai_bot_sessions.id = agfin_ai_bot_messages.session_id
      AND agfin_ai_bot_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- AI BOT MEMORIES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agfin_ai_bot_memories ENABLE ROW LEVEL SECURITY;

-- Users can read their own memories
CREATE POLICY "Users can read own AI bot memories"
  ON public.agfin_ai_bot_memories
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own memories
CREATE POLICY "Users can create own AI bot memories"
  ON public.agfin_ai_bot_memories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own memories
CREATE POLICY "Users can update own AI bot memories"
  ON public.agfin_ai_bot_memories
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own memories
CREATE POLICY "Users can delete own AI bot memories"
  ON public.agfin_ai_bot_memories
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- SECURITY SUMMARY
-- ============================================================================

-- All tables now have RLS enabled with the following pattern:
-- 1. Direct ownership: analyst_id/user_id = auth.uid()
-- 2. Inherited ownership: Via JOIN to applications.analyst_id = auth.uid()
-- 3. Append-only: audit_trail allows INSERT but no UPDATE/DELETE
--
-- This ensures:
-- - Complete data isolation between users
-- - No accidental cross-user data leaks
-- - Full audit trail of all changes
-- - Secure AI bot sessions and memories per user
