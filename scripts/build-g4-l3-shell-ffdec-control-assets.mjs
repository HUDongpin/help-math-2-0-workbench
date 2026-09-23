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
const timelineDataRelative =
  "packages/demos/src/timelines/generated/shell-course-g04-l03-control-assets.ts";
const timelineDataPath = path.join(projectRoot, timelineDataRelative);

const domainConfigs = Object.freeze([
  Object.freeze({
    frameDomain: "sprite-302",
    sourceCharacterId: 302,
    sourceInstanceId: "popup",
    frameCount: 149,
    expectedUniqueVisualCount: 20,
    exporterCanvas: Object.freeze({width: 1362, height: 485}),
    exporterLocalOrigin: Object.freeze({x: 1181.2, y: 467.4}),
    rootPlacement: Object.freeze({
      rootFrame: 49,
      depth: 239,
      instanceName: "popup",
      translateTwips: Object.freeze({x: 12375, y: 10111}),
      translatePixels: Object.freeze({x: 618.75, y: 505.55}),
    }),
    rootCompositionOffset: Object.freeze({x: -562.45, y: 38.15}),
  }),
  Object.freeze({
    frameDomain: "sprite-327",
    sourceCharacterId: 327,
    sourceInstanceId: "mouseobj",
    frameCount: 132,
    expectedUniqueVisualCount: 22,
    exporterCanvas: Object.freeze({width: 1398, height: 532}),
    exporterLocalOrigin: Object.freeze({x: 1195.6, y: 467.4}),
    rootPlacement: Object.freeze({
      rootFrame: 49,
      depth: 243,
      instanceName: "mouseobj",
      translateTwips: Object.freeze({x: 12375, y: 12111}),
      translatePixels: Object.freeze({x: 618.75, y: 605.55}),
    }),
    rootCompositionOffset: Object.freeze({x: -576.85, y: 138.15}),
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

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature), `${label}: invalid PNG signature`);
  invariant(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function exportDomain(config, tempRoot) {
  const before = sha256(await readFile(sourceSwfPath));
  invariant(before === sourceSwfSha256, "preserved shell SWF hash mismatch before export");
  await execFileAsync(
    "ffdec",
    [
      "-format", "sprite:png",
      "-selectid", String(config.sourceCharacterId),
      "-select", `${config.sourceCharacterId}:1-${config.frameCount}`,
      "-onerror", "abort",
      "-export", "sprite", tempRoot, sourceSwfPath,
    ],
    {cwd: projectRoot, maxBuffer: 16 * 1024 * 1024},
  );
  invariant(sha256(await readFile(sourceSwfPath)) === before, "preserved shell SWF changed during read-only export");
  const exportDirectory = path.join(tempRoot, `DefineSprite_${config.sourceCharacterId}`);
  const names = (await readdir(exportDirectory)).sort((left, right) =>
    Number.parseInt(left, 10) - Number.parseInt(right, 10));
  invariant(names.length === config.frameCount, `${config.frameDomain}: frame count mismatch`);

  const uniqueByHash = new Map();
  const frames = [];
  for (let index = 0; index < config.frameCount; index += 1) {
    const frame = index + 1;
    const sourceFile = `${frame}.png`;
    invariant(names[index] === sourceFile, `${config.frameDomain}: frame ${frame} filename mismatch`);
    const sourcePath = path.join(exportDirectory, sourceFile);
    const bytes = await readFile(sourcePath);
    const dimensions = pngDimensions(bytes, `${config.frameDomain} frame ${frame}`);
    invariant(
      dimensions.width === config.exporterCanvas.width && dimensions.height === config.exporterCanvas.height,
      `${config.frameDomain}: frame ${frame} dimensions mismatch`,
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
  const assets = [...uniqueByHash.values()];
  invariant(
    assets.length === config.expectedUniqueVisualCount,
    `${config.frameDomain}: expected ${config.expectedUniqueVisualCount} visuals, found ${assets.length}`,
  );
  return {config, assets, frames};
}

function visualRuns(domain) {
  const visualIndexByFile = new Map(domain.assets.map(({file, visualIndex}) => [file, visualIndex]));
  const runs = [];
  for (const frame of domain.frames) {
    const visualIndex = visualIndexByFile.get(frame.file);
    invariant(Number.isInteger(visualIndex), `${domain.config.frameDomain}: missing visual index`);
    const previous = runs.at(-1);
    if (previous?.visualIndex === visualIndex) previous.endFrame = frame.frame;
    else runs.push({startFrame: frame.frame, endFrame: frame.frame, visualIndex});
  }
  invariant(runs.length === domain.assets.length, `${domain.config.frameDomain}: non-contiguous visual reuse drifted`);
  return runs;
}

async function expectedExport() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-control-assets-"));
  try {
    const version = await execFileAsync("ffdec", ["-help", "export"], {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024,
    });
    invariant(
      `${version.stdout}${version.stderr}`.includes(expectedFfdecVersion),
      `FFDec version drifted; expected ${expectedFfdecVersion}`,
    );
    const generatorBytes = await readFile(scriptPath);
    const domains = [];
    for (const config of domainConfigs) {
      const domain = await exportDomain(config, tempRoot);
      const manifest = {
        schemaVersion: 1,
        evidenceType: "ffdec-static-nested-timeline-implementation-assets",
        animationId,
        classification: "engineering-structural-inspection-not-strict-acceptance",
        authority: {
          kind: "ffdec-static-nested-timeline-render",
          statement: `These deduplicated PNGs and the complete ${config.frameCount}-frame lookup are a deterministic FFDec static export of ${config.frameDomain} (${config.sourceInstanceId}) for structural inspection only.`,
          authorityBoundary:
            "This is not original-runtime playback, ActionScript behavior, mouse or hover causality, interaction, audio, localization, Replay, full-stage composition parity, RMSE, strict human review, owner acceptance, or strict completion.",
          actionScriptExecuted: false,
          originalRuntimeBaseline: false,
          naturalPlaybackClaimed: false,
        },
        generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: sha256(generatorBytes)},
        tool: {name: "FFDec", version: expectedFfdecVersion},
        source: {swf: sourceSwfRelative, swfSha256: sourceSwfSha256},
        runtime: {
          fps: 12,
          frameDomain: config.frameDomain,
          sourceCharacterId: config.sourceCharacterId,
          frameCount: config.frameCount,
          frameNumbering: "one-indexed",
          supportedLanguages: ["en", "es"],
          visualLocalizationStatus: "source-static-control-tooltip-state-visuals",
          spanishTranslationSupplied: false,
        },
        geometry: {
          exporterCanvas: config.exporterCanvas,
          exporterLocalOrigin: config.exporterLocalOrigin,
          rootPlacement: config.rootPlacement,
          rootCompositionOffset: config.rootCompositionOffset,
          compositionStatus: "source-static-placement-candidate-runtime-unverified",
        },
        deduplication: {
          method: "sha256-identical-png-bytes",
          frameCount: config.frameCount,
          uniqueVisualCount: domain.assets.length,
          everyFrameMapped: domain.frames.length === config.frameCount,
        },
        assets: domain.assets.map(({sourcePath: _sourcePath, ...asset}) => asset),
        frames: domain.frames,
        strictAcceptanceEffect: "none",
      };
      const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
      domains.push({...domain, manifest, manifestBytes, manifestSha256: sha256(manifestBytes), runs: visualRuns(domain)});
    }
    const data = Object.fromEntries(domains.map((domain) => [domain.config.frameDomain, {
      assetManifestSha256: domain.manifestSha256,
      assets: domain.assets.map(({sourcePath: _sourcePath, bytes: _bytes, width: _width, height: _height, firstFrame: _firstFrame, ...asset}) => asset),
      runs: domain.runs,
    }]));
    const timelineData = Buffer.from(
      `// Generated by ${portable(path.relative(projectRoot, scriptPath))}. Do not edit.\n` +
      `// FFDec structural inspection data only; this is not original-runtime evidence.\n\n` +
      `export const COURSE_SHELL_G04_L03_CONTROL_DOMAIN_DATA = Object.freeze(${JSON.stringify(data, null, 2)} as const);\n`,
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
  invariant((await readFile(timelineDataPath)).equals(expected.timelineData), "control timeline data is stale");
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

export async function buildG4L3ShellControlAssets({check = false} = {}) {
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
  const manifests = await buildG4L3ShellControlAssets(options);
  console.log(`${options.check ? "Verified" : "Built"} ${manifests.length} G4 L3 structural control domains (${manifests.map(({runtime, assets}) => `${runtime.frameDomain}:${runtime.frameCount}/${assets.length}`).join(", ")}).`);
}
