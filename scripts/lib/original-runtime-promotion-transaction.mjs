import {constants as fsConstants} from "node:fs";
import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const PLAN_STATES = new WeakMap();
const PLAN_SCHEMA = 3;
const RECORD_SCHEMA = 2;
const SHA256 = /^[a-f0-9]{64}$/;
const ZERO_HASH = "0".repeat(64);
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

export const ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED = false;
export const ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE =
  "ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_DISABLED";
export const ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE =
  "ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_REQUIRED";

function coded(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = canonicalize(value[key]);
    return result;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function toBytes(value, label) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value);
  throw new Error(`${label} must be a string, Buffer, or Uint8Array`);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function safeMigrationId(value) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(value) || value === "." || value === "..") {
    throw new Error("migrationId must be a lowercase path-free identifier");
  }
  return value;
}

function safeRequirementId(value) {
  if (typeof value !== "string" || !value) throw new Error("requirementId must be non-empty");
  const safe = value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
  if (!safe || safe === "." || safe === ".." || safe.includes("/")) throw new Error("requirementId cannot produce a safe filename");
  return safe;
}

function safeArchiveRelative(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes("\0") || path.posix.isAbsolute(value)) {
    throw new Error("archive relativePath must be a portable relative path");
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`unsafe archive relativePath: ${value}`);
  }
  return value;
}

function permissionMode(info) {
  return Number(info.mode & 0o777n);
}

