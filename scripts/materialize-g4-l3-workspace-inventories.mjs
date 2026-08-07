#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const RELEASE_PATH = "catalog/lesson-releases.json";
const ASSET_CENSUS_PATH = "reports/g4-l3-swf-asset-definition-census.json";
const EMBEDDED_AUDIO_PATH = "reports/g4-l3-embedded-audio-archive.json";
const CATALOG_AUDIO_PROBE_PATH = "reports/g4-l3-catalog-audio-media-probe.json";
const CAS_AUDIO_PROBE_PATH = "reports/g4-l3-audio-cas-media-probe.json";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const RECEIPT_NAME = "audit/machine/g4-l3-inventory-materialization.json";
const MACHINE_ASSET_NAME = "audit/machine/g4-l3-swf-definition-inventory.csv";
const MACHINE_AUDIO_NAME = "audit/machine/g4-l3-audio-source-candidates.csv";
const CANONICAL_ASSET_NAME = "asset-inventory.csv";
const CANONICAL_AUDIO_NAME = "audio-inventory.csv";
const ASSET_TEMPLATE_PATH = "templates/flash-migration/asset-inventory.csv";
const ASSET_TEMPLATE_SHA256 = "d7ece14e70b251842accacbac14473650beaf934af65217c3271f9ed89f5e05a";
const IN009_ID = "course-g04-l03-in-009";
const ASSET_HEADER = [
  "asset_id", "swf_character_id", "library_symbol", "type", "source_file",
  "source_frame", "exported_file", "sha256", "format", "dimensions_or_bounds",
  "font_glyphs", "transformation", "confidence", "license_or_provenance", "notes",
];
const AUDIO_HEADER = [
  "cue_id", "language", "source_file", "sha256", "start_frame",
  "start_frame_domain_id", "start_semantics", "duration_ms", "format", "channels",
  "sample_rate_hz", "source_character_id", "notes",
];
const LEGACY_AUDIO_HEADER = [
  "cue_id", "language", "source_file", "sha256", "start_frame",
  "duration_ms", "format", "channels", "sample_rate_hz",
  "source_character_id", "notes",
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function millis(seconds) {
  if (!Number.isFinite(seconds)) return "";
  return Math.round(seconds * 1_000_000) / 1_000;
}

async function readBinding(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    binding: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

async function readRawBinding(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    bytes,
    binding: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

function exactRelease(document) {
  invariant(document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release manifest schema is invalid");
  const release = document.releases.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.publicationMode === "atomic" && release.expectedCounts?.members === 40,
    "G4 L3 atomic release is absent or malformed");
  invariant(release.members?.length === 40 && release.members.every((member, index) => member.ordinal === index + 1),
    "G4 L3 release must contain the exact ordered 40 members");
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === 40,
    "G4 L3 release contains duplicate animation IDs");
  return release;
}

function indexExact(items, label) {
  invariant(Array.isArray(items) && items.length === 40, `${label} must contain 40 items`);
  const index = new Map(items.map((item) => [item.animationId, item]));
  invariant(index.size === 40, `${label} contains duplicate animation IDs`);
  return index;
}

function itemSourceSha256(item) {
  return item.source?.sha256 || item.source?.swf?.sha256 ||
    item.source?.swf?.expectedSha256 || item.source?.swf?.observedSha256 || "";
}

function assertFalseBoundary(value, label) {
  invariant(value && typeof value === "object", `${label} evidence boundary is absent`);
  for (const [key, state] of Object.entries(value)) {
    if (/Established$|Accepted$|Complete$|Authorized$|Claimed$/.test(key)) {
      invariant(state === false, `${label}.${key} must remain false`);
    }
  }
}

export function renderAssetInventory(censusItem) {
  const fonts = new Map((censusItem.fontFacts || []).map((font) => [font.characterId, font]));
  const rows = [ASSET_HEADER];
  for (const definition of censusItem.definitions) {
    const font = fonts.get(definition.characterId);
    const specific = definition.specificFacts || {};
    const details = [
      `container=${definition.containerPath}`,
      `definitionDepth=${definition.definitionDepth}`,
      `tagOrdinal=${definition.ordinal}`,
      `payloadBytes=${definition.payloadLength}`,
      `exactTagIdentitySha256=${definition.exactTagIdentitySha256}`,
    ];
    if (specific.declaredFrameCount != null) details.push(`declaredFrameCount=${specific.declaredFrameCount}`);
    if (specific.sampleCount != null) details.push(`declaredSampleCount=${specific.sampleCount}`);
    rows.push([
      `swf-definition-${String(definition.ordinal).padStart(5, "0")}`,
      definition.characterId,
      font?.exactName || "",
      definition.category,
      censusItem.source.path,
      "",
      "",
      definition.rawTagPayloadSha256,
      definition.tagName,
      "",
      font?.glyphCount ?? "",
      "none; original SWF tag payload inventoried without export",
      "machine-extracted-definition",
      "owner-provided SWF",
      `${details.join("; ")}; authoring name, visual bounds, placement, and runtime reachability remain unresolved.`,
    ]);
  }
  return csv(rows);
}

function findEmbeddedUnit(archiveItem, unit) {
  if (unit.unitKind === "DefineSound") {
    return archiveItem.embeddedAudio.defineSounds.find((candidate) =>
      candidate.sourceOrder === unit.sourceOrder && candidate.soundId === unit.soundId);
  }
  if (unit.unitKind === "SoundStream") {
    return archiveItem.embeddedAudio.soundStreams.find((candidate) =>
      candidate.sourceOrder === unit.sourceOrder && candidate.streamIndex === unit.streamIndex);
  }
  return null;
}

function catalogAudioRows(manifest, probes) {
  const exactByPath = new Map((manifest.audio?.catalogExactAssociations || [])
    .map((association) => [association.sourceFile, association]));
  return probes.map((probe, index) => {
    const association = exactByPath.get(probe.source.path);
    invariant(probe.source.unchangedByProbe === true &&
      (!association || association.sha256 === probe.source.sha256),
    `${manifest.animationId}: catalog audio probe/source hash mismatch for ${probe.source.path}`);
    invariant(probe.probe.status === "ffprobe-parsed-ffmpeg-decode-check-passed" &&
      probe.probe.ffmpegDecodeToNull.decodeCheckPassed === true,
    `${manifest.animationId}: catalog audio technical probe failed for ${probe.source.path}`);
    assertFalseBoundary(probe.evidenceLimits, `${manifest.animationId}:catalog-audio-${index + 1}`);
    return [
      `catalog-audio-${String(index + 1).padStart(3, "0")}`,
      probe.source.catalogLanguage || "und",
      probe.source.path,
      probe.source.sha256,
      "",
      "",
      "catalog association only; runtime cue is unresolved",
      millis(probe.probe.media.timing.durationSeconds),
      probe.probe.media.codec.name || path.extname(probe.source.path).slice(1),
      probe.probe.media.audio.channels,
      probe.probe.media.audio.sampleRateHz,
      "",
      `association=${association ? association.association : "catalog-shared-group"}; ffprobe/ffmpeg technical probe passed; normalized-language candidate=${probe.source.normalizedLanguageCandidate}; spoken language, cue, synchronization, listening quality, and acceptance are not established.`,
    ];
  });
}

function embeddedAudioRows(animationId, archiveItem, casReference) {
  invariant(casReference.animationId === animationId, `${animationId}: CAS reference identity mismatch`);
  invariant(casReference.audioUnitReferenceCount === casReference.units.length,
    `${animationId}: CAS reference count mismatch`);
  return casReference.units.map((unit, index) => {
    const archived = findEmbeddedUnit(archiveItem, unit);
    invariant(archived, `${animationId}: archived embedded-audio unit is absent: ${unit.unitReferenceId}`);
    invariant(archived.logicalPayloadIdentitySha256 === unit.logicalPayloadIdentitySha256 &&
      archived.payload.sha256 === unit.payload.sha256 && archived.payload.archivePath === unit.payload.path,
    `${animationId}: embedded-audio archive/CAS binding mismatch: ${unit.unitReferenceId}`);
    assertFalseBoundary(unit.evidenceLimits, `${animationId}:${unit.unitReferenceId}`);
    const structuralFrame = unit.unitKind === "SoundStream" ? archived.headLocalFrame : archived.localFrame;
    const startSemantics = unit.unitKind === "SoundStream"
      ? "static SoundStreamHead frame in owner domain; runtime reachability unresolved"
      : "DefineSound definition frame only; not a StartSound/runtime cue";
    const technical = unit.technicalProbe || {};
    return [
      `embedded-audio-${String(index + 1).padStart(3, "0")}`,
      "und",
      unit.payload.path,
      unit.payload.sha256,
      structuralFrame ?? "",
      unit.ownerDomainId,
      startSemantics,
      millis(technical.durationSeconds),
      technical.codecName || unit.sourceFormat,
      technical.channels ?? "",
      technical.sampleRateHz ?? unit.sourceSampleFacts?.sampleRateHz ?? "",
      unit.soundId ?? "",
      `unitReferenceId=${unit.unitReferenceId}; source SWF=${archiveItem.source.swf.path}; sourceFormat=${unit.sourceFormat}; probeStatus=${technical.probeStatus}; payload is an exact machine archive; language, cue, synchronization, listening quality, and acceptance are not established.`,
    ];
  });
}

export function renderAudioInventory(manifest, archiveItem, casReference, catalogProbes) {
  return csv([
    AUDIO_HEADER,
    ...catalogAudioRows(manifest, catalogProbes),
    ...embeddedAudioRows(manifest.animationId, archiveItem, casReference),
  ]);
}

function renderCatalogCanonicalAudio(manifest) {
  const associations = manifest.audio?.catalogExactAssociations || [];
  const rows = associations.map((entry, index) => [
    `catalog-audio-${String(index + 1).padStart(2, "0")}`,
    entry.language || "unknown",
    entry.sourceFile,
    entry.sha256 || "",
    "",
    "",
    "",
    "",
    path.extname(entry.sourceFile).slice(1).toLowerCase(),
    "",
    "",
    "",
    "Catalog association only; start frame, duration, and stream metadata require timeline/audio audit.",
  ]);
  return csv([AUDIO_HEADER, ...rows]);
}

export function renderCanonicalAudioPreimage(manifest) {
  if (manifest.animationId !== IN009_ID) return renderCatalogCanonicalAudio(manifest);
  const associations = manifest.audio?.catalogExactAssociations || [];
  invariant(associations.length === 1, `${IN009_ID}: expected one legacy catalog-audio association`);
  const entry = associations[0];
  return csv([
    LEGACY_AUDIO_HEADER,
    [
      "catalog-audio-01",
      entry.language || "unknown",
      entry.sourceFile,
      entry.sha256 || "",
      "",
      "",
      path.extname(entry.sourceFile).slice(1).toLowerCase(),
      "",
      "",
      "",
      "Catalog association only; start frame, duration, and stream metadata require timeline/audio audit.",
    ],
  ]);
}

function identityProjection(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    animationId: manifest.animationId,
    assetId: manifest.assetId,
    status: manifest.status,
    source: {
      placementPath: manifest.source?.placementPath,
      fla: manifest.source?.fla,
      flaSha256: manifest.source?.flaSha256,
      swf: manifest.source?.swf,
      swfSha256: manifest.source?.swfSha256,
      pairedFlaStatus: manifest.source?.pairedFlaStatus,
    },
    catalogExactAssociations: manifest.audio?.catalogExactAssociations || [],
  };
}

function receipt({
  member,
  manifest,
  bindings,
  censusItem,
  archiveItem,
  casReference,
  catalogProbes,
  assetBytes,
  audioBytes,
  canonicalAssetBytes,
  canonicalAudioBytes,
  scriptBinding,
}) {
  const report = {
    schemaVersion: 2,
    reportType: "g4-l3-workspace-inventory-materialization",
    animationId: member.animationId,
    assetId: member.assetId,
    ordinal: member.ordinal,
    releaseRole: member.releaseRole,
    batchId: member.batchId,
    generatedBy: scriptBinding,
    sourceBindings: bindings,
    manifestIdentity: {
      projection: identityProjection(manifest),
      projectionSha256: sha256(stableJson(identityProjection(manifest))),
    },
    outputs: {
      assetDefinitionInventory: {
        path: `migrations/${member.animationId}/${MACHINE_ASSET_NAME}`,
        bytes: assetBytes.length,
        sha256: sha256(assetBytes),
        rowCount: censusItem.definitions.length,
        definitionInventorySha256: censusItem.definitionInventorySha256,
      },
      audioSourceCandidateInventory: {
        path: `migrations/${member.animationId}/${MACHINE_AUDIO_NAME}`,
        bytes: audioBytes.length,
        sha256: sha256(audioBytes),
        catalogAssociationRows: catalogProbes.length,
        embeddedAudioRows: casReference.units.length,
        embeddedAudioItemFingerprintSha256: archiveItem.itemFingerprintSha256,
      },
    },
    canonicalInventoryFiles: {
      assetInventory: {
        path: `migrations/${member.animationId}/${CANONICAL_ASSET_NAME}`,
        bytes: canonicalAssetBytes.length,
        sha256: sha256(canonicalAssetBytes),
        changedByMaterializer: false,
      },
      audioInventory: {
        path: `migrations/${member.animationId}/${CANONICAL_AUDIO_NAME}`,
        bytes: canonicalAudioBytes.length,
        sha256: sha256(canonicalAudioBytes),
        changedByMaterializer: false,
      },
    },
    machineEvidence: {
      assetDefinitionsInventoried: true,
      catalogAudioTechnicallyProbed: true,
      embeddedAudioPayloadsArchivedAndTechnicallyProbed: true,
      canonicalInventoryFilesChanged: false,
      sourceAssetsChanged: false,
    },
    acceptance: {
      authoringAuditComplete: false,
      authoritativeRuntimeComplete: false,
      frameDomainDispositionComplete: false,
      scenarioInventoryComplete: false,
      finalSpecificationReady: false,
      implementationAuthorized: false,
      bilingualAudioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    limitations: [
      "SWF definitions are machine candidates stored outside canonical asset-inventory.csv; visual bounds, placements, authoring-library names, exports, and renderer suitability still require audit/specification.",
      "Catalog language values and path-derived language candidates do not establish spoken-language correctness.",
      "Audio candidates are stored outside canonical audio-inventory.csv; definition/head frames do not establish natural runtime cues, reachability, synchronization, Replay/reset behavior, or listening quality.",
      "No Adobe Animate document or original runtime was opened, and no review or acceptance state was changed.",
    ],
    strictAcceptanceEffect: "none",
  };
  report.reportFingerprintSha256 = sha256(stableJson(report));
  return report;
}

export function validateMaterializationReceipt(report) {
  invariant(report?.schemaVersion === 2 &&
    report.reportType === "g4-l3-workspace-inventory-materialization",
  "workspace inventory receipt schema is invalid");
  invariant(typeof report.animationId === "string" && /^swf-[a-f0-9]{64}$/.test(report.assetId),
    "workspace inventory receipt identity is invalid");
  const assetOutput = report.outputs?.assetDefinitionInventory;
  const audioOutput = report.outputs?.audioSourceCandidateInventory;
  const canonicalAsset = report.canonicalInventoryFiles?.assetInventory;
  const canonicalAudio = report.canonicalInventoryFiles?.audioInventory;
  const expectedPrefix = `migrations/${report.animationId}/`;
  invariant(assetOutput?.path === `${expectedPrefix}${MACHINE_ASSET_NAME}` &&
    audioOutput?.path === `${expectedPrefix}${MACHINE_AUDIO_NAME}` &&
    canonicalAsset?.path === `${expectedPrefix}${CANONICAL_ASSET_NAME}` &&
    canonicalAudio?.path === `${expectedPrefix}${CANONICAL_AUDIO_NAME}`,
  "workspace inventory receipt paths are invalid");
  invariant(Number.isInteger(assetOutput.rowCount) && assetOutput.rowCount >= 0 &&
    Number.isInteger(audioOutput.catalogAssociationRows) && audioOutput.catalogAssociationRows >= 0 &&
    Number.isInteger(audioOutput.embeddedAudioRows) && audioOutput.embeddedAudioRows >= 0,
  "workspace inventory receipt output counts are invalid");
  for (const [label, output] of Object.entries({assetOutput, audioOutput, canonicalAsset, canonicalAudio})) {
    invariant(Number.isInteger(output.bytes) && output.bytes > 0 && /^[a-f0-9]{64}$/.test(output.sha256),
      `workspace inventory receipt ${label} binding is invalid`);
  }
  invariant(report.generatedBy?.version === 2 && /^[a-f0-9]{64}$/.test(report.generatedBy.sha256),
    "workspace inventory receipt generator binding is invalid");
  invariant(report.manifestIdentity?.projection?.animationId === report.animationId &&
    report.manifestIdentity?.projection?.assetId === report.assetId &&
    report.manifestIdentity.projectionSha256 === sha256(stableJson(report.manifestIdentity.projection)),
  "workspace inventory receipt manifest projection is invalid");
  invariant(report.machineEvidence?.assetDefinitionsInventoried === true &&
    report.machineEvidence?.canonicalInventoryFilesChanged === false &&
    report.machineEvidence?.sourceAssetsChanged === false,
  "workspace inventory receipt machine boundary is invalid");
  invariant(canonicalAsset.changedByMaterializer === false &&
    canonicalAudio.changedByMaterializer === false,
  "workspace inventory receipt canonical boundary is invalid");
  invariant(report.acceptance && Object.values(report.acceptance).every((value) => value === false) &&
    report.strictAcceptanceEffect === "none",
  "workspace inventory receipt promoted acceptance");
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "workspace inventory receipt fingerprint is stale");
  return report;
}

function validateLegacyMaterializationReceipt(report) {
  invariant(report?.schemaVersion === 1 &&
    report.reportType === "g4-l3-workspace-inventory-materialization",
  "legacy workspace inventory receipt schema is invalid");
  invariant(report.outputs?.assetInventory?.rowCount >= 0 &&
    report.outputs?.audioInventory?.catalogAssociationRows >= 0 &&
    report.outputs?.audioInventory?.embeddedAudioRows >= 0,
  "legacy workspace inventory receipt outputs are invalid");
  invariant(typeof report.animationId === "string" && /^swf-[a-f0-9]{64}$/.test(report.assetId),
    "legacy workspace inventory receipt identity is invalid");
  invariant(report.acceptance && Object.values(report.acceptance).every((value) => value === false) &&
    report.strictAcceptanceEffect === "none",
  "legacy workspace inventory receipt promoted acceptance");
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "legacy workspace inventory receipt fingerprint is stale");
  return report;
}

