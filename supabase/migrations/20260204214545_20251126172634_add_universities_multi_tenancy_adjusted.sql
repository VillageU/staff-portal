/*
  # Add Universities and Multi-Tenancy Support (Adjusted)

  1. Changes to Existing Tables
    - Add `university_id` to `staff` table
    - Add foreign key constraints
    - Work with existing universities table

  2. Security
    - Update existing RLS policies

  3. Test Data
    - Update existing staff and students with university_id
*/

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

-- Get first university ID and update existing staff
DO $$
DECLARE
  first_university_id uuid;
BEGIN
  SELECT id INTO first_university_id FROM universities LIMIT 1;
  
  IF first_university_id IS NOT NULL THEN
    UPDATE staff
    SET university_id = first_university_id
    WHERE university_id IS NULL;
    
    UPDATE students
    SET university_id = first_university_id
    WHERE university_id IS NULL;
  END IF;
END $$;

-- Update RLS policies for staff
DROP POLICY IF EXISTS "Allow read access to staff" ON staff;
DROP POLICY IF EXISTS "Allow update access to staff" ON staff;
DROP POLICY IF EXISTS "Staff can update own profile" ON staff;
DROP POLICY IF EXISTS "Allow staff login queries" ON staff;

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

-- Update RLS policies for students
DROP POLICY IF EXISTS "Allow read access to students" ON students;
DROP POLICY IF EXISTS "Allow insert access to students" ON students;
DROP POLICY IF EXISTS "Allow update access to students" ON students;
DROP POLICY IF EXISTS "Allow delete access to students" ON students;

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

-- Update RLS policies for meetings
DROP POLICY IF EXISTS "Allow read access to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow insert access to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow update access to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow delete access to meetings" ON meetings;

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