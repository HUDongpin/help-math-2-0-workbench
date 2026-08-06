#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "../../..");
const registrySourceRoot = path.join(projectRoot, "packages", "demos", "src");
const registryGeneratorPath = path.join(projectRoot, "packages", "demos", "scripts", "generate-registry.mjs");
export const MIGRATION_VALIDATOR_VERSION = "2.1.0";
const REQUIRED_FILES = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "asset-inventory.csv",
  "audio-inventory.csv",
  "keyframes.csv",
  "evidence/full-frame-coverage.json",
  "ACCEPTANCE_CHECKLIST.md",
];
const STATUS_VALUES = new Set([
  "discovered",
  "preserved",
  "audited",
  "baseline-ready",
  "specified",
  "implementing",
  "validating",
  "complete",
  "blocked",
  "missing-source",
]);
const CLASSIFICATION_VALUES = new Set(["confirmed", "inferred", "unresolved"]);
const COLLECTION_VALUES = new Set(["course", "keyterm", "formula", "shell"]);
const DOMAIN_VALUES = new Set([
  "number-sense-place-value",
  "whole-number-operations",
  "fractions-decimals-percent",
  "negative-numbers-number-line",
  "expressions-equations-number-theory",
  "measurement-money",
  "geometry-coordinates",
  "vocabulary",
  "formula-reference",
  "assessment",
  "platform-shell",
  "unknown",
]);

function usage() {
  return "Usage: node skills/flash-to-js/scripts/validate_migration.mjs <migration-directory> [--allow-draft] [--json]";
}

function getValue(object, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value?.[key], object);
}

function findPlaceholders(value, currentPath = "root", found = []) {
  if (typeof value === "string" && /\{\{[^}]+\}\}/.test(value)) found.push(currentPath);
  else if (Array.isArray(value)) value.forEach((item, index) => findPlaceholders(item, `${currentPath}[${index}]`, found));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) findPlaceholders(item, `${currentPath}.${key}`, found);
  }
  return found;
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
  values.push(value);
  return values;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/i.test(value || "");
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function resolveExistingPath(value, roots) {
  if (!value || typeof value !== "string") return null;
  const candidates = path.isAbsolute(value) ? [value] : roots.map((root) => path.resolve(root, value));
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  return null;
}

function hasAcceptedException(manifest, evidenceId) {
  return (manifest.acceptance?.knownExceptions || []).some((exception) =>
    typeof exception === "object" && exception.id && (!evidenceId || exception.evidenceIds?.includes(evidenceId)) &&
    exception.reason && exception.ownerDecision === "accepted",
  );
}

async function verifyChecksum(filePath, expected, label, errors) {
  if (!isSha256(expected)) {
    errors.push(`${label}: sha256 must contain 64 hexadecimal characters`);
    return false;
  }
  if ((await sha256(filePath)) !== expected.toLowerCase()) {
    errors.push(`${label}: sha256 does not match the file`);
    return false;
  }
  return true;
}

async function verifyPng(filePath, expectedWidth, expectedHeight, label, errors) {
  let png;
  try {
    png = PNG.sync.read(await readFile(filePath));
  } catch (error) {
    errors.push(`${label}: is not a decodable PNG (${error.message})`);
    return null;
  }
  if (png.width !== expectedWidth || png.height !== expectedHeight) {
    errors.push(`${label}: PNG dimensions ${png.width}x${png.height} do not match native stage ${expectedWidth}x${expectedHeight}`);
  }
  return png;
}

function requireHeaders(csv, required, label, errors) {
  for (const header of required) if (!csv.headers.includes(header)) errors.push(`${label}: missing column ${header}`);
}

function validateReview(review, label, { allowNotRequired = false } = {}, errors) {
  const decisions = allowNotRequired ? ["accepted", "not-required"] : ["accepted"];
  if (!review || !decisions.includes(review.decision)) {
    errors.push(`${label}.decision must be ${decisions.join(" or ")}`);
    return;
  }
  if (review.decision === "accepted") {
    if (!review.reviewer) errors.push(`${label}.reviewer is required`);
    if (!review.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) errors.push(`${label}.reviewedAt must be an ISO date`);
  } else if (!review.reason) errors.push(`${label}.reason is required when review is not-required`);
}

