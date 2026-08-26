#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

import { sha256File } from "./create-flash-migration.mjs";
import {G4_L3_LESSON_AUDIT_IDS} from "./build-course-scenario-inventories.mjs";
import { PILOT_MIGRATIONS } from "./scaffold-pilot-migrations.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_TIMEOUT_MS = 300_000;
const MANAGED_DIRECTORY = "machine";
const DEFAULT_LESSON_RELEASE_PATH = path.join(projectRoot, "catalog", "lesson-releases.json");
const STANDARD_MACHINE_MANAGED_TOP_LEVEL = new Set([
  "failures",
  "ffdec-header.txt",
  "ffdec-script-index.txt",
  "ffdec-scripts.txt.gz",
  "ffdec-tags.txt.gz",
  "report.json",
  "swf-frame-domain-candidates.json",
  "swfmill-summary.json",
  "swfmill.xml.gz",
]);

const PYTHON_XML_SUMMARIZER = String.raw`
import json
import sys
import xml.etree.ElementTree as ET

source = sys.argv[1]
counts = {}
stack = []
summary = {
    "document": {},
    "header": {},
    "backgroundColor": None,
    "fileAttributes": {},
    "spriteDefinitions": [],
}

def local_name(tag):
    return tag.rsplit("}", 1)[-1]

for event, element in ET.iterparse(source, events=("start", "end")):
    name = local_name(element.tag)
    if event == "start":
        stack.append(name)
        counts[name] = counts.get(name, 0) + 1
        if name == "swf":
            summary["document"] = dict(element.attrib)
        elif name == "Header":
            summary["header"].update(element.attrib)
        elif name == "Rectangle" and len(stack) >= 3 and stack[-3:-1] == ["Header", "size"]:
            summary["header"]["rectangle"] = dict(element.attrib)
        elif name == "FileAttributes":
            summary["fileAttributes"] = dict(element.attrib)
        elif name == "DefineSprite":
            attrs = dict(element.attrib)
            summary["spriteDefinitions"].append({
                "objectID": int(attrs["objectID"]) if attrs.get("objectID", "").isdigit() else attrs.get("objectID"),
                "frames": int(attrs["frames"]) if attrs.get("frames", "").isdigit() else attrs.get("frames"),
            })
        elif name == "Color" and "SetBackgroundColor" in stack:
            attrs = element.attrib
            if all(channel in attrs for channel in ("red", "green", "blue")):
                summary["backgroundColor"] = {
                    "red": int(attrs["red"]),
                    "green": int(attrs["green"]),
                    "blue": int(attrs["blue"]),
                    "alpha": int(attrs.get("alpha", "255")),
                }
    else:
        element.clear()
        stack.pop()

as3_tags = counts.get("DoABC", 0) + counts.get("DoABC2", 0)
avm1_tags = sum(counts.get(name, 0) for name in (
    "DoAction", "DoInitAction", "ButtonCondAction", "ClipActionRecord"
))
as3_flag = str(summary["fileAttributes"].get("actionScript3", "0")).lower() in (
    "1", "true", "yes"
)
if (as3_tags or as3_flag) and avm1_tags:
    action_script = "hybrid-avm1-avm2"
elif as3_tags or as3_flag:
    action_script = "AS3"
elif avm1_tags:
    action_script = "AS1/2"
else:
    action_script = "none-detected"

font_names = ("DefineFont", "DefineFont2", "DefineFont3", "DefineFont4")
sound_names = ("DefineSound", "StartSound", "StartSound2", "SoundStreamHead", "SoundStreamHead2", "SoundStreamBlock")
script_names = ("DoAction", "DoInitAction", "DoABC", "DoABC2", "ButtonCondAction", "ClipActionRecord")
external_names = ("ImportAssets", "ImportAssets2")
mask_names = ("ClipActionRecord",)
filter_names = ("FilterList", "BlurFilter", "DropShadowFilter", "GlowFilter", "BevelFilter", "GradientGlowFilter", "GradientBevelFilter", "ColorMatrixFilter", "ConvolutionFilter")

summary["actionScriptVersion"] = action_script
summary["categories"] = {
    "fontDefinitions": {name: counts.get(name, 0) for name in font_names if counts.get(name, 0)},
    "soundTags": {name: counts.get(name, 0) for name in sound_names if counts.get(name, 0)},
    "scriptTags": {name: counts.get(name, 0) for name in script_names if counts.get(name, 0)},
    "externalImportTags": {name: counts.get(name, 0) for name in external_names if counts.get(name, 0)},
    "morphDefinitions": {
        name: counts.get(name, 0)
        for name in ("DefineMorphShape", "DefineMorphShape2")
        if counts.get(name, 0)
    },
    "filterTags": {name: counts.get(name, 0) for name in filter_names if counts.get(name, 0)},
    "videoTags": {
        name: counts.get(name, 0)
        for name in ("DefineVideoStream", "VideoFrame")
        if counts.get(name, 0)
    },
}
summary["tagCounts"] = dict(sorted(counts.items()))
summary["spriteDefinitions"] = sorted(
    summary["spriteDefinitions"],
    key=lambda item: (str(item.get("objectID")), str(item.get("frames")))
)
print(json.dumps(summary, sort_keys=True, separators=(",", ":")))
`;

const NETWORK_API_NAMES = Object.freeze([
  "ExternalInterface",
  "FlashVars",
  "Loader",
  "NetConnection",
  "SharedObject",
  "Socket",
  "URLRequest",
  "XMLSocket",
  "fscommand",
  "getURL",
  "loadMovie",
  "loadMovieNum",
  "navigateToURL",
]);

