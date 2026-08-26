#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { comparePngFiles } from "./compare-images.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const FRAME_FILE_PATTERN = /^frame-(\d+)\.png$/;
const DEFAULT_STATIC_THRESHOLD = 0.05;
const DEFAULT_TRANSITION_THRESHOLD = 0.08;
const DEFAULT_PIXEL_THRESHOLD = 0.1;
const BASELINE_AUTHORITIES = new Set([
  "original-runtime-natural-trace",
  "original-runtime-direct-seek",
  "original-runtime-frame-step",
  "original-runtime-root-only",
  "implementation-candidate",
  "derived-candidate",
]);

export function validateSequentialFrameStepSemantics({
  baselineAuthority,
  capture,
  frameDomainId,
  frameDomainKind,
  scenarioKind,
}) {
  if (baselineAuthority !== "original-runtime-frame-step") return true;
  if (frameDomainKind !== "root") throw new Error("original-runtime-frame-step comparison is permitted only for a root frame domain");
  if (scenarioKind === "interactive") throw new Error("original-runtime-frame-step comparison cannot satisfy an interactive scenario");
  if (capture?.traceEntryMode !== "original-runtime-root-entry") {
    throw new Error("frame-step baseline capture.traceEntryMode must be original-runtime-root-entry");
  }
  if (capture?.frameCaptureMode !== "deterministic-sequential-step") {
    throw new Error("frame-step baseline capture.frameCaptureMode must be deterministic-sequential-step");
  }
  const entryTrace = Array.isArray(capture?.entryTrace) ? capture.entryTrace : [];
  if (!entryTrace.length) throw new Error("frame-step baseline capture.entryTrace must document root entry");
  for (const [index, step] of entryTrace.entries()) {
    if (step.order !== index + 1 || !String(step.action || "").trim()) {
      throw new Error("frame-step baseline capture.entryTrace must use sequential order values and non-empty actions");
    }
  }
  if (entryTrace.at(-1)?.resultingFrameDomainId !== frameDomainId) {
    throw new Error("frame-step baseline capture.entryTrace must terminate in the requested root frame domain");
  }
  return true;
}

function usage() {
  return `Usage:
  npm run compare:full-frames -- \\
    --id <animation-id> \\
    --baseline <directory> \\
    --implementation <directory> [options]

Options:
  --scenario <id>             Scenario ID (default: default)
  --lang <en|es>              Language (default: en)
  --seed <value>              Deterministic seed (default: 0)
  --requirement-id <id>       Coverage requirement ID (domain-aware metrics v2)
  --frame-domain <id>         Declared frame-domain ID (domain-aware metrics v2)
  --trace <id>                Reachable trace ID (domain-aware metrics v2)
  --entry-state-sha256 <hash> Canonical trace entry-state SHA-256 (metrics v2)
  --baseline-authority <kind> Baseline authority paired to this exact trace
  --baseline-manifest <file>  Hash-bound original-runtime baseline manifest
  --implementation-manifest <file>
                              Hash-bound Next.js capture manifest
  --transition-frames <list>  Comma-separated frames/ranges, e.g. 8,12-16
  --static-threshold <0..1>   Static-frame RMSE gate (default: 0.05)
  --transition-threshold <0..1> Transition-frame RMSE gate (default: 0.08)
  --pixel-threshold <0..1>    Pixelmatch color threshold (default: 0.1)
  --help                      Show this help

The migration manifest supplies the native stage and expected frame count.
Diff PNGs are written only below artifacts/full-frame/comparisons/. The tracked
metrics file is migrations/<animation-id>/evidence/full-frame-comparison-<scenario>-<lang>.json.`;
}

