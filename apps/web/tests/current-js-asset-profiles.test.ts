import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import candidateProfile from '../config/current-js-candidate-assets.v1.json';
import productionProfile from '../config/current-js-production-assets.v1.json';
import {
  currentJsAssetRecordsForSegments,
  currentJsCandidateAssetRecords,
  currentJsCandidateProfileEnabled,
  currentJsProductionAssetRecords,
  isCurrentJsProductionReleaseApproved,
  selectedCurrentJsAssetRecordForSegments,
} from '../lib/current-js-asset-profile';
import {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
  G5_L5_SHOWCASE_RELEASE_ID,
} from '../lib/current-js-showcase-publication';

const webRoot = path.resolve(import.meta.dirname, '..');
const projectRoot = path.resolve(webRoot, '../..');
const candidateRoot = path.join(
  webRoot,
  'candidate-assets/flash-assets',
  candidateProfile.version,
);
const requiredVercelBuildInputs = Object.freeze([
  'apps/web/tests/private-preview-deployment-assets.test.ts',
  'apps/web/tests/current-js-showcase-publication.test.ts',
  'scripts/manage-current-js-asset-profiles.mjs',
  'scripts/current-js-candidate-paths.mjs',
]);

const digest = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const child = path.join(directory, entry.name);
    const metadata = await lstat(child);
    assert.equal(metadata.isSymbolicLink(), false, child);
    if (metadata.isDirectory()) files.push(...await walk(child));
    else {
      assert.equal(metadata.isFile(), true, child);
      files.push(child);
    }
  }
  return files;
}

test('production profile is the exact 929 + 185 deployable byte closure', async () => {
  assert.deepEqual(productionProfile.counts, {
    public: 929,
    serverAudio: 185,
    total: 1114,
  });
  assert.equal(
    productionProfile.checksumSetSha256,
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  );
  assert.equal(currentJsProductionAssetRecords().length, 1114);

  const rootByStorage = {
    public: path.join(webRoot, 'public/flash-assets'),
    'server-audio': path.join(webRoot, 'server-assets/flash-assets'),
  } as const;
  for (const entry of productionProfile.entries) {
    const root = rootByStorage[entry.storageRoot as keyof typeof rootByStorage];
    assert(root, entry.assetPath);
    const bytes = await readFile(path.join(root, entry.assetPath));
    assert.equal(bytes.length, entry.bytes, entry.assetPath);
    assert.equal(digest(bytes), entry.sha256, entry.assetPath);
  }

  for (const [storageRoot, root] of Object.entries(rootByStorage)) {
    const disk = (await walk(path.join(root, 'courses')))
      .map((file) => `courses/${path.relative(
        path.join(root, 'courses'),
        file,
      ).split(path.sep).join('/')}`)
      .sort();
    const declared = productionProfile.entries
      .filter((entry) => entry.storageRoot === storageRoot)
      .map((entry) => entry.assetPath)
      .sort();
    assert.deepEqual(disk, declared, storageRoot);
  }
});

test('candidate profile holds 236 runtime files and 204 separately frozen evidence files', async () => {
  assert.deepEqual(candidateProfile.counts, {runtime: 236, evidence: 204});
  assert.deepEqual(candidateProfile.authority, {
    productionApproved: false,
    releaseEligible: false,
    published: false,
  });
  assert.equal(currentJsCandidateAssetRecords().length, 236);
  const disk = (await walk(path.join(candidateRoot, 'courses')))
    .map((file) => `courses/${path.relative(
      path.join(candidateRoot, 'courses'),
      file,
    ).split(path.sep).join('/')}`)
    .sort();
  assert.deepEqual(
    disk,
    candidateProfile.entries.map(({assetPath}) => assetPath).sort(),
  );
  for (const entry of candidateProfile.entries) {
    const bytes = await readFile(path.join(candidateRoot, entry.assetPath));
    assert.equal(bytes.length, entry.bytes, entry.assetPath);
    assert.equal(digest(bytes), entry.sha256, entry.assetPath);
    assert.notEqual(path.extname(entry.assetPath), '.json', entry.assetPath);
  }
  const occurrence32 = candidateProfile.entries.filter(
    ({releaseId}) =>
      releaseId === 'private-g4-l9-p5-f08-occurrence-32-stress-v1',
  );
  assert.deepEqual(occurrence32.map(({assetPath, bytes, sha256}) => ({
    assetPath,
    bytes,
    sha256,
  })), [
    {
      assetPath:
        'courses/course-g04-l09-ti-007/audio/source-narration-undetermined.mp3',
      bytes: 303072,
      sha256:
        '2f5e5d447f2659acec7a67ce8cc4ced1875ce99f5a9385227b1ec4ee0fab4d8c',
    },
    {
      assetPath: 'courses/course-g04-l09-ti-007/canvas-renderer.js',
      bytes: 2047,
      sha256:
        'b67b554435b58bf300af896ac2be92c930349ad2610a0d8188f131a2f2dac6b2',
    },
  ]);
  const occurrence29 = candidateProfile.entries.filter(
    ({releaseId}) =>
      releaseId === 'private-g4-l9-p5-1-occurrence-29-bounded-v1',
  );
  assert.deepEqual(occurrence29.map(({assetPath, bytes, sha256}) => ({
    assetPath,
    bytes,
    sha256,
  })), [
    {
      assetPath:
        'courses/course-g04-l09-ti-004/audio/source-narration-undetermined.mp3',
      bytes: 135744,
      sha256:
        '52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810',
    },
    {
      assetPath: 'courses/course-g04-l09-ti-004/canvas-renderer.js',
      bytes: 2320,
      sha256:
        '768e13522e4c29b621686f22e2c6f9c2e017ff2b314d650d353e6c84272415e6',
    },
  ]);

  const relocation = JSON.parse(await readFile(path.join(
    projectRoot,
    'reports/current-js-candidate-evidence-relocation-applied-2026-08-22.json',
  ), 'utf8')) as {
    entries: Array<{
      evidenceVersion: string;
      destination: string;
      bytes: number;
      sha256: string;
    }>;
  };
  const evidence = relocation.entries.filter(({evidenceVersion}) =>
    evidenceVersion === 'v1'
  );
  assert.equal(evidence.length, 204);
  for (const row of evidence) {
    const bytes = await readFile(path.join(projectRoot, row.destination));
    assert.equal(bytes.length, row.bytes, row.destination);
    assert.equal(digest(bytes), row.sha256, row.destination);
  }
});

