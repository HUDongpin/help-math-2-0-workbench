#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {Script} from "node:vm";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {
  buildSafeRuntime,
  validateAdapterAuditEvidence,
} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l4-fq001-dual-sprite-composite-candidate.mjs";
const SAFE_ADAPTER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const DEFAULT_SPEC =
  "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json";
const ANIMATION_ID = "course-g05-l04-fq-001";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_CLASSIFICATION =
  "source-static-dual-sprite-composite-current-javascript-engineering-candidate-only";
const EXPECTED_SCENARIO = "source-static-composite-prefix";
const MAIN_FRAME_DOMAIN = "sprite-145";
const COMPANION_FRAME_DOMAIN = "sprite-100";

const BLOCKED_RUNTIME_PATTERNS = Object.freeze([
  Object.freeze({label: "dynamic evaluation", pattern: /\beval\s*\(/}),
  Object.freeze({
    label: "dynamic Function constructor",
    pattern: /\bFunction\s*\(/,
  }),
  Object.freeze({
    label: "timer or animation loop",
    pattern: /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
  }),
  Object.freeze({
    label: "network primitive",
    pattern: /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/,
  }),
  Object.freeze({
    label: "persistent browser storage",
    pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/,
  }),
  Object.freeze({
    label: "ambient DOM event listener",
    pattern: /\b(?:addEventListener|removeEventListener)\s*\(/,
  }),
  Object.freeze({
    label: "legacy component registration",
    pattern: /\b(?:Object\.registerClass|attachMovie|startDrag|stopDrag)\b/,
  }),
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required",
  );
  invariant(
    !path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`,
  );
  const absolutePath = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, absolutePath);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes the project: ${relativePath}`,
  );
  return absolutePath;
}

function expectedRange(first, last) {
  return Array.from({length: last - first + 1}, (_, index) => first + index);
}

function validateHash(value, label) {
  invariant(/^[a-f0-9]{64}$/.test(value ?? ""), `${label} SHA-256 is invalid`);
}

function validateExportSpec(exportSpec, expected) {
  invariant(
    exportSpec?.objectId === expected.objectId &&
      exportSpec.functionName === expected.functionName &&
      exportSpec.frameCount === expected.frameCount,
    `${expected.label} identity changed`,
  );
  invariant(
    Number.isSafeInteger(exportSpec.framesHtmlBytes) &&
      exportSpec.framesHtmlBytes > 0,
    `${expected.label} frames export byte count is invalid`,
  );
  validateHash(exportSpec.framesHtmlSha256, `${expected.label} frames export`);
  invariant(
    Number.isSafeInteger(exportSpec.exportCanvas?.width) &&
      exportSpec.exportCanvas.width > 0 &&
      Number.isSafeInteger(exportSpec.exportCanvas?.height) &&
      exportSpec.exportCanvas.height > 0,
    `${expected.label} canvas dimensions are invalid`,
  );
  invariant(
    Number.isFinite(exportSpec.exportInternalTranslation?.x) &&
      Number.isFinite(exportSpec.exportInternalTranslation?.y),
    `${expected.label} internal translation is invalid`,
  );
  for (const [label, value] of [
    ["placed-function count", exportSpec.expectedPlacedFunctionCount],
    ["font-function count", exportSpec.expectedFontFunctionCount],
  ]) {
    invariant(
      Number.isSafeInteger(value) && value > 0,
      `${expected.label} ${label} is invalid`,
    );
  }
  validateHash(
    exportSpec.expectedPlacedFunctionsSha256,
    `${expected.label} placed functions`,
  );
  validateHash(
    exportSpec.expectedFontFunctionsSha256,
    `${expected.label} font functions`,
  );
}

export function validateFq001CompositeSpec(spec) {
  invariant(spec?.schemaVersion === 1, "FQ001 spec schemaVersion must be 1");
  invariant(spec.animationId === ANIMATION_ID, "FQ001 animationId changed");
  invariant(
    spec.classification === EXPECTED_CLASSIFICATION,
    "FQ001 engineering-only classification changed",
  );
  invariant(
    typeof spec.title === "string" && spec.title.length > 0,
    "FQ001 title is required",
  );

  const expectedSourcePrefix =
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/";
  invariant(
    spec.source?.swf === `${expectedSourcePrefix}L4FQ01.swf` &&
      spec.source.swfBytes === 23_357,
    "FQ001 SWF binding changed",
  );
  invariant(
    spec.source?.fla === `${expectedSourcePrefix}L4FQ01.fla` &&
      spec.source.flaBytes === 806_912,
    "FQ001 FLA binding changed",
  );
  validateHash(spec.source.swfSha256, "FQ001 SWF");
  validateHash(spec.source.flaSha256, "FQ001 FLA");
  invariant(
    spec.source.associatedAudio === null,
    "FQ001 must not invent an associated audio file",
  );

  for (const [pathKey, hashKey, label] of [
    ["scenarioInventory", "scenarioInventorySha256", "scenario inventory"],
    [
      "frameDomainDisposition",
      "frameDomainDispositionSha256",
      "frame-domain disposition",
    ],
    ["audioAudit", "audioAuditSha256", "audio audit"],
    ["ffdecScripts", "ffdecScriptsSha256", "FFDec scripts"],
    ["swfmillStructure", "swfmillStructureSha256", "swfmill structure"],
  ]) {
    invariant(
      typeof spec.evidence?.[pathKey] === "string" &&
        spec.evidence[pathKey].length > 0,
      `FQ001 ${label} path is required`,
    );
    validateHash(spec.evidence?.[hashKey], `FQ001 ${label}`);
  }

  invariant(
    spec.ffdecExport?.tool === EXPECTED_FFDEC_VERSION &&
      spec.ffdecExport.helperBytes === 52_872,
    "FQ001 FFDec tool/helper binding changed",
  );
  validateHash(spec.ffdecExport.helperSha256, "FQ001 FFDec helper");
  validateExportSpec(spec.ffdecExport.primary, {
    label: "FQ001 primary export",
    objectId: 145,
    functionName: "sprite145",
    frameCount: 52,
  });
  validateExportSpec(spec.ffdecExport.companion, {
    label: "FQ001 companion export",
    objectId: 100,
    functionName: "sprite100",
    frameCount: 1,
  });
  invariant(
    spec.ffdecExport.companion.fixedFrame === 1,
    "FQ001 companion fixed frame changed",
  );
  const merged = spec.ffdecExport.mergedDefinitionContract;
  invariant(
    merged?.expectedPlacedFunctionCount === 48 &&
      merged.expectedFontFunctionCount === 12 &&
      merged.embeddedImageVariableCount === 0,
    "FQ001 merged definition counts changed",
  );
  for (const [label, value] of [
    ["merged placed functions", merged.expectedPlacedFunctionsSha256],
    ["merged font functions", merged.expectedFontFunctionsSha256],
    ["merged embedded images", merged.embeddedImageVariablesSha256],
  ]) {
    validateHash(value, `FQ001 ${label}`);
  }

  invariant(
    JSON.stringify(spec.timeline?.stage) ===
      JSON.stringify({
        width: 800,
        height: 600,
        backgroundColor: "#b8d8f7",
      }) &&
      spec.timeline.fps === 12,
    "FQ001 native stage contract changed",
  );
  const root = spec.timeline.root;
  invariant(
    root?.frameCount === 10 &&
      root.preloaderStopFrame === 1 &&
      root.beginFrame === 6 &&
      root.beginLabel === "begin",
    "FQ001 root timeline contract changed",
  );
  invariant(
    JSON.stringify(root.primaryPlacement) ===
      JSON.stringify({
        depth: 10,
        name: "animation",
        objectId: 145,
        matrix: [1, 0, 0, 1, 412.4, 283.3],
        stageAdapterMatrix: [1, 0, 0, 1, 93.3, 88.7],
        colorTransform: [0, 0, 0, 0, 255, 255, 255, 255],
      }),
    "FQ001 primary root placement changed",
  );
  invariant(
    JSON.stringify(root.companionPlacement) ===
      JSON.stringify({
        depth: 1,
        name: "Mc_BackText",
        objectId: 100,
        matrix: [1, 0, 0, 0.999847412109375, 410.4, 286.3],
        stageAdapterMatrix: [
          1,
          0,
          0,
          0.999847412109375,
          41.75,
          123.82479553222657,
        ],
        colorTransform: [51, 51, 51, 0, 0, 0, 0, 23],
      }),
    "FQ001 companion root placement changed",
  );
  invariant(
    JSON.stringify(spec.timeline.public) ===
      JSON.stringify({
        frameDomain: MAIN_FRAME_DOMAIN,
        frameCount: 52,
        firstFrame: 1,
        lastFrame: 52,
        terminalStopFrame: 52,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      }),
    "FQ001 public frame-domain contract changed",
  );
  invariant(
    JSON.stringify(spec.timeline.fixedCompanion) ===
      JSON.stringify({
        frameDomain: COMPANION_FRAME_DOMAIN,
        frameCount: 1,
        fixedFrame: 1,
        standaloneRequestsEnabled: false,
      }),
    "FQ001 fixed companion contract changed",
  );

  const runtime = spec.runtimeContract;
  invariant(
    runtime?.kind === "source-static-dual-sprite-composite-prefix" &&
      runtime.scenario === EXPECTED_SCENARIO &&
      JSON.stringify(runtime.supportedLanguages) === JSON.stringify(["en"]) &&
      runtime.seedMapping ===
        "normalized-but-unused-by-source-static-composite",
    "FQ001 runtime identity contract changed",
  );
  for (const key of [
    "rootRequestsEnabled",
    "companionStandaloneRequestsEnabled",
    "legacyActionScriptExecuted",
    "audioEnabled",
    "scrollEnabled",
    "quizEnabled",
    "textInputEnabled",
    "networkEnabled",
    "timersOrAutoplayEnabled",
    "sourceControlsEnabled",
    "sourceReplayEstablished",
  ]) {
    invariant(runtime[key] === false, `FQ001 ${key} must remain false`);
  }
  invariant(
    Array.isArray(runtime.unresolved) && runtime.unresolved.length >= 5,
    "FQ001 unresolved obligations are incomplete",
  );

  const allowedIds = expectedRange(84, 145);
  const forbiddenIds = expectedRange(1, 83);
  invariant(
    spec.objectBoundary?.allowedObjectIdFirst === 84 &&
      spec.objectBoundary.allowedObjectIdLast === 145 &&
      spec.objectBoundary.allowedObjectIdsSha256 ===
        sha256(JSON.stringify(allowedIds)),
    "FQ001 allowed object boundary changed",
  );
  invariant(
    spec.objectBoundary?.forbiddenObjectIdFirst === 1 &&
      spec.objectBoundary.forbiddenObjectIdLast === 83 &&
      spec.objectBoundary.forbiddenObjectIdsSha256 ===
        sha256(JSON.stringify(forbiddenIds)),
    "FQ001 forbidden object boundary changed",
  );
  invariant(
    JSON.stringify(spec.objectBoundary.forbiddenExportNames) ===
      JSON.stringify([
        "FUIComponentSymbol",
        "UpArrow",
        "ScrollThumb",
        "DownArrow",
        "FScrollBarSymbol",
      ]),
    "FQ001 forbidden legacy export-name boundary changed",
  );

  invariant(
    spec.output?.script ===
      "public/flash-assets/courses/course-g05-l04-fq-001/canvas-renderer.js" &&
      spec.output.manifest ===
        "public/flash-assets/courses/course-g05-l04-fq-001/manifest.json" &&
      spec.output.report ===
        "migrations/course-g05-l04-fq-001/evidence/dual-sprite-composite-current-js-candidate.json" &&
      spec.output.globalRegistry === "HELP_MATH_CANVAS_ASSETS",
    "FQ001 dedicated output contract changed",
  );
  invariant(
    Object.keys(spec.acceptanceEffects ?? {}).length >= 16 &&
      Object.values(spec.acceptanceEffects).every((value) => value === false) &&
      spec.strictAcceptanceEffect === "none",
    "FQ001 acceptance effects must all remain false",
  );
  return spec;
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", spec: DEFAULT_SPEC};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--ffdec" || argument === "--spec") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("-"),
        `${argument} requires one value`,
      );
      if (argument === "--ffdec") options.ffdec = value;
      else options.spec = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function readBinding(relativePath, expected = {}) {
  const absolutePath = projectPath(relativePath);
  const [metadata, canonical] = await Promise.all([
    lstat(absolutePath),
    realpath(absolutePath),
  ]);
  invariant(metadata.isFile(), `${relativePath}: expected a regular file`);
  invariant(
    canonical === absolutePath,
    `${relativePath}: symbolic-link or path-alias input is forbidden`,
  );
  const bytes = await readFile(absolutePath);
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes.toString("utf8"),
  };
  if (expected.bytes !== undefined) {
    invariant(
      binding.bytes === expected.bytes,
      `${relativePath}: expected ${expected.bytes} bytes, observed ${binding.bytes}`,
    );
  }
  if (expected.sha256 !== undefined) {
    invariant(
      binding.sha256 === expected.sha256,
      `${relativePath}: SHA-256 drifted`,
    );
  }
  return binding;
}

function withoutContents(binding) {
  const {contents: _contents, ...metadata} = binding;
  return metadata;
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`,
  );
  return {command, version: EXPECTED_FFDEC_VERSION};
}

async function exportSprite({ffdec, objectId, sourceSwf, temporaryRoot}) {
  const exportRoot = path.join(temporaryRoot, `sprite-${objectId}`);
  const result = await execFile(
    ffdec.command,
    [
      "-config",
      "packJavaScripts=false",
      "-onerror",
      "abort",
      "-selectid",
      String(objectId),
      "-format",
      "sprite:canvas",
      "-export",
      "sprite",
      exportRoot,
      projectPath(sourceSwf),
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `FQ001 sprite-${objectId} FFDec export version changed`,
  );
  const exportDirectory = path.join(
    exportRoot,
    `DefineSprite_${objectId}`,
  );
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportDirectory, "canvas.js")),
    readFile(path.join(exportDirectory, "frames.html")),
  ]);
  return {helper, frames};
}

function extractDefinitionSection(framesHtml) {
  const normalized = framesHtml.replace(/\r\n?/g, "\n");
  const inlineMarker =
    '<script>var canvas=document.getElementById("myCanvas");';
  const inlineStart = normalized.indexOf(inlineMarker);
  invariant(inlineStart >= 0, "FFDec inline bootstrap marker is missing");
  invariant(
    normalized.indexOf(inlineMarker, inlineStart + 1) < 0,
    "FFDec inline bootstrap marker is duplicated",
  );
  const scriptEnd = normalized.indexOf("</script>", inlineStart);
  invariant(scriptEnd > inlineStart, "FFDec inline script end is missing");
  const definitionStart = normalized.indexOf(
    "var scalingGrids = {};",
    inlineStart,
  );
  const viewerStart = normalized.indexOf("\nvar frame = -1;", definitionStart);
  invariant(
    definitionStart >= 0 &&
      viewerStart > definitionStart &&
      viewerStart < scriptEnd,
    "FFDec definition/viewer boundary is invalid",
  );
  return {
    normalized,
    definitionStart,
    viewerStart,
    definitions: normalized.slice(definitionStart, viewerStart).trimEnd(),
  };
}

function inspectFramesExport(frames, exportSpec, label) {
  invariant(
    frames.length === exportSpec.framesHtmlBytes &&
      sha256(frames) === exportSpec.framesHtmlSha256,
    `${label} fresh FFDec frames export drifted`,
  );
  const section = extractDefinitionSection(frames.toString("utf8"));
  const canvasPattern = new RegExp(
    `<canvas\\s+id="myCanvas"\\s+width="${exportSpec.exportCanvas.width}"\\s+height="${exportSpec.exportCanvas.height}"`,
  );
  invariant(canvasPattern.test(section.normalized), `${label} canvas changed`);
  const target = exportSpec.functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const header = section.definitions.match(
    new RegExp(
      `function\\s+${target}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
        `ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1,([-0-9.]+),` +
        `([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*var frame_cnt = (\\d+);`,
    ),
  );
  invariant(header, `${label} target sprite header changed`);
  invariant(
    Number(header[1]) === exportSpec.exportInternalTranslation.x &&
      Number(header[2]) === exportSpec.exportInternalTranslation.y &&
      Number(header[3]) === exportSpec.frameCount,
    `${label} target sprite geometry/frame count changed`,
  );
  const placed = [
    ...new Set(
      [...section.definitions.matchAll(
        /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g,
      )].map((match) => match[1]),
    ),
  ].sort();
  invariant(
    placed.length === exportSpec.expectedPlacedFunctionCount &&
      sha256(JSON.stringify(placed)) ===
        exportSpec.expectedPlacedFunctionsSha256,
    `${label} placed-function allowlist changed`,
  );
  const fonts = [
    ...section.definitions.matchAll(
      /function\s+(font\d+)\(ctx,ch,textColor\)\{/g,
    ),
  ].map((match) => match[1]);
  invariant(
    fonts.length === exportSpec.expectedFontFunctionCount &&
      sha256(JSON.stringify(fonts)) ===
        exportSpec.expectedFontFunctionsSha256,
    `${label} font-function allowlist changed`,
  );
  const images = [
    ...section.definitions.matchAll(
      /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\)/g,
    ),
  ].map((match) => match[1]);
  invariant(images.length === 0, `${label} unexpectedly embeds an image`);
  const viewer = section.normalized.slice(section.viewerStart);
  const pushedFrames = [...viewer.matchAll(/frames\.push\((\d+)\);/g)].map(
    (match) => Number(match[1]),
  );
  invariant(
    pushedFrames.length === exportSpec.frameCount &&
      pushedFrames.every((frame, index) => frame === index),
    `${label} viewer frame sequence changed`,
  );
  return {...section, fonts, images, placed};
}

