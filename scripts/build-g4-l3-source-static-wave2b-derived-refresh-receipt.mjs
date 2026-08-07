#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import {hostname} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  assertWave2bLock,
  releaseWave2bLock,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const NOFOLLOW = fsConstants.O_NOFOLLOW;

export const WAVE2B_DERIVED_REFRESH_PATHS = Object.freeze({
  script:
    "scripts/build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs",
  casModule:
    "scripts/rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs",
  receipt:
    "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
  workRoot:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt",
  lock:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt/.lock",
  transaction:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt/transaction",
  plan:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt/transaction/plan.json",
  journal:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt/transaction/journal.jsonl",
  temp:
    "work/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt/transaction/receipt.tmp",
  wave2bReceipt:
    "reports/g4-l3-source-static-source-audit-wave2b-security-closure-receipt.json",
});

const WAVE2B_TRANSACTION_ID =
  "05b68e54281b0602929d769ca59f101bf8dcdba9937d49cb0dbe39eb0a5523f1";
const WAVE2B_TRANSACTION_ROOT =
  `work/g4-l3-source-static-source-audit-wave2b-closure/transactions/${WAVE2B_TRANSACTION_ID}`;
const EXPECTED_MEMBER_COUNT = 19;
const G4_L3_RELEASE_ID = "lesson-g04-l03-negative-numbers";

const EXPECTED_WAVE2B = Object.freeze({
  receipt: Object.freeze({
    path: WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt,
    bytes: 46_106,
    sha256:
      "5164ea45b9fb0df37e5685829e20f4e4c387efd8b1251ae030b72ee2b108f3ff",
    mode: 0o444,
  }),
  plan: Object.freeze({
    path: `${WAVE2B_TRANSACTION_ROOT}/plan.json`,
    bytes: 335_665,
    sha256:
      "483bf6049e229f18c43d2853ecb335a77b71fdda32095ffd62c63cbe1132ef0a",
    mode: 0o444,
  }),
  preparedReceipt: Object.freeze({
    path: `${WAVE2B_TRANSACTION_ROOT}/prepared/receipt.json`,
    bytes: 45_375,
    sha256:
      "56d72065b60e3ca12fa5afdff77403414eb90a85d82b9ad4b30d122a84af12d3",
    mode: 0o444,
  }),
  commit: Object.freeze({
    path: `${WAVE2B_TRANSACTION_ROOT}/commit.json`,
    bytes: 10_458,
    sha256:
      "824686ca7256911fad33fcd9b6c671e4b5439518e398a8efd95345d51f0910ff",
    mode: 0o444,
  }),
  journal: Object.freeze({
    path: `${WAVE2B_TRANSACTION_ROOT}/apply-journal.jsonl`,
    bytes: 587_414,
    sha256:
      "482894762719821f0e71e87554675f3a2dafa2757284bd39c9018e82c1e88211",
    mode: 0o444,
  }),
  transactionTree: Object.freeze({
    root: WAVE2B_TRANSACTION_ROOT,
    fileCount: 82,
    directoryCount: 44,
    totalBytes: 3_235_045,
    manifestSha256:
      "49ec7e5746e6d15e95def062888d788f2f195fa23c10798e46a083678b7e6073",
  }),
});

const EXPECTED_PUBLICATION_SECURITY_DEPENDENCY = Object.freeze({
  path: WAVE2B_DERIVED_REFRESH_PATHS.casModule,
  bytes: 93_399,
  sha256:
    "85089c1c82bd4256e99a6f9bb4f0e9342645e0784d6a8225669b7cd4272f982d",
  mode: 0o644,
});

export const EXPECTED_DERIVED_REFRESH_BINDINGS = Object.freeze([
  Object.freeze({
    role: "completion-ledger",
    path: "catalog/completion-ledger.json",
    bytes: 64_286,
    sha256:
      "f0e070446e76d1201120dbf2f0c269ffeb3d71d8c18e9e215e7b64628d6f9647",
    mode: 0o644,
  }),
  Object.freeze({
    role: "lesson-release-ledger",
    path: "catalog/lesson-release-ledger.json",
    bytes: 49_048,
    sha256:
      "699cc335e7e232c7e186cab7c0ba0027b582e3cd10962061dc1f60d372a1f155",
    mode: 0o644,
  }),
  Object.freeze({
    role: "current-javascript-progress-json",
    path: "reports/g4-l3-current-javascript-progress.json",
    bytes: 112_608,
    sha256:
      "66f39f4704981921d80a6105cbb6d9d6b161a5dbae99a1cb91db250496327ee2",
    mode: 0o644,
  }),
  Object.freeze({
    role: "current-javascript-progress-markdown",
    path: "reports/g4-l3-current-javascript-progress.md",
    bytes: 4_767,
    sha256:
      "c6c88a1a891b996f669307e2d73fc7e133043ef151fbad4312f283624ff3878e",
    mode: 0o644,
  }),
  Object.freeze({
    role: "current-javascript-product-qa-json",
    path: "reports/g4-l3-current-javascript-product-qa.json",
    bytes: 339_561,
    sha256:
      "6cd1c9f50f72ec18386a7cc233f9105dd9ba363635c0346d10b2b5f0bb9eeecc",
    mode: 0o644,
  }),
  Object.freeze({
    role: "current-javascript-product-qa-markdown",
    path: "reports/g4-l3-current-javascript-product-qa.md",
    bytes: 4_217,
    sha256:
      "5eac856010afa540626656e8c7df5bd746402731a0647b716aa3c0e38c63c0ec",
    mode: 0o644,
  }),
  Object.freeze({
    role: "source-static-workspace-bindings-json",
    path:
      "reports/g4-l3-source-static-current-javascript-workspace-bindings.json",
    bytes: 81_135,
    sha256:
      "15b0bf105d6354e88bf2f236db4b0417acf213fc5a8ad6df555ef4943af5dc40",
    mode: 0o644,
  }),
  Object.freeze({
    role: "source-static-workspace-bindings-markdown",
    path:
      "reports/g4-l3-source-static-current-javascript-workspace-bindings.md",
    bytes: 888,
    sha256:
      "1116d06d4e4703b5210042dbadb93e372b414fdf18d2baaca5e53835c1e45b93",
    mode: 0o644,
  }),
  Object.freeze({
    role: "m2-source-audit-readiness-json",
    path: "reports/g4-l3-m2-source-audit-readiness.json",
    bytes: 242_822,
    sha256:
      "fb9695df4657b5f4af3de2f894875bc8a40fc44ce27e3c9bb2558695be844a40",
    mode: 0o644,
  }),
  Object.freeze({
    role: "m2-source-audit-readiness-markdown",
    path: "reports/g4-l3-m2-source-audit-readiness.md",
    bytes: 12_625,
    sha256:
      "c82e2415bef0eb02d43a29e82d88aeedaad5e9d595a54cb22c84cc63e15f68ac",
    mode: 0o644,
  }),
  Object.freeze({
    role: "lesson-product-navigation-contract-json",
    path: "reports/g4-l3-lesson-product-navigation-contract.json",
    bytes: 285_364,
    sha256:
      "f5f12bfeca6247ff228a90254a85958fcd6ec6ba8355095771024051b0ee802c",
    mode: 0o644,
  }),
  Object.freeze({
    role: "lesson-product-navigation-contract-markdown",
    path: "reports/g4-l3-lesson-product-navigation-contract.md",
    bytes: 14_549,
    sha256:
      "2ea5b92278713a74f2513622d0f02b7b160a85ed159d30c47676746cb5bbfd35",
    mode: 0o644,
  }),
]);

const ALLOWED_REFRESHED_OLD_PINS = Object.freeze(new Set([
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
]));

const AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  derivedRefreshBindingOnly: true,
  currentJavaScriptCandidateOnly: true,
  upstreamWave2bRewritten: false,
  sourceSpecsRewritten: false,
  protectedPinsRewritten: false,
  originalRuntimeAuthorityCreated: false,
  authoritativeRuntimeTraceCreated: false,
  visualParityOrRmseCreated: false,
  audioAcceptanceCreated: false,
  independentHumanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  completionLedgerWriteAuthorized: false,
  lessonReleaseWriteAuthorized: false,
  publicReleaseAuthorized: false,
  productRouteWriteAuthorized: false,
  sourceAssetWriteAuthorized: false,
  strictAcceptanceEffect: "none",
  releaseEffect: "none",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRequiredFilesystemPrimitives() {
  invariant(
    Number.isInteger(fsConstants.O_NOFOLLOW) &&
      Number.isInteger(fsConstants.O_EXCL),
    "O_NOFOLLOW/O_EXCL unavailable; successor publication fails closed",
  );
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function withFingerprint(value, field) {
  const result = structuredClone(value);
  delete result[field];
  result[field] = sha256(Buffer.from(stableJson(result)));
  return result;
}

function validateFingerprint(value, field, label) {
  invariant(/^[a-f0-9]{64}$/u.test(value?.[field] ?? ""),
    `${label} fingerprint is missing`);
  const expected = structuredClone(value);
  delete expected[field];
  invariant(value[field] === sha256(Buffer.from(stableJson(expected))),
    `${label} fingerprint is stale`);
}

function assertRelativePath(relativePath) {
  invariant(typeof relativePath === "string" &&
    relativePath.length > 0 &&
    !path.isAbsolute(relativePath) &&
    !relativePath.includes("\\") &&
    !relativePath.split("/").includes("..") &&
    path.posix.normalize(relativePath) === relativePath,
  `unsafe project-relative path: ${relativePath}`);
}

async function assertProjectRoot(root) {
  const absolute = path.resolve(root);
  const metadata = await lstat(absolute);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
    "project root must be a real directory");
  invariant(await realpath(absolute) === absolute,
    "project root path must be canonical");
  return absolute;
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  if (relativeDirectory === ".") return;
  assertRelativePath(relativeDirectory);
  const rootReal = await assertProjectRoot(root);
  let cursor = rootReal;
  for (const segment of relativeDirectory.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
      `unsafe directory component: ${path.relative(rootReal, cursor)}`);
    invariant(await realpath(cursor) === cursor,
      `directory escaped project root: ${path.relative(rootReal, cursor)}`);
  }
}

