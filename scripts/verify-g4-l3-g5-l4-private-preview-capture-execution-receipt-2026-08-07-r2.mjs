import {createHash} from "node:crypto";
import {lstat, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from "./implementation-artifact-closure.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RECEIPT_PATH =
  "reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-07-r2.json";
const INVENTORY_SUCCESSOR_SHA256 =
  "4b49ef2bfc76a438db401eeaaefe6d97ff75a1f3db64320dfdd030a0a7271ef3";
const PRIOR_G4_CAPTURE =
  "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r3/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

async function readBoundFile(relativePath, expected, label) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath), `${label} path is invalid`);
  const absolutePath = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, absolutePath);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `${label} escapes the project root`);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1, `${label} is not one ordinary file`);
  const bytes = await readFile(absolutePath);
  if (expected) {
    if (expected.bytes !== undefined) invariant(bytes.length === expected.bytes, `${label} byte count drifted`);
    if (expected.sha256 !== undefined) invariant(sha256(bytes) === expected.sha256, `${label} SHA-256 drifted`);
  }
  return {absolutePath, bytes};
}

async function currentClosure(animationId, recordedClosure) {
  const workspace = path.join(PROJECT_ROOT, "migrations", animationId);
  const migration = JSON.parse(await readFile(path.join(workspace, "migration.json")));
  let closure;
  if (animationId !== "course-g04-l03-ts-006") {
    closure = await collectImplementationArtifactClosure({
      projectRoot: PROJECT_ROOT,
      workspace,
      manifest: migration,
    });
  } else {
    const [successorBytes, inventoryBytes, rendererBytes, priorCaptureBytes] = await Promise.all([
      readFile(path.join(PROJECT_ROOT, "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json")),
      readFile(path.join(workspace, "asset-inventory.csv")),
      readFile(path.join(PROJECT_ROOT, "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json")),
      readFile(path.join(PROJECT_ROOT, PRIOR_G4_CAPTURE)),
    ]);
    invariant(sha256(successorBytes) === INVENTORY_SUCCESSOR_SHA256, "G4 inventory successor report drifted");
    const successor = JSON.parse(successorBytes);
    invariant(sha256(inventoryBytes) === successor.predecessorInventory.sha256, "G4 canonical inventory predecessor drifted");
    invariant(sha256(rendererBytes) === successor.exactTransition.successor, "G4 renderer successor binding drifted");
    invariant(successor.exactTransition.changedFieldCount === 1, "G4 inventory successor is not one-field bounded");
    invariant(Object.values(successor.acceptanceEffects).every((value) => value === false), "G4 inventory successor promotes acceptance");
    const adjusted = structuredClone(migration);
    delete adjusted.evidence.assetInventory;
    closure = await collectImplementationArtifactClosure({
      projectRoot: PROJECT_ROOT,
      workspace,
      manifest: adjusted,
    });
    const priorClosure = JSON.parse(priorCaptureBytes).implementationArtifactClosure;
    invariant(
      JSON.stringify(closure.artifacts.map(({path: value}) => value))
        === JSON.stringify(priorClosure.artifacts.map(({path: value}) => value)),
      "G4 successor artifact path set drifted",
    );
    invariant(
      JSON.stringify(closure.projections.map(({path: value}) => value))
        === JSON.stringify(priorClosure.projections.map(({path: value}) => value)),
      "G4 successor projection path set drifted",
    );
  }
  const errors = implementationArtifactClosureErrors(recordedClosure, closure);
  invariant(errors.length === 0, `${animationId} implementation closure is stale: ${errors.join("; ")}`);
  return closure;
}

