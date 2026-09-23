#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const REPORT_TYPE = "current-javascript-engineering-candidate";
const SAFE_ADAPTER_BUILDER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const HUMAN_APPROVAL = "reports/current-javascript-output-human-approval.json";
const AUTOPLAY_EVIDENCE_MATERIALIZER =
  "scripts/materialize-g4-l3-source-static-autoplay-evidence.mjs";
const SOURCE_OPERATION_INDEX =
  "reports/g4-l3-source-operation-index-v2.json";
const SOURCE_STATIC_AUTOPLAY_CONTRACT =
  "packages/demos/src/g4-l3-source-static-autoplay-contract.ts";

const EXPECTED_TOOLS = Object.freeze({
  ffdec: Object.freeze({
    invokedPath: "/opt/homebrew/bin/ffdec",
    versionArgs: Object.freeze(["-help"]),
    version: "JPEXS Free Flash Decompiler v.26.2.1",
    executableSha256:
      "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  }),
  chromium: Object.freeze({
    invokedPath:
      "/Users/peter/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    version: "149.0.7827.55",
    executableSha256:
      "b1b9e2dd063115031f08eadc10ed381ca0fa05b2284baff8f721d87f5f0f61b7",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorized",
  "authoritativeOriginalRuntimeComplete",
  "naturalRuntimeReachabilityComplete",
  "frameDomainDispositionComplete",
  "bilingualVisualParityComplete",
  "audioAccepted",
  "replayParityComplete",
  "fullFrameRmseComplete",
  "behaviorComplete",
  "productQaComplete",
  "accessibilityQaComplete",
  "humanVisualReviewAccepted",
  "ownerAccepted",
  "strictMigrationComplete",
]);

const AUTHORIZATION_KEYS = Object.freeze([
  "strictImplementationAuthorized",
  "completionLedgerWriteAuthorized",
  "approvalOrPinWriteAuthorized",
  "productRouteWriteAuthorized",
  "publicStrictLibraryAdmissionAuthorized",
  "sourceAssetWriteAuthorized",
  "audioEnablementAuthorized",
  "hostActionScriptEnablementAuthorized",
  "rootRuntimeEnablementAuthorized",
  "companionRuntimeEnablementAuthorized",
  "visualParityClaimAuthorized",
  "migrationCompletionClaimAuthorized",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function blockedLocalFrameRanges(spec) {
  return spec.sourceBehaviorBoundary?.mainFrameBehaviorDependentRanges ?? [];
}

function blockedLocalFrameCount(spec) {
  return blockedLocalFrameRanges(spec).reduce(
    (count, range) => count + range.lastFrame - range.firstFrame + 1,
    0,
  );
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the repository: ${relativePath}`);
  return resolved;
}

function validateBoundFile(value, label, {optional = false} = {}) {
  if (optional && value == null) return null;
  invariant(value && typeof value.path === "string" &&
    Number.isSafeInteger(value.bytes) && value.bytes >= 0 &&
    /^[a-f0-9]{64}$/.test(value.sha256 ?? ""),
  `${label} binding is invalid`);
  return value;
}

export function validateSourceStaticCandidateSpec(spec) {
  invariant(spec?.schemaVersion === 1,
    "source-static candidate spec schemaVersion must be 1");
  invariant(/^course-g04-l03-[a-z0-9-]+$/.test(spec.animationId ?? ""),
    "source-static candidate animationId is invalid");
  invariant(spec.reportType === REPORT_TYPE,
    "source-static candidate reportType is invalid");
  invariant(spec.batch?.lesson === "G4 L3" &&
    ["batch-001", "batch-002"].includes(spec.batch.batchId) &&
    Number.isSafeInteger(spec.batch.batchOrdinal),
  "source-static candidate batch identity is invalid");
  validateBoundFile(spec.source?.swf, "source SWF");
  validateBoundFile(spec.source?.fla, "source FLA", {optional: true});
  validateBoundFile(spec.source?.associatedAudio, "associated audio", {optional: true});
  validateBoundFile(spec.evidence?.sourceAudit, "source audit");
  validateBoundFile(spec.evidence?.authoringAudit, "authoring audit", {optional: true});
  validateBoundFile(spec.evidence?.mutedRandomVisualDisposition,
    "muted-random visual disposition", {optional: true});
  validateBoundFile(spec.evidence?.sourceLocalQuizContract,
    "source-local quiz contract", {optional: true});
  validateBoundFile(spec.evidence?.sourceLocalNumberLineQuizContract,
    "source-local number-line quiz contract", {optional: true});
  validateBoundFile(spec.evidence?.sourceLocalPatternQuizContract,
    "source-local pattern quiz contract", {optional: true});
  validateBoundFile(spec.evidence?.sourceLocalGameContract,
    "source-local game contract", {optional: true});
  invariant(spec.timeline?.stage?.width === 800 &&
    spec.timeline.stage.height === 600 && spec.timeline.fps === 12 &&
    /^#[a-fA-F0-9]{6}$/.test(spec.timeline.stage.backgroundColor ?? ""),
  "source-static candidate stage metadata is invalid");
  invariant(Number.isSafeInteger(spec.timeline.root?.frameCount) &&
    Number.isSafeInteger(spec.timeline.root?.beginFrame) &&
    spec.timeline.root.beginFrame >= 1 &&
    spec.timeline.root.beginFrame <= spec.timeline.root.frameCount,
  "source-static candidate root metadata is invalid");
  invariant(/^sprite-\d+$/.test(spec.timeline.local?.frameDomain ?? "") &&
    Number.isSafeInteger(spec.timeline.local?.frameCount) &&
    spec.timeline.local.frameCount > 0,
  "source-static candidate local timeline is invalid");
  invariant(Array.isArray(spec.timeline.companionDomains) &&
    spec.timeline.companionDomains.every((domain) =>
      /^sprite-\d+$/.test(domain.id ?? "") &&
      Number.isSafeInteger(domain.frameCount) && domain.frameCount > 0),
  "source-static candidate companion domains are invalid");
  const allDomains = [
    "root",
    spec.timeline.local.frameDomain,
    ...spec.timeline.companionDomains.map((domain) => domain.id),
  ];
  invariant(new Set(allDomains).size === allDomains.length,
    "source-static candidate frame domains must be unique");
  if (spec.sourceBehaviorBoundary !== undefined) {
    const boundary = spec.sourceBehaviorBoundary;
    invariant(boundary && typeof boundary === "object" &&
      Number.isSafeInteger(boundary.random?.occurrences) &&
      boundary.random.occurrences >= 0 &&
      Array.isArray(boundary.random.files) &&
      boundary.random.files.every((file) =>
        typeof file.path === "string" &&
        /^[a-f0-9]{64}$/.test(file.sha256 ?? "") &&
        Number.isSafeInteger(file.occurrences) && file.occurrences > 0) &&
      Number.isSafeInteger(boundary.externalApiCandidateCount) &&
      boundary.externalApiCandidateCount >= 0 &&
      [
        "capture-identity-only-source-random-not-executed",
        "seed-modulo-fourteen-selects-allowed-virus-index-for-deterministic-current-javascript-only-not-injected-into-avm1",
      ].includes(boundary.seedDisposition),
    "source-static candidate source behavior boundary is invalid");
    invariant(boundary.random.files.reduce(
      (count, file) => count + file.occurrences, 0) ===
        boundary.random.occurrences,
    "source-static candidate random file occurrence sum is invalid");
    const ranges = blockedLocalFrameRanges(spec);
    invariant(Array.isArray(ranges),
      "source-static candidate behavior-dependent ranges must be an array");
    if (ranges.length > 0) {
      invariant(boundary.mainFrameDisposition ===
        "declared-behavior-dependent-ranges-fail-closed",
      "source-static candidate blocked main-frame disposition is invalid");
    } else {
      const companionRandomOnly = boundary.mainFrameDisposition ===
        "source-random-confined-to-muted-companion-audio-main-drawing-static-only" &&
        boundary.random.occurrences > 0 &&
        boundary.random.files.every((file) =>
          !file.path.startsWith(
            `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
          ));
      const disabledExternalControlOnly = boundary.mainFrameDisposition ===
        "source-external-api-confined-to-disabled-control-main-drawing-static-only" &&
        boundary.random.occurrences === 0 &&
        boundary.externalApiCandidateCount > 0 &&
        Array.isArray(boundary.externalControlEventFiles) &&
        boundary.externalControlEventFiles.length > 0 &&
        boundary.externalControlEventFiles.every((file) =>
          /^DefineButton2_[^/]+\/BUTTONCONDACTION /.test(file.path ?? "") &&
          /^[a-f0-9]{64}$/.test(file.sha256 ?? "") &&
          Number.isSafeInteger(file.occurrences) && file.occurrences > 0);
      const randomAudioOnly = boundary.mainFrameDisposition ===
        "source-random-selects-stream-audio-only-static-visual-main-drawing-static-only" &&
        boundary.random.occurrences > 0 &&
        boundary.random.files.some((file) =>
          file.path.startsWith(
            `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
          )) &&
        spec.evidence?.mutedRandomVisualDisposition !== undefined;
      const sourceLocalQuizBranchAtlas = boundary.mainFrameDisposition ===
        "source-local-random-quiz-static-branch-atlas-main-drawing-only" &&
        boundary.random.occurrences === 1 &&
        boundary.random.files.length === 1 &&
        boundary.random.files[0].path.startsWith(
          `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
        ) &&
        boundary.externalApiCandidateCount > 0 &&
        spec.evidence?.sourceLocalQuizContract !== undefined;
      const sourceLocalNumberLineQuizInitialState =
        boundary.mainFrameDisposition ===
          "source-local-random-number-line-quiz-initial-state-main-drawing-only" &&
        boundary.random.occurrences === 3 &&
        boundary.random.files.length === 2 &&
        boundary.random.files.some((file) => file.path.startsWith(
          `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
        ) && file.occurrences === 2) &&
        boundary.externalApiCandidateCount === 0 &&
        spec.evidence?.sourceLocalNumberLineQuizContract !== undefined;
      const sourceLocalPatternQuizInitialState =
        boundary.mainFrameDisposition ===
          "source-local-random-pattern-quiz-initial-state-main-drawing-only" &&
        boundary.random.occurrences === 2 &&
        boundary.random.files.length === 2 &&
        boundary.random.files.some((file) => file.path.startsWith(
          `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
        ) && file.occurrences === 1) &&
        boundary.externalApiCandidateCount === 0 &&
        spec.evidence?.sourceLocalPatternQuizContract !== undefined;
      const sourceLocalGameInitialState =
        boundary.mainFrameDisposition ===
          "source-local-random-game-initial-state-main-drawing-only" &&
        boundary.random.occurrences === 1 &&
        boundary.random.files.length === 1 &&
        boundary.random.files[0].path.startsWith(
          `DefineSprite_${spec.ffdec?.targetSpriteObjectId}/`,
        ) && boundary.random.files[0].occurrences === 1 &&
        boundary.externalApiCandidateCount === 0 &&
        spec.evidence?.sourceLocalGameContract !== undefined;
      invariant(companionRandomOnly || disabledExternalControlOnly || randomAudioOnly ||
        sourceLocalQuizBranchAtlas || sourceLocalNumberLineQuizInitialState ||
        sourceLocalPatternQuizInitialState || sourceLocalGameInitialState,
        "source-static candidate unblocked dynamic-source disposition is invalid");
    }
    let priorLastFrame = 0;
    for (const range of ranges) {
      invariant(Number.isSafeInteger(range.firstFrame) &&
        Number.isSafeInteger(range.lastFrame) &&
        range.firstFrame >= 1 && range.firstFrame <= range.lastFrame &&
        range.lastFrame <= spec.timeline.local.frameCount &&
        typeof range.reason === "string" && range.reason.length > 0,
      "source-static candidate behavior-dependent frame range is invalid");
      invariant(range.firstFrame > priorLastFrame,
        "source-static candidate behavior-dependent ranges must be sorted and non-overlapping");
      priorLastFrame = range.lastFrame;
    }
  }
  invariant(Number.isSafeInteger(spec.ffdec?.targetSpriteObjectId) &&
    spec.timeline.local.frameDomain === `sprite-${spec.ffdec.targetSpriteObjectId}` &&
    spec.ffdec.targetSpriteFunction === `sprite${spec.ffdec.targetSpriteObjectId}`,
  "source-static candidate FFDec target identity is invalid");
  for (const key of ["helper", "framesHtml"]) {
    invariant(Number.isSafeInteger(spec.ffdec[key]?.bytes) &&
      /^[a-f0-9]{64}$/.test(spec.ffdec[key]?.sha256 ?? ""),
    `source-static candidate FFDec ${key} binding is invalid`);
  }
  for (const value of [
    spec.ffdec.exportCanvas?.width,
    spec.ffdec.exportCanvas?.height,
    spec.ffdec.expectedPlacedFunctions?.count,
    spec.ffdec.expectedEmbeddedImages?.count,
  ]) {
    invariant(Number.isSafeInteger(value) && value >= 0,
      "source-static candidate FFDec numeric binding is invalid");
  }
  invariant(spec.ffdec.exportCanvas.width > 0 && spec.ffdec.exportCanvas.height > 0 &&
    /^[a-f0-9]{64}$/.test(spec.ffdec.expectedPlacedFunctions.sha256 ?? "") &&
    /^[a-f0-9]{64}$/.test(spec.ffdec.expectedEmbeddedImages.sha256 ?? ""),
  "source-static candidate FFDec allowlist binding is invalid");
  const expectedOffsetX = spec.timeline.root.placementPixels.x -
    spec.ffdec.exportInternalTranslation.x;
  const expectedOffsetY = spec.timeline.root.placementPixels.y -
    spec.ffdec.exportInternalTranslation.y;
  invariant(Math.abs(expectedOffsetX - spec.timeline.stageRenderOffset.x) < 1e-9 &&
    Math.abs(expectedOffsetY - spec.timeline.stageRenderOffset.y) < 1e-9,
  "source-static candidate stage render offset is invalid");
  invariant(Array.isArray(spec.integrationBindings) &&
    spec.integrationBindings.length >= 2 &&
    spec.integrationBindings.every((entry) => typeof entry === "string"),
  "source-static candidate integration bindings are invalid");
  invariant(Array.isArray(spec.unresolved) && spec.unresolved.length > 0 &&
    spec.unresolved.every((entry) => typeof entry === "string" && entry.length > 0),
  "source-static candidate unresolved obligations are invalid");
  const outputKeys = Object.keys(spec.outputs ?? {}).sort();
  invariant(JSON.stringify(outputKeys) === JSON.stringify([
    "canvasManifest", "canvasRuntime", "reportJson", "reportMarkdown",
  ]), "source-static candidate must declare exactly four outputs");
  for (const [key, value] of Object.entries(spec.outputs)) {
    invariant(["canvasRuntime", "canvasManifest", "reportJson", "reportMarkdown"]
      .includes(key) && typeof value === "string" &&
      !value.includes("..") && !path.isAbsolute(value),
    `source-static candidate output ${key} is invalid`);
  }
  invariant(spec.outputs.reportJson.endsWith("-current-javascript-candidate.json") &&
    spec.outputs.reportMarkdown.endsWith("-current-javascript-candidate.md"),
  "source-static candidate report output names are invalid");
  return spec;
}

async function run(command, args, options = {}) {
  try {
    return await execFile(command, args, {
      maxBuffer: 64 * 1024 * 1024,
      timeout: 180_000,
      ...options,
    });
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {
      cause: error,
    });
  }
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue until the exact executable is found.
    }
  }
  throw new Error(`executable not found: ${command}`);
}

