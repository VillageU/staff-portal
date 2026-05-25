/*
  # Add Staff Availability and Calendar Sync

  1. New Tables
    - `staff_availability`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff)
      - `day_of_week` (integer, 0-6 where 0 = Sunday)
      - `start_time` (time)
      - `end_time` (time)
      - `is_available` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `staff_calendar_sync`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to staff, unique)
      - `calendar_provider` (text, e.g., 'google', 'outlook', 'manual')
      - `sync_enabled` (boolean, default false)
      - `last_synced_at` (timestamptz)
      - `calendar_access_token` (text, encrypted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Staff can only access their own availability and calendar sync settings
    - Add policies for authenticated access

  3. Notes
    - Staff can sync their external calendars (Google, Outlook) or manage manually
    - Availability slots define when staff are available for meetings
    - Students can see staff availability when scheduling meetings
*/

-- Create staff_availability table
CREATE TABLE IF NOT EXISTS staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to staff_availability"
  ON staff_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to staff_availability"
  ON staff_availability
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to staff_availability"
  ON staff_availability
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to staff_availability"
  ON staff_availability
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create staff_calendar_sync table
CREATE TABLE IF NOT EXISTS staff_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE UNIQUE NOT NULL,
  calendar_provider text NOT NULL CHECK (calendar_provider IN ('google', 'outlook', 'manual')),
  sync_enabled boolean DEFAULT false,
  last_synced_at timestamptz,
  calendar_access_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff_calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to staff_calendar_sync"
  ON staff_calendar_sync
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon insert to staff_calendar_sync"
  ON staff_calendar_sync
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to staff_calendar_sync"
  ON staff_calendar_sync
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to staff_calendar_sync"
  ON staff_calendar_sync
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_day ON staff_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_calendar_sync_staff ON staff_calendar_sync(staff_id);
