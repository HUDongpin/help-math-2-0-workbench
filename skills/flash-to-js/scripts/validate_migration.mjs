#!/usr/bin/env node

import { access, lstat, readFile, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { PNG } from "pngjs";
import { COURSE_TRACE_PILOT_IDS } from "../../../scripts/build-course-trace-specs.mjs";
import { inspectPilotTraceEvidence } from "../../../scripts/validate-course-trace-evidence.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "../../../scripts/evidence-projections.mjs";
import {validateStrictAudioEvidence} from "../../../scripts/audio-listening-acceptance.mjs";
import {STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} from "../../../scripts/build-static-frame-domain-disposition-evidence.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "../../../scripts/implementation-artifact-closure.mjs";
import {
  deriveHumanReviewExpectations,
  deriveOwnerReviewEvidence,
  validateHumanVisualReviewRecord,
  validateOwnerReviewRecord,
} from "../../../scripts/human-owner-review-records.mjs";
import {
  classifyStrictFullDomainRequirement,
  validateSupplementalPartialRequirementBoundary,
} from "../../../scripts/lib/strict-full-domain-requirement.mjs";
import {validateRequirementCoverageGroups} from "../../../scripts/lib/trace-frame-selection.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "../../..");
const registrySourceRoot = path.join(projectRoot, "packages", "demos", "src");
const registryGeneratorPath = path.join(projectRoot, "packages", "demos", "scripts", "generate-registry.mjs");
export const MIGRATION_VALIDATOR_VERSION = "3.1.0";
export const FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH = "audit/frame-domain-disposition.json";
export const RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH = "audit/renderer-frame-domain-support.json";
export const ADOBE_ANIMATE_AUTHORING_AUDIT_RELATIVE_PATH = "audit/adobe-animate-2021-authoring-audit.json";
const ADOBE_ANIMATE_AUDIT_SCRIPT_RELATIVE_PATH = "scripts/animate-audit-current-document.jsfl";
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
const FRAME_DOMAIN_KINDS = new Set(["root", "nested"]);
const BASELINE_AUTHORITY_REQUIREMENTS = new Set([
  "original-runtime-natural-trace",
  "original-runtime-frame-accurate",
]);
const BASELINE_AUTHORITIES = new Set([
  "original-runtime-natural-trace",
  "original-runtime-direct-seek",
  "original-runtime-frame-step",
  "original-runtime-root-only",
  "implementation-candidate",
  "derived-candidate",
]);
const FRAME_DOMAIN_DISPOSITIONS = Object.freeze([
  "declared-frame-domain",
  "composite-child-with-parent",
  "independent-required",
  "nonvisual",
  "unresolved",
]);
const FRAME_DOMAIN_DISPOSITION_SET = new Set(FRAME_DOMAIN_DISPOSITIONS);
const FRAME_DOMAIN_ROOT_PLACEMENT_STATUSES = new Set([
  "root-timeline",
  "proven-named-placement-chain",
  "structurally-reachable-but-named-root-path-unresolved",
]);
const FRAME_DOMAIN_RISK_LEVELS = new Set(["none", "review", "high"]);
const ROOT_PARENT_MULTI_FRAME_STATIC_CLAIM_CONTRACTS = Object.freeze({
  "formula-elementary-conversion-01-04": Object.freeze({
    timelineId: "sprite-156",
    parentTimelineId: "root",
    parentSourceObjectId: null,
    parentFrameDomainId: "root",
    parentFrameCount: 67,
    expectedGlobalDoInitActionSpriteObjectIds: Object.freeze([
      "21", "22", "23", "27", "28", "29", "30", "31", "32", "33", "34",
      "35", "36", "37", "92", "93", "95", "96", "97", "98", "99",
    ]),
  }),
});
const PINNED_PARENT_TERMINAL_ZERO_WRAP_CONTRACTS = Object.freeze({
  "course-g04-l03-in-009": Object.freeze({
    "sprite-123": Object.freeze({
      incomingPlacementCount: 2,
      explicitRemovalCount: 1,
      parentTerminalTerminationCount: 1,
      replacementTerminationCount: 0,
      zeroWrapLifetimeCount: 1,
      parentTerminalLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 2, startFrame: 635, endFrame: 637, depth: "3"}),
      ]),
      zeroWrapLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 2, startFrame: 635, endFrame: 637, depth: "3"}),
      ]),
    }),
    "sprite-146": Object.freeze({
      incomingPlacementCount: 2,
      explicitRemovalCount: 1,
      parentTerminalTerminationCount: 1,
      replacementTerminationCount: 0,
      zeroWrapLifetimeCount: 1,
      parentTerminalLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 2, startFrame: 635, endFrame: 637, depth: "45"}),
      ]),
      zeroWrapLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 2, startFrame: 635, endFrame: 637, depth: "45"}),
      ]),
    }),
    "sprite-150": Object.freeze({
      incomingPlacementCount: 3,
      explicitRemovalCount: 2,
      parentTerminalTerminationCount: 1,
      replacementTerminationCount: 0,
      zeroWrapLifetimeCount: 3,
      parentTerminalLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 3, startFrame: 635, endFrame: 637, depth: "76"}),
      ]),
      zeroWrapLifetimes: Object.freeze([
        Object.freeze({placementOrdinal: 1, startFrame: 277, endFrame: 504, depth: "76"}),
        Object.freeze({placementOrdinal: 2, startFrame: 505, endFrame: 634, depth: "149"}),
        Object.freeze({placementOrdinal: 3, startFrame: 635, endFrame: 637, depth: "76"}),
      ]),
    }),
  }),
});

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

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function entryStateSha256(entryState) {
  return createHash("sha256").update(canonicalJson(entryState)).digest("hex");
}

function hasExplicitFrameDomains(manifest) {
  return manifest.implementation?.defaultFrameDomainId !== undefined || manifest.implementation?.frameDomains !== undefined;
}

