#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  validatePriorReceipt as validatePreRuntimeCandidateReceipt,
} from "./materialize-g5-l4-pre-runtime-specification-candidates.mjs";
import {
  validateG5L4M1StaticReconciliationReceipt,
} from "./reconcile-lesson-m1-static-specification.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const GENERATOR_PATH =
  "scripts/materialize-g5-l4-source-derived-asset-inventories.mjs";
export const SUCCESSOR_RECEIPT_NAME =
  "g5-l4-source-derived-asset-inventory-candidate-receipt.json";

const RELEASE_PATH = "catalog/lesson-releases.json";
const ASSET_TEMPLATE_PATH = "templates/flash-migration/asset-inventory.csv";
const PRE_RUNTIME_MATERIALIZER_PATH =
  "scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs";
const M1_RECONCILIATION_PATH =
  "scripts/reconcile-lesson-m1-static-specification.mjs";
const PRE_RUNTIME_RECEIPT_NAME =
  "g5-l4-pre-runtime-specification-candidate-receipt.json";
const M1_RECONCILIATION_RECEIPT_NAME =
  "g5-l4-m1-static-reconciliation-receipt.json";
const CENSUS_NAME =
  "g5-l4-pre-runtime-swf-asset-definition-census.json";
const DEFINITION_INDEX_NAME =
  "g5-l4-pre-runtime-swf-definition-inventory.csv";

export const ASSET_HEADERS = Object.freeze([
  "asset_id",
  "swf_character_id",
  "library_symbol",
  "type",
  "source_file",
  "source_frame",
  "exported_file",
  "sha256",
  "format",
  "dimensions_or_bounds",
  "font_glyphs",
  "transformation",
  "confidence",
  "license_or_provenance",
  "notes",
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "implementationAuthorized",
  "fidelityAccepted",
  "audioAccepted",
  "humanVisualAccepted",
  "ownerAccepted",
  "strictComplete",
  "published",
]);

const STRUCTURAL_BOUNDARY =
  "Structural/static source-derived candidate only. The exported_file is the shared machine definition-index evidence, not a visual or renderer asset export. It is not an authoritative original-runtime baseline and establishes no runtime reachability, placement, asset usage, visual appearance, renderer suitability, human or owner acceptance, strict completion, or publication.";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function withFingerprint(document) {
  const fingerprint = sha256(stableJson(document));
  return {
    ...document,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

function validateFingerprint(document, label) {
  invariant(
    isSha256(document?.artifactFingerprintSha256) &&
      document.generatedMarker ===
        `sha256:${document.artifactFingerprintSha256}`,
    `${label}: fingerprint descriptor is invalid`,
  );
  const projection = structuredClone(document);
  delete projection.artifactFingerprintSha256;
  delete projection.generatedMarker;
  invariant(
    document.artifactFingerprintSha256 === sha256(stableJson(projection)),
    `${label}: fingerprint is stale`,
  );
}

function acceptanceEffects() {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((key) => [key, false]));
}

function assertAllFalse(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: acceptance object is absent`,
  );
  for (const key of ACCEPTANCE_KEYS) {
    invariant(value[key] === false, `${label}.${key} must remain false`);
  }
  invariant(
    Object.values(value).every((state) => state === false),
    `${label}: every acceptance effect must remain false`,
  );
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function contained(root, target) {
  const relative = path.relative(root, target);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function statIdentity(info, {includeSize = true} = {}) {
  return {
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    uid: info.uid,
    gid: info.gid,
    ...(includeSize ? {size: info.size, nlink: info.nlink} : {}),
  };
}

function sameIdentity(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key]);
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

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is absent`,
  );
  invariant(!path.isAbsolute(relativePath), `${label}: path must be relative`);
  invariant(
    portable(relativePath) === relativePath,
    `${label}: path must use portable separators`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label}: path escapes project root`);
  return absolutePath;
}

async function readOrdinaryBinding(root, relativePath, label, {json = false} = {}) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const [rootReal, fileReal, before] = await Promise.all([
    realpath(root),
    realpath(absolutePath),
    lstat(absolutePath),
  ]);
  invariant(contained(rootReal, fileReal), `${label}: path resolves outside project root`);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: input must be an ordinary single-link file`,
  );
  const identity = statIdentity(before);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    sameIdentity(identity, statIdentity(after)) && bytes.length === identity.size,
    `${label}: input changed while being read`,
  );
  let value = null;
  if (json) {
    try {
      value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON: ${error.message}`);
    }
  }
  const digest = sha256(bytes);
  return {
    absolutePath,
    bytes,
    value,
    binding: {
      path: relativePath,
      bytes: bytes.length,
      sha256: digest,
    },
    guard: {
      absolutePath,
      relativePath,
      identity,
      sha256: digest,
    },
  };
}

async function assertGuardIdentityUnchanged(guard) {
  const info = await lstat(guard.absolutePath);
  invariant(
    info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
      sameIdentity(guard.identity, statIdentity(info)),
    `input identity changed during transaction: ${guard.relativePath}`,
  );
}

async function assertGuardUnchanged(guard) {
  await assertGuardIdentityUnchanged(guard);
  const bytes = await readFile(guard.absolutePath);
  await assertGuardIdentityUnchanged(guard);
  invariant(
    bytes.length === guard.identity.size && sha256(bytes) === guard.sha256,
    `input bytes changed during transaction: ${guard.relativePath}`,
  );
}

function deduplicateGuards(guards, outputPaths) {
  const outputs = new Set(outputPaths);
  const byPath = new Map();
  for (const guard of guards) {
    if (outputs.has(guard.absolutePath)) continue;
    const prior = byPath.get(guard.absolutePath);
    if (prior) {
      invariant(
        prior.sha256 === guard.sha256 &&
          sameIdentity(prior.identity, guard.identity),
        `duplicate input guard differs: ${guard.relativePath}`,
      );
    } else {
      byPath.set(guard.absolutePath, guard);
    }
  }
  return [...byPath.values()];
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

export function serializeCsv(headers, rows) {
  return `${[
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? "")),
  ].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function parseCsv(text, expectedHeaders, label = "CSV") {
  const parsed = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) parsed.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  invariant(!quoted, `${label}: unterminated quoted field`);
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) parsed.push(row);
  }
  invariant(parsed.length > 0, `${label}: file is empty`);
  invariant(
    JSON.stringify(parsed[0]) === JSON.stringify(expectedHeaders),
    `${label}: headers drifted`,
  );
  const rows = parsed.slice(1).map((values, index) => {
    invariant(
      values.length === expectedHeaders.length,
      `${label}: row ${index + 2} has ${values.length} fields instead of ${expectedHeaders.length}`,
    );
    return Object.fromEntries(
      expectedHeaders.map((header, position) => [header, values[position]]),
    );
  });
  return {headers: parsed[0], rows};
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson-release catalog schema is invalid",
  );
  const releases = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(releases.length === 1, `expected exactly one ${RELEASE_ID}`);
  const release = releases[0];
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 55 &&
      Array.isArray(release.members) &&
      release.members.length === 55 &&
      new Set(release.members.map(({animationId}) => animationId)).size === 55,
    `${RELEASE_ID}: exact 55-member atomic release shape changed`,
  );
  return release;
}

