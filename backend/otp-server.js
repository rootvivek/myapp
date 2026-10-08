require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Running behind a reverse proxy (Render, Fly, nginx, ...) — trust the first hop
// so `req.ip` reflects the real client instead of the proxy (rate limiting).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ── Security: Restrict CORS to known origins ──────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
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
  // Platform health checks may arrive over the internal network; never block them.
  if (req.path === '/health') return next();
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

// Expired OTPs / lockout entries are only checked on use, so sweep them
// periodically as well. Without this an OTP that is never verified (or a
// lockout that is never retried) would stay in memory forever.
const OTP_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore) {
    if (now > entry.expiresAt) otpStore.delete(phone);
  }
  for (const [phone, entry] of otpAttempts) {
    if (entry.lockedUntil && now > entry.lockedUntil) otpAttempts.delete(phone);
  }
}, OTP_SWEEP_INTERVAL_MS);

/**
 * Log the technical error server-side and return a safe message to the client.
 * Raw Supabase/Postgres messages must never be forwarded: they leak schema
 * details and can be used for user enumeration.
 */
function sendServerError(res, error, fallbackMessage) {
  console.error('[otp-server]', error);
  return res.status(500).json({ error: fallbackMessage || 'Something went wrong. Please try again.' });
}

/** Keep the handful of errors the user can actually act on. */
function actionableSignupError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('already') && (message.includes('registered') || message.includes('exists'))) {
    return 'An account with this mobile number already exists. Please sign in instead.';
  }
  if (message.includes('password')) {
    return 'That password does not meet the requirements.';
  }
  return null;
}

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
      // Log the provider response for debugging, but do not forward it verbatim.
      console.warn('[otp-server] MSG91 send failed:', text);
      return res.status(400).json({ error: 'Unable to send OTP right now. Please try again.' });
    }

    return res.json({ ok: true, message: 'OTP sent successfully.' });
  } catch (error) {
    return sendServerError(res, error, 'Unable to send OTP right now.');
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
    return sendServerError(res, error, 'OTP verification failed. Please try again.');
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
      console.error('[otp-server] createUser failed:', userError);
      return res.status(400).json({
        error: actionableSignupError(userError) || 'Could not create your account. Please try again.',
      });
    }

    const { data: existingShop, error: shopLookupError } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('owner_id', userData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (shopLookupError) {
      return sendServerError(res, shopLookupError, 'Could not create your account. Please try again.');
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
        return sendServerError(res, shopError, 'Could not create your account. Please try again.');
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
      return sendServerError(res, profileError, 'Could not finish setting up your account. Please try again.');
    }

    otpStore.delete(normalizedPhone);
    return res.json({
      ok: true,
      message: 'Account created successfully.',
      userId: userData.user.id,
      shopId,
    });
  } catch (error) {
    return sendServerError(res, error, 'Account creation failed. Please try again.');
  }
});

// ── App Update Check Endpoint ─────────────────────────────────────────
const SUPPORTED_PLATFORMS = new Set(['android', 'ios']);

app.post('/app/update/check', (req, res) => {
  try {
    const { platform, currentVersionCode } = req.body;

    // Validate required fields
    if (!SUPPORTED_PLATFORMS.has(platform) || currentVersionCode === undefined) {
      return res.status(400).json({ error: 'Missing required fields: platform, currentVersionCode' });
    }

    // Coerce user input before comparing: the body may arrive as a string.
    const installedVersionCode = Number.parseInt(String(currentVersionCode), 10);
    if (!Number.isFinite(installedVersionCode)) {
      return res.status(400).json({ error: 'currentVersionCode must be a number.' });
    }

    // Get latest version from environment or fallback
    // In production, you could fetch this from a database or config file
    const releaseNotes = (process.env.APP_RELEASE_NOTES ||
      '- Auto-update feature added\n- Fixed customer screen UI\n- Performance improvements')
      // .env files store "\n" as two literal characters; convert them to real newlines.
      .replace(/\\n/g, '\n');

    // A single latest version for both platforms. `versionCode` is the Android
    // build number / iOS build number, so both platforms compare identically.
    const latest = {
      versionName: process.env.APP_LATEST_VERSION_NAME || '1.0.5',
      versionCode: parseInt(process.env.APP_LATEST_VERSION_CODE || '6', 10),
      downloadUrl:
        platform === 'ios'
          ? process.env.APP_DOWNLOAD_URL_IOS || 'https://apps.apple.com/app/idYOUR_APP_ID'
          : process.env.APP_DOWNLOAD_URL_ANDROID ||
            'https://github.com/rootvivek/myapp/releases/download/v1.0.5/app-release.apk',
      releaseNotes,
      mandatory: process.env.APP_MANDATORY_UPDATE === 'true',
      minVersionCode: parseInt(process.env.APP_MIN_VERSION_CODE || '4', 10),
    };

    if (latest.versionCode > installedVersionCode) {
      return res.json({
        hasUpdate: true,
        versionName: latest.versionName,
        versionCode: latest.versionCode,
        downloadUrl: latest.downloadUrl,
        releaseNotes: latest.releaseNotes,
        mandatory: latest.mandatory,
        minVersionCode: latest.minVersionCode,
      });
    }

    return res.json({ hasUpdate: false });
  } catch (error) {
    console.error('[Update Check] Error:', error);
    return res.status(500).json({ error: 'Update check failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`OTP/update server listening on 0.0.0.0:${port} (${env})`);
  console.log(`Update check endpoint: POST /app/update/check`);
  if (!hasSupabaseConfig) {
    console.warn('Signup is disabled until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
  }
  if (!process.env.MSG91_AUTHKEY) {
    console.warn('OTP delivery is in demo mode until MSG91_AUTHKEY is configured.');
  }
});
