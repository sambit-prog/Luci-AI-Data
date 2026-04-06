import { createClient } from '@supabase/supabase-js';

// Fall back to placeholder values in demo/dev mode so the app doesn't crash
// when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
