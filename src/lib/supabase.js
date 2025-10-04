import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

// Create Supabase client with service role (for backend operations)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client with anon key (for public operations)
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export default supabase;