function validateManifest(member, manifest) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      typeof manifest.source.swf === "string" &&
      manifest.source.swf.endsWith(member.source.path) &&
      manifest.evidence?.assetInventory === "asset-inventory.csv",
    `${member.animationId}: current manifest identity/source/status drifted`,
  );
}

function validateCensus(member, census, censusBinding, definitionBinding) {
  invariant(
    census?.schemaVersion === 1 &&
      census.artifactType === "g5-l4-swf-asset-definition-census-candidate" &&
      census.releaseId === RELEASE_ID &&
      census.animationId === member.animationId &&
      census.assetId === member.assetId &&
      census.source?.sha256 === member.source.sha256 &&
      census.source.physicalHashVerified === true &&
      census.method?.swfmillCrossCheck === true &&
      census.method.establishesRuntimeVisibility === false &&
      census.method.establishesAuthoringSemantics === false &&
      census.method.exportsRendererAssets === false &&
      census.method.authorizesRendererReuse === false &&
      Array.isArray(census.definitions) &&
      census.definitions.length === census.summary?.definitionCount &&
      census.summary.definitionCount > 0 &&
      census.summary.rendererAssetExportCount === 0 &&
      census.summary.runtimePlacementDispositionCount === 0 &&
      census.summary.canonicalAssetInventoryRowsAdded === 0 &&
      census.summary.finalCanonicalAssetSpecificationComplete === false,
    `${member.animationId}: source definition census crossed its static boundary`,
  );
  assertAllFalse(census.acceptanceEffects, `${member.animationId}: census`);
  validateFingerprint(census, `${member.animationId}: census`);
  invariant(
    censusBinding.path ===
      `migrations/${member.animationId}/audit/machine/${CENSUS_NAME}` &&
      definitionBinding.path ===
      `migrations/${member.animationId}/audit/machine/${DEFINITION_INDEX_NAME}`,
    `${member.animationId}: candidate artifact paths drifted`,
  );
}

function validateDefinitionIndex(member, sourcePath, census, parsed) {
  invariant(
    parsed.rows.length === census.definitions.length,
    `${member.animationId}: definition-index row count differs from census`,
  );
  const fonts = new Map(
    (census.fontFacts || []).map((font) => [String(font.characterId), font]),
  );
  const assetIds = new Set();
  for (const [index, row] of parsed.rows.entries()) {
    const definition = census.definitions[index];
    const expectedAssetId =
      `swf-definition-${String(definition.ordinal).padStart(5, "0")}`;
    invariant(!assetIds.has(row.asset_id),
      `${member.animationId}: duplicate candidate asset ID ${row.asset_id}`);
    assetIds.add(row.asset_id);
    const font = fonts.get(String(definition.characterId));
    invariant(
      row.asset_id === expectedAssetId &&
        row.swf_character_id === String(definition.characterId) &&
        row.library_symbol === (font?.exactName || "") &&
        row.type === definition.category &&
        row.source_file === sourcePath &&
        row.source_frame === "" &&
        row.exported_file === "" &&
        row.sha256 === definition.rawTagPayloadSha256 &&
        row.format === definition.tagName &&
        row.dimensions_or_bounds === "" &&
        row.font_glyphs === String(font?.glyphCount ?? "") &&
        row.transformation ===
          "none; machine census only; no renderer export" &&
        row.confidence === "machine-extracted-definition-candidate" &&
        row.license_or_provenance === "owner-provided SWF" &&
        row.notes.includes(
          `exactTagIdentitySha256=${definition.exactTagIdentitySha256}`,
        ) &&
        row.notes.includes("runtime reachability unresolved") &&
        row.notes.includes("placement and bounds unresolved") &&
        row.notes.includes("renderer suitability unresolved"),
      `${member.animationId}: definition-index row ${index + 2} is not the exact static candidate projection`,
    );
  }
}