function nodeOf(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

async function lstatMaybe(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function fsyncDirectory(directory) {
  const handle = await open(directory, fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeAll(handle, content) {
  let offset = 0;
  while (offset < content.length) {
    const {bytesWritten} = await handle.write(content, offset, content.length - offset);
    if (bytesWritten < 1) throw new Error("short filesystem write");
    offset += bytesWritten;
  }
}

async function snapshotFile(candidate, label, {singleLink = false} = {}) {
  const handle = await open(candidate, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    if (!before.isFile()) throw new Error(`${label} must be a regular file`);
    if (singleLink && before.nlink !== 1n) throw new Error(`${label} must have one hard link`);
    const content = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPath = await lstat(candidate, {bigint: true});
    if (!atPath.isFile() || atPath.isSymbolicLink() || !sameNode(nodeOf(before), nodeOf(after)) || !sameNode(nodeOf(before), nodeOf(atPath))) {
      throw new Error(`${label} identity changed while reading`);
    }
    return {
      bytes: content,
      sha256: digest(content),
      size: Number(after.size),
      mode: permissionMode(after),
      nlink: Number(after.nlink),
      node: nodeOf(after),
    };
  } finally {
    await handle.close();
  }
}

async function assertSafePath(root, candidate, label, {directoryFinal = false} = {}) {
  if (!isInside(candidate, root)) throw new Error(`${label} escapes the project root`);
  if (isInside(candidate, path.join(root, "source-assets"))) throw new Error(`${label} targets source-assets`);
  let cursor = root;
  let missing = false;
  const parts = path.relative(root, candidate).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    cursor = path.join(cursor, parts[index]);
    if (missing) continue;
    const info = await lstatMaybe(cursor);
    if (!info) {
      missing = true;
      continue;
    }
    if (info.isSymbolicLink()) throw new Error(`${label} contains a symbolic-link component`);
    if (index < parts.length - 1 || directoryFinal) {
      if (!info.isDirectory()) throw new Error(`${label} contains a non-directory component`);
    }
    if (!isInside(await realpath(cursor), root)) throw new Error(`${label} resolves outside the project root`);
  }
}

async function ensureDirectoryTree(root, directory, label) {
  await assertSafePath(root, directory, label, {directoryFinal: true});
  let cursor = root;
  for (const part of path.relative(root, directory).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    const current = await lstatMaybe(cursor);
    if (current) {
      if (!current.isDirectory() || current.isSymbolicLink()) throw new Error(`${label} contains a non-directory or symbolic link`);
      continue;
    }
    try {
      await mkdir(cursor, {recursive: false, mode: 0o755});
      await fsyncDirectory(path.dirname(cursor));
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const raced = await lstat(cursor, {bigint: true});
      if (!raced.isDirectory() || raced.isSymbolicLink()) throw new Error(`${label} was replaced while creating it`);
    }
  }
}

async function createExclusive(candidate, content, mode) {
  const handle = await open(candidate, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW, mode);
  let info;
  try {
    await writeAll(handle, content);
    await handle.chmod(mode);
    await handle.sync();
    info = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  await fsyncDirectory(path.dirname(candidate));
  return {sha256: digest(content), size: content.length, mode, node: nodeOf(info)};
}

function canonicalPaths(root, descriptor) {
  safeMigrationId(descriptor.migrationId);
  const safeId = safeRequirementId(descriptor.requirementId);
  if (safeId !== descriptor.safeRequirementId) throw new Error("plan safeRequirementId is not canonical");
  const workspace = path.join(root, "migrations", descriptor.migrationId);
  const paths = {
    workspace,
    lock: path.join(workspace, ".original-runtime-promotion.lock"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    baseline: path.join(workspace, "baseline", "original-runtime", `${safeId}.json`),
    executionReport: path.join(workspace, "baseline", "trace-executions", `${safeId}.json`),
    promotionReceipt: path.join(workspace, "evidence", "original-runtime-promotions", `${safeId}.json`),
    archive: path.join(root, "artifacts", "full-frame", "pilot-baselines", descriptor.migrationId, safeId, "accepted-original-runtime"),
    transactionParent: path.join(workspace, "evidence", "original-runtime-promotion-transactions"),
    nonceRoot: path.join(root, ".original-runtime-promotion-nonce-reservations"),
  };
  paths.transactionRoot = path.join(paths.transactionParent, descriptor.planSha256);
  paths.plan = path.join(paths.transactionRoot, "plan.json");
  paths.records = path.join(paths.transactionRoot, "journal-records");
  paths.coverageBackup = path.join(paths.transactionRoot, "coverage-original.bin");
  paths.nonceReservation = path.join(paths.nonceRoot, `${digest(Buffer.from(descriptor.transactionNonce))}.json`);
  return paths;
}

function relative(root, candidate) {
  return portable(path.relative(root, candidate));
}

function plannedPathDescriptors(root, migrationId, safeId) {
  const base = canonicalPaths(root, {
    migrationId,
    requirementId: safeId,
    safeRequirementId: safeId,
    planSha256: "x".repeat(64),
    transactionNonce: "placeholder",
  });
  return {
    coverage: relative(root, base.coverage),
    baseline: relative(root, base.baseline),
    executionReport: relative(root, base.executionReport),
    promotionReceipt: relative(root, base.promotionReceipt),
    archive: relative(root, base.archive),
  };
}

/**
 * Creates a read-only, process-private plan handle.  Payload bytes and trusted
 * root/path state are retained in a WeakMap and cannot be supplied by callers
 * to an execution function.
 */
export async function createOriginalRuntimePromotionTransaction({
  projectRoot,
  migrationId,
  requirementId,
  expectedCoverageSha256,
  expectedCoverageMode,
  replacementCoverage,
  baseline,
  executionReport,
  promotionReceipt,
  archiveEntries = [],
  transactionNonce = randomUUID(),
}) {
  safeMigrationId(migrationId);
  const safeId = safeRequirementId(requirementId);
  if (!SHA256.test(expectedCoverageSha256 || "")) throw new Error("expectedCoverageSha256 must be a lowercase SHA-256");
  if (!Number.isInteger(expectedCoverageMode) || expectedCoverageMode < 0 || expectedCoverageMode > 0o777) throw new Error("expectedCoverageMode must be an integer permission mode");
  if (typeof transactionNonce !== "string" || transactionNonce.length < 16 || transactionNonce.length > 200) throw new Error("transactionNonce must be 16-200 characters");
  const root = await realpath(path.resolve(projectRoot || "."));
  const workspace = path.join(root, "migrations", migrationId);
  await assertSafePath(root, workspace, "migration workspace", {directoryFinal: true});
  const workspaceInfo = await lstat(workspace, {bigint: true});
  if (!workspaceInfo.isDirectory() || workspaceInfo.isSymbolicLink()) throw new Error("migration workspace must be a real directory");

  const payloads = {
    coverage: toBytes(replacementCoverage, "replacementCoverage"),
    baseline: toBytes(baseline, "baseline"),
    executionReport: toBytes(executionReport, "executionReport"),
    promotionReceipt: toBytes(promotionReceipt, "promotionReceipt"),
  };
  const seen = new Set();
  const archive = archiveEntries.map((entry, index) => {
    const relativePath = safeArchiveRelative(entry?.relativePath);
    if (seen.has(relativePath)) throw new Error(`duplicate archive path: ${relativePath}`);
    seen.add(relativePath);
    const content = toBytes(entry.bytes, `archiveEntries[${index}].bytes`);
    const mode = entry.mode ?? 0o444;
    if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) throw new Error(`archiveEntries[${index}].mode is invalid`);
    return {relativePath, bytes: content, sha256: digest(content), size: content.length, mode};
  }).sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const archiveFiles = archive.map(({relativePath, sha256, size, mode}) => ({relativePath, sha256, size, mode}));
  const archiveDirectories = [...new Set(["", ...archiveFiles.flatMap(({relativePath}) => {
    const parts = relativePath.split("/").slice(0, -1);
    return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
  })])].sort();
  const fixed = plannedPathDescriptors(root, migrationId, safeId);
  const descriptorWithoutHash = {
    schemaVersion: PLAN_SCHEMA,
    artifactType: "original-runtime-promotion-filesystem-transaction-plan",
    migrationId,
    requirementId,
    safeRequirementId: safeId,
    transactionNonce,
    fixedPaths: fixed,
    coverage: {
      expectedOriginalSha256: expectedCoverageSha256,
      expectedOriginalMode: expectedCoverageMode,
      replacementSha256: digest(payloads.coverage),
      replacementSize: payloads.coverage.length,
      mode: 0o444,
    },
    outputs: {
      baseline: {sha256: digest(payloads.baseline), size: payloads.baseline.length, mode: 0o444},
      executionReport: {sha256: digest(payloads.executionReport), size: payloads.executionReport.length, mode: 0o444},
      promotionReceipt: {sha256: digest(payloads.promotionReceipt), size: payloads.promotionReceipt.length, mode: 0o444},
    },
    archive: {
      directories: archiveDirectories,
      files: archiveFiles,
      inventorySha256: digest(Buffer.from(canonicalJson({directories: archiveDirectories, files: archiveFiles}))),
    },
    productionPromotionEnabled: false,
  };
  const planSha256 = digest(Buffer.from(canonicalJson(descriptorWithoutHash)));
  const descriptor = deepFreeze({...descriptorWithoutHash, planSha256});
  const handle = Object.freeze({
    planSha256,
    descriptor: deepFreeze(cloneJson(descriptor)),
  });
  PLAN_STATES.set(handle, {
    root,
    descriptor,
    payloads: Object.fromEntries(Object.entries(payloads).map(([key, value]) => [key, Buffer.from(value)])),
    archive: archive.map((entry) => ({...entry, bytes: Buffer.from(entry.bytes)})),
  });
  return handle;
}

function stateFor(handle) {
  const state = PLAN_STATES.get(handle);
  if (!state) throw new Error("transaction plan must be the original process-private branded handle");
  const {descriptor, root, payloads, archive} = state;
  const {planSha256, ...withoutHash} = descriptor;
  if (digest(Buffer.from(canonicalJson(withoutHash))) !== planSha256 || handle.planSha256 !== planSha256 || canonicalJson(handle.descriptor) !== canonicalJson(descriptor)) {
    throw new Error("transaction plan descriptor or brand is stale");
  }
  const paths = canonicalPaths(root, descriptor);
  const fixed = {
    coverage: relative(root, paths.coverage),
    baseline: relative(root, paths.baseline),
    executionReport: relative(root, paths.executionReport),
    promotionReceipt: relative(root, paths.promotionReceipt),
    archive: relative(root, paths.archive),
  };
  if (canonicalJson(fixed) !== canonicalJson(descriptor.fixedPaths)) throw new Error("transaction fixed paths do not re-derive from the descriptor");
  for (const role of ["baseline", "executionReport", "promotionReceipt"]) {
    if (digest(payloads[role]) !== descriptor.outputs[role].sha256 || payloads[role].length !== descriptor.outputs[role].size) throw new Error(`${role} private payload is stale`);
  }
  if (digest(payloads.coverage) !== descriptor.coverage.replacementSha256 || payloads.coverage.length !== descriptor.coverage.replacementSize) throw new Error("coverage private payload is stale");
  for (let index = 0; index < archive.length; index += 1) {
    if (digest(archive[index].bytes) !== descriptor.archive.files[index].sha256) throw new Error("archive private payload is stale");
  }
  return {...state, paths};
}

async function validateAllPaths(state) {
  for (const [label, candidate] of Object.entries(state.paths)) {
    await assertSafePath(state.root, candidate, label, {directoryFinal: ["workspace", "archive", "transactionParent", "transactionRoot", "records", "nonceRoot"].includes(label)});
  }
}

function recordBody(state, sequence, previousRecordSha256, event, data) {
  return {
    schemaVersion: RECORD_SCHEMA,
    planSha256: state.descriptor.planSha256,
    sequence,
    previousRecordSha256,
    event,
    recordedAt: new Date().toISOString(),
    data,
  };
}

function completeRecord(body) {
  return {...body, recordSha256: digest(Buffer.from(canonicalJson(body)))};
}

function recordFilename(record) {
  return `${String(record.sequence).padStart(8, "0")}-${record.recordSha256}.jsonl`;
}

async function readRecordSegments(state, {allowStaging = false} = {}) {
  const entries = await readdir(state.paths.records).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const staging = entries.filter((name) => name.startsWith(".record-") && name.endsWith(".tmp")).sort();
  if (staging.length && !allowStaging) throw new Error("journal has an incomplete atomic record staging file");
  const names = entries.filter((name) => /^\d{8}-[a-f0-9]{64}\.jsonl$/.test(name)).sort();
  const unexpected = entries.filter((name) => !names.includes(name) && !staging.includes(name));
  if (unexpected.length) throw new Error(`journal record directory has unexpected entries: ${unexpected.join(", ")}`);
  let previous = ZERO_HASH;
  const records = [];
  const finalSnapshots = [];
  for (let index = 0; index < names.length; index += 1) {
    const candidate = path.join(state.paths.records, names[index]);
    // During an atomic hard-link publication there is a short, recoverable
    // state in which the complete staging name and final name share one inode.
    // Validate that exact pairing below instead of making the final record
    // unreadable after a process exit in that window.
    const snapshot = await snapshotFile(candidate, `journal record ${index + 1}`);
    finalSnapshots.push(snapshot);
    if (snapshot.bytes.at(-1) !== 0x0a || snapshot.bytes.subarray(0, -1).includes(0x0a)) throw new Error(`journal record ${index + 1} is not one complete JSONL line`);
    let record;
    try { record = JSON.parse(snapshot.bytes.toString("utf8").slice(0, -1)); } catch { throw new Error(`journal record ${index + 1} is invalid JSON`); }
    const {recordSha256, ...body} = record;
    if (record.schemaVersion !== RECORD_SCHEMA || record.planSha256 !== state.descriptor.planSha256 || record.sequence !== index + 1 || record.previousRecordSha256 !== previous || !SHA256.test(recordSha256 || "") || digest(Buffer.from(canonicalJson(body))) !== recordSha256 || names[index] !== recordFilename(record)) {
      throw new Error(`journal record ${index + 1} breaks the atomic hash chain`);
    }
    records.push(record);
    previous = recordSha256;
  }
  const multiplyLinked = finalSnapshots
    .map((snapshot, index) => ({snapshot, index}))
    .filter(({snapshot}) => snapshot.nlink !== 1);
  if (multiplyLinked.length) {
    if (!allowStaging || staging.length !== 1 || multiplyLinked.length !== 1) {
      throw new Error("journal final record has an unexplained hard link");
    }
    const match = /^\.record-(\d{8})-([a-f0-9]{64})\.tmp$/.exec(staging[0]);
    const linked = multiplyLinked[0];
    const expectedFinal = match ? `${match[1]}-${match[2]}.jsonl` : null;
    const stagingSnapshot = await snapshotFile(path.join(state.paths.records, staging[0]), "linked journal staging record");
    if (!match || names[linked.index] !== expectedFinal || linked.snapshot.nlink !== 2 || stagingSnapshot.nlink !== 2 || !sameNode(linked.snapshot.node, stagingSnapshot.node) || !linked.snapshot.bytes.equals(stagingSnapshot.bytes)) {
      throw new Error("journal final record hard link is not its exact atomic staging name");
    }
  }
  if (records.length && (records[0].event !== "transaction-begin" || canonicalJson(records[0].data.plan) !== canonicalJson(state.descriptor))) {
    throw new Error("journal does not bind the exact immutable plan");
  }
  return {records, staging};
}

async function publishAtomicRecord(state, record, controller = null) {
  const content = Buffer.from(`${JSON.stringify(record)}\n`);
  const final = path.join(state.paths.records, recordFilename(record));
  const temporary = path.join(state.paths.records, `.record-${String(record.sequence).padStart(8, "0")}-${record.recordSha256}.tmp`);
  const existingFinal = await lstatMaybe(final);
  if (existingFinal) {
    const snapshot = await snapshotFile(final, "existing atomic journal record");
    if (!snapshot.bytes.equals(content)) throw new Error("existing journal record differs from the expected hash-addressed record");
    const temporaryInfo = await lstatMaybe(temporary);
    if (temporaryInfo) {
      const staged = await snapshotFile(temporary, "existing atomic journal staging record");
      if (!staged.bytes.equals(content) || (sameNode(snapshot.node, staged.node) ? snapshot.nlink !== 2 || staged.nlink !== 2 : snapshot.nlink !== 1 || staged.nlink !== 1)) {
        throw new Error("existing journal staging record is not a recoverable publication twin");
      }
      await unlink(temporary);
      await fsyncDirectory(state.paths.records);
    }
    await snapshotFile(final, "recovered atomic journal record", {singleLink: true});
    return;
  }
  const existingTemporary = await lstatMaybe(temporary);
  if (existingTemporary) {
    const snapshot = await snapshotFile(temporary, "atomic journal staging file", {singleLink: true});
    if (!snapshot.bytes.equals(content)) throw new Error("atomic journal staging file is partial or drifted");
  } else {
    await createExclusive(temporary, content, 0o600);
  }
  try {
    await link(temporary, final);
    await fsyncDirectory(state.paths.records);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const snapshot = await snapshotFile(final, "raced atomic journal record");
    if (!snapshot.bytes.equals(content)) throw new Error("raced journal record differs from the expected record");
  }
  const finalSnapshot = await snapshotFile(final, "published atomic journal record");
  const temporarySnapshot = await snapshotFile(temporary, "published journal staging file");
  if (!sameNode(finalSnapshot.node, temporarySnapshot.node) || finalSnapshot.nlink !== 2 || temporarySnapshot.nlink !== 2 || temporarySnapshot.sha256 !== digest(content)) throw new Error("journal staging file drifted before cleanup");
  await faultPoint(controller, "after-journal-record-linked-before-staging-unlink", {event: record.event, sequence: record.sequence});
  await unlink(temporary);
  await fsyncDirectory(state.paths.records);
  await snapshotFile(final, "durable atomic journal record", {singleLink: true});
}

async function openJournal(state, controller = null) {
  await ensureDirectoryTree(state.root, state.paths.transactionParent, "transaction parent");
  const transaction = await lstatMaybe(state.paths.transactionRoot);
  if (!transaction) {
    await mkdir(state.paths.transactionRoot, {recursive: false, mode: 0o700});
    await fsyncDirectory(state.paths.transactionParent);
  } else if (!transaction.isDirectory() || transaction.isSymbolicLink()) throw new Error("transaction root is not a real directory");
  const planBytes = Buffer.from(`${JSON.stringify(state.descriptor, null, 2)}\n`);
  const planInfo = await lstatMaybe(state.paths.plan);
  if (!planInfo) await createExclusive(state.paths.plan, planBytes, 0o400);
  else if (!(await snapshotFile(state.paths.plan, "transaction plan file", {singleLink: true})).bytes.equals(planBytes)) throw new Error("transaction plan file differs from its content address");
  await faultPoint(controller, "after-transaction-plan-published-before-record-directory", {});
  await ensureDirectoryTree(state.root, state.paths.records, "journal record directory");
  await faultPoint(controller, "after-record-directory-created-before-transaction-begin", {});
  let {records, staging} = await readRecordSegments(state, {allowStaging: true});
  if (staging.length) {
    // A record is visible only after its complete one-line staging file is
    // hard-linked to the final hash-addressed name.  A crash before that link
    // leaves no claimed record and is fail-closed; recovery removes only a
    // staging file whose name/content are self-consistent with the next slot.
    if (staging.length !== 1) throw new Error("journal has multiple incomplete staging records");
    const match = /^\.record-(\d{8})-([a-f0-9]{64})\.tmp$/.exec(staging[0]);
    const snapshot = await snapshotFile(path.join(state.paths.records, staging[0]), "journal staging recovery");
    let staged;
    try { staged = JSON.parse(snapshot.bytes.toString("utf8").trimEnd()); } catch { staged = null; }
    const body = staged ? (({recordSha256, ...value}) => value)(staged) : null;
    const structurallyValid = Boolean(
      match
      && staged
      && snapshot.bytes.at(-1) === 0x0a
      && !snapshot.bytes.subarray(0, -1).includes(0x0a)
      && staged.schemaVersion === RECORD_SCHEMA
      && staged.planSha256 === state.descriptor.planSha256
      && staged.recordSha256 === match[2]
      && digest(Buffer.from(canonicalJson(body))) === staged.recordSha256
      && recordFilename(staged).slice(0, -6) === staging[0].slice(8, -4)
    );
    const alreadyPublished = structurallyValid
      && staged.sequence === records.length
      && records.at(-1)?.recordSha256 === staged.recordSha256
      && records.at(-1)?.previousRecordSha256 === staged.previousRecordSha256;
    const nextRecord = structurallyValid
      && staged.sequence === records.length + 1
      && staged.previousRecordSha256 === (records.at(-1)?.recordSha256 || ZERO_HASH);
    if (!alreadyPublished && !nextRecord) {
      throw new Error("journal staging record is partial or cannot extend the valid prefix");
    }
    await publishAtomicRecord(state, staged, controller);
    ({records} = await readRecordSegments(state));
  }
  if (!records.length) {
    const first = completeRecord(recordBody(state, 1, ZERO_HASH, "transaction-begin", {plan: state.descriptor}));
    await publishAtomicRecord(state, first, controller);
    records = [first];
  }
  return {state, records, controller};
}

async function readExistingJournal(state) {
  const planBytes = Buffer.from(`${JSON.stringify(state.descriptor, null, 2)}\n`);
  const planSnapshot = await snapshotFile(state.paths.plan, "existing transaction plan", {singleLink: true});
  if (!planSnapshot.bytes.equals(planBytes)) throw new Error("existing transaction plan differs from its content address");
  const {records, staging} = await readRecordSegments(state, {allowStaging: true});
  if (!records.length) return {state, records, staging};
  if (records[0].event !== "transaction-begin" || canonicalJson(records[0].data.plan) !== canonicalJson(state.descriptor)) {
    throw new Error("existing transaction journal has no valid plan-bound prefix");
  }
  return {state, records, staging};
}

async function appendEvent(journal, event, data = {}) {
  const current = await readRecordSegments(journal.state);
  if (current.records.length !== journal.records.length || current.records.at(-1)?.recordSha256 !== journal.records.at(-1)?.recordSha256) throw new Error("journal prefix changed before append");
  const body = recordBody(journal.state, current.records.length + 1, current.records.at(-1).recordSha256, event, data);
  const record = completeRecord(body);
  await publishAtomicRecord(journal.state, record, journal.controller);
  journal.records = [...current.records, record];
  return record;
}

function eventRecords(journal, event) {
  return journal.records.filter((record) => record.event === event);
}

function lastEvent(journal, event) {
  return eventRecords(journal, event).at(-1);
}

function terminalState(records) {
  if (records.some(({event}) => event === "manual-intervention-required" || event === "committed-drift-detected")) return "manual-intervention-required";
  if (records.some(({event}) => event === "transaction-committed")) return "committed";
  if (records.some(({event}) => event === "transaction-rolled-back")) return "rolled-back";
  return records.length === 1 ? "not-executed" : "incomplete";
}

function nonceStagingPath(state) {
  return path.join(state.paths.nonceRoot, `.${path.basename(state.paths.nonceReservation)}.${state.descriptor.planSha256}.tmp`);
}

async function claimNonce(state, controller = null) {
  await ensureDirectoryTree(state.root, state.paths.nonceRoot, "nonce reservation root");
  const value = {
    schemaVersion: 1,
    artifactType: "original-runtime-promotion-project-nonce-reservation",
    nonceSha256: digest(Buffer.from(state.descriptor.transactionNonce)),
    planSha256: state.descriptor.planSha256,
  };
  const content = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const temporary = nonceStagingPath(state);
  const existing = await lstatMaybe(state.paths.nonceReservation);
  if (existing) {
    const snapshot = await snapshotFile(state.paths.nonceReservation, "persistent nonce reservation");
    if (!snapshot.bytes.equals(content)) throw coded("transaction nonce is permanently reserved by another plan", "ORIGINAL_RUNTIME_PROMOTION_NONCE_REUSED");
    const stagedInfo = await lstatMaybe(temporary);
    if (stagedInfo) {
      const staged = await snapshotFile(temporary, "persistent nonce reservation staging recovery");
      const linkedTwin = sameNode(snapshot.node, staged.node) && snapshot.nlink === 2 && staged.nlink === 2;
      const duplicateTwin = !sameNode(snapshot.node, staged.node) && snapshot.nlink === 1 && staged.nlink === 1;
      if (!staged.bytes.equals(content) || (!linkedTwin && !duplicateTwin)) throw new Error("nonce reservation staging is not a recoverable publication twin");
      await unlink(temporary);
      await fsyncDirectory(state.paths.nonceRoot);
    }
    await snapshotFile(state.paths.nonceReservation, "durable persistent nonce reservation", {singleLink: true});
    return;
  }
  const tempExisting = await lstatMaybe(temporary);
  if (!tempExisting) await createExclusive(temporary, content, 0o400);
  else if (!(await snapshotFile(temporary, "nonce reservation staging", {singleLink: true})).bytes.equals(content)) throw new Error("nonce reservation staging drifted");
  let publishedNew = false;
  try {
    await link(temporary, state.paths.nonceReservation);
    await fsyncDirectory(state.paths.nonceRoot);
    publishedNew = true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const raced = await snapshotFile(state.paths.nonceReservation, "raced nonce reservation");
    if (!raced.bytes.equals(content)) {
      await unlink(temporary).catch((candidate) => { if (candidate.code !== "ENOENT") throw candidate; });
      await fsyncDirectory(state.paths.nonceRoot);
      throw coded("transaction nonce is permanently reserved by another plan", "ORIGINAL_RUNTIME_PROMOTION_NONCE_REUSED");
    }
  }
  if (publishedNew) await faultPoint(controller, "after-nonce-reservation-linked-before-staging-unlink", {});
  await unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; });
  await fsyncDirectory(state.paths.nonceRoot);
}

async function processAlive(processId) {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    return true;
  }
}

function lockStagingPath(state, ownerNonce) {
  return path.join(state.paths.workspace, `.${path.basename(state.paths.lock)}.${state.descriptor.planSha256}.${ownerNonce}.tmp`);
}

async function readLockOwner(state) {
  const lockInfo = await lstat(state.paths.lock, {bigint: true});
  if (!lockInfo.isFile() || lockInfo.isSymbolicLink()) throw new Error("promotion lock is not a real regular file");
  const ownerPath = state.paths.lock;
  const ownerSnapshot = await snapshotFile(ownerPath, "promotion lock owner");
  let owner;
  try { owner = JSON.parse(ownerSnapshot.bytes); } catch { throw new Error("promotion lock owner is invalid JSON"); }
  if (owner.planSha256 !== state.descriptor.planSha256 || owner.migrationId !== state.descriptor.migrationId || !Number.isInteger(owner.processId) || typeof owner.ownerNonce !== "string") {
    throw new Error("promotion lock ownership record is invalid or foreign");
  }
  const stagingPath = lockStagingPath(state, owner.ownerNonce);
  const stagingInfo = await lstatMaybe(stagingPath);
  let stagingSnapshot = null;
  if (stagingInfo) {
    stagingSnapshot = await snapshotFile(stagingPath, "promotion lock staging recovery");
    if (!sameNode(ownerSnapshot.node, stagingSnapshot.node) || ownerSnapshot.nlink !== 2 || stagingSnapshot.nlink !== 2 || !ownerSnapshot.bytes.equals(stagingSnapshot.bytes)) {
      throw new Error("promotion lock staging is not its exact recoverable hard-link twin");
    }
  } else if (ownerSnapshot.nlink !== 1) {
    throw new Error("promotion lock has an unexplained hard link");
  }
  return {state, path: state.paths.lock, node: nodeOf(lockInfo), ownerPath, ownerSnapshot, owner, stagingPath, stagingSnapshot};
}

async function removeVerifiedLock(lock, controller = null) {
  const current = await readLockOwner(lock.state).catch((error) => {
    throw coded(`promotion lock drifted; refusing release: ${error.message}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  });
  if (!sameNode(current.ownerSnapshot.node, lock.ownerSnapshot.node) || current.ownerSnapshot.sha256 !== lock.ownerSnapshot.sha256 || current.owner.ownerNonce !== lock.owner.ownerNonce) {
    throw coded("promotion lock drifted; refusing release", ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  }
  if (current.stagingSnapshot) {
    await unlink(current.stagingPath);
    await fsyncDirectory(path.dirname(current.stagingPath));
  }
  const single = await snapshotFile(lock.path, "promotion lock before atomic release", {singleLink: true});
  if (!sameNode(single.node, lock.ownerSnapshot.node) || single.sha256 !== lock.ownerSnapshot.sha256) throw coded("promotion lock drifted before release", ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  await unlink(lock.path);
  await faultPoint(controller, "after-lock-file-unlinked-before-parent-fsync", {lockPath: relative(lock.state.root, lock.path)});
  await fsyncDirectory(path.dirname(lock.path));
}

async function publishLockOwner(state, controller) {
  const owner = {
    schemaVersion: 2,
    artifactType: "original-runtime-promotion-lock-owner",
    migrationId: state.descriptor.migrationId,
    planSha256: state.descriptor.planSha256,
    ownerNonce: randomUUID(),
    processId: process.pid,
  };
  const ownerBytes = Buffer.from(`${JSON.stringify(owner, null, 2)}\n`);
  const stagingPath = lockStagingPath(state, owner.ownerNonce);
  const staging = await createExclusive(stagingPath, ownerBytes, 0o400);
  try {
    await link(stagingPath, state.paths.lock);
    await fsyncDirectory(state.paths.workspace);
  } catch (error) {
    await unlink(stagingPath).catch((candidate) => { if (candidate.code !== "ENOENT") throw candidate; });
    await fsyncDirectory(state.paths.workspace);
    if (error.code === "EEXIST") throw coded("per-migration promotion lock is held", "ORIGINAL_RUNTIME_PROMOTION_LOCKED");
    throw error;
  }
  const published = await snapshotFile(state.paths.lock, "published promotion lock");
  if (!sameNode(published.node, staging.node) || published.nlink !== 2 || published.sha256 !== staging.sha256) throw new Error("promotion lock publication differs from its fsynced staging file");
  await faultPoint(controller, "after-lock-file-linked-before-staging-unlink", {lockPath: relative(state.root, state.paths.lock)});
  await unlink(stagingPath);
  await fsyncDirectory(state.paths.workspace);
  const ownerSnapshot = await snapshotFile(state.paths.lock, "durable promotion lock", {singleLink: true});
  const lock = {state, path: state.paths.lock, node: ownerSnapshot.node, ownerPath: state.paths.lock, ownerSnapshot, owner, stagingPath, stagingSnapshot: null, stale: null};
  await faultPoint(controller, "after-lock-published-before-journal", {lockPath: relative(state.root, state.paths.lock)});
  return lock;
}

async function acquireLock(state, {recoverStale = false, journal = null} = {}, controller = null) {
  await assertSafePath(state.root, state.paths.lock, "promotion lock");
  const workspaceInfo = await lstat(state.paths.workspace, {bigint: true});
  if (!workspaceInfo.isDirectory() || workspaceInfo.isSymbolicLink()) throw new Error("migration workspace is not a real directory");
  let stale = null;
  if (await lstatMaybe(state.paths.lock)) {
    if (!recoverStale) throw coded("per-migration promotion lock is held", "ORIGINAL_RUNTIME_PROMOTION_LOCKED");
    stale = await readLockOwner(state).catch((candidate) => { throw coded(`stale lock cannot be authenticated: ${candidate.message}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE); });
    if (await processAlive(stale.owner.processId)) throw coded("promotion lock owner process is still alive", "ORIGINAL_RUNTIME_PROMOTION_LOCKED");
    const lockRecords = journal?.records.filter((record) => record.event === "lock-acquired") || [];
    const bound = lockRecords.some((record) => record.data.ownerNonce === stale.owner.ownerNonce && record.data.ownerSha256 === stale.ownerSnapshot.sha256);
    if (lockRecords.length && !bound) throw coded("dead lock owner conflicts with the journal-bound owner", ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
    await removeVerifiedLock(stale);
  }
  const lock = await publishLockOwner(state, controller);
  lock.stale = stale;
  return lock;
}

async function releaseLock(lock, controller = null) {
  await removeVerifiedLock(lock, controller);
}

function outputs(state) {
  return [
    ["baseline", state.paths.baseline, state.payloads.baseline, state.descriptor.outputs.baseline],
    ["executionReport", state.paths.executionReport, state.payloads.executionReport, state.descriptor.outputs.executionReport],
    ["promotionReceipt", state.paths.promotionReceipt, state.payloads.promotionReceipt, state.descriptor.outputs.promotionReceipt],
  ];
}

function deterministicTemp(state, target, role, phase = "publish") {
  const key = digest(Buffer.from(`${phase}\0${role}\0${relative(state.root, target)}\0${state.descriptor.planSha256}`));
  return path.join(path.dirname(target), `.${path.basename(target)}.${phase}-${key}.tmp`);
}

async function faultPoint(controller, checkpoint, details = {}) {
  if (controller) await controller(checkpoint, Object.freeze({...details}));
}

async function publishNoReplace(journal, {role, category, target, content, descriptor}, controller) {
  const {state} = journal;
  await assertSafePath(state.root, target, `${role} target`);
  const temporary = deterministicTemp(state, target, role);
  await appendEvent(journal, "file-temp-create-intent", {
    category,
    role,
    target: relative(state.root, target),
    temporary: relative(state.root, temporary),
    sha256: descriptor.sha256,
    size: descriptor.size,
    mode: descriptor.mode,
  });
  let tempOwnership;
  const existingTemp = await lstatMaybe(temporary);
  if (existingTemp) {
    const snapshot = await snapshotFile(temporary, `${role} deterministic temporary`, {singleLink: true});
    if (snapshot.sha256 !== descriptor.sha256 || snapshot.size !== descriptor.size) throw new Error(`${role} deterministic temporary is foreign`);
    tempOwnership = snapshot;
  } else {
    tempOwnership = await createExclusive(temporary, content, descriptor.mode);
  }
  await faultPoint(controller, "after-file-temp-created-before-record", {role, target: relative(state.root, target)});
  await appendEvent(journal, "file-temp-created", {role, temporary: relative(state.root, temporary), sha256: descriptor.sha256, node: tempOwnership.node});
  await appendEvent(journal, "file-publish-intent", {role, target: relative(state.root, target), temporary: relative(state.root, temporary), sha256: descriptor.sha256, node: tempOwnership.node});
  try {
    await link(temporary, target);
    await fsyncDirectory(path.dirname(target));
  } catch (error) {
    if (error.code === "EEXIST") throw coded(`${role} target exists; no-replace publication refused`, "ORIGINAL_RUNTIME_PROMOTION_TARGET_EXISTS");
    throw error;
  }
  await faultPoint(controller, "after-file-hardlink-before-published-record", {role, target: relative(state.root, target)});
  const published = await snapshotFile(target, `${role} published target`);
  if (!sameNode(published.node, tempOwnership.node) || published.sha256 !== descriptor.sha256) throw new Error(`${role} publication does not match its fsynced temporary`);
  await appendEvent(journal, "file-published", {category, role, target: relative(state.root, target), sha256: descriptor.sha256, node: published.node});
  await faultPoint(controller, "after-file-published", {role, target: relative(state.root, target)});
  const tempNow = await snapshotFile(temporary, `${role} temporary cleanup`);
  if (!sameNode(tempNow.node, tempOwnership.node) || tempNow.sha256 !== descriptor.sha256) throw new Error(`${role} temporary drifted`);
  await unlink(temporary);
  await fsyncDirectory(path.dirname(temporary));
  await appendEvent(journal, "file-temp-removed", {role, temporary: relative(state.root, temporary)});
}

async function archiveInventory(state) {
  const directories = [""];
  const files = [];
  async function walk(directory, prefix = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const info = await lstat(candidate, {bigint: true});
      if (info.isSymbolicLink()) throw new Error(`archive contains symbolic link ${relativePath}`);
      if (info.isDirectory()) {
        directories.push(relativePath);
        await walk(candidate, relativePath);
      } else if (info.isFile()) {
        const snapshot = await snapshotFile(candidate, `archive ${relativePath}`, {singleLink: true});
        files.push({relativePath, sha256: snapshot.sha256, size: snapshot.size, mode: snapshot.mode});
      } else throw new Error(`archive contains unsupported entry ${relativePath}`);
    }
  }
  await walk(state.paths.archive);
  directories.sort();
  return {directories, files, inventorySha256: digest(Buffer.from(canonicalJson({directories, files})))};
}

