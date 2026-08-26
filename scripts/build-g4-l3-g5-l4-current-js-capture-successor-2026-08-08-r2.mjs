#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, open, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {generateCompletionLedger} from './build-completion-ledger.mjs';
import {
  verifyPrivatePreviewCaptureExecutionReceiptR6,
} from './verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const JSON_OUTPUT =
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.json';
const MARKDOWN_OUTPUT =
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.md';
const R6_RECEIPT =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.json';
const R5_ABORT =
  'reports/g4-l3-g5-l4-private-preview-capture-r5-abort-record-2026-08-08.json';
const R1_SUCCESSOR =
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.json';
const STRICT_GAP_SUCCESSOR =
  'reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json';
const STRICT_LEDGER_SUCCESSOR =
  'reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.json';
const COMPLETION_LEDGER = 'catalog/completion-ledger.json';
const LESSON_RELEASE_LEDGER = 'catalog/lesson-release-ledger.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath && !path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${relativePath}: path escapes project root`);
  return resolved;
}

async function bind(relativePath, {parseJson = false, requireReadOnly = false} = {}) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink() && physical.nlink === 1, `${relativePath}: expected one ordinary file`);
  if (requireReadOnly) invariant((physical.mode & 0o222) === 0, `${relativePath}: expected read-only evidence`);
  const content = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${relativePath}: changed while read`);
  return Object.freeze({
    descriptor: Object.freeze({path: relativePath, bytes: content.length, sha256: sha256(content)}),
    value: parseJson ? JSON.parse(content.toString('utf8')) : undefined,
  });
}

async function assertAbsent(relativePath, label) {
  try {
    await lstat(absolute(relativePath));
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists; a new successor is required instead of overwrite`);
}

function diagnosticIndex(entries) {
  return new Map((entries ?? []).map((entry) => [entry.workspace, entry]));
}

function compactDiagnostic(entry) {
  if (!entry) return null;
  return Object.freeze({
    animationId: entry.animationId,
    errorCount: entry.errorCount,
    manifestSha256: entry.manifestSha256,
    status: entry.status,
    workspace: entry.workspace,
  });
}

function ledgerCurrentness(stored, recomputed) {
  const before = diagnosticIndex(stored.diagnostics);
  const after = diagnosticIndex(recomputed.diagnostics);
  const workspaces = [...new Set([...before.keys(), ...after.keys()])].sort();
  const transitions = workspaces.flatMap((workspace) => {
    const predecessor = compactDiagnostic(before.get(workspace));
    const current = compactDiagnostic(after.get(workspace));
    return canonicalJson(predecessor) === canonicalJson(current)
      ? []
      : [Object.freeze({current, predecessor})];
  });
  const sameSummary = canonicalJson(stored.summary) === canonicalJson(recomputed.summary);
  return Object.freeze({
    checkedInGeneratedMarker: stored.generatedMarker,
    recomputedGeneratedMarker: recomputed.generatedMarker,
    changedDiagnosticCount: transitions.length,
    diagnosticTransitions: transitions,
    ledgerBytesCurrent: false,
    summaryUnchanged: sameSummary,
    verdict: 'UNEVALUATED_STALE_CHECKED_IN_LEDGER_DO_NOT_INFER_STRICT_ZERO',
  });
}

function renderMarkdown(report) {
  return `# G4 L3 and G5 L4 current-JavaScript capture successor r2\n\n` +
    `Status: **${report.status}**.\n\n` +
    `- The independently verified r6 local private-preview receipt binds ${report.captureVerification.frameCount} native 800×600 PNGs: G4 L3 TS006 (128) and G5 L4 RW002 (419).\n` +
    `- It is session-protected local current-JavaScript evidence only; no public deployment evidence or bypass was created.\n` +
    `- The r5 diagnostic-cleanliness rejection is retained and was not rewritten.\n` +
    `- Current strict-ledger verdict: **${report.strictLedgerCurrentness.verdict}**. Its recomputed summary is unchanged, but the checked-in completion ledger is stale because one TS006 diagnostic count changed; this report does not infer strict zero or a PASS.\n` +
    `- No original-runtime, full-frame RMSE, audio, interaction, Replay, human, Owner, strict-completion, release, or publication acceptance is conferred.\n`;
}

