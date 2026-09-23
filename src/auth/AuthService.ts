import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { normalizePhone } from '../services/msg91Service';
import { isValidEmail, normalizeEmail } from '../utils/email';
import { logger } from '../utils/logger';
import { saveShopBranding } from '../utils/shopSettings';
import {
  DEFAULT_SHOP_NAME,
  ERROR_MESSAGES,
  INTERNAL_EMAIL_DOMAIN,
  OWNER_EMAIL_DOMAIN,
} from './constants';
import { handleAuthError } from './helpers';
import { fetchProfile, loadProfileWithRetry } from './ProfileService';
import type { UserProfile } from './types';

interface AuthResult {
  session: Session | null;
  profile: UserProfile | null;
}
interface SignUpResult extends AuthResult {
  needsPhoneConfirm: boolean;
}

/**
 * Supabase Auth here is email/password only, so phone numbers and team-member
 * usernames are mapped onto synthetic internal email aliases.
 *
 * ⚠️ OWNER_EMAIL_DOMAIN must never change: every existing owner account was
 * created as `<phone digits>@msg91.local`, and changing it locks them all out.
 */
const INTERNAL_DOMAINS = [OWNER_EMAIL_DOMAIN, INTERNAL_EMAIL_DOMAIN];

function getInternalEmail(phone: string, domain: string = OWNER_EMAIL_DOMAIN): string {
  const normalizedPhone = normalizePhone(phone);
  return normalizeEmail(`${normalizedPhone.replace(/\D/g, '')}@${domain}`);
}

/**
 * A phone number (digits, +, spaces, dashes, parens) as opposed to a team-member
 * username, which always contains a "." or a letter.
 */
function isPhoneLike(identifier: string): boolean {
  const trimmed = identifier.trim();
  return trimmed.length > 0 && /^[+\d][\d\s\-()]*$/.test(trimmed);
}

/**
 * Every alias an identifier could have been created with, in priority order:
 *   • "user@x.com"          → that email
 *   • "9876543210"          → <digits>@msg91.local, then <digits>@mcaphonewala.internal
 *   • "ravi.a1b2c3d4"       → <username>@mcaphonewala.internal (team member), then @msg91.local
 */
function getSignInCandidates(identifier: string): string[] {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return [normalizeEmail(trimmed)];

  const digits = normalizePhone(trimmed).replace(/\D/g, '');
  if (isPhoneLike(trimmed) && digits.length >= 10) {
    return INTERNAL_DOMAINS.map((domain) => getInternalEmail(digits, domain));
  }

  const username = normalizeEmail(trimmed);
  return INTERNAL_DOMAINS.map((domain) => normalizeEmail(`${username}@${domain}`));
}

function isEmailNotConfirmed(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string }).code ?? '';
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: unknown }).message ?? '');
  return code === 'email_not_confirmed' || /email not confirmed/i.test(message);
}

function emailNotConfirmedError(): Error {
  return new Error(ERROR_MESSAGES.EMAIL_NOT_CONFIRMED);
}

async function ensureFreshSession(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return data.session;
}

async function recoverSignupSession(email: string, password: string) {
  try {
    // signInWithPassword replaces any existing session, so an explicit signOut
    // here only risks leaving the user signed out if the retry fails.
    return await ensureFreshSession(email, password);
  } catch (err) {
    logger.warn('[AuthService] session recovery after signup failed:', err);
    return null;
  }
}
export async function signInUser(
  identifier: string,
  password: string
): Promise<AuthResult> {
  const trimmed = identifier.trim();
  const isEmailLogin = trimmed.includes('@');
  const digits = normalizePhone(trimmed).replace(/\D/g, '');

  if (!isEmailLogin && isPhoneLike(trimmed) && digits.length < 10) {
    throw new Error(ERROR_MESSAGES.INVALID_PHONE);
  }
  if (isEmailLogin && !isValidEmail(normalizeEmail(trimmed))) {
    throw new Error(ERROR_MESSAGES.INVALID_PHONE);
  }

  const candidates = getSignInCandidates(trimmed);
  let session: Session | null = null;
  let lastError: unknown = null;

  // Try every alias the account may have been created with (owner phone alias
  // and/or team-member username across both internal domains).
  for (const email of candidates) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (isEmailNotConfirmed(error)) throw emailNotConfirmedError();
      lastError = error;
      continue;
    }

    if (data.session) {
      session = data.session;
      break;
    }
  }

  if (!session) {
    throw handleAuthError(
      lastError ?? new Error(ERROR_MESSAGES.INVALID_CREDENTIALS),
      'Sign in failed'
    );
  }

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const userId = session.user?.id;
  let userProfile: UserProfile | null = null;

  if (userId) {
    try {
      // Also self-heals accounts left with no profile/shop row by older builds.
      userProfile = await loadProfileWithRetry(userId, 2, supabase);
    } catch (err) {
      logger.warn('[AuthService] profile repair failed during sign in:', err);
      userProfile = await fetchProfile(userId);
    }
  }

  if (userProfile?.shopName) {
    void saveShopBranding({ shopName: userProfile.shopName });
  }

  return {
    session,
    profile: userProfile,
  };
}

