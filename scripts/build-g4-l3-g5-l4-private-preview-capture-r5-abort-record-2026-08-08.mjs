#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-r5-abort-record-2026-08-08.json';
const ABSENT_SUCCESS_RECEIPT =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r5.json';
const R5_RUNNER =
  'scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs';
const R5_RUNNER_TEST =
  'scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.test.mjs';
const G4_ORCHESTRATION =
  'output/playwright/g4-l3-current-js-v5/course-g04-l03-ts-006-en-current-r9/capture-orchestration.json';
const G4_CAPTURE =
  'output/playwright/g4-l3-current-js-v5/course-g04-l03-ts-006-en-current-r9/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json';
const G5_CAPTURE =
  'output/playwright/g5-l4-executive-preview-current-js-v3/course-g05-l04-rw-002-en-current-r5/capture-manifest.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function absolute(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath && !path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${relativePath}: path escapes project root`);
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
  throw new Error(`${label} already exists; a successor is required instead of overwrite`);
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({count, value}))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function normalizeFailedRequest(value) {
  const [urlText, reason = 'unknown'] = String(value).split(': net::', 2);
  const url = new URL(urlText);
  return Object.freeze({pathname: url.pathname, reason: `net::${reason}`});
}

function normalizeHttpError(value) {
  const match = /^(?<status>[0-9]{3}) (?<url>https?:\/\/[^\s]+)$/u.exec(String(value));
  invariant(match?.groups, `unrecognized HTTP diagnostic ${value}`);
  const url = new URL(match.groups.url);
  return Object.freeze({
    pathname: url.pathname,
    status: Number(match.groups.status),
    hasRscQuery: url.searchParams.has('_rsc'),
  });
}

export function summarizeG5FailureDiagnostic(capture) {
  const failed = capture.failedRequests.map(normalizeFailedRequest);
  const http = capture.httpErrors.map(normalizeHttpError);
  return Object.freeze({
    consoleErrors: countValues(capture.consoleErrors),
    failedRequestPaths: countValues(failed.map((entry) => entry.pathname)),
    failedRequestReasons: countValues(failed.map((entry) => entry.reason)),
    httpErrors: countValues(http.map((entry) => `${entry.status} ${entry.pathname} rsc=${entry.hasRscQuery}`)),
  });
}

function assertExactFrames(capture, {animationId, frameCount, frameDomain}) {
  invariant(
    capture?.schemaVersion === 4
      && capture?.animationId === animationId
      && Array.isArray(capture.captured)
      && capture.captured.length === frameCount,
    `${animationId}: captured frame domain changed`,
  );
  for (const [index, frame] of capture.captured.entries()) {
    const expected = index + 1;
    invariant(
      frame.frame === expected
        && frame.reportedFrame === expected
        && frame.frameDomainId === frameDomain
        && frame.reportedFrameDomainId === frameDomain
        && frame.width === 800
        && frame.height === 600,
      `${animationId}: frame ${expected} identity or native PNG dimensions changed`,
    );
  }
}

async function writeNoClobber(value) {
  await assertAbsent(OUTPUT_PATH, 'r5 abort record');
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(absolute(OUTPUT_PATH), bytes, {flag: 'wx', mode: 0o444});
  // Retain an artifact if permission hardening ever fails; never delete it.
  await chmod(absolute(OUTPUT_PATH), 0o444);
  const stored = await bind(OUTPUT_PATH);
  invariant(
    stored.descriptor.bytes === bytes.length && stored.descriptor.sha256 === sha256(bytes),
    'r5 abort record changed while finalized',
  );
  return stored.descriptor;
}

export async function buildR5AbortRecord() {
  await Promise.all([
    assertAbsent(OUTPUT_PATH, 'r5 abort record'),
    assertAbsent(ABSENT_SUCCESS_RECEIPT, 'r5 success receipt'),
  ]);
  const [runner, runnerTest, g4Orchestration, g4Capture, g5Capture] = await Promise.all([
    bind(R5_RUNNER),
    bind(R5_RUNNER_TEST),
    bind(G4_ORCHESTRATION, {json: true}),
    bind(G4_CAPTURE, {json: true}),
    bind(G5_CAPTURE, {json: true}),
  ]);
  invariant(
    g4Orchestration.value?.schemaVersion === 2
      && g4Orchestration.value?.status === 'complete-non-authoritative-implementation-capture-orchestration'
      && g4Orchestration.value?.animationId === 'course-g04-l03-ts-006',
    'r5 G4 orchestration identity changed',
  );
  assertExactFrames(g4Capture.value, {
    animationId: 'course-g04-l03-ts-006',
    frameCount: 128,
    frameDomain: 'sprite-23',
  });
  invariant(
    g4Capture.value.status === 'complete'
      && g4Capture.value.error === null
      && g4Capture.value.consoleErrors.length === 0
      && g4Capture.value.failedRequests.length === 0
      && g4Capture.value.httpErrors.length === 0
      && g4Capture.value.unexpectedRequests.length === 0,
    'r5 G4 capture is not the clean individual current-JavaScript result',
  );
  assertExactFrames(g5Capture.value, {
    animationId: 'course-g05-l04-rw-002',
    frameCount: 419,
    frameDomain: 'sprite-341',
  });
  invariant(
    g5Capture.value.status === 'failed'
      && g5Capture.value.error === null
      && g5Capture.value.consoleErrors.length === 1
      && g5Capture.value.failedRequests.length === 3661
      && g5Capture.value.httpErrors.length === 1
      && g5Capture.value.unexpectedRequests.length === 0,
    'r5 G5 capture no longer represents the diagnostic-cleanliness rejection',
  );
  const diagnostic = summarizeG5FailureDiagnostic(g5Capture.value);
  invariant(
    diagnostic.failedRequestReasons.length === 1
      && diagnostic.failedRequestReasons[0]?.value === 'net::ERR_ABORTED'
      && diagnostic.failedRequestReasons[0]?.count === 3661,
    'r5 failed-request diagnostic changed',
  );
  return writeNoClobber({
    schemaVersion: 1,
    receiptType: 'g4-l3-g5-l4-private-preview-capture-attempt-abort-record',
    issuedOn: '2026-08-08',
    recordedAt: new Date().toISOString(),
    revision: 'r5',
    status: 'aborted-after-g5-diagnostic-cleanliness-rejection-before-success-receipt',
    retainedAttemptInputs: {
      runner: runner.descriptor,
      runnerTest: runnerTest.descriptor,
      g4CaptureOrchestration: g4Orchestration.descriptor,
      g4CaptureManifest: g4Capture.descriptor,
      g5CaptureManifest: g5Capture.descriptor,
    },
    observedResult: {
      g4: {
        status: 'individual-current-javascript-capture-complete-but-not-a-cohort-success',
        frames: 128,
        png: {width: 800, height: 600},
        diagnosticsClean: true,
      },
      g5: {
        status: 'all-frames-captured-at-native-dimensions-but-diagnostic-cleanliness-rejected',
        frames: 419,
        png: {width: 800, height: 600},
        diagnosticsClean: false,
        diagnostic,
      },
      successReceiptWritten: false,
    },
    disposition: {
      r5OutputsRetained: true,
      r5OutputsReusedAsCohortEvidence: false,
      r5SuccessReceiptAbsent: true,
      requiredNextStep: 'new-successor-must-isolate-or-settle-unrelated-same-origin-prefetches-and-retest-the-HTTP-500-before-a-fresh-capture',
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
  buildR5AbortRecord().then(
    (descriptor) => process.stdout.write(`${JSON.stringify(descriptor)}\n`),
    (error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    },
  );
}
