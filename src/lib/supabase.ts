import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.warn('⚠️  Supabase not configured properly. App will run in demo mode but database features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
