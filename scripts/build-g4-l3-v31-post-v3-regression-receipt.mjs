#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  open,
  readFile,
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const RECEIPT_ID =
  'g4-l3-v31-post-v3-current-js-regression';
export const RECEIPT_JSON =
  'reports/g4-l3-v31-post-v3-current-js-regression.json';
export const SOURCE_INVENTORY_JSON =
  'reports/g4-l3-v31-post-v3-source-inventory.json';
export const RECEIPT_MARKDOWN =
  'outputs/g4-l3-v31-post-v3-current-js-regression.md';
export const BROWSER_QA_JSON =
  'reports/g4-l3-v31-post-v3-browser-qa.json';

const V3_PROGRESS_BASELINE = Object.freeze({
  path: 'reports/g4-l3-current-javascript-progress.json',
  sha256:
    'ffbc835525092c83a9cfad80c4146108ac56636fdcc7024dabe2692b96f2f105',
  authority:
    'v3-era-current-javascript-progress-page-module-binding-only',
});

const FROZEN_PREIMAGES = Object.freeze({
  v2Archive: Object.freeze({
    path: 'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip',
    sha256:
      '7bc8074677504ff3e923dc400fdd80a7fdaf01fec2402cec9869c9019f2e79f5',
  }),
  v2Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64/package-manifest.json',
    sha256:
      'd856fe7a3b2cf4dde7cf50c60c0e2da6c06ced5ef5b9943cdf1144e929f2f250',
  }),
  v3Archive: Object.freeze({
    path: 'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip',
    sha256:
      '3439af236f5e9c0d5bd100b364d44c1785a5fcdf0a02b1b9df761656b04d7ec3',
  }),
  v3Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64/package-manifest.json',
    sha256:
      '15e2c35511b67346493bda333cf4f1ec1f9bc87ea1802e43447fd99607b58ffe',
  }),
  v3DeliveryReceipt: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-delivery.json',
    sha256:
      '4d9683c347adf8439d96a10ea508dc7fdd0e54125220990dc66298d99e2ff433',
  }),
  ts008GeneratedRenderer: Object.freeze({
    path:
      'public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js',
    sha256:
      '30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6',
  }),
});

export const DECLARED_FUNCTIONAL_PAGES = Object.freeze([
  Object.freeze({
    animationId: 'course-g04-l03-rw-003',
    sourceSwfSha256:
      '783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335',
    functionalScope: 'source-bound-key-terms-and-source-stop-semantics',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-vb-005',
    sourceSwfSha256:
      '7595fa85408ef64720006e0e24a02505507aebfd89282a5709bab97e09b162d6',
    functionalScope: 'source-bound-key-terms-host-adapter',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-vb-006',
    sourceSwfSha256:
      'e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168',
    functionalScope: 'source-bound-key-terms-host-adapter',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-in-004',
    sourceSwfSha256:
      '2ac5cd71bbc57bd9761668a7c383f821fa52b91f1e68a7b4f14151410857dfad',
    functionalScope: 'source-script-bound-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-in-005',
    sourceSwfSha256:
      'dcbc74e5f8391afb0a307421729c8b5d5f548f3185c429fb40e7aae3cb647048',
    functionalScope: 'source-script-bound-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-in-010',
    sourceSwfSha256:
      'fab625d5c4028a72a3d5672c65884cc2b83ab4df6a318e26057f70469e9a8011',
    functionalScope: 'source-script-bound-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-in-012',
    sourceSwfSha256:
      'fa131c4cfad5619beb1343d0bfbc941bd9ffa59f190ae1b002f81d5f9d8cde55',
    functionalScope: 'source-script-bound-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-ts-007',
    sourceSwfSha256:
      'f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf',
    functionalScope: 'practice-test-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-ts-008',
    sourceSwfSha256:
      '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885',
    functionalScope: 'practice-test-current-js-interaction-and-readable-view',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-fq-002',
    sourceSwfSha256:
      'ab1940815259d7b73f9e9bf6e1f33351e00d3ec02e37286e480806409955882b',
    functionalScope: 'final-quiz-current-js-interaction',
  }),
  Object.freeze({
    animationId: 'course-g04-l03-fq-003',
    sourceSwfSha256:
      'f40e24b47e05de7dce02ac98344c8748b5941a67d908f85fc1fe152fe684b7dc',
    functionalScope: 'final-quiz-current-js-interaction',
  }),
]);

export const EXPECTED_PAGE_MODULE_DELTA_IDS = Object.freeze([
  'course-g04-l03-rw-003',
  'course-g04-l03-vb-003',
  'course-g04-l03-vb-005',
  'course-g04-l03-vb-006',
  'course-g04-l03-vb-007',
  'course-g04-l03-vb-008',
  'course-g04-l03-in-004',
  'course-g04-l03-in-005',
  'course-g04-l03-in-006',
  'course-g04-l03-in-008',
  'course-g04-l03-in-010',
  'course-g04-l03-in-012',
  'course-g04-l03-ti-002',
  'course-g04-l03-ti-003',
  'course-g04-l03-ti-004',
  'course-g04-l03-ti-005',
  'course-g04-l03-ti-006',
  'course-g04-l03-gs-002',
  'course-g04-l03-ts-007',
  'course-g04-l03-ts-008',
  'course-g04-l03-fq-002',
  'course-g04-l03-fq-003',
]);