function mergeFrameDefinitions(primary, companion, mergedContract) {
  const scalingMarker = "var scalingGrids = {};";
  invariant(
    primary.definitions.startsWith(scalingMarker) &&
      companion.definitions.startsWith(scalingMarker),
    "FQ001 FFDec scaling-grid declarations changed",
  );
  const companionBody = companion.definitions
    .slice(scalingMarker.length)
    .trimStart();
  const mergedDefinitions =
    `${scalingMarker}\n${companionBody}\n` +
    primary.definitions.slice(scalingMarker.length).trimStart();
  const primaryFunctions = new Set(
    [...primary.definitions.matchAll(
      /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g,
    )].map((match) => match[1]),
  );
  const companionFunctions = new Set(
    [...companion.definitions.matchAll(
      /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g,
    )].map((match) => match[1]),
  );
  const collisions = [...companionFunctions].filter((name) =>
    primaryFunctions.has(name),
  );
  invariant(
    collisions.length === 0,
    `FQ001 primary/companion function collision: ${collisions.join(", ")}`,
  );
  const placed = [
    ...new Set(
      [...mergedDefinitions.matchAll(
        /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g,
      )].map((match) => match[1]),
    ),
  ].sort();
  const fonts = [
    ...mergedDefinitions.matchAll(
      /function\s+(font\d+)\(ctx,ch,textColor\)\{/g,
    ),
  ].map((match) => match[1]);
  invariant(
    placed.length === mergedContract.expectedPlacedFunctionCount &&
      sha256(JSON.stringify(placed)) ===
        mergedContract.expectedPlacedFunctionsSha256,
    "FQ001 merged placed-function allowlist changed",
  );
  invariant(
    fonts.length === mergedContract.expectedFontFunctionCount &&
      sha256(JSON.stringify(fonts)) ===
        mergedContract.expectedFontFunctionsSha256,
    "FQ001 merged font-function allowlist changed",
  );
  const mergedHtml =
    primary.normalized.slice(0, primary.definitionStart) +
    mergedDefinitions +
    primary.normalized.slice(primary.viewerStart);
  return {mergedHtml, mergedDefinitions, fonts, placed};
}

function validateDrawingObjectBoundary(definitions, spec) {
  const objectIds = [
    ...definitions.matchAll(
      /function\s+(?:font|morphshape|shape|sprite|text)(\d+)\s*\(/g,
    ),
  ].map((match) => Number(match[1]));
  invariant(objectIds.length > 0, "FQ001 merged definitions are empty");
  const forbidden = objectIds.filter(
    (objectId) =>
      objectId >= spec.objectBoundary.forbiddenObjectIdFirst &&
      objectId <= spec.objectBoundary.forbiddenObjectIdLast,
  );
  invariant(
    forbidden.length === 0,
    `FQ001 forbidden object ID entered runtime definitions: ${forbidden.join(", ")}`,
  );
  invariant(
    objectIds.every(
      (objectId) =>
        objectId >= spec.objectBoundary.allowedObjectIdFirst &&
        objectId <= spec.objectBoundary.allowedObjectIdLast,
    ),
    "FQ001 runtime definition escaped the object-ID allow range",
  );
  for (const exportName of spec.objectBoundary.forbiddenExportNames) {
    invariant(
      !definitions.includes(exportName),
      `FQ001 forbidden legacy export entered definitions: ${exportName}`,
    );
  }
  return [...new Set(objectIds)].sort((left, right) => left - right);
}

function compatibilitySpec(spec, mergedHtml) {
  const primary = spec.ffdecExport.primary;
  const placement = spec.timeline.root.primaryPlacement;
  const merged = spec.ffdecExport.mergedDefinitionContract;
  return {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    source: {
      swf: spec.source.swf,
      swfSha256: spec.source.swfSha256,
    },
    evidence: {
      scenarioInventory: spec.evidence.scenarioInventory,
      scenarioInventorySha256: spec.evidence.scenarioInventorySha256,
      audioAudit: spec.evidence.audioAudit,
      audioAuditSha256: spec.evidence.audioAuditSha256,
    },
    ffdecExport: {
      tool: spec.ffdecExport.tool,
      helperSha256: spec.ffdecExport.helperSha256,
      framesHtmlSha256: sha256(Buffer.from(mergedHtml)),
      targetSpriteObjectId: primary.objectId,
      targetSpriteFunction: primary.functionName,
      exportCanvas: primary.exportCanvas,
      exportInternalTranslation: primary.exportInternalTranslation,
      expectedPlacedFunctionCount: merged.expectedPlacedFunctionCount,
      expectedPlacedFunctionsSha256: merged.expectedPlacedFunctionsSha256,
      expectedFontFunctionCount: merged.expectedFontFunctionCount,
      expectedFontFunctionsSha256: merged.expectedFontFunctionsSha256,
      embeddedImageVariableCount: merged.embeddedImageVariableCount,
      embeddedImageVariablesSha256: merged.embeddedImageVariablesSha256,
    },
    timeline: {
      fps: spec.timeline.fps,
      stage: spec.timeline.stage,
      root: {
        frameCount: spec.timeline.root.frameCount,
        preloaderStopFrame: spec.timeline.root.preloaderStopFrame,
        beginFrame: spec.timeline.root.beginFrame,
        beginLabel: spec.timeline.root.beginLabel,
        placementName: placement.name,
        placementTwips: {
          x: placement.matrix[4] * 20,
          y: placement.matrix[5] * 20,
        },
        placementPixels: {
          x: placement.matrix[4],
          y: placement.matrix[5],
        },
      },
      local: {
        timelineId: spec.timeline.public.frameDomain,
        frameCount: spec.timeline.public.frameCount,
        playbackMode: spec.timeline.public.playbackMode,
        publicFrameIndexing: spec.timeline.public.publicFrameIndexing,
      },
      stageRenderOffset: {
        x: placement.stageAdapterMatrix[4],
        y: placement.stageAdapterMatrix[5],
      },
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: [spec.runtimeContract.scenario],
      defaultScenario: spec.runtimeContract.scenario,
      supportedLanguages: spec.runtimeContract.supportedLanguages,
      seedMapping: spec.runtimeContract.seedMapping,
      blockedLocalFrameRanges: [],
      unresolved: spec.runtimeContract.unresolved,
    },
    output: spec.output,
    strictAcceptanceEffect: "none",
  };
}

function replaceExactlyOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  invariant(first >= 0, `${label}: expected marker is missing`);
  invariant(
    source.indexOf(search, first + search.length) < 0,
    `${label}: marker is duplicated`,
  );
  return (
    source.slice(0, first) +
    replacement +
    source.slice(first + search.length)
  );
}

function patchCompositeRuntime(runtime, metadata, spec) {
  const primary = spec.timeline.root.primaryPlacement;
  const companion = spec.timeline.root.companionPlacement;
  const dedicatedMetadata = {
    ...metadata,
    generatorInput: {
      ...metadata.generatorInput,
      primaryFramesHtmlSha256:
        spec.ffdecExport.primary.framesHtmlSha256,
      companionFramesHtmlSha256:
        spec.ffdecExport.companion.framesHtmlSha256,
    },
    sourceComposite: {
      rootFrame: spec.timeline.root.beginFrame,
      renderOrder: ["stage-background", COMPANION_FRAME_DOMAIN, MAIN_FRAME_DOMAIN],
      primary: {
        frameDomain: MAIN_FRAME_DOMAIN,
        frameCount: spec.timeline.public.frameCount,
        requestedFrameRange: [1, 52],
        placement: primary,
      },
      companion: {
        frameDomain: COMPANION_FRAME_DOMAIN,
        frameCount: 1,
        fixedFrame: 1,
        standaloneRequestsEnabled: false,
        placement: companion,
      },
      rootRequestsEnabled: false,
    },
    requestContract: {
      frameDomain: MAIN_FRAME_DOMAIN,
      scenario: EXPECTED_SCENARIO,
      languages: ["en"],
      rootRejected: true,
      companionStandaloneRejected: true,
    },
  };

  let patched = replaceExactlyOnce(
    runtime,
    "/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */",
    `/* Generated by ${GENERATOR_PATH} using the hash-bound safe FFDec sanitizer. */`,
    "FQ001 runtime generator header",
  );
  patched = replaceExactlyOnce(
    patched,
    `var METADATA = deepFreeze(${JSON.stringify(metadata, null, 2)});`,
    `var METADATA = deepFreeze(${JSON.stringify(dedicatedMetadata, null, 2)});`,
    "FQ001 runtime metadata",
  );
  patched = replaceExactlyOnce(
    patched,
    `function resolveFrameState(request) {
    request = request || {};
    var frame = request.frame;`,
    `function resolveFrameState(request) {
    request = request || {};
    var requestedFrameDomain = request.frameDomain === undefined
        ? ${JSON.stringify(MAIN_FRAME_DOMAIN)}
        : request.frameDomain;
    if (requestedFrameDomain !== ${JSON.stringify(MAIN_FRAME_DOMAIN)}) {
        throw new Error("unsupported frame domain: " + requestedFrameDomain);
    }
    var frame = request.frame;`,
    "FQ001 runtime frame-domain guard",
  );
  const primaryMatrix = primary.stageAdapterMatrix;
  const companionMatrix = companion.stageAdapterMatrix;
  const companionColor = companion.colorTransform;
  patched = replaceExactlyOnce(
    patched,
    `        ctx.transform(1, 0, 0, 1, ${primaryMatrix[4]}, ${primaryMatrix[5]});
        sprite145(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`,
    `        ctx.save();
        try {
            ctx.transform(${companionMatrix.join(", ")});
            sprite100(ctx, new cxform(${companionColor.join(",")}), 0, 0, 0);
        } finally {
            ctx.restore();
        }
        ctx.transform(${primaryMatrix.join(", ")});
        sprite145(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`,
    "FQ001 dual-sprite draw call",
  );
  patched = replaceExactlyOnce(
    patched,
    `        targetCanvas.setAttribute("data-runtime-scenario", state.scenario);
        targetCanvas.setAttribute("data-runtime-seed", String(state.seed));`,
    `        targetCanvas.setAttribute("data-flash-lang", state.lang);
        targetCanvas.setAttribute("data-flash-scenario", state.scenario);
        targetCanvas.setAttribute("data-flash-seed", String(state.seed));
        targetCanvas.setAttribute("data-runtime-language", state.lang);
        targetCanvas.setAttribute("data-runtime-scenario", state.scenario);
        targetCanvas.setAttribute("data-runtime-seed", String(state.seed));`,
    "FQ001 canvas identity attributes",
  );

  for (const {label, pattern} of BLOCKED_RUNTIME_PATTERNS) {
    invariant(!pattern.test(patched), `FQ001 runtime contains blocked ${label}`);
  }
  for (const exportName of spec.objectBoundary.forbiddenExportNames) {
    invariant(
      !patched.includes(exportName),
      `FQ001 runtime contains forbidden legacy export: ${exportName}`,
    );
  }
  const runtimeObjectIds = [
    ...patched.matchAll(
      /\b(?:font|morphshape|shape|sprite|text)(\d+)\b/g,
    ),
  ].map((match) => Number(match[1]));
  invariant(
    runtimeObjectIds.every(
      (objectId) =>
        objectId >= spec.objectBoundary.allowedObjectIdFirst &&
        objectId <= spec.objectBoundary.allowedObjectIdLast,
    ),
    "FQ001 runtime references a denied drawing object ID",
  );
  new Script(patched, {filename: path.basename(spec.output.script)});
  return {metadata: dedicatedMetadata, runtime: patched};
}

function validateBoundEvidence(spec, scenarioInventory, disposition, audioAudit) {
  const root = scenarioInventory.timelineInventory?.find(
    (timeline) => timeline.timelineId === "root",
  );
  const primary = scenarioInventory.timelineInventory?.find(
    (timeline) => timeline.timelineId === MAIN_FRAME_DOMAIN,
  );
  const companion = scenarioInventory.timelineInventory?.find(
    (timeline) => timeline.timelineId === COMPANION_FRAME_DOMAIN,
  );
  invariant(
    scenarioInventory.animationId === spec.animationId &&
      scenarioInventory.source?.swfSha256 === spec.source.swfSha256 &&
      scenarioInventory.source?.flaSha256 === spec.source.flaSha256 &&
      scenarioInventory.source?.stage?.width === 800 &&
      scenarioInventory.source?.stage?.height === 600 &&
      scenarioInventory.source?.fps === 12 &&
      scenarioInventory.source?.rootFrameCount === 10,
    "FQ001 scenario-inventory source binding changed",
  );
  invariant(
    root?.frameCount === 10 &&
      root.frameLabels?.some(
        (label) => label.frame === 6 && label.label === "begin",
      ),
    "FQ001 root begin structure changed",
  );
  const primaryPlacement = root.namedPlacements?.find(
    (placement) =>
      placement.frame === 6 &&
      placement.depth === "10" &&
      placement.name === "animation" &&
      Number(placement.objectId) === 145 &&
      placement.hasClipActions === false,
  );
  const companionPlacement = root.namedPlacements?.find(
    (placement) =>
      placement.frame === 6 &&
      placement.depth === "1" &&
      placement.name === "Mc_BackText" &&
      Number(placement.objectId) === 100 &&
      placement.hasClipActions === false,
  );
  invariant(
    primaryPlacement && companionPlacement,
    "FQ001 dual root placement structure changed",
  );
  invariant(
    primary?.frameCount === 52 &&
      Number(primary.objectId) === 145 &&
      companion?.frameCount === 1 &&
      Number(companion.objectId) === 100,
    "FQ001 source sprite frame counts changed",
  );
  invariant(
    companion.frameLabels?.length === 0 &&
      companion.namedPlacements?.length === 0 &&
      companion.controlStates?.length === 1 &&
      primary.frameLabels?.length === 0 &&
      primary.namedPlacements?.length === 0 &&
      primary.controlStates?.some(
        (state) =>
          state.frame === 52 &&
          state.reasons?.includes("script-stop-state"),
      ),
    "FQ001 source-static sprite control structure changed",
  );

  invariant(
    disposition.animationId === spec.animationId &&
      disposition.status ===
        "structurally-enumerated-dispositions-unresolved",
    "FQ001 canonical frame-domain disposition boundary changed",
  );
  const dispositionById = new Map(
    disposition.timelines?.map((timeline) => [timeline.timelineId, timeline]),
  );
  invariant(
    dispositionById.get(MAIN_FRAME_DOMAIN)?.disposition === "unresolved" &&
      dispositionById.get(COMPANION_FRAME_DOMAIN)?.disposition ===
        "unresolved",
    "FQ001 unresolved canonical sprite dispositions changed",
  );

  invariant(
    audioAudit.animationId === spec.animationId &&
      audioAudit.source?.observedSha256 === spec.source.swfSha256 &&
      audioAudit.source?.hashMatches === true,
    "FQ001 audio-audit source binding changed",
  );
  invariant(
    audioAudit.embeddedAudio?.defineSounds?.length === 0 &&
      audioAudit.embeddedAudio?.soundStreams?.length === 0 &&
      audioAudit.embeddedAudio?.startSounds?.length === 0 &&
      audioAudit.actionScriptAudioOperations?.length === 0 &&
      audioAudit.externalAudio?.exactAssociations?.length === 0 &&
      audioAudit.externalAudio?.lessonGroupCandidates?.length === 83,
    "FQ001 fail-closed audio boundary changed",
  );
  return {
    root,
    primary,
    companion,
    canonicalDispositionStatus: disposition.status,
  };
}

async function runBrowserSweep(browser, runtime, spec) {
  const page = await browser.newPage({viewport: {width: 800, height: 600}});
  const consoleErrors = [];
  const pageErrors = [];
  const networkRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => networkRequests.push(request.url()));
  try {
    await page.setContent(
      '<canvas id="stage" width="800" height="600"></canvas>',
      {waitUntil: "load"},
    );
    await page.addScriptTag({content: runtime});
    const result = await page.evaluate(async ({
      animationId,
      companionFrameDomain,
      frameCount,
      mainFrameDomain,
      scenario,
    }) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("FQ001 runtime did not register");
      await asset.ready();
      const canvas = document.getElementById("stage");
      const context = canvas.getContext("2d", {willReadFrequently: true});
      const sampleFrames = new Set([1, 19, 20, 52]);
      const samples = [];
      for (let frame = 1; frame <= frameCount; frame += 1) {
        const state = asset.render(canvas, {
          frame,
          frameDomain: mainFrameDomain,
          scenario,
          lang: "en",
          seed: 0,
        });
        if (
          state.localFrame !== frame ||
          state.exportFrame !== frame - 1 ||
          state.frameDomain !== mainFrameDomain ||
          state.rootFrame !== 6 ||
          state.scenario !== scenario ||
          state.lang !== "en" ||
          state.seed !== 0 ||
          state.audioRendered !== false
        ) {
          throw new Error(`FQ001 deterministic identity mismatch at ${frame}`);
        }
        if (sampleFrames.has(frame)) {
          const pixels = context.getImageData(0, 0, 800, 600).data;
          let hash = 2166136261;
          let opaquePixelCount = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            hash ^= pixels[index];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 1];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 2];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 3];
            hash = Math.imul(hash, 16777619);
            if (pixels[index + 3] === 255) opaquePixelCount += 1;
          }
          samples.push({
            frame,
            fnv1a32Rgba: (hash >>> 0).toString(16).padStart(8, "0"),
            opaquePixelCount,
          });
        }
      }
      const rejectedRequests = [
        {
          frame: 1,
          frameDomain: "root",
          scenario,
          lang: "en",
          seed: 0,
        },
        {
          frame: 1,
          frameDomain: companionFrameDomain,
          scenario,
          lang: "en",
          seed: 0,
        },
        {
          frame: 1,
          frameDomain: "sprite-999",
          scenario,
          lang: "en",
          seed: 0,
        },
        {
          frame: 1,
          frameDomain: mainFrameDomain,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        },
        {
          frame: 1,
          frameDomain: mainFrameDomain,
          scenario,
          lang: "es",
          seed: 0,
        },
        {
          frame: 0,
          frameDomain: mainFrameDomain,
          scenario,
          lang: "en",
          seed: 0,
        },
        {
          frame: frameCount + 1,
          frameDomain: mainFrameDomain,
          scenario,
          lang: "en",
          seed: 0,
        },
      ];
      let rejectionCount = 0;
      for (const request of rejectedRequests) {
        for (const operation of ["resolve", "render"]) {
          try {
            if (operation === "resolve") asset.resolveFrameState(request);
            else asset.render(canvas, request);
          } catch {
            rejectionCount += 1;
            continue;
          }
          throw new Error(
            `FQ001 ${operation} accepted blocked request ${JSON.stringify(request)}`,
          );
        }
      }
      return {
        renderedFrameCount: frameCount,
        rejectionCount,
        expectedRejectionCount: rejectedRequests.length * 2,
        samples,
        metadata: asset.metadata,
        canvasIdentity: {
          frame: canvas.getAttribute("data-flash-frame"),
          frameDomain: canvas.getAttribute("data-flash-frame-domain"),
          rootFrame: canvas.getAttribute("data-flash-root-frame"),
          lang: canvas.getAttribute("data-flash-lang"),
          scenario: canvas.getAttribute("data-flash-scenario"),
          seed: canvas.getAttribute("data-flash-seed"),
        },
      };
    }, {
      animationId: spec.animationId,
      companionFrameDomain: COMPANION_FRAME_DOMAIN,
      frameCount: spec.timeline.public.frameCount,
      mainFrameDomain: MAIN_FRAME_DOMAIN,
      scenario: EXPECTED_SCENARIO,
    });
    invariant(
      result.renderedFrameCount === 52 &&
        result.rejectionCount === result.expectedRejectionCount,
      "FQ001 browser sweep or fail-closed request sweep was incomplete",
    );
    invariant(
      result.samples.length === 4 &&
        result.samples.every(
          (sample) => sample.opaquePixelCount === 800 * 600,
        ) &&
        new Set(result.samples.map((sample) => sample.fnv1a32Rgba)).size >= 2,
      "FQ001 representative frame pixels were incomplete or invariant",
    );
    invariant(
      result.metadata?.sourceComposite?.companion?.frameDomain ===
        COMPANION_FRAME_DOMAIN &&
        result.metadata.sourceComposite.companion.fixedFrame === 1 &&
        result.metadata.sourceComposite.companion
          .standaloneRequestsEnabled === false,
      "FQ001 runtime metadata lost the fixed companion contract",
    );
    invariant(
      consoleErrors.length === 0 &&
        pageErrors.length === 0 &&
        networkRequests.length === 0,
      `FQ001 browser safety failed: console=${consoleErrors.join("; ")} page=${pageErrors.join("; ")} network=${networkRequests.join("; ")}`,
    );
    return {
      ...result,
      browser: `Chromium ${browser.version()}`,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      unexpectedNetworkRequestCount: 0,
      nativeStage: {width: 800, height: 600},
    };
  } finally {
    await page.close();
  }
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function emit(relativePath, bytes, check) {
  if (check) {
    const current = await readFile(projectPath(relativePath));
    invariant(current.equals(bytes), `${relativePath}: generated output is stale`);
    return;
  }
  await atomicWrite(relativePath, bytes);
}

