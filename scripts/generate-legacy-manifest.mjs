#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, mkdir, opendir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SOURCE = "HELP MATH_ORIGINAL FILES";
const DEFAULT_CONCURRENCY = 4;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toPortablePath(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function resolvePotentialPath(candidate) {
  let cursor = path.resolve(candidate);
  const missingSegments = [];

  while (true) {
    try {
      const resolved = await realpath(cursor);
      return path.join(resolved, ...missingSegments.reverse());
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      missingSegments.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

async function collectFiles(sourceRoot, currentDirectory = sourceRoot, files = []) {
  const directory = await opendir(currentDirectory);

  for await (const entry of directory) {
    const absolutePath = path.join(currentDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported in the legacy archive: ${absolutePath}`);
    }
    if (entry.isDirectory()) {
      await collectFiles(sourceRoot, absolutePath, files);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Unsupported filesystem entry in the legacy archive: ${absolutePath}`);
    }

    files.push({
      absolutePath,
      relativePath: toPortablePath(path.relative(sourceRoot, absolutePath)),
    });
  }

  return files;
}

async function hashFile(file) {
  const before = await stat(file.absolutePath);
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    const stream = createReadStream(file.absolutePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });

  const after = await stat(file.absolutePath);
  if (
    before.size !== after.size ||
    before.ino !== after.ino ||
    before.mtimeMs !== after.mtimeMs ||
    before.ctimeMs !== after.ctimeMs
  ) {
    throw new Error(`Source changed while it was being hashed: ${file.absolutePath}`);
  }

  const sha256 = hash.digest("hex");
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error(`Failed to calculate SHA-256 for ${file.absolutePath}`);
  }

  return {
    record: {
      path: file.relativePath,
      bytes: before.size,
      sha256,
    },
    snapshot: {
      size: after.size,
      ino: after.ino,
      mtimeMs: after.mtimeMs,
      ctimeMs: after.ctimeMs,
    },
  };
}

function matchesSnapshot(info, snapshot) {
  return (
    info.size === snapshot.size &&
    info.ino === snapshot.ino &&
    info.mtimeMs === snapshot.mtimeMs &&
    info.ctimeMs === snapshot.ctimeMs
  );
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), Math.max(1, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function renderCsv(files) {
  const rows = ["path,bytes,sha256"];
  for (const file of files) {
    rows.push(`${csvCell(file.path)},${file.bytes},${file.sha256}`);
  }
  return `${rows.join("\n")}\n`;
}

function renderSha256(files) {
  for (const file of files) {
    if (file.path.includes("\n") || file.path.includes("\r")) {
      throw new Error(`Cannot represent a filename containing a newline in SHA256 format: ${file.path}`);
    }
  }
  return files.map((file) => `${file.sha256}  ${file.path}`).join("\n") + (files.length ? "\n" : "");
}

function renderJson(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function writeOutput(outputPath, contents) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, { encoding: "utf8", flag: "w" });
}

export async function generateLegacyManifest({
  source = DEFAULT_SOURCE,
  csv,
  json,
  sha256,
  concurrency = DEFAULT_CONCURRENCY,
  generatedAt = new Date().toISOString(),
} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error("concurrency must be an integer from 1 to 32");
  }

  const requestedSourceRoot = path.resolve(source);
  await lstat(requestedSourceRoot).catch((error) => {
    if (error?.code === "ENOENT") throw new Error(`Legacy source directory does not exist: ${requestedSourceRoot}`);
    throw error;
  });
  const sourceRoot = await realpath(requestedSourceRoot);
  const sourceInfo = await stat(sourceRoot);
  if (!sourceInfo.isDirectory()) {
    throw new Error(`Legacy source must resolve to a directory: ${requestedSourceRoot}`);
  }

  const outputOptions = { csv, json, sha256 };
  const resolvedOutputs = Object.fromEntries(
    Object.entries(outputOptions)
      .filter(([, value]) => value !== undefined)
      .map(([format, value]) => [format, path.resolve(value)]),
  );

  const outputPaths = Object.values(resolvedOutputs);
  if (new Set(outputPaths).size !== outputPaths.length) {
    throw new Error("CSV, JSON, and SHA256 outputs must use different paths");
  }
  for (const outputPath of outputPaths) {
    const resolvedOutputPath = await resolvePotentialPath(outputPath);
    if (
      isWithin(requestedSourceRoot, outputPath) ||
      isWithin(sourceRoot, outputPath) ||
      isWithin(sourceRoot, resolvedOutputPath)
    ) {
      throw new Error(`Refusing to write a manifest inside the legacy source directory: ${outputPath}`);
    }
  }

  const discovered = await collectFiles(sourceRoot);
  discovered.sort((left, right) => comparePaths(left.relativePath, right.relativePath));
  const hashed = await mapWithConcurrency(discovered, concurrency, hashFile);

  const finalFiles = await collectFiles(sourceRoot);
  finalFiles.sort((left, right) => comparePaths(left.relativePath, right.relativePath));
  if (
    finalFiles.length !== discovered.length ||
    finalFiles.some((file, index) => file.relativePath !== discovered[index].relativePath)
  ) {
    throw new Error("Source tree changed while the archive manifest was being generated");
  }

  const files = await mapWithConcurrency(finalFiles, concurrency, async (file, index) => {
    const finalInfo = await stat(file.absolutePath);
    if (!matchesSnapshot(finalInfo, hashed[index].snapshot)) {
      throw new Error(`Source changed while the archive manifest was being generated: ${file.absolutePath}`);
    }
    return hashed[index].record;
  });
  const checksumSetHash = createHash("sha256");
  for (const file of files) checksumSetHash.update(`${JSON.stringify([file.path, file.bytes, file.sha256])}\n`);
  const manifest = {
    schemaVersion: 1,
    generatedAt,
    sourceDirectory: path.basename(requestedSourceRoot),
    algorithm: "sha256",
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    checksumSetSha256: checksumSetHash.digest("hex"),
    files,
  };

  const rendered = {
    csv: renderCsv(files),
    json: renderJson(manifest),
    sha256: resolvedOutputs.sha256 ? renderSha256(files) : undefined,
  };
  await Promise.all(
    Object.entries(resolvedOutputs).map(([format, outputPath]) => writeOutput(outputPath, rendered[format])),
  );

  return {
    ...manifest,
    sourceRoot: requestedSourceRoot,
    resolvedSourceRoot: sourceRoot,
    outputs: resolvedOutputs,
  };
}

