#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {constants as fsConstants} from "node:fs";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  assertSafeReportOutput,
  parseSwfSourceFacts,
  summarizeScriptSources,
  validateG4L3MachineSourceAudits,
} from "./build-g4-l3-machine-source-audits.mjs";
import {validateReport as validateSourceOperationReport} from "./build-g4-l3-source-operation-index-v2.mjs";
import {validateStaticSourceEventIndex} from "./build-g4-l3-static-source-event-index.mjs";
import {
  collectSwfAssetDefinitions,
  validateAssetDefinitionCensus,
} from "./build-g4-l3-swf-asset-definition-census.mjs";
import {
  parseEmbeddedAudioPayloads,
  validateG4L3EmbeddedAudioArchive,
} from "./build-g4-l3-embedded-audio-archive.mjs";
import {validateG4L3CatalogAudioMediaProbe} from "./build-g4-l3-catalog-audio-media-probe.mjs";
import {validateG4L3AudioCasMediaProbe} from "./build-g4-l3-audio-cas-media-probe.mjs";
import {validatePairedAuthoringSourceBindingsReport} from "./build-g4-l3-paired-authoring-source-bindings.mjs";
import {validateSpecificationReadinessReport} from "./build-g4-l3-batch-001-specification-readiness.mjs";
import {validateImplementationRankingReport} from "./build-g4-l3-batch-001-implementation-ranking.mjs";
import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const SCHEMA_VERSION = 1;
const REPORT_TYPE = "g4-l3-vb005-acceptance-neutral-source-preaudit";
const ANIMATION_ID = "course-g04-l03-vb-005";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const SOURCE_SWF = `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/L3/VB/L3VB05.swf`;
const SOURCE_FLA = `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/L3/VB/L3VB05.fla`;
const SOURCE_AUDIO = `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/L3/SA/L3VB05.mp3`;
const HOTSPOT_PARSER = "scripts/parse-swfmill-vb005-hotspots.py";
const SAFE_ADAPTER_BUILDER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-vb005-source-preaudit.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-vb005-source-preaudit.md");

const EXPECTED = Object.freeze({
  assetId: "swf-7595fa85408ef64720006e0e24a02505507aebfd89282a5709bab97e09b162d6",
  swf: Object.freeze({
    path: SOURCE_SWF,
    archivePath: "HELP_COURSES/ELMGR4/L3/VB/L3VB05.swf",
    bytes: 66_761,
    sha256: "7595fa85408ef64720006e0e24a02505507aebfd89282a5709bab97e09b162d6",
  }),
  fla: Object.freeze({
    path: SOURCE_FLA,
    archivePath: "HELP_COURSES/ELMGR4/L3/VB/L3VB05.fla",
    bytes: 375_296,
    sha256: "b63ccfb65ed4e89b025efccf256b552a0f48831b758827cc1f39f0ffc0b7ec94",
  }),
  audio: Object.freeze({
    path: SOURCE_AUDIO,
    archivePath: "HELP_COURSES/ELMGR4/L3/SA/L3VB05.mp3",
    bytes: 276_864,
    sha256: "4cd42bda4932132d37215de80674ad645ee41a917aeefd37cae36d00ba620f9f",
  }),
  embeddedAudioPayloadSha256: "fc28d20d948520884b26babb83ac499b0d4e98f5d24bc05e8b63ac9c30bbc2af",
  machineAuditFingerprintSha256: "48cf8bee160b95c295f0244daafa90796219e438f4ad83244b749dc01172c4e7",
  sourceEventFingerprintSha256: "a5f836a993bd3647317be64099218b81b54c9e868d8728288758139058cca5a0",
  assetDefinitionInventorySha256: "1fb2f4022d0ca6ed769d4c336073eaad5e767d14a59ea48e85aae357c20aed24",
  embeddedAudioItemFingerprintSha256: "e7305f0769dd7bf195597ff81925b32eec57a50059f6bde63dc48ad6db264204",
  catalogAudioProbeFingerprintSha256: "b96f3fe13a684349d00243d1c119651cdca56f325f94ec6980ecb7009ce1237c",
  rankingItemFingerprintSha256: "40adf2c00eea34b264a9574aa9aa7d3cfef4ba471352cdf524ba17660a69f47e",
  ffdecVersion: "JPEXS Free Flash Decompiler v.26.2.1",
  canvasHelper: Object.freeze({
    bytes: 52_872,
    sha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  }),
  canvasFrames: Object.freeze({
    bytes: 1_033_269,
    sha256: "d39cfdc1571d9d8a3bfb53545e01899e95d14f7e75f5140df84ccd7f7f6c42e5",
  }),
  swfmillXml: Object.freeze({
    bytes: 342_342,
    sha256: "a2c4541b5a979245d492c297028bf825c24826081ffee1f97d258b688f2eaaaa",
  }),
  placedFunctions: Object.freeze({
    count: 44,
    sha256: "0232e490b2ad345e81e7b1a6a88eaf7ddc78cee6705abbed9e58f5515682e2aa",
  }),
  embeddedImages: Object.freeze({
    count: 0,
    sha256: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  }),
});

const INPUT_REPORTS = Object.freeze({
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  sourceOperations: "reports/g4-l3-source-operation-index-v2.json",
  sourceEvents: "reports/g4-l3-static-source-event-index.json",
  assetCensus: "reports/g4-l3-swf-asset-definition-census.json",
  embeddedAudio: "reports/g4-l3-embedded-audio-archive.json",
  catalogAudioProbe: "reports/g4-l3-catalog-audio-media-probe.json",
  audioCasProbe: "reports/g4-l3-audio-cas-media-probe.json",
  pairedAuthoring: "reports/g4-l3-paired-authoring-source-bindings.json",
  specificationReadiness: "reports/g4-l3-batch-001-specification-readiness.json",
  implementationRanking: "reports/g4-l3-batch-001-implementation-ranking.json",
  productContract: "reports/g4-l3-lesson-product-navigation-contract.json",
});

const VALIDATORS = Object.freeze({
  machineAudit: validateG4L3MachineSourceAudits,
  sourceOperations: validateSourceOperationReport,
  sourceEvents: validateStaticSourceEventIndex,
  assetCensus: validateAssetDefinitionCensus,
  embeddedAudio: validateG4L3EmbeddedAudioArchive,
  catalogAudioProbe: validateG4L3CatalogAudioMediaProbe,
  audioCasProbe: validateG4L3AudioCasMediaProbe,
  pairedAuthoring: validatePairedAuthoringSourceBindingsReport,
  specificationReadiness: validateSpecificationReadinessReport,
  implementationRanking: validateImplementationRankingReport,
});

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

function portable(value) {
  return value.split(path.sep).join("/");
}

function relative(filePath) {
  return portable(path.relative(projectRoot, filePath));
}

