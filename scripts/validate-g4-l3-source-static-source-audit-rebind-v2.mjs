#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
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
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS,
  validateSourceStaticSourceAuditRebindReceipt,
} from "./rebind-g4-l3-source-static-source-audits.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE_PATH =
  "scripts/validate-g4-l3-source-static-source-audit-rebind-v2.mjs";
const TRANSACTION_ID =
  "75f8766a9fb4648979f7c0fbae3badf05d31c43f5ca83b40f3f2c2c85344fcf7";
const WORK_ROOT = "work/g4-l3-source-static-source-audit-rebind";
const TRANSACTION_ROOT = `${WORK_ROOT}/transactions/${TRANSACTION_ID}`;
const V1_RECEIPT_PATH =
  "reports/g4-l3-source-static-source-audit-rebind-receipt.json";
const PLAN_PATH = `${TRANSACTION_ROOT}/plan.json`;
const V1_COMMIT_PATH = `${TRANSACTION_ROOT}/commit.json`;
const V2_COMMIT_PROOF_PATH =
  `${TRANSACTION_ROOT}/transaction-time-protected-state-proof-v2.json`;
const V2_RECEIPT_PATH =
  "reports/g4-l3-source-static-source-audit-rebind-transaction-proof-v2.json";
const LOCK_PATH = `${WORK_ROOT}/.transaction-proof-v2.lock`;
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return sha256(Buffer.from(stableJson(copy)));
}

function validateFingerprint(value, field, label) {
  invariant(/^[a-f0-9]{64}$/.test(value?.[field] ?? "") &&
    value[field] === fingerprint(value, field),
  `${label} fingerprint is stale`);
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function sameBindingList(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((entry, index) => sameBinding(entry, right[index]));
}

function assertRelativePath(relativePath) {
  invariant(typeof relativePath === "string" &&
    relativePath.length > 0 &&
    !path.isAbsolute(relativePath) &&
    !relativePath.split(/[\\/]/u).includes("..") &&
    path.normalize(relativePath) === relativePath,
  `unsafe project-relative path: ${relativePath}`);
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  assertRelativePath(relativeDirectory);
  const rootReal = await realpath(root);
  let cursor = root;
  for (const segment of relativeDirectory.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
      `unsafe directory component: ${cursor}`);
    const resolved = await realpath(cursor);
    invariant(resolved === path.join(rootReal, path.relative(root, cursor)),
      `directory escaped project root: ${cursor}`);
  }
}

