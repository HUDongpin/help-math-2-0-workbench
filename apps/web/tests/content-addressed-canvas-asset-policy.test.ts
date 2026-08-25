import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  CONTENT_ADDRESSED_CANVAS_PREFIX,
  CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE,
  CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS,
  CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256,
  CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID,
  CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID,
  G4_L3_IR001_LOADED_HOST_ANIMATION_ID,
  G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH,
  currentJsProductionAssetChecksumRows,
  findExactContentAddressedCanvasProfileEntry,
  parseContentAddressedCanvasAssetSegments,
  parseCurrentJsProductionAssetsV2,
  type CurrentJsProductionAssetCountsV2,
  type CurrentJsProductionAssetEntryV2,
  type CurrentJsProductionAssetsV2,
} from '../lib/content-addressed-canvas-asset-policy';
import {
  ACTIVE_CURRENT_JS_PRODUCTION_ASSETS_V2_RELATIVE_PATH,
  loadActiveCurrentJsProductionAssetsV2,
  readContentAddressedCanvasAsset,
} from '../lib/content-addressed-canvas-asset-profile.server';
import {
  G4_L3_HOST_COMPOSITE_SHA256,
} from '../lib/g4-l3-host-composite-asset-policy';
import {G5_L4_PREVIEW_RUNTIME_SHA256} from '../lib/g5-l4-preview-asset-policy';
import {proxyForRequest} from '../proxy';

const runtimeBytes = Buffer.from('content-addressed-canvas-runtime-v2');
const runtimeSha256 = createHash('sha256').update(runtimeBytes).digest('hex');
const animationId = 'course-g03-l02-fq-001';
const loadedHostBytes = Buffer.from('ir001-loaded-host-canvas-runtime-v2');
const loadedHostSha256 = createHash('sha256')
  .update(loadedHostBytes)
  .digest('hex');

function profileChecksum(
  entries: readonly CurrentJsProductionAssetEntryV2[],
): string {
  return createHash('sha256')
    .update(currentJsProductionAssetChecksumRows(entries).join('\n'))
    .digest('hex');
}

function buildProfileDocument({
  entries = [{
    assetPath: `courses/${animationId}/canvas-renderer.js`,
    relativePath: `${animationId}/canvas-renderer.js`,
    storageRoot: 'public',
    releaseId: CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS[0],
    bytes: runtimeBytes.length,
    sha256: runtimeSha256,
  }],
  overrides = {},
}: {
  entries?: CurrentJsProductionAssetEntryV2[];
  overrides?: Record<string, unknown>;
} = {}) {
  const counts = Object.freeze({
    public: entries.filter((entry) => entry.storageRoot === 'public').length,
    serverAudio: entries.filter(
      (entry) => entry.storageRoot === 'server-audio',
    ).length,
    total: entries.length,
  } satisfies CurrentJsProductionAssetCountsV2);
  return {
    counts,
    document: {
      schemaVersion: 2,
      profileId: CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID,
      parentProfileId: CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID,
      parentChecksumSetSha256:
        CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256,
      generatedBy: 'fixture-content-addressed-profile-generator',
      approvalScope: CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE,
      approvedReleaseIds: [
        ...CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS,
      ],
      counts,
      checksumSetSha256: profileChecksum(entries),
      entries,
      ...overrides,
    },
  };
}

function parseFixtureProfile({
  entries,
  overrides,
}: {
  entries?: CurrentJsProductionAssetEntryV2[];
  overrides?: Record<string, unknown>;
} = {}): CurrentJsProductionAssetsV2 {
  const fixture = buildProfileDocument({entries, overrides});
  const profile = parseCurrentJsProductionAssetsV2(fixture.document, {
    expectedCounts: fixture.counts,
  });
  assert.ok(profile);
  return profile;
}

function requestFor(
  sha256 = runtimeSha256,
  id = animationId,
) {
  const parsed = parseContentAddressedCanvasAssetSegments([
    CONTENT_ADDRESSED_CANVAS_PREFIX,
    sha256,
    'courses',
    id,
    'canvas-renderer.js',
  ]);
  assert.ok(parsed);
  return parsed;
}

function loadedHostRequestFor(sha256 = loadedHostSha256) {
  const parsed = parseContentAddressedCanvasAssetSegments([
    CONTENT_ADDRESSED_CANVAS_PREFIX,
    sha256,
    ...G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH.split('/'),
  ]);
  assert.ok(parsed);
  assert.equal(parsed.kind, 'ir001-loaded-host');
  return parsed;
}

