#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const sourceSwfRelative =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf";
const sourceSwfPath = path.join(projectRoot, sourceSwfRelative);
const sourceSwfSha256 =
  "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const swfmillRelative =
  "migrations/shell-course-g04-l03-index-local/audit/machine/swfmill.xml.gz";
const swfmillPath = path.join(projectRoot, swfmillRelative);
const placementParserRelative = "scripts/parse-swfmill-shell-domain-placements.py";
const placementParserPath = path.join(projectRoot, placementParserRelative);
const expectedFfdecVersion = "JPEXS Free Flash Decompiler v.26.2.1";
const timelineDataRelative =
  "packages/demos/src/timelines/generated/shell-course-g04-l03-additional-domain-assets.ts";
const timelineDataPath = path.join(projectRoot, timelineDataRelative);

const rootEdge = (childObjectId, instanceName) =>
  Object.freeze({parentTimelineId: "root", childObjectId, instanceName});
const spriteEdge = (parentObjectId, childObjectId, instanceName) =>
  Object.freeze({parentTimelineId: `sprite-${parentObjectId}`, childObjectId, instanceName});

export const ADDITIONAL_DOMAIN_CONFIGS = Object.freeze([
  Object.freeze({
    frameDomain: "sprite-112", sourceCharacterId: 112,
    sourceInstanceId: "Progress_Bar.Mc_Slider", frameCount: 2, rootFrame: 50,
    scenarioId: "progress-bar-control-structural", label: "progress bar control",
    exporterCanvas: Object.freeze({width: 235, height: 32}),
    exporterLocalOrigin: Object.freeze({x: 6.05, y: 4.15}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(113, "Progress_Bar"), spriteEdge(113, 112, "Mc_Slider")]),
    behaviorObligations: Object.freeze(["media play and drag state", "frames-loaded ratio", "enterFrame causality"]),
  }),
  Object.freeze({
    frameDomain: "sprite-135", sourceCharacterId: 135,
    sourceInstanceId: "preloader_mc", frameCount: 4, rootFrame: 1,
    scenarioId: "preloader-shell-structural", label: "preloader shell",
    exporterCanvas: Object.freeze({width: 500, height: 69}),
    exporterLocalOrigin: Object.freeze({x: 370.95, y: 19.15}), expectedUniqueVisualCount: 4,
    placementEdges: Object.freeze([rootEdge(135, "preloader_mc")]),
    behaviorObligations: Object.freeze(["preload start", "animate-in", "animate-out", "loading causality"]),
  }),
  Object.freeze({
    frameDomain: "sprite-152", sourceCharacterId: 152,
    sourceInstanceId: "ShowLogin_Error_Mc", frameCount: 2, rootFrame: 1,
    scenarioId: "login-error-structural", label: "login error state",
    exporterCanvas: Object.freeze({width: 1362, height: 146}),
    exporterLocalOrigin: Object.freeze({x: 1054.45, y: 39.05}), expectedUniqueVisualCount: 2,
    placementEdges: Object.freeze([rootEdge(152, "ShowLogin_Error_Mc")]),
    behaviorObligations: Object.freeze(["login failure state", "animation pause", "muted error sound"]),
  }),
  Object.freeze({
    frameDomain: "sprite-155", sourceCharacterId: 155,
    sourceInstanceId: "Mc_Data_Update", frameCount: 15, rootFrame: 1,
    scenarioId: "data-update-structural", label: "data update state",
    exporterCanvas: Object.freeze({width: 319, height: 76}),
    exporterLocalOrigin: Object.freeze({x: 21.35, y: 36.95}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(155, "Mc_Data_Update")]),
    behaviorObligations: Object.freeze(["dynamic elapsed-time text", "failure branch", "host data update"]),
  }),
  Object.freeze({
    frameDomain: "sprite-164", sourceCharacterId: 164,
    sourceInstanceId: "Send_Quiz_Report_Mc", frameCount: 5, rootFrame: 1,
    scenarioId: "quiz-report-structural", label: "quiz report sender",
    exporterCanvas: Object.freeze({width: 37, height: 41}),
    exporterLocalOrigin: Object.freeze({x: 18.5, y: 20.1}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(164, "Send_Quiz_Report_Mc")]),
    behaviorObligations: Object.freeze(["final quiz URL", "POST side effect", "return to frame 1"]),
  }),
  Object.freeze({
    frameDomain: "sprite-176", sourceCharacterId: 176,
    sourceInstanceId: "InternalPreloader", frameCount: 28, rootFrame: 38,
    scenarioId: "internal-preloader-structural", label: "internal child preloader",
    exporterCanvas: Object.freeze({width: 1064, height: 51}),
    exporterLocalOrigin: Object.freeze({x: 989.9, y: 44.05}), expectedUniqueVisualCount: 3,
    placementEdges: Object.freeze([rootEdge(176, "InternalPreloader")]),
    behaviorObligations: Object.freeze(["child bytes-loaded progress", "begin transition", "Spanish audio check"]),
  }),
  Object.freeze({
    frameDomain: "sprite-199", sourceCharacterId: 199,
    sourceInstanceId: "title", frameCount: 36, rootFrame: 49,
    scenarioId: "course-title-structural", label: "course title",
    exporterCanvas: Object.freeze({width: 495, height: 46}),
    exporterLocalOrigin: Object.freeze({x: 293.65, y: 0.55}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(199, "title")]),
    behaviorObligations: Object.freeze(["title animation clock", "source text and localization"]),
  }),
  Object.freeze({
    frameDomain: "sprite-200", sourceCharacterId: 200,
    sourceInstanceId: "top_center", frameCount: 2, rootFrame: 49,
    scenarioId: "keyterms-top-center-state-structural", label: "keyterms top-center state",
    exporterCanvas: Object.freeze({width: 1, height: 1}),
    exporterLocalOrigin: Object.freeze({x: 0, y: 0}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(200, "top_center")]),
    behaviorObligations: Object.freeze(["keyterms pointer-state routing", "hidden hit-area behavior"]),
  }),
  Object.freeze({
    frameDomain: "sprite-266", sourceCharacterId: 266,
    sourceInstanceId: "nextani", frameCount: 34, rootFrame: 49,
    scenarioId: "next-animation-control-structural", label: "next animation control",
    exporterCanvas: Object.freeze({width: 1384, height: 338}),
    exporterLocalOrigin: Object.freeze({x: 1202.3, y: 336.95}), expectedUniqueVisualCount: 18,
    placementEdges: Object.freeze([rootEdge(266, "nextani")]),
    behaviorObligations: Object.freeze(["next availability", "terminal animation", "child completion causality"]),
  }),
  Object.freeze({
    frameDomain: "sprite-335", sourceCharacterId: 335,
    sourceInstanceId: "audiomain", frameCount: 2, rootFrame: 49,
    scenarioId: "audio-mute-control-structural", label: "audio mute control",
    exporterCanvas: Object.freeze({width: 838, height: 107}),
    exporterLocalOrigin: Object.freeze({x: 673.8, y: 116.15}), expectedUniqueVisualCount: 2,
    placementEdges: Object.freeze([rootEdge(335, "audiomain")]),
    behaviorObligations: Object.freeze(["mute state", "volume routing", "popup reset"]),
  }),
  Object.freeze({
    frameDomain: "sprite-549", sourceCharacterId: 549,
    sourceInstanceId: "bookmark_mc", frameCount: 2, rootFrame: 49,
    scenarioId: "bookmark-control-structural", label: "bookmark control",
    exporterCanvas: Object.freeze({width: 1417, height: 596}),
    exporterLocalOrigin: Object.freeze({x: 1017.9, y: 297.75}), expectedUniqueVisualCount: 2,
    placementEdges: Object.freeze([rootEdge(549, "bookmark_mc")]),
    behaviorObligations: Object.freeze(["bookmark confirmation", "animation pause", "muted feedback sound"]),
  }),
  Object.freeze({
    frameDomain: "sprite-562", sourceCharacterId: 562,
    sourceInstanceId: "quit", frameCount: 2, rootFrame: 49,
    scenarioId: "quit-control-structural", label: "quit control",
    exporterCanvas: Object.freeze({width: 1392, height: 596}),
    exporterLocalOrigin: Object.freeze({x: 993.3, y: 297.75}), expectedUniqueVisualCount: 2,
    placementEdges: Object.freeze([rootEdge(562, "quit")]),
    behaviorObligations: Object.freeze(["quit confirmation", "animation pause", "external close effect"]),
  }),
  Object.freeze({
    frameDomain: "sprite-586", sourceCharacterId: 586,
    sourceInstanceId: "ct_center", frameCount: 2, rootFrame: 50,
    scenarioId: "calculator-center-state-structural", label: "calculator center state",
    exporterCanvas: Object.freeze({width: 1, height: 1}),
    exporterLocalOrigin: Object.freeze({x: 0, y: 0}), expectedUniqueVisualCount: 1,
    placementEdges: Object.freeze([rootEdge(586, "ct_center")]),
    behaviorObligations: Object.freeze(["calculator pointer-state routing", "hidden hit-area behavior"]),
  }),
  Object.freeze({
    frameDomain: "sprite-709", sourceCharacterId: 709,
    sourceInstanceId: "m_c", frameCount: 6, rootFrame: 50,
    scenarioId: "keyterm-modal-structural", label: "keyterm modal",
    exporterCanvas: Object.freeze({width: 1608, height: 420}),
    exporterLocalOrigin: Object.freeze({x: 799.3, y: 164.5}), expectedUniqueVisualCount: 2,
    placementEdges: Object.freeze([rootEdge(709, "m_c")]),
    behaviorObligations: Object.freeze(["keyterm XML content", "English and Spanish dynamic text", "diagram loading", "Back and close behavior"]),
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function round(value) {
  return Number(value.toFixed(12));
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature), `${label}: invalid PNG signature`);
  invariant(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function edgeArgument({parentTimelineId, childObjectId, instanceName}) {
  return `${parentTimelineId}:${childObjectId}:${instanceName}`;
}

function edgeKey({parentTimelineId, sourceObjectId, instanceName}) {
  return `${parentTimelineId}:${sourceObjectId}:${instanceName}`;
}

function matrixFromEdge(edge) {
  const transform = edge.transform;
  return {
    a: Number(transform.scaleX), b: Number(transform.skewY),
    c: Number(transform.skewX), d: Number(transform.scaleY),
    e: Number(transform.translatePixels.x), f: Number(transform.translatePixels.y),
  };
}

function multiply(left, right) {
  return {
    a: round(left.a * right.a + left.c * right.b),
    b: round(left.b * right.a + left.d * right.b),
    c: round(left.a * right.c + left.c * right.d),
    d: round(left.b * right.c + left.d * right.d),
    e: round(left.a * right.e + left.c * right.f + left.e),
    f: round(left.b * right.e + left.d * right.f + left.f),
  };
}

function compositionMatrix(effective, origin) {
  return {
    a: effective.a, b: effective.b, c: effective.c, d: effective.d,
    e: round(effective.e - effective.a * origin.x - effective.c * origin.y),
    f: round(effective.f - effective.b * origin.x - effective.d * origin.y),
  };
}

function visualRuns(frames, assets) {
  const visualIndexByFile = new Map(assets.map(({file, visualIndex}) => [file, visualIndex]));
  const runs = [];
  for (const frame of frames) {
    const visualIndex = visualIndexByFile.get(frame.file);
    invariant(Number.isInteger(visualIndex), `missing visual index for frame ${frame.frame}`);
    const previous = runs.at(-1);
    if (previous?.visualIndex === visualIndex) previous.endFrame = frame.frame;
    else runs.push({startFrame: frame.frame, endFrame: frame.frame, visualIndex});
  }
  return runs;
}

async function ffdecExport(format, target, selection) {
  await execFileAsync(
    "ffdec",
    [
      "-format", `sprite:${format}`,
      "-selectid", ADDITIONAL_DOMAIN_CONFIGS.map(({sourceCharacterId}) => sourceCharacterId).join(","),
      "-select", selection,
      "-onerror", "abort",
      "-export", "sprite", target, sourceSwfPath,
    ],
    {cwd: projectRoot, maxBuffer: 32 * 1024 * 1024},
  );
}

async function oneExportDirectory(root, sourceCharacterId) {
  const prefix = `DefineSprite_${sourceCharacterId}`;
  const matches = (await readdir(root)).filter((name) => name === prefix || name.startsWith(`${prefix}_`));
  invariant(matches.length === 1, `${prefix}: expected one FFDec export directory, found ${matches.length}`);
  return path.join(root, matches[0]);
}

async function readSvgOrigin(svgDirectory, config) {
  const bytes = await readFile(path.join(svgDirectory, "1.svg"));
  const text = bytes.toString("utf8");
  const match = text.match(/<g transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, (-?[0-9.]+), (-?[0-9.]+)\)"/);
  invariant(match, `${config.frameDomain}: FFDec SVG local-origin transform missing`);
  const origin = {x: Number(match[1]), y: Number(match[2])};
  invariant(
    origin.x === config.exporterLocalOrigin.x && origin.y === config.exporterLocalOrigin.y,
    `${config.frameDomain}: exporter local origin drifted`,
  );
  return origin;
}

async function readPlacementEvidence() {
  const uniqueEdges = [];
  const seen = new Set();
  for (const config of ADDITIONAL_DOMAIN_CONFIGS) {
    for (const edge of config.placementEdges) {
      const argument = edgeArgument(edge);
      if (!seen.has(argument)) {
        seen.add(argument);
        uniqueEdges.push(argument);
      }
    }
  }
  const {stdout} = await execFileAsync(
    "python3",
    [placementParserPath, "--swfmill", swfmillPath, ...uniqueEdges.flatMap((edge) => ["--edge", edge])],
    {cwd: projectRoot, maxBuffer: 4 * 1024 * 1024},
  );
  const parsed = JSON.parse(stdout);
  invariant(parsed.schemaVersion === 1 && parsed.parser === "python-xml.etree.ElementTree", "placement parser contract drifted");
  const byKey = new Map(parsed.edges.map((edge) => [edgeKey(edge), edge]));
  return {parsed, byKey};
}

async function exportDomain(config, pngRoot, svgRoot, placementByKey) {
  const pngDirectory = await oneExportDirectory(pngRoot, config.sourceCharacterId);
  const svgDirectory = await oneExportDirectory(svgRoot, config.sourceCharacterId);
  const origin = await readSvgOrigin(svgDirectory, config);
  const names = (await readdir(pngDirectory)).sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));
  invariant(names.length === config.frameCount, `${config.frameDomain}: frame count mismatch`);

  const uniqueByHash = new Map();
  const frames = [];
  for (let index = 0; index < config.frameCount; index += 1) {
    const frame = index + 1;
    invariant(names[index] === `${frame}.png`, `${config.frameDomain}: frame ${frame} filename mismatch`);
    const sourcePath = path.join(pngDirectory, `${frame}.png`);
    const bytes = await readFile(sourcePath);
    const dimensions = pngDimensions(bytes, `${config.frameDomain} frame ${frame}`);
    invariant(
      dimensions.width === config.exporterCanvas.width && dimensions.height === config.exporterCanvas.height,
      `${config.frameDomain}: frame ${frame} dimensions drifted`,
    );
    const digest = sha256(bytes);
    let asset = uniqueByHash.get(digest);
    if (!asset) {
      const visualIndex = uniqueByHash.size + 1;
      asset = {
        visualIndex, firstFrame: frame,
        file: `visual-${String(visualIndex).padStart(3, "0")}-${digest.slice(0, 12)}.png`,
        sha256: digest, bytes: bytes.length, ...dimensions, sourcePath,
      };
      uniqueByHash.set(digest, asset);
    }
    frames.push({frame, file: asset.file, sha256: digest});
  }
  const assets = [...uniqueByHash.values()];
  invariant(assets.length === config.expectedUniqueVisualCount, `${config.frameDomain}: unique visual count drifted`);

  const placementChain = config.placementEdges.map((configuredEdge) => {
    const evidence = placementByKey.get(`${configuredEdge.parentTimelineId}:${configuredEdge.childObjectId}:${configuredEdge.instanceName}`);
    invariant(evidence, `${config.frameDomain}: placement evidence missing for ${edgeArgument(configuredEdge)}`);
    return evidence;
  });
  invariant(placementChain[0].frame === config.rootFrame, `${config.frameDomain}: root entry frame drifted`);
  let effectiveRootMatrix = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};
  for (const edge of placementChain) effectiveRootMatrix = multiply(effectiveRootMatrix, matrixFromEdge(edge));
  const rootCompositionMatrix = compositionMatrix(effectiveRootMatrix, origin);
  return {
    config, assets, frames, placementChain, effectiveRootMatrix, rootCompositionMatrix,
    runs: visualRuns(frames, assets),
  };
}

