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
  'scripts/manage-current-js-asset-profiles.mjs',
  'scripts/current-js-candidate-paths.mjs',
  'apps/web/tests/private-preview-deployment-assets.test.ts',
  'apps/web/tests/current-js-showcase-publication.test.ts',
  'apps/web/tests/page-only-current-js-showcase-asset-policy.test.ts',
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

test('production profile is the exact 1135 + 185 eight-lesson byte closure', async () => {
  assert.deepEqual(productionProfile.counts, {
    public: 1135,
    serverAudio: 185,
    total: 1320,
  });
  assert.equal(
    productionProfile.checksumSetSha256,
    '54e11e77a8d684fcf9542ba7458c12add3edb1a85c16ac99db756a34ed5c6ad4',
  );
  assert.equal(currentJsProductionAssetRecords().length, 1320);

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

test('candidate profile holds 3 alternate runtime files and 204 frozen evidence files', async () => {
  assert.deepEqual(candidateProfile.counts, {runtime: 3, evidence: 204});
  assert.deepEqual(candidateProfile.authority, {
    productionApproved: false,
    releaseEligible: false,
    published: false,
  });
  assert.equal(currentJsCandidateAssetRecords().length, 3);
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

test('Vercel upload retains the exact source closure required by the asset-profile build check', async () => {
  const lines = (await readFile(path.join(projectRoot, '.vercelignore'), 'utf8'))
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  assert(lines.includes('reports/*'), 'reports must remain excluded by default');
  assert(lines.includes('scripts/*'), 'scripts must remain excluded by default');
  assert(lines.includes('apps/web/tests/*'), 'tests must remain excluded by default');
  assert(
    lines.includes('apps/web/candidate-assets/'),
    'candidate assets must remain excluded by default',
  );
  for (const relativePath of requiredVercelBuildInputs) {
    assert(
      lines.includes(`!${relativePath}`),
      `${relativePath} must be present in the Vercel build upload`,
    );
    await readFile(path.join(projectRoot, relativePath));
  }
  assert.equal(
    lines.includes('!reports/*'),
    false,
    'the build exception must not expose every report',
  );
  assert.equal(
    lines.includes('!scripts/*') || lines.includes('!apps/web/tests/*'),
    false,
    'the build exception must not expose every script or test',
  );
  assert.equal(
    lines.some((line) => line.startsWith('!apps/web/candidate-assets/')),
    false,
    'the build exception must not expose every candidate asset',
  );
});

test('deployment verification excludes private candidates without weakening the full gate', async () => {
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
  assert.match(
    packageJson.scripts?.['test:asset-profile:production'] ?? '',
    /tests\/current-js-asset-profiles\.test\.ts/u,
  );
});

test('G4 page-only runtime is production-bound while alternate G5 bytes stay candidate-only', () => {
  const g4Asset = [
    'courses',
    'course-g04-l05-fq-001',
    'canvas-renderer.js',
  ];
  const g4Records = currentJsAssetRecordsForSegments(g4Asset);
  assert.equal(g4Records.candidate, undefined);
  assert.equal(g4Records.production?.releaseId, G4_L5_PAGE_ONLY_RELEASE_ID);
  assert.equal(g4Records.production?.sha256,
    '9601aaec0115cd9b16498ca1d0f36b172d0d6b663ffffa48b42ac54bc7b30358');
  assert.equal(selectedCurrentJsAssetRecordForSegments(g4Asset, {
    NODE_ENV: 'production',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
  })?.profile, 'production');
  assert.equal(selectedCurrentJsAssetRecordForSegments(g4Asset, {
    NODE_ENV: 'development',
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
  })?.profile, 'production');

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
  ]) assert.equal(isCurrentJsProductionReleaseApproved(releaseId), true);
});
