import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ceitsgypnoysxtarhrsp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXRzZ3lwbm95c3h0YXJocnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU2NTMsImV4cCI6MjA3NTA5MTY1M30.g1kZmkSUHuekr0CybP0Zo3YBMjmx6ZPhPBmBfA5Otto';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
