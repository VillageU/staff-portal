/*
  # Add Meeting Fields

  1. Changes
    - Add meeting_reason column to meetings table for categorizing meeting purpose
    - Add message column to meetings table for personalized notes/messages
    - Add is_virtual column to distinguish virtual vs in-person meetings
  
  2. Notes
    - meeting_reason stores the reason for the meeting (e.g., Academic Advising, Career Counseling)
    - message stores personalized notes from the staff member
    - is_virtual is a boolean flag (true = virtual, false = in-person)
*/

-- Add meeting_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'meeting_reason'
  ) THEN
    ALTER TABLE meetings ADD COLUMN meeting_reason text DEFAULT '';
  END IF;
END $$;

-- Add message column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'message'
  ) THEN
    ALTER TABLE meetings ADD COLUMN message text DEFAULT '';
  END IF;
END $$;

-- Add is_virtual column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'is_virtual'
  ) THEN
    ALTER TABLE meetings ADD COLUMN is_virtual boolean DEFAULT false;
  END IF;
END $$;
