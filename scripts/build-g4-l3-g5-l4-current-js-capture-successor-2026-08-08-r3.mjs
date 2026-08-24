#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  verifyPrivatePreviewCaptureExecutionReceiptR6,
} from './verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const R2_PREDECESSOR = Object.freeze({
  json: Object.freeze({
    path: 'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.json',
    bytes: 6475,
    sha256: '09549ff17032f55e3fcef288c3da0f6c692f475d16fcc03feb6f8528eb35b217',
  }),
  markdown: Object.freeze({
    path: 'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.md',
    bytes: 948,
    sha256: '36f375b641a1f7602a2e669543bf6ee0bec54a1f0aad2694744b75c492d436f4',
  }),
});

const R6_RECEIPT = 'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.json';
const R6_VERIFIER = 'scripts/verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.mjs';
const IMPLEMENTATION_PATHS = Object.freeze([
  'scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.mjs',
  'scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.test.mjs',
]);
const OUTPUT_PATHS = Object.freeze([
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.json',
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.md',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
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

async function bind(relativePath, {readOnly = false} = {}) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, `${relativePath}: expected a single-link ordinary file`);
  if (readOnly) invariant((before.mode & 0o222) === 0, `${relativePath}: expected read-only evidence`);
  const bytes = await readFile(target);
  const after = await lstat(target);
  invariant(
    before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mode === after.mode,
    `${relativePath}: changed while read`,
  );
  return Object.freeze({path: relativePath, bytes: bytes.length, sha256: sha256(bytes)});
}

async function readPinnedJson(pin) {
  const descriptor = await bind(pin.path, {readOnly: true});
  invariant(descriptor.bytes === pin.bytes && descriptor.sha256 === pin.sha256, `${pin.path}: immutable predecessor drifted`);
  return Object.freeze({descriptor, value: JSON.parse(await readFile(absolute(pin.path), 'utf8'))});
}

function renderMarkdown(report) {
  return `# G4 L3 and G5 L4 current-JavaScript capture successor r3\n\n`
    + `Status: **${report.status}**.\n\n`
    + `This is a narrow rendering-correction successor. It preserves r2 JSON and Markdown byte-for-byte; r2 Markdown rendered the correct r6 frame-count field at the wrong object path and therefore showed \`undefined\`.\n\n`
    + `- Correct rendered count: **${report.r6CurrentVerification.frameCount}** native 800×600 PNGs — G4 L3 TS006: 128; G5 L4 RW002: 419.\n`
    + `- The r6 verifier still passes, with strict completion \`${report.r6CurrentVerification.strictComplete}\` and publication \`${report.r6CurrentVerification.published}\`.\n`
    + `- r2's strict-ledger statement is retained as a historical statement: **${report.r2Predecessor.strictLedgerVerdict}**. This r3 correction does not recalculate, refresh, or rewrite either ledger.\n`
    + `- No original-runtime, full-frame RMSE, audio, interaction, Replay, human, Owner, strict-completion, release, or publication acceptance is conferred.\n`;
}

