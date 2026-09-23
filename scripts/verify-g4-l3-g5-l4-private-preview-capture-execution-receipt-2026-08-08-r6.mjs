#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {PNG} from 'pngjs';

import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from './implementation-artifact-closure.mjs';
import {G5_EXECUTIVE_ROUTE_CLOSURE_PATHS} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RECEIPT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.json';
const R5_ABORT_RECORD = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-r5-abort-record-2026-08-08.json',
  sha256: 'ebac65f012b56985689c033c7eb3eb4f60b71dd79752ecb1f4986725bc119c4b',
});
const TS006_INVENTORY_R2 = Object.freeze({
  path: 'reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.json',
  sha256: '2156d805bceb62c71c2209d4fa68a6affc0a7667ae235daea8237d65106d0cb7',
});

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

function absolute(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath && !path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${relativePath}: path escapes project root`);
  return resolved;
}

async function bind(relativePath, expected = undefined, {parseJson = false, requireReadOnly = false} = {}) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink() && physical.nlink === 1, `${relativePath}: expected one ordinary file`);
  if (requireReadOnly) invariant((physical.mode & 0o222) === 0, `${relativePath}: expected read-only evidence`);
  const content = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${relativePath}: changed while read`);
  const descriptor = Object.freeze({path: relativePath, bytes: content.length, sha256: sha256(content)});
  if (expected) {
    if (expected.bytes !== undefined) invariant(descriptor.bytes === expected.bytes, `${relativePath}: byte count drifted`);
    if (expected.sha256 !== undefined) invariant(descriptor.sha256 === expected.sha256, `${relativePath}: SHA-256 drifted`);
  }
  return Object.freeze({descriptor, value: parseJson ? JSON.parse(content.toString('utf8')) : undefined});
}

async function currentRouteClosure() {
  const files = await Promise.all(
    G5_EXECUTIVE_ROUTE_CLOSURE_PATHS.map(async (entry) => (await bind(entry)).descriptor),
  );
  files.sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze({
    algorithm: 'sha256-canonical-explicit-private-preview-route-files-v1',
    files,
    aggregateSha256: sha256(Buffer.from(canonicalJson(files))),
    totalBytes: files.reduce((sum, entry) => sum + entry.bytes, 0),
  });
}

async function validateTs006InventoryR2() {
  const [report, inventory] = await Promise.all([
    bind(TS006_INVENTORY_R2.path, TS006_INVENTORY_R2, {parseJson: true}),
    bind('migrations/course-g04-l03-ts-006/asset-inventory.csv'),
  ]);
  invariant(
    report.value?.status === 'exact-inventory-transition-current-r1-retained-historical-product-qa-stale-acceptance-neutral'
      && report.value?.currentInventory?.sha256 === inventory.descriptor.sha256
      && report.value?.currentRenderer?.manifest?.sha256 === '424fb84965b48be6b7ddcd25ed770cac4d9e4e6db7c8e2d599daa295f12222aa',
    'TS006 r2 inventory boundary drifted',
  );
  return Object.freeze({report: report.descriptor, inventory: inventory.descriptor});
}

async function currentImplementationClosure(animationId) {
  await validateTs006InventoryR2();
  const workspace = absolute(`migrations/${animationId}`);
  const migration = await bind(`migrations/${animationId}/migration.json`, undefined, {parseJson: true});
  return collectImplementationArtifactClosure({projectRoot: PROJECT_ROOT, workspace, manifest: migration.value});
}

