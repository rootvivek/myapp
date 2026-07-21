export const TIMEOUTS = {
  DEFAULT_MS: 5000,
  QUERY_MS: 10000,
  PROFILE_MS: 12000,
} as const;

export const DEFAULT_SHOP_NAME = 'MCA Phone Wala';
export const INTERNAL_EMAIL_DOMAIN = 'mcaphonewala.internal';

export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Enter a valid email address (example: you@example.com).',
  ALREADY_REGISTERED: 'An account with this email is already registered. Please sign in or use a different email.',
  OWNER_ONLY_LABOUR: 'Only the shop owner can create labour accounts.',
  OWNER_ONLY_RESET: 'Only the shop owner can reset labour passwords.',
  OWNER_ONLY_SHOP_NAME: 'Only the shop owner can update the shop name.',
  NOT_AUTHENTICATED: 'Not authenticated.',
  USERNAME_REQUIRED: 'Username is required for the labour account.',
  CREATE_SHOP_FAILED: 'Could not create shop: ',
  CREATE_PROFILE_FAILED: 'Could not create profile: ',
  ACCOUNT_CREATED_NO_ID: 'Account created but user ID not returned.',
  PROFILE_SETUP_FAILED: 'Account created but profile setup failed.',
} as const;
