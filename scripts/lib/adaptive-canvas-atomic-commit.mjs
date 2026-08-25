import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdtemp,
  open,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const ADAPTIVE_ATOMIC_COMMIT_PROTOCOL =
  "darwin-dirfd-renameatx-nofollow-atomic-batch-v2";
export const ADAPTIVE_ATOMIC_STATIC_CONTRACT_SCHEMA =
  "help-math-adaptive-canvas-atomic-static-contract/v1";
export const ADAPTIVE_ATOMIC_PRECONDITION_SCHEMA =
  "help-math-adaptive-canvas-atomic-precondition/v1";
export const ADAPTIVE_ATOMIC_TRANSACTION_SCHEMA =
  "help-math-adaptive-canvas-atomic-transaction/v2";
export const ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT = 286;

const SHA256 = /^[a-f0-9]{64}$/u;
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9._-]+$/u;
const ZERO_SHA256 = "0".repeat(64);
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;
const CLEAN_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin",
});

export class AdaptiveAtomicCommitError extends Error {
  constructor(message, code, details = undefined) {
    super(message);
    this.name = "AdaptiveAtomicCommitError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function fail(condition, message, code = "INVALID_ATOMIC_COMMIT_CONTRACT") {
  if (!condition) throw new AdaptiveAtomicCommitError(message, code);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeRelativePath(value) {
  return typeof value === "string" && value.length > 0 &&
    !value.includes("\\") && !value.includes("\0") &&
    value.split("/").every((segment) =>
      segment.length > 0 && segment !== "." && segment !== ".." &&
      SAFE_PATH_SEGMENT.test(segment)
    );
}

function decimal(value, label) {
  const text = String(value);
  fail(/^(?:0|[1-9][0-9]*)$/u.test(text), `${label} is not canonical decimal`);
  return text;
}

function octalMode(value, label) {
  fail(Number.isInteger(value) && value >= 0 && value <= 0o777,
    `${label} is not a safe permission mode`);
  return value.toString(8).padStart(4, "0");
}

function exactOutputBytes(plan, targetPath) {
  if (targetPath === "apps/web/config/current-js-production-assets.v2.json") {
    return plan.v2ProfileBytes;
  }
  if (targetPath ===
      "packages/demos/src/adaptive-canvas-production-bindings.generated.ts") {
    return plan.bindingsBytes;
  }
  const prefix = "apps/web/public/flash-assets/";
  fail(targetPath.startsWith(prefix), `unexpected adaptive target ${targetPath}`);
  const assetPath = targetPath.slice(prefix.length);
  return plan.outputBytesByAssetPath.get(assetPath);
}

function targetPathsInCommitOrder(plan) {
  fail(Array.isArray(plan?.runtimeRecords) && plan.runtimeRecords.length === 284,
    "adaptive atomic commit requires exactly 284 runtime records");
  return [
    ...plan.runtimeRecords.map((record) =>
      `apps/web/public/flash-assets/courses/${record.relativePath}`
    ),
    "apps/web/config/current-js-production-assets.v2.json",
    "packages/demos/src/adaptive-canvas-production-bindings.generated.ts",
  ];
}

function outputOnlyEntriesFromPlan(plan) {
  return targetPathsInCommitOrder(plan).map((targetPath, index) => {
    const outputBytes = exactOutputBytes(plan, targetPath);
    fail(Buffer.isBuffer(outputBytes) && outputBytes.length > 0,
      `planned output bytes are absent for ${targetPath}`);
    return Object.freeze({
      ordinal: index + 1,
      targetPath,
      outputBytes,
      output: {bytes: outputBytes.length, sha256: sha256(outputBytes)},
    });
  });
}

function preconditionByPath(precondition, projectRoot) {
  fail(precondition?.schemaVersion === 1 &&
      Array.isArray(precondition.present) && Array.isArray(precondition.absent),
    "physical precondition is not a stable closure");
  const result = new Map();
  for (const item of precondition.present) {
    const relative = path.relative(projectRoot, item.absolutePath)
      .split(path.sep).join("/");
    fail(safeRelativePath(relative) && !result.has(relative),
      `invalid or duplicate present precondition ${relative}`);
    fail(item.identity && SHA256.test(item.sha256) &&
        item.identity.sha256 === item.sha256 &&
        Number.isSafeInteger(item.bytes) && item.bytes >= 0,
      `invalid present identity ${relative}`);
    result.set(relative, {state: "present", ...item});
  }
  for (const item of precondition.absent) {
    const relative = path.relative(projectRoot, item.absolutePath)
      .split(path.sep).join("/");
    fail(safeRelativePath(relative) && !result.has(relative),
      `invalid or duplicate absent precondition ${relative}`);
    result.set(relative, {state: "absent", ...item});
  }
  return result;
}

/**
 * Build the exact 286-target contract. The order is security-significant:
 * 284 runtimes, the v2 profile, then the active binding last.
 */
export function buildAdaptiveAtomicCommitEntries({
  plan,
  precondition,
  projectRoot,
}) {
  fail(path.isAbsolute(projectRoot), "projectRoot must be absolute");
  const physical = preconditionByPath(precondition, projectRoot);
  const targetPaths = targetPathsInCommitOrder(plan);
  fail(physical.size === ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT,
    "physical precondition must contain exactly 286 targets");
  const entries = targetPaths.map((targetPath, index) => {
    const current = physical.get(targetPath);
    fail(current, `physical precondition omits ${targetPath}`);
    const outputBytes = exactOutputBytes(plan, targetPath);
    fail(Buffer.isBuffer(outputBytes) && outputBytes.length > 0,
      `planned output bytes are absent for ${targetPath}`);
    const outputSha256 = sha256(outputBytes);
    const mode = current.state === "present"
      ? Number(current.identity.mode) & 0o777
      : 0o644;
    const entry = {
      ordinal: index + 1,
      targetPath,
      prestate: current.state,
      outputMode: mode,
      input: current.state === "present"
        ? {bytes: current.bytes, sha256: current.sha256}
        : {bytes: 0, sha256: ZERO_SHA256},
      output: {bytes: outputBytes.length, sha256: outputSha256},
      dynamicIdentity: current.state === "present"
        ? {
            dev: decimal(current.identity.dev, `${targetPath}.dev`),
            ino: decimal(current.identity.ino, `${targetPath}.ino`),
            mode: decimal(current.identity.mode, `${targetPath}.mode`),
            uid: decimal(current.identity.uid, `${targetPath}.uid`),
            gid: decimal(current.identity.gid, `${targetPath}.gid`),
            nlink: decimal(current.identity.nlink, `${targetPath}.nlink`),
            mtimeNs: decimal(current.identity.mtimeNs, `${targetPath}.mtimeNs`),
            ctimeNs: decimal(current.identity.ctimeNs, `${targetPath}.ctimeNs`),
          }
        : null,
      outputBytes,
    };
    fail(SHA256.test(entry.input.sha256) && SHA256.test(entry.output.sha256),
      `invalid content identity for ${targetPath}`);
    return Object.freeze(entry);
  });
  fail(entries.length === ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT &&
      entries.at(-2).targetPath ===
        "apps/web/config/current-js-production-assets.v2.json" &&
      entries.at(-1).targetPath ===
        "packages/demos/src/adaptive-canvas-production-bindings.generated.ts",
    "adaptive activation order is not profile-then-binding-last");
  return Object.freeze(entries);
}

export function adaptiveAtomicStaticContractBytes(entries) {
  fail(Array.isArray(entries) && entries.length > 0 && entries.length <= 286,
    "atomic static contract entry count is invalid");
  const lines = [
    ADAPTIVE_ATOMIC_STATIC_CONTRACT_SCHEMA,
    `entry-count\t${entries.length}`,
  ];
  for (const [index, entry] of entries.entries()) {
    fail(entry.ordinal === index + 1 && safeRelativePath(entry.targetPath) &&
        ["present", "absent"].includes(entry.prestate) &&
        SHA256.test(entry.input.sha256) && SHA256.test(entry.output.sha256),
      `invalid static contract entry ${index + 1}`);
    lines.push([
      String(entry.ordinal).padStart(6, "0"),
      entry.prestate,
      octalMode(entry.outputMode, `${entry.targetPath}.outputMode`),
      decimal(entry.input.bytes, `${entry.targetPath}.input.bytes`),
      entry.input.sha256,
      decimal(entry.output.bytes, `${entry.targetPath}.output.bytes`),
      entry.output.sha256,
      entry.targetPath,
    ].join("\t"));
  }
  return Buffer.from(`${lines.join("\n")}\n`);
}

export function adaptiveAtomicStaticContractSha256(entries) {
  return sha256(adaptiveAtomicStaticContractBytes(entries));
}

export function adaptiveAtomicPreconditionBytes(entries) {
  fail(Array.isArray(entries) && entries.length > 0 && entries.length <= 286,
    "atomic precondition entry count is invalid");
  const lines = [
    ADAPTIVE_ATOMIC_PRECONDITION_SCHEMA,
    `entry-count\t${entries.length}`,
  ];
  for (const [index, entry] of entries.entries()) {
    fail(entry.ordinal === index + 1 && safeRelativePath(entry.targetPath),
      `invalid precondition entry ${index + 1}`);
    const identity = entry.dynamicIdentity ?? {
      dev: "0", ino: "0", mode: "0", uid: "0", gid: "0", nlink: "0",
      mtimeNs: "0", ctimeNs: "0",
    };
    lines.push([
      String(entry.ordinal).padStart(6, "0"),
      entry.prestate,
      decimal(identity.dev, `${entry.targetPath}.dev`),
      decimal(identity.ino, `${entry.targetPath}.ino`),
      decimal(identity.mode, `${entry.targetPath}.mode`),
      decimal(identity.uid, `${entry.targetPath}.uid`),
      decimal(identity.gid, `${entry.targetPath}.gid`),
      decimal(identity.nlink, `${entry.targetPath}.nlink`),
      decimal(identity.mtimeNs, `${entry.targetPath}.mtimeNs`),
      decimal(identity.ctimeNs, `${entry.targetPath}.ctimeNs`),
      entry.targetPath,
    ].join("\t"));
  }
  return Buffer.from(`${lines.join("\n")}\n`);
}

export function adaptiveAtomicPreconditionSha256(entries) {
  return sha256(adaptiveAtomicPreconditionBytes(entries));
}

function transactionId({
  staticContractSha256,
  preconditionSha256,
  rootIdentity,
  bundle,
  evidence,
}) {
  const bytes = Buffer.from([
    ADAPTIVE_ATOMIC_TRANSACTION_SCHEMA,
    staticContractSha256,
    preconditionSha256,
    decimal(rootIdentity.dev, "root.dev"),
    decimal(rootIdentity.ino, "root.ino"),
    decimal(bundle.bytes, "bundle.bytes"),
    bundle.sha256,
    evidence.planReceiptSha256,
    evidence.provenanceReceiptSha256,
    evidence.proofReceiptSha256,
    "",
  ].join("\n"));
  return sha256(bytes);
}

export function adaptiveAtomicManifestBytes({
  entries,
  rootIdentity,
  bundle,
  evidence,
}) {
  const staticContractSha256 = adaptiveAtomicStaticContractSha256(entries);
  const preconditionSha256 = adaptiveAtomicPreconditionSha256(entries);
  for (const value of [
    staticContractSha256,
    preconditionSha256,
    bundle.sha256,
    evidence.planReceiptSha256,
    evidence.provenanceReceiptSha256,
    evidence.proofReceiptSha256,
  ]) fail(SHA256.test(value), "manifest contains an invalid SHA-256");
  const id = transactionId({
    staticContractSha256,
    preconditionSha256,
    rootIdentity,
    bundle,
    evidence,
  });
  const lines = [
    "HMACA1",
    `transaction\t${id}`,
    `static-contract-sha256\t${staticContractSha256}`,
    `root-dev\t${decimal(rootIdentity.dev, "root.dev")}`,
    `root-ino\t${decimal(rootIdentity.ino, "root.ino")}`,
    `bundle-bytes\t${decimal(bundle.bytes, "bundle.bytes")}`,
    `bundle-sha256\t${bundle.sha256}`,
    `plan-receipt-sha256\t${evidence.planReceiptSha256}`,
    `provenance-receipt-sha256\t${evidence.provenanceReceiptSha256}`,
    `proof-receipt-sha256\t${evidence.proofReceiptSha256}`,
    `entry-count\t${entries.length}`,
    "--",
  ];
  let offset = 0;
  for (const entry of entries) {
    const identity = entry.dynamicIdentity ?? {
      dev: "0", ino: "0", mode: "0", uid: "0", gid: "0", nlink: "0",
      mtimeNs: "0", ctimeNs: "0",
    };
    lines.push([
      String(entry.ordinal).padStart(6, "0"),
      entry.prestate,
      octalMode(entry.outputMode, `${entry.targetPath}.outputMode`),
      decimal(entry.input.bytes, `${entry.targetPath}.input.bytes`),
      entry.input.sha256,
      decimal(entry.output.bytes, `${entry.targetPath}.output.bytes`),
      entry.output.sha256,
      decimal(offset, `${entry.targetPath}.bundleOffset`),
      identity.dev,
      identity.ino,
      identity.mode,
      identity.uid,
      identity.gid,
      identity.nlink,
      identity.mtimeNs,
      identity.ctimeNs,
      entry.targetPath,
    ].join("\t"));
    offset += entry.output.bytes;
  }
  fail(offset === bundle.bytes, "manifest bundle ranges are not contiguous");
  return Object.freeze({
    transactionId: id,
    staticContractSha256,
    bytes: Buffer.from(`${lines.join("\n")}\n`),
  });
}

export function adaptiveAtomicManifestHeader(manifestBytes) {
  fail(Buffer.isBuffer(manifestBytes) && manifestBytes.length > 0 &&
      manifestBytes.length <= 1024 * 1024 && manifestBytes.at(-1) === 0x0a,
    "stored atomic manifest bytes are invalid", "STORED_MANIFEST_INVALID");
  const lines = manifestBytes.toString("utf8").split("\n");
  fail(lines.at(-1) === "" && lines[0] === "HMACA1" && lines[11] === "--",
    "stored atomic manifest header is noncanonical", "STORED_MANIFEST_INVALID");
  const exact = (index, name, pattern) => {
    const prefix = `${name}\t`;
    fail(lines[index]?.startsWith(prefix),
      `stored manifest omits ${name}`, "STORED_MANIFEST_INVALID");
    const value = lines[index].slice(prefix.length);
    fail(pattern.test(value), `stored manifest has invalid ${name}`,
      "STORED_MANIFEST_INVALID");
    return value;
  };
  const header = {
    transactionId: exact(1, "transaction", SHA256),
    staticContractSha256: exact(2, "static-contract-sha256", SHA256),
    rootDev: exact(3, "root-dev", /^(?:0|[1-9][0-9]*)$/u),
    rootIno: exact(4, "root-ino", /^(?:0|[1-9][0-9]*)$/u),
    bundleBytes: Number(exact(5, "bundle-bytes", /^(?:0|[1-9][0-9]*)$/u)),
    bundleSha256: exact(6, "bundle-sha256", SHA256),
    planReceiptSha256: exact(7, "plan-receipt-sha256", SHA256),
    provenanceReceiptSha256: exact(8, "provenance-receipt-sha256", SHA256),
    proofReceiptSha256: exact(9, "proof-receipt-sha256", SHA256),
    entryCount: Number(exact(10, "entry-count", /^(?:0|[1-9][0-9]*)$/u)),
  };
  fail(Number.isSafeInteger(header.bundleBytes) && header.bundleBytes > 0 &&
      header.entryCount === ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT &&
      lines.length === 13 + header.entryCount,
    "stored manifest count or bundle size is invalid", "STORED_MANIFEST_INVALID");
  return Object.freeze(header);
}

function sameNode(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function openPinnedExecutable(helperPath, expectedSha256) {
  fail(path.isAbsolute(helperPath) && SHA256.test(expectedSha256),
    "pinned helper path or SHA-256 is invalid", "INVALID_NATIVE_HELPER");
  const handle = await open(helperPath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    fail(before.isFile() && before.nlink === 1n &&
        (Number(before.mode) & 0o111) !== 0,
      "native helper must be a single-link executable ordinary file",
      "INVALID_NATIVE_HELPER");
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    fail(sameNode(before, after) && before.size === after.size &&
        before.mtimeNs === after.mtimeNs && before.ctimeNs === after.ctimeNs &&
        sha256(bytes) === expectedSha256,
      "native helper bytes or inode differ from the approved helper",
      "INVALID_NATIVE_HELPER");
    return {handle, identity: {
      dev: String(after.dev),
      ino: String(after.ino),
      size: Number(after.size),
      mode: Number(after.mode),
      sha256: expectedSha256,
    }};
  } catch (error) {
    await handle.close();
    throw error;
  }
}

function boundedText(chunks, label) {
  const bytes = Buffer.concat(chunks);
  fail(bytes.length <= 1024 * 1024, `${label} exceeded 1 MiB`,
    "NATIVE_HELPER_OUTPUT_INVALID");
  return bytes.toString("utf8");
}

async function revalidatePinnedExecutable(helperPath, expectedSha256, expectedIdentity) {
  const current = await openPinnedExecutable(helperPath, expectedSha256);
  try {
    fail(current.identity.dev === expectedIdentity.dev &&
        current.identity.ino === expectedIdentity.ino &&
        current.identity.size === expectedIdentity.size &&
        current.identity.mode === expectedIdentity.mode,
      "native helper pathname changed while the helper was running",
      "NATIVE_HELPER_COMMIT_UNCERTAIN");
  } finally {
    await current.handle.close();
  }
}

/**
 * Execute a hash-pinned installed helper while retaining its opened inode on
 * child FD 3. Darwin does not provide fexecve(2), so the fixed pathname is
 * revalidated against that inode immediately after the child exits; any drift
 * makes the outcome commit-uncertain and is never accepted as success.
 */
export async function invokePinnedAdaptiveAtomicHelper({
  helperPath,
  expectedHelperSha256,
  arguments: helperArguments,
  manifestBytes = Buffer.alloc(0),
  bundleHandle = null,
  environment = {},
}) {
  fail(process.platform === "darwin", "native helper requires Darwin",
    "NATIVE_HELPER_UNSUPPORTED");
  fail(Array.isArray(helperArguments) &&
      helperArguments.every((value) => typeof value === "string"),
    "native helper arguments are invalid", "INVALID_NATIVE_HELPER");
  const pinned = await openPinnedExecutable(helperPath, expectedHelperSha256);
  const stdout = [];
  const stderr = [];
  let child;
  try {
    child = spawn(helperPath, helperArguments, {
      shell: false,
      env: {...CLEAN_ENVIRONMENT, ...environment},
      stdio: ["pipe", "pipe", "pipe", pinned.handle.fd,
        bundleHandle ? bundleHandle.fd : "ignore"],
    });
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.stdin.end(manifestBytes);
    const result = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({code, signal}));
    });
    const stdoutText = boundedText(stdout, "native helper stdout");
    const stderrText = boundedText(stderr, "native helper stderr");
    let receipt = null;
    if (stdoutText.trim()) {
      try {
        receipt = JSON.parse(stdoutText);
      } catch (error) {
        throw new AdaptiveAtomicCommitError(
          `native helper returned non-JSON output: ${error.message}`,
          "NATIVE_HELPER_OUTPUT_INVALID",
          {stdout: stdoutText, stderr: stderrText, ...result},
        );
      }
    }
    await revalidatePinnedExecutable(
      helperPath,
      expectedHelperSha256,
      pinned.identity,
    );
    if (result.code !== 0 || result.signal !== null || receipt?.ok !== true) {
      throw new AdaptiveAtomicCommitError(
        `native helper failed: code=${result.code} signal=${result.signal ?? "none"}` +
          `${stderrText ? ` stderr=${JSON.stringify(stderrText.trim())}` : ""}`,
        "NATIVE_HELPER_FAILED",
        {receipt, stdout: stdoutText, stderr: stderrText, ...result},
      );
    }
    return Object.freeze({receipt, helperIdentity: pinned.identity});
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
    await pinned.handle.close();
  }
}

