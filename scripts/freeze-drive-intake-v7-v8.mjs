#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const DEFAULT_ROOTS = Object.freeze({
  v7: "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL",
  v8: "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-03-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL-SUCCESSOR-V8",
});

export const DEFAULT_CLOSURE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-04-BOULDER-LEARNING-V7-V8-COMBINED-FREEZE-CLOSURE";

export const CLOSURE = Object.freeze({
  recordsName: "combined-freeze-manifest-v1.jsonl",
  preparedName: "combined-freeze-prepared-receipt-v1.json",
  appliedName: "combined-freeze-applied-receipt-v1.json",
  sidecarName: "combined-freeze-applied-receipt-v1.sha256",
});

const PINNED_INPUTS = Object.freeze({
  v7Baseline: {
    root: "v7",
    path: "manifests/local-sha256-baseline-v7-receipt.json",
    sha256: "122ae893c7a8bb68c8aa7b76f7f00645b02264db6c0b99c177b33f3bf3af8855",
  },
  v7FailedMain: {
    root: "v7",
    path: "manifests/main-full-execute-pending-v7-20260802T212258Z.json",
    sha256: "12a1a096c7ea49a8817977b32bdd0ef2fee5c26362bbb74cfc680ea7e274b9a2",
  },
  v7ResumeDryRunA: {
    root: "v7",
    path: "manifests/main-full-resume-metadata-dry-run-v7-a-20260803T143924Z.json",
    sha256: "2cc3f734fa45fa1ae13ea141c89519ee2cf9a66e0679dacdc42d060801d647a9",
  },
  v7ResumeDryRunB: {
    root: "v7",
    path: "manifests/main-full-resume-metadata-dry-run-v7-b-20260803T143924Z.json",
    sha256: "9af3ff514d0ce50a8e93a73fa54043509b49cd65192b3943c0eb09f25cd0428f",
  },
  v8Baseline: {
    root: "v8",
    path: "manifests/local-sha256-baseline-v8-receipt.json",
    sha256: "1c70bab45573ea573c3dfc19c180b7a48dabeee14fce062f5f7ae77e85fffd89",
  },
  v8MainFinal: {
    root: "v8",
    path: "manifests/main-full-final-v8-20260803T190320Z.json",
    sha256: "f7ef1606261f91483bfa57f8719154e579444d98d44474804bad019bc2a0511d",
  },
  v8MainPending: {
    root: "v8",
    path: "manifests/main-full-execute-pending-v8-20260803T154752Z.json",
    sha256: "a98b4b640b1c75a734564f485b600bac558a1c8a06faaf1d997744e250ffaa2c",
  },
  v8NestedFinal: {
    root: "v8",
    path: "manifests/nested-shortcut-target-final-v8-20260803T190320Z.json",
    sha256: "28f07bab0b2b3c1824d06e6fe8efe3563f95d292006946bff270954c3d6b8733",
  },
  v8NestedPending: {
    root: "v8",
    path: "manifests/nested-shortcut-target-execute-pending-v8-20260803T184718Z.json",
    sha256: "41fd7da99a6c7431452cc37fb87ceb6cece0987f9ea0c7c52ca8966bed54ba25",
  },
  v8PostFinalCheck: {
    root: "v8",
    path: "manifests/local-sha256-current-check-v8-post-final-scopes-20260803T192223Z.json",
    sha256: "82a7c7e07aa462efccc251ed35b275cac60eeea6c7f3312e258bfd8ca39d929b",
  },
});

const LEDGER_CONFIG = Object.freeze({
  v7: {
    ledgerPrefix: "manifests/drive-dedupe-ledger/sha256/",
    expectedCount: 5_793,
  },
  v8: {
    ledgerPrefix: "manifests/drive-dedupe-ledger-v8/sha256/",
    expectedCount: 267,
  },
});

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;
const READ_BUFFER_BYTES = 1024 * 1024;
const HASH_CONCURRENCY = 4;
const WRITER_LOCKS = Object.freeze({
  v7: ["manifests/.dedupe-google-drive-tree.lock", "work/.local-sha256-baseline.lock"],
  v8: ["manifests/.dedupe-google-drive-tree-v8.lock", "work/.local-sha256-baseline-v8.lock"],
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portableRelative(value, label = "path") {
  invariant(typeof value === "string" && value.length > 0, `${label} must be non-empty`);
  invariant(!value.includes("\0") && !value.includes("\\"), `${label} contains a forbidden character`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(path.posix.normalize(value) === value, `${label} must already be normalized`);
  invariant(value !== "." && value !== ".." && !value.startsWith("../"), `${label} escapes its root`);
  return value;
}

function relativePosix(root, target) {
  const relative = path.relative(root, target).split(path.sep).join("/");
  return portableRelative(relative, "tree path");
}

function nodeIdentity(info) {
  return { dev: String(info.dev), ino: String(info.ino) };
}

function sameNode(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function hashOpenHandle(handle) {
  const digest = createHash("sha256");
  const buffer = Buffer.allocUnsafe(READ_BUFFER_BYTES);
  let position = 0;
  while (true) {
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
    if (bytesRead === 0) break;
    digest.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return digest.digest("hex");
}

export async function inspectRegularFile(filePath) {
  const beforeAtPath = await lstat(filePath, { bigint: true });
  invariant(beforeAtPath.isFile() && !beforeAtPath.isSymbolicLink(), `Expected a regular file: ${filePath}`);
  invariant(beforeAtPath.nlink === 1n, `Hard-linked files are not allowed in the frozen intake: ${filePath}`);
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const beforeOpen = await handle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(beforeAtPath), nodeIdentity(beforeOpen)), `File identity changed before hashing: ${filePath}`);
    const sha256 = await hashOpenHandle(handle);
    const afterOpen = await handle.stat({ bigint: true });
    const afterAtPath = await lstat(filePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(beforeOpen), nodeIdentity(afterOpen))
        && sameNode(nodeIdentity(beforeOpen), nodeIdentity(afterAtPath))
        && beforeOpen.size === afterOpen.size
        && beforeOpen.mtimeNs === afterOpen.mtimeNs,
      `File changed while hashing: ${filePath}`,
    );
    return {
      bytes: Number(afterOpen.size),
      sha256,
      mode: Number(afterOpen.mode & 0o777n),
    };
  } finally {
    await handle.close();
  }
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

async function collectTree(root, { excluded = new Set() } = {}) {
  const resolvedRoot = path.resolve(root);
  const rootInfo = await lstat(resolvedRoot, { bigint: true });
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `Intake root must be a real directory: ${resolvedRoot}`);
  const canonicalRoot = await realpath(resolvedRoot);
  const files = [];
  const directories = [];

  async function visit(directory) {
    const info = await lstat(directory, { bigint: true });
    invariant(info.isDirectory() && !info.isSymbolicLink(), `Unsupported directory entry: ${directory}`);
    const relativeDirectory = path.relative(canonicalRoot, directory).split(path.sep).join("/") || ".";
    directories.push({
      absolutePath: directory,
      relativePath: relativeDirectory,
      mode: Number(info.mode & 0o777n),
    });
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = relativePosix(canonicalRoot, absolutePath);
      const entryInfo = await lstat(absolutePath, { bigint: true });
      invariant(!entryInfo.isSymbolicLink(), `Symbolic links are not allowed in the frozen intake: ${absolutePath}`);
      if (entryInfo.isDirectory()) {
        await visit(absolutePath);
      } else if (entryInfo.isFile()) {
        invariant(entryInfo.nlink === 1n, `Hard-linked files are not allowed in the frozen intake: ${absolutePath}`);
        if (!excluded.has(relativePath)) files.push({ absolutePath, relativePath });
      } else {
        throw new Error(`Unsupported special entry in frozen intake: ${absolutePath}`);
      }
    }
  }

  await visit(canonicalRoot);
  return { files, directories };
}

export async function inventoryRoot(root, rootLabel, { excluded = new Set() } = {}) {
  invariant(rootLabel === "v7" || rootLabel === "v8", `Unsupported root label: ${rootLabel}`);
  const tree = await collectTree(root, { excluded });
  const records = await mapConcurrent(tree.files, HASH_CONCURRENCY, async ({ absolutePath, relativePath }) => {
    const inspected = await inspectRegularFile(absolutePath);
    return {
      root: rootLabel,
      path: relativePath,
      bytes: inspected.bytes,
      sha256: inspected.sha256,
    };
  });
  records.sort((left, right) => compareText(left.path, right.path));
  return {
    root: path.resolve(root),
    records,
    directories: tree.directories,
    fileCount: records.length,
    directoryCount: tree.directories.length,
    totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
  };
}