async function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
) {
  const before = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await callback();
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('content-addressed parser accepts only page renderers and the exact IR001 loaded host', () => {
  assert.deepEqual(requestFor(), {
    kind: 'page-renderer',
    sha256: runtimeSha256,
    animationId,
    assetPath: `courses/${animationId}/canvas-renderer.js`,
    logicalSegments: ['courses', animationId, 'canvas-renderer.js'],
  });
  assert.deepEqual(loadedHostRequestFor(), {
    kind: 'ir001-loaded-host',
    sha256: loadedHostSha256,
    animationId: G4_L3_IR001_LOADED_HOST_ANIMATION_ID,
    assetPath: G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH,
    logicalSegments: G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH.split('/'),
  });

  for (const rejected of [
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256.toUpperCase(), 'courses', animationId, 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256.slice(1), 'courses', animationId, 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'candidate-assets', animationId, 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', animationId, 'source.fla'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', animationId, 'source.swf'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', animationId, 'private', 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', '..', 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g03-l02-index-local', 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g04-l03-index-local', 'canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g04-l03-index-local', 'host-composite-assets', 'course-g04-l03-ir-002-loaded-swf-canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g05-l04-index-local', 'host-composite-assets', 'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g04-l03-index-local', 'host-composite-assets', 'lesson-shell-mc-back-text.svg'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g04-l03-index-local', 'host-composite-assets', 'course-g04-l03-ir-001-loaded-swf.swf'],
    [CONTENT_ADDRESSED_CANVAS_PREFIX, runtimeSha256, 'courses', 'shell-course-g04-l03-index-local', 'host-composite-assets', 'private', 'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js'],
  ]) {
    assert.equal(parseContentAddressedCanvasAssetSegments(rejected), null);
  }
});

test('IR001 loaded host entry is closed by exact public profile path, bytes, and digest', async (t) => {
  const entry: CurrentJsProductionAssetEntryV2 = {
    assetPath: G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH,
    relativePath: G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH.slice(
      'courses/'.length,
    ),
    storageRoot: 'public',
    releaseId: CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS[1],
    bytes: loadedHostBytes.length,
    sha256: loadedHostSha256,
  };
  const profile = parseFixtureProfile({entries: [entry]});
  assert.equal(
    findExactContentAddressedCanvasProfileEntry(
      loadedHostRequestFor(),
      profile,
    ),
    profile.entries[0],
  );
  assert.equal(
    findExactContentAddressedCanvasProfileEntry(
      loadedHostRequestFor('0'.repeat(64)),
      profile,
    ),
    null,
  );

  const workspaceRoot = await mkdtemp(
    path.join(tmpdir(), 'helpmath-content-loaded-host-'),
  );
  t.after(() => rm(workspaceRoot, {recursive: true, force: true}));
  const runtimePath = path.join(
    workspaceRoot,
    'apps/web/public/flash-assets/courses',
    entry.relativePath,
  );
  await mkdir(path.dirname(runtimePath), {recursive: true});
  await writeFile(runtimePath, loadedHostBytes);
  const resolved = await readContentAddressedCanvasAsset({
    workspaceRoot,
    request: loadedHostRequestFor(),
    profile,
  });
  assert.ok(resolved);
  assert.deepEqual(resolved.bytes, loadedHostBytes);

  const serverAudioProfile = parseFixtureProfile({
    entries: [{...entry, storageRoot: 'server-audio'}],
  });
  assert.equal(
    await readContentAddressedCanvasAsset({
      workspaceRoot,
      request: loadedHostRequestFor(),
      profile: serverAudioProfile,
    }),
    null,
  );
});

test('v2 profile parser fixes parent lineage, five releases, counts, and entry shape', () => {
  const fixture = buildProfileDocument();
  const profile = parseCurrentJsProductionAssetsV2(fixture.document, {
    expectedCounts: fixture.counts,
  });
  assert.ok(profile);
  assert.equal(profile.profileId, 'current-js-production-assets-v2');
  assert.equal(profile.parentProfileId, 'current-js-production-assets-v1');
  assert.equal(
    profile.parentChecksumSetSha256,
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  );
  assert.deepEqual(
    profile.approvedReleaseIds,
    CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS,
  );

  for (const invalid of [
    buildProfileDocument({overrides: {schemaVersion: 1}}).document,
    buildProfileDocument({overrides: {profileId: 'candidate-assets-v2'}}).document,
    buildProfileDocument({overrides: {parentProfileId: 'wrong-parent'}}).document,
    buildProfileDocument({overrides: {parentChecksumSetSha256: '0'.repeat(64)}}).document,
    buildProfileDocument({overrides: {approvedReleaseIds: []}}).document,
    {...fixture.document, unexpected: true},
    buildProfileDocument({
      entries: [{...fixture.document.entries[0], assetPath: 'private/runtime.js'}],
    }).document,
  ]) {
    assert.equal(
      parseCurrentJsProductionAssetsV2(invalid, {
        expectedCounts: fixture.counts,
      }),
      null,
    );
  }
});

test('entry policy binds digest, exact logical path, public root, bytes, and suffix', () => {
  const profile = parseFixtureProfile();
  assert.equal(
    findExactContentAddressedCanvasProfileEntry(requestFor(), profile),
    profile.entries[0],
  );
  assert.equal(
    findExactContentAddressedCanvasProfileEntry(
      requestFor('0'.repeat(64)),
      profile,
    ),
    null,
  );

  const serverAudioEntry: CurrentJsProductionAssetEntryV2 = {
    ...profile.entries[0]!,
    storageRoot: 'server-audio',
  };
  const serverAudioProfile = parseFixtureProfile({
    entries: [serverAudioEntry],
  });
  assert.equal(
    findExactContentAddressedCanvasProfileEntry(
      requestFor(),
      serverAudioProfile,
    ),
    null,
  );
});

test('runtime loader fails closed when v2 is absent or invalid and verifies checksum set', async (t) => {
  const workspaceRoot = await mkdtemp(
    path.join(tmpdir(), 'helpmath-content-profile-'),
  );
  t.after(() => rm(workspaceRoot, {recursive: true, force: true}));

  assert.equal(
    await loadActiveCurrentJsProductionAssetsV2({workspaceRoot}),
    null,
  );

  const profilePath = path.join(
    workspaceRoot,
    ACTIVE_CURRENT_JS_PRODUCTION_ASSETS_V2_RELATIVE_PATH,
  );
  await mkdir(path.dirname(profilePath), {recursive: true});
  await writeFile(profilePath, '{"schemaVersion":1}\n');
  assert.equal(
    await loadActiveCurrentJsProductionAssetsV2({workspaceRoot}),
    null,
  );

  const fixture = buildProfileDocument();
  await writeFile(profilePath, `${JSON.stringify(fixture.document)}\n`);
  const loaded = await loadActiveCurrentJsProductionAssetsV2({
    workspaceRoot,
    expectedCounts: fixture.counts,
  });
  assert.ok(loaded);
  assert.equal(loaded.checksumSetSha256, fixture.document.checksumSetSha256);

  await writeFile(profilePath, `${JSON.stringify({
    ...fixture.document,
    checksumSetSha256: '0'.repeat(64),
  })}\n`);
  assert.equal(
    await loadActiveCurrentJsProductionAssetsV2({
      workspaceRoot,
      expectedCounts: fixture.counts,
    }),
    null,
  );
});

test('asset reader rehashes exact public bytes and rejects digest, size, or byte drift', async (t) => {
  const workspaceRoot = await mkdtemp(
    path.join(tmpdir(), 'helpmath-content-runtime-'),
  );
  t.after(() => rm(workspaceRoot, {recursive: true, force: true}));
  const runtimePath = path.join(
    workspaceRoot,
    'apps/web/public/flash-assets/courses',
    animationId,
    'canvas-renderer.js',
  );
  await mkdir(path.dirname(runtimePath), {recursive: true});
  await writeFile(runtimePath, runtimeBytes);

  const profile = parseFixtureProfile();
  const exact = await readContentAddressedCanvasAsset({
    workspaceRoot,
    request: requestFor(),
    profile,
  });
  assert.ok(exact);
  assert.deepEqual(exact.bytes, runtimeBytes);
  assert.equal(exact.sha256, runtimeSha256);

  assert.equal(
    await readContentAddressedCanvasAsset({
      workspaceRoot,
      request: requestFor('0'.repeat(64)),
      profile,
    }),
    null,
  );

  await writeFile(runtimePath, Buffer.alloc(runtimeBytes.length, 0x78));
  assert.equal(
    await readContentAddressedCanvasAsset({
      workspaceRoot,
      request: requestFor(),
      profile,
    }),
    null,
  );

  await writeFile(runtimePath, runtimeBytes);
  const wrongSizeProfile = parseFixtureProfile({
    entries: [{...profile.entries[0]!, bytes: runtimeBytes.length + 1}],
  });
  assert.equal(
    await readContentAddressedCanvasAsset({
      workspaceRoot,
      request: requestFor(),
      profile: wrongSizeProfile,
    }),
    null,
  );
});

test('proxy authorizes content URLs from logical segments without query-only digest gates', async () => {
  const g5AnimationId = 'course-g05-l04-vb-002';
  const g5Digest = G5_L4_PREVIEW_RUNTIME_SHA256[g5AnimationId]!;
  const contentUrl = 'https://www.helpmath.ai/flash-assets/'
    + `${CONTENT_ADDRESSED_CANVAS_PREFIX}/${g5Digest}/courses/`
    + `${g5AnimationId}/canvas-renderer.js`;
  const legacyBase = 'https://www.helpmath.ai/flash-assets/courses/'
    + `${g5AnimationId}/canvas-renderer.js`;

  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
  }, async () => {
    assert.equal(
      (await proxyForRequest(new NextRequest(contentUrl))).status,
      200,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(legacyBase))).status,
      404,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        `${legacyBase}?sha256=${g5Digest}`,
      ))).status,
      200,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        contentUrl.replace('canvas-renderer.js', 'source.fla'),
      ))).status,
      404,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        contentUrl.replace(
          `/courses/${g5AnimationId}/`,
          '/candidate-assets/course-g05-l04-vb-002/',
        ),
      ))).status,
      404,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        contentUrl.replace(g5AnimationId, 'course-g05-l04-in-999'),
      ))).status,
      404,
    );
  });
});

