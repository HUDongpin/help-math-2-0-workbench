#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  canonicalProjectionJson,
  projectionSha256,
} from "./evidence-projections.mjs";
import {
  normalizeRequirementSelection,
  selectionSha256,
} from "./lib/trace-frame-selection.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");

export const GS002_ANIMATION_ID = "course-g04-l09-gs-002";
export const GS002_CANONICAL_REQUIREMENT_ID = "req:sprite-787:source-drawing-lead-in:en";
export const GS002_SUPPLEMENTAL_REQUIREMENT_ID =
  "req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641";
export const GS002_SUPPLEMENTAL_TRACE_ID =
  "trace:sprite-787:source-drawing-lead-in:en:seed-0:partial-frames-1-641";
export const GS002_COVERAGE_GROUP_ID =
  "coverage-group:sprite-787:source-drawing-lead-in:en:seed-0";
export const GS002_FRAME_DOMAIN_ID = "sprite-787";
export const GS002_FRAME_COUNT = 653;
export const GS002_READY_LAST_FRAME = 641;
export const GS002_UNRESOLVED_FIRST_FRAME = 642;
export const GS002_AUDIT_RELATIVE_PATH = "audit/partial-current-js-requirement.json";
export const GS002_INVENTORY_ASSET_ID = "supplemental-partial-current-js-requirement";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const BRIEF_START = "<!-- BEGIN GENERATED GS002 PARTIAL CURRENT-JS REQUIREMENT -->";
const BRIEF_END = "<!-- END GENERATED GS002 PARTIAL CURRENT-JS REQUIREMENT -->";
const INITIAL_BLOCKING_REASON =
  "Frames 1 through 641 are specified as a deterministic current-JavaScript-only partial path, but no complete schema-v4 implementation capture has been adopted for this supplemental requirement. Frames 642 through 653 remain unresolved because their visible state depends on unexecuted AVM1 game initialization and question/final state.";
const UNRESOLVED_REASON =
  "Frames 642 through 653 require AVM1 initialization, question/final state, and host behavior that the static source-drawing adapter does not execute.";
const SUPPLEMENTAL_MUTABLE_FIELDS = Object.freeze([
  "blockingReason",
  "blockingEvidence",
  "capturedFrameCount",
  "missingFrames",
  "captureManifest",
  "captureManifestSha256",
]);
const SUPPLEMENTAL_AUTHORITY = Object.freeze({
  currentJavascriptImplementationCaptureOnly: true,
  originalRuntimeBaseline: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
});

function usage() {
  return `Usage: node scripts/build-gs002-partial-current-js-requirement.mjs [options]

Options:
  --project-root <path>  Project root (default: repository root)
  --check                Verify generated files without writing
  --json                 Print the result as JSON
  -h, --help             Show this help

This generator specifies one non-authoritative schema-v2 partial-path
requirement for GS002 physical frames 1..641. It does not capture PNGs and
does not change baseline, RMSE, human, owner, strict, approval, or source data.`;
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function requirePlainObject(value, label) {
  invariant(isPlainObject(value), `${label} must be a plain object`);
  return value;
}

function requireSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
  return value;
}

function range(firstFrame, lastFrame) {
  return Array.from({length: lastFrame - firstFrame + 1}, (_, index) => firstFrame + index);
}

function same(left, right) {
  return canonicalProjectionJson(left) === canonicalProjectionJson(right);
}

