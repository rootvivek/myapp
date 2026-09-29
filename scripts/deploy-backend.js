#!/usr/bin/env node
/**
 * Deploy the OTP + auto-update backend to Render via the Render REST API.
 *
 * Prerequisites — put these in `backend/.env` (git-ignored) or the environment:
 *   RENDER_API_KEY              required  Render Dashboard → Account Settings → API Keys
 *   SUPABASE_URL                required
 *   SUPABASE_SERVICE_ROLE_KEY   required  (server-side only)
 *   MSG91_AUTHKEY               required
 *   RENDER_OWNER_ID             optional  auto-detected from /owners
 *
 * Optional overrides: MSG91_SENDER, ALLOWED_ORIGINS, APP_* (see render.yaml).
 *
 * Usage:
 *   node scripts/deploy-backend.js
 *
 * Creates the service on first run; on later runs it updates the env vars and
 * triggers a deploy. Prints the public HTTPS URL when the deploy is live.
 */

const fs = require('fs');
const path = require('path');

const API = 'https://api.render.com/v1';
const SERVICE_NAME = 'myapp-otp-server';
const ROOT = path.resolve(__dirname, '..');

// ── Minimal .env loader (process.env wins) ──────────────────────────
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(path.join(ROOT, '.env')),
  ...loadEnvFile(path.join(ROOT, 'backend', '.env')),
};
const env = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;
const required = (key) => {
  const value = env(key);
  if (!value) {
    console.error(`✗ Missing required value: ${key}`);
    process.exit(1);
  }
  return value;
};

const API_KEY = required('RENDER_API_KEY');

async function api(endpoint, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.message || text || res.statusText;
    throw new Error(`${method} ${endpoint} → ${res.status}: ${message}`);
  }
  return data;
}

async function resolveOwnerId() {
  if (env('RENDER_OWNER_ID')) return env('RENDER_OWNER_ID');
  const owners = await api('/owners?limit=20');
  if (!owners?.length) throw new Error('No Render workspaces found for this API key.');
  return owners[0].owner.id;
}

function buildEnvVars() {
  return [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'SUPABASE_URL', value: required('SUPABASE_URL') },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: required('SUPABASE_SERVICE_ROLE_KEY') },
    { key: 'MSG91_AUTHKEY', value: required('MSG91_AUTHKEY') },
    { key: 'MSG91_SENDER', value: env('MSG91_SENDER', 'MCAFONE') },
    { key: 'ALLOWED_ORIGINS', value: env('ALLOWED_ORIGINS', 'http://localhost:8081') },
    { key: 'APP_LATEST_VERSION_NAME', value: env('APP_LATEST_VERSION_NAME', '1.0.6') },
    { key: 'APP_LATEST_VERSION_CODE', value: env('APP_LATEST_VERSION_CODE', '7') },
    {
      key: 'APP_DOWNLOAD_URL_ANDROID',
      value: env(
        'APP_DOWNLOAD_URL_ANDROID',
        'https://github.com/rootvivek/myapp/releases/download/v1.0.6/app-release.apk',
      ),
    },
    { key: 'APP_DOWNLOAD_URL_IOS', value: env('APP_DOWNLOAD_URL_IOS', 'https://apps.apple.com/app/idYOUR_APP_ID') },
    {
      key: 'APP_RELEASE_NOTES',
      value: env('APP_RELEASE_NOTES', 'Auto-update feature added\\nFixed customer screen UI\\nPerformance improvements'),
    },
    { key: 'APP_MANDATORY_UPDATE', value: env('APP_MANDATORY_UPDATE', 'false') },
    { key: 'APP_MIN_VERSION_CODE', value: env('APP_MIN_VERSION_CODE', '4') },
  ];
}

async function findService() {
  const services = await api('/services?limit=100');
  return (services || []).map((s) => s.service ?? s).find((s) => s.name === SERVICE_NAME) || null;
}

async function waitForDeploy(serviceId, deployId) {
  const deadline = Date.now() + 10 * 60 * 1000;
  process.stdout.write('  waiting for deploy to go live');
  while (Date.now() < deadline) {
    const deploy = await api(`/services/${serviceId}/deploys/${deployId}`);
    const status = deploy?.status;
    if (status === 'live') return true;
    if (['build_failed', 'update_failed', 'canceled', 'pre_deploy_failed'].includes(status)) {
      throw new Error(`Deploy ${deployId} ended with status: ${status}`);
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Timed out waiting for deploy to become live');
}

async function main() {
  const envVars = buildEnvVars();
  let service = await findService();

  if (service) {
    console.log(`• Service "${SERVICE_NAME}" exists (${service.id}) — updating env vars`);
    await api(`/services/${service.id}/env-vars`, { method: 'PUT', body: envVars });
    const deploy = await api(`/services/${service.id}/deploys`, {
      method: 'POST',
      body: { clearCache: 'do_not_clear' },
    });
    const deployId = deploy?.id || deploy?.deploy?.id;
    if (deployId) await waitForDeploy(service.id, deployId);
  } else {
    const ownerId = await resolveOwnerId();
    console.log(`• Creating service "${SERVICE_NAME}"…`);
    const created = await api('/services', {
      method: 'POST',
      body: {
        type: 'web_service',
        name: SERVICE_NAME,
        ownerId,
        repo: 'https://github.com/rootvivek/myapp',
        branch: 'main',
        autoDeploy: 'yes',
        rootDir: 'backend',
        envVars,
        serviceDetails: {
          runtime: 'node',
          plan: env('RENDER_PLAN', 'free'),
          region: env('RENDER_REGION', 'singapore'),
          healthCheckPath: '/health',
          envSpecificDetails: { buildCommand: 'npm ci', startCommand: 'npm start' },
        },
      },
    });
    service = created.service;
    if (created.deployId) await waitForDeploy(service.id, created.deployId);
  }

  const url = service?.serviceDetails?.url;
  console.log('\n✓ Backend deployed.');
  if (url) {
    console.log(`  URL: ${url}`);
    console.log(`  Set in .env →  UPDATE_API_URL=${url}`);
  } else {
    console.log('  (URL not returned yet — check the Render dashboard.)');
  }
  console.log('\n  Verify:  curl ' + (url || 'https://<service>') + '/health');
}

main().catch((error) => {
  console.error('\n✗ Deploy failed:', error.message);
  process.exit(1);
});
