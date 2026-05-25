/*
  # Fix RLS policies for custom authentication

  This migration updates Row Level Security policies to allow authenticated staff
  members to access student data without requiring Supabase Auth.

  1. Changes
    - Drop existing restrictive RLS policies on students table
    - Add permissive policies that allow all authenticated users access
    - Keep RLS enabled for security but allow custom auth system to work

  2. Security
    - RLS remains enabled
    - Policies check for authenticated role
    - Custom auth validation happens at application level
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can read all students" ON students;
DROP POLICY IF EXISTS "Staff can insert students" ON students;
DROP POLICY IF EXISTS "Staff can update students" ON students;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can read students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Update meetings policies similarly
DROP POLICY IF EXISTS "Staff can read all meetings" ON meetings;
DROP POLICY IF EXISTS "Staff can insert meetings" ON meetings;
DROP POLICY IF EXISTS "Staff can update meetings" ON meetings;

CREATE POLICY "Authenticated users can read meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (true);