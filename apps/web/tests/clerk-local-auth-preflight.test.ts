import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  CLERK_LOCAL_AUTH_PREFLIGHT_STATUSES,
  inspectClerkLocalAuthPreflight,
  isValidClerkLocalAuthOrigin,
  type ClerkLocalAuthPreflightEnvironment,
} from '../lib/clerk-local-auth-preflight';
import {isClerkLocalAuthConfigurationReady} from '../lib/clerk-local-auth-config';

const webRoot = path.resolve(import.meta.dirname, '..');
const validBase = Object.freeze({
  CLERK_LOCAL_AUTH_ENABLED: 'true',
  CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
  NODE_ENV: 'development',
} as const);

test('preflight exposes every governed state and only ready states are ready', () => {
  assert.deepEqual(CLERK_LOCAL_AUTH_PREFLIGHT_STATUSES, [
    'feature-off',
    'provider-not-authorized',
    'explicit-keys-ready',
    'production-disabled',
    'invalid-origin',
  ]);

  const cases: ReadonlyArray<readonly [
    ClerkLocalAuthPreflightEnvironment,
    string,
    boolean,
  ]> = [
    [{NODE_ENV: 'development'}, 'feature-off', false],
    [{...validBase}, 'provider-not-authorized', false],
    [{
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    }, 'explicit-keys-ready', true],
    [{
      ...validBase,
      NODE_ENV: 'production',
    }, 'production-disabled', false],
    [{
      ...validBase,
      CLERK_LOCAL_AUTH_ORIGIN: 'https://www.helpmath.ai',
    }, 'invalid-origin', false],
  ];

  for (const [environment, status, ready] of cases) {
    assert.deepEqual(inspectClerkLocalAuthPreflight(environment), {status, ready});
  }
});

test('preflight uses the same exact provider authorization gates as local auth', () => {
  for (const environment of [
    {...validBase, CLERK_LOCAL_AUTH_ENABLED: 'TRUE'},
    {...validBase, CLERK_LOCAL_AUTH_ENABLED: '1'},
  ]) {
    assert.equal(inspectClerkLocalAuthPreflight(environment).status, 'feature-off');
  }

  const rejectedEnvironments = [
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: undefined,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    },
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    },
    {...validBase, CLERK_SECRET_KEY: 'secret-only'},
    {...validBase, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'publishable-only'},
    {
      ...validBase,
      CLERK_SECRET_KEY: '   ',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    },
  ];
  const legacyKeylessOnly = {
    ...validBase,
    CLERK_KEYLESS_BOOTSTRAP_ENABLED: 'true',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false',
  } as const;
  for (const environment of [...rejectedEnvironments, legacyKeylessOnly]) {
    assert.equal(
      inspectClerkLocalAuthPreflight(environment).status,
      'provider-not-authorized',
    );
  }

  assert.equal(inspectClerkLocalAuthPreflight({
    ...validBase,
    CLERK_SECRET_KEY: 'sk_test_secret-value',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
  }).status, 'explicit-keys-ready');

  for (const environment of [
    {
      ...validBase,
      CLERK_SECRET_KEY: 'unpaired-secret',
    },
    {
      ...validBase,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'unpaired-publishable',
    },
  ]) {
    assert.equal(
      inspectClerkLocalAuthPreflight(environment).status,
      'provider-not-authorized',
    );
  }

  for (const [publishableKey, secretKey] of [
    ['pk_live_publishable', 'sk_live_secret'],
    ['pk_test_publishable', 'sk_live_secret'],
    ['pk_live_publishable', 'sk_test_secret'],
    ['not-a-key', 'also-not-a-key'],
  ]) assert.equal(inspectClerkLocalAuthPreflight({
    ...validBase,
    CLERK_SECRET_KEY: secretKey,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
  }).status, 'provider-not-authorized', `${publishableKey}/${secretKey}`);

});

test('preflight readiness is exactly equivalent to the shared runtime gate', () => {
  const environments: ClerkLocalAuthPreflightEnvironment[] = [
    {NODE_ENV: 'development'},
    {...validBase},
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    },
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
    },
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_live_secret-value',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_publishable-value',
    },
    {
      ...validBase,
      CLERK_SECRET_KEY: 'sk_test_secret-value',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_publishable-value',
      NODE_ENV: 'production',
    },
  ];

  for (const environment of environments) {
    assert.equal(
      inspectClerkLocalAuthPreflight(environment).ready,
      isClerkLocalAuthConfigurationReady(environment),
    );
  }
});