async function validateInventory({ root, manifest, errors }) {
  const projectRoots = [process.cwd(), root];
  const assets = parseCsv(await readFile(path.join(root, manifest.evidence.assetInventory), "utf8"));
  requireHeaders(assets, ["asset_id", "exported_file", "sha256", "confidence", "license_or_provenance"], "asset-inventory.csv", errors);
  if (manifest.audit.assetsRequired && !assets.rows.length) errors.push("asset-inventory.csv must contain at least one asset when audit.assetsRequired is true");
  if (!manifest.audit.assetsRequired && !manifest.audit.assetsNotRequiredReason) errors.push("audit.assetsNotRequiredReason is required when assets are not required");
  for (const [index, row] of assets.rows.entries()) {
    const label = `asset-inventory.csv row ${index + 2}`;
    if (!row.asset_id) errors.push(`${label}: asset_id is required`);
    const filePath = await resolveExistingPath(row.exported_file, projectRoots);
    if (!filePath) errors.push(`${label}: exported_file does not exist (${row.exported_file || "empty"})`);
    else await verifyChecksum(filePath, row.sha256, label, errors);
    if (!row.license_or_provenance) errors.push(`${label}: license_or_provenance is required`);
  }

  const audioPath = path.join(root, manifest.audio.inventoryFile);
  const audio = parseCsv(await readFile(audioPath, "utf8"));
  requireHeaders(audio, ["cue_id", "language", "source_file", "sha256", "start_frame", "duration_ms"], "audio-inventory.csv", errors);
  if (manifest.audio.required && !audio.rows.length) errors.push("audio-inventory.csv must contain at least one cue when audio.required is true");
  if (!manifest.audio.required && !manifest.audio.reasonNotRequired) errors.push("audio.reasonNotRequired is required when audio is not required");
  const audioLanguages = new Set();
  const cueIds = new Set();
  for (const [index, row] of audio.rows.entries()) {
    const label = `audio-inventory.csv row ${index + 2}`;
    if (!row.cue_id) errors.push(`${label}: cue_id is required`);
    cueIds.add(row.cue_id);
    audioLanguages.add(row.language);
    if (!manifest.localization.languages.includes(row.language) && row.language !== "shared") errors.push(`${label}: unsupported language ${row.language}`);
    const filePath = await resolveExistingPath(row.source_file, projectRoots);
    if (!filePath) errors.push(`${label}: source_file does not exist (${row.source_file || "empty"})`);
    else await verifyChecksum(filePath, row.sha256, label, errors);
    const frame = Number(row.start_frame);
    if (!Number.isInteger(frame) || frame < 1 || frame > manifest.runtime.frameCount) errors.push(`${label}: start_frame must be within the movie timeline`);
    if (!(Number(row.duration_ms) > 0)) errors.push(`${label}: duration_ms must be greater than zero`);
  }
  if (manifest.audio.required) {
    for (const language of manifest.audio.languages || []) {
      if (!audioLanguages.has(language) && !audioLanguages.has("shared")) errors.push(`audio-inventory.csv has no cue for required language ${language}`);
    }
    for (const cue of manifest.audio.cues || []) if (!cueIds.has(cue.id)) errors.push(`audio cue ${cue.id} is not present in audio-inventory.csv`);
  }
}

