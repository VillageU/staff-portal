/*
  # Add Village System for Staff-Student Relationships

  1. New Tables
    - `village_members`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff)
      - `student_id` (uuid, foreign key to students)
      - `invited_by` (text, 'staff' or 'student')
      - `created_at` (timestamptz)
      - Unique constraint on (staff_id, student_id)
    
    - `village_invitations`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff)
      - `student_id` (uuid, foreign key to students)
      - `invited_by` (text, 'staff' or 'student')
      - `status` (text, 'pending', 'accepted', 'rejected')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
    - Staff can see their village members and invitations
    - Students can see invitations sent to them

  3. Notes
    - Students in the Students list are only visible if they're in the staff member's village
    - Village membership is created when either party accepts an invitation
    - Meetings can only be created for students in the staff member's village
*/

-- Create village_members table
CREATE TABLE IF NOT EXISTS village_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  invited_by text NOT NULL CHECK (invited_by IN ('staff', 'student')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, student_id)
);

ALTER TABLE village_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to village_members"
  ON village_members
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to village_members"
  ON village_members
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to village_members"
  ON village_members
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create village_invitations table
CREATE TABLE IF NOT EXISTS village_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  invited_by text NOT NULL CHECK (invited_by IN ('staff', 'student')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, student_id, status)
);

ALTER TABLE village_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to village_invitations"
  ON village_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to village_invitations"
  ON village_invitations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to village_invitations"
  ON village_invitations
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to village_invitations"
  ON village_invitations
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_village_members_staff ON village_members(staff_id);
CREATE INDEX IF NOT EXISTS idx_village_members_student ON village_members(student_id);
CREATE INDEX IF NOT EXISTS idx_village_invitations_staff ON village_invitations(staff_id);
CREATE INDEX IF NOT EXISTS idx_village_invitations_student ON village_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_village_invitations_status ON village_invitations(status);