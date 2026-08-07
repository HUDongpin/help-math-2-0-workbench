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
  buildTriage,
  checkTriage,
  parseArguments,
  publishTriageNoClobber,
} from "./build-g4-l10-residual-frame-domain-audit-triage-v1.mjs";

test("CLI is report-only and rejects mutation/runtime modes", () => {
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

test("real release triage reconciles exactly 70 current unresolved pairs", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.equal(document.status,
    "residual-unresolved-exactly-enumerated-routed-no-disposition-change");
  assert.equal(document.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  assert.deepEqual(document.scope, {
    releaseMembers: 47,
    affectedMembers: 27,
    exactResidualPairs: 70,
    exactResidualLocalFrames: 7107,
    flaBackedPairs: 42,
    swfOnlyPairs: 28,
  });
  assert.deepEqual(document.reconciliation.currentResidual, {
    count: 70,
    sha256: "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.equal(document.residualPairs.length, 70);
  assert.ok(document.residualPairs.every(({currentDisposition}) =>
    currentDisposition === "unresolved"));
});

test("four evidence routes form a disjoint exact partition", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.deepEqual(document.categorySummaries.map((group) => ({
    id: group.id,
    count: group.count,
    flaBacked: group.flaBacked,
    swfOnly: group.swfOnly,
    frameCount: group.frameCount,
  })), [
    {id: "scripted-one-frame", count: 41, flaBacked: 21, swfOnly: 20, frameCount: 41},
    {id: "dynamic-indirect-parent", count: 21, flaBacked: 18, swfOnly: 3, frameCount: 457},
    {id: "shell-complex-lifecycle", count: 1, flaBacked: 0, swfOnly: 1, frameCount: 100},
    {id: "direct-root-long-audio", count: 7, flaBacked: 3, swfOnly: 4, frameCount: 6509},
  ]);
  const keys = document.residualPairs.map(({animationId, timelineId}) =>
    `${animationId}\t${timelineId}`);
  assert.equal(new Set(keys).size, 70);
});

test("TS007 detail and security/downstream boundaries remain closed", async () => {
  const {document} = await buildTriage(PROJECT_ROOT);
  assert.deepEqual(document.detailedGapEvidence.ts007Sprite64.pair, {
    animationId: "course-g04-l10-ts-007",
    timelineId: "sprite-64",
  });
  assert.equal(document.detailedGapEvidence.ts007Sprite64.disposition,
    "unresolved");
  assert.equal(document.formalProjectionBoundary
    .currentRawDispositionResidualCount, 70);
  assert.equal(document.formalProjectionBoundary
    .currentFormalRequirementProjectionResidualCount, 74);
  assert.deepEqual(document.formalProjectionBoundary
    .prohibitedTransactionModes, ["--apply", "--dry-run", "--check"]);
  assert.equal(document.authoringAndRuntimeBoundary.animateExecutionAuthorized,
    false);
  assert.equal(document.authoringAndRuntimeBoundary
    .originalRuntimeLaunchAuthorized, false);
  assert.ok(Object.values(document.authorityEffects)
    .every((value) => value === false));
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildTriage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-residual-triage-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishTriageNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.residualPairs, 70);
  assert.equal(result.originalRuntimeLaunched, false);
  assert.equal(result.applySupported, false);
  await assert.rejects(() => publishTriageNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "foreign replacement\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkTriage(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no report", async () => {
  const bundle = await buildTriage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-residual-triage-fail-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  await assert.rejects(() => publishTriageNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => {
      throw new Error("simulated drift before triage publication");
    },
  }), /simulated drift/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
