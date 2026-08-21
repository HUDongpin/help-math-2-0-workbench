import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  canonicalLocalAuthRedirect,
  isLocalAuthEnabled,
  isLocalAuthPath,
  isLocalAuthSessionApiPath,
  isValidClerkLocalAuthOrigin,
  localizedAuthPath,
} from '../lib/local-auth-access';
import {
  normalizeLocalClerkMiddlewareResponse,
  proxyForRequest,
} from '../proxy';

const webRoot = path.resolve(import.meta.dirname, '..');

test('local Clerk access requires an exact development-only opt-in', () => {
  assert.equal(isLocalAuthEnabled({NODE_ENV: 'development'}), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: '1',
    NODE_ENV: 'development',
  }), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    NODE_ENV: 'development',
  }), false);
  const legacyKeylessOnly = {
    CLERK_KEYLESS_BOOTSTRAP_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false',
    NODE_ENV: 'development',
  } as const;
  assert.equal(isLocalAuthEnabled(legacyKeylessOnly), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: 'unpaired-secret',
    NODE_ENV: 'development',
  }), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'unpaired-publishable',
    NODE_ENV: 'development',
  }), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: 'sk_test_development-secret',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_development-publishable',
    NODE_ENV: 'development',
  }), true);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_SECRET_KEY: 'sk_test_development-secret',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_development-publishable',
    NODE_ENV: 'development',
  }), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: 'sk_test_development-secret',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_development-publishable',
    NODE_ENV: 'development',
  }), false);
  assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: 'sk_test_development-secret',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_development-publishable',
    NODE_ENV: 'production',
  }), false);
  for (const [publishableKey, secretKey] of [
    ['pk_live_publishable', 'sk_live_secret'],
    ['pk_test_publishable', 'sk_live_secret'],
    ['pk_live_publishable', 'sk_test_secret'],
    ['not-a-key', 'also-not-a-key'],
  ]) assert.equal(isLocalAuthEnabled({
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: secretKey,
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
    NODE_ENV: 'development',
  }), false, `${publishableKey}/${secretKey}`);
});

test('local auth origin is a credential-free HTTP loopback root', () => {
  for (const origin of [
    'http://127.0.0.1:3211',
    'http://localhost:3211/',
    'http://[::1]:3211',
  ]) assert.equal(isValidClerkLocalAuthOrigin(origin), true, origin);

  for (const origin of [
    undefined,
    'https://127.0.0.1:3211',
    'http://user:password@127.0.0.1:3211',
    'http://127.0.0.1:3211/sign-up',
    'http://127.0.0.1:3211/?token=private',
    'http://www.helpmath.ai',
  ]) assert.equal(isValidClerkLocalAuthOrigin(origin), false, String(origin));
});

test('local auth paths are narrow and locale helpers preserve EN and ES', () => {
  for (const pathname of [
    '/account',
    '/sign-in',
    '/sign-in/factor-one',
    '/sign-up',
    '/sign-up/verify-email-address',
  ]) assert.equal(isLocalAuthPath(pathname), true, pathname);
  for (const pathname of ['/', '/login', '/courses/4/3', '/api/nova']) {
    assert.equal(isLocalAuthPath(pathname), false, pathname);
  }
  assert.equal(isLocalAuthSessionApiPath('/api/auth/session'), true);
  for (const pathname of [
    '/api/auth/session/',
    '/en/api/auth/session',
    '/api/auth/session/extra',
    '/api/nova',
  ]) assert.equal(isLocalAuthSessionApiPath(pathname), false, pathname);

  assert.equal(localizedAuthPath('en', '/sign-up'), '/sign-up');
  assert.equal(localizedAuthPath('es', '/sign-up'), '/es/sign-up');
  assert.equal(localizedAuthPath('en', '/'), '/');
  assert.equal(localizedAuthPath('es', '/'), '/es');
});

test('local Clerk paths canonicalize a mismatched loopback host exactly once', () => {
  const environment = {
    CLERK_LOCAL_AUTH_ENABLED: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3211',
    CLERK_SECRET_KEY: 'sk_test_development-secret',
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_development-publishable',
    NODE_ENV: 'development',
  } as const;

  const redirect = canonicalLocalAuthRedirect({
    environment,
    localeFreePathname: '/sign-up',
    requestUrl: new URL('http://localhost:3211/sign-up?step=verify'),
  });
  assert.equal(
    redirect?.href,
    'http://127.0.0.1:3211/sign-up?step=verify',
  );
  assert.equal(canonicalLocalAuthRedirect({
    environment,
    localeFreePathname: '/sign-up',
    requestHost: '127.0.0.1:3211',
    requestUrl: new URL('http://localhost:3211/en/sign-up'),
  }), null);
  assert.equal(canonicalLocalAuthRedirect({
    environment,
    localeFreePathname: '/sign-up',
    requestHost: 'localhost:3211',
    requestUrl: new URL('http://127.0.0.1:3211/sign-up'),
  })?.href, 'http://127.0.0.1:3211/sign-up');
  assert.equal(canonicalLocalAuthRedirect({
    environment,
    localeFreePathname: '/sign-up',
    requestHost: 'example.com',
    requestUrl: new URL('http://127.0.0.1:3211/sign-up'),
  }), null);
  assert.equal(canonicalLocalAuthRedirect({
    environment,
    localeFreePathname: '/courses/4/3',
    requestUrl: new URL('http://localhost:3211/courses/4/3'),
  }), null);
  assert.equal(canonicalLocalAuthRedirect({
    environment: {...environment, NODE_ENV: 'production'},
    localeFreePathname: '/sign-up',
    requestUrl: new URL('http://localhost:3211/sign-up'),
  }), null);
  assert.equal(canonicalLocalAuthRedirect({
    environment: {
      ...environment,
      CLERK_LOCAL_AUTH_ORIGIN: 'https://www.helpmath.ai',
    },
    localeFreePathname: '/sign-up',
    requestUrl: new URL('http://localhost:3211/sign-up'),
  }), null);
});

