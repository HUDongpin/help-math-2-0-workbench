#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
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
const defaultCatalogRoot = path.join(projectRoot, "catalog");
const canonicalRootLabel = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const manifestLabel = "catalog/source-manifest.sha256";

function usage() {
  return `Usage:
  node scripts/freeze-help-math-sources.mjs --write [--source <directory>] [--catalog-root <directory>]
  node scripts/freeze-help-math-sources.mjs --verify [--source <directory>] [--catalog-root <directory>]
  node scripts/freeze-help-math-sources.mjs --relocate

--write         Recursively remove write bits, hash the source tree, and
                atomically replace the manifest and freeze summary.
--verify        Verify source hashes, summary totals, read-only permissions,
                and (for default paths) the compatibility symlink.
--relocate      Verify, move the default source tree under source-assets/flash,
                create the compatibility symlink, then verify again.
--source        Use an explicit source directory for staging or tests.
--catalog-root  Use an explicit catalog directory for staging or tests.

The compatibility symlink is required and verified only when both source and
catalog use their project-default paths. Path overrides are not accepted with
--relocate.`;
}

function parseArguments(argv, { cwd = process.cwd() } = {}) {
  let mode;
  let sourceRoot;
  let catalogRoot;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (["--write", "--verify", "--relocate"].includes(argument)) {
      if (mode) throw new Error(`Choose exactly one mode; received ${mode} and ${argument}`);
      mode = argument.slice(2);
      continue;
    }
    if (argument === "--source" || argument === "--catalog-root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a directory argument`);
      }
      index += 1;
      if (argument === "--source") {
        if (sourceRoot) throw new Error("--source may be specified only once");
        sourceRoot = path.resolve(cwd, value);
      } else {
        if (catalogRoot) throw new Error("--catalog-root may be specified only once");
        catalogRoot = path.resolve(cwd, value);
      }
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (help) return { help: true };
  if (!mode) throw new Error("Choose exactly one of --write, --verify, or --relocate");
  if (mode === "relocate" && (sourceRoot || catalogRoot)) {
    throw new Error("--relocate only supports the project-default source and catalog paths");
  }

  return {
    help: false,
    mode,
    sourceRoot,
    catalogRoot,
    defaultPaths: !sourceRoot && !catalogRoot,
  };
}

async function pathKind(target) {
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink()) return "symlink";
    if (info.isDirectory()) return "directory";
    if (info.isFile()) return "file";
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

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

async function createFreezeContext({
  sourceRoot,
  catalogRoot = defaultCatalogRoot,
  defaultPaths = false,
}) {
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const resolvedCatalogRoot = path.resolve(catalogRoot);
  const sourceKind = await pathKind(resolvedSourceRoot);
  if (sourceKind !== "directory") {
    throw new Error(`Source must be a real directory, not ${sourceKind}: ${resolvedSourceRoot}`);
  }
  const catalogKind = await pathKind(resolvedCatalogRoot);
  if (!['missing', 'directory'].includes(catalogKind)) {
    throw new Error(
      `Catalog root must be a real directory or a missing path, not ${catalogKind}: ${resolvedCatalogRoot}`,
    );
  }
  if (isWithin(resolvedSourceRoot, resolvedCatalogRoot)) {
    throw new Error(`Catalog root must not be inside the frozen source tree: ${resolvedCatalogRoot}`);
  }
  if (defaultPaths) {
    if (resolvedSourceRoot !== canonicalPath || resolvedCatalogRoot !== defaultCatalogRoot) {
      throw new Error("defaultPaths requires the canonical project source and catalog paths");
    }
  }
  return {
    sourceRoot: resolvedSourceRoot,
    catalogRoot: resolvedCatalogRoot,
    manifestPath: path.join(resolvedCatalogRoot, "source-manifest.sha256"),
    summaryPath: path.join(resolvedCatalogRoot, "source-freeze.json"),
    defaultPaths,
  };
}

async function contextFromArguments(options) {
  const sourceRoot = options.sourceRoot ?? await resolveSourceRoot();
  return createFreezeContext({
    sourceRoot,
    catalogRoot: options.catalogRoot ?? defaultCatalogRoot,
    defaultPaths: options.defaultPaths,
  });
}

