import assert from "node:assert/strict";
import {execFileSync, spawn} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
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
import {fileURLToPath, pathToFileURL} from "node:url";

import * as transactionModule from "./lib/original-runtime-promotion-transaction.mjs";

const SELF_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = await realpath(path.resolve(path.dirname(SELF_PATH), ".."));
const PRODUCTION_MODULE_PATH = path.join(
  PROJECT_ROOT,
  "scripts",
  "lib",
  "original-runtime-promotion-transaction.mjs",
);
const TEST_MARKER = ".original-runtime-promotion-transaction-test-capability.json";
const TEST_CAPABILITY_ENV = "HELPMATH_PROMOTION_TRANSACTION_TEST_CAPABILITY";
const TEST_FAULT_ENV = "HELPMATH_PROMOTION_TRANSACTION_TEST_FAULT";
const TEST_BRIDGE_EXPORT = "TRANSACTION_TEST_ONLY_BRIDGE";
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

function nodeKey(info) {
  const node = "dev" in info && "ino" in info ? nodeOf(info) : info;
  return `${node.dev}:${node.ino}`;
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return Number(info.mode & 0o777n);
}

async function directoryIdentity(candidate, label) {
  const resolved = await realpath(candidate);
  const atPathBefore = await lstat(resolved, {bigint: true});
  if (!atPathBefore.isDirectory() || atPathBefore.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory`);
  }
  const handle = await open(resolved, fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW);
  try {
    const throughHandle = await handle.stat({bigint: true});
    const atPathAfter = await lstat(resolved, {bigint: true});
    const expected = nodeOf(atPathBefore);
    if (
      !throughHandle.isDirectory() ||
      !atPathAfter.isDirectory() ||
      atPathAfter.isSymbolicLink() ||
      !sameNode(expected, nodeOf(throughHandle)) ||
      !sameNode(expected, nodeOf(atPathAfter))
    ) {
      throw new Error(`${label} identity changed during validation`);
    }
    return {path: resolved, info: atPathAfter, node: expected};
  } finally {
    await handle.close();
  }
}

async function lineageNodeKeys(candidate) {
  const keys = new Set();
  let cursor = candidate;
  for (;;) {
    const identity = await directoryIdentity(cursor, "transaction harness lineage");
    keys.add(nodeKey(identity.node));
    const parent = path.dirname(cursor);
    if (parent === cursor) return keys;
    cursor = parent;
  }
}

async function snapshotCapabilityMarker(candidate) {
  const handle = await open(candidate, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    if (!before.isFile() || before.nlink !== 1n) {
      throw new Error("transaction harness marker must be a single-link regular file");
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPath = await lstat(candidate, {bigint: true});
    const expected = nodeOf(before);
    if (
      !after.isFile() ||
      !atPath.isFile() ||
      atPath.isSymbolicLink() ||
      after.nlink !== 1n ||
      atPath.nlink !== 1n ||
      !sameNode(expected, nodeOf(after)) ||
      !sameNode(expected, nodeOf(atPath))
    ) {
      throw new Error("transaction harness marker identity changed while reading");
    }
    return {bytes, mode: permissionMode(after)};
  } finally {
    await handle.close();
  }
}

async function assertIsolatedHarnessRoot(projectRoot) {
  const rootIdentity = await directoryIdentity(
    path.resolve(projectRoot),
    "transaction harness root",
  );
  const trustedIdentity = await directoryIdentity(
    TRUSTED_OS_TEMP_ROOT,
    "trusted OS temporary root",
  );
  const projectIdentity = await directoryIdentity(PROJECT_ROOT, "HELP Math project root");
  const root = rootIdentity.path;
  if (root === trustedIdentity.path || !isInside(root, trustedIdentity.path)) {
    throw new Error("transaction harness requires a self-created directory under the trusted OS temporary root");
  }
  const rootLineage = await lineageNodeKeys(root);
  if (!rootLineage.has(nodeKey(trustedIdentity.node))) {
    throw new Error("transaction harness root is not inode-contained by the trusted OS temporary root");
  }
  const projectLineage = await lineageNodeKeys(projectIdentity.path);
  if (
    root === projectIdentity.path ||
    isInside(root, projectIdentity.path) ||
    isInside(projectIdentity.path, root) ||
    rootLineage.has(nodeKey(projectIdentity.node)) ||
    projectLineage.has(nodeKey(rootIdentity.node))
  ) {
    throw new Error("transaction harness refuses the HELP Math workspace and all of its ancestors or descendants");
  }
  if ((permissionMode(rootIdentity.info) & 0o077) !== 0) {
    throw new Error("transaction harness root must be private");
  }
  const capability = process.env[TEST_CAPABILITY_ENV];
  if (typeof capability !== "string" || capability.length < 16) {
    throw new Error("transaction harness capability is missing");
  }
  const marker = await snapshotCapabilityMarker(path.join(root, TEST_MARKER));
  const expected = Buffer.from(`${JSON.stringify({schemaVersion: 1, capability}, null, 2)}\n`);
  if (!marker.bytes.equals(expected) || marker.mode !== 0o400) {
    throw new Error("transaction harness marker is invalid");
  }
  return root;
}

async function loadHarnessInput(candidate) {
  const document = JSON.parse(await readFile(candidate, "utf8"));
  return {
    projectRoot: document.projectRoot,
    migrationId: document.migrationId,
    requirementId: document.requirementId,
    expectedCoverageSha256: document.expectedCoverageSha256,
    expectedCoverageMode: document.expectedCoverageMode,
    replacementCoverage: Buffer.from(document.replacementCoverageBase64, "base64"),
    baseline: Buffer.from(document.baselineBase64, "base64"),
    executionReport: Buffer.from(document.executionReportBase64, "base64"),
    promotionReceipt: Buffer.from(document.promotionReceiptBase64, "base64"),
    archiveEntries: document.archiveEntries.map((entry) => ({
      relativePath: entry.relativePath,
      mode: entry.mode,
      bytes: Buffer.from(entry.bytesBase64, "base64"),
    })),
    transactionNonce: document.transactionNonce,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function harnessController(fault, state) {
  let rollbackRemovalCount = 0;
  return async (checkpoint, details) => {
    const safeDetails = deepFreeze(cloneJson(details));
    if (safeDetails.plan || safeDetails.payloads || safeDetails.descriptor) {
      throw new Error("test hook received mutable plan state");
    }
    if (fault === "hold-after-lock" && checkpoint === "after-lock-acquired") {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    }
    if (fault === "throw-after-baseline" && checkpoint === "after-file-published" && details.role === "baseline") {
      throw new Error("injected failure after baseline");
    }
    if (fault === "drift-baseline-then-throw" && checkpoint === "after-file-published" && details.role === "baseline") {
      const target = path.join(state.root, ...details.target.split("/"));
      await unlink(target);
      await writeFile(target, "foreign drift\n");
      throw new Error("injected drift after baseline");
    }
    if (fault === "exit-after-journal-record-link" && checkpoint === "after-journal-record-linked-before-staging-unlink" && details.event === "coverage-swapped") process.exit(89);
    if (fault === "exit-before-coverage-atomic-rename" && checkpoint === "after-coverage-swap-intent-before-atomic-rename") process.exit(90);
    if ((fault === "exit-after-coverage-unlink" || fault === "exit-after-coverage-atomic-rename") && checkpoint === "after-coverage-atomic-rename-before-record") process.exit(91);
    if (fault === "exit-after-temp-create-before-record" && checkpoint === "after-file-temp-created-before-record" && details.role === "baseline") process.exit(87);
    if (fault === "exit-during-rollback" && checkpoint === "after-coverage-swapped") throw new Error("begin rollback before simulated exit");
    if (fault === "exit-during-rollback" && checkpoint === "after-rollback-file-removed") {
      rollbackRemovalCount += 1;
      if (rollbackRemovalCount === 1) process.exit(88);
    }
    if (["exit-after-coverage-rollback-rename", "exit-after-coverage-restored-record"].includes(fault) && checkpoint === "after-coverage-swapped") throw new Error("begin rollback before coverage restore exit");
    if (fault === "exit-after-coverage-rollback-rename" && checkpoint === "after-coverage-rollback-atomic-rename-before-record") process.exit(92);
    if (fault === "exit-after-coverage-restored-record" && checkpoint === "after-coverage-restored-during-rollback") process.exit(93);
    if (fault === "exit-after-lock-link" && checkpoint === "after-lock-file-linked-before-staging-unlink") process.exit(94);
    if (fault === "exit-after-lock-published-before-journal" && checkpoint === "after-lock-published-before-journal") process.exit(95);
    if (fault === "exit-after-lock-unlink" && checkpoint === "after-lock-file-unlinked-before-parent-fsync") process.exit(96);
    if (fault === "exit-after-archive-directory-create" && checkpoint === "after-archive-directory-created-before-claim-record") process.exit(97);
    if (fault === "exit-after-output-hardlink-before-record" && checkpoint === "after-file-hardlink-before-published-record" && details.role === "baseline") process.exit(98);
    if (fault === "exit-after-output-published-before-temp-unlink" && checkpoint === "after-file-published" && details.role === "baseline") process.exit(99);
    if (fault === "exit-after-nonce-link" && checkpoint === "after-nonce-reservation-linked-before-staging-unlink") process.exit(100);
    if (fault === "exit-after-plan-published-before-records" && checkpoint === "after-transaction-plan-published-before-record-directory") process.exit(101);
    if (fault === "exit-after-record-directory-before-begin" && checkpoint === "after-record-directory-created-before-transaction-begin") process.exit(102);
    if (fault === "drift-lock-and-throw" && checkpoint === "after-lock-acquired") {
      const owner = path.join(state.root, ...details.lockOwnerPath.split("/"));
      await unlink(owner);
      await writeFile(owner, "foreign lock owner\n");
      throw new Error("injected primary error with lock drift");
    }
    if (fault === "drift-lock-after-commit" && checkpoint === "before-lock-release" && details.status === "committed") {
      const lockPath = path.join(state.root, ...details.lockPath.split("/"));
      await unlink(lockPath);
      await writeFile(lockPath, "foreign committed lock drift\n");
    }
  };
}

function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    code: error.code || null,
    errors: error instanceof AggregateError ? error.errors.map(serializeError) : [],
  };
}

async function loadTestOnlyBridge(harnessRoot) {
  const productionSource = await readFile(PRODUCTION_MODULE_PATH, "utf8");
  const root = await mkdtemp(path.join(harnessRoot, ".transaction-test-only-bridge-"));
  await chmod(root, 0o700);
  const modulePath = path.join(root, "original-runtime-promotion-transaction.test-only.mjs");
  const bridge = [
    "",
    `export const ${TEST_BRIDGE_EXPORT} = Object.freeze({`,
    "  createOriginalRuntimePromotionTransaction,",
    "  stateFor,",
    "  executeInternal,",
    "  recoverInternal,",
    "  inspectInternal,",
    "});",
    "",
  ].join("\n");
  await writeFile(modulePath, `${productionSource}${bridge}`, {mode: 0o400});
  try {
    const loaded = await import(`${pathToFileURL(modulePath).href}?instance=${randomUUID()}`);
    return {
      bridge: loaded[TEST_BRIDGE_EXPORT],
      cleanup: () => rm(root, {recursive: true, force: true}),
    };
  } catch (error) {
    await rm(root, {recursive: true, force: true});
    throw error;
  }
}

async function runHarness(command, inputPath) {
  const options = await loadHarnessInput(inputPath);
  options.projectRoot = await assertIsolatedHarnessRoot(options.projectRoot);
  const loaded = await loadTestOnlyBridge(options.projectRoot);
  try {
    const handle = await loaded.bridge.createOriginalRuntimePromotionTransaction(options);
    const state = loaded.bridge.stateFor(handle);
    const controller = harnessController(process.env[TEST_FAULT_ENV] || "", state);
    if (command === "__test-execute") return loaded.bridge.executeInternal(handle, controller);
    if (command === "__test-recover") return loaded.bridge.recoverInternal(handle, controller);
    if (command === "__test-inspect") return loaded.bridge.inspectInternal(handle);
    throw new Error("unknown transaction harness command");
  } finally {
    await loaded.cleanup();
  }
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

function safeRequirementId(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

async function createFixture({nonce = randomUUID(), suffix = randomUUID().slice(0, 8), baseline = "baseline canonical\n"} = {}) {
  const root = await mkdtemp(path.join(TRUSTED_OS_TEMP_ROOT, "helpmath-promotion-transaction-v2-"));
  await chmod(root, 0o700);
  const capability = randomUUID();
  const marker = path.join(root, TEST_MARKER);
  await writeFile(marker, `${JSON.stringify({schemaVersion: 1, capability}, null, 2)}\n`);
  await chmod(marker, 0o400);
  const migrationId = `course-fixture-${suffix}`;
  const requirementId = "req:root:default:en";
  const safeId = safeRequirementId(requirementId);
  const workspace = path.join(root, "migrations", migrationId);
  const coverage = path.join(workspace, "evidence", "full-frame-coverage.json");
  const originalCoverage = Buffer.from('{"status":"blocked","baselineAuthority":"unresolved"}\n');
  const replacementCoverage = Buffer.from('{"status":"blocked","baselineAuthority":"original-runtime"}\n');
  await mkdir(path.dirname(coverage), {recursive: true});
  await writeFile(coverage, originalCoverage);
  await chmod(coverage, 0o644);
  await mkdir(path.join(workspace, "baseline", "original-runtime"), {recursive: true});
  await mkdir(path.join(workspace, "baseline", "trace-executions"), {recursive: true});
  await mkdir(path.join(workspace, "evidence", "original-runtime-promotions"), {recursive: true});
  await mkdir(path.join(root, "artifacts", "full-frame", "pilot-baselines", migrationId, safeId), {recursive: true});
  const input = {
    projectRoot: root,
    migrationId,
    requirementId,
    expectedCoverageSha256: sha256(originalCoverage),
    expectedCoverageMode: 0o644,
    replacementCoverageBase64: b64(replacementCoverage),
    baselineBase64: b64(baseline),
    executionReportBase64: b64("execution canonical\n"),
    promotionReceiptBase64: b64("promotion canonical\n"),
    archiveEntries: [
      {relativePath: "capture-manifest.json", mode: 0o444, bytesBase64: b64('{"complete":true}\n')},
      {relativePath: "frames/frame-001.png", mode: 0o444, bytesBase64: b64("fixture png\n")},
    ],
    transactionNonce: nonce,
  };
  const inputPath = path.join(root, "transaction-input.json");
  await writeFile(inputPath, `${JSON.stringify(input, null, 2)}\n`);
  const publicPlan = await transactionModule.createOriginalRuntimePromotionTransaction({
    projectRoot: root,
    migrationId,
    requirementId,
    expectedCoverageSha256: input.expectedCoverageSha256,
    expectedCoverageMode: input.expectedCoverageMode,
    replacementCoverage,
    baseline,
    executionReport: "execution canonical\n",
    promotionReceipt: "promotion canonical\n",
    archiveEntries: input.archiveEntries.map((entry) => ({relativePath: entry.relativePath, mode: entry.mode, bytes: Buffer.from(entry.bytesBase64, "base64")})),
    transactionNonce: nonce,
  });
  const planSha256 = publicPlan.planSha256;
  const paths = {
    coverage,
    baseline: path.join(workspace, "baseline", "original-runtime", `${safeId}.json`),
    executionReport: path.join(workspace, "baseline", "trace-executions", `${safeId}.json`),
    promotionReceipt: path.join(workspace, "evidence", "original-runtime-promotions", `${safeId}.json`),
    archive: path.join(root, "artifacts", "full-frame", "pilot-baselines", migrationId, safeId, "accepted-original-runtime"),
    lock: path.join(workspace, ".original-runtime-promotion.lock"),
    transactionRoot: path.join(workspace, "evidence", "original-runtime-promotion-transactions", planSha256),
    records: path.join(workspace, "evidence", "original-runtime-promotion-transactions", planSha256, "journal-records"),
    nonceReservation: path.join(root, ".original-runtime-promotion-nonce-reservations", `${sha256(Buffer.from(nonce))}.json`),
  };
  return {root, capability, marker, migrationId, requirementId, input, inputPath, publicPlan, planSha256, paths, originalCoverage, replacementCoverage};
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
      try { json = JSON.parse(lines.at(-1)); } catch {}
    }
    resolve({code, signal, stdout, stderr, json});
  }));
  return {child, done};
}

async function run(fixture, command, options) {
  return launch(fixture, command, options).done;
}

async function waitFor(candidate, timeoutMs = 4_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await exists(candidate)) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${candidate}`);
}

async function listTemporaryFiles(root) {
  const result = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(candidate);
      else if (entry.name.endsWith(".tmp")) result.push(path.relative(root, candidate));
    }
  }
  await walk(root);
  return result.sort();
}

