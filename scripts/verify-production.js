#!/usr/bin/env node
/**
 * Verify all production keys/config, both presence and (where possible) live API
 * validity. Never prints secret values — only lengths and statuses.
 *
 * Usage:
 *   node scripts/verify-production.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

const client = loadEnvFile(path.join(ROOT, '.env'));
const backend = loadEnvFile(path.join(ROOT, 'backend', '.env'));
const get = (key) => process.env[key] ?? client[key] ?? backend[key] ?? '';

const results = [];
const add = (name, status, detail) => {
  results.push({ name, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '!' : '✗';
  console.log(`  ${icon} ${status.padEnd(4)} ${name} — ${detail}`);
};

const PLACEHOLDER = /your-|example\.com|changeme|placeholder|xxxx/i;

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkSupabase() {
  const url = get('EXPO_PUBLIC_SUPABASE_URL') || get('SUPABASE_URL');
  const anon = get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  const service = get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url) {
    add('Supabase URL', 'FAIL', 'missing');
  } else if (PLACEHOLDER.test(url)) {
    add('Supabase URL', 'FAIL', `still a placeholder (${url})`);
  } else {
    try {
      const authKey = service || anon;
      const res = await fetchWithTimeout(
        `${url}/auth/v1/health`,
        authKey ? { headers: { apikey: authKey } } : {},
      );
      add('Supabase URL reachable', res.status < 500 ? 'PASS' : 'FAIL', `${url} → HTTP ${res.status}`);
    } catch (e) {
      add('Supabase URL reachable', 'FAIL', `${url} → ${e.message}`);
    }
  }

  const isJwt = (v) => typeof v === 'string' && v.startsWith('eyJ') && v.split('.').length === 3;
  add('Supabase anon key', isJwt(anon) ? 'PASS' : 'FAIL', `len=${anon.length}${isJwt(anon) ? '' : ' (expected a JWT, got placeholder?)'}`);
  add('Supabase service role key', isJwt(service) ? 'PASS' : 'FAIL', `len=${service.length}${isJwt(service) ? '' : ' (expected a JWT, empty/placeholder?)'}`);

  const live = url && !PLACEHOLDER.test(url);
  if (live && isJwt(anon)) {
    try {
      const res = await fetchWithTimeout(`${url}/rest/v1/`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
      add('Supabase anon key works', res.ok ? 'PASS' : 'FAIL', `GET /rest/v1/ → HTTP ${res.status}`);
    } catch (e) {
      add('Supabase anon key works', 'FAIL', e.message);
    }
  }
  if (live && isJwt(service)) {
    try {
      const res = await fetchWithTimeout(`${url}/rest/v1/`, { headers: { apikey: service, Authorization: `Bearer ${service}` } });
      add('Supabase service key works', res.ok ? 'PASS' : 'FAIL', `GET /rest/v1/ → HTTP ${res.status}`);
    } catch (e) {
      add('Supabase service key works', 'FAIL', e.message);
    }
  }
}

function checkClientMisc() {
  const apiUrl = get('UPDATE_API_URL');
  if (!apiUrl) add('UPDATE_API_URL', 'FAIL', 'missing');
  else if (/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)/.test(apiUrl))
    add('UPDATE_API_URL', 'WARN', `${apiUrl} (dev value — must be HTTPS for production)`);
  else if (apiUrl.startsWith('https://')) add('UPDATE_API_URL', 'PASS', apiUrl);
  else add('UPDATE_API_URL', 'WARN', `${apiUrl} (not HTTPS)`);
}

async function checkRender() {
  const key = get('RENDER_API_KEY');
  if (!key) return add('Render API key', 'FAIL', 'missing (add RENDER_API_KEY to backend/.env)');
  try {
    const res = await fetchWithTimeout('https://api.render.com/v1/owners?limit=5', {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    });
    if (!res.ok) return add('Render API key', 'FAIL', `GET /owners → HTTP ${res.status}`);
    const owners = await res.json();
    add('Render API key', 'PASS', `valid — ${owners.length} workspace(s): ${owners.map((o) => o.owner?.name).join(', ')}`);
  } catch (e) {
    add('Render API key', 'FAIL', e.message);
  }
}

function checkMsg91() {
  const key = get('MSG91_AUTHKEY');
  if (!key) return add('MSG91 auth key', 'FAIL', 'missing (OTP stays in demo mode)');
  add('MSG91 auth key', 'PASS', `present (len=${key.length}) — cannot validate without sending an SMS`);
  add('MSG91 sender', get('MSG91_SENDER') ? 'PASS' : 'WARN', get('MSG91_SENDER') || 'using default MCAFONE');
}

function checkCors() {
  const origins = get('ALLOWED_ORIGINS') || '';
  if (origins.split(',').map((o) => o.trim()).includes('*')) add('CORS ALLOWED_ORIGINS', 'WARN', 'contains "*" — tighten for production');
  else add('CORS ALLOWED_ORIGINS', 'PASS', origins || 'unset (native apps send no Origin)');
}

function checkKeystore() {
  const propsPath = path.join(ROOT, 'android', 'keystore.properties');
  const ksPath = path.join(ROOT, 'android', 'release.keystore');
  if (!fs.existsSync(propsPath) || !fs.existsSync(ksPath)) {
    return add('Release keystore', 'FAIL', 'android/keystore.properties or release.keystore missing');
  }
  const props = loadEnvFile(propsPath);
  try {
    const out = execFileSync(
      'keytool',
      ['-list', '-keystore', ksPath, '-storepass', props.storePassword, '-alias', props.keyAlias],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const fp = out.match(/SHA-?256\)?:\s*([0-9A-F:]+)/i)?.[1] || 'unknown';
    add('Release keystore', 'PASS', `alias="${props.keyAlias}" sha256=${fp.slice(0, 23)}…`);
  } catch {
    add('Release keystore', 'FAIL', 'wrong password or corrupt keystore');
  }
}

async function main() {
  console.log('\nVerifying production configuration…\n');
  checkClientMisc();
  await checkSupabase();
  checkMsg91();
  checkCors();
  await checkRender();
  checkKeystore();

  const fails = results.filter((r) => r.status === 'FAIL');
  const warns = results.filter((r) => r.status === 'WARN');
  console.log(`\nSummary: ${results.filter((r) => r.status === 'PASS').length} pass, ${warns.length} warn, ${fails.length} fail`);
  if (fails.length) console.log('Blocking issues:\n' + fails.map((f) => `  ✗ ${f.name}: ${f.detail}`).join('\n'));
  process.exit(fails.length ? 1 : 0);
}

main();
