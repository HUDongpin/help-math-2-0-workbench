#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-r4-abort-record-2026-08-08.json';
const R4_RUNNER =
  'scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs';
const G4_CAPTURE =
  'output/playwright/g4-l3-current-js-v4/course-g04-l03-ts-006-en-current-r8/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json';
const G5_CAPTURE =
  'output/playwright/g5-l4-executive-preview-current-js-v2/course-g05-l04-rw-002-en-current-r4/capture-manifest.json';
const ABSENT_SUCCESS_RECEIPT =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r4.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function absolute(relativePath) {
  invariant(!path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), 'path escapes project root');
  return resolved;
}

async function bind(relativePath, {json = false} = {}) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink() && physical.nlink === 1, `${relativePath}: expected one ordinary file`);
  const bytes = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${relativePath}: changed while read`);
  return Object.freeze({
    descriptor: Object.freeze({path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}),
    value: json ? JSON.parse(bytes.toString('utf8')) : undefined,
  });
}

async function assertAbsent(relativePath, label) {
  try {
    await lstat(absolute(relativePath));
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists; no historical evidence may be overwritten`);
}

async function writeNoClobber(value) {
  await assertAbsent(OUTPUT_PATH, 'r4 abort record');
  const destination = absolute(OUTPUT_PATH);
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  try {
    await writeFile(destination, bytes, {flag: 'wx', mode: 0o444});
    await chmod(destination, 0o444);
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  }
  return Object.freeze({path: OUTPUT_PATH, bytes: bytes.length, sha256: sha256(bytes)});
}

export async function buildR4AbortRecord() {
  await assertAbsent(ABSENT_SUCCESS_RECEIPT, 'r4 success receipt');
  const [runner, g4Capture, g5Capture] = await Promise.all([
    bind(R4_RUNNER),
    bind(G4_CAPTURE, {json: true}),
    bind(G5_CAPTURE, {json: true}),
  ]);
  invariant(
    g4Capture.value?.status === 'complete'
      && g4Capture.value?.captured?.length === 128
      && g4Capture.value?.captured?.[0]?.width === 800
      && g4Capture.value?.captured?.[0]?.height === 600,
    'r4 G4 capture identity changed',
  );
  invariant(
    g5Capture.value?.status === 'complete'
      && g5Capture.value?.captured?.length === 419
      && g5Capture.value?.captured?.[0]?.width === 801
      && g5Capture.value?.captured?.[0]?.height === 601
      && g5Capture.value?.error === null,
    'r4 G5 capture no longer represents the rejected fractional-layout result',
  );
  return writeNoClobber({
    schemaVersion: 1,
    receiptType: 'g4-l3-g5-l4-private-preview-capture-attempt-abort-record',
    issuedOn: '2026-08-08',
    recordedAt: new Date().toISOString(),
    revision: 'r4',
    status: 'aborted-after-capture-before-success-receipt',
    retainedAttemptInputs: {
      runner: runner.descriptor,
      g4CaptureManifest: g4Capture.descriptor,
      g5CaptureManifest: g5Capture.descriptor,
    },
    observedResult: {
      g4: {status: 'individual-current-javascript-capture-complete-but-not-a-cohort-success', frames: 128, png: {width: 800, height: 600}},
      g5: {status: 'all-frames-captured-but-stage-png-dimensions-rejected', frames: 419, png: {width: 801, height: 601}},
      successReceiptWritten: false,
    },
    rootCause: {
      kind: 'fractional-executive-preview-layout-offset',
      effect: 'a-native-800-by-600-canvas-produced-an-801-by-601-Playwright-clip',
      disposition: 'r5-must-use-a-new-output-root-after-the-narrow-capture-only-integer-pixel-layout-successor',
    },
    remediationBoundary: {
      historicalArtifactsRewritten: false,
      r4OutputsReusedAsCohortEvidence: false,
      strictDimensionGuardRetained: true,
    },
    acceptanceEffects: {
      currentJavascriptCohortCapture: false,
      authoritativeOriginalRuntime: false,
      fullFrameBaselineComparison: false,
      audioAcceptance: false,
      interactionAcceptance: false,
      replayAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      publication: false,
    },
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildR4AbortRecord().then(
    (descriptor) => process.stdout.write(`${JSON.stringify(descriptor)}\n`),
    (error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    },
  );
}
