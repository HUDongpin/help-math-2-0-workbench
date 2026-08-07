#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {parseEmbeddedAudioPayloads} from "./build-g4-l3-embedded-audio-archive.mjs";
import {
  assertSafeReportOutput,
  parseSwfSourceFacts,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";
import {parseActionScriptSource} from "./build-g4-l3-source-operation-index-v2.mjs";
import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g04-l03-vb-006";
const ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const SOURCE_SWF = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/VB/L3VB06.swf`;
const SOURCE_FLA = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/VB/L3VB06.fla`;
const SOURCE_SPANISH_AUDIO = `${ARCHIVE_PREFIX}/HELP_COURSES/ELMGR4/L3/SA/L3VB06.mp3`;
const PREPARED_BINDING =
  "work/animate/dependency-authoring-audits/course-g04-l03-vb-006/source-binding.json";
const PREPARED_FLA =
  "work/animate/dependency-authoring-audits/course-g04-l03-vb-006/working-copy/L3VB06.fla";
const PREPARED_SWF =
  "work/animate/dependency-authoring-audits/course-g04-l03-vb-006/runtime-source/L3VB06.swf";
const EMBEDDED_ARCHIVE =
  "artifacts/g4-l3-embedded-audio/sha256/2a/2af05bf5b607a7370fba0b722713349d4da6bf93efafb3be6eff68601964895f.mp3";
const PLACEMENT_PARSER = "scripts/parse-swfmill-g4-l3-static-candidate.py";
const SAFE_ADAPTER_BUILDER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const DEFAULT_JSON = "reports/g4-l3-vb006-source-preflight.json";
const DEFAULT_MARKDOWN = "reports/g4-l3-vb006-source-preflight.md";
const REPORT_TYPE = "g4-l3-vb006-acceptance-neutral-source-preflight";

const INPUT_REPORTS = Object.freeze({
  animations: "catalog/animations.json",
  batches: "catalog/batches.json",
  sourceFiles: "catalog/source-files.json",
  assetDefinitionCensus: "reports/g4-l3-swf-asset-definition-census.json",
  specificationReadiness: "reports/g4-l3-batch-001-specification-readiness.json",
  implementationRanking: "reports/g4-l3-batch-001-implementation-ranking.json",
});

const EXPECTED = Object.freeze({
  sourceSwf: Object.freeze({
    bytes: 62_750,
    sha256: "e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168",
  }),
  sourceFla: Object.freeze({
    bytes: 361_984,
    sha256: "44ce279b65a6ffb552dc8f0b4f10f9bdc05b5bfe874bf6de574ef2cce418f058",
  }),
  sourceSpanishAudio: Object.freeze({
    bytes: 211_008,
    sha256: "5a56dbcee1dff83597b928d59e7e25223d0c10709616338a7a55152bf87a67bd",
  }),
  preparedBinding: Object.freeze({
    bytes: 1_773,
    sha256: "8d81b31242a902c868ceb06e7e2f8e4473a4fd52073739375259e91b5fba6c43",
  }),
  ffdecVersion: "JPEXS Free Flash Decompiler v.26.2.1",
  swfmillVersion: "swfmill 0.3.6",
  canvasHelper: Object.freeze({
    bytes: 52_872,
    sha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  }),
  canvasFrames: Object.freeze({
    bytes: 613_967,
    sha256: "282fe75274c786e5ec844ddb90bc60baf9263cd0122af159eeab8c04d65f22e4",
  }),
  swfmillXml: Object.freeze({
    bytes: 324_234,
    sha256: "f4c0559ebcdc56cf643f83765fe9fe5f32021d0d6f474c13f007200dfce7b0d8",
  }),
  textExport: Object.freeze({
    fileCount: 24,
    normalizedBytes: 350,
    manifestSha256: "74cd7ef7659d3057559ca82811b3e4fb78f5fba3f37dc2a0b3b8e0c0c196d86e",
  }),
  placedFunctions: Object.freeze({
    count: 35,
    sha256: "8e7587091336343f4e5cba3acefa6aaa7b474fa28c9677ebbd629b251ee0862d",
  }),
  embeddedImages: Object.freeze({
    count: 0,
    sha256: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  }),
  embeddedAudioPayload: Object.freeze({
    bytes: 65_000,
    sha256: "2af05bf5b607a7370fba0b722713349d4da6bf93efafb3be6eff68601964895f",
  }),
});

const SCRIPT_EXPECTATIONS = Object.freeze([
  Object.freeze({
    path: "scripts/DefineButton2_11/BUTTONCONDACTION on(release).as",
    sha256: "1eb13a7efc65353376397a06c32d0e103d683d65b513cffafc59d85ce6b15e93",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Zero";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_12/BUTTONCONDACTION on(release).as",
    sha256: "e826eda2b4eea9aae2e89480de9cfc91165263965431860098c6a5f98bbf9c68",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Value";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_42/BUTTONCONDACTION on(release).as",
    sha256: "6242a9486033f3dd1ac874b8c410ee9247b19dbc055b9b4a54508d90633ff0ba",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Positive number";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_43/BUTTONCONDACTION on(release).as",
    sha256: "8c1b7f15426f869eb20e9496c8fd381c5d9ad4704b0d739b831d8ca48bbb1cc9",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Negative number";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/frame_1/DoAction.as",
    sha256: "8edb4298364fccc1a492b99afd35910c38775e841df758cc2f8f09063e448862",
    exactSource: '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();\n',
  }),
  Object.freeze({
    path: "scripts/frame_6/DoAction.as",
    sha256: "c71f185593d153c467266a494ebee471c04c9b64044e6cf491e0d91d739e92fd",
    exactSource: "stop();\n",
  }),
]);

const ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorized",
  "implementationCreated",
  "migrationScaffoldCreated",
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

const BLOCKERS = Object.freeze([
  "The root stops at frame 1 after asking _level0.InternalPreloader to enter jump_check; no authoritative host/runtime trace proves the transition to labeled root frame 6.",
  "The main 163-frame sprite is only statically root-reachable. Natural root compositing, child playhead entry, terminal behavior, and every interaction trace remain unproven.",
  "Four release handlers write _global.KeyAttribute, call unresolved host function _root.DoHyperLinks(), and stop _root.animation_mc.animation; a standalone child renderer cannot infer the resulting HELP Math navigation.",
  "The SWF exposes English visual strings only. Catalog title Cero and the /SA/ MP3 association do not prove a complete Spanish visual/runtime path.",
  "The embedded MP3 stream and catalog-associated MP3 have no authoritative language, cue, synchronization, Replay, or named-human listening acceptance.",
  "The legacy binary FLA has a byte-identical read-only staging copy, but its current recursive Adobe Animate authoring audit has not run.",
  "No authoritative original-runtime baseline, full-frame RMSE, behavior QA, product QA, accessibility QA, human visual review, or owner acceptance exists for this item.",
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

function projectPath(relativePath, root = ROOT) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath), `absolute path is not allowed: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

async function readRegularFile(relativePath, root = ROOT) {
  const absolute = projectPath(relativePath, root);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  const bytes = await readFile(absolute);
  return {
    absolute,
    bytes,
    binding: {path: portable(path.relative(root, absolute)), bytes: bytes.length, sha256: sha256(bytes)},
  };
}

async function readPinned(relativePath, expected, label) {
  const result = await readRegularFile(relativePath);
  invariant(result.bytes.length === expected.bytes,
    `${label}: expected ${expected.bytes} bytes, observed ${result.bytes.length}`);
  invariant(sha256(result.bytes) === expected.sha256,
    `${label}: physical SHA-256 differs from the pinned identity`);
  return result;
}

async function readSourcePinned(relativePath, expected, label) {
  const archiveReal = await realpath(projectPath(ARCHIVE_PREFIX));
  const result = await readPinned(relativePath, expected, label);
  const resolved = await realpath(result.absolute);
  invariant(resolved.startsWith(`${archiveReal}${path.sep}`),
    `${label}: source resolves outside the frozen HELP Math archive`);
  return result;
}

async function readJsonBinding(relativePath) {
  const file = await readRegularFile(relativePath);
  return {...file, value: JSON.parse(file.bytes.toString("utf8"))};
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {
      // Continue until the exact requested executable is found.
    }
  }
  throw new Error(`executable not found: ${command}`);
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
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {cause: error});
  }
}

async function walkRegularFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  const result = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await walkRegularFiles(directory, next));
    else if (entry.isFile()) result.push(portable(next));
    else throw new Error(`forensic export contains a non-file entry: ${next}`);
  }
  return result;
}

function normalizeText(value) {
  return value.replace(/\r\n?/g, "\n");
}

function validateScripts(files) {
  invariant(files.length === SCRIPT_EXPECTATIONS.length,
    `expected ${SCRIPT_EXPECTATIONS.length} exported scripts, observed ${files.length}`);
  const actual = files.map((file) => ({...file, text: normalizeText(file.text)}))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const expected = [...SCRIPT_EXPECTATIONS]
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  invariant(JSON.stringify(actual.map(({path: filePath}) => filePath)) ===
    JSON.stringify(expected.map(({path: filePath}) => filePath)),
  "FFDec ActionScript path inventory changed");
  return actual.map((file, index) => {
    const contract = expected[index];
    invariant(file.text === contract.exactSource && sha256(file.text) === contract.sha256,
      `FFDec ActionScript body changed: ${file.path}`);
    const parsed = parseActionScriptSource({
      scriptPath: file.path.replace(/^scripts\//, ""),
      text: file.text,
      scriptSha256: contract.sha256,
      sourceEvents: [],
    });
    return {
      path: file.path,
      bytes: Buffer.byteLength(file.text),
      sha256: contract.sha256,
      exactSource: file.text,
      operations: parsed.operations.map(({operationId: _operationId, sourceEventIds: _sourceEventIds, ...entry}) => entry),
      signals: parsed.signals.map(({signalId: _signalId, sourceEventIds: _sourceEventIds, ...entry}) => entry),
    };
  });
}

function validateTextExport(files) {
  invariant(files.length === EXPECTED.textExport.fileCount,
    `expected ${EXPECTED.textExport.fileCount} text exports, observed ${files.length}`);
  const rows = files.map((file) => {
    const match = file.path.match(/^(\d+)\.txt$/);
    invariant(match, `unexpected FFDec text path: ${file.path}`);
    const text = normalizeText(file.text);
    return {
      objectId: Number(match[1]),
      path: file.path,
      bytes: Buffer.byteLength(text),
      sha256: sha256(text),
      text,
    };
  }).sort((left, right) => left.objectId - right.objectId);
  invariant(rows.reduce((sum, row) => sum + row.bytes, 0) === EXPECTED.textExport.normalizedBytes,
    "FFDec normalized text byte count changed");
  invariant(fingerprint(rows) === EXPECTED.textExport.manifestSha256,
    "FFDec text manifest changed");
  return rows;
}

function acceptanceBoundary() {
  return Object.fromEntries(ACCEPTANCE_KEYS.map((key) => [key, false]));
}

function validateSourceStructure(facts) {
  invariant(facts.header.signature === "CWS" && facts.header.version === 6,
    "SWF signature/version changed");
  invariant(facts.header.stage.width === 800 && facts.header.stage.height === 600 &&
    facts.header.fps === 12 && facts.header.rootFrameCount === 10,
  "SWF stage/root timeline changed");
  invariant(facts.actionScript.version === "AS1/2" &&
    facts.actionScript.tagCounts.DoAction === 2 && facts.actionScript.actionScript3Flag === false,
  "SWF ActionScript generation changed");
  const domains = new Map(facts.frameDomains.domains.map((domain) => [domain.domainId, domain]));
  invariant(domains.size === 3, "SWF frame-domain count changed");
  const root = domains.get("root");
  const pageTitle = domains.get("sprite-5");
  const main = domains.get("sprite-44");
  invariant(root?.declaredFrameCount === 10 &&
    JSON.stringify(root.placedSpriteIds) === JSON.stringify([5, 44]),
  "SWF root placement graph changed");
  invariant(pageTitle?.declaredFrameCount === 1 && main?.declaredFrameCount === 163,
    "SWF nested frame counts changed");
  invariant(main.tagCounts.SoundStreamHead === 1 && main.tagCounts.SoundStreamBlock === 157,
    "SWF main sprite stream-audio timeline changed");
  return {root, pageTitle, main};
}

function validateEmbeddedAudio(audio) {
  invariant(audio.tagCounts.DefineSound === 0 && audio.tagCounts.SoundStreamHead === 1 &&
    audio.tagCounts.SoundStreamBlock === 157,
  "embedded-audio tag inventory changed");
  invariant(audio.defineSounds.length === 0 && audio.soundStreams.length === 1,
    "embedded-audio stream count changed");
  const stream = audio.soundStreams[0];
  invariant(stream.ownerDomainId === "sprite-44" && stream.blockCount === 157 &&
    stream.blocks[0]?.localFrame === 7 && stream.blocks.at(-1)?.localFrame === 163,
  "embedded-audio frame range changed");
  invariant(stream.head.format === "mp3" && stream.head.sampleRateHz === 22_050 &&
    stream.head.channels === 1 && stream.payload.byteLength === EXPECTED.embeddedAudioPayload.bytes &&
    stream.payload.sha256 === EXPECTED.embeddedAudioPayload.sha256,
  "embedded-audio format/payload changed");
  return stream;
}

function validatePlacement(placement, {objectId, frameCount, name, depth, x, y}) {
  invariant(placement.stage.width === 800 && placement.stage.height === 600 &&
    placement.stage.backgroundHex === "#b8d8f7" && placement.fps === 12 &&
    placement.rootFrameCount === 10,
  "swfmill stage/root placement contract changed");
  invariant(placement.rootBeginLabel.label === "begin" && placement.rootBeginLabel.frame === 6,
    "swfmill root begin label changed");
  invariant(placement.targetSprite.objectId === objectId &&
    placement.targetSprite.frameCount === frameCount,
  `swfmill sprite-${objectId} identity changed`);
  invariant(placement.rootPlacement.frame === 6 && placement.rootPlacement.depth === depth &&
    placement.rootPlacement.name === name && placement.rootPlacement.translationTwips.x === x &&
    placement.rootPlacement.translationTwips.y === y,
  `swfmill sprite-${objectId} root placement changed`);
  invariant(Object.values(placement.authorityBoundary)
    .every((value) => value === false || value === "none"),
  "swfmill placement parser promoted an authority field");
  return placement;
}

function validateCanvasExport(helper, framesHtml) {
  invariant(helper.length === EXPECTED.canvasHelper.bytes &&
    sha256(helper) === EXPECTED.canvasHelper.sha256,
  "fresh FFDec Canvas helper changed");
  invariant(framesHtml.length === EXPECTED.canvasFrames.bytes &&
    sha256(framesHtml) === EXPECTED.canvasFrames.sha256,
  "fresh FFDec sprite-44 Canvas frames changed");
  const normalized = normalizeText(framesHtml.toString("utf8"));
  invariant(/<canvas\s+id="myCanvas"\s+width="697"\s+height="382"/.test(normalized),
    "FFDec sprite-44 export canvas dimensions changed");
  invariant(normalized.includes("function sprite44(ctx,ctrans,frame,ratio,time){") &&
    normalized.includes("ctx.transform(1,0,0,1,337.25,141.25);") &&
    normalized.includes("var frame_cnt = 163;"),
  "FFDec sprite-44 function header changed");
  const viewerFrames = [...normalized.matchAll(/frames\.push\((\d+)\);/g)]
    .map((match) => Number(match[1]));
  invariant(viewerFrames.length === 163 && viewerFrames.every((frame, index) => frame === index),
    "FFDec sprite-44 viewer no longer enumerates exactly zero-indexed frames 0..162");
  return normalized;
}

function adapterSpec() {
  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "source-static-drawing-preflight-only",
    source: {swf: SOURCE_SWF, swfSha256: EXPECTED.sourceSwf.sha256},
    evidence: {scenarioInventorySha256: "0".repeat(64), audioAuditSha256: "0".repeat(64)},
    ffdecExport: {
      tool: EXPECTED.ffdecVersion,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: EXPECTED.canvasHelper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: EXPECTED.canvasFrames.sha256,
      targetSpriteObjectId: 44,
      targetSpriteFunction: "sprite44",
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
        timelineId: "sprite-44",
        frameCount: 163,
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
      unresolved: [...BLOCKERS],
    },
    output: {
      script: "ephemeral-preflight-only.js",
      manifest: "ephemeral-preflight-only.json",
      globalRegistry: "HELP_MATH_VB006_PREFLIGHT_ONLY",
    },
  };
}

function audioProbeProjection(parsed) {
  const stream = parsed.streams?.[0];
  const format = parsed.format;
  invariant(stream?.codec_name === "mp3" && Number(stream.sample_rate) > 0 &&
    Number(stream.channels) === 1 && Number(format?.duration) > 0,
  "ffprobe did not return the expected mono MP3 stream");
  return {
    codec: stream.codec_name,
    sampleRateHz: Number(stream.sample_rate),
    channels: Number(stream.channels),
    streamDurationSeconds: Number(stream.duration),
    containerDurationSeconds: Number(format.duration),
    bitRateBps: Number(stream.bit_rate || format.bit_rate),
    bytes: Number(format.size),
  };
}

async function inspectTool(command, expectedVersion, versionArgs) {
  const executable = await resolveExecutable(command);
  const [result, executableBytes] = await Promise.all([
    run(command, versionArgs, {timeout: 30_000, maxBuffer: 4 * 1024 * 1024}),
    readFile(executable),
  ]);
  const output = `${result.stdout}\n${result.stderr}`.replace(/\u001b\[[0-9;]*m/g, "").trim();
  invariant(output.includes(expectedVersion), `${command} version changed: ${output || "<empty>"}`);
  return {command, version: expectedVersion, executableSha256: sha256(executableBytes)};
}

function validateCatalogs(inputs) {
  const animation = inputs.animations.value.animations
    .find((candidate) => candidate.animationId === ANIMATION_ID);
  invariant(animation?.isCanonical === true && animation.duplicateOf === null &&
    animation.source.sha256 === EXPECTED.sourceSwf.sha256 &&
    animation.pairedFla.sha256 === EXPECTED.sourceFla.sha256,
  "catalog animation identity changed");
  invariant(animation.classification.grade === 4 && animation.classification.lesson === 3 &&
    animation.classification.section.code === "VB" && animation.classification.page.number === 6 &&
    animation.classification.titleRaw === "Zero" && animation.classification.titleSpanish === "Cero",
  "catalog teaching placement changed");
  invariant(animation.audio.exact.length === 1 &&
    animation.audio.exact[0].sha256 === EXPECTED.sourceSpanishAudio.sha256,
  "catalog audio association changed");
  const sourceIndex = new Map(inputs.sourceFiles.value.files.map((file) => [file.path, file]));
  for (const record of [animation.source, animation.pairedFla, animation.audio.exact[0]]) {
    const indexed = sourceIndex.get(record.path);
    invariant(indexed?.bytes === record.bytes && indexed.sha256 === record.sha256,
      `catalog/source-files binding changed: ${record.path}`);
  }
  const queue = inputs.batches.value.queues
    .find((candidate) => candidate.queueId === "release-g04-l03-negative-numbers");
  const batch = queue?.batches.find((candidate) => candidate.batchId === "batch-001");
  const batchOrdinal = batch?.items.findIndex((candidate) => candidate.canonicalAnimationId === ANIMATION_ID);
  invariant(batchOrdinal === 8 && batch.items[batchOrdinal].releaseRole === "active-xml-referenced-page",
    "G4 L3 batch-001 placement changed");
  const readiness = inputs.specificationReadiness.value.cards
    .find((candidate) => candidate.animationId === ANIMATION_ID);
  invariant(readiness && inputs.specificationReadiness.value.batch.gate.open === true &&
    inputs.specificationReadiness.value.batch.implementationAuthorizedNow === false &&
    readiness.specificationReadiness?.rendererImplementationAuthorized === false &&
    readiness.acceptance?.implementationAuthorized === false &&
    readiness.acceptance?.strictMigrationComplete === false,
  "batch development/specification/implementation boundaries changed");
  const ranking = inputs.implementationRanking.value.rankedItems
    .find((candidate) => candidate.animationId === ANIMATION_ID);
  invariant(ranking?.ranking?.implementationSequencePosition === 2 &&
    ranking.boundaries?.implementationAuthorized === false && ranking.boundaries?.strictComplete === false,
  "batch implementation ranking/boundary changed");
  const assetItem = inputs.assetDefinitionCensus.value.items
    .find((candidate) => candidate.animationId === ANIMATION_ID);
  invariant(assetItem?.source?.sha256 === EXPECTED.sourceSwf.sha256 &&
    assetItem.tagStream.definitionCount === 44 && assetItem.exactTextOccurrenceCount === 32,
  "asset-definition source census changed");
  return {animation, batchOrdinal: batchOrdinal + 1, readiness, ranking, assetItem};
}

function validatePreparedBinding(binding, preparedFla, preparedSwf) {
  invariant(binding.schemaVersion === 1 && binding.evidenceId === ANIMATION_ID &&
    binding.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding" &&
    binding.acceptanceEffect.startsWith("none;") && binding.source.sha256 === EXPECTED.sourceFla.sha256 &&
    binding.shippedSwf.source.sha256 === EXPECTED.sourceSwf.sha256,
  "prepared paired-source binding changed");
  invariant(binding.workingCopy.file === PREPARED_FLA && binding.workingCopy.mode === "0444" &&
    binding.workingCopy.readOnly === true && binding.workingCopy.byteIdenticalToSource === true &&
    binding.shippedSwf.workingCopy.file === PREPARED_SWF &&
    binding.shippedSwf.workingCopy.mode === "0444" &&
    binding.shippedSwf.workingCopy.readOnly === true &&
    binding.shippedSwf.workingCopy.byteIdenticalToSource === true,
  "prepared paired-source copy contract changed");
  invariant(preparedFla.binding.sha256 === EXPECTED.sourceFla.sha256 &&
    preparedSwf.binding.sha256 === EXPECTED.sourceSwf.sha256,
  "prepared paired-source bytes differ from frozen sources");
}

export function validateG4L3Vb006SourcePreflight(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === REPORT_TYPE &&
    report.animationId === ANIMATION_ID,
  "VB006 preflight report identity is invalid");
  invariant(report.source.swf.sha256 === EXPECTED.sourceSwf.sha256 &&
    report.source.fla.sha256 === EXPECTED.sourceFla.sha256 &&
    report.source.catalogAssociatedAudio.sha256 === EXPECTED.sourceSpanishAudio.sha256,
  "VB006 preflight source identities are invalid");
  invariant(report.timeline.root.frameCount === 10 && report.timeline.main.frameDomain === "sprite-44" &&
    report.timeline.main.frameCount === 163 && report.timeline.companion.frameDomain === "sprite-5" &&
    report.timeline.companion.frameCount === 1,
  "VB006 preflight timeline contract is invalid");
  invariant(report.actionScript.scripts.length === 6 && report.actionScript.buttonHandlers.length === 4 &&
    report.actionScript.randomCallOccurrences === 0 &&
    report.actionScript.legacyNetworkEndpointOccurrences === 0,
  "VB006 preflight ActionScript contract is invalid");
  invariant(report.actionScript.hostDependencies.some((entry) => entry.identifier === "_root.DoHyperLinks") &&
    report.actionScript.hostDependencies.some((entry) => entry.identifier === "_level0.InternalPreloader") &&
    report.actionScript.hostDependencies.some((entry) => entry.identifier === "_global.KeyAttribute"),
  "VB006 preflight host dependency inventory is incomplete");
  invariant(report.audio.embedded.blockCount === 157 &&
    report.audio.embedded.payload.sha256 === EXPECTED.embeddedAudioPayload.sha256 &&
    report.audio.catalogAssociated.decodeToNullPassed === true,
  "VB006 preflight audio inventory is invalid");
  invariant(report.language.visibleSourceText === "english-only-static-source-evidence" &&
    report.language.spanishVisualRuntimeEstablished === false &&
    report.language.catalogAssociatedAudioSpokenLanguageEstablished === false,
  "VB006 preflight language boundary is invalid");
  invariant(report.canvasPreflight.freshExport.spriteFrameCount === 163 &&
    report.canvasPreflight.safeAdapterInMemoryBuild.succeeded === true &&
    report.canvasPreflight.safeAdapterInMemoryBuild.persistedRendererFiles === 0,
  "VB006 Canvas preflight is invalid");
  invariant(report.candidateDisposition.boundedSourceStaticDrawingCandidateTechnicallySupported === true &&
    report.candidateDisposition.completeCurrentJavascriptCandidateSourceSupported === false &&
    report.candidateDisposition.permissionToImplement === false &&
    report.candidateDisposition.productionAdmission === false,
  "VB006 candidate disposition was promoted beyond the audit boundary");
  invariant(ACCEPTANCE_KEYS.every((key) => report.acceptance[key] === false) &&
    Object.keys(report.acceptance).length === ACCEPTANCE_KEYS.length &&
    report.strictAcceptanceEffect === "none",
  "VB006 acceptance fields must all remain false");
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === fingerprint(projected),
    "VB006 report fingerprint is stale");
  return report;
}

export function renderG4L3Vb006SourcePreflightMarkdown(report) {
  const acceptanceRows = Object.entries(report.acceptance)
    .map(([key, value]) => `| \`${key}\` | ${value} |`).join("\n");
  const buttonRows = report.actionScript.buttonHandlers.map((button) =>
    `| ${button.characterId} | ${button.firstLocalFrame} | \`${button.keyAttribute}\` | \`${button.hostCall}\` | false |`,
  ).join("\n");
  return `# G4 L3 VB006 source preflight: Zero / Cero

This report is an acceptance-neutral, read-only source audit for \`${ANIMATION_ID}\`. It creates no migration workspace, renderer, registry entry, route, ledger change, approval, or production admission.

## Result

- Frozen SWF: \`${report.source.swf.path}\` (${report.source.swf.bytes.toLocaleString("en-US")} bytes; SHA-256 \`${report.source.swf.sha256}\`).
- Frozen FLA: \`${report.source.fla.path}\` (${report.source.fla.bytes.toLocaleString("en-US")} bytes; SHA-256 \`${report.source.fla.sha256}\`).
- Native stage/root: ${report.timeline.stage.width}×${report.timeline.stage.height}, ${report.timeline.fps} FPS, ${report.timeline.root.frameCount} root frames.
- Main source-static drawing domain: \`${report.timeline.main.frameDomain}\`, ${report.timeline.main.frameCount} one-indexed frames, placed by root frame ${report.timeline.main.rootPlacement.frame} at (${report.timeline.main.rootPlacement.translationPixels.x}, ${report.timeline.main.rootPlacement.translationPixels.y}).
- Companion page-title domain: \`${report.timeline.companion.frameDomain}\`, ${report.timeline.companion.frameCount} frame; it is not included in the in-memory main-sprite adapter preflight.
- Full current-JavaScript candidate source-supported now: **false**.
- Bounded English-only, muted, noninteractive source-static drawing candidate technically supported: **true**, but permission to implement remains **false** because final specification and renderer implementation authorization are still closed.

## Exact interaction obligations

| Button ID | First local frame | KeyAttribute | unresolved host call | Enabled by preflight |
|---:|---:|---|---|---:|
${buttonRows}

The four handlers also call \`_root.animation_mc.animation.stop()\`. Root frame 1 calls \`_level0.InternalPreloader.gotoAndPlay("jump_check")\` and then stops; root frame 6 stops again. These are source-exact host dependencies, not inferred browser behavior.

## Audio and language boundary

- Embedded MP3 stream: \`${report.audio.embedded.frameDomain}\`, blocks ${report.audio.embedded.firstBlockLocalFrame}–${report.audio.embedded.lastBlockLocalFrame}, ${report.audio.embedded.blockCount} blocks, payload SHA-256 \`${report.audio.embedded.payload.sha256}\`; decoded technically, not listened to or accepted.
- Catalog-associated \`/SA/\` MP3: ${report.audio.catalogAssociated.durationSeconds}s, ${report.audio.catalogAssociated.sampleRateHz} Hz mono, SHA-256 \`${report.audio.catalogAssociated.sha256}\`; the path convention is a Spanish candidate only.
- The SWF text export proves English visual strings. It does not prove Spanish visual parity, host language selection, cue mapping, synchronization, Replay, or audio acceptance.

## Canvas feasibility preflight

- Fresh FFDec 26.2.1 sprite export: ${report.canvasPreflight.freshExport.exportCanvas.width}×${report.canvasPreflight.freshExport.exportCanvas.height}, ${report.canvasPreflight.freshExport.spriteFrameCount} frames, ${report.canvasPreflight.freshExport.placedFunctionCount} allowlisted drawing functions, ${report.canvasPreflight.freshExport.embeddedImageCount} embedded images.
- The shared safe adapter builder succeeded in memory and produced a hash-bound runtime candidate (${report.canvasPreflight.safeAdapterInMemoryBuild.bytes.toLocaleString("en-US")} bytes; SHA-256 \`${report.canvasPreflight.safeAdapterInMemoryBuild.sha256}\`). It was discarded; **0 renderer files were persisted**.
- Legacy ActionScript, pointer controls, audio, timers, autoplay, network, storage, and ambient DOM listeners were not enabled.

## Required next evidence

${report.requiredNextEvidence.map((item) => `- ${item}`).join("\n")}

## Acceptance boundary

| Gate | Accepted |
|---|---:|
${acceptanceRows}
`;
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", swfmill: "swfmill", python: "python3", ffprobe: "ffprobe", ffmpeg: "ffmpeg"};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--ffdec", "--swfmill", "--python", "--ffprobe", "--ffmpeg"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

export async function buildG4L3Vb006SourcePreflight({
  ffdec = "ffdec",
  swfmill = "swfmill",
  python = "python3",
  ffprobe = "ffprobe",
  ffmpeg = "ffmpeg",
} = {}) {
  const inputEntries = await Promise.all(Object.entries(INPUT_REPORTS).map(async ([key, relativePath]) => [
    key,
    await readJsonBinding(relativePath),
  ]));
  const inputs = Object.fromEntries(inputEntries);
  const catalog = validateCatalogs(inputs);
  const [sourceSwf, sourceFla, sourceSpanishAudio, preparedBinding, preparedFla, preparedSwf,
    embeddedArchive, placementParser, safeAdapterBuilder, generator] = await Promise.all([
    readSourcePinned(SOURCE_SWF, EXPECTED.sourceSwf, "VB006 source SWF"),
    readSourcePinned(SOURCE_FLA, EXPECTED.sourceFla, "VB006 source FLA"),
    readSourcePinned(SOURCE_SPANISH_AUDIO, EXPECTED.sourceSpanishAudio, "VB006 catalog-associated MP3"),
    readPinned(PREPARED_BINDING, EXPECTED.preparedBinding, "VB006 prepared paired-source binding"),
    readPinned(PREPARED_FLA, EXPECTED.sourceFla, "VB006 prepared FLA copy"),
    readPinned(PREPARED_SWF, EXPECTED.sourceSwf, "VB006 prepared SWF copy"),
    readPinned(EMBEDDED_ARCHIVE, EXPECTED.embeddedAudioPayload, "VB006 embedded-audio CAS payload"),
    readRegularFile(PLACEMENT_PARSER),
    readRegularFile(SAFE_ADAPTER_BUILDER),
    readRegularFile(portable(path.relative(ROOT, scriptPath))),
  ]);
  const preparedBindingValue = JSON.parse(preparedBinding.bytes.toString("utf8"));
  validatePreparedBinding(preparedBindingValue, preparedFla, preparedSwf);
  const preparedFlaMode = (await stat(preparedFla.absolute)).mode & 0o777;
  const preparedSwfMode = (await stat(preparedSwf.absolute)).mode & 0o777;
  invariant(preparedFlaMode === 0o444 && preparedSwfMode === 0o444,
    "VB006 prepared source copies must remain mode 0444");

  invariant(sourceFla.bytes.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1",
    "VB006 FLA is no longer the expected legacy CFB binary document");
  const staticFacts = parseSwfSourceFacts(sourceSwf.bytes);
  const domains = validateSourceStructure(staticFacts);
  const embeddedAudioFacts = parseEmbeddedAudioPayloads(sourceSwf.bytes);
  const embeddedStream = validateEmbeddedAudio(embeddedAudioFacts);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb006-preflight-"));
  try {
    const canvasDirectory = path.join(temporaryRoot, "canvas");
    const scriptsDirectory = path.join(temporaryRoot, "scripts");
    const textDirectory = path.join(temporaryRoot, "text");
    const swfmillXml = path.join(temporaryRoot, "source.xml");
    const sourcePath = sourceSwf.absolute;
    const [ffdecTool, swfmillTool] = await Promise.all([
      inspectTool(ffdec, EXPECTED.ffdecVersion, ["-help"]),
      inspectTool(swfmill, EXPECTED.swfmillVersion, ["--version"]),
    ]);
    const canvasExport = await run(ffdec, [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", "44",
      "-format", "sprite:canvas",
      "-export", "sprite",
      canvasDirectory,
      sourcePath,
    ]);
    invariant(`${canvasExport.stdout}\n${canvasExport.stderr}`.includes(EXPECTED.ffdecVersion),
      "FFDec Canvas exporter version changed");
    await Promise.all([
      run(ffdec, ["-config", "packJavaScripts=false", "-onerror", "abort", "-export", "script", scriptsDirectory, sourcePath]),
      run(ffdec, ["-onerror", "abort", "-format", "text:plain", "-export", "text", textDirectory, sourcePath]),
      run(swfmill, ["swf2xml", sourcePath, swfmillXml]),
    ]);
    const [helper, framesHtml, swfmillXmlBytes, scriptPaths, textPaths,
      associatedProbe, embeddedProbe] = await Promise.all([
      readFile(path.join(canvasDirectory, "DefineSprite_44", "canvas.js")),
      readFile(path.join(canvasDirectory, "DefineSprite_44", "frames.html")),
      readFile(swfmillXml),
      walkRegularFiles(scriptsDirectory),
      walkRegularFiles(textDirectory),
      run(ffprobe, ["-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=index,codec_name,sample_rate,channels,bit_rate,duration", "-of", "json", sourceSpanishAudio.absolute]),
      run(ffprobe, ["-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=index,codec_name,sample_rate,channels,bit_rate,duration", "-of", "json", embeddedArchive.absolute]),
    ]);
    invariant(swfmillXmlBytes.length === EXPECTED.swfmillXml.bytes &&
      sha256(swfmillXmlBytes) === EXPECTED.swfmillXml.sha256,
    "fresh swfmill XML changed");
    validateCanvasExport(helper, framesHtml);
    const scripts = validateScripts(await Promise.all(scriptPaths.map(async (relativePath) => ({
      path: portable(relativePath),
      text: await readFile(path.join(scriptsDirectory, relativePath), "utf8"),
    }))));
    const texts = validateTextExport(await Promise.all(textPaths.map(async (relativePath) => ({
      path: portable(relativePath),
      text: await readFile(path.join(textDirectory, relativePath), "utf8"),
    }))));
    const [mainPlacementRaw, titlePlacementRaw] = await Promise.all([
      run(python, [placementParser.absolute, "--swfmill", swfmillXml, "--object-id", "44", "--placement-name", "animation", "--begin-label", "begin"]),
      run(python, [placementParser.absolute, "--swfmill", swfmillXml, "--object-id", "5", "--placement-name", "Mc_Page_Title", "--begin-label", "begin"]),
    ]);
    const mainPlacement = validatePlacement(JSON.parse(mainPlacementRaw.stdout), {
      objectId: 44, frameCount: 163, name: "animation", depth: 4, x: 8_026, y: 4_885,
    });
    const titlePlacement = validatePlacement(JSON.parse(titlePlacementRaw.stdout), {
      objectId: 5, frameCount: 1, name: "Mc_Page_Title", depth: 2, x: 8_002, y: 868,
    });
    await Promise.all([
      run(ffmpeg, ["-v", "error", "-xerror", "-nostdin", "-i", sourceSpanishAudio.absolute, "-map", "0:a:0", "-f", "null", "-"]),
      run(ffmpeg, ["-v", "error", "-xerror", "-nostdin", "-i", embeddedArchive.absolute, "-map", "0:a:0", "-f", "null", "-"]),
    ]);
    const associatedMedia = audioProbeProjection(JSON.parse(associatedProbe.stdout));
    const embeddedMedia = audioProbeProjection(JSON.parse(embeddedProbe.stdout));
    invariant(associatedMedia.bytes === EXPECTED.sourceSpanishAudio.bytes &&
      associatedMedia.sampleRateHz === 48_000 && associatedMedia.containerDurationSeconds === 15.072,
    "catalog-associated MP3 technical facts changed");
    invariant(embeddedMedia.bytes === EXPECTED.embeddedAudioPayload.bytes &&
      embeddedMedia.sampleRateHz === 22_050 && embeddedMedia.containerDurationSeconds === 13,
    "embedded MP3 CAS technical facts changed");

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

    const mainBoundaryFrames = [...new Set(domains.main.placementEdges
      .flatMap((edge) => edge.distinctFrames))].sort((left, right) => left - right);
    const buttonFrame = (characterId) => domains.main.placementEdges
      .find((edge) => edge.characterId === characterId)?.firstFrame;
    const scriptByPath = new Map(scripts.map((entry) => [entry.path, entry]));
    const buttonHandlers = [
      {characterId: 11, keyAttribute: "Zero"},
      {characterId: 12, keyAttribute: "Value"},
      {characterId: 42, keyAttribute: "Positive number"},
      {characterId: 43, keyAttribute: "Negative number"},
    ].map((button) => ({
      ...button,
      firstLocalFrame: buttonFrame(button.characterId),
      script: scriptByPath.get(`scripts/DefineButton2_${button.characterId}/BUTTONCONDACTION on(release).as`).path,
      event: "release",
      hostCall: "_root.DoHyperLinks()",
      hostAnimationStop: "_root.animation_mc.animation.stop()",
      runtimeReachabilityEstablished: false,
      enabledByThisPreflight: false,
    }));
    invariant(JSON.stringify(buttonHandlers.map(({firstLocalFrame}) => firstLocalFrame)) ===
      JSON.stringify([1, 1, 116, 116]), "button placement frames changed");

    const assetItem = catalog.assetItem;
    const acceptance = acceptanceBoundary();
    const report = {
      schemaVersion: 1,
      reportType: REPORT_TYPE,
      animationId: ANIMATION_ID,
      classification: {
        lesson: "G4 L3",
        batchId: "batch-001",
        batchOrdinal: catalog.batchOrdinal,
        section: "VB",
        page: 6,
        titleRaw: "Zero",
        titleDisplay: "Zero",
        titleSpanishCatalog: "Cero",
        domain: "vocabulary",
      },
      generator: generator.binding,
      sourceBindings: {
        ...Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, value.binding])),
        placementParser: placementParser.binding,
        safeAdapterBuilder: safeAdapterBuilder.binding,
        preparedPairedSourceBinding: preparedBinding.binding,
        ffdec: ffdecTool,
        swfmill: swfmillTool,
      },
      source: {
        swf: {...sourceSwf.binding, physicalHashVerifiedNow: true, preservedUnchanged: true},
        fla: {
          ...sourceFla.binding,
          physicalHashVerifiedNow: true,
          preservedUnchanged: true,
          container: "legacy-binary-CFB-v2",
          authoringAuditCompleted: false,
        },
        catalogAssociatedAudio: {
          ...sourceSpanishAudio.binding,
          physicalHashVerifiedNow: true,
          preservedUnchanged: true,
          catalogLanguage: "und",
          normalizedPathConventionCandidate: "es",
        },
        preparedReadOnlyCopies: {
          binding: preparedBinding.binding,
          fla: {...preparedFla.binding, mode: "0444", byteIdenticalToFrozenSource: true},
          swf: {...preparedSwf.binding, mode: "0444", byteIdenticalToFrozenSource: true},
          animateOpenedByThisPreflight: false,
          sourceSwfExecutedByThisPreflight: false,
          acceptanceEffect: "none",
        },
      },
      timeline: {
        stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
        fps: 12,
        root: {
          frameDomain: "root",
          frameCount: 10,
          durationMs: 10 * 1000 / 12,
          frame1: {
            operations: ['_level0.InternalPreloader.gotoAndPlay("jump_check")', "stop()"],
            naturalHostTransitionEstablished: false,
          },
          beginLabel: {label: "begin", frame: 6},
          frame6: {operation: "stop()"},
          domainFingerprintSha256: domains.root.domainFingerprintSha256,
        },
        companion: {
          frameDomain: "sprite-5",
          frameCount: 1,
          role: "page-title-companion",
          rootPlacement: titlePlacement.rootPlacement,
          domainFingerprintSha256: domains.pageTitle.domainFingerprintSha256,
          compositingDispositionEstablished: false,
        },
        main: {
          frameDomain: "sprite-44",
          frameCount: 163,
          durationMs: 163 * 1000 / 12,
          rootPlacement: mainPlacement.rootPlacement,
          domainFingerprintSha256: domains.main.domainFingerprintSha256,
          sourceStaticPlacementActivityFrameCandidates: mainBoundaryFrames,
          fullFrameCoverageStillRequired: true,
          naturalEntryStateEstablished: false,
          terminalBehaviorEstablished: false,
          compositingDispositionEstablished: false,
        },
        structurallyRootReachableTimelineCount: 3,
        dynamicallyCreatedTimelineInventoryComplete: false,
        frameDomainDispositionComplete: false,
      },
      assets: {
        definitionInventorySha256: assetItem.definitionInventorySha256,
        definitionCount: assetItem.tagStream.definitionCount,
        categoryCounts: assetItem.tagStream.categoryCounts,
        exactTextOccurrenceCount: assetItem.exactTextOccurrenceCount,
        fonts: assetItem.fontFacts.map(({characterId, exactName, glyphCount, codePointCount, codePointMin, codePointMax, parseStatus}) => ({
          characterId, exactName, glyphCount, codePointCount, codePointMin, codePointMax, parseStatus,
        })),
        freshFfdecTextExport: {
          fileCount: texts.length,
          normalizedBytes: texts.reduce((sum, item) => sum + item.bytes, 0),
          manifestSha256: fingerprint(texts),
          files: texts,
        },
        maskCandidate: {
          detectedInSourceDerivedCanvasExport: true,
          evidence: "sprite-44 frame drawing uses a destination-in clip stack",
          authoringMaskSemanticsConfirmed: false,
        },
      },
      actionScript: {
        generation: "AS1/2",
        scripts,
        rootFrameScriptCount: 2,
        buttonHandlerCount: 4,
        buttonHandlers,
        hostDependencies: [
          {
            identifier: "_level0.InternalPreloader",
            operation: 'gotoAndPlay("jump_check")',
            source: "scripts/frame_1/DoAction.as",
            modernDisposition: "unresolved",
          },
          {
            identifier: "_global.KeyAttribute",
            operation: "write selected glossary key",
            values: buttonHandlers.map(({keyAttribute}) => keyAttribute),
            modernDisposition: "unresolved",
          },
          {
            identifier: "_root.DoHyperLinks",
            operation: "invoke host glossary/navigation function",
            sourceButtonCharacterIds: buttonHandlers.map(({characterId}) => characterId),
            modernDisposition: "unresolved",
          },
          {
            identifier: "_root.animation_mc.animation",
            operation: "stop() after glossary hotspot release",
            sourceButtonCharacterIds: buttonHandlers.map(({characterId}) => characterId),
            modernDisposition: "unresolved",
          },
        ],
        pointerHandlerOccurrences: 4,
        randomCallOccurrences: 0,
        scoringSignalOccurrences: 0,
        keyboardSignalOccurrences: 0,
        inputFieldSignalOccurrences: 0,
        replayOrResetSignalOccurrences: 0,
        languageScriptSignalOccurrences: 0,
        legacyNetworkEndpointOccurrences: 0,
        legacyActionScriptExecutedByThisPreflight: false,
        runtimeReachabilityEstablished: false,
      },
      language: {
        visibleSourceText: "english-only-static-source-evidence",
        catalogTitleSpanish: "Cero",
        catalogTitleIsRuntimeVisualProof: false,
        spanishVisualRuntimeEstablished: false,
        embeddedStreamSpokenLanguageEstablished: false,
        catalogAssociatedAudioPathConventionCandidate: "es",
        catalogAssociatedAudioSpokenLanguageEstablished: false,
        languageSwitchingRuntimeEstablished: false,
        bilingualParityEstablished: false,
      },
      audio: {
        embedded: {
          frameDomain: embeddedStream.ownerDomainId,
          format: embeddedStream.head.format,
          sampleRateHz: embeddedStream.head.sampleRateHz,
          channels: embeddedStream.head.channels,
          soundStreamHeadLocalFrame: embeddedStream.headLocalFrame,
          firstBlockLocalFrame: embeddedStream.blocks[0].localFrame,
          lastBlockLocalFrame: embeddedStream.blocks.at(-1).localFrame,
          blockCount: embeddedStream.blockCount,
          totalBlockHeaderSampleCount: embeddedStream.totalBlockHeaderSampleCount,
          payload: {
            path: EMBEDDED_ARCHIVE,
            bytes: embeddedArchive.bytes.length,
            sha256: embeddedArchive.binding.sha256,
            physicalHashVerifiedNow: true,
          },
          media: embeddedMedia,
          decodeToNullPassed: true,
          spokenLanguageEstablished: false,
          cueMappingEstablished: false,
          runtimeSynchronizationEstablished: false,
          listeningAcceptanceEstablished: false,
          renderedByCandidate: false,
        },
        catalogAssociated: {
          path: SOURCE_SPANISH_AUDIO,
          bytes: sourceSpanishAudio.bytes.length,
          sha256: sourceSpanishAudio.binding.sha256,
          sampleRateHz: associatedMedia.sampleRateHz,
          channels: associatedMedia.channels,
          durationSeconds: associatedMedia.containerDurationSeconds,
          bitRateBps: associatedMedia.bitRateBps,
          decodeToNullPassed: true,
          pathConventionLanguageCandidate: "es",
          spokenLanguageEstablished: false,
          cueMappingEstablished: false,
          runtimeSynchronizationEstablished: false,
          listeningAcceptanceEstablished: false,
          renderedByCandidate: false,
        },
        authoritativeBilingualAudioAcceptanceEstablished: false,
      },
      canvasPreflight: {
        purpose: "technical feasibility of an acceptance-neutral, English-only, muted, noninteractive source-static drawing candidate",
        freshExport: {
          tool: EXPECTED.ffdecVersion,
          targetSpriteObjectId: 44,
          targetSpriteFunction: "sprite44",
          spriteFrameCount: 163,
          publicFrameIndexingIfImplemented: "one-indexed",
          exportCanvas: {width: 697, height: 382},
          exportInternalTranslation: {x: 337.25, y: 141.25},
          stageRenderOffset: {x: 64.05, y: 103},
          helper: {bytes: helper.length, sha256: sha256(helper)},
          framesHtml: {bytes: framesHtml.length, sha256: sha256(framesHtml)},
          placedFunctionCount: safeBuild.placedFunctions.length,
          placedFunctionsSha256: sha256(JSON.stringify(safeBuild.placedFunctions)),
          embeddedImageCount: safeBuild.imageVariables.length,
          embeddedImageVariablesSha256: sha256(JSON.stringify(safeBuild.imageVariables)),
          swfmillXml: {bytes: swfmillXmlBytes.length, sha256: sha256(swfmillXmlBytes)},
        },
        safeAdapterInMemoryBuild: {
          builder: safeAdapterBuilder.binding,
          succeeded: true,
          bytes: Buffer.byteLength(safeBuild.runtime),
          sha256: sha256(safeBuild.runtime),
          persistedRendererFiles: 0,
          noDynamicEvaluation: true,
          noNetworkPrimitives: true,
          noTimersOrAutoplay: true,
          noPersistentStorage: true,
          noAmbientDomListeners: true,
          interactiveControlsEnabled: false,
          audioRendered: false,
        },
      },
      candidateDisposition: {
        boundedSourceStaticDrawingCandidateTechnicallySupported: true,
        boundedScope: {
          frameDomain: "sprite-44",
          frames: {start: 1, end: 163},
          languages: ["en"],
          audio: "disabled",
          interaction: "disabled",
          rootCompositing: "not-claimed",
          statusLabel: "source-static-current-javascript-engineering-candidate-only",
        },
        completeCurrentJavascriptCandidateSourceSupported: false,
        permissionToImplement: false,
        reasonPermissionIsFalse: "parallel shard development entry is open, but final specification and renderer implementation remain unauthorized; this task is read-only/source-audit",
        migrationScaffoldMayBeCreated: false,
        registryEntryMayBeAdded: false,
        productRouteMayBeAdded: false,
        strictLedgerMayBeChanged: false,
        productionAdmission: false,
        recommendedRendererAfterAuthorization: {
          status: "provisional",
          primary: "react-state-machine+canvas",
          engineHint: "safe hash-bound FFDec Canvas adapter candidate",
          mustBeReevaluatedAfterAuthoringAndRuntimeEvidence: true,
        },
      },
      blockers: [...BLOCKERS],
      requiredNextEvidence: [
        "Complete the prepared paired FLA/SWF recursive Adobe Animate audit with the named human present only to acknowledge the legacy conversion warning; close without saving, publishing, or exporting.",
        "Resolve the original G4 L3 host contracts for InternalPreloader.jump_check, _global.KeyAttribute, DoHyperLinks(), and _root.animation_mc.animation.stop().",
        "Build a frame-domain disposition for root, sprite-5, and sprite-44, and enumerate any dynamically created timelines from authoring/runtime evidence.",
        "Capture natural authoritative original-runtime traces for root entry, all four glossary hotspots, terminal state, Replay, English, and Spanish host states.",
        "Establish embedded/external audio language, cue, synchronization, stop/replay, and named-human listening evidence without substituting path convention for runtime proof.",
        "Although parallel-shard development entry is open, any engineering-only renderer using the recorded sprite-44 contract must remain English-only, muted, noninteractive, and non-production until final specification and renderer implementation authorization are explicitly established.",
      ],
      acceptance,
      strictAcceptanceEffect: "none",
    };
    report.reportFingerprintSha256 = fingerprint(report);
    return validateG4L3Vb006SourcePreflight(report);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

