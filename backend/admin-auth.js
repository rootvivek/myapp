const crypto = require('crypto');

// Private credential for the Master Admin Panel endpoints. The same value is
// checked client-side in AuthScreen; override it in production by setting
// MASTER_ADMIN_KEY in backend/.env.
const DEFAULT_MASTER_KEY = 'MasterAdminSecureKey@2026';

function resolveMasterKey(envValue) {
  return envValue || DEFAULT_MASTER_KEY;
}

// Constant-time comparison of the provided key against the expected key.
function isValidMasterKey(provided, masterKey) {
  if (typeof provided !== 'string' || !provided) return false;
  if (typeof masterKey !== 'string' || !masterKey) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(masterKey).digest();
  return crypto.timingSafeEqual(a, b);
}

function readMasterKey(req) {
  return String(req.headers['x-master-key'] || '');
}

module.exports = { resolveMasterKey, isValidMasterKey, readMasterKey, DEFAULT_MASTER_KEY };