function clone(value) {
  return structuredClone(value);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function assertExactKeys(value, expectedKeys, label) {
  const observed = Object.keys(requirePlainObject(value, label)).sort();
  const expected = [...expectedKeys].sort();
  invariant(same(observed, expected), `${label} has an unexpected field set`);
}

function canonicalScenarioEvidence(canonicalRequirement) {
  const matches = (canonicalRequirement.blockingEvidence || [])
    .filter(({file}) => file === "audit/scenario-inventory.json");
  invariant(
    matches.length === 1 && SHA256_PATTERN.test(matches[0].sha256 || ""),
    `${GS002_CANONICAL_REQUIREMENT_ID} must bind exactly one scenario-inventory SHA-256`,
  );
  return clone(matches[0]);
}

function validateCanonicalRequirement(canonicalRequirement) {
  requirePlainObject(canonicalRequirement, "canonicalRequirement");
  invariant(
    canonicalRequirement.requirementId === GS002_CANONICAL_REQUIREMENT_ID,
    `canonical requirement must be ${GS002_CANONICAL_REQUIREMENT_ID}`,
  );
  invariant(canonicalRequirement.frameDomainId === GS002_FRAME_DOMAIN_ID, "canonical frame domain must be sprite-787");
  invariant(canonicalRequirement.scenario === "source-drawing-lead-in", "canonical scenario must be source-drawing-lead-in");
  invariant(canonicalRequirement.language === "en", "canonical language must be en");
  invariant(String(canonicalRequirement.seed) === "0", "canonical seed must be 0");
  invariant(
    same(canonicalRequirement.requiredRange, {firstFrame: 1, lastFrame: GS002_FRAME_COUNT}),
    "canonical requirement must retain the complete physical 1..653 range",
  );
  invariant(canonicalRequirement.status === "blocked", "canonical 1..653 requirement must remain blocked");
  invariant(
    canonicalRequirement.baselineAuthorityRequirement === "original-runtime-natural-trace",
    "canonical requirement must retain original-runtime-natural-trace authority",
  );
  invariant(
    canonicalRequirement.baselineAuthority === "unresolved",
    "canonical requirement baseline authority must remain unresolved",
  );
  requirePlainObject(canonicalRequirement.entryState, "canonicalRequirement.entryState");
  requireSha256(canonicalRequirement.entryStateSha256, "canonicalRequirement.entryStateSha256");
  invariant(
    projectionSha256(canonicalRequirement.entryState) === canonicalRequirement.entryStateSha256,
    "canonical entryStateSha256 differs from its canonical entry state",
  );
  canonicalScenarioEvidence(canonicalRequirement);
  return canonicalRequirement;
}

function immutableSupplementalProjection(requirement) {
  return Object.fromEntries(
    Object.entries(requirement).filter(([key]) => !SUPPLEMENTAL_MUTABLE_FIELDS.includes(key)),
  );
}

/**
 * Build the initial fail-closed supplemental requirement from the immutable
 * canonical GS002 trace identity. The caller may later preserve only the six
 * explicitly mutable current-JavaScript capture fields.
 */
export function buildGs002SupplementalRequirement(canonicalRequirement) {
  validateCanonicalRequirement(canonicalRequirement);
  const unsigned = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: GS002_COVERAGE_GROUP_ID,
    requirementId: GS002_SUPPLEMENTAL_REQUIREMENT_ID,
    scenario: canonicalRequirement.scenario,
    frameDomainId: canonicalRequirement.frameDomainId,
    traceId: GS002_SUPPLEMENTAL_TRACE_ID,
    language: canonicalRequirement.language,
    seed: String(canonicalRequirement.seed),
    requiredRange: {
      firstFrame: 1,
      lastFrame: GS002_READY_LAST_FRAME,
    },
    entryState: clone(canonicalRequirement.entryState),
    entryStateSha256: canonicalRequirement.entryStateSha256,
    baselineAuthorityRequirement: canonicalRequirement.baselineAuthorityRequirement,
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: INITIAL_BLOCKING_REASON,
    blockingEvidence: [canonicalScenarioEvidence(canonicalRequirement)],
    capturedFrameCount: 0,
    missingFrames: range(1, GS002_READY_LAST_FRAME),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    strictAcceptanceEffect: "none",
    authority: clone(SUPPLEMENTAL_AUTHORITY),
    unresolvedFrames: {
      firstFrame: GS002_UNRESOLVED_FIRST_FRAME,
      lastFrame: GS002_FRAME_COUNT,
      status: "unresolved",
      reason: UNRESOLVED_REASON,
    },
  };
  return {
    ...unsigned,
    selectionSha256: selectionSha256(unsigned, GS002_FRAME_COUNT),
  };
}

