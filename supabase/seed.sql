-- Seed data for local development
-- This file is executed after migrations when running `npx supabase db reset`

-- ==============================================================================
-- SAMPLE USERS (Analysts)
-- ==============================================================================

-- Create sample analyst users in auth.users table
-- Password for all test users: 'password123'
-- Note: In production, Supabase Auth handles user creation via API

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES
  -- Analyst 1: Alice Johnson
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'alice@agfin.example.com',
    '$2a$10$rw4qY5qVqQ5qY5qVqQ5qVuO1qY5qVqQ5qY5qVqQ5qVqQ5qVqQ5qVu', -- password123
    now(),
    now(),
    '',
    now(),
    '',
    now(),
    '',
    '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Johnson","role":"analyst"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    now(),
    '',
    0,
    null,
    '',
    now(),
    false,
    null
  ),
  -- Analyst 2: Bob Martinez
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'bob@agfin.example.com',
    '$2a$10$rw4qY5qVqQ5qY5qVqQ5qVuO1qY5qVqQ5qY5qVqQ5qVqQ5qVqQ5qVu', -- password123
    now(),
    now(),
    '',
    now(),
    '',
    now(),
    '',
    '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Martinez","role":"analyst"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    now(),
    '',
    0,
    null,
    '',
    now(),
    false,
    null
  );

-- Create corresponding identity records
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@agfin.example.com"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@agfin.example.com"}',
    'email',
    now(),
    now(),
    now()
  );

-- ==============================================================================
-- SAMPLE APPLICATIONS
-- ==============================================================================

INSERT INTO public.applications (id, analyst_id, farmer_name, farmer_email, farmer_phone, status, created_at, updated_at) VALUES
  -- Alice's applications
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'John Farmer',
    'john.farmer@example.com',
    '+1-555-0101',
    'draft',
    now() - interval '5 days',
    now() - interval '2 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Maria Santos',
    'maria.santos@example.com',
    '+1-555-0102',
    'awaiting_documents',
    now() - interval '10 days',
    now() - interval '1 day'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'David Chen',
    'david.chen@example.com',
    '+1-555-0103',
    'awaiting_audit',
    now() - interval '20 days',
    now() - interval '3 hours'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Sarah Williams',
    'sarah.williams@example.com',
    '+1-555-0104',
    'certified',
    now() - interval '45 days',
    now() - interval '10 days'
  ),
  -- Bob's applications
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Rodriguez',
    'carlos.rodriguez@example.com',
    '+1-555-0201',
    'draft',
    now() - interval '3 days',
    now() - interval '1 day'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Linda Kim',
    'linda.kim@example.com',
    '+1-555-0202',
    'awaiting_documents',
    now() - interval '15 days',
    now() - interval '5 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'Michael Brown',
    'michael.brown@example.com',
    '+1-555-0203',
    'certified',
    now() - interval '60 days',
    now() - interval '20 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'Emma Thompson',
    'emma.thompson@example.com',
    null,
    'locked',
    now() - interval '90 days',
    now() - interval '30 days'
  );

-- ==============================================================================
-- SAMPLE DOCUMENTS
-- ==============================================================================

