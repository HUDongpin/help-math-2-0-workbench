import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {before, test} from "node:test";

import {
  PROJECT_ROOT,
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  checkContract,
  parseCliArgs,
  publishNoClobber,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v7.mjs";

let bundle;

before(async () => {
  bundle = await buildBundle(PROJECT_ROOT);
});

test("CLI remains report-only and rejects implementation or runtime modes", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]),
    "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  for (const forbidden of [
    "--apply",
    "--recover",
    "--implement-helper",
    "--test-helper",
    "--install",
    "--launch",
    "--formalize",
    "--create-kit",
    "--accept",
    "--publish",
    "--force",
  ]) {
    assert.throws(() => parseCliArgs([forbidden]), /Expected --dry-run/u);
  }
  assert.throws(() => parseCliArgs([]), /Choose exactly one/u);
  assert.throws(() => parseCliArgs(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("v7 preserves the exact 47-member whole-lesson denominator", () => {
  const {report} = bundle;
  assert.doesNotThrow(() => validateContract(report));
  assert.equal(report.schemaVersion, 7);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.deepEqual({
    members: report.scope.memberCount,
    pages: report.scope.activePageCount,
    shell: report.scope.shellCount,
    requirements: report.currentFormalState.requirements.total,
    rootReady: report.currentFormalState.requirements.rootReady,
    unresolvedNested: report.currentFormalState.requirements.unresolvedNested,
    unresolvedFrameDomains:
      report.currentFormalState.requirements.unresolvedFrameDomainDispositions,
    totalFrames: report.currentFormalState.frameObligations.total,
  }, {
    members: 47,
    pages: 46,
    shell: 1,
    requirements: 520,
    rootReady: 94,
    unresolvedNested: 426,
    unresolvedFrameDomains: 74,
    totalFrames: 44488,
  });
  assert.equal(report.predecessorDisposition.v6.preserved, true);
  assert.equal(report.predecessorDisposition.v6.authoritativeRecomputationMatched,
    true);
});

test("latest v2.14 batch is exact, failed and permanently nonreusable", () => {
  const boundary = bundle.report.latestSecurityReviewBoundary;
  assert.equal(boundary.hmg4rb4,
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4");
  assert.deepEqual(boundary.taskIds, [
    "019fd9a0-2bc0-72f1-a10c-d2af19e3f5ef",
    "019fd9a0-2e7c-7bc3-ac4a-e3de4293eae1",
    "019fd9a0-316e-7180-b20d-b9f30204b289",
  ]);
  assert.equal(boundary.allThreeQualifyingIndependentReviews, false);
  assert.equal(boundary.allThreeP0P1P2Zero, false);
  assert.deepEqual(boundary.wholeP0P1P2, [0, 1, 0]);
  assert.deepEqual(boundary.wholeFindingIds, [
    "V214-V212-SECTION6-REINTRODUCTION-AND-GATE-SUBSTITUTION-UNDEFINED",
  ]);
  assert.equal(boundary.specReviewQualified, false);
  assert.equal(boundary.productionHelperImplementationEligible, false);
  assert.equal(boundary.reusable, false);
});

test("VB003 graph remains a bounded no-verdict review input", () => {
  const boundary = bundle.report.vb003SourceStaticGraphReviewBoundary;
  assert.equal(boundary.reviewInputFingerprintSha256,
    "b02ae9700ad97ed96b69d9805347374be10cdf29c2ebb239549d0fac36430de5");
  assert.deepEqual(boundary.reviewUniverse, {
    fileCount: 8,
    totalBytes: 322169,
    setSha256:
      "59fbb1441f3072641d09c92aa8d823b2294280ac3fc54217ab6b5d26dadefe76",
  });
  assert.deepEqual(boundary.chunkTransport, {
    chunkCount: 111,
    maximumObservedChunkBytes: 3072,
    chunkSetSha256:
      "6d2b571b663b75ba6ad1cccdd7b4bac7b27a40d8565bb7893c1059a111b03882",
  });
  assert.equal(boundary.reviewTaskAuthorized, false);
  assert.equal(boundary.reviewTaskCreated, false);
  assert.equal(boundary.reviewVerdictPresent, false);
  assert.equal(boundary.graphIsFormalTraceSpecification, false);
  assert.equal(boundary.sourceStaticEdgesEstablishRuntimeCausality, false);
  assert.equal(boundary.formalTraceSpecsCreated, 0);
  assert.equal(boundary.captureKitsCreated, 0);
  assert.equal(boundary.originalRuntimeSessionsCreated, 0);
});

test("all implementation, runtime, acceptance and integration gates stay closed",
  () => {
    const {report} = bundle;
    const runtimeGate = report.gates.find(({id}) =>
      id === "original-runtime-baseline");
    assert.equal(runtimeGate.status,
      "BLOCKED-LATEST-V214-REVIEW-BATCH-FAILED");
    assert.equal(runtimeGate.satisfied, false);
    assert.equal(runtimeGate.current.validV214ReviewBatch, false);
    assert.equal(runtimeGate.current.graphReviewVerdictPresent, false);
    assert.equal(report.currentFormalState.originalRuntime.runtimeSessions, 0);
    assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured,
      0);
    assert.equal(
      report.currentFormalState.javascript.registeredFormalRendererCount, 0);
    assert.equal(report.currentFormalState.reviewAndRelease.strictCompleteMembers,
      0);
    assert.equal(report.currentFormalState.reviewAndRelease.published, false);
    assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
    assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
    assert.equal(
      report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
    assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
    assert.ok(Object.values(report.acceptanceEffects).every((value) =>
      value === false));
  });

test("publication is exact no-clobber and check rejects tamper", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-template-v7-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishNoClobber(bundle, {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.templateStable, false);
  assert.equal(result.specReviewQualified, false);
  assert.equal(result.graphReviewVerdictPresent, false);
  assert.equal(result.productionHelperImplementationEligible, false);
  assert.equal(result.originalRuntimeAuthorized, false);
  await assert.rejects(() => publishNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /already exists; refusing overwrite/u);
  const jsonPath = path.join(temporaryRoot, REPORT_JSON);
  await chmod(jsonPath, 0o644);
  await writeFile(jsonPath, "foreign replacement\n", "utf8");
  await chmod(jsonPath, 0o444);
  await assert.rejects(() => checkContract(bundle, temporaryRoot),
    /bytes changed|SHA-256 changed/u);
  assert.equal(path.basename(REPORT_MARKDOWN),
    "g4-l10-complete-migration-template-contract-v7-2026-08-07.md");
});
