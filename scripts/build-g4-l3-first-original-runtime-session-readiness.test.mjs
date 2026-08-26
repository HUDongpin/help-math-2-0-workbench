import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildFirstOriginalRuntimeSessionReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateFirstOriginalRuntimeSessionReadiness,
} from "./build-g4-l3-first-original-runtime-session-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildFirstOriginalRuntimeSessionReadiness();
  return reportPromise;
}

test("selects TS006 deterministically ahead of IN003 without claiming runtime proof", async () => {
  const report = await buildOnce();
  assert.equal(report.candidateSelection.eligibleCandidateCount, 2);
  assert.equal(report.candidateSelection.selectedAnimationId, "course-g04-l03-ts-006");
  assert.deepEqual(report.candidateSelection.ranking.map((candidate) => [
    candidate.animationId,
    candidate.staticallyReachableDeclaredFrameCount,
  ]), [
    ["course-g04-l03-ts-006", 139],
    ["course-g04-l03-in-003", 483],
  ]);
  assert.equal(report.candidateSelection.selectionIsRuntimeReachabilityOrFidelityEvidence, false);
});

test("binds the exact TS006 sources, authoring result, runtime candidate, and zero external operations", async () => {
  const report = await buildOnce();
  const item = report.selectedCandidate;
  assert.equal(item.source.swf.sha256, "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47");
  assert.equal(item.source.fla.sha256, "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd");
  assert.equal(item.nativeRuntimeFacts.staticallyRootReachableDeclaredFrameCountSum, 139);
  assert.equal(item.authoringGate.status, "verified-work-only-authoring-audit");
  assert.equal(item.authoringGate.dialogOperator, "Dr. Peter Hu");
  assert.equal(item.runtimeEnvironmentPrerequisite.runtimeVersion, "32.0.0.414");
  assert.equal(item.runtimeContainmentPrerequisite.exactExternalOperationCount, 0);
});

test("proves the conservative static envelope fits the refreshed snapshot with reserve", async () => {
  const report = await buildOnce();
  const capacity = report.boundedCapacityEnvelope;
  assert.equal(capacity.reachableDeclaredFramesPerLanguage, 139);
  assert.equal(capacity.logicalEvidenceFrames, 278);
  assert.equal(capacity.pngObjectCount, 834);
  assert.equal(capacity.remainingEvidenceSafetyMultiplier, 1.20);
  assert.equal(capacity.operationalReserveBytes, 100 * 1024 ** 3);
  assert.ok(capacity.incrementalBytes > 4 * 1024 ** 3);
  assert.ok(capacity.headroomBytesAfterEnvelopeAndReserve > 0);
  assert.equal(capacity.boundedStaticEnvelopeFitsWithReserve, true);
  assert.equal(capacity.livePreflightStillRequired, true);
  assert.equal(capacity.envelopeIsFidelityOrExecutionAuthorization, false);
});

test("binds the exact read-only CR-02 host tree without approving it", async () => {
  const report = await buildOnce();
  const hostTree = report.sessionControls.readOnlyLocalDependencyAllowlist;
  assert.equal(report.sourceBindings.ts006ReadOnlyHostTree.reportType,
    "g4-l3-ts006-read-only-original-runtime-host-tree");
  assert.deepEqual(report.sessionControls.preparedControlIds, ["CR-02"]);
  assert.equal(hostTree.controlId, "CR-02");
  assert.equal(hostTree.files, 657);
  assert.equal(hostTree.bytes, 35_469_789);
  assert.deepEqual(hostTree.filesByExtension, {mp3: 146, swf: 508, xml: 3});
  assert.equal(hostTree.stagedRoot.fileMode, "0444");
  assert.equal(hostTree.stagedRoot.directoryMode, "0555");
  assert.equal(hostTree.approved, false);
  assert.equal(hostTree.verifiedForExecution, false);
  assert.equal(report.executionGate.readOnlyLocalDependencyAllowlistBound, true);
});

test("binds a deterministic EN and ES protocol draft without accepting a schedule", async () => {
  const report = await buildOnce();
  const protocol = report.requiredNaturalEvidence.protocolDraft;
  assert.equal(report.sourceBindings.ts006SessionProtocolDraft.reportType,
    "g4-l3-ts006-original-runtime-session-protocol-draft");
  assert.equal(report.requiredNaturalEvidence.protocolDraftPrepared, true);
  assert.equal(protocol.state, "draft-not-scheduled-not-authorized");
  assert.equal(protocol.candidateIds.length, 2);
  assert.equal(protocol.entryStateCandidateSha256Values.length, 2);
  assert.deepEqual(protocol.stepIds, ["P00", "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09"]);
  assert.equal(protocol.authoritativeScheduleEstablished, false);
  assert.equal(report.executionGate.naturalTraceProtocolDraftPrepared, true);
  assert.equal(report.executionGate.naturalTraceScheduleEstablished, false);
  assert.equal(report.summary.naturalTraceProtocolDraftsPrepared, 1);
  assert.equal(report.summary.naturalTraceSchedulesEstablished, 0);
});

test("keeps schedules, controls, operator worksheet, execution, and acceptance closed", async () => {
  const report = validateFirstOriginalRuntimeSessionReadiness(await buildOnce());
  assert.equal(report.requiredNaturalEvidence.requirementIds.length, 0);
  assert.equal(report.requiredNaturalEvidence.traceIds.length, 0);
  assert.equal(report.requiredNaturalEvidence.captureSchedule.length, 0);
  assert.equal(report.sessionControls.approvedControlIds.length, 0);
  assert.equal(report.sessionControls.launchCommand, null);
  assert.equal(report.operatorWorksheet.namedOriginalRuntimeOperator, null);
  assert.equal(report.executionGate.boundedStaticCapacityEnvelopeFitsWithReserve, true);
  assert.equal(report.executionGate.containmentControlsApproved, false);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  assert.equal(report.acceptance.authoritativeOriginalRuntimeAccepted, false);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("validator rejects a fabricated operator, schedule, approval, or launch readiness", async () => {
  const report = await buildOnce();
  const operator = structuredClone(report);
  operator.operatorWorksheet.namedOriginalRuntimeOperator = "Someone";
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(operator), /operator worksheet is not empty/);
  const schedule = structuredClone(report);
  schedule.requiredNaturalEvidence.traceIds.push("trace:invented");
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(schedule), /schedule was promoted/);
  const acceptedDraft = structuredClone(report);
  acceptedDraft.requiredNaturalEvidence.protocolDraft.authoritativeScheduleEstablished = true;
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(acceptedDraft), /schedule was promoted/);
  const approval = structuredClone(report);
  approval.executionGate.containmentControlsApproved = true;
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(approval), /execution gate/);
  const hostTreeApproval = structuredClone(report);
  hostTreeApproval.sessionControls.readOnlyLocalDependencyAllowlist.approved = true;
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(hostTreeApproval), /session controls/);
  const launch = structuredClone(report);
  launch.executionGate.originalRuntimeExecutionReady = true;
  assert.throws(() => validateFirstOriginalRuntimeSessionReadiness(launch), /execution gate/);
});

test("checked-in outputs are deterministic and CLI cannot launch or approve", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-first-original-runtime-session-readiness.json", "utf8"),
    readFile("reports/g4-l3-first-original-runtime-session-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.match(markdown, /course-g04-l03-ts-006/);
  assert.match(markdown, /Operator-protocol draft/);
  assert.match(markdown, /Execution remains \*\*closed\*\*/);
  const options = parseArguments(["--check", "--json-output", "reports/a.json", "--markdown-output", "reports/a.md"]);
  assert.equal(options.check, true);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
