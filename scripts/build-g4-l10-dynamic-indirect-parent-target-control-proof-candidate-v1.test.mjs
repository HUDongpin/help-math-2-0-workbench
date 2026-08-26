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
  buildCandidate,
  checkCandidate,
  parseArguments,
  publishCandidateNoClobber,
} from "./build-g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1.mjs";

test("CLI is report-only and rejects mutation, helper, and runtime modes", () => {
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

test("real candidate freezes the exact 21 unresolved dynamic-indirect-parent pairs", async () => {
  const {document} = await buildCandidate(PROJECT_ROOT);
  assert.equal(document.status,
    "all-21-target-control-candidates-frozen-current-dispositions-unresolved");
  assert.equal(document.decision,
    "FREEZE_21_AS_SOURCE_CONTROL_PROOF_CANDIDATES_KEEP_ALL_21_UNRESOLVED");
  assert.deepEqual(document.exactCandidatePairSet, {
    count: 21,
    sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.equal(document.scope.affectedMembers, 11);
  assert.equal(document.scope.exactPairs, 21);
  assert.equal(document.scope.exactLocalFrames, 457);
  assert.equal(document.members.flatMap(({candidateTimelines}) =>
    candidateTimelines).length, 21);
  assert.ok(document.members.flatMap(({candidateTimelines}) =>
    candidateTimelines).every(({currentDisposition}) =>
    currentDisposition === "unresolved"));
});

test("three exact script/control clusters partition all 21 pairs", async () => {
  const {document} = await buildCandidate(PROJECT_ROOT);
  assert.deepEqual(document.clusterSummaries.map((cluster) => ({
    id: cluster.id,
    members: cluster.memberCount,
    pairs: cluster.pairSet.count,
    frames: cluster.localFrameCount,
  })), [
    {id: "feedback-html-property-write", members: 7, pairs: 10, frames: 211},
    {id: "ti002-named-parent-and-peer-control", members: 1, pairs: 3, frames: 63},
    {id: "rect-visibility-property-write", members: 3, pairs: 8, frames: 183},
  ]);
  assert.equal(document.scope.dynamicReferenceCount, 36);
  assert.equal(document.clusterSummaries.reduce((total, {pairSet}) =>
    total + pairSet.count, 0), 21);
});

test("target-child control proof preserves the TI002 parent-control boundary", async () => {
  const {document} = await buildCandidate(PROJECT_ROOT);
  assert.equal(document.sourceControlConclusion
    .directDynamicControlOfTargetChildPlayheadFound, false);
  assert.equal(document.sourceControlConclusion.parentEntryStateEstablished,
    false);
  const ti002 = document.members.find(({animationId}) =>
    animationId === "course-g04-l10-ti-002");
  assert.ok(ti002);
  assert.equal(ti002.proofBoundary
    .namedParentOrPeerPlayheadControlRetained, true);
  assert.equal(ti002.proofBoundary.parentEntryStateEstablished, false);
  assert.ok(ti002.dynamicReferences.some(({operationClass,
    mayAddressDeclaredParent}) => operationClass ===
      "named-parent-or-peer-playhead-control" && mayAddressDeclaredParent));
  assert.ok(document.members.flatMap(({candidateTimelines}) =>
    candidateTimelines).every((timeline) =>
    timeline.targetIncomingInstanceNames.length === 0
      && timeline.ffdecFrameScriptCount === 0
      && timeline.attributedDoInitActionCount === 0));
});

test("all authority and downstream mutation effects remain closed", async () => {
  const {document} = await buildCandidate(PROJECT_ROOT);
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
  assert.equal(document.residualBoundary.currentRawResidualCountBefore, 70);
  assert.equal(document.residualBoundary.currentRawResidualCountAfter, 70);
  assert.equal(document.residualBoundary.selectedPairsRemovedFromResidualByThisReport,
    0);
  assert.equal(document.residualBoundary.formalRequirementProjectionResidualCount,
    74);
  assert.deepEqual(document.residualBoundary
    .downstreamTransactionModesStillProhibited,
  ["--apply", "--dry-run", "--check"]);
  assert.equal(document.implementationBoundary.originalRuntimeLaunchSupported,
    false);
  assert.equal(document.implementationBoundary.applySupported, false);
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildCandidate(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-parent-proof-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishCandidateNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.exactPairs, 21);
  assert.equal(result.currentResidualCount, 70);
  assert.equal(result.originalRuntimeLaunched, false);
  assert.equal(result.dispositionChanged, false);
  await assert.rejects(() => publishCandidateNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "foreign replacement\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkCandidate(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no report", async () => {
  const bundle = await buildCandidate(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-dynamic-parent-proof-fail-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  await assert.rejects(() => publishCandidateNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => {
      throw new Error("simulated drift before candidate publication");
    },
  }), /simulated drift/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
