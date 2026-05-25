/*
  # Add first_name and last_name columns to students table

  1. Changes
    - Add `first_name` column to students table (text, not null with default)
    - Add `last_name` column to students table (text, not null with default)
    - Migrate existing `full_name` data to first_name and last_name
    - Handle edge cases (single names, empty values, multiple names)

  2. Data Migration
    - Split full_name on first space
    - First word becomes first_name
    - Remaining words become last_name
    - If only one word, use it for both first_name and last_name
    - If empty full_name, use placeholder values

  3. Notes
    - Keeps full_name column for backward compatibility
    - All existing records will have first_name and last_name populated
*/

-- Add first_name and last_name columns with temporary defaults
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE students ADD COLUMN first_name text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE students ADD COLUMN last_name text DEFAULT '';
  END IF;
END $$;

-- Migrate existing full_name data to first_name and last_name
UPDATE students
SET 
  first_name = CASE 
    WHEN trim(full_name) = '' THEN 'Unknown'
    WHEN position(' ' in trim(full_name)) = 0 THEN trim(full_name)
    ELSE trim(split_part(trim(full_name), ' ', 1))
  END,
  last_name = CASE 
    WHEN trim(full_name) = '' THEN 'User'
    WHEN position(' ' in trim(full_name)) = 0 THEN trim(full_name)
    ELSE trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1))
  END
WHERE first_name = '' OR last_name = '';

-- Make columns NOT NULL after migration
ALTER TABLE students ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN last_name SET NOT NULL;

-- Remove default now that all rows have values
ALTER TABLE students ALTER COLUMN first_name DROP DEFAULT;
ALTER TABLE students ALTER COLUMN last_name DROP DEFAULT;