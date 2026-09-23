import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  PACKAGE_BASENAME,
  PACKAGE_ID,
  RELEASE_ID,
} from './build-g5-l4-whole-lesson-package-mvp-v7.mjs';
import {
  ACCEPTANCE_EFFECTS,
  ACTIVE_PAGE_COUNT,
  assertSafeArchiveEntries,
  commitImmutableEvidence,
  expectedPageIdsFromManifest,
  glossaryDataPathForLanguage,
  isExpectedRscAbort,
  KNOWN_LIMITATIONS,
  LAYOUT_OBSERVATION_COUNT,
  LOCALES,
  parseArchiveSidecar,
  parseArguments,
  pinArchiveInputs,
  prepareOutputPlan,
  REDUCED_MOTION_OBSERVATION_COUNT,
  REDUCED_MOTION_SAMPLE_COUNT,
  REMEDIATION_IDS,
  REPLAY_ACTIVATION_COUNT,
  reportMarkdown,
  REPORT_TYPE,
  rendererKindForAnimation,
  rendererRuntimeObservationPassed,
  runCommand,
  sha256,
  SCOPE_RESULT_PASS,
  sourceObservation,
  stopChild,
  observeOriginalArchiveInputStability,
  validateReportBoundary,
  VB004_ANIMATION_ID,
  VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS,
  VB004_FUNCTIONAL_SCOPE,
  VB004_RENDERER_KIND,
  vb004AppOwnedStrings,
  VIEWPORTS,
  WESTWORLD_TEMP_ROOT,
  STANDARD_RENDERER_KIND,
} from './qa-g5-l4-v7-deep-product.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const RUNNER_PATH = path.join(
  path.dirname(SCRIPT_PATH),
  'qa-g5-l4-v7-deep-product.mjs',
);
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);
const SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189_628_204,
  sha256: SHA_A,
});

function passingReport() {
  const counts = (passed) => ({passed, failed: 0});
  const observation = sourceObservation(SNAPSHOT, {...SNAPSHOT});
  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: 'pass-current-javascript-deep-product-qa',
    archiveBinding: {
      path: `outputs/${PACKAGE_BASENAME}.zip`,
      bytes: 1,
      sha256: SHA_B,
    },
    archiveSidecarBinding: {
      path: `outputs/${PACKAGE_BASENAME}.zip.sha256`,
      bytes: 1,
      sha256: SHA_C,
    },
    archiveSourceStability: {
      archiveAtStart: {bytes: 1, sha256: SHA_B},
      archiveAtEnd: {bytes: 1, sha256: SHA_B},
      archiveUnchanged: true,
      sidecarAtStart: {bytes: 1, sha256: SHA_C},
      sidecarAtEnd: {bytes: 1, sha256: SHA_C},
      sidecarUnchanged: true,
      endPairValid: true,
      unchanged: true,
    },
    packageManifestBinding: {
      path: `${PACKAGE_BASENAME}/package-manifest.json`,
      bytes: 1,
      sha256: SHA_C,
    },
    freshUnzip: {
      archiveSidecarSha256: SHA_B,
      pinnedInput: {
        copyMode: 'create-exclusive-byte-copy',
        archive: {bytes: 1, sha256: SHA_B},
        sidecar: {bytes: 1, sha256: SHA_C},
      },
      originalInputsUnchangedAtEnd: true,
      archiveEntriesSafetyCheckedInFull: true,
      packageSource: 'hash-bound-v7-zip-only',
      currentWorkspaceSourceServed: false,
      loopback: {
        dynamicPort: true,
        listenerOwnedBySpawnedChild: true,
      },
    },
    packageVerifier: {
      before: {status: 0},
      after: {status: 0},
    },
    sourceObservation: {
      ...observation,
      manifestBuildSnapshotsEqual: true,
      unchangedThroughoutQa: true,
      currentSnapshotAtStart: {...SNAPSHOT},
      currentSnapshotAtEnd: {...SNAPSHOT},
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: 'none',
      authoritativeOriginalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      strictCompletionAuthority: false,
      publicationAuthority: false,
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
      reducedMotionObservations: counts(
        REDUCED_MOTION_OBSERVATION_COUNT,
      ),
      reducedMotionSamples: counts(REDUCED_MOTION_SAMPLE_COUNT),
      replayActivations: counts(REPLAY_ACTIVATION_COUNT),
      map: counts(4),
      keyTerms: counts(4),
      fq: counts(4),
      persistence: counts(2),
      remediations: counts(4),
    },
    freshClaims: {
      freshUnzip: true,
      packageVerifierBeforeAndAfter: true,
      exactReleaseOrder: true,
      layout: true,
      reducedMotion: true,
      replayMouseEnterSpace: true,
      map: true,
      keyTerms: true,
      fq: true,
      persistence: true,
      directUrlBoundary: true,
      perPageDirectUrl: false,
      networkBoundary: true,
      allFourV7Remediations: true,
    },
    scopeResult: {...SCOPE_RESULT_PASS},
    remediationChecks: REMEDIATION_IDS.map((id) => ({
      id,
      passed: true,
      acceptanceEffect: 'none',
    })),
    artifacts: [],
    failures: [],
  };
}

