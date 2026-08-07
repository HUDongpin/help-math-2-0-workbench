import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  EXECUTIVE_PREVIEW_COOKIE_NAME,
  createExecutivePreviewSession,
  getExecutivePreviewConfig,
} from '../lib/executive-preview-access';
import {isG5L4ExecutivePreviewEnabled} from '../lib/g5-l4-executive-preview';
import proxy from '../proxy';

const configuredEnvironment = {
  EXECUTIVE_PREVIEW_ENABLED: 'true',
  EXECUTIVE_PREVIEW_ACCESS_KEY: 'ExecutivePreviewAccessKey_2026_August_JohnRamo',
  EXECUTIVE_PREVIEW_SESSION_SECRET: 'ExecutivePreviewSessionSecret_2026_August_HELP',
  EXECUTIVE_PREVIEW_EXPIRES_AT: '2026-08-20T15:59:00.000Z',
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
} as const;

async function withEnvironment<T>(
  values: Record<string, string | undefined>,
  callback: () => Promise<T> | T,
) {
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

test('G5 L4 uses the same production-safe timed review gate as G4 L3', async () => {
  await withEnvironment({
    ...configuredEnvironment,
    EXECUTIVE_PREVIEW_ENABLED: undefined,
  }, () => {
    assert.equal(isG5L4ExecutivePreviewEnabled(), false);
  });
  await withEnvironment(configuredEnvironment, () => {
    assert.equal(isG5L4ExecutivePreviewEnabled(), true);
  });
});

test('proxy protects the G5 whole lesson, scene, and runtime assets', async () => {
  await withEnvironment(configuredEnvironment, async () => {
    for (const pathname of [
      '/courses/5/4',
      '/es/courses/5/4',
      '/executive-preview/g5-l4',
    ]) {
      const blocked = await proxy(new NextRequest(`https://www.helpmath.ai${pathname}`));
      assert.equal(blocked.status, 307);
    }
    const blockedAsset = await proxy(new NextRequest(
      'https://www.helpmath.ai/flash-assets/courses/course-g05-l04-rw-002/canvas-renderer.js',
    ));
    assert.equal(blockedAsset.status, 404);

    const config = getExecutivePreviewConfig(configuredEnvironment, Date.parse('2026-08-07T00:00:00Z'));
    assert(config);
    const token = await createExecutivePreviewSession(config, Date.parse('2026-08-07T00:00:00Z'));
    const admitted = await proxy(new NextRequest(
      'https://www.helpmath.ai/courses/5/4',
      {headers: {cookie: `${EXECUTIVE_PREVIEW_COOKIE_NAME}=${token}`}},
    ));
    assert.equal(admitted.status, 200);
    assert.equal(admitted.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(admitted.headers.get('x-helpmath-controlled-preview'), 'executive-preview');
  });
});

test('Next responses pin private no-store and noindex headers', async () => {
  const source = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');
  assert.match(source, /private, no-store, max-age=0/u);
  assert.match(source, /noindex, nofollow, noarchive, noimageindex/u);
  assert.match(source, /source: '\/flash-assets\/:path\*'/u);
  assert.match(source, /source: '\/courses\/5\/4'/u);
  assert.match(source, /g5-l4-ceo-preview/u);
});
