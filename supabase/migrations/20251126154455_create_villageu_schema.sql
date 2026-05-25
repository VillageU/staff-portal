/*
  # VillageU Staff Platform Schema

  1. New Tables
    - `staff`
      - `id` (uuid, primary key)
      - `email` (text, unique) - staff email for login
      - `password` (text) - hashed password
      - `first_name` (text)
      - `last_name` (text)
      - `role` (text) - staff role/title
      - `created_at` (timestamptz)
    
    - `students`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `major` (text)
      - `year` (text) - e.g., "Freshman", "Sophomore", etc.
      - `created_at` (timestamptz)
    
    - `meetings`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `staff_id` (uuid, foreign key to staff)
      - `meeting_date` (timestamptz)
      - `meeting_type` (text) - e.g., "Academic Advising", "Career Counseling", etc.
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated staff to access their data
    
  3. Notes
    - This schema supports basic CRUD operations for staff managing student meetings
    - Future enhancements can include file uploads, tags, and more complex analytics
*/

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text DEFAULT 'Staff Member',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all staff data"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  major text NOT NULL,
  year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  meeting_date timestamptz NOT NULL,
  meeting_type text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_staff_id ON meetings(staff_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);