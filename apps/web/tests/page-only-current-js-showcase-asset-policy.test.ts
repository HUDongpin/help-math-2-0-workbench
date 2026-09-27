import {public1751BuildRequested, public1751EnvironmentAllowed} from '../lib/current-js-1751-public-production';
import {controlledCurrentJsPreviewBuildRequested, controlledCurrentJsPreviewEnvironmentAllowed} from '../lib/controlled-current-js-preview';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  G3_L1_SHOWCASE_RELEASE_ID,
  G3_L3_SHOWCASE_RELEASE_ID,
  G3_L4_SHOWCASE_RELEASE_ID,
  G3_L2_SHOWCASE_RELEASE_ID,
  G3_L5_SHOWCASE_RELEASE_ID,
  G3_L6_SHOWCASE_RELEASE_ID,
  G3_L8_SHOWCASE_RELEASE_ID,
  G3_L9_SHOWCASE_RELEASE_ID,
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L1_SHOWCASE_RELEASE_ID,
  G4_L2_SHOWCASE_RELEASE_ID,
  G4_L4_SHOWCASE_RELEASE_ID,
  G4_L6_SHOWCASE_RELEASE_ID,
  G4_L7_SHOWCASE_RELEASE_ID,
  G4_L8_SHOWCASE_RELEASE_ID,
  G4_L9_SHOWCASE_RELEASE_ID,
  G4_L12_SHOWCASE_RELEASE_ID,
  G5_L1_SHOWCASE_RELEASE_ID,
  G5_L2_SHOWCASE_RELEASE_ID,
  G5_L6_SHOWCASE_RELEASE_ID,
  G5_L7_SHOWCASE_RELEASE_ID,
  G5_L8_SHOWCASE_RELEASE_ID,
  G5_L13_SHOWCASE_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
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
  // Each case declares its own course opt-ins. Production project flags must
  // not enable a different release while this fixture tests an opt-out.
  const isolated = {
    ...Object.fromEntries(Object.keys(process.env).filter((key) =>
      key.startsWith('CURRENT_JS_SHOWCASE_') || key.startsWith('CURRENT_JS_CANDIDATE_') ||
      key.startsWith('HELP_MATH_CURRENT_JS_CANDIDATE_') || key.startsWith('HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW') ||
      key.startsWith('HELP_MATH_1751_PUBLIC_PRODUCTION')
    ).map((key) => [key, undefined])),
    VERCEL_ENV: undefined,
    VERCEL_PROJECT_ID: undefined,
    VERCEL_URL: undefined,
    VERCEL_BRANCH_URL: undefined,
    ...values,
  };
  const original = Object.fromEntries(
    Object.keys(isolated).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(isolated)) {
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

interface ShowcaseScope {
  readonly directoryPrefix: string;
  readonly environmentKey: string;
  readonly expectedDirectories: number;
  readonly releaseId: string;
  readonly route: string;
  readonly storageRoot?: 'candidate' | 'public';
  readonly excludedDirectories?: readonly string[];
}

const scopes: readonly ShowcaseScope[] = Object.freeze([
  Object.freeze({
    directoryPrefix: 'course-g03-l01-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L1_ENABLED',
    expectedDirectories: 74,
    releaseId: G3_L1_SHOWCASE_RELEASE_ID,
    route: '/courses/3/1',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l03-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L3_ENABLED',
    expectedDirectories: 63,
    releaseId: G3_L3_SHOWCASE_RELEASE_ID,
    route: '/courses/3/3',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l04-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L4_ENABLED',
    expectedDirectories: 67,
    releaseId: G3_L4_SHOWCASE_RELEASE_ID,
    route: '/courses/3/4',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l05-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L5_ENABLED',
    expectedDirectories: 62,
    releaseId: G3_L5_SHOWCASE_RELEASE_ID,
    route: '/courses/3/5',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l06-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L6_ENABLED',
    expectedDirectories: 56,
    releaseId: G3_L6_SHOWCASE_RELEASE_ID,
    route: '/courses/3/6',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l08-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L8_ENABLED',
    expectedDirectories: 61,
    releaseId: G3_L8_SHOWCASE_RELEASE_ID,
    route: '/courses/3/8',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g03-l09-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G3_L9_ENABLED',
    expectedDirectories: 93,
    releaseId: G3_L9_SHOWCASE_RELEASE_ID,
    route: '/courses/3/9',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l01-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L1_ENABLED',
    expectedDirectories: 80,
    releaseId: G4_L1_SHOWCASE_RELEASE_ID,
    route: '/courses/4/1',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l02-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L2_ENABLED',
    expectedDirectories: 67,
    releaseId: G4_L2_SHOWCASE_RELEASE_ID,
    route: '/courses/4/2',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l04-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L4_ENABLED',
    expectedDirectories: 54,
    releaseId: G4_L4_SHOWCASE_RELEASE_ID,
    route: '/courses/4/4',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l06-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L6_ENABLED',
    expectedDirectories: 49,
    releaseId: G4_L6_SHOWCASE_RELEASE_ID,
    route: '/courses/4/6',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l07-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L7_ENABLED',
    expectedDirectories: 48,
    releaseId: G4_L7_SHOWCASE_RELEASE_ID,
    route: '/courses/4/7',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l08-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L8_ENABLED',
    expectedDirectories: 46,
    releaseId: G4_L8_SHOWCASE_RELEASE_ID,
    route: '/courses/4/8',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l09-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L9_ENABLED',
    expectedDirectories: 43,
    releaseId: G4_L9_SHOWCASE_RELEASE_ID,
    route: '/courses/4/9',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l12-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L12_ENABLED',
    expectedDirectories: 77,
    releaseId: G4_L12_SHOWCASE_RELEASE_ID,
    route: '/courses/4/12',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l01-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L1_ENABLED',
    expectedDirectories: 82,
    releaseId: G5_L1_SHOWCASE_RELEASE_ID,
    route: '/courses/5/1',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l02-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L2_ENABLED',
    expectedDirectories: 64,
    releaseId: G5_L2_SHOWCASE_RELEASE_ID,
    route: '/courses/5/2',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l06-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L6_ENABLED',
    expectedDirectories: 40,
    releaseId: G5_L6_SHOWCASE_RELEASE_ID,
    route: '/courses/5/6',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l07-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L7_ENABLED',
    expectedDirectories: 55,
    releaseId: G5_L7_SHOWCASE_RELEASE_ID,
    route: '/courses/5/7',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l08-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L8_ENABLED',
    expectedDirectories: 70,
    releaseId: G5_L8_SHOWCASE_RELEASE_ID,
    route: '/courses/5/8',
    storageRoot: 'candidate',
    excludedDirectories: Object.freeze(['course-g05-l08-fq-001']),
  }),
  Object.freeze({
    directoryPrefix: 'course-g05-l13-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G5_L13_ENABLED',
    expectedDirectories: 73,
    releaseId: G5_L13_SHOWCASE_RELEASE_ID,
    route: '/courses/5/13',
    storageRoot: 'candidate',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l05-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L5_ENABLED',
    expectedDirectories: 51,
    releaseId: G4_L5_PAGE_ONLY_RELEASE_ID,
    route: '/courses/4/5',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l10-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L10_ENABLED',
    expectedDirectories: 46,
    releaseId: G4_L10_PAGE_ONLY_RELEASE_ID,
    route: '/courses/4/10',
  }),
  Object.freeze({
    directoryPrefix: 'course-g04-l11-',
    environmentKey: 'CURRENT_JS_SHOWCASE_G4_L11_ENABLED',
    expectedDirectories: 42,
    releaseId: G4_L11_PAGE_ONLY_RELEASE_ID,
    route: '/courses/4/11',
  }),
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

test('page-only showcase policy binds exact registered runtime directories and the one source-identical reuse', async () => {
  const productionCourseAssetsRoot = path.join(
    webRoot,
    'public/flash-assets/courses',
  );
  const candidateCourseAssetsRoot = path.join(
    webRoot,
    ((controlledCurrentJsPreviewBuildRequested() && controlledCurrentJsPreviewEnvironmentAllowed()) ||
      (public1751BuildRequested() && public1751EnvironmentAllowed()))
      ? 'public/current-js-preview-assets/courses'
      : 'candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses',
  );
  const allPolicyDirectories = Object.values(
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE,
  ).flat();
  assert.equal(allPolicyDirectories.length, 1654);
  assert.equal(new Set(allPolicyDirectories).size, 1653);

  for (const scope of scopes) {
    const diskDirectories = (await readdir(
      scope.storageRoot === 'candidate'
        ? candidateCourseAssetsRoot
        : productionCourseAssetsRoot,
      {
      withFileTypes: true,
      },
    ))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const policyDirectories = [
      ...PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
        scope.releaseId
      ],
    ].sort();
    const prefixDirectories = policyDirectories.filter((directory) =>
      directory.startsWith(scope.directoryPrefix)
    );
    assert.equal(prefixDirectories.length, scope.expectedDirectories);
    assert.deepEqual(
      prefixDirectories,
      diskDirectories
        .filter((directory) => directory.startsWith(scope.directoryPrefix))
        .filter((directory) =>
          !(scope.excludedDirectories ?? []).includes(directory)
        )
        .sort(),
      scope.releaseId,
    );
  }
  assert.ok(
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      G5_L8_SHOWCASE_RELEASE_ID
    ].includes('course-g05-l05-fq-001'),
  );
  assert.equal(
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      G5_L8_SHOWCASE_RELEASE_ID
    ].includes('course-g05-l08-fq-001'),
    false,
  );
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
  assert.equal(isPageOnlyCurrentJsShowcaseAssetPath(
    '/flash-assets/courses/course-g04-l05-fq-001/manifest.json',
  ), false);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetPath(
    '/flash-assets/courses/course-g04-l05-fq-001/adapter-spec.json',
  ), false);
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
  const candidate = [
    'courses',
    'course-g04-l05-fq-001',
    'canvas-renderer.js',
  ];
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(candidate, {
    NODE_ENV: 'production',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
  }), true);
  assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(candidate, {
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
  }), true);
});

