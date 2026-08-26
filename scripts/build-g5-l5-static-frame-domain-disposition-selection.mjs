#!/usr/bin/env node

import {constants} from "node:fs";
import {createHash, randomBytes} from "node:crypto";
import {
  link,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  validateG5L5StaticFrameDomainDispositionCandidateShape,
  validateG5L5StaticFrameDomainDispositionCandidates,
} from "./build-g5-l5-static-frame-domain-disposition-candidates.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const SCRIPT_RELATIVE =
  "scripts/build-g5-l5-static-frame-domain-disposition-selection.mjs";
const EVIDENCE_MATERIALIZER_RELATIVE =
  "scripts/build-g5-l5-static-frame-domain-disposition-evidence.mjs";
const CANDIDATE_REPORT_RELATIVE =
  "reports/g5-l5-static-frame-domain-disposition-candidates.json";
const CANDIDATE_GENERATOR_RELATIVE =
  "scripts/build-g5-l5-static-frame-domain-disposition-candidates.mjs";
const PROOF_ENGINE_RELATIVE =
  "scripts/build-static-frame-domain-disposition-evidence.mjs";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";

export const G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH =
  "reports/g5-l5-static-frame-domain-disposition-selection-receipt.json";
export const G5_L5_RUNTIME_UNVERIFIED_PLANNING_REGISTRY_RELATIVE_PATH =
  "reports/g5-l5-runtime-unverified-frame-domain-planning-registry.json";

const OUTPUT_PATHS = Object.freeze([
  G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
  G5_L5_RUNTIME_UNVERIFIED_PLANNING_REGISTRY_RELATIVE_PATH,
]);
const EXPECTED = Object.freeze({
  releaseMembers: 57,
  selectedMembers: 28,
  selectedOneFrameTimelines: 696,
  pendingMembers: 57,
  pendingOneFrameTimelines: 48,
  pendingMultiFrameTimelines: 303,
  pendingTimelines: 351,
  pendingFrames: 34159,
  excludedNotProvenDefinitions: 185,
});
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const STRICT_EFFECT =
  "none; engineering-only static independent-local-playhead selection and noncanonical runtime-unverified planning only; no runtime, visual, audio, behavior, human, Owner, strict-completion, or publication acceptance";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareTimelineIds(left, right) {
  const leftNumber = Number(String(left).replace(/^sprite-/, ""));
  const rightNumber = Number(String(right).replace(/^sprite-/, ""));
  return leftNumber - rightNumber || compareText(String(left), String(right));
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`));
}

function resolveProjectPath(projectRoot, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${relativePath || "path"} must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath) &&
      path.relative(projectRoot, absolutePath).split(path.sep).join("/") ===
        relativePath,
    `${relativePath} escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function signature(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameSignature(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameDisplacedSignature(left, right) {
  return [
    "dev",
    "ino",
    "mode",
    "size",
    "mtimeNs",
    "nlink",
  ].every((key) => left?.[key] === right?.[key]);
}

function sameInodeSignature(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function directoryIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
  };
}

async function assertOrdinaryAncestorTree(
  projectRoot,
  absolutePath,
  label,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedPath = path.resolve(absolutePath);
  invariant(
    isWithin(resolvedRoot, resolvedPath),
    `${label} escapes the project root`,
  );
  const rootInformation = await lstat(resolvedRoot, {bigint: true});
  invariant(
    rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} project root must be an ordinary directory`,
  );
  const realRoot = await realpath(resolvedRoot);
  let cursor = resolvedRoot;
  for (const component of path.relative(
    resolvedRoot,
    path.dirname(resolvedPath),
  ).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor, {bigint: true});
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label} ancestor must be an ordinary directory`,
    );
    invariant(
      isWithin(realRoot, await realpath(cursor)),
      `${label} ancestor resolves outside the project root`,
    );
  }
  const parentInformation = await lstat(
    path.dirname(resolvedPath),
    {bigint: true},
  );
  return {
    parentPath: path.dirname(resolvedPath),
    parentIdentity: directoryIdentity(parentInformation),
  };
}

async function readStableFile(projectRoot, relativePath, {
  json = false,
  required = true,
} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  await assertOrdinaryAncestorTree(
    projectRoot,
    absolutePath,
    relativePath,
  );
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT" && !required) return null;
    throw error;
  });
  if (!before) return null;
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be an ordinary single-link file`,
  );
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | (constants.O_NOFOLLOW || 0),
  );
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    descriptorBefore.isFile() &&
      descriptorBefore.nlink === 1n &&
      sameSignature(signature(before), signature(descriptorBefore)) &&
      sameSignature(signature(descriptorBefore), signature(descriptorAfter)) &&
      sameSignature(signature(descriptorAfter), signature(after)) &&
      BigInt(bytes.length) === descriptorAfter.size,
    `${relativePath} changed while it was read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    signature: signature(after),
    ...(json ? {document: JSON.parse(bytes.toString("utf8"))} : {}),
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: record.byteCount,
    sha256: record.sha256,
  };
}

