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
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {
  assertV3FrozenPreimages,
  assertV31FrozenPreimages,
  assertV32FrozenPreimages,
  assertV32R2FrozenPreimages,
  assertV33FrozenPreimages,
  assertV33R2FrozenPreimages,
  assertV33R3FrozenPreimages,
  assertPackageInputSnapshotCurrent,
  assertReportScreenshotBindings,
  assertReportSourceBindingsCurrent,
  buildCurrentPackageInputSnapshot,
  resolvePackageVariant,
  selectG4L3Release,
  V3_FROZEN_PREIMAGES,
  V31_FROZEN_PREIMAGES,
  V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS,
  V32_FAILED_SMOKE_ATTEMPT_PREIMAGES,
  V32_FROZEN_PREIMAGES,
  V32_R2_FROZEN_PREIMAGES,
  V32_PREIMPLEMENTATION_SOURCE_AUDIT,
  V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
  V33_FAILED_QA_ATTEMPT_PREIMAGES,
  V33_FROZEN_PREIMAGES,
  V33_R2_FROZEN_PREIMAGES,
  V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES,
  V33_R2_QA_HARNESS_REVISION,
  V33_R3_FROZEN_PREIMAGES,
  V33_R3_SMOKE_HARNESS_REVISION,
  validateV3ReadabilityEnhancements,
  validateV3ReadabilityReport,
} from './build-g4-l3-whole-lesson-package-mvp.mjs';
import {
  assertReceiptFingerprint as assertRegressionReceiptFingerprint,
  buildFullCurrentSourceInventory,
  DECLARED_FUNCTIONAL_PAGES,
  regressionMarkdown,
  validateBrowserReportStructure,
  validateRegressionReceipt,
  validateSourceInventoryDocument,
} from './build-g4-l3-v31-post-v3-regression-receipt.mjs';
import {
  renderMarkdown as renderProductQaMarkdown,
  validateReportStructure as validateProductQaReportStructure,
} from './qa-g4-l3-current-js-product.mjs';
import {
  renderReadabilityMarkdown,
  validateReadabilityReportStructure,
} from './qa-g4-l3-current-js-readability-v3.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RECEIPT_ID = 'g4-l3-whole-lesson-package-mvp-v3-delivery';
const RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3 Delivery Receipt';
const RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-delivery.json';
const RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-delivery-report.md';
const READABILITY_JSON = 'reports/g4-l3-current-js-readability-v3.json';
const READABILITY_MARKDOWN = 'reports/g4-l3-current-js-readability-v3.md';
const READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3';
const CONTROLLED_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-qa.json';
const CONTROLLED_QA_MARKDOWN =
  'reports/g4-l3-controlled-ceo-preview-qa.md';
const CONTROLLED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-qa';
const V3_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json';
const V3_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3';
const V31_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-1-delivery';
const V31_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.1 Delivery Receipt';
const V31_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json';
const V31_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md';
const V31_READABILITY_JSON =
  'reports/g4-l3-current-js-readability-v3-1.json';
const V31_READABILITY_MARKDOWN =
  'reports/g4-l3-current-js-readability-v3-1.md';
const V31_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-1';
const V31_CONTROLLED_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-1-qa.json';
const V31_CONTROLLED_QA_MARKDOWN =
  'reports/g4-l3-controlled-ceo-preview-v3-1-qa.md';
const V31_CONTROLLED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-1-qa';
const V31_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-1-smoke.json';
const V31_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-1';
const V31_REGRESSION_JSON =
  'reports/g4-l3-v31-post-v3-current-js-regression.json';
const V31_REGRESSION_SOURCE_INVENTORY_JSON =
  'reports/g4-l3-v31-post-v3-source-inventory.json';
const V31_REGRESSION_MARKDOWN =
  'outputs/g4-l3-v31-post-v3-current-js-regression.md';
const V31_REGRESSION_BROWSER_QA_JSON =
  'reports/g4-l3-v31-post-v3-browser-qa.json';
const V31_REGRESSION_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-v31-post-v3-current-js-regression';
const V32_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-2-delivery';
const V32_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.2 Delivery Receipt';
const V32_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-2-delivery.json';
const V32_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-2-delivery-report.md';
const V32_READABILITY_JSON =
  'reports/g4-l3-current-js-readability-v3-2.json';
const V32_READABILITY_MARKDOWN =
  'reports/g4-l3-current-js-readability-v3-2.md';
const V32_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-2';
const V32_CONTROLLED_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-2-qa.json';
const V32_CONTROLLED_QA_MARKDOWN =
  'reports/g4-l3-controlled-ceo-preview-v3-2-qa.md';
const V32_CONTROLLED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-2-qa';
const V32_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-2-smoke.json';
const V32_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2';
const V32_R2_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery';
const V32_R2_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.2-r2 Delivery Receipt';
const V32_R2_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json';
const V32_R2_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md';
const V32_R2_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json';
const V32_R2_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2';
const V33_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-3-delivery';
const V33_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.3 Delivery Receipt';
const V33_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json';
const V33_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md';
const V33_READABILITY_JSON =
  'reports/g4-l3-current-js-readability-v3-3.json';
const V33_READABILITY_MARKDOWN =
  'reports/g4-l3-current-js-readability-v3-3.md';
const V33_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-3';
const V33_CONTROLLED_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-3-qa.json';
const V33_CONTROLLED_QA_MARKDOWN =
  'reports/g4-l3-controlled-ceo-preview-v3-3-qa.md';
const V33_CONTROLLED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa';
const V33_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json';
const V33_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3';
const V33_R2_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery';
const V33_R2_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.3-r2 Delivery Receipt';
const V33_R2_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery.json';
const V33_R2_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery-report.md';
const V33_R2_READABILITY_JSON =
  'reports/g4-l3-current-js-readability-v3-3-r2.json';
const V33_R2_READABILITY_MARKDOWN =
  'reports/g4-l3-current-js-readability-v3-3-r2.md';
const V33_R2_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-3-r2';
const V33_R2_CONTROLLED_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.json';
const V33_R2_CONTROLLED_QA_MARKDOWN =
  'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.md';
const V33_R2_CONTROLLED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-3-r2-qa';
const V33_R2_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json';
const V33_R2_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r2';
const V33_R3_RECEIPT_ID =
  'g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery';
const V33_R3_RECEIPT_TITLE =
  'G4 L3 Whole-Lesson CEO Preview v3.3-r3 Delivery Receipt';
const V33_R3_RECEIPT_JSON =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery.json';
const V33_R3_RECEIPT_MARKDOWN =
  'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-report.md';
const V33_R3_SMOKE_REPORT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json';
const V33_R3_SMOKE_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r3';
const V33_R2_FAILED_SMOKE_RECEIPT = Object.freeze({
  path:
    'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
  bytes: 8526,
  sha256:
    '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
});
const V33_R3_DELIVERY_FAILED_ATTEMPT =
  'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-failed-attempt.json';
const V33_R3_DELIVERY_HARNESS_PREIMAGES = Object.freeze([
  Object.freeze({
    path: 'scripts/build-g4-l3-whole-lesson-package-v3-delivery.mjs',
    bytes: 146078,
    sha256:
      '4ca859ecfe0938485267f9923281ad6daf4386eac7a556994cead004d9443662',
  }),
  Object.freeze({
    path: 'scripts/build-g4-l3-whole-lesson-package-v3-delivery.test.mjs',
    bytes: 66506,
    sha256:
      '9f95162b0bf17a0aa21690e0ece58416df348122c7df128151553b9a324d728b',
  }),
]);
export const V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 1266,
  totalBytes: 191702749,
  sha256:
    'abe6bf7d97253b15002aaa0d08c198a3100f0c710a9dfffe40b82649457c42cf',
});
const V33_FAILED_QA_RECEIPT = Object.freeze({
  path: 'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
  bytes: 3211,
  sha256:
    '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
});
const V33_FAILED_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa';
const V32_R2_RECEIPT_FINGERPRINT_SHA256 =
  'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965';
const V32_R2_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 1264,
  totalBytes: 191299550,
  sha256:
    '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
});
const V2_PACKAGE_ROOT =
  'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64';
const V2_ARCHIVE =
  'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip';
const V2_ARCHIVE_CHECKSUM =
  'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip.sha256';
const TS008_RENDERER_PATHS = [
  'packages/demos/src/modules/course-g04-l03-ts-008.tsx',
  'packages/demos/src/timelines/course-g04-l03-ts-008.ts',
  'public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js',
  'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/readable-view-assets.json',
  'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-source.png',
];

const DELIVERY_VARIANTS = Object.freeze({
  v3: Object.freeze({
    version: 'v3',
    packageVersion: 'v3',
    receiptId: RECEIPT_ID,
    receiptTitle: RECEIPT_TITLE,
    receiptJson: RECEIPT_JSON,
    receiptMarkdown: RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: READABILITY_JSON,
      markdown: READABILITY_MARKDOWN,
      screenshotRoot: READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3',
      baseUrl: 'http://127.0.0.1:3216',
    }),
    controlledQa: Object.freeze({
      json: CONTROLLED_QA_JSON,
      markdown: CONTROLLED_QA_MARKDOWN,
      screenshotRoot: CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-qa',
      baseUrl: 'http://127.0.0.1:3216',
    }),
    smokeReport: V3_SMOKE_REPORT,
    smokeScreenshotRoot: V3_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V3_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV3FrozenPreimages,
    regression: null,
  }),
  'v3-1': Object.freeze({
    version: 'v3-1',
    packageVersion: 'v3-1',
    receiptId: V31_RECEIPT_ID,
    receiptTitle: V31_RECEIPT_TITLE,
    receiptJson: V31_RECEIPT_JSON,
    receiptMarkdown: V31_RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: V31_READABILITY_JSON,
      markdown: V31_READABILITY_MARKDOWN,
      screenshotRoot: V31_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-1',
      baseUrl: 'http://127.0.0.1:3217',
      artifactTitle: 'G4 L3 current-JS readability v3.1',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-1',
      artifactVersion: 'v3.1',
    }),
    controlledQa: Object.freeze({
      json: V31_CONTROLLED_QA_JSON,
      markdown: V31_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V31_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-1-qa',
      baseUrl: 'http://127.0.0.1:3217',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.1 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-1',
      artifactVersion: 'v3.1',
    }),
    smokeReport: V31_SMOKE_REPORT,
    smokeScreenshotRoot: V31_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V31_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV31FrozenPreimages,
    regression: Object.freeze({
      json: V31_REGRESSION_JSON,
      sourceInventory: V31_REGRESSION_SOURCE_INVENTORY_JSON,
      markdown: V31_REGRESSION_MARKDOWN,
      browserQa: V31_REGRESSION_BROWSER_QA_JSON,
      screenshotRoot: V31_REGRESSION_SCREENSHOT_ROOT,
      receiptId: 'g4-l3-v31-post-v3-current-js-regression',
      reportType: 'g4-l3-v31-post-v3-current-js-regression',
      sourceInventoryType: 'g4-l3-v31-post-v3-source-inventory',
      browserQaReportType: 'g4-l3-v31-post-v3-browser-qa',
    }),
  }),
  'v3-2': Object.freeze({
    version: 'v3-2',
    packageVersion: 'v3-2',
    buildable: false,
    receiptId: V32_RECEIPT_ID,
    receiptTitle: V32_RECEIPT_TITLE,
    receiptJson: V32_RECEIPT_JSON,
    receiptMarkdown: V32_RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: V32_READABILITY_JSON,
      markdown: V32_READABILITY_MARKDOWN,
      screenshotRoot: V32_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-2',
      baseUrl: 'http://127.0.0.1:3218',
      artifactTitle: 'G4 L3 current-JS readability v3.2',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-2',
      artifactVersion: 'v3.2',
    }),
    controlledQa: Object.freeze({
      json: V32_CONTROLLED_QA_JSON,
      markdown: V32_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V32_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-2-qa',
      baseUrl: 'http://127.0.0.1:3218',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.2 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-2',
      artifactVersion: 'v3.2',
    }),
    smokeReport: V32_SMOKE_REPORT,
    smokeScreenshotRoot: V32_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V32_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV32FrozenPreimages,
    regression: null,
  }),
  'v3-2-r2': Object.freeze({
    version: 'v3-2',
    artifactRevision: 'r2',
    packageVersion: 'v3-2-r2',
    buildable: false,
    receiptId: V32_R2_RECEIPT_ID,
    receiptTitle: V32_R2_RECEIPT_TITLE,
    receiptJson: V32_R2_RECEIPT_JSON,
    receiptMarkdown: V32_R2_RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: V32_READABILITY_JSON,
      markdown: V32_READABILITY_MARKDOWN,
      screenshotRoot: V32_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-2',
      baseUrl: 'http://127.0.0.1:3218',
      artifactTitle: 'G4 L3 current-JS readability v3.2',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-2',
      artifactVersion: 'v3.2',
    }),
    controlledQa: Object.freeze({
      json: V32_CONTROLLED_QA_JSON,
      markdown: V32_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V32_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-2-qa',
      baseUrl: 'http://127.0.0.1:3218',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.2 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-2',
      artifactVersion: 'v3.2',
    }),
    smokeReport: V32_R2_SMOKE_REPORT,
    smokeScreenshotRoot: V32_R2_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V32_R2_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV32R2FrozenPreimages,
    regression: null,
  }),
  'v3-3': Object.freeze({
    version: 'v3-3',
    packageVersion: 'v3-3',
    buildable: false,
    receiptId: V33_RECEIPT_ID,
    receiptTitle: V33_RECEIPT_TITLE,
    receiptJson: V33_RECEIPT_JSON,
    receiptMarkdown: V33_RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: V33_READABILITY_JSON,
      markdown: V33_READABILITY_MARKDOWN,
      screenshotRoot: V33_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 current-JS readability v3.3',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-3',
      artifactVersion: 'v3.3',
    }),
    controlledQa: Object.freeze({
      json: V33_CONTROLLED_QA_JSON,
      markdown: V33_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V33_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-qa',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.3 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-3',
      artifactVersion: 'v3.3',
    }),
    smokeReport: V33_SMOKE_REPORT,
    smokeScreenshotRoot: V33_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V33_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV33FrozenPreimages,
    regression: null,
  }),
  'v3-3-r2': Object.freeze({
    version: 'v3-3',
    artifactRevision: 'r2',
    packageVersion: 'v3-3-r2',
    buildable: false,
    receiptId: V33_R2_RECEIPT_ID,
    receiptTitle: V33_R2_RECEIPT_TITLE,
    receiptJson: V33_R2_RECEIPT_JSON,
    receiptMarkdown: V33_R2_RECEIPT_MARKDOWN,
    readability: Object.freeze({
      json: V33_R2_READABILITY_JSON,
      markdown: V33_R2_READABILITY_MARKDOWN,
      screenshotRoot: V33_R2_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3-r2',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 current-JS readability v3.3-r2',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-3-r2',
      artifactVersion: 'v3.3-r2',
    }),
    controlledQa: Object.freeze({
      json: V33_R2_CONTROLLED_QA_JSON,
      markdown: V33_R2_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V33_R2_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.3-r2 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-3-r2',
      artifactVersion: 'v3.3-r2',
    }),
    smokeReport: V33_R2_SMOKE_REPORT,
    smokeScreenshotRoot: V33_R2_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V33_R2_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV33R2FrozenPreimages,
    regression: null,
  }),
  'v3-3-r3': Object.freeze({
    version: 'v3-3',
    artifactRevision: 'r3',
    packageVersion: 'v3-3-r3',
    buildable: true,
    receiptId: V33_R3_RECEIPT_ID,
    receiptTitle: V33_R3_RECEIPT_TITLE,
    receiptJson: V33_R3_RECEIPT_JSON,
    receiptMarkdown: V33_R3_RECEIPT_MARKDOWN,
    // v3.3-r3 changes only the fresh-unzip smoke focus predicate. The
    // current-JS product and the already-published r2 QA/readability evidence
    // are byte-for-byte reused and remain independently bound below.
    readability: Object.freeze({
      json: V33_R2_READABILITY_JSON,
      markdown: V33_R2_READABILITY_MARKDOWN,
      screenshotRoot: V33_R2_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3-r2',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 current-JS readability v3.3-r2',
      sourceBindingKey: 'generator',
      artifactVariant: 'v3-3-r2',
      artifactVersion: 'v3.3-r2',
    }),
    controlledQa: Object.freeze({
      json: V33_R2_CONTROLLED_QA_JSON,
      markdown: V33_R2_CONTROLLED_QA_MARKDOWN,
      screenshotRoot: V33_R2_CONTROLLED_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
      baseUrl: 'http://127.0.0.1:3219',
      artifactTitle: 'G4 L3 Controlled CEO Preview v3.3-r2 QA',
      sourceBindingKey: 'productQaGenerator',
      artifactVariant: 'v3-3-r2',
      artifactVersion: 'v3.3-r2',
    }),
    smokeReport: V33_R3_SMOKE_REPORT,
    smokeScreenshotRoot: V33_R3_SMOKE_SCREENSHOT_ROOT,
    frozenPreimages: V33_R3_FROZEN_PREIMAGES,
    assertFrozenPreimages: assertV33R3FrozenPreimages,
    qaAndReadabilityEvidenceReusedFrom: 'v3-3-r2',
    regression: null,
  }),
});

const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function safeRelative(relativePath, label = 'Artifact') {
  if (
    typeof relativePath !== 'string'
    || relativePath.length === 0
    || path.isAbsolute(relativePath)
    || relativePath.includes('\\')
    || relativePath.split('/').some((part) =>
      part === '' || part === '.' || part === '..'
    )
  ) {
    throw new Error(`${label} path must be safe and workspace-relative.`);
  }
  return relativePath;
}

async function binding(relativePath) {
  safeRelative(relativePath);
  const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
  const metadata = await stat(absolutePath);
  if (!metadata.isFile()) {
    throw new Error(`Required delivery artifact is unavailable: ${relativePath}`);
  }
  return {
    path: relativePath,
    bytes: metadata.size,
    sha256: sha256(await readFile(absolutePath)),
  };
}

async function pngBindings(relativeRoot) {
  safeRelative(relativeRoot, 'Screenshot root');
  const absoluteRoot = path.join(WORKSPACE_ROOT, relativeRoot);
  const rows = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const metadata = await lstat(absolutePath);
      if (metadata.isSymbolicLink()) {
        throw new Error(`Screenshot evidence refuses symlink: ${absolutePath}`);
      }
      if (metadata.isDirectory()) {
        await visit(absolutePath);
      } else if (
        metadata.isFile()
        && path.extname(entry.name).toLowerCase() === '.png'
      ) {
        const relativePath = path.relative(
          WORKSPACE_ROOT,
          absolutePath,
        ).split(path.sep).join('/');
        rows.push({
          path: relativePath,
          bytes: metadata.size,
          sha256: sha256(await readFile(absolutePath)),
        });
      }
    }
  }
  await visit(absoluteRoot);
  rows.sort((left, right) => left.path.localeCompare(right.path));
  if (rows.length === 0) {
    throw new Error(`No PNG evidence exists under ${relativeRoot}.`);
  }
  return rows;
}

function assertSame(left, right, message) {
  if (stableJson(left) !== stableJson(right)) {
    throw new Error(message);
  }
}

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(WORKSPACE_ROOT, relativePath), 'utf8'),
  );
}

function assertAuthorityBoundary(manifest) {
  if (
    manifest?.release?.expectedMembers !== 40
    || manifest?.release?.activePages !== 39
    || manifest?.release?.courseShells !== 1
    || manifest?.release?.strictCompleteCount !== 0
    || manifest?.release?.published !== false
    || Object.values(manifest?.authority ?? {}).some((value) => value !== false)
  ) {
    throw new Error(
      'Delivery receipt refuses a changed strict, publication, or authority boundary.',
    );
  }
}

