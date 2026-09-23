import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  deriveContract,
  parseCliArgs,
  readSnapshot,
  runCli,
  validateContract,
  validateLedgerCurrentness,
  writeNoClobber,
} from "./build-g4-l10-complete-migration-template-contract-v5.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("preserves and exact-hash-binds every v4 artifact", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.successorOf.sha256,
    "c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261");
  assert.deepEqual(Object.fromEntries(Object.entries(
    report.predecessorDisposition.v4.artifacts,
  ).map(([key, value]) => [key, value.sha256])), {
    generator: "1b0c4300683014c45ee1c2bd80c4a2ef95003e9e38fc10bfb4599b68cc995341",
    tests: "332cc3ac0bdcde1e15615b36c15024551beea9dbfc11eb190b4d5d450a1c1cdf",
    json: "c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261",
    markdown: "e913ac52e305769d71ffe1caefd7c873f806746edf6869a2972459c41335b9e8",
  });
  assert.equal(report.predecessorDisposition.v4.preserved, true);
  assert.equal(report.predecessorDisposition.v4.status,
    "rejected-superseded-authoritative-ledger-freshness-not-gated");
});

test("normalizes the preserved v4 concurrent-reader rejection to both stale ledgers", async () => {
  const disposition = (await snapshotPromise).legacyReaderRejection;
  assert.equal(disposition.outcome, "fail-closed-as-expected");
  assert.deepEqual(Object.keys(disposition.mismatches), [
    "completionLedger",
    "lessonReleaseLedger",
  ]);
  assert.equal(disposition.mismatches.completionLedger.v4ExpectedSha256,
    "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d");
  assert.equal(disposition.mismatches.completionLedger.currentActualSha256,
    "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db");
  assert.equal(disposition.mismatches.lessonReleaseLedger.v4ExpectedSha256,
    "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650");
  assert.equal(disposition.mismatches.lessonReleaseLedger.currentActualSha256,
    "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc");
});

test("does not swallow a non-ledger v4 reader failure", async () => {
  await assert.rejects(() => readSnapshot(undefined, {
    legacyReader: async () => {
      throw new Error("foreign non-ledger drift");
    },
  }), /Preserved v4 reader failed for a non-ledger reason/);
});

test("proves current ledgers through authoritative recomputation, not bytes alone", async () => {
  const snapshot = await snapshotPromise;
  assert.equal(validateLedgerCurrentness(snapshot), true);
  const report = deriveContract(snapshot);
  assert.equal(report.currentLedgerFreshness.status,
    "current-authoritative-generator-proven");
  assert.equal(report.currentLedgerFreshness.proof.completion.actualEqualsExpected, true);
  assert.equal(report.currentLedgerFreshness.proof.release.actualEqualsExpected, true);
  assert.equal(report.currentLedgerFreshness.authoritativeFunctions.completion.export,
    "checkCompletionLedger");
  assert.equal(report.currentLedgerFreshness.authoritativeFunctions.lessonRelease.export,
    "checkLessonReleaseLedger");
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.scope,
    "direct-entrypoints-only-not-transitive-semantic-code-closure");
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.recursiveLocalDependenciesHashBound,
    false);
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.packageRuntimeProvenanceBound,
    false);
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.liveAuthoritativeFunctionsExecuted,
    true);
});

test("fails closed when completion-ledger currentness is stale", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.ledgerCurrentness.completion.reason = "stale";
  assert.throws(() => deriveContract(fixture), /completion ledger is stale/);
});

test("fails closed when exact completion-ledger bytes drift", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.v4CurrentSnapshot.records.completionLedger.sha256 = "0".repeat(64);
  assert.throws(() => deriveContract(fixture), /completion bound SHA-256 drifted/);
});

test("fails closed when release-ledger expected and actual bytes diverge", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.ledgerCurrentness.release.actualEqualsExpected = false;
  assert.throws(() => deriveContract(fixture),
    /release ledger expected\/actual bytes differ/);
});

test("keeps repository, Grade 4, and L10 at zero strict and zero published", async () => {
  const proof = deriveContract(await snapshotPromise).currentLedgerFreshness.proof;
  assert.deepEqual({
    repositoryStrict: proof.completion.strictComplete,
    grade4Strict: proof.completion.grade4StrictComplete,
    l10Strict: proof.completion.l10StrictComplete,
    published: proof.release.publishedReleaseCount,
    grade4Published: proof.release.grade4PublishedReleaseCount,
    l10Published: proof.release.l10.published,
  }, {
    repositoryStrict: 0,
    grade4Strict: 0,
    l10Strict: 0,
    published: 0,
    grade4Published: 0,
    l10Published: false,
  });
});

test("retains template false, all effects false, and DO_NOT_APPLY", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.templateStable, false);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.ok(report.gates.every(({ acceptanceEffect }) => acceptanceEffect === "none"));
  assert.equal(validateContract(report), true);
});

test("keeps evolving native-helper v2 design outside the exact closure with no P0 effect", async () => {
  const boundary = deriveContract(await snapshotPromise)
    .downstreamTransactionBoundary.nativeHelperV2SecurityDesign;
  assert.equal(boundary.candidatePath,
    "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md");
  assert.equal(boundary.exactContractBound, false);
  assert.equal(boundary.implementationSourceBound, false);
  assert.equal(boundary.helperBinaryBound, false);
  assert.equal(boundary.protectedInstallReceiptBound, false);
  assert.equal(boundary.p0ClosureEffect, false);
  assert.equal(boundary.acceptanceEffect, "none");
});

test("binds 382 inputs while retaining the v4 semantic closures", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(Object.keys(report.inputBindings).length, 382);
  assert.equal(report.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount, 53);
  assert.equal(report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount, 24);
});

test("writeNoClobber creates once, accepts exact bytes, and rejects foreign bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v5-test-"));
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

test("requires one explicit artifact-only CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--apply"]), /Expected --write or --check/);
});

test("checked-in v5 reports exactly match authoritative recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.deepEqual(result.checked, [REPORT_JSON, REPORT_MARKDOWN]);
});
