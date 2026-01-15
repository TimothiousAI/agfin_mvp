-- Storage configuration for document uploads
-- Creates documents bucket with RLS policies and file size/type restrictions

-- ==============================================================================
-- STORAGE BUCKET SETUP
-- ==============================================================================

-- Insert storage bucket (idempotent with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket - requires authentication
  52428800, -- 50MB in bytes (50 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- STORAGE RLS POLICIES
-- ==============================================================================

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;

-- Policy 1: SELECT - Users can view their own application documents
-- Users can only see documents for applications they own (analyst_id matches)
CREATE POLICY "documents_select_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if the user owns the application (extract application_id from path)
    -- Path format: applications/{application_id}/{document_type}/{filename}
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id::text = split_part(storage.objects.name, '/', 2)
      AND applications.analyst_id = auth.uid()::text
    )
    -- OR user has service role
    OR auth.jwt()->>'role' = 'service_role'
  )
);

-- Policy 2: INSERT - Users can upload documents to their own applications
CREATE POLICY "documents_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (
    -- Verify user owns the application
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id::text = split_part(storage.objects.name, '/', 2)
      AND applications.analyst_id = auth.uid()::text
    )
    -- OR user has service role
    OR auth.jwt()->>'role' = 'service_role'
  )
);

-- Policy 3: UPDATE - Users can update their own application documents
CREATE POLICY "documents_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id::text = split_part(storage.objects.name, '/', 2)
      AND applications.analyst_id = auth.uid()::text
    )
    OR auth.jwt()->>'role' = 'service_role'
  )
);

-- Policy 4: DELETE - Users can delete their own application documents
CREATE POLICY "documents_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id::text = split_part(storage.objects.name, '/', 2)
      AND applications.analyst_id = auth.uid()::text
    )
    OR auth.jwt()->>'role' = 'service_role'
  )
);

-- ==============================================================================
-- COMMENTS AND DOCUMENTATION
-- ==============================================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets with file size and MIME type restrictions';

-- Storage folder structure convention:
-- applications/{application_id}/{document_type}/{timestamp}_{filename}
--
-- Example paths:
-- - applications/550e8400-e29b-41d4-a716-446655440000/drivers_license/1705324800000_license.pdf
-- - applications/550e8400-e29b-41d4-a716-446655440000/schedule_f/1705324801000_schedule_f_2023.pdf
-- - applications/550e8400-e29b-41d4-a716-446655440000/balance_sheet/1705324802000_balance.pdf
--
-- Document types:
-- - drivers_license
-- - schedule_f
-- - organization_docs
-- - balance_sheet
-- - fsa_578
-- - crop_insurance_current
-- - crop_insurance_prior
-- - lease_agreement
-- - equipment_list

-- Security notes:
-- 1. Bucket is private (public = false) - requires authentication
-- 2. RLS policies enforce that users can only access their own application documents
-- 3. File size limited to 50MB per file
-- 4. Only PDF and common image formats allowed
-- 5. Folder structure provides automatic organization by application