function usage() {
  return `Generate a read-only inventory of the HELP Math legacy archive.

Usage:
  node scripts/generate-legacy-manifest.mjs [options]

Options:
  --source <directory>     Source directory (default: "${DEFAULT_SOURCE}")
  --csv <file>             Write a CSV inventory
  --json <file>            Write a JSON inventory
  --sha256 <file>          Write a shasum-compatible SHA-256 manifest
  --concurrency <1-32>     Concurrent file streams (default: ${DEFAULT_CONCURRENCY})
  --help                    Show this help

At least one output option is required. Output paths inside the source directory
are rejected so the legacy evidence is never changed by this command.
`;
}

function parseArguments(argv) {
  const options = {};
  const valueOptions = new Set(["source", "csv", "json", "sha256", "concurrency"]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (!argument.startsWith("--")) throw new Error(`Unexpected argument: ${argument}`);

    const key = argument.slice(2);
    if (!valueOptions.has(key)) throw new Error(`Unknown option: ${argument}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    if (options[key] !== undefined) throw new Error(`Option provided more than once: ${argument}`);
    options[key] = key === "concurrency" ? Number(value) : value;
    index += 1;
  }

  if (!options.csv && !options.json && !options.sha256) {
    throw new Error("Provide at least one of --csv, --json, or --sha256");
  }
  return options;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(usage());
      return;
    }
    const result = await generateLegacyManifest(options);
    process.stdout.write(
      `Hashed ${result.fileCount} files (${result.totalBytes} bytes) from ${result.sourceRoot}\n` +
      Object.entries(result.outputs).map(([format, outputPath]) => `${format.toUpperCase()}: ${outputPath}`).join("\n") +
      "\n",
    );
  } catch (error) {
    process.stderr.write(`Archive manifest failed: ${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) await main();