test('production proxy admits each public page-only course and its exact asset closure only when opted in', async () => {
  for (const scope of scopes) {
    if (scope.storageRoot === 'candidate') continue;
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
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
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

test('candidate G3 L5 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L5_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L5_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L5_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L1 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L1_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L1_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L1_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L3 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L3_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L3_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L3_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L4 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L4_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L4_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L4_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L6 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L6_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L6_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L6_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L8 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L8_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L8_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L8_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G3 L9 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G3_L9_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L9_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L9_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L1 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L1_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L1_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L1_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L2 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L2_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L2_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L2_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L4 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L4_SHOWCASE_RELEASE_ID)!;
  const firstDirectory =
    PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
      scope.releaseId
    ][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L4_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', firstDirectory, 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L4_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(
      `http://localhost:3000${scope.route}`,
    ))).status, 200);
    const asset = await proxyForRequest(new NextRequest(
      'http://localhost:3000/flash-assets/courses/'
        + `${firstDirectory}/canvas-renderer.js`,
    ));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L6 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L6_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L6_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L6_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L7 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L7_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L7_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L7_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L8 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L8_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L8_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L8_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L9 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L9_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L9_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L9_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G4 L12 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G4_L12_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L12_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L12_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G5 L1 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L1_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L1_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L1_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G5 L2 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L2_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L2_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L2_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G5 L6 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L6_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L6_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L6_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G5 L7 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L7_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L7_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L7_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    const asset = await proxyForRequest(new NextRequest('http://localhost:3000/flash-assets/courses/' + `${firstDirectory}/canvas-renderer.js`));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('x-middleware-next'), '1');
  });
});