function frameDomainMap(manifest) {
  return new Map((manifest.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
}

function baselineAuthoritySatisfies(requirement, authority) {
  if (requirement === "original-runtime-natural-trace") return authority === "original-runtime-natural-trace";
  if (requirement === "original-runtime-frame-accurate") {
    return authority === "original-runtime-natural-trace" || authority === "original-runtime-direct-seek" || authority === "original-runtime-frame-step";
  }
  return false;
}

function validateFrameDomains(manifest, errors) {
  if (!hasExplicitFrameDomains(manifest)) return null;
  const defaultId = manifest.implementation?.defaultFrameDomainId;
  const domains = manifest.implementation?.frameDomains;
  if (!defaultId || typeof defaultId !== "string") errors.push("implementation.defaultFrameDomainId must be a non-empty string when frameDomains are declared");
  if (!Array.isArray(domains) || !domains.length) {
    errors.push("implementation.frameDomains must be a non-empty array when a defaultFrameDomainId is declared");
    return new Map();
  }

  const scenarioIds = new Set((manifest.scenarios || []).map(({ id }) => id));
  const domainIds = new Set();
  for (const [index, domain] of domains.entries()) {
    const label = `implementation.frameDomains[${index}]`;
    if (!domain.id || typeof domain.id !== "string" || domainIds.has(domain.id)) {
      errors.push(`${label}.id must be non-empty and unique`);
    } else domainIds.add(domain.id);
    if (!FRAME_DOMAIN_KINDS.has(domain.kind)) errors.push(`${label}.kind must be root or nested`);
    if (!domain.sourceTimelineId || typeof domain.sourceTimelineId !== "string") errors.push(`${label}.sourceTimelineId is required`);
    if (!Number.isInteger(domain.frameCount) || domain.frameCount < 1) errors.push(`${label}.frameCount must be a positive integer`);
    if (!Array.isArray(domain.scenarioIds) || !domain.scenarioIds.length || new Set(domain.scenarioIds).size !== domain.scenarioIds.length) {
      errors.push(`${label}.scenarioIds must contain unique reachable scenario IDs`);
    } else {
      for (const scenarioId of domain.scenarioIds) if (!scenarioIds.has(scenarioId)) errors.push(`${label}.scenarioIds contains unknown scenario ${scenarioId}`);
    }
    if (domain.kind === "root" && domain.parentFrameDomainId !== null) errors.push(`${label}.parentFrameDomainId must be null for the root timeline`);
    if (domain.kind === "nested" && (!domain.parentFrameDomainId || domain.parentFrameDomainId === domain.id)) {
      errors.push(`${label}.parentFrameDomainId must identify another frame domain`);
    }
  }

  const domainsById = frameDomainMap(manifest);
  if (!domainsById.has(defaultId)) errors.push("implementation.defaultFrameDomainId must identify a declared frame domain");
  const roots = domains.filter(({ kind }) => kind === "root");
  if (roots.length !== 1) errors.push("implementation.frameDomains must declare exactly one root timeline domain");
  else if (roots[0].frameCount !== manifest.runtime?.frameCount) {
    errors.push("The root frame domain frameCount must equal runtime.frameCount; runtime.frameCount remains the shipped SWF root timeline");
  }
  for (const domain of domains.filter(({ kind }) => kind === "nested")) {
    if (!domainsById.has(domain.parentFrameDomainId)) errors.push(`frame domain ${domain.id} references unknown parent ${domain.parentFrameDomainId}`);
    const visited = new Set([domain.id]);
    let current = domain;
    while (current?.kind === "nested" && current.parentFrameDomainId && domainsById.has(current.parentFrameDomainId)) {
      if (visited.has(current.parentFrameDomainId)) {
        errors.push(`frame domain ${domain.id} has a cyclic parentFrameDomainId chain`);
        break;
      }
      visited.add(current.parentFrameDomainId);
      current = domainsById.get(current.parentFrameDomainId);
    }
  }
  const captureContract = manifest.implementation?.captureContract;
  if (captureContract?.animationIdAttribute !== "data-animation-id") {
    errors.push("implementation.captureContract.animationIdAttribute must be data-animation-id when frameDomains are declared");
  }
  if (captureContract?.frameDomainAttribute !== "data-flash-frame-domain") {
    errors.push("implementation.captureContract.frameDomainAttribute must be data-flash-frame-domain when frameDomains are declared");
  }
  if (captureContract?.requirementIdAttribute !== "data-flash-requirement-id") {
    errors.push("implementation.captureContract.requirementIdAttribute must be data-flash-requirement-id when frameDomains are declared");
  }
  if (captureContract?.traceAttribute !== "data-flash-trace-id") {
    errors.push("implementation.captureContract.traceAttribute must be data-flash-trace-id when frameDomains are declared");
  }
  if (captureContract?.entryStateSha256Attribute !== "data-flash-entry-state-sha256") {
    errors.push("implementation.captureContract.entryStateSha256Attribute must be data-flash-entry-state-sha256 when frameDomains are declared");
  }
  if (!captureContract?.frameDomainParameter || !captureContract?.requirementIdParameter || !captureContract?.traceParameter || !captureContract?.entryStateSha256Parameter) {
    errors.push("implementation.captureContract must declare frameDomainParameter, requirementIdParameter, traceParameter, and entryStateSha256Parameter when frameDomains are declared");
  }
  return domainsById;
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

function dispositionEvidence(inventory, artifactId, errors) {
  const matches = (inventory?.evidenceIndex || []).filter((item) => item?.artifactId === artifactId);
  if (matches.length !== 1) {
    errors.push(`frame-domain disposition: scenario inventory must bind exactly one ${artifactId} artifact`);
    return null;
  }
  if (!matches[0].path || !isSha256(matches[0].sha256)) {
    errors.push(`frame-domain disposition: scenario inventory ${artifactId} artifact must contain path and SHA-256`);
    return null;
  }
  return matches[0];
}

function normalizeDispositionDomain(domain) {
  return {
    frameDomainId: domain.id,
    kind: domain.kind || "",
    sourceTimelineId: domain.sourceTimelineId,
    sourceInstanceId: domain.sourceInstanceId || "",
    parentFrameDomainId: domain.parentFrameDomainId ?? null,
    parentEntryFrame: domain.parentEntryFrame ?? null,
    localEntryFrame: domain.localEntryFrame ?? null,
    frameCount: domain.frameCount,
    role: domain.role || "",
  };
}

function numericTimelineCompare(left, right) {
  if (left.timelineId === "root") return -1;
  if (right.timelineId === "root") return 1;
  const leftObject = Number.parseInt(left.objectId ?? left.sourceObjectId ?? "", 10);
  const rightObject = Number.parseInt(right.objectId ?? right.sourceObjectId ?? "", 10);
  if (Number.isFinite(leftObject) && Number.isFinite(rightObject) && leftObject !== rightObject) return leftObject - rightObject;
  return String(left.timelineId).localeCompare(String(right.timelineId), "en");
}

function conciseIds(values, limit = 10) {
  const ids = values.map((value) => typeof value === "string" ? value : value.timelineId);
  return `${ids.slice(0, limit).join(", ")}${ids.length > limit ? `, … +${ids.length - limit}` : ""}`;
}

export async function validateFrameDomainDisposition({
  root,
  manifest,
  errors,
  evidenceProjectRoot = projectRoot,
}) {
  const startingErrorCount = errors.length;
  const reportPath = path.join(root, FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH);
  const evidencePaths = [reportPath];
  if (!hasExplicitFrameDomains(manifest)) {
    return { applicable: false, ok: true, path: reportPath, evidencePaths, report: null, unresolvedTimelineIds: [] };
  }
  if (!(await exists(reportPath))) {
    errors.push(`Missing required explicit-frame-domain audit: ${FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH}`);
    return { applicable: true, ok: false, path: reportPath, evidencePaths, report: null, unresolvedTimelineIds: [] };
  }

  let report;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch (error) {
    errors.push(`Invalid ${FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH}: ${error.message}`);
    return { applicable: true, ok: false, path: reportPath, evidencePaths, report: null, unresolvedTimelineIds: [] };
  }
  if (report.schemaVersion !== 1) errors.push("frame-domain disposition schemaVersion must be 1");
  if (report.animationId !== manifest.animationId) errors.push("frame-domain disposition animationId must match migration.json");
  if (report.migrationStatusChanged !== false) errors.push("frame-domain disposition migrationStatusChanged must be false");
  if (!Array.isArray(report.authorityStatement) || !report.authorityStatement.length) errors.push("frame-domain disposition authorityStatement must be non-empty");
  if (!isPlainObject(report.dispositionDefinitions) || FRAME_DOMAIN_DISPOSITIONS.some((key) => !report.dispositionDefinitions[key])) {
    errors.push("frame-domain disposition must define every disposition value");
  }
  if (!String(report.strictAcceptanceEffect || "").startsWith("none;")) errors.push("frame-domain disposition strictAcceptanceEffect must remain none");

  const generatedFrom = report.generatedFrom || {};
  const scenarioDescriptor = generatedFrom.scenarioInventory || {};
  const manifestDescriptor = generatedFrom.migrationManifest || {};
  const sourceDescriptor = generatedFrom.sourceSwf || {};
  const swfmillDescriptor = generatedFrom.swfmillStructure || {};
  const staticDescriptor = generatedFrom.staticDispositionEvidence || null;
  if (scenarioDescriptor.path !== "audit/scenario-inventory.json") {
    errors.push("frame-domain disposition must bind fixed audit/scenario-inventory.json");
  }
  if (manifestDescriptor.path !== "migration.json") errors.push("frame-domain disposition must bind migration.json");
  if (manifestDescriptor.bindingStatus !== "verified") errors.push("frame-domain disposition migration manifest bindingStatus must be verified");
  if (manifestDescriptor.technicalProjection !== TECHNICAL_MANIFEST_PROJECTION.id) {
    errors.push("frame-domain disposition technical manifest projection identifier is stale");
  }
  if (manifestDescriptor.hashMode !== "canonical-json-v1") errors.push("frame-domain disposition technical manifest hashMode is stale");
  if (canonicalJson(manifestDescriptor.excludedPaths) !== canonicalJson(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)) {
    errors.push("frame-domain disposition technical manifest excludedPaths are stale");
  }

  const scenarioPath = path.join(root, "audit", "scenario-inventory.json");
  const manifestPath = path.join(root, "migration.json");
  evidencePaths.push(scenarioPath, manifestPath);
  let inventory = null;
  let inventorySha256 = null;
  if (!(await exists(scenarioPath))) {
    errors.push("frame-domain disposition scenario inventory does not exist at audit/scenario-inventory.json");
  } else {
    try {
      const bytes = await readFile(scenarioPath);
      inventorySha256 = createHash("sha256").update(bytes).digest("hex");
      inventory = JSON.parse(bytes.toString("utf8"));
      if (scenarioDescriptor.sha256 !== inventorySha256) errors.push("frame-domain disposition scenario inventory SHA-256 is stale");
      if (scenarioDescriptor.schemaVersion !== inventory.schemaVersion) errors.push("frame-domain disposition scenario inventory schemaVersion differs from its source");
      if (scenarioDescriptor.inventoryStatus !== inventory.inventoryStatus) errors.push("frame-domain disposition scenario inventory status differs from its source");
      if (inventory.animationId !== manifest.animationId) errors.push("frame-domain disposition scenario inventory animationId differs from migration.json");
    } catch (error) {
      errors.push(`frame-domain disposition cannot parse audit/scenario-inventory.json (${error.message})`);
    }
  }

  const actualManifestSha256 = technicalManifestSha256(manifest);
  const manifestEvidence = inventory ? dispositionEvidence(inventory, "migration-technical-contract", errors) : null;
  const sourceEvidence = inventory ? dispositionEvidence(inventory, "source-swf", errors) : null;
  const swfmillEvidence = inventory ? dispositionEvidence(inventory, "swfmill-xml", errors) : null;
  if (manifestDescriptor.technicalProjectionSha256 !== actualManifestSha256) errors.push("frame-domain disposition current migration technical projection SHA-256 is stale");
  if (
    manifestEvidence?.sha256 !== actualManifestSha256 ||
    manifestEvidence?.projection !== TECHNICAL_MANIFEST_PROJECTION.id ||
    manifestEvidence?.hashMode !== "canonical-json-v1" ||
    canonicalJson(manifestEvidence?.excludedPaths) !== canonicalJson(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
  ) {
    errors.push("frame-domain disposition scenario inventory is not bound to the current migration technical projection");
  }

  async function validateSourceArtifact({ descriptor, inventoryArtifact, manifestPathValue, manifestHashValue, label }) {
    if (!descriptor.path || !isSha256(descriptor.sha256)) {
      errors.push(`frame-domain disposition ${label} descriptor must contain path and SHA-256`);
      return null;
    }
    if (!inventoryArtifact || descriptor.path !== inventoryArtifact.path || descriptor.sha256 !== inventoryArtifact.sha256) {
      errors.push(`frame-domain disposition ${label} descriptor differs from scenario-inventory evidence`);
    }
    if (manifestPathValue !== undefined && descriptor.path !== manifestPathValue) errors.push(`frame-domain disposition ${label} path differs from migration.json`);
    if (manifestHashValue !== undefined && descriptor.sha256 !== manifestHashValue) errors.push(`frame-domain disposition ${label} SHA-256 differs from migration.json`);
    const resolved = await resolveExistingPath(descriptor.path, [root, evidenceProjectRoot, projectRoot, process.cwd()]);
    if (!resolved) {
      errors.push(`frame-domain disposition ${label} artifact does not exist (${descriptor.path})`);
      return null;
    }
    evidencePaths.push(resolved);
    if ((await sha256(resolved)) !== String(descriptor.sha256).toLowerCase()) errors.push(`frame-domain disposition ${label} artifact SHA-256 does not match the file`);
    return resolved;
  }
  await validateSourceArtifact({
    descriptor: sourceDescriptor,
    inventoryArtifact: sourceEvidence,
    manifestPathValue: manifest.source?.swf,
    manifestHashValue: manifest.source?.swfSha256,
    label: "source SWF",
  });
  await validateSourceArtifact({
    descriptor: swfmillDescriptor,
    inventoryArtifact: swfmillEvidence,
    label: "swfmill structure",
  });

  const reportedCompositeTimelines = Array.isArray(report.timelines)
    ? report.timelines.filter((timeline) => timeline?.disposition === "composite-child-with-parent")
    : [];
  let staticEvidenceDocument = null;
  let staticClaimsByTimeline = new Map();
  if (reportedCompositeTimelines.length || staticDescriptor) {
    if (!reportedCompositeTimelines.length) errors.push("frame-domain disposition binds static composite evidence but reports no composite timeline");
    if (
      staticDescriptor?.path !== STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH
      || !isSha256(staticDescriptor?.sha256)
      || staticDescriptor?.schemaVersion !== 2
      || staticDescriptor?.status !== "verified-static-composite-claims"
      || staticDescriptor?.bindingStatus !== "verified-and-rebuilt"
    ) {
      errors.push("frame-domain disposition static composite descriptor is missing, stale, or unsupported");
    }
    const staticPath = path.join(root, STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH);
    evidencePaths.push(staticPath);
    if (!(await exists(staticPath))) {
      errors.push(`frame-domain disposition static composite evidence is missing (${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH})`);
    } else {
      try {
        const staticBytes = await readFile(staticPath);
        if (isSha256(staticDescriptor?.sha256) && createHash("sha256").update(staticBytes).digest("hex") !== staticDescriptor.sha256) {
          errors.push("frame-domain disposition static composite evidence SHA-256 is stale");
        }
        staticEvidenceDocument = JSON.parse(staticBytes.toString("utf8"));
      } catch (error) {
        errors.push(`frame-domain disposition cannot parse static composite evidence (${error.message})`);
      }
    }
    if (staticEvidenceDocument) {
      if (
        staticEvidenceDocument.schemaVersion !== 2
        || staticEvidenceDocument.evidenceType !== "static-frame-domain-disposition-evidence"
        || staticEvidenceDocument.animationId !== manifest.animationId
        || staticEvidenceDocument.status !== "verified-static-composite-claims"
        || staticEvidenceDocument.migrationStatusChanged !== false
      ) {
        errors.push("frame-domain disposition static composite evidence identity/schema/status is invalid");
      }
      if (!String(staticEvidenceDocument.strictAcceptanceEffect || "").startsWith("none;")) {
        errors.push("frame-domain disposition static composite evidence must not advance strict acceptance");
      }
      for (const key of ["buttonAccepted", "interactionAccepted", "audioAccepted", "behaviorAccepted", "fullFrameAccepted", "rmseAccepted", "humanReviewAccepted", "ownerReviewAccepted"]) {
        if (staticEvidenceDocument.acceptanceEffects?.[key] !== false) {
          errors.push(`frame-domain disposition static composite evidence cannot satisfy ${key}`);
        }
      }
      const staticGenerated = staticEvidenceDocument.generatedFrom || {};
      if (
        staticGenerated.sourceSwf?.path !== sourceDescriptor.path
        || staticGenerated.sourceSwf?.sha256 !== sourceDescriptor.sha256
        || staticGenerated.scenarioInventory?.path !== "audit/scenario-inventory.json"
        || staticGenerated.scenarioInventory?.sha256 !== inventorySha256
        || staticGenerated.scenarioInventory?.schemaVersion !== inventory?.schemaVersion
        || staticGenerated.swfmillStructure?.path !== swfmillDescriptor.path
        || staticGenerated.swfmillStructure?.sha256 !== swfmillDescriptor.sha256
        || staticGenerated.migrationManifest?.path !== "migration.json"
        || staticGenerated.migrationManifest?.projection !== TECHNICAL_MANIFEST_PROJECTION.id
        || staticGenerated.migrationManifest?.hashMode !== "canonical-json-v1"
        || staticGenerated.migrationManifest?.sha256 !== actualManifestSha256
        || canonicalJson(staticGenerated.migrationManifest?.excludedPaths) !== canonicalJson(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
      ) {
        errors.push("frame-domain disposition static composite evidence has stale source/scenario/machine/manifest bindings");
      }
      const scriptsEvidence = dispositionEvidence(inventory, "ffdec-scripts", errors);
      const scriptsDescriptor = staticGenerated.ffdecScripts || {};
      const scriptsPath = await validateSourceArtifact({
        descriptor: scriptsDescriptor,
        inventoryArtifact: scriptsEvidence,
        label: "FFDec scripts",
      });
      if (
        scriptsDescriptor.uncompressedSha256 !== scriptsEvidence?.uncompressedSha256
        || staticGenerated.swfmillStructure?.uncompressedSha256 !== swfmillEvidence?.uncompressedSha256
      ) {
        errors.push("frame-domain disposition static composite uncompressed machine-evidence hashes are stale");
      }
      if (scriptsPath && isSha256(scriptsDescriptor.uncompressedSha256)) {
        try {
          const uncompressed = gunzipSync(await readFile(scriptsPath));
          if (createHash("sha256").update(uncompressed).digest("hex") !== scriptsDescriptor.uncompressedSha256) {
            errors.push("frame-domain disposition FFDec scripts uncompressed SHA-256 does not match the file");
          }
        } catch (error) {
          errors.push(`frame-domain disposition cannot decompress FFDec scripts (${error.message})`);
        }
      }
      const claims = Array.isArray(staticEvidenceDocument.claims) ? staticEvidenceDocument.claims : [];
      if (!claims.length || staticDescriptor?.claimCount !== claims.length) {
        errors.push("frame-domain disposition static composite claim count is missing or stale");
      }
      const claimSetContracts = Array.isArray(staticEvidenceDocument.claimSetContracts)
        ? staticEvidenceDocument.claimSetContracts
        : [];
      if (!claimSetContracts.length) errors.push("frame-domain disposition static composite exact claim-set contracts are missing");
      const sortTimelineIds = (values) => [...values].sort((left, right) => (
        Number.parseInt(String(left).replace(/^sprite-/, ""), 10) - Number.parseInt(String(right).replace(/^sprite-/, ""), 10)
        || String(left).localeCompare(String(right), "en")
      ));
      const contractedRoles = new Set();
      for (const [contractIndex, contract] of claimSetContracts.entries()) {
        const expectedIds = sortTimelineIds(Array.isArray(contract?.expectedTimelineIds) ? contract.expectedTimelineIds : []);
        const verifiedIds = sortTimelineIds(Array.isArray(contract?.verifiedTimelineIds) ? contract.verifiedTimelineIds : []);
        const actualIds = sortTimelineIds(claims.filter(({role}) => role === contract?.proofType).map(({timelineId}) => timelineId));
        if (
          !["audio-only-offstage-visual-marker", "single-frame-scriptless-structural-child", "multi-frame-scriptless-parent-clock-composite-child"].includes(contract?.proofType)
          || contractedRoles.has(contract?.proofType)
          || contract?.exactMatch !== true
          || contract?.expectedTimelineCount !== expectedIds.length
          || contract?.verifiedTimelineCount !== verifiedIds.length
          || contract?.verifiedTimelineCount !== actualIds.length
          || new Set(expectedIds).size !== expectedIds.length
          || new Set(verifiedIds).size !== verifiedIds.length
          || canonicalJson(expectedIds) !== canonicalJson(verifiedIds)
          || canonicalJson(verifiedIds) !== canonicalJson(actualIds)
        ) {
          errors.push(`frame-domain disposition static composite claim-set contract ${contractIndex + 1} is missing, duplicated, or not an exact ID/count match`);
        }
        contractedRoles.add(contract?.proofType);
      }
      for (const role of new Set(claims.map(({role}) => role))) {
        if (!contractedRoles.has(role)) errors.push(`frame-domain disposition static composite role ${role || "missing"} has no exact claim-set contract`);
      }
      for (const [claimIndex, claim] of claims.entries()) {
        if (!claim?.timelineId || staticClaimsByTimeline.has(claim.timelineId)) {
          errors.push(`frame-domain disposition static composite claim ${claimIndex + 1} has a missing or duplicate timelineId`);
          continue;
        }
        if (claim.disposition !== "composite-child-with-parent" || !["audio-only-offstage-visual-marker", "single-frame-scriptless-structural-child", "multi-frame-scriptless-parent-clock-composite-child"].includes(claim.role)) {
          errors.push(`frame-domain disposition static composite claim ${claim.timelineId} uses an unsupported disposition or role`);
        }
        if (claim.role === "audio-only-offstage-visual-marker") {
          if (
            claim.tagCensus?.exactMatch !== true
            || claim.tagCensus?.declaredFrameCount !== claim.frameCount
            || claim.tagCensus?.observedShowFrameCount !== claim.frameCount
            || claim.audioStructure?.required !== true
            || claim.audioStructure?.acceptanceSatisfied !== false
            || claim.audioStructure?.headCount !== 1
            || claim.audioStructure?.blockCount !== claim.frameCount
            || claim.audioStructure?.compressionCode !== 2
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks an exact MP3 SoundStream tag census`);
          }
          if (
            claim.visualBounds?.nativeStageIntersection !== false
            || claim.lifetime?.parentPlacementUpdateCount !== 0
            || claim.lifetime?.childPlacementUpdateCount !== 0
            || claim.lifetime?.clipActionCount !== 0
            || claim.scriptReferenceAudit?.unsupportedReferenceCount !== 0
            || claim.scriptReferenceAudit?.selectorPrefix?.occurrenceCount !== 1
            || claim.scriptReferenceAudit?.selectorVariable?.occurrenceCount !== 2
            || claim.scriptReferenceAudit?.directInstanceName?.occurrenceCount !== 0
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks off-stage lifecycle/script proof`);
          }
        } else if (claim.role === "single-frame-scriptless-structural-child") {
          const placement = claim.placementAudit || {};
          const incoming = Array.isArray(placement.incomingPlacements) ? placement.incomingPlacements : [];
          const outgoing = Array.isArray(placement.outgoingPlacements) ? placement.outgoingPlacements : [];
          if (
            claim.frameCount !== 1
            || claim.claimScope !== "independent-local-playhead-only"
            || claim.structuralReachability !== "reachable-from-root-placement-graph"
            || claim.tagCensus?.declaredFrameCount !== 1
            || claim.tagCensus?.observedShowFrameCount !== 1
            || claim.tagCensus?.doActionTagCount !== 0
            || claim.tagCensus?.doInitActionTagCount !== 0
            || claim.scriptAudit?.ffdecFrameScriptCount !== 0
            || claim.scriptAudit?.attributedDoInitActionCount !== 0
            || claim.scriptAudit?.scriptless !== true
            || (claim.scriptAudit?.ffdecFrameScripts || []).length !== 0
            || (claim.scriptAudit?.attributedDoInitActions || []).length !== 0
            || claim.declaredFrameDomainAudit?.sourceTimelineDomainCount !== 0
            || claim.declaredFrameDomainAudit?.notDeclared !== true
            || (claim.declaredFrameDomainAudit?.frameDomainIds || []).length !== 0
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks exact single-frame scriptless/non-declared proof`);
          }
          if (
            incoming.length < 1
            || placement.incomingPlacementCount !== incoming.length
            || placement.outgoingPlacementCount !== outgoing.length
            || placement.exportedPlacementCount !== incoming.length + outgoing.length
            || placement.unresolvedOutgoingObjectCount !== 0
            || placement.clipActionCount !== 0
            || placement.allExportedPlacementsHaveNoClipActions !== true
            || !incoming.every((item) => item.sourceObjectId === claim.sourceObjectId && item.placedTimelineId === claim.timelineId && item.hasClipActions === false)
            || !outgoing.every((item) => item.parentTimelineId === claim.timelineId && item.hasClipActions === false)
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks exhaustive no-clipActions placement proof`);
          }
        } else if (claim.role === "multi-frame-scriptless-parent-clock-composite-child") {
          const source = claim.sourceBinding || {};
          const parent = claim.parentBinding || {};
          const parentIsRoot = parent.parentTimelineId === "root";
          const rootParentContract = ROOT_PARENT_MULTI_FRAME_STATIC_CLAIM_CONTRACTS[manifest.animationId];
          const parentInventory = inventory?.timelineInventory?.find(({timelineId}) => timelineId === parent.parentTimelineId);
          const parentDomains = (manifest.implementation?.frameDomains || []).filter(({sourceTimelineId}) => sourceTimelineId === parent.parentTimelineId);
          const rootInventory = inventory?.timelineInventory?.find(({timelineId}) => timelineId === "root");
          const rootParentPlacements = (rootInventory?.namedPlacements || []).filter((placement) => (
            String(placement.objectId) === parent.parentSourceObjectId
            && placement.frame === parent.rootPlacement?.frame
            && String(placement.depth) === parent.rootPlacement?.depth
            && placement.name === parent.rootPlacement?.instanceName
          ));
          const rootParentBindingIsExact = parentIsRoot && Boolean(
            rootParentContract
            && claim.timelineId === rootParentContract.timelineId
            && parent.parentTimelineId === rootParentContract.parentTimelineId
            && parent.parentSourceObjectId === rootParentContract.parentSourceObjectId
            && parent.parentFrameDomainId === rootParentContract.parentFrameDomainId
            && parent.parentFrameCount === rootParentContract.parentFrameCount
            && parent.rootPlacement === null
            && parentInventory?.timelineId === "root"
            && parentInventory?.objectId === null
            && parentInventory?.structuralReachability === "root"
            && parentInventory?.frameCount === rootParentContract.parentFrameCount
            && parentDomains.length === 1
            && parentDomains[0].id === "root"
            && parentDomains[0].kind === "root"
            && parentDomains[0].sourceTimelineId === "root"
            && parentDomains[0].parentFrameDomainId === null
            && parentDomains[0].frameCount === rootParentContract.parentFrameCount
          );
          const nonRootParentBindingIsExact = !parentIsRoot && Boolean(
            String(parentInventory?.objectId) === parent.parentSourceObjectId
            && parentInventory?.frameCount === parent.parentFrameCount
            && parentDomains.length === 1
            && parentDomains[0].id === parent.parentFrameDomainId
            && parentDomains[0].frameCount === parent.parentFrameCount
            && rootParentPlacements.length === 1
            && parent.rootPlacement?.declaredSourceObjectId === parent.parentSourceObjectId
            && parent.rootPlacement?.hasClipActions === false
          );
          if (
            claim.frameCount <= 1
            || claim.claimScope !== "local-playhead-fully-derived-from-declared-parent-clock"
            || claim.structuralReachability !== "reachable-from-root-placement-graph"
            || source.path !== sourceDescriptor.path
            || source.sha256 !== sourceDescriptor.sha256
            || (!rootParentBindingIsExact && !nonRootParentBindingIsExact)
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks exact source/declared-parent/root-placement proof`);
          }
          if (
            claim.tagCensus?.exactMatch !== true
            || canonicalJson(claim.tagCensus?.observed) !== canonicalJson(claim.tagCensus?.expected)
            || claim.tagCensus?.declaredFrameCount !== claim.frameCount
            || claim.tagCensus?.observedShowFrameCount !== claim.frameCount
            || claim.tagCensus?.doActionTagCount !== 0
            || claim.tagCensus?.doInitActionTagCount !== 0
            || claim.tagCensus?.endTagCount !== 1
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks exact multi-frame scriptless tag proof`);
          }
          const scriptAudit = claim.scriptAudit || {};
          const observedGlobalDoInitActionIds = scriptAudit.globalDoInitActionSpriteObjectIds;
          const expectedGlobalDoInitActionIds = scriptAudit.expectedGlobalDoInitActionSpriteObjectIds;
          const rootGlobalDoInitActionBindingIsExact = parentIsRoot && Boolean(
            rootParentContract
            && Array.isArray(observedGlobalDoInitActionIds)
            && Array.isArray(expectedGlobalDoInitActionIds)
            && observedGlobalDoInitActionIds.every((value) => /^\d+$/.test(value))
            && expectedGlobalDoInitActionIds.every((value) => /^\d+$/.test(value))
            && new Set(observedGlobalDoInitActionIds).size === observedGlobalDoInitActionIds.length
            && new Set(expectedGlobalDoInitActionIds).size === expectedGlobalDoInitActionIds.length
            && scriptAudit.globalDoInitActionCount === observedGlobalDoInitActionIds.length
            && canonicalJson(observedGlobalDoInitActionIds) === canonicalJson(rootParentContract.expectedGlobalDoInitActionSpriteObjectIds)
            && canonicalJson(expectedGlobalDoInitActionIds) === canonicalJson(rootParentContract.expectedGlobalDoInitActionSpriteObjectIds)
            && scriptAudit.globalDoInitActionSetExactMatch === true
          );
          if (
            scriptAudit.ffdecFrameScriptCount !== 0
            || (scriptAudit.ffdecFrameScripts || []).length !== 0
            || scriptAudit.attributedDoInitActionCount !== 0
            || (scriptAudit.attributedDoInitActions || []).length !== 0
            || (parentIsRoot ? !rootGlobalDoInitActionBindingIsExact : scriptAudit.globalDoInitActionCount !== 0)
            || scriptAudit.namedIncomingInstanceCount !== 0
            || (scriptAudit.namedIncomingInstances || []).length !== 0
            || scriptAudit.dynamicAddressingReferenceCount !== 0
            || (scriptAudit.dynamicAddressingReferences || []).length !== 0
            || scriptAudit.externalTargetControlCount !== 0
            || (scriptAudit.externalTargetControls || []).length !== 0
            || scriptAudit.nonTargetPlayheadControlReferenceCount !== (scriptAudit.nonTargetPlayheadControlReferences || []).length
            || !(scriptAudit.nonTargetPlayheadControlReferences || []).every(({targetCandidate}) => targetCandidate === false)
            || scriptAudit.scriptlessLocalTimeline !== true
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks no-script/init/clip/dynamic/external-target-control proof`);
          }
          const lifecycle = claim.placementLifecycleAudit || {};
          const lifetimes = Array.isArray(lifecycle.lifetimes) ? lifecycle.lifetimes : [];
          const explicitRemovalCount = lifetimes.filter(({termination}) => termination?.kind === "removal").length;
          const parentTerminalTerminationCount = lifetimes.filter(({termination}) => termination?.kind === "parent-timeline-terminal").length;
          const replacementTerminationCount = lifetimes.filter(({termination}) => termination?.kind === "replacement").length;
          const zeroWrapLifetimeCount = lifetimes.filter(({localPlayhead}) => localPlayhead?.wrapCount === 0).length;
          const pinnedLifecycleContract = PINNED_PARENT_TERMINAL_ZERO_WRAP_CONTRACTS[manifest.animationId]?.[claim.timelineId] || null;
          const observedParentTerminalLifetimes = lifetimes
            .filter(({termination}) => termination?.kind === "parent-timeline-terminal")
            .map((lifetime) => ({
              placementOrdinal: lifetime.placementOrdinal,
              startFrame: lifetime.startFrame,
              endFrame: lifetime.endFrame,
              depth: lifetime.depth,
            }));
          const observedZeroWrapLifetimes = lifetimes
            .filter(({localPlayhead}) => localPlayhead?.wrapCount === 0)
            .map((lifetime) => ({
              placementOrdinal: lifetime.placementOrdinal,
              startFrame: lifetime.startFrame,
              endFrame: lifetime.endFrame,
              depth: lifetime.depth,
            }));
          const exactPinnedLifecycleCounts = pinnedLifecycleContract
            ? (
              lifecycle.incomingPlacementCount === pinnedLifecycleContract.incomingPlacementCount
              && lifecycle.explicitRemovalCount === pinnedLifecycleContract.explicitRemovalCount
              && lifecycle.parentTerminalTerminationCount === pinnedLifecycleContract.parentTerminalTerminationCount
              && lifecycle.replacementTerminationCount === pinnedLifecycleContract.replacementTerminationCount
              && lifecycle.zeroWrapLifetimeCount === pinnedLifecycleContract.zeroWrapLifetimeCount
              && canonicalJson(observedParentTerminalLifetimes) === canonicalJson(pinnedLifecycleContract.parentTerminalLifetimes)
              && canonicalJson(observedZeroWrapLifetimes) === canonicalJson(pinnedLifecycleContract.zeroWrapLifetimes)
            )
            : (
              parentTerminalTerminationCount === 0
              && zeroWrapLifetimeCount === 0
              && lifecycle.parentTerminalTerminationCount === undefined
              && lifecycle.zeroWrapLifetimeCount === undefined
              && lifetimes.every((lifetime) => (
                lifetime.terminalAtParentEndPermittedByPinnedSpec === undefined
                && lifetime.localPlayhead?.zeroWrapPermittedByPinnedSpec === undefined
              ))
            );
          if (
            lifetimes.length < 1
            || lifecycle.incomingPlacementCount !== lifetimes.length
            || lifecycle.explicitRemovalCount !== explicitRemovalCount
            || lifecycle.replacementTerminationCount !== replacementTerminationCount
            || explicitRemovalCount + parentTerminalTerminationCount + replacementTerminationCount !== lifetimes.length
            || !exactPinnedLifecycleCounts
            || lifecycle.clipActionCount !== 0
            || lifecycle.allInstancesFreshAtEmptyDepth !== true
            || lifecycle.allLifetimesMapped !== true
            || lifecycle.parentUpdateCount !== lifetimes.reduce((sum, lifetime) => sum + (lifetime.updates || []).length, 0)
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks exhaustive placement/update/termination proof`);
          }
          for (const [lifetimeIndex, lifetime] of lifetimes.entries()) {
            const playhead = lifetime.localPlayhead || {};
            const segments = Array.isArray(playhead.segments) ? playhead.segments : [];
            const duration = lifetime.endFrame - lifetime.startFrame + 1;
            const lifetimeBoundary = {
              placementOrdinal: lifetime.placementOrdinal,
              startFrame: lifetime.startFrame,
              endFrame: lifetime.endFrame,
              depth: lifetime.depth,
            };
            const pinnedParentTerminalLifetime = pinnedLifecycleContract?.parentTerminalLifetimes
              .find(({placementOrdinal}) => placementOrdinal === lifetime.placementOrdinal);
            const pinnedZeroWrapLifetime = pinnedLifecycleContract?.zeroWrapLifetimes
              .find(({placementOrdinal}) => placementOrdinal === lifetime.placementOrdinal);
            const exactPinnedParentTerminalBoundary = Boolean(
              pinnedParentTerminalLifetime
              && canonicalJson(lifetimeBoundary) === canonicalJson(pinnedParentTerminalLifetime)
            );
            const exactPinnedZeroWrapBoundary = Boolean(
              pinnedZeroWrapLifetime
              && canonicalJson(lifetimeBoundary) === canonicalJson(pinnedZeroWrapLifetime)
            );
            const exactRemovalTermination = (
              !pinnedParentTerminalLifetime
              && lifetime.termination?.kind === "removal"
              && lifetime.termination?.frame === lifetime.endFrame + 1
              && lifetime.termination?.depth === lifetime.depth
              && lifetime.termination?.tag === "RemoveObject2"
              && lifetime.terminalAtParentEndPermittedByPinnedSpec === undefined
            );
            const exactParentTerminalTermination = (
              exactPinnedParentTerminalBoundary
              && lifetime.termination?.kind === "parent-timeline-terminal"
              && lifetime.termination?.frame === lifetime.endFrame
              && lifetime.endFrame === parent.parentFrameCount
              && lifetime.termination?.depth === lifetime.depth
              && lifetime.termination?.tag === "End"
              && lifetime.terminalAtParentEndPermittedByPinnedSpec === true
            );
            const exactZeroWrapPolicy = playhead.wrapCount === 0
              ? exactPinnedZeroWrapBoundary
                && playhead.zeroWrapPermittedByPinnedSpec === true
                && segments.length === 1
              : !pinnedZeroWrapLifetime
                && playhead.zeroWrapPermittedByPinnedSpec === undefined
                && segments.length >= 2;
            let nextParentFrame = lifetime.startFrame;
            let segmentInvalid = segments.length < 1;
            for (const [segmentIndex, segment] of segments.entries()) {
              const segmentLength = segment.parentEndFrame - segment.parentStartFrame + 1;
              if (
                segment.kind !== (segmentIndex === 0 ? "entry" : "scriptless-wrap")
                || segment.parentStartFrame !== nextParentFrame
                || segment.parentEndFrame < segment.parentStartFrame
                || segment.localStartFrame !== 1
                || segment.localEndFrame !== segmentLength
                || segment.localEndFrame > claim.frameCount
              ) segmentInvalid = true;
              nextParentFrame = segment.parentEndFrame + 1;
            }
            if (
              lifetime.placementOrdinal !== lifetimeIndex + 1
              || lifetime.parentTimelineId !== parent.parentTimelineId
              || lifetime.parentFrameDomainId !== parent.parentFrameDomainId
              || lifetime.sourceObjectId !== claim.sourceObjectId
              || lifetime.depthWasEmptyBeforePlacement !== true
              || lifetime.durationFrames !== duration
              || duration < 1
              || lifetime.placement?.frame !== lifetime.startFrame
              || lifetime.placement?.depth !== lifetime.depth
              || lifetime.placement?.declaredSourceObjectId !== claim.sourceObjectId
              || lifetime.placement?.replace !== "0"
              || lifetime.placement?.hasClipActions !== false
              || (!exactRemovalTermination && !exactParentTerminalTermination)
              || (lifetime.predecessorBoundary !== null && (
                lifetime.predecessorBoundary?.kind !== "removal"
                || lifetime.predecessorBoundary.frame >= lifetime.startFrame
              ))
              || !(lifetime.updates || []).every((update) => (
                update.frame > lifetime.startFrame
                && update.frame <= lifetime.endFrame
                && update.depth === lifetime.depth
                && update.declaredSourceObjectId === null
                && update.preservesInstanceIdentity === true
                && update.hasClipActions === false
                && update.localFrame === ((update.frame - lifetime.startFrame) % claim.frameCount) + 1
              ))
              || playhead.indexing !== "one-indexed"
              || playhead.entryLocalFrame !== 1
              || playhead.parentFrameToLocalFrameFormula !== "((parentFrame - startFrame) % frameCount) + 1"
              || playhead.frameCount !== claim.frameCount
              || playhead.terminalLocalFrame !== ((lifetime.endFrame - lifetime.startFrame) % claim.frameCount) + 1
              || playhead.completeVisibleCycleCount !== Math.floor(duration / claim.frameCount)
              || playhead.wrapCount !== segments.length - 1
              || playhead.wrapCount < 0
              || !exactZeroWrapPolicy
              || playhead.implicitResetCount !== 0
              || playhead.explicitFreshPlacementResetCount !== 1
              || nextParentFrame !== lifetime.endFrame + 1
              || segmentInvalid
            ) {
              errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lifetime ${lifetimeIndex + 1} lacks exact one-indexed/reset mapping`);
            }
          }
          const display = claim.internalDisplayGraph || {};
          const displayEvents = Array.isArray(display.events) ? display.events : [];
          if (
            display.eventCount !== displayEvents.length
            || display.eventCount < 1
            || display.placementEventCount !== displayEvents.filter(({kind}) => kind !== "remove").length
            || display.removalEventCount !== displayEvents.filter(({kind}) => kind === "remove").length
            || display.unresolvedObjectCount !== 0
            || display.clipActionCount !== 0
            || display.allEventsHaveNoClipActions !== true
            || displayEvents.some((event) => event.hasClipActions === true)
            || claim.declaredFrameDomainAudit?.sourceTimelineDomainCount !== 0
            || claim.declaredFrameDomainAudit?.notDeclared !== true
            || (claim.declaredFrameDomainAudit?.frameDomainIds || []).length !== 0
            || claim.declaredFrameDomainAudit?.representedByParentFrameDomainId !== parent.parentFrameDomainId
            || claim.sourcePlayheadRule?.sourceGraphProvesAllWrapsAndResets !== true
            || claim.sourcePlayheadRule?.inferredLoopOrResetCount !== 0
            || claim.sourcePlayheadRule?.indexing !== "one-indexed"
          ) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} lacks internal-display/non-declared/source-playhead proof`);
          }
        }
        const obligationNames = claim.role === "single-frame-scriptless-structural-child"
          ? ["button", "interaction", "behavior", "fullFrame", "audio"]
          : claim.role === "multi-frame-scriptless-parent-clock-composite-child"
            ? ["visual", "button", "interaction", "behavior", "fullFrame", "rmse", "audio"]
            : ["audio", "behavior", "fullFrame"];
        for (const obligation of obligationNames) {
          const value = claim.preservedObligations?.[obligation];
          if (value?.required !== true || value?.satisfiedByDisposition !== false || !value?.status) {
            errors.push(`frame-domain disposition static composite claim ${claim.timelineId} does not preserve the ${obligation} obligation`);
          }
        }
        staticClaimsByTimeline.set(claim.timelineId, {claim, claimIndex});
      }
    }
  }

  const inventoryTimelines = Array.isArray(inventory?.timelineInventory) ? inventory.timelineInventory : [];
  if (!Array.isArray(inventory?.timelineInventory)) errors.push("frame-domain disposition scenario inventory has no timelineInventory array");
  const expectedTimelines = inventoryTimelines.filter((timeline) => (
    timeline.structuralReachability === "root"
    || timeline.structuralReachability === "reachable-from-root-placement-graph"
  )).sort(numericTimelineCompare);
  if (expectedTimelines.filter(({ timelineId, structuralReachability }) => timelineId === "root" && structuralReachability === "root").length !== 1) {
    errors.push("frame-domain disposition scenario inventory must contain exactly one reachable root timeline");
  }
  const actualTimelines = Array.isArray(report.timelines) ? report.timelines : [];
  if (!Array.isArray(report.timelines)) errors.push("frame-domain disposition timelines must be an array");
  if (actualTimelines[0]?.timelineId !== "root") errors.push("frame-domain disposition must enumerate root first");
  const actualById = new Map();
  for (const [index, timeline] of actualTimelines.entries()) {
    const label = `frame-domain disposition timeline ${index + 1}`;
    if (!timeline?.timelineId || actualById.has(timeline.timelineId)) {
      errors.push(`${label} timelineId must be non-empty and unique`);
      continue;
    }
    actualById.set(timeline.timelineId, timeline);
    if (timeline.sourceTimelineId !== timeline.timelineId) errors.push(`${label} sourceTimelineId must equal timelineId`);
    if (!Number.isInteger(timeline.frameCount) || timeline.frameCount < 1) errors.push(`${label} frameCount must be a positive integer`);
    if (!FRAME_DOMAIN_DISPOSITION_SET.has(timeline.disposition)) errors.push(`${label} has invalid disposition ${timeline.disposition || "missing"}`);
    if (!timeline.dispositionBasis) errors.push(`${label} dispositionBasis is required`);
    if (!isPlainObject(timeline.rootPlacement) || !FRAME_DOMAIN_ROOT_PLACEMENT_STATUSES.has(timeline.rootPlacement.status) || !Array.isArray(timeline.rootPlacement.namedPlacementPath)) {
      errors.push(`${label} rootPlacement must contain a valid status and namedPlacementPath`);
    } else {
      if (timeline.timelineId === "root" && timeline.rootPlacement.status !== "root-timeline") errors.push(`${label} root timeline must use root-timeline placement status`);
      if (timeline.timelineId !== "root" && timeline.rootPlacement.status === "root-timeline") errors.push(`${label} non-root timeline cannot use root-timeline placement status`);
      for (const [placementIndex, placement] of timeline.rootPlacement.namedPlacementPath.entries()) {
        if (!placement?.parentTimelineId || !placement.childTimelineId || !placement.sourceObjectId || !Number.isInteger(placement.frame) || placement.frame < 1 || !String(placement.depth || "") || !placement.tag) {
          errors.push(`${label} rootPlacement.namedPlacementPath[${placementIndex}] is incomplete`);
        }
      }
    }
    if (!Array.isArray(timeline.knownNamedParentPlacements)) errors.push(`${label} knownNamedParentPlacements must be an array`);
    if (!Array.isArray(timeline.declaredFrameDomains)) errors.push(`${label} declaredFrameDomains must be an array`);
    if (!isPlainObject(timeline.riskAssessment) || !FRAME_DOMAIN_RISK_LEVELS.has(timeline.riskAssessment.level) || typeof timeline.riskAssessment.independentFrameDomainCandidate !== "boolean" || !Array.isArray(timeline.riskAssessment.signals) || !timeline.riskAssessment.interpretation) {
      errors.push(`${label} riskAssessment must contain valid level, candidate flag, signals, and interpretation`);
    }
    if (!isPlainObject(timeline.staticSignals) || ["controlStateCount", "frameLabelCount", "namedChildPlacementCount"].some((key) => !Number.isInteger(timeline.staticSignals[key]) || timeline.staticSignals[key] < 0)) {
      errors.push(`${label} staticSignals must contain non-negative integer counts`);
    }
    const source = timeline.sourceEvidence || {};
    if (source.scenarioInventoryPath !== "audit/scenario-inventory.json" || source.scenarioInventorySha256 !== inventorySha256) {
      errors.push(`${label} sourceEvidence does not bind the current scenario inventory`);
    }
    if (source.swfmillArtifactId !== "swfmill-xml" || source.swfmillPath !== swfmillEvidence?.path || source.swfmillSha256 !== swfmillEvidence?.sha256) {
      errors.push(`${label} sourceEvidence does not bind the scenario inventory's swfmill structure`);
    }
  }
  const expectedById = new Map();
  for (const timeline of expectedTimelines) {
    if (!timeline?.timelineId || expectedById.has(timeline.timelineId)) {
      errors.push(`frame-domain disposition scenario inventory has duplicate or empty reachable timelineId ${timeline?.timelineId || "missing"}`);
      continue;
    }
    expectedById.set(timeline.timelineId, timeline);
    const actual = actualById.get(timeline.timelineId);
    if (!actual) continue;
    const expectedObjectId = timeline.objectId === null ? null : String(timeline.objectId);
    if (actual.sourceObjectId !== expectedObjectId || actual.frameCount !== timeline.frameCount || actual.structuralReachability !== timeline.structuralReachability) {
      errors.push(`frame-domain disposition timeline identity differs from scenario inventory for ${timeline.timelineId}`);
    }
  }
  const missingTimelines = expectedTimelines.filter(({ timelineId }) => !actualById.has(timelineId));
  const extraTimelines = actualTimelines.filter(({ timelineId }) => !expectedById.has(timelineId));
  if (missingTimelines.length) errors.push(`frame-domain disposition omits ${missingTimelines.length} structurally root-reachable timeline(s): ${conciseIds(missingTimelines)}`);
  if (extraTimelines.length) errors.push(`frame-domain disposition contains ${extraTimelines.length} timeline(s) absent from structural reachability: ${conciseIds(extraTimelines)}`);

  const manifestDomains = Array.isArray(manifest.implementation?.frameDomains) ? manifest.implementation.frameDomains : [];
  const domainsByTimeline = new Map();
  for (const domain of manifestDomains) {
    if (!domainsByTimeline.has(domain.sourceTimelineId)) domainsByTimeline.set(domain.sourceTimelineId, []);
    domainsByTimeline.get(domain.sourceTimelineId).push(normalizeDispositionDomain(domain));
  }
  for (const domains of domainsByTimeline.values()) domains.sort((left, right) => left.frameDomainId.localeCompare(right.frameDomainId, "en"));
  for (const timeline of actualTimelines) {
    const expectedDomains = domainsByTimeline.get(timeline.timelineId) || [];
    const actualDomains = Array.isArray(timeline.declaredFrameDomains) ? timeline.declaredFrameDomains : [];
    if (canonicalJson(actualDomains) !== canonicalJson(expectedDomains)) {
      errors.push(`frame-domain disposition declaredFrameDomains do not exactly match migration.json for ${timeline.timelineId}`);
    }
    if (expectedDomains.length && timeline.disposition !== "declared-frame-domain") {
      errors.push(`frame-domain disposition ${timeline.timelineId} must be declared-frame-domain because migration.json declares it`);
    }
    if (!expectedDomains.length && timeline.disposition === "declared-frame-domain") {
      errors.push(`frame-domain disposition ${timeline.timelineId} falsely claims a manifest frame domain`);
    }
    if (timeline.disposition === "composite-child-with-parent") {
      const staticClaimRecord = staticClaimsByTimeline.get(timeline.timelineId);
      const claim = staticClaimRecord?.claim;
      const staticReport = timeline.staticCompositeEvidence || {};
      if (!claim) {
        errors.push(`frame-domain disposition ${timeline.timelineId} claims composite-child-with-parent without verified static evidence`);
      } else {
        const expectedTimeline = expectedById.get(timeline.timelineId);
        if (claim.role === "audio-only-offstage-visual-marker") {
          const parentDomains = domainsByTimeline.get(claim.parentTimelineId) || [];
          if (
            String(expectedTimeline?.objectId) !== claim.sourceObjectId
            || expectedTimeline?.frameCount !== claim.frameCount
            || !parentDomains.some((domain) => domain.frameDomainId === claim.parentFrameDomainId && domain.sourceTimelineId === claim.parentTimelineId)
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} static claim has the wrong child or parent timeline`);
          }
          if (
            staticReport.evidencePath !== STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH
            || staticReport.evidenceSha256 !== staticDescriptor?.sha256
            || staticReport.claimIndex !== staticClaimRecord.claimIndex
            || staticReport.role !== claim.role
            || staticReport.parentTimelineId !== claim.parentTimelineId
            || staticReport.parentFrameDomainId !== claim.parentFrameDomainId
            || staticReport.nativeStageIntersection !== false
            || canonicalJson(staticReport.audioObligation) !== canonicalJson(claim.preservedObligations.audio)
            || canonicalJson(staticReport.behaviorObligation) !== canonicalJson(claim.preservedObligations.behavior)
            || canonicalJson(staticReport.fullFrameObligation) !== canonicalJson(claim.preservedObligations.fullFrame)
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} staticCompositeEvidence projection is stale`);
          }
        } else if (claim.role === "multi-frame-scriptless-parent-clock-composite-child") {
          const parent = claim.parentBinding || {};
	          const parentDomains = domainsByTimeline.get(parent.parentTimelineId) || [];
	          const lifetimes = claim.placementLifecycleAudit?.lifetimes || [];
	          const wrapCount = lifetimes.reduce((sum, lifetime) => sum + (lifetime.localPlayhead?.wrapCount || 0), 0);
	          const parentTerminalTerminationCount = lifetimes.filter(({termination}) => termination?.kind === "parent-timeline-terminal").length;
	          const zeroWrapLifetimeCount = lifetimes.filter(({localPlayhead}) => localPlayhead?.wrapCount === 0).length;
          if (
            String(expectedTimeline?.objectId) !== claim.sourceObjectId
            || expectedTimeline?.frameCount !== claim.frameCount
            || expectedTimeline?.structuralReachability !== "reachable-from-root-placement-graph"
            || (domainsByTimeline.get(claim.timelineId) || []).length !== 0
            || !parentDomains.some((domain) => domain.frameDomainId === parent.parentFrameDomainId && domain.sourceTimelineId === parent.parentTimelineId)
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} multi-frame static claim has the wrong child, parent, or declared-domain state`);
          }
          if (
            staticReport.evidencePath !== STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH
            || staticReport.evidenceSha256 !== staticDescriptor?.sha256
            || staticReport.claimIndex !== staticClaimRecord.claimIndex
            || staticReport.role !== claim.role
            || staticReport.claimScope !== claim.claimScope
            || staticReport.parentTimelineId !== parent.parentTimelineId
            || staticReport.parentFrameDomainId !== parent.parentFrameDomainId
            || staticReport.incomingPlacementCount !== claim.placementLifecycleAudit?.incomingPlacementCount
	            || staticReport.parentUpdateCount !== claim.placementLifecycleAudit?.parentUpdateCount
	            || staticReport.explicitRemovalCount !== claim.placementLifecycleAudit?.explicitRemovalCount
	            || staticReport.parentTerminalTerminationCount !== (parentTerminalTerminationCount || undefined)
	            || staticReport.replacementTerminationCount !== (
	              parentTerminalTerminationCount > 0
	                ? claim.placementLifecycleAudit?.replacementTerminationCount
	                : undefined
	            )
	            || staticReport.sourceProvenWrapCount !== wrapCount
	            || staticReport.zeroWrapLifetimeCount !== (zeroWrapLifetimeCount || undefined)
            || canonicalJson(staticReport.visualObligation) !== canonicalJson(claim.preservedObligations.visual)
            || canonicalJson(staticReport.buttonObligation) !== canonicalJson(claim.preservedObligations.button)
            || canonicalJson(staticReport.interactionObligation) !== canonicalJson(claim.preservedObligations.interaction)
            || canonicalJson(staticReport.behaviorObligation) !== canonicalJson(claim.preservedObligations.behavior)
            || canonicalJson(staticReport.fullFrameObligation) !== canonicalJson(claim.preservedObligations.fullFrame)
            || canonicalJson(staticReport.rmseObligation) !== canonicalJson(claim.preservedObligations.rmse)
            || canonicalJson(staticReport.audioObligation) !== canonicalJson(claim.preservedObligations.audio)
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} staticCompositeEvidence projection is stale`);
          }
        } else {
          const incomingParentIds = [...new Set((claim.placementAudit?.incomingPlacements || []).map(({parentTimelineId}) => parentTimelineId))]
            .sort((left, right) => Number(String(left).replace(/^sprite-/, "")) - Number(String(right).replace(/^sprite-/, "")) || String(left).localeCompare(String(right), "en"));
          if (
            String(expectedTimeline?.objectId) !== claim.sourceObjectId
            || expectedTimeline?.frameCount !== 1
            || expectedTimeline?.structuralReachability !== "reachable-from-root-placement-graph"
            || (domainsByTimeline.get(claim.timelineId) || []).length !== 0
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} single-frame static claim has the wrong child or declared-domain state`);
          }
          if (
            staticReport.evidencePath !== STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH
            || staticReport.evidenceSha256 !== staticDescriptor?.sha256
            || staticReport.claimIndex !== staticClaimRecord.claimIndex
            || staticReport.role !== claim.role
            || staticReport.claimScope !== claim.claimScope
            || canonicalJson(staticReport.parentTimelineIds) !== canonicalJson(incomingParentIds)
            || staticReport.exportedPlacementCount !== claim.placementAudit?.exportedPlacementCount
            || staticReport.clipActionCount !== 0
            || canonicalJson(staticReport.buttonObligation) !== canonicalJson(claim.preservedObligations.button)
            || canonicalJson(staticReport.interactionObligation) !== canonicalJson(claim.preservedObligations.interaction)
            || canonicalJson(staticReport.behaviorObligation) !== canonicalJson(claim.preservedObligations.behavior)
            || canonicalJson(staticReport.fullFrameObligation) !== canonicalJson(claim.preservedObligations.fullFrame)
            || canonicalJson(staticReport.audioObligation) !== canonicalJson(claim.preservedObligations.audio)
          ) {
            errors.push(`frame-domain disposition ${timeline.timelineId} staticCompositeEvidence projection is stale`);
          }
        }
      }
    } else if (timeline.staticCompositeEvidence) {
      errors.push(`frame-domain disposition ${timeline.timelineId} has staticCompositeEvidence without a composite disposition`);
    }
  }
  for (const [timelineId] of staticClaimsByTimeline) {
    if (actualById.get(timelineId)?.disposition !== "composite-child-with-parent") {
      errors.push(`frame-domain disposition ignores verified static composite claim for ${timelineId}`);
    }
  }
  for (const [sourceTimelineId] of domainsByTimeline) {
    if (!expectedById.has(sourceTimelineId)) errors.push(`migration.json frame domain source timeline is absent from structural reachability: ${sourceTimelineId}`);
  }

  const dispositionCounts = Object.fromEntries(FRAME_DOMAIN_DISPOSITIONS.map((value) => [value, 0]));
  for (const timeline of actualTimelines) if (FRAME_DOMAIN_DISPOSITION_SET.has(timeline.disposition)) dispositionCounts[timeline.disposition] += 1;
  const summary = report.summary || {};
  if (summary.inventoryTimelineCount !== inventoryTimelines.length) errors.push("frame-domain disposition summary.inventoryTimelineCount is stale");
  if (summary.enumeratedTimelineCount !== actualTimelines.length || summary.enumeratedTimelineCount !== expectedTimelines.length) errors.push("frame-domain disposition summary.enumeratedTimelineCount is stale or incomplete");
  if (summary.reachableChildTimelineCount !== Math.max(0, expectedTimelines.length - 1)) errors.push("frame-domain disposition summary.reachableChildTimelineCount is stale");
  if (summary.excludedNotProvenTimelineCount !== inventoryTimelines.length - expectedTimelines.length) errors.push("frame-domain disposition summary.excludedNotProvenTimelineCount is stale");
  if (canonicalJson(summary.dispositionCounts) !== canonicalJson(dispositionCounts)) errors.push("frame-domain disposition summary.dispositionCounts is stale");
  const highRisk = actualTimelines.filter((timeline) => timeline.riskAssessment?.level === "high");
  if (summary.highRiskIndependentCandidateCount !== highRisk.length || !Array.isArray(summary.highRiskIndependentCandidates)) {
    errors.push("frame-domain disposition high-risk candidate summary is stale");
  } else {
    const expectedHighRisk = highRisk.map((timeline) => ({
      timelineId: timeline.timelineId,
      sourceObjectId: timeline.sourceObjectId,
      frameCount: timeline.frameCount,
      rootPlacementStatus: timeline.rootPlacement.status,
      signals: timeline.riskAssessment.signals,
    })).sort((left, right) => right.frameCount - left.frameCount || Number(left.sourceObjectId) - Number(right.sourceObjectId));
    if (canonicalJson(summary.highRiskIndependentCandidates) !== canonicalJson(expectedHighRisk)) errors.push("frame-domain disposition high-risk candidate rows are stale");
  }

  const unresolvedTimelineIds = actualTimelines.filter(({ disposition }) => disposition === "unresolved").map(({ timelineId }) => timelineId);
  const undeclaredRequired = actualTimelines.filter(({ disposition }) => disposition === "independent-required").map(({ timelineId }) => timelineId);
  const expectedStatus = unresolvedTimelineIds.length ? "structurally-enumerated-dispositions-unresolved" : "structurally-enumerated";
  if (report.status !== expectedStatus) errors.push(`frame-domain disposition status must be ${expectedStatus}`);
  if (report.status !== "structurally-enumerated") errors.push("frame-domain disposition status is not strict-ready");
  if (unresolvedTimelineIds.length) errors.push(`frame-domain disposition has ${unresolvedTimelineIds.length} unresolved structurally reachable timeline(s): ${conciseIds(unresolvedTimelineIds)}`);
  if (undeclaredRequired.length) errors.push(`frame-domain disposition has ${undeclaredRequired.length} independent-required timeline(s) that must be declared before strict acceptance: ${conciseIds(undeclaredRequired)}`);

  return {
    applicable: true,
    ok: errors.length === startingErrorCount,
    path: reportPath,
    evidencePaths: [...new Set(evidencePaths)],
    report,
    unresolvedTimelineIds,
  };
}

function rendererProbeKey(frameDomain, scenario, language, frame) {
  return `${frameDomain}\0${scenario}\0${language}\0${frame}`;
}

export async function validateRendererFrameDomainSupport({
  root,
  manifest,
  errors,
  evidenceProjectRoot = projectRoot,
}) {
  const startingErrorCount = errors.length;
  const reportPath = path.join(root, RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH);
  const evidencePaths = [reportPath];
  if (!hasExplicitFrameDomains(manifest)) {
    return { applicable: false, ok: true, path: reportPath, evidencePaths, report: null, reportSha256: null };
  }
  if (!(await exists(reportPath))) {
    errors.push(`Missing required explicit-frame-domain renderer audit: ${RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH}`);
    return { applicable: true, ok: false, path: reportPath, evidencePaths, report: null, reportSha256: null };
  }

  let report;
  let reportSha256;
  try {
    const bytes = await readFile(reportPath);
    reportSha256 = createHash("sha256").update(bytes).digest("hex");
    report = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    errors.push(`Invalid ${RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH}: ${error.message}`);
    return { applicable: true, ok: false, path: reportPath, evidencePaths, report: null, reportSha256: null };
  }

  if (report.schemaVersion !== 1 || report.evidenceType !== "renderer-frame-domain-support-audit") {
    errors.push("renderer frame-domain support audit must be schemaVersion 1 renderer-frame-domain-support-audit evidence");
  }
  if (report.animationId !== manifest.animationId) errors.push("renderer frame-domain support animationId must match migration.json");
  if (report.migrationStatusChanged !== false) errors.push("renderer frame-domain support migrationStatusChanged must be false");
  if (!Array.isArray(report.authorityStatement) || !report.authorityStatement.length) errors.push("renderer frame-domain support authorityStatement must be non-empty");
  if (!String(report.strictAcceptanceEffect || "").startsWith("none;")) errors.push("renderer frame-domain support strictAcceptanceEffect must remain none");

  const manifestPath = path.join(root, "migration.json");
  evidencePaths.push(manifestPath);
  const generatedFrom = report.generatedFrom || {};
  if (generatedFrom.migrationManifest?.path !== "migration.json") errors.push("renderer frame-domain support must bind migration.json");
  if (generatedFrom.migrationManifest?.hashMode !== CANONICAL_PROJECTION_ENCODING) {
    errors.push("renderer frame-domain support technical manifest hashMode is stale");
  }
  if (generatedFrom.migrationManifest?.technicalProjection !== TECHNICAL_MANIFEST_PROJECTION.id) {
    errors.push("renderer frame-domain support technical manifest projection identifier is stale");
  }
  if (canonicalJson(generatedFrom.migrationManifest?.excludedPaths) !== canonicalJson(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)) {
    errors.push("renderer frame-domain support technical manifest excludedPaths are stale");
  }
  if (generatedFrom.migrationManifest?.technicalProjectionSha256 !== technicalManifestSha256(manifest)) {
    errors.push("renderer frame-domain support technical manifest projection SHA-256 is stale");
  }

  const registrySpecifier = manifest.implementation?.registryModule || "";
  const moduleBase = /^\.\/modules\/[a-z0-9][a-z0-9-]*$/.test(registrySpecifier)
    ? path.join(evidenceProjectRoot, "packages", "demos", "src", registrySpecifier.slice(2))
    : null;
  const modulePath = moduleBase && await exists(`${moduleBase}.tsx`)
    ? `${moduleBase}.tsx`
    : moduleBase && await exists(`${moduleBase}.ts`)
      ? `${moduleBase}.ts`
      : null;
  const timelinePath = await resolveExistingPath(manifest.implementation?.timelineModule, [evidenceProjectRoot, root]);
  const expectedSources = [
    ["prototypeRuntime", "packages/demos/src/prototype-manifest.ts", path.join(evidenceProjectRoot, "packages/demos/src/prototype-manifest.ts")],
    ["animationRegistry", "packages/demos/src/animation-registry.ts", path.join(evidenceProjectRoot, "packages/demos/src/animation-registry.ts")],
    ["runtimeContract", "packages/demos/src/contract.ts", path.join(evidenceProjectRoot, "packages/demos/src/contract.ts")],
    ["auditContract", "scripts/evidence-projections.mjs", path.join(evidenceProjectRoot, "scripts/evidence-projections.mjs")],
    ["auditBuilder", "scripts/build-renderer-frame-domain-support.mjs", path.join(evidenceProjectRoot, "scripts/build-renderer-frame-domain-support.mjs")],
    ["auditProbe", "scripts/probe-renderer-frame-domain-support.ts", path.join(evidenceProjectRoot, "scripts/probe-renderer-frame-domain-support.ts")],
    ["animationModule", modulePath ? path.relative(evidenceProjectRoot, modulePath).split(path.sep).join("/") : null, modulePath],
    ["pureTimeline", timelinePath ? path.relative(evidenceProjectRoot, timelinePath).split(path.sep).join("/") : null, timelinePath],
  ];
  for (const [descriptorId, expectedRelativePath, sourcePath] of expectedSources) {
    const descriptor = generatedFrom[descriptorId] || {};
    if (!expectedRelativePath || descriptor.path !== expectedRelativePath) {
      errors.push(`renderer frame-domain support ${descriptorId} path differs from the current manifest/runtime source`);
    }
    if (!sourcePath || !(await exists(sourcePath))) {
      errors.push(`renderer frame-domain support ${descriptorId} source does not exist (${descriptor.path || expectedRelativePath || "empty"})`);
      continue;
    }
    evidencePaths.push(sourcePath);
    if (!isSha256(descriptor.sha256) || descriptor.sha256 !== await sha256(sourcePath)) {
      errors.push(`renderer frame-domain support ${descriptorId} SHA-256 differs from the current source`);
    }
  }

  const domains = Array.isArray(manifest.implementation?.frameDomains) ? manifest.implementation.frameDomains : [];
  const languages = Array.isArray(manifest.localization?.languages) ? manifest.localization.languages : [];
  const expectedProbeKeys = new Set();
  for (const domain of domains) for (const scenario of domain.scenarioIds || []) for (const language of languages) {
    expectedProbeKeys.add(rendererProbeKey(domain.id, scenario, language, 1));
    expectedProbeKeys.add(rendererProbeKey(domain.id, scenario, language, domain.frameCount));
  }
  const probes = Array.isArray(report.probes) ? report.probes : [];
  if (!Array.isArray(report.probes)) errors.push("renderer frame-domain support probes must be an array");
  const probesByKey = new Map();
  for (const [index, probe] of probes.entries()) {
    const request = probe?.request || {};
    const key = rendererProbeKey(request.frameDomain, request.scenario, request.language, request.frame);
    if (probesByKey.has(key)) errors.push(`renderer frame-domain support has duplicate probe ${key.replaceAll("\0", "/")}`);
    else probesByKey.set(key, probe);
    if (!expectedProbeKeys.has(key)) errors.push(`renderer frame-domain support has unexpected probe ${key.replaceAll("\0", "/")}`);
    const actual = probe?.actual || {};
    const identityExact =
      actual.frameDomain === request.frameDomain && actual.frame === request.frame &&
      actual.scenario === request.scenario && actual.language === request.language;
    const blocked = actual.status === "blocked" || Boolean(actual.blocker);
    if (probe.identityExact !== identityExact || !isPlainObject(probe.identityChecks) || !Object.values(probe.identityChecks).every(Boolean)) {
      errors.push(`renderer frame-domain support probe ${index + 1} does not prove exact state frameDomain/frame/scenario/language identity`);
    }
    if (probe.blocked !== blocked) errors.push(`renderer frame-domain support probe ${index + 1} blocked classification is stale`);
    if (probe.moduleScenarioDeclared !== true) errors.push(`renderer frame-domain support probe ${index + 1} scenario is not declared by the animation module`);
    if (blocked) errors.push(`renderer frame-domain support probe ${index + 1} is blocked and therefore not renderable`);
    if (probe.renderable !== true || probe.outcome !== "renderable-exact") errors.push(`renderer frame-domain support probe ${index + 1} is not renderable-exact`);
    if (probe.error !== null) errors.push(`renderer frame-domain support probe ${index + 1} raised an error`);
  }
  for (const key of expectedProbeKeys) if (!probesByKey.has(key)) {
    errors.push(`renderer frame-domain support is missing probe ${key.replaceAll("\0", "/")}`);
  }

  let coverage = null;
  try {
    coverage = JSON.parse(await readFile(path.join(root, manifest.evidence?.fullFrameCoverageFile), "utf8"));
  } catch (error) {
    errors.push(`renderer frame-domain support cannot read coverage requirements (${error.message})`);
  }
  for (const requirement of coverage?.schemaVersion === 2 && Array.isArray(coverage.requirements) ? coverage.requirements : []) {
    const domain = domains.find(({ id }) => id === requirement.frameDomainId);
    const label = requirement.requirementId || `${requirement.frameDomainId}/${requirement.scenario}/${requirement.language}`;
    for (const frame of [1, domain?.frameCount]) {
      if (!Number.isInteger(frame)) continue;
      const probe = probesByKey.get(rendererProbeKey(requirement.frameDomainId, requirement.scenario, requirement.language, frame));
      if (!probe?.renderable || probe.blocked || !probe.identityExact || probe.actual?.frameDomain !== requirement.frameDomainId) {
        errors.push(`renderer frame-domain support requirement ${label} has no renderable-exact ${frame === 1 ? "first" : "last"} frame state`);
      }
    }
  }

  const domainSupport = Array.isArray(report.domainSupport) ? report.domainSupport : [];
  if (domainSupport.length !== domains.length) errors.push("renderer frame-domain support domainSupport count differs from migration.json");
  for (const domain of domains) {
    const row = domainSupport.find(({ frameDomain }) => frameDomain === domain.id);
    if (!row || row.frameCount !== domain.frameCount || row.fullyRenderable !== true || row.prototypeRuntime?.status !== "exact") {
      errors.push(`renderer frame-domain support domain ${domain.id} is not fully renderable against the prototype runtime`);
    }
  }
  if (report.summary?.declaredFrameDomainCount !== domains.length || report.summary?.probeCount !== probes.length || report.summary?.renderableCount !== probes.filter(({ renderable }) => renderable).length) {
    errors.push("renderer frame-domain support summary is stale");
  }
  if (report.status !== "fully-renderable") errors.push("renderer frame-domain support status is not fully-renderable");

  return {
    applicable: true,
    ok: errors.length === startingErrorCount,
    path: reportPath,
    evidencePaths: [...new Set(evidencePaths)],
    report,
    reportSha256,
  };
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

function decodeFileUri(uri) {
  if (typeof uri !== "string" || !uri.startsWith("file:")) return "";
  try {
    return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/, "");
  } catch {
    return "";
  }
}

function pathIsInside(base, candidate) {
  const relative = path.relative(base, candidate);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function resolveLocalAuditFile(base, relativePath, label, errors) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    errors.push(`${label}: path is required`);
    return null;
  }
  if (path.isAbsolute(relativePath)) {
    errors.push(`${label}: path must be relative`);
    return null;
  }
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(resolvedBase, relativePath);
  if (!pathIsInside(resolvedBase, resolved)) {
    errors.push(`${label}: path escapes its evidence root`);
    return null;
  }
  if (!(await exists(resolved))) {
    errors.push(`${label}: file does not exist (${relativePath})`);
    return null;
  }
  try {
    const metadata = await lstat(resolved);
    if (metadata.isSymbolicLink()) {
      errors.push(`${label}: symbolic links are not accepted`);
      return null;
    }
    const [realBase, realResolved] = await Promise.all([realpath(resolvedBase), realpath(resolved)]);
    if (!pathIsInside(realBase, realResolved)) {
      errors.push(`${label}: real path escapes its evidence root`);
      return null;
    }
    return resolved;
  } catch (error) {
    errors.push(`${label}: cannot resolve local file (${error.message})`);
    return null;
  }
}

function validateRecursiveAuthoringTimeline(authoringAudit, label, errors) {
  if (authoringAudit?.recursiveLibraryTimelineAudit !== true) {
    errors.push(`${label}: recursiveLibraryTimelineAudit must be true`);
  }
  if (!Array.isArray(authoringAudit?.library)) errors.push(`${label}: library must be an array`);
  const timelines = [authoringAudit?.timeline];
  for (const item of authoringAudit?.library || []) if (item?.timeline) timelines.push(item.timeline);
  for (const [timelineIndex, timeline] of timelines.entries()) {
    const timelineLabel = `${label}.${timelineIndex === 0 ? "timeline" : `libraryTimeline[${timelineIndex - 1}]`}`;
    if (!isPlainObject(timeline) || !Array.isArray(timeline.layers)) {
      errors.push(`${timelineLabel}: layers must be an array`);
      continue;
    }
    for (const [layerIndex, layer] of timeline.layers.entries()) {
      if (!Array.isArray(layer?.keyframes)) {
        errors.push(`${timelineLabel}.layers[${layerIndex}]: keyframes must be an array`);
        continue;
      }
      for (const [frameIndex, frame] of layer.keyframes.entries()) {
        if (!Array.isArray(frame?.elements)) {
          errors.push(`${timelineLabel}.layers[${layerIndex}].keyframes[${frameIndex}]: elements must be an array`);
        }
      }
    }
  }
}

export async function validateAdobeAnimateAuthoringAudit({
  root,
  manifest,
  errors,
  evidenceProjectRoot = projectRoot,
}) {
  const applicable = manifest.source?.pairedFlaStatus === "present" || Boolean(manifest.source?.fla);
  const auditPath = path.join(root, ADOBE_ANIMATE_AUTHORING_AUDIT_RELATIVE_PATH);
  if (!applicable) return {applicable: false, ok: true, path: auditPath, report: null};
  const startingErrorCount = errors.length;
  if (!(await exists(auditPath))) {
    errors.push(`Missing required paired-FLA authoring audit: ${ADOBE_ANIMATE_AUTHORING_AUDIT_RELATIVE_PATH}`);
    return {applicable: true, ok: false, path: auditPath, report: null};
  }

  let report;
  try {
    report = JSON.parse(await readFile(auditPath, "utf8"));
  } catch (error) {
    errors.push(`Invalid ${ADOBE_ANIMATE_AUTHORING_AUDIT_RELATIVE_PATH}: ${error.message}`);
    return {applicable: true, ok: false, path: auditPath, report: null};
  }

  const label = "paired-FLA authoring audit";
  if (report.schemaVersion !== 2) {
    errors.push(`${label}: schemaVersion must be 2`);
    return {applicable: true, ok: false, path: auditPath, report};
  }
  if (report.evidenceKind !== "adobe-animate-2021-cold-start-authoring-audit") {
    errors.push(`${label}: evidenceKind must be adobe-animate-2021-cold-start-authoring-audit`);
  }
  if (report.animationId !== manifest.animationId) errors.push(`${label}: animationId must match migration.json`);
  if (report.authority !== "Original owner-provided FLA inspected read-only in Adobe Animate 2021") {
    errors.push(`${label}: authority must identify the read-only owner-provided FLA inspection`);
  }
  if (!report.capturedAt || Number.isNaN(Date.parse(report.capturedAt))) errors.push(`${label}: capturedAt must be an ISO timestamp`);
  if (typeof report.animateVersion !== "string" || !/21[.,]0[.,]7/.test(report.animateVersion)) {
    errors.push(`${label}: animateVersion must identify Adobe Animate 2021 21.0.7`);
  }
  if (!isSha256(report.rawAuditSha256)) errors.push(`${label}: rawAuditSha256 must be a SHA-256`);
  if (!Array.isArray(report.limitations) || !report.limitations.length) errors.push(`${label}: limitations must be non-empty`);

  for (const field of [
    "coldStartPerFla",
    "openedWithoutSaving",
    "originalSourceHashVerified",
    "readOnlyWorkingCopyRequired",
    "readOnlyWorkingCopyPathVerified",
    "readOnlyWorkingCopyHashVerifiedAtFinalize",
    "readOnlyWorkingCopyPermissionsVerifiedAtFinalize",
    "recursiveLibraryTimelineAuditRequired",
    "recursiveLibraryTimelineAuditVerified",
  ]) if (report.protocol?.[field] !== true) errors.push(`${label}: protocol.${field} must be true`);

  if (report.auditScript?.file !== ADOBE_ANIMATE_AUDIT_SCRIPT_RELATIVE_PATH) {
    errors.push(`${label}: auditScript.file must be ${ADOBE_ANIMATE_AUDIT_SCRIPT_RELATIVE_PATH}`);
  }
  const auditScriptPath = await resolveLocalAuditFile(
    evidenceProjectRoot,
    ADOBE_ANIMATE_AUDIT_SCRIPT_RELATIVE_PATH,
    `${label} auditScript`,
    errors,
  );
  if (auditScriptPath) await verifyChecksum(auditScriptPath, report.auditScript?.sha256, `${label} auditScript`, errors);

  const sourceFla = manifest.source?.fla;
  const sourceFlaSha256 = manifest.source?.flaSha256;
  if (!sourceFla) errors.push(`${label}: migration source.fla is required`);
  if (report.source?.fla !== sourceFla) errors.push(`${label}: source.fla must match migration.json`);
  if (report.source?.flaSha256 !== sourceFlaSha256) errors.push(`${label}: source.flaSha256 must match migration.json`);
  const resolvedSource = await resolveExistingPath(sourceFla, [evidenceProjectRoot, process.cwd(), root]);
  if (!resolvedSource) errors.push(`${label}: source FLA does not exist (${sourceFla || "empty"})`);
  else await verifyChecksum(resolvedSource, sourceFlaSha256, `${label} source FLA`, errors);

  const expectedWorkingCopy = `work/animate/read-only-fla-copies/${manifest.animationId}/${path.basename(sourceFla || "")}`;
  const workingCopy = report.source?.workingCopy;
  if (workingCopy?.path !== expectedWorkingCopy) {
    errors.push(`${label}: source.workingCopy.path must be ${expectedWorkingCopy}`);
  }
  const workingCopyPath = await resolveLocalAuditFile(
    evidenceProjectRoot,
    workingCopy?.path,
    `${label} working copy`,
    errors,
  );
  if (workingCopyPath) {
    const workingCopyMetadata = await stat(workingCopyPath);
    const workingCopySha256 = await sha256(workingCopyPath);
    if (workingCopySha256 !== sourceFlaSha256 || workingCopy?.sha256 !== sourceFlaSha256) {
      errors.push(`${label}: working-copy FLA must be byte-identical to the source FLA`);
    }
    if (workingCopy?.bytes !== workingCopyMetadata.size) errors.push(`${label}: working-copy byte count does not match the file`);
    if ((workingCopyMetadata.mode & 0o222) !== 0) errors.push(`${label}: working-copy FLA is writable`);
  }
  if (workingCopy?.readOnlyAtFinalize !== true) errors.push(`${label}: source.workingCopy.readOnlyAtFinalize must be true`);
  if (workingCopy?.byteIdenticalToSourceAtFinalize !== true) errors.push(`${label}: source.workingCopy.byteIdenticalToSourceAtFinalize must be true`);

  const nativeMovie = report.nativeMovie || {};
  for (const [field, actual, expected] of [
    ["width", nativeMovie.width, manifest.runtime?.stage?.width],
    ["height", nativeMovie.height, manifest.runtime?.stage?.height],
    ["fps", nativeMovie.fps, manifest.runtime?.fps],
    ["frameCount", nativeMovie.frameCount, manifest.runtime?.frameCount],
  ]) if (actual !== expected) errors.push(`${label}: nativeMovie.${field} must match migration runtime (${actual} != ${expected})`);
  if (!Number.isInteger(nativeMovie.rootLayerCount) || nativeMovie.rootLayerCount < 0) errors.push(`${label}: nativeMovie.rootLayerCount must be a non-negative integer`);
  if (!Number.isInteger(nativeMovie.libraryItemCount) || nativeMovie.libraryItemCount < 0) errors.push(`${label}: nativeMovie.libraryItemCount must be a non-negative integer`);

  const capturedFrame = report.capturedAuthoringFrame || {};
  if (!Number.isInteger(capturedFrame.flashFrame) || capturedFrame.flashFrame < 1 || capturedFrame.flashFrame > manifest.runtime?.frameCount) {
    errors.push(`${label}: capturedAuthoringFrame.flashFrame must be inside the root timeline`);
  }
  const expectedFrameFile = `audit/adobe-animate-2021-authoring-frame-${String(capturedFrame.flashFrame || 0).padStart(4, "0")}.png`;
  if (capturedFrame.file !== expectedFrameFile) errors.push(`${label}: capturedAuthoringFrame.file must be ${expectedFrameFile}`);
  const framePath = await resolveLocalAuditFile(root, capturedFrame.file, `${label} captured frame`, errors);
  if (framePath) {
    await verifyChecksum(framePath, capturedFrame.sha256, `${label} captured frame`, errors);
    const decoded = await verifyPng(framePath, manifest.runtime?.stage?.width, manifest.runtime?.stage?.height, `${label} captured frame`, errors);
    if (decoded && (capturedFrame.width !== decoded.width || capturedFrame.height !== decoded.height)) {
      errors.push(`${label}: capturedAuthoringFrame dimensions do not match the PNG`);
    }
  }
  if (capturedFrame.width !== manifest.runtime?.stage?.width || capturedFrame.height !== manifest.runtime?.stage?.height) {
    errors.push(`${label}: capturedAuthoringFrame dimensions must match the native stage`);
  }

  const authoringAudit = report.authoringAudit;
  if (!isPlainObject(authoringAudit)) {
    errors.push(`${label}: authoringAudit must contain the recursive raw Animate report`);
  } else {
    if (authoringAudit.schemaVersion !== 1) errors.push(`${label}: authoringAudit.schemaVersion must be 1`);
    if (authoringAudit.evidenceKind !== "adobe-animate-authoring-audit") errors.push(`${label}: authoringAudit.evidenceKind is invalid`);
    if (authoringAudit.capturedAt !== report.capturedAt) errors.push(`${label}: authoringAudit.capturedAt must match the canonical report`);
    if (authoringAudit.animateVersion !== report.animateVersion) errors.push(`${label}: authoringAudit.animateVersion must match the canonical report`);
    if (authoringAudit.document?.name !== path.basename(sourceFla || "")) errors.push(`${label}: authoringAudit.document.name must match source.fla`);
    if (!workingCopyPath || path.resolve(decodeFileUri(authoringAudit.document?.pathURI)) !== path.resolve(workingCopyPath)) {
      errors.push(`${label}: authoringAudit.document.pathURI must identify the verified read-only working copy`);
    }
    for (const [field, actual, expected] of [
      ["document.width", authoringAudit.document?.width, nativeMovie.width],
      ["document.height", authoringAudit.document?.height, nativeMovie.height],
      ["document.frameRate", authoringAudit.document?.frameRate, nativeMovie.fps],
      ["timeline.frameCount", authoringAudit.timeline?.frameCount, nativeMovie.frameCount],
      ["timeline.currentFlashFrame", authoringAudit.timeline?.currentFlashFrame, capturedFrame.flashFrame],
      ["timeline.layerCount", authoringAudit.timeline?.layerCount, nativeMovie.rootLayerCount],
      ["document.libraryItemCount", authoringAudit.document?.libraryItemCount, nativeMovie.libraryItemCount],
      ["document.backgroundColor", authoringAudit.document?.backgroundColor, nativeMovie.backgroundColor],
    ]) if (actual !== expected) errors.push(`${label}: authoringAudit.${field} differs from the canonical binding`);
    const observedRawAuditSha256 = createHash("sha256").update(Buffer.from(JSON.stringify(authoringAudit))).digest("hex");
    if (report.rawAuditSha256 !== observedRawAuditSha256) errors.push(`${label}: rawAuditSha256 does not match authoringAudit`);
    validateRecursiveAuthoringTimeline(authoringAudit, `${label}.authoringAudit`, errors);
  }

  return {
    applicable: true,
    ok: errors.length === startingErrorCount,
    path: auditPath,
    report,
  };
}

function requireHeaders(csv, required, label, errors) {
  for (const header of required) if (!csv.headers.includes(header)) errors.push(`${label}: missing column ${header}`);
}

function validateReview(review, label, errors) {
  if (!review || review.decision !== "accepted") {
    errors.push(`${label}.decision must be accepted`);
    return;
  }
  if (!review.reviewer) errors.push(`${label}.reviewer is required`);
  if (!review.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) errors.push(`${label}.reviewedAt must be an ISO date`);
}

function descriptorsEqual(left, right) {
  return Boolean(left && right)
    && left.path === right.path
    && left.bytes === right.bytes
    && left.sha256 === right.sha256;
}

function validateAcceptedReviewMirror(review, record, label, errors, {owner = false} = {}) {
  if (record?.decision !== "accepted") errors.push(`${label}.record decision must be accepted`);
  if (review?.reviewer !== record?.reviewer?.fullName) errors.push(`${label}.reviewer must mirror the immutable record reviewer fullName`);
  if (review?.reviewedAt !== record?.reviewedAt) errors.push(`${label}.reviewedAt must mirror the immutable record timestamp`);
  if (!owner && review?.scope !== record?.scope) errors.push(`${label}.scope must mirror the immutable record scope`);
  if (owner && review?.reason !== record?.reason) errors.push(`${label}.reason must mirror the immutable owner record reason`);
}

export async function validateBoundAcceptanceReviews({
  projectRoot: evidenceRoot,
  workspace,
  manifest,
  errors,
  now = Date.now(),
}) {
  const humanReview = manifest.acceptance?.humanVisualReview;
  const ownerReview = manifest.acceptance?.ownerReview;
  let expectations = null;
  const currentExpectations = async () => {
    if (!expectations) expectations = await deriveHumanReviewExpectations({
      projectRoot: evidenceRoot,
      workspace,
      manifest,
    });
    return expectations;
  };

  if (humanReview?.decision === "accepted") {
    if (!humanReview.record) {
      errors.push("acceptance.humanVisualReview is accepted legacy-unbound inline data; an immutable record descriptor is required");
    } else {
      try {
        const expected = await currentExpectations();
        const human = await validateHumanVisualReviewRecord({
          projectRoot: evidenceRoot,
          workspace,
          manifest,
          recordPath: path.resolve(evidenceRoot, humanReview.record.path || ""),
          expectedRecordDescriptor: humanReview.record,
          now,
          ...expected,
        });
        validateAcceptedReviewMirror(humanReview, human.value, "acceptance.humanVisualReview", errors);
      } catch (error) {
        errors.push(`acceptance.humanVisualReview immutable record is invalid or stale: ${error.message}`);
      }
    }
  }

  if (ownerReview?.decision === "accepted") {
    if (!ownerReview.record) {
      errors.push("acceptance.ownerReview is accepted legacy-unbound inline data; an immutable record descriptor is required");
    } else {
      try {
        const expected = await currentExpectations();
        const expectedOwnerEvidence = await deriveOwnerReviewEvidence({
          projectRoot: evidenceRoot,
          workspace,
          manifest,
        });
        const owner = await validateOwnerReviewRecord({
          projectRoot: evidenceRoot,
          workspace,
          manifest,
          recordPath: path.resolve(evidenceRoot, ownerReview.record.path || ""),
          expectedRecordDescriptor: ownerReview.record,
          expectedOwnerEvidence,
          now,
          ...expected,
        });
        validateAcceptedReviewMirror(ownerReview, owner.value, "acceptance.ownerReview", errors, {owner: true});
        if (!descriptorsEqual(owner.value.humanVisualReview, humanReview?.record)) {
          errors.push("acceptance.ownerReview.record must bind the exact immutable human review record mirrored by migration.json");
        }
      } catch (error) {
        errors.push(`acceptance.ownerReview immutable record is invalid or stale: ${error.message}`);
      }
    }
  }
}

export async function validateInventory({ root, manifest, errors }) {
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
  requireHeaders(audio, [
    "cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id", "start_semantics", "duration_ms",
  ], "audio-inventory.csv", errors);
  if (manifest.audio.required && !audio.rows.length) errors.push("audio-inventory.csv must contain at least one cue when audio.required is true");
  if (!manifest.audio.required && !manifest.audio.reasonNotRequired) errors.push("audio.reasonNotRequired is required when audio is not required");
  const audioLanguages = new Set();
  const cueIds = new Set();
  const audioFrameDomains = hasExplicitFrameDomains(manifest)
    ? frameDomainMap(manifest)
    : new Map([["root", { id: "root", kind: "root", frameCount: manifest.runtime.frameCount }]]);
  for (const [index, row] of audio.rows.entries()) {
    const label = `audio-inventory.csv row ${index + 2}`;
    if (!row.cue_id) errors.push(`${label}: cue_id is required`);
    cueIds.add(row.cue_id);
    audioLanguages.add(row.language);
    if (!manifest.localization.languages.includes(row.language) && !["shared", "und"].includes(row.language)) errors.push(`${label}: unsupported language ${row.language}`);
    const filePath = await resolveExistingPath(row.source_file, projectRoots);
    if (!filePath) errors.push(`${label}: source_file does not exist (${row.source_file || "empty"})`);
    else await verifyChecksum(filePath, row.sha256, label, errors);
    const startSemantics = row.start_semantics || "timeline-frame";
    if (!["timeline-frame", "host-user-activated", "interaction-state"].includes(startSemantics)) {
      errors.push(`${label}: start_semantics must be timeline-frame, host-user-activated, or interaction-state`);
    }
    if (startSemantics === "timeline-frame") {
      const domain = audioFrameDomains.get(row.start_frame_domain_id);
      if (!domain) errors.push(`${label}: start_frame_domain_id must identify a declared frame domain for timeline-frame audio`);
      const frame = Number(row.start_frame);
      if (!Number.isInteger(frame) || frame < 1 || frame > (domain?.frameCount || 0)) errors.push(`${label}: start_frame must be within its declared frame domain`);
    } else {
      if (row.start_frame !== "") errors.push(`${label}: start_frame must be blank when start_semantics is ${startSemantics}`);
      if (row.start_frame_domain_id !== "") errors.push(`${label}: start_frame_domain_id must be blank when start_semantics is ${startSemantics}`);
    }
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
  const domainsById = hasExplicitFrameDomains(manifest) ? frameDomainMap(manifest) : null;
  requireHeaders(keyframes, [
    "frame", "scenario", "language", "kind", "baseline_file", "baseline_sha256", "implementation_file",
    "implementation_sha256", "diff_file", "diff_sha256", "normalized_rmse", "timing_result", "visual_result", "reviewer",
  ], "keyframes.csv", errors);
  if (domainsById) requireHeaders(keyframes, ["requirement_id", "frame_domain_id", "trace_id", "entry_state_sha256"], "keyframes.csv", errors);
  if (!keyframes.rows.length) errors.push("keyframes.csv must contain at least one evidence row");
  const scenarioIds = new Set(manifest.scenarios.map(({ id }) => id));
  let requirements = [];
  if (domainsById) {
    try {
      const coverage = JSON.parse(await readFile(path.join(root, manifest.evidence.fullFrameCoverageFile), "utf8"));
      if (coverage.schemaVersion === 2 && Array.isArray(coverage.requirements)) requirements = coverage.requirements;
    } catch {
      // validateFullFrameCoverage reports the authoritative parse error.
    }
  }
  for (const [index, row] of keyframes.rows.entries()) {
    const rowName = `keyframes.csv row ${index + 2}`;
    const frame = Number(row.frame);
    let frameCount = manifest.runtime.frameCount;
    let matchedRequirement;
    if (domainsById) {
      const domain = domainsById.get(row.frame_domain_id);
      if (!domain) errors.push(`${rowName}: unknown frame_domain_id ${row.frame_domain_id || "empty"}`);
      else frameCount = domain.frameCount;
      if (!row.trace_id) errors.push(`${rowName}: trace_id is required`);
      if (!row.requirement_id) errors.push(`${rowName}: requirement_id is required`);
      if (!isSha256(row.entry_state_sha256)) errors.push(`${rowName}: entry_state_sha256 must contain 64 hexadecimal characters`);
      matchedRequirement = requirements.find((requirement) =>
        requirement.requirementId === row.requirement_id && requirement.frameDomainId === row.frame_domain_id && requirement.traceId === row.trace_id &&
        requirement.scenario === row.scenario && requirement.language === row.language,
      );
      if (!matchedRequirement) errors.push(`${rowName}: no full-frame requirement matches requirement/domain/trace/scenario/language`);
      else if (row.entry_state_sha256.toLowerCase() !== String(matchedRequirement.entryStateSha256 || "").toLowerCase()) {
        errors.push(`${rowName}: entry_state_sha256 does not match its full-frame requirement`);
      }
    }
    if (!Number.isInteger(frame) || frame < 1 || frame > frameCount) errors.push(`${rowName}: frame must be within the one-indexed frame domain timeline`);
    if (!scenarioIds.has(row.scenario)) errors.push(`${rowName}: unknown scenario ${row.scenario}`);
    if (!manifest.localization.languages.includes(row.language)) errors.push(`${rowName}: unsupported language ${row.language}`);
    for (const [field, hashField] of [
      ["baseline_file", "baseline_sha256"],
      ["implementation_file", "implementation_sha256"],
      ["diff_file", "diff_sha256"],
    ]) {
      const filePath = await resolveExistingPath(row[field], [root, projectRoot, process.cwd()]);
      if (!filePath) errors.push(`${rowName}: ${field} does not exist (${row[field] || "empty"})`);
      else {
        await verifyPng(filePath, manifest.runtime.stage.width, manifest.runtime.stage.height, `${rowName} ${field}`, errors);
        await verifyChecksum(filePath, row[hashField], `${rowName} ${hashField}`, errors);
      }
    }
    const rmse = Number(row.normalized_rmse);
    if (!(Number.isFinite(rmse) && rmse >= 0 && rmse <= 1)) errors.push(`${rowName}: normalized_rmse must be between 0 and 1`);
    const evidenceId = domainsById
      ? `keyframe:${row.frame_domain_id}:${row.trace_id}:${row.scenario}:${row.language}:${row.frame}`
      : `keyframe:${row.scenario}:${row.language}:${row.frame}`;
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

async function validateCaptureManifest({
  capturePath,
  expected,
  root,
  manifest,
  label,
  errors,
  currentImplementationArtifactClosure,
}) {
  await verifyChecksum(capturePath, expected.captureManifestSha256, label, errors);
  let capture;
  try {
    capture = JSON.parse(await readFile(capturePath, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid capture manifest (${error.message})`);
    return null;
  }
  const domainAware = Boolean(expected.frameDomainId);
  const requiredCaptureSchema = IMPLEMENTATION_CAPTURE_SCHEMA_VERSION;
  if (capture.schemaVersion !== requiredCaptureSchema || capture.status !== "complete") {
    const detail = capture.schemaVersion < requiredCaptureSchema
      ? `legacy schemaVersion ${capture.schemaVersion ?? "missing"} implementation capture is prereview-only because it has no capture-time implementation artifact closure`
      : `capture manifest must be schemaVersion ${requiredCaptureSchema} and complete`;
    errors.push(`${label}: ${detail}`);
  }
  if (capture.schemaVersion === requiredCaptureSchema) {
    const generatorErrors = implementationCaptureGeneratorProvenanceErrors(capture.generatorProvenance);
    for (const reason of generatorErrors) errors.push(`${label}: ${reason}`);
    const closureErrors = implementationArtifactClosureErrors(
      capture.implementationArtifactClosure,
      currentImplementationArtifactClosure,
    );
    for (const reason of closureErrors) errors.push(`${label}: ${reason}`);
    if (!currentImplementationArtifactClosure) {
      errors.push(`${label}: current implementation artifact closure could not be recomputed`);
    }
  }
  if (!isUnambiguousLoopbackHttpUrl(capture.sourceUrl)) errors.push(`${label}: sourceUrl must be an unambiguous credential-free loopback http URL`);
  if (capture.scenario !== expected.scenario || capture.language !== expected.language || String(capture.seed) !== String(expected.seed)) errors.push(`${label}: scenario/language/seed do not match coverage metadata`);
  if (domainAware && capture.animationId !== manifest.animationId) errors.push(`${label}: capture animationId does not match migration.json`);
  if (capture.reportedFrameAttribute !== "data-flash-frame") errors.push(`${label}: reportedFrameAttribute must be data-flash-frame`);
  if (domainAware) {
    if (
      capture.requirementId !== expected.requirementId || capture.frameDomainId !== expected.frameDomainId || capture.traceId !== expected.traceId ||
      capture.entryStateSha256 !== expected.entryStateSha256
    ) {
      errors.push(`${label}: capture requirementId/frameDomainId/traceId/entryStateSha256 do not match the requirement`);
    }
    if (capture.reportedFrameDomainAttribute !== "data-flash-frame-domain") {
      errors.push(`${label}: reportedFrameDomainAttribute must be data-flash-frame-domain`);
    }
    if (capture.reportedAnimationIdAttribute !== "data-animation-id") {
      errors.push(`${label}: reportedAnimationIdAttribute must be data-animation-id`);
    }
    if (capture.reportedRequirementIdAttribute !== "data-flash-requirement-id") {
      errors.push(`${label}: reportedRequirementIdAttribute must be data-flash-requirement-id`);
    }
    if (capture.reportedTraceAttribute !== "data-flash-trace-id") errors.push(`${label}: reportedTraceAttribute must be data-flash-trace-id`);
    if (capture.reportedEntryStateSha256Attribute !== "data-flash-entry-state-sha256") {
      errors.push(`${label}: reportedEntryStateSha256Attribute must be data-flash-entry-state-sha256`);
    }
    if (capture.captureStageAttribute !== "data-capture-stage") {
      errors.push(`${label}: captureStageAttribute must be data-capture-stage`);
    }
    if (capture.reportedRenderStateAttribute !== "data-render-state") {
      errors.push(`${label}: reportedRenderStateAttribute must be data-render-state`);
    }
    if (capture.reportedVisualTargetAttribute !== "data-render-visual") {
      errors.push(`${label}: reportedVisualTargetAttribute must be data-render-visual`);
    }
    if (capture.requiredRenderState !== "ready") {
      errors.push(`${label}: requiredRenderState must be ready`);
    }
  }
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    if (!Array.isArray(capture[field]) || capture[field].length) errors.push(`${label}: ${field} must be an empty array`);
  }
  if (capture.viewport?.width !== manifest.runtime.stage.width || capture.viewport?.height !== manifest.runtime.stage.height || capture.viewport?.deviceScaleFactor !== 1) {
    errors.push(`${label}: viewport must match the native stage at device scale 1`);
  }
  const items = capture.captured || [];
  const firstFrame = domainAware ? expected.requiredRange.firstFrame : 1;
  const lastFrame = domainAware ? expected.requiredRange.lastFrame : manifest.runtime.frameCount;
  const expectedFrameCount = lastFrame - firstFrame + 1;
  if (items.length !== expectedFrameCount) errors.push(`${label}: captured count must equal the required frame-domain range`);
  const frameSet = new Set(items.map(({ frame }) => Number(frame)));
  if (frameSet.size !== items.length) errors.push(`${label}: captured frames must not contain duplicates`);
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (!frameSet.has(frame)) errors.push(`${label}: missing captured frame ${frame}`);
  const captureRoot = path.dirname(capturePath);
  for (const [index, item] of items.entries()) {
    const itemLabel = `${label} captured[${index}]`;
    if (item.reportedFrame !== item.frame) errors.push(`${itemLabel}: reportedFrame must equal frame`);
    if (item.scenario !== expected.scenario || item.language !== expected.language || String(item.seed) !== String(expected.seed)) errors.push(`${itemLabel}: scenario/language/seed mismatch`);
    if (domainAware && (
      item.animationId !== manifest.animationId || item.requirementId !== expected.requirementId || item.frameDomainId !== expected.frameDomainId || item.traceId !== expected.traceId ||
      item.entryStateSha256 !== expected.entryStateSha256
    )) {
      errors.push(`${itemLabel}: requirement/domain/trace/state pairing mismatch`);
    }
    if (domainAware) {
      if (item.reportedRenderState !== "ready") {
        errors.push(`${itemLabel}: reportedRenderState must prove the capture stage was ready`);
      }
      const visual = item.visualTarget;
      if (!isPlainObject(visual)) {
        errors.push(`${itemLabel}: visualTarget must bind the ready visual renderer identity`);
      } else {
        if (!String(visual.tagName || "").trim()) errors.push(`${itemLabel}: visualTarget.tagName is required`);
        if (visual.reportedRenderState !== "ready") errors.push(`${itemLabel}: visualTarget.reportedRenderState must be ready`);
        if (
          visual.animationId !== manifest.animationId ||
          visual.reportedFrame !== item.frame ||
          visual.frameDomainId !== expected.frameDomainId ||
          visual.requirementId !== expected.requirementId ||
          visual.traceId !== expected.traceId ||
          visual.entryStateSha256 !== expected.entryStateSha256 ||
          visual.scenario !== expected.scenario ||
          visual.language !== expected.language ||
          String(visual.seed) !== String(expected.seed)
        ) {
          errors.push(`${itemLabel}: visualTarget identity does not match the exact requested capture context`);
        }
      }
    }
    const filePath = await resolveExistingPath(item.file, [captureRoot, root, projectRoot, process.cwd()]);
    if (!filePath) errors.push(`${itemLabel}: file does not exist (${item.file || "empty"})`);
    else {
      await verifyPng(filePath, manifest.runtime.stage.width, manifest.runtime.stage.height, itemLabel, errors);
      await verifyChecksum(filePath, item.sha256, itemLabel, errors);
    }
  }
  return capture;
}