test('IR001 content URL uses the G4 L3 publication gate while profile policy owns its digest', async () => {
  const legacyDigest = G4_L3_HOST_COMPOSITE_SHA256[
    G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH
  ];
  assert.notEqual(loadedHostSha256, legacyDigest);
  const contentUrl = 'https://www.helpmath.ai/flash-assets/'
    + `${CONTENT_ADDRESSED_CANVAS_PREFIX}/${loadedHostSha256}/`
    + G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH;
  const legacyUrl = 'https://www.helpmath.ai/flash-assets/'
    + G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH;

  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: undefined,
  }, async () => {
    assert.equal(
      (await proxyForRequest(new NextRequest(contentUrl))).status,
      404,
    );
  });

  await withEnvironment({
    NODE_ENV: 'production',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }, async () => {
    assert.equal(
      (await proxyForRequest(new NextRequest(contentUrl))).status,
      200,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        contentUrl.replace(loadedHostSha256, '0'.repeat(64)),
      ))).status,
      200,
      'proxy checks publication; the route/profile rejects an unlisted digest',
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(legacyUrl))).status,
      404,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        `${legacyUrl}?sha256=${legacyDigest}`,
      ))).status,
      200,
    );
    assert.equal(
      (await proxyForRequest(new NextRequest(
        `${legacyUrl}?sha256=${loadedHostSha256}`,
      ))).status,
      404,
      'legacy query URL remains pinned to its historical digest',
    );
    for (const rejectedUrl of [
      contentUrl.replace(
        'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
        'course-g04-l03-ir-002-loaded-swf-canvas-renderer.js',
      ),
      contentUrl.replace(
        'shell-course-g04-l03-index-local',
        'shell-course-g05-l04-index-local',
      ),
      contentUrl.replace(
        '/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
        '/canvas-renderer.js',
      ),
      contentUrl.replace(
        'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
        'course-g04-l03-ir-001-loaded-swf.swf',
      ),
    ]) {
      assert.equal(
        (await proxyForRequest(new NextRequest(rejectedUrl))).status,
        404,
      );
    }
  });
});

