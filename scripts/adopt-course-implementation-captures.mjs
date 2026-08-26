#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, realpath, stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";
import {
  computePhysicalFrameAggregates,
  normalizeRequirementSelection,
  validateRequirementCoverageGroups,
} from "./lib/trace-frame-selection.mjs";
import {writeApprovalTransaction} from "./record-current-javascript-output-approval.mjs";
import {canonicalJson, parseCsv, serializeCsv, sha256Text} from "./sync-pilot-frame-domains.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const captureOrchestrationScriptPath = path.join(path.dirname(scriptPath), "capture-coverage-v2-requirements.mjs");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ISO_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|([+-])(\d{2}):(\d{2}))$/;
const CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION = 3;
const ADOPTION_RELATIVE_PATH = "evidence/current-javascript-implementation-capture-adoption.json";
const ORCHESTRATION_MANIFEST_NAME = "capture-orchestration.json";
const ORCHESTRATION_STATUS = "complete-non-authoritative-implementation-capture-orchestration";
const LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS = Object.freeze([
  "requirementId",
  "scenario",
  "frameDomainId",
  "traceId",
  "language",
  "seed",
  "requiredRange",
  "entryState",
  "entryStateSha256",
  "baselineAuthorityRequirement",
]);
const NON_AUTHORITY_NOTE = "Deterministic current JavaScript implementation capture recorded; no original-runtime baseline, RMSE, audio, human-review, owner-review, or strict-completion claim is added.";
const LEGACY_BLOCKING_REASON = "A deterministic native-stage JavaScript implementation capture now covers every declared frame for this requirement. Original-runtime baseline authority and paired per-frame RMSE metrics remain unresolved; audio, behavior, human, and owner acceptance also remain unresolved where applicable. This implementation capture alone is non-authoritative.";
const SELECTION_BLOCKING_REASON = "A deterministic native-stage JavaScript implementation capture now covers every selected physical frame for this requirement. Original-runtime baseline authority and paired per-frame RMSE metrics remain unresolved; audio, behavior, human, and owner acceptance also remain unresolved where applicable. This implementation capture alone is non-authoritative.";

function usage() {
  return `Usage: node scripts/adopt-course-implementation-captures.mjs [options]

Required:
  --id <animation-id>       Migration animation ID
  --capture-root <path>     Directory containing one schema-v4 manifest per adopted requirement

Options:
  --project-root <path>     Project root (default: repository root)
  --allow-partial           Adopt manifests present under capture-root and
                            revalidate/retain prior schema-v4 adoptions for
                            omitted requirements; other requirements stay blocked
  --invalidate-current-js-approval
                            Explicitly authorize changing evidence currently
                            hash-bound by an accepted schema-v3 current-JS report
  --invalidation-reason <text>
                            Required with --invalidate-current-js-approval
  --invalidated-at <ISO>    Required ISO timestamp with timezone for the
                            explicit invalidation authorization
  --check                   Verify that migration/coverage/keyframes already match
  --json                    Print a JSON summary
  -h, --help                Show this help

This command adopts only deterministic current-JavaScript implementation captures.
It validates every PNG, identity field, native size, exact normalized physical
frame selection, renderer-ready state, and network/console result. It never
changes baseline authority,
coverage status, RMSE, human/owner decisions, or migration completion status.
The invalidation flag does not edit or re-record an approval report and does not
claim renewed approval; it only permits the evidence write that makes the old
artifact binding stale.`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireAnimationId(value, label = "--id") {
  requireString(value, label);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    throw new Error(`${label} must be a path-safe animation ID using only letters, digits, dots, underscores, and hyphens`);
  }
  return value;
}

function requireSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function requireIsoTimestamp(value, label) {
  const match = typeof value === "string" ? ISO_TIMESTAMP_PATTERN.exec(value) : null;
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  const hour = Number(match?.[4]);
  const minute = Number(match?.[5]);
  const second = Number(match?.[6]);
  const offsetHour = match?.[8] === undefined ? 0 : Number(match[8]);
  const offsetMinute = match?.[9] === undefined ? 0 : Number(match[9]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 0;
  if (
    !match
    || month < 1
    || month > 12
    || day < 1
    || day > daysInMonth
    || hour > 23
    || minute > 59
    || second > 59
    || offsetHour > 23
    || offsetMinute > 59
    || !Number.isFinite(Date.parse(value))
  ) {
    throw new Error(`${label} must be a valid ISO timestamp with an explicit timezone`);
  }
  return value;
}

function validateInvalidationOptions(options) {
  const enabled = options.invalidateCurrentJsApproval === true;
  const reason = String(options.invalidationReason || "").trim();
  const invalidatedAt = String(options.invalidatedAt || "").trim();
  if (options.check && (enabled || reason || invalidatedAt)) {
    throw new Error("current-JavaScript approval invalidation options are forbidden with --check");
  }
  if (!enabled && (reason || invalidatedAt)) {
    throw new Error("--invalidation-reason and --invalidated-at require --invalidate-current-js-approval");
  }
  if (enabled) {
    requireString(reason, "--invalidation-reason");
    requireIsoTimestamp(invalidatedAt, "--invalidated-at");
  }
  return {enabled, reason, invalidatedAt};
}

async function readJson(candidate, label) {
  let text;
  try {
    text = await readFile(candidate, "utf8");
    return {value: JSON.parse(text), text, sha256: digest(Buffer.from(text))};
  } catch (error) {
    throw new Error(`${label} is unreadable or invalid JSON (${error.message})`);
  }
}

async function readOptional(candidate, projectRoot, label) {
  try {
    await assertRealProjectPath(projectRoot, candidate, label);
    return {exists: true, text: await readFile(candidate, "utf8")};
  } catch (error) {
    if (error?.code === "ENOENT") return {exists: false, text: ""};
    throw error;
  }
}

async function assertRealProjectPath(projectRoot, candidate, label, expectedKind = "file") {
  const lexical = path.resolve(candidate);
  if (!isInside(lexical, projectRoot)) throw new Error(`${label} escapes the project root`);
  const lexicalInfo = await lstat(lexical);
  if (lexicalInfo.isSymbolicLink()) throw new Error(`${label} must not be a symbolic link`);
  const [actualRoot, actual] = await Promise.all([realpath(projectRoot), realpath(lexical)]);
  if (!isInside(actual, actualRoot)) throw new Error(`${label} resolves outside the project root`);
  const info = await stat(actual);
  if (expectedKind === "file" ? !info.isFile() : !info.isDirectory()) throw new Error(`${label} is not a ${expectedKind}`);
  return lexical;
}

async function findCaptureArtifacts(projectRoot, captureRoot) {
  const root = await assertRealProjectPath(projectRoot, captureRoot, "capture root", "directory");
  const captureManifests = [];
  const orchestrationManifests = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const candidate = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`capture root contains forbidden symbolic link ${portable(path.relative(projectRoot, candidate))}`);
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile() && entry.name === "capture-manifest.json") captureManifests.push(candidate);
      else if (entry.isFile() && entry.name === ORCHESTRATION_MANIFEST_NAME) orchestrationManifests.push(candidate);
    }
  }
  await visit(root);
  if (!captureManifests.length) throw new Error("capture root contains no capture-manifest.json files");
  return {
    root,
    captureManifests: captureManifests.sort(),
    orchestrationManifests: orchestrationManifests.sort(),
  };
}