export async function buildCurrentJsCaptureSuccessorR2() {
  const [
    generator,
    verifier,
    verifierTest,
    r6Receipt,
    r5Abort,
    r1Successor,
    strictGap,
    strictLedgerSuccessor,
    completionLedger,
    lessonReleaseLedger,
    verifiedCapture,
    recomputedCompletionLedger,
  ] = await Promise.all([
    bind('scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.mjs'),
    bind('scripts/verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.mjs'),
    bind('scripts/verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.test.mjs'),
    bind(R6_RECEIPT, {parseJson: true, requireReadOnly: true}),
    bind(R5_ABORT, {parseJson: true, requireReadOnly: true}),
    bind(R1_SUCCESSOR, {parseJson: true, requireReadOnly: true}),
    bind(STRICT_GAP_SUCCESSOR, {parseJson: true, requireReadOnly: true}),
    bind(STRICT_LEDGER_SUCCESSOR, {parseJson: true, requireReadOnly: true}),
    bind(COMPLETION_LEDGER, {parseJson: true}),
    bind(LESSON_RELEASE_LEDGER, {parseJson: true}),
    verifyPrivatePreviewCaptureExecutionReceiptR6(),
    generateCompletionLedger(),
  ]);
  const [completionLedgerAfter, lessonReleaseLedgerAfter] = await Promise.all([
    bind(COMPLETION_LEDGER, {parseJson: true}),
    bind(LESSON_RELEASE_LEDGER, {parseJson: true}),
  ]);
  invariant(
    canonicalJson(completionLedgerAfter.descriptor) === canonicalJson(completionLedger.descriptor)
      && canonicalJson(lessonReleaseLedgerAfter.descriptor) === canonicalJson(lessonReleaseLedger.descriptor),
    'shared strict-ledger inputs changed while the r2 successor was being built',
  );
  invariant(
    verifiedCapture.verdict === 'PASS'
      && verifiedCapture.captureCount === 2
      && verifiedCapture.frameCount === 547
      && verifiedCapture.strictComplete === false
      && verifiedCapture.published === false,
    'r6 capture verifier result drifted',
  );
  invariant(
    r6Receipt.value?.revision === 'r6'
      && r6Receipt.value?.status === 'executed-complete-session-protected-private-preview-current-javascript-captures-r6',
    'r6 execution receipt boundary drifted',
  );
  invariant(
    r5Abort.value?.revision === 'r5'
      && r5Abort.value?.observedResult?.successReceiptWritten === false,
    'r5 abort-record boundary drifted',
  );
  invariant(
    r1Successor.value?.reportType === 'g4-l3-g5-l4-current-javascript-capture-successor',
    'r1 capture successor identity drifted',
  );
  invariant(
    strictGap.value?.status === 'current-by-successor-validation-original-runtime-human-owner-strict-and-publication-closed'
      && Object.values(strictGap.value?.acceptanceEffects ?? {}).every((value) => value === false),
    'strict-gap boundary drifted',
  );
  invariant(
    strictLedgerSuccessor.value?.status === 'ledgers-current-ts006-two-diagnostics-closed-strict-zero-publication-zero',
    'historical strict-ledger successor boundary drifted',
  );
  invariant(
    completionLedger.value?.summary?.migrationDirectories === 215
      && completionLedger.value?.summary?.strictComplete === 0
      && completionLedger.value?.summary?.strictFailed === 215,
    'checked-in completion ledger summary drifted',
  );
  invariant(
    lessonReleaseLedger.value?.summary?.releaseCount === 4
      && lessonReleaseLedger.value?.summary?.publishedReleaseCount === 0
      && lessonReleaseLedger.value?.summary?.strictCompleteMemberCount === 0,
    'checked-in lesson release ledger summary drifted',
  );
  const strictLedgerCurrentness = ledgerCurrentness(completionLedger.value, recomputedCompletionLedger);
  invariant(
    strictLedgerCurrentness.changedDiagnosticCount === 1
      && strictLedgerCurrentness.summaryUnchanged === true
      && strictLedgerCurrentness.ledgerBytesCurrent === false,
    'strict-ledger stale transition changed',
  );
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'g4-l3-g5-l4-current-javascript-capture-successor',
    issuedOn: '2026-08-08',
    revision: 'r2',
    status: 'r6-current-javascript-captures-verified-session-protected-private-preview-strict-ledger-unevaluated-unpublished',
    generator: generator.descriptor,
    captureVerification: {
      verifier: verifier.descriptor,
      verifierTest: verifierTest.descriptor,
      result: verifiedCapture,
      executionReceipt: r6Receipt.descriptor,
      currentJavascriptEvidenceOnly: true,
    },
    retainedPredecessors: {
      r5AbortRecord: {...r5Abort.descriptor, rewritten: false},
      r1CurrentJavascriptCaptureSuccessor: {...r1Successor.descriptor, supersededByR6: true, rewritten: false},
    },
    strictGapBoundary: {
      report: strictGap.descriptor,
      currentCheck: 'PASS_OBSERVED_BEFORE_R2_BUILD',
      acceptanceEffects: strictGap.value.acceptanceEffects,
    },
    strictLedgerCurrentness: {
      historicalCurrentnessSuccessor: strictLedgerSuccessor.descriptor,
      checkedInCompletionLedger: completionLedger.descriptor,
      checkedInLessonReleaseLedger: lessonReleaseLedger.descriptor,
      checkedInCompletionSummary: completionLedger.value.summary,
      checkedInLessonReleaseSummary: lessonReleaseLedger.value.summary,
      ...strictLedgerCurrentness,
      writeDisposition: 'NO_LEDGER_REWRITE_IN_DIRTY_SHARED_WORKTREE_WITHOUT_ATTRIBUTED_OWNER_AUTHORIZATION',
    },
    acceptanceEffects: {
      currentJavascriptCaptureEvidenceAdded: true,
      privatePreviewLoginAndLocalRoutingObserved: true,
      authoritativeOriginalRuntime: false,
      fullFrameBaselineComparison: false,
      audioAcceptance: false,
      interactionAcceptance: false,
      replayAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletionConferredByThisSuccessor: false,
      strictLedgerCurrentVerdict: 'UNEVALUATED_STALE_CHECKED_IN_LEDGER_DO_NOT_INFER_STRICT_ZERO',
      publication: false,
    },
    nextSteps: [
      'Attribute the current completion-ledger diagnostic transition and obtain authorization before regenerating the shared ledger.',
      'Obtain authorized original-runtime natural-entry traces and complete full-frame comparison/RMSE before any fidelity claim.',
      'Resolve audio, interaction, Replay, human visual, and Owner review separately; r6 captures do not satisfy those gates.',
      'Keep G4 L10 v2.17 reviewer work paused until the user provides the requested explicit authorization.',
      'Keep v7/v8 missing-source searches stopped pending a new source or Owner decision.',
    ],
  });
}

