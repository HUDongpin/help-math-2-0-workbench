import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  CANDIDATE_IDS,
  INPUTS,
  JSON_REPORT_RELATIVE,
  MARKDOWN_REPORT_RELATIVE,
  RELEASE_ID,
  REPORT_TYPE,
  buildReport,
  renderMarkdown,
  validateReport,
} from "./build-g4-l10-formal-migration-continuation-v1.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("builds the exact additive continuation from hash-bound inputs", async () => {
  const report = await buildReport();
  assert.equal(report.reportType, REPORT_TYPE);
  assert.equal(report.releaseId, RELEASE_ID);
  assert.equal(report.classification, "additive-machine-evidence-continuation-only");
  assert.equal(report.decision.machineEvidenceAdvanced, true);
  assert.equal(report.decision.formalMigrationComplete, false);
  assert.equal(report.decision.acceptanceEffect, "none");
  assert.equal(report.predecessor.sha256, INPUTS.predecessorCheckpoint.sha256);
  assert.equal(
    report.evidenceBindings.machineEvidence.ruffleV7Diagnostic.sha256,
    INPUTS.ruffleV7Diagnostic.sha256,
  );
  assert.equal(
    report.evidenceBindings.currentFormalState.lessonReleaseLedger.sha256,
    INPUTS.lessonReleaseLedger.sha256,
  );
  assert.equal(validateReport(report), true);
});

test("records seven ordered trusted deliveries without inventing runtime entry", async () => {
  const report = await buildReport();
  const traversal = report.machineProgressDelta.ruffleHostTraversal;
  assert.equal(traversal.predecessorV6SuccessfulExpectedChildTransitions, 1);
  assert.equal(traversal.currentV7SuccessfulExpectedChildTransitions, 7);
  assert.deepEqual(
    traversal.transitionReceipts.map((item) => path.basename(item.expectedPath)),
    [
      "L10RW02.swf",
      "L10RW03.swf",
      "L10RW04.swf",
      "L10RW05.swf",
      "L10VB01.swf",
      "L10VB02.swf",
      "L10VB03.swf",
    ],
  );
  assert.deepEqual(
    traversal.transitionReceipts.map((item) => item.newExactGetDeliveryMultiplicity),
    [2, 1, 1, 1, 2, 1, 1],
  );
  assert.deepEqual(
    traversal.transitionReceipts.map((item) => item.actualElapsedWindowMs),
    [98_422, 91_254, 114_503, 81_170, 15_420, 27_420, 21_002],
  );
  assert.ok(
    traversal.transitionReceipts.every((item) =>
      item.trustedDomPointerEvents === 15 && item.pointerId === 1 &&
      item.completeTrustedReleaseSequence === true &&
      item.exactGetHttp200AndServerDelivery === true &&
      item.deliveryAfterPointerUp === true && item.futurePrefetchCount === 0 &&
      item.elapsedWindowProvesNaturalEntryOrTerminal === false),
  );
  assert.deepEqual(traversal.target, {
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
    exactDeliveryOrderedAfterTrustedPointerRelease: true,
    sourceDeclaredElapsedWindowCompleted: true,
    beginHandshakeActuallyObserved: false,
    childFrameDomainActuallyObserved: false,
    naturalPlaybackProven: false,
  });
});

test("keeps VB001, VB003 stability, and FQ002 inside diagnostic authority", async () => {
  const report = await buildReport();
  const vb001 = report.machineProgressDelta.vb001HostChainStaticAudit;
  assert.equal(vb001.formalReleaseMember, false);
  assert.equal(vb001.activeCourseXmlMember, false);
  assert.equal(vb001.denominatorEffect, "none");
  assert.equal(vb001.provesNaturalRuntimeEntryOrTerminal, false);
  assert.equal(vb001.provesAudioSynchronization, false);

  const stability = report.machineProgressDelta.vb003TargetStability;
  assert.equal(stability.fullPlayer.exactRgbaDifferentPixels, 2_520);
  assert.equal(stability.targetContentAboveHostChrome.exactRgbaDifferentPixels, 0);
  assert.equal(stability.targetContentAboveHostChrome.normalizedRgbRmse, 0);
  assert.equal(stability.hostChrome.exactRgbaDifferentPixels, 2_520);
  assert.equal(stability.provesRuntimeTerminal, false);
  assert.equal(stability.formalRmseAcceptanceEffect, "none");

  const fq002 = report.machineProgressDelta.fq002CurrentJavascriptDiagnostic;
  assert.equal(fq002.registered, false);
  assert.equal(fq002.spanishVisualStatus, "unresolved-disabled");
  assert.deepEqual(fq002.capturedFrames, [1, 2, 27, 28, 43, 44, 70]);
  assert.deepEqual(fq002.temporalChangedPixelCounts, [24_476, 0, 0, 634, 65_183]);
  assert.equal(fq002.actionScriptExecuted, false);
  assert.equal(fq002.controlsEnabled, false);
  assert.equal(fq002.audioCueCount, 0);
  assert.equal(fq002.formalCoverageManifestEffect, "none");
});

