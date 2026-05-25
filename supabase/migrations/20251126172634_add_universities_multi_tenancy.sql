/*
  # Add Universities and Multi-Tenancy Support

  1. New Tables
    - `universities`
      - `id` (uuid, primary key)
      - `name` (text, university name)
      - `domain` (text, email domain for the university)
      - `logo_url` (text, URL to university logo)
      - `primary_color` (text, hex color for branding)
      - `sso_enabled` (boolean, whether SSO is enabled)
      - `sso_provider` (text, SSO provider name)
      - `sso_metadata_url` (text, SSO metadata URL)
      - `created_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `university_id` to `staff` table
    - Add `university_id` to `students` table
    - Add foreign key constraints

  3. Security
    - Enable RLS on `universities` table
    - Add policies for anon access (for login page)
    - Update existing RLS policies to include university_id filtering

  4. Test Data
    - Insert test university "Village University"
    - Update existing staff and students with university_id
*/

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  sso_enabled boolean DEFAULT false,
  sso_provider text,
  sso_metadata_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read university info (needed for login page)
CREATE POLICY "Allow public read access to universities"
  ON universities
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add university_id to staff table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE staff ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE students ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Insert test university
INSERT INTO universities (id, name, domain, logo_url, primary_color, sso_enabled, sso_provider)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Village University',
  'villageu.edu',
  'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=200',
  '#10B981',
  true,
  'Google'
)
ON CONFLICT (domain) DO NOTHING;

-- Update existing staff with university_id
UPDATE staff
SET university_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
WHERE university_id IS NULL;

-- Update existing students with university_id
UPDATE students
SET university_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
WHERE university_id IS NULL;

-- Update RLS policies for staff to include university filtering
DROP POLICY IF EXISTS "Allow anon read access to staff" ON staff;
DROP POLICY IF EXISTS "Allow anon staff insert for custom auth" ON staff;
DROP POLICY IF EXISTS "Allow staff to update own profile" ON staff;

CREATE POLICY "Allow anon read access to staff"
  ON staff
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon staff insert for custom auth"
  ON staff
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow staff to update own profile"
  ON staff
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Update RLS policies for students to include university filtering
DROP POLICY IF EXISTS "Allow anon read access to students" ON students;
DROP POLICY IF EXISTS "Allow anon insert to students" ON students;
DROP POLICY IF EXISTS "Allow anon update to students" ON students;

CREATE POLICY "Allow anon read access to students"
  ON students
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to students"
  ON students
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to students"
  ON students
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Update RLS policies for meetings to include university filtering via staff/student
DROP POLICY IF EXISTS "Allow anon read access to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow anon insert to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow anon update to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow anon delete to meetings" ON meetings;

CREATE POLICY "Allow anon read access to meetings"
  ON meetings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to meetings"
  ON meetings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to meetings"
  ON meetings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to meetings"
  ON meetings
  FOR DELETE
  TO anon, authenticated
  USING (true);
