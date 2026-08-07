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
  `public/flash-assets/courses/${animationId}/sprite-1011`;
const outputDirectory = path.join(projectRoot, outputDirectoryRelative);
const expectedFfdecVersion = "JPEXS Free Flash Decompiler v.26.2.1";
const frameCount = 48;
const sourceTimelineId = "sprite-1011";
const sourceCharacterId = 1011;
const exporterCanvas = Object.freeze({width: 1368, height: 719});
const exporterLocalOrigin = Object.freeze({x: 726.8, y: 671.5});
const rootPlacement = Object.freeze({
  rootFrame: 50,
  depth: 263,
  instanceName: "m1_l1",
  translateTwips: Object.freeze({x: 4803, y: 10908}),
  translatePixels: Object.freeze({x: 240.15, y: 545.4}),
});
const rootCompositionOffset = Object.freeze({x: -486.65, y: -126.1});

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
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-sprite-1011-"));
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
      {cwd: projectRoot, maxBuffer: 16 * 1024 * 1024},
    );
    const after = sha256(await readFile(sourceSwfPath));
    invariant(after === before, "preserved shell SWF changed during read-only export");
    const exportDirectory = path.join(tempRoot, `DefineSprite_${sourceCharacterId}`);
    const names = (await readdir(exportDirectory)).sort((left, right) =>
      Number.parseInt(left, 10) - Number.parseInt(right, 10));
    invariant(names.length === frameCount, `expected ${frameCount} sprite frames, found ${names.length}`);
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
      frames.push({
        sourcePath,
        output: {
          frame,
          file: `frame-${String(frame).padStart(4, "0")}.png`,
          sha256: sha256(bytes),
          bytes: bytes.length,
          ...dimensions,
        },
      });
    }
    return {tempRoot, frames};
  } catch (error) {
    await rm(tempRoot, {recursive: true, force: true});
    throw error;
  }
}

async function expectedExport() {
  const [{tempRoot, frames}, generatorBytes] = await Promise.all([
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
        "These PNGs are a deterministic FFDec static export of source timeline sprite-1011 and permit nested timeline structural inspection only.",
      authorityBoundary:
        "This is not original-runtime playback, ActionScript behavior, interaction, audio, localization, Replay, full-frame composition parity, RMSE, strict human review, owner acceptance, or strict completion.",
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
      visualLocalizationStatus: "source-shared-untranslated-visual",
      spanishTranslationSupplied: false,
    },
    geometry: {
      exporterCanvas,
      exporterLocalOrigin,
      rootPlacement,
      rootCompositionOffset,
      compositionStatus: "source-static-placement-candidate-runtime-unverified",
    },
    frames: frames.map(({output}) => output),
    strictAcceptanceEffect: "none",
  };
  return {tempRoot, frames, manifest};
}

async function checkOutput(expected) {
  const expectedManifestBytes = Buffer.from(`${JSON.stringify(expected.manifest, null, 2)}\n`);
  const expectedNames = ["manifest.json", ...expected.frames.map(({output}) => output.file)].sort();
  const actualNames = (await readdir(outputDirectory)).sort();
  invariant(JSON.stringify(actualNames) === JSON.stringify(expectedNames), "nested timeline output file set mismatch");
  const actualManifestBytes = await readFile(path.join(outputDirectory, "manifest.json"));
  invariant(actualManifestBytes.equals(expectedManifestBytes), "nested timeline manifest is stale");
  for (const {output} of expected.frames) {
    const bytes = await readFile(path.join(outputDirectory, output.file));
    invariant(sha256(bytes) === output.sha256, `public sprite frame ${output.frame} hash mismatch`);
    invariant(bytes.length === output.bytes, `public sprite frame ${output.frame} byte count mismatch`);
  }
}

async function writeOutput(expected) {
  await mkdir(outputDirectory, {recursive: true});
  const expectedNames = new Set(["manifest.json", ...expected.frames.map(({output}) => output.file)]);
  const unexpected = (await readdir(outputDirectory)).filter((name) => !expectedNames.has(name));
  invariant(
    unexpected.length === 0,
    `refusing to overwrite nested timeline directory with unexpected files: ${unexpected.join(", ")}`,
  );
  for (const {sourcePath, output} of expected.frames) {
    await copyFile(sourcePath, path.join(outputDirectory, output.file));
  }
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(expected.manifest, null, 2)}\n`,
    "utf8",
  );
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellNativeMenuAssets({check = false} = {}) {
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
  const manifest = await buildG4L3ShellNativeMenuAssets(options);
  console.log(
    `${options.check ? "Verified" : "Built"} ${manifest.frames.length} structural ${sourceTimelineId} assets for ${animationId}.`,
  );
}