async function publishArchive(journal, controller) {
  const {state} = journal;
  await appendEvent(journal, "archive-claim-intent", {path: relative(state.root, state.paths.archive), inventorySha256: state.descriptor.archive.inventorySha256});
  try {
    await mkdir(state.paths.archive, {recursive: false, mode: 0o755});
    await fsyncDirectory(path.dirname(state.paths.archive));
  } catch (error) {
    if (error.code === "EEXIST") throw coded("archive destination exists; no-replace claim refused", "ORIGINAL_RUNTIME_PROMOTION_TARGET_EXISTS");
    throw error;
  }
  const rootInfo = await lstat(state.paths.archive, {bigint: true});
  await faultPoint(controller, "after-archive-directory-created-before-claim-record", {archive: relative(state.root, state.paths.archive)});
  await appendEvent(journal, "archive-claimed", {path: relative(state.root, state.paths.archive), node: nodeOf(rootInfo)});
  for (const entry of state.archive) {
    const destination = path.join(state.paths.archive, ...entry.relativePath.split("/"));
    await ensureDirectoryTree(state.root, path.dirname(destination), `archive ${entry.relativePath} parent`);
    await publishNoReplace(journal, {
      role: `archive:${entry.relativePath}`,
      category: "archive-entry",
      target: destination,
      content: entry.bytes,
      descriptor: entry,
    }, controller);
  }
  const observed = await archiveInventory(state);
  if (observed.inventorySha256 !== state.descriptor.archive.inventorySha256) throw new Error("archive inventory differs from the immutable plan");
  await appendEvent(journal, "archive-published", {inventorySha256: observed.inventorySha256, node: nodeOf(rootInfo)});
}

