import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOfflineEvidenceReadinessReport,
  parseArguments,
  renderMarkdown,
  validateOfflineEvidenceReadinessReport,
} from "./build-g4-l3-offline-evidence-readiness.mjs";

function clone(value) {
  return structuredClone(value);
}

test("binds the exact 40-item G4 L3 offline evidence scope", async () => {
  const report = await buildOfflineEvidenceReadinessReport();
  assert.equal(report.summary.boundRequiredReports, 19);
  assert.equal(report.summary.canonicalItems, 40);
  assert.equal(report.summary.activePages, 39);
  assert.equal(report.summary.courseShells, 1);
  assert.equal(report.summary.pairedAuthoringBindingsPrepared, 29);
  assert.equal(report.summary.verifiedWorkOnlyAuthoringAudits, 29);
  assert.equal(report.summary.pendingApplicableAuthoringAudits, 0);
  assert.equal(report.summary.authoringAuditNotApplicableItems, 11);
  assert.equal(report.summary.swfOnlyItems, 11);
  assert.equal(report.summary.exactSourceOperationItems, 40);
  assert.equal(report.summary.scaffoldedLessonWorkspaces, 40);
  assert.equal(report.summary.swfAdpcmDerivedTechnicalBindings, 1);
  assert.equal(report.summary.installedOriginalRuntimeCandidates, 1);
  assert.equal(report.summary.exactExternalSideEffectOperations, 23);
  assert.equal(report.summary.runtimeContainmentControlsSpecified, 8);
  assert.equal(report.summary.runtimeContainmentControlsApproved, 0);
  assert.equal(Object.keys(report.sourceBindings).length, 19);
  assert.equal(report.scope.developmentMode, "parallel-shards");
  assert.equal(report.scope.publicationMode, "atomic");
  assert.equal(report.summary.openScaffoldGates, 2);
});

test("records exact machine-prepared script, asset, and audio facts", async () => {
  const report = await buildOfflineEvidenceReadinessReport();
  const facts = report.machinePreparedFacts;
  assert.equal(facts.sourceOperations.completeFfdecReexports, 40);
  assert.equal(facts.sourceOperations.exportedScriptFiles, 1809);
  assert.equal(facts.sourceOperations.exactOperations, 3403);
  assert.equal(facts.sourceOperations.authoritativeRuntimeReachabilityItems, 0);
  assert.equal(facts.originalRuntimePreparation.installedCandidateCount, 1);
  assert.equal(facts.originalRuntimePreparation.runtimeVersion, "32.0.0.414");
  assert.equal(facts.originalRuntimePreparation.historicalStandaloneFramesReverified, 10);
  assert.equal(facts.originalRuntimePreparation.historicalCandidatesWithCurrentStrictAuthority, 0);
  assert.equal(facts.originalRuntimePreparation.exactExternalSideEffectOperations, 23);
  assert.equal(facts.originalRuntimePreparation.containmentControlsSpecified, 8);
  assert.equal(facts.originalRuntimePreparation.containmentControlsApproved, 0);
  assert.equal(facts.originalRuntimePreparation.runtimeSessionsExecuted, 0);
  assert.equal(facts.originalRuntimePreparation.authoritativeBaselinePackagesEstablished, 0);
  assert.equal(facts.authoringEvidence.verifiedWorkOnlyAuthoringAudits, 29);
  assert.equal(facts.authoringEvidence.pendingApplicableAuthoringAudits, 0);
  assert.equal(facts.authoringEvidence.totalAttemptReceipts, 36);
  assert.equal(facts.authoringEvidence.failedDiagnosticAttemptReceipts, 7);
  assert.equal(facts.authoringEvidence.originalRuntimeBaselinesEstablished, 0);
  assert.equal(facts.authoringEvidence.acceptanceEffect, false);
  assert.equal(facts.batchAndCapacityBoundary.scaffoldedLessonWorkspaces, 40);
  assert.equal(facts.batchAndCapacityBoundary.batch001ScaffoldedWorkspaces, 25);
  assert.equal(facts.batchAndCapacityBoundary.batch002ScaffoldedWorkspaces, 15);
  assert.equal(facts.batchAndCapacityBoundary.captureCapacityAdmission, "admit-full-lesson-capture-capacity");
  assert.ok(facts.batchAndCapacityBoundary.captureCapacityHeadroomBytes >= 0);
  assert.equal(facts.assetDefinitions.totalDefinitions, 8068);
  assert.equal(facts.embeddedAudioTechnical.casObjects, 88);
  assert.equal(facts.embeddedAudioTechnical.sourceAudioUnitReferences, 359);
  assert.equal(facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.independentlyDecodedBlocks, 13);
  assert.equal(facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.decodedPcm16MonoSamples, 5967);
  assert.equal(facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.independentFfdecOrOriginalPcmEquality, false);
  assert.equal(facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.listeningOrAcceptanceEffect, false);
  assert.equal(facts.catalogAudioTechnical.physicalMp3Files, 143);
  assert.equal(facts.catalogAudioTechnical.ffprobeParsed, 143);
  assert.equal(facts.catalogAudioTechnical.ffmpegDecodeChecked, 143);
  assert.equal(facts.catalogAudioTechnical.listeningReviews, 0);
});

