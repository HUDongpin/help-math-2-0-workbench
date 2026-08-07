#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

function usage() {
  return `Usage:
  node scripts/reindex-adobe-runtime-capture.mjs --id <animation-id> [options]

Options:
  --old-raw-root <path>   Existing off-by-one raw window captures
  --direct-root <path>    Direct post-Rewind frame-1 captures
  --corrected-root <path> Corrected raw output for the Adobe finalizer
  --archive-root <path>   Full-frame archive root
  --migrations <path>     Migration workspace root
  --help                  Show this help`;
}

export function parseArguments(argv) {
  const options = {
    oldRawRoot: path.join(projectRoot, "work", "animate", "adobe-flash-player-runtime-lossless"),
    directRoot: path.join(projectRoot, "work", "animate", "adobe-flash-player-runtime-direct-frame1"),
    correctedRoot: path.join(projectRoot, "work", "animate", "adobe-flash-player-runtime-lossless-corrected"),
    archiveRoot: path.join(projectRoot, "artifacts", "full-frame", "pilot-baselines"),
    migrationsRoot: path.join(projectRoot, "migrations"),
  };
  const keys = {
    "--id": "id",
    "--old-raw-root": "oldRawRoot",
    "--direct-root": "directRoot",
    "--corrected-root": "correctedRoot",
    "--archive-root": "archiveRoot",
    "--migrations": "migrationsRoot",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (keys[value]) {
      const next = argv[++index];
      if (!next) throw new Error(`${value} requires a value`);
      options[keys[value]] = keys[value] === "id" ? next : path.resolve(next);
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
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

function portable(value) {
  return value.split(path.sep).join("/");
}

async function inspectWindowFrame(candidate, stage, label) {
  const bytes = await readFile(candidate);
  const image = PNG.sync.read(bytes);
  if (image.width !== stage.width || image.height < stage.height) {
    throw new Error(`${label} is ${image.width}x${image.height}; expected width ${stage.width} and height at least ${stage.height}`);
  }
  return {sha256: createHash("sha256").update(bytes).digest("hex"), width: image.width, height: image.height};
}

async function exactFrames(directory, prefix, count) {
  const pattern = new RegExp(`^${prefix}-\\d{4}\\.png$`, "i");
  const entries = (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (entries.length !== count) throw new Error(`${directory}: expected ${count} ${prefix} frames, found ${entries.length}`);
  for (let frame = 1; frame <= count; frame += 1) {
    const expected = `${prefix}-${String(frame).padStart(4, "0")}.png`;
    if (entries[frame - 1] !== expected) throw new Error(`${directory}: missing ${expected}`);
  }
  return entries;
}

export async function reindexAdobeRuntimeCapture(options) {
  if (!options.id) throw new Error("--id is required");
  const workspace = path.join(options.migrationsRoot, options.id);
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  const frameCount = manifest.runtime?.frameCount;
  const stage = manifest.runtime?.stage;
  if (!Number.isInteger(frameCount) || frameCount < 2) throw new Error(`${options.id}: frameCount must be at least 2`);

  const oldRaw = path.join(options.oldRawRoot, options.id);
  const directFrame = path.join(options.directRoot, options.id, "window-frame-0001.png");
  const correctedDirectory = path.join(options.correctedRoot, options.id);
  const standardArchive = path.join(options.archiveRoot, options.id, "adobe-flash-player-32-standalone-default");
  const invalidArchive = path.join(options.archiveRoot, options.id, "adobe-flash-player-32-standalone-default-invalidated-off-by-one");
  const standardReport = path.join(workspace, "baseline", "adobe-flash-player-32-standalone-default.json");
  const invalidReport = path.join(workspace, "baseline", "adobe-flash-player-32-standalone-default.invalidated-off-by-one.json");

  for (const [label, candidate] of [["standard archive", standardArchive], ["standard report", standardReport]]) {
    if (!(await exists(candidate))) throw new Error(`${options.id}: missing ${label}`);
  }
  for (const [label, candidate] of [["corrected raw directory", correctedDirectory], ["invalid archive", invalidArchive], ["invalid report", invalidReport]]) {
    if (await exists(candidate)) throw new Error(`${options.id}: ${label} already exists; inspect it instead of overwriting`);
  }

  const report = JSON.parse(await readFile(standardReport, "utf8"));
  if (report.animationId !== options.id || report.runtime?.frameCount !== frameCount || report.source?.swfSha256 !== manifest.source?.swfSha256) {
    throw new Error(`${options.id}: existing report does not match migration source/runtime`);
  }
  const archiveFrames = await exactFrames(standardArchive, "frame", frameCount);
  for (let index = 0; index < archiveFrames.length; index += 1) {
    const archivedHash = await sha256File(path.join(standardArchive, archiveFrames[index]));
    if (archivedHash !== report.frames?.[index]?.sha256) throw new Error(`${options.id}: archived frame ${index + 1} differs from report`);
  }
  await exactFrames(oldRaw, "window-frame", frameCount);
  const directInspection = await inspectWindowFrame(directFrame, stage, `${options.id} direct frame 1`);

  const temporary = `${correctedDirectory}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(path.dirname(correctedDirectory), {recursive: true});
  await mkdir(temporary, {recursive: false});
  try {
    await copyFile(directFrame, path.join(temporary, "window-frame-0001.png"));
    for (let correctedFrame = 2; correctedFrame <= frameCount; correctedFrame += 1) {
      const oldFrame = correctedFrame - 1;
      await copyFile(
        path.join(oldRaw, `window-frame-${String(oldFrame).padStart(4, "0")}.png`),
        path.join(temporary, `window-frame-${String(correctedFrame).padStart(4, "0")}.png`),
      );
    }
    await exactFrames(temporary, "window-frame", frameCount);
    for (let frame = 1; frame <= frameCount; frame += 1) {
      await inspectWindowFrame(
        path.join(temporary, `window-frame-${String(frame).padStart(4, "0")}.png`),
        stage,
        `${options.id} corrected frame ${frame}`,
      );
    }
    await rename(temporary, correctedDirectory);
  } catch (error) {
    await rm(temporary, {recursive: true, force: true});
    throw error;
  }

  await rename(standardArchive, invalidArchive);
  await rename(standardReport, invalidReport);
  const invalidatedAt = new Date().toISOString();
  report.status = "invalidated-off-by-one-after-rewind";
  report.invalidation = {
    invalidatedAt,
    reason: "Adobe Flash Player Control > Rewind already displays one-indexed frame 1. The original procedure stepped once before every capture, so labeled frame N contained source frame N+1 until the terminal duplicate.",
    proof: "Cross-frame comparison against independent FLA/FFDec frame exports gave the minimum RMSE at implementation frame N+1, including acute_angle labeled frame 33 matching source frame 34.",
    correctedMapping: {
      frame1: "fresh lossless capture immediately after Control > Rewind",
      frames2ToN: "original raw window frame N-1 relabeled as corrected frame N",
      discarded: `original raw window frame ${frameCount} (terminal duplicate)`,
    },
    correctedRawDirectory: portable(path.relative(projectRoot, correctedDirectory)),
  };
  report.capture.archiveDirectory = portable(path.relative(projectRoot, invalidArchive));
  report.authority.captureProtocolInvalidated = report.authority.captureProtocol;
  report.authority.captureProtocol = "INVALID: stepped once after Rewind before labeling frame 1.";
  await writeFile(invalidReport, `${JSON.stringify(report, null, 2)}\n`);

  return {
    id: options.id,
    frameCount,
    directFrame1Sha256: directInspection.sha256,
    correctedDirectory,
    invalidArchive,
    invalidReport,
  };
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    console.log(JSON.stringify(await reindexAdobeRuntimeCapture(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