async function prepareCoverageSwap(journal, original, controller) {
  const {state} = journal;
  await appendEvent(journal, "coverage-backup-create-intent", {path: relative(state.root, state.paths.coverageBackup), sha256: original.sha256, originalMode: original.mode, sourceNode: original.node});
  let backup;
  const existingBackup = await lstatMaybe(state.paths.coverageBackup);
  if (existingBackup) {
    backup = await snapshotFile(state.paths.coverageBackup, "coverage backup", {singleLink: true});
    if (backup.sha256 !== original.sha256) throw new Error("coverage backup differs from original CAS value");
  } else backup = await createExclusive(state.paths.coverageBackup, original.bytes, 0o400);
  await appendEvent(journal, "coverage-backup-created", {path: relative(state.root, state.paths.coverageBackup), sha256: backup.sha256, originalMode: original.mode, node: backup.node});
  const temporary = deterministicTemp(state, state.paths.coverage, "coverage", "swap");
  await appendEvent(journal, "coverage-temp-create-intent", {temporary: relative(state.root, temporary), sha256: state.descriptor.coverage.replacementSha256, mode: state.descriptor.coverage.mode});
  let replacement;
  const existingTemp = await lstatMaybe(temporary);
  if (existingTemp) {
    replacement = await snapshotFile(temporary, "coverage swap temporary", {singleLink: true});
    if (replacement.sha256 !== state.descriptor.coverage.replacementSha256) throw new Error("coverage swap temporary is foreign");
  } else replacement = await createExclusive(temporary, state.payloads.coverage, state.descriptor.coverage.mode);
  await faultPoint(controller, "after-coverage-temp-created-before-record", {});
  await appendEvent(journal, "coverage-temp-created", {temporary: relative(state.root, temporary), sha256: replacement.sha256, node: replacement.node});
  await appendEvent(journal, "coverage-swap-intent", {
    path: relative(state.root, state.paths.coverage),
    originalSha256: original.sha256,
    originalMode: original.mode,
    originalNode: original.node,
    backupNode: backup.node,
    replacementSha256: replacement.sha256,
    replacementNode: replacement.node,
    temporary: relative(state.root, temporary),
  });
  const current = await snapshotFile(state.paths.coverage, "coverage CAS input", {singleLink: true});
  if (current.sha256 !== state.descriptor.coverage.expectedOriginalSha256 || current.mode !== state.descriptor.coverage.expectedOriginalMode || !sameNode(current.node, original.node)) throw coded("coverage changed before CAS", "ORIGINAL_RUNTIME_PROMOTION_CAS_MISMATCH");
  await faultPoint(controller, "after-coverage-swap-intent-before-atomic-rename", {});
  await rename(temporary, state.paths.coverage);
  await fsyncDirectory(path.dirname(state.paths.coverage));
  await faultPoint(controller, "after-coverage-atomic-rename-before-record", {});
  const swapped = await snapshotFile(state.paths.coverage, "coverage CAS replacement");
  if (!sameNode(swapped.node, replacement.node) || swapped.sha256 !== replacement.sha256) throw new Error("coverage CAS replacement differs from the intended bytes");
  await appendEvent(journal, "coverage-swapped", {sha256: swapped.sha256, node: swapped.node, atomicRename: true});
  await faultPoint(controller, "after-coverage-swapped", {});
  await appendEvent(journal, "coverage-temp-consumed-by-atomic-rename", {temporary: relative(state.root, temporary), node: replacement.node});
}

