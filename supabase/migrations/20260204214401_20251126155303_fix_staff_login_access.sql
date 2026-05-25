/*
  # Fix Staff Login Access

  1. Changes
    - Add policy to allow anonymous users to read staff table for login verification
    - This enables the custom authentication system to query staff credentials
  
  2. Security Note
    - In production, this should use Supabase Auth instead of custom authentication
    - For MVP demo purposes, this allows staff login functionality
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff can read all staff data" ON staff;

-- Allow anyone to read staff table for login purposes (demo only)
CREATE POLICY "Allow staff login queries"
  ON staff FOR SELECT
  TO anon, authenticated
  USING (true);