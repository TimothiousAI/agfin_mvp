-- Documents table for uploaded farmer documents
-- Stores metadata and extraction status for each uploaded document

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  confidence_score DECIMAL(5,4),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid document types (9 types as per spec)
  CONSTRAINT documents_type_check CHECK (
    document_type IN (
      'farm_map',
      'land_title',
      'previous_certification',
      'organic_plan',
      'field_history',
      'input_records',
      'sales_records',
      'other',
      'photo'
    )
  ),

  -- Enforce valid extraction status
  CONSTRAINT documents_extraction_status_check CHECK (
    extraction_status IN ('pending', 'processing', 'processed', 'audited', 'error')
  ),

  -- Confidence score must be between 0 and 1
  CONSTRAINT documents_confidence_score_check CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  )
);

-- Create indexes for common queries
CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_documents_extraction_status ON public.documents(extraction_status);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- Create GIN index for JSONB metadata queries
CREATE INDEX idx_documents_metadata ON public.documents USING gin(metadata);

-- Add helpful comments
COMMENT ON TABLE public.documents IS 'Uploaded documents for AgFin applications with OCR extraction metadata';
COMMENT ON COLUMN public.documents.document_type IS 'Type of document: farm_map, land_title, previous_certification, organic_plan, field_history, input_records, sales_records, other, photo';
COMMENT ON COLUMN public.documents.extraction_status IS 'OCR extraction pipeline status: pending -> processing -> processed -> audited OR error';
COMMENT ON COLUMN public.documents.confidence_score IS 'AI extraction confidence (0-1), NULL if not yet processed';
COMMENT ON COLUMN public.documents.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN public.documents.metadata IS 'Additional metadata from OCR/processing (file size, dimensions, extracted text summary, etc.)';
