import assert from "node:assert/strict";
import {mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildReport,
  classifyKitManifest,
  inspectCurrentOperatorKits,
  inspectKitPayloadInventory,
  inspectOriginalRuntimeRequirementReadiness,
  materializeReport,
  renderMarkdown,
} from "./build-pilot-original-runtime-operator-readiness.mjs";

test("classifies course, legacy, natural, and source-driven operator kits", () => {
  assert.equal(classifyKitManifest({artifactType: "root-frame-accurate-capture-operator-kit", bindings: {traceSpecIndex: {file: "migrations/course-shell-pilot-trace-spec-index.json"}}}), "course-root-linear");
  assert.equal(classifyKitManifest({artifactType: "root-frame-accurate-capture-operator-kit", bindings: {traceSpecIndex: {file: "migrations/legacy-pilot-trace-spec-index.json"}}}), "legacy-root-linear");
  assert.equal(classifyKitManifest({artifactType: "rw-natural-trace-capture-operator-kit"}), "course-natural");
  assert.equal(classifyKitManifest({artifactType: "legacy-root-natural-trace-capture-operator-kit"}), "legacy-natural");
  assert.equal(classifyKitManifest({artifactType: "source-driven-natural-branch-capture-operator-kit"}), "source-driven");
});

test("empty-template payload inspection rejects PNG and non-template session artifacts", () => {
  const clean = inspectKitPayloadInventory([
    {file: "frames/README.md"},
    {file: "templates/capture-session-attestation.template.json"},
  ]);
  assert.equal(clean.emptyUnsignedTemplateOnly, true);
  const filled = inspectKitPayloadInventory([
    {file: "frames/frame-0001.png"},
    {file: "capture-session-attestation.json"},
  ]);
  assert.equal(filled.emptyUnsignedTemplateOnly, false);
  assert.equal(filled.pngCount, 1);
  assert.equal(filled.framePayloadCount, 1);
  assert.equal(filled.nonTemplateSessionArtifactCount, 1);
});

test("current operator kit tree is exactly the expected unsigned empty set", async () => {
  const result = await inspectCurrentOperatorKits();
  assert.deepEqual(result.counts, {
    courseRootLinear: 18,
    legacyRootLinear: 10,
    courseNatural: 2,
    legacyNatural: 2,
    sourceDriven: 2,
    total: 34,
  });
  assert.equal(result.kits.every(({payload}) => payload.emptyUnsignedTemplateOnly), true);
  assert.equal(result.kits.reduce((sum, {payload}) => sum + payload.pngCount, 0), 0);
  assert.equal(result.kits.reduce((sum, {payload}) => sum + payload.nonTemplateSessionArtifactCount, 0), 0);
});

test("coverage-v2, trace-spec indexes, and operator kits reconcile without overstating authority", async () => {
  const kits = await inspectCurrentOperatorKits();
  const result = await inspectOriginalRuntimeRequirementReadiness({kits});
  assert.equal(result.summary.allCoverageRequirements, 99);
  assert.equal(result.summary.coverageRequirements, 98);
  assert.equal(result.summary.indexedTraceSpecs, 98);
  assert.deepEqual(result.summary.traceSpecStatusCounts, {
    "source-frame-accurate-root-ready-for-authoritative-capture": 28,
    "source-schedule-ready-for-authoritative-execution": 8,
    unresolved: 62,
  });
  assert.equal(result.summary.sourceReadyTraceSpecs, 36);
  assert.equal(result.summary.sourceReadyTraceSpecsWithOperatorKit, 34);
  assert.equal(result.summary.sourceReadyTraceSpecsWithoutOperatorKit, 2);
  assert.equal(result.summary.coverageRequirementsWithoutIndexedTraceSpec, 0);
  assert.equal(result.summary.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex, 1);
  assert.deepEqual(result.summary.baselineAuthorityCounts, {unresolved: 98});
  assert.equal(result.summary.resolvedBaselineAuthorityRequirements, 0);
  assert.equal(result.summary.baselineCaptureManifestDeclaredCount, 0);
  assert.equal(result.summary.metricsFileDeclaredCount, 0);
  assert.equal(result.summary.traceExecutionReportsPresent, 0);
  assert.deepEqual(result.readyTraceSpecsWithoutOperatorKit.map(({animationId, requirementId}) => [animationId, requirementId]), [
    ["course-g04-l01-ir-001", "req:sprite-58:sound-0:en"],
    ["course-g04-l01-ir-001", "req:sprite-58:sound-1:en"],
  ]);
  assert.deepEqual(result.coverageRequirementsWithoutIndexedTraceSpec, []);
  assert.deepEqual(result.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex.map(({animationId, requirementId}) => [animationId, requirementId]), [
    ["course-g04-l09-gs-002", "req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641"],
  ]);
  assert.match(result.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex[0].boundary, /partial-path requirements cannot enter/);
  assert.equal(result.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex[0].originalRuntimeIndexEligible, false);
  assert.equal(result.sourceDrivenPreflightGaps.length, 1);
  const [irGap] = result.sourceDrivenPreflightGaps;
  assert.equal(irGap.animationId, "course-g04-l01-ir-001");
  assert.equal(irGap.captureEligibleByCurrentContract, false);
  assert.equal(irGap.fixture.requiredApproval.present, false);
  assert.equal(irGap.fixture.requiredApproval.file, "work/adobe-course-host-fixtures/generated/course-g04-l01-ir-001/1f1d928ba5f043f331fcdacc/capture/sandbox-gui-smoke-test.json");
  assert.deepEqual(irGap.requirements.map(({requirementId}) => requirementId), [
    "req:sprite-58:sound-0:en",
    "req:sprite-58:sound-1:en",
  ]);
  assert.equal(irGap.machineOnlyCompletableNow, false);
  assert.equal(irGap.originalRuntimeExecuted, false);
  assert.equal(irGap.strictAcceptanceEffect, false);
  assert.equal(result.strictAcceptanceEffect, false);
});

