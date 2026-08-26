#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {mkdir, readFile, readdir, rename, rm, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultInputRoot = path.join(projectRoot, "work", "animate", "adobe-flash-player-runtime-lossless");
const defaultArchiveRoot = path.join(projectRoot, "artifacts", "full-frame", "pilot-baselines");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const preservedSourceRoot = path.join(projectRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");

function usage() {
  return `Usage:
  node scripts/finalize-adobe-runtime-capture.mjs --id <animation-id> [options]

Options:
  --input-root <path>       Raw Computer Use window captures
  --archive-root <path>     Ignored full-frame archive root
  --migrations <path>       Migration workspace root
  --player-version <value>  Adobe Flash Player version (default: 32.0.0.414)
  --scenario <value>        Runtime scenario (default: standalone-default)
  --lang <value>            Visible language context (default: en)
  --allow-partial           Preserve a runtime-confirmed prefix when stepping becomes unavailable
  --stop-reason <text>      Required runtime observation when --allow-partial is used
  --supersede <tag>         Preserve and invalidate existing evidence before rebuilding
  --supersede-reason <text> Required explanation when --supersede is used
  --help                    Show this help`;
}

export function parseArguments(argumentsList) {
  const options = {
    inputRoot: defaultInputRoot,
    archiveRoot: defaultArchiveRoot,
    migrationsRoot: defaultMigrationsRoot,
    playerVersion: "32.0.0.414",
    scenario: "standalone-default",
    lang: "en",
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--allow-partial") options.allowPartial = true;
    else if (["--id", "--input-root", "--archive-root", "--migrations", "--player-version", "--scenario", "--lang", "--stop-reason", "--supersede", "--supersede-reason"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.id = next;
      else if (value === "--input-root") options.inputRoot = path.resolve(next);
      else if (value === "--archive-root") options.archiveRoot = path.resolve(next);
      else if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--player-version") options.playerVersion = next;
      else if (value === "--scenario") options.scenario = next;
      else if (value === "--stop-reason") options.stopReason = next;
      else if (value === "--supersede") options.supersede = next;
      else if (value === "--supersede-reason") options.supersedeReason = next;
      else options.lang = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

export function cropStageFromWindow(windowPng, stage) {
  if (!Number.isInteger(stage?.width) || !Number.isInteger(stage?.height)) {
    throw new Error("Stage dimensions must be positive integers");
  }
  if (windowPng.width !== stage.width || windowPng.height < stage.height) {
    throw new Error(
      `Window capture is ${windowPng.width}x${windowPng.height}; expected width ${stage.width} and height at least ${stage.height}`,
    );
  }
  const offsetY = windowPng.height - stage.height;
  const stagePng = new PNG({width: stage.width, height: stage.height});
  for (let row = 0; row < stage.height; row += 1) {
    const sourceStart = ((row + offsetY) * windowPng.width) * 4;
    const sourceEnd = sourceStart + stage.width * 4;
    const targetStart = row * stage.width * 4;
    windowPng.data.copy(stagePng.data, targetStart, sourceStart, sourceEnd);
  }
  return {image: stagePng, crop: {x: 0, y: offsetY, width: stage.width, height: stage.height}};
}

export function parseBackgroundColor(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value || ""));
  if (!match) throw new Error(`Background color must be #RRGGBB, received ${value}`);
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
}

export function compositeAgainstBackground(image, backgroundColor) {
  const [red, green, blue] = parseBackgroundColor(backgroundColor);
  const output = new PNG({width: image.width, height: image.height});
  for (let index = 0; index < image.data.length; index += 4) {
    const alpha = image.data[index + 3] / 255;
    output.data[index] = Math.round(image.data[index] * alpha + red * (1 - alpha));
    output.data[index + 1] = Math.round(image.data[index + 1] * alpha + green * (1 - alpha));
    output.data[index + 2] = Math.round(image.data[index + 2] * alpha + blue * (1 - alpha));
    output.data[index + 3] = 255;
  }
  return output;
}

async function inspectStageFrames(directory, frameCount, stage) {
  const entries = (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && /^frame-\d{4}\.png$/i.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (entries.length !== frameCount) throw new Error(`Expected ${frameCount} stage frames, found ${entries.length}`);
  const frames = [];
  for (let frame = 1; frame <= frameCount; frame += 1) {
    const file = `frame-${String(frame).padStart(4, "0")}.png`;
    if (entries[frame - 1]?.name !== file) throw new Error(`Missing stage frame ${frame}`);
    const bytes = await readFile(path.join(directory, file));
    const image = PNG.sync.read(bytes);
    if (image.width !== stage.width || image.height !== stage.height) {
      throw new Error(`${file} is ${image.width}x${image.height}; expected ${stage.width}x${stage.height}`);
    }
    frames.push({
      frame,
      file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      width: image.width,
      height: image.height,
    });
  }
  return frames;
}

export async function finalizeAdobeRuntimeCapture(options) {
  if (!options.id) throw new Error("--id is required");
  if (options.allowPartial && !String(options.stopReason || "").trim()) {
    throw new Error("--stop-reason is required with --allow-partial");
  }
  if (options.supersede && !/^[a-z0-9][a-z0-9-]*$/.test(options.supersede)) throw new Error("--supersede must be a lowercase safe tag");
  if (options.supersede && !String(options.supersedeReason || "").trim()) throw new Error("--supersede-reason is required with --supersede");
  const workspace = path.join(options.migrationsRoot, options.id);
  const manifestPath = path.join(workspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.animationId !== options.id) throw new Error(`${options.id}: animationId does not match directory`);
  const stage = manifest.runtime?.stage;
  const frameCount = manifest.runtime?.frameCount;
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new Error(`${options.id}: invalid frameCount`);
  const sourcePath = path.resolve(projectRoot, manifest.source?.swf || "");
  if (!isInside(sourcePath, preservedSourceRoot)) throw new Error(`${options.id}: source SWF is outside the preserved archive`);
  const sourceHashBefore = await sha256File(sourcePath);
  if (sourceHashBefore !== manifest.source.swfSha256) throw new Error(`${options.id}: source SWF hash differs from manifest`);

  const rawDirectory = path.join(options.inputRoot, options.id);
  const rawEntries = (await readdir(rawDirectory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && /^window-frame-\d{4}\.png$/i.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (rawEntries.length > frameCount) throw new Error(`${options.id}: expected at most ${frameCount} raw window frames, found ${rawEntries.length}`);
  const isPartial = rawEntries.length !== frameCount;
  if (isPartial && !options.allowPartial) throw new Error(`${options.id}: expected ${frameCount} raw window frames, found ${rawEntries.length}`);
  if (isPartial && rawEntries.length < 1) throw new Error(`${options.id}: a partial capture must contain at least one frame`);
  if (options.allowPartial && !isPartial) throw new Error(`${options.id}: --allow-partial was supplied but all ${frameCount} frames exist`);
  const capturedFrameCount = rawEntries.length;

  const evidenceSuffix = isPartial ? "adobe-flash-player-32-standalone-default-partial" : "adobe-flash-player-32-standalone-default";
  const archiveDirectory = path.join(options.archiveRoot, options.id, evidenceSuffix);
  const reportPath = path.join(workspace, "baseline", `${evidenceSuffix}.json`);
  if ((await exists(archiveDirectory)) || (await exists(reportPath))) {
    if (!(await exists(archiveDirectory)) || !(await exists(reportPath))) {
      throw new Error(`${options.id}: partial Adobe runtime evidence exists; inspect it instead of overwriting`);
    }
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    if (report.source?.swfSha256 !== sourceHashBefore || report.runtime?.frameCount !== frameCount) {
      throw new Error(`${options.id}: existing Adobe runtime evidence belongs to different source/runtime metadata`);
    }
    const existingCapturedFrameCount = report.runtime?.capturedFrameCount || frameCount;
    const frames = await inspectStageFrames(archiveDirectory, existingCapturedFrameCount, stage);
    for (const [index, frame] of frames.entries()) {
      if (frame.sha256 !== report.frames?.[index]?.sha256) {
        throw new Error(`${options.id}: archived Adobe runtime frame ${frame.frame} hash differs from report`);
      }
    }
    if (!options.supersede) return {id: options.id, action: "verified-existing", frameCount, capturedFrameCount: existingCapturedFrameCount, archiveDirectory, reportPath};
    const invalidArchive = `${archiveDirectory}-invalidated-${options.supersede}`;
    const invalidReport = reportPath.replace(/\.json$/, `.invalidated-${options.supersede}.json`);
    if ((await exists(invalidArchive)) || (await exists(invalidReport))) {
      throw new Error(`${options.id}: superseded evidence target already exists for ${options.supersede}`);
    }
    await rename(archiveDirectory, invalidArchive);
    await rename(reportPath, invalidReport);
    report.status = `invalidated-${options.supersede}`;
    report.invalidation = {
      invalidatedAt: new Date().toISOString(),
      tag: options.supersede,
      reason: options.supersedeReason,
    };
    report.capture.archiveDirectory = portable(path.relative(projectRoot, invalidArchive));
    await writeFile(invalidReport, `${JSON.stringify(report, null, 2)}\n`);
  }

  await mkdir(path.dirname(archiveDirectory), {recursive: true});
  const temporaryDirectory = path.join(path.dirname(archiveDirectory), `.tmp-adobe-${process.pid}-${Date.now()}`);
  await mkdir(temporaryDirectory, {recursive: false});
  let crop = null;
  try {
    for (let frame = 1; frame <= capturedFrameCount; frame += 1) {
      const expectedInput = `window-frame-${String(frame).padStart(4, "0")}.png`;
      if (rawEntries[frame - 1]?.name !== expectedInput) throw new Error(`${options.id}: missing raw window frame ${frame}`);
      const windowImage = PNG.sync.read(await readFile(path.join(rawDirectory, expectedInput)));
      const current = cropStageFromWindow(windowImage, stage);
      if (!crop) crop = current.crop;
      else if (JSON.stringify(crop) !== JSON.stringify(current.crop)) throw new Error(`${options.id}: inconsistent window chrome crop`);
      const output = `frame-${String(frame).padStart(4, "0")}.png`;
      const composited = compositeAgainstBackground(current.image, manifest.runtime.backgroundColor);
      await writeFile(path.join(temporaryDirectory, output), PNG.sync.write(composited));
    }
    const frames = await inspectStageFrames(temporaryDirectory, capturedFrameCount, stage);
    const sourceHashAfter = await sha256File(sourcePath);
    if (sourceHashAfter !== sourceHashBefore) throw new Error(`${options.id}: preserved SWF changed during finalization`);
    await rename(temporaryDirectory, archiveDirectory);
    const report = {
      schemaVersion: 1,
      animationId: options.id,
      status: isPartial ? "partial-authoritative-standalone-runtime-baseline" : "authoritative-standalone-runtime-baseline",
      generatedAt: new Date().toISOString(),
      authority: {
        kind: "original-swf-adobe-flash-player-runtime",
        tool: `Adobe Flash Player ${options.playerVersion}`,
        captureProtocol: "Control > Rewind and capture one-indexed frame 1 directly; for frames 2..N, invoke Control > Step Forward once before each lossless capture. Command-Right was tested and rejected because it did not advance this player.",
        statement: "Each PNG is captured from the untouched source SWF executing in Adobe's standalone Flash Player.",
        limitations: [
          "This scenario is standalone playback and does not reconstruct parent-movie variables or LMS/application host state.",
          "Interactive branches not traversed in this scenario require separate scenario captures.",
          "Audio hashes and synchronization require separate evidence in addition to silent PNG frames.",
          ...(isPartial ? [`Runtime stepping stopped after frame ${capturedFrameCount}: ${options.stopReason}`] : []),
        ],
      },
      source: {
        swf: portable(path.relative(projectRoot, sourcePath)),
        swfSha256: sourceHashBefore,
      },
      runtime: {
        stage,
        fps: manifest.runtime.fps,
        frameCount,
        capturedFrameCount,
        completeRootTimeline: !isPartial,
        scenario: options.scenario,
        lang: options.lang,
      },
      capture: {
        rawDirectory: portable(path.relative(projectRoot, rawDirectory)),
        archiveDirectory: portable(path.relative(projectRoot, archiveDirectory)),
        windowCrop: crop,
        frameControl: "deterministic-step",
        imageEncoding: "lossless PNG from macOS screencapture -x -o -l",
        alphaComposite: {
          reason: "macOS rounded-window masking makes the bottom stage corners transparent in window captures; those OS pixels are composited against the SWF-declared background rather than treated as Flash content.",
          backgroundColor: manifest.runtime.backgroundColor,
          outputAlpha: 255,
        },
      },
      frames,
    };
    await mkdir(path.dirname(reportPath), {recursive: true});
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    return {id: options.id, action: "finalized", frameCount, capturedFrameCount, archiveDirectory, reportPath};
  } catch (error) {
    await rm(temporaryDirectory, {recursive: true, force: true});
    throw error;
  }
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await finalizeAdobeRuntimeCapture(options);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