export async function writeOrCheckG4L3Vb006SourcePreflight({check = false, ...toolOptions} = {}) {
  const report = await buildG4L3Vb006SourcePreflight(toolOptions);
  const json = stableJson(report);
  const markdown = renderG4L3Vb006SourcePreflightMarkdown(report);
  const jsonPath = projectPath(DEFAULT_JSON);
  const markdownPath = projectPath(DEFAULT_MARKDOWN);
  await Promise.all([
    assertSafeReportOutput(jsonPath, {root: ROOT, extension: ".json"}),
    assertSafeReportOutput(markdownPath, {root: ROOT, extension: ".md"}),
  ]);
  await Promise.all([
    writeOrCheckReport(jsonPath, json, {root: ROOT, extension: ".json", check}),
    writeOrCheckReport(markdownPath, markdown, {root: ROOT, extension: ".md", check}),
  ]);
  return {
    animationId: ANIMATION_ID,
    check,
    json: DEFAULT_JSON,
    markdown: DEFAULT_MARKDOWN,
    boundedSourceStaticDrawingCandidateTechnicallySupported:
      report.candidateDisposition.boundedSourceStaticDrawingCandidateTechnicallySupported,
    completeCurrentJavascriptCandidateSourceSupported:
      report.candidateDisposition.completeCurrentJavascriptCandidateSourceSupported,
    acceptance: report.acceptance,
    strictAcceptanceEffect: report.strictAcceptanceEffect,
  };
}

function help() {
  return `Usage: node scripts/build-g4-l3-vb006-source-preflight.mjs [options]\n\n` +
    `Options:\n` +
    `  --check              Re-run every read-only source/tool probe and fail if reports are stale\n` +
    `  --ffdec <command>    FFDec launcher (default: ffdec)\n` +
    `  --swfmill <command>  swfmill launcher (default: swfmill)\n` +
    `  --python <command>   Python launcher for the ElementTree parser (default: python3)\n` +
    `  --ffprobe <command>  ffprobe launcher (default: ffprobe)\n` +
    `  --ffmpeg <command>   ffmpeg launcher (default: ffmpeg)\n` +
    `  -h, --help           Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(await writeOrCheckG4L3Vb006SourcePreflight(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
