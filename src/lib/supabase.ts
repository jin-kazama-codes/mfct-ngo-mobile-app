import { createClient } from '@supabase/supabase-js';
import * as Updates from 'expo-updates';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseSecretKey =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_KEY || '';

/**
 * Automatically determine the Supabase schema to use (matches website behavior):
 *
 * 1. Google Play Store / Production Builds:
 *    - In release builds (__DEV__ === false) OR when running on the 'production' channel,
 *      we ALWAYS use the 'public' schema to protect live users.
 *    - Any accidental 'dev' setting in local env will be safely ignored in production builds.
 *
 * 2. Development Builds / Local Expo Go:
 *    - In development mode (__DEV__ === true),
 *      default to 'dev' schema so development builds never alter live production data.
 *    - Can still be explicitly overridden if EXPO_PUBLIC_SUPABASE_SCHEMA is specified.
 */
export function resolveSupabaseSchema(): string {
  const envSchema =
    process.env.EXPO_PUBLIC_SUPABASE_SCHEMA?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim();

  const isProduction =
    !__DEV__ ||
    Updates.channel === 'production' ||
    process.env.EXPO_PUBLIC_ENV === 'production' ||
    process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production / Google Play Store: ALWAYS ensure 'public' schema
    if (envSchema && envSchema.toLowerCase() !== 'dev') {
      return envSchema;
    }
    return 'public';
  }

  // In development build / Expo dev server: default to 'dev' schema
  return envSchema || 'dev';
}

export const SUPABASE_SCHEMA = resolveSupabaseSchema();

console.log(
  `[Supabase] Mode: ${__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'} | Schema: "${SUPABASE_SCHEMA}"`
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Warning: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: SUPABASE_SCHEMA },
});

export const supabaseAdmin = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      db: { schema: SUPABASE_SCHEMA },
      auth: { persistSession: false },
    })
  : supabase;
