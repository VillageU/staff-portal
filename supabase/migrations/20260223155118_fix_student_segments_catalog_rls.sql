/*
  # Fix student_segments_catalog RLS for custom auth

  1. Changes
    - Add policy to allow anonymous users to read active segments from the catalog
    - This matches the custom auth pattern used throughout the app where staff access via anon key

  2. Security
    - Read-only access to active segments
    - No write permissions for anonymous users
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read segment catalog" ON student_segments_catalog;

-- Add policy allowing anonymous users to read active segments
CREATE POLICY "Anyone can read active segments"
  ON student_segments_catalog
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);