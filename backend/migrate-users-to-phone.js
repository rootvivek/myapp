require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const applyChanges = process.argv.includes('--apply');

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  supabaseUrl.includes('your-project.supabase.co') ||
  serviceRoleKey === 'your_service_role_key'
) {
  console.error(
    'Set real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values in backend/.env before migrating users.'
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

function phoneEmail(phone) {
  return `${normalizePhone(phone).replace(/\D/g, '')}@msg91.local`;
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) return users;
    page += 1;
  }
}

async function loadProfiles() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, name');
  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
}

async function main() {
  const [users, profiles] = await Promise.all([listAllUsers(), loadProfiles()]);
  const usersByEmail = new Map(
    users
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user])
  );

  const candidates = [];
  const skipped = [];

  for (const user of users) {
    const profile = profiles.get(user.id);
    const phone = normalizePhone(profile?.phone || user.user_metadata?.phone);

    if (!phone || phone.length < 10) {
      skipped.push(`${user.email || user.id}: no phone in profiles.phone or user metadata`);
      continue;
    }

    const targetEmail = phoneEmail(phone).toLowerCase();
    if (!targetEmail || targetEmail === '@msg91.local') {
      skipped.push(`${user.email || user.id}: invalid phone ${phone}`);
      continue;
    }

    if ((user.email || '').toLowerCase() === targetEmail) {
      skipped.push(`${user.email}: already migrated`);
      continue;
    }

    const collision = usersByEmail.get(targetEmail);
    if (collision && collision.id !== user.id) {
      skipped.push(`${user.email}: target ${targetEmail} belongs to another user`);
      continue;
    }

    candidates.push({ user, profile, phone, targetEmail });
  }

  console.log(`${applyChanges ? 'APPLY MODE' : 'DRY RUN'}: ${candidates.length} user(s) ready, ${skipped.length} skipped.`);

  for (const candidate of candidates) {
    const oldEmail = candidate.user.email || candidate.user.id;
    console.log(`${applyChanges ? 'Migrating' : 'Would migrate'} ${oldEmail} -> ${candidate.targetEmail}`);

    if (!applyChanges) continue;

    const userMetadata = {
      ...(candidate.user.user_metadata || {}),
      phone: candidate.phone,
    };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(candidate.user.id, {
      email: candidate.targetEmail,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error) {
      console.error(`Failed to migrate ${oldEmail}: ${error.message}`);
      continue;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ phone: candidate.phone })
      .eq('id', candidate.user.id);

    if (profileError) {
      console.error(`Migrated auth user but failed to update profile ${candidate.user.id}: ${profileError.message}`);
    }
  }

  if (skipped.length > 0) {
    console.log('\nSkipped:');
    skipped.forEach((reason) => console.log(`- ${reason}`));
  }

  if (!applyChanges && candidates.length > 0) {
    console.log('\nNo changes made. Run with --apply to perform this migration.');
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
