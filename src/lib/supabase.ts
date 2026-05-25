// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Staff {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  university_id: string;
  is_admin: boolean;
  profile_image_url?: string | null;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  major: string;
  year: string;
  gpa?: number | null;
  created_at: string;
}

export interface StudentSCI {
  id: string;
  student_id: string;
  total_score: number;
  p2p_score: number;
  s2s_score: number;
  cc_score: number;
  tier: 'strong' | 'partial' | 'limited';
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  calculated_at: string;
}

export interface StudentStaffMetadata {
  student_segments?: string[] | null;
  share_with_staff?: boolean;
  program?: string | null;
  status?: string | null;
  notes?: string | null;
}

export interface StudentSegmentCatalog {
  id: string;
  name: string;
  label: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentWithSCI extends Student {
  sci?: StudentSCI | null;
  student_staff_metadata?: StudentStaffMetadata | null;
}