function expectedTopLevelAttributes() {
  return {
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameAttribute: "data-flash-frame",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    reportedFlashScenarioAttribute: "data-flash-scenario",
    reportedFlashLanguageAttribute: "data-flash-lang",
    reportedFlashSeedAttribute: "data-flash-seed",
    reportedScenarioAttribute: "data-runtime-scenario",
    reportedLanguageAttribute: "data-runtime-language",
    reportedSeedAttribute: "data-runtime-seed",
    flashContextIdentityComplete: true,
    captureStageAttribute: "data-capture-stage",
    reportedRenderStateAttribute: "data-render-state",
    reportedVisualTargetAttribute: "data-render-visual",
    requiredRenderState: "ready",
  };
}

function frameCountsByDomain(manifest) {
  const domains = manifest?.implementation?.frameDomains;
  if (!Array.isArray(domains) || !domains.length) {
    const rootFrameCount = Number(manifest?.runtime?.frameCount);
    if (!Number.isInteger(rootFrameCount) || rootFrameCount < 1) {
      throw new Error("migration.json must declare implementation.frameDomains or a positive runtime.frameCount");
    }
    return {root: rootFrameCount};
  }
  const result = {};
  for (const [index, domain] of domains.entries()) {
    const id = requireString(domain?.id, `migration.implementation.frameDomains[${index}].id`);
    const frameCount = Number(domain?.frameCount);
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id)) {
      throw new Error(`migration.implementation.frameDomains[${index}].id must be a stable identifier`);
    }
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new Error(`migration.implementation.frameDomains[${index}].frameCount must be a positive integer`);
    }
    if (Object.hasOwn(result, id)) throw new Error(`migration.implementation.frameDomains contains duplicate ${id}`);
    result[id] = frameCount;
  }
  if (result.root !== manifest?.runtime?.frameCount) {
    throw new Error("migration root frame-domain count differs from runtime.frameCount");
  }
  return result;
}

function selectionBinding(requirement, selection) {
  return {
    requirementSchemaVersion: selection.requirementSchemaVersion,
    coverageRole: selection.coverageRole,
    coverageGroupId: selection.requirementSchemaVersion === 1
      ? `legacy-singleton:${requirement.requirementId}`
      : selection.coverageGroupId,
    selectionKind: selection.selectionKind,
    selectionSha256: selection.selectionSha256,
    requiredUniverse: selection.requiredUniverse,
    selectedPhysicalFrames: [...selection.selectedPhysicalFrames],
  };
}

function assertIdentity(value, requirement, manifest, label) {
  const expected = {
    animationId: manifest.animationId,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    const observed = field === "seed" ? String(value?.[field]) : value?.[field];
    if (observed !== expectedValue) throw new Error(`${label}.${field} differs from coverage requirement`);
  }
}

async function validateCapture({
  projectRoot,
  capturePath,
  capture,
  captureSha256,
  captureBytes,
  requirement,
  manifest,
  currentImplementationArtifactClosure,
  selection,
}) {
  const label = portable(path.relative(projectRoot, capturePath));
  if (capture.schemaVersion !== IMPLEMENTATION_CAPTURE_SCHEMA_VERSION || capture.status !== "complete") {
    const legacy = capture.schemaVersion === 3
      ? "schemaVersion 3 captures are prereview-only because they do not bind the capture-time implementation artifact closure"
      : `expected schemaVersion ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION} complete`;
    throw new Error(`${label} is not eligible for adoption: ${legacy}`);
  }
  if (!isUnambiguousLoopbackHttpUrl(capture.sourceUrl)) {
    throw new Error(`${label}.sourceUrl must be an unambiguous credential-free loopback http URL`);
  }
  const generatorErrors = implementationCaptureGeneratorProvenanceErrors(capture.generatorProvenance);
  if (generatorErrors.length) {
    throw new Error(`${label} capture generator provenance is invalid:\n${generatorErrors.join("\n")}`);
  }
  const closureErrors = implementationArtifactClosureErrors(
    capture.implementationArtifactClosure,
    currentImplementationArtifactClosure,
  );
  if (closureErrors.length) {
    throw new Error(`${label} implementation artifact closure is missing or stale:\n${closureErrors.join("\n")}`);
  }
  assertIdentity(capture, requirement, manifest, label);
  if (capture.requestedFrameDomain !== requirement.frameDomainId) throw new Error(`${label}.requestedFrameDomain differs from coverage requirement`);
  for (const [field, expected] of Object.entries(expectedTopLevelAttributes())) {
    if (capture[field] !== expected) throw new Error(`${label}.${field} must be ${expected}`);
  }
  if (capture.viewport?.width !== manifest.runtime.stage.width || capture.viewport?.height !== manifest.runtime.stage.height || capture.viewport?.deviceScaleFactor !== 1) {
    throw new Error(`${label} viewport must equal the native stage at deviceScaleFactor 1`);
  }
  if (capture.error) throw new Error(`${label} reports capture error: ${capture.error}`);
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    if (!Array.isArray(capture[field]) || capture[field].length) throw new Error(`${label}.${field} must be an empty array`);
  }
  const expectedFrames = selection.selectedPhysicalFrames;
  const expectedCount = expectedFrames.length;
  if (!Array.isArray(capture.captured) || capture.captured.length !== expectedCount) {
    throw new Error(`${label} contains ${capture.captured?.length ?? 0} frame rows; expected ${expectedCount}`);
  }
  const frameFiles = new Map();
  const frameArchiveRows = [];
  for (let index = 0; index < capture.captured.length; index += 1) {
    const item = capture.captured[index];
    const frame = expectedFrames[index];
    if (item.frame !== frame || item.reportedFrame !== frame) {
      throw new Error(`${label} frame row ${index + 1} does not match the exact normalized physical selection`);
    }
    assertIdentity(item, requirement, manifest, `${label}.captured[${index}]`);
    if (item.flashContextIdentityComplete !== true) {
      throw new Error(`${label} frame ${frame} lacks complete data-flash context identity`);
    }
    if (item.reportedFrameDomainId !== requirement.frameDomainId || item.reportedRenderState !== "ready") {
      throw new Error(`${label} frame ${frame} does not report the exact ready frame domain`);
    }
    const expectedRootFrame = requirement.frameDomainId === "root" ? frame : Number(requirement.entryState?.rootEntryFrame);
    if (item.rootFrame !== expectedRootFrame) throw new Error(`${label} frame ${frame} reports rootFrame ${item.rootFrame}; expected ${expectedRootFrame}`);
    const visual = item.visualTarget;
    assertIdentity(visual, requirement, manifest, `${label}.captured[${index}].visualTarget`);
    if (!visual || !String(visual.tagName || "").trim() || visual.reportedRenderState !== "ready" || visual.flashContextIdentityComplete !== true || visual.reportedFrame !== frame || visual.rootFrame !== expectedRootFrame) {
      throw new Error(`${label} frame ${frame} does not bind an exact ready visual target`);
    }
    requireString(item.file, `${label} frame ${frame} file`);
    requireSha256(item.sha256, `${label} frame ${frame} sha256`);
    const imagePath = await assertRealProjectPath(projectRoot, path.resolve(path.dirname(capturePath), item.file), `${label} frame ${frame}`);
    const imageBytes = await readFile(imagePath);
    if (digest(imageBytes) !== item.sha256) throw new Error(`${label} frame ${frame} PNG SHA-256 differs`);
    let png;
    try {
      png = PNG.sync.read(imageBytes);
    } catch (error) {
      throw new Error(`${label} frame ${frame} PNG is undecodable (${error.message})`);
    }
    if (png.width !== manifest.runtime.stage.width || png.height !== manifest.runtime.stage.height || item.width !== png.width || item.height !== png.height) {
      throw new Error(`${label} frame ${frame} PNG dimensions differ from the native stage`);
    }
    const image = {path: portable(path.relative(projectRoot, imagePath)), sha256: item.sha256};
    frameFiles.set(frame, image);
    frameArchiveRows.push({...image, bytes: imageBytes.length});
  }
  const canonicalArchiveRows = [...frameArchiveRows].sort((left, right) => left.path.localeCompare(right.path));
  return {
    capturePath: portable(path.relative(projectRoot, capturePath)),
    captureSha256,
    captureBytes,
    frameCount: expectedCount,
    frameFiles,
    frameArchive: {
      fileCount: canonicalArchiveRows.length,
      totalBytes: canonicalArchiveRows.reduce((sum, row) => sum + row.bytes, 0),
      aggregateSha256: digest(Buffer.from(canonicalJson(canonicalArchiveRows))),
    },
    selection: selectionBinding(requirement, selection),
  };
}

