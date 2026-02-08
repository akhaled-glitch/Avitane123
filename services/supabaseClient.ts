import { createClient } from '@supabase/supabase-js';

// Configuration from environment or defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://xrjrtipakrrglbhileon.supabase.co';
// Using the provided key. Note: If this key is not a valid JWT (anon key), auth requests may fail.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_lWJDV2sT08Ginduv31NebA_0m9-9DAn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is actually configured
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};