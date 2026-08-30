import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_STATUSES,
  runClerkSyntheticProviderPreflight,
} from '../lib/clerk-synthetic-provider-preflight';
import {
  CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_AUTHORIZATION,
} from '../lib/clerk-synthetic-execution';

const webRoot = path.resolve(import.meta.dirname, '..');
const validEnvironment: NodeJS.ProcessEnv = {
  CLERK_LOCAL_AUTH_ENABLED: 'true',
  CLERK_SECRET_KEY: 'sk_test_clerk_secret_contract',
  CLERK_SYNTHETIC_PROVIDER_PREFLIGHT:
    CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_AUTHORIZATION,
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    'pk_test_aGVyb2ljLWVsZi02Ny5jbGVyay5hY2NvdW50cy5kZXYk',
  NODE_ENV: 'development',
};
const matchingDomain = Object.freeze({
  developmentOrigin: '',
  frontendApiUrl: 'heroic-elf-67.clerk.accounts.dev',
  id: 'domain_test_contract',
  isSatellite: false,
});

test('read-only provider preflight is default-off and never calls its dependency', async () => {
  const unauthorizedEnvironments: NodeJS.ProcessEnv[] = [
    {NODE_ENV: 'development'},
    {...validEnvironment, CLERK_SYNTHETIC_PROVIDER_PREFLIGHT: undefined},
    {...validEnvironment, HTTP_PROXY: 'http://proxy.invalid'},
    {...validEnvironment, NODE_ENV: 'production'},
  ];
  for (const environment of unauthorizedEnvironments) {
    let called = false;
    const status = await runClerkSyntheticProviderPreflight({
      environment,
      listDomains: async () => {
        called = true;
        throw new Error('must not run');
      },
    });
    assert.equal(status, 'NOT_AUTHORIZED');
    assert.equal(called, false);
  }
});

test('read-only provider preflight returns only fixed safe statuses', async () => {
  assert.deepEqual(CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_STATUSES, [
    'READY',
    'NOT_AUTHORIZED',
    'ORIGIN_OR_KEY_MISMATCH',
    'PROVIDER_UNAVAILABLE',
  ]);
  assert.equal(await runClerkSyntheticProviderPreflight({
    environment: validEnvironment,
    listDomains: async () => ({data: [matchingDomain], totalCount: 1}),
  }), 'READY');
  assert.equal(await runClerkSyntheticProviderPreflight({
    environment: validEnvironment,
    listDomains: async () => ({
      data: [{...matchingDomain, developmentOrigin: 'http://127.0.0.1:3212'}],
      totalCount: 1,
    }),
  }), 'ORIGIN_OR_KEY_MISMATCH');
  assert.equal(await runClerkSyntheticProviderPreflight({
    environment: validEnvironment,
    listDomains: async () => {
      throw new Error('provider-body-sentinel');
    },
  }), 'PROVIDER_UNAVAILABLE');
});

test('provider preflight script has no mutation or dynamic diagnostic surface', async () => {
  const source = await readFile(
    path.join(webRoot, 'scripts/check-clerk-synthetic-provider-preflight.ts'),
    'utf8',
  );
  assert.match(source, /client\.domains\.list\(\)/u);
  assert.match(source, /providerTimeoutMilliseconds = 15_000/u);
  assert.match(source, /Promise\.race\(/u);
  assert.match(source, /process\.exit\(status === 'READY' \? 0 : 1\)/u);
  assert.match(source, /telemetry: \{disabled: true\}/u);
  assert.match(source, /CLERK_SYNTHETIC_PROVIDER_PREFLIGHT=\$\{status\}/u);
  assert.doesNotMatch(
    source,
    /users\.|sessions\.|clerkSetup|testing_tokens|signUp|password|emailCode/u,
  );
  assert.doesNotMatch(source, /console\.(?:debug|error|info|log|warn)\(/u);
});