INSERT INTO public.documents (id, application_id, document_type, storage_path, extraction_status, confidence_score, metadata, created_at) VALUES
  -- Documents for Maria Santos (awaiting_documents)
  (
    'dddddddd-dddd-dddd-dddd-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    'farm_map',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000002/farm_map_001.pdf',
    'processed',
    0.92,
    '{"file_size": 245632, "pages": 1, "upload_date": "2026-01-10", "extracted_fields": ["plot_boundaries", "total_area"]}'::jsonb,
    now() - interval '9 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    'land_title',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000002/land_title_001.pdf',
    'processed',
    0.88,
    '{"file_size": 532144, "pages": 3, "upload_date": "2026-01-10", "extracted_fields": ["owner_name", "parcel_number", "total_hectares"]}'::jsonb,
    now() - interval '9 days'
  ),
  -- Documents for David Chen (awaiting_audit)
  (
    'dddddddd-dddd-dddd-dddd-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    'farm_map',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000003/farm_map_001.pdf',
    'audited',
    0.95,
    '{"file_size": 312456, "pages": 2, "upload_date": "2025-12-31", "extracted_fields": ["plot_boundaries", "total_area", "crop_zones"]}'::jsonb,
    now() - interval '19 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-000000000004',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    'organic_plan',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000003/organic_plan_001.pdf',
    'audited',
    0.87,
    '{"file_size": 1245632, "pages": 8, "upload_date": "2025-12-31", "extracted_fields": ["crop_rotation", "soil_management", "pest_control"]}'::jsonb,
    now() - interval '19 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-000000000005',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    'field_history',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000003/field_history_001.pdf',
    'audited',
    0.91,
    '{"file_size": 425632, "pages": 4, "upload_date": "2025-12-31", "extracted_fields": ["previous_crops", "chemical_usage_history", "transition_date"]}'::jsonb,
    now() - interval '19 days'
  ),
  -- Documents for Sarah Williams (certified)
  (
    'dddddddd-dddd-dddd-dddd-000000000006',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    'farm_map',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000004/farm_map_001.pdf',
    'audited',
    0.96,
    '{"file_size": 389456, "pages": 2, "upload_date": "2025-12-05", "extracted_fields": ["plot_boundaries", "total_area", "irrigation_system"]}'::jsonb,
    now() - interval '44 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-000000000007',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    'previous_certification',
    'applications/aaaaaaaa-aaaa-aaaa-aaaa-000000000004/prev_cert_001.pdf',
    'audited',
    0.98,
    '{"file_size": 125632, "pages": 2, "upload_date": "2025-12-05", "extracted_fields": ["certification_body", "expiry_date", "scope"]}'::jsonb,
    now() - interval '44 days'
  ),
  -- Documents for Linda Kim (awaiting_documents)
  (
    'dddddddd-dddd-dddd-dddd-000000000008',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
    'farm_map',
    'applications/bbbbbbbb-bbbb-bbbb-bbbb-000000000002/farm_map_001.pdf',
    'processing',
    null,
    '{"file_size": 512456, "pages": 3, "upload_date": "2026-01-05"}'::jsonb,
    now() - interval '14 days'
  ),
  -- Documents for Michael Brown (certified)
  (
    'dddddddd-dddd-dddd-dddd-000000000009',
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
    'farm_map',
    'applications/bbbbbbbb-bbbb-bbbb-bbbb-000000000003/farm_map_001.pdf',
    'audited',
    0.94,
    '{"file_size": 298456, "pages": 1, "upload_date": "2025-11-20", "extracted_fields": ["plot_boundaries", "total_area"]}'::jsonb,
    now() - interval '59 days'
  );

-- ==============================================================================
-- SAMPLE MODULE DATA
-- ==============================================================================

INSERT INTO public.module_data (id, application_id, module_number, field_id, value, source, source_document_id, confidence_score, created_at, updated_at) VALUES
  -- Module data for Maria Santos (from processed documents)
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    1,
    'farm_total_area',
    '{"value": 45.5, "unit": "hectares"}'::jsonb,
    'ai_extracted',
    'dddddddd-dddd-dddd-dddd-000000000001',
    0.92,
    now() - interval '9 days',
    now() - interval '9 days'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
    1,
    'owner_name',
    '{"value": "Maria Santos"}'::jsonb,
    'ai_extracted',
    'dddddddd-dddd-dddd-dddd-000000000002',
    0.88,
    now() - interval '9 days',
    now() - interval '9 days'
  ),
  -- Module data for David Chen (audited)
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    1,
    'farm_total_area',
    '{"value": 120.0, "unit": "hectares"}'::jsonb,
    'auditor_verified',
    'dddddddd-dddd-dddd-dddd-000000000003',
    0.95,
    now() - interval '19 days',
    now() - interval '4 hours'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000004',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    2,
    'crop_type',
    '{"value": "Organic Coffee", "variety": "Arabica"}'::jsonb,
    'ai_extracted',
    'dddddddd-dddd-dddd-dddd-000000000004',
    0.87,
    now() - interval '19 days',
    now() - interval '19 days'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000005',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    3,
    'transition_date',
    '{"value": "2023-06-15"}'::jsonb,
    'proxy_edited',
    'dddddddd-dddd-dddd-dddd-000000000005',
    0.91,
    now() - interval '18 days',
    now() - interval '5 hours'
  ),
  -- Module data for Sarah Williams (certified application)
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000006',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    1,
    'farm_total_area',
    '{"value": 78.3, "unit": "hectares"}'::jsonb,
    'auditor_verified',
    'dddddddd-dddd-dddd-dddd-000000000006',
    0.96,
    now() - interval '43 days',
    now() - interval '11 days'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-000000000007',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    1,
    'previous_certification',
    '{"value": true, "certifying_body": "USDA Organic", "expiry": "2025-12-31"}'::jsonb,
    'auditor_verified',
    'dddddddd-dddd-dddd-dddd-000000000007',
    0.98,
    now() - interval '43 days',
    now() - interval '11 days'
  );