const INVENTORY_ROOTS = Object.freeze([
  'apps/web/app',
  'apps/web/components',
  'apps/web/content',
  'apps/web/e2e',
  'apps/web/i18n',
  'apps/web/lib',
  'apps/web/public',
  'apps/web/tests',
  'components',
  'lib',
  'packages/demos/scripts',
  'packages/demos/src',
  'packages/demos/test',
  'packages/demos/tests',
]);

const INVENTORY_FILES = Object.freeze([
  'apps/web/eslint.config.mjs',
  'apps/web/next.config.ts',
  'apps/web/package.json',
  'apps/web/playwright.config.ts',
  'apps/web/postcss.config.mjs',
  'apps/web/proxy.ts',
  'apps/web/tsconfig.json',
  'packages/demos/package.json',
  'packages/demos/prototype-registry.json',
  'packages/demos/tsconfig.json',
  'scripts/build-g4-l3-v31-post-v3-regression-receipt.mjs',
  'scripts/build-g4-l3-v31-post-v3-regression-receipt.test.mjs',
  'scripts/build-g4-l3-whole-lesson-package-mvp.mjs',
  'scripts/build-g4-l3-whole-lesson-package-mvp.test.mjs',
  'scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs',
  'scripts/build-g4-l3-whole-lesson-package-v3-delivery.test.mjs',
  'scripts/qa-g4-l3-current-js-product.mjs',
  'scripts/qa-g4-l3-current-js-product.test.mjs',
  'scripts/qa-g4-l3-current-js-readability-v3.mjs',
  'scripts/qa-g4-l3-current-js-readability-v3.test.mjs',
  'scripts/qa-g4-l3-v31-post-v3-browser.mjs',
  'scripts/qa-g4-l3-v31-post-v3-browser.test.mjs',
  'package.json',
  'package-lock.json',
  'catalog/animations.json',
  'catalog/completion-ledger.json',
  'catalog/lesson-releases.json',
  'catalog/lesson-release-ledger.json',
  'catalog/lessons.json',
  'catalog/missing-references.json',
  'reports/g4-l3-lesson-product-navigation-contract.json',
  'reports/g5-l4-source-scope-freeze.json',
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml',
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf',
]);

const COURSE_ASSET_EXTENSIONS = new Set([
  '.js',
  '.mp3',
  '.png',
  '.svg',
  '.ttf',
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function safeRelative(relativePath, label = 'Path') {
  invariant(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes('\\')
      && relativePath.split('/').every((part) =>
        part !== '' && part !== '.' && part !== '..'
      ),
    `${label} must be safe and workspace-relative.`,
  );
  return relativePath;
}

function absolute(relativePath) {
  safeRelative(relativePath);
  return path.join(WORKSPACE_ROOT, relativePath);
}

async function binding(relativePath) {
  const metadata = await stat(absolute(relativePath));
  invariant(metadata.isFile(), `Required file is unavailable: ${relativePath}`);
  const bytes = await readFile(absolute(relativePath));
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(absolute(relativePath), 'utf8'));
}

async function walkFiles(relativeRoot, filter = () => true) {
  const rows = [];
  const root = absolute(relativeRoot);
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const target = path.join(directory, entry.name);
      const metadata = await lstat(target);
      invariant(!metadata.isSymbolicLink(), `Source inventory refuses symlink: ${target}`);
      if (metadata.isDirectory()) {
        await visit(target);
      } else if (metadata.isFile()) {
        const relativePath = path.relative(WORKSPACE_ROOT, target)
          .split(path.sep).join('/');
        if (filter(relativePath)) {
          const bytes = await readFile(target);
          rows.push({
            path: relativePath,
            bytes: bytes.length,
            sha256: sha256(bytes),
          });
        }
      }
    }
  }
  await visit(root);
  return rows;
}

export function summarizeInventoryRows(rows) {
  invariant(Array.isArray(rows) && rows.length > 0, 'Source inventory is empty.');
  const sorted = [...rows].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  invariant(
    new Set(sorted.map((row) => row.path)).size === sorted.length,
    'Source inventory contains duplicate paths.',
  );
  for (const row of sorted) {
    safeRelative(row.path, 'Source inventory path');
    invariant(Number.isSafeInteger(row.bytes) && row.bytes >= 0, `Invalid size: ${row.path}`);
    invariant(SHA256_PATTERN.test(row.sha256), `Invalid SHA-256: ${row.path}`);
  }
  const serialized = sorted.map((row) =>
    `${row.sha256} ${row.bytes} ${row.path}`
  ).join('\n');
  return {
    fileCount: sorted.length,
    totalBytes: sorted.reduce((sum, row) => sum + row.bytes, 0),
    sha256: sha256(Buffer.from(serialized)),
  };
}