function plannedTemporaryPaths(state) {
  const candidates = [
    nonceStagingPath(state),
    deterministicTemp(state, state.paths.coverage, "coverage", "swap"),
    deterministicTemp(state, state.paths.coverage, "coverage", "rollback"),
    ...outputs(state).map(([role, target]) => deterministicTemp(state, target, role)),
    ...state.archive.map((entry) => {
      const target = path.join(state.paths.archive, ...entry.relativePath.split("/"));
      return deterministicTemp(state, target, `archive:${entry.relativePath}`);
    }),
  ];
  return [...new Set(candidates)];
}

async function validateNoPlannedTemporaries(state) {
  const issues = [];
  for (const candidate of plannedTemporaryPaths(state)) {
    if (await lstatMaybe(candidate)) issues.push(`transaction temporary still exists: ${relative(state.root, candidate)}`);
  }
  return issues;
}

async function validateCommitted(state) {
  const issues = [];
  const coverage = await snapshotFile(state.paths.coverage, "committed coverage", {singleLink: true}).catch((error) => { issues.push(`coverage: ${error.message}`); return null; });
  if (coverage && (coverage.sha256 !== state.descriptor.coverage.replacementSha256 || coverage.size !== state.descriptor.coverage.replacementSize || coverage.mode !== state.descriptor.coverage.mode)) issues.push("coverage differs from committed replacement");
  for (const [role, candidate, , descriptor] of outputs(state)) {
    const snapshot = await snapshotFile(candidate, `committed ${role}`, {singleLink: true}).catch((error) => { issues.push(`${role}: ${error.message}`); return null; });
    if (snapshot && (snapshot.sha256 !== descriptor.sha256 || snapshot.size !== descriptor.size || snapshot.mode !== descriptor.mode)) issues.push(`${role} differs from the immutable plan`);
  }
  const archive = await archiveInventory(state).catch((error) => { issues.push(`archive: ${error.message}`); return null; });
  if (archive && archive.inventorySha256 !== state.descriptor.archive.inventorySha256) issues.push("archive inventory differs from committed plan");
  issues.push(...await validateNoPlannedTemporaries(state));
  return {ok: issues.length === 0, issues};
}