function contentBinding(file) {
  return {
    path: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
    mode: file.mode,
  };
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256 &&
    (right?.mode === undefined || left?.mode === right.mode);
}

function sameBindingList(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((entry, index) => sameBinding(entry, right[index]));
}

function identityView(file) {
  return {
    path: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
    mode: file.mode,
    nlink: file.nlink,
    dev: file.dev,
    ino: file.ino,
    mtimeMs: file.mtimeMs,
    ctimeMs: file.ctimeMs,
  };
}

async function secureRead(root, relativePath, {
  expected = null,
  requireMode = null,
  allowedNlinks = [1],
} = {}) {
  assertRequiredFilesystemPrimitives();
  assertRelativePath(relativePath);
  const rootReal = await assertProjectRoot(root);
  const parent = path.posix.dirname(relativePath);
  await assertRealDirectoryChain(rootReal, parent);
  const absolute = path.join(rootReal, ...relativePath.split("/"));
  const before = await lstat(absolute);
  invariant(before.isFile() && !before.isSymbolicLink() &&
    allowedNlinks.includes(before.nlink),
  `unsafe regular file/link count: ${relativePath}`);
  if (requireMode !== null) {
    invariant((before.mode & 0o777) === requireMode,
      `unexpected file mode for ${relativePath}`);
  }
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat();
    invariant(opened.isFile() &&
      opened.dev === before.dev &&
      opened.ino === before.ino &&
      allowedNlinks.includes(opened.nlink),
    `file identity changed while opening: ${relativePath}`);
    const contents = await handle.readFile();
    const after = await lstat(absolute);
    invariant(after.isFile() &&
      !after.isSymbolicLink() &&
      after.dev === opened.dev &&
      after.ino === opened.ino &&
      after.size === opened.size &&
      after.mtimeMs === opened.mtimeMs &&
      after.ctimeMs === opened.ctimeMs &&
      allowedNlinks.includes(after.nlink),
    `file identity changed while reading: ${relativePath}`);
    const result = {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256(contents),
      mode: after.mode & 0o777,
      nlink: after.nlink,
      dev: String(after.dev),
      ino: String(after.ino),
      mtimeMs: String(after.mtimeMs),
      ctimeMs: String(after.ctimeMs),
      contents,
    };
    if (expected) {
      invariant(sameBinding(result, expected),
        `exact binding drifted: ${relativePath}`);
    }
    return result;
  } finally {
    await handle.close();
  }
}