async function committedFixture(t) {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await run(fixture, "__test-execute");
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.json?.result?.status, "committed");
  return fixture;
}

function registerTests() {

test("production module physically excludes CLI, environment, marker, and fault harnesses", async () => {
  const source = await readFile(PRODUCTION_MODULE_PATH, "utf8");
  assert.doesNotMatch(source, /__test-|process\.env|process\.argv|TEST_(?:MARKER|CAPABILITY|FAULT)|harnessController|loadHarnessInput|assertIsolatedHarnessRoot|serializeError|runHarness|\bos\.tmpdir\(/);
});

test("public module has no callable write, lock, release, hook, or testing bypass", async () => {
  assert.deepEqual(Object.keys(transactionModule).sort(), [
    "ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE",
    "ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE",
    "ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED",
    "createOriginalRuntimePromotionTransaction",
    "executeOriginalRuntimePromotionTransaction",
    "inspectOriginalRuntimePromotionTransaction",
    "recoverOriginalRuntimePromotionTransaction",
  ]);
  assert.equal(transactionModule.ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED, false);
  await assert.rejects(transactionModule.executeOriginalRuntimePromotionTransaction(), {code: transactionModule.ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE});
  await assert.rejects(transactionModule.recoverOriginalRuntimePromotionTransaction(), {code: transactionModule.ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE});
});

test("test-only harness refuses the real workspace ancestry and an invalid capability marker", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  for (const candidate of [PROJECT_ROOT, path.dirname(PROJECT_ROOT), path.join(PROJECT_ROOT, "scripts")]) {
    await writeFile(
      fixture.inputPath,
      `${JSON.stringify({...fixture.input, projectRoot: candidate}, null, 2)}\n`,
    );
    const result = await run(fixture, "__test-execute");
    assert.equal(result.code, 1);
    assert.match(
      result.json.error.message,
      /trusted OS temporary root|refuses the HELP Math workspace/,
    );
  }
  await writeFile(fixture.inputPath, `${JSON.stringify(fixture.input, null, 2)}\n`);
  await chmod(fixture.marker, 0o600);
  const invalidMarker = await run(fixture, "__test-execute");
  assert.equal(invalidMarker.code, 1);
  assert.match(invalidMarker.json.error.message, /marker is invalid/);
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
  assert.match(
    result.json.error.message,
    /trusted OS temporary root|refuses the HELP Math workspace/,
  );
  assert.equal(await exists(fixture.paths.nonceReservation), false);
});

test("plan handle is deeply immutable, payload-private, branded, and rejects a clone", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  assert.equal(Object.isFrozen(fixture.publicPlan), true);
  assert.equal(Object.isFrozen(fixture.publicPlan.descriptor), true);
  assert.equal(fixture.publicPlan.descriptor.coverage.expectedOriginalMode, 0o644);
  assert.equal("paths" in fixture.publicPlan, false);
  assert.equal("payloads" in fixture.publicPlan, false);
  await assert.rejects(
    transactionModule.inspectOriginalRuntimePromotionTransaction(structuredClone(fixture.publicPlan)),
    /process-private branded handle/,
  );
});

