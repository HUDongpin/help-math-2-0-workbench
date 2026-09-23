#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, realpath, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {embeddedInventoryRows, externalInventoryRows} from "./audit-pilot-audio.mjs";
import {parseAudioInventory, validateStrictAudioEvidence} from "./audio-listening-acceptance.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const PILOT_AUDIO_ADOPTION_ALLOWLIST = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
  "keyterm-elementary-acute-angle",
  "keyterm-elementary-computeghgh",
  "course-g03-l01-vb-004",
  "course-g04-l01-ir-001",
  "course-g03-l06-ti-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "course-g03-l01-ts-008",
  "course-g03-l06-fq-002-review",
  "course-g03-l08-re-001",
  "shell-course-g04-l01-index-local",
  "shell-course-g04-l03-index-local",
]);

const AUDIO_TECHNICAL_FIELDS = Object.freeze(["required", "reasonNotRequired", "languages", "inventoryFile", "cues"]);

function usage() {
  return `Usage:
  node scripts/adopt-pilot-audio-scope.mjs [--id <animation-id>] [--check | --dry-run]

Adopts only source-hash-current, machine-derived pilot audio technical scope into
migration.audio. Candidate-only, missing, stale, or inconsistent evidence blocks
the whole selected transaction. Human review, owner review, status, acceptance,
and every non-audio-technical field are never changed.`;
}

export function parseArguments(argv) {
  const options = {ids: [], check: false, dryRun: false, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--id") {
      const id = argv[index + 1];
      if (!id) throw new Error("--id requires an animation ID");
      options.ids.push(id);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.check && options.dryRun) throw new Error("--check and --dry-run are mutually exclusive");
  return options;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function resolveSafeProjectFile(root, declared, label) {
  invariant(typeof declared === "string" && declared && !path.isAbsolute(declared) && !declared.includes("\\"), `${label}: path is missing, absolute, or non-portable`);
  const normalized = portable(path.normalize(declared));
  invariant(normalized === declared && normalized !== ".." && !normalized.startsWith("../"), `${label}: path escapes the project root`);
  const candidate = path.resolve(root, declared);
  invariant(await exists(candidate), `${label}: file does not exist (${declared})`);
  const [actualRoot, actualFile] = await Promise.all([realpath(root), realpath(candidate)]);
  const relative = path.relative(actualRoot, actualFile);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `${label}: symlink escapes the project root`);
  return candidate;
}

function nullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizedRow(row, {includeCueId = true} = {}) {
  const normalized = {
    language: row.language || "",
    sourceFile: row.source_file || "",
    sha256: row.sha256 || "",
    durationMs: nullableNumber(row.duration_ms),
    startFrame: nullableNumber(row.start_frame),
    startFrameDomainId: row.start_frame_domain_id || null,
    startSemantics: row.start_semantics || "",
    format: row.format || "",
    channels: nullableNumber(row.channels),
    sampleRateHz: nullableNumber(row.sample_rate_hz),
    sourceCharacterId: row.source_character_id === "" || row.source_character_id === undefined ? null : String(row.source_character_id),
  };
  if (includeCueId) normalized.cueId = row.cue_id || "";
  return normalized;
}

function machineComparable(rows) {
  return rows.map((row) => normalizedRow(row, {includeCueId: false}))
    .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
}

function cueFromRow(row) {
  const normalized = normalizedRow(row);
  return {
    id: normalized.cueId,
    language: normalized.language,
    source: normalized.sourceFile,
    sha256: normalized.sha256,
    durationMs: normalized.durationMs,
    startFrame: normalized.startFrame,
    startFrameDomainId: normalized.startFrameDomainId,
    startSemantics: normalized.startSemantics,
    format: normalized.format,
    channels: normalized.channels,
    sampleRateHz: normalized.sampleRateHz,
  };
}

function existingCueMatchesRow(cue, row) {
  const expected = cueFromRow(row);
  const source = cue.source ?? cue.sourceFile;
  if (
    (cue.id ?? cue.cueId) !== expected.id || cue.language !== expected.language || source !== expected.source ||
    cue.sha256 !== expected.sha256 || Number(cue.durationMs) !== expected.durationMs ||
    (cue.startFrame ?? null) !== expected.startFrame || (cue.startFrameDomainId ?? null) !== expected.startFrameDomainId ||
    (cue.startSemantics || "timeline-frame") !== expected.startSemantics
  ) return false;
  for (const field of ["format", "channels", "sampleRateHz"]) {
    if (cue[field] !== undefined && cue[field] !== null && cue[field] !== expected[field]) return false;
  }
  return true;
}

function existingCuesAreCurrent(cues, rows) {
  if (!Array.isArray(cues) || cues.length !== rows.length) return false;
  return rows.every((row) => cues.some((cue) => existingCueMatchesRow(cue, row)));
}

