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
} from "./build-g4-l10-complete-migration-template-contract-v3.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("preserves and explicitly rejects the incomplete v2 attempt", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.predecessorDisposition.v2.preserved, true);
  assert.equal(report.predecessorDisposition.v2.status,
    "rejected-p1-live-currentness-closure-incomplete");
  assert.equal(report.predecessorDisposition.v2.artifacts.json.sha256,
    "8a67d3a57b18442809fe70b8359d65b79e055a9435cb624bb40608b02256db74");
  assert.equal(report.predecessorDisposition.v2.acceptanceEffect, "none");
});

test("dynamically binds all 269 whole-lesson member records", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(report.liveWholeLessonClosure.memberLevel.setSha256,
    "d47014d06d2e23f197c97ee8d8aae46c75106980645fad158066eb6fcc284319");
  assert.deepEqual(report.liveWholeLessonClosure.migrationStatus, {
    preserved: 47,
    required: 47,
  });
  assert.equal(report.liveWholeLessonClosure.sourceIdentityMismatchCount, 0);
});

test("recomputes all 520 bilingual requirements and 44,488 frames", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.deepEqual(report.liveWholeLessonClosure.bilingualRequirementCount, {
    en: 260,
    es: 260,
  });
  assert.equal(report.liveWholeLessonClosure.memberFrameDomainPairCount, 260);
  assert.deepEqual(report.liveWholeLessonClosure.requirementState, {
    total: 520,
    blocked: 520,
    baselineAuthorityUnresolved: 520,
    strictAcceptanceEffectNone: 520,
  });
  assert.deepEqual(report.currentFormalState.frameObligations, {
    total: 44488,
    root: 1020,
    nested: 43468,
    authoritativeCaptured: 0,
  });
});

test("binds live 24-candidate code and four zero-reference registries", async () => {
  const code = deriveContract(await snapshotPromise).liveWholeLessonClosure.candidateCode;
  assert.equal(code.candidateCount, 24);
  assert.equal(code.declaredFrameCount, 6260);
  assert.equal(code.moduleClosure.recordCount, 24);
  assert.equal(code.moduleClosure.setSha256,
    "7489804dfaf22e7b582a4561820194cc5a525b245e88d1a9c981fdf6636ba199");
  assert.equal(code.timelineClosure.recordCount, 24);
  assert.equal(code.timelineClosure.setSha256,
    "3fac5d4516ac664ad326fcc46282a234bd897ede10453ff5000e4feebe3a64ad");
  assert.equal(Object.keys(code.registryBindings).length, 4);
  assert.equal(code.registryReferenceCount, 0);
});

test("distinguishes live engineering candidates from two browser diagnostics", async () => {
  const state = deriveContract(await snapshotPromise).currentFormalState.javascript;
  assert.equal(state.engineeringCandidateCount, 24);
  assert.equal(state.localCandidateFrameCount, 6260);
  assert.equal(state.boundDiagnosticFrameCount, 210);
  assert.equal(state.registeredFormalRendererCount, 0);
  assert.equal(state.formalRendererFieldsComplete, 0);
  assert.equal(state.diagnosticFormalEffect, 0);
  assert.equal(state.datedV2ContinuationCandidateSnapshot.disposition,
    "superseded-by-live-candidate-closure");
});

test("recomputes checklists, audio inventory, and pending reviews", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.deepEqual(report.liveWholeLessonClosure.checklist, {
    checked: 0,
    total: 2726,
  });
  assert.deepEqual(report.liveWholeLessonClosure.audioInventory, {
    totalRows: 245,
    undRows: 203,
    esRows: 42,
    formalListeningAcceptanceEffect: "none",
  });
  assert.equal(report.currentFormalState.reviewAndRelease.humanPendingMembers, 47);
  assert.equal(report.currentFormalState.reviewAndRelease.engineeringPendingMembers, 47);
  assert.equal(report.currentFormalState.reviewAndRelease.ownerPendingMembers, 47);
});

test("limits SWF-only N/A to the FLA authoring subgate", async () => {
  const authoring = deriveContract(await snapshotPromise).currentFormalState.authoring;
  assert.equal(authoring.flaApplicable, 34);
  assert.equal(authoring.swfOnlyFlaAuthoringAuditNotApplicable, 13);
  assert.match(authoring.swfOnlyBoundary,
    /only to the FLA\/Adobe Animate authoring-audit subgate/);
  assert.match(authoring.swfOnlyBoundary, /all 13 still require SWF audit/);
});

test("records exact task provenance with no acceptance effect", async () => {
  const writer = deriveContract(await snapshotPromise)
    .evidenceEpochClosure.writerAttribution;
  assert.equal(writer.taskId, "019fc03e-a691-7553-98a6-195a74688d81");
  assert.equal(writer.title, "继续完成 L10 正式迁移");
  assert.equal(writer.taskStatusAtAttribution, "systemError");
  assert.equal(writer.latestTurnStatus, "completed");
  assert.equal(writer.metadataAcceptanceEffect, "none");
});

test("keeps transaction and human launch gates closed", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.blockedByDownstreamTransactionP0, true);
  assert.equal(report.nextNamedHumanAction.requiresP0FixAndIndependentReview, true);
  assert.equal(report.nextNamedHumanAction.requiresNewQuiescentPreflight, true);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
});

test("rejects member coverage drift in derived live totals", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  const key = "member:course-g04-l10-vb-003:coverage";
  fixture.records[key].document.requirements[0].capturedFrameCount = 1;
  assert.throws(() => deriveContract(fixture));
});

test("rejects candidate or registry authority drift", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records.prototypeRegistry.text += "\ncourse-g04-l10-vb-003\n";
  assert.throws(() => deriveContract(fixture));
});

test("rejects any contract acceptance escalation", async () => {
  const report = deriveContract(await snapshotPromise);
  report.acceptanceEffects.ownerAcceptance = true;
  assert.throws(() => validateContract(report));
});

test("renders live-currentness and failed-attempt boundaries", async () => {
  const markdown = renderMarkdown(deriveContract(await snapshotPromise));
  assert.match(markdown, /269 member-level records/);
  assert.match(markdown, /24 source-static engineering candidates \/ 6,260/);
  assert.match(markdown, /0\/2,726 checklist items checked/);
  assert.match(markdown, /v2 is preserved but rejected/);
  assert.match(markdown, /not currently authorized/);
  assert.match(markdown, /DO_NOT_APPLY/);
});

test("requires exactly one explicit CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--unsafe"]), /Expected --write or --check/);
  assert.throws(() => parseCliArgs(["--check", "extra"]), /Usage/);
});

test("checked-in v3 JSON and Markdown exactly match recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.deepEqual(result.checked, [REPORT_JSON, REPORT_MARKDOWN]);
});