test('Vercel deployment retains only the production asset verification closure', async () => {
  const lines = (await readFile(path.join(projectRoot, '.vercelignore'), 'utf8'))
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  assert(lines.includes('scripts/*'), 'scripts must remain excluded by default');
  assert(lines.includes('apps/web/tests/*'), 'tests must remain excluded by default');
  assert(
    lines.includes('apps/web/candidate-assets/'),
    'candidate assets must remain excluded from deployment',
  );
  for (const relativePath of requiredVercelBuildInputs) {
    assert(
      lines.includes(`!${relativePath}`),
      `${relativePath} must be present in the Vercel build upload`,
    );
    await readFile(path.join(projectRoot, relativePath));
  }
  assert.equal(
    lines.some((line) => line.startsWith('!apps/web/candidate-assets/')),
    false,
    'the build exception must not expose private candidate assets',
  );

  const packageJson = JSON.parse(await readFile(
    path.join(webRoot, 'package.json'),
    'utf8',
  )) as {scripts?: Record<string, string>};
  assert.equal(
    packageJson.scripts?.build,
    'npm run verify:asset-profiles:deployment && next build --webpack',
  );
  assert.equal(
    packageJson.scripts?.['verify:asset-profiles:deployment'],
    'node ../../scripts/manage-current-js-asset-profiles.mjs --check-production && npm run test:asset-profile:deployment',
  );
  assert.equal(
    packageJson.scripts?.['verify:asset-profiles'],
    'node ../../scripts/manage-current-js-asset-profiles.mjs --check && npm run test:asset-profile:production',
  );
});

test('profile selection cannot turn candidate files into production with flags alone', () => {
  const g4Asset = [
    'courses',
    'course-g04-l05-fq-001',
    'canvas-renderer.js',
  ];
  const g4Records = currentJsAssetRecordsForSegments(g4Asset);
  assert.equal(g4Records.production, undefined);
  assert.equal(g4Records.candidate?.releaseId, G4_L5_PAGE_ONLY_RELEASE_ID);
  assert.equal(selectedCurrentJsAssetRecordForSegments(g4Asset, {
    NODE_ENV: 'production',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
  }), undefined);
  assert.equal(selectedCurrentJsAssetRecordForSegments(g4Asset, {
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
  })?.profile, 'candidate');

  const overlappingG5Asset = [
    'courses',
    'course-g05-l05-fq-003',
    'canvas-renderer.js',
  ];
  const g5Records = currentJsAssetRecordsForSegments(overlappingG5Asset);
  assert.equal(
    g5Records.production?.sha256,
    'bd74dd381305a31c145b9adb2f16525af2652d5d8fef2c064cc8dbf17c1b4fc4',
  );
  assert.equal(
    g5Records.candidate?.sha256,
    '78da700b7cbf20390cdb4b9b7e2aa36c300bb6a456c21c0909c271eefb0d33aa',
  );
  assert.equal(selectedCurrentJsAssetRecordForSegments(
    overlappingG5Asset,
    {NODE_ENV: 'production', CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true'},
  )?.profile, 'production');
  assert.equal(selectedCurrentJsAssetRecordForSegments(
    overlappingG5Asset,
    {NODE_ENV: 'development', CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true'},
  )?.profile, 'candidate');

  assert.equal(currentJsCandidateProfileEnabled({NODE_ENV: 'production',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true'}), false);
  assert.equal(currentJsCandidateProfileEnabled({NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true'}), true);
  assert.equal(isCurrentJsProductionReleaseApproved(
    G5_L5_SHOWCASE_RELEASE_ID,
  ), true);
  for (const releaseId of [
    G4_L5_PAGE_ONLY_RELEASE_ID,
    G4_L10_PAGE_ONLY_RELEASE_ID,
    G4_L11_PAGE_ONLY_RELEASE_ID,
  ]) assert.equal(isCurrentJsProductionReleaseApproved(releaseId), false);
});