async function expectedExport() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-additional-domains-"));
  try {
    const [version, generatorBytes, parserBytes, swfmillBytes, placementEvidence] = await Promise.all([
      execFileAsync("ffdec", ["-help", "export"], {cwd: projectRoot, maxBuffer: 1024 * 1024}),
      readFile(scriptPath), readFile(placementParserPath), readFile(swfmillPath), readPlacementEvidence(),
    ]);
    invariant(`${version.stdout}${version.stderr}`.includes(expectedFfdecVersion), `FFDec version drifted; expected ${expectedFfdecVersion}`);
    const sourceBefore = sha256(await readFile(sourceSwfPath));
    invariant(sourceBefore === sourceSwfSha256, "preserved shell SWF hash mismatch before export");

    const pngRoot = path.join(tempRoot, "png");
    const svgRoot = path.join(tempRoot, "svg");
    const allFrames = ADDITIONAL_DOMAIN_CONFIGS.map(({sourceCharacterId, frameCount}) => `${sourceCharacterId}:1-${frameCount}`).join(",");
    const firstFrames = ADDITIONAL_DOMAIN_CONFIGS.map(({sourceCharacterId}) => `${sourceCharacterId}:1`).join(",");
    await ffdecExport("png", pngRoot, allFrames);
    await ffdecExport("svg", svgRoot, firstFrames);
    invariant(sha256(await readFile(sourceSwfPath)) === sourceBefore, "preserved shell SWF changed during read-only export");

    const domains = [];
    for (const config of ADDITIONAL_DOMAIN_CONFIGS) {
      const domain = await exportDomain(config, pngRoot, svgRoot, placementEvidence.byKey);
      const manifest = {
        schemaVersion: 1,
        evidenceType: "ffdec-static-nested-timeline-implementation-assets",
        animationId,
        classification: "engineering-structural-inspection-not-strict-acceptance",
        authority: {
          kind: "ffdec-static-nested-timeline-render",
          statement: `These deduplicated PNGs and the complete ${config.frameCount}-frame lookup are a deterministic FFDec static export of ${config.frameDomain} (${config.sourceInstanceId}) for structural inspection only.`,
          authorityBoundary: "This is not original-runtime playback, ActionScript execution, event or loading causality, dynamic text truth, interaction, audio, localization, Replay, full-stage composition parity, RMSE, strict human review, owner acceptance, or strict completion.",
          actionScriptExecuted: false, originalRuntimeBaseline: false, naturalPlaybackClaimed: false,
        },
        generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: sha256(generatorBytes)},
        placementParser: {path: placementParserRelative, sha256: sha256(parserBytes), engine: placementEvidence.parsed.parser},
        tool: {name: "FFDec", version: expectedFfdecVersion},
        source: {
          swf: sourceSwfRelative, swfSha256: sourceSwfSha256,
          swfmill: swfmillRelative, swfmillSha256: sha256(swfmillBytes),
        },
        runtime: {
          fps: 12, frameDomain: config.frameDomain, sourceCharacterId: config.sourceCharacterId,
          sourceInstanceId: config.sourceInstanceId, frameCount: config.frameCount,
          rootFrame: config.rootFrame, frameNumbering: "one-indexed",
          supportedLanguages: ["en", "es"], visualLocalizationStatus: "source-static-shell-control-visuals",
          spanishTranslationSupplied: false,
        },
        geometry: {
          exporterCanvas: config.exporterCanvas,
          exporterLocalOrigin: config.exporterLocalOrigin,
          rootPlacementChain: domain.placementChain,
          effectiveRootMatrix: domain.effectiveRootMatrix,
          rootCompositionMatrix: domain.rootCompositionMatrix,
          rootCompositionOffset: {x: domain.rootCompositionMatrix.e, y: domain.rootCompositionMatrix.f},
          compositionStatus: "source-static-placement-matrix-candidate-runtime-unverified",
        },
        behaviorObligations: config.behaviorObligations,
        deduplication: {
          method: "sha256-identical-png-bytes", frameCount: config.frameCount,
          uniqueVisualCount: domain.assets.length, visualRunCount: domain.runs.length,
          everyFrameMapped: domain.frames.length === config.frameCount,
        },
        assets: domain.assets.map(({sourcePath: _sourcePath, ...asset}) => asset),
        frames: domain.frames,
        strictAcceptanceEffect: "none",
      };
      const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
      domains.push({...domain, manifest, manifestBytes, manifestSha256: sha256(manifestBytes)});
    }

    const data = Object.fromEntries(domains.map((domain) => [domain.config.frameDomain, {
      frameDomain: domain.config.frameDomain,
      scenarioId: domain.config.scenarioId,
      label: domain.config.label,
      sourceCharacterId: domain.config.sourceCharacterId,
      sourceInstanceId: domain.config.sourceInstanceId,
      frameCount: domain.config.frameCount,
      rootFrame: domain.config.rootFrame,
      exporterCanvas: domain.config.exporterCanvas,
      exporterLocalOrigin: domain.config.exporterLocalOrigin,
      rootCompositionMatrix: domain.rootCompositionMatrix,
      rootCompositionOffset: {x: domain.rootCompositionMatrix.e, y: domain.rootCompositionMatrix.f},
      assetManifestSha256: domain.manifestSha256,
      behaviorObligations: domain.config.behaviorObligations,
      assets: domain.assets.map(({sourcePath: _sourcePath, bytes: _bytes, width: _width, height: _height, firstFrame: _firstFrame, ...asset}) => asset),
      runs: domain.runs,
    }]));
    const timelineData = Buffer.from(
      `// Generated by ${portable(path.relative(projectRoot, scriptPath))}. Do not edit.\n` +
      `// FFDec structural inspection data only; this is not original-runtime evidence.\n\n` +
      `export const COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA = Object.freeze(${JSON.stringify(data, null, 2)} as const);\n\n` +
      `export type CourseShellG04L03AdditionalDomainId = keyof typeof COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA;\n` +
      `export const COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS = Object.freeze(Object.keys(COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA) as CourseShellG04L03AdditionalDomainId[]);\n`,
    );
    return {tempRoot, domains, timelineData};
  } catch (error) {
    await rm(tempRoot, {recursive: true, force: true});
    throw error;
  }
}

