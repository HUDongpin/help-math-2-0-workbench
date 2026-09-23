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
} from "./build-g4-l10-complete-migration-template-contract-v10.mjs";

const bundle = await buildBundle();

test("CLI is restricted to dry-run, no-clobber write, or read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("v10 preserves the v9 denominator and formal-state gate", () => {
  validateContract(bundle.report);
  assert.equal(bundle.report.scope.memberCount, 47);
  assert.equal(bundle.report.currentFormalState.requirements.total, 520);
  assert.equal(bundle.report.currentFormalState.requirements.rootReady, 94);
  assert.equal(bundle.report.currentFormalState.requirements.unresolvedNested,
    426);
  assert.equal(bundle.report.currentFormalState.requirements.naturalScheduleReady,
    0);
  assert.equal(bundle.report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(bundle.report.currentFormalState.frameObligations.total, 44488);
  assert.equal(bundle.report.currentFormalState.frameObligations
    .authoritativeCaptured, 0);
});

test("v10 binds source-filled target points and strict-branch probes", () => {
  const geometry = bundle.report.latestAuditCurrentness
    .ts007Sprite64InteractionGeometry;
  assert.equal(geometry.interactionTargets.length, 2);
  assert.deepEqual(geometry.interactionTargets.map((row) =>
    row.safeIntegerNativeStagePoint), [{x: 452, y: 240},
    {x: 352, y: 241}]);
  assert.ok(geometry.interactionTargets.every((row) =>
    row.roundedPointInsideNonzeroAlphaFill === true));
  assert.equal(geometry.integerAngleProbeCandidateCount, 8);
  assert.deepEqual(geometry.integerCoveredSourceBranches, [
    "degrees_Mirrored_gt_0_lt_180",
    "degrees_Mirrored_gt_180_lt_360",
  ]);
});

test("equality branches, formal trace, and disposition remain unresolved", () => {
  const geometry = bundle.report.latestAuditCurrentness
    .ts007Sprite64InteractionGeometry;
  assert.equal(geometry.equalityBranchMathematicalCandidateCount, 2);
  assert.equal(geometry.equalityBranchExecutableCandidateCount, 0);
  assert.equal(geometry.equalityBranchSubpixelPrecisionRequired, true);
  assert.equal(geometry.currentDisposition, "unresolved");
  assert.equal(geometry.formalTraceSpecification, false);
  assert.equal(geometry.captureKitCreated, false);
  assert.equal(geometry.pointerInputExecuted, false);
  assert.equal(geometry.runtimeEntryObserved, false);
  assert.equal(geometry.formalNaturalScheduleReadyCountChange, 0);
  assert.equal(geometry.formalStateChangeFromV9, false);
});

test("security, runtime, acceptance, and batch gates stay closed", () => {
  assert.equal(bundle.report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(bundle.report.downstreamTransactionBoundary.applyAuthorized,
    false);
  assert.equal(bundle.report.automationBoundary.templateBatchAdmissionAllowed,
    false);
  assert.equal(bundle.report.automationBoundary
    .remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(bundle.report.automationBoundary.wholeCourseIntegrationAllowed,
    false);
  assert.ok(Object.values(bundle.report.acceptanceEffects).every((value) =>
    value === false));
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-template-v10-")));
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
      /mode changed|byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