-- ==============================================================================
-- SAMPLE AUDIT TRAIL
-- ==============================================================================

INSERT INTO public.audit_trail (id, application_id, user_id, field_id, old_value, new_value, justification, action, created_at) VALUES
  -- Audit entries for David Chen's application
  (
    'tttttttt-tttt-tttt-tttt-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'transition_date',
    '2023-05-01',
    '2023-06-15',
    'farmer_provided_correction',
    'field_value_updated',
    now() - interval '5 hours'
  ),
  (
    'tttttttt-tttt-tttt-tttt-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    '11111111-1111-1111-1111-111111111111',
    null,
    'awaiting_documents',
    'awaiting_audit',
    null,
    'status_changed',
    now() - interval '3 hours'
  ),
  -- Audit entries for Sarah Williams's certified application
  (
    'tttttttt-tttt-tttt-tttt-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
    '11111111-1111-1111-1111-111111111111',
    null,
    'awaiting_audit',
    'certified',
    null,
    'status_changed',
    now() - interval '10 days'
  );

-- ==============================================================================
-- SAMPLE AI BOT DATA
-- ==============================================================================

-- AI Bot sessions for Alice
INSERT INTO public.agfin_ai_bot_sessions (id, user_id, application_id, title, workflow_mode, created_at, updated_at) VALUES
  (
    'ssssssss-ssss-ssss-ssss-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
    'Help with David Chen application',
    'field_completion',
    now() - interval '6 hours',
    now() - interval '5 hours'
  ),
  (
    'ssssssss-ssss-ssss-ssss-000000000002',
    '11111111-1111-1111-1111-111111111111',
    null,
    'General certification questions',
    'general_help',
    now() - interval '2 days',
    now() - interval '2 days'
  );

-- AI Bot messages
INSERT INTO public.agfin_ai_bot_messages (id, session_id, role, content, created_at) VALUES
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-111111111111',
    'ssssssss-ssss-ssss-ssss-000000000001',
    'user',
    'Can you help me understand the transition date field for organic certification?',
    now() - interval '6 hours'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-111111111112',
    'ssssssss-ssss-ssss-ssss-000000000001',
    'assistant',
    'The transition date is the date when the farmer stopped using prohibited substances and began the organic transition period. For most crops, this requires a 36-month period of organic management before certification.',
    now() - interval '6 hours'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-111111111113',
    'ssssssss-ssss-ssss-ssss-000000000001',
    'user',
    'The farmer provided a correction - should I update the date from May 1st to June 15th?',
    now() - interval '5 hours'
  ),
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-111111111114',
    'ssssssss-ssss-ssss-ssss-000000000001',
    'assistant',
    'Yes, if the farmer has provided documentation supporting the June 15th date as the correct transition date, you should update it and log the change with the justification "farmer_provided_correction" in the audit trail.',
    now() - interval '5 hours'
  );

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Output summary of seeded data
DO $$
DECLARE
  user_count INTEGER;
  app_count INTEGER;
  doc_count INTEGER;
  module_count INTEGER;
  audit_count INTEGER;
  session_count INTEGER;
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email LIKE '%@agfin.example.com';
  SELECT COUNT(*) INTO app_count FROM public.applications;
  SELECT COUNT(*) INTO doc_count FROM public.documents;
  SELECT COUNT(*) INTO module_count FROM public.module_data;
  SELECT COUNT(*) INTO audit_count FROM public.audit_trail;
  SELECT COUNT(*) INTO session_count FROM public.agfin_ai_bot_sessions;
  SELECT COUNT(*) INTO message_count FROM public.agfin_ai_bot_messages;

  RAISE NOTICE '=== Seed Data Summary ===';
  RAISE NOTICE 'Users (Analysts): %', user_count;
  RAISE NOTICE 'Applications: %', app_count;
  RAISE NOTICE 'Documents: %', doc_count;
  RAISE NOTICE 'Module Data Entries: %', module_count;
  RAISE NOTICE 'Audit Trail Entries: %', audit_count;
  RAISE NOTICE 'AI Bot Sessions: %', session_count;
  RAISE NOTICE 'AI Bot Messages: %', message_count;
  RAISE NOTICE '========================';
END $$;
