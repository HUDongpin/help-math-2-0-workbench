#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS,
  safeProjectRelative,
} from "./rebind-g4-l3-source-static-source-audits.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE_PATH =
  "scripts/recover-g4-l3-source-static-source-audit-rebind.mjs";
const WORK_ROOT =
  "work/g4-l3-source-static-source-audit-rebind";
const LOCK_PATH = `${WORK_ROOT}/.rebind.lock`;
const TRANSACTIONS_PATH = `${WORK_ROOT}/transactions`;
const RECEIPT_PATH =
  "reports/g4-l3-source-static-source-audit-rebind-receipt.json";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

const AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  currentJavaScriptCandidateOnly: true,
  originalRuntimeAuthorityCreated: false,
  audioAcceptanceCreated: false,
  humanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  completionLedgerWriteAuthorized: false,
  lessonReleaseWriteAuthorized: false,
  approvalOrPinWriteAuthorized: false,
  publicReleaseAuthorized: false,
  sourceAssetWriteAuthorized: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

async function exists(absolutePath) {
  return lstat(absolutePath).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  const rootReal = await realpath(root);
  let cursor = rootReal;
  if (relativeDirectory === "." || relativeDirectory === "") return cursor;
  safeProjectRelative(relativeDirectory, "directory");
  for (const segment of relativeDirectory.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
      `directory component must be real: ${relativeDirectory}`);
  }
  return cursor;
}

async function secureReadBinding(root, relativePath, {require0444 = false} = {}) {
  safeProjectRelative(relativePath);
  const rootReal = await realpath(root);
  const parent = await assertRealDirectoryChain(
    rootReal,
    path.posix.dirname(relativePath),
  );
  const absolutePath = path.join(parent, path.posix.basename(relativePath));
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const metadata = await handle.stat({bigint: true});
    invariant(metadata.isFile(), `${relativePath} must be a regular file`);
    invariant(metadata.nlink === 1n,
      `${relativePath} must not have multiple hard links`);
    if (require0444) {
      invariant(Number(metadata.mode & 0o777n) === 0o444,
        `${relativePath} must have mode 0444`);
    }
    const contents = await handle.readFile();
    return {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256(contents),
      contents,
    };
  } finally {
    await handle.close();
  }
}