export function renderSourceDerivedAssetInventory({
  animationId,
  definitionIndexPath,
  definitionIndexSha256,
  definitionRows,
}) {
  invariant(isSha256(definitionIndexSha256),
    `${animationId}: definition index SHA-256 is invalid`);
  const rows = definitionRows.map((row) => ({
    asset_id: row.asset_id,
    swf_character_id: row.swf_character_id,
    library_symbol: "",
    type: `structural-${row.type}-definition-candidate`,
    source_file: row.source_file,
    source_frame: "",
    exported_file: definitionIndexPath,
    sha256: definitionIndexSha256,
    format: `CSV definition-index record for ${row.format}`,
    dimensions_or_bounds: "",
    font_glyphs: row.font_glyphs,
    transformation:
      "projection only; no asset bytes exported, transformed, redrawn, or generated",
    confidence: "machine-extracted-structural-candidate",
    license_or_provenance: row.license_or_provenance,
    notes: [
      row.library_symbol
        ? `swfEmbeddedFontName=${row.library_symbol}`
        : null,
      row.notes,
      `machineDefinitionIndexSha256=${definitionIndexSha256}`,
      STRUCTURAL_BOUNDARY,
    ].filter(Boolean).join("; "),
  }));
  return Buffer.from(serializeCsv(ASSET_HEADERS, rows));
}

export function validateSourceDerivedAssetInventory({
  animationId,
  definitionIndexPath,
  definitionIndexSha256,
  expectedRows,
  bytes,
}) {
  const parsed = parseCsv(
    bytes.toString("utf8"),
    ASSET_HEADERS,
    `${animationId}: source-derived asset inventory`,
  );
  invariant(
    parsed.rows.length === expectedRows.length && parsed.rows.length > 0,
    `${animationId}: candidate asset row count drifted`,
  );
  for (const [index, row] of parsed.rows.entries()) {
    const source = expectedRows[index];
    invariant(
      row.asset_id === source.asset_id &&
        row.swf_character_id === source.swf_character_id &&
        row.library_symbol === "" &&
        row.type === `structural-${source.type}-definition-candidate` &&
        row.source_file === source.source_file &&
        row.source_frame === "" &&
        row.exported_file === definitionIndexPath &&
        row.sha256 === definitionIndexSha256 &&
        row.format === `CSV definition-index record for ${source.format}` &&
        row.dimensions_or_bounds === "" &&
        row.transformation.includes("no asset bytes exported") &&
        row.confidence === "machine-extracted-structural-candidate" &&
        row.notes.includes("not an authoritative original-runtime baseline") &&
        row.notes.includes("establishes no runtime reachability") &&
        row.notes.includes("human or owner acceptance") &&
        row.notes.includes("strict completion") &&
        row.notes.includes("publication"),
      `${animationId}: rendered candidate row ${index + 2} crossed the structural evidence boundary`,
    );
  }
  return parsed;
}

function categoryCounts(rows) {
  const counts = {};
  for (const row of rows) counts[row.type] = (counts[row.type] || 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right, "en")),
  );
}

function buildSuccessorReceipt({
  member,
  generatedBy,
  inputs,
  historicalCanonicalPreimage,
  outputBinding,
  definitionRows,
}) {
  return withFingerprint({
    schemaVersion: 1,
    artifactType:
      "g5-l4-source-derived-asset-inventory-candidate-receipt",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: {
      owner: "g5-l4-source-derived-asset-inventory-materializer",
      safeToReplaceOnlyWithThisMaterializer: true,
      canonicalCandidateFile: true,
      acceptanceEvidence: false,
    },
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    inputs,
    historicalCanonicalPreimage,
    output: {
      assetInventory: {
        ...outputBinding,
        rowCount: definitionRows.length,
      },
    },
    projection: {
      oneRowPerMachineDefinition: true,
      sourceDefinitionCandidateCount: definitionRows.length,
      categoryCounts: categoryCounts(definitionRows),
      sharedDefinitionIndexBindingOnly: true,
      rendererAssetExportCount: 0,
      authoritativeBaselineRowCount: 0,
      runtimePlacementDispositionCount: 0,
      assetUsageDispositionCount: 0,
      visualConfirmationCount: 0,
      rendererReadyAssetCount: 0,
      finalAssetSpecificationComplete: false,
    },
    limitations: [
      "Rows inventory hash-bound SWF definition candidates only; they do not assert root reachability, frame placement, visibility, scenario/language use, or instructional purpose.",
      "The exported_file column points to the shared machine definition-index CSV so each canonical row has a verifiable backing artifact; it is not a visual, editable, or renderer asset export.",
      "FLA authoring names/layers, bounds, masks, transforms, editable exports, renderer dispositions, original-runtime baselines, visual comparison, and listening remain unresolved.",
      "This successor leaves migration manifests, sources, original-runtime evidence, reviews, acceptance, strict completion, and publication untouched.",
    ],
    sourceAssetsChanged: false,
    migrationManifestChanged: false,
    originalRuntimeEvidenceChanged: false,
    humanReviewChanged: false,
    ownerReviewChanged: false,
    completionLedgerChanged: false,
    lessonReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
    acceptanceEffects: acceptanceEffects(),
  });
}

