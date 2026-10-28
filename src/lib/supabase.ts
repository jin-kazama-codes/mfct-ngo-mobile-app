import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseSecretKey =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_KEY || '';
const supabaseSchema =
  process.env.EXPO_PUBLIC_SUPABASE_SCHEMA?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim() ||
  'public';

console.log('[Supabase] Schema:', JSON.stringify(supabaseSchema));

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Warning: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in environment. Using fallback configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema || 'public' },
});

export const supabaseAdmin = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
    db: { schema: supabaseSchema || 'public' },
    auth: { persistSession: false },
  })
  : supabase;