export function assertV32SuccessorRevision(actual) {
  const expectedPredecessor = {
    archive: structuredClone(V32_FROZEN_PREIMAGES.v31Archive),
    manifest: structuredClone(V32_FROZEN_PREIMAGES.v31Manifest),
    archiveChecksum:
      structuredClone(V32_FROZEN_PREIMAGES.v31ArchiveChecksum),
    smoke: structuredClone(V32_FROZEN_PREIMAGES.v31Smoke),
    deliveryReceipt:
      structuredClone(V32_FROZEN_PREIMAGES.v31DeliveryReceipt),
    deliveryReport:
      structuredClone(V32_FROZEN_PREIMAGES.v31DeliveryReport),
    postbuildSmokeRunner:
      structuredClone(V32_FROZEN_PREIMAGES.v31PostbuildSmokeRunner),
    receiptFingerprintSha256:
      '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580',
    unchanged: true,
  };
  const files = actual?.knownCompactLandscapeBatch?.files;
  const sourceBindingsMatch =
    Array.isArray(files)
    && files.length === V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS.length
    && files.every(
      ({bytes}) => Number.isSafeInteger(bytes) && bytes > 0,
    )
    && stableJson(files.map(({path: filePath, sha256: digest}) => ({
      path: filePath,
      sha256: digest,
    }))) === stableJson(V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS);
  if (
    actual?.predecessorPackageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-1'
    || stableJson(actual?.predecessor) !== stableJson(expectedPredecessor)
    || !sourceBindingsMatch
    || actual?.knownCompactLandscapeBatch?.fileCount !== 6
    || stableJson(
      actual?.knownCompactLandscapeBatch?.currentProductCopy,
    ) !== stableJson({
      english: 'Flash transport parity: not established',
      spanish: 'Paridad del transporte de Flash: no establecida',
    })
    || stableJson(
      actual?.knownCompactLandscapeBatch?.responsiveContract,
    ) !== stableJson({
      viewport: {width: 844, height: 390},
      toolbarColumns: 4,
      minimumInteractiveTargetPixels: 44,
      fullTransportBoundaryRemainsAssistiveTechnologyReadable: true,
      learningActionsSingleRow: true,
      horizontalOverflowTolerancePixels: 1,
    })
    || stableJson(
      actual?.primarySmokeSelectorClosure?.currentJavascriptFunctionalSelectors,
    ) !== stableJson([
      '[data-current-js-functional-candidate="true"]',
      '[data-current-js-functional-entry]',
      '[data-current-js-functional-scope]',
      '[data-current-js-modern-reconstruction="true"]',
    ])
    || actual?.primarySmokeSelectorClosure
      ?.keyTermsHostSelectionResolution !== 'matched-local-entry'
    || actual?.primarySmokeSelectorClosure
      ?.externalPostbuildSmokeRunnerRequired !== false
    || stableJson(actual?.preimplementationSourceAudit)
      !== stableJson(V32_PREIMPLEMENTATION_SOURCE_AUDIT)
    || actual?.preimplementationSourceAudit
      ?.exhaustiveCompactOnlyDelta !== false
    || actual?.finalSourceBoundary
      !== 'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench'
    || actual?.exhaustiveByteDeltaFromV31Established !== false
    || actual?.strictAcceptanceEffect !== 'none'
  ) {
    throw new Error(
      'The v3.2 successor manifest does not bind the exact frozen v3.1 closure, six-file compact subset, responsive contract, source audit, and primary smoke selectors.',
    );
  }
  return true;
}

export function assertV32SmokeHarnessRevision(actual) {
  const expected = {
    predecessorAttemptPackageId:
      'g4-l3-whole-lesson-package-mvp-v3-2',
    predecessorAttemptStatus:
      'superseded-after-primary-smoke-harness-failure',
    predecessorAttempt: {
      archive: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptArchive,
      ),
      manifest: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptManifest,
      ),
      archiveChecksum: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES
          .v32FailedSmokeAttemptArchiveChecksum,
      ),
      payloadChecksums: structuredClone(
        V32_FAILED_SMOKE_ATTEMPT_PREIMAGES
          .v32FailedSmokeAttemptPayloadChecksums,
      ),
      primaryBuilderSha256:
        'ef4bab3904eb1c7030486d9b7dc3ed66bcc733eaa5881ca461ae9caee71ed5e7',
      packageVerifierPassed: true,
      formalSmokeReportPublished: false,
      deliveryReceiptPublished: false,
      predecessorOverwritten: false,
      productFailureEstablished: false,
      unchanged: true,
    },
    changeClass: 'packaging-smoke-harness-only',
    authoredProductSourceChangedFromV32: false,
    correctedBeforePackaging: true,
    externalPostbuildCorrectionUsed: false,
    compactRootSelector: 'main.lesson-shell2',
    compactPageSelectionMechanism: 'visible-course-map-row',
    browserProfileIsolation:
      'resolved-resume-state-before-each-compact-scenario',
    resumeDecisionBeforeGeometry: 'resolved',
    sessionDecisionOverlayBeforeGeometry: 'closed',
    corrections: [
      {
        id: 'compact-visible-course-map-navigation',
        effect: 'smoke-harness-only',
      },
      {
        id: 'compact-shell-root-identity',
        effect: 'smoke-harness-only',
      },
      {
        id: 'compact-resume-state-isolation-and-settling',
        effect: 'smoke-harness-only',
      },
    ],
    strictAcceptanceEffect: 'none',
  };
  if (stableJson(actual) !== stableJson(expected)) {
    throw new Error(
      'The v3.2-r2 smoke-harness revision does not bind the failed v3.2 attempt and exact pre-package correction boundary.',
    );
  }
  return true;
}

function expectedV32R2PredecessorClosure() {
  return {
    archive: structuredClone(V33_FROZEN_PREIMAGES.v32R2Archive),
    manifest: structuredClone(V33_FROZEN_PREIMAGES.v32R2Manifest),
    archiveChecksum:
      structuredClone(V33_FROZEN_PREIMAGES.v32R2ArchiveChecksum),
    payloadChecksums:
      structuredClone(V33_FROZEN_PREIMAGES.v32R2PayloadChecksums),
    smoke: structuredClone(V33_FROZEN_PREIMAGES.v32R2Smoke),
    deliveryReceipt:
      structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReceipt),
    deliveryReport:
      structuredClone(V33_FROZEN_PREIMAGES.v32R2DeliveryReport),
    receiptFingerprintSha256: V32_R2_RECEIPT_FINGERPRINT_SHA256,
    sourceSnapshot: structuredClone(V32_R2_SOURCE_SNAPSHOT),
    unchanged: true,
  };
}

function assertV33DeclaredBatch(actual) {
  const files = actual?.files;
  const filesMatch =
    Array.isArray(files)
    && files.length === V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH.length
    && files.every(
      ({bytes}) => Number.isSafeInteger(bytes) && bytes > 0,
    )
    && stableJson(files.map(({
      path: filePath,
      sha256: digest,
      role,
      predecessor,
    }) => ({
      path: filePath,
      sha256: digest,
      role,
      predecessor,
    }))) === stableJson(V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH);
  if (
    !filesMatch
    || actual?.fileCount !== 6
    || stableJson(actual?.roleCounts) !== stableJson({
      authoredRuntime: 2,
      unitTest: 2,
      browserTest: 1,
      browserConfig: 1,
    })
    || actual?.predecessorPerFileAvailableCount !== 5
    || actual?.predecessorPerFileUnavailableCount !== 1
    || actual?.allSixChangedEstablished !== false
    || actual?.exhaustiveByteDeltaFromV32R2Established !== false
    || actual?.declaredBatchIsOnlyRepoDelta !== false
  ) {
    throw new Error(
      'The v3.3 declared six-file product/verification subset is malformed or overclaims an exhaustive repository delta.',
    );
  }
  return true;
}

function assertV33ManifestSuccessorRevision(actual) {
  if (
    actual?.predecessorPackageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-2-r2'
    || stableJson(actual?.predecessor)
      !== stableJson(expectedV32R2PredecessorClosure())
    || actual?.finalSourceBoundary
      !== 'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench'
    || actual?.authoredProductSourceChangedFromV32R2 !== true
    || actual?.fullCurrentV33SourceSnapshotBound !== true
    || actual?.exhaustiveByteDeltaFromV32R2Established !== false
    || actual?.declaredBatchIsOnlyRepoDelta !== false
    || actual?.strictAcceptanceEffect !== 'none'
  ) {
    throw new Error(
      'The v3.3 successor manifest does not bind the exact frozen v3.2-r2 closure and fail-closed source boundary.',
    );
  }
  assertV33DeclaredBatch(
    actual.declaredSixFileProductAndVerificationBatch,
  );
  return true;
}

export function assertV33ProductSourceSuccessorRevision(actual) {
  if (
    actual?.predecessorPackageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-2-r2'
    || stableJson(actual?.predecessor)
      !== stableJson(expectedV32R2PredecessorClosure())
    || actual?.authoredProductSourceChangedFromV32R2 !== true
    || actual?.fullCurrentV33PackageSourceSnapshotBound !== true
    || actual?.declaredBatchIsTheOnlyRepositoryDelta !== false
    || actual?.exhaustiveByteDeltaFromV32R2Established !== false
    || actual?.finalSourceBoundary
      !== 'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench'
    || actual?.strictAcceptanceEffect !== 'none'
  ) {
    throw new Error(
      'The v3.3 product-source successor receipt does not preserve its frozen predecessor, full-snapshot, non-exhaustive subset, and acceptance boundaries.',
    );
  }
  assertV33DeclaredBatch(
    actual.declaredSixFileProductAndVerificationBatch,
  );
  return true;
}

export function assertV33R2QaHarnessRevision(actual) {
  if (stableJson(actual) !== stableJson(V33_R2_QA_HARNESS_REVISION)) {
    throw new Error(
      'The v3.3-r2 QA-harness revision does not bind the failed v3.3 QA attempt and exact acceptance-neutral correction boundary.',
    );
  }
  return true;
}

export function assertV33R3SmokeHarnessRevision(actual) {
  if (stableJson(actual) !== stableJson(V33_R3_SMOKE_HARNESS_REVISION)) {
    throw new Error(
      'The v3.3-r3 smoke-harness revision does not bind the sealed v3.3-r2 failed-smoke attempt, exact responsive Key Terms focus contract, reused r2 product evidence, and acceptance-neutral correction boundary.',
    );
  }
  return true;
}

export function validateV33R2SmokeFailedAttemptDocument(failure) {
  const expectedFailureMessages = [
    'Key Terms host interaction failed for course-g04-l03-vb-005',
    'Key Terms host interaction failed for course-g04-l03-vb-006',
    'Key Terms host interaction failed for course-g04-l03-rw-003',
  ];
  const expectedAnimationIds = [
    'course-g04-l03-vb-005',
    'course-g04-l03-vb-006',
    'course-g04-l03-rw-003',
  ];
  const sealed = failure?.sealedPackage;
  const replay = failure?.isolatedDiagnosticReplay;
  const focusForensics = failure?.independentFreshUnzipFocusForensics;
  const focusObservations = focusForensics?.observations;
  const vectors = replay?.failingPredicateVector;
  const authority = failure?.authority;
  if (
    failure?.schemaVersion !== 1
    || failure?.reportType
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt'
    || failure?.status !== 'failed-before-formal-smoke-publication'
    || failure?.artifactIdentity?.variant !== 'v3-3-r2'
    || failure?.artifactIdentity?.version !== 'v3.3-r2'
    || failure?.artifactIdentity?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r2'
    || failure?.artifactIdentity?.entry
      !== 'http://127.0.0.1:3219/courses/4/3'
    || stableJson(sealed?.archive)
      !== stableJson({
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive.path,
        bytes: 70243770,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive.sha256,
      })
    || stableJson(sealed?.manifest)
      !== stableJson({
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Manifest.path,
        bytes: 153386,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Manifest.sha256,
      })
    || stableJson(sealed?.payloadChecksums)
      !== stableJson({
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2PayloadChecksums.path,
        bytes: 376085,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2PayloadChecksums.sha256,
      })
    || stableJson(sealed?.archiveChecksumFile)
      !== stableJson({
        path:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2ArchiveChecksum.path,
        bytes: 122,
        sha256:
          V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES
            .v33R2ArchiveChecksum.sha256,
      })
    || sealed?.packageVerifierPassed !== true
    || sealed?.installedAndArchivePackageCheckPassed !== true
    || sealed?.overwritten !== false
    || failure?.formalAttempt?.freshExtractedFinalZip !== true
    || failure?.formalAttempt?.freshExtractedFrozenV2Zip !== true
    || failure?.formalAttempt?.phase
      !== 'key-terms-host-focus-restoration'
    || failure?.formalAttempt?.officialSmokeJsonPublished !== false
    || failure?.formalAttempt?.officialSmokeScreenshotRootPublished !== false
    || failure?.formalAttempt?.deliveryReceiptPublished !== false
    || failure?.formalAttempt?.deliveryReportPublished !== false
    || stableJson(failure?.formalAttempt?.failureMessages)
      !== stableJson(expectedFailureMessages)
    || replay?.exactSealedR2ArchiveUsed !== true
    || replay?.exactFrozenV2ArchiveUsed !== true
    || replay?.diagnosticReplayOfSealedR2 !== true
    || replay?.diagnosticReport?.publishedAsFormalSmoke !== false
    || replay?.passingPredicates?.pagesRendered !== 39
    || replay?.passingPredicates?.audioUrlsChecked !== 72
    || replay?.passingPredicates?.exactSinglePrimaryRuntimeForEveryPage
      !== true
    || replay?.passingPredicates?.page36ReadableViewPassed !== true
    || replay?.passingPredicates?.page36FrozenV2PixelDifferenceCount !== 0
    || replay?.passingPredicates?.navigationPassed !== true
    || replay?.passingPredicates?.compactLandscapeEnglishPassed !== true
    || replay?.passingPredicates?.compactLandscapeSpanishPassed !== true
    || replay?.passingPredicates?.consoleErrors !== 0
    || replay?.passingPredicates?.pageErrors !== 0
    || replay?.passingPredicates?.badHttpResponses !== 0
    || replay?.passingPredicates?.failedRequests !== 0
    || replay?.passingPredicates?.externalRequests !== 0
    || replay?.passingPredicates?.privacyFindings !== 0
    || !Array.isArray(vectors)
    || stableJson(vectors.map(({animationId}) => animationId))
      !== stableJson(expectedAnimationIds)
    || vectors.some((row, index) =>
      row.selectionResolved !== true
      || row.runtimeCount !== 1
      || row.legacySourceHotspotFocusPredicate !== false
      || row.rowPassed !== false
      || (
        index === 2
        && (
          row.sourceStopHeldAfterClose !== true
          || row.explicitResumeClearedHold !== true
        )
      )
    )
    || focusForensics?.productSourceChanged !== false
    || focusForensics?.exactResponsiveFocusContractObservedForAllThree
      !== true
    || !Array.isArray(focusObservations)
    || stableJson(focusObservations.map(({animationId}) => animationId))
      !== stableJson(expectedAnimationIds)
    || focusObservations.some((row) =>
      row.activeTag !== 'BUTTON'
      || row.responsiveFocusKey !== 'key-terms'
      || row.sourceKey !== null
      || row.connected !== true
      || row.visible !== true
    )
    || failure?.rootCause?.classification
      !== 'stale-smoke-harness-focus-target-assertion'
    || failure?.rootCause?.productFailureEstablished !== false
    || failure?.rootCause?.authoredProductChangeRequired !== false
    || failure?.successorBoundary?.classification
      !== 'smoke-harness-focus-contract-correction-requires-new-revision'
    || failure?.successorBoundary?.r2PackagePublished !== true
    || failure?.successorBoundary?.r2PackageVerifierPassed !== true
    || failure?.successorBoundary?.r2FormalSmokePublished !== false
    || failure?.successorBoundary?.r2DeliveryReceiptPublished !== false
    || failure?.successorBoundary?.r2ArtifactsOverwritten !== false
    || failure?.successorBoundary?.productFailureEstablished !== false
    || failure?.successorBoundary?.authoredProductSourceChangeAuthorized
      !== false
    || failure?.successorBoundary?.nextRevision !== 'v3.3-r3'
    || failure?.successorBoundary?.strictAcceptanceEffect !== 'none'
    || stableJson(authority) !== stableJson({
      currentJavascriptCandidateOnly: true,
      originalRuntimeEvidence: false,
      flashFidelityEstablished: false,
      independentHumanAcceptance: false,
      ownerAcceptance: false,
      strictCompleteMembers: 0,
      releaseMembers: 40,
      published: false,
    })
  ) {
    throw new Error(
      'The v3.3-r2 smoke failed-attempt receipt does not preserve its exact sealed-package, three stale focus predicates, no-product-change, and strict-neutral successor boundary.',
    );
  }
  return true;
}

export function validateV33R3DeliveryFailedAttemptDocument(
  failure,
  {manifestBuild, currentSnapshot, currentBindings},
) {
  const expectedPackageClosure = {
    archive: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64.zip',
      bytes: 70245422,
      sha256:
        'a0f2cc59a942ccd8b879da09091590cb2dc75a7880f490a9fba8214d00df2968',
    },
    manifest: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64/package-manifest.json',
      bytes: 157322,
      sha256:
        'd1b32319290eed8a44b588b40fd515cbbb98329a5ba21d9142015ab3f1f49d44',
    },
    payloadChecksums: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64/CHECKSUMS.sha256',
      bytes: 376085,
      sha256:
        'd2fea13b2a6578786ac91fdfa3d0b4f2fef7483fef61350b6312eba1f88031dd',
    },
    archiveChecksum: {
      path:
        'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64.zip.sha256',
      bytes: 122,
      sha256:
        'f74100693e3ade26a37ac5cb73423a515a508bf625fde8d4f9af3ec98cdbf3bd',
    },
    smoke: {
      path:
        'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json',
      bytes: 58691,
      sha256:
        '6c7178649eca0903508b3a83074cc0d5daa62ea1ab8afd8096c4794547d33ea9',
    },
  };
  const expectedAuthority = {
    currentJavascriptCandidateOnly: true,
    originalRuntimeEvidence: false,
    flashFidelityEstablished: false,
    independentHumanAcceptance: false,
    ownerAcceptance: false,
    strictCompleteMembers: 0,
    releaseMembers: 40,
    published: false,
  };
  const manifestSnapshots = [
    manifestBuild?.inputSnapshotBefore,
    manifestBuild?.inputSnapshotAfter,
    manifestBuild?.inputSnapshotFinal,
  ];
  const currentPaths = currentBindings?.map(({path: relativePath}) =>
    relativePath
  );
  const expectedPaths = V33_R3_DELIVERY_HARNESS_PREIMAGES.map(
    ({path: relativePath}) => relativePath,
  );
  const currentBindingDelta = Array.isArray(currentBindings)
    ? currentBindings.reduce(
        (sum, row, index) =>
          sum + row.bytes - V33_R3_DELIVERY_HARNESS_PREIMAGES[index].bytes,
        0,
      )
    : Number.NaN;
  const currentSnapshotDelta =
    currentSnapshot?.totalBytes
    - V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT.totalBytes;
  const currentBindingsAreExactSuccessors =
    Array.isArray(currentBindings)
    && currentBindings.length === V33_R3_DELIVERY_HARNESS_PREIMAGES.length
    && stableJson(currentPaths) === stableJson(expectedPaths)
    && currentBindings.every((row, index) =>
      Number.isInteger(row?.bytes)
      && row.bytes > 0
      && /^[a-f0-9]{64}$/.test(row?.sha256 ?? '')
      && row.bytes !== V33_R3_DELIVERY_HARNESS_PREIMAGES[index].bytes
      && row.sha256 !== V33_R3_DELIVERY_HARNESS_PREIMAGES[index].sha256
    );
  if (
    failure?.schemaVersion !== 1
    || failure?.reportType
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-failed-attempt'
    || failure?.status !== 'failed-before-delivery-publication'
    || failure?.artifactIdentity?.variant !== 'v3-3-r3'
    || failure?.artifactIdentity?.version !== 'v3.3-r3'
    || failure?.artifactIdentity?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r3'
    || stableJson(failure?.packageClosure)
      !== stableJson(expectedPackageClosure)
    || failure?.deliveryAttempt?.phase
      !== 'manifest-package-smoke-harness-revision-binding'
    || failure?.deliveryAttempt?.error
      !== 'The v3.3-r3 smoke-harness revision does not bind the sealed v3.3-r2 failed-smoke attempt, exact responsive Key Terms focus contract, reused r2 product evidence, and acceptance-neutral correction boundary.'
    || failure?.deliveryAttempt?.receiptJsonPublished !== false
    || failure?.deliveryAttempt?.receiptMarkdownPublished !== false
    || failure?.deliveryAttempt?.packageChanged !== false
    || failure?.deliveryAttempt?.smokeChanged !== false
    || failure?.rootCause?.classification
      !== 'delivery-verifier-read-wrong-manifest-field'
    || failure?.rootCause?.manifestFieldWritten
      !== 'packageSmokeHarnessRevision'
    || failure?.rootCause?.manifestFieldRead
      !== 'smokeHarnessRevision'
    || failure?.rootCause?.manifestSourceField
      !== 'packageSmokeHarnessRevision'
    || failure?.preimageRestoration?.packageCheckPassed !== true
    || failure?.preimageRestoration?.packageCheckCommand
      !== 'node scripts/build-g4-l3-whole-lesson-package-mvp.mjs --v3-3-r3 --check'
    || failure?.preimageRestoration?.packageCheckExitCode !== 0
    || Number.isNaN(Date.parse(
      failure?.preimageRestoration?.packageCheckObservedAt ?? '',
    ))
    || failure?.preimageRestoration?.outcomeCharacterization
      !== 'hash-bound-recorded-preimage-outcome'
    || stableJson(failure?.preimageRestoration?.verifierSummary)
      !== stableJson({
        status: 'pass',
        packageId: 'g4-l3-whole-lesson-package-mvp-v3-3-r3',
        files: 2453,
        releaseMembers: 40,
        audioFiles: 72,
        strictCompleteMembers: 0,
        published: false,
      })
    || failure?.preimageRestoration?.exactManifestSnapshotRestored !== true
    || stableJson(failure?.preimageRestoration?.sourceSnapshot)
      !== stableJson(V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT)
    || manifestSnapshots.some((snapshot) =>
      stableJson(snapshot)
        !== stableJson(V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT)
    )
    || stableJson(failure?.preimageRestoration?.fileBindings)
      !== stableJson(V33_R3_DELIVERY_HARNESS_PREIMAGES)
    || failure?.correctedHarness?.changeClass !== 'delivery-harness-only'
    || failure?.correctedHarness?.exactChangedFileCount !== 2
    || failure?.correctedHarness?.scopeSemantics
      !== 'declared-exact-delivery-harness-files-not-exhaustive-repository-delta'
    || failure?.correctedHarness?.exhaustiveOtherCurrentTreeDeltaEstablished
      !== false
    || stableJson(failure?.correctedHarness?.exactChangedPaths)
      !== stableJson(expectedPaths)
    || !currentBindingsAreExactSuccessors
    || stableJson(failure?.correctedHarness?.currentBindings)
      !== stableJson(currentBindings)
    || stableJson(failure?.correctedHarness?.currentSourceSnapshot)
      !== stableJson(currentSnapshot)
    || currentSnapshot?.fileCount
      !== V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT.fileCount
    || stableJson(currentSnapshot)
      === stableJson(V33_R3_PACKAGE_BUILD_SOURCE_SNAPSHOT)
    || currentBindingDelta !== currentSnapshotDelta
    || failure?.correctedHarness?.currentSourceSnapshotByteDelta
      !== currentSnapshotDelta
    || failure?.correctedHarness?.currentPackageSourceSnapshotEqualsBuildSnapshot
      !== false
    || failure?.correctedHarness?.currentPackageSourceCheckExpectedResult
      !== 'reject-aggregate-drift'
    || failure?.correctedHarness?.authoredProductSourceChanged !== false
    || failure?.correctedHarness?.packageBytesChanged !== false
    || failure?.correctedHarness?.smokeBytesChanged !== false
    || failure?.correctedHarness?.externalProductPostbuildCorrectionUsed
      !== false
    || failure?.correctedHarness?.strictAcceptanceEffect !== 'none'
    || failure?.successorBoundary?.sameR3PackageRetained !== true
    || failure?.successorBoundary?.deliveryHarnessRevision !== 'r2'
    || failure?.successorBoundary?.productFailureEstablished !== false
    || failure?.successorBoundary?.ownerAcceptancePromoted !== false
    || failure?.successorBoundary?.publicationPromoted !== false
    || failure?.successorBoundary?.strictAcceptanceEffect !== 'none'
    || stableJson(failure?.authority) !== stableJson(expectedAuthority)
  ) {
    throw new Error(
      'The v3.3-r3 delivery failed-attempt receipt does not preserve its exact package closure, two-file delivery-harness successor, or acceptance-neutral boundary.',
    );
  }
  return true;
}