function usage() {
  return `Usage:
  node scripts/audit-pilot-swfs.mjs [options]

Options:
  --migration-root <directory>  Migration root (default: migrations)
  --id <animation-id>           Audit only this pilot; repeat for more than one
  --release-id <release-id>     Audit the exact members of one lesson release
  --shard-id <shard-id>         Restrict --release-id to one declared shard
  --ffdec <command>             FFDec launcher (default: ffdec)
  --swfmill <command>           swfmill launcher (default: swfmill)
  --java <command>              Java launcher used for version evidence (default: java)
  --python <command>            Python launcher used for streaming XML parsing (default: python3)
  --timeout-ms <milliseconds>   Per-command timeout (default: ${DEFAULT_TIMEOUT_MS})

The command never edits legacy FLA/SWF sources or changes migration status. It
replaces only its standard files under migrations/<id>/audit/${MANAGED_DIRECTORY}/,
preserving unrelated evidence files fail-closed. Full FLA/runtime/visual review
remains a separate gate.`;
}

async function copyPreservedMachineEntry(source, destination, label) {
  const information = await lstat(source);
  if (information.isSymbolicLink()) {
    throw new Error(`${label}: refusing to preserve a symbolic link from audit/machine`);
  }
  if (information.isDirectory()) {
    await mkdir(destination, {recursive: false});
    const entries = await readdir(source, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      await copyPreservedMachineEntry(
        path.join(source, entry.name),
        path.join(destination, entry.name),
        `${label}/${entry.name}`,
      );
    }
    return;
  }
  if (!information.isFile()) {
    throw new Error(`${label}: refusing to preserve a non-regular audit/machine entry`);
  }
  await copyFile(source, destination);
}

export async function preserveUnmanagedMachineEvidence(existingRoot, stagingRoot) {
  let entries;
  try {
    entries = await readdir(existingRoot, {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const preserved = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    if (STANDARD_MACHINE_MANAGED_TOP_LEVEL.has(entry.name)) continue;
    await copyPreservedMachineEntry(
      path.join(existingRoot, entry.name),
      path.join(stagingRoot, entry.name),
      entry.name,
    );
    preserved.push(entry.name);
  }
  return preserved;
}

export function parseArguments(argv) {
  const options = {
    migrationRoot: path.join(projectRoot, "migrations"),
    ids: [],
    releaseId: "",
    shardId: "",
    ffdec: "ffdec",
    swfmill: "swfmill",
    java: "java",
    python: "python3",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (["--migration-root", "--id", "--release-id", "--shard-id", "--ffdec", "--swfmill", "--java", "--python", "--timeout-ms"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--release-id") options.releaseId = next;
      else if (value === "--shard-id") options.shardId = next;
      else if (value === "--timeout-ms") {
        const timeoutMs = Number(next);
        if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000) throw new Error("--timeout-ms must be an integer of at least 1000");
        options.timeoutMs = timeoutMs;
      } else {
        const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        options[key] = next;
      }
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.releaseId && options.ids.length) throw new Error("--release-id and --id are mutually exclusive");
  if (options.shardId && !options.releaseId) throw new Error("--shard-id requires --release-id");
  return options;
}

function normalizeText(value, replacements = []) {
  let result = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\u001b\[[0-9;]*m/g, "");
  for (const [search, replacement] of replacements) {
    if (search) result = result.split(search).join(replacement);
  }
  return result;
}

async function readTextIfPresent(filePath, replacements = []) {
  try {
    return normalizeText(await readFile(filePath, "utf8"), replacements);
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

async function runCommand(command, args, { stdoutPath, stderrPath, timeoutMs = DEFAULT_TIMEOUT_MS, cwd = projectRoot } = {}) {
  await mkdir(path.dirname(stdoutPath), { recursive: true });
  const stdoutHandle = await open(stdoutPath, "w");
  const stderrHandle = await open(stderrPath, "w");
  let spawnError = "";
  let timedOut = false;
  let exitCode = null;
  let signal = null;
  try {
    await new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        stdio: ["ignore", stdoutHandle.fd, stderrHandle.fd],
      });
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);
      child.once("error", (error) => {
        spawnError = error.message;
      });
      child.once("close", (code, closeSignal) => {
        clearTimeout(timer);
        exitCode = code;
        signal = closeSignal;
        resolve();
      });
    });
  } finally {
    await Promise.all([stdoutHandle.close(), stderrHandle.close()]);
  }
  return {
    command,
    args,
    exitCode,
    signal,
    timedOut,
    spawnError,
    success: exitCode === 0 && !timedOut && !spawnError,
    stdoutPath,
    stderrPath,
  };
}

async function captureVersion(command, args, temporaryRoot, label, timeoutMs) {
  const result = await runCommand(command, args, {
    stdoutPath: path.join(temporaryRoot, `${label}-version.stdout.txt`),
    stderrPath: path.join(temporaryRoot, `${label}-version.stderr.txt`),
    timeoutMs,
  });
  const combined = normalizeText(`${await readTextIfPresent(result.stdoutPath)}\n${await readTextIfPresent(result.stderrPath)}`)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    command,
    version: combined[0] || "unavailable",
    success: result.success,
    exitCode: result.exitCode,
    error: result.spawnError || (result.timedOut ? "command timed out" : result.success ? "" : combined.slice(0, 3).join(" | ")),
  };
}

async function detectAdobeAnimate() {
  if (process.platform !== "darwin") return false;
  try {
    const entries = await readdir("/Applications");
    return entries.some((name) => /^Adobe Animate(?:\s|\.|$)/i.test(name));
  } catch {
    return false;
  }
}

async function fileMetadata(filePath) {
  const information = await stat(filePath);
  return {
    bytes: information.size,
    sha256: await sha256File(filePath),
  };
}

