/*
  # Create generated_reports table for AI report history

  1. New Tables
    - `generated_reports`
      - `id` (uuid, primary key) - Unique identifier for each report
      - `staff_id` (uuid, foreign key) - Links to staff who generated the report
      - `report_type` (text) - Type of report (e.g., 'engagement', 'village', 'custom')
      - `report_title` (text) - Descriptive title for the report
      - `report_content` (text) - Full markdown content of the report
      - `custom_prompt` (text, nullable) - Custom prompt used if applicable
      - `student_count` (integer) - Number of students included in report
      - `meeting_count` (integer) - Number of meetings analyzed in report
      - `created_at` (timestamptz) - When the report was generated

  2. Security
    - Enable RLS on `generated_reports` table
    - Add policy for staff to insert their own reports
    - Add policy for staff to select only their own reports
    - Add policy for staff to delete their own reports

  3. Indexes
    - Index on staff_id for efficient queries
    - Index on created_at for sorting by date
*/

-- Create the generated_reports table
CREATE TABLE IF NOT EXISTS generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  report_title text NOT NULL,
  report_content text NOT NULL,
  custom_prompt text,
  student_count integer DEFAULT 0,
  meeting_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can insert their own reports
CREATE POLICY "Staff can insert own reports"
  ON generated_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (staff_id IN (
    SELECT id FROM staff WHERE email = current_user
  ));

-- Policy: Staff can select their own reports
CREATE POLICY "Staff can view own reports"
  ON generated_reports
  FOR SELECT
  TO authenticated
  USING (staff_id IN (
    SELECT id FROM staff WHERE email = current_user
  ));

-- Policy: Staff can delete their own reports
CREATE POLICY "Staff can delete own reports"
  ON generated_reports
  FOR DELETE
  TO authenticated
  USING (staff_id IN (
    SELECT id FROM staff WHERE email = current_user
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_staff_id ON generated_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at DESC);