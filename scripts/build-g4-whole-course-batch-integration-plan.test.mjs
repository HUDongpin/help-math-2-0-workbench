import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OUTPUT_PATH,
  derivePlan,
  parseCliArgs,
  readSnapshot,
  runCli,
  validatePlan,
  writeNoClobber,
} from "./build-g4-whole-course-batch-integration-plan.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("recomputes the exact 657-member Grade 4 baseline", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.deepEqual(plan.courseBaseline, {
    grade: 4,
    lessonCount: 12,
    pageCount: 645,
    shellCount: 12,
    memberCount: 657,
    currentJsPages: 41,
    currentJsShells: 2,
    currentJsMembers: 43,
    currentJsGap: 614,
    strictCompleteMembers: 0,
    publishedLessonCount: 0,
    rendererCompleteLessons: [3],
    orderedPageSetSha256:
      "030d5600305036ae584420beab9baea92e99e20b0f7e5046743e4e7f15c800fd",
    custodyIsNotAcceptance: true,
  });
});

test("partitions every non-template lesson once into four exact waves", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.deepEqual(plan.waves.map(({ waveId, lessonNumbers, members,
    currentJsMembers, currentJsGap, missingMp3 }) => ({
    waveId, lessonNumbers, members, currentJsMembers, currentJsGap, missingMp3,
  })), [
    { waveId: "W1", lessonNumbers: [1, 2], members: 149, currentJsMembers: 2,
      currentJsGap: 147, missingMp3: 14 },
    { waveId: "W2", lessonNumbers: [3, 7, 12], members: 167, currentJsMembers: 40,
      currentJsGap: 127, missingMp3: 0 },
    { waveId: "W3", lessonNumbers: [4, 8, 11], members: 146, currentJsMembers: 0,
      currentJsGap: 146, missingMp3: 1 },
    { waveId: "W4", lessonNumbers: [5, 6, 9], members: 148, currentJsMembers: 1,
      currentJsGap: 147, missingMp3: 1 },
  ]);
  assert.deepEqual(plan.waveMembership.lessons, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);
  assert.deepEqual(plan.waveMembership.subtotal, {
    pages: 599,
    shells: 11,
    members: 610,
    currentJsMembers: 43,
    currentJsGap: 567,
  });
});

test("keeps every wave planned, unadmitted, and non-executable", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 &&
    wave.executable === false &&
    wave.executorPresent === false &&
    wave.acceptanceEffect === "none"));
});

test("preserves exact audio, Key Term, localization, and quiz denominators", async () => {
  const blockers = derivePlan(await snapshotPromise).blockers;
  assert.equal(blockers.audio.expected, 2086);
  assert.equal(blockers.audio.present, 2070);
  assert.equal(blockers.audio.missing, 16);
  assert.deepEqual(blockers.audio.missingByLesson, { "2": 14, "6": 1, "8": 1 });
  assert.deepEqual(blockers.audio.missingByWave, { W1: 14, W2: 0, W3: 1, W4: 1 });
  assert.equal(blockers.audio.unboundFinalQuizCandidatesExcluded, 647);
  assert.equal(blockers.keyTerms.totalReviewHolds, 316);
  assert.equal(blockers.keyTerms.caseVariantPlacementReviewHolds, 299);
  assert.equal(blockers.keyTerms.exactPlacementShaReceiptReviewHolds, 17);
  assert.equal(blockers.keyTerms.residualUnresolvedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(blockers.localization.bilingualSections, 96);
  assert.equal(blockers.localization.sourceSpanishPageTitles, 470);
  assert.equal(blockers.localization.explicitEnglishFallbacks, 175);
  assert.equal(blockers.localization.fallbackIsTranslationAcceptance, false);
  assert.deepEqual(blockers.quiz, {
    wrapperCount: 36,
    inspectedTargetSwfCount: 12,
    audioBoundTargetSwfCount: 8,
    boundTargetQuestionLabelOccurrences: 212,
    externallyAudioBoundUniqueQuestionLabelCount: 157,
    denominatorsAreInterchangeable: false,
  });
});

test("requires ten missing lesson releases and a future 0-or-12 course gate", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.deepEqual(plan.blockers.releaseDefinitions, {
    currentGrade4Count: 2,
    currentLessons: [3, 10],
    requiredCount: 12,
    missingCount: 10,
    missingLessons: [1, 2, 4, 5, 6, 7, 8, 9, 11, 12],
  });
  const atomic = plan.atomicWholeCourseIntegration;
  assert.equal(atomic.currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.deepEqual(atomic.permittedPublishedLessonCounts, [0, 12]);
  assert.deepEqual(atomic.forbiddenPartialPublishedLessonCounts,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(atomic.currentPublishedLessonCount, 0);
  assert.equal(atomic.commit.partialCommitAllowed, false);
  assert.equal(atomic.commit.wavePublicationAllowed, false);
  assert.equal(atomic.integrationAllowed, false);
  assert.equal(atomic.publicationAllowed, false);
});

test("binds L10 v4 transitive closure and refuses admission while templateStable is false", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.equal(plan.template.contract.sha256,
    "c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261");
  assert.equal(plan.template.contractVersion, 4);
  assert.deepEqual(plan.template.recursiveLocalCandidateCodeClosure, {
    records: 53,
    sha256: "a5105dbfc86efd9111975395cfc2f7c3d6cbda7d2ae072e30dbafb23bbebf893",
  });
  assert.deepEqual(plan.template.digestDeclaredRuntimeAssetClosure, {
    records: 24,
    sha256: "b736fa0a4434788032dc7fdea4251cd802560ec2c6b9aa29a75ff41f2ed825a8",
    digestMismatches: 0,
  });
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.batchAdmissionAllowed, false);
  assert.equal(plan.template.downstreamTransactionDecision, "DO_NOT_APPLY");
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
});

test("rejects template, promotion, or acceptance escalation", async () => {
  const templateFixture = cloneSnapshot(await snapshotPromise);
  templateFixture.records.l10Template.document.templateStable = true;
  assert.throws(() => derivePlan(templateFixture));

  const promotionFixture = cloneSnapshot(await snapshotPromise);
  promotionFixture.records.sourceSuccessor.document.decision.promotionRecordCount = 1;
  assert.throws(() => derivePlan(promotionFixture));

  const plan = derivePlan(await snapshotPromise);
  plan.acceptanceEffects.wholeCoursePublication = true;
  assert.throws(() => validatePlan(plan));
});

test("writeNoClobber creates once, accepts exact bytes, and rejects foreign bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-batch-plan-test-"));
  const target = path.join(root, "plan.json");
  try {
    assert.equal(await writeNoClobber(target, "exact\n"), "created");
    assert.equal(await writeNoClobber(target, "exact\n"), "already-current");
    await assert.rejects(() => writeNoClobber(target, "foreign\n"),
      /exists with different bytes/);
    assert.equal(await readFile(target, "utf8"), "exact\n");
    await writeFile(path.join(root, "unrelated"), "keep\n", { flag: "wx" });
    assert.equal(await readFile(path.join(root, "unrelated"), "utf8"), "keep\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires exactly one explicit CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--unsafe"]), /Expected --write or --check/);
  assert.throws(() => parseCliArgs(["--check", "extra"]), /Usage/);
});

test("checked-in plan exactly matches recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.equal(result.checked, OUTPUT_PATH);
});