test("report remains acceptance-neutral and separates automated readiness from human decisions", async () => {
  const report = await buildReport();
  assert.equal(report.authorityBoundary.strictAcceptanceEffect, false);
  assert.equal(report.authorityBoundary.originalRuntimeExecuted, false);
  assert.equal(report.summary.currentAuthoringAudits, 8);
  assert.equal(report.summary.remainingLegacyFlaPopupAcknowledgements, 0);
  assert.equal(report.summary.operatorKits.total, 34);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.summary.originalRuntimeRequirements.allCoverageRequirements, 99);
  assert.equal(report.summary.originalRuntimeRequirements.coverageRequirements, 98);
  assert.equal(report.summary.originalRuntimeRequirements.sourceReadyTraceSpecsWithOperatorKit, 34);
  assert.equal(report.summary.originalRuntimeRequirements.resolvedBaselineAuthorityRequirements, 0);
  assert.equal(report.summary.pendingOriginalRuntimeCandidateFiles, 0);
  assert.equal(report.summary.audioListeningSessionsPresent, 0);
  assert.equal(report.summary.humanVisualReviewsAccepted, 0);
  assert.equal(report.summary.ownerReviewsAccepted, 0);
  assert.equal(report.manualObligations.courseRootCaptureRequirementsPrepared, 18);
  assert.equal(report.manualObligations.legacyRootCaptureRequirementsPrepared, 10);
  assert.equal(report.manualObligations.naturalTraceRequirementsPreparedButRequiringAuthoritativeDisposableEnvironment, 4);
  assert.equal(report.manualObligations.sourceDrivenBranchRequirementsPreparedButMissingReviewedLauncher, 2);
  assert.equal(report.manualObligations.audioCueReviewsPending, 71);
  assert.equal(report.currentMachineOnlyClosureBoundary.authoritativeRuntimeSessionsMachineCreatableWithoutNamedHuman, 0);
  assert.equal(report.currentMachineOnlyClosureBoundary.coverageRequirementsWithoutIndexedTraceSpec, 0);
  assert.equal(report.currentMachineOnlyClosureBoundary.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex, 1);
  assert.match(renderMarkdown(report), /Strict acceptance effect: false/);
  assert.match(renderMarkdown(report), /Coverage-v2 rows: 99; strict\/full-domain original-runtime obligations: 98/);
  assert.match(renderMarkdown(report), /Supplemental partial-path rows intentionally excluded/);
  assert.match(renderMarkdown(report), /Source-driven preflight gaps/);
  assert.match(renderMarkdown(report), /1f1d928ba5f043f331fcdacc3be90afdd4a69c6e609371486fb1f2f4e3aa0277/);
  assert.match(renderMarkdown(report), /No GUI smoke, runtime launch, child load, frame capture, or human action is recorded as completed/);
  assert.match(renderMarkdown(report), /30300ed66fc926a0a3f38f132f70b931ce97376f0d773fbe3c2c000d3297a49f/);
});

test("materialized report is reproducible and check fails closed on stale bytes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pilot-runtime-readiness-"));
  const jsonPath = path.join(directory, "report.json");
  const markdownPath = path.join(directory, "report.md");
  await materializeReport({jsonPath, markdownPath});
  await materializeReport({jsonPath, markdownPath, check: true});
  await writeFile(jsonPath, `${await readFile(jsonPath, "utf8")} `);
  await assert.rejects(materializeReport({jsonPath, markdownPath, check: true}), /is stale/);
});
