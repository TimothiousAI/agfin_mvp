-- Create a dev user for local testing
-- Run this in Supabase Studio SQL Editor (http://localhost:54323)
-- or via psql connection

-- First, delete any existing dev user to start fresh
DELETE FROM auth.users WHERE email = 'dev@agrellus.local';

-- Create the dev user with confirmed email
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'dev@agrellus.local',
  -- Password: dev-password-for-local-testing-only
  crypt('dev-password-for-local-testing-only', gen_salt('bf')),
  NOW(), -- Email confirmed
  NOW(),
  NOW(),
  '{"is_dev_user": true, "clerk_id": "dev-user-id"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- Verify the user was created
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'dev@agrellus.local';