function validateMutableSupplementalEvidence(candidate, expected) {
  invariant(candidate.status === "blocked", "supplemental requirement status must remain blocked");
  invariant(candidate.baselineAuthority === "unresolved", "supplemental baselineAuthority must remain unresolved");
  for (const field of [
    "baselineCaptureManifest",
    "baselineCaptureManifestSha256",
    "metricsFile",
    "metricsSha256",
  ]) {
    invariant(candidate[field] === "", `supplemental ${field} must remain empty`);
  }

  const captured = candidate.capturedFrameCount;
  invariant(
    captured === 0 || captured === GS002_READY_LAST_FRAME,
    "supplemental capturedFrameCount must be 0 or the complete selected 641 frames",
  );
  const expectedMissing = captured === 0 ? range(1, GS002_READY_LAST_FRAME) : [];
  invariant(same(candidate.missingFrames, expectedMissing), "supplemental missingFrames conflicts with capturedFrameCount");

  const hasCapture = captured === GS002_READY_LAST_FRAME;
  if (hasCapture) {
    invariant(
      typeof candidate.captureManifest === "string"
        && /^output\/playwright\/.+\/capture-manifest\.json$/.test(candidate.captureManifest),
      "adopted supplemental captureManifest must be a project-relative output/playwright capture manifest",
    );
    requireSha256(candidate.captureManifestSha256, "supplemental captureManifestSha256");
    invariant(
      typeof candidate.blockingReason === "string" && candidate.blockingReason.length > 0,
      "adopted supplemental blockingReason must remain non-empty",
    );
  } else {
    invariant(candidate.captureManifest === "", "uncaptured supplemental captureManifest must be empty");
    invariant(candidate.captureManifestSha256 === "", "uncaptured supplemental captureManifestSha256 must be empty");
    invariant(candidate.blockingReason === INITIAL_BLOCKING_REASON, "uncaptured supplemental blockingReason is stale");
  }

  const expectedBaseEvidence = expected.blockingEvidence;
  const observedEvidence = candidate.blockingEvidence;
  invariant(Array.isArray(observedEvidence), "supplemental blockingEvidence must be an array");
  invariant(
    hasCapture
      ? observedEvidence.length > expectedBaseEvidence.length
      : observedEvidence.length === expectedBaseEvidence.length,
    "supplemental blockingEvidence has an unexpected entry count",
  );
  invariant(
    same(observedEvidence.slice(0, expectedBaseEvidence.length), expectedBaseEvidence),
    "supplemental blockingEvidence does not retain the canonical scenario-inventory binding",
  );
  if (hasCapture) {
    const captureEvidence = observedEvidence.slice(expectedBaseEvidence.length);
    const seenCapturePaths = new Set();
    for (const [index, evidence] of captureEvidence.entries()) {
      assertExactKeys(evidence, ["file", "sha256"], `supplemental capture blockingEvidence[${index}]`);
      invariant(
        /^output\/playwright\/.+\/capture-manifest\.json$/.test(evidence.file),
        `supplemental capture blockingEvidence[${index}] must reference an output/playwright capture manifest`,
      );
      requireSha256(
        evidence.sha256,
        `supplemental capture blockingEvidence[${index}].sha256`,
      );
      invariant(
        !seenCapturePaths.has(evidence.file),
        "supplemental capture blockingEvidence paths must be unique",
      );
      seenCapturePaths.add(evidence.file);
    }
    invariant(
      same(observedEvidence.at(-1), {
        file: candidate.captureManifest,
        sha256: candidate.captureManifestSha256,
      }),
      "supplemental capture blocking evidence differs from captureManifest",
    );
  }
}

/**
 * Validate a stored GS002 supplemental row and return a defensive clone. The
 * immutable field set is exact; only current-JavaScript capture bookkeeping may
 * differ from the initial specification.
 */
export function validateGs002SupplementalRequirement(candidate, canonicalRequirement) {
  const expected = buildGs002SupplementalRequirement(canonicalRequirement);
  assertExactKeys(candidate, Object.keys(expected), "supplementalRequirement");
  invariant(
    same(immutableSupplementalProjection(candidate), immutableSupplementalProjection(expected)),
    "supplemental requirement immutable identity is forged, stale, or conflicting",
  );
  normalizeRequirementSelection(candidate, GS002_FRAME_COUNT);
  validateMutableSupplementalEvidence(candidate, expected);
  return clone(candidate);
}

/**
 * Preserve only the one allowlisted GS002 supplemental row. All other
 * requirement IDs outside the structural sync's canonical set are rejected.
 */
