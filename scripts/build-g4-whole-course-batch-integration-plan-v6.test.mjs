import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OUTPUT_PREFIX,
  PROJECT_ROOT,
  derivePlan,
  parseArguments,
  readSnapshot,
  renderMarkdown,
  runCli,
  validatePlanV6,
  writeNoClobber,
} from "./build-g4-whole-course-batch-integration-plan-v6.mjs";

let snapshot;
let plan;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  plan = derivePlan(snapshot);
});

test("binds exact v5 and revalidates the inherited 51-input closure", () => {
  assert.equal(validatePlanV6(plan), true);
  assert.equal(plan.successorOf.sha256,
    "55e19f29a2e8705d712cef335c84cb0591276eb3138a82f4cbc336d1dab28e92");
  assert.equal(plan.successorOf.planFingerprintSha256,
    "aef901de0ec51d062d8645f9b89e5a836fe469a8574de8d32148f07989c6c30c");
  assert.equal(plan.predecessorDisposition.v5.preserved, true);
  assert.equal(plan.predecessorDisposition.v5.modified, false);
  assert.equal(Object.keys(plan.inputBindings).length, 59);
});

test("preserves the 12-lesson, 657-member course and zero wave admission", () => {
  assert.deepEqual({
    lessons: plan.courseBaseline.lessonCount,
    pages: plan.courseBaseline.pageCount,
    shells: plan.courseBaseline.shellCount,
    members: plan.courseBaseline.memberCount,
    currentJs: plan.courseBaseline.currentJsMembers,
    currentJsGap: plan.courseBaseline.currentJsGap,
    strictComplete: plan.courseBaseline.strictCompleteMembers,
  }, {
    lessons: 12,
    pages: 645,
    shells: 12,
    members: 657,
    currentJs: 43,
    currentJsGap: 614,
    strictComplete: 0,
  });
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 && wave.executable === false));
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
});

test("binds the rehashed Key Term v1 review plan without accepting its holds", () => {
  const resolution = plan.blockers.keyTerms.resolutionPlan;
  assert.equal(resolution.version, 1);
  assert.equal(resolution.canonicalFilesRehashed, 443);
  assert.equal(resolution.canonicalBytesRehashed, 3978065);
  assert.equal(resolution.canonicalExactPlacementCount, 35);
  assert.equal(resolution.canonicalCaseVariantSameDirectoryCount, 407);
  assert.equal(resolution.canonicalUniqueBasenameOtherDirectoryCount, 1);
  assert.equal(resolution.folderZipRehashed, true);
  assert.equal(resolution.folderZipSha256,
    "e367ea90c904894080c4c8e11f9eaaaebf615e14b655991b68820977ecbd6428");
  assert.equal(resolution.quarantineFilesRehashed, 1594);
  assert.equal(resolution.quarantineBytesRehashed, 169045760);
  assert.equal(resolution.quarantineChecksumSetSha256,
    "fe16e6eec0ab36aba449ca15f047583286dbaeb1e5412c61c7a9e26db9083c79");
  assert.equal(resolution.candidateReviewHolds, 316);
  assert.equal(resolution.exactPlacementReviewHolds, 17);
  assert.equal(resolution.caseVariantPlacementReviewHolds, 299);
  assert.equal(resolution.potentialResolvedAfterAllReviewHoldsAccepted, 759);
  assert.equal(resolution.automaticPlacementOrCaseAdmissionAuthorized, false);
  assert.equal(resolution.promotionRecordCount, 0);
  assert.equal(resolution.sourceDependencyClosure, false);
});

test("keeps Polynomial.swf unresolved and the FLA non-substitutive", () => {
  const resolution = plan.blockers.keyTerms.resolutionPlan;
  assert.equal(resolution.runtimeSwfUnresolved, 1);
  assert.equal(resolution.unresolvedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(resolution.companionFlaSha256,
    "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263");
  assert.equal(resolution.companionFlaIsRuntimeSubstitute, false);
  assert.equal(plan.blockers.keyTerms.dependencyClosureComplete, false);
});

test("retains the MP3, L10, VB003, renderer, and strict-completion blockers", () => {
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.expectedSha256UnknownCount, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.candidateObjectCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.sourceDependencyClosure, false);
  assert.equal(plan.template.contractVersion, 13);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.authoritativeRuntimeSessions, 0);
  assert.equal(plan.template.authoritativeCapturedFrames, 0);
  assert.equal(plan.template.registeredFormalRendererCount, 0);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.currentEvidence.vb003GapV2.decision, "DO_NOT_APPLY");
});

test("keeps every operation and acceptance authority false", () => {
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  for (const key of [
    "planMayCreateReviewTasks",
    "planMayRunPhaseAOrPhaseB",
    "planMayImplementOrTestProductionHelper",
    "planMayExecuteOriginalRuntime",
    "planMayApplySourcePromotion",
    "planMayStartBatch",
    "planMayIntegrateOrPublish",
    "keyTermV1ClosesRuntimeDependency",
    "keyTermV1AuthorizesPlacementOrCaseMapping",
    "keyTermV1AuthorizesPromotion",
    "keyTermV1AuthorizesRuntimeOrAcceptance",
  ]) assert.equal(plan.authorityBoundary[key], false, key);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
});

test("validator rejects Key Term admission, closure, wave start, or integration", () => {
  const keyTermAdmission = structuredClone(plan);
  keyTermAdmission.blockers.keyTerms.resolutionPlan
    .automaticPlacementOrCaseAdmissionAuthorized = true;
  assert.throws(() => validatePlanV6(keyTermAdmission));

  const keyTermClosure = structuredClone(plan);
  keyTermClosure.blockers.keyTerms.resolutionPlan.sourceDependencyClosure = true;
  assert.throws(() => validatePlanV6(keyTermClosure));

  const wave = structuredClone(plan);
  wave.waves[0].admissionStatus = "admitted";
  assert.throws(() => validatePlanV6(wave));

  const integration = structuredClone(plan);
  integration.atomicWholeCourseIntegration.integrationAllowed = true;
  assert.throws(() => validatePlanV6(integration));
});

test("CLI exposes only deterministic plan write and check modes", () => {
  assert.equal(parseArguments(["--write"]), "--write");
  assert.equal(parseArguments(["--check"]), "--check");
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /forbidden/u);
  assert.throws(() => parseArguments(["--launch"]), /forbidden/u);
});

test("no-clobber output refuses an existing path", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-whole-course-v6-"),
  ));
  try {
    const output = path.join(temporary, "plan.json");
    await writeNoClobber(output, "exact\n");
    await assert.rejects(writeNoClobber(output, "exact\n"), /EEXIST/u);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("checked-in JSON and Markdown exactly equal live derivation", async () => {
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.json`), "utf8"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.md`), "utf8"),
    renderMarkdown(plan),
  );
  assert.equal(plan.inputSetSha256,
    "9fc4b6228b24233c52effa7a964f6433f6876b116a1e07275e3b48d46b2b9797");
  assert.equal(plan.planFingerprintSha256,
    "076587b8f281518005b58aa886fe1abf56401e5a23298418ff7b27114cc54489");
});

test("check mode repeats v5, Key Term, canonical, and quarantine validation", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