async function validateKeyframes({ root, manifest, errors }) {
  const keyframes = parseCsv(await readFile(path.join(root, manifest.evidence.keyframeCsv), "utf8"));
  requireHeaders(keyframes, [
    "frame", "scenario", "language", "kind", "baseline_file", "baseline_sha256", "implementation_file",
    "implementation_sha256", "diff_file", "diff_sha256", "normalized_rmse", "timing_result", "visual_result", "reviewer",
  ], "keyframes.csv", errors);
  if (!keyframes.rows.length) errors.push("keyframes.csv must contain at least one evidence row");
  const scenarioIds = new Set(manifest.scenarios.map(({ id }) => id));
  for (const [index, row] of keyframes.rows.entries()) {
    const rowName = `keyframes.csv row ${index + 2}`;
    const frame = Number(row.frame);
    if (!Number.isInteger(frame) || frame < 1 || frame > manifest.runtime.frameCount) errors.push(`${rowName}: frame must be within the one-indexed movie timeline`);
    if (!scenarioIds.has(row.scenario)) errors.push(`${rowName}: unknown scenario ${row.scenario}`);
    if (!manifest.localization.languages.includes(row.language)) errors.push(`${rowName}: unsupported language ${row.language}`);
    for (const [field, hashField] of [
      ["baseline_file", "baseline_sha256"],
      ["implementation_file", "implementation_sha256"],
      ["diff_file", "diff_sha256"],
    ]) {
      const filePath = await resolveExistingPath(row[field], [root]);
      if (!filePath) errors.push(`${rowName}: ${field} does not exist (${row[field] || "empty"})`);
      else {
        await verifyPng(filePath, manifest.runtime.stage.width, manifest.runtime.stage.height, `${rowName} ${field}`, errors);
        await verifyChecksum(filePath, row[hashField], `${rowName} ${hashField}`, errors);
      }
    }
    const rmse = Number(row.normalized_rmse);
    if (!(Number.isFinite(rmse) && rmse >= 0 && rmse <= 1)) errors.push(`${rowName}: normalized_rmse must be between 0 and 1`);
    const evidenceId = `keyframe:${row.scenario}:${row.language}:${row.frame}`;
    const exceptionAllowed = hasAcceptedException(manifest, evidenceId);
    if (row.timing_result !== "pass" && !(row.timing_result === "accepted-exception" && exceptionAllowed)) {
      errors.push(`${rowName}: timing_result must be pass or a matching accepted exception`);
    }
    const threshold = row.kind === "transition"
      ? manifest.fidelity.transitionFrameMaxNormalizedRmse
      : manifest.fidelity.staticFrameMaxNormalizedRmse;
    if (Number.isFinite(rmse) && rmse > threshold) {
      if (!(row.visual_result === "accepted-exception" && exceptionAllowed)) errors.push(`${rowName}: normalized_rmse ${rmse} exceeds ${threshold} without a matching accepted exception`);
    } else if (row.visual_result !== "pass" && !(row.visual_result === "accepted-exception" && exceptionAllowed)) {
      errors.push(`${rowName}: visual_result must be pass or a matching accepted exception`);
    }
    if (!row.reviewer) errors.push(`${rowName}: reviewer is required`);
  }
}

