#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInflate } from "node:zlib";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const templateRoot = path.join(projectRoot, "templates", "flash-migration");

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function resolveSource(input, label) {
  if (!input) return null;
  const resolved = path.resolve(input);
  let information;
  try {
    information = await stat(resolved);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`${label} source does not exist: ${input}`);
    throw error;
  }
  if (!information.isFile()) throw new Error(`${label} source is not a file: ${input}`);
  return resolved;
}

function storedSourcePath(resolved) {
  if (!resolved) return "";
  const relative = path.relative(projectRoot, resolved);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative.split(path.sep).join("/")
    : resolved;
}

function readBits(buffer, state, count) {
  let value = 0;
  for (let index = 0; index < count; index += 1) {
    if (state.bit >= buffer.length * 8) throw new Error("truncated SWF RECT");
    const byte = buffer[Math.floor(state.bit / 8)];
    value = value * 2 + ((byte >> (7 - (state.bit % 8))) & 1);
    state.bit += 1;
  }
  return value;
}

function readSignedBits(buffer, state, count) {
  const value = readBits(buffer, state, count);
  const sign = 2 ** (count - 1);
  return value >= sign ? value - 2 ** count : value;
}

function parseTimelineHeader(body) {
  const state = { bit: 0 };
  const fieldBits = readBits(body, state, 5);
  if (fieldBits < 2 || fieldBits > 31) throw new Error("invalid SWF RECT bit width");
  const xMin = readSignedBits(body, state, fieldBits);
  const xMax = readSignedBits(body, state, fieldBits);
  const yMin = readSignedBits(body, state, fieldBits);
  const yMax = readSignedBits(body, state, fieldBits);
  const rectBytes = Math.ceil(state.bit / 8);
  if (body.length < rectBytes + 4) throw new Error("truncated SWF timeline header");
  const fps = body.readUInt16LE(rectBytes) / 256;
  const frameCount = body.readUInt16LE(rectBytes + 2);
  const width = (xMax - xMin) / 20;
  const height = (yMax - yMin) / 20;
  if (!(width > 0 && height > 0 && fps > 0 && frameCount > 0)) throw new Error("invalid SWF timeline values");
  return {
    stage: { width, height },
    fps,
    frameCount,
    durationMs: frameCount * 1000 / fps,
  };
}

async function readUncompressedPrefix(filePath, signature, length = 64) {
  if (signature === "FWS") {
    const handle = await open(filePath, "r");
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 8);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }
  if (signature !== "CWS") return null;
  const inflater = createReadStream(filePath, { start: 8 }).pipe(createInflate());
  const chunks = [];
  let total = 0;
  for await (const chunk of inflater) {
    const needed = Math.min(chunk.length, length - total);
    chunks.push(chunk.subarray(0, needed));
    total += needed;
    if (total >= length) break;
  }
  return Buffer.concat(chunks, total);
}

export async function readSwfHeader(filePath) {
  const information = await stat(filePath);
  if (!information.isFile() || information.size < 8) return null;
  const handle = await open(filePath, "r");
  const header = Buffer.alloc(8);
  try {
    const { bytesRead } = await handle.read(header, 0, 8, 0);
    if (bytesRead !== 8) return null;
  } finally {
    await handle.close();
  }
  const signature = header.toString("ascii", 0, 3);
  const version = header[3];
  const declaredFileLength = header.readUInt32LE(4);
  if (!["FWS", "CWS", "ZWS"].includes(signature) || version < 1 || declaredFileLength < 8) return null;
  if (signature === "FWS" && declaredFileLength !== information.size) return null;

  const metadata = { swfSignature: signature, swfVersion: version, declaredFileLength };
  if (signature === "ZWS") return metadata;
  try {
    const body = await readUncompressedPrefix(filePath, signature);
    return { ...metadata, ...parseTimelineHeader(body) };
  } catch {
    return null;
  }
}