function canonicalPairBytes(pairs) {
  const rows = pairs
    .map(({animationId, timelineId}) => `${animationId}\t${timelineId}`)
    .sort(compareText);
  return Buffer.from(`${rows.join("\n")}\n`, "utf8");
}

function withFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  return {
    ...projected,
    artifactFingerprintSha256: sha256(stableJson(projected)),
  };
}

function validateFingerprint(document, label) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  invariant(
    SHA256_PATTERN.test(document.artifactFingerprintSha256 || "") &&
      document.artifactFingerprintSha256 === sha256(stableJson(projected)),
    `${label} fingerprint is stale`,
  );
}

function assertAllFalse(value, label) {
  invariant(
    value &&
      Object.values(value).length > 0 &&
      Object.values(value).every((item) => item === false),
    `${label} must contain only false values`,
  );
}

function acceptanceEffects() {
  return {
    runtimeReachabilityEstablished: false,
    authoritativeOriginalRuntimeAccepted: false,
    authoringAccepted: false,
    frameDomainDispositionAcceptedByHuman: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    behaviorAccepted: false,
    fullFrameComparisonAccepted: false,
    rmseAccepted: false,
    independentEngineeringAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    publicationAuthorized: false,
    published: false,
  };
}

function protectedMutations() {
  return {
    migrationManifestChanged: false,
    assetInventoryChanged: false,
    keyframesChanged: false,
    canonicalCoverageChanged: false,
    implementationChanged: false,
    rendererSelected: false,
    traceSpecificationCreated: false,
    acceptanceChanged: false,
    completionLedgerChanged: false,
    publicationChanged: false,
  };
}

function buildSelectionReceipt({
  candidateReport,
  candidateRecord,
  candidateGeneratorRecord,
  proofEngineRecord,
  releaseCatalogRecord,
  selectionMaterializerRecord,
  evidenceMaterializerRecord,
}) {
  const selectedMembers = candidateReport.members
    .filter(({oneFrame}) => oneFrame.eligibleCandidateCount > 0)
    .map((member) => ({
      releaseOrdinal: member.releaseOrdinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      expectedTimelineCount: member.oneFrame.eligibleCandidateCount,
      expectedTimelineIds: member.oneFrame.eligibleCandidates
        .map(({timelineId}) => timelineId)
        .sort(compareTimelineIds),
    }));
  const acceptedPairs = selectedMembers.flatMap((member) =>
    member.expectedTimelineIds.map((timelineId) => ({
      animationId: member.animationId,
      timelineId,
    })));
  const excludedPairs = candidateReport.members.flatMap((member) => [
    ...member.oneFrame.excludedCandidates,
    ...member.multiFrame.excludedCandidates,
  ].map(({timelineId}) => ({
    animationId: member.animationId,
    timelineId,
  })));
  const acceptedPairBytes = canonicalPairBytes(acceptedPairs);
  const excludedPairBytes = canonicalPairBytes(excludedPairs);
  invariant(
    selectedMembers.length === EXPECTED.selectedMembers &&
      acceptedPairs.length === EXPECTED.selectedOneFrameTimelines &&
      excludedPairs.length === EXPECTED.pendingTimelines,
    "candidate report no longer has the exact 696 selected / 351 pending partition",
  );
  return withFingerprint({
    schemaVersion: 1,
    receiptType:
      "g5-l5-engineering-static-frame-domain-disposition-selection",
    releaseId: RELEASE_ID,
    evidenceState:
      "exact-engineering-only-source-static-selection-no-human-or-owner-review",
    decision: {
      reviewerKind: "codex-engineering-source-proof-review",
      humanReviewer: false,
      humanSignature: null,
      ownerAcceptance: false,
      decision:
        "accept-exact-eligible-one-frame-set-for-static-independent-local-playhead-disposition-only",
      proofType: "single-frame-scriptless-structural-child",
      claimScope: "independent-local-playhead-only",
    },
    generatedBy: descriptor(selectionMaterializerRecord),
    materializers: {
      selection: descriptor(selectionMaterializerRecord),
      evidence: descriptor(evidenceMaterializerRecord),
    },
    release: {
      memberCount: candidateReport.release.memberCount,
      pageCount: candidateReport.release.pageCount,
      shellCount: candidateReport.release.shellCount,
      releaseFingerprintSha256:
        candidateReport.release.releaseFingerprintSha256,
      orderedMemberIdentitySha256:
        candidateReport.release.orderedMemberIdentitySha256,
      catalog: descriptor(releaseCatalogRecord),
    },
    inputs: {
      candidateReport: {
        ...descriptor(candidateRecord),
        schemaVersion: candidateReport.schemaVersion,
        reportType: candidateReport.reportType,
        reportFingerprintSha256:
          candidateReport.reportFingerprintSha256,
      },
      candidateGenerator: descriptor(candidateGeneratorRecord),
      proofEngine: descriptor(proofEngineRecord),
    },
    acceptedSet: {
      selector:
        "every members[].oneFrame.eligibleCandidates[] entry in the exact trusted candidate-report bytes",
      proofType: "single-frame-scriptless-structural-child",
      memberCount: selectedMembers.length,
      candidateCount: acceptedPairs.length,
      canonicalPairBytes: acceptedPairBytes.length,
      canonicalPairSetSha256: sha256(acceptedPairBytes),
      members: selectedMembers,
    },
    excludedSet: {
      selector:
        "every members[].oneFrame.excludedCandidates[] and members[].multiFrame.excludedCandidates[] entry in the exact trusted candidate-report bytes",
      memberCount: candidateReport.members.filter((member) =>
        member.oneFrame.excludedCandidateCount +
          member.multiFrame.excludedCandidateCount > 0).length,
      candidateCount: excludedPairs.length,
      oneFrameCandidateCount:
        candidateReport.summary.oneFrameExcluded,
      multiFrameCandidateCount:
        candidateReport.summary.multiFrameExcluded,
      canonicalPairBytes: excludedPairBytes.length,
      canonicalPairSetSha256: sha256(excludedPairBytes),
    },
    successorContract: {
      staticEvidenceMemberCount: EXPECTED.selectedMembers,
      staticEvidenceClaimCount: EXPECTED.selectedOneFrameTimelines,
      expectedDispositionCounts: {
        declaredRoot: EXPECTED.releaseMembers,
        compositeChildWithParent: EXPECTED.selectedOneFrameTimelines,
        unresolved: EXPECTED.pendingTimelines,
        excludedNotProven: EXPECTED.excludedNotProvenDefinitions,
      },
      canonicalCoverageMutationAuthorized: false,
      migrationManifestMutationAuthorized: false,
      assetInventoryMutationAuthorized: false,
      keyframesMutationAuthorized: false,
      implementationMutationAuthorized: false,
    },
    limitations: [
      "This is an exact engineering-only selection over a trusted hash-bound static candidate report. It is not human review, Owner acceptance, original-runtime evidence, authoring evidence, or publication authority.",
      "The 696 selected one-frame timelines may remove only a separate independent local-playhead obligation after the dedicated proof materializer rebuilds exact per-member evidence and the disposition consumer verifies it.",
      "Visual, button, interaction, behavior, audio, full-frame/RMSE, language, human-review, Owner-acceptance, strict-completion, and publication obligations remain pending.",
      "The excluded 351 timelines remain unresolved and appear only in the separate noncanonical runtime-unverified planning registry.",
    ],
    acceptanceEffects: acceptanceEffects(),
    protectedMutations: protectedMutations(),
    strictAcceptanceEffect: STRICT_EFFECT,
  });
}

