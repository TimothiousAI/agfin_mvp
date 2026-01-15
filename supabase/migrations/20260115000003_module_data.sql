-- Module data table for AgFin application form fields
-- Stores field-level data for 5 certification modules with provenance tracking

CREATE TABLE IF NOT EXISTS public.module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  module_number INT NOT NULL,
  field_id TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce valid module numbers (1-5 as per AgFin spec)
  CONSTRAINT module_data_module_number_check CHECK (
    module_number >= 1 AND module_number <= 5
  ),

  -- Enforce valid data sources
  CONSTRAINT module_data_source_check CHECK (
    source IN ('ai_extracted', 'proxy_entered', 'proxy_edited', 'auditor_verified')
  ),

  -- Confidence score must be between 0 and 1
  CONSTRAINT module_data_confidence_score_check CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),

  -- Ensure one value per field per application/module combination
  CONSTRAINT module_data_unique_field UNIQUE (application_id, module_number, field_id)
);

-- Create indexes for common queries
CREATE INDEX idx_module_data_application_id ON public.module_data(application_id);
CREATE INDEX idx_module_data_module_number ON public.module_data(module_number);
CREATE INDEX idx_module_data_source ON public.module_data(source);
CREATE INDEX idx_module_data_source_document_id ON public.module_data(source_document_id);

-- Create GIN index for JSONB value queries
CREATE INDEX idx_module_data_value ON public.module_data USING gin(value);

-- Apply updated_at trigger
CREATE TRIGGER module_data_updated_at
  BEFORE UPDATE ON public.module_data
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.module_data IS 'Form field data for AgFin certification modules with full provenance tracking';
COMMENT ON COLUMN public.module_data.module_number IS 'AgFin module number (1-5): 1=Farm Info, 2=Production, 3=Processing, 4=Environmental, 5=Social';
COMMENT ON COLUMN public.module_data.field_id IS 'Unique field identifier within module (e.g., "farm_size_hectares")';
COMMENT ON COLUMN public.module_data.value IS 'Field value as JSONB (supports any data type: strings, numbers, arrays, objects)';
COMMENT ON COLUMN public.module_data.source IS 'Data provenance: ai_extracted -> proxy_entered/edited -> auditor_verified';
COMMENT ON COLUMN public.module_data.source_document_id IS 'Reference to document this data was extracted from (if applicable)';
COMMENT ON COLUMN public.module_data.confidence_score IS 'AI extraction confidence (0-1), NULL for manually entered data';