test('route uses runtime profile loading, exact-byte reading, and immutable content caching', async () => {
  const source = await readFile(
    new URL('../app/flash-assets/[...asset]/route.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /parseContentAddressedCanvasAssetSegments\(asset\)/u);
  assert.match(source, /new URL\(request\.url\)\.search !== ''/u);
  assert.match(source, /loadActiveCurrentJsProductionAssetsV2/u);
  assert.match(source, /readContentAddressedCanvasAsset/u);
  assert.match(
    source,
    /contentAddressedCanvas\.kind === 'ir001-loaded-host'[\s\S]*?isG4L3ShowcaseAssetAuthorized/u,
  );
  const contentBranchStart = source.indexOf(
    'if (isContentAddressedCanvasAssetBranch(asset))',
  );
  const profileLookup = source.indexOf(
    'const profile = await activeCurrentJsProductionAssetsV2()',
    contentBranchStart,
  );
  assert.ok(contentBranchStart >= 0 && profileLookup > contentBranchStart);
  assert.doesNotMatch(
    source.slice(contentBranchStart, profileLookup),
    /expectedSha256|classifyG4L3HostCompositeAsset/u,
    'the IR001 content branch must not inherit the legacy digest pin',
  );
  assert.match(
    source,
    /!contentAddressedCanvas[\s\S]*?hasExactG4L3HostCompositeDigest|g4HostCompositePolicy\.controlled[\s\S]*?hasExactG4L3HostCompositeDigest/u,
  );
  assert.match(source, /public, max-age=31536000, immutable/u);
  assert.doesNotMatch(
    source,
    /current-js-production-assets\.v2\.json['"]\s*(?:with|assert)\s*\{/u,
  );
});