async function validateCaptureManifest({ capturePath, expected, root, manifest, label, errors }) {
  await verifyChecksum(capturePath, expected.captureManifestSha256, label, errors);
  let capture;
  try {
    capture = JSON.parse(await readFile(capturePath, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid capture manifest (${error.message})`);
    return;
  }
  if (capture.schemaVersion !== 2 || capture.status !== "complete") errors.push(`${label}: capture manifest must be schemaVersion 2 and complete`);
  if (capture.scenario !== expected.scenario || capture.language !== expected.language || String(capture.seed) !== String(expected.seed)) errors.push(`${label}: scenario/language/seed do not match coverage metadata`);
  if (capture.reportedFrameAttribute !== "data-flash-frame") errors.push(`${label}: reportedFrameAttribute must be data-flash-frame`);
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    if (!Array.isArray(capture[field]) || capture[field].length) errors.push(`${label}: ${field} must be an empty array`);
  }
  if (capture.viewport?.width !== manifest.runtime.stage.width || capture.viewport?.height !== manifest.runtime.stage.height || capture.viewport?.deviceScaleFactor !== 1) {
    errors.push(`${label}: viewport must match the native stage at device scale 1`);
  }
  const items = capture.captured || [];
  if (items.length !== manifest.runtime.frameCount) errors.push(`${label}: captured count must equal runtime.frameCount`);
  const frameSet = new Set(items.map(({ frame }) => Number(frame)));
  for (let frame = 1; frame <= manifest.runtime.frameCount; frame += 1) if (!frameSet.has(frame)) errors.push(`${label}: missing captured frame ${frame}`);
  const captureRoot = path.dirname(capturePath);
  for (const [index, item] of items.entries()) {
    const itemLabel = `${label} captured[${index}]`;
    if (item.reportedFrame !== item.frame) errors.push(`${itemLabel}: reportedFrame must equal frame`);
    if (item.scenario !== expected.scenario || item.language !== expected.language || String(item.seed) !== String(expected.seed)) errors.push(`${itemLabel}: scenario/language/seed mismatch`);
    const filePath = await resolveExistingPath(item.file, [captureRoot, root]);
    if (!filePath) errors.push(`${itemLabel}: file does not exist (${item.file || "empty"})`);
    else {
      await verifyPng(filePath, manifest.runtime.stage.width, manifest.runtime.stage.height, itemLabel, errors);
      await verifyChecksum(filePath, item.sha256, itemLabel, errors);
    }
  }
}

async function validateFullFrameCoverage({ root, manifest, errors }) {
  const coveragePath = path.join(root, manifest.evidence.fullFrameCoverageFile);
  let coverage;
  try {
    coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid full-frame coverage JSON: ${error.message}`);
    return;
  }
  if (coverage.schemaVersion !== 1) errors.push("full-frame coverage schemaVersion must be 1");
  if (coverage.animationId !== manifest.animationId) errors.push("full-frame coverage animationId must match migration.json");
  if (coverage.frameCount !== manifest.runtime.frameCount) errors.push("full-frame coverage frameCount must match runtime.frameCount");
  const scenarioIds = manifest.scenarios.map(({ id }) => id);
  const languages = manifest.localization.languages;
  if (JSON.stringify([...(coverage.scenarios || [])].sort()) !== JSON.stringify([...scenarioIds].sort())) errors.push("full-frame coverage scenarios must exactly match migration scenarios");
  if (JSON.stringify([...(coverage.languages || [])].sort()) !== JSON.stringify([...languages].sort())) errors.push("full-frame coverage languages must exactly match localization languages");
  const combinations = coverage.combinations || [];
  const seen = new Set();
  for (const combination of combinations) {
    const key = `${combination.scenario}\0${combination.language}`;
    if (seen.has(key)) errors.push(`full-frame coverage contains duplicate combination ${combination.scenario}/${combination.language}`);
    seen.add(key);
  }
  for (const scenario of scenarioIds) for (const language of languages) {
    const key = `${scenario}\0${language}`;
    if (!seen.has(key)) errors.push(`full-frame coverage is missing scenario/language combination ${scenario}/${language}`);
  }
  if (combinations.length !== scenarioIds.length * languages.length) errors.push("full-frame coverage must contain exactly one entry for every scenario/language combination");

  for (const [index, combination] of combinations.entries()) {
    const label = `full-frame coverage combination ${index + 1} (${combination.scenario}/${combination.language})`;
    if (combination.firstFrame !== 1 || combination.lastFrame !== manifest.runtime.frameCount || combination.capturedFrameCount !== manifest.runtime.frameCount || !Array.isArray(combination.missingFrames) || combination.missingFrames.length) {
      errors.push(`${label}: must declare complete one-indexed frame coverage with no missing frames`);
    }
    if (combination.seed === undefined || combination.seed === null || combination.seed === "") errors.push(`${label}: seed is required`);
    const capturePath = await resolveExistingPath(combination.captureManifest, [root]);
    if (!capturePath) errors.push(`${label}: captureManifest does not exist (${combination.captureManifest || "empty"})`);
    else await validateCaptureManifest({ capturePath, expected: combination, root, manifest, label, errors });

    const metricsPath = await resolveExistingPath(combination.metricsFile, [root]);
    if (!metricsPath) {
      errors.push(`${label}: metricsFile does not exist (${combination.metricsFile || "empty"})`);
      continue;
    }
    await verifyChecksum(metricsPath, combination.metricsSha256, `${label} metrics`, errors);
    let metrics;
    try {
      metrics = JSON.parse(await readFile(metricsPath, "utf8"));
    } catch (error) {
      errors.push(`${label}: invalid metrics JSON (${error.message})`);
      continue;
    }
    if (metrics.scenario !== combination.scenario || metrics.language !== combination.language || String(metrics.seed) !== String(combination.seed)) errors.push(`${label}: metrics scenario/language/seed mismatch`);
    if (!Array.isArray(metrics.frames) || metrics.frames.length !== manifest.runtime.frameCount) errors.push(`${label}: metrics must contain one result per frame`);
    const metricFrames = new Set((metrics.frames || []).map(({ frame }) => Number(frame)));
    for (let frame = 1; frame <= manifest.runtime.frameCount; frame += 1) if (!metricFrames.has(frame)) errors.push(`${label}: metrics missing frame ${frame}`);
    for (const metric of metrics.frames || []) {
      const rmse = Number(metric.normalizedRmse);
      const threshold = metric.kind === "transition" ? manifest.fidelity.transitionFrameMaxNormalizedRmse : manifest.fidelity.staticFrameMaxNormalizedRmse;
      const evidenceId = `full-frame:${combination.scenario}:${combination.language}:${metric.frame}`;
      const excepted = metric.result === "accepted-exception" && hasAcceptedException(manifest, evidenceId);
      if (!(Number.isFinite(rmse) && rmse >= 0 && rmse <= 1)) errors.push(`${label}: frame ${metric.frame} has invalid normalizedRmse`);
      else if (rmse > threshold && !excepted) errors.push(`${label}: frame ${metric.frame} exceeds RMSE ${threshold} without a matching accepted exception`);
      if (metric.result !== "pass" && !excepted) errors.push(`${label}: frame ${metric.frame} result must be pass or a matching accepted exception`);
    }
  }
}

export async function validateMigration(directory, { allowDraft = false } = {}) {
  const root = path.resolve(directory);
  const errors = [];
  const warnings = [];

  for (const file of REQUIRED_FILES) if (!(await exists(path.join(root, file)))) errors.push(`Missing required file: ${file}`);
  if (errors.length) return { ok: false, mode: allowDraft ? "draft" : "strict", root, errors, warnings };

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(root, "migration.json"), "utf8"));
  } catch (error) {
    errors.push(`Invalid migration.json: ${error.message}`);
    return { ok: false, mode: allowDraft ? "draft" : "strict", root, errors, warnings };
  }

  for (const field of [
    "schemaVersion", "id", "animationId", "assetId", "status", "classification.collection", "classification.domain",
    "classification.status", "source", "runtime.stage.width", "runtime.stage.height", "runtime.fps", "runtime.frameCount",
    "localization.languages", "scenarios", "audio.required", "baseline.keyframeCsv", "implementation.rendering",
    "implementation.registryModule", "implementation.captureContract.frameAttribute", "evidence.assetInventory", "evidence.audioInventory",
    "evidence.keyframeCsv", "evidence.fullFrameCoverageFile", "fidelity.staticFrameMaxNormalizedRmse",
    "fidelity.transitionFrameMaxNormalizedRmse", "accessibility", "acceptance.engineeringReview", "acceptance.ownerReview",
  ]) if (getValue(manifest, field) === undefined) errors.push(`Missing manifest field: ${field}`);

  if (manifest.id && manifest.id !== path.basename(root)) warnings.push(`Manifest ID '${manifest.id}' differs from directory '${path.basename(root)}'`);
  if (!STATUS_VALUES.has(manifest.status)) errors.push(`status must be one of: ${[...STATUS_VALUES].join(", ")}`);
  if (manifest.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (manifest.baseline?.keyframeCsv !== manifest.evidence?.keyframeCsv) errors.push("baseline.keyframeCsv and evidence.keyframeCsv must reference the same file");
  if (manifest.audio?.inventoryFile !== manifest.evidence?.audioInventory) errors.push("audio.inventoryFile and evidence.audioInventory must reference the same file");

  if (!allowDraft) {
    for (const location of findPlaceholders(manifest)) errors.push(`Unresolved template placeholder: ${location}`);
    if (manifest.status !== "complete") errors.push("status must be 'complete'");
    if (!manifest.animationId || manifest.animationId !== manifest.id) errors.push("animationId must be non-empty and match id");
    if (!COLLECTION_VALUES.has(manifest.classification?.collection)) errors.push("classification.collection is invalid");
    if (!DOMAIN_VALUES.has(manifest.classification?.domain)) errors.push("classification.domain is invalid");
    if (!CLASSIFICATION_VALUES.has(manifest.classification?.status)) errors.push("classification.status is invalid");
    if (!Array.isArray(manifest.classification?.evidence) || !manifest.classification.evidence.length) errors.push("classification.evidence must contain at least one source-backed entry");
    if (!manifest.classification?.titleRaw || !manifest.classification?.titleDisplay) errors.push("classification.titleRaw and titleDisplay are required");
    if (!manifest.source?.swf) errors.push("A preserved SWF source path is required for strict validation");
    if (!manifest.source?.placementPath) errors.push("source.placementPath is required");
    if (!["present", "missing", "not-applicable", "unreadable"].includes(manifest.source?.pairedFlaStatus)) errors.push("source.pairedFlaStatus is invalid");
    for (const kind of ["fla", "swf"]) {
      const sourcePath = manifest.source?.[kind];
      if (!sourcePath) continue;
      const hashField = `${kind}Sha256`;
      const resolvedSource = await resolveExistingPath(sourcePath, [process.cwd(), root]);
      if (!resolvedSource) errors.push(`${kind.toUpperCase()} source does not exist: ${sourcePath}`);
      else await verifyChecksum(resolvedSource, manifest.source[hashField], hashField, errors);
    }
    if (manifest.source?.pairedFlaStatus === "present" && !manifest.source.fla) errors.push("source.fla is required when pairedFlaStatus is present");
    if (!isSha256(manifest.source?.swfSha256) || manifest.assetId !== `swf-${manifest.source.swfSha256?.toLowerCase()}`) errors.push("assetId must equal swf-<full lowercase SWF SHA-256>");

    if (!["high", "medium", "low"].includes(manifest.confidence)) errors.push("confidence must be high, medium, or low");
    for (const field of ["runtime.swfVersion", "runtime.stage.width", "runtime.stage.height", "runtime.fps", "runtime.frameCount", "runtime.durationMs"]) {
      const value = getValue(manifest, field);
      if (!(Number.isFinite(value) && value > 0)) errors.push(`${field} must be greater than zero`);
    }
    for (const field of ["runtime.swfSignature", "runtime.backgroundColor", "runtime.actionScriptVersion", "runtime.complexity", "toolVersions.ruffle", "toolVersions.browser", "baseline.authority", "baseline.route", "implementation.rendering", "implementation.route", "implementation.routeFile", "implementation.component", "implementation.registryModule", "implementation.timelineModule", "implementation.testFile"]) {
      const value = getValue(manifest, field);
      if (!value || ["unknown", "undecided"].includes(value)) errors.push(`${field} must be completed`);
    }
    if (manifest.implementation?.captureContract?.frameAttribute !== "data-flash-frame") errors.push("implementation.captureContract.frameAttribute must be data-flash-frame");
    for (const [field, value] of Object.entries({
      "baseline.routeFile": manifest.baseline?.routeFile,
      "implementation.routeFile": manifest.implementation?.routeFile,
      "implementation.component": manifest.implementation?.component,
      "implementation.timelineModule": manifest.implementation?.timelineModule,
      "implementation.testFile": manifest.implementation?.testFile,
    })) if (!(await resolveExistingPath(value, [process.cwd(), root]))) errors.push(`${field} does not exist (${value || "empty"})`);
    const registryModule = manifest.implementation?.registryModule;
    if (!/^\.\/modules\/[a-z0-9][a-z0-9-]*$/.test(registryModule || "")) {
      errors.push("implementation.registryModule must be a generated-registry specifier like ./modules/<animation-id>");
    } else {
      const moduleBase = path.join(registrySourceRoot, registryModule.slice(2));
      if (!(await exists(`${moduleBase}.tsx`)) && !(await exists(`${moduleBase}.ts`))) {
        errors.push(`implementation.registryModule does not exist in packages/demos/src (${registryModule})`);
      }
    }
    if (!(await exists(registryGeneratorPath))) {
      errors.push("Generated animation registry consumer is missing");
    } else {
      const registryGenerator = await readFile(registryGeneratorPath, "utf8");
      if (!registryGenerator.includes("catalog/completion-ledger.json") || !registryGenerator.includes("registryModule")) {
        errors.push("Generated animation registry does not consume completion-ledger registryModule entries");
      }
    }
    if (!String(manifest.baseline?.route || "").startsWith("/") || !String(manifest.implementation?.route || "").startsWith("/")) errors.push("baseline.route and implementation.route must be application routes beginning with /");
    if (manifest.baseline?.viewport?.width !== manifest.runtime?.stage?.width || manifest.baseline?.viewport?.height !== manifest.runtime?.stage?.height || manifest.baseline?.viewport?.deviceScaleFactor !== 1) errors.push("baseline viewport must match the native runtime stage at device scale 1");

    if (!Array.isArray(manifest.localization?.languages) || !manifest.localization.languages.length || new Set(manifest.localization.languages).size !== manifest.localization.languages.length) errors.push("localization.languages must contain unique language codes");
    if (manifest.localization?.bilingualRequired && !(manifest.localization.languages.includes("en") && manifest.localization.languages.includes("es"))) errors.push("bilingual migrations must include en and es");
    if (!Array.isArray(manifest.scenarios) || !manifest.scenarios.length) errors.push("scenarios must contain every reachable scenario");
    const scenarioIds = new Set();
    for (const [index, scenario] of (manifest.scenarios || []).entries()) {
      if (!scenario.id || scenarioIds.has(scenario.id)) errors.push(`scenarios[${index}].id must be non-empty and unique`);
      scenarioIds.add(scenario.id);
      if (!scenario.description || !["linear", "interactive"].includes(scenario.kind) || scenario.reachable !== true) errors.push(`scenarios[${index}] must have description, linear/interactive kind, and reachable=true`);
    }
    if (!Array.isArray(manifest.audio?.cues)) errors.push("audio.cues must be an array");
    if (manifest.audio?.required && (!Array.isArray(manifest.audio.languages) || !manifest.audio.languages.length)) errors.push("audio.languages is required when audio is required");

    for (const [key, value] of Object.entries(manifest.accessibility || {})) if (value !== true) errors.push(`accessibility.${key} must be true`);
    validateReview(manifest.acceptance?.engineeringReview, "acceptance.engineeringReview", {}, errors);
    validateReview(manifest.acceptance?.humanVisualReview, "acceptance.humanVisualReview", {}, errors);
    validateReview(manifest.acceptance?.ownerReview, "acceptance.ownerReview", { allowNotRequired: true }, errors);
    if (manifest.acceptance?.humanVisualReview?.scope !== "all-keyframe-and-full-frame-diffs") errors.push("acceptance.humanVisualReview.scope must be all-keyframe-and-full-frame-diffs");

    const checklist = await readFile(path.join(root, "ACCEPTANCE_CHECKLIST.md"), "utf8");
    const unchecked = checklist.match(/^- \[ \]/gm) || [];
    if (unchecked.length) errors.push(`${unchecked.length} acceptance checklist item(s) remain unchecked`);
    if (!(checklist.match(/^- \[[xX]\]/gm) || []).length) errors.push("Acceptance checklist has no completed items");

    await validateInventory({ root, manifest, errors });
    await validateKeyframes({ root, manifest, errors });
    await validateFullFrameCoverage({ root, manifest, errors });
  } else {
    warnings.push("Draft mode validates portable schema structure only; it does not resolve paths or prove migration completion");
  }

  return { ok: errors.length === 0, mode: allowDraft ? "draft" : "strict", root, errors, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    process.exitCode = args.length ? 0 : 1;
    return;
  }
  const directory = args.find((value) => !value.startsWith("--"));
  if (!directory) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  const result = await validateMigration(directory, { allowDraft: args.includes("--allow-draft") });
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.ok ? "PASS" : "FAIL"}: ${result.mode} validation for ${result.root}`);
    for (const warning of result.warnings) console.log(`WARN: ${warning}`);
    for (const error of result.errors) console.error(`ERROR: ${error}`);
  }
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
