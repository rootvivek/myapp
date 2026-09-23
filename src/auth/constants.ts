export const TIMEOUTS = {
  DEFAULT_MS: 5000,
  QUERY_MS: 10000,
  PROFILE_MS: 12000,
} as const;

export const DEFAULT_SHOP_NAME = 'MCA Phone Wala';

/**
 * Supabase Auth in this app is email/password only, so phone numbers and team
 * member usernames are mapped onto synthetic internal email aliases.
 *
 * ️ Do NOT change OWNER_EMAIL_DOMAIN. Every existing shop owner account was
 * created as `<phone digits>@msg91.local`; changing it locks them all out.
 * INTERNAL_EMAIL_DOMAIN is what Manage Labour uses for staff accounts.
 */
export const OWNER_EMAIL_DOMAIN = 'msg91.local';
export const INTERNAL_EMAIL_DOMAIN = 'mcaphonewala.internal';

export const ERROR_MESSAGES = {
  INVALID_PHONE: 'Enter a valid phone number.',
  INVALID_CREDENTIALS: 'Invalid phone number / username or password.',
  ALREADY_REGISTERED: 'An account with this phone number is already registered. Please sign in.',
  EMAIL_NOT_CONFIRMED:
    'This account exists but Supabase is still waiting for an email confirmation. Open Supabase Dashboard → Authentication → Providers → Email and turn OFF "Confirm email", then sign in again.',
  SESSION_MISSING:
    'Your session could not be established, so the profile could not be created. Disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email, then sign in again.',
  OWNER_ONLY_LABOUR: 'Only the shop owner can create labour accounts.',
  OWNER_ONLY_RESET: 'Only the shop owner can reset labour passwords.',
  USERNAME_REQUIRED: 'Username is required for the labour account.',
  CREATE_SHOP_FAILED: 'Could not create shop: ',
  CREATE_PROFILE_FAILED: 'Could not create profile: ',
  ACCOUNT_CREATED_NO_ID: 'Account created but user ID not returned.',
  PROFILE_SETUP_FAILED: 'Account created but profile setup failed.',
} as const;
