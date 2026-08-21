import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  G3_L2_SHOWCASE_RELEASE_ID,
  G5_L3_SHOWCASE_RELEASE_ID,
  G5_L5_SHOWCASE_RELEASE_ID,
} from '../lib/current-js-showcase-publication';
import {
  isPageOnlyCurrentJsShowcaseAssetAuthorized,
  isPageOnlyCurrentJsShowcaseAssetPath,
  isPageOnlyCurrentJsShowcaseAssetSegments,
  PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE,
  pageOnlyCurrentJsShowcaseReleaseIdForAssetSegments,
} from '../lib/page-only-current-js-showcase-asset-policy';
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

const scopes = Object.freeze([
  Object.freeze({
    directoryPrefix: 'course-g03-l02-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED',
    expectedDirectories: 70,
    releaseId: G3_L2_SHOWCASE_RELEASE_ID,
    route: '/courses/3/2',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l03-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED',
    expectedDirectories: 64,
    releaseId: G5_L3_SHOWCASE_RELEASE_ID,
    route: '/courses/5/3',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l05-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED',
    expectedDirectories: 56,
    releaseId: G5_L5_SHOWCASE_RELEASE_ID,
    route: '/courses/5/5',
  }),
]);

test('page-only showcase policy binds exactly the 190 registered runtime directories', async () => {
  const courseAssetsRoot = path.join(
    webRoot,
    'public/flash-assets/courses',
  );
  const diskDirectories = (await readdir(courseAssetsRoot, {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const allPolicyDirectories = Object.values(
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE,
  ).flat();
  assert.equal(allPolicyDirectories.length, 190);
  assert.equal(new Set(allPolicyDirectories).size, 190);

  for (const scope of scopes) {
    const policyDirectories = [
      ...PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
        scope.releaseId
      ],
    ].sort();
    assert.equal(policyDirectories.length, scope.expectedDirectories);
    assert.deepEqual(
      policyDirectories,
      diskDirectories
        .filter((directory) => directory.startsWith(scope.directoryPrefix))
        .sort(),
      scope.releaseId,
    );
  }
});

test('page-only showcase asset classification is exact and fails closed', () => {
  const exact = [
    'courses',
    'course-g03-l02-ir-001-87689b4b',
    'canvas-renderer.js',
  ];
  assert.equal(isPageOnlyCurrentJsShowcaseAssetSegments(exact), true);
  assert.equal(
    pageOnlyCurrentJsShowcaseReleaseIdForAssetSegments(exact),
    G3_L2_SHOWCASE_RELEASE_ID,
  );
  assert.equal(isPageOnlyCurrentJsShowcaseAssetPath(
    '/flash-assets/courses/course-g05-l03-fq-003/canvas-renderer.js',
  ), true);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetSegments([
    'courses',
    'course-g03-l02-future-draft',
    'canvas-renderer.js',
  ]), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetSegments([
    'courses',
    'course-g03-l02-fq-001',
    '..',
    'private.json',
  ]), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(exact, {}), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(exact, {
    CURRENT_JS_SHOWCASE_G3_L2_ENABLED: '1',
  }), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(exact, {
    CURRENT_JS_SHOWCASE_G5_L3_ENABLED: 'true',
  }), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(exact, {
    CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
  }), true);
});

test('production proxy admits each page-only course and its exact asset closure only when opted in', async () => {
  for (const scope of scopes) {
    const firstDirectory =
      PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
        scope.releaseId
      ][0]!;
    const courseUrl = `https://www.helpmath.ai${scope.route}`;
    const assetUrl = 'https://www.helpmath.ai/flash-assets/courses/'
      + `${firstDirectory}/canvas-renderer.js`;

    await withEnvironment({
      NODE_ENV: 'production',
      [scope.environmentKey]: undefined,
    }, async () => {
      assert.equal(
        (await proxyForRequest(new NextRequest(courseUrl))).status,
        404,
      );
      assert.equal(
        (await proxyForRequest(new NextRequest(assetUrl))).status,
        404,
      );
    });

    await withEnvironment({
      NODE_ENV: 'production',
      [scope.environmentKey]: 'true',
    }, async () => {
      assert.equal(
        (await proxyForRequest(new NextRequest(courseUrl))).status,
        200,
      );
      const asset = await proxyForRequest(new NextRequest(assetUrl));
      assert.equal(asset.status, 200);
      assert.equal(asset.headers.get('x-middleware-next'), '1');
    });
  }

  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      'https://www.helpmath.ai/flash-assets/courses/'
      + 'course-g03-l02-future-draft/canvas-renderer.js',
    ))).status, 404);
  });
});

test('flash asset route repeats the page-only authorization check', async () => {
  const source = await readFile(
    path.join(webRoot, 'app/flash-assets/[...asset]/route.ts'),
    'utf8',
  );
  assert.match(
    source,
    /isPageOnlyCurrentJsShowcaseAssetSegments\(canonicalAsset\)/u,
  );
  assert.match(
    source,
    /!isPageOnlyCurrentJsShowcaseAssetAuthorized\(canonicalAsset\)/u,
  );
});
