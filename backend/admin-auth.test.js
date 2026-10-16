const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMasterKey, isValidMasterKey, DEFAULT_MASTER_KEY } = require('./admin-auth');

test('resolveMasterKey falls back to the default when no env value is set', () => {
  assert.equal(resolveMasterKey(undefined), DEFAULT_MASTER_KEY);
  assert.equal(resolveMasterKey(''), DEFAULT_MASTER_KEY);
});

test('resolveMasterKey prefers the environment value', () => {
  assert.equal(resolveMasterKey('other-secret'), 'other-secret');
});

test('isValidMasterKey accepts the exact key', () => {
  assert.equal(isValidMasterKey(DEFAULT_MASTER_KEY, DEFAULT_MASTER_KEY), true);
});

test('isValidMasterKey rejects wrong, empty, and non-string keys', () => {
  assert.equal(isValidMasterKey('wrong', DEFAULT_MASTER_KEY), false);
  assert.equal(isValidMasterKey('', DEFAULT_MASTER_KEY), false);
  assert.equal(isValidMasterKey(null, DEFAULT_MASTER_KEY), false);
  assert.equal(isValidMasterKey(undefined, DEFAULT_MASTER_KEY), false);
  assert.equal(isValidMasterKey(DEFAULT_MASTER_KEY, ''), false);
  assert.equal(isValidMasterKey(DEFAULT_MASTER_KEY, undefined), false);
});
