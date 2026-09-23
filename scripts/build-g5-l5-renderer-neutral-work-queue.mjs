#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
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

import {validateScenarioInventory} from "./build-course-scenario-inventories.mjs";
import {
  validateG5L5CoverageTraceObligationPlan,
} from "./build-g5-l5-coverage-trace-obligation-matrix.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_STATE,
  validateG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";
import {
  createG5L5StaticCompositeProofResolver,
  validateG5L5ProofBoundFrameDomainDisposition,
} from "./g5-l5-proof-bound-frame-domain-disposition.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_RENDERER_NEUTRAL_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_RENDERER_NEUTRAL_STATE =
  "renderer-neutral-source-static-implementation-planning-only";
export const G5_L5_RENDERER_NEUTRAL_MEMBER_OUTPUT =
  "g5-l5-renderer-neutral-work-package.json";
export const G5_L5_RENDERER_NEUTRAL_REPORT_JSON =
  "reports/g5-l5-renderer-neutral-work-queue.json";
export const G5_L5_RENDERER_NEUTRAL_REPORT_MARKDOWN =
  "reports/g5-l5-renderer-neutral-work-queue.md";
export const G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS = Object.freeze([
  "visual-assets",
  "timeline-behavior",
  "controls-interactions",
  "text-localization",
  "audio",
  "external-side-effects",
  "shell-host",
]);

const GENERATOR_PATH =
  "scripts/build-g5-l5-renderer-neutral-work-queue.mjs";
const GENERATOR_VERSION = 1;
const RELEASE_PATH = "catalog/lesson-releases.json";
const EXPECTED_RELEASE_FINGERPRINT =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const EXPECTED_DEFINITION_CANDIDATES = 9767;
const EXPECTED_SCRIPT_CANDIDATES = 2456;
const EXPECTED_DEPENDENCY_CANDIDATES = 6;
const EXPECTED_DEPENDENCY_OCCURRENCES = 17;
const EXPECTED_DEFINITION_EXACT_GROUPS = 8458;
const EXPECTED_DEFINITION_REPEATED_GROUPS = 1123;
const EXPECTED_SCRIPT_EXACT_GROUPS = 510;
const EXPECTED_SCRIPT_REPEATED_GROUPS = 181;
const EXPECTED_DEPENDENCY_TYPE_GROUPS = 4;
const EXPECTED_DEPENDENCY_REPEATED_GROUPS = 1;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,127}$/;
const CSV_HEADER =
  "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes";

const DEFINITION_PACKAGE = Object.freeze({
  bitmap: "visual-assets",
  morph: "visual-assets",
  shape: "visual-assets",
  sprite: "timeline-behavior",
  button: "controls-interactions",
  font: "text-localization",
  text: "text-localization",
  sound: "audio",
});

const CONTROL_CATEGORIES = new Set([
  "calculator",
  "correct-outcome",
  "drag",
  "glossary-or-hyperlink",
  "keyboard-or-input",
  "popup",
  "replay-explicit",
  "wrong-outcome",
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "fullFrameComparisonAccepted",
  "humanVisualAccepted",
  "independentEngineeringAccepted",
  "ownerAccepted",
  "published",
  "rmseAccepted",
  "strictComplete",
]);

const AUTHORITY_FALSE_KEYS = Object.freeze([
  "canonicalAssetInventoryWriteAuthorized",
  "canonicalCoverageWriteAuthorized",
  "canonicalKeyframeWriteAuthorized",
  "evidencePromotionAuthorized",
  "guiExecutionAuthorized",
  "humanReviewAuthorized",
  "implementationAuthorized",
  "implementationStartAuthorized",
  "originalRuntimeExecutionAuthorized",
  "publicationAuthorized",
  "rendererSelectionAuthorized",
  "runtimeExecutionAuthorized",
]);

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