test("atomic lock excludes a concurrent process", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const first = launch(fixture, "__test-execute", {fault: "hold-after-lock"});
  await waitFor(fixture.paths.lock);
  const second = await run(fixture, "__test-execute");
  assert.equal(second.code, 1);
  assert.equal(second.json?.error?.code, "ORIGINAL_RUNTIME_PROMOTION_LOCKED");
  const firstResult = await first.done;
  assert.equal(firstResult.code, 0, firstResult.stderr || firstResult.stdout);
  assert.equal(firstResult.json?.result?.status, "committed");
});

test("committed repeat is idempotent and never enters rollback", async (t) => {
  const fixture = await committedFixture(t);
  const baselineBefore = await readFile(fixture.paths.baseline);
  const second = await run(fixture, "__test-execute");
  assert.equal(second.code, 0, second.stderr || second.stdout);
  assert.equal(second.json.result.status, "already-committed");
  assert.deepEqual(await readFile(fixture.paths.baseline), baselineBefore);
  const inspected = await run(fixture, "__test-inspect");
  assert.equal(inspected.json.result.status, "committed");
  assert.equal(inspected.json.result.records.filter(({event}) => event === "transaction-committed").length, 1);
  assert.equal(inspected.json.result.records.some(({event}) => event === "rollback-started"), false);
});