export function validateSuccessorReceipt(receipt, member) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        "g5-l4-source-derived-asset-inventory-candidate-receipt" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId &&
      receipt.generatedBy?.path === GENERATOR_PATH &&
      isSha256(receipt.generatedBy.sha256) &&
      receipt.ownership?.owner ===
        "g5-l4-source-derived-asset-inventory-materializer" &&
      receipt.ownership.safeToReplaceOnlyWithThisMaterializer === true &&
      receipt.ownership.canonicalCandidateFile === true &&
      receipt.ownership.acceptanceEvidence === false &&
      receipt.output?.assetInventory?.path ===
        `migrations/${member.animationId}/asset-inventory.csv` &&
      receipt.output.assetInventory.rowCount > 0 &&
      isSha256(receipt.output.assetInventory.sha256) &&
      receipt.projection?.oneRowPerMachineDefinition === true &&
      receipt.projection.sourceDefinitionCandidateCount ===
        receipt.output.assetInventory.rowCount &&
      receipt.projection.sharedDefinitionIndexBindingOnly === true &&
      receipt.projection.rendererAssetExportCount === 0 &&
      receipt.projection.authoritativeBaselineRowCount === 0 &&
      receipt.projection.runtimePlacementDispositionCount === 0 &&
      receipt.projection.assetUsageDispositionCount === 0 &&
      receipt.projection.visualConfirmationCount === 0 &&
      receipt.projection.rendererReadyAssetCount === 0 &&
      receipt.projection.finalAssetSpecificationComplete === false &&
      receipt.sourceAssetsChanged === false &&
      receipt.migrationManifestChanged === false &&
      receipt.originalRuntimeEvidenceChanged === false &&
      receipt.humanReviewChanged === false &&
      receipt.ownerReviewChanged === false &&
      receipt.completionLedgerChanged === false &&
      receipt.lessonReleaseLedgerChanged === false &&
      receipt.strictAcceptanceEffect === "none",
    `${member.animationId}: successor receipt identity or boundary is invalid`,
  );
  assertAllFalse(receipt.acceptanceEffects, `${member.animationId}: successor receipt`);
  validateFingerprint(receipt, `${member.animationId}: successor receipt`);
  return receipt;
}

async function verifyDescriptor(root, descriptor, label, options = {}) {
  invariant(
    descriptor && typeof descriptor.path === "string" &&
      Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 &&
      isSha256(descriptor.sha256),
    `${label}: descriptor is invalid`,
  );
  const record = await readOrdinaryBinding(root, descriptor.path, label, options);
  invariant(
    record.binding.bytes === descriptor.bytes &&
      record.binding.sha256 === descriptor.sha256,
    `${label}: descriptor is stale`,
  );
  return record;
}

export async function inspectOutput(
  root,
  relativePath,
  desiredBytes,
  allowedPaths,
) {
  invariant(allowedPaths.has(relativePath), `output path is not allowlisted: ${relativePath}`);
  const absolutePath = resolveProjectPath(root, relativePath, "output");
  const rootReal = await realpath(root);
  let cursor = root;
  const parents = [];
  for (const component of path.relative(root, path.dirname(absolutePath))
    .split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const info = await lstat(cursor);
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      `output ancestor must be a real directory: ${portable(path.relative(root, cursor))}`);
    invariant(contained(rootReal, await realpath(cursor)),
      `output ancestor resolves outside project root: ${portable(path.relative(root, cursor))}`);
    parents.push({
      absolutePath: cursor,
      identity: statIdentity(info, {includeSize: false}),
    });
  }
  if (!(await exists(absolutePath))) {
    return {
      absolutePath,
      relativePath,
      desiredBytes,
      priorBytes: null,
      priorIdentity: null,
      priorMode: null,
      parents,
    };
  }
  const before = await lstat(absolutePath);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `output must be an ordinary single-link file: ${relativePath}`);
  const priorIdentity = statIdentity(before);
  const priorBytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(sameIdentity(priorIdentity, statIdentity(after)),
    `output changed during preflight: ${relativePath}`);
  return {
    absolutePath,
    relativePath,
    desiredBytes,
    priorBytes,
    priorIdentity,
    priorMode: before.mode & 0o777,
    parents,
  };
}

