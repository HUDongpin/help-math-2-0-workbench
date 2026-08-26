import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  ACCEPTANCE_EFFECTS,
  ACTIVE_PAGE_COUNT,
  ARCHIVE_SHA256,
  commitImmutableEvidence,
  expectedPageIdsFromManifest,
  isExpectedRscAbort,
  KNOWN_LIMITATIONS,
  KNOWN_REMEDIATIONS_REQUIRED,
  LAYOUT_OBSERVATION_COUNT,
  LOCALES,
  OBSERVED_POST_V6_SOURCE_SNAPSHOT,
  PACKAGE_ID,
  PACKAGE_MANIFEST_SHA256,
  PACKAGE_SOURCE_SNAPSHOT,
  parseArguments,
  prepareOutputPlan,
  REDUCED_MOTION_OBSERVATION_COUNT,
  REDUCED_MOTION_SAMPLE_COUNT,
  REPLAY_ACTIVATION_COUNT,
  SESSION_STORAGE_KEY,
  sourceObservation,
  validateReportBoundary,
  VIEWPORTS,
  WESTWORLD_TEMP_ROOT,
} from './qa-g5-l4-v6-deep-product.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const RUNNER_PATH = path.join(
  path.dirname(SCRIPT_PATH),
  'qa-g5-l4-v6-deep-product.mjs',
);
const REPORT_TYPE =
  'g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa';

function observedReport() {
  const counts = (passed) => ({passed, failed: 0});
  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: 'observed-current-javascript-deep-qa-remediations-required',
    archiveBinding: {
      path: 'outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip',
      bytes: 38_556_629,
      sha256: ARCHIVE_SHA256,
    },
    sourceObservation: sourceObservation(
      PACKAGE_SOURCE_SNAPSHOT,
      OBSERVED_POST_V6_SOURCE_SNAPSHOT,
    ),
    authorityBoundary: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: 'none',
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    releaseBoundary: {
      expectedMembers: 55,
      strictCompleteCount: 0,
      published: false,
    },
    assertionCounts: {
      layout: counts(LAYOUT_OBSERVATION_COUNT),
      identity: counts(LAYOUT_OBSERVATION_COUNT),
      overflow: counts(LAYOUT_OBSERVATION_COUNT),
      reducedMotionObservations: counts(REDUCED_MOTION_OBSERVATION_COUNT),
      reducedMotionSamples: counts(REDUCED_MOTION_SAMPLE_COUNT),
      replayActivations: counts(REPLAY_ACTIVATION_COUNT),
    },
    freshClaims: {
      exactReleaseOrder: true,
      mapCore: true,
      mapDifferentPageFocus: true,
      mapSameCurrentPageReselectFocus: false,
      map: false,
      keyTerms: true,
      fq: true,
      persistence: true,
      perPageDirectUrl: false,
      networkBoundary: true,
      machineWorkExhausted: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    remediationFindings: KNOWN_REMEDIATIONS_REQUIRED.map((finding) => ({
      ...finding,
      observed: true,
    })),
    artifacts: [],
    failures: [],
  };
}

test('workload constants cover EN/ES, six viewports, 54 pages, three reduced samples, and three Replay activations', () => {
  assert.deepEqual(LOCALES.map(({id}) => id), ['en', 'es']);
  assert.deepEqual(
    VIEWPORTS.map(({width, height}) => `${width}x${height}`),
    ['800x600', '1280x720', '1440x1000', '768x1024', '390x844', '844x390'],
  );
  assert.equal(ACTIVE_PAGE_COUNT, 54);
  assert.equal(LAYOUT_OBSERVATION_COUNT, 648);
  assert.equal(REDUCED_MOTION_OBSERVATION_COUNT, 108);
  assert.equal(REDUCED_MOTION_SAMPLE_COUNT, 324);
  assert.equal(REPLAY_ACTIVATION_COUNT, 324);
  assert.equal(
    SESSION_STORAGE_KEY,
    'helpmath:g5-l4:whole-lesson-audit:v1',
  );
});

test('v6 immutable hashes and post-v6 source drift aggregates are exact', () => {
  assert.match(ARCHIVE_SHA256, /^[a-f0-9]{64}$/);
  assert.equal(
    PACKAGE_MANIFEST_SHA256,
    'fa640b7ce7f64096744106cc87a88aebb56f25958e4270aed69b0b6776bda05c',
  );
  assert.deepEqual(PACKAGE_SOURCE_SNAPSHOT, {
    fileCount: 537,
    totalBytes: 189_628_108,
    sha256: 'f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a',
  });
  assert.deepEqual(OBSERVED_POST_V6_SOURCE_SNAPSHOT, {
    fileCount: 537,
    totalBytes: 189_628_204,
    sha256: '88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484',
  });
});

