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
const outputDirectoryRelative =
  `public/flash-assets/courses/${animationId}/sprite-528`;
const outputDirectory = path.join(projectRoot, outputDirectoryRelative);
const timelineDataRelative =
  "packages/demos/src/timelines/generated/shell-course-g04-l03-sprite-528-assets.ts";
const timelineDataPath = path.join(projectRoot, timelineDataRelative);
const expectedFfdecVersion = "JPEXS Free Flash Decompiler v.26.2.1";
const frameCount = 871;
const sourceTimelineId = "sprite-528";
const sourceCharacterId = 528;
const exporterCanvas = Object.freeze({width: 1463, height: 263});
const exporterLocalOrigin = Object.freeze({x: 1248.05, y: 204.9});
const rootPlacement = Object.freeze({
  rootFrame: 49,
  depth: 423,
  instanceName: "mover_mc",
  transform: Object.freeze({
    scaleX: 1,
    skewX: -0.000091552734375,
    skewY: 0.000091552734375,
    scaleY: 1,
    translateTwips: Object.freeze({x: 11351, y: 8834}),
    translatePixels: Object.freeze({x: 567.55, y: 441.7}),
  }),
});
const rootCompositionOffset = Object.freeze({x: -680.5, y: 236.8});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  invariant(
    bytes.length >= 24 && bytes.subarray(0, 8).equals(signature),
    `${label}: invalid PNG signature`,
  );
  invariant(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function exportSpriteFrames() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-sprite-528-"));
  try {
    const version = await execFileAsync("ffdec", ["-help", "export"], {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024,
    });
    const versionText = `${version.stdout}${version.stderr}`;
    invariant(
      versionText.includes(expectedFfdecVersion),
      `FFDec version drifted; expected ${expectedFfdecVersion}`,
    );
    const before = sha256(await readFile(sourceSwfPath));
    invariant(before === sourceSwfSha256, "preserved shell SWF hash mismatch before export");
    await execFileAsync(
      "ffdec",
      [
        "-format", "sprite:png",
        "-selectid", String(sourceCharacterId),
        "-select", `${sourceCharacterId}:1-${frameCount}`,
        "-onerror", "abort",
        "-export", "sprite", tempRoot, sourceSwfPath,
      ],
      {cwd: projectRoot, maxBuffer: 32 * 1024 * 1024},
    );
    const after = sha256(await readFile(sourceSwfPath));
    invariant(after === before, "preserved shell SWF changed during read-only export");
    const exportDirectory = path.join(tempRoot, `DefineSprite_${sourceCharacterId}`);
    const names = (await readdir(exportDirectory)).sort((left, right) =>
      Number.parseInt(left, 10) - Number.parseInt(right, 10));
    invariant(names.length === frameCount, `expected ${frameCount} sprite frames, found ${names.length}`);

    const uniqueByHash = new Map();
    const frames = [];
    for (let index = 0; index < frameCount; index += 1) {
      const frame = index + 1;
      const sourceFile = `${frame}.png`;
      invariant(names[index] === sourceFile, `sprite frame ${frame} filename mismatch`);
      const sourcePath = path.join(exportDirectory, sourceFile);
      const bytes = await readFile(sourcePath);
      const dimensions = pngDimensions(bytes, `${sourceTimelineId} frame ${frame}`);
      invariant(
        dimensions.width === exporterCanvas.width && dimensions.height === exporterCanvas.height,
        `${sourceTimelineId} frame ${frame} dimensions mismatch`,
      );
      const digest = sha256(bytes);
      let asset = uniqueByHash.get(digest);
      if (!asset) {
        const visualIndex = uniqueByHash.size + 1;
        asset = Object.freeze({
          visualIndex,
          firstFrame: frame,
          file: `visual-${String(visualIndex).padStart(3, "0")}-${digest.slice(0, 12)}.png`,
          sha256: digest,
          bytes: bytes.length,
          ...dimensions,
          sourcePath,
        });
        uniqueByHash.set(digest, asset);
      }
      frames.push(Object.freeze({frame, file: asset.file, sha256: digest}));
    }
    return {tempRoot, assets: [...uniqueByHash.values()], frames};
  } catch (error) {
    await rm(tempRoot, {recursive: true, force: true});
    throw error;
  }
}