async function assertOutputUnchanged(output) {
  for (const parent of output.parents) {
    const info = await lstat(parent.absolutePath);
    invariant(info.isDirectory() && !info.isSymbolicLink() &&
      sameIdentity(parent.identity, statIdentity(info, {includeSize: false})),
    `output ancestor changed during transaction: ${output.relativePath}`);
  }
  if (output.priorBytes === null) {
    invariant(!(await exists(output.absolutePath)),
      `output appeared during transaction: ${output.relativePath}`);
    return;
  }
  const info = await lstat(output.absolutePath);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
    sameIdentity(output.priorIdentity, statIdentity(info)),
  `output identity changed during transaction: ${output.relativePath}`);
  const bytes = await readFile(output.absolutePath);
  invariant(bytes.equals(output.priorBytes),
    `output bytes changed during transaction: ${output.relativePath}`);
}

async function stageOutput(output, kind, bytes, mode) {
  const stagePath = `${output.absolutePath}.${kind}-${process.pid}-${randomUUID()}`;
  await writeFile(stagePath, bytes, {flag: "wx", mode});
  await chmod(stagePath, mode);
  const info = await lstat(stagePath);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1,
    `staged file is unsafe: ${output.relativePath}`);
  return {path: stagePath, bytes, mode, identity: statIdentity(info)};
}

async function assertStageUnchanged(output, stage) {
  invariant(stage?.path && await exists(stage.path),
    `staged file disappeared: ${output.relativePath}`);
  const info = await lstat(stage.path);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
    sameIdentity(stage.identity, statIdentity(info)),
  `staged file identity changed: ${output.relativePath}`);
  const bytes = await readFile(stage.path);
  invariant(bytes.equals(stage.bytes),
    `staged file bytes changed: ${output.relativePath}`);
}

async function cleanupStage(output, stage) {
  if (!stage?.path || !(await exists(stage.path))) return;
  await assertStageUnchanged(output, stage);
  await unlink(stage.path);
}

