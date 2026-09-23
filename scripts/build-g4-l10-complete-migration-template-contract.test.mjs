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
} from "./build-g4-l10-complete-migration-template-contract.mjs";

const snapshotPromise = readSnapshot();

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("recomputes the current VB003 and atomic Lesson 10 boundary", async () => {
  const report = deriveContract(await snapshotPromise);

  assert.equal(report.status, "fail-closed-incomplete");
  assert.deepEqual(report.scopeDistinction.templatePlacement, {
    animationId: "course-g04-l10-vb-003",
    releaseId: "lesson-g04-l10-perimeter-area",
    ordinal: 7,
    memberCount: 1,
    assetId:
      "swf-96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
    strictComplete: false,
  });
  assert.equal(report.scopeDistinction.completeLessonRelease.memberCount, 47);
  assert.equal(report.scopeDistinction.completeLessonRelease.publicationMode, "atomic");
  assert.equal(report.scopeDistinction.completeLessonRelease.strictCompleteCount, 0);
  assert.equal(report.scopeDistinction.completeLessonRelease.published, false);
});

test("reports exact current formal migration counts without adopting diagnostics", async () => {
  const report = deriveContract(await snapshotPromise);

  assert.deepEqual(report.currentState.originalRuntime, {
    requirementCount: 4,
    authoritativeCapturedFrameCount: 0,
    requiredFrameCount: 426,
  });
  assert.deepEqual(report.currentState.visualRmse, {
    evidenceCount: 0,
    requirementCount: 4,
  });
  assert.equal(report.currentState.formalRenderer.present, false);
  assert.equal(report.currentState.formalRenderer.currentJsDiagnosticCapturedFrames, 203);
  assert.equal(report.currentState.formalRenderer.currentJsDiagnosticFormalEffect, 0);
  assert.deepEqual(report.currentState.checklist, {
    total: 58,
    checked: 0,
    unchecked: 58,
  });
  assert.deepEqual(report.currentState.reviews, {
    audio: "pending",
    human: "pending",
    engineering: "pending",
    owner: "pending",
  });
  assert.equal(report.currentState.atomicRelease.strictCompleteCount, 0);
  assert.equal(report.currentState.atomicRelease.requiredCount, 47);
});

test("reports authoring, root-kit, nested-trace, and audio blockers", async () => {
  const report = deriveContract(await snapshotPromise);

  assert.equal(report.obligations.animateAuthoring.flaApplicableItems, 34);
  assert.equal(report.obligations.animateAuthoring.pendingAudits, 34);
  assert.equal(report.obligations.rootCaptureKits.exactKitCount, 94);
  assert.equal(report.obligations.rootCaptureKits.locallyByteVerified, true);
  assert.equal(
    report.obligations.rootCaptureKits.upstreamProjectionCurrentnessEstablished,
    false,
  );
  assert.equal(report.obligations.rootCaptureKits.operatorReady, false);
  assert.equal(report.obligations.rootCaptureKits.evidenceEffect, "none");
  assert.equal(report.obligations.nestedTrace.unresolvedTraceCount, 2);
  assert.equal(report.obligations.nestedTrace.requiredFramesPerLanguage, 203);
  assert.equal(
    report.obligations.audio.vb003ExternalSpanishAudio.sha256,
    "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03",
  );
  assert.equal(report.obligations.audio.vb003EmbeddedStream.language, "und");
  assert.equal(report.obligations.audio.vb003EmbeddedStream.spokenLanguageKnown, false);
  assert.equal(
    report.obligations.audio.courseLevelExternalBlocker.missingMp3Count,
    16,
  );
});

test("rejects Ruffle as a formal baseline authority", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records.fullFrameCoverage.document.requirements[0].baselineAuthority =
    "ruffle-reference";
  fixture.records.fullFrameCoverage.document.requirements[0].capturedFrameCount = 10;

  assert.throws(
    () => deriveContract(fixture),
    /impermissibly treats ruffle-reference as baseline authority/,
  );
});

test("rejects current-JavaScript as a formal baseline authority", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records.fullFrameCoverage.document.requirements[0].baselineAuthority =
    "current-javascript-engineering-diagnostic";
  fixture.records.fullFrameCoverage.document.requirements[0].capturedFrameCount = 10;

  assert.throws(
    () => deriveContract(fixture),
    /impermissibly treats current-javascript-engineering-diagnostic as baseline authority/,
  );
});

test("rejects diagnostic mutation of RMSE, coverage, or acceptance", async () => {
  const fixture = cloneSnapshot(await snapshotPromise);
  fixture.records.currentJsDiagnostic.document.authorityBoundary.rmseAcceptance = true;

  assert.throws(
    () => deriveContract(fixture),
    /Current-JS diagnostic impermissibly asserts rmseAcceptance/,
  );
});

test("rejects any acceptance or publication effect asserted by the contract", async () => {
  const report = deriveContract(await snapshotPromise);
  report.acceptanceEffects.ownerAcceptance = true;

  assert.throws(
    () => validateContract(report),
    /Contract impermissibly creates ownerAcceptance/,
  );
});

test("halts at the unknown TS007/TS008 writer boundary and names the human action", async () => {
  const report = deriveContract(await snapshotPromise);

  assert.equal(
    report.releaseEvidenceAttribution.status,
    "unknown-unverified-writer-boundary",
  );
  assert.equal(report.releaseEvidenceAttribution.writerIdentity, null);
  assert.deepEqual(report.releaseEvidenceAttribution.affectedMembers, [
    "course-g04-l10-ts-007",
    "course-g04-l10-ts-008",
  ]);
  assert.equal(report.automationUntilHumanGate.status, "HALT");
  assert.equal(report.automationUntilHumanGate.canProceedWithoutHuman, false);
  assert.equal(report.nextNamedHumanAction.role, "Lesson 10 release evidence custodian");
  assert.equal(report.nextNamedHumanAction.cannotBeAutomated, true);
});

test("emits all required machine/human gates with no acceptance effect", async () => {
  const report = deriveContract(await snapshotPromise);
  assert.deepEqual(
    report.gates.map((gate) => gate.id),
    [
      "intake",
      "audit",
      "authoring",
      "original-runtime-baseline",
      "specification",
      "renderer",
      "behavior-tests",
      "visual-rmse",
      "audio",
      "human-review",
      "owner-review",
      "strict-completion",
      "atomic-lesson-release",
    ],
  );
  assert.equal(report.gates.find((gate) => gate.id === "intake").status, "PASS");
  assert.ok(
    report.gates
      .filter((gate) => gate.id !== "intake")
      .every((gate) => gate.satisfied === false),
  );
  assert.ok(report.gates.every((gate) => gate.acceptanceEffect === "none"));
});

test("renders the decision-critical contract in Markdown", async () => {
  const markdown = renderMarkdown(deriveContract(await snapshotPromise));

  assert.match(markdown, /ordinal 7\/47/);
  assert.match(markdown, /0\/426 authoritative original-runtime frames/);
  assert.match(markdown, /checklist 0\/58/);
  assert.match(markdown, /94 local exact kits/);
  assert.match(markdown, /still lacks 16 MP3s/);
  assert.match(markdown, /embedded 16640 ms stream is language `und`/);
  assert.match(markdown, /automation is \*\*HALT\*\*/);
});

test("requires exactly one explicit CLI mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--check", "extra"]), /Usage/);
  assert.throws(() => parseCliArgs(["--unsafe"]), /Expected --write or --check/);
});

test("checked-in JSON and Markdown exactly match a stable recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.deepEqual(result.checked, [REPORT_JSON, REPORT_MARKDOWN]);
});
