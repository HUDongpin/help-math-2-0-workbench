#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  cp,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import {spawn, spawnSync} from 'node:child_process';
import {createServer as createNetServer} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {
  buildFullCurrentSourceInventory,
  DECLARED_FUNCTIONAL_PAGES,
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
const WEB_ROOT = path.join(WORKSPACE_ROOT, 'apps/web');
const OUTPUTS_ROOT = path.join(WORKSPACE_ROOT, 'outputs');
const V3_READABILITY_REPORT_JSON =
  'reports/g4-l3-current-js-readability-v3.json';
const V3_READABILITY_REPORT_MD =
  'reports/g4-l3-current-js-readability-v3.md';
const V3_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3';
const CONTROLLED_CEO_PREVIEW_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-qa.json';
const CONTROLLED_CEO_PREVIEW_QA_MD =
  'reports/g4-l3-controlled-ceo-preview-qa.md';
const CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-qa';
const V31_READABILITY_REPORT_JSON =
  'reports/g4-l3-current-js-readability-v3-1.json';
const V31_READABILITY_REPORT_MD =
  'reports/g4-l3-current-js-readability-v3-1.md';
const V31_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-1';
const V31_CONTROLLED_CEO_PREVIEW_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-1-qa.json';
const V31_CONTROLLED_CEO_PREVIEW_QA_MD =
  'reports/g4-l3-controlled-ceo-preview-v3-1-qa.md';
const V31_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-1-qa';
const V32_READABILITY_REPORT_JSON =
  'reports/g4-l3-current-js-readability-v3-2.json';
const V32_READABILITY_REPORT_MD =
  'reports/g4-l3-current-js-readability-v3-2.md';
const V32_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-2';
const V32_CONTROLLED_CEO_PREVIEW_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-2-qa.json';
const V32_CONTROLLED_CEO_PREVIEW_QA_MD =
  'reports/g4-l3-controlled-ceo-preview-v3-2-qa.md';
const V32_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-2-qa';
const V33_READABILITY_REPORT_JSON =
  'reports/g4-l3-current-js-readability-v3-3.json';
const V33_READABILITY_REPORT_MD =
  'reports/g4-l3-current-js-readability-v3-3.md';
const V33_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-3';
const V33_CONTROLLED_CEO_PREVIEW_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-3-qa.json';
const V33_CONTROLLED_CEO_PREVIEW_QA_MD =
  'reports/g4-l3-controlled-ceo-preview-v3-3-qa.md';
const V33_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa';
const V33_R2_READABILITY_REPORT_JSON =
  'reports/g4-l3-current-js-readability-v3-3-r2.json';
const V33_R2_READABILITY_REPORT_MD =
  'reports/g4-l3-current-js-readability-v3-3-r2.md';
const V33_R2_READABILITY_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-current-js-readability-v3-3-r2';
const V33_R2_CONTROLLED_CEO_PREVIEW_QA_JSON =
  'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.json';
const V33_R2_CONTROLLED_CEO_PREVIEW_QA_MD =
  'reports/g4-l3-controlled-ceo-preview-v3-3-r2-qa.md';
const V33_R2_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-controlled-ceo-preview-v3-3-r2-qa';
const V31_REGRESSION_REPORT_JSON =
  'reports/g4-l3-v31-post-v3-current-js-regression.json';
const V31_REGRESSION_BROWSER_QA_JSON =
  'reports/g4-l3-v31-post-v3-browser-qa.json';
const V31_REGRESSION_SOURCE_INVENTORY_JSON =
  'reports/g4-l3-v31-post-v3-source-inventory.json';
const V31_REGRESSION_REPORT_MD =
  'outputs/g4-l3-v31-post-v3-current-js-regression.md';
const V31_REGRESSION_SCREENSHOT_ROOT =
  'output/playwright/g4-l3-v31-post-v3-current-js-regression';
const TS008_ANIMATION_ID = 'course-g04-l03-ts-008';
const TS008_SOURCE_PATH =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf';
const TS008_SOURCE_SHA256 =
  '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885';
const TS008_SOURCE_BYTES = 693079;
export const V3_FROZEN_PREIMAGES = Object.freeze({
  v2Archive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64.zip',
    sha256:
      '7bc8074677504ff3e923dc400fdd80a7fdaf01fec2402cec9869c9019f2e79f5',
  }),
  v2Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v2-darwin-arm64/package-manifest.json',
    sha256:
      'd856fe7a3b2cf4dde7cf50c60c0e2da6c06ced5ef5b9943cdf1144e929f2f250',
  }),
  ts008GeneratedRenderer: Object.freeze({
    path:
      'public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js',
    sha256:
      '30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6',
  }),
});
export const V31_FROZEN_PREIMAGES = Object.freeze({
  ...V3_FROZEN_PREIMAGES,
  v3Archive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip',
    sha256:
      '3439af236f5e9c0d5bd100b364d44c1785a5fcdf0a02b1b9df761656b04d7ec3',
  }),
  v3Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64/package-manifest.json',
    sha256:
      '15e2c35511b67346493bda333cf4f1ec1f9bc87ea1802e43447fd99607b58ffe',
  }),
  v3ArchiveChecksum: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-darwin-arm64.zip.sha256',
    sha256:
      '139b33c3b2ec83cf09c489e78e4b47bb8733d844dbccbdd578ae6eb94f0896ff',
  }),
  v3Smoke: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json',
    sha256:
      'a559ced2e3af0570cc730607e4d757b0c31c066e2a22a67ec0c2b735b81c26a7',
  }),
  v3DeliveryReceipt: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-delivery.json',
    sha256:
      '4d9683c347adf8439d96a10ea508dc7fdd0e54125220990dc66298d99e2ff433',
  }),
  v3DeliveryReport: Object.freeze({
    path: 'outputs/g4-l3-whole-lesson-package-mvp-v3-delivery-report.md',
    sha256:
      '6723c6b59381ee6275c42dd7ab118bab796f2cc9e7bc18a924bda68f6f5671f7',
  }),
});
export const V32_FROZEN_PREIMAGES = Object.freeze({
  ...V31_FROZEN_PREIMAGES,
  v31Archive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64.zip',
    sha256:
      '211f87751120aaac29215d6828c1897bdb67408175769270db4ddfa2dd7ed1f6',
  }),
  v31Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64/package-manifest.json',
    sha256:
      'eb3c8d5a8e02da3078eafa63f9e801a0fc1460c0a66fb672666e6f73da09e286',
  }),
  v31ArchiveChecksum: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64.zip.sha256',
    sha256:
      '4d60516c1ea25200bfa0c23cd93fe122de0b8897b44a9dc513c84a862f8e7307',
  }),
  v31Smoke: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-1-smoke.json',
    sha256:
      '26dd754eb2ffa486569bdf608a64a04b4f77649b82a261cc3c534fc7c0ad8406',
  }),
  v31DeliveryReceipt: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json',
    sha256:
      'd8f38a3c4d8329fe3c2bb697aa6312f0b3c5ebb9d0ea088256e0e0a6ed3f4358',
  }),
  v31DeliveryReport: Object.freeze({
    path: 'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md',
    sha256:
      '0aacc16ae2347b6281d123de43557f2cf3f476a98c7cb6e4db2d43b083969f2a',
  }),
  v31PostbuildSmokeRunner: Object.freeze({
    path: 'outputs/g4-l3-v31-postbuild-smoke-runner-r2.mjs',
    sha256:
      '653a97d49caf65ff4fdd78aec37ead0cf4255f1c51cf4cb3bb381b140fa96552',
  }),
});

export const V32_FAILED_SMOKE_ATTEMPT_PREIMAGES = Object.freeze({
  v32FailedSmokeAttemptArchive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64.zip',
    sha256:
      '5aca39fb8590889d79097fb7c429a370e2b6ac918e21cb73be4e150987ef9447',
  }),
  v32FailedSmokeAttemptManifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64/package-manifest.json',
    sha256:
      'b3f0c106de9b0da905f993c5a971211e6ef1bd4a550fa67fb899bd12c0450a34',
  }),
  v32FailedSmokeAttemptArchiveChecksum: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64.zip.sha256',
    sha256:
      '50374e80726d9c9eb6db21becfdfa31f530c8044e67e68f17caba8a975d520c0',
  }),
  v32FailedSmokeAttemptPayloadChecksums: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64/CHECKSUMS.sha256',
    sha256:
      '72e38bc2a03f6528d68daf10844e4b2da8920b18255613258ed442a9b9d42cf4',
  }),
});

export const V32_R2_FROZEN_PREIMAGES = Object.freeze({
  ...V32_FROZEN_PREIMAGES,
  ...V32_FAILED_SMOKE_ATTEMPT_PREIMAGES,
});

export const V33_FROZEN_PREIMAGES = Object.freeze({
  ...V32_R2_FROZEN_PREIMAGES,
  v32R2Archive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64.zip',
    sha256:
      '1768ae2055931f1c351f13da31a72ff96ef332f3bebaefff35c1df1fd6228d33',
  }),
  v32R2Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64/package-manifest.json',
    sha256:
      '8579e22cd961cee40f4af9a8b2aa320b1ed70c4d29f6832340b71a2c20a7a63d',
  }),
  v32R2ArchiveChecksum: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64.zip.sha256',
    sha256:
      '3e9b48cef2e50992de203c8482b22d7ae9c1d846c63cc16b7f5ef69e7000a5e2',
  }),
  v32R2PayloadChecksums: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64/CHECKSUMS.sha256',
    sha256:
      'cea30a97e6f052ac82d1dcc92b15d74da2b8b7eb55eb23b4ed56a1f332bb5477',
  }),
  v32R2Smoke: Object.freeze({
    path: 'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
    sha256:
      'eabd3ce08cca9163c318cf26834fa153d9e27db082a4c916391735c87fee6241',
  }),
  v32R2DeliveryReceipt: Object.freeze({
    path:
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
    sha256:
      '9c0bc8ee967ec29d7d3a2d91f890188c622774d4b2f880cbef9295f389e12e68',
  }),
  v32R2DeliveryReport: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
    sha256:
      '2785d2ee2708312a78aec41c6f860c9321827649a4d12072a8a0bbb29b70dc1d',
  }),
});

export const V33_FAILED_QA_ATTEMPT_PREIMAGES = Object.freeze({
  v33FailedQaAttemptReceipt: Object.freeze({
    path:
      'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
    sha256:
      '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
  }),
  v33FailedQaAttemptCourseMapEnglish: Object.freeze({
    path:
      'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa/course-map-en-1280x900.png',
    sha256:
      'a8a386925e5807ddeba25c8e697ee8f6df03b154af175a4a51f4aeb401700141',
  }),
  v33FailedQaAttemptCourseMapSpanish: Object.freeze({
    path:
      'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa/course-map-es-390x844.png',
    sha256:
      '2ac919a6e9b4d81e2724177b10d5d3b6a7df369fd65fd8981900ce3756c878cc',
  }),
  v33FailedQaAttemptPageOneEnglish: Object.freeze({
    path:
      'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa/page-01-en-desktop.png',
    sha256:
      '499ef085a73bac8b89dccf3c996317a8870f3c232dec45c6e342ec8541b186b1',
  }),
  v33FailedQaAttemptShellEnglish: Object.freeze({
    path:
      'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa/shell-en-1280x900.png',
    sha256:
      '1fd155cb8400bb2ed3a9ba92cc1fb1a19634faa97198e10285d4083ffdea496e',
  }),
  v33FailedQaAttemptShellSpanish: Object.freeze({
    path:
      'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa/shell-es-390x844.png',
    sha256:
      '50319d3d862def2850d125e0b6d2356c1264da60560a938bfa29676397aae052',
  }),
});

export const V33_R2_FROZEN_PREIMAGES = Object.freeze({
  ...V33_FROZEN_PREIMAGES,
  ...V33_FAILED_QA_ATTEMPT_PREIMAGES,
});

export const V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES = Object.freeze({
  v33R2Archive: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip',
    sha256:
      '0295d8a174507478a5982071946673d0f5c9d8593894c465f89c92d8a9a41271',
  }),
  v33R2Manifest: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64/package-manifest.json',
    sha256:
      'a0f366e66c82b542fe9b226d0a2f6800e765e3435ea91e5e2c3ef60dee073c55',
  }),
  v33R2PayloadChecksums: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64/CHECKSUMS.sha256',
    sha256:
      '4fd4e52794f6dc8910bd60dfd91eca8bde96cb49b9cc47f216e461ab419fedee',
  }),
  v33R2ArchiveChecksum: Object.freeze({
    path:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64.zip.sha256',
    sha256:
      '306e24152cc03132bc6c8ea0b2ea4ed005fd1af58806ace0a4cdbece16b10eb1',
  }),
  v33R2SmokeFailedAttemptReceipt: Object.freeze({
    path:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
    sha256:
      '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
  }),
});

export const V33_R3_FROZEN_PREIMAGES = Object.freeze({
  ...V33_R2_FROZEN_PREIMAGES,
  ...V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES,
});

const V33_FAILED_QA_ATTEMPT_SCREENSHOT_CLOSURE = Object.freeze({
  path: 'output/playwright/g4-l3-controlled-ceo-preview-v3-3-qa',
  preserved: true,
  fileCount: 5,
  totalBytes: 876815,
  treeSha256:
    '3b65a041d823e615aab11b1e89018d5af71fa38c5454dc351ed0b15f2ef29c10',
});

export const V33_R2_QA_HARNESS_REVISION = Object.freeze({
  predecessorAttemptPackageId:
    'g4-l3-whole-lesson-package-mvp-v3-3',
  predecessorAttemptStatus:
    'superseded-after-controlled-qa-harness-timeout',
  predecessorAttemptPackagePublished: false,
  predecessorAttemptFormalQaPublished: false,
  predecessorAttemptPartialScreenshotRoot:
    V33_FAILED_QA_ATTEMPT_SCREENSHOT_CLOSURE,
  predecessorAttemptFailureReceipt: Object.freeze({
    path:
      'reports/g4-l3-controlled-ceo-preview-v3-3-failed-attempt.json',
    bytes: 3211,
    sha256:
      '686c7b4cc2d2df74db551013ea03c749f006cfe6466439a3b66c1e00154d2931',
  }),
  predecessorAttemptOverwritten: false,
  productFailureEstablished: false,
  changeClass: 'qa-harness-only',
  authoredProductSourceChangedFromV33: false,
  correctedBeforePackaging: true,
  externalPostbuildCorrectionUsed: false,
  strictAcceptanceEffect: 'none',
});

export const KEY_TERMS_FOCUS_RESTORATION_MODE =
  'same-player-visible-responsive-key-terms-button';

export const V33_R3_SMOKE_HARNESS_REVISION = Object.freeze({
  predecessorAttemptPackageId:
    'g4-l3-whole-lesson-package-mvp-v3-3-r2',
  predecessorAttemptStatus:
    'superseded-after-primary-smoke-focus-contract-failure',
  predecessorAttemptFailureReceipt: Object.freeze({
    path:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt.json',
    bytes: 8526,
    sha256:
      '4c9847894abe3d39d57a58580de84770330a2552c7a4755054c95fa6e4adb894',
  }),
  predecessorAttemptPackage: Object.freeze({
    archive: V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Archive,
    manifest: V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2Manifest,
    payloadChecksums:
      V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2PayloadChecksums,
    archiveChecksum:
      V33_R2_FAILED_SMOKE_ATTEMPT_PREIMAGES.v33R2ArchiveChecksum,
  }),
  predecessorPackageVerifierPassed: true,
  predecessorFormalSmokeReportPublished: false,
  predecessorDeliveryReceiptPublished: false,
  predecessorOverwritten: false,
  productFailureEstablished: false,
  changeClass: 'qa-harness-only',
  harnessScope: 'fresh-unzip-package-smoke',
  authoredProductSourceChangedFromV33R2: false,
  productBuildConfigurationChangedFromV33R2: false,
  qaAndReadabilityEvidenceReusedFrom: 'v3-3-r2',
  focusRestorationMode: KEY_TERMS_FOCUS_RESTORATION_MODE,
  focusRestorationSelector:
    'button[data-responsive-focus-key="key-terms"]',
  focusPredicateNames: Object.freeze([
    'tagIsButton',
    'responsiveKeyIsKeyTerms',
    'samePlayer',
    'connected',
    'visible',
    'enabled',
    'notHidden',
    'notInert',
  ]),
  arbitraryVisibleElementAccepted: false,
  sourceHotspotFocusRequired: false,
  rw003SourceStopHoldAndExplicitResumeStillRequired: true,
  externalPostbuildCorrectionUsed: false,
  strictAcceptanceEffect: 'none',
});

const V33_PREDECESSOR_RECEIPT_FINGERPRINT_SHA256 =
  'e8aab0471d3d933128103ee0d8b650d6f7e1d9e9867891157cfb2f861397e965';
const V33_PREDECESSOR_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 1264,
  totalBytes: 191299550,
  sha256:
    '7a104541d8c5c7917edd853d208d775ec6b6eb327676931c62909e5a15c34f91',
});

export const V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH = Object.freeze([
  Object.freeze({
    path: 'apps/web/app/globals.css',
    sha256:
      '7e7d642b9649e57892f2218fc6d482cf3e559971339880e5da712fe7b71ea718',
    role: 'authored-runtime',
    predecessor: Object.freeze({
      status: 'available',
      sha256:
        '9b613e51e418f0e5764c119a7aef062908bc5070b2c853002c724d346871a665',
      changed: true,
    }),
  }),
  Object.freeze({
    path: 'apps/web/components/legacy-responsive-lesson-shell.tsx',
    sha256:
      'dfbe3ee58ad7427acb30fa4c426ddfa67add30008ee4d458b5e533f2b84c7adf',
    role: 'authored-runtime',
    predecessor: Object.freeze({
      status: 'available',
      sha256:
        'a6a493586e7f9cc7e599952d614e92f9a01e837c9e1c3959a9b30f0427128f2e',
      changed: true,
    }),
  }),
  Object.freeze({
    path: 'apps/web/tests/g4-l3-whole-lesson.test.ts',
    sha256:
      '3aaa8cd121f0b722398453b5a5b94c6a396dd98af5b56a59d6383618e2440084',
    role: 'unit-test',
    predecessor: Object.freeze({
      status: 'available',
      sha256:
        '87ba0c01125d2f38f0411abb2b60efabc1861e9f82a02c00db9aef63739970d0',
      changed: true,
    }),
  }),
  Object.freeze({
    path: 'apps/web/tests/legacy-support-tools.test.ts',
    sha256:
      '4e4d9a39ef8b5523f03aa9ff5d8ac95856c93dd5e538fcc9f4bc7978407479b6',
    role: 'unit-test',
    predecessor: Object.freeze({
      status: 'unavailable',
      sha256: null,
      changed: null,
    }),
  }),
  Object.freeze({
    path: 'apps/web/e2e/legacy-lesson-shell-responsive.spec.ts',
    sha256:
      '922b1092a6c1264f2be18cecedaf8a80bae7d8dd6043b4a8088c1774c630e9c3',
    role: 'browser-test',
    predecessor: Object.freeze({
      status: 'available',
      sha256:
        'f743be52d5b9f3af9ebb239730a0984adc866aa05b9a7f8cadcc9228bb06cd6e',
      changed: true,
    }),
  }),
  Object.freeze({
    path: 'apps/web/playwright.config.ts',
    sha256:
      'ca07621fc2b4ef43c16165ad2f146c5dc4027f8caaf9ab216fc576a2853b053d',
    role: 'browser-config',
    predecessor: Object.freeze({
      status: 'available',
      sha256:
        '4083f84ea606c053eed30892f64ca18ef939ee1c192ad9f1cb0661da18ce2820',
      changed: true,
    }),
  }),
]);

export const V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS = Object.freeze([
  Object.freeze({
    path: 'apps/web/app/globals.css',
    sha256:
      '9b613e51e418f0e5764c119a7aef062908bc5070b2c853002c724d346871a665',
  }),
  Object.freeze({
    path: 'apps/web/components/legacy-responsive-lesson-shell.tsx',
    sha256:
      'a6a493586e7f9cc7e599952d614e92f9a01e837c9e1c3959a9b30f0427128f2e',
  }),
  Object.freeze({
    path: 'apps/web/tests/g4-l3-whole-lesson.test.ts',
    sha256:
      '87ba0c01125d2f38f0411abb2b60efabc1861e9f82a02c00db9aef63739970d0',
  }),
  Object.freeze({
    path: 'apps/web/tests/legacy-lesson-layout.test.ts',
    sha256:
      '494faa94cb92bb8c4d94fb2ed0f6834820cf09e0baed0a25eb107e543dac4869',
  }),
  Object.freeze({
    path: 'apps/web/e2e/legacy-lesson-shell-responsive.spec.ts',
    sha256:
      'f743be52d5b9f3af9ebb239730a0984adc866aa05b9a7f8cadcc9228bb06cd6e',
  }),
  Object.freeze({
    path: 'apps/web/playwright.config.ts',
    sha256:
      '4083f84ea606c053eed30892f64ca18ef939ee1c192ad9f1cb0661da18ce2820',
  }),
]);

export const V32_PREIMPLEMENTATION_SOURCE_AUDIT = Object.freeze({
  auditedAt: '2026-08-01T17:34:01+08:00',
  predecessorInventory: Object.freeze({
    fileCount: 1089,
    totalBytes: 171893392,
    sha256:
      'a9edc5c5724c4268c906f593bde216c9f9bfe918ebbd2f6eed7bc7ada0890ba1',
  }),
  frozenCurrentInventory: Object.freeze({
    fileCount: 1090,
    totalBytes: 171939088,
    sha256:
      '99b56068c9b8d1db9e1b65027fa887b783b38028365f5f1dfc76327bf437d044',
  }),
  delta: Object.freeze({added: 1, changed: 13, removed: 0}),
  exhaustiveCompactOnlyDelta: false,
});
const V3_READABILITY_CROP_CONTRACTS = Object.freeze([
  Object.freeze({
    id: 'step-3',
    sourceRect: Object.freeze({x: 292, y: 147, width: 236, height: 149}),
    paddedCropRect:
      Object.freeze({x: 288, y: 143, width: 244, height: 157}),
    asset: Object.freeze({
      path:
        'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-3.png',
      bytes: 23194,
      sha256:
        'cb43e972f1043af58a03f01f280eec09b8f39e816e2f23d1e6bf6ad7bb996731',
    }),
    sourceCharacterIds: Object.freeze([99, 100, 101, 133]),
    transcriptSha256:
      '74944b2787363422dfb1381cc84c3351bf81b25804e86ea869861842749002bd',
  }),
  Object.freeze({
    id: 'step-4',
    sourceRect: Object.freeze({x: 292, y: 296, width: 236, height: 191}),
    paddedCropRect:
      Object.freeze({x: 288, y: 292, width: 244, height: 199}),
    asset: Object.freeze({
      path:
        'public/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-4.png',
      bytes: 26225,
      sha256:
        '02af808cbd1c1a8bbb20dda3084a68240c0e4310f08b6f3120963d76c1e7e756',
    }),
    sourceCharacterIds:
      Object.freeze([144, 145, 146, 147, 148, 149, 150, 151, 152]),
    transcriptSha256:
      '8c476e7328340df57c59936050b0905b786249e4f31d1fa4267153d6355ff796',
  }),
]);
const PACKAGE_VARIANTS = Object.freeze({
  v1: Object.freeze({
    version: 'v1',
    packageId: 'g4-l3-whole-lesson-package-mvp-v1',
    title: 'G4 L3 Whole-Lesson Package MVP',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v1-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package/es-mobile-player.png',
    verifyCurrentInputSnapshot: false,
    bindSmokeScreenshot: false,
    smokeFromDisposableCopy: false,
    smokeFromArchive: false,
    strongNavigationChecks: false,
    requireFrozenV2Page36Parity: false,
    distDir: '.next-g4-l3-package',
    defaultPort: 3216,
    checkFromArchive: false,
    immutableBuild: false,
  }),
  v2: Object.freeze({
    version: 'v2',
    packageId: 'g4-l3-whole-lesson-package-mvp-v2',
    title: 'G4 L3 Whole-Lesson Package MVP',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v2-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v2-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v2/es-mobile-player.png',
    verifyCurrentInputSnapshot: false,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: true,
    smokeFromArchive: false,
    strongNavigationChecks: true,
    requireFrozenV2Page36Parity: false,
    distDir: '.next-g4-l3-package',
    defaultPort: 3216,
    checkFromArchive: true,
    immutableBuild: false,
    finalizedReadOnly: true,
  }),
  v3: Object.freeze({
    version: 'v3',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3/es-mobile-player.png',
    verifyCurrentInputSnapshot: false,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    requireFrozenV2Page36Parity: true,
    distDir: '.next-g4-l3-package',
    defaultPort: 3216,
    checkFromArchive: true,
    immutableBuild: false,
    finalizedReadOnly: true,
    readabilityEvidence: Object.freeze({
      json: V3_READABILITY_REPORT_JSON,
      markdown: V3_READABILITY_REPORT_MD,
      screenshotRoot: V3_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3',
      baseUrl: 'http://127.0.0.1:3216',
    }),
    controlledQaEvidence: Object.freeze({
      json: CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-qa',
      baseUrl: 'http://127.0.0.1:3216',
    }),
  }),
  'v3-1': Object.freeze({
    version: 'v3-1',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.1 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-1-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-1-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-1/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    requireFrozenV2Page36Parity: true,
    distDir: '.next-g4-l3-package-v3-1',
    defaultPort: 3217,
    checkFromArchive: true,
    immutableBuild: true,
    finalizedReadOnly: true,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-1-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-1-delivery-report.md',
    frozenPreimages: V31_FROZEN_PREIMAGES,
    readabilityEvidence: Object.freeze({
      json: V31_READABILITY_REPORT_JSON,
      markdown: V31_READABILITY_REPORT_MD,
      screenshotRoot: V31_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-1',
      baseUrl: 'http://127.0.0.1:3217',
    }),
    controlledQaEvidence: Object.freeze({
      json: V31_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V31_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V31_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-1-qa',
      baseUrl: 'http://127.0.0.1:3217',
    }),
    regressionEvidence: Object.freeze({
      json: V31_REGRESSION_REPORT_JSON,
      browserQa: V31_REGRESSION_BROWSER_QA_JSON,
      sourceInventory: V31_REGRESSION_SOURCE_INVENTORY_JSON,
      markdown: V31_REGRESSION_REPORT_MD,
      screenshotRoot: V31_REGRESSION_SCREENSHOT_ROOT,
      reportType: 'g4-l3-v31-post-v3-current-js-regression',
      browserQaReportType: 'g4-l3-v31-post-v3-browser-qa',
      sourceInventoryType: 'g4-l3-v31-post-v3-source-inventory',
    }),
  }),
  'v3-2': Object.freeze({
    version: 'v3-2',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-2',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.2 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-2-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    advancedSuccessorSmokeChecks: true,
    compactLandscapeChecks: true,
    requireFrozenV2Page36Parity: true,
    page36CandidateKey: 'v32',
    bindFullCurrentSourceInventory: true,
    distDir: '.next-g4-l3-package-v3-2',
    defaultPort: 3218,
    checkFromArchive: true,
    immutableBuild: true,
    finalizedReadOnly: true,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-delivery-report.md',
    frozenPreimages: V32_FROZEN_PREIMAGES,
    successorRevision: Object.freeze({
      predecessorPackageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
      predecessorReceiptFingerprintSha256:
        '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580',
      compactLandscapeSourceContracts:
        V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS,
      preimplementationSourceAudit: V32_PREIMPLEMENTATION_SOURCE_AUDIT,
      exhaustiveByteDeltaFromV31Established: false,
      strictAcceptanceEffect: 'none',
    }),
    readabilityEvidence: Object.freeze({
      json: V32_READABILITY_REPORT_JSON,
      markdown: V32_READABILITY_REPORT_MD,
      screenshotRoot: V32_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-2',
      baseUrl: 'http://127.0.0.1:3218',
    }),
    controlledQaEvidence: Object.freeze({
      json: V32_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V32_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V32_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-2-qa',
      baseUrl: 'http://127.0.0.1:3218',
    }),
  }),
  'v3-2-r2': Object.freeze({
    version: 'v3-2',
    artifactRevision: 'r2',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-2-r2',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.2-r2 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-2-r2-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-2-r2/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    advancedSuccessorSmokeChecks: true,
    compactLandscapeChecks: true,
    requireFrozenV2Page36Parity: true,
    page36CandidateKey: 'v32r2',
    bindFullCurrentSourceInventory: true,
    distDir: '.next-g4-l3-package-v3-2',
    defaultPort: 3218,
    checkFromArchive: true,
    immutableBuild: true,
    finalizedReadOnly: true,
    smokeVerifierImplementation: 'primary-package-builder-v3-2-r2',
    correctedCompactSmokeHarness: true,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-r2-delivery-report.md',
    frozenPreimages: V32_R2_FROZEN_PREIMAGES,
    smokeHarnessRevision: Object.freeze({
      predecessorAttemptPackageId:
        'g4-l3-whole-lesson-package-mvp-v3-2',
      predecessorAttemptStatus:
        'superseded-after-primary-smoke-harness-failure',
      predecessorAttemptPrimaryBuilderSha256:
        'ef4bab3904eb1c7030486d9b7dc3ed66bcc733eaa5881ca461ae9caee71ed5e7',
      predecessorPackageVerifierPassed: true,
      predecessorFormalSmokeReportPublished: false,
      predecessorDeliveryReceiptPublished: false,
      predecessorOverwritten: false,
      productFailureEstablished: false,
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
      corrections: Object.freeze([
        Object.freeze({
          id: 'compact-visible-course-map-navigation',
          effect: 'smoke-harness-only',
        }),
        Object.freeze({
          id: 'compact-shell-root-identity',
          effect: 'smoke-harness-only',
        }),
        Object.freeze({
          id: 'compact-resume-state-isolation-and-settling',
          effect: 'smoke-harness-only',
        }),
      ]),
      strictAcceptanceEffect: 'none',
    }),
    successorRevision: Object.freeze({
      predecessorPackageId: 'g4-l3-whole-lesson-package-mvp-v3-1',
      predecessorReceiptFingerprintSha256:
        '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580',
      compactLandscapeSourceContracts:
        V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS,
      preimplementationSourceAudit: V32_PREIMPLEMENTATION_SOURCE_AUDIT,
      exhaustiveByteDeltaFromV31Established: false,
      strictAcceptanceEffect: 'none',
    }),
    readabilityEvidence: Object.freeze({
      json: V32_READABILITY_REPORT_JSON,
      markdown: V32_READABILITY_REPORT_MD,
      screenshotRoot: V32_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-2',
      baseUrl: 'http://127.0.0.1:3218',
    }),
    controlledQaEvidence: Object.freeze({
      json: V32_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V32_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V32_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-2-qa',
      baseUrl: 'http://127.0.0.1:3218',
    }),
  }),
  'v3-3': Object.freeze({
    version: 'v3-3',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-3',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.3 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    advancedSuccessorSmokeChecks: true,
    compactLandscapeChecks: true,
    requireFrozenV2Page36Parity: true,
    page36CandidateKey: 'v33',
    bindFullCurrentSourceInventory: true,
    distDir: '.next-g4-l3-package-v3-3',
    defaultPort: 3219,
    checkFromArchive: true,
    immutableBuild: true,
    finalizedReadOnly: true,
    smokeVerifierImplementation: 'primary-package-builder-v3-3',
    correctedCompactSmokeHarness: true,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md',
    frozenPreimages: V33_FROZEN_PREIMAGES,
    successorRevision: Object.freeze({
      predecessorPackageId:
        'g4-l3-whole-lesson-package-mvp-v3-2-r2',
      predecessorReceiptFingerprintSha256:
        V33_PREDECESSOR_RECEIPT_FINGERPRINT_SHA256,
      predecessorSourceSnapshot: V33_PREDECESSOR_SOURCE_SNAPSHOT,
      declaredSixFileProductAndVerificationBatch:
        V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
      authoredProductSourceChangedFromV32R2: true,
      fullCurrentV33SourceSnapshotBound: true,
      allSixChangedEstablished: false,
      exhaustiveByteDeltaFromV32R2Established: false,
      declaredBatchIsOnlyRepoDelta: false,
      strictAcceptanceEffect: 'none',
    }),
    readabilityEvidence: Object.freeze({
      json: V33_READABILITY_REPORT_JSON,
      markdown: V33_READABILITY_REPORT_MD,
      screenshotRoot: V33_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3',
      baseUrl: 'http://127.0.0.1:3219',
    }),
    controlledQaEvidence: Object.freeze({
      json: V33_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V33_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V33_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-qa',
      baseUrl: 'http://127.0.0.1:3219',
    }),
  }),
  'v3-3-r2': Object.freeze({
    version: 'v3-3',
    artifactRevision: 'r2',
    qaArtifactVersion: 'v3-3-r2',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-3-r2',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.3-r2 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-3-r2-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r2/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    advancedSuccessorSmokeChecks: true,
    compactLandscapeChecks: true,
    requireFrozenV2Page36Parity: true,
    page36CandidateKey: 'v33r2',
    bindFullCurrentSourceInventory: true,
    distDir: '.next-g4-l3-package-v3-3',
    defaultPort: 3219,
    checkFromArchive: true,
    immutableBuild: true,
    finalizedReadOnly: true,
    smokeVerifierImplementation: 'primary-package-builder-v3-3-r2',
    correctedCompactSmokeHarness: true,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery-report.md',
    frozenPreimages: V33_R2_FROZEN_PREIMAGES,
    qaHarnessRevision: V33_R2_QA_HARNESS_REVISION,
    successorRevision: Object.freeze({
      predecessorPackageId:
        'g4-l3-whole-lesson-package-mvp-v3-2-r2',
      predecessorReceiptFingerprintSha256:
        V33_PREDECESSOR_RECEIPT_FINGERPRINT_SHA256,
      predecessorSourceSnapshot: V33_PREDECESSOR_SOURCE_SNAPSHOT,
      declaredSixFileProductAndVerificationBatch:
        V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
      authoredProductSourceChangedFromV32R2: true,
      fullCurrentV33SourceSnapshotBound: true,
      allSixChangedEstablished: false,
      exhaustiveByteDeltaFromV32R2Established: false,
      declaredBatchIsOnlyRepoDelta: false,
      strictAcceptanceEffect: 'none',
    }),
    readabilityEvidence: Object.freeze({
      json: V33_R2_READABILITY_REPORT_JSON,
      markdown: V33_R2_READABILITY_REPORT_MD,
      screenshotRoot: V33_R2_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3-r2',
      baseUrl: 'http://127.0.0.1:3219',
    }),
    controlledQaEvidence: Object.freeze({
      json: V33_R2_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V33_R2_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V33_R2_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
      baseUrl: 'http://127.0.0.1:3219',
    }),
  }),
  'v3-3-r3': Object.freeze({
    version: 'v3-3',
    artifactRevision: 'r3',
    qaArtifactVersion: 'v3-3-r2',
    packageId: 'g4-l3-whole-lesson-package-mvp-v3-3-r3',
    title:
      'G4 L3 Whole-Lesson CEO Preview v3.3-r3 — current JavaScript candidate',
    packageBasename:
      'g4-l3-whole-lesson-package-mvp-v3-3-r3-darwin-arm64',
    smokeReportRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-smoke.json',
    smokeScreenshotRelative:
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r3/es-mobile-player.png',
    verifyCurrentInputSnapshot: true,
    bindSmokeScreenshot: true,
    smokeFromDisposableCopy: false,
    smokeFromArchive: true,
    strongNavigationChecks: true,
    advancedSuccessorSmokeChecks: true,
    compactLandscapeChecks: true,
    requireFrozenV2Page36Parity: true,
    page36CandidateKey: 'v33r3',
    bindFullCurrentSourceInventory: true,
    distDir: '.next-g4-l3-package-v3-3',
    defaultPort: 3219,
    checkFromArchive: true,
    immutableBuild: true,
    smokeVerifierImplementation: 'primary-package-builder-v3-3-r3',
    correctedCompactSmokeHarness: true,
    keyTermsFocusRestorationMode: KEY_TERMS_FOCUS_RESTORATION_MODE,
    deliveryReceiptRelative:
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery.json',
    deliveryReportRelative:
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r3-delivery-report.md',
    frozenPreimages: V33_R3_FROZEN_PREIMAGES,
    qaHarnessRevision: V33_R2_QA_HARNESS_REVISION,
    packageSmokeHarnessRevision: V33_R3_SMOKE_HARNESS_REVISION,
    qaEvidenceReuse: Object.freeze({
      sourceArtifactVersion: 'v3-3-r2',
      reason: 'qa-harness-only-successor-with-unchanged-product-source',
      readabilityReport:
        V33_R2_READABILITY_REPORT_JSON,
      controlledQaReport:
        V33_R2_CONTROLLED_CEO_PREVIEW_QA_JSON,
      copiedOrRegeneratedAsR3Reports: false,
      authoredProductSourceChangedFromV33R2: false,
      productBuildConfigurationChangedFromV33R2: false,
      strictAcceptanceEffect: 'none',
    }),
    successorRevision: Object.freeze({
      predecessorPackageId:
        'g4-l3-whole-lesson-package-mvp-v3-2-r2',
      predecessorReceiptFingerprintSha256:
        V33_PREDECESSOR_RECEIPT_FINGERPRINT_SHA256,
      predecessorSourceSnapshot: V33_PREDECESSOR_SOURCE_SNAPSHOT,
      declaredSixFileProductAndVerificationBatch:
        V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH,
      authoredProductSourceChangedFromV32R2: true,
      fullCurrentV33SourceSnapshotBound: true,
      allSixChangedEstablished: false,
      exhaustiveByteDeltaFromV32R2Established: false,
      declaredBatchIsOnlyRepoDelta: false,
      strictAcceptanceEffect: 'none',
    }),
    readabilityEvidence: Object.freeze({
      json: V33_R2_READABILITY_REPORT_JSON,
      markdown: V33_R2_READABILITY_REPORT_MD,
      screenshotRoot: V33_R2_READABILITY_SCREENSHOT_ROOT,
      reportType: 'g4-l3-current-js-readability-v3-3-r2',
      baseUrl: 'http://127.0.0.1:3219',
    }),
    controlledQaEvidence: Object.freeze({
      json: V33_R2_CONTROLLED_CEO_PREVIEW_QA_JSON,
      markdown: V33_R2_CONTROLLED_CEO_PREVIEW_QA_MD,
      screenshotRoot: V33_R2_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
      reportType: 'g4-l3-controlled-ceo-preview-v3-3-r2-qa',
      baseUrl: 'http://127.0.0.1:3219',
    }),
  }),
});
const RELEASE_ID = 'lesson-g04-l03-negative-numbers';
const COURSE_ASSET_EXTENSIONS = new Set([
  '.js',
  '.mp3',
  '.png',
  '.svg',
  '.ttf',
]);
const CATALOG_FILES = [
  'catalog/animations.json',
  'catalog/missing-references.json',
  'catalog/completion-ledger.json',
  'catalog/lesson-releases.json',
  'catalog/lesson-release-ledger.json',
];
const SOURCE_INPUTS = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/content',
  'apps/web/i18n',
  'apps/web/lib',
  'apps/web/public',
  'apps/web/next.config.ts',
  'apps/web/postcss.config.mjs',
  'apps/web/proxy.ts',
  // Next rewrites next-env.d.ts when switching between the ordinary dev
  // output and this package-only distDir. It is generated type plumbing, not
  // a production runtime input, so source-drift checks intentionally exclude
  // it while continuing to bind every authored app/runtime input below.
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'components',
  'lib',
  'packages/demos/src',
  'packages/demos/package.json',
  'packages/demos/prototype-registry.json',
  'packages/demos/tsconfig.json',
  'scripts/build-g4-l3-v31-post-v3-regression-receipt.mjs',
  'scripts/build-g4-l3-whole-lesson-package-mvp.mjs',
  'scripts/qa-g4-l3-current-js-product.mjs',
  'scripts/qa-g4-l3-current-js-readability-v3.mjs',
  'package.json',
  'package-lock.json',
  'reports/g4-l3-lesson-product-navigation-contract.json',
  'reports/g5-l4-source-scope-freeze.json',
  'catalog/lessons.json',
  ...CATALOG_FILES,
];
const FORBIDDEN_PACKAGE_PARTS = [
  'source-assets',
  'private-archive',
  'Extracted_NewHelpProgram_20210203',
  'Historical Office Documents of HELP MATH Program',
];
const FORBIDDEN_PACKAGE_EXTENSIONS =
  /\.(?:bak|bcp|env|fla|jsonl|sql|swf)$/i;