export function assertLegacyCanonicalOwnership({report, member, outputKey, relativePath, currentBytes}) {
  invariant(report.animationId === member.animationId && report.assetId === member.assetId,
    `${member.animationId}: legacy inventory receipt identity mismatch`);
  const output = report.outputs?.[outputKey];
  invariant(output?.path === relativePath,
    `${member.animationId}: legacy receipt does not own ${relativePath}`);
  invariant(output.bytes === currentBytes.length && output.sha256 === sha256(currentBytes),
    `${member.animationId}: refusing to restore unowned canonical inventory ${relativePath}`);
}

async function exists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function assertSafeOutput(root, absolutePath) {
  const migrationsRoot = path.join(root, "migrations");
  invariant(absolutePath.startsWith(`${migrationsRoot}${path.sep}`), `output escapes migrations/: ${absolutePath}`);
  const relative = path.relative(migrationsRoot, absolutePath);
  invariant(!relative.startsWith("..") && !path.isAbsolute(relative), `unsafe output: ${absolutePath}`);
  const rootInfo = await lstat(migrationsRoot);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `migrations root must be a real directory: ${migrationsRoot}`);
  let cursor = migrationsRoot;
  for (const component of path.dirname(relative).split(path.sep).filter((value) => value && value !== ".")) {
    cursor = path.join(cursor, component);
    if (!(await exists(cursor))) continue;
    const info = await lstat(cursor);
    invariant(info.isDirectory() && !info.isSymbolicLink(), `output parent must be a real directory: ${cursor}`);
  }
  if (await exists(absolutePath)) {
    const info = await lstat(absolutePath);
    invariant(info.isFile() && !info.isSymbolicLink(), `output must be a regular file: ${absolutePath}`);
    invariant((await stat(absolutePath)).nlink === 1, `output must not have multiple hard links: ${absolutePath}`);
  }
}

