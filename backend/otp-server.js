require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// ── Security: Restrict CORS to known origins ──────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json({ limit: '10kb' })); // Limit payload size

// ── Security: HTTPS enforcement (behind reverse proxy) ─────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  next();
});

// ── Security: Basic security headers ──────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const hasSupabaseConfig = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAdmin = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

const otpStore = new Map();
const otpAttempts = new Map(); // Track failed OTP attempts per phone

// ── Rate limiting ──────────────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);

// ── OTP brute-force protection ────────────────────────────────────
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkOtpAttempts(phone) {
  const entry = otpAttempts.get(phone);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  if (Date.now() > entry.lockedUntil) {
    otpAttempts.delete(phone);
    return { allowed: true };
  }
  return { allowed: entry.count < MAX_OTP_ATTEMPTS };
}

function recordOtpAttempt(phone, success) {
  if (success) {
    otpAttempts.delete(phone);
    return;
  }
  const entry = otpAttempts.get(phone) || { count: 0, lockedUntil: null };
  entry.count++;
  if (entry.count >= MAX_OTP_ATTEMPTS) {
    entry.lockedUntil = Date.now() + OTP_LOCKOUT_MS;
  }
  otpAttempts.set(phone, entry);
}

// ── Helpers ────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function sanitizeString(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidPhone(phone) {
  return /^\+91\d{10}$/.test(phone);
}

// ── Routes ─────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
  try {
    const rateKey = `send-otp:${req.ip}`;
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const phone = normalizePhone(req.body.phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid Indian phone number is required.' });
    }

    const otp = generateOtp();
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (!process.env.MSG91_AUTHKEY) {
      // Only return OTP in development mode
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          ok: true,
          message: 'OTP sent successfully in development mode.',
          demoOtp: otp,
        });
      }
      return res.json({ ok: true, message: 'OTP sent successfully.' });
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
    const rateKey = `verify-otp:${req.ip}`;
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid Indian phone number is required.' });
    }
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit OTP is required.' });
    }

    // Check brute-force lockout
    const attemptCheck = checkOtpAttempts(phone);
    if (!attemptCheck.allowed) {
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${attemptCheck.retryAfter} seconds.`,
      });
    }

    const entry = otpStore.get(phone);

    if (!entry) {
      return res.status(400).json({ error: 'Please request an OTP first.' });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (entry.otp !== otp) {
      recordOtpAttempt(phone, false);
      return res.status(400).json({ error: 'OTP is invalid.' });
    }

    recordOtpAttempt(phone, true);
    otpStore.delete(phone);
    return res.json({ ok: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'OTP verification failed.' });
  }
});

app.post('/api/signup-with-otp', async (req, res) => {
  try {
    const rateKey = `signup:${req.ip}`;
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

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

    const sanitizedName = sanitizeString(name, 100);
    const sanitizedShopName = sanitizeString(shopName, 150);

    if (!sanitizedName || !sanitizedShopName || !password || password.length < 6) {
      return res.status(400).json({ error: 'Name, shop name, and password (min 6 chars) are required.' });
    }

    const aliasEmail = `${normalizedPhone.replace(/\D/g, '')}@msg91.local`;

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: aliasEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: sanitizedName,
        phone: normalizedPhone,
        shop_name: sanitizedShopName,
      },
    });

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

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
          shop_name: sanitizedShopName,
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
        name: sanitizedName,
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