export async function writeAssetInventoryTransaction(
  outputs,
  {inputGuards = [], transactionHooks = {}} = {},
) {
  invariant(Array.isArray(outputs), "transaction outputs must be an array");
  if (outputs.length === 0) return;
  invariant(new Set(outputs.map(({absolutePath}) => absolutePath)).size === outputs.length,
    "transaction contains duplicate outputs");
  for (const [name, hook] of Object.entries(transactionHooks)) {
    invariant(["afterStage", "beforeCommit", "beforeRollback"].includes(name) &&
      typeof hook === "function", `unsupported transaction hook: ${name}`);
  }
  const stages = [];
  const committed = [];
  let primaryError = null;
  const rollbackErrors = [];
  const cleanupErrors = [];
  try {
    for (const output of outputs) {
      await assertOutputUnchanged(output);
      stages.push({
        ...output,
        desiredStage: await stageOutput(output, "desired", output.desiredBytes, 0o644),
        backupStage: output.priorBytes === null
          ? null
          : await stageOutput(output, "backup", output.priorBytes, output.priorMode),
      });
    }
    await transactionHooks.afterStage?.({outputs: stages});
    for (const guard of inputGuards) await assertGuardUnchanged(guard);
    for (const [index, output] of stages.entries()) {
      await assertOutputUnchanged(output);
      for (const guard of inputGuards) await assertGuardIdentityUnchanged(guard);
      await assertStageUnchanged(output, output.desiredStage);
      await transactionHooks.beforeCommit?.({index, output});
      await rename(output.desiredStage.path, output.absolutePath);
      output.desiredStage.path = null;
      committed.push(output);
      const installed = await readFile(output.absolutePath);
      const info = await lstat(output.absolutePath);
      invariant(installed.equals(output.desiredBytes) &&
        info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
        (info.mode & 0o777) === 0o644,
      `installed output verification failed: ${output.relativePath}`);
    }
    for (const guard of inputGuards) await assertGuardUnchanged(guard);
  } catch (error) {
    primaryError = error;
    for (const [rollbackIndex, output] of [...committed].reverse().entries()) {
      try {
        await transactionHooks.beforeRollback?.({rollbackIndex, output, primaryError});
        if (output.priorBytes === null) {
          await unlink(output.absolutePath);
        } else {
          await assertStageUnchanged(output, output.backupStage);
          await rename(output.backupStage.path, output.absolutePath);
          output.backupStage.path = null;
          const restored = await readFile(output.absolutePath);
          invariant(restored.equals(output.priorBytes),
            `rollback bytes differ: ${output.relativePath}`);
        }
      } catch (rollbackError) {
        output.rollbackFailed = true;
        rollbackErrors.push(rollbackError);
      }
    }
  } finally {
    for (const output of stages) {
      for (const stage of [output.desiredStage, output.backupStage]) {
        if (output.rollbackFailed && stage === output.backupStage) continue;
        try {
          await cleanupStage(output, stage);
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
    }
  }
  if (primaryError) {
    if (rollbackErrors.length || cleanupErrors.length) {
      throw new AggregateError(
        [primaryError, ...rollbackErrors, ...cleanupErrors],
        "G5 L4 asset-inventory transaction failed with rollback or cleanup errors",
        {cause: primaryError},
      );
    }
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors,
      "G5 L4 asset-inventory transaction committed with cleanup errors");
  }
}

async function prepareMember({
  root,
  member,
  releaseBinding,
  template,
  generatedBy,
}) {
  const workspace = `migrations/${member.animationId}`;
  const paths = {
    manifest: `${workspace}/migration.json`,
    source: null,
    machineAudit: `${workspace}/audit/machine/report.json`,
    ffdecHeader: `${workspace}/audit/machine/ffdec-header.txt`,
    swfmillSummary: `${workspace}/audit/machine/swfmill-summary.json`,
    preRuntimeReceipt:
      `${workspace}/audit/machine/${PRE_RUNTIME_RECEIPT_NAME}`,
    m1Receipt:
      `${workspace}/audit/machine/${M1_RECONCILIATION_RECEIPT_NAME}`,
    census: `${workspace}/audit/machine/${CENSUS_NAME}`,
    definitionIndex: `${workspace}/audit/machine/${DEFINITION_INDEX_NAME}`,
    assetInventory: `${workspace}/asset-inventory.csv`,
    successorReceipt: `${workspace}/audit/machine/${SUCCESSOR_RECEIPT_NAME}`,
  };
  const manifest = await readOrdinaryBinding(root, paths.manifest,
    `${member.animationId}: migration manifest`, {json: true});
  validateManifest(member, manifest.value);
  paths.source = manifest.value.source.swf;
  const [
    source,
    preRuntimeReceipt,
    m1Receipt,
    census,
    definitionIndex,
  ] = await Promise.all([
    readOrdinaryBinding(root, paths.source,
      `${member.animationId}: physical SWF`),
    readOrdinaryBinding(root, paths.preRuntimeReceipt,
      `${member.animationId}: pre-runtime candidate receipt`, {json: true}),
    readOrdinaryBinding(root, paths.m1Receipt,
      `${member.animationId}: M1 reconciliation receipt`, {json: true}),
    readOrdinaryBinding(root, paths.census,
      `${member.animationId}: definition census`, {json: true}),
    readOrdinaryBinding(root, paths.definitionIndex,
      `${member.animationId}: definition index`),
  ]);
  invariant(
    source.binding.sha256 === member.source.sha256 &&
      manifest.value.source.swfSha256 === source.binding.sha256 &&
      member.assetId === `swf-${source.binding.sha256}`,
    `${member.animationId}: physical SWF hash identity drifted`,
  );
  const candidateReceipt = validatePreRuntimeCandidateReceipt(
    preRuntimeReceipt.value,
    member,
  );
  validateG5L4M1StaticReconciliationReceipt(m1Receipt.value, member);
  invariant(
    candidateReceipt.outputs?.assetDefinitionCensus?.path ===
      census.binding.path &&
      candidateReceipt.outputs.assetDefinitionCensus.bytes ===
      census.binding.bytes &&
      candidateReceipt.outputs.assetDefinitionCensus.sha256 ===
      census.binding.sha256 &&
      candidateReceipt.outputs?.definitionInventory?.path ===
      definitionIndex.binding.path &&
      candidateReceipt.outputs.definitionInventory.bytes ===
      definitionIndex.binding.bytes &&
      candidateReceipt.outputs.definitionInventory.sha256 ===
      definitionIndex.binding.sha256,
    `${member.animationId}: pre-runtime receipt no longer owns the definition artifacts`,
  );
  invariant(
    candidateReceipt.inputs?.canonicalAssetInventory?.bytes ===
      template.binding.bytes &&
      candidateReceipt.inputs.canonicalAssetInventory.sha256 ===
      template.binding.sha256,
    `${member.animationId}: historical candidate was not created from the canonical header-only preimage`,
  );
  validateCensus(member, census.value, census.binding, definitionIndex.binding);
  const definitionRows = parseCsv(
    definitionIndex.bytes.toString("utf8"),
    ASSET_HEADERS,
    `${member.animationId}: machine definition index`,
  ).rows;
  validateDefinitionIndex(
    member,
    manifest.value.source.swf,
    census.value,
    {rows: definitionRows},
  );

  const machineAuditDescriptor = candidateReceipt.inputs?.machineAudit;
  const ffdecDescriptor = candidateReceipt.inputs?.ffdecHeader;
  const swfmillDescriptor = candidateReceipt.inputs?.swfmillSummary;
  invariant(
    machineAuditDescriptor?.path === paths.machineAudit &&
      ffdecDescriptor?.path === paths.ffdecHeader &&
      swfmillDescriptor?.path === paths.swfmillSummary,
    `${member.animationId}: FFDec/swfmill/machine descriptor routing drifted`,
  );
  const [machineAudit, ffdecHeader, swfmillSummary] = await Promise.all([
    verifyDescriptor(root, machineAuditDescriptor,
      `${member.animationId}: machine audit`, {json: true}),
    verifyDescriptor(root, ffdecDescriptor,
      `${member.animationId}: FFDec header`),
    verifyDescriptor(root, swfmillDescriptor,
      `${member.animationId}: swfmill summary`, {json: true}),
  ]);
  invariant(
    machineAudit.value?.animationId === member.animationId &&
      machineAudit.value.source?.hashMatches === true &&
      machineAudit.value.source.expectedSha256 === source.binding.sha256 &&
      machineAudit.value.findings?.runtimeCrossCheck?.allMatch === true &&
      Number(swfmillSummary.value?.document?.version) ===
        census.value.sourceFormat.version &&
      Number(swfmillSummary.value?.header?.framerate) ===
        census.value.sourceFormat.fps &&
      Number(swfmillSummary.value?.header?.frames) ===
        census.value.sourceFormat.rootFrameCount,
    `${member.animationId}: current machine/FFDec/swfmill evidence is not source-bound`,
  );

  const desiredAssetBytes = renderSourceDerivedAssetInventory({
    animationId: member.animationId,
    definitionIndexPath: definitionIndex.binding.path,
    definitionIndexSha256: definitionIndex.binding.sha256,
    definitionRows,
  });
  validateSourceDerivedAssetInventory({
    animationId: member.animationId,
    definitionIndexPath: definitionIndex.binding.path,
    definitionIndexSha256: definitionIndex.binding.sha256,
    expectedRows: definitionRows,
    bytes: desiredAssetBytes,
  });
  const outputBinding = {
    path: paths.assetInventory,
    bytes: desiredAssetBytes.length,
    sha256: sha256(desiredAssetBytes),
  };
  const inputs = {
    lessonReleaseCatalog: releaseBinding,
    assetInventoryTemplate: template.binding,
    currentMigrationManifest: manifest.binding,
    physicalSourceSwf: source.binding,
    machineAudit: machineAudit.binding,
    ffdecHeader: ffdecHeader.binding,
    swfmillSummary: swfmillSummary.binding,
    preRuntimeCandidateReceipt: preRuntimeReceipt.binding,
    m1StaticReconciliationReceipt: m1Receipt.binding,
    assetDefinitionCensus: census.binding,
    machineDefinitionIndex: definitionIndex.binding,
  };
  const receiptDocument = buildSuccessorReceipt({
    member,
    generatedBy,
    inputs,
    historicalCanonicalPreimage:
      candidateReceipt.inputs.canonicalAssetInventory,
    outputBinding,
    definitionRows,
  });
  validateSuccessorReceipt(receiptDocument, member);
  const desiredReceiptBytes = Buffer.from(stableJson(receiptDocument));

  const currentAsset = await readOrdinaryBinding(root, paths.assetInventory,
    `${member.animationId}: current asset inventory`);
  invariant(
    currentAsset.bytes.equals(template.bytes) ||
      currentAsset.bytes.equals(desiredAssetBytes),
    `${member.animationId}: canonical asset inventory contains foreign or manually edited bytes`,
  );
  let priorSuccessorReceipt = null;
  if (await exists(path.join(root, paths.successorReceipt))) {
    priorSuccessorReceipt = await readOrdinaryBinding(root, paths.successorReceipt,
      `${member.animationId}: prior successor receipt`, {json: true});
    const prior = validateSuccessorReceipt(priorSuccessorReceipt.value, member);
    invariant(
      currentAsset.binding.path === prior.output.assetInventory.path &&
        currentAsset.binding.bytes === prior.output.assetInventory.bytes &&
        currentAsset.binding.sha256 === prior.output.assetInventory.sha256,
      `${member.animationId}: prior successor receipt does not own the current asset inventory`,
    );
  } else {
    invariant(currentAsset.bytes.equals(template.bytes),
      `${member.animationId}: populated asset inventory has no owning successor receipt`);
  }

  return {
    animationId: member.animationId,
    ordinal: member.ordinal,
    definitionCount: definitionRows.length,
    categoryCounts: categoryCounts(definitionRows),
    assetInventoryPath: paths.assetInventory,
    assetInventorySha256: outputBinding.sha256,
    successorReceiptPath: paths.successorReceipt,
    desiredAssetBytes,
    desiredReceiptBytes,
    guards: [
      manifest.guard,
      source.guard,
      preRuntimeReceipt.guard,
      m1Receipt.guard,
      census.guard,
      definitionIndex.guard,
      machineAudit.guard,
      ffdecHeader.guard,
      swfmillSummary.guard,
      ...(priorSuccessorReceipt ? [priorSuccessorReceipt.guard] : []),
    ],
    currentAsset,
  };
}

export async function materializeG5L4SourceDerivedAssetInventories({
  root = defaultProjectRoot,
  mode = "dry-run",
  transactionHooks = {},
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode),
    `unsupported mode: ${mode}`);
  const resolvedRoot = path.resolve(root);
  const [releaseRecord, template, generator, preRuntimeMaterializer,
    m1Reconciliation] = await Promise.all([
    readOrdinaryBinding(resolvedRoot, RELEASE_PATH,
      "lesson-release catalog", {json: true}),
    readOrdinaryBinding(resolvedRoot, ASSET_TEMPLATE_PATH,
      "asset-inventory template"),
    readOrdinaryBinding(resolvedRoot, GENERATOR_PATH,
      "asset-inventory materializer"),
    readOrdinaryBinding(resolvedRoot, PRE_RUNTIME_MATERIALIZER_PATH,
      "pre-runtime candidate materializer"),
    readOrdinaryBinding(resolvedRoot, M1_RECONCILIATION_PATH,
      "M1 reconciliation validator"),
  ]);
  invariant(
    template.bytes.equals(Buffer.from(serializeCsv(ASSET_HEADERS, []))),
    "canonical asset-inventory template changed",
  );
  const release = selectRelease(releaseRecord.value);
  const generatedBy = {
    path: GENERATOR_PATH,
    version: 1,
    bytes: generator.binding.bytes,
    sha256: generator.binding.sha256,
    dependencies: {
      preRuntimeCandidateMaterializer: preRuntimeMaterializer.binding,
      m1StaticReconciliationValidator: m1Reconciliation.binding,
      assetInventoryTemplate: template.binding,
    },
  };
  const prepared = [];
  for (const member of release.members) {
    prepared.push(await prepareMember({
      root: resolvedRoot,
      member,
      releaseBinding: releaseRecord.binding,
      template,
      generatedBy,
    }));
  }
  invariant(prepared.length === 55,
    "full release preflight did not prepare all 55 members");
  const allowedPaths = new Set(prepared.flatMap((member) => [
    member.assetInventoryPath,
    member.successorReceiptPath,
  ]));
  const outputs = [];
  for (const member of prepared) {
    outputs.push(await inspectOutput(
      resolvedRoot,
      member.assetInventoryPath,
      member.desiredAssetBytes,
      allowedPaths,
    ));
    outputs.push(await inspectOutput(
      resolvedRoot,
      member.successorReceiptPath,
      member.desiredReceiptBytes,
      allowedPaths,
    ));
  }
  const stale = outputs.filter(({priorBytes, desiredBytes}) =>
    priorBytes === null || !priorBytes.equals(desiredBytes));
  if (mode === "check") {
    invariant(stale.length === 0,
      `${stale[0]?.relativePath || "G5 L4 asset inventories"} is missing or stale`);
  } else if (mode === "apply" && stale.length > 0) {
    const guards = deduplicateGuards([
      releaseRecord.guard,
      template.guard,
      generator.guard,
      preRuntimeMaterializer.guard,
      m1Reconciliation.guard,
      ...prepared.flatMap(({guards}) => guards),
    ], stale.map(({absolutePath}) => absolutePath));
    await writeAssetInventoryTransaction(stale, {
      inputGuards: guards,
      transactionHooks,
    });
  }
  const definitionCount = prepared.reduce(
    (sum, member) => sum + member.definitionCount,
    0,
  );
  return {
    mode,
    releaseId: RELEASE_ID,
    memberCount: prepared.length,
    definitionCandidateRowCount: definitionCount,
    assetInventoryCount: 55,
    successorReceiptCount: 55,
    managedOutputCount: 110,
    staleOutputCount: stale.length,
    changedOutputCount: mode === "apply" ? stale.length : 0,
    members: prepared.map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      definitionCandidateRowCount: member.definitionCount,
      categoryCounts: member.categoryCounts,
      assetInventory: {
        path: member.assetInventoryPath,
        sha256: member.assetInventorySha256,
      },
      successorReceipt: member.successorReceiptPath,
    })),
    evidenceBoundary: {
      structuralStaticCandidateOnly: true,
      authoritativeOriginalRuntimeBaseline: false,
      rendererAssetExport: false,
      runtimeReachabilityOrPlacement: false,
      assetUsageOrVisualConfirmation: false,
      humanOrOwnerAcceptance: false,
      strictComplete: false,
      published: false,
    },
    sourceAssetsChanged: false,
    migrationManifestsChanged: false,
    completionLedgersChanged: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  let mode = "dry-run";
  let explicitMode = null;
  let root = defaultProjectRoot;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
    } else if (argument === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      root = path.resolve(argv[index + 1]);
      index += 1;
    } else {
      const candidate = argument === "--apply"
        ? "apply"
        : argument === "--check"
          ? "check"
          : argument === "--dry-run"
            ? "dry-run"
            : null;
      invariant(candidate, `unknown option: ${argument}`);
      invariant(explicitMode === null, "choose only one execution mode");
      explicitMode = candidate;
      mode = candidate;
    }
  }
  invariant(!help || (explicitMode === null && root === defaultProjectRoot),
    "--help cannot be combined with other options");
  return {mode, root, help};
}

function usage() {
  return [
    "Usage: node scripts/materialize-g5-l4-source-derived-asset-inventories.mjs [--dry-run|--apply|--check]",
    "",
    "Default mode is --dry-run. The generator operates on exactly the 55 members of",
    `${RELEASE_ID}. It writes only each G5 L4 asset-inventory.csv and its`,
    "audit/machine successor receipt. Rows are structural source-definition candidates",
    "backed by existing FFDec/swfmill/tag/manifest hashes; they are not renderer exports,",
    "authoritative baselines, visual confirmation, acceptance, strict completion, or publication.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG5L4SourceDerivedAssetInventories(options);
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
