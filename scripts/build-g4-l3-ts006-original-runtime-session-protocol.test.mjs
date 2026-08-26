import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildTs006OriginalRuntimeSessionProtocol,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateTs006OriginalRuntimeSessionProtocol,
} from "./build-g4-l3-ts006-original-runtime-session-protocol.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildTs006OriginalRuntimeSessionProtocol();
  return reportPromise;
}

test("binds exact root, nested, script, and audio candidate facts without runtime promotion", async () => {
  const report = await buildOnce();
  assert.equal(report.sourceFacts.rootTimeline.frameCount, 10);
  assert.equal(report.sourceFacts.rootTimeline.frame6Label, "begin");
  assert.deepEqual(report.sourceFacts.nestedTimelineCandidates.map((item) => [
    item.frameDomainCandidateId,
    item.declaredFrameCount,
  ]), [["sprite-3", 1], ["sprite-23", 128]]);
  assert.equal(report.sourceFacts.actionScriptSignals.timelineNavigationOperations, 4);
  assert.equal(report.sourceFacts.actionScriptSignals.randomCallCandidates, 0);
  assert.equal(report.sourceFacts.actionScriptSignals.exactExternalOperationCandidates, 0);
  assert.equal(report.sourceFacts.actionScriptSignals.runtimeReachabilityEstablished, false);
  assert.equal(report.sourceFacts.audioCandidates.embedded.streamBlocks, 128);
  assert.equal(report.sourceFacts.audioCandidates.embedded.languageEstablished, false);
  assert.equal(report.sourceFacts.audioCandidates.catalogSpanishCandidate.durationMsTechnicalProbe, 7_632);
  assert.equal(report.sourceFacts.audioCandidates.catalogSpanishCandidate.spokenLanguageEstablished, false);
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.buttonObjectId, "217");
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.hitShapeObjectId, "212");
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.depth, "202");
  assert.deepEqual(report.sourceFacts.pageSpanishNarrationControl.nativeStagePoint, {x: 699, y: 95});
  assert.deepEqual(report.sourceFacts.pageSpanishNarrationControl.expectedSourceStateTransition, {
    SAVisible: false,
    SA_PLAYVisible: false,
    SA_PAUSEVisible: true,
    spanSound: true,
    childTimeline: "stopped-until-source-onSoundComplete",
  });
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.sameLessonShellSha256,
    "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e");
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.spanishNarrationAudioCandidateSha256,
    "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688");
  assert.equal(report.sourceFacts.pageSpanishNarrationControl.successfulLoadAudibilitySpokenLanguageSynchronizationEstablished, false);
});

test("prepares deterministic EN and ES planning identities but no authoritative trace", async () => {
  const report = await buildOnce();
  assert.deepEqual(report.traceCandidates.map((candidate) => candidate.language), ["en", "es"]);
  assert.ok(report.traceCandidates.every((candidate) => /^[a-f0-9]{64}$/.test(candidate.entryStateCandidateSha256)));
  assert.ok(report.traceCandidates.every((candidate) => candidate.authoritativeTraceId === null));
  assert.ok(report.traceCandidates.every((candidate) => candidate.authoritativeRequirementIds.length === 0));
  assert.ok(report.traceCandidates.every((candidate) => !candidate.naturalExecutionProved));
});

