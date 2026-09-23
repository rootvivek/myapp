require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const hasSupabaseConfig = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAdmin = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

const otpStore = new Map();

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

app.post('/api/send-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const otp = generateOtp();
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (!process.env.MSG91_AUTHKEY) {
      return res.json({
        ok: true,
        message: 'OTP sent successfully in development mode.',
        demoOtp: otp,
      });
    }

    const url =
      `https://api.msg91.com/api/v5/otp?authkey=${encodeURIComponent(process.env.MSG91_AUTHKEY)}` +
      `&mobile=${encodeURIComponent(phone.replace(/^\+/, ''))}` +
      `&country=91` +
      `&otp=${encodeURIComponent(otp)}` +
      `&sender=${encodeURIComponent(process.env.MSG91_SENDER || 'mcaphonewala')}`;

    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await response.text();

    if (!response.ok) {
      return res.status(400).json({ error: text || 'Unable to send OTP.' });
    }

    return res.json({ ok: true, message: 'OTP sent successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to send OTP.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();
    const entry = otpStore.get(phone);

    if (!entry) {
      return res.status(400).json({ error: 'Please request an OTP first.' });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (entry.otp !== otp) {
      return res.status(400).json({ error: 'OTP is invalid.' });
    }

    otpStore.delete(phone);
    return res.json({ ok: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'OTP verification failed.' });
  }
});

app.post('/api/signup-with-otp', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({
        error: 'Backend is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env.',
      });
    }

    const { phone, otp, name, shopName, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const entry = otpStore.get(normalizedPhone);

    if (!entry) {
      return res.status(400).json({ error: 'Please request an OTP first.' });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (entry.otp !== String(otp || '').trim()) {
      return res.status(400).json({ error: 'OTP is invalid.' });
    }

    if (!name?.trim() || !shopName?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Name, shop name, and password are required.' });
    }

    const aliasEmail = `${normalizedPhone.replace(/\D/g, '')}@msg91.local`;

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: aliasEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        phone: normalizedPhone,
        shop_name: shopName.trim(),
      },
    });

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // The `on_auth_user_created` DB trigger already creates the shop + profile
    // row for a new auth user, so only create what is missing and upsert.
    const { data: existingShop, error: shopLookupError } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('owner_id', userData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (shopLookupError) {
      return res.status(400).json({ error: shopLookupError.message });
    }

    let shopId = existingShop?.id;

    if (!shopId) {
      const { data: shopData, error: shopError } = await supabaseAdmin
        .from('shops')
        .insert({
          shop_name: shopName.trim(),
          owner_id: userData.user.id,
        })
        .select('id')
        .single();

      if (shopError) {
        return res.status(400).json({ error: shopError.message });
      }
      shopId = shopData.id;
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userData.user.id,
        name: name.trim(),
        phone: normalizedPhone,
        role: 'owner',
        shop_id: shopId,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    otpStore.delete(normalizedPhone);
    return res.json({
      ok: true,
      message: 'Account created successfully.',
      userId: userData.user.id,
      shopId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Account creation failed.' });
  }
});

app.listen(port, () => {
  console.log(`OTP server running on http://localhost:${port}`);
  if (!hasSupabaseConfig) {
    console.warn('Signup is disabled until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
  }
});