test('Clerk same-path loopback continuation stays inside middleware', () => {
  const response = new Response(null, {headers: {
    'x-middleware-rewrite': 'http://localhost:3211/en/sign-up',
  }});
  normalizeLocalClerkMiddlewareResponse(
    response,
    new URL('http://127.0.0.1:3211/en/sign-up'),
  );
  assert.equal(response.headers.get('x-middleware-rewrite'), null);
  assert.equal(response.headers.get('x-middleware-next'), '1');

  for (const rewrite of [
    'http://localhost:3212/en/sign-up',
    'http://localhost:3211/account',
    'https://example.com/en/sign-up',
  ]) {
    const untouched = new Response(null, {headers: {
      'x-middleware-rewrite': rewrite,
    }});
    normalizeLocalClerkMiddlewareResponse(
      untouched,
      new URL('http://127.0.0.1:3211/en/sign-up'),
    );
    assert.equal(untouched.headers.get('x-middleware-rewrite'), rewrite);
    assert.equal(untouched.headers.get('x-middleware-next'), null);
  }
});

test('proxy allows auth UI only for the exact local candidate flag', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthEnabled = process.env.CLERK_LOCAL_AUTH_ENABLED;
  const originalAuthOrigin = process.env.CLERK_LOCAL_AUTH_ORIGIN;
  const originalKeylessDisabled = process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED;
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;
  try {
    Reflect.set(process.env, 'NODE_ENV', 'development');
    process.env.CLERK_LOCAL_AUTH_ENABLED = 'true';
    process.env.CLERK_LOCAL_AUTH_ORIGIN = 'http://127.0.0.1:3211';
    process.env.CLERK_SECRET_KEY = 'sk_test_development-secret';
    process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = 'true';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      'pk_test_development-publishable';
    for (const pathname of [
      '/sign-in',
      '/sign-up',
      '/account',
      '/api/auth/session',
    ]) {
      const response = await proxyForRequest(
        new NextRequest(`http://127.0.0.1:3211${pathname}`),
      );
      assert.equal(response.status, 200, pathname);
      if (pathname === '/api/auth/session') {
        assert.equal(response.headers.get('x-middleware-next'), '1');
        assert.equal(response.headers.get('x-middleware-rewrite'), null);
      }
    }
    const keylessSync = await proxyForRequest(new NextRequest(
      'http://127.0.0.1:3211/clerk-sync-keyless?returnUrl=https://example.com',
    ));
    assert.equal(keylessSync.status, 404);
    assert.equal(keylessSync.headers.get('location'), null);
    assert.equal(keylessSync.headers.get('x-robots-tag'), 'noindex, nofollow');

    Reflect.set(process.env, 'NODE_ENV', 'production');
    for (const pathname of [
      '/sign-in',
      '/sign-up',
      '/account',
      '/api/auth/session',
    ]) {
      const response = await proxyForRequest(
        new NextRequest(`https://www.helpmath.ai${pathname}`),
      );
      assert.equal(response.status, 404, pathname);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    }
  } finally {
    if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Reflect.set(process.env, 'NODE_ENV', originalNodeEnv);
    if (originalAuthEnabled === undefined) {
      Reflect.deleteProperty(process.env, 'CLERK_LOCAL_AUTH_ENABLED');
    } else process.env.CLERK_LOCAL_AUTH_ENABLED = originalAuthEnabled;
    if (originalAuthOrigin === undefined) {
      Reflect.deleteProperty(process.env, 'CLERK_LOCAL_AUTH_ORIGIN');
    } else process.env.CLERK_LOCAL_AUTH_ORIGIN = originalAuthOrigin;
    if (originalKeylessDisabled === undefined) {
      Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_CLERK_KEYLESS_DISABLED');
    } else {
      process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = originalKeylessDisabled;
    }
    if (originalPublishableKey === undefined) {
      Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    } else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    if (originalSecretKey === undefined) {
      Reflect.deleteProperty(process.env, 'CLERK_SECRET_KEY');
    } else process.env.CLERK_SECRET_KEY = originalSecretKey;
  }
});

test('provider-specific UI stays behind an app-owned server session boundary', async () => {
  const [
    sessionSource,
    providerSource,
    accountRoute,
    sessionRoute,
    gitignore,
  ] = await Promise.all([
    readFile(path.join(webRoot, 'lib/auth-session.ts'), 'utf8'),
    readFile(path.join(webRoot, 'lib/clerk-auth-session.server.ts'), 'utf8'),
    readFile(path.join(webRoot, 'app/[locale]/account/page.tsx'), 'utf8'),
    readFile(path.join(webRoot, 'app/api/auth/session/route.ts'), 'utf8'),
    readFile(path.resolve(webRoot, '../..', '.gitignore'), 'utf8'),
  ]);
  assert.match(sessionSource, /status: 'disabled'|status: 'signed-out'/u);
  assert.doesNotMatch(sessionSource, /@clerk/u);
  assert.match(providerSource, /import \{auth\} from '@clerk\/nextjs\/server'/u);
  assert.match(providerSource, /readAuthSession/u);
  assert.match(accountRoute, /session\.status !== 'signed-in'/u);
  assert.match(sessionRoute, /status: 401/u);
  assert.doesNotMatch(sessionRoute, /providerSubject|sessionId/u);
  assert.match(gitignore, /^\*\*\/\.clerk\/$/mu);
});
