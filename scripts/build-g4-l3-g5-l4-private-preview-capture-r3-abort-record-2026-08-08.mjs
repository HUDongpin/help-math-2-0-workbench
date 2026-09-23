#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-r3-abort-record-2026-08-08.json';
const R3_RUNNER =
  'scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r3.mjs';
const G4_ORCHESTRATION =
  'output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r7/capture-orchestration.json';
const G4_CAPTURE =
  'output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r7/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json';
const G5_FAILED_CAPTURE =
  'output/playwright/g5-l4-current-js-v1/course-g05-l04-rw-002-en-current-r3/req-sprite-341-lesson-shell-natural-entry-en/capture-manifest.json';
const ABSENT_SUCCESS_RECEIPT =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r3.json';

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
  await assertAbsent(OUTPUT_PATH, 'r3 abort record');
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

export async function buildR3AbortRecord() {
  await assertAbsent(ABSENT_SUCCESS_RECEIPT, 'r3 success receipt');
  const [runner, g4Orchestration, g4Capture, g5Capture] = await Promise.all([
    bind(R3_RUNNER),
    bind(G4_ORCHESTRATION, {json: true}),
    bind(G4_CAPTURE, {json: true}),
    bind(G5_FAILED_CAPTURE, {json: true}),
  ]);
  invariant(
    g4Orchestration.value?.status ===
      'complete-non-authoritative-implementation-capture-orchestration'
      && g4Orchestration.value?.animationId === 'course-g04-l03-ts-006',
    'r3 G4 orchestration is not the retained completed partial capture',
  );
  invariant(
    g4Capture.value?.status === 'complete'
      && g4Capture.value?.animationId === 'course-g04-l03-ts-006'
      && g4Capture.value?.captured?.length === 128,
    'r3 G4 capture is not the retained 128-frame partial result',
  );
  invariant(
    g5Capture.value?.status === 'failed'
      && g5Capture.value?.animationId === 'course-g05-l04-rw-002'
      && g5Capture.value?.requirementId ===
        'req:sprite-341:lesson-shell-natural-entry:en'
      && g5Capture.value?.captured?.length === 0,
    'r3 G5 failed capture identity changed',
  );

  const value = {
    schemaVersion: 1,
    receiptType: 'g4-l3-g5-l4-private-preview-capture-attempt-abort-record',
    issuedOn: '2026-08-08',
    recordedAt: new Date().toISOString(),
    revision: 'r3',
    status: 'aborted-incomplete-no-success-receipt',
    retainedAttemptInputs: {
      runner: runner.descriptor,
      g4CaptureOrchestration: g4Orchestration.descriptor,
      g4CaptureManifest: g4Capture.descriptor,
      g5FailedCaptureManifest: g5Capture.descriptor,
    },
    observedResult: {
      g4: {
        status: 'individual-current-javascript-capture-complete-but-not-a-cohort-success',
        frames: 128,
      },
      g5: {
        status: 'failed-before-first-frame',
        frames: 0,
        diagnostic: 'generic-production-animation-route-did-not-produce-a-capture-stage',
        consoleErrorCount: g5Capture.value.consoleErrors.length,
        failedRequestCount: g5Capture.value.failedRequests.length,
        httpErrorCount: g5Capture.value.httpErrors.length,
        unexpectedRequestCount: g5Capture.value.unexpectedRequests.length,
      },
      successReceiptWritten: false,
    },
    remediationBoundary: {
      requiredSuccessor: 'a-new-r4-capture-must-use-the-session-protected-g5-l4-executive-preview-route-and-new-output-roots',
      r3OutputsReusedAsCohortEvidence: false,
      historicalArtifactsRewritten: false,
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
  };
  return writeNoClobber(value);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildR3AbortRecord().then(
    (descriptor) => process.stdout.write(`${JSON.stringify(descriptor)}\n`),
    (error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    },
  );
}
