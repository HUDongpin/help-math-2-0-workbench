import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  assertExpectedPageModuleDelta,
  assertReceiptFingerprint,
  buildPageModuleDelta,
  DECLARED_FUNCTIONAL_PAGES,
  EXPECTED_PAGE_MODULE_DELTA_IDS,
  parseRegressionArguments,
  summarizeInventoryRows,
  validateBrowserReportStructure,
  validateSourceInventoryDocument,
  withReceiptFingerprint,
} from './build-g4-l3-v31-post-v3-regression-receipt.mjs';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function browserFixture() {
  const traversal = (prefix, count) => ({
    pageCount: count,
    animationIds: Array.from({length: count}, (_, index) =>
      `${prefix}${String(index + 1).padStart(3, '0')}`
    ),
    runtimeObservations: Array.from({length: count}, (_, index) => {
      const animationId = `${prefix}${String(index + 1).padStart(3, '0')}`;
      return {
        animationId,
        runtimeCount: 1,
        runtimeAnimationId: animationId,
        forbiddenLegacyEmbedCount: 0,
      };
    }),
  });
  return {
    schemaVersion: 1,
    reportType: 'g4-l3-v31-post-v3-browser-qa',
    summary: {
      status: 'pass-current-js-regression',
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
    },
    server: {
      host: '127.0.0.1',
      port: 43217,
      allocation: 'ephemeral-exclusive-loopback-preflight',
    },
    wholeLessonTraversal: {
      g4L3: {
        en: traversal('course-g04-l03-fixture-', 39),
        es: traversal('course-g04-l03-fixture-', 39),
      },
      g5L4: {
        en: traversal('course-g05-l04-fixture-', 54),
        es: traversal('course-g05-l04-fixture-', 54),
      },
    },
    featureObservations: DECLARED_FUNCTIONAL_PAGES.map(({animationId}) => ({
      animationId,
      runtimeCount: 1,
      currentJsFunctionalMarkerCount: 1,
      strictAcceptanceEffect: 'none',
      strictMigrationComplete: false,
    })),
    keyTermsHostInteractions: [
      'course-g04-l03-rw-003',
      'course-g04-l03-vb-005',
      'course-g04-l03-vb-006',
    ].map((animationId) => ({
      animationId,
      opened: true,
      selectionResolved: true,
      closed: true,
      focusRestored: true,
      runtimeCount: 1,
      sourceStopHeldAfterClose:
        animationId === 'course-g04-l03-rw-003',
      explicitResumeClearedHold:
        animationId === 'course-g04-l03-rw-003',
    })),
    standaloneHostIsolation: {
      controlsEnabled: false,
      hostToolOpened: false,
      failedClosed: true,
    },
    g5Isolation: {
      g4SourceGlossarySurfaceCount: 0,
      g4SourceStopHoldCount: 0,
      g4HostSelectionCount: 0,
      passed: true,
    },
    responsiveObservations: [390, 700, 1024, 1366, 1600].map((width) => ({
      viewport: {width, height: 900},
      horizontalOverflowPx: 0,
      runtimeCount: 1,
    })),
    reducedMotion: {verified: true},
    events: {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      badHttpResponses: [],
      externalRequests: [],
      ignoredAbortedSameOriginKeyTermsRequests: [],
    },
    sourceInventory: {
      fileCount: 100,
      totalBytes: 10_000,
      sha256: 'a'.repeat(64),
    },
    screenshots: [390, 700, 1024, 1366, 1600].map((width) => ({
      path:
        `output/playwright/g4-l3-v31-post-v3-current-js-regression/${width}.png`,
      bytes: 100,
      sha256: 'b'.repeat(64),
    })),
    authority: {
      strictAcceptanceEffect: 'none',
      originalRuntimeFidelityEstablished: false,
      ownerAccepted: false,
      publicRelease: false,
    },
  };
}

test('receipt CLI exposes exactly one immutable run or read-only check mode', () => {
  assert.equal(parseRegressionArguments(['--run']), 'run');
  assert.equal(parseRegressionArguments(['--check']), 'check');
  assert.throws(() => parseRegressionArguments([]), /exactly one/);
  assert.throws(
    () => parseRegressionArguments(['--run', '--check']),
    /exactly one/,
  );
  assert.throws(() => parseRegressionArguments(['--build']), /exactly one/);
});