async function walkSourceTree(root) {
  const files = [];
  const directories = [];

  async function visit(directory) {
    const directoryInfo = await lstat(directory);
    if (directoryInfo.isSymbolicLink() || !directoryInfo.isDirectory()) {
      throw new Error(`Unsupported source directory entry: ${manifestRelativePath(root, directory) || "."}`);
    }
    directories.push(directory);
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      const info = await lstat(entryPath);
      if (info.isSymbolicLink()) {
        throw new Error(`Source tree contains a symbolic link: ${manifestRelativePath(root, entryPath)}`);
      }
      if (info.isDirectory()) await visit(entryPath);
      else if (info.isFile()) files.push(entryPath);
      else {
        throw new Error(`Source tree contains an unsupported entry: ${manifestRelativePath(root, entryPath)}`);
      }
    }
  }

  await visit(root);
  return { files, directories };
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
  const { files } = await walkSourceTree(root);
  const records = await mapConcurrent(files, 6, async (filePath) => {
    const before = await lstat(filePath);
    if (!before.isFile() || before.isSymbolicLink()) {
      throw new Error(`Source entry changed while inventorying: ${manifestRelativePath(root, filePath)}`);
    }
    const digest = await sha256(filePath);
    const after = await lstat(filePath);
    if (
      !after.isFile()
      || after.isSymbolicLink()
      || before.dev !== after.dev
      || before.ino !== after.ino
      || before.size !== after.size
      || before.mtimeMs !== after.mtimeMs
    ) {
      throw new Error(`Source file changed while inventorying: ${manifestRelativePath(root, filePath)}`);
    }
    return {
      path: manifestRelativePath(root, filePath),
      bytes: after.size,
      sha256: digest,
    };
  });
  records.sort((left, right) => left.path.localeCompare(right.path, "en"));
  return {
    records,
    bytes: records.reduce((total, record) => total + record.bytes, 0),
  };
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
      const relativePath = match[2];
      if (
        relativePath.includes("\\")
        || path.posix.isAbsolute(relativePath)
        || relativePath === ".."
        || relativePath.startsWith("../")
        || path.posix.normalize(relativePath) !== relativePath
        || relativePath === "."
      ) {
        throw new Error(`Unsafe manifest path on line ${index + 1}: ${relativePath}`);
      }
      return { sha256: match[1].toLowerCase(), path: relativePath };
    });
}

async function restoreModes(changes) {
  const errors = [];
  for (const change of [...changes].reverse()) {
    try {
      await chmod(change.path, change.mode);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) throw new AggregateError(errors, "Failed to restore source permissions");
}

async function enforceReadOnly(root) {
  const tree = await walkSourceTree(root);
  const targets = [
    ...tree.files,
    ...tree.directories.sort((left, right) => right.length - left.length),
  ];
  const changes = [];
  try {
    for (const target of targets) {
      const info = await lstat(target);
      if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) {
        throw new Error(`Source entry changed while freezing: ${manifestRelativePath(root, target) || "."}`);
      }
      const currentMode = info.mode & 0o7777;
      const readOnlyMode = currentMode & ~0o222;
      if (readOnlyMode !== currentMode) {
        await chmod(target, readOnlyMode);
        changes.push({ path: target, mode: currentMode });
      }
    }
    return changes;
  } catch (error) {
    try {
      await restoreModes(changes);
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Source freeze and permission rollback both failed");
    }
    throw error;
  }
}

async function writableEntries(root) {
  const tree = await walkSourceTree(root);
  const writable = [];
  for (const target of [...tree.directories, ...tree.files]) {
    const info = await lstat(target);
    if ((info.mode & 0o222) !== 0) {
      writable.push(manifestRelativePath(root, target) || ".");
    }
  }
  return writable;
}

async function verifyCompatibilitySymlink({
  compatibility = compatibilityPath,
  canonical = canonicalPath,
} = {}) {
  const compatibilityKind = await pathKind(compatibility);
  if (compatibilityKind !== "symlink") {
    throw new Error(`Compatibility path must be a symbolic link: ${compatibility}`);
  }
  const canonicalKind = await pathKind(canonical);
  if (canonicalKind !== "directory") {
    throw new Error(`Canonical source path must be a real directory: ${canonical}`);
  }
  const [compatibilityRealPath, canonicalRealPath] = await Promise.all([
    realpath(compatibility),
    realpath(canonical),
  ]);
  if (compatibilityRealPath !== canonicalRealPath) {
    throw new Error(
      `Compatibility symlink resolves to ${compatibilityRealPath}, not ${canonicalRealPath}`,
    );
  }
  return { compatibilityRealPath, canonicalRealPath };
}

async function assertReplaceableFile(target) {
  const kind = await pathKind(target);
  if (kind !== "missing" && kind !== "file") {
    throw new Error(`Refusing to replace non-file catalog entry (${kind}): ${target}`);
  }
}