export function parseMode(argv) {
  const allowed = new Set(['--json', '--check', '--write-no-clobber']);
  if (argv.length === 1 && allowed.has(argv[0])) return argv[0].slice(2);
  throw new Error('choose exactly one explicit mode');
}

async function writeExclusive(relativePath, bytes) {
  await assertAbsent(relativePath, relativePath);
  const handle = await open(absolute(relativePath), 'wx', 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(absolute(relativePath), 0o444);
}

async function emit(mode, report) {
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  if (mode === 'json') {
    process.stdout.write(jsonBytes);
    return;
  }
  if (mode === 'check') {
    const [json, markdown] = await Promise.all([
      readFile(absolute(JSON_OUTPUT)).catch((error) => error?.code === 'ENOENT' ? null : Promise.reject(error)),
      readFile(absolute(MARKDOWN_OUTPUT)).catch((error) => error?.code === 'ENOENT' ? null : Promise.reject(error)),
    ]);
    invariant(json?.equals(jsonBytes), `${JSON_OUTPUT} is stale or missing`);
    invariant(markdown?.equals(markdownBytes), `${MARKDOWN_OUTPUT} is stale or missing`);
    process.stdout.write('G4/G5 r6 current-JS capture successor: PASS\n');
    return;
  }
  invariant(mode === 'write-no-clobber', `unsupported mode ${mode}`);
  await assertAbsent(JSON_OUTPUT, 'r2 JSON successor');
  await assertAbsent(MARKDOWN_OUTPUT, 'r2 Markdown successor');
  await writeExclusive(JSON_OUTPUT, jsonBytes);
  await writeExclusive(MARKDOWN_OUTPUT, markdownBytes);
  process.stdout.write(`wrote ${JSON_OUTPUT} and ${MARKDOWN_OUTPUT}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildCurrentJsCaptureSuccessorR2()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
