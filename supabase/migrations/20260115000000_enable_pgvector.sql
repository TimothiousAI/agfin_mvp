-- Enable pgvector extension for vector embeddings
-- This extension allows storing and querying vector embeddings for AI/ML use cases

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Grant execute on all functions in extensions schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: After enabling pgvector, you can create vector columns like this:
-- CREATE TABLE documents (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   content text,
--   embedding vector(1536)  -- For OpenAI ada-002 embeddings
-- );