async function validateRolledBack(state) {
  const issues = [];
  const coverage = await snapshotFile(state.paths.coverage, "rolled-back coverage", {singleLink: true}).catch((error) => { issues.push(`coverage: ${error.message}`); return null; });
  if (coverage && (coverage.sha256 !== state.descriptor.coverage.expectedOriginalSha256 || coverage.mode !== state.descriptor.coverage.expectedOriginalMode)) issues.push("coverage does not match the expected original bytes and mode");
  for (const [role, candidate] of outputs(state)) if (await lstatMaybe(candidate)) issues.push(`${role} still exists after rollback`);
  if (await lstatMaybe(state.paths.archive)) issues.push("archive still exists after rollback");
  issues.push(...await validateNoPlannedTemporaries(state));
  return {ok: issues.length === 0, issues};
}

async function preflight(journal) {
  const {state} = journal;
  await validateAllPaths(state);
  const coverage = await snapshotFile(state.paths.coverage, "coverage CAS preflight", {singleLink: true});
  if (coverage.sha256 !== state.descriptor.coverage.expectedOriginalSha256 || coverage.mode !== state.descriptor.coverage.expectedOriginalMode) throw coded("coverage differs from expected original bytes or mode", "ORIGINAL_RUNTIME_PROMOTION_CAS_MISMATCH");
  for (const [role, candidate] of outputs(state)) if (await lstatMaybe(candidate)) throw coded(`${role} already exists`, "ORIGINAL_RUNTIME_PROMOTION_TARGET_EXISTS");
  if (await lstatMaybe(state.paths.archive)) throw coded("archive already exists", "ORIGINAL_RUNTIME_PROMOTION_TARGET_EXISTS");
  await appendEvent(journal, "preflight-passed", {coverageSha256: coverage.sha256, coverageMode: coverage.mode, coverageNode: coverage.node});
  return coverage;
}

function intentOwnership(journal) {
  const state = journal.state;
  const rollbackStarted = Boolean(lastEvent(journal, "rollback-started"));
  const byRole = new Map();
  for (const intent of eventRecords(journal, "file-temp-create-intent")) {
    const created = eventRecords(journal, "file-temp-created").find((record) => record.data.role === intent.data.role);
    const published = eventRecords(journal, "file-published").find((record) => record.data.role === intent.data.role);
    const removed = eventRecords(journal, "file-temp-removed").find((record) => record.data.role === intent.data.role);
    byRole.set(intent.data.role, {
      role: intent.data.role,
      category: intent.data.category,
      target: path.join(state.root, ...intent.data.target.split("/")),
      temporary: path.join(state.root, ...intent.data.temporary.split("/")),
      sha256: intent.data.sha256,
      mode: intent.data.mode,
      node: created?.data.node || published?.data.node || null,
      published: Boolean(published),
      tempRemoved: Boolean(removed),
      rollbackStarted,
    });
  }
  return [...byRole.values()];
}