function usage() {
  return `Usage:
  npm run scaffold:migration -- <animation-id> [--fla <path>] [--swf <path>] [--output <directory>]

Example:
  npm run scaffold:migration -- Conversion_1_5 --fla source-assets/flash/Conversion_1_5.fla --swf source-assets/flash/Conversion_1_5.swf`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function initializeCapturePlanning(manifest, coverage, swfHeader) {
  const rootFrameCount = swfHeader?.frameCount;
  const rootDomain = manifest.implementation?.frameDomains?.find(({id}) => id === "root");
  if (rootDomain) rootDomain.frameCount = Number.isInteger(rootFrameCount) && rootFrameCount > 0 ? rootFrameCount : null;
  for (const requirement of coverage.requirements || []) {
    requirement.requiredRange = Number.isInteger(rootFrameCount) && rootFrameCount > 0
      ? {firstFrame: 1, lastFrame: rootFrameCount}
      : null;
    requirement.entryState = {kind: "initial-load", language: requirement.language};
    requirement.entryStateSha256 = createHash("sha256")
      .update(canonicalJson(requirement.entryState))
      .digest("hex");
    requirement.capturedFrameCount = 0;
    requirement.missingFrames = Number.isInteger(rootFrameCount) && rootFrameCount > 0
      ? Array.from({length: rootFrameCount}, (_, index) => index + 1)
      : [];
  }
  return {manifest, coverage};
}

export function parseArguments(argv) {
  const options = { output: path.join(projectRoot, "migrations") };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (["--fla", "--swf", "--output"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      options[value.slice(2)] = next;
      index += 1;
    } else if (value.startsWith("--")) throw new Error(`Unknown option: ${value}`);
    else positional.push(value);
  }

  options.id = positional[0];
  if (positional.length > 1) throw new Error("Provide exactly one animation ID");
  return options;
}

async function replaceTokens(directory, replacements) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(entryPath, replacements);
      continue;
    }
    const info = await stat(entryPath);
    if (info.size > 2_000_000) continue;
    let content = await readFile(entryPath, "utf8");
    for (const [token, replacement] of Object.entries(replacements)) {
      content = content.replaceAll(token, replacement);
    }
    await writeFile(entryPath, content);
  }
}

export async function scaffoldMigration(options) {
  const { id } = options;
  if (!id) throw new Error(`Animation ID is required\n\n${usage()}`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
    throw new Error("Animation ID may contain only letters, numbers, dots, underscores, and hyphens");
  }

  const flaPath = await resolveSource(options.fla, "FLA");
  const swfPath = await resolveSource(options.swf, "SWF");
  const flaSha256 = flaPath ? await sha256File(flaPath) : "";
  const swfSha256 = swfPath ? await sha256File(swfPath) : "";
  const swfHeader = swfPath ? await readSwfHeader(swfPath) : null;
  const storedFla = storedSourcePath(flaPath);
  const storedSwf = storedSourcePath(swfPath);

  const outputRoot = path.resolve(options.output || path.join(projectRoot, "migrations"));
  const destination = path.join(outputRoot, id);
  await mkdir(outputRoot, { recursive: true });

  try {
    await stat(destination);
    throw new Error(`Migration already exists: ${destination}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  try {
    await cp(templateRoot, destination, { recursive: true, errorOnExist: true });
    for (const relative of [
      "audit",
      "baseline/keyframes",
      "evidence/implementation",
      "evidence/diffs",
    ]) {
      const directory = path.join(destination, relative);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, ".gitkeep"), "");
    }

    await replaceTokens(destination, {
      "{{ANIMATION_ID}}": id,
      "{{CREATED_DATE}}": new Date().toISOString().slice(0, 10),
      "{{FLA_PATH}}": storedFla,
      "{{SWF_PATH}}": storedSwf,
    });

    const manifestPath = path.join(destination, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.status = flaPath || swfPath ? "preserved" : "discovered";
    manifest.assetId = swfSha256 ? `swf-${swfSha256}` : "";
    Object.assign(manifest.source, {
      placementPath: storedSwf || storedFla,
      fla: storedFla,
      swf: storedSwf,
      flaSha256,
      swfSha256,
      pairedFlaStatus: flaPath ? "present" : swfPath ? "missing" : "not-applicable",
    });
    if (swfHeader) Object.assign(manifest.runtime, swfHeader);
    const coveragePath = path.join(destination, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    initializeCapturePlanning(manifest, coverage, swfHeader);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }

  return destination;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const destination = await scaffoldMigration(options);
    console.log(`Created migration workspace: ${destination}`);
    console.log(`Next: node skills/flash-to-js/scripts/validate_migration.mjs ${destination} --allow-draft`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
