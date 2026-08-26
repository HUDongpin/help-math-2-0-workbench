#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");

export const LEGACY_COVERAGE_V2_PILOT_IDS = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
  "keyterm-elementary-acute-angle",
  "keyterm-elementary-computeghgh",
]);

export const LEGACY_COVERAGE_ARCHIVE_PATH = "evidence/coverage-v1-prereview-archive.json";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const EVIDENCE_FIELDS = Object.freeze([
  "baselineCaptureManifest",
  "baselineCaptureManifestSha256",
  "captureManifest",
  "captureManifestSha256",
  "metricsFile",
  "metricsSha256",
]);
const KEYFRAME_HEADERS = Object.freeze([
  "frame",
  "requirement_id",
  "frame_domain_id",
  "trace_id",
  "entry_state_sha256",
  "time_ms",
  "scenario",
  "language",
  "kind",
  "expected_state",
  "trigger",
  "baseline_file",
  "baseline_sha256",
  "implementation_file",
  "implementation_sha256",
  "diff_file",
  "diff_sha256",
  "normalized_rmse",
  "timing_result",
  "visual_result",
  "evidence_source",
  "reviewer",
  "notes",
]);
const LEGACY_REFERENCE_FIELDS = Object.freeze([
  ["baselineCaptureManifest", "baselineCaptureManifestSha256", "original-runtime-baseline-capture"],
  ["baselineReport", "baselineReportSha256", "legacy-baseline-report"],
  ["captureManifest", "captureManifestSha256", "implementation-capture"],
  ["metricsFile", "metricsSha256", "frame-metrics"],
  ["contactSheetManifest", "contactSheetManifestSha256", "contact-sheet-manifest"],
]);

function usage() {
  return `Usage: node scripts/upgrade-legacy-pilot-coverage-v2.mjs [options]

Options:
  --id <animation-id>       Select one of the six registered legacy pilots; repeatable
  --migrations <directory>  Migration root (default: migrations)
  --dry-run                 Read-only plan (default)
  --check                   Verify already-upgraded outputs byte-for-byte; never writes
  --write                   Explicitly perform the bounded transactional upgrade
  --json                    Print the machine-readable summary
  -h, --help                Show this help

The upgrade creates an explicit root frame-domain contract and coverage-v2
requirements. Coverage-v1 manifests, metrics, and captures are archived as
prereview-only and are never promoted: they do not bind requirementId, traceId,
entryStateSha256, or the current schema-v4 implementation artifact closure.
Write mode changes only migration.json, keyframes.csv,
evidence/full-frame-coverage.json, and the immutable prereview archive inside
the selected migration workspaces.`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort(compareText).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sameStringSet(left, right) {
  return (
    Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && [...left].sort(compareText).every((value, index) => value === [...right].sort(compareText)[index])
  );
}

function uniqueStrings(values, label) {
  invariant(Array.isArray(values) && values.length > 0, `${label} must be a non-empty string array`);
  invariant(values.every((value) => typeof value === "string" && value.length > 0), `${label} must contain only non-empty strings`);
  invariant(new Set(values).size === values.length, `${label} must not contain duplicates`);
  return values;
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else value += character;
  }
  invariant(!quoted, "Unterminated quoted CSV field");
  values.push(value);
  return values;
}