function buildManifest({
  bound,
  browserQa,
  built,
  evidenceBindings,
  generatorBinding,
  merged,
  objectIds,
  runtimeBytes,
  safeAdapterBinding,
  sourceBindings,
  spec,
  specBinding,
}) {
  return {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    authority:
      "Hash-bound source-static composition of the two root-frame-6 FFDec drawing exports plus a current-browser deterministic sweep only; no original-runtime, language, audio, human, Owner, strict, or publication acceptance is implied.",
    generator: GENERATOR_PATH,
    inputs: {
      spec: withoutContents(specBinding),
      generator: withoutContents(generatorBinding),
      safeFfdecSanitizer: withoutContents(safeAdapterBinding),
      sourceSwf: withoutContents(sourceBindings.swf),
      sourceFla: {
        ...withoutContents(sourceBindings.fla),
        authoringAuditEstablished: false,
      },
      evidence: Object.fromEntries(
        Object.entries(evidenceBindings).map(([key, value]) => [
          key,
          withoutContents(value),
        ]),
      ),
      freshFfdecExports: {
        tool: spec.ffdecExport.tool,
        helper: {
          bytes: spec.ffdecExport.helperBytes,
          sha256: spec.ffdecExport.helperSha256,
        },
        primary: {
          objectId: 145,
          framesHtmlBytes: spec.ffdecExport.primary.framesHtmlBytes,
          framesHtmlSha256:
            spec.ffdecExport.primary.framesHtmlSha256,
        },
        companion: {
          objectId: 100,
          framesHtmlBytes: spec.ffdecExport.companion.framesHtmlBytes,
          framesHtmlSha256:
            spec.ffdecExport.companion.framesHtmlSha256,
        },
        deterministicMergedFramesHtmlSha256:
          sha256(Buffer.from(merged.mergedHtml)),
      },
    },
    output: {
      script: spec.output.script,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: spec.output.globalRegistry,
    },
    sourceComposite: {
      rootFrame: 6,
      rootRendered: false,
      renderOrder: ["stage-background", COMPANION_FRAME_DOMAIN, MAIN_FRAME_DOMAIN],
      primary: {
        frameDomain: MAIN_FRAME_DOMAIN,
        sourceFrames: [1, 52],
        requestedFrameRange: [1, 52],
        placement: spec.timeline.root.primaryPlacement,
      },
      companion: {
        frameDomain: COMPANION_FRAME_DOMAIN,
        sourceFrame: 1,
        fixedForEveryPrimaryFrame: true,
        standaloneRequestsEnabled: false,
        placement: spec.timeline.root.companionPlacement,
      },
    },
    objectBoundary: {
      allowedObjectIdRange: [84, 145],
      observedRuntimeDefinitionObjectIds: objectIds,
      forbiddenObjectIdRange: [1, 83],
      forbiddenObjectIdCount: 83,
      forbiddenObjectIdsPresentInRuntime: [],
      forbiddenLegacyExportsPresentInRuntime: [],
    },
    safety: {
      noLegacyActionScriptExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      noScrollQuizInputOrSourceControls: true,
      pointerEventsEnabled: false,
      audioRendered: false,
      embeddedImages: built.imageVariables,
      drawingObjectAllowlist: built.placedFunctions,
    },
    requestContract: {
      allowed: {
        frameDomain: MAIN_FRAME_DOMAIN,
        frames: [1, 52],
        scenario: EXPECTED_SCENARIO,
        languages: ["en"],
      },
      rejected: [
        "root frame-domain requests",
        "sprite-100 standalone frame-domain requests",
        "unknown frame domains",
        "wrong scenarios",
        "Spanish requests",
        "frames outside 1..52",
      ],
    },
    browserQa,
    boundEvidenceState: {
      canonicalFrameDomainDispositionStatus:
        bound.canonicalDispositionStatus,
      canonicalPrimaryDisposition: "unresolved",
      canonicalCompanionDisposition: "unresolved",
      canonicalDispositionChanged: false,
      canonicalDispositionAcceptanceClaimed: false,
      exactAssociatedAudioCount: 0,
      lessonGroupAudioCandidateCount: 83,
    },
    runtimeMetadata: built.metadata,
    unresolved: spec.runtimeContract.unresolved,
    acceptanceEffects: spec.acceptanceEffects,
    strictAcceptanceEffect: "none",
  };
}