export function preserveLegalSupplementalRequirements({
  animationId,
  existingRequirements,
  canonicalRequirements,
}) {
  invariant(Array.isArray(existingRequirements), `${animationId}: existing coverage requirements must be an array`);
  invariant(Array.isArray(canonicalRequirements), `${animationId}: canonical requirements must be an array`);
  const observedIds = new Set();
  for (const requirement of existingRequirements) {
    invariant(
      typeof requirement?.requirementId === "string" && requirement.requirementId,
      `${animationId}: every existing coverage row needs a requirementId`,
    );
    invariant(
      !observedIds.has(requirement.requirementId),
      `${animationId}: duplicate coverage requirementId ${requirement.requirementId}`,
    );
    observedIds.add(requirement.requirementId);
  }
  const canonicalIds = new Set(canonicalRequirements.map(({requirementId}) => requirementId));
  const supplemental = existingRequirements.filter(({requirementId}) => !canonicalIds.has(requirementId));
  if (!supplemental.length) return [];
  invariant(
    animationId === GS002_ANIMATION_ID,
    `${animationId}: unknown supplemental coverage requirement(s): ${supplemental.map(({requirementId}) => requirementId).join(", ")}`,
  );
  invariant(
    supplemental.length === 1 && supplemental[0].requirementId === GS002_SUPPLEMENTAL_REQUIREMENT_ID,
    `${animationId}: unknown or conflicting supplemental coverage requirement(s): ${supplemental.map(({requirementId}) => requirementId).join(", ")}`,
  );
  const canonical = canonicalRequirements.find(
    ({requirementId}) => requirementId === GS002_CANONICAL_REQUIREMENT_ID,
  );
  invariant(Boolean(canonical), `${animationId}: canonical GS002 source-drawing requirement is missing`);
  return [validateGs002SupplementalRequirement(supplemental[0], canonical)];
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
  invariant(!quoted, "asset-inventory.csv contains an unterminated quoted field");
  values.push(value);
  return values;
}

function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  invariant(lines.length > 0, "asset-inventory.csv is empty");
  const headers = parseCsvLine(lines[0]);
  invariant(new Set(headers).size === headers.length, "asset-inventory.csv headers must be unique");
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `asset-inventory.csv row ${index + 2} has the wrong field count`);
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

function updateBrief(briefText, auditSha256, supplemental) {
  const section = [
    BRIEF_START,
    "## Supplemental Current-JavaScript Partial Requirement",
    "",
    `- Requirement: \`${supplemental.requirementId}\`; schema v2, \`coverageRole: partial-path\`, group \`${supplemental.coverageGroupId}\`.`,
    `- Physical selection: sprite-787 frames 1–641 of the immutable 1–653 domain; selection SHA-256 \`${supplemental.selectionSha256}\`.`,
    `- Frames 642–653 remain explicitly unresolved: ${UNRESOLVED_REASON}`,
    `- Specification audit: \`${GS002_AUDIT_RELATIVE_PATH}\`, SHA-256 \`${auditSha256}\`.`,
    "- Authority boundary: current-JavaScript capture only. Original-runtime baseline, RMSE acceptance, human visual review, owner acceptance, and strict acceptance are all false; strict-acceptance effect is `none`.",
    "- The canonical 1–653 source-drawing requirement remains separate, unchanged, blocked, and in the canonical strict denominator. This supplemental row is excluded from keyframe mapping and strict completion.",
    BRIEF_END,
  ].join("\n");
  const start = briefText.indexOf(BRIEF_START);
  const end = briefText.indexOf(BRIEF_END);
  if (start === -1 && end === -1) return `${briefText.trimEnd()}\n\n${section}\n`;
  invariant(start >= 0 && end >= start, "MIGRATION_BRIEF.md has malformed generated partial-requirement markers");
  const suffixStart = end + BRIEF_END.length;
  return `${briefText.slice(0, start)}${section}${briefText.slice(suffixStart)}`;
}

function updateInventory(inventoryText, auditSha256) {
  const {headers, rows} = parseCsv(inventoryText);
  const requiredHeaders = [
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
  ];
  invariant(same(headers, requiredHeaders), "asset-inventory.csv header contract is unexpected");
  const retained = rows.filter(({asset_id}) => asset_id !== GS002_INVENTORY_ASSET_ID);
  retained.push({
    asset_id: GS002_INVENTORY_ASSET_ID,
    swf_character_id: "787",
    library_symbol: "animation",
    type: "generated-current-javascript-partial-requirement-specification",
    source_file: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf",
    source_frame: "1-641 (642-653 unresolved)",
    exported_file: `migrations/${GS002_ANIMATION_ID}/${GS002_AUDIT_RELATIVE_PATH}`,
    sha256: auditSha256,
    format: "JSON",
    dimensions_or_bounds: "physical frames 1-641 of sprite-787 1-653",
    font_glyphs: "",
    transformation: "schema-v2 partial-path requirement; no source transformation and no PNG capture",
    confidence: "engineering-specification-only",
    license_or_provenance: "derived from owner-provided SWF and hash-bound JavaScript renderer evidence",
    notes: "Current-JavaScript-only selection; original-runtime baseline RMSE human owner and strict acceptance are false; canonical 1-653 requirement remains blocked",
  });
  return serializeCsv(headers, retained);
}

function descriptor(file, bytes) {
  return {
    file,
    sha256: digest(bytes),
  };
}

function validateMigration(manifest) {
  invariant(manifest.animationId === GS002_ANIMATION_ID, "migration animationId is not GS002");
  invariant(
    manifest.source?.swf === "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf",
    "migration source SWF path is not the preserved GS002 source",
  );
  requireSha256(manifest.source?.swfSha256, "migration source.swfSha256");
  invariant(manifest.runtime?.frameCount === 10 && manifest.runtime?.fps === 12, "GS002 root runtime must remain 10 frames at 12 FPS");
  const domain = (manifest.implementation?.frameDomains || []).find(({id}) => id === GS002_FRAME_DOMAIN_ID);
  invariant(domain?.frameCount === GS002_FRAME_COUNT, "migration sprite-787 domain must remain 653 frames");
}

function validateSupportingEvidence({
  manifest,
  scenarioInventory,
  canvasSpec,
  canvasManifest,
  rendererAudit,
  timelineText,
  moduleText,
  testText,
  sourceSwfBytes,
}) {
  validateMigration(manifest);
  invariant(scenarioInventory.animationId === GS002_ANIMATION_ID, "scenario inventory animationId is not GS002");
  invariant(
    scenarioInventory.source?.swfSha256 === manifest.source.swfSha256,
    "scenario inventory source hash differs from migration.json",
  );
  const sprite = (scenarioInventory.timelineInventory || []).find(({timelineId}) => timelineId === GS002_FRAME_DOMAIN_ID);
  invariant(sprite?.frameCount === GS002_FRAME_COUNT, "scenario inventory sprite-787 frame count is not 653");
  invariant(canvasSpec.animationId === GS002_ANIMATION_ID, "Canvas adapter specification animationId is not GS002");
  invariant(canvasSpec.source?.swfSha256 === manifest.source.swfSha256, "Canvas adapter source hash differs");
  invariant(
    same(canvasSpec.runtimeContract?.supportedLanguages, ["en"]),
    "Canvas adapter must remain English-only for sprite-787",
  );
  invariant(
    canvasSpec.runtimeContract?.unresolved?.some((note) => /1 through 641/.test(note) && /642 through 653/.test(note)),
    "Canvas adapter specification does not retain the 1..641/642..653 boundary",
  );
  invariant(canvasManifest.animationId === GS002_ANIMATION_ID, "Canvas asset manifest animationId is not GS002");
  invariant(canvasManifest.timeline?.deterministicContentTimeline?.frameCount === GS002_FRAME_COUNT, "Canvas asset manifest frame count is not 653");
  invariant(same(canvasManifest.timeline?.supportedLanguages, ["en"]), "Canvas asset manifest must remain English-only");
  invariant(canvasManifest.strictAcceptanceEffect === "none", "Canvas asset manifest strictAcceptanceEffect must remain none");
  invariant(
    canvasManifest.unresolved?.some((note) => /1 through 641/.test(note) && /642 through 653/.test(note)),
    "Canvas asset manifest does not retain the unresolved frame boundary",
  );
  invariant(rendererAudit.animationId === GS002_ANIMATION_ID, "renderer audit animationId is not GS002");
  invariant(rendererAudit.strictAcceptanceEffect?.startsWith("none;"), "renderer audit must have no strict-acceptance effect");
  const leadInProbes = (rendererAudit.probes || []).filter(
    ({request}) => request?.frameDomain === GS002_FRAME_DOMAIN_ID
      && request?.scenario === "source-drawing-lead-in"
      && request?.language === "en",
  );
  const first = leadInProbes.find(({request}) => request.frame === 1);
  const last = leadInProbes.find(({request}) => request.frame === GS002_FRAME_COUNT);
  invariant(first?.outcome === "renderable-exact", "renderer audit does not prove exact addressability at sprite-787 frame 1");
  invariant(
    last?.outcome === "blocked-not-renderable"
      && last.actual?.blocker === "question-final-avm1-state-unresolved",
    "renderer audit does not fail closed at sprite-787 frame 653",
  );
  invariant(
    /staticDrawingReadyEndFrame:\s*641/.test(timelineText)
      && /gameBeginStopFrame:\s*642/.test(timelineText)
      && /frame\s*>\s*COURSE_G04_L09_GS_002_SOURCE\.staticDrawingReadyEndFrame/.test(timelineText),
    "pure timeline no longer pins the 641/642 fail-closed boundary",
  );
  invariant(
    /playbackEndFrameByDomain/.test(moduleText) && /staticDrawingReadyEndFrame/.test(moduleText),
    "GS002 module no longer derives playback end from the source boundary",
  );
  invariant(
    /staticDrawingReadyEndFrame,\s*641/.test(testText)
      && /playbackEndFrame,\s*641/.test(testText)
      && /\[642,\s*643,\s*644,\s*652,\s*653\]/.test(testText),
    "GS002 tests no longer pin ready frame 641 and unresolved frames 642..653",
  );
  invariant(digest(sourceSwfBytes) === manifest.source.swfSha256, "preserved GS002 source SWF hash differs from migration.json");
}

export function deriveGs002PartialRequirementOutputs({
  manifest,
  coverage,
  scenarioInventory,
  canvasSpec,
  canvasManifest,
  rendererAudit,
  timelineText,
  moduleText,
  testText,
  sourceSwfBytes,
  inputDescriptors,
  scriptSha256,
  briefText,
  inventoryText,
}) {
  validateSupportingEvidence({
    manifest,
    scenarioInventory,
    canvasSpec,
    canvasManifest,
    rendererAudit,
    timelineText,
    moduleText,
    testText,
    sourceSwfBytes,
  });
  requireSha256(scriptSha256, "generator script SHA-256");
  invariant(coverage.schemaVersion === 2 && coverage.animationId === GS002_ANIMATION_ID, "coverage-v2 identity is not GS002");
  invariant(Array.isArray(coverage.requirements), "coverage requirements must be an array");
  const ids = coverage.requirements.map(({requirementId}) => requirementId);
  invariant(new Set(ids).size === ids.length, "coverage contains duplicate requirement IDs");
  const canonical = coverage.requirements.find(({requirementId}) => requirementId === GS002_CANONICAL_REQUIREMENT_ID);
  validateCanonicalRequirement(canonical);
  const supplementalRows = coverage.requirements.filter(
    ({requirementId}) => requirementId === GS002_SUPPLEMENTAL_REQUIREMENT_ID,
  );
  invariant(supplementalRows.length <= 1, "coverage contains duplicate GS002 supplemental requirements");
  const supplemental = supplementalRows.length
    ? validateGs002SupplementalRequirement(supplementalRows[0], canonical)
    : buildGs002SupplementalRequirement(canonical);
  const canonicalBefore = coverage.requirements.filter(
    ({requirementId}) => requirementId !== GS002_SUPPLEMENTAL_REQUIREMENT_ID,
  );
  const outputCoverage = {
    ...coverage,
    requirements: [...canonicalBefore, supplemental],
  };
  invariant(
    same(canonicalBefore, coverage.requirements.filter(
      ({requirementId}) => requirementId !== GS002_SUPPLEMENTAL_REQUIREMENT_ID,
    )),
    "generator must not change canonical coverage requirements",
  );

  const selection = normalizeRequirementSelection(supplemental, GS002_FRAME_COUNT);
  const report = {
    schemaVersion: 1,
    evidenceType: "gs002-supplemental-partial-current-javascript-requirement-specification",
    status: "specified-current-javascript-only",
    animationId: GS002_ANIMATION_ID,
    generatedBy: {
      script: "scripts/build-gs002-partial-current-js-requirement.mjs",
      sha256: scriptSha256,
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
    },
    canonicalRequirement: {
      requirementId: canonical.requirementId,
      traceId: canonical.traceId,
      physicalRange: clone(canonical.requiredRange),
      status: canonical.status,
      immutableSha256: projectionSha256(immutableSupplementalProjection(canonical)),
      preservedUnchanged: true,
    },
    supplementalRequirement: {
      requirementSchemaVersion: supplemental.requirementSchemaVersion,
      coverageRole: supplemental.coverageRole,
      coverageGroupId: supplemental.coverageGroupId,
      requirementId: supplemental.requirementId,
      traceId: supplemental.traceId,
      frameDomainId: supplemental.frameDomainId,
      scenario: supplemental.scenario,
      language: supplemental.language,
      seed: supplemental.seed,
      entryState: clone(supplemental.entryState),
      entryStateSha256: supplemental.entryStateSha256,
      selectionKind: selection.selectionKind,
      selectedRange: clone(supplemental.requiredRange),
      selectedFrameCount: selection.selectedPhysicalFrames.length,
      selectionSha256: supplemental.selectionSha256,
      immutableSha256: projectionSha256(immutableSupplementalProjection(supplemental)),
      strictAcceptanceEffect: supplemental.strictAcceptanceEffect,
    },
    physicalFrameDisposition: {
      domainUniverse: selection.requiredUniverse,
      admittedCurrentJavascriptOnly: {
        firstFrame: 1,
        lastFrame: GS002_READY_LAST_FRAME,
        frameCount: GS002_READY_LAST_FRAME,
      },
      unresolved: clone(supplemental.unresolvedFrames),
    },
    authority: clone(SUPPLEMENTAL_AUTHORITY),
    migrationStatusChanged: false,
    approvalChanged: false,
    canonicalStrictDenominatorChanged: false,
    keyframeMappingEligible: false,
    pngCapturePerformedByGenerator: false,
    inputs: clone(inputDescriptors),
    notes: [
      "This artifact specifies only a deterministic current-JavaScript implementation capture selection.",
      "No PNG is captured by this generator.",
      "The canonical 1..653 requirement remains blocked and independently controls strict acceptance.",
      "Frames 642..653 are not selected and remain unresolved; no union or full-domain claim is made.",
    ],
  };
  const reportText = jsonText(report);
  const reportSha256 = digest(Buffer.from(reportText));
  return {
    coverage: outputCoverage,
    coverageText: jsonText(outputCoverage),
    report,
    reportText,
    reportSha256,
    briefText: updateBrief(briefText, reportSha256, supplemental),
    inventoryText: updateInventory(inventoryText, reportSha256),
    summary: {
      animationId: GS002_ANIMATION_ID,
      canonicalRequirementCount: canonicalBefore.length,
      supplementalRequirementCount: 1,
      supplementalRequirementId: supplemental.requirementId,
      selectedFrameCount: selection.selectedPhysicalFrames.length,
      unresolvedFrameCount: GS002_FRAME_COUNT - GS002_READY_LAST_FRAME,
      strictAcceptanceEffect: "none",
      pngCapturePerformed: false,
    },
  };
}