function outputDirectory(config) {
  return path.join(projectRoot, `public/flash-assets/courses/${animationId}/${config.frameDomain}`);
}

async function checkOutput(expected) {
  for (const domain of expected.domains) {
    const directory = outputDirectory(domain.config);
    const expectedNames = ["manifest.json", ...domain.assets.map(({file}) => file)].sort();
    invariant(JSON.stringify((await readdir(directory)).sort()) === JSON.stringify(expectedNames), `${domain.config.frameDomain}: output file set mismatch`);
    invariant((await readFile(path.join(directory, "manifest.json"))).equals(domain.manifestBytes), `${domain.config.frameDomain}: manifest is stale`);
    for (const asset of domain.assets) {
      const bytes = await readFile(path.join(directory, asset.file));
      invariant(sha256(bytes) === asset.sha256 && bytes.length === asset.bytes, `${domain.config.frameDomain}: visual ${asset.visualIndex} drifted`);
    }
  }
  invariant((await readFile(timelineDataPath)).equals(expected.timelineData), "additional-domain timeline data is stale");
}

async function writeOutput(expected) {
  await mkdir(path.dirname(timelineDataPath), {recursive: true});
  for (const domain of expected.domains) {
    const directory = outputDirectory(domain.config);
    await mkdir(directory, {recursive: true});
    const expectedNames = new Set(["manifest.json", ...domain.assets.map(({file}) => file)]);
    const unexpected = (await readdir(directory)).filter((name) => !expectedNames.has(name));
    invariant(unexpected.length === 0, `${domain.config.frameDomain}: refusing unexpected files ${unexpected.join(", ")}`);
    for (const asset of domain.assets) await copyFile(asset.sourcePath, path.join(directory, asset.file));
    await writeFile(path.join(directory, "manifest.json"), domain.manifestBytes);
  }
  await writeFile(timelineDataPath, expected.timelineData);
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellAdditionalDomains({check = false} = {}) {
  const expected = await expectedExport();
  try {
    if (check) await checkOutput(expected);
    else await writeOutput(expected);
    return expected.domains.map(({manifest}) => manifest);
  } finally {
    await rm(expected.tempRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  const manifests = await buildG4L3ShellAdditionalDomains(options);
  const frameCount = manifests.reduce((sum, manifest) => sum + manifest.runtime.frameCount, 0);
  const uniqueVisualCount = manifests.reduce((sum, manifest) => sum + manifest.assets.length, 0);
  console.log(`${options.check ? "Verified" : "Built"} ${manifests.length} additional G4 L3 shell structural domains (${frameCount} frames, ${uniqueVisualCount} visuals).`);
}