test("preserves every formal denominator and the closed atomic ledger", async () => {
  const report = await buildReport();
  const invariantState = report.formalGateInvariance;
  assert.equal(invariantState.gates.canonicalReleaseMembership.present, 47);
  assert.equal(invariantState.gates.authoritativeOriginalRuntimeBaseline.accepted, 0);
  assert.equal(invariantState.gates.authoritativeCapturedCoverageFrames.required, 44_488);
  assert.equal(invariantState.gates.fullFrameRmseRequirements.required, 520);
  assert.equal(invariantState.gates.registeredFormalJavascriptRenderer.accepted, 0);
  assert.equal(invariantState.gates.strictCompletion.accepted, 0);
  assert.equal(invariantState.gates.atomicWholeLessonPublication.published, false);
  assert.equal(invariantState.engineeringCandidates.count, 8);
  assert.equal(invariantState.engineeringCandidates.registeredCount, 0);
  assert.deepEqual(invariantState.engineeringCandidates.ids, CANDIDATE_IDS);
  assert.ok(Object.values(invariantState.mutations).every((value) => value === false));
  assert.deepEqual(
    {
      expected: invariantState.releaseLedger.expectedMemberCount,
      strict: invariantState.releaseLedger.strictCompleteCount,
      missing: invariantState.releaseLedger.missingCount,
      mismatch: invariantState.releaseLedger.assetMismatchCount,
      published: invariantState.releaseLedger.published,
      admitted: invariantState.releaseLedger.gate.admittedCount,
      open: invariantState.releaseLedger.gate.open,
    },
    {expected: 47, strict: 0, missing: 47, mismatch: 0, published: false, admitted: 0, open: false},
  );
});

test("fails closed if a generated report promotes acceptance", async () => {
  const report = await buildReport();
  for (const mutate of [
    (value) => { value.decision.formalMigrationComplete = true; },
    (value) => { value.machineProgressDelta.ruffleHostTraversal.target.naturalPlaybackProven = true; },
    (value) => { value.machineProgressDelta.vb003TargetStability.provesRuntimeTerminal = true; },
    (value) => { value.machineProgressDelta.fq002CurrentJavascriptDiagnostic.registered = true; },
    (value) => { value.formalGateInvariance.gates.strictCompletion.accepted = 1; },
    (value) => { value.formalGateInvariance.mutations.registryMutation = true; },
    (value) => { value.authority.authoritativeOriginalRuntime = true; },
  ]) {
    const promoted = structuredClone(report);
    mutate(promoted);
    assert.throws(() => validateReport(promoted), /G4 L10 continuation v1/);
  }
});

test("renders and freezes the checked-in JSON and Markdown reports", async () => {
  const report = await buildReport();
  const expectedJson = `${JSON.stringify(report, null, 2)}\n`;
  const expectedMarkdown = renderMarkdown(report);
  assert.match(expectedMarkdown, /Additive machine evidence only/);
  assert.match(expectedMarkdown, /authoritative original-runtime baseline remains \*\*0\/47\*\*/);
  assert.match(expectedMarkdown, /beginHandshakeActuallyObserved=false/);
  assert.match(expectedMarkdown, /Acceptance effect: `none`/);
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE), "utf8"),
    expectedJson,
  );
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE), "utf8"),
    expectedMarkdown,
  );
  for (const relativePath of [JSON_REPORT_RELATIVE, MARKDOWN_REPORT_RELATIVE]) {
    const metadata = await stat(path.join(PROJECT_ROOT, relativePath));
    assert.equal(metadata.mode & 0o222, 0);
  }
});