async function writeTrackedText(stagingRoot, relativePath, contents, outputs) {
  const normalized = contents.endsWith("\n") ? contents : `${contents}\n`;
  const outputPath = path.join(stagingRoot, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, normalized);
  const metadata = await fileMetadata(outputPath);
  outputs.push({ path: `audit/${MANAGED_DIRECTORY}/${relativePath}`, format: "text", ...metadata });
  return outputPath;
}

async function writeTrackedJson(stagingRoot, relativePath, value, outputs) {
  return writeTrackedText(stagingRoot, relativePath, `${JSON.stringify(value, null, 2)}\n`, outputs);
}

async function writeTrackedGzip(stagingRoot, relativePath, sourcePath, outputs, format) {
  const outputPath = path.join(stagingRoot, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const logical = await fileMetadata(sourcePath);
  await pipeline(
    createReadStream(sourcePath),
    createGzip({ level: 9, mtime: 0 }),
    createWriteStream(outputPath),
  );
  const compressed = await fileMetadata(outputPath);
  outputs.push({
    path: `audit/${MANAGED_DIRECTORY}/${relativePath}`,
    format,
    ...compressed,
    uncompressedBytes: logical.bytes,
    uncompressedSha256: logical.sha256,
  });
  return outputPath;
}

async function walkFiles(directory, relative = "") {
  let entries;
  try {
    entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, next));
    else if (entry.isFile()) files.push(next.split(path.sep).join("/"));
  }
  return files;
}

async function buildScriptBundle(scriptRoot, outputPath) {
  const files = await walkFiles(scriptRoot);
  const handle = await open(outputPath, "w");
  try {
    for (const relative of files) {
      await handle.write(`===== ${relative} =====\n`);
      const content = normalizeText(await readFile(path.join(scriptRoot, relative), "utf8"));
      await handle.write(content);
      if (!content.endsWith("\n")) await handle.write("\n");
      await handle.write("\n");
    }
  } finally {
    await handle.close();
  }
  return files;
}

function commandSummary(result, commandDisplay, evidence = "") {
  return {
    command: commandDisplay,
    status: result.success ? "success" : "failed",
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    error: result.spawnError || "",
    evidence,
  };
}

async function writeFailure(stagingRoot, label, result, replacements, outputs) {
  const stdout = (await readTextIfPresent(result.stdoutPath, replacements)).slice(0, 32_768);
  const stderr = (await readTextIfPresent(result.stderrPath, replacements)).slice(0, 32_768);
  const command = normalizeText(`${result.command} ${result.args.join(" ")}`, replacements);
  const spawnError = normalizeText(result.spawnError || "", replacements);
  const body = [
    `command: ${command}`,
    `exitCode: ${result.exitCode}`,
    `signal: ${result.signal || ""}`,
    `timedOut: ${result.timedOut}`,
    `spawnError: ${spawnError}`,
    "",
    "[stdout]",
    stdout,
    "[stderr]",
    stderr,
  ].join("\n");
  const relative = `failures/${label}.txt`;
  await writeTrackedText(stagingRoot, relative, body, outputs);
  return `audit/${MANAGED_DIRECTORY}/${relative}`;
}

function parseFfdecHeader(text) {
  const fields = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*)=(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  }
  const numeric = (name) => fields[name] === undefined ? null : Number(fields[name]);
  return {
    fileSize: numeric("fileSize"),
    version: numeric("version"),
    compression: fields.compression || "",
    encrypted: fields.encrypted === "true",
    gfx: fields.gfx === "true",
    displayRect: fields.displayRect || "",
    widthPx: numeric("widthPx"),
    heightPx: numeric("heightPx"),
    frameCount: numeric("frameCount"),
    frameRate: numeric("frameRate"),
  };
}

function externalCallCandidates(scriptText) {
  const candidates = [];
  for (const name of NETWORK_API_NAMES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = scriptText.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    if (matches?.length) candidates.push({ api: name, occurrences: matches.length });
  }
  const xmlLoadMatches = scriptText.match(/\bXML\s*\.\s*load\b/gi);
  if (xmlLoadMatches?.length) candidates.push({ api: "XML.load", occurrences: xmlLoadMatches.length });
  return candidates;
}