async function emit(root, relativePath, desired, {check, dryRun}) {
  const absolutePath = path.join(root, relativePath);
  await assertSafeOutput(root, absolutePath);
  if (check) {
    invariant(await exists(absolutePath), `${relativePath} is missing`);
    invariant((await readFile(absolutePath)).equals(desired), `${relativePath} is stale`);
  } else if (!dryRun) {
    await mkdir(path.dirname(absolutePath), {recursive: true});
    const temporaryPath = `${absolutePath}.tmp-${process.pid}`;
    await writeFile(temporaryPath, desired, {flag: "wx"});
    await rename(temporaryPath, absolutePath);
  }
}

export function parseArguments(argv) {
  const options = {check: false, dryRun: false, root: projectRoot};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(!(options.check && options.dryRun), "--check and --dry-run are mutually exclusive");
  return options;
}

export async function materializeG4L3WorkspaceInventories({root = projectRoot, check = false, dryRun = false} = {}) {
  const [releaseInput, censusInput, embeddedInput, catalogProbeInput, casProbeInput, assetTemplateInput] = await Promise.all([
    readBinding(root, RELEASE_PATH),
    readBinding(root, ASSET_CENSUS_PATH),
    readBinding(root, EMBEDDED_AUDIO_PATH),
    readBinding(root, CATALOG_AUDIO_PROBE_PATH),
    readBinding(root, CAS_AUDIO_PROBE_PATH),
    readRawBinding(root, ASSET_TEMPLATE_PATH),
  ]);
  const release = exactRelease(releaseInput.value);
  const census = censusInput.value;
  const embedded = embeddedInput.value;
  const catalogProbe = catalogProbeInput.value;
  const casProbe = casProbeInput.value;
  invariant(census?.schemaVersion === 1 && census.reportType === "g4-l3-swf-asset-definition-census",
    "asset census schema is invalid");
  invariant(embedded?.schemaVersion === 1 && embedded.reportType === "g4-l3-embedded-audio-archive",
    "embedded-audio archive schema is invalid");
  invariant(catalogProbe?.schemaVersion === 1 && catalogProbe.reportType === "g4-l3-catalog-audio-technical-media-probe",
    "catalog audio probe schema is invalid");
  invariant(casProbe?.schemaVersion === 1 && casProbe.reportType === "g4-l3-audio-cas-technical-media-probe",
    "CAS audio probe schema is invalid");
  invariant(census.summary?.totalDefinitions === 8068 && embedded.summary?.audioUnitCount === 359 &&
    catalogProbe.summary?.sourceFileCount === 143 && casProbe.summary?.sourceAudioUnitReferenceCount === 359,
  "G4 L3 inventory source totals changed");
  invariant(assetTemplateInput.binding.sha256 === ASSET_TEMPLATE_SHA256 &&
    assetTemplateInput.bytes.equals(Buffer.from(csv([ASSET_HEADER]))),
  "canonical asset-inventory template changed");
  const censusById = indexExact(census.items, "asset census");
  const embeddedById = indexExact(embedded.items, "embedded-audio archive");
  const casById = indexExact(casProbe.itemReferences, "CAS item references");
  const probeByPath = new Map(catalogProbe.probes.map((probe) => [probe.source.path, probe]));
  invariant(probeByPath.size === 143, "catalog audio probe paths are not unique");
  const releaseIds = new Set(release.members.map(({animationId}) => animationId));
  const catalogProbesByAnimation = new Map(release.members.map(({animationId}) => [animationId, []]));
  for (const probe of catalogProbe.probes) {
    invariant(Array.isArray(probe.source.referencedByAnimationIds) && probe.source.referencedByAnimationIds.length > 0,
      `catalog audio probe has no G4 L3 references: ${probe.source.path}`);
    for (const animationId of probe.source.referencedByAnimationIds) {
      invariant(releaseIds.has(animationId), `catalog audio probe references a nonmember: ${animationId}`);
      catalogProbesByAnimation.get(animationId).push(probe);
    }
  }
  for (const probes of catalogProbesByAnimation.values()) {
    probes.sort((left, right) => left.source.path.localeCompare(right.source.path, "en"));
  }
  const scriptBytes = await readFile(scriptPath);
  const scriptBinding = {
    path: portable(path.relative(root, scriptPath)),
    version: 2,
    bytes: scriptBytes.length,
    sha256: sha256(scriptBytes),
  };
  const sharedBindings = {
    lessonRelease: releaseInput.binding,
    assetDefinitionCensus: censusInput.binding,
    embeddedAudioArchive: embeddedInput.binding,
    catalogAudioMediaProbe: catalogProbeInput.binding,
    audioCasMediaProbe: casProbeInput.binding,
    canonicalAssetInventoryTemplate: assetTemplateInput.binding,
  };
  const outputs = [];
  const canonicalRestorations = [];
  let catalogAudioAssociationRows = 0;
  for (const member of release.members) {
    const workspace = path.join(root, "migrations", member.animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    invariant(manifest.animationId === member.animationId && manifest.assetId === member.assetId,
      `${member.animationId}: workspace identity mismatch`);
    invariant(manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf?.endsWith(member.source.path), `${member.animationId}: source identity mismatch`);
    invariant(await sha256File(path.join(root, manifest.source.swf)) === member.source.sha256,
      `${member.animationId}: physical SWF hash mismatch`);
    const censusItem = censusById.get(member.animationId);
    const archiveItem = embeddedById.get(member.animationId);
    const casReference = casById.get(member.animationId);
    const catalogProbes = catalogProbesByAnimation.get(member.animationId);
    invariant(censusItem && archiveItem && casReference, `${member.animationId}: inventory source item is absent`);
    for (const item of [censusItem, archiveItem]) {
      invariant(item.assetId === member.assetId && itemSourceSha256(item) === member.source.sha256,
      `${member.animationId}: upstream inventory source/asset binding mismatch`);
    }
    const assetBytes = Buffer.from(renderAssetInventory(censusItem));
    const audioBytes = Buffer.from(renderAudioInventory(manifest, archiveItem, casReference, catalogProbes));
    const legacyCanonicalAssetBytes = assetTemplateInput.bytes;
    const legacyCanonicalAudioBytes = Buffer.from(renderCanonicalAudioPreimage(manifest));
    const canonicalAssetRelativePath = `migrations/${member.animationId}/${CANONICAL_ASSET_NAME}`;
    const canonicalAudioRelativePath = `migrations/${member.animationId}/${CANONICAL_AUDIO_NAME}`;
    const receiptRelativePath = `migrations/${member.animationId}/${RECEIPT_NAME}`;
    const [currentCanonicalAssetBytes, currentCanonicalAudioBytes] = await Promise.all([
      readFile(path.join(root, canonicalAssetRelativePath)),
      readFile(path.join(root, canonicalAudioRelativePath)),
    ]);
    const legacyCanonicalMismatches = [
      {
        outputKey: "assetInventory",
        relativePath: canonicalAssetRelativePath,
        currentBytes: currentCanonicalAssetBytes,
        expectedBytes: legacyCanonicalAssetBytes,
      },
      {
        outputKey: "audioInventory",
        relativePath: canonicalAudioRelativePath,
        currentBytes: currentCanonicalAudioBytes,
        expectedBytes: legacyCanonicalAudioBytes,
      },
    ].filter(({currentBytes, expectedBytes}) => !currentBytes.equals(expectedBytes));
    let canonicalAssetBytes = currentCanonicalAssetBytes;
    let canonicalAudioBytes = currentCanonicalAudioBytes;
    if (legacyCanonicalMismatches.length > 0 && await exists(path.join(root, receiptRelativePath))) {
      const priorReport = JSON.parse(await readFile(path.join(root, receiptRelativePath), "utf8"));
      if (priorReport.schemaVersion === 1) {
        invariant(!check,
          `${member.animationId}: legacy canonical inventories require one-time recovery`);
        const legacyReport = validateLegacyMaterializationReceipt(priorReport);
        for (const mismatch of legacyCanonicalMismatches) {
          assertLegacyCanonicalOwnership({report: legacyReport, member, ...mismatch});
          canonicalRestorations.push({relativePath: mismatch.relativePath, bytes: mismatch.expectedBytes});
          if (mismatch.outputKey === "assetInventory") canonicalAssetBytes = mismatch.expectedBytes;
          else canonicalAudioBytes = mismatch.expectedBytes;
        }
      }
    }
    catalogAudioAssociationRows += catalogProbes.length;
    const report = receipt({
      member,
      manifest,
      bindings: sharedBindings,
      censusItem,
      archiveItem,
      casReference,
      catalogProbes,
      assetBytes,
      audioBytes,
      canonicalAssetBytes,
      canonicalAudioBytes,
      scriptBinding,
    });
    validateMaterializationReceipt(report);
    outputs.push(
      {relativePath: `migrations/${member.animationId}/${MACHINE_ASSET_NAME}`, bytes: assetBytes},
      {relativePath: `migrations/${member.animationId}/${MACHINE_AUDIO_NAME}`, bytes: audioBytes},
      {relativePath: receiptRelativePath, bytes: Buffer.from(stableJson(report))},
    );
  }
  invariant(outputs.length === 120, "expected exactly 120 bounded workspace outputs");
  invariant(catalogAudioAssociationRows === catalogProbe.summary.sourceReferenceCount,
    `catalog audio association count changed: ${catalogAudioAssociationRows}`);
  for (const output of [...canonicalRestorations, ...outputs]) {
    await assertSafeOutput(root, path.join(root, output.relativePath));
  }
  for (const restoration of canonicalRestorations) {
    await emit(root, restoration.relativePath, restoration.bytes, {check: false, dryRun});
  }
  for (const output of outputs) await emit(root, output.relativePath, output.bytes, {check, dryRun});
  return {
    check,
    dryRun,
    members: 40,
    outputs: outputs.length,
    canonicalInventoryRestorations: canonicalRestorations.length,
    canonicalInventoryFilesChanged: false,
    assetDefinitionRows: census.summary.totalDefinitions,
    embeddedAudioRows: embedded.summary.audioUnitCount,
    catalogAudioAssociationRows,
    strictAcceptanceEffect: "none",
  };
}

function usage() {
  return [
    "Usage: node scripts/materialize-g4-l3-workspace-inventories.mjs [options]",
    "",
    "  --check       Verify 120 machine outputs and canonical inventory preservation byte-for-byte",
    "  --dry-run     Validate and summarize without writing",
    "  --root <dir>  Override the repository root (test fixtures)",
    "",
    "Materializes exact machine inventories under audit/machine only. A one-time, receipt-bound",
    "repair reverses legacy v1 overwrites; canonical inventories are otherwise never changed.",
    "The tool never opens Animate, executes a SWF, establishes audio cues, or advances acceptance.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG4L3WorkspaceInventories(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