function parseJson(file, label) {
  try {
    return JSON.parse(file.contents.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

async function pathExists(root, relativePath) {
  assertRelativePath(relativePath);
  try {
    await lstat(path.join(root, ...relativePath.split("/")));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function scanWave2bTransactionTree(root) {
  const rootReal = await assertProjectRoot(root);
  await assertRealDirectoryChain(rootReal, EXPECTED_WAVE2B.transactionTree.root);
  const files = [];
  const directories = [];
  const identities = [];

  async function visit(relativeDirectory) {
    const entries = await readdir(
      path.join(rootReal, ...relativeDirectory.split("/")),
      {withFileTypes: true},
    );
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      const absolute = path.join(rootReal, ...relativePath.split("/"));
      const metadata = await lstat(absolute);
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        invariant((metadata.mode & 0o777) === 0o700,
          `Wave2B transaction directory mode drifted: ${relativePath}`);
        invariant(await realpath(absolute) === absolute,
          `Wave2B transaction directory escaped root: ${relativePath}`);
        directories.push({path: relativePath, mode: 0o700});
        await visit(relativePath);
        continue;
      }
      invariant(entry.isFile() && !entry.isSymbolicLink(),
        `unsafe Wave2B transaction tree entry: ${relativePath}`);
      const file = await secureRead(rootReal, relativePath, {
        requireMode: 0o444,
      });
      files.push(contentBinding(file));
      identities.push(identityView(file));
    }
  }

  await visit(EXPECTED_WAVE2B.transactionTree.root);
  const manifest = {
    root: EXPECTED_WAVE2B.transactionTree.root,
    files,
    directories,
  };
  const result = {
    root: manifest.root,
    fileCount: files.length,
    directoryCount: directories.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    manifestSha256: sha256(Buffer.from(stableJson(manifest))),
  };
  invariant(JSON.stringify(result) ===
    JSON.stringify(EXPECTED_WAVE2B.transactionTree),
  "immutable Wave2B transaction tree drifted");
  return {
    summary: result,
    identityFingerprintSha256:
      sha256(Buffer.from(stableJson({identities, directories}))),
  };
}

function validateWave2bJournal(journalFile, preparedReceiptFile) {
  invariant(journalFile.contents.length > 0 &&
    journalFile.contents.at(-1) === 0x0a,
  "Wave2B frozen journal is torn");
  const lines = journalFile.contents.toString("utf8").trimEnd().split("\n");
  let previousRecordSha256 = null;
  const verifiedMembers = [];
  let terminalRecord = null;
  for (let index = 0; index < lines.length; index += 1) {
    const record = JSON.parse(lines[index]);
    validateFingerprint(
      record,
      "recordFingerprintSha256",
      `Wave2B journal record ${index + 1}`,
    );
    invariant(record.transactionId === WAVE2B_TRANSACTION_ID &&
      record.sequence === index + 1 &&
      record.previousRecordSha256 === previousRecordSha256,
    "Wave2B frozen journal chain drifted");
    previousRecordSha256 = sha256(Buffer.from(`${lines[index]}\n`));
    if (record.event === "final-verify-state-validated") {
      verifiedMembers.push(record.data?.id);
    }
    terminalRecord = record;
  }
  invariant(lines.length === 344 &&
    verifiedMembers.length === EXPECTED_MEMBER_COUNT &&
    new Set(verifiedMembers).size === EXPECTED_MEMBER_COUNT &&
    terminalRecord?.event ===
      "prepared-receipt-and-final-state-verified" &&
    sameBinding(
      terminalRecord.data?.preparedReceipt,
      contentBinding(preparedReceiptFile),
    ) &&
    terminalRecord.data?.memberCount === EXPECTED_MEMBER_COUNT &&
    terminalRecord.data?.strictAcceptanceEffect === "none" &&
    terminalRecord.data?.releaseEffect === "none",
  "Wave2B frozen journal terminal semantics drifted");
  return {
    recordCount: lines.length,
    terminalRecordFingerprintSha256:
      terminalRecord.recordFingerprintSha256,
  };
}

function validateWave2bAuthority(boundary, label) {
  invariant(boundary?.acceptanceNeutral === true &&
    boundary?.specBindingOnly === true &&
    boundary?.originalRuntimeAuthorityCreated === false &&
    boundary?.audioAcceptanceCreated === false &&
    boundary?.visualParityOrRmseCreated === false &&
    boundary?.independentHumanReviewCreated === false &&
    boundary?.ownerAcceptanceCreated === false &&
    boundary?.strictCompletionCreated === false &&
    boundary?.strictAcceptanceEffect === "none" &&
    boundary?.releaseEffect === "none",
  `${label} authority boundary drifted`);
}

async function collectWave2bUpstream(root) {
  const [
    receiptFile,
    planFile,
    preparedReceiptFile,
    commitFile,
    journalFile,
    transactionTree,
  ] = await Promise.all([
    secureRead(root, EXPECTED_WAVE2B.receipt.path, {
      expected: EXPECTED_WAVE2B.receipt,
      requireMode: 0o444,
    }),
    secureRead(root, EXPECTED_WAVE2B.plan.path, {
      expected: EXPECTED_WAVE2B.plan,
      requireMode: 0o444,
    }),
    secureRead(root, EXPECTED_WAVE2B.preparedReceipt.path, {
      expected: EXPECTED_WAVE2B.preparedReceipt,
      requireMode: 0o444,
    }),
    secureRead(root, EXPECTED_WAVE2B.commit.path, {
      expected: EXPECTED_WAVE2B.commit,
      requireMode: 0o444,
    }),
    secureRead(root, EXPECTED_WAVE2B.journal.path, {
      expected: EXPECTED_WAVE2B.journal,
      requireMode: 0o444,
    }),
    scanWave2bTransactionTree(root),
  ]);
  const receipt = parseJson(receiptFile, "canonical Wave2B receipt");
  const plan = parseJson(planFile, "Wave2B plan");
  const preparedReceipt =
    parseJson(preparedReceiptFile, "Wave2B prepared receipt");
  const commit = parseJson(commitFile, "Wave2B commit");
  validateFingerprint(
    receipt,
    "receiptFingerprintSha256",
    "canonical Wave2B receipt",
  );
  validateFingerprint(plan, "planFingerprintSha256", "Wave2B plan");
  validateFingerprint(
    preparedReceipt,
    "receiptFingerprintSha256",
    "Wave2B prepared receipt",
  );
  validateFingerprint(commit, "commitFingerprintSha256", "Wave2B commit");

  invariant(receipt.schemaVersion === 1 &&
    receipt.receiptType ===
      "g4-l3-source-static-source-audit-wave2b-security-closure-receipt" &&
    receipt.transactionId === WAVE2B_TRANSACTION_ID &&
    receipt.status ===
      "verified-acceptance-neutral-spec-security-binding-only" &&
    receipt.scope?.memberCount === EXPECTED_MEMBER_COUNT &&
    receipt.scope?.specsReachedCasState === "S6_VERIFIED" &&
    receipt.scope?.strictCompleteMembersCreated === 0 &&
    receipt.scope?.releaseMembersPublished === 0 &&
    receipt.authorityBoundary?.strictAcceptanceEffect === "none" &&
    receipt.authorityBoundary?.releaseEffect === "none",
  "canonical Wave2B receipt semantics drifted");
  invariant(plan.schemaVersion === 1 &&
    plan.planType ===
      "g4-l3-source-static-wave2b-security-closure-plan" &&
    plan.transactionId === WAVE2B_TRANSACTION_ID &&
    plan.memberCount === EXPECTED_MEMBER_COUNT &&
    plan.receiptPath === EXPECTED_WAVE2B.receipt.path &&
    plan.items?.length === EXPECTED_MEMBER_COUNT,
  "Wave2B plan semantics drifted");
  invariant(preparedReceipt.transactionId === WAVE2B_TRANSACTION_ID &&
    preparedReceipt.items?.length === EXPECTED_MEMBER_COUNT,
  "Wave2B prepared receipt semantics drifted");
  invariant(commit.schemaVersion === 1 &&
    commit.commitType ===
      "g4-l3-source-static-wave2b-security-closure-prepared-commit" &&
    commit.transactionId === WAVE2B_TRANSACTION_ID &&
    commit.memberCount === EXPECTED_MEMBER_COUNT &&
    commit.specCasFinalState === "S6_VERIFIED" &&
    commit.strictAcceptanceEffect === "none" &&
    commit.releaseEffect === "none" &&
    commit.orderedSpecFinalIdentities?.length === EXPECTED_MEMBER_COUNT,
  "Wave2B commit semantics drifted");
  validateWave2bAuthority(receipt.authorityBoundary, "Wave2B receipt");
  validateWave2bAuthority(plan.authorityBoundary, "Wave2B plan");
  validateWave2bAuthority(commit.authorityBoundary, "Wave2B commit");

  invariant(sameBinding(
    receipt.immutableEvidence?.plan,
    contentBinding(planFile),
  ) && sameBinding(
    receipt.publicationSeal?.preparedReceipt,
    contentBinding(preparedReceiptFile),
  ) && sameBinding(
    receipt.publicationSeal?.preparedCommit,
    contentBinding(commitFile),
  ) && sameBinding(commit.plan, contentBinding(planFile)) &&
    sameBinding(commit.preparedReceipt, contentBinding(preparedReceiptFile)) &&
    sameBinding(commit.frozenApplyJournal, contentBinding(journalFile)) &&
    commit.canonicalReceiptPath === EXPECTED_WAVE2B.receipt.path,
  "Wave2B receipt/plan/commit/journal binding drifted");

  const preparedBody = structuredClone(preparedReceipt);
  const canonicalBody = structuredClone(receipt);
  delete preparedBody.receiptFingerprintSha256;
  delete canonicalBody.receiptFingerprintSha256;
  delete canonicalBody.publicationSeal;
  invariant(stableJson(preparedBody) === stableJson(canonicalBody),
    "Wave2B canonical receipt is not the sealed prepared receipt");

  invariant(Array.isArray(receipt.protectedPins) &&
    receipt.protectedPins.length === 10 &&
    sameBindingList(
      receipt.protectedPins,
      plan.lockInIdentitySnapshot?.protectedPins,
    ),
  "Wave2B old protected-pin set drifted");

  const sourceSpecs = [];
  const sourceSpecIdentities = [];
  for (let index = 0; index < EXPECTED_MEMBER_COUNT; index += 1) {
    const receiptItem = receipt.items[index];
    const planItem = plan.items[index];
    const commitIdentity = commit.orderedSpecFinalIdentities[index];
    invariant(receiptItem.animationId === planItem.animationId &&
      receiptItem.animationId === commitIdentity.path
        .split("/")[1] &&
      sameBinding(receiptItem.spec?.postimage, planItem.specPostimage) &&
      sameBinding(receiptItem.spec?.finalIdentity, {
        ...planItem.specPostimage,
        mode: 0o644,
      }) &&
      sameBinding(commitIdentity, receiptItem.spec.finalIdentity),
    `${receiptItem.animationId}: Wave2B final spec binding drifted`);
    const specFile = await secureRead(root, planItem.specPostimage.path, {
      expected: {...planItem.specPostimage, mode: 0o644},
      requireMode: 0o644,
    });
    const spec = parseJson(specFile, `${receiptItem.animationId} source spec`);
    invariant(spec.animationId === receiptItem.animationId &&
      Array.isArray(spec.integrationBindings) &&
      spec.integrationBindings.filter((value) =>
        value === EXPECTED_WAVE2B.receipt.path).length === 1,
    `${receiptItem.animationId}: protected source spec semantics drifted`);
    sourceSpecs.push({
      animationId: receiptItem.animationId,
      binding: contentBinding(specFile),
    });
    sourceSpecIdentities.push(identityView(specFile));
  }

  const journal = validateWave2bJournal(journalFile, preparedReceiptFile);
  return {
    receipt,
    plan,
    bindings: {
      receipt: contentBinding(receiptFile),
      plan: contentBinding(planFile),
      preparedReceipt: contentBinding(preparedReceiptFile),
      commit: contentBinding(commitFile),
      journal: contentBinding(journalFile),
    },
    fingerprints: {
      receiptFingerprintSha256: receipt.receiptFingerprintSha256,
      planFingerprintSha256: plan.planFingerprintSha256,
      preparedReceiptFingerprintSha256:
        preparedReceipt.receiptFingerprintSha256,
      commitFingerprintSha256: commit.commitFingerprintSha256,
      ...journal,
    },
    transactionTree: transactionTree.summary,
    transactionTreeIdentityFingerprintSha256:
      transactionTree.identityFingerprintSha256,
    sourceSpecs,
    sourceSpecIdentityFingerprintSha256:
      sha256(Buffer.from(stableJson(sourceSpecIdentities))),
  };
}

function requireFalse(value, label) {
  invariant(value === false, `${label} must remain false`);
}

export function validateDerivedRefreshSemanticState(artifactsByPath) {
  const readJson = (relativePath) => {
    const file = artifactsByPath.get(relativePath);
    invariant(file, `missing derived-refresh artifact: ${relativePath}`);
    return parseJson(file, relativePath);
  };
  const completion = readJson("catalog/completion-ledger.json");
  const releaseLedger = readJson("catalog/lesson-release-ledger.json");
  const progress =
    readJson("reports/g4-l3-current-javascript-progress.json");
  const productQa =
    readJson("reports/g4-l3-current-javascript-product-qa.json");
  const workspace = readJson(
    "reports/g4-l3-source-static-current-javascript-workspace-bindings.json",
  );
  const m2 = readJson("reports/g4-l3-m2-source-audit-readiness.json");
  const productContract =
    readJson("reports/g4-l3-lesson-product-navigation-contract.json");
  const release = releaseLedger.releases?.find((entry) =>
    entry.releaseId === G4_L3_RELEASE_ID);

  invariant(completion.schemaVersion === 1 &&
    completion.summary?.declaredComplete === 0 &&
    completion.summary?.strictComplete === 0 &&
    completion.summary?.strictFailed ===
      completion.summary?.migrationDirectories,
  "completion ledger no longer proves strict zero");
  invariant(releaseLedger.schemaVersion === 1 &&
    releaseLedger.summary?.publishedReleaseCount === 0 &&
    releaseLedger.summary?.strictCompleteMemberCount === 0 &&
    release?.expectedMemberCount === 40 &&
    release?.strictCompleteCount === 0 &&
    release?.missingCount === 40 &&
    release?.published === false &&
    release?.status === "unpublished" &&
    release?.gate?.open === false &&
    release?.gate?.admittedCount === 0,
  "lesson release ledger no longer proves G4 L3 unpublished strict zero");
  invariant(progress.schemaVersion === 1 &&
    progress.reportType ===
      "g4-l3-current-javascript-progress-acceptance-neutral" &&
    progress.summary?.activePages === 39 &&
    progress.summary?.currentJavaScriptModules === 39 &&
    progress.summary?.strictCompletePages === 0 &&
    progress.acceptance?.acceptanceNeutral === true &&
    progress.acceptance?.strictAcceptanceEffect === "none",
  "current-JavaScript progress boundary drifted");
  requireFalse(
    progress.acceptance?.strictMigrationComplete,
    "current-JavaScript strict migration",
  );
  requireFalse(
    progress.acceptance?.lessonComplete,
    "current-JavaScript lesson completion",
  );
  invariant(productQa.schemaVersion === 1 &&
    productQa.reportType ===
      "g4-l3-current-javascript-lesson-product-qa" &&
    productQa.summary?.status ===
      "pass-current-javascript-product-layer" &&
    productQa.summary?.activePages === 39 &&
    productQa.acceptance?.acceptanceNeutral === true,
  "current-JavaScript product QA boundary drifted");
  requireFalse(
    productQa.acceptance?.strictMigrationComplete,
    "product QA strict migration",
  );
  requireFalse(
    productQa.acceptance?.lessonComplete,
    "product QA lesson completion",
  );
  invariant(workspace.schemaVersion === 1 &&
    workspace.reportType ===
      "g4-l3-source-static-current-javascript-workspace-bindings" &&
    workspace.summary?.strictCompletions === 0 &&
    workspace.summary?.authoritativeRuntimeSessions === 0 &&
    workspace.summary?.authoritativeBaselines === 0,
  "workspace binding strict-zero boundary drifted");
  requireFalse(
    workspace.acceptance?.strictMigrationComplete,
    "workspace strict migration",
  );
  requireFalse(
    workspace.acceptance?.publicRelease,
    "workspace public release",
  );
  invariant(m2.schemaVersion === 2 &&
    m2.reportType === "g4-l3-m2-source-audit-readiness" &&
    m2.scope?.canonicalMembers === 40 &&
    m2.summary?.strictCompleteMembers === 0 &&
    m2.summary?.implementationAuthorizedMembers === 0 &&
    m2.summary?.authoritativeRuntimeCompleteMembers === 0 &&
    m2.summary?.finalSpecificationReadyMembers === 0 &&
    m2.acceptance?.acceptanceNeutral === true &&
    m2.authorityBoundary?.strictAcceptanceEffect === false,
  "M2 strict-zero authority boundary drifted");
  requireFalse(
    m2.acceptance?.strictMigrationComplete,
    "M2 strict migration",
  );
  invariant(productContract.schemaVersion === 1 &&
    productContract.reportType ===
      "g4-l3-full-lesson-product-navigation-contract" &&
    productContract.summary?.activePages === 39 &&
    productContract.summary?.currentStrictModules === 0 &&
    productContract.summary?.strictCompletePages === 0 &&
    productContract.summary?.strictCompleteShells === 0 &&
    productContract.acceptance?.acceptanceNeutral === true,
  "lesson product contract strict-zero boundary drifted");
  requireFalse(
    productContract.acceptance?.strictProductAccepted,
    "lesson strict product acceptance",
  );
  requireFalse(
    productContract.acceptance?.lessonComplete,
    "lesson product completion",
  );

  return {
    completionLedger: {
      migrationDirectories: completion.summary.migrationDirectories,
      declaredComplete: 0,
      strictComplete: 0,
      strictFailed: completion.summary.strictFailed,
    },
    lessonReleaseLedger: {
      publishedReleaseCount: 0,
      strictCompleteMemberCount: 0,
      releaseId: G4_L3_RELEASE_ID,
      expectedMemberCount: 40,
      strictCompleteCount: 0,
      missingCount: 40,
      published: false,
      status: "unpublished",
      gateOpen: false,
    },
    currentJavascript: {
      activePages: 39,
      currentJavaScriptModules: 39,
      strictCompletePages: 0,
      strictMigrationComplete: false,
      lessonComplete: false,
    },
    productQa: {
      status: "pass-current-javascript-product-layer",
      acceptanceNeutral: true,
      strictMigrationComplete: false,
      lessonComplete: false,
    },
    workspaceBindings: {
      strictCompletions: 0,
      authoritativeRuntimeSessions: 0,
      authoritativeBaselines: 0,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    m2Readiness: {
      canonicalMembers: 40,
      strictCompleteMembers: 0,
      implementationAuthorizedMembers: 0,
      authoritativeRuntimeCompleteMembers: 0,
      finalSpecificationReadyMembers: 0,
      strictMigrationComplete: false,
    },
    lessonProductContract: {
      activePages: 39,
      currentStrictModules: 0,
      strictCompletePages: 0,
      strictCompleteShells: 0,
      strictProductAccepted: false,
      lessonComplete: false,
    },
  };
}

async function collectDerivedRefreshArtifacts(root) {
  const files = await Promise.all(
    EXPECTED_DERIVED_REFRESH_BINDINGS.map(async (expected) => ({
      role: expected.role,
      file: await secureRead(root, expected.path, {
        expected,
        requireMode: expected.mode,
      }),
    })),
  );
  const artifactsByPath = new Map(
    files.map(({file}) => [file.path, file]),
  );
  return {
    bindings: files.map(({role, file}) => ({
      role,
      ...contentBinding(file),
    })),
    semantics: validateDerivedRefreshSemanticState(artifactsByPath),
    identityFingerprintSha256: sha256(Buffer.from(stableJson(
      files.map(({file}) => identityView(file)),
    ))),
    filesByPath: artifactsByPath,
  };
}

async function collectProtectedPinTransitions(
  root,
  oldProtectedPins,
  derivedArtifacts,
) {
  const transitions = [];
  const identities = [];
  const seen = new Set();
  for (const prior of oldProtectedPins) {
    invariant(!seen.has(prior.path), "duplicate old protected pin");
    seen.add(prior.path);
    const current = await secureRead(root, prior.path, {
      requireMode: prior.mode,
    });
    const allowedRefresh = ALLOWED_REFRESHED_OLD_PINS.has(prior.path);
    if (allowedRefresh) {
      const expected = EXPECTED_DERIVED_REFRESH_BINDINGS.find((binding) =>
        binding.path === prior.path);
      invariant(expected && sameBinding(current, expected),
        `allowed derived-refresh pin is not the reviewed successor: ${prior.path}`);
      invariant(!sameBinding(current, prior),
        `expected derived-refresh pin did not change: ${prior.path}`);
    } else {
      invariant(sameBinding(current, prior),
        `unexpected old protected-pin drift: ${prior.path}`);
    }
    const derivedCopy = derivedArtifacts.filesByPath.get(prior.path);
    if (derivedCopy) {
      invariant(sameBinding(current, derivedCopy),
        `derived artifact/pin identity split: ${prior.path}`);
    }
    transitions.push({
      path: prior.path,
      prior: structuredClone(prior),
      current: contentBinding(current),
      disposition: allowedRefresh
        ? "intentional-derived-refresh-strict-zero-unpublished"
        : "unchanged",
    });
    identities.push(identityView(current));
  }
  invariant(transitions.filter((entry) =>
    entry.disposition ===
      "intentional-derived-refresh-strict-zero-unpublished").length === 2,
  "derived-refresh protected-pin transition count drifted");
  return {
    transitions,
    identityFingerprintSha256:
      sha256(Buffer.from(stableJson(identities))),
  };
}

async function collectState(root) {
  const projectRoot = await assertProjectRoot(root);
  const [
    upstream,
    generatedBy,
    publicationSecurityDependency,
    derivedArtifacts,
  ] = await Promise.all([
    collectWave2bUpstream(projectRoot),
    secureRead(projectRoot, WAVE2B_DERIVED_REFRESH_PATHS.script, {
      requireMode: 0o644,
    }),
    secureRead(
      projectRoot,
      EXPECTED_PUBLICATION_SECURITY_DEPENDENCY.path,
      {
        expected: EXPECTED_PUBLICATION_SECURITY_DEPENDENCY,
        requireMode: 0o644,
      },
    ),
    collectDerivedRefreshArtifacts(projectRoot),
  ]);
  const protectedPins = await collectProtectedPinTransitions(
    projectRoot,
    upstream.receipt.protectedPins,
    derivedArtifacts,
  );
  const stable = {
    generatedBy: contentBinding(generatedBy),
    publicationSecurityDependencies: [
      contentBinding(publicationSecurityDependency),
    ],
    upstreamBindings: upstream.bindings,
    upstreamFingerprints: upstream.fingerprints,
    transactionTree: upstream.transactionTree,
    sourceSpecs: upstream.sourceSpecs,
    oldProtectedPins: upstream.receipt.protectedPins,
    protectedPinTransitions: protectedPins.transitions,
    derivedRefreshArtifacts: derivedArtifacts.bindings,
    semanticState: derivedArtifacts.semantics,
  };
  const volatileIdentityFingerprintSha256 = sha256(Buffer.from(stableJson({
    generatedBy: identityView(generatedBy),
    publicationSecurityDependencies: [
      identityView(publicationSecurityDependency),
    ],
    transactionTree:
      upstream.transactionTreeIdentityFingerprintSha256,
    sourceSpecs: upstream.sourceSpecIdentityFingerprintSha256,
    derivedRefreshArtifacts:
      derivedArtifacts.identityFingerprintSha256,
    protectedPins: protectedPins.identityFingerprintSha256,
  })));
  return {
    projectRoot,
    ...stable,
    volatileIdentityFingerprintSha256,
  };
}

function buildReceipt(state) {
  const derivation = {
    upstreamTransactionId: WAVE2B_TRANSACTION_ID,
    upstreamBindings: state.upstreamBindings,
    transactionTree: state.transactionTree,
    sourceSpecs: state.sourceSpecs,
    oldProtectedPins: state.oldProtectedPins,
    protectedPinTransitions: state.protectedPinTransitions,
    derivedRefreshArtifacts: state.derivedRefreshArtifacts,
    semanticState: state.semanticState,
  };
  const receipt = {
    schemaVersion: 1,
    receiptType:
      "g4-l3-source-static-wave2b-derived-refresh-successor-receipt",
    receiptId:
      "g4-l3-source-static-wave2b-derived-refresh-2026-07-27-v1",
    status:
      "verified-acceptance-neutral-derived-refresh-binding-only",
    upstreamTransactionId: WAVE2B_TRANSACTION_ID,
    generatedBy: state.generatedBy,
    publicationSecurityDependencies:
      structuredClone(state.publicationSecurityDependencies),
    derivationSetSha256: sha256(Buffer.from(stableJson(derivation))),
    immutableWave2b: {
      ...state.upstreamBindings,
      ...state.upstreamFingerprints,
      transactionTree: state.transactionTree,
      oldProtectedPins: structuredClone(state.oldProtectedPins),
      sourceSpecFinals: structuredClone(state.sourceSpecs),
    },
    protectedPinTransitions:
      structuredClone(state.protectedPinTransitions),
    derivedRefreshArtifacts:
      structuredClone(state.derivedRefreshArtifacts),
    semanticState: structuredClone(state.semanticState),
    preservation: {
      oldCanonicalReceiptModified: false,
      oldTransactionWorkModified: false,
      protectedSourceSpecsModified: false,
      oldProtectedPinsModifiedByThisWriter: false,
      allowedHistoricalToCurrentPinTransitions: 2,
      unexpectedOldProtectedPinDrift: 0,
      canonicalSuccessorWriteCount: 1,
      canonicalSuccessorWriteMode:
        "durable-journaled-atomic-no-replace",
      defaultMode: "dry-run",
    },
    publicationTransaction: {
      plan: "immutable-before-temp",
      journal: "fsync-hash-chain-before-and-after-each-transition",
      ownership:
        "nonce-plus-lock-owner-and-temp-target-dev-ino-sha256",
      commitPoint: "durable-committed-journal-record",
      preCommitInputDrift:
        "rollback-only-exact-owned-target-and-temp-then-fail",
      crashRecovery:
        "dead-owner-adoption-completes-or-rolls-back-exact-owned-state",
      foreignStateDisposition: "preserve-and-fail-closed",
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    limitations: [
      "This successor preserves an immutable Wave2B transaction-time proof while binding a reviewed downstream derived refresh.",
      "Current-JavaScript and product-QA success does not create original-runtime, visual, audio, human, owner, strict-completion, or release authority.",
      "Completion remains strict zero and the G4 L3 atomic lesson release remains unpublished.",
      "Any later downstream refresh requires a new separately reviewed successor; this receipt is no-replace and immutable.",
    ],
  };
  return withFingerprint(receipt, "receiptFingerprintSha256");
}

async function syncDirectory(absoluteDirectory) {
  const handle = await open(absoluteDirectory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function projectAbsolute(root, relativePath) {
  assertRelativePath(relativePath);
  return path.join(root, ...relativePath.split("/"));
}

function durableIdentity(file) {
  return {
    path: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
    mode: file.mode,
    nlink: file.nlink,
    dev: file.dev,
    ino: file.ino,
  };
}

function sameOwnedInode(left, right) {
  return left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256 &&
    left?.mode === right?.mode &&
    left?.dev === right?.dev &&
    left?.ino === right?.ino;
}

async function inspectDirectory(root, relativePath, expected = null) {
  assertRelativePath(relativePath);
  const absolute = projectAbsolute(root, relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isDirectory() &&
    !metadata.isSymbolicLink() &&
    (metadata.mode & 0o777) === 0o700 &&
    await realpath(absolute) === absolute,
  `unsafe transaction directory: ${relativePath}`);
  const observed = {
    path: relativePath,
    mode: metadata.mode & 0o777,
    dev: String(metadata.dev),
    ino: String(metadata.ino),
  };
  if (expected) {
    invariant(stableJson(observed) === stableJson(expected),
      `transaction directory identity drifted: ${relativePath}`);
  }
  return observed;
}

async function createDirectoryNoReplace(root, relativePath) {
  assertRequiredFilesystemPrimitives();
  const parent = path.posix.dirname(relativePath);
  await assertRealDirectoryChain(root, parent);
  const absolute = projectAbsolute(root, relativePath);
  await mkdir(absolute, {recursive: false, mode: 0o700});
  await syncDirectory(path.dirname(absolute));
  return inspectDirectory(root, relativePath);
}

async function writeImmutableNoReplace(
  root,
  relativePath,
  bytes,
  mode = 0o444,
) {
  assertRequiredFilesystemPrimitives();
  invariant(Buffer.isBuffer(bytes), "immutable write requires bytes");
  await assertRealDirectoryChain(root, path.posix.dirname(relativePath));
  const absolute = projectAbsolute(root, relativePath);
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  let opened;
  try {
    opened = await handle.stat();
    invariant(opened.isFile() && opened.nlink === 1,
      `unsafe new immutable file: ${relativePath}`);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(absolute));
  const observed = await secureRead(root, relativePath, {
    expected: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode,
    },
    requireMode: mode,
  });
  invariant(observed.dev === String(opened.dev) &&
    observed.ino === String(opened.ino),
  `immutable file inode changed after close: ${relativePath}`);
  return observed;
}

function journalRecord(transactionId, sequence, previousRecordSha256, event,
  data) {
  return withFingerprint({
    schemaVersion: 1,
    journalType:
      "g4-l3-wave2b-derived-refresh-publication-journal-record",
    transactionId,
    sequence,
    previousRecordSha256,
    event,
    data,
  }, "recordFingerprintSha256");
}

async function readPublicationJournal(root, transactionId, {
  allowMissing = false,
} = {}) {
  if (!await pathExists(root, WAVE2B_DERIVED_REFRESH_PATHS.journal)) {
    invariant(allowMissing, "publication journal is missing");
    return {records: [], binding: null};
  }
  const modes = [0o600, 0o444];
  const absolute = projectAbsolute(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.journal,
  );
  const metadata = await lstat(absolute);
  invariant(modes.includes(metadata.mode & 0o777),
    "publication journal mode drifted");
  const file = await secureRead(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.journal,
    {requireMode: metadata.mode & 0o777},
  );
  invariant(file.contents.length > 0 &&
    file.contents.at(-1) === 0x0a,
  "publication journal is torn");
  const lines = file.contents.toString("utf8").trimEnd().split("\n");
  const records = [];
  let previousRecordSha256 = null;
  for (let index = 0; index < lines.length; index += 1) {
    let record;
    try {
      record = JSON.parse(lines[index]);
    } catch {
      throw new Error("publication journal has malformed JSON");
    }
    validateFingerprint(
      record,
      "recordFingerprintSha256",
      `publication journal record ${index + 1}`,
    );
    invariant(record.transactionId === transactionId &&
      record.sequence === index + 1 &&
      record.previousRecordSha256 === previousRecordSha256,
    "publication journal chain drifted");
    previousRecordSha256 = sha256(Buffer.from(`${lines[index]}\n`));
    records.push(record);
  }
  return {records, binding: file};
}

async function appendPublicationJournal(
  root,
  transactionId,
  event,
  data,
) {
  assertRequiredFilesystemPrimitives();
  const current = await readPublicationJournal(root, transactionId, {
    allowMissing: true,
  });
  if (current.binding) {
    invariant(current.binding.mode === 0o600,
      "committed/frozen publication journal cannot be appended");
  }
  const sequence = current.records.length + 1;
  const previousRecordSha256 = current.records.length === 0
    ? null
    : sha256(Buffer.from(
      `${JSON.stringify(current.records.at(-1))}\n`,
    ));
  const record = journalRecord(
    transactionId,
    sequence,
    previousRecordSha256,
    event,
    data,
  );
  const absolute = projectAbsolute(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.journal,
  );
  const before = current.binding;
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY |
      fsConstants.O_APPEND |
      fsConstants.O_CREAT |
      NOFOLLOW,
    0o600,
  );
  let opened;
  try {
    opened = await handle.stat();
    invariant(opened.isFile() &&
      opened.nlink === 1 &&
      (opened.mode & 0o777) === 0o600 &&
      (!before ||
        (String(opened.dev) === before.dev &&
          String(opened.ino) === before.ino)),
    "publication journal inode/mode changed while opening");
    await handle.writeFile(Buffer.from(`${JSON.stringify(record)}\n`));
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(absolute));
  const after = await readPublicationJournal(root, transactionId);
  invariant(after.records.length === sequence &&
    after.records.at(-1).recordFingerprintSha256 ===
      record.recordFingerprintSha256 &&
    after.binding.dev === String(opened.dev) &&
    after.binding.ino === String(opened.ino),
  "publication journal append was not durable");
  return after;
}

function publicationRecoveryItem(root, plan) {
  const receiptBytes = Buffer.from(plan.receiptBytesBase64, "base64");
  return {
    id: "wave2b-derived-refresh-successor-receipt",
    rootPath: root,
    targetPath: projectAbsolute(
      root,
      WAVE2B_DERIVED_REFRESH_PATHS.script,
    ),
    tempOwnershipPath: projectAbsolute(
      root,
      `${WAVE2B_DERIVED_REFRESH_PATHS.transaction}/lock-member-temp-owner`,
    ),
    tempPath: projectAbsolute(
      root,
      `${WAVE2B_DERIVED_REFRESH_PATHS.transaction}/lock-member-temp`,
    ),
    quarantinePath: projectAbsolute(
      root,
      `${WAVE2B_DERIVED_REFRESH_PATHS.transaction}/lock-member-quarantine`,
    ),
    postArchivePath: projectAbsolute(
      root,
      `${WAVE2B_DERIVED_REFRESH_PATHS.transaction}/lock-member-post-archive`,
    ),
    preimage: structuredClone(plan.lockGuardPreimage),
    postimage: {
      bytes: receiptBytes.length,
      sha256: sha256(receiptBytes),
    },
    postBytes: receiptBytes,
    originalMode: 0o644,
  };
}

function buildPublicationPlan({
  state,
  receiptBytes,
  transactionId,
  lock,
  workRoot,
  transaction,
}) {
  return withFingerprint({
    schemaVersion: 1,
    planType:
      "g4-l3-wave2b-derived-refresh-successor-publication-plan",
    transactionId,
    upstreamTransactionId: WAVE2B_TRANSACTION_ID,
    projectRoot: state.projectRoot,
    lockBinding: structuredClone(lock.persistedBinding),
    directories: {workRoot, transaction},
    inputVolatileIdentityFingerprintSha256:
      state.volatileIdentityFingerprintSha256,
    lockGuardPreimage: structuredClone(state.generatedBy),
    receipt: {
      path: WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      bytes: receiptBytes.length,
      sha256: sha256(receiptBytes),
      mode: 0o444,
    },
    receiptBytesBase64: receiptBytes.toString("base64"),
    authorityBoundary: AUTHORITY_BOUNDARY,
  }, "planFingerprintSha256");
}

function validatePublicationPlan(plan, root) {
  validateFingerprint(
    plan,
    "planFingerprintSha256",
    "successor publication plan",
  );
  invariant(plan.schemaVersion === 1 &&
    plan.planType ===
      "g4-l3-wave2b-derived-refresh-successor-publication-plan" &&
    /^[a-f0-9]{64}$/u.test(plan.transactionId ?? "") &&
    plan.upstreamTransactionId === WAVE2B_TRANSACTION_ID &&
    plan.projectRoot === root &&
    plan.receipt?.path === WAVE2B_DERIVED_REFRESH_PATHS.receipt &&
    plan.receipt?.mode === 0o444 &&
    plan.lockGuardPreimage?.path ===
      WAVE2B_DERIVED_REFRESH_PATHS.script &&
    Number.isSafeInteger(plan.lockGuardPreimage?.bytes) &&
    /^[a-f0-9]{64}$/u.test(plan.lockGuardPreimage?.sha256 ?? "") &&
    plan.lockGuardPreimage?.mode === 0o644 &&
    plan.authorityBoundary?.strictAcceptanceEffect === "none" &&
    plan.authorityBoundary?.releaseEffect === "none",
  "successor publication plan semantics drifted");
  const receiptBytes = Buffer.from(plan.receiptBytesBase64 ?? "", "base64");
  invariant(receiptBytes.toString("base64") === plan.receiptBytesBase64 &&
    receiptBytes.length === plan.receipt.bytes &&
    sha256(receiptBytes) === plan.receipt.sha256,
  "successor publication plan receipt bytes drifted");
  return receiptBytes;
}

async function readPublicationPlan(root) {
  const file = await secureRead(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.plan,
    {requireMode: 0o444},
  );
  const plan = parseJson(file, "successor publication plan");
  const receiptBytes = validatePublicationPlan(plan, root);
  await inspectDirectory(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
    plan.directories.workRoot,
  );
  await inspectDirectory(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.transaction,
    plan.directories.transaction,
  );
  return {file, plan, receiptBytes};
}

async function assertInputsMatchPlan(root, plan, receiptBytes) {
  const current = await collectState(root);
  const currentReceiptBytes = Buffer.from(stableJson(buildReceipt(current)));
  invariant(currentReceiptBytes.equals(receiptBytes),
    "transaction-time derived inputs changed");
  invariant(current.volatileIdentityFingerprintSha256 ===
    plan.inputVolatileIdentityFingerprintSha256,
  "transaction-time derived input identity changed");
  return current;
}

function eventData(records, event) {
  return [...records].reverse().find((record) =>
    record.event === event)?.data ?? null;
}

function processIsAlive(pid) {
  invariant(Number.isSafeInteger(pid) && pid > 0,
    "lock owner pid is invalid");
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

async function readArtifactIfPresent(root, relativePath, allowedNlinks) {
  if (!await pathExists(root, relativePath)) return null;
  return secureRead(root, relativePath, {
    requireMode: 0o444,
    allowedNlinks,
  });
}

async function unlinkExactOwned(root, relativePath, expected, {
  allowedNlinks = [1, 2],
} = {}) {
  if (!await pathExists(root, relativePath)) return false;
  const observed = await secureRead(root, relativePath, {
    requireMode: expected.mode,
    allowedNlinks,
  });
  invariant(sameOwnedInode(observed, expected),
    `foreign inode preserved during cleanup: ${relativePath}`);
  await unlink(projectAbsolute(root, relativePath));
  await syncDirectory(path.dirname(projectAbsolute(root, relativePath)));
  return true;
}

async function removeEmptyOwnedDirectory(root, relativePath, expected) {
  const observed = await inspectDirectory(root, relativePath, expected);
  const absolute = projectAbsolute(root, relativePath);
  const entries = await readdir(absolute);
  invariant(entries.length === 0,
    `foreign transaction entries preserved: ${relativePath}`);
  await rmdir(absolute);
  await syncDirectory(path.dirname(absolute));
  return observed;
}

async function ensureEmptyWorkRoot(root) {
  await assertRealDirectoryChain(root, "work");
  if (!await pathExists(root, WAVE2B_DERIVED_REFRESH_PATHS.workRoot)) {
    return createDirectoryNoReplace(
      root,
      WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
    );
  }
  const observed = await inspectDirectory(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
  );
  const entries = await readdir(projectAbsolute(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
  ));
  invariant(entries.length === 0,
    "successor work root contains unresolved or foreign state");
  return observed;
}

async function startPublicationTransaction(root) {
  assertRequiredFilesystemPrimitives();
  const projectRoot = await assertProjectRoot(root);
  const workRoot = await ensureEmptyWorkRoot(projectRoot);
  const transactionId = randomBytes(32).toString("hex");
  const lock = await acquireWave2bLock({
    rootPath: projectRoot,
    lockPath: projectAbsolute(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.lock,
    ),
    owner: {
      schemaVersion: 1,
      transactionId,
      actorKind: "software-process",
      processId: process.pid,
      hostname: hostname(),
      authority: "single-writer-exclusion-and-recovery-only",
      humanReviewerRoleClaimed: false,
      ownerAcceptanceRoleClaimed: false,
      strictAcceptanceAuthorityClaimed: false,
    },
  });
  let transaction = null;
  try {
    transaction = await createDirectoryNoReplace(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.transaction,
    );
    const state = await collectState(projectRoot);
    const receipt = buildReceipt(state);
    const receiptBytes = Buffer.from(stableJson(receipt));
    const plan = buildPublicationPlan({
      state,
      receiptBytes,
      transactionId,
      lock,
      workRoot,
      transaction,
    });
    const planBytes = Buffer.from(stableJson(plan));
    const planFile = await writeImmutableNoReplace(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.plan,
      planBytes,
    );
    await appendPublicationJournal(
      projectRoot,
      transactionId,
      "plan-durable",
      {
        plan: contentBinding(planFile),
        lockDescriptorSha256: lock.descriptorSha256,
        receipt: plan.receipt,
      },
    );
    const item = publicationRecoveryItem(projectRoot, plan);
    await assertWave2bLock(lock, [item]);
    await assertInputsMatchPlan(projectRoot, plan, receiptBytes);
    return {
      projectRoot,
      transactionId,
      lock,
      workRoot,
      transaction,
      plan,
      planFile,
      receipt,
      receiptBytes,
      item,
      initialState: state,
      recovery: false,
    };
  } catch (error) {
    let cleanupError = null;
    let safeToRelease = transaction === null;
    try {
      if (transaction) {
        const entries = await readdir(projectAbsolute(
          projectRoot,
          WAVE2B_DERIVED_REFRESH_PATHS.transaction,
        ));
        if (entries.length === 0) {
          await removeEmptyOwnedDirectory(
            projectRoot,
            WAVE2B_DERIVED_REFRESH_PATHS.transaction,
            transaction,
          );
          safeToRelease = true;
        }
      }
      if (safeToRelease) {
        await releaseWave2bLock(lock);
        const entries = await readdir(projectAbsolute(
          projectRoot,
          WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
        ));
        if (entries.length === 0) {
          await removeEmptyOwnedDirectory(
            projectRoot,
            WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
            workRoot,
          );
        }
      }
    } catch (cleanupFailure) {
      cleanupError = cleanupFailure;
    }
    if (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "successor transaction initialization failed with preserved residue",
      );
    }
    if (!safeToRelease) {
      throw new AggregateError(
        [error],
        "successor initialization left a durable lock for explicit restart recovery",
      );
    }
    throw error;
  }
}

async function adoptStalePublicationTransaction(root) {
  assertRequiredFilesystemPrimitives();
  const projectRoot = await assertProjectRoot(root);
  const {file: planFile, plan, receiptBytes} =
    await readPublicationPlan(projectRoot);
  const journal = await readPublicationJournal(
    projectRoot,
    plan.transactionId,
    {allowMissing: true},
  );
  const first = journal.records[0];
  if (first) {
    invariant(first.event === "plan-durable" &&
      sameBinding(first.data?.plan, contentBinding(planFile)) &&
      first.data?.lockDescriptorSha256 ===
        plan.lockBinding.descriptorSha256,
    "publication journal does not bind the immutable plan/lock");
  }
  const item = publicationRecoveryItem(projectRoot, plan);
  const lock = await adoptWave2bLockForRecovery({
    rootPath: projectRoot,
    lockPath: projectAbsolute(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.lock,
    ),
    items: [item],
    persistedBinding: plan.lockBinding,
    decideOwnerLiveness(subject) {
      invariant(subject.owner?.hostname === hostname(),
        "stale lock owner is on another host; automatic recovery denied");
      invariant(!processIsAlive(subject.owner?.processId),
        "successor publication lock owner is still alive");
      return "dead";
    },
    journal: (event) => appendPublicationJournal(
      projectRoot,
      plan.transactionId,
      event?.event ?? "lock-recovery-event",
      event,
    ),
  });
  const receipt = JSON.parse(receiptBytes);
  validateFingerprint(
    receipt,
    "receiptFingerprintSha256",
    "planned successor receipt",
  );
  return {
    projectRoot,
    transactionId: plan.transactionId,
    lock,
    workRoot: plan.directories.workRoot,
    transaction: plan.directories.transaction,
    plan,
    planFile,
    receipt,
    receiptBytes,
    item,
    initialState: null,
    recovery: true,
  };
}

async function verifyJournalPlanBinding(context) {
  let journal = await readPublicationJournal(
    context.projectRoot,
    context.transactionId,
    {allowMissing: true},
  );
  if (journal.records.length === 0) {
    journal = await appendPublicationJournal(
      context.projectRoot,
      context.transactionId,
      "plan-durable",
      {
        plan: contentBinding(context.planFile),
        lockDescriptorSha256:
          context.plan.lockBinding.descriptorSha256,
        receipt: context.plan.receipt,
      },
    );
  }
  const first = journal.records[0];
  invariant(first.event === "plan-durable" &&
    sameBinding(first.data?.plan, contentBinding(context.planFile)) &&
    first.data?.lockDescriptorSha256 ===
      context.plan.lockBinding.descriptorSha256 &&
    sameBinding(first.data?.receipt, context.plan.receipt),
  "publication journal plan binding drifted");
  return journal;
}

async function rollbackUncommittedPublication(context, cause) {
  const {
    projectRoot,
    transactionId,
    plan,
    planFile,
    lock,
  } = context;
  let cleanupError = null;
  try {
    let journal = await readPublicationJournal(
      projectRoot,
      transactionId,
      {allowMissing: true},
    );
    invariant(!journal.records.some((record) =>
      record.event === "committed"),
    "durably committed successor cannot be rolled back");
    const tempIdentity = eventData(journal.records, "temp-durable")?.identity;
    const target = await readArtifactIfPresent(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      [1, 2],
    );
    const temporary = await readArtifactIfPresent(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.temp,
      [1, 2],
    );
    const ownershipConflicts = [];
    if (target) {
      if (tempIdentity && sameOwnedInode(target, tempIdentity)) {
        await unlinkExactOwned(
          projectRoot,
          WAVE2B_DERIVED_REFRESH_PATHS.receipt,
          tempIdentity,
        );
      } else {
        ownershipConflicts.push(
          "foreign canonical successor target preserved during rollback",
        );
      }
    }
    if (temporary) {
      if (tempIdentity && sameOwnedInode(temporary, tempIdentity)) {
        await unlinkExactOwned(
          projectRoot,
          WAVE2B_DERIVED_REFRESH_PATHS.temp,
          tempIdentity,
        );
      } else {
        ownershipConflicts.push(
          "foreign successor temp preserved during rollback",
        );
      }
    }
    invariant(ownershipConflicts.length === 0,
      ownershipConflicts.join("; "));
    journal = await appendPublicationJournal(
      projectRoot,
      transactionId,
      "rolled-back",
      {
        cause: cause?.message ?? String(cause),
        canonicalRemoved: Boolean(target),
        temporaryRemoved: Boolean(temporary),
      },
    );
    await unlinkExactOwned(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.journal,
      durableIdentity(journal.binding),
      {allowedNlinks: [1]},
    );
    await unlinkExactOwned(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.plan,
      durableIdentity(planFile),
      {allowedNlinks: [1]},
    );
    await removeEmptyOwnedDirectory(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.transaction,
      plan.directories.transaction,
    );
    await releaseWave2bLock(lock);
    await removeEmptyOwnedDirectory(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
      plan.directories.workRoot,
    );
  } catch (error) {
    cleanupError = error;
  }
  if (cleanupError) {
    throw new AggregateError(
      [cause, cleanupError],
      "successor publication failed; foreign or uncertain state was preserved",
    );
  }
  throw cause;
}

async function finishPublicationTransaction(context, hooks = {}) {
  const {
    projectRoot,
    transactionId,
    plan,
    receipt,
    receiptBytes,
    lock,
    item,
  } = context;
  try {
    await assertWave2bLock(lock, [item], context.recovery
      ? {requireExactRecoveryPlan: true}
      : undefined);
    let journal = await verifyJournalPlanBinding(context);
    if (journal.records.some((record) => record.event === "committed")) {
      const target = await secureRead(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.receipt,
        {
          expected: plan.receipt,
          requireMode: 0o444,
          allowedNlinks: [1],
        },
      );
      invariant(!await pathExists(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.temp,
      ), "committed successor retains a temporary hard link");
      await releaseWave2bLock(lock);
      return {written: target, recovered: true};
    }

    let tempIdentity = eventData(journal.records, "temp-durable")?.identity;
    let temporary = await readArtifactIfPresent(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.temp,
      [1, 2],
    );
    let target = await readArtifactIfPresent(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      [1, 2],
    );
    if (tempIdentity) {
      if (temporary) {
        invariant(sameOwnedInode(temporary, tempIdentity),
          "successor temp inode/hash ownership drifted");
      }
      if (target) {
        invariant(sameOwnedInode(target, tempIdentity),
          "canonical successor inode/hash is foreign");
      }
    } else {
      invariant(!target,
        "canonical successor exists without a durable owned temp identity");
      invariant(!temporary,
        "successor temp exists without a durable owned identity");
    }

    if (!temporary && !target) {
      await appendPublicationJournal(
        projectRoot,
        transactionId,
        "temp-write-intent",
        {receipt: plan.receipt},
      );
      temporary = await writeImmutableNoReplace(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.temp,
        receiptBytes,
      );
      tempIdentity = durableIdentity(temporary);
      journal = await appendPublicationJournal(
        projectRoot,
        transactionId,
        "temp-durable",
        {identity: tempIdentity},
      );
      if (hooks.afterTempWrite) {
        await hooks.afterTempWrite(
          WAVE2B_DERIVED_REFRESH_PATHS.temp,
        );
      }
    }

    if (!target) {
      invariant(temporary && sameOwnedInode(temporary, tempIdentity) &&
        temporary.nlink === 1,
      "pre-link successor temp ownership drifted");
      await assertInputsMatchPlan(projectRoot, plan, receiptBytes);
      await appendPublicationJournal(
        projectRoot,
        transactionId,
        "prelink-inputs-verified",
        {
          inputVolatileIdentityFingerprintSha256:
            plan.inputVolatileIdentityFingerprintSha256,
        },
      );
      try {
        await link(
          projectAbsolute(projectRoot, WAVE2B_DERIVED_REFRESH_PATHS.temp),
          projectAbsolute(projectRoot, WAVE2B_DERIVED_REFRESH_PATHS.receipt),
        );
      } catch (error) {
        if (error.code === "EEXIST") {
          throw new Error(
            "no-replace canonical successor target already exists",
            {cause: error},
          );
        }
        throw error;
      }
      await syncDirectory(path.dirname(projectAbsolute(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      )));
      temporary = await secureRead(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.temp,
        {requireMode: 0o444, allowedNlinks: [2]},
      );
      target = await secureRead(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.receipt,
        {requireMode: 0o444, allowedNlinks: [2]},
      );
      invariant(sameOwnedInode(temporary, tempIdentity) &&
        sameOwnedInode(target, tempIdentity) &&
        temporary.dev === target.dev &&
        temporary.ino === target.ino,
      "linked successor target is not the exact owned temp inode");
      await appendPublicationJournal(
        projectRoot,
        transactionId,
        "target-linked",
        {
          identity: tempIdentity,
          linkCount: 2,
        },
      );
      if (hooks.afterLink) {
        await hooks.afterLink(WAVE2B_DERIVED_REFRESH_PATHS.receipt);
      }
      if (hooks.afterPublish) {
        await hooks.afterPublish(WAVE2B_DERIVED_REFRESH_PATHS.receipt);
      }
    } else if (temporary) {
      invariant(temporary.nlink === 2 &&
        target.nlink === 2 &&
        temporary.dev === target.dev &&
        temporary.ino === target.ino,
      "post-crash target/temp hard-link state is foreign");
    } else {
      invariant(target.nlink === 1 &&
        sameOwnedInode(target, tempIdentity),
      "post-crash canonical successor state is foreign");
    }

    await assertInputsMatchPlan(projectRoot, plan, receiptBytes);
    await appendPublicationJournal(
      projectRoot,
      transactionId,
      "postlink-inputs-verified",
      {
        inputVolatileIdentityFingerprintSha256:
          plan.inputVolatileIdentityFingerprintSha256,
      },
    );

    if (temporary) {
      await unlinkExactOwned(
        projectRoot,
        WAVE2B_DERIVED_REFRESH_PATHS.temp,
        tempIdentity,
        {allowedNlinks: [2]},
      );
      await appendPublicationJournal(
        projectRoot,
        transactionId,
        "temp-unlinked",
        {identity: tempIdentity},
      );
      if (hooks.afterTempUnlink) {
        await hooks.afterTempUnlink(
          WAVE2B_DERIVED_REFRESH_PATHS.receipt,
        );
      }
    }

    const written = await secureRead(
      projectRoot,
      WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      {
        expected: plan.receipt,
        requireMode: 0o444,
        allowedNlinks: [1],
      },
    );
    invariant(sameOwnedInode(written, tempIdentity),
      "canonical successor inode changed after temp unlink");
    await assertInputsMatchPlan(projectRoot, plan, receiptBytes);
    const parsed = parseJson(written, "canonical successor receipt");
    validateFingerprint(
      parsed,
      "receiptFingerprintSha256",
      "canonical successor receipt",
    );
    invariant(stableJson(parsed) === stableJson(receipt),
      "canonical successor receipt differs from immutable plan");
    await appendPublicationJournal(
      projectRoot,
      transactionId,
      "receipt-replay-verified",
      {receipt: contentBinding(written)},
    );
    await appendPublicationJournal(
      projectRoot,
      transactionId,
      "committed",
      {
        receipt: contentBinding(written),
        strictAcceptanceEffect: "none",
        releaseEffect: "none",
      },
    );
    await releaseWave2bLock(lock);
    return {written, recovered: context.recovery};
  } catch (error) {
    return rollbackUncommittedPublication(context, error);
  }
}

function resultFromReceipt(mode, status, receiptFile, receipt) {
  return {
    mode,
    status,
    upstreamTransactionId: WAVE2B_TRANSACTION_ID,
    receipt: contentBinding(receiptFile),
    receiptFingerprintSha256: receipt.receiptFingerprintSha256,
    protectedPinTransitionCount: receipt.protectedPinTransitions.length,
    intentionalDerivedRefreshCount:
      receipt.protectedPinTransitions.filter((entry) =>
        entry.disposition ===
          "intentional-derived-refresh-strict-zero-unpublished").length,
    derivedRefreshArtifactCount:
      receipt.derivedRefreshArtifacts.length,
    sourceSpecCount: receipt.immutableWave2b.sourceSpecFinals.length,
    strictComplete: receipt.semanticState.completionLedger.strictComplete,
    published: receipt.semanticState.lessonReleaseLedger.published,
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  };
}

export async function dryRunDerivedRefreshReceipt({
  root = DEFAULT_PROJECT_ROOT,
} = {}) {
  const state = await collectState(root);
  const receipt = buildReceipt(state);
  const bytes = Buffer.from(stableJson(receipt));
  return {
    mode: "dry-run",
    status: "ready-no-write",
    upstreamTransactionId: WAVE2B_TRANSACTION_ID,
    proposedReceipt: {
      path: WAVE2B_DERIVED_REFRESH_PATHS.receipt,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: 0o444,
    },
    receiptFingerprintSha256: receipt.receiptFingerprintSha256,
    protectedPinTransitionCount: receipt.protectedPinTransitions.length,
    intentionalDerivedRefreshCount: 2,
    derivedRefreshArtifactCount:
      receipt.derivedRefreshArtifacts.length,
    sourceSpecCount: receipt.immutableWave2b.sourceSpecFinals.length,
    strictComplete: 0,
    published: false,
    strictAcceptanceEffect: "none",
    releaseEffect: "none",
  };
}

export async function checkDerivedRefreshReceipt({
  root = DEFAULT_PROJECT_ROOT,
} = {}) {
  const state = await collectState(root);
  const expected = buildReceipt(state);
  const expectedBytes = Buffer.from(stableJson(expected));
  const observed = await secureRead(
    root,
    WAVE2B_DERIVED_REFRESH_PATHS.receipt,
    {requireMode: 0o444},
  );
  invariant(observed.contents.equals(expectedBytes),
    "canonical derived-refresh successor receipt is stale or foreign");
  validateFingerprint(
    parseJson(observed, "derived-refresh successor receipt"),
    "receiptFingerprintSha256",
    "derived-refresh successor receipt",
  );
  return resultFromReceipt(
    "replay",
    "already-created-and-verified",
    observed,
    expected,
  );
}

export async function applyDerivedRefreshReceipt({
  root = DEFAULT_PROJECT_ROOT,
  hooks = {},
} = {}) {
  assertRequiredFilesystemPrimitives();
  const projectRoot = await assertProjectRoot(root);
  const lockExists = await pathExists(
    projectRoot,
    WAVE2B_DERIVED_REFRESH_PATHS.lock,
  );
  if (lockExists) {
    const context = await adoptStalePublicationTransaction(projectRoot);
    const finished = await finishPublicationTransaction(context, hooks);
    return {
      ...resultFromReceipt(
        "apply",
        "recovered-created-and-verified",
        finished.written,
        context.receipt,
      ),
      recovered: true,
    };
  }
  if (await pathExists(
    projectRoot,
    WAVE2B_DERIVED_REFRESH_PATHS.receipt,
  )) {
    return checkDerivedRefreshReceipt({root: projectRoot});
  }
  const context = await startPublicationTransaction(projectRoot);
  if (hooks.afterLockedSnapshot) {
    try {
      await hooks.afterLockedSnapshot();
    } catch (error) {
      return rollbackUncommittedPublication(context, error);
    }
  }
  const finished = await finishPublicationTransaction(context, hooks);
  return resultFromReceipt(
    "apply",
    "created-and-verified",
    finished.written,
    context.receipt,
  );
}

export function parseDerivedRefreshArguments(argv) {
  const options = {mode: "dry-run", root: DEFAULT_PROJECT_ROOT};
  let selectedMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply" ||
      argument === "--check" ||
      argument === "--dry-run") {
      invariant(!selectedMode,
        "--apply, --check, and --dry-run are mutually exclusive");
      selectedMode = true;
      options.mode = argument.slice(2);
    } else if (argument === "--root") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"),
        "--root requires a value");
      options.root = path.resolve(value);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function help() {
  return "Usage: node scripts/build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs [--dry-run|--check|--apply] [--root PATH]\n\n" +
    "Default: dry-run when the canonical successor is absent; verified replay when it exists. Production creation requires explicit --apply.\n";
}

async function main() {
  const options = parseDerivedRefreshArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  let result;
  if (options.mode === "apply") {
    result = await applyDerivedRefreshReceipt(options);
  } else if (options.mode === "check") {
    result = await checkDerivedRefreshReceipt(options);
  } else if (await pathExists(
    options.root,
    WAVE2B_DERIVED_REFRESH_PATHS.receipt,
  )) {
    result = await checkDerivedRefreshReceipt(options);
  } else {
    result = await dryRunDerivedRefreshReceipt(options);
  }
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
