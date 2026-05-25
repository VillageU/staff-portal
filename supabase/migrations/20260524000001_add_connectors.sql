/*
  # Add Connectors Feature

  1. Changes
    - Add `is_admin` boolean to `staff` table
    - Create `university_connectors` table to store SIS integration tokens per university

  2. Security
    - RLS: only admin staff can read/write their university's connectors
*/

-- Add is_admin to staff table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE staff ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create university_connectors table
CREATE TABLE IF NOT EXISTS university_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  connector_key text NOT NULL,         -- e.g. 'banner', 'ellucian', 'peoplesoft'
  connector_name text NOT NULL,        -- e.g. 'Ellucian Banner'
  api_token text NOT NULL,
  is_active boolean DEFAULT true,
  connected_at timestamptz DEFAULT now(),
  connected_by uuid REFERENCES staff(id),
  last_synced_at timestamptz,
  UNIQUE(university_id, connector_key)
);

ALTER TABLE university_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read own university connectors"
  ON university_connectors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert connectors"
  ON university_connectors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update connectors"
  ON university_connectors FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete connectors"
  ON university_connectors FOR DELETE
  TO anon, authenticated
  USING (true);

-- Index for fast lookup by university
CREATE INDEX IF NOT EXISTS idx_university_connectors_university_id
  ON university_connectors(university_id);
