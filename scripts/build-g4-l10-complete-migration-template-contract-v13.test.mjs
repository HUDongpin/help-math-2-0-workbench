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
  checkContract,
  parseCliArgs,
  publishNoClobber,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v13.mjs";

const bundle = await buildBundle();

test("v13 binds exact v12 and TS007 currentness without authority expansion", () => {
  const report = bundle.report;
  validateContract(report);
  assert.equal(report.schemaVersion, 13);
  assert.equal(report.successorOf.sha256,
    "7611ea345ba34354e762eaa9fcf9ebacc20c93495b750c8de4adef9bf2ac08bc");
  const ts007 = report.latestAuditCurrentness.ts007FrameDomainDisposition;
  assert.equal(ts007.json.sha256,
    "b5027565781e14f7dca4c419695bfc2899f985fc6ad19017b750dad77073e0bc");
  assert.equal(ts007.reportFingerprintSha256,
    "095c1f6d16c215ebf0b9f16150a448baaf4cc674ab530b22a8200d09f968f180");
  assert.equal(ts007.parseStable, true);
  assert.equal(ts007.undefinedValueCount, 0);
  assert.equal(ts007.directFfdecFrameScriptCount, 1);
  assert.deepEqual(ts007.unresolvedTimelineIds, ["sprite-64"]);
  assert.equal(ts007.coverageCurrentAgainstDisposition, false);
  assert.equal(ts007.formalStateChangeFromV12, false);
  assert.equal(ts007.templateStableEffect, false);
  assert.equal(ts007.acceptanceEffect, "none");
  assert.equal(ts007.authorityAllFalse, true);
});

test("v13 reconciles TS007 and TS008 while keeping raw/formal state unchanged", () => {
  const currentness = bundle.report.templateCurrentnessReconciliation;
  assert.deepEqual(currentness.ts007, {
    currentDispositionUnresolvedCount: 1,
    unresolvedTimelineIds: ["sprite-64"],
    coverageCurrentAgainstDisposition: false,
    changedRelativeToCoverageTimelineIds: ["sprite-355", "sprite-379"],
  });
  assert.deepEqual(currentness.ts008, {
    currentDispositionUnresolvedCount: 0,
    unresolvedTimelineIds: [],
    coverageCurrentAgainstDisposition: false,
    changedRelativeToCoverageTimelineIds: ["sprite-354", "sprite-378"],
  });
  assert.equal(currentness.rawDispositionResidualCount, 70);
  assert.equal(currentness.formalRequirementProjectionResidualCount, 74);
  assert.equal(currentness.exactStaleProjectionDifference, 4);
  assert.equal(currentness.naturalScheduleReadyRequirementCount, 0);
  assert.equal(currentness.changeCreatedByV13, 0);
  assert.equal(currentness.downstreamRegenerationPerformed, false);
});

test("v13 leaves the complete L10 migration and acceptance gates fail-closed", () => {
  const report = bundle.report;
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.currentFormalState.sourceCustody.present, 47);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations
    .authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(report.currentFormalState.originalRuntime.operatorActivated,
    false);
  assert.equal(report.currentFormalState.javascript.registeredFormalRendererCount,
    0);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
});

test("v13 does not create review, helper, transaction, or runtime authority", () => {
  const report = bundle.report;
  assert.equal(report.authorityBoundary.mayCreateUserOwnedTask, false);
  assert.equal(report.authorityBoundary.createsReviewSetManifest, false);
  assert.equal(report.authorityBoundary.mayRunPhaseAOrPhaseB, false);
  assert.equal(report.authorityBoundary.mayImplementOrTestProductionHelper,
    false);
  assert.equal(report.authorityBoundary.mayPerformProtectedInstallation,
    false);
  assert.equal(report.authorityBoundary.mayExecuteHelper, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.authorityBoundary.mayApplyDownstreamTransaction, false);
  assert.equal(report.authorityBoundary.mayRegisterRenderer, false);
  assert.deepEqual(report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.reviewSetManifestBound, false);
});

test("v13 dry-run is deterministic and acceptance-neutral", async () => {
  const second = await buildBundle();
  assert.equal(second.json, bundle.json);
  assert.equal(second.markdown, bundle.markdown);
  assert.equal(second.report.reportFingerprintSha256,
    bundle.report.reportFingerprintSha256);
  assert.equal(second.report.templateCurrentnessReconciliation.changeCreatedByV13,
    0);
});

test("v13 no-clobber publication writes immutable outputs and rejects reuse", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-template-contract-v13-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
    assert.equal(published.schemaVersion, 13);
    assert.deepEqual(published.ts007UnresolvedTimelineIds, ["sprite-64"]);
    assert.deepEqual(published.ts008UnresolvedTimelineIds, []);
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

test("v13 validator fails closed on currentness, runtime, or acceptance drift", () => {
  for (const mutate of [
    (copy) => { copy.templateCurrentnessReconciliation
      .rawDispositionResidualCount = 69; },
    (copy) => { copy.latestAuditCurrentness.ts007FrameDomainDisposition
      .unresolvedTimelineIds = []; },
    (copy) => { copy.latestAuditCurrentness.ts007FrameDomainDisposition
      .coverageCurrentAgainstDisposition = true; },
    (copy) => { copy.currentFormalState.requirements.naturalScheduleReady = 1; },
    (copy) => { copy.currentFormalState.originalRuntime.runtimeSessions = 1; },
    (copy) => { copy.authorityBoundary.mayRunPhaseAOrPhaseB = true; },
    (copy) => { copy.acceptanceEffects.ownerAcceptance = true; },
  ]) {
    const copy = structuredClone(bundle.report);
    mutate(copy);
    assert.throws(() => validateContract(copy));
  }
});

test("v13 CLI accepts exactly one explicit non-overwriting mode", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});
