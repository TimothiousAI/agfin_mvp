-- Applications table for AgFin certification applications
-- Each application represents a farmer's certification request managed by an analyst

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyst_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  farmer_name TEXT NOT NULL,
  farmer_email TEXT NOT NULL,
  farmer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid status transitions
  CONSTRAINT applications_status_check CHECK (
    status IN ('draft', 'awaiting_documents', 'awaiting_audit', 'certified', 'locked')
  )
);

-- Create indexes for common queries
CREATE INDEX idx_applications_analyst_id ON public.applications(analyst_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);

-- Create updated_at trigger function (reusable for other tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to applications table
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.applications IS 'AgFin certification applications managed by analysts';
COMMENT ON COLUMN public.applications.status IS 'Application workflow status: draft -> awaiting_documents -> awaiting_audit -> certified OR locked';
COMMENT ON COLUMN public.applications.analyst_id IS 'The analyst responsible for managing this application';
