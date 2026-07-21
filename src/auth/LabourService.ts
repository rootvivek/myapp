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

  // Generate a shop-scoped internal email address to avoid collisions
  const shopCode = ownerProfile.shopId.substring(0, 8);
  const loginUsername = `${trimmedUsername}.${shopCode}`;
  const generatedEmail = `${loginUsername}@${INTERNAL_EMAIL_DOMAIN}`;

  const tempClient = createTempClient();
  const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
    email: generatedEmail,
    password,
    options: {
      data: { role: 'labour', shop_id: ownerProfile.shopId },
    },
  });

  if (signUpError) {
    throw new Error(`Failed to create account: ${signUpError.message}`);
  }

  const newUserId = signUpData.user?.id;
  if (!newUserId) {
    throw new Error(ERROR_MESSAGES.ACCOUNT_CREATED_NO_ID);
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: newUserId,
    name: username.trim(),
    username: loginUsername,
    phone: phone.trim(),
    role: 'labour',
    shop_id: ownerProfile.shopId,
  });

  if (profileError) {
    throw new Error(ERROR_MESSAGES.PROFILE_SETUP_FAILED);
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