function buildPendingRegistry({
  candidateReport,
  candidateRecord,
  selectionReceipt,
  selectionBytes,
}) {
  const members = candidateReport.members.map((member) => {
    const pendingTimelines = [
      ...member.oneFrame.excludedCandidates.map((candidate) => ({
        candidateClass: "one-frame-static-composite-excluded",
        ...candidate,
      })),
      ...member.multiFrame.excludedCandidates.map((candidate) => ({
        candidateClass: "multi-frame-parent-clock-composite-excluded",
        ...candidate,
      })),
    ].sort((left, right) =>
      compareTimelineIds(left.timelineId, right.timelineId));
    return {
      releaseOrdinal: member.releaseOrdinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      pendingTimelineCount: pendingTimelines.length,
      pendingFrameCount: pendingTimelines.reduce(
        (total, {frameCount}) => total + frameCount,
        0,
      ),
      pendingTimelines: pendingTimelines.map((candidate) => ({
        timelineId: candidate.timelineId,
        sourceObjectId: candidate.sourceObjectId,
        frameCount: candidate.frameCount,
        candidateClass: candidate.candidateClass,
        disqualifiers: [...candidate.disqualifiers],
        planningRole:
          "source-static-reachable-capture-domain-candidate-runtime-unverified",
        state: "pending-runtime-unverified",
        staticStructuralReachability:
          "reachable-from-root-placement-graph",
        runtimeReachabilityEstablished: false,
        baselineAuthority: "unresolved",
        currentDisposition: "unresolved",
        canonicalFrameDomainCreated: false,
        canonicalCoverageRequirementCreated: false,
        keyframeSpecificationCreated: false,
        traceSpecificationCreated: false,
        implementationAuthorized: false,
        evidence: {
          candidateReportFingerprintSha256:
            candidateReport.reportFingerprintSha256,
          candidateFingerprintSha256: sha256(stableJson(candidate)),
          sourceProof: candidate.sourceProof || null,
          parentTimelineId: candidate.parentTimelineId || null,
          parentFrameDomainId: candidate.parentFrameDomainId || null,
          incomingLifetimeCount:
            candidate.incomingLifetimeCount ?? null,
          ffdecFrameScriptCount:
            candidate.ffdecFrameScriptCount ?? null,
          attributedDoInitActionCount:
            candidate.attributedDoInitActionCount ?? null,
        },
        futureResolution:
          "Establish natural original-runtime reachability and exact entry state under separate authorization before declaring an independent/composite domain or creating canonical coverage.",
      })),
    };
  });
  const pendingTimelines = members.flatMap(({pendingTimelines}) =>
    pendingTimelines);
  const oneFrameCount = pendingTimelines.filter(
    ({candidateClass}) =>
      candidateClass === "one-frame-static-composite-excluded",
  ).length;
  const multiFrameCount = pendingTimelines.length - oneFrameCount;
  const pendingFrameCount = pendingTimelines.reduce(
    (total, {frameCount}) => total + frameCount,
    0,
  );
  invariant(
    members.length === EXPECTED.releaseMembers &&
      members.every(({pendingTimelineCount}) => pendingTimelineCount > 0) &&
      pendingTimelines.length === EXPECTED.pendingTimelines &&
      oneFrameCount === EXPECTED.pendingOneFrameTimelines &&
      multiFrameCount === EXPECTED.pendingMultiFrameTimelines &&
      pendingFrameCount === EXPECTED.pendingFrames,
    "runtime-unverified planning registry totals drifted",
  );
  return withFingerprint({
    schemaVersion: 1,
    reportType:
      "g5-l5-runtime-unverified-frame-domain-planning-registry",
    releaseId: RELEASE_ID,
    canonical: false,
    state: "351-static-reachable-timelines-pending-runtime-verification",
    generatedFrom: {
      candidateReport: {
        ...descriptor(candidateRecord),
        reportFingerprintSha256:
          candidateReport.reportFingerprintSha256,
      },
      selectionReceipt: {
        path: G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
        bytes: selectionBytes.length,
        sha256: sha256(selectionBytes),
        artifactFingerprintSha256:
          selectionReceipt.artifactFingerprintSha256,
      },
    },
    summary: {
      releaseMemberCount: members.length,
      pendingMemberCount: members.filter(
        ({pendingTimelineCount}) => pendingTimelineCount > 0,
      ).length,
      pendingTimelineCount: pendingTimelines.length,
      pendingOneFrameTimelineCount: oneFrameCount,
      pendingMultiFrameTimelineCount: multiFrameCount,
      pendingFrameCount,
      canonicalFrameDomainCountCreated: 0,
      canonicalCoverageRequirementCountCreated: 0,
      traceSpecificationCountCreated: 0,
      runtimeTraceCount: 0,
    },
    members,
    authorityBoundary: [
      "This registry is noncanonical planning output. It does not edit migration.json, asset-inventory.csv, keyframes.csv, full-frame-coverage.json, or a frame-domain disposition.",
      "Every listed timeline remains unresolved and runtime-unverified. Static reachability does not establish natural runtime reachability, entry state, visual behavior, audio behavior, language behavior, or acceptance.",
      "A separately authorized original-runtime session and exact source/entry-state evidence may later split, merge, replace, or reject these planning candidates.",
    ],
    acceptanceEffects: acceptanceEffects(),
    protectedMutations: protectedMutations(),
    strictAcceptanceEffect: STRICT_EFFECT,
  });
}

