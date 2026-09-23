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
  validatePlanV7,
  writeNoClobber,
} from "./build-g4-whole-course-batch-integration-plan-v7.mjs";

let snapshot;
let plan;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  plan = derivePlan(snapshot);
});

test("binds exact v6 and revalidates its inherited 59-input closure", () => {
  assert.equal(validatePlanV7(plan), true);
  assert.equal(plan.successorOf.sha256,
    "dc3c823b78144690eb5990fd2076cd21bc8b2737ec17e0236915ffc71cea7725");
  assert.equal(plan.successorOf.planFingerprintSha256,
    "076587b8f281518005b58aa886fe1abf56401e5a23298418ff7b27114cc54489");
  assert.equal(plan.predecessorDisposition.v6.preserved, true);
  assert.equal(plan.predecessorDisposition.v6.modified, false);
  assert.equal(Object.keys(plan.inputBindings).length, 67);
});

test("preserves the 12-lesson 657-member denominator and zero waves", () => {
  assert.deepEqual({
    lessons: plan.courseBaseline.lessonCount,
    pages: plan.courseBaseline.pageCount,
    shells: plan.courseBaseline.shellCount,
    members: plan.courseBaseline.memberCount,
    currentJs: plan.courseBaseline.currentJsMembers,
    gap: plan.courseBaseline.currentJsGap,
    strict: plan.courseBaseline.strictCompleteMembers,
  }, {
    lessons: 12,
    pages: 645,
    shells: 12,
    members: 657,
    currentJs: 43,
    gap: 614,
    strict: 0,
  });
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 && wave.executable === false));
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
});

test("binds the complete 317-target Key Term frozen-ledger scan", () => {
  const resolution = plan.blockers.keyTerms.resolutionPlan;
  assert.equal(resolution.version, 2);
  assert.equal(resolution.targetRuntimeGapCount, 317);
  assert.equal(resolution.expectedRuntimeSha256AcceptedCount, 0);
  assert.equal(resolution.expectedRuntimeSha256UnacceptedCount, 317);
  assert.equal(resolution.existingQuarantineReviewCandidateCount, 316);
  assert.equal(resolution.frozenV7V8LedgerFileCount, 6060);
  assert.equal(resolution.frozenV7V8PathFieldCount, 12120);
  assert.equal(resolution.frozenV7V8ExactSuffixMatchCount, 0);
  assert.equal(resolution.frozenV7V8CaseInsensitiveSuffixMatchCount, 0);
  assert.equal(resolution.frozenV7V8BasenameMatchCount, 0);
  assert.equal(resolution.frozenV7V8CandidateObjectCount, 0);
  assert.equal(resolution.selectedCandidateCount, 0);
  assert.equal(resolution.frozenV7V8UnionDigestSetSha256,
    "705c93bd496e8979e14a10b66e3cb376c1f00d9d417a6c4a6acc4790169ac9ed");
});

test("preserves v1 canonical and DIG evidence while leaving Polynomial unresolved", () => {
  const resolution = plan.blockers.keyTerms.resolutionPlan;
  assert.equal(resolution.canonicalFilesRehashed, 443);
  assert.equal(resolution.quarantineFilesRehashed, 1594);
  assert.equal(resolution.quarantineBytesRehashed, 169045760);
  assert.equal(resolution.candidateReviewHolds, 316);
  assert.equal(resolution.exactPlacementReviewHolds, 17);
  assert.equal(resolution.caseVariantPlacementReviewHolds, 299);
  assert.equal(resolution.runtimeSwfUnresolved, 1);
  assert.equal(resolution.unresolvedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(resolution.companionFlaIsRuntimeSubstitute, false);
  assert.equal(resolution.sourceDependencyClosure, false);
  assert.equal(resolution.automaticPlacementOrCaseAdmissionAuthorized, false);
  assert.equal(resolution.promotionRecordCount, 0);
});

test("retains MP3, L10, VB003, renderer, and strict-completion blockers", () => {
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

test("keeps every operation, integration, and acceptance authority false", () => {
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
    "keyTermV2ClosesRuntimeDependency",
    "keyTermV2AuthorizesFrozenObjectPayloadRead",
    "keyTermV2AuthorizesPlacementOrCaseMapping",
    "keyTermV2AuthorizesPromotion",
    "keyTermV2AuthorizesRuntimeOrAcceptance",
  ]) assert.equal(plan.authorityBoundary[key], false, key);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
});

test("validator rejects a frozen candidate, Key Term closure, wave start, or integration", () => {
  const candidate = structuredClone(plan);
  candidate.blockers.keyTerms.resolutionPlan.frozenV7V8CandidateObjectCount = 1;
  assert.throws(() => validatePlanV7(candidate));

  const closure = structuredClone(plan);
  closure.blockers.keyTerms.resolutionPlan.sourceDependencyClosure = true;
  assert.throws(() => validatePlanV7(closure));

  const wave = structuredClone(plan);
  wave.waves[0].admissionStatus = "admitted";
  assert.throws(() => validatePlanV7(wave));

  const integration = structuredClone(plan);
  integration.atomicWholeCourseIntegration.integrationAllowed = true;
  assert.throws(() => validatePlanV7(integration));
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
    path.join(os.tmpdir(), "g4-whole-course-v7-"),
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
    "d0dc063e2ce406e07b81479585973a61426d5c9e0c7c4374c692ea30c7b3f4aa");
  assert.equal(plan.planFingerprintSha256,
    "b07bebcf6fbab1ae64dde3605accbec2e1878684aa9d207dbeb1ef4753702723");
});

test("check mode repeats v6, Key Term v2, canonical, quarantine, and ledger validation", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