async function readMaybeBinding(root, relativePath, options) {
  try {
    return await secureReadBinding(root, relativePath, options);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeNoReplace(root, relativePath, contents, mode = 0o444) {
  safeProjectRelative(relativePath);
  const absolutePath = path.join(await realpath(root), relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await assertRealDirectoryChain(root, path.posix.dirname(relativePath));
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(contents);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const observed = await secureReadBinding(root, relativePath, {
    require0444: mode === 0o444,
  });
  invariant(observed.contents.equals(contents),
    `recovery no-replace verification failed: ${relativePath}`);
  return observed;
}

function validateAuthority(authority, label) {
  invariant(Object.entries(authority ?? {})
    .filter(([key]) => ![
      "acceptanceNeutral",
      "currentJavaScriptCandidateOnly",
      "strictAcceptanceEffect",
    ].includes(key))
    .every(([, value]) => value === false) &&
    authority.acceptanceNeutral === true &&
    authority.currentJavaScriptCandidateOnly === true &&
    authority.strictAcceptanceEffect === "none",
  `${label} crossed an authority boundary`);
}

function validatePlan(plan, transactionId) {
  invariant(plan?.schemaVersion === 1 &&
    plan.reportType ===
      "g4-l3-source-static-source-audit-rebind-transaction-plan" &&
    plan.transactionId === transactionId &&
    plan.receipt?.path === RECEIPT_PATH &&
    /^[a-f0-9]{64}$/.test(plan.receipt?.sha256 ?? "") &&
    plan.specPreimages?.length ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    plan.specPostimages?.length ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length,
  "source-audit rebind recovery plan identity is invalid");
  validateAuthority(plan.authorityBoundary, "source-audit rebind recovery plan");
  for (const [index, transition] of
    SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.entries()) {
    invariant(plan.specPreimages[index]?.path === transition.specPath &&
      plan.specPostimages[index]?.path === transition.specPath &&
      Number.isSafeInteger(plan.specPreimages[index].bytes) &&
      Number.isSafeInteger(plan.specPostimages[index].bytes) &&
      /^[a-f0-9]{64}$/.test(plan.specPreimages[index].sha256 ?? "") &&
      /^[a-f0-9]{64}$/.test(plan.specPostimages[index].sha256 ?? ""),
    `${transition.animationId}: recovery plan spec scope drifted`);
  }
  invariant(Array.isArray(plan.protectedBefore) &&
    plan.protectedBefore.length === 4 &&
    plan.protectedBefore.every(({path: protectedPath, bytes, sha256: digest}) =>
      [
        "catalog/completion-ledger.json",
        "catalog/lesson-release-ledger.json",
        "catalog/lesson-releases.json",
        "reports/current-javascript-output-human-approval.json",
      ].includes(protectedPath) &&
      Number.isSafeInteger(bytes) &&
      /^[a-f0-9]{64}$/.test(digest ?? "")),
  "source-audit rebind recovery protected scope is invalid");
  return plan;
}

async function assertProtected(root, protectedBindings) {
  for (const expected of protectedBindings) {
    const observed = await secureReadBinding(root, expected.path);
    invariant(sameBinding(observed, expected),
      `protected file changed: ${expected.path}`);
  }
}

async function pidAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function acquireRecoveryLock(root, transactionId) {
  const absolute = path.join(await realpath(root), LOCK_PATH);
  await mkdir(path.dirname(absolute), {recursive: true});
  await assertRealDirectoryChain(root, WORK_ROOT);
  if (await exists(absolute)) {
    const ownerBinding = await secureReadBinding(
      root,
      `${LOCK_PATH}/owner.json`,
    );
    const owner = JSON.parse(ownerBinding.contents.toString("utf8"));
    invariant(owner.transactionId === transactionId,
      "stale lock belongs to another transaction");
    invariant(!await pidAlive(owner.pid),
      `source-audit rebind lock is held by live pid ${owner.pid}`);
    const staleRelative =
      `${WORK_ROOT}/stale-locks/${transactionId}-${ownerBinding.sha256.slice(0, 16)}`;
    await mkdir(path.dirname(path.join(root, staleRelative)), {recursive: true});
    invariant(!await exists(path.join(root, staleRelative)),
      "stale-lock recovery replay detected");
    await rename(absolute, path.join(root, staleRelative));
  }
  await mkdir(absolute, {recursive: false});
  await writeNoReplace(
    root,
    `${LOCK_PATH}/owner.json`,
    Buffer.from(stableJson({
      schemaVersion: 1,
      transactionId,
      recoveryPid: process.pid,
    })),
  );
  return {absolute, transactionId};
}

async function releaseRecoveryLock(root, lock) {
  const ownerPath = `${LOCK_PATH}/owner.json`;
  const owner = JSON.parse(
    (await secureReadBinding(root, ownerPath)).contents.toString("utf8"),
  );
  invariant(owner.transactionId === lock.transactionId &&
    owner.recoveryPid === process.pid,
  "refusing to release a recovery lock whose owner changed");
  await unlink(path.join(root, ownerPath));
  await rmdir(lock.absolute);
}

async function restoreReceipt(root, transactionRoot, expected) {
  const current = await readMaybeBinding(root, RECEIPT_PATH);
  const recoveredPath = `${transactionRoot}/recovery/canonical-receipt.json`;
  const recovered = await readMaybeBinding(root, recoveredPath, {
    require0444: true,
  });
  if (current) {
    invariant(sameBinding(current, expected),
      "canonical receipt has foreign drift");
    invariant(!recovered, "canonical receipt recovery destination is occupied");
    await mkdir(path.dirname(path.join(root, recoveredPath)), {recursive: true});
    await rename(path.join(root, RECEIPT_PATH), path.join(root, recoveredPath));
    await chmod(path.join(root, recoveredPath), 0o444);
    return true;
  }
  if (recovered) {
    invariant(sameBinding(
      {...recovered, path: RECEIPT_PATH},
      expected,
    ), "recovered canonical receipt is stale");
  }
  return false;
}

async function restoreSpec({
  root,
  transactionRoot,
  transition,
  preimage,
  postimage,
  index,
}) {
  const archivePath =
    `${transactionRoot}/spec-preimages/${transition.specPath}`;
  const archive = await secureReadBinding(root, archivePath, {
    require0444: true,
  });
  invariant(sameBinding(
    {...archive, path: transition.specPath},
    preimage,
  ), `${transition.animationId}: archived spec preimage is stale`);
  const quarantinePath =
    `${transactionRoot}/quarantine/${String(index + 1).padStart(2, "0")}.json`;
  const recoveryPostPath =
    `${transactionRoot}/recovery/post/${String(index + 1).padStart(2, "0")}.json`;
  const [current, quarantine, recoveryPost] = await Promise.all([
    readMaybeBinding(root, transition.specPath),
    readMaybeBinding(root, quarantinePath, {require0444: true}),
    readMaybeBinding(root, recoveryPostPath, {require0444: true}),
  ]);
  if (current && sameBinding(current, preimage)) return "already-preimage";
  invariant(!current || sameBinding(current, postimage),
    `${transition.animationId}: current spec is foreign drift`);
  if (quarantine) {
    invariant(sameBinding(
      {...quarantine, path: transition.specPath},
      preimage,
    ), `${transition.animationId}: quarantine preimage is stale`);
  }
  if (recoveryPost) {
    invariant(sameBinding(
      {...recoveryPost, path: transition.specPath},
      postimage,
    ), `${transition.animationId}: recovery postimage is stale`);
  }
  invariant(quarantine || recoveryPost,
    `${transition.animationId}: missing crash evidence for changed spec`);
  if (current) {
    invariant(!recoveryPost,
      `${transition.animationId}: duplicate postimage recovery state`);
    await mkdir(path.dirname(path.join(root, recoveryPostPath)), {
      recursive: true,
    });
    await rename(
      path.join(root, transition.specPath),
      path.join(root, recoveryPostPath),
    );
    await chmod(path.join(root, recoveryPostPath), 0o444);
  }
  await writeNoReplace(
    root,
    transition.specPath,
    archive.contents,
    0o644,
  );
  const restored = await secureReadBinding(root, transition.specPath);
  invariant(sameBinding(restored, preimage),
    `${transition.animationId}: restored spec differs from preimage`);
  return current ? "restored-postimage" : "restored-missing-target";
}

export async function recoverSourceStaticSourceAuditRebind({
  root = PROJECT_ROOT,
  transactionId,
} = {}) {
  invariant(/^[a-f0-9]{64}$/.test(transactionId ?? ""),
    "a lowercase SHA-256 transaction ID is required");
  const transactionRoot = `${TRANSACTIONS_PATH}/${transactionId}`;
  invariant(await exists(path.join(root, transactionRoot)),
    `transaction does not exist: ${transactionId}`);
  invariant(!await exists(path.join(root, `${transactionRoot}/commit.json`)),
    "committed transaction cannot be recovered");
  invariant(!await exists(path.join(root, `${transactionRoot}/recovered.json`)),
    "recovered transaction cannot be replayed");
  const [planBinding, recoveryScript] = await Promise.all([
    secureReadBinding(root, `${transactionRoot}/plan.json`, {
      require0444: true,
    }),
    secureReadBinding(root, SCRIPT_RELATIVE_PATH),
  ]);
  const plan = validatePlan(
    JSON.parse(planBinding.contents.toString("utf8")),
    transactionId,
  );
  await assertProtected(root, plan.protectedBefore);
  const lock = await acquireRecoveryLock(root, transactionId);
  try {
    const receiptMoved = await restoreReceipt(
      root,
      transactionRoot,
      plan.receipt,
    );
    const outcomes = [];
    for (const [index, transition] of
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.entries()) {
      outcomes.push(await restoreSpec({
        root,
        transactionRoot,
        transition,
        preimage: plan.specPreimages[index],
        postimage: plan.specPostimages[index],
        index,
      }));
    }
    await assertProtected(root, plan.protectedBefore);
    invariant(!await exists(path.join(root, RECEIPT_PATH)),
      "canonical receipt survived recovery");
    const recovered = {
      schemaVersion: 1,
      reportType:
        "g4-l3-source-static-source-audit-rebind-recovery-receipt",
      transactionId,
      plan: publicBinding(planBinding),
      recoveryTool: publicBinding(recoveryScript),
      restoredSpecCount: outcomes.filter((value) =>
        value !== "already-preimage").length,
      alreadyPreimageCount: outcomes.filter((value) =>
        value === "already-preimage").length,
      missingTargetRecoveryCount: outcomes.filter((value) =>
        value === "restored-missing-target").length,
      canonicalReceiptMoved: receiptMoved,
      outcomes,
      authorityBoundary: AUTHORITY_BOUNDARY,
    };
    recovered.recoveryFingerprintSha256 = sha256(
      Buffer.from(stableJson(recovered)),
    );
    await writeNoReplace(
      root,
      `${transactionRoot}/recovered.json`,
      Buffer.from(stableJson(recovered)),
    );
    return {
      mode: "recover",
      transactionId,
      restoredSpecCount: recovered.restoredSpecCount,
      alreadyPreimageCount: recovered.alreadyPreimageCount,
      missingTargetRecoveryCount: recovered.missingTargetRecoveryCount,
      canonicalReceiptMoved: receiptMoved,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await releaseRecoveryLock(root, lock);
  }
}

export function parseArguments(argv) {
  const options = {root: PROJECT_ROOT, transactionId: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--recover") {
      invariant(argv[index + 1], "--recover requires a transaction ID");
      options.transactionId = argv[index + 1];
      index += 1;
    } else if (argument === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.transactionId, "--recover is required");
  }
  return options;
}

function help() {
  return "Usage: node scripts/recover-g4-l3-source-static-source-audit-rebind.mjs --recover TRANSACTION_SHA256 [--root PATH]\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await recoverSourceStaticSourceAuditRebind(options),
  ));
}

if (process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
