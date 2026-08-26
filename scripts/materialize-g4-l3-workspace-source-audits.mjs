#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {isDeepStrictEqual} from "node:util";
import {fileURLToPath} from "node:url";
import {inflateSync} from "node:zlib";

import {
  parseSwfSourceFacts,
  validateG4L3MachineSourceAudits,
} from "./build-g4-l3-machine-source-audits.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const MATERIALIZER_VERSION = 2;
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const QUEUE_ID = "release-g04-l03-negative-numbers";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const ARTIFACT_RELATIVE = "audit/machine/g4-l3-source-audit.json";
const OWNED_SOURCE = "g4-l3-static-machine-source-audit";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const IN009_ID = "course-g04-l03-in-009";
const IN009_TECHNICAL_MANIFEST_SHA256 = "cc2f892649a52ef43d1423842b040924fcea2c4dacb32eea099bdac1f8a612a3";

const FILTER_NAMES = Object.freeze({
  0: "DropShadowFilter",
  1: "BlurFilter",
  2: "GlowFilter",
  3: "BevelFilter",
  4: "GradientGlowFilter",
  5: "ConvolutionFilter",
  6: "ColorMatrixFilter",
  7: "GradientBevelFilter",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function projectPath(filePath, root = projectRoot) {
  return portable(path.relative(root, filePath));
}

async function readJsonBinding(filePath, root) {
  const bytes = await readFile(filePath);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${projectPath(filePath, root)}: invalid JSON (${error.message})`);
  }
  return {
    value,
    bytes,
    binding: {
      path: projectPath(filePath, root),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

function validateReleaseManifest(manifest) {
  invariant(manifest?.schemaVersion === 1 && Array.isArray(manifest.releases),
    "catalog/lesson-releases.json schema mismatch");
  const matches = manifest.releases
    .map((release, index) => ({release, index}))
    .filter(({release}) => release.releaseId === RELEASE_ID);
  invariant(matches.length === 1, `${RELEASE_ID}: expected exactly one release declaration`);
  const {release, index: releaseIndex} = matches[0];
  invariant(release.queueId === QUEUE_ID && release.releaseType === "complete-lesson" &&
    release.publicationMode === "atomic" && release.grade === 4 && release.lesson === 3,
  `${RELEASE_ID}: invalid identity or atomic-publication contract`);
  invariant(release.expectedCounts?.activeXmlReferencedPages === 39 &&
    release.expectedCounts.courseShells === 1 && release.expectedCounts.members === 40 &&
    release.expectedCounts.shards === 2, `${RELEASE_ID}: expected 39 pages plus one shell in two shards`);
  invariant(Array.isArray(release.members) && release.members.length === 40,
    `${RELEASE_ID}: expected exactly 40 members`);
  invariant(new Set(release.members.map((member) => member.animationId)).size === 40,
    `${RELEASE_ID}: animation IDs must be unique`);
  invariant(new Set(release.members.map((member) => member.assetId)).size === 40,
    `${RELEASE_ID}: asset IDs must be unique`);
  for (const [index, member] of release.members.entries()) {
    invariant(member.ordinal === index + 1, `${member.animationId || `member ${index + 1}`}: release ordinal is not contiguous`);
    invariant(typeof member.animationId === "string" && member.animationId &&
      member.assetId === `swf-${member.source?.sha256}` && SHA256_PATTERN.test(member.source?.sha256 || ""),
    `${member.animationId || `member ${index + 1}`}: invalid release identity/source hash`);
    invariant(member.releaseRole === (index === 39 ? "course-shell" : "active-xml-referenced-page"),
      `${member.animationId}: unexpected release role at ordinal ${member.ordinal}`);
    invariant(["batch-001", "batch-002"].includes(member.batchId) &&
      ["shard-01", "shard-02"].includes(member.shardId), `${member.animationId}: invalid batch/shard`);
  }
  return {release, releaseIndex};
}

function validateReportAgainstRelease(report, release) {
  invariant(report.lesson?.releaseId === RELEASE_ID && report.lesson.queueId === QUEUE_ID,
    "G4 L3 machine report release identity mismatch");
  invariant(report.items.length === release.members.length,
    "G4 L3 machine report/release member counts differ");
  for (const [index, member] of release.members.entries()) {
    const item = report.items[index];
    invariant(item.sequence === member.ordinal, `${member.animationId}: machine report sequence mismatch`);
    invariant(item.animationId === member.animationId, `${member.animationId}: machine report animationId mismatch`);
    invariant(item.assetId === member.assetId, `${member.animationId}: machine report assetId mismatch`);
    invariant(item.releaseRole === member.releaseRole, `${member.animationId}: machine report release role mismatch`);
    invariant(item.batch?.batchId === member.batchId, `${member.animationId}: machine report batch mismatch`);
    invariant(item.source?.swf?.path === `${SOURCE_PREFIX}/${member.source.path}`,
      `${member.animationId}: machine report/release SWF path mismatch`);
    invariant(item.source.swf.sha256 === member.source.sha256 && item.source.swf.physicalHashVerified === true,
      `${member.animationId}: machine report/release SWF hash mismatch`);
    invariant(item.auditFingerprintSha256 && SHA256_PATTERN.test(item.auditFingerprintSha256),
      `${member.animationId}: machine item fingerprint is invalid`);
  }
}

function decompressSwf(sourceBytes) {
  invariant(sourceBytes.length >= 12, "SWF is too short");
  const signature = sourceBytes.subarray(0, 3).toString("ascii");
  if (signature === "FWS") return Buffer.from(sourceBytes);
  if (signature === "CWS") {
    const bytes = Buffer.concat([
      Buffer.from("FWS"),
      sourceBytes.subarray(3, 8),
      inflateSync(sourceBytes.subarray(8)),
    ]);
    bytes.writeUInt32LE(bytes.length, 4);
    return bytes;
  }
  throw new Error(`Unsupported SWF signature ${signature}; ZWS is fail-closed`);
}

function readUnsignedBits(bytes, bitOffset, width) {
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const absolute = bitOffset + index;
    invariant(Math.floor(absolute / 8) < bytes.length, "Truncated SWF bit field");
    value = value * 2 + ((bytes[Math.floor(absolute / 8)] >> (7 - (absolute % 8))) & 1);
  }
  return value;
}

function rectByteLength(bytes, offset) {
  const width = readUnsignedBits(bytes, offset * 8, 5);
  invariant(width >= 1, "Invalid SWF RECT bit width");
  return Math.ceil((5 + width * 4) / 8);
}

function matrixByteLength(bytes, offset, end) {
  let bit = offset * 8;
  const hasScale = readUnsignedBits(bytes, bit, 1);
  bit += 1;
  if (hasScale) {
    const width = readUnsignedBits(bytes, bit, 5);
    bit += 5 + width * 2;
  }
  const hasRotate = readUnsignedBits(bytes, bit, 1);
  bit += 1;
  if (hasRotate) {
    const width = readUnsignedBits(bytes, bit, 5);
    bit += 5 + width * 2;
  }
  const translateWidth = readUnsignedBits(bytes, bit, 5);
  bit += 5 + translateWidth * 2;
  const length = Math.ceil((bit - offset * 8) / 8);
  invariant(offset + length <= end, "Truncated SWF MATRIX");
  return length;
}

function colorTransformWithAlphaByteLength(bytes, offset, end) {
  let bit = offset * 8;
  const hasAdd = readUnsignedBits(bytes, bit, 1);
  const hasMult = readUnsignedBits(bytes, bit + 1, 1);
  const width = readUnsignedBits(bytes, bit + 2, 4);
  bit += 6;
  if (hasMult) bit += width * 4;
  if (hasAdd) bit += width * 4;
  const length = Math.ceil((bit - offset * 8) / 8);
  invariant(offset + length <= end, "Truncated SWF CXFORMWITHALPHA");
  return length;
}

function skipCString(bytes, offset, end) {
  let cursor = offset;
  while (cursor < end && bytes[cursor] !== 0) cursor += 1;
  invariant(cursor < end, "Unterminated SWF string");
  return cursor + 1;
}

function filterPayloadLength(bytes, offset, end, id) {
  let length;
  if (id === 0) length = 23;
  else if (id === 1) length = 9;
  else if (id === 2) length = 15;
  else if (id === 3) length = 27;
  else if (id === 4 || id === 7) {
    invariant(offset + 1 <= end, "Truncated gradient filter");
    length = 20 + bytes[offset] * 5;
  } else if (id === 5) {
    invariant(offset + 2 <= end, "Truncated convolution filter");
    length = 15 + bytes[offset] * bytes[offset + 1] * 4;
  } else if (id === 6) length = 80;
  else throw new Error(`Unsupported SWF filter ID ${id}`);
  invariant(offset + length <= end, `Truncated ${FILTER_NAMES[id] || `filter ${id}`}`);
  return length;
}

function parsePlacement(bytes, code, start, end) {
  if (code !== 26 && code !== 70) return null;
  const flags1 = bytes[start];
  const flags2 = code === 70 ? bytes[start + 1] : 0;
  const depthOffset = start + (code === 70 ? 2 : 1);
  invariant(depthOffset + 2 <= end, `Truncated PlaceObject${code === 70 ? 3 : 2}`);
  const depth = bytes.readUInt16LE(depthOffset);
  let cursor = depthOffset + 2;
  if (code === 70 && ((flags2 & 0x08) || ((flags2 & 0x10) && (flags1 & 0x02)))) {
    cursor = skipCString(bytes, cursor, end);
  }
  let characterId = null;
  if (flags1 & 0x02) {
    invariant(cursor + 2 <= end, "Truncated placement character ID");
    characterId = bytes.readUInt16LE(cursor);
    cursor += 2;
  }
  if (flags1 & 0x04) cursor += matrixByteLength(bytes, cursor, end);
  if (flags1 & 0x08) cursor += colorTransformWithAlphaByteLength(bytes, cursor, end);
  if (flags1 & 0x10) {
    invariant(cursor + 2 <= end, "Truncated placement ratio");
    cursor += 2;
  }
  if (flags1 & 0x20) cursor = skipCString(bytes, cursor, end);
  let clipDepth = null;
  if (flags1 & 0x40) {
    invariant(cursor + 2 <= end, "Truncated placement clip depth");
    clipDepth = bytes.readUInt16LE(cursor);
    cursor += 2;
  }
  const filters = [];
  if (code === 70 && (flags2 & 0x01)) {
    invariant(cursor + 1 <= end, "Truncated SWF FilterList");
    const count = bytes[cursor];
    cursor += 1;
    for (let index = 0; index < count; index += 1) {
      invariant(cursor + 1 <= end, "Truncated SWF filter ID");
      const id = bytes[cursor];
      cursor += 1;
      cursor += filterPayloadLength(bytes, cursor, end, id);
      filters.push({id, name: FILTER_NAMES[id] || `filter-${id}`});
    }
  }
  invariant(cursor <= end, "Placement fields exceed tag body");
  return {depth, characterId, clipDepth, filters};
}

export function extractStaticDisplayFacts(sourceBytes) {
  const bytes = decompressSwf(sourceBytes);
  invariant(bytes.readUInt32LE(4) === bytes.length, "SWF declared length does not match uncompressed bytes");
  const timelineOffset = 8 + rectByteLength(bytes, 8);
  invariant(timelineOffset + 4 <= bytes.length, "Truncated SWF timeline header");
  const backgrounds = [];
  const masks = [];
  const filters = [];
  const observedTagCounts = {SetBackgroundColor: 0, PlaceObject2: 0, PlaceObject3: 0};

  const parseRange = (start, end, domainId) => {
    let offset = start;
    let frame = 1;
    while (offset + 2 <= end) {
      const header = bytes.readUInt16LE(offset);
      offset += 2;
      const code = header >> 6;
      let length = header & 0x3f;
      if (length === 0x3f) {
        invariant(offset + 4 <= end, "Truncated long SWF tag length");
        length = bytes.readUInt32LE(offset);
        offset += 4;
      }
      const bodyStart = offset;
      const bodyEnd = bodyStart + length;
      invariant(bodyEnd <= end, `Truncated SWF tag ${code}`);
      if (code === 1) frame += 1;
      if (code === 9) {
        invariant(length === 3, "SetBackgroundColor must contain exactly three RGB bytes");
        observedTagCounts.SetBackgroundColor += 1;
        backgrounds.push({
          domainId,
          frame,
          color: `#${bytes.subarray(bodyStart, bodyEnd).toString("hex")}`,
        });
      }
      if (code === 26 || code === 70) {
        const tag = code === 26 ? "PlaceObject2" : "PlaceObject3";
        observedTagCounts[tag] += 1;
        const placement = parsePlacement(bytes, code, bodyStart, bodyEnd);
        if (placement.clipDepth !== null) {
          masks.push({
            tag,
            domainId,
            frame,
            depth: placement.depth,
            clipDepth: placement.clipDepth,
            characterId: placement.characterId,
          });
        }
        for (const filter of placement.filters) {
          filters.push({
            tag,
            domainId,
            frame,
            depth: placement.depth,
            characterId: placement.characterId,
            ...filter,
          });
        }
      }
      if (code === 39) {
        invariant(length >= 4, "Truncated DefineSprite");
        const spriteId = bytes.readUInt16LE(bodyStart);
        parseRange(bodyStart + 4, bodyEnd, `sprite-${spriteId}`);
      }
      offset = bodyEnd;
      if (code === 0) break;
    }
  };
  parseRange(timelineOffset + 4, bytes.length, "root");
  invariant(backgrounds.length >= 1, "No SetBackgroundColor tag is available for runtime.backgroundColor");
  invariant(new Set(backgrounds.map(({color}) => color)).size === 1,
    "Conflicting SetBackgroundColor values are not safe to synchronize");
  return {
    backgroundColor: backgrounds[0].color,
    backgrounds,
    masks,
    filters,
    observedTagCounts,
  };
}

