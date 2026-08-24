#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  checkReport,
  parseCliArgs,
  publishNoClobber,
  validateReport,
} from "./build-g4-l10-ts007-frame-domain-disposition-currentness-v1.mjs";

const bundle = await buildBundle();

test("CLI is restricted to dry-run, no-clobber write, or read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("source-static recomputation proves exactly ten composite children", () => {
  const recomputed = bundle.report.independentStaticRecomputation;
  assert.deepEqual(recomputed.singleFrameCompositeTimelineIds, [
    "sprite-60",
    "sprite-62",
    "sprite-63",
    "sprite-77",
    "sprite-79",
    "sprite-203",
    "sprite-226",
    "sprite-419",
  ]);
  assert.deepEqual(recomputed.directRootMultiFrameAuditExcludedTimelineIds,
    ["sprite-355", "sprite-379"]);
  assert.deepEqual(recomputed.nestedDeclaredParentSuccessor.timelineIds,
    ["sprite-355", "sprite-379"]);
  assert.equal(recomputed.nestedDeclaredParentSuccessor.parentTimelineId,
    "sprite-388");
  assert.equal(recomputed.nestedDeclaredParentSuccessor
    .parentEntryStateEstablished, false);
  assert.deepEqual(recomputed.staticEvidenceClaimTimelineIds, [
    "sprite-60",
    "sprite-62",
    "sprite-63",
    "sprite-77",
    "sprite-79",
    "sprite-203",
    "sprite-226",
    "sprite-355",
    "sprite-379",
    "sprite-419",
  ]);
  assert.equal(recomputed.recomputationMatchedCurrentEvidence, true);
});

test("current disposition keeps only interactive sprite-64 unresolved", () => {
  const current = bundle.report.currentDisposition;
  assert.equal(current.status,
    "structurally-enumerated-dispositions-unresolved");
  assert.equal(current.inventoryTimelineCount, 27);
  assert.equal(current.enumeratedTimelineCount, 26);
  assert.equal(current.excludedNotProvenTimelineCount, 1);
  assert.deepEqual(current.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 10,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 1,
  });
  assert.deepEqual(current.unresolvedTimelineIds, ["sprite-64"]);
  assert.equal(bundle.report.independentStaticRecomputation.sprite64
    .eligibleAsSingleFrameScriptlessComposite, false);
  assert.deepEqual(bundle.report.independentStaticRecomputation.sprite64
    .disqualifiers, [
    "swfmill-do-action-present",
    "ffdec-frame-script-present",
  ]);
});

test("coverage remains bound to the predecessor three-unresolved disposition", () => {
  const coverage = bundle.report.coverageCurrentness;
  assert.equal(coverage.currentAgainstDisposition, false);
  assert.equal(coverage.boundPredecessorDisposition.sha256,
    "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2");
  assert.equal(coverage.currentDisposition.sha256,
    "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da");
  assert.equal(coverage.boundPredecessorDisposition.dispositionCounts.unresolved,
    3);
  assert.equal(coverage.currentDisposition.dispositionCounts.unresolved, 1);
  assert.deepEqual(coverage.exactChangedDispositionTimelineIds,
    ["sprite-355", "sprite-379"]);
  assert.deepEqual(coverage.stillUnresolvedTimelineIds, ["sprite-64"]);
  assert.equal(coverage.requirementCount, 30);
  assert.equal(coverage.capturedFrameCount, 0);
  assert.equal(coverage.baselineAuthority, "unresolved");
});

test("sprite-64 geometry creates no runtime or disposition authority", () => {
  const boundary = bundle.report.sprite64UnresolvedBoundary;
  assert.equal(boundary.sourceStaticInteractive, true);
  assert.equal(boundary.currentDisposition, "unresolved");
  assert.equal(boundary.compositeChildWithParentSupported, false);
  assert.equal(boundary.independentRequiredSupported, false);
  assert.equal(boundary.nonvisualSupported, false);
  assert.equal(boundary.authoritativeRuntimeEntryObserved, false);
  assert.equal(boundary.entryStateSha256Established, false);
  assert.equal(boundary.formalNaturalScheduleReadyCountChange, 0);
  assert.equal(boundary.dispositionChangeAuthorized, false);
});

test("raw and formal unresolved projections remain 70 and 74", () => {
  const projection = bundle.report.aggregateProjectionBoundary;
  assert.equal(projection.rawDispositionResidualCount, 70);
  assert.equal(projection.rawDispositionResidualSetSha256,
    "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852");
  assert.equal(projection.formalRequirementProjectionResidualCount, 74);
  assert.equal(projection.exactStaleProjectionDifference, 4);
  assert.equal(projection.naturalScheduleReadyRequirementCount, 0);
  assert.equal(projection.changeCreatedByThisReport, 0);
});

test("reviewer, helper, runtime, transaction, renderer, and acceptance gates stay closed", () => {
  validateReport(bundle.report);
  assert.deepEqual(bundle.report.downstreamBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(bundle.report.securityAndRuntimeBoundary.reviewSetManifestBound,
    false);
  assert.equal(bundle.report.securityAndRuntimeBoundary.reviewerTaskCount, 0);
  assert.equal(bundle.report.securityAndRuntimeBoundary.phaseAExecuted, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary.phaseBExecuted, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorized, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .authoritativeOriginalRuntimeFrameCount, 0);
  assert.ok(Object.values(bundle.report.authorityEffects).every((value) =>
    value === false));
  assert.equal(bundle.report.review.reviewTaskAuthorized, false);
  assert.deepEqual(bundle.report.review.reviewTaskIds, []);
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-ts007-frame-domain-currentness-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
    assert.equal(published.currentDispositionUnresolvedCount, 1);
    assert.deepEqual(published.currentDispositionUnresolvedTimelineIds,
      ["sprite-64"]);
    await assert.rejects(() => publishNoClobber(bundle,
      {outputRoot: tempRoot}), /refusing overwrite/);
    const jsonPath = path.join(tempRoot, REPORT_JSON);
    const markdownPath = path.join(tempRoot, REPORT_MARKDOWN);
    await chmod(jsonPath, 0o644);
    await writeFile(jsonPath, `${bundle.json} `);
    await assert.rejects(() => checkReport(bundle, tempRoot),
      /byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