const ABSOLUTE_LOCAL_PATH_MARKERS = ['/Users/', '/Volumes/'];
const EVIDENCE_FILES = [
  'reports/g4-l3-v3-execution-checkpoint.json',
  'reports/g4-l3-v3-execution-checkpoint.md',
];
const V3_SOURCE_INPUTS = [
  TS008_SOURCE_PATH,
  V3_READABILITY_REPORT_JSON,
  V3_READABILITY_REPORT_MD,
  V3_READABILITY_SCREENSHOT_ROOT,
  CONTROLLED_CEO_PREVIEW_QA_JSON,
  CONTROLLED_CEO_PREVIEW_QA_MD,
  CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
];
const V31_SOURCE_INPUTS = [
  TS008_SOURCE_PATH,
  V31_READABILITY_REPORT_JSON,
  V31_READABILITY_REPORT_MD,
  V31_READABILITY_SCREENSHOT_ROOT,
  V31_CONTROLLED_CEO_PREVIEW_QA_JSON,
  V31_CONTROLLED_CEO_PREVIEW_QA_MD,
  V31_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
  V31_REGRESSION_REPORT_JSON,
  V31_REGRESSION_BROWSER_QA_JSON,
  V31_REGRESSION_SOURCE_INVENTORY_JSON,
  V31_REGRESSION_REPORT_MD,
  V31_REGRESSION_SCREENSHOT_ROOT,
];
const V32_SOURCE_INPUTS = [
  TS008_SOURCE_PATH,
  V32_READABILITY_REPORT_JSON,
  V32_READABILITY_REPORT_MD,
  V32_READABILITY_SCREENSHOT_ROOT,
  V32_CONTROLLED_CEO_PREVIEW_QA_JSON,
  V32_CONTROLLED_CEO_PREVIEW_QA_MD,
  V32_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
];
const V33_SOURCE_INPUTS = [
  TS008_SOURCE_PATH,
  V33_READABILITY_REPORT_JSON,
  V33_READABILITY_REPORT_MD,
  V33_READABILITY_SCREENSHOT_ROOT,
  V33_CONTROLLED_CEO_PREVIEW_QA_JSON,
  V33_CONTROLLED_CEO_PREVIEW_QA_MD,
  V33_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
];
const V33_R2_SOURCE_INPUTS = [
  TS008_SOURCE_PATH,
  V33_R2_READABILITY_REPORT_JSON,
  V33_R2_READABILITY_REPORT_MD,
  V33_R2_READABILITY_SCREENSHOT_ROOT,
  V33_R2_CONTROLLED_CEO_PREVIEW_QA_JSON,
  V33_R2_CONTROLLED_CEO_PREVIEW_QA_MD,
  V33_R2_CONTROLLED_CEO_PREVIEW_QA_SCREENSHOT_ROOT,
  V33_R2_QA_HARNESS_REVISION.predecessorAttemptFailureReceipt.path,
];
const V33_R3_SOURCE_INPUTS = [
  ...V33_R2_SOURCE_INPUTS,
  V33_R3_SMOKE_HARNESS_REVISION.predecessorAttemptFailureReceipt.path,
];

const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

async function sha256File(file) {
  return sha256(await readFile(file));
}