export async function inspectAdaptiveAtomicCommitHelper({
  helperPath,
  expectedHelperSha256,
}) {
  const result = await invokePinnedAdaptiveAtomicHelper({
    helperPath,
    expectedHelperSha256,
    arguments: ["--capabilities"],
  });
  const capability = result.receipt;
  fail(capability.protocol === ADAPTIVE_ATOMIC_COMMIT_PROTOCOL &&
      capability.production === true &&
      capability.expectedEntryCount === ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT &&
      SHA256.test(capability.staticContractSha256 || "") &&
      Array.isArray(capability.syscalls) &&
      ["openat", "fstatat", "renameatx_np", "flock", "fsync", "F_FULLFSYNC"]
        .every((name) => capability.syscalls.includes(name)),
    "native helper capability receipt is not the approved production contract",
    "NATIVE_HELPER_CAPABILITY_INVALID");
  return Object.freeze({...result, capability});
}

async function makeAnonymousBundle(entries) {
  const root = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "helpmath-adaptive-atomic-bundle-"),
  ));
  await chmod(root, 0o700);
  const candidate = path.join(root, "bundle.bin");
  const handle = await open(candidate,
    fsConstants.O_RDWR | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    0o600);
  const digest = createHash("sha256");
  let bytes = 0;
  const directoryIdentity = await lstat(root, {bigint: true});
  try {
    for (const entry of entries) {
      let written = 0;
      while (written < entry.outputBytes.length) {
        const result = await handle.write(
          entry.outputBytes,
          written,
          entry.outputBytes.length - written,
          bytes + written,
        );
        fail(result.bytesWritten > 0, "bundle writer made no progress",
          "BUNDLE_WRITE_FAILED");
        written += result.bytesWritten;
      }
      digest.update(entry.outputBytes);
      bytes += entry.outputBytes.length;
    }
    await handle.sync();
    const information = await handle.stat({bigint: true});
    fail(information.isFile() && information.nlink === 1n &&
        information.size === BigInt(bytes),
      "anonymous bundle file is not stable", "BUNDLE_WRITE_FAILED");
    await unlink(candidate);
    const afterUnlink = await handle.stat({bigint: true});
    fail(afterUnlink.nlink === 0n && afterUnlink.size === BigInt(bytes),
      "bundle pathname custody was not removed", "BUNDLE_WRITE_FAILED");
    return {
      handle,
      root,
      directoryIdentity: {
        dev: directoryIdentity.dev,
        ino: directoryIdentity.ino,
      },
      identity: {bytes, sha256: digest.digest("hex")},
    };
  } catch (error) {
    await handle.close().catch(() => {});
    await unlink(candidate).catch(() => {});
    await rmdir(root).catch(() => {});
    throw error;
  }
}

