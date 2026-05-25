/*
  # Sync Student Connections to SCI System and Enhance Staff Notes

  1. Connection Sync System
    - Creates function `sync_connection_to_sci()` to automatically sync student connections to established_connections
    - When a connection status changes to 'established', creates two P2P established_connections records (bidirectional)
    - Sets initial values: domain='P2P', positive_interaction_count=1, is_established=true
    - Creates trigger on connections table to auto-sync on status change
    - Backfills existing established connections from student app
  
  2. Staff Notes Enhancement
    - Adds `last_updated_by_staff_id` column to student_staff_metadata to track which staff member last updated notes
  
  3. Important Notes
    - SCI scores will be recalculated automatically when staff views analytics or connectivity pages
    - The trigger ensures all future connections are automatically synced to the SCI system
    - Existing connections are backfilled in this migration
  
  4. Security
    - Maintains existing RLS policies for all tables
    - Staff can view and update student_staff_metadata for students in their university
*/

-- Add staff tracking to student_staff_metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_staff_metadata' AND column_name = 'last_updated_by_staff_id'
  ) THEN
    ALTER TABLE student_staff_metadata 
    ADD COLUMN last_updated_by_staff_id uuid REFERENCES staff(id);
  END IF;
END $$;

-- Function to sync a connection to established_connections table
CREATE OR REPLACE FUNCTION sync_connection_to_sci()
RETURNS TRIGGER AS $$
DECLARE
  connection_date timestamptz;
BEGIN
  -- Only sync when status changes to 'established'
  IF NEW.status = 'established' AND (OLD.status IS NULL OR OLD.status != 'established') THEN
    connection_date := COALESCE(NEW.updated_at, NEW.created_at, now());
    
    -- Create established_connection for student_a
    INSERT INTO established_connections (
      student_id,
      domain,
      connection_key,
      positive_interaction_count,
      first_interaction_date,
      last_interaction_date,
      is_established,
      updated_at
    )
    VALUES (
      NEW.student_a_id,
      'P2P',
      'peer:' || NEW.student_b_id::text,
      1,
      connection_date,
      connection_date,
      true,
      now()
    )
    ON CONFLICT (student_id, domain, connection_key) 
    DO UPDATE SET
      positive_interaction_count = established_connections.positive_interaction_count + 1,
      last_interaction_date = connection_date,
      is_established = true,
      updated_at = now();
    
    -- Create established_connection for student_b (bidirectional)
    INSERT INTO established_connections (
      student_id,
      domain,
      connection_key,
      positive_interaction_count,
      first_interaction_date,
      last_interaction_date,
      is_established,
      updated_at
    )
    VALUES (
      NEW.student_b_id,
      'P2P',
      'peer:' || NEW.student_a_id::text,
      1,
      connection_date,
      connection_date,
      true,
      now()
    )
    ON CONFLICT (student_id, domain, connection_key) 
    DO UPDATE SET
      positive_interaction_count = established_connections.positive_interaction_count + 1,
      last_interaction_date = connection_date,
      is_established = true,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_sync_connection_to_sci ON connections;

-- Create trigger on connections table
CREATE TRIGGER trigger_sync_connection_to_sci
  AFTER INSERT OR UPDATE OF status ON connections
  FOR EACH ROW
  EXECUTE FUNCTION sync_connection_to_sci();

-- Backfill existing established connections
DO $$
DECLARE
  conn_record RECORD;
  connection_date timestamptz;
BEGIN
  FOR conn_record IN 
    SELECT * FROM connections WHERE status = 'established'
  LOOP
    connection_date := COALESCE(conn_record.updated_at, conn_record.created_at, now());
    
    -- Insert for student_a
    INSERT INTO established_connections (
      student_id,
      domain,
      connection_key,
      positive_interaction_count,
      first_interaction_date,
      last_interaction_date,
      is_established,
      updated_at
    )
    VALUES (
      conn_record.student_a_id,
      'P2P',
      'peer:' || conn_record.student_b_id::text,
      1,
      connection_date,
      connection_date,
      true,
      now()
    )
    ON CONFLICT (student_id, domain, connection_key) DO NOTHING;
    
    -- Insert for student_b
    INSERT INTO established_connections (
      student_id,
      domain,
      connection_key,
      positive_interaction_count,
      first_interaction_date,
      last_interaction_date,
      is_established,
      updated_at
    )
    VALUES (
      conn_record.student_b_id,
      'P2P',
      'peer:' || conn_record.student_a_id::text,
      1,
      connection_date,
      connection_date,
      true,
      now()
    )
    ON CONFLICT (student_id, domain, connection_key) DO NOTHING;
  END LOOP;
END $$;