function buildReport({browserQa, manifest, spec, specBinding}) {
  return {
    schemaVersion: 1,
    artifactType:
      "g5-l4-fq001-dual-sprite-composite-current-javascript-candidate",
    animationId: spec.animationId,
    title: spec.title,
    status: "current-javascript-engineering-candidate-only",
    specification: withoutContents(specBinding),
    renderer: {
      kind: "safe-hash-bound-ffdec-dual-sprite-source-static-composite",
      primaryFrameDomain: MAIN_FRAME_DOMAIN,
      primaryFirstFrame: 1,
      primaryLastFrame: 52,
      fixedCompanionFrameDomain: COMPANION_FRAME_DOMAIN,
      fixedCompanionFrame: 1,
      rootEnabled: false,
      companionStandaloneEnabled: false,
      supportedLanguages: ["en"],
      audioEnabled: false,
      sourceControlsEnabled: false,
      runtimeScript: manifest.output,
      runtimeManifest: {
        path: spec.output.manifest,
        sha256: sha256(Buffer.from(stableJson(manifest))),
      },
    },
    browserQa,
    evidenceBoundary: {
      sourceSwfAndFlaHashBound: true,
      freshFfdecExportsHashBound: true,
      dualRootPlacementStructurallyBound: true,
      originalRuntimeBaselineUsed: false,
      authoritativeNaturalRuntimeEstablished: false,
      canonicalFrameDomainDispositionChanged: false,
      canonicalFrameDomainDispositionAccepted: false,
      audioAssociatedOrRendered: false,
      spanishVisualEstablished: false,
      sourceReplayEstablished: false,
      normalizedRmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictCompletionClaimed: false,
      publicationClaimed: false,
    },
    unresolved: spec.runtimeContract.unresolved,
    acceptanceEffects: spec.acceptanceEffects,
    strictAcceptanceEffect: "none",
  };
}

