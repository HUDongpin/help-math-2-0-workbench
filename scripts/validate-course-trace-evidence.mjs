#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  COURSE_TRACE_PILOT_IDS,
  canonicalJson,
  safeRequirementId,
  sha256Text,
  traceRequirementSelectionIdentity,
  validateExecutionProof,
} from "./build-course-trace-specs.mjs";
import {LEGACY_PILOT_IDS} from "./build-legacy-scenario-inventories.mjs";
import {LEGACY_TRACE_INDEX_BASENAME} from "./build-legacy-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {classifyStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const COURSE_INDEX_BASENAME = "course-shell-pilot-trace-spec-index.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.length) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function canonicalEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function readJsonWithHash(candidate, label) {
  let text;
  try {
    text = await readFile(candidate, "utf8");
  } catch (error) {
    throw new Error(`${label} is unreadable: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {value, text, sha256: sha256Text(text)};
}

function resolveProjectFile(root, declaredPath, label) {
  assertString(declaredPath, label);
  if (path.isAbsolute(declaredPath) || declaredPath.includes("\\")) throw new Error(`${label} must be a portable project-relative path`);
  const resolved = path.resolve(root, declaredPath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`${label} escapes the project root`);
  if (portable(relative) !== declaredPath) throw new Error(`${label} must be normalized project-relative path ${portable(relative)}`);
  return resolved;
}

async function rehashDeclaredFile(root, descriptor, label) {
  assertObject(descriptor, label);
  const file = assertString(descriptor.file, `${label}.file`);
  const expected = assertSha256(descriptor.sha256, `${label}.sha256`);
  const resolved = resolveProjectFile(root, file, `${label}.file`);
  if (!(await exists(resolved))) throw new Error(`${label} is missing: ${file}`);
  const observed = await sha256File(resolved);
  if (observed !== expected) throw new Error(`${label} SHA-256 mismatch: ${file}`);
  return {file, sha256: observed, resolved};
}

function selectionIdentityFromSpec(spec, expectedSelectionIdentity) {
  return Object.fromEntries(
    Object.keys(expectedSelectionIdentity).map((key) => [key, spec.identity?.[key]]),
  );
}

function coverageIdentity(requirement, frameCount) {
  return {
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
    ...traceRequirementSelectionIdentity(
      requirement,
      frameCount,
      `${requirement.requirementId || "coverage requirement"} trace evidence`,
    ).identity,
    baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
  };
}

function baselineAuthoritySatisfies(requirementAuthority, actualAuthority) {
  if (requirementAuthority === "original-runtime-natural-trace") return actualAuthority === "original-runtime-natural-trace";
  if (requirementAuthority === "original-runtime-frame-accurate") {
    return actualAuthority === "original-runtime-direct-seek" || actualAuthority === "original-runtime-frame-step";
  }
  return false;
}

function specIdentity(spec, expectedSelectionIdentity) {
  return {
    frameDomainId: spec.identity?.frameDomainId,
    traceId: spec.identity?.traceId,
    entryStateSha256: spec.identity?.entryStateSha256,
    scenario: spec.identity?.scenario,
    language: spec.identity?.language,
    seed: String(spec.identity?.seed),
    ...selectionIdentityFromSpec(spec, expectedSelectionIdentity),
    baselineAuthorityRequirement: spec.identity?.baselineAuthorityRequirement,
  };
}

function expectedSpecPath({root, workspace, requirementId}) {
  return portable(path.relative(root, path.join(workspace, "audit", "trace-specs", `${safeRequirementId(requirementId)}.json`)));
}

function expectedExecutionReportPath({root, workspace, requirementId}) {
  return portable(path.relative(root, path.join(workspace, "baseline", "trace-executions", `${safeRequirementId(requirementId)}.json`)));
}

function traceSpecReadiness(traceSpecStatus) {
  if ([
    "source-frame-accurate-root-ready-for-authoritative-capture",
    "source-schedule-ready-for-authoritative-execution",
  ].includes(traceSpecStatus)) return "ready";
  if (traceSpecStatus === "unresolved") return "unresolved";
  return "invalid";
}

async function verifyBaselineCaptureManifest({root, spec, requirement, report}) {
  const descriptor = report.originalRuntimeCaptureManifest;
  if (descriptor?.file !== requirement.baselineCaptureManifest || descriptor?.sha256 !== requirement.baselineCaptureManifestSha256) {
    throw new Error(`${spec.requirementId}: execution report originalRuntimeCaptureManifest must exactly match coverage path/hash`);
  }
  const verifiedDescriptor = await rehashDeclaredFile(root, descriptor, `${spec.requirementId}: originalRuntimeCaptureManifest`);
  const baseline = (await readJsonWithHash(verifiedDescriptor.resolved, `${spec.requirementId}: original baseline capture manifest`)).value;
  const expectedIdentity = {
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    frameDomainId: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    entryStateSha256: spec.identity.entryStateSha256,
    scenario: spec.identity.scenario,
    language: spec.identity.language,
    seed: String(spec.identity.seed),
  };
  const observedIdentity = {
    animationId: baseline.animationId,
    requirementId: baseline.requirementId,
    frameDomainId: baseline.frameDomainId,
    traceId: baseline.traceId,
    entryStateSha256: baseline.entryStateSha256,
    scenario: baseline.scenario,
    language: baseline.language,
    seed: String(baseline.seed),
  };
  if (baseline.schemaVersion !== 2 || baseline.status !== "complete" || baseline.evidenceType !== "original-runtime-frame-domain-baseline") {
    throw new Error(`${spec.requirementId}: original baseline capture manifest is not schema-2 complete frame-domain evidence`);
  }
  if (!canonicalEqual(observedIdentity, expectedIdentity)) throw new Error(`${spec.requirementId}: original baseline capture identity differs from trace requirement`);
  if (baseline.baselineAuthority !== requirement.baselineAuthority || !baselineAuthoritySatisfies(requirement.baselineAuthorityRequirement, requirement.baselineAuthority)) {
    throw new Error(`${spec.requirementId}: baseline actual authority does not satisfy the coverage authority requirement`);
  }
  if (baseline.source?.swfSha256 !== spec.sourceBindings.sourceSwf.sha256) throw new Error(`${spec.requirementId}: baseline source SWF hash differs from trace spec`);
  const first = 1;
  const last = spec.frameDomain?.frameCount;
  const expectedCount = last;
  if (!Number.isInteger(last) || last < 1 || !Array.isArray(baseline.frames) || baseline.frames.length !== expectedCount) {
    throw new Error(`${spec.requirementId}: original baseline frames do not exhaust the required range`);
  }
  const frames = new Map();
  for (const [index, frame] of baseline.frames.entries()) {
    const expectedFrame = first + index;
    if (frame.frame !== expectedFrame) throw new Error(`${spec.requirementId}: original baseline frame ${expectedFrame} is missing, duplicated, or out of order`);
    for (const field of ["animationId", "requirementId", "frameDomainId", "traceId", "entryStateSha256"]) {
      const expected = field === "animationId" ? spec.animationId : field === "requirementId" ? spec.requirementId : spec.identity[field];
      if (frame[field] !== expected) throw new Error(`${spec.requirementId}: baseline frame ${expectedFrame} ${field} mismatch`);
    }
    if (frame.width !== spec.frameDomain.nativeStage.width || frame.height !== spec.frameDomain.nativeStage.height) {
      throw new Error(`${spec.requirementId}: baseline frame ${expectedFrame} dimensions differ from native stage`);
    }
    const verified = await rehashDeclaredFile(root, {file: frame.file, sha256: frame.sha256}, `${spec.requirementId}: baseline frame ${expectedFrame}`);
    frames.set(expectedFrame, verified);
  }
  return {descriptor: verifiedDescriptor, baseline, frames};
}

function collectReportScreenshotReferences(report) {
  const references = [];
  for (const item of report.frameResults || []) {
    references.push({frame: item.frame, file: item.screenshotFile, sha256: item.screenshotSha256, source: `frameResults[${item.frame}]`});
  }
  const collectFrameEvidence = (items, source) => {
    for (const item of items || []) references.push({frame: item.frame, file: item.file, sha256: item.sha256, source});
  };
  for (const [index, item] of (report.orderedStepResults || []).entries()) collectFrameEvidence(item.frameEvidence, `orderedStepResults[${index}].frameEvidence`);
  for (const [index, item] of (report.stateCheckpointResults || []).entries()) collectFrameEvidence(item.frameEvidence, `stateCheckpointResults[${index}].frameEvidence`);
  collectFrameEvidence(report.terminalResult?.frameEvidence, "terminalResult.frameEvidence");
  collectFrameEvidence(report.zeroActionObservation?.frameEvidence, "zeroActionObservation.frameEvidence");
  return references;
}

function collectObservationScreenshotHashes(report) {
  const hashes = [];
  const add = (observation, source) => {
    if (observation?.screenshotSha256) hashes.push({sha256: observation.screenshotSha256, source});
  };
  for (const [index, item] of (report.orderedStepResults || []).entries()) {
    add(item.preState, `orderedStepResults[${index}].preState`);
    add(item.postState, `orderedStepResults[${index}].postState`);
  }
  for (const [index, item] of (report.stateCheckpointResults || []).entries()) add(item.observation, `stateCheckpointResults[${index}].observation`);
  add(report.terminalResult?.observation, "terminalResult.observation");
  add(report.zeroActionObservation?.preState, "zeroActionObservation.preState");
  add(report.zeroActionObservation?.postState, "zeroActionObservation.postState");
  return hashes;
}

function semanticStateContains(observed, expected) {
  if (Array.isArray(expected)) {
    return Array.isArray(observed) && observed.length === expected.length &&
      expected.every((value, index) => semanticStateContains(observed[index], value));
  }
  if (isPlainObject(expected)) {
    return isPlainObject(observed) && Object.entries(expected).every(([key, value]) => (
      Object.hasOwn(observed, key) && semanticStateContains(observed[key], value)
    ));
  }
  return Object.is(observed, expected);
}

function requireExpectedState(checkpoint, label) {
  const expectedState = checkpoint?.expectedState;
  if (!isPlainObject(expectedState) || !Object.keys(expectedState).length) {
    throw new Error(`${label}.expectedState must be a non-empty object for a natural trace`);
  }
  return expectedState;
}

function requireSemanticStateMatch(observation, expectedState, label) {
  const observedState = observation?.observedState;
  if (!semanticStateContains(observedState, expectedState)) {
    throw new Error(`${label}.observedState does not semantically satisfy the current trace spec expectedState`);
  }
  if (Number.isInteger(expectedState.rootFrame) && observation.rootFrame !== expectedState.rootFrame) {
    throw new Error(`${label}.rootFrame does not match the current trace spec expectedState`);
  }
  if (Number.isInteger(expectedState.localFrame) && observation.localFrame !== expectedState.localFrame) {
    throw new Error(`${label}.localFrame does not match the current trace spec expectedState`);
  }
}

function naturalFrameEvidenceGroups(report) {
  const groups = [];
  for (const [index, result] of (report.orderedStepResults || []).entries()) {
    groups.push({label: `orderedStepResults[${index}].frameEvidence`, items: result.frameEvidence});
  }
  for (const [index, result] of (report.stateCheckpointResults || []).entries()) {
    groups.push({label: `stateCheckpointResults[${index}].frameEvidence`, items: result.frameEvidence});
  }
  if (report.terminalResult) groups.push({label: "terminalResult.frameEvidence", items: report.terminalResult.frameEvidence});
  if (report.zeroActionObservation) groups.push({label: "zeroActionObservation.frameEvidence", items: report.zeroActionObservation.frameEvidence});
  return groups;
}

export function verifyNaturalTraceEvidenceSemantics(spec, report) {
  if (report.proofMode !== "natural-trace-ordered-events") return {frameCount: 0};

  const scheduledSteps = spec.schedule?.orderedSteps || [];
  for (const [index, scheduled] of scheduledSteps.entries()) {
    const result = report.orderedStepResults?.[index];
    const preExpected = requireExpectedState(scheduled.preStateCheckpoint, `schedule.orderedSteps[${index}].preStateCheckpoint`);
    const postExpected = requireExpectedState(scheduled.postStateCheckpoint, `schedule.orderedSteps[${index}].postStateCheckpoint`);
    requireSemanticStateMatch(result?.preState, preExpected, `orderedStepResults[${index}].preState`);
    requireSemanticStateMatch(result?.postState, postExpected, `orderedStepResults[${index}].postState`);
  }

  const checkpoints = spec.schedule?.stateCheckpoints || [];
  for (const [index, checkpoint] of checkpoints.entries()) {
    const expectedState = requireExpectedState(checkpoint, `schedule.stateCheckpoints[${index}]`);
    requireSemanticStateMatch(
      report.stateCheckpointResults?.[index]?.observation,
      expectedState,
      `stateCheckpointResults[${index}].observation`,
    );
  }

  const terminalExpected = requireExpectedState(spec.schedule?.terminalSemantics, "schedule.terminalSemantics");
  requireSemanticStateMatch(report.terminalResult?.observation, terminalExpected, "terminalResult.observation");

  const firstFrame = spec.identity?.requiredRange?.firstFrame;
  const lastFrame = spec.identity?.requiredRange?.lastFrame;
  if (!Number.isInteger(firstFrame) || !Number.isInteger(lastFrame) || firstFrame !== 1 || lastFrame < firstFrame) {
    throw new Error("natural trace requiredRange must be an exhaustive one-indexed range beginning at frame 1");
  }
  const evidenceByFrame = new Map();
  for (const group of naturalFrameEvidenceGroups(report)) {
    if (!Array.isArray(group.items) || !group.items.length) throw new Error(`${group.label} must contain captured frame evidence`);
    let previousFrame = 0;
    for (const [index, item] of group.items.entries()) {
      if (!Number.isInteger(item.frame) || item.frame < firstFrame || item.frame > lastFrame) {
        throw new Error(`${group.label}[${index}].frame is outside the natural trace required range`);
      }
      if (item.frame <= previousFrame) {
        throw new Error(`${group.label} frames must be strictly increasing without duplicates`);
      }
      previousFrame = item.frame;
      const descriptor = {file: item.file, sha256: item.sha256};
      const existing = evidenceByFrame.get(item.frame);
      if (existing && !canonicalEqual(existing, descriptor)) {
        throw new Error(`natural trace frame ${item.frame} has conflicting evidence references`);
      }
      evidenceByFrame.set(item.frame, descriptor);
    }
  }
  const expectedFrameCount = lastFrame - firstFrame + 1;
  if (evidenceByFrame.size !== expectedFrameCount) {
    const missing = [];
    for (let frame = firstFrame; frame <= lastFrame; frame += 1) {
      if (!evidenceByFrame.has(frame)) missing.push(frame);
    }
    const preview = missing.slice(0, 10).join(",");
    throw new Error(`natural trace frame evidence covers ${evidenceByFrame.size}/${expectedFrameCount} required frames; missing ${preview}${missing.length > 10 ? ",..." : ""}`);
  }
  return {frameCount: evidenceByFrame.size};
}

export async function verifyExecutionReportArtifacts({root, spec, requirement, report}) {
  const expectedPositioningAuthority = report.proofMode === "direct-seek-root-exhaustive"
    ? "original-runtime-direct-seek"
    : report.proofMode === "sequential-step-root-exhaustive" ? "original-runtime-frame-step" : "original-runtime-natural-trace";
  const reportActualAuthority = report.proofMode === "natural-trace-ordered-events"
    ? report.authorizedRuntime?.authority
    : report.authorizedRuntime?.framePositioningAuthority;
  if (reportActualAuthority !== expectedPositioningAuthority || requirement.baselineAuthority !== expectedPositioningAuthority) {
    throw new Error(`${spec.requirementId}: execution proofMode authority does not match coverage.baselineAuthority`);
  }
  const baseline = await verifyBaselineCaptureManifest({root, spec, requirement, report});
  const rawLog = await rehashDeclaredFile(root, report.rawEventLog, `${spec.requirementId}: rawEventLog`);
  const targetLog = await rehashDeclaredFile(root, report.sourceTargetResolutionLog, `${spec.requirementId}: sourceTargetResolutionLog`);
  const stateArchive = await rehashDeclaredFile(root, report.stateSnapshotArchive, `${spec.requirementId}: stateSnapshotArchive`);
  const naturalTraceEvidence = verifyNaturalTraceEvidenceSemantics(spec, report);
  const screenshotReferences = collectReportScreenshotReferences(report);
  if (!screenshotReferences.length) throw new Error(`${spec.requirementId}: execution report has no screenshot references`);
  const verifiedScreenshots = [];
  for (const reference of screenshotReferences) {
    const verified = await rehashDeclaredFile(root, reference, `${spec.requirementId}: ${reference.source}`);
    const baselineFrame = baseline.frames.get(reference.frame);
    if (!baselineFrame || baselineFrame.file !== reference.file || baselineFrame.sha256 !== reference.sha256) {
      throw new Error(`${spec.requirementId}: ${reference.source} does not bind the same frame in the coverage baseline manifest`);
    }
    verifiedScreenshots.push({...reference, observedSha256: verified.sha256});
  }
  const referencedScreenshotHashes = new Set(verifiedScreenshots.map((item) => item.sha256));
  for (const observation of collectObservationScreenshotHashes(report)) {
    if (!referencedScreenshotHashes.has(observation.sha256)) {
      throw new Error(`${spec.requirementId}: ${observation.source}.screenshotSha256 has no re-hashed report screenshot reference`);
    }
  }
  return {
    rawLog: {file: rawLog.file, sha256: rawLog.sha256},
    targetLog: {file: targetLog.file, sha256: targetLog.sha256},
    stateArchive: {file: stateArchive.file, sha256: stateArchive.sha256},
    originalRuntimeCaptureManifest: {file: baseline.descriptor.file, sha256: baseline.descriptor.sha256},
    baselineFrameCount: baseline.frames.size,
    naturalTraceFrameEvidenceCount: naturalTraceEvidence.frameCount,
    reportScreenshotReferenceCount: verifiedScreenshots.length,
    uniqueReportScreenshotCount: new Set(verifiedScreenshots.map((item) => item.file)).size,
  };
}

function verifySpecBindings({id, spec, specIndex, requirement, hashes, expectedFile, expectedReport}) {
  if (spec.schemaVersion !== 1 || spec.animationId !== id || spec.requirementId !== requirement.requirementId) {
    throw new Error(`${id}/${requirement.requirementId}: trace spec schema/identity mismatch`);
  }
  if (specIndex.file !== expectedFile || specIndex.expectedExecutionReport !== expectedReport) {
    throw new Error(`${id}/${requirement.requirementId}: trace index paths are not canonical`);
  }
  if (spec.executionEvidence?.expectedExecutionReportPath !== `baseline/trace-executions/${safeRequirementId(requirement.requirementId)}.json`) {
    throw new Error(`${id}/${requirement.requirementId}: trace spec expected execution path is not canonical`);
  }
  const expectedSelectionIdentity = traceRequirementSelectionIdentity(
    requirement,
    spec.frameDomain?.frameCount,
    `${id}/${requirement.requirementId} trace evidence`,
  ).identity;
  if (!canonicalEqual(
    specIdentity(spec, expectedSelectionIdentity),
    coverageIdentity(requirement, spec.frameDomain?.frameCount),
  )) {
    throw new Error(`${id}/${requirement.requirementId}: trace spec identity differs from current coverage`);
  }
  const indexIdentity = {
    frameDomainId: specIndex.frameDomainId,
    traceId: specIndex.traceId,
    scenario: specIndex.scenario,
    language: specIndex.language,
    seed: String(specIndex.seed),
  };
  const expectedIndexIdentity = {
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
  };
  if (!canonicalEqual(indexIdentity, expectedIndexIdentity) || specIndex.status !== spec.traceSpecStatus || specIndex.traceModel !== spec.traceModel.kind) {
    throw new Error(`${id}/${requirement.requirementId}: trace index identity/status differs from spec or coverage`);
  }
  const expectedProjectionBindings = [
    [spec.sourceBindings?.migrationManifest, TECHNICAL_MANIFEST_PROJECTION.id, hashes.manifestTechnicalSha256, TECHNICAL_MANIFEST_PROJECTION.excludedPaths, []],
    [spec.sourceBindings?.fullFrameCoverage, TRACE_COVERAGE_PROJECTION.id, hashes.coverageTechnicalSha256, TRACE_COVERAGE_PROJECTION.excludedRequirementPaths, TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    [spec.sourceBindings?.scenarioInventory, SCENARIO_INVENTORY_PROJECTION.id, hashes.inventoryTechnicalSha256, SCENARIO_INVENTORY_PROJECTION.excludedPaths, []],
  ];
  if (spec.sourceBindings?.sourceSwf?.sha256 !== hashes.sourceSwfSha256 || expectedProjectionBindings.some(([binding, projection, sha256, excludedPaths, includedPaths]) => (
    binding?.hashMode !== CANONICAL_PROJECTION_ENCODING || binding?.projection !== projection || binding?.sha256 !== sha256 ||
    !canonicalEqual(binding.excludedPaths || [], [...excludedPaths]) || !canonicalEqual(binding.includedPaths || [], [...includedPaths])
  ))) {
    throw new Error(`${id}/${requirement.requirementId}: trace spec source/current-document hash binding mismatch`);
  }
}

export async function inspectTraceRequirement({
  root,
  workspace,
  id,
  requirement,
  specIndex,
  hashes,
}) {
  const expectedFile = expectedSpecPath({root, workspace, requirementId: requirement.requirementId});
  const expectedReport = expectedExecutionReportPath({root, workspace, requirementId: requirement.requirementId});
  const specPath = resolveProjectFile(root, expectedFile, `${id}/${requirement.requirementId}: trace spec path`);
  if (!(await exists(specPath))) throw new Error(`${id}/${requirement.requirementId}: indexed trace spec is missing`);
  const specDocument = await readJsonWithHash(specPath, `${id}/${requirement.requirementId}: trace spec`);
  if (specDocument.sha256 !== specIndex.sha256) throw new Error(`${id}/${requirement.requirementId}: indexed trace spec SHA-256 mismatch`);
  const spec = specDocument.value;
  verifySpecBindings({id, spec, specIndex, requirement, hashes, expectedFile, expectedReport});
  const coverageComplete = requirement.status === "complete";
  const specReadiness = traceSpecReadiness(spec.traceSpecStatus);
  if (coverageComplete && specReadiness !== "ready") {
    throw new Error(`${id}/${requirement.requirementId}: complete coverage requirement requires a current ready trace spec; found ${spec.traceSpecStatus || "missing"}`);
  }

  const reportPath = resolveProjectFile(root, expectedReport, `${id}/${requirement.requirementId}: execution report path`);
  const reportExists = await exists(reportPath);
  if (!reportExists) {
    if (coverageComplete) throw new Error(`${id}/${requirement.requirementId}: complete coverage requirement is missing its execution report`);
    return {
      animationId: id,
      requirementId: requirement.requirementId,
      coverageStatus: requirement.status,
      disposition: "unresolved-execution-report-absent",
      traceSpecStatus: spec.traceSpecStatus,
      traceSpecReadiness: specReadiness,
      specFile: expectedFile,
      specSha256: specDocument.sha256,
      executionReport: expectedReport,
      executionReportSha256: null,
      evidence: null,
    };
  }

  const reportDocument = await readJsonWithHash(reportPath, `${id}/${requirement.requirementId}: execution report`);
  validateExecutionProof(spec, reportDocument.value, {
    traceSpecFile: expectedFile,
    traceSpecSha256: specDocument.sha256,
  });
  const evidence = await verifyExecutionReportArtifacts({root, spec, requirement, report: reportDocument.value});
  return {
    animationId: id,
    requirementId: requirement.requirementId,
    coverageStatus: requirement.status,
    disposition: coverageComplete ? "complete-evidence-verified" : "execution-evidence-verified-but-coverage-blocked",
    traceSpecStatus: spec.traceSpecStatus,
    traceSpecReadiness: specReadiness,
    specFile: expectedFile,
    specSha256: specDocument.sha256,
    executionReport: expectedReport,
    executionReportSha256: reportDocument.sha256,
    evidence,
  };
}

function traceIndexContract(animationId) {
  if (LEGACY_PILOT_IDS.includes(animationId)) {
    return {
      basename: LEGACY_TRACE_INDEX_BASENAME,
      artifactType: "legacy-pilot-trace-spec-index",
      pilotIds: LEGACY_PILOT_IDS,
      label: "legacy formula/key-term",
    };
  }
  return {
    basename: COURSE_INDEX_BASENAME,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilotIds: COURSE_TRACE_PILOT_IDS,
    label: "course/shell",
  };
}

function validateTraceIndex(index, contract) {
  if (index.schemaVersion !== 1 || index.artifactType !== contract.artifactType) {
    throw new Error(`${contract.label} trace-spec index schema/type mismatch`);
  }
  if (index.pilotCount !== contract.pilotIds.length || !Array.isArray(index.pilots) || index.pilots.length !== contract.pilotIds.length) {
    throw new Error(`${contract.label} trace-spec index must contain the canonical ${contract.pilotIds.length} pilots`);
  }
  if (index.pilots.some((pilot, position) => pilot.animationId !== contract.pilotIds[position])) {
    throw new Error(`${contract.label} trace-spec pilot order/identity mismatch`);
  }
}

function failedTraceRequirement({animationId, requirementId, coverageStatus = null, traceSpecStatus = null, message}) {
  return {
    animationId,
    requirementId,
    coverageStatus,
    disposition: "trace-evidence-failed",
    traceSpecStatus,
    traceSpecReadiness: traceSpecStatus ? traceSpecReadiness(traceSpecStatus) : "absent",
    specFile: null,
    specSha256: null,
    executionReport: null,
    executionReportSha256: null,
    evidence: null,
    failure: message,
  };
}

function summarizePilotTraceEvidence({root, indexPath, indexSha256, pilot, requirements, failures}) {
  const completeCount = requirements.filter((item) => item.disposition === "complete-evidence-verified").length;
  const blockedEvidenceCount = requirements.filter((item) => item.disposition === "execution-evidence-verified-but-coverage-blocked").length;
  const unresolvedCount = requirements.filter((item) => item.disposition === "unresolved-execution-report-absent").length;
  const readySpecCount = requirements.filter((item) => item.traceSpecReadiness === "ready").length;
  const unresolvedSpecCount = requirements.filter((item) => item.traceSpecReadiness === "unresolved").length;
  const absentSpecCount = requirements.filter((item) => item.traceSpecReadiness === "absent").length;
  const requirementCount = pilot?.requirementCount ?? requirements.length;
  return {
    schemaVersion: 1,
    animationId: pilot?.animationId || null,
    applicable: Boolean(pilot),
    status: failures.length ? "failed" : unresolvedCount || blockedEvidenceCount ? "unresolved" : "complete",
    ok: failures.length === 0 && completeCount === requirementCount,
    index: portable(path.relative(root, indexPath)),
    indexSha256,
    requirementCount,
    completeCount,
    blockedEvidenceCount,
    unresolvedCount,
    readySpecCount,
    unresolvedSpecCount,
    absentSpecCount,
    failureCount: failures.length,
    failures,
    requirements: requirements.sort((left, right) => compareText(left.requirementId || "", right.requirementId || "")),
  };
}

/**
 * Read-only inspection of an indexed course/shell or legacy formula/key-term
 * pilot. A ready
 * spec is only an executable instruction: only a complete, re-hashed execution
 * report bound to the exact current baseline can produce complete evidence.
 */
export async function inspectPilotTraceEvidence(options = {}) {
  const root = path.resolve(options.projectRoot || projectRoot);
  const migrationsRoot = path.resolve(options.migrationsRoot || path.join(root, "migrations"));
  const animationId = assertString(options.animationId, "animationId");
  const contract = traceIndexContract(animationId);
  const indexPath = path.join(migrationsRoot, contract.basename);
  let indexDocument;
  try {
    indexDocument = await readJsonWithHash(indexPath, `${contract.label} trace-spec index`);
    validateTraceIndex(indexDocument.value, contract);
  } catch (error) {
    return summarizePilotTraceEvidence({
      root,
      indexPath,
      indexSha256: indexDocument?.sha256 || null,
      pilot: {animationId, requirementCount: 0},
      requirements: [],
      failures: [{animationId, requirementId: null, message: error.message}],
    });
  }
  const pilot = indexDocument.value.pilots.find((item) => item.animationId === animationId);
  if (!pilot) {
    return {
      ...summarizePilotTraceEvidence({root, indexPath, indexSha256: indexDocument.sha256, pilot: null, requirements: [], failures: []}),
      animationId,
      status: "not-applicable",
      ok: false,
    };
  }

  let documents;
  try {
    documents = await loadPilotDocuments({root, migrationsRoot, pilot});
  } catch (error) {
    return summarizePilotTraceEvidence({
      root,
      indexPath,
      indexSha256: indexDocument.sha256,
      pilot,
      requirements: [],
      failures: [{animationId, requirementId: null, message: error.message}],
    });
  }

  const results = [];
  const failures = [];
  const specByRequirement = new Map((pilot.traceSpecs || []).map((item) => [item.requirementId, item]));
  if (specByRequirement.size !== pilot.traceSpecs.length) {
    failures.push({animationId, requirementId: null, message: `${animationId}: duplicate indexed requirementId`});
  } else {
    for (const requirement of documents.canonicalRequirements) {
      const specIndex = specByRequirement.get(requirement.requirementId);
      if (!specIndex) {
        const message = `${animationId}/${requirement.requirementId}: coverage requirement has no indexed trace spec`;
        failures.push({animationId, requirementId: requirement.requirementId, message});
        results.push(failedTraceRequirement({animationId, requirementId: requirement.requirementId, coverageStatus: requirement.status, message}));
        continue;
      }
      try {
        results.push(await inspectTraceRequirement({
          root,
          workspace: documents.workspace,
          id: animationId,
          requirement,
          specIndex,
          hashes: documents.hashes,
        }));
      } catch (error) {
        failures.push({animationId, requirementId: requirement.requirementId, message: error.message});
        results.push(failedTraceRequirement({
          animationId,
          requirementId: requirement.requirementId,
          coverageStatus: requirement.status,
          traceSpecStatus: specIndex.status,
          message: error.message,
        }));
      }
    }
  }
  return summarizePilotTraceEvidence({root, indexPath, indexSha256: indexDocument.sha256, pilot, requirements: results, failures});
}

async function loadPilotDocuments({root, migrationsRoot, pilot}) {
  const id = pilot.animationId;
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [manifestDocument, coverageDocument, inventoryDocument] = await Promise.all([
    readJsonWithHash(manifestPath, `${id}: migration manifest`),
    readJsonWithHash(coveragePath, `${id}: coverage`),
    readJsonWithHash(inventoryPath, `${id}: scenario inventory`),
  ]);
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  if (manifest.animationId !== id || coverage.animationId !== id || inventory.animationId !== id) throw new Error(`${id}: current document identities differ from trace index`);
  const manifestTechnicalSha256 = technicalManifestSha256(manifest);
  const coverageTechnicalSha256 = traceCoverageSha256(coverage);
  const inventoryTechnicalSha256 = scenarioInventorySha256(inventory);
  const technicalBindings = pilot.technicalBindings;
  if (
    technicalBindings?.manifest?.hashMode !== CANONICAL_PROJECTION_ENCODING || technicalBindings.manifest.projection !== TECHNICAL_MANIFEST_PROJECTION.id || technicalBindings.manifest.sha256 !== manifestTechnicalSha256 ||
    !canonicalEqual(technicalBindings.manifest.excludedPaths || [], [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths]) ||
    technicalBindings?.coverage?.hashMode !== CANONICAL_PROJECTION_ENCODING || technicalBindings.coverage.projection !== TRACE_COVERAGE_PROJECTION.id || technicalBindings.coverage.sha256 !== coverageTechnicalSha256 ||
    !canonicalEqual(technicalBindings.coverage.includedPaths || [], [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths]) ||
    !canonicalEqual(technicalBindings.coverage.excludedPaths || [], [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths]) ||
    technicalBindings?.scenarioInventory?.hashMode !== CANONICAL_PROJECTION_ENCODING || technicalBindings.scenarioInventory.projection !== SCENARIO_INVENTORY_PROJECTION.id || technicalBindings.scenarioInventory.sha256 !== inventoryTechnicalSha256 ||
    !canonicalEqual(technicalBindings.scenarioInventory.excludedPaths || [], [...SCENARIO_INVENTORY_PROJECTION.excludedPaths])
  ) throw new Error(`${id}: trace index current technical manifest/coverage/inventory projection mismatch`);
  const sourcePath = resolveProjectFile(root, manifest.source.swf, `${id}: source SWF path`);
  const sourceSwfSha256 = await sha256File(sourcePath);
  if (sourceSwfSha256 !== manifest.source.swfSha256 || sourceSwfSha256 !== pilot.sourceSwfSha256) throw new Error(`${id}: source SWF hash differs from manifest/index`);
  if (coverage.schemaVersion !== 2 || !Array.isArray(coverage.requirements)) throw new Error(`${id}: coverage must be schema 2 with requirements`);
  const domains = new Map((manifest.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
  const canonicalRequirements = coverage.requirements.filter((requirement) => {
    const domain = domains.get(requirement.frameDomainId);
    if (!domain) throw new Error(`${id}/${requirement.requirementId || "unknown"}: coverage uses an unknown frame domain`);
    return classifyStrictFullDomainRequirement(
      requirement,
      domain.frameCount,
      `${id}/${requirement.requirementId || "unknown"} trace evidence`,
    ).eligible;
  });
  if (pilot.requirementCount !== canonicalRequirements.length || pilot.traceSpecs?.length !== canonicalRequirements.length) {
    throw new Error(`${id}: trace index requirement count differs from canonical full-domain coverage requirements`);
  }
  return {
    id,
    workspace,
    manifest,
    coverage,
    canonicalRequirements,
    inventory,
    hashes: {
      sourceSwfSha256,
      manifestTechnicalSha256,
      coverageTechnicalSha256,
      inventoryTechnicalSha256,
    },
  };
}

export async function inspectCourseTraceEvidence(options = {}) {
  const root = path.resolve(options.projectRoot || projectRoot);
  const migrationsRoot = path.resolve(options.migrationsRoot || path.join(root, "migrations"));
  const contract = {
    basename: COURSE_INDEX_BASENAME,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilotIds: COURSE_TRACE_PILOT_IDS,
    label: "course/shell",
  };
  const indexPath = path.join(migrationsRoot, contract.basename);
  const indexDocument = await readJsonWithHash(indexPath, "course/shell trace-spec index");
  const index = indexDocument.value;
  validateTraceIndex(index, contract);

  const results = [];
  const failures = [];
  for (const pilot of index.pilots) {
    let documents;
    try {
      documents = await loadPilotDocuments({root, migrationsRoot, pilot});
    } catch (error) {
      failures.push({animationId: pilot.animationId, requirementId: null, message: error.message});
      continue;
    }
    const specByRequirement = new Map(pilot.traceSpecs.map((item) => [item.requirementId, item]));
    if (specByRequirement.size !== pilot.traceSpecs.length) {
      failures.push({animationId: pilot.animationId, requirementId: null, message: `${pilot.animationId}: duplicate indexed requirementId`});
      continue;
    }
    for (const requirement of documents.canonicalRequirements) {
      const specIndex = specByRequirement.get(requirement.requirementId);
      if (!specIndex) {
        failures.push({animationId: pilot.animationId, requirementId: requirement.requirementId, message: `${pilot.animationId}/${requirement.requirementId}: coverage requirement has no indexed trace spec`});
        continue;
      }
      try {
        results.push(await inspectTraceRequirement({
          root,
          workspace: documents.workspace,
          id: pilot.animationId,
          requirement,
          specIndex,
          hashes: documents.hashes,
        }));
      } catch (error) {
        failures.push({animationId: pilot.animationId, requirementId: requirement.requirementId, message: error.message});
      }
    }
  }
  const completeCount = results.filter((item) => item.disposition === "complete-evidence-verified").length;
  const blockedEvidenceCount = results.filter((item) => item.disposition === "execution-evidence-verified-but-coverage-blocked").length;
  const unresolvedCount = results.filter((item) => item.disposition === "unresolved-execution-report-absent").length;
  const requirementCount = index.pilots.reduce((sum, pilot) => sum + pilot.requirementCount, 0);
  const accountedCount = results.length + failures.filter((item) => item.requirementId).length;
  if (accountedCount !== requirementCount && !failures.some((item) => item.requirementId === null)) {
    failures.push({animationId: null, requirementId: null, message: `inspector accounted for ${accountedCount}/${requirementCount} requirements`});
  }
  return {
    schemaVersion: 1,
    status: failures.length ? "failed" : unresolvedCount || blockedEvidenceCount ? "unresolved" : "complete",
    ok: failures.length === 0 && unresolvedCount === 0 && blockedEvidenceCount === 0 && completeCount === requirementCount,
    index: portable(path.relative(root, indexPath)),
    indexSha256: indexDocument.sha256,
    pilotCount: index.pilotCount,
    requirementCount,
    completeCount,
    blockedEvidenceCount,
    unresolvedCount,
    failureCount: failures.length,
    failures,
    requirements: results.sort((left, right) => compareText(`${left.animationId}:${left.requirementId}`, `${right.animationId}:${right.requirementId}`)),
  };
}

export function parseArguments(argumentsList) {
  const options = {check: false, json: false, migrationsRoot: defaultMigrationsRoot};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--migrations") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error("--migrations requires a value");
      options.migrationsRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/validate-course-trace-evidence.mjs [options]\n\nOptions:\n  --check                   Exit nonzero unless all indexed requirements are complete and verified\n  --json                    Print the full machine-readable inspection\n  --migrations <directory>  Migration root (default: migrations)\n  -h, --help                Show this help\n\nThe inspector is read-only. It verifies the current manifest/coverage/inventory/spec/index hash DAG, fixed execution-report paths, original-runtime proof semantics, referenced artifact bytes, coverage baseline manifest binding, and every referenced screenshot.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else {
      const result = await inspectCourseTraceEvidence(options);
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        process.stdout.write(`course trace evidence: ${result.status}; ${result.completeCount}/${result.requirementCount} complete; ${result.unresolvedCount} absent; ${result.blockedEvidenceCount} blocked-with-evidence; ${result.failureCount} failed\n`);
        for (const failure of result.failures) process.stdout.write(`FAIL ${failure.animationId || "global"}${failure.requirementId ? `/${failure.requirementId}` : ""}: ${failure.message}\n`);
      }
      if (options.check && !result.ok) process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
