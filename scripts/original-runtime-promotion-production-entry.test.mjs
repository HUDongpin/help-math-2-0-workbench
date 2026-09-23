import assert from "node:assert/strict";
import {execFileSync, spawn} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import * as entryModule from "./lib/original-runtime-promotion-production-entry.mjs";
import {createOriginalRuntimePromotionTransaction} from "./lib/original-runtime-promotion-transaction.mjs";

const SELF_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = await realpath(path.resolve(path.dirname(SELF_PATH), ".."));
const PRODUCTION_SOURCE_PATH = path.join(
  PROJECT_ROOT,
  "scripts",
  "lib",
  "original-runtime-promotion-production-entry.mjs",
);
const TEST_MARKER = ".original-runtime-promotion-production-entry-test-capability.json";
const TEST_CAPABILITY_ENV = "HELPMATH_PROMOTION_PRODUCTION_ENTRY_TEST_CAPABILITY";
const TEST_FAULT_ENV = "HELPMATH_PROMOTION_PRODUCTION_ENTRY_TEST_FAULT";
const RECORD_SCHEMA = 1;
const ZERO_HASH = "0".repeat(64);
const SHA256 = /^[a-f0-9]{64}$/;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

async function trustedOsTemporaryRoot() {
  const candidate = process.platform === "darwin"
    ? execFileSync("/usr/bin/getconf", ["DARWIN_USER_TEMP_DIR"], {
      encoding: "utf8",
      env: {PATH: "/usr/bin:/bin"},
    }).trim()
    : "/tmp";
  if (!path.isAbsolute(candidate)) throw new Error("trusted OS temporary root is not absolute");
  const resolved = await realpath(candidate);
  const info = await lstat(resolved, {bigint: true});
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("trusted OS temporary root is not a real directory");
  }
  return resolved;
}