test("commit, inspect, and recover revalidate coverage, archive, and all canonical outputs", async (t) => {
  const mutations = [
    ["coverage", async (fixture) => writeFile(fixture.paths.coverage, "coverage drift\n")],
    ["archive", async (fixture) => writeFile(path.join(fixture.paths.archive, "capture-manifest.json"), "archive drift\n")],
    ["baseline", async (fixture) => writeFile(fixture.paths.baseline, "baseline drift\n")],
    ["executionReport", async (fixture) => writeFile(fixture.paths.executionReport, "execution drift\n")],
    ["promotionReceipt", async (fixture) => writeFile(fixture.paths.promotionReceipt, "promotion drift\n")],
  ];
  for (const [label, mutate] of mutations) {
    await t.test(label, async (child) => {
      const fixture = await committedFixture(child);
      const target = label === "archive" ? path.join(fixture.paths.archive, "capture-manifest.json") : fixture.paths[label];
      await chmod(target, 0o600);
      await mutate(fixture);
      const inspection = await run(fixture, "__test-inspect");
      assert.equal(inspection.json.result.status, "manual-intervention-required");
      assert.match(inspection.json.result.issues.join("; "), new RegExp(label === "archive" ? "archive" : label));
      const recovery = await run(fixture, "__test-recover");
      assert.equal(recovery.code, 1);
      assert.equal(recovery.json.error.code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
      assert.equal(await exists(fixture.paths.baseline), true, "committed evidence must never be rolled back on drift");
    });
  }
});

test("committed coverage mode is part of commit, inspect, and recover validation", async (t) => {
  const fixture = await committedFixture(t);
  await chmod(fixture.paths.coverage, 0o600);
  const inspection = await run(fixture, "__test-inspect");
  assert.equal(inspection.code, 0);
  assert.equal(inspection.json.result.status, "manual-intervention-required");
  assert.match(inspection.json.result.issues.join("; "), /coverage differs from committed replacement/);
  const recovery = await run(fixture, "__test-recover");
  assert.equal(recovery.code, 1);
  assert.equal(recovery.json.error.code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
});

test("preexisting file and archive targets are no-replace", async (t) => {
  for (const targetKind of ["baseline", "archive"]) {
    await t.test(targetKind, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      if (targetKind === "baseline") await writeFile(fixture.paths.baseline, "foreign sentinel\n");
      else {
        await mkdir(fixture.paths.archive);
        await writeFile(path.join(fixture.paths.archive, "foreign.txt"), "foreign archive\n");
      }
      const result = await run(fixture, "__test-execute");
      assert.equal(result.code, 1);
      assert.equal(result.json.error.code, "ORIGINAL_RUNTIME_PROMOTION_TARGET_EXISTS");
      const sentinel = targetKind === "baseline" ? fixture.paths.baseline : path.join(fixture.paths.archive, "foreign.txt");
      assert.match(await readFile(sentinel, "utf8"), /foreign/);
      assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
    });
  }
});

test("mid-transaction failure performs hash-owned rollback", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await run(fixture, "__test-execute", {fault: "throw-after-baseline"});
  assert.equal(result.code, 1);
  assert.match(result.json.error.message, /injected failure after baseline/);
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
  assert.equal(await exists(fixture.paths.baseline), false);
  assert.equal(await exists(fixture.paths.archive), false);
  const inspection = await run(fixture, "__test-inspect");
  assert.equal(inspection.json.result.status, "rolled-back");
});