function isSha256(value) {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(
    contained(root, absolutePath) &&
      portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function statIdentity(information) {
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

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertRealAncestors(root, absolutePath, label) {
  const relative = path.relative(root, path.dirname(absolutePath));
  invariant(
    relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `${label}: parent escapes project root`,
  );
  const parts = relative.split(path.sep).filter(Boolean);
  const ancestors = [
    root,
    ...parts.map((_, index) =>
      path.join(root, ...parts.slice(0, index + 1))),
  ];
  for (const ancestor of ancestors) {
    const information = await lstat(ancestor, {bigint: true});
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be a real directory`,
    );
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(root),
    realpath(path.dirname(absolutePath)),
  ]);
  invariant(contained(realRoot, realParent), `${label}: real parent escapes root`);
}

async function readHandle(handle) {
  const chunks = [];
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (true) {
    const {bytesRead} = await handle.read(
      buffer,
      0,
      buffer.length,
      position,
    );
    if (!bytesRead) break;
    const chunk = Buffer.from(buffer.subarray(0, bytesRead));
    chunks.push(chunk);
    hash.update(chunk);
    position += bytesRead;
  }
  return {
    contents: Buffer.concat(chunks),
    bytes: position,
    sha256: hash.digest("hex"),
  };
}

export async function readRendererNeutralInput(
  root,
  relativePath,
  {json = false, label = relativePath} = {},
) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  await assertRealAncestors(root, absolutePath, label);
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") {
      throw new Error(`${label}: required file is missing (${relativePath})`);
    }
    throw error;
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let observed;
  let afterHandle;
  try {
    const beforeHandle = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(before), statIdentity(beforeHandle)),
      `${label}: changed before stable read`,
    );
    observed = await readHandle(handle);
    afterHandle = await handle.stat({bigint: true});
    invariant(
      sameIdentity(statIdentity(beforeHandle), statIdentity(afterHandle)),
      `${label}: changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameIdentity(statIdentity(afterHandle), statIdentity(after)) &&
      observed.bytes === Number(after.size),
    `${label}: changed after stable read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(observed.contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    ...observed,
    document,
    stat: statIdentity(after),
  };
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function sameDescriptor(actual, record) {
  return actual?.path === record.path &&
    actual.bytes === record.bytes &&
    actual.sha256 === record.sha256;
}

function assertAllFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function fingerprintWithout(document, field) {
  const projected = structuredClone(document);
  delete projected[field];
  return sha256(Buffer.from(stableJson(projected)));
}

function generatedArtifactFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  delete projected.generatedMarker;
  return sha256(Buffer.from(stableJson(projected)));
}

export function withRendererNeutralArtifactFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  return {
    ...projected,
    artifactFingerprintSha256: sha256(Buffer.from(stableJson(projected))),
  };
}

export function withRendererNeutralReportFingerprint(document) {
  const projected = structuredClone(document);
  delete projected.reportFingerprintSha256;
  return {
    ...projected,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(projected))),
  };
}

function selectRelease(catalog) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "release catalog is malformed",
  );
  const matches = catalog.releases.filter(
    ({releaseId}) => releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 57 &&
      release.members?.length === 57,
    "G5 L5 56-page-plus-Shell release scope drifted",
  );
  invariant(
    release.members.every(
      (member, index) =>
        member.ordinal === index + 1 &&
        SAFE_ID_PATTERN.test(member.animationId) &&
        member.assetId === `swf-${member.source?.sha256}` &&
        isSha256(member.source?.sha256),
    ),
    "G5 L5 member order or source identity drifted",
  );
  const fingerprintSha256 = sha256(Buffer.from(stableJson(release)));
  invariant(
    fingerprintSha256 === EXPECTED_RELEASE_FINGERPRINT,
    "G5 L5 release fingerprint drifted",
  );
  return {release, fingerprintSha256};
}

function memberPaths(animationId) {
  const workspace = `migrations/${animationId}`;
  return {
    manifest: `${workspace}/migration.json`,
    m1Receipt:
      `${workspace}/audit/machine/g5-l5-m1-static-reconciliation-receipt.json`,
    candidateAssetCensus:
      `${workspace}/audit/machine/swf-asset-definition-census.json`,
    candidateDefinitionInventory:
      `${workspace}/audit/machine/swf-definition-inventory.csv`,
    canonicalScriptInventory: `${workspace}/audit/script-inventory.json`,
    canonicalDependencyInventory:
      `${workspace}/audit/dependency-inventory.json`,
    scenarioInventory: `${workspace}/audit/scenario-inventory.json`,
    frameDomainDisposition:
      `${workspace}/audit/frame-domain-disposition.json`,
    coverageTracePlan:
      `${workspace}/audit/machine/g5-l5-coverage-trace-obligation-plan.json`,
    strictReadiness: `${workspace}/audit/strict-readiness.json`,
  };
}

export function g5L5RendererNeutralWorkPackagePath(animationId) {
  invariant(
    SAFE_ID_PATTERN.test(animationId),
    `unsafe animation id: ${animationId}`,
  );
  return `migrations/${animationId}/audit/machine/${G5_L5_RENDERER_NEUTRAL_MEMBER_OUTPUT}`;
}

function validateManifest(manifest, member) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256,
    `${member.animationId}: current manifest identity/status drifted`,
  );
  invariant(
    manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "" &&
      manifest.implementation?.routeFile === "" &&
      manifest.implementation?.component === "" &&
      manifest.implementation?.timelineModule === "" &&
      manifest.implementation?.testFile === "",
    `${member.animationId}: renderer or implementation has been selected`,
  );
  invariant(
    ["engineeringReview", "humanVisualReview", "ownerReview"].every(
      (key) => manifest.acceptance?.[key]?.decision === "pending",
    ),
    `${member.animationId}: manifest review state advanced`,
  );
}

function validateM1Receipt(receipt, member) {
  const paths = memberPaths(member.animationId);
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        "g5-l5-m1-static-reconciliation-receipt" &&
      receipt.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId,
    `${member.animationId}: M1 static reconciliation receipt identity drifted`,
  );
  invariant(
    receipt.releaseMembership?.ordinal === member.ordinal &&
      receipt.releaseMembership?.releaseRole === member.releaseRole &&
      receipt.releaseMembership?.batchId === member.batchId &&
      receipt.releaseMembership?.shardId === member.shardId,
    `${member.animationId}: M1 receipt release membership drifted`,
  );
  invariant(
    receipt.reconciliation?.applied === true &&
      receipt.reconciliation?.machineOnlyStatic === true &&
      receipt.reconciliation?.canonicalOutputCount === 4 &&
      receipt.summary?.manifestStaticFactsReconciled === true &&
      receipt.summary?.migrationBriefStaticReconciled === true &&
      receipt.summary?.complexityResolved === false &&
      receipt.summary?.rendererSelected === false &&
      receipt.summary?.runtimeReachabilityResolved === false &&
      Number.isSafeInteger(receipt.summary?.scriptCount) &&
      Number.isSafeInteger(receipt.summary?.dependencyApiCandidateCount) &&
      Number.isSafeInteger(receipt.summary?.dependencyOccurrenceCount),
    `${member.animationId}: M1 receipt summary crossed a protected boundary`,
  );
  invariant(
    receipt.inputBindingSemantics?.candidateArtifacts ===
      "historical-at-adoption-do-not-require-current-path-byte-identity" &&
      receipt.inputBindingSemantics?.protectedCanonicalPreimages ===
        "current-through-adoption-recorded-as-output-before-or-immutable-input" &&
      receipt.execution?.runtimeSessionsExecuted === 0 &&
      receipt.execution?.guiApplicationsLaunched === 0 &&
      receipt.execution?.legacyEndpointsExecuted === 0,
    `${member.animationId}: M1 receipt binding/execution boundary drifted`,
  );
  assertAllFalse(
    receipt.acceptanceEffects,
    Object.keys(receipt.acceptanceEffects || {}),
    `${member.animationId}: M1 receipt acceptance`,
  );
  const expectedOutputs = {
    migrationManifest: paths.manifest,
    migrationBrief: `migrations/${member.animationId}/MIGRATION_BRIEF.md`,
    scriptInventory: paths.canonicalScriptInventory,
    dependencyInventory: paths.canonicalDependencyInventory,
  };
  for (const [name, expectedPath] of Object.entries(expectedOutputs)) {
    const output = receipt.outputs?.[name];
    invariant(
      output?.after?.path === expectedPath &&
        output.after.exists === true &&
        Number.isSafeInteger(output.after.bytes) &&
        output.after.bytes > 0 &&
        isSha256(output.after.sha256) &&
        output.before?.path === expectedPath &&
        typeof output.before.exists === "boolean" &&
        Number.isSafeInteger(output.before.bytes),
      `${member.animationId}: M1 receipt output binding drifted for ${name}`,
    );
  }
  invariant(
    fingerprintWithout(receipt, "receiptFingerprintSha256") ===
      receipt.receiptFingerprintSha256,
    `${member.animationId}: M1 receipt fingerprint is invalid`,
  );
}

function validateCensus(census, member) {
  invariant(
    census?.schemaVersion === 1 &&
      census.artifactType === "g5-l5-swf-asset-definition-census-candidate" &&
      census.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      census.animationId === member.animationId &&
      census.assetId === member.assetId &&
      Array.isArray(census.definitions),
    `${member.animationId}: candidate asset census identity drifted`,
  );
  invariant(
    census.summary?.definitionCount === census.definitions.length &&
      census.summary?.canonicalAssetInventoryRowsAdded === 0 &&
      census.summary?.rendererAssetExportCount === 0 &&
      census.summary?.runtimePlacementDispositionCount === 0 &&
      census.summary?.finalCanonicalAssetSpecificationComplete === false &&
      census.method?.authorizesRendererReuse === false &&
      census.method?.establishesRuntimeVisibility === false &&
      census.method?.exportsRendererAssets === false,
    `${member.animationId}: candidate census crossed renderer/canonical boundary`,
  );
  assertAllFalse(
    census.acceptanceEffects,
    Object.keys(census.acceptanceEffects || {}),
    `${member.animationId}: census acceptance`,
  );
  for (const definition of census.definitions) {
    invariant(
      Object.hasOwn(DEFINITION_PACKAGE, definition.category) &&
        Number.isSafeInteger(definition.characterId) &&
        Number.isSafeInteger(definition.definitionDepth) &&
        Number.isSafeInteger(definition.ordinal) &&
        Number.isSafeInteger(definition.payloadLength) &&
        typeof definition.containerPath === "string" &&
        typeof definition.tagName === "string" &&
        isSha256(definition.rawTagPayloadSha256) &&
        isSha256(definition.exactTagIdentitySha256),
      `${member.animationId}: definition candidate is not exactly classifiable`,
    );
  }
  invariant(
    generatedArtifactFingerprint(census) ===
        census.artifactFingerprintSha256 &&
      census.generatedMarker ===
        `sha256:${census.artifactFingerprintSha256}`,
    `${member.animationId}: candidate census fingerprint is invalid`,
  );
}

function parseAndValidateDefinitionInventory(record, census, member) {
  const lines = record.contents.toString("utf8").trimEnd().split("\n");
  invariant(
    lines[0] === CSV_HEADER && lines.length === census.definitions.length + 1,
    `${member.animationId}: definition inventory shape/count drifted`,
  );
  const rows = lines.slice(1).map((line, index) => {
    const columns = line.split(",");
    invariant(
      columns.length === 15,
      `${member.animationId}: definition CSV row ${index + 2} is malformed`,
    );
    const definition = census.definitions[index];
    invariant(
      columns[0] === `swf-definition-${String(definition.ordinal).padStart(5, "0")}` &&
        Number(columns[1]) === definition.characterId &&
        columns[3] === definition.category &&
        columns[7] === definition.rawTagPayloadSha256 &&
        columns[8] === definition.tagName &&
        columns[9] === "" &&
        columns[11] ===
          "none; machine census only; no renderer export" &&
        columns[12] === "machine-extracted-definition-candidate" &&
        columns[14].includes(
          `exactTagIdentitySha256=${definition.exactTagIdentitySha256}`,
        ) &&
        columns[14].includes("runtime reachability unresolved") &&
        columns[14].includes("placement and bounds unresolved"),
      `${member.animationId}: definition CSV row ${index + 2} drifted from census`,
    );
    return {assetId: columns[0]};
  });
  return rows;
}

function validateCanonicalScriptInventory(inventory, member) {
  invariant(
    inventory?.schemaVersion === 1 &&
      inventory.artifactType === "g5-l5-canonical-static-script-inventory" &&
      inventory.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      inventory.animationId === member.animationId &&
      inventory.assetId === member.assetId &&
      Array.isArray(inventory.scripts) &&
      inventory.summary?.scriptCount === inventory.scripts.length &&
      inventory.summary?.machineExtractedStatic === true &&
      inventory.summary?.runtimeReachabilityResolved === false &&
      inventory.summary?.completeReachableScriptInventory === false,
    `${member.animationId}: canonical static script inventory drifted`,
  );
  invariant(
    inventory.execution?.runtimeSessionsExecuted === 0 &&
      inventory.execution?.guiApplicationsLaunched === 0 &&
      inventory.execution?.legacyEndpointsExecuted === 0,
    `${member.animationId}: script inventory records forbidden execution`,
  );
  for (const script of inventory.scripts) {
    invariant(
      SAFE_ID_PATTERN.test(script.scriptId) &&
        typeof script.sourcePath === "string" &&
        script.sourcePath.length > 0 &&
        Number.isSafeInteger(script.bytes) &&
        Number.isSafeInteger(script.lineCount) &&
        isSha256(script.sha256) &&
        Array.isArray(script.externalApiOccurrences) &&
        script.runtimeReachability === "unresolved" &&
        script.scenario === "unresolved" &&
        script.naturalTrace === "unresolved",
      `${member.animationId}: canonical script candidate crossed runtime boundary`,
    );
  }
  assertAllFalse(
    inventory.acceptanceEffects,
    Object.keys(inventory.acceptanceEffects || {}),
    `${member.animationId}: script acceptance`,
  );
  invariant(
    generatedArtifactFingerprint(inventory) ===
        inventory.artifactFingerprintSha256 &&
      inventory.generatedMarker ===
        `sha256:${inventory.artifactFingerprintSha256}`,
    `${member.animationId}: script inventory fingerprint is invalid`,
  );
}

function validateCanonicalDependencyInventory(inventory, member) {
  invariant(
    inventory?.schemaVersion === 1 &&
      inventory.artifactType ===
        "g5-l5-canonical-static-dependency-inventory" &&
      inventory.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      inventory.animationId === member.animationId &&
      inventory.assetId === member.assetId &&
      Array.isArray(inventory.candidates) &&
      inventory.summary?.apiCandidateCount === inventory.candidates.length &&
      inventory.summary?.machineExtractedStatic === true &&
      inventory.summary?.executedLegacyEndpointCount === 0 &&
      inventory.summary?.runtimeDependencyClearance === false,
    `${member.animationId}: canonical dependency inventory drifted`,
  );
  invariant(
    inventory.execution?.runtimeSessionsExecuted === 0 &&
      inventory.execution?.guiApplicationsLaunched === 0 &&
      inventory.execution?.legacyEndpointsExecuted === 0,
    `${member.animationId}: dependency inventory records forbidden execution`,
  );
  for (const candidate of inventory.candidates) {
    invariant(
      typeof candidate.api === "string" &&
        candidate.api.length > 0 &&
        Number.isSafeInteger(candidate.occurrences) &&
        candidate.occurrences > 0 &&
        Array.isArray(candidate.scriptIds) &&
        candidate.scriptIds.length > 0 &&
        candidate.runtimeReachability === "unresolved" &&
        candidate.endpointOrTarget ===
          "withheld-unresolved-static-source-not-executed" &&
        candidate.securityDisposition === "pending-human-review",
      `${member.animationId}: dependency candidate crossed execution boundary`,
    );
  }
  assertAllFalse(
    inventory.acceptanceEffects,
    Object.keys(inventory.acceptanceEffects || {}),
    `${member.animationId}: dependency acceptance`,
  );
  invariant(
    generatedArtifactFingerprint(inventory) ===
        inventory.artifactFingerprintSha256 &&
      inventory.generatedMarker ===
        `sha256:${inventory.artifactFingerprintSha256}`,
    `${member.animationId}: dependency inventory fingerprint is invalid`,
  );
}

function validateFrameDomainScenarioAlignment(
  disposition,
  scenario,
  member,
) {
  const includedScenarioTimelines = scenario.timelineInventory.filter(
    ({structuralReachability}) =>
      structuralReachability !== "not-proven-by-root-placement-graph",
  );
  const excludedScenarioTimelineCount =
    scenario.timelineInventory.length - includedScenarioTimelines.length;
  invariant(
    disposition?.schemaVersion === 1 &&
      disposition.animationId === member.animationId &&
      disposition.status ===
        "structurally-enumerated-dispositions-unresolved" &&
      disposition.migrationStatusChanged === false &&
      Array.isArray(disposition.timelines) &&
      disposition.timelines.length ===
        disposition.summary?.enumeratedTimelineCount &&
      disposition.summary?.enumeratedTimelineCount +
          disposition.summary?.excludedNotProvenTimelineCount ===
        disposition.summary?.inventoryTimelineCount &&
      disposition.timelines[0]?.timelineId === "root",
    `${member.animationId}: frame-domain disposition inventory drifted`,
  );
  invariant(
    excludedScenarioTimelineCount ===
        disposition.summary.excludedNotProvenTimelineCount &&
      disposition.timelines.length === includedScenarioTimelines.length &&
      disposition.timelines.every(
        (timeline, index) =>
          timeline.timelineId === includedScenarioTimelines[index].timelineId &&
          timeline.frameCount ===
            includedScenarioTimelines[index].frameCount,
      ),
    `${member.animationId}: frame-domain disposition/scenario drifted`,
  );
  invariant(
    disposition.strictAcceptanceEffect.startsWith("none;"),
    `${member.animationId}: frame-domain disposition advanced acceptance`,
  );
}

function validateCoverageBindings(plan, records, member) {
  validateG5L5CoverageTraceObligationPlan(plan, member);
  const expected = {
    lessonReleaseCatalog: records.release,
    migrationManifest: records.manifest,
    m1StaticReconciliationReceipt: records.m1Receipt,
    scenarioInventory: records.scenarioInventory,
    frameDomainDisposition: records.frameDomainDisposition,
    strictReadiness: records.strictReadiness,
  };
  for (const [key, record] of Object.entries(expected)) {
    invariant(
      sameDescriptor(plan.bindings?.[key], record),
      `${member.animationId}: coverage plan ${key} binding drifted`,
    );
  }
}

function validateStrictReadiness(strict, member) {
  validateG5L5StaticStrictReadiness(strict, member);
  invariant(
    strict.state === G5_L5_STATIC_STRICT_READINESS_STATE &&
      strict.implementationReadiness?.rendererSelected === false &&
      strict.implementationReadiness?.implementationAuthorized === false &&
      strict.implementationReadiness?.implementationStarted === false &&
      strict.acceptance?.strictMigrationComplete === false &&
      strict.acceptance?.published === false &&
      strict.conclusion?.strictAcceptanceReady === false &&
      strict.conclusion?.completionClaimAllowed === false,
    `${member.animationId}: strict readiness crossed implementation/acceptance boundary`,
  );
}

function scenarioScriptUnits(scenario, member) {
  const units = [
    ...(scenario.interactions?.handlers || []).map((unit) => ({
      kind: "handler",
      unit,
    })),
    ...(scenario.interactions?.nonEventScripts || []).map((unit) => ({
      kind: "non-event",
      unit,
    })),
  ];
  const byPath = new Map();
  for (const entry of units) {
    invariant(
      typeof entry.unit.script === "string" &&
        !byPath.has(entry.unit.script),
      `${member.animationId}: scenario script path is missing or duplicated`,
    );
    byPath.set(entry.unit.script, entry);
  }
  return byPath;
}

function hostReferenceSignal(unit) {
  const references = unit.signals?.scopeReferences || [];
  return references.some((reference) =>
    /(?:^|[._])(?:_level\d+|_root|_parent|InternalPreloader|course|section|page)(?:[._]|$)/i
      .test(reference));
}

function textLocalizationSignal(unit) {
  const searchable = [
    ...(unit.signals?.calls || []).map(({target}) => target),
    ...(unit.signals?.assignments || []).map(({target}) => target),
    ...(unit.signals?.scopeReferences || []),
  ].filter((value) => typeof value === "string").join("\n");
  return /(?:english|spanish|espanol|español|language|locale|caption|subtitle|label|(?:^|[._])txt(?:[._]|$))/i
    .test(searchable);
}

export function classifyRendererNeutralScript({
  member,
  script,
  scenarioEntry,
}) {
  const unit = scenarioEntry.unit;
  const categories = new Set(unit.categories || []);
  const basis = [];
  let packageId;
  if (
    script.externalApiOccurrences.length > 0 ||
    categories.has("side-effect") ||
    (unit.signals?.sideEffects || []).length > 0
  ) {
    packageId = "external-side-effects";
    basis.push("static-external-api-or-side-effect-signal");
  } else if (categories.has("audio-control")) {
    packageId = "audio";
    basis.push("scenario-category:audio-control");
  } else if (textLocalizationSignal(unit)) {
    packageId = "text-localization";
    basis.push("static-text-or-language-name-signal");
  } else if (
    scenarioEntry.kind === "handler" ||
    [...categories].some((category) => CONTROL_CATEGORIES.has(category))
  ) {
    packageId = "controls-interactions";
    basis.push(
      scenarioEntry.kind === "handler" ?
        "scenario-unit:event-handler" :
        "static-control-category",
    );
  } else if (
    member.releaseRole === "course-shell" ||
    hostReferenceSignal(unit)
  ) {
    packageId = "shell-host";
    basis.push(
      member.releaseRole === "course-shell" ?
        "release-role:course-shell" :
        "static-host-scope-reference",
    );
  } else {
    packageId = "timeline-behavior";
    basis.push(
      categories.size > 0 ?
        `static-categories:${[...categories].sort().join("+")}` :
        "static-script-without-more-specific-safe-route",
    );
  }
  return {
    packageId,
    classificationState: "source-static-review-route-only",
    basis,
  };
}

function reuseMap(entries, keySelector, memberSelector) {
  const groups = new Map();
  for (const entry of entries) {
    const key = keySelector(entry);
    const group = groups.get(key) || {occurrenceCount: 0, members: new Set()};
    group.occurrenceCount += 1;
    group.members.add(memberSelector(entry));
    groups.set(key, group);
  }
  return groups;
}

function reuseDescriptor(groups, key) {
  const group = groups.get(key);
  invariant(group, `missing release reuse group: ${key}`);
  return {
    exactMatchKey: key,
    releaseOccurrenceCount: group.occurrenceCount,
    releaseMemberCount: group.members.size,
    repeatedExactMatch: group.occurrenceCount > 1,
    reuseAuthorized: false,
    meaning:
      "Exact type/hash identity is a review candidate only; it does not establish placement, bounds, runtime reachability, instructional equivalence, renderer suitability, or reuse authorization.",
  };
}

function emptyPackage(packageId) {
  return {
    packageId,
    state: "source-static-review-queue-only",
    renderer: "undecided",
    implementationAuthorized: false,
    implementationStarted: false,
    candidates: {
      definitions: [],
      scripts: [],
      dependencies: [],
    },
    counts: {
      definitionCandidates: 0,
      scriptCandidates: 0,
      dependencyCandidates: 0,
      dependencyOccurrences: 0,
    },
    unresolvedBoundary: {
      placement: "unresolved",
      bounds: "unresolved",
      runtimeReachability: "unresolved",
      instructionalBeats: "unresolved",
      rendererSuitability: "unresolved",
    },
  };
}

function definitionCandidate({
  definition,
  inventoryRow,
  reuseGroups,
}) {
  return {
    candidateId: inventoryRow.assetId,
    category: definition.category,
    tagName: definition.tagName,
    tagCode: definition.tagCode,
    characterId: definition.characterId,
    containerPath: definition.containerPath,
    definitionDepth: definition.definitionDepth,
    tagOrdinal: definition.ordinal,
    payloadBytes: definition.payloadLength,
    rawTagPayloadSha256: definition.rawTagPayloadSha256,
    exactTagIdentitySha256: definition.exactTagIdentitySha256,
    exactHashReuseAnalysis: reuseDescriptor(
      reuseGroups,
      definition.exactTagIdentitySha256,
    ),
    classification: {
      state: "exact-definition-type-route-only",
      basis: [
        `definition-category:${definition.category}`,
        `tag-name:${definition.tagName}`,
      ],
    },
    unresolved: [
      "placement",
      "bounds",
      "runtime-reachability",
      "instructional-beats",
      "renderer-suitability",
    ],
  };
}

function scriptCandidate({
  member,
  script,
  scenarioEntry,
  reuseGroups,
}) {
  const classification = classifyRendererNeutralScript({
    member,
    script,
    scenarioEntry,
  });
  const unit = scenarioEntry.unit;
  return {
    scriptId: script.scriptId,
    sourcePath: script.sourcePath,
    bytes: script.bytes,
    lineCount: script.lineCount,
    sha256: script.sha256,
    scenarioUnit: {
      id: unit.id,
      kind: scenarioEntry.kind,
      categories: [...(unit.categories || [])].sort(),
      eventCount: (unit.event || []).length,
      callCount: (unit.signals?.calls || []).length,
      assignmentCount: (unit.signals?.assignments || []).length,
      transitionCount: (unit.signals?.transitions || []).length,
      conditionalCount: (unit.signals?.conditionals || []).length,
      randomCallCount: (unit.signals?.randomCalls || []).length,
      sideEffectCount: (unit.signals?.sideEffects || []).length,
      fingerprintSha256: sha256(Buffer.from(stableJson(unit))),
    },
    externalApiOccurrenceCount: script.externalApiOccurrences.length,
    classification,
    exactHashReuseAnalysis: reuseDescriptor(reuseGroups, script.sha256),
    unresolved: [
      "runtime-reachability",
      "scenario-binding",
      "natural-trace",
      "source-target-semantics",
      "instructional-beats",
    ],
  };
}

function dependencyCandidate({candidate, index, reuseGroups}) {
  return {
    candidateId:
      `dependency-${String(index + 1).padStart(2, "0")}-${candidate.api.toLowerCase()}`,
    api: candidate.api,
    occurrenceCount: candidate.occurrences,
    scriptIds: [...candidate.scriptIds].sort(),
    endpointOrTarget: "unresolved",
    runtimeReachability: "unresolved",
    securityDisposition: "pending-human-review",
    classification: {
      state: "exact-api-type-route-only",
      basis: [`static-api-name:${candidate.api}`],
    },
    exactTypeReuseAnalysis: reuseDescriptor(reuseGroups, candidate.api),
    executionAuthorized: false,
  };
}

function countPackageCandidates(workPackage) {
  workPackage.counts = {
    definitionCandidates: workPackage.candidates.definitions.length,
    scriptCandidates: workPackage.candidates.scripts.length,
    dependencyCandidates: workPackage.candidates.dependencies.length,
    dependencyOccurrences: workPackage.candidates.dependencies.reduce(
      (total, candidate) => total + candidate.occurrenceCount,
      0,
    ),
  };
}

function workPackagesForMember(memberInput, releaseReuse) {
  const workPackages = new Map(
    G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS.map((id) => [
      id,
      emptyPackage(id),
    ]),
  );
  for (const [index, definition] of
    memberInput.census.document.definitions.entries()) {
    const packageId = DEFINITION_PACKAGE[definition.category];
    workPackages.get(packageId).candidates.definitions.push(
      definitionCandidate({
        definition,
        inventoryRow: memberInput.definitionRows[index],
        reuseGroups: releaseReuse.definitions,
      }),
    );
  }
  for (const script of memberInput.script.document.scripts) {
    const scenarioEntry = memberInput.scenarioUnits.get(script.sourcePath);
    invariant(
      scenarioEntry,
      `${memberInput.member.animationId}: script lacks scenario static record (${script.sourcePath})`,
    );
    const candidate = scriptCandidate({
      member: memberInput.member,
      script,
      scenarioEntry,
      reuseGroups: releaseReuse.scripts,
    });
    workPackages.get(candidate.classification.packageId)
      .candidates.scripts.push(candidate);
  }
  for (const [index, candidate] of
    memberInput.dependency.document.candidates.entries()) {
    workPackages.get("external-side-effects").candidates.dependencies.push(
      dependencyCandidate({
        candidate,
        index,
        reuseGroups: releaseReuse.dependencies,
      }),
    );
  }
  const ordered = G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS.map(
    (id) => workPackages.get(id),
  );
  for (const workPackage of ordered) countPackageCandidates(workPackage);
  return ordered;
}

function buildMemberDocument({
  globals,
  memberInput,
  workPackages,
}) {
  const {member, records, frameDomainFacts} = memberInput;
  const definitionCandidateCount = workPackages.reduce(
    (total, item) => total + item.counts.definitionCandidates,
    0,
  );
  const scriptCandidateCount = workPackages.reduce(
    (total, item) => total + item.counts.scriptCandidates,
    0,
  );
  const dependencyCandidateCount = workPackages.reduce(
    (total, item) => total + item.counts.dependencyCandidates,
    0,
  );
  const dependencyOccurrenceCount = workPackages.reduce(
    (total, item) => total + item.counts.dependencyOccurrences,
    0,
  );
  const base = {
    schemaVersion: 1,
    artifactType: "g5-l5-renderer-neutral-source-static-work-package",
    releaseId: G5_L5_RENDERER_NEUTRAL_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    state: G5_L5_RENDERER_NEUTRAL_STATE,
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: globals.generator.bytes,
      sha256: globals.generator.sha256,
      deterministic: true,
    },
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
      releaseFingerprintSha256: globals.releaseFingerprintSha256,
    },
    bindings: {
      releaseCatalog: descriptor(globals.release),
      currentManifest: descriptor(records.manifest),
      m1StaticReconciliationReceipt: descriptor(records.m1Receipt),
      candidateAssetDefinitionCensus:
        descriptor(records.candidateAssetCensus),
      candidateDefinitionInventory:
        descriptor(records.candidateDefinitionInventory),
      canonicalStaticScriptInventory:
        descriptor(records.canonicalScriptInventory),
      canonicalStaticDependencyInventory:
        descriptor(records.canonicalDependencyInventory),
      scenarioInventory: descriptor(records.scenarioInventory),
      frameDomainDisposition: descriptor(records.frameDomainDisposition),
      staticDispositionEvidence:
        records.staticDispositionEvidence
          ? descriptor(records.staticDispositionEvidence)
          : null,
      coverageTraceObligationPlan: descriptor(records.coverageTracePlan),
      strictReadiness: descriptor(records.strictReadiness),
    },
    frameDomainAccounting: {
      structurallyReachableChildTimelineCount:
        frameDomainFacts.reachableChildTimelineCount,
      evidenceBoundCompositeFrameDomainCount:
        frameDomainFacts.evidenceBoundCompositeChildCount,
      unresolvedFrameDomainCount: frameDomainFacts.unresolvedChildCount,
      excludedNotProvenTimelineCount:
        frameDomainFacts.excludedNotProvenTimelineCount,
      proofBoundCompositeOnly:
        frameDomainFacts.evidenceBoundCompositeChildCount > 0,
    },
    candidateAccounting: {
      definitionCandidateCount,
      routedDefinitionCandidateCount: definitionCandidateCount,
      canonicalStaticScriptCandidateCount: scriptCandidateCount,
      routedScriptCandidateCount: scriptCandidateCount,
      dependencyCandidateCount,
      routedDependencyCandidateCount: dependencyCandidateCount,
      dependencyOccurrenceCount,
      routedDependencyOccurrenceCount: dependencyOccurrenceCount,
      workPackageCount: workPackages.length,
    },
    workPackages,
    reuseBoundary: {
      exactDefinitionHashAnalysisAllowed: true,
      exactScriptHashAnalysisAllowed: true,
      exactDependencyApiTypeAnalysisAllowed: true,
      reuseAuthorized: false,
      placementEquivalenceClaimed: false,
      runtimeEquivalenceClaimed: false,
      instructionalEquivalenceClaimed: false,
    },
    unresolvedBoundary: {
      placement: "unresolved",
      bounds: "unresolved",
      runtimeReachability: "unresolved",
      instructionalBeats: "unresolved",
      rendererSuitability: "unresolved",
      canonicalAssetSelection: "unresolved",
      implementationPlan: "unresolved",
    },
    authority: {
      machineOnlyStaticPlanningAllowed: true,
      canonicalAssetInventoryWriteAuthorized: false,
      canonicalCoverageWriteAuthorized: false,
      canonicalKeyframeWriteAuthorized: false,
      evidencePromotionAuthorized: false,
      guiExecutionAuthorized: false,
      humanReviewAuthorized: false,
      implementationAuthorized: false,
      implementationStartAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
      publicationAuthorized: false,
      rendererSelectionAuthorized: false,
      runtimeExecutionAuthorized: false,
    },
    execution: {
      runnable: false,
      commands: [],
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      browsersLaunched: 0,
      legacyEndpointsExecuted: 0,
      implementationActionsExecuted: 0,
      canonicalAssetInventoryWrites: 0,
      canonicalKeyframeWrites: 0,
      canonicalCoverageWrites: 0,
    },
    protectedMutations: {
      migrationManifestChanged: false,
      canonicalAssetInventoryChanged: false,
      canonicalKeyframesChanged: false,
      canonicalCoverageChanged: false,
      rendererSelected: false,
      implementationStarted: false,
      runtimeOrGuiStarted: false,
      acceptanceAdvanced: false,
      strictCompletionAdvanced: false,
      publicationChanged: false,
    },
    acceptanceEffects: Object.fromEntries(
      ACCEPTANCE_KEYS.map((key) => [key, false]),
    ),
  };
  return withRendererNeutralArtifactFingerprint(base);
}

export function validateG5L5RendererNeutralWorkPackage(document, member) {
  const label = member?.animationId || document?.animationId || "unknown";
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l5-renderer-neutral-source-static-work-package" &&
      document.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      document.animationId === member.animationId &&
      document.assetId === member.assetId &&
      document.state === G5_L5_RENDERER_NEUTRAL_STATE,
    `${label}: renderer-neutral work package identity drifted`,
  );
  invariant(
    document.generatedBy?.path === GENERATOR_PATH &&
      document.generatedBy?.version === GENERATOR_VERSION &&
      isSha256(document.generatedBy?.sha256) &&
      Number.isSafeInteger(document.generatedBy?.bytes),
    `${label}: generator binding drifted`,
  );
  invariant(
    document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership?.releaseRole === member.releaseRole &&
      document.releaseMembership?.shardId === member.shardId &&
      document.releaseMembership?.releaseFingerprintSha256 ===
        EXPECTED_RELEASE_FINGERPRINT,
    `${label}: release membership drifted`,
  );
  const expectedBindingKeys = [
    "candidateAssetDefinitionCensus",
    "candidateDefinitionInventory",
    "canonicalStaticDependencyInventory",
    "canonicalStaticScriptInventory",
    "coverageTraceObligationPlan",
    "currentManifest",
    "frameDomainDisposition",
    "m1StaticReconciliationReceipt",
    "releaseCatalog",
    "scenarioInventory",
    "staticDispositionEvidence",
    "strictReadiness",
  ];
  invariant(
    Object.keys(document.bindings || {}).sort().join("\0") ===
        expectedBindingKeys.sort().join("\0") &&
      Object.values(document.bindings).every(
        (binding) =>
          binding === null ||
          (typeof binding.path === "string" &&
            Number.isSafeInteger(binding.bytes) &&
            binding.bytes > 0 &&
            isSha256(binding.sha256)),
      ),
    `${label}: source binding set drifted`,
  );
  const frameDomains = document.frameDomainAccounting;
  invariant(
    Number.isSafeInteger(
      frameDomains?.structurallyReachableChildTimelineCount,
    ) &&
      Number.isSafeInteger(
        frameDomains.evidenceBoundCompositeFrameDomainCount,
      ) &&
      Number.isSafeInteger(frameDomains.unresolvedFrameDomainCount) &&
      Number.isSafeInteger(frameDomains.excludedNotProvenTimelineCount) &&
      frameDomains.structurallyReachableChildTimelineCount > 0 &&
      frameDomains.evidenceBoundCompositeFrameDomainCount >= 0 &&
      frameDomains.unresolvedFrameDomainCount > 0 &&
      frameDomains.excludedNotProvenTimelineCount >= 0 &&
      frameDomains.evidenceBoundCompositeFrameDomainCount +
          frameDomains.unresolvedFrameDomainCount ===
        frameDomains.structurallyReachableChildTimelineCount &&
      frameDomains.proofBoundCompositeOnly ===
        (frameDomains.evidenceBoundCompositeFrameDomainCount > 0) &&
      (frameDomains.evidenceBoundCompositeFrameDomainCount > 0) ===
        (document.bindings.staticDispositionEvidence !== null),
    `${label}: proof-bound frame-domain accounting drifted`,
  );
  invariant(
    Array.isArray(document.workPackages) &&
      document.workPackages.length === 7 &&
      document.workPackages.every(
        (item, index) =>
          item.packageId === G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS[index] &&
          item.renderer === "undecided" &&
          item.implementationAuthorized === false &&
          item.implementationStarted === false &&
          item.state === "source-static-review-queue-only" &&
          Array.isArray(item.candidates?.definitions) &&
          Array.isArray(item.candidates?.scripts) &&
          Array.isArray(item.candidates?.dependencies) &&
          item.counts?.definitionCandidates ===
            item.candidates.definitions.length &&
          item.counts?.scriptCandidates === item.candidates.scripts.length &&
          item.counts?.dependencyCandidates ===
            item.candidates.dependencies.length &&
          item.counts?.dependencyOccurrences ===
            item.candidates.dependencies.reduce(
              (total, candidate) => total + candidate.occurrenceCount,
              0,
            ),
      ),
    `${label}: work-package order or accounting drifted`,
  );
  const definitions = document.workPackages.flatMap(
    (item) => item.candidates.definitions,
  );
  const scripts = document.workPackages.flatMap(
    (item) => item.candidates.scripts,
  );
  const dependencies = document.workPackages.flatMap(
    (item) => item.candidates.dependencies,
  );
  for (const workPackage of document.workPackages) {
    invariant(
      workPackage.candidates.definitions.every(
        (candidate) =>
          DEFINITION_PACKAGE[candidate.category] === workPackage.packageId,
      ),
      `${label}: definition candidate routed to the wrong work package`,
    );
    invariant(
      workPackage.candidates.scripts.every(
        (candidate) =>
          candidate.classification?.packageId === workPackage.packageId,
      ),
      `${label}: script candidate routed to the wrong work package`,
    );
    invariant(
      workPackage.candidates.dependencies.length === 0 ||
        workPackage.packageId === "external-side-effects",
      `${label}: dependency candidate routed outside external-side-effects`,
    );
    invariant(
      workPackage.unresolvedBoundary?.placement === "unresolved" &&
        workPackage.unresolvedBoundary?.bounds === "unresolved" &&
        workPackage.unresolvedBoundary?.runtimeReachability ===
          "unresolved" &&
        workPackage.unresolvedBoundary?.instructionalBeats ===
          "unresolved" &&
        workPackage.unresolvedBoundary?.rendererSuitability ===
          "unresolved",
      `${label}: work-package unresolved boundary was promoted`,
    );
  }
  invariant(
    document.candidateAccounting?.definitionCandidateCount ===
        definitions.length &&
      document.candidateAccounting?.routedDefinitionCandidateCount ===
        definitions.length &&
      document.candidateAccounting?.canonicalStaticScriptCandidateCount ===
        scripts.length &&
      document.candidateAccounting?.routedScriptCandidateCount ===
        scripts.length &&
      document.candidateAccounting?.dependencyCandidateCount ===
        dependencies.length &&
      document.candidateAccounting?.routedDependencyCandidateCount ===
        dependencies.length &&
      document.candidateAccounting?.dependencyOccurrenceCount ===
        dependencies.reduce(
          (total, candidate) => total + candidate.occurrenceCount,
          0,
        ) &&
      document.candidateAccounting?.routedDependencyOccurrenceCount ===
        document.candidateAccounting.dependencyOccurrenceCount &&
      document.candidateAccounting?.workPackageCount === 7,
    `${label}: routed candidate accounting drifted`,
  );
  invariant(
    definitions.every(
      (candidate) =>
        isSha256(candidate.rawTagPayloadSha256) &&
        isSha256(candidate.exactTagIdentitySha256) &&
        candidate.exactHashReuseAnalysis?.reuseAuthorized === false &&
        candidate.unresolved?.includes("placement") &&
        candidate.unresolved?.includes("bounds") &&
        candidate.unresolved?.includes("runtime-reachability") &&
        candidate.unresolved?.includes("instructional-beats"),
    ) &&
      scripts.every(
        (candidate) =>
          isSha256(candidate.sha256) &&
          isSha256(candidate.scenarioUnit?.fingerprintSha256) &&
          candidate.classification?.classificationState ===
            "source-static-review-route-only" &&
          candidate.exactHashReuseAnalysis?.reuseAuthorized === false &&
          candidate.unresolved?.includes("runtime-reachability") &&
          candidate.unresolved?.includes("instructional-beats"),
      ) &&
      dependencies.every(
        (candidate) =>
          candidate.endpointOrTarget === "unresolved" &&
          candidate.runtimeReachability === "unresolved" &&
          candidate.executionAuthorized === false &&
          candidate.exactTypeReuseAnalysis?.reuseAuthorized === false,
      ),
    `${label}: candidate inference/reuse boundary drifted`,
  );
  invariant(
    document.reuseBoundary?.reuseAuthorized === false &&
      document.reuseBoundary?.placementEquivalenceClaimed === false &&
      document.reuseBoundary?.runtimeEquivalenceClaimed === false &&
      document.reuseBoundary?.instructionalEquivalenceClaimed === false,
    `${label}: reuse boundary was promoted`,
  );
  invariant(
    document.unresolvedBoundary?.placement === "unresolved" &&
      document.unresolvedBoundary?.bounds === "unresolved" &&
      document.unresolvedBoundary?.runtimeReachability === "unresolved" &&
      document.unresolvedBoundary?.instructionalBeats === "unresolved" &&
      document.unresolvedBoundary?.rendererSuitability === "unresolved" &&
      document.unresolvedBoundary?.canonicalAssetSelection ===
        "unresolved" &&
      document.unresolvedBoundary?.implementationPlan === "unresolved",
    `${label}: member unresolved boundary was promoted`,
  );
  assertAllFalse(document.authority, AUTHORITY_FALSE_KEYS, `${label}: authority`);
  invariant(
    document.authority?.machineOnlyStaticPlanningAllowed === true,
    `${label}: machine-only static planning marker drifted`,
  );
  invariant(
    document.execution?.runnable === false &&
      Array.isArray(document.execution?.commands) &&
      document.execution.commands.length === 0 &&
      [
        "runtimeSessionsExecuted",
        "guiApplicationsLaunched",
        "browsersLaunched",
        "legacyEndpointsExecuted",
        "implementationActionsExecuted",
        "canonicalAssetInventoryWrites",
        "canonicalKeyframeWrites",
        "canonicalCoverageWrites",
      ].every((key) => document.execution[key] === 0),
    `${label}: execution/canonical-write boundary drifted`,
  );
  assertAllFalse(
    document.protectedMutations,
    Object.keys(document.protectedMutations || {}),
    `${label}: protected mutations`,
  );
  assertAllFalse(
    document.acceptanceEffects,
    ACCEPTANCE_KEYS,
    `${label}: acceptance`,
  );
  invariant(
    fingerprintWithout(document, "artifactFingerprintSha256") ===
      document.artifactFingerprintSha256,
    `${label}: artifact fingerprint is invalid`,
  );
  return true;
}

async function loadMemberInput(
  root,
  globals,
  member,
  resolveStaticCompositeProof,
) {
  const paths = memberPaths(member.animationId);
  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, relativePath]) => [
      key,
      await readRendererNeutralInput(root, relativePath, {
        json: !relativePath.endsWith(".csv"),
        label: `${member.animationId}: ${key}`,
      }),
    ]),
  );
  const records = Object.fromEntries(entries);
  const manifest = records.manifest.document;
  const receipt = records.m1Receipt.document;
  const census = records.candidateAssetCensus.document;
  const script = records.canonicalScriptInventory.document;
  const dependency = records.canonicalDependencyInventory.document;
  const scenario = records.scenarioInventory.document;
  const disposition = records.frameDomainDisposition.document;
  const coveragePlan = records.coverageTracePlan.document;
  const strict = records.strictReadiness.document;

  validateManifest(manifest, member);
  validateM1Receipt(receipt, member);
  validateCensus(census, member);
  validateCanonicalScriptInventory(script, member);
  validateCanonicalDependencyInventory(dependency, member);
  validateScenarioInventory(scenario);
  validateFrameDomainScenarioAlignment(disposition, scenario, member);
  const frameDomainFacts =
    await validateG5L5ProofBoundFrameDomainDisposition({
      disposition,
      member,
      scenarioSha256: records.scenarioInventory.sha256,
      resolveStaticCompositeProof,
    });
  if (frameDomainFacts.staticEvidenceBinding) {
    const staticDispositionEvidence = await readRendererNeutralInput(
      root,
      frameDomainFacts.staticEvidenceBinding.path,
      {
        json: true,
        label: `${member.animationId}: static composite evidence`,
      },
    );
    invariant(
      staticDispositionEvidence.bytes ===
          frameDomainFacts.staticEvidenceBinding.bytes &&
        staticDispositionEvidence.sha256 ===
          frameDomainFacts.staticEvidenceBinding.sha256,
      `${member.animationId}: static composite evidence bytes drifted after proof validation`,
    );
    records.staticDispositionEvidence = staticDispositionEvidence;
  }
  validateStrictReadiness(strict, member);

  invariant(
    sameDescriptor(receipt.outputs?.migrationManifest?.after, records.manifest) &&
      sameDescriptor(
        receipt.outputs?.scriptInventory?.after,
        records.canonicalScriptInventory,
      ) &&
      sameDescriptor(
        receipt.outputs?.dependencyInventory?.after,
        records.canonicalDependencyInventory,
      ) &&
      sameDescriptor(
        receipt.inputs?.candidateAssetCensus,
        records.candidateAssetCensus,
      ) &&
      sameDescriptor(
        receipt.inputs?.candidateDefinitionInventory,
        records.candidateDefinitionInventory,
      ),
    `${member.animationId}: M1 receipt/current static inputs drifted`,
  );
  invariant(
    script.summary.scriptCount === receipt.summary.scriptCount &&
      dependency.summary.apiCandidateCount ===
        receipt.summary.dependencyApiCandidateCount &&
      dependency.summary.occurrenceCount ===
        receipt.summary.dependencyOccurrenceCount,
    `${member.animationId}: M1/static inventory counts drifted`,
  );
  validateCoverageBindings(coveragePlan, {...records, release: globals.release}, member);
  const definitionRows = parseAndValidateDefinitionInventory(
    records.candidateDefinitionInventory,
    census,
    member,
  );
  const scenarioUnits = scenarioScriptUnits(scenario, member);
  invariant(
    script.scripts.length === scenarioUnits.size &&
      script.scripts.every(({sourcePath}) => scenarioUnits.has(sourcePath)),
    `${member.animationId}: canonical scripts/scenario records are not one-to-one`,
  );
  return {
    member,
    records,
    census: records.candidateAssetCensus,
    script: records.canonicalScriptInventory,
    dependency: records.canonicalDependencyInventory,
    frameDomainFacts,
    definitionRows,
    scenarioUnits,
  };
}

function releaseReuseMaps(memberInputs) {
  const definitions = memberInputs.flatMap((item) =>
    item.census.document.definitions.map((definition) => ({
      member: item.member,
      definition,
    })));
  const scripts = memberInputs.flatMap((item) =>
    item.script.document.scripts.map((script) => ({
      member: item.member,
      script,
    })));
  const dependencies = memberInputs.flatMap((item) =>
    item.dependency.document.candidates.map((dependency) => ({
      member: item.member,
      dependency,
    })));
  return {
    definitions: reuseMap(
      definitions,
      ({definition}) => definition.exactTagIdentitySha256,
      ({member}) => member.animationId,
    ),
    scripts: reuseMap(
      scripts,
      ({script}) => script.sha256,
      ({member}) => member.animationId,
    ),
    dependencies: reuseMap(
      dependencies,
      ({dependency}) => dependency.api,
      ({member}) => member.animationId,
    ),
  };
}

function reuseSummary(groups) {
  return {
    exactGroupCount: groups.size,
    repeatedExactGroupCount: [...groups.values()].filter(
      ({occurrenceCount}) => occurrenceCount > 1,
    ).length,
    reuseAuthorizedCount: 0,
  };
}

function aggregatePackageTotals(memberPackages) {
  return G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS.map((packageId) => {
    const packages = memberPackages.map(({document}) =>
      document.workPackages.find((item) => item.packageId === packageId));
    return {
      packageId,
      memberPackageCount: packages.length,
      definitionCandidateCount: packages.reduce(
        (total, item) => total + item.counts.definitionCandidates,
        0,
      ),
      scriptCandidateCount: packages.reduce(
        (total, item) => total + item.counts.scriptCandidates,
        0,
      ),
      dependencyCandidateCount: packages.reduce(
        (total, item) => total + item.counts.dependencyCandidates,
        0,
      ),
      dependencyOccurrenceCount: packages.reduce(
        (total, item) => total + item.counts.dependencyOccurrences,
        0,
      ),
      rendererSelectedCount: 0,
      implementationAuthorizedCount: 0,
      implementationStartedCount: 0,
    };
  });
}

function buildReport(globals, memberPackages, releaseReuse) {
  const packageTotals = aggregatePackageTotals(memberPackages);
  const summary = {
    releaseMemberCount: memberPackages.length,
    pageCount: 56,
    shellCount: 1,
    memberWorkPackageCount: memberPackages.length * 7,
    definitionCandidateCount: packageTotals.reduce(
      (total, item) => total + item.definitionCandidateCount,
      0,
    ),
    routedDefinitionCandidateCount: packageTotals.reduce(
      (total, item) => total + item.definitionCandidateCount,
      0,
    ),
    canonicalStaticScriptCandidateCount: packageTotals.reduce(
      (total, item) => total + item.scriptCandidateCount,
      0,
    ),
    routedScriptCandidateCount: packageTotals.reduce(
      (total, item) => total + item.scriptCandidateCount,
      0,
    ),
    dependencyCandidateCount: packageTotals.reduce(
      (total, item) => total + item.dependencyCandidateCount,
      0,
    ),
    routedDependencyCandidateCount: packageTotals.reduce(
      (total, item) => total + item.dependencyCandidateCount,
      0,
    ),
    dependencyOccurrenceCount: packageTotals.reduce(
      (total, item) => total + item.dependencyOccurrenceCount,
      0,
    ),
    routedDependencyOccurrenceCount: packageTotals.reduce(
      (total, item) => total + item.dependencyOccurrenceCount,
      0,
    ),
    rendererUndecidedCount: memberPackages.length,
    implementationAuthorizedCount: 0,
    implementationStartedCount: 0,
    canonicalAssetInventoryWriteCount: 0,
    canonicalKeyframeWriteCount: 0,
    canonicalCoverageWriteCount: 0,
    runtimeSessionCount: 0,
    guiLaunchCount: 0,
    acceptanceCompleteCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
    structurallyReachableChildTimelineCount: memberPackages.reduce(
      (total, {document}) =>
        total +
        document.frameDomainAccounting
          .structurallyReachableChildTimelineCount,
      0,
    ),
    evidenceBoundCompositeFrameDomainCount: memberPackages.reduce(
      (total, {document}) =>
        total +
        document.frameDomainAccounting
          .evidenceBoundCompositeFrameDomainCount,
      0,
    ),
    unresolvedFrameDomainCount: memberPackages.reduce(
      (total, {document}) =>
        total + document.frameDomainAccounting.unresolvedFrameDomainCount,
      0,
    ),
    excludedNotProvenTimelineCount: memberPackages.reduce(
      (total, {document}) =>
        total +
        document.frameDomainAccounting.excludedNotProvenTimelineCount,
      0,
    ),
  };
  const base = {
    schemaVersion: 1,
    reportType: "g5-l5-renderer-neutral-source-static-work-queue",
    title: "G5 L5 renderer-neutral source-static implementation work queue",
    releaseId: G5_L5_RENDERER_NEUTRAL_RELEASE_ID,
    state: G5_L5_RENDERER_NEUTRAL_STATE,
    generatedBy: {
      path: GENERATOR_PATH,
      version: GENERATOR_VERSION,
      bytes: globals.generator.bytes,
      sha256: globals.generator.sha256,
      deterministic: true,
    },
    release: {
      titleDisplay: globals.releaseDocument.titleDisplay,
      memberCount: 57,
      pageCount: 56,
      shellCount: 1,
      publicationMode: "atomic",
      fingerprintSha256: globals.releaseFingerprintSha256,
      catalog: descriptor(globals.release),
    },
    summary,
    workPackageTotals: packageTotals,
    exactReuseAnalysis: {
      definitionsByExactTagIdentitySha256:
        reuseSummary(releaseReuse.definitions),
      scriptsBySha256: reuseSummary(releaseReuse.scripts),
      dependenciesByExactApiType: reuseSummary(releaseReuse.dependencies),
      reuseAuthorizedCount: 0,
      boundary:
        "Exact type/hash matches are review candidates only and do not establish placement, bounds, runtime reachability, instructional equivalence, renderer suitability, or implementation reuse.",
    },
    members: memberPackages.map(({member, document, output, rendered}) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      output: {
        path: output,
        bytes: Buffer.byteLength(rendered),
        sha256: sha256(Buffer.from(rendered)),
        mode: "0644",
        artifactFingerprintSha256: document.artifactFingerprintSha256,
      },
      candidateAccounting: document.candidateAccounting,
      frameDomainAccounting: document.frameDomainAccounting,
      packageCounts: Object.fromEntries(
        document.workPackages.map((item) => [
          item.packageId,
          item.counts,
        ]),
      ),
      renderer: "undecided",
      implementationAuthorized: false,
      implementationStarted: false,
      strictComplete: false,
      published: false,
    })),
    authority: {
      machineOnlyStaticPlanningAllowed: true,
      canonicalAssetInventoryWriteAuthorized: false,
      canonicalCoverageWriteAuthorized: false,
      canonicalKeyframeWriteAuthorized: false,
      evidencePromotionAuthorized: false,
      guiExecutionAuthorized: false,
      humanReviewAuthorized: false,
      implementationAuthorized: false,
      implementationStartAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
      publicationAuthorized: false,
      rendererSelectionAuthorized: false,
      runtimeExecutionAuthorized: false,
    },
    execution: {
      runnable: false,
      commands: [],
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      browsersLaunched: 0,
      implementationActionsExecuted: 0,
      canonicalAssetInventoryWrites: 0,
      canonicalKeyframeWrites: 0,
      canonicalCoverageWrites: 0,
    },
    acceptanceEffects: Object.fromEntries(
      ACCEPTANCE_KEYS.map((key) => [key, false]),
    ),
  };
  return withRendererNeutralReportFingerprint(base);
}

export function validateG5L5RendererNeutralWorkQueue(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-renderer-neutral-source-static-work-queue" &&
      report.releaseId === G5_L5_RENDERER_NEUTRAL_RELEASE_ID &&
      report.state === G5_L5_RENDERER_NEUTRAL_STATE &&
      report.generatedBy?.path === GENERATOR_PATH &&
      report.release?.fingerprintSha256 === EXPECTED_RELEASE_FINGERPRINT &&
      report.release?.memberCount === 57 &&
      report.release?.pageCount === 56 &&
      report.release?.shellCount === 1 &&
      report.members?.length === 57 &&
      report.workPackageTotals?.length === 7,
    "renderer-neutral queue report identity/scope drifted",
  );
  invariant(
    report.workPackageTotals.every(
      (item, index) =>
        item.packageId === G5_L5_RENDERER_NEUTRAL_WORK_PACKAGE_IDS[index] &&
        item.memberPackageCount === 57 &&
        item.rendererSelectedCount === 0 &&
        item.implementationAuthorizedCount === 0 &&
        item.implementationStartedCount === 0,
    ),
    "renderer-neutral aggregate package order/authority drifted",
  );
  const summary = report.summary;
  invariant(
    summary?.releaseMemberCount === 57 &&
      summary.pageCount === 56 &&
      summary.shellCount === 1 &&
      summary.memberWorkPackageCount === 399 &&
      summary.definitionCandidateCount === EXPECTED_DEFINITION_CANDIDATES &&
      summary.routedDefinitionCandidateCount ===
        EXPECTED_DEFINITION_CANDIDATES &&
      summary.canonicalStaticScriptCandidateCount ===
        EXPECTED_SCRIPT_CANDIDATES &&
      summary.routedScriptCandidateCount === EXPECTED_SCRIPT_CANDIDATES &&
      summary.dependencyCandidateCount === EXPECTED_DEPENDENCY_CANDIDATES &&
      summary.routedDependencyCandidateCount ===
        EXPECTED_DEPENDENCY_CANDIDATES &&
      summary.dependencyOccurrenceCount ===
        EXPECTED_DEPENDENCY_OCCURRENCES &&
      summary.routedDependencyOccurrenceCount ===
        EXPECTED_DEPENDENCY_OCCURRENCES &&
      summary.structurallyReachableChildTimelineCount === 1047 &&
      summary.evidenceBoundCompositeFrameDomainCount === 696 &&
      summary.unresolvedFrameDomainCount === 351 &&
      summary.excludedNotProvenTimelineCount === 185 &&
      summary.evidenceBoundCompositeFrameDomainCount +
          summary.unresolvedFrameDomainCount ===
        summary.structurallyReachableChildTimelineCount &&
      summary.rendererUndecidedCount === 57 &&
      [
        "implementationAuthorizedCount",
        "implementationStartedCount",
        "canonicalAssetInventoryWriteCount",
        "canonicalKeyframeWriteCount",
        "canonicalCoverageWriteCount",
        "runtimeSessionCount",
        "guiLaunchCount",
        "acceptanceCompleteCount",
        "strictCompleteCount",
        "publishedCount",
      ].every((key) => summary[key] === 0),
    "renderer-neutral aggregate counts or protected boundary drifted",
  );
  invariant(
    report.members.every(
      (member, index) =>
        member.ordinal === index + 1 &&
        member.output?.mode === "0644" &&
        isSha256(member.output?.sha256) &&
        isSha256(member.output?.artifactFingerprintSha256) &&
        member.frameDomainAccounting
          ?.evidenceBoundCompositeFrameDomainCount +
            member.frameDomainAccounting?.unresolvedFrameDomainCount ===
          member.frameDomainAccounting
            ?.structurallyReachableChildTimelineCount &&
        member.renderer === "undecided" &&
        member.implementationAuthorized === false &&
        member.implementationStarted === false &&
        member.strictComplete === false &&
        member.published === false,
    ),
    "renderer-neutral member summary drifted",
  );
  invariant(
    report.exactReuseAnalysis?.reuseAuthorizedCount === 0 &&
      report.exactReuseAnalysis?.boundary ===
        "Exact type/hash matches are review candidates only and do not establish placement, bounds, runtime reachability, instructional equivalence, renderer suitability, or implementation reuse." &&
      report.exactReuseAnalysis?.definitionsByExactTagIdentitySha256
        ?.exactGroupCount === EXPECTED_DEFINITION_EXACT_GROUPS &&
      report.exactReuseAnalysis?.definitionsByExactTagIdentitySha256
        ?.repeatedExactGroupCount ===
          EXPECTED_DEFINITION_REPEATED_GROUPS &&
      report.exactReuseAnalysis?.definitionsByExactTagIdentitySha256
        ?.reuseAuthorizedCount === 0 &&
      report.exactReuseAnalysis?.scriptsBySha256?.exactGroupCount ===
        EXPECTED_SCRIPT_EXACT_GROUPS &&
      report.exactReuseAnalysis?.scriptsBySha256
        ?.repeatedExactGroupCount === EXPECTED_SCRIPT_REPEATED_GROUPS &&
      report.exactReuseAnalysis?.scriptsBySha256?.reuseAuthorizedCount ===
        0 &&
      report.exactReuseAnalysis?.dependenciesByExactApiType
        ?.exactGroupCount === EXPECTED_DEPENDENCY_TYPE_GROUPS &&
      report.exactReuseAnalysis?.dependenciesByExactApiType
        ?.repeatedExactGroupCount ===
          EXPECTED_DEPENDENCY_REPEATED_GROUPS &&
      report.exactReuseAnalysis?.dependenciesByExactApiType
        ?.reuseAuthorizedCount === 0,
    "renderer-neutral exact reuse analysis was promoted or drifted",
  );
  assertAllFalse(report.authority, AUTHORITY_FALSE_KEYS, "report authority");
  invariant(
    report.authority?.machineOnlyStaticPlanningAllowed === true &&
      report.execution?.runnable === false &&
      report.execution?.commands?.length === 0 &&
      [
        "runtimeSessionsExecuted",
        "guiApplicationsLaunched",
        "browsersLaunched",
        "implementationActionsExecuted",
        "canonicalAssetInventoryWrites",
        "canonicalKeyframeWrites",
        "canonicalCoverageWrites",
      ].every((key) => report.execution[key] === 0),
    "renderer-neutral report execution boundary drifted",
  );
  assertAllFalse(report.acceptanceEffects, ACCEPTANCE_KEYS, "report acceptance");
  invariant(
    fingerprintWithout(report, "reportFingerprintSha256") ===
      report.reportFingerprintSha256,
    "renderer-neutral report fingerprint is invalid",
  );
  return true;
}

export function renderG5L5RendererNeutralWorkQueueMarkdown(report) {
  validateG5L5RendererNeutralWorkQueue(report);
  const packageRows = report.workPackageTotals.map((item) =>
    `| ${item.packageId} | ${item.definitionCandidateCount} | ${item.scriptCandidateCount} | ${item.dependencyCandidateCount} | ${item.dependencyOccurrenceCount} | undecided | 0 |`,
  ).join("\n");
  const memberRows = report.members.map((member) =>
    `| ${member.ordinal} | \`${member.animationId}\` | ${member.candidateAccounting.definitionCandidateCount} | ${member.candidateAccounting.canonicalStaticScriptCandidateCount} | ${member.candidateAccounting.dependencyCandidateCount} | undecided | false |`,
  ).join("\n");
  return `<!-- generated-by: ${GENERATOR_PATH} -->
# G5 L5 renderer-neutral source-static implementation work queue

状态：\`${report.state}\`。这是仅供复核的静态规划队列，不选择 renderer，不授权或启动实现，也不执行 runtime/GUI。

## 严格边界

- 57 个发布成员（56 页 + Shell），每个成员固定 7 个 renderer-neutral work packages。
- 结构可达 child domains 1,047 个：仅 696 个有逐项静态证据绑定，可并入 parent composite；其余 351 个保持 unresolved，另有 185 个 excluded-not-proven。
- 9,767 个 definition candidates、2,456 个 canonical static scripts、6 个 dependency candidates（17 occurrences）全部已路由。
- 精确类型/哈希只用于复核候选；不证明 placement、bounds、runtime reachability、instructional beats、renderer suitability 或可复用实现。
- renderer 仍为 \`undecided\`；implementation authorized/started 均为 0。
- canonical asset/keyframes/coverage 写入均为 0；runtime/GUI 均为 0；acceptance/strict/publication 均为 false。
- \`runnable: false\`，\`commands: []\`。

## Work-package totals

| Package | Definitions | Scripts | Dependencies | Dependency occurrences | Renderer | Implementation started |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
${packageRows}

## Member queue

| # | Member | Definitions | Scripts | Dependencies | Renderer | Implementation authorized |
| ---: | --- | ---: | ---: | ---: | --- | --- |
${memberRows}

## 输入绑定

- Release catalog: \`${report.release.catalog.path}\` (${report.release.catalog.sha256})
- Release fingerprint: \`${report.release.fingerprintSha256}\`
- 每个成员工件单独绑定 current manifest、M1 receipt、candidate census/definition inventory、canonical static script/dependency inventories、scenario/frame-domain、coverage-trace plan 与 strict-readiness。
`;
}

function managedOutputSet(release) {
  return new Set([
    ...release.members.map(({animationId}) =>
      g5L5RendererNeutralWorkPackagePath(animationId)),
    G5_L5_RENDERER_NEUTRAL_REPORT_JSON,
    G5_L5_RENDERER_NEUTRAL_REPORT_MARKDOWN,
  ]);
}

export async function readRendererNeutralOutputSnapshot(
  root,
  relativePath,
  allowedOutputs,
) {
  invariant(
    allowedOutputs.has(relativePath),
    `refusing unmanaged output: ${relativePath}`,
  );
  const absolutePath = resolveProjectPath(root, relativePath, "output");
  await assertRealAncestors(root, absolutePath, `output ${relativePath}`);
  const information = await lstatOrNull(absolutePath);
  if (!information) {
    return {
      path: relativePath,
      absolutePath,
      parent: path.dirname(absolutePath),
      exists: false,
      contents: null,
      bytes: 0,
      sha256: "",
      stat: null,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      Number(information.mode & 0o777n) === 0o644,
    `output must be one ordinary non-linked 0644 file: ${relativePath}`,
  );
  const record = await readRendererNeutralInput(root, relativePath);
  return {
    ...record,
    parent: path.dirname(absolutePath),
    exists: true,
  };
}

function outputMatches(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.bytes === right.bytes &&
        left.sha256 === right.sha256 &&
        sameIdentity(left.stat, right.stat)));
}

function assertOwnedOutput(snapshot, expectedGeneratorPath = GENERATOR_PATH) {
  if (!snapshot.exists) return;
  const text = snapshot.contents.toString("utf8");
  if (snapshot.path.endsWith(".md")) {
    invariant(
      text.startsWith(
        `<!-- generated-by: ${expectedGeneratorPath} -->\n`,
      ),
      `refusing foreign Markdown output: ${snapshot.path}`,
    );
    return;
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error(`refusing invalid existing JSON output: ${snapshot.path}`);
  }
  invariant(
    document.generatedBy?.path === expectedGeneratorPath,
    `refusing output owned by another generator: ${snapshot.path}`,
  );
}

async function assertInputsUnchanged(records) {
  const unique = new Map();
  for (const record of records) {
    if (record?.absolutePath && record?.stat) {
      unique.set(record.absolutePath, record);
    }
  }
  for (const record of unique.values()) {
    const current = await lstat(record.absolutePath, {bigint: true});
    invariant(
      current.isFile() &&
        !current.isSymbolicLink() &&
        current.nlink === 1n &&
        sameIdentity(record.stat, statIdentity(current)),
      `${record.path}: input changed after preflight`,
    );
  }
}

async function writeExclusive(candidate, contents, mode = 0o644) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    await handle.writeFile(contents);
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function removeOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: transaction file is not ordinary`,
  );
  invariant(
    sha256(await readFile(candidate)) === expectedSha256,
    `${candidate}: transaction bytes changed`,
  );
  await unlink(candidate);
}

async function stageOutput(item, batchId) {
  const nonce = randomBytes(10).toString("hex");
  const prefix = `.${path.basename(item.output)}.${batchId}.${nonce}`;
  const stagePath = path.join(item.snapshot.parent, `${prefix}.stage`);
  const backupPath = path.join(item.snapshot.parent, `${prefix}.backup`);
  const desiredBytes = Buffer.from(item.rendered);
  const desiredSha256 = sha256(desiredBytes);
  await writeExclusive(stagePath, desiredBytes, 0o644);
  if (item.snapshot.exists) {
    await writeExclusive(backupPath, item.snapshot.contents, 0o644);
  }
  return {
    ...item,
    stagePath,
    backupPath,
    desiredSha256,
    committed: false,
  };
}

async function cleanup(transaction) {
  await removeOwned(transaction.stagePath, transaction.desiredSha256);
  if (transaction.snapshot.exists) {
    await removeOwned(transaction.backupPath, transaction.snapshot.sha256);
  }
}

async function rollback(transactions, originalError) {
  const errors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        invariant(
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.desiredSha256,
          `${transaction.output}: committed output changed before rollback`,
        );
        if (transaction.snapshot.exists) {
          await rename(
            transaction.backupPath,
            transaction.snapshot.absolutePath,
          );
        } else {
          await unlink(transaction.snapshot.absolutePath);
        }
      }
      await cleanup(transaction);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(
      [originalError, ...errors],
      `renderer-neutral transaction failed with ${errors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

export async function commitRendererNeutralBatch({
  root,
  items,
  inputRecords = [],
  allowedOutputs,
  hooks = {},
}) {
  const batchId =
    `${process.pid}-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of items) {
      const current = await readRendererNeutralOutputSnapshot(
        root,
        item.output,
        allowedOutputs,
      );
      invariant(
        outputMatches(item.snapshot, current),
        `${item.output}: output changed after preflight`,
      );
      transactions.push(await stageOutput(item, batchId));
    }
    await hooks.afterStage?.({outputs: transactions});
    await assertInputsUnchanged(inputRecords);
    for (const [index, transaction] of transactions.entries()) {
      let current = await readRendererNeutralOutputSnapshot(
        root,
        transaction.output,
        allowedOutputs,
      );
      invariant(
        outputMatches(transaction.snapshot, current),
        `${transaction.output}: output changed before commit`,
      );
      await assertInputsUnchanged(inputRecords);
      await hooks.beforeCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.snapshot.absolutePath,
      });
      current = await readRendererNeutralOutputSnapshot(
        root,
        transaction.output,
        allowedOutputs,
      );
      invariant(
        outputMatches(transaction.snapshot, current),
        `${transaction.output}: output changed during commit CAS`,
      );
      await assertInputsUnchanged(inputRecords);
      if (transaction.snapshot.exists) {
        await rename(transaction.stagePath, transaction.snapshot.absolutePath);
      } else {
        await link(transaction.stagePath, transaction.snapshot.absolutePath);
        await unlink(transaction.stagePath);
      }
      transaction.committed = true;
      const committed = await lstat(
        transaction.snapshot.absolutePath,
        {bigint: true},
      );
      invariant(
        committed.isFile() &&
          !committed.isSymbolicLink() &&
          committed.nlink === 1n &&
          Number(committed.mode & 0o777n) === 0o644 &&
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.desiredSha256,
        `${transaction.output}: committed bytes or 0644 mode changed`,
      );
      await hooks.afterCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.snapshot.absolutePath,
      });
    }
    await assertInputsUnchanged(inputRecords);
  } catch (error) {
    await rollback(transactions, error);
  }
  for (const transaction of transactions) await cleanup(transaction);
}

async function loadGlobals(root) {
  const [generator, release] = await Promise.all([
    readRendererNeutralInput(root, GENERATOR_PATH, {
      label: "renderer-neutral generator",
    }),
    readRendererNeutralInput(root, RELEASE_PATH, {
      json: true,
      label: "lesson release catalog",
    }),
  ]);
  const selected = selectRelease(release.document);
  return {
    generator,
    release,
    releaseDocument: selected.release,
    releaseFingerprintSha256: selected.fingerprintSha256,
  };
}

async function prepare(root, options = {}) {
  const globals = await loadGlobals(root);
  const resolveStaticCompositeProof =
    options.staticCompositeProofResolver ??
    createG5L5StaticCompositeProofResolver({
      projectRoot: root,
      evidenceBuilder: options.staticCompositeEvidenceBuilder,
    });
  const memberInputs = [];
  for (const member of globals.releaseDocument.members) {
    memberInputs.push(
      await loadMemberInput(
        root,
        globals,
        member,
        resolveStaticCompositeProof,
      ),
    );
  }
  const releaseReuse = releaseReuseMaps(memberInputs);
  const memberPackages = memberInputs.map((memberInput) => {
    const workPackages = workPackagesForMember(memberInput, releaseReuse);
    const document = buildMemberDocument({
      globals,
      memberInput,
      workPackages,
    });
    validateG5L5RendererNeutralWorkPackage(
      document,
      memberInput.member,
    );
    const output = g5L5RendererNeutralWorkPackagePath(
      memberInput.member.animationId,
    );
    return {
      member: memberInput.member,
      document,
      output,
      rendered: stableJson(document),
      inputRecords: [
        globals.generator,
        globals.release,
        ...Object.values(memberInput.records),
      ],
    };
  });
  const report = buildReport(globals, memberPackages, releaseReuse);
  validateG5L5RendererNeutralWorkQueue(report);
  const reportInputs = memberPackages.flatMap(({inputRecords}) => inputRecords);
  const desired = [
    ...memberPackages.map((item) => ({
      id: item.member.animationId,
      output: item.output,
      rendered: item.rendered,
      inputRecords: item.inputRecords,
    })),
    {
      id: "g5-l5-renderer-neutral-work-queue-json",
      output: G5_L5_RENDERER_NEUTRAL_REPORT_JSON,
      rendered: stableJson(report),
      inputRecords: reportInputs,
    },
    {
      id: "g5-l5-renderer-neutral-work-queue-markdown",
      output: G5_L5_RENDERER_NEUTRAL_REPORT_MARKDOWN,
      rendered: renderG5L5RendererNeutralWorkQueueMarkdown(report),
      inputRecords: reportInputs,
    },
  ];
  const allowedOutputs = managedOutputSet(globals.releaseDocument);
  for (const item of desired) {
    item.snapshot = await readRendererNeutralOutputSnapshot(
      root,
      item.output,
      allowedOutputs,
    );
    assertOwnedOutput(item.snapshot);
  }
  return {
    globals,
    memberPackages,
    report,
    desired,
    allowedOutputs,
  };
}

export async function buildG5L5RendererNeutralWorkQueue(options = {}) {
  const root = path.resolve(options.projectRoot || defaultProjectRoot);
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be dry-run, apply, or check",
  );
  const prepared = await prepare(root, options);
  if (mode === "check") {
    for (const item of prepared.desired) {
      invariant(item.snapshot.exists, `${item.output}: output is missing`);
      invariant(
        item.snapshot.contents.toString("utf8") === item.rendered,
        `${item.output}: output is stale`,
      );
    }
  } else if (mode === "apply") {
    await commitRendererNeutralBatch({
      root,
      items: prepared.desired,
      inputRecords: prepared.desired.flatMap(
        ({inputRecords}) => inputRecords,
      ),
      allowedOutputs: prepared.allowedOutputs,
      hooks: options.transactionHooks || {},
    });
  }
  return {
    action:
      mode === "apply" ? "written" :
        mode === "check" ? "verified" :
          "planned",
    releaseId: G5_L5_RENDERER_NEUTRAL_RELEASE_ID,
    state: G5_L5_RENDERER_NEUTRAL_STATE,
    memberCount: 57,
    outputCount: 59,
    definitionCandidateCount:
      prepared.report.summary.definitionCandidateCount,
    scriptCandidateCount:
      prepared.report.summary.canonicalStaticScriptCandidateCount,
    dependencyCandidateCount:
      prepared.report.summary.dependencyCandidateCount,
    dependencyOccurrenceCount:
      prepared.report.summary.dependencyOccurrenceCount,
    structurallyReachableChildTimelineCount:
      prepared.report.summary.structurallyReachableChildTimelineCount,
    evidenceBoundCompositeFrameDomainCount:
      prepared.report.summary.evidenceBoundCompositeFrameDomainCount,
    unresolvedFrameDomainCount:
      prepared.report.summary.unresolvedFrameDomainCount,
    excludedNotProvenTimelineCount:
      prepared.report.summary.excludedNotProvenTimelineCount,
    rendererUndecidedCount: 57,
    implementationAuthorizedCount: 0,
    implementationStartedCount: 0,
    canonicalAssetInventoryWriteCount: 0,
    canonicalKeyframeWriteCount: 0,
    canonicalCoverageWriteCount: 0,
    runtimeSessionCount: 0,
    guiLaunchCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
    runnable: false,
    commands: [],
    outputs: prepared.desired.map(({output, rendered}) => ({
      path: output,
      bytes: Buffer.byteLength(rendered),
      sha256: sha256(Buffer.from(rendered)),
      mode: "0644",
    })),
  };
}

export function parseArguments(argv) {
  const options = {help: false};
  for (const argument of argv) {
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(
        !options.mode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = argument.slice(2);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(
      options.mode,
      "explicitly choose one of --dry-run, --apply, or --check",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-renderer-neutral-work-queue.mjs --dry-run
  node scripts/build-g5-l5-renderer-neutral-work-queue.mjs --apply
  node scripts/build-g5-l5-renderer-neutral-work-queue.mjs --check

Builds 57 per-member renderer-neutral source-static work packages plus JSON
and Markdown aggregate reports as one 59-output compare-and-swap transaction.
It routes exact static candidates for review only; it does not choose a
renderer, authorize or start implementation, write canonical asset/keyframe/
coverage evidence, run GUI/runtime, or advance acceptance, strict completion,
or publication.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
    } else {
      const result = await buildG5L5RendererNeutralWorkQueue(options);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