export async function buildCurrentJsCaptureSuccessorR3() {
  const [r2Json, r2Markdown, verifier, r6Receipt, implementationBindings] = await Promise.all([
    readPinnedJson(R2_PREDECESSOR.json),
    bind(R2_PREDECESSOR.markdown.path, {readOnly: true}),
    bind(R6_VERIFIER),
    bind(R6_RECEIPT, {readOnly: true}),
    Promise.all(IMPLEMENTATION_PATHS.map((relativePath) => bind(relativePath))),
  ]);
  invariant(
    r2Markdown.bytes === R2_PREDECESSOR.markdown.bytes
      && r2Markdown.sha256 === R2_PREDECESSOR.markdown.sha256,
    'r2 Markdown predecessor drifted',
  );
  const r2MarkdownText = await readFile(absolute(R2_PREDECESSOR.markdown.path), 'utf8');
  invariant(r2MarkdownText.includes('binds undefined native 800×600 PNGs'), 'r2 rendered-defect witness changed');
  invariant(
    r2Json.value?.reportType === 'g4-l3-g5-l4-current-javascript-capture-successor'
      && r2Json.value?.revision === 'r2'
      && r2Json.value?.captureVerification?.result?.frameCount === 547
      && r2Json.value?.captureVerification?.result?.strictComplete === false
      && r2Json.value?.captureVerification?.result?.published === false,
    'r2 structured r6 facts drifted',
  );
  invariant(
    r2Json.value?.strictLedgerCurrentness?.verdict === 'UNEVALUATED_STALE_CHECKED_IN_LEDGER_DO_NOT_INFER_STRICT_ZERO',
    'r2 strict-ledger statement drifted',
  );
  const r6 = await verifyPrivatePreviewCaptureExecutionReceiptR6();
  invariant(
    r6?.verdict === 'PASS'
      && r6.captureCount === 2
      && r6.frameCount === 547
      && r6.strictComplete === false
      && r6.published === false,
    'r6 verifier result drifted',
  );
  invariant(
    r6.receipt?.path === R6_RECEIPT
      && r6.receipt?.bytes === r6Receipt.bytes
      && r6.receipt?.sha256 === r6Receipt.sha256,
    'r6 receipt descriptor drifted',
  );
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'g4-l3-g5-l4-current-javascript-capture-successor',
    issuedOn: '2026-08-08',
    revision: 'r3',
    status: 'r6-current-javascript-captures-verified-session-protected-private-preview-r2-rendering-corrected-strict-ledger-unevaluated-unpublished',
    correction: Object.freeze({
      predecessorMarkdownField: 'captureVerification.frameCount',
      correctStructuredField: 'captureVerification.result.frameCount',
      predecessorRenderedValue: 'undefined',
      correctedRenderedValue: 547,
      structuredR2EvidenceChanged: false,
      r2PredecessorsRewritten: false,
      correctionScope: 'rendered-r6-frame-count-only',
    }),
    r2Predecessor: Object.freeze({
      json: r2Json.descriptor,
      markdown: r2Markdown,
      strictLedgerVerdict: r2Json.value.strictLedgerCurrentness.verdict,
      retainedByteForByte: true,
    }),
    r6CurrentVerification: Object.freeze({
      verifier,
      receipt: r6Receipt,
      verdict: r6.verdict,
      captureCount: r6.captureCount,
      frameCount: r6.frameCount,
      totalPngBytes: r6.totalPngBytes,
      strictComplete: r6.strictComplete,
      published: r6.published,
      currentJavascriptEvidenceOnly: true,
    }),
    r3Implementation: Object.freeze({
      bindings: implementationBindings,
      outputDisposition: 'new-read-only-no-clobber-successor-only',
    }),
    acceptanceEffects: Object.freeze({
      originalRuntimeEvidence: false,
      fullFrameComparison: false,
      audioAcceptance: false,
      interactionAcceptance: false,
      replayAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      lessonPublication: false,
      publicLibraryVisibility: false,
    }),
  });
}

export async function buildCurrentJsCaptureArtifactsR3() {
  const report = await buildCurrentJsCaptureSuccessorR3();
  return Object.freeze({
    report,
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderMarkdown(report)),
  });
}

export function parseArguments(argv) {
  invariant(argv.length === 1, 'exactly one mode is required');
  if (argv[0] === '--write-no-clobber') return Object.freeze({mode: 'write'});
  if (argv[0] === '--check') return Object.freeze({mode: 'check'});
  if (argv[0] === '--json') return Object.freeze({mode: 'json'});
  throw new Error(`unknown option: ${argv[0]}`);
}

async function assertOutputsAbsent() {
  for (const relativePath of OUTPUT_PATHS) {
    try {
      await lstat(absolute(relativePath));
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(`${relativePath}: successor output already exists; never overwrite immutable evidence`);
  }
}

async function writeNoClobber(artifacts) {
  await assertOutputsAbsent();
  await writeFile(absolute(OUTPUT_PATHS[0]), artifacts.json, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUT_PATHS[0]), 0o444);
  await writeFile(absolute(OUTPUT_PATHS[1]), artifacts.markdown, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUT_PATHS[1]), 0o444);
}

async function check(artifacts) {
  const [json, markdown] = await Promise.all([
    readFile(absolute(OUTPUT_PATHS[0])),
    readFile(absolute(OUTPUT_PATHS[1])),
  ]);
  invariant(json.equals(artifacts.json), 'r3 current-JS capture successor JSON drifted');
  invariant(markdown.equals(artifacts.markdown), 'r3 current-JS capture successor Markdown drifted');
  await Promise.all(OUTPUT_PATHS.map((relativePath) => bind(relativePath, {readOnly: true})));
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildCurrentJsCaptureArtifactsR3();
  if (mode === 'write') {
    await writeNoClobber(artifacts);
    process.stdout.write(`wrote ${OUTPUT_PATHS.join(' and ')}\n`);
    return;
  }
  if (mode === 'check') {
    await check(artifacts);
    process.stdout.write('G4/G5 r3 current-JS capture successor: PASS\n');
    return;
  }
  process.stdout.write(artifacts.json);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