export async function buildFq001CompositeCandidate({
  check = false,
  ffdec = "ffdec",
  specPath = DEFAULT_SPEC,
} = {}) {
  const specBinding = await readBinding(specPath);
  const spec = validateFq001CompositeSpec(JSON.parse(specBinding.contents));
  const [
    generatorBinding,
    safeAdapterBinding,
    sourceSwf,
    sourceFla,
    scenarioInventory,
    frameDomainDisposition,
    audioAudit,
    ffdecScripts,
    swfmillStructure,
  ] = await Promise.all([
    readBinding(GENERATOR_PATH),
    readBinding(SAFE_ADAPTER_PATH),
    readBinding(spec.source.swf, {
      bytes: spec.source.swfBytes,
      sha256: spec.source.swfSha256,
    }),
    readBinding(spec.source.fla, {
      bytes: spec.source.flaBytes,
      sha256: spec.source.flaSha256,
    }),
    readBinding(spec.evidence.scenarioInventory, {
      sha256: spec.evidence.scenarioInventorySha256,
    }),
    readBinding(spec.evidence.frameDomainDisposition, {
      sha256: spec.evidence.frameDomainDispositionSha256,
    }),
    readBinding(spec.evidence.audioAudit, {
      sha256: spec.evidence.audioAuditSha256,
    }),
    readBinding(spec.evidence.ffdecScripts, {
      sha256: spec.evidence.ffdecScriptsSha256,
    }),
    readBinding(spec.evidence.swfmillStructure, {
      sha256: spec.evidence.swfmillStructureSha256,
    }),
  ]);
  const parsedScenarioInventory = JSON.parse(scenarioInventory.contents);
  const parsedDisposition = JSON.parse(frameDomainDisposition.contents);
  const parsedAudioAudit = JSON.parse(audioAudit.contents);
  const bound = validateBoundEvidence(
    spec,
    parsedScenarioInventory,
    parsedDisposition,
    parsedAudioAudit,
  );

  const ffdecTool = await inspectFfdec(ffdec);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "help-math-g5-l4-fq001-composite-"),
  );
  const browser = await chromium.launch({headless: true});
  try {
    const [primaryRaw, companionRaw] = await Promise.all([
      exportSprite({
        ffdec: ffdecTool,
        objectId: spec.ffdecExport.primary.objectId,
        sourceSwf: spec.source.swf,
        temporaryRoot,
      }),
      exportSprite({
        ffdec: ffdecTool,
        objectId: spec.ffdecExport.companion.objectId,
        sourceSwf: spec.source.swf,
        temporaryRoot,
      }),
    ]);
    for (const [label, exported] of [
      ["FQ001 primary", primaryRaw],
      ["FQ001 companion", companionRaw],
    ]) {
      invariant(
        exported.helper.length === spec.ffdecExport.helperBytes &&
          sha256(exported.helper) === spec.ffdecExport.helperSha256,
        `${label} fresh FFDec helper drifted`,
      );
    }
    invariant(
      primaryRaw.helper.equals(companionRaw.helper),
      "FQ001 primary and companion FFDec helpers differ",
    );
    const primary = inspectFramesExport(
      primaryRaw.frames,
      spec.ffdecExport.primary,
      "FQ001 primary",
    );
    const companion = inspectFramesExport(
      companionRaw.frames,
      spec.ffdecExport.companion,
      "FQ001 companion",
    );
    const merged = mergeFrameDefinitions(
      primary,
      companion,
      spec.ffdecExport.mergedDefinitionContract,
    );
    const objectIds = validateDrawingObjectBoundary(
      merged.mergedDefinitions,
      spec,
    );
    const adapterSpec = compatibilitySpec(spec, merged.mergedHtml);
    validateAdapterAuditEvidence(
      adapterSpec,
      parsedScenarioInventory,
      parsedAudioAudit,
    );
    const safeBuilt = buildSafeRuntime({
      helperSource: primaryRaw.helper.toString("utf8"),
      framesHtml: merged.mergedHtml,
      spec: adapterSpec,
    });
    const patched = patchCompositeRuntime(
      safeBuilt.runtime,
      safeBuilt.metadata,
      spec,
    );
    const built = {
      ...safeBuilt,
      metadata: patched.metadata,
      runtime: patched.runtime,
    };
    const runtimeBytes = Buffer.from(built.runtime);
    const browserQa = await runBrowserSweep(browser, built.runtime, spec);
    const manifest = buildManifest({
      bound,
      browserQa,
      built,
      evidenceBindings: {
        scenarioInventory,
        frameDomainDisposition,
        audioAudit,
        ffdecScripts,
        swfmillStructure,
      },
      generatorBinding,
      merged,
      objectIds,
      runtimeBytes,
      safeAdapterBinding,
      sourceBindings: {swf: sourceSwf, fla: sourceFla},
      spec,
      specBinding,
    });
    const manifestBytes = Buffer.from(stableJson(manifest));
    const report = buildReport({
      browserQa,
      manifest,
      spec,
      specBinding,
    });
    const reportBytes = Buffer.from(stableJson(report));
    await Promise.all([
      emit(spec.output.script, runtimeBytes, check),
      emit(spec.output.manifest, manifestBytes, check),
      emit(spec.output.report, reportBytes, check),
    ]);
    return {
      animationId: spec.animationId,
      check,
      runtime: {
        path: spec.output.script,
        bytes: runtimeBytes.length,
        sha256: sha256(runtimeBytes),
      },
      manifest: {
        path: spec.output.manifest,
        bytes: manifestBytes.length,
        sha256: sha256(manifestBytes),
      },
      report: {
        path: spec.output.report,
        bytes: reportBytes.length,
        sha256: sha256(reportBytes),
      },
      renderedFrameCount: browserQa.renderedFrameCount,
      blockedRequestRejectionCount: browserQa.rejectionCount,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await Promise.all([
      browser.close(),
      rm(temporaryRoot, {recursive: true, force: true}),
    ]);
  }
}

function printHelp() {
  process.stdout.write(
    "Usage: node scripts/build-g5-l4-fq001-dual-sprite-composite-candidate.mjs [options]\n\n" +
      "Options:\n" +
      "  --check              Verify generated outputs without rewriting them\n" +
      "  --ffdec <command>    FFDec launcher (default: ffdec)\n" +
      `  --spec <path>        Dedicated FQ001 specification (default: ${DEFAULT_SPEC})\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    buildFq001CompositeCandidate(options)
      .then((result) => process.stdout.write(`${stableJson(result)}`))
      .catch((error) => {
        process.stderr.write(
          `${error instanceof Error ? error.stack : String(error)}\n`,
        );
        process.exitCode = 1;
      });
  }
}
