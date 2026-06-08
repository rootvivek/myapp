import { createClient } from '@supabase/supabase-js';

import { getSupabaseAuthStorage } from './supabaseAuthStorage';

// @ts-ignore
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = (EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

export const isSupabaseConfigured = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0 && supabaseUrl.startsWith('http');

export const supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getSupabaseAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) : null as any;
