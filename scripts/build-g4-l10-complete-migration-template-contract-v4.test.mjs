import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  REPORT_JSON,
  deriveContract,
  parseCliArgs,
  readSnapshot,
  runCli,
  validateContract,
  writeNoClobber,
} from "./build-g4-l10-complete-migration-template-contract-v4.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

function keyForPath(snapshot, relativePath) {
  const match = Object.entries(snapshot.records).find(([, record]) => record.path === relativePath);
  assert.ok(match, `Missing ${relativePath}`);
  return match[0];
}

test("binds the complete 53-file recursive local candidate-code closure", async () => {
  const report = deriveContract(await snapshotPromise);
  const closure = report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure;
  assert.deepEqual({
    records: closure.recordCount,
    bytes: closure.totalBytes,
    sha256: closure.setSha256,
  }, {
    records: 53,
    bytes: 180303,
    sha256: "a5105dbfc86efd9111975395cfc2f7c3d6cbda7d2ae072e30dbafb23bbebf893",
  });
  assert.equal(report.liveWholeLessonClosure.candidateCode.recursiveLocalImportResolution,
    "complete");
});

test("binds five formerly omitted semantic and runtime dependencies", async () => {
  const records = deriveContract(await snapshotPromise)
    .liveWholeLessonClosure.candidateCode.newlyBoundTransitiveDependencies.records;
  assert.deepEqual(records.map(({ path: value }) => value), [
    "packages/demos/src/contract.ts",
    "packages/demos/src/g4-l3-main-timeline-audio.generated.ts",
    "packages/demos/src/lesson-host-contract.ts",
    "packages/demos/src/source-static-candidate-authority.ts",
    "packages/demos/src/source-static-canvas-candidate.tsx",
  ]);
});

test("binds all 24 timeline-declared runtime assets to their exact digests", async () => {
  const candidate = deriveContract(await snapshotPromise).liveWholeLessonClosure.candidateCode;
  assert.deepEqual({
    records: candidate.runtimeAssetClosure.recordCount,
    bytes: candidate.runtimeAssetClosure.totalBytes,
    sha256: candidate.runtimeAssetClosure.setSha256,
    mismatches: candidate.assetDigestMismatchCount,
  }, {
    records: 24,
    bytes: 45089726,
    sha256: "b736fa0a4434788032dc7fdea4251cd802560ec2c6b9aa29a75ff41f2ed825a8",
    mismatches: 0,
  });
});

test("rejects shared canvas runtime drift", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records[keyForPath(fixture,
    "packages/demos/src/source-static-canvas-candidate.tsx")].sha256 = "0".repeat(64);
  assert.throws(() => deriveContract(fixture), /Full local candidate code closure drifted/);
});

test("rejects shared candidate authority drift", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records[keyForPath(fixture,
    "packages/demos/src/source-static-candidate-authority.ts")].sha256 = "1".repeat(64);
  assert.throws(() => deriveContract(fixture), /Full local candidate code closure drifted/);
});

test("rejects digest-declared runtime asset drift", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records[fixture.candidateRuntimeAssetKeys[0]].sha256 = "2".repeat(64);
  assert.throws(() => deriveContract(fixture), /Candidate runtime asset closure drifted/);
});

test("preserves v3 as rejected P1 evidence", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.successorOf.sha256,
    "c18ba22b2e78eaf989bca4e4394ecac6be7aa02c0e6f0df99a9698683a83c555");
  assert.equal(report.predecessorDisposition.v3.status,
    "rejected-p1-transitive-candidate-code-closure-incomplete");
  assert.equal(report.predecessorDisposition.v3.preserved, true);
});

test("remains fail-closed at every acceptance and integration boundary", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.templateStable, false);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(validateContract(report), true);
});

test("binds exactly 375 live inputs", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(Object.keys(report.inputBindings).length, 375);
  assert.equal(report.inputBindings.rejectedV3Json.sha256,
    "c18ba22b2e78eaf989bca4e4394ecac6be7aa02c0e6f0df99a9698683a83c555");
});

test("writeNoClobber creates once, accepts exact bytes, and rejects foreign bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v4-test-"));
  const target = path.join(root, "report.json");
  try {
    assert.equal(await writeNoClobber(target, "exact\n"), "created");
    assert.equal(await writeNoClobber(target, "exact\n"), "already-current");
    await assert.rejects(() => writeNoClobber(target, "foreign\n"),
      /exists with different bytes/);
    assert.equal(await readFile(target, "utf8"), "exact\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires one explicit non-mutating-artifact CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--apply"]), /Expected --write or --check/);
});

test("checked-in v4 reports exactly match recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.deepEqual(result.checked, [
    REPORT_JSON,
    "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.md",
  ]);
});