async function validateCapture(receiptCapture) {
  const manifestRecord = await bind(
    receiptCapture.captureManifest.path,
    receiptCapture.captureManifest,
    {parseJson: true},
  );
  const manifest = manifestRecord.value;
  invariant(
    manifest?.schemaVersion === 4
      && manifest.status === 'complete'
      && manifest.animationId === receiptCapture.animationId
      && manifest.requirementId === receiptCapture.requirementId
      && manifest.error === null
      && manifest.captured?.length === receiptCapture.frames.fileCount,
    `${receiptCapture.animationId}: manifest identity or completion drifted`,
  );
  for (const field of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
    invariant(Array.isArray(manifest[field]) && manifest[field].length === 0, `${receiptCapture.animationId}: ${field} is not empty`);
  }
  const currentClosure = await currentImplementationClosure(receiptCapture.animationId);
  const closureErrors = implementationArtifactClosureErrors(manifest.implementationArtifactClosure, currentClosure);
  invariant(closureErrors.length === 0, `${receiptCapture.animationId}: implementation closure is stale (${closureErrors.join('; ')})`);
  invariant(
    canonicalJson({
      artifactCount: currentClosure.artifactCount,
      projectionCount: currentClosure.projectionCount,
      totalBytes: currentClosure.totalBytes,
      aggregateSha256: currentClosure.aggregateSha256,
    }) === canonicalJson(receiptCapture.implementationClosure),
    `${receiptCapture.animationId}: receipt implementation-closure summary drifted`,
  );
  const captureDirectory = path.posix.dirname(receiptCapture.captureManifest.path);
  const entries = await readdir(absolute(captureDirectory), {withFileTypes: true});
  invariant(entries.length === receiptCapture.frames.fileCount + 1, `${receiptCapture.animationId}: unexpected capture-directory member count`);
  const rows = [];
  let totalBytes = 0;
  for (const [index, frame] of manifest.captured.entries()) {
    const expectedFrame = index + 1;
    invariant(
      frame.animationId === receiptCapture.animationId
        && frame.reportedAnimationId === receiptCapture.animationId
        && frame.frame === expectedFrame
        && frame.reportedFrame === expectedFrame
        && frame.frameDomainId === (receiptCapture.animationId === 'course-g04-l03-ts-006' ? 'sprite-23' : 'sprite-341')
        && frame.reportedFrameDomainId === frame.frameDomainId
        && frame.requirementId === receiptCapture.requirementId
        && frame.reportedRenderState === 'ready'
        && frame.width === 800
        && frame.height === 600,
      `${receiptCapture.animationId}: frame ${expectedFrame} identity or dimension drifted`,
    );
    invariant(typeof frame.file === 'string' && /^frame-\d{3}\.png$/u.test(frame.file) && path.basename(frame.file) === frame.file, `${receiptCapture.animationId}: unsafe frame ${expectedFrame} file`);
    const descriptor = await bind(`${captureDirectory}/${frame.file}`, {sha256: frame.sha256});
    const png = PNG.sync.read(await readFile(absolute(descriptor.descriptor.path)));
    invariant(png.width === 800 && png.height === 600, `${receiptCapture.animationId}: PNG ${expectedFrame} is not 800x600`);
    rows.push(descriptor.descriptor);
    totalBytes += descriptor.descriptor.bytes;
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  invariant(totalBytes === receiptCapture.frames.totalBytes, `${receiptCapture.animationId}: total PNG bytes drifted`);
  invariant(sha256(Buffer.from(canonicalJson(rows))) === receiptCapture.frames.aggregateSha256, `${receiptCapture.animationId}: PNG aggregate drifted`);
  return Object.freeze({frameCount: rows.length, totalBytes});
}

function assertAuthorityBoundary(authority) {
  const trueKeys = new Set([
    'privatePreviewLoginAndLocalRoutingObserved',
    'currentJavascriptImplementationCaptureOnly',
    'nativePngDimensionsObserved',
    'captureChromeIsolationObserved',
    'ordinaryExecutivePreviewPreserved',
  ]);
  for (const key of trueKeys) invariant(authority?.[key] === true, `authority boundary omits ${key}`);
  for (const [key, value] of Object.entries(authority ?? {})) {
    invariant(value === trueKeys.has(key), `authority boundary drifted at ${key}`);
  }
}

export async function verifyPrivatePreviewCaptureExecutionReceiptR6() {
  const receiptRecord = await bind(RECEIPT_PATH, undefined, {parseJson: true, requireReadOnly: true});
  const receipt = receiptRecord.value;
  invariant(
    receipt?.schemaVersion === 1
      && receipt.receiptType === 'g4-l3-g5-l4-private-preview-current-javascript-capture-execution'
      && receipt.revision === 'r6'
      && receipt.status === 'executed-complete-session-protected-private-preview-current-javascript-captures-r6',
    'r6 receipt identity or status drifted',
  );
  const executionPreimage = receipt.executionPreimage;
  const descriptorKeys = [
    'runner',
    'runnerTest',
    'canonicalCaptureGenerator',
    'canonicalCoverageOrchestrator',
    'r5PredecessorRunner',
    'r4SharedCaptureUtilities',
    'ts006InventoryR2',
    'ts006CurrentInventory',
    'localDiagnosticBuildId',
  ];
  for (const key of descriptorKeys) {
    invariant(executionPreimage?.[key], `receipt execution preimage is missing ${key}`);
    await bind(executionPreimage[key].path, executionPreimage[key]);
  }
  invariant(
    canonicalJson(await currentRouteClosure()) === canonicalJson(executionPreimage.g5ExecutiveRouteClosure),
    'G5 executive route closure drifted',
  );
  const [r5Abort, inventoryR2] = await Promise.all([
    bind(R5_ABORT_RECORD.path, R5_ABORT_RECORD, {parseJson: true, requireReadOnly: true}),
    validateTs006InventoryR2(),
  ]);
  invariant(
    r5Abort.value?.revision === 'r5'
      && r5Abort.value?.observedResult?.successReceiptWritten === false,
    'r5 abort-record structure drifted',
  );
  invariant(
    canonicalJson(receipt.retainedPredecessors?.r5AbortRecord) === canonicalJson({...r5Abort.descriptor, rewritten: false}),
    'r5 abort-record receipt binding drifted',
  );
  invariant(
    canonicalJson(executionPreimage.ts006InventoryR2) === canonicalJson(inventoryR2.report)
      && canonicalJson(executionPreimage.ts006CurrentInventory) === canonicalJson(inventoryR2.inventory),
    'TS006 inventory receipt bindings drifted',
  );
  invariant(
    receipt.privatePreviewSession?.credentialsGeneratedEphemerally === true
      && receipt.privatePreviewSession?.credentialOrCredentialHashRecorded === false
      && receipt.privatePreviewSession?.cookieInstalledForExactOriginAndStrippedFromOtherOrigins === true
      && receipt.privatePreviewSession?.publicBypassCreated === false
      && receipt.privatePreviewSession?.publicDeploymentEvidence === false,
    'private session boundary drifted',
  );
  invariant(
    Array.isArray(receipt.liveProbes)
      && receipt.liveProbes.length === 5
      && receipt.liveProbes[0]?.authenticated === false
      && receipt.liveProbes[0]?.status === 307
      && receipt.liveProbes[2]?.authenticated === false
      && receipt.liveProbes[2]?.status === 307
      && receipt.liveProbes.slice(1).filter((_, index) => index !== 1).every((probe) => probe.authenticated && probe.status === 200 && probe.robots?.includes('noindex') && probe.cacheControl === 'private, no-store, max-age=0'),
    'private route probe boundary drifted',
  );
  invariant(
    receipt.g5CapturePresentation?.normal?.status === 'normal'
      && receipt.g5CapturePresentation?.normal?.headerDisplay !== 'none'
      && receipt.g5CapturePresentation?.normal?.footerDisplay !== 'none'
      && receipt.g5CapturePresentation?.capture?.status === 'ready'
      && receipt.g5CapturePresentation?.capture?.headerDisplay === 'none'
      && receipt.g5CapturePresentation?.capture?.footerDisplay === 'none'
      && receipt.g5CapturePresentation?.capture?.skipDisplay === 'none'
      && canonicalJson(receipt.g5CapturePresentation?.capture?.pngStage) === canonicalJson({height: 600, width: 800, x: 0, y: 0}),
    'capture-chrome isolation boundary drifted',
  );
  assertAuthorityBoundary(receipt.authority);
  invariant(Array.isArray(receipt.captures) && receipt.captures.length === 2, 'receipt capture count drifted');
  const results = [];
  for (const capture of receipt.captures) results.push(await validateCapture(capture));
  return Object.freeze({
    verdict: 'PASS',
    receipt: receiptRecord.descriptor,
    captureCount: results.length,
    frameCount: results.reduce((sum, result) => sum + result.frameCount, 0),
    totalPngBytes: results.reduce((sum, result) => sum + result.totalBytes, 0),
    strictComplete: false,
    published: false,
  });
}

export function parseMode(argv) {
  if (argv.length === 1 && argv[0] === '--check') return 'check';
  throw new Error('expected exactly --check');
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const mode = parseMode(process.argv.slice(2));
  if (mode === 'check') {
    verifyPrivatePreviewCaptureExecutionReceiptR6().then(
      (result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`),
      (error) => {
        process.stderr.write(`${error.stack ?? error.message}\n`);
        process.exitCode = 1;
      },
    );
  }
}
