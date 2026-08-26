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
const expectedFfdecVersion = "JPEXS Free Flash Decompiler v.26.2.1";
const frameDomain = "sprite-132";
const sourceCharacterId = 132;
const frameCount = 100;
const exporterCanvas = Object.freeze({width: 500, height: 42});
const exporterLocalOrigin = Object.freeze({x: 371.2, y: 11.5});
const rootPlacementChain = Object.freeze([
  Object.freeze({parentFrameDomain: "root", childFrameDomain: "sprite-135", rootFrame: 1, depth: 5, instanceName: "preloader_mc", translateTwips: Object.freeze({x: 7880, y: 5800}), translatePixels: Object.freeze({x: 394, y: 290})}),
  Object.freeze({parentFrameDomain: "sprite-135", childFrameDomain: frameDomain, parentFrame: 1, depth: 1, instanceName: "progress_mc", translateTwips: Object.freeze({x: 5, y: 395}), translatePixels: Object.freeze({x: 0.25, y: 19.75})}),
]);
const effectiveRootTranslatePixels = Object.freeze({x: 394.25, y: 309.75});
const rootCompositionOffset = Object.freeze({x: 23.05, y: 298.25});
const outputDirectory = path.join(
  projectRoot,
  `public/flash-assets/courses/${animationId}/${frameDomain}`,
);
const timelineDataPath = path.join(
  projectRoot,
  "packages/demos/src/timelines/generated/shell-course-g04-l03-sprite-132-assets.ts",
);

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
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature), `${label}: invalid PNG signature`);
  invariant(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function expectedExport() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-sprite-132-"));
  try {
    const [version, generatorBytes] = await Promise.all([
      execFileAsync("ffdec", ["-help", "export"], {cwd: projectRoot, maxBuffer: 1024 * 1024}),
      readFile(scriptPath),
    ]);
    invariant(`${version.stdout}${version.stderr}`.includes(expectedFfdecVersion), `FFDec version drifted; expected ${expectedFfdecVersion}`);
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
      {cwd: projectRoot, maxBuffer: 16 * 1024 * 1024},
    );
    invariant(sha256(await readFile(sourceSwfPath)) === before, "preserved shell SWF changed during export");
    const exportDirectory = path.join(tempRoot, `DefineSprite_${sourceCharacterId}`);
    const names = (await readdir(exportDirectory)).sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));
    invariant(names.length === frameCount, `expected ${frameCount} frames, found ${names.length}`);
    const frames = [];
    for (let index = 0; index < frameCount; index += 1) {
      const frame = index + 1;
      invariant(names[index] === `${frame}.png`, `${frameDomain}: frame ${frame} filename mismatch`);
      const sourcePath = path.join(exportDirectory, `${frame}.png`);
      const bytes = await readFile(sourcePath);
      const dimensions = pngDimensions(bytes, `${frameDomain} frame ${frame}`);
      invariant(dimensions.width === exporterCanvas.width && dimensions.height === exporterCanvas.height, `${frameDomain}: frame ${frame} dimensions mismatch`);
      frames.push({
        frame,
        file: `frame-${String(frame).padStart(4, "0")}.png`,
        sha256: sha256(bytes),
        bytes: bytes.length,
        ...dimensions,
        sourcePath,
      });
    }
    invariant(new Set(frames.map(({sha256: digest}) => digest)).size === 100, "sprite-132 distinct frame count drifted");
    const manifest = {
      schemaVersion: 1,
      evidenceType: "ffdec-static-nested-timeline-implementation-assets",
      animationId,
      classification: "engineering-structural-inspection-not-strict-acceptance",
      authority: {
        kind: "ffdec-static-nested-timeline-render",
        statement: "These PNGs are a deterministic complete FFDec static export of sprite-132 (progress_mc) frames 1-100 for structural inspection only.",
        authorityBoundary: "This is not original-runtime playback, ActionScript behavior, loading-progress causality, interaction, audio, localization, Replay, full-stage composition parity, RMSE, strict human review, owner acceptance, or strict completion.",
        actionScriptExecuted: false,
        originalRuntimeBaseline: false,
        naturalPlaybackClaimed: false,
      },
      generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: sha256(generatorBytes)},
      tool: {name: "FFDec", version: expectedFfdecVersion},
      source: {swf: sourceSwfRelative, swfSha256: sourceSwfSha256},
      runtime: {
        fps: 12,
        frameDomain,
        sourceCharacterId,
        frameCount,
        frameNumbering: "one-indexed",
        supportedLanguages: ["en", "es"],
        visualLocalizationStatus: "source-static-preloader-progress-visuals",
        spanishTranslationSupplied: false,
      },
      geometry: {
        exporterCanvas,
        exporterLocalOrigin,
        rootPlacementChain,
        effectiveRootTranslatePixels,
        rootCompositionOffset,
        compositionStatus: "source-static-placement-chain-candidate-runtime-unverified",
      },
      frames: frames.map(({sourcePath: _sourcePath, ...frame}) => frame),
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    const timelineData = Buffer.from(
      `// Generated by ${portable(path.relative(projectRoot, scriptPath))}. Do not edit.\n` +
      `// FFDec structural inspection data only; this is not original-runtime evidence.\n\n` +
      `export const COURSE_SHELL_G04_L03_PROGRESS_ASSET_MANIFEST_SHA256 = ${JSON.stringify(sha256(manifestBytes))};\n\n` +
      `export const COURSE_SHELL_G04_L03_PROGRESS_FRAME_ASSETS = Object.freeze(${JSON.stringify(
        frames.map(({sourcePath: _sourcePath, bytes: _bytes, width: _width, height: _height, ...frame}) => frame),
        null,
        2,
      )} as const);\n`,
    );
    return {tempRoot, frames, manifest, manifestBytes, timelineData};
  } catch (error) {
    await rm(tempRoot, {recursive: true, force: true});
    throw error;
  }
}

async function checkOutput(expected) {
  const expectedNames = ["manifest.json", ...expected.frames.map(({file}) => file)].sort();
  invariant(JSON.stringify((await readdir(outputDirectory)).sort()) === JSON.stringify(expectedNames), "progress output file set mismatch");
  invariant((await readFile(path.join(outputDirectory, "manifest.json"))).equals(expected.manifestBytes), "progress manifest is stale");
  invariant((await readFile(timelineDataPath)).equals(expected.timelineData), "progress timeline data is stale");
  for (const frame of expected.frames) {
    const bytes = await readFile(path.join(outputDirectory, frame.file));
    invariant(sha256(bytes) === frame.sha256 && bytes.length === frame.bytes, `progress frame ${frame.frame} drifted`);
  }
}

async function writeOutput(expected) {
  await mkdir(outputDirectory, {recursive: true});
  await mkdir(path.dirname(timelineDataPath), {recursive: true});
  const expectedNames = new Set(["manifest.json", ...expected.frames.map(({file}) => file)]);
  const unexpected = (await readdir(outputDirectory)).filter((name) => !expectedNames.has(name));
  invariant(unexpected.length === 0, `refusing unexpected progress files: ${unexpected.join(", ")}`);
  for (const frame of expected.frames) await copyFile(frame.sourcePath, path.join(outputDirectory, frame.file));
  await writeFile(path.join(outputDirectory, "manifest.json"), expected.manifestBytes);
  await writeFile(timelineDataPath, expected.timelineData);
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellProgressAssets({check = false} = {}) {
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
  const manifest = await buildG4L3ShellProgressAssets(options);
  console.log(`${options.check ? "Verified" : "Built"} ${manifest.frames.length} structural ${frameDomain} assets.`);
}