async function closeAnonymousBundle(bundle) {
  await bundle.handle.close();
  const root = await lstat(bundle.root, {bigint: true});
  fail(root.isDirectory() && !root.isSymbolicLink() &&
      root.dev === bundle.directoryIdentity.dev &&
      root.ino === bundle.directoryIdentity.ino,
    "bundle temporary root identity is unsafe", "BUNDLE_CLEANUP_UNCERTAIN");
  await rmdir(bundle.root);
}

export async function executeAdaptiveAtomicCommit({
  action,
  helperPath,
  expectedHelperSha256,
  expectedStaticContractSha256,
  plan,
  precondition,
  projectRoot,
  rootIdentity,
  evidence,
  environment = {},
}) {
  fail(["apply", "recover-forward", "recover-rollback"].includes(action),
    "unsupported adaptive atomic action");
  const entries = buildAdaptiveAtomicCommitEntries({
    plan, precondition, projectRoot,
  });
  const staticContractSha256 = adaptiveAtomicStaticContractSha256(entries);
  fail(staticContractSha256 === expectedStaticContractSha256,
    "current 286-target contract differs from the approved native contract",
    "ATOMIC_STATIC_CONTRACT_MISMATCH");
  const bundle = await makeAnonymousBundle(entries);
  try {
    const manifest = adaptiveAtomicManifestBytes({
      entries,
      rootIdentity,
      bundle: bundle.identity,
      evidence,
    });
    let invocation;
    try {
      invocation = await invokePinnedAdaptiveAtomicHelper({
        helperPath,
        expectedHelperSha256,
        arguments: [`--${action}`, projectRoot],
        manifestBytes: manifest.bytes,
        bundleHandle: bundle.handle,
        environment,
      });
    } catch (error) {
      error.atomicTransaction = Object.freeze({
        transactionId: manifest.transactionId,
        manifestSha256: sha256(manifest.bytes),
        staticContractSha256,
        bundle: bundle.identity,
      });
      throw error;
    }
    fail(invocation.receipt.transactionId === manifest.transactionId &&
        invocation.receipt.staticContractSha256 === staticContractSha256,
      "native helper receipt is not bound to this transaction",
      "NATIVE_HELPER_RECEIPT_MISMATCH");
    return Object.freeze({
      ...invocation,
      transactionId: manifest.transactionId,
      staticContractSha256,
      manifestSha256: sha256(manifest.bytes),
      bundle: bundle.identity,
    });
  } finally {
    await closeAnonymousBundle(bundle);
  }
}