export function validateG5L5StaticSelectionReceiptShape(receipt) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.receiptType ===
        "g5-l5-engineering-static-frame-domain-disposition-selection" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.evidenceState ===
        "exact-engineering-only-source-static-selection-no-human-or-owner-review",
    "G5 L5 selection receipt identity drifted",
  );
  invariant(
    receipt.decision?.reviewerKind ===
        "codex-engineering-source-proof-review" &&
      receipt.decision?.humanReviewer === false &&
      receipt.decision?.humanSignature === null &&
      receipt.decision?.ownerAcceptance === false &&
      receipt.decision?.proofType ===
        "single-frame-scriptless-structural-child" &&
      receipt.decision?.claimScope ===
        "independent-local-playhead-only",
    "G5 L5 selection receipt fabricated or broadened review authority",
  );
  invariant(
    receipt.release?.memberCount === EXPECTED.releaseMembers &&
      receipt.release?.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256 &&
      receipt.acceptedSet?.memberCount === EXPECTED.selectedMembers &&
      receipt.acceptedSet?.candidateCount ===
        EXPECTED.selectedOneFrameTimelines &&
      receipt.acceptedSet?.members?.length === EXPECTED.selectedMembers &&
      receipt.excludedSet?.memberCount === EXPECTED.pendingMembers &&
      receipt.excludedSet?.candidateCount === EXPECTED.pendingTimelines &&
      receipt.excludedSet?.oneFrameCandidateCount ===
        EXPECTED.pendingOneFrameTimelines &&
      receipt.excludedSet?.multiFrameCandidateCount ===
        EXPECTED.pendingMultiFrameTimelines,
    "G5 L5 selection receipt exact partition drifted",
  );
  for (const value of [
    receipt.acceptedSet?.canonicalPairSetSha256,
    receipt.excludedSet?.canonicalPairSetSha256,
    receipt.inputs?.candidateReport?.sha256,
    receipt.inputs?.candidateReport?.reportFingerprintSha256,
    receipt.inputs?.candidateGenerator?.sha256,
    receipt.inputs?.proofEngine?.sha256,
    receipt.materializers?.selection?.sha256,
    receipt.materializers?.evidence?.sha256,
    receipt.release?.catalog?.sha256,
  ]) {
    invariant(
      SHA256_PATTERN.test(value || ""),
      "G5 L5 selection receipt has an invalid digest binding",
    );
  }
  invariant(
    receipt.successorContract?.expectedDispositionCounts
      ?.compositeChildWithParent === EXPECTED.selectedOneFrameTimelines &&
      receipt.successorContract?.expectedDispositionCounts?.unresolved ===
        EXPECTED.pendingTimelines &&
      receipt.successorContract?.expectedDispositionCounts
        ?.excludedNotProven === EXPECTED.excludedNotProvenDefinitions &&
      receipt.successorContract?.canonicalCoverageMutationAuthorized ===
        false,
    "G5 L5 selection successor contract drifted",
  );
  assertAllFalse(receipt.acceptanceEffects, "selection acceptanceEffects");
  assertAllFalse(receipt.protectedMutations, "selection protectedMutations");
  invariant(
    receipt.strictAcceptanceEffect === STRICT_EFFECT,
    "G5 L5 selection receipt strict effect drifted",
  );
  validateFingerprint(receipt, "G5 L5 selection receipt");
  return true;
}

export function validateG5L5PendingPlanningRegistryShape(registry) {
  invariant(
    registry?.schemaVersion === 1 &&
      registry.reportType ===
        "g5-l5-runtime-unverified-frame-domain-planning-registry" &&
      registry.releaseId === RELEASE_ID &&
      registry.canonical === false &&
      registry.state ===
        "351-static-reachable-timelines-pending-runtime-verification",
    "G5 L5 pending planning registry identity drifted",
  );
  const entries = (registry.members || []).flatMap(
    ({pendingTimelines}) => pendingTimelines || [],
  );
  invariant(
    registry.members?.length === EXPECTED.releaseMembers &&
      registry.summary?.pendingMemberCount === EXPECTED.pendingMembers &&
      registry.summary?.pendingTimelineCount === EXPECTED.pendingTimelines &&
      registry.summary?.pendingOneFrameTimelineCount ===
        EXPECTED.pendingOneFrameTimelines &&
      registry.summary?.pendingMultiFrameTimelineCount ===
        EXPECTED.pendingMultiFrameTimelines &&
      registry.summary?.pendingFrameCount === EXPECTED.pendingFrames &&
      entries.length === EXPECTED.pendingTimelines &&
      entries.reduce((total, {frameCount}) => total + frameCount, 0) ===
        EXPECTED.pendingFrames,
    "G5 L5 pending planning registry totals drifted",
  );
  invariant(
    entries.every((entry) =>
      entry.planningRole ===
        "source-static-reachable-capture-domain-candidate-runtime-unverified" &&
      entry.state === "pending-runtime-unverified" &&
      entry.runtimeReachabilityEstablished === false &&
      entry.baselineAuthority === "unresolved" &&
      entry.currentDisposition === "unresolved" &&
      entry.canonicalFrameDomainCreated === false &&
      entry.canonicalCoverageRequirementCreated === false &&
      entry.keyframeSpecificationCreated === false &&
      entry.traceSpecificationCreated === false &&
      entry.implementationAuthorized === false &&
      Array.isArray(entry.disqualifiers) &&
      entry.disqualifiers.length > 0),
    "G5 L5 pending planning registry promoted an unresolved timeline",
  );
  assertAllFalse(registry.acceptanceEffects, "registry acceptanceEffects");
  assertAllFalse(registry.protectedMutations, "registry protectedMutations");
  invariant(
    registry.strictAcceptanceEffect === STRICT_EFFECT,
    "G5 L5 pending planning registry strict effect drifted",
  );
  validateFingerprint(registry, "G5 L5 pending planning registry");
  return true;
}