test("foreign drift is preserved and records manual intervention", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await run(fixture, "__test-execute", {fault: "drift-baseline-then-throw"});
  assert.equal(result.code, 1);
  assert.equal(result.json.error.code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  assert.equal(await readFile(fixture.paths.baseline, "utf8"), "foreign drift\n");
  const inspection = await run(fixture, "__test-inspect");
  assert.equal(inspection.json.result.status, "manual-intervention-required");
});

test("journal consists only of atomic complete one-line hash-addressed segments", async (t) => {
  const fixture = await committedFixture(t);
  const names = (await readdir(fixture.paths.records)).sort();
  assert.ok(names.length > 10);
  for (const name of names) {
    assert.match(name, /^\d{8}-[a-f0-9]{64}\.jsonl$/);
    const content = await readFile(path.join(fixture.paths.records, name));
    assert.equal(content.at(-1), 0x0a);
    assert.equal(content.subarray(0, -1).includes(0x0a), false);
  }
  await writeFile(path.join(fixture.paths.records, `.record-${String(names.length + 1).padStart(8, "0")}-${"a".repeat(64)}.tmp`), '{"partial":');
  const inspection = await run(fixture, "__test-inspect");
  assert.equal(inspection.code, 0);
  assert.equal(inspection.json.result.status, "manual-intervention-required");
  const recovery = await run(fixture, "__test-recover");
  assert.equal(recovery.code, 1);
  assert.match(recovery.json.error.message, /staging record is partial|cannot extend/);
});