export function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.length);
  invariant(lines.length > 0, "keyframes.csv must not be empty");
  const headers = parseCsvLine(lines[0]);
  invariant(new Set(headers).size === headers.length, "keyframes.csv headers must be unique");
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `keyframes.csv row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, position) => [header, values[position]]));
  });
  return {headers, rows};
}

function csvField(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeCsv(headers, rows) {
  return `${[headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((values) => values.map(csvField).join(","))
    .join("\n")}\n`;
}

function captureContract(previous = {}, id = "migration") {
  const desired = {
    ...previous,
    frameParameter: previous.frameParameter || "frame",
    frameDomainParameter: "frameDomain",
    requirementIdParameter: "requirementId",
    traceParameter: "trace",
    entryStateSha256Parameter: "entryStateSha256",
    scenarioParameter: previous.scenarioParameter || "scenario",
    languageParameter: previous.languageParameter || "lang",
    seedParameter: previous.seedParameter || "seed",
    frameAttribute: "data-flash-frame",
    animationIdAttribute: "data-animation-id",
    frameDomainAttribute: "data-flash-frame-domain",
    requirementIdAttribute: "data-flash-requirement-id",
    traceAttribute: "data-flash-trace-id",
    entryStateSha256Attribute: "data-flash-entry-state-sha256",
  };
  for (const field of [
    "frameDomainParameter",
    "requirementIdParameter",
    "traceParameter",
    "entryStateSha256Parameter",
    "frameAttribute",
    "animationIdAttribute",
    "frameDomainAttribute",
    "requirementIdAttribute",
    "traceAttribute",
    "entryStateSha256Attribute",
  ]) {
    invariant(
      previous[field] === undefined || previous[field] === desired[field],
      `${id}: existing captureContract.${field} conflicts with the coverage-v2 contract`,
    );
  }
  return desired;
}

function validateManifest(id, manifest) {
  invariant(manifest?.schemaVersion === 2, `${id}: migration.json schemaVersion must be 2`);
  invariant(manifest.animationId === id && manifest.id === id, `${id}: migration manifest identity mismatch`);
  invariant(Number.isInteger(manifest.runtime?.frameCount) && manifest.runtime.frameCount > 0, `${id}: runtime.frameCount must be a positive integer`);
  invariant(Number.isInteger(manifest.runtime?.stage?.width) && manifest.runtime.stage.width > 0, `${id}: runtime.stage.width must be a positive integer`);
  invariant(Number.isInteger(manifest.runtime?.stage?.height) && manifest.runtime.stage.height > 0, `${id}: runtime.stage.height must be a positive integer`);
  invariant(Number.isFinite(manifest.runtime?.fps) && manifest.runtime.fps > 0, `${id}: runtime.fps must be positive`);
  invariant(typeof manifest.source?.swf === "string" && manifest.source.swf.length > 0, `${id}: source.swf is required`);
  invariant(SHA256_PATTERN.test(manifest.source?.swfSha256 || ""), `${id}: source.swfSha256 must be a lowercase SHA-256`);
  const languages = uniqueStrings(manifest.localization?.languages, `${id}.localization.languages`);
  invariant(sameStringSet(languages, ["en", "es"]), `${id}: this bounded factory requires the existing en/es localization contract`);
  const scenarios = Array.isArray(manifest.scenarios) ? manifest.scenarios : [];
  const scenarioIds = uniqueStrings(scenarios.map(({id: scenarioId}) => scenarioId), `${id}.scenarios`);
  invariant(scenarios.every(({id: scenarioId}) => SAFE_ID_PATTERN.test(scenarioId)), `${id}: scenario IDs must be stable capture-safe identifiers`);
  invariant(scenarios.every(({reachable}) => reachable === true), `${id}: every registered legacy pilot scenario must remain explicitly reachable`);
  invariant(scenarios.every(({kind}) => kind === "linear" || kind === "interactive"), `${id}: scenario kind must be linear or interactive`);
  const nativeStage = manifest.implementation?.captureContract?.nativeStage;
  if (nativeStage !== undefined) {
    invariant(
      nativeStage?.width === manifest.runtime.stage.width && nativeStage?.height === manifest.runtime.stage.height,
      `${id}: captureContract.nativeStage differs from runtime.stage`,
    );
  }
  return {languages, scenarios, scenarioIds};
}

function validateLegacyCoverage({id, manifest, coverage}) {
  invariant(coverage?.schemaVersion === 1, `${id}: archived legacy coverage must be schemaVersion 1`);
  invariant(coverage.animationId === id, `${id}: legacy coverage animationId mismatch`);
  invariant(coverage.frameCount === manifest.runtime.frameCount, `${id}: legacy coverage frameCount differs from runtime.frameCount`);
  const languages = manifest.localization.languages;
  const scenarioIds = manifest.scenarios.map(({id: scenarioId}) => scenarioId);
  invariant(sameStringSet(coverage.languages, languages), `${id}: legacy coverage languages differ from migration.json`);
  invariant(sameStringSet(coverage.scenarios, scenarioIds), `${id}: legacy coverage scenarios differ from migration.json`);
  invariant(Array.isArray(coverage.combinations), `${id}: legacy coverage combinations must be an array`);
  const combinations = new Map();
  for (const [index, combination] of coverage.combinations.entries()) {
    const key = `${combination.scenario}\0${combination.language}`;
    invariant(!combinations.has(key), `${id}: duplicate legacy combination ${combination.scenario}/${combination.language}`);
    invariant(scenarioIds.includes(combination.scenario), `${id}: legacy combination ${index + 1} uses an unknown scenario`);
    invariant(languages.includes(combination.language), `${id}: legacy combination ${index + 1} uses an unknown language`);
    invariant(combination.seed !== undefined && combination.seed !== null && String(combination.seed) !== "", `${id}: legacy combination ${index + 1} has no seed`);
    if (combination.status !== "blocked") {
      invariant(
        combination.firstFrame === 1
        && combination.lastFrame === manifest.runtime.frameCount
        && combination.capturedFrameCount === manifest.runtime.frameCount
        && Array.isArray(combination.missingFrames)
        && combination.missingFrames.length === 0,
        `${id}: legacy combination ${combination.scenario}/${combination.language} does not cover the full root range`,
      );
    }
    combinations.set(key, combination);
  }
  for (const scenarioId of scenarioIds) for (const language of languages) {
    invariant(combinations.has(`${scenarioId}\0${language}`), `${id}: missing legacy combination ${scenarioId}/${language}`);
  }
  invariant(combinations.size === scenarioIds.length * languages.length, `${id}: legacy coverage contains unexpected combinations`);
  return combinations;
}

function deriveSeed({id, scenario, language, legacyCombinations}) {
  const combination = legacyCombinations.get(`${scenario.id}\0${language}`);
  invariant(combination, `${id}: no legacy combination exists for ${scenario.id}/${language}`);
  const seed = String(combination.seed);
  if (scenario.seed !== undefined && scenario.seed !== null && String(scenario.seed) !== "") {
    invariant(String(scenario.seed) === seed, `${id}: scenario seed differs from legacy coverage for ${scenario.id}/${language}`);
  }
  return seed;
}

function seedToken(seed) {
  invariant(/^[A-Za-z0-9._-]+$/.test(seed), `Seed '${seed}' cannot be represented safely in a trace ID`);
  return seed;
}

function buildEntryState({scenario, language, seed}) {
  return {
    kind: scenario.kind === "interactive" ? "original-root-natural-entry" : "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: scenario.id,
    language,
    seed,
  };
}

function buildRootRequirements({
  id,
  manifest,
  scenarios,
  languages,
  legacyCombinations,
  archiveSha256,
}) {
  const sourceEvidence = {file: manifest.source.swf, sha256: manifest.source.swfSha256};
  const archiveEvidence = {file: LEGACY_COVERAGE_ARCHIVE_PATH, sha256: archiveSha256};
  const requirements = [];
  for (const scenario of scenarios) for (const language of languages) {
    const seed = deriveSeed({id, scenario, language, legacyCombinations});
    const requirementId = `req:root:${scenario.id}:${language}`;
    const traceId = `trace:root:${scenario.id}:${language}:seed-${seedToken(seed)}`;
    const entryState = buildEntryState({scenario, language, seed});
    const interactive = scenario.kind === "interactive";
    requirements.push({
      requirementId,
      scenario: scenario.id,
      frameDomainId: "root",
      traceId,
      language,
      seed,
      requiredRange: {firstFrame: 1, lastFrame: manifest.runtime.frameCount},
      entryState,
      entryStateSha256: sha256Text(canonicalJson(entryState)),
      baselineAuthorityRequirement: interactive
        ? "original-runtime-natural-trace"
        : "original-runtime-frame-accurate",
      baselineAuthority: "unresolved",
      status: "blocked",
      blockingReason: interactive
        ? "The coverage-v1 artifacts are retained only as prereview diagnostics: they do not bind this requirement, natural original-runtime trace, canonical entry state, or current schema-v4 implementation artifact closure. A fresh natural-trace baseline, schema-v4 implementation capture, and exact paired metrics are required."
        : "The coverage-v1 artifacts are retained only as prereview diagnostics: they do not bind this requirement, canonical entry state, or current schema-v4 implementation artifact closure. A fresh frame-accurate original-runtime baseline, schema-v4 implementation capture, and exact paired metrics are required.",
      blockingEvidence: [sourceEvidence, archiveEvidence],
      capturedFrameCount: 0,
      missingFrames: Array.from({length: manifest.runtime.frameCount}, (_, index) => index + 1),
      baselineCaptureManifest: "",
      baselineCaptureManifestSha256: "",
      captureManifest: "",
      captureManifestSha256: "",
      metricsFile: "",
      metricsSha256: "",
    });
  }
  return requirements;
}

function technicalRequirementIdentity(requirement) {
  return {
    requirementId: requirement.requirementId,
    scenario: requirement.scenario,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    language: requirement.language,
    seed: String(requirement.seed),
    requiredRange: requirement.requiredRange,
    entryState: requirement.entryState,
    entryStateSha256: requirement.entryStateSha256,
    baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
  };
}

function assertExistingV2IsFactorySafe({id, existingCoverage, generatedRequirements}) {
  invariant(existingCoverage?.schemaVersion === 2, `${id}: current coverage must be schemaVersion 1 or a prior output of this factory`);
  invariant(existingCoverage.animationId === id, `${id}: current coverage-v2 animationId mismatch`);
  invariant(Array.isArray(existingCoverage.requirements), `${id}: current coverage-v2 requirements must be an array`);
  const generatedById = new Map(generatedRequirements.map((requirement) => [requirement.requirementId, requirement]));
  invariant(existingCoverage.requirements.length === generatedRequirements.length, `${id}: current coverage-v2 requirement count differs from the factory contract`);
  for (const current of existingCoverage.requirements) {
    const generated = generatedById.get(current.requirementId);
    invariant(generated, `${id}: current coverage-v2 has an unexpected requirement ${current.requirementId || "without an ID"}`);
    invariant(
      canonicalJson(technicalRequirementIdentity(current)) === canonicalJson(technicalRequirementIdentity(generated)),
      `${id}: current coverage-v2 requirement ${current.requirementId} has a different technical identity`,
    );
    invariant(current.status === "blocked", `${id}: factory refuses to rewrite a non-blocked coverage-v2 requirement ${current.requirementId}`);
    invariant(
      EVIDENCE_FIELDS.every((field) => String(current[field] ?? "") === "")
      && current.capturedFrameCount === 0
      && Array.isArray(current.missingFrames)
      && current.missingFrames.length === current.requiredRange.lastFrame,
      `${id}: coverage-v2 requirement ${current.requirementId} contains adopted evidence; use the dedicated evidence adopter/validator, not this upgrade factory`,
    );
  }
}

function migrateKeyframes({
  id,
  keyframesText,
  requirements,
  frameCount,
  currentCoverageSchemaVersion,
}) {
  const parsed = parseCsv(keyframesText);
  const oldRequiredHeaders = [
    "frame",
    "time_ms",
    "scenario",
    "language",
    "kind",
    "expected_state",
    "trigger",
    "baseline_file",
    "baseline_sha256",
    "implementation_file",
    "implementation_sha256",
    "diff_file",
    "diff_sha256",
    "normalized_rmse",
    "timing_result",
    "visual_result",
    "evidence_source",
    "reviewer",
    "notes",
  ];
  const missing = oldRequiredHeaders.filter((header) => !parsed.headers.includes(header));
  invariant(missing.length === 0, `${id}: keyframes.csv lacks ${missing.join(", ")}`);
  const requirementByKey = new Map(requirements.map((requirement) => [
    `${requirement.scenario}\0${requirement.language}`,
    requirement,
  ]));
  const alreadyUpgraded = KEYFRAME_HEADERS.every((header) => parsed.headers.includes(header));
  if (currentCoverageSchemaVersion === 2) {
    invariant(alreadyUpgraded, `${id}: coverage-v2 exists but keyframes.csv lacks coverage-v2 identity columns`);
  }
  const rows = parsed.rows.map((row, index) => {
    const requirement = requirementByKey.get(`${row.scenario}\0${row.language}`);
    invariant(requirement, `${id}: keyframe row ${index + 2} has no requirement for ${row.scenario}/${row.language}`);
    const frame = Number(row.frame);
    invariant(Number.isInteger(frame) && frame >= 1 && frame <= frameCount, `${id}: keyframe row ${index + 2} is outside root frame range`);
    if (alreadyUpgraded) {
      invariant(row.requirement_id === requirement.requirementId, `${id}: keyframe row ${index + 2} requirement_id differs`);
      invariant(row.frame_domain_id === "root", `${id}: keyframe row ${index + 2} frame_domain_id differs`);
      invariant(row.trace_id === requirement.traceId, `${id}: keyframe row ${index + 2} trace_id differs`);
      invariant(row.entry_state_sha256 === requirement.entryStateSha256, `${id}: keyframe row ${index + 2} entry_state_sha256 differs`);
      return Object.fromEntries(KEYFRAME_HEADERS.map((header) => [header, row[header] ?? ""]));
    }
    const notes = [
      row.notes,
      "Legacy baseline/implementation/diff/RMSE fields were archived as prereview-only and intentionally cleared; fresh coverage-v2 evidence is required.",
    ].filter(Boolean).join(" ");
    return {
      ...Object.fromEntries(KEYFRAME_HEADERS.map((header) => [header, row[header] ?? ""])),
      requirement_id: requirement.requirementId,
      frame_domain_id: "root",
      trace_id: requirement.traceId,
      entry_state_sha256: requirement.entryStateSha256,
      baseline_file: "",
      baseline_sha256: "",
      implementation_file: "",
      implementation_sha256: "",
      diff_file: "",
      diff_sha256: "",
      normalized_rmse: "",
      timing_result: "",
      visual_result: "",
      evidence_source: "",
      reviewer: "",
      notes,
    };
  });
  return serializeCsv(KEYFRAME_HEADERS, rows);
}

function rawInputDescriptor(file, content) {
  return {
    path: file,
    bytes: Buffer.byteLength(content),
    sha256: sha256Text(content),
    encoding: "base64",
    content: Buffer.from(content).toString("base64"),
  };
}

function readArchivedRawInput(archive, key, id) {
  const descriptor = archive?.sourceInputs?.[key];
  invariant(isPlainObject(descriptor), `${id}: prereview archive lacks sourceInputs.${key}`);
  invariant(descriptor.encoding === "base64" && typeof descriptor.content === "string", `${id}: prereview archive ${key} encoding is invalid`);
  const content = Buffer.from(descriptor.content, "base64").toString("utf8");
  invariant(Buffer.byteLength(content) === descriptor.bytes, `${id}: prereview archive ${key} byte count differs`);
  invariant(sha256Text(content) === descriptor.sha256, `${id}: prereview archive ${key} SHA-256 differs`);
  return content;
}

function validateArchive({id, archiveText}) {
  let archive;
  try {
    archive = JSON.parse(archiveText);
  } catch (error) {
    throw new Error(`${id}: invalid prereview archive JSON (${error.message})`);
  }
  invariant(archive.schemaVersion === 1, `${id}: prereview archive schemaVersion must be 1`);
  invariant(archive.evidenceType === "legacy-coverage-v1-prereview-archive", `${id}: prereview archive evidenceType differs`);
  invariant(archive.status === "prereview-only", `${id}: prereview archive status must remain prereview-only`);
  invariant(archive.animationId === id, `${id}: prereview archive animationId mismatch`);
  invariant(archive.promotionAuthorized === false, `${id}: prereview archive must not authorize evidence promotion`);
  for (const key of ["migrationJson", "coverageV1", "keyframesV1"]) readArchivedRawInput(archive, key, id);
  const archivedCoverage = JSON.parse(readArchivedRawInput(archive, "coverageV1", id));
  invariant(archivedCoverage.schemaVersion === 1 && archivedCoverage.animationId === id, `${id}: archived coverage-v1 identity differs`);
  invariant(Array.isArray(archive.legacyReferenceDiagnostics), `${id}: prereview archive legacyReferenceDiagnostics must be an array`);
  return archive;
}

function buildArchive({
  id,
  manifestText,
  coverageV1Text,
  keyframesV1Text,
  referenceDiagnostics,
}) {
  return {
    schemaVersion: 1,
    evidenceType: "legacy-coverage-v1-prereview-archive",
    status: "prereview-only",
    animationId: id,
    promotionAuthorized: false,
    scope: "Exact input bytes and reference diagnostics retained before the coverage-v1 to coverage-v2 contract upgrade.",
    nonPromotionStatement: "This archive is not a coverage-v2 baseline, implementation capture, metrics report, human review, owner acceptance, audio acceptance, original-runtime parity decision, or migration completion. Its legacy artifacts do not bind requirementId, traceId, entryStateSha256, or a schema-v4 implementation artifact closure.",
    sourceInputs: {
      migrationJson: rawInputDescriptor("migration.json", manifestText),
      coverageV1: rawInputDescriptor("evidence/full-frame-coverage.json", coverageV1Text),
      keyframesV1: rawInputDescriptor("keyframes.csv", keyframesV1Text),
    },
    legacyReferenceDiagnostics: referenceDiagnostics,
    limitations: [
      "Legacy implementation capture manifests predate schema-v4 implementation artifact closure binding.",
      "Legacy baseline and metrics documents do not bind the generated coverage-v2 requirement, trace, and canonical entry-state identity.",
      "Legacy engineering RMSE/contact-sheet work remains useful prereview context but cannot satisfy strict coverage-v2 acceptance.",
    ],
  };
}

function rootTimelineDefinitionsFor(manifest) {
  return [{
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: manifest.runtime.frameCount,
    indexing: "one-indexed",
    structuralReachability: "root",
    evidence: manifest.source.swf,
  }];
}

function outputManifestFor({manifest, scenarios}) {
  const output = structuredClone(manifest);
  const timelineDefinitions = rootTimelineDefinitionsFor(output);
  const frameDomains = [{
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceInstanceId: "root",
    parentFrameDomainId: null,
    frameCount: output.runtime.frameCount,
    scenarioIds: scenarios.map(({id}) => id),
    role: "root-animation",
  }];
  invariant(
    output.runtime?.timelineDefinitions === undefined
    || canonicalJson(output.runtime.timelineDefinitions) === canonicalJson(timelineDefinitions),
    `${output.animationId}: existing runtime.timelineDefinitions conflict with the root-only upgrade contract`,
  );
  invariant(
    output.implementation?.defaultFrameDomainId === undefined
    || output.implementation.defaultFrameDomainId === "root",
    `${output.animationId}: existing defaultFrameDomainId conflicts with the root-only upgrade contract`,
  );
  invariant(
    output.implementation?.frameDomains === undefined
    || canonicalJson(output.implementation.frameDomains) === canonicalJson(frameDomains),
    `${output.animationId}: existing frameDomains conflict with the root-only upgrade contract`,
  );
  output.implementation = {
    ...output.implementation,
    defaultFrameDomainId: "root",
    frameDomains,
    captureContract: captureContract(output.implementation?.captureContract, output.animationId),
  };
  output.runtime = {
    ...output.runtime,
    timelineDefinitions,
  };
  return output;
}

function ensureProtectedManifestFieldsUnchanged(before, after) {
  for (const field of ["status", "acceptance", "source", "audio", "localization", "scenarios"]) {
    invariant(
      canonicalJson(before[field]) === canonicalJson(after[field]),
      `${before.animationId}: upgrade must not change migration.${field}`,
    );
  }
  const expectedRuntime = {
    ...before.runtime,
    timelineDefinitions: rootTimelineDefinitionsFor(before),
  };
  invariant(
    canonicalJson(expectedRuntime) === canonicalJson(after.runtime),
    `${before.animationId}: upgrade may add only the deterministic root runtime.timelineDefinitions contract`,
  );
}

export function deriveLegacyCoverageV2Outputs({
  id,
  currentManifestText,
  legacyManifestText,
  currentCoverageText,
  legacyCoverageV1Text,
  currentKeyframesText,
  legacyKeyframesV1Text,
  archiveText = "",
  referenceDiagnostics = [],
}) {
  invariant(LEGACY_COVERAGE_V2_PILOT_IDS.includes(id), `Unknown legacy coverage-v2 pilot: ${id}`);
  const currentManifest = JSON.parse(currentManifestText);
  const legacyManifest = JSON.parse(legacyManifestText);
  const currentCoverage = JSON.parse(currentCoverageText);
  const legacyCoverage = JSON.parse(legacyCoverageV1Text);
  const {languages, scenarios} = validateManifest(id, currentManifest);
  validateManifest(id, legacyManifest);
  const legacyCombinations = validateLegacyCoverage({id, manifest: legacyManifest, coverage: legacyCoverage});
  invariant(
    currentManifest.runtime.frameCount === legacyManifest.runtime.frameCount
    && canonicalJson(currentManifest.runtime.stage) === canonicalJson(legacyManifest.runtime.stage)
    && currentManifest.runtime.fps === legacyManifest.runtime.fps,
    `${id}: current root runtime contract differs from the archived legacy manifest`,
  );
  invariant(
    sameStringSet(currentManifest.localization.languages, legacyManifest.localization.languages)
    && sameStringSet(currentManifest.scenarios.map(({id: scenarioId}) => scenarioId), legacyManifest.scenarios.map(({id: scenarioId}) => scenarioId)),
    `${id}: current language/scenario contract differs from the archived legacy manifest`,
  );

  let archive;
  let desiredArchiveText;
  if (archiveText) {
    archive = validateArchive({id, archiveText});
    invariant(
      readArchivedRawInput(archive, "migrationJson", id) === legacyManifestText
      && readArchivedRawInput(archive, "coverageV1", id) === legacyCoverageV1Text
      && readArchivedRawInput(archive, "keyframesV1", id) === legacyKeyframesV1Text,
      `${id}: supplied archived input bytes differ from the immutable prereview archive`,
    );
    desiredArchiveText = archiveText;
  } else {
    archive = buildArchive({
      id,
      manifestText: legacyManifestText,
      coverageV1Text: legacyCoverageV1Text,
      keyframesV1Text: legacyKeyframesV1Text,
      referenceDiagnostics,
    });
    desiredArchiveText = jsonText(archive);
  }
  const archiveSha256 = sha256Text(desiredArchiveText);
  const outputManifest = outputManifestFor({manifest: currentManifest, scenarios});
  ensureProtectedManifestFieldsUnchanged(currentManifest, outputManifest);
  const requirements = buildRootRequirements({
    id,
    manifest: outputManifest,
    scenarios,
    languages,
    legacyCombinations,
    archiveSha256,
  });
  if (currentCoverage.schemaVersion === 2) {
    assertExistingV2IsFactorySafe({id, existingCoverage: currentCoverage, generatedRequirements: requirements});
  } else {
    invariant(currentCoverage.schemaVersion === 1, `${id}: current coverage schemaVersion must be 1 or 2`);
    invariant(currentCoverageText === legacyCoverageV1Text, `${id}: current coverage-v1 bytes differ from the archived upgrade input`);
  }
  const coverage = {schemaVersion: 2, animationId: id, requirements};
  const keyframesText = migrateKeyframes({
    id,
    keyframesText: currentKeyframesText,
    requirements,
    frameCount: currentManifest.runtime.frameCount,
    currentCoverageSchemaVersion: currentCoverage.schemaVersion,
  });
  return {
    manifest: outputManifest,
    manifestText: jsonText(outputManifest),
    coverage,
    coverageText: jsonText(coverage),
    keyframesText,
    archive,
    archiveText: desiredArchiveText,
    archiveSha256,
    summary: {
      animationId: id,
      rootFrameCount: currentManifest.runtime.frameCount,
      stage: currentManifest.runtime.stage,
      scenarioCount: scenarios.length,
      languageCount: languages.length,
      requirementCount: requirements.length,
      archivedReferenceCount: archive.legacyReferenceDiagnostics.length,
      promotedLegacyEvidenceCount: 0,
      requirementStatuses: {blocked: requirements.length, complete: 0},
    },
  };
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

async function resolveLegacyReference({workspace, evidenceRoot, referencePath}) {
  if (!referencePath || typeof referencePath !== "string") return null;
  const candidates = path.isAbsolute(referencePath)
    ? [path.resolve(referencePath)]
    : [path.resolve(workspace, referencePath), path.resolve(evidenceRoot, referencePath)];
  const projectRootReal = await realpath(evidenceRoot);
  for (const candidate of candidates) {
    if (!(await exists(candidate))) continue;
    const candidateReal = await realpath(candidate);
    invariant(
      candidateReal === projectRootReal || candidateReal.startsWith(`${projectRootReal}${path.sep}`),
      `Legacy evidence reference escapes the project root: ${referencePath}`,
    );
    const stat = await lstat(candidate);
    invariant(!stat.isSymbolicLink(), `Legacy evidence reference must not be a symbolic link: ${referencePath}`);
    return candidate;
  }
  return null;
}

async function inspectLegacyReferences({workspace, evidenceRoot, coverage}) {
  const diagnostics = [];
  for (const combination of coverage.combinations || []) {
    for (const [pathField, shaField, kind] of LEGACY_REFERENCE_FIELDS) {
      const referencePath = combination[pathField];
      if (!referencePath) continue;
      const declaredSha256 = String(combination[shaField] || "");
      const resolved = await resolveLegacyReference({workspace, evidenceRoot, referencePath});
      let observedSha256 = "";
      let bytes = 0;
      let jsonIdentity = null;
      if (resolved) {
        const content = await readFile(resolved);
        observedSha256 = createHash("sha256").update(content).digest("hex");
        bytes = content.byteLength;
        try {
          const value = JSON.parse(content.toString("utf8"));
          jsonIdentity = {
            schemaVersion: value.schemaVersion ?? null,
            status: value.status ?? null,
            evidenceType: value.evidenceType ?? null,
            animationId: value.animationId ?? null,
            requirementId: value.requirementId ?? null,
            frameDomainId: value.frameDomainId ?? null,
            traceId: value.traceId ?? null,
            entryStateSha256: value.entryStateSha256 ?? null,
            scenario: value.scenario ?? null,
            language: value.language ?? null,
            seed: value.seed === undefined ? null : String(value.seed),
            hasImplementationArtifactClosure: isPlainObject(value.implementationArtifactClosure),
          };
        } catch {
          jsonIdentity = null;
        }
      }
      diagnostics.push({
        scenario: combination.scenario,
        language: combination.language,
        seed: String(combination.seed),
        kind,
        path: referencePath,
        declaredSha256,
        exists: Boolean(resolved),
        observedSha256,
        bytes,
        declaredHashMatches: Boolean(resolved && SHA256_PATTERN.test(declaredSha256) && observedSha256 === declaredSha256),
        exactCoverageV2IdentityBound: Boolean(
          jsonIdentity?.requirementId
          && jsonIdentity?.frameDomainId
          && jsonIdentity?.traceId
          && SHA256_PATTERN.test(jsonIdentity?.entryStateSha256 || ""),
        ),
        jsonIdentity,
        disposition: "archived-prereview-only-not-promoted",
      });
    }
  }
  return diagnostics;
}

async function assertSafeWorkspace({migrationsRoot, workspace, id}) {
  const rootReal = await realpath(migrationsRoot);
  const workspaceStat = await lstat(workspace);
  invariant(workspaceStat.isDirectory() && !workspaceStat.isSymbolicLink(), `${id}: migration workspace must be a real directory`);
  const workspaceReal = await realpath(workspace);
  invariant(workspaceReal.startsWith(`${rootReal}${path.sep}`), `${id}: migration workspace escapes migrations root`);
}

async function readOptional(candidate) {
  try {
    return await readFile(candidate, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function prepareOne(id, {migrationsRoot}) {
  invariant(LEGACY_COVERAGE_V2_PILOT_IDS.includes(id), `Unknown legacy coverage-v2 pilot: ${id}`);
  const workspace = path.join(migrationsRoot, id);
  const evidenceRoot = path.dirname(migrationsRoot);
  await assertSafeWorkspace({migrationsRoot, workspace, id});
  const paths = {
    manifest: path.join(workspace, "migration.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    keyframes: path.join(workspace, "keyframes.csv"),
    archive: path.join(workspace, LEGACY_COVERAGE_ARCHIVE_PATH),
  };
  for (const candidate of [paths.manifest, paths.coverage, paths.keyframes]) {
    const stat = await lstat(candidate);
    invariant(stat.isFile() && !stat.isSymbolicLink(), `${id}: upgrade input must be a regular non-symlink file: ${portable(path.relative(projectRoot, candidate))}`);
  }
  const [currentManifestText, currentCoverageText, currentKeyframesText, archiveTextOrNull] = await Promise.all([
    readFile(paths.manifest, "utf8"),
    readFile(paths.coverage, "utf8"),
    readFile(paths.keyframes, "utf8"),
    readOptional(paths.archive),
  ]);
  const currentManifest = JSON.parse(currentManifestText);
  const sourcePath = path.resolve(evidenceRoot, currentManifest.source?.swf || "");
  const evidenceRootReal = await realpath(evidenceRoot);
  const sourceStat = await lstat(sourcePath);
  invariant(sourceStat.isFile() && !sourceStat.isSymbolicLink(), `${id}: source.swf must be a regular non-symlink file`);
  const sourceReal = await realpath(sourcePath);
  invariant(
    sourceReal.startsWith(`${evidenceRootReal}${path.sep}`),
    `${id}: source.swf escapes the project root`,
  );
  invariant(
    createHash("sha256").update(await readFile(sourcePath)).digest("hex") === currentManifest.source?.swfSha256,
    `${id}: source.swf SHA-256 differs from migration.json`,
  );
  if (archiveTextOrNull !== null) {
    const archiveStat = await lstat(paths.archive);
    invariant(archiveStat.isFile() && !archiveStat.isSymbolicLink(), `${id}: prereview archive must be a regular non-symlink file`);
  }
  const currentCoverage = JSON.parse(currentCoverageText);
  let legacyManifestText = currentManifestText;
  let legacyCoverageV1Text = currentCoverageText;
  let legacyKeyframesV1Text = currentKeyframesText;
  let referenceDiagnostics = [];
  if (currentCoverage.schemaVersion === 2) {
    invariant(archiveTextOrNull !== null, `${id}: coverage-v2 exists without the immutable coverage-v1 prereview archive`);
    const archive = validateArchive({id, archiveText: archiveTextOrNull});
    legacyManifestText = readArchivedRawInput(archive, "migrationJson", id);
    legacyCoverageV1Text = readArchivedRawInput(archive, "coverageV1", id);
    legacyKeyframesV1Text = readArchivedRawInput(archive, "keyframesV1", id);
  } else {
    invariant(currentCoverage.schemaVersion === 1, `${id}: unsupported coverage schemaVersion ${currentCoverage.schemaVersion}`);
    const legacyCoverage = JSON.parse(legacyCoverageV1Text);
    referenceDiagnostics = await inspectLegacyReferences({workspace, evidenceRoot, coverage: legacyCoverage});
  }
  const output = deriveLegacyCoverageV2Outputs({
    id,
    currentManifestText,
    legacyManifestText,
    currentCoverageText,
    legacyCoverageV1Text,
    currentKeyframesText,
    legacyKeyframesV1Text,
    archiveText: archiveTextOrNull || "",
    referenceDiagnostics,
  });
  return {
    summary: output.summary,
    files: [
      {path: paths.archive, observed: archiveTextOrNull, expected: output.archiveText},
      {path: paths.manifest, observed: currentManifestText, expected: output.manifestText},
      {path: paths.coverage, observed: currentCoverageText, expected: output.coverageText},
      {path: paths.keyframes, observed: currentKeyframesText, expected: output.keyframesText},
    ],
  };
}

async function writeExclusive(candidate, content) {
  const handle = await open(candidate, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function atomicReplace(candidate, content) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const temporary = `${candidate}.coverage-v2-${process.pid}-${randomUUID()}.tmp`;
  try {
    await writeExclusive(temporary, content);
    await rename(temporary, candidate);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") throw new AggregateError([error, cleanupError], `Failed to write and clean ${candidate}`);
    }
    throw error;
  }
}

async function acquireLock(migrationsRoot) {
  const lockPath = path.join(migrationsRoot, ".legacy-coverage-v2-upgrade.lock");
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify({pid: process.pid, script: path.basename(scriptPath)})}\n`, "utf8");
    await handle.sync();
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`Another legacy coverage-v2 write is active (${portable(path.relative(projectRoot, lockPath))})`);
    throw error;
  }
  return {
    async release() {
      await handle.close();
      await unlink(lockPath);
    },
  };
}

