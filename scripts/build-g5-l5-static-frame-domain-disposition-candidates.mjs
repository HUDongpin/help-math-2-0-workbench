#!/usr/bin/env node

import {constants} from "node:fs";
import {createHash, randomUUID} from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  validateG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  deriveMultiFrameScriptlessCandidateAudit,
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/build-g5-l5-static-frame-domain-disposition-candidates.mjs";
const PROOF_ENGINE_RELATIVE =
  "scripts/build-static-frame-domain-disposition-evidence.mjs";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";
export const G5_L5_STATIC_CANDIDATE_OUTPUTS = Object.freeze([
  "reports/g5-l5-static-frame-domain-disposition-candidates.json",
  "reports/g5-l5-static-frame-domain-disposition-candidates.md",
]);
const OUTPUT_RELATIVES = G5_L5_STATIC_CANDIDATE_OUTPUTS;
const EXPECTED = Object.freeze({
  members: 57,
  pages: 56,
  shells: 1,
  reachableChildren: 1047,
  oneFrame: 744,
  oneFrameEligible: 696,
  oneFrameExcluded: 48,
  multiFrame: 303,
  multiFrameEligible: 0,
  multiFrameExcluded: 303,
  nonReachableDefinitions: 185,
});
const SHA256 = /^[a-f0-9]{64}$/;
const STRICT_EFFECT =
  "none; static disposition candidates only; no workspace, canonical specification, disposition, implementation, evidence, acceptance, strict-completion, or publication mutation";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function compareTimelineIds(left, right) {
  const leftNumber = Number(String(left).split("-").at(-1));
  const rightNumber = Number(String(right).split("-").at(-1));
  return leftNumber - rightNumber || String(left).localeCompare(String(right));
}