test("real exit after journal hard-link publication recovers the linked staging twin", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-journal-record-link"});
  assert.equal(crashed.code, 89);
  assert.ok((await readdir(fixture.paths.records)).some((name) => name.endsWith(".tmp")));
  const recovered = await run(fixture, "__test-recover");
  assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
  assert.equal(recovered.json.result.status, "rolled-back");
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
  assert.deepEqual(await listTemporaryFiles(fixture.root), []);
});

test("coverage remains atomically visible across exits before and after replacement rename", async (t) => {
  for (const [fault, exitCode, expected] of [
    ["exit-before-coverage-atomic-rename", 90, "original"],
    ["exit-after-coverage-atomic-rename", 91, "replacement"],
  ]) {
    await t.test(fault, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const crashed = await run(fixture, "__test-execute", {fault});
      assert.equal(crashed.code, exitCode);
      assert.equal(await exists(fixture.paths.coverage), true, "atomic rename must never expose ENOENT");
      assert.deepEqual(await readFile(fixture.paths.coverage), expected === "original" ? fixture.originalCoverage : fixture.replacementCoverage);
      assert.equal(await exists(fixture.paths.lock), true);
      const recovered = await run(fixture, "__test-recover");
      assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
      assert.equal(recovered.json.result.status, "rolled-back");
      assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
      assert.equal(await exists(fixture.paths.lock), false);
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("coverage crash recovery restores the original bytes and permission mode", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  assert.equal((await lstat(fixture.paths.coverage)).mode & 0o777, 0o644);
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-coverage-atomic-rename"});
  assert.equal(crashed.code, 91);
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.replacementCoverage);
  assert.equal((await lstat(fixture.paths.coverage)).mode & 0o777, 0o444);
  const recovered = await run(fixture, "__test-recover");
  assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
  assert.equal(recovered.json.result.status, "rolled-back");
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
  assert.equal((await lstat(fixture.paths.coverage)).mode & 0o777, 0o644);
});

test("rollback can be interrupted by real process exit and recovered repeatedly", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-during-rollback"});
  assert.equal(crashed.code, 88);
  assert.equal(await exists(fixture.paths.lock), true);
  const firstRecovery = await run(fixture, "__test-recover");
  assert.equal(firstRecovery.code, 0, firstRecovery.stderr || firstRecovery.stdout);
  assert.equal(firstRecovery.json.result.status, "rolled-back");
  const secondRecovery = await run(fixture, "__test-recover");
  assert.equal(secondRecovery.code, 0);
  assert.equal(secondRecovery.json.result.status, "rolled-back");
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
  assert.deepEqual(await listTemporaryFiles(fixture.root), []);
});

test("coverage rollback atomic rename survives exits before and after its durable record", async (t) => {
  for (const [fault, exitCode] of [
    ["exit-after-coverage-rollback-rename", 92],
    ["exit-after-coverage-restored-record", 93],
  ]) {
    await t.test(fault, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const crashed = await run(fixture, "__test-execute", {fault});
      assert.equal(crashed.code, exitCode);
      assert.equal(await exists(fixture.paths.coverage), true);
      assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
      const first = await run(fixture, "__test-recover");
      assert.equal(first.code, 0, first.stderr || first.stdout);
      assert.equal(first.json.result.status, "rolled-back");
      const second = await run(fixture, "__test-recover");
      assert.equal(second.code, 0);
      assert.equal(second.json.result.status, "rolled-back");
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("archive directory created before its claim record is recovered after a real exit", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-archive-directory-create"});
  assert.equal(crashed.code, 97);
  assert.equal(await exists(fixture.paths.archive), true);
  assert.deepEqual(await readdir(fixture.paths.archive), []);
  const recovered = await run(fixture, "__test-recover");
  assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
  assert.equal(recovered.json.result.status, "rolled-back");
  assert.equal(await exists(fixture.paths.archive), false);
  assert.deepEqual(await listTemporaryFiles(fixture.root), []);
});

test("temp creation intent survives a real exit before the created record", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-temp-create-before-record"});
  assert.equal(crashed.code, 87);
  const recovered = await run(fixture, "__test-recover");
  assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
  assert.equal(recovered.json.result.status, "rolled-back");
  assert.equal(await exists(fixture.paths.baseline), false);
  assert.equal(await exists(fixture.paths.archive), false);
  assert.deepEqual(await listTemporaryFiles(fixture.root), []);
});

test("canonical hard-link publication exits recover before record and before temp unlink", async (t) => {
  for (const [fault, exitCode] of [
    ["exit-after-output-hardlink-before-record", 98],
    ["exit-after-output-published-before-temp-unlink", 99],
  ]) {
    await t.test(fault, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const crashed = await run(fixture, "__test-execute", {fault});
      assert.equal(crashed.code, exitCode);
      assert.equal(await exists(fixture.paths.baseline), true);
      const recovered = await run(fixture, "__test-recover");
      assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
      assert.equal(recovered.json.result.status, "rolled-back");
      assert.equal(await exists(fixture.paths.baseline), false);
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("nonce reservation survives rollback and crash and rejects reuse by a different plan", async (t) => {
  for (const mode of ["rollback", "crash"]) {
    await t.test(mode, async (child) => {
      const nonce = randomUUID();
      const fixture = await createFixture({nonce});
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const result = await run(fixture, "__test-execute", {fault: mode === "rollback" ? "throw-after-baseline" : "exit-after-coverage-unlink"});
      assert.ok(result.code !== 0);
      assert.equal(await exists(fixture.paths.nonceReservation), true);
      const changed = {...fixture.input, baselineBase64: b64("different baseline under reused nonce\n")};
      await writeFile(fixture.inputPath, `${JSON.stringify(changed, null, 2)}\n`);
      const reused = await run(fixture, "__test-execute");
      assert.equal(reused.code, 1);
      assert.equal(reused.json.error.code, "ORIGINAL_RUNTIME_PROMOTION_NONCE_REUSED");
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("nonce reservation hard-link window recovers on the next real execution", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-nonce-link"});
  assert.equal(crashed.code, 100);
  assert.equal(await exists(fixture.paths.nonceReservation), true);
  assert.ok((await listTemporaryFiles(fixture.root)).some((candidate) => candidate.includes("nonce-reservations")));
  const retry = await run(fixture, "__test-execute");
  assert.equal(retry.code, 0, retry.stderr || retry.stdout);
  assert.equal(retry.json.result.status, "committed");
  assert.deepEqual(await listTemporaryFiles(fixture.root), []);
});

test("pre-journal lock publication exits are authenticated and reclaimed", async (t) => {
  for (const [fault, exitCode] of [
    ["exit-after-lock-link", 94],
    ["exit-after-lock-published-before-journal", 95],
  ]) {
    await t.test(fault, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const crashed = await run(fixture, "__test-execute", {fault});
      assert.equal(crashed.code, exitCode);
      assert.equal(await exists(fixture.paths.lock), true);
      const recovered = await run(fixture, "__test-recover");
      assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
      assert.equal(recovered.json.result.status, "not-started");
      assert.equal(recovered.json.result.staleLockReclaimed, true);
      assert.equal(await exists(fixture.paths.lock), false);
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("pre-binding journal setup exits reclaim the stale lock and converge", async (t) => {
  for (const [fault, exitCode] of [
    ["exit-after-plan-published-before-records", 101],
    ["exit-after-record-directory-before-begin", 102],
  ]) {
    await t.test(fault, async (child) => {
      const fixture = await createFixture();
      child.after(() => rm(fixture.root, {recursive: true, force: true}));
      const crashed = await run(fixture, "__test-execute", {fault});
      assert.equal(crashed.code, exitCode);
      assert.equal(await exists(fixture.paths.lock), true);
      const recovered = await run(fixture, "__test-recover");
      assert.equal(recovered.code, 0, recovered.stderr || recovered.stdout);
      assert.equal(recovered.json.result.status, "rolled-back");
      assert.equal(await exists(fixture.paths.lock), false);
      assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
      assert.deepEqual(await listTemporaryFiles(fixture.root), []);
    });
  }
});

test("stale recovery never removes a foreign pre-journal lock", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-lock-published-before-journal"});
  assert.equal(crashed.code, 95);
  await unlink(fixture.paths.lock);
  await writeFile(fixture.paths.lock, "foreign lock sentinel\n");
  const recovered = await run(fixture, "__test-recover");
  assert.equal(recovered.code, 1);
  assert.equal(recovered.json.error.code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  assert.equal(await readFile(fixture.paths.lock, "utf8"), "foreign lock sentinel\n");
});

test("real exit after atomic lock unlink leaves committed result unambiguous", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const crashed = await run(fixture, "__test-execute", {fault: "exit-after-lock-unlink"});
  assert.equal(crashed.code, 96);
  assert.equal(await exists(fixture.paths.lock), false);
  const retry = await run(fixture, "__test-execute");
  assert.equal(retry.code, 0, retry.stderr || retry.stdout);
  assert.equal(retry.json.result.status, "already-committed");
});

test("lock release failure is aggregated and never hidden by the primary error", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await run(fixture, "__test-execute", {fault: "drift-lock-and-throw"});
  assert.equal(result.code, 1);
  assert.equal(result.json.error.name, "AggregateError");
  assert.match(result.json.error.message, /injected primary error.*lock release also failed/s);
  assert.equal(result.json.error.errors.length, 2);
  assert.equal(result.json.error.errors[1].code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
});

test("committed transaction returns an auditable cleanup warning when lock release fails", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await run(fixture, "__test-execute", {fault: "drift-lock-after-commit"});
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.json.result.status, "committed");
  assert.equal(result.json.result.cleanupWarning.code, transactionModule.ORIGINAL_RUNTIME_PROMOTION_MANUAL_INTERVENTION_CODE);
  assert.match(result.json.result.cleanupWarning.message, /durable committed state.*lock cleanup failed/);
  const inspection = await run(fixture, "__test-inspect");
  assert.equal(inspection.code, 0);
  assert.equal(inspection.json.result.status, "committed");
});

test("symlink components are rejected before canonical writes", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const real = path.join(fixture.root, "foreign-output");
  await mkdir(real);
  const parent = path.dirname(fixture.paths.baseline);
  await rm(parent, {recursive: true});
  await symlink(real, parent);
  const result = await run(fixture, "__test-execute");
  assert.equal(result.code, 1);
  assert.match(result.json.error.message, /symbolic-link component/);
  assert.deepEqual(await readFile(fixture.paths.coverage), fixture.originalCoverage);
});

}

const [command, inputFlag, inputPath] = process.argv.slice(2);
if (command?.startsWith("__test-")) {
  if (inputFlag !== "--input" || !inputPath) {
    throw new Error("invalid transaction harness command");
  }
  runHarness(command, inputPath)
    .then((result) => {
      process.stdout.write(`${JSON.stringify({ok: true, result})}\n`);
    })
    .catch((error) => {
      process.stdout.write(`${JSON.stringify({ok: false, error: serializeError(error)})}\n`);
      process.exitCode = 1;
    });
} else {
  registerTests();
}
