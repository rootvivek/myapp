import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Parse the tokens/code that Supabase puts in an auth redirect URL.
 *
 * Supabase v2 uses two shapes:
 *   - PKCE:     myapp://auth?code=<uuid>
 *   - implicit: myapp://auth#access_token=...&refresh_token=...
 *
 * `@supabase/supabase-js` v1 had `getSessionFromUrl()`; it does not exist in v2.
 */
export function extractAuthParams(url: string): {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  errorDescription?: string;
} {
  if (!url) return {};

  const [beforeHash, hash = ''] = url.split('#');
  const queryStart = beforeHash.indexOf('?');
  const query = queryStart >= 0 ? beforeHash.slice(queryStart + 1) : '';

  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(query);

  return {
    code: queryParams.get('code') ?? undefined,
    accessToken: hashParams.get('access_token') ?? queryParams.get('access_token') ?? undefined,
    refreshToken: hashParams.get('refresh_token') ?? queryParams.get('refresh_token') ?? undefined,
    errorDescription:
      hashParams.get('error_description') ?? queryParams.get('error_description') ?? undefined,
  };
}

/**
 * Apply an auth redirect URL to the Supabase client.
 *
 * Returns true when a session was established. Non-auth URLs and URLs without
 * credentials are ignored (returns false) so unrelated deep links can't inject
 * a session.
 */
export async function handleAuthDeepLink(
  client: SupabaseClient | null,
  url: string | null | undefined
): Promise<boolean> {
  if (!client || !url) return false;

  const { code, accessToken, refreshToken, errorDescription } = extractAuthParams(url);

  if (errorDescription) {
    console.warn('[deepLink] Auth redirect error:', errorDescription);
    return false;
  }

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn('[deepLink] exchangeCodeForSession failed:', error.message);
      return false;
    }
    return true;
  }

  // Implicit flow: only accept a complete token pair.
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.warn('[deepLink] setSession failed:', error.message);
      return false;
    }
    return true;
  }

  return false;
}
