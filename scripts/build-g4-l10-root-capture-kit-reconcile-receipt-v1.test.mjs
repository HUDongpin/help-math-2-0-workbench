import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {lstat, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  assertG4L10RootCaptureKitReconcileReceiptV1,
  buildG4L10RootCaptureKitReconcileReceiptV1,
  parseArguments,
} from "./build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const JSON_PATH = path.join(
  ROOT,
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.json",
);
const MARKDOWN_PATH = path.join(
  ROOT,
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.md",
);
const GENERATOR_PATH = path.join(
  ROOT,
  "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs",
);

function clone(value) {
  return structuredClone(value);
}

async function stableIdentity(candidate) {
  const info = await lstat(candidate, {bigint: true});
  return {
    dev: info.dev,
    ino: info.ino,
    size: info.size,
    mode: info.mode,
    nlink: info.nlink,
    mtimeNs: info.mtimeNs,
    ctimeNs: info.ctimeNs,
  };
}

const buildPromise = buildG4L10RootCaptureKitReconcileReceiptV1({
  root: ROOT,
  persist: false,
});

test("current L10 post-reconcile receipt proves 94 exact unsigned kits without acceptance", async () => {
  const built = await buildPromise;
  assert.equal(assertG4L10RootCaptureKitReconcileReceiptV1(built.report), true);
  assert.deepEqual(built.report.summary, {
    releaseMembers: 47,
    rootTraceSpecs: 94,
    englishKits: 47,
    spanishKits: 47,
    exactKits: 94,
    files: 1222,
    filesPerKit: 13,
    totalKitBytes: 36596882,
    stagedSwfCopies: 94,
    uniqueStagedSwfHashes: 47,
    futureRootFrameCaptureObligations: 1020,
    capturePngs: 0,
    frameReadmePlaceholders: 94,
    fractionalNativeStageKits: 8,
    actualRuntimeReceipts: 0,
    actualLaunchReceipts: 0,
    actualSessionAttestations: 0,
  });
  assert.equal(built.report.reconcileRunObservation.preflight.existingExactKits, 2);
  assert.equal(built.report.reconcileRunObservation.preflight.missingKits, 92);
  assert.equal(built.report.currentExactCheck.writeCount, 0);
  assert.ok(Object.values(built.report.acceptanceEffects).every((value) => value === false));
  assert.equal(built.report.strictAcceptanceEffect, "none");
});

test("fractional TI003-TI006 native stages retain an explicit 800x600 raster", async () => {
  const {report} = await buildPromise;
  const fractional = report.kits.filter(({captureRaster}) => captureRaster);
  assert.equal(fractional.length, 8);
  assert.deepEqual(
    [...new Set(fractional.map(({animationId}) => animationId))],
    [
      "course-g04-l10-ti-003",
      "course-g04-l10-ti-004",
      "course-g04-l10-ti-005",
      "course-g04-l10-ti-006",
    ],
  );
  for (const kit of fractional) {
    assert.deepEqual(kit.nativeStage, {width: 799.9, height: 599.75});
    assert.deepEqual(kit.captureRaster, {
      rule: "ceil-positive-native-stage-dimensions",
      width: 800,
      height: 600,
    });
  }
});

test("receipt validator rejects false creation-history, frame-total, and acceptance promotion", async () => {
  const {report} = await buildPromise;
  const creation = clone(report);
  creation.reconcileRunObservation.preflight.existingExactKits = 1;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV1(creation),
    /bounded local reconcile\/check observation drifted/u,
  );
  const frames = clone(report);
  frames.summary.futureRootFrameCaptureObligations = 1000;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV1(frames),
    /post-reconcile summary drifted/u,
  );
  const acceptance = clone(report);
  acceptance.acceptanceEffects.originalRuntimeEvidence = true;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV1(acceptance),
    /acceptance or safety boundary advanced/u,
  );
});

test("persisted receipt bytes are deterministic", async () => {
  const built = await buildPromise;
  assert.deepEqual(await readFile(JSON_PATH), built.json.bytes);
  assert.deepEqual(await readFile(MARKDOWN_PATH), built.markdown.bytes);
});

test("receipt --check preserves report identity and leaves no temporary file", async () => {
  const before = await Promise.all([
    stableIdentity(JSON_PATH),
    stableIdentity(MARKDOWN_PATH),
  ]);
  const {stdout, stderr} = await execFileAsync(
    process.execPath,
    [GENERATOR_PATH, "--check"],
    {cwd: ROOT, encoding: "utf8", maxBuffer: 4 * 1024 * 1024},
  );
  assert.equal(stderr, "");
  const result = JSON.parse(stdout);
  assert.equal(result.status, "checked");
  assert.equal(result.exactKits, 94);
  assert.equal(result.futureRootFrameCaptureObligations, 1020);
  assert.deepEqual(result.persistence, {json: "checked", markdown: "checked"});
  const after = await Promise.all([
    stableIdentity(JSON_PATH),
    stableIdentity(MARKDOWN_PATH),
  ]);
  assert.deepEqual(after, before);
  const temporary = (await readdir(path.join(ROOT, "reports")))
    .filter((name) => name.includes("root-capture-kit-reconcile-receipt-v1")
      && name.includes(".tmp-"));
  assert.deepEqual(temporary, []);
});

test("receipt CLI accepts only help/check", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/u);
});
