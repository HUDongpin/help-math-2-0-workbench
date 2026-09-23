import assert from "node:assert/strict";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  deriveContract,
  parseCliArgs,
  readSnapshot,
  renderMarkdown,
  runCli,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v2.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("binds the whole 47-member L10 release, not only VB003", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.scope.activePageCount, 46);
  assert.equal(report.scope.shellCount, 1);
  assert.equal(report.scope.templatePlacement.animationId, "course-g04-l10-vb-003");
  assert.equal(report.scope.templatePlacement.ordinal, 7);
  assert.equal(report.scope.publicationMode, "atomic");
});

test("recomputes exact authoring, requirement, and frame obligations", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.deepEqual(report.currentFormalState.authoring, {
    flaApplicable: 34,
    swfOnlyNotApplicable: 13,
    verified: 0,
    pending: 34,
  });
  assert.deepEqual(report.currentFormalState.requirements, {
    total: 520,
    rootReady: 94,
    unresolvedNested: 426,
    naturalScheduleReady: 0,
    unresolvedFrameDomainDispositions: 74,
  });
  assert.deepEqual(report.currentFormalState.frameObligations, {
    total: 44488,
    root: 1020,
    nested: 43468,
    authoritativeCaptured: 0,
  });
});

test("keeps diagnostic JavaScript and Ruffle acceptance-neutral", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.currentFormalState.javascript.engineeringCandidateCount, 8);
  assert.equal(report.currentFormalState.javascript.registeredCandidateCount, 0);
  assert.equal(report.currentFormalState.javascript.boundDiagnosticFrameCount, 210);
  assert.equal(report.currentFormalState.javascript.diagnosticFormalEffect, 0);
  assert.deepEqual(report.currentFormalState.ruffle, {
    forensicObservationCount: 94,
    originalRuntimeAuthority: false,
    acceptanceEffect: "none",
  });
});

test("preserves the 16 SHA-unresolved Grade 4 MP3 blockers", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.sourceAndCurriculumBindings.successorPromotionRecordCount, 0);
  assert.equal(report.sourceAndCurriculumBindings.missingCourseMp3Count, 16);
  assert.deepEqual(report.sourceAndCurriculumBindings.missingCourseMp3ByLesson, {
    "2": 14,
    "6": 1,
    "8": 1,
  });
  assert.equal(report.sourceAndCurriculumBindings.allMissingMp3ExpectedSha256Known, false);
});

test("records attributed quiescence without converting it into acceptance", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.evidenceEpochClosure.writerAttribution.status, "attributed-and-stopped");
  assert.equal(report.evidenceEpochClosure.boundedQuiescenceObservation.driftCount, 0);
  assert.equal(report.evidenceEpochClosure.boundedQuiescenceObservation.openWriterCount, 0);
  assert.equal(
    report.evidenceEpochClosure.boundedQuiescenceObservation.setSha256,
    "88704c7bd5979ae78e341eb6783d48a702713ae3830daaca1fdc4de35f42c07b",
  );
  assert.equal(report.evidenceEpochClosure.boundedQuiescenceObservation.acceptanceEffect, "none");
});

test("keeps every substantive gate closed and template admission false", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.templateStable, false);
  assert.equal(report.gates.filter((item) => item.satisfied).length, 1);
  assert.equal(report.gates[0].id, "source-custody");
  assert.ok(report.gates.slice(1).every((item) => item.satisfied === false));
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
});

test("forbids transaction execution and names the exact human gate", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.deepEqual(report.downstreamTransactionBoundary.prohibitedModes, [
    "--apply",
    "--dry-run",
    "--check",
  ]);
  assert.equal(report.nextNamedHumanAction.role, "named authorized Adobe Animate/original-runtime operator");
  assert.equal(report.nextNamedHumanAction.cannotBeAutomated, true);
});

test("rejects diagnostic authority escalation", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records.vb003Diagnostic.document.authorityBoundary.rmseAcceptance = true;
  assert.throws(() => deriveContract(fixture), /rmseAcceptance must remain false/);
});

test("rejects contract acceptance or publication escalation", async () => {
  const report = deriveContract(await snapshotPromise);
  report.acceptanceEffects.ownerAcceptance = true;
  assert.throws(() => validateContract(report));
});

test("renders the decision-critical fail-closed contract", async () => {
  const markdown = renderMarkdown(deriveContract(await snapshotPromise));
  assert.match(markdown, /0\/44,488 authoritative original-runtime frames/);
  assert.match(markdown, /94 root-ready; 426 nested unresolved/);
  assert.match(markdown, /16 unresolved MP3s \(L2: 14, L6: 1, L8: 1\)/);
  assert.match(markdown, /DO_NOT_APPLY/);
  assert.match(markdown, /named authorized Adobe Animate\/original-runtime operator/);
});

test("requires exactly one explicit CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--unsafe"]), /Expected --write or --check/);
  assert.throws(() => parseCliArgs(["--check", "extra"]), /Usage/);
});

test("checked-in v2 JSON and Markdown exactly match recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.deepEqual(result.checked, [REPORT_JSON, REPORT_MARKDOWN]);
});
