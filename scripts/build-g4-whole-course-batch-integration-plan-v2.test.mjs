import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
} from "./build-g4-whole-course-batch-integration-plan-v2.mjs";

const snapshotPromise = readSnapshot();

test("preserves v1 and corrects its overstated platform invariant", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.equal(plan.successorOf.sha256,
    "7d80bd3adbad6b7a71c3fede38455cce43454b956450ecbc3214d2b96ab27847");
  assert.equal(plan.predecessorDisposition.status,
    "rejected-p1-current-platform-invariant-overstated");
  assert.equal(plan.predecessorDisposition.preserved, true);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformInvariant.mode,
    "mixed-defined-release-atomic-and-uncontrolled-individual-publication");
});

test("binds direct publisher evidence for the uncontrolled individual fallback", async () => {
  const snapshot = await snapshotPromise;
  assert.match(snapshot.records.lessonPublisher.text,
    /if \(controllingDefinitions\.length === 0\) return true;/u);
  assert.match(snapshot.records.lessonPublisherTests.text,
    /unrelated strict items retain individual publication/u);
  const plan = derivePlan(snapshot);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformInvariant
    .uncontrolledStrictCompleteTargets, "individual-publication-fallback");
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed, false);
});

test("retains zero current leakage while refusing to call the future risk closed", async () => {
  const risk = derivePlan(await snapshotPromise).atomicWholeCourseIntegration.currentPlatformRisk;
  assert.deepEqual({
    strict: risk.currentStrictCompleteMembers,
    published: risk.currentPublishedGrade4Lessons,
    leak: risk.currentLeakObserved,
    futureClosed: risk.futureRiskClosed,
  }, { strict: 0, published: 0, leak: false, futureClosed: false });
});

test("derives rather than merely literals the current-JS and section denominators", async () => {
  const derived = derivePlan(await snapshotPromise).derivedDenominators;
  assert.equal(derived.currentJsPages, 41);
  assert.equal(derived.currentJsShells, 2);
  assert.equal(derived.currentJsMembers, 43);
  assert.equal(derived.sectionCount, 96);
  assert.equal(derived.lessonSections.length, 12);
  assert.ok(derived.lessonSections.every(({ sectionCount }) => sectionCount === 8));
});

test("records grade-wide Key Term candidates without treating them as runtime resolution", async () => {
  const keyTerms = derivePlan(await snapshotPromise).blockers.keyTerms;
  assert.equal(keyTerms.gradeWideStaticCandidates.english.entries, 761);
  assert.equal(keyTerms.gradeWideStaticCandidates.spanish.entries, 753);
  assert.equal(keyTerms.gradeWideStaticCandidates.english.runtimeResolutionVerified, false);
  assert.equal(keyTerms.gradeWideStaticCandidates.spanish.runtimeResolutionVerified, false);
  assert.equal(keyTerms.gradeWideStaticCandidates.substitutesForLessonRuntimeResolution, false);
});

test("records all 12 unresolved bilingual lesson Key Term declarations", async () => {
  assert.deepEqual(derivePlan(await snapshotPromise).blockers.keyTerms.lessonDeclarations, {
    lessonCount: 12,
    englishCanonicalPresent: 0,
    spanishCanonicalPresent: 0,
    runtimeResolutionVerified: 0,
    declarationPathsBoundByAlignment: true,
  });
});

test("requires definitions and a reviewed 0-or-12 adapter before strict writes", async () => {
  const atomic = derivePlan(await snapshotPromise).atomicWholeCourseIntegration;
  assert.equal(atomic.currentPlatformInvariant.grade4DefinedLessonCount, 2);
  assert.equal(atomic.currentPlatformInvariant.grade4UndefinedLessonCount, 10);
  assert.equal(atomic.prepare.requireNoUncontrolledIndividualPublicationFallback, true);
  assert.equal(atomic.requiredSequencing.length, 4);
  assert.equal(atomic.integrationAllowed, false);
  assert.equal(atomic.publicationAllowed, false);
});

test("keeps four exact waves at zero admission and every effect false", async () => {
  const plan = derivePlan(await snapshotPromise);
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.ok(plan.waves.every(({ admittedLessonCount, executable }) =>
    admittedLessonCount === 0 && executable === false));
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(validatePlan(plan), true);
});

test("writeNoClobber creates once and rejects different bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-batch-v2-test-"));
  const target = path.join(root, "plan.json");
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

test("requires exactly one plan-artifact CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--apply"]), /Expected --write or --check/);
});

test("checked-in v2 plan exactly matches recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.equal(result.checked, OUTPUT_PATH);
});