function assertOnlyAudioTechnicalFieldsChanged(before, after, animationId) {
  const stripped = (manifest) => {
    const clone = structuredClone(manifest);
    const audio = clone.audio || {};
    for (const field of AUDIO_TECHNICAL_FIELDS) delete audio[field];
    clone.audio = audio;
    return clone;
  };
  invariant(canonicalJson(stripped(before)) === canonicalJson(stripped(after)), `${animationId}: adoption changed a field outside the audio technical allowlist`);
}

async function validateSourceBinding({root, manifest, audit, animationId}) {
  invariant(audit.source?.swf === manifest.source?.swf, `${animationId}: machine audio audit source path differs from migration.json`);
  invariant(
    audit.source?.hashMatches === true && SHA256_PATTERN.test(audit.source?.expectedSha256 || "") &&
    audit.source.expectedSha256 === manifest.source?.swfSha256 && audit.source.observedSha256 === manifest.source.swfSha256,
    `${animationId}: machine audio audit is not bound to the current source SWF hash`,
  );
  const sourcePath = await resolveSafeProjectFile(root, manifest.source.swf, `${animationId} source SWF`);
  invariant(digest(await readFile(sourcePath)) === manifest.source.swfSha256, `${animationId}: source SWF bytes differ from migration.json`);
}

async function validateRequiredRows({root, manifest, audit, rows, animationId}) {
  invariant(audit.acceptance?.structurallyAudited === true, `${animationId}: machine audio structure is not audited`);
  invariant(!(audit.externalAudio?.lessonGroupCandidates || []).length, `${animationId}: candidate-only lesson audio must be resolved before technical-scope adoption`);
  invariant(!(audit.externalAudio?.expectedButMissing || []).length, `${animationId}: expected audio source is missing`);
  invariant((audit.externalAudio?.missingExpectedCount || 0) === 0, `${animationId}: machine audit reports expected missing audio`);
  const machineRows = [
    ...externalInventoryRows(audit.externalAudio?.exactAssociations || [], manifest, audit.authority?.hostScript || {conventions: {}}),
    ...embeddedInventoryRows(manifest, audit.embeddedAudio || {defineSounds: [], startSounds: [], soundStreams: []}),
  ];
  invariant(canonicalJson(machineComparable(rows)) === canonicalJson(machineComparable(machineRows)), `${animationId}: audio inventory differs from independently machine-derived rows`);
  invariant(Number(audit.inventory?.rowCount) === rows.length, `${animationId}: machine audit inventory row count is stale`);
  const ids = rows.map((row) => row.cue_id);
  invariant(ids.every(Boolean) && new Set(ids).size === ids.length, `${animationId}: audio inventory cue IDs are missing or duplicated`);
  for (const item of audit.externalAudio?.exactAssociations || []) {
    invariant(item.hashMatchesCatalog === true && SHA256_PATTERN.test(item.observedSha256 || "") && item.catalogSha256 === item.observedSha256, `${animationId}: external audio catalog/source hash is inconsistent (${item.sourceFile || "missing"})`);
    invariant(String(item.probe?.codecName || "").trim() && Number(item.probe?.durationMs) > 0 && Number(item.probe?.probeSizeBytes) > 0 && Number(item.probe?.channels) > 0 && Number(item.probe?.sampleRateHz) > 0, `${animationId}: external audio codec/duration metadata is incomplete (${item.sourceFile || "missing"})`);
  }
  for (const row of rows) {
    const normalized = normalizedRow(row);
    invariant(SHA256_PATTERN.test(normalized.sha256), `${animationId}: cue ${normalized.cueId} has an invalid SHA-256`);
    invariant(Number.isFinite(normalized.durationMs) && normalized.durationMs > 0, `${animationId}: cue ${normalized.cueId} has invalid duration`);
    invariant(normalized.format && Number.isFinite(normalized.channels) && normalized.channels > 0 && Number.isFinite(normalized.sampleRateHz) && normalized.sampleRateHz > 0, `${animationId}: cue ${normalized.cueId} has incomplete codec metadata`);
    invariant(["timeline-frame", "interaction-state", "host-user-activated"].includes(normalized.startSemantics), `${animationId}: cue ${normalized.cueId} has invalid start semantics`);
    if (normalized.startSemantics === "timeline-frame") {
      invariant(Number.isInteger(normalized.startFrame) && normalized.startFrame >= 1 && normalized.startFrameDomainId, `${animationId}: timeline cue ${normalized.cueId} lacks an exact frame/domain`);
    } else invariant(normalized.startFrame === null && normalized.startFrameDomainId === null, `${animationId}: non-timeline cue ${normalized.cueId} must not claim a frame/domain`);
    const sourcePath = await resolveSafeProjectFile(root, normalized.sourceFile, `${animationId} cue ${normalized.cueId}`);
    invariant(digest(await readFile(sourcePath)) === normalized.sha256, `${animationId}: cue ${normalized.cueId} source bytes/hash differ`);
  }
}

