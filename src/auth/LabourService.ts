// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import { UPDATE_API_URL } from '@env';
import { supabase } from '../lib/supabase';
import { ERROR_MESSAGES } from './constants';

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

  const apiUrl = String(UPDATE_API_URL ?? '').replace(/\/$/, '');
  if (!apiUrl) throw new Error('Team management service is not configured.');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) throw new Error('Sign in again before creating a team member.');

  const response = await fetch(`${apiUrl}/api/labour/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ username: trimmedUsername, password, phone: phone.trim() }),
  });
  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'Could not create team member. Please try again.');
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
