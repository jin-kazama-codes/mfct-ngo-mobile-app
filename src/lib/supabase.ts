import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tyiecstaywsocmqsabhg.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_02kGJR-DB9gOz0RGANer7A_aygtlC64';
const supabaseSchema = process.env.EXPO_PUBLIC_SUPABASE_SCHEMA || 'public';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Warning: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in environment. Using fallback configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema },
});
