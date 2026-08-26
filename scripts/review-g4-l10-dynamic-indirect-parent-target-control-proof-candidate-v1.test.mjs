import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildIndependentReview,
  checkIndependentReview,
  parseArguments,
  publishIndependentReviewNoClobber,
} from "./review-g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1.mjs";

test("CLI is review-only and rejects mutation, helper, and runtime modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--apply", "--recover", "--rollback", "--write",
    "--force", "--launch", "--execute-helper", "--install"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("independent reparser validates exact candidate pair and reference sets", async () => {
  const {document} = await buildIndependentReview(PROJECT_ROOT);
  assert.equal(document.status,
    "PASS_READ_ONLY_INDEPENDENT_REPARSE_NO_DISPOSITION_AUTHORITY");
  assert.equal(document.decision,
    "CANDIDATE_ACCURATE_FOR_PLAN_ONLY_SUCCESSOR_INPUT");
  assert.deepEqual(document.findings, {P0: 0, P1: 0, P2: 0, total: 0});
  assert.deepEqual(document.exactPairSet, {
    count: 21,
    sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(document.exactDynamicReferenceSet, {
    count: 36,
    sha256: "a96b5e0346721bd29f5cf2c797007630c0211c2eaeaa97fae424ea8b04b340b7",
    encoding:
      "sorted-animationId-script-line-scriptBodySha256-sourceLine-operationClass-newline-v1",
  });
});

test("review uses independent parsers and confirms all targets remain unresolved", async () => {
  const {document} = await buildIndependentReview(PROJECT_ROOT);
  assert.equal(document.reviewMethod.importsCandidateGenerator, false);
  assert.equal(document.reviewMethod.importsDispositionProofEngine, false);
  assert.equal(document.reviewMethod.independentlyParsedFfdec, true);
  assert.equal(document.reviewMethod.independentlyParsedSwfmill, true);
  assert.equal(document.scope.members, 11);
  assert.equal(document.scope.targetPairs, 21);
  assert.equal(document.scope.dynamicReferences, 36);
  assert.equal(document.scope.currentRawResidualCount, 70);
  assert.equal(document.scope.projectedResidualCountNotApplied, 49);
  const timelines = document.memberReviews.flatMap(({targetTimelines}) =>
    targetTimelines);
  assert.equal(timelines.length, 21);
  assert.ok(timelines.every(({incomingInstancesAllUnnamed,
    directDoActionCount, directDoInitActionCount, ffdecTargetFrameScriptCount,
    parentEntryStateEstablished, currentDisposition}) =>
    incomingInstancesAllUnnamed && directDoActionCount === 0
      && directDoInitActionCount === 0 && ffdecTargetFrameScriptCount === 0
      && parentEntryStateEstablished === false
      && currentDisposition === "unresolved"));
});

test("review authorizes only a plan-only successor input", async () => {
  const {document} = await buildIndependentReview(PROJECT_ROOT);
  assert.equal(document.conclusion.reportMayFeedPlanOnlySuccessor, true);
  assert.equal(document.conclusion.reportMayFeedWorkspaceMutation, false);
  assert.equal(document.conclusion.originalRuntimeEvidenceEstablished, false);
  assert.equal(document.implementationBoundary.workspaceMutationSupported,
    false);
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
});

test("review publication is no-clobber and check rejects tamper", async () => {
  const bundle = await buildIndependentReview(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-review-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishIndependentReviewNoClobber(bundle,
    {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.targetPairs, 21);
  assert.equal(result.currentRawResidualCount, 70);
  assert.equal(result.originalRuntimeLaunched, false);
  await assert.rejects(() => publishIndependentReviewNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkIndependentReview(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no review report", async () => {
  const bundle = await buildIndependentReview(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-review-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishIndependentReviewNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated review stop"); },
  }), /simulated review stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
