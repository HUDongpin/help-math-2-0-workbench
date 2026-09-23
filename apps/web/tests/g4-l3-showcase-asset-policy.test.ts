import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  G4_L3_SHOWCASE_ASSET_DIRECTORIES,
  isG4L3ShowcaseAssetAuthorized,
  isG4L3ShowcaseAssetPath,
  isG4L3ShowcaseAssetSegments,
} from '../lib/g4-l3-showcase-asset-policy';
import {proxyForRequest} from '../proxy';

const webRoot = path.resolve(import.meta.dirname, '..');

async function withEnvironment<T>(
  values: Readonly<Record<string, string | undefined>>,
  callback: () => Promise<T>,
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

test('showcase asset policy binds exactly the 39 page packages and one shell', async () => {
  assert.equal(G4_L3_SHOWCASE_ASSET_DIRECTORIES.length, 40);
  assert.equal(new Set(G4_L3_SHOWCASE_ASSET_DIRECTORIES).size, 40);

  const courseAssetsRoot = path.join(webRoot, '../../public/flash-assets/courses');
  const diskDirectories = (await readdir(courseAssetsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith('course-g04-l03-')
      || name === 'shell-course-g04-l03-index-local')
    .sort();
  assert.deepEqual(
    [...G4_L3_SHOWCASE_ASSET_DIRECTORIES].sort(),
    diskDirectories,
  );
});

test('showcase asset classification is narrow and fails closed', () => {
  assert.equal(isG4L3ShowcaseAssetSegments([
    'courses',
    'course-g04-l03-ts-006',
    'canvas-renderer.js',
  ]), true);
  assert.equal(isG4L3ShowcaseAssetPath(
    '/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png',
  ), true);
  assert.equal(isG4L3ShowcaseAssetSegments([
    'courses',
    'course-g04-l03-future-draft',
    'canvas-renderer.js',
  ]), false);
  assert.equal(isG4L3ShowcaseAssetPath(
    '/flash-assets/courses/course-g05-l04-ir-001/canvas-renderer.js',
  ), false);
  assert.equal(isG4L3ShowcaseAssetAuthorized({}), false);
  assert.equal(isG4L3ShowcaseAssetAuthorized({
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: '1',
  }), false);
  assert.equal(isG4L3ShowcaseAssetAuthorized({
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }), true);
});

test('production proxy serves only opted-in G4 L3 showcase assets', async () => {
  const target = 'https://www.helpmath.ai/flash-assets/courses/'
    + 'course-g04-l03-ts-006/canvas-renderer.js';
  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(target))).status, 404);
  });
  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }, async () => {
    const allowed = await proxyForRequest(new NextRequest(target));
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('x-middleware-next'), '1');
    const otherLesson = await proxyForRequest(new NextRequest(
      'https://www.helpmath.ai/flash-assets/courses/'
      + 'course-g05-l04-ir-001/canvas-renderer.js',
    ));
    assert.equal(otherLesson.status, 404);
  });
});

test('proxy enforces the host-composite digest before public static handling', async () => {
  const base = 'https://www.helpmath.ai/flash-assets/courses/'
    + 'shell-course-g04-l03-index-local/host-composite-assets/'
    + 'lesson-shell-mc-back-text.svg';
  const digest =
    '102f0ddeec5ede8843149c3c5621fb5a6632a5edc191b768823fbce691740355';
  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(base))).status, 404);
    assert.equal((await proxyForRequest(new NextRequest(
      `${base}?sha256=${'0'.repeat(64)}`,
    ))).status, 404);
    assert.equal((await proxyForRequest(new NextRequest(
      `${base}?sha256=${digest}`,
    ))).status, 200);
  });
});

test('flash asset route includes defense-in-depth showcase authorization', async () => {
  const source = await readFile(
    path.join(webRoot, 'app/flash-assets/[...asset]/route.ts'),
    'utf8',
  );
  assert.match(source, /isG4L3ShowcaseAssetSegments\(canonicalAsset\)/u);
  assert.match(source, /!isG4L3ShowcaseAssetAuthorized\(\)/u);
});
