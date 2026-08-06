#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const legacyName = "HELP MATH_ORIGINAL FILES";
const compatibilityPath = path.join(projectRoot, legacyName);
const canonicalPath = path.join(
  projectRoot,
  "source-assets",
  "flash",
  legacyName,
);
const catalogRoot = path.join(projectRoot, "catalog");
const manifestPath = path.join(catalogRoot, "source-manifest.sha256");
const summaryPath = path.join(catalogRoot, "source-freeze.json");

function usage() {
  return `Usage:
  node scripts/freeze-help-math-sources.mjs --write
  node scripts/freeze-help-math-sources.mjs --verify
  node scripts/freeze-help-math-sources.mjs --relocate

--write     Hash every file in the current source tree and write the manifest.
--verify    Verify the existing manifest against the current source tree.
--relocate  Verify, move the source tree under source-assets/flash, create the
            compatibility symlink, then verify again.`;
}

async function pathKind(target) {
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink()) return "symlink";
    if (info.isDirectory()) return "directory";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function resolveSourceRoot() {
  const compatibilityKind = await pathKind(compatibilityPath);
  if (compatibilityKind === "directory") return compatibilityPath;
  const canonicalKind = await pathKind(canonicalPath);
  if (canonicalKind === "directory") return canonicalPath;
  if (compatibilityKind === "symlink") {
    const resolved = await stat(compatibilityPath);
    if (resolved.isDirectory()) return compatibilityPath;
  }
  throw new Error(
    `Cannot find ${legacyName} at ${compatibilityPath} or ${canonicalPath}`,
  );
}

async function listFiles(root, directory = root, result = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await listFiles(root, entryPath, result);
    else if (entry.isFile()) result.push(entryPath);
  }
  return result;
}

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const input = createReadStream(filePath);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

function manifestRelativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

async function inventory(root) {
  const files = await listFiles(root);
  let bytes = 0;
  const records = await mapConcurrent(files, 6, async (filePath) => {
    const info = await stat(filePath);
    bytes += info.size;
    return {
      path: manifestRelativePath(root, filePath),
      bytes: info.size,
      sha256: await sha256(filePath),
    };
  });
  records.sort((left, right) => left.path.localeCompare(right.path, "en"));
  return { records, bytes };
}

function serializeManifest(records) {
  return `${records.map((record) => `${record.sha256}  ${record.path}`).join("\n")}\n`;
}

function parseManifest(content) {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const match = /^([a-f0-9]{64})  (.+)$/i.exec(line);
      if (!match) throw new Error(`Invalid manifest line ${index + 1}`);
      return { sha256: match[1].toLowerCase(), path: match[2] };
    });
}

async function writeManifest(root) {
  const snapshot = await inventory(root);
  await mkdir(catalogRoot, { recursive: true });
  await writeFile(manifestPath, serializeManifest(snapshot.records));
  const summary = {
    schemaVersion: 1,
    legacyName,
    canonicalRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    compatibilityPath: legacyName,
    manifest: "catalog/source-manifest.sha256",
    fileCount: snapshot.records.length,
    totalBytes: snapshot.bytes,
    manifestSha256: createHash("sha256")
      .update(serializeManifest(snapshot.records))
      .digest("hex"),
  };
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function verifyManifest(root) {
  const expected = parseManifest(await readFile(manifestPath, "utf8"));
  const actual = await inventory(root);
  const expectedByPath = new Map(expected.map((record) => [record.path, record]));
  const actualByPath = new Map(actual.records.map((record) => [record.path, record]));
  const errors = [];
  for (const record of expected) {
    const found = actualByPath.get(record.path);
    if (!found) errors.push(`missing: ${record.path}`);
    else if (found.sha256 !== record.sha256) errors.push(`changed: ${record.path}`);
  }
  for (const record of actual.records) {
    if (!expectedByPath.has(record.path)) errors.push(`unexpected: ${record.path}`);
  }
  if (errors.length) {
    throw new Error(
      `Source verification failed (${errors.length} issue(s)):\n${errors
        .slice(0, 30)
        .join("\n")}`,
    );
  }
  return { fileCount: actual.records.length, totalBytes: actual.bytes };
}

async function relocate() {
  const sourceRoot = await resolveSourceRoot();
  await verifyManifest(sourceRoot);
  const sourceKind = await pathKind(compatibilityPath);
  const destinationKind = await pathKind(canonicalPath);

  if (sourceKind === "directory") {
    if (destinationKind !== "missing") {
      throw new Error(`Refusing to overwrite existing destination: ${canonicalPath}`);
    }
    await mkdir(path.dirname(canonicalPath), { recursive: true });
    await rename(compatibilityPath, canonicalPath);
    await symlink(
      path.relative(projectRoot, canonicalPath),
      compatibilityPath,
      "dir",
    );
  } else if (!(sourceKind === "symlink" && destinationKind === "directory")) {
    throw new Error("Source is neither relocatable nor already relocated");
  }

  return verifyManifest(canonicalPath);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h") || args.size !== 1) {
    console.log(usage());
    process.exitCode = args.size === 1 ? 0 : 1;
    return;
  }

  if (args.has("--write")) {
    const summary = await writeManifest(await resolveSourceRoot());
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (args.has("--verify")) {
    console.log(JSON.stringify(await verifyManifest(await resolveSourceRoot()), null, 2));
    return;
  }
  if (args.has("--relocate")) {
    console.log(JSON.stringify(await relocate(), null, 2));
    return;
  }
  console.error(usage());
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { inventory, parseManifest, serializeManifest, verifyManifest };
