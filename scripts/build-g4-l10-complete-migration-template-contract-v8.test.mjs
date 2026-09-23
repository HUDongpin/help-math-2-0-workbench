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
import {before, test} from "node:test";

import {
  PROJECT_ROOT,
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  checkContract,
  parseCliArgs,
  publishNoClobber,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v8.mjs";

let bundle;

before(async () => {
  bundle = await buildBundle(PROJECT_ROOT);
});

test("CLI remains report-only", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]),
    "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  for (const forbidden of ["--apply", "--recover", "--launch",
    "--implement-helper", "--accept", "--publish"]) {
    assert.throws(() => parseCliArgs([forbidden]));
  }
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("v8 preserves the exact v7 whole-lesson formal state", () => {
  validateContract(bundle.report);
  assert.equal(bundle.report.schemaVersion, 8);
  assert.equal(bundle.report.status, "fail-closed-template-not-stable");
  assert.equal(bundle.report.templateStable, false);
  assert.deepEqual({
    members: bundle.report.scope.memberCount,
    pages: bundle.report.scope.activePageCount,
    shell: bundle.report.scope.shellCount,
    requirements: bundle.report.currentFormalState.requirements.total,
    rootReady: bundle.report.currentFormalState.requirements.rootReady,
    unresolvedNested:
      bundle.report.currentFormalState.requirements.unresolvedNested,
    unresolvedFrameDomains:
      bundle.report.currentFormalState.requirements
        .unresolvedFrameDomainDispositions,
    totalFrames: bundle.report.currentFormalState.frameObligations.total,
    authoritativeFrames:
      bundle.report.currentFormalState.frameObligations.authoritativeCaptured,
  }, {
    members: 47,
    pages: 46,
    shell: 1,
    requirements: 520,
    rootReady: 94,
    unresolvedNested: 426,
    unresolvedFrameDomains: 74,
    totalFrames: 44488,
    authoritativeFrames: 0,
  });
  assert.equal(bundle.report.predecessorDisposition.v7.preserved, true);
  assert.equal(bundle.report.predecessorDisposition.v7
    .authoritativeRecomputationMatched, true);
});

test("VB003 diagnostic currentness is bound without browser or acceptance promotion", () => {
  const current = bundle.report.latestAuditCurrentness
    .vb003CurrentJavascriptDiagnostic;
  assert.equal(current.decodedAndRehashedPngCount, 203);
  assert.deepEqual(current.exactChangedBindingKeys,
    ["completionLedger", "lessonReleaseLedger"]);
  assert.equal(current.allNonLedgerBindingsByteIdenticalToPredecessor, true);
  assert.equal(current.browserRecapturePerformed, false);
  assert.equal(current.formalCompletionEntryPresent, false);
  assert.equal(current.releaseStrictCompleteCount, 0);
  assert.equal(current.releaseMissingCount, 47);
  assert.equal(current.authorityAllFalse, true);
});

test("TS008 current source-static disposition remains separate from stale coverage", () => {
  const current = bundle.report.latestAuditCurrentness
    .ts008FrameDomainDisposition;
  assert.equal(current.currentDispositionCounts.unresolved, 0);
  assert.equal(current.currentDispositionCounts["composite-child-with-parent"],
    7);
  assert.equal(current.coverageCurrentAgainstDisposition, false);
  assert.deepEqual(current.exactChangedDispositionTimelineIds,
    ["sprite-354", "sprite-378"]);
  assert.equal(current.parentEntryStateEstablished, false);
  assert.equal(current.authoritativeOriginalRuntimeFrameCount, 0);
  assert.equal(current.authorityAllFalse, true);
  assert.equal(bundle.report.latestAuditCurrentness.formalStateChangeFromV7,
    false);
});

test("every implementation, runtime, acceptance, integration and release gate stays closed", () => {
  assert.equal(bundle.report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(bundle.report.downstreamTransactionBoundary.applyAuthorized,
    false);
  assert.deepEqual(bundle.report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.ok(Object.values(bundle.report.acceptanceEffects).every((value) =>
    value === false));
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-template-v8-")));
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
    await assert.rejects(() => checkContract(bundle, tempRoot),
      /byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