async function validateBaselineCaptureManifest({ baselinePath, requirement, root, manifest, label, errors }) {
  await verifyChecksum(
    baselinePath,
    requirement.baselineCaptureManifestSha256,
    `${label} baseline capture manifest`,
    errors,
  );
  let baseline;
  try {
    baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid baseline capture manifest (${error.message})`);
    return null;
  }
  if (
    baseline.schemaVersion !== 2 || baseline.status !== "complete" ||
    baseline.evidenceType !== "original-runtime-frame-domain-baseline"
  ) {
    errors.push(`${label}: baseline capture manifest must be schemaVersion 2 complete original-runtime-frame-domain-baseline evidence`);
  }
  if (baseline.animationId !== manifest.animationId) errors.push(`${label}: baseline animationId mismatch`);
  if (
    baseline.requirementId !== requirement.requirementId || baseline.frameDomainId !== requirement.frameDomainId ||
    baseline.traceId !== requirement.traceId || baseline.entryStateSha256 !== requirement.entryStateSha256 ||
    baseline.scenario !== requirement.scenario || baseline.language !== requirement.language ||
    String(baseline.seed) !== String(requirement.seed)
  ) {
    errors.push(`${label}: baseline requirement/domain/trace/state/scenario/language/seed pairing mismatch`);
  }
  if (baseline.baselineAuthority !== requirement.baselineAuthority) {
    errors.push(`${label}: baseline authority differs from the coverage requirement`);
  }
  if (
    baseline.source?.swfSha256 !== manifest.source?.swfSha256 ||
    baseline.source?.swf !== manifest.source?.swf
  ) {
    errors.push(`${label}: baseline source SWF identity differs from migration.json`);
  }
  const sourcePath = await resolveExistingPath(baseline.source?.swf, [root, projectRoot, process.cwd()]);
  if (!sourcePath) errors.push(`${label}: baseline source SWF does not exist (${baseline.source?.swf || "empty"})`);
  else await verifyChecksum(sourcePath, baseline.source?.swfSha256, `${label} baseline source SWF`, errors);

  const domain = frameDomainMap(manifest).get(requirement.frameDomainId);
  if (
    baseline.runtime?.stage?.width !== manifest.runtime.stage.width ||
    baseline.runtime?.stage?.height !== manifest.runtime.stage.height ||
    baseline.runtime?.fps !== manifest.runtime.fps ||
    baseline.runtime?.frameCount !== domain?.frameCount ||
    baseline.runtime?.frameNumbering !== "one-indexed"
  ) {
    errors.push(`${label}: baseline runtime stage/fps/frameCount/frameNumbering do not match the declared frame domain`);
  }
  if (!baseline.capturedAt || Number.isNaN(Date.parse(baseline.capturedAt))) {
    errors.push(`${label}: baseline capturedAt must be an ISO date`);
  }
  const capture = baseline.capture;
  for (const field of ["operator", "tool", "toolVersion", "entryProtocol", "frameControlProtocol"]) {
    if (!String(capture?.[field] || "").trim()) errors.push(`${label}: baseline capture.${field} is required`);
  }
  const expectedTraceEntryMode = requirement.baselineAuthority === "original-runtime-direct-seek"
    ? "original-runtime-direct-seek"
    : requirement.baselineAuthority === "original-runtime-frame-step"
      ? "original-runtime-root-entry"
      : "natural-runtime-navigation";
  const expectedFrameCaptureMode = requirement.baselineAuthority === "original-runtime-direct-seek"
    ? "deterministic-direct-seek"
    : "deterministic-sequential-step";
  if (capture?.traceEntryMode !== expectedTraceEntryMode) {
    errors.push(`${label}: baseline capture.traceEntryMode must be ${expectedTraceEntryMode}`);
  }
  if (capture?.frameCaptureMode !== expectedFrameCaptureMode) {
    errors.push(`${label}: baseline capture.frameCaptureMode must be ${expectedFrameCaptureMode}`);
  }
  const entryTrace = Array.isArray(capture?.entryTrace) ? capture.entryTrace : [];
  if (!entryTrace.length) errors.push(`${label}: baseline capture.entryTrace must document the natural runtime entry path`);
  for (const [index, step] of entryTrace.entries()) {
    if (step.order !== index + 1 || !String(step.action || "").trim()) {
      errors.push(`${label}: baseline capture.entryTrace must use sequential order values and non-empty actions`);
      break;
    }
  }
  if (entryTrace.length && entryTrace.at(-1)?.resultingFrameDomainId !== requirement.frameDomainId) {
    errors.push(`${label}: baseline entry trace must terminate in the required frame domain`);
  }

  const firstFrame = requirement.requiredRange.firstFrame;
  const lastFrame = requirement.requiredRange.lastFrame;
  const requiredCount = lastFrame - firstFrame + 1;
  const frames = Array.isArray(baseline.frames) ? baseline.frames : [];
  if (frames.length !== requiredCount) errors.push(`${label}: baseline must contain one source-runtime image per required frame-domain frame`);
  const frameSet = new Set(frames.map(({ frame }) => Number(frame)));
  if (frameSet.size !== frames.length) errors.push(`${label}: baseline frames must not contain duplicates`);
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) {
    if (!frameSet.has(frame)) errors.push(`${label}: baseline is missing frame ${frame}`);
  }
  const baselineRoot = path.dirname(baselinePath);
  for (const [index, item] of frames.entries()) {
    const itemLabel = `${label} baseline frames[${index}]`;
    if (
      item.animationId !== manifest.animationId || item.requirementId !== requirement.requirementId || item.frameDomainId !== requirement.frameDomainId ||
      item.traceId !== requirement.traceId || item.entryStateSha256 !== requirement.entryStateSha256
    ) {
      errors.push(`${itemLabel}: requirement/domain/trace/state pairing mismatch`);
    }
    const filePath = await resolveExistingPath(item.file, [baselineRoot, root, projectRoot, process.cwd()]);
    if (!filePath) errors.push(`${itemLabel}: file does not exist (${item.file || "empty"})`);
    else {
      await verifyPng(filePath, manifest.runtime.stage.width, manifest.runtime.stage.height, itemLabel, errors);
      await verifyChecksum(filePath, item.sha256, itemLabel, errors);
    }
  }
  return baseline;
}

async function validateFullFrameCoverageV1({
  root,
  manifest,
  coverage,
  errors,
  implementationProjectRoot,
}) {
  let currentImplementationArtifactClosure = null;
  try {
    currentImplementationArtifactClosure = await collectImplementationArtifactClosure({
      projectRoot: implementationProjectRoot,
      workspace: root,
      manifest,
    });
  } catch (error) {
    errors.push(`current implementation artifact closure cannot be recomputed: ${error.message}`);
  }
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
    if (combination.status === "blocked") {
      if (!combination.blockingReason) errors.push(`${label}: blocked coverage requires blockingReason`);
      if (!Array.isArray(combination.blockingEvidence) || !combination.blockingEvidence.length) {
        errors.push(`${label}: blocked coverage requires source-backed blockingEvidence`);
      } else {
        for (const [evidenceIndex, evidence] of combination.blockingEvidence.entries()) {
          const evidenceLabel = `${label} blockingEvidence[${evidenceIndex}]`;
          const evidencePath = await resolveExistingPath(evidence.file, [root, process.cwd()]);
          if (!evidencePath) errors.push(`${evidenceLabel}: file does not exist (${evidence.file || "empty"})`);
          else await verifyChecksum(evidencePath, evidence.sha256, evidenceLabel, errors);
        }
      }
      errors.push(`${label}: coverage is blocked (${combination.blockingReason || "reason missing"})`);
      continue;
    }
    if (combination.firstFrame !== 1 || combination.lastFrame !== manifest.runtime.frameCount || combination.capturedFrameCount !== manifest.runtime.frameCount || !Array.isArray(combination.missingFrames) || combination.missingFrames.length) {
      errors.push(`${label}: must declare complete one-indexed frame coverage with no missing frames`);
    }
    if (combination.seed === undefined || combination.seed === null || combination.seed === "") errors.push(`${label}: seed is required`);
    const capturePath = await resolveExistingPath(combination.captureManifest, [root, projectRoot, process.cwd()]);
    if (!capturePath) errors.push(`${label}: captureManifest does not exist (${combination.captureManifest || "empty"})`);
    else await validateCaptureManifest({
      capturePath,
      expected: combination,
      root,
      manifest,
      label,
      errors,
      currentImplementationArtifactClosure,
    });

    const metricsPath = await resolveExistingPath(combination.metricsFile, [root, projectRoot, process.cwd()]);
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

async function validateBlockedRequirement({ requirement, label, root, errors }) {
  if (!requirement.blockingReason) errors.push(`${label}: blocked coverage requires blockingReason`);
  if (!Array.isArray(requirement.blockingEvidence) || !requirement.blockingEvidence.length) {
    errors.push(`${label}: blocked coverage requires source-backed blockingEvidence`);
  } else {
    for (const [evidenceIndex, evidence] of requirement.blockingEvidence.entries()) {
      const evidenceLabel = `${label} blockingEvidence[${evidenceIndex}]`;
      const evidencePath = await resolveExistingPath(evidence.file, [root, projectRoot, process.cwd()]);
      if (!evidencePath) errors.push(`${evidenceLabel}: file does not exist (${evidence.file || "empty"})`);
      else await verifyChecksum(evidencePath, evidence.sha256, evidenceLabel, errors);
    }
  }
  errors.push(`${label}: coverage is blocked (${requirement.blockingReason || "reason missing"})`);
}

async function validateMetricsV2({
  metricsPath,
  requirement,
  manifest,
  baselineCapture,
  implementationCapture,
  label,
  errors,
}) {
  await verifyChecksum(metricsPath, requirement.metricsSha256, `${label} metrics`, errors);
  let metrics;
  try {
    metrics = JSON.parse(await readFile(metricsPath, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid metrics JSON (${error.message})`);
    return;
  }
  if (metrics.schemaVersion !== 2 || metrics.status !== "complete") errors.push(`${label}: metrics must be schemaVersion 2 and complete`);
  if (metrics.animationId !== manifest.animationId) errors.push(`${label}: metrics animationId mismatch`);
  if (metrics.scenario !== requirement.scenario || metrics.language !== requirement.language || String(metrics.seed) !== String(requirement.seed)) {
    errors.push(`${label}: metrics scenario/language/seed mismatch`);
  }
  if (
    metrics.requirementId !== requirement.requirementId || metrics.frameDomainId !== requirement.frameDomainId || metrics.traceId !== requirement.traceId ||
    metrics.entryStateSha256 !== requirement.entryStateSha256
  ) {
    errors.push(`${label}: metrics requirementId/frameDomainId/traceId/entryStateSha256 do not match the requirement`);
  }
  if (
    metrics.baselineAuthority !== requirement.baselineAuthority || metrics.baselineFrameDomainId !== requirement.frameDomainId ||
    metrics.baselineTraceId !== requirement.traceId || metrics.baselineEntryStateSha256 !== requirement.entryStateSha256
  ) {
    errors.push(`${label}: metrics baseline authority/domain/trace/state pairing mismatch`);
  }
  if (
    metrics.baselineCaptureManifestSha256 !== requirement.baselineCaptureManifestSha256 ||
    metrics.implementationCaptureManifestSha256 !== requirement.captureManifestSha256
  ) {
    errors.push(`${label}: metrics baseline/implementation capture manifest hashes do not match the coverage requirement`);
  }

  const firstFrame = requirement.requiredRange.firstFrame;
  const lastFrame = requirement.requiredRange.lastFrame;
  const requiredCount = lastFrame - firstFrame + 1;
  const frames = Array.isArray(metrics.frames) ? metrics.frames : [];
  if (!Array.isArray(metrics.frames) || frames.length !== requiredCount) errors.push(`${label}: metrics must contain one result per required frame-domain frame`);
  const metricFrames = new Set(frames.map(({ frame }) => Number(frame)));
  if (metricFrames.size !== frames.length) errors.push(`${label}: metrics frames must not contain duplicates`);
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (!metricFrames.has(frame)) errors.push(`${label}: metrics missing frame ${frame}`);
  const baselineFrames = new Map((baselineCapture?.frames || []).map((frame) => [Number(frame.frame), frame]));
  const implementationFrames = new Map((implementationCapture?.captured || []).map((frame) => [Number(frame.frame), frame]));
  for (const metric of frames) {
    if (
      metric.requirementId !== requirement.requirementId || metric.frameDomainId !== requirement.frameDomainId || metric.traceId !== requirement.traceId ||
      metric.entryStateSha256 !== requirement.entryStateSha256
    ) {
      errors.push(`${label}: frame ${metric.frame} metric requirement/domain/trace/state pairing mismatch`);
    }
    const baselineFrame = baselineFrames.get(Number(metric.frame));
    const implementationFrame = implementationFrames.get(Number(metric.frame));
    if (!baselineFrame || metric.baselineSha256 !== baselineFrame.sha256) {
      errors.push(`${label}: frame ${metric.frame} baselineSha256 is not bound to its baseline capture frame`);
    }
    if (!implementationFrame || metric.implementationSha256 !== implementationFrame.sha256) {
      errors.push(`${label}: frame ${metric.frame} implementationSha256 is not bound to its implementation capture frame`);
    }
    const rmse = Number(metric.normalizedRmse);
    const threshold = metric.kind === "transition" ? manifest.fidelity.transitionFrameMaxNormalizedRmse : manifest.fidelity.staticFrameMaxNormalizedRmse;
    const evidenceId = `full-frame:${requirement.frameDomainId}:${requirement.traceId}:${requirement.scenario}:${requirement.language}:${metric.frame}`;
    const excepted = metric.result === "accepted-exception" && hasAcceptedException(manifest, evidenceId);
    if (!(Number.isFinite(rmse) && rmse >= 0 && rmse <= 1)) errors.push(`${label}: frame ${metric.frame} has invalid normalizedRmse`);
    else if (rmse > threshold && !excepted) errors.push(`${label}: frame ${metric.frame} exceeds RMSE ${threshold} without a matching accepted exception`);
    if (metric.result !== "pass" && !excepted) errors.push(`${label}: frame ${metric.frame} result must be pass or a matching accepted exception`);
  }
}

