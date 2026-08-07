import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {POST} from '../app/api/executive-preview/session/route';
import {
  EXECUTIVE_PREVIEW_COOKIE_NAME,
  createExecutivePreviewSession,
  getExecutivePreviewConfig,
  isAllowedExecutiveReturnTo,
  isExecutivePreviewAssetPath,
  isExecutivePreviewProtectedPath,
  verifyExecutivePreviewAccessKey,
  verifyExecutivePreviewSession,
} from '../lib/executive-preview-access';

const NOW = Date.parse('2026-08-07T00:00:00.000Z');
const env = {
  EXECUTIVE_PREVIEW_ENABLED: 'true',
  EXECUTIVE_PREVIEW_ACCESS_KEY: 'ExecutivePreviewAccessKey_2026_August_JohnRamo',
  EXECUTIVE_PREVIEW_SESSION_SECRET: 'ExecutivePreviewSessionSecret_2026_August_HELP',
  EXECUTIVE_PREVIEW_EXPIRES_AT: '2026-08-20T15:59:00.000Z',
  VERCEL_ENV: 'production',
} as const;

async function withEnvironment<T>(callback: () => T | Promise<T>) {
  const original = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(env)) {
      Reflect.set(process.env, key, value);
    }
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

test('configuration is fail-closed for weak, shared, expired, or over-ceiling credentials', () => {
  assert(getExecutivePreviewConfig(env, NOW));
  assert.equal(getExecutivePreviewConfig({...env, EXECUTIVE_PREVIEW_ENABLED: '1'}, NOW), undefined);
  assert.equal(getExecutivePreviewConfig({...env, EXECUTIVE_PREVIEW_ACCESS_KEY: 'short'}, NOW), undefined);
  assert.equal(getExecutivePreviewConfig({
    ...env,
    EXECUTIVE_PREVIEW_SESSION_SECRET: env.EXECUTIVE_PREVIEW_ACCESS_KEY,
  }, NOW), undefined);
  assert.equal(getExecutivePreviewConfig({
    ...env,
    EXECUTIVE_PREVIEW_EXPIRES_AT: '2026-08-06T15:59:00.000Z',
  }, NOW), undefined);
  assert.equal(getExecutivePreviewConfig({
    ...env,
    EXECUTIVE_PREVIEW_EXPIRES_AT: '2026-08-22T15:59:00.000Z',
  }, NOW), undefined);
});

test('access-key comparison and signed sessions reject substitutions and tampering', async () => {
  const config = getExecutivePreviewConfig(env, NOW);
  assert(config);
  assert.equal(await verifyExecutivePreviewAccessKey(env.EXECUTIVE_PREVIEW_ACCESS_KEY, config), true);
  assert.equal(await verifyExecutivePreviewAccessKey(`${env.EXECUTIVE_PREVIEW_ACCESS_KEY}x`, config), false);

  const token = await createExecutivePreviewSession(config, NOW);
  assert.equal(await verifyExecutivePreviewSession(token, config, NOW + 1_000), true);
  assert.equal(await verifyExecutivePreviewSession(`${token}x`, config, NOW + 1_000), false);
  assert.equal(await verifyExecutivePreviewSession(token, config, config.expiresAt), false);
});

test('the protected surface is exactly the four review routes, auxiliary scene, and runtime assets', () => {
  for (const pathname of [
    '/demos/conversion-1-2',
    '/es/demos/conversion-1-4',
    '/courses/4/3',
    '/en/courses/5/4',
    '/executive-preview/g5-l4',
    '/flash-assets/courses/course-g04-l03-in-002/canvas-renderer.js',
  ]) {
    assert.equal(isExecutivePreviewProtectedPath(pathname), true, pathname);
  }
  assert.equal(isExecutivePreviewAssetPath('/flash-assets/'), false);
  assert.equal(isAllowedExecutiveReturnTo('/courses/4/3'), true);
  assert.equal(isAllowedExecutiveReturnTo('https://example.test'), false);
  assert.equal(isExecutivePreviewProtectedPath('/courses/5/5'), false);
});

test('session endpoint enforces same-origin form posts and sets an HttpOnly secure cookie', async () => {
  await withEnvironment(async () => {
    const body = new URLSearchParams({
      locale: 'en',
      passphrase: env.EXECUTIVE_PREVIEW_ACCESS_KEY,
    });
    const response = await POST(new NextRequest(
      'https://www.helpmath.ai/api/executive-preview/session',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://www.helpmath.ai',
          'sec-fetch-site': 'same-origin',
        },
        body,
      },
    ));
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), '/executive-preview');
    const cookie = response.headers.get('set-cookie') ?? '';
    assert.match(cookie, new RegExp(`^${EXECUTIVE_PREVIEW_COOKIE_NAME}=`));
    assert.match(cookie, /HttpOnly/u);
    assert.match(cookie, /Secure/u);
    assert.match(cookie, /SameSite=lax/ui);

    const crossOrigin = await POST(new NextRequest(
      'https://www.helpmath.ai/api/executive-preview/session',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://attacker.example',
          'sec-fetch-site': 'cross-site',
        },
        body,
      },
    ));
    assert.equal(crossOrigin.status, 403);
  });
});