async function verifyPhysicalFile({sourceRoot, archiveReal, descriptor, label}) {
  invariant(descriptor && typeof descriptor.path === "string" && descriptor.path.startsWith(`${SOURCE_PREFIX}/`) &&
    Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 && SHA256_PATTERN.test(descriptor.sha256 || ""),
  `${label}: invalid declared source binding`);
  const candidate = path.resolve(sourceRoot, ...descriptor.path.split("/"));
  const resolved = await realpath(candidate).catch((error) => {
    throw new Error(`${label}: cannot resolve physical source (${error.message})`);
  });
  invariant(resolved !== archiveReal && resolved.startsWith(`${archiveReal}${path.sep}`),
    `${label}: physical source resolves outside the frozen archive`);
  const information = await stat(resolved);
  invariant(information.isFile() && information.size === descriptor.bytes,
    `${label}: physical byte count differs (${information.size} != ${descriptor.bytes})`);
  const bytes = await readFile(resolved);
  invariant(sha256(bytes) === descriptor.sha256, `${label}: physical SHA-256 differs`);
  return bytes;
}

function machineEvidenceLimitations(item) {
  const sourceLimitation = item.source.fla
    ? "The paired FLA hash is verified, but Adobe Animate authoring inspection was not performed by this materializer."
    : "No paired FLA exists; authoring structure cannot be recovered from this SWF-only machine artifact.";
  return [
    sourceLimitation,
    "Static SWF and ActionScript extraction does not establish runtime reachability, interaction behavior, frame-domain disposition, or Replay behavior.",
    "Background, clip-depth masks, morph definitions, filter placements, imports, and API matches are static source facts or candidates; they are not rendered-output or parity evidence.",
    "No authoritative original-runtime baseline, deterministic capture, RMSE comparison, bilingual audio cue/listening acceptance, browser QA, human review, or owner acceptance is created.",
    "This artifact has no effect on migration status, completion-ledger admission, lesson publication, or strict acceptance.",
  ];
}

