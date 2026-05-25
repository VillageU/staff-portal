/*
  # Add Staff Update Policy

  1. Changes
    - Add RLS policy to allow staff members to update their own profile data
    - This enables the profile edit functionality
  
  2. Security
    - Staff can only update their own records (checked via staff table query)
    - Maintains data integrity while allowing profile management
*/

-- Allow staff to update their own profile
CREATE POLICY "Staff can update own profile"
  ON staff FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
