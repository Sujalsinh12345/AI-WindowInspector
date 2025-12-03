import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DefectDetection = {
  id: string;
  user_id: string | null;
  image_url: string;
  image_name: string;
  detection_result: {
    is_window?: boolean;
    non_window_reason?: string;
    cracks: Array<{
      type: string;
      severity: string;
      location: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
    window_type: string;
    overall_confidence: number;
    analysis: string;
  };
  crack_detected: boolean;
  window_type: string | null;
  confidence_score: number | null;
  created_at: string;
};
