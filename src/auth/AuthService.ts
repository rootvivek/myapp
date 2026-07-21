import type { Session } from '@supabase/supabase-js';
import { createTempClient, supabase } from '../lib/supabase';
import { isValidEmail, normalizeEmail } from '../utils/email';
import { saveShopBranding } from '../utils/shopSettings';
import { DEFAULT_SHOP_NAME, ERROR_MESSAGES } from './constants';
import { handleAuthError } from './helpers';
import { loadProfileWithRetry, updateActiveShop } from './ProfileService';
import { createShop, getUserShops, resolveActiveShop } from './ShopService';
import type { UserProfile } from './types';

export interface AuthResult {
  session: Session | null;
  profile: UserProfile | null;
}

export interface SignUpResult extends AuthResult {
  needsEmailConfirm: boolean;
}

export async function signInUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) throw error;

  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  let userProfile: UserProfile | null = null;

  if (data.user && data.session) {
    const tempClient = createTempClient();
    await tempClient.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    userProfile = await loadProfileWithRetry(data.user.id, 2, tempClient);

    const resolved = await resolveActiveShop(data.user.id, tempClient);

    await updateActiveShop(data.user.id, resolved.activeShopId, tempClient);

    userProfile = await loadProfileWithRetry(data.user.id, 2, tempClient);
  }

  if (userProfile?.shopName) {
    void saveShopBranding({ shopName: userProfile.shopName });
  }

  return {
    session: data.session,
    profile: userProfile,
  };
}

export async function handleExistingUserSignUp(
  email: string,
  password: string
): Promise<SignUpResult> {
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
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
    const tempClient = createTempClient();
    await tempClient.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    });

    userProfile = await loadProfileWithRetry(loginData.user.id, 2, tempClient);

    const userShops = await getUserShops(loginData.user.id, tempClient);
    let activeShopId = '';

    if (userShops.length > 0) {
      activeShopId = userShops[0].id;
    } else {
      const newShop = await createShop(loginData.user.id, DEFAULT_SHOP_NAME, tempClient);
      activeShopId = newShop.id;
    }

    await updateActiveShop(loginData.user.id, activeShopId, tempClient);
    userProfile = await loadProfileWithRetry(loginData.user.id, 2, tempClient);
  }

  if (userProfile?.shopName) {
    void saveShopBranding({ shopName: userProfile.shopName });
  }

  return {
    needsEmailConfirm: false,
    session: loginData.session,
    profile: userProfile,
  };
}

export async function signUpUser(
  email: string,
  password: string,
  name: string
): Promise<SignUpResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return await handleExistingUserSignUp(normalized, password);
      }
      throw error;
    }

    return {
      needsEmailConfirm: !data.session,
      session: data.session,
      profile: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return await handleExistingUserSignUp(normalized, password);
    }
    throw handleAuthError(err, 'Sign up failed');
  }
}