async function inspectTool(command, expected, label) {
  const invokedPath = await resolveExecutable(command);
  invariant(invokedPath === expected.invokedPath,
    `${label} invoked path changed: ${invokedPath}`);
  const resolvedPath = await realpath(invokedPath);
  const [bytes, versionResult] = await Promise.all([
    readFile(resolvedPath),
    run(invokedPath, expected.versionArgs, {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    }),
  ]);
  const versionOutput = `${versionResult.stdout}\n${versionResult.stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "").trim();
  invariant(versionOutput.includes(expected.version), `${label} version changed`);
  invariant(sha256(bytes) === expected.executableSha256,
    `${label} executable SHA-256 changed`);
  return {
    command,
    invokedPath,
    resolvedPath,
    executableBytes: bytes.length,
    executableSha256: sha256(bytes),
    version: expected.version,
  };
}

async function readBinding(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const contents = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

async function readPinned(binding, label) {
  if (binding === null) return null;
  const observed = await readBinding(binding.path);
  invariant(observed.bytes === binding.bytes && observed.sha256 === binding.sha256,
    `${label} differs from its pinned identity`);
  return observed;
}

function withoutContents(binding) {
  if (!binding) return null;
  const {contents, ...rest} = binding;
  return rest;
}

function falseBoundary(keys) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

function adapterSpec(spec, sourceLocalNumberLineQuizContract = null,
  sourceLocalPatternQuizContract = null, sourceLocalGameContract = null) {
  return {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: "source-static-current-javascript-engineering-candidate-only",
    source: {swf: spec.source.swf.path, swfSha256: spec.source.swf.sha256},
    evidence: {
      scenarioInventorySha256: spec.evidence.sourceAudit.sha256,
      audioAuditSha256: (spec.evidence.authoringAudit ?? spec.evidence.sourceAudit).sha256,
    },
    ffdecExport: {
      tool: EXPECTED_TOOLS.ffdec.version,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: spec.ffdec.helper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: spec.ffdec.framesHtml.sha256,
      targetSpriteObjectId: spec.ffdec.targetSpriteObjectId,
      targetSpriteFunction: spec.ffdec.targetSpriteFunction,
      exportCanvas: spec.ffdec.exportCanvas,
      exportInternalTranslation: spec.ffdec.exportInternalTranslation,
      expectedPlacedFunctionCount: spec.ffdec.expectedPlacedFunctions.count,
      expectedPlacedFunctionsSha256: spec.ffdec.expectedPlacedFunctions.sha256,
      embeddedImageVariableCount: spec.ffdec.expectedEmbeddedImages.count,
      embeddedImageVariablesSha256: spec.ffdec.expectedEmbeddedImages.sha256,
    },
    timeline: {
      fps: spec.timeline.fps,
      stage: spec.timeline.stage,
      root: spec.timeline.root,
      local: {
        timelineId: spec.timeline.local.frameDomain,
        frameCount: spec.timeline.local.frameCount,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: spec.timeline.stageRenderOffset,
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: sourceLocalNumberLineQuizContract
        ? sourceLocalNumberLineQuizContract.initialQuizState
          .implementationSeedMapping
        : sourceLocalPatternQuizContract
          ? sourceLocalPatternQuizContract.initialQuizState
            .implementationSeedMapping
        : sourceLocalGameContract
          ? sourceLocalGameContract.initialGameState
            .implementationSeedMapping
        : "normalized-but-unused-by-source-static-drawing",
      blockedLocalFrameRanges: blockedLocalFrameRanges(spec),
      ...(sourceLocalNumberLineQuizContract
        ? {sourceLocalNumberLineQuiz:
            sourceLocalNumberLineQuizContract.initialQuizState}
        : {}),
      ...(sourceLocalPatternQuizContract
        ? {sourceLocalPatternQuiz:
            sourceLocalPatternQuizContract.initialQuizState}
        : {}),
      ...(sourceLocalGameContract
        ? {sourceLocalGame: sourceLocalGameContract.initialGameState}
        : {}),
      unresolved: spec.unresolved,
    },
    output: {
      script: spec.outputs.canvasRuntime,
      manifest: spec.outputs.canvasManifest,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

function validateEvidence(spec, sourceAudit, authoringAudit,
  mutedRandomVisualDisposition, sourceLocalQuizContract,
  sourceLocalNumberLineQuizContract, sourceLocalPatternQuizContract,
  sourceLocalGameContract) {
  invariant(sourceAudit.artifactType === "g4-l3-workspace-source-audit" &&
    sourceAudit.identity?.animationId === spec.animationId &&
    sourceAudit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256,
  `${spec.animationId}: source audit identity changed`);
  invariant(sourceAudit.machineFindings?.runtime?.stage?.width ===
      spec.timeline.stage.width &&
    sourceAudit.machineFindings.runtime.stage.height === spec.timeline.stage.height &&
    sourceAudit.machineFindings.runtime.fps === spec.timeline.fps &&
    sourceAudit.machineFindings.runtime.rootFrameCount ===
      spec.timeline.root.frameCount &&
    sourceAudit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched === false &&
    sourceAudit.machineFindings.evidenceLimits.visualBaselineEstablished === false,
  `${spec.animationId}: source audit runtime boundary changed`);
  const observedRandom = sourceAudit.machineFindings?.scripts?.random;
  const observedExternal =
    sourceAudit.machineFindings?.scripts?.externalApiCandidates ?? [];
  if (spec.sourceBehaviorBoundary) {
    invariant(observedRandom?.occurrences ===
        spec.sourceBehaviorBoundary.random.occurrences &&
      JSON.stringify(observedRandom.files) ===
        JSON.stringify(spec.sourceBehaviorBoundary.random.files) &&
      observedExternal.length ===
        spec.sourceBehaviorBoundary.externalApiCandidateCount,
    `${spec.animationId}: declared source behavior boundary changed`);
    if (spec.sourceBehaviorBoundary.mainFrameDisposition ===
      "source-external-api-confined-to-disabled-control-main-drawing-static-only") {
      const observedExternalFiles = observedExternal
        .flatMap((candidate) => candidate.files ?? [])
        .sort((left, right) => left.path.localeCompare(right.path, "en"));
      const declaredExternalFiles = [
        ...(spec.sourceBehaviorBoundary.externalControlEventFiles ?? []),
      ].sort((left, right) => left.path.localeCompare(right.path, "en"));
      invariant(JSON.stringify(observedExternalFiles) ===
        JSON.stringify(declaredExternalFiles),
      `${spec.animationId}: disabled external-control evidence changed`);
    }
  } else {
    invariant(observedRandom?.occurrences === 0 && observedExternal.length === 0,
    `${spec.animationId}: source-static candidate now has random or external API candidates`);
  }
  if (authoringAudit) {
    invariant(authoringAudit.evidenceKind === "adobe-animate-authoring-audit" &&
      authoringAudit.document?.width === spec.timeline.stage.width &&
      authoringAudit.document.height === spec.timeline.stage.height &&
      authoringAudit.document.frameRate === spec.timeline.fps &&
      /without saving/.test(authoringAudit.authority ?? ""),
    `${spec.animationId}: work-only authoring evidence changed`);
  }
  const expectsMutedRandomDisposition = spec.sourceBehaviorBoundary?.mainFrameDisposition ===
    "source-random-selects-stream-audio-only-static-visual-main-drawing-static-only";
  invariant(Boolean(mutedRandomVisualDisposition) === expectsMutedRandomDisposition,
    `${spec.animationId}: muted-random visual evidence presence changed`);
  if (mutedRandomVisualDisposition) {
    invariant(mutedRandomVisualDisposition.schemaVersion === 1 &&
      mutedRandomVisualDisposition.evidenceType ===
        "g4-l3-ir001-muted-random-visual-disposition" &&
      mutedRandomVisualDisposition.animationId === spec.animationId &&
      mutedRandomVisualDisposition.status ===
        "verified-random-audio-selection-does-not-change-source-visual" &&
      mutedRandomVisualDisposition.source?.swf?.sha256 === spec.source.swf.sha256 &&
      mutedRandomVisualDisposition.visualDisposition?.frameDomain ===
        spec.timeline.local.frameDomain &&
      mutedRandomVisualDisposition.visualDisposition.frames?.first === 1 &&
      mutedRandomVisualDisposition.visualDisposition.frames?.lastInclusive ===
        spec.timeline.local.frameCount &&
      mutedRandomVisualDisposition.visualDisposition
        .randomSelectionAffectsStreamAudio === true &&
      mutedRandomVisualDisposition.visualDisposition
        .randomSelectionChangesDisplayList === false &&
      mutedRandomVisualDisposition.visualDisposition
        .selectedMovieClipVisualChangesAcrossFrames === false &&
      mutedRandomVisualDisposition.visualDisposition
        .sourceStaticMutedDrawingRenderable === true &&
      mutedRandomVisualDisposition.visualDisposition.audioRenderedOrAccepted === false &&
      mutedRandomVisualDisposition.visualDisposition.naturalRandomOutcomeObserved === false &&
      mutedRandomVisualDisposition.visualDisposition.behavioralParityEstablished === false &&
      mutedRandomVisualDisposition.acceptance?.acceptanceNeutral === true &&
      Object.entries(mutedRandomVisualDisposition.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false) &&
      mutedRandomVisualDisposition.strictAcceptanceEffect === "none",
    `${spec.animationId}: muted-random visual evidence boundary changed`);
  }
  const expectsSourceLocalQuizContract =
    spec.sourceBehaviorBoundary?.mainFrameDisposition ===
      "source-local-random-quiz-static-branch-atlas-main-drawing-only";
  invariant(Boolean(sourceLocalQuizContract) === expectsSourceLocalQuizContract,
    `${spec.animationId}: source-local quiz evidence presence changed`);
  if (sourceLocalQuizContract) {
    invariant(sourceLocalQuizContract.schemaVersion === 1 &&
      sourceLocalQuizContract.evidenceType ===
        "g4-l3-fq002-source-local-quiz-contract" &&
      sourceLocalQuizContract.animationId === spec.animationId &&
      sourceLocalQuizContract.status ===
        "verified-source-local-random-question-contract-static-branch-atlas-only" &&
      sourceLocalQuizContract.source?.activeSwf?.sha256 === spec.source.swf.sha256 &&
      sourceLocalQuizContract.branchAtlas?.frameDomain ===
        spec.timeline.local.frameDomain &&
      sourceLocalQuizContract.branchAtlas.frameCount ===
        spec.timeline.local.frameCount &&
      sourceLocalQuizContract.sourceLocalInitialization?.answerCount === 25 &&
      sourceLocalQuizContract.sourceLocalInitialization.questionLabelCount === 25 &&
      sourceLocalQuizContract.sourceLocalInitialization.reviewLabelCount === 25 &&
      sourceLocalQuizContract.sourceLocalInitialization.totalQuestionsSelected === 10 &&
      sourceLocalQuizContract.sourceLocalInitialization
        .randomSelectionWithoutReplacement === true &&
      sourceLocalQuizContract.sourceLocalInitialization
        .questionReviewPairingUsesSameRandomIndex === true &&
      sourceLocalQuizContract.sourceLocalInitialization
        .initialSelectionReadsHostState === false &&
      sourceLocalQuizContract.sourceLocalInitialization
        .terminalReviewPathUsesHostState === true &&
      sourceLocalQuizContract.branchAtlas.sourceStaticBranchAtlasRenderable === true &&
      sourceLocalQuizContract.branchAtlas.sequentialPlaybackPermitted === false &&
      sourceLocalQuizContract.branchAtlas.livePlaybackEndFrame === 1 &&
      sourceLocalQuizContract.branchAtlas.naturalRuntimeTraceEstablished === false &&
      sourceLocalQuizContract.branchAtlas.dynamicAnswerFeedbackRendered === false &&
      sourceLocalQuizContract.branchAtlas.scoringBehaviorRendered === false &&
      sourceLocalQuizContract.branchAtlas.pointerInteractionRendered === false &&
      sourceLocalQuizContract.branchAtlas.hostNavigationRendered === false &&
      sourceLocalQuizContract.acceptance?.acceptanceNeutral === true &&
      Object.entries(sourceLocalQuizContract.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false) &&
      sourceLocalQuizContract.strictAcceptanceEffect === "none",
    `${spec.animationId}: source-local quiz evidence boundary changed`);
  }
  const expectsSourceLocalNumberLineQuizContract =
    spec.sourceBehaviorBoundary?.mainFrameDisposition ===
      "source-local-random-number-line-quiz-initial-state-main-drawing-only";
  invariant(Boolean(sourceLocalNumberLineQuizContract) ===
    expectsSourceLocalNumberLineQuizContract,
  `${spec.animationId}: source-local number-line quiz evidence presence changed`);
  if (sourceLocalNumberLineQuizContract) {
    const quiz = sourceLocalNumberLineQuizContract.initialQuizState;
    invariant(sourceLocalNumberLineQuizContract.schemaVersion === 1 &&
      sourceLocalNumberLineQuizContract.evidenceType ===
        "g4-l3-in006-source-local-number-line-quiz-contract" &&
      sourceLocalNumberLineQuizContract.animationId === spec.animationId &&
      sourceLocalNumberLineQuizContract.status ===
        "verified-source-local-number-line-quiz-initial-state-and-post-stop-static-frames" &&
      sourceLocalNumberLineQuizContract.source?.swf?.sha256 ===
        spec.source.swf.sha256 &&
      quiz?.frameDomain === spec.timeline.local.frameDomain &&
      quiz.entryFrame === 1054 && quiz.postStopLastFrame === 1057 &&
      quiz.sourceStopAtEntry === true &&
      quiz.sequentialPlaybackAfterEntryPermitted === false &&
      quiz.livePlaybackEndFrame === 1054 &&
      JSON.stringify(quiz.sourcePairs) === JSON.stringify([
        "-11~-8", "-8~-15", "-15~-4", "-4~5",
        "5~9", "9~15", "15~1", "1~-6",
      ]) &&
      quiz.implementationSeedMapping ===
        "seed-modulo-eight-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
      quiz.sourceRandomExecuted === false &&
      quiz.font?.functionName === "font3" &&
      quiz.font.ttfSha256 ===
        "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee" &&
      quiz.numberLine?.minimum === -15 && quiz.numberLine.maximum === 15 &&
      quiz.numberLine.labelCount === 31 &&
      sourceLocalNumberLineQuizContract.acceptance?.acceptanceNeutral === true &&
      Object.entries(sourceLocalNumberLineQuizContract.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false) &&
      sourceLocalNumberLineQuizContract.strictAcceptanceEffect === "none",
    `${spec.animationId}: source-local number-line quiz evidence boundary changed`);
  }
  const expectsSourceLocalPatternQuizContract =
    spec.sourceBehaviorBoundary?.mainFrameDisposition ===
      "source-local-random-pattern-quiz-initial-state-main-drawing-only";
  invariant(Boolean(sourceLocalPatternQuizContract) ===
    expectsSourceLocalPatternQuizContract,
  `${spec.animationId}: source-local pattern quiz evidence presence changed`);
  if (sourceLocalPatternQuizContract) {
    const quiz = sourceLocalPatternQuizContract.initialQuizState;
    const profile = {
      "course-g04-l03-in-008": {
        evidenceType: "g4-l3-in008-source-local-pattern-quiz-contract",
        entryFrame: 216,
        postStopLastFrame: 217,
        questions: [
          {label: "10, 5, 0, -5,", answers: "-10~-15", decrement: 5},
          {label: "18, 9, 0, -9,", answers: "-18~-27", decrement: 9},
          {label: "7, 5, 3, 1,", answers: "-1~-3", decrement: 2},
          {label: "0, -10, -20, -30,", answers: "-40~-50", decrement: 10},
          {label: "16, 12, 8, 4,", answers: "0~-4", decrement: 4},
        ],
        font: {
          primaryTtfSha256:
            "e56576cfc2c17204e624b1478586982ccc037ee8d117a7d169755ec8c0d690d8",
          sameLessonSupplementTtfSha256:
            "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee",
          sharedGlyphsEquivalent: true,
        },
        hidden: {objectId: 52, functionName: "sprite52"},
      },
      "course-g04-l03-ti-005": {
        evidenceType: "g4-l3-ti005-source-local-pattern-quiz-contract",
        entryFrame: 209,
        postStopLastFrame: 210,
        questions: [
          {label: "-3, -5, -7, -9,", answers: "-11~-13", decrement: 2},
          {label: "16, 8, 0, -8,", answers: "-16~-24", decrement: 8},
          {label: "20, 10, 0, -10,", answers: "-20~-30", decrement: 10},
          {label: "-10, -15, -20, -25,", answers: "-30~-35", decrement: 5},
          {label: "9, 6, 3, 0,", answers: "-3~-6", decrement: 3},
        ],
        font: {
          primaryTtfSha256:
            "375aa51f945f0742a5e7aedc83316cb2e29860471cfdefd0ca58e48a24c5b22e",
          digitMinusSupplementTtfSha256:
            "4b8c5b6896d18f56dfe908cec9b602e915e7ffb0dd4e83dce9d99c9d17bc3f11",
          commaSupplementTtfSha256:
            "5df6029d20f2fdefbb848f477aba21e3df37cb3a340cceb9b3c521efff9439e9",
          allSharedGlyphsEquivalent: true,
          deviceFontRuntimeEstablished: false,
        },
        hidden: {objectId: 203, functionName: "sprite203"},
      },
    }[spec.animationId];
    invariant(profile,
      `${spec.animationId}: source-local pattern quiz profile is not allowlisted`);
    invariant(sourceLocalPatternQuizContract.schemaVersion === 1 &&
      sourceLocalPatternQuizContract.evidenceType ===
        profile.evidenceType &&
      sourceLocalPatternQuizContract.animationId === spec.animationId &&
      sourceLocalPatternQuizContract.status ===
        "verified-source-local-pattern-quiz-initial-state-and-post-stop-static-frame" &&
      sourceLocalPatternQuizContract.source?.swf?.sha256 === spec.source.swf.sha256 &&
      quiz?.frameDomain === spec.timeline.local.frameDomain &&
      quiz.entryFrame === profile.entryFrame &&
      quiz.postStopLastFrame === profile.postStopLastFrame &&
      quiz.sourceStopAtEntry === true &&
      quiz.sequentialPlaybackAfterEntryPermitted === false &&
      quiz.livePlaybackEndFrame === profile.entryFrame &&
      Array.isArray(quiz.sourceQuestions) && quiz.sourceQuestions.length === 5 &&
      JSON.stringify(quiz.sourceQuestions.map(({label, answers, decrement}) =>
        ({label, answers, decrement}))) === JSON.stringify(profile.questions) &&
      quiz.implementationSeedMapping ===
        "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
      quiz.sourceRandomExecuted === false &&
      quiz.removesSelectedQuestion === true &&
      Object.entries(profile.font).every(([key, value]) =>
        quiz.font?.[key] === value) &&
      quiz.initiallyHiddenClip?.name === "Mc_Wrong_Feed" &&
      quiz.initiallyHiddenClip.objectId === profile.hidden.objectId &&
      quiz.initiallyHiddenClip.functionName === profile.hidden.functionName &&
      quiz.initiallyHiddenClip.sourceStatement ===
        "Mc_Wrong_Feed._visible = false;" &&
      sourceLocalPatternQuizContract.acceptance?.acceptanceNeutral === true &&
      Object.entries(sourceLocalPatternQuizContract.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false) &&
      sourceLocalPatternQuizContract.strictAcceptanceEffect === "none",
    `${spec.animationId}: source-local pattern quiz evidence boundary changed`);
  }
  const expectsSourceLocalGameContract =
    spec.sourceBehaviorBoundary?.mainFrameDisposition ===
      "source-local-random-game-initial-state-main-drawing-only";
  invariant(Boolean(sourceLocalGameContract) === expectsSourceLocalGameContract,
    `${spec.animationId}: source-local game evidence presence changed`);
  if (sourceLocalGameContract) {
    const game = sourceLocalGameContract.initialGameState;
    invariant(spec.animationId === "course-g04-l03-gs-002" &&
      sourceLocalGameContract.schemaVersion === 1 &&
      sourceLocalGameContract.evidenceType ===
        "g4-l3-gs002-source-local-game-initial-contract" &&
      sourceLocalGameContract.animationId === spec.animationId &&
      sourceLocalGameContract.status ===
        "verified-source-local-game-initial-state-and-post-stop-static-frame" &&
      sourceLocalGameContract.source?.swf?.sha256 === spec.source.swf.sha256 &&
      game?.frameDomain === spec.timeline.local.frameDomain &&
      game.entryFrame === 427 && game.postStopLastFrame === 428 &&
      game.sourceStopAtEntry === true &&
      game.sequentialPlaybackAfterEntryPermitted === false &&
      game.livePlaybackEndFrame === 427 &&
      JSON.stringify(game.allowedVirusIndices) === JSON.stringify([
        0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14,
      ]) && game.coupIndex === 7 && game.sourceCoupY === -4.1 &&
      game.implementationSeedMapping ===
        "seed-modulo-fourteen-selects-allowed-virus-index-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
      game.sourceRandomExecuted === false &&
      game.sourceRandomRetryWhenVirusMatchesCoup === true &&
      game.initialScore === 0 && game.initialMinutes === 4 &&
      game.initialSeconds === 0 && game.locationRestrict === "0-9" &&
      game.initialTimerDisplayText === "00:00:00" &&
      game.initialScoreDisplayText === "0" &&
      game.virusPlacement?.functionName === "sprite69" &&
      game.coupPlacement?.functionName === "sprite48" &&
      game.dynamicTextDrawing?.timer?.sourceFont?.name === "Arial" &&
      game.dynamicTextDrawing.timer.sourceFont.glyphCount === 0 &&
      game.dynamicTextDrawing?.score?.sourceFont?.name === "Bauhaus Md BT" &&
      game.dynamicTextDrawing.score.sourceFont.glyphCount === 0 &&
      game.postStopStaticInspectionCarriesInitializedPositions === true &&
      sourceLocalGameContract.sourceContract
        ?.sourceFrame428NavigationEstablished === false &&
      sourceLocalGameContract.acceptance?.acceptanceNeutral === true &&
      Object.entries(sourceLocalGameContract.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false) &&
      sourceLocalGameContract.strictAcceptanceEffect === "none",
    `${spec.animationId}: source-local game evidence boundary changed`);
  }
}

async function protectedSnapshot(paths) {
  const files = (await Promise.all([...new Set(paths)].map(readBinding)))
    .map(withoutContents)
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  return {
    fileCount: files.length,
    totalBytes: files.reduce((sum, item) => sum + item.bytes, 0),
    files,
    combinedManifestSha256: fingerprint(files),
  };
}

async function browserRenderability(runtime, spec) {
  const executablePath = chromium.executablePath();
  invariant(executablePath === EXPECTED_TOOLS.chromium.invokedPath,
    `Playwright Chromium path changed: ${executablePath}`);
  const executableBytes = await readFile(await realpath(executablePath));
  invariant(sha256(executableBytes) === EXPECTED_TOOLS.chromium.executableSha256,
    "Playwright Chromium executable SHA-256 changed");
  const browser = await chromium.launch({headless: true});
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  try {
    invariant(browser.version() === EXPECTED_TOOLS.chromium.version,
      `Playwright Chromium version changed: ${browser.version()}`);
    const page = await browser.newPage({viewport: {width: 800, height: 600}});
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setContent("<!doctype html><meta charset=utf-8><title>source-static harness</title>");
    await page.addScriptTag({content: runtime});
    const frameBatchSize = 32;
    const result = {frames: [], negativeProbes: null, exposedMethods: null};
    for (let firstFrame = 1; firstFrame <= spec.timeline.local.frameCount;
      firstFrame += frameBatchSize) {
      const lastFrame = Math.min(
        firstFrame + frameBatchSize - 1,
        spec.timeline.local.frameCount,
      );
      const batch = await page.evaluate(async ({
        animationId,
        blockedRanges,
        companionDomains,
        firstFrame,
        frameCount,
        frameDomain,
        lastFrame,
        rootFrame,
      }) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("candidate asset did not register");
      await asset.ready();
      const frames = [];
      for (let frame = firstFrame; frame <= lastFrame; frame += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.pointerEvents = "none";
        document.body.appendChild(canvas);
        const blockedRange = blockedRanges.find((range) =>
          frame >= range.firstFrame && frame <= range.lastFrame);
        if (blockedRange) {
          let blockedMessage = null;
          try {
            asset.render(canvas, {
              frame,
              scenario: "source-static-frame",
              lang: "en",
              seed: 0,
            });
          } catch (error) {
            blockedMessage = error instanceof Error ? error.message : String(error);
          }
          if (blockedMessage !==
            `source behavior-dependent frame blocked: ${frame} (${blockedRange.reason})`) {
            throw new Error(`frame ${frame} did not fail closed at its source behavior boundary`);
          }
          frames.push({
            frame,
            exportFrame: null,
            blocked: true,
            blocker: "source-behavior-dependent-frame-unvalidated",
            reason: blockedRange.reason,
            message: blockedMessage,
          });
          canvas.remove();
          continue;
        }
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        const expected = {
          frameDomain,
          localFrame: frame,
          exportFrame: frame - 1,
          rootFrame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        };
        for (const [name, value] of Object.entries(expected)) {
          if (state[name] !== value) throw new Error(`frame ${frame} state mismatch: ${name}`);
        }
        if (state.interactiveStateResolved !== false ||
          state.audioRendered !== false || state.visualOnly !== true) {
          throw new Error(`frame ${frame} safety state changed`);
        }
        if (getComputedStyle(canvas).pointerEvents !== "none") {
          throw new Error(`frame ${frame} pointer events were enabled`);
        }
        const pngUrl = canvas.toDataURL("image/png");
        frames.push({
          frame,
          exportFrame: frame - 1,
          blocked: false,
          pngBase64: pngUrl.slice("data:image/png;base64,".length),
        });
        canvas.remove();
      }
      const probe = (name, request) => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        try {
          asset.render(canvas, request);
          return {name, blocked: false, message: null};
        } catch (error) {
          return {
            name,
            blocked: true,
            message: error instanceof Error ? error.message : String(error),
          };
        }
      };
      return {
        frames,
        negativeProbes: [
          probe("spanish", {frame: 1, scenario: "source-static-frame", lang: "es", seed: 0}),
          probe("root", {frame: 1, scenario: "root-unavailable", lang: "en", seed: 0}),
          ...companionDomains.map((domain) =>
            probe(domain, {frame: 1, scenario: `${domain}-unavailable`, lang: "en", seed: 0})),
          probe("audio", {frame: 1, scenario: "audio", lang: "en", seed: 0}),
          probe("replay", {frame: 1, scenario: "replay", lang: "en", seed: 0}),
          probe("out-of-range", {frame: frameCount + 1, scenario: "source-static-frame", lang: "en", seed: 0}),
        ],
        exposedMethods: Object.keys(asset).sort(),
      };
      }, {
        animationId: spec.animationId,
        blockedRanges: blockedLocalFrameRanges(spec),
        companionDomains: spec.timeline.companionDomains.map((domain) => domain.id),
        firstFrame,
        frameCount: spec.timeline.local.frameCount,
        frameDomain: spec.timeline.local.frameDomain,
        lastFrame,
        rootFrame: spec.timeline.root.beginFrame,
      });
      result.frames.push(...batch.frames.map(({pngBase64, ...frame}) => {
        if (frame.blocked) return frame;
        const bytes = Buffer.from(pngBase64, "base64");
        return {...frame, bytes: bytes.length, sha256: sha256(bytes)};
      }));
      if (result.negativeProbes === null) {
        result.negativeProbes = batch.negativeProbes;
        result.exposedMethods = batch.exposedMethods;
      } else {
        invariant(JSON.stringify(batch.negativeProbes) ===
          JSON.stringify(result.negativeProbes) &&
          JSON.stringify(batch.exposedMethods) ===
          JSON.stringify(result.exposedMethods),
        `${spec.animationId}: browser safety probes changed between frame batches`);
      }
    }
    invariant(result.frames.length === spec.timeline.local.frameCount &&
      result.frames.every((frame, index) => {
        if (frame.frame !== index + 1) return false;
        if (frame.blocked) {
          return frame.exportFrame === null &&
            frame.blocker === "source-behavior-dependent-frame-unvalidated" &&
            typeof frame.reason === "string" && frame.reason.length > 0;
        }
        return frame.exportFrame === index && frame.bytes > 0 &&
          /^[a-f0-9]{64}$/.test(frame.sha256);
      }),
    `${spec.animationId}: browser did not execute every source-static frame`);
    invariant(result.negativeProbes.every((probe) => probe.blocked === true),
      `${spec.animationId}: an unsupported browser request did not fail closed`);
    invariant(JSON.stringify(result.exposedMethods) ===
      JSON.stringify(["metadata", "ready", "render", "resolveFrameState"]),
    `${spec.animationId}: candidate runtime exposed unexpected methods`);
    invariant(requests.length === 0 && consoleErrors.length === 0 &&
      pageErrors.length === 0,
    `${spec.animationId}: renderability emitted network, console, or page errors`);
    const renderedFrames = result.frames.filter((frame) => !frame.blocked);
    const blockedFrames = result.frames.filter((frame) => frame.blocked);
    invariant(blockedFrames.length === blockedLocalFrameCount(spec),
      `${spec.animationId}: browser blocked-frame count changed`);
    return {
      classification: "candidate-renderability-only-not-visual-parity",
      browser: {
        invokedPath: executablePath,
        resolvedPath: await realpath(executablePath),
        executableBytes: executableBytes.length,
        executableSha256: sha256(executableBytes),
        version: browser.version(),
      },
      harness: {
        viewport: {width: 800, height: 600},
        canvasBackingStore: {width: 800, height: 600},
        language: "en",
        scenario: "source-static-frame",
        seed: 0,
        pointerEvents: "none",
      },
      frameDomain: spec.timeline.local.frameDomain,
      frameDigestMethod:
        "node-crypto-sha256-over-batched-canvas-toDataURL-png-bytes",
      frameBatchSize,
      firstFrame: 1,
      lastFrame: spec.timeline.local.frameCount,
      executedFrameCount: result.frames.length,
      pngEncodedFrameCount: renderedFrames.length,
      blockedFrameCount: blockedFrames.length,
      blockedLocalFrameRanges: blockedLocalFrameRanges(spec),
      uniqueVisualFrameCount: new Set(renderedFrames.map((frame) => frame.sha256)).size,
      frameManifestSha256: fingerprint(result.frames),
      frames: result.frames,
      negativeProbes: result.negativeProbes,
      exposedMethods: result.exposedMethods,
      unexpectedNetworkRequestCount: requests.length,
      consoleErrorCount: consoleErrors.length,
      pageErrorCount: pageErrors.length,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      visualParityClaimed: false,
      behaviorParityClaimed: false,
    };
  } finally {
    await browser.close();
  }
}

function renderMarkdown(report) {
  return `# ${report.animationId} current-JavaScript engineering candidate\n\n` +
    `This hash-bound prototype is a muted, noninteractive English source-static drawing candidate. It is not an authoritative runtime baseline, visual or behavior parity result, localization/audio acceptance, human/owner acceptance, strict migration, or production admission.\n\n` +
    `- Source SWF: \`${report.source.swf.path}\` (\`${report.source.swf.sha256}\`).\n` +
    `- Addressable drawing domain: \`${report.timeline.main.frameDomain}\`, frames 1–${report.timeline.main.frameCount}; ${report.candidateRenderability.blockedFrameCount} source behavior-dependent frame(s) fail closed.\n` +
    `- Browser renderability: ${report.candidateRenderability.pngEncodedFrameCount}/${report.timeline.main.frameCount} rendered frames, ${report.candidateRenderability.blockedFrameCount} blocked frames, ${report.candidateRenderability.uniqueVisualFrameCount} unique PNG hashes, 0 network/console/page errors.\n` +
    `- Root, companion domains, Spanish, audio, Replay parity, host ActionScript, and pointer behavior fail closed.\n\n` +
    `## Unresolved obligations\n\n${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

function buildArtifacts({
  browserEvidence,
  built,
  evidence,
  helper,
  integrationBindings,
  protectedBefore,
  runtimeBytes,
  source,
  spec,
  specBinding,
  toolchain,
  verifiedAfterWrite,
}) {
  const acceptance = falseBoundary(ACCEPTANCE_KEYS);
  const authorization = falseBoundary(AUTHORIZATION_KEYS);
  const writeScope = {
    allowedOutputs: Object.values(spec.outputs),
    protectedBefore,
    protectedAfter: protectedBefore,
    protectedManifestUnchanged: verifiedAfterWrite,
    verifiedAfterWrite,
    sourceAssetsWritten: false,
    migrationFilesWrittenByGenerator: false,
    ledgerWritten: false,
    approvalOrPinFilesWritten: false,
    productRouteWritten: false,
  };
  const blocked = Object.fromEntries([
    ["root", true],
    ...spec.timeline.companionDomains.map((domain) => [domain.id, true]),
    ["spanish", true],
    ["embeddedAudio", true],
    ["associatedAudio", true],
    ["replayParity", true],
    ["hostActionScript", true],
    ["sourceBehaviorDependentLocalFrames", blockedLocalFrameCount(spec) > 0],
  ]);
  const manifest = {
    schemaVersion: 1,
    animationId: spec.animationId,
    status: "source-static-current-javascript-engineering-candidate-only",
    authority:
      "Fresh hash-bound SWF extraction and deterministic Chromium renderability only; not authoritative runtime, visual parity, behavior parity, localization, audio, human, owner, or strict acceptance.",
    generatedBy: [
      withoutContents(specBinding),
      ...integrationBindings.filter((entry) =>
        [portable(path.relative(ROOT, scriptPath)), SAFE_ADAPTER_BUILDER]
          .includes(entry.path)),
    ],
    source,
    evidence,
    toolchain,
    extraction: {
      helper: {bytes: helper.length, sha256: sha256(helper)},
      framesHtml: spec.ffdec.framesHtml,
      drawingObjectCount: built.placedFunctions.length,
      drawingObjectsSha256: sha256(JSON.stringify(built.placedFunctions)),
      embeddedImageCount: built.imageVariables.length,
      embeddedImageVariablesSha256: sha256(JSON.stringify(built.imageVariables)),
    },
    runtime: {
      ...built.metadata,
      boundedScope: {
        frameDomain: spec.timeline.local.frameDomain,
        frames: {first: 1, lastInclusive: spec.timeline.local.frameCount},
        renderableFrameCount:
          spec.timeline.local.frameCount - blockedLocalFrameCount(spec),
        blockedLocalFrameRanges: blockedLocalFrameRanges(spec),
        language: "en",
        scenario: "source-static-frame",
        audio: "disabled",
        pointerInteraction: "disabled",
        hostActionScript: "disabled",
      },
      blocked,
    },
    safety: {
      noLegacyActionScriptExecuted: true,
      noHostCallbacksExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      pointerEventsEnabled: false,
      audioRendered: false,
    },
    candidateRenderability: browserEvidence,
    output: {
      script: spec.outputs.canvasRuntime,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    prototypeRegistryOnly: true,
    writeScope,
    authorization,
    acceptance,
    strictAcceptanceEffect: "none",
    unresolved: spec.unresolved,
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  const report = {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    animationId: spec.animationId,
    batch: spec.batch,
    classification: spec.classification,
    disposition: {
      currentJavaScriptCandidate: true,
      candidateRenderabilityOnly: true,
      prototypeRegistryOnly: true,
      strictLedgerChanged: false,
      approvalOrPinChanged: false,
      productRouteAddedByGenerator: false,
      publicLibraryAdmitted: false,
      productionAdmission: false,
      strictMigrationComplete: false,
    },
    source,
    evidence,
    toolchain,
    integrationBindings,
    timeline: {
      stage: spec.timeline.stage,
      fps: spec.timeline.fps,
      root: {
        frameDomain: "root",
        frameCount: spec.timeline.root.frameCount,
        renderable: false,
      },
      companions: spec.timeline.companionDomains.map((domain) => ({
        frameDomain: domain.id,
        frameCount: domain.frameCount,
        renderable: false,
      })),
      main: {
        frameDomain: spec.timeline.local.frameDomain,
        frameCount: spec.timeline.local.frameCount,
        publicFrameIndexing: "one-indexed",
        language: "en",
        audioRendered: false,
        interactionEnabled: false,
        status: blockedLocalFrameCount(spec) > 0
          ? "source-static-drawing-with-behavior-dependent-frame-blocks"
          : "source-static-drawing-only",
        blockedFrameCount: blockedLocalFrameCount(spec),
        blockedLocalFrameRanges: blockedLocalFrameRanges(spec),
      },
    },
    candidateRenderability: browserEvidence,
    outputs: {
      canvasRuntime: {
        path: spec.outputs.canvasRuntime,
        bytes: runtimeBytes.length,
        sha256: sha256(runtimeBytes),
      },
      canvasManifest: {
        path: spec.outputs.canvasManifest,
        bytes: manifestBytes.length,
        sha256: sha256(manifestBytes),
      },
      prototypeModule: spec.integrationBindings.find((entry) =>
        entry.includes("/modules/")),
      pureTimeline: spec.integrationBindings.find((entry) =>
        entry.includes("/timelines/")),
    },
    writeScope,
    authorization,
    acceptance,
    strictAcceptanceEffect: "none",
    unresolved: spec.unresolved,
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return {
    runtimeBytes,
    manifestBytes,
    report,
    reportJsonBytes: Buffer.from(stableJson(report)),
    reportMarkdownBytes: Buffer.from(renderMarkdown(report)),
  };
}

export function validateSourceStaticCandidateReport(report, spec) {
  invariant(report?.schemaVersion === 1 && report.reportType === REPORT_TYPE &&
    report.animationId === spec.animationId,
  `${spec.animationId}: candidate report identity is invalid`);
  invariant(report.disposition.currentJavaScriptCandidate === true &&
    report.disposition.candidateRenderabilityOnly === true &&
    report.disposition.prototypeRegistryOnly === true &&
    Object.entries(report.disposition)
      .filter(([key]) => ![
        "currentJavaScriptCandidate",
        "candidateRenderabilityOnly",
        "prototypeRegistryOnly",
      ].includes(key))
      .every(([, value]) => value === false),
  `${spec.animationId}: candidate disposition was promoted`);
  invariant(AUTHORIZATION_KEYS.every((key) => report.authorization[key] === false) &&
    ACCEPTANCE_KEYS.every((key) => report.acceptance[key] === false) &&
    report.strictAcceptanceEffect === "none",
  `${spec.animationId}: authorization or acceptance was promoted`);
  invariant(report.candidateRenderability.executedFrameCount ===
      spec.timeline.local.frameCount &&
    report.candidateRenderability.pngEncodedFrameCount ===
      spec.timeline.local.frameCount - blockedLocalFrameCount(spec) &&
    report.candidateRenderability.blockedFrameCount ===
      blockedLocalFrameCount(spec) &&
    JSON.stringify(report.candidateRenderability.blockedLocalFrameRanges) ===
      JSON.stringify(blockedLocalFrameRanges(spec)) &&
    report.candidateRenderability.negativeProbes.every((entry) => entry.blocked) &&
    report.candidateRenderability.originalRuntimeBaselineUsed === false &&
    report.candidateRenderability.rmseComputed === false &&
    report.candidateRenderability.visualParityClaimed === false &&
    report.candidateRenderability.behaviorParityClaimed === false,
  `${spec.animationId}: browser evidence exceeds or fails its boundary`);
  invariant(report.writeScope.verifiedAfterWrite === true &&
    report.writeScope.protectedManifestUnchanged === true &&
    report.writeScope.sourceAssetsWritten === false &&
    report.writeScope.ledgerWritten === false &&
    report.writeScope.approvalOrPinFilesWritten === false,
  `${spec.animationId}: candidate write boundary is not closed`);
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(projected),
    `${spec.animationId}: candidate report fingerprint is stale`);
  return report;
}

async function assertSafeOutputTarget(relativePath, allowedOutputs) {
  invariant(allowedOutputs.includes(relativePath),
    `undeclared output target: ${relativePath}`);
  const absolute = projectPath(relativePath);
  invariant(!absolute.startsWith(`${projectPath("source-assets")}${path.sep}`),
    "candidate output cannot be placed under source-assets");
  try {
    const target = await lstat(absolute);
    invariant(target.isFile() && !target.isSymbolicLink(),
      `${relativePath} must be a regular non-symlink output`);
    invariant((await stat(absolute)).nlink === 1,
      `${relativePath} must not have multiple hard links`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function emit(relativePath, expected, check, allowedOutputs) {
  const absolute = projectPath(relativePath);
  if (check) {
    const actual = await readFile(absolute);
    invariant(actual.equals(expected), `${relativePath} is stale`);
    return;
  }
  await assertSafeOutputTarget(relativePath, allowedOutputs);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, expected);
}

export async function checkCandidateReportOutputs({
  spec,
  expectedBaseReportBytes,
  expectedBaseMarkdownBytes,
}) {
  const [actualReportBytes, actualMarkdownBytes] = await Promise.all([
    readFile(projectPath(spec.outputs.reportJson)),
    readFile(projectPath(spec.outputs.reportMarkdown)),
  ]);
  if (actualReportBytes.equals(expectedBaseReportBytes) &&
    actualMarkdownBytes.equals(expectedBaseMarkdownBytes)) {
    return {mode: "base", autoplayEvidenceValidated: false};
  }
  invariant(
    spec.integrationBindings.filter((value) =>
      value === AUTOPLAY_EVIDENCE_MATERIALIZER).length === 1 &&
    spec.integrationBindings.filter((value) =>
      value === SOURCE_OPERATION_INDEX).length === 1 &&
    spec.integrationBindings.filter((value) =>
      value === SOURCE_STATIC_AUTOPLAY_CONTRACT).length === 1,
    `${spec.animationId}: candidate report outputs are stale`,
  );
  const materializer = await import(
    "./materialize-g4-l3-source-static-autoplay-evidence.mjs"
  );
  const item = materializer.SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS.find(
    (candidate) => candidate.animationId === spec.animationId,
  );
  invariant(item,
    `${spec.animationId}: no source-static autoplay materialization contract`);
  const [indexBinding, contractBinding, materializerBinding, timelineBinding] =
    await Promise.all([
      readBinding(SOURCE_OPERATION_INDEX),
      readBinding(SOURCE_STATIC_AUTOPLAY_CONTRACT),
      readBinding(AUTOPLAY_EVIDENCE_MATERIALIZER),
      readBinding(item.timelinePath),
    ]);
  materializer.validateMaterializedOutputPair({
    actualReportBytes,
    actualMarkdownBytes,
    expectedBaseReportBytes,
    expectedBaseMarkdownBytes,
    item,
    bindings: {
      indexBinding,
      contractBinding,
      materializerBinding,
      timelineBinding,
    },
  });
  return {mode: "materialized", autoplayEvidenceValidated: true};
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", specPath: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--ffdec" || argument === "--spec") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      if (argument === "--ffdec") options.ffdec = value;
      else options.specPath = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (!options.help) invariant(options.specPath, "--spec is required");
  return options;
}

export async function generateG4L3SourceStaticCandidate({
  check = false,
  ffdec = "ffdec",
  specPath,
} = {}) {
  invariant(specPath, "specPath is required");
  const portableSpecPath = portable(path.relative(ROOT, path.resolve(ROOT, specPath)));
  const specBinding = await readBinding(portableSpecPath);
  const spec = validateSourceStaticCandidateSpec(JSON.parse(specBinding.contents));
  const protectedPaths = [
    portableSpecPath,
    portable(path.relative(ROOT, scriptPath)),
    SAFE_ADAPTER_BUILDER,
    HUMAN_APPROVAL,
    spec.source.swf.path,
    ...(spec.source.fla ? [spec.source.fla.path] : []),
    ...(spec.source.associatedAudio ? [spec.source.associatedAudio.path] : []),
    spec.evidence.sourceAudit.path,
    ...(spec.evidence.authoringAudit ? [spec.evidence.authoringAudit.path] : []),
    ...(spec.evidence.mutedRandomVisualDisposition
      ? [spec.evidence.mutedRandomVisualDisposition.path] : []),
    ...(spec.evidence.sourceLocalQuizContract
      ? [spec.evidence.sourceLocalQuizContract.path] : []),
    ...(spec.evidence.sourceLocalNumberLineQuizContract
      ? [spec.evidence.sourceLocalNumberLineQuizContract.path] : []),
    ...(spec.evidence.sourceLocalPatternQuizContract
      ? [spec.evidence.sourceLocalPatternQuizContract.path] : []),
    ...(spec.evidence.sourceLocalGameContract
      ? [spec.evidence.sourceLocalGameContract.path] : []),
    ...spec.integrationBindings,
  ];
  const protectedBefore = await protectedSnapshot(protectedPaths);
  // The completion ledger is protected by an exact before/after byte check, but
  // its hash must not be serialized into the candidate outputs. The ledger runs
  // strict migration validation, which reads these outputs; serializing its hash
  // here would create an unsatisfiable candidate -> ledger -> candidate cycle.
  const completionLedgerBefore = await readBinding(COMPLETION_LEDGER);
  const [sourceSwf, sourceFla, associatedAudio, sourceAudit, authoringAudit,
    mutedRandomVisualDisposition, sourceLocalQuizContract,
    sourceLocalNumberLineQuizContract, sourceLocalPatternQuizContract,
    sourceLocalGameContract,
    generator, safeBuilder,
    ...integrationTail] =
    await Promise.all([
    readPinned(spec.source.swf, "source SWF"),
    readPinned(spec.source.fla, "source FLA"),
    readPinned(spec.source.associatedAudio, "associated audio"),
    readPinned(spec.evidence.sourceAudit, "source audit"),
    readPinned(spec.evidence.authoringAudit, "authoring audit"),
    readPinned(spec.evidence.mutedRandomVisualDisposition ?? null,
      "muted-random visual disposition"),
    readPinned(spec.evidence.sourceLocalQuizContract ?? null,
      "source-local quiz contract"),
    readPinned(spec.evidence.sourceLocalNumberLineQuizContract ?? null,
      "source-local number-line quiz contract"),
    readPinned(spec.evidence.sourceLocalPatternQuizContract ?? null,
      "source-local pattern quiz contract"),
    readPinned(spec.evidence.sourceLocalGameContract ?? null,
      "source-local game contract"),
    readBinding(portable(path.relative(ROOT, scriptPath))),
    readBinding(SAFE_ADAPTER_BUILDER),
    ...spec.integrationBindings.map(readBinding),
  ]);
  validateEvidence(
    spec,
    JSON.parse(sourceAudit.contents),
    authoringAudit ? JSON.parse(authoringAudit.contents) : null,
    mutedRandomVisualDisposition
      ? JSON.parse(mutedRandomVisualDisposition.contents) : null,
    sourceLocalQuizContract
      ? JSON.parse(sourceLocalQuizContract.contents) : null,
    sourceLocalNumberLineQuizContract
      ? JSON.parse(sourceLocalNumberLineQuizContract.contents) : null,
    sourceLocalPatternQuizContract
      ? JSON.parse(sourceLocalPatternQuizContract.contents) : null,
    sourceLocalGameContract
      ? JSON.parse(sourceLocalGameContract.contents) : null,
  );
  const integrationBindings = [generator, safeBuilder, ...integrationTail]
    .map(withoutContents)
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const toolchain = {ffdec: await inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec")};
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), `help-math-${spec.animationId}-candidate-`),
  );
  try {
    const canvasDirectory = path.join(temporaryRoot, "canvas");
    const canvasExport = await run(toolchain.ffdec.invokedPath, [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", String(spec.ffdec.targetSpriteObjectId),
      "-format", "sprite:canvas",
      "-export", "sprite",
      canvasDirectory,
      projectPath(spec.source.swf.path),
    ]);
    invariant(`${canvasExport.stdout}\n${canvasExport.stderr}`
      .includes(EXPECTED_TOOLS.ffdec.version),
    "fresh FFDec exporter version changed");
    const exportDirectory = path.join(
      canvasDirectory,
      `DefineSprite_${spec.ffdec.targetSpriteObjectId}`,
    );
    const [helper, framesHtml] = await Promise.all([
      readFile(path.join(exportDirectory, "canvas.js")),
      readFile(path.join(exportDirectory, "frames.html")),
    ]);
    invariant(helper.length === spec.ffdec.helper.bytes &&
      sha256(helper) === spec.ffdec.helper.sha256,
    `${spec.animationId}: fresh FFDec Canvas helper changed`);
    invariant(framesHtml.length === spec.ffdec.framesHtml.bytes &&
      sha256(framesHtml) === spec.ffdec.framesHtml.sha256,
    `${spec.animationId}: fresh FFDec frame export changed`);
    const built = buildSafeRuntime({
      helperSource: helper.toString("utf8"),
      framesHtml: framesHtml.toString("utf8"),
      spec: adapterSpec(
        spec,
        sourceLocalNumberLineQuizContract
          ? JSON.parse(sourceLocalNumberLineQuizContract.contents)
          : null,
        sourceLocalPatternQuizContract
          ? JSON.parse(sourceLocalPatternQuizContract.contents)
          : null,
        sourceLocalGameContract
          ? JSON.parse(sourceLocalGameContract.contents)
          : null,
      ),
    });
    const runtimeBytes = Buffer.from(built.runtime);
    const browserEvidence = await browserRenderability(built.runtime, spec);
    toolchain.chromium = browserEvidence.browser;
    const source = {
      swf: withoutContents(sourceSwf),
      fla: sourceFla ? {
        ...withoutContents(sourceFla),
        authoringAuditPerformedByGenerator: false,
      } : null,
      associatedAudio: associatedAudio ? {
        ...withoutContents(associatedAudio),
        normalizedLanguageCandidate: "es",
        spokenLanguageEstablished: false,
        rendered: false,
      } : null,
      embeddedAudio: spec.source.embeddedAudio ?? null,
    };
    const evidence = {
      sourceAudit: {
        ...withoutContents(sourceAudit),
        authority: "static-machine-source-evidence-only",
      },
      authoringAudit: authoringAudit ? {
        ...withoutContents(authoringAudit),
        authority: "work-only-authoring-structure-not-runtime",
      } : null,
      mutedRandomVisualDisposition: mutedRandomVisualDisposition ? {
        ...withoutContents(mutedRandomVisualDisposition),
        authority:
          "source-only-random-audio-selection-with-static-muted-visual-disposition",
      } : null,
      sourceLocalQuizContract: sourceLocalQuizContract ? {
        ...withoutContents(sourceLocalQuizContract),
        authority:
          "source-only-random-quiz-contract-with-static-nonsequential-branch-atlas-disposition",
      } : null,
      sourceLocalNumberLineQuizContract: sourceLocalNumberLineQuizContract ? {
        ...withoutContents(sourceLocalNumberLineQuizContract),
        authority:
          "source-only-number-line-initial-state-and-post-stop-static-frame-disposition",
      } : null,
      sourceLocalPatternQuizContract: sourceLocalPatternQuizContract ? {
        ...withoutContents(sourceLocalPatternQuizContract),
        authority:
          "source-only-pattern-quiz-initial-state-and-post-stop-static-frame-disposition",
      } : null,
      sourceLocalGameContract: sourceLocalGameContract ? {
        ...withoutContents(sourceLocalGameContract),
        authority:
          "source-only-game-initial-state-and-post-stop-static-frame-disposition",
      } : null,
    };
    const context = {
      browserEvidence,
      built,
      evidence,
      helper,
      integrationBindings,
      protectedBefore,
      runtimeBytes,
      source,
      spec,
      specBinding,
      toolchain,
    };
    const allowedOutputs = Object.values(spec.outputs);
    if (check) {
      const artifacts = buildArtifacts({...context, verifiedAfterWrite: true});
      validateSourceStaticCandidateReport(artifacts.report, spec);
      const [, , reportOutputCheck] = await Promise.all([
        emit(spec.outputs.canvasRuntime, artifacts.runtimeBytes, true, allowedOutputs),
        emit(spec.outputs.canvasManifest, artifacts.manifestBytes, true, allowedOutputs),
        checkCandidateReportOutputs({
          spec,
          expectedBaseReportBytes: artifacts.reportJsonBytes,
          expectedBaseMarkdownBytes: artifacts.reportMarkdownBytes,
        }),
      ]);
      const protectedAfter = await protectedSnapshot(protectedPaths);
      const completionLedgerAfter = await readBinding(COMPLETION_LEDGER);
      invariant(protectedBefore.combinedManifestSha256 ===
        protectedAfter.combinedManifestSha256,
      "protected bindings changed during check");
      invariant(completionLedgerBefore.sha256 === completionLedgerAfter.sha256 &&
        completionLedgerBefore.bytes === completionLedgerAfter.bytes,
      "completion ledger changed during check");
      return {
        animationId: spec.animationId,
        check: true,
        report: spec.outputs.reportJson,
        runtime: artifacts.report.outputs.canvasRuntime,
        manifest: artifacts.report.outputs.canvasManifest,
        candidateRenderability: {
          classification: artifacts.report.candidateRenderability.classification,
          frameDomain: artifacts.report.candidateRenderability.frameDomain,
          executedFrameCount:
            artifacts.report.candidateRenderability.executedFrameCount,
          pngEncodedFrameCount:
            artifacts.report.candidateRenderability.pngEncodedFrameCount,
          blockedFrameCount:
            artifacts.report.candidateRenderability.blockedFrameCount,
          uniqueVisualFrameCount:
            artifacts.report.candidateRenderability.uniqueVisualFrameCount,
          unexpectedNetworkRequestCount:
            artifacts.report.candidateRenderability.unexpectedNetworkRequestCount,
          consoleErrorCount: artifacts.report.candidateRenderability.consoleErrorCount,
          pageErrorCount: artifacts.report.candidateRenderability.pageErrorCount,
          negativeProbeCount:
            artifacts.report.candidateRenderability.negativeProbes.length,
          originalRuntimeBaselineUsed:
            artifacts.report.candidateRenderability.originalRuntimeBaselineUsed,
        },
        reportOutputMode: reportOutputCheck.mode,
        autoplayEvidenceValidated:
          reportOutputCheck.autoplayEvidenceValidated,
        strictAcceptanceEffect: "none",
      };
    }
    const preliminary = buildArtifacts({...context, verifiedAfterWrite: false});
    await Promise.all([
      emit(spec.outputs.canvasRuntime, preliminary.runtimeBytes, false, allowedOutputs),
      emit(spec.outputs.canvasManifest, preliminary.manifestBytes, false, allowedOutputs),
      emit(spec.outputs.reportJson, preliminary.reportJsonBytes, false, allowedOutputs),
      emit(spec.outputs.reportMarkdown, preliminary.reportMarkdownBytes, false, allowedOutputs),
    ]);
    const protectedAfter = await protectedSnapshot(protectedPaths);
    const completionLedgerAfter = await readBinding(COMPLETION_LEDGER);
    invariant(protectedBefore.combinedManifestSha256 ===
      protectedAfter.combinedManifestSha256,
    "protected bindings changed during generation");
    invariant(completionLedgerBefore.sha256 === completionLedgerAfter.sha256 &&
      completionLedgerBefore.bytes === completionLedgerAfter.bytes,
    "completion ledger changed during generation");
    const finalArtifacts = buildArtifacts({...context, verifiedAfterWrite: true});
    validateSourceStaticCandidateReport(finalArtifacts.report, spec);
    await Promise.all([
      emit(spec.outputs.canvasManifest, finalArtifacts.manifestBytes, false, allowedOutputs),
      emit(spec.outputs.reportJson, finalArtifacts.reportJsonBytes, false, allowedOutputs),
      emit(spec.outputs.reportMarkdown, finalArtifacts.reportMarkdownBytes, false, allowedOutputs),
    ]);
    return {
      animationId: spec.animationId,
      check: false,
      report: spec.outputs.reportJson,
      runtime: finalArtifacts.report.outputs.canvasRuntime,
      manifest: finalArtifacts.report.outputs.canvasManifest,
      candidateRenderability: {
        classification:
          finalArtifacts.report.candidateRenderability.classification,
        frameDomain: finalArtifacts.report.candidateRenderability.frameDomain,
        executedFrameCount:
          finalArtifacts.report.candidateRenderability.executedFrameCount,
        pngEncodedFrameCount:
          finalArtifacts.report.candidateRenderability.pngEncodedFrameCount,
        blockedFrameCount:
          finalArtifacts.report.candidateRenderability.blockedFrameCount,
        uniqueVisualFrameCount:
          finalArtifacts.report.candidateRenderability.uniqueVisualFrameCount,
        unexpectedNetworkRequestCount:
          finalArtifacts.report.candidateRenderability.unexpectedNetworkRequestCount,
        consoleErrorCount:
          finalArtifacts.report.candidateRenderability.consoleErrorCount,
        pageErrorCount: finalArtifacts.report.candidateRenderability.pageErrorCount,
        negativeProbeCount:
          finalArtifacts.report.candidateRenderability.negativeProbes.length,
        originalRuntimeBaselineUsed:
          finalArtifacts.report.candidateRenderability.originalRuntimeBaselineUsed,
      },
      strictAcceptanceEffect: "none",
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function help() {
  return `Usage: node scripts/build-g4-l3-source-static-candidate.mjs --spec <path> [options]\n\n` +
    `Options:\n` +
    `  --spec <path>      Hash-bound candidate specification\n` +
    `  --check            Rebuild in memory and verify checked-in outputs\n` +
    `  --ffdec <command>  FFDec launcher (default: ffdec)\n` +
    `  -h, --help         Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await generateG4L3SourceStaticCandidate(options),
  ));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