export async function assertV3FrozenPreimages() {
  for (const [identity, expected] of Object.entries(V3_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3 preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV31FrozenPreimages() {
  for (const [identity, expected] of Object.entries(V31_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.1 preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV32FrozenPreimages() {
  for (const [identity, expected] of Object.entries(V32_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.2 predecessor preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV32R2FrozenPreimages() {
  for (const [identity, expected] of
    Object.entries(V32_R2_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.2 r2 preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV33FrozenPreimages() {
  for (const [identity, expected] of Object.entries(V33_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.3 predecessor preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV33R2FrozenPreimages() {
  for (const [identity, expected] of
    Object.entries(V33_R2_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.3 r2 preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

export async function assertV33R3FrozenPreimages() {
  for (const [identity, expected] of
    Object.entries(V33_R3_FROZEN_PREIMAGES)) {
    const absolutePath = path.join(WORKSPACE_ROOT, expected.path);
    const metadata = await stat(absolutePath);
    const actualSha256 = await sha256File(absolutePath);
    if (!metadata.isFile() || actualSha256 !== expected.sha256) {
      throw new Error(
        `Frozen v3.3 r3 preimage drifted (${identity}): ${expected.path}`,
      );
    }
  }
  return true;
}

async function assertFrozenPreimagesForVariant(variant) {
  if (variant.version === 'v2') {
    for (const expected of [
      V3_FROZEN_PREIMAGES.v2Archive,
      V3_FROZEN_PREIMAGES.v2Manifest,
    ]) {
      if (await sha256File(path.join(WORKSPACE_ROOT, expected.path))
          !== expected.sha256) {
        throw new Error(`Frozen v2 artifact drifted: ${expected.path}`);
      }
    }
  }
  if (variant.version === 'v3') await assertV31FrozenPreimages();
  if (variant.version === 'v3-1') await assertV31FrozenPreimages();
  if (variant.version === 'v3-2') {
    if (variant.artifactRevision === 'r2') {
      await assertV32R2FrozenPreimages();
    } else {
      await assertV32FrozenPreimages();
    }
  }
  if (variant.version === 'v3-3') {
    if (variant.artifactRevision === 'r3') {
      await assertV33R3FrozenPreimages();
    } else if (variant.artifactRevision === 'r2') {
      await assertV33R2FrozenPreimages();
    } else {
      await assertV33FrozenPreimages();
    }
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ['--build', '--check', '--smoke'].includes(argument)
  );
  const versionFlags = argv.filter((argument) =>
    [
      '--v2',
      '--v3',
      '--v3-1',
      '--v3-2',
      '--v3-2-r2',
      '--v3-3',
      '--v3-3-r2',
      '--v3-3-r3',
    ].includes(argument)
  );
  const unknown = argv.filter((argument) =>
    ![
      '--build',
      '--check',
      '--smoke',
      '--v2',
      '--v3',
      '--v3-1',
      '--v3-2',
      '--v3-2-r2',
      '--v3-3',
      '--v3-3-r2',
      '--v3-3-r3',
    ].includes(argument)
  );
  if (
    unknown.length
    || modes.length !== 1
    || versionFlags.length > 1
    || argv.length !== modes.length + versionFlags.length
  ) {
    throw new Error(
      'Use exactly one mode: --build, --check, or --smoke; add at most one mutually exclusive --v2, --v3, --v3-1, --v3-2, --v3-2-r2, --v3-3, --v3-3-r2, or --v3-3-r3 package chain flag.',
    );
  }
  const mode = modes[0].slice(2);
  return versionFlags.length === 1
    ? `${versionFlags[0].slice(2)}:${mode}`
    : mode;
}

export function resolvePackageVariant(version) {
  const descriptor = PACKAGE_VARIANTS[version];
  if (!descriptor) throw new Error(`Unsupported package version: ${version}`);
  const packageRoot = path.join(OUTPUTS_ROOT, descriptor.packageBasename);
  const archivePath = `${packageRoot}.zip`;
  return Object.freeze({
    ...descriptor,
    packageRoot,
    archivePath,
    archiveShaPath: `${archivePath}.sha256`,
    deliveryReceiptPath: descriptor.deliveryReceiptRelative
      ? path.join(WORKSPACE_ROOT, descriptor.deliveryReceiptRelative)
      : null,
    deliveryReportPath: descriptor.deliveryReportRelative
      ? path.join(WORKSPACE_ROOT, descriptor.deliveryReportRelative)
      : null,
    smokeReportPath: path.join(
      WORKSPACE_ROOT,
      descriptor.smokeReportRelative,
    ),
    smokeScreenshotPath: path.join(
      WORKSPACE_ROOT,
      descriptor.smokeScreenshotRelative,
    ),
  });
}

export function assertVariantModeAllowed(variant, mode) {
  if (
    variant?.finalizedReadOnly === true
    && (mode === 'build' || mode === 'smoke')
  ) {
    throw new Error(
      `${variant.packageId} is frozen and finalized; only read-only --check is allowed.`,
    );
  }
  return true;
}

async function assertPathAbsent(absolutePath, label) {
  if (!absolutePath) return;
  try {
    await lstat(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(
    `${label} already exists; immutable package artifacts are never overwritten: ${path.relative(WORKSPACE_ROOT, absolutePath)}`,
  );
}

export async function assertImmutableBuildTargetsAbsent(variant) {
  if (!variant.immutableBuild) return true;
  await assertPathAbsent(variant.packageRoot, 'Package directory');
  await assertPathAbsent(variant.archivePath, 'Package ZIP');
  await assertPathAbsent(variant.archiveShaPath, 'Package ZIP checksum');
  if (variant.smokeReportPath) {
    await assertPathAbsent(variant.smokeReportPath, 'Smoke report');
  }
  if (variant.smokeScreenshotPath) {
    await assertPathAbsent(
      path.dirname(variant.smokeScreenshotPath),
      'Smoke screenshot root',
    );
  }
  await assertPathAbsent(variant.deliveryReceiptPath, 'Delivery receipt');
  await assertPathAbsent(variant.deliveryReportPath, 'Delivery report');
  return true;
}

async function assertDeliveryNotFinalized(variant) {
  if (!variant.immutableBuild) return;
  await assertPathAbsent(variant.deliveryReceiptPath, 'Delivery receipt');
  await assertPathAbsent(variant.deliveryReportPath, 'Delivery report');
}

export function assertPackageInputSnapshotCurrent(
  manifest,
  currentSnapshot,
  requireFinalSnapshot = true,
) {
  const finalSnapshot = manifest?.build?.inputSnapshotFinal
    ?? manifest?.build?.inputSnapshotAfter;
  if (
    stableJson(manifest?.build?.inputSnapshotBefore)
      !== stableJson(manifest?.build?.inputSnapshotAfter)
    || (requireFinalSnapshot && !manifest?.build?.inputSnapshotFinal)
    || stableJson(manifest?.build?.inputSnapshotAfter)
      !== stableJson(finalSnapshot)
    || stableJson(currentSnapshot)
      !== stableJson(finalSnapshot)
  ) {
    throw new Error(
      'The package input snapshot does not match the current source tree.',
    );
  }
  return true;
}

export function buildSmokeScreenshotBinding(relativePath, bytes) {
  if (
    typeof relativePath !== 'string'
    || relativePath.length === 0
    || path.isAbsolute(relativePath)
    || relativePath.split('/').some((part) =>
      part === '' || part === '.' || part === '..'
    )
  ) {
    throw new Error('Smoke screenshot path must be safe and relative.');
  }
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return {
    path: relativePath,
    bytes: buffer.length,
    sha256: sha256(buffer),
  };
}

export function isAllowedCourseAsset(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return !normalized.includes('/../')
    && !normalized.startsWith('../')
    && COURSE_ASSET_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

export function selectG4L3Release(document) {
  const release = document?.releases?.find(
    (candidate) => candidate?.releaseId === RELEASE_ID,
  );
  if (
    !release
    || release.publicationMode !== 'atomic'
    || release.expectedCounts?.activeXmlReferencedPages !== 39
    || release.expectedCounts?.courseShells !== 1
    || release.expectedCounts?.members !== 40
    || !Array.isArray(release.members)
    || release.members.length !== 40
  ) {
    throw new Error('The exact 39-page plus shell release is unavailable.');
  }
  const ids = release.members.map((member) => member.animationId);
  if (
    ids.some((id) => typeof id !== 'string' || !id)
    || new Set(ids).size !== 40
    || ids.filter((id) => id === 'shell-course-g04-l03-index-local').length !== 1
  ) {
    throw new Error('The G4 L3 release member set is malformed.');
  }
  return release;
}

async function walkFiles(root, options = {}) {
  const result = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const absolutePath = path.join(directory, entry.name);
      const metadata = await lstat(absolutePath);
      if (metadata.isSymbolicLink()) {
        if (options.allowSymlinks) {
          result.push({absolutePath, metadata, relativePath: path.relative(root, absolutePath)});
          continue;
        }
        throw new Error(`Symbolic links are not allowed: ${absolutePath}`);
      }
      if (metadata.isDirectory()) {
        await visit(absolutePath);
      } else if (metadata.isFile()) {
        result.push({
          absolutePath,
          metadata,
          relativePath: path.relative(root, absolutePath).split(path.sep).join('/'),
        });
      }
    }
  }
  await visit(root);
  return result;
}

export async function buildCurrentPackageInputSnapshot(release, variant) {
  const rows = [];
  const sourceInputs = [
    ...SOURCE_INPUTS,
    ...(variant?.version === 'v3' ? V3_SOURCE_INPUTS : []),
    ...(variant?.version === 'v3-1' ? V31_SOURCE_INPUTS : []),
    ...(variant?.version === 'v3-2' ? V32_SOURCE_INPUTS : []),
    ...(variant?.version === 'v3-3'
      ? variant?.artifactRevision === 'r3'
        ? V33_R3_SOURCE_INPUTS
        : variant?.artifactRevision === 'r2'
          ? V33_R2_SOURCE_INPUTS
          : V33_SOURCE_INPUTS
      : []),
  ];
  for (const relativePath of sourceInputs) {
    const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
    const metadata = await lstat(absolutePath);
    if (metadata.isSymbolicLink()) {
      throw new Error(`Source snapshot refuses symbolic link: ${relativePath}`);
    }
    if (metadata.isDirectory()) {
      for (const file of await walkFiles(absolutePath)) {
        rows.push({
          path: `${relativePath}/${file.relativePath}`,
          bytes: file.metadata.size,
          sha256: await sha256File(file.absolutePath),
        });
      }
    } else {
      rows.push({
        path: relativePath,
        bytes: metadata.size,
        sha256: await sha256File(absolutePath),
      });
    }
  }
  for (const member of release.members) {
    const assetRoot = path.join(
      WORKSPACE_ROOT,
      'public/flash-assets/courses',
      member.animationId,
    );
    for (const file of await walkFiles(assetRoot)) {
      if (!isAllowedCourseAsset(file.relativePath)) continue;
      rows.push({
        path: `public/flash-assets/courses/${member.animationId}/${file.relativePath}`,
        bytes: file.metadata.size,
        sha256: await sha256File(file.absolutePath),
      });
    }
  }
  if (variant?.bindFullCurrentSourceInventory === true
      || variant?.version === 'v3-1') {
    const fullCurrentSourceInventory =
      await buildFullCurrentSourceInventory();
    for (const row of fullCurrentSourceInventory.files) {
      rows.push({
        path: row.path,
        bytes: row.bytes,
        sha256: row.sha256,
      });
    }
  }
  const canonicalRows = [];
  const rowsByPath = new Map();
  for (const row of rows) {
    const existing = rowsByPath.get(row.path);
    if (existing && stableJson(existing) !== stableJson(row)) {
      throw new Error(
        `Source snapshot has conflicting bindings for ${row.path}.`,
      );
    }
    if (!existing) {
      rowsByPath.set(row.path, row);
      canonicalRows.push(row);
    }
  }
  canonicalRows.sort((left, right) => left.path.localeCompare(right.path));
  const serialized = canonicalRows.map((row) =>
    `${row.sha256} ${row.bytes} ${row.path}`
  ).join('\n');
  return {
    fileCount: canonicalRows.length,
    totalBytes: canonicalRows.reduce((sum, row) => sum + row.bytes, 0),
    sha256: sha256(Buffer.from(serialized)),
  };
}

async function copyAllowedCourseAssets(release, runtimeRoot) {
  const destinationRoot = path.join(
    runtimeRoot,
    'public/flash-assets/courses',
  );
  let fileCount = 0;
  let totalBytes = 0;
  let audioFileCount = 0;
  await mkdir(destinationRoot, {recursive: true});
  for (const member of release.members) {
    const sourceRoot = path.join(
      WORKSPACE_ROOT,
      'public/flash-assets/courses',
      member.animationId,
    );
    const destinationMemberRoot = path.join(
      destinationRoot,
      member.animationId,
    );
    for (const file of await walkFiles(sourceRoot)) {
      if (!isAllowedCourseAsset(file.relativePath)) continue;
      const destination = path.join(destinationMemberRoot, file.relativePath);
      await mkdir(path.dirname(destination), {recursive: true});
      await cp(file.absolutePath, destination, {
        dereference: true,
        preserveTimestamps: false,
      });
      fileCount += 1;
      totalBytes += file.metadata.size;
      if (path.extname(file.relativePath).toLowerCase() === '.mp3') {
        audioFileCount += 1;
      }
    }
  }
  if (audioFileCount !== 72) {
    throw new Error(
      `Expected 72 canonical web audio files, found ${audioFileCount}.`,
    );
  }
  return {fileCount, totalBytes, audioFileCount};
}

async function findServerEntry(runtimeRoot) {
  const candidates = (await walkFiles(runtimeRoot))
    .filter((file) => file.relativePath.endsWith('/server.js') || file.relativePath === 'server.js')
    .map((file) => file.relativePath);
  const preferred = candidates.filter((candidate) =>
    candidate === 'apps/web/server.js'
  );
  if (preferred.length === 1) return preferred[0];
  if (candidates.length === 1) return candidates[0];
  throw new Error(
    `Expected one standalone server entry; found ${candidates.join(', ') || 'none'}.`,
  );
}

export async function sanitizeNextStandaloneLocalPaths(
  runtimeRoot,
  serverEntry,
  distDir = '.next-g4-l3-package',
) {
  const serverPath = path.join(runtimeRoot, serverEntry);
  const serverDirectory = path.dirname(serverPath);
  const requiredServerFilesPath = path.join(
    serverDirectory,
    distDir,
    'required-server-files.json',
  );
  const originalServerSource = await readFile(serverPath, 'utf8');
  const configPrefix = 'const nextConfig = ';
  const configStart = originalServerSource.indexOf(configPrefix);
  const secondConfigStart = originalServerSource.indexOf(
    configPrefix,
    configStart + configPrefix.length,
  );
  const configEnd = originalServerSource.indexOf('\n', configStart);
  if (
    configStart === -1
    || secondConfigStart !== -1
    || configEnd === -1
  ) {
    throw new Error('Next standalone server config shape has changed.');
  }
  const serverConfig = JSON.parse(
    originalServerSource.slice(
      configStart + configPrefix.length,
      configEnd,
    ),
  );
  const serverReplacementCount =
    JSON.stringify(serverConfig).split(WORKSPACE_ROOT).length - 1;
  if (
    serverReplacementCount !== 2
    || serverConfig.outputFileTracingRoot !== WORKSPACE_ROOT
    || serverConfig.turbopack?.root !== WORKSPACE_ROOT
  ) {
    throw new Error(
      'Next standalone server did not contain the expected generated local paths.',
    );
  }
  serverConfig.outputFileTracingRoot = '../..';
  serverConfig.turbopack.root = '../..';
  const sanitizedServerSource = [
    originalServerSource.slice(0, configStart),
    configPrefix,
    JSON.stringify(serverConfig),
    originalServerSource.slice(configEnd),
  ].join('');
  const originalRequiredServerFilesSource = await readFile(
    requiredServerFilesPath,
    'utf8',
  );
  const requiredServerFilesReplacementCount =
    originalRequiredServerFilesSource.split(WORKSPACE_ROOT).length - 1;
  const sanitizedRequiredServerFiles = JSON.parse(
    originalRequiredServerFilesSource,
  );
  if (
    requiredServerFilesReplacementCount !== 3
    || sanitizedRequiredServerFiles.config?.outputFileTracingRoot
      !== WORKSPACE_ROOT
    || sanitizedRequiredServerFiles.config?.turbopack?.root
      !== WORKSPACE_ROOT
    || sanitizedRequiredServerFiles.appDir !== WEB_ROOT
  ) {
    throw new Error(
      'Next required-server-files local-path contract has changed.',
    );
  }
  sanitizedRequiredServerFiles.config.outputFileTracingRoot = '../..';
  sanitizedRequiredServerFiles.config.turbopack.root = '../..';
  sanitizedRequiredServerFiles.appDir = '.';
  await writeFile(serverPath, sanitizedServerSource, 'utf8');
  await writeFile(
    requiredServerFilesPath,
    stableJson(sanitizedRequiredServerFiles),
    'utf8',
  );
  const removedOptionalImageOptimizationDependencies = [];
  for (const relativePath of [
    'node_modules/@img',
    'node_modules/sharp',
  ]) {
    const absolutePath = path.join(runtimeRoot, relativePath);
    try {
      await lstat(absolutePath);
      await rm(absolutePath, {recursive: true, force: true});
      removedOptionalImageOptimizationDependencies.push(relativePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  const sanitizedVendorCommentFiles = [];
  const errorInspectRelativePath =
    'node_modules/next/dist/server/patch-error-inspect.js';
  const errorInspectPath = path.join(runtimeRoot, errorInspectRelativePath);
  try {
    const source = await readFile(errorInspectPath, 'utf8');
    if (source.includes('/Users/')) {
      const example = '/Users/foo/APP/';
      if (source.split(example).length - 1 !== 1) {
        throw new Error(
          'Next error-inspection local-path example has changed.',
        );
      }
      await writeFile(
        errorInspectPath,
        source.replace(example, '/example-user/APP/'),
        'utf8',
      );
      sanitizedVendorCommentFiles.push(errorInspectRelativePath);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const [relativePath, contents] of [
    [serverEntry, sanitizedServerSource],
    [
      path.relative(runtimeRoot, requiredServerFilesPath)
        .split(path.sep).join('/'),
      stableJson(sanitizedRequiredServerFiles),
    ],
  ]) {
    if (ABSOLUTE_LOCAL_PATH_MARKERS.some((marker) => contents.includes(marker))) {
      throw new Error(
        `Next standalone local-path sanitization failed: ${relativePath}`,
      );
    }
  }
  return {
    status: 'sanitized-next-generated-local-paths',
    files: [
      serverEntry,
      path.relative(runtimeRoot, requiredServerFilesPath)
        .split(path.sep).join('/'),
    ].sort(),
    serverReplacementCount,
    requiredServerFilesReplacementCount,
    requiredServerFilesRewritten: true,
    runtimeRootSemantics:
      'standalone-monorepo-root-relative-to-server-directory',
    removedOptionalImageOptimizationDependencies,
    imageOptimizationUseInLessonPackage: 'none',
    sanitizedVendorCommentFiles,
  };
}

async function copyCatalog(runtimeRoot) {
  const descriptors = [];
  for (const relativePath of CATALOG_FILES) {
    const source = path.join(WORKSPACE_ROOT, relativePath);
    const destination = path.join(runtimeRoot, relativePath);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(source, destination, {preserveTimestamps: false});
    const metadata = await stat(source);
    descriptors.push({
      path: relativePath,
      bytes: metadata.size,
      sha256: await sha256File(source),
    });
  }
  return descriptors;
}

function assertSafeWorkspaceRelativePath(relativePath, label) {
  if (
    typeof relativePath !== 'string'
    || relativePath.length === 0
    || path.isAbsolute(relativePath)
    || relativePath.includes('\\')
    || relativePath.split('/').some((part) =>
      part === '' || part === '.' || part === '..'
    )
  ) {
    throw new Error(`${label} must be a safe workspace-relative path.`);
  }
  return relativePath;
}

function assertFileBinding(binding, expectedPath, label) {
  if (
    binding?.path !== expectedPath
    || !Number.isSafeInteger(binding?.bytes)
    || binding.bytes <= 0
    || !/^[a-f0-9]{64}$/.test(binding?.sha256 ?? '')
  ) {
    throw new Error(`${label} binding is malformed or uses the wrong path.`);
  }
  return binding;
}

async function workspaceFileBinding(relativePath) {
  assertSafeWorkspaceRelativePath(relativePath, 'Evidence');
  const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
  const metadata = await stat(absolutePath);
  if (!metadata.isFile()) {
    throw new Error(`Required evidence file is unavailable: ${relativePath}`);
  }
  return {
    path: relativePath,
    bytes: metadata.size,
    sha256: await sha256File(absolutePath),
  };
}

async function buildSuccessorRevisionManifest(variant) {
  if (!variant.successorRevision) return null;
  if (
    variant.successorRevision.declaredSixFileProductAndVerificationBatch
  ) {
    const declaredBindings = [];
    for (const expected of
      variant.successorRevision.declaredSixFileProductAndVerificationBatch) {
      const actual = await workspaceFileBinding(expected.path);
      if (actual.sha256 !== expected.sha256) {
        throw new Error(
          `The v3.3 declared product/verification source drifted: ${expected.path}`,
        );
      }
      declaredBindings.push({
        ...actual,
        role: expected.role,
        predecessor: structuredClone(expected.predecessor),
      });
    }
    return {
      predecessorPackageId:
        variant.successorRevision.predecessorPackageId,
      predecessor: {
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
        receiptFingerprintSha256:
          variant.successorRevision
            .predecessorReceiptFingerprintSha256,
        sourceSnapshot: structuredClone(
          variant.successorRevision.predecessorSourceSnapshot,
        ),
        unchanged: true,
      },
      declaredSixFileProductAndVerificationBatch: {
        files: declaredBindings,
        fileCount: declaredBindings.length,
        roleCounts: {
          authoredRuntime: declaredBindings.filter(
            ({role}) => role === 'authored-runtime',
          ).length,
          unitTest: declaredBindings.filter(
            ({role}) => role === 'unit-test',
          ).length,
          browserTest: declaredBindings.filter(
            ({role}) => role === 'browser-test',
          ).length,
          browserConfig: declaredBindings.filter(
            ({role}) => role === 'browser-config',
          ).length,
        },
        predecessorPerFileAvailableCount: declaredBindings.filter(
          ({predecessor}) => predecessor.status === 'available',
        ).length,
        predecessorPerFileUnavailableCount: declaredBindings.filter(
          ({predecessor}) => predecessor.status === 'unavailable',
        ).length,
        allSixChangedEstablished:
          variant.successorRevision.allSixChangedEstablished,
        exhaustiveByteDeltaFromV32R2Established:
          variant.successorRevision
            .exhaustiveByteDeltaFromV32R2Established,
        declaredBatchIsOnlyRepoDelta:
          variant.successorRevision.declaredBatchIsOnlyRepoDelta,
      },
      finalSourceBoundary:
        'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench',
      authoredProductSourceChangedFromV32R2:
        variant.successorRevision
          .authoredProductSourceChangedFromV32R2,
      fullCurrentV33SourceSnapshotBound:
        variant.successorRevision.fullCurrentV33SourceSnapshotBound,
      exhaustiveByteDeltaFromV32R2Established:
        variant.successorRevision
          .exhaustiveByteDeltaFromV32R2Established,
      declaredBatchIsOnlyRepoDelta:
        variant.successorRevision.declaredBatchIsOnlyRepoDelta,
      strictAcceptanceEffect:
        variant.successorRevision.strictAcceptanceEffect,
    };
  }
  const compactLandscapeSourceBindings = [];
  for (const expected of
    variant.successorRevision.compactLandscapeSourceContracts) {
    const actual = await workspaceFileBinding(expected.path);
    if (actual.sha256 !== expected.sha256) {
      throw new Error(
        `The v3.2 compact-landscape source contract drifted: ${expected.path}`,
      );
    }
    compactLandscapeSourceBindings.push(actual);
  }
  return {
    predecessorPackageId:
      variant.successorRevision.predecessorPackageId,
    predecessor: {
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
        variant.successorRevision.predecessorReceiptFingerprintSha256,
      unchanged: true,
    },
    knownCompactLandscapeBatch: {
      files: compactLandscapeSourceBindings,
      fileCount: compactLandscapeSourceBindings.length,
      currentProductCopy: {
        english: 'Flash transport parity: not established',
        spanish: 'Paridad del transporte de Flash: no establecida',
      },
      responsiveContract: {
        viewport: {width: 844, height: 390},
        toolbarColumns: 4,
        minimumInteractiveTargetPixels: 44,
        fullTransportBoundaryRemainsAssistiveTechnologyReadable: true,
        learningActionsSingleRow: true,
        horizontalOverflowTolerancePixels: 1,
      },
    },
    primarySmokeSelectorClosure: {
      currentJavascriptFunctionalSelectors: [
        '[data-current-js-functional-candidate="true"]',
        '[data-current-js-functional-entry]',
        '[data-current-js-functional-scope]',
        '[data-current-js-modern-reconstruction="true"]',
      ],
      keyTermsHostSelectionResolution: 'matched-local-entry',
      externalPostbuildSmokeRunnerRequired: false,
    },
    preimplementationSourceAudit: structuredClone(
      variant.successorRevision.preimplementationSourceAudit,
    ),
    finalSourceBoundary:
      'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench',
    exhaustiveByteDeltaFromV31Established:
      variant.successorRevision.exhaustiveByteDeltaFromV31Established,
    strictAcceptanceEffect:
      variant.successorRevision.strictAcceptanceEffect,
  };
}

async function buildSmokeHarnessRevisionManifest(variant) {
  if (!variant.smokeHarnessRevision) return null;
  await assertPathAbsent(
    path.join(
      WORKSPACE_ROOT,
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-smoke.json',
    ),
    'Frozen v3.2 formal smoke report',
  );
  await assertPathAbsent(
    path.join(
      WORKSPACE_ROOT,
      'reports/g4-l3-whole-lesson-package-mvp-v3-2-delivery.json',
    ),
    'Frozen v3.2 delivery receipt',
  );
  await assertPathAbsent(
    path.join(
      WORKSPACE_ROOT,
      'outputs/g4-l3-whole-lesson-package-mvp-v3-2-delivery-report.md',
    ),
    'Frozen v3.2 delivery report',
  );
  return {
    predecessorAttemptPackageId:
      variant.smokeHarnessRevision.predecessorAttemptPackageId,
    predecessorAttemptStatus:
      variant.smokeHarnessRevision.predecessorAttemptStatus,
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
        variant.smokeHarnessRevision
          .predecessorAttemptPrimaryBuilderSha256,
      packageVerifierPassed:
        variant.smokeHarnessRevision.predecessorPackageVerifierPassed,
      formalSmokeReportPublished:
        variant.smokeHarnessRevision
          .predecessorFormalSmokeReportPublished,
      deliveryReceiptPublished:
        variant.smokeHarnessRevision
          .predecessorDeliveryReceiptPublished,
      predecessorOverwritten:
        variant.smokeHarnessRevision.predecessorOverwritten,
      productFailureEstablished:
        variant.smokeHarnessRevision.productFailureEstablished,
      unchanged: true,
    },
    changeClass: variant.smokeHarnessRevision.changeClass,
    authoredProductSourceChangedFromV32:
      variant.smokeHarnessRevision.authoredProductSourceChangedFromV32,
    correctedBeforePackaging:
      variant.smokeHarnessRevision.correctedBeforePackaging,
    externalPostbuildCorrectionUsed:
      variant.smokeHarnessRevision.externalPostbuildCorrectionUsed,
    compactRootSelector:
      variant.smokeHarnessRevision.compactRootSelector,
    compactPageSelectionMechanism:
      variant.smokeHarnessRevision.compactPageSelectionMechanism,
    browserProfileIsolation:
      variant.smokeHarnessRevision.browserProfileIsolation,
    resumeDecisionBeforeGeometry:
      variant.smokeHarnessRevision.resumeDecisionBeforeGeometry,
    sessionDecisionOverlayBeforeGeometry:
      variant.smokeHarnessRevision.sessionDecisionOverlayBeforeGeometry,
    corrections: structuredClone(
      variant.smokeHarnessRevision.corrections,
    ),
    strictAcceptanceEffect:
      variant.smokeHarnessRevision.strictAcceptanceEffect,
  };
}

async function buildQaHarnessRevisionManifest(variant) {
  if (!variant.qaHarnessRevision) return null;
  for (const [relativePath, label] of [
    [
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64',
      'Frozen v3.3 package directory',
    ],
    [
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64.zip',
      'Frozen v3.3 package ZIP',
    ],
    [
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-darwin-arm64.zip.sha256',
      'Frozen v3.3 package ZIP checksum',
    ],
    [
      'reports/g4-l3-controlled-ceo-preview-v3-3-qa.json',
      'Frozen v3.3 formal QA JSON',
    ],
    [
      'reports/g4-l3-controlled-ceo-preview-v3-3-qa.md',
      'Frozen v3.3 formal QA Markdown',
    ],
    [
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-smoke.json',
      'Frozen v3.3 formal smoke report',
    ],
    [
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-delivery.json',
      'Frozen v3.3 delivery receipt',
    ],
    [
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-delivery-report.md',
      'Frozen v3.3 delivery report',
    ],
  ]) {
    await assertPathAbsent(path.join(WORKSPACE_ROOT, relativePath), label);
  }
  const receiptBinding = await workspaceFileBinding(
    variant.qaHarnessRevision.predecessorAttemptFailureReceipt.path,
  );
  if (
    stableJson(receiptBinding)
      !== stableJson(
        variant.qaHarnessRevision.predecessorAttemptFailureReceipt,
      )
  ) {
    throw new Error('The frozen v3.3 failed-QA receipt has drifted.');
  }
  const receipt = JSON.parse(
    await readFile(
      path.join(WORKSPACE_ROOT, receiptBinding.path),
      'utf8',
    ),
  );
  const expectedRoot =
    variant.qaHarnessRevision.predecessorAttemptPartialScreenshotRoot;
  const expectedScreenshots = Object.values(
    V33_FAILED_QA_ATTEMPT_PREIMAGES,
  ).filter(({path: relativePath}) => relativePath.endsWith('.png'));
  if (
    receipt.reportType
      !== 'g4-l3-controlled-ceo-preview-v3-3-failed-attempt'
    || receipt.status !== 'failed-before-final-report-publication'
    || receipt.finalArtifactState?.screenshotRoot !== expectedRoot.path
    || receipt.finalArtifactState?.screenshotRootPreserved !== true
    || receipt.finalArtifactState?.screenshotFileCount !== expectedRoot.fileCount
    || receipt.finalArtifactState?.screenshotTotalBytes !== expectedRoot.totalBytes
    || receipt.finalArtifactState?.screenshotTreeSha256
      !== expectedRoot.treeSha256
    || JSON.stringify(
      receipt.finalArtifactState?.screenshots?.map(({path: relativePath, sha256}) => ({
        path: relativePath,
        sha256,
      })),
    ) !== JSON.stringify(expectedScreenshots)
    || receipt.successorBoundary?.v33PackagePublished !== false
    || receipt.successorBoundary?.v33ZipPublished !== false
    || receipt.successorBoundary?.v33SmokePublished !== false
    || receipt.successorBoundary?.v33DeliveryReceiptPublished !== false
    || receipt.successorBoundary?.v33ArtifactsOverwritten !== false
    || receipt.successorBoundary?.productFailureEstablished !== false
    || receipt.successorBoundary?.nextRevision !== 'v3.3-r2'
    || receipt.successorBoundary?.strictAcceptanceEffect !== 'none'
  ) {
    throw new Error('The frozen v3.3 failed-QA receipt closure is invalid.');
  }
  return structuredClone(variant.qaHarnessRevision);
}

export async function buildPackageSmokeHarnessRevisionManifest(variant) {
  const revision = variant.packageSmokeHarnessRevision;
  if (!revision) return null;
  for (const [relativePath, label] of [
    [
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke.json',
      'Frozen v3.3-r2 formal smoke report',
    ],
    [
      'output/playwright/g4-l3-whole-lesson-package-mvp-v3-3-r2',
      'Frozen v3.3-r2 formal smoke screenshot root',
    ],
    [
      'reports/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery.json',
      'Frozen v3.3-r2 delivery receipt',
    ],
    [
      'outputs/g4-l3-whole-lesson-package-mvp-v3-3-r2-delivery-report.md',
      'Frozen v3.3-r2 delivery report',
    ],
  ]) {
    await assertPathAbsent(path.join(WORKSPACE_ROOT, relativePath), label);
  }
  const receiptBinding = await workspaceFileBinding(
    revision.predecessorAttemptFailureReceipt.path,
  );
  if (
    stableJson(receiptBinding)
      !== stableJson(revision.predecessorAttemptFailureReceipt)
  ) {
    throw new Error('The frozen v3.3-r2 failed-smoke receipt has drifted.');
  }
  const receipt = JSON.parse(
    await readFile(
      path.join(WORKSPACE_ROOT, receiptBinding.path),
      'utf8',
    ),
  );
  const expectedPackage = revision.predecessorAttemptPackage;
  const selectedClosure = {
    archive: {
      path: receipt.sealedPackage?.archive?.path,
      sha256: receipt.sealedPackage?.archive?.sha256,
    },
    manifest: {
      path: receipt.sealedPackage?.manifest?.path,
      sha256: receipt.sealedPackage?.manifest?.sha256,
    },
    payloadChecksums: {
      path: receipt.sealedPackage?.payloadChecksums?.path,
      sha256: receipt.sealedPackage?.payloadChecksums?.sha256,
    },
    archiveChecksum: {
      path: receipt.sealedPackage?.archiveChecksumFile?.path,
      sha256: receipt.sealedPackage?.archiveChecksumFile?.sha256,
    },
  };
  const expectedRows = [
    {
      animationId: 'course-g04-l03-vb-005',
      selectionResolved: true,
      runtimeCount: 1,
      legacySourceHotspotFocusPredicate: false,
      sourceStopHeldAfterClose: false,
      explicitResumeClearedHold: false,
      rowPassed: false,
    },
    {
      animationId: 'course-g04-l03-vb-006',
      selectionResolved: true,
      runtimeCount: 1,
      legacySourceHotspotFocusPredicate: false,
      sourceStopHeldAfterClose: false,
      explicitResumeClearedHold: false,
      rowPassed: false,
    },
    {
      animationId: 'course-g04-l03-rw-003',
      selectionResolved: true,
      runtimeCount: 1,
      legacySourceHotspotFocusPredicate: false,
      sourceStopHeldAfterClose: true,
      explicitResumeClearedHold: true,
      rowPassed: false,
    },
  ];
  const selectedRows = receipt.isolatedDiagnosticReplay
    ?.failingPredicateVector?.map((row) => ({
      animationId: row?.animationId,
      selectionResolved: row?.selectionResolved,
      runtimeCount: row?.runtimeCount,
      legacySourceHotspotFocusPredicate:
        row?.legacySourceHotspotFocusPredicate,
      sourceStopHeldAfterClose: row?.sourceStopHeldAfterClose,
      explicitResumeClearedHold: row?.explicitResumeClearedHold,
      rowPassed: row?.rowPassed,
    }));
  const selectedFocusForensics =
    receipt.independentFreshUnzipFocusForensics?.observations?.map(
      (row) => ({
        animationId: row?.animationId,
        activeTag: row?.activeTag,
        responsiveFocusKey: row?.responsiveFocusKey,
        sourceKey: row?.sourceKey,
        connected: row?.connected,
        visible: row?.visible,
      }),
    );
  const expectedFocusForensics = [
    'course-g04-l03-vb-005',
    'course-g04-l03-vb-006',
    'course-g04-l03-rw-003',
  ].map((animationId) => ({
    animationId,
    activeTag: 'BUTTON',
    responsiveFocusKey: 'key-terms',
    sourceKey: null,
    connected: true,
    visible: true,
  }));
  if (
    receipt.reportType
      !== 'g4-l3-whole-lesson-package-mvp-v3-3-r2-smoke-failed-attempt'
    || receipt.status !== 'failed-before-formal-smoke-publication'
    || receipt.artifactIdentity?.variant !== 'v3-3-r2'
    || receipt.artifactIdentity?.packageId
      !== revision.predecessorAttemptPackageId
    || stableJson(selectedClosure) !== stableJson(expectedPackage)
    || receipt.sealedPackage?.packageVerifierPassed !== true
    || receipt.sealedPackage?.installedAndArchivePackageCheckPassed !== true
    || receipt.sealedPackage?.overwritten !== false
    || receipt.formalAttempt?.officialSmokeJsonPublished !== false
    || receipt.formalAttempt?.officialSmokeScreenshotRootPublished !== false
    || receipt.formalAttempt?.deliveryReceiptPublished !== false
    || receipt.formalAttempt?.deliveryReportPublished !== false
    || stableJson(selectedRows) !== stableJson(expectedRows)
    || stableJson(selectedFocusForensics)
      !== stableJson(expectedFocusForensics)
    || receipt.independentFreshUnzipFocusForensics
      ?.exactResponsiveFocusContractObservedForAllThree !== true
    || receipt.rootCause?.classification
      !== 'stale-smoke-harness-focus-target-assertion'
    || receipt.rootCause?.productFailureEstablished !== false
    || receipt.rootCause?.authoredProductChangeRequired !== false
    || receipt.successorBoundary?.r2PackagePublished !== true
    || receipt.successorBoundary?.r2PackageVerifierPassed !== true
    || receipt.successorBoundary?.r2FormalSmokePublished !== false
    || receipt.successorBoundary?.r2DeliveryReceiptPublished !== false
    || receipt.successorBoundary?.r2ArtifactsOverwritten !== false
    || receipt.successorBoundary?.productFailureEstablished !== false
    || receipt.successorBoundary?.authoredProductSourceChangeAuthorized
      !== false
    || receipt.successorBoundary?.nextRevision !== 'v3.3-r3'
    || receipt.successorBoundary?.strictAcceptanceEffect !== 'none'
    || receipt.authority?.currentJavascriptCandidateOnly !== true
    || receipt.authority?.originalRuntimeEvidence !== false
    || receipt.authority?.flashFidelityEstablished !== false
    || receipt.authority?.ownerAcceptance !== false
    || receipt.authority?.strictCompleteMembers !== 0
    || receipt.authority?.published !== false
  ) {
    throw new Error('The frozen v3.3-r2 failed-smoke closure is invalid.');
  }
  return structuredClone(revision);
}

async function recursivePngBindings(relativeRoot) {
  assertSafeWorkspaceRelativePath(relativeRoot, 'Screenshot root');
  const absoluteRoot = path.join(WORKSPACE_ROOT, relativeRoot);
  const bindings = [];
  for (const file of await walkFiles(absoluteRoot)) {
    if (path.extname(file.relativePath).toLowerCase() !== '.png') continue;
    bindings.push({
      path: `${relativeRoot}/${file.relativePath}`,
      bytes: file.metadata.size,
      sha256: await sha256File(file.absolutePath),
    });
  }
  bindings.sort((left, right) => left.path.localeCompare(right.path));
  if (bindings.length === 0) {
    throw new Error(`No PNG evidence exists under ${relativeRoot}.`);
  }
  return bindings;
}

export function assertReportScreenshotBindings(
  report,
  actualBindings,
  screenshotRoot,
  label,
) {
  if (!Array.isArray(report?.screenshots) || report.screenshots.length === 0) {
    throw new Error(`${label} has no internal screenshot bindings.`);
  }
  const expected = report.screenshots.map((binding) => {
    assertSafeWorkspaceRelativePath(binding?.path, `${label} screenshot`);
    if (!binding.path.startsWith(`${screenshotRoot}/`)) {
      throw new Error(`${label} screenshot is outside its evidence root.`);
    }
    assertFileBinding(binding, binding.path, `${label} screenshot`);
    return {
      path: binding.path,
      bytes: binding.bytes,
      sha256: binding.sha256,
    };
  }).sort((left, right) => left.path.localeCompare(right.path));
  if (
    new Set(expected.map((binding) => binding.path)).size !== expected.length
    || stableJson(expected) !== stableJson(actualBindings)
  ) {
    throw new Error(
      `${label} screenshot bindings do not match every PNG in ${screenshotRoot}.`,
    );
  }
  return expected;
}

export function validateV3ReadabilityEnhancements(
  enhancements,
  sourceBytes,
) {
  const crops = enhancements?.crops;
  const canonicalCrops = Array.isArray(crops)
    ? crops.map((crop) => ({
        id: crop?.id,
        sourceRect: crop?.sourceRect,
        paddedCropRect: crop?.paddedCropRect,
        asset: crop?.asset,
        sourceCharacterIds: crop?.sourceCharacterIds,
        transcriptSha256: crop?.transcriptSha256,
      }))
    : null;
  if (
    enhancements?.pageOrdinal !== 36
    || enhancements?.animationId !== TS008_ANIMATION_ID
    || enhancements?.source?.path !== TS008_SOURCE_PATH
    || sourceBytes !== TS008_SOURCE_BYTES
    || enhancements?.source?.bytes !== sourceBytes
    || enhancements?.source?.sha256 !== TS008_SOURCE_SHA256
    || enhancements?.frameDomain !== 'sprite-350'
    || enhancements?.frame !== 789
    || enhancements?.nativePaddingPixels !== 4
    || enhancements?.desktopScale !== 2.5
    || !Array.isArray(crops)
    || crops.length !== 2
    || stableJson(canonicalCrops)
      !== stableJson(V3_READABILITY_CROP_CONTRACTS)
    || enhancements?.defaultExpanded !== true
    || enhancements?.originalLayoutPreserved !== true
    || enhancements?.strictAcceptanceEffect !== 'none'
  ) {
    throw new Error(
      'The Page 36 readability enhancement contract is incomplete or invalid.',
    );
  }
  return structuredClone(enhancements);
}

export function validateV3ReadabilityReport(
  report,
  expectedReportType = 'g4-l3-current-js-readability-v3',
  expectedBaseUrl = 'http://127.0.0.1:3216',
) {
  const summary = report?.summary;
  const page36 = Array.isArray(report?.pages)
    ? report.pages.find((page) => page?.globalPageOrdinal === 36)
    : null;
  const page36Observations = page36?.observations;
  const interactionProfilesPass = Array.isArray(page36Observations)
    && page36Observations.length === 4
    && page36Observations.every((observation) => {
      const interactions = observation?.wholeLesson?.readableView?.interactions;
      return observation?.wholeLesson?.readableView?.passed === true
        && interactions?.passed === true
        && interactions?.focusRestoredAfterEscape === true
        && stableJson(interactions?.inputMethods)
          === stableJson(['click', 'Enter', 'Space', 'Escape']);
    });
  if (
    report?.schemaVersion !== 1
    || report?.reportType !== expectedReportType
    || report?.environment?.baseUrl !== expectedBaseUrl
    || summary?.status !== 'pass-current-js-p0-p1-readability-screening'
    || summary?.pagesInspected !== 39
    || summary?.profileCount !== 4
    || summary?.observations !== 156
    || summary?.screenshotCount !== 164
    || summary?.contactSheetCount !== 4
    || summary?.p0Count !== 0
    || summary?.p1Count !== 0
    || summary?.unresolvedP0P1Count !== 0
    || summary?.page36ReadableViewProfilePasses !== 4
    || summary?.strictCompleteMembers !== 0
    || summary?.releaseMembers !== 40
    || summary?.published !== false
    || summary?.strictAcceptanceEffect !== 'none'
    || !Array.isArray(summary?.issues)
    || summary.issues.length !== 0
    || !Array.isArray(report?.pages)
    || report.pages.length !== 39
    || !Array.isArray(report?.contactSheets)
    || report.contactSheets.length !== 4
    || !interactionProfilesPass
    || report?.acceptance?.acceptanceNeutral !== true
    || report?.acceptance?.strictAcceptanceEffect !== 'none'
    || report?.acceptance?.strictCompleteMembers !== 0
    || report?.acceptance?.releaseMembers !== 40
    || report?.acceptance?.published !== false
  ) {
    throw new Error(
      'The current-JavaScript readability v3 report is absent, stale, or failing.',
    );
  }
  return true;
}

function validateControlledCeoPreviewQa(
  report,
  expectedReportType = 'g4-l3-controlled-ceo-preview-qa',
  expectedBaseUrl = 'http://127.0.0.1:3216',
) {
  const summary = report?.summary;
  if (
    report?.schemaVersion !== 1
    || report?.reportType !== expectedReportType
    || report?.environment?.baseUrl !== expectedBaseUrl
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
      'The Controlled CEO Preview QA report is absent, stale, or failing.',
    );
  }
}

export async function assertReportSourceBindingsCurrent(report, label) {
  const entries = Object.entries(report?.sourceBindings ?? {});
  if (entries.length === 0) {
    throw new Error(`${label} has no source bindings.`);
  }
  for (const [bindingId, expected] of entries) {
    assertSafeWorkspaceRelativePath(
      expected?.path,
      `${label} source binding ${bindingId}`,
    );
    assertFileBinding(
      expected,
      expected.path,
      `${label} source binding ${bindingId}`,
    );
    const actual = await workspaceFileBinding(expected.path);
    if (stableJson(actual) !== stableJson(expected)) {
      throw new Error(
        `${label} source binding has drifted: ${expected.path}`,
      );
    }
  }
}

async function copyEvidenceFile(packageRoot, binding, packageRelativePath, status) {
  const destination = path.join(packageRoot, packageRelativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await cp(
    path.join(WORKSPACE_ROOT, binding.path),
    destination,
    {preserveTimestamps: false},
  );
  return {
    sourcePath: binding.path,
    path: packageRelativePath,
    bytes: binding.bytes,
    sha256: binding.sha256,
    status,
  };
}

async function copyV3Evidence(packageRoot, variant) {
  const readabilityEvidence = variant.readabilityEvidence;
  const controlledQaEvidence = variant.controlledQaEvidence;
  if (!readabilityEvidence || !controlledQaEvidence) {
    throw new Error(
      `${variant.packageId} is missing its versioned readability or QA evidence descriptor.`,
    );
  }
  const [
    readabilityJsonBinding,
    readabilityMarkdownBinding,
    controlledQaJsonBinding,
    controlledQaMarkdownBinding,
  ] = await Promise.all([
    workspaceFileBinding(readabilityEvidence.json),
    workspaceFileBinding(readabilityEvidence.markdown),
    workspaceFileBinding(controlledQaEvidence.json),
    workspaceFileBinding(controlledQaEvidence.markdown),
  ]);
  const readabilityReport = JSON.parse(
    await readFile(
      path.join(WORKSPACE_ROOT, readabilityEvidence.json),
      'utf8',
    ),
  );
  const controlledQaReport = JSON.parse(
    await readFile(
      path.join(WORKSPACE_ROOT, controlledQaEvidence.json),
      'utf8',
    ),
  );
  if (['v3-1', 'v3-2', 'v3-3'].includes(variant.version)) {
    const expectedArtifactVersion =
      variant.qaArtifactVersion ?? variant.version;
    const readabilityFailures = validateReadabilityReportStructure(
      readabilityReport,
      {expectedArtifactVersion},
    );
    const controlledQaFailures = validateProductQaReportStructure(
      controlledQaReport,
      {expectedArtifactVersion},
    );
    if (readabilityFailures.length !== 0) {
      throw new Error(
        `The ${variant.version} readability report structure is invalid: ${readabilityFailures.join('; ')}`,
      );
    }
    if (controlledQaFailures.length !== 0) {
      throw new Error(
        `The ${variant.version} Controlled CEO Preview QA structure is invalid: ${controlledQaFailures.join('; ')}`,
      );
    }
    const [readabilityMarkdown, controlledQaMarkdown] = await Promise.all([
      readFile(
        path.join(WORKSPACE_ROOT, readabilityEvidence.markdown),
        'utf8',
      ),
      readFile(
        path.join(WORKSPACE_ROOT, controlledQaEvidence.markdown),
        'utf8',
      ),
    ]);
    if (readabilityMarkdown !== renderReadabilityMarkdown(readabilityReport)) {
      throw new Error(
        `The ${variant.version} readability Markdown does not match its JSON report.`,
      );
    }
    if (controlledQaMarkdown !== renderProductQaMarkdown(controlledQaReport)) {
      throw new Error(
        `The ${variant.version} Controlled CEO Preview Markdown does not match its JSON report.`,
      );
    }
  }
  validateV3ReadabilityReport(
    readabilityReport,
    readabilityEvidence.reportType,
    readabilityEvidence.baseUrl,
  );
  const sourceMetadata = await stat(path.join(WORKSPACE_ROOT, TS008_SOURCE_PATH));
  if (
    !sourceMetadata.isFile()
    || await sha256File(path.join(WORKSPACE_ROOT, TS008_SOURCE_PATH))
      !== TS008_SOURCE_SHA256
  ) {
    throw new Error('The Page 36 TS08 source identity has drifted.');
  }
  const readabilityEnhancements = validateV3ReadabilityEnhancements(
    readabilityReport.readabilityEnhancements,
    sourceMetadata.size,
  );
  await assertReportSourceBindingsCurrent(
    readabilityReport,
    'Readability report',
  );
  const rendererBinding =
    readabilityReport.sourceBindings?.ts08GeneratedRenderer;
  if (
    rendererBinding?.path
      !== V3_FROZEN_PREIMAGES.ts008GeneratedRenderer.path
    || rendererBinding?.sha256
      !== V3_FROZEN_PREIMAGES.ts008GeneratedRenderer.sha256
  ) {
    throw new Error('The frozen TS08 generated renderer binding has drifted.');
  }
  for (const crop of readabilityEnhancements.crops) {
    const actualAssetBinding = await workspaceFileBinding(crop.asset.path);
    if (stableJson(actualAssetBinding) !== stableJson(crop.asset)) {
      throw new Error(
        `Readability crop asset binding has drifted: ${crop.asset.path}`,
      );
    }
  }
  validateControlledCeoPreviewQa(
    controlledQaReport,
    controlledQaEvidence.reportType,
    controlledQaEvidence.baseUrl,
  );
  await assertReportSourceBindingsCurrent(
    controlledQaReport,
    'Controlled CEO Preview QA report',
  );
  const [
    readabilityScreenshots,
    controlledQaScreenshots,
  ] = await Promise.all([
    recursivePngBindings(readabilityEvidence.screenshotRoot),
    recursivePngBindings(controlledQaEvidence.screenshotRoot),
  ]);
  assertReportScreenshotBindings(
    readabilityReport,
    readabilityScreenshots,
    readabilityEvidence.screenshotRoot,
    'Readability report',
  );
  assertReportScreenshotBindings(
    controlledQaReport,
    controlledQaScreenshots,
    controlledQaEvidence.screenshotRoot,
    'Controlled CEO Preview QA report',
  );

  const evidence = [];
  const reportCopies = [
    [readabilityJsonBinding, 'readability-report-json'],
    [readabilityMarkdownBinding, 'readability-report-markdown'],
    [controlledQaJsonBinding, 'controlled-ceo-preview-qa-json'],
    [controlledQaMarkdownBinding, 'controlled-ceo-preview-qa-markdown'],
  ];
  for (const [binding, status] of reportCopies) {
    evidence.push(await copyEvidenceFile(
      packageRoot,
      binding,
      `evidence/reports/${path.basename(binding.path)}`,
      status,
    ));
  }
  const copyScreenshots = async (bindings, sourceRoot, status) => {
    const copied = [];
    for (const binding of bindings) {
      const relativePng = binding.path.slice(`${sourceRoot}/`.length);
      copied.push(await copyEvidenceFile(
        packageRoot,
        binding,
        `evidence/screenshots/${path.basename(sourceRoot)}/${relativePng}`,
        status,
      ));
    }
    return copied;
  };
  const copiedReadabilityScreenshots = await copyScreenshots(
    readabilityScreenshots,
    readabilityEvidence.screenshotRoot,
    'readability-screenshot',
  );
  const copiedControlledQaScreenshots = await copyScreenshots(
    controlledQaScreenshots,
    controlledQaEvidence.screenshotRoot,
    'controlled-ceo-preview-qa-screenshot',
  );
  evidence.push(
    ...copiedReadabilityScreenshots,
    ...copiedControlledQaScreenshots,
  );
  if (evidence.some((binding) =>
    binding.sourcePath.includes('g4-l3-v3-execution-checkpoint')
  )) {
    throw new Error(
      `Historical v3 checkpoint evidence is forbidden in ${variant.version}.`,
    );
  }
  const reportBinding = (binding) => ({
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  });
  return {
    evidence,
    readabilityEnhancements: {
      ...readabilityEnhancements,
      reports: {
        json: reportBinding(readabilityJsonBinding),
        markdown: reportBinding(readabilityMarkdownBinding),
      },
      screenshots: readabilityScreenshots,
    },
    controlledCeoPreviewQa: {
      status: controlledQaReport.summary.status,
      activePages: controlledQaReport.summary.activePages,
      courseShells: controlledQaReport.summary.courseShells,
      releaseMembers: controlledQaReport.summary.releaseMembers,
      strictCompleteMembers:
        controlledQaReport.summary.strictCompleteMembers,
      published: controlledQaReport.summary.published,
      uniqueRoutesVerified:
        controlledQaReport.summary.uniqueRoutesVerified,
      routeVisits: controlledQaReport.summary.routeVisits,
      reports: {
        json: reportBinding(controlledQaJsonBinding),
        markdown: reportBinding(controlledQaMarkdownBinding),
      },
      screenshots: controlledQaScreenshots,
    },
  };
}

export function validateV31RegressionEvidence(
  report,
  sourceInventory,
  sourceInventoryBinding,
  descriptor,
) {
  const boundary = report?.truthBoundary;
  const inventoryRows = Array.isArray(sourceInventory?.files)
    ? sourceInventory.files
    : sourceInventory?.entries;
  const reportInventoryBinding =
    report?.sourceInventoryBinding ?? report?.sourceInventory;
  if (
    report?.schemaVersion !== 1
    || report?.reportType !== descriptor.reportType
    || !/^pass(?:-|$)/.test(report?.summary?.status ?? '')
    || report?.summary?.releaseMembers !== 40
    || report?.summary?.strictCompleteMembers !== 0
    || report?.summary?.published !== false
    || boundary?.declaredFunctionalPageInventoryComplete !== true
    || boundary?.declaredFunctionalMarkersObserved !== true
    || boundary?.functionalInteractionCompletenessEstablished !== false
    || boundary?.fullCurrentV31SourceInventoryBound !== true
    || boundary?.exhaustiveByteDeltaFromV3Established !== false
    || boundary?.strictAcceptanceEffect !== 'none'
    || reportInventoryBinding?.path !== sourceInventoryBinding.path
    || reportInventoryBinding?.bytes !== sourceInventoryBinding.bytes
    || reportInventoryBinding?.sha256 !== sourceInventoryBinding.sha256
    || sourceInventory?.schemaVersion !== 1
    || sourceInventory?.reportType !== descriptor.sourceInventoryType
    || !Array.isArray(inventoryRows)
    || inventoryRows.length === 0
    || inventoryRows.some((row) => {
      try {
        assertSafeWorkspaceRelativePath(row?.path, 'Source inventory row');
      } catch {
        return true;
      }
      return !Number.isSafeInteger(row?.bytes)
        || row.bytes < 0
        || !/^[a-f0-9]{64}$/.test(row?.sha256 ?? '');
    })
    || new Set(inventoryRows.map((row) => row.path)).size
      !== inventoryRows.length
  ) {
    throw new Error(
      'The v3.1 post-v3 current-JavaScript regression evidence is absent, stale, or failing.',
    );
  }
  return structuredClone(boundary);
}

async function copyV31RegressionEvidence(packageRoot, variant) {
  const descriptor = variant.regressionEvidence;
  const [
    reportBinding,
    browserQaBinding,
    sourceInventoryBinding,
    markdownBinding,
  ] = await Promise.all([
    workspaceFileBinding(descriptor.json),
    workspaceFileBinding(descriptor.browserQa),
    workspaceFileBinding(descriptor.sourceInventory),
    workspaceFileBinding(descriptor.markdown),
  ]);
  const [report, browserQa, sourceInventory, screenshots] = await Promise.all([
    readFile(path.join(WORKSPACE_ROOT, descriptor.json), 'utf8')
      .then(JSON.parse),
    readFile(path.join(WORKSPACE_ROOT, descriptor.browserQa), 'utf8')
      .then(JSON.parse),
    readFile(path.join(WORKSPACE_ROOT, descriptor.sourceInventory), 'utf8')
      .then(JSON.parse),
    recursivePngBindings(descriptor.screenshotRoot),
  ]);
  validateRegressionReceipt(report);
  const sourceInventoryFailures =
    validateSourceInventoryDocument(sourceInventory);
  if (sourceInventoryFailures.length > 0) {
    throw new Error(
      `The v3.1 post-v3 source inventory is invalid: ${sourceInventoryFailures.join('; ')}`,
    );
  }
  const currentSourceInventory = await buildFullCurrentSourceInventory();
  if (
    stableJson(currentSourceInventory.summary)
      !== stableJson(sourceInventory.summary)
  ) {
    throw new Error(
      'The v3.1 post-v3 source inventory no longer matches the current source tree.',
    );
  }
  const truthBoundary = validateV31RegressionEvidence(
    report,
    sourceInventory,
    sourceInventoryBinding,
    descriptor,
  );
  if (
    browserQa?.schemaVersion !== 1
    || browserQa?.reportType !== descriptor.browserQaReportType
    || browserQa?.summary?.status !== 'pass-current-js-regression'
    || browserQa?.summary?.releaseMembers !== 40
    || browserQa?.summary?.strictCompleteMembers !== 0
    || browserQa?.summary?.published !== false
    || stableJson(report?.browserQa?.report) !== stableJson(browserQaBinding)
    || stableJson(report?.browserQa?.embeddedReport) !== stableJson(browserQa)
  ) {
    throw new Error(
      'The v3.1 post-v3 browser regression report is absent, stale, or failing.',
    );
  }
  assertReportScreenshotBindings(
    report,
    screenshots,
    descriptor.screenshotRoot,
    'v3.1 post-v3 regression report',
  );
  const copied = [];
  for (const [binding, status] of [
    [reportBinding, 'post-v3-regression-report-json'],
    [browserQaBinding, 'post-v3-browser-regression-report-json'],
    [sourceInventoryBinding, 'post-v3-source-inventory-json'],
    [markdownBinding, 'post-v3-regression-report-markdown'],
  ]) {
    copied.push(await copyEvidenceFile(
      packageRoot,
      binding,
      `evidence/reports/${path.basename(binding.path)}`,
      status,
    ));
  }
  for (const binding of screenshots) {
    const relativePng = binding.path.slice(
      `${descriptor.screenshotRoot}/`.length,
    );
    copied.push(await copyEvidenceFile(
      packageRoot,
      binding,
      `evidence/screenshots/${path.basename(descriptor.screenshotRoot)}/${relativePng}`,
      'post-v3-regression-screenshot',
    ));
  }
  return {
    evidence: copied,
    manifest: {
      status: report.summary.status,
      truthBoundary,
      reports: {
        json: reportBinding,
        browserQa: browserQaBinding,
        markdown: markdownBinding,
      },
      sourceInventory: sourceInventoryBinding,
      screenshots,
    },
  };
}

async function copyEvidence(packageRoot, variant) {
  if (variant.readabilityEvidence && variant.controlledQaEvidence) {
    const versionedEvidence = await copyV3Evidence(packageRoot, variant);
    if (variant.regressionEvidence) {
      const regressionEvidence = await copyV31RegressionEvidence(
        packageRoot,
        variant,
      );
      return {
        ...versionedEvidence,
        evidence: [
          ...versionedEvidence.evidence,
          ...regressionEvidence.evidence,
        ],
        postV3Regression: regressionEvidence.manifest,
      };
    }
    return versionedEvidence;
  }
  const copied = [];
  for (const relativePath of EVIDENCE_FILES) {
    const source = path.join(WORKSPACE_ROOT, relativePath);
    try {
      const metadata = await stat(source);
      if (!metadata.isFile()) continue;
      const destination = path.join(
        packageRoot,
        'evidence',
        path.basename(relativePath),
      );
      await mkdir(path.dirname(destination), {recursive: true});
      await cp(source, destination, {preserveTimestamps: false});
      copied.push({
        path: `evidence/${path.basename(relativePath)}`,
        bytes: metadata.size,
        sha256: await sha256File(source),
        status: 'dated-prior-checkpoint',
      });
    } catch {
      // Evidence is an informative package attachment, not a runtime input.
    }
  }
  return {
    evidence: copied,
    readabilityEnhancements: null,
    controlledCeoPreviewQa: null,
    postV3Regression: null,
  };
}

function readmeText(variant) {
  return `# ${variant.title}

**Controlled CEO Preview — current JavaScript candidate.**

This package opens Grade 4, Lesson 3 as one continuous 39-page lesson player.
It includes one entry point, course-map and section navigation, Previous/Next,
local-device learner review progress, Replay state, and the current local
JavaScript resources and audio mappings.

## Start

Requirements: Apple-silicon Mac and Node.js 24.

\`\`\`bash
node verify.mjs
node start.mjs
\`\`\`

The launcher verifies every packaged file, starts an offline local server on
\`127.0.0.1:${variant.defaultPort}\`, and opens:

\`\`\`text
http://127.0.0.1:${variant.defaultPort}/courses/4/3
\`\`\`

Spanish route:

\`\`\`text
http://127.0.0.1:${variant.defaultPort}/es/courses/4/3
\`\`\`

Use \`node start.mjs --port 3220\` if port ${variant.defaultPort} is busy. Press Control-C in the
Terminal window to stop the lesson server.

The package does not need npm install and does not use the network. It cannot
run from \`file://\`; the included local Node server is required.

## Evidence boundary

- 39 current-JavaScript page candidates and the product lesson player are
  bundled.
- 36 pages have 72 current web-audio candidate files; the three Final Quiz
  pages have no page-specific current web cue mapping.
- Original-runtime full-frame comparison, independent human visual/audio
  review, RMSE acceptance, Owner acceptance, strict completion, and public
  release remain pending.
- The strict lesson ledger remains 0/40 and unpublished.
- Learner "reviewed" progress in this package is local UI state. It is not
  migration completion, instructional mastery, an assessment score, or
  acceptance evidence.

This artifact is for local/private controlled preview. Do not publish it to a
public host or Vercel. A private remote demonstration should keep the server on
loopback and use an authenticated SSH tunnel.
`;
}

export function verifierSource(variant) {
  const v3ManifestCondition = variant.readabilityEvidence
    ? `
    || manifest.readabilityEnhancements?.pageOrdinal !== 36
    || manifest.readabilityEnhancements?.animationId !== 'course-g04-l03-ts-008'
    || manifest.readabilityEnhancements?.source?.path !== ${JSON.stringify(TS008_SOURCE_PATH)}
    || manifest.readabilityEnhancements?.source?.bytes !== ${TS008_SOURCE_BYTES}
    || manifest.readabilityEnhancements?.source?.sha256 !== '${TS008_SOURCE_SHA256}'
    || manifest.readabilityEnhancements?.frameDomain !== 'sprite-350'
    || manifest.readabilityEnhancements?.frame !== 789
    || manifest.readabilityEnhancements?.nativePaddingPixels !== 4
    || manifest.readabilityEnhancements?.desktopScale !== 2.5
    || JSON.stringify(manifest.readabilityEnhancements?.crops?.map((crop) => ({
      id: crop?.id,
      sourceRect: crop?.sourceRect,
      paddedCropRect: crop?.paddedCropRect,
      asset: crop?.asset,
      sourceCharacterIds: crop?.sourceCharacterIds,
      transcriptSha256: crop?.transcriptSha256
    }))) !== JSON.stringify(${JSON.stringify(V3_READABILITY_CROP_CONTRACTS)})
    || manifest.readabilityEnhancements?.defaultExpanded !== true
    || manifest.readabilityEnhancements?.originalLayoutPreserved !== true
    || manifest.readabilityEnhancements?.strictAcceptanceEffect !== 'none'
    || manifest.readabilityEnhancements?.reports?.json?.path !== ${JSON.stringify(variant.readabilityEvidence.json)}
    || manifest.readabilityEnhancements?.reports?.markdown?.path !== ${JSON.stringify(variant.readabilityEvidence.markdown)}
    || !manifest.readabilityEnhancements?.screenshots?.every((binding) => binding?.path?.startsWith(${JSON.stringify(`${variant.readabilityEvidence.screenshotRoot}/`)}))
    || !Array.isArray(manifest.evidence)
    || manifest.evidence.length === 0
    || manifest.controlledCeoPreviewQa?.status !== 'pass-machine-verified-controlled-ceo-preview'
    || manifest.controlledCeoPreviewQa?.strictCompleteMembers !== 0
    || manifest.controlledCeoPreviewQa?.published !== false
    || manifest.controlledCeoPreviewQa?.reports?.json?.path !== ${JSON.stringify(variant.controlledQaEvidence.json)}
    || manifest.controlledCeoPreviewQa?.reports?.markdown?.path !== ${JSON.stringify(variant.controlledQaEvidence.markdown)}
    || !manifest.controlledCeoPreviewQa?.screenshots?.every((binding) => binding?.path?.startsWith(${JSON.stringify(`${variant.controlledQaEvidence.screenshotRoot}/`)}))
    || manifest.evidence?.some((binding) => String(binding.sourcePath ?? binding.path).includes('g4-l3-v3-execution-checkpoint'))`
    : '';
  const frozenPreimageManifestCondition = variant.frozenPreimages
    ? `
    || JSON.stringify(manifest.frozenPreimages) !== JSON.stringify(${JSON.stringify(variant.frozenPreimages)})`
    : '';
  const regressionManifestCondition = variant.regressionEvidence
    ? `
    || manifest.postV3Regression?.reports?.json?.path !== ${JSON.stringify(variant.regressionEvidence.json)}
    || manifest.postV3Regression?.reports?.browserQa?.path !== ${JSON.stringify(variant.regressionEvidence.browserQa)}
    || manifest.postV3Regression?.reports?.markdown?.path !== ${JSON.stringify(variant.regressionEvidence.markdown)}
    || manifest.postV3Regression?.sourceInventory?.path !== ${JSON.stringify(variant.regressionEvidence.sourceInventory)}
    || manifest.postV3Regression?.truthBoundary?.declaredFunctionalPageInventoryComplete !== true
    || manifest.postV3Regression?.truthBoundary?.declaredFunctionalMarkersObserved !== true
    || manifest.postV3Regression?.truthBoundary?.functionalInteractionCompletenessEstablished !== false
    || manifest.postV3Regression?.truthBoundary?.fullCurrentV31SourceInventoryBound !== true
    || manifest.postV3Regression?.truthBoundary?.exhaustiveByteDeltaFromV3Established !== false
    || manifest.postV3Regression?.truthBoundary?.strictAcceptanceEffect !== 'none'
    || !manifest.postV3Regression?.screenshots?.every((binding) => binding?.path?.startsWith(${JSON.stringify(`${variant.regressionEvidence.screenshotRoot}/`)}))`
    : '';
  const successorManifestCondition = variant.successorRevision
    ? variant.version === 'v3-3'
      ? `
    || manifest.successorRevision?.predecessorPackageId !== 'g4-l3-whole-lesson-package-mvp-v3-2-r2'
    || JSON.stringify(manifest.successorRevision?.predecessor?.archive) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2Archive)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.manifest) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2Manifest)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.archiveChecksum) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2ArchiveChecksum)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.payloadChecksums) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2PayloadChecksums)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.smoke) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2Smoke)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.deliveryReceipt) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2DeliveryReceipt)})
    || JSON.stringify(manifest.successorRevision?.predecessor?.deliveryReport) !== JSON.stringify(${JSON.stringify(V33_FROZEN_PREIMAGES.v32R2DeliveryReport)})
    || manifest.successorRevision?.predecessor?.receiptFingerprintSha256 !== '${V33_PREDECESSOR_RECEIPT_FINGERPRINT_SHA256}'
    || JSON.stringify(manifest.successorRevision?.predecessor?.sourceSnapshot) !== JSON.stringify(${JSON.stringify(V33_PREDECESSOR_SOURCE_SNAPSHOT)})
    || manifest.successorRevision?.predecessor?.unchanged !== true
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.fileCount !== 6
    || JSON.stringify(manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.files?.map(({path, sha256, role, predecessor}) => ({path, sha256, role, predecessor}))) !== JSON.stringify(${JSON.stringify(V33_DECLARED_PRODUCT_AND_VERIFICATION_BATCH)})
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.files?.some(({bytes}) => !Number.isSafeInteger(bytes) || bytes <= 0)
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.roleCounts?.authoredRuntime !== 2
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.roleCounts?.unitTest !== 2
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.roleCounts?.browserTest !== 1
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.roleCounts?.browserConfig !== 1
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.predecessorPerFileAvailableCount !== 5
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.predecessorPerFileUnavailableCount !== 1
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.allSixChangedEstablished !== false
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.exhaustiveByteDeltaFromV32R2Established !== false
    || manifest.successorRevision?.declaredSixFileProductAndVerificationBatch?.declaredBatchIsOnlyRepoDelta !== false
    || manifest.successorRevision?.finalSourceBoundary !== 'manifest.build.inputSnapshotFinal binds the complete current package-source inventory, including shared runtime and non-G4 context traced by the package workbench'
    || manifest.authoredProductSourceChangedFromV32R2 !== true
    || manifest.fullCurrentV33SourceSnapshotBound !== true
    || manifest.successorRevision?.authoredProductSourceChangedFromV32R2 !== true
    || manifest.successorRevision?.fullCurrentV33SourceSnapshotBound !== true
    || manifest.successorRevision?.exhaustiveByteDeltaFromV32R2Established !== false
    || manifest.successorRevision?.declaredBatchIsOnlyRepoDelta !== false
    || manifest.successorRevision?.strictAcceptanceEffect !== 'none'`
      : `
    || manifest.successorRevision?.predecessorPackageId !== 'g4-l3-whole-lesson-package-mvp-v3-1'
    || manifest.successorRevision?.predecessor?.archive?.sha256 !== '${V32_FROZEN_PREIMAGES.v31Archive.sha256}'
    || manifest.successorRevision?.predecessor?.manifest?.sha256 !== '${V32_FROZEN_PREIMAGES.v31Manifest.sha256}'
    || manifest.successorRevision?.predecessor?.deliveryReceipt?.sha256 !== '${V32_FROZEN_PREIMAGES.v31DeliveryReceipt.sha256}'
    || manifest.successorRevision?.predecessor?.postbuildSmokeRunner?.sha256 !== '${V32_FROZEN_PREIMAGES.v31PostbuildSmokeRunner.sha256}'
    || manifest.successorRevision?.predecessor?.receiptFingerprintSha256 !== '6564941b267b1a29ce2ed10d0534b2273696b74957a14662536c398442be2580'
    || manifest.successorRevision?.predecessor?.unchanged !== true
    || manifest.successorRevision?.knownCompactLandscapeBatch?.fileCount !== 6
    || JSON.stringify(manifest.successorRevision?.knownCompactLandscapeBatch?.files?.map(({path, sha256}) => ({path, sha256}))) !== JSON.stringify(${JSON.stringify(V32_COMPACT_LANDSCAPE_SOURCE_CONTRACTS)})
    || manifest.successorRevision?.knownCompactLandscapeBatch?.currentProductCopy?.english !== 'Flash transport parity: not established'
    || manifest.successorRevision?.knownCompactLandscapeBatch?.currentProductCopy?.spanish !== 'Paridad del transporte de Flash: no establecida'
    || manifest.successorRevision?.knownCompactLandscapeBatch?.responsiveContract?.toolbarColumns !== 4
    || manifest.successorRevision?.knownCompactLandscapeBatch?.responsiveContract?.minimumInteractiveTargetPixels !== 44
    || manifest.successorRevision?.primarySmokeSelectorClosure?.keyTermsHostSelectionResolution !== 'matched-local-entry'
    || manifest.successorRevision?.primarySmokeSelectorClosure?.externalPostbuildSmokeRunnerRequired !== false
    || manifest.successorRevision?.exhaustiveByteDeltaFromV31Established !== false
    || manifest.successorRevision?.strictAcceptanceEffect !== 'none'`
    : '';
  const smokeHarnessRevisionCondition = variant.smokeHarnessRevision
    ? `
    || manifest.smokeHarnessRevision?.predecessorAttemptPackageId !== 'g4-l3-whole-lesson-package-mvp-v3-2'
    || manifest.smokeHarnessRevision?.predecessorAttemptStatus !== 'superseded-after-primary-smoke-harness-failure'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.archive?.sha256 !== '${V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptArchive.sha256}'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.manifest?.sha256 !== '${V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptManifest.sha256}'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.archiveChecksum?.sha256 !== '${V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptArchiveChecksum.sha256}'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.payloadChecksums?.sha256 !== '${V32_FAILED_SMOKE_ATTEMPT_PREIMAGES.v32FailedSmokeAttemptPayloadChecksums.sha256}'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.primaryBuilderSha256 !== 'ef4bab3904eb1c7030486d9b7dc3ed66bcc733eaa5881ca461ae9caee71ed5e7'
    || manifest.smokeHarnessRevision?.predecessorAttempt?.packageVerifierPassed !== true
    || manifest.smokeHarnessRevision?.predecessorAttempt?.formalSmokeReportPublished !== false
    || manifest.smokeHarnessRevision?.predecessorAttempt?.deliveryReceiptPublished !== false
    || manifest.smokeHarnessRevision?.predecessorAttempt?.predecessorOverwritten !== false
    || manifest.smokeHarnessRevision?.predecessorAttempt?.productFailureEstablished !== false
    || manifest.smokeHarnessRevision?.predecessorAttempt?.unchanged !== true
    || manifest.smokeHarnessRevision?.changeClass !== 'packaging-smoke-harness-only'
    || manifest.smokeHarnessRevision?.authoredProductSourceChangedFromV32 !== false
    || manifest.smokeHarnessRevision?.correctedBeforePackaging !== true
    || manifest.smokeHarnessRevision?.externalPostbuildCorrectionUsed !== false
    || manifest.smokeHarnessRevision?.compactRootSelector !== 'main.lesson-shell2'
    || manifest.smokeHarnessRevision?.compactPageSelectionMechanism !== 'visible-course-map-row'
    || manifest.smokeHarnessRevision?.browserProfileIsolation !== 'resolved-resume-state-before-each-compact-scenario'
    || manifest.smokeHarnessRevision?.resumeDecisionBeforeGeometry !== 'resolved'
    || manifest.smokeHarnessRevision?.sessionDecisionOverlayBeforeGeometry !== 'closed'
    || JSON.stringify(manifest.smokeHarnessRevision?.corrections) !== JSON.stringify(${JSON.stringify([
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
    ])})
    || manifest.smokeHarnessRevision?.strictAcceptanceEffect !== 'none'`
    : '';
  const qaHarnessRevisionCondition = variant.qaHarnessRevision
    ? `
    || JSON.stringify(manifest.qaHarnessRevision) !== JSON.stringify(${JSON.stringify(variant.qaHarnessRevision)})`
    : '';
  const packageSmokeHarnessRevisionCondition =
    variant.packageSmokeHarnessRevision
      ? `
    || JSON.stringify(manifest.packageSmokeHarnessRevision) !== JSON.stringify(${JSON.stringify(variant.packageSmokeHarnessRevision)})`
      : '';
  const qaEvidenceReuseCondition = variant.qaEvidenceReuse
    ? `
    || JSON.stringify(manifest.qaEvidenceReuse) !== JSON.stringify(${JSON.stringify(variant.qaEvidenceReuse)})`
    : '';
  return `#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function files(directory = root) {
  const result = [];
  async function visit(current) {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === '.DS_Store') throw new Error('Unexpected .DS_Store');
      const absolute = path.join(current, entry.name);
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink()) throw new Error('Symbolic link refused: ' + absolute);
      if (metadata.isDirectory()) await visit(absolute);
      else if (metadata.isFile()) result.push({
        absolute,
        relative: path.relative(root, absolute).split(path.sep).join('/'),
        metadata
      });
    }
  }
  await visit(directory);
  return result;
}

export async function verifyPackage() {
  const manifest = JSON.parse(await readFile(path.join(root, 'package-manifest.json'), 'utf8'));
  if (
    manifest.schemaVersion !== 1
    || manifest.packageId !== ${JSON.stringify(variant.packageId)}
    || manifest.title !== ${JSON.stringify(variant.title)}
    || manifest.packageType !== 'machine-verified-controlled-preview-package'
    || manifest.entry?.url !== ${JSON.stringify(`http://127.0.0.1:${variant.defaultPort}/courses/4/3`)}
    || manifest.entry?.spanishUrl !== ${JSON.stringify(`http://127.0.0.1:${variant.defaultPort}/es/courses/4/3`)}
    || manifest.entry?.network !== 'loopback-only'
    || manifest.entry?.serverEntry !== 'runtime/apps/web/server.js'
    || manifest.target?.platform !== 'darwin'
    || manifest.target?.architecture !== 'arm64'
    || manifest.target?.nodeMajor !== 24
    || process.platform !== 'darwin'
    || process.arch !== 'arm64'
    || Number(process.versions.node.split('.')[0]) !== 24
    || manifest.members?.length !== 40
    || new Set(manifest.members.map((member) => member.animationId)).size !== 40
    || manifest.release?.expectedMembers !== 40
    || manifest.release?.activePages !== 39
    || manifest.release?.courseShells !== 1
    || manifest.release?.strictCompleteCount !== 0
    || manifest.release?.missingCount !== 40
    || manifest.release?.published !== false
    || manifest.assets?.audioFileCount !== 72
    || JSON.stringify(manifest.authority) !== JSON.stringify({
      originalRuntimeFullFrameAccepted: false,
      humanVisualAccepted: false,
      humanAudioAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicRelease: false
    })
    || JSON.stringify(manifest.build?.inputSnapshotBefore) !== JSON.stringify(manifest.build?.inputSnapshotAfter)
    || JSON.stringify(manifest.build?.inputSnapshotAfter) !== JSON.stringify(manifest.build?.inputSnapshotFinal)
    ${v3ManifestCondition}
    ${frozenPreimageManifestCondition}
    ${regressionManifestCondition}
    ${successorManifestCondition}
    ${smokeHarnessRevisionCondition}
    ${qaHarnessRevisionCondition}
    ${packageSmokeHarnessRevisionCondition}
    ${qaEvidenceReuseCondition}
  ) throw new Error('Package manifest authority or lesson shape is invalid.');

  const checksumText = await readFile(path.join(root, 'CHECKSUMS.sha256'), 'utf8');
  const expected = new Map(checksumText.trim().split('\\n').filter(Boolean).map((line) => {
    const match = /^([a-f0-9]{64})  ([^\\0]+)$/.exec(line);
    if (
      !match
      || match[2].startsWith('/')
      || match[2].split('/').some((part) => part === '..' || part === '.')
    ) {
      throw new Error('Malformed checksum row.');
    }
    return [match[2], match[1]];
  }));
  const actualFiles = (await files()).filter((file) => file.relative !== 'CHECKSUMS.sha256');
  if (expected.size !== actualFiles.length) throw new Error('Package file count differs from checksums.');
  let privacyBytesScanned = 0;
  for (const file of actualFiles) {
    const expectedHash = expected.get(file.relative);
    if (!expectedHash) throw new Error('Unexpected file: ' + file.relative);
    const bytes = await readFile(file.absolute);
    privacyBytesScanned += bytes.length;
    const actualHash = hash(bytes);
    if (actualHash !== expectedHash) throw new Error('Checksum mismatch: ' + file.relative);
    if (
      ${FORBIDDEN_PACKAGE_EXTENSIONS}.test(file.relative)
      || file.relative.split('/').some((part) => part === '.env' || part.startsWith('.env.'))
    ) {
      throw new Error('Forbidden source, database, or environment file: ' + file.relative);
    }
    for (const marker of ['/' + 'Users' + '/', '/' + 'Volumes' + '/']) {
      if (bytes.includes(Buffer.from(marker))) {
        throw new Error('Private absolute local path in package file: ' + file.relative);
      }
    }
  }
  for (const forbidden of ${JSON.stringify(FORBIDDEN_PACKAGE_PARTS)}) {
    if (actualFiles.some((file) => file.relative.split('/').includes(forbidden))) {
      throw new Error('Forbidden package path: ' + forbidden);
    }
  }
  console.log(JSON.stringify({
    status: 'verified',
    packageId: manifest.packageId,
    files: actualFiles.length,
    members: manifest.members.length,
    audioFiles: manifest.assets.audioFileCount,
    entry: manifest.entry.url,
    strictComplete: manifest.release.strictCompleteCount,
    published: manifest.release.published,
    privacyScan: {
      status: 'pass',
      filesScanned: actualFiles.length,
      bytesScanned: privacyBytesScanned,
      forbiddenPathFindings: 0,
      forbiddenExtensionFindings: 0,
      absoluteLocalPathFindings: 0
    }
  }, null, 2));
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyPackage();
}
`;
}

export function launcherSource(serverEntry, variant) {
  return `#!/usr/bin/env node
import {spawn, spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPackage} from './verify.mjs';

function childProcessTreePids(child) {
  if (!child?.pid || child.exitCode !== null) return new Set();
  const pids = new Set([child.pid]);
  const queue = [child.pid];
  while (queue.length > 0) {
    const parentPid = queue.shift();
    const result = spawnSync(
      '/usr/bin/pgrep',
      ['-P', String(parentPid)],
      {encoding: 'utf8'},
    );
    if (![0, 1].includes(result.status)) continue;
    for (const line of result.stdout.split('\\n')) {
      const pid = Number(line.trim());
      if (!Number.isSafeInteger(pid) || pid <= 0 || pids.has(pid)) continue;
      pids.add(pid);
      queue.push(pid);
    }
  }
  return pids;
}

function childOwnsLoopbackListener(child, port) {
  if (!child?.pid || child.exitCode !== null) return false;
  const processTree = childProcessTreePids(child);
  const result = spawnSync(
    '/usr/sbin/lsof',
    [
      '-nP',
      '-iTCP:' + port,
      '-sTCP:LISTEN',
      '-FpnT',
    ],
    {encoding: 'utf8'},
  );
  if (result.status !== 0) return false;
  let currentPid = null;
  const listeningPids = new Set();
  const matchingAddressPids = new Set();
  for (const line of result.stdout.split('\\n')) {
    if (line.startsWith('p')) {
      currentPid = Number(line.slice(1));
    } else if (line === 'TST=LISTEN') {
      listeningPids.add(currentPid);
    } else if (line === 'n127.0.0.1:' + port) {
      matchingAddressPids.add(currentPid);
    }
  }
  return [...processTree].some((pid) =>
    listeningPids.has(pid) && matchingAddressPids.has(pid)
  );
}

const root = path.dirname(fileURLToPath(import.meta.url));
const portIndex = process.argv.indexOf('--port');
const portText = portIndex === -1 ? ${JSON.stringify(String(variant.defaultPort))} : process.argv[portIndex + 1];
if (!/^[1-9]\\d{0,4}$/.test(portText ?? '') || Number(portText) > 65535) {
  throw new Error('Use --port with a number from 1 to 65535.');
}
await verifyPackage();
const port = Number(portText);
const url = 'http://127.0.0.1:' + port + '/courses/4/3';
const runtimeRoot = path.join(root, 'runtime');
const environment = {
  ...process.env,
  NODE_ENV: 'production',
  G4_L3_CEO_PREVIEW_ENABLED: '1',
  G4_L3_WHOLE_LESSON_PACKAGE: '1',
  G4_L3_WHOLE_LESSON_PACKAGE_V3_1: ${JSON.stringify(variant.version === 'v3-1' ? '1' : '0')},
  G4_L3_WHOLE_LESSON_PACKAGE_V3_2: ${JSON.stringify(variant.version === 'v3-2' ? '1' : '0')},
  G4_L3_WHOLE_LESSON_PACKAGE_V3_3: ${JSON.stringify(variant.version === 'v3-3' ? '1' : '0')},
  NEXT_TELEMETRY_DISABLED: '1',
  HOSTNAME: '127.0.0.1',
  PORT: String(port)
};
delete environment.VERCEL_ENV;
delete environment.G5_L4_CEO_PREVIEW_ENABLED;
delete environment.G5_L4_WHOLE_LESSON_PACKAGE;
const server = spawn(process.execPath, [${JSON.stringify(serverEntry)}], {
  cwd: runtimeRoot,
  env: environment,
  stdio: 'inherit'
});
const stop = () => server.kill('SIGTERM');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  if (server.exitCode !== null) throw new Error('Lesson server exited before becoming ready.');
  if (!childOwnsLoopbackListener(server, port)) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    continue;
  }
  try {
    const response = await fetch(url, {redirect: 'manual'});
    if (
      response.status === 200
      && childOwnsLoopbackListener(server, port)
    ) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready) {
  stop();
  throw new Error(
    'Lesson server did not become ready with verified process-tree ownership of its loopback listener.',
  );
}
if (!childOwnsLoopbackListener(server, port)) {
  stop();
  throw new Error(
    'Lesson server lost process-tree ownership of its loopback listener before launch.',
  );
}
console.log('\\nG4 L3 Whole-Lesson Package MVP is ready:');
console.log(url);
if (
  process.platform === 'darwin'
  && process.env.HELP_MATH_PACKAGE_NO_OPEN !== '1'
) {
  const opener = spawn('/usr/bin/open', [url], {detached: true, stdio: 'ignore'});
  opener.unref();
}
await new Promise((resolve, reject) => {
  server.once('exit', (code, signal) => {
    if (signal === 'SIGTERM' || code === 0) resolve();
    else reject(new Error('Lesson server exited with code ' + code));
  });
  server.once('error', reject);
});
`;
}

async function payloadInventory(packageRoot, excluded = new Set()) {
  const rows = [];
  for (const file of await walkFiles(packageRoot)) {
    if (excluded.has(file.relativePath)) continue;
    rows.push({
      path: file.relativePath,
      bytes: file.metadata.size,
      mode: file.metadata.mode & 0o777,
      sha256: await sha256File(file.absolutePath),
    });
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  return rows;
}

async function writeChecksums(packageRoot) {
  const rows = await payloadInventory(
    packageRoot,
    new Set(['CHECKSUMS.sha256']),
  );
  const text = `${rows.map((row) => `${row.sha256}  ${row.path}`).join('\n')}\n`;
  await writeFile(path.join(packageRoot, 'CHECKSUMS.sha256'), text, {
    encoding: 'utf8',
    mode: 0o444,
  });
  return {rows, sha256: sha256(Buffer.from(text))};
}

export async function scanPackagePrivacy(packageRoot) {
  const files = await walkFiles(packageRoot);
  let bytesScanned = 0;
  for (const file of files) {
    for (const forbidden of FORBIDDEN_PACKAGE_PARTS) {
      if (file.relativePath.split('/').includes(forbidden)) {
        throw new Error(`Forbidden package content: ${file.relativePath}`);
      }
    }
    if (
      FORBIDDEN_PACKAGE_EXTENSIONS.test(file.relativePath)
      || file.relativePath.split('/').some(
        (part) => part === '.env' || part.startsWith('.env.'),
      )
    ) {
      throw new Error(
        `Forbidden source, database, or environment file: ${file.relativePath}`,
      );
    }
    const bytes = await readFile(file.absolutePath);
    bytesScanned += bytes.length;
    for (const marker of ABSOLUTE_LOCAL_PATH_MARKERS) {
      if (bytes.includes(Buffer.from(marker))) {
        throw new Error(
          `Private absolute local path in package file: ${file.relativePath}`,
        );
      }
    }
  }
  return {
    status: 'pass',
    filesScanned: files.length,
    bytesScanned,
    forbiddenPathFindings: 0,
    forbiddenExtensionFindings: 0,
    absoluteLocalPathFindings: 0,
  };
}

async function packagePrivacyCheck(packageRoot) {
  return scanPackagePrivacy(packageRoot);
}

function gitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
  });
  return result.status === 0 && /^[a-f0-9]{40}$/.test(result.stdout.trim())
    ? result.stdout.trim()
    : null;
}

async function atomicInstall(stagedPackageRoot, variant) {
  if (variant.immutableBuild) {
    await assertPathAbsent(variant.deliveryReceiptPath, 'Delivery receipt');
    await assertPathAbsent(variant.deliveryReportPath, 'Delivery report');
    await assertPathAbsent(variant.packageRoot, 'Package directory');
    await rename(stagedPackageRoot, variant.packageRoot);
    return;
  }
  const backup = path.join(
    OUTPUTS_ROOT,
    `.${variant.packageBasename}.backup-${process.pid}`,
  );
  let priorMoved = false;
  try {
    try {
      await lstat(variant.packageRoot);
      await rename(variant.packageRoot, backup);
      priorMoved = true;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await rename(stagedPackageRoot, variant.packageRoot);
    if (priorMoved) await rm(backup, {recursive: true, force: true});
  } catch (error) {
    try {
      await rm(variant.packageRoot, {recursive: true, force: true});
      if (priorMoved) await rename(backup, variant.packageRoot);
    } catch {}
    throw error;
  }
}

async function runVerifierAt(packageRoot) {
  const result = spawnSync(process.execPath, ['verify.mjs'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `Packaged verifier failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

async function runVerifier(variant) {
  return runVerifierAt(variant.packageRoot);
}

async function archivePackage(variant) {
  if (variant.immutableBuild) {
    await assertPathAbsent(variant.deliveryReceiptPath, 'Delivery receipt');
    await assertPathAbsent(variant.deliveryReportPath, 'Delivery report');
    await assertPathAbsent(variant.archivePath, 'Package ZIP');
    await assertPathAbsent(variant.archiveShaPath, 'Package ZIP checksum');
  } else {
    await rm(variant.archivePath, {force: true});
    await rm(variant.archiveShaPath, {force: true});
  }
  const archiveBuildPath = variant.immutableBuild
    ? path.join(
        OUTPUTS_ROOT,
        `.${variant.packageBasename}.zip.stage-${process.pid}`,
      )
    : variant.archivePath;
  if (variant.immutableBuild) await rm(archiveBuildPath, {force: true});
  let archiveHash;
  try {
    const result = spawnSync(
      '/usr/bin/zip',
      ['-q', '-r', archiveBuildPath, variant.packageBasename],
      {cwd: OUTPUTS_ROOT, encoding: 'utf8'},
    );
    if (result.status !== 0) {
      throw new Error(`zip failed: ${result.stderr || result.stdout}`);
    }
    archiveHash = await sha256File(archiveBuildPath);
    if (variant.immutableBuild) {
      await link(archiveBuildPath, variant.archivePath);
    }
    await writeFile(
      variant.archiveShaPath,
      `${archiveHash}  ${path.basename(variant.archivePath)}\n`,
      {
        encoding: 'utf8',
        mode: 0o444,
        ...(variant.immutableBuild ? {flag: 'wx'} : {}),
      },
    );
  } finally {
    if (variant.immutableBuild) await rm(archiveBuildPath, {force: true});
  }
  return {
    path: path.relative(WORKSPACE_ROOT, variant.archivePath),
    bytes: (await stat(variant.archivePath)).size,
    sha256: archiveHash,
  };
}

async function stageImmutablePackageBundle(
  stagedPackageRoot,
  stageRoot,
  variant,
) {
  const verifier = await runVerifierAt(stagedPackageRoot);
  const stagedArchivePath = path.join(
    stageRoot,
    `${variant.packageBasename}.zip`,
  );
  const stagedChecksumPath = `${stagedArchivePath}.sha256`;
  const archiveResult = spawnSync(
    '/usr/bin/zip',
    ['-q', '-r', stagedArchivePath, variant.packageBasename],
    {cwd: stageRoot, encoding: 'utf8'},
  );
  if (archiveResult.status !== 0) {
    throw new Error(
      `immutable zip staging failed: ${archiveResult.stderr || archiveResult.stdout}`,
    );
  }
  const archiveHash = await sha256File(stagedArchivePath);
  await writeFile(
    stagedChecksumPath,
    `${archiveHash}  ${path.basename(variant.archivePath)}\n`,
    {encoding: 'utf8', mode: 0o444, flag: 'wx'},
  );
  const archiveIntegrity = spawnSync(
    '/usr/bin/unzip',
    ['-tq', stagedArchivePath],
    {encoding: 'utf8'},
  );
  if (archiveIntegrity.status !== 0) {
    throw new Error(
      `immutable staged ZIP integrity failed: ${archiveIntegrity.stderr}`,
    );
  }
  const freshVerificationRoot = path.join(stageRoot, '.fresh-zip-verifier');
  await mkdir(freshVerificationRoot);
  const extraction = spawnSync(
    '/usr/bin/unzip',
    ['-q', stagedArchivePath, '-d', freshVerificationRoot],
    {encoding: 'utf8'},
  );
  if (extraction.status !== 0) {
    throw new Error(
      `immutable staged ZIP extraction failed: ${extraction.stderr}`,
    );
  }
  await runVerifierAt(
    path.join(freshVerificationRoot, variant.packageBasename),
  );
  await rm(freshVerificationRoot, {recursive: true, force: true});
  return {
    verifier,
    stagedArchivePath,
    stagedChecksumPath,
    archive: {
      path: path.relative(WORKSPACE_ROOT, variant.archivePath),
      bytes: (await stat(stagedArchivePath)).size,
      sha256: archiveHash,
    },
  };
}

async function linkDirectoryContentsExclusive(sourceRoot, destinationRoot) {
  const entries = await readdir(sourceRoot, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const source = path.join(sourceRoot, entry.name);
    const destination = path.join(destinationRoot, entry.name);
    if (entry.isDirectory()) {
      await mkdir(destination);
      await linkDirectoryContentsExclusive(source, destination);
    } else if (entry.isFile()) {
      await link(source, destination);
    } else {
      throw new Error(
        `Immutable publish refuses non-file entry: ${source}`,
      );
    }
  }
}

export async function commitImmutablePackageBundle(
  stagedPackageRoot,
  stagedArchivePath,
  stagedChecksumPath,
  variant,
) {
  const lockPath = path.join(
    path.dirname(variant.packageRoot),
    `.${path.basename(variant.packageRoot)}.commit.lock`,
  );
  const committed = [];
  try {
    await mkdir(lockPath);
  } catch (error) {
    throw new Error(
      `Immutable package commit lock is unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    await assertImmutableBuildTargetsAbsent(variant);
    await mkdir(variant.packageRoot);
    committed.push({path: variant.packageRoot, recursive: true});
    await linkDirectoryContentsExclusive(
      stagedPackageRoot,
      variant.packageRoot,
    );
    await link(stagedArchivePath, variant.archivePath);
    committed.push({path: variant.archivePath, recursive: false});
    await link(stagedChecksumPath, variant.archiveShaPath);
    committed.push({path: variant.archiveShaPath, recursive: false});
  } catch (error) {
    for (const row of committed.reverse()) {
      await rm(row.path, {recursive: row.recursive, force: true})
        .catch(() => {});
    }
    throw error;
  } finally {
    await rm(lockPath, {recursive: true, force: true}).catch(() => {});
  }
  return true;
}

async function buildPackage(variant) {
  assertVariantModeAllowed(variant, 'build');
  if (process.platform !== 'darwin' || process.arch !== 'arm64') {
    throw new Error(`${variant.packageId} is bound to darwin/arm64.`);
  }
  if (Number(process.versions.node.split('.')[0]) !== 24) {
    throw new Error(`${variant.packageId} requires Node.js 24.`);
  }
  const buildLockPath = path.join(
    WEB_ROOT,
    `${variant.distDir}.whole-lesson-build.lock`,
  );
  try {
    await mkdir(buildLockPath);
  } catch (error) {
    throw new Error(
      `The ${variant.version} whole-lesson build lock is unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    await buildPackageWithLock(variant);
  } finally {
    await rm(buildLockPath, {recursive: true, force: true}).catch(() => {});
  }
}

async function buildPackageWithLock(variant) {
  await assertFrozenPreimagesForVariant(variant);
  await assertImmutableBuildTargetsAbsent(variant);
  const releaseDocument = JSON.parse(
    await readFile(path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'), 'utf8'),
  );
  const release = selectG4L3Release(releaseDocument);
  const ledgerDocument = JSON.parse(
    await readFile(path.join(WORKSPACE_ROOT, 'catalog/lesson-release-ledger.json'), 'utf8'),
  );
  const ledgerRelease = ledgerDocument.releases?.find(
    (candidate) => candidate.releaseId === RELEASE_ID,
  );
  if (
    !ledgerRelease
    || ledgerRelease.expectedMemberCount !== 40
    || ledgerRelease.strictCompleteCount !== 0
    || ledgerRelease.published !== false
  ) {
    throw new Error('The current G4 L3 strict-release boundary has changed.');
  }
  const beforeSnapshot = await buildCurrentPackageInputSnapshot(
    release,
    variant,
  );
  const packageDistRoot = path.join(WEB_ROOT, variant.distDir);
  await rm(packageDistRoot, {recursive: true, force: true});
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    G4_L3_CEO_PREVIEW_ENABLED: '1',
    G4_L3_WHOLE_LESSON_PACKAGE: '1',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_1:
      variant.version === 'v3-1' ? '1' : '0',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_2:
      variant.version === 'v3-2' ? '1' : '0',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_3:
      variant.version === 'v3-3' ? '1' : '0',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  delete environment.VERCEL_ENV;
  delete environment.G5_L4_CEO_PREVIEW_ENABLED;
  delete environment.G5_L4_WHOLE_LESSON_PACKAGE;
  const build = spawnSync(
    'npm',
    ['run', 'build', '--workspace', '@helpmath/web'],
    {
      cwd: WORKSPACE_ROOT,
      env: environment,
      stdio: 'inherit',
    },
  );
  if (build.status !== 0) throw new Error('Production package build failed.');
  const afterSnapshot = await buildCurrentPackageInputSnapshot(
    release,
    variant,
  );
  await assertFrozenPreimagesForVariant(variant);
  if (stableJson(beforeSnapshot) !== stableJson(afterSnapshot)) {
    throw new Error('Package inputs drifted during the production build.');
  }

  const requiredServerFiles = JSON.parse(
    await readFile(
      path.join(packageDistRoot, 'required-server-files.json'),
      'utf8',
    ),
  );
  if (requiredServerFiles?.config?.distDir !== variant.distDir) {
    throw new Error(
      `Next package distDir mismatch: expected ${variant.distDir}.`,
    );
  }
  const standaloneRoot = path.join(packageDistRoot, 'standalone');
  const buildId = (
    await readFile(path.join(packageDistRoot, 'BUILD_ID'), 'utf8')
  ).trim();
  if (!/^[A-Za-z0-9_-]+$/.test(buildId)) {
    throw new Error('Malformed package BUILD_ID.');
  }
  const stageRoot = await mkdtemp(
    path.join(OUTPUTS_ROOT, '.g4-l3-whole-lesson-package-stage-'),
  );
  const stagedPackageRoot = path.join(
    stageRoot,
    variant.packageBasename,
  );
  const runtimeRoot = path.join(stagedPackageRoot, 'runtime');
  let immutableBundle = null;
  try {
    await mkdir(stagedPackageRoot, {recursive: true});
    await cp(standaloneRoot, runtimeRoot, {
      recursive: true,
      dereference: true,
      preserveTimestamps: false,
    });
    // These immutable evidence trees are never runtime payload. The Next file
    // tracer can conservatively discover them through generic catalog helpers,
    // so remove them from the isolated staging root even when a future Next
    // version fails to honor the package-only trace exclusions above.
    for (const evidenceDirectory of [
      'artifacts',
      'migrations',
      'private-archive',
      'source-assets',
    ]) {
      await rm(path.join(runtimeRoot, evidenceDirectory), {
        recursive: true,
        force: true,
      });
    }
    const serverEntry = await findServerEntry(runtimeRoot);
    const standalonePortability =
      await sanitizeNextStandaloneLocalPaths(
        runtimeRoot,
        serverEntry,
        variant.distDir,
      );
    const serverDirectory = path.dirname(path.join(runtimeRoot, serverEntry));
    await cp(
      path.join(packageDistRoot, 'static'),
      path.join(serverDirectory, variant.distDir, 'static'),
      {recursive: true, dereference: true, preserveTimestamps: false},
    );
    await cp(
      path.join(WEB_ROOT, 'public'),
      path.join(serverDirectory, 'public'),
      {recursive: true, dereference: true, preserveTimestamps: false},
    );
    const catalogDescriptors = await copyCatalog(runtimeRoot);
    const assetSummary = await copyAllowedCourseAssets(release, runtimeRoot);
    const evidenceBundle = await copyEvidence(stagedPackageRoot, variant);
    const successorRevision = await buildSuccessorRevisionManifest(variant);
    const smokeHarnessRevision =
      await buildSmokeHarnessRevisionManifest(variant);
    const qaHarnessRevision =
      await buildQaHarnessRevisionManifest(variant);
    const packageSmokeHarnessRevision =
      await buildPackageSmokeHarnessRevisionManifest(variant);
    const finalSnapshot = await buildCurrentPackageInputSnapshot(
      release,
      variant,
    );
    await assertFrozenPreimagesForVariant(variant);
    if (
      stableJson(beforeSnapshot) !== stableJson(finalSnapshot)
      || stableJson(afterSnapshot) !== stableJson(finalSnapshot)
    ) {
      throw new Error(
        'Package inputs drifted while staging runtime assets or evidence.',
      );
    }

    await writeFile(
      path.join(stagedPackageRoot, 'README.md'),
      readmeText(variant),
      {encoding: 'utf8', mode: 0o444},
    );
    await writeFile(
      path.join(stagedPackageRoot, 'verify.mjs'),
      verifierSource(variant),
      {encoding: 'utf8', mode: 0o555},
    );
    await writeFile(
      path.join(stagedPackageRoot, 'start.mjs'),
      launcherSource(serverEntry, variant),
      {encoding: 'utf8', mode: 0o555},
    );
    await chmod(path.join(stagedPackageRoot, 'verify.mjs'), 0o555);
    await chmod(path.join(stagedPackageRoot, 'start.mjs'), 0o555);
    await packagePrivacyCheck(stagedPackageRoot);

    const payload = await payloadInventory(stagedPackageRoot);
    const payloadIndex = payload.map((row) =>
      `${row.sha256} ${row.bytes} ${row.mode.toString(8)} ${row.path}`
    ).join('\n');
    const manifest = {
      schemaVersion: 1,
      packageId: variant.packageId,
      packageType: 'machine-verified-controlled-preview-package',
      productLayer: 'whole-lesson-current-javascript-mvp',
      title: variant.title,
      target: {
        platform: process.platform,
        architecture: process.arch,
        nodeMajor: Number(process.versions.node.split('.')[0]),
      },
      entry: {
        command: 'node start.mjs',
        serverEntry: `runtime/${serverEntry}`,
        url: `http://127.0.0.1:${variant.defaultPort}/courses/4/3`,
        spanishUrl:
          `http://127.0.0.1:${variant.defaultPort}/es/courses/4/3`,
        network: 'loopback-only',
      },
      build: {
        buildId,
        distDir: `apps/web/${variant.distDir}`,
        inputSnapshotBefore: beforeSnapshot,
        inputSnapshotAfter: afterSnapshot,
        inputSnapshotFinal: finalSnapshot,
        gitHead: gitHead(),
        dirtyWorktree: true,
        nextStandalonePortability: standalonePortability,
      },
      release: {
        releaseId: RELEASE_ID,
        expectedMembers: 40,
        activePages: 39,
        courseShells: 1,
        strictCompleteCount: ledgerRelease.strictCompleteCount,
        missingCount: ledgerRelease.missingCount,
        published: ledgerRelease.published,
      },
      authority: {
        originalRuntimeFullFrameAccepted: false,
        humanVisualAccepted: false,
        humanAudioAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        publicRelease: false,
      },
      ...(variant.frozenPreimages
        ? {frozenPreimages: structuredClone(variant.frozenPreimages)}
        : {}),
      ...(variant.version === 'v3-3'
        ? {
            authoredProductSourceChangedFromV32R2: true,
            fullCurrentV33SourceSnapshotBound: true,
          }
        : {}),
      ...(successorRevision ? {successorRevision} : {}),
      ...(smokeHarnessRevision ? {smokeHarnessRevision} : {}),
      ...(qaHarnessRevision ? {qaHarnessRevision} : {}),
      ...(packageSmokeHarnessRevision
        ? {packageSmokeHarnessRevision}
        : {}),
      ...(variant.qaEvidenceReuse
        ? {qaEvidenceReuse: structuredClone(variant.qaEvidenceReuse)}
        : {}),
      members: release.members.map((member) => ({
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        sourceSha256: member.source.sha256,
      })),
      assets: {
        ...assetSummary,
        pagesWithCurrentWebAudio: 36,
        pagesWithoutCurrentWebAudio: [
          'course-g04-l03-fq-001',
          'course-g04-l03-fq-002',
          'course-g04-l03-fq-003',
        ],
        audioAcceptance: false,
        allowlistedExtensions: [...COURSE_ASSET_EXTENSIONS].sort(),
      },
      catalog: catalogDescriptors,
      evidence: evidenceBundle.evidence,
      ...(variant.readabilityEvidence && variant.controlledQaEvidence
        ? {
            readabilityEnhancements:
              evidenceBundle.readabilityEnhancements,
            controlledCeoPreviewQa:
              evidenceBundle.controlledCeoPreviewQa,
            ...(variant.regressionEvidence
              ? {postV3Regression: evidenceBundle.postV3Regression}
              : {}),
          }
        : {}),
      payload: {
        fileCount: payload.length,
        totalBytes: payload.reduce((sum, row) => sum + row.bytes, 0),
        indexSha256: sha256(Buffer.from(payloadIndex)),
      },
      exclusions: [
        'FLA and SWF source binaries',
        'Ruffle reference runtime',
        'historical office archive',
        'HELP Math 1.0 SQL archive',
        'legacy credentials and personal records',
        'public deployment authorization',
      ],
      knownPendingGates: [
        '39-versus-44 shipped-shell sequence conflict',
        'authoritative original-runtime complete-frame evidence',
        'full-frame RMSE review',
        'independent visual and audio review',
        'Owner acceptance',
        'strict completion',
        'atomic public release',
      ],
    };
    await writeFile(
      path.join(stagedPackageRoot, 'package-manifest.json'),
      stableJson(manifest),
      {encoding: 'utf8', mode: 0o444},
    );
    await writeChecksums(stagedPackageRoot);
    await packagePrivacyCheck(stagedPackageRoot);
    if (variant.immutableBuild) {
      immutableBundle = await stageImmutablePackageBundle(
        stagedPackageRoot,
        stageRoot,
        variant,
      );
      const preCommitSnapshot = await buildCurrentPackageInputSnapshot(
        release,
        variant,
      );
      await assertFrozenPreimagesForVariant(variant);
      assertPackageInputSnapshotCurrent(manifest, preCommitSnapshot);
      await commitImmutablePackageBundle(
        stagedPackageRoot,
        immutableBundle.stagedArchivePath,
        immutableBundle.stagedChecksumPath,
        variant,
      );
    } else {
      const preInstallSnapshot = await buildCurrentPackageInputSnapshot(
        release,
        variant,
      );
      assertPackageInputSnapshotCurrent(manifest, preInstallSnapshot);
      await atomicInstall(stagedPackageRoot, variant);
    }
  } finally {
    await rm(stageRoot, {recursive: true, force: true});
  }
  const verifier = immutableBundle?.verifier ?? await runVerifier(variant);
  const archive = immutableBundle?.archive ?? await archivePackage(variant);
  await assertFrozenPreimagesForVariant(variant);
  console.log(stableJson({
    status: 'built',
    package: path.relative(WORKSPACE_ROOT, variant.packageRoot),
    verifier: JSON.parse(verifier),
    archive,
  }));
}

async function checkPackage(variant) {
  await assertFrozenPreimagesForVariant(variant);
  const verifier = await runVerifier(variant);
  const manifest = JSON.parse(
    await readFile(
      path.join(variant.packageRoot, 'package-manifest.json'),
      'utf8',
    ),
  );
  if (variant.verifyCurrentInputSnapshot) {
    const releaseDocument = JSON.parse(
      await readFile(
        path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'),
        'utf8',
      ),
    );
    const currentSnapshot = await buildCurrentPackageInputSnapshot(
      selectG4L3Release(releaseDocument),
      variant,
    );
    assertPackageInputSnapshotCurrent(manifest, currentSnapshot);
  }
  const archiveHashRow = (
    await readFile(variant.archiveShaPath, 'utf8')
  ).trim();
  const match = /^([a-f0-9]{64})  ([^/]+)$/.exec(archiveHashRow);
  if (!match || match[2] !== path.basename(variant.archivePath)) {
    throw new Error('Malformed outer archive checksum.');
  }
  if (await sha256File(variant.archivePath) !== match[1]) {
    throw new Error('Outer archive checksum mismatch.');
  }
  const freshArchiveCheck = variant.checkFromArchive
    ? await checkFreshArchiveCopy(variant)
    : null;
  console.log(stableJson({
    status: 'checked',
    package: path.relative(WORKSPACE_ROOT, variant.packageRoot),
    archive: path.relative(WORKSPACE_ROOT, variant.archivePath),
    verifier: JSON.parse(verifier),
    ...(freshArchiveCheck ? {freshArchiveCheck} : {}),
  }));
}

function childProcessTreePids(child) {
  if (!child?.pid || child.exitCode !== null) return new Set();
  const pids = new Set([child.pid]);
  const queue = [child.pid];
  while (queue.length > 0) {
    const parentPid = queue.shift();
    const result = spawnSync(
      '/usr/bin/pgrep',
      ['-P', String(parentPid)],
      {encoding: 'utf8'},
    );
    if (![0, 1].includes(result.status)) continue;
    for (const line of result.stdout.split('\n')) {
      const pid = Number(line.trim());
      if (!Number.isSafeInteger(pid) || pid <= 0 || pids.has(pid)) continue;
      pids.add(pid);
      queue.push(pid);
    }
  }
  return pids;
}

function childOwnsLoopbackListener(child, port) {
  if (!child?.pid || child.exitCode !== null) return false;
  const processTree = childProcessTreePids(child);
  const result = spawnSync(
    '/usr/sbin/lsof',
    [
      '-nP',
      `-iTCP:${port}`,
      '-sTCP:LISTEN',
      '-FpnT',
    ],
    {encoding: 'utf8'},
  );
  if (result.status !== 0) return false;
  let currentPid = null;
  const listeningPids = new Set();
  const matchingAddressPids = new Set();
  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('p')) {
      currentPid = Number(line.slice(1));
    } else if (line === 'TST=LISTEN') {
      listeningPids.add(currentPid);
    } else if (line === `n127.0.0.1:${port}`) {
      matchingAddressPids.add(currentPid);
    }
  }
  return [...processTree].some((pid) =>
    listeningPids.has(pid) && matchingAddressPids.has(pid)
  );
}

async function waitForOwnedLoopbackListener(child, port) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error('Packaged server exited before owning its smoke port.');
    }
    if (childOwnsLoopbackListener(child, port)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Spawned packaged server did not own 127.0.0.1:${port}.`,
  );
}

async function waitForUrl(url, child) {
  const port = Number(new URL(url).port);
  await waitForOwnedLoopbackListener(child, port);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error('Packaged server exited before smoke testing.');
    }
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        if (!childOwnsLoopbackListener(child, port)) {
          throw new Error(
            'Spawned packaged server lost ownership of its smoke port.',
          );
        }
        return {
          listenerOwnedBySpawnedChild: true,
          listenerVerification:
            'lsof-spawned-process-tree-loopback-listen-before-and-after-http',
        };
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export async function findAvailableLoopbackPort(excludedPorts = []) {
  const excluded = new Set(excludedPorts);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const server = createNetServer();
    const port = await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once('error', onError);
      server.listen(
        {host: '127.0.0.1', port: 0, exclusive: true},
        () => {
          server.off('error', onError);
          const address = server.address();
          if (!address || typeof address === 'string') {
            server.close();
            reject(new Error('Unable to allocate a loopback smoke port.'));
            return;
          }
          server.close((error) => {
            if (error) reject(error);
            else resolve(address.port);
          });
        },
      );
    });
    if (!excluded.has(port)) return port;
  }
  throw new Error('Unable to allocate a distinct loopback smoke port.');
}

async function stopChild(child) {
  if (!child?.pid) return;
  const processGroupId = child.pid;
  const signalProcessGroup = (signal) => {
    try {
      process.kill(-processGroupId, signal);
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
    }
  };
  const processGroupExists = () => {
    try {
      process.kill(-processGroupId, 0);
      return true;
    } catch (error) {
      if (error?.code === 'ESRCH') return false;
      throw error;
    }
  };
  signalProcessGroup('SIGTERM');
  if (child.exitCode === null) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  if (processGroupExists()) {
    signalProcessGroup('SIGKILL');
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!processGroupExists()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Packaged server process group ${processGroupId} survived SIGKILL.`,
  );
}

async function startPackagedServer(
  packageRoot,
  port,
  expectedPackageId = null,
) {
  const manifest = JSON.parse(
    await readFile(
      path.join(packageRoot, 'package-manifest.json'),
      'utf8',
    ),
  );
  if (expectedPackageId && manifest.packageId !== expectedPackageId) {
    throw new Error(
      `Fresh package identity mismatch: expected ${expectedPackageId}, found ${manifest.packageId}.`,
    );
  }
  const runtimeRoot = path.join(packageRoot, 'runtime');
  const serverEntry = manifest.entry.serverEntry.replace(/^runtime\//, '');
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    G4_L3_CEO_PREVIEW_ENABLED: '1',
    G4_L3_WHOLE_LESSON_PACKAGE: '1',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_1:
      manifest.packageId === 'g4-l3-whole-lesson-package-mvp-v3-1'
        ? '1'
        : '0',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_2:
      manifest.packageId.startsWith(
        'g4-l3-whole-lesson-package-mvp-v3-2',
      )
        ? '1'
        : '0',
    G4_L3_WHOLE_LESSON_PACKAGE_V3_3:
      manifest.packageId.startsWith(
        'g4-l3-whole-lesson-package-mvp-v3-3',
      )
        ? '1'
        : '0',
    NEXT_TELEMETRY_DISABLED: '1',
    HOSTNAME: '127.0.0.1',
    PORT: String(port),
  };
  delete environment.VERCEL_ENV;
  delete environment.G5_L4_CEO_PREVIEW_ENABLED;
  delete environment.G5_L4_WHOLE_LESSON_PACKAGE;
  const child = spawn(process.execPath, [serverEntry], {
    cwd: runtimeRoot,
    detached: true,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = [];
  child.stdout.on('data', (chunk) => log.push(chunk.toString()));
  child.stderr.on('data', (chunk) => log.push(chunk.toString()));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const listenerIdentity = await waitForUrl(
      `${baseUrl}/courses/4/3`,
      child,
    );
    return {
      baseUrl,
      child,
      log,
      manifest,
      runtimeRoot,
      listenerIdentity,
    };
  } catch (error) {
    await stopChild(child);
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n${log.join('')}`,
    );
  }
}

async function capturePage36OriginalCanvas(
  browser,
  baseUrl,
  relativePath,
  outputPath = path.join(WORKSPACE_ROOT, relativePath),
  monitor = null,
) {
  const page = await browser.newPage({
    viewport: {width: 1440, height: 1000},
    reducedMotion: 'reduce',
  });
  if (monitor) {
    const expectedOrigin = new URL(baseUrl).origin;
    page.on('console', (message) => {
      if (message.type() === 'error') {
        monitor.report.consoleErrors.push(
          `[${monitor.label}] ${message.text()}`,
        );
      }
    });
    page.on('pageerror', (error) => {
      monitor.report.pageErrors.push(`[${monitor.label}] ${error.message}`);
    });
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== expectedOrigin) {
        monitor.report.externalRequests.push(request.url());
      }
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        monitor.report.badHttpResponses.push({
          context: monitor.label,
          status: response.status(),
          url: response.url(),
        });
      }
    });
    page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? '';
      const requestUrl = new URL(request.url());
      if (
        failure === 'net::ERR_ABORTED'
        && requestUrl.searchParams.has('_rsc')
      ) return;
      monitor.report.failedRequests.push({
        context: monitor.label,
        url: request.url(),
        failure,
      });
    });
  }
  try {
    const route =
      `/animations/${TS008_ANIMATION_ID}`
      + '?frameDomain=sprite-350&frame=789'
      + '&scenario=source-static-frame&lang=en&seed=0';
    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: 'networkidle',
    });
    if (response?.status() !== 200) {
      throw new Error(`Page 36 deterministic route returned ${response?.status()}.`);
    }
    const canvas = page.locator(
      `canvas[data-course-canvas="${TS008_ANIMATION_ID}"]`,
    );
    await canvas.waitFor({state: 'attached', timeout: 15_000});
    await page.waitForFunction(
      (animationId) => {
        const target = document.querySelector(
          `canvas[data-course-canvas="${animationId}"]`,
        );
        return target?.getAttribute('data-flash-frame-domain')
            === 'sprite-350'
          && target?.getAttribute('data-flash-frame') === '789'
          && target?.getAttribute('data-render-state') === 'ready';
      },
      TS008_ANIMATION_ID,
    );
    const observation = await canvas.evaluate((target) => {
      const canvases = document.querySelectorAll(
        'canvas[data-course-canvas="course-g04-l03-ts-008"]',
      );
      return {
        canvasBackingSize: {
          width: target.width,
          height: target.height,
        },
        frame: Number(target.getAttribute('data-flash-frame')),
        frameDomain: target.getAttribute('data-flash-frame-domain'),
        runtimeCountInPlayer: canvases.length,
        pngDataUrl: target.toDataURL('image/png'),
      };
    });
    if (
      observation.canvasBackingSize.width !== 800
      || observation.canvasBackingSize.height !== 600
      || observation.frameDomain !== 'sprite-350'
      || observation.frame !== 789
      || observation.runtimeCountInPlayer !== 1
      || !observation.pngDataUrl.startsWith('data:image/png;base64,')
    ) {
      throw new Error(
        `Page 36 original canvas identity is invalid: ${JSON.stringify({
          ...observation,
          pngDataUrl: undefined,
        })}`,
      );
    }
    const png = Buffer.from(
      observation.pngDataUrl.slice('data:image/png;base64,'.length),
      'base64',
    );
    await mkdir(path.dirname(outputPath), {recursive: true});
    await writeFile(outputPath, png);
    return {
      canvasBackingSize: observation.canvasBackingSize,
      frame: observation.frame,
      frameDomain: observation.frameDomain,
      route,
      runtimeCountInPlayer: observation.runtimeCountInPlayer,
      screenshot: buildSmokeScreenshotBinding(relativePath, png),
      png,
    };
  } finally {
    await page.close();
  }
}

async function compareDecodedRgba(leftPng, rightPng) {
  const {default: sharp} = await import('sharp');
  const [left, right] = await Promise.all([
    sharp(leftPng).ensureAlpha().raw().toBuffer({resolveWithObject: true}),
    sharp(rightPng).ensureAlpha().raw().toBuffer({resolveWithObject: true}),
  ]);
  if (
    left.info.width !== 800
    || left.info.height !== 600
    || left.info.channels !== 4
    || right.info.width !== 800
    || right.info.height !== 600
    || right.info.channels !== 4
    || left.data.length !== right.data.length
  ) {
    throw new Error('Page 36 decoded RGBA dimensions are not 800x600x4.');
  }
  let channelDifferenceCount = 0;
  let pixelDifferenceCount = 0;
  for (let offset = 0; offset < left.data.length; offset += 4) {
    let pixelDiffers = false;
    for (let channel = 0; channel < 4; channel += 1) {
      if (left.data[offset + channel] !== right.data[offset + channel]) {
        channelDifferenceCount += 1;
        pixelDiffers = true;
      }
    }
    if (pixelDiffers) pixelDifferenceCount += 1;
  }
  return {
    decodedWidth: left.info.width,
    decodedHeight: left.info.height,
    decodedChannels: left.info.channels,
    candidateRgbaSha256: sha256(left.data),
    frozenV2RgbaSha256: sha256(right.data),
    channelDifferenceCount,
    pixelDifferenceCount,
  };
}

async function captureFrozenV2Page36Parity(
  browser,
  variant,
  candidateBaseUrl,
  frozenV2BaseUrl,
  screenshotRoot,
  candidateWholeLessonObservation,
  physicalScreenshotRoot = path.join(WORKSPACE_ROOT, screenshotRoot),
  report = null,
) {
  const candidateKey = variant.page36CandidateKey
    ?? (variant.version === 'v3-1' ? 'v31' : 'v3');
  const candidateFilename =
    `page-36-${variant.version}-original-stage-sprite-350-frame-789.png`;
  const frozenV2Filename =
    'page-36-frozen-v2-original-stage-sprite-350-frame-789.png';
  const [candidate, frozenV2] = await Promise.all([
    capturePage36OriginalCanvas(
      browser,
      candidateBaseUrl,
      `${screenshotRoot}/${candidateFilename}`,
      path.join(physicalScreenshotRoot, candidateFilename),
      report ? {report, label: `${variant.version}-page36-candidate`} : null,
    ),
    capturePage36OriginalCanvas(
      browser,
      frozenV2BaseUrl,
      `${screenshotRoot}/${frozenV2Filename}`,
      path.join(physicalScreenshotRoot, frozenV2Filename),
      report ? {report, label: 'frozen-v2-page36-reference'} : null,
    ),
  ]);
  const pixelComparison = await compareDecodedRgba(
    candidate.png,
    frozenV2.png,
  );
  if (
    pixelComparison.pixelDifferenceCount !== 0
    || pixelComparison.channelDifferenceCount !== 0
    || pixelComparison.candidateRgbaSha256
      !== pixelComparison.frozenV2RgbaSha256
  ) {
    throw new Error(
      `Page 36 ${variant.version} original stage drifted from frozen v2: ${JSON.stringify(pixelComparison)}`,
    );
  }
  const candidateObservation = {
    deterministicRoute: candidate.route,
    runtimeCountInPlayer: candidate.runtimeCountInPlayer,
    screenshot: candidate.screenshot,
  };
  const comparisonTopology = {
    candidateVersion: variant.version,
    candidateLoopbackPort: Number(new URL(candidateBaseUrl).port),
    frozenV2LoopbackPort: Number(new URL(frozenV2BaseUrl).port),
    secondRuntimeInCandidatePlayerDom:
      candidateWholeLessonObservation.runtimeStageCount !== 1
      || candidateWholeLessonObservation.primaryRuntimeCount !== 1,
    candidateWholeLessonObservation,
    ...(variant.version === 'v3'
      ? {
          v3LoopbackPort: Number(new URL(candidateBaseUrl).port),
          secondRuntimeInV3PlayerDom:
            candidateWholeLessonObservation.runtimeStageCount !== 1
            || candidateWholeLessonObservation.primaryRuntimeCount !== 1,
          v3WholeLessonObservation: candidateWholeLessonObservation,
        }
      : {}),
  };
  return {
    method:
      `fresh-extracted-${variant.version}-and-frozen-v2-distinct-loopback-servers; canvas backing PNG decoded to RGBA`,
    candidateVersion: variant.version,
    comparisonTopology,
    pageOrdinal: 36,
    animationId: TS008_ANIMATION_ID,
    frameDomain: 'sprite-350',
    frame: 789,
    canvasBackingSize: {width: 800, height: 600},
    candidate: candidateObservation,
    [candidateKey]: candidateObservation,
    frozenV2: {
      deterministicRoute: frozenV2.route,
      runtimeCountInPlayer: frozenV2.runtimeCountInPlayer,
      screenshot: frozenV2.screenshot,
    },
    ...pixelComparison,
    ...(variant.version === 'v3'
      ? {v3RgbaSha256: pixelComparison.candidateRgbaSha256}
      : {}),
  };
}

export class PackageSmokeValidationError extends Error {
  constructor(message, report) {
    super(message);
    this.name = 'PackageSmokeValidationError';
    this.report = structuredClone(report);
  }
}

export function evaluateKeyTermsFocusRestoration(observation) {
  const normalized = {
    tag: observation?.tag ?? null,
    responsiveKey: observation?.responsiveKey ?? null,
    sourceKey: observation?.sourceKey ?? null,
    samePlayer: observation?.samePlayer === true,
    connected: observation?.connected === true,
    visible: observation?.visible === true,
    disabled: observation?.disabled === true,
    hidden: observation?.hidden === true,
    inert: observation?.inert === true,
  };
  const predicateVector = {
    tagIsButton: normalized.tag === 'BUTTON',
    responsiveKeyIsKeyTerms: normalized.responsiveKey === 'key-terms',
    samePlayer: normalized.samePlayer,
    connected: normalized.connected,
    visible: normalized.visible,
    enabled: normalized.disabled === false,
    notHidden: normalized.hidden === false,
    notInert: normalized.inert === false,
  };
  return {
    focusRestorationMode: KEY_TERMS_FOCUS_RESTORATION_MODE,
    ...normalized,
    predicateVector,
    passed: Object.values(predicateVector).every((value) => value === true),
  };
}

export async function smokePackageAt(
  variant,
  packageRoot,
  smokeContext = {},
  frozenV2PackageRoot = null,
  evidencePaths = {},
) {
  const manifest = JSON.parse(
    await readFile(
      path.join(packageRoot, 'package-manifest.json'),
      'utf8',
    ),
  );
  const runtimeRoot = path.join(packageRoot, 'runtime');
  const finalScreenshotRootRelative = path.dirname(
    variant.smokeScreenshotRelative,
  );
  const physicalScreenshotRoot = evidencePaths.screenshotRoot
    ?? path.dirname(variant.smokeScreenshotPath);
  const physicalSmokeScreenshotPath = path.join(
    physicalScreenshotRoot,
    path.basename(variant.smokeScreenshotPath),
  );
  const reportPath = evidencePaths.reportPath ?? variant.smokeReportPath;
  const physicalScreenshotPathFor = (relativePath) => path.join(
    physicalScreenshotRoot,
    path.relative(finalScreenshotRootRelative, relativePath),
  );
  const port = await findAvailableLoopbackPort([3216, 3217, 3218, 3219]);
  const baseUrl = `http://127.0.0.1:${port}`;
  const environment = {
    ...process.env,
    HELP_MATH_PACKAGE_NO_OPEN: '1',
  };
  delete environment.VERCEL_ENV;
  const serverEntry = manifest.entry.serverEntry.replace(/^runtime\//, '');
  const server = spawn(
    process.execPath,
    ['start.mjs', '--port', String(port)],
    {
      cwd: packageRoot,
      detached: true,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const serverLog = [];
  server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
  server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));
  let frozenV2Server = null;
  const smokeVerifierImplementation =
    variant.smokeVerifierImplementation ?? 'primary-package-builder';
  const correctedCompactSmokeHarness =
    variant.correctedCompactSmokeHarness === true;
  const report = {
    schemaVersion: 1,
    reportType: 'g4-l3-whole-lesson-package-smoke',
    packageId: manifest.packageId,
    packageManifestSha256: await sha256File(
      path.join(packageRoot, 'package-manifest.json'),
    ),
    baseUrl,
    pagesExpected: 39,
    pagesRendered: 0,
    audioUrlsChecked: 0,
    failures: [],
    consoleErrors: [],
    pageErrors: [],
    badHttpResponses: [],
    failedRequests: [],
    externalRequests: [],
    runtimeObservations: [],
    authority: manifest.authority,
    serverIdentity: {
      packageId: manifest.packageId,
      buildId: manifest.build?.buildId,
      manifestSha256: await sha256File(
        path.join(packageRoot, 'package-manifest.json'),
      ),
      loopbackPort: port,
      portAllocation: 'ephemeral-exclusive-loopback-preflight',
      serverEntry: manifest.entry.serverEntry,
      launcherEntry: 'start.mjs',
      launchCommand: `node start.mjs --port ${port}`,
    },
    smokeVerifier: {
      implementation: smokeVerifierImplementation,
      postbuildCorrectionUsed: false,
      functionalEntrySelectorIncluded: true,
      keyTermsResolution: 'matched-local-entry',
      ...(variant.keyTermsFocusRestorationMode
        ? {
            keyTermsFocusRestorationMode:
              variant.keyTermsFocusRestorationMode,
            keyTermsFocusRestorationSelector:
              'button[data-responsive-focus-key="key-terms"]',
            arbitraryVisibleElementAccepted: false,
          }
        : {}),
      ...(correctedCompactSmokeHarness ? {
        compactRootSelector: 'main.lesson-shell2',
        compactPageSelectionMechanism: 'visible-course-map-row',
        browserProfileIsolation:
          'resolved-resume-state-before-each-compact-scenario',
        resumeDecisionBeforeGeometry: 'resolved',
        sessionDecisionOverlayBeforeGeometry: 'closed',
      } : {}),
      strictAcceptanceEffect: 'none',
    },
    ...smokeContext,
  };
  try {
    report.privacyScan = await scanPackagePrivacy(packageRoot);
    Object.assign(
      report.serverIdentity,
      await waitForUrl(`${baseUrl}/courses/4/3`, server),
    );
    if (variant.requireFrozenV2Page36Parity) {
      if (!frozenV2PackageRoot) {
        throw new Error(
          'The v3 smoke requires a fresh-extracted frozen v2 package.',
        );
      }
      const frozenV2Port = await findAvailableLoopbackPort([
        port,
        3216,
        3217,
        3218,
        3219,
      ]);
      frozenV2Server = await startPackagedServer(
        frozenV2PackageRoot,
        frozenV2Port,
        'g4-l3-whole-lesson-package-mvp-v2',
      );
      report.frozenV2PackageManifestSha256 = await sha256File(
        path.join(frozenV2PackageRoot, 'package-manifest.json'),
      );
      report.frozenV2ServerIdentity = {
        packageId: frozenV2Server.manifest.packageId,
        manifestSha256: report.frozenV2PackageManifestSha256,
        loopbackPort: frozenV2Port,
        ...frozenV2Server.listenerIdentity,
      };
    }
    const {chromium} = await import('playwright');
    const browser = await chromium.launch({headless: true});
    try {
      const page = await browser.newPage({
        viewport: {width: 1440, height: 1000},
        reducedMotion: 'reduce',
      });
      page.on('console', (message) => {
        if (message.type() === 'error') report.consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => report.pageErrors.push(error.message));
      page.on('request', (request) => {
        const requestUrl = new URL(request.url());
        if (requestUrl.origin !== new URL(baseUrl).origin) {
          report.externalRequests.push(request.url());
        }
      });
      page.on('response', (browserResponse) => {
        if (browserResponse.status() >= 400) {
          report.badHttpResponses.push({
            status: browserResponse.status(),
            url: browserResponse.url(),
          });
        }
      });
      page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText ?? '';
        const requestUrl = new URL(request.url());
        if (
          failure === 'net::ERR_ABORTED'
          && requestUrl.searchParams.has('_rsc')
        ) {
          return;
        }
        report.failedRequests.push({
          url: request.url(),
          failure,
        });
        report.failures.push(
          `requestfailed ${request.url()} ${failure}`,
        );
      });
      const response = await page.goto(`${baseUrl}/courses/4/3`, {
        waitUntil: 'networkidle',
      });
      if (response?.status() !== 200) {
        report.failures.push(`entry status ${response?.status()}`);
      }
      await page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]').waitFor();
      await page.locator('[data-controlled-ceo-preview="g4-l3"]').waitFor();
      const picker = page.locator(
        'select[aria-label="Go to a lesson page"]',
      );
      const options = await picker.locator('option').evaluateAll((nodes) =>
        nodes.map((node) => node.value)
      );
      const expectedPageIds = manifest.members
        .filter(({releaseRole}) => releaseRole === 'active-xml-referenced-page')
        .sort((left, right) => left.ordinal - right.ordinal)
        .map(({animationId}) => animationId);
      const mapRows = await page.locator(
        '.lesson-shell2__map-content button[data-animation-id]',
      ).evaluateAll((buttons) => buttons.map((button) => ({
        animationId: button.getAttribute('data-animation-id'),
        ordinal: Number(button.getAttribute('data-global-page-ordinal')),
        sectionCode: button.getAttribute('data-section-code'),
        spanishTitleStatus:
          button.getAttribute('data-spanish-title-status'),
      })));
      const exactPickerOrder =
        options.length === 39
        && new Set(options).size === 39
        && JSON.stringify(options) === JSON.stringify(expectedPageIds);
      const exactMapRows =
        mapRows.length === 39
        && new Set(mapRows.map(({animationId}) => animationId)).size === 39
        && JSON.stringify(mapRows.map(({animationId}) => animationId))
          === JSON.stringify(expectedPageIds)
        && mapRows.every((row, index) =>
          row.ordinal === index + 1
          && typeof row.sectionCode === 'string'
          && row.sectionCode.length > 0
          && typeof row.spanishTitleStatus === 'string'
          && row.spanishTitleStatus.length > 0
        );
      report.pageTraversal = {
        animationIds: options,
        animationIdsSha256: sha256(Buffer.from(options.join('\n'))),
        exactManifestOrder: exactPickerOrder,
        uniquePickerAnimationIds: new Set(options).size,
        realCourseMapRows: mapRows,
        exactRealCourseMap: exactMapRows,
      };
      if (options.length !== 39) {
        report.failures.push(`page picker contains ${options.length} options`);
      }
      if (!exactPickerOrder) {
        report.failures.push(
          'page picker IDs are not the exact ordered 39-member manifest set',
        );
      }
      if (!exactMapRows) {
        report.failures.push(
          'Course Map is not the exact stable 39-row manifest projection',
        );
      }
      const waitForCurrentAnimation = async (animationId) => {
        await page.waitForFunction(
          ({expectedId}) => {
            const player = document.querySelector(
              '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
            );
            const stages = player?.querySelectorAll('.runtime-stage') ?? [];
            return player?.getAttribute('data-current-animation-id')
                === expectedId
              && stages.length === 1
              && stages[0]?.getAttribute('data-animation-id') === expectedId;
          },
          {expectedId: animationId},
          {timeout: 45_000},
        );
        await page.locator(
          `.runtime-stage[data-animation-id="${animationId}"]`,
        ).waitFor({state: 'visible', timeout: 45_000});
      };
      const inspectCompactLandscape = async ({
        locale,
        expectedBadgeCopy,
        includeCompanionPages = false,
      }) => {
        const stableBox = async (locator) => {
          let previous = null;
          let stableSamples = 0;
          for (let attempt = 0; attempt < 12; attempt += 1) {
            const current = await locator.evaluate((element) =>
              new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  const bounds = element.getBoundingClientRect();
                  resolve({
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                  });
                }));
              })
            );
            const settled = previous
              && Object.keys(current).every((key) =>
                Math.abs(current[key] - previous[key]) <= 0.5
              );
            stableSamples = settled ? stableSamples + 1 : 0;
            if (stableSamples >= 3) return current;
            previous = current;
          }
          throw new Error(
            `${locale} compact landscape geometry did not settle.`,
          );
        };
        const pathname = locale === 'es'
          ? '/es/courses/4/3'
          : '/courses/4/3';
        await page.setViewportSize({width: 844, height: 390});
        const compactResponse = await page.goto(`${baseUrl}${pathname}`, {
          waitUntil: 'networkidle',
        });
        if (compactResponse?.status() !== 200) {
          throw new Error(
            `${locale} compact landscape returned ${compactResponse?.status()}.`,
          );
        }
        const player = page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
        );
        await player.waitFor({state: 'visible', timeout: 45_000});
        await page.waitForFunction(() => {
          const host = document.querySelector(
            '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
          );
          const decision = host?.getAttribute('data-resume-decision');
          return decision === 'prompt' || decision === 'resolved';
        }, null, {timeout: 45_000});
        if (await player.getAttribute('data-resume-decision') === 'prompt') {
          await player.locator(
            '[data-resume-choice="beginning"]:visible',
          ).click();
        }
        await page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]'
          + '[data-hydrated="true"]'
          + '[data-resume-decision="resolved"]',
        ).waitFor({state: 'visible', timeout: 45_000});
        const root = player.locator('main.lesson-shell2');
        await root.waitFor({state: 'visible', timeout: 45_000});
        await page.waitForFunction(() => {
          const shell = document.querySelector('main.lesson-shell2');
          return shell?.getAttribute('data-stage-render-mode') !== 'measuring'
            && shell?.getAttribute('data-session-decision-overlay') === 'closed'
            && shell?.getAttribute('data-session-decision-kind') === 'none';
        }, null, {timeout: 45_000});
        await waitForCurrentAnimation(options[0]);
        const goToCompactPage = async (animationId) => {
          if (
            await player.getAttribute('data-current-animation-id')
              === animationId
          ) {
            return {
              animationId,
              selectionMechanism: 'resolved-start-at-beginning',
              mapClosedAfterSelection:
                await root.getAttribute('data-map-open') === 'false',
            };
          }
          const mapTrigger = root.locator(
            '.lesson-shell2__modern-toolbar '
            + 'button[data-course-map-trigger="modern-accessible-control"]',
          );
          await mapTrigger.click();
          await page.waitForFunction(() =>
            document.querySelector('main.lesson-shell2')
              ?.getAttribute('data-map-open') === 'true'
          );
          const mapRow = root.locator(
            `.lesson-shell2__map-content button[data-animation-id="${animationId}"]`,
          );
          await mapRow.waitFor({state: 'visible', timeout: 45_000});
          const mapIdentity = await mapRow.evaluate((button) => ({
            animationId: button.getAttribute('data-animation-id'),
            ordinal: Number(button.getAttribute('data-global-page-ordinal')),
            sectionCode: button.getAttribute('data-section-code'),
            spanishTitleStatus:
              button.getAttribute('data-spanish-title-status'),
          }));
          await mapRow.click();
          await waitForCurrentAnimation(animationId);
          await page.waitForFunction((expectedId) => {
            const shell = document.querySelector('main.lesson-shell2');
            return shell?.getAttribute('data-current-animation-id')
                === expectedId
              && shell?.getAttribute('data-map-open') === 'false';
          }, animationId, {timeout: 45_000});
          return {
            ...mapIdentity,
            selectionMechanism: 'visible-course-map-row',
            mapClosedAfterSelection: true,
          };
        };
        const initialSelection = await goToCompactPage(options[0]);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await Promise.all([
          stableBox(root.locator('.lesson-shell2__legacy-stage')),
          stableBox(root.locator('.lesson-shell2__modern-toolbar')),
          stableBox(root.locator('.lesson-shell2__learning-actions')),
        ]);
        const profileState = await player.evaluate((host) => ({
          hydrated: host.getAttribute('data-hydrated'),
          resumeDecision: host.getAttribute('data-resume-decision'),
          sessionDecisionOverlay: host.querySelector('main.lesson-shell2')
            ?.getAttribute('data-session-decision-overlay'),
          sessionDecisionKind: host.querySelector('main.lesson-shell2')
            ?.getAttribute('data-session-decision-kind'),
        }));
        const observation = await root.evaluate((player, expectedCopy) => {
          const visible = (element) => {
            if (!element) return false;
            const bounds = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return bounds.width > 0
              && bounds.height > 0
              && style.display !== 'none'
              && style.visibility !== 'hidden';
          };
          const rect = (element) => {
            const bounds = element.getBoundingClientRect();
            return {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              right: bounds.right,
              bottom: bounds.bottom,
            };
          };
          const toolbar = player.querySelector(
            '.lesson-shell2__modern-toolbar',
          );
          const stage = player.querySelector('.lesson-shell2__legacy-stage');
          const actions = player.querySelector(
            '.lesson-shell2__learning-actions',
          );
          const badge = player.querySelector(
            '[data-compact-transport-summary="true"]',
          );
          const describedBy = toolbar?.getAttribute('aria-describedby') ?? '';
          const boundary = describedBy
            ? document.getElementById(describedBy)
            : null;
          const toolbarStyle = toolbar ? getComputedStyle(toolbar) : null;
          const boundaryStyle = boundary ? getComputedStyle(boundary) : null;
          const visibleToolbarChildren = toolbar
            ? [...toolbar.children].filter(visible)
            : [];
          const rowTops = [];
          for (const child of visibleToolbarChildren) {
            const top = child.getBoundingClientRect().top;
            if (!rowTops.some((candidate) => Math.abs(candidate - top) <= 1)) {
              rowTops.push(top);
            }
          }
          const targetElements = [
            ...(toolbar?.querySelectorAll('button, a, label') ?? []),
            ...(actions?.querySelectorAll(':scope > button') ?? []),
          ].filter(visible);
          const targetRects = targetElements.map((element) => ({
            key:
              element.getAttribute('data-responsive-focus-key')
              ?? element.textContent?.trim().slice(0, 40)
              ?? element.tagName,
            ...rect(element),
          }));
          const actionRects = actions
            ? [...actions.children].filter(visible).map(rect)
            : [];
          const sameActionRow = actionRects.length === 3
            && actionRects.every(
              ({y}) => Math.abs(y - actionRects[0].y) <= 1,
            );
          const stageRect = stage ? rect(stage) : null;
          const toolbarRect = toolbar ? rect(toolbar) : null;
          const actionsRect = actions ? rect(actions) : null;
          const viewportWidth = document.documentElement.clientWidth;
          const viewportHeight = document.documentElement.clientHeight;
          const horizontalOverflowPx = Math.max(
            0,
            document.documentElement.scrollWidth - viewportWidth,
            document.body.scrollWidth - viewportWidth,
          );
          return {
            root: {
              layoutMode: player.getAttribute('data-layout-mode'),
              layoutDensity: player.getAttribute('data-layout-density'),
              mapPresentation: player.getAttribute('data-map-presentation'),
              toolPresentation: player.getAttribute('data-tool-presentation'),
              stageRenderMode: player.getAttribute('data-stage-render-mode'),
            },
            toolbar: {
              columns: toolbarStyle?.gridTemplateColumns
                .split(/\s+/).filter(Boolean).length ?? 0,
              rows: rowTops.length,
              describedBy,
              bounds: toolbarRect,
            },
            badge: {
              visible: visible(badge),
              text: badge?.textContent?.trim() ?? '',
              exactCopy: badge?.textContent?.trim() === expectedCopy,
              ariaHidden: badge?.getAttribute('aria-hidden'),
            },
            fullTransportBoundary: {
              present: Boolean(boundary),
              textLength: boundary?.textContent?.trim().length ?? 0,
              ariaHidden: boundary?.getAttribute('aria-hidden'),
              display: boundaryStyle?.display ?? null,
              visibility: boundaryStyle?.visibility ?? null,
              position: boundaryStyle?.position ?? null,
              clipPath: boundaryStyle?.clipPath ?? null,
              width: boundary ? boundary.getBoundingClientRect().width : 0,
              height: boundary ? boundary.getBoundingClientRect().height : 0,
            },
            stage: stageRect,
            actions: {
              bounds: actionsRect,
              count: actionRects.length,
              sameRow: sameActionRow,
              rows: actionRects,
            },
            targets: {
              count: targetRects.length,
              minimumWidth: Math.min(...targetRects.map(({width}) => width)),
              minimumHeight: Math.min(...targetRects.map(({height}) => height)),
              allWithinViewport: targetRects.every(({x, y, right, bottom}) =>
                x >= -1 && y >= -1
                && right <= viewportWidth + 1
                && bottom <= viewportHeight + 1
              ),
              rows: targetRects,
            },
            horizontalOverflowPx,
            runtimeCount: player.querySelectorAll('.runtime-stage').length,
            primaryRuntimeCount: [...player.querySelectorAll('.runtime-stage')]
              .filter(visible).length,
            viewport: {width: viewportWidth, height: viewportHeight},
          };
        }, expectedBadgeCopy);
        observation.profileState = profileState;
        observation.initialSelection = initialSelection;
        const compactPassed =
          observation.profileState.hydrated === 'true'
          && observation.profileState.resumeDecision === 'resolved'
          && observation.profileState.sessionDecisionOverlay === 'closed'
          && observation.profileState.sessionDecisionKind === 'none'
          && observation.initialSelection.animationId === options[0]
          && observation.initialSelection.mapClosedAfterSelection === true
          && observation.root.layoutMode === 'compact'
          && observation.root.layoutDensity === 'comfortable'
          && observation.root.mapPresentation === 'overlay'
          && observation.root.toolPresentation === 'overlay'
          && observation.root.stageRenderMode === 'proportional-scale'
          && observation.toolbar.columns === 4
          && observation.toolbar.rows === 6
          && /-transport-boundary$/.test(observation.toolbar.describedBy)
          && observation.badge.visible
          && observation.badge.exactCopy
          && observation.badge.ariaHidden === 'true'
          && observation.fullTransportBoundary.present
          && observation.fullTransportBoundary.textLength >= 100
          && observation.fullTransportBoundary.ariaHidden === null
          && observation.fullTransportBoundary.display !== 'none'
          && observation.fullTransportBoundary.visibility !== 'hidden'
          && observation.fullTransportBoundary.position === 'absolute'
          && observation.fullTransportBoundary.width <= 1
          && observation.fullTransportBoundary.height <= 1
          && observation.stage
          && Math.abs(
            observation.stage.width / observation.stage.height - (4 / 3),
          ) <= 0.02
          && observation.stage.right <= observation.toolbar.bounds.x + 1
          && observation.toolbar.bounds.right <= 845
          && observation.toolbar.bounds.bottom <= 391
          && observation.actions.bounds.bottom <= 391
          && observation.actions.count === 3
          && observation.actions.sameRow
          && observation.targets.count >= 12
          && observation.targets.minimumWidth >= 43.5
          && observation.targets.minimumHeight >= 43.5
          && observation.targets.allWithinViewport
          && observation.horizontalOverflowPx <= 1
          && observation.runtimeCount === 1
          && observation.primaryRuntimeCount === 1;
        const filename = `${locale}-compact-landscape-844x390.png`;
        const relativePath = `${finalScreenshotRootRelative}/${filename}`;
        const absolutePath = physicalScreenshotPathFor(relativePath);
        await mkdir(path.dirname(absolutePath), {recursive: true});
        await page.screenshot({path: absolutePath});
        const screenshot = buildSmokeScreenshotBinding(
          relativePath,
          await readFile(absolutePath),
        );
        const companionPages = [];
        if (includeCompanionPages) {
          for (const animationId of [
            'course-g04-l03-fq-002',
            'course-g04-l03-fq-003',
          ]) {
            const selection = await goToCompactPage(animationId);
            await page.waitForFunction(() => {
              const host = document.querySelector(
                '[data-page-interaction-companion-host="true"]',
              );
              return Boolean(host && host.childElementCount > 0);
            }, null, {timeout: 45_000});
            await Promise.all([
              stableBox(root.locator('.lesson-shell2__legacy-stage')),
              stableBox(root.locator('.lesson-shell2__modern-toolbar')),
              stableBox(root.locator('.lesson-shell2__learning-actions')),
            ]);
            const companion = await root.evaluate((player, expectedId) => {
              const host = player.querySelector(
                '[data-page-interaction-companion-host="true"]',
              );
              const viewportWidth = document.documentElement.clientWidth;
              return {
                animationId: expectedId,
                currentAnimationId:
                  player.getAttribute('data-current-animation-id'),
                hostPresent: Boolean(host),
                hostChildCount: host?.childElementCount ?? 0,
                runtimeCount: player.querySelectorAll('.runtime-stage').length,
                horizontalOverflowPx: Math.max(
                  0,
                  document.documentElement.scrollWidth - viewportWidth,
                  document.body.scrollWidth - viewportWidth,
                ),
              };
            }, animationId);
            const companionPassed =
              selection.animationId === animationId
              && Number.isSafeInteger(selection.ordinal)
              && selection.ordinal > 0
              && typeof selection.sectionCode === 'string'
              && selection.sectionCode.length > 0
              && typeof selection.spanishTitleStatus === 'string'
              && selection.spanishTitleStatus.length > 0
              && selection.selectionMechanism === 'visible-course-map-row'
              && selection.mapClosedAfterSelection === true
              && companion.currentAnimationId === animationId
              && companion.hostPresent
              && companion.hostChildCount > 0
              && companion.runtimeCount === 1
              && companion.horizontalOverflowPx <= 1;
            const companionFilename =
              `${animationId}-compact-landscape-companion.png`;
            const companionRelative =
              `${finalScreenshotRootRelative}/${companionFilename}`;
            const companionAbsolute =
              physicalScreenshotPathFor(companionRelative);
            await page.screenshot({path: companionAbsolute});
            companionPages.push({
              ...companion,
              selection,
              passed: companionPassed,
              screenshot: buildSmokeScreenshotBinding(
                companionRelative,
                await readFile(companionAbsolute),
              ),
            });
          }
        }
        const normalSelection = await goToCompactPage(options[0]);
        await page.setViewportSize({width: 1440, height: 1000});
        await root.waitFor({state: 'visible', timeout: 45_000});
        await page.waitForFunction(() =>
          document.querySelector('main.lesson-shell2')
            ?.getAttribute('data-stage-render-mode') !== 'measuring'
        );
        await page.evaluate(() => document.fonts.ready);
        await Promise.all([
          stableBox(root.locator('.lesson-shell2__legacy-stage')),
          stableBox(root.locator('.lesson-shell2__modern-toolbar')),
          stableBox(root.locator('.lesson-shell2__learning-actions')),
        ]);
        const normalDisclosure = await root.evaluate((player) => {
          const toolbar = player.querySelector(
            '.lesson-shell2__modern-toolbar',
          );
          const boundaryId = toolbar?.getAttribute('aria-describedby') ?? '';
          const boundary = boundaryId
            ? document.getElementById(boundaryId)
            : null;
          const bounds = boundary?.getBoundingClientRect();
          const style = boundary ? getComputedStyle(boundary) : null;
          return {
            present: Boolean(boundary),
            visible: Boolean(
              boundary && bounds && bounds.width > 1 && bounds.height > 1
              && style?.display !== 'none'
              && style?.visibility !== 'hidden'
            ),
            position: style?.position ?? null,
            textLength: boundary?.textContent?.trim().length ?? 0,
          };
        });
        const passed = compactPassed
          && normalDisclosure.present
          && normalDisclosure.visible
          && normalDisclosure.position !== 'absolute'
          && normalDisclosure.textLength >= 100
          && companionPages.every(({passed: rowPassed}) => rowPassed);
        if (!passed) {
          report.failures.push(
            `${locale} compact landscape contract failed ${JSON.stringify({
              observation,
              normalDisclosure,
              companionPages,
            })}`,
          );
        }
        return {
          locale,
          ...observation,
          normalDisclosure,
          normalSelection,
          companionPages,
          screenshot,
          passed,
        };
      };
      for (const animationId of options) {
        await picker.selectOption(animationId);
        const stage = page.locator(
          `.runtime-stage[data-animation-id="${animationId}"]`,
        );
        await stage.waitFor({state: 'visible', timeout: 15_000});
        await page.waitForFunction(
          (id) => {
            const target = document.querySelector(
              `.runtime-stage[data-animation-id="${id}"]`,
            );
            return target && !target.closest('.runtime-shell')?.textContent?.includes('Loading');
          },
          animationId,
        );
        const runtimeObservation = await page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
        ).evaluate((player, expectedAnimationId) => {
          const runtimeShells = [...player.querySelectorAll('.runtime-shell')];
          const runtimeStages = [...player.querySelectorAll('.runtime-stage')];
          const primaryRuntimeCount = runtimeStages.filter((candidate) => {
            const rectangle = candidate.getBoundingClientRect();
            const style = getComputedStyle(candidate);
            return rectangle.width > 0
              && rectangle.height > 0
              && style.display !== 'none'
              && style.visibility !== 'hidden';
          }).length;
          return {
            animationId: expectedAnimationId,
            playerAnimationId:
              player.getAttribute('data-current-animation-id'),
            runtimeShellCount: runtimeShells.length,
            runtimeStageCount: runtimeStages.length,
            primaryRuntimeCount,
            runtimeAnimationIds: runtimeStages.map(
              (candidate) => candidate.getAttribute('data-animation-id'),
            ),
          };
        }, animationId);
        const exactSingleRuntime =
          runtimeObservation.playerAnimationId === animationId
          && runtimeObservation.runtimeShellCount === 1
          && runtimeObservation.runtimeStageCount === 1
          && runtimeObservation.primaryRuntimeCount === 1
          && runtimeObservation.runtimeAnimationIds.length === 1
          && runtimeObservation.runtimeAnimationIds[0] === animationId;
        report.runtimeObservations.push({
          ...runtimeObservation,
          exactSingleRuntime,
        });
        if (!exactSingleRuntime) {
          report.failures.push(
            `primary runtime mismatch ${JSON.stringify(runtimeObservation)}`,
          );
        }
        report.pagesRendered += 1;
      }
      if (variant.version === 'v3-1'
          || variant.advancedSuccessorSmokeChecks === true) {
        await picker.selectOption(TS008_ANIMATION_ID);
        await waitForCurrentAnimation(TS008_ANIMATION_ID);
        const readableView = page.locator(
          '[data-modern-enhancement="source-bound-readable-view"]',
        );
        await readableView.waitFor({state: 'visible', timeout: 45_000});
        const toggle = readableView.locator('[data-readable-view-toggle]');
        const initialReadableView = await readableView.evaluate((element) => {
          const transcripts = [...element.querySelectorAll(
            '[data-readable-transcript]',
          )];
          const images = [...element.querySelectorAll('img')];
          return {
            animationId: element.getAttribute('data-animation-id'),
            sourceSwfSha256:
              element.getAttribute('data-source-swf-sha256'),
            frameDomain: element.getAttribute('data-frame-domain'),
            sourceFrame: Number(element.getAttribute('data-source-frame')),
            defaultExpanded:
              element.getAttribute('data-default-expanded') === 'true',
            originalLayoutPreserved:
              element.getAttribute('data-original-layout-preserved') === 'true',
            strictAcceptanceEffect:
              element.getAttribute('data-strict-acceptance-effect'),
            expanded:
              element.querySelector('[data-readable-view-toggle]')
                ?.getAttribute('aria-expanded') === 'true',
            contentCount:
              element.querySelectorAll('.g4-l3-readable-view__content').length,
            transcriptCount: transcripts.length,
            transcriptLanguages:
              transcripts.map((item) => item.getAttribute('lang')),
            transcriptHashes: transcripts.map(
              (item) => item.getAttribute('data-transcript-sha256'),
            ),
            transcriptPayloads: transcripts.map((item) =>
              [...item.querySelectorAll('p')]
                .map((line) => (line.textContent ?? '').trim())
                .join('\n')
            ),
            minimumTranscriptFontSizePx: Math.min(
              ...transcripts.map(
                (item) => Number.parseFloat(getComputedStyle(item).fontSize),
              ),
            ),
            transcriptTextLength: transcripts.reduce(
              (total, item) => total + (item.textContent ?? '').trim().length,
              0,
            ),
            imageCount: images.length,
            loadedImageCount: images.filter(
              (image) => image.complete && image.naturalWidth > 0,
            ).length,
            cropHashes: [...element.querySelectorAll(
              '[data-readable-crop-sha256]',
            )].map((item) => item.getAttribute('data-readable-crop-sha256')),
            liveRuntimeCount: element.closest(
              '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
            )?.querySelectorAll('.runtime-stage').length ?? 0,
          };
        });
        const expectedTranscriptHashes = manifest.readabilityEnhancements
          ?.crops?.map(({transcriptSha256}) => transcriptSha256) ?? [];
        const expectedCropHashes = manifest.readabilityEnhancements
          ?.crops?.map(({asset}) => asset.sha256) ?? [];
        const renderedTranscriptHashes =
          initialReadableView.transcriptPayloads.map((payload) =>
            sha256(Buffer.from(payload, 'utf8'))
          );
        initialReadableView.renderedTranscriptHashes =
          renderedTranscriptHashes;
        const exactReadableBinding =
          initialReadableView.animationId === TS008_ANIMATION_ID
          && initialReadableView.sourceSwfSha256 === TS008_SOURCE_SHA256
          && initialReadableView.frameDomain === 'sprite-350'
          && initialReadableView.sourceFrame === 789
          && initialReadableView.defaultExpanded
          && initialReadableView.originalLayoutPreserved
          && initialReadableView.strictAcceptanceEffect === 'none'
          && initialReadableView.expanded
          && initialReadableView.contentCount === 1
          && initialReadableView.transcriptCount === 2
          && initialReadableView.transcriptLanguages.every(
            (language) => language === 'en',
          )
          && JSON.stringify(initialReadableView.transcriptHashes)
            === JSON.stringify(expectedTranscriptHashes)
          && JSON.stringify(renderedTranscriptHashes)
            === JSON.stringify(expectedTranscriptHashes)
          && initialReadableView.minimumTranscriptFontSizePx >= 16
          && initialReadableView.transcriptTextLength >= 100
          && initialReadableView.imageCount === 2
          && initialReadableView.loadedImageCount === 2
          && JSON.stringify(initialReadableView.cropHashes)
            === JSON.stringify(expectedCropHashes)
          && initialReadableView.liveRuntimeCount === 1;
        if (!exactReadableBinding) {
          report.failures.push(
            `Page 36 Readable View binding mismatch ${JSON.stringify(initialReadableView)}`,
          );
        }
        const localStorageBefore = await page.evaluate(() =>
          JSON.stringify(Object.fromEntries(
            Array.from({length: localStorage.length}, (_, index) => {
              const key = localStorage.key(index) ?? '';
              return [key, localStorage.getItem(key)];
            }).sort(([left], [right]) => left.localeCompare(right)),
          ))
        );
        await toggle.click();
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'false',
        );
        const originalLayoutOnly =
          await readableView.locator('.g4-l3-readable-view__content').count()
            === 0
          && await page.locator('.runtime-stage').count() === 1;
        const clickFocusRestored = await toggle.evaluate(
          (button) => document.activeElement === button,
        );
        await toggle.press('Enter');
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'true',
        );
        const enterExpanded = true;
        await toggle.press('Space');
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'false',
        );
        const spaceCollapsed = true;
        await toggle.press('Space');
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'true',
        );
        const transcript = readableView.locator(
          '[data-readable-transcript]',
        ).first();
        await transcript.evaluate((element) => {
          element.setAttribute('tabindex', '-1');
          element.focus();
        });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'false',
        );
        const escapeCollapsed = true;
        const escapeFocusRestored = await toggle.evaluate(
          (button) => document.activeElement === button,
        );
        await toggle.click();
        await page.waitForFunction(() =>
          document.querySelector('[data-readable-view-toggle]')
            ?.getAttribute('aria-expanded') === 'true',
        );
        const localStorageAfter = await page.evaluate(() =>
          JSON.stringify(Object.fromEntries(
            Array.from({length: localStorage.length}, (_, index) => {
              const key = localStorage.key(index) ?? '';
              return [key, localStorage.getItem(key)];
            }).sort(([left], [right]) => left.localeCompare(right)),
          ))
        );
        const interactionPassed =
          originalLayoutOnly
          && clickFocusRestored
          && enterExpanded
          && spaceCollapsed
          && escapeCollapsed
          && escapeFocusRestored
          && localStorageAfter === localStorageBefore;
        if (!interactionPassed) {
          report.failures.push(
            'Page 36 Readable View click/Enter/Space/Escape/focus/progress checks failed',
          );
        }
        const readabilityProfiles = [
          {id: 'desktop-1440x900', width: 1440, height: 900},
          {id: 'tablet-1024x768', width: 1024, height: 768},
          {id: 'mobile-390x844', width: 390, height: 844},
          {id: 'reflow-200-percent-720x450', width: 720, height: 450},
        ];
        const readabilityLayouts = [];
        for (const profile of readabilityProfiles) {
          await page.setViewportSize({
            width: profile.width,
            height: profile.height,
          });
          await page.waitForTimeout(50);
          const layout = await readableView.evaluate((element) => {
            const viewportWidth = document.documentElement.clientWidth;
            const bounds = element.getBoundingClientRect();
            const transcripts = [...element.querySelectorAll(
              '[data-readable-transcript]',
            )];
            return {
              documentHorizontalOverflowPx: Math.max(
                0,
                document.documentElement.scrollWidth - viewportWidth,
                document.body.scrollWidth - viewportWidth,
              ),
              panelHorizontalClipPx: Math.max(
                0,
                -bounds.left,
                bounds.right - viewportWidth,
              ),
              minimumTranscriptFontSizePx: Math.min(
                ...transcripts.map(
                  (item) => Number.parseFloat(getComputedStyle(item).fontSize),
                ),
              ),
              runtimeCount: element.closest(
                '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
              )?.querySelectorAll('.runtime-stage').length ?? 0,
            };
          });
          const relativePath =
            `${finalScreenshotRootRelative}/page-36-readable-${profile.id}.png`;
          const absolutePath = physicalScreenshotPathFor(relativePath);
          await mkdir(path.dirname(absolutePath), {recursive: true});
          await readableView.screenshot({path: absolutePath});
          const screenshot = buildSmokeScreenshotBinding(
            relativePath,
            await readFile(absolutePath),
          );
          const passed =
            layout.documentHorizontalOverflowPx <= 1
            && layout.panelHorizontalClipPx <= 1
            && layout.minimumTranscriptFontSizePx >= 16
            && layout.runtimeCount === 1;
          if (!passed) {
            report.failures.push(
              `Page 36 Readable View ${profile.id} layout mismatch ${JSON.stringify(layout)}`,
            );
          }
          readabilityLayouts.push({...profile, ...layout, screenshot, passed});
        }
        report.page36ReadableView = {
          exactSourceBinding: exactReadableBinding,
          initial: initialReadableView,
          interactions: {
            clickOriginalLayoutOnly: originalLayoutOnly,
            clickFocusRestored,
            enterExpanded,
            spaceCollapsed,
            escapeCollapsed,
            escapeFocusRestored,
            learnerProgressUnchanged:
              localStorageAfter === localStorageBefore,
            passed: interactionPassed,
          },
          layouts: readabilityLayouts,
          passed: exactReadableBinding
            && interactionPassed
            && readabilityLayouts.every(({passed}) => passed),
        };
        await page.setViewportSize({width: 1440, height: 1000});
        await page.emulateMedia({reducedMotion: 'no-preference'});

        const player = page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
        );
        const functionalObservations = [];
        for (const declared of DECLARED_FUNCTIONAL_PAGES) {
          await picker.selectOption(declared.animationId);
          await waitForCurrentAnimation(declared.animationId);
          const observation = await player.evaluate((element, animationId) => {
            const runtime = element.querySelector('.runtime-stage');
            const functionalMarkers = element.querySelectorAll([
              '[data-current-js-functional-candidate="true"]',
              '[data-current-js-functional-entry]',
              '[data-current-js-functional-scope]',
              '[data-current-js-modern-reconstruction="true"]',
            ].join(','));
            const boundary = element.querySelector(
              '[data-strict-acceptance-effect="none"]',
            );
            return {
              animationId,
              runtimeCount: element.querySelectorAll('.runtime-stage').length,
              runtimeAnimationId:
                runtime?.getAttribute('data-animation-id') ?? null,
              functionalMarkerCount: functionalMarkers.length,
              strictAcceptanceEffect:
                boundary?.getAttribute('data-strict-acceptance-effect') ?? null,
              strictMigrationComplete:
                boundary?.getAttribute('data-strict-migration-complete') === 'true',
            };
          }, declared.animationId);
          const passed =
            observation.runtimeCount === 1
            && observation.runtimeAnimationId === declared.animationId
            && observation.functionalMarkerCount >= 1
            && observation.strictAcceptanceEffect === 'none'
            && observation.strictMigrationComplete === false;
          if (!passed) {
            report.failures.push(
              `Functional page observation failed ${JSON.stringify(observation)}`,
            );
          }
          functionalObservations.push({
            ...declared,
            ...observation,
            passed,
          });
        }
        report.functionalObservations = functionalObservations;

        const keyTermsInteractions = [];
        for (const animationId of [
          'course-g04-l03-vb-005',
          'course-g04-l03-vb-006',
          'course-g04-l03-rw-003',
        ]) {
          await picker.selectOption(animationId);
          await waitForCurrentAnimation(animationId);
          const trigger = player.locator(
            '.course-g04-l03-source-glossary-companion '
              + 'button[data-source-key-attribute]:not([disabled])',
          ).first();
          await trigger.waitFor({state: 'visible', timeout: 45_000});
          const triggerKey = await trigger.getAttribute(
            'data-source-key-attribute',
          );
          await trigger.focus();
          await trigger.click();
          await page.waitForFunction(() => {
            const shell = document.querySelector(
              '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
            );
            return shell?.querySelector('[data-active-tool="key-terms"]')
              ?.querySelector(
                '.lesson-shell2__key-terms-browser[data-host-selection-resolution="matched-local-entry"]',
              );
          }, null, {timeout: 45_000});
          const resolved = await player.locator(
            '.lesson-shell2__key-terms-browser[data-host-selection-resolution="matched-local-entry"]',
          ).count() === 1;
          const runtimeCount = await player.locator('.runtime-stage').count();
          await player.locator('button[aria-label="Close tool"]').click();
          await page.waitForFunction(() =>
            document.querySelector(
              '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
            )?.querySelector('[data-active-tool="none"]'),
          null, {timeout: 45_000});
          await page.waitForTimeout(
            variant.keyTermsFocusRestorationMode
              === KEY_TERMS_FOCUS_RESTORATION_MODE
              ? 250
              : 100,
          );
          let focusRestoration;
          if (
            variant.keyTermsFocusRestorationMode
              === KEY_TERMS_FOCUS_RESTORATION_MODE
          ) {
            const focusObservation = await page.evaluate(() => {
              const playerElement = document.querySelector(
                '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
              );
              const activeElement = document.activeElement;
              const bounds = activeElement?.getBoundingClientRect();
              const style = activeElement
                ? getComputedStyle(activeElement)
                : null;
              const hiddenAncestor = activeElement?.closest(
                '[hidden], [aria-hidden="true"]',
              );
              const inertAncestor = activeElement?.closest('[inert]');
              return {
                tag: activeElement?.tagName ?? null,
                responsiveKey:
                  activeElement?.getAttribute('data-responsive-focus-key')
                  ?? null,
                sourceKey:
                  activeElement?.getAttribute('data-source-key-attribute')
                  ?? null,
                samePlayer:
                  Boolean(playerElement)
                  && playerElement.contains(activeElement),
                connected: activeElement?.isConnected === true,
                visible:
                  Boolean(bounds)
                  && bounds.width > 0
                  && bounds.height > 0
                  && style?.display !== 'none'
                  && style?.visibility !== 'hidden'
                  && style?.opacity !== '0',
                disabled:
                  activeElement?.matches(':disabled') === true
                  || activeElement?.getAttribute('aria-disabled') === 'true',
                hidden: Boolean(hiddenAncestor),
                inert: Boolean(inertAncestor),
              };
            });
            focusRestoration =
              evaluateKeyTermsFocusRestoration(focusObservation);
          } else {
            const legacySourceHotspotFocusPredicate =
              await page.evaluate((expectedKey) =>
                document.activeElement
                  ?.getAttribute('data-source-key-attribute')
                  === expectedKey,
              triggerKey);
            focusRestoration = {
              focusRestorationMode: 'legacy-source-hotspot-key',
              predicateVector: {
                sourceKeyMatchesTrigger: legacySourceHotspotFocusPredicate,
              },
              passed: legacySourceHotspotFocusPredicate,
            };
          }
          const focusRestored = focusRestoration.passed;
          let sourceStopHeldAfterClose = false;
          let explicitResumeClearedHold = false;
          if (animationId === 'course-g04-l03-rw-003') {
            sourceStopHeldAfterClose =
              await player.getAttribute('data-source-stop-hold') === 'true';
            const resume = player.locator(
              '[data-source-stop-resume-control="true"]',
            );
            await resume.waitFor({state: 'visible', timeout: 45_000});
            await resume.click();
            await page.waitForFunction(() =>
              document.querySelector(
                '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
              )?.getAttribute('data-source-stop-hold') === 'false',
            null, {timeout: 45_000});
            explicitResumeClearedHold = true;
          }
          const passed =
            Boolean(triggerKey)
            && resolved
            && runtimeCount === 1
            && focusRestored
            && (
              animationId !== 'course-g04-l03-rw-003'
              || (sourceStopHeldAfterClose && explicitResumeClearedHold)
            );
          if (!passed) {
            report.failures.push(
              `Key Terms host interaction failed for ${animationId}`,
            );
          }
          keyTermsInteractions.push({
            animationId,
            triggerKey,
            selectionResolved: resolved,
            runtimeCount,
            focusRestorationMode:
              focusRestoration.focusRestorationMode,
            focusRestoration,
            focusRestored,
            sourceStopHeldAfterClose,
            explicitResumeClearedHold,
            passed,
          });
        }
        report.keyTermsHostInteractions = keyTermsInteractions;
        await page.setViewportSize({width: 1440, height: 1000});
      }
      await picker.selectOption(options[0]);
      await page.locator('[data-current-page="1"]').waitFor();
      const replayButton = page.locator(
        '.lesson-shell2__legacy-hit--replay',
      );
      await replayButton.click();
      await page.locator(
        '[data-current-replay-count="1"]',
      ).waitFor();
      if (variant.strongNavigationChecks) {
        const legacyStage = page.locator('.lesson-shell2__legacy-stage');
        const previousControl = page.locator(
          '[data-lesson-nav="footer-previous"]',
        );
        const nextControl = page.locator('[data-lesson-nav="footer-next"]');
        const [stageBox, previousBox, nextBox] = await Promise.all([
          legacyStage.boundingBox(),
          previousControl.boundingBox(),
          nextControl.boundingBox(),
        ]);
        if (!stageBox || !previousBox || !nextBox) {
          report.failures.push('legacy navigation geometry is unavailable');
        }
        const scale = stageBox ? stageBox.width / 800 : 0;
        const authoredBox = (box) => box && stageBox && scale > 0
          ? {
              x: (box.x - stageBox.x) / scale,
              y: (box.y - stageBox.y) / scale,
              width: box.width / scale,
              height: box.height / scale,
            }
          : null;
        const previousAuthoredBox = authoredBox(previousBox);
        const nextAuthoredBox = authoredBox(nextBox);
        const near = (actual, expected) =>
          typeof actual === 'number' && Math.abs(actual - expected) <= 0.75;
        if (
          !previousAuthoredBox
          || !near(previousAuthoredBox.x, 499)
          || !near(previousAuthoredBox.y, 534)
          || !near(previousAuthoredBox.width, 48)
          || !near(previousAuthoredBox.height, 48)
        ) {
          report.failures.push(
            `Previous authored geometry mismatch ${JSON.stringify(previousAuthoredBox)}`,
          );
        }
        if (
          !nextAuthoredBox
          || !near(nextAuthoredBox.x, 744)
          || !near(nextAuthoredBox.y, 534)
          || !near(nextAuthoredBox.width, 48)
          || !near(nextAuthoredBox.height, 48)
        ) {
          report.failures.push(
            `Next authored geometry mismatch ${JSON.stringify(nextAuthoredBox)}`,
          );
        }

        const faceObservation = async (control) => control.evaluate((button) => {
          const face = button.querySelector(
            '.lesson-shell2__legacy-navigation-face',
          );
          const images = [...button.querySelectorAll(
            '.lesson-shell2__legacy-navigation-state',
          )];
          return {
            disabled: button.disabled,
            mirrorX: face?.getAttribute('data-source-mirror-x') ?? null,
            sourceSpriteCharacterId:
              face?.getAttribute('data-source-sprite-character-id') ?? null,
            hoverFps: face?.getAttribute('data-source-hover-fps') ?? null,
            hoverFrameCount:
              face?.getAttribute('data-source-hover-frame-count') ?? null,
            imageCount: images.length,
            loadedImageCount: images.filter(
              (image) => image.complete && image.naturalWidth > 0,
            ).length,
          };
        });
        const [previousFace, nextFace] = await Promise.all([
          faceObservation(previousControl),
          faceObservation(nextControl),
        ]);
        if (
          previousFace.disabled !== true
          || previousFace.mirrorX !== 'true'
          || previousFace.sourceSpriteCharacterId !== '343'
          || previousFace.hoverFps !== '12'
          || previousFace.hoverFrameCount !== '13'
          || previousFace.imageCount !== 15
          || previousFace.loadedImageCount !== 15
        ) {
          report.failures.push(
            `Previous vector-state binding mismatch ${JSON.stringify(previousFace)}`,
          );
        }
        if (
          nextFace.disabled !== false
          || nextFace.mirrorX !== 'false'
          || nextFace.sourceSpriteCharacterId !== '341'
          || nextFace.hoverFps !== '12'
          || nextFace.hoverFrameCount !== '13'
          || nextFace.imageCount !== 15
          || nextFace.loadedImageCount !== 15
        ) {
          report.failures.push(
            `Next vector-state binding mismatch ${JSON.stringify(nextFace)}`,
          );
        }

        const navigationScreenshotRoot = path.dirname(
          variant.smokeScreenshotRelative,
        );
        const captureNavigationState = async (state) => {
          const relativePath =
            `${navigationScreenshotRoot}/en-native-next-${state}-48x48.png`;
          const absolutePath = physicalScreenshotPathFor(relativePath);
          await mkdir(path.dirname(absolutePath), {recursive: true});
          await nextControl.screenshot({path: absolutePath});
          return buildSmokeScreenshotBinding(
            relativePath,
            await readFile(absolutePath),
          );
        };
        const readPointerState = () => nextControl.evaluate((button) => {
          const opacity = (selector) => {
            const element = button.querySelector(selector);
            return element ? Number(getComputedStyle(element).opacity) : null;
          };
          return {
            up: opacity('.lesson-shell2__legacy-navigation-state--up'),
            overVisible: [...button.querySelectorAll(
              '.lesson-shell2__legacy-navigation-state--over',
            )].filter(
              (element) => Number(getComputedStyle(element).opacity) > 0.9,
            ).length,
            down: opacity('.lesson-shell2__legacy-navigation-state--down'),
          };
        });
        const stateScreenshots = [];
        const upState = await readPointerState();
        stateScreenshots.push(await captureNavigationState('up'));
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await nextControl.hover();
        await page.waitForTimeout(100);
        const overState = await readPointerState();
        stateScreenshots.push(await captureNavigationState('over'));
        if (!nextBox) {
          report.failures.push('Next pointer target is unavailable');
        } else {
          await page.mouse.move(
            nextBox.x + nextBox.width / 2,
            nextBox.y + nextBox.height / 2,
          );
          await page.mouse.down();
        }
        const downState = await readPointerState();
        stateScreenshots.push(await captureNavigationState('down'));
        if (
          upState.up !== 1
          || upState.overVisible !== 0
          || upState.down !== 0
          || overState.up !== 0
          || overState.overVisible !== 1
          || overState.down !== 0
          || downState.up !== 0
          || downState.overVisible !== 0
          || downState.down !== 1
        ) {
          report.failures.push(
            `legacy pointer states mismatch ${JSON.stringify({
              upState,
              overState,
              downState,
            })}`,
          );
        }
        await page.mouse.up();
        await page.locator('[data-current-page="2"]').waitFor();
        await page.locator(
          '[data-lesson-nav="footer-previous"]',
        ).click();
        await page.locator('[data-current-page="1"]').waitFor();

        const firstSectionCode = mapRows[0]?.sectionCode;
        const sectionTarget = mapRows.find(
          ({sectionCode}) => sectionCode !== firstSectionCode,
        );
        if (!sectionTarget) {
          throw new Error('A non-initial section target is unavailable.');
        }
        await page.locator(
          `.lesson-shell2__section-tabs button[data-section-code="${sectionTarget.sectionCode}"]`,
        ).click();
        await waitForCurrentAnimation(sectionTarget.animationId);
        const sectionFirstPage = await page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
        ).evaluate((player, expected) => ({
          currentAnimationId:
            player.getAttribute('data-current-animation-id'),
          currentPage: Number(player.getAttribute('data-current-page')),
          runtimeCount: player.querySelectorAll('.runtime-stage').length,
          runtimeAnimationId:
            player.querySelector('.runtime-stage')
              ?.getAttribute('data-animation-id') ?? null,
          expected,
        }), sectionTarget);
        const sectionFirstPagePassed =
          sectionFirstPage.currentAnimationId === sectionTarget.animationId
          && sectionFirstPage.currentPage === sectionTarget.ordinal
          && sectionFirstPage.runtimeCount === 1
          && sectionFirstPage.runtimeAnimationId === sectionTarget.animationId;
        if (!sectionFirstPagePassed) {
          report.failures.push(
            `section tab first-page mismatch ${JSON.stringify(sectionFirstPage)}`,
          );
        }

        const modernMapTrigger = page.locator(
          '[data-course-map-trigger="modern-accessible-control"]',
        );
        const legacyMapTrigger = page.locator(
          '[data-course-map-trigger="legacy-source-hit-area"]',
        );
        const useModernMapTrigger = await modernMapTrigger.isVisible();
        const mapTrigger = useModernMapTrigger
          ? modernMapTrigger
          : legacyMapTrigger;
        await mapTrigger.waitFor({state: 'visible', timeout: 10_000});
        if (await mapTrigger.getAttribute('aria-expanded') !== 'true') {
          await mapTrigger.click();
        }
        await page.locator('.lesson-shell2__side-panel--map').waitFor({
          state: 'visible',
          timeout: 10_000,
        });
        const lastAnimationId = options.at(-1);
        const lastMapRow = page.locator(
          `.lesson-shell2__map-content button[data-animation-id="${lastAnimationId}"]`,
        );
        await lastMapRow.click();
        await waitForCurrentAnimation(lastAnimationId);
        await page.locator('[data-current-page="39"]').waitFor();
        const mapJump = await page.locator(
          '[data-lesson-player="g4-l3-whole-lesson-mvp"]',
        ).evaluate((player, expectedAnimationId) => ({
          currentAnimationId:
            player.getAttribute('data-current-animation-id'),
          currentPage: Number(player.getAttribute('data-current-page')),
          runtimeCount: player.querySelectorAll('.runtime-stage').length,
          runtimeAnimationId:
            player.querySelector('.runtime-stage')
              ?.getAttribute('data-animation-id') ?? null,
          expectedAnimationId,
        }), lastAnimationId);
        const mapJumpPassed =
          mapJump.currentAnimationId === lastAnimationId
          && mapJump.currentPage === 39
          && mapJump.runtimeCount === 1
          && mapJump.runtimeAnimationId === lastAnimationId;
        if (!mapJumpPassed) {
          report.failures.push(
            `Course Map Page 39 jump mismatch ${JSON.stringify(mapJump)}`,
          );
        }
        const finishControl = page.locator(
          '[data-lesson-nav="footer-next"]',
        );
        const finishLabelBefore = await finishControl.getAttribute('aria-label');
        const finishDisabledBefore = await finishControl.isDisabled();
        await finishControl.click();
        await page.getByText('Lesson journey complete!').waitFor();
        const finishLabelAfter = await finishControl.getAttribute('aria-label');
        const finishDisabledAfter = await finishControl.isDisabled();
        const terminalRuntime = page.locator(
          '.runtime-stage[data-animation-id]',
        );
        await terminalRuntime.evaluate((element) => {
          element.setAttribute('data-v2-terminal-runtime-marker', 'stable');
        });
        await finishControl.evaluate((button) => button.click());
        await page.waitForTimeout(100);
        const terminalIdempotent =
          await terminalRuntime.getAttribute('data-v2-terminal-runtime-marker')
            === 'stable';
        if (
          finishLabelBefore !== 'Finish review'
          || finishDisabledBefore
          || finishLabelAfter !== 'Lesson review finished'
          || !finishDisabledAfter
          || !terminalIdempotent
        ) {
          report.failures.push(
            `terminal navigation mismatch ${JSON.stringify({
              finishLabelBefore,
              finishDisabledBefore,
              finishLabelAfter,
              finishDisabledAfter,
              terminalIdempotent,
            })}`,
          );
        }
        report.navigation = {
          authoredStage: {width: 800, height: 600},
          previousAuthoredBox,
          nextAuthoredBox,
          previousFace,
          nextFace,
          pointerStates: {up: upState, over: overState, down: downState},
          sequentialNavigation: {nextToPage2: true, previousToPage1: true},
          sectionFirstPage: {
            ...sectionFirstPage,
            sectionCode: sectionTarget.sectionCode,
            passed: sectionFirstPagePassed,
          },
          courseMap: {
            triggerKind: useModernMapTrigger
              ? 'modern-accessible-control'
              : 'legacy-source-hit-area',
            realRowCount: mapRows.length,
            exactRealCourseMap: exactMapRows,
            jumpToPage39: {...mapJump, passed: mapJumpPassed},
            passed: exactMapRows && mapJumpPassed,
          },
          terminal: {
            labelBefore: finishLabelBefore,
            disabledBefore: finishDisabledBefore,
            labelAfter: finishLabelAfter,
            disabledAfter: finishDisabledAfter,
            repeatedActivationIdempotent: terminalIdempotent,
          },
          stateScreenshots,
        };
      } else {
        await page.getByRole(
          'button',
          {name: 'Reviewed & next →', exact: true},
        ).click();
        await page.locator('[data-current-page="2"]').waitFor();
      }
      if (variant.compactLandscapeChecks) {
        const [englishCompact, spanishCompact] = [
          await inspectCompactLandscape({
            locale: 'en',
            expectedBadgeCopy:
              'Flash transport parity: not established',
            includeCompanionPages: true,
          }),
          await inspectCompactLandscape({
            locale: 'es',
            expectedBadgeCopy:
              'Paridad del transporte de Flash: no establecida',
          }),
        ];
        report.compactLandscape = {
          viewport: {width: 844, height: 390},
          expectedToolbarColumns: 4,
          expectedToolbarRows: 6,
          minimumInteractiveTargetPixels: 44,
          english: englishCompact,
          spanish: spanishCompact,
          passed: englishCompact.passed && spanishCompact.passed,
          strictAcceptanceEffect: 'none',
        };
      }
      if (!variant.compactLandscapeChecks) {
        await page.goto(`${baseUrl}/es/courses/4/3`, {waitUntil: 'networkidle'});
      }
      await page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"][lang="es"]').waitFor();
      if (variant.strongNavigationChecks) {
        const spanishPicker = page.locator(
          'select[aria-label="Ir a una página de la lección"]',
        );
        await spanishPicker.selectOption(options[0]);
        await page.locator('[data-current-page="1"]').waitFor();
        const spanishNextLabel = await page.locator(
          '[data-lesson-nav="footer-next"]',
        ).getAttribute('aria-label');
        report.navigation.spanishNextLabel = spanishNextLabel;
        if (spanishNextLabel !== 'Página siguiente') {
          report.failures.push(
            `Spanish Next label mismatch ${spanishNextLabel}`,
          );
        }
      }
      await page.setViewportSize({width: 390, height: 844});
      const documentWidth = await page.evaluate(() =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      );
      if (documentWidth > 390) {
        report.failures.push(`mobile horizontal overflow ${documentWidth}px`);
      }
      await mkdir(physicalScreenshotRoot, {recursive: true});
      await page.screenshot({
        path: physicalSmokeScreenshotPath,
        fullPage: true,
      });
      if (variant.bindSmokeScreenshot) {
        const screenshotBytes = await readFile(
          physicalSmokeScreenshotPath,
        );
        report.screenshot = buildSmokeScreenshotBinding(
          variant.smokeScreenshotRelative,
          screenshotBytes,
        );
      }
      if (variant.requireFrozenV2Page36Parity) {
        const page36WholeLessonObservation =
          report.runtimeObservations.find(
            ({animationId}) => animationId === TS008_ANIMATION_ID,
          );
        if (!page36WholeLessonObservation?.exactSingleRuntime) {
          throw new Error(
            'The fresh-extracted v3 Whole-Lesson Player did not expose one exact Page 36 runtime.',
          );
        }
        report.page36FrozenV2Parity = await captureFrozenV2Page36Parity(
          browser,
          variant,
          baseUrl,
          frozenV2Server.baseUrl,
          path.dirname(variant.smokeScreenshotRelative),
          page36WholeLessonObservation,
          physicalScreenshotRoot,
          report,
        );
      }
    } finally {
      await browser.close();
    }

    const audioFiles = (await walkFiles(
      path.join(runtimeRoot, 'public/flash-assets/courses'),
    )).filter((file) => path.extname(file.relativePath) === '.mp3');
    for (const audio of audioFiles) {
      const response = await fetch(
        `${baseUrl}/flash-assets/courses/${audio.relativePath}`,
      );
      if (
        response.status !== 200
        || response.headers.get('content-type') !== 'audio/mpeg'
        || sha256(Buffer.from(await response.arrayBuffer()))
          !== await sha256File(audio.absolutePath)
      ) {
        report.failures.push(`audio mismatch ${audio.relativePath}`);
      } else {
        report.audioUrlsChecked += 1;
      }
    }
  } catch (error) {
    report.failures.push(error instanceof Error ? error.message : String(error));
  } finally {
    await stopChild(frozenV2Server?.child);
    await stopChild(server);
  }
  if (
    report.consoleErrors.length
    || report.pageErrors.length
    || report.badHttpResponses.length
    || report.failedRequests.length
    || report.externalRequests.length
  ) {
    report.failures.push(
      'Browser console, page, bad HTTP response, or external request errors were observed.',
    );
  }
  const page36Parity = report.page36FrozenV2Parity;
  const page36CandidateKey = variant.page36CandidateKey
    ?? (variant.version === 'v3-1' ? 'v31' : 'v3');
  const page36Candidate = page36Parity?.[page36CandidateKey];
  const page36Topology = page36Parity?.comparisonTopology;
  const page36ParityInvalid = variant.requireFrozenV2Page36Parity
    && (
      page36Parity?.candidateVersion !== variant.version
      || page36Parity?.pageOrdinal !== 36
      || page36Parity?.frameDomain !== 'sprite-350'
      || page36Parity?.frame !== 789
      || page36Candidate?.runtimeCountInPlayer !== 1
      || page36Parity?.candidate?.runtimeCountInPlayer !== 1
      || page36Parity?.frozenV2?.runtimeCountInPlayer !== 1
      || page36Topology?.secondRuntimeInCandidatePlayerDom !== false
      || page36Topology?.candidateWholeLessonObservation
        ?.exactSingleRuntime !== true
      || page36Topology?.candidateLoopbackPort
        !== report.serverIdentity.loopbackPort
      || page36Topology?.frozenV2LoopbackPort
        === page36Topology?.candidateLoopbackPort
      || report.frozenV2ServerIdentity?.packageId
        !== 'g4-l3-whole-lesson-package-mvp-v2'
      || report.frozenV2ServerIdentity?.manifestSha256
        !== report.frozenV2PackageManifestSha256
      || report.frozenV2ServerIdentity?.loopbackPort
        !== page36Topology?.frozenV2LoopbackPort
      || report.frozenV2ServerIdentity?.listenerOwnedBySpawnedChild !== true
      || page36Parity?.pixelDifferenceCount !== 0
      || page36Parity?.channelDifferenceCount !== 0
      || page36Parity?.candidateRgbaSha256
        !== page36Parity?.frozenV2RgbaSha256
      || (
        variant.version !== 'v3'
        && (
          page36Parity?.v3 !== undefined
          || page36Parity?.v3RgbaSha256 !== undefined
          || page36Topology?.v3LoopbackPort !== undefined
          || page36Topology?.v3WholeLessonObservation !== undefined
          || page36Topology?.secondRuntimeInV3PlayerDom !== undefined
        )
      )
    );
  const keyTermsFocusRestorationInvalid =
    variant.keyTermsFocusRestorationMode
      === KEY_TERMS_FOCUS_RESTORATION_MODE
    && (
      report.smokeVerifier?.keyTermsFocusRestorationMode
        !== KEY_TERMS_FOCUS_RESTORATION_MODE
      || report.smokeVerifier?.arbitraryVisibleElementAccepted !== false
      || report.keyTermsHostInteractions?.length !== 3
      || report.keyTermsHostInteractions.some((row) =>
        row.focusRestorationMode !== KEY_TERMS_FOCUS_RESTORATION_MODE
        || row.focusRestored !== true
        || row.focusRestoration?.tag !== 'BUTTON'
        || row.focusRestoration?.responsiveKey !== 'key-terms'
        || !Object.hasOwn(row.focusRestoration ?? {}, 'sourceKey')
        || row.focusRestoration?.samePlayer !== true
        || row.focusRestoration?.connected !== true
        || row.focusRestoration?.visible !== true
        || row.focusRestoration?.disabled !== false
        || row.focusRestoration?.hidden !== false
        || row.focusRestoration?.inert !== false
        || JSON.stringify(
          Object.keys(row.focusRestoration?.predicateVector ?? {}),
        ) !== JSON.stringify(
          V33_R3_SMOKE_HARNESS_REVISION.focusPredicateNames,
        )
        || Object.values(
          row.focusRestoration?.predicateVector ?? {},
        ).some((value) => value !== true)
        || row.focusRestoration?.passed !== true,
      )
    );
  if (
    report.pagesRendered !== 39
    || report.audioUrlsChecked !== 72
    || report.runtimeObservations.length !== 39
    || report.runtimeObservations.some(
      ({exactSingleRuntime}) => exactSingleRuntime !== true,
    )
    || report.serverIdentity?.packageId !== manifest.packageId
    || report.serverIdentity?.buildId !== manifest.build?.buildId
    || report.serverIdentity?.manifestSha256
      !== report.packageManifestSha256
    || !Number.isSafeInteger(report.serverIdentity?.loopbackPort)
    || report.serverIdentity.loopbackPort <= 0
    || report.serverIdentity?.portAllocation
      !== 'ephemeral-exclusive-loopback-preflight'
    || report.serverIdentity?.serverEntry !== manifest.entry.serverEntry
    || report.serverIdentity?.launcherEntry !== 'start.mjs'
    || report.serverIdentity?.launchCommand
      !== `node start.mjs --port ${report.serverIdentity?.loopbackPort}`
    || report.serverIdentity?.listenerOwnedBySpawnedChild !== true
    || report.serverIdentity?.listenerVerification
      !== 'lsof-spawned-process-tree-loopback-listen-before-and-after-http'
    || report.smokeVerifier?.implementation !== smokeVerifierImplementation
    || report.smokeVerifier?.postbuildCorrectionUsed !== false
    || report.smokeVerifier?.functionalEntrySelectorIncluded !== true
    || report.smokeVerifier?.keyTermsResolution !== 'matched-local-entry'
    || report.smokeVerifier?.strictAcceptanceEffect !== 'none'
    || (
      correctedCompactSmokeHarness
      && (
        report.smokeVerifier?.compactRootSelector !== 'main.lesson-shell2'
        || report.smokeVerifier?.compactPageSelectionMechanism
          !== 'visible-course-map-row'
        || report.smokeVerifier?.browserProfileIsolation
          !== 'resolved-resume-state-before-each-compact-scenario'
        || report.smokeVerifier?.resumeDecisionBeforeGeometry !== 'resolved'
        || report.smokeVerifier?.sessionDecisionOverlayBeforeGeometry
          !== 'closed'
      )
    )
    || report.privacyScan?.status !== 'pass'
    || !Number.isSafeInteger(report.privacyScan?.filesScanned)
    || report.privacyScan.filesScanned <= 0
    || report.privacyScan?.forbiddenPathFindings !== 0
    || report.privacyScan?.forbiddenExtensionFindings !== 0
    || report.privacyScan?.absoluteLocalPathFindings !== 0
    || report.externalRequests.length !== 0
    || report.failedRequests.length !== 0
    || report.failures.length
    || (
      (variant.version === 'v3-1'
        || variant.advancedSuccessorSmokeChecks === true)
      && (
        report.pageTraversal?.exactManifestOrder !== true
        || report.pageTraversal?.uniquePickerAnimationIds !== 39
        || report.pageTraversal?.exactRealCourseMap !== true
        || report.pageTraversal?.realCourseMapRows?.length !== 39
        || report.page36ReadableView?.passed !== true
        || report.page36ReadableView?.exactSourceBinding !== true
        || report.page36ReadableView?.interactions?.passed !== true
        || report.page36ReadableView?.layouts?.length !== 4
        || report.page36ReadableView.layouts.some(
          ({passed}) => passed !== true,
        )
        || report.functionalObservations?.length
          !== DECLARED_FUNCTIONAL_PAGES.length
        || report.functionalObservations.some(
          ({passed}) => passed !== true,
        )
        || report.keyTermsHostInteractions?.length !== 3
        || report.keyTermsHostInteractions.some(
          ({passed}) => passed !== true,
        )
        || keyTermsFocusRestorationInvalid
        || report.navigation?.sectionFirstPage?.passed !== true
        || report.navigation?.courseMap?.passed !== true
      )
    )
    || (
      variant.compactLandscapeChecks === true
      && (
        report.compactLandscape?.passed !== true
        || report.compactLandscape?.viewport?.width !== 844
        || report.compactLandscape?.viewport?.height !== 390
        || report.compactLandscape?.english?.toolbar?.columns !== 4
        || report.compactLandscape?.english?.toolbar?.rows !== 6
        || report.compactLandscape?.spanish?.toolbar?.columns !== 4
        || report.compactLandscape?.spanish?.toolbar?.rows !== 6
        || report.compactLandscape?.english?.companionPages?.length !== 2
        || report.compactLandscape.english.companionPages.some(
          ({passed}) => passed !== true,
        )
        || report.compactLandscape?.strictAcceptanceEffect !== 'none'
      )
    )
    || (
      variant.bindSmokeScreenshot
      && (
        report.screenshot?.path !== variant.smokeScreenshotRelative
        || !Number.isSafeInteger(report.screenshot?.bytes)
        || report.screenshot.bytes <= 0
        || !/^[a-f0-9]{64}$/.test(report.screenshot?.sha256 ?? '')
        || report.navigation?.stateScreenshots?.length !== 3
        || report.navigation?.terminal?.repeatedActivationIdempotent !== true
        || report.navigation?.spanishNextLabel !== 'Página siguiente'
        || page36ParityInvalid
      )
    )
  ) {
    throw new PackageSmokeValidationError(
      `Package smoke validation failed before publishing ${path.relative(WORKSPACE_ROOT, reportPath)}.`,
      report,
    );
  }
  return report;
}

export function assertSafeV3ArchiveEntries(entries, packageBasename) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('The final v3 ZIP has no entries.');
  }
  for (const entry of entries) {
    if (
      typeof entry !== 'string'
      || entry.length === 0
      || entry.includes('\\')
      || entry.includes('\0')
      || path.posix.isAbsolute(entry)
    ) {
      throw new Error(`Unsafe final v3 ZIP entry: ${entry}`);
    }
    const withoutTrailingSlash = entry.endsWith('/')
      ? entry.slice(0, -1)
      : entry;
    const parts = withoutTrailingSlash.split('/');
    if (
      parts.some((part) => part === '' || part === '.' || part === '..')
      || (
        withoutTrailingSlash !== packageBasename
        && !withoutTrailingSlash.startsWith(`${packageBasename}/`)
      )
    ) {
      throw new Error(`Final v3 ZIP entry escaped its package root: ${entry}`);
    }
  }
  return true;
}

async function checkedOuterArchiveBinding(variant) {
  const row = (await readFile(variant.archiveShaPath, 'utf8')).trim();
  const match = /^([a-f0-9]{64})  ([^/]+)$/.exec(row);
  const actualHash = await sha256File(variant.archivePath);
  if (
    !match
    || match[2] !== path.basename(variant.archivePath)
    || match[1] !== actualHash
    || (
      variant.version === 'v2'
      && actualHash !== V3_FROZEN_PREIMAGES.v2Archive.sha256
    )
  ) {
    throw new Error(
      `Outer archive checksum mismatch for ${variant.packageId}.`,
    );
  }
  return {
    path: path.relative(WORKSPACE_ROOT, variant.archivePath),
    bytes: (await stat(variant.archivePath)).size,
    sha256: actualHash,
  };
}

async function extractFinalArchiveForSmoke(variant, smokeStageRoot) {
  const listing = spawnSync(
    '/usr/bin/unzip',
    ['-Z1', variant.archivePath],
    {encoding: 'utf8'},
  );
  if (listing.status !== 0) {
    throw new Error(
      `Unable to list ${variant.packageId} ZIP: ${listing.stderr}`,
    );
  }
  const entries = listing.stdout.split('\n').filter(Boolean);
  assertSafeV3ArchiveEntries(entries, variant.packageBasename);
  const testResult = spawnSync(
    '/usr/bin/unzip',
    ['-tq', variant.archivePath],
    {encoding: 'utf8'},
  );
  if (testResult.status !== 0) {
    throw new Error(
      `${variant.packageId} ZIP integrity test failed: ${testResult.stderr}`,
    );
  }
  const extraction = spawnSync(
    '/usr/bin/unzip',
    ['-q', variant.archivePath, '-d', smokeStageRoot],
    {encoding: 'utf8'},
  );
  if (extraction.status !== 0) {
    throw new Error(
      `${variant.packageId} ZIP extraction failed: ${extraction.stderr}`,
    );
  }
  const packageRoot = path.join(smokeStageRoot, variant.packageBasename);
  await runVerifierAt(packageRoot);
  if (
    variant.version === 'v2'
    && await sha256File(path.join(packageRoot, 'package-manifest.json'))
      !== V3_FROZEN_PREIMAGES.v2Manifest.sha256
  ) {
    throw new Error('The fresh-extracted frozen v2 manifest has drifted.');
  }
  return packageRoot;
}

async function checkFreshArchiveCopy(variant) {
  const checkStageRoot = await mkdtemp(
    path.join(os.tmpdir(), `${variant.packageId}-check-`),
  );
  try {
    const extractedPackageRoot = await extractFinalArchiveForSmoke(
      variant,
      checkStageRoot,
    );
    const [installedManifestSha256, extractedManifestSha256] =
      await Promise.all([
        sha256File(path.join(variant.packageRoot, 'package-manifest.json')),
        sha256File(
          path.join(extractedPackageRoot, 'package-manifest.json'),
        ),
      ]);
    const [installedChecksumsSha256, extractedChecksumsSha256] =
      await Promise.all([
        sha256File(path.join(variant.packageRoot, 'CHECKSUMS.sha256')),
        sha256File(path.join(extractedPackageRoot, 'CHECKSUMS.sha256')),
      ]);
    if (
      installedManifestSha256 !== extractedManifestSha256
      || installedChecksumsSha256 !== extractedChecksumsSha256
    ) {
      throw new Error(
        `${variant.packageId} fresh ZIP extraction differs from its installed package.`,
      );
    }
    return {
      freshExtractedFinalZip: true,
      extractedPackageVerifier: 'pass',
      manifestSha256: extractedManifestSha256,
      checksumsSha256: extractedChecksumsSha256,
    };
  } finally {
    await rm(checkStageRoot, {recursive: true, force: true});
  }
}

async function commitImmutableSmokeEvidence(
  stagedReportPath,
  stagedScreenshotRoot,
  variant,
) {
  const finalScreenshotRoot = path.dirname(variant.smokeScreenshotPath);
  const lockPath = path.join(
    path.dirname(variant.smokeReportPath),
    `.${path.basename(variant.smokeReportPath)}.commit.lock`,
  );
  const committed = [];
  try {
    await mkdir(lockPath);
  } catch (error) {
    throw new Error(
      `Immutable smoke commit lock is unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    await assertPathAbsent(variant.smokeReportPath, 'Smoke report');
    await assertPathAbsent(finalScreenshotRoot, 'Smoke screenshot root');
    await mkdir(finalScreenshotRoot);
    committed.push({path: finalScreenshotRoot, recursive: true});
    await linkDirectoryContentsExclusive(
      stagedScreenshotRoot,
      finalScreenshotRoot,
    );
    await link(stagedReportPath, variant.smokeReportPath);
    committed.push({path: variant.smokeReportPath, recursive: false});
  } catch (error) {
    for (const row of committed.reverse()) {
      await rm(row.path, {recursive: row.recursive, force: true})
        .catch(() => {});
    }
    throw error;
  } finally {
    await rm(lockPath, {recursive: true, force: true}).catch(() => {});
  }
}

async function smokePackage(variant) {
  assertVariantModeAllowed(variant, 'smoke');
  await assertDeliveryNotFinalized(variant);
  const smokeScreenshotRoot = path.dirname(variant.smokeScreenshotPath);
  if (variant.immutableBuild) {
    await assertPathAbsent(variant.smokeReportPath, 'Smoke report');
    await assertPathAbsent(smokeScreenshotRoot, 'Smoke screenshot root');
  }
  await checkPackage(variant);
  let smokeStageRoot = null;
  let evidenceStageRoot = null;
  let packageRoot = variant.packageRoot;
  let frozenV2PackageRoot = null;
  let smokeContext = {};
  let report = null;
  try {
    if (variant.immutableBuild) {
      await mkdir(path.dirname(smokeScreenshotRoot), {recursive: true});
      evidenceStageRoot = await mkdtemp(
        path.join(
          path.dirname(smokeScreenshotRoot),
          `.${variant.packageBasename}.smoke-evidence-stage-`,
        ),
      );
    }
    if (variant.smokeFromArchive) {
      smokeStageRoot = await mkdtemp(
        path.join(
          os.tmpdir(),
          `${variant.packageId}-smoke-`,
        ),
      );
      packageRoot = await extractFinalArchiveForSmoke(
        variant,
        smokeStageRoot,
      );
      const frozenV2Variant = resolvePackageVariant('v2');
      const frozenV2Archive = await checkedOuterArchiveBinding(
        frozenV2Variant,
      );
      const frozenV2StageRoot = path.join(
        smokeStageRoot,
        'fresh-extracted-frozen-v2',
      );
      await mkdir(frozenV2StageRoot, {recursive: true});
      frozenV2PackageRoot = await extractFinalArchiveForSmoke(
        frozenV2Variant,
        frozenV2StageRoot,
      );
      smokeContext = {
        freshExtractedFinalZip: true,
        extractedPackageVerifier: 'pass',
        sourceArchive: await checkedOuterArchiveBinding(variant),
        frozenV2FreshExtractedFinalZip: true,
        frozenV2SourceArchive: frozenV2Archive,
      };
    } else if (variant.smokeFromDisposableCopy) {
      smokeStageRoot = await mkdtemp(
        path.join(
          os.tmpdir(),
          'g4-l3-whole-lesson-package-v2-smoke-',
        ),
      );
      packageRoot = path.join(
        smokeStageRoot,
        variant.packageBasename,
      );
      await cp(variant.packageRoot, packageRoot, {
        recursive: true,
        dereference: true,
        preserveTimestamps: false,
      });
    }
    const evidencePaths = evidenceStageRoot
      ? {
          reportPath: path.join(evidenceStageRoot, 'smoke.json'),
          screenshotRoot: path.join(evidenceStageRoot, 'screenshots'),
        }
      : {};
    report = await smokePackageAt(
      variant,
      packageRoot,
      smokeContext,
      frozenV2PackageRoot,
      evidencePaths,
    );
    if (variant.smokeFromDisposableCopy || variant.smokeFromArchive) {
      await checkPackage(variant);
      report.postSmokePackageCheck = {
        status: 'pass',
        installedPackageAndFinalArchiveRechecked: true,
      };
    } else {
      report.postSmokePackageCheck = {
        status: 'pass',
        installedPackageAndFinalArchiveRechecked: false,
      };
    }
    await writeFile(
      evidencePaths.reportPath ?? variant.smokeReportPath,
      stableJson(report),
      variant.immutableBuild
        ? {encoding: 'utf8', flag: 'wx', mode: 0o444}
        : 'utf8',
    );
    if (variant.immutableBuild) {
      await commitImmutableSmokeEvidence(
        evidencePaths.reportPath,
        evidencePaths.screenshotRoot,
        variant,
      );
    }
  } finally {
    if (smokeStageRoot) {
      await rm(smokeStageRoot, {recursive: true, force: true});
    }
    if (evidenceStageRoot) {
      await rm(evidenceStageRoot, {recursive: true, force: true});
    }
  }
  console.log(stableJson({
    status: 'smoke-pass',
    report: path.relative(WORKSPACE_ROOT, variant.smokeReportPath),
    pagesRendered: report.pagesRendered,
    audioUrlsChecked: report.audioUrlsChecked,
  }));
}

async function main() {
  const selection = parseArguments(process.argv.slice(2));
  const version = selection.includes(':')
    ? selection.slice(0, selection.indexOf(':'))
    : 'v1';
  const mode = selection.includes(':')
    ? selection.slice(selection.indexOf(':') + 1)
    : selection;
  const variant = resolvePackageVariant(version);
  assertVariantModeAllowed(variant, mode);
  if (mode === 'build') await buildPackage(variant);
  else if (mode === 'check') await checkPackage(variant);
  else await smokePackage(variant);
}

if (
  process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
