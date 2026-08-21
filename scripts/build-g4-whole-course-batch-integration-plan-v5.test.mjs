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
  validatePlanV5,
  writeNoClobber,
} from "./build-g4-whole-course-batch-integration-plan-v5.mjs";

let snapshot;
let plan;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  plan = derivePlan(snapshot);
});

test("binds v4 and revalidates all 36 inherited semantic inputs", () => {
  assert.equal(validatePlanV5(plan), true);
  assert.equal(plan.successorOf.sha256,
    "8b9d42460ec8fee86b0048f5f8d944918cf032f9e736fed5bf59af6f19ecbdd0");
  assert.equal(plan.successorOf.planFingerprintSha256,
    "2724ae17239cba950f4429339cec4f809615ccffcb2ab50d1318b03ac6ecc1ae");
  assert.equal(plan.predecessorDisposition.v4.preserved, true);
  assert.equal(plan.predecessorDisposition.v4.modified, false);
  assert.equal(Object.keys(snapshot.inheritedRecords).length, 36);
  assert.equal(Object.keys(plan.inputBindings).length, 51);
});

test("preserves the complete 12-lesson 657-member denominator and wave design", () => {
  assert.deepEqual({
    lessons: plan.courseBaseline.lessonCount,
    pages: plan.courseBaseline.pageCount,
    shells: plan.courseBaseline.shellCount,
    members: plan.courseBaseline.memberCount,
    currentJs: plan.courseBaseline.currentJsMembers,
    strictComplete: plan.courseBaseline.strictCompleteMembers,
  }, {
    lessons: 12,
    pages: 645,
    shells: 12,
    members: 657,
    currentJs: 43,
    strictComplete: 0,
  });
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 && wave.executable === false));
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
});

test("updates L10 to exact v13 while retaining every closed gate", () => {
  assert.equal(plan.template.contractVersion, 13);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.requirementCount, 520);
  assert.equal(plan.template.naturalScheduleReadyRequirementCount, 0);
  assert.equal(plan.template.unresolvedFrameDomainDispositionCount, 74);
  assert.equal(plan.template.authoritativeRuntimeSessions, 0);
  assert.equal(plan.template.authoritativeCapturedFrames, 0);
  assert.equal(plan.template.registeredFormalRendererCount, 0);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.template.exactAuthorizedMemberCountNow, 0);
  assert.equal(plan.template.activeReviewProtocol, "v2.16");
  assert.equal(plan.template.specReviewQualified, false);
});

test("updates the audio blocker to v2 and records zero frozen-ledger candidates", () => {
  const resolution = plan.blockers.audio.resolutionPlan;
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(resolution.version, 2);
  assert.equal(resolution.expectedSha256KnownCount, 0);
  assert.equal(resolution.expectedSha256UnknownCount, 16);
  assert.equal(resolution.frozenV7V8LedgerFileCount, 6060);
  assert.equal(resolution.frozenV7V8PathFieldCount, 12120);
  assert.equal(resolution.exactCanonicalSuffixMatchCount, 0);
  assert.equal(resolution.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(resolution.basenameMatchCount, 0);
  assert.equal(resolution.candidateObjectCount, 0);
  assert.equal(resolution.sourceDependencyClosure, false);
});

test("binds VB003 tracked-clean currentness without adopting the candidate patch", () => {
  assert.equal(plan.currentEvidence.vb003GapV2.decision, "DO_NOT_APPLY");
  assert.match(plan.currentEvidence.vb003GapV2.trackedWorkspaceSetSha256,
    /^[a-f0-9]{64}$/u);
  assert.equal(plan.authorityBoundary.vb003GapV2AppliesCandidatePatch, false);
});

test("keeps atomic integration design-only and all acceptance effects false", () => {
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  assert.equal(plan.authorityBoundary.planMayCreateReviewTasks, false);
  assert.equal(plan.authorityBoundary.planMayRunPhaseAOrPhaseB, false);
  assert.equal(plan.authorityBoundary.planMayImplementOrTestProductionHelper, false);
  assert.equal(plan.authorityBoundary.planMayExecuteOriginalRuntime, false);
  assert.equal(plan.authorityBoundary.planMayApplySourcePromotion, false);
  assert.equal(plan.authorityBoundary.planMayStartBatch, false);
  assert.equal(plan.authorityBoundary.planMayIntegrateOrPublish, false);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
});

test("validator rejects wave admission, template promotion, MP3 closure, or integration", () => {
  const wave = structuredClone(plan);
  wave.waves[0].admissionStatus = "admitted";
  assert.throws(() => validatePlanV5(wave));

  const template = structuredClone(plan);
  template.template.templateStable = true;
  assert.throws(() => validatePlanV5(template));

  const audio = structuredClone(plan);
  audio.blockers.audio.resolutionPlan.sourceDependencyClosure = true;
  assert.throws(() => validatePlanV5(audio));

  const integration = structuredClone(plan);
  integration.atomicWholeCourseIntegration.integrationAllowed = true;
  assert.throws(() => validatePlanV5(integration));
});

test("CLI exposes only plan write/check modes", () => {
  assert.equal(parseArguments(["--write"]), "--write");
  assert.equal(parseArguments(["--check"]), "--check");
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /forbidden/u);
  assert.throws(() => parseArguments(["--launch"]), /forbidden/u);
});

test("no-clobber output refuses an existing path", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-whole-course-v5-"),
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
});

test("check mode repeats the complete successor input validation", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