async function replaceFreezeFilesAtomically({
  manifestPath,
  manifestContents,
  summaryPath,
  summaryContents,
  validate = async () => {},
}) {
  if (path.resolve(manifestPath) === path.resolve(summaryPath)) {
    throw new Error("Manifest and summary paths must be different");
  }
  await Promise.all([
    mkdir(path.dirname(manifestPath), { recursive: true }),
    mkdir(path.dirname(summaryPath), { recursive: true }),
  ]);
  await Promise.all([
    assertReplaceableFile(manifestPath),
    assertReplaceableFile(summaryPath),
  ]);

  const token = `${process.pid}-${randomUUID()}`;
  const entries = [
    {
      target: manifestPath,
      temporary: `${manifestPath}.tmp-${token}`,
      backup: `${manifestPath}.bak-${token}`,
      contents: manifestContents,
      hadOriginal: (await pathKind(manifestPath)) === "file",
      backedUp: false,
      installed: false,
    },
    {
      target: summaryPath,
      temporary: `${summaryPath}.tmp-${token}`,
      backup: `${summaryPath}.bak-${token}`,
      contents: summaryContents,
      hadOriginal: (await pathKind(summaryPath)) === "file",
      backedUp: false,
      installed: false,
    },
  ];

  try {
    await Promise.all(entries.map((entry) => writeFile(
      entry.temporary,
      entry.contents,
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    )));
    for (const entry of entries) {
      if (entry.hadOriginal) {
        await rename(entry.target, entry.backup);
        entry.backedUp = true;
      }
    }
    for (const entry of entries) {
      await rename(entry.temporary, entry.target);
      entry.installed = true;
    }
    await validate();
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...entries].reverse()) {
      try {
        if (entry.installed) await rm(entry.target, { force: true });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      try {
        if (entry.backedUp) await rename(entry.backup, entry.target);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      try {
        await rm(entry.temporary, { force: true });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "Catalog transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }

  const cleanupErrors = [];
  for (const entry of entries) {
    if (!entry.backedUp) continue;
    try {
      await rm(entry.backup, { force: true });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, "Catalog transaction committed but backup cleanup failed");
  }
}

function summaryForSnapshot(snapshot, manifestContents) {
  return {
    schemaVersion: 1,
    legacyName,
    canonicalRoot: canonicalRootLabel,
    compatibilityPath: legacyName,
    manifest: manifestLabel,
    fileCount: snapshot.records.length,
    totalBytes: snapshot.bytes,
    manifestSha256: createHash("sha256").update(manifestContents).digest("hex"),
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  };
}

function validateSummaryShape(summary) {
  const errors = [];
  const fixedFields = {
    schemaVersion: 1,
    legacyName,
    canonicalRoot: canonicalRootLabel,
    compatibilityPath: legacyName,
    manifest: manifestLabel,
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  };
  for (const [field, expected] of Object.entries(fixedFields)) {
    if (summary[field] !== expected) {
      errors.push(`summary ${field} must equal ${JSON.stringify(expected)}`);
    }
  }
  if (!Number.isSafeInteger(summary.fileCount) || summary.fileCount < 0) {
    errors.push("summary fileCount must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(summary.totalBytes) || summary.totalBytes < 0) {
    errors.push("summary totalBytes must be a non-negative safe integer");
  }
  if (!/^[a-f0-9]{64}$/.test(summary.manifestSha256 ?? "")) {
    errors.push("summary manifestSha256 must be a lowercase SHA-256 digest");
  }
  return errors;
}

async function verifyFreezeContext(context) {
  if (context.defaultPaths) await verifyCompatibilitySymlink();

  const [manifestContents, summaryContents] = await Promise.all([
    readFile(context.manifestPath, "utf8"),
    readFile(context.summaryPath, "utf8"),
  ]);
  let summary;
  try {
    summary = JSON.parse(summaryContents);
  } catch (error) {
    throw new Error(`Invalid freeze summary JSON: ${error.message}`);
  }
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    throw new Error("Invalid freeze summary: expected a JSON object");
  }

  const expected = parseManifest(manifestContents);
  const errors = validateSummaryShape(summary);
  const manifestDigest = createHash("sha256").update(manifestContents).digest("hex");
  if (summary.manifestSha256 !== manifestDigest) {
    errors.push(
      `summary manifestSha256 ${summary.manifestSha256} does not match manifest ${manifestDigest}`,
    );
  }

  const expectedByPath = new Map();
  for (const record of expected) {
    if (expectedByPath.has(record.path)) errors.push(`duplicate manifest path: ${record.path}`);
    else expectedByPath.set(record.path, record);
  }
  if (summary.fileCount !== expected.length) {
    errors.push(`summary fileCount ${summary.fileCount} does not match manifest count ${expected.length}`);
  }

  const [actual, writable] = await Promise.all([
    inventory(context.sourceRoot),
    writableEntries(context.sourceRoot),
  ]);
  const actualByPath = new Map(actual.records.map((record) => [record.path, record]));
  for (const record of expected) {
    const found = actualByPath.get(record.path);
    if (!found) errors.push(`missing: ${record.path}`);
    else if (found.sha256 !== record.sha256) errors.push(`changed: ${record.path}`);
  }
  for (const record of actual.records) {
    if (!expectedByPath.has(record.path)) errors.push(`unexpected: ${record.path}`);
  }
  if (summary.fileCount !== actual.records.length) {
    errors.push(
      `summary fileCount ${summary.fileCount} does not match source count ${actual.records.length}`,
    );
  }
  if (summary.totalBytes !== actual.bytes) {
    errors.push(`summary totalBytes ${summary.totalBytes} does not match source bytes ${actual.bytes}`);
  }
  if (writable.length) {
    errors.push(
      `source has ${writable.length} writable entr${writable.length === 1 ? "y" : "ies"}: ${writable.slice(0, 20).join(", ")}`,
    );
  }

  if (errors.length) {
    throw new Error(
      `Source verification failed (${errors.length} issue(s)):\n${errors.slice(0, 30).join("\n")}`,
    );
  }
  return {
    fileCount: actual.records.length,
    totalBytes: actual.bytes,
    manifestSha256: manifestDigest,
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  };
}

async function verifyManifest(root, options = {}) {
  const context = await createFreezeContext({
    sourceRoot: root,
    catalogRoot: options.catalogRoot ?? defaultCatalogRoot,
    defaultPaths: options.defaultPaths ?? false,
  });
  return verifyFreezeContext(context);
}

async function writeManifest(root, options = {}) {
  const context = await createFreezeContext({
    sourceRoot: root,
    catalogRoot: options.catalogRoot ?? defaultCatalogRoot,
    defaultPaths: options.defaultPaths ?? false,
  });
  if (context.defaultPaths) await verifyCompatibilitySymlink();

  const modeChanges = await enforceReadOnly(context.sourceRoot);
  try {
    const writable = await writableEntries(context.sourceRoot);
    if (writable.length) {
      throw new Error(`Read-only enforcement left ${writable.length} writable source entries`);
    }
    const snapshot = await inventory(context.sourceRoot);
    const manifestContents = serializeManifest(snapshot.records);
    const summary = summaryForSnapshot(snapshot, manifestContents);
    const summaryContents = `${JSON.stringify(summary, null, 2)}\n`;
    await replaceFreezeFilesAtomically({
      manifestPath: context.manifestPath,
      manifestContents,
      summaryPath: context.summaryPath,
      summaryContents,
      validate: () => verifyFreezeContext(context),
    });
    return summary;
  } catch (error) {
    try {
      await restoreModes(modeChanges);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "Freeze write failed and source permission rollback was incomplete",
      );
    }
    throw error;
  }
}

async function relocate() {
  const sourceRoot = await resolveSourceRoot();
  const sourceKind = await pathKind(compatibilityPath);
  const destinationKind = await pathKind(canonicalPath);
  await verifyManifest(sourceRoot, {
    catalogRoot: defaultCatalogRoot,
    defaultPaths: sourceRoot === canonicalPath && sourceKind === "symlink",
  });

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

  return verifyManifest(canonicalPath, {
    catalogRoot: defaultCatalogRoot,
    defaultPaths: true,
  });
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  if (options.mode === "relocate") {
    console.log(JSON.stringify(await relocate(), null, 2));
    return;
  }

  const context = await contextFromArguments(options);
  if (options.mode === "write") {
    const summary = await writeManifest(context.sourceRoot, {
      catalogRoot: context.catalogRoot,
      defaultPaths: context.defaultPaths,
    });
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  console.log(JSON.stringify(await verifyFreezeContext(context), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  enforceReadOnly,
  inventory,
  parseArguments,
  parseManifest,
  replaceFreezeFilesAtomically,
  serializeManifest,
  verifyCompatibilitySymlink,
  verifyManifest,
  writeManifest,
  writableEntries,
};
