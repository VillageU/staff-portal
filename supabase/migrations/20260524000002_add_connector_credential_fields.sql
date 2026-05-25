-- Add optional credential fields to university_connectors
ALTER TABLE university_connectors
  ADD COLUMN IF NOT EXISTS domain_url text,
  ADD COLUMN IF NOT EXISTS api_base_url text,
  ADD COLUMN IF NOT EXISTS client_id text;