const TRUSTED_OS_TEMP_ROOT = await trustedOsTemporaryRoot();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function b64(value) {
  return Buffer.from(value).toString("base64");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function coded(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`)
  );
}

function nodeOf(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return Number(info.mode & 0o777n);
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
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

async function writeAll(handle, bytes) {
  let offset = 0;
  while (offset < bytes.length) {
    const {bytesWritten} = await handle.write(bytes, offset, bytes.length - offset);
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
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPath = await lstat(candidate, {bigint: true});
    if (
      !atPath.isFile() ||
      atPath.isSymbolicLink() ||
      !sameNode(nodeOf(before), nodeOf(after)) ||
      !sameNode(nodeOf(before), nodeOf(atPath))
    ) {
      throw new Error(`${label} identity changed while reading`);
    }
    return {
      bytes,
      sha256: sha256(bytes),
      mode: permissionMode(after),
      nlink: Number(after.nlink),
      node: nodeOf(after),
    };
  } finally {
    await handle.close();
  }
}

async function assertSafePath(root, candidate, label, {directoryFinal = false} = {}) {
  if (!isInside(candidate, root)) throw new Error(`${label} escapes the fixture root`);
  if (isInside(candidate, path.join(root, "source-assets"))) {
    throw new Error(`${label} targets source-assets`);
  }
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
    if (!isInside(await realpath(cursor), root)) {
      throw new Error(`${label} resolves outside the fixture root`);
    }
  }
}

async function ensureDirectoryTree(root, directory, label) {
  await assertSafePath(root, directory, label, {directoryFinal: true});
  let cursor = root;
  for (const part of path.relative(root, directory).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    const current = await lstatMaybe(cursor);
    if (current) {
      if (!current.isDirectory() || current.isSymbolicLink()) {
        throw new Error(`${label} contains a non-directory or symbolic link`);
      }
      continue;
    }
    try {
      await mkdir(cursor, {recursive: false, mode: 0o700});
      await fsyncDirectory(path.dirname(cursor));
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const raced = await lstat(cursor, {bigint: true});
      if (!raced.isDirectory() || raced.isSymbolicLink()) {
        throw new Error(`${label} was replaced while creating it`);
      }
    }
  }
}

async function createExclusive(candidate, bytes, mode) {
  const handle = await open(
    candidate,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    mode,
  );
  let info;
  try {
    await writeAll(handle, bytes);
    await handle.chmod(mode);
    await handle.sync();
    info = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  await fsyncDirectory(path.dirname(candidate));
  return {bytes, sha256: sha256(bytes), node: nodeOf(info), nlink: Number(info.nlink)};
}

async function publishHardLinkNoReplace({temporary, final, bytes, mode, label}) {
  const finalInfo = await lstatMaybe(final);
  if (finalInfo) {
    const published = await snapshotFile(final, `${label} final`, {singleLink: true});
    if (!published.bytes.equals(bytes)) {
      throw coded(
        `${label} is already reserved by a different entry plan`,
        entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE,
      );
    }
    const stagedInfo = await lstatMaybe(temporary);
    if (stagedInfo) {
      const staged = await snapshotFile(temporary, `${label} staging`);
      if (!staged.bytes.equals(bytes)) throw new Error(`${label} staging bytes drifted`);
      await unlink(temporary);
      await fsyncDirectory(path.dirname(final));
    }
    return {fresh: false, snapshot: published};
  }

  const stagedInfo = await lstatMaybe(temporary);
  const staged = stagedInfo
    ? await snapshotFile(temporary, `${label} staging`, {singleLink: true})
    : await createExclusive(temporary, bytes, mode);
  if (!staged.bytes.equals(bytes)) throw new Error(`${label} staging bytes drifted`);
  try {
    await link(temporary, final);
    await fsyncDirectory(path.dirname(final));
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const raced = await snapshotFile(final, `${label} raced final`);
    if (!raced.bytes.equals(bytes)) {
      throw coded(
        `${label} is already reserved by a different entry plan`,
        entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE,
      );
    }
  }
  const published = await snapshotFile(final, `${label} published final`);
  const stagedAfterLink = await snapshotFile(temporary, `${label} published staging`);
  if (
    !sameNode(published.node, stagedAfterLink.node) ||
    published.nlink !== 2 ||
    stagedAfterLink.nlink !== 2 ||
    !published.bytes.equals(bytes)
  ) {
    throw new Error(`${label} hard-link publication drifted`);
  }
  await unlink(temporary);
  await fsyncDirectory(path.dirname(final));
  const durable = await snapshotFile(final, `${label} durable final`, {singleLink: true});
  return {fresh: true, snapshot: durable};
}

function releaseBundleDiagnostic(transactionPlan) {
  return {
    validationPassed: true,
    status: "read-only-release-bundle-schema-and-binding-pass",
    diagnosticOnly: true,
    authoritative: false,
    trustVerified: false,
    readyForProductionPromotion: false,
    promotionWritable: false,
    strictAcceptanceEffect: false,
    authoritativePromotionPerformed: false,
    releaseBundleSha256: sha256("synthetic release bundle"),
    releaseBundlePayloadSha256: sha256("synthetic release bundle payload"),
    preLedgerCommitmentSha256: sha256("synthetic pre-ledger commitment"),
    nonce: transactionPlan.descriptor.transactionNonce,
    nonceDurablyReserved: false,
    transactionPlanSha256: transactionPlan.planSha256,
    transactionInspectionStatus: "not-started",
    expectedOutputsSha256: sha256("synthetic expected outputs"),
    blockingDiagnostics: [
      {
        code: "ORIGINAL_RUNTIME_NONCE_NOT_DURABLY_RESERVED",
        detail: "synthetic diagnostic retains the durable nonce blocker",
      },
      {
        code: "ORIGINAL_RUNTIME_TRANSACTION_WRITES_DISABLED",
        detail: "synthetic diagnostic retains the canonical writer blocker",
      },
    ],
  };
}

async function createFixture({nonce = randomUUID(), suffix = randomUUID().slice(0, 8)} = {}) {
  const root = await realpath(
    await mkdtemp(path.join(TRUSTED_OS_TEMP_ROOT, "helpmath-production-entry-foundation-")),
  );
  assert.equal(isInside(root, TRUSTED_OS_TEMP_ROOT), true);
  assert.notEqual(root, TRUSTED_OS_TEMP_ROOT);
  assert.equal(isInside(root, PROJECT_ROOT), false);
  assert.equal(isInside(PROJECT_ROOT, root), false);
  const capability = randomUUID();
  const marker = path.join(root, TEST_MARKER);
  await writeFile(marker, `${JSON.stringify({schemaVersion: 1, capability}, null, 2)}\n`);
  await chmod(marker, 0o400);

  const migrationId = `course-entry-fixture-${suffix}`;
  const requirementId = "req:root:default:en";
  const workspace = path.join(root, "migrations", migrationId);
  const coverage = path.join(workspace, "evidence", "full-frame-coverage.json");
  const originalCoverage = Buffer.from(
    '{"status":"blocked","baselineAuthority":"unresolved"}\n',
  );
  const replacementCoverage = Buffer.from(
    '{"status":"blocked","baselineAuthority":"original-runtime"}\n',
  );
  await mkdir(path.dirname(coverage), {recursive: true});
  await writeFile(coverage, originalCoverage);
  await chmod(coverage, 0o644);

  const transaction = {
    migrationId,
    requirementId,
    expectedCoverageSha256: sha256(originalCoverage),
    expectedCoverageMode: 0o644,
    replacementCoverageBase64: b64(replacementCoverage),
    baselineBase64: b64("baseline canonical fixture\n"),
    executionReportBase64: b64("execution canonical fixture\n"),
    promotionReceiptBase64: b64("promotion canonical fixture\n"),
    archiveEntries: [
      {
        relativePath: "capture-manifest.json",
        mode: 0o444,
        bytesBase64: b64('{"complete":true}\n'),
      },
    ],
    transactionNonce: nonce,
  };
  const transactionPlan = await buildTransactionPlan(root, transaction);
  const diagnostic = releaseBundleDiagnostic(transactionPlan);
  const entryPlan = await entryModule.createOriginalRuntimePromotionProductionEntryPlan({
    projectRoot: root,
    transactionPlan,
    releaseBundleDiagnostic: diagnostic,
  });
  const input = {projectRoot: root, transaction, releaseBundleDiagnostic: diagnostic};
  const inputPath = path.join(root, "entry-input.json");
  await writeFile(inputPath, `${JSON.stringify(input, null, 2)}\n`);

  const paths = entryPaths(root, entryPlan.descriptor);
  paths.executeMarker = path.join(
    root,
    "work",
    "production-entry-test-adapter",
    "canonical-execute-marker.json",
  );
  return {
    root,
    capability,
    marker,
    migrationId,
    transaction,
    transactionPlan,
    diagnostic,
    entryPlan,
    input,
    inputPath,
    paths,
  };
}

async function buildTransactionPlan(projectRoot, transaction) {
  return createOriginalRuntimePromotionTransaction({
    projectRoot,
    migrationId: transaction.migrationId,
    requirementId: transaction.requirementId,
    expectedCoverageSha256: transaction.expectedCoverageSha256,
    expectedCoverageMode: transaction.expectedCoverageMode,
    replacementCoverage: Buffer.from(transaction.replacementCoverageBase64, "base64"),
    baseline: Buffer.from(transaction.baselineBase64, "base64"),
    executionReport: Buffer.from(transaction.executionReportBase64, "base64"),
    promotionReceipt: Buffer.from(transaction.promotionReceiptBase64, "base64"),
    archiveEntries: transaction.archiveEntries.map((entry) => ({
      relativePath: entry.relativePath,
      mode: entry.mode,
      bytes: Buffer.from(entry.bytesBase64, "base64"),
    })),
    transactionNonce: transaction.transactionNonce,
  });
}

function launch(fixture, command, {fault = "", env = {}} = {}) {
  const child = spawn(process.execPath, [SELF_PATH, command, "--input", fixture.inputPath], {
    env: {
      ...process.env,
      ...env,
      [TEST_CAPABILITY_ENV]: fixture.capability,
      [TEST_FAULT_ENV]: fault,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const done = new Promise((resolve) => child.once("exit", (code, signal) => {
    let json = null;
    const lines = stdout.trim().split("\n").filter(Boolean);
    if (lines.length) {
      try {
        json = JSON.parse(lines.at(-1));
      } catch {}
    }
    resolve({code, signal, stdout, stderr, json});
  }));
  return {child, done};
}

async function run(fixture, command, options) {
  return launch(fixture, command, options).done;
}

function entryPaths(root, descriptor) {
  const workspace = path.join(root, "migrations", descriptor.migrationId);
  const transactionParent = path.join(
    workspace,
    "evidence",
    "original-runtime-promotion-production-entry-transactions",
  );
  const transactionRoot = path.join(transactionParent, descriptor.entryPlanSha256);
  const nonceRoot = path.join(root, ".original-runtime-promotion-entry-nonce-reservations");
  return {
    workspace,
    transactionParent,
    transactionRoot,
    plan: path.join(transactionRoot, "plan.json"),
    records: path.join(transactionRoot, "journal-records"),
    nonceRoot,
    nonceReservation: path.join(nonceRoot, `${descriptor.transactionNonceSha256}.json`),
  };
}

function harnessState(root, entryPlan, transactionPlan) {
  return {
    root,
    descriptor: entryPlan.descriptor,
    transactionPlan,
    paths: entryPaths(root, entryPlan.descriptor),
  };
}

async function validateAllPaths(state) {
  for (const [label, candidate] of Object.entries(state.paths)) {
    await assertSafePath(state.root, candidate, label, {
      directoryFinal: [
        "workspace",
        "transactionParent",
        "transactionRoot",
        "records",
        "nonceRoot",
      ].includes(label),
    });
  }
}

function nonceDocument(state) {
  return {
    schemaVersion: 1,
    artifactType: "original-runtime-promotion-production-entry-nonce-reservation",
    nonceSha256: state.descriptor.transactionNonceSha256,
    entryPlanSha256: state.descriptor.entryPlanSha256,
    transactionPlanSha256: state.descriptor.transactionPlanSha256,
    releaseBundleSha256: state.descriptor.releaseBundleSha256,
  };
}

function nonceStagingPath(state) {
  return path.join(
    state.paths.nonceRoot,
    `.${state.descriptor.transactionNonceSha256}.${state.descriptor.entryPlanSha256}.tmp`,
  );
}

async function reserveNonce(state) {
  await ensureDirectoryTree(state.root, state.paths.nonceRoot, "entry nonce root");
  const bytes = Buffer.from(`${JSON.stringify(nonceDocument(state), null, 2)}\n`);
  return publishHardLinkNoReplace({
    temporary: nonceStagingPath(state),
    final: state.paths.nonceReservation,
    bytes,
    mode: 0o400,
    label: "production-entry nonce",
  });
}

async function inspectNonce(state) {
  const info = await lstatMaybe(state.paths.nonceReservation);
  if (!info) return {present: false};
  const expected = Buffer.from(`${JSON.stringify(nonceDocument(state), null, 2)}\n`);
  const snapshot = await snapshotFile(
    state.paths.nonceReservation,
    "production-entry nonce reservation",
    {singleLink: true},
  );
  if (!snapshot.bytes.equals(expected)) {
    throw coded(
      "production-entry nonce is reserved by a different plan",
      entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE,
    );
  }
  return {present: true};
}

function completeRecord(state, sequence, previousRecordSha256, event, data) {
  const body = {
    schemaVersion: RECORD_SCHEMA,
    entryPlanSha256: state.descriptor.entryPlanSha256,
    sequence,
    previousRecordSha256,
    event,
    recordedAt: new Date().toISOString(),
    data,
  };
  return {...body, recordSha256: sha256(Buffer.from(canonicalJson(body)))};
}

function recordFilename(record) {
  return `${String(record.sequence).padStart(8, "0")}-${record.recordSha256}.jsonl`;
}

async function readRecords(state) {
  const info = await lstatMaybe(state.paths.records);
  if (!info) return [];
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("production-entry record root is not a real directory");
  }
  const entries = (await readdir(state.paths.records)).sort();
  const staging = entries.filter((name) => name.startsWith(".record-") && name.endsWith(".tmp"));
  if (staging.length) throw new Error("production-entry journal has an incomplete staging record");
  const names = entries.filter((name) => /^\d{8}-[a-f0-9]{64}\.jsonl$/.test(name));
  if (names.length !== entries.length) {
    throw new Error("production-entry journal contains an unexpected entry");
  }
  const records = [];
  let previous = ZERO_HASH;
  for (let index = 0; index < names.length; index += 1) {
    const snapshot = await snapshotFile(
      path.join(state.paths.records, names[index]),
      `production-entry record ${index + 1}`,
      {singleLink: true},
    );
    if (snapshot.bytes.at(-1) !== 0x0a || snapshot.bytes.subarray(0, -1).includes(0x0a)) {
      throw new Error(`production-entry record ${index + 1} is not one complete JSONL line`);
    }
    let record;
    try {
      record = JSON.parse(snapshot.bytes.toString("utf8").slice(0, -1));
    } catch {
      throw new Error(`production-entry record ${index + 1} is invalid JSON`);
    }
    const {recordSha256, ...body} = record;
    if (
      record.schemaVersion !== RECORD_SCHEMA ||
      record.entryPlanSha256 !== state.descriptor.entryPlanSha256 ||
      record.sequence !== index + 1 ||
      record.previousRecordSha256 !== previous ||
      !SHA256.test(recordSha256 || "") ||
      sha256(Buffer.from(canonicalJson(body))) !== recordSha256 ||
      names[index] !== recordFilename(record)
    ) {
      throw new Error(`production-entry record ${index + 1} breaks the hash chain`);
    }
    records.push(record);
    previous = recordSha256;
  }
  return records;
}

async function appendRecord(state, records, event, data = {}) {
  const current = await readRecords(state);
  if (
    current.length !== records.length ||
    current.at(-1)?.recordSha256 !== records.at(-1)?.recordSha256
  ) {
    throw new Error("production-entry journal prefix changed before append");
  }
  const record = completeRecord(
    state,
    current.length + 1,
    current.at(-1)?.recordSha256 || ZERO_HASH,
    event,
    data,
  );
  const bytes = Buffer.from(`${JSON.stringify(record)}\n`);
  const temporary = path.join(
    state.paths.records,
    `.record-${String(record.sequence).padStart(8, "0")}-${record.recordSha256}.tmp`,
  );
  const published = await publishHardLinkNoReplace({
    temporary,
    final: path.join(state.paths.records, recordFilename(record)),
    bytes,
    mode: 0o400,
    label: `production-entry record ${record.sequence}`,
  });
  if (!published.fresh) throw new Error("production-entry journal record replay detected");
  records.push(record);
}

async function openJournal(state) {
  await ensureDirectoryTree(state.root, state.paths.transactionRoot, "entry transaction root");
  const planBytes = Buffer.from(`${JSON.stringify(state.descriptor, null, 2)}\n`);
  const planInfo = await lstatMaybe(state.paths.plan);
  if (!planInfo) await createExclusive(state.paths.plan, planBytes, 0o400);
  else if (!(await snapshotFile(state.paths.plan, "production-entry plan", {singleLink: true})).bytes.equals(planBytes)) {
    throw new Error("production-entry plan file differs from its content address");
  }
  await ensureDirectoryTree(state.root, state.paths.records, "entry record root");
  const records = await readRecords(state);
  if (!records.length) {
    const first = completeRecord(state, 1, ZERO_HASH, "entry-begin", {
      transactionPlanSha256: state.descriptor.transactionPlanSha256,
      releaseBundleSha256: state.descriptor.releaseBundleSha256,
    });
    const bytes = Buffer.from(`${JSON.stringify(first)}\n`);
    const temporary = path.join(state.paths.records, `.record-00000001-${first.recordSha256}.tmp`);
    await publishHardLinkNoReplace({
      temporary,
      final: path.join(state.paths.records, recordFilename(first)),
      bytes,
      mode: 0o400,
      label: "production-entry record 1",
    });
    return [first];
  }
  if (records[0].event !== "entry-begin") {
    throw new Error("production-entry journal has no plan-bound beginning");
  }
  return records;
}

function terminalState(records) {
  if (records.some(({event}) => event === "entry-committed")) return "committed";
  if (records.some(({event}) => event === "entry-rolled-back")) return "rolled-back";
  if (records.some(({event}) => event === "entry-recovered-not-started")) return "not-started";
  return records.length ? "incomplete-recovery-required" : "nonce-reserved-recovery-required";
}

function adapterFor(state, fault) {
  const markerRoot = path.join(state.root, "work", "production-entry-test-adapter");
  const executeMarker = path.join(markerRoot, "canonical-execute-marker.json");
  return {
    async execute() {
      const nonce = await inspectNonce(state);
      if (!nonce.present) throw new Error("test canonical executor observed no durable nonce");
      await ensureDirectoryTree(state.root, markerRoot, "test adapter marker root");
      await createExclusive(
        executeMarker,
        Buffer.from(`${JSON.stringify({
          schemaVersion: 1,
          event: "canonical-execute",
          noncePresentBeforeExecute: true,
          nonceSha256: state.descriptor.transactionNonceSha256,
        }, null, 2)}\n`),
        0o400,
      );
      if (fault === "exit-after-test-canonical-execute") process.exit(112);
      return {status: "committed"};
    },
    async recover() {
      const info = await lstatMaybe(executeMarker);
      if (!info) return {status: "not-started"};
      await snapshotFile(executeMarker, "test canonical execute marker", {singleLink: true});
      await unlink(executeMarker);
      await fsyncDirectory(markerRoot);
      return {status: "rolled-back"};
    },
  };
}

async function executeHarness(state, fault) {
  await validateAllPaths(state);
  const nonce = await reserveNonce(state);
  if (!nonce.fresh) {
    throw coded(
      "production-entry nonce is already reserved; recovery is required",
      entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED_CODE,
    );
  }
  if (fault === "exit-after-entry-nonce-reservation") process.exit(111);
  const records = await openJournal(state);
  await appendRecord(state, records, "nonce-reserved", {
    nonceSha256: state.descriptor.transactionNonceSha256,
  });
  await appendRecord(state, records, "canonical-execute-intent", {
    transactionPlanSha256: state.descriptor.transactionPlanSha256,
  });
  const result = await adapterFor(state, fault).execute();
  await appendRecord(state, records, "canonical-execute-returned", {status: result.status});
  await appendRecord(state, records, "entry-committed", {canonicalStatus: result.status});
  return {
    status: "committed",
    entryPlanSha256: state.descriptor.entryPlanSha256,
    nonceDurablyReservedBeforeExecute: true,
  };
}

async function recoverHarness(state, fault) {
  await validateAllPaths(state);
  if (!(await inspectNonce(state)).present) {
    throw coded(
      "production-entry nonce was never reserved",
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NOT_STARTED",
    );
  }
  const records = await openJournal(state);
  const before = terminalState(records);
  if (["committed", "rolled-back", "not-started"].includes(before)) {
    return {status: before, recoveryIdempotent: true};
  }
  await appendRecord(state, records, "recovery-intent", {priorState: before});
  const result = await adapterFor(state, fault).recover();
  await appendRecord(state, records, "canonical-recover-returned", {status: result.status});
  if (result.status === "rolled-back") {
    await appendRecord(state, records, "entry-rolled-back", {});
  } else if (result.status === "not-started") {
    await appendRecord(state, records, "entry-recovered-not-started", {});
  } else {
    throw new Error("test recovery returned an unsupported state");
  }
  return {status: result.status, recoveredFrom: before};
}

async function assertIsolatedHarnessRoot(projectRoot) {
  const root = await realpath(path.resolve(projectRoot));
  if (root === TRUSTED_OS_TEMP_ROOT || !isInside(root, TRUSTED_OS_TEMP_ROOT)) {
    throw new Error("entry harness requires a self-created directory under the trusted OS temporary root");
  }
  if (
    root === PROJECT_ROOT ||
    isInside(root, PROJECT_ROOT) ||
    isInside(PROJECT_ROOT, root)
  ) {
    throw new Error("entry harness refuses the HELP Math workspace and all of its ancestors or descendants");
  }
  const rootInfo = await lstat(root, {bigint: true});
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink() || (permissionMode(rootInfo) & 0o077) !== 0) {
    throw new Error("entry harness root must be a private real directory");
  }
  const capability = process.env[TEST_CAPABILITY_ENV];
  if (typeof capability !== "string" || capability.length < 16) {
    throw new Error("entry harness capability is missing");
  }
  const marker = await snapshotFile(path.join(root, TEST_MARKER), "entry harness marker", {
    singleLink: true,
  });
  const expected = Buffer.from(`${JSON.stringify({schemaVersion: 1, capability}, null, 2)}\n`);
  if (!marker.bytes.equals(expected) || marker.mode !== 0o400) {
    throw new Error("entry harness marker is invalid");
  }
  return root;
}

async function loadHarnessState(inputPath) {
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const root = await assertIsolatedHarnessRoot(input.projectRoot);
  const transactionPlan = await buildTransactionPlan(root, input.transaction);
  const entryPlan = await entryModule.createOriginalRuntimePromotionProductionEntryPlan({
    projectRoot: root,
    transactionPlan,
    releaseBundleDiagnostic: {
      ...input.releaseBundleDiagnostic,
      nonce: transactionPlan.descriptor.transactionNonce,
      transactionPlanSha256: transactionPlan.planSha256,
    },
  });
  return {entryPlan, state: harnessState(root, entryPlan, transactionPlan)};
}

async function harnessMain(command, inputPath) {
  const {entryPlan, state} = await loadHarnessState(inputPath);
  const fault = process.env[TEST_FAULT_ENV] || "";
  if (command === "__test-execute") return executeHarness(state, fault);
  if (command === "__test-recover") return recoverHarness(state, fault);
  if (command === "__test-inspect") {
    return entryModule.inspectOriginalRuntimePromotionProductionEntry(entryPlan);
  }
  throw new Error("unknown entry harness command");
}

async function journalEvents(recordsPath) {
  const names = (await readdir(recordsPath))
    .filter((name) => /^\d{8}-[a-f0-9]{64}\.jsonl$/.test(name))
    .sort();
  const records = [];
  for (const name of names) {
    records.push(JSON.parse((await readFile(path.join(recordsPath, name), "utf8")).trim()));
  }
  return records;
}

function registerTests() {
  test("production module is statically read-only and exposes no hidden harness or bypass", async () => {
    assert.deepEqual(Object.keys(entryModule).sort(), [
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE",
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED",
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE",
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED_CODE",
      "ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED",
      "createOriginalRuntimePromotionProductionEntryPlan",
      "executeOriginalRuntimePromotionProductionEntry",
      "inspectOriginalRuntimePromotionProductionEntry",
      "recoverOriginalRuntimePromotionProductionEntry",
    ]);
    assert.equal(entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED, false);
    assert.equal(entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED, false);
    assert.equal(entryModule.executeOriginalRuntimePromotionProductionEntry.length, 0);
    assert.equal(entryModule.recoverOriginalRuntimePromotionProductionEntry.length, 0);
    await assert.rejects(
      entryModule.executeOriginalRuntimePromotionProductionEntry({adapter: {execute() {}}}),
      {code: entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE},
    );
    await assert.rejects(
      entryModule.recoverOriginalRuntimePromotionProductionEntry({adapter: {recover() {}}}),
      {code: entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE},
    );

    const source = await readFile(PRODUCTION_SOURCE_PATH, "utf8");
    assert.doesNotMatch(source, /\b(?:appendFile|chmod|copyFile|cp|link|mkdir|rename|rm|rmdir|symlink|truncate|unlink|writeFile)\s*\(/);
    assert.doesNotMatch(source, /\b(?:O_APPEND|O_CREAT|O_EXCL|O_TRUNC|O_WRONLY)\b/);
    assert.doesNotMatch(source, /\.write\s*\(|\.chmod\s*\(|\.sync\s*\(/);
    assert.doesNotMatch(source, /process\.(?:argv|env|exit)|HELPMATH_|__test-/);
    assert.doesNotMatch(source, /test-support|testAdapter|faultPoint|executeInternal|recoverInternal/);
  });

  test("plain diagnostic data can shape only an immutable read-only plan", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    assert.equal(Object.isFrozen(fixture.entryPlan), true);
    assert.equal(Object.isFrozen(fixture.entryPlan.descriptor), true);
    assert.equal(fixture.entryPlan.descriptor.productionPromotionEnabled, false);
    assert.equal(fixture.entryPlan.descriptor.canonicalExecutorConnected, false);
    assert.equal(fixture.entryPlan.descriptor.kernelAnchoredPathRaceClosureIntegrated, false);
    assert.equal(fixture.entryPlan.descriptor.receiptIssuerIntegrated, false);
    assert.equal(fixture.entryPlan.descriptor.strictAcceptanceEffect, false);

    const forgedDiagnostic = structuredClone(fixture.diagnostic);
    forgedDiagnostic.releaseBundleSha256 = sha256("caller-forged structural diagnostic");
    const readOnly = await entryModule.createOriginalRuntimePromotionProductionEntryPlan({
      projectRoot: fixture.root,
      transactionPlan: fixture.transactionPlan,
      releaseBundleDiagnostic: forgedDiagnostic,
    });
    await assert.rejects(
      entryModule.executeOriginalRuntimePromotionProductionEntry(readOnly),
      {code: entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_DISABLED_CODE},
    );
    assert.equal(await exists(fixture.paths.nonceReservation), false);
    assert.equal(await exists(fixture.paths.transactionRoot), false);
    await assert.rejects(
      entryModule.inspectOriginalRuntimePromotionProductionEntry(structuredClone(readOnly)),
      /original process-private branded handle/,
    );
  });

  test("isolated entry reserves the nonce durably before canonical execute", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    const executed = await run(fixture, "__test-execute");
    assert.equal(executed.code, 0, executed.stderr || executed.stdout);
    assert.equal(executed.json.result.status, "committed");
    assert.equal(executed.json.result.nonceDurablyReservedBeforeExecute, true);
    const marker = JSON.parse(await readFile(fixture.paths.executeMarker, "utf8"));
    assert.equal(marker.noncePresentBeforeExecute, true);
    const records = await journalEvents(fixture.paths.records);
    assert.deepEqual(records.map(({event}) => event), [
      "entry-begin",
      "nonce-reserved",
      "canonical-execute-intent",
      "canonical-execute-returned",
      "entry-committed",
    ]);
    const inspected = await run(fixture, "__test-inspect");
    assert.equal(inspected.code, 0, inspected.stderr || inspected.stdout);
    assert.equal(inspected.json.result.status, "committed");
    assert.equal(inspected.json.result.strictAcceptanceEffect, false);

    const replay = await run(fixture, "__test-execute");
    assert.equal(replay.code, 1);
    assert.equal(
      replay.json.error.code,
      entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED_CODE,
    );
  });

  test("crash after nonce reservation can only enter recovery, never execute replay", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    const crashed = await run(fixture, "__test-execute", {
      fault: "exit-after-entry-nonce-reservation",
    });
    assert.equal(crashed.code, 111);
    assert.equal(await exists(fixture.paths.nonceReservation), true);
    assert.equal(await exists(fixture.paths.executeMarker), false);
    assert.equal(await exists(fixture.paths.records), false);

    const replay = await run(fixture, "__test-execute");
    assert.equal(replay.code, 1);
    assert.equal(
      replay.json.error.code,
      entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_RECOVERY_REQUIRED_CODE,
    );
    const recovered = await run(fixture, "__test-recover");
    assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
    assert.equal(recovered.json.result.status, "not-started");
    assert.deepEqual((await journalEvents(fixture.paths.records)).map(({event}) => event), [
      "entry-begin",
      "recovery-intent",
      "canonical-recover-returned",
      "entry-recovered-not-started",
    ]);
  });

  test("crash after canonical execute is recovered without a second execute", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    const crashed = await run(fixture, "__test-execute", {
      fault: "exit-after-test-canonical-execute",
    });
    assert.equal(crashed.code, 112);
    assert.equal(await exists(fixture.paths.executeMarker), true);
    assert.equal((await journalEvents(fixture.paths.records)).at(-1).event, "canonical-execute-intent");

    const recovered = await run(fixture, "__test-recover");
    assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
    assert.equal(recovered.json.result.status, "rolled-back");
    assert.equal(await exists(fixture.paths.executeMarker), false);
    const after = await journalEvents(fixture.paths.records);
    assert.equal(after.filter(({event}) => event === "canonical-execute-intent").length, 1);
    assert.equal(after.at(-1).event, "entry-rolled-back");

    const repeated = await run(fixture, "__test-recover");
    assert.equal(repeated.code, 0);
    assert.equal(repeated.json.result.status, "rolled-back");
    assert.equal(repeated.json.result.recoveryIdempotent, true);
  });

  test("same nonce cannot be reserved by a changed transaction plan", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    assert.equal((await run(fixture, "__test-execute", {
      fault: "exit-after-entry-nonce-reservation",
    })).code, 111);
    const changed = structuredClone(fixture.input);
    changed.transaction.baselineBase64 = b64("changed baseline under reused nonce\n");
    await writeFile(fixture.inputPath, `${JSON.stringify(changed, null, 2)}\n`);
    const reused = await run(fixture, "__test-execute");
    assert.equal(reused.code, 1);
    assert.equal(
      reused.json.error.code,
      entryModule.ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_NONCE_REUSED_CODE,
    );
    assert.equal(await exists(fixture.paths.executeMarker), false);
  });

  test("journal drift fails closed and preserves durable state", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    assert.equal((await run(fixture, "__test-execute")).code, 0);
    const firstPath = path.join(fixture.paths.records, (await readdir(fixture.paths.records)).sort()[0]);
    await chmod(firstPath, 0o600);
    await writeFile(firstPath, "foreign journal drift\n");
    const inspected = await run(fixture, "__test-inspect");
    assert.equal(inspected.code, 1);
    assert.match(inspected.json.error.message, /invalid JSON|hash chain/);
    assert.equal(await exists(fixture.paths.nonceReservation), true);
    assert.equal(await exists(fixture.paths.executeMarker), true);
  });

  test("symlinked entry ancestors are rejected before nonce or adapter writes", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    const evidenceRoot = path.join(fixture.root, "migrations", fixture.migrationId, "evidence");
    const foreign = path.join(fixture.root, "foreign-evidence");
    await rm(evidenceRoot, {recursive: true});
    await mkdir(foreign);
    await symlink(foreign, evidenceRoot);
    const result = await run(fixture, "__test-execute");
    assert.equal(result.code, 1);
    assert.match(result.json.error.message, /symbolic-link component/);
    assert.equal(await exists(fixture.paths.nonceReservation), false);
    assert.equal(await exists(fixture.paths.executeMarker), false);
    assert.deepEqual(await readdir(foreign), []);
  });

  test("poisoned TMPDIR cannot authorize the real HELP Math project", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    await writeFile(
      fixture.inputPath,
      `${JSON.stringify({...fixture.input, projectRoot: PROJECT_ROOT}, null, 2)}\n`,
    );
    const result = await run(fixture, "__test-execute", {
      env: {TMPDIR: PROJECT_ROOT, TMP: PROJECT_ROOT, TEMP: PROJECT_ROOT},
    });
    assert.equal(result.code, 1);
    assert.match(result.json.error.message, /trusted OS temporary root|refuses the HELP Math workspace/);
    assert.equal(await exists(fixture.paths.nonceReservation), false);
    assert.equal(await exists(fixture.paths.executeMarker), false);
  });

  test("isolated harness rejects an invalid capability marker", async (t) => {
    const fixture = await createFixture();
    t.after(() => rm(fixture.root, {recursive: true, force: true}));
    await chmod(fixture.marker, 0o600);
    const result = await run(fixture, "__test-execute");
    assert.equal(result.code, 1);
    assert.match(result.json.error.message, /marker is invalid/);
    assert.equal(await exists(fixture.paths.nonceReservation), false);
  });
}

const [command, inputFlag, inputPath] = process.argv.slice(2);
if (command?.startsWith("__test-")) {
  if (inputFlag !== "--input" || !inputPath) throw new Error("invalid entry harness command");
  harnessMain(command, inputPath)
    .then((result) => {
      process.stdout.write(`${JSON.stringify({ok: true, result})}\n`);
    })
    .catch((error) => {
      process.stdout.write(`${JSON.stringify({
        ok: false,
        error: {name: error.name, code: error.code || null, message: error.message},
      })}\n`);
      process.exitCode = 1;
    });
} else {
  registerTests();
}