async function handleExistingUserSignUp(
  phone: string,
  password: string
): Promise<SignUpResult> {
  const normalizedPhone = normalizePhone(phone);
  const emailAlias = getInternalEmail(normalizedPhone);
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: emailAlias,
    password,
  });

  if (loginError) {
    if (isEmailNotConfirmed(loginError)) throw emailNotConfirmedError();
    throw new Error(ERROR_MESSAGES.ALREADY_REGISTERED);
  }

  if (loginData.session) {
    await supabase.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    });
  }

  let userProfile: UserProfile | null = null;

  if (loginData.user && loginData.session) {
    // Small delay for JWT propagation
    await new Promise((r) => setTimeout(r, 300));

    try {
      userProfile = await loadProfileWithRetry(loginData.user.id, 2, supabase);
    } catch {
      // Retry with main client if temp client fails
      try {
        userProfile = await loadProfileWithRetry(loginData.user.id, 2, supabase);
      } catch {
        // Non-fatal: profile/shop will be created on next app load
        userProfile = null;
      }
    }
  }

  if (userProfile?.shopName) {
    void saveShopBranding({ shopName: userProfile.shopName });
  }

  return {
    needsPhoneConfirm: false,
    session: loginData.session,
    profile: userProfile,
  };
}

export async function signUpUser(
  phone: string,
  password: string,
  name: string,
  shopName?: string
): Promise<SignUpResult> {
  const normalizedPhone = normalizePhone(phone);
  const normalized = getInternalEmail(normalizedPhone);
  if (!normalizedPhone || normalizedPhone.length < 10 || !isValidEmail(normalized)) {
    throw new Error(ERROR_MESSAGES.INVALID_PHONE);
  }

  const trimmedShopName = shopName?.trim() || DEFAULT_SHOP_NAME;

  try {
    // Prevent stale cached sessions from a previous owner/user from being reused during signup.
    // This is the real cause of auth.uid() mismatches and cross-user profile data leaks.
    await supabase.auth.signOut().catch(() => undefined);

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          name: name.trim(),
          shop_name: trimmedShopName,
          phone: normalizedPhone,
        },
      },
    });

    if (error) {
      if (isEmailNotConfirmed(error)) throw emailNotConfirmedError();

      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return await handleExistingUserSignUp(normalizedPhone, password);
      }
      throw error;
    }

    // Supabase returns a user without a session when "Confirm email" is enabled.
    // The on_auth_user_created DB trigger has already created the profile + shop
    // rows, so the account is not lost — the user just has no session yet.
    if (data.user && !data.session) {
      try {
        return await handleExistingUserSignUp(normalizedPhone, password);
      } catch (confirmErr) {
        logger.warn(
          '[AuthService] signup returned no session; email confirmation is likely enabled:',
          confirmErr
        );
        return {
          needsPhoneConfirm: true,
          session: null,
          profile: null,
        };
      }
    }

    let userProfile: UserProfile | null = null;
    if (data.user && data.session) {
      try {
        // Some Supabase signup flows return a user without a fully usable auth session.
        // Rehydrate the session and verify it before creating the profile and shop row.
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          const recoveredSession = await recoverSignupSession(normalized, password);
          if (!recoveredSession) {
            throw new Error('Supabase session could not be restored after signup.');
          }
        }

        userProfile = await loadProfileWithRetry(data.user.id, 2, supabase, trimmedShopName);
      } catch (profileErr) {
        const msg = profileErr instanceof Error ? profileErr.message.toLowerCase() : '';
        const isSessionIssue =
          msg.includes('session') ||
          msg.includes('auth.uid') ||
          msg.includes('owner_id') ||
          msg.includes('foreign key') ||
          msg.includes('row-level security') ||
          msg.includes('jwt');

        if (isSessionIssue) {
          const recoveredSession = await recoverSignupSession(normalized, password);
          if (!recoveredSession) {
            throw profileErr;
          }

          userProfile = await loadProfileWithRetry(data.user.id, 2, supabase, trimmedShopName);
        } else {
          throw profileErr;
        }
      }
    }

    if (userProfile?.shopName) {
      void saveShopBranding({ shopName: userProfile.shopName }, userProfile.shopId);
    }

    return {
      needsPhoneConfirm: !data.session,
      session: data.session,
      profile: userProfile,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return await handleExistingUserSignUp(normalizedPhone, password);
    }
    throw handleAuthError(err, 'Sign up failed');
  }
}
