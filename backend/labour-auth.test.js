const test = require('node:test');
const assert = require('node:assert/strict');
const { createLabourUser } = require('./labour-auth');

function createAdmin({
  owner = { role: 'owner', shop_id: 'shop-1' },
  shop = { id: 'shop-1' },
  profile = { id: 'labour-1' },
} = {}) {
  const calls = { createUser: [], deleteUser: [] };
  const admin = {
    from(table) {
      const query = {
        select() { return query; },
        update(values) { query.updateValues = values; return query; },
        eq(column, value) {
          query.filters ||= {};
          query.filters[column] = value;
          return query;
        },
        async maybeSingle() {
          if (table === 'profiles' && query.updateValues) return { data: profile, error: null };
          if (table === 'profiles') return { data: owner, error: null };
          return { data: query.filters?.id === shop?.id && query.filters?.owner_id === 'owner-1' ? shop : null, error: null };
        },
      };
      return query;
    },
    auth: {
      admin: {
        async createUser(attributes) {
          calls.createUser.push(attributes);
          return { data: { user: { id: 'labour-1' } }, error: null };
        },
        async deleteUser(id) {
          calls.deleteUser.push(id);
          return { error: null };
        },
      },
    },
  };
  return { admin, calls };
}

test('rejects invalid usernames without creating an auth account', async () => {
  const { admin, calls } = createAdmin();
  await assert.rejects(
    createLabourUser({ supabaseAdmin: admin, ownerId: 'owner-1', username: 'bad name', password: 'secret1' }),
    /Login ID must be/
  );
  assert.equal(calls.createUser.length, 0);
});

test('requires an owner profile and shop ownership before creating labour', async () => {
  const { admin, calls } = createAdmin({ owner: { role: 'labour', shop_id: 'shop-1' } });
  await assert.rejects(
    createLabourUser({ supabaseAdmin: admin, ownerId: 'staff-1', username: 'ravi_1', password: 'secret1' }),
    { statusCode: 403 }
  );
  assert.equal(calls.createUser.length, 0);
});

test('rejects owners whose profile shop is not owned by their Auth user', async () => {
  const { admin, calls } = createAdmin({ shop: null });
  await assert.rejects(
    createLabourUser({ supabaseAdmin: admin, ownerId: 'owner-1', username: 'ravi_1', password: 'secret1' }),
    { statusCode: 403 }
  );
  assert.equal(calls.createUser.length, 0);
});

test('creates staff through Auth Admin with trusted role and owner shop metadata', async () => {
  const { admin, calls } = createAdmin();
  const result = await createLabourUser({
    supabaseAdmin: admin,
    ownerId: 'owner-1',
    username: ' Ravi_1 ',
    password: 'secret1',
    phone: '1234567890',
  });

  assert.deepEqual(result, { userId: 'labour-1' });
  assert.equal(calls.createUser.length, 1);
  assert.equal(calls.createUser[0].email, 'ravi_1@mcaphonewala.internal');
  assert.deepEqual(calls.createUser[0].app_metadata, { role: 'labour', shop_id: 'shop-1' });
  assert.deepEqual(calls.createUser[0].user_metadata, {
    name: 'ravi_1', username: 'ravi_1', phone: '1234567890',
  });
  assert.deepEqual(calls.deleteUser, []);
});

test('deletes the new auth account if database profile setup does not complete', async () => {
  const { admin, calls } = createAdmin({ profile: null });
  await assert.rejects(
    createLabourUser({ supabaseAdmin: admin, ownerId: 'owner-1', username: 'ravi_1', password: 'secret1' }),
    /Labour profile setup failed/
  );
  assert.deepEqual(calls.deleteUser, ['labour-1']);
});