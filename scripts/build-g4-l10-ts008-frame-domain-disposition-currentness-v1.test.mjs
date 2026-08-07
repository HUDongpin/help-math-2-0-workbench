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
} from "./build-g4-l10-ts008-frame-domain-disposition-currentness-v1.mjs";

const bundle = await buildBundle();

test("CLI is restricted to dry-run, no-clobber write, or read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("source-static recomputation proves the exact seven composite children", () => {
  const recomputed = bundle.report.independentStaticRecomputation;
  assert.deepEqual(recomputed.singleFrameCompositeTimelineIds, [
    "sprite-17", "sprite-66", "sprite-68", "sprite-202", "sprite-225",
  ]);
  assert.deepEqual(recomputed.directRootMultiFrameAuditExcludedTimelineIds,
    ["sprite-354", "sprite-378"]);
  assert.deepEqual(recomputed.nestedDeclaredParentSuccessor.timelineIds,
    ["sprite-354", "sprite-378"]);
  assert.equal(recomputed.nestedDeclaredParentSuccessor.parentTimelineId,
    "sprite-387");
  assert.equal(recomputed.nestedDeclaredParentSuccessor
    .parentEntryStateEstablished, false);
  assert.equal(recomputed.recomputationMatchedCurrentEvidence, true);
});

test("current disposition is structurally enumerated with zero unresolved", () => {
  const current = bundle.report.currentDisposition;
  assert.equal(current.status, "structurally-enumerated");
  assert.equal(current.inventoryTimelineCount, 23);
  assert.equal(current.enumeratedTimelineCount, 22);
  assert.equal(current.excludedNotProvenTimelineCount, 1);
  assert.deepEqual(current.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 7,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 0,
  });
  assert.deepEqual(current.unresolvedTimelineIds, []);
});

test("coverage remains bound to the predecessor two-unresolved disposition", () => {
  const coverage = bundle.report.coverageCurrentness;
  assert.equal(coverage.currentAgainstDisposition, false);
  assert.equal(coverage.boundPredecessorDisposition.sha256,
    "37a0d679f6829ea2ace2c377e0f2d9e2907e755bb72efff278d966d2fa780c8c");
  assert.equal(coverage.currentDisposition.sha256,
    "8f4f4d32b532b58711ea09237184e27b121a721af1a05d378bb894cde1e54733");
  assert.equal(coverage.boundPredecessorDisposition.dispositionCounts.unresolved,
    2);
  assert.equal(coverage.currentDisposition.dispositionCounts.unresolved, 0);
  assert.deepEqual(coverage.exactChangedDispositionTimelineIds,
    ["sprite-354", "sprite-378"]);
  assert.equal(coverage.requirementCount, 30);
  assert.equal(coverage.capturedFrameCount, 0);
  assert.equal(coverage.baselineAuthority, "unresolved");
});

test("runtime, transaction, renderer, and acceptance authority remain closed", () => {
  validateReport(bundle.report);
  assert.deepEqual(bundle.report.downstreamBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
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
    "g4-l10-ts008-frame-domain-currentness-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
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
