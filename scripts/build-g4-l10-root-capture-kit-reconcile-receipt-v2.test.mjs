import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {lstat, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  assertG4L10RootCaptureKitReconcileReceiptV2,
  buildG4L10RootCaptureKitReconcileReceiptV2,
  parseArguments,
} from "./build-g4-l10-root-capture-kit-reconcile-receipt-v2.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const GENERATOR_PATH = path.join(
  ROOT,
  "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v2.mjs",
);
const JSON_PATH = path.join(
  ROOT,
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json",
);
const MARKDOWN_PATH = path.join(
  ROOT,
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.md",
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

const buildPromise = buildG4L10RootCaptureKitReconcileReceiptV2({
  root: ROOT,
  persist: false,
});

test("v2 preserves v1 and records exact 92/2/94 plus 1000/20/1020 arithmetic", async () => {
  const {report} = await buildPromise;
  assert.equal(assertG4L10RootCaptureKitReconcileReceiptV2(report), true);
  assert.equal(report.summary.createdKitCount, 92);
  assert.equal(report.summary.verifiedPreExistingKitCount, 2);
  assert.equal(report.summary.exactKits, 94);
  assert.equal(report.summary.createdFutureRootFrameCaptureObligations, 1000);
  assert.equal(report.summary.preExistingFutureRootFrameCaptureObligations, 20);
  assert.equal(report.summary.futureRootFrameCaptureObligations, 1020);
  assert.equal(report.summary.capturePngs, 0);
  assert.equal(report.v1Attempt.preserved, true);
  assert.equal(report.v1Attempt.rewritten, false);
  assert.equal(report.v1Attempt.acceptedAsFinal, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("the observed pre-existing set is exactly VB003 EN/ES and is disjoint from 92 created kits", async () => {
  const {report} = await buildPromise;
  const preExisting = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "verified-pre-existing-by-observed-reconcile");
  const created = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "created-by-observed-reconcile");
  assert.deepEqual(preExisting.map(({animationId, requirementId, frameCount,
    captureKitManifestSha256}) => ({
    animationId,
    requirementId,
    frameCount,
    captureKitManifestSha256,
  })), [
    {
      animationId: "course-g04-l10-vb-003",
      requirementId: "req-default-root-en",
      frameCount: 10,
      captureKitManifestSha256:
        "e8e95173a251f34d2574e483d53f4329af1acca3cb21f842aec5da2d4a2a9a83",
    },
    {
      animationId: "course-g04-l10-vb-003",
      requirementId: "req-default-root-es",
      frameCount: 10,
      captureKitManifestSha256:
        "c71f16837bb5f28bfb9d75760ac5b3a77c2eae528d4ad77c51b7738655713628",
    },
  ]);
  const createdIds = new Set(created.map(({animationId, requirementId}) =>
    `${animationId}:${requirementId}`));
  assert.equal(createdIds.size, 92);
  for (const kit of preExisting) {
    assert.equal(createdIds.has(`${kit.animationId}:${kit.requirementId}`), false);
  }
});

test("v2 validator rejects frame-total, disposition, v1-preservation, and acceptance drift", async () => {
  const {report} = await buildPromise;
  const frames = clone(report);
  frames.summary.createdFutureRootFrameCaptureObligations = 980;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV2(frames),
    /created\/pre-existing\/total arithmetic drifted/u,
  );
  const disposition = clone(report);
  disposition.kits[0].reconcileDisposition =
    "verified-pre-existing-by-observed-reconcile";
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV2(disposition),
    /per-kit disposition\/frame arithmetic drifted/u,
  );
  const predecessor = clone(report);
  predecessor.v1Attempt.rewritten = true;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV2(predecessor),
    /v1 pretest-attempt preservation boundary drifted/u,
  );
  const acceptance = clone(report);
  acceptance.acceptanceEffects.originalRuntimeEvidence = true;
  assert.throws(
    () => assertG4L10RootCaptureKitReconcileReceiptV2(acceptance),
    /acceptance or safety boundary advanced/u,
  );
});

test("v2 return contract separates report contents from byte count", async () => {
  const built = await buildPromise;
  assert.equal(Buffer.isBuffer(built.json.contents), true);
  assert.equal(typeof built.json.bytes, "number");
  assert.equal(built.json.contents.length, built.json.bytes);
  assert.equal(Buffer.isBuffer(built.markdown.contents), true);
  assert.equal(built.markdown.contents.length, built.markdown.bytes);
  assert.equal((await readFile(JSON_PATH)).equals(built.json.contents), true);
  assert.equal((await readFile(MARKDOWN_PATH)).equals(built.markdown.contents), true);
});

test("v2 --check is exact-byte and preserves report filesystem identity", async () => {
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
  assert.equal(result.createdKits, 92);
  assert.equal(result.verifiedPreExistingKits, 2);
  assert.equal(result.exactKits, 94);
  assert.equal(result.totalFutureRootFrameCaptureObligations, 1020);
  assert.deepEqual(result.persistence, {json: "checked", markdown: "checked"});
  assert.deepEqual(await Promise.all([
    stableIdentity(JSON_PATH),
    stableIdentity(MARKDOWN_PATH),
  ]), before);
  const temporary = (await readdir(path.join(ROOT, "reports")))
    .filter((name) => name.includes("root-capture-kit-reconcile-receipt-v2")
      && name.includes(".tmp-"));
  assert.deepEqual(temporary, []);
});

test("v2 CLI accepts only one help or check option", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.deepEqual(parseArguments(["-h"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--check", "--check"]),
    /Unknown or incompatible arguments/u);
  assert.throws(() => parseArguments(["--root", ROOT]),
    /Unknown or incompatible arguments/u);
});