function colorToHex(color) {
  if (!color) return "";
  return `#${[color.red, color.green, color.blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function crossCheckRuntime(manifest, ffdecHeader, xmlSummary) {
  const rectangle = xmlSummary?.header?.rectangle || {};
  const xmlWidth = rectangle.left === undefined || rectangle.right === undefined
    ? null
    : (Number(rectangle.right) - Number(rectangle.left)) / 20;
  const xmlHeight = rectangle.top === undefined || rectangle.bottom === undefined
    ? null
    : (Number(rectangle.bottom) - Number(rectangle.top)) / 20;
  const checks = {
    ffdecVersionMatches: ffdecHeader.version === manifest.runtime?.swfVersion,
    ffdecWidthMatches: ffdecHeader.widthPx === manifest.runtime?.stage?.width,
    ffdecHeightMatches: ffdecHeader.heightPx === manifest.runtime?.stage?.height,
    ffdecFrameRateMatches: ffdecHeader.frameRate === manifest.runtime?.fps,
    ffdecFrameCountMatches: ffdecHeader.frameCount === manifest.runtime?.frameCount,
    swfmillVersionMatches: numberOrNull(xmlSummary?.document?.version) === manifest.runtime?.swfVersion,
    swfmillWidthMatches: xmlWidth === manifest.runtime?.stage?.width,
    swfmillHeightMatches: xmlHeight === manifest.runtime?.stage?.height,
    swfmillFrameRateMatches: numberOrNull(xmlSummary?.header?.framerate) === manifest.runtime?.fps,
    swfmillFrameCountMatches: numberOrNull(xmlSummary?.header?.frames) === manifest.runtime?.frameCount,
  };
  return { ...checks, allMatch: Object.values(checks).every(Boolean) };
}

async function summarizeXml(python, xmlPath, temporaryRoot, timeoutMs) {
  const result = await runCommand(python, ["-c", PYTHON_XML_SUMMARIZER, xmlPath], {
    stdoutPath: path.join(temporaryRoot, "xml-summary.stdout.json"),
    stderrPath: path.join(temporaryRoot, "xml-summary.stderr.txt"),
    timeoutMs,
  });
  if (!result.success) return { result, summary: null, parseError: "" };
  try {
    return { result, summary: JSON.parse(await readFile(result.stdoutPath, "utf8")), parseError: "" };
  } catch (error) {
    return { result: { ...result, success: false }, summary: null, parseError: error.message };
  }
}

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

function portablePath(value) {
  return value.split(path.sep).join("/");
}

function catalogRelativeSourcePath(value = "") {
  const normalized = portablePath(value);
  const marker = "HELP MATH_ORIGINAL FILES/";
  const markerIndex = normalized.indexOf(marker);
  return markerIndex >= 0 ? normalized.slice(markerIndex + marker.length) : normalized;
}

function safeCatalogId(value, label) {
  invariant(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value), `${label} is malformed`);
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function selectLessonReleaseAuditMembers(releaseDocument, {releaseId, shardId = ""} = {}) {
  safeCatalogId(releaseId, "Release ID");
  if (shardId) safeCatalogId(shardId, "Shard ID");
  invariant(releaseDocument?.schemaVersion === 1 && Array.isArray(releaseDocument.releases), "Lesson-release catalog must be schemaVersion 1 with a releases array");
  const releases = releaseDocument.releases.filter((release) => release?.releaseId === releaseId);
  invariant(releases.length === 1, releases.length ? `Lesson release ID is duplicated: ${releaseId}` : `Unknown lesson release: ${releaseId}`);
  const release = releases[0];
  invariant(Array.isArray(release.members) && release.members.length > 0, `${releaseId}: members must be a non-empty array`);
  invariant(Array.isArray(release.shards) && release.shards.length > 0, `${releaseId}: shards must be a non-empty array`);
  invariant(release.expectedCounts?.members === release.members.length, `${releaseId}: expected member count does not match members`);
  invariant(release.expectedCounts?.shards === release.shards.length, `${releaseId}: expected shard count does not match shards`);

  const shardIds = release.shards.map((shard) => shard?.shardId);
  invariant(shardIds.every((id) => typeof id === "string" && id), `${releaseId}: every shard needs a shardId`);
  invariant(new Set(shardIds).size === shardIds.length, `${releaseId}: shard IDs must be unique`);
  const knownShards = new Set(shardIds);
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member?.ordinal === index + 1, `${releaseId}: member ordinals must be the exact contiguous release order 1..${release.members.length}`);
    safeCatalogId(member.animationId, `${releaseId} member animationId`);
    invariant(!animationIds.has(member.animationId), `${releaseId}: duplicate member animationId ${member.animationId}`);
    animationIds.add(member.animationId);
    invariant(typeof member.source?.sha256 === "string" && /^[a-f0-9]{64}$/.test(member.source.sha256), `${member.animationId}: source SHA-256 is malformed`);
    invariant(member.assetId === `swf-${member.source.sha256}`, `${member.animationId}: assetId does not match source SHA-256`);
    invariant(!assetIds.has(member.assetId), `${releaseId}: duplicate member assetId ${member.assetId}`);
    assetIds.add(member.assetId);
    invariant(typeof member.source.path === "string" && member.source.path.endsWith(".swf") && !path.isAbsolute(member.source.path) && !member.source.path.split("/").includes(".."), `${member.animationId}: source path is unsafe`);
    invariant(knownShards.has(member.shardId), `${member.animationId}: unknown shard ${member.shardId}`);
  }
  for (const shard of release.shards) {
    safeCatalogId(shard.shardId, `${releaseId} shardId`);
    const actualCount = release.members.filter((member) => member.shardId === shard.shardId).length;
    invariant(shard.memberCount === actualCount, `${releaseId}/${shard.shardId}: declared memberCount ${shard.memberCount} does not match ${actualCount}`);
  }
  if (shardId) invariant(knownShards.has(shardId), `${releaseId}: unknown shard ${shardId}`);
  return release.members.filter((member) => !shardId || member.shardId === shardId);
}

export async function preflightReleaseAuditWorkspaces(migrationRoot, members, {sourceRoot = projectRoot} = {}) {
  const resolvedMigrationRoot = path.resolve(migrationRoot);
  const results = [];
  for (const member of members) {
    const workspace = path.join(resolvedMigrationRoot, member.animationId);
    const workspaceInfo = await lstat(workspace);
    invariant(workspaceInfo.isDirectory() && !workspaceInfo.isSymbolicLink(), `${member.animationId}: release audit workspace must be a real directory`);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestInfo = await lstat(manifestPath);
    invariant(manifestInfo.isFile() && !manifestInfo.isSymbolicLink(), `${member.animationId}: migration.json must be a regular file`);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    invariant(manifest.animationId === member.animationId && manifest.id === member.animationId, `${member.animationId}: workspace identity does not match the release member`);
    invariant(manifest.assetId === member.assetId, `${member.animationId}: workspace assetId does not match the release member`);
    invariant(manifest.source?.swfSha256 === member.source.sha256, `${member.animationId}: workspace SWF hash does not match the release member`);
    invariant(catalogRelativeSourcePath(manifest.source?.swf) === member.source.path, `${member.animationId}: workspace SWF path does not match the release member`);
    invariant(catalogRelativeSourcePath(manifest.source?.placementPath) === member.source.path, `${member.animationId}: workspace placement path does not match the release member`);
    const sourcePath = path.isAbsolute(manifest.source.swf) ? manifest.source.swf : path.resolve(sourceRoot, manifest.source.swf);
    const sourceInfo = await lstat(sourcePath);
    invariant(sourceInfo.isFile() && !sourceInfo.isSymbolicLink(), `${member.animationId}: release source must be a regular non-symlink file`);
    invariant(await sha256File(sourcePath) === member.source.sha256, `${member.animationId}: physical source hash does not match the release member`);
    results.push({animationId: member.animationId, workspace, sourcePath});
  }
  return results;
}

async function verifyOptionalFla(manifest) {
  if (!manifest.source?.fla) {
    return {
      path: "",
      expectedSha256: manifest.source?.flaSha256 || "",
      observedSha256Before: "",
      observedSha256After: "",
      hashMatches: false,
      status: "missing",
    };
  }
  const flaPath = resolveProjectPath(manifest.source.fla);
  try {
    const before = await fileMetadata(flaPath);
    return {
      path: manifest.source.fla,
      absolutePath: flaPath,
      expectedSha256: manifest.source.flaSha256,
      observedSha256Before: before.sha256,
      observedSha256After: "",
      bytes: before.bytes,
      hashMatches: before.sha256 === manifest.source.flaSha256,
      status: "present-uninspected",
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return {
      path: manifest.source.fla,
      expectedSha256: manifest.source.flaSha256,
      observedSha256Before: "",
      observedSha256After: "",
      hashMatches: false,
      status: "missing",
    };
  }
}

async function finishFlaVerification(fla) {
  if (!fla.absolutePath) return fla;
  const after = await fileMetadata(fla.absolutePath);
  return {
    ...fla,
    observedSha256After: after.sha256,
    hashMatches: fla.hashMatches && after.sha256 === fla.expectedSha256 && after.sha256 === fla.observedSha256Before,
  };
}

export function buildSwfFrameDomainCandidates(manifest, xmlSummary) {
  const rootFrameCount = manifest.runtime?.frameCount;
  invariant(Number.isInteger(rootFrameCount) && rootFrameCount > 0, `${manifest.animationId}: root frame count is missing from migration.json`);
  const seenObjectIds = new Set();
  const nestedDefinitions = (xmlSummary?.spriteDefinitions || []).map((definition) => {
    const objectId = Number(definition.objectID);
    const frameCount = Number(definition.frames);
    invariant(Number.isInteger(objectId) && objectId > 0, `${manifest.animationId}: malformed DefineSprite objectID`);
    invariant(Number.isInteger(frameCount) && frameCount > 0, `${manifest.animationId}: malformed DefineSprite frame count for ${objectId}`);
    invariant(!seenObjectIds.has(objectId), `${manifest.animationId}: duplicate DefineSprite objectID ${objectId}`);
    seenObjectIds.add(objectId);
    return {
      timelineId: `sprite-${objectId}`,
      sourceTimelineId: `sprite-${objectId}`,
      sourceObjectId: objectId,
      kind: "nested-definition-candidate",
      frameCount,
      rootReachability: "unresolved",
      placementEntryState: "unresolved",
      acceptanceDisposition: "structural-candidate-only",
    };
  }).sort((left, right) => left.sourceObjectId - right.sourceObjectId);
  return {
    schemaVersion: 1,
    artifactType: "swf-frame-domain-candidates",
    animationId: manifest.animationId,
    source: {
      path: manifest.source.swf,
      sha256: manifest.source.swfSha256,
    },
    extractionStatus: xmlSummary ? "swfmill-structural-definitions-extracted" : "swfmill-structure-unavailable",
    root: {
      timelineId: "root",
      sourceTimelineId: "root",
      kind: "root",
      frameCount: rootFrameCount,
      rootReachability: "root-by-definition",
      acceptanceDisposition: "declared-root-structural-domain",
    },
    nestedDefinitions,
    summary: {
      rootDomainCount: 1,
      nestedDefinitionCount: nestedDefinitions.length,
      nestedLongerThanRootCount: nestedDefinitions.filter(({frameCount}) => frameCount > rootFrameCount).length,
      completeRootReachableDomainInventory: false,
      unresolvedReachabilityCount: nestedDefinitions.length,
    },
    limitations: [
      "DefineSprite records are structural definitions, not proof that the root or an authorized host reaches them.",
      "Placement, entry state, interaction causality, language, audio, terminal behavior, Replay, and natural traces remain unresolved.",
      "This machine inventory cannot create original-runtime authority, visual or audio acceptance, human or owner review, strict completion, or publication.",
    ],
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      completeFrameDomainDisposition: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

export async function auditMigration(migrationDirectory, {
  ffdec = "ffdec",
  swfmill = "swfmill",
  java = "java",
  python = "python3",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  tools,
  adobeAnimateAvailable,
} = {}) {
  const migrationRoot = path.resolve(migrationDirectory);
  const manifestPath = path.join(migrationRoot, "migration.json");
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  if (!manifest.animationId || !manifest.source?.swf || !manifest.source?.swfSha256) {
    throw new Error(`${migrationRoot}: migration.json lacks animationId or hashed SWF source evidence`);
  }
  const sourcePath = resolveProjectPath(manifest.source.swf);
  const sourceBefore = await fileMetadata(sourcePath);
  if (sourceBefore.sha256 !== manifest.source.swfSha256) {
    throw new Error(`${manifest.animationId}: source SHA-256 does not match migration.json`);
  }
  const flaBefore = await verifyOptionalFla(manifest);
  if (flaBefore.status === "present-uninspected" && !flaBefore.hashMatches) {
    throw new Error(`${manifest.animationId}: FLA SHA-256 does not match migration.json`);
  }

  const auditDirectory = path.join(migrationRoot, "audit");
  await mkdir(auditDirectory, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(auditDirectory, ".machine-staging-"));
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `help-math-${manifest.animationId}-`));
  const outputs = [];
  const replacements = [[sourcePath, "<SWF>"], [temporaryRoot, "<TEMP_DIR>"], [projectRoot, "<PROJECT_ROOT>"]];

  try {
    const headerResult = await runCommand(ffdec, ["-header", sourcePath], {
      stdoutPath: path.join(temporaryRoot, "ffdec-header.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "ffdec-header.stderr.txt"),
      timeoutMs,
    });
    const tagsResult = await runCommand(ffdec, ["-dumpSWF", sourcePath], {
      stdoutPath: path.join(temporaryRoot, "ffdec-tags.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "ffdec-tags.stderr.txt"),
      timeoutMs,
    });
    const as2Result = await runCommand(ffdec, ["-dumpAS2", sourcePath], {
      stdoutPath: path.join(temporaryRoot, "ffdec-as2.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "ffdec-as2.stderr.txt"),
      timeoutMs,
    });
    const as3Result = await runCommand(ffdec, ["-dumpAS3", sourcePath], {
      stdoutPath: path.join(temporaryRoot, "ffdec-as3.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "ffdec-as3.stderr.txt"),
      timeoutMs,
    });
    const scriptExportRoot = path.join(temporaryRoot, "ffdec-script-export");
    const scriptsResult = await runCommand(ffdec, [
      "-onerror", "abort",
      "-timeout", "30",
      "-exportTimeout", String(Math.max(30, Math.floor(timeoutMs / 1_000))),
      "-exportFileTimeout", "30",
      "-export", "script", scriptExportRoot, sourcePath,
    ], {
      stdoutPath: path.join(temporaryRoot, "ffdec-script-export.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "ffdec-script-export.stderr.txt"),
      timeoutMs,
    });
    const xmlPath = path.join(temporaryRoot, "swfmill.xml");
    const swfmillResult = await runCommand(swfmill, ["-n", "swf2xml", sourcePath, xmlPath], {
      stdoutPath: path.join(temporaryRoot, "swfmill.stdout.txt"),
      stderrPath: path.join(temporaryRoot, "swfmill.stderr.txt"),
      timeoutMs,
    });

    const commands = {};
    let ffdecHeader = null;
    if (headerResult.success) {
      const headerText = await readTextIfPresent(headerResult.stdoutPath, replacements);
      const relative = "ffdec-header.txt";
      await writeTrackedText(stagingRoot, relative, headerText, outputs);
      ffdecHeader = parseFfdecHeader(headerText);
      commands.ffdecHeader = commandSummary(headerResult, [ffdec, "-header", "<SWF>"], `audit/${MANAGED_DIRECTORY}/${relative}`);
    } else {
      const evidence = await writeFailure(stagingRoot, "ffdec-header", headerResult, replacements, outputs);
      commands.ffdecHeader = commandSummary(headerResult, [ffdec, "-header", "<SWF>"], evidence);
    }

    if (tagsResult.success) {
      const relative = "ffdec-tags.txt.gz";
      await writeTrackedGzip(stagingRoot, relative, tagsResult.stdoutPath, outputs, "gzip+text/ffdec-tag-dump");
      commands.ffdecTags = commandSummary(tagsResult, [ffdec, "-dumpSWF", "<SWF>"], `audit/${MANAGED_DIRECTORY}/${relative}`);
    } else {
      const evidence = await writeFailure(stagingRoot, "ffdec-tags", tagsResult, replacements, outputs);
      commands.ffdecTags = commandSummary(tagsResult, [ffdec, "-dumpSWF", "<SWF>"], evidence);
    }

    const as2Text = await readTextIfPresent(as2Result.stdoutPath, replacements);
    const as3Text = await readTextIfPresent(as3Result.stdoutPath, replacements);
    if (as2Result.success && as3Result.success) {
      const relative = "ffdec-script-index.txt";
      await writeTrackedText(stagingRoot, relative, `[AS1/2]\n${as2Text}\n[AS3]\n${as3Text}`, outputs);
      commands.ffdecAs2Index = commandSummary(as2Result, [ffdec, "-dumpAS2", "<SWF>"], `audit/${MANAGED_DIRECTORY}/${relative}`);
      commands.ffdecAs3Index = commandSummary(as3Result, [ffdec, "-dumpAS3", "<SWF>"], `audit/${MANAGED_DIRECTORY}/${relative}`);
    } else {
      const as2Evidence = as2Result.success
        ? ""
        : await writeFailure(stagingRoot, "ffdec-as2", as2Result, replacements, outputs);
      const as3Evidence = as3Result.success
        ? ""
        : await writeFailure(stagingRoot, "ffdec-as3", as3Result, replacements, outputs);
      commands.ffdecAs2Index = commandSummary(as2Result, [ffdec, "-dumpAS2", "<SWF>"], as2Evidence);
      commands.ffdecAs3Index = commandSummary(as3Result, [ffdec, "-dumpAS3", "<SWF>"], as3Evidence);
    }

    let scriptFiles = [];
    let scriptBundleText = "";
    if (scriptsResult.success) {
      const bundlePath = path.join(temporaryRoot, "ffdec-scripts.txt");
      scriptFiles = await buildScriptBundle(path.join(scriptExportRoot, "scripts"), bundlePath);
      const relative = "ffdec-scripts.txt.gz";
      await writeTrackedGzip(stagingRoot, relative, bundlePath, outputs, "gzip+text/actionscript");
      commands.ffdecScripts = commandSummary(scriptsResult, [ffdec, "-export", "script", "<TEMP_DIR>/scripts", "<SWF>"], `audit/${MANAGED_DIRECTORY}/${relative}`);
      scriptBundleText = await readFile(bundlePath, "utf8");
    } else {
      const evidence = await writeFailure(stagingRoot, "ffdec-scripts", scriptsResult, replacements, outputs);
      commands.ffdecScripts = commandSummary(scriptsResult, [ffdec, "-export", "script", "<TEMP_DIR>/scripts", "<SWF>"], evidence);
    }

    let xmlSummary = null;
    let xmlParserResult = null;
    if (swfmillResult.success) {
      try {
        const xmlInformation = await stat(xmlPath);
        if (!xmlInformation.isFile() || xmlInformation.size === 0) throw new Error("swfmill produced no XML bytes");
        const summarized = await summarizeXml(python, xmlPath, temporaryRoot, timeoutMs);
        xmlParserResult = summarized.result;
        xmlSummary = summarized.summary;
        if (!summarized.result.success || !xmlSummary) {
          const synthetic = {
            ...summarized.result,
            spawnError: summarized.parseError || summarized.result.spawnError,
          };
          const evidence = await writeFailure(stagingRoot, "swfmill-xml-parser", synthetic, replacements, outputs);
          commands.swfmillXmlParser = commandSummary(synthetic, [python, "xml.etree.ElementTree.iterparse", "<TEMP_DIR>/swfmill.xml"], evidence);
        } else {
          const summaryRelative = "swfmill-summary.json";
          await writeTrackedJson(stagingRoot, summaryRelative, xmlSummary, outputs);
          commands.swfmillXmlParser = commandSummary(summarized.result, [python, "xml.etree.ElementTree.iterparse", "<TEMP_DIR>/swfmill.xml"], `audit/${MANAGED_DIRECTORY}/${summaryRelative}`);
        }
        const relative = "swfmill.xml.gz";
        await writeTrackedGzip(stagingRoot, relative, xmlPath, outputs, "gzip+xml/swfmill");
        commands.swfmillXml = commandSummary(swfmillResult, [swfmill, "-n", "swf2xml", "<SWF>", "<TEMP_DIR>/swfmill.xml"], `audit/${MANAGED_DIRECTORY}/${relative}`);
      } catch (error) {
        const synthetic = { ...swfmillResult, success: false, spawnError: error.message };
        const evidence = await writeFailure(stagingRoot, "swfmill", synthetic, replacements, outputs);
        commands.swfmillXml = commandSummary(synthetic, [swfmill, "-n", "swf2xml", "<SWF>", "<TEMP_DIR>/swfmill.xml"], evidence);
      }
    } else {
      const evidence = await writeFailure(stagingRoot, "swfmill", swfmillResult, replacements, outputs);
      commands.swfmillXml = commandSummary(swfmillResult, [swfmill, "-n", "swf2xml", "<SWF>", "<TEMP_DIR>/swfmill.xml"], evidence);
    }

    const sourceAfter = await fileMetadata(sourcePath);
    const flaAfter = await finishFlaVerification(flaBefore);
    const sourceHashMatches = sourceBefore.sha256 === manifest.source.swfSha256 &&
      sourceAfter.sha256 === manifest.source.swfSha256 &&
      sourceAfter.sha256 === sourceBefore.sha256;
    if (!sourceHashMatches) throw new Error(`${manifest.animationId}: source SWF changed during machine audit`);

    const frameDomainCandidates = buildSwfFrameDomainCandidates(manifest, xmlSummary);
    await writeTrackedJson(stagingRoot, "swf-frame-domain-candidates.json", frameDomainCandidates, outputs);

    const partialReasons = [];
    if (flaAfter.status === "missing") partialReasons.push("FLA authoring source is unavailable; authoring structure cannot be inspected.");
    else if (!adobeAnimateAvailable) partialReasons.push("Adobe Animate is unavailable; the preserved FLA timeline, library, scripts, and fonts were not inspected.");
    partialReasons.push("No authoritative runtime traversal, interaction-branch capture, audio synchronization review, or visual baseline is part of this machine audit.");
    const failedCommands = Object.entries(commands).filter(([, command]) => command.status !== "success").map(([name]) => name);
    if (failedCommands.length) partialReasons.push(`Machine extraction failures: ${failedCommands.join(", ")}.`);

    const report = {
      schemaVersion: 1,
      animationId: manifest.animationId,
      auditStatus: "partial",
      migrationStatus: manifest.status,
      migrationStatusUnchanged: JSON.parse(await readFile(manifestPath, "utf8")).status === manifest.status,
      source: {
        path: manifest.source.swf,
        expectedSha256: manifest.source.swfSha256,
        observedSha256Before: sourceBefore.sha256,
        observedSha256After: sourceAfter.sha256,
        bytesBefore: sourceBefore.bytes,
        bytesAfter: sourceAfter.bytes,
        hashMatches: sourceHashMatches,
      },
      authoringSource: {
        path: flaAfter.path,
        pairedFlaStatus: manifest.source.pairedFlaStatus,
        expectedSha256: flaAfter.expectedSha256,
        observedSha256Before: flaAfter.observedSha256Before,
        observedSha256After: flaAfter.observedSha256After,
        bytes: flaAfter.bytes || 0,
        hashMatches: flaAfter.hashMatches,
        adobeAnimateAvailable: Boolean(adobeAnimateAvailable),
        inspectionStatus: flaAfter.status === "missing" ? "missing-source" : adobeAnimateAvailable ? "not-performed-by-this-script" : "blocked-tool-unavailable",
      },
      tools,
      commands,
      findings: {
        ffdecHeader,
        swfmill: xmlSummary,
        actionScriptVersion: xmlSummary?.actionScriptVersion || "unknown",
        backgroundColor: colorToHex(xmlSummary?.backgroundColor),
        exportedScriptFileCount: scriptFiles.length,
        externalCallCandidates: externalCallCandidates(scriptBundleText),
        runtimeCrossCheck: ffdecHeader && xmlSummary ? crossCheckRuntime(manifest, ffdecHeader, xmlSummary) : null,
        frameDomainCandidates,
      },
      outputs: outputs.sort((left, right) => left.path.localeCompare(right.path, "en")),
      limitations: partialReasons,
    };
    await writeFile(path.join(stagingRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

    const finalRoot = path.join(auditDirectory, MANAGED_DIRECTORY);
    await preserveUnmanagedMachineEvidence(finalRoot, stagingRoot);
    await rm(finalRoot, { recursive: true, force: true });
    await rename(stagingRoot, finalRoot);
    return report;
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function auditMigrationWithInstalledTools(migrationDirectory, {
  ffdec = "ffdec",
  swfmill = "swfmill",
  java = "java",
  python = "python3",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  adobeAnimateAvailable,
} = {}) {
  const versionRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-tool-versions-"));
  let tools;
  try {
    const [ffdecInfo, swfmillInfo, javaInfo, pythonInfo] = await Promise.all([
      captureVersion(ffdec, ["-help"], versionRoot, "ffdec", timeoutMs),
      captureVersion(swfmill, ["--version"], versionRoot, "swfmill", timeoutMs),
      captureVersion(java, ["-version"], versionRoot, "java", timeoutMs),
      captureVersion(python, ["--version"], versionRoot, "python", timeoutMs),
    ]);
    tools = {
      ffdec: ffdecInfo,
      swfmill: swfmillInfo,
      java: javaInfo,
      xmlParser: {
        ...pythonInfo,
        library: "Python standard library xml.etree.ElementTree.iterparse",
      },
    };
  } finally {
    await rm(versionRoot, { recursive: true, force: true });
  }
  const animateAvailable = adobeAnimateAvailable ?? await detectAdobeAnimate();
  return auditMigration(migrationDirectory, {
    ffdec,
    swfmill,
    java,
    python,
    timeoutMs,
    tools,
    adobeAnimateAvailable: animateAvailable,
  });
}

export async function auditPilotSwfs({
  migrationRoot = path.join(projectRoot, "migrations"),
  ids = [],
  releaseId = "",
  shardId = "",
  lessonReleasePath = DEFAULT_LESSON_RELEASE_PATH,
  ffdec = "ffdec",
  swfmill = "swfmill",
  java = "java",
  python = "python3",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  adobeAnimateAvailable,
} = {}) {
  const approvedIds = new Set([
    ...PILOT_MIGRATIONS.map(({id}) => id),
    ...G4_L3_LESSON_AUDIT_IDS,
  ]);
  invariant(!(releaseId && ids.length), "releaseId and explicit ids are mutually exclusive");
  invariant(!shardId || releaseId, "shardId requires releaseId");
  let selectedIds;
  if (releaseId) {
    const releaseDocument = JSON.parse(await readFile(lessonReleasePath, "utf8"));
    const members = selectLessonReleaseAuditMembers(releaseDocument, {releaseId, shardId});
    await preflightReleaseAuditWorkspaces(migrationRoot, members);
    selectedIds = members.map(({animationId}) => animationId);
  } else {
    selectedIds = ids.length ? ids : [...approvedIds];
    for (const id of selectedIds) {
      if (!approvedIds.has(id)) throw new Error(`Not an approved standard-machine-audit animation ID: ${id}`);
    }
  }
  if (new Set(selectedIds).size !== selectedIds.length) throw new Error("Standard-machine-audit animation IDs must not be repeated");

  const versionRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-tool-versions-"));
  let tools;
  try {
    const [ffdecInfo, swfmillInfo, javaInfo, pythonInfo] = await Promise.all([
      captureVersion(ffdec, ["-help"], versionRoot, "ffdec", timeoutMs),
      captureVersion(swfmill, ["--version"], versionRoot, "swfmill", timeoutMs),
      captureVersion(java, ["-version"], versionRoot, "java", timeoutMs),
      captureVersion(python, ["--version"], versionRoot, "python", timeoutMs),
    ]);
    tools = {
      ffdec: ffdecInfo,
      swfmill: swfmillInfo,
      java: javaInfo,
      xmlParser: {
        ...pythonInfo,
        library: "Python standard library xml.etree.ElementTree.iterparse",
      },
    };
  } finally {
    await rm(versionRoot, { recursive: true, force: true });
  }
  const animateAvailable = adobeAnimateAvailable ?? await detectAdobeAnimate();
  const results = [];
  for (const id of selectedIds) {
    const migrationDirectory = path.resolve(migrationRoot, id);
    const report = await auditMigration(migrationDirectory, {
      ffdec,
      swfmill,
      java,
      python,
      timeoutMs,
      tools,
      adobeAnimateAvailable: animateAvailable,
    });
    results.push(report);
  }
  return results;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const reports = await auditPilotSwfs(options);
    for (const report of reports) {
      const failed = Object.values(report.commands).filter(({ status }) => status !== "success").length;
      const bytes = report.outputs.reduce((total, output) => total + output.bytes, 0);
      console.log(`${report.animationId}: partial audit; ${failed} extraction failure(s); ${report.outputs.length} evidence file(s); ${bytes} byte(s)`);
    }
    console.log(`Audited ${reports.length} selected standard-machine-audit SWF(s). Migration statuses were not changed.`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
