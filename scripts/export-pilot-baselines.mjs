#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultArchiveRoot = path.join(projectRoot, "artifacts", "full-frame", "pilot-baselines");
const defaultLessonReleasesPath = path.join(projectRoot, "catalog", "lesson-releases.json");
const preservedSourceRoot = path.join(projectRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
const SAFE_CATALOG_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RASTERIZATION_RULE = "ceil-positive-native-stage-dimensions";

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
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

function run(command, argumentsList, {timeoutMs = 600_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd: projectRoot,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

export function parseArguments(argumentsList) {
  const options = {
    archiveRoot: defaultArchiveRoot,
    migrationsRoot: defaultMigrationsRoot,
    ffdec: "ffdec",
    ids: [],
    releaseId: "",
    dryRun: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (["--archive", "--migrations", "--ffdec", "--ids", "--release-id"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--archive") options.archiveRoot = path.resolve(next);
      else if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--ffdec") options.ffdec = next;
      else if (value === "--ids") {
        if (options.ids.length) throw new Error("--ids must not be repeated");
        options.ids = next.split(",").map((item) => item.trim()).filter(Boolean);
        if (!options.ids.length) throw new Error("--ids requires at least one animation ID");
      } else {
        if (options.releaseId) throw new Error("--release-id must not be repeated");
        options.releaseId = next;
      }
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.releaseId && options.ids.length) throw new Error("--release-id and --ids are mutually exclusive");
  return options;
}

function assertSafeCatalogId(value, label) {
  if (typeof value !== "string" || !SAFE_CATALOG_ID.test(value)) {
    throw new Error(`${label} is malformed`);
  }
}

function assertSafeCatalogSwfPath(value, label) {
  if (
    typeof value !== "string" ||
    !value.endsWith(".swf") ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    value.split("/").includes("..") ||
    path.posix.normalize(value) !== value
  ) {
    throw new Error(`${label} is unsafe`);
  }
}

function catalogRelativeSourcePath(value) {
  if (typeof value !== "string") return "";
  const normalized = portable(value);
  const marker = "HELP MATH_ORIGINAL FILES/";
  const markerIndex = normalized.indexOf(marker);
  return markerIndex >= 0 ? normalized.slice(markerIndex + marker.length) : normalized;
}

export function selectLessonReleaseBaselineMembers(releaseDocument, {releaseId = ""} = {}) {
  assertSafeCatalogId(releaseId, "Release ID");
  if (releaseDocument?.schemaVersion !== 1 || !Array.isArray(releaseDocument.releases)) {
    throw new Error("Lesson-release catalog must be schemaVersion 1 with a releases array");
  }
  const releases = releaseDocument.releases.filter((release) => release?.releaseId === releaseId);
  if (releases.length !== 1) {
    throw new Error(releases.length ? `Lesson release ID is duplicated: ${releaseId}` : `Unknown lesson release: ${releaseId}`);
  }
  const release = releases[0];
  if (release.publicationMode !== "atomic") {
    throw new Error(`${releaseId}: publicationMode must remain atomic`);
  }
  if (
    !Number.isSafeInteger(release.expectedCounts?.members) ||
    release.expectedCounts.members < 1 ||
    !Array.isArray(release.members) ||
    release.members.length !== release.expectedCounts.members
  ) {
    throw new Error(`${releaseId}: expected member count does not match members`);
  }
  if (
    !Number.isSafeInteger(release.expectedCounts?.shards) ||
    release.expectedCounts.shards < 1 ||
    !Array.isArray(release.shards) ||
    release.shards.length !== release.expectedCounts.shards
  ) {
    throw new Error(`${releaseId}: expected shard count does not match shards`);
  }

  const shardIds = release.shards.map((shard) => shard?.shardId);
  for (const shardId of shardIds) assertSafeCatalogId(shardId, `${releaseId} shardId`);
  if (new Set(shardIds).size !== shardIds.length) throw new Error(`${releaseId}: shard IDs must be unique`);
  const knownShards = new Set(shardIds);
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    if (member?.ordinal !== index + 1) {
      throw new Error(`${releaseId}: member ordinals must be the exact contiguous release order`);
    }
    assertSafeCatalogId(member.animationId, `${releaseId} member animationId`);
    if (animationIds.has(member.animationId)) throw new Error(`${releaseId}: duplicate member animationId ${member.animationId}`);
    animationIds.add(member.animationId);
    if (!/^[a-f0-9]{64}$/.test(member.source?.sha256 || "")) {
      throw new Error(`${member.animationId}: source SHA-256 is malformed`);
    }
    if (member.assetId !== `swf-${member.source.sha256}`) {
      throw new Error(`${member.animationId}: assetId does not match source SHA-256`);
    }
    if (assetIds.has(member.assetId)) throw new Error(`${releaseId}: duplicate member assetId ${member.assetId}`);
    assetIds.add(member.assetId);
    assertSafeCatalogSwfPath(member.source?.path, `${member.animationId} source path`);
    if (!knownShards.has(member.shardId)) throw new Error(`${member.animationId}: unknown shard ${member.shardId}`);
  }
  for (const shard of release.shards) {
    const actualCount = release.members.filter((member) => member.shardId === shard.shardId).length;
    if (shard.memberCount !== actualCount) {
      throw new Error(`${releaseId}/${shard.shardId}: declared memberCount does not match ${actualCount}`);
    }
  }
  return release.members;
}

export function verifyManifestReleaseBinding(manifest, member) {
  if (manifest?.animationId !== member.animationId || manifest?.id !== member.animationId) {
    throw new Error(`${member.animationId}: workspace identity does not match the release member`);
  }
  if (manifest.assetId !== member.assetId) {
    throw new Error(`${member.animationId}: workspace assetId does not match the release member`);
  }
  if (manifest.source?.swfSha256 !== member.source.sha256) {
    throw new Error(`${member.animationId}: workspace SWF hash does not match the release member`);
  }
  if (catalogRelativeSourcePath(manifest.source?.swf) !== member.source.path) {
    throw new Error(`${member.animationId}: workspace SWF path does not match the release member`);
  }
  if (catalogRelativeSourcePath(manifest.source?.placementPath) !== member.source.path) {
    throw new Error(`${member.animationId}: workspace placement path does not match the release member`);
  }
  return true;
}

export function rasterDimensionsForStage(stage) {
  if (
    !Number.isFinite(stage?.width) ||
    !Number.isFinite(stage?.height) ||
    stage.width <= 0 ||
    stage.height <= 0
  ) {
    throw new Error("stage width and height must be finite positive numbers");
  }
  return {
    width: Math.ceil(stage.width),
    height: Math.ceil(stage.height),
  };
}

export function ffdecFrameArguments({frameCount, outputDirectory, swfPath}) {
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new Error("frameCount must be a positive integer");
  return [
    "-format", "frame:png",
    "-select", `1-${frameCount}`,
    "-onerror", "abort",
    "-export", "frame",
    outputDirectory,
    swfPath,
  ];
}

export async function inspectFrameDirectory(directory, {frameCount, stage}) {
  const rasterDimensions = rasterDimensionsForStage(stage);
  const entries = (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && /^\d+\.png$/i.test(entry.name))
    .map((entry) => ({entry, frame: Number.parseInt(entry.name, 10)}))
    .sort((left, right) => left.frame - right.frame);
  if (entries.length !== frameCount) {
    throw new Error(`Expected ${frameCount} root frame PNGs, found ${entries.length}`);
  }
  const frames = [];
  for (let expected = 1; expected <= frameCount; expected += 1) {
    const current = entries[expected - 1];
    if (current.frame !== expected) throw new Error(`Missing root frame ${expected}`);
    const candidate = path.join(directory, current.entry.name);
    const bytes = await readFile(candidate);
    const image = PNG.sync.read(bytes);
    if (image.width !== rasterDimensions.width || image.height !== rasterDimensions.height) {
      throw new Error(
        `Frame ${expected} is ${image.width}x${image.height}; expected ${rasterDimensions.width}x${rasterDimensions.height} ` +
        `by ${RASTERIZATION_RULE} for native stage ${stage.width}x${stage.height}`,
      );
    }
    frames.push({
      frame: expected,
      file: current.entry.name,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      width: image.width,
      height: image.height,
    });
  }
  return frames;
}

async function ffdecVersion(command) {
  const {stdout, stderr} = await run(command, ["-help"], {timeoutMs: 30_000});
  const first = `${stdout}\n${stderr}`.split(/\r?\n/).find((line) => /JPEXS Free Flash Decompiler/i.test(line));
  if (!first) throw new Error("Could not determine FFDec version");
  return first.trim();
}

async function validateExisting({archiveDirectory, reportPath, manifest}) {
  if (!(await exists(archiveDirectory)) || !(await exists(reportPath))) return null;
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  if (
    report.source?.swfSha256 !== manifest.source.swfSha256 ||
    report.runtime?.frameCount !== manifest.runtime.frameCount ||
    report.runtime?.stage?.width !== manifest.runtime.stage.width ||
    report.runtime?.stage?.height !== manifest.runtime.stage.height
  ) {
    throw new Error(`${manifest.animationId}: existing baseline belongs to different source/runtime evidence`);
  }
  const frames = await inspectFrameDirectory(archiveDirectory, {
    frameCount: manifest.runtime.frameCount,
    stage: manifest.runtime.stage,
  });
  for (const [index, frame] of frames.entries()) {
    if (frame.sha256 !== report.frames?.[index]?.sha256) {
      throw new Error(`${manifest.animationId}: existing baseline frame ${frame.frame} hash differs from report`);
    }
  }
  return report;
}

async function loadManifests(migrationsRoot, selectedIds, releaseMembers = new Map()) {
  const selected = new Set(selectedIds);
  const discoveredDirectories = (await readdir(migrationsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory() && (!selected.size || selected.has(entry.name)));
  let directories = discoveredDirectories.sort((left, right) => compareText(left.name, right.name));
  if (selected.size) {
    const byName = new Map(directories.map((entry) => [entry.name, entry]));
    const found = new Set(byName.keys());
    const missing = [...selected].filter((id) => !found.has(id));
    if (missing.length) throw new Error(`Unknown migration ID(s): ${missing.join(", ")}`);
    directories = selectedIds.map((id) => byName.get(id));
  }
  return Promise.all(directories.map(async (entry) => {
    const workspace = path.join(migrationsRoot, entry.name);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestInformation = await lstat(manifestPath);
    if (!manifestInformation.isFile() || manifestInformation.isSymbolicLink()) {
      throw new Error(`${entry.name}: migration.json must be a regular non-symlink file`);
    }
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.animationId !== entry.name) throw new Error(`${entry.name}: animationId does not match directory`);
    const member = releaseMembers.get(entry.name);
    if (member) verifyManifestReleaseBinding(manifest, member);
    return {workspace, manifest};
  }));
}

async function readLessonReleaseDocument(candidate) {
  const absolutePath = path.resolve(candidate);
  if (!isInside(absolutePath, projectRoot)) throw new Error("Lesson-release catalog must stay inside the project root");
  const information = await lstat(absolutePath);
  if (!information.isFile() || information.isSymbolicLink()) {
    throw new Error("Lesson-release catalog must be a regular non-symlink file");
  }
  const resolvedPath = await realpath(absolutePath);
  if (!isInside(resolvedPath, projectRoot)) throw new Error("Lesson-release catalog resolves outside the project root");
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

export async function exportPilotBaselines(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const archiveRoot = path.resolve(options.archiveRoot || defaultArchiveRoot);
  const ffdec = options.ffdec || "ffdec";
  let selectedIds = options.ids || [];
  const releaseId = options.releaseId || "";
  const dryRun = Boolean(options.dryRun);
  if (!Array.isArray(selectedIds)) throw new Error("ids must be an array");
  if (releaseId && selectedIds.length) throw new Error("releaseId and explicit ids are mutually exclusive");
  if (new Set(selectedIds).size !== selectedIds.length) throw new Error("Baseline animation IDs must not be repeated");
  for (const id of selectedIds) assertSafeCatalogId(id, "Baseline animation ID");
  if (isInside(archiveRoot, preservedSourceRoot)) throw new Error("Baseline archive must not be inside the preserved source tree");
  let releaseMembers = new Map();
  if (releaseId) {
    const releaseDocument = await readLessonReleaseDocument(options.lessonReleasesPath || defaultLessonReleasesPath);
    const members = selectLessonReleaseBaselineMembers(releaseDocument, {releaseId});
    selectedIds = members.map(({animationId}) => animationId);
    releaseMembers = new Map(members.map((member) => [member.animationId, member]));
  }
  const items = await loadManifests(migrationsRoot, selectedIds, releaseMembers);
  const version = dryRun ? "not-invoked-during-dry-run" : await ffdecVersion(ffdec);
  const results = [];

  for (const {workspace, manifest} of items) {
    const id = manifest.animationId;
    const swfPath = path.resolve(projectRoot, manifest.source?.swf || "");
    if (!isInside(swfPath, preservedSourceRoot)) throw new Error(`${id}: SWF is outside the preserved archive`);
    if (!(await exists(swfPath))) throw new Error(`${id}: SWF source is missing`);
    const swfInformation = await lstat(swfPath);
    if (!swfInformation.isFile() || swfInformation.isSymbolicLink()) {
      throw new Error(`${id}: SWF source must be a regular non-symlink file`);
    }
    if (!isInside(await realpath(swfPath), preservedSourceRoot)) throw new Error(`${id}: SWF resolves outside the preserved archive`);
    if (!/^[a-f0-9]{64}$/.test(manifest.source?.swfSha256 || "")) throw new Error(`${id}: manifest SWF SHA-256 is invalid`);
    if (!Number.isInteger(manifest.runtime?.frameCount) || manifest.runtime.frameCount < 1) throw new Error(`${id}: invalid frameCount`);
    let rasterDimensions;
    try {
      rasterDimensions = rasterDimensionsForStage(manifest.runtime?.stage);
    } catch {
      throw new Error(`${id}: invalid stage`);
    }
    const sourceHashBefore = await sha256File(swfPath);
    if (sourceHashBefore !== manifest.source.swfSha256) throw new Error(`${id}: source hash differs from manifest`);
    const archiveDirectory = path.join(archiveRoot, id, "ffdec-root-frames");
    const reportPath = path.join(workspace, "baseline", "ffdec-root-frames.json");
    if (dryRun) {
      results.push({id, action: "would-export", frameCount: manifest.runtime.frameCount, archiveDirectory});
      continue;
    }
    const existing = await validateExisting({archiveDirectory, reportPath, manifest});
    if (existing) {
      results.push({id, action: "verified-existing", frameCount: existing.frames.length, archiveDirectory});
      continue;
    }
    if ((await exists(archiveDirectory)) || (await exists(reportPath))) {
      throw new Error(`${id}: partial baseline output exists; inspect it instead of overwriting evidence`);
    }
    const parent = path.dirname(archiveDirectory);
    await mkdir(parent, {recursive: true});
    const temporaryDirectory = path.join(parent, `.tmp-${process.pid}-${Date.now()}`);
    await mkdir(temporaryDirectory, {recursive: false});
    try {
      await run(ffdec, ffdecFrameArguments({
        frameCount: manifest.runtime.frameCount,
        outputDirectory: temporaryDirectory,
        swfPath,
      }));
      const frames = await inspectFrameDirectory(temporaryDirectory, {
        frameCount: manifest.runtime.frameCount,
        stage: manifest.runtime.stage,
      });
      const sourceHashAfter = await sha256File(swfPath);
      if (sourceHashAfter !== sourceHashBefore) throw new Error(`${id}: preserved SWF changed during export`);
      await rename(temporaryDirectory, archiveDirectory);
      const report = {
        schemaVersion: 1,
        animationId: id,
        status: "structural-baseline-only",
        generatedAt: new Date().toISOString(),
        authority: {
          kind: "swf-static-root-timeline-render",
          tool: version,
          statement: "Frames are rendered from the untouched SWF display structure by FFDec.",
          limitations: [
            "ActionScript and button interactions are not executed by this export.",
            "Reachable branch states require authorized runtime traversal and separate captures.",
            "Audio timing is not proven by PNG frame export.",
            "Nested sprite behavior must be checked against runtime playback.",
            "This evidence cannot by itself satisfy strict baseline or human-review gates.",
          ],
        },
        source: {
          swf: portable(path.relative(projectRoot, swfPath)),
          swfSha256: sourceHashBefore,
        },
        runtime: {
          stage: manifest.runtime.stage,
          rasterization: {
            rule: RASTERIZATION_RULE,
            width: rasterDimensions.width,
            height: rasterDimensions.height,
            rationale: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
          },
          fps: manifest.runtime.fps,
          frameCount: manifest.runtime.frameCount,
        },
        archive: {
          root: portable(path.relative(projectRoot, archiveDirectory)),
          ignoredByGit: true,
        },
        frames,
      };
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      results.push({id, action: "exported", frameCount: frames.length, archiveDirectory});
    } catch (error) {
      await rm(temporaryDirectory, {recursive: true, force: true});
      throw error;
    }
  }
  return results;
}

function usage() {
  return `Usage:
  node scripts/export-pilot-baselines.mjs [--dry-run]
    [--ids id-1,id-2 | --release-id <release-id>]
    [--archive <directory>] [--migrations <directory>]
    [--ffdec <executable>]

Exports every root-timeline frame from each preserved pilot SWF into the ignored
full-frame archive. A hash-verifiable structural-baseline report is retained in
the migration workspace. This does not execute ActionScript, interactions, or
audio and therefore never advances migration status.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const results = await exportPilotBaselines(options);
  for (const result of results) {
    console.log(`${result.action.toUpperCase()}: ${result.id} (${result.frameCount} root frame${result.frameCount === 1 ? "" : "s"})`);
  }
  console.log(`Structural baseline export checked ${results.length} migration workspace(s); no status was advanced.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