function productSourceSuccessorRevisionFromManifest(actual) {
  assertV33ManifestSuccessorRevision(actual);
  const revision = {
    predecessorPackageId: actual.predecessorPackageId,
    predecessor: structuredClone(actual.predecessor),
    declaredSixFileProductAndVerificationBatch: structuredClone(
      actual.declaredSixFileProductAndVerificationBatch,
    ),
    authoredProductSourceChangedFromV32R2:
      actual.authoredProductSourceChangedFromV32R2,
    fullCurrentV33PackageSourceSnapshotBound:
      actual.fullCurrentV33SourceSnapshotBound,
    declaredBatchIsTheOnlyRepositoryDelta:
      actual.declaredBatchIsOnlyRepoDelta,
    exhaustiveByteDeltaFromV32R2Established:
      actual.exhaustiveByteDeltaFromV32R2Established,
    finalSourceBoundary: actual.finalSourceBoundary,
    strictAcceptanceEffect: actual.strictAcceptanceEffect,
  };
  assertV33ProductSourceSuccessorRevision(revision);
  return revision;
}

async function validateArchiveChecksum(archiveBinding, checksumBinding) {
  const row = (
    await readFile(
      path.join(WORKSPACE_ROOT, checksumBinding.path),
      'utf8',
    )
  ).trim();
  const match = /^([a-f0-9]{64})  ([^/]+)$/.exec(row);
  if (
    !match
    || match[1] !== archiveBinding.sha256
    || match[2] !== path.basename(archiveBinding.path)
  ) {
    throw new Error(`Archive checksum does not bind ${archiveBinding.path}.`);
  }
}

