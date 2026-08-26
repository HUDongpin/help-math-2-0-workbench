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
  buildSuccessorPlan,
  checkSuccessorPlan,
  parseArguments,
  publishSuccessorPlanNoClobber,
} from "./build-g4-l10-dynamic-indirect-parent-disposition-successor-plan-v1.mjs";

test("CLI is plan-only and rejects apply, helper, and runtime modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--apply", "--recover", "--rollback", "--write",
    "--force", "--launch", "--execute-helper", "--install"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("plan binds exact 21 selected and 49 remaining pairs", async () => {
  const {document} = await buildSuccessorPlan(PROJECT_ROOT);
  assert.equal(document.status,
    "FROZEN_PLAN_ONLY_NOT_APPLIED_NO_WORKSPACE_MUTATION_AUTHORITY");
  assert.deepEqual(document.exactSelectedPairSet, {
    count: 21,
    sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(document.exactRemainingPairSet, {
    count: 49,
    sha256: "ba406bfb552b63391abca420063762485388c6e4e8e6197c021431abd70ebace",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(document.remainingCategoryCounts, {
    "scripted-one-frame": 41,
    "shell-complex-lifecycle": 1,
    "direct-root-long-audio": 7,
  });
});

test("plan freezes 22 exact preimages and no successor output bytes", async () => {
  const {document} = await buildSuccessorPlan(PROJECT_ROOT);
  assert.equal(document.scope.affectedMembers, 11);
  assert.equal(document.scope.plannedTransitionPairs, 21);
  assert.equal(document.scope.plannedWorkspaceFiles, 22);
  assert.equal(document.exactPreimageSet.count, 22);
  assert.equal(document.scope.plannedOutputBytesGenerated, 0);
  assert.equal(document.scope.workspaceFilesWritten, 0);
  assert.equal(document.memberPlans.length, 11);
  assert.equal(document.memberPlans.flatMap(({transitions}) =>
    transitions).length, 21);
  assert.ok(document.memberPlans.every(({plannedOutputBytesGenerated,
    plannedOutputSha256Generated, currentWorkspaceWriteAuthorizedByThisPlan}) =>
    !plannedOutputBytesGenerated && !plannedOutputSha256Generated
      && !currentWorkspaceWriteAuthorizedByThisPlan));
});

test("70 to 49 is projection only and preserves every acceptance obligation", async () => {
  const {document} = await buildSuccessorPlan(PROJECT_ROOT);
  assert.deepEqual(document.aggregateProjection.projectedRawDispositionTotalsNotApplied,
    {declared: 260, composite: 779, independentRequired: 0, unresolved: 49,
      nonvisual: 0, excludedNotProven: 210});
  assert.equal(document.aggregateProjection
    .projectedFormalRequirementProjectionChangedByThisPlan, false);
  const transitions = document.memberPlans.flatMap(({transitions}) => transitions);
  assert.ok(transitions.every(({currentDisposition, proposedDisposition,
    parentBinding, preservedObligations, authoritativeRuntimeEntryEstablished,
    strictAcceptanceEffect}) => currentDisposition === "unresolved"
      && proposedDisposition === "composite-child-with-parent"
      && parentBinding.parentEntryStateEstablished === false
      && parentBinding.targetControlProofMode ===
        "complete-swf-dynamic-reference-partition-v1"
      && Object.values(preservedObligations).every(({required,
        satisfiedByDisposition}) => required && !satisfiedByDisposition)
      && authoritativeRuntimeEntryEstablished === false
      && strictAcceptanceEffect === "none"));
});

test("plan retains authorization and prohibited transaction boundaries", async () => {
  const {document} = await buildSuccessorPlan(PROJECT_ROOT);
  assert.equal(document.futureTransactionContract.applicationImplemented, false);
  assert.equal(document.futureTransactionContract.applySupportedByThisPlan, false);
  assert.equal(document.futureTransactionContract
    .explicitOwnershipAndEditAuthorizationRequiredFor11UntrackedMigrationDirectories,
  true);
  assert.deepEqual(document.prohibitedDownstreamTransaction.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(document.prohibitedDownstreamTransaction.invokedByThisPlan, false);
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
});

test("plan publication is no-clobber and check rejects tamper", async () => {
  const bundle = await buildSuccessorPlan(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-successor-plan-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishSuccessorPlanNoClobber(bundle,
    {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.plannedPairs, 21);
  assert.equal(result.projectedRawResidualCountNotApplied, 49);
  assert.equal(result.workspaceFilesWritten, 0);
  await assert.rejects(() => publishSuccessorPlanNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkSuccessorPlan(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no successor plan", async () => {
  const bundle = await buildSuccessorPlan(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-successor-plan-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishSuccessorPlanNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated plan stop"); },
  }), /simulated plan stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