test('arguments require three explicit immutable output targets and have no defaults', () => {
  assert.deepEqual(parseArguments(['--help']), {
    help: true,
    outputJson: null,
    outputMd: null,
    artifactDir: null,
  });
  assert.throws(() => parseArguments([]), /all required; no default output/);
  assert.throws(
    () => parseArguments(['--output-json', 'reports/a.json']),
    /all required/,
  );
  assert.throws(
    () => parseArguments([
      '--output-json', 'reports/a.json',
      '--output-json', 'reports/b.json',
      '--output-md', 'reports/a.md',
      '--artifact-dir', 'output/playwright/a',
    ]),
    /Duplicate argument/,
  );
  assert.deepEqual(parseArguments([
    '--output-json', 'reports/a.json',
    '--output-md', 'reports/a.md',
    '--artifact-dir', 'output/playwright/a',
  ]), {
    help: false,
    outputJson: 'reports/a.json',
    outputMd: 'reports/a.md',
    artifactDir: 'output/playwright/a',
  });
});

test('source drift is explicit, nonblocking, and does not relabel current workspace source as the QA runtime', () => {
  const observation = sourceObservation(
    PACKAGE_SOURCE_SNAPSHOT,
    OBSERVED_POST_V6_SOURCE_SNAPSHOT,
  );
  assert.equal(observation.sourceCurrentAtObservation, false);
  assert.deepEqual(observation.delta, {
    fileCount: 0,
    totalBytes: 96,
    sha256Changed: true,
  });
  assert.match(observation.driftReason, /apps\/web\/tsconfig\.json/);
  assert.match(observation.driftReason, /does not reject fresh-unzip QA/);
  assert.equal(observation.currentWorkspaceSourceUsedToServeQa, false);
  assert.equal(observation.currentWorkspaceSourceRollbackPerformed, false);
  assert.equal(observation.acceptanceEffect, 'none');
});

test('manifest page derivation requires exact 54-member active order and false authority', () => {
  const members = Array.from({length: 54}, (_, index) => ({
    ordinal: index + 1,
    animationId: `course-g05-l04-test-${String(index + 1).padStart(3, '0')}`,
    releaseRole: 'active-xml-referenced-page',
  }));
  const manifest = {
    packageId: PACKAGE_ID,
    release: {
      releaseId: 'lesson-g05-l04-number-lines',
      activePages: 54,
      expectedMembers: 55,
      strictCompleteCount: 0,
      published: false,
    },
    authority: {
      originalRuntime: false,
      strictComplete: false,
      published: false,
    },
    members: [
      ...members,
      {
        ordinal: 55,
        animationId: 'shell-course-g05-l04-index-local',
        releaseRole: 'course-shell',
      },
    ],
  };
  assert.equal(expectedPageIdsFromManifest(manifest).length, 54);
  manifest.authority.strictComplete = true;
  assert.throws(() => expectedPageIdsFromManifest(manifest), /authority fields/);
});

test('RSC abort classifier ignores only same error shape with an _rsc parameter', () => {
  assert.equal(
    isExpectedRscAbort('http://127.0.0.1:1234/courses/5/4?_rsc=abc', 'net::ERR_ABORTED'),
    true,
  );
  assert.equal(
    isExpectedRscAbort('http://127.0.0.1:1234/courses/5/4', 'net::ERR_ABORTED'),
    false,
  );
  assert.equal(
    isExpectedRscAbort('http://127.0.0.1:1234/courses/5/4?_rsc=abc', 'net::ERR_FAILED'),
    false,
  );
});

test('acceptance effects are all boolean false and four machine remediations stay distinct from limitations', () => {
  assert.ok(Object.keys(ACCEPTANCE_EFFECTS).length > 0);
  assert.ok(Object.values(ACCEPTANCE_EFFECTS).every((value) => value === false));
  assert.deepEqual(KNOWN_REMEDIATIONS_REQUIRED.map(({id}) => id), [
    'reduced-motion-note-pointer-interception',
    'vb004-spanish-app-owned-ui-remains-english',
    'mobile-390-legacy-exit-control-clips',
    'course-map-same-current-page-reselect-focuses-body',
  ]);
  assert.ok(KNOWN_LIMITATIONS.some(({id}) => id === 'url-backed-per-page-deep-links'));
});