test('canonical local origin accepts only credential-free HTTP loopback roots', () => {
  for (const origin of [
    'http://127.0.0.1:3211',
    'http://localhost:3211/',
    'http://[::1]:3211',
  ]) assert.equal(isValidClerkLocalAuthOrigin(origin), true, origin);

  for (const origin of [
    undefined,
    '',
    'not a URL',
    'https://127.0.0.1:3211',
    'http://0.0.0.0:3211',
    'http://localhost.evil.test:3211',
    'http://user:password@127.0.0.1:3211',
    'http://127.0.0.1:3211/sign-up',
    'http://127.0.0.1:3211/?token=private',
    'http://127.0.0.1:3211/#private',
    'http://127.0.0.1:99999',
  ]) assert.equal(isValidClerkLocalAuthOrigin(origin), false, String(origin));
});

test('status serialization cannot disclose keys, origin tokens, cookies, or key metadata', () => {
  const sentinels = Object.freeze({
    cookie: 'session-cookie-sentinel',
    originToken: 'origin-token-sentinel',
    publishable: 'pk_test_publishable-sentinel',
    secret: 'sk_test_secret-sentinel',
  });
  const environment = Object.freeze({
    ...validBase,
    CLERK_LOCAL_AUTH_ORIGIN:
      `http://127.0.0.1:3211/?token=${sentinels.originToken}`,
    CLERK_SECRET_KEY: sentinels.secret,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: sentinels.publishable,
    cookie: sentinels.cookie,
  });

  const result = inspectClerkLocalAuthPreflight(environment);
  const serialized = JSON.stringify(result);

  assert.deepEqual(Object.keys(result).sort(), ['ready', 'status']);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(serialized, '{"status":"invalid-origin","ready":false}');
  for (const sentinel of Object.values(sentinels)) {
    assert.equal(serialized.includes(sentinel), false);
  }
  assert.doesNotMatch(serialized, /https?:|cookie|token|key|length|prefix|suffix/iu);
});

test('preflight module has no ambient environment, provider, cookie, or network access', async () => {
  const source = await readFile(
    path.join(webRoot, 'lib/clerk-local-auth-preflight.ts'),
    'utf8',
  );

  assert.doesNotMatch(source, /process\.env|@clerk|cookies\s*\(|fetch\s*\(/u);
});

test('synthetic Clerk execution is excluded from ordinary Playwright and loads one dev env snapshot only in its governed runner', async () => {
  const [
    specSource,
    baseConfig,
    dedicatedConfig,
    runnerSource,
    nextConfig,
  ] = await Promise.all([
    readFile(
      path.join(webRoot, 'e2e/clerk-synthetic-lifecycle.spec.ts'),
      'utf8',
    ),
    readFile(path.join(webRoot, 'playwright.config.ts'), 'utf8'),
    readFile(path.join(webRoot, 'playwright.clerk.config.ts'), 'utf8'),
    readFile(
      path.join(webRoot, 'scripts/run-clerk-synthetic-registration.ts'),
      'utf8',
    ),
    readFile(path.join(webRoot, 'next.config.ts'), 'utf8'),
  ]);

  assert.doesNotMatch(specSource, /loadEnvConfig|@next\/env/u);
  assert.doesNotMatch(dedicatedConfig, /loadEnvConfig|@next\/env/u);
  assert.match(
    baseConfig,
    /testIgnore:\s*'clerk-synthetic-lifecycle\.spec\.ts'/u,
  );
  assert.match(
    runnerSource,
    /nextEnv\.loadEnvConfig\(\s*webRoot,\s*true,/u,
  );
  assert.match(
    dedicatedConfig,
    /CLERK_SYNTHETIC_RUNNER_GUARD/u,
  );
  assert.match(dedicatedConfig, /stderr:\s*'ignore'/u);
  assert.match(dedicatedConfig, /stdout:\s*'ignore'/u);
  assert.match(dedicatedConfig, /args:\s*\['--no-proxy-server'\]/u);
  assert.match(dedicatedConfig, /env:\s*browserEnvironment/u);
  assert.match(
    dedicatedConfig,
    /HELP_MATH_CLERK_SYNTHETIC_BUILD:\s*\n?\s*CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION/u,
  );
  assert.doesNotMatch(dedicatedConfig, /webServer:[\s\S]*\.\.\.process\.env/u);
  assert.match(nextConfig, /const clerkSyntheticBuild\s*=/u);
  assert.match(
    nextConfig,
    /distDir:\s*clerkSyntheticBuild\s*\? CLERK_SYNTHETIC_DIST_DIR/u,
  );
});
