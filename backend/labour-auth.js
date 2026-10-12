const INTERNAL_EMAIL_DOMAIN = 'mcaphonewala.internal';

function requestError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createLabourUser({ supabaseAdmin, ownerId, username, password, phone }) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  const suppliedPassword = String(password || '');

  if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    throw requestError(400, 'Login ID must be 3–20 characters and use only letters, numbers, or underscores.');
  }
  if (suppliedPassword.length < 6) {
    throw requestError(400, 'Password must be at least 6 characters.');
  }
  if (Buffer.byteLength(normalizedPhone, 'utf8') > 128) {
    throw requestError(400, 'Phone number is invalid.');
  }
  if (normalizedPhone.length > 32) {
    throw requestError(400, 'Phone number is invalid.');
  }

  const { data: owner, error: ownerError } = await supabaseAdmin
    .from('profiles')
    .select('role, shop_id')
    .eq('id', ownerId)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (owner?.role !== 'owner' || !owner.shop_id) {
    throw requestError(403, 'Only a shop owner can create team members.');
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', owner.shop_id)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (shopError) throw shopError;
  if (!shop) throw requestError(403, 'Your account is not linked to a shop you own.');

  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: `${normalizedUsername}@${INTERNAL_EMAIL_DOMAIN}`,
    password: suppliedPassword,
    email_confirm: true,
    // app_metadata can only be set by a trusted admin API call. The SQL signup
    // trigger deliberately ignores raw_user_meta_data for authorization.
    app_metadata: { role: 'labour', shop_id: shop.id },
    user_metadata: { name: normalizedUsername, username: normalizedUsername, phone: normalizedPhone },
  });
  if (createError) throw createError;

  const userId = userData?.user?.id;
  if (!userId) throw new Error('Account created but user ID was not returned.');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ name: normalizedUsername, username: normalizedUsername, phone: normalizedPhone })
    .eq('id', userId)
    .eq('role', 'labour')
    .eq('shop_id', shop.id)
    .select('id')
    .maybeSingle();

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw profileError || new Error('Labour profile setup failed.');
  }

  return { userId };
}

module.exports = { createLabourUser };