function buildCandidateSummaries(item, displayFacts) {
  const evidenceBase = `${ARTIFACT_RELATIVE}#/machineFindings/auditCandidates`;
  const masks = displayFacts.masks.map((candidate, index) => ({
    source: OWNED_SOURCE,
    kind: "clip-depth-mask-candidate",
    status: "static-source-candidate-runtime-disposition-unresolved",
    ...candidate,
    evidence: `${evidenceBase}/masks/items/${index}`,
  }));
  const morphs = ["DefineMorphShape", "DefineMorphShape2"]
    .map((tag) => ({tag, count: item.swf.tagCounts[tag] || 0}))
    .filter(({count}) => count > 0)
    .map((candidate, index) => ({
      source: OWNED_SOURCE,
      kind: "morph-definition-candidate",
      status: "static-definition-runtime-use-unresolved",
      ...candidate,
      evidence: `${evidenceBase}/morphs/items/${index}`,
    }));
  const filters = displayFacts.filters.map((candidate, index) => ({
    source: OWNED_SOURCE,
    kind: "filter-placement-candidate",
    status: "static-placement-runtime-use-unresolved",
    ...candidate,
    evidence: `${evidenceBase}/filters/items/${index}`,
  }));
  const networkCalls = [
    ...item.externalDependencies.actionScriptApiCandidates.map((candidate) => ({
      source: OWNED_SOURCE,
      kind: "actionscript-api-candidate",
      status: "candidate-not-executed",
      ...candidate,
    })),
    ...item.externalDependencies.swfImportTags.flatMap((importTag) => importTag.assets.map((asset) => ({
      source: OWNED_SOURCE,
      kind: "swf-import-candidate",
      status: "candidate-not-loaded",
      api: importTag.tag,
      url: importTag.url,
      characterId: asset.characterId,
      symbolName: asset.name,
    }))),
  ].map((candidate, index) => ({
    ...candidate,
    evidence: `${evidenceBase}/networkCalls/items/${index}`,
  }));
  return {
    masks: {
      method: "Physical SWF PlaceObject2/PlaceObject3 HasClipDepth field parse across root and DefineSprite timelines.",
      candidateOnly: true,
      items: masks,
    },
    morphs: {
      method: "Hash-bound upstream SWF definition-tag counts.",
      candidateOnly: true,
      items: morphs,
    },
    filters: {
      method: "Physical SWF PlaceObject3 HasFilterList field parse across root and DefineSprite timelines.",
      candidateOnly: true,
      placeObject3TagCount: item.swf.tagCounts.PlaceObject3 || 0,
      items: filters,
    },
    networkCalls: {
      method: "Hash-bound FFDec ActionScript pattern matches plus SWF ImportAssets/ImportAssets2 tags; no candidate was executed.",
      candidateOnly: true,
      legacyEndpointInvocationsDuringAudit: 0,
      items: networkCalls,
    },
  };
}