async function runPackagedVerifier(packageRootRelative) {
  const result = spawnSync(process.execPath, ['verify.mjs'], {
    cwd: path.join(WORKSPACE_ROOT, packageRootRelative),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `Packaged verifier failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return JSON.parse(result.stdout);
}

function assertVersionedArtifactIdentity(report, descriptor, label) {
  if (!descriptor.artifactTitle) return true;
  const generatorSourceBinding =
    report?.sourceBindings?.[descriptor.sourceBindingKey];
  const expected = {
    variant: descriptor.artifactVariant,
    version: descriptor.artifactVersion,
    reportType: descriptor.reportType,
    title: descriptor.artifactTitle,
    generatorSourceBinding,
  };
  if (
    typeof generatorSourceBinding?.path !== 'string'
    || !Number.isSafeInteger(generatorSourceBinding?.bytes)
    || generatorSourceBinding.bytes <= 0
    || !/^[a-f0-9]{64}$/.test(generatorSourceBinding?.sha256 ?? '')
    || stableJson(report?.artifactIdentity) !== stableJson(expected)
  ) {
    throw new Error(
      `${label} does not bind the approved ${descriptor.artifactVersion} report type, title, version, and generator source.`,
    );
  }
  return true;
}

function controlledQaSummary(report, descriptor) {
  const summary = report?.summary;
  const expectedArtifactVersion = descriptor.artifactVariant ?? 'v3';
  const structuralFailures = validateProductQaReportStructure(
    report,
    {expectedArtifactVersion},
  );
  if (
    structuralFailures.length !== 0
    ||
    report?.schemaVersion !== 1
    || report?.reportType !== descriptor.reportType
    || report?.environment?.baseUrl !== descriptor.baseUrl
    || summary?.status !== 'pass-machine-verified-controlled-ceo-preview'
    || summary?.activePages !== 39
    || summary?.courseShells !== 1
    || summary?.releaseMembers !== 40
    || summary?.strictCompleteMembers !== 0
    || summary?.published !== false
    || summary?.uniqueRoutesVerified !== 82
    || summary?.routeVisits !== 121
    || summary?.failureCount !== 0
    || !Array.isArray(summary?.failures)
    || summary.failures.length !== 0
    || summary?.consoleErrors !== 0
    || summary?.pageErrors !== 0
    || summary?.failedRequests !== 0
    || summary?.badHttpResponses !== 0
    || report?.acceptance?.acceptanceNeutral !== true
    || report?.acceptance?.controlledCeoPreview !== true
    || report?.acceptance?.currentJavascriptProductQaPassed !== true
    || report?.acceptance?.authoritativeOriginalRuntimeComplete !== false
    || report?.acceptance?.humanVisualAccepted !== false
    || report?.acceptance?.ownerAccepted !== false
    || report?.acceptance?.strictMigrationComplete !== false
    || report?.acceptance?.lessonComplete !== false
  ) {
    throw new Error(
      `Controlled CEO Preview QA is not a current passing report: ${structuralFailures.join('; ')}`,
    );
  }
  assertVersionedArtifactIdentity(
    report,
    descriptor,
    'Controlled CEO Preview QA',
  );
  return {
    status: summary.status,
    activePages: summary.activePages,
    courseShells: summary.courseShells,
    releaseMembers: summary.releaseMembers,
    strictCompleteMembers: summary.strictCompleteMembers,
    published: summary.published,
    uniqueRoutesVerified: summary.uniqueRoutesVerified,
    routeVisits: summary.routeVisits,
  };
}

function assertSmokeReport(
  report,
  packageVariant,
  manifestBinding,
  archiveBinding,
  frozenV2ArchiveBinding,
  frozenV2ManifestBinding,
  manifest,
) {
  const parity = report?.page36FrozenV2Parity;
  const isSuccessor = packageVariant.version !== 'v3';
  const candidateKey = packageVariant.page36CandidateKey
    ?? (packageVariant.version === 'v3-1' ? 'v31' : 'v3');
  const candidateParity = parity?.[candidateKey];
  const candidateLoopbackPort = isSuccessor
    ? parity?.comparisonTopology?.candidateLoopbackPort
    : parity?.comparisonTopology?.v3LoopbackPort;
  const candidateWholeLessonObservation = isSuccessor
    ? parity?.comparisonTopology?.candidateWholeLessonObservation
    : parity?.comparisonTopology?.v3WholeLessonObservation;
  const secondRuntimeInCandidatePlayerDom = isSuccessor
    ? parity?.comparisonTopology?.secondRuntimeInCandidatePlayerDom
    : parity?.comparisonTopology?.secondRuntimeInV3PlayerDom;
  const candidateRgbaSha256 = isSuccessor
    ? parity?.candidateRgbaSha256
    : parity?.v3RgbaSha256;
  const expectedPageIds = manifest?.members
    ?.filter(
      ({releaseRole}) => releaseRole === 'active-xml-referenced-page',
    )
    .sort((left, right) => left.ordinal - right.ordinal)
    .map(({animationId}) => animationId) ?? [];
  const expectedFunctionalIds = DECLARED_FUNCTIONAL_PAGES.map(
    ({animationId}) => animationId,
  );
  const expectedKeyTermsIds = [
    'course-g04-l03-vb-005',
    'course-g04-l03-vb-006',
    'course-g04-l03-rw-003',
  ];
  const expectedReadableProfileIds = [
    'desktop-1440x900',
    'tablet-1024x768',
    'mobile-390x844',
    'reflow-200-percent-720x450',
  ];
  const expectedSmokeScreenshotRoot = path.posix.dirname(
    packageVariant.smokeScreenshotRelative,
  );
  const validSmokeScreenshot = (binding) =>
    typeof binding?.path === 'string'
    && binding.path.startsWith(`${expectedSmokeScreenshotRoot}/`)
    && Number.isSafeInteger(binding?.bytes)
    && binding.bytes > 0
    && /^[a-f0-9]{64}$/.test(binding?.sha256 ?? '');
  if (packageVariant.compactLandscapeChecks === true) {
    const compact = report?.compactLandscape;
    const validBounds = (bounds) =>
      bounds
      && [
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        bounds.right,
        bounds.bottom,
      ].every(Number.isFinite);
    const localeObservationPassed = (
      observation,
      {
        locale,
        badgeCopy,
        companionAnimationIds,
      },
    ) => {
      const actionRows = observation?.actions?.rows;
      const targetRows = observation?.targets?.rows;
      const companionPages = observation?.companionPages;
      const stage = observation?.stage;
      const toolbarBounds = observation?.toolbar?.bounds;
      const actionsBounds = observation?.actions?.bounds;
      const actionRowAligned =
        Array.isArray(actionRows)
        && actionRows.length === 3
        && actionRows.every(
          (row) => validBounds(row)
            && row.height >= 43.5
            && Math.abs(row.y - actionRows[0].y) <= 1,
        );
      const targetRowsValid =
        Array.isArray(targetRows)
        && targetRows.length === observation?.targets?.count
        && targetRows.length >= 12
        && targetRows.every(
          (row) => validBounds(row)
            && row.width >= 43.5
            && row.height >= 43.5
            && row.x >= -1
            && row.y >= -1
            && row.right <= 845
            && row.bottom <= 391,
        );
      const companionRowsValid =
        Array.isArray(companionPages)
        && stableJson(companionPages.map(({animationId}) => animationId))
          === stableJson(companionAnimationIds)
        && companionPages.every((row) =>
          row?.currentAnimationId === row?.animationId
          && row?.hostPresent === true
          && Number.isSafeInteger(row?.hostChildCount)
          && row.hostChildCount > 0
          && row?.runtimeCount === 1
          && row?.horizontalOverflowPx <= 1
          && (
            packageVariant.correctedCompactSmokeHarness !== true
            || (
              row?.selection?.animationId === row?.animationId
              && Number.isSafeInteger(row?.selection?.ordinal)
              && row.selection.ordinal > 0
              && typeof row?.selection?.sectionCode === 'string'
              && row.selection.sectionCode.length > 0
              && typeof row?.selection?.spanishTitleStatus === 'string'
              && row.selection.spanishTitleStatus.length > 0
              && row?.selection?.selectionMechanism
                === 'visible-course-map-row'
              && row?.selection?.mapClosedAfterSelection === true
            )
          )
          && row?.passed === true
          && validSmokeScreenshot(row?.screenshot)
        );
      return observation?.locale === locale
        && observation?.passed === true
        && (
          packageVariant.correctedCompactSmokeHarness !== true
          || (
            observation?.profileState?.hydrated === 'true'
            && observation?.profileState?.resumeDecision === 'resolved'
            && observation?.profileState?.sessionDecisionOverlay === 'closed'
            && observation?.profileState?.sessionDecisionKind === 'none'
            && observation?.initialSelection?.animationId
              === expectedPageIds[0]
            && observation?.initialSelection?.mapClosedAfterSelection === true
          )
        )
        && observation?.root?.layoutMode === 'compact'
        && observation?.root?.layoutDensity === 'comfortable'
        && observation?.root?.mapPresentation === 'overlay'
        && observation?.root?.toolPresentation === 'overlay'
        && observation?.root?.stageRenderMode === 'proportional-scale'
        && observation?.viewport?.width === 844
        && observation?.viewport?.height === 390
        && observation?.toolbar?.columns === 4
        && observation?.toolbar?.rows === 6
        && /-transport-boundary$/.test(
          observation?.toolbar?.describedBy ?? '',
        )
        && validBounds(toolbarBounds)
        && toolbarBounds.right <= 845
        && toolbarBounds.bottom <= 391
        && observation?.badge?.visible === true
        && observation?.badge?.text === badgeCopy
        && observation?.badge?.exactCopy === true
        && observation?.badge?.ariaHidden === 'true'
        && observation?.fullTransportBoundary?.present === true
        && observation?.fullTransportBoundary?.textLength >= 100
        && observation?.fullTransportBoundary?.ariaHidden === null
        && observation?.fullTransportBoundary?.display !== 'none'
        && observation?.fullTransportBoundary?.visibility !== 'hidden'
        && observation?.fullTransportBoundary?.position === 'absolute'
        && observation?.fullTransportBoundary?.clipPath !== 'none'
        && observation?.fullTransportBoundary?.width <= 1
        && observation?.fullTransportBoundary?.height <= 1
        && observation?.normalDisclosure?.present === true
        && observation?.normalDisclosure?.visible === true
        && observation?.normalDisclosure?.position !== 'absolute'
        && observation?.normalDisclosure?.textLength >= 100
        && validBounds(stage)
        && stage.width > 0
        && stage.height > 0
        && Math.abs(stage.width / stage.height - (4 / 3)) <= 0.02
        && stage.right <= toolbarBounds.x + 1
        && validBounds(actionsBounds)
        && actionsBounds.bottom <= 391
        && observation?.actions?.count === 3
        && observation?.actions?.sameRow === true
        && actionRowAligned
        && observation?.targets?.count >= 12
        && observation?.targets?.minimumWidth >= 43.5
        && observation?.targets?.minimumHeight >= 43.5
        && observation?.targets?.allWithinViewport === true
        && targetRowsValid
        && observation?.horizontalOverflowPx <= 1
        && observation?.runtimeCount === 1
        && observation?.primaryRuntimeCount === 1
        && companionRowsValid
        && validSmokeScreenshot(observation?.screenshot);
    };
    const compactPassed =
      compact?.passed === true
      && compact?.viewport?.width === 844
      && compact?.viewport?.height === 390
      && compact?.expectedToolbarColumns === 4
      && compact?.expectedToolbarRows === 6
      && compact?.minimumInteractiveTargetPixels === 44
      && localeObservationPassed(compact?.english, {
        locale: 'en',
        badgeCopy: 'Flash transport parity: not established',
        companionAnimationIds: [
          'course-g04-l03-fq-002',
          'course-g04-l03-fq-003',
        ],
      })
      && localeObservationPassed(compact?.spanish, {
        locale: 'es',
        badgeCopy: 'Paridad del transporte de Flash: no establecida',
        companionAnimationIds: [],
      })
      && compact?.strictAcceptanceEffect === 'none';
    if (!compactPassed) {
      throw new Error(
        `The ${packageVariant.version} compact-landscape smoke does not prove the exact responsive, disclosure, target-size, stage, overflow, companion, and single-runtime contract.`,
      );
    }
  }
  if (
    report?.schemaVersion !== 1
    || report?.reportType !== 'g4-l3-whole-lesson-package-smoke'
    || report?.packageId !== packageVariant.packageId
    || report?.packageManifestSha256 !== manifestBinding.sha256
    || report?.pagesExpected !== 39
    || report?.pagesRendered !== 39
    || report?.audioUrlsChecked !== 72
    || !Array.isArray(report?.failures)
    || report.failures.length !== 0
    || !Array.isArray(report?.consoleErrors)
    || report.consoleErrors.length !== 0
    || !Array.isArray(report?.pageErrors)
    || report.pageErrors.length !== 0
    || !Array.isArray(report?.badHttpResponses)
    || report.badHttpResponses.length !== 0
    || !Array.isArray(report?.runtimeObservations)
    || report.runtimeObservations.length !== 39
    || report.runtimeObservations.some(
      ({exactSingleRuntime}) => exactSingleRuntime !== true,
    )
    || report?.serverIdentity?.packageId
      !== packageVariant.packageId
    || report?.serverIdentity?.manifestSha256 !== manifestBinding.sha256
    || !Number.isSafeInteger(report?.serverIdentity?.loopbackPort)
    || report.serverIdentity.loopbackPort <= 0
    || report?.serverIdentity?.portAllocation
      !== 'ephemeral-exclusive-loopback-preflight'
    || report?.serverIdentity?.listenerOwnedBySpawnedChild !== true
    || report?.serverIdentity?.launcherEntry !== 'start.mjs'
    || report?.serverIdentity?.launchCommand
      !== `node start.mjs --port ${report?.serverIdentity?.loopbackPort}`
    || report?.serverIdentity?.listenerVerification
      !== 'lsof-spawned-process-tree-loopback-listen-before-and-after-http'
    || report?.privacyScan?.status !== 'pass'
    || !Number.isSafeInteger(report?.privacyScan?.filesScanned)
    || report.privacyScan.filesScanned <= 0
    || report?.privacyScan?.forbiddenPathFindings !== 0
    || report?.privacyScan?.forbiddenExtensionFindings !== 0
    || report?.privacyScan?.absoluteLocalPathFindings !== 0
    || !Array.isArray(report?.failedRequests)
    || report.failedRequests.length !== 0
    || !Array.isArray(report?.externalRequests)
    || report.externalRequests.length !== 0
    || report?.freshExtractedFinalZip !== true
    || report?.extractedPackageVerifier !== 'pass'
    || report?.postSmokePackageCheck?.status !== 'pass'
    || report?.postSmokePackageCheck
      ?.installedPackageAndFinalArchiveRechecked !== true
    || stableJson(report?.sourceArchive) !== stableJson(archiveBinding)
    || report?.frozenV2FreshExtractedFinalZip !== true
    || stableJson(report?.frozenV2SourceArchive)
      !== stableJson(frozenV2ArchiveBinding)
    || report?.frozenV2PackageManifestSha256
      !== frozenV2ManifestBinding.sha256
    || parity?.pageOrdinal !== 36
    || parity?.animationId !== 'course-g04-l03-ts-008'
    || parity?.frameDomain !== 'sprite-350'
    || parity?.frame !== 789
    || parity?.canvasBackingSize?.width !== 800
    || parity?.canvasBackingSize?.height !== 600
    || (
      isSuccessor
      && (
        parity?.candidateVersion !== packageVariant.version
        || parity?.comparisonTopology?.candidateVersion
          !== packageVariant.version
        || stableJson(parity?.candidate) !== stableJson(candidateParity)
        || parity?.v3 !== undefined
        || parity?.v3RgbaSha256 !== undefined
        || parity?.comparisonTopology?.v3LoopbackPort !== undefined
        || parity?.comparisonTopology?.v3WholeLessonObservation !== undefined
        || parity?.comparisonTopology?.secondRuntimeInV3PlayerDom !== undefined
      )
    )
    || candidateParity?.runtimeCountInPlayer !== 1
    || parity?.frozenV2?.runtimeCountInPlayer !== 1
    || candidateParity?.deterministicRoute
      !== '/animations/course-g04-l03-ts-008?frameDomain=sprite-350&frame=789&scenario=source-static-frame&lang=en&seed=0'
    || parity?.frozenV2?.deterministicRoute
      !== '/animations/course-g04-l03-ts-008?frameDomain=sprite-350&frame=789&scenario=source-static-frame&lang=en&seed=0'
    || secondRuntimeInCandidatePlayerDom !== false
    || candidateWholeLessonObservation?.exactSingleRuntime !== true
    || candidateLoopbackPort
      !== report.serverIdentity.loopbackPort
    || parity?.comparisonTopology?.frozenV2LoopbackPort
      === candidateLoopbackPort
    || report?.frozenV2ServerIdentity?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v2'
    || report?.frozenV2ServerIdentity?.manifestSha256
      !== frozenV2ManifestBinding.sha256
    || report?.frozenV2ServerIdentity?.loopbackPort
      !== parity?.comparisonTopology?.frozenV2LoopbackPort
    || report?.frozenV2ServerIdentity
      ?.listenerOwnedBySpawnedChild !== true
    || parity?.pixelDifferenceCount !== 0
    || parity?.channelDifferenceCount !== 0
    || !/^[a-f0-9]{64}$/.test(candidateRgbaSha256 ?? '')
    || candidateRgbaSha256 !== parity?.frozenV2RgbaSha256
    || stableJson(report?.authority) !== stableJson({
      originalRuntimeFullFrameAccepted: false,
      humanVisualAccepted: false,
      humanAudioAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicRelease: false,
    })
    || report?.navigation?.sequentialNavigation?.nextToPage2 !== true
    || report?.navigation?.sequentialNavigation?.previousToPage1 !== true
    || report?.navigation?.terminal?.repeatedActivationIdempotent !== true
    || (
      packageVariant.compactLandscapeChecks === true
      && (
        report?.smokeVerifier?.implementation
          !== (
            packageVariant.smokeVerifierImplementation
            ?? 'primary-package-builder'
          )
        || report?.smokeVerifier?.postbuildCorrectionUsed !== false
        || report?.smokeVerifier?.functionalEntrySelectorIncluded !== true
        || report?.smokeVerifier?.keyTermsResolution
          !== 'matched-local-entry'
        || report?.smokeVerifier?.strictAcceptanceEffect !== 'none'
        || (
          packageVariant.correctedCompactSmokeHarness === true
          && (
            report?.smokeVerifier?.compactRootSelector
              !== 'main.lesson-shell2'
            || report?.smokeVerifier?.compactPageSelectionMechanism
              !== 'visible-course-map-row'
            || report?.smokeVerifier?.browserProfileIsolation
              !== 'resolved-resume-state-before-each-compact-scenario'
            || report?.smokeVerifier?.resumeDecisionBeforeGeometry
              !== 'resolved'
            || report?.smokeVerifier?.sessionDecisionOverlayBeforeGeometry
              !== 'closed'
          )
        )
        || report?.smokeRunnerCorrection !== undefined
        || report?.compactLandscape?.passed !== true
        || report?.compactLandscape?.viewport?.width !== 844
        || report?.compactLandscape?.viewport?.height !== 390
        || report?.compactLandscape?.english?.toolbar?.columns !== 4
        || report?.compactLandscape?.english?.toolbar?.rows !== 6
        || report?.compactLandscape?.spanish?.toolbar?.columns !== 4
        || report?.compactLandscape?.spanish?.toolbar?.rows !== 6
        || report?.compactLandscape?.english?.badge?.text
          !== 'Flash transport parity: not established'
        || report?.compactLandscape?.spanish?.badge?.text
          !== 'Paridad del transporte de Flash: no establecida'
        || report?.compactLandscape?.english?.companionPages?.length !== 2
        || report.compactLandscape.english.companionPages.some(
          ({passed, screenshot}) =>
            passed !== true || !validSmokeScreenshot(screenshot),
        )
        || !validSmokeScreenshot(
          report?.compactLandscape?.english?.screenshot,
        )
        || !validSmokeScreenshot(
          report?.compactLandscape?.spanish?.screenshot,
        )
        || report?.compactLandscape?.strictAcceptanceEffect !== 'none'
      )
    )
    || (
      isSuccessor
      && (
        report?.pageTraversal?.exactManifestOrder !== true
        || report?.pageTraversal?.uniquePickerAnimationIds !== 39
        || report?.pageTraversal?.exactRealCourseMap !== true
        || report?.pageTraversal?.realCourseMapRows?.length !== 39
        || stableJson(report?.pageTraversal?.animationIds)
          !== stableJson(expectedPageIds)
        || stableJson(report?.pageTraversal?.realCourseMapRows?.map(
          ({animationId, ordinal}) => ({animationId, ordinal}),
        )) !== stableJson(expectedPageIds.map(
          (animationId, index) => ({animationId, ordinal: index + 1}),
        ))
        || report?.page36ReadableView?.passed !== true
        || report?.page36ReadableView?.exactSourceBinding !== true
        || stableJson(
          report?.page36ReadableView?.initial?.renderedTranscriptHashes,
        ) !== stableJson(manifest?.readabilityEnhancements?.crops?.map(
          ({transcriptSha256}) => transcriptSha256,
        ))
        || report?.page36ReadableView?.interactions?.passed !== true
        || report?.page36ReadableView?.layouts?.length !== 4
        || stableJson(report?.page36ReadableView?.layouts?.map(({id}) => id))
          !== stableJson(expectedReadableProfileIds)
        || report.page36ReadableView.layouts.some(
          ({passed, screenshot}) =>
            passed !== true || !validSmokeScreenshot(screenshot),
        )
        || report?.functionalObservations?.length !== 11
        || stableJson(report?.functionalObservations?.map(
          ({animationId}) => animationId,
        )) !== stableJson(expectedFunctionalIds)
        || report.functionalObservations.some(
          ({passed}) => passed !== true,
        )
        || report?.keyTermsHostInteractions?.length !== 3
        || stableJson(report?.keyTermsHostInteractions?.map(
          ({animationId}) => animationId,
        )) !== stableJson(expectedKeyTermsIds)
        || report.keyTermsHostInteractions.some(
          ({passed}) => passed !== true,
        )
        || report?.navigation?.sectionFirstPage?.passed !== true
        || report?.navigation?.courseMap?.passed !== true
      )
    )
  ) {
    throw new Error(
      `The ${packageVariant.version} smoke report does not prove verifier plus browser execution from the final ZIP.`,
    );
  }
}

export function parseDeliveryRequest(argv) {
  const modes = argv.filter((value) =>
    ['--build', '--check'].includes(value)
  );
  const versionFlags = argv.filter((value) =>
    [
      '--v3-1',
      '--v3-2',
      '--v3-2-r2',
      '--v3-3',
      '--v3-3-r2',
      '--v3-3-r3',
    ].includes(value)
  );
  const allowed = new Set([
    '--build',
    '--check',
    '--v3-1',
    '--v3-2',
    '--v3-2-r2',
    '--v3-3',
    '--v3-3-r2',
    '--v3-3-r3',
  ]);
  if (
    modes.length !== 1
    || versionFlags.length > 1
    || argv.some((value) => !allowed.has(value))
    || argv.length !== modes.length + versionFlags.length
  ) {
    throw new Error(
      'Use exactly one delivery mode: --build or --check; optionally add one mutually exclusive --v3-1, --v3-2, --v3-2-r2, --v3-3, --v3-3-r2, or --v3-3-r3 variant flag.',
    );
  }
  return {
    mode: modes[0].slice(2),
    version: versionFlags.length === 1 ? versionFlags[0].slice(2) : 'v3',
  };
}

export function parseDeliveryArguments(argv) {
  return parseDeliveryRequest(argv).mode;
}

export function resolveDeliveryReceiptVariant(version = 'v3') {
  const variant = DELIVERY_VARIANTS[version];
  if (!variant) {
    throw new Error(`Unsupported delivery receipt variant: ${version}`);
  }
  return variant;
}

export function withReceiptFingerprint(receiptWithoutFingerprint) {
  const receipt = structuredClone(receiptWithoutFingerprint);
  delete receipt.receiptFingerprintSha256;
  return {
    ...receipt,
    receiptFingerprintSha256: sha256(Buffer.from(stableJson(receipt))),
  };
}

export function assertReceiptFingerprint(receipt) {
  const expected = withReceiptFingerprint(receipt).receiptFingerprintSha256;
  if (receipt?.receiptFingerprintSha256 !== expected) {
    throw new Error('Delivery receipt fingerprint mismatch.');
  }
  return true;
}

function assertFrozenBinding(actual, expected, label) {
  if (
    actual.path !== expected.path
    || actual.sha256 !== expected.sha256
  ) {
    throw new Error(`${label} frozen preimage has drifted.`);
  }
}

async function collectFrozenV3Closure(deliveryVariant) {
  if (deliveryVariant.version !== 'v3-1') return null;
  const frozen = deliveryVariant.frozenPreimages;
  const [
    archive,
    manifest,
    archiveChecksum,
    deliveryReceipt,
  ] = await Promise.all([
    binding(frozen.v3Archive.path),
    binding(frozen.v3Manifest.path),
    binding(frozen.v3ArchiveChecksum.path),
    binding(frozen.v3DeliveryReceipt.path),
  ]);
  for (const [actual, expected, label] of [
    [archive, frozen.v3Archive, 'v3 ZIP'],
    [manifest, frozen.v3Manifest, 'v3 manifest'],
    [archiveChecksum, frozen.v3ArchiveChecksum, 'v3 ZIP checksum'],
    [deliveryReceipt, frozen.v3DeliveryReceipt, 'v3 delivery receipt'],
  ]) {
    assertFrozenBinding(actual, expected, label);
  }
  await validateArchiveChecksum(archive, archiveChecksum);
  const [manifestDocument, receiptDocument] = await Promise.all([
    readJson(manifest.path),
    readJson(deliveryReceipt.path),
  ]);
  assertAuthorityBoundary(manifestDocument);
  assertReceiptFingerprint(receiptDocument);
  if (
    manifestDocument?.packageId !== 'g4-l3-whole-lesson-package-mvp-v3'
    || receiptDocument?.receiptId !== RECEIPT_ID
    || receiptDocument?.package?.packageId !== manifestDocument.packageId
    || receiptDocument?.package?.archive?.sha256 !== archive.sha256
    || receiptDocument?.package?.manifest?.sha256 !== manifest.sha256
    || receiptDocument?.claimBoundary?.strictComplete !== false
    || receiptDocument?.claimBoundary?.publicRelease !== false
  ) {
    throw new Error('The frozen v3 package and delivery receipt closure is invalid.');
  }
  return {
    packageId: manifestDocument.packageId,
    archive,
    archiveChecksum,
    manifest,
    deliveryReceipt,
    expectedArchiveSha256: frozen.v3Archive.sha256,
    expectedManifestSha256: frozen.v3Manifest.sha256,
    expectedArchiveChecksumSha256: frozen.v3ArchiveChecksum.sha256,
    expectedDeliveryReceiptSha256: frozen.v3DeliveryReceipt.sha256,
    unchanged: true,
    strictCompleteMembers: manifestDocument.release.strictCompleteCount,
    published: manifestDocument.release.published,
  };
}

async function collectFrozenV31Closure(deliveryVariant) {
  if (deliveryVariant.version !== 'v3-2') return null;
  const frozen = deliveryVariant.frozenPreimages;
  const payloadChecksumPath =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64/CHECKSUMS.sha256';
  const [
    archive,
    manifest,
    archiveChecksum,
    smoke,
    deliveryReceipt,
    deliveryReport,
    postbuildSmokeRunner,
    payloadChecksum,
  ] = await Promise.all([
    binding(frozen.v31Archive.path),
    binding(frozen.v31Manifest.path),
    binding(frozen.v31ArchiveChecksum.path),
    binding(frozen.v31Smoke.path),
    binding(frozen.v31DeliveryReceipt.path),
    binding(frozen.v31DeliveryReport.path),
    binding(frozen.v31PostbuildSmokeRunner.path),
    binding(payloadChecksumPath),
  ]);
  for (const [actual, expected, label] of [
    [archive, frozen.v31Archive, 'v3.1 ZIP'],
    [manifest, frozen.v31Manifest, 'v3.1 manifest'],
    [archiveChecksum, frozen.v31ArchiveChecksum, 'v3.1 ZIP checksum'],
    [smoke, frozen.v31Smoke, 'v3.1 smoke'],
    [deliveryReceipt, frozen.v31DeliveryReceipt, 'v3.1 delivery receipt'],
    [deliveryReport, frozen.v31DeliveryReport, 'v3.1 delivery report'],
    [
      postbuildSmokeRunner,
      frozen.v31PostbuildSmokeRunner,
      'v3.1 postbuild smoke runner',
    ],
  ]) {
    assertFrozenBinding(actual, expected, label);
  }
  await validateArchiveChecksum(archive, archiveChecksum);
  const [manifestDocument, receiptDocument, smokeDocument] =
    await Promise.all([
      readJson(manifest.path),
      readJson(deliveryReceipt.path),
      readJson(smoke.path),
    ]);
  assertAuthorityBoundary(manifestDocument);
  assertReceiptFingerprint(receiptDocument);
  if (
    manifestDocument?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-1'
    || receiptDocument?.receiptId !== V31_RECEIPT_ID
    || receiptDocument?.receiptFingerprintSha256
      !== '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580'
    || receiptDocument?.package?.packageId !== manifestDocument.packageId
    || receiptDocument?.package?.archive?.sha256 !== archive.sha256
    || receiptDocument?.package?.manifest?.sha256 !== manifest.sha256
    || stableJson(receiptDocument?.package?.payloadChecksum)
      !== stableJson(payloadChecksum)
    || stableJson(receiptDocument?.verification?.smoke?.report)
      !== stableJson(smoke)
    || receiptDocument?.claimBoundary?.strictComplete !== false
    || receiptDocument?.claimBoundary?.strictCompleteMembers !== 0
    || receiptDocument?.claimBoundary?.ownerAccepted !== false
    || receiptDocument?.claimBoundary?.publicRelease !== false
    || receiptDocument?.claimBoundary?.published !== false
    || smokeDocument?.packageId !== manifestDocument.packageId
    || smokeDocument?.packageManifestSha256 !== manifest.sha256
    || stableJson(smokeDocument?.sourceArchive) !== stableJson(archive)
    || smokeDocument?.pagesRendered !== 39
    || smokeDocument?.audioUrlsChecked !== 72
    || smokeDocument?.failures?.length !== 0
    || smokeDocument?.freshExtractedFinalZip !== true
    || smokeDocument?.extractedPackageVerifier !== 'pass'
    || smokeDocument?.postSmokePackageCheck?.status !== 'pass'
    || smokeDocument?.postSmokePackageCheck
      ?.installedPackageAndFinalArchiveRechecked !== true
    || stableJson(smokeDocument?.authority) !== stableJson({
      originalRuntimeFullFrameAccepted: false,
      humanVisualAccepted: false,
      humanAudioAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicRelease: false,
    })
  ) {
    throw new Error(
      'The frozen v3.1 predecessor package and delivery closure is invalid.',
    );
  }
  return {
    packageId: manifestDocument.packageId,
    archive,
    archiveChecksum,
    manifest,
    payloadChecksum,
    smoke,
    deliveryReceipt,
    deliveryReport,
    postbuildSmokeRunner,
    receiptFingerprintSha256:
      receiptDocument.receiptFingerprintSha256,
    expectedArchiveSha256: frozen.v31Archive.sha256,
    expectedManifestSha256: frozen.v31Manifest.sha256,
    expectedArchiveChecksumSha256: frozen.v31ArchiveChecksum.sha256,
    expectedSmokeSha256: frozen.v31Smoke.sha256,
    expectedDeliveryReceiptSha256: frozen.v31DeliveryReceipt.sha256,
    expectedDeliveryReportSha256: frozen.v31DeliveryReport.sha256,
    expectedPostbuildSmokeRunnerSha256:
      frozen.v31PostbuildSmokeRunner.sha256,
    unchanged: true,
    strictCompleteMembers: manifestDocument.release.strictCompleteCount,
    published: manifestDocument.release.published,
  };
}

async function collectFrozenV32R2Closure(deliveryVariant) {
  if (deliveryVariant.version !== 'v3-3') return null;
  const frozen = deliveryVariant.frozenPreimages;
  const [
    archive,
    manifest,
    archiveChecksum,
    payloadChecksums,
    smoke,
    deliveryReceipt,
    deliveryReport,
  ] = await Promise.all([
    binding(frozen.v32R2Archive.path),
    binding(frozen.v32R2Manifest.path),
    binding(frozen.v32R2ArchiveChecksum.path),
    binding(frozen.v32R2PayloadChecksums.path),
    binding(frozen.v32R2Smoke.path),
    binding(frozen.v32R2DeliveryReceipt.path),
    binding(frozen.v32R2DeliveryReport.path),
  ]);
  for (const [actual, expected, label] of [
    [archive, frozen.v32R2Archive, 'v3.2-r2 ZIP'],
    [manifest, frozen.v32R2Manifest, 'v3.2-r2 manifest'],
    [
      archiveChecksum,
      frozen.v32R2ArchiveChecksum,
      'v3.2-r2 ZIP checksum',
    ],
    [
      payloadChecksums,
      frozen.v32R2PayloadChecksums,
      'v3.2-r2 payload checksums',
    ],
    [smoke, frozen.v32R2Smoke, 'v3.2-r2 smoke'],
    [
      deliveryReceipt,
      frozen.v32R2DeliveryReceipt,
      'v3.2-r2 delivery receipt',
    ],
    [
      deliveryReport,
      frozen.v32R2DeliveryReport,
      'v3.2-r2 delivery report',
    ],
  ]) {
    assertFrozenBinding(actual, expected, label);
  }
  await validateArchiveChecksum(archive, archiveChecksum);
  const [
    manifestDocument,
    receiptDocument,
    smokeDocument,
    deliveryMarkdownDocument,
  ] = await Promise.all([
    readJson(manifest.path),
    readJson(deliveryReceipt.path),
    readJson(smoke.path),
    readFile(path.join(WORKSPACE_ROOT, deliveryReport.path), 'utf8'),
  ]);
  assertAuthorityBoundary(manifestDocument);
  assertReceiptFingerprint(receiptDocument);
  if (
    manifestDocument?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-2-r2'
    || stableJson(manifestDocument?.build?.inputSnapshotFinal)
      !== stableJson(V32_R2_SOURCE_SNAPSHOT)
    || receiptDocument?.receiptId !== V32_R2_RECEIPT_ID
    || receiptDocument?.receiptFingerprintSha256
      !== V32_R2_RECEIPT_FINGERPRINT_SHA256
    || receiptDocument?.package?.packageId !== manifestDocument.packageId
    || stableJson(receiptDocument?.package?.archive) !== stableJson(archive)
    || stableJson(receiptDocument?.package?.archiveChecksum)
      !== stableJson(archiveChecksum)
    || stableJson(receiptDocument?.package?.manifest)
      !== stableJson(manifest)
    || stableJson(receiptDocument?.package?.payloadChecksum)
      !== stableJson(payloadChecksums)
    || stableJson(receiptDocument?.package?.sourceSnapshot)
      !== stableJson(V32_R2_SOURCE_SNAPSHOT)
    || stableJson(receiptDocument?.verification?.smoke?.report)
      !== stableJson(smoke)
    || receiptDocument?.claimBoundary?.strictComplete !== false
    || receiptDocument?.claimBoundary?.strictCompleteMembers !== 0
    || receiptDocument?.claimBoundary?.ownerAccepted !== false
    || receiptDocument?.claimBoundary?.publicRelease !== false
    || receiptDocument?.claimBoundary?.published !== false
    || smokeDocument?.schemaVersion !== 1
    || smokeDocument?.reportType
      !== 'g4-l3-whole-lesson-package-smoke'
    || smokeDocument?.packageId !== manifestDocument.packageId
    || smokeDocument?.packageManifestSha256 !== manifest.sha256
    || stableJson(smokeDocument?.sourceArchive) !== stableJson(archive)
    || smokeDocument?.pagesRendered !== 39
    || smokeDocument?.audioUrlsChecked !== 72
    || !Array.isArray(smokeDocument?.failures)
    || smokeDocument.failures.length !== 0
    || smokeDocument?.freshExtractedFinalZip !== true
    || smokeDocument?.extractedPackageVerifier !== 'pass'
    || smokeDocument?.postSmokePackageCheck?.status !== 'pass'
    || smokeDocument?.postSmokePackageCheck
      ?.installedPackageAndFinalArchiveRechecked !== true
    || stableJson(smokeDocument?.authority) !== stableJson({
      originalRuntimeFullFrameAccepted: false,
      humanVisualAccepted: false,
      humanAudioAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicRelease: false,
    })
    || deliveryMarkdownDocument !== deliveryMarkdown(receiptDocument)
  ) {
    throw new Error(
      'The frozen v3.2-r2 predecessor package, source snapshot, smoke, and delivery closure is invalid.',
    );
  }
  return {
    packageId: manifestDocument.packageId,
    archive,
    archiveChecksum,
    manifest,
    payloadChecksums,
    smoke,
    deliveryReceipt,
    deliveryReport,
    receiptFingerprintSha256:
      receiptDocument.receiptFingerprintSha256,
    sourceSnapshot: structuredClone(V32_R2_SOURCE_SNAPSHOT),
    expectedArchiveSha256: frozen.v32R2Archive.sha256,
    expectedManifestSha256: frozen.v32R2Manifest.sha256,
    expectedArchiveChecksumSha256:
      frozen.v32R2ArchiveChecksum.sha256,
    expectedPayloadChecksumsSha256:
      frozen.v32R2PayloadChecksums.sha256,
    expectedSmokeSha256: frozen.v32R2Smoke.sha256,
    expectedDeliveryReceiptSha256:
      frozen.v32R2DeliveryReceipt.sha256,
    expectedDeliveryReportSha256:
      frozen.v32R2DeliveryReport.sha256,
    unchanged: true,
    overwritten: false,
    strictCompleteMembers: manifestDocument.release.strictCompleteCount,
    published: manifestDocument.release.published,
  };
}

async function assertWorkspaceArtifactsAbsent(relativePaths, label) {
  const present = [];
  for (const relativePath of relativePaths) {
    safeRelative(relativePath, label);
    try {
      await lstat(path.join(WORKSPACE_ROOT, relativePath));
      present.push(relativePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  if (present.length !== 0) {
    throw new Error(`${label} must remain unpublished: ${present.join(', ')}`);
  }
}

async function collectFrozenV33FailedQaAttempt(deliveryVariant, manifest) {
  if (
    deliveryVariant.version !== 'v3-3'
    || !['r2', 'r3'].includes(deliveryVariant.artifactRevision)
  ) return null;

  assertV33R2QaHarnessRevision(manifest?.qaHarnessRevision);
  const failureReceipt = await binding(V33_FAILED_QA_RECEIPT.path);
  assertSame(
    failureReceipt,
    V33_FAILED_QA_RECEIPT,
    'The immutable v3.3 failed-QA receipt binding has drifted.',
  );
  const screenshotBindings = await pngBindings(
    V33_FAILED_QA_SCREENSHOT_ROOT,
  );
  const expectedScreenshotPreimages = Object.values(
    V33_FAILED_QA_ATTEMPT_PREIMAGES,
  ).filter(({path: relativePath}) => relativePath.endsWith('.png'))
    .sort((left, right) => left.path.localeCompare(right.path));
  const actualScreenshotPreimages = screenshotBindings.map(
    ({path: relativePath, sha256: digest}) => ({
      path: relativePath,
      sha256: digest,
    }),
  );
  assertSame(
    actualScreenshotPreimages,
    expectedScreenshotPreimages,
    'The preserved v3.3 failed-QA PNG preimages have drifted.',
  );

  const failure = await readJson(V33_FAILED_QA_RECEIPT.path);
  const screenshotTotalBytes = screenshotBindings.reduce(
    (total, {bytes}) => total + bytes,
    0,
  );
  if (
    failure?.schemaVersion !== 1
    || failure?.reportType
      !== 'g4-l3-controlled-ceo-preview-v3-3-failed-attempt'
    || failure?.status !== 'failed-before-final-report-publication'
    || failure?.artifactIdentity?.variant !== 'v3-3'
    || failure?.artifactIdentity?.version !== 'v3.3'
    || failure?.artifactIdentity?.baseUrl !== 'http://127.0.0.1:3219'
    || failure?.attempt?.phase !== 'replay-activation-wait'
    || failure?.attempt?.timeoutMs !== 30000
    || failure?.finalArtifactState?.jsonReportPublished !== false
    || failure?.finalArtifactState?.markdownReportPublished !== false
    || failure?.finalArtifactState?.screenshotRootPreserved !== true
    || failure?.finalArtifactState?.screenshotRoot
      !== V33_FAILED_QA_SCREENSHOT_ROOT
    || failure?.finalArtifactState?.screenshotFileCount !== 5
    || failure?.finalArtifactState?.screenshotTotalBytes !== screenshotTotalBytes
    || failure?.finalArtifactState?.screenshotTreeSha256
      !== '3b65a041d823e615aab11b1e89018d5af71fa38c5454dc351ed0b15f2ef29c10'
    || stableJson(failure?.finalArtifactState?.screenshots)
      !== stableJson(screenshotBindings)
    || failure?.successorBoundary?.classification
      !== 'qa-harness-timeout-requires-new-revision'
    || failure?.successorBoundary?.v33PackagePublished !== false
    || failure?.successorBoundary?.v33ZipPublished !== false
    || failure?.successorBoundary?.v33SmokePublished !== false
    || failure?.successorBoundary?.v33DeliveryReceiptPublished !== false
    || failure?.successorBoundary?.v33ArtifactsOverwritten !== false
    || failure?.successorBoundary?.productFailureEstablished !== false
    || failure?.successorBoundary?.authoredProductSourceChangeAuthorized
      !== false
    || failure?.successorBoundary?.nextRevision !== 'v3.3-r2'
    || failure?.successorBoundary?.strictAcceptanceEffect !== 'none'
    || failure?.authority?.currentJavascriptCandidateOnly !== true
    || failure?.authority?.originalRuntimeEvidence !== false
    || failure?.authority?.flashFidelityEstablished !== false
    || failure?.authority?.independentHumanAcceptance !== false
    || failure?.authority?.ownerAcceptance !== false
    || failure?.authority?.strictCompleteMembers !== 0
    || failure?.authority?.releaseMembers !== 40
    || failure?.authority?.published !== false
  ) {
    throw new Error(
      'The frozen v3.3 failed-QA attempt does not preserve its exact timeout, partial screenshot, non-product-failure, and strict-neutral boundary.',
    );
  }

  const v33Package = resolvePackageVariant('v3-3');
  const v33PackageRoot = path.relative(
    WORKSPACE_ROOT,
    v33Package.packageRoot,
  ).split(path.sep).join('/');
  await assertWorkspaceArtifactsAbsent([
    V33_CONTROLLED_QA_JSON,
    V33_CONTROLLED_QA_MARKDOWN,
    v33PackageRoot,
    path.relative(WORKSPACE_ROOT, v33Package.archivePath)
      .split(path.sep).join('/'),
    path.relative(WORKSPACE_ROOT, v33Package.archiveShaPath)
      .split(path.sep).join('/'),
    V33_SMOKE_REPORT,
    V33_SMOKE_SCREENSHOT_ROOT,
    V33_RECEIPT_JSON,
    V33_RECEIPT_MARKDOWN,
  ], 'The superseded v3.3 package/QA chain');

  return {
    failureReceipt,
    artifactIdentity: failure.artifactIdentity,
    status: failure.status,
    attempt: failure.attempt,
    finalArtifactState: failure.finalArtifactState,
    successorBoundary: failure.successorBoundary,
    authority: failure.authority,
    screenshots: screenshotBindings,
    qaHarnessRevision: structuredClone(manifest.qaHarnessRevision),
    unchanged: true,
    overwritten: false,
  };
}

async function collectFrozenV33R2SmokeFailedAttempt(
  deliveryVariant,
  manifest,
) {
  if (
    deliveryVariant.version !== 'v3-3'
    || deliveryVariant.artifactRevision !== 'r3'
  ) return null;

  assertV33R2QaHarnessRevision(manifest?.qaHarnessRevision);
  assertV33R3SmokeHarnessRevision(
    manifest?.packageSmokeHarnessRevision,
  );
  const frozen = V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES;
  const [
    archive,
    manifestBinding,
    payloadChecksums,
    archiveChecksum,
    failureReceipt,
  ] = await Promise.all([
    binding(frozen.v33R2Archive.path),
    binding(frozen.v33R2Manifest.path),
    binding(frozen.v33R2PayloadChecksums.path),
    binding(frozen.v33R2ArchiveChecksum.path),
    binding(V33_R2_FAILED_SMOKE_RECEIPT.path),
  ]);
  for (const [actual, expected, label] of [
    [archive, frozen.v33R2Archive, 'v3.3-r2 ZIP'],
    [manifestBinding, frozen.v33R2Manifest, 'v3.3-r2 manifest'],
    [
      payloadChecksums,
      frozen.v33R2PayloadChecksums,
      'v3.3-r2 payload checksums',
    ],
    [
      archiveChecksum,
      frozen.v33R2ArchiveChecksum,
      'v3.3-r2 ZIP checksum',
    ],
  ]) {
    assertFrozenBinding(actual, expected, label);
  }
  assertSame(
    failureReceipt,
    V33_R2_FAILED_SMOKE_RECEIPT,
    'The immutable v3.3-r2 failed-smoke receipt binding has drifted.',
  );
  await validateArchiveChecksum(archive, archiveChecksum);

  const r2PackageRoot =
    'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64';
  const [r2Manifest, failure, verifier] = await Promise.all([
    readJson(frozen.v33R2Manifest.path),
    readJson(V33_R2_FAILED_SMOKE_RECEIPT.path),
    runPackagedVerifier(r2PackageRoot),
  ]);
  validateV33R2SmokeFailedAttemptDocument(failure);
  assertAuthorityBoundary(r2Manifest);
  assertV33R2QaHarnessRevision(r2Manifest?.qaHarnessRevision);
  if (
    r2Manifest?.packageId
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r2'
    || verifier?.status !== 'verified'
    || verifier?.packageId !== r2Manifest.packageId
    || verifier?.members !== 40
    || verifier?.audioFiles !== 72
    || verifier?.strictComplete !== 0
    || verifier?.published !== false
  ) {
    throw new Error(
      'The frozen v3.3-r2 package no longer proves its exact verifier, 40-member, 72-audio, strict-0, unpublished boundary.',
    );
  }

  await assertWorkspaceArtifactsAbsent([
    V33_R2_SMOKE_REPORT,
    V33_R2_SMOKE_SCREENSHOT_ROOT,
    V33_R2_RECEIPT_JSON,
    V33_R2_RECEIPT_MARKDOWN,
  ], 'The superseded v3.3-r2 formal smoke/delivery chain');

  return {
    packageId: r2Manifest.packageId,
    sealedPackage: {
      archive,
      manifest: manifestBinding,
      payloadChecksums,
      archiveChecksum,
      verifier: {
        status: verifier.status,
        members: verifier.members,
        audioFiles: verifier.audioFiles,
        strictComplete: verifier.strictComplete,
        published: verifier.published,
      },
      unchanged: true,
      overwritten: false,
    },
    failureReceipt,
    status: failure.status,
    formalAttempt: failure.formalAttempt,
    isolatedDiagnosticReplay: {
      exactSealedR2ArchiveUsed:
        failure.isolatedDiagnosticReplay.exactSealedR2ArchiveUsed,
      exactFrozenV2ArchiveUsed:
        failure.isolatedDiagnosticReplay.exactFrozenV2ArchiveUsed,
      passingPredicates:
        failure.isolatedDiagnosticReplay.passingPredicates,
      failingPredicateVector:
        failure.isolatedDiagnosticReplay.failingPredicateVector,
    },
    independentFreshUnzipFocusForensics:
      failure.independentFreshUnzipFocusForensics,
    rootCause: failure.rootCause,
    successorBoundary: failure.successorBoundary,
    authority: failure.authority,
    smokeHarnessRevision: structuredClone(
      manifest.packageSmokeHarnessRevision,
    ),
    qaAndReadabilityEvidenceReuse: {
      from: deliveryVariant.qaAndReadabilityEvidenceReusedFrom,
      authoredProductSourceChangedFromV33R2: false,
      productBuildConfigurationChangedFromV33R2: false,
      readability: {
        json: deliveryVariant.readability.json,
        markdown: deliveryVariant.readability.markdown,
        screenshotRoot: deliveryVariant.readability.screenshotRoot,
      },
      controlledQa: {
        json: deliveryVariant.controlledQa.json,
        markdown: deliveryVariant.controlledQa.markdown,
        screenshotRoot: deliveryVariant.controlledQa.screenshotRoot,
      },
      strictAcceptanceEffect: 'none',
    },
    unchanged: true,
    overwritten: false,
  };
}

async function collectV33R3DeliveryHarnessRevision(
  deliveryVariant,
  manifest,
) {
  if (
    deliveryVariant.version !== 'v3-3'
    || deliveryVariant.artifactRevision !== 'r3'
  ) return null;
  const [failureReceipt, failure, releaseDocument, ...currentBindings] =
    await Promise.all([
      binding(V33_R3_DELIVERY_FAILED_ATTEMPT),
      readJson(V33_R3_DELIVERY_FAILED_ATTEMPT),
      readJson('catalog/lesson-releases.json'),
      ...V33_R3_DELIVERY_HARNESS_PREIMAGES.map(({path: relativePath}) =>
        binding(relativePath)
      ),
    ]);
  const variant = resolvePackageVariant(deliveryVariant.packageVersion);
  const currentSnapshot = await buildCurrentPackageInputSnapshot(
    selectG4L3Release(releaseDocument),
    variant,
  );
  const manifestSnapshot = manifest?.build?.inputSnapshotFinal;
  validateV33R3DeliveryFailedAttemptDocument(failure, {
    manifestBuild: manifest?.build,
    currentSnapshot,
    currentBindings,
  });
  return {
    failureReceipt,
    status: failure.status,
    deliveryAttempt: failure.deliveryAttempt,
    rootCause: failure.rootCause,
    preimageRestoration: failure.preimageRestoration,
    correctedHarness: failure.correctedHarness,
    successorBoundary: failure.successorBoundary,
    authority: failure.authority,
    packageBuildSourceSnapshot: manifestSnapshot,
    currentSourceSnapshot: currentSnapshot,
    unchangedProductAndPackageBytes: true,
  };
}

async function collectV31RegressionClosure(
  manifest,
  descriptor,
  {requireCurrentSource = true} = {},
) {
  if (!descriptor) return null;
  const [
    reportBinding,
    sourceInventoryBinding,
    markdownBinding,
    browserQaBinding,
  ] = await Promise.all([
    binding(descriptor.json),
    binding(descriptor.sourceInventory),
    binding(descriptor.markdown),
    binding(descriptor.browserQa),
  ]);
  const [
    report,
    sourceInventory,
    browserQa,
    screenshots,
    markdown,
  ] = await Promise.all([
    readJson(descriptor.json),
    readJson(descriptor.sourceInventory),
    readJson(descriptor.browserQa),
    pngBindings(descriptor.screenshotRoot),
    readFile(path.join(WORKSPACE_ROOT, descriptor.markdown), 'utf8'),
  ]);
  assertRegressionReceiptFingerprint(report);
  validateRegressionReceipt(report);
  if (markdown !== regressionMarkdown(report)) {
    throw new Error('The v3.1 post-v3 regression Markdown has drifted.');
  }
  const truthBoundary = report?.truthBoundary ?? report?.scope;
  const releaseBoundary = report?.scope ?? report?.summary;
  const boundSourceInventory =
    report?.sourceInventoryBinding
    ?? report?.sourceInventory?.artifact
    ?? report?.sourceInventory;
  const reportScreenshots = report?.screenshots ?? report?.browserQa?.screenshots;
  if (
    report?.schemaVersion !== 1
    || ![descriptor.reportType, descriptor.receiptId].includes(
      report?.reportType ?? report?.receiptId,
    )
    || !/^pass(?:-|$)/.test(report?.summary?.status ?? '')
    || truthBoundary?.declaredFunctionalPageInventoryComplete !== true
    || truthBoundary?.declaredFunctionalMarkersObserved !== true
    || truthBoundary?.functionalInteractionCompletenessEstablished !== false
    || truthBoundary?.fullCurrentV31SourceInventoryBound !== true
    || truthBoundary?.exhaustiveByteDeltaFromV3Established !== false
    || truthBoundary?.strictAcceptanceEffect !== 'none'
    || releaseBoundary?.releaseMembers !== 40
    || releaseBoundary?.strictCompleteMembers !== 0
    || releaseBoundary?.published !== false
    || stableJson(boundSourceInventory) !== stableJson(sourceInventoryBinding)
    || stableJson(report?.browserQa?.report) !== stableJson(browserQaBinding)
    || stableJson(report?.browserQa?.embeddedReport) !== stableJson(browserQa)
  ) {
    throw new Error('The v3.1 post-v3 regression receipt closure is invalid.');
  }
  const inventoryFailures = validateSourceInventoryDocument(sourceInventory);
  if (inventoryFailures.length !== 0) {
    throw new Error(
      `The v3.1 source inventory is invalid: ${inventoryFailures.join('; ')}`,
    );
  }
  if (requireCurrentSource) {
    const currentInventory = await buildFullCurrentSourceInventory();
    const canonicalInventoryFields = (inventory) => ({
      schemaVersion: inventory.schemaVersion,
      reportType: inventory.reportType,
      inventoryType: inventory.inventoryType,
      inventoryBoundary: inventory.inventoryBoundary,
      summary: inventory.summary,
      files: inventory.files,
      acceptanceBoundary: inventory.acceptanceBoundary,
    });
    if (
      stableJson(canonicalInventoryFields(currentInventory))
        !== stableJson(canonicalInventoryFields(sourceInventory))
    ) {
      throw new Error(
        'The v3.1 full current source inventory has added, removed, or changed files.',
      );
    }
    for (const expected of sourceInventory.files) {
      const actual = await binding(expected.path);
      if (stableJson(actual) !== stableJson(expected)) {
        throw new Error(
          `The v3.1 source inventory file has drifted: ${expected.path}`,
        );
      }
    }
  }
  const browserFailures = validateBrowserReportStructure(browserQa);
  if (
    browserFailures.length !== 0
    || browserQa.reportType !== descriptor.browserQaReportType
    || browserQa?.server?.frozenV3Port3216Touched !== false
    || stableJson(browserQa.sourceInventory) !== stableJson(sourceInventory.summary)
  ) {
    throw new Error(
      `The v3.1 regression browser QA is invalid: ${browserFailures.join('; ')}`,
    );
  }
  assertReportScreenshotBindings(
    {screenshots: reportScreenshots},
    screenshots,
    descriptor.screenshotRoot,
    'v3.1 post-v3 regression receipt',
  );
  assertReportScreenshotBindings(
    browserQa,
    screenshots,
    descriptor.screenshotRoot,
    'v3.1 post-v3 browser QA',
  );
  const expectedManifestRegression = {
    status: report.summary.status,
    truthBoundary: {
      declaredFunctionalPageInventoryComplete: true,
      declaredFunctionalMarkersObserved: true,
      functionalInteractionCompletenessEstablished: false,
      fullCurrentV31SourceInventoryBound: true,
      exhaustiveByteDeltaFromV3Established: false,
      strictAcceptanceEffect: 'none',
    },
    reports: {
      json: reportBinding,
      browserQa: browserQaBinding,
      markdown: markdownBinding,
    },
    sourceInventory: sourceInventoryBinding,
    screenshots,
  };
  assertSame(
    manifest?.postV3Regression,
    expectedManifestRegression,
    'Package post-v3 regression bindings do not match current evidence.',
  );
  return {
    ...expectedManifestRegression,
    browserQa: {
      report: browserQaBinding,
      summary: browserQa.summary,
      screenshots,
      sourceInventory: browserQa.sourceInventory,
    },
  };
}

async function collectReceipt(
  generatedAt,
  deliveryVariant,
  {historicalReceipt = null, requireCurrentSource = true} = {},
) {
  await deliveryVariant.assertFrozenPreimages();
  const variant = resolvePackageVariant(deliveryVariant.packageVersion);
  const packageRootRelative = path.relative(
    WORKSPACE_ROOT,
    variant.packageRoot,
  ).split(path.sep).join('/');
  const packageManifestPath =
    `${packageRootRelative}/package-manifest.json`;
  const payloadChecksumPath = `${packageRootRelative}/CHECKSUMS.sha256`;
  if (variant.smokeReportRelative !== deliveryVariant.smokeReport) {
    throw new Error(
      `The approved ${deliveryVariant.version} smoke report path has drifted.`,
    );
  }
  const [
    archiveBinding,
    archiveChecksumBinding,
    manifestBinding,
    payloadChecksumBinding,
    smokeBinding,
    readabilityJsonBinding,
    readabilityMarkdownBinding,
    controlledQaJsonBinding,
    controlledQaMarkdownBinding,
    v2ArchiveBinding,
    v2ArchiveChecksumBinding,
    v2ManifestBinding,
  ] = await Promise.all([
    binding(path.relative(WORKSPACE_ROOT, variant.archivePath)
      .split(path.sep).join('/')),
    binding(path.relative(WORKSPACE_ROOT, variant.archiveShaPath)
      .split(path.sep).join('/')),
    binding(packageManifestPath),
    binding(payloadChecksumPath),
    binding(deliveryVariant.smokeReport),
    binding(deliveryVariant.readability.json),
    binding(deliveryVariant.readability.markdown),
    binding(deliveryVariant.controlledQa.json),
    binding(deliveryVariant.controlledQa.markdown),
    binding(V2_ARCHIVE),
    binding(V2_ARCHIVE_CHECKSUM),
    binding(`${V2_PACKAGE_ROOT}/package-manifest.json`),
  ]);
  await Promise.all([
    validateArchiveChecksum(archiveBinding, archiveChecksumBinding),
    validateArchiveChecksum(v2ArchiveBinding, v2ArchiveChecksumBinding),
  ]);
  if (
    v2ArchiveBinding.path !== deliveryVariant.frozenPreimages.v2Archive.path
    || v2ArchiveBinding.sha256
      !== deliveryVariant.frozenPreimages.v2Archive.sha256
    || v2ManifestBinding.path
      !== deliveryVariant.frozenPreimages.v2Manifest.path
    || v2ManifestBinding.sha256
      !== deliveryVariant.frozenPreimages.v2Manifest.sha256
  ) {
    throw new Error('The approved frozen v2 hashes have drifted.');
  }

  const [
    manifest,
    smoke,
    readabilityReport,
    controlledQaReport,
    v2Manifest,
    verifier,
  ] = await Promise.all([
    readJson(packageManifestPath),
    readJson(deliveryVariant.smokeReport),
    readJson(deliveryVariant.readability.json),
    readJson(deliveryVariant.controlledQa.json),
    readJson(`${V2_PACKAGE_ROOT}/package-manifest.json`),
    runPackagedVerifier(packageRootRelative),
  ]);
  if (
    manifest?.schemaVersion !== 1
    || manifest?.packageId !== variant.packageId
    || manifest?.title !== variant.title
    || manifest?.entry?.url
      !== `http://127.0.0.1:${variant.defaultPort}/courses/4/3`
    || manifest?.entry?.spanishUrl
      !== `http://127.0.0.1:${variant.defaultPort}/es/courses/4/3`
    || manifest?.entry?.network !== 'loopback-only'
    || (
      deliveryVariant.version === 'v3-3'
      && (
        manifest?.authoredProductSourceChangedFromV32R2 !== true
        || manifest?.fullCurrentV33SourceSnapshotBound !== true
      )
    )
  ) {
    throw new Error(
      `The exact approved ${deliveryVariant.version} package manifest is unavailable.`,
    );
  }
  assertAuthorityBoundary(manifest);
  if (deliveryVariant.version === 'v3-2') {
    assertV32SuccessorRevision(manifest?.successorRevision);
    if (deliveryVariant.artifactRevision === 'r2') {
      assertV32SmokeHarnessRevision(manifest?.smokeHarnessRevision);
    }
  }
  const productSourceSuccessorRevision =
    deliveryVariant.version === 'v3-3'
      ? productSourceSuccessorRevisionFromManifest(
          manifest?.successorRevision,
        )
      : null;
  const frozenV33FailedQaAttempt =
    await collectFrozenV33FailedQaAttempt(deliveryVariant, manifest);
  const frozenV33R2SmokeFailedAttempt =
    await collectFrozenV33R2SmokeFailedAttempt(deliveryVariant, manifest);
  const deliveryHarnessRevision =
    await collectV33R3DeliveryHarnessRevision(deliveryVariant, manifest);
  assertSmokeReport(
    smoke,
    variant,
    manifestBinding,
    archiveBinding,
    v2ArchiveBinding,
    v2ManifestBinding,
    manifest,
  );
  if (
    verifier?.status !== 'verified'
    || verifier?.packageId !== variant.packageId
    || verifier?.members !== 40
    || verifier?.audioFiles !== 72
    || verifier?.strictComplete !== 0
    || verifier?.published !== false
  ) {
    throw new Error(
      `The ${deliveryVariant.version} packaged verifier result is invalid.`,
    );
  }

  const sourceMetadata = await stat(
    path.join(WORKSPACE_ROOT, manifest.readabilityEnhancements?.source?.path),
  );
  const canonicalReadability = validateV3ReadabilityEnhancements(
    readabilityReport?.readabilityEnhancements,
    sourceMetadata.size,
  );
  validateV3ReadabilityReport(
    readabilityReport,
    deliveryVariant.readability.reportType,
    deliveryVariant.readability.baseUrl,
  );
  if (deliveryVariant.version !== 'v3') {
    const readabilityFailures = validateReadabilityReportStructure(
      readabilityReport,
      {expectedArtifactVersion: deliveryVariant.readability.artifactVariant},
    );
    if (readabilityFailures.length !== 0) {
      throw new Error(
        `The ${deliveryVariant.version} readability report structure is invalid: ${readabilityFailures.join('; ')}`,
      );
    }
    const [readabilityMarkdown, controlledQaMarkdown] = await Promise.all([
      readFile(
        path.join(WORKSPACE_ROOT, deliveryVariant.readability.markdown),
        'utf8',
      ),
      readFile(
        path.join(WORKSPACE_ROOT, deliveryVariant.controlledQa.markdown),
        'utf8',
      ),
    ]);
    if (readabilityMarkdown !== renderReadabilityMarkdown(readabilityReport)) {
      throw new Error(
        `The ${deliveryVariant.version} readability Markdown does not match its JSON report.`,
      );
    }
    if (controlledQaMarkdown !== renderProductQaMarkdown(controlledQaReport)) {
      throw new Error(
        `The ${deliveryVariant.version} Controlled CEO Preview Markdown does not match its JSON report.`,
      );
    }
  }
  if (
    readabilityReport?.environment?.baseUrl
      !== deliveryVariant.readability.baseUrl
  ) {
    throw new Error(
      `Readability report must bind ${deliveryVariant.readability.baseUrl}.`,
    );
  }
  assertVersionedArtifactIdentity(
    readabilityReport,
    deliveryVariant.readability,
    'Readability report',
  );
  if (deliveryVariant.version !== 'v3' && requireCurrentSource) {
    await assertReportSourceBindingsCurrent(
      readabilityReport,
      'Readability report',
    );
  }
  const [readabilityScreenshots, controlledQaScreenshots] = await Promise.all([
    pngBindings(deliveryVariant.readability.screenshotRoot),
    pngBindings(deliveryVariant.controlledQa.screenshotRoot),
  ]);
  assertReportScreenshotBindings(
    readabilityReport,
    readabilityScreenshots,
    deliveryVariant.readability.screenshotRoot,
    'Readability report',
  );
  assertReportScreenshotBindings(
    controlledQaReport,
    controlledQaScreenshots,
    deliveryVariant.controlledQa.screenshotRoot,
    'Controlled CEO Preview QA report',
  );
  const expectedReadability = {
    ...canonicalReadability,
    reports: {
      json: readabilityJsonBinding,
      markdown: readabilityMarkdownBinding,
    },
    screenshots: readabilityScreenshots,
  };
  assertSame(
    manifest.readabilityEnhancements,
    expectedReadability,
    'Package readability bindings do not match the current report.',
  );
  const qaSummary = controlledQaSummary(
    controlledQaReport,
    deliveryVariant.controlledQa,
  );
  if (deliveryVariant.version !== 'v3' && requireCurrentSource) {
    await assertReportSourceBindingsCurrent(
      controlledQaReport,
      'Controlled CEO Preview QA report',
    );
  }
  const expectedControlledQa = {
    ...qaSummary,
    reports: {
      json: controlledQaJsonBinding,
      markdown: controlledQaMarkdownBinding,
    },
    screenshots: controlledQaScreenshots,
  };
  assertSame(
    manifest.controlledCeoPreviewQa,
    expectedControlledQa,
    'Package Controlled CEO Preview QA bindings do not match current evidence.',
  );

  const allPackageScreenshots = await pngBindings(
    deliveryVariant.smokeScreenshotRoot,
  );
  const candidatePage36Key = variant.page36CandidateKey
    ?? (deliveryVariant.version === 'v3-1' ? 'v31' : 'v3');
  const candidatePage36Smoke =
    smoke.page36FrozenV2Parity?.[candidatePage36Key];
  const compactSmokeScreenshots = [
    smoke.compactLandscape?.english?.screenshot,
    smoke.compactLandscape?.spanish?.screenshot,
    ...(smoke.compactLandscape?.english?.companionPages ?? []).map(
      ({screenshot}) => screenshot,
    ),
    ...(smoke.compactLandscape?.spanish?.companionPages ?? []).map(
      ({screenshot}) => screenshot,
    ),
  ].filter(Boolean);
  const internallyBoundSmokeScreenshots = [
    smoke.screenshot,
    ...(smoke.navigation?.stateScreenshots ?? []),
    ...(smoke.page36ReadableView?.layouts ?? []).map(
      ({screenshot}) => screenshot,
    ),
    candidatePage36Smoke?.screenshot,
    smoke.page36FrozenV2Parity?.frozenV2?.screenshot,
    ...compactSmokeScreenshots,
  ].filter(Boolean).sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  const smokeScreenshotPaths = new Set(
    internallyBoundSmokeScreenshots.map((row) => row.path),
  );
  const smokeScreenshots = allPackageScreenshots.filter(
    (row) => smokeScreenshotPaths.has(row.path),
  );
  const manualIntegrationScreenshots = allPackageScreenshots.filter(
    (row) => !smokeScreenshotPaths.has(row.path),
  );
  assertSame(
    internallyBoundSmokeScreenshots,
    smokeScreenshots,
    'The smoke report screenshot bindings have drifted.',
  );
  if (
    manualIntegrationScreenshots.some((row) =>
      !row.path.startsWith(`${deliveryVariant.smokeScreenshotRoot}/manual-integration/`)
    )
  ) {
    throw new Error(
      `A non-smoke ${deliveryVariant.version} screenshot is outside manual-integration evidence.`,
    );
  }

  if (deliveryVariant.version !== 'v3' && requireCurrentSource) {
    const releaseDocument = await readJson('catalog/lesson-releases.json');
    const currentSnapshot = await buildCurrentPackageInputSnapshot(
      selectG4L3Release(releaseDocument),
      variant,
    );
    if (deliveryHarnessRevision) {
      if (
        stableJson(currentSnapshot)
          !== stableJson(deliveryHarnessRevision.currentSourceSnapshot)
        || stableJson(manifest.build.inputSnapshotFinal)
          !== stableJson(
            deliveryHarnessRevision.packageBuildSourceSnapshot,
          )
      ) {
        throw new Error(
          'The exact two-file delivery-harness successor snapshot has drifted.',
        );
      }
    } else {
      assertPackageInputSnapshotCurrent(manifest, currentSnapshot);
    }
  }

  if (
    v2Manifest?.packageId !== 'g4-l3-whole-lesson-package-mvp-v2'
    || v2Manifest?.release?.strictCompleteCount !== 0
    || v2Manifest?.release?.published !== false
  ) {
    throw new Error('The frozen v2 package manifest boundary is invalid.');
  }
  const rendererBindings = requireCurrentSource
    ? await Promise.all(
        TS008_RENDERER_PATHS.map((relativePath) => binding(relativePath)),
      )
    : structuredClone(historicalReceipt?.ts008RendererBindings ?? []);
  if (
    rendererBindings.length !== TS008_RENDERER_PATHS.length
    || rendererBindings.some(
      (row, index) => row?.path !== TS008_RENDERER_PATHS[index],
    )
  ) {
    throw new Error(
      'The frozen v3.1 receipt lacks its exact TS08 renderer-binding history.',
    );
  }
  const generatedRendererBinding = rendererBindings.find(
    ({path: relativePath}) =>
      relativePath
        === deliveryVariant.frozenPreimages.ts008GeneratedRenderer.path,
  );
  if (
    generatedRendererBinding?.sha256
      !== deliveryVariant.frozenPreimages.ts008GeneratedRenderer.sha256
  ) {
    throw new Error('The approved frozen TS08 renderer hash has drifted.');
  }
  const [
    frozenV3,
    frozenV31,
    frozenV32R2,
    postV3Regression,
  ] = await Promise.all([
    collectFrozenV3Closure(deliveryVariant),
    collectFrozenV31Closure(deliveryVariant),
    collectFrozenV32R2Closure(deliveryVariant),
    collectV31RegressionClosure(
      manifest,
      deliveryVariant.regression,
      {requireCurrentSource},
    ),
  ]);
  const receipt = {
    schemaVersion: 1,
    receiptId: deliveryVariant.receiptId,
    reportType: deliveryVariant.receiptId,
    title: deliveryVariant.receiptTitle,
    ...(deliveryVariant.version !== 'v3'
      ? {
          artifactVersion: deliveryVariant.artifactRevision
            ? `${deliveryVariant.version.replace('-', '.')}-${deliveryVariant.artifactRevision}`
            : deliveryVariant.version.replace('-', '.'),
          packageVariant: deliveryVariant.packageVersion,
          ...(deliveryVariant.artifactRevision
            ? {artifactRevision: deliveryVariant.artifactRevision}
            : {}),
        }
      : {}),
    generatedAt,
    status: deliveryVariant.version !== 'v3'
      ? `machine-verified-controlled-ceo-preview-${deliveryVariant.packageVersion}-delivery`
      : 'machine-verified-controlled-ceo-preview-delivery',
    claimBoundary: {
      currentJavaScriptWholeLessonPackage: true,
      ...(postV3Regression ? {
        declaredFunctionalPageInventoryComplete: true,
        declaredFunctionalMarkersObserved: true,
        functionalInteractionCompletenessEstablished: false,
        fullCurrentV31SourceInventoryBound: true,
        exhaustiveByteDeltaFromV3Established: false,
        strictAcceptanceEffect: 'none',
      } : {}),
      ...(deliveryVariant.version === 'v3-2' ? {
        fullCurrentV32PackageSourceInventoryBound: true,
        compactLandscapeSixFileBatchBound: true,
        compactLandscapeBrowserSmokePassed: true,
        primaryPackageBuilderSmokeUsed: true,
        externalPostbuildSmokeCorrectionUsed: false,
        exhaustiveByteDeltaFromV31Established: false,
        strictAcceptanceEffect: 'none',
      } : {}),
      ...(deliveryVariant.version === 'v3-3' ? {
        authoredProductSourceChangedFromV32R2: true,
        fullCurrentV33PackageSourceSnapshotBound: true,
        declaredSixFileProductAndVerificationBatchBound: true,
        declaredBatchIsTheOnlyRepositoryDelta: false,
        exhaustiveByteDeltaFromV32R2Established: false,
        primaryPackageBuilderSmokeUsed: true,
        externalPostbuildSmokeCorrectionUsed: false,
        strictAcceptanceEffect: 'none',
      } : {}),
      ...(
        deliveryVariant.version === 'v3-3'
        && ['r2', 'r3'].includes(deliveryVariant.artifactRevision)
        ? {
        qaHarnessOnlySuccessor: true,
        authoredProductSourceChangedFromV33: false,
        v33FormalQaPublished: false,
        v33PartialScreenshotRootPreserved: true,
        v33PackagePublished: false,
        productFailureEstablishedByV33QaTimeout: false,
        strictAcceptanceEffect: 'none',
        }
        : {}
      ),
      ...(
        deliveryVariant.version === 'v3-3'
        && deliveryVariant.artifactRevision === 'r3'
        ? {
        smokeHarnessOnlySuccessor: true,
        deliveryHarnessOnlySuccessor: true,
        deliveryHarnessRevision: 'r2',
        packageCurrentSourceSnapshotStillExact: false,
        currentPackageSourceSnapshotEqualsBuildSnapshot: false,
        currentPackageCheckExpectedOutcome:
          'source-snapshot-drift-rejection',
        packageBuildSourceSnapshotPreserved: true,
        packageAndSmokeBytesChangedByDeliveryHarness: false,
        declaredScopedDeliveryHarnessFileCount: 2,
        exhaustiveOtherCurrentTreeDeltaEstablished: false,
        authoredProductSourceChangedFromV33R2: false,
        productBuildConfigurationChangedFromV33R2: false,
        qaAndReadabilityEvidenceReusedFrom: 'v3-3-r2',
        r2PackagePublished: true,
        r2PackageVerifierPassed: true,
        r2FormalSmokePublished: false,
        r2DeliveryReceiptPublished: false,
        r2ArtifactsOverwritten: false,
        productFailureEstablishedByR2SmokeFailure: false,
        currentJavascriptAcceptancePromotedByHarnessChange: false,
        originalRuntimeAcceptancePromotedByHarnessChange: false,
        ownerAcceptancePromotedByHarnessChange: false,
        publicationPromotedByHarnessChange: false,
        strictAcceptanceEffect: 'none',
        }
        : {}
      ),
      originalRuntimeFullFrameAccepted: false,
      independentHumanVisualAccepted: false,
      independentHumanAudioAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      strictCompleteMembers: 0,
      strictRequiredMembers: 40,
      publicRelease: false,
      published: false,
      humanNaturalEntryVerificationExcludedFromThisCeoPreviewByOwnerDirection:
        true,
    },
    package: {
      packageId: variant.packageId,
      title: variant.title,
      directory: packageRootRelative,
      archive: archiveBinding,
      archiveChecksum: archiveChecksumBinding,
      manifest: manifestBinding,
      payloadChecksum: payloadChecksumBinding,
      entry: manifest.entry.url,
      spanishEntry: manifest.entry.spanishUrl,
      sourceSnapshot: deliveryVariant.version !== 'v3'
        ? manifest.build.inputSnapshotFinal
        : manifest.build.inputSnapshotAfter,
    },
    verification: {
      packageVerifier: 'pass',
      packageCurrentSourceSnapshot: deliveryHarnessRevision
        ? 'sealed-build-snapshot-plus-exact-delivery-harness-only-successor'
        : 'pass',
      currentPackageSourceSnapshotEqualsBuildSnapshot:
        deliveryHarnessRevision ? false : true,
      currentPackageCheckExpectedOutcome: deliveryHarnessRevision
        ? 'source-snapshot-drift-rejection'
        : 'pass',
      deliveryHarnessCurrentBindingsReverified: deliveryHarnessRevision
        ? 'pass'
        : 'not-applicable',
      smoke: {
        report: smokeBinding,
        freshExtractedFinalZip: smoke.freshExtractedFinalZip,
        extractedPackageVerifier: smoke.extractedPackageVerifier,
        postSmokePackageCheck: smoke.postSmokePackageCheck,
        pagesRendered: smoke.pagesRendered,
        audioUrlsChecked: smoke.audioUrlsChecked,
        failures: smoke.failures.length,
        consoleErrors: smoke.consoleErrors.length,
        pageErrors: smoke.pageErrors.length,
        badHttpResponses: smoke.badHttpResponses.length,
        failedRequests: smoke.failedRequests.length,
        externalRequests: smoke.externalRequests.length,
        runtimeObservations: smoke.runtimeObservations.length,
        exactSingleRuntimePages: smoke.runtimeObservations.filter(
          ({exactSingleRuntime}) => exactSingleRuntime,
        ).length,
        privacyScan: smoke.privacyScan,
        sourceArchive: smoke.sourceArchive,
        frozenV2FreshExtractedFinalZip:
          smoke.frozenV2FreshExtractedFinalZip,
        frozenV2SourceArchive: smoke.frozenV2SourceArchive,
        page36FrozenV2Parity: smoke.page36FrozenV2Parity,
        pageTraversal: smoke.pageTraversal,
        page36ReadableView: smoke.page36ReadableView,
        functionalObservations: smoke.functionalObservations,
        keyTermsHostInteractions: smoke.keyTermsHostInteractions,
        smokeVerifier: smoke.smokeVerifier,
        compactLandscape: smoke.compactLandscape,
        wholeLessonInteractions: {
          sequentialNavigation: smoke.navigation.sequentialNavigation,
          sectionFirstPage: smoke.navigation.sectionFirstPage,
          courseMap: smoke.navigation.courseMap,
          terminal: smoke.navigation.terminal,
        },
        screenshots: smokeScreenshots,
        manualIntegrationScreenshots,
      },
    },
    readabilityEnhancements: expectedReadability,
    controlledCeoPreviewQa: expectedControlledQa,
    ...(deliveryVariant.version === 'v3-2'
      ? {successorRevision: manifest.successorRevision}
      : {}),
    ...(productSourceSuccessorRevision
      ? {productSourceSuccessorRevision}
      : {}),
    ...(frozenV33FailedQaAttempt
      ? {frozenV33FailedQaAttempt}
      : {}),
    ...(frozenV33R2SmokeFailedAttempt
      ? {frozenV33R2SmokeFailedAttempt}
      : {}),
    ...(deliveryHarnessRevision ? {deliveryHarnessRevision} : {}),
    ...(manifest.qaHarnessRevision
      ? {qaHarnessRevision: manifest.qaHarnessRevision}
      : {}),
    ...(manifest.packageSmokeHarnessRevision ?? manifest.smokeHarnessRevision
      ? {
          smokeHarnessRevision:
            manifest.packageSmokeHarnessRevision
              ?? manifest.smokeHarnessRevision,
          smokeHarnessRevisionBinding: {
            manifestSourceField: manifest.packageSmokeHarnessRevision
              ? 'packageSmokeHarnessRevision'
              : 'smokeHarnessRevision',
            receiptField: 'smokeHarnessRevision',
          },
        }
      : {}),
    ...(postV3Regression ? {postV3Regression} : {}),
    ts008RendererBindings: rendererBindings,
    frozenTs008GeneratedRenderer: {
      ...generatedRendererBinding,
      expectedSha256:
        deliveryVariant.frozenPreimages.ts008GeneratedRenderer.sha256,
      unchanged: true,
    },
    frozenV2: {
      packageId: v2Manifest.packageId,
      archive: v2ArchiveBinding,
      archiveChecksum: v2ArchiveChecksumBinding,
      manifest: v2ManifestBinding,
      expectedArchiveSha256:
        deliveryVariant.frozenPreimages.v2Archive.sha256,
      expectedManifestSha256:
        deliveryVariant.frozenPreimages.v2Manifest.sha256,
      unchanged: true,
      strictCompleteMembers: v2Manifest.release.strictCompleteCount,
      published: v2Manifest.release.published,
    },
    ...(frozenV3 ? {frozenV3} : {}),
    ...(frozenV31 ? {frozenV31} : {}),
    ...(frozenV32R2 ? {frozenV32R2} : {}),
    privacyExclusions: [
      'historical office archive',
      'HELP Math 1.0 SQL archive',
      'legacy credentials and personal records',
      'FLA and SWF source binaries',
      'public deployment authorization',
    ],
    unresolvedStrictGates: [
      'authoritative original-runtime complete-frame evidence',
      'full-frame RMSE review',
      'independent visual and audio review',
      'Owner acceptance',
      'strict completion',
      'atomic public release',
    ],
  };
  return withReceiptFingerprint(receipt);
}

export function deliveryMarkdown(receipt) {
  const isLegacyV3 = !receipt?.packageVariant
    && receipt?.package?.packageId
      === 'g4-l3-whole-lesson-package-mvp-v3';
  if (isLegacyV3) {
    return `# ${RECEIPT_TITLE}

生成时间：${receipt.generatedAt}

结论：**v3 是可交付给 CEO 的本地 current-JavaScript 候选包。** 这份不可覆盖收据不是严格忠实迁移完成报告，也不是公开发布批准。

## 交付绑定

- Package ID：\`${receipt.package.packageId}\`
- Title：\`${receipt.package.title}\`
- ZIP：\`${receipt.package.archive.path}\`
- ZIP SHA-256：\`${receipt.package.archive.sha256}\`
- Manifest：\`${receipt.package.manifest.path}\`
- Manifest SHA-256：\`${receipt.package.manifest.sha256}\`
- Smoke：\`${receipt.verification.smoke.report.path}\`
- Final ZIP fresh extract：\`${receipt.verification.smoke.freshExtractedFinalZip}\`
- Extracted verifier：\`${receipt.verification.smoke.extractedPackageVerifier}\`
- Browser smoke：39/39 pages，72/72 audio，0 failures
- Whole-Lesson primary runtime：\`${receipt.verification.smoke.exactSingleRuntimePages}/39\`
- Fresh-unzip privacy scan：\`${receipt.verification.smoke.privacyScan.status}\`（\`${receipt.verification.smoke.privacyScan.filesScanned}\` files）
- Page 36 original stage vs frozen v2：\`${receipt.verification.smoke.page36FrozenV2Parity.pixelDifferenceCount}\` differing pixels at \`sprite-350 / frame 789\`
- Manual integration screenshots：\`${receipt.verification.smoke.manualIntegrationScreenshots.length}\`

## Page 36 可读性增强

- Animation ID：\`${receipt.readabilityEnhancements.animationId}\`
- Source SHA-256：\`${receipt.readabilityEnhancements.source.sha256}\`
- Frame domain / frame：\`${receipt.readabilityEnhancements.frameDomain}\` / \`${receipt.readabilityEnhancements.frame}\`
- Native padding：\`${receipt.readabilityEnhancements.nativePaddingPixels}px\`
- Desktop scale：\`${receipt.readabilityEnhancements.desktopScale}x\`
- Crops：\`${receipt.readabilityEnhancements.crops.map((crop) => crop.id).join(', ')}\`
- Default expanded：\`${receipt.readabilityEnhancements.defaultExpanded}\`
- Original layout preserved：\`${receipt.readabilityEnhancements.originalLayoutPreserved}\`
- Strict acceptance effect：\`${receipt.readabilityEnhancements.strictAcceptanceEffect}\`
- Readability screenshots：\`${receipt.readabilityEnhancements.screenshots.length}\`
- Controlled CEO Preview QA screenshots：\`${receipt.controlledCeoPreviewQa.screenshots.length}\`

## 冻结边界

- v2 ZIP：\`${receipt.frozenV2.archive.path}\`
- v2 ZIP SHA-256：\`${receipt.frozenV2.archive.sha256}\`
- v2 manifest SHA-256：\`${receipt.frozenV2.manifest.sha256}\`
- TS08 generated renderer SHA-256：\`${receipt.frozenTs008GeneratedRenderer.sha256}\`
- 三项冻结 preimage 均未改变：\`${receipt.frozenV2.unchanged && receipt.frozenTs008GeneratedRenderer.unchanged}\`
- Strict completion：\`0/40\`
- Published：\`false\`
- Owner acceptance：\`false\`
- Receipt fingerprint：\`${receipt.receiptFingerprintSha256}\`

真人 File → Open / 自然进入因果链按 owner 本次 CEO 快速演示指示不作为阻塞项；因此也不构成 strict completion 证据。
`;
  }
  const versionLabel = receipt?.artifactVersion ?? 'v3.1';
  const regressionSection = receipt?.postV3Regression ? `
## Post-v3 current-JavaScript 回归

- Regression receipt：\`${receipt.postV3Regression.reports.json.path}\`
- Source inventory：\`${receipt.postV3Regression.sourceInventory.path}\`
- Browser QA：\`${receipt.postV3Regression.browserQa.report.path}\`
- Browser QA screenshots：\`${receipt.postV3Regression.browserQa.screenshots.length}\`
- Declared functional page inventory complete：\`${receipt.postV3Regression.truthBoundary.declaredFunctionalPageInventoryComplete}\`
- Declared functional markers observed：\`${receipt.postV3Regression.truthBoundary.declaredFunctionalMarkersObserved}\`
- Complete end-to-end interaction coverage established：\`${receipt.postV3Regression.truthBoundary.functionalInteractionCompletenessEstablished}\`
- Full current v3.1 source inventory bound：\`${receipt.postV3Regression.truthBoundary.fullCurrentV31SourceInventoryBound}\`
- Exhaustive byte delta from frozen v3 established：\`${receipt.postV3Regression.truthBoundary.exhaustiveByteDeltaFromV3Established}\`
- Strict acceptance effect：\`${receipt.postV3Regression.truthBoundary.strictAcceptanceEffect}\`
` : '';
  const frozenV3Section = receipt?.frozenV3 ? `
## 冻结 v3 closure

- v3 ZIP：\`${receipt.frozenV3.archive.path}\`
- v3 ZIP SHA-256：\`${receipt.frozenV3.archive.sha256}\`
- v3 manifest SHA-256：\`${receipt.frozenV3.manifest.sha256}\`
- v3 ZIP checksum SHA-256：\`${receipt.frozenV3.archiveChecksum.sha256}\`
- v3 delivery receipt SHA-256：\`${receipt.frozenV3.deliveryReceipt.sha256}\`
- v3 closure unchanged：\`${receipt.frozenV3.unchanged}\`
` : '';
  const frozenV31Section = receipt?.frozenV31 ? `
## 冻结 v3.1 predecessor closure

- v3.1 ZIP：\`${receipt.frozenV31.archive.path}\`
- v3.1 ZIP SHA-256：\`${receipt.frozenV31.archive.sha256}\`
- v3.1 manifest SHA-256：\`${receipt.frozenV31.manifest.sha256}\`
- v3.1 ZIP checksum SHA-256：\`${receipt.frozenV31.archiveChecksum.sha256}\`
- v3.1 smoke SHA-256：\`${receipt.frozenV31.smoke.sha256}\`
- v3.1 delivery receipt SHA-256：\`${receipt.frozenV31.deliveryReceipt.sha256}\`
- v3.1 delivery report SHA-256：\`${receipt.frozenV31.deliveryReport.sha256}\`
- v3.1 postbuild smoke runner SHA-256：\`${receipt.frozenV31.postbuildSmokeRunner.sha256}\`
- v3.1 receipt fingerprint：\`${receipt.frozenV31.receiptFingerprintSha256}\`
- v3.1 closure unchanged：\`${receipt.frozenV31.unchanged}\`
` : '';
  const frozenV32R2Section = receipt?.frozenV32R2 ? `
## 冻结 v3.2-r2 predecessor closure

- v3.2-r2 ZIP：\`${receipt.frozenV32R2.archive.path}\`
- v3.2-r2 ZIP SHA-256：\`${receipt.frozenV32R2.archive.sha256}\`
- v3.2-r2 manifest SHA-256：\`${receipt.frozenV32R2.manifest.sha256}\`
- v3.2-r2 ZIP checksum SHA-256：\`${receipt.frozenV32R2.archiveChecksum.sha256}\`
- v3.2-r2 payload CHECKSUMS SHA-256：\`${receipt.frozenV32R2.payloadChecksums.sha256}\`
- v3.2-r2 smoke SHA-256：\`${receipt.frozenV32R2.smoke.sha256}\`
- v3.2-r2 delivery receipt SHA-256：\`${receipt.frozenV32R2.deliveryReceipt.sha256}\`
- v3.2-r2 delivery report SHA-256：\`${receipt.frozenV32R2.deliveryReport.sha256}\`
- v3.2-r2 receipt fingerprint：\`${receipt.frozenV32R2.receiptFingerprintSha256}\`
- v3.2-r2 source snapshot：\`${receipt.frozenV32R2.sourceSnapshot.fileCount}\` files / \`${receipt.frozenV32R2.sourceSnapshot.totalBytes}\` bytes / \`${receipt.frozenV32R2.sourceSnapshot.sha256}\`
- v3.2-r2 closure unchanged：\`${receipt.frozenV32R2.unchanged}\`
- v3.2-r2 predecessor overwritten：\`${receipt.frozenV32R2.overwritten}\`
` : '';
  const compactLandscapeSection =
    receipt?.successorRevision?.knownCompactLandscapeBatch ? `
## v3.2 compact-landscape successor

- Known compact batch files：\`${receipt.successorRevision.knownCompactLandscapeBatch.fileCount}\`
- Known-subset boundary：\`the six-file compact-landscape batch is bound, but it is not an exhaustive v3.1 → v3.2 byte delta\`
- Full current package-source snapshot：\`${receipt.package.sourceSnapshot.fileCount}\` files / \`${receipt.package.sourceSnapshot.sha256}\`
- 844×390 EN/ES smoke：\`${receipt.verification.smoke.compactLandscape.passed}\`
- Toolbar：\`${receipt.verification.smoke.compactLandscape.english.toolbar.columns}\` columns × \`${receipt.verification.smoke.compactLandscape.english.toolbar.rows}\` rows
- EN disclosure：\`${receipt.verification.smoke.compactLandscape.english.badge.text}\`
- ES disclosure：\`${receipt.verification.smoke.compactLandscape.spanish.badge.text}\`
- Primary builder smoke：\`${receipt.verification.smoke.smokeVerifier.implementation}\`
- Postbuild correction used：\`${receipt.verification.smoke.smokeVerifier.postbuildCorrectionUsed}\`
- Minimum target observed：\`${Math.min(
    receipt.verification.smoke.compactLandscape.english.targets.minimumWidth,
    receipt.verification.smoke.compactLandscape.english.targets.minimumHeight,
    receipt.verification.smoke.compactLandscape.spanish.targets.minimumWidth,
    receipt.verification.smoke.compactLandscape.spanish.targets.minimumHeight,
  )}\`px
- Maximum horizontal overflow：\`${Math.max(
    receipt.verification.smoke.compactLandscape.english.horizontalOverflowPx,
    receipt.verification.smoke.compactLandscape.spanish.horizontalOverflowPx,
  )}\`px
- Three lesson actions stay on one row：\`${receipt.verification.smoke.compactLandscape.english.actions.sameRow && receipt.verification.smoke.compactLandscape.spanish.actions.sameRow}\`
- Full transport boundary remains AT-readable：\`${receipt.verification.smoke.compactLandscape.english.fullTransportBoundary.present && receipt.verification.smoke.compactLandscape.english.fullTransportBoundary.ariaHidden === null && receipt.verification.smoke.compactLandscape.spanish.fullTransportBoundary.present && receipt.verification.smoke.compactLandscape.spanish.fullTransportBoundary.ariaHidden === null}\`
- Single primary runtime：\`${receipt.verification.smoke.compactLandscape.english.primaryRuntimeCount === 1 && receipt.verification.smoke.compactLandscape.spanish.primaryRuntimeCount === 1}\`
- EN screenshot：\`${receipt.verification.smoke.compactLandscape.english.screenshot.path}\` / \`${receipt.verification.smoke.compactLandscape.english.screenshot.sha256}\`
- ES screenshot：\`${receipt.verification.smoke.compactLandscape.spanish.screenshot.path}\` / \`${receipt.verification.smoke.compactLandscape.spanish.screenshot.sha256}\`
- Companion screenshots：\`${receipt.verification.smoke.compactLandscape.english.companionPages.map(({screenshot}) => `${screenshot.path} / ${screenshot.sha256}`).join('; ')}\`
- Exhaustive byte delta from v3.1 established：\`${receipt.successorRevision.exhaustiveByteDeltaFromV31Established}\`
- Strict acceptance effect：\`${receipt.successorRevision.strictAcceptanceEffect}\`
` : '';
  const productSourceSuccessorSection =
    receipt?.productSourceSuccessorRevision ? `
## v3.3 product-source successor

- Predecessor Package ID：\`${receipt.productSourceSuccessorRevision.predecessorPackageId}\`
- Declared product/verification subset files：\`${receipt.productSourceSuccessorRevision.declaredSixFileProductAndVerificationBatch.fileCount}\`
- Declared subset roles：\`2 authored runtime / 2 unit test / 1 browser test / 1 browser config\`
- Per-file predecessor available / unavailable：\`${receipt.productSourceSuccessorRevision.declaredSixFileProductAndVerificationBatch.predecessorPerFileAvailableCount}\` / \`${receipt.productSourceSuccessorRevision.declaredSixFileProductAndVerificationBatch.predecessorPerFileUnavailableCount}\`
- Authored product source changed from v3.2-r2：\`${receipt.productSourceSuccessorRevision.authoredProductSourceChangedFromV32R2}\`
- Full current v3.3 package-source snapshot bound：\`${receipt.productSourceSuccessorRevision.fullCurrentV33PackageSourceSnapshotBound}\`
- Declared batch is the only repository delta：\`${receipt.productSourceSuccessorRevision.declaredBatchIsTheOnlyRepositoryDelta}\`
- Exhaustive byte delta from v3.2-r2 established：\`${receipt.productSourceSuccessorRevision.exhaustiveByteDeltaFromV32R2Established}\`
- Known-subset boundary：\`the declared six-file product/verification batch is a non-exhaustive subset and is not asserted to be the repository's only delta\`
- Full current v3.3 package-source snapshot：\`${receipt.package.sourceSnapshot.fileCount}\` files / \`${receipt.package.sourceSnapshot.totalBytes}\` bytes / \`${receipt.package.sourceSnapshot.sha256}\`
- Primary builder smoke：\`${receipt.verification.smoke.smokeVerifier.implementation}\`
- External postbuild smoke correction used：\`${receipt.claimBoundary.externalPostbuildSmokeCorrectionUsed}\`
- Strict acceptance effect：\`${receipt.productSourceSuccessorRevision.strictAcceptanceEffect}\`
` : '';
  const qaHarnessRevisionSection = receipt?.qaHarnessRevision ? `
## v3.3-r2 QA-harness successor

- Change class：\`${receipt.qaHarnessRevision.changeClass}\`
- Superseded attempt：\`${receipt.qaHarnessRevision.predecessorAttemptPackageId}\`
- Attempt status：\`${receipt.qaHarnessRevision.predecessorAttemptStatus}\`
- Failed-attempt receipt：\`${receipt.frozenV33FailedQaAttempt.failureReceipt.path}\`
- Failed-attempt receipt SHA-256：\`${receipt.frozenV33FailedQaAttempt.failureReceipt.sha256}\`
- Formal v3.3 QA JSON / Markdown published：\`${receipt.qaHarnessRevision.predecessorAttemptFormalQaPublished}\`
- Preserved partial screenshot root：\`${receipt.qaHarnessRevision.predecessorAttemptPartialScreenshotRoot.path}\`
- Preserved PNG closure：\`${receipt.qaHarnessRevision.predecessorAttemptPartialScreenshotRoot.fileCount}\` files / \`${receipt.qaHarnessRevision.predecessorAttemptPartialScreenshotRoot.totalBytes}\` bytes / \`${receipt.qaHarnessRevision.predecessorAttemptPartialScreenshotRoot.treeSha256}\`
- v3.3 package published：\`${receipt.qaHarnessRevision.predecessorAttemptPackagePublished}\`
- v3.3 predecessor overwritten：\`${receipt.qaHarnessRevision.predecessorAttemptOverwritten}\`
- Product failure established：\`${receipt.qaHarnessRevision.productFailureEstablished}\`
- Authored product source changed from v3.3：\`${receipt.qaHarnessRevision.authoredProductSourceChangedFromV33}\`
- Corrected before packaging：\`${receipt.qaHarnessRevision.correctedBeforePackaging}\`
- External postbuild correction used：\`${receipt.qaHarnessRevision.externalPostbuildCorrectionUsed}\`
- Strict acceptance effect：\`${receipt.qaHarnessRevision.strictAcceptanceEffect}\`
` : '';
  const v32SmokeHarnessRevisionSection =
    receipt?.smokeHarnessRevision?.predecessorAttempt ? `
## v3.2-r2 smoke-harness revision

- Change class：\`${receipt.smokeHarnessRevision.changeClass}\`
- Authored product source changed from v3.2：\`${receipt.smokeHarnessRevision.authoredProductSourceChangedFromV32}\`
- Frozen v3.2 attempt status：\`${receipt.smokeHarnessRevision.predecessorAttemptStatus}\`
- Frozen v3.2 ZIP：\`${receipt.smokeHarnessRevision.predecessorAttempt.archive.path}\`
- Frozen v3.2 ZIP SHA-256：\`${receipt.smokeHarnessRevision.predecessorAttempt.archive.sha256}\`
- Frozen v3.2 manifest SHA-256：\`${receipt.smokeHarnessRevision.predecessorAttempt.manifest.sha256}\`
- Frozen v3.2 checksum SHA-256：\`${receipt.smokeHarnessRevision.predecessorAttempt.archiveChecksum.sha256}\`
- v3.2 package verifier passed：\`${receipt.smokeHarnessRevision.predecessorAttempt.packageVerifierPassed}\`
- v3.2 formal smoke published：\`${receipt.smokeHarnessRevision.predecessorAttempt.formalSmokeReportPublished}\`
- v3.2 delivery receipt published：\`${receipt.smokeHarnessRevision.predecessorAttempt.deliveryReceiptPublished}\`
- Product failure established by v3.2 harness failure：\`${receipt.smokeHarnessRevision.predecessorAttempt.productFailureEstablished}\`
- Predecessor overwritten：\`${receipt.smokeHarnessRevision.predecessorAttempt.predecessorOverwritten}\`
- Compact root：\`${receipt.smokeHarnessRevision.compactRootSelector}\`
- Compact selection：\`${receipt.smokeHarnessRevision.compactPageSelectionMechanism}\`
- Resume decision before geometry：\`${receipt.smokeHarnessRevision.resumeDecisionBeforeGeometry}\`
- Session overlay before geometry：\`${receipt.smokeHarnessRevision.sessionDecisionOverlayBeforeGeometry}\`
- r2 primary smoke verifier：\`${receipt.verification.smoke.smokeVerifier.implementation}\`
- r2 postbuild correction used：\`${receipt.verification.smoke.smokeVerifier.postbuildCorrectionUsed}\`
- Strict acceptance effect：\`${receipt.smokeHarnessRevision.strictAcceptanceEffect}\`
` : '';
  const v33R3SmokeHarnessRevisionSection =
    receipt?.frozenV33R2SmokeFailedAttempt ? `
## v3.3-r3 smoke-harness-only successor

- Change class：\`${receipt.smokeHarnessRevision.changeClass}\`
- Harness scope：\`${receipt.smokeHarnessRevision.harnessScope}\`
- Superseded package：\`${receipt.smokeHarnessRevision.predecessorAttemptPackageId}\`
- Superseded status：\`${receipt.smokeHarnessRevision.predecessorAttemptStatus}\`
- Frozen r2 ZIP：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.archive.path}\`
- Frozen r2 ZIP SHA-256：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.archive.sha256}\`
- Frozen r2 manifest SHA-256：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.manifest.sha256}\`
- Frozen r2 payload CHECKSUMS SHA-256：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.payloadChecksums.sha256}\`
- Frozen r2 outer checksum file SHA-256：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.archiveChecksum.sha256}\`
- Failed-smoke receipt：\`${receipt.frozenV33R2SmokeFailedAttempt.failureReceipt.path}\`
- Failed-smoke receipt SHA-256：\`${receipt.frozenV33R2SmokeFailedAttempt.failureReceipt.sha256}\`
- Failed-smoke receipt bytes：\`${receipt.frozenV33R2SmokeFailedAttempt.failureReceipt.bytes}\`
- Legacy source-hotspot focus predicates failed：\`${receipt.frozenV33R2SmokeFailedAttempt.isolatedDiagnosticReplay.failingPredicateVector.length}\`
- Exact failed animation IDs：\`${receipt.frozenV33R2SmokeFailedAttempt.isolatedDiagnosticReplay.failingPredicateVector.map(({animationId}) => animationId).join(', ')}\`
- Responsive focus contract：\`${receipt.smokeHarnessRevision.focusRestorationMode}\`
- Responsive focus selector：\`${receipt.smokeHarnessRevision.focusRestorationSelector}\`
- Arbitrary visible element accepted：\`${receipt.smokeHarnessRevision.arbitraryVisibleElementAccepted}\`
- Source hotspot focus required：\`${receipt.smokeHarnessRevision.sourceHotspotFocusRequired}\`
- RW003 source-stop hold and explicit Resume still required：\`${receipt.smokeHarnessRevision.rw003SourceStopHoldAndExplicitResumeStillRequired}\`
- r2 package verifier passed：\`${receipt.frozenV33R2SmokeFailedAttempt.sealedPackage.verifier.status === 'verified'}\`
- r2 formal smoke published：\`${receipt.frozenV33R2SmokeFailedAttempt.successorBoundary.r2FormalSmokePublished}\`
- r2 delivery receipt published：\`${receipt.frozenV33R2SmokeFailedAttempt.successorBoundary.r2DeliveryReceiptPublished}\`
- r2 artifacts overwritten：\`${receipt.frozenV33R2SmokeFailedAttempt.successorBoundary.r2ArtifactsOverwritten}\`
- Product failure established：\`${receipt.frozenV33R2SmokeFailedAttempt.successorBoundary.productFailureEstablished}\`
- Authored product source changed from v3.3-r2：\`${receipt.smokeHarnessRevision.authoredProductSourceChangedFromV33R2}\`
- Product build configuration changed from v3.3-r2：\`${receipt.smokeHarnessRevision.productBuildConfigurationChangedFromV33R2}\`
- QA/readability evidence reused from：\`${receipt.frozenV33R2SmokeFailedAttempt.qaAndReadabilityEvidenceReuse.from}\`
- Reused readability JSON：\`${receipt.frozenV33R2SmokeFailedAttempt.qaAndReadabilityEvidenceReuse.readability.json}\`
- Reused Controlled QA JSON：\`${receipt.frozenV33R2SmokeFailedAttempt.qaAndReadabilityEvidenceReuse.controlledQa.json}\`
- External postbuild correction used：\`${receipt.smokeHarnessRevision.externalPostbuildCorrectionUsed}\`
- Strict acceptance effect：\`${receipt.smokeHarnessRevision.strictAcceptanceEffect}\`

The v3.3-r3 change corrects only the fresh-unzip smoke focus contract. It does not promote current-JavaScript acceptance, Flash/original-runtime fidelity, independent human acceptance, Owner acceptance, strict completion, or publication status.
` : '';
  const deliveryHarnessRevisionSection =
    receipt?.deliveryHarnessRevision ? `
## v3.3-r3 delivery-harness r2 successor

- Failed delivery attempt receipt：\`${receipt.deliveryHarnessRevision.failureReceipt.path}\`
- Failed delivery attempt receipt SHA-256：\`${receipt.deliveryHarnessRevision.failureReceipt.sha256}\`
- Failure phase：\`${receipt.deliveryHarnessRevision.deliveryAttempt.phase}\`
- Root cause：\`${receipt.deliveryHarnessRevision.rootCause.classification}\`
- Manifest source field：\`${receipt.smokeHarnessRevisionBinding.manifestSourceField}\`
- Delivery harness revision：\`${receipt.deliveryHarnessRevision.successorBoundary.deliveryHarnessRevision}\`
- Declared scoped delivery-harness files：\`${receipt.deliveryHarnessRevision.correctedHarness.exactChangedFileCount}\`
- Scope semantics：\`${receipt.deliveryHarnessRevision.correctedHarness.scopeSemantics}\`
- Exhaustive other current-tree delta established：\`${receipt.deliveryHarnessRevision.correctedHarness.exhaustiveOtherCurrentTreeDeltaEstablished}\`
- Package-build source snapshot：\`${receipt.deliveryHarnessRevision.packageBuildSourceSnapshot.fileCount}\` files / \`${receipt.deliveryHarnessRevision.packageBuildSourceSnapshot.totalBytes}\` bytes / \`${receipt.deliveryHarnessRevision.packageBuildSourceSnapshot.sha256}\`
- Current source snapshot after delivery-only correction：\`${receipt.deliveryHarnessRevision.currentSourceSnapshot.fileCount}\` files / \`${receipt.deliveryHarnessRevision.currentSourceSnapshot.totalBytes}\` bytes / \`${receipt.deliveryHarnessRevision.currentSourceSnapshot.sha256}\`
- Current source snapshot byte delta：\`${receipt.deliveryHarnessRevision.correctedHarness.currentSourceSnapshotByteDelta}\`
- Package current-source status：\`${receipt.verification.packageCurrentSourceSnapshot}\`
- Current package-source snapshot equals build snapshot：\`${receipt.verification.currentPackageSourceSnapshotEqualsBuildSnapshot}\`
- Current package check expected outcome：\`${receipt.verification.currentPackageCheckExpectedOutcome}\`
- Preimage package check passed：\`${receipt.deliveryHarnessRevision.preimageRestoration.packageCheckPassed}\`
- Preimage package check characterization：\`${receipt.deliveryHarnessRevision.preimageRestoration.outcomeCharacterization}\`
- Authored product source changed：\`${receipt.deliveryHarnessRevision.correctedHarness.authoredProductSourceChanged}\`
- Package bytes changed：\`${receipt.deliveryHarnessRevision.correctedHarness.packageBytesChanged}\`
- Smoke bytes changed：\`${receipt.deliveryHarnessRevision.correctedHarness.smokeBytesChanged}\`
- Same sealed r3 package retained：\`${receipt.deliveryHarnessRevision.successorBoundary.sameR3PackageRetained}\`
- Product failure established：\`${receipt.deliveryHarnessRevision.successorBoundary.productFailureEstablished}\`
- Strict acceptance effect：\`${receipt.deliveryHarnessRevision.successorBoundary.strictAcceptanceEffect}\`

The declared delivery-harness r2 scope changes only how the delivery verifier reads the already-sealed package manifest. The two harness paths and their aggregate byte delta are exact, but this receipt does not claim an exhaustive proof of every unrelated working-tree delta. The package-build snapshot remains historical and hash-bound; current-source equality and a passing current-source package check are deliberately not claimed after this delivery-only correction.
` : '';
  const v33BoundaryParagraph =
    ['v3-3', 'v3-3-r2', 'v3-3-r3'].includes(receipt?.packageVariant)
    ? `${receipt.artifactVersion} remains a current-JavaScript candidate at strict 0/40 and unpublished. Its declared six-file product/verification batch is a non-exhaustive subset. The frozen v3.2-r2 closure remains unchanged and was not overwritten.${['v3-3-r2', 'v3-3-r3'].includes(receipt.packageVariant) ? ' The v3.3 formal QA attempt timed out before JSON/Markdown publication; its five partial screenshots are preserved as failure evidence, no v3.3 package was published, and the timeout does not establish a product failure.' : ''}${receipt.packageVariant === 'v3-3-r3' ? ' The sealed v3.3-r2 package passed its verifier but its formal smoke and delivery receipt were not published because three obsolete source-hotspot focus predicates failed; the r3 correction is harness-only and does not establish a product failure or alter product source.' : ''} This receipt does not claim Flash fidelity, independent human acceptance, Owner acceptance, or public release.\n\n`
    : '';
  return `# ${receipt?.title ?? RECEIPT_TITLE}

生成时间：${receipt.generatedAt}

结论：**${versionLabel} 是可交付给 CEO 的本地 current-JavaScript 候选包。** 这份不可覆盖收据不是严格忠实迁移完成报告，也不是公开发布批准。

## 交付绑定

- Package ID：\`${receipt.package.packageId}\`
- Title：\`${receipt.package.title}\`
- ZIP：\`${receipt.package.archive.path}\`
- ZIP SHA-256：\`${receipt.package.archive.sha256}\`
- Manifest：\`${receipt.package.manifest.path}\`
- Manifest SHA-256：\`${receipt.package.manifest.sha256}\`
- Smoke：\`${receipt.verification.smoke.report.path}\`
- Final ZIP fresh extract：\`${receipt.verification.smoke.freshExtractedFinalZip}\`
- Extracted verifier：\`${receipt.verification.smoke.extractedPackageVerifier}\`
- Browser smoke：39/39 pages，72/72 audio，0 failures
- Whole-Lesson primary runtime：\`${receipt.verification.smoke.exactSingleRuntimePages}/39\`
- Fresh-unzip privacy scan：\`${receipt.verification.smoke.privacyScan.status}\`（\`${receipt.verification.smoke.privacyScan.filesScanned}\` files）
- Page 36 original stage vs frozen v2：\`${receipt.verification.smoke.page36FrozenV2Parity.pixelDifferenceCount}\` differing pixels at \`sprite-350 / frame 789\`
- Manual integration screenshots：\`${receipt.verification.smoke.manualIntegrationScreenshots.length}\`

## Page 36 可读性增强

- Animation ID：\`${receipt.readabilityEnhancements.animationId}\`
- Source SHA-256：\`${receipt.readabilityEnhancements.source.sha256}\`
- Frame domain / frame：\`${receipt.readabilityEnhancements.frameDomain}\` / \`${receipt.readabilityEnhancements.frame}\`
- Native padding：\`${receipt.readabilityEnhancements.nativePaddingPixels}px\`
- Desktop scale：\`${receipt.readabilityEnhancements.desktopScale}x\`
- Crops：\`${receipt.readabilityEnhancements.crops.map((crop) => crop.id).join(', ')}\`
- Default expanded：\`${receipt.readabilityEnhancements.defaultExpanded}\`
- Original layout preserved：\`${receipt.readabilityEnhancements.originalLayoutPreserved}\`
- Strict acceptance effect：\`${receipt.readabilityEnhancements.strictAcceptanceEffect}\`
- Readability screenshots：\`${receipt.readabilityEnhancements.screenshots.length}\`
- Controlled CEO Preview QA screenshots：\`${receipt.controlledCeoPreviewQa.screenshots.length}\`
${regressionSection}
${frozenV3Section}${frozenV31Section}${frozenV32R2Section}${compactLandscapeSection}${productSourceSuccessorSection}${qaHarnessRevisionSection}${v32SmokeHarnessRevisionSection}${v33R3SmokeHarnessRevisionSection}${deliveryHarnessRevisionSection}

## 冻结边界

- v2 ZIP：\`${receipt.frozenV2.archive.path}\`
- v2 ZIP SHA-256：\`${receipt.frozenV2.archive.sha256}\`
- v2 manifest SHA-256：\`${receipt.frozenV2.manifest.sha256}\`
- TS08 generated renderer SHA-256：\`${receipt.frozenTs008GeneratedRenderer.sha256}\`
- 冻结 preimage 均未改变：\`${receipt.frozenV2.unchanged && receipt.frozenTs008GeneratedRenderer.unchanged && (receipt.frozenV3?.unchanged ?? true) && (receipt.frozenV31?.unchanged ?? true) && (receipt.frozenV32R2?.unchanged ?? true)}\`
- Strict completion：\`0/40\`
- Published：\`false\`
- Owner acceptance：\`false\`
- Receipt fingerprint：\`${receipt.receiptFingerprintSha256}\`

${v33BoundaryParagraph}真人 File → Open / 自然进入因果链按 owner 本次 CEO 快速演示指示不作为阻塞项；因此也不构成 strict completion 证据。
`;
}

async function assertReceiptOutputsAbsent(deliveryVariant) {
  for (const relativePath of [
    deliveryVariant.receiptJson,
    deliveryVariant.receiptMarkdown,
  ]) {
    try {
      await lstat(path.join(WORKSPACE_ROOT, relativePath));
      throw new Error(
        `Immutable delivery output already exists and will not be overwritten: ${relativePath}`,
      );
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

async function writeExclusiveBundle(rows) {
  const opened = [];
  try {
    for (const [relativePath] of rows) {
      const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
      const handle = await open(absolutePath, 'wx', 0o444);
      opened.push({absolutePath, handle});
    }
    for (let index = 0; index < rows.length; index += 1) {
      await opened[index].handle.writeFile(rows[index][1], 'utf8');
      await opened[index].handle.sync();
    }
    for (const entry of opened) {
      await entry.handle.close();
      entry.closed = true;
    }
    for (const entry of opened) await chmod(entry.absolutePath, 0o444);
  } catch (error) {
    for (const entry of opened) {
      if (!entry.closed) await entry.handle.close().catch(() => {});
    }
    for (const entry of opened) {
      await rm(entry.absolutePath, {force: true}).catch(() => {});
    }
    throw error;
  }
}

async function buildDelivery(deliveryVariant) {
  assertDeliveryBuildVariantAllowed(deliveryVariant);
  await assertReceiptOutputsAbsent(deliveryVariant);
  const receipt = await collectReceipt(
    new Date().toISOString(),
    deliveryVariant,
  );
  await writeExclusiveBundle([
    [deliveryVariant.receiptJson, stableJson(receipt)],
    [deliveryVariant.receiptMarkdown, deliveryMarkdown(receipt)],
  ]);
  console.log(stableJson({
    status: 'delivery-receipt-built',
    variant: deliveryVariant.packageVersion,
    receipt: deliveryVariant.receiptJson,
    report: deliveryVariant.receiptMarkdown,
    fingerprint: receipt.receiptFingerprintSha256,
  }));
}

export function assertDeliveryBuildVariantAllowed(deliveryVariant) {
  if (deliveryVariant?.buildable !== true) {
    throw new Error(
      `The ${deliveryVariant?.version ?? 'unknown'} delivery receipt is frozen and finalized; only read-only --check is allowed.`,
    );
  }
  return true;
}

async function checkDelivery(deliveryVariant) {
  const [receiptMetadata, markdownMetadata] = await Promise.all([
    lstat(path.join(WORKSPACE_ROOT, deliveryVariant.receiptJson)),
    lstat(path.join(WORKSPACE_ROOT, deliveryVariant.receiptMarkdown)),
  ]);
  if (
    !receiptMetadata.isFile()
    || !markdownMetadata.isFile()
    || receiptMetadata.isSymbolicLink()
    || markdownMetadata.isSymbolicLink()
    || (receiptMetadata.mode & 0o222) !== 0
    || (markdownMetadata.mode & 0o222) !== 0
  ) {
    throw new Error(
      `The immutable ${deliveryVariant.version} delivery outputs must be regular, non-symlink, read-only files.`,
    );
  }
  const receipt = await readJson(deliveryVariant.receiptJson);
  const expectedArtifactVersion = deliveryVariant.artifactRevision
    ? `${deliveryVariant.version.replace('-', '.')}-${deliveryVariant.artifactRevision}`
    : deliveryVariant.version.replace('-', '.');
  if (
    receipt?.receiptId !== deliveryVariant.receiptId
    || receipt?.reportType !== deliveryVariant.receiptId
    || receipt?.title !== deliveryVariant.receiptTitle
    || Number.isNaN(Date.parse(receipt?.generatedAt))
    || (
      deliveryVariant.version !== 'v3'
      && (
        receipt?.artifactVersion !== expectedArtifactVersion
        || receipt?.packageVariant !== deliveryVariant.packageVersion
        || receipt?.artifactRevision
          !== deliveryVariant.artifactRevision
        || receipt?.status
          !== `machine-verified-controlled-ceo-preview-${deliveryVariant.packageVersion}-delivery`
      )
    )
    || receipt?.claimBoundary?.ownerAccepted !== false
    || receipt?.claimBoundary?.strictComplete !== false
    || receipt?.claimBoundary?.strictCompleteMembers !== 0
    || receipt?.claimBoundary?.publicRelease !== false
    || receipt?.claimBoundary?.published !== false
  ) {
    throw new Error(
      `The immutable ${deliveryVariant.version} delivery receipt identity is invalid.`,
    );
  }
  assertReceiptFingerprint(receipt);
  if (deliveryVariant.version === 'v3') {
    await assertV31FrozenPreimages();
    const variant = resolvePackageVariant('v3');
    const packageRootRelative = path.relative(
      WORKSPACE_ROOT,
      variant.packageRoot,
    ).split(path.sep).join('/');
    const [
      archive,
      archiveChecksum,
      manifestBinding,
      payloadChecksum,
      smoke,
      verifier,
    ] =
      await Promise.all([
        binding(V31_FROZEN_PREIMAGES.v3Archive.path),
        binding(V31_FROZEN_PREIMAGES.v3ArchiveChecksum.path),
        binding(V31_FROZEN_PREIMAGES.v3Manifest.path),
        binding(`${packageRootRelative}/CHECKSUMS.sha256`),
        binding(V31_FROZEN_PREIMAGES.v3Smoke.path),
        runPackagedVerifier(packageRootRelative),
      ]);
    await validateArchiveChecksum(archive, archiveChecksum);
    if (
      stableJson(receipt?.package?.archive) !== stableJson(archive)
      || stableJson(receipt?.package?.archiveChecksum)
        !== stableJson(archiveChecksum)
      || stableJson(receipt?.package?.manifest)
        !== stableJson(manifestBinding)
      || stableJson(receipt?.package?.payloadChecksum)
        !== stableJson(payloadChecksum)
      || stableJson(receipt?.verification?.smoke?.report)
        !== stableJson(smoke)
      || verifier?.status !== 'verified'
      || verifier?.packageId !== variant.packageId
      || verifier?.members !== 40
      || verifier?.audioFiles !== 72
      || verifier?.strictComplete !== 0
      || verifier?.published !== false
    ) {
      throw new Error(
        'The frozen v3 delivery closure no longer matches its immutable receipt.',
      );
    }
    const markdown = await readFile(
      path.join(WORKSPACE_ROOT, deliveryVariant.receiptMarkdown),
      'utf8',
    );
    if (markdown !== deliveryMarkdown(receipt)) {
      throw new Error('The immutable v3 delivery Markdown report has drifted.');
    }
    console.log(stableJson({
      status: 'delivery-receipt-checked',
      variant: deliveryVariant.version,
      receipt: deliveryVariant.receiptJson,
      report: deliveryVariant.receiptMarkdown,
      fingerprint: receipt.receiptFingerprintSha256,
      frozenClosure: true,
    }));
    return;
  }
  const current = await collectReceipt(
    receipt.generatedAt,
    deliveryVariant,
    {historicalReceipt: receipt, requireCurrentSource: false},
  );
  assertSame(
    receipt,
    current,
    `The immutable ${deliveryVariant.version} delivery receipt no longer matches its bound artifacts.`,
  );
  const markdown = await readFile(
    path.join(WORKSPACE_ROOT, deliveryVariant.receiptMarkdown),
    'utf8',
  );
  if (markdown !== deliveryMarkdown(receipt)) {
    throw new Error(
      `The immutable ${deliveryVariant.version} delivery Markdown report has drifted.`,
    );
  }
  console.log(stableJson({
    status: 'delivery-receipt-checked',
    variant: deliveryVariant.packageVersion,
    receipt: deliveryVariant.receiptJson,
    report: deliveryVariant.receiptMarkdown,
    fingerprint: receipt.receiptFingerprintSha256,
    frozenClosure: true,
  }));
}

async function main() {
  const request = parseDeliveryRequest(process.argv.slice(2));
  const deliveryVariant = resolveDeliveryReceiptVariant(request.version);
  if (request.mode === 'build') await buildDelivery(deliveryVariant);
  else await checkDelivery(deliveryVariant);
}

if (
  process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
