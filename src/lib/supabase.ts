import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import { getSupabaseAuthStorage } from './supabaseAuthStorage';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

/** Template values in app.config extra must not override a real .env (causes "Invalid API key"). */
function isPlaceholderSupabaseUrl(url: string): boolean {
  return url.includes('YOUR_PROJECT_REF') || url.includes('placeholder');
}

/** Legacy anon JWT (`eyJ…`) or new publishable key (`sb_publishable_…`). Reject secrets and templates. */
function isPlaceholderAnonKey(key: string): boolean {
  if (key.length < 20 || key.includes('YOUR_ANON') || key.startsWith('YOUR_')) return true;
  if (key.startsWith('sb_secret_')) return true; // must never ship in a client app
  if (key.startsWith('eyJ')) return false;
  if (key.startsWith('sb_publishable_')) return false;
  return true;
}

function resolveSupabaseCredentials(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;
  const fromEnvUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  const fromEnvKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  const fromExtraUrl = extra?.supabaseUrl?.trim() ?? '';
  const fromExtraKey = extra?.supabaseAnonKey?.trim() ?? '';

  // Prefer Metro-inlined EXPO_PUBLIC_* (matches current .env). `expo.extra` can be stale after editing .env.
  const url =
    (fromEnvUrl.length > 0 && !isPlaceholderSupabaseUrl(fromEnvUrl) ? fromEnvUrl : null) ??
    (fromExtraUrl.length > 0 && !isPlaceholderSupabaseUrl(fromExtraUrl) ? fromExtraUrl : null) ??
    '';
  const anonKey =
    (fromEnvKey.length > 0 && !isPlaceholderAnonKey(fromEnvKey) ? fromEnvKey : null) ??
    (fromExtraKey.length > 0 && !isPlaceholderAnonKey(fromExtraKey) ? fromExtraKey : null) ??
    '';
  return { url, anonKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseCredentials();

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  // Empty URL makes fetch throw "Network request failed" with no useful detail.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to .env, restart with: npx expo start -c',
  );
}

export const isSupabaseConfigured = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0 && supabaseUrl.startsWith('http');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getSupabaseAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Default flow is `implicit` — better for RN without full WebCrypto (avoid pkce + S256 warnings).
  },
});