test('observed report boundary requires exact counts, four findings, split Map claims, and no acceptance promotion', () => {
  const report = observedReport();
  assert.deepEqual(validateReportBoundary(report), []);
  report.acceptanceEffects.ownerAccepted = true;
  assert.match(validateReportBoundary(report).join('\n'), /acceptanceEffects/);
  report.acceptanceEffects.ownerAccepted = false;
  report.freshClaims.mapSameCurrentPageReselectFocus = true;
  assert.match(validateReportBoundary(report).join('\n'), /split Map claims/);
});

test('output planning and commit stay immutable under full workspace-relative paths', async () => {
  const fixtureRoot = await mkdtemp(path.join(
    WESTWORLD_TEMP_ROOT,
    '.g5-l4-v6-deep-qa-test-',
  ));
  try {
    await mkdir(path.join(fixtureRoot, 'reports'));
    await mkdir(path.join(fixtureRoot, 'output'));
    await mkdir(path.join(fixtureRoot, 'output', 'playwright'));
    const options = parseArguments([
      '--output-json', 'reports/raw-r1.json',
      '--output-md', 'reports/raw-r1.md',
      '--artifact-dir', 'output/playwright/raw-r1',
    ]);
    const plan = await prepareOutputPlan(options, {workspaceRoot: fixtureRoot});
    assert.equal(plan.outputJson, path.join(fixtureRoot, 'reports', 'raw-r1.json'));
    assert.equal(plan.outputMd, path.join(fixtureRoot, 'reports', 'raw-r1.md'));
    assert.equal(plan.artifactDir, path.join(fixtureRoot, 'output', 'playwright', 'raw-r1'));
    const stagedPath = path.join(fixtureRoot, 'representative.png');
    await writeFile(stagedPath, Buffer.from('not-a-real-png-test-fixture'), {flag: 'wx'});
    const report = observedReport();
    const result = await commitImmutableEvidence(plan, report, [{
      name: 'representative.png',
      stagedPath,
    }]);
    assert.equal(result.artifacts.length, 1);
    assert.match(await readFile(plan.outputMd, 'utf8'), /strict acceptance effect is `none`/);
    await assert.rejects(
      prepareOutputPlan(options, {workspaceRoot: fixtureRoot}),
      /target already exists/,
    );
    await assert.rejects(
      commitImmutableEvidence(plan, observedReport(), []),
      /Immutable target appeared/,
    );
  } finally {
    assert.equal(path.dirname(fixtureRoot), WESTWORLD_TEMP_ROOT);
    assert.ok(path.basename(fixtureRoot).startsWith('.g5-l4-v6-deep-qa-test-'));
    await rm(fixtureRoot, {recursive: true, force: false});
  }
});

test('runner source statically binds fresh unzip, dual verify, dynamic loopback, deep matrices, probes, and wx outputs', async () => {
  const source = await readFile(RUNNER_PATH, 'utf8');
  assert.match(source, /mkdtemp\(path\.join\(WESTWORLD_TEMP_ROOT, TEMP_PREFIX\)\)/);
  assert.ok(source.match(/\['verify\.mjs'\]/g)?.length >= 2);
  assert.match(source, /findAvailableLoopbackPort\(\)/);
  assert.match(source, /for \(const locale of LOCALES\)/);
  assert.match(source, /for \(const viewport of VIEWPORTS\)/);
  assert.match(source, /sample < 3/);
  assert.match(source, /REPLAY_ACTIVATIONS/);
  assert.match(source, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
  assert.match(source, /async function waitForStorageState\(page\)/);
  assert.match(source, /localStorage\.getItem\(key\) !== null/);
  assert.doesNotMatch(source, /helpmath:whole-lesson-session:/);
  assert.match(source, /elementFromPoint/);
  assert.match(source, /samePageReselectFocusRestored/);
  assert.match(source, /document\.activeElement\?\.getAttribute\('data-responsive-focus-key'\) === 'map'/);
  assert.match(source, /knownRemediationObserved: !samePageReselectFocusRestored/);
  assert.match(source, /filter\(\{hasText: expectedInitial\}\)\.waitFor/);
  assert.ok(source.match(/canvas\[data-animation-id=/g)?.length >= 3);
  assert.match(source, /flag: 'wx'/);
  assert.match(source, /--output-json, --output-md, and --artifact-dir are all required/);
  assert.doesNotMatch(source, /writeFile\([^\n]*package\.json/);
});