export async function recoverAdaptiveAtomicCommitFromStoredManifest({
  action,
  transactionId,
  helperPath,
  expectedHelperSha256,
  expectedStaticContractSha256,
  plan,
  projectRoot,
  expectedEvidence,
}) {
  fail(["recover-forward", "recover-rollback"].includes(action),
    "stored-manifest recovery action is invalid");
  fail(SHA256.test(transactionId), "recovery transaction id is invalid",
    "STORED_MANIFEST_INVALID");
  const manifestPath = path.join(
    projectRoot,
    "work",
    ".adaptive-canvas-atomic-v1",
    `tx-${transactionId}`,
    "manifest.bin",
  );
  const handle = await open(manifestPath, fsConstants.O_RDONLY | NOFOLLOW);
  let manifestBytes;
  try {
    const before = await handle.stat({bigint: true});
    fail(before.isFile() && before.nlink === 1n && before.size > 0n &&
        before.size <= 1024n * 1024n,
      "stored manifest is not a safe single-link file",
      "STORED_MANIFEST_INVALID");
    manifestBytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    fail(before.dev === after.dev && before.ino === after.ino &&
        before.size === after.size && before.mtimeNs === after.mtimeNs &&
        before.ctimeNs === after.ctimeNs,
      "stored manifest changed while read", "STORED_MANIFEST_INVALID");
  } finally {
    await handle.close();
  }
  const header = adaptiveAtomicManifestHeader(manifestBytes);
  fail(header.transactionId === transactionId &&
      header.staticContractSha256 === expectedStaticContractSha256 &&
      header.planReceiptSha256 === expectedEvidence.planReceiptSha256 &&
      header.provenanceReceiptSha256 ===
        expectedEvidence.provenanceReceiptSha256 &&
      header.proofReceiptSha256 === expectedEvidence.proofReceiptSha256,
    "stored manifest is not bound to the current approved evidence",
    "STORED_MANIFEST_INVALID");
  const entries = outputOnlyEntriesFromPlan(plan);
  const bundle = await makeAnonymousBundle(entries);
  try {
    fail(bundle.identity.bytes === header.bundleBytes &&
        bundle.identity.sha256 === header.bundleSha256,
      "reconstructed output bundle differs from the stored manifest",
      "STORED_MANIFEST_INVALID");
    const invocation = await invokePinnedAdaptiveAtomicHelper({
      helperPath,
      expectedHelperSha256,
      arguments: [`--${action}`, projectRoot],
      manifestBytes,
      bundleHandle: bundle.handle,
    });
    fail(invocation.receipt.transactionId === transactionId &&
        invocation.receipt.staticContractSha256 === expectedStaticContractSha256,
      "recovery receipt differs from the stored transaction",
      "NATIVE_HELPER_RECEIPT_MISMATCH");
    return Object.freeze({
      ...invocation,
      transactionId,
      manifestSha256: sha256(manifestBytes),
      staticContractSha256: expectedStaticContractSha256,
      bundle: bundle.identity,
    });
  } finally {
    await closeAnonymousBundle(bundle);
  }
}
