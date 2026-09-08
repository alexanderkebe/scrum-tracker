import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createClient } from '@supabase/supabase-js';

async function loadModule(path, dependencies, globals = {}) {
  const context = vm.createContext({ URL, Response, AbortSignal, console, process, ...globals });
  const sourceModule = new vm.SourceTextModule(await readFile(new URL(path, import.meta.url), 'utf8'), { context });
  await sourceModule.link((name) => {
    const exports = dependencies[name];
    if (!exports) throw new Error(`Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}

function request(body, origin = 'https://scrum.example') {
  return new Request('https://scrum.example/api/auth/google', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
}

test('origin check uses browser Host when Next normalizes the local URL', async () => {
  const auth = await loadModule('../src/lib/google-auth-server.js', {
    '@supabase/supabase-js': { createClient },
    'next/headers': { cookies: async () => ({}) }
  });
  const check = (origin, host = '127.0.0.1:3000') => auth.isSameOrigin(new Request('http://localhost:3000/api/auth/google', {
    headers: { origin, host }
  }));
  assert.equal(check('http://127.0.0.1:3000'), true);
  assert.equal(check('http://attacker.example'), false);
  assert.equal(check('http://127.0.0.1:4000'), false);
  assert.equal(check('https://127.0.0.1:3000'), false);
  assert.equal(check('null'), false);
});

async function callback({ existing = null, verified = true, exchangeError = null } = {}) {
  const writes = [];
  const sessions = [];
  const googleUser = { id: 'google-id', email: 'Member@Example.com', email_confirmed_at: verified ? '2026-09-07' : null,
    app_metadata: { providers: ['google'] }, user_metadata: { full_name: 'Google Member' } };
  const db = { from() {
    let payload;
    const query = {
      select() { return query; }, eq() { return query; },
      update(value) { payload = value; writes.push(value); return query; },
      insert(value) { payload = value; writes.push(value); return query; },
      maybeSingle: async () => ({ data: existing }),
      single: async () => ({ data: { id: 'app-id', role: 'member', ...existing, ...payload } }),
      then(resolve) { resolve({ count: 2 }); }
    };
    return query;
  } };
  const routeModule = await loadModule('../src/app/api/auth/google/route.js', {
    'next/server': { NextResponse: Response },
    uuid: { v4: () => 'random-password' },
    '@/lib/supabase': { getSupabase: () => db, throwIfDbError: (error) => { if (error) throw error; } },
    '@/lib/auth': { createSession: async (id) => sessions.push(id), hashPassword: () => 'hashed-random-password' },
    '@/lib/google-auth-server': {
      isSameOrigin: (req) => req.headers.get('origin') === new URL(req.url).origin,
      createGoogleAuthClient: async () => ({ auth: {
        exchangeCodeForSession: async () => ({ data: { session: { access_token: 'server-token' } }, error: exchangeError }),
        getUser: async () => ({ data: { user: googleUser } })
      } })
    }
  });
  return { post: routeModule.POST, writes, sessions };
}

test('new Google signup creates a member and app session', async () => {
  const { post, writes, sessions } = await callback();
  assert.equal((await post(request({ code: 'valid-code' }))).status, 200);
  assert.equal(writes[0].email, 'member@example.com');
  assert.equal(writes[0].role, 'member');
  assert.equal(writes[0].auth_user_id, 'google-id');
  assert.deepEqual(sessions, ['app-id']);
});

test('returning Google user retains their account and role', async () => {
  const { post, sessions } = await callback({ existing: { id: 'existing-id', auth_user_id: 'google-id', role: 'admin' } });
  const response = await post(request({ code: 'valid-code' }));
  assert.equal((await response.json()).user.role, 'admin');
  assert.deepEqual(sessions, ['existing-id']);
});

test('verified Google email links an existing email account', async () => {
  const { post, writes, sessions } = await callback({ existing: { id: 'email-id', auth_user_id: null, role: 'scrum_master' } });
  const response = await post(request({ code: 'valid-code' }));
  assert.equal((await response.json()).user.role, 'scrum_master');
  assert.equal(writes[0].auth_user_id, 'google-id');
  assert.deepEqual(sessions, ['email-id']);
});

for (const [label, options, body, origin, expected] of [
  ['rejects cross-origin requests', {}, { code: 'valid' }, 'https://other.example', 403],
  ['rejects direct bearer token login', {}, { accessToken: 'token' }, undefined, 400],
  ['rejects expired or mismatched PKCE codes', { exchangeError: new Error('bad verifier') }, { code: 'expired' }, undefined, 401],
  ['rejects unverified email', { verified: false }, { code: 'valid' }, undefined, 401],
  ['does not overwrite another linked identity', { existing: { id: 'existing', auth_user_id: 'other-google-id' } }, { code: 'valid' }, undefined, 409]
]) {
  test(label, async () => {
    const { post, writes, sessions } = await callback(options);
    assert.equal((await post(request(body, origin))).status, expected);
    assert.equal(writes.length, 0);
    assert.equal(sessions.length, 0);
  });
}

test('installed Supabase SDK exchanges PKCE across requests using an HTTP-only cookie', async () => {
  const jar = new Map();
  let exchangedBody;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  try {
    const authModule = await loadModule('../src/lib/google-auth-server.js', {
      '@supabase/supabase-js': { createClient: (url, key, options) => createClient(url, key, {
        ...options, global: { fetch: async (url, init) => {
          assert.equal(new URL(url).pathname, '/auth/v1/token');
          exchangedBody = JSON.parse(init.body);
          return Response.json({ access_token: 'test-access-token', refresh_token: 'test-refresh-token',
            token_type: 'bearer', expires_in: 3600, user: { id: 'test-user' } });
        } }
      }) },
      'next/headers': { cookies: async () => ({
        get: (key) => jar.get(key),
        set: (key, value, options) => jar.set(key, { value, options }),
        delete: (key) => jar.delete(key)
      }) }
    });
    const first = await authModule.createGoogleAuthClient();
    const { data, error } = await first.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: 'https://scrum.example/auth/callback', skipBrowserRedirect: true
    } });
    assert.equal(error, null);
    const url = new URL(data.url);
    assert.equal(url.searchParams.get('code_challenge_method'), 's256');
    const cookie = jar.get('scrum-google-code-verifier');
    assert.ok(cookie.value.length > 40);
    assert.equal(cookie.options.httpOnly, true);
    assert.equal(cookie.options.sameSite, 'lax');
    assert.equal(cookie.options.maxAge, 600);
    const second = await authModule.createGoogleAuthClient();
    assert.equal(await second.auth.storage.getItem('scrum-google-code-verifier'), cookie.value);
    await second.auth.storage.setItem('scrum-google', 'sensitive-session-token');
    assert.equal(jar.has('scrum-google'), false);
    const exchange = await second.auth.exchangeCodeForSession('test-code');
    assert.equal(exchange.error, null);
    assert.equal(exchangedBody.auth_code, 'test-code');
    assert.equal(exchangedBody.code_verifier, JSON.parse(cookie.value));
    assert.equal(jar.size, 0);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

for (const [label, enabled, schemaError, expected] of [
  ['disabled Google provider stays on the sign-in page', false, null, 503],
  ['missing database migration prevents redirect', true, { code: '42703' }, 503],
  ['configured Google provider returns the OAuth URL', true, null, 200]
]) {
  test(label, async () => {
    let oauthStarted = false;
    const startModule = await loadModule('../src/app/api/auth/google/start/route.js', {
      'next/server': { NextResponse: Response },
      '@/lib/google-auth-server': {
        isSameOrigin: () => true,
        createGoogleAuthClient: async () => ({ auth: { signInWithOAuth: async (options) => {
          oauthStarted = true;
          assert.equal(options.provider, 'google');
          assert.equal(options.options.redirectTo, 'https://scrum.example/auth/callback');
          return { data: { url: 'https://test.supabase.co/auth/v1/authorize' } };
        } } })
      },
      '@/lib/supabase': { getSupabase: () => ({ from: () => ({ select: () => ({ limit: async () => ({ error: schemaError }) }) }) }) }
    }, { fetch: async () => Response.json({ external: { google: enabled } }), console: { error() {} } });
    const response = await startModule.POST(request({}));
    assert.equal(response.status, expected);
    assert.equal(oauthStarted, expected === 200);
  });
}