test("keeps implementation, publication, human, runtime, fidelity, audio, and owner gates closed", async () => {
  const report = validateOfflineEvidenceReadinessReport(await buildOfflineEvidenceReadinessReport());
  assert.equal(report.scaffoldAndReleaseBoundary.batch001ScaffoldGateOpen, true);
  assert.equal(report.scaffoldAndReleaseBoundary.batch002ScaffoldGateOpen, true);
  assert.equal(report.scaffoldAndReleaseBoundary.rendererImplementationAuthorized, false);
  assert.equal(report.scaffoldAndReleaseBoundary.atomicLessonPublicationAuthorized, false);
  assert.ok(Object.values(report.closedGates).every((value) => value === false));
  assert.equal(report.pendingGates.length, 10);
  assert.ok(report.pendingGates.every((gate) => gate.status === "pending"));
  assert.equal(report.pendingGates.some((gate) => gate.id === "named-human-animate-authoring-audits"), false);
  assert.equal(report.acceptance.authoritativeRuntimeAccepted, false);
  assert.equal(report.acceptance.implementationAccepted, false);
  assert.equal(report.acceptance.audioAccepted, false);
  assert.equal(report.acceptance.humanVisualReviewAccepted, false);
  assert.equal(report.acceptance.ownerAccepted, false);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("validator fails closed on scope, source binding, or authority promotion", async () => {
  const report = await buildOfflineEvidenceReadinessReport();
  const scope = clone(report);
  scope.summary.canonicalItems = 39;
  assert.throws(() => validateOfflineEvidenceReadinessReport(scope), /exact scope drifted/);

  const binding = clone(report);
  binding.sourceBindings.sourceOperationIndexV2.sha256 = "0".repeat(63);
  assert.throws(() => validateOfflineEvidenceReadinessReport(binding), /input binding drifted/);

  const promoted = clone(report);
  promoted.closedGates.ownerAccepted = true;
  assert.throws(() => validateOfflineEvidenceReadinessReport(promoted), /gate unexpectedly opened/);

  const mutation = clone(report);
  mutation.authorityBoundary.routesModified = true;
  assert.throws(() => validateOfflineEvidenceReadinessReport(mutation), /authority boundary was promoted/);
});

test("Markdown states the leaf-only and acceptance-neutral boundary", async () => {
  const markdown = renderMarkdown(await buildOfflineEvidenceReadinessReport());
  assert.match(markdown, /40 canonical items = 39 active pages \+ 1 course shell/);
  assert.match(markdown, /29 paired FLA\/SWF \+ 11 SWF-only/);
  assert.match(markdown, /29\/29 applicable verified work-only Animate authoring audits/);
  assert.match(markdown, /1 installed-but-unapproved 32\.0\.0\.414 candidate/);
  assert.match(markdown, /23.*exact static side-effect operations/);
  assert.match(markdown, /8 containment controls specified \/ 0 approved/);
  assert.match(markdown, /143\/143/);
  assert.match(markdown, /0\/40 strict-complete/);
  assert.match(markdown, /40\/40.*migration workspaces/);
  assert.match(markdown, /both shard scaffold gates are \*\*open\*\*/);
  assert.match(markdown, /lesson publication remains \*\*atomic\*\* and closed/);
  assert.match(markdown, /all remain closed/);
  assert.match(markdown, /leaf-only aggregate/);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes only deterministic report and check outputs", () => {
  const options = parseArguments([
    "--check",
    "--json-output", "reports/a.json",
    "--markdown-output", "reports/a.md",
  ]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(() => parseArguments(["--launch-animate"]), /Unknown option/);
});
