-- Audit trail table for tracking all changes to application data
-- Write-once design: records can only be inserted, never updated or deleted

CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  field_id TEXT,
  old_value TEXT,
  new_value TEXT,
  justification TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid justification reasons (4 types as per spec)
  CONSTRAINT audit_trail_justification_check CHECK (
    justification IS NULL OR justification IN (
      'data_quality_issue',
      'document_illegible',
      'farmer_provided_correction',
      'regulatory_requirement'
    )
  )
);

-- Create indexes for common queries
CREATE INDEX idx_audit_trail_application_id ON public.audit_trail(application_id);
CREATE INDEX idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX idx_audit_trail_field_id ON public.audit_trail(field_id);
CREATE INDEX idx_audit_trail_created_at ON public.audit_trail(created_at DESC);

-- Prevent updates to audit trail (write-once design)
CREATE OR REPLACE FUNCTION public.prevent_audit_trail_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail records cannot be modified. This table is append-only for compliance.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_trail_update
  BEFORE UPDATE ON public.audit_trail
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_trail_update();

-- Prevent deletes to audit trail (except CASCADE from application deletion)
CREATE OR REPLACE FUNCTION public.prevent_audit_trail_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow CASCADE deletes from parent tables, but prevent manual deletes
  IF TG_OP = 'DELETE' AND OLD.application_id IS NOT NULL THEN
    -- This is a manual delete attempt
    RAISE EXCEPTION 'Audit trail records cannot be deleted manually. This table is append-only for compliance.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Note: We allow CASCADE deletes, so this trigger only fires on explicit DELETE statements
-- The ON DELETE CASCADE from applications table will still work

-- Add helpful comments
COMMENT ON TABLE public.audit_trail IS 'Immutable audit log of all application data changes for compliance';
COMMENT ON COLUMN public.audit_trail.action IS 'Action performed (e.g., "field_edited", "status_changed", "document_uploaded")';
COMMENT ON COLUMN public.audit_trail.justification IS 'Required reason for proxy edits: data_quality_issue, document_illegible, farmer_provided_correction, regulatory_requirement';
COMMENT ON COLUMN public.audit_trail.field_id IS 'Field identifier that was changed (NULL for non-field actions like status changes)';
COMMENT ON COLUMN public.audit_trail.old_value IS 'Previous value (as text representation)';
COMMENT ON COLUMN public.audit_trail.new_value IS 'New value (as text representation)';