function numberOption(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${label} must be between 0 and 1`);
  }
  return parsed;
}

function safeSegment(value, label) {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error(`${label} may contain only letters, numbers, dot, underscore, and hyphen`);
  }
  return value;
}

export function parseArguments(argumentsList) {
  const options = {
    scenario: "default",
    language: "en",
    seed: "0",
    staticThreshold: DEFAULT_STATIC_THRESHOLD,
    transitionThreshold: DEFAULT_TRANSITION_THRESHOLD,
    pixelThreshold: DEFAULT_PIXEL_THRESHOLD,
    transitionFrames: new Set(),
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if ([
      "--id",
      "--baseline",
      "--implementation",
      "--scenario",
      "--lang",
      "--seed",
      "--requirement-id",
      "--frame-domain",
      "--trace",
      "--entry-state-sha256",
      "--baseline-authority",
      "--baseline-manifest",
      "--implementation-manifest",
      "--transition-frames",
      "--static-threshold",
      "--transition-threshold",
      "--pixel-threshold",
    ].includes(value)) {
      const next = argumentsList[index + 1];
      if (next === undefined || next === "") throw new Error(`${value} requires a value`);
      if (value === "--id") options.animationId = next;
      else if (value === "--baseline") options.baselineDirectory = path.resolve(next);
      else if (value === "--implementation") options.implementationDirectory = path.resolve(next);
      else if (value === "--scenario") options.scenario = next;
      else if (value === "--lang") options.language = next;
      else if (value === "--seed") options.seed = next;
      else if (value === "--requirement-id") options.requirementId = next;
      else if (value === "--frame-domain") options.frameDomainId = next;
      else if (value === "--trace") options.traceId = next;
      else if (value === "--entry-state-sha256") options.entryStateSha256 = next;
      else if (value === "--baseline-authority") options.baselineAuthority = next;
      else if (value === "--baseline-manifest") options.baselineManifest = path.resolve(next);
      else if (value === "--implementation-manifest") options.implementationManifest = path.resolve(next);
      else if (value === "--transition-frames") options.transitionFrames = parseFrameSelection(next);
      else if (value === "--static-threshold") options.staticThreshold = numberOption(next, value);
      else if (value === "--transition-threshold") options.transitionThreshold = numberOption(next, value);
      else options.pixelThreshold = numberOption(next, value);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }

  if (!options.help) {
    if (!options.animationId) throw new Error("--id is required");
    if (!options.baselineDirectory) throw new Error("--baseline is required");
    if (!options.implementationDirectory) throw new Error("--implementation is required");
    safeSegment(options.animationId, "--id");
    safeSegment(options.scenario, "--scenario");
    safeSegment(options.language, "--lang");
    const domainAwareValues = [
      options.requirementId,
      options.frameDomainId,
      options.traceId,
      options.entryStateSha256,
      options.baselineAuthority,
      options.baselineManifest,
      options.implementationManifest,
    ];
    if (domainAwareValues.some(Boolean) && !domainAwareValues.every(Boolean)) {
      throw new Error("--requirement-id, --frame-domain, --trace, --entry-state-sha256, --baseline-authority, --baseline-manifest, and --implementation-manifest must be supplied together");
    }
    if (options.requirementId) {
      safeSegment(options.requirementId, "--requirement-id");
      safeSegment(options.frameDomainId, "--frame-domain");
      safeSegment(options.traceId, "--trace");
      if (!/^[a-f0-9]{64}$/.test(options.entryStateSha256)) throw new Error("--entry-state-sha256 must be a lowercase 64-character SHA-256");
      if (!BASELINE_AUTHORITIES.has(options.baselineAuthority)) throw new Error("--baseline-authority is invalid");
    }
  }

  return options;
}

export function parseFrameSelection(value) {
  const frames = new Set();
  for (const token of value.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) throw new Error("Transition frame list contains an empty item");
    const range = /^(\d+)-(\d+)$/.exec(trimmed);
    if (range) {
      const first = Number(range[1]);
      const last = Number(range[2]);
      if (first < 1 || last < first) throw new Error(`Invalid transition frame range: ${trimmed}`);
      for (let frame = first; frame <= last; frame += 1) frames.add(frame);
      continue;
    }
    if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1) {
      throw new Error(`Invalid transition frame: ${trimmed}`);
    }
    frames.add(Number(trimmed));
  }
  return frames;
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function evidencePath(candidate, root) {
  const absolute = path.resolve(candidate);
  return isInside(absolute, root) ? portable(path.relative(root, absolute)) : portable(absolute);
}

async function resolveCoverageEvidence(value, roots) {
  if (!value || typeof value !== "string") return null;
  const candidates = path.isAbsolute(value) ? [value] : roots.map((root) => path.resolve(root, value));
  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return null;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function directoryDigest(frames) {
  return sha256(frames.map(({ frame, sha256: digest }) => `${frame}\0${digest}\n`).join(""));
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return {
    min: sorted[0],
    max: sorted.at(-1),
    mean: total / sorted.length,
    median,
    p95: sorted[p95Index],
  };
}

async function inspectFrameDirectory(directory, expectedFrameCount, stage, label) {
  const entries = await readdir(directory, { withFileTypes: true });
  const byFrame = new Map();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = FRAME_FILE_PATTERN.exec(entry.name);
    if (!match) continue;
    const frame = Number(match[1]);
    if (frame < 1) throw new Error(`${label} contains non-one-indexed frame file: ${entry.name}`);
    if (byFrame.has(frame)) {
      throw new Error(`${label} contains duplicate frame ${frame}: ${byFrame.get(frame).name} and ${entry.name}`);
    }
    byFrame.set(frame, { frame, name: entry.name, file: path.join(directory, entry.name) });
  }

  if (byFrame.size === 0) throw new Error(`${label} contains no files matching frame-<number>.png`);
  if (byFrame.size !== expectedFrameCount) {
    throw new Error(`${label} contains ${byFrame.size} frames; expected ${expectedFrameCount}`);
  }

  const inspected = [];
  for (let frame = 1; frame <= expectedFrameCount; frame += 1) {
    const item = byFrame.get(frame);
    if (!item) throw new Error(`${label} is missing frame ${frame}`);
    const bytes = await readFile(item.file);
    let image;
    try {
      image = PNG.sync.read(bytes);
    } catch (error) {
      throw new Error(`${label} frame ${frame} is not a decodable PNG: ${error.message}`);
    }
    if (image.width !== stage.width || image.height !== stage.height) {
      throw new Error(
        `${label} frame ${frame} is ${image.width}x${image.height}; expected native stage ${stage.width}x${stage.height}`,
      );
    }
    inspected.push({
      ...item,
      width: image.width,
      height: image.height,
      sha256: sha256(bytes),
    });
  }
  return inspected;
}

async function resolveDeclaredFrameFile(value, { manifestFile, frameDirectory, projectDirectory }) {
  if (!value || typeof value !== "string") return null;
  const candidates = path.isAbsolute(value)
    ? [value]
    : [
      path.resolve(path.dirname(manifestFile), value),
      path.resolve(frameDirectory, value),
      path.resolve(projectDirectory, value),
    ];
  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return null;
}

async function inspectDeclaredFrameManifest({
  role,
  manifestFile,
  inspectedFrames,
  frameDirectory,
  projectDirectory,
  animationId,
  requirementId,
  frameDomainId,
  traceId,
  entryStateSha256,
  scenario,
  language,
  seed,
  baselineAuthority,
  frameDomainKind,
  scenarioKind,
}) {
  const resolvedManifest = path.resolve(manifestFile);
  const bytes = await readFile(resolvedManifest);
  let manifest;
  try {
    manifest = JSON.parse(bytes);
  } catch (error) {
    throw new Error(`${role} capture manifest is invalid JSON: ${error.message}`);
  }
  const isBaseline = role === "Baseline";
  if (isBaseline) {
    if (
      manifest.schemaVersion !== 2 || manifest.status !== "complete" ||
      manifest.evidenceType !== "original-runtime-frame-domain-baseline"
    ) throw new Error("Baseline capture manifest must be schemaVersion 2 complete original-runtime-frame-domain-baseline evidence");
    if (manifest.baselineAuthority !== baselineAuthority) throw new Error("Baseline capture manifest authority does not match the requested authority");
    validateSequentialFrameStepSemantics({
      baselineAuthority,
      capture: manifest.capture,
      frameDomainId,
      frameDomainKind,
      scenarioKind,
    });
  } else if (manifest.schemaVersion !== IMPLEMENTATION_CAPTURE_SCHEMA_VERSION || manifest.status !== "complete") {
    const detail = manifest.schemaVersion < IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
      ? `legacy schemaVersion ${manifest.schemaVersion ?? "missing"} captures are prereview-only`
      : `schemaVersion ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION} complete evidence is required`;
    throw new Error(`Implementation capture manifest is not strict-comparison eligible: ${detail}`);
  } else {
    const generatorErrors = implementationCaptureGeneratorProvenanceErrors(manifest.generatorProvenance);
    if (generatorErrors.length) throw new Error(`Implementation capture generator provenance is invalid: ${generatorErrors.join("; ")}`);
    const closureErrors = implementationArtifactClosureErrors(manifest.implementationArtifactClosure);
    if (closureErrors.length) throw new Error(`Implementation capture artifact closure is invalid: ${closureErrors.join("; ")}`);
    if (!isUnambiguousLoopbackHttpUrl(manifest.sourceUrl)) {
      throw new Error("Implementation capture sourceUrl must be an unambiguous credential-free loopback http URL");
    }
  }
  if (!isBaseline && (
    manifest.captureStageAttribute !== "data-capture-stage" ||
    manifest.reportedRenderStateAttribute !== "data-render-state" ||
    manifest.reportedVisualTargetAttribute !== "data-render-visual" ||
    manifest.requiredRenderState !== "ready"
  )) {
    throw new Error("Implementation capture manifest does not declare the renderer-ready visual contract");
  }
  for (const [field, actual, expected] of [
    ["animationId", manifest.animationId, animationId],
    ["requirementId", manifest.requirementId, requirementId],
    ["frameDomainId", manifest.frameDomainId, frameDomainId],
    ["traceId", manifest.traceId, traceId],
    ["entryStateSha256", manifest.entryStateSha256, entryStateSha256],
    ["scenario", manifest.scenario, scenario],
    ["language", manifest.language, language],
    ["seed", String(manifest.seed), String(seed)],
  ]) {
    if (actual !== expected) throw new Error(`${role} capture manifest ${field} '${actual}' does not match requested '${expected}'`);
  }
  const declaredFrames = isBaseline ? manifest.frames : manifest.captured;
  if (!Array.isArray(declaredFrames) || declaredFrames.length !== inspectedFrames.length) {
    throw new Error(`${role} capture manifest must contain exactly ${inspectedFrames.length} frames`);
  }
  const byFrame = new Map(declaredFrames.map((frame) => [Number(frame.frame), frame]));
  if (byFrame.size !== declaredFrames.length) throw new Error(`${role} capture manifest contains duplicate frame identities`);
  for (const inspected of inspectedFrames) {
    const declared = byFrame.get(inspected.frame);
    if (!declared) throw new Error(`${role} capture manifest is missing frame ${inspected.frame}`);
    if (
      declared.animationId !== animationId || declared.requirementId !== requirementId || declared.frameDomainId !== frameDomainId ||
      declared.traceId !== traceId || declared.entryStateSha256 !== entryStateSha256
    ) throw new Error(`${role} capture manifest frame ${inspected.frame} identity differs from the requested trace`);
    if (!isBaseline) {
      const visual = declared.visualTarget;
      if (
        declared.reportedRenderState !== "ready" ||
        !visual || typeof visual !== "object" ||
        !String(visual.tagName || "").trim() ||
        visual.reportedRenderState !== "ready" ||
        visual.animationId !== animationId ||
        visual.reportedFrame !== inspected.frame ||
        visual.frameDomainId !== frameDomainId ||
        visual.requirementId !== requirementId ||
        visual.traceId !== traceId ||
        visual.entryStateSha256 !== entryStateSha256 ||
        visual.scenario !== scenario ||
        visual.language !== language ||
        String(visual.seed) !== String(seed)
      ) {
        throw new Error(`Implementation capture manifest frame ${inspected.frame} does not bind a ready visual renderer to the requested trace`);
      }
    }
    if (declared.sha256 !== inspected.sha256) throw new Error(`${role} capture manifest frame ${inspected.frame} SHA-256 differs from the compared PNG`);
    const declaredFile = await resolveDeclaredFrameFile(declared.file, {
      manifestFile: resolvedManifest,
      frameDirectory,
      projectDirectory,
    });
    if (!declaredFile || path.resolve(declaredFile) !== path.resolve(inspected.file)) {
      throw new Error(`${role} capture manifest frame ${inspected.frame} does not resolve to the compared PNG`);
    }
  }
  return {
    file: resolvedManifest,
    sha256: sha256(bytes),
    manifest,
  };
}

async function writeJsonAtomically(destination, value) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, destination);
}

export async function compareFrameDirectories({
  animationId,
  baselineDirectory,
  implementationDirectory,
  migrationDirectory,
  artifactsRoot,
  projectDirectory = projectRoot,
  expectedFrameCount,
  stage,
  scenario = "default",
  language = "en",
  seed = "0",
  requirementId,
  frameDomainId,
  traceId,
  entryStateSha256,
  baselineAuthority,
  baselineManifest,
  implementationManifest,
  frameDomainKind,
  scenarioKind,
  transitionFrames = new Set(),
  staticThreshold = DEFAULT_STATIC_THRESHOLD,
  transitionThreshold = DEFAULT_TRANSITION_THRESHOLD,
  pixelThreshold = DEFAULT_PIXEL_THRESHOLD,
  evidenceFile,
  generatedAt = new Date().toISOString(),
}) {
  safeSegment(animationId, "animationId");
  safeSegment(scenario, "scenario");
  safeSegment(language, "language");
  const domainAwareValues = [
    requirementId,
    frameDomainId,
    traceId,
    entryStateSha256,
    baselineAuthority,
    baselineManifest,
    implementationManifest,
  ];
  const domainAware = domainAwareValues.some(Boolean);
  if (domainAware && !domainAwareValues.every(Boolean)) {
    throw new Error("requirementId, frameDomainId, traceId, entryStateSha256, baselineAuthority, baselineManifest, and implementationManifest must be supplied together");
  }
  if (domainAware) {
    safeSegment(requirementId, "requirementId");
    safeSegment(frameDomainId, "frameDomainId");
    safeSegment(traceId, "traceId");
    if (!/^[a-f0-9]{64}$/.test(entryStateSha256)) throw new Error("entryStateSha256 must be a lowercase 64-character SHA-256");
    if (!BASELINE_AUTHORITIES.has(baselineAuthority)) throw new Error("baselineAuthority is invalid");
  }
  if (!Number.isInteger(expectedFrameCount) || expectedFrameCount < 1) {
    throw new Error("expectedFrameCount must be a positive integer");
  }
  if (!Number.isInteger(stage?.width) || stage.width < 1 || !Number.isInteger(stage?.height) || stage.height < 1) {
    throw new Error("stage width and height must be positive integers");
  }
  staticThreshold = numberOption(staticThreshold, "staticThreshold");
  transitionThreshold = numberOption(transitionThreshold, "transitionThreshold");
  pixelThreshold = numberOption(pixelThreshold, "pixelThreshold");
  if (staticThreshold > transitionThreshold) {
    throw new Error("staticThreshold must not exceed transitionThreshold");
  }
  for (const frame of transitionFrames) {
    if (!Number.isInteger(frame) || frame < 1 || frame > expectedFrameCount) {
      throw new Error(`Transition frame ${frame} is outside 1..${expectedFrameCount}`);
    }
  }

  const resolvedMigration = path.resolve(migrationDirectory);
  const resolvedArtifacts = path.resolve(artifactsRoot);
  const resolvedEvidence = path.resolve(
    evidenceFile ?? path.join(
      resolvedMigration,
      "evidence",
      domainAware
        ? `full-frame-comparison-${requirementId}.json`
        : `full-frame-comparison-${scenario}-${language}.json`,
    ),
  );
  const allowedEvidenceRoot = path.join(resolvedMigration, "evidence");
  if (!isInside(resolvedEvidence, allowedEvidenceRoot)) {
    throw new Error(`Tracked evidence JSON must be inside ${allowedEvidenceRoot}`);
  }

  // Decode and dimension-check every input before writing any output. This
  // makes a comparison report fail closed rather than retaining a partial run.
  const baselineFrames = await inspectFrameDirectory(
    path.resolve(baselineDirectory),
    expectedFrameCount,
    stage,
    "Baseline directory",
  );
  const implementationFrames = await inspectFrameDirectory(
    path.resolve(implementationDirectory),
    expectedFrameCount,
    stage,
    "Implementation directory",
  );
  const baselineManifestInfo = domainAware ? await inspectDeclaredFrameManifest({
    role: "Baseline",
    manifestFile: baselineManifest,
    inspectedFrames: baselineFrames,
    frameDirectory: path.resolve(baselineDirectory),
    projectDirectory,
    animationId,
    requirementId,
    frameDomainId,
    traceId,
    entryStateSha256,
    scenario,
    language,
    seed,
    baselineAuthority,
    frameDomainKind,
    scenarioKind,
  }) : null;
  const implementationManifestInfo = domainAware ? await inspectDeclaredFrameManifest({
    role: "Implementation",
    manifestFile: implementationManifest,
    inspectedFrames: implementationFrames,
    frameDirectory: path.resolve(implementationDirectory),
    projectDirectory,
    animationId,
    requirementId,
    frameDomainId,
    traceId,
    entryStateSha256,
    scenario,
    language,
    seed,
    baselineAuthority,
  }) : null;
  const baselineDigest = directoryDigest(baselineFrames);
  const implementationDigest = directoryDigest(implementationFrames);
  const runDigest = sha256(JSON.stringify({
    animationId,
    scenario,
    language,
    seed: String(seed),
    requirementId: requirementId || null,
    frameDomainId: frameDomainId || null,
    traceId: traceId || null,
    entryStateSha256: entryStateSha256 || null,
    baselineAuthority: baselineAuthority || null,
    baselineCaptureManifestSha256: baselineManifestInfo?.sha256 || null,
    implementationCaptureManifestSha256: implementationManifestInfo?.sha256 || null,
    baselineDigest,
    implementationDigest,
    staticThreshold,
    transitionThreshold,
    pixelThreshold,
    transitionFrames: [...transitionFrames].sort((left, right) => left - right),
  }));
  const diffDirectory = path.join(
    resolvedArtifacts,
    "comparisons",
    animationId,
    scenario,
    language,
    runDigest.slice(0, 20),
  );
  if (!isInside(diffDirectory, resolvedArtifacts)) {
    throw new Error("Diff directory escaped the ignored full-frame artifact root");
  }
  await mkdir(diffDirectory, { recursive: true });

  const frameWidth = Math.max(4, String(expectedFrameCount).length);
  const frameResults = [];
  for (let index = 0; index < expectedFrameCount; index += 1) {
    const baseline = baselineFrames[index];
    const implementation = implementationFrames[index];
    const frame = baseline.frame;
    const diff = path.join(diffDirectory, `frame-${String(frame).padStart(frameWidth, "0")}.png`);
    const comparison = await comparePngFiles(baseline.file, implementation.file, {
      diff,
      pixelThreshold,
    });
    const kind = transitionFrames.has(frame) ? "transition" : "static";
    const assignedThreshold = kind === "transition" ? transitionThreshold : staticThreshold;
    const diffBytes = await readFile(diff);
    frameResults.push({
      frame,
      ...(domainAware ? { requirementId, frameDomainId, traceId, entryStateSha256 } : {}),
      kind,
      baselineFile: evidencePath(baseline.file, projectDirectory),
      baselineSha256: baseline.sha256,
      implementationFile: evidencePath(implementation.file, projectDirectory),
      implementationSha256: implementation.sha256,
      diffFile: evidencePath(diff, projectDirectory),
      diffSha256: sha256(diffBytes),
      width: comparison.width,
      height: comparison.height,
      normalizedRmse: comparison.normalizedRmse,
      mismatchedPixels: comparison.mismatchedPixels,
      mismatchedPixelRatio: comparison.mismatchedPixelRatio,
      assignedThreshold,
      atOrBelowStaticThreshold: comparison.normalizedRmse <= staticThreshold,
      atOrBelowTransitionThreshold: comparison.normalizedRmse <= transitionThreshold,
      result: comparison.normalizedRmse <= assignedThreshold ? "pass" : "fail",
    });
  }

  const rmseValues = frameResults.map(({ normalizedRmse }) => normalizedRmse);
  const mismatchRatios = frameResults.map(({ mismatchedPixelRatio }) => mismatchedPixelRatio);
  const atOrBelowStatic = frameResults.filter(({ atOrBelowStaticThreshold }) => atOrBelowStaticThreshold);
  const atOrBelowTransition = frameResults.filter(({ atOrBelowTransitionThreshold }) => atOrBelowTransitionThreshold);
  const failingAssigned = frameResults.filter(({ result }) => result === "fail");
  const diffFrames = frameResults.map(({ frame, diffSha256: digest }) => ({ frame, sha256: digest }));
  const scriptSha256 = sha256(await readFile(scriptPath));
  const report = {
    schemaVersion: domainAware ? 2 : 1,
    ...(domainAware ? {
      status: "complete",
      requirementId,
      frameDomainId,
      traceId,
      entryStateSha256,
      baselineAuthority,
      baselineFrameDomainId: frameDomainId,
      baselineTraceId: traceId,
      baselineEntryStateSha256: entryStateSha256,
      baselineCaptureManifest: evidencePath(baselineManifestInfo.file, projectDirectory),
      baselineCaptureManifestSha256: baselineManifestInfo.sha256,
      implementationCaptureManifest: evidencePath(implementationManifestInfo.file, projectDirectory),
      implementationCaptureManifestSha256: implementationManifestInfo.sha256,
    } : {}),
    evidenceType: "full-frame-directory-comparison",
    animationId,
    scenario,
    language,
    seed: String(seed),
    generatedAt,
    generator: {
      name: "compare-frame-directories",
      script: evidencePath(scriptPath, projectDirectory),
      scriptSha256,
    },
    contract: {
      frameNumbering: "one-indexed",
      filenamePattern: "^frame-(\\d+)\\.png$",
      expectedFrameCount,
      ...(domainAware ? { requiredRange: { firstFrame: 1, lastFrame: expectedFrameCount } } : {}),
      stage,
      normalizedRmse: "sqrt(mean((baselineRGB-implementationRGB)^2))/255",
      pixelmatch: { threshold: pixelThreshold, includeAA: true },
      thresholds: {
        staticNormalizedRmse: staticThreshold,
        transitionNormalizedRmse: transitionThreshold,
      },
      transitionFrames: [...transitionFrames].sort((left, right) => left - right),
    },
    inputs: {
      baseline: {
        directory: evidencePath(path.resolve(baselineDirectory), projectDirectory),
        directorySha256: baselineDigest,
        frameCount: baselineFrames.length,
      },
      implementation: {
        directory: evidencePath(path.resolve(implementationDirectory), projectDirectory),
        directorySha256: implementationDigest,
        frameCount: implementationFrames.length,
      },
    },
    diffArchive: {
      directory: evidencePath(diffDirectory, projectDirectory),
      directorySha256: directoryDigest(diffFrames),
      frameCount: diffFrames.length,
      trackedInGit: false,
    },
    summary: {
      frameCount: frameResults.length,
      normalizedRmse: summarize(rmseValues),
      mismatchedPixelRatio: summarize(mismatchRatios),
      atOrBelowStaticThreshold: {
        threshold: staticThreshold,
        count: atOrBelowStatic.length,
        ratio: atOrBelowStatic.length / frameResults.length,
      },
      atOrBelowTransitionThreshold: {
        threshold: transitionThreshold,
        count: atOrBelowTransition.length,
        ratio: atOrBelowTransition.length / frameResults.length,
      },
      outliers: {
        aboveStaticThreshold: frameResults
          .filter(({ atOrBelowStaticThreshold }) => !atOrBelowStaticThreshold)
          .map(({ frame }) => frame),
        aboveTransitionThreshold: frameResults
          .filter(({ atOrBelowTransitionThreshold }) => !atOrBelowTransitionThreshold)
          .map(({ frame }) => frame),
        failingAssignedThreshold: failingAssigned.map(({ frame }) => frame),
      },
      allAssignedThresholdsPass: failingAssigned.length === 0,
    },
    frames: frameResults,
  };

  await writeJsonAtomically(resolvedEvidence, report);
  return { report, evidenceFile: resolvedEvidence, diffDirectory };
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const migrationDirectory = path.join(projectRoot, "migrations", options.animationId);
    const manifest = JSON.parse(await readFile(path.join(migrationDirectory, "migration.json"), "utf8"));
    if (manifest.animationId !== options.animationId) {
      throw new Error(`migration.json animationId '${manifest.animationId}' does not match --id '${options.animationId}'`);
    }
    let expectedFrameCount = manifest.runtime.frameCount;
    let frameDomainKind;
    let scenarioKind;
    if (options.frameDomainId) {
      const domain = (manifest.implementation?.frameDomains || []).find(({ id }) => id === options.frameDomainId);
      if (!domain) throw new Error(`migration.json does not declare frame domain '${options.frameDomainId}'`);
      if (!(domain.scenarioIds || []).includes(options.scenario)) {
        throw new Error(`frame domain '${options.frameDomainId}' does not declare scenario '${options.scenario}'`);
      }
      expectedFrameCount = domain.frameCount;
      frameDomainKind = domain.kind;
      scenarioKind = (manifest.scenarios || []).find(({ id }) => id === options.scenario)?.kind;
      validateSequentialFrameStepSemantics({
        baselineAuthority: options.baselineAuthority,
        capture: JSON.parse(await readFile(options.baselineManifest, "utf8")).capture,
        frameDomainId: options.frameDomainId,
        frameDomainKind,
        scenarioKind,
      });
      const coveragePath = path.join(migrationDirectory, manifest.evidence?.fullFrameCoverageFile || "evidence/full-frame-coverage.json");
      const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
      if (coverage.schemaVersion !== 2 || !Array.isArray(coverage.requirements)) {
        throw new Error("domain-aware comparison requires full-frame coverage schemaVersion 2");
      }
      const requirement = coverage.requirements.find(({ requirementId }) => requirementId === options.requirementId);
      if (!requirement) throw new Error(`coverage does not declare requirement '${options.requirementId}'`);
      for (const [field, actual, expected] of [
        ["frameDomainId", requirement.frameDomainId, options.frameDomainId],
        ["traceId", requirement.traceId, options.traceId],
        ["entryStateSha256", requirement.entryStateSha256, options.entryStateSha256],
        ["scenario", requirement.scenario, options.scenario],
        ["language", requirement.language, options.language],
        ["seed", String(requirement.seed), String(options.seed)],
      ]) if (actual !== expected) throw new Error(`coverage requirement ${field} '${actual}' does not match requested '${expected}'`);
      if (requirement.requiredRange?.firstFrame !== 1 || requirement.requiredRange?.lastFrame !== expectedFrameCount) {
        throw new Error(`coverage requirement range must be 1..${expectedFrameCount} for frame domain '${options.frameDomainId}'`);
      }
      if (
        BASELINE_AUTHORITIES.has(requirement.baselineAuthority) &&
        requirement.baselineAuthority !== options.baselineAuthority
      ) {
        throw new Error(`coverage baselineAuthority '${requirement.baselineAuthority}' does not match requested '${options.baselineAuthority}'`);
      }
      for (const [field, optionPath, expectedHash] of [
        ["baselineCaptureManifest", options.baselineManifest, requirement.baselineCaptureManifestSha256],
        ["captureManifest", options.implementationManifest, requirement.captureManifestSha256],
      ]) {
        const declaredPath = await resolveCoverageEvidence(requirement[field], [migrationDirectory, projectRoot]);
        if (!declaredPath) throw new Error(`coverage ${field} does not exist (${requirement[field] || "empty"})`);
        if (path.resolve(declaredPath) !== path.resolve(optionPath)) {
          throw new Error(`requested ${field} does not match the coverage requirement`);
        }
        const observedHash = sha256(await readFile(declaredPath));
        if (observedHash !== expectedHash) throw new Error(`coverage ${field}Sha256 does not match its file`);
      }
    }
    const result = await compareFrameDirectories({
      ...options,
      migrationDirectory,
      artifactsRoot: path.join(projectRoot, "artifacts", "full-frame"),
      expectedFrameCount,
      stage: manifest.runtime.stage,
      frameDomainKind,
      scenarioKind,
    });
    console.log(JSON.stringify({
      evidenceFile: evidencePath(result.evidenceFile, projectRoot),
      diffDirectory: evidencePath(result.diffDirectory, projectRoot),
      summary: result.report.summary,
    }, null, 2));
    if (!result.report.summary.allAssignedThresholdsPass) process.exitCode = 2;
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