function assertCanonicalEqual(observed, expected, label) {
  if (canonicalJson(observed) !== canonicalJson(expected)) {
    throw new Error(`${label} differs from the normalized requirement selection`);
  }
}

function parseExistingAdoption(adoptionRecord, animationId, allowPartial) {
  if (!adoptionRecord.exists) return null;
  let adoption;
  try {
    adoption = JSON.parse(adoptionRecord.text);
  } catch (error) {
    if (!allowPartial) return null;
    throw new Error(`existing implementation capture adoption is invalid JSON (${error.message})`);
  }
  if (!allowPartial) return adoption;
  if (
    adoption?.evidenceType !== "current-javascript-implementation-capture-adoption"
    || adoption.animationId !== animationId
    || !Array.isArray(adoption.requirements)
  ) {
    throw new Error("existing implementation capture adoption is malformed and cannot be retained safely");
  }
  return adoption;
}

function requireRetainedCaptureReferencePath(value, label) {
  const reference = requireString(value, `${label}.path`);
  if (path.isAbsolute(reference)) throw new Error(`${label}.path must be project-relative`);
  return portable(reference);
}

function collectRetainedCaptureReferences({
  manifest,
  coverage,
  existingAdoption,
  newRequirementIds,
  requirementById,
}) {
  const references = new Map();
  const addReference = ({requirementId, capturePath, captureSha256, source, orchestration}) => {
    if (newRequirementIds.has(requirementId)) return;
    if (!requirementById.has(requirementId)) {
      throw new Error(`${source} references undeclared requirement ${requirementId}`);
    }
    const normalizedPath = requireRetainedCaptureReferencePath(capturePath, `${source}.captureManifest`);
    const normalizedSha256 = requireSha256(captureSha256, `${source}.captureManifest.sha256`);
    const existing = references.get(requirementId);
    if (existing && (existing.capturePath !== normalizedPath || existing.captureSha256 !== normalizedSha256)) {
      throw new Error(
        `retained capture references disagree for ${requirementId}: ${existing.capturePath} / ${existing.captureSha256} versus ${normalizedPath} / ${normalizedSha256}`,
      );
    }
    const reference = existing || {
      requirementId,
      capturePath: normalizedPath,
      captureSha256: normalizedSha256,
      sources: [],
      orchestrationReferences: [],
    };
    reference.sources.push(source);
    if (orchestration !== undefined) {
      const orchestrationPath = requireRetainedCaptureReferencePath(orchestration?.path, `${source}.orchestration`);
      const orchestrationSha256 = requireSha256(orchestration?.sha256, `${source}.orchestration.sha256`);
      const observed = reference.orchestrationReferences.find(({path: candidate}) => candidate === orchestrationPath);
      if (observed && observed.sha256 !== orchestrationSha256) {
        throw new Error(`retained orchestration references disagree for ${requirementId}: ${orchestrationPath}`);
      }
      if (!observed) reference.orchestrationReferences.push({path: orchestrationPath, sha256: orchestrationSha256});
    }
    references.set(requirementId, reference);
  };

  for (const requirement of coverage.requirements) {
    if (newRequirementIds.has(requirement.requirementId)) continue;
    const hasPath = typeof requirement.captureManifest === "string" && requirement.captureManifest.trim() !== "";
    const hasSha256 = typeof requirement.captureManifestSha256 === "string" && requirement.captureManifestSha256.trim() !== "";
    if (hasPath !== hasSha256) {
      throw new Error(`coverage retained capture reference is incomplete for ${requirement.requirementId}`);
    }
    if (hasPath) {
      addReference({
        requirementId: requirement.requirementId,
        capturePath: requirement.captureManifest,
        captureSha256: requirement.captureManifestSha256,
        source: `coverage requirement ${requirement.requirementId}`,
      });
    }
  }

  const adoptionRequirements = existingAdoption?.requirements || [];
  const observedAdoptionIds = new Set();
  for (const [index, requirement] of adoptionRequirements.entries()) {
    const requirementId = requireString(
      requirement?.requirementId,
      `existing adoption requirements[${index}].requirementId`,
    );
    if (observedAdoptionIds.has(requirementId)) {
      throw new Error(`existing adoption contains duplicate requirement ${requirementId}`);
    }
    observedAdoptionIds.add(requirementId);
    if (newRequirementIds.has(requirementId)) continue;
    addReference({
      requirementId,
      capturePath: requirement.captureManifest?.path,
      captureSha256: requirement.captureManifest?.sha256,
      source: `existing adoption requirement ${requirementId}`,
      orchestration: requirement.orchestration,
    });
  }

  const candidates = Array.isArray(manifest.evidence?.candidateCaptureManifests)
    ? manifest.evidence.candidateCaptureManifests
    : [];
  for (const candidate of candidates) {
    const reference = references.get(candidate?.requirementId);
    if (
      !reference
      || candidate.path !== reference.capturePath
      || candidate.sha256 !== reference.captureSha256
      || candidate.orchestration === undefined
    ) continue;
    addReference({
      requirementId: candidate.requirementId,
      capturePath: candidate.path,
      captureSha256: candidate.sha256,
      source: `migration candidate capture ${candidate.requirementId}`,
      orchestration: candidate.orchestration,
    });
  }
  return references;
}

async function validateRetainedCaptures({
  projectRoot,
  references,
  requirementById,
  selectionsByRequirement,
  manifest,
  currentImplementationArtifactClosure,
}) {
  const captures = new Map();
  for (const [requirementId, reference] of references) {
    let capturePath;
    let record;
    try {
      capturePath = await assertRealProjectPath(
        projectRoot,
        path.resolve(projectRoot, reference.capturePath),
        `retained capture manifest ${requirementId}`,
      );
      record = await readJson(capturePath, `retained capture manifest ${requirementId}`);
    } catch (error) {
      throw new Error(`retained capture ${requirementId} is missing or unreadable (${error.message})`);
    }
    if (record.sha256 !== reference.captureSha256) {
      throw new Error(`retained capture ${requirementId} SHA-256 differs from its recorded reference`);
    }
    const capture = await validateCapture({
      projectRoot,
      capturePath,
      capture: record.value,
      captureSha256: record.sha256,
      captureBytes: Buffer.byteLength(record.text),
      requirement: requirementById.get(requirementId),
      manifest,
      currentImplementationArtifactClosure,
      selection: selectionsByRequirement.get(requirementId),
    });
    let orchestrationRoot = path.dirname(path.dirname(capturePath));
    if (reference.orchestrationReferences.length) {
      const roots = new Set();
      for (const orchestration of reference.orchestrationReferences) {
        let orchestrationPath;
        try {
          orchestrationPath = await assertRealProjectPath(
            projectRoot,
            path.resolve(projectRoot, orchestration.path),
            `retained orchestration ${requirementId}`,
          );
        } catch (error) {
          throw new Error(`retained orchestration ${requirementId} is missing or unreadable (${error.message})`);
        }
        const orchestrationBytes = await readFile(orchestrationPath);
        if (digest(orchestrationBytes) !== orchestration.sha256) {
          throw new Error(`retained orchestration ${requirementId} SHA-256 differs from its recorded reference`);
        }
        roots.add(path.dirname(orchestrationPath));
      }
      if (roots.size !== 1) throw new Error(`retained orchestration paths disagree for ${requirementId}`);
      orchestrationRoot = [...roots][0];
    }
    if (!isInside(capturePath, orchestrationRoot)) {
      throw new Error(`retained capture ${requirementId} is outside its recorded orchestration root`);
    }
    captures.set(requirementId, {
      ...capture,
      orchestrationRoot,
      expectedOrchestrationReferences: reference.orchestrationReferences,
      retained: true,
    });
  }
  return captures;
}

