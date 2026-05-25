/*
  # Add Student Tags

  1. Changes
    - Add tags column to students table as a text array
    - This allows students to opt-in to share identifiers
    - Examples: Military, First-Generation, various race/ethnicity identifiers
  
  2. Notes
    - Tags are stored as an array for easy filtering and display
    - Default value is empty array
    - Tags help staff provide targeted support to student populations
*/

-- Add tags column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'tags'
  ) THEN
    ALTER TABLE students ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Update existing students with sample tags (opt-in data)
UPDATE students SET tags = ARRAY['First-Generation', 'Hispanic/Latino'] 
WHERE email = 'alex.martinez@villageu.edu';

UPDATE students SET tags = ARRAY['International Student', 'Asian'] 
WHERE email = 'sarah.chen@villageu.edu';

UPDATE students SET tags = ARRAY['Military', 'Veteran'] 
WHERE email = 'michael.johnson@villageu.edu';

UPDATE students SET tags = ARRAY['First-Generation', 'African American'] 
WHERE email = 'jessica.williams@villageu.edu';

UPDATE students SET tags = ARRAY['Transfer Student'] 
WHERE email = 'david.brown@villageu.edu';