async function validateFullFrameCoverageV2({
  root,
  manifest,
  coverage,
  errors,
  implementationProjectRoot,
}) {
  let currentImplementationArtifactClosure = null;
  try {
    currentImplementationArtifactClosure = await collectImplementationArtifactClosure({
      projectRoot: implementationProjectRoot,
      workspace: root,
      manifest,
    });
  } catch (error) {
    errors.push(`current implementation artifact closure cannot be recomputed: ${error.message}`);
  }
  if (coverage.animationId !== manifest.animationId) errors.push("full-frame coverage animationId must match migration.json");
  const domainsById = frameDomainMap(manifest);
  const requirements = Array.isArray(coverage.requirements) ? coverage.requirements : [];
  if (!Array.isArray(coverage.requirements) || !requirements.length) errors.push("full-frame coverage schemaVersion 2 requires a non-empty requirements array");
  const languages = new Set(manifest.localization.languages || []);
  const scenariosById = new Map((manifest.scenarios || []).map((scenario) => [scenario.id, scenario]));
  const seen = new Set();
  const requirementIds = new Set();
  const coveredDomainScenarioLanguages = new Set();

  try {
    validateRequirementCoverageGroups(
      requirements,
      Object.fromEntries([...domainsById].map(([id, domain]) => [id, domain.frameCount])),
    );
  } catch (error) {
    errors.push(`full-frame coverage requirement identity/group validation failed: ${error.message}`);
  }

  for (const [index, requirement] of requirements.entries()) {
    const label = `full-frame coverage requirement ${index + 1} (${requirement.frameDomainId || "unknown"}/${requirement.traceId || "unknown"}/${requirement.language || "unknown"})`;
    const duplicateKey = `${requirement.frameDomainId}\0${requirement.traceId}\0${requirement.language}`;
    if (seen.has(duplicateKey)) errors.push(`${label}: duplicate frameDomainId/traceId/language requirement`);
    seen.add(duplicateKey);
    if (!requirement.requirementId || typeof requirement.requirementId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(requirement.requirementId)) {
      errors.push(`${label}: requirementId must be a stable non-empty identifier`);
    } else if (requirementIds.has(requirement.requirementId)) {
      errors.push(`${label}: duplicate requirementId ${requirement.requirementId}`);
    } else requirementIds.add(requirement.requirementId);

    const domain = domainsById.get(requirement.frameDomainId);
    if (!domain) errors.push(`${label}: unknown frameDomainId ${requirement.frameDomainId || "empty"}`);
    if (!requirement.traceId || typeof requirement.traceId !== "string") errors.push(`${label}: traceId is required`);
    if (!domain?.scenarioIds?.includes(requirement.scenario)) errors.push(`${label}: scenario ${requirement.scenario || "empty"} is not declared for this frame domain`);
    if (!languages.has(requirement.language)) errors.push(`${label}: unsupported language ${requirement.language || "empty"}`);
    if (requirement.seed === undefined || requirement.seed === null || requirement.seed === "") errors.push(`${label}: seed is required`);

    if (!isPlainObject(requirement.entryState) || !Object.keys(requirement.entryState).length) {
      errors.push(`${label}: entryState must be a non-empty object describing the trace entrance`);
    } else {
      const expectedStateHash = entryStateSha256(requirement.entryState);
      if (requirement.entryStateSha256 !== expectedStateHash) errors.push(`${label}: entryStateSha256 does not match canonical entryState JSON`);
    }
    if (!BASELINE_AUTHORITY_REQUIREMENTS.has(requirement.baselineAuthorityRequirement)) {
      errors.push(`${label}: baselineAuthorityRequirement is invalid`);
    }
    if (domain?.kind === "nested" && requirement.baselineAuthorityRequirement !== "original-runtime-natural-trace") {
      errors.push(`${label}: nested frame domains require an original-runtime-natural-trace baseline`);
    }
    if (scenariosById.get(requirement.scenario)?.kind === "interactive" && requirement.baselineAuthorityRequirement !== "original-runtime-natural-trace") {
      errors.push(`${label}: interactive scenarios require an original-runtime-natural-trace baseline`);
    }

    let classification = null;
    if (domain) {
      try {
        classification = classifyStrictFullDomainRequirement(requirement, domain.frameCount, label);
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (!classification) continue;
    if (!classification.eligible) {
      // Supplemental partial-path evidence is allowed to coexist with strict
      // coverage, but it never occupies a canonical slot or enters any
      // baseline/review/trace/acceptance path.
      try {
        validateSupplementalPartialRequirementBoundary(
          requirement,
          classification.selection,
          label,
        );
      } catch (error) {
        errors.push(error.message);
      }
      for (const [pathKey, shaKey] of [
        ["captureManifest", "captureManifestSha256"],
        ["metricsFile", "metricsSha256"],
      ]) {
        if (!requirement[pathKey] || !requirement[shaKey]) continue;
        const evidencePath = await resolveExistingPath(
          requirement[pathKey],
          [root, implementationProjectRoot, projectRoot, process.cwd()],
        );
        if (!evidencePath) {
          errors.push(`${label}: supplemental ${pathKey} does not exist (${requirement[pathKey]})`);
        } else {
          await verifyChecksum(
            evidencePath,
            requirement[shaKey],
            `${label}: supplemental ${pathKey}`,
            errors,
          );
        }
      }
      continue;
    }
    if (domain.scenarioIds?.includes(requirement.scenario) && languages.has(requirement.language)) {
      coveredDomainScenarioLanguages.add(`${requirement.frameDomainId}\0${requirement.scenario}\0${requirement.language}`);
    }
    const requiredCount = domain.frameCount;
    const strictRequirement = requirement.requiredRange
      ? requirement
      : {...requirement, requiredRange: {firstFrame: 1, lastFrame: domain.frameCount}};

    if (!["complete", "blocked", "pending"].includes(requirement.status)) {
      errors.push(`${label}: status must be complete, blocked, or pending`);
      continue;
    }
    if (requirement.status === "blocked") {
      await validateBlockedRequirement({ requirement: strictRequirement, label, root, errors });
      continue;
    }
    if (requirement.status === "pending") {
      errors.push(`${label}: coverage is pending`);
      continue;
    }
    if (!BASELINE_AUTHORITIES.has(requirement.baselineAuthority)) {
      errors.push(`${label}: baselineAuthority is invalid`);
    } else if (!baselineAuthoritySatisfies(requirement.baselineAuthorityRequirement, requirement.baselineAuthority)) {
      errors.push(`${label}: ${requirement.baselineAuthority} does not satisfy ${requirement.baselineAuthorityRequirement}`);
    }
    if (requirement.capturedFrameCount !== requiredCount || !Array.isArray(requirement.missingFrames) || requirement.missingFrames.length) {
      errors.push(`${label}: capturedFrameCount and missingFrames must prove complete canonical full-domain coverage`);
    }

    const baselinePath = await resolveExistingPath(requirement.baselineCaptureManifest, [root, projectRoot, process.cwd()]);
    let baselineCapture = null;
    if (!baselinePath) {
      errors.push(`${label}: baselineCaptureManifest does not exist (${requirement.baselineCaptureManifest || "empty"})`);
    } else {
      baselineCapture = await validateBaselineCaptureManifest({
        baselinePath,
        requirement: strictRequirement,
        root,
        manifest,
        label,
        errors,
      });
    }

    const capturePath = await resolveExistingPath(requirement.captureManifest, [root, projectRoot, process.cwd()]);
    let implementationCapture = null;
    if (!capturePath) errors.push(`${label}: captureManifest does not exist (${requirement.captureManifest || "empty"})`);
    else implementationCapture = await validateCaptureManifest({
      capturePath,
      expected: strictRequirement,
      root,
      manifest,
      label,
      errors,
      currentImplementationArtifactClosure,
    });

    const metricsPath = await resolveExistingPath(requirement.metricsFile, [root, projectRoot, process.cwd()]);
    if (!metricsPath) errors.push(`${label}: metricsFile does not exist (${requirement.metricsFile || "empty"})`);
    else await validateMetricsV2({
      metricsPath,
      requirement: strictRequirement,
      manifest,
      baselineCapture,
      implementationCapture,
      label,
      errors,
    });
  }

  for (const domain of manifest.implementation.frameDomains || []) {
    for (const scenario of domain.scenarioIds || []) for (const language of manifest.localization.languages || []) {
      const key = `${domain.id}\0${scenario}\0${language}`;
      if (!coveredDomainScenarioLanguages.has(key)) {
        errors.push(`full-frame coverage is missing a trace requirement for ${domain.id}/${scenario}/${language}`);
      }
    }
  }
}

export function validateTraceEvidenceForCoverageV2({ coverage, inspection, errors, manifest = null }) {
  // The indexed trace-execution factory currently covers only the bounded
  // course/shell pilot set. Other coverage-v2 migrations are still validated
  // exhaustively above from their own baseline, capture, and metrics files;
  // do not make an unrelated global pilot index a prerequisite for them.
  if (inspection?.applicable === false) return;
  const requirements = Array.isArray(coverage?.requirements) ? coverage.requirements : [];
  const domains = new Map((manifest?.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
  const complete = requirements.filter((requirement) => {
    if (requirement.status !== "complete") return false;
    if (!manifest) return true;
    const domain = domains.get(requirement.frameDomainId);
    if (!domain) return false;
    try {
      return classifyStrictFullDomainRequirement(
        requirement,
        domain.frameCount,
        `full-frame coverage requirement ${requirement.requirementId || "unknown"} trace evidence`,
      ).eligible;
    } catch (error) {
      errors.push(error.message);
      return false;
    }
  });
  if (!complete.length) return;
  const inspectedByRequirement = new Map((inspection?.requirements || []).map((item) => [item.requirementId, item]));
  const failureByRequirement = new Map((inspection?.failures || [])
    .filter((item) => item.requirementId)
    .map((item) => [item.requirementId, item.message]));
  for (const requirement of complete) {
    const label = `full-frame coverage requirement ${requirement.requirementId || "unknown"} trace evidence`;
    const inspected = inspectedByRequirement.get(requirement.requirementId);
    if (
      inspected?.disposition !== "complete-evidence-verified" ||
      inspected?.traceSpecReadiness !== "ready" ||
      !inspected?.executionReportSha256 ||
      !inspected?.evidence?.originalRuntimeCaptureManifest
    ) {
      const detail = failureByRequirement.get(requirement.requirementId)
        || inspected?.failure
        || (inspection?.failures || []).find((item) => item.requirementId === null)?.message
        || (inspection?.applicable === false
          ? "migration has no current indexed trace specification"
          : `inspection disposition is ${inspected?.disposition || "absent"}`);
      errors.push(`${label}: complete coverage requires a current ready trace spec plus a complete re-hashed execution report bound to the exact coverage baseline; ${detail}`);
    }
  }
}

export async function validateFullFrameCoverage({
  root,
  manifest,
  errors,
  traceEvidenceInspection,
  evidenceProjectRoot,
}) {
  const coveragePath = path.join(root, manifest.evidence.fullFrameCoverageFile);
  let coverage;
  try {
    coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid full-frame coverage JSON: ${error.message}`);
    return;
  }
  const inferredProjectRoot = path.basename(path.dirname(root)) === "migrations"
    ? path.dirname(path.dirname(root))
    : root;
  const implementationProjectRoot = path.resolve(evidenceProjectRoot || inferredProjectRoot);
  const explicitDomains = hasExplicitFrameDomains(manifest);
  if (explicitDomains) validateFrameDomains(manifest, errors);
  if (coverage.schemaVersion === 1 && !explicitDomains) {
    await validateFullFrameCoverageV1({ root, manifest, coverage, errors, implementationProjectRoot });
  } else if (coverage.schemaVersion === 2 && explicitDomains) {
    await validateFullFrameCoverageV2({ root, manifest, coverage, errors, implementationProjectRoot });
    let inspection = traceEvidenceInspection;
    if (!inspection) {
      if (COURSE_TRACE_PILOT_IDS.includes(manifest.animationId)) {
        inspection = await inspectPilotTraceEvidence({
          projectRoot,
          migrationsRoot: path.dirname(root),
          animationId: manifest.animationId,
        });
      } else {
        inspection = {
          applicable: false,
          requirements: [],
          failures: [],
        };
      }
    }
    validateTraceEvidenceForCoverageV2({ coverage, inspection, errors, manifest });
    return { coverage, traceEvidence: inspection };
  } else if (explicitDomains) {
    errors.push("full-frame coverage schemaVersion must be 2 when implementation.frameDomains are declared");
  } else {
    errors.push("full-frame coverage schemaVersion 2 requires implementation.defaultFrameDomainId and implementation.frameDomains; legacy root-only migrations may use schemaVersion 1");
  }
  return { coverage, traceEvidence: null };
}

export async function validateMigration(directory, { allowDraft = false, evidenceProjectRoot = projectRoot } = {}) {
  const root = path.resolve(directory);
  const errors = [];
  const warnings = [];
  let traceEvidence = null;

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
    await validateAdobeAnimateAuthoringAudit({root, manifest, errors, evidenceProjectRoot});
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
    })) if (!(await resolveExistingPath(value, [evidenceProjectRoot, process.cwd(), root]))) errors.push(`${field} does not exist (${value || "empty"})`);
    const registryModule = manifest.implementation?.registryModule;
    if (!/^\.\/modules\/[a-z0-9][a-z0-9-]*$/.test(registryModule || "")) {
      errors.push("implementation.registryModule must be a generated-registry specifier like ./modules/<animation-id>");
    } else {
      const moduleBases = [
        path.join(evidenceProjectRoot, "packages", "demos", "src", registryModule.slice(2)),
        path.join(registrySourceRoot, registryModule.slice(2)),
      ];
      const moduleExists = (await Promise.all(moduleBases.flatMap((moduleBase) => [
        exists(`${moduleBase}.tsx`),
        exists(`${moduleBase}.ts`),
      ]))).some(Boolean);
      if (!moduleExists) {
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
    validateReview(manifest.acceptance?.engineeringReview, "acceptance.engineeringReview", errors);
    validateReview(manifest.acceptance?.humanVisualReview, "acceptance.humanVisualReview", errors);
    validateReview(manifest.acceptance?.ownerReview, "acceptance.ownerReview", errors);
    if (manifest.acceptance?.humanVisualReview?.scope !== "all-keyframe-and-full-frame-diffs") errors.push("acceptance.humanVisualReview.scope must be all-keyframe-and-full-frame-diffs");

    const checklist = await readFile(path.join(root, "ACCEPTANCE_CHECKLIST.md"), "utf8");
    const unchecked = checklist.match(/^- \[ \]/gm) || [];
    if (unchecked.length) errors.push(`${unchecked.length} acceptance checklist item(s) remain unchecked`);
    if (!(checklist.match(/^- \[[xX]\]/gm) || []).length) errors.push("Acceptance checklist has no completed items");

    await validateInventory({ root, manifest, errors });
    errors.push(...await validateStrictAudioEvidence({projectRoot, workspace: root, manifest}));
    await validateKeyframes({ root, manifest, errors });
    if (hasExplicitFrameDomains(manifest)) {
      await validateFrameDomainDisposition({ root, manifest, errors });
      await validateRendererFrameDomainSupport({ root, manifest, errors });
    }
    traceEvidence = (await validateFullFrameCoverage({
      root,
      manifest,
      errors,
      evidenceProjectRoot,
    }))?.traceEvidence || null;
    await validateBoundAcceptanceReviews({
      projectRoot: path.resolve(evidenceProjectRoot),
      workspace: root,
      manifest,
      errors,
    });
  } else {
    warnings.push("Draft mode validates portable schema structure only; it does not resolve paths or prove migration completion");
  }

  return { ok: errors.length === 0, mode: allowDraft ? "draft" : "strict", root, errors, warnings, traceEvidence };
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
