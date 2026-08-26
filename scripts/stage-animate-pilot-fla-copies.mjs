#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, copyFile, lstat, mkdir, readFile, realpath, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_OUTPUT = path.join(ROOT, "work", "animate", "read-only-fla-copies");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

async function verifyRegularFile(file, label) {
  const info = await lstat(file);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  return info;
}

async function inspectFlaPilot({root, outputRoot, pilot, check}) {
  invariant(pilot.fla, `${pilot.id}: pilot has no FLA`);
  const migrationFile = path.join(root, "migrations", pilot.id, "migration.json");
  const migration = JSON.parse(await readFile(migrationFile, "utf8"));
  invariant(migration.source?.fla === pilot.fla, `${pilot.id}: migration FLA path differs from registry`);
  const sourceFile = path.resolve(root, pilot.fla);
  await verifyRegularFile(sourceFile, `${pilot.id} source FLA`);
  const sourceReal = await realpath(sourceFile);
  const sourceRootReal = await realpath(path.join(root, "source-assets"));
  invariant(sourceReal.startsWith(`${sourceRootReal}${path.sep}`), `${pilot.id}: source FLA resolves outside source-assets`);
  const sourceBytes = await readFile(sourceFile);
  const sourceSha256 = sha256(sourceBytes);
  invariant(sourceSha256 === migration.source.flaSha256, `${pilot.id}: source FLA hash mismatch`);

  const destination = path.join(outputRoot, pilot.id, path.basename(sourceFile));
  if (!(await exists(destination))) {
    invariant(!check, `${pilot.id}: read-only working copy is missing`);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(sourceFile, destination);
    await chmod(destination, 0o444);
  }
  const destinationInfo = await verifyRegularFile(destination, `${pilot.id} working copy`);
  const destinationBytes = await readFile(destination);
  const destinationSha256 = sha256(destinationBytes);
  invariant(destinationSha256 === sourceSha256, `${pilot.id}: working copy differs from source FLA`);
  invariant((destinationInfo.mode & 0o222) === 0, `${pilot.id}: working copy is writable`);
  return {
    animationId: pilot.id,
    source: {file: pilot.fla, sha256: sourceSha256, bytes: sourceBytes.length},
    workingCopy: {
      file: portable(root, destination),
      sha256: destinationSha256,
      bytes: destinationBytes.length,
      readOnly: true,
      byteIdenticalToSource: true,
    },
  };
}

export async function stageAnimateFlaCopies({
  root = ROOT,
  outputRoot = path.join(root, path.relative(ROOT, DEFAULT_OUTPUT)),
  pilots = PILOT_MIGRATIONS,
  check = false,
} = {}) {
  const selected = pilots.filter(({fla}) => fla);
  invariant(selected.length === 8 || root !== ROOT, `Expected 8 FLA-backed pilots, received ${selected.length}`);
  const ids = new Set();
  for (const pilot of selected) {
    invariant(!ids.has(pilot.id), `Duplicate pilot ID: ${pilot.id}`);
    ids.add(pilot.id);
  }
  if (!check) await mkdir(outputRoot, {recursive: true});
  const entries = [];
  for (const pilot of selected) entries.push(await inspectFlaPilot({root, outputRoot, pilot, check}));
  const scriptBytes = await readFile(path.join(root, path.relative(ROOT, SCRIPT_PATH)));
  const manifest = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-read-only-pilot-fla-working-copies",
    scope: "Byte-identical, read-only working copies for authoring inspection; no runtime or acceptance authority",
    generatedBy: {file: "scripts/stage-animate-pilot-fla-copies.mjs", sha256: sha256(scriptBytes)},
    summary: {
      flaBackedPilots: entries.length,
      copiesReady: entries.length,
      allReadOnly: entries.every(({workingCopy}) => workingCopy.readOnly),
      allByteIdentical: entries.every(({workingCopy}) => workingCopy.byteIdenticalToSource),
      strictAcceptanceEffect: false,
    },
    entries,
  };
  const manifestFile = path.join(outputRoot, "manifest.json");
  const expected = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    invariant(await readFile(manifestFile, "utf8") === expected, `${portable(root, manifestFile)} is stale`);
  } else {
    await writeFile(manifestFile, expected);
  }
  return {manifest, manifestFile};
}

export function parseArguments(argv) {
  const options = {check: false, outputRoot: DEFAULT_OUTPUT};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--output") options.outputRoot = path.resolve(argv[++index] || invariant(false, "--output requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/stage-animate-pilot-fla-copies.mjs [--check] [--output <work-dir>]");
    return;
  }
  const result = await stageAnimateFlaCopies(options);
  console.log(JSON.stringify(result.manifest.summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

