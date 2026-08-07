import assert from "node:assert/strict";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  derivePlan,
  parseCliArgs,
  readSnapshot,
  serializePlan,
  validatePlan,
} from "./build-g4-whole-course-batch-integration-plan-v4.mjs";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const snapshotPromise = readSnapshot(PROJECT_ROOT);
const planPromise = snapshotPromise.then(derivePlan);

test("preserves and authoritatively recomputes exact whole-course v3", async () => {
  const plan = await planPromise;
  assert.equal(plan.successorOf.sha256,
    "c57656ec8de2e86014a2f74f8ed0549b4f532db850de1e0d696850d1d09748e2");
  assert.equal(plan.predecessorDisposition.v3.preserved, true);
  assert.equal(plan.predecessorDisposition.v3.authoritativeRecomputationMatched,
    true);
  assert.equal(plan.currentLedgerFreshness.status,
    "current-authoritative-generator-proven");
});

test("binds exact L10 v6 and conditional VB003 operator scope", async () => {
  const plan = await planPromise;
  assert.equal(plan.template.contractVersion, 6);
  assert.equal(plan.template.contract.sha256,
    "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51");
  assert.equal(plan.template.conditionallyDesignatedOperator, "Peter Hu");
  assert.equal(plan.template.operatorDesignationRecorded, true);
  assert.equal(plan.template.operatorActivated, false);
  assert.equal(plan.template.operatorReady, false);
  assert.equal(plan.template.exactOperatorScope.animationId,
    "course-g04-l10-vb-003");
  assert.deepEqual(plan.template.exactOperatorScope.languages, ["en", "es"]);
  assert.equal(plan.template.exactOperatorCaptureKitCount, 2);
});

test("keeps every wave planned but unadmitted and non-executable", async () => {
  const plan = await planPromise;
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every((wave) => wave.admittedLessonCount === 0));
  assert.ok(plan.waves.every((wave) => wave.executable === false));
  assert.ok(plan.waves.every((wave) => wave.executorPresent === false));
});

test("retains the 16 MP3 and Key Term blockers without inference", async () => {
  const plan = await planPromise;
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.expectedSha256KnownCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.selectedCandidateCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.promotionRecordCount, 0);
  assert.equal(plan.blockers.keyTerms.canonicalMissing, 317);
  assert.equal(plan.blockers.keyTerms.totalReviewHolds, 316);
  assert.match(plan.blockers.keyTerms.residualUnresolvedRuntimePath,
    /Polynomial\.swf$/u);
});

test("keeps 0-or-12 enforcement absent and future publication risk open", async () => {
  const plan = await planPromise;
  const atomic = plan.atomicWholeCourseIntegration;
  assert.equal(atomic.currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.equal(atomic.wholeCourseTrustAdapterPresent, false);
  assert.equal(atomic.currentPlatformRisk.futureRiskClosed, false);
  assert.equal(atomic.integrationAllowed, false);
  assert.equal(atomic.publicationAllowed, false);
  assert.equal(plan.blockers.releaseDefinitions.missingCount, 10);
});

test("binds exact v2.14 without creating review or execution authority", async () => {
  const plan = await planPromise;
  const helper = plan.optionalEvolvingHelperDesign;
  assert.equal(helper.candidateSha256,
    "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510");
  assert.equal(helper.exactContractBound, true);
  assert.equal(helper.freshUserOwnedReviewBatchAuthorized, false);
  assert.equal(helper.designApproved, false);
  assert.equal(helper.implementationSourceBound, false);
  assert.equal(helper.helperBinaryBound, false);
  assert.equal(helper.executionAuthority, false);
});

test("validator rejects admission, activation, executor, integration, or acceptance expansion", async () => {
  const plan = await planPromise;
  for (const mutate of [
    (copy) => { copy.template.templateStable = true; },
    (copy) => { copy.template.operatorActivated = true; },
    (copy) => { copy.waveAdmissionCount = 1; },
    (copy) => { copy.waves[0].admittedLessonCount = 1; },
    (copy) => { copy.executorPresent = true; },
    (copy) => { copy.atomicWholeCourseIntegration.integrationAllowed = true; },
    (copy) => { copy.atomicWholeCourseIntegration.publicationAllowed = true; },
    (copy) => { copy.acceptanceEffects.ownerAcceptance = true; },
  ]) {
    const copy = structuredClone(plan);
    mutate(copy);
    assert.throws(() => validatePlan(copy));
  }
});

test("serialization is deterministic and CLI has no apply mode", async () => {
  const plan = await planPromise;
  assert.equal(validatePlan(plan), true);
  assert.equal(serializePlan(plan), serializePlan(structuredClone(plan)));
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--write"]));
  assert.throws(() => parseCliArgs(["--check", "--write-no-clobber"]));
});