export async function buildPilotAudioAdoption({root = PROJECT_ROOT, animationId}) {
  invariant(PILOT_AUDIO_ADOPTION_ALLOWLIST.includes(animationId), `Not an approved pilot: ${animationId}`);
  const workspace = path.join(root, "migrations", animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  const [manifestBytes, auditBytes] = await Promise.all([readFile(manifestPath), readFile(auditPath)]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const audit = JSON.parse(auditBytes.toString("utf8"));
  invariant(manifest.animationId === animationId && audit.animationId === animationId, `${animationId}: manifest/audio-audit identity mismatch`);
  await validateSourceBinding({root, manifest, audit, animationId});
  invariant(audit.inventory?.file === "audio-inventory.csv", `${animationId}: machine audit must bind audio-inventory.csv`);
  const inventoryPath = await resolveSafeProjectFile(root, `migrations/${animationId}/audio-inventory.csv`, `${animationId} audio inventory`);
  const rows = parseAudioInventory(await readFile(inventoryPath, "utf8")).rows;
  invariant(audit.acceptance?.structurallyAudited === true, `${animationId}: machine audio structure is not audited`);
  invariant(!(audit.externalAudio?.lessonGroupCandidates || []).length, `${animationId}: candidate-only lesson audio must be resolved before technical-scope adoption`);
  invariant(!(audit.externalAudio?.expectedButMissing || []).length && (audit.externalAudio?.missingExpectedCount || 0) === 0, `${animationId}: expected audio source is missing`);
  const hasDeterministicAudio = rows.length > 0;
  if (!hasDeterministicAudio) {
    invariant(manifest.audio?.required === false, `${animationId}: an empty inventory cannot satisfy migration.audio.required`);
    const noAudioErrors = await validateStrictAudioEvidence({projectRoot: root, workspace, manifest});
    invariant(noAudioErrors.length === 0, `${animationId}: no-audio scope lacks a current accepted structural negative proof (${noAudioErrors.join("; ")})`);
  } else await validateRequiredRows({root, manifest, audit, rows, animationId});

  const updated = structuredClone(manifest);
  updated.audio ||= {};
  updated.audio.required = hasDeterministicAudio;
  if (hasDeterministicAudio) updated.audio.reasonNotRequired = "";
  updated.audio.languages = [...new Set(rows.map(({language}) => language).filter(Boolean))].sort();
  updated.audio.inventoryFile = "audio-inventory.csv";
  if (!hasDeterministicAudio) updated.audio.cues = [];
  else if (existingCuesAreCurrent(manifest.audio?.cues, rows)) updated.audio.cues = manifest.audio.cues;
  else updated.audio.cues = rows.map(cueFromRow);
  invariant(updated.audio.required !== true || updated.audio.reasonNotRequired === "", `${animationId}: required audio cannot retain reasonNotRequired`);
  assertOnlyAudioTechnicalFieldsChanged(manifest, updated, animationId);
  const updatedText = `${JSON.stringify(updated, null, 2)}\n`;
  return {
    animationId,
    manifestPath,
    beforeText: manifestBytes.toString("utf8"),
    updatedText,
    changed: manifestBytes.toString("utf8") !== updatedText,
    required: updated.audio.required,
    languages: updated.audio.languages,
    cueCount: updated.audio.cues.length,
  };
}

export async function adoptPilotAudioScope({root = PROJECT_ROOT, ids = [], check = false, dryRun = false} = {}) {
  const selected = ids.length ? ids : [...PILOT_AUDIO_ADOPTION_ALLOWLIST];
  invariant(new Set(selected).size === selected.length, "Pilot IDs must not be duplicated");
  for (const id of selected) invariant(PILOT_AUDIO_ADOPTION_ALLOWLIST.includes(id), `Not an approved pilot: ${id}`);
  const plans = [];
  const blockers = [];
  for (const animationId of selected) {
    try { plans.push(await buildPilotAudioAdoption({root, animationId})); }
    catch (error) { blockers.push(`${animationId}: ${error.message}`); }
  }
  invariant(blockers.length === 0, `Audio technical-scope adoption blocked; no manifests were written:\n${blockers.join("\n")}`);
  if (check) {
    const stale = plans.filter(({changed}) => changed).map(({animationId}) => animationId);
    invariant(stale.length === 0, `Audio technical scope is stale for: ${stale.join(", ")}`);
  } else if (!dryRun) {
    for (const plan of plans) if (plan.changed) await writeFile(plan.manifestPath, plan.updatedText, "utf8");
  }
  return plans;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const plans = await adoptPilotAudioScope(options);
    for (const plan of plans) console.log(`${options.check ? "CHECK" : options.dryRun ? "DRY-RUN" : plan.changed ? "WRITE" : "NOOP"} ${plan.animationId}: required=${plan.required} languages=${plan.languages.join("|") || "none"} cues=${plan.cueCount}`);
    console.log(`${options.check ? "Verified" : options.dryRun ? "Planned" : "Adopted"} ${plans.length} pilot audio technical scope(s); non-technical manifest fields unchanged.`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