function exactManifest() {
  const members = Array.from({length: 54}, (_, index) => ({
    ordinal: index + 1,
    animationId:
      `course-g05-l04-test-${String(index + 1).padStart(3, '0')}`,
    releaseRole: 'active-xml-referenced-page',
  }));
  return {
    packageId: PACKAGE_ID,
    release: {
      releaseId: RELEASE_ID,
      activePages: 54,
      expectedMembers: 55,
      strictCompleteCount: 0,
      published: false,
    },
    authority: {
      originalRuntimeAccepted: false,
      ownerAccepted: false,
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
}

test('workload is exactly EN/ES x six viewports x 54 pages', () => {
  assert.deepEqual(LOCALES.map(({id}) => id), ['en', 'es']);
  assert.deepEqual(
    VIEWPORTS.map(({width, height}) => `${width}x${height}`),
    [
      '800x600',
      '1280x720',
      '1440x1000',
      '768x1024',
      '390x844',
      '844x390',
    ],
  );
  assert.equal(ACTIVE_PAGE_COUNT, 54);
  assert.equal(LAYOUT_OBSERVATION_COUNT, 648);
  assert.equal(REDUCED_MOTION_OBSERVATION_COUNT, 108);
  assert.equal(REDUCED_MOTION_SAMPLE_COUNT, 324);
  assert.equal(REPLAY_ACTIVATION_COUNT, 324);
});

test('renderer profiles admit only VB004 DOM evidence and keep all other pages canvas-strict', () => {
  const rect = {
    left: 8,
    right: 792,
    top: 100,
    bottom: 688,
    width: 784,
    height: 588,
  };
  const runtime = {
    runtimeStageCount: 1,
    runtimeAnimationId: 'course-g05-l04-in-001',
    runtimeModule: 'course-g05-l04-in-001',
    runtimeLanguage: 'en',
    frameDomain: 'sprite-100',
    frame: 1,
    stageRect: rect,
  };
  const standard = {
    ...runtime,
    rendererKind: STANDARD_RENDERER_KIND,
    canvasCount: 1,
    canvasBacking: {width: 800, height: 600},
    canvasRect: rect,
  };
  assert.equal(
    rendererKindForAnimation(runtime.runtimeAnimationId),
    STANDARD_RENDERER_KIND,
  );
  assert.equal(
    rendererRuntimeObservationPassed(
      standard,
      runtime.runtimeAnimationId,
    ),
    true,
  );
  assert.equal(rendererRuntimeObservationPassed({
    ...standard,
    canvasCount: 0,
    functionalRootCount: 1,
    controlsEnabled: 'true',
  }, runtime.runtimeAnimationId), false);
  assert.equal(rendererRuntimeObservationPassed({
    ...standard,
    canvasBacking: {width: 799, height: 600},
  }, runtime.runtimeAnimationId), false);

  const vb004 = {
    ...runtime,
    rendererKind: VB004_RENDERER_KIND,
    runtimeAnimationId: VB004_ANIMATION_ID,
    runtimeModule: VB004_ANIMATION_ID,
    frameDomain: 'sprite-71',
    frame: 208,
    canvasCount: 0,
    canvasBacking: null,
    canvasRect: null,
    functionalRootCount: 1,
    functionalScope: VB004_FUNCTIONAL_SCOPE,
    functionalCandidate: 'true',
    interactionEligible: 'true',
    controlsEnabled: 'true',
    sourceRuntimeLanguage: 'en',
    visibleReadySurfaceCount: 1,
    functionalRootRect: rect,
    readySurfaceRect: rect,
  };
  assert.equal(
    rendererKindForAnimation(VB004_ANIMATION_ID),
    VB004_RENDERER_KIND,
  );
  assert.equal(
    rendererRuntimeObservationPassed(vb004, VB004_ANIMATION_ID),
    true,
  );
  assert.equal(rendererRuntimeObservationPassed({
    ...vb004,
    controlsEnabled: 'false',
  }, VB004_ANIMATION_ID), false);
  assert.equal(rendererRuntimeObservationPassed({
    ...vb004,
    functionalRootRect: {...rect, width: 0},
  }, VB004_ANIMATION_ID), false);
});

test('glossary paths are exact and their ordinary same-origin aborts stay fail-closed', () => {
  assert.equal(
    glossaryDataPathForLanguage('en'),
    '/generated/g5-l4-elementary-keyterms-reference-en.json',
  );
  assert.equal(
    glossaryDataPathForLanguage('es'),
    '/generated/g5-l4-elementary-keyterms-reference-es.json',
  );
  assert.throws(
    () => glossaryDataPathForLanguage('fr'),
    /Unsupported glossary language/,
  );
  assert.equal(isExpectedRscAbort(
    'http://127.0.0.1:1234/generated/g5-l4-elementary-keyterms-reference-en.json',
    'net::ERR_ABORTED',
  ), false);
});

test('acceptance remains all false and only bounded current-JS exhaustion can be true', () => {
  assert.ok(Object.values(ACCEPTANCE_EFFECTS).every((value) => value === false));
  assert.deepEqual(
    Object.entries(SCOPE_RESULT_PASS)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    ['currentJavascriptDeepProductQaMachineWorkExhausted'],
  );
  assert.deepEqual(REMEDIATION_IDS, [
    'reduced-motion-note-does-not-intercept-pointer',
    'vb004-spanish-app-owned-ui-localized-source-runtime-english',
    'mobile-390-legacy-exit-inside-stage',
    'course-map-same-current-page-reselect-focuses-heading',
  ]);
  assert.ok(KNOWN_LIMITATIONS.some(({id, status}) =>
    id === 'url-backed-per-page-deep-links'
      && status === 'absent-in-v7-current-javascript-package'
  ));
});

test('VB004 localization contract enumerates every app-owned card, target, ARIA, and feedback string', () => {
  const expectedCardIds = Array.from(
    {length: 8},
    (_, index) => `Src_${index + 1}`,
  );
  const expectedTargetIds = ['Mc_Tar_1', 'Mc_Tar_2'];
  for (const language of ['en', 'es']) {
    const expectations =
      VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS[language];
    assert.deepEqual(
      expectations.cards.map(({id}) => id),
      expectedCardIds,
    );
    assert.deepEqual(
      expectations.targets.map(({id}) => id),
      expectedTargetIds,
    );
    for (const card of expectations.cards) {
      assert.equal(card.correctTargetId.startsWith('Mc_Tar_'), true);
      for (const field of [
        'label',
        'moveAria',
        'selectAria',
        'placedAria',
        'selectedFeedback',
        'correctFeedback',
        'wrongFeedback',
        'notDroppedFeedback',
      ]) {
        assert.equal(typeof card[field], 'string');
        assert.ok(card[field].length > 0);
      }
    }
    for (const target of expectations.targets) {
      for (const field of [
        'label',
        'mobileAria',
        'stageInitialAria',
        'stageFinalAria',
      ]) {
        assert.equal(typeof target[field], 'string');
        assert.ok(target[field].length > 0);
      }
    }
    assert.ok(vb004AppOwnedStrings(language).length >= 80);
  }
  const english = vb004AppOwnedStrings('en');
  assert.ok(english.includes('Select negative five'));
  assert.ok(english.includes('Move each number to Integers or Non-Integers.'));
  assert.ok(english.includes('negative five placed correctly'));
  assert.ok(english.includes(
    'negative five was not dropped in a category. Try again.',
  ));
  const spanish = vb004AppOwnedStrings('es');
  assert.ok(spanish.includes('Seleccionar menos cinco'));
  assert.ok(spanish.includes('menos cinco colocado correctamente'));
  assert.ok(spanish.includes(
    'menos cinco no se colocó en una categoría. Inténtalo de nuevo.',
  ));
});

test('Markdown claims bounded matrix exhaustion only for a passing exhausted scope', () => {
  const passingMarkdown = reportMarkdown(passingReport());
  assert.match(
    passingMarkdown,
    /bounded v7 deep-product machine matrix was exhausted within current-JavaScript scope/,
  );
  assert.doesNotMatch(passingMarkdown, /was not exhausted by this attempt/);

  const failedReport = passingReport();
  failedReport.status = 'fail-current-javascript-deep-product-qa';
  failedReport.scopeResult = {
    ...SCOPE_RESULT_PASS,
    currentJavascriptDeepProductQaMachineWorkExhausted: false,
  };
  failedReport.failures = ['synthetic failure'];
  const failedMarkdown = reportMarkdown(failedReport);
  assert.match(failedMarkdown, /was not exhausted by this attempt/);
  assert.doesNotMatch(
    failedMarkdown,
    /matrix was exhausted within current-JavaScript scope/,
  );
  assert.doesNotMatch(failedMarkdown, /It exhausts the bounded/);

  const inconsistentReport = passingReport();
  inconsistentReport.scopeResult = failedReport.scopeResult;
  assert.match(
    reportMarkdown(inconsistentReport),
    /was not exhausted by this attempt/,
  );
});

test('arguments require three explicit create-exclusive output targets', () => {
  assert.deepEqual(parseArguments(['--help']), {
    help: true,
    outputJson: null,
    outputMd: null,
    artifactDir: null,
  });
  assert.throws(() => parseArguments([]), /all required; defaults are forbidden/);
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

test('archive sidecar binding is dynamic and filename-bound', () => {
  const archiveBasename = `${PACKAGE_BASENAME}.zip`;
  assert.deepEqual(
    parseArchiveSidecar(`${SHA_A}  ${archiveBasename}\n`, archiveBasename),
    {sha256: SHA_A, filename: archiveBasename},
  );
  assert.throws(
    () => parseArchiveSidecar(`${SHA_A}  other.zip\n`, archiveBasename),
    /different ZIP/,
  );
  assert.throws(
    () => parseArchiveSidecar(`sha256:${SHA_A}\n`, archiveBasename),
    /invalid format/,
  );
});

test('archive inputs are create-exclusively pinned and original drift is detected', async () => {
  const fixtureRoot = await mkdtemp(path.join(
    WESTWORLD_TEMP_ROOT,
    '.g5-l4-v7-pin-test-',
  ));
  try {
    const sourceRoot = path.join(fixtureRoot, 'source');
    const runRoot = path.join(fixtureRoot, 'run');
    await mkdir(sourceRoot);
    await mkdir(runRoot);
    const archivePath = path.join(sourceRoot, 'fixture-v7.zip');
    const sidecarPath = `${archivePath}.sha256`;
    const archiveBytes = Buffer.from('immutable-v7-archive-fixture');
    const archiveHash = sha256(archiveBytes);
    const sidecarText = `${archiveHash}  ${path.basename(archivePath)}\n`;
    await writeFile(archivePath, archiveBytes, {flag: 'wx'});
    await writeFile(sidecarPath, sidecarText, {flag: 'wx'});

    const pinned = await pinArchiveInputs({
      archivePath,
      sidecarPath,
      runRoot,
      bindingRoot: fixtureRoot,
    });
    assert.equal(pinned.pinned.archiveBinding.sha256, archiveHash);
    assert.equal(pinned.pinned.sidecar.sha256, archiveHash);
    assert.equal(
      await readFile(pinned.pinned.archivePath, 'utf8'),
      archiveBytes.toString('utf8'),
    );
    assert.equal(
      await readFile(pinned.pinned.sidecarPath, 'utf8'),
      sidecarText,
    );
    assert.equal(
      (await observeOriginalArchiveInputStability(pinned)).unchanged,
      true,
    );

    await writeFile(archivePath, 'drifted-source-archive');
    const drift = await observeOriginalArchiveInputStability(pinned);
    assert.equal(drift.archiveUnchanged, false);
    assert.equal(drift.endPairValid, false);
    assert.equal(drift.unchanged, false);
    assert.equal(
      await readFile(pinned.pinned.archivePath, 'utf8'),
      archiveBytes.toString('utf8'),
    );

    await writeFile(archivePath, archiveBytes);
    const collisionRoot = path.join(fixtureRoot, 'collision-run');
    await mkdir(collisionRoot);
    const collisionTarget = path.join(
      collisionRoot,
      path.basename(archivePath),
    );
    await writeFile(collisionTarget, 'preexisting-sentinel', {flag: 'wx'});
    await assert.rejects(
      pinArchiveInputs({
        archivePath,
        sidecarPath,
        runRoot: collisionRoot,
        bindingRoot: fixtureRoot,
      }),
      (error) => error?.code === 'EEXIST',
    );
    assert.equal(
      await readFile(collisionTarget, 'utf8'),
      'preexisting-sentinel',
    );
  } finally {
    assert.equal(path.dirname(fixtureRoot), WESTWORLD_TEMP_ROOT);
    assert.ok(path.basename(fixtureRoot).startsWith('.g5-l4-v7-pin-test-'));
    await rm(fixtureRoot, {recursive: true, force: false});
  }
});

test('source equality is mandatory for a passing report', () => {
  const equal = sourceObservation(SNAPSHOT, {...SNAPSHOT});
  assert.equal(equal.sourceCurrentAtObservation, true);
  assert.deepEqual(equal.delta, {
    fileCount: 0,
    totalBytes: 0,
    sha256Changed: false,
  });
  const drift = sourceObservation(SNAPSHOT, {
    ...SNAPSHOT,
    totalBytes: SNAPSHOT.totalBytes + 1,
    sha256: SHA_B,
  });
  assert.equal(drift.sourceCurrentAtObservation, false);
  const report = passingReport();
  report.sourceObservation = drift;
  assert.match(
    validateReportBoundary(report).join('\n'),
    /exact fresh current package input snapshot/,
  );
});

test('manifest page derivation requires exact order and present all-false authority', () => {
  const manifest = exactManifest();
  assert.equal(expectedPageIdsFromManifest(manifest).length, 54);
  manifest.authority.ownerAccepted = true;
  assert.throws(
    () => expectedPageIdsFromManifest(manifest),
    /remain entirely false/,
  );
  manifest.authority = {};
  assert.throws(
    () => expectedPageIdsFromManifest(manifest),
    /must be present/,
  );
});

test('ZIP entries must stay wholly inside the v7 package root', () => {
  assert.equal(assertSafeArchiveEntries([
    `${PACKAGE_BASENAME}/`,
    `${PACKAGE_BASENAME}/package-manifest.json`,
    `${PACKAGE_BASENAME}/runtime/server.js`,
  ]), true);
  assert.throws(
    () => assertSafeArchiveEntries([`${PACKAGE_BASENAME}/../escape`]),
    /traverses a parent/,
  );
  assert.throws(
    () => assertSafeArchiveEntries(['/absolute']),
    /absolute/,
  );
  assert.throws(
    () => assertSafeArchiveEntries(['different-root/file']),
    /escapes/,
  );
});

test('passing report requires exact counts, four remediations, and no authority promotion', () => {
  const report = passingReport();
  assert.deepEqual(validateReportBoundary(report), []);
  report.acceptanceEffects.ownerAccepted = true;
  assert.match(validateReportBoundary(report).join('\n'), /acceptanceEffects/);
  report.acceptanceEffects.ownerAccepted = false;
  report.scopeResult.ownerAcceptanceComplete = true;
  assert.match(validateReportBoundary(report).join('\n'), /scopeResult/);
  report.scopeResult = {...SCOPE_RESULT_PASS};
  report.archiveSourceStability.archiveUnchanged = false;
  assert.match(
    validateReportBoundary(report).join('\n'),
    /sidecar-bound safe fresh-unzip/,
  );
  report.archiveSourceStability.archiveUnchanged = true;
  report.freshClaims.productQaComplete = true;
  assert.match(validateReportBoundary(report).join('\n'), /cannot promote/);
  delete report.freshClaims.productQaComplete;
  report.remediationChecks[0].passed = false;
  assert.match(validateReportBoundary(report).join('\n'), /all four v6/);
});

test('output planning and commit are immutable in a unique WestWorld fixture', async () => {
  const fixtureRoot = await mkdtemp(path.join(
    WESTWORLD_TEMP_ROOT,
    '.g5-l4-v7-deep-qa-test-',
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
    const plan = await prepareOutputPlan(options, {
      workspaceRoot: fixtureRoot,
    });
    const stagedPath = path.join(fixtureRoot, 'representative.png');
    await writeFile(
      stagedPath,
      Buffer.from('not-a-real-png-test-fixture'),
      {flag: 'wx'},
    );
    const result = await commitImmutableEvidence(
      plan,
      passingReport(),
      [{name: 'representative.png', stagedPath}],
    );
    assert.equal(result.artifacts.length, 1);
    assert.equal(
      result.commitProtocol.type,
      'staged-exclusive-hard-links-with-rollback-journal',
    );
    assert.equal(result.transactionCleanupWarning, null);
    assert.match(
      await readFile(plan.outputMd, 'utf8'),
      /strict acceptance effect is `none`/,
    );
    await assert.rejects(
      prepareOutputPlan(options, {workspaceRoot: fixtureRoot}),
      /target already exists/,
    );
    await assert.rejects(
      commitImmutableEvidence(plan, passingReport(), []),
      /Immutable target appeared/,
    );
  } finally {
    assert.equal(path.dirname(fixtureRoot), WESTWORLD_TEMP_ROOT);
    assert.ok(
      path.basename(fixtureRoot).startsWith(
        '.g5-l4-v7-deep-qa-test-',
      ),
    );
    await rm(fixtureRoot, {recursive: true, force: false});
  }
});

test('evidence transaction rolls back every injected I/O fault and never overwrites', async () => {
  const fixtureRoot = await mkdtemp(path.join(
    WESTWORLD_TEMP_ROOT,
    '.g5-l4-v7-evidence-fault-test-',
  ));
  const assertAbsent = async (target) => assert.rejects(
    lstat(target),
    (error) => error?.code === 'ENOENT',
  );
  try {
    await mkdir(path.join(fixtureRoot, 'reports'));
    await mkdir(path.join(fixtureRoot, 'output'));
    await mkdir(path.join(fixtureRoot, 'output', 'playwright'));
    const stagedPath = path.join(fixtureRoot, 'representative.png');
    await writeFile(stagedPath, Buffer.from('fault-injection-artifact'), {
      flag: 'wx',
    });
    const faultPoints = [
      'stage-artifact-directory',
      'stage-artifact-representative.png',
      'stage-json',
      'stage-markdown',
      'create-journal',
      'journal-staged',
      'publish-artifact-directory',
      'journal-artifact-directory-published',
      'publish-artifact-representative.png',
      'journal-artifact-published-representative.png',
      'publish-json',
      'journal-json-published',
      'publish-markdown',
      'journal-markdown-published',
      'journal-committed',
    ];
    for (const [index, faultPoint] of faultPoints.entries()) {
      const suffix = String(index + 1).padStart(2, '0');
      const plan = await prepareOutputPlan(parseArguments([
        '--output-json', `reports/fault-${suffix}.json`,
        '--output-md', `reports/fault-${suffix}.md`,
        '--artifact-dir', `output/playwright/fault-${suffix}`,
      ]), {workspaceRoot: fixtureRoot});
      await assert.rejects(
        commitImmutableEvidence(
          plan,
          passingReport(),
          [{name: 'representative.png', stagedPath}],
          {
            beforeIo: (step) => {
              if (step === faultPoint) {
                throw new Error(`Injected I/O fault at ${step}`);
              }
            },
          },
        ),
        new RegExp(`Injected I/O fault at ${faultPoint.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )}`),
      );
      await assertAbsent(plan.outputJson);
      await assertAbsent(plan.outputMd);
      await assertAbsent(plan.artifactDir);
      assert.equal(
        (await readdir(fixtureRoot)).some((name) =>
          name.startsWith('.g5-l4-v7-evidence-transaction-')),
        false,
      );
    }

    const collisionPlan = await prepareOutputPlan(parseArguments([
      '--output-json', 'reports/collision.json',
      '--output-md', 'reports/collision.md',
      '--artifact-dir', 'output/playwright/collision',
    ]), {workspaceRoot: fixtureRoot});
    await writeFile(
      collisionPlan.outputJson,
      'preexisting-evidence-sentinel',
      {flag: 'wx'},
    );
    await assert.rejects(
      commitImmutableEvidence(
        collisionPlan,
        passingReport(),
        [{name: 'representative.png', stagedPath}],
      ),
      /Immutable target appeared before commit/,
    );
    assert.equal(
      await readFile(collisionPlan.outputJson, 'utf8'),
      'preexisting-evidence-sentinel',
    );
    await assertAbsent(collisionPlan.outputMd);
    await assertAbsent(collisionPlan.artifactDir);

    const racedPlan = await prepareOutputPlan(parseArguments([
      '--output-json', 'reports/raced.json',
      '--output-md', 'reports/raced.md',
      '--artifact-dir', 'output/playwright/raced',
    ]), {workspaceRoot: fixtureRoot});
    let injectedRace = false;
    await assert.rejects(
      commitImmutableEvidence(
        racedPlan,
        passingReport(),
        [{name: 'representative.png', stagedPath}],
        {
          beforeIo: async (step) => {
            if (step === 'publish-json' && !injectedRace) {
              injectedRace = true;
              await writeFile(
                racedPlan.outputJson,
                'raced-preexisting-sentinel',
                {flag: 'wx'},
              );
            }
          },
        },
      ),
      (error) => error?.code === 'EEXIST',
    );
    assert.equal(
      await readFile(racedPlan.outputJson, 'utf8'),
      'raced-preexisting-sentinel',
    );
    await assertAbsent(racedPlan.outputMd);
    await assertAbsent(racedPlan.artifactDir);
  } finally {
    assert.equal(path.dirname(fixtureRoot), WESTWORLD_TEMP_ROOT);
    assert.ok(
      path.basename(fixtureRoot).startsWith(
        '.g5-l4-v7-evidence-fault-test-',
      ),
    );
    await rm(fixtureRoot, {recursive: true, force: false});
  }
});

test('runner statically binds full fresh-unzip QA and waits out Replay storage hydration', async () => {
  const source = await readFile(RUNNER_PATH, 'utf8');
  assert.match(
    source,
    /mkdtemp\(path\.join\(WESTWORLD_TEMP_ROOT, TEMP_PREFIX\)\)/,
  );
  assert.match(source, /pinArchiveInputs\(\{runRoot\}\)/);
  assert.match(source, /\['-Z1', pinnedArchivePath\]/);
  assert.match(source, /\['-tq', pinnedArchivePath\]/);
  assert.match(source, /\['-q', pinnedArchivePath, '-d', extractionRoot\]/);
  assert.doesNotMatch(source, /\['-(?:Z1|tq|q)', ARCHIVE_PATH/);
  assert.match(source, /observeOriginalArchiveInputStability\(pinnedInputs\)/);
  assert.match(source, /originalInputsUnchangedAtEnd/);
  assert.match(source, /outputLimit: null/);
  assert.match(source, /assertSafeArchiveEntries\(archiveEntries\)/);
  assert.ok(source.match(/\['verify\.mjs'\]/g)?.length >= 2);
  assert.match(source, /findAvailableLoopbackPort\(\)/);
  assert.match(source, /for \(const locale of LOCALES\)/);
  assert.match(source, /for \(const viewport of VIEWPORTS\)/);
  assert.match(source, /index < 3/);
  assert.match(source, /REPLAY_ACTIVATIONS/);
  assert.match(source, /parsed\?\.releaseId === releaseId/);
  assert.match(source, /Array\.isArray\(parsed\?\.visitedAnimationIds\)/);
  assert.doesNotMatch(source, /startsWith\('helpmath:whole-lesson-session:'\)/);
  assert.match(source, /elementFromPoint/);
  assert.match(source, /notePointerEvents === 'none'/);
  assert.match(source, /data-source-runtime-language/);
  assert.match(source, /runtimeFlashLanguage === 'en'/);
  assert.match(source, /vb004AppOwnedStrings\('en'\)/);
  assert.match(source, /data-mobile-source-card/);
  assert.match(source, /data-card-placed/);
  assert.match(source, /notDroppedFeedback/);
  assert.match(source, /feedbackObservations\.length === 19/);
  assert.match(source, /initialSnapshot\.englishRemnants\.length === 0/);
  assert.match(source, /finalSnapshot\.englishRemnants\.length === 0/);
  assert.doesNotMatch(source, /const englishOwnedPhrases/);
  assert.match(source, /samePageFocusPassed/);
  assert.match(source, /expectedV7BoundaryPreserved/);
  assert.match(source, /flag: 'wx'/);
  assert.match(source, /staged-exclusive-hard-links-with-rollback-journal/);
  assert.match(source, /unlinkPublishedFileIfOwned/);
  assert.match(source, /child\.signalCode !== null/);
  assert.match(source, /terminationGraceMs \+ killWaitMs/);
  assert.match(
    source,
    /--output-json, --output-md, and --artifact-dir are all required/,
  );
  assert.doesNotMatch(source, /const ARCHIVE_SHA256/);
  assert.doesNotMatch(source, /const PACKAGE_MANIFEST_SHA256/);

  const replayStart = source.indexOf('async function runReplayMatrix');
  const replayEnd = source.indexOf('async function focusedElement');
  const replaySource = source.slice(replayStart, replayEnd);
  const navigationIndex = replaySource.indexOf('await navigateCourse');
  const keyIndex = replaySource.indexOf('await waitForStorageKey(page)');
  const storedIndex = replaySource.indexOf(
    'await waitForStoredCurrentPage(page, storageKey, animationId)',
  );
  const baselineIndex = replaySource.indexOf(
    'const initial = await readStoredSession(page, storageKey)',
  );
  assert.ok(navigationIndex >= 0 && keyIndex > navigationIndex);
  assert.ok(storedIndex > keyIndex && baselineIndex > storedIndex);
});

test('runner waits for the VB004 DOM renderer across layout, reduced motion, and Replay', async () => {
  const source = await readFile(RUNNER_PATH, 'utf8');
  const waitStart = source.indexOf('async function waitForActiveRenderer');
  const waitEnd = source.indexOf('async function selectAndWaitForPage');
  const waitSource = source.slice(waitStart, waitEnd);
  assert.ok(waitStart >= 0 && waitEnd > waitStart);
  assert.match(waitSource, /data-current-js-functional-scope/);
  assert.match(waitSource, /data-current-js-controls-ready="true"/);
  assert.match(waitSource, /data-current-js-controls-enabled/);
  assert.match(waitSource, /data-current-js-interaction-eligible/);
  assert.match(waitSource, /canvas\?\.getAttribute\('width'\) !== '800'/);
  assert.match(waitSource, /canvas\.getAttribute\('height'\) !== '600'/);

  const selectionStart = source.indexOf('async function selectAndWaitForPage');
  const selectionEnd = source.indexOf('async function waitForStorageKey');
  const selectionSource = source.slice(selectionStart, selectionEnd);
  assert.match(selectionSource, /await waitForActiveRenderer\(page, animationId\)/);
  assert.doesNotMatch(
    selectionSource,
    /canvas\[data-animation-id=.*data-render-state="ready"/s,
  );

  const reducedStart = source.indexOf('async function sampleReducedMotion');
  const reducedEnd = source.indexOf('async function waitForReplayCount');
  const reducedSource = source.slice(reducedStart, reducedEnd);
  assert.match(reducedSource, /captureRendererObservation/);
  assert.match(reducedSource, /rendererRuntimeObservationPassed/);

  const replayStart = source.indexOf('async function runReplayMatrix');
  const replayEnd = source.indexOf('async function focusedElement');
  const replaySource = source.slice(replayStart, replayEnd);
  assert.match(replaySource, /await waitForActiveRenderer\(page, animationId\)/);
  assert.match(replaySource, /rendererIdentityPassed/);
  assert.doesNotMatch(
    replaySource,
    /page\.locator\(\s*`canvas\[data-animation-id=/,
  );
});

test('Key Terms waits for exact successful settled glossary fetches before Escape', async () => {
  const source = await readFile(RUNNER_PATH, 'utf8');
  const helperStart = source.indexOf(
    'async function waitForGlossaryFetchAndRender',
  );
  const helperEnd = source.indexOf('async function inspectKeyTerms');
  const helperSource = source.slice(helperStart, helperEnd);
  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  assert.match(helperSource, /page\.waitForResponse/);
  assert.match(helperSource, /url\.origin === expectedOrigin/);
  assert.match(helperSource, /url\.pathname === expectedPath/);
  assert.match(helperSource, /url\.search === ''/);
  assert.match(helperSource, /response\.status\(\) === 200/);
  assert.match(helperSource, /await response\.finished\(\)/);
  assert.match(helperSource, /finishError === null/);
  assert.match(helperSource, /lesson-shell2__key-terms-count/);

  const keyTermsStart = helperEnd;
  const keyTermsEnd = source.indexOf('async function inspectFqFlow');
  const keyTermsSource = source.slice(keyTermsStart, keyTermsEnd);
  assert.equal(
    keyTermsSource.match(/waitForGlossaryFetchAndRender\(/g)?.length,
    3,
  );
  assert.ok(
    keyTermsSource.indexOf('waitForGlossaryFetchAndRender')
      < keyTermsSource.indexOf("page.keyboard.press('Escape')"),
  );
  assert.match(keyTermsSource, /glossaryFetches\.length === 4/);
});

test('command and child shutdown paths handle signals and remain hard-bounded', async () => {
  const normal = await runCommand(
    process.execPath,
    ['-e', 'process.stdout.write("ok")'],
    {
      timeoutMs: 1_000,
      terminationGraceMs: 50,
      killWaitMs: 100,
    },
  );
  assert.equal(normal.status, 0);
  assert.equal(normal.stdout, 'ok');
  assert.equal(normal.timedOut, false);
  assert.equal(normal.killEscalated, false);

  const forced = await runCommand(
    process.execPath,
    [
      '-e',
      'process.on("SIGTERM",()=>{});process.stdout.write("ready\\n");setInterval(()=>{},1000)',
    ],
    {
      timeoutMs: 150,
      terminationGraceMs: 25,
      killWaitMs: 1_000,
    },
  );
  assert.equal(forced.timedOut, true);
  assert.equal(forced.termSignalSent, true);
  assert.equal(forced.killEscalated, true);
  assert.equal(forced.signal, 'SIGKILL');
  assert.equal(forced.hardDeadlineReached, false);
  assert.match(forced.stdout, /ready/);

  const alreadySignaled = new EventEmitter();
  alreadySignaled.exitCode = null;
  alreadySignaled.signalCode = 'SIGTERM';
  alreadySignaled.killCalls = [];
  alreadySignaled.kill = (signal) => {
    alreadySignaled.killCalls.push(signal);
    return false;
  };
  const alreadyResult = await stopChild(alreadySignaled, {
    terminationGraceMs: 5,
    killWaitMs: 5,
  });
  assert.equal(alreadyResult.alreadyExited, true);
  assert.deepEqual(alreadySignaled.killCalls, []);

  const stubborn = new EventEmitter();
  stubborn.exitCode = null;
  stubborn.signalCode = null;
  stubborn.killCalls = [];
  stubborn.kill = (signal) => {
    stubborn.killCalls.push(signal);
    if (signal === 'SIGKILL') {
      setTimeout(() => {
        stubborn.signalCode = 'SIGKILL';
        stubborn.emit('close', null, 'SIGKILL');
      }, 1);
    }
    return true;
  };
  const stubbornResult = await stopChild(stubborn, {
    terminationGraceMs: 5,
    killWaitMs: 100,
  });
  assert.deepEqual(stubborn.killCalls, ['SIGTERM', 'SIGKILL']);
  assert.equal(stubbornResult.killEscalated, true);
  assert.equal(stubbornResult.signalCode, 'SIGKILL');

  const unkillable = new EventEmitter();
  unkillable.exitCode = null;
  unkillable.signalCode = null;
  unkillable.kill = () => true;
  const started = Date.now();
  await assert.rejects(
    stopChild(unkillable, {terminationGraceMs: 5, killWaitMs: 5}),
    /did not exit within 5ms SIGTERM grace and 5ms SIGKILL wait/,
  );
  assert.ok(Date.now() - started < 500);
});

test('RSC abort classifier remains narrowly scoped', () => {
  assert.equal(isExpectedRscAbort(
    'http://127.0.0.1:1234/courses/5/4?_rsc=abc',
    'net::ERR_ABORTED',
  ), true);
  assert.equal(isExpectedRscAbort(
    'http://127.0.0.1:1234/courses/5/4',
    'net::ERR_ABORTED',
  ), false);
  assert.equal(isExpectedRscAbort(
    'http://127.0.0.1:1234/courses/5/4?_rsc=abc',
    'net::ERR_FAILED',
  ), false);
});