test("protocol requires natural host entry, separate processes, nested disposition, audio, Replay, and navigation", async () => {
  const report = await buildOnce();
  assert.equal(report.proposedProtocol.directSeekAllowed, false);
  assert.equal(report.proposedProtocol.freshRuntimeProcessPerLanguageRequired, true);
  assert.equal(report.proposedProtocol.sameLessonHostNaturalEntryRequired, true);
  assert.deepEqual(report.proposedProtocol.frameDomainsToDispose, ["root", "sprite-3", "sprite-23"]);
  assert.equal(report.proposedProtocol.steps.length, 10);
  const p02 = report.proposedProtocol.steps.find((step) => step.stepId === "P02");
  const p03 = report.proposedProtocol.steps.find((step) => step.stepId === "P03");
  assert.equal(p02.kind, "natural-page-entry");
  assert.match(p02.instruction, /Enter TS006 through the same-lesson host path before invoking any page-language audio control/);
  assert.match(p02.instruction, /do not invent a pre-entry host-language selector/);
  assert.equal(p03.kind, "page-language-audio");
  assert.match(p03.instruction, /After natural TS006 entry/);
  assert.match(p03.instruction, /En esta p\u00e1gina/);
  assert.match(p03.instruction, /\(699,95\)/);
  assert.match(p03.instruction, /button object 217, hit shape 212, depth 202/);
  assert.match(p03.instruction, /SA_PLAY to SA_PAUSE/);
  const instructions = report.proposedProtocol.steps.map((step) => step.instruction).join("\n");
  assert.doesNotMatch(instructions, /Select the language through the observed host-native path before page entry/);
  assert.match(instructions, /same-lesson host/);
  assert.match(instructions, /frame 128/);
  assert.match(instructions, /Listen to the complete path/);
  assert.match(instructions, /Replay/);
  assert.match(instructions, /Previous and Next/);
  assert.equal(report.proposedProtocol.authoritativeScheduleEstablished, false);
});

test("binds CR-02 preparation while keeping every approval and execution field closed", async () => {
  const report = validateTs006OriginalRuntimeSessionProtocol(await buildOnce());
  assert.deepEqual(report.controls.technicallyPreparedControlIds, ["CR-02"]);
  assert.deepEqual(report.controls.approvedControlIds, []);
  assert.deepEqual(report.controls.allowedOutboundDestinations, []);
  assert.equal(report.executionGate.protocolDraftPrepared, true);
  assert.equal(report.executionGate.readOnlyCR02ArtifactBound, true);
  assert.equal(report.executionGate.containmentControlsApproved, false);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  assert.equal(report.summary.runtimeSessionsExecuted, 0);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("validator rejects fabricated schedule acceptance, operator readiness, or runtime execution", async () => {
  const report = await buildOnce();
  const schedule = structuredClone(report);
  schedule.proposedProtocol.authoritativeScheduleEstablished = true;
  assert.throws(() => validateTs006OriginalRuntimeSessionProtocol(schedule), /proposed protocol/);
  const operator = structuredClone(report);
  operator.executionGate.namedOriginalRuntimeOperatorSupplied = true;
  assert.throws(() => validateTs006OriginalRuntimeSessionProtocol(operator), /execution gate/);
  const runtime = structuredClone(report);
  runtime.summary.runtimeSessionsExecuted = 1;
  assert.throws(() => validateTs006OriginalRuntimeSessionProtocol(runtime), /summary or execution closure/);
  const preEntryLanguageSelection = structuredClone(report);
  preEntryLanguageSelection.proposedProtocol.steps[2] = {
    stepId: "P02",
    kind: "host-language",
    instruction: "Select a host language before page entry.",
  };
  assert.throws(() => validateTs006OriginalRuntimeSessionProtocol(preEntryLanguageSelection), /proposed protocol/);
  const fabricatedAudioOutcome = structuredClone(report);
  fabricatedAudioOutcome.sourceFacts.pageSpanishNarrationControl.successfulLoadAudibilitySpokenLanguageSynchronizationEstablished = true;
  assert.throws(() => validateTs006OriginalRuntimeSessionProtocol(fabricatedAudioOutcome), /page Spanish narration control/);
});

test("checked-in outputs are deterministic and CLI cannot launch or approve", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-ts006-original-runtime-session-protocol-draft.json", "utf8"),
    readFile("reports/g4-l3-ts006-original-runtime-session-protocol-draft.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.match(markdown, /Execution remains \*\*closed\*\*/);
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(() => parseArguments(["--operator", "name"]), /Unknown option/);
});
