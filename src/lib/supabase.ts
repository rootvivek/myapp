import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';
import {
  EXPO_PUBLIC_SUPABASE_URL as ENV_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY as ENV_SUPABASE_ANON_KEY,
} from '@env';

import { getSupabaseAuthStorage } from './supabaseAuthStorage';
import { logger } from '../utils/logger';

const supabaseUrl = (
  ENV_SUPABASE_URL ||
  Config.EXPO_PUBLIC_SUPABASE_URL ||
  ''
).trim();

const supabaseAnonKey = (
  ENV_SUPABASE_ANON_KEY ||
  Config.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  logger.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

export const isSupabaseConfigured = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0 && supabaseUrl.startsWith('http');

// WARNING: The anon key is embedded in the client bundle and can be extracted from the APK.
// This is expected for Supabase, but ALL tables MUST have Row Level Security (RLS) enabled
// with proper policies. Never expose the service role key in client code.
export const supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getSupabaseAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) : null as any;

export const createTempClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
