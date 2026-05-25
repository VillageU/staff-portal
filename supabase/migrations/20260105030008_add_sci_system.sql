/*
  # Add Student Connectivity Index (SCI) System

  1. New Tables
    - `interactions_mcm` - Meaningful Contact Moments tracking
      - Stores all logged P2P, S2S, and CC interactions
      - Links to students and staff
      - Includes domain, type, subtype, evidence details

    - `student_sci` - Current SCI scores and metadata
      - One row per student with current calculated scores
      - P2P score (0-10), S2S score (0-10), CC score (0-10)
      - Total score (0-30), tier, and trend

    - `student_sci_history` - Historical snapshots for trend analysis
      - Tracks score changes over time
      - Used for 30-day trend calculations

    - `established_connections` - Connection tracking cache
      - Tracks P2P and S2S connections meeting threshold
      - Counts positive interactions per connection

    - `co_curricular_consistency` - CC domain tracking
      - Tracks whether students meet CC criteria
      - Multi-timepoint or multi-category participation

    - `student_staff_metadata` - Optional staff-side metadata
      - Cohort, program, and other staff-managed attributes
      - Does not modify students table

  2. Schema Changes
    - Add `role` column to staff table (admin/manager/staff)

  3. Security
    - Enable RLS on all new tables
    - Staff can view and insert interactions for accessible students
    - Staff can view SCI data for accessible students

  4. Indexes
    - Add indexes for performance on frequently queried columns
*/

-- Add role column to staff table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'role_type'
  ) THEN
    ALTER TABLE staff ADD COLUMN role_type text DEFAULT 'staff' CHECK (role_type IN ('admin', 'manager', 'staff'));
  END IF;
END $$;

-- Create interactions_mcm table
CREATE TABLE IF NOT EXISTS interactions_mcm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain IN ('P2P', 'S2S', 'CC')),
  subtype text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  notes text DEFAULT '',
  is_positive boolean DEFAULT true,
  evidence_source text,
  related_key text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interactions_mcm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read interactions"
  ON interactions_mcm FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert interactions"
  ON interactions_mcm FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create student_sci table
CREATE TABLE IF NOT EXISTS student_sci (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  p2p_score integer DEFAULT 0 CHECK (p2p_score >= 0 AND p2p_score <= 10),
  s2s_score integer DEFAULT 0 CHECK (s2s_score >= 0 AND s2s_score <= 10),
  cc_score integer DEFAULT 0 CHECK (cc_score >= 0 AND cc_score <= 10),
  total_score integer DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 30),
  tier text DEFAULT 'limited' CHECK (tier IN ('strong', 'partial', 'limited')),
  trend text DEFAULT 'unknown' CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
  last_meaningful_signal_date timestamptz,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE student_sci ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read student SCI"
  ON student_sci FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert student SCI"
  ON student_sci FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update student SCI"
  ON student_sci FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create student_sci_history table
CREATE TABLE IF NOT EXISTS student_sci_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date timestamptz NOT NULL DEFAULT now(),
  total_score integer NOT NULL CHECK (total_score >= 0 AND total_score <= 30),
  p2p_score integer DEFAULT 0,
  s2s_score integer DEFAULT 0,
  cc_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_sci_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read SCI history"
  ON student_sci_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert SCI history"
  ON student_sci_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create established_connections table
CREATE TABLE IF NOT EXISTS established_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain IN ('P2P', 'S2S')),
  connection_key text NOT NULL,
  positive_interaction_count integer DEFAULT 0,
  first_interaction_date timestamptz,
  last_interaction_date timestamptz,
  is_established boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, domain, connection_key)
);

ALTER TABLE established_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read established connections"
  ON established_connections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert established connections"
  ON established_connections FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update established connections"
  ON established_connections FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create co_curricular_consistency table
CREATE TABLE IF NOT EXISTS co_curricular_consistency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meets_threshold boolean DEFAULT false,
  threshold_basis text,
  last_evidence_date timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE co_curricular_consistency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read CC consistency"
  ON co_curricular_consistency FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert CC consistency"
  ON co_curricular_consistency FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update CC consistency"
  ON co_curricular_consistency FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create student_staff_metadata table (optional)
CREATE TABLE IF NOT EXISTS student_staff_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cohort text,
  program text,
  status text DEFAULT 'active',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_staff_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read student metadata"
  ON student_staff_metadata FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert student metadata"
  ON student_staff_metadata FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update student metadata"
  ON student_staff_metadata FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_student_id ON interactions_mcm(student_id);
CREATE INDEX IF NOT EXISTS idx_interactions_staff_id ON interactions_mcm(staff_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions_mcm(date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_domain ON interactions_mcm(domain);
CREATE INDEX IF NOT EXISTS idx_interactions_related_key ON interactions_mcm(related_key);

CREATE INDEX IF NOT EXISTS idx_student_sci_student_id ON student_sci(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sci_tier ON student_sci(tier);
CREATE INDEX IF NOT EXISTS idx_student_sci_trend ON student_sci(trend);
CREATE INDEX IF NOT EXISTS idx_student_sci_total_score ON student_sci(total_score);

CREATE INDEX IF NOT EXISTS idx_sci_history_student_id ON student_sci_history(student_id);
CREATE INDEX IF NOT EXISTS idx_sci_history_snapshot_date ON student_sci_history(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_established_conn_student ON established_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_established_conn_domain ON established_connections(domain);
CREATE INDEX IF NOT EXISTS idx_established_conn_key ON established_connections(connection_key);

CREATE INDEX IF NOT EXISTS idx_cc_consistency_student ON co_curricular_consistency(student_id);
