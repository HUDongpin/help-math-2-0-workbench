#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  buildFrameDomainDispositions,
} from "./build-frame-domain-dispositions.mjs";
import {
  STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
  buildStaticCompositeEvidenceDocument,
  deriveMultiFrameScriptlessCandidateAudit,
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH,
  SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  bindSwfmillDoActionFrameSequences,
  canonicalIndependentPairSet,
  deriveSourceProvenIndependentRequiredAudit,
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/materialize-lesson-release-source-proven-frame-domain-dispositions.mjs";
const PROOF_ENGINE_RELATIVE =
  "scripts/build-static-frame-domain-disposition-evidence.mjs";
const INDEPENDENT_PROOF_ENGINE_RELATIVE =
  "scripts/source-proven-independent-frame-domain-evidence.mjs";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const STRICT_EFFECT =
  "none; source-proven independent-local-playhead dispositions only; no runtime, visual, behavior, audio, full-frame/RMSE, human, owner, strict-completion, release, or publication acceptance";

export const G4_L10_RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const G4_L10_WAVE2_REPORT_RELATIVE =
  "reports/lesson-release-source-proven-independent-frame-domains/lesson-g04-l10-perimeter-area.json";

export const SOURCE_PROVEN_RELEASE_CONTRACTS = Object.freeze({
  [G4_L10_RELEASE_ID]: Object.freeze({
    releaseId: G4_L10_RELEASE_ID,
    titleDisplay: "Perimeter & Area",
    grade: 4,
    lesson: 10,
    reportPath:
      "reports/lesson-release-source-proven-frame-domain-dispositions/lesson-g04-l10-perimeter-area.json",
    releaseCatalogSha256:
      "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
    releaseFingerprintSha256:
      "4b77aedf7dcb0aeb9e9a84b7eb97b89b7a0ff03200956a4a93d65f8f9de2b1fd",
    orderedMemberIdentitySha256:
      "b3950290c53c2d6f5f1bd40ce20deb1f1b954660b0868a3fa8dc3795ec5504fe",
    expected: Object.freeze({
      members: 47,
      declaredRoots: 47,
      reachableChildren: 1041,
      oneFrameChildren: 792,
      acceptedSingleFrameChildren: 751,
      disqualifiedSingleFrameChildren: 41,
      multiFrameChildren: 249,
      acceptedMultiFrameChildren: 0,
      sourceProvenIndependentRequiredChildren: 213,
      wave2UnresolvedChildren: 77,
      excludedNotProvenDefinitions: 210,
      membersWithAcceptedClaims: 46,
      membersWithIndependentRequiredClaims: 40,
      postMaterializationComposites: 751,
      postMaterializationIndependentRequired: 213,
      postMaterializationUnresolved: 77,
      eligibleSingleFramePairSetSha256:
        "41bc1f1c765553e6e6f2a2c123b0d89aa666ce90b5402d13212e00bc8744e1c0",
      disqualifiedSingleFramePairSetSha256:
        "0dc88548e9669900cbee9e07f79f701234d6fd3eb7d59154f0678046b3c29f68",
      multiFramePairSetSha256:
        "894c664fc83709ae9ab9a2e8fcc95a654be163652ed6f37ec5328a43fa1b8b66",
      acceptedMultiFramePairSetSha256:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      sourceProvenIndependentRequiredPairSetSha256:
        "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f",
      wave2RejectedPairSetSha256:
        "e796abfd334b8c92971f26e7ff35e2706b88e382964221623c63636afcf5f76e",
      excludedNotProvenPairSetSha256:
        "6bb7c631119b1e23f308411e9dcb959d7e37a2e3c2eb5474e524d173e0296056",
    }),
  }),
});

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

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareTimelineIds(left, right) {
  const leftNumber = Number(String(left).replace(/^sprite-/, ""));
  const rightNumber = Number(String(right).replace(/^sprite-/, ""));
  return leftNumber - rightNumber || String(left).localeCompare(String(right));
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    !path.isAbsolute(relative)
    && relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
  );
}