function selectG4L3Release(document) {
  const release = document?.releases?.find((candidate) =>
    candidate?.releaseId === 'lesson-g04-l03-negative-numbers'
  );
  invariant(
    release?.publicationMode === 'atomic'
      && release?.expectedCounts?.activeXmlReferencedPages === 39
      && release?.expectedCounts?.courseShells === 1
      && release?.expectedCounts?.members === 40
      && Array.isArray(release?.members)
      && release.members.length === 40,
    'The exact G4 L3 39-page plus shell release is unavailable.',
  );
  const ids = release.members.map((member) => member.animationId);
  invariant(new Set(ids).size === 40, 'The G4 L3 release member set is malformed.');
  return release;
}

export async function buildFullCurrentSourceInventory() {
  const rows = [];
  for (const relativeRoot of INVENTORY_ROOTS) {
    rows.push(...await walkFiles(relativeRoot));
  }
  for (const relativePath of INVENTORY_FILES) {
    rows.push(await binding(relativePath));
  }
  const release = selectG4L3Release(
    await readJson('catalog/lesson-releases.json'),
  );
  for (const member of release.members) {
    const root = `public/flash-assets/courses/${member.animationId}`;
    rows.push(...await walkFiles(root, (relativePath) =>
      COURSE_ASSET_EXTENSIONS.has(path.extname(relativePath).toLowerCase())
    ));
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  const summary = summarizeInventoryRows(rows);
  return {
    schemaVersion: 1,
    reportType: 'g4-l3-v31-post-v3-source-inventory',
    inventoryType: 'g4-l3-v31-full-current-package-source-per-file',
    inventoryBoundary: {
      authoredRuntimeRoots: [...INVENTORY_ROOTS],
      exactRuntimeFiles: [...INVENTORY_FILES],
      releaseAssetRule:
        'all allowed runtime assets for the exact 39 pages plus one shell',
      excludedFromMeaning: [
        'node_modules',
        'Next.js build directories',
        'reports and outputs except the exact navigation contract',
        'private archives and original FLA/SWF binaries',
      ],
    },
    summary,
    files: rows,
    acceptanceBoundary: {
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
    },
  };
}

export function validateSourceInventoryDocument(document) {
  const failures = [];
  const fail = (condition, message) => {
    if (!condition) failures.push(message);
  };
  fail(document?.schemaVersion === 1, 'schemaVersion');
  fail(
    document?.reportType === 'g4-l3-v31-post-v3-source-inventory',
    'reportType',
  );
  fail(
    document?.inventoryType ===
      'g4-l3-v31-full-current-package-source-per-file',
    'inventoryType',
  );
  fail(Array.isArray(document?.files) && document.files.length > 0, 'files');
  if (Array.isArray(document?.files) && document.files.length > 0) {
    try {
      fail(
        stableJson(summarizeInventoryRows(document.files)) ===
          stableJson(document.summary),
        'summary',
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  fail(
    document?.acceptanceBoundary?.exhaustiveByteDeltaFromV3Established ===
      false,
    'exhaustiveByteDeltaFromV3Established',
  );
  fail(
    document?.acceptanceBoundary?.strictAcceptanceEffect === 'none',
    'strictAcceptanceEffect',
  );
  return failures;
}

export function buildPageModuleDelta(baselinePages, currentBindings) {
  invariant(Array.isArray(baselinePages) && baselinePages.length === 39,
    'Page-module baseline must contain exactly 39 pages.');
  invariant(Array.isArray(currentBindings) && currentBindings.length === 39,
    'Current page-module bindings must contain exactly 39 pages.');
  const currentById = new Map(currentBindings.map((row) => [row.animationId, row]));
  const rows = baselinePages.map((page) => {
    const baseline = page?.currentJavaScript?.module;
    const current = currentById.get(page?.animationId);
    invariant(current, `Missing current page module: ${page?.animationId}`);
    invariant(baseline?.path === current.path, `Page module path drift: ${page?.animationId}`);
    return {
      animationId: page.animationId,
      globalPageOrdinal: page.globalPageOrdinal,
      path: current.path,
      baselineV3EraBinding: {
        bytes: baseline.bytes,
        sha256: baseline.sha256,
      },
      currentV31Binding: {
        bytes: current.bytes,
        sha256: current.sha256,
      },
      changedFromV3EraModuleBinding:
        baseline.bytes !== current.bytes || baseline.sha256 !== current.sha256,
    };
  });
  const changed = rows.filter((row) => row.changedFromV3EraModuleBinding);
  return {
    comparisonKind: 'page-module-binding-only-independent-expression',
    baselineAuthority: V3_PROGRESS_BASELINE.authority,
    exhaustiveByteDeltaFromV3Established: false,
    pageCount: rows.length,
    changedPageModuleCount: changed.length,
    unchangedPageModuleCount: rows.length - changed.length,
    changedAnimationIds: changed.map((row) => row.animationId),
    rows,
  };
}

export function assertExpectedPageModuleDelta(delta) {
  invariant(delta?.pageCount === 39, 'Page-module delta must cover 39 pages.');
  invariant(delta?.changedPageModuleCount === 22,
    'Page-module delta must contain the frozen 22 changed-page bindings.');
  invariant(
    stableJson(delta?.changedAnimationIds) ===
      stableJson(EXPECTED_PAGE_MODULE_DELTA_IDS),
    'Page-module delta does not match the frozen ordered 22-page set.',
  );
  invariant(delta?.exhaustiveByteDeltaFromV3Established === false,
    'Page-module delta must remain explicitly non-exhaustive.');
  return true;
}

async function buildCurrentPageModuleBindings(baselinePages) {
  return Promise.all(baselinePages.map(async (page) => ({
    animationId: page.animationId,
    ...await binding(page.currentJavaScript.module.path),
  })));
}

function exactIdSet(values, expected) {
  return Array.isArray(values)
    && values.length === expected.length
    && new Set(values).size === expected.length
    && expected.every((value) => values.includes(value));
}

export function validateBrowserReportStructure(report) {
  const failures = [];
  const fail = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const declaredIds = DECLARED_FUNCTIONAL_PAGES.map((page) => page.animationId);
  const keyTermIds = [
    'course-g04-l03-rw-003',
    'course-g04-l03-vb-005',
    'course-g04-l03-vb-006',
  ];
  const g4 = report?.wholeLessonTraversal?.g4L3;
  const g5 = report?.wholeLessonTraversal?.g5L4;
  fail(report?.schemaVersion === 1, 'schemaVersion');
  fail(report?.reportType === 'g4-l3-v31-post-v3-browser-qa', 'reportType');
  fail(report?.summary?.status === 'pass-current-js-regression', 'summary.status');
  fail(report?.summary?.strictCompleteMembers === 0, 'strictCompleteMembers');
  fail(report?.summary?.releaseMembers === 40, 'releaseMembers');
  fail(report?.summary?.published === false, 'published');
  fail(report?.server?.host === '127.0.0.1', 'loopback host');
  fail(Number.isSafeInteger(report?.server?.port) && report.server.port > 0,
    'loopback port');
  fail(report?.server?.port !== 3216, 'port 3216 is forbidden');
  fail(report?.server?.allocation === 'ephemeral-exclusive-loopback-preflight',
    'ephemeral allocation');
  for (const [label, traversal, count, prefix] of [
    ['G4 L3', g4, 39, 'course-g04-l03-'],
    ['G5 L4', g5, 54, 'course-g05-l04-'],
  ]) {
    for (const locale of ['en', 'es']) {
      const observation = traversal?.[locale];
      fail(observation?.pageCount === count, `${label} ${locale} pageCount`);
      fail(
        Array.isArray(observation?.animationIds)
          && observation.animationIds.length === count
          && new Set(observation.animationIds).size === count
          && observation.animationIds.every((id) => id.startsWith(prefix)),
        `${label} ${locale} animation IDs`,
      );
      fail(
        Array.isArray(observation?.runtimeObservations)
          && observation.runtimeObservations.length === count
          && observation.runtimeObservations.every((row) =>
            row.runtimeCount === 1
              && row.runtimeAnimationId === row.animationId
              && row.forbiddenLegacyEmbedCount === 0
          ),
        `${label} ${locale} single-runtime traversal`,
      );
    }
  }
  const featureRows = report?.featureObservations;
  fail(
    exactIdSet(featureRows?.map((row) => row.animationId), declaredIds),
    '11 declared functional pages',
  );
  fail(
    Array.isArray(featureRows)
      && featureRows.every((row) =>
        row.runtimeCount === 1
          && row.currentJsFunctionalMarkerCount >= 1
          && row.strictAcceptanceEffect === 'none'
          && row.strictMigrationComplete === false
      ),
    'functional-page observations',
  );
  const keyTerms = report?.keyTermsHostInteractions;
  fail(
    exactIdSet(keyTerms?.map((row) => row.animationId), keyTermIds),
    'three source-bound key-term interactions',
  );
  fail(
    Array.isArray(keyTerms)
      && keyTerms.every((row) =>
        row.opened === true
          && row.selectionResolved === true
          && row.closed === true
          && row.focusRestored === true
          && row.runtimeCount === 1
      ),
    'key-term interaction result',
  );
  const rw003 = keyTerms?.find((row) =>
    row.animationId === 'course-g04-l03-rw-003'
  );
  fail(
    rw003?.sourceStopHeldAfterClose === true
      && rw003?.explicitResumeClearedHold === true,
    'RW003 source-stop semantics',
  );
  fail(
    report?.standaloneHostIsolation?.controlsEnabled === false
      && report?.standaloneHostIsolation?.hostToolOpened === false
      && report?.standaloneHostIsolation?.failedClosed === true,
    'standalone host isolation',
  );
  fail(
    report?.g5Isolation?.g4SourceGlossarySurfaceCount === 0
      && report?.g5Isolation?.g4SourceStopHoldCount === 0
      && report?.g5Isolation?.g4HostSelectionCount === 0
      && report?.g5Isolation?.passed === true,
    'G5 isolation',
  );
  const expectedWidths = [390, 700, 1024, 1366, 1600];
  fail(
    Array.isArray(report?.responsiveObservations)
      && report.responsiveObservations.length === expectedWidths.length
      && exactIdSet(
        report.responsiveObservations.map((row) => row.viewport.width),
        expectedWidths,
      )
      && report.responsiveObservations.every((row) =>
        row.horizontalOverflowPx <= 1 && row.runtimeCount === 1
      ),
    'responsive viewport observations',
  );
  fail(report?.reducedMotion?.verified === true, 'reduced motion');
  for (const key of [
    'consoleErrors',
    'pageErrors',
    'failedRequests',
    'badHttpResponses',
    'externalRequests',
  ]) {
    fail(Array.isArray(report?.events?.[key]) && report.events[key].length === 0,
      `events.${key}`);
  }
  fail(
    Array.isArray(
      report?.events?.ignoredAbortedSameOriginKeyTermsRequests,
    )
      && report.events.ignoredAbortedSameOriginKeyTermsRequests.every(
        (row) => {
          try {
            const url = new URL(row?.url);
            return row?.failure === 'net::ERR_ABORTED'
              && row?.disposition
                === 'superseded-by-whole-lesson-page-navigation'
              && url.protocol === 'http:'
              && url.hostname === '127.0.0.1'
              && Number(url.port) === report?.server?.port
              && url.username === ''
              && url.password === ''
              && url.search === ''
              && url.hash === ''
              && /^\/generated\/g4-grade-wide-keyterms-(?:en|es)\.json$/
                .test(url.pathname);
          } catch {
            return false;
          }
        },
      ),
    'events.ignoredAbortedSameOriginKeyTermsRequests',
  );
  fail(
    report?.sourceInventory?.fileCount > 0
      && report?.sourceInventory?.totalBytes > 0
      && SHA256_PATTERN.test(report?.sourceInventory?.sha256 ?? ''),
    'source inventory binding',
  );
  fail(
    Array.isArray(report?.screenshots)
      && report.screenshots.length >= 5
      && report.screenshots.every((row) =>
        safeBindingShape(row, 'output/playwright/')
      ),
    'screenshot bindings',
  );
  fail(report?.authority?.strictAcceptanceEffect === 'none',
    'strictAcceptanceEffect');
  fail(report?.authority?.originalRuntimeFidelityEstablished === false,
    'originalRuntimeFidelityEstablished');
  fail(report?.authority?.ownerAccepted === false, 'ownerAccepted');
  fail(report?.authority?.publicRelease === false, 'publicRelease');
  fail(!/\/(?:Users|Volumes)\//.test(JSON.stringify(report)),
    'absolute local path');
  return failures;
}

function safeBindingShape(row, prefix = '') {
  try {
    safeRelative(row?.path, 'Binding path');
    return row.path.startsWith(prefix)
      && Number.isSafeInteger(row.bytes)
      && row.bytes > 0
      && SHA256_PATTERN.test(row.sha256);
  } catch {
    return false;
  }
}

function canonicalFingerprintPayload(receipt) {
  const clone = structuredClone(receipt);
  delete clone.receiptFingerprintSha256;
  return stableJson(clone);
}

export function withReceiptFingerprint(receipt) {
  const next = structuredClone(receipt);
  next.receiptFingerprintSha256 = sha256(
    Buffer.from(canonicalFingerprintPayload(next)),
  );
  return next;
}

export function assertReceiptFingerprint(receipt) {
  const expected = sha256(Buffer.from(canonicalFingerprintPayload(receipt)));
  invariant(
    receipt?.receiptFingerprintSha256 === expected,
    'Regression receipt fingerprint mismatch.',
  );
  return true;
}

export function parseRegressionArguments(argv) {
  const modes = argv.filter((value) => ['--run', '--check'].includes(value));
  invariant(
    argv.length === 1 && modes.length === 1,
    'Use exactly one mode: --run or --check.',
  );
  return modes[0].slice(2);
}

async function assertFrozenPreimages() {
  const result = {};
  for (const [key, expected] of Object.entries(FROZEN_PREIMAGES)) {
    const actual = await binding(expected.path);
    invariant(actual.sha256 === expected.sha256,
      `Frozen preimage drifted: ${key} (${expected.path})`);
    result[key] = {...actual, unchanged: true};
  }
  return result;
}

async function assertBaselineProgress() {
  const actual = await binding(V3_PROGRESS_BASELINE.path);
  invariant(actual.sha256 === V3_PROGRESS_BASELINE.sha256,
    'The v3-era page-module baseline report drifted.');
  const document = await readJson(V3_PROGRESS_BASELINE.path);
  invariant(
    document?.reportType
      === 'g4-l3-current-javascript-progress-acceptance-neutral',
    'The v3-era progress baseline has the wrong report type.');
  invariant(Array.isArray(document.pages) && document.pages.length === 39,
    'The v3-era progress baseline must contain 39 pages.');
  return {binding: actual, document};
}

async function verifyScreenshotBindings(report) {
  for (const expected of report.screenshots) {
    const actual = await binding(expected.path);
    invariant(stableJson(actual) === stableJson(expected),
      `Browser screenshot drifted: ${expected.path}`);
  }
}

export function validateRegressionReceipt(receipt) {
  invariant(receipt?.schemaVersion === 1, 'Regression receipt schema drifted.');
  invariant(receipt?.receiptId === RECEIPT_ID, 'Regression receipt ID drifted.');
  invariant(receipt?.reportType === RECEIPT_ID,
    'Regression report type drifted.');
  invariant(receipt?.summary?.status === 'pass-current-js-regression',
    'Regression receipt is not passing.');
  invariant(receipt?.scope?.declaredFunctionalPageInventoryComplete === true,
    'Declared post-v3 functional-page inventory is incomplete.');
  invariant(receipt?.scope?.declaredFunctionalMarkersObserved === true,
    'Declared post-v3 functional markers were not all observed.');
  invariant(
    receipt?.scope?.functionalInteractionCompletenessEstablished === false,
    'Regression receipt must not claim complete interaction coverage.',
  );
  invariant(receipt?.scope?.fullCurrentV31SourceInventoryBound === true,
    'Full current v3.1 source inventory is not bound.');
  invariant(receipt?.scope?.exhaustiveByteDeltaFromV3Established === false,
    'Receipt must not claim an exhaustive byte delta from v3.');
  invariant(receipt?.scope?.strictAcceptanceEffect === 'none',
    'Receipt changed strict acceptance.');
  invariant(receipt?.scope?.strictCompleteMembers === 0
    && receipt?.scope?.releaseMembers === 40
    && receipt?.scope?.published === false,
  'Receipt changed the strict 0/40 unpublished boundary.');
  invariant(stableJson(receipt?.truthBoundary) === stableJson({
    declaredFunctionalPageInventoryComplete: true,
    declaredFunctionalMarkersObserved: true,
    functionalInteractionCompletenessEstablished: false,
    fullCurrentV31SourceInventoryBound: true,
    exhaustiveByteDeltaFromV3Established: false,
    strictAcceptanceEffect: 'none',
  }), 'Regression truth boundary drifted.');
  invariant(
    stableJson(receipt?.sourceInventoryBinding) ===
      stableJson(receipt?.sourceInventory?.artifact),
    'Regression source-inventory compatibility binding drifted.',
  );
  invariant(receipt?.pageModuleDelta?.pageCount === 39,
    'Receipt lacks the independent 39-page module expression.');
  assertExpectedPageModuleDelta(receipt.pageModuleDelta);
  invariant(
    exactIdSet(
      receipt?.declaredFunctionalPages?.map((row) => row.animationId),
      DECLARED_FUNCTIONAL_PAGES.map((row) => row.animationId),
    ),
    'Receipt lacks the exact 11-page declared functional scope.',
  );
  invariant(receipt?.browserQa?.validationFailureCount === 0,
    'Receipt browser QA is not passing.');
  invariant(
    validateBrowserReportStructure(receipt?.browserQa?.embeddedReport).length
      === 0,
    'Receipt does not embed a passing browser-QA observation.',
  );
  invariant(
    stableJson(receipt?.screenshots) ===
      stableJson(receipt?.browserQa?.embeddedReport?.screenshots),
    'Embedded browser-QA screenshot bindings drifted.',
  );
  assertReceiptFingerprint(receipt);
  invariant(!/\/(?:Users|Volumes)\//.test(JSON.stringify(receipt)),
    'Receipt contains an absolute local path.');
  return true;
}

export function regressionMarkdown(receipt) {
  return `# G4 L3 v3.1 Post-v3 Current-JS Regression Receipt

Generated: \`${receipt.generatedAt}\`

## Outcome

- Machine regression: \`${receipt.summary.status}\`
- Declared functional pages: \`${receipt.declaredFunctionalPages.length}/11\`
- Whole lesson: \`39/39\` pages + \`1/1\` shell
- Strict completion: \`0/40\`
- Published: \`false\`
- Strict acceptance effect: \`none\`

## Evidence boundary

This receipt binds the 11 declared post-v3 functional pages, an independent
39-page module comparison, the complete current v3.1 package-source inventory,
G4 L3 English/Spanish single-runtime traversal, and G5 L4 isolation.

The browser regression confirms that all 11 declared pages and their
current-JavaScript markers are present. It exercises Key Terms on VB005,
VB006, and RW003, but does not claim complete end-to-end interaction coverage
for every declared page; targeted module tests remain separate evidence.

\`exhaustiveByteDeltaFromV3Established\` remains \`false\`: frozen v3 stored an
aggregate package-input snapshot rather than a per-file preimage inventory.
The page-module comparison is therefore useful but is not represented as an
exhaustive repository or byte delta.

This is current-JavaScript candidate evidence. It does not establish original
Flash runtime fidelity, human visual or listening acceptance, Owner acceptance,
strict migration completion, or public release.

## Bound artifacts

- Source inventory: \`${receipt.sourceInventory.artifact.path}\` — \`${receipt.sourceInventory.artifact.sha256}\`
- Browser QA: \`${receipt.browserQa.report.path}\` — \`${receipt.browserQa.report.sha256}\`
- Frozen v3 ZIP: \`${receipt.frozenPreimages.v3Archive.sha256}\`
- Receipt fingerprint: \`${receipt.receiptFingerprintSha256}\`
`;
}

async function buildReceiptPayload(generatedAt, inventoryDocument) {
  const inventoryFailures = validateSourceInventoryDocument(inventoryDocument);
  invariant(inventoryFailures.length === 0,
    `Source inventory is invalid: ${inventoryFailures.join('; ')}`);
  const browserReport = await readJson(BROWSER_QA_JSON);
  const browserFailures = validateBrowserReportStructure(browserReport);
  invariant(browserFailures.length === 0,
    `Browser QA is invalid: ${browserFailures.join('; ')}`);
  invariant(
    stableJson(browserReport.sourceInventory) ===
      stableJson(inventoryDocument.summary),
    'Browser QA is not bound to the current v3.1 source inventory.',
  );
  await verifyScreenshotBindings(browserReport);
  const baseline = await assertBaselineProgress();
  const currentModuleBindings = await buildCurrentPageModuleBindings(
    baseline.document.pages,
  );
  const pageModuleDelta = buildPageModuleDelta(
    baseline.document.pages,
    currentModuleBindings,
  );
  assertExpectedPageModuleDelta(pageModuleDelta);
  const byId = new Map(pageModuleDelta.rows.map((row) => [row.animationId, row]));
  const declaredFunctionalPages = DECLARED_FUNCTIONAL_PAGES.map((declared) => ({
    ...declared,
    currentModule: byId.get(declared.animationId)?.currentV31Binding,
    modulePath: byId.get(declared.animationId)?.path,
    browserObserved: browserReport.featureObservations.some((row) =>
      row.animationId === declared.animationId
    ),
    strictAcceptanceEffect: 'none',
  }));
  invariant(declaredFunctionalPages.every((row) =>
    row.currentModule && row.browserObserved
  ), 'Declared functional-page binding is incomplete.');
  return withReceiptFingerprint({
    schemaVersion: 1,
    receiptId: RECEIPT_ID,
    reportType: RECEIPT_ID,
    title: 'G4 L3 v3.1 Post-v3 Current-JS Regression Receipt',
    generatedAt,
    summary: {
      status: 'pass-current-js-regression',
      declaredFunctionalPageCount: 11,
      pageModuleCount: 39,
      sourceInventoryFileCount: inventoryDocument.summary.fileCount,
      browserFailureCount: 0,
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
    },
    scope: {
      packageTarget: 'g4-l3-whole-lesson-package-mvp-v3-1',
      declaredFunctionalPageInventoryComplete: true,
      declaredFunctionalMarkersObserved: true,
      functionalInteractionCompletenessEstablished: false,
      fullCurrentV31SourceInventoryBound: true,
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
      activePages: 39,
      courseShells: 1,
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
    },
    truthBoundary: {
      declaredFunctionalPageInventoryComplete: true,
      declaredFunctionalMarkersObserved: true,
      functionalInteractionCompletenessEstablished: false,
      fullCurrentV31SourceInventoryBound: true,
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
    },
    frozenPreimages: await assertFrozenPreimages(),
    v3EraPageModuleBaseline: {
      ...baseline.binding,
      authority: V3_PROGRESS_BASELINE.authority,
      exhaustiveByteDeltaAuthority: false,
    },
    declaredFunctionalPages,
    pageModuleDelta,
    sourceInventory: {
      summary: inventoryDocument.summary,
      artifact: null,
    },
    browserQa: {
      report: await binding(BROWSER_QA_JSON),
      validationFailureCount: 0,
      summary: browserReport.summary,
      screenshots: browserReport.screenshots,
      embeddedReport: browserReport,
    },
    screenshots: browserReport.screenshots,
    authority: {
      currentJavascriptRegressionEstablished: true,
      originalRuntimeFidelityEstablished: false,
      fullFrameFidelityEstablished: false,
      humanVisualAccepted: false,
      audioListeningAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  });
}

async function openExclusiveArtifacts(paths) {
  const handles = [];
  try {
    for (const relativePath of paths) {
      handles.push({
        relativePath,
        handle: await open(absolute(relativePath), 'wx', 0o444),
      });
    }
    return handles;
  } catch (error) {
    await Promise.all(handles.map(async ({relativePath, handle}) => {
      await handle.close().catch(() => {});
      await rm(absolute(relativePath), {force: true}).catch(() => {});
    }));
    throw new Error(
      `Immutable regression output already exists or cannot be reserved: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function writeExclusiveBundle(inventory, receipt) {
  const paths = [SOURCE_INVENTORY_JSON, RECEIPT_JSON, RECEIPT_MARKDOWN];
  const handles = await openExclusiveArtifacts(paths);
  try {
    const inventoryBytes = Buffer.from(stableJson(inventory));
    const inventoryArtifact = {
      path: SOURCE_INVENTORY_JSON,
      bytes: inventoryBytes.length,
      sha256: sha256(inventoryBytes),
    };
    const finalReceipt = withReceiptFingerprint({
      ...receipt,
      sourceInventory: {
        ...receipt.sourceInventory,
        artifact: inventoryArtifact,
      },
      sourceInventoryBinding: inventoryArtifact,
    });
    const payloads = new Map([
      [SOURCE_INVENTORY_JSON, inventoryBytes],
      [RECEIPT_JSON, Buffer.from(stableJson(finalReceipt))],
      [RECEIPT_MARKDOWN, Buffer.from(regressionMarkdown(finalReceipt))],
    ]);
    for (const row of handles) {
      await row.handle.writeFile(payloads.get(row.relativePath));
      await row.handle.sync();
      await row.handle.close();
      await chmod(absolute(row.relativePath), 0o444);
    }
    return finalReceipt;
  } catch (error) {
    await Promise.all(handles.map(async ({relativePath, handle}) => {
      await handle.close().catch(() => {});
      await rm(absolute(relativePath), {force: true}).catch(() => {});
    }));
    throw error;
  }
}

async function runReceipt() {
  const inventory = await buildFullCurrentSourceInventory();
  const generatedAt = new Date().toISOString();
  const draftReceipt = await buildReceiptPayload(generatedAt, inventory);
  const finalReceipt = await writeExclusiveBundle(
    {...inventory, generatedAt},
    draftReceipt,
  );
  validateRegressionReceipt(finalReceipt);
  process.stdout.write(`${stableJson({
    status: finalReceipt.summary.status,
    receipt: RECEIPT_JSON,
    inventory: SOURCE_INVENTORY_JSON,
    markdown: RECEIPT_MARKDOWN,
    fingerprint: finalReceipt.receiptFingerprintSha256,
  })}`);
}

async function checkReceipt() {
  const [receipt, inventory, browserReport] = await Promise.all([
    readJson(RECEIPT_JSON),
    readJson(SOURCE_INVENTORY_JSON),
    readJson(BROWSER_QA_JSON),
  ]);
  validateRegressionReceipt(receipt);
  const inventoryFailures = validateSourceInventoryDocument(inventory);
  invariant(inventoryFailures.length === 0,
    `Source inventory check failed: ${inventoryFailures.join('; ')}`);
  const currentInventory = await buildFullCurrentSourceInventory();
  invariant(stableJson(currentInventory.summary) === stableJson(inventory.summary),
    'Current source inventory drifted from the immutable v3.1 receipt.');
  const inventoryArtifact = await binding(SOURCE_INVENTORY_JSON);
  invariant(stableJson(inventoryArtifact) ===
    stableJson(receipt.sourceInventory.artifact),
  'Source inventory artifact binding drifted.');
  const browserFailures = validateBrowserReportStructure(browserReport);
  invariant(browserFailures.length === 0,
    `Browser QA check failed: ${browserFailures.join('; ')}`);
  invariant(stableJson(await binding(BROWSER_QA_JSON)) ===
    stableJson(receipt.browserQa.report), 'Browser QA report binding drifted.');
  await verifyScreenshotBindings(browserReport);
  await assertFrozenPreimages();
  await assertBaselineProgress();
  const markdown = await binding(RECEIPT_MARKDOWN);
  invariant(markdown.bytes > 0, 'Regression Markdown is empty.');
  process.stdout.write(`${stableJson({
    status: 'pass-current-js-regression-check',
    receipt: RECEIPT_JSON,
    fingerprint: receipt.receiptFingerprintSha256,
  })}`);
}

async function main() {
  const mode = parseRegressionArguments(process.argv.slice(2));
  if (mode === 'run') await runReceipt();
  else await checkReceipt();
}

if (process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  });
}
