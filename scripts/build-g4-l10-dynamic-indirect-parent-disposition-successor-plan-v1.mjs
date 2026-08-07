#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-dynamic-indirect-parent-disposition-successor-plan-v1.json";

const FIXED_INPUTS = Object.freeze({
  candidate: Object.freeze({
    path: "reports/g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1.json",
    bytes: 131123,
    sha256: "ea5aea5bcffa1e4d2b3a1d64eb82158cc3238fa972e4380b0a16dfe5203a242d",
    mode: "0444",
  }),
  independentReview: Object.freeze({
    path: "reports/g4-l10-dynamic-indirect-parent-target-control-proof-candidate-independent-review-v1.json",
    bytes: 40041,
    sha256: "2928f2ec0779159fe4a6227d1251ec072973ad859b48e3521a0820094585f338",
    mode: "0444",
  }),
  residualTriage: Object.freeze({
    path: "reports/g4-l10-residual-frame-domain-audit-triage-v1.json",
    bytes: 124726,
    sha256: "ba515be75fbf9f8fd25ddbd9114a3e00996cdfb535f567c4518116118bb1a7f2",
    mode: "0444",
  }),
});

const EXACT_SELECTED = Object.freeze({
  count: 21,
  sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
  encoding: "sorted-animationId-tab-timelineId-newline-v1",
});
const EXACT_REMAINING = Object.freeze({
  count: 49,
  sha256: "ba406bfb552b63391abca420063762485388c6e4e8e6197c021431abd70ebace",
  encoding: "sorted-animationId-tab-timelineId-newline-v1",
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "staticEvidenceChange",
  "coverageRegeneration",
  "traceRegeneration",
  "keyframeRegeneration",
  "runtimePlanRegeneration",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "specificationAcceptance",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.mode, info.nlink, info.uid, info.gid,
    info.size, info.mtimeNs, info.ctimeNs].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  const record = {path: expected.path, bytes, byteCount: bytes.length,
    sha256: sha256(bytes), mode: modeString(before)};
  if (expected.bytes !== undefined) assert.equal(record.byteCount,
    expected.bytes, `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(record.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(record.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return record;
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function binding(record) {
  return {path: record.path, bytes: record.byteCount,
    sha256: record.sha256, mode: record.mode};
}

function pairKey(pair) {
  return `${pair.animationId}\t${pair.timelineId}`;
}

function pairSet(rows) {
  const keys = rows.map(pairKey).sort(compareText);
  assert.equal(new Set(keys).size, keys.length, "Pair set contains duplicates");
  return {
    count: keys.length,
    sha256: sha256(Buffer.from(keys.map((key) => `${key}\n`).join(""), "utf8")),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function descriptorSet(records) {
  const rows = [...records].sort((left, right) =>
    compareText(left.path, right.path)).map((record) =>
    `${record.path}\0${record.bytes}\0${record.sha256}\0${record.mode}\n`);
  return {
    count: records.length,
    sha256: sha256(Buffer.from(rows.join(""), "utf8")),
    encoding: "sorted-path-null-bytes-null-sha256-null-mode-newline-v1",
  };
}

function obligation(status) {
  return {required: true, satisfiedByDisposition: false, status};
}

function preservedObligations() {
  return {
    visual: obligation(
      "all-child-visual-states-remain-in-parent-domain-capture-and-human-review-scope"),
    button: obligation(
      "pending-source-button-definition-and-runtime-event-validation"),
    interaction: obligation(
      "pending-natural-runtime-interaction-and-parent-control-validation"),
    behavior: obligation(
      "pending-authoritative-parent-runtime-behavior-terminal-and-replay-validation"),
    fullFrame: obligation(
      "all-parent-frames-containing-child-state-remain-required-in-full-frame-capture"),
    rmse: obligation(
      "every-containing-parent-frame-remains-subject-to-rmse-and-formula-label-inspection"),
    audio: obligation(
      "pending-source-audio-and-runtime-synchronization-validation"),
  };
}

export async function buildSuccessorPlan(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const records = Object.fromEntries(await Promise.all(Object.entries(FIXED_INPUTS)
    .map(async ([key, expected]) => [key, await stableRead(root, expected)])));
  const candidate = JSON.parse(records.candidate.bytes.toString("utf8"));
  const review = JSON.parse(records.independentReview.bytes.toString("utf8"));
  const triage = JSON.parse(records.residualTriage.bytes.toString("utf8"));
  assert.equal(candidate.decision,
    "FREEZE_21_AS_SOURCE_CONTROL_PROOF_CANDIDATES_KEEP_ALL_21_UNRESOLVED");
  assert.deepEqual(candidate.exactCandidatePairSet, EXACT_SELECTED);
  assert.equal(review.status,
    "PASS_READ_ONLY_INDEPENDENT_REPARSE_NO_DISPOSITION_AUTHORITY");
  assert.equal(review.decision,
    "CANDIDATE_ACCURATE_FOR_PLAN_ONLY_SUCCESSOR_INPUT");
  assert.deepEqual(review.findings, {P0: 0, P1: 0, P2: 0, total: 0});
  assert.deepEqual(review.exactPairSet, EXACT_SELECTED);
  assert.equal(review.conclusion.reportMayFeedPlanOnlySuccessor, true);
  assert.equal(review.conclusion.reportMayFeedWorkspaceMutation, false);
  assert.equal(triage.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  assert.deepEqual(triage.reconciliation.currentResidual, {
    count: 70,
    sha256: "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });

  const selectedPairs = candidate.members.flatMap((member) =>
    member.candidateTimelines.map(({timelineId}) => ({
      animationId: member.animationId,
      timelineId,
    })));
  assert.deepEqual(pairSet(selectedPairs), EXACT_SELECTED);
  const selectedKeys = new Set(selectedPairs.map(pairKey));
  const remainingPairs = triage.residualPairs.filter((pair) =>
    !selectedKeys.has(pairKey(pair)));
  assert.deepEqual(pairSet(remainingPairs), EXACT_REMAINING);
  const remainingCategoryCounts = Object.fromEntries([
    "scripted-one-frame",
    "shell-complex-lifecycle",
    "direct-root-long-audio",
  ].map((categoryId) => [categoryId, remainingPairs.filter((pair) =>
    pair.categoryId === categoryId).length]));
  assert.deepEqual(remainingCategoryCounts, {
    "scripted-one-frame": 41,
    "shell-complex-lifecycle": 1,
    "direct-root-long-audio": 7,
  });

  const preimages = [];
  const memberPlans = [];
  for (const member of candidate.members) {
    const staticPreimage = member.inputBindings.staticEvidence;
    const dispositionPreimage = member.inputBindings.disposition;
    const [staticRecord, dispositionRecord] = await Promise.all([
      stableRead(root, staticPreimage),
      stableRead(root, dispositionPreimage),
    ]);
    assert.deepEqual(binding(staticRecord), staticPreimage,
      `${member.animationId}: static-evidence preimage drifted`);
    assert.deepEqual(binding(dispositionRecord), dispositionPreimage,
      `${member.animationId}: disposition preimage drifted`);
    preimages.push(staticPreimage, dispositionPreimage);
    const disposition = JSON.parse(dispositionRecord.bytes.toString("utf8"));
    const currentCounts = disposition.summary.dispositionCounts;
    const transitionCount = member.candidateTimelines.length;
    const transitions = member.candidateTimelines.map((target) => {
      const currentRows = disposition.timelines.filter(({timelineId}) =>
        timelineId === target.timelineId);
      assert.equal(currentRows.length, 1,
        `${member.animationId}/${target.timelineId}: disposition row differs`);
      assert.equal(currentRows[0].disposition, "unresolved");
      const parentPath = member.parentRootPaths.find(({parentTimelineId}) =>
        parentTimelineId === target.parentTimelineId);
      assert.ok(parentPath,
        `${member.animationId}/${target.timelineId}: parent path absent`);
      return {
        animationId: member.animationId,
        timelineId: target.timelineId,
        sourceObjectId: target.sourceObjectId,
        frameCount: target.frameCount,
        currentDisposition: "unresolved",
        proposedDisposition: "composite-child-with-parent",
        proposedRole: "multi-frame-scriptless-parent-clock-composite-child",
        claimScope: "local-playhead-fully-derived-from-declared-parent-clock",
        parentBinding: {
          parentTimelineId: target.parentTimelineId,
          parentSourceObjectId: target.parentSourceObjectId,
          parentFrameDomainId: target.parentFrameDomainId,
          parentFrameCount: target.parentFrameCount,
          parentBindingMode: "nested-declared-parent-local-clock-only",
          targetControlProofMode:
            "complete-swf-dynamic-reference-partition-v1",
          targetControlCandidateReport: binding(records.candidate),
          targetControlIndependentReview: binding(records.independentReview),
          parentEntryStateEstablished: false,
          parentRootPath: parentPath.rootPath,
          rootPlacement: null,
        },
        expectedTagCensus: target.expectedTagCensus,
        placements: target.placements,
        preservedObligations: preservedObligations(),
        authoritativeRuntimeEntryEstablished: false,
        strictAcceptanceEffect: "none",
      };
    });
    const projectedCounts = {
      "declared-frame-domain": currentCounts["declared-frame-domain"],
      "composite-child-with-parent":
        currentCounts["composite-child-with-parent"] + transitionCount,
      "independent-required": currentCounts["independent-required"],
      unresolved: currentCounts.unresolved - transitionCount,
      nonvisual: currentCounts.nonvisual,
    };
    assert.ok(projectedCounts.unresolved >= 0,
      `${member.animationId}: projected unresolved count is negative`);
    memberPlans.push({
      animationId: member.animationId,
      ordinal: member.ordinal,
      clusterId: member.clusterId,
      pairSet: member.exactPairSet,
      exactPreimages: {
        staticCompositeEvidence: staticPreimage,
        frameDomainDisposition: dispositionPreimage,
      },
      plannedOutputPaths: [staticPreimage.path, dispositionPreimage.path],
      plannedOutputBytesGenerated: false,
      plannedOutputSha256Generated: false,
      currentDispositionCounts: currentCounts,
      projectedDispositionCounts: projectedCounts,
      transitions,
      atomicMemberStateRequired: true,
      currentWorkspaceWriteAuthorizedByThisPlan: false,
    });
  }
  assert.equal(preimages.length, 22);
  assert.equal(new Set(preimages.map(({path: filePath}) => filePath)).size, 22);
  assert.equal(memberPlans.flatMap(({transitions}) => transitions).length, 21);

  const beforeTotals = triage.reconciliation.currentDispositionTotals;
  const projectedTotals = {
    declared: beforeTotals.declared,
    composite: beforeTotals.composite + EXACT_SELECTED.count,
    independentRequired: beforeTotals.independentRequired,
    unresolved: beforeTotals.unresolved - EXACT_SELECTED.count,
    nonvisual: beforeTotals.nonvisual,
    excludedNotProven: beforeTotals.excludedNotProven,
  };
  assert.deepEqual(projectedTotals, {
    declared: 260,
    composite: 779,
    independentRequired: 0,
    unresolved: 49,
    nonvisual: 0,
    excludedNotProven: 210,
  });

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-dynamic-indirect-parent-disposition-successor-plan-v1",
    status: "FROZEN_PLAN_ONLY_NOT_APPLIED_NO_WORKSPACE_MUTATION_AUTHORITY",
    decision:
      "PLAN_EXACT_21_UNRESOLVED_TO_COMPOSITE_PROJECT_70_TO_49_DO_NOT_APPLY",
    fixedEvidenceInputs: Object.fromEntries(Object.entries(records).map(
      ([key, record]) => [key, binding(record)])),
    exactSelectedPairSet: pairSet(selectedPairs),
    exactRemainingPairSet: pairSet(remainingPairs),
    remainingCategoryCounts,
    exactPreimageSet: descriptorSet(preimages),
    scope: {
      affectedMembers: memberPlans.length,
      plannedTransitionPairs: selectedPairs.length,
      plannedWorkspaceFiles: preimages.length,
      plannedStaticEvidenceFiles: memberPlans.length,
      plannedDispositionFiles: memberPlans.length,
      plannedOutputBytesGenerated: 0,
      workspaceFilesWritten: 0,
      originalRuntimeSessions: 0,
    },
    aggregateProjection: {
      currentRawDispositionTotals: beforeTotals,
      projectedRawDispositionTotalsNotApplied: projectedTotals,
      currentRawResidualPairSet: triage.reconciliation.currentResidual,
      projectedRawResidualPairSetNotApplied: pairSet(remainingPairs),
      currentFormalRequirementProjectionResidualCount: 74,
      projectedFormalRequirementProjectionChangedByThisPlan: false,
      rule:
        "The 70 to 49 result is an exact raw-disposition projection only. No current workspace or formal downstream artifact changed.",
    },
    requiredFutureProofEngineChange: {
      genericAuditMustRemainFailClosed: true,
      newNarrowFunctionRequired: true,
      exactGenericDisqualifiersRequired: [
        "dynamic-movieclip-addressing-present",
        "declared-parent-does-not-have-one-direct-root-placement",
      ],
      targetControlCandidateAndIndependentReviewMustBeHashBound: true,
      admittedProofRole:
        "multi-frame-scriptless-parent-clock-composite-child",
      admittedParentBindingMode:
        "nested-declared-parent-local-clock-only",
      requiredTargetControlProofMode:
        "complete-swf-dynamic-reference-partition-v1",
      parentEntryStateEstablished: false,
      directRootGenericCandidateSpecsMayChange: false,
    },
    memberPlans,
    futureTransactionContract: {
      planOnly: true,
      applicationImplemented: false,
      applySupportedByThisPlan: false,
      recoverSupportedByThisPlan: false,
      rollbackSupportedByThisPlan: false,
      exactPreimageRequired: true,
      noClobberRequired: true,
      all22FilesAtomicOrNoChange: true,
      mixedMemberStateForbidden: true,
      successorOutputBytesAndHashesMustBeGeneratedAndIndependentlyReviewedBeforeApply:
        true,
      explicitOwnershipAndEditAuthorizationRequiredFor11UntrackedMigrationDirectories:
        true,
      protectedInstallationAuthorized: false,
      originalRuntimeLaunchAuthorized: false,
    },
    prohibitedDownstreamTransaction: {
      script:
        "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs",
      prohibitedModes: ["--apply", "--dry-run", "--check"],
      invokedByThisPlan: false,
      reason:
        "The existing 114-output transaction remains prohibited by the retained native-helper/path-custody safety boundary.",
    },
    unresolvedAfterProjection: {
      exactPairSet: pairSet(remainingPairs),
      scriptedOneFrame: 41,
      shellComplexLifecycle: 1,
      directRootLongAudio: 7,
      missingGrade4Mp3: 16,
      parentEntryRuntimeEvidenceStillRequiredForSelected21: true,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      workspaceMutationSupported: false,
      dispositionSuccessorMaterializationSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 plan; never write any planned migration, disposition, static evidence, source, helper, or runtime output`,
    authorityEffects,
    nextPermittedAction:
      "Obtain explicit ownership/edit authorization for the 11 untracked migration directories. Then implement a separate exact-preimage/no-clobber materializer that first generates and independently reviews all 22 successor bytes without invoking the prohibited 114-output transaction; application remains a later separately authorized step.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const planFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, planFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildSuccessorPlan(bundle.root);
  assert.equal(current.json, bundle.json,
    "Disposition successor plan inputs changed after derivation");
}

export async function checkSuccessorPlan(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {path: REPORT_RELATIVE,
    bytes: expected.length, sha256: sha256(expected), mode: "0444"});
  assert.deepEqual(observed.bytes, expected,
    "Disposition successor plan report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    planFingerprintSha256: bundle.document.planFingerprintSha256,
    plannedPairs: bundle.document.scope.plannedTransitionPairs,
    plannedWorkspaceFiles: bundle.document.scope.plannedWorkspaceFiles,
    currentRawResidualCount:
      bundle.document.aggregateProjection.currentRawResidualPairSet.count,
    projectedRawResidualCountNotApplied:
      bundle.document.aggregateProjection.projectedRawResidualPairSetNotApplied.count,
    workspaceFilesWritten: 0,
    originalRuntimeLaunched: false,
    applySupported: false,
  };
}

export async function publishSuccessorPlanNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkSuccessorPlan(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildSuccessorPlan(projectRoot);
  if (mode === "--write-no-clobber") return publishSuccessorPlanNoClobber(bundle);
  if (mode === "--check") return checkSuccessorPlan(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    planFingerprintSha256: bundle.document.planFingerprintSha256,
    plannedPairs: bundle.document.scope.plannedTransitionPairs,
    plannedWorkspaceFiles: bundle.document.scope.plannedWorkspaceFiles,
    currentRawResidualCount:
      bundle.document.aggregateProjection.currentRawResidualPairSet.count,
    projectedRawResidualCountNotApplied:
      bundle.document.aggregateProjection.projectedRawResidualPairSetNotApplied.count,
    workspaceFilesWritten: 0,
    originalRuntimeLaunched: false,
    applySupported: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