async function validateCapture(receiptCapture) {
  const orchestrationRecord = await readBoundFile(
    receiptCapture.orchestration.path,
    receiptCapture.orchestration,
    `${receiptCapture.animationId} orchestration`,
  );
  const orchestration = JSON.parse(orchestrationRecord.bytes);
  invariant(orchestration.status === "complete-non-authoritative-implementation-capture-orchestration", `${receiptCapture.animationId} orchestration is not complete`);
  invariant(orchestration.animationId === receiptCapture.animationId, `${receiptCapture.animationId} orchestration identity drifted`);
  invariant(orchestration.selection.totalFrameCount === receiptCapture.frames.fileCount, `${receiptCapture.animationId} orchestration frame count drifted`);
  invariant(orchestration.outputs.length === 1, `${receiptCapture.animationId} orchestration output count drifted`);
  const output = orchestration.outputs[0];
  invariant(output.requirementId === receiptCapture.requirementId, `${receiptCapture.animationId} requirement drifted`);
  invariant(canonicalJson(output.captureManifest) === canonicalJson(receiptCapture.captureManifest), `${receiptCapture.animationId} capture manifest descriptor drifted`);
  invariant(canonicalJson(output.frameArchive) === canonicalJson(receiptCapture.frames), `${receiptCapture.animationId} frame archive descriptor drifted`);

  const captureRecord = await readBoundFile(
    receiptCapture.captureManifest.path,
    receiptCapture.captureManifest,
    `${receiptCapture.animationId} capture manifest`,
  );
  const capture = JSON.parse(captureRecord.bytes);
  invariant(capture.schemaVersion === 4 && capture.status === "complete", `${receiptCapture.animationId} capture is not complete schema v4`);
  invariant(capture.animationId === receiptCapture.animationId, `${receiptCapture.animationId} capture identity drifted`);
  invariant(capture.requirementId === receiptCapture.requirementId, `${receiptCapture.animationId} capture requirement drifted`);
  invariant(capture.viewport.width === 800 && capture.viewport.height === 600 && capture.viewport.deviceScaleFactor === 1, `${receiptCapture.animationId} capture viewport drifted`);
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    invariant(Array.isArray(capture[field]) && capture[field].length === 0, `${receiptCapture.animationId}.${field} is not empty`);
    invariant(receiptCapture.diagnostics[field] === 0, `${receiptCapture.animationId} receipt ${field} is not zero`);
  }
  invariant(capture.error === null, `${receiptCapture.animationId} capture records an error`);
  invariant(capture.captured.length === receiptCapture.frames.fileCount, `${receiptCapture.animationId} capture frame count drifted`);
  invariant(
    canonicalJson({
      artifactCount: capture.implementationArtifactClosure.artifactCount,
      projectionCount: capture.implementationArtifactClosure.projectionCount,
      totalBytes: capture.implementationArtifactClosure.totalBytes,
      aggregateSha256: capture.implementationArtifactClosure.aggregateSha256,
    }) === canonicalJson(receiptCapture.implementationClosure),
    `${receiptCapture.animationId} closure summary drifted`,
  );
  await currentClosure(receiptCapture.animationId, capture.implementationArtifactClosure);

  const captureDirectory = path.dirname(captureRecord.absolutePath);
  const entries = await readdir(captureDirectory, {withFileTypes: true});
  invariant(entries.length === receiptCapture.frames.fileCount + 1, `${receiptCapture.animationId} capture directory member count drifted`);
  const rows = [];
  let totalBytes = 0;
  for (const [index, frame] of capture.captured.entries()) {
    invariant(frame.frame === index + 1 && frame.reportedFrame === index + 1, `${receiptCapture.animationId} frame ordering drifted at ${index + 1}`);
    invariant(frame.width === 800 && frame.height === 600 && frame.reportedRenderState === "ready", `${receiptCapture.animationId} frame ${index + 1} is not ready at native size`);
    invariant(path.basename(frame.file) === frame.file && frame.file.endsWith(".png"), `${receiptCapture.animationId} frame filename is unsafe`);
    const relativePath = path.posix.join(path.posix.dirname(receiptCapture.captureManifest.path), frame.file);
    const frameRecord = await readBoundFile(relativePath, {sha256: frame.sha256}, `${receiptCapture.animationId} frame ${index + 1}`);
    const png = PNG.sync.read(frameRecord.bytes);
    invariant(png.width === 800 && png.height === 600, `${receiptCapture.animationId} PNG ${index + 1} is not 800x600`);
    totalBytes += frameRecord.bytes.length;
    rows.push({path: relativePath, bytes: frameRecord.bytes.length, sha256: frame.sha256});
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  invariant(totalBytes === receiptCapture.frames.totalBytes, `${receiptCapture.animationId} total PNG bytes drifted`);
  invariant(sha256(Buffer.from(canonicalJson(rows))) === receiptCapture.frames.aggregateSha256, `${receiptCapture.animationId} frame archive aggregate drifted`);
  return {frameCount: rows.length, totalBytes};
}

export async function verifyPrivatePreviewCaptureExecutionReceipt() {
  const receiptRecord = await readBoundFile(RECEIPT_PATH, undefined, "execution receipt");
  const receipt = JSON.parse(receiptRecord.bytes);
  invariant(receipt.status === "executed-complete-private-preview-development-current-javascript-captures", "receipt status drifted");
  for (const descriptor of Object.values(receipt.executionPreimage)) {
    await readBoundFile(descriptor.path, descriptor, `execution preimage ${descriptor.path}`);
  }
  invariant(receipt.privatePreviewSession.credentialOrCredentialHashRecorded === false, "receipt records a credential or credential hash");
  invariant(receipt.privatePreviewSession.publicBypassCreated === false, "receipt claims a public bypass");
  invariant(receipt.privatePreviewSession.publicDeploymentEvidence === false, "receipt promotes local evidence to deployment evidence");
  invariant(receipt.liveProbes.length === 3, "live probe count drifted");
  invariant(receipt.liveProbes[0].authenticated === false && receipt.liveProbes[0].status === 307, "unauthenticated redirect probe drifted");
  invariant(receipt.liveProbes.slice(1).every((probe) => probe.authenticated && probe.status === 200 && probe.robots.includes("noindex")), "authenticated private preview probes drifted");
  invariant(receipt.captures.length === 2, "capture count drifted");
  const validations = [];
  for (const capture of receipt.captures) validations.push(await validateCapture(capture));
  invariant(receipt.authority.privatePreviewLoginAndLocalRoutingObserved === true, "receipt omits private preview observation authority");
  invariant(receipt.authority.currentJavascriptImplementationCaptureOnly === true, "receipt omits current-JS capture authority");
  for (const [key, value] of Object.entries(receipt.authority)) {
    if (!["privatePreviewLoginAndLocalRoutingObserved", "currentJavascriptImplementationCaptureOnly"].includes(key)) {
      invariant(value === false, `receipt promotes ${key}`);
    }
  }
  return Object.freeze({
    verdict: "PASS",
    receipt: {
      path: RECEIPT_PATH,
      bytes: receiptRecord.bytes.length,
      sha256: sha256(receiptRecord.bytes),
    },
    captureCount: validations.length,
    frameCount: validations.reduce((sum, value) => sum + value.frameCount, 0),
    totalPngBytes: validations.reduce((sum, value) => sum + value.totalBytes, 0),
    strictComplete: false,
    published: false,
  });
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--check") {
    throw new Error("expected exactly --check");
  }
  console.log(JSON.stringify(await verifyPrivatePreviewCaptureExecutionReceipt(), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