export function serializeRecordManifest(records) {
  const sorted = [...records].sort((left, right) => {
    const rootOrder = compareText(left.root, right.root);
    return rootOrder || compareText(left.path, right.path);
  });
  return `${sorted.map((record) => JSON.stringify({
    root: record.root,
    relativePathBytesBase64: Buffer.from(record.path, "utf8").toString("base64"),
    bytes: record.bytes,
    sha256: record.sha256,
  })).join("\n")}\n`;
}

export function parseRecordManifest(contents) {
  invariant(typeof contents === "string" && contents.endsWith("\n"), "Record manifest must end with a newline");
  const lines = contents.slice(0, -1).split("\n");
  invariant(lines.length > 0 && lines[0].length > 0, "Record manifest is empty");
  const records = lines.map((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON on record-manifest line ${index + 1}`);
    }
    invariant(record && typeof record === "object" && !Array.isArray(record), `Invalid record on line ${index + 1}`);
    invariant(record.root === "v7" || record.root === "v8", `Invalid root on line ${index + 1}`);
    invariant(typeof record.relativePathBytesBase64 === "string" && record.relativePathBytesBase64.length > 0, `Missing encoded path on line ${index + 1}`);
    const pathBytes = Buffer.from(record.relativePathBytesBase64, "base64");
    invariant(pathBytes.toString("base64") === record.relativePathBytesBase64, `Non-canonical Base64 path on line ${index + 1}`);
    const decodedPath = pathBytes.toString("utf8");
    invariant(Buffer.from(decodedPath, "utf8").equals(pathBytes), `Path is not valid UTF-8 on line ${index + 1}`);
    portableRelative(decodedPath, `record path on line ${index + 1}`);
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `Invalid byte count on line ${index + 1}`);
    invariant(/^[0-9a-f]{64}$/.test(record.sha256), `Invalid SHA-256 on line ${index + 1}`);
    invariant(Object.keys(record).sort().join(",") === "bytes,relativePathBytesBase64,root,sha256", `Unexpected fields on line ${index + 1}`);
    return { root: record.root, path: decodedPath, bytes: record.bytes, sha256: record.sha256 };
  });
  const serialized = serializeRecordManifest(records);
  invariant(serialized === contents, "Record manifest is not in canonical sorted form");
  return records;
}

function recordMap(inventories) {
  const map = new Map();
  for (const inventory of inventories) {
    for (const record of inventory.records) {
      const key = `${record.root}\0${record.path}`;
      invariant(!map.has(key), `Duplicate tree record: ${record.root}:${record.path}`);
      map.set(key, record);
    }
  }
  return map;
}

async function readBoundJson(roots, records, rootLabel, relativePath) {
  portableRelative(relativePath, "bound JSON path");
  const record = records.get(`${rootLabel}\0${relativePath}`);
  invariant(record, `Bound JSON is absent from the tree manifest: ${rootLabel}:${relativePath}`);
  const absolutePath = path.join(roots[rootLabel], ...relativePath.split("/"));
  const bytes = await readFile(absolutePath);
  invariant(bytes.length === record.bytes, `Bound JSON byte count changed: ${rootLabel}:${relativePath}`);
  invariant(sha256Bytes(bytes) === record.sha256, `Bound JSON digest changed: ${rootLabel}:${relativePath}`);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`Bound JSON is invalid: ${rootLabel}:${relativePath}`);
  }
  return { value, record };
}

function assertReceiptShape(name, value) {
  if (name === "v7Baseline" || name === "v8Baseline") {
    invariant(value.schemaVersion === "help-math-local-sha256-index-receipt/v1", `${name} schema changed`);
    invariant(value.outcome === "completed-and-verified", `${name} outcome changed`);
    invariant(value.verification?.fullSha256ForEveryRegularFile === true, `${name} did not hash every regular file`);
    invariant(value.verification?.snapshotsIdentical === true, `${name} snapshots are not identical`);
    invariant(value.verification?.failureCountForPublishedPasses === 0, `${name} reports failures`);
    return;
  }
  if (name === "v7FailedMain") {
    invariant(value.schemaVersion === "help-math-drive-dedupe-batch-receipt/v1", "v7 failed receipt schema changed");
    invariant(value.outcome === "rejected-with-installed-objects-pending-reconciliation", "v7 failed outcome must be retained exactly");
    invariant(value.summary?.objectsInstalled === 5_793, "v7 failed receipt object count changed");
    invariant(value.summary?.bytesInstalled === 6_185_764_941, "v7 failed receipt byte count changed");
    invariant(value.summary?.rejectionCount === 1, "v7 failed receipt rejection count changed");
    invariant(value.summary?.dedupeRuleCompletionClaimed === false, "v7 failed receipt must not claim completion");
    invariant(value.summary?.stagingFilesRetained === 0 && value.summary?.stagingBytesRetained === 0, "v7 staging retention changed");
    return;
  }
  if (name === "v7ResumeDryRunA" || name === "v7ResumeDryRunB") {
    invariant(value.schemaVersion === "help-math-drive-dedupe-batch-receipt/v1", `${name} schema changed`);
    invariant(value.outcome === "metadata-dry-run-passed", `${name} outcome changed`);
    invariant(value.summary?.contentFilesRead === 0 && value.summary?.objectsInstalled === 0, `${name} must remain metadata-only`);
    return;
  }
  if (name === "v8MainPending" || name === "v8NestedPending") {
    const expectedObjects = name === "v8MainPending" ? 261 : 6;
    const expectedBytes = name === "v8MainPending" ? 5_421_560_163 : 455_088_033;
    invariant(value.schemaVersion === "help-math-drive-dedupe-batch-receipt/v1", `${name} schema changed`);
    invariant(value.outcome === "installed-pending-post-index-revalidation", `${name} outcome changed`);
    invariant(value.summary?.objectsInstalled === expectedObjects, `${name} object count changed`);
    invariant(value.summary?.bytesInstalled === expectedBytes, `${name} byte count changed`);
    invariant(value.summary?.dedupeRuleCompletionClaimed === false, `${name} must remain pending`);
    invariant(value.summary?.postLocalIndexCurrentCheckRequired === true, `${name} post-check requirement changed`);
    invariant(value.summary?.googleNativeObjectsExported === 0, `${name} Google-native export boundary changed`);
    invariant(value.summary?.googleNativePointersNotPersisted === (name === "v8MainPending" ? 43 : 2), `${name} pointer boundary changed`);
    invariant(value.summary?.sqlZipDispositionSkips === (name === "v8MainPending" ? 1 : 0), `${name} SQL ZIP boundary changed`);
    return;
  }
  if (name === "v8MainFinal" || name === "v8NestedFinal") {
    const expectedCount = name === "v8MainFinal" ? 261 : 6;
    invariant(value.schemaVersion === "help-math-drive-dedupe-final-receipt/v1", `${name} schema changed`);
    invariant(value.outcome === "deduplicated-and-verified", `${name} outcome changed`);
    invariant(value.persistentArtifacts?.uniqueSha256Count === expectedCount, `${name} object count changed`);
    invariant(value.persistentArtifacts?.objectAndLedgerBytesReverified === true, `${name} did not reverify object and ledger bytes`);
    invariant(value.claims?.onlyCompleteSha256DeterminedDeduplication === true, `${name} SHA-only claim changed`);
    for (const claim of ["canonicalPromotion", "acceptance", "runtimeFidelity", "publication"]) {
      invariant(value.claims?.[claim] === false, `${name} must retain ${claim}=false`);
    }
    return;
  }
  if (name === "v8PostFinalCheck") {
    invariant(value.schemaVersion === "help-math-local-sha256-current-check-receipt/v1", "v8 post-final schema changed");
    invariant(value.outcome === "current-and-verified", "v8 post-final outcome changed");
    invariant(value.verification?.fullTreeReenumerated === true, "v8 post-final tree was not re-enumerated");
    invariant(value.verification?.matchesFrozenIndex === true && value.verification?.mismatchCount === 0, "v8 post-final check reports drift");
    invariant(value.verification?.regularContentRehashed === false, "v8 post-final content-rehash fact changed unexpectedly");
    return;
  }
  throw new Error(`Unsupported pinned receipt: ${name}`);
}

export async function validateLedger({
  roots,
  records,
  rootLabel,
  ledgerPrefix,
  expectedCount,
}) {
  const ledgerPattern = new RegExp(`^${ledgerPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([0-9a-f]{2})/([0-9a-f]{64})\\.json$`);
  const objectPattern = /^downloads\/sha256\/([0-9a-f]{2})\/([0-9a-f]{64})$/;
  const ledgerRecords = [];
  const objectRecords = [];
  for (const record of records.values()) {
    if (record.root !== rootLabel) continue;
    if (record.path.startsWith(ledgerPrefix)) {
      invariant(ledgerPattern.test(record.path), `${rootLabel} ledger tree contains a malformed or orphan file: ${record.path}`);
      ledgerRecords.push(record);
    }
    if (record.path.startsWith("downloads/sha256/")) {
      invariant(objectPattern.test(record.path), `${rootLabel} object tree contains a malformed or orphan file: ${record.path}`);
      objectRecords.push(record);
    }
  }
  invariant(ledgerRecords.length === expectedCount, `${rootLabel} ledger count is ${ledgerRecords.length}, expected ${expectedCount}`);
  invariant(objectRecords.length === expectedCount, `${rootLabel} object count is ${objectRecords.length}, expected ${expectedCount}`);

  const publicRows = [];
  const digests = new Set();
  for (const ledgerRecord of ledgerRecords.sort((left, right) => compareText(left.path, right.path))) {
    const match = ledgerRecord.path.match(ledgerPattern);
    const fileDigest = match[2];
    invariant(match[1] === fileDigest.slice(0, 2), `${rootLabel} ledger bucket mismatch: ${ledgerRecord.path}`);
    const { value } = await readBoundJson(roots, records, rootLabel, ledgerRecord.path);
    invariant(value.schemaVersion === "help-math-drive-dedupe-object-ledger/v1", `${rootLabel} ledger schema changed: ${ledgerRecord.path}`);
    invariant(value.state === "installed-and-verified", `${rootLabel} ledger state changed: ${ledgerRecord.path}`);
    invariant(value.sha256 === fileDigest, `${rootLabel} ledger filename/digest mismatch: ${ledgerRecord.path}`);
    invariant(Number.isSafeInteger(value.bytes) && value.bytes >= 0, `${rootLabel} ledger byte count is invalid: ${ledgerRecord.path}`);
    const expectedObjectPath = `downloads/sha256/${fileDigest.slice(0, 2)}/${fileDigest}`;
    invariant(value.objectRelativePath === expectedObjectPath, `${rootLabel} ledger object placement changed: ${ledgerRecord.path}`);
    invariant(value.objectMode === "0600", `${rootLabel} intake-time object mode changed: ${ledgerRecord.path}`);
    invariant(value.policy?.identity === "complete SHA-256 plus byte count", `${rootLabel} ledger identity policy changed: ${ledgerRecord.path}`);
    invariant(value.policy?.intakeExcludedFromLocalIndex === true, `${rootLabel} local-index exclusion changed: ${ledgerRecord.path}`);
    invariant(value.claims?.byteIdentityOnly === true, `${rootLabel} byte-identity boundary changed: ${ledgerRecord.path}`);
    for (const claim of ["canonicalPromotion", "acceptance", "runtimeFidelity", "publication"]) {
      invariant(value.claims?.[claim] === false, `${rootLabel} ledger must retain ${claim}=false: ${ledgerRecord.path}`);
    }
    const objectRecord = records.get(`${rootLabel}\0${expectedObjectPath}`);
    invariant(objectRecord, `${rootLabel} object is missing: ${expectedObjectPath}`);
    invariant(objectRecord.sha256 === fileDigest, `${rootLabel} object SHA-256 mismatch: ${expectedObjectPath}`);
    invariant(objectRecord.bytes === value.bytes, `${rootLabel} object byte count mismatch: ${expectedObjectPath}`);
    invariant(!digests.has(fileDigest), `${rootLabel} duplicate ledger digest: ${fileDigest}`);
    digests.add(fileDigest);
    publicRows.push({
      sha256: fileDigest,
      bytes: value.bytes,
      objectRelativePath: expectedObjectPath,
      ledgerSha256: ledgerRecord.sha256,
    });
  }

  const ledgerObjectPaths = new Set(publicRows.map((row) => row.objectRelativePath));
  for (const objectRecord of objectRecords) {
    invariant(ledgerObjectPaths.has(objectRecord.path), `${rootLabel} object has no ledger: ${objectRecord.path}`);
  }
  const rowText = `${publicRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const rootedObjectText = `${publicRows
    .map((row) => `${rootLabel}\t${row.sha256}\t${row.bytes}`)
    .join("\n")}\n`;
  const rootedLedgerText = `${publicRows
    .map((row) => `${rootLabel}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  return {
    root: rootLabel,
    ledgerCount: publicRows.length,
    objectCount: publicRows.length,
    objectBytes: publicRows.reduce((sum, row) => sum + row.bytes, 0),
    digestSetSha256: sha256Bytes(`${[...digests].sort(compareText).join("\n")}\n`),
    ledgerBindingSetSha256: sha256Bytes(rowText),
    rootedObjectSetSha256: sha256Bytes(rootedObjectText),
    rootedObjectAndLedgerSetSha256: sha256Bytes(rootedLedgerText),
    digests,
    publicRows,
  };
}

export function validateUnion(v7Ledger, v8Ledger, { expectedCount = 6_060 } = {}) {
  let overlapCount = 0;
  for (const digest of v7Ledger.digests) {
    if (v8Ledger.digests.has(digest)) overlapCount += 1;
  }
  const union = new Set([...v7Ledger.digests, ...v8Ledger.digests]);
  invariant(overlapCount === 0, `v7/v8 ledger sets overlap by ${overlapCount} SHA-256 object(s)`);
  invariant(union.size === expectedCount, `v7/v8 union contains ${union.size} SHA-256 objects, expected ${expectedCount}`);
  const combinedRows = [
    ...v7Ledger.publicRows.map((row) => ({ root: "v7", ...row })),
    ...v8Ledger.publicRows.map((row) => ({ root: "v8", ...row })),
  ].sort((left, right) => compareText(left.root, right.root) || compareText(left.sha256, right.sha256));
  const rootedObjectText = `${combinedRows
    .map((row) => `${row.root}\t${row.sha256}\t${row.bytes}`)
    .join("\n")}\n`;
  const rootedLedgerText = `${combinedRows
    .map((row) => `${row.root}\t${row.sha256}\t${row.bytes}\t${row.ledgerSha256}`)
    .join("\n")}\n`;
  return {
    v7ObjectCount: v7Ledger.objectCount,
    v8ObjectCount: v8Ledger.objectCount,
    overlapCount,
    uniqueSha256Count: union.size,
    digestSetSha256: sha256Bytes(`${[...union].sort(compareText).join("\n")}\n`),
    rootedObjectSetSha256: sha256Bytes(rootedObjectText),
    rootedObjectAndLedgerSetSha256: sha256Bytes(rootedLedgerText),
  };
}

async function validatePinnedInputs(roots, records) {
  const inputs = {};
  for (const [name, pinned] of Object.entries(PINNED_INPUTS)) {
    const { value, record } = await readBoundJson(roots, records, pinned.root, pinned.path);
    invariant(record.sha256 === pinned.sha256, `${name} SHA-256 changed`);
    assertReceiptShape(name, value);
    inputs[name] = {
      root: pinned.root,
      path: pinned.path,
      bytes: record.bytes,
      sha256: record.sha256,
      schemaVersion: value.schemaVersion,
      outcome: value.outcome,
    };
  }
  return inputs;
}

async function validateV7SuccessorReconciliation(roots, records, v7Ledger) {
  const pending = PINNED_INPUTS.v8MainPending;
  const { value } = await readBoundJson(roots, records, pending.root, pending.path);
  invariant(Array.isArray(value.items) && value.items.length === 25_559, "v8 main pending item scope changed");
  const skipped = new Set();
  for (const item of value.items) {
    if (item?.status !== "skipped-local-exact-sha256") continue;
    const digest = item.firstPass?.sha256;
    invariant(/^[0-9a-f]{64}$/.test(digest), "v8 local exact-SHA skip lacks a valid first-pass digest");
    skipped.add(digest);
  }
  let represented = 0;
  for (const digest of v7Ledger.digests) {
    if (skipped.has(digest)) represented += 1;
  }
  invariant(represented === v7Ledger.digests.size, `v8 full scope represents ${represented}/${v7Ledger.digests.size} v7 SHA-256 objects`);
  return {
    predecessor: "v7-rejected-pending",
    successor: "v8-main-full-scope",
    identity: "complete SHA-256",
    requiredStatus: "skipped-local-exact-sha256",
    v7UniqueSha256Count: v7Ledger.digests.size,
    representedInV8FullScope: represented,
    missingFromV8FullScope: 0,
    v7IndependentlyFinalized: false,
  };
}

export async function buildClosureEvidence(roots = DEFAULT_ROOTS) {
  const normalizedRoots = { v7: path.resolve(roots.v7), v8: path.resolve(roots.v8) };
  invariant(normalizedRoots.v7 !== normalizedRoots.v8, "v7 and v8 roots must be different");
  const rootIdentities = {};
  for (const [rootLabel, root] of Object.entries(normalizedRoots)) {
    const info = await lstat(root, { bigint: true });
    invariant(info.isDirectory() && !info.isSymbolicLink(), `${rootLabel} is not a real directory`);
    rootIdentities[rootLabel] = {
      device: String(info.dev),
      inode: String(info.ino),
      ownerUid: String(info.uid),
      groupGid: String(info.gid),
    };
  }
  const [v7, v8] = await Promise.all([
    inventoryRoot(normalizedRoots.v7, "v7"),
    inventoryRoot(normalizedRoots.v8, "v8"),
  ]);
  const records = recordMap([v7, v8]);
  const pinnedInputs = await validatePinnedInputs(normalizedRoots, records);
  const [v7Ledger, v8Ledger] = await Promise.all([
    validateLedger({ roots: normalizedRoots, records, rootLabel: "v7", ...LEDGER_CONFIG.v7 }),
    validateLedger({ roots: normalizedRoots, records, rootLabel: "v8", ...LEDGER_CONFIG.v8 }),
  ]);
  const union = validateUnion(v7Ledger, v8Ledger);
  const reconciliation = await validateV7SuccessorReconciliation(normalizedRoots, records, v7Ledger);
  const allRecords = [...v7.records, ...v8.records];
  const manifestContents = serializeRecordManifest(allRecords);
  const summarizeLedger = ({ digests: _digests, publicRows: _publicRows, ...summary }) => summary;
  return {
    roots: normalizedRoots,
    inventories: { v7, v8 },
    records: allRecords,
    manifestContents,
    manifestSha256: sha256Bytes(manifestContents),
    rootIdentities,
    pinnedInputs,
    ledgers: {
      v7: summarizeLedger(v7Ledger),
      v8: summarizeLedger(v8Ledger),
      union,
      reconciliation,
    },
  };
}

function treeSummary(evidence) {
  const directoryDigest = (rootLabel, inventory) => sha256Bytes(`${inventory.directories
    .map((directory) => `${rootLabel}\t${directory.relativePath}`)
    .sort(compareText)
    .join("\n")}\n`);
  return {
    v7: {
      rootIdentity: evidence.rootIdentities.v7,
      fileCount: evidence.inventories.v7.fileCount,
      directoryCount: evidence.inventories.v7.directoryCount,
      totalBytes: evidence.inventories.v7.totalBytes,
      directoryPathSetSha256: directoryDigest("v7", evidence.inventories.v7),
    },
    v8BeforeClosureArtifacts: {
      rootIdentity: evidence.rootIdentities.v8,
      fileCount: evidence.inventories.v8.fileCount,
      directoryCount: evidence.inventories.v8.directoryCount,
      totalBytes: evidence.inventories.v8.totalBytes,
      directoryPathSetSha256: directoryDigest("v8", evidence.inventories.v8),
    },
    combinedBeforeClosureArtifacts: {
      fileCount: evidence.records.length,
      directoryCount: evidence.inventories.v7.directoryCount + evidence.inventories.v8.directoryCount,
      totalBytes: evidence.inventories.v7.totalBytes + evidence.inventories.v8.totalBytes,
    },
  };
}

export async function verifyWorkingModes(roots = DEFAULT_ROOTS) {
  const result = { files: 0, directories: 0, wrongModes: 0 };
  for (const root of Object.values(roots)) {
    const tree = await collectTree(root);
    for (const { absolutePath } of tree.files) {
      const info = await lstat(absolutePath, { bigint: true });
      result.files += 1;
      if (Number(info.mode & 0o777n) !== 0o600) result.wrongModes += 1;
    }
    for (const { absolutePath } of tree.directories) {
      const info = await lstat(absolutePath, { bigint: true });
      result.directories += 1;
      if (Number(info.mode & 0o777n) !== 0o700) result.wrongModes += 1;
    }
  }
  invariant(result.wrongModes === 0, `Working intake has ${result.wrongModes} entries outside exact 0600/0700 modes`);
  return result;
}

export async function verifyResumableModes(roots = DEFAULT_ROOTS) {
  const result = { files: 0, directories: 0, workingEntries: 0, frozenEntries: 0, invalidEntries: 0 };
  for (const root of Object.values(roots)) {
    const tree = await collectTree(root);
    for (const { absolutePath } of tree.files) {
      const mode = Number((await lstat(absolutePath, { bigint: true })).mode & 0o777n);
      result.files += 1;
      if (mode === 0o600) result.workingEntries += 1;
      else if (mode === 0o400) result.frozenEntries += 1;
      else result.invalidEntries += 1;
    }
    for (const { absolutePath } of tree.directories) {
      const mode = Number((await lstat(absolutePath, { bigint: true })).mode & 0o777n);
      result.directories += 1;
      if (mode === 0o700) result.workingEntries += 1;
      else if (mode === 0o500) result.frozenEntries += 1;
      else result.invalidEntries += 1;
    }
  }
  invariant(result.invalidEntries === 0, `Resume found ${result.invalidEntries} entries outside the exact working/frozen mode pair`);
  return result;
}

export async function verifyStagingEmpty(roots = DEFAULT_ROOTS) {
  const result = {};
  for (const [rootLabel, root] of Object.entries(roots)) {
    const stagingPath = path.join(root, "downloads", ".dedupe-staging");
    const info = await lstat(stagingPath);
    invariant(info.isDirectory() && !info.isSymbolicLink(), `${rootLabel} staging path is not a real directory`);
    const entries = await readdir(stagingPath);
    invariant(entries.length === 0, `${rootLabel} staging contains ${entries.length} entry or entries`);
    result[rootLabel] = { path: "downloads/.dedupe-staging", entryCount: 0 };
  }
  return result;
}

async function withWriterLocks(roots, action) {
  const lockPaths = [];
  for (const [rootLabel, relatives] of Object.entries(WRITER_LOCKS)) {
    for (const relative of relatives) {
      const absolutePath = path.join(roots[rootLabel], ...relative.split("/"));
      const info = await lstat(absolutePath);
      invariant(info.isFile() && !info.isSymbolicLink(), `Writer lock is not a regular file: ${absolutePath}`);
      lockPaths.push(absolutePath);
    }
  }
  const helper = [
    "import fcntl, os, sys",
    "fds = []",
    "for name in sys.argv[1:]:",
    "    fd = os.open(name, os.O_RDONLY)",
    "    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)",
    "    fds.append(fd)",
    "sys.stdout.write('READY\\n')",
    "sys.stdout.flush()",
    "sys.stdin.buffer.read()",
  ].join("\n");
  const child = spawn("/usr/bin/python3", ["-c", helper, ...lockPaths], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  let lockHolderReady = false;
  let lockHolderExited = false;
  child.once("exit", () => { lockHolderExited = true; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Timed out acquiring intake writer locks"));
    }, 10_000);
    const inspect = () => {
      if (stdout.includes("READY\n")) {
        lockHolderReady = true;
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on("data", inspect);
    inspect();
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      if (!stdout.includes("READY\n")) {
        clearTimeout(timeout);
        reject(new Error(`Could not acquire all intake writer locks (exit ${code}): ${stderr.trim()}`));
      }
    });
  });
  const assertAlive = () => invariant(
    lockHolderReady && !lockHolderExited && child.exitCode === null,
    `Intake writer-lock holder exited unexpectedly: ${stderr.trim() || "no diagnostic"}`,
  );
  try {
    assertAlive();
    return await action({
      lockCount: lockPaths.length,
      holder: "exclusive-nonblocking-flock",
      assertAlive,
    });
  } finally {
    child.stdin.end();
    if (child.exitCode === null) await new Promise((resolve) => child.once("exit", resolve));
  }
}

function acceptanceNeutralClaims({ frozen }) {
  return {
    quarantineFrozen: frozen,
    canonicalPromotion: false,
    javascriptImplementation: false,
    originalRuntimeFidelity: false,
    audioCorrectnessOrAcceptance: false,
    humanVisualAcceptance: false,
    ownerAcceptance: false,
    strictCompletion: false,
    wholeCourseIntegration: false,
    publication: false,
  };
}

function assertExactFlatObject(actual, expected, label) {
  invariant(actual && typeof actual === "object" && !Array.isArray(actual), `${label} is not an object`);
  const actualKeys = Object.keys(actual).sort(compareText);
  const expectedKeys = Object.keys(expected).sort(compareText);
  invariant(JSON.stringify(actualKeys) === JSON.stringify(expectedKeys), `${label} fields changed`);
  for (const key of expectedKeys) invariant(actual[key] === expected[key], `${label}.${key} changed`);
}

function closureManifestDescriptor(evidence) {
  return {
    closureRoot: "external-private-sibling",
    name: CLOSURE.recordsName,
    bytes: Buffer.byteLength(evidence.manifestContents),
    sha256: evidence.manifestSha256,
    format: "canonical JSONL; one root/relativePathBytesBase64/bytes/sha256 record per source-tree regular file; directory path sets are separately digest-bound",
  };
}

export function buildPreparedReceipt(evidence, {
  preparedAt = new Date().toISOString(),
  workingModes,
  staging,
  locks,
} = {}) {
  return {
    schemaVersion: "help-math-drive-intake-combined-freeze-prepared/v1",
    artifactType: "private-drive-intake-read-only-custody-closure-preparation",
    closureDate: "2026-08-04",
    preparedAt,
    outcome: "prepared-not-yet-frozen",
    scope: {
      roots: [
        { token: "v7", absolutePath: evidence.roots.v7 },
        { token: "v8", absolutePath: evidence.roots.v8 },
      ],
      selection: "both owner-authorized SHA-256 dedupe intake trees in full",
      objectIdentity: "complete ledger SHA-256 plus byte count; filenames and Drive display names are non-authoritative",
      canonicalPromotionPerformed: false,
    },
    inputs: evidence.pinnedInputs,
    ledgerClosure: evidence.ledgers,
    tree: treeSummary(evidence),
    preflight: {
      workingModes,
      staging,
      locks,
      lockPolicy: "the apply process held all four existing intake writer locks until postcheck completed",
    },
    closure: {
      recordManifest: closureManifestDescriptor(evidence),
      preparedReceiptName: CLOSURE.preparedName,
      appliedReceiptName: CLOSURE.appliedName,
      appliedReceiptSidecarName: CLOSURE.sidecarName,
      regularFileMode: "0400",
      directoryMode: "0500",
      closureArtifactCount: 4,
      unexpectedFilePolicy: "fail-closed",
    },
    unresolved: {
      v7RejectedAttemptRetained: true,
      independentReviewReceiptPresent: false,
      successorPromotionPlanApplied: false,
      grade4MissingMp3Count: 16,
    },
    claims: acceptanceNeutralClaims({ frozen: false }),
    privacyBoundary: {
      outsideGitAndDeployments: true,
      rawPathsAndClaimsRemainPrivate: true,
      receiptContainsNoDriveDisplayNamesOrClaimPaths: true,
    },
  };
}

export function buildAppliedReceipt(evidence, {
  preparedReceiptSha256,
  appliedAt = new Date().toISOString(),
  postcheck,
} = {}) {
  invariant(/^[0-9a-f]{64}$/.test(preparedReceiptSha256), "Prepared receipt SHA-256 is required");
  invariant(postcheck?.writableEntries === 0 && postcheck?.wrongModes === 0, "A clean mode postcheck is required");
  return {
    schemaVersion: "help-math-drive-intake-combined-freeze-applied/v1",
    artifactType: "private-drive-intake-read-only-custody-closure-applied",
    closureDate: "2026-08-04",
    appliedAt,
    outcome: "frozen-read-only-with-unresolved-independent-review",
    preparedReceipt: {
      name: CLOSURE.preparedName,
      sha256: preparedReceiptSha256,
    },
    recordManifest: closureManifestDescriptor(evidence),
    inputs: evidence.pinnedInputs,
    ledgerClosure: evidence.ledgers,
    tree: treeSummary(evidence),
    postcheck: {
      ...postcheck,
      contentManifestMatched: true,
      unexpectedFiles: 0,
      missingFiles: 0,
      directoryPathSetDrift: 0,
      stagingEntryCount: 0,
    },
    lifecycle: {
      v7: "rejected-pending-preserved-and-reconciled-by-v8-full-scope",
      v7IndependentlyFinalized: false,
      v8: "main-261-plus-nested-6-deduplicated-and-verified",
      independentReviewReceiptPresent: false,
      futureWritesRequireNewSuccessorRoot: true,
    },
    unresolved: {
      successorPromotionPlanApplied: false,
      grade4MissingMp3Count: 16,
    },
    claims: acceptanceNeutralClaims({ frozen: true }),
    privacyBoundary: {
      outsideGitAndDeployments: true,
      rawPathsAndClaimsRemainPrivate: true,
      receiptContainsNoDriveDisplayNamesOrClaimPaths: true,
    },
  };
}

export async function writeExclusive(filePath, contents) {
  invariant(await lstatOrNull(filePath) === null, `Refusing to overwrite an existing output: ${filePath}`);
  const preparingPath = preparingPathFor(filePath);
  const handle = await open(preparingPath, "wx", 0o600);
  const opened = await handle.stat({ bigint: true });
  let failure;
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } catch (error) {
    failure = error;
  } finally {
    await handle.close();
  }
  if (failure) {
    try {
      const atPath = await lstat(preparingPath, { bigint: true });
      if (sameNode(nodeIdentity(opened), nodeIdentity(atPath)) && atPath.nlink === 1n) {
        await unlink(preparingPath);
      }
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        failure.message = `${failure.message}; incomplete output cleanup also failed: ${cleanupError.message}`;
      }
    }
    throw failure;
  }
  await link(preparingPath, filePath);
  await syncDirectory(path.dirname(filePath));
  const finalInfo = await lstat(filePath, { bigint: true });
  const preparingInfo = await lstat(preparingPath, { bigint: true });
  invariant(
    sameNode(nodeIdentity(opened), nodeIdentity(finalInfo))
      && sameNode(nodeIdentity(opened), nodeIdentity(preparingInfo)),
    `Atomic no-clobber output identity changed: ${filePath}`,
  );
  await unlink(preparingPath);
  await syncDirectory(path.dirname(filePath));
}

function preparingPathFor(filePath) {
  return path.join(path.dirname(filePath), `.${path.basename(filePath)}.preparing`);
}

async function lstatOrNull(filePath) {
  try {
    return await lstat(filePath, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function syncDirectory(directory) {
  const handle = await open(directory, fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function closurePaths(closureRoot) {
  const root = path.resolve(closureRoot);
  return {
    root,
    manifest: path.join(root, CLOSURE.recordsName),
    prepared: path.join(root, CLOSURE.preparedName),
    applied: path.join(root, CLOSURE.appliedName),
    sidecar: path.join(root, CLOSURE.sidecarName),
  };
}

async function assertClosureTargetsMissing(paths) {
  for (const target of Object.values(paths)) {
    try {
      await lstat(target);
      throw new Error(`Refusing to overwrite an existing closure artifact: ${target}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

export async function enforceFrozenModes(roots = DEFAULT_ROOTS, { assertLockAlive = () => {} } = {}) {
  const inventories = [];
  for (const [rootLabel, root] of Object.entries(roots)) {
    const tree = await collectTree(root);
    inventories.push({ rootLabel, ...tree });
  }
  async function chmodBound(absolutePath, mode, expectedType) {
    assertLockAlive();
    const before = await lstat(absolutePath, { bigint: true });
    invariant(!before.isSymbolicLink(), `Refusing to chmod a symbolic link: ${absolutePath}`);
    invariant(expectedType === "file" ? before.isFile() : before.isDirectory(), `Entry type changed before chmod: ${absolutePath}`);
    const flags = fsConstants.O_RDONLY | NOFOLLOW | (expectedType === "directory" ? DIRECTORY : 0);
    const handle = await open(absolutePath, flags);
    try {
      const opened = await handle.stat({ bigint: true });
      invariant(sameNode(nodeIdentity(before), nodeIdentity(opened)), `Entry identity changed before chmod: ${absolutePath}`);
      await handle.chmod(mode);
      const afterOpen = await handle.stat({ bigint: true });
      const afterAtPath = await lstat(absolutePath, { bigint: true });
      invariant(
        sameNode(nodeIdentity(opened), nodeIdentity(afterOpen))
          && sameNode(nodeIdentity(opened), nodeIdentity(afterAtPath)),
        `Entry identity changed during chmod: ${absolutePath}`,
      );
      invariant(Number(afterOpen.mode & 0o777n) === mode, `chmod did not apply exact mode at ${absolutePath}`);
      assertLockAlive();
    } finally {
      await handle.close();
    }
  }
  for (const inventory of inventories) {
    await mapConcurrent(inventory.files, 32, async ({ absolutePath }) => chmodBound(absolutePath, 0o400, "file"));
  }
  const directories = inventories.flatMap((inventory) => inventory.directories);
  directories.sort((left, right) => {
    const leftDepth = left.relativePath === "." ? 0 : left.relativePath.split("/").length;
    const rightDepth = right.relativePath === "." ? 0 : right.relativePath.split("/").length;
    return rightDepth - leftDepth || compareText(right.absolutePath, left.absolutePath);
  });
  for (const directory of directories) await chmodBound(directory.absolutePath, 0o500, "directory");
}

export async function verifyFrozenModes(roots = DEFAULT_ROOTS) {
  const result = { files: 0, directories: 0, writableEntries: 0, wrongModes: 0 };
  for (const root of Object.values(roots)) {
    const tree = await collectTree(root);
    for (const { absolutePath } of tree.files) {
      const info = await lstat(absolutePath, { bigint: true });
      const mode = Number(info.mode & 0o777n);
      result.files += 1;
      if ((mode & 0o222) !== 0) result.writableEntries += 1;
      if (mode !== 0o400) result.wrongModes += 1;
    }
    for (const { absolutePath } of tree.directories) {
      const info = await lstat(absolutePath, { bigint: true });
      const mode = Number(info.mode & 0o777n);
      result.directories += 1;
      if ((mode & 0o222) !== 0) result.writableEntries += 1;
      if (mode !== 0o500) result.wrongModes += 1;
    }
  }
  invariant(result.writableEntries === 0, `Frozen intake still has ${result.writableEntries} writable entries`);
  invariant(result.wrongModes === 0, `Frozen intake has ${result.wrongModes} entries outside exact 0400/0500 modes`);
  return result;
}

async function freezeClosureRoot(closureRoot) {
  const tree = await collectTree(closureRoot);
  invariant(tree.directories.length === 1, "Closure root must not contain nested directories");
  invariant(tree.files.length === 4, `Closure root contains ${tree.files.length} files, expected 4`);
  await Promise.all(tree.files.map(({ absolutePath }) => chmod(absolutePath, 0o400)));
  await chmod(closureRoot, 0o500);
}

async function verifyClosureModes(closureRoot) {
  const tree = await collectTree(closureRoot);
  invariant(tree.directories.length === 1, "Closure root directory shape changed");
  invariant(tree.files.length === 4, `Closure root contains ${tree.files.length} files, expected 4`);
  for (const { absolutePath } of tree.files) {
    const info = await lstat(absolutePath, { bigint: true });
    invariant(Number(info.mode & 0o777n) === 0o400, `Closure file is not mode 0400: ${absolutePath}`);
  }
  const rootInfo = await lstat(closureRoot, { bigint: true });
  invariant(Number(rootInfo.mode & 0o777n) === 0o500, "Closure root is not mode 0500");
  return { files: tree.files.length, directories: 1, writableEntries: 0, wrongModes: 0 };
}

function comparableEvidence(evidence) {
  return {
    inputs: evidence.pinnedInputs,
    ledgerClosure: evidence.ledgers,
    tree: treeSummary(evidence),
    manifestSha256: evidence.manifestSha256,
    manifestBytes: Buffer.byteLength(evidence.manifestContents),
  };
}

function assertExternalClosureRoot(roots, closureRoot) {
  const resolvedClosure = path.resolve(closureRoot);
  for (const root of Object.values(roots)) {
    const resolvedRoot = path.resolve(root);
    const relative = path.relative(resolvedRoot, resolvedClosure);
    invariant(
      relative === ".." || relative.startsWith(`..${path.sep}`),
      `Closure root must remain outside both frozen intake roots: ${resolvedClosure}`,
    );
  }
}

function parseJsonReceipt(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

export async function verifyFreeze(roots = DEFAULT_ROOTS, closureRoot = DEFAULT_CLOSURE_ROOT) {
  assertExternalClosureRoot(roots, closureRoot);
  const paths = await closurePaths(closureRoot);
  const [manifestBytes, preparedBytes, appliedBytes, sidecarBytes] = await Promise.all([
    readFile(paths.manifest),
    readFile(paths.prepared),
    readFile(paths.applied),
    readFile(paths.sidecar),
  ]);
  const manifestContents = manifestBytes.toString("utf8");
  parseRecordManifest(manifestContents);
  const prepared = parseJsonReceipt(preparedBytes, "Prepared freeze receipt");
  const applied = parseJsonReceipt(appliedBytes, "Applied freeze receipt");
  invariant(prepared.schemaVersion === "help-math-drive-intake-combined-freeze-prepared/v1", "Prepared receipt schema changed");
  invariant(prepared.outcome === "prepared-not-yet-frozen", "Prepared receipt outcome changed");
  invariant(applied.schemaVersion === "help-math-drive-intake-combined-freeze-applied/v1", "Applied receipt schema changed");
  invariant(applied.outcome === "frozen-read-only-with-unresolved-independent-review", "Applied receipt outcome changed");
  const preparedSha256 = sha256Bytes(preparedBytes);
  invariant(applied.preparedReceipt?.sha256 === preparedSha256, "Applied receipt no longer binds the prepared receipt");
  const appliedSha256 = sha256Bytes(appliedBytes);
  const expectedSidecar = `${appliedSha256}  ${path.basename(paths.applied)}\n`;
  invariant(sidecarBytes.toString("utf8") === expectedSidecar, "Freeze receipt sidecar changed");
  invariant(sha256Bytes(manifestBytes) === prepared.closure?.recordManifest?.sha256, "Prepared record-manifest SHA-256 changed");
  invariant(manifestBytes.length === prepared.closure?.recordManifest?.bytes, "Prepared record-manifest byte count changed");
  invariant(applied.recordManifest?.sha256 === prepared.closure.recordManifest.sha256, "Applied/prepared manifest binding differs");
  invariant(applied.recordManifest?.bytes === prepared.closure.recordManifest.bytes, "Applied/prepared manifest byte count differs");

  const evidence = await buildClosureEvidence(roots);
  invariant(evidence.manifestContents === manifestContents, "Frozen intake tree differs from the record manifest");
  const currentComparable = comparableEvidence(evidence);
  const preparedComparable = {
    inputs: prepared.inputs,
    ledgerClosure: prepared.ledgerClosure,
    tree: prepared.tree,
    manifestSha256: prepared.closure.recordManifest.sha256,
    manifestBytes: prepared.closure.recordManifest.bytes,
  };
  invariant(JSON.stringify(currentComparable) === JSON.stringify(preparedComparable), "Prepared receipt evidence no longer matches current bytes");
  const appliedComparable = {
    inputs: applied.inputs,
    ledgerClosure: applied.ledgerClosure,
    tree: applied.tree,
    manifestSha256: applied.recordManifest.sha256,
    manifestBytes: applied.recordManifest.bytes,
  };
  invariant(JSON.stringify(currentComparable) === JSON.stringify(appliedComparable), "Applied receipt evidence no longer matches current bytes");
  assertExactFlatObject(prepared.claims, acceptanceNeutralClaims({ frozen: false }), "prepared.claims");
  assertExactFlatObject(prepared.preflight?.workingModes, {
    files: evidence.records.length,
    directories: evidence.inventories.v7.directoryCount + evidence.inventories.v8.directoryCount,
    wrongModes: 0,
  }, "prepared.preflight.workingModes");
  assertExactFlatObject(prepared.preflight?.locks, {
    lockCount: 4,
    holder: "exclusive-nonblocking-flock",
  }, "prepared.preflight.locks");
  invariant(prepared.preflight?.staging?.v7?.entryCount === 0 && prepared.preflight?.staging?.v8?.entryCount === 0, "Prepared staging preflight changed");
  invariant(JSON.stringify(prepared.closure?.recordManifest) === JSON.stringify(closureManifestDescriptor(evidence)), "Prepared manifest descriptor changed");
  assertExactFlatObject(prepared.unresolved, {
    v7RejectedAttemptRetained: true,
    independentReviewReceiptPresent: false,
    successorPromotionPlanApplied: false,
    grade4MissingMp3Count: 16,
  }, "prepared.unresolved");
  assertExactFlatObject(applied.claims, acceptanceNeutralClaims({ frozen: true }), "applied.claims");
  assertExactFlatObject(applied.lifecycle, {
    v7: "rejected-pending-preserved-and-reconciled-by-v8-full-scope",
    v7IndependentlyFinalized: false,
    v8: "main-261-plus-nested-6-deduplicated-and-verified",
    independentReviewReceiptPresent: false,
    futureWritesRequireNewSuccessorRoot: true,
  }, "applied.lifecycle");
  assertExactFlatObject(applied.unresolved, {
    successorPromotionPlanApplied: false,
    grade4MissingMp3Count: 16,
  }, "applied.unresolved");
  invariant(JSON.stringify(applied.recordManifest) === JSON.stringify(closureManifestDescriptor(evidence)), "Applied manifest descriptor changed");
  const staging = await verifyStagingEmpty(roots);
  const modes = await verifyFrozenModes(roots);
  assertExactFlatObject(applied.postcheck, {
    files: modes.files,
    directories: modes.directories,
    writableEntries: 0,
    wrongModes: 0,
    lockCount: 4,
    lockHolder: "exclusive-nonblocking-flock",
    contentManifestMatched: true,
    unexpectedFiles: 0,
    missingFiles: 0,
    directoryPathSetDrift: 0,
    stagingEntryCount: 0,
  }, "applied.postcheck");
  const closureModes = await verifyClosureModes(paths.root);
  return {
    outcome: applied.outcome,
    preparedReceiptSha256: preparedSha256,
    appliedReceiptSha256: appliedSha256,
    recordManifestSha256: evidence.manifestSha256,
    objectCount: evidence.ledgers.union.uniqueSha256Count,
    overlapCount: evidence.ledgers.union.overlapCount,
    rootedObjectSetSha256: evidence.ledgers.union.rootedObjectSetSha256,
    rootedObjectAndLedgerSetSha256: evidence.ledgers.union.rootedObjectAndLedgerSetSha256,
    sourceFileCount: modes.files,
    directoryCount: modes.directories,
    sourceTreeBytes: treeSummary(evidence).combinedBeforeClosureArtifacts.totalBytes,
    writableEntries: modes.writableEntries,
    wrongModes: modes.wrongModes,
    staging,
    closure: closureModes,
    independentReviewReceiptPresent: false,
    canonicalPromotion: false,
  };
}

async function loadPreparedClosure(paths, roots) {
  const [manifestBytes, preparedBytes] = await Promise.all([
    readFile(paths.manifest),
    readFile(paths.prepared),
  ]);
  const manifestContents = manifestBytes.toString("utf8");
  parseRecordManifest(manifestContents);
  const prepared = parseJsonReceipt(preparedBytes, "Prepared freeze receipt");
  invariant(prepared.schemaVersion === "help-math-drive-intake-combined-freeze-prepared/v1", "Prepared receipt schema changed");
  invariant(prepared.outcome === "prepared-not-yet-frozen", "Prepared receipt outcome changed");
  assertExactFlatObject(prepared.claims, acceptanceNeutralClaims({ frozen: false }), "prepared.claims");
  invariant(sha256Bytes(manifestBytes) === prepared.closure?.recordManifest?.sha256, "Prepared manifest digest changed");
  invariant(manifestBytes.length === prepared.closure?.recordManifest?.bytes, "Prepared manifest byte count changed");
  const evidence = await buildClosureEvidence(roots);
  invariant(evidence.manifestContents === manifestContents, "Current intake differs from the prepared manifest");
  const preparedComparable = {
    inputs: prepared.inputs,
    ledgerClosure: prepared.ledgerClosure,
    tree: prepared.tree,
    manifestSha256: prepared.closure.recordManifest.sha256,
    manifestBytes: prepared.closure.recordManifest.bytes,
  };
  invariant(JSON.stringify(comparableEvidence(evidence)) === JSON.stringify(preparedComparable), "Current intake differs from prepared evidence");
  assertExactFlatObject(prepared.preflight?.workingModes, {
    files: evidence.records.length,
    directories: evidence.inventories.v7.directoryCount + evidence.inventories.v8.directoryCount,
    wrongModes: 0,
  }, "prepared.preflight.workingModes");
  assertExactFlatObject(prepared.preflight?.locks, {
    lockCount: 4,
    holder: "exclusive-nonblocking-flock",
  }, "prepared.preflight.locks");
  invariant(prepared.preflight?.staging?.v7?.entryCount === 0 && prepared.preflight?.staging?.v8?.entryCount === 0, "Prepared staging preflight changed");
  invariant(JSON.stringify(prepared.closure?.recordManifest) === JSON.stringify(closureManifestDescriptor(evidence)), "Prepared manifest descriptor changed");
  assertExactFlatObject(prepared.unresolved, {
    v7RejectedAttemptRetained: true,
    independentReviewReceiptPresent: false,
    successorPromotionPlanApplied: false,
    grade4MissingMp3Count: 16,
  }, "prepared.unresolved");
  return {
    evidence,
    prepared,
    preparedSha256: sha256Bytes(preparedBytes),
  };
}

async function validateAppliedBytes(appliedBytes, preparedSha256, evidence) {
  const applied = parseJsonReceipt(appliedBytes, "Applied freeze receipt");
  invariant(applied.schemaVersion === "help-math-drive-intake-combined-freeze-applied/v1", "Applied receipt schema changed");
  invariant(applied.outcome === "frozen-read-only-with-unresolved-independent-review", "Applied receipt outcome changed");
  invariant(applied.preparedReceipt?.sha256 === preparedSha256, "Applied receipt does not bind the prepared receipt");
  invariant(applied.recordManifest?.sha256 === evidence.manifestSha256, "Applied receipt manifest digest changed");
  invariant(applied.recordManifest?.bytes === Buffer.byteLength(evidence.manifestContents), "Applied receipt manifest byte count changed");
  invariant(applied.claims?.quarantineFrozen === true && applied.claims?.canonicalPromotion === false, "Applied receipt claims changed");
  return applied;
}

async function recoverPreparingOutputs({ roots, paths, locks }) {
  const stages = [
    ["manifest", paths.manifest],
    ["prepared", paths.prepared],
    ["applied", paths.applied],
    ["sidecar", paths.sidecar],
  ];
  for (const [stage, finalPath] of stages) {
    locks.assertAlive();
    const preparingPath = preparingPathFor(finalPath);
    const preparingInfo = await lstatOrNull(preparingPath);
    if (!preparingInfo) continue;
    invariant(preparingInfo.isFile() && !preparingInfo.isSymbolicLink(), `Preparing output is not a regular file: ${preparingPath}`);
    const finalInfo = await lstatOrNull(finalPath);
    if (finalInfo) {
      invariant(
        finalInfo.isFile()
          && !finalInfo.isSymbolicLink()
          && sameNode(nodeIdentity(finalInfo), nodeIdentity(preparingInfo)),
        `Preparing output conflicts with a different final inode: ${finalPath}`,
      );
      await unlink(preparingPath);
      await syncDirectory(paths.root);
      continue;
    }

    if (stage === "manifest") {
      await verifyWorkingModes(roots);
      await verifyStagingEmpty(roots);
      const evidence = await buildClosureEvidence(roots);
      const preparingBytes = await readFile(preparingPath);
      if (preparingBytes.toString("utf8") === evidence.manifestContents) {
        await link(preparingPath, finalPath);
        await syncDirectory(paths.root);
        await unlink(preparingPath);
        await syncDirectory(paths.root);
      } else {
        await unlink(preparingPath);
        await syncDirectory(paths.root);
        await writeExclusive(finalPath, evidence.manifestContents);
      }
      continue;
    }

    if (stage === "prepared") {
      await verifyWorkingModes(roots);
    } else {
      await verifyResumableModes(roots);
    }
    await unlink(preparingPath);
    await syncDirectory(paths.root);
  }
}

async function finishPreparedFreezeUnderLock({ roots, paths, locks }) {
  locks.assertAlive();
  await chmod(paths.root, 0o700);
  await recoverPreparingOutputs({ roots, paths, locks });
  let initialNames = (await readdir(paths.root)).sort(compareText);
  if (initialNames.length === 0) {
    await verifyWorkingModes(roots);
    await verifyStagingEmpty(roots);
    const evidence = await buildClosureEvidence(roots);
    await writeExclusive(paths.manifest, evidence.manifestContents);
    await syncDirectory(paths.root);
    initialNames = (await readdir(paths.root)).sort(compareText);
  }
  const allowedNames = new Set(Object.values(CLOSURE));
  for (const name of initialNames) invariant(allowedNames.has(name), `Closure root contains an unexpected file: ${name}`);
  invariant(initialNames.includes(CLOSURE.recordsName), "Closure root lacks its prepared manifest");
  invariant(!(initialNames.includes(CLOSURE.sidecarName) && !initialNames.includes(CLOSURE.appliedName)), "Closure sidecar exists without an applied receipt");
  invariant(!(initialNames.includes(CLOSURE.appliedName) && !initialNames.includes(CLOSURE.preparedName)), "Closure applied receipt exists without its prepared receipt");

  if (!initialNames.includes(CLOSURE.preparedName)) {
    invariant(initialNames.length === 1, "Manifest-only recovery found an unexpected closure state");
    const workingModes = await verifyWorkingModes(roots);
    const staging = await verifyStagingEmpty(roots);
    const manifestBytes = await readFile(paths.manifest);
    const manifestContents = manifestBytes.toString("utf8");
    parseRecordManifest(manifestContents);
    const evidence = await buildClosureEvidence(roots);
    invariant(evidence.manifestContents === manifestContents, "Manifest-only recovery does not match current intake bytes");
    const prepared = buildPreparedReceipt(evidence, { workingModes, staging, locks });
    await writeExclusive(paths.prepared, `${JSON.stringify(prepared, null, 2)}\n`);
    await syncDirectory(paths.root);
  }

  await verifyResumableModes(roots);
  const preparedState = await loadPreparedClosure(paths, roots);
  locks.assertAlive();
  await verifyStagingEmpty(roots);
  await enforceFrozenModes(roots, { assertLockAlive: locks.assertAlive });
  locks.assertAlive();
  const postEvidence = await buildClosureEvidence(roots);
  locks.assertAlive();
  invariant(postEvidence.manifestContents === preparedState.evidence.manifestContents, "Intake bytes changed during permission freeze");
  invariant(JSON.stringify(comparableEvidence(postEvidence)) === JSON.stringify(comparableEvidence(preparedState.evidence)), "Intake identity changed during permission freeze");
  const postModes = await verifyFrozenModes(roots);
  await verifyStagingEmpty(roots);

  let appliedBytes;
  if (initialNames.includes(CLOSURE.appliedName)) {
    appliedBytes = await readFile(paths.applied);
    await validateAppliedBytes(appliedBytes, preparedState.preparedSha256, postEvidence);
  } else {
    const applied = buildAppliedReceipt(postEvidence, {
      preparedReceiptSha256: preparedState.preparedSha256,
      postcheck: { ...postModes, lockCount: locks.lockCount, lockHolder: locks.holder },
    });
    appliedBytes = Buffer.from(`${JSON.stringify(applied, null, 2)}\n`);
    await writeExclusive(paths.applied, appliedBytes);
  }
  const sidecarContents = `${sha256Bytes(appliedBytes)}  ${path.basename(paths.applied)}\n`;
  if (initialNames.includes(CLOSURE.sidecarName)) {
    invariant(await readFile(paths.sidecar, "utf8") === sidecarContents, "Existing applied-receipt sidecar changed");
  } else {
    await writeExclusive(paths.sidecar, sidecarContents);
  }
  locks.assertAlive();
  await syncDirectory(paths.root);
  await freezeClosureRoot(paths.root);
  return verifyFreeze(roots, paths.root);
}

export async function applyFreeze(roots = DEFAULT_ROOTS, closureRoot = DEFAULT_CLOSURE_ROOT) {
  assertExternalClosureRoot(roots, closureRoot);
  const paths = await closurePaths(closureRoot);
  await assertClosureTargetsMissing({ root: paths.root });
  return withWriterLocks(roots, async (locks) => {
    locks.assertAlive();
    const workingModes = await verifyWorkingModes(roots);
    const staging = await verifyStagingEmpty(roots);
    const evidence = await buildClosureEvidence(roots);
    locks.assertAlive();
    const prepared = buildPreparedReceipt(evidence, { workingModes, staging, locks });
    const preparedContents = `${JSON.stringify(prepared, null, 2)}\n`;
    await mkdir(paths.root, { mode: 0o700 });
    await syncDirectory(path.dirname(paths.root));
    await writeExclusive(paths.manifest, evidence.manifestContents);
    await writeExclusive(paths.prepared, preparedContents);
    await syncDirectory(paths.root);
    locks.assertAlive();
    return finishPreparedFreezeUnderLock({ roots, paths, locks });
  });
}

export async function resumeFreeze(roots = DEFAULT_ROOTS, closureRoot = DEFAULT_CLOSURE_ROOT) {
  assertExternalClosureRoot(roots, closureRoot);
  const paths = await closurePaths(closureRoot);
  const rootInfo = await lstat(paths.root);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), "Closure root is not a real directory");
  return withWriterLocks(roots, async (locks) => finishPreparedFreezeUnderLock({ roots, paths, locks }));
}

export function parseArguments(argv) {
  let mode;
  let help = false;
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--apply" || argument === "--resume" || argument === "--check") {
      invariant(!mode, "Choose exactly one of --apply, --resume, or --check");
      mode = argument.slice(2);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (help) return { help: true };
  invariant(mode, "Choose exactly one of --apply, --resume, or --check");
  return { help: false, mode };
}

function usage() {
  return `Usage:
  node scripts/freeze-drive-intake-v7-v8.mjs --apply
  node scripts/freeze-drive-intake-v7-v8.mjs --resume
  node scripts/freeze-drive-intake-v7-v8.mjs --check

This command is intentionally pinned to the private v7 and v8 intake roots.
It never copies anything into source-assets. --apply writes a four-file closure
chain in a new private sibling root, enforces source and closure files 0400 and
directories 0500, and then performs a full verification. --resume safely
completes an exact prepared-only or partially finalized closure after a crash.
--check is read-only and fails on any byte, ledger, receipt, file-set, or
permission drift.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = options.mode === "apply"
    ? await applyFreeze(DEFAULT_ROOTS, DEFAULT_CLOSURE_ROOT)
    : options.mode === "resume"
      ? await resumeFreeze(DEFAULT_ROOTS, DEFAULT_CLOSURE_ROOT)
      : await verifyFreeze(DEFAULT_ROOTS, DEFAULT_CLOSURE_ROOT);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