function exactKeys(object, expected, label) {
  invariant(
    object && typeof object === "object" && !Array.isArray(object),
    `${label}: expected an object`,
  );
  invariant(
    JSON.stringify(Object.keys(object).sort()) ===
      JSON.stringify([...expected].sort()),
    `${label}: key set drifted`,
  );
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

function fileSignature(metadata) {
  return {
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    mode: metadata.mode,
    nlink: metadata.nlink,
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
  };
}

function sameSignature(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

export async function readNoFollowRecord(
  projectRootOption,
  relativePath,
  label = relativePath,
) {
  const projectRoot = path.resolve(projectRootOption);
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const before = await assertOrdinaryFile(absolutePath, label);
  const [realRoot, realFile] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  let handle;
  try {
    handle = await open(
      absolutePath,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    const openedBefore = await handle.stat();
    invariant(
      openedBefore.isFile() &&
        openedBefore.nlink === 1 &&
        before.dev === openedBefore.dev &&
        before.ino === openedBefore.ino,
      `${label}: file identity changed before no-follow read`,
    );
    const contents = await handle.readFile();
    const openedAfter = await handle.stat();
    invariant(
      openedAfter.isFile() &&
        openedAfter.nlink === 1 &&
        openedBefore.dev === openedAfter.dev &&
        openedBefore.ino === openedAfter.ino &&
        openedBefore.mtimeMs === openedAfter.mtimeMs &&
        openedAfter.size === contents.length,
      `${label}: changed during no-follow read`,
    );
    const after = await assertOrdinaryFile(absolutePath, label);
    invariant(
      after.dev === openedAfter.dev &&
        after.ino === openedAfter.ino &&
        after.mtimeMs === openedAfter.mtimeMs &&
        after.size === contents.length,
      `${label}: path identity changed during no-follow read`,
    );
    return {
      path: relativePath,
      absolutePath,
      bytes: contents.length,
      sha256: sha256Bytes(contents),
      signature: fileSignature(after),
      contents,
    };
  } finally {
    await handle?.close();
  }
}

function withoutContents(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    signature: record.signature,
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

class InputTracker {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.records = new Map();
  }

  async read(relativePath, label = relativePath) {
    const record = await readNoFollowRecord(this.projectRoot, relativePath, label);
    const previous = this.records.get(relativePath);
    if (previous) {
      invariant(
        previous.bytes === record.bytes &&
          previous.sha256 === record.sha256 &&
          sameSignature(previous.signature, record.signature),
        `${label}: repeated input read drifted`,
      );
    } else {
      this.records.set(relativePath, withoutContents(record));
    }
    return record;
  }

  list() {
    return [...this.records.values()].sort((left, right) =>
      left.path.localeCompare(right.path));
  }
}

async function readJson(tracker, relativePath, label) {
  const record = await tracker.read(relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function orderedMemberIdentities(members) {
  return members.map(({ordinal, animationId, assetId}) => ({
    ordinal,
    animationId,
    assetId,
  }));
}

function selectRelease(catalog) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "release catalog is malformed",
  );
  const matches = catalog.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.members === EXPECTED.members &&
      release.expectedCounts.activeXmlReferencedPages === EXPECTED.pages &&
      release.expectedCounts.courseShells === EXPECTED.shells &&
      Array.isArray(release.members) &&
      release.members.length === EXPECTED.members &&
      release.members.every((member, index) => member.ordinal === index + 1),
    "G5 L5 exact release scope drifted",
  );
  invariant(
    sha256Bytes(Buffer.from(stableJson(release))) ===
      RELEASE_FINGERPRINT_SHA256,
    "G5 L5 release fingerprint drifted",
  );
  invariant(
    sha256Bytes(Buffer.from(stableJson(orderedMemberIdentities(release.members)))) ===
      ORDERED_MEMBER_IDENTITY_SHA256,
    "G5 L5 ordered member identity fingerprint drifted",
  );
  return release;
}

function requiredEvidence(inventory, artifactId) {
  const matches = inventory.evidenceIndex?.filter(
    (item) => item.artifactId === artifactId,
  ) || [];
  invariant(
    matches.length === 1,
    `${inventory.animationId}: expected exactly one ${artifactId}`,
  );
  invariant(
    SHA256.test(matches[0].sha256 || ""),
    `${inventory.animationId}: ${artifactId} SHA-256 is invalid`,
  );
  return matches[0];
}

function artifactProjectPath(animationId, artifactPath) {
  if (
    artifactPath.startsWith("source-assets/") ||
    artifactPath.startsWith("migrations/") ||
    artifactPath.startsWith("catalog/") ||
    artifactPath.startsWith("reports/") ||
    artifactPath.startsWith("scripts/")
  ) {
    return artifactPath;
  }
  return `migrations/${animationId}/${artifactPath}`;
}

function validateAcceptanceFalse(object, label) {
  invariant(
    object &&
      Object.keys(object).length > 0 &&
      Object.values(object).every((value) => value === false),
    `${label}: every acceptance effect must remain false`,
  );
}

function serializeSingleFrameInspection(inspection) {
  return {
    timelineId: inspection.timelineId,
    sourceObjectId: inspection.sourceObjectId,
    frameCount: inspection.inventoryTimeline.frameCount,
    eligible: inspection.eligible,
    disqualifiers: [...inspection.disqualifiers],
    sourceProof: {
      declaredFrameCount: inspection.timeline.declaredFrames,
      observedShowFrameCount: inspection.timeline.observedShowFrames,
      directDoActionTagCount: inspection.directDoActionTagCount,
      directDoInitActionTagCount: inspection.directDoInitActionTagCount,
      attributedDoInitActionCount: inspection.attributedDoInitActions.length,
      ffdecFrameScriptCount: inspection.ffdecFrameScripts.length,
      incomingPlacementCount: inspection.incomingResolved.length,
      outgoingPlacementCount: inspection.outgoingResolved.length,
      unresolvedOutgoingObjectCount: inspection.unresolvedOutgoingCount,
      clipActionCount: inspection.clipActionCount,
      declaredFrameDomainCount: inspection.declaredFrameDomains.length,
    },
  };
}

function serializeMultiFrameInspection(inspection) {
  return {
    timelineId: inspection.timelineId,
    sourceObjectId: inspection.sourceObjectId,
    frameCount: inspection.frameCount,
    parentTimelineId: inspection.parentTimelineId,
    parentFrameDomainId: inspection.parentFrameDomainId,
    incomingLifetimeCount: inspection.placements.length,
    internalDisplayEventCount: inspection.internalDisplayEventCount,
    ffdecFrameScriptCount: inspection.ffdecFrameScriptCount,
    attributedDoInitActionCount: inspection.attributedDoInitActionCount,
    namedIncomingInstances: inspection.namedIncomingInstances,
    eligible: inspection.eligible,
    disqualifiers: [...inspection.disqualifiers],
  };
}

async function buildMember(tracker, member) {
  const id = member.animationId;
  const base = `migrations/${id}`;
  const [
    manifestRecord,
    inventoryRecord,
    m1ReceiptRecord,
  ] = await Promise.all([
    readJson(tracker, `${base}/migration.json`, `${id}: migration manifest`),
    readJson(
      tracker,
      `${base}/audit/scenario-inventory.json`,
      `${id}: scenario inventory`,
    ),
    readJson(
      tracker,
      `${base}/audit/machine/g5-l5-m1-static-reconciliation-receipt.json`,
      `${id}: M1 reconciliation receipt`,
    ),
  ]);
  const manifest = manifestRecord.document;
  const inventory = inventoryRecord.document;
  invariant(
    manifest.animationId === id &&
      manifest.assetId === member.assetId &&
      inventory.animationId === id,
    `${id}: manifest/inventory/release identity mismatch`,
  );
  invariant(
    manifest.status === "preserved" &&
      inventory.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      inventory.migrationStatusChanged === false,
    `${id}: candidate phase input authority drifted`,
  );
  const manifestEvidence = requiredEvidence(
    inventory,
    "migration-technical-contract",
  );
  const technicalSha = technicalManifestSha256(manifest);
  invariant(
    manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id &&
      manifestEvidence.hashMode === "canonical-json-v1" &&
      manifestEvidence.sha256 === technicalSha,
    `${id}: migration technical projection is stale`,
  );
  const membershipEvidence = requiredEvidence(
    inventory,
    "lesson-release-membership",
  );
  invariant(
    membershipEvidence.releaseId === RELEASE_ID &&
      membershipEvidence.ordinal === member.ordinal &&
      membershipEvidence.animationId === id &&
      membershipEvidence.assetId === member.assetId &&
      membershipEvidence.sourceSha256 === member.source.sha256,
    `${id}: scenario inventory release membership drifted`,
  );
  const sourceEvidence = requiredEvidence(inventory, "source-swf");
  const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  invariant(
    sourceEvidence.sha256 === member.source.sha256 &&
      sourceEvidence.sha256 === manifest.source?.swfSha256,
    `${id}: source SWF identities disagree`,
  );
  for (const [artifact, label] of [
    [swfmillEvidence, "swfmill"],
    [scriptsEvidence, "FFDec scripts"],
  ]) {
    invariant(
      SHA256.test(artifact.uncompressedSha256 || ""),
      `${id}: ${label} uncompressed hash is invalid`,
    );
  }
  const [sourceRecord, swfmillRecord, scriptsRecord] = await Promise.all([
    tracker.read(
      artifactProjectPath(id, sourceEvidence.path),
      `${id}: physical source SWF`,
    ),
    tracker.read(
      artifactProjectPath(id, swfmillEvidence.path),
      `${id}: swfmill structure`,
    ),
    tracker.read(
      artifactProjectPath(id, scriptsEvidence.path),
      `${id}: FFDec scripts`,
    ),
  ]);
  invariant(
    sourceRecord.sha256 === sourceEvidence.sha256,
    `${id}: physical source SWF hash mismatch`,
  );
  invariant(
    swfmillRecord.sha256 === swfmillEvidence.sha256 &&
      scriptsRecord.sha256 === scriptsEvidence.sha256,
    `${id}: compressed forensic input hash mismatch`,
  );
  const swfmillXmlBytes = gunzipSync(swfmillRecord.contents);
  const scriptsBytes = gunzipSync(scriptsRecord.contents);
  invariant(
    sha256Bytes(swfmillXmlBytes) === swfmillEvidence.uncompressedSha256 &&
      sha256Bytes(scriptsBytes) === scriptsEvidence.uncompressedSha256,
    `${id}: uncompressed forensic input hash mismatch`,
  );
  const structure = parseSwfmillDispositionStructure(
    swfmillXmlBytes.toString("utf8"),
  );
  const scripts = parseFfdecDispositionScripts(
    scriptsBytes.toString("utf8"),
  );
  const oneAudit = deriveSingleFrameScriptlessEligibility({
    animationId: id,
    structure,
    scripts,
    inventory,
    manifest,
  });
  const multiAudit = deriveMultiFrameScriptlessCandidateAudit({
    animationId: id,
    structure,
    scripts,
    inventory,
    manifest,
  });
  const one = [...oneAudit.inspections.values()]
    .map(serializeSingleFrameInspection)
    .sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
  const multi = multiAudit.inspections
    .map(serializeMultiFrameInspection)
    .sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
  const oneEligible = one.filter(({eligible}) => eligible);
  const oneExcluded = one.filter(({eligible}) => !eligible);
  const multiEligible = multi.filter(({eligible}) => eligible);
  const multiExcluded = multi.filter(({eligible}) => !eligible);
  invariant(
    JSON.stringify(oneEligible.map(({timelineId}) => timelineId)) ===
      JSON.stringify(oneAudit.eligibleTimelineIds),
    `${id}: one-frame eligibility order drifted`,
  );
  invariant(
    JSON.stringify(multiEligible.map(({timelineId}) => timelineId)) ===
        JSON.stringify(multiAudit.eligibleTimelineIds) &&
      JSON.stringify(multiExcluded.map(({timelineId}) => timelineId)) ===
        JSON.stringify(multiAudit.excludedTimelineIds),
    `${id}: multi-frame eligibility order drifted`,
  );
  invariant(
    multiEligible.length === 0 && multiAudit.candidateSpecs.length === 0,
    `${id}: current G5 L5 derivation unexpectedly produced a multi-frame candidate`,
  );
  const declaredSourceTimelines = new Set(
    (manifest.implementation?.frameDomains || [])
      .map(({sourceTimelineId}) => sourceTimelineId),
  );
  const rootReachableUndeclaredTimelineIds = (inventory.timelineInventory || [])
    .filter(({timelineId, structuralReachability}) =>
      timelineId !== "root" &&
      structuralReachability === "reachable-from-root-placement-graph" &&
      !declaredSourceTimelines.has(timelineId))
    .map(({timelineId}) => timelineId)
    .sort(compareTimelineIds);
  const excludedNotProvenTimelineCount = (inventory.timelineInventory || [])
    .filter(({timelineId, structuralReachability}) =>
      timelineId !== "root" &&
      structuralReachability !== "reachable-from-root-placement-graph")
    .length;
  const candidateTimelineIds = [...one, ...multi]
    .map(({timelineId}) => timelineId)
    .sort(compareTimelineIds);
  invariant(
    JSON.stringify(candidateTimelineIds) ===
      JSON.stringify(rootReachableUndeclaredTimelineIds),
    `${id}: candidate partition differs from source-proven undeclared root-reachable timelines`,
  );
  validateG5L5M1StaticReconciliationReceipt(
    m1ReceiptRecord.document,
    member,
  );
  validateAcceptanceFalse(
    m1ReceiptRecord.document.acceptanceEffects,
    `${id}: M1 receipt`,
  );
  invariant(
    excludedNotProvenTimelineCount >= 0,
    `${id}: invalid excluded-not-proven definition count`,
  );
  return {
    releaseOrdinal: member.ordinal,
    animationId: id,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    bindings: {
      migrationManifest: {
        ...descriptor(manifestRecord),
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        projectionEncoding: "canonical-json-v1",
        technicalProjectionSha256: technicalSha,
      },
      scenarioInventory: descriptor(inventoryRecord),
      physicalSourceSwf: descriptor(sourceRecord),
      swfmillStructure: {
        ...descriptor(swfmillRecord),
        uncompressedSha256: swfmillEvidence.uncompressedSha256,
      },
      ffdecScripts: {
        ...descriptor(scriptsRecord),
        uncompressedSha256: scriptsEvidence.uncompressedSha256,
      },
      m1StaticReconciliationReceipt: descriptor(m1ReceiptRecord),
    },
    sourceCandidateSnapshot: {
      basis: "undeclared-root-reachable-static-source-timelines",
      declaredFrameDomainCount:
        manifest.implementation?.frameDomains?.length || 0,
      undeclaredRootReachableTimelineCount:
        rootReachableUndeclaredTimelineIds.length,
      undeclaredRootReachableTimelineIds:
        rootReachableUndeclaredTimelineIds,
      excludedNotProvenTimelineCount:
        excludedNotProvenTimelineCount,
    },
    oneFrame: {
      inspectedReachableTimelineCount: one.length,
      eligibleCandidateCount: oneEligible.length,
      excludedCandidateCount: oneExcluded.length,
      eligibleCandidates: oneEligible,
      excludedCandidates: oneExcluded,
    },
    multiFrame: {
      inspectedReachableTimelineCount: multi.length,
      eligibleCandidateCount: multiEligible.length,
      excludedCandidateCount: multiExcluded.length,
      eligibleCandidates: multiEligible,
      excludedCandidates: multiExcluded,
      globalAudit: multiAudit.globalAudit,
    },
  };
}

export function finalizeReportFingerprint(report) {
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  return {
    ...projected,
    reportFingerprintSha256: sha256Bytes(Buffer.from(stableJson(projected))),
  };
}

function validateSingleCandidate(candidate, eligible, label) {
  invariant(
    candidate?.eligible === eligible &&
      candidate.frameCount === 1 &&
      Array.isArray(candidate.disqualifiers) &&
      (eligible
        ? candidate.disqualifiers.length === 0
        : candidate.disqualifiers.length > 0),
    `${label}: invalid one-frame candidate classification`,
  );
  const proof = candidate.sourceProof;
  invariant(
    proof?.declaredFrameCount === 1 &&
      proof.observedShowFrameCount === 1 &&
      Number.isSafeInteger(proof.incomingPlacementCount) &&
      proof.incomingPlacementCount > 0,
    `${label}: invalid one-frame structural proof`,
  );
  if (eligible) {
    for (const key of [
      "directDoActionTagCount",
      "directDoInitActionTagCount",
      "attributedDoInitActionCount",
      "ffdecFrameScriptCount",
      "unresolvedOutgoingObjectCount",
      "clipActionCount",
      "declaredFrameDomainCount",
    ]) {
      invariant(proof[key] === 0, `${label}: eligible proof ${key} must be zero`);
    }
  }
}

function validateMultiCandidate(candidate, eligible, label) {
  invariant(
    candidate?.eligible === eligible &&
      Number.isSafeInteger(candidate.frameCount) &&
      candidate.frameCount > 1 &&
      Array.isArray(candidate.disqualifiers) &&
      (eligible
        ? candidate.disqualifiers.length === 0
        : candidate.disqualifiers.length > 0),
    `${label}: invalid multi-frame candidate classification`,
  );
}

export function validateG5L5StaticFrameDomainDispositionCandidateShape(report) {
  exactKeys(report, [
    "schemaVersion",
    "reportType",
    "evidenceState",
    "generatedBy",
    "release",
    "method",
    "summary",
    "members",
    "nonReachableDefinitionBoundary",
    "acceptanceEffects",
    "protectedMutationCounts",
    "limitations",
    "strictAcceptanceEffect",
    "reportFingerprintSha256",
  ], "candidate report");
  invariant(
    report.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-static-frame-domain-disposition-candidates" &&
      report.evidenceState ===
        "machine-only-static-candidate-enumeration-no-disposition-change",
    "candidate report identity drifted",
  );
  invariant(
    report.generatedBy?.script === SCRIPT_RELATIVE &&
      report.generatedBy.version === 1 &&
      report.generatedBy.deterministic === true &&
      SHA256.test(report.generatedBy.sha256 || "") &&
      report.generatedBy.proofEngine?.path === PROOF_ENGINE_RELATIVE &&
      report.generatedBy.proofEngine.bytes > 0 &&
      SHA256.test(report.generatedBy.proofEngine.sha256 || ""),
    "candidate report generator/proof-engine binding drifted",
  );
  invariant(
    report.release?.releaseId === RELEASE_ID &&
      report.release.titleDisplay === "Add & Subtract Negative Numbers" &&
      report.release.releaseType === "complete-lesson" &&
      report.release.publicationMode === "atomic" &&
      report.release.memberCount === EXPECTED.members &&
      report.release.pageCount === EXPECTED.pages &&
      report.release.shellCount === EXPECTED.shells &&
      report.release.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256 &&
      report.release.orderedMemberIdentitySha256 ===
        ORDERED_MEMBER_IDENTITY_SHA256 &&
      report.release.catalog?.path === RELEASE_CATALOG_RELATIVE &&
      report.release.catalog.bytes > 0 &&
      SHA256.test(report.release.catalog.sha256 || ""),
    "candidate report exact release binding drifted",
  );
  invariant(
    report.method?.oneFrameEligibilityEngine ===
        "deriveSingleFrameScriptlessEligibility" &&
      report.method.multiFrameEligibilityEngine ===
        "deriveMultiFrameScriptlessCandidateAudit" &&
      report.method.sourceCandidateBasis ===
        "undeclared-root-reachable-static-source-timelines" &&
      report.method.candidateOnly === true,
    "candidate report method boundary drifted",
  );
  invariant(
    Array.isArray(report.members) &&
      report.members.length === EXPECTED.members,
    "candidate report must contain exactly 57 release members",
  );
  const totals = {
    reachableChildren: 0,
    oneFrame: 0,
    oneFrameEligible: 0,
    oneFrameExcluded: 0,
    multiFrame: 0,
    multiFrameEligible: 0,
    multiFrameExcluded: 0,
    nonReachableDefinitions: 0,
  };
  const identities = [];
  for (const [index, member] of report.members.entries()) {
    invariant(
      member.releaseOrdinal === index + 1 &&
        typeof member.animationId === "string" &&
        typeof member.assetId === "string" &&
        typeof member.releaseRole === "string" &&
        typeof member.shardId === "string",
      `candidate member ${index + 1}: release identity drifted`,
    );
    identities.push({
      ordinal: member.releaseOrdinal,
      animationId: member.animationId,
      assetId: member.assetId,
    });
    const bindings = member.bindings;
    invariant(
      bindings?.migrationManifest?.projection ===
          TECHNICAL_MANIFEST_PROJECTION.id &&
        bindings.migrationManifest.projectionEncoding ===
          "canonical-json-v1" &&
        SHA256.test(
          bindings.migrationManifest.technicalProjectionSha256 || "",
        ),
      `${member.animationId}: manifest technical projection binding drifted`,
    );
    for (const key of [
      "migrationManifest",
      "scenarioInventory",
      "physicalSourceSwf",
      "swfmillStructure",
      "ffdecScripts",
      "m1StaticReconciliationReceipt",
    ]) {
      const binding = bindings?.[key];
      invariant(
        typeof binding?.path === "string" &&
          binding.path.length > 0 &&
          Number.isSafeInteger(binding.bytes) &&
          binding.bytes > 0 &&
          SHA256.test(binding.sha256 || ""),
        `${member.animationId}: ${key} binding is invalid`,
      );
    }
    invariant(
      SHA256.test(bindings.swfmillStructure.uncompressedSha256 || "") &&
        SHA256.test(bindings.ffdecScripts.uncompressedSha256 || ""),
      `${member.animationId}: forensic uncompressed hashes are invalid`,
    );
    const snapshot = member.sourceCandidateSnapshot;
    invariant(
      snapshot?.basis ===
          "undeclared-root-reachable-static-source-timelines" &&
        snapshot.declaredFrameDomainCount === 1 &&
        Array.isArray(snapshot.undeclaredRootReachableTimelineIds) &&
        snapshot.undeclaredRootReachableTimelineIds.length ===
          snapshot.undeclaredRootReachableTimelineCount &&
        Number.isSafeInteger(snapshot.excludedNotProvenTimelineCount) &&
        snapshot.excludedNotProvenTimelineCount >= 0,
      `${member.animationId}: source candidate snapshot drifted`,
    );
    const oneEligible = member.oneFrame?.eligibleCandidates || [];
    const oneExcluded = member.oneFrame?.excludedCandidates || [];
    const multiEligible = member.multiFrame?.eligibleCandidates || [];
    const multiExcluded = member.multiFrame?.excludedCandidates || [];
    invariant(
      member.oneFrame.inspectedReachableTimelineCount ===
          oneEligible.length + oneExcluded.length &&
        member.oneFrame.eligibleCandidateCount === oneEligible.length &&
        member.oneFrame.excludedCandidateCount === oneExcluded.length,
      `${member.animationId}: one-frame partition is incomplete`,
    );
    invariant(
      member.multiFrame.inspectedReachableTimelineCount ===
          multiEligible.length + multiExcluded.length &&
        member.multiFrame.eligibleCandidateCount === multiEligible.length &&
        member.multiFrame.excludedCandidateCount === multiExcluded.length &&
        multiEligible.length === 0,
      `${member.animationId}: multi-frame partition is incomplete or was promoted`,
    );
    for (const candidate of oneEligible) {
      validateSingleCandidate(
        candidate,
        true,
        `${member.animationId}/${candidate.timelineId}`,
      );
    }
    for (const candidate of oneExcluded) {
      validateSingleCandidate(
        candidate,
        false,
        `${member.animationId}/${candidate.timelineId}`,
      );
    }
    for (const candidate of multiEligible) {
      validateMultiCandidate(
        candidate,
        true,
        `${member.animationId}/${candidate.timelineId}`,
      );
    }
    for (const candidate of multiExcluded) {
      validateMultiCandidate(
        candidate,
        false,
        `${member.animationId}/${candidate.timelineId}`,
      );
    }
    const candidateIds = [
      ...oneEligible,
      ...oneExcluded,
      ...multiEligible,
      ...multiExcluded,
    ].map(({timelineId}) => timelineId).sort(compareTimelineIds);
    invariant(
      new Set(candidateIds).size === candidateIds.length &&
        JSON.stringify(candidateIds) ===
          JSON.stringify(snapshot.undeclaredRootReachableTimelineIds),
      `${member.animationId}: candidate IDs do not exactly partition source-proven undeclared root-reachable timelines`,
    );
    const reachable = oneEligible.length + oneExcluded.length +
      multiEligible.length + multiExcluded.length;
    invariant(
      reachable === snapshot.undeclaredRootReachableTimelineCount,
      `${member.animationId}: reachable child count drifted`,
    );
    totals.reachableChildren += reachable;
    totals.oneFrame += oneEligible.length + oneExcluded.length;
    totals.oneFrameEligible += oneEligible.length;
    totals.oneFrameExcluded += oneExcluded.length;
    totals.multiFrame += multiEligible.length + multiExcluded.length;
    totals.multiFrameEligible += multiEligible.length;
    totals.multiFrameExcluded += multiExcluded.length;
    totals.nonReachableDefinitions += snapshot.excludedNotProvenTimelineCount;
  }
  invariant(
    sha256Bytes(Buffer.from(stableJson(identities))) ===
      ORDERED_MEMBER_IDENTITY_SHA256,
    "candidate report ordered release identities drifted",
  );
  for (const [key, expected] of Object.entries({
    ...EXPECTED,
    members: undefined,
    pages: undefined,
    shells: undefined,
  })) {
    if (expected !== undefined) {
      invariant(totals[key] === expected, `candidate report ${key} total drifted`);
      invariant(
        report.summary?.[key] === expected,
        `candidate report summary ${key} drifted`,
      );
    }
  }
  invariant(
    report.summary.memberCount === EXPECTED.members &&
      report.summary.frameDomainDispositionMutationCount === 0 &&
      report.summary.canonicalWorkspaceMutationCount === 0 &&
      report.summary.multiFrameCandidateGroupCount === 0,
    "candidate report summary crossed the candidate-only boundary",
  );
  invariant(
    report.nonReachableDefinitionBoundary?.count ===
        EXPECTED.nonReachableDefinitions &&
      report.nonReachableDefinitionBoundary.reachabilityStatus ===
        "excluded-not-proven-reachable" &&
      report.nonReachableDefinitionBoundary.candidateStatus ===
        "not-enumerated-as-reachable-candidates" &&
      typeof report.nonReachableDefinitionBoundary.explanation === "string" &&
      report.nonReachableDefinitionBoundary.explanation.length > 40,
    "candidate report lost the 185 non-reachable definition boundary",
  );
  validateAcceptanceFalse(report.acceptanceEffects, "candidate report");
  invariant(
    report.protectedMutationCounts &&
      Object.values(report.protectedMutationCounts).every(
        (value) => value === 0,
      ),
    "candidate report recorded a protected mutation",
  );
  invariant(
    report.strictAcceptanceEffect === STRICT_EFFECT,
    "candidate report strict acceptance effect drifted",
  );
  invariant(
    SHA256.test(report.reportFingerprintSha256 || ""),
    "candidate report fingerprint is missing",
  );
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 ===
      sha256Bytes(Buffer.from(stableJson(projected))),
    "candidate report fingerprint drifted",
  );
  return true;
}

export async function buildG5L5StaticFrameDomainDispositionCandidates({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const tracker = new InputTracker(projectRoot);
  const [
    releaseRecord,
    generatorRecord,
    proofEngineRecord,
  ] = await Promise.all([
    readJson(
      tracker,
      RELEASE_CATALOG_RELATIVE,
      "G5 L5 release catalog",
    ),
    tracker.read(SCRIPT_RELATIVE, "candidate generator"),
    tracker.read(PROOF_ENGINE_RELATIVE, "static disposition proof engine"),
  ]);
  const release = selectRelease(releaseRecord.document);
  const members = [];
  for (const member of release.members) {
    members.push(await buildMember(tracker, member));
  }
  const sum = (selector) =>
    members.reduce((total, member) => total + selector(member), 0);
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-static-frame-domain-disposition-candidates",
    evidenceState:
      "machine-only-static-candidate-enumeration-no-disposition-change",
    generatedBy: {
      script: SCRIPT_RELATIVE,
      version: 1,
      bytes: generatorRecord.bytes,
      sha256: generatorRecord.sha256,
      deterministic: true,
      proofEngine: descriptor(proofEngineRecord),
    },
    release: {
      releaseId: RELEASE_ID,
      titleDisplay: release.titleDisplay,
      releaseType: release.releaseType,
      publicationMode: release.publicationMode,
      memberCount: EXPECTED.members,
      pageCount: EXPECTED.pages,
      shellCount: EXPECTED.shells,
      releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
      orderedMemberIdentitySha256: ORDERED_MEMBER_IDENTITY_SHA256,
      catalog: descriptor(releaseRecord),
    },
    method: {
      oneFrameEligibilityEngine: "deriveSingleFrameScriptlessEligibility",
      multiFrameEligibilityEngine:
        "deriveMultiFrameScriptlessCandidateAudit",
      sourceCandidateBasis:
        "undeclared-root-reachable-static-source-timelines",
      candidateOnly: true,
    },
    summary: {
      memberCount: members.length,
      reachableChildren: sum(
        ({sourceCandidateSnapshot}) =>
          sourceCandidateSnapshot.undeclaredRootReachableTimelineCount,
      ),
      oneFrame: sum(
        ({oneFrame}) => oneFrame.inspectedReachableTimelineCount,
      ),
      oneFrameEligible: sum(
        ({oneFrame}) => oneFrame.eligibleCandidateCount,
      ),
      oneFrameExcluded: sum(
        ({oneFrame}) => oneFrame.excludedCandidateCount,
      ),
      multiFrame: sum(
        ({multiFrame}) => multiFrame.inspectedReachableTimelineCount,
      ),
      multiFrameEligible: sum(
        ({multiFrame}) => multiFrame.eligibleCandidateCount,
      ),
      multiFrameExcluded: sum(
        ({multiFrame}) => multiFrame.excludedCandidateCount,
      ),
      nonReachableDefinitions: sum(
        ({sourceCandidateSnapshot}) =>
          sourceCandidateSnapshot.excludedNotProvenTimelineCount,
      ),
      multiFrameCandidateGroupCount: 0,
      frameDomainDispositionMutationCount: 0,
      canonicalWorkspaceMutationCount: 0,
    },
    members,
    nonReachableDefinitionBoundary: {
      count: EXPECTED.nonReachableDefinitions,
      reachabilityStatus: "excluded-not-proven-reachable",
      candidateStatus: "not-enumerated-as-reachable-candidates",
      explanation:
        "These 185 SWF timeline definitions exist in the static definition inventory but are excluded because the hash-bound scenario inventories do not prove that they are reachable from each member's root placement graph. Absence from this candidate set is not proof that a definition is nonvisual, unreachable at runtime, safe to discard, or already represented by a declared frame domain.",
    },
    acceptanceEffects: {
      runtimeReachabilityEstablished: false,
      authoritativeOriginalRuntimeEstablished: false,
      frameDomainDispositionEstablished: false,
      canonicalSpecificationChanged: false,
      implementationAuthorized: false,
      rendererSelected: false,
      currentJavaScriptCandidateEstablished: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicationAuthorized: false,
      published: false,
    },
    protectedMutationCounts: {
      migrationWorkspaceFiles: 0,
      migrationManifests: 0,
      assetInventories: 0,
      keyframeSpecifications: 0,
      coverageRequirements: 0,
      frameDomainDispositions: 0,
      implementationFiles: 0,
      ledgers: 0,
      publicationRecords: 0,
    },
    limitations: [
      "The 696 one-frame entries are static independent-local-playhead proof candidates only; none is selected, adopted, or dispositioned by this report.",
      "All 303 reachable multi-frame timelines are excluded from the current static parent-clock candidate class with at least one explicit source-derived reason; their current disposition remains unresolved.",
      "A separate reviewed selection/proof transaction would be required before any workspace disposition, frame-domain specification, coverage, keyframe, implementation, or acceptance record could change.",
      "Original-runtime, authoring, visual, interaction, audio, Spanish, RMSE, independent-review, owner-acceptance, strict-completion, and publication gates remain open.",
    ],
    strictAcceptanceEffect: STRICT_EFFECT,
  };
  const report = finalizeReportFingerprint(base);
  validateG5L5StaticFrameDomainDispositionCandidateShape(report);
  return {report, inputRecords: tracker.list()};
}

export async function validateG5L5StaticFrameDomainDispositionCandidates(
  report,
  {projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT} = {},
) {
  validateG5L5StaticFrameDomainDispositionCandidateShape(report);
  const {report: trustedCurrentReport} =
    await buildG5L5StaticFrameDomainDispositionCandidates({
      projectRoot: projectRootOption,
    });
  invariant(
    stableJson(report) === stableJson(trustedCurrentReport),
    "candidate report differs from the trusted current physical release, generator, proof engine, manifests, source-derived candidate inventories, forensic inputs, or M1 receipts",
  );
  return true;
}

export function renderG5L5StaticFrameDomainDispositionCandidatesMarkdown(
  report,
) {
  validateG5L5StaticFrameDomainDispositionCandidateShape(report);
  const rows = report.members.map((member) =>
    `| ${member.releaseOrdinal} | \`${member.animationId}\` | ${member.releaseRole} | ${member.oneFrame.inspectedReachableTimelineCount} | ${member.oneFrame.eligibleCandidateCount} | ${member.oneFrame.excludedCandidateCount} | ${member.multiFrame.inspectedReachableTimelineCount} | ${member.multiFrame.eligibleCandidateCount} | ${member.multiFrame.excludedCandidateCount} | ${member.sourceCandidateSnapshot.excludedNotProvenTimelineCount} |`,
  ).join("\n");
  return `# G5 L5 Static Frame-Domain Disposition Candidates

Release: \`${RELEASE_ID}\` — **Add & Subtract Negative Numbers**  
Scope: **56 pages + Shell / 57 atomic release members**  
State: **machine-only static candidates; no disposition or acceptance change**

The report binds the exact release fingerprint, all 57 migration technical
projections, scenario inventories, physical SWFs, compressed and uncompressed
swfmill/FFDec evidence, source-derived undeclared root-reachable candidate
inventories, per-member M1 static reconciliation receipts, and the proof-engine
bytes. Mutable frame-domain disposition files are intentionally not inputs.

## Exact result

- Reachable unresolved child timelines: **1,047**
- One-frame timelines: **744**
  - eligible static candidates: **696**
  - disqualified with explicit reasons: **48**
- Multi-frame timelines: **303**
  - eligible under the current static parent-clock derivation: **0**
  - excluded with explicit reasons: **303**
- Definitions not proven reachable from a root placement graph: **185**

The 185 definitions are not candidate timelines. Their exclusion is not a
nonvisual, runtime-unreachable, disposable, composite-child, or accepted
disposition.

## Member census

| # | Animation | Role | 1-frame | Eligible | Excluded | Multi-frame | Eligible | Excluded | Not proven reachable |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Authority boundary

No candidate is selected or adopted. The generator writes only this JSON report
and this Markdown report. It changes no migration workspace, manifest,
\`asset-inventory.csv\`, \`keyframes.csv\`, coverage requirement, disposition,
renderer, implementation, evidence, ledger, acceptance, strict-completion, or
publication record.

All runtime, authoring, visual, interaction, audio, Spanish, RMSE, independent
review, owner acceptance, strict completion, and publication gates remain open.

Strict acceptance effect: **none**.
`;
}

async function ensureSafeDirectory(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  let cursor = projectRoot;
  for (const component of path.relative(projectRoot, directory)
    .split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor);
      metadata = await lstat(cursor);
    }
    invariant(
      metadata?.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(
    isWithin(realRoot, realDirectory),
    "output directory resolves outside project root",
  );
}

async function existingOutputState(projectRoot, relativePath) {
  const absolutePath = resolveProjectPath(
    projectRoot,
    relativePath,
    `${relativePath} output`,
  );
  const metadata = await lstat(absolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  const record = await readNoFollowRecord(
    projectRoot,
    relativePath,
    `${relativePath} output`,
  );
  return {
    absolutePath,
    bytes: record.bytes,
    sha256: record.sha256,
    signature: record.signature,
    contents: record.contents,
  };
}

async function verifyInputRecords(projectRoot, records) {
  for (const expected of records) {
    const current = await readNoFollowRecord(
      projectRoot,
      expected.path,
      `${expected.path} bound input`,
    );
    invariant(
      current.bytes === expected.bytes &&
        current.sha256 === expected.sha256 &&
        sameSignature(current.signature, expected.signature),
      `${expected.path}: bound input changed after report construction`,
    );
  }
}

async function writeExclusiveNoFollow(absolutePath, contents) {
  let handle;
  try {
    handle = await open(
      absolutePath,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o644,
    );
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle?.close();
  }
}

async function removeExpected(projectRoot, relativePath, expectedSha256) {
  const state = await existingOutputState(projectRoot, relativePath);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${relativePath}: cleanup target drifted`,
  );
  await unlink(state.absolutePath);
}

export async function commitCandidateOutputs({
  projectRoot: projectRootOption,
  outputs,
  inputRecords,
  check = false,
  hooks = {},
}) {
  const projectRoot = path.resolve(projectRootOption);
  invariant(
    outputs instanceof Map &&
      outputs.size === OUTPUT_RELATIVES.length &&
      OUTPUT_RELATIVES.every((relativePath) => outputs.has(relativePath)),
    "candidate output set must equal the fixed two-output allowlist",
  );
  invariant(
    [...outputs.keys()].every((relativePath) =>
      OUTPUT_RELATIVES.includes(relativePath)),
    "candidate output path is outside the fixed allowlist",
  );
  invariant(
    Array.isArray(inputRecords) && inputRecords.length > 0,
    "candidate transaction requires bound input records",
  );
  const entries = OUTPUT_RELATIVES.map((relativePath) => {
    const contents = outputs.get(relativePath);
    invariant(Buffer.isBuffer(contents), `${relativePath}: output must be bytes`);
    const absolutePath = resolveProjectPath(
      projectRoot,
      relativePath,
      `${relativePath} output`,
    );
    return {
      relativePath,
      absolutePath,
      contents,
      desiredSha256: sha256Bytes(contents),
      temporary: path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.tmp`,
      ),
      backup: path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.bak`,
      ),
    };
  });
  await ensureSafeDirectory(
    projectRoot,
    path.dirname(entries[0].absolutePath),
    !check,
  );
  await verifyInputRecords(projectRoot, inputRecords);
  if (check) {
    for (const entry of entries) {
      const state = await existingOutputState(projectRoot, entry.relativePath);
      invariant(
        state?.sha256 === entry.desiredSha256,
        `${entry.relativePath}: output is missing or stale`,
      );
    }
    return {
      action: "verified",
      outputCount: entries.length,
      outputs: entries.map(({relativePath, contents, desiredSha256}) => ({
        path: relativePath,
        bytes: contents.length,
        sha256: desiredSha256,
      })),
    };
  }
  let installedCount = 0;
  let committed = false;
  try {
    for (const entry of entries) {
      entry.prior = await existingOutputState(
        projectRoot,
        entry.relativePath,
      );
      entry.displaced = false;
      entry.installed = false;
    }
    for (const entry of entries) {
      invariant(
        !(await lstat(entry.temporary).catch((error) => {
          if (error?.code === "ENOENT") return null;
          throw error;
        })),
        `${entry.relativePath}: temporary path unexpectedly exists`,
      );
      invariant(
        !(await lstat(entry.backup).catch((error) => {
          if (error?.code === "ENOENT") return null;
          throw error;
        })),
        `${entry.relativePath}: backup path unexpectedly exists`,
      );
      await writeExclusiveNoFollow(entry.temporary, entry.contents);
    }
    await hooks.afterTempsWritten?.({entries});
    await verifyInputRecords(projectRoot, inputRecords);
    await hooks.beforeInstall?.({entries});
    for (const entry of entries) {
      const current = await existingOutputState(
        projectRoot,
        entry.relativePath,
      );
      invariant(
        Boolean(current) === Boolean(entry.prior) &&
          current?.sha256 === entry.prior?.sha256 &&
          (!current || sameSignature(current.signature, entry.prior.signature)),
        `${entry.relativePath}: output changed before install`,
      );
      if (entry.prior) {
        await rename(entry.absolutePath, entry.backup);
        entry.displaced = true;
        const backupRelative = portable(
          path.relative(projectRoot, entry.backup),
        );
        const displaced = await existingOutputState(
          projectRoot,
          backupRelative,
        );
        invariant(
          displaced?.bytes === entry.prior.bytes &&
            displaced.sha256 === entry.prior.sha256 &&
            sameSignature(displaced.signature, entry.prior.signature),
          `${entry.relativePath}: displaced output failed compare-and-swap verification`,
        );
      }
      await link(entry.temporary, entry.absolutePath);
      await unlink(entry.temporary);
      entry.installed = true;
      installedCount += 1;
      const installedState = await existingOutputState(
        projectRoot,
        entry.relativePath,
      );
      invariant(
        installedState?.bytes === entry.contents.length &&
          installedState.sha256 === entry.desiredSha256,
        `${entry.relativePath}: installed output drifted`,
      );
      if (installedCount === 1) await hooks.afterFirstInstall?.({entries});
    }
    await verifyInputRecords(projectRoot, inputRecords);
    committed = true;
    for (const entry of entries) {
      if (entry.prior) {
        const backupRelative = portable(path.relative(projectRoot, entry.backup));
        await removeExpected(projectRoot, backupRelative, entry.prior.sha256);
        entry.displaced = false;
      }
    }
  } catch (error) {
    if (committed) throw error;
    const rollbackErrors = [];
    for (const entry of [...entries].reverse()) {
      try {
        if (entry.installed) {
          await removeExpected(
            projectRoot,
            entry.relativePath,
            entry.desiredSha256,
          );
          entry.installed = false;
        }
      } catch (caught) {
        rollbackErrors.push(caught);
      }
      try {
        if (entry.displaced) {
          const targetMetadata = await lstat(entry.absolutePath)
            .catch((caught) => {
              if (caught?.code === "ENOENT") return null;
              throw caught;
            });
          invariant(
            targetMetadata === null,
            `${entry.relativePath}: refusing to overwrite a target occupied during rollback`,
          );
          await rename(entry.backup, entry.absolutePath);
          entry.displaced = false;
          const restored = await existingOutputState(
            projectRoot,
            entry.relativePath,
          );
          invariant(
            restored?.bytes === entry.prior?.bytes &&
              restored.sha256 === entry.prior.sha256 &&
              sameSignature(restored.signature, entry.prior.signature),
            `${entry.relativePath}: rollback restoration drifted`,
          );
        }
      } catch (caught) {
        rollbackErrors.push(caught);
      }
      try {
        const temporaryRelative = portable(
          path.relative(projectRoot, entry.temporary),
        );
        await removeExpected(
          projectRoot,
          temporaryRelative,
          entry.desiredSha256,
        );
      } catch (caught) {
        rollbackErrors.push(caught);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "candidate report transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }
  return {
    action: "written",
    outputCount: entries.length,
    outputs: entries.map(({relativePath, contents, desiredSha256}) => ({
      path: relativePath,
      bytes: contents.length,
      sha256: desiredSha256,
    })),
  };
}

export function candidateOutputBytes(report) {
  validateG5L5StaticFrameDomainDispositionCandidateShape(report);
  return new Map([
    [OUTPUT_RELATIVES[0], Buffer.from(stableJson(report))],
    [
      OUTPUT_RELATIVES[1],
      Buffer.from(
        renderG5L5StaticFrameDomainDispositionCandidatesMarkdown(report),
      ),
    ],
  ]);
}

export function parseG5L5StaticFrameDomainCandidateArguments(argv) {
  const options = {mode: "dry-run"};
  let modeSeen = false;
  for (const argument of argv) {
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(!modeSeen, "choose exactly one execution mode");
      options.mode = argument.slice(2);
      modeSeen = true;
    } else if (argument === "--help" || argument === "-h") {
      invariant(argv.length === 1, "--help cannot be combined with another option");
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parseG5L5StaticFrameDomainCandidateArguments(
    process.argv.slice(2),
  );
  if (options.help) {
    process.stdout.write(
      `Usage: node ${SCRIPT_RELATIVE} [--dry-run|--apply|--check]\n` +
      `Fixed outputs:\n- ${OUTPUT_RELATIVES.join("\n- ")}\n`,
    );
    return;
  }
  const {report, inputRecords} =
    await buildG5L5StaticFrameDomainDispositionCandidates();
  if (options.mode === "dry-run") {
    process.stdout.write(`${JSON.stringify({
      action: "dry-run",
      outputCount: OUTPUT_RELATIVES.length,
      summary: report.summary,
      reportFingerprintSha256: report.reportFingerprintSha256,
      acceptanceEffect: "none",
    })}\n`);
    return;
  }
  const result = await commitCandidateOutputs({
    projectRoot: DEFAULT_PROJECT_ROOT,
    outputs: candidateOutputBytes(report),
    inputRecords,
    check: options.mode === "check",
  });
  process.stdout.write(`${JSON.stringify({
    ...result,
    summary: report.summary,
    reportFingerprintSha256: report.reportFingerprintSha256,
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
