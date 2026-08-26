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
} from "./build-g4-l10-ts007-sprite64-interaction-geometry-v1.mjs";

const bundle = await buildBundle();

test("CLI exposes only dry-run, no-clobber write, and read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("exact vector and transform chains derive the two native-stage target bounds", () => {
  validateReport(bundle.report);
  const [drag, movement] = bundle.report.interactionTargets;
  assert.deepEqual(drag.nativeStageAxisAlignedBoundsPixels,
    {left: 355.4, right: 547.65, top: 226.95, bottom: 253.55});
  assert.deepEqual(movement.nativeStageAxisAlignedBoundsPixels,
    {left: 342.7, right: 362.2, top: 230.85, bottom: 250.35});
  assert.deepEqual(bundle.report.transformChain.object60ToNativeStage,
    {a: 0, b: -1, c: -1, d: 0, tx: 4799, ty: 5126});
  assert.deepEqual(bundle.report.transformChain.object62ToNativeStage,
    {a: 0, b: -1, c: -1, d: 0, tx: 7049, ty: 4812});
});

test("rounded integer target points remain inside nonzero-alpha source fills", () => {
  const drag = bundle.report.interactionTargets.find((row) =>
    row.objectId === "60");
  const movement = bundle.report.interactionTargets.find((row) =>
    row.objectId === "62");
  assert.deepEqual(drag.safeIntegerNativeStagePoint, {x: 452, y: 240});
  assert.deepEqual(movement.safeIntegerNativeStagePoint, {x: 352, y: 241});
  assert.equal(drag.filledPathEvidence.fillAlpha, 255);
  assert.equal(movement.filledPathEvidence.fillAlpha, 133);
  assert.equal(drag.roundedPointInsideNonzeroAlphaFill, true);
  assert.equal(movement.roundedPointInsideNonzeroAlphaFill, true);
  assert.equal(drag.inputExecuted, false);
  assert.equal(movement.inputExecuted, false);
});

test("integer probes cover strict branches while equality branches remain subpixel-only", () => {
  assert.deepEqual(bundle.report.rotationAnchor.nativeStagePixels,
    {x: 539.25, y: 256.5});
  assert.equal(bundle.report.rotationAnchor.exactHorizontalAxisIsIntegerPixelRow,
    false);
  assert.equal(bundle.report.integerAngleProbeCandidates.length, 8);
  assert.deepEqual([...new Set(bundle.report.integerAngleProbeCandidates
    .map((row) => row.sourceBranch))].sort(), [
    "degrees_Mirrored_gt_0_lt_180",
    "degrees_Mirrored_gt_180_lt_360",
  ]);
  assert.deepEqual(bundle.report.exactEqualityBranchCandidates.map((row) =>
    row.sourceBranch), [
    "degrees_Mirrored_eq_180",
    "degrees_Mirrored_eq_360_or_0",
  ]);
  assert.ok(bundle.report.exactEqualityBranchCandidates.every((row) =>
    row.integerNativeStageCandidate === false &&
    row.operatorExecutableByThisReport === false));
});

test("formal trace, disposition, runtime, helper, and acceptance gates remain closed", () => {
  assert.equal(bundle.report.futureTraceCandidate.formalTraceSpecification,
    false);
  assert.equal(bundle.report.futureTraceCandidate.captureKit, false);
  assert.equal(bundle.report.futureTraceCandidate.executed, false);
  assert.equal(bundle.report.dispositionBoundary.currentDisposition,
    "unresolved");
  assert.equal(bundle.report.dispositionBoundary.successorDispositionAuthorized,
    false);
  assert.equal(bundle.report.securityAndRuntimeBoundary.securityBatchReusable,
    false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorizedByThisArtifact, false);
  assert.equal(bundle.report.predecessorGapEffect
    .formalNaturalScheduleReadyCountChange, 0);
  assert.ok(Object.values(bundle.report.authorityEffects).every((value) =>
    value === false));
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-ts007-sprite64-geometry-")));
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
      /mode changed|byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