async function validateSchemaV2Orchestration({
  projectRoot,
  captureRoot,
  orchestrationPaths,
  capturesByRequirement,
  requirementById,
  manifest,
  coverage,
  coverageDescriptor,
  migrationDescriptor,
  captureOrchestrationScriptSha256,
}) {
  const schemaV2RequirementIds = [...capturesByRequirement]
    .filter(([, capture]) => capture.selection.requirementSchemaVersion === 2)
    .map(([requirementId]) => requirementId);
  if (!schemaV2RequirementIds.length) return null;
  if (orchestrationPaths.length !== 1) {
    throw new Error(
      `schema-v2 requirement adoption requires exactly one complete ${ORCHESTRATION_MANIFEST_NAME} at the capture root; found ${orchestrationPaths.length}`,
    );
  }
  const expectedPath = path.join(captureRoot, ORCHESTRATION_MANIFEST_NAME);
  if (path.resolve(orchestrationPaths[0]) !== path.resolve(expectedPath)) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} must be located directly at the capture root`);
  }
  const record = await readJson(expectedPath, ORCHESTRATION_MANIFEST_NAME);
  const orchestration = record.value;
  if (
    orchestration.schemaVersion !== 2
    || orchestration.evidenceType !== "coverage-v2-current-javascript-capture-orchestration"
    || orchestration.status !== ORCHESTRATION_STATUS
    || orchestration.animationId !== coverage.animationId
  ) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} is not a complete matching current-JavaScript orchestration`);
  }
  const authority = orchestration.authority;
  if (
    authority?.currentJavascriptImplementationCaptureOnly !== true
    || authority.originalRuntimeBaseline !== false
    || authority.visualOrBehavioralParity !== false
    || authority.rmseAcceptance !== false
    || authority.audioAcceptance !== false
    || authority.humanVisualReview !== false
    || authority.ownerAcceptance !== false
    || authority.migrationCompletion !== false
  ) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} has an invalid authority boundary`);
  }
  for (const [label, observed, current] of [
    ["coverage", orchestration.inputs?.coverage, coverageDescriptor],
    ["migration", orchestration.inputs?.migration, migrationDescriptor],
  ]) {
    if (
      observed?.path !== current.path
      || !Number.isInteger(observed?.bytes)
      || observed.bytes < 1
      || !SHA256_PATTERN.test(observed?.sha256 || "")
    ) {
      throw new Error(`${ORCHESTRATION_MANIFEST_NAME}.inputs.${label} is missing or malformed`);
    }
  }
  assertCanonicalEqual(orchestration.inputs?.migrationTechnicalContract, {
    hashMode: "canonical-json-v1",
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
  }, `${ORCHESTRATION_MANIFEST_NAME}.inputs.migrationTechnicalContract`);
  assertCanonicalEqual(orchestration.inputs?.traceCoverageIdentity, {
    hashMode: "canonical-json-v1",
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: traceCoverageSha256(coverage),
  }, `${ORCHESTRATION_MANIFEST_NAME}.inputs.traceCoverageIdentity`);
  if (
    orchestration.generatorProvenance?.schemaVersion !== 1
    || orchestration.generatorProvenance?.script?.path !== "scripts/capture-coverage-v2-requirements.mjs"
    || orchestration.generatorProvenance?.script?.sha256 !== captureOrchestrationScriptSha256
  ) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} generator provenance is missing or stale`);
  }

  const requirementIds = coverage.requirements
    .map(({requirementId}) => requirementId)
    .filter((requirementId) => capturesByRequirement.has(requirementId));
  const expectedSelectionRows = requirementIds.map((requirementId) => {
    const requirement = requirementById.get(requirementId);
    const capture = capturesByRequirement.get(requirementId);
    return {
      requirementId,
      frameDomainId: requirement.frameDomainId,
      scenario: requirement.scenario,
      language: requirement.language,
      seed: String(requirement.seed),
      entryStateSha256: requirement.entryStateSha256,
      ...capture.selection,
    };
  });
  const totalFrameCount = [...capturesByRequirement.values()]
    .reduce((sum, capture) => sum + capture.frameCount, 0);
  if (
    orchestration.selection?.schemaVersion !== 2
    || orchestration.selection?.contract !== "normalized-requirement-physical-frame-selection-v1"
    || orchestration.selection?.selectedRequirementCount !== requirementIds.length
    || orchestration.selection?.availableRequirementCount !== coverage.requirements.length
    || orchestration.selection?.selectedAllRequirements !== (requirementIds.length === coverage.requirements.length)
    || orchestration.selection?.totalFrameCount !== totalFrameCount
  ) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME}.selection summary is missing or stale`);
  }
  assertCanonicalEqual(
    orchestration.selection.requirementIds,
    requirementIds,
    `${ORCHESTRATION_MANIFEST_NAME}.selection.requirementIds`,
  );
  assertCanonicalEqual(
    orchestration.selection.requirements,
    expectedSelectionRows,
    `${ORCHESTRATION_MANIFEST_NAME}.selection.requirements`,
  );
  if (!Array.isArray(orchestration.outputs) || orchestration.outputs.length !== requirementIds.length) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} has missing or extra requirement outputs`);
  }
  const outputsByRequirement = new Map();
  for (const output of orchestration.outputs) {
    const requirementId = requireString(output?.requirementId, `${ORCHESTRATION_MANIFEST_NAME}.outputs[].requirementId`);
    if (outputsByRequirement.has(requirementId)) {
      throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} contains duplicate output ${requirementId}`);
    }
    outputsByRequirement.set(requirementId, output);
  }
  for (const requirementId of requirementIds) {
    const output = outputsByRequirement.get(requirementId);
    if (!output) throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} omits output ${requirementId}`);
    const requirement = requirementById.get(requirementId);
    const capture = capturesByRequirement.get(requirementId);
    const expectedIdentity = {
      language: requirement.language,
      scenario: requirement.scenario,
      seed: String(requirement.seed),
      traceId: requirement.traceId,
      entryStateSha256: requirement.entryStateSha256,
      frameDomainId: requirement.frameDomainId,
      frameCount: capture.frameCount,
      domainFrameCount: capture.selection.requiredUniverse.lastFrame,
      ...capture.selection,
    };
    for (const [field, expected] of Object.entries(expectedIdentity)) {
      assertCanonicalEqual(output[field], expected, `${ORCHESTRATION_MANIFEST_NAME}.outputs[${requirementId}].${field}`);
    }
    const expectedCaptureManifest = {
      path: capture.capturePath,
      bytes: capture.captureBytes,
      sha256: capture.captureSha256,
    };
    assertCanonicalEqual(
      output.captureManifest,
      expectedCaptureManifest,
      `${ORCHESTRATION_MANIFEST_NAME}.outputs[${requirementId}].captureManifest`,
    );
    assertCanonicalEqual(
      output.frameArchive,
      capture.frameArchive,
      `${ORCHESTRATION_MANIFEST_NAME}.outputs[${requirementId}].frameArchive`,
    );
    const expectedDirectory = portable(path.dirname(capture.capturePath));
    if (output.directory !== expectedDirectory) {
      throw new Error(`${ORCHESTRATION_MANIFEST_NAME}.outputs[${requirementId}].directory is stale`);
    }
  }
  const extraOutputIds = [...outputsByRequirement.keys()].filter((requirementId) => !capturesByRequirement.has(requirementId));
  if (extraOutputIds.length) {
    throw new Error(`schema-v2 ${ORCHESTRATION_MANIFEST_NAME} contains extra outputs: ${extraOutputIds.join(", ")}`);
  }
  return {
    path: portable(path.relative(projectRoot, expectedPath)),
    bytes: Buffer.byteLength(record.text),
    sha256: record.sha256,
    schemaVersion: orchestration.schemaVersion,
    selectionContract: orchestration.selection.contract,
  };
}

