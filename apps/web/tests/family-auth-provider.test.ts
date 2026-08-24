import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  isFamilySupabaseAuthConfigurationReady,
  readFamilyAuthProviderMode,
} from '../lib/family/auth-provider-config';
import {safeFamilyAuthReturnPath} from '../lib/family/auth-flow';

const webRoot = path.resolve(import.meta.dirname, '..');

const supabaseEnvironment = {
  FAMILY_AUTH_PROVIDER: 'supabase',
  FAMILY_SUPABASE_AUTH_AUDIENCE: 'authenticated',
  FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED: 'true',
  FAMILY_SUPABASE_AUTH_ISSUER: 'https://example.supabase.co/auth/v1',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NODE_ENV: 'production',
} as const;

const clerkEnvironment = {
  CLERK_LOCAL_AUTH_ENABLED: 'true',
  CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
  CLERK_SECRET_KEY: 'sk_test_fake',
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_fake',
  NODE_ENV: 'development',
} as const;

test('Family authentication selects exactly one provider and fails closed', () => {
  assert.equal(readFamilyAuthProviderMode(supabaseEnvironment), 'supabase');
  assert.equal(isFamilySupabaseAuthConfigurationReady(supabaseEnvironment), true);
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED: 'false',
  }), 'disabled');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    FAMILY_SUPABASE_AUTH_ISSUER: 'https://attacker.invalid/auth/v1',
  }), 'disabled');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    FAMILY_SUPABASE_AUTH_AUDIENCE: 'service_role',
  }), 'disabled');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    NEXT_PUBLIC_SUPABASE_URL: 'http://example.supabase.co',
  }), 'disabled');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    FAMILY_SUPABASE_AUTH_ISSUER: 'http://127.0.0.1:9999/auth/v1',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9999',
    NODE_ENV: 'development',
  }), 'supabase');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    FAMILY_AUTH_PROVIDER: 'supabase',
  }), 'supabase');
  assert.equal(readFamilyAuthProviderMode({
    ...supabaseEnvironment,
    FAMILY_AUTH_PROVIDER: 'unknown',
  }), 'disabled');
  assert.equal(readFamilyAuthProviderMode(clerkEnvironment), 'disabled');
  assert.equal(readFamilyAuthProviderMode({
    ...clerkEnvironment,
    FAMILY_AUTH_PROVIDER: 'clerk-development',
  }), 'clerk-development');
});

test('Family auth redirect allowlist admits protected companion routes and rejects external routes', () => {
  assert.equal(safeFamilyAuthReturnPath('/family?view=messages'), '/family?view=messages');
  assert.equal(
    safeFamilyAuthReturnPath('/es/family/invitations/accept'),
    '/es/family/invitations/accept',
  );
  assert.equal(
    safeFamilyAuthReturnPath('/admin/family-access'),
    '/admin/family-access',
  );
  assert.equal(
    safeFamilyAuthReturnPath('/teacher/messages'),
    '/teacher/messages',
  );
  assert.equal(
    safeFamilyAuthReturnPath('/es/admin/family-access'),
    '/es/admin/family-access',
  );
  assert.equal(
    safeFamilyAuthReturnPath('/es/teacher/messages'),
    '/es/teacher/messages',
  );
  for (const route of [
    '/admin/family-operations',
    '/family/requests?kind=correction',
    '/teacher/family-access',
    '/es/admin/family-operations',
    '/es/family/requests?kind=access',
    '/es/teacher/family-access',
  ]) assert.equal(safeFamilyAuthReturnPath(route), route);
  for (const candidate of [
    'https://attacker.invalid/family',
    '//attacker.invalid/family',
    '/courses/4/3',
    '/family#token=secret',
  ]) assert.equal(safeFamilyAuthReturnPath(candidate), '/family', candidate);
});

test('Supabase Auth SSR source verifies claims and keeps admin credentials out', async () => {
  const [provider, sessionClient, actions, callback] = await Promise.all([
    readFile(path.join(webRoot, 'lib/family/provider-session.server.ts'), 'utf8'),
    readFile(path.join(webRoot, 'lib/family/supabase-auth.server.ts'), 'utf8'),
    readFile(path.join(webRoot, 'lib/family/supabase-auth-actions.ts'), 'utf8'),
    readFile(path.join(webRoot, 'app/auth/callback/route.ts'), 'utf8'),
  ]);
  assert.match(provider, /getClaims\(\)/u);
  assert.match(provider, /z\.literal\('authenticated'\)/u);
  assert.match(provider, /email_confirmed_at/u);
  assert.match(sessionClient, /createServerClient/u);
  assert.match(sessionClient, /flowType: 'pkce'/u);
  assert.doesNotMatch(
    `${provider}\n${sessionClient}\n${actions}\n${callback}`,
    /SUPABASE_SERVICE_ROLE_KEY/u,
  );
  assert.match(actions, /scope: 'local'/u);
  assert.match(actions, /scope: 'global'/u);
  assert.match(actions, /scope: 'others'/u);
  assert.match(actions, /resetPasswordForEmail/u);
  assert.match(actions, /updateUser\(\{password:/u);
  assert.match(actions, /return \{code: 'REQUEST_ACCEPTED', status: 'success'\}/u);
  assert.match(callback, /exchangeCodeForSession/u);
  assert.match(callback, /Cache-Control': 'private, no-store/u);
});