function resolveProjectPath(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath)
      && portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function descriptor(pathValue, bytes) {
  return {
    path: pathValue,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function readProjectFile(projectRoot, relativePath, label = relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected an ordinary single-link file`,
  );
  const realRoot = await realpath(projectRoot);
  const realFile = await realpath(absolutePath);
  invariant(isWithin(realRoot, realFile), `${label}: real path escapes the project root`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev
      && before.ino === after.ino
      && before.size === after.size
      && before.mtimeNs === after.mtimeNs
      && before.ctimeNs === after.ctimeNs
      && BigInt(bytes.length) === after.size,
    `${label}: changed while it was read`,
  );
  return {
    absolutePath,
    contents: bytes,
    byteLength: bytes.length,
    ...descriptor(relativePath, bytes),
  };
}

async function readJsonRecord(projectRoot, relativePath, label = relativePath) {
  const record = await readProjectFile(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function requiredEvidence(inventory, artifactId) {
  const matches = (inventory.evidenceIndex || []).filter(
    (item) => item.artifactId === artifactId,
  );
  invariant(
    matches.length === 1,
    `${inventory.animationId}: expected exactly one ${artifactId} evidence binding`,
  );
  invariant(
    SHA256_PATTERN.test(matches[0].sha256 || ""),
    `${inventory.animationId}: ${artifactId} SHA-256 is invalid`,
  );
  return matches[0];
}

function artifactRelativePath(animationId, artifactPath) {
  if (
    artifactPath.startsWith("source-assets/")
    || artifactPath.startsWith("migrations/")
  ) return artifactPath;
  return `migrations/${animationId}/${artifactPath}`;
}

async function verifiedArtifact(projectRoot, animationId, evidence) {
  const relativePath = artifactRelativePath(animationId, evidence.path);
  const record = await readProjectFile(
    projectRoot,
    relativePath,
    `${animationId}: ${evidence.artifactId}`,
  );
  invariant(
    record.sha256 === evidence.sha256,
    `${animationId}: ${evidence.artifactId} physical SHA-256 drifted`,
  );
  return record;
}

export function canonicalPairSet(entries) {
  invariant(Array.isArray(entries), "pair set entries must be an array");
  const lines = entries.map(({animationId, timelineId}) => {
    invariant(
      typeof animationId === "string"
        && animationId.length > 0
        && !animationId.includes("\t")
        && !animationId.includes("\n"),
      "pair set animationId is invalid",
    );
    invariant(
      /^sprite-\d+$/.test(timelineId || ""),
      `${animationId}: pair set timelineId is invalid`,
    );
    return `${animationId}\t${timelineId}`;
  }).sort();
  invariant(new Set(lines).size === lines.length, "pair set contains duplicates");
  const bytes = Buffer.from(lines.length ? `${lines.join("\n")}\n` : "", "utf8");
  return {
    count: lines.length,
    sha256: sha256(bytes),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function releaseFingerprint(release) {
  return sha256(Buffer.from(stableJson(release), "utf8"));
}

function orderedMemberIdentityFingerprint(release) {
  return sha256(Buffer.from(stableJson(release.members.map(
    ({ordinal, animationId, assetId}) => ({ordinal, animationId, assetId}),
  )), "utf8"));
}

function validateRelease(release, contract) {
  invariant(release, `${contract.releaseId}: release is missing`);
  invariant(
    release.releaseId === contract.releaseId
      && release.titleDisplay === contract.titleDisplay
      && release.grade === contract.grade
      && release.lesson === contract.lesson
      && release.releaseType === "complete-lesson"
      && release.publicationMode === "atomic"
      && release.developmentMode === "parallel-shards",
    `${contract.releaseId}: release identity or governance drifted`,
  );
  invariant(
    release.expectedCounts?.members === contract.expected.members
      && release.members?.length === contract.expected.members,
    `${contract.releaseId}: exact member count drifted`,
  );
  invariant(
    release.members.every((member, index) => (
      member.ordinal === index + 1
      && member.assetId === `swf-${member.source?.sha256}`
      && SHA256_PATTERN.test(member.source?.sha256 || "")
    )),
    `${contract.releaseId}: ordered member/source identity is invalid`,
  );
  invariant(
    releaseFingerprint(release) === contract.releaseFingerprintSha256,
    `${contract.releaseId}: release fingerprint drifted`,
  );
  invariant(
    orderedMemberIdentityFingerprint(release)
      === contract.orderedMemberIdentitySha256,
    `${contract.releaseId}: ordered member identity drifted`,
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
    eligible: inspection.eligible,
    disqualifiers: [...inspection.disqualifiers],
  };
}

async function buildMemberProof(projectRoot, member, catalogRecord, contract) {
  const {animationId} = member;
  const manifestPath = `migrations/${animationId}/migration.json`;
  const inventoryPath =
    `migrations/${animationId}/audit/scenario-inventory.json`;
  const [manifestRecord, inventoryRecord] = await Promise.all([
    readJsonRecord(projectRoot, manifestPath),
    readJsonRecord(projectRoot, inventoryPath),
  ]);
  const manifest = manifestRecord.document;
  const inventory = inventoryRecord.document;
  invariant(
    manifest.animationId === animationId
      && inventory.animationId === animationId,
    `${animationId}: workspace identity mismatch`,
  );
  invariant(
    inventory.inventoryStatus === "static-exhaustive-runtime-unverified"
      && inventory.migrationStatusChanged === false,
    `${animationId}: scenario inventory authority was broadened`,
  );
  invariant(
    manifest.assetId === member.assetId
      && manifest.source?.swfSha256 === member.source.sha256
      && manifest.source?.swf === manifest.source?.placementPath
      && manifest.source.swf.endsWith(`/${member.source.path}`),
    `${animationId}: release/workspace source binding drifted`,
  );

  const releaseEvidence = requiredEvidence(
    inventory,
    "lesson-release-membership",
  );
  invariant(
    releaseEvidence.path === RELEASE_CATALOG_RELATIVE
      && releaseEvidence.sha256 === catalogRecord.sha256
      && releaseEvidence.bytes === catalogRecord.byteLength
      && releaseEvidence.releaseId === contract.releaseId
      && releaseEvidence.ordinal === member.ordinal
      && releaseEvidence.animationId === animationId
      && releaseEvidence.assetId === member.assetId
      && releaseEvidence.sourcePath === member.source.path
      && releaseEvidence.sourceSha256 === member.source.sha256,
    `${animationId}: scenario inventory release-membership binding drifted`,
  );

  const manifestEvidence = requiredEvidence(
    inventory,
    "migration-technical-contract",
  );
  invariant(
    manifestEvidence.path === "migration.json"
      && manifestEvidence.hashMode === "canonical-json-v1"
      && manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id
      && JSON.stringify(manifestEvidence.excludedPaths)
        === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
      && manifestEvidence.sha256 === technicalManifestSha256(manifest),
    `${animationId}: migration technical projection drifted`,
  );

  const sourceEvidence = requiredEvidence(inventory, "source-swf");
  const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  invariant(
    sourceEvidence.path === manifest.source.swf
      && sourceEvidence.sha256 === member.source.sha256,
    `${animationId}: source-SWF evidence differs from release membership`,
  );
  invariant(
    SHA256_PATTERN.test(swfmillEvidence.uncompressedSha256 || "")
      && SHA256_PATTERN.test(scriptsEvidence.uncompressedSha256 || ""),
    `${animationId}: uncompressed machine-evidence hashes are invalid`,
  );
  const [sourceRecord, swfmillRecord, scriptsRecord] = await Promise.all([
    verifiedArtifact(projectRoot, animationId, sourceEvidence),
    verifiedArtifact(projectRoot, animationId, swfmillEvidence),
    verifiedArtifact(projectRoot, animationId, scriptsEvidence),
  ]);
  const swfmillXml = gunzipSync(swfmillRecord.contents).toString("utf8");
  const scriptsText = gunzipSync(scriptsRecord.contents).toString("utf8");
  invariant(
    sha256(swfmillXml) === swfmillEvidence.uncompressedSha256,
    `${animationId}: uncompressed swfmill structure drifted`,
  );
  invariant(
    sha256(scriptsText) === scriptsEvidence.uncompressedSha256,
    `${animationId}: uncompressed FFDec scripts drifted`,
  );

  const structure = bindSwfmillDoActionFrameSequences(
    parseSwfmillDispositionStructure(swfmillXml),
    swfmillXml,
  );
  const scripts = parseFfdecDispositionScripts(scriptsText);
  const singleFrame = deriveSingleFrameScriptlessEligibility({
    animationId,
    structure,
    scripts,
    inventory,
    manifest,
  });
  const multiFrame = deriveMultiFrameScriptlessCandidateAudit({
    animationId,
    structure,
    scripts,
    inventory,
    manifest,
  });
  const serializedSingle = [...singleFrame.inspections.values()]
    .map(serializeSingleFrameInspection)
    .sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
  const acceptedSingleFrameTimelineIds = serializedSingle
    .filter(({eligible}) => eligible)
    .map(({timelineId}) => timelineId);
  invariant(
    JSON.stringify(acceptedSingleFrameTimelineIds)
      === JSON.stringify(singleFrame.eligibleTimelineIds),
    `${animationId}: single-frame eligibility ordering drifted`,
  );
  const serializedMulti = multiFrame.inspections
    .map(serializeMultiFrameInspection)
    .sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
  const acceptedMultiFrameTimelineIds = serializedMulti
    .filter(({eligible}) => eligible)
    .map(({timelineId}) => timelineId);
  invariant(
    JSON.stringify(acceptedMultiFrameTimelineIds)
      === JSON.stringify(multiFrame.eligibleTimelineIds),
    `${animationId}: multi-frame eligibility ordering drifted`,
  );

  const wave2RemainingTimelineIds = [
    ...serializedSingle
      .filter(({eligible}) => !eligible)
      .map(({timelineId}) => timelineId),
    ...serializedMulti.map(({timelineId}) => timelineId),
  ];
  const wave2PriorDisqualifiers = new Map([
    ...serializedSingle
      .filter(({eligible}) => !eligible)
      .map(({timelineId, disqualifiers}) => [timelineId, disqualifiers]),
    ...serializedMulti.map(
      ({timelineId, disqualifiers}) => [timelineId, disqualifiers],
    ),
  ]);
  const independentRequired = deriveSourceProvenIndependentRequiredAudit({
    animationId,
    structure,
    scripts,
    inventory,
    manifest,
    remainingTimelineIds: wave2RemainingTimelineIds,
    priorDisqualifiersByTimeline: wave2PriorDisqualifiers,
  });
  invariant(
    independentRequired.remainingTimelineIds.length
      === serializedSingle.filter(({eligible}) => !eligible).length
        + serializedMulti.length,
    `${animationId}: wave-2 remaining partition drifted`,
  );

  const reachableChildren = (inventory.timelineInventory || []).filter(
    ({structuralReachability}) => (
      structuralReachability === "reachable-from-root-placement-graph"
    ),
  );
  const excludedNotProvenTimelineIds = (inventory.timelineInventory || [])
    .filter(({structuralReachability}) => (
      structuralReachability === "not-proven-by-root-placement-graph"
    ))
    .map(({timelineId}) => timelineId)
    .sort(compareTimelineIds);
  invariant(
    reachableChildren.length
      === serializedSingle.length + serializedMulti.length,
    `${animationId}: reachable child partition is incomplete`,
  );

  const acceptedSinglePairs = acceptedSingleFrameTimelineIds.map(
    (timelineId) => ({animationId, timelineId}),
  );
  return {
    animationId,
    ordinal: member.ordinal,
    assetId: member.assetId,
    bindings: {
      sourceSwf: {
        path: sourceEvidence.path,
        bytes: sourceRecord.byteLength,
        sha256: sourceRecord.sha256,
      },
      migrationTechnicalProjection: {
        path: manifestPath,
        sha256: manifestEvidence.sha256,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
      },
      scenarioInventory: {
        path: inventoryPath,
        bytes: inventoryRecord.byteLength,
        sha256: inventoryRecord.sha256,
      },
      swfmillStructure: {
        path: swfmillEvidence.path,
        sha256: swfmillEvidence.sha256,
        uncompressedSha256: swfmillEvidence.uncompressedSha256,
      },
      ffdecScripts: {
        path: scriptsEvidence.path,
        sha256: scriptsEvidence.sha256,
        uncompressedSha256: scriptsEvidence.uncompressedSha256,
      },
    },
    counts: {
      reachableChildren: reachableChildren.length,
      oneFrameChildren: serializedSingle.length,
      acceptedSingleFrameChildren: acceptedSingleFrameTimelineIds.length,
      disqualifiedSingleFrameChildren: serializedSingle.length
        - acceptedSingleFrameTimelineIds.length,
      multiFrameChildren: serializedMulti.length,
      acceptedMultiFrameChildren: acceptedMultiFrameTimelineIds.length,
      sourceProvenIndependentRequiredChildren:
        independentRequired.accepted.length,
      wave2UnresolvedChildren: independentRequired.rejected.length,
      excludedNotProvenDefinitions: excludedNotProvenTimelineIds.length,
    },
    acceptedSingleFrameTimelineIds,
    acceptedSingleFramePairSet: canonicalPairSet(acceptedSinglePairs),
    disqualifiedSingleFrameTimelines: serializedSingle.filter(
      ({eligible}) => !eligible,
    ),
    multiFrameTimelines: serializedMulti,
    independentRequired,
    excludedNotProvenTimelineIds,
    raw: {
      manifest,
      inventory,
      inventorySha256: inventoryRecord.sha256,
      sourceSwfBytes: sourceRecord.contents,
      swfmillGzip: swfmillRecord.contents,
      scriptsGzip: scriptsRecord.contents,
      undeclaredMultiFrameTimelineIds: multiFrame.undeclaredTimelineIds,
    },
  };
}

function reportMember(proof) {
  return {
    animationId: proof.animationId,
    ordinal: proof.ordinal,
    assetId: proof.assetId,
    bindings: proof.bindings,
    counts: proof.counts,
    acceptedSingleFrameTimelineIds: proof.acceptedSingleFrameTimelineIds,
    acceptedSingleFramePairSet: proof.acceptedSingleFramePairSet,
    disqualifiedSingleFrameTimelines:
      proof.disqualifiedSingleFrameTimelines,
    multiFrameTimelines: proof.multiFrameTimelines,
    wave2: {
      independentRequiredCount: proof.independentRequired.accepted.length,
      independentRequiredTimelineIds:
        proof.independentRequired.acceptedTimelineIds,
      unresolvedCount: proof.independentRequired.rejected.length,
      unresolvedTimelineIds: proof.independentRequired.rejectedTimelineIds,
      blockerClasses: Object.fromEntries(
        Object.entries(Object.groupBy(
          proof.independentRequired.rejected,
          ({blockerClass}) => blockerClass,
        )).sort(([left], [right]) => left.localeCompare(right)).map(
          ([blockerClass, items]) => [blockerClass, items.length],
        ),
      ),
    },
    excludedNotProvenTimelineIds: proof.excludedNotProvenTimelineIds,
  };
}

function aggregateProof(memberProofs) {
  const eligibleSingleFramePairs = [];
  const disqualifiedSingleFramePairs = [];
  const multiFramePairs = [];
  const acceptedMultiFramePairs = [];
  const sourceProvenIndependentRequiredPairs = [];
  const wave2RejectedPairs = [];
  const excludedNotProvenPairs = [];
  const totals = {
    members: memberProofs.length,
    declaredRoots: memberProofs.length,
    reachableChildren: 0,
    oneFrameChildren: 0,
    acceptedSingleFrameChildren: 0,
    disqualifiedSingleFrameChildren: 0,
    multiFrameChildren: 0,
    acceptedMultiFrameChildren: 0,
    sourceProvenIndependentRequiredChildren: 0,
    wave2UnresolvedChildren: 0,
    excludedNotProvenDefinitions: 0,
    membersWithAcceptedClaims: 0,
    membersWithIndependentRequiredClaims: 0,
  };
  for (const proof of memberProofs) {
    for (const key of [
      "reachableChildren",
      "oneFrameChildren",
      "acceptedSingleFrameChildren",
      "disqualifiedSingleFrameChildren",
      "multiFrameChildren",
      "acceptedMultiFrameChildren",
      "sourceProvenIndependentRequiredChildren",
      "wave2UnresolvedChildren",
      "excludedNotProvenDefinitions",
    ]) totals[key] += proof.counts[key];
    if (proof.acceptedSingleFrameTimelineIds.length) {
      totals.membersWithAcceptedClaims += 1;
    }
    if (proof.independentRequired.accepted.length) {
      totals.membersWithIndependentRequiredClaims += 1;
    }
    eligibleSingleFramePairs.push(...proof.acceptedSingleFrameTimelineIds.map(
      (timelineId) => ({animationId: proof.animationId, timelineId}),
    ));
    disqualifiedSingleFramePairs.push(
      ...proof.disqualifiedSingleFrameTimelines.map(
        ({timelineId}) => ({animationId: proof.animationId, timelineId}),
      ),
    );
    multiFramePairs.push(...proof.multiFrameTimelines.map(
      ({timelineId}) => ({animationId: proof.animationId, timelineId}),
    ));
    acceptedMultiFramePairs.push(...proof.multiFrameTimelines
      .filter(({eligible}) => eligible)
      .map(({timelineId}) => ({animationId: proof.animationId, timelineId})));
    sourceProvenIndependentRequiredPairs.push(
      ...proof.independentRequired.accepted.map(
        ({timelineId}) => ({animationId: proof.animationId, timelineId}),
      ),
    );
    wave2RejectedPairs.push(...proof.independentRequired.rejected.map(
      ({timelineId}) => ({animationId: proof.animationId, timelineId}),
    ));
    excludedNotProvenPairs.push(...proof.excludedNotProvenTimelineIds.map(
      (timelineId) => ({animationId: proof.animationId, timelineId}),
    ));
  }
  return {
    totals,
    pairSets: {
      eligibleSingleFrame: canonicalPairSet(eligibleSingleFramePairs),
      disqualifiedSingleFrame: canonicalPairSet(
        disqualifiedSingleFramePairs,
      ),
      multiFrame: canonicalPairSet(multiFramePairs),
      acceptedMultiFrame: canonicalPairSet(acceptedMultiFramePairs),
      sourceProvenIndependentRequired: canonicalIndependentPairSet(
        sourceProvenIndependentRequiredPairs,
      ),
      wave2Rejected: canonicalIndependentPairSet(wave2RejectedPairs),
      excludedNotProven: canonicalPairSet(excludedNotProvenPairs),
    },
  };
}

export function assertExactSourceProofCensus(
  aggregate,
  expected,
  label = "source-proven frame-domain census",
) {
  const {totals, pairSets} = aggregate;
  for (const key of [
    "members",
    "declaredRoots",
    "reachableChildren",
    "oneFrameChildren",
    "acceptedSingleFrameChildren",
    "disqualifiedSingleFrameChildren",
    "multiFrameChildren",
    "acceptedMultiFrameChildren",
    "sourceProvenIndependentRequiredChildren",
    "wave2UnresolvedChildren",
    "excludedNotProvenDefinitions",
    "membersWithAcceptedClaims",
    "membersWithIndependentRequiredClaims",
  ]) {
    invariant(
      totals[key] === expected[key],
      `${label}: ${key} drifted (${totals[key]} != ${expected[key]})`,
    );
  }
  for (const [pairSet, expectedKey] of [
    ["eligibleSingleFrame", "eligibleSingleFramePairSetSha256"],
    ["disqualifiedSingleFrame", "disqualifiedSingleFramePairSetSha256"],
    ["multiFrame", "multiFramePairSetSha256"],
    ["acceptedMultiFrame", "acceptedMultiFramePairSetSha256"],
    [
      "sourceProvenIndependentRequired",
      "sourceProvenIndependentRequiredPairSetSha256",
    ],
    ["wave2Rejected", "wave2RejectedPairSetSha256"],
    ["excludedNotProven", "excludedNotProvenPairSetSha256"],
  ]) {
    invariant(
      pairSets[pairSet].sha256 === expected[expectedKey],
      `${label}: ${pairSet} exact pair set drifted`,
    );
  }
  invariant(
    totals.acceptedMultiFrameChildren === 0,
    `${label}: multi-frame domains require a separately pinned parent-clock contract`,
  );
  invariant(
    totals.sourceProvenIndependentRequiredChildren
        + totals.wave2UnresolvedChildren
      === totals.disqualifiedSingleFrameChildren + totals.multiFrameChildren,
    `${label}: wave-2 accepted/rejected partition is incomplete`,
  );
  return true;
}

function buildReport({
  contract,
  catalogRecord,
  release,
  memberProofs,
  aggregate,
  scriptRecord,
  proofEngineRecord,
  independentProofEngineRecord,
}) {
  return {
    schemaVersion: 1,
    reportType:
      "lesson-release-source-proven-frame-domain-disposition-contract",
    releaseId: contract.releaseId,
    generatedBy: {
      script: SCRIPT_RELATIVE,
      sha256: scriptRecord.sha256,
      deterministic: true,
      proofEngine: {
        path: PROOF_ENGINE_RELATIVE,
        sha256: proofEngineRecord.sha256,
      },
      independentProofEngine: {
        path: INDEPENDENT_PROOF_ENGINE_RELATIVE,
        sha256: independentProofEngineRecord.sha256,
      },
    },
    releaseBinding: {
      catalog: {
        path: RELEASE_CATALOG_RELATIVE,
        bytes: catalogRecord.byteLength,
        sha256: catalogRecord.sha256,
      },
      releaseFingerprintSha256: contract.releaseFingerprintSha256,
      orderedMemberIdentitySha256: contract.orderedMemberIdentitySha256,
      titleDisplay: release.titleDisplay,
      grade: release.grade,
      lesson: release.lesson,
      memberCount: release.members.length,
    },
    proofPolicy: {
      acceptedDisposition: "composite-child-with-parent",
      acceptedProofType: "single-frame-scriptless-structural-child",
      claimScope: "independent-local-playhead-only",
      exactRequirements: [
        "root-reachable source timeline with exactly one declared and observed ShowFrame",
        "no swfmill DoAction or DoInitAction and no attributed FFDec frame script",
        "at least one resolved incoming placement and no unresolved outgoing object identity",
        "no incoming or outgoing placement clipActions",
        "no already-declared independent frame domain",
        "exact release, source, scenario, structure, script, and pair-set hash bindings",
      ],
      multiFramePolicy:
        `The generic parent-clock proof engine is evaluated, but no L10 multi-frame timeline currently satisfies its exact declared-parent, lifetime, script, addressing, and control requirements. Of ${aggregate.totals.multiFrameChildren} source multi-frame timelines, ${aggregate.totals.sourceProvenIndependentRequiredChildren} are separately classified independent-required by the exact local-action proof below and ${aggregate.totals.multiFrameChildren - aggregate.totals.sourceProvenIndependentRequiredChildren} remain unresolved; the ${aggregate.totals.disqualifiedSingleFrameChildren} scripted one-frame timelines remain unresolved separately.`,
      independentRequiredPolicy:
        "A root-reachable undeclared multi-frame DefineSprite is classified independent-required only when its exact swfmill direct DoAction count equals the exact FFDec local sprite frame-script block count, all script frame coordinates lie inside the child domain, and at least one exported script body is nonempty. This stricter disposition creates a declaration/specification obligation and grants no runtime or acceptance result.",
      unresolvedPolicy:
        "Every scripted one-frame child and every multi-frame child without exact local DoAction-to-FFDec export parity remains unresolved with a source-bound blocker class and next evidence action. This pipeline never assigns nonvisual.",
    },
    summary: {
      ...aggregate.totals,
      postMaterialization: {
        declaredFrameDomains: contract.expected.declaredRoots,
        compositeChildren: contract.expected.postMaterializationComposites,
        independentRequired:
          contract.expected.postMaterializationIndependentRequired,
        unresolvedChildren: contract.expected.postMaterializationUnresolved,
        nonvisual: 0,
      },
    },
    exactPairSets: aggregate.pairSets,
    members: memberProofs.map(reportMember),
    acceptanceBoundary: {
      runtimeEvidenceEstablished: false,
      visualFidelityEstablished: false,
      behaviorEstablished: false,
      audioEstablished: false,
      fullFrameRmseEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      releasePublicationEstablished: false,
    },
    strictAcceptanceEffect: STRICT_EFFECT,
  };
}

function evidenceContractBinding(reportRecord, report, proof) {
  return {
    path: reportRecord.path,
    bytes: reportRecord.bytes,
    sha256: reportRecord.sha256,
    schemaVersion: report.schemaVersion,
    reportType: report.reportType,
    releaseId: report.releaseId,
    releaseFingerprintSha256:
      report.releaseBinding.releaseFingerprintSha256,
    orderedMemberIdentitySha256:
      report.releaseBinding.orderedMemberIdentitySha256,
    acceptedProofType: report.proofPolicy.acceptedProofType,
    acceptedPairSet: proof.acceptedSingleFramePairSet,
    humanReviewer: false,
    ownerAcceptance: false,
    strictAcceptanceEffect: "none",
  };
}

function buildMemberEvidence(projectRoot, reportRecord, report, proof) {
  if (!proof.acceptedSingleFrameTimelineIds.length) return null;
  const document = buildStaticCompositeEvidenceDocument({
    animationId: proof.animationId,
    manifest: proof.raw.manifest,
    inventory: proof.raw.inventory,
    inventorySha256: proof.raw.inventorySha256,
    sourceSwfBytes: proof.raw.sourceSwfBytes,
    swfmillGzip: proof.raw.swfmillGzip,
    scriptsGzip: proof.raw.scriptsGzip,
    claimSpecs: [],
    singleFrameClaimSpec: {
      proofType: "single-frame-scriptless-structural-child",
      expectedTimelineCount: proof.acceptedSingleFrameTimelineIds.length,
      timelineIds: [...proof.acceptedSingleFrameTimelineIds],
    },
    multiFrameClaimSpec: null,
    multiFrameExclusionIds: [
      ...proof.raw.undeclaredMultiFrameTimelineIds,
    ],
  });
  document.authorityStatement.push(
    "The exact accepted L10 member/timeline set is additionally bound to a deterministic release-wide source-proof contract whose pair-set digest is pinned in the materializer. This engineering proof is not a human or owner review and establishes no runtime or fidelity result.",
  );
  document.generatedFrom.sourceProvenReleaseContract =
    evidenceContractBinding(reportRecord, report, proof);
  document.proofBoundary = {
    classificationScope: "independent-local-playhead-only",
    runtimeReachabilityEstablished: false,
    behaviorEstablished: false,
    visualFidelityEstablished: false,
    audioEstablished: false,
    strictAcceptanceEffect: "none",
  };
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const relativePath =
    `migrations/${proof.animationId}/${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}`;
  return {
    animationId: proof.animationId,
    outputPath: resolveProjectPath(projectRoot, relativePath),
    relativePath,
    rendered,
    document,
    sha256: sha256(rendered),
  };
}

function wave2GeneratedFrom(proof) {
  return {
    sourceSwf: {...proof.bindings.sourceSwf},
    scenarioInventory: {...proof.bindings.scenarioInventory},
    migrationTechnicalProjection: {
      ...proof.bindings.migrationTechnicalProjection,
    },
    swfmillStructure: {...proof.bindings.swfmillStructure},
    ffdecScripts: {...proof.bindings.ffdecScripts},
  };
}

function aggregateWave2BlockerClasses(memberProofs) {
  const grouped = new Map();
  for (const proof of memberProofs) {
    for (const item of proof.independentRequired.rejected) {
      if (!grouped.has(item.blockerClass)) {
        grouped.set(item.blockerClass, {
          blockerClass: item.blockerClass,
          count: 0,
          nextEvidenceAction: item.nextEvidenceAction,
          pairs: [],
        });
      }
      const group = grouped.get(item.blockerClass);
      invariant(
        group.nextEvidenceAction === item.nextEvidenceAction,
        `${item.blockerClass}: next-evidence action drifted across members`,
      );
      group.count += 1;
      group.pairs.push({
        animationId: proof.animationId,
        timelineId: item.timelineId,
      });
    }
  }
  return [...grouped.values()]
    .sort((left, right) => compareText(left.blockerClass, right.blockerClass))
    .map((group) => ({
      ...group,
      exactPairSet: canonicalIndependentPairSet(group.pairs),
    }));
}

function buildWave2Report({
  contract,
  release,
  catalogRecord,
  memberProofs,
  aggregate,
  scriptRecord,
  independentProofEngineRecord,
}) {
  const blockerClasses = aggregateWave2BlockerClasses(memberProofs);
  const report = {
    schemaVersion: 1,
    reportType:
      "lesson-release-source-proven-independent-frame-domain-contract",
    releaseId: contract.releaseId,
    generatedBy: {
      script: SCRIPT_RELATIVE,
      sha256: scriptRecord.sha256,
      deterministic: true,
      proofEngine: {
        path: INDEPENDENT_PROOF_ENGINE_RELATIVE,
        sha256: independentProofEngineRecord.sha256,
      },
    },
    releaseBinding: {
      catalog: {
        path: RELEASE_CATALOG_RELATIVE,
        bytes: catalogRecord.byteLength,
        sha256: catalogRecord.sha256,
      },
      releaseFingerprintSha256: contract.releaseFingerprintSha256,
      orderedMemberIdentitySha256: contract.orderedMemberIdentitySha256,
      titleDisplay: release.titleDisplay,
      grade: release.grade,
      lesson: release.lesson,
      memberCount: release.members.length,
    },
    proofPolicy: {
      disposition: "independent-required",
      proofType: SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
      claimScope: "separate-local-frame-action-domain-required",
      exactRequirements: [
        "root-reachable undeclared source DefineSprite with more than one declared and observed ShowFrame",
        "one-for-one direct swfmill DoAction and FFDec local sprite frame-script export count",
        "every FFDec script block is bound by body SHA-256 and has a one-indexed frame inside the child domain",
        "at least one local frame-script body is nonempty",
        "exact release, source SWF, scenario inventory, migration technical projection, swfmill, FFDec, and accepted/rejected pair-set bindings",
      ],
      effect:
        "The result creates a missing frame-domain declaration/specification obligation. It does not prove that a source path is naturally reached or that any behavior, visual, audio, comparison, review, acceptance, completion, or release gate passes.",
    },
    summary: {
      remainingBefore: aggregate.totals.disqualifiedSingleFrameChildren
        + aggregate.totals.multiFrameChildren,
      independentRequired:
        aggregate.totals.sourceProvenIndependentRequiredChildren,
      unresolvedAfter: aggregate.totals.wave2UnresolvedChildren,
      membersWithIndependentRequired:
        aggregate.totals.membersWithIndependentRequiredClaims,
      membersWithRemainingUnresolved: memberProofs.filter(
        ({independentRequired}) => independentRequired.rejected.length > 0,
      ).length,
      blockerClasses,
    },
    exactPairSets: {
      accepted: aggregate.pairSets.sourceProvenIndependentRequired,
      rejected: aggregate.pairSets.wave2Rejected,
    },
    members: memberProofs.map((proof) => ({
      animationId: proof.animationId,
      ordinal: proof.ordinal,
      assetId: proof.assetId,
      generatedFrom: wave2GeneratedFrom(proof),
      summary: {
        remainingBefore: proof.independentRequired.remainingTimelineIds.length,
        independentRequired: proof.independentRequired.accepted.length,
        unresolvedAfter: proof.independentRequired.rejected.length,
      },
      claims: proof.independentRequired.accepted,
      rejected: proof.independentRequired.rejected,
    })),
    acceptanceBoundary: {
      authoritativeRuntimeEstablished: false,
      behaviorEstablished: false,
      visualFidelityEstablished: false,
      audioEstablished: false,
      fullFrameRmseEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      releasePublicationEstablished: false,
    },
    strictAcceptanceEffect:
      "none; source-proven independent-required only adds undeclared child-domain obligations and grants no acceptance",
  };
  invariant(
    report.summary.remainingBefore
      === report.summary.independentRequired + report.summary.unresolvedAfter,
    `${contract.releaseId}: wave-2 release partition is incomplete`,
  );
  return report;
}

function buildMemberIndependentEvidence({
  projectRoot,
  wave2ReportRecord,
  wave2Report,
  proof,
  independentProofEngineRecord,
}) {
  const generatedFrom = wave2GeneratedFrom(proof);
  const acceptedPairSet = canonicalIndependentPairSet(
    proof.independentRequired.accepted.map(({timelineId}) => ({
      animationId: proof.animationId,
      timelineId,
    })),
  );
  const rejectedPairSet = canonicalIndependentPairSet(
    proof.independentRequired.rejected.map(({timelineId}) => ({
      animationId: proof.animationId,
      timelineId,
    })),
  );
  const document = {
    schemaVersion: 1,
    evidenceType: "source-proven-independent-frame-domain-evidence",
    status: "verified-source-obligation",
    animationId: proof.animationId,
    migrationStatusChanged: false,
    generatedBy: {
      script: SCRIPT_RELATIVE,
      proofEngine: {
        path: INDEPENDENT_PROOF_ENGINE_RELATIVE,
        sha256: independentProofEngineRecord.sha256,
      },
    },
    generatedFrom: {
      ...generatedFrom,
      sourceProvenReleaseContract: {
        path: wave2ReportRecord.path,
        bytes: wave2ReportRecord.bytes,
        sha256: wave2ReportRecord.sha256,
        schemaVersion: wave2Report.schemaVersion,
        reportType: wave2Report.reportType,
        releaseId: wave2Report.releaseId,
        releaseFingerprintSha256:
          wave2Report.releaseBinding.releaseFingerprintSha256,
        orderedMemberIdentitySha256:
          wave2Report.releaseBinding.orderedMemberIdentitySha256,
      },
    },
    summary: {
      remainingBefore: proof.independentRequired.remainingTimelineIds.length,
      independentRequired: proof.independentRequired.accepted.length,
      unresolvedAfter: proof.independentRequired.rejected.length,
    },
    exactPairSets: {
      accepted: acceptedPairSet,
      rejected: rejectedPairSet,
    },
    claims: proof.independentRequired.accepted,
    rejected: proof.independentRequired.rejected,
    acceptanceEffects: {
      authoritativeRuntimeAccepted: false,
      behaviorAccepted: false,
      visualAccepted: false,
      audioAccepted: false,
      fullFrameRmseAccepted: false,
      humanReviewAccepted: false,
      ownerAcceptanceAccepted: false,
      strictCompletionAccepted: false,
      publicationAccepted: false,
    },
    strictAcceptanceEffect:
      "none; source-proven independent-required only adds an undeclared child-domain obligation and preserves every runtime, behavior, visual, audio, comparison, review, acceptance, completion, and release gate",
  };
  validateSourceProvenIndependentEvidenceDocument(document, {
    animationId: proof.animationId,
    ...generatedFrom,
  });
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const relativePath =
    `migrations/${proof.animationId}/${SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH}`;
  return {
    animationId: proof.animationId,
    outputPath: resolveProjectPath(projectRoot, relativePath),
    relativePath,
    rendered,
    document,
    sha256: sha256(rendered),
  };
}

async function buildSourceProofState(projectRoot, contract) {
  const [
    catalogRecord,
    scriptRecord,
    proofEngineRecord,
    independentProofEngineRecord,
  ] = await Promise.all([
    readJsonRecord(projectRoot, RELEASE_CATALOG_RELATIVE),
    readProjectFile(projectRoot, SCRIPT_RELATIVE),
    readProjectFile(projectRoot, PROOF_ENGINE_RELATIVE),
    readProjectFile(projectRoot, INDEPENDENT_PROOF_ENGINE_RELATIVE),
  ]);
  invariant(
    catalogRecord.sha256 === contract.releaseCatalogSha256,
    `${contract.releaseId}: lesson-release catalog SHA-256 drifted`,
  );
  const releases = (catalogRecord.document.releases || []).filter(
    ({releaseId}) => releaseId === contract.releaseId,
  );
  invariant(
    releases.length === 1,
    `${contract.releaseId}: exact release is not unique`,
  );
  const [release] = releases;
  validateRelease(release, contract);
  const memberProofs = [];
  for (const member of release.members) {
    memberProofs.push(await buildMemberProof(
      projectRoot,
      member,
      catalogRecord,
      contract,
    ));
  }
  const aggregate = aggregateProof(memberProofs);
  assertExactSourceProofCensus(
    aggregate,
    contract.expected,
    contract.releaseId,
  );
  const report = buildReport({
    contract,
    catalogRecord,
    release,
    memberProofs,
    aggregate,
    scriptRecord,
    proofEngineRecord,
    independentProofEngineRecord,
  });
  invariant(
    String(report.strictAcceptanceEffect).startsWith("none;"),
    `${contract.releaseId}: report crossed the acceptance boundary`,
  );
  const reportRendered = `${JSON.stringify(report, null, 2)}\n`;
  const reportRecord = {
    path: contract.reportPath,
    bytes: Buffer.byteLength(reportRendered),
    sha256: sha256(reportRendered),
    rendered: reportRendered,
    outputPath: resolveProjectPath(projectRoot, contract.reportPath),
  };
  const wave2Report = buildWave2Report({
    contract,
    release,
    catalogRecord,
    memberProofs,
    aggregate,
    scriptRecord,
    independentProofEngineRecord,
  });
  const wave2ReportRendered = `${JSON.stringify(wave2Report, null, 2)}\n`;
  const wave2ReportRecord = {
    path: G4_L10_WAVE2_REPORT_RELATIVE,
    bytes: Buffer.byteLength(wave2ReportRendered),
    sha256: sha256(wave2ReportRendered),
    rendered: wave2ReportRendered,
    outputPath: resolveProjectPath(
      projectRoot,
      G4_L10_WAVE2_REPORT_RELATIVE,
    ),
  };
  const evidence = new Map();
  for (const proof of memberProofs) {
    const built = buildMemberEvidence(
      projectRoot,
      reportRecord,
      report,
      proof,
    );
    if (built) evidence.set(proof.animationId, built);
  }
  invariant(
    evidence.size === contract.expected.membersWithAcceptedClaims,
    `${contract.releaseId}: evidence-bearing member count drifted`,
  );
  const independentEvidence = new Map();
  for (const proof of memberProofs) {
    const built = buildMemberIndependentEvidence({
      projectRoot,
      wave2ReportRecord,
      wave2Report,
      proof,
      independentProofEngineRecord,
    });
    independentEvidence.set(proof.animationId, built);
  }
  invariant(
    independentEvidence.size === contract.expected.members,
    `${contract.releaseId}: wave-2 evidence member count drifted`,
  );
  return {
    aggregate,
    catalogRecord,
    contract,
    evidence,
    independentEvidence,
    memberProofs,
    release,
    report,
    reportRecord,
    wave2Report,
    wave2ReportRecord,
  };
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function assertOrdinaryOutput(candidate, label) {
  if (!(await pathExists(candidate))) return;
  const information = await lstat(candidate, {bigint: true});
  invariant(
    information.isFile()
      && !information.isSymbolicLink()
      && information.nlink === 1n,
    `${label}: existing output must be an ordinary single-link file`,
  );
}

async function writeAtomic(projectRoot, outputPath, rendered, label) {
  invariant(isWithin(projectRoot, outputPath), `${label}: output escapes project root`);
  await mkdir(path.dirname(outputPath), {recursive: true});
  const realRoot = await realpath(projectRoot);
  const realParent = await realpath(path.dirname(outputPath));
  invariant(isWithin(realRoot, realParent), `${label}: output parent escapes project root`);
  await assertOrdinaryOutput(outputPath, label);
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`,
  );
  try {
    await writeFile(temporaryPath, rendered, {encoding: "utf8", flag: "wx"});
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function verifyExactOutput(outputPath, rendered, label) {
  await assertOrdinaryOutput(outputPath, label);
  invariant(await pathExists(outputPath), `${label}: output is missing`);
  invariant(
    await readFile(outputPath, "utf8") === rendered,
    `${label}: output is stale`,
  );
}

async function persistSourceProofState(projectRoot, state) {
  await writeAtomic(
    projectRoot,
    state.reportRecord.outputPath,
    state.reportRecord.rendered,
    state.reportRecord.path,
  );
  for (const built of state.evidence.values()) {
    await writeAtomic(
      projectRoot,
      built.outputPath,
      built.rendered,
      built.relativePath,
    );
  }
  await writeAtomic(
    projectRoot,
    state.wave2ReportRecord.outputPath,
    state.wave2ReportRecord.rendered,
    state.wave2ReportRecord.path,
  );
  for (const built of state.independentEvidence.values()) {
    await writeAtomic(
      projectRoot,
      built.outputPath,
      built.rendered,
      built.relativePath,
    );
  }
}

async function verifySourceProofState(projectRoot, state) {
  await verifyExactOutput(
    state.reportRecord.outputPath,
    state.reportRecord.rendered,
    state.reportRecord.path,
  );
  for (const proof of state.memberProofs) {
    const built = state.evidence.get(proof.animationId);
    const conventionalPath = resolveProjectPath(
      projectRoot,
      `migrations/${proof.animationId}/${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}`,
    );
    if (!built) {
      invariant(
        !(await pathExists(conventionalPath)),
        `${proof.animationId}: unexpected unowned static disposition evidence exists`,
      );
      continue;
    }
    await verifyExactOutput(
      built.outputPath,
      built.rendered,
      built.relativePath,
    );
  }
  await verifyExactOutput(
    state.wave2ReportRecord.outputPath,
    state.wave2ReportRecord.rendered,
    state.wave2ReportRecord.path,
  );
  for (const built of state.independentEvidence.values()) {
    await verifyExactOutput(
      built.outputPath,
      built.rendered,
      built.relativePath,
    );
  }
}

function dispositionTotals(results) {
  return results.reduce((totals, {report}) => {
    totals.declaredRoots +=
      report.summary.dispositionCounts["declared-frame-domain"];
    totals.composites +=
      report.summary.dispositionCounts["composite-child-with-parent"];
    totals.independentRequired +=
      report.summary.dispositionCounts["independent-required"];
    totals.nonvisual += report.summary.dispositionCounts.nonvisual;
    totals.unresolved += report.summary.dispositionCounts.unresolved;
    totals.excludedNotProven +=
      report.summary.excludedNotProvenTimelineCount;
    return totals;
  }, {
    declaredRoots: 0,
    composites: 0,
    independentRequired: 0,
    nonvisual: 0,
    unresolved: 0,
    excludedNotProven: 0,
  });
}

function assertDispositionTotals(totals, contract) {
  invariant(
    totals.declaredRoots === contract.expected.declaredRoots
      && totals.composites
        === contract.expected.postMaterializationComposites
      && totals.unresolved
        === contract.expected.postMaterializationUnresolved
      && totals.excludedNotProven
        === contract.expected.excludedNotProvenDefinitions
      && totals.independentRequired
        === contract.expected.postMaterializationIndependentRequired
      && totals.nonvisual === 0,
    `${contract.releaseId}: materialized disposition totals drifted`,
  );
}

export async function materializeLessonReleaseSourceProvenFrameDomainDispositions({
  releaseId = G4_L10_RELEASE_ID,
  mode = "dry-run",
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  transactionHooks = {},
} = {}) {
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    `unsupported mode: ${mode}`,
  );
  const contract = SOURCE_PROVEN_RELEASE_CONTRACTS[releaseId];
  invariant(contract, `no source-proven frame-domain contract for ${releaseId}`);
  const projectRoot = path.resolve(projectRootOption);
  const successorReportPath = resolveProjectPath(
    projectRoot,
    "reports/g4-l10-independent-frame-domain-declarations.json",
  );
  if (releaseId === G4_L10_RELEASE_ID && await pathExists(successorReportPath)) {
    const {
      materializeG4L10IndependentFrameDomainDeclarations,
    } = await import(
      "./materialize-g4-l10-independent-frame-domain-declarations.mjs"
    );
    const successor =
      await materializeG4L10IndependentFrameDomainDeclarations({
        mode,
        projectRoot,
        transactionHooks,
      });
    return {
      action: successor.action,
      releaseId,
      report: successor.report,
      reportRecord: successor.reportRecord,
      wave2Report: successor.report,
      wave2ReportRecord: successor.reportRecord,
      evidenceCount: successor.report.summary.affectedMembers,
      results: [],
      totals: {
        declaredRoots:
          successor.report.summary.afterDispositionTotals.declared,
        composites:
          successor.report.summary.afterDispositionTotals.composite,
        independentRequired:
          successor.report.summary.afterDispositionTotals.independentRequired,
        nonvisual:
          successor.report.summary.afterDispositionTotals.nonvisual,
        unresolved:
          successor.report.summary.afterDispositionTotals.unresolved,
        excludedNotProven:
          successor.report.summary.afterDispositionTotals.excludedNotProven,
      },
    };
  }
  const state = await buildSourceProofState(projectRoot, contract);
  if (mode === "dry-run") {
    return {
      action: "planned",
      releaseId,
      report: state.report,
      reportRecord: state.reportRecord,
      wave2Report: state.wave2Report,
      wave2ReportRecord: state.wave2ReportRecord,
      evidenceCount: state.evidence.size,
      totals: {
        declaredRoots: contract.expected.declaredRoots,
        composites: contract.expected.postMaterializationComposites,
        independentRequired:
          contract.expected.postMaterializationIndependentRequired,
        nonvisual: 0,
        unresolved: contract.expected.postMaterializationUnresolved,
        excludedNotProven: contract.expected.excludedNotProvenDefinitions,
      },
    };
  }
  if (mode === "apply") await persistSourceProofState(projectRoot, state);
  await verifySourceProofState(projectRoot, state);

  const results = await buildFrameDomainDispositions({
    releaseId,
    lessonReleasePath: resolveProjectPath(
      projectRoot,
      RELEASE_CATALOG_RELATIVE,
    ),
    migrationsRoot: path.join(projectRoot, "migrations"),
    sourceRoot: projectRoot,
    allowFullReleaseSelection: true,
    expectedReleaseFingerprintSha256:
      contract.releaseFingerprintSha256,
    expectedOrderedMemberIdentitySha256:
      contract.orderedMemberIdentitySha256,
    check: mode === "check",
    transactionHooks,
    staticEvidenceResolver: async (animationId) => {
      const built = state.evidence.get(animationId) || null;
      if (!built) return null;
      await verifyExactOutput(
        built.outputPath,
        built.rendered,
        built.relativePath,
      );
      return built;
    },
    independentDispositionEvidenceResolver: async (animationId) => {
      const built = state.independentEvidence.get(animationId) || null;
      invariant(built, `${animationId}: wave-2 independent evidence is missing`);
      await verifyExactOutput(
        built.outputPath,
        built.rendered,
        built.relativePath,
      );
      return built;
    },
  });
  invariant(
    results.length === contract.expected.members,
    `${releaseId}: disposition result member count drifted`,
  );
  const totals = dispositionTotals(results);
  assertDispositionTotals(totals, contract);
  invariant(
    results.every(({report}) => (
      report.migrationStatusChanged === false
      && String(report.strictAcceptanceEffect || "").startsWith("none;")
      && report.generatedFrom.lessonReleaseCatalog
        ?.releaseFingerprintSha256
        === contract.releaseFingerprintSha256
      && report.generatedFrom.lessonReleaseCatalog
        ?.orderedMemberIdentitySha256
        === contract.orderedMemberIdentitySha256
    )),
    `${releaseId}: disposition output crossed its release or acceptance boundary`,
  );
  return {
    action: mode === "check" ? "verified" : "written",
    releaseId,
    report: state.report,
    reportRecord: state.reportRecord,
    wave2Report: state.wave2Report,
    wave2ReportRecord: state.wave2ReportRecord,
    evidenceCount: state.evidence.size,
    results,
    totals,
  };
}

export function parseArguments(argv) {
  const options = {
    help: false,
    mode: "",
    releaseId: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(!options.mode, "choose exactly one execution mode");
      options.mode = argument.slice(2);
    } else if (argument === "--release-id") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--release-id requires a value",
      );
      invariant(!options.releaseId, "--release-id must not be repeated");
      options.releaseId = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.releaseId, "--release-id is required");
    invariant(options.mode, "choose exactly one execution mode");
  } else {
    invariant(!options.mode && !options.releaseId, "--help must be used alone");
  }
  return options;
}

