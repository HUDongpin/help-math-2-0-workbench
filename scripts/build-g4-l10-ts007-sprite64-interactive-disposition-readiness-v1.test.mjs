import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildReadiness,
  checkReadiness,
  parseArguments,
  publishReadinessNoClobber,
} from "./build-g4-l10-ts007-sprite64-interactive-disposition-readiness-v1.mjs";

test("CLI is report-only and rejects mutation and runtime modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of [
    "--apply",
    "--recover",
    "--rollback",
    "--write",
    "--force",
    "--launch",
    "--execute-helper",
    "--install",
  ]) assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("real source-static recomputation keeps sprite-64 unresolved", async () => {
  const bundle = await buildReadiness(PROJECT_ROOT);
  const report = bundle.document;
  assert.equal(report.status,
    "source-static-interactive-gap-frozen-disposition-unresolved");
  assert.equal(report.decision,
    "KEEP_UNRESOLVED_DO_NOT_CLASSIFY_DO_NOT_APPLY");
  assert.equal(report.dispositionConclusion.currentDisposition, "unresolved");
  assert.equal(report.dispositionConclusion.compositeChildWithParentSupported,
    false);
  assert.equal(report.dispositionConclusion.independentRequiredSupported,
    false);
  assert.equal(report.dispositionConclusion.nonvisualSupported, false);
  assert.deepEqual(report.independentStaticRecomputation
    .eligibleSingleFrameTimelineIds, [
    "sprite-60",
    "sprite-62",
    "sprite-63",
    "sprite-77",
    "sprite-79",
    "sprite-203",
    "sprite-226",
    "sprite-419",
  ]);
  assert.deepEqual(report.independentStaticRecomputation.sprite64.disqualifiers,
    ["swfmill-do-action-present", "ffdec-frame-script-present"]);
  assert.equal(report.independentStaticRecomputation.sprite64
    .ffdecPlacedClipActionPresentOutsideDirectFrameScriptClassifier, true);
  assert.equal(report.interactiveScriptCluster.scenarioInventoryRecords.length,
    6);
  assert.deepEqual(report.interactiveScriptCluster.scenarioInventoryRecords
    .map(({id}) => id), [
    "script-0083",
    "script-0084",
    "script-0085",
    "script-0086",
    "script-0087",
    "script-0088",
  ]);
});

test("report freezes runtime matrix without granting authority", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  assert.equal(document.requiredFutureOriginalRuntimeObservationMatrix.status,
    "required-not-executed");
  assert.deepEqual(
    document.requiredFutureOriginalRuntimeObservationMatrix.languages,
    ["en", "es"],
  );
  assert.equal(document.requiredFutureOriginalRuntimeObservationMatrix
    .exactMouseCoordinatesPredeclared, false);
  assert.equal(document.downstreamStalenessAndSafetyBoundary
    .coverageCurrentAgainstDisposition, false);
  assert.deepEqual(document.downstreamStalenessAndSafetyBoundary
    .downstreamTransactionProhibitedModes,
  ["--apply", "--dry-run", "--check"]);
  assert.equal(document.helperAndRuntimeBoundary.reviewBatchReusable, false);
  assert.equal(document.helperAndRuntimeBoundary.originalRuntimeLaunchAuthorized,
    false);
  assert.ok(Object.values(document.authorityEffects)
    .every((value) => value === false));
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-ts007-sprite64-readiness-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.sprite64Disposition, "unresolved");
  assert.equal(result.originalRuntimeLaunched, false);
  assert.equal(result.applySupported, false);
  await assert.rejects(() => publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "foreign replacement\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkReadiness(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no report", async () => {
  const bundle = await buildReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-ts007-sprite64-readiness-fail-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  await assert.rejects(() => publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => {
      throw new Error("simulated drift before evidence publication");
    },
  }), /simulated drift/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
