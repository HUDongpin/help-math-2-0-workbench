#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {technicalManifestSha256} from "./evidence-projections.mjs";
import {
  assertSafeReportOutput,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";
import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";
import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultJsonOutput = path.join(defaultProjectRoot, "reports", "pilot-renderable-implementation-capture-index.json");
const defaultMarkdownOutput = path.join(defaultProjectRoot, "reports", "pilot-renderable-implementation-capture-index.md");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, declaredPath, label) {
  invariant(typeof declaredPath === "string" && declaredPath.trim(), `${label} must be a non-empty project-relative path`);
  invariant(!path.isAbsolute(declaredPath), `${label} must not be absolute`);
  invariant(!declaredPath.split(/[\\/]/u).includes(".."), `${label} must not contain ..`);
  const resolved = path.resolve(projectRoot, declaredPath);
  invariant(isInside(projectRoot, resolved), `${label} escapes the project root`);
  return resolved;
}

async function readRegularFile(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(filePath);
  return {bytes, metadata};
}

async function readJsonRecord(filePath, label) {
  const record = await readRegularFile(filePath, label);
  try {
    return {...record, value: JSON.parse(record.bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label} is invalid JSON (${error.message})`);
  }
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function normalizeSeed(value) {
  return String(value);
}

function requirementIdentity(animationId, requirement) {
  return {
    animationId,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: normalizeSeed(requirement.seed),
  };
}

function assertIdentity(record, expected, label) {
  for (const [field, expectedValue] of Object.entries(expected)) {
    const observed = field === "seed" ? normalizeSeed(record?.[field]) : record?.[field];
    invariant(observed === expectedValue, `${label}.${field} differs from the coverage requirement`);
  }
}

function validateRequirementShape(requirement, animationId) {
  const label = `${animationId}/${requirement?.requirementId || "unknown requirement"}`;
  invariant(typeof requirement?.requirementId === "string" && requirement.requirementId, `${label} requirementId is invalid`);
  for (const field of ["scenario", "frameDomainId", "traceId", "language"]) {
    invariant(typeof requirement[field] === "string" && requirement[field], `${label}.${field} is invalid`);
  }
  invariant(new Set(["en", "es"]).has(requirement.language), `${label}.language must be en or es`);
  invariant(normalizeSeed(requirement.seed) === "0", `${label}.seed must be 0`);
  assertSha256(requirement.entryStateSha256, `${label}.entryStateSha256`);
  const first = requirement.requiredRange?.firstFrame;
  const last = requirement.requiredRange?.lastFrame;
  invariant(Number.isSafeInteger(first) && Number.isSafeInteger(last) && first >= 1 && last >= first, `${label}.requiredRange is invalid`);
  invariant(requirement.baselineAuthority !== "original-runtime-frame-accurate" && requirement.baselineAuthority !== "original-runtime-natural-trace", `${label} unexpectedly claims resolved original-runtime authority`);
  invariant(!requirement.baselineCaptureManifest && !requirement.metricsFile, `${label} unexpectedly declares baseline or RMSE evidence`);
}

function expectedFrames(requirement) {
  const frames = [];
  for (let frame = requirement.requiredRange.firstFrame; frame <= requirement.requiredRange.lastFrame; frame += 1) frames.push(frame);
  return frames;
}

function probeKey({frameDomain, scenario, language, seed, frame}) {
  return [frameDomain, scenario, language, normalizeSeed(seed), frame].join("\u0000");
}

function validateRendererAuditSelfConsistency(audit, animationId) {
  invariant(audit.schemaVersion === 1 && audit.evidenceType === "renderer-frame-domain-support-audit", `${animationId} renderer audit schema/type is invalid`);
  invariant(audit.animationId === animationId, `${animationId} renderer audit identity mismatch`);
  invariant(typeof audit.strictAcceptanceEffect === "string" && audit.strictAcceptanceEffect.startsWith("none;"), `${animationId} renderer audit must have no strict effect`);
  invariant(Array.isArray(audit.probes) && Array.isArray(audit.domainSupport), `${animationId} renderer audit probes/domainSupport are missing`);
  const keys = new Set();
  const outcomeCounts = {
    "renderable-exact": 0,
    "blocked-not-renderable": 0,
    "scenario-undeclared-by-module": 0,
    "identity-mismatch": 0,
    "probe-error": 0,
  };
  for (const [index, probe] of audit.probes.entries()) {
    const label = `${animationId} renderer probe ${index + 1}`;
    const request = probe?.request;
    invariant(request && typeof request.frameDomain === "string" && typeof request.scenario === "string", `${label} request is invalid`);
    invariant(Number.isSafeInteger(request.frame) && request.frame >= 1, `${label} frame is invalid`);
    const key = probeKey(request);
    invariant(!keys.has(key), `${label} duplicates a renderer probe identity`);
    keys.add(key);
    invariant(Object.hasOwn(outcomeCounts, probe.outcome), `${label} outcome is invalid`);
    outcomeCounts[probe.outcome] += 1;
    const exact = probe.identityExact === true && probe.identityChecks && Object.values(probe.identityChecks).every(Boolean);
    const renderableExact = probe.outcome === "renderable-exact";
    invariant(renderableExact === (probe.renderable === true && probe.blocked === false && exact && !probe.error), `${label} renderable-exact fields are inconsistent`);
  }
  const summary = audit.summary || {};
  invariant(summary.probeCount === audit.probes.length, `${animationId} renderer audit probe count is inconsistent`);
  invariant(summary.renderableCount === audit.probes.filter(({outcome}) => outcome === "renderable-exact").length, `${animationId} renderer audit renderable count is inconsistent`);
  invariant(summary.blockedCount === audit.probes.filter(({blocked}) => blocked === true).length, `${animationId} renderer audit blocked count is inconsistent`);
  invariant(canonicalJson(summary.outcomeCounts) === canonicalJson(outcomeCounts), `${animationId} renderer audit outcome counts are inconsistent`);
}

async function validateRendererAuditBindings({projectRoot, workspace, manifest, audit, animationId}) {
  validateRendererAuditSelfConsistency(audit, animationId);
  const projection = audit.generatedFrom?.migrationManifest;
  invariant(projection?.path === "migration.json" && projection?.technicalProjectionSha256 === technicalManifestSha256(manifest), `${animationId} renderer audit technical-manifest binding is stale`);
  const verifiedSources = [];
  for (const [bindingId, binding] of Object.entries(audit.generatedFrom || {})) {
    if (bindingId === "migrationManifest") continue;
    invariant(binding && typeof binding.path === "string", `${animationId} renderer audit ${bindingId} binding is invalid`);
    assertSha256(binding.sha256, `${animationId} renderer audit ${bindingId}.sha256`);
    const sourcePath = resolveProjectPath(projectRoot, binding.path, `${animationId} renderer audit ${bindingId}.path`);
    const record = await readRegularFile(sourcePath, `${animationId} renderer audit ${bindingId}`);
    const observedSha256 = digest(record.bytes);
    invariant(observedSha256 === binding.sha256, `${animationId} renderer audit ${bindingId} binding is stale`);
    verifiedSources.push({bindingId, path: portable(projectRoot, sourcePath), bytes: record.bytes.length, sha256: observedSha256});
  }
  invariant(isInside(projectRoot, workspace), `${animationId} workspace escapes project root`);
  return verifiedSources.sort((left, right) => left.bindingId.localeCompare(right.bindingId));
}

function rendererDisposition(requirement, audit, animationId) {
  const runtimeDomain = (audit.loadedRuntime?.frameDomains || []).find(({id}) => id === requirement.frameDomainId);
  invariant(runtimeDomain, `${animationId}/${requirement.requirementId} has no renderer-audited frame domain`);
  invariant(Number.isSafeInteger(runtimeDomain.frameCount) && runtimeDomain.frameCount >= 1, `${animationId}/${requirement.requirementId} renderer domain frameCount is invalid`);
  const firstFrame = 1;
  const lastFrame = runtimeDomain.frameCount;
  const endpointFrames = firstFrame === lastFrame ? [firstFrame] : [firstFrame, lastFrame];
  const matches = audit.probes.filter(({request}) =>
    request.frameDomain === requirement.frameDomainId
    && request.scenario === requirement.scenario
    && request.language === requirement.language
    && normalizeSeed(request.seed) === normalizeSeed(requirement.seed)
    && endpointFrames.includes(request.frame));
  invariant(matches.length === endpointFrames.length, `${animationId}/${requirement.requirementId} renderer audit does not uniquely cover both domain endpoints`);
  for (const frame of endpointFrames) {
    invariant(matches.filter(({request}) => request.frame === frame).length === 1, `${animationId}/${requirement.requirementId} renderer endpoint ${frame} is missing or duplicated`);
  }
  const fullDomainCoverage = requirement.requiredRange.firstFrame === 1 && requirement.requiredRange.lastFrame === runtimeDomain.frameCount;
  const allEndpointsRenderableExact = matches.every(({outcome}) => outcome === "renderable-exact");
  const partialPath = requirement.coverageRole === "partial-path";
  return {
    classification: partialPath
      ? "supplemental-partial-current-javascript-capture"
      : fullDomainCoverage && allEndpointsRenderableExact
        ? "fully-renderable-current-javascript-requirement"
        : "blocked-or-not-fully-renderable-requirement",
    runtimeFrameCount: runtimeDomain.frameCount,
    fullDomainCoverage,
    allEndpointsRenderableExact,
    endpointProbes: matches
      .sort((left, right) => left.request.frame - right.request.frame)
      .map(({request, outcome, actual, blocked, renderable}) => ({
        frame: request.frame,
        outcome,
        blocked,
        renderable,
        actualStatus: actual?.status ?? null,
        blocker: actual?.blocker ?? null,
      })),
  };
}

function expectedRootFrame(requirement, frame) {
  if (requirement.frameDomainId === "root") return frame;
  const entry = requirement.entryState || {};
  return entry.rootEntryFrame ?? entry.parentEntryFrame ?? null;
}

async function validateCapture({
  projectRoot,
  animationId,
  requirement,
  manifest,
  coveragePath,
  coverageSha256,
  rendererAuditPath,
  rendererAuditSha256,
  currentClosure,
  classification,
}) {
  const label = `${animationId}/${requirement.requirementId}`;
  invariant(typeof requirement.captureManifest === "string" && requirement.captureManifest, `${label} has no implementation capture manifest`);
  assertSha256(requirement.captureManifestSha256, `${label}.captureManifestSha256`);
  const capturePath = resolveProjectPath(projectRoot, requirement.captureManifest, `${label}.captureManifest`);
  const captureRecord = await readJsonRecord(capturePath, `${label} capture manifest`);
  const captureSha256 = digest(captureRecord.bytes);
  invariant(captureSha256 === requirement.captureManifestSha256, `${label} capture-manifest SHA-256 differs from coverage`);
  const capture = captureRecord.value;
  invariant(capture.schemaVersion === 4 && capture.status === "complete", `${label} capture must be schemaVersion 4 complete`);
  invariant(isUnambiguousLoopbackHttpUrl(capture.sourceUrl), `${label} capture sourceUrl must be an unambiguous loopback HTTP URL`);
  const provenanceErrors = implementationCaptureGeneratorProvenanceErrors(capture.generatorProvenance);
  invariant(provenanceErrors.length === 0, `${label} capture generator provenance is invalid: ${provenanceErrors.join("; ")}`);
  const closureErrors = implementationArtifactClosureErrors(capture.implementationArtifactClosure, currentClosure);
  invariant(closureErrors.length === 0, `${label} implementation artifact closure is stale: ${closureErrors.join("; ")}`);
  const identity = requirementIdentity(animationId, requirement);
  assertIdentity(capture, identity, `${label} capture`);
  invariant(capture.requestedFrameDomain === requirement.frameDomainId, `${label} capture requestedFrameDomain differs`);
  const nativeStage = manifest.runtime?.stage;
  invariant(Number.isSafeInteger(nativeStage?.width) && Number.isSafeInteger(nativeStage?.height), `${label} native stage is invalid`);
  invariant(capture.viewport?.width === nativeStage.width && capture.viewport?.height === nativeStage.height && capture.viewport?.deviceScaleFactor === 1, `${label} capture viewport is not the native stage at deviceScaleFactor 1`);
  invariant(capture.error === null, `${label} capture reports an error`);
  const diagnostics = {};
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    invariant(Array.isArray(capture[field]) && capture[field].length === 0, `${label} capture ${field} must be an empty array`);
    diagnostics[field] = 0;
  }
  const frames = expectedFrames(requirement);
  invariant(requirement.capturedFrameCount === frames.length && Array.isArray(requirement.missingFrames) && requirement.missingFrames.length === 0, `${label} coverage capture counts are not complete for its selected range`);
  invariant(Array.isArray(capture.captured) && capture.captured.length === frames.length, `${label} capture row count differs from its selected frame range`);
  const captureDirectory = path.dirname(capturePath);
  const frameBindings = [];
  let totalPngBytes = 0;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const row = capture.captured[index];
    const frameLabel = `${label}/frame-${frame}`;
    invariant(row.frame === frame && row.reportedFrame === frame, `${frameLabel} is missing, duplicated, reordered, or inexact`);
    assertIdentity(row, identity, frameLabel);
    invariant(row.reportedAnimationId === animationId, `${frameLabel}.reportedAnimationId differs`);
    invariant(row.frameDomain === requirement.frameDomainId && row.frameDomainId === requirement.frameDomainId && row.reportedFrameDomainId === requirement.frameDomainId, `${frameLabel} frame-domain identity differs`);
    invariant(row.reportedRenderState === "ready", `${frameLabel} renderer is not ready`);
    const rootFrame = expectedRootFrame(requirement, frame);
    invariant(row.rootFrame === rootFrame, `${frameLabel}.rootFrame differs from the declared entry state`);
    assertIdentity(row.visualTarget, identity, `${frameLabel}.visualTarget`);
    invariant(row.visualTarget?.reportedFrame === frame && row.visualTarget?.frameDomainId === requirement.frameDomainId, `${frameLabel} visual target frame/domain differs`);
    invariant(row.visualTarget?.rootFrame === rootFrame && row.visualTarget?.reportedRenderState === "ready", `${frameLabel} visual target root/render state differs`);
    invariant(typeof row.visualTarget?.tagName === "string" && row.visualTarget.tagName, `${frameLabel} visual target tag is missing`);
    invariant(/^frame-\d+\.png$/u.test(row.file || "") && path.basename(row.file) === row.file, `${frameLabel} PNG filename is unsafe`);
    assertSha256(row.sha256, `${frameLabel}.sha256`);
    const pngPath = path.resolve(captureDirectory, row.file);
    invariant(path.dirname(pngPath) === captureDirectory, `${frameLabel} PNG escapes its capture directory`);
    const pngRecord = await readRegularFile(pngPath, `${frameLabel} PNG`);
    const observedSha256 = digest(pngRecord.bytes);
    invariant(observedSha256 === row.sha256, `${frameLabel} PNG SHA-256 mismatch`);
    let png;
    try {
      png = PNG.sync.read(pngRecord.bytes);
    } catch (error) {
      throw new Error(`${frameLabel} PNG is undecodable (${error.message})`);
    }
    invariant(png.width === nativeStage.width && png.height === nativeStage.height && row.width === nativeStage.width && row.height === nativeStage.height, `${frameLabel} PNG dimensions differ from the native stage`);
    totalPngBytes += pngRecord.bytes.length;
    frameBindings.push({
      frame,
      file: portable(projectRoot, pngPath),
      bytes: pngRecord.bytes.length,
      sha256: observedSha256,
      width: png.width,
      height: png.height,
    });
  }
  return {
    requirementId: requirement.requirementId,
    coverageRole: requirement.coverageRole ?? "canonical-full-requirement",
    classification,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: normalizeSeed(requirement.seed),
    selectedRange: requirement.requiredRange,
    nativeStage: {width: nativeStage.width, height: nativeStage.height, deviceScaleFactor: 1},
    captureManifest: {
      path: portable(projectRoot, capturePath),
      bytes: captureRecord.bytes.length,
      sha256: captureSha256,
      declaredByCoverageSha256: requirement.captureManifestSha256,
      schemaVersion: capture.schemaVersion,
      status: capture.status,
      sourceUrl: capture.sourceUrl,
      capturedAt: capture.capturedAt,
    },
    identityVerification: {
      topLevelExact: true,
      exactFrameRows: frameBindings.length,
      exactVisualTargetRows: frameBindings.length,
      readyRenderRows: frameBindings.length,
    },
    diagnostics: {...diagnostics, captureError: null},
    implementationArtifactClosure: {
      currentAndCaptureExact: true,
      artifactCount: currentClosure.artifactCount,
      projectionCount: currentClosure.projectionCount,
      totalBytes: currentClosure.totalBytes,
      aggregateSha256: currentClosure.aggregateSha256,
    },
    evidenceBindings: {
      coverage: {path: portable(projectRoot, coveragePath), sha256: coverageSha256},
      rendererAudit: {path: portable(projectRoot, rendererAuditPath), sha256: rendererAuditSha256},
    },
    frameSet: {
      frameCount: frameBindings.length,
      totalPngBytes,
      aggregateSha256: digest(Buffer.from(canonicalJson(frameBindings))),
      frames: frameBindings,
    },
    authority: {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
    },
  };
}

function blockedRequirementRecord(requirement, disposition) {
  return {
    requirementId: requirement.requirementId,
    coverageRole: requirement.coverageRole ?? "canonical-full-requirement",
    classification: disposition.classification,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: normalizeSeed(requirement.seed),
    requiredRange: requirement.requiredRange,
    runtimeFrameCount: disposition.runtimeFrameCount,
    fullDomainCoverage: disposition.fullDomainCoverage,
    allEndpointsRenderableExact: disposition.allEndpointsRenderableExact,
    endpointProbes: disposition.endpointProbes,
    captureManifestDeclared: Boolean(requirement.captureManifest),
    blockingReason: requirement.blockingReason || "renderer requirement is not fully renderable",
    strictAcceptanceEffect: false,
  };
}

async function inspectPilot({projectRoot, animationId}) {
  const workspace = path.join(projectRoot, "migrations", animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const rendererAuditPath = path.join(workspace, "audit", "renderer-frame-domain-support.json");
  const [manifestRecord, coverageRecord, rendererAuditRecord] = await Promise.all([
    readJsonRecord(manifestPath, `${animationId} migration manifest`),
    readJsonRecord(coveragePath, `${animationId} full-frame coverage`),
    readJsonRecord(rendererAuditPath, `${animationId} renderer audit`),
  ]);
  const manifest = manifestRecord.value;
  const coverage = coverageRecord.value;
  const rendererAudit = rendererAuditRecord.value;
  invariant(manifest.animationId === animationId, `${animationId} manifest identity mismatch`);
  invariant(coverage.schemaVersion === 2 && coverage.animationId === animationId, `${animationId} coverage schema/identity mismatch`);
  invariant(Array.isArray(coverage.requirements) && coverage.requirements.length > 0, `${animationId} coverage requirements are missing`);
  const coverageSha256 = digest(coverageRecord.bytes);
  const rendererAuditSha256 = digest(rendererAuditRecord.bytes);
  const rendererSourceBindings = await validateRendererAuditBindings({projectRoot, workspace, manifest, audit: rendererAudit, animationId});
  const currentClosure = await collectImplementationArtifactClosure({projectRoot, workspace, manifest});
  const ids = new Set();
  const completeRequirements = [];
  const partialRequirements = [];
  const blockedRequirements = [];
  for (const requirement of coverage.requirements) {
    validateRequirementShape(requirement, animationId);
    invariant(!ids.has(requirement.requirementId), `${animationId} duplicate coverage requirement ${requirement.requirementId}`);
    ids.add(requirement.requirementId);
    const disposition = rendererDisposition(requirement, rendererAudit, animationId);
    if (disposition.classification === "fully-renderable-current-javascript-requirement") {
      completeRequirements.push(await validateCapture({
        projectRoot,
        animationId,
        requirement,
        manifest,
        coveragePath,
        coverageSha256,
        rendererAuditPath,
        rendererAuditSha256,
        currentClosure,
        classification: disposition.classification,
      }));
    } else if (disposition.classification === "supplemental-partial-current-javascript-capture") {
      partialRequirements.push({
        ...await validateCapture({
          projectRoot,
          animationId,
          requirement,
          manifest,
          coveragePath,
          coverageSha256,
          rendererAuditPath,
          rendererAuditSha256,
          currentClosure,
          classification: disposition.classification,
        }),
        unresolvedFrames: requirement.unresolvedFrames ?? null,
        selectionSha256: requirement.selectionSha256 ?? null,
        rendererEndpointDisposition: disposition.endpointProbes,
      });
    } else {
      invariant(!requirement.captureManifest, `${animationId}/${requirement.requirementId} has a capture but is neither fully renderable nor an explicit partial path`);
      blockedRequirements.push(blockedRequirementRecord(requirement, disposition));
    }
  }
  const completeFrames = completeRequirements.reduce((sum, requirement) => sum + requirement.frameSet.frameCount, 0);
  const partialFrames = partialRequirements.reduce((sum, requirement) => sum + requirement.frameSet.frameCount, 0);
  const completePngBytes = completeRequirements.reduce((sum, requirement) => sum + requirement.frameSet.totalPngBytes, 0);
  const partialPngBytes = partialRequirements.reduce((sum, requirement) => sum + requirement.frameSet.totalPngBytes, 0);
  return {
    animationId,
    bindings: {
      manifest: {path: portable(projectRoot, manifestPath), bytes: manifestRecord.bytes.length, sha256: digest(manifestRecord.bytes)},
      coverage: {path: portable(projectRoot, coveragePath), bytes: coverageRecord.bytes.length, sha256: coverageSha256},
      rendererAudit: {
        path: portable(projectRoot, rendererAuditPath),
        bytes: rendererAuditRecord.bytes.length,
        sha256: rendererAuditSha256,
        status: rendererAudit.status,
        sourceBindingsRehashed: rendererSourceBindings,
      },
      implementationArtifactClosure: {
        artifactCount: currentClosure.artifactCount,
        projectionCount: currentClosure.projectionCount,
        totalBytes: currentClosure.totalBytes,
        aggregateSha256: currentClosure.aggregateSha256,
      },
    },
    nativeStage: manifest.runtime.stage,
    summary: {
      coverageRequirementCount: coverage.requirements.length,
      fullyRenderableRequirementCount: completeRequirements.length,
      fullyRenderableCapturedRequirementCount: completeRequirements.length,
      fullyRenderableFrameCount: completeFrames,
      fullyRenderablePngBytes: completePngBytes,
      fullyRenderableLanguageCounts: {
        en: completeRequirements.filter(({language}) => language === "en").length,
        es: completeRequirements.filter(({language}) => language === "es").length,
      },
      partialRequirementCount: partialRequirements.length,
      partialFrameCount: partialFrames,
      partialPngBytes,
      blockedRequirementCount: blockedRequirements.length,
    },
    completeRequirements,
    partialRequirements,
    blockedRequirements,
    authority: {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
    },
  };
}

function aggregateFrameRows(pilots, key) {
  const rows = [];
  for (const pilot of pilots) {
    for (const requirement of pilot[key]) {
      for (const frame of requirement.frameSet.frames) {
        rows.push({
          animationId: pilot.animationId,
          requirementId: requirement.requirementId,
          frame: frame.frame,
          file: frame.file,
          bytes: frame.bytes,
          sha256: frame.sha256,
        });
      }
    }
  }
  return rows;
}

export async function buildReport({projectRoot = defaultProjectRoot} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const pilots = [];
  for (const {id: animationId} of PILOT_MIGRATIONS) pilots.push(await inspectPilot({projectRoot: resolvedRoot, animationId}));
  const generatorBytes = await readFile(scriptPath);
  const pilotDefinitionPath = path.join(resolvedRoot, "scripts", "scaffold-pilot-migrations.mjs");
  const pilotDefinitionRecord = await readRegularFile(pilotDefinitionPath, "pilot definition source");
  const completeFrameRows = aggregateFrameRows(pilots, "completeRequirements");
  const partialFrameRows = aggregateFrameRows(pilots, "partialRequirements");
  const summary = {
    pilotCount: pilots.length,
    coverageRequirementCount: pilots.reduce((sum, pilot) => sum + pilot.summary.coverageRequirementCount, 0),
    fullyRenderableRequirementCount: pilots.reduce((sum, pilot) => sum + pilot.summary.fullyRenderableRequirementCount, 0),
    fullyRenderableCapturedRequirementCount: pilots.reduce((sum, pilot) => sum + pilot.summary.fullyRenderableCapturedRequirementCount, 0),
    fullyRenderableFrameCount: completeFrameRows.length,
    fullyRenderablePngBytes: completeFrameRows.reduce((sum, frame) => sum + frame.bytes, 0),
    fullyRenderableLanguageCounts: {
      en: pilots.reduce((sum, pilot) => sum + pilot.summary.fullyRenderableLanguageCounts.en, 0),
      es: pilots.reduce((sum, pilot) => sum + pilot.summary.fullyRenderableLanguageCounts.es, 0),
    },
    partialRequirementCount: pilots.reduce((sum, pilot) => sum + pilot.summary.partialRequirementCount, 0),
    partialFrameCount: partialFrameRows.length,
    partialPngBytes: partialFrameRows.reduce((sum, frame) => sum + frame.bytes, 0),
    blockedRequirementCount: pilots.reduce((sum, pilot) => sum + pilot.summary.blockedRequirementCount, 0),
    captureManifestCountRehashed: pilots.reduce((sum, pilot) => sum + pilot.completeRequirements.length + pilot.partialRequirements.length, 0),
    pngCountRehashed: completeFrameRows.length + partialFrameRows.length,
    allFullyRenderableRequirementsCaptured: pilots.every((pilot) => pilot.summary.fullyRenderableRequirementCount === pilot.summary.fullyRenderableCapturedRequirementCount),
    validationErrorCount: 0,
  };
  invariant(summary.coverageRequirementCount === summary.fullyRenderableRequirementCount + summary.partialRequirementCount + summary.blockedRequirementCount, "global requirement disposition counts do not reconcile");
  return {
    schemaVersion: 1,
    evidenceType: "pilot-renderable-current-javascript-implementation-capture-index",
    scope: "all-16-pilots-all-explicit-coverage-requirements",
    status: "complete-current-implementation-side-index-non-authoritative",
    generatedMarker: "deterministic-no-wall-clock",
    authorityStatement: [
      "This report independently re-hashes every indexed capture manifest and PNG, decodes every PNG at the native stage, validates deterministic capture identity and empty diagnostics, recomputes the current implementation artifact closure, and re-hashes each coverage and renderer-audit binding.",
      "Fully renderable means the current pure-renderer audit reports renderable-exact at both endpoints of the complete declared frame domain for the exact scenario and language; it is implementation-side evidence only.",
      "The separately listed GS002 partial path is not a complete requirement and never contributes to the 68 fully-renderable requirements or 10,790 fully-renderable frames.",
      "This report does not create or adopt an Adobe/original-runtime baseline, RMSE metrics, audio acceptance, behavior acceptance, product acceptance, human review, owner acceptance, a strict-validator pass, or migration completion.",
    ],
    generatedBy: {path: portable(resolvedRoot, scriptPath), bytes: generatorBytes.length, sha256: digest(generatorBytes)},
    pilotDefinition: {path: portable(resolvedRoot, pilotDefinitionPath), bytes: pilotDefinitionRecord.bytes.length, sha256: digest(pilotDefinitionRecord.bytes)},
    summary,
    aggregateEvidence: {
      fullyRenderableFrameRowsSha256: digest(Buffer.from(canonicalJson(completeFrameRows))),
      partialFrameRowsSha256: digest(Buffer.from(canonicalJson(partialFrameRows))),
      allRehashedFrameRowsSha256: digest(Buffer.from(canonicalJson([...completeFrameRows, ...partialFrameRows]))),
    },
    pilots,
    authorityEffects: {
      authoritativeOriginalRuntimeBaselineEstablished: false,
      baselineCaptureManifestAdopted: false,
      rmseComputedOrAccepted: false,
      audioAcceptanceRecorded: false,
      behaviorAcceptanceRecorded: false,
      productAcceptanceRecorded: false,
      humanVisualReviewRecorded: false,
      ownerAcceptanceRecorded: false,
      strictAcceptanceChanged: false,
      strictValidatorChanged: false,
      migrationStatusChanged: false,
      currentJavascriptApprovalChanged: false,
      protectedVb004PinsChanged: false,
      completionLedgerChanged: false,
      routeOrRendererChanged: false,
    },
    strictAcceptanceEffect: false,
  };
}

export function renderMarkdown(report) {
  const lines = [
    "# Pilot renderable implementation-capture index",
    "",
    "This is a deterministic, acceptance-neutral index of current JavaScript implementation captures. It is not an original-runtime baseline, RMSE result, human review, owner acceptance, or strict migration completion record.",
    "",
    "## Verified current state",
    "",
    "| Measure | Verified value |",
    "|---|---:|",
    `| Pilot workspaces | ${report.summary.pilotCount} |`,
    `| Coverage requirements inspected | ${report.summary.coverageRequirementCount} |`,
    `| Fully renderable requirements with complete captures | ${report.summary.fullyRenderableCapturedRequirementCount}/${report.summary.fullyRenderableRequirementCount} |`,
    `| Fully renderable PNG frames re-hashed and decoded | ${report.summary.fullyRenderableFrameCount.toLocaleString("en-US")} |`,
    `| Fully renderable EN requirements | ${report.summary.fullyRenderableLanguageCounts.en} |`,
    `| Fully renderable ES requirements | ${report.summary.fullyRenderableLanguageCounts.es} |`,
    `| Supplemental partial requirements | ${report.summary.partialRequirementCount} |`,
    `| Supplemental partial PNG frames | ${report.summary.partialFrameCount.toLocaleString("en-US")} |`,
    `| Blocked or not fully renderable requirements | ${report.summary.blockedRequirementCount} |`,
    `| Capture manifests re-hashed | ${report.summary.captureManifestCountRehashed} |`,
    `| Total PNGs re-hashed and decoded | ${report.summary.pngCountRehashed.toLocaleString("en-US")} |`,
    "",
    "## Per-pilot implementation-side coverage",
    "",
    "| Animation | Requirements | Fully renderable | Frames | EN | ES | Partial | Blocked |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const pilot of report.pilots) {
    lines.push(`| ${pilot.animationId} | ${pilot.summary.coverageRequirementCount} | ${pilot.summary.fullyRenderableCapturedRequirementCount}/${pilot.summary.fullyRenderableRequirementCount} | ${pilot.summary.fullyRenderableFrameCount.toLocaleString("en-US")} | ${pilot.summary.fullyRenderableLanguageCounts.en} | ${pilot.summary.fullyRenderableLanguageCounts.es} | ${pilot.summary.partialRequirementCount} | ${pilot.summary.blockedRequirementCount} |`);
  }
  lines.push("", "## Supplemental partial path", "");
  const partials = report.pilots.flatMap((pilot) => pilot.partialRequirements.map((requirement) => ({animationId: pilot.animationId, ...requirement})));
  if (partials.length === 0) lines.push("No supplemental partial implementation capture is present.");
  else {
    for (const partial of partials) {
      const unresolved = partial.unresolvedFrames
        ? ` Unresolved source-dependent frames remain ${partial.unresolvedFrames.firstFrame}-${partial.unresolvedFrames.lastFrame}.`
        : "";
      lines.push(`- \`${partial.animationId}\` / \`${partial.requirementId}\`: ${partial.frameSet.frameCount} current-JavaScript frames, excluded from complete counts.${unresolved}`);
    }
  }
  lines.push(
    "",
    "## Authority boundary",
    "",
    "All original-runtime baseline, RMSE, audio, behavior, product, human, owner, strict-validator, status, approval, protected-pin, ledger, and route effects remain false. The source files, migration manifests, renderers, routes, reviews, approvals, and completion ledger are not modified by this report.",
    "",
    `Fully renderable frame-row aggregate SHA-256: \`${report.aggregateEvidence.fullyRenderableFrameRowsSha256}\``,
    "",
  );
  return `${lines.join("\n")}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, projectRoot: defaultProjectRoot, jsonOutput: defaultJsonOutput, markdownOutput: defaultMarkdownOutput};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json-output") {
      const value = argv[++index];
      invariant(value, "--json-output requires a value");
      options.jsonOutput = path.resolve(value);
    } else if (argument === "--markdown-output") {
      const value = argv[++index];
      invariant(value, "--markdown-output requires a value");
      options.markdownOutput = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function resolveReportOutput(projectRoot, declaredPath, label) {
  invariant(typeof declaredPath === "string" && declaredPath.trim(), `${label} must be a non-empty path`);
  return path.isAbsolute(declaredPath)
    ? path.resolve(declaredPath)
    : path.resolve(projectRoot, declaredPath);
}

async function assertRegularReportTarget(filePath, label) {
  const metadata = await lstat(filePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || metadata.isFile(), `${label} must be missing or an existing regular file`);
}

export async function assertSafePilotReportOutputs({
  projectRoot = defaultProjectRoot,
  jsonOutput = defaultJsonOutput,
  markdownOutput = defaultMarkdownOutput,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const outputs = {
    projectRoot: resolvedRoot,
    jsonOutput: resolveReportOutput(resolvedRoot, jsonOutput, "JSON output"),
    markdownOutput: resolveReportOutput(resolvedRoot, markdownOutput, "Markdown output"),
  };
  await Promise.all([
    (async () => {
      await assertSafeReportOutput(outputs.jsonOutput, {root: resolvedRoot, extension: ".json"});
      await assertRegularReportTarget(outputs.jsonOutput, "JSON output");
    })(),
    (async () => {
      await assertSafeReportOutput(outputs.markdownOutput, {root: resolvedRoot, extension: ".md"});
      await assertRegularReportTarget(outputs.markdownOutput, "Markdown output");
    })(),
  ]);
  return outputs;
}

export async function writeOrCheckPilotReports({
  projectRoot = defaultProjectRoot,
  jsonOutput = defaultJsonOutput,
  markdownOutput = defaultMarkdownOutput,
  expectedJson,
  expectedMarkdown,
  check = false,
} = {}) {
  invariant(typeof expectedJson === "string", "expectedJson must be a string");
  invariant(typeof expectedMarkdown === "string", "expectedMarkdown must be a string");
  const outputs = await assertSafePilotReportOutputs({projectRoot, jsonOutput, markdownOutput});
  await Promise.all([
    writeOrCheckReport(outputs.jsonOutput, expectedJson, {
      root: outputs.projectRoot,
      extension: ".json",
      check,
    }),
    writeOrCheckReport(outputs.markdownOutput, expectedMarkdown, {
      root: outputs.projectRoot,
      extension: ".md",
      check,
    }),
  ]);
  return outputs;
}

function usage() {
  return `Usage: node scripts/build-pilot-renderable-implementation-capture-index.mjs [options]\n\nOptions:\n  --check                    Verify both checked-in reports without writing\n  --json-output <path>       Override JSON output inside project reports/\n  --markdown-output <path>   Override Markdown output inside project reports/\n  --help                     Show this help\n\nThe command reads and re-hashes current implementation evidence only. It never\nchanges migrations, sources, renderers, routes, reviews, approvals, protected\npins, statuses, or the completion ledger.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const outputs = await assertSafePilotReportOutputs(options);
  const report = await buildReport({projectRoot: options.projectRoot});
  const expectedJson = jsonText(report);
  const expectedMarkdown = renderMarkdown(report);
  await writeOrCheckPilotReports({
    ...outputs,
    expectedJson,
    expectedMarkdown,
    check: options.check,
  });
  process.stdout.write(`${options.check ? "CHECK" : "WROTE"} ${portable(outputs.projectRoot, outputs.jsonOutput)} and ${portable(outputs.projectRoot, outputs.markdownOutput)}: ${report.summary.fullyRenderableCapturedRequirementCount}/${report.summary.fullyRenderableRequirementCount} fully renderable requirements, ${report.summary.fullyRenderableFrameCount} frames, ${report.summary.partialRequirementCount} partial\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