function usage() {
  return `Usage: node ${SCRIPT_RELATIVE} --release-id <release-id> --dry-run|--apply|--check

Rebuilds a release-wide exact source-proof contract, materializes only
single-frame scriptless independent-local-playhead composite evidence, and
then atomically rebuilds frame-domain-disposition.json. Multi-frame timelines
are evaluated by the strict parent-clock proof engine but remain unresolved
unless a separately pinned contract admits them. The command never changes
migration manifests, renderers, reviews, acceptance, ledgers, or publication.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result =
    await materializeLessonReleaseSourceProvenFrameDomainDispositions({
      releaseId: options.releaseId,
      mode: options.mode,
    });
  process.stdout.write(`${JSON.stringify({
    action: result.action,
    releaseId: result.releaseId,
    report: {
      path: result.reportRecord.path,
      bytes: result.reportRecord.bytes,
      sha256: result.reportRecord.sha256,
    },
    independentRequiredReport: {
      path: result.wave2ReportRecord.path,
      bytes: result.wave2ReportRecord.bytes,
      sha256: result.wave2ReportRecord.sha256,
    },
    evidenceMembers: result.evidenceCount,
    sourceProof: result.report.summary,
    dispositions: result.totals,
    acceptanceEffect: "none",
  }, null, 2)}\n`);
}

if (
  process.argv[1]
  && path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
