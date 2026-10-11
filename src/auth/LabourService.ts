import { createTempClient, supabase } from '../lib/supabase';
import { ERROR_MESSAGES, INTERNAL_EMAIL_DOMAIN } from './constants';

import type { UserProfile } from './types';

export async function createLabourAccount(
  ownerProfile: UserProfile | null,
  username: string,
  password: string,
  phone: string
): Promise<void> {
  if (!ownerProfile || ownerProfile.role !== 'owner') {
    throw new Error(ERROR_MESSAGES.OWNER_ONLY_LABOUR);
  }

  const trimmedUsername = username.trim().toLowerCase();
  if (!trimmedUsername) {
    throw new Error(ERROR_MESSAGES.USERNAME_REQUIRED);
  }
  if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
    throw new Error('Login ID must be 3–20 characters and use only letters, numbers, or underscores.');
  }

  // Keep the account ID short and human-readable. The synthetic email remains
  // internal to Supabase Auth and is never shown to staff.
  const generatedEmail = `${trimmedUsername}@${INTERNAL_EMAIL_DOMAIN}`;

  const tempClient = createTempClient();
  const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
    email: generatedEmail,
    password,
    options: {
      data: { role: 'labour', shop_id: ownerProfile.shopId },
    },
  });

  if (signUpError) {
    if (/already registered|already exists/i.test(signUpError.message)) {
      throw new Error('That Login ID is already taken. Please choose another.');
    }
    throw new Error(`Failed to create account: ${signUpError.message}`);
  }

  const newUserId = signUpData.user?.id;
  if (!newUserId) {
    throw new Error(ERROR_MESSAGES.ACCOUNT_CREATED_NO_ID);
  }

  // Upsert: the `on_auth_user_created` DB trigger already creates a minimal
  // profile row for this user, so a plain insert would fail with a duplicate key.
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: newUserId,
      name: username.trim(),
      username: trimmedUsername,
      phone: phone.trim(),
      role: 'labour',
      shop_id: ownerProfile.shopId,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(`${ERROR_MESSAGES.PROFILE_SETUP_FAILED} ${profileError.message}`);
  }
}

export async function resetLabourPassword(
  isOwner: boolean,
  labourUserId: string,
  newPassword: string
): Promise<void> {
  if (!isOwner) {
    throw new Error(ERROR_MESSAGES.OWNER_ONLY_RESET);
  }

  const { error } = await supabase.rpc('admin_reset_labour_password', {
    p_labour_id: labourUserId,
    p_new_password: newPassword,
  });

  if (error) throw error;
}