async function secureRead(root, relativePath, {require0444 = false} = {}) {
  assertRelativePath(relativePath);
  const parent = path.dirname(relativePath);
  if (parent !== ".") await assertRealDirectoryChain(root, parent);
  const absolute = path.join(root, relativePath);
  const before = await lstat(absolute);
  invariant(before.isFile() && !before.isSymbolicLink() &&
    before.nlink === 1,
  `unsafe immutable file: ${relativePath}`);
  if (require0444) {
    invariant((before.mode & 0o777) === 0o444,
      `immutable file mode is not 0444: ${relativePath}`);
  }
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat();
    invariant(opened.dev === before.dev &&
      opened.ino === before.ino &&
      opened.isFile() &&
      opened.nlink === 1,
    `file changed while opening: ${relativePath}`);
    const contents = await handle.readFile();
    const after = await lstat(absolute);
    invariant(after.dev === opened.dev &&
      after.ino === opened.ino &&
      after.size === opened.size &&
      after.mtimeMs === opened.mtimeMs,
    `file changed while reading: ${relativePath}`);
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

async function secureWriteNoReplace(root, relativePath, bytes) {
  assertRelativePath(relativePath);
  const parent = path.dirname(relativePath);
  if (parent !== ".") await assertRealDirectoryChain(root, parent);
  const temporaryPath =
    `${relativePath}.tmp-${process.pid}-${randomBytes(8).toString("hex")}`;
  const temporaryAbsolute = path.join(root, temporaryPath);
  const targetAbsolute = path.join(root, relativePath);
  let handle;
  try {
    handle = await open(
      temporaryAbsolute,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL |
        NOFOLLOW,
      0o444,
    );
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    await chmod(temporaryAbsolute, 0o444);
    try {
      await stat(targetAbsolute);
      throw new Error(`no-replace target already exists: ${relativePath}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await rename(temporaryAbsolute, targetAbsolute);
  } catch (error) {
    if (handle) await handle.close();
    await unlink(temporaryAbsolute).catch(() => {});
    throw error;
  }
}

async function exists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function acquireLock(root) {
  const parent = path.dirname(LOCK_PATH);
  await assertRealDirectoryChain(root, parent);
  const absolute = path.join(root, LOCK_PATH);
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL |
      NOFOLLOW,
    0o444,
  );
  const owner = Buffer.from(stableJson({
    schemaVersion: 1,
    transactionId: TRANSACTION_ID,
    pid: process.pid,
    nonce: randomBytes(16).toString("hex"),
  }));
  await handle.writeFile(owner);
  await handle.sync();
  await handle.close();
  await chmod(absolute, 0o444);
  return {absolute, binding: await secureRead(root, LOCK_PATH, {require0444: true})};
}

async function releaseLock(lock) {
  const current = await readFile(lock.absolute);
  invariant(sha256(current) === lock.binding.sha256,
    "transaction-proof lock ownership changed");
  await unlink(lock.absolute);
}

function writerControlFlowProof(writer) {
  const source = writer.contents.toString("utf8");
  const startToken =
    "await verifyProtected(root, locked.protectedBindings);";
  const endToken =
    "await writeNoReplace(\n      root,\n      `${transactionRoot}/commit.json`,";
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  invariant(start >= 0 && end > start,
    "v1 writer no longer proves protected verification before commit");
  const sequence = source.slice(start, end + endToken.length);
  invariant(sequence.indexOf(startToken) === 0 &&
    sequence.lastIndexOf(startToken) === 0,
  "v1 writer protected verification sequence is ambiguous");
  return {
    writer: publicBinding(writer),
    ordering:
      "verifyProtected(protectedBefore) completed before immutable commit creation",
    sequenceBytes: Buffer.byteLength(sequence),
    sequenceSha256: sha256(Buffer.from(sequence)),
    failClosed: true,
  };
}

function validateAuthorityBoundary(boundary) {
  invariant(JSON.stringify(boundary) === JSON.stringify(AUTHORITY_BOUNDARY),
    "transaction proof crossed an authority boundary");
}

function validateV1Artifacts({v1Receipt, plan, v1Commit}) {
  validateSourceStaticSourceAuditRebindReceipt(v1Receipt);
  invariant(v1Receipt.transactionId === TRANSACTION_ID,
    "v1 receipt transaction ID is stale");
  invariant(plan?.schemaVersion === 1 &&
    plan.reportType ===
      "g4-l3-source-static-source-audit-rebind-transaction-plan" &&
    plan.transactionId === TRANSACTION_ID &&
    sameBinding(plan.receipt, {
      path: V1_RECEIPT_PATH,
      bytes: Buffer.byteLength(stableJson(v1Receipt)),
      sha256: sha256(Buffer.from(stableJson(v1Receipt))),
    }) &&
    plan.specPreimages?.length ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    plan.specPostimages?.length ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    sameBindingList(plan.protectedBefore, v1Receipt.protectedBefore),
  "v1 transaction plan is invalid");
  invariant(v1Commit?.schemaVersion === 1 &&
    v1Commit.transactionId === TRANSACTION_ID &&
    v1Commit.specCount === SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length &&
    sameBinding(v1Commit.receipt, plan.receipt),
  "v1 transaction commit is invalid");
  validateAuthorityBoundary(plan.authorityBoundary);
  validateAuthorityBoundary(v1Commit.authorityBoundary);
}

async function readImmutableV1Artifacts(root) {
  const [receiptFile, planFile, commitFile, writer] = await Promise.all([
    secureRead(root, V1_RECEIPT_PATH, {require0444: true}),
    secureRead(root, PLAN_PATH, {require0444: true}),
    secureRead(root, V1_COMMIT_PATH, {require0444: true}),
    secureRead(
      root,
      "scripts/rebind-g4-l3-source-static-source-audits.mjs",
    ),
  ]);
  const v1Receipt = JSON.parse(receiptFile.contents.toString("utf8"));
  const plan = JSON.parse(planFile.contents.toString("utf8"));
  const v1Commit = JSON.parse(commitFile.contents.toString("utf8"));
  validateV1Artifacts({v1Receipt, plan, v1Commit});
  invariant(sameBinding(v1Receipt.generatedBy, writer),
    "v1 receipt writer binding is stale");
  return {receiptFile, planFile, commitFile, writer, v1Receipt, plan, v1Commit};
}

async function validateArchivedPreimages(root, v1Receipt, plan) {
  const archiveBindings = [];
  for (const [index, item] of v1Receipt.items.entries()) {
    const archivedSpec = await secureRead(
      root,
      item.historicalEvidence.archivedSpecPath,
      {require0444: true},
    );
    invariant(sameBinding(
      {...publicBinding(archivedSpec),
        path: item.historicalEvidence.specPreimage.path},
      item.historicalEvidence.specPreimage,
    ) && sameBinding(
      item.historicalEvidence.specPreimage,
      plan.specPreimages[index],
    ), `${item.animationId}: archived spec preimage is stale`);
    const archivedCandidate = await secureRead(
      root,
      item.historicalEvidence.archivedCandidatePath,
      {require0444: true},
    );
    invariant(sameBinding(
      {...publicBinding(archivedCandidate),
        path: item.historicalEvidence.candidateReport.path},
      item.historicalEvidence.candidateReport,
    ), `${item.animationId}: archived candidate preimage is stale`);
    const quarantine = await secureRead(
      root,
      `${TRANSACTION_ROOT}/quarantine/${String(index + 1)
        .padStart(2, "0")}.json`,
      {require0444: true},
    );
    invariant(quarantine.bytes === plan.specPreimages[index].bytes &&
      quarantine.sha256 === plan.specPreimages[index].sha256,
    `${item.animationId}: CAS quarantine preimage is stale`);
    archiveBindings.push({
      animationId: item.animationId,
      archivedSpec: publicBinding(archivedSpec),
      archivedCandidate: publicBinding(archivedCandidate),
      quarantine: publicBinding(quarantine),
    });
  }
  return archiveBindings;
}

function buildCommitProof({
  artifacts,
  scriptBinding,
  controlFlow,
  archiveBindings,
}) {
  const proof = {
    schemaVersion: 2,
    reportType:
      "g4-l3-source-static-source-audit-rebind-transaction-time-commit-proof",
    transactionId: TRANSACTION_ID,
    generatedBy: publicBinding(scriptBinding),
    immutableV1Artifacts: {
      receipt: publicBinding(artifacts.receiptFile),
      plan: publicBinding(artifacts.planFile),
      commit: publicBinding(artifacts.commitFile),
    },
    protectedBefore: structuredClone(artifacts.plan.protectedBefore),
    protectedAfterAtCommit: structuredClone(artifacts.plan.protectedBefore),
    transactionTimeProof: {
      controlFlow,
      v1CommitExistsOnlyAfterProtectedVerificationCompleted: true,
      protectedBeforeEqualsProtectedAfterAtCommit: true,
      liveProtectedStateIsNotACanonicalValidationInput: true,
      explanation:
        "The exact hash-bound v1 writer verified every protected-before binding after all spec and receipt writes and before no-replace commit creation. The immutable v1 commit therefore records successful transaction completion. This successor materializes that transaction-time result; future live protected-file changes do not invalidate it.",
    },
    archivedPreimages: archiveBindings,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
  proof.proofFingerprintSha256 =
    fingerprint(proof, "proofFingerprintSha256");
  return proof;
}

function validateCommitProof(proof, artifacts, scriptBinding) {
  invariant(proof?.schemaVersion === 2 &&
    proof.reportType ===
      "g4-l3-source-static-source-audit-rebind-transaction-time-commit-proof" &&
    proof.transactionId === TRANSACTION_ID &&
    sameBinding(proof.generatedBy, scriptBinding),
  "v2 transaction-time commit proof identity is invalid");
  validateFingerprint(proof, "proofFingerprintSha256",
    "v2 transaction-time commit proof");
  invariant(sameBinding(
    proof.immutableV1Artifacts?.receipt,
    artifacts.receiptFile,
  ) && sameBinding(
    proof.immutableV1Artifacts?.plan,
    artifacts.planFile,
  ) && sameBinding(
    proof.immutableV1Artifacts?.commit,
    artifacts.commitFile,
  ), "v2 transaction-time commit proof v1 bindings are stale");
  invariant(sameBindingList(
    proof.protectedBefore,
    artifacts.plan.protectedBefore,
  ) && sameBindingList(
    proof.protectedAfterAtCommit,
    artifacts.plan.protectedBefore,
  ) && proof.transactionTimeProof
    ?.v1CommitExistsOnlyAfterProtectedVerificationCompleted === true &&
    proof.transactionTimeProof
      ?.protectedBeforeEqualsProtectedAfterAtCommit === true &&
    proof.transactionTimeProof
      ?.liveProtectedStateIsNotACanonicalValidationInput === true,
  "v2 transaction-time protected-state proof is invalid");
  const expectedControlFlow = writerControlFlowProof(artifacts.writer);
  invariant(JSON.stringify(proof.transactionTimeProof.controlFlow) ===
    JSON.stringify(expectedControlFlow),
  "v2 transaction-time control-flow proof is stale");
  validateAuthorityBoundary(proof.authorityBoundary);
  return proof;
}

function buildReceipt({commitProofBinding, artifacts, scriptBinding}) {
  const receipt = {
    schemaVersion: 2,
    receiptType:
      "g4-l3-source-static-source-audit-rebind-transaction-proof-receipt",
    receiptId:
      "g4-l3-source-static-source-audit-rebind-transaction-proof-2026-07-27-v2",
    transactionId: TRANSACTION_ID,
    generatedBy: publicBinding(scriptBinding),
    supersedesValidationBehavior: {
      v1Receipt: publicBinding(artifacts.receiptFile),
      behavior:
        "Canonical post-transaction validation uses immutable transaction-time artifacts and does not require live protected files to retain transaction-time bytes.",
      v1ReceiptBytesModified: false,
      v1WriterBytesModified: false,
      v1PlanBytesModified: false,
      v1CommitBytesModified: false,
    },
    immutableTransactionTimeProof: commitProofBinding,
    protectedBefore: structuredClone(artifacts.plan.protectedBefore),
    protectedAfterAtCommit: structuredClone(artifacts.plan.protectedBefore),
    canonicalValidationInputs: [
      publicBinding(artifacts.receiptFile),
      publicBinding(artifacts.planFile),
      publicBinding(artifacts.commitFile),
      commitProofBinding,
    ],
    canonicalValidationExplicitExclusions: {
      liveProtectedFiles: artifacts.plan.protectedBefore.map(({path: value}) =>
        value),
      reason:
        "Later authorized changes are independent downstream transactions and do not rewrite this committed historical fact.",
    },
    archivedPreimageCount: SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
  receipt.receiptFingerprintSha256 =
    fingerprint(receipt, "receiptFingerprintSha256");
  return receipt;
}

function validateReceipt(receipt, {
  artifacts,
  scriptBinding,
  commitProofBinding,
}) {
  invariant(receipt?.schemaVersion === 2 &&
    receipt.receiptType ===
      "g4-l3-source-static-source-audit-rebind-transaction-proof-receipt" &&
    receipt.receiptId ===
      "g4-l3-source-static-source-audit-rebind-transaction-proof-2026-07-27-v2" &&
    receipt.transactionId === TRANSACTION_ID &&
    sameBinding(receipt.generatedBy, scriptBinding),
  "v2 transaction-proof receipt identity is invalid");
  validateFingerprint(receipt, "receiptFingerprintSha256",
    "v2 transaction-proof receipt");
  invariant(sameBinding(
    receipt.supersedesValidationBehavior?.v1Receipt,
    artifacts.receiptFile,
  ) && receipt.supersedesValidationBehavior?.v1ReceiptBytesModified === false &&
    receipt.supersedesValidationBehavior?.v1WriterBytesModified === false &&
    receipt.supersedesValidationBehavior?.v1PlanBytesModified === false &&
    receipt.supersedesValidationBehavior?.v1CommitBytesModified === false &&
    sameBinding(receipt.immutableTransactionTimeProof, commitProofBinding) &&
    sameBindingList(receipt.protectedBefore, artifacts.plan.protectedBefore) &&
    sameBindingList(
      receipt.protectedAfterAtCommit,
      artifacts.plan.protectedBefore,
    ) &&
    receipt.archivedPreimageCount ===
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.length,
  "v2 transaction-proof receipt is stale");
  const liveExclusions =
    receipt.canonicalValidationExplicitExclusions?.liveProtectedFiles;
  invariant(Array.isArray(liveExclusions) &&
    JSON.stringify(liveExclusions) === JSON.stringify(
      artifacts.plan.protectedBefore.map(({path: value}) => value),
    ),
  "v2 receipt live-protected exclusion is invalid");
  validateAuthorityBoundary(receipt.authorityBoundary);
  return receipt;
}

async function assertLiveProtectedEqualsTransactionState(root, bindings) {
  for (const expected of bindings) {
    const observed = await secureRead(root, expected.path);
    invariant(sameBinding(observed, expected),
      `protected file changed before v2 proof creation: ${expected.path}`);
  }
}

export async function applyTransactionTimeProof({
  root = PROJECT_ROOT,
  hooks = {},
} = {}) {
  const lock = await acquireLock(root);
  try {
    const [artifacts, scriptBinding] = await Promise.all([
      readImmutableV1Artifacts(root),
      secureRead(root, SCRIPT_RELATIVE_PATH),
    ]);
    const archiveBindings = await validateArchivedPreimages(
      root,
      artifacts.v1Receipt,
      artifacts.plan,
    );
    await assertLiveProtectedEqualsTransactionState(
      root,
      artifacts.plan.protectedBefore,
    );
    const commitProof = buildCommitProof({
      artifacts,
      scriptBinding,
      controlFlow: writerControlFlowProof(artifacts.writer),
      archiveBindings,
    });
    const commitProofBytes = Buffer.from(stableJson(commitProof));
    const commitProofBinding = {
      path: V2_COMMIT_PROOF_PATH,
      bytes: commitProofBytes.length,
      sha256: sha256(commitProofBytes),
    };
    const receipt = buildReceipt({
      commitProofBinding,
      artifacts,
      scriptBinding,
    });
    const receiptBytes = Buffer.from(stableJson(receipt));
    const commitProofExists = await exists(path.join(root, V2_COMMIT_PROOF_PATH));
    const receiptExists = await exists(path.join(root, V2_RECEIPT_PATH));
    invariant(!receiptExists || commitProofExists,
      "v2 receipt exists without its commit proof");
    if (!commitProofExists) {
      await secureWriteNoReplace(root, V2_COMMIT_PROOF_PATH, commitProofBytes);
      if (hooks.afterCommitProofWrite) await hooks.afterCommitProofWrite();
    } else {
      const observed = await secureRead(
        root,
        V2_COMMIT_PROOF_PATH,
        {require0444: true},
      );
      invariant(observed.contents.equals(commitProofBytes),
        "existing v2 commit proof is foreign drift");
    }
    if (!receiptExists) {
      await secureWriteNoReplace(root, V2_RECEIPT_PATH, receiptBytes);
    } else {
      const observed = await secureRead(
        root,
        V2_RECEIPT_PATH,
        {require0444: true},
      );
      invariant(observed.contents.equals(receiptBytes),
        "existing v2 receipt is foreign drift");
    }
    return checkTransactionTimeProof({root});
  } finally {
    await releaseLock(lock);
  }
}

export async function checkTransactionTimeProof({root = PROJECT_ROOT} = {}) {
  const [artifacts, scriptBinding, commitProofFile, receiptFile] =
    await Promise.all([
      readImmutableV1Artifacts(root),
      secureRead(root, SCRIPT_RELATIVE_PATH),
      secureRead(root, V2_COMMIT_PROOF_PATH, {require0444: true}),
      secureRead(root, V2_RECEIPT_PATH, {require0444: true}),
    ]);
  const archiveBindings = await validateArchivedPreimages(
    root,
    artifacts.v1Receipt,
    artifacts.plan,
  );
  const commitProof = validateCommitProof(
    JSON.parse(commitProofFile.contents.toString("utf8")),
    artifacts,
    scriptBinding,
  );
  invariant(commitProof.archivedPreimages.length === archiveBindings.length &&
    JSON.stringify(commitProof.archivedPreimages) ===
      JSON.stringify(archiveBindings),
  "v2 transaction proof archived-preimage bindings are stale");
  const receipt = validateReceipt(
    JSON.parse(receiptFile.contents.toString("utf8")),
    {
      artifacts,
      scriptBinding,
      commitProofBinding: publicBinding(commitProofFile),
    },
  );
  return {
    mode: "check",
    transactionId: TRANSACTION_ID,
    receipt: publicBinding(receiptFile),
    commitProof: publicBinding(commitProofFile),
    archivedPreimageCount: receipt.archivedPreimageCount,
    liveProtectedFilesRead: 0,
    protectedBeforeEqualsProtectedAfterAtCommit: true,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const options = {mode: "check", root: PROJECT_ROOT};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      options.mode = "apply";
    } else if (argument === "--check") {
      options.mode = "check";
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
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/validate-g4-l3-source-static-source-audit-rebind-v2.mjs [--apply|--check] [--root PATH]\n",
    );
    return;
  }
  const result = options.mode === "apply"
    ? await applyTransactionTimeProof(options)
    : await checkTransactionTimeProof(options);
  process.stdout.write(`${stableJson(result)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