async function ownedSnapshot(candidate, ownership, label, {allowIntentOnly = false} = {}) {
  const info = await lstatMaybe(candidate);
  if (!info) return null;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is not a real file`);
  const snapshot = await snapshotFile(candidate, label);
  if (snapshot.sha256 !== ownership.sha256 || (ownership.node && !sameNode(snapshot.node, ownership.node)) || (!ownership.node && !allowIntentOnly)) throw new Error(`${label} hash or inode drifted`);
  return snapshot;
}

async function analyzeCoverageRollback(journal) {
  const {state} = journal;
  const swap = lastEvent(journal, "coverage-swap-intent");
  const currentInfo = await lstatMaybe(state.paths.coverage);
  if (!swap) {
    if (!currentInfo) return {issue: "coverage disappeared before any CAS intent", action: "none"};
    const current = await snapshotFile(state.paths.coverage, "coverage rollback preflight", {singleLink: true});
    return current.sha256 === state.descriptor.coverage.expectedOriginalSha256 && current.mode === state.descriptor.coverage.expectedOriginalMode ? {action: "none"} : {issue: "coverage bytes or mode drifted before CAS", action: "none"};
  }
  if (swap.data.originalMode !== state.descriptor.coverage.expectedOriginalMode) return {issue: "coverage CAS intent original mode differs from the immutable plan", action: "none"};
  const restoreCreated = lastEvent(journal, "coverage-rollback-temp-created");
  const restoreIntent = lastEvent(journal, "coverage-rollback-intent");
  if (!currentInfo) return {action: "restore", swap, restoreIntent, restoreCreated};
  if (!currentInfo.isFile() || currentInfo.isSymbolicLink()) return {issue: "coverage is no longer a real file", action: "none"};
  const current = await snapshotFile(state.paths.coverage, "coverage rollback state");
  if (sameNode(current.node, swap.data.originalNode) && current.sha256 === swap.data.originalSha256 && current.mode === swap.data.originalMode) return {action: "none", swap};
  if (sameNode(current.node, swap.data.replacementNode) && current.sha256 === swap.data.replacementSha256 && current.mode === state.descriptor.coverage.mode) return {action: "remove-and-restore", swap, current};
  if (restoreCreated && sameNode(current.node, restoreCreated.data.node) && current.sha256 === swap.data.originalSha256 && current.mode === swap.data.originalMode) return {action: "none-restored", swap, current};
  if (restoreIntent && !restoreCreated && current.sha256 === swap.data.originalSha256) return {issue: "coverage has original bytes but an unbound replacement inode", action: "none"};
  return {issue: "coverage hash or inode drifted after CAS", action: "none"};
}

async function analyzeRollback(journal) {
  const {state} = journal;
  const issues = [];
  const owned = [];
  const rollbackStarted = Boolean(lastEvent(journal, "rollback-started"));
  for (const item of intentOwnership(journal)) {
    for (const [kind, candidate, expectedPresent] of [
      ["target", item.target, item.published && !rollbackStarted],
      ["temporary", item.temporary, !item.tempRemoved && !rollbackStarted],
    ]) {
      try {
        const snapshot = await ownedSnapshot(candidate, item, `${item.role} ${kind}`, {allowIntentOnly: kind === "temporary"});
        if (snapshot) owned.push({candidate, snapshot, role: item.role, category: item.category});
        else if (expectedPresent) issues.push(`${item.role} ${kind} disappeared before rollback`);
      } catch (error) { issues.push(error.message); }
    }
  }
  const coverage = await analyzeCoverageRollback(journal);
  if (coverage.issue) issues.push(coverage.issue);
  const coverageSwap = lastEvent(journal, "coverage-swap-intent");
  if (coverageSwap) {
    const swapTemporary = path.join(state.root, ...coverageSwap.data.temporary.split("/"));
    const swapInfo = await lstatMaybe(swapTemporary);
    if (swapInfo) {
      try {
        const snapshot = await snapshotFile(swapTemporary, "coverage swap temporary");
        if (!sameNode(snapshot.node, coverageSwap.data.replacementNode) || snapshot.sha256 !== coverageSwap.data.replacementSha256) issues.push("coverage swap temporary drifted");
        else owned.push({candidate: swapTemporary, snapshot, role: "coverage-swap-temporary", category: "transaction-temp"});
      } catch (error) { issues.push(error.message); }
    }
  }
  const archiveInfo = await lstatMaybe(state.paths.archive);
  const archiveIntent = lastEvent(journal, "archive-claim-intent");
  const archiveClaim = lastEvent(journal, "archive-claimed");
  let recoveredPreclaimNode = null;
  if (archiveInfo) {
    const realDirectory = archiveInfo.isDirectory() && !archiveInfo.isSymbolicLink();
    if (!archiveClaim) {
      const empty = realDirectory && (await readdir(state.paths.archive)).length === 0;
      if (rollbackStarted && archiveIntent && empty) recoveredPreclaimNode = nodeOf(archiveInfo);
      else issues.push("archive root is not owned by this transaction");
    } else if (!realDirectory || !sameNode(nodeOf(archiveInfo), archiveClaim.data.node)) issues.push("archive root is not owned by this transaction");
    if (!realDirectory) return {issues, owned, coverage, archiveExists: true, archiveNode: null, recoveredPreclaimNode: null};
    const knownFiles = new Set(owned.filter(({category}) => category === "archive-entry").map(({candidate}) => candidate));
    const knownDirectories = new Set(state.descriptor.archive.directories.map((entry) => entry ? path.join(state.paths.archive, ...entry.split("/")) : state.paths.archive));
    async function inspectTree(directory) {
      for (const entry of await readdir(directory, {withFileTypes: true})) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (!knownDirectories.has(candidate)) issues.push(`archive has foreign directory ${relative(state.paths.archive, candidate)}`);
          await inspectTree(candidate);
        } else if (!knownFiles.has(candidate)) issues.push(`archive has foreign file ${relative(state.paths.archive, candidate)}`);
      }
    }
    await inspectTree(state.paths.archive);
    if (!rollbackStarted && lastEvent(journal, "archive-published")) {
      const inventory = await archiveInventory(state).catch(() => null);
      if (!inventory || inventory.inventorySha256 !== state.descriptor.archive.inventorySha256) issues.push("archive inventory drifted before rollback");
    }
  } else if (!rollbackStarted && archiveClaim) issues.push("claimed archive disappeared before rollback");
  return {issues, owned, coverage, archiveExists: Boolean(archiveInfo), archiveNode: archiveClaim?.data.node || recoveredPreclaimNode, recoveredPreclaimNode};
}

async function unlinkOwned(candidate, snapshot, label) {
  const current = await snapshotFile(candidate, label).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!current) return false;
  if (!sameNode(current.node, snapshot.node) || current.sha256 !== snapshot.sha256) throw new Error(`${label} drifted after rollback preflight`);
  await unlink(candidate);
  await fsyncDirectory(path.dirname(candidate));
  return true;
}

async function restoreCoverage(journal, analysis, controller) {
  const {state} = journal;
  const temporary = deterministicTemp(state, state.paths.coverage, "coverage", "rollback");
  if (analysis.action === "none-restored") {
    const lingering = await lstatMaybe(temporary);
    if (lingering) {
      const staged = await snapshotFile(temporary, "recovered coverage rollback temporary");
      if (!analysis.current || !sameNode(staged.node, analysis.current.node) || staged.sha256 !== analysis.current.sha256) throw new Error("coverage rollback temporary is not the restored coverage hard-link twin");
      await unlink(temporary);
      await fsyncDirectory(path.dirname(temporary));
      await appendEvent(journal, "coverage-rollback-temp-removed-after-recovery", {temporary: relative(state.root, temporary), node: staged.node});
    }
    return;
  }
  if (!["restore", "remove-and-restore"].includes(analysis.action)) return;
  const swap = analysis.swap;
  const backup = await snapshotFile(state.paths.coverageBackup, "coverage rollback backup", {singleLink: true});
  if (backup.sha256 !== swap.data.originalSha256 || !sameNode(backup.node, swap.data.backupNode)) throw new Error("coverage rollback backup drifted");
  let intent = lastEvent(journal, "coverage-rollback-intent");
  if (!intent) {
    await appendEvent(journal, "coverage-rollback-intent", {temporary: relative(state.root, temporary), sha256: backup.sha256, mode: swap.data.originalMode});
    intent = lastEvent(journal, "coverage-rollback-intent");
  }
  let created = lastEvent(journal, "coverage-rollback-temp-created");
  let ownership;
  const existingTemp = await lstatMaybe(temporary);
  if (existingTemp) {
    ownership = await snapshotFile(temporary, "coverage rollback temporary", {singleLink: true});
    if (ownership.sha256 !== backup.sha256 || ownership.mode !== swap.data.originalMode || (created && !sameNode(ownership.node, created.data.node))) throw new Error("coverage rollback temporary drifted");
  } else ownership = await createExclusive(temporary, backup.bytes, swap.data.originalMode);
  if (!created) {
    await appendEvent(journal, "coverage-rollback-temp-created", {temporary: relative(state.root, temporary), sha256: ownership.sha256, mode: ownership.mode, node: ownership.node});
    created = lastEvent(journal, "coverage-rollback-temp-created");
  }
  const currentCoverage = await lstatMaybe(state.paths.coverage);
  if (analysis.action === "remove-and-restore") {
    if (!currentCoverage) throw new Error("coverage replacement disappeared before atomic rollback");
    const current = await snapshotFile(state.paths.coverage, "coverage replacement before atomic rollback");
    if (!analysis.current || !sameNode(current.node, analysis.current.node) || current.sha256 !== analysis.current.sha256 || current.mode !== analysis.current.mode) throw new Error("coverage replacement drifted before atomic rollback");
  } else if (currentCoverage) {
    throw new Error("coverage was recreated before atomic rollback");
  }
  await faultPoint(controller, "before-coverage-rollback-atomic-rename", {});
  await rename(temporary, state.paths.coverage);
  await fsyncDirectory(path.dirname(state.paths.coverage));
  await faultPoint(controller, "after-coverage-rollback-atomic-rename-before-record", {});
  const restored = await snapshotFile(state.paths.coverage, "restored coverage", {singleLink: true});
  if (!sameNode(restored.node, ownership.node) || restored.sha256 !== swap.data.originalSha256 || restored.mode !== swap.data.originalMode) throw new Error("restored coverage does not match rollback bytes and mode intent");
  await appendEvent(journal, "coverage-restored", {sha256: restored.sha256, mode: restored.mode, node: restored.node, atomicRename: true});
  await faultPoint(controller, "after-coverage-restored-during-rollback", {});
  if (await lstatMaybe(temporary)) throw new Error("coverage rollback temporary still exists after atomic rename");
  await appendEvent(journal, "coverage-rollback-temp-consumed-by-atomic-rename", {temporary: relative(state.root, temporary), node: ownership.node});
}

async function removeArchiveDirectories(state) {
  for (const relativeDirectory of [...state.descriptor.archive.directories].filter(Boolean).sort((left, right) => right.length - left.length)) {
    const candidate = path.join(state.paths.archive, ...relativeDirectory.split("/"));
    const info = await lstatMaybe(candidate);
    if (info) {
      if (!info.isDirectory() || info.isSymbolicLink() || (await readdir(candidate)).length) throw new Error(`archive directory ${relativeDirectory} drifted during rollback`);
      await rmdir(candidate);
    }
  }
}

async function rollback(journal, reason, controller) {
  if (!lastEvent(journal, "rollback-started")) await appendEvent(journal, "rollback-started", {reason});
  // Re-read after the durable rollback marker so missing owned artifacts are
  // interpreted as an interrupted prior rollback, not pre-rollback drift.
  journal.records = (await readRecordSegments(journal.state)).records;
  const analysis = await analyzeRollback(journal);
  if (analysis.issues.length) {
    await appendEvent(journal, "manual-intervention-required", {reason, issues: analysis.issues});
    throw coded(`${ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE}: ${analysis.issues.join("; ")}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  }
  await restoreCoverage(journal, analysis.coverage, controller);
  const unique = new Map();
  for (const item of analysis.owned) unique.set(item.candidate, item);
  let removedCount = 0;
  for (const item of [...unique.values()].sort((left, right) => right.candidate.length - left.candidate.length)) {
    if (await unlinkOwned(item.candidate, item.snapshot, `rollback ${item.role}`)) {
      removedCount += 1;
      await appendEvent(journal, "rollback-file-removed", {role: item.role, path: relative(journal.state.root, item.candidate), sha256: item.snapshot.sha256, node: item.snapshot.node});
      await faultPoint(controller, "after-rollback-file-removed", {role: item.role, removedCount});
    }
  }
  if (analysis.archiveExists) {
    await removeArchiveDirectories(journal.state);
    const rootInfo = await lstat(journal.state.paths.archive, {bigint: true});
    if (!analysis.archiveNode || !sameNode(nodeOf(rootInfo), analysis.archiveNode) || (await readdir(journal.state.paths.archive)).length) throw new Error("archive root drifted during rollback");
    if (analysis.recoveredPreclaimNode) await appendEvent(journal, "archive-preclaim-recovered", {node: analysis.recoveredPreclaimNode});
    await rmdir(journal.state.paths.archive);
    await fsyncDirectory(path.dirname(journal.state.paths.archive));
    await appendEvent(journal, "archive-removed-during-rollback", {node: analysis.archiveNode});
  }
  const verified = await validateRolledBack(journal.state);
  if (!verified.ok) throw new Error(`rollback postcondition failed: ${verified.issues.join("; ")}`);
  await appendEvent(journal, "transaction-rolled-back", {reason});
  return {status: "rolled-back", planSha256: journal.state.descriptor.planSha256};
}