async function validateCumulativeSchemaV2Orchestrations({
  projectRoot,
  capturesByRequirement,
  requirementById,
  manifest,
  coverage,
  coverageDescriptor,
  migrationDescriptor,
  captureOrchestrationScriptSha256,
}) {
  const groups = new Map();
  for (const [requirementId, capture] of capturesByRequirement) {
    const root = capture.orchestrationRoot;
    if (!root) throw new Error(`capture ${requirementId} has no orchestration-root identity`);
    if (!groups.has(root)) groups.set(root, new Map());
    groups.get(root).set(requirementId, capture);
  }
  const byRequirement = new Map();
  const uniqueBindings = new Map();
  for (const [captureRoot, groupCaptures] of groups) {
    const schemaV2RequirementIds = [...groupCaptures]
      .filter(([, capture]) => capture.selection.requirementSchemaVersion === 2)
      .map(([requirementId]) => requirementId);
    if (!schemaV2RequirementIds.length) continue;
    const artifacts = await findCaptureArtifacts(projectRoot, captureRoot);
    const binding = await validateSchemaV2Orchestration({
      projectRoot,
      captureRoot: artifacts.root,
      orchestrationPaths: artifacts.orchestrationManifests,
      capturesByRequirement: groupCaptures,
      requirementById,
      manifest,
      coverage,
      coverageDescriptor,
      migrationDescriptor,
      captureOrchestrationScriptSha256,
    });
    for (const requirementId of schemaV2RequirementIds) {
      const capture = groupCaptures.get(requirementId);
      for (const expected of capture.expectedOrchestrationReferences || []) {
        if (binding.path !== expected.path || binding.sha256 !== expected.sha256) {
          throw new Error(`validated orchestration differs from the retained reference for ${requirementId}`);
        }
      }
      byRequirement.set(requirementId, binding);
    }
    const existing = uniqueBindings.get(binding.path);
    if (existing && existing.sha256 !== binding.sha256) {
      throw new Error(`orchestration binding changed during cumulative validation: ${binding.path}`);
    }
    uniqueBindings.set(binding.path, binding);
  }
  return {
    byRequirement,
    bindings: [...uniqueBindings.values()].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function appendNote(existing, note) {
  const value = String(existing || "").trim();
  return value.includes(note) ? value : [value, note].filter(Boolean).join(" ");
}

async function inspectAcceptedApprovalBinding({projectRoot, manifest, files}) {
  const approval = manifest.acceptance?.currentJavaScriptOutputApproval;
  if (approval?.decision !== "accepted") {
    return {
      acceptedSchemaV3Report: false,
      reportPath: "",
      reportSha256: "",
      artifactBindingSha256: "",
      changedBoundArtifacts: [],
    };
  }

  const reportReference = requireString(approval.approvalRecord, "accepted current-JavaScript approval.approvalRecord");
  if (path.isAbsolute(reportReference)) {
    throw new Error("accepted current-JavaScript approval.approvalRecord must be project-relative");
  }
  requireSha256(approval.approvalRecordSha256, "accepted current-JavaScript approval.approvalRecordSha256");
  requireSha256(approval.artifactBindingSha256, "accepted current-JavaScript approval.artifactBindingSha256");
  const reportPath = await assertRealProjectPath(
    projectRoot,
    path.resolve(projectRoot, reportReference),
    "accepted current-JavaScript approval report",
  );
  const reportRecord = await readJson(reportPath, "accepted current-JavaScript approval report");
  if (reportRecord.sha256 !== approval.approvalRecordSha256) {
    throw new Error("accepted current-JavaScript approval report SHA-256 differs from migration.json");
  }
  const report = reportRecord.value;
  if (
    report.schemaVersion !== CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION
    || report.evidenceType !== "human-current-javascript-output-approval"
    || report.decision !== "accepted"
  ) {
    throw new Error("accepted current-JavaScript approval report must be schema-v3 human-current-javascript-output-approval with decision accepted");
  }
  const matches = Array.isArray(report.animations)
    ? report.animations.filter(({animationId}) => animationId === manifest.animationId)
    : [];
  if (matches.length !== 1) {
    throw new Error(`${manifest.animationId} must have exactly one record in the accepted current-JavaScript approval report`);
  }
  const recorded = matches[0];
  if (recorded.artifactBindingSha256 !== approval.artifactBindingSha256) {
    throw new Error(`${manifest.animationId} accepted current-JavaScript artifact binding differs between migration.json and the approval report`);
  }
  if (!Array.isArray(recorded.artifacts)) {
    throw new Error(`${manifest.animationId} accepted current-JavaScript approval report has no artifact inventory`);
  }
  const artifactsByPath = new Map();
  for (const artifact of recorded.artifacts) {
    const artifactPath = requireString(artifact?.path, `${manifest.animationId} accepted approval artifact.path`);
    if (path.isAbsolute(artifactPath)) {
      throw new Error(`${manifest.animationId} accepted approval artifact path must be project-relative: ${artifactPath}`);
    }
    requireSha256(artifact.sha256, `${manifest.animationId} accepted approval artifact ${artifactPath} sha256`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes < 0) {
      throw new Error(`${manifest.animationId} accepted approval artifact ${artifactPath} bytes must be a non-negative integer`);
    }
    if (artifactsByPath.has(artifactPath)) {
      throw new Error(`${manifest.animationId} accepted current-JavaScript approval report contains duplicate artifact ${artifactPath}`);
    }
    artifactsByPath.set(artifactPath, artifact);
  }

  const changedBoundArtifacts = [];
  for (const file of files) {
    if (file.observed === file.expected) continue;
    const relativePath = portable(path.relative(projectRoot, file.path));
    const recordedArtifact = artifactsByPath.get(relativePath);
    if (!recordedArtifact) continue;
    const proposedBytes = Buffer.byteLength(file.expected);
    const proposedSha256 = digest(Buffer.from(file.expected));
    if (proposedBytes === recordedArtifact.bytes && proposedSha256 === recordedArtifact.sha256) continue;
    changedBoundArtifacts.push({
      path: relativePath,
      approvedBytes: recordedArtifact.bytes,
      approvedSha256: recordedArtifact.sha256,
      currentBytes: Buffer.byteLength(file.observed),
      currentSha256: digest(Buffer.from(file.observed)),
      proposedBytes,
      proposedSha256,
    });
  }

  return {
    acceptedSchemaV3Report: true,
    reportPath: portable(path.relative(projectRoot, reportPath)),
    reportSha256: reportRecord.sha256,
    artifactBindingSha256: recorded.artifactBindingSha256,
    changedBoundArtifacts,
  };
}

function approvalInvalidationRequiredMessage(animationId, binding) {
  const rows = binding.changedBoundArtifacts
    .map(({path: artifactPath, approvedSha256, proposedSha256}) => `- ${artifactPath}: approved ${approvedSha256}; proposed ${proposedSha256}`)
    .join("\n");
  return `${animationId} write would change ${binding.changedBoundArtifacts.length} artifact(s) currently hash-bound by accepted schema-v3 current-JavaScript approval ${binding.reportPath}:\n${rows}\nRefusing before any writes. Re-run only with --invalidate-current-js-approval, a non-empty --invalidation-reason, and --invalidated-at <ISO timestamp>. That authorization makes the old artifact binding stale; it does not edit or renew the approval report.`;
}

function deriveOutputs({
  manifest,
  coverage,
  keyframesText,
  capturesByRequirement,
  frameCounts,
  orchestrationBindings,
  orchestrationByRequirement,
  existingAdoption,
  scriptSha256,
}) {
  const hasSchemaV2Selection = [...capturesByRequirement.values()]
    .some(({selection}) => selection.requirementSchemaVersion === 2);
  const updatedCoverage = structuredClone(coverage);
  for (const requirement of updatedCoverage.requirements) {
    const capture = capturesByRequirement.get(requirement.requirementId);
    if (!capture) continue;
    requirement.capturedFrameCount = capture.frameCount;
    requirement.missingFrames = [];
    requirement.captureManifest = capture.capturePath;
    requirement.captureManifestSha256 = capture.captureSha256;
    if (requirement.status !== "complete") {
      requirement.blockingReason = capture.selection.requirementSchemaVersion === 2
        ? SELECTION_BLOCKING_REASON
        : LEGACY_BLOCKING_REASON;
    }
    const otherEvidence = Array.isArray(requirement.blockingEvidence)
      ? requirement.blockingEvidence.filter(({file}) => file !== capture.capturePath && !String(file || "").startsWith(`output/playwright/${manifest.animationId}/implementation/`))
      : [];
    requirement.blockingEvidence = [...otherEvidence, {file: capture.capturePath, sha256: capture.captureSha256}];
  }

  const parsed = parseCsv(keyframesText);
  const requiredHeaders = ["requirement_id", "frame", "implementation_file", "implementation_sha256", "notes"];
  for (const header of requiredHeaders) if (!parsed.headers.includes(header)) throw new Error(`keyframes.csv lacks ${header}`);
  const rows = parsed.rows.map((row, index) => {
    const capture = capturesByRequirement.get(row.requirement_id);
    if (!capture) return row;
    const frame = Number(row.frame);
    const image = capture.frameFiles.get(frame);
    if (!image) throw new Error(`keyframes.csv row ${index + 2} frame ${row.frame} is absent from its capture`);
    return {
      ...row,
      implementation_file: image.path,
      implementation_sha256: image.sha256,
      notes: appendNote(row.notes, NON_AUTHORITY_NOTE),
    };
  });

  const updatedManifest = structuredClone(manifest);
  updatedManifest.evidence = updatedManifest.evidence || {};
  const retainedCaptureManifests = Array.isArray(updatedManifest.evidence.candidateCaptureManifests)
    ? updatedManifest.evidence.candidateCaptureManifests.filter(
        ({requirementId}) => !capturesByRequirement.has(requirementId),
      )
    : [];
  const adoptedCaptureManifests = [...capturesByRequirement.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([requirementId, capture]) => {
      const requirement = updatedCoverage.requirements.find((item) => item.requirementId === requirementId);
      return {
        requirementId,
        frameDomainId: requirement.frameDomainId,
        traceId: requirement.traceId,
        entryStateSha256: requirement.entryStateSha256,
        scenario: requirement.scenario,
        language: requirement.language,
        seed: String(requirement.seed),
        ...(capture.selection.requirementSchemaVersion === 2 ? {
          ...capture.selection,
          orchestration: {
            path: orchestrationByRequirement.get(requirementId).path,
            sha256: orchestrationByRequirement.get(requirementId).sha256,
          },
        } : {}),
        path: capture.capturePath,
        sha256: capture.captureSha256,
        frames: capture.frameCount,
        authority: "non-authoritative-current-javascript-output",
        strictAcceptanceEffect: capture.selection.requirementSchemaVersion === 2
          ? "none"
          : "implementation-capture-only",
      };
    });
  updatedManifest.evidence.candidateCaptureManifests = [
    ...retainedCaptureManifests,
    ...adoptedCaptureManifests,
  ].sort((left, right) => String(left.requirementId).localeCompare(String(right.requirementId)));
  const fullFrameException = (updatedManifest.acceptance?.knownExceptions || [])
    .find(({id}) => id === "full-frame-and-human-review-pending");
  if (fullFrameException && !hasSchemaV2Selection) {
    const totalFrames = [...capturesByRequirement.values()].reduce((sum, capture) => sum + capture.frameCount, 0);
    const capturedRequirementCount = capturesByRequirement.size;
    const declaredRequirementCount = updatedCoverage.requirements.length;
    const coverageScope = capturedRequirementCount === declaredRequirementCount
      ? "every declared requirement"
      : `${capturedRequirementCount} of ${declaredRequirementCount} declared requirements`;
    fullFrameException.reason = `${totalFrames} deterministic native-stage JavaScript frame captures now cover ${coverageScope}. They are non-authoritative implementation evidence only; omitted requirements, original-runtime baselines, paired RMSE/diffs, audio/behavior authority, renewed human review, engineering acceptance, and owner acceptance remain pending.`;
  }
  const declaredRequirementCount = updatedCoverage.requirements.length;
  const missingRequirementCount = declaredRequirementCount - capturesByRequirement.size;
  const missingRequirementIds = updatedCoverage.requirements
    .filter(({requirementId}) => !capturesByRequirement.has(requirementId))
    .map(({requirementId}) => requirementId)
    .sort();
  const missingFrameCount = updatedCoverage.requirements
    .filter(({requirementId}) => !capturesByRequirement.has(requirementId))
    .reduce((sum, requirement) => {
      if (Array.isArray(requirement.missingFrames)) return sum + requirement.missingFrames.length;
      const frameCount = frameCounts[requirement.frameDomainId];
      return sum + normalizeRequirementSelection(requirement, frameCount).selectedPhysicalFrames.length;
    }, 0);
  const aggregateRequirements = [...capturesByRequirement.keys()].map((requirementId) => {
    const requirement = structuredClone(
      updatedCoverage.requirements.find((item) => item.requirementId === requirementId),
    );
    requirement.evidenceValid = true;
    requirement.status = "complete";
    return requirement;
  });
  const currentJavascriptPhysicalFrameAggregate = hasSchemaV2Selection
    ? {
        schemaVersion: 1,
        authority: "validated-current-javascript-physical-frames-only",
        strictAcceptanceEffect: "none",
        ...(orchestrationBindings.length === 1 ? {
          orchestration: {
            path: orchestrationBindings[0].path,
            sha256: orchestrationBindings[0].sha256,
            selectionContract: orchestrationBindings[0].selectionContract,
          },
        } : {
          orchestrations: orchestrationBindings.map((binding) => ({
            path: binding.path,
            sha256: binding.sha256,
            selectionContract: binding.selectionContract,
          })),
        }),
        groups: computePhysicalFrameAggregates(aggregateRequirements, frameCounts),
      }
    : null;
  const adoption = {
    schemaVersion: hasSchemaV2Selection ? 2 : 1,
    evidenceType: "current-javascript-implementation-capture-adoption",
    animationId: manifest.animationId,
    status: missingRequirementCount === 0
      ? "complete-non-authoritative-implementation-capture"
      : "partial-non-authoritative-implementation-capture",
    authority: "Deterministic current JavaScript output only. This record does not establish original-runtime baseline authority, visual parity, audio or behavior fidelity, human/owner acceptance, or strict completion.",
    generatedBy: {
      script: "scripts/adopt-course-implementation-captures.mjs",
      sha256: scriptSha256,
    },
    migrationTechnicalContract: {
      path: "migration.json",
      hashMode: "canonical-json-v1",
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      sha256: technicalManifestSha256(updatedManifest),
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    traceCoverageIdentity: {
      path: "evidence/full-frame-coverage.json",
      hashMode: "canonical-json-v1",
      projection: TRACE_COVERAGE_PROJECTION.id,
      sha256: traceCoverageSha256(updatedCoverage),
      includedPaths: hasSchemaV2Selection
        ? [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths]
        : [...LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS],
      excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
    },
    ...(hasSchemaV2Selection ? {
      ...(orchestrationBindings.length === 1 ? {
        captureOrchestration: {
          path: orchestrationBindings[0].path,
          bytes: orchestrationBindings[0].bytes,
          sha256: orchestrationBindings[0].sha256,
          schemaVersion: orchestrationBindings[0].schemaVersion,
          selectionContract: orchestrationBindings[0].selectionContract,
        },
      } : {
        captureOrchestrations: orchestrationBindings.map((binding) => ({
          path: binding.path,
          bytes: binding.bytes,
          sha256: binding.sha256,
          schemaVersion: binding.schemaVersion,
          selectionContract: binding.selectionContract,
        })),
      }),
      currentJavascriptPhysicalFrameAggregate,
    } : {}),
    requirements: [...capturesByRequirement.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([requirementId, capture]) => {
        const requirement = updatedCoverage.requirements.find((item) => item.requirementId === requirementId);
        return {
          requirementId,
          frameDomainId: requirement.frameDomainId,
          traceId: requirement.traceId,
          entryStateSha256: requirement.entryStateSha256,
          scenario: requirement.scenario,
          language: requirement.language,
          seed: String(requirement.seed),
          ...(capture.selection.requirementSchemaVersion === 2 ? {
            ...capture.selection,
            orchestration: {
              path: orchestrationByRequirement.get(requirementId).path,
              sha256: orchestrationByRequirement.get(requirementId).sha256,
            },
          } : {}),
          captureManifest: {path: capture.capturePath, sha256: capture.captureSha256},
          capturedFrameCount: capture.frameCount,
          frameSetSha256: sha256Text(canonicalJson([...capture.frameFiles.entries()].map(([frame, value]) => ({frame, ...value})))),
          result: "validated-current-javascript-output-only",
        };
      }),
    summary: {
      declaredRequirementCount,
      requirementCount: capturesByRequirement.size,
      capturedFrameCount: [...capturesByRequirement.values()].reduce((sum, capture) => sum + capture.frameCount, 0),
      missingRequirementCount,
      missingRequirementIds,
      missingFrameCount,
      ...(hasSchemaV2Selection ? {
        currentJavascriptPhysicalAggregateGroupCount: currentJavascriptPhysicalFrameAggregate.groups.length,
        currentJavascriptPhysicalCoveredFrameCount: currentJavascriptPhysicalFrameAggregate.groups
          .reduce((sum, group) => sum + group.coveredFrameCount, 0),
        currentJavascriptPhysicalMissingFrameCount: currentJavascriptPhysicalFrameAggregate.groups
          .reduce((sum, group) => sum + group.missingFrames.length, 0),
      } : {}),
      validationErrors: 0,
    },
    strictAcceptanceEffect: "none",
  };
  if (!hasSchemaV2Selection && existingAdoption?.schemaVersion === 1) {
    const candidate = structuredClone(adoption);
    candidate.generatedBy = existingAdoption.generatedBy;
    if (canonicalJson(candidate) === canonicalJson(existingAdoption)) {
      adoption.generatedBy = existingAdoption.generatedBy;
    }
  }
  const adoptionText = jsonText(adoption);
  const adoptionSha256 = digest(Buffer.from(adoptionText));
  updatedManifest.evidence.currentJavaScriptImplementationCaptureAdoption = {
    path: ADOPTION_RELATIVE_PATH,
    sha256: adoptionSha256,
    authority: "non-authoritative-current-javascript-output",
    strictAcceptanceEffect: "none",
  };
  return {
    manifestText: jsonText(updatedManifest),
    coverageText: jsonText(updatedCoverage),
    keyframesText: serializeCsv(parsed.headers, rows),
    adoptionText,
  };
}

export function parseArguments(argumentsList) {
  const options = {
    projectRoot: repositoryRoot,
    id: "",
    captureRoot: "",
    allowPartial: false,
    invalidateCurrentJsApproval: false,
    invalidationReason: "",
    invalidatedAt: "",
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--allow-partial") options.allowPartial = true;
    else if (value === "--invalidate-current-js-approval") options.invalidateCurrentJsApproval = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (["--project-root", "--id", "--capture-root", "--invalidation-reason", "--invalidated-at"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--project-root") options.projectRoot = path.resolve(next);
      else if (value === "--id") options.id = next;
      else if (value === "--capture-root") options.captureRoot = next;
      else if (value === "--invalidation-reason") options.invalidationReason = next;
      else options.invalidatedAt = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help) {
    requireAnimationId(options.id);
    requireString(options.captureRoot, "--capture-root");
    validateInvalidationOptions(options);
  }
  return options;
}

export async function adoptCourseImplementationCaptures(options, {writeTransactionHooks} = {}) {
  const invalidation = validateInvalidationOptions(options);
  requireAnimationId(options.id);
  const projectRoot = await assertRealProjectPath(path.resolve(options.projectRoot || repositoryRoot), path.resolve(options.projectRoot || repositoryRoot), "project root", "directory");
  const workspace = await assertRealProjectPath(
    projectRoot,
    path.join(projectRoot, "migrations", options.id),
    "migration workspace",
    "directory",
  );
  const evidenceRoot = await assertRealProjectPath(
    projectRoot,
    path.join(workspace, "evidence"),
    "migration evidence directory",
    "directory",
  );
  const [migrationPath, coveragePath, keyframesPath] = await Promise.all([
    assertRealProjectPath(projectRoot, path.join(workspace, "migration.json"), "migration.json"),
    assertRealProjectPath(projectRoot, path.join(evidenceRoot, "full-frame-coverage.json"), "full-frame-coverage.json"),
    assertRealProjectPath(projectRoot, path.join(workspace, "keyframes.csv"), "keyframes.csv"),
  ]);
  const adoptionPath = path.join(workspace, ADOPTION_RELATIVE_PATH);
  const [migrationRecord, coverageRecord, keyframesText, adoptionRecord, scriptBytes, captureOrchestrationScriptBytes] = await Promise.all([
    readJson(migrationPath, "migration.json"),
    readJson(coveragePath, "full-frame-coverage.json"),
    readFile(keyframesPath, "utf8"),
    readOptional(adoptionPath, projectRoot, "implementation capture adoption"),
    readFile(scriptPath),
    readFile(captureOrchestrationScriptPath),
  ]);
  const manifest = migrationRecord.value;
  const coverage = coverageRecord.value;
  if (manifest.animationId !== options.id || coverage.animationId !== options.id || coverage.schemaVersion !== 2 || !Array.isArray(coverage.requirements) || !coverage.requirements.length) {
    throw new Error(`${options.id} migration/coverage identity or schema is invalid`);
  }
  const frameCounts = frameCountsByDomain(manifest);
  validateRequirementCoverageGroups(coverage.requirements, frameCounts);
  const existingAdoption = parseExistingAdoption(adoptionRecord, options.id, options.allowPartial === true);
  const selectionsByRequirement = new Map();
  for (const requirement of coverage.requirements) {
    if (sha256Text(canonicalJson(requirement.entryState)) !== requirement.entryStateSha256) {
      throw new Error(`${options.id} coverage requirement ${requirement.requirementId} contains a non-canonical entryStateSha256`);
    }
    const frameCount = frameCounts[requirement.frameDomainId];
    selectionsByRequirement.set(
      requirement.requirementId,
      normalizeRequirementSelection(requirement, frameCount),
    );
  }
  const currentImplementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot,
    workspace,
    manifest,
  });
  const captureRoot = path.isAbsolute(options.captureRoot) ? options.captureRoot : path.join(projectRoot, options.captureRoot);
  const captureArtifacts = await findCaptureArtifacts(projectRoot, captureRoot);
  const capturePaths = captureArtifacts.captureManifests;
  const requirementById = new Map(coverage.requirements.map((requirement) => [requirement.requirementId, requirement]));
  const capturesByRequirement = new Map();
  for (const capturePath of capturePaths) {
    const record = await readJson(capturePath, portable(path.relative(projectRoot, capturePath)));
    const requirementId = requireString(record.value.requirementId, `${capturePath}.requirementId`);
    const requirement = requirementById.get(requirementId);
    if (!requirement) throw new Error(`capture manifest references undeclared requirement ${requirementId}`);
    if (capturesByRequirement.has(requirementId)) throw new Error(`duplicate capture manifest for ${requirementId}`);
    const capture = await validateCapture({
      projectRoot,
      capturePath,
      capture: record.value,
      captureSha256: record.sha256,
      captureBytes: Buffer.byteLength(record.text),
      requirement,
      manifest,
      currentImplementationArtifactClosure,
      selection: selectionsByRequirement.get(requirementId),
    });
    capturesByRequirement.set(requirementId, {
      ...capture,
      orchestrationRoot: captureArtifacts.root,
      expectedOrchestrationReferences: [],
      retained: false,
    });
  }
  if (options.allowPartial) {
    const retainedReferences = collectRetainedCaptureReferences({
      manifest,
      coverage,
      existingAdoption,
      newRequirementIds: new Set(capturesByRequirement.keys()),
      requirementById,
    });
    const retainedCaptures = await validateRetainedCaptures({
      projectRoot,
      references: retainedReferences,
      requirementById,
      selectionsByRequirement,
      manifest,
      currentImplementationArtifactClosure,
    });
    for (const [requirementId, capture] of retainedCaptures) {
      if (capturesByRequirement.has(requirementId)) {
        throw new Error(`internal cumulative-adoption collision for ${requirementId}`);
      }
      capturesByRequirement.set(requirementId, capture);
    }
  }
  const coverageDescriptor = {
    path: portable(path.relative(projectRoot, coveragePath)),
    bytes: Buffer.byteLength(coverageRecord.text),
    sha256: coverageRecord.sha256,
  };
  const migrationDescriptor = {
    path: portable(path.relative(projectRoot, migrationPath)),
    bytes: Buffer.byteLength(migrationRecord.text),
    sha256: migrationRecord.sha256,
  };
  const cumulativeOrchestrations = await validateCumulativeSchemaV2Orchestrations({
    projectRoot,
    capturesByRequirement,
    requirementById,
    manifest,
    coverage,
    coverageDescriptor,
    migrationDescriptor,
    captureOrchestrationScriptSha256: digest(captureOrchestrationScriptBytes),
  });
  const missing = [...requirementById.keys()].filter((requirementId) => !capturesByRequirement.has(requirementId));
  if (missing.length && !options.allowPartial) throw new Error(`capture root omits ${missing.length} requirement(s): ${missing.join(", ")}`);
  const outputs = deriveOutputs({
    manifest,
    coverage,
    keyframesText,
    capturesByRequirement,
    frameCounts,
    orchestrationBindings: cumulativeOrchestrations.bindings,
    orchestrationByRequirement: cumulativeOrchestrations.byRequirement,
    existingAdoption,
    scriptSha256: digest(scriptBytes),
  });
  const files = [
    {path: migrationPath, observed: migrationRecord.text, expected: outputs.manifestText, existed: true},
    {path: coveragePath, observed: coverageRecord.text, expected: outputs.coverageText, existed: true},
    {path: keyframesPath, observed: keyframesText, expected: outputs.keyframesText, existed: true},
    {path: adoptionPath, observed: adoptionRecord.text, expected: outputs.adoptionText, existed: adoptionRecord.exists},
  ];
  const approvalBinding = options.check
    ? {
        acceptedSchemaV3Report: false,
        reportPath: "",
        reportSha256: "",
        artifactBindingSha256: "",
        changedBoundArtifacts: [],
      }
    : await inspectAcceptedApprovalBinding({projectRoot, manifest, files});
  if (approvalBinding.changedBoundArtifacts.length && !invalidation.enabled) {
    throw new Error(approvalInvalidationRequiredMessage(options.id, approvalBinding));
  }
  if (options.check) {
    const stale = files.filter(({observed, expected}) => observed !== expected).map(({path: candidate}) => portable(path.relative(projectRoot, candidate)));
    if (stale.length) throw new Error(`implementation capture adoption is stale:\n${stale.join("\n")}`);
  } else {
    const writes = files
      .filter(({observed, expected}) => observed !== expected)
      .map((file) => ({
        filePath: file.path,
        value: file.expected,
        expectedBefore: file.existed ? file.observed : null,
      }));
    if (writes.length) await writeApprovalTransaction(writes, writeTransactionHooks);
  }
  return {
    animationId: options.id,
    mode: options.check ? "check" : "write",
    requirementCount: capturesByRequirement.size,
    declaredRequirementCount: requirementById.size,
    missingRequirementCount: missing.length,
    capturedFrameCount: [...capturesByRequirement.values()].reduce((sum, capture) => sum + capture.frameCount, 0),
    files: files.map(({path: candidate}) => portable(path.relative(projectRoot, candidate))),
    authority: "non-authoritative-current-javascript-output",
    strictAcceptanceChanged: false,
    currentJavaScriptApprovalBinding: {
      acceptedSchemaV3Report: approvalBinding.acceptedSchemaV3Report,
      reportPath: approvalBinding.reportPath,
      reportSha256: approvalBinding.reportSha256,
      artifactBindingSha256: approvalBinding.artifactBindingSha256,
      changedBoundArtifacts: approvalBinding.changedBoundArtifacts,
      invalidationAuthorized: approvalBinding.changedBoundArtifacts.length > 0 && invalidation.enabled,
      invalidationReason: approvalBinding.changedBoundArtifacts.length > 0 && invalidation.enabled ? invalidation.reason : "",
      invalidatedAt: approvalBinding.changedBoundArtifacts.length > 0 && invalidation.enabled ? invalidation.invalidatedAt : "",
      currentBindingWillBeStale: approvalBinding.changedBoundArtifacts.length > 0 && invalidation.enabled,
      approvalReportChanged: false,
      approvalRenewed: false,
    },
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await adoptCourseImplementationCaptures(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${options.check ? "CHECK" : "ADOPT"} ${result.animationId}: ${result.requirementCount} requirements, ${result.capturedFrameCount} non-authoritative implementation frames`);
    if (result.currentJavaScriptApprovalBinding.currentBindingWillBeStale) {
      console.log(`INVALIDATED CURRENT-JS BINDING ${result.currentJavaScriptApprovalBinding.reportPath} at ${result.currentJavaScriptApprovalBinding.invalidatedAt}: ${result.currentJavaScriptApprovalBinding.invalidationReason}`);
      console.log("The approval report was not changed or renewed.");
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
