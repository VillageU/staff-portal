/*
  # Add GPA field to students table

  1. Changes
    - Add `gpa` column to students table
      - Type: numeric(3,2) to support values like 3.45
      - Nullable: true (not all students may have GPA recorded)
      - Range: 0.0 to 4.0
      - Default: null

  2. Security
    - No RLS changes needed (students table already has RLS enabled)
*/

-- Add GPA column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'gpa'
  ) THEN
    ALTER TABLE students ADD COLUMN gpa NUMERIC(3,2) CHECK (gpa >= 0.0 AND gpa <= 4.0);
  END IF;
END $$;