test('candidate G5 L8 route authorizes its exact source-identical canonical renderer reuse', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L8_SHOWCASE_RELEASE_ID)!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L8_ENABLED: undefined,
  }, async () => {
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', 'course-g05-l05-fq-001', 'canvas-renderer.js',
    ]), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L8_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
      'courses', 'course-g05-l05-fq-001', 'canvas-renderer.js',
    ]), true);
  });
});

test('candidate G5 L13 route requires candidate profile and its exact opt-in in development', async () => {
  const scope = scopes.find(({releaseId}) => releaseId === G5_L13_SHOWCASE_RELEASE_ID)!;
  const firstDirectory = PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[scope.releaseId][0]!;
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L13_ENABLED: undefined,
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), false);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L13_ENABLED: 'true',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(`http://localhost:3000${scope.route}`))).status, 200);
    assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized(['courses', firstDirectory, 'canvas-renderer.js']), true);
  });
});

test('the G4 routes stay production-bound outside production too', async () => {
  for (const scope of scopes.filter(({directoryPrefix}) =>
    directoryPrefix.startsWith('course-g04-')
  )) {
    const firstDirectory =
      PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE[
        scope.releaseId
      ][0]!;
    await withEnvironment({
      NODE_ENV: 'development',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      [scope.environmentKey]: 'true',
    }, async () => {
      assert.equal((await proxyForRequest(new NextRequest(
        `http://localhost:3000${scope.route}`,
      ))).status, 200);
      assert.equal((await proxyForRequest(new NextRequest(
        'http://localhost:3000/flash-assets/courses/'
          + `${firstDirectory}/canvas-renderer.js`,
      ))).status, 200);
      assert.equal(isPageOnlyCurrentJsShowcaseAssetAuthorized([
        'courses',
        firstDirectory,
        'canvas-renderer.js',
      ]), true);
    });
  }
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