async function commitPrepared(prepared, {beforeReplace} = {}) {
  const committed = [];
  try {
    for (const {files} of prepared) {
      for (const file of files) {
        const current = await readOptional(file.path);
        invariant(current === file.observed, `Concurrent change detected before write: ${portable(path.relative(projectRoot, file.path))}`);
      }
    }
    for (const {files} of prepared) for (const file of files) {
      if (file.observed === file.expected) continue;
      if (beforeReplace) await beforeReplace({
        path: file.path,
        committedCount: committed.length,
      });
      await atomicReplace(file.path, file.expected);
      committed.push(file);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const file of [...committed].reverse()) {
      try {
        if (file.observed === null) await unlink(file.path);
        else await atomicReplace(file.path, file.observed);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], "Legacy coverage-v2 write failed and rollback was incomplete");
    throw error;
  }
}

export function parseArguments(argumentsList, {migrationsRoot = defaultMigrationsRoot} = {}) {
  const options = {
    ids: [],
    migrationsRoot: path.resolve(migrationsRoot),
    mode: "dry-run",
    json: false,
    help: false,
  };
  let explicitMode = null;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--json") options.json = true;
    else if (["--dry-run", "--check", "--write"].includes(value)) {
      const mode = value.slice(2);
      invariant(explicitMode === null || explicitMode === mode, "--dry-run, --check, and --write are mutually exclusive");
      explicitMode = mode;
      options.mode = mode;
    } else if (value === "--id" || value === "--migrations") {
      const next = argumentsList[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else options.migrationsRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  invariant(new Set(options.ids).size === options.ids.length, "--id values must not be repeated");
  const unknown = options.ids.filter((id) => !LEGACY_COVERAGE_V2_PILOT_IDS.includes(id));
  invariant(unknown.length === 0, `Unknown legacy coverage-v2 pilot(s): ${unknown.join(", ")}`);
  return options;
}

export async function upgradeLegacyPilotCoverageV2(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const ids = options.ids?.length ? options.ids : LEGACY_COVERAGE_V2_PILOT_IDS;
  const mode = options.mode || "dry-run";
  invariant(["dry-run", "check", "write"].includes(mode), `Unsupported mode: ${mode}`);
  const migrationsStat = await lstat(migrationsRoot);
  invariant(migrationsStat.isDirectory() && !migrationsStat.isSymbolicLink(), "migrations root must be a real directory");
  let prepared = [];
  for (const id of ids) prepared.push(await prepareOne(id, {migrationsRoot}));
  if (mode === "check") {
    const stale = prepared.flatMap(({summary, files}) => files
      .filter(({observed, expected}) => observed !== expected)
      .map(({path: candidate}) => `${summary.animationId}: ${portable(path.relative(projectRoot, candidate))}`));
    invariant(stale.length === 0, `Stale legacy coverage-v2 outputs:\n${stale.join("\n")}`);
  } else if (mode === "write") {
    const lock = await acquireLock(migrationsRoot);
    try {
      prepared = [];
      for (const id of ids) prepared.push(await prepareOne(id, {migrationsRoot}));
      await commitPrepared(prepared, {beforeReplace: options.testHooks?.beforeReplace});
    } finally {
      await lock.release();
    }
  }
  return {
    schemaVersion: 1,
    evidenceType: "legacy-pilot-coverage-v2-upgrade-summary",
    mode,
    wrote: mode === "write",
    acceptanceChanged: false,
    promotedLegacyEvidenceCount: 0,
    pilots: prepared.map(({summary, files}) => ({
      ...summary,
      changedFiles: files.filter(({observed, expected}) => observed !== expected)
        .map(({path: candidate}) => portable(path.relative(projectRoot, candidate))),
    })),
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await upgradeLegacyPilotCoverageV2(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  for (const pilot of result.pilots) {
    const prefix = result.mode === "write" ? "UPGRADED" : result.mode === "check" ? "CHECK" : "DRY-RUN";
    console.log(`${prefix} ${pilot.animationId}: root/${pilot.rootFrameCount}, ${pilot.requirementCount} blocked requirements, ${pilot.promotedLegacyEvidenceCount} legacy promotions`);
    for (const candidate of pilot.changedFiles) console.log(`  ${candidate}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