test('source inventory summary is canonical and rejects duplicate paths', () => {
  const rows = [
    {path: 'z/file.ts', bytes: 3, sha256: 'a'.repeat(64)},
    {path: 'a/file.ts', bytes: 7, sha256: 'b'.repeat(64)},
  ];
  const summary = summarizeInventoryRows(rows);
  assert.equal(summary.fileCount, 2);
  assert.equal(summary.totalBytes, 10);
  assert.match(summary.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(summary, summarizeInventoryRows([...rows].reverse()));
  assert.throws(
    () => summarizeInventoryRows([rows[0], rows[0]]),
    /duplicate paths/,
  );
});

test('source inventory schema remains acceptance-neutral and fail closed', () => {
  const files = [
    {path: 'apps/web/app/page.tsx', bytes: 3, sha256: 'a'.repeat(64)},
  ];
  const document = {
    schemaVersion: 1,
    reportType: 'g4-l3-v31-post-v3-source-inventory',
    inventoryType: 'g4-l3-v31-full-current-package-source-per-file',
    summary: summarizeInventoryRows(files),
    files,
    acceptanceBoundary: {
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
    },
  };
  assert.deepEqual(validateSourceInventoryDocument(document), []);
  document.acceptanceBoundary.exhaustiveByteDeltaFromV3Established = true;
  assert(validateSourceInventoryDocument(document).includes(
    'exhaustiveByteDeltaFromV3Established',
  ));
});

test('page-module comparison freezes 22 changed bindings without claiming exhaustive byte delta', () => {
  const changed = new Set(EXPECTED_PAGE_MODULE_DELTA_IDS);
  const ids = [
    ...EXPECTED_PAGE_MODULE_DELTA_IDS,
    ...Array.from({length: 17}, (_, index) =>
      `course-g04-l03-unchanged-${String(index + 1).padStart(2, '0')}`
    ),
  ];
  const baselinePages = ids.map((animationId, index) => ({
    animationId,
    globalPageOrdinal: index + 1,
    currentJavaScript: {
      module: {
        path: `packages/demos/src/modules/${animationId}.tsx`,
        bytes: 100,
        sha256: 'a'.repeat(64),
      },
    },
  }));
  const current = ids.map((animationId) => ({
    animationId,
    path: `packages/demos/src/modules/${animationId}.tsx`,
    bytes: changed.has(animationId) ? 101 : 100,
    sha256: changed.has(animationId) ? 'b'.repeat(64) : 'a'.repeat(64),
  }));
  const delta = buildPageModuleDelta(baselinePages, current);
  assert.equal(delta.changedPageModuleCount, 22);
  assert.equal(delta.unchangedPageModuleCount, 17);
  assert.equal(delta.exhaustiveByteDeltaFromV3Established, false);
  assert.equal(assertExpectedPageModuleDelta(delta), true);
  delta.changedAnimationIds = delta.changedAnimationIds.slice(1);
  assert.throws(() => assertExpectedPageModuleDelta(delta), /ordered 22-page set/);
});

test('current workspace resolves the frozen ordered 22-page module delta', async () => {
  const baselinePath = path.join(
    workspaceRoot,
    'reports/g4-l3-current-javascript-progress.json',
  );
  const baselineBytes = await readFile(baselinePath);
  assert.equal(
    hash(baselineBytes),
    'ffbc835525092c83a9cfad80c4146108ac56636fdcc7024dabe2692b96f2f105',
  );
  const baseline = JSON.parse(baselineBytes);
  assert.equal(
    baseline.reportType,
    'g4-l3-current-javascript-progress-acceptance-neutral',
  );
  const current = await Promise.all(baseline.pages.map(async (page) => {
    const relativePath = page.currentJavaScript.module.path;
    const bytes = await readFile(path.join(workspaceRoot, relativePath));
    return {
      animationId: page.animationId,
      path: relativePath,
      bytes: bytes.length,
      sha256: hash(bytes),
    };
  }));
  const delta = buildPageModuleDelta(baseline.pages, current);
  assert.equal(assertExpectedPageModuleDelta(delta), true);
  assert.deepEqual(delta.changedAnimationIds, EXPECTED_PAGE_MODULE_DELTA_IDS);
});

test('browser schema requires G4/G5 bilingual traversal, host isolation, and 0/40', () => {
  const report = browserFixture();
  assert.deepEqual(validateBrowserReportStructure(report), []);
  report.events.ignoredAbortedSameOriginKeyTermsRequests.push({
    url: 'https://example.com/generated/g4-grade-wide-keyterms-en.json',
    failure: 'net::ERR_ABORTED',
    disposition: 'superseded-by-whole-lesson-page-navigation',
  });
  assert(
    validateBrowserReportStructure(report).includes(
      'events.ignoredAbortedSameOriginKeyTermsRequests',
    ),
  );
  report.events.ignoredAbortedSameOriginKeyTermsRequests = [];
  report.server.port = 3216;
  report.wholeLessonTraversal.g5L4.es.runtimeObservations.pop();
  report.g5Isolation.g4HostSelectionCount = 1;
  const failures = validateBrowserReportStructure(report);
  assert(failures.includes('port 3216 is forbidden'));
  assert(failures.includes('G5 L4 es single-runtime traversal'));
  assert(failures.includes('G5 isolation'));
});

test('receipt compatibility mirrors satisfy the v3.1 package-builder contract', async () => {
  const {validateV31RegressionEvidence} = await import(
    './build-g4-l3-whole-lesson-package-mvp.mjs'
  );
  const sourceInventoryBinding = {
    path: 'reports/g4-l3-v31-post-v3-source-inventory.json',
    bytes: 123,
    sha256: 'c'.repeat(64),
  };
  const truthBoundary = {
    declaredFunctionalPageInventoryComplete: true,
    declaredFunctionalMarkersObserved: true,
    functionalInteractionCompletenessEstablished: false,
    fullCurrentV31SourceInventoryBound: true,
    exhaustiveByteDeltaFromV3Established: false,
    strictAcceptanceEffect: 'none',
  };
  const report = {
    schemaVersion: 1,
    reportType: 'g4-l3-v31-post-v3-current-js-regression',
    summary: {
      status: 'pass-current-js-regression',
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
    },
    truthBoundary,
    sourceInventoryBinding,
  };
  const sourceInventory = {
    schemaVersion: 1,
    reportType: 'g4-l3-v31-post-v3-source-inventory',
    files: [{
      path: 'apps/web/app/page.tsx',
      bytes: 10,
      sha256: 'd'.repeat(64),
    }],
  };
  assert.deepEqual(validateV31RegressionEvidence(
    report,
    sourceInventory,
    sourceInventoryBinding,
    {
      reportType: 'g4-l3-v31-post-v3-current-js-regression',
      sourceInventoryType: 'g4-l3-v31-post-v3-source-inventory',
    },
  ), truthBoundary);
  report.truthBoundary.exhaustiveByteDeltaFromV3Established = true;
  assert.throws(
    () => validateV31RegressionEvidence(
      report,
      sourceInventory,
      sourceInventoryBinding,
      {
        reportType: 'g4-l3-v31-post-v3-current-js-regression',
        sourceInventoryType: 'g4-l3-v31-post-v3-source-inventory',
      },
    ),
    /absent, stale, or failing/,
  );
});

test('receipt fingerprint is canonical and detects changed acceptance state', () => {
  const receipt = withReceiptFingerprint({
    schemaVersion: 1,
    receiptId: 'g4-l3-v31-post-v3-current-js-regression',
    strictCompleteMembers: 0,
    published: false,
  });
  assert.match(receipt.receiptFingerprintSha256, /^[a-f0-9]{64}$/);
  assert.equal(assertReceiptFingerprint(receipt), true);
  assert.throws(
    () => assertReceiptFingerprint({...receipt, published: true}),
    /fingerprint mismatch/,
  );
});

test('receipt generator uses immutable outputs and preserves the evidence boundary', async () => {
  const source = await readFile(
    new URL('./build-g4-l3-v31-post-v3-regression-receipt.mjs', import.meta.url),
    'utf8',
  );
  for (const expected of [
    'g4-l3-v31-post-v3-current-js-regression',
    'g4-l3-v31-post-v3-source-inventory',
    'sourceInventoryBinding',
    'truthBoundary',
    'declaredFunctionalPageInventoryComplete',
    'declaredFunctionalMarkersObserved',
    'functionalInteractionCompletenessEstablished',
    'fullCurrentV31SourceInventoryBound',
    'exhaustiveByteDeltaFromV3Established',
    "strictAcceptanceEffect: 'none'",
    'strictCompleteMembers: 0',
    "open(absolute(relativePath), 'wx', 0o444)",
    'EXPECTED_PAGE_MODULE_DELTA_IDS',
  ]) {
    assert(source.includes(expected), expected);
  }
  assert.doesNotMatch(source, /--publish|--owner-accept|--strict-complete/);
});