export function parseArguments(argumentsList) {
  const options = {
    projectRoot: repositoryRoot,
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--project-root") {
      const next = argumentsList[index + 1];
      invariant(Boolean(next), "--project-root requires a value");
      options.projectRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function readDocument(candidate, label, encoding = "utf8") {
  try {
    const bytes = await readFile(candidate);
    return {
      bytes,
      text: encoding ? bytes.toString(encoding) : null,
      value: encoding ? JSON.parse(bytes.toString(encoding)) : null,
      descriptor: descriptor(portable(path.relative(repositoryRoot, candidate)), bytes),
    };
  } catch (error) {
    throw new Error(`${label} is unreadable or invalid (${error.message})`);
  }
}

export async function buildGs002PartialCurrentJsRequirement(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || repositoryRoot);
  const workspace = path.join(projectRoot, "migrations", GS002_ANIMATION_ID);
  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf";
  const paths = {
    manifest: path.join(workspace, "migration.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    scenarioInventory: path.join(workspace, "audit", "scenario-inventory.json"),
    canvasSpec: path.join(workspace, "audit", "canvas-adapter-spec.json"),
    canvasManifest: path.join(projectRoot, "public", "flash-assets", "courses", GS002_ANIMATION_ID, "manifest.json"),
    rendererAudit: path.join(workspace, "audit", "renderer-frame-domain-support.json"),
    timeline: path.join(projectRoot, "packages", "demos", "src", "timelines", `${GS002_ANIMATION_ID}.ts`),
    module: path.join(projectRoot, "packages", "demos", "src", "modules", `${GS002_ANIMATION_ID}.tsx`),
    test: path.join(projectRoot, "packages", "demos", "tests", `${GS002_ANIMATION_ID}.test.ts`),
    sourceSwf: path.join(projectRoot, sourceRelative),
    brief: path.join(workspace, "MIGRATION_BRIEF.md"),
    inventory: path.join(workspace, "asset-inventory.csv"),
    report: path.join(workspace, GS002_AUDIT_RELATIVE_PATH),
    script: scriptPath,
  };
  const [
    manifest,
    coverage,
    scenarioInventory,
    canvasSpec,
    canvasManifest,
    rendererAudit,
    timeline,
    module,
    test,
    sourceSwf,
    brief,
    inventory,
    generator,
  ] = await Promise.all([
    readDocument(paths.manifest, "migration.json"),
    readDocument(paths.coverage, "full-frame-coverage.json"),
    readDocument(paths.scenarioInventory, "scenario-inventory.json"),
    readDocument(paths.canvasSpec, "canvas-adapter-spec.json"),
    readDocument(paths.canvasManifest, "Canvas asset manifest"),
    readDocument(paths.rendererAudit, "renderer frame-domain audit"),
    readFile(paths.timeline).then((bytes) => ({bytes, text: bytes.toString("utf8"), descriptor: descriptor(portable(path.relative(projectRoot, paths.timeline)), bytes)})),
    readFile(paths.module).then((bytes) => ({bytes, text: bytes.toString("utf8"), descriptor: descriptor(portable(path.relative(projectRoot, paths.module)), bytes)})),
    readFile(paths.test).then((bytes) => ({bytes, text: bytes.toString("utf8"), descriptor: descriptor(portable(path.relative(projectRoot, paths.test)), bytes)})),
    readFile(paths.sourceSwf).then((bytes) => ({bytes, descriptor: descriptor(sourceRelative, bytes)})),
    readFile(paths.brief, "utf8").then((text) => ({text})),
    readFile(paths.inventory, "utf8").then((text) => ({text})),
    readFile(paths.script).then((bytes) => ({bytes, sha256: digest(bytes)})),
  ]);
  const inputDescriptors = [
    manifest.descriptor,
    scenarioInventory.descriptor,
    canvasSpec.descriptor,
    canvasManifest.descriptor,
    rendererAudit.descriptor,
    timeline.descriptor,
    module.descriptor,
    test.descriptor,
    sourceSwf.descriptor,
  ];
  const output = deriveGs002PartialRequirementOutputs({
    manifest: manifest.value,
    coverage: coverage.value,
    scenarioInventory: scenarioInventory.value,
    canvasSpec: canvasSpec.value,
    canvasManifest: canvasManifest.value,
    rendererAudit: rendererAudit.value,
    timelineText: timeline.text,
    moduleText: module.text,
    testText: test.text,
    sourceSwfBytes: sourceSwf.bytes,
    inputDescriptors,
    scriptSha256: generator.sha256,
    briefText: brief.text,
    inventoryText: inventory.text,
  });
  const files = [
    {path: paths.coverage, observed: coverage.text, expected: output.coverageText},
    {
      path: paths.report,
      observed: await readFile(paths.report, "utf8").catch((error) => {
        if (error?.code === "ENOENT") return "";
        throw error;
      }),
      expected: output.reportText,
    },
    {path: paths.brief, observed: brief.text, expected: output.briefText},
    {path: paths.inventory, observed: inventory.text, expected: output.inventoryText},
  ];
  if (options.check) {
    const stale = files.filter(({observed, expected}) => observed !== expected)
      .map(({path: candidate}) => portable(path.relative(projectRoot, candidate)));
    invariant(!stale.length, `stale GS002 partial-requirement outputs:\n${stale.join("\n")}`);
  } else {
    for (const file of files) await writeFile(file.path, file.expected, "utf8");
  }
  return {
    mode: options.check ? "check" : "write",
    ...output.summary,
    report: {
      path: portable(path.relative(projectRoot, paths.report)),
      sha256: output.reportSha256,
    },
    filesChanged: options.check ? 0 : files.filter(({observed, expected}) => observed !== expected).length,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await buildGs002PartialCurrentJsRequirement(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(
      `${options.check ? "CHECK" : "BUILD"} ${result.animationId}: `
        + `${result.selectedFrameCount} selected, ${result.unresolvedFrameCount} unresolved, no PNG capture`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
