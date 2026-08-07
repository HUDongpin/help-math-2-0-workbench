import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC_FLAG,
  isExactLoopbackHostHeader,
  isLocalReferenceDiagnosticRequestAllowed,
  LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
} from '../lib/local-reference-diagnostic-access';
import proxy from '../proxy';

const environmentKeys = [
  HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC_FLAG,
  'NODE_ENV',
  'VERCEL_ENV',
] as const;

async function withEnvironment<T>(
  values: Partial<Record<(typeof environmentKeys)[number], string>>,
  callback: () => T | Promise<T>,
) {
  const original = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]]),
  ) as Record<(typeof environmentKeys)[number], string | undefined>;
  try {
    for (const key of environmentKeys) {
      const value = values[key];
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    return await callback();
  } finally {
    for (const key of environmentKeys) {
      const value = original[key];
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

function requestHeaders(host: string, additions: Record<string, string> = {}) {
  return new Headers({host, ...additions});
}

test('exact loopback Host syntax accepts only localhost, 127.0.0.1, and bracketed ::1 with a valid optional port', () => {
  for (const value of [
    'localhost',
    'LOCALHOST:3101',
    '127.0.0.1',
    '127.0.0.1:3101',
    '[::1]',
    '[::1]:3101',
  ]) assert.equal(isExactLoopbackHostHeader(value), true, value);
  for (const value of [
    null,
    '',
    'localhost.evil.test',
    '127.0.0.2',
    '::1',
    '[::1].evil.test',
    'localhost:0',
    'localhost:65536',
    'localhost:3101, example.test',
    'user@localhost:3101',
  ]) assert.equal(isExactLoopbackHostHeader(value), false, String(value));
});

test('production access is default-deny and requires the exact flag, plain HTTP, and every host signal to be loopback', () => {
  const allowedInput = {
    headers: requestHeaders('127.0.0.1:3101'),
    url: 'http://127.0.0.1:3101/reference/course-g04-l10-ir-001',
    nodeEnv: 'production',
    enabledFlag: '1',
    deploymentEnvironment: '',
  };
  assert.equal(isLocalReferenceDiagnosticRequestAllowed(allowedInput), true);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({...allowedInput, enabledFlag: undefined}), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({...allowedInput, enabledFlag: 'true'}), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({...allowedInput, deploymentEnvironment: 'production'}), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({...allowedInput, url: 'https://127.0.0.1:3101/reference/member'}), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({
    ...allowedInput,
    headers: requestHeaders('example.test'),
  }), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({
    ...allowedInput,
    headers: requestHeaders('127.0.0.1:3101', {'x-forwarded-host': 'example.test'}),
  }), false);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({
    ...allowedInput,
    headers: requestHeaders('127.0.0.1:3101', {'x-forwarded-host': 'localhost:3101'}),
  }), true);
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({
    ...allowedInput,
    headers: requestHeaders('127.0.0.1:3101', {'x-forwarded-proto': 'https'}),
  }), false);
});

test('development access remains unchanged without the production flag or loopback restrictions', () => {
  assert.equal(isLocalReferenceDiagnosticRequestAllowed({
    headers: requestHeaders('development.example.test'),
    url: 'https://development.example.test/reference/member',
    nodeEnv: 'development',
    enabledFlag: undefined,
    deploymentEnvironment: 'development',
  }), true);
});

test('proxy keeps production reference pages 404 by default and admits only flagged plain-HTTP loopback requests', async () => {
  await withEnvironment({NODE_ENV: 'production'}, async () => {
    const denied = await proxy(new NextRequest(
      'http://127.0.0.1:3101/reference/course-g04-l10-ir-001',
      {headers: {host: '127.0.0.1:3101'}},
    ));
    assert.equal(denied.status, 404);
    assert.doesNotMatch(denied.headers.get('content-security-policy') ?? '', /wasm-unsafe-eval/);
  });

  await withEnvironment({
    NODE_ENV: 'production',
    HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC: '1',
  }, async () => {
    for (const url of [
      'http://127.0.0.1:3101/reference/course-g04-l10-ir-001',
      'http://127.0.0.1:3101/es/reference/course-g04-l10-ir-001',
    ]) {
      const allowed = await proxy(new NextRequest(url, {headers: {host: '127.0.0.1:3101'}}));
      assert.equal(allowed.status, 200);
      assert.equal(allowed.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive, noimageindex');
      assert.equal(allowed.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.equal(allowed.headers.get('x-helpmath-local-reference-diagnostic'), 'forensic-only');
      assert.equal(
        allowed.headers.get('content-security-policy'),
        LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
      );
      assert.match(allowed.headers.get('content-security-policy') ?? '', /script-src[^;]*'wasm-unsafe-eval'/);
    }
    const externalHost = await proxy(new NextRequest(
      'http://example.test/reference/course-g04-l10-ir-001',
      {headers: {host: 'example.test'}},
    ));
    assert.equal(externalHost.status, 404);
    assert.doesNotMatch(externalHost.headers.get('content-security-policy') ?? '', /wasm-unsafe-eval/);
    const spoofedForwardedHost = await proxy(new NextRequest(
      'http://127.0.0.1:3101/reference/course-g04-l10-ir-001',
      {headers: {host: '127.0.0.1:3101', 'x-forwarded-host': 'example.test'}},
    ));
    assert.equal(spoofedForwardedHost.status, 404);
    const httpsLoopback = await proxy(new NextRequest(
      'https://127.0.0.1:3101/reference/course-g04-l10-ir-001',
      {headers: {host: '127.0.0.1:3101'}},
    ));
    assert.equal(httpsLoopback.status, 404);
    const ordinary = await proxy(new NextRequest(
      'http://127.0.0.1:3101/about',
      {headers: {host: '127.0.0.1:3101'}},
    ));
    assert.equal(ordinary.status, 200);
    assert.doesNotMatch(ordinary.headers.get('content-security-policy') ?? '', /wasm-unsafe-eval/);
  });

  await withEnvironment({NODE_ENV: 'development'}, async () => {
    const unchanged = await proxy(new NextRequest(
      'https://development.example.test/reference/course-g04-l10-ir-001',
      {headers: {host: 'development.example.test'}},
    ));
    assert.equal(unchanged.status, 200);
  });
});

test('page, SWF API, and Ruffle API sources use the shared gate and preserve evidence/security headers and path checks', async () => {
  const [pageSource, swfSource, ruffleSource] = await Promise.all([
    readFile(new URL('../app/[locale]/reference/[animationId]/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/reference/[animationId]/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/ruffle/[...asset]/route.ts', import.meta.url), 'utf8'),
  ]);
  for (const source of [pageSource, swfSource, ruffleSource]) {
    assert.match(source, /isLocalReferenceDiagnosticRequestAllowed/);
    assert.doesNotMatch(source, /process\.env\.NODE_ENV === 'production'/);
  }
  assert.match(pageSource, /robots:\s*\{index:\s*false,\s*follow:\s*false\}/);
  assert.match(swfSource, /'Cache-Control': 'no-store'/);
  assert.match(swfSource, /'Content-Security-Policy': "default-src 'none'; sandbox"/);
  assert.match(swfSource, /'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex'/);
  assert.match(swfSource, /findAnimation\(animationId\)/);
  assert.match(swfSource, /resolveCatalogSource\(animation\)/);
  assert.match(ruffleSource, /'Cache-Control': 'no-store'/);
  assert.match(ruffleSource, /'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex'/);
  assert.match(ruffleSource, /asset\.length !== 1/);
  assert.match(ruffleSource, /\^\[a-zA-Z0-9\._-\]\+\$/);
});
