import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyPilotAudioOperatorReadiness,
  cueOperatorContract,
  isHumanOnlyAudioReason,
  validateG4L3AudioProjection,
} from "./build-pilot-audio-operator-readiness.mjs";

const HUMAN_REASONS = [
  "Audio listening acceptance status is pending, not accepted.",
  "Audio cue cue/en spokenContentAndLanguage is not pass.",
  "Audio cue cue/en naturalHostTraversal is not pass.",
  "Audio cue cue/en startStopAndSynchronization is not pass.",
  "Audio cue cue/en replayReset is not pass.",
  "Audio cue cue/en has no listening/traversal evidence.",
  "Audio listening summary.everyCueListened must be true.",
  "Audio listening summary.everyReachableHostStateTraversed must be true.",
  "Audio listening summary.synchronizationAccepted must be true.",
  "Audio listening summary.replayAccepted must be true.",
  "Audio listening review.decision must be accepted.",
  "Audio listening review requires a structurally complete named-human identity and contact/owner ID.",
  "Audio listening review requires a valid ISO signedAt.",
];

test("classifies only untouched current templates with exclusively human reasons as operator-ready", () => {
  assert.ok(HUMAN_REASONS.every(isHumanOnlyAudioReason));
  assert.equal(isHumanOnlyAudioReason("Machine audio audit still has candidate mappings."), false);
  assert.deepEqual(classifyPilotAudioOperatorReadiness({
    strictGateStatus: "fail",
    machineStatus: "prepared-unsigned-template",
    reasons: HUMAN_REASONS,
    pendingTemplateCurrent: true,
    sessionFileCount: 0,
    runtimeArtifactFileCount: 0,
  }), {
    disposition: "unsigned-template-ready-for-named-human-original-runtime-listening",
    operatorReady: true,
    readinessBoundary: "unsigned-template-and-hash-bindings-only; natural host reachability and listening remain human observations",
    strictUnblockingPotential: "audio-gate-can-pass-only-after-valid-human-session-evidence-and-acceptance",
    machineOnlyStrictClosurePossible: false,
  });
  for (const mutation of [
    {reasons: [...HUMAN_REASONS, "Machine audio audit still has candidate mappings."]},
    {pendingTemplateCurrent: false},
    {sessionFileCount: 1},
    {runtimeArtifactFileCount: 1},
  ]) {
    assert.equal(classifyPilotAudioOperatorReadiness({
      strictGateStatus: "fail",
      machineStatus: "prepared-unsigned-template",
      reasons: HUMAN_REASONS,
      pendingTemplateCurrent: true,
      sessionFileCount: 0,
      runtimeArtifactFileCount: 0,
      ...mutation,
    }).disposition, "blocked-before-authoritative-listening");
  }
});

test("keeps no-audio and partial kit dispositions explicit and acceptance-neutral", () => {
  assert.equal(classifyPilotAudioOperatorReadiness({
    strictGateStatus: "pass",
    machineStatus: "not-applicable-source-bound",
    reasons: [],
    pendingTemplateCurrent: true,
    sessionFileCount: 0,
    runtimeArtifactFileCount: 0,
  }).disposition, "no-listening-required-source-bound-no-audio");
  const partial = classifyPilotAudioOperatorReadiness({
    strictGateStatus: "fail",
    machineStatus: "prepared-partial-non-unblocking",
    reasons: ["Spanish source missing"],
    pendingTemplateCurrent: true,
    sessionFileCount: 0,
    runtimeArtifactFileCount: 0,
  });
  assert.equal(partial.disposition, "partial-human-session-possible-but-non-unblocking");
  assert.match(partial.readinessBoundary, /unsigned-template/);
  assert.equal(partial.machineOnlyStrictClosurePossible, false);
});

test("cue operator contract points final evidence into migrations, never into the immutable kit", () => {
  const contract = cueOperatorContract({
    animationId: "formula-elementary-conversion-01-01",
    cue: {cueId: "formula-narration-en", language: "en"},
    template: {
      file: "work/audio-runtime-session-kits-current/formula/evidence/audio-listening-sessions/cue.template.json",
      sha256: "a".repeat(64),
      intendedEvidenceFile: "evidence/audio-listening-sessions/cue.json",
    },
  });
  assert.equal(contract.finalSessionDestination, "migrations/formula-elementary-conversion-01-01/evidence/audio-listening-sessions/cue.json");
  assert.deepEqual(contract.requiredOrderedOperationEvents, ["activate", "start", "stop-or-complete", "replay", "start"]);
  assert.ok(!contract.finalSessionDestination.startsWith("work/"));
});

test("G4 L3 projection requires exactly 143 unique, acceptance-neutral, verified files", () => {
  const files = Array.from({length: 143}, (_, index) => ({
    path: `source-assets/flash/HELP MATH_ORIGINAL FILES/audio-${index}.mp3`,
    sha256: String(index).padStart(64, "0"),
    physicalHashVerified: true,
  }));
  const report = {
    acceptance: {acceptanceNeutral: true, strictGateChanges: 0},
    audioInventory: {
      uniqueFileCount: 143,
      languages: {en: 60, es: 83, und: 0},
      allPhysicalHashesVerified: true,
      files,
    },
  };
  assert.equal(validateG4L3AudioProjection(report).length, 143);
  assert.throws(() => validateG4L3AudioProjection({
    ...report,
    audioInventory: {...report.audioInventory, uniqueFileCount: 142},
  }), /expected acceptance-neutral 143-file/);
});