async function withReleasedLock(lock, primaryError, result, controller = null) {
  try {
    await faultPoint(controller, "before-lock-release", {lockPath: relative(lock.state.root, lock.path), status: result?.status || null});
    await releaseLock(lock, controller);
  } catch (releaseError) {
    if (!primaryError) {
      return {
        ...result,
        cleanupWarning: {
          code: releaseError.code || ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE,
          message: `transaction reached durable ${result?.status || "terminal"} state but lock cleanup failed: ${releaseError.message}`,
          lockPath: relative(lock.state.root, lock.path),
        },
      };
    }
    const aggregate = new AggregateError([primaryError, releaseError], `${primaryError.message}; lock release also failed: ${releaseError.message}`);
    aggregate.code = releaseError.code || ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE;
    throw aggregate;
  }
  if (primaryError) throw primaryError;
  return result;
}

async function executeInternal(handle, controller) {
  const state = stateFor(handle);
  await validateAllPaths(state);
  await claimNonce(state, controller);
  const lock = await acquireLock(state, {}, controller);
  let error = null;
  let result;
  let journal = null;
  let rollbackEligible = false;
  try {
    journal = await openJournal(state, controller);
    const priorState = terminalState(journal.records);
    if (priorState === "committed") {
      const verified = await validateCommitted(state);
      if (!verified.ok) throw coded(`committed transaction drifted: ${verified.issues.join("; ")}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
      result = {status: "already-committed", planSha256: state.descriptor.planSha256};
    } else if (priorState !== "not-executed") {
      throw coded(`transaction state is ${priorState}; execute cannot retry or rollback it`, "ORIGINAL_RUNTIME_PROMOTION_RECOVERY_REQUIRED");
    } else {
      await appendEvent(journal, "lock-acquired", {ownerNonce: lock.owner.ownerNonce, ownerSha256: lock.ownerSnapshot.sha256, processId: process.pid});
      await appendEvent(journal, "execution-started", {});
      await faultPoint(controller, "after-lock-acquired", {lockOwnerPath: relative(state.root, lock.ownerPath)});
      const originalCoverage = await preflight(journal);
      rollbackEligible = true;
      for (const [, candidate] of outputs(state)) await ensureDirectoryTree(state.root, path.dirname(candidate), "canonical output parent");
      await ensureDirectoryTree(state.root, path.dirname(state.paths.archive), "archive parent");
      await publishArchive(journal, controller);
      for (const [role, candidate, content, descriptor] of outputs(state)) {
        await publishNoReplace(journal, {role, category: "canonical-output", target: candidate, content, descriptor}, controller);
      }
      await prepareCoverageSwap(journal, originalCoverage, controller);
      const verified = await validateCommitted(state);
      if (!verified.ok) throw new Error(`commit verification failed: ${verified.issues.join("; ")}`);
      await appendEvent(journal, "transaction-committed", {});
      rollbackEligible = false;
      result = {status: "committed", planSha256: state.descriptor.planSha256};
    }
  } catch (candidate) {
    error = candidate;
    if (journal && rollbackEligible) {
      try {
        await rollback(journal, candidate.message, controller);
      } catch (rollbackError) {
        const aggregate = new AggregateError([candidate, rollbackError], `${candidate.message}; rollback failed closed: ${rollbackError.message}`);
        aggregate.code = rollbackError.code || ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE;
        error = aggregate;
      }
    }
  }
  return withReleasedLock(lock, error, result, controller);
}

async function recoverInternal(handle, controller) {
  const state = stateFor(handle);
  await validateAllPaths(state);
  await claimNonce(state, controller);
  // Read the journal before stale-lock reclamation. Atomic record segments make
  // this a complete valid prefix or a fail-closed error, never half JSONL.
  let journal = null;
  let journalReadError = null;
  try {
    journal = await readExistingJournal(state);
  } catch (error) {
    if (error.code !== "ENOENT") journalReadError = error;
  }
  const lock = await acquireLock(state, {recoverStale: true, journal}, controller);
  let error = null;
  let result;
  try {
    if (journalReadError) {
      throw coded(`transaction journal requires manual inspection: ${journalReadError.message}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
    } else if (!journal) {
      if (lock.stale) result = {status: "not-started", planSha256: state.descriptor.planSha256, staleLockReclaimed: true};
      else throw coded("transaction has no execution to recover", "ORIGINAL_RUNTIME_PROMOTION_NOT_STARTED");
    } else {
      journal = await openJournal(state, controller);
      if (lock.stale) await appendEvent(journal, "stale-lock-reclaimed", {deadProcessId: lock.stale.owner.processId, deadOwnerNonce: lock.stale.owner.ownerNonce, newOwnerNonce: lock.owner.ownerNonce});
      const status = terminalState(journal.records);
      if (status === "committed") {
        const verified = await validateCommitted(state);
        if (!verified.ok) {
          await appendEvent(journal, "committed-drift-detected", {issues: verified.issues});
          throw coded(`committed transaction drifted: ${verified.issues.join("; ")}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
        }
        result = {status: "committed", planSha256: state.descriptor.planSha256};
      } else if (status === "rolled-back") {
        const verified = await validateRolledBack(state);
        if (!verified.ok) {
          await appendEvent(journal, "manual-intervention-required", {reason: "rolled-back state drifted", issues: verified.issues});
          throw coded(`rolled-back transaction drifted: ${verified.issues.join("; ")}`, ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
        }
        result = {status: "rolled-back", planSha256: state.descriptor.planSha256};
      } else if (status === "manual-intervention-required") {
        throw coded("transaction is already in manual-intervention state", ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
      } else if (status === "not-executed") {
        throw coded("transaction has no execution to recover", "ORIGINAL_RUNTIME_PROMOTION_NOT_STARTED");
      } else {
        await appendEvent(journal, "recovery-started", {ownerNonce: lock.owner.ownerNonce});
        result = await rollback(journal, "recovery of incomplete transaction", controller);
      }
    }
  } catch (candidate) {
    error = candidate;
  }
  return withReleasedLock(lock, error, result, controller);
}

async function inspectInternal(handle) {
  const state = stateFor(handle);
  await validateAllPaths(state);
  const recordInfo = await lstatMaybe(state.paths.records);
  if (!recordInfo) return {status: "not-started", planSha256: state.descriptor.planSha256, records: []};
  const {records, staging} = await readRecordSegments(state, {allowStaging: true});
  let status = terminalState(records);
  const issues = [];
  if (staging.length) issues.push("journal has an incomplete atomic record staging file");
  if (status === "committed") {
    const verified = await validateCommitted(state);
    issues.push(...verified.issues);
  } else if (status === "rolled-back") {
    const verified = await validateRolledBack(state);
    issues.push(...verified.issues);
  }
  if (issues.length) status = "manual-intervention-required";
  return {status, planSha256: state.descriptor.planSha256, issues, records};
}

/** Production write entry: the fuse is unconditional and has no options. */
export async function executeOriginalRuntimePromotionTransaction() {
  throw coded(`${ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE}: production promotion is not connected`, ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE);
}

/** Production recovery also writes and therefore remains behind the same fuse. */
export async function recoverOriginalRuntimePromotionTransaction() {
  throw coded(`${ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE}: production recovery is not connected`, ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE);
}

/** Read-only inspection requires the original private branded plan handle. */
export async function inspectOriginalRuntimePromotionTransaction(handle) {
  return inspectInternal(handle);
}
