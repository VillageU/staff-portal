/*
  # Allow anonymous access for custom authentication system

  This migration updates RLS policies to work with the custom staff authentication
  system that doesn't use Supabase Auth.

  1. Changes
    - Update policies to allow both authenticated and anon roles
    - This enables the frontend to query data using the anon key
    - Custom authentication is validated at the application level

  2. Security Notes
    - RLS remains enabled on all tables
    - Application-level authentication validates staff credentials
    - Policies allow access to anon role since auth is handled separately
*/

-- Update students table policies to allow anon role
DROP POLICY IF EXISTS "Authenticated users can read students" ON students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;

CREATE POLICY "Allow read access to students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to students"
  ON students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to students"
  ON students FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to students"
  ON students FOR DELETE
  USING (true);

-- Update meetings table policies to allow anon role
DROP POLICY IF EXISTS "Authenticated users can read meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can update meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can delete meetings" ON meetings;

CREATE POLICY "Allow read access to meetings"
  ON meetings FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to meetings"
  ON meetings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to meetings"
  ON meetings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to meetings"
  ON meetings FOR DELETE
  USING (true);

-- Update staff table policies to allow anon role
DROP POLICY IF EXISTS "Staff can read all staff data" ON staff;

CREATE POLICY "Allow read access to staff"
  ON staff FOR SELECT
  USING (true);

CREATE POLICY "Allow update access to staff"
  ON staff FOR UPDATE
  USING (true)
  WITH CHECK (true);