function buildArtifact({
  member,
  item,
  index,
  release,
  releaseIndex,
  report,
  reportBinding,
  releaseBinding,
  materializerBinding,
  displayFacts,
}) {
  const candidates = buildCandidateSummaries(item, displayFacts);
  const limitations = machineEvidenceLimitations(item);
  const artifact = {
    schemaVersion: 1,
    artifactType: "g4-l3-workspace-source-audit",
    identity: {
      releaseId: release.releaseId,
      queueId: release.queueId,
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    acceptance: {
      acceptanceNeutral: true,
      migrationStatusChanges: 0,
      reviewOrApprovalChanges: 0,
      completionLedgerChanges: 0,
      lessonPublicationChanges: 0,
      originalRuntimeSessions: 0,
      animateDocumentsOpened: 0,
      acceptanceEffect: "none",
      migrationManifestBindings: 0,
      statement: "Artifact-only static machine evidence; this artifact does not mutate or bind migration.json and does not prove fidelity, parity, acceptance, or completion.",
    },
    provenance: {
      materializer: materializerBinding,
      upstreamMachineAudit: {
        ...reportBinding,
        schemaVersion: report.schemaVersion,
        auditSetSha256: report.summary.auditSetSha256,
        itemJsonPointer: `/items/${index}`,
        itemFingerprintSha256: item.auditFingerprintSha256,
      },
      lessonReleaseManifest: {
        ...releaseBinding,
        schemaVersion: 1,
        releaseJsonPointer: `/releases/${releaseIndex}`,
        memberJsonPointer: `/releases/${releaseIndex}/members/${index}`,
      },
      source: structuredClone(item.source),
    },
    machineFindings: {
      runtime: {
        swfSignature: item.swf.header.signature,
        swfVersion: item.swf.header.version,
        declaredFileLength: item.swf.header.declaredUncompressedBytes,
        stage: {
          width: item.swf.header.stage.width,
          height: item.swf.header.stage.height,
        },
        fps: item.swf.header.fps,
        rootFrameCount: item.swf.header.rootFrameCount,
        durationMs: item.swf.header.rootFrameCount / item.swf.header.fps * 1000,
        backgroundColor: displayFacts.backgroundColor,
        actionScriptVersion: item.swf.actionScript.version,
        actionScriptTagCounts: structuredClone(item.swf.actionScript.tagCounts),
        structureFingerprintSha256: item.swf.structureFingerprintSha256,
      },
      scripts: structuredClone(item.scripts),
      auditCandidates: candidates,
      toolBindings: {
        ffdec: structuredClone(report.sourceBindings.tools.ffdec),
        swfParser: {
          name: "g4-l3 deterministic SWF parser",
          version: item.swf.parserVersion,
          generatorPath: report.generator.path,
          generatorSha256: report.generator.sha256,
        },
      },
      evidenceLimits: structuredClone(item.evidenceLimits),
    },
    limitations,
  };
  artifact.artifactFingerprintSha256 = sha256(stableJson(artifact));
  return artifact;
}

function protectedManifestProjection(manifest) {
  const projected = structuredClone(manifest);
  delete projected.runtime.backgroundColor;
  delete projected.runtime.actionScriptVersion;
  delete projected.runtime.scripts;
  delete projected.toolVersions.ffdec;
  delete projected.audit.masks;
  delete projected.audit.morphs;
  delete projected.audit.filters;
  delete projected.audit.networkCalls;
  delete projected.audit.machineEvidence;
  return projected;
}

export function removeG4L3WorkspaceManifestBindings(manifest) {
  const next = structuredClone(manifest);
  const hadOwnedBindings = (next.runtime.scripts || []).some((entry) => entry?.source === OWNED_SOURCE) ||
    ["masks", "morphs", "filters", "networkCalls"].some((key) =>
      (next.audit[key] || []).some((entry) => entry?.source === OWNED_SOURCE)) ||
    Boolean(next.audit.machineEvidence?.g4L3SourceAudit);
  next.runtime.scripts = (next.runtime.scripts || []).filter((entry) => entry?.source !== OWNED_SOURCE);
  for (const key of ["masks", "morphs", "filters", "networkCalls"]) {
    next.audit[key] = (next.audit[key] || []).filter((entry) => entry?.source !== OWNED_SOURCE);
  }
  if (next.audit.machineEvidence?.g4L3SourceAudit) delete next.audit.machineEvidence.g4L3SourceAudit;
  if (next.audit.machineEvidence && Object.keys(next.audit.machineEvidence).length === 0) {
    delete next.audit.machineEvidence;
  }
  const hasPreexistingMachineEvidence = Boolean(next.audit.machineEvidence &&
    Object.keys(next.audit.machineEvidence).length);
  const hasPreexistingScripts = next.runtime.scripts.length > 0;
  if (hadOwnedBindings && !hasPreexistingMachineEvidence && !hasPreexistingScripts) {
    next.runtime.backgroundColor = "";
    next.runtime.actionScriptVersion = "unknown";
    next.toolVersions.ffdec = "unavailable";
  }
  invariant(isDeepStrictEqual(protectedManifestProjection(next), protectedManifestProjection(manifest)),
    `${manifest.animationId}: artifact-only cleanup changed a protected manifest field`);
  if (hadOwnedBindings && manifest.animationId === IN009_ID) {
    invariant(technicalManifestSha256(next) === IN009_TECHNICAL_MANIFEST_SHA256,
      `${IN009_ID}: artifact-only cleanup did not restore the protected technical manifest projection`);
  }
  return next;
}

function validateWorkspaceManifest({manifest, member, item, workspaceName}) {
  invariant(manifest?.schemaVersion === 2 && manifest.id === member.animationId &&
    manifest.animationId === member.animationId && workspaceName === member.animationId,
  `${member.animationId}: migration workspace identity mismatch`);
  invariant(manifest.assetId === member.assetId && manifest.assetId === item.assetId,
    `${member.animationId}: migration assetId mismatch`);
  invariant(manifest.source?.swf === item.source.swf.path && manifest.source.placementPath === item.source.swf.path &&
    manifest.source.swfSha256 === item.source.swf.sha256,
  `${member.animationId}: migration SWF path/hash mismatch`);
  if (item.source.fla) {
    invariant(manifest.source.fla === item.source.fla.path && manifest.source.flaSha256 === item.source.fla.sha256 &&
      manifest.source.pairedFlaStatus === "present", `${member.animationId}: migration FLA path/hash mismatch`);
  } else {
    invariant(!manifest.source.fla && !manifest.source.flaSha256 && manifest.source.pairedFlaStatus === "missing",
      `${member.animationId}: SWF-only migration contains an unexpected FLA binding`);
  }
  invariant(manifest.runtime?.swfSignature === item.swf.header.signature &&
    manifest.runtime.swfVersion === item.swf.header.version &&
    manifest.runtime.declaredFileLength === item.swf.header.declaredUncompressedBytes &&
    manifest.runtime.stage?.width === item.swf.header.stage.width &&
    manifest.runtime.stage?.height === item.swf.header.stage.height &&
    manifest.runtime.fps === item.swf.header.fps &&
    manifest.runtime.frameCount === item.swf.header.rootFrameCount,
  `${member.animationId}: migration intake runtime metadata differs from the machine report`);
  invariant(manifest.runtime && manifest.toolVersions && manifest.audit,
    `${member.animationId}: migration manifest lacks synchronization targets`);
}

async function validateWorkspacePath(migrationsRootReal, workspace, animationId) {
  const workspaceInfo = await lstat(workspace).catch((error) => {
    throw new Error(`${animationId}: migration workspace is unavailable (${error.message})`);
  });
  invariant(workspaceInfo.isDirectory() && !workspaceInfo.isSymbolicLink(),
    `${animationId}: migration workspace must be a real directory`);
  const workspaceReal = await realpath(workspace);
  invariant(workspaceReal !== migrationsRootReal && workspaceReal.startsWith(`${migrationsRootReal}${path.sep}`),
    `${animationId}: migration workspace resolves outside migrations root`);
  for (const relative of ["audit", path.join("audit", "machine")]) {
    const target = path.join(workspace, relative);
    const information = await lstat(target).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (information) invariant(information.isDirectory() && !information.isSymbolicLink(),
      `${animationId}: ${portable(relative)} must be a real directory`);
  }
}

async function writeAtomic(filePath, bytes) {
  const temporary = `${filePath}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

async function writeTransaction(operations) {
  if (!operations.length) return;
  const transactionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staged = [];
  try {
    for (const [index, operation] of operations.entries()) {
      await mkdir(path.dirname(operation.filePath), {recursive: true});
      const temporaryPath = `${operation.filePath}.stage-${transactionId}-${index}`;
      await writeFile(temporaryPath, operation.nextBytes);
      staged.push({...operation, temporaryPath});
    }
  } catch (error) {
    await Promise.all(staged.map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`G4 L3 artifact-only transaction staging failed before commit (${error.message})`);
  }

  const applied = [];
  try {
    for (const operation of staged) {
      await rename(operation.temporaryPath, operation.filePath);
      applied.push(operation);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const operation of [...applied].reverse()) {
      try {
        if (operation.previousBytes === null) await unlink(operation.filePath);
        else await writeAtomic(operation.filePath, operation.previousBytes);
      } catch (rollbackError) {
        rollbackErrors.push(`${operation.filePath}: ${rollbackError.message}`);
      }
    }
    await Promise.all(staged.slice(applied.length)
      .map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`G4 L3 artifact-only transaction commit failed (${error.message})` +
      (rollbackErrors.length ? `; rollback failures: ${rollbackErrors.join("; ")}` : "; all applied files were rolled back"));
  }
}

export async function materializeG4L3WorkspaceSourceAudits({
  root = projectRoot,
  sourceRoot = root,
  migrationsRoot = path.join(root, "migrations"),
  machineAuditPath = path.join(root, "reports", "g4-l3-machine-source-audits.json"),
  releaseManifestPath = path.join(root, "catalog", "lesson-releases.json"),
  dryRun = false,
  check = false,
} = {}) {
  invariant(!(dryRun && check), "--dry-run and --check are mutually exclusive");
  const [reportFile, releaseFile, materializerBytes] = await Promise.all([
    readJsonBinding(machineAuditPath, root),
    readJsonBinding(releaseManifestPath, root),
    readFile(scriptPath),
  ]);
  const report = validateG4L3MachineSourceAudits(reportFile.value);
  const {release, releaseIndex} = validateReleaseManifest(releaseFile.value);
  validateReportAgainstRelease(report, release);

  const archiveReal = await realpath(path.join(sourceRoot, ...SOURCE_PREFIX.split("/")));
  const migrationsRootReal = await realpath(migrationsRoot);
  const materializerBinding = {
    path: "scripts/materialize-g4-l3-workspace-source-audits.mjs",
    version: MATERIALIZER_VERSION,
    sha256: sha256(materializerBytes),
  };
  const plans = [];

  // No write is allowed before every release member, workspace, source and output
  // has passed this complete prevalidation loop.
  for (const [index, member] of release.members.entries()) {
    const item = report.items[index];
    const workspace = path.join(migrationsRoot, member.animationId);
    await validateWorkspacePath(migrationsRootReal, workspace, member.animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestFile = await readJsonBinding(manifestPath, root);
    const manifest = manifestFile.value;
    validateWorkspaceManifest({manifest, member, item, workspaceName: path.basename(workspace)});

    const swfBytes = await verifyPhysicalFile({
      sourceRoot,
      archiveReal,
      descriptor: item.source.swf,
      label: `${member.animationId} SWF`,
    });
    const freshSwfFacts = parseSwfSourceFacts(swfBytes);
    invariant(isDeepStrictEqual(freshSwfFacts, item.swf),
      `${member.animationId}: physical SWF parse differs from the hash-bound machine report`);
    if (item.source.fla) {
      await verifyPhysicalFile({
        sourceRoot,
        archiveReal,
        descriptor: item.source.fla,
        label: `${member.animationId} FLA`,
      });
    }
    const displayFacts = extractStaticDisplayFacts(swfBytes);
    invariant(displayFacts.observedTagCounts.SetBackgroundColor === (item.swf.tagCounts.SetBackgroundColor || 0) &&
      displayFacts.observedTagCounts.PlaceObject2 === (item.swf.tagCounts.PlaceObject2 || 0) &&
      displayFacts.observedTagCounts.PlaceObject3 === (item.swf.tagCounts.PlaceObject3 || 0),
    `${member.animationId}: fresh display-tag counts differ from the machine report`);

    const artifact = buildArtifact({
      member,
      item,
      index,
      release,
      releaseIndex,
      report,
      reportBinding: reportFile.binding,
      releaseBinding: releaseFile.binding,
      materializerBinding,
      displayFacts,
    });
    const artifactBytes = Buffer.from(stableJson(artifact));
    const nextManifest = removeG4L3WorkspaceManifestBindings(manifest);
    invariant(nextManifest.status === manifest.status &&
      isDeepStrictEqual(nextManifest.acceptance, manifest.acceptance) &&
      isDeepStrictEqual(nextManifest.evidence, manifest.evidence) &&
      isDeepStrictEqual(nextManifest.baseline, manifest.baseline) &&
      isDeepStrictEqual(nextManifest.implementation, manifest.implementation),
    `${member.animationId}: protected migration state changed during planning`);
    const manifestBytes = Buffer.from(stableJson(nextManifest));
    const artifactPath = path.join(workspace, ...ARTIFACT_RELATIVE.split("/"));
    const currentArtifact = await readFile(artifactPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    plans.push({
      animationId: member.animationId,
      workspace,
      artifactPath,
      artifactBytes,
      manifestPath,
      manifestBytes,
      currentArtifact,
      currentManifest: manifestFile.bytes,
      artifactChanged: !currentArtifact || !currentArtifact.equals(artifactBytes),
      manifestChanged: !manifestFile.bytes.equals(manifestBytes),
    });
  }

  const changed = plans.filter((plan) => plan.artifactChanged || plan.manifestChanged);
  if (check && changed.length) {
    const details = changed.map((plan) => `${plan.animationId}(${[
      plan.artifactChanged ? "artifact" : null,
      plan.manifestChanged ? "migration" : null,
    ].filter(Boolean).join("+")})`).join(", ");
    throw new Error(`G4 L3 workspace source audits are stale or missing: ${details}`);
  }
  if (!check && !dryRun) {
    const operations = plans.flatMap((plan) => [
      plan.artifactChanged ? {
        filePath: plan.artifactPath,
        nextBytes: plan.artifactBytes,
        previousBytes: plan.currentArtifact,
      } : null,
      plan.manifestChanged ? {
        filePath: plan.manifestPath,
        nextBytes: plan.manifestBytes,
        previousBytes: plan.currentManifest,
      } : null,
    ].filter(Boolean));
    await writeTransaction(operations);
  }
  return {
    mode: check ? "check" : dryRun ? "dry-run" : "write",
    members: plans.length,
    changed: changed.length,
    artifactChanges: plans.filter((plan) => plan.artifactChanged).length,
    manifestChanges: plans.filter((plan) => plan.manifestChanged).length,
    auditSetSha256: report.summary.auditSetSha256,
    results: plans.map((plan) => ({
      animationId: plan.animationId,
      action: plan.artifactChanged || plan.manifestChanged
        ? (check ? "stale" : dryRun ? "would-write" : "wrote")
        : "up-to-date",
      artifactChanged: plan.artifactChanged,
      manifestChanged: plan.manifestChanged,
    })),
  };
}

function usage() {
  return [
    "Usage: node scripts/materialize-g4-l3-workspace-source-audits.mjs [--dry-run | --check]",
    "",
    "Prevalidates the exact 40-member G4 L3 release, current hash-bound machine report,",
    "workspace identities and physical FLA/SWF hashes before writing any file. Its steady",
    `state is artifact-only at ${ARTIFACT_RELATIVE}; it removes only legacy self-owned`,
    "migration fields and never creates a migration.json binding.",
  ].join("\n");
}

function parseArguments(argv) {
  const options = {};
  for (const argument of argv) {
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.dryRun && options.check), "--dry-run and --check are mutually exclusive");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG4L3WorkspaceSourceAudits(options);
  const label = result.mode === "check" ? "PASS" : result.mode === "dry-run" ? "DRY-RUN" : "WROTE";
  process.stdout.write(`${label}: ${result.members}/40 G4 L3 workspace source audits prevalidated; ` +
    `${result.artifactChanges} artifact change(s), ${result.manifestChanges} manifest change(s); ` +
    `acceptance/status effect: none; audit set ${result.auditSetSha256}.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