export async function buildG5L5StaticFrameDomainDispositionSelection({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const [
    candidateRecord,
    candidateGeneratorRecord,
    proofEngineRecord,
    releaseCatalogRecord,
    selectionMaterializerRecord,
    evidenceMaterializerRecord,
  ] = await Promise.all([
    readStableFile(projectRoot, CANDIDATE_REPORT_RELATIVE, {json: true}),
    readStableFile(projectRoot, CANDIDATE_GENERATOR_RELATIVE),
    readStableFile(projectRoot, PROOF_ENGINE_RELATIVE),
    readStableFile(projectRoot, RELEASE_CATALOG_RELATIVE),
    readStableFile(projectRoot, SCRIPT_RELATIVE),
    readStableFile(projectRoot, EVIDENCE_MATERIALIZER_RELATIVE),
  ]);
  const candidateReport = candidateRecord.document;
  validateG5L5StaticFrameDomainDispositionCandidateShape(candidateReport);
  await validateG5L5StaticFrameDomainDispositionCandidates(
    candidateReport,
    {projectRoot},
  );
  invariant(
    candidateReport.generatedBy?.sha256 ===
        candidateGeneratorRecord.sha256 &&
      candidateReport.generatedBy?.proofEngine?.sha256 ===
        proofEngineRecord.sha256 &&
      candidateReport.release?.catalog?.sha256 ===
        releaseCatalogRecord.sha256,
    "candidate report physical generator/proof/release bindings are stale",
  );
  const receipt = buildSelectionReceipt({
    candidateReport,
    candidateRecord,
    candidateGeneratorRecord,
    proofEngineRecord,
    releaseCatalogRecord,
    selectionMaterializerRecord,
    evidenceMaterializerRecord,
  });
  validateG5L5StaticSelectionReceiptShape(receipt);
  const receiptBytes = Buffer.from(stableJson(receipt));
  const registry = buildPendingRegistry({
    candidateReport,
    candidateRecord,
    selectionReceipt: receipt,
    selectionBytes: receiptBytes,
  });
  validateG5L5PendingPlanningRegistryShape(registry);
  const registryBytes = Buffer.from(stableJson(registry));
  return {
    receipt,
    registry,
    outputs: new Map([
      [G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH, receiptBytes],
      [
        G5_L5_RUNTIME_UNVERIFIED_PLANNING_REGISTRY_RELATIVE_PATH,
        registryBytes,
      ],
    ]),
    inputRecords: [
      candidateRecord,
      candidateGeneratorRecord,
      proofEngineRecord,
      releaseCatalogRecord,
      selectionMaterializerRecord,
      evidenceMaterializerRecord,
    ],
  };
}

async function lstatOrNull(candidate) {
  return lstat(candidate, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
}

async function verifyInputs(projectRoot, inputRecords, receipt) {
  for (const record of inputRecords) {
    const current = await readStableFile(projectRoot, record.path);
    invariant(
      current.byteCount === record.byteCount &&
        current.sha256 === record.sha256 &&
        sameSignature(current.signature, record.signature),
      `${record.path} changed after selection preflight`,
    );
  }
  await validateG5L5StaticFrameDomainDispositionCandidates(
    JSON.parse(
      inputRecords.find(({path: itemPath}) =>
        itemPath === CANDIDATE_REPORT_RELATIVE).bytes.toString("utf8"),
    ),
    {projectRoot},
  );
  validateG5L5StaticSelectionReceiptShape(receipt);
}

async function snapshotOutput(projectRoot, relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  const ancestor = await assertOrdinaryAncestorTree(
    projectRoot,
    absolutePath,
    relativePath,
  );
  const existing = await readStableFile(
    projectRoot,
    relativePath,
    {required: false},
  );
  if (existing) return {...existing, ...ancestor, exists: true};
  return {
    path: relativePath,
    absolutePath,
    ...ancestor,
    exists: false,
  };
}

async function assertOutputParentUnchanged(projectRoot, snapshot) {
  const current = await assertOrdinaryAncestorTree(
    projectRoot,
    snapshot.absolutePath,
    snapshot.path,
  );
  invariant(
    current.parentPath === snapshot.parentPath &&
      JSON.stringify(current.parentIdentity) ===
        JSON.stringify(snapshot.parentIdentity),
    `${snapshot.path}: output parent identity changed after preflight`,
  );
}

async function readStableAbsolute(
  projectRoot,
  absolutePath,
  {required = true} = {},
) {
  const relativePath = path.relative(projectRoot, absolutePath)
    .split(path.sep).join("/");
  return readStableFile(projectRoot, relativePath, {required});
}

async function removeExpectedAbsolute(
  projectRoot,
  absolutePath,
  expectedSha256,
  expectedSignature,
  label,
) {
  const current = await readStableAbsolute(
    projectRoot,
    absolutePath,
    {required: false},
  );
  if (!current) return;
  invariant(
    current.sha256 === expectedSha256 &&
      sameSignature(current.signature, expectedSignature),
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(absolutePath);
}

async function removeOwnedAbsolute(
  projectRoot,
  absolutePath,
  expectedSignature,
  label,
) {
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const information = await lstatOrNull(absolutePath);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      sameInodeSignature(signature(information), expectedSignature),
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(absolutePath);
}

export async function commitG5L5StaticSelectionOutputs({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  outputs,
  inputRecords,
  receipt,
  check = false,
  hooks = {},
}) {
  const projectRoot = path.resolve(projectRootOption);
  invariant(
    outputs instanceof Map &&
      outputs.size === OUTPUT_PATHS.length &&
      OUTPUT_PATHS.every((relativePath) => outputs.has(relativePath)),
    "selection output set must equal the fixed allowlist",
  );
  const entries = [];
  for (const relativePath of OUTPUT_PATHS) {
    const bytes = outputs.get(relativePath);
    invariant(Buffer.isBuffer(bytes), `${relativePath} output must be bytes`);
    const snapshot = await snapshotOutput(projectRoot, relativePath);
    entries.push({
      relativePath,
      bytes,
      sha256: sha256(bytes),
      snapshot,
      temporary:
        `${snapshot.absolutePath}.tmp-${process.pid}-${randomBytes(12).toString("hex")}`,
      backup:
        `${snapshot.absolutePath}.bak-${process.pid}-${randomBytes(12).toString("hex")}`,
      installed: false,
      displaced: false,
      temporaryIdentity: null,
      temporaryOwnerIdentity: null,
      backupIdentity: null,
      installedIdentity: null,
      installedOwnerIdentity: null,
    });
  }
  await verifyInputs(projectRoot, inputRecords, receipt);
  if (check) {
    for (const entry of entries) {
      invariant(
        entry.snapshot.exists &&
          entry.snapshot.byteCount === entry.bytes.length &&
          entry.snapshot.sha256 === entry.sha256,
        `${entry.relativePath} is missing or stale`,
      );
    }
    return {action: "verified", outputs: entries.map((entry) => ({
      path: entry.relativePath,
      bytes: entry.bytes.length,
      sha256: entry.sha256,
    }))};
  }
  try {
    for (const entry of entries) {
      await assertOutputParentUnchanged(projectRoot, entry.snapshot);
      const handle = await open(
        entry.temporary,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          (constants.O_NOFOLLOW || 0),
        0o644,
      );
      try {
        entry.temporaryOwnerIdentity = signature(
          await handle.stat({bigint: true}),
        );
        await handle.writeFile(entry.bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
      const staged = await readStableAbsolute(
        projectRoot,
        entry.temporary,
      );
      invariant(
        staged.sha256 === entry.sha256 &&
          staged.byteCount === entry.bytes.length,
        `${entry.relativePath}: staged output bytes drifted`,
      );
      entry.temporaryIdentity = staged.signature;
      await hooks.afterEachStage?.({entry, index: entries.indexOf(entry)});
    }
    await hooks.afterStage?.({entries});
    await verifyInputs(projectRoot, inputRecords, receipt);
    for (const entry of entries) {
      await assertOutputParentUnchanged(projectRoot, entry.snapshot);
      const current = await snapshotOutput(projectRoot, entry.relativePath);
      invariant(
        current.exists === entry.snapshot.exists &&
          (!current.exists ||
            (
              current.sha256 === entry.snapshot.sha256 &&
              sameSignature(current.signature, entry.snapshot.signature)
            )),
        `${entry.relativePath} changed before selection install`,
      );
      if (entry.snapshot.exists) {
        await rename(entry.snapshot.absolutePath, entry.backup);
        entry.displaced = true;
        const displacedRelative = path.relative(
          projectRoot,
          entry.backup,
        ).split(path.sep).join("/");
        const displaced = await readStableFile(
          projectRoot,
          displacedRelative,
        );
        invariant(
          displaced.sha256 === entry.snapshot.sha256 &&
            displaced.byteCount === entry.snapshot.byteCount &&
            sameDisplacedSignature(
              displaced.signature,
              entry.snapshot.signature,
            ),
          `${entry.relativePath} displaced output failed CAS verification`,
        );
        entry.backupIdentity = displaced.signature;
      }
      const stage = await readStableAbsolute(
        projectRoot,
        entry.temporary,
      );
      invariant(
        stage.sha256 === entry.sha256 &&
          stage.byteCount === entry.bytes.length &&
          sameSignature(
            stage.signature,
            entry.temporaryIdentity,
          ),
        `${entry.relativePath}: staged output changed before install`,
      );
      await link(entry.temporary, entry.snapshot.absolutePath);
      entry.installed = true;
      entry.installedOwnerIdentity = signature(
        await lstat(entry.snapshot.absolutePath, {bigint: true}),
      );
      await unlink(entry.temporary);
      const installed = await readStableFile(
        projectRoot,
        entry.relativePath,
      );
      invariant(
        installed.sha256 === entry.sha256 &&
          installed.byteCount === entry.bytes.length,
        `${entry.relativePath}: installed output bytes drifted`,
      );
      entry.installedIdentity = installed.signature;
      const index = entries.indexOf(entry);
      await hooks.afterInstall?.({entry, index});
      if (index === 0) await hooks.afterFirstInstall?.({entries});
    }
    await verifyInputs(projectRoot, inputRecords, receipt);
    for (const entry of entries) {
      await assertOutputParentUnchanged(projectRoot, entry.snapshot);
      const installed = await readStableFile(projectRoot, entry.relativePath);
      invariant(
        installed.sha256 === entry.sha256 &&
          installed.byteCount === entry.bytes.length &&
          sameSignature(
            installed.signature,
            entry.installedIdentity,
          ),
        `${entry.relativePath} installed bytes drifted`,
      );
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...entries].reverse()) {
      try {
        await assertOutputParentUnchanged(projectRoot, entry.snapshot);
        if (entry.installed) {
          if (entry.installedIdentity) {
            const current = await readStableFile(
              projectRoot,
              entry.relativePath,
              {required: false},
            );
            invariant(
              current?.sha256 === entry.sha256 &&
                current.byteCount === entry.bytes.length &&
                sameSignature(
                  current.signature,
                  entry.installedIdentity,
                ),
              `${entry.relativePath}: refusing to remove a foreign rollback target`,
            );
            await unlink(entry.snapshot.absolutePath);
          } else {
            await removeOwnedAbsolute(
              projectRoot,
              entry.snapshot.absolutePath,
              entry.installedOwnerIdentity,
              `${entry.relativePath}: rollback linked target`,
            );
          }
          entry.installed = false;
        }
        if (entry.displaced && await lstatOrNull(entry.backup)) {
          const backup = await readStableAbsolute(
            projectRoot,
            entry.backup,
          );
          invariant(
            backup.sha256 === entry.snapshot.sha256 &&
              sameSignature(
                backup.signature,
                entry.backupIdentity,
              ),
            `${entry.relativePath}: refusing to restore a foreign rollback backup`,
          );
          invariant(
            !(await lstatOrNull(entry.snapshot.absolutePath)),
            `${entry.relativePath}: refusing to overwrite a target occupied during rollback`,
          );
          await link(entry.backup, entry.snapshot.absolutePath);
          await unlink(entry.backup);
          entry.displaced = false;
        }
        await removeOwnedAbsolute(
          projectRoot,
          entry.temporary,
          entry.temporaryIdentity || entry.temporaryOwnerIdentity,
          `${entry.relativePath}: rollback temporary`,
        );
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "selection transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }
  const cleanupErrors = [];
  try {
    await hooks.beforeCleanup?.({entries});
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const entry of entries) {
    if (!entry.displaced) continue;
    try {
      await assertOutputParentUnchanged(projectRoot, entry.snapshot);
      await removeExpectedAbsolute(
        projectRoot,
        entry.backup,
        entry.snapshot.sha256,
        entry.backupIdentity,
        `${entry.relativePath}: committed backup`,
      );
      entry.displaced = false;
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      "selection transaction committed, but backup cleanup was incomplete",
    );
  }
  return {action: "written", outputs: entries.map((entry) => ({
    path: entry.relativePath,
    bytes: entry.bytes.length,
    sha256: entry.sha256,
  }))};
}

export async function validateG5L5StaticFrameDomainDispositionSelection(
  receipt,
  {projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT} = {},
) {
  validateG5L5StaticSelectionReceiptShape(receipt);
  const built =
    await buildG5L5StaticFrameDomainDispositionSelection({
      projectRoot: projectRootOption,
    });
  invariant(
    stableJson(receipt) === stableJson(built.receipt),
    "G5 L5 selection receipt differs from trusted current physical inputs",
  );
  return true;
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ["--dry-run", "--apply", "--check"].includes(argument));
  invariant(modes.length === 1, "choose exactly one explicit execution mode");
  invariant(
    argv.every((argument) =>
      ["--dry-run", "--apply", "--check", "--help", "-h"].includes(argument)),
    `Unknown option: ${argv.find((argument) =>
      !["--dry-run", "--apply", "--check", "--help", "-h"].includes(argument))}`,
  );
  invariant(
    !argv.includes("--help") && !argv.includes("-h"),
    "--help cannot be combined with an execution mode",
  );
  return {mode: modes[0].slice(2)};
}

async function main() {
  if (process.argv.slice(2).length === 1 &&
      ["--help", "-h"].includes(process.argv[2])) {
    process.stdout.write(
      `Usage: node ${SCRIPT_RELATIVE} --dry-run|--apply|--check\n`,
    );
    return;
  }
  const {mode} = parseArguments(process.argv.slice(2));
  const built =
    await buildG5L5StaticFrameDomainDispositionSelection();
  const result = mode === "dry-run"
    ? {
      action: "planned",
      outputs: [...built.outputs].map(([outputPath, bytes]) => ({
        path: outputPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      })),
    }
    : await commitG5L5StaticSelectionOutputs({
      outputs: built.outputs,
      inputRecords: built.inputRecords,
      receipt: built.receipt,
      check: mode === "check",
    });
  process.stdout.write(`${JSON.stringify({
    ...result,
    releaseId: RELEASE_ID,
    selectedMemberCount: built.receipt.acceptedSet.memberCount,
    selectedTimelineCount: built.receipt.acceptedSet.candidateCount,
    pendingTimelineCount: built.registry.summary.pendingTimelineCount,
    pendingFrameCount: built.registry.summary.pendingFrameCount,
    humanReviewer: false,
    ownerAcceptance: false,
    acceptanceEffect: "none",
  })}\n`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