async function expectedExport() {
  const [{tempRoot, assets, frames}, generatorBytes] = await Promise.all([
    exportSpriteFrames(),
    readFile(scriptPath),
  ]);
  const manifest = {
    schemaVersion: 1,
    evidenceType: "ffdec-static-nested-timeline-implementation-assets",
    animationId,
    classification: "engineering-structural-inspection-not-strict-acceptance",
    authority: {
      kind: "ffdec-static-nested-timeline-render",
      statement:
        "These deduplicated PNGs and the complete 871-frame lookup are a deterministic FFDec static export of source timeline sprite-528 (root instance mover_mc) for structural inspection only.",
      authorityBoundary:
        "This is not original-runtime playback, ActionScript behavior, hover causality, interaction, audio, localization, Replay, full-stage composition parity, RMSE, strict human review, owner acceptance, or strict completion.",
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      naturalPlaybackClaimed: false,
    },
    generator: {
      path: portable(path.relative(projectRoot, scriptPath)),
      sha256: sha256(generatorBytes),
    },
    tool: {name: "FFDec", version: expectedFfdecVersion},
    source: {swf: sourceSwfRelative, swfSha256: sourceSwfSha256},
    runtime: {
      fps: 12,
      frameDomain: sourceTimelineId,
      sourceCharacterId,
      frameCount,
      frameNumbering: "one-indexed",
      supportedLanguages: ["en", "es"],
      visualLocalizationStatus: "source-static-tooltip-state-visuals",
      spanishTranslationSupplied: false,
    },
    geometry: {
      exporterCanvas,
      exporterLocalOrigin,
      rootPlacement,
      rootCompositionOffset,
      compositionStatus: "source-static-placement-candidate-runtime-unverified",
    },
    deduplication: {
      method: "sha256-identical-png-bytes",
      frameCount,
      uniqueVisualCount: assets.length,
      everyFrameMapped: frames.length === frameCount,
    },
    assets: assets.map(({sourcePath: _sourcePath, ...asset}) => asset),
    frames,
    strictAcceptanceEffect: "none",
  };
  invariant(assets.length === 100, `expected 100 distinct source visuals, found ${assets.length}`);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const visualIndexByFile = new Map(assets.map(({file, visualIndex}) => [file, visualIndex]));
  const runs = [];
  for (const frame of frames) {
    const visualIndex = visualIndexByFile.get(frame.file);
    invariant(Number.isInteger(visualIndex), `missing visual index for ${frame.file}`);
    const previous = runs.at(-1);
    if (previous?.visualIndex === visualIndex) previous.endFrame = frame.frame;
    else runs.push({startFrame: frame.frame, endFrame: frame.frame, visualIndex});
  }
  invariant(runs.length === 100, `expected 100 contiguous visual runs, found ${runs.length}`);
  const timelineData = `// Generated by ${portable(path.relative(projectRoot, scriptPath))}. Do not edit.\n` +
    `// FFDec structural inspection data only; this is not original-runtime evidence.\n\n` +
    `export const COURSE_SHELL_G04_L03_MOVER_ASSET_MANIFEST_SHA256 = ${JSON.stringify(sha256(manifestBytes))};\n\n` +
    `export const COURSE_SHELL_G04_L03_MOVER_VISUAL_ASSETS = Object.freeze(${JSON.stringify(
      assets.map(({sourcePath: _sourcePath, bytes: _bytes, width: _width, height: _height, firstFrame: _firstFrame, ...asset}) => asset),
      null,
      2,
    )} as const);\n\n` +
    `export const COURSE_SHELL_G04_L03_MOVER_VISUAL_RUNS = Object.freeze(${JSON.stringify(runs, null, 2)} as const);\n`;
  return {tempRoot, assets, manifest, manifestBytes, timelineData: Buffer.from(timelineData)};
}

async function checkOutput(expected) {
  const expectedNames = ["manifest.json", ...expected.assets.map(({file}) => file)].sort();
  const actualNames = (await readdir(outputDirectory)).sort();
  invariant(JSON.stringify(actualNames) === JSON.stringify(expectedNames), "mover output file set mismatch");
  const actualManifestBytes = await readFile(path.join(outputDirectory, "manifest.json"));
  invariant(actualManifestBytes.equals(expected.manifestBytes), "mover manifest is stale");
  const actualTimelineData = await readFile(timelineDataPath);
  invariant(actualTimelineData.equals(expected.timelineData), "mover timeline data is stale");
  for (const asset of expected.assets) {
    const bytes = await readFile(path.join(outputDirectory, asset.file));
    invariant(sha256(bytes) === asset.sha256, `public mover visual ${asset.visualIndex} hash mismatch`);
    invariant(bytes.length === asset.bytes, `public mover visual ${asset.visualIndex} byte count mismatch`);
  }
}

async function writeOutput(expected) {
  await mkdir(outputDirectory, {recursive: true});
  await mkdir(path.dirname(timelineDataPath), {recursive: true});
  const expectedNames = new Set(["manifest.json", ...expected.assets.map(({file}) => file)]);
  const unexpected = (await readdir(outputDirectory)).filter((name) => !expectedNames.has(name));
  invariant(
    unexpected.length === 0,
    `refusing to overwrite mover directory with unexpected files: ${unexpected.join(", ")}`,
  );
  for (const asset of expected.assets) {
    await copyFile(asset.sourcePath, path.join(outputDirectory, asset.file));
  }
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    expected.manifestBytes,
  );
  await writeFile(timelineDataPath, expected.timelineData);
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellMoverAssets({check = false} = {}) {
  const expected = await expectedExport();
  try {
    if (check) await checkOutput(expected);
    else await writeOutput(expected);
    return expected.manifest;
  } finally {
    await rm(expected.tempRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  const manifest = await buildG4L3ShellMoverAssets(options);
  console.log(
    `${options.check ? "Verified" : "Built"} ${manifest.frames.length} structural ${sourceTimelineId} frames as ${manifest.assets.length} deduplicated assets for ${animationId}.`,
  );
}
