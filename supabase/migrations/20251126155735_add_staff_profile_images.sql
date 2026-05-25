/*
  # Add Staff Profile Images

  1. Changes
    - Add profile_image_url column to staff table for profile pictures
    - Update existing staff records with stock profile images from Pexels
  
  2. Notes
    - Uses stock photos from Pexels for demo purposes
    - Profile images enhance the user experience in the staff portal
*/

-- Add profile image column to staff table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE staff ADD COLUMN profile_image_url text DEFAULT '';
  END IF;
END $$;

-- Update existing staff with stock profile images
UPDATE staff SET profile_image_url = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
WHERE email = 'sarah.johnson@villageu.edu';

UPDATE staff SET profile_image_url = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'
WHERE email = 'mike.chen@villageu.edu';

UPDATE staff SET profile_image_url = 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400'
WHERE email = 'emily.rodriguez@villageu.edu';
