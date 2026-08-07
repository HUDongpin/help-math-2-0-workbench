#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG4L3ShellStrictReadiness,
  parseArguments,
  validateShellStrictReadiness,
} from "./build-g4-l3-shell-strict-readiness.mjs";

test("builds a source-bound and fail-closed shell readiness record", async () => {
  const report = await buildG4L3ShellStrictReadiness();
  assert.equal(report.animationId, "shell-course-g04-l03-index-local");
  assert.equal(report.machineAudit.rootFrameCount, 50);
  assert.equal(report.machineAudit.exportedScriptFileCount, 528);
  assert.equal(report.branchCaptureReadiness.requiredScenarioInventory.length, 44);
  assert.equal(report.branchCaptureReadiness.pendingFullFrameRequirementCount, 88);
  assert.equal(report.frameDomainReadiness.reachableChildTimelineCount, 89);
  assert.equal(report.frameDomainReadiness.staticCompositeChildCount, 56);
  assert.equal(report.frameDomainReadiness.declaredFrameDomainCount, 34);
  assert.equal(report.frameDomainReadiness.unresolvedTimelineCount, 0);
  assert.equal(report.frameDomainReadiness.unresolvedSingleFrameTimelineCount, 0);
  assert.equal(report.frameDomainReadiness.unresolvedMultiFrameTimelineCount, 0);
  assert.equal(report.frameDomainReadiness.highRiskIndependentCandidateCount, 0);
  assert.equal(report.frameDomainReadiness.strictFrameDomainReady, false);
  assert.equal(report.frameDomainReadiness.unresolvedSingleFrameTimelineIds.length, 0);
  assert.equal(report.frameDomainReadiness.unresolvedMultiFrameTimelineIds.length, 0);
  assert.deepEqual(report.frameDomainReadiness.highRiskIndependentCandidateTimelineIds, []);
  assert.equal(report.structuralRootInspection.frameCount, 50);
  assert.equal(report.structuralRootInspection.distinctPngSha256Count, 24);
  assert.equal(report.structuralRootInspection.originalRuntimeBaselineComplete, false);
  assert.equal(report.structuralNativeMenuInspection.frameDomain, "sprite-1011");
  assert.equal(report.structuralNativeMenuInspection.frameCount, 48);
  assert.equal(report.structuralNativeMenuInspection.distinctPngSha256Count, 33);
  assert.equal(report.structuralNativeMenuInspection.fullStageCompositionClaimed, false);
  assert.equal(report.structuralNativeMenuInspection.originalRuntimeBaselineComplete, false);
  assert.equal(report.structuralMoverTooltipInspection.frameDomain, "sprite-528");
  assert.equal(report.structuralMoverTooltipInspection.frameCount, 871);
  assert.equal(report.structuralMoverTooltipInspection.distinctPngSha256Count, 100);
  assert.equal(report.structuralMoverTooltipInspection.deduplicatedAssetCount, 100);
  assert.equal(report.structuralMoverTooltipInspection.hoverCausalityClaimed, false);
  assert.equal(report.structuralMoverTooltipInspection.fullStageCompositionClaimed, false);
  assert.equal(report.structuralMoverTooltipInspection.originalRuntimeBaselineComplete, false);
  assert.deepEqual(
    report.structuralControlTooltipInspections.map(({frameDomain, frameCount, deduplicatedAssetCount}) => ({frameDomain, frameCount, deduplicatedAssetCount})),
    [
      {frameDomain: "sprite-302", frameCount: 149, deduplicatedAssetCount: 20},
      {frameDomain: "sprite-327", frameCount: 132, deduplicatedAssetCount: 22},
    ],
  );
  assert.ok(report.structuralControlTooltipInspections.every(({mouseOrHoverCausalityClaimed, originalRuntimeBaselineComplete}) => (
    mouseOrHoverCausalityClaimed === false && originalRuntimeBaselineComplete === false
  )));
  assert.equal(report.structuralPreloaderProgressInspection.frameDomain, "sprite-132");
  assert.equal(report.structuralPreloaderProgressInspection.frameCount, 100);
  assert.equal(report.structuralPreloaderProgressInspection.distinctPngSha256Count, 100);
  assert.equal(report.structuralPreloaderProgressInspection.loadingProgressCausalityClaimed, false);
  assert.equal(report.structuralPreloaderProgressInspection.originalRuntimeBaselineComplete, false);
  assert.equal(report.structuralAdditionalDomainInspections.length, 14);
  assert.equal(report.structuralAdditionalDomainInspections.reduce((sum, {frameCount}) => sum + frameCount, 0), 142);
  assert.equal(report.structuralAdditionalDomainInspections.every(({naturalPlaybackClaimed, originalRuntimeBaselineComplete, strictAcceptanceEffect}) => naturalPlaybackClaimed === false && originalRuntimeBaselineComplete === false && strictAcceptanceEffect === "none"), true);
  assert.equal(report.structuralSingleFrameDomainInspections.length, 14);
  assert.equal(report.structuralSingleFrameDomainInspections.reduce((sum, {frameCount}) => sum + frameCount, 0), 14);
  assert.equal(report.structuralSingleFrameDomainInspections.every(({eventCausalityClaimed, originalRuntimeBaselineComplete, strictAcceptanceEffect}) => eventCausalityClaimed === false && originalRuntimeBaselineComplete === false && strictAcceptanceEffect === "none"), true);
  assert.equal(report.structuralDispositionProjections.staticDisposition.hashMode, "canonical-json-v1");
  assert.deepEqual(report.structuralDispositionProjections.staticDisposition.excludedPaths, ["generatedFrom.scenarioInventory"]);
  assert.equal(report.structuralDispositionProjections.frameDisposition.hashMode, "canonical-json-v1");
  assert.deepEqual(report.structuralDispositionProjections.frameDisposition.excludedPaths, [
    "generatedFrom.scenarioInventory",
    "generatedFrom.staticDispositionEvidence.sha256",
    "generatedFrom.staticDispositionEvidence.bindingStatus",
    "timelines.*.staticCompositeEvidence.evidenceSha256",
    "timelines.*.sourceEvidence.scenarioInventorySha256",
  ]);
  assert.equal(report.audioReadiness.inventoriedCueCount, 16);
  assert.equal(report.audioReadiness.listeningRecordStatus, "pending");
  assert.equal(report.conclusion.strictAcceptanceReady, false);
  assert.equal(report.review.decision, "pending");
  assert.equal(report.strictAcceptanceEffect, "none");
});

test("rejects an inferred completion or human decision", async () => {
  const report = await buildG4L3ShellStrictReadiness();
  assert.throws(() => validateShellStrictReadiness({...report, conclusion: {...report.conclusion, completionClaimAllowed: true}}), /completion claims/);
  assert.throws(() => validateShellStrictReadiness({...report, review: {...report.review, decision: "approved"}}), /cannot be inferred/);
});

test("CLI accepts only check/help switches", () => {
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.deepEqual(parseArguments(["-h"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown option/);
});