function resolveProjectPath(relativePath, {root = projectRoot} = {}) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, "project path is required");
  invariant(!path.isAbsolute(relativePath), `project path must be relative: ${relativePath}`);
  const output = path.resolve(root, relativePath);
  const projected = path.relative(root, output);
  invariant(projected && !projected.startsWith(`..${path.sep}`) && !path.isAbsolute(projected),
    `project path escapes root: ${relativePath}`);
  return output;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function readRegularFile(relativePath) {
  const absolutePath = resolveProjectPath(relativePath);
  const [metadata, bytes] = await Promise.all([lstat(absolutePath), readFile(absolutePath)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  return {absolutePath, metadata, bytes};
}

async function readJsonBinding(relativePath) {
  const file = await readRegularFile(relativePath);
  return {
    value: JSON.parse(file.bytes.toString("utf8")),
    binding: {
      path: relativePath,
      bytes: file.bytes.length,
      sha256: sha256(file.bytes),
    },
  };
}

async function verifyDeclaredGenerator(report, label) {
  const generator = report.generator;
  if (!generator?.path || !generator?.sha256) return {declared: false, verifiedNow: false};
  invariant(generator.path.startsWith("scripts/") && /^[a-f0-9]{64}$/.test(generator.sha256),
    `${label}: invalid declared generator binding`);
  const file = await readRegularFile(generator.path);
  invariant(sha256(file.bytes) === generator.sha256, `${label}: declared generator SHA-256 is stale`);
  return {
    declared: true,
    path: generator.path,
    bytes: file.bytes.length,
    sha256: generator.sha256,
    verifiedNow: true,
  };
}

async function verifiedSource(expected, label) {
  const file = await readRegularFile(expected.path);
  invariant(file.bytes.length === expected.bytes, `${label}: byte length changed`);
  invariant(sha256(file.bytes) === expected.sha256, `${label}: SHA-256 changed`);
  invariant((file.metadata.mode & 0o222) === 0, `${label}: source unexpectedly has a write bit`);
  invariant(file.metadata.nlink === 1, `${label}: source unexpectedly has multiple hard links`);
  return {
    bytes: file.bytes,
    binding: {
      path: expected.path,
      archivePath: expected.archivePath,
      bytes: file.bytes.length,
      sha256: expected.sha256,
      regularNonSymlinkFile: true,
      linkCount: file.metadata.nlink,
      mode: `0${(file.metadata.mode & 0o7777).toString(8)}`,
      readOnlyAtAudit: true,
    },
  };
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {}
  }
  throw new Error(`Executable not found: ${command}`);
}

async function toolEvidence(command, versionArgs, versionPattern, {jarSibling = false} = {}) {
  const executable = await resolveExecutable(command);
  const {stdout, stderr} = await execFile(command, versionArgs, {timeout: 30_000, maxBuffer: 4 * 1024 * 1024});
  const version = `${stdout}\n${stderr}`.replace(/\u001b\[[0-9;]*m/g, "").split("\n")
    .map((line) => line.trim()).find((line) => versionPattern.test(line));
  invariant(version, `Unrecognized ${command} version output`);
  const launcherBytes = await readFile(executable);
  const result = {
    command,
    version,
    executable: portable(executable),
    executableBytes: launcherBytes.length,
    executableSha256: sha256(launcherBytes),
  };
  if (jarSibling) {
    const jarPath = path.join(path.dirname(executable), "ffdec.jar");
    const jarBytes = await readFile(jarPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    result.jar = jarBytes ? {
      path: portable(jarPath),
      bytes: jarBytes.length,
      sha256: sha256(jarBytes),
    } : null;
  }
  return result;
}

async function walkFiles(directory, relativePath = "") {
  const entries = await readdir(path.join(directory, relativePath), {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(relativePath, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, next));
    else if (entry.isFile()) files.push(next);
    else throw new Error(`FFDec export contains a non-file entry: ${next}`);
  }
  return files;
}

async function freshFfdecScriptExport(command, sourcePath) {
  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb005-source-preaudit-"));
  try {
    const target = path.join(scratchRoot, "export");
    await execFile(command, [
      "-onerror", "abort",
      "-timeout", "30",
      "-exportTimeout", "120",
      "-exportFileTimeout", "30",
      "-export", "script",
      target,
      resolveProjectPath(sourcePath),
    ], {timeout: 180_000, maxBuffer: 8 * 1024 * 1024});
    const scriptsRoot = path.join(target, "scripts");
    const files = (await walkFiles(scriptsRoot)).filter((entry) => entry.toLowerCase().endsWith(".as"));
    return Promise.all(files.map(async (entry) => {
      const text = (await readFile(path.join(scriptsRoot, entry), "utf8")).replace(/\r\n?/g, "\n");
      return {path: portable(entry), text};
    }));
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }
}

function parseAttributes(source) {
  return Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function uniqueMatch(source, expression, label) {
  const matches = [...source.matchAll(expression)];
  invariant(matches.length === 1, `${label}: expected exactly one match, observed ${matches.length}`);
  return matches[0];
}

function placementFacts(xml, characterId) {
  const match = uniqueMatch(
    xml,
    new RegExp(`<PlaceObject2\\b([^>]*\\bobjectID="${characterId}"[^>]*)>([\\s\\S]*?)<\\/PlaceObject2>`, "g"),
    `root placement objectID=${characterId}`,
  );
  const attributes = parseAttributes(match[1]);
  const transform = uniqueMatch(match[2], /<Transform\b([^>]*)\/>/g, `placement ${characterId} transform`);
  const transformAttributes = parseAttributes(transform[1]);
  const transX = Number(transformAttributes.transX || 0);
  const transY = Number(transformAttributes.transY || 0);
  return {
    tag: "PlaceObject2",
    characterId,
    depth: Number(attributes.depth),
    name: attributes.name || null,
    morph: attributes.morph === undefined ? null : Number(attributes.morph),
    translationTwips: {x: transX, y: transY},
    translationPixels: {x: transX / 20, y: transY / 20},
  };
}

export function extractSwfmillStaticFacts(xml) {
  const header = uniqueMatch(xml, /<Header\b([^>]*)>/g, "SWF Header");
  const headerAttributes = parseAttributes(header[1]);
  const rectangle = uniqueMatch(
    xml,
    /<Header\b[^>]*>\s*<size>\s*<Rectangle\b([^>]*)\/>\s*<\/size>/g,
    "root stage Rectangle",
  );
  const rectangleAttributes = parseAttributes(rectangle[1]);
  const background = uniqueMatch(
    xml,
    /<SetBackgroundColor>[\s\S]*?<Color\b([^>]*)\/>[\s\S]*?<\/SetBackgroundColor>/g,
    "root background color",
  );
  const backgroundAttributes = parseAttributes(background[1]);
  const red = Number(backgroundAttributes.red);
  const green = Number(backgroundAttributes.green);
  const blue = Number(backgroundAttributes.blue);
  const frameLabel = uniqueMatch(xml, /<FrameLabel\b([^>]*)>/g, "root frame label");
  const labelAttributes = parseAttributes(frameLabel[1]);
  const sprite5 = uniqueMatch(xml, /<DefineSprite\b([^>]*\bobjectID="5"[^>]*)>/g, "sprite-5 definition");
  const sprite53 = uniqueMatch(xml, /<DefineSprite\b([^>]*\bobjectID="53"[^>]*)>/g, "sprite-53 definition");
  const maskPlacements = [...xml.matchAll(/<PlaceObject(?:2|3)\b([^>]*\bclipDepth="[^"]+"[^>]*)>/g)].map((match) => {
    const attributes = parseAttributes(match[1]);
    return {
      characterId: Number(attributes.objectID),
      depth: Number(attributes.depth),
      clipDepth: Number(attributes.clipDepth),
    };
  });
  return {
    xml: {
      bytes: Buffer.byteLength(xml),
      sha256: sha256(xml),
    },
    stage: {
      xMinTwips: Number(rectangleAttributes.left),
      xMaxTwips: Number(rectangleAttributes.right),
      yMinTwips: Number(rectangleAttributes.top),
      yMaxTwips: Number(rectangleAttributes.bottom),
      width: (Number(rectangleAttributes.right) - Number(rectangleAttributes.left)) / 20,
      height: (Number(rectangleAttributes.bottom) - Number(rectangleAttributes.top)) / 20,
      backgroundRgb: {red, green, blue},
      backgroundHex: `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`,
    },
    fps: Number(headerAttributes.framerate),
    rootFrameCount: Number(headerAttributes.frames),
    rootLabel: {label: labelAttributes.label, frame: 6},
    rootPlacements: [
      {...placementFacts(xml, 2), firstFrame: 6},
      {...placementFacts(xml, 5), firstFrame: 6},
      {...placementFacts(xml, 53), firstFrame: 6},
    ],
    nestedDefinitions: [
      {domainId: "sprite-5", declaredFrameCount: Number(parseAttributes(sprite5[1]).frames)},
      {domainId: "sprite-53", declaredFrameCount: Number(parseAttributes(sprite53[1]).frames)},
    ],
    displayFeatures: {
      maskPlacements,
      placeObject3Count: [...xml.matchAll(/<PlaceObject3\b/g)].length,
      filterListTagCount: [...xml.matchAll(/<(?:FilterList|filters?)\b/g)].length,
      blendModeAttributeCount: [...xml.matchAll(/\bblendMode="/g)].length,
      boundary: "Mask placement is source-static evidence only; Animate library semantics and natural runtime compositing remain unresolved.",
    },
  };
}

function targetItem(items, label) {
  const matches = items.filter((item) => item.animationId === ANIMATION_ID);
  invariant(matches.length === 1, `${label}: expected exactly one ${ANIMATION_ID}, observed ${matches.length}`);
  return matches[0];
}

function targetCatalogProbe(report) {
  const matches = report.probes.filter((item) => item.source.path === SOURCE_AUDIO);
  invariant(matches.length === 1, `catalog audio probe: expected exactly one ${SOURCE_AUDIO}`);
  return matches[0];
}

function targetAudioCasReference(report) {
  return targetItem(report.itemReferences, "audio CAS item references");
}

function groupExactText(textOccurrences) {
  const groups = new Map();
  for (const occurrence of textOccurrences) {
    const key = `${occurrence.exactTextUtf8Sha256}\0${occurrence.exactText}`;
    const group = groups.get(key) || {
      exactText: occurrence.exactText,
      exactTextUtf8Sha256: occurrence.exactTextUtf8Sha256,
      occurrenceCount: 0,
      occurrences: [],
    };
    group.occurrenceCount += 1;
    group.occurrences.push({
      characterId: occurrence.characterId,
      tagName: occurrence.tagName,
      fontId: occurrence.fontId,
      source: occurrence.source,
    });
    groups.set(key, group);
  }
  return [...groups.values()].sort((left, right) => left.exactText.localeCompare(right.exactText, "en"));
}

function exactSourceScripts(scripts) {
  return scripts.map((script) => ({
    path: script.path,
    bytes: Buffer.byteLength(script.text),
    sha256: sha256(script.text),
    exactSource: script.text,
  })).sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function adapterSpec() {
  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "source-static-drawing-preaudit-only",
    source: {swf: SOURCE_SWF, swfSha256: EXPECTED.swf.sha256},
    evidence: {
      scenarioInventorySha256: "0".repeat(64),
      audioAuditSha256: "0".repeat(64),
    },
    ffdecExport: {
      tool: EXPECTED.ffdecVersion,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: EXPECTED.canvasHelper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: EXPECTED.canvasFrames.sha256,
      targetSpriteObjectId: 53,
      targetSpriteFunction: "sprite53",
      exportCanvas: {width: 697, height: 382},
      exportInternalTranslation: {x: 337.25, y: 141.25},
      expectedPlacedFunctionCount: EXPECTED.placedFunctions.count,
      expectedPlacedFunctionsSha256: EXPECTED.placedFunctions.sha256,
      embeddedImageVariableCount: EXPECTED.embeddedImages.count,
      embeddedImageVariablesSha256: EXPECTED.embeddedImages.sha256,
    },
    timeline: {
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "begin",
        placementName: "animation",
        placementTwips: {x: 8_026, y: 4_885},
        placementPixels: {x: 401.3, y: 244.25},
      },
      local: {
        timelineId: "sprite-53",
        frameCount: 180,
        playbackMode: "state-explorer",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 64.05, y: 103},
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      unresolved: [
        "natural root entry and child playhead progression are not established",
        "three glossary handlers depend on unresolved HELP Math host state and callbacks",
        "Spanish visual behavior and both audio cue/synchronization paths are unresolved",
        "authoritative baselines, RMSE, human review, owner acceptance, and strict completion are missing",
      ],
    },
    output: {
      script: "ephemeral-preaudit-only.js",
      manifest: "ephemeral-preaudit-only.json",
      globalRegistry: "HELP_MATH_VB005_PREADUIT_ONLY",
    },
  };
}

async function freshCanvasPreaudit(ffdec) {
  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb005-canvas-preaudit-"));
  try {
    const outputRoot = path.join(scratchRoot, "canvas");
    const result = await execFile(ffdec, [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", "53",
      "-format", "sprite:canvas",
      "-export", "sprite",
      outputRoot,
      resolveProjectPath(SOURCE_SWF),
    ], {timeout: 180_000, maxBuffer: 8 * 1024 * 1024});
    invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED.ffdecVersion),
      "fresh FFDec Canvas export did not identify the pinned tool version");
    const [helper, framesHtml] = await Promise.all([
      readFile(path.join(outputRoot, "DefineSprite_53", "canvas.js")),
      readFile(path.join(outputRoot, "DefineSprite_53", "frames.html")),
    ]);
    invariant(helper.length === EXPECTED.canvasHelper.bytes && sha256(helper) === EXPECTED.canvasHelper.sha256,
      "fresh FFDec Canvas helper changed");
    invariant(framesHtml.length === EXPECTED.canvasFrames.bytes && sha256(framesHtml) === EXPECTED.canvasFrames.sha256,
      "fresh FFDec sprite-53 Canvas frames changed");
    const normalized = framesHtml.toString("utf8").replace(/\r\n?/g, "\n");
    invariant(/<canvas\s+id="myCanvas"\s+width="697"\s+height="382"/.test(normalized) &&
      normalized.includes("function sprite53(ctx,ctrans,frame,ratio,time){") &&
      normalized.includes("ctx.transform(1,0,0,1,337.25,141.25);") &&
      normalized.includes("var frame_cnt = 180;"),
    "fresh FFDec sprite-53 Canvas geometry or frame count changed");
    const viewerFrames = [...normalized.matchAll(/frames\.push\((\d+)\);/g)].map((match) => Number(match[1]));
    invariant(viewerFrames.length === 180 && viewerFrames.every((frame, index) => frame === index),
      "fresh FFDec viewer no longer enumerates exactly zero-indexed frames 0..179");

    const safeBuild = buildSafeRuntime({
      helperSource: helper.toString("utf8"),
      framesHtml: framesHtml.toString("utf8"),
      spec: adapterSpec(),
    });
    invariant(safeBuild.placedFunctions.length === EXPECTED.placedFunctions.count &&
      sha256(JSON.stringify(safeBuild.placedFunctions)) === EXPECTED.placedFunctions.sha256 &&
      safeBuild.imageVariables.length === EXPECTED.embeddedImages.count &&
      sha256(JSON.stringify(safeBuild.imageVariables)) === EXPECTED.embeddedImages.sha256,
    "safe Canvas adapter allowlists changed");
    return {
      freshExport: {
        retainedAfterAudit: false,
        targetSpriteObjectId: 53,
        targetSpriteFunction: "sprite53",
        spriteFrameCount: 180,
        exportCanvas: {width: 697, height: 382},
        exportInternalTranslation: {x: 337.25, y: 141.25},
        stageRenderOffset: {x: 64.05, y: 103},
        helper: {bytes: helper.length, sha256: sha256(helper)},
        framesHtml: {bytes: framesHtml.length, sha256: sha256(framesHtml)},
      },
      safeAdapterInMemoryBuild: {
        succeeded: true,
        persistedRendererFiles: 0,
        runtime: {bytes: Buffer.byteLength(safeBuild.runtime), sha256: sha256(safeBuild.runtime)},
        metadata: {bytes: Buffer.byteLength(stableJson(safeBuild.metadata)), sha256: sha256(stableJson(safeBuild.metadata))},
        drawingFunctionAllowlist: safeBuild.placedFunctions,
        drawingFunctionAllowlistSha256: sha256(JSON.stringify(safeBuild.placedFunctions)),
        embeddedImageVariableAllowlist: safeBuild.imageVariables,
        embeddedImageVariableAllowlistSha256: sha256(JSON.stringify(safeBuild.imageVariables)),
        boundary: "In-memory technical construction only; no renderer/module/registry/route was persisted or authorized.",
      },
    };
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }
}

async function parseHotspotEvidence(python, parser, swfmillXml) {
  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb005-hotspot-preaudit-"));
  try {
    const xmlPath = path.join(scratchRoot, "source.xml");
    await writeFile(xmlPath, swfmillXml);
    const result = await execFile(python, ["-B", parser.absolutePath, "--swfmill", xmlPath], {
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    const evidence = JSON.parse(result.stdout);
    invariant(evidence.schemaVersion === 1 && evidence.parser === "python-xml.etree.ElementTree" &&
      evidence.nativeStage.width === 800 && evidence.nativeStage.height === 600 &&
      evidence.rootPlacement.objectId === 53 && evidence.rootPlacement.frame === 6 &&
      evidence.rootPlacement.depth === 4 && evidence.rootPlacement.name === "animation" &&
      evidence.sprite.objectId === 53 && evidence.sprite.frameCount === 180,
    "hotspot XML parser root/sprite facts changed");
    invariant(evidence.sharedHitShape.objectId === 10 &&
      JSON.stringify(evidence.sharedHitShape.boundsTwips) ===
        JSON.stringify({bottom: 191, left: -604, right: 603, top: -192}),
    "hotspot shared hit-shape identity changed");
    invariant(JSON.stringify(evidence.hotspots.map((entry) => ({
      characterId: entry.characterId,
      keyAttribute: entry.keyAttribute,
      depth: entry.placement.depth,
      first: entry.frameInterval.first,
      lastInclusive: entry.frameInterval.lastInclusive,
      hitShape: entry.hitState.shapeObjectId,
      visibleStates: entry.hitState.visibleStates,
    }))) === JSON.stringify([
      {characterId: 11, keyAttribute: "Negative number", depth: 5, first: 1, lastInclusive: 180, hitShape: 10, visibleStates: {down: false, over: false, up: false}},
      {characterId: 12, keyAttribute: "Less than", depth: 7, first: 1, lastInclusive: 180, hitShape: 10, visibleStates: {down: false, over: false, up: false}},
      {characterId: 13, keyAttribute: "Zero", depth: 9, first: 1, lastInclusive: 180, hitShape: 10, visibleStates: {down: false, over: false, up: false}},
    ]), "hotspot hit-state or placement interval changed");
    invariant(Object.values(evidence.evidenceBoundary).every((value) => value === false || value === true || value === "none") &&
      evidence.evidenceBoundary.sourceGeometryOnly === true &&
      evidence.evidenceBoundary.legacyActionScriptExecuted === false &&
      evidence.evidenceBoundary.pointerEventsEnabled === false,
    "hotspot parser crossed the acceptance-neutral boundary");
    return evidence;
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }
}

function deriveButtonCandidates(scripts, machineDomain, hotspotEvidence) {
  const placements = new Map(machineDomain.placementEdges
    .filter((edge) => [11, 12, 13].includes(edge.characterId))
    .map((edge) => [edge.characterId, edge]));
  const hotspotByCharacterId = new Map(hotspotEvidence.map((entry) => [entry.characterId, entry]));
  return scripts.filter((script) => /DefineButton2_/i.test(script.path)).map((script) => {
    const characterId = Number(script.path.match(/DefineButton2_(\d+)/i)?.[1]);
    const keyAttribute = script.exactSource.match(/_global\.KeyAttribute\s*=\s*"([^"]+)"/)?.[1] || null;
    invariant(characterId && keyAttribute, `${script.path}: button source did not retain its exact target/value`);
    invariant(/on\s*\(\s*release\s*\)/i.test(script.exactSource), `${script.path}: release handler changed`);
    invariant(/_root\.DoHyperLinks\s*\(\s*\)/.test(script.exactSource), `${script.path}: DoHyperLinks host call changed`);
    invariant(/_root\.animation_mc\.animation\.stop\s*\(\s*\)/.test(script.exactSource),
      `${script.path}: host animation stop changed`);
    const placement = placements.get(characterId);
    invariant(placement, `${script.path}: button is absent from sprite-53 static placement graph`);
    const hotspot = hotspotByCharacterId.get(characterId);
    invariant(hotspot?.keyAttribute === keyAttribute, `${script.path}: hotspot XML evidence differs from ActionScript`);
    return {
      candidateId: `button-${characterId}-${keyAttribute.toLowerCase()}-release`,
      characterId,
      event: "release",
      keyAttribute,
      staticFirstLocalFrame: placement.firstFrame,
      staticPlacementFrames: placement.distinctFrames,
      hostOperations: [
        `_global.KeyAttribute = "${keyAttribute}"`,
        "_root.DoHyperLinks()",
        "_root.animation_mc.animation.stop()",
      ],
      runtimeReachabilityEstablished: false,
      orderedNaturalTraceEstablished: false,
      sourceStaticGeometryResolved: true,
      hitStateAndPlacementInterval: hotspot,
      stageBoundsResolved: true,
      acceptanceEffect: "none",
    };
  }).sort((left, right) => left.characterId - right.characterId);
}

function acceptanceBoundary() {
  return {
    implementationComplete: false,
    authoritativeOriginalRuntimeBaselineComplete: false,
    naturalRuntimeReachabilityComplete: false,
    frameDomainDispositionComplete: false,
    scenarioInventoryComplete: false,
    bilingualVisualParityComplete: false,
    audioCueSyncListeningAccepted: false,
    fullFrameRmseComplete: false,
    behaviorParityComplete: false,
    productQaComplete: false,
    accessibilityQaComplete: false,
    strictHumanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
  };
}

function permissionBoundary() {
  return {
    formalImplementationAuthorized: false,
    interactiveRendererAuthorized: false,
    rendererPersistenceAuthorized: false,
    registryOrRouteChangeAuthorized: false,
    migrationWorkspaceChangeAuthorized: false,
    originalRuntimeLaunchAuthorized: false,
    adobeAnimateLaunchAuthorized: false,
    audioPlaybackAuthorized: false,
    humanOrOwnerAcceptanceRecordingAuthorized: false,
    strictStatusOrLedgerPromotionAuthorized: false,
  };
}

function currentJsAuthorization() {
  return {
    determination: "sufficient-only-for-a-fail-closed-source-static-current-js-engineering-candidate",
    sourceStaticCurrentJsEngineeringCandidateEligible: true,
    formalMigrationImplementationAuthorized: false,
    interactiveRendererAuthorized: false,
    productRegistryOrRouteAdmissionAuthorized: false,
    strictStatusOrLedgerPromotionAuthorized: false,
    permittedLaterCandidateScope: [
      "deterministic one-indexed source-static rendering of sprite-53 frames 1 through 180",
      "native 800x600 stage composition using the exact root frame-6 placement transform",
      "source-visible button artwork without dispatching any button action",
      "English source-static text only; lang=es must fail closed until Spanish visual behavior is evidenced",
    ],
    mandatoryFailClosedExclusions: [
      "do not execute _level0.InternalPreloader, _root.DoHyperLinks, _global writes, or any other legacy host side effect",
      "do not expose the three source buttons as functional controls until natural runtime traces establish dispatch, target, and state effects",
      "do not play either embedded or associated audio until language, cue, synchronization, replay, and listening evidence exists",
      "do not claim root natural playback, complete nested-domain coverage, Replay parity, bilingual parity, RMSE parity, human approval, owner approval, or migration completion",
      "do not add a registry entry, product route admission, migration workspace status promotion, or strict ledger change from this preaudit",
    ],
    rationale: [
      "The physical SWF, paired FLA, and associated MP3 identities are independently rehashed and catalog-bound.",
      "The root timeline, sprite-53 timeline, root placement, mask, assets, fonts, exact text, ActionScript, and audio bytes are deterministically source-audited.",
      "The unresolved host, language, audio, runtime-reachability, and acceptance obligations can be made non-operative in a source-static engineering candidate.",
      "Those same gaps prevent authorization of an interactive or product migration implementation.",
    ],
  };
}

async function readInputReports() {
  const entries = await Promise.all(Object.entries(INPUT_REPORTS).map(async ([id, reportPath]) => {
    const loaded = await readJsonBinding(reportPath);
    if (VALIDATORS[id]) {
      VALIDATORS[id](loaded.value);
      loaded.binding.generator = await verifyDeclaredGenerator(loaded.value, id);
      loaded.binding.validationMode = "whole-report-internal-validator-passed";
    } else {
      loaded.binding.generator = {
        declared: Boolean(loaded.value.generator?.sha256),
        verifiedNow: false,
        note: "Global generator/report freshness is intentionally not asserted; only the VB005 page projection is bound.",
      };
      loaded.binding.validationMode = "target-projection-only-global-report-regeneration-out-of-scope";
    }
    return [id, loaded];
  }));
  return Object.fromEntries(entries);
}

function sourceManifestEntries(manifestText) {
  return [EXPECTED.swf, EXPECTED.fla, EXPECTED.audio].map((expected) => {
    const expression = new RegExp(`^([a-f0-9]{64})  ${expected.archivePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "gm");
    const matches = [...manifestText.matchAll(expression)];
    invariant(matches.length === 1, `source manifest: expected one ${expected.archivePath} entry`);
    invariant(matches[0][1] === expected.sha256, `source manifest: ${expected.archivePath} SHA-256 changed`);
    return {path: expected.archivePath, sha256: matches[0][1]};
  });
}

function reportBinding(loaded, target, {targetProjectionOnly = false} = {}) {
  if (targetProjectionOnly) {
    return {
      path: loaded.binding.path,
      targetProjectionSha256: fingerprint(target),
      validationMode: loaded.binding.validationMode,
      wholeReportBytesOrSha256Bound: false,
      reason: "Parallel candidate work can legitimately refresh unrelated global prototype inventory; this source-only audit binds only the unchanged VB005 page projection.",
    };
  }
  return {
    ...loaded.binding,
    targetProjectionSha256: fingerprint(target),
  };
}

export async function buildVb005SourcePreaudit({ffdec = "ffdec", swfmill = "swfmill", python = "python3"} = {}) {
  const [sourceSwf, sourceFla, sourceAudio, reports, catalogBinding, sourceFilesBinding, manifestFile,
    generatorFile, hotspotParser, safeAdapterBuilder] =
    await Promise.all([
      verifiedSource(EXPECTED.swf, "source SWF"),
      verifiedSource(EXPECTED.fla, "paired source FLA"),
      verifiedSource(EXPECTED.audio, "associated catalog MP3"),
      readInputReports(),
      readJsonBinding("catalog/animations.json"),
      readJsonBinding("catalog/source-files.json"),
      readRegularFile("catalog/source-manifest.sha256"),
      readRegularFile(relative(scriptPath)),
      readRegularFile(HOTSPOT_PARSER),
      readRegularFile(SAFE_ADAPTER_BUILDER),
    ]);

  const animation = targetItem(catalogBinding.value.animations, "catalog animations");
  invariant(animation.assetId === EXPECTED.assetId && animation.canonicalAnimationId === ANIMATION_ID &&
    animation.isCanonical === true && animation.duplicateGroupSize === 1 && animation.duplicateOf === null,
  "catalog animation identity or alias disposition changed");
  invariant(animation.source.path === EXPECTED.swf.archivePath && animation.source.sha256 === EXPECTED.swf.sha256 &&
    animation.pairedFla.path === EXPECTED.fla.archivePath && animation.pairedFla.sha256 === EXPECTED.fla.sha256,
  "catalog animation source binding changed");
  invariant(animation.audio.exact.length === 1 && animation.audio.exact[0].path === EXPECTED.audio.archivePath &&
    animation.audio.exact[0].sha256 === EXPECTED.audio.sha256,
  "catalog animation audio association changed");
  const sourceFiles = new Map(sourceFilesBinding.value.files.map((entry) => [entry.path, entry]));
  for (const expected of [EXPECTED.swf, EXPECTED.fla, EXPECTED.audio]) {
    const entry = sourceFiles.get(expected.archivePath);
    invariant(entry?.bytes === expected.bytes && entry.sha256 === expected.sha256,
      `catalog/source-files.json: ${expected.archivePath} binding changed`);
  }

  const machine = targetItem(reports.machineAudit.value.items, "machine audit");
  const operations = targetItem(reports.sourceOperations.value.items, "source operations");
  const sourceEvents = targetItem(reports.sourceEvents.value.items, "source events");
  const assetCensus = targetItem(reports.assetCensus.value.items, "asset census");
  const embeddedArchive = targetItem(reports.embeddedAudio.value.items, "embedded audio archive");
  const catalogAudioProbe = targetCatalogProbe(reports.catalogAudioProbe.value);
  const audioCasReference = targetAudioCasReference(reports.audioCasProbe.value);
  const pairedAuthoring = targetItem(reports.pairedAuthoring.value.items, "paired authoring bindings");
  const specification = targetItem(reports.specificationReadiness.value.cards, "specification readiness");
  const ranking = targetItem(reports.implementationRanking.value.rankedItems, "implementation ranking");
  const productPage = targetItem(reports.productContract.value.pages, "product contract");

  invariant(machine.auditFingerprintSha256 === EXPECTED.machineAuditFingerprintSha256,
    "machine audit fingerprint changed");
  invariant(sourceEvents.itemFingerprintSha256 === EXPECTED.sourceEventFingerprintSha256,
    "source event fingerprint changed");
  invariant(assetCensus.definitionInventorySha256 === EXPECTED.assetDefinitionInventorySha256,
    "asset definition fingerprint changed");
  invariant(embeddedArchive.itemFingerprintSha256 === EXPECTED.embeddedAudioItemFingerprintSha256,
    "embedded audio item fingerprint changed");
  invariant(catalogAudioProbe.probeFingerprintSha256 === EXPECTED.catalogAudioProbeFingerprintSha256,
    "catalog audio probe fingerprint changed");
  invariant(ranking.itemFingerprintSha256 === EXPECTED.rankingItemFingerprintSha256 &&
    ranking.ranking.implementationSequencePosition === 4 && ranking.ranking.complexityCompetitionRank === 4,
  "rank-4 implementation ordering changed");

  const [ffdecTool, swfmillTool, pythonTool, freshScripts, swfmillResult, canvasPreaudit] = await Promise.all([
    toolEvidence(ffdec, ["-help"], /^JPEXS Free Flash Decompiler v\.?\d/, {jarSibling: true}),
    toolEvidence(swfmill, ["--version"], /^swfmill \d/),
    toolEvidence(python, ["--version"], /^Python 3\./),
    freshFfdecScriptExport(ffdec, EXPECTED.swf.path),
    execFile(swfmill, ["swf2xml", resolveProjectPath(EXPECTED.swf.path), "stdout"], {
      timeout: 60_000,
      maxBuffer: 32 * 1024 * 1024,
    }),
    freshCanvasPreaudit(ffdec),
  ]);
  const freshScriptSummary = summarizeScriptSources(freshScripts, machine.swf.actionScript);
  invariant(sameValue(freshScriptSummary, machine.scripts), "fresh FFDec script export differs from machine audit");
  invariant(sameValue(freshScriptSummary.files, operations.reexport.files),
    "fresh FFDec script export differs from source-operation manifest");
  const exactScripts = exactSourceScripts(freshScripts);

  const directSwf = parseSwfSourceFacts(sourceSwf.bytes);
  invariant(sameValue(directSwf, machine.swf), "direct SWF parse differs from machine audit");
  const swfmillStatic = extractSwfmillStaticFacts(swfmillResult.stdout);
  const swfmillXmlBytes = Buffer.from(swfmillResult.stdout);
  invariant(swfmillXmlBytes.length === EXPECTED.swfmillXml.bytes &&
    sha256(swfmillXmlBytes) === EXPECTED.swfmillXml.sha256,
  "fresh swfmill XML bytes changed");
  const hotspotEvidence = await parseHotspotEvidence(python, hotspotParser, swfmillResult.stdout);
  invariant(swfmillStatic.stage.width === directSwf.header.stage.width &&
    swfmillStatic.stage.height === directSwf.header.stage.height &&
    swfmillStatic.fps === directSwf.header.fps &&
    swfmillStatic.rootFrameCount === directSwf.header.rootFrameCount,
  "swfmill header facts differ from the direct SWF parser");
  invariant(swfmillStatic.rootLabel.label === "begin" && swfmillStatic.rootLabel.frame === 6,
    "root begin label changed");
  invariant(sameValue(swfmillStatic.displayFeatures.maskPlacements, [
    {characterId: 7, depth: 2, clipDepth: 11},
  ]),
  "source-static mask inventory changed");

  const directAssets = collectSwfAssetDefinitions(sourceSwf.bytes);
  invariant(sameValue(directAssets.tagStream, assetCensus.tagStream) &&
    sameValue(directAssets.definitions, assetCensus.definitions) &&
    sameValue(directAssets.fontFacts, assetCensus.fontFacts) &&
    directAssets.exactTextOccurrences.length === assetCensus.exactTextOccurrenceCount,
  "direct asset parse differs from the asset census");

  const directAudio = parseEmbeddedAudioPayloads(sourceSwf.bytes);
  invariant(directAudio.soundStreams.length === 1 && directAudio.defineSounds.length === 0,
    "embedded audio unit inventory changed");
  const stream = directAudio.soundStreams[0];
  invariant(stream.ownerDomainId === "sprite-53" && stream.blockCount === 174 &&
    stream.blocks[0].localFrame === 7 && stream.blocks.at(-1).localFrame === 180 &&
    stream.payload.byteLength === 72_020 && stream.totalBlockHeaderSampleCount === 319_104 &&
    stream.payload.sha256 === EXPECTED.embeddedAudioPayloadSha256,
  "embedded MP3 stream boundary changed");
  const casFile = await readRegularFile(stream.payload.plannedArchivePath);
  invariant(casFile.bytes.length === stream.payload.byteLength && sha256(casFile.bytes) === stream.payload.sha256,
    "embedded audio CAS object is missing or stale");
  invariant(audioCasReference.units.length === 1 &&
    audioCasReference.units[0].payload.sha256 === stream.payload.sha256 &&
    audioCasReference.units[0].technicalProbe.ffmpegDecodeCheckPassed === true,
  "embedded audio technical probe binding changed");

  invariant(sourceFla.bytes.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1",
    "paired FLA is no longer an OLE compound-binary authoring file");
  invariant(reports.pairedAuthoring.value.summary.authoringAuditsCompleted === 29 &&
    reports.pairedAuthoring.value.summary.animateGuiExecutionsRecordedByThesePreparedTrees >= 29 &&
    reports.pairedAuthoring.value.summary.implementationAuthorizations === 0 &&
    reports.pairedAuthoring.value.summary.strictComplete === 0 &&
    reports.pairedAuthoring.value.acceptance.authoringEvidenceReady === true &&
    reports.pairedAuthoring.value.acceptance.authoritativeRuntimeReady === false &&
    reports.pairedAuthoring.value.acceptance.implementationAuthorized === false &&
    reports.pairedAuthoring.value.acceptance.strictMigrationComplete === false,
  "paired authoring report crossed its work-only authority boundary");
  invariant(pairedAuthoring.prepared.runArtifactFileCount > 0 &&
    pairedAuthoring.observedAuthoringAudit.status === "verified-work-only-authoring-audit" &&
    pairedAuthoring.observedAuthoringAudit.originalRuntimeBaselineEstablished === false &&
    pairedAuthoring.observedAuthoringAudit.acceptanceEffect === false &&
    pairedAuthoring.boundedRerunCommand.dialogAutomationAllowed === false &&
    pairedAuthoring.boundedRerunCommand.sourceSwfExecuted === false &&
    pairedAuthoring.boundedRerunCommand.strictAcceptanceEffect === false,
  "paired authoring evidence is incomplete or exceeds work-only authority");
  invariant(specification.specificationReadiness.rendererImplementationAuthorized === false &&
    specification.acceptance.implementationAuthorized === false,
  "specification gate unexpectedly authorized formal implementation");
  invariant(Object.values(productPage.acceptance).every((value) => value === false),
    "product page acceptance was unexpectedly promoted");

  const sprite53 = directSwf.frameDomains.domains.find((domain) => domain.domainId === "sprite-53");
  invariant(sprite53?.declaredFrameCount === 180, "sprite-53 timeline changed");
  const buttonCandidates = deriveButtonCandidates(exactScripts, sprite53, hotspotEvidence.hotspots);
  const postAuditSourceBindings = await Promise.all([
    verifiedSource(EXPECTED.swf, "post-audit source SWF"),
    verifiedSource(EXPECTED.fla, "post-audit paired source FLA"),
    verifiedSource(EXPECTED.audio, "post-audit associated catalog MP3"),
  ]);
  invariant(sameValue(postAuditSourceBindings.map((entry) => entry.binding),
    [sourceSwf.binding, sourceFla.binding, sourceAudio.binding]),
  "physical source identity or metadata changed during preaudit");

  const reportTargets = {
    machineAudit: machine,
    sourceOperations: operations,
    sourceEvents,
    assetCensus,
    embeddedAudio: embeddedArchive,
    catalogAudioProbe,
    audioCasProbe: audioCasReference,
    pairedAuthoring,
    specificationReadiness: specification,
    implementationRanking: ranking,
    productContract: productPage,
  };
  const reportBindings = Object.fromEntries(Object.entries(reports).map(([id, loaded]) =>
    [id, reportBinding(loaded, reportTargets[id], {targetProjectionOnly: id === "productContract"})]));
  const manifestEntries = sourceManifestEntries(manifestFile.bytes.toString("utf8"));

  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: REPORT_TYPE,
    generator: {
      path: relative(scriptPath),
      bytes: generatorFile.bytes.length,
      sha256: sha256(generatorFile.bytes),
    },
    identity: {
      animationId: ANIMATION_ID,
      assetId: EXPECTED.assetId,
      canonicalAnimationId: ANIMATION_ID,
      canonical: true,
      duplicateGroupSize: 1,
      duplicateOf: null,
      batchId: "batch-001",
      batchOrdinal: 8,
      implementationSequencePosition: 4,
      complexityCompetitionRank: 4,
    },
    classification: {
      collection: animation.classification.collection,
      grade: animation.classification.grade,
      lesson: animation.classification.lesson,
      lessonTitleRaw: animation.classification.lessonTitleRaw,
      lessonDomain: animation.classification.lessonDomain,
      section: animation.classification.section,
      page: animation.classification.page,
      titleRaw: animation.classification.titleRaw,
      titleDisplay: animation.classification.titleDisplay,
      domain: animation.classification.domain,
      status: animation.classification.status,
    },
    authorityBoundary: {
      classification: "acceptance-neutral-read-only-static-source-preaudit",
      originalFlaOpened: false,
      adobeAnimateLaunched: false,
      originalRuntimeLaunched: false,
      legacyHostOrNetworkCallsExecuted: 0,
      audioPlayedOrListenedTo: false,
      sourceAssetsChanged: 0,
      migrationWorkspacesChanged: 0,
      renderersOrRegistriesChanged: 0,
      routesOrProductContractsChanged: 0,
      approvalsPinsLedgersOrStatusesChanged: 0,
      statement: "This report establishes deterministic static source facts only. It does not establish natural runtime behavior, fidelity, parity, review, acceptance, or completion.",
    },
    sourceBindings: {
      files: {
        swf: sourceSwf.binding,
        fla: {
          ...sourceFla.binding,
          containerSignatureHex: sourceFla.bytes.subarray(0, 8).toString("hex"),
          containerKind: "OLE compound-binary legacy FLA",
          authoringAuditPerformed: false,
        },
        associatedCatalogAudio: sourceAudio.binding,
      },
      sourceManifest: {
        path: "catalog/source-manifest.sha256",
        bytes: manifestFile.bytes.length,
        sha256: sha256(manifestFile.bytes),
        entries: manifestEntries,
      },
      catalogAnimations: {
        ...catalogBinding.binding,
        targetProjectionSha256: fingerprint(animation),
      },
      catalogSourceFiles: {
        ...sourceFilesBinding.binding,
        targetEntriesSha256: fingerprint(manifestEntries.map((entry) => sourceFiles.get(entry.path))),
      },
      reports: reportBindings,
      tools: {ffdec: ffdecTool, swfmill: swfmillTool, python: pythonTool},
      forensicHelpers: {
        hotspotParser: {
          path: HOTSPOT_PARSER,
          bytes: hotspotParser.bytes.length,
          sha256: sha256(hotspotParser.bytes),
          parser: "python-xml.etree.ElementTree",
        },
        safeAdapterBuilder: {
          path: SAFE_ADAPTER_BUILDER,
          bytes: safeAdapterBuilder.bytes.length,
          sha256: sha256(safeAdapterBuilder.bytes),
        },
      },
      freshSwfmillXml: {
        retainedAfterAudit: false,
        bytes: swfmillXmlBytes.length,
        sha256: sha256(swfmillXmlBytes),
      },
      preservationRecheck: {
        performedAfterAllFreshForensics: true,
        physicalSourcesUnchanged: true,
        files: postAuditSourceBindings.map((entry) => entry.binding),
      },
    },
    runtimeStructure: {
      header: directSwf.header,
      root: {
        frameDomain: "root",
        frameIndexing: "one-indexed",
        frameCount: 10,
        fps: 12,
        durationMs: 833.333333,
        beginLabel: swfmillStatic.rootLabel,
        background: {
          rgb: swfmillStatic.stage.backgroundRgb,
          hex: swfmillStatic.stage.backgroundHex,
        },
        placements: swfmillStatic.rootPlacements,
        boundary: "The 10-frame SWF root remains runtime.frameCount; child timelines are not relabeled as root.",
      },
      staticallyRootReachableFrameDomainCandidates: directSwf.frameDomains.domains.map((domain) => ({
        domainId: domain.domainId,
        kind: domain.kind,
        declaredFrameCount: domain.declaredFrameCount,
        observedShowFrameCount: domain.observedShowFrameCount,
        parentDomainIds: domain.parentDomainIds,
        placedSpriteIds: domain.placedSpriteIds,
        placementEdges: domain.placementEdges,
        staticDomainFingerprintSha256: domain.domainFingerprintSha256,
        runtimeDisposition: domain.domainId === "root" ? "root-requirement-unresolved" : "unresolved",
      })),
      displayFeatures: swfmillStatic.displayFeatures,
      staticStructureSha256: directSwf.structureFingerprintSha256,
      runtimeReachabilityEstablished: false,
      finalFrameDomainDispositionEstablished: false,
    },
    sourceStaticCanvasPreaudit: canvasPreaudit,
    hotspotGeometryPreaudit: hotspotEvidence,
    actionScript: {
      version: directSwf.actionScript.version,
      actionScript3Flag: directSwf.actionScript.actionScript3Flag,
      tagCounts: directSwf.actionScript.tagCounts,
      freshFfdecExport: {
        fileCount: exactScripts.length,
        normalizedBytes: freshScriptSummary.normalizedBytes,
        contentManifestSha256: freshScriptSummary.contentManifestSha256,
        normalizedBundleSha256: freshScriptSummary.normalizedBundleSha256,
        scripts: exactScripts,
      },
      exactOperationCounts: operations.counts,
      exactOperations: operations.operations,
      exactSignals: operations.signals,
      staticSourceEvents: sourceEvents.sourceEvents,
      hostDependencies: [
        {expression: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")", disposition: "unresolved-disabled-in-source-static-candidate"},
        {expression: "_global.KeyAttribute", disposition: "unresolved-write-disabled-in-source-static-candidate"},
        {expression: "_root.DoHyperLinks()", disposition: "unresolved-call-disabled-in-source-static-candidate"},
        {expression: "_root.animation_mc.animation.stop()", disposition: "unresolved-call-disabled-in-source-static-candidate"},
      ],
      staticSignals: {
        randomCalls: 0,
        externalApiCandidates: [],
        legacyNetworkEndpointCandidates: [],
        keyboardEvents: 0,
        inputFields: 0,
        scoreOrAnswerState: 0,
        replayOrReset: 0,
        pointerReleaseHandlers: 3,
      },
      runtimeBehaviorEstablished: false,
    },
    assetsAndText: {
      directParserTagStream: directAssets.tagStream,
      definitionInventorySha256: assetCensus.definitionInventorySha256,
      definitions: directAssets.definitions,
      fonts: directAssets.fontFacts,
      exactTextOccurrenceCount: directAssets.exactTextOccurrences.length,
      exactTextInventory: groupExactText(directAssets.exactTextOccurrences),
      staticDefinitionCounts: directAssets.tagStream.categoryCounts,
      unresolved: [
        "Animate library symbol names, layer names, masks, filters, blend modes, and linkage have not been authoring-audited.",
        "Embedded font names and glyph tables are exact SWF facts; final browser font substitution and pixel parity are not established.",
      ],
    },
    audio: {
      embedded: {
        ownerFrameDomain: stream.ownerDomainId,
        format: stream.head.format,
        sampleRateHz: stream.head.sampleRateHz,
        sampleSizeBits: stream.head.sampleSizeBits,
        channels: stream.head.channels,
        headLocalFrame: stream.headLocalFrame,
        firstBlockLocalFrame: stream.blocks[0].localFrame,
        lastBlockLocalFrame: stream.blocks.at(-1).localFrame,
        blockCount: stream.blockCount,
        totalBlockHeaderSampleCount: stream.totalBlockHeaderSampleCount,
        payload: {
          path: stream.payload.plannedArchivePath,
          bytes: stream.payload.byteLength,
          sha256: stream.payload.sha256,
          physicalHashVerifiedNow: true,
        },
        technicalProbe: audioCasReference.units[0].technicalProbe,
        language: "unresolved",
      },
      associatedCatalogFile: {
        path: SOURCE_AUDIO,
        bytes: EXPECTED.audio.bytes,
        sha256: EXPECTED.audio.sha256,
        catalogLanguage: catalogAudioProbe.source.catalogLanguage,
        normalizedLanguageCandidate: catalogAudioProbe.source.normalizedLanguageCandidate,
        normalizedLanguageCandidateBasis: catalogAudioProbe.evidenceLimits.normalizedLanguageCandidateBasis,
        technicalMedia: catalogAudioProbe.probe.media,
        ffmpegDecodeCheckPassed: catalogAudioProbe.probe.ffmpegDecodeToNull.decodeCheckPassed,
        spokenLanguageEstablished: false,
      },
      cueMappingEstablished: false,
      runtimeSynchronizationEstablished: false,
      replayResetBehaviorEstablished: false,
      namedHumanListeningAccepted: false,
      bilingualAudioAccepted: false,
    },
    bilingualEvidence: {
      lessonEnglish: productPage.labels.lessonEnglish,
      lessonSpanish: productPage.labels.lessonSpanish,
      sectionEnglish: productPage.labels.sectionEnglish,
      sectionSpanish: productPage.labels.sectionSpanish,
      pageEnglish: productPage.labels.pageEnglish,
      pageSpanish: productPage.labels.pageSpanish,
      shippedSwfExactTextLanguage: "English source-static text only",
      associatedAudioLanguage: "Spanish path/catalog convention candidate only; spoken language not established",
      hostEntryLanguageBehaviorEstablished: false,
      spanishVisualBehaviorEstablished: false,
      bilingualParityEstablished: false,
    },
    staticScenarioCandidates: {
      classification: "source-static-candidates-only-not-authoritative-runtime-scenarios",
      rootNaturalEntry: {
        candidateId: "root-natural-entry-and-playback",
        sourceFacts: [
          "root frame 1 calls _level0.InternalPreloader.gotoAndPlay(\"jump_check\") then stop()",
          "root frame 6 is labeled begin, places sprite-53 as animation, and calls stop()",
        ],
        runtimeReachabilityEstablished: false,
        naturalTraceEstablished: false,
      },
      buttons: buttonCandidates,
      requiredButUnresolvedFamilies: [
        "authoritative English host-entry and playback",
        "authoritative Spanish host-entry and playback",
        "each reachable Negative number/Less than/Zero glossary release path",
        "embedded and associated audio cue/synchronization paths",
        "terminal state and complete Replay/reset",
      ],
      authoritativeScenarioIds: [],
      fullReachabilityEstablished: false,
    },
    evidenceGaps: [
      {id: "fla-authoring-audit", status: "missing", reason: "Adobe Animate was explicitly not operated; timeline/library/layer/linkage/font authoring evidence remains unavailable."},
      {id: "authoritative-original-runtime", status: "missing", reason: "No authorized original-runtime session or natural event trace was executed."},
      {id: "frame-domain-disposition", status: "unresolved", reason: "root, sprite-5, and sprite-53 are static graph candidates; composited/independent/nonvisual dispositions require authoring and runtime evidence."},
      {id: "reachable-scenario-inventory", status: "unresolved", reason: "Static handlers and operations do not prove dispatch, order, branch reachability, host state, terminal state, or Replay."},
      {id: "bilingual-visual-runtime", status: "unresolved", reason: "Course XML supplies bilingual labels, but Spanish page rendering and host language entry are not source-runtime proven."},
      {id: "audio-language-cue-sync-listening", status: "unresolved", reason: "Both audio byte streams decode technically; language, cue frames, synchronization, reset, and named-human listening remain unaccepted."},
      {id: "baseline-and-full-frame-rmse", status: "missing", reason: "No authoritative native-stage PNG baseline, per-frame comparison, diff, or RMSE evidence exists for this animation."},
      {id: "human-and-owner-acceptance", status: "missing", reason: "No strict human visual review or owner acceptance exists for L3VB05."},
      {id: "lesson-product-contract-global-refresh", status: "out-of-scope-stale", reason: "The bound VB005 page projection is validated, but the lesson product contract's global prototype inventory has drifted during parallel candidate work and was not regenerated by this source-only task."},
    ],
    currentJsEngineeringCandidate: currentJsAuthorization(),
    permissions: permissionBoundary(),
    acceptance: acceptanceBoundary(),
  };
  report.reportFingerprintSha256 = fingerprint(report);
  validateVb005SourcePreaudit(report);
  return report;
}

export function validateVb005SourcePreaudit(report) {
  invariant(report.schemaVersion === SCHEMA_VERSION && report.reportType === REPORT_TYPE,
    "source preaudit schema/type mismatch");
  invariant(report.identity.animationId === ANIMATION_ID && report.identity.assetId === EXPECTED.assetId,
    "source preaudit identity mismatch");
  invariant(report.identity.batchOrdinal === 8 && report.identity.implementationSequencePosition === 4 &&
    report.identity.complexityCompetitionRank === 4,
  "source preaudit no longer describes exact batch/rank position 8/4/4");
  invariant(report.sourceBindings.files.swf.sha256 === EXPECTED.swf.sha256 &&
    report.sourceBindings.files.fla.sha256 === EXPECTED.fla.sha256 &&
    report.sourceBindings.files.associatedCatalogAudio.sha256 === EXPECTED.audio.sha256,
  "source preaudit physical bindings changed");
  invariant(report.runtimeStructure.header.stage.width === 800 && report.runtimeStructure.header.stage.height === 600 &&
    report.runtimeStructure.root.fps === 12 && report.runtimeStructure.root.frameCount === 10,
  "source preaudit root timeline changed");
  const domains = new Map(report.runtimeStructure.staticallyRootReachableFrameDomainCandidates
    .map((entry) => [entry.domainId, entry]));
  invariant(domains.size === 3 && domains.get("root")?.declaredFrameCount === 10 &&
    domains.get("sprite-5")?.declaredFrameCount === 1 && domains.get("sprite-53")?.declaredFrameCount === 180,
  "source preaudit frame-domain inventory changed");
  invariant(sameValue(report.runtimeStructure.displayFeatures.maskPlacements,
    [{characterId: 7, depth: 2, clipDepth: 11}]) &&
    report.runtimeStructure.finalFrameDomainDispositionEstablished === false &&
    report.runtimeStructure.runtimeReachabilityEstablished === false,
  "source preaudit display/runtime boundary changed");
  invariant(report.actionScript.freshFfdecExport.fileCount === 5 &&
    report.actionScript.exactOperationCounts.operations === 9 &&
    report.actionScript.exactOperationCounts.exactTimelineOperationCount === 6 &&
    report.actionScript.exactOperationCounts.exactEventHandlerOperationCount === 3 &&
    report.actionScript.staticSignals.pointerReleaseHandlers === 3 &&
    report.actionScript.staticSignals.randomCalls === 0 &&
    report.actionScript.runtimeBehaviorEstablished === false,
  "source preaudit ActionScript inventory changed");
  invariant(report.assetsAndText.staticDefinitionCounts.shape === 10 &&
    report.assetsAndText.staticDefinitionCounts.morph === 1 &&
    report.assetsAndText.staticDefinitionCounts.font === 4 &&
    report.assetsAndText.staticDefinitionCounts.text === 33 &&
    report.assetsAndText.staticDefinitionCounts.button === 3 &&
    report.assetsAndText.staticDefinitionCounts.sprite === 2 &&
    report.assetsAndText.directParserTagStream.definitionCount === 53 &&
    report.assetsAndText.exactTextOccurrenceCount === 36,
  "source preaudit asset/text inventory changed");
  invariant(report.audio.embedded.blockCount === 174 &&
    report.audio.embedded.firstBlockLocalFrame === 7 &&
    report.audio.embedded.lastBlockLocalFrame === 180 &&
    report.audio.embedded.payload.bytes === 72_020 &&
    report.audio.embedded.payload.sha256 === EXPECTED.embeddedAudioPayloadSha256 &&
    report.audio.associatedCatalogFile.ffmpegDecodeCheckPassed === true &&
    report.audio.cueMappingEstablished === false && report.audio.namedHumanListeningAccepted === false,
  "source preaudit audio boundary changed");
  invariant(report.staticScenarioCandidates.buttons.length === 3 &&
    sameValue(report.staticScenarioCandidates.buttons.map((button) => ({
      characterId: button.characterId,
      keyAttribute: button.keyAttribute,
      interval: button.hitStateAndPlacementInterval.frameInterval,
      hitShapeObjectId: button.hitStateAndPlacementInterval.hitState.shapeObjectId,
    })), [
      {characterId: 11, keyAttribute: "Negative number", interval: {first: 1, lastInclusive: 180}, hitShapeObjectId: 10},
      {characterId: 12, keyAttribute: "Less than", interval: {first: 1, lastInclusive: 180}, hitShapeObjectId: 10},
      {characterId: 13, keyAttribute: "Zero", interval: {first: 1, lastInclusive: 180}, hitShapeObjectId: 10},
    ]) &&
    report.staticScenarioCandidates.authoritativeScenarioIds.length === 0 &&
    report.staticScenarioCandidates.fullReachabilityEstablished === false,
  "source preaudit scenario boundary changed");
  const authorization = report.currentJsEngineeringCandidate;
  invariant(authorization.determination ===
    "sufficient-only-for-a-fail-closed-source-static-current-js-engineering-candidate" &&
    authorization.sourceStaticCurrentJsEngineeringCandidateEligible === true &&
    authorization.formalMigrationImplementationAuthorized === false &&
    authorization.interactiveRendererAuthorized === false &&
    authorization.productRegistryOrRouteAdmissionAuthorized === false &&
    authorization.strictStatusOrLedgerPromotionAuthorized === false &&
    authorization.mandatoryFailClosedExclusions.length === 5,
  "source preaudit current-JS authorization boundary widened or changed");
  invariant(report.sourceStaticCanvasPreaudit.freshExport.spriteFrameCount === 180 &&
    report.sourceStaticCanvasPreaudit.freshExport.helper.sha256 === EXPECTED.canvasHelper.sha256 &&
    report.sourceStaticCanvasPreaudit.freshExport.framesHtml.sha256 === EXPECTED.canvasFrames.sha256 &&
    sameValue(report.sourceStaticCanvasPreaudit.freshExport.exportInternalTranslation, {x: 337.25, y: 141.25}) &&
    sameValue(report.sourceStaticCanvasPreaudit.freshExport.stageRenderOffset, {x: 64.05, y: 103}) &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.succeeded === true &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.persistedRendererFiles === 0 &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlist.length === 44 &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlistSha256 === EXPECTED.placedFunctions.sha256 &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.embeddedImageVariableAllowlist.length === 0 &&
    report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.embeddedImageVariableAllowlistSha256 === EXPECTED.embeddedImages.sha256,
  "source-static Canvas preaudit facts changed");
  invariant(report.hotspotGeometryPreaudit.hotspots.length === 3 &&
    report.hotspotGeometryPreaudit.evidenceBoundary.pointerEventsEnabled === false &&
    report.sourceBindings.freshSwfmillXml.sha256 === EXPECTED.swfmillXml.sha256 &&
    report.sourceBindings.preservationRecheck.performedAfterAllFreshForensics === true &&
    report.sourceBindings.preservationRecheck.physicalSourcesUnchanged === true,
  "fresh XML/hotspot/source preservation evidence changed");
  invariant(Object.values(report.permissions).every((value) => value === false),
    "source preaudit must not grant any permission");
  invariant(Object.values(report.acceptance).every((value) => value === false),
    "source preaudit must not promote acceptance");
  invariant(report.authorityBoundary.originalFlaOpened === false &&
    report.authorityBoundary.adobeAnimateLaunched === false &&
    report.authorityBoundary.originalRuntimeLaunched === false &&
    report.authorityBoundary.legacyHostOrNetworkCallsExecuted === 0 &&
    report.authorityBoundary.sourceAssetsChanged === 0 &&
    report.authorityBoundary.renderersOrRegistriesChanged === 0 &&
    report.authorityBoundary.approvalsPinsLedgersOrStatusesChanged === 0,
  "source preaudit crossed its read-only/acceptance-neutral boundary");
  const withoutFingerprint = {...report};
  delete withoutFingerprint.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(withoutFingerprint),
    "source preaudit report fingerprint is stale");
  return report;
}

export function renderVb005SourcePreauditMarkdown(report) {
  const domains = report.runtimeStructure.staticallyRootReachableFrameDomainCandidates
    .map((domain) => `| \`${domain.domainId}\` | ${domain.kind} | ${domain.declaredFrameCount} | ${domain.parentDomainIds.join(", ") || "—"} | ${domain.runtimeDisposition} |`)
    .join("\n");
  const buttons = report.staticScenarioCandidates.buttons
    .map((button) => `| ${button.characterId} | ${button.keyAttribute} | ${button.hitStateAndPlacementInterval.frameInterval.first}–${button.hitStateAndPlacementInterval.frameInterval.lastInclusive} | ${button.hitStateAndPlacementInterval.hitState.shapeObjectId} (hit-only) | ${button.event} | no |`)
    .join("\n");
  const gaps = report.evidenceGaps.map((gap) => `- \`${gap.id}\`: ${gap.reason}`).join("\n");
  return `# G4 L3 VB005 read-only source preaudit\n\n` +
    `This is an acceptance-neutral, read-only static source audit for \`${ANIMATION_ID}\`. It did not open Adobe Animate, launch an original Flash runtime, play audio, implement a renderer, change a registry/route/migration/ledger, or create an acceptance result.\n\n` +
    `## Determination\n\n` +
    `The evidence is sufficient only to authorize a later **fail-closed source-static current-JavaScript engineering candidate**. It does **not** authorize an interactive renderer, formal migration implementation, product admission, fidelity/parity claim, or strict completion.\n\n` +
    `Permitted later candidate scope:\n\n${report.currentJsEngineeringCandidate.permittedLaterCandidateScope.map((item) => `- ${item}`).join("\n")}\n\n` +
    `Mandatory exclusions:\n\n${report.currentJsEngineeringCandidate.mandatoryFailClosedExclusions.map((item) => `- ${item}`).join("\n")}\n\n` +
    `## Exact source identity\n\n` +
    `- SWF: \`${report.sourceBindings.files.swf.path}\` — ${report.sourceBindings.files.swf.bytes} bytes — \`${report.sourceBindings.files.swf.sha256}\`\n` +
    `- FLA: \`${report.sourceBindings.files.fla.path}\` — ${report.sourceBindings.files.fla.bytes} bytes — \`${report.sourceBindings.files.fla.sha256}\`\n` +
    `- Catalog MP3: \`${report.sourceBindings.files.associatedCatalogAudio.path}\` — ${report.sourceBindings.files.associatedCatalogAudio.bytes} bytes — \`${report.sourceBindings.files.associatedCatalogAudio.sha256}\`\n` +
    `- Canonical asset: \`${report.identity.assetId}\`; duplicate group size 1; implementation rank 4.\n\n` +
    `## Timeline and display list\n\n` +
    `Native stage: 800×600, background \`${report.runtimeStructure.root.background.hex}\`, 12 FPS. The SWF root has 10 one-indexed frames; it is not replaced by the 180-frame child timeline.\n\n` +
    `| Domain | Kind | Declared frames | Static parents | Final disposition |\n|---|---|---:|---|---|\n${domains}\n\n` +
    `At root frame 6, \`sprite-53\` is placed as \`animation\` at (${report.runtimeStructure.root.placements[2].translationTwips.x}, ${report.runtimeStructure.root.placements[2].translationTwips.y}) twips. Its single source-static mask placement is character 7 at depth 2 with clipDepth 11. Runtime compositing/reachability is still unresolved.\n\n` +
    `Fresh FFDec Canvas evidence binds a 697×382 export, internal translation (337.25, 141.25), stage offset (64.05, 103), 180 one-indexed local frames, ${report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlist.length} allowlisted drawing functions, and ${report.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.embeddedImageVariableAllowlist.length} embedded image variables. The safe adapter was built only in memory; zero renderer files were persisted.\n\n` +
    `## ActionScript and interaction candidates\n\n` +
    `Fresh FFDec export found 5 AS1/2 files (${report.actionScript.freshFfdecExport.normalizedBytes} normalized bytes), 9 exact indexed operations, three release handlers, no static random/input/score/replay signal, and no static external endpoint API candidate. Legacy host calls remain disabled.\n\n` +
    `| Button | KeyAttribute | Static frame interval | Shared hit shape | Event | Runtime reachable |\n|---:|---|---|---|---|---|\n${buttons}\n\n` +
    `## Assets, fonts, text, and audio\n\n` +
    `- Definitions: 10 shapes, 1 morph, 4 fonts, 33 text definitions, 3 buttons, 2 sprites (53 total definitions); 36 exact decoded text occurrences.\n` +
    `- Embedded fonts: ${report.assetsAndText.fonts.map((font) => `\`${font.exactName}\``).join(", ")}.\n` +
    `- Embedded stream: sprite-53 local frames ${report.audio.embedded.firstBlockLocalFrame}–${report.audio.embedded.lastBlockLocalFrame}, ${report.audio.embedded.blockCount} MP3 blocks, ${report.audio.embedded.technicalProbe.durationSeconds}s technical duration, payload \`${report.audio.embedded.payload.sha256}\`.\n` +
    `- Associated catalog MP3: ${report.audio.associatedCatalogFile.technicalMedia.timing.durationSeconds}s, technically decodable; Spanish is only a path/catalog convention candidate, not a listening result.\n` +
    `- Course XML labels: English \`${report.bilingualEvidence.pageEnglish.valueRaw}\`; Spanish anchor \`${report.bilingualEvidence.pageSpanish.valueRaw}\`. Spanish runtime visuals remain unresolved.\n\n` +
    `## Evidence still missing\n\n${gaps}\n\n` +
    `All permissions remain false. All acceptance fields remain false. Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--ffdec", "--swfmill", "--python", "--json-output", "--markdown-output"].includes(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      if (argument === "--ffdec") options.ffdec = value;
      else if (argument === "--swfmill") options.swfmill = value;
      else if (argument === "--python") options.python = value;
      else if (argument === "--json-output") options.jsonOutput = path.resolve(value);
      else options.markdownOutput = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function assertSafeSourcePreauditOutput(filePath, {root = projectRoot, extension} = {}) {
  const output = await assertSafeReportOutput(filePath, {root, extension});
  const metadata = await lstat(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || (metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1),
    "source preaudit output must be a regular, non-symlink, single-link file");
  return output;
}

async function writeOrCheck(filePath, expected, {check = false, extension} = {}) {
  const output = await assertSafeSourcePreauditOutput(filePath, {extension});
  if (check) {
    const actual = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(actual === expected, `${relative(output)} is missing or stale`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await assertSafeSourcePreauditOutput(output, {extension});
  await writeFile(output, expected);
  await assertSafeSourcePreauditOutput(output, {extension});
}

function usage() {
  return `Usage: node scripts/build-g4-l3-vb005-source-preaudit.mjs [options]\n\n` +
    `  --check                    Verify checked-in JSON/Markdown byte-for-byte\n` +
    `  --ffdec <command>          FFDec launcher (default: ffdec)\n` +
    `  --swfmill <command>        swfmill launcher (default: swfmill)\n` +
    `  --python <command>          Python 3 launcher for xml.etree parser (default: python3)\n` +
    `  --json-output <path>       JSON output inside reports/\n` +
    `  --markdown-output <path>   Markdown output inside reports/\n`;
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const report = await buildVb005SourcePreaudit(options);
  const json = stableJson(report);
  const markdown = renderVb005SourcePreauditMarkdown(report);
  await Promise.all([
    writeOrCheck(options.jsonOutput, json, {check: options.check, extension: ".json"}),
    writeOrCheck(options.markdownOutput, markdown, {check: options.check, extension: ".md"}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${ANIMATION_ID} read-only source preaudit; ` +
    `source-static current-JS candidate eligible; formal implementation/acceptance false\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
