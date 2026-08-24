#!/usr/bin/env node

import {
  createPublicKey,
  randomUUID,
  verify as verifyCryptographicSignature,
} from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, promisify } from "node:util";

import { buildHelpMathCatalog } from "./build-help-math-catalog.mjs";
import {
  verifyManifest,
  writeManifest,
} from "./freeze-help-math-sources.mjs";
import {
  atomicSwapSiblingDirectoriesDarwin,
  atomicSwapSiblingRegularFilesDarwin,
  buildDarwinAtomicDirectorySwapNativeWitness,
  describeDarwinAtomicDirectorySwapBuildContract,
} from
  "./lib/darwin-atomic-directory-swap.mjs";
import {
  SHA256_PATTERN,
  assertCatalogSummaryMatchesProfile,
  assertMissingContainedDestination,
  cloneTreeCopyOnWrite,
  compareText,
  copyRegularFileExclusive,
  copyWorkingSetToStagedSource,
  createWorkingCopy,
  decideRecoveryAction,
  fsyncDirectory,
  inspectRegularFileNoFollow,
  inventoryDirectory,
  invariant,
  nodeIdentity,
  observeSwapPair,
  pathKind,
  portableRelativePath,
  promotionRecordSetSha256,
  publishImmutableBytesNoClobber,
  publishImmutableJsonNoClobber,
  readJsonArtifactNoFollow,
  replaceStagedBytesAtomically,
  resolveContainedExistingFile,
  rollbackCatalogThenSource,
  sameNode,
  sha256Bytes,
  snapshotDirectoryNode,
  syncTreeDurably,
  transactionIdentifier,
  transactionPaths,
  validateExpectedCatalogProfile,
  writeJournalAtomic,
} from "./lib/fla-swf-counterpart-transaction.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const execFile = promisify(execFileCallback);
const PREFIX = "fla-swf-counterpart-successor-2026-08-07-v2";
const SOURCE_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const CATALOG_RELATIVE = "catalog";
const UNIVERSE_RELATIVE = `catalog/source-promotions/${PREFIX}-universe.json`;
const REVIEW_LEDGER_RELATIVE =
  `catalog/source-promotions/${PREFIX}-pair-review-ledger.json`;
const PLAN_RELATIVE = `catalog/source-promotions/${PREFIX}-plan.json`;
const RECEIPT_RELATIVE = `catalog/source-promotions/${PREFIX}-applied.json`;
const NO_COPY_CLOSURE_RELATIVE =
  `catalog/source-promotions/${PREFIX}-no-copy-closure.json`;
const TRUSTED_REVIEWER_REGISTRY_RELATIVE =
  `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`;
const IMPLEMENTATION_BASELINE_COMPLETION_RELATIVE =
  `catalog/source-promotions/${PREFIX}-implementation-baseline-complete.json`;
const QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE =
  `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`;
const REPORT_RELATIVE = "reports/fla-swf-counterpart-successor-2026-08-07.md";
const CURRENT_PROFILE_RELATIVE = "catalog/current-source-profile.json";
const TRANSACTION_ROOT_RELATIVE =
  "work/fla-swf-counterpart-successor-transactions";
const NATIVE_SWAP_SOURCE_QUIESCENCE_PATH =
  "project/scripts/lib/darwin-atomic-directory-swap-native.c";
const CATALOG_OUTPUTS = Object.freeze([
  "summary.json",
  "animations.json",
  "animations.jsonl",
  "animations.csv",
  "assets.json",
  "duplicates.json",
  "missing-references.json",
  "unreferenced.json",
  "fla-only.json",
  "lessons.json",
  "audio-groups.json",
  "batches.json",
  "lesson-releases.json",
  "source-files.json",
  "source-files.jsonl",
  "source-files.csv",
  "source-files.sha256",
]);
const CATALOG_ALLOWED_CHANGED_PATHS = Object.freeze([
  ...CATALOG_OUTPUTS,
  "current-source-profile.json",
  "source-freeze.json",
  "source-manifest.sha256",
].sort(compareText));
const README_SUCCESSOR_BEGIN = "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_BEGIN -->";
const README_SUCCESSOR_END = "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_END -->";

function successorReadmeMarkerPositions(readmeText) {
  const begin = readmeText.indexOf(README_SUCCESSOR_BEGIN);
  const end = readmeText.indexOf(README_SUCCESSOR_END);
  invariant(begin >= 0 && end > begin
    && readmeText.indexOf(README_SUCCESSOR_BEGIN, begin + 1) === -1
    && readmeText.indexOf(README_SUCCESSOR_END, end + 1) === -1,
  "README successor status markers are missing or ambiguous");
  return { begin, end };
}

const SCHEMA = Object.freeze({
  universe: "help-math-fla-swf-counterpart-successor-universe/v2",
  universeType: "help-math-fla-swf-counterpart-successor-universe",
  ledger: "help-math-fla-swf-counterpart-successor-pair-review-ledger/v2",
  ledgerType: "help-math-fla-swf-counterpart-successor-pair-review-ledger",
  plan: "help-math-fla-swf-counterpart-successor-executable-plan/v2",
  planType: "help-math-fla-swf-counterpart-successor-executable-plan",
  transaction: "help-math-fla-swf-counterpart-successor-transaction/v2",
  transactionType: "help-math-fla-swf-counterpart-successor-transaction",
  receipt: "help-math-fla-swf-counterpart-successor-applied-receipt/v2",
  receiptType: "help-math-fla-swf-counterpart-successor-applied-receipt",
});

const DISPOSITION = Object.freeze({
  ordinary: "candidate-new-source-in-quarantine",
  historical: "hold-historical-custody-review",
  alias: "hold-placement-alias-review",
});

const defaultDependencies = Object.freeze({
  atomicSwap: atomicSwapSiblingDirectoriesDarwin,
  atomicFileSwap: atomicSwapSiblingRegularFilesDarwin,
  buildNativeWitness: buildDarwinAtomicDirectorySwapNativeWitness,
  describeNativeBuildContract: describeDarwinAtomicDirectorySwapBuildContract,
  buildCatalog: buildHelpMathCatalog,
  cloneTree: cloneTreeCopyOnWrite,
  syncTree: syncTreeDurably,
  verifyFreeze: verifyManifest,
  writeFreeze: writeManifest,
});

function usage() {
  return `Usage:
  node scripts/promote-fla-swf-counterpart-successor.mjs --preflight
  node scripts/promote-fla-swf-counterpart-successor.mjs --apply
  node scripts/promote-fla-swf-counterpart-successor.mjs --recover

Options:
There is no implicit apply. Preflight and apply require the immutable signed
620-record review ledger, executable plan, and embedded expected catalog
profile. The current unsigned ledger therefore blocks before transaction
creation or live-tree mutation.`;
}

function parseArguments(argv) {
  const options = { mode: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (["--preflight", "--apply", "--recover"].includes(argument)) {
      invariant(!options.mode, "Choose exactly one mode");
      options.mode = argument.slice(2);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  invariant(options.mode, "Choose exactly one of --preflight, --apply, or --recover");
  return options;
}

function existingOrAbsolute(candidate) {
  const absolute = path.resolve(candidate);
  try {
    return path.resolve(absolute);
  } catch {
    return absolute;
  }
}

function createConfiguration(options = {}) {
  const projectRoot = existingOrAbsolute(options.projectRoot ?? defaultProjectRoot);
  const transactionRoot = existingOrAbsolute(
    options.transactionRoot ?? path.join(projectRoot, TRANSACTION_ROOT_RELATIVE),
  );
  return {
    projectRoot,
    transactionRoot,
    activeRoot: path.join(transactionRoot, "active"),
    sourceRoot: path.join(projectRoot, SOURCE_RELATIVE),
    catalogRoot: path.join(projectRoot, CATALOG_RELATIVE),
    universePath: path.join(projectRoot, UNIVERSE_RELATIVE),
    reviewLedgerPath: path.join(projectRoot, REVIEW_LEDGER_RELATIVE),
    planPath: path.join(projectRoot, PLAN_RELATIVE),
    receiptPath: path.join(projectRoot, RECEIPT_RELATIVE),
    noCopyClosurePath: path.join(projectRoot, NO_COPY_CLOSURE_RELATIVE),
    currentProfilePath: path.join(projectRoot, CURRENT_PROFILE_RELATIVE),
    defaultProject: projectRoot === defaultProjectRoot,
  };
}

function countBy(records, key) {
  const result = {};
  for (const record of records) {
    result[record[key]] = (result[record[key]] ?? 0) + 1;
  }
  return result;
}

function canonicalJsonValue(value) {
  if (Array.isArray(value)) return value.map(canonicalJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(compareText)
      .map((key) => [key, canonicalJsonValue(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalJsonValue(value));
}

function assertNativeBuildContract(contract, label = "native swap build contract") {
  assertObjectKeys(contract, ["schemaVersion", "source", "compiler", "compile"], label);
  invariant(contract.schemaVersion
    === "help-math-darwin-atomic-directory-swap-native-build-contract/v1",
  `${label} schema changed`);
  assertObjectKeys(contract.source, ["path", "bytes", "sha256"], `${label}.source`);
  invariant(contract.source.path
      === "scripts/lib/darwin-atomic-directory-swap-native.c"
    && Number.isSafeInteger(contract.source.bytes) && contract.source.bytes > 0
    && SHA256_PATTERN.test(contract.source.sha256),
  `${label} source binding is invalid`);
  assertObjectKeys(contract.compiler, ["path", "version", "sdkPath"], `${label}.compiler`);
  invariant(path.isAbsolute(contract.compiler.path)
    && path.normalize(contract.compiler.path) === contract.compiler.path
    && path.isAbsolute(contract.compiler.sdkPath)
    && path.normalize(contract.compiler.sdkPath) === contract.compiler.sdkPath
    && typeof contract.compiler.version === "string"
    && contract.compiler.version.trim() === contract.compiler.version
    && contract.compiler.version.length > 0,
  `${label} compiler binding is invalid`);
  assertObjectKeys(contract.compile, [
    "driver", "sdk", "arguments", "executableSha256Policy",
  ], `${label}.compile`);
  invariant(contract.compile.driver === "/usr/bin/xcrun"
    && contract.compile.sdk === "macosx"
    && isDeepStrictEqual(contract.compile.arguments,
      ["-std=c17", "-O2", "-Wall", "-Wextra", "-Werror"])
    && contract.compile.executableSha256Policy
      === "prepared-witness-and-identical-across-source-catalog-rollback-and-readme-swaps",
  `${label} compile contract changed`);
  return contract;
}

function expectedNativeSwapBuildContract(bundle, {required = true} = {}) {
  const contract = bundle?.plan?.executionContract?.nativeAtomicSwapHelper;
  const matching = bundle?.validated?.expectedQuiescenceAllowlist
    ?.filter((record) => record.path === NATIVE_SWAP_SOURCE_QUIESCENCE_PATH) ?? [];
  if (!required && (!contract || matching.length === 0)) return null;
  assertNativeBuildContract(contract, "plan native swap build contract");
  invariant(matching.length === 1
    && matching[0].bytes === contract.source.bytes
    && matching[0].sha256 === contract.source.sha256,
  "Plan native build contract differs from the quiescence-bound C source");
  return contract;
}

function expectedNativeSwapSourceSha256(bundle, {required = true} = {}) {
  return expectedNativeSwapBuildContract(bundle, {required})?.source.sha256 ?? null;
}

function assertObjectKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  invariant(JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} has missing or unexpected keys`);
}

function recordIdentityClosureSha256(records) {
  return sha256Bytes(Buffer.from([...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
    .map((record) => [
      record.recordId,
      record.canonicalPath,
      record.bytes,
      record.sha256,
      record.sourceBindingSha256,
      record.currentDisposition,
    ].join("\t") + "\n")
    .join(""), "utf8"));
}

function assertCatalogPathClosure({
  baseInventory,
  currentInventory,
  preparedReceipt,
  appliedReceipt = null,
}) {
  invariant(baseInventory?.records && currentInventory?.records,
    "Catalog path closure requires base and current inventories");
  invariant(preparedReceipt && typeof preparedReceipt.path === "string"
    && Number.isSafeInteger(preparedReceipt.bytes)
    && SHA256_PATTERN.test(preparedReceipt.sha256),
  "Catalog path closure lacks a bound prepared receipt");
  portableRelativePath(preparedReceipt.path, "prepared receipt catalog path");
  if (appliedReceipt) {
    portableRelativePath(appliedReceipt.path, "applied receipt catalog path");
    invariant(Number.isSafeInteger(appliedReceipt.bytes)
      && SHA256_PATTERN.test(appliedReceipt.sha256),
    "Catalog path closure has an invalid applied receipt binding");
  }
  const baseByPath = new Map(baseInventory.records.map((record) => [record.path, record]));
  const currentByPath = new Map(currentInventory.records.map((record) => [record.path, record]));
  invariant(baseByPath.size === baseInventory.records.length
    && currentByPath.size === currentInventory.records.length,
  "Catalog inventory contains duplicate paths");
  const additions = [preparedReceipt, ...(appliedReceipt ? [appliedReceipt] : [])];
  for (const addition of additions) {
    invariant(!baseByPath.has(addition.path),
      `Catalog receipt path unexpectedly existed in the base: ${addition.path}`);
  }
  const expectedPaths = [...baseByPath.keys(), ...additions.map(({ path: value }) => value)]
    .sort(compareText);
  const currentPaths = [...currentByPath.keys()].sort(compareText);
  invariant(JSON.stringify(currentPaths) === JSON.stringify(expectedPaths),
    "Catalog path-set drift: expected exact base plus transaction receipt paths");
  const allowedChanged = new Set(CATALOG_ALLOWED_CHANGED_PATHS);
  invariant(CATALOG_ALLOWED_CHANGED_PATHS.every((relativePath) => baseByPath.has(relativePath)),
    "Base catalog lacks a declared mutable catalog artifact");
  for (const [relativePath, baseRecord] of baseByPath) {
    const currentRecord = currentByPath.get(relativePath);
    invariant(currentRecord, `Catalog base path was deleted: ${relativePath}`);
    if (!allowedChanged.has(relativePath)) {
      invariant(currentRecord.bytes === baseRecord.bytes
        && currentRecord.sha256 === baseRecord.sha256,
      `Non-output catalog artifact changed: ${relativePath}`);
    }
  }
  for (const addition of additions) {
    const current = currentByPath.get(addition.path);
    invariant(current.bytes === addition.bytes && current.sha256 === addition.sha256,
      `Catalog receipt identity drift: ${addition.path}`);
  }
  return {
    baseFileCount: baseInventory.fileCount,
    currentFileCount: currentInventory.fileCount,
    baseTreeSha256: baseInventory.treeSha256,
    currentTreeSha256: currentInventory.treeSha256,
    allowedChangedPaths: [...CATALOG_ALLOWED_CHANGED_PATHS],
    preparedReceipt: { ...preparedReceipt },
    appliedReceipt: appliedReceipt ? { ...appliedReceipt } : null,
    unexpectedPaths: 0,
    missingPaths: 0,
    unauthorizedChangedPaths: 0,
  };
}

function assertExactPartition(counts, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    invariant(counts[key] === value, `${label} ${key} must be ${value}, got ${counts[key] ?? 0}`);
  }
  invariant(Object.values(counts).reduce((sum, value) => sum + value, 0)
    === Object.values(expected).reduce((sum, value) => sum + value, 0),
  `${label} contains an unexpected disposition`);
}

function embeddedProfileBytes(plan) {
  validateExpectedCatalogProfile(plan.expectedCatalogProfile);
  const contents = Buffer.from(
    `${JSON.stringify(plan.expectedCatalogProfile, null, 2)}\n`,
    "utf8",
  );
  const reference = plan.inputs?.expectedCatalogProfile;
  invariant(reference?.embeddedAt === "expectedCatalogProfile",
    "Plan does not identify its embedded expected catalog profile");
  invariant(reference.bytes === contents.length,
    "Embedded expected catalog profile byte-count drift");
  invariant(reference.sha256 === sha256Bytes(contents),
    "Embedded expected catalog profile SHA-256 drift");
  return { contents, reference };
}

function validateSuccessorBundle({ universe, reviewLedger, plan }) {
  invariant(universe?.schemaVersion === SCHEMA.universe,
    "Unsupported successor-universe schema");
  invariant(universe?.artifactType === SCHEMA.universeType,
    "Wrong successor-universe artifactType");
  invariant(reviewLedger?.schemaVersion === SCHEMA.ledger,
    "Unsupported pair-review-ledger schema");
  invariant(reviewLedger?.artifactType === SCHEMA.ledgerType,
    "Wrong pair-review-ledger artifactType");
  invariant(plan?.schemaVersion === SCHEMA.plan,
    "Unsupported successor-plan schema");
  invariant(plan?.artifactType === SCHEMA.planType,
    "Wrong successor-plan artifactType");

  const records = universe.records;
  invariant(Array.isArray(records) && records.length === 620,
    "Successor universe must contain exactly 620 records");
  const byId = new Map();
  const byPath = new Map();
  for (const record of records) {
    invariant(typeof record.recordId === "string" && record.recordId.length > 0,
      "Universe record lacks recordId");
    portableRelativePath(record.canonicalPath, "universe canonicalPath");
    invariant(!byId.has(record.recordId), `Duplicate universe recordId: ${record.recordId}`);
    invariant(!byPath.has(record.canonicalPath),
      `Duplicate universe canonicalPath: ${record.canonicalPath}`);
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0,
      `Invalid universe bytes: ${record.canonicalPath}`);
    invariant(SHA256_PATTERN.test(record.sha256),
      `Invalid universe SHA-256: ${record.canonicalPath}`);
    invariant(SHA256_PATTERN.test(record.sourceBindingSha256),
      `Invalid sourceBindingSha256: ${record.canonicalPath}`);
    invariant(record.sourceBinding?.manifestEntry?.path
      === record.sourceBinding?.manifestRelativePath,
    `Manifest-entry path drift: ${record.canonicalPath}`);
    invariant(record.sourceBinding?.manifestEntry?.bytes === record.bytes
      && record.sourceBinding?.manifestEntry?.sha256 === record.sha256,
    `Manifest-entry identity drift: ${record.canonicalPath}`);
    invariant(record.priorIntakeDecision
      === (record.priorDisposition === DISPOSITION.ordinary ? "candidate" : "hold"),
    `Prior intake decision drift: ${record.canonicalPath}`);
    byId.set(record.recordId, record);
    byPath.set(record.canonicalPath, record);
  }
  assertExactPartition(countBy(records, "priorDisposition"), {
    [DISPOSITION.ordinary]: 551,
    [DISPOSITION.historical]: 61,
    [DISPOSITION.alias]: 8,
  }, "Prior disposition partition");
  assertExactPartition(countBy(records, "currentDisposition"), {
    [DISPOSITION.ordinary]: 549,
    [DISPOSITION.historical]: 61,
    [DISPOSITION.alias]: 10,
  }, "Current disposition partition");
  const currentHolds = records.filter((record) =>
    [DISPOSITION.historical, DISPOSITION.alias].includes(record.currentDisposition));
  invariant(currentHolds.length === 71, "Current hold set must contain exactly 71 records");
  invariant(currentHolds.every((record) => record.automaticCopyAllowed === false),
    "Every current hold must prohibit automatic copy");
  invariant(records.every((record) => record.automaticCopyAllowed === false),
    "Frozen universe must prohibit automatic copy for all 620 records");
  invariant(currentHolds.every((record) =>
    record.promotionEligibility === "withheld-pending-manual-review"),
  "Every current hold must remain withheld pending manual review");
  invariant(records.filter((record) => record.currentDisposition === DISPOSITION.ordinary)
    .every((record) => record.promotionEligibility === "pair-review-required"),
  "Every ordinary candidate must remain pair-review-required");

  const ledgerRecords = reviewLedger.records;
  invariant(Array.isArray(ledgerRecords) && ledgerRecords.length === 620,
    "Review ledger must contain exactly 620 records");
  const ledgerById = new Map();
  for (const record of ledgerRecords) {
    invariant(byId.has(record.recordId), `Review ledger has unknown recordId: ${record.recordId}`);
    invariant(!ledgerById.has(record.recordId), `Duplicate review recordId: ${record.recordId}`);
    const source = byId.get(record.recordId);
    invariant(record.canonicalPath === source.canonicalPath
      && record.sourceBindingSha256 === source.sourceBindingSha256,
    `Review binding drift: ${record.recordId}`);
    ledgerById.set(record.recordId, record);
  }
  invariant(reviewLedger.attestation?.state === "signed-complete",
    "Pair-review ledger is unsigned or incomplete");
  invariant(SHA256_PATTERN.test(reviewLedger.attestation?.reviewPayloadSha256),
    "Pair-review ledger lacks a signed payload digest");
  invariant(Array.isArray(reviewLedger.attestation?.reviewers)
    && reviewLedger.attestation.reviewers.length > 0,
  "Pair-review ledger lacks reviewers");
  invariant(Array.isArray(reviewLedger.attestation?.signatureEnvelopes)
    && reviewLedger.attestation.signatureEnvelopes.length > 0,
  "Pair-review ledger lacks signature envelopes");
  const reviewDecisions = new Set([
    "unresolved",
    "confirmed-publication-lineage",
    "metadata-consistent-lineage-unproven",
    "timeline-or-version-mismatch",
    "placement-conflict",
    "contradicted",
  ]);
  invariant(ledgerRecords.every((record) => record.review?.terminal === true
    && reviewDecisions.has(record.review?.decision)),
  "Pair-review ledger has a nonterminal or invalid decision");
  for (const ledgerRecord of ledgerRecords) {
    const source = byId.get(ledgerRecord.recordId);
    const hold = [DISPOSITION.historical, DISPOSITION.alias]
      .includes(source.currentDisposition);
    if (hold) {
      invariant(ledgerRecord.manualHoldReview?.required === true
        && ["approved-reviewed-copy", "withheld"]
          .includes(ledgerRecord.manualHoldReview?.decision)
        && ledgerRecord.manualHoldReview?.receipt,
      `Current hold lacks a terminal manual receipt: ${ledgerRecord.recordId}`);
    } else {
      invariant(ledgerRecord.manualHoldReview?.required === false
        && ledgerRecord.manualHoldReview?.decision === "not-required"
        && ledgerRecord.manualHoldReview?.receipt === null,
      `Ordinary record has an invalid manual-hold contract: ${ledgerRecord.recordId}`);
    }
  }

  const approved = plan.approvedCopyRecords;
  const withheld = plan.withheldRecords;
  invariant(Array.isArray(approved) && Array.isArray(withheld),
    "Plan must contain approvedCopyRecords and withheldRecords");
  invariant(approved.length + withheld.length === 620,
    "Approved plus withheld records must equal 620");
  const dispositionIds = new Set();
  for (const [kind, rows] of [["approved", approved], ["withheld", withheld]]) {
    for (const row of rows) {
      invariant(typeof row.recordId === "string" && byId.has(row.recordId),
        `${kind} row has unknown recordId`);
      invariant(!dispositionIds.has(row.recordId),
        `Record appears more than once across approved/withheld: ${row.recordId}`);
      dispositionIds.add(row.recordId);
    }
  }
  invariant(dispositionIds.size === 620,
    "Approved/withheld disposition does not cover the exact universe");

  for (const row of approved) {
    const source = byId.get(row.recordId);
    const review = ledgerById.get(row.recordId);
    invariant(row.canonicalPath === source.canonicalPath
      && row.bytes === source.bytes
      && row.sha256 === source.sha256
      && row.sourceBindingSha256 === source.sourceBindingSha256,
    `Approved row identity drift: ${row.recordId}`);
    invariant(review.review?.decision === "confirmed-publication-lineage",
      `Approved row lacks confirmed publication lineage: ${row.recordId}`);
    const hold = [DISPOSITION.historical, DISPOSITION.alias]
      .includes(source.currentDisposition);
    if (hold) {
      invariant(row.approvalBasis === "manual-hold-confirmed-publication-lineage",
        `Current hold was auto-promoted: ${row.recordId}`);
      invariant(review.manualHoldReview?.required === true
        && review.manualHoldReview?.decision === "approved-reviewed-copy"
        && review.manualHoldReview?.receipt,
      `Current hold lacks an explicit manual approval receipt: ${row.recordId}`);
    } else {
      invariant(row.approvalBasis === "ordinary-confirmed-publication-lineage",
        `Ordinary row was approved solely from disposition: ${row.recordId}`);
      invariant(review.manualHoldReview?.decision === "not-required",
        `Ordinary row has an invalid manual-hold decision: ${row.recordId}`);
    }
  }
  for (const row of withheld) {
    const review = ledgerById.get(row.recordId);
    if (review.review?.decision === "unresolved") {
      invariant(!approved.some((approvedRow) => approvedRow.recordId === row.recordId),
        `Unresolved record was approved: ${row.recordId}`);
    }
  }
  invariant(approved.every((row) => row.automaticCopyAllowed !== true),
    "Executable plan contains an automatic approval");
  embeddedProfileBytes(plan);
  invariant(plan.reportingGate?.canonicalCountsReportable === false,
    "Plan reports canonical pairing counts before an applied receipt");
  return { records, byId, ledgerById, approved, withheld, currentHolds };
}

async function readImmutableArtifact(filePath, label) {
  const kind = await pathKind(filePath);
  invariant(kind === "file", `${label} is missing or unsafe: ${kind}`);
  return readJsonArtifactNoFollow(filePath, {
    requireSingleLink: true,
    requireReadOnly: true,
  });
}

async function readStableUtf8FileNoFollow(filePath, evidence, label) {
  const handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const before = await handle.stat({ bigint: true });
    invariant(before.isFile() && sameNode(nodeIdentity(before), evidence.node),
      `${label} identity changed before read`);
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(before), nodeIdentity(after))
      && before.size === after.size
      && before.mtimeNs === after.mtimeNs
      && bytes.length === evidence.bytes
      && sha256Bytes(bytes) === evidence.sha256,
    `${label} changed while reading`);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    await handle.close();
  }
}

async function inspectReportingPreconditions(configuration, {
  expectedReadme,
} = {}) {
  const readmePath = path.join(configuration.projectRoot, "README.md");
  const currentReadme = await inspectRegularFileNoFollow(readmePath, {
    requireSingleLink: true,
  });
  if (expectedReadme) {
    invariant(currentReadme.bytes === expectedReadme.bytes
      && currentReadme.sha256 === expectedReadme.sha256
      && currentReadme.mode === expectedReadme.mode
      && sameNode(currentReadme.node, expectedReadme.node),
    "README drift prevents successor reporting commitment");
  }
  const readmeText = await readStableUtf8FileNoFollow(
    readmePath,
    currentReadme,
    "README",
  );
  const markers = successorReadmeMarkerPositions(readmeText);
  const reportPath = path.join(configuration.projectRoot, REPORT_RELATIVE);
  invariant(await pathKind(reportPath) === "missing",
    `Successor report destination must be missing before commit: ${REPORT_RELATIVE}`);
  return {
    currentReadme,
    markers,
    reportDestination: { path: REPORT_RELATIVE, state: "missing" },
  };
}

function assertPinnedInput(reference, evidence, expectedPath, label) {
  invariant(reference?.path === expectedPath, `${label} path drift`);
  invariant(reference?.bytes === evidence.bytes, `${label} byte-count drift`);
  invariant(reference?.sha256 === evidence.sha256, `${label} SHA-256 drift`);
}

async function loadAndValidateBundle(configuration, {
  requireBuilderValidator = true,
  requireCurrentUniverse = true,
  builderModule,
} = {}) {
  const [universeFile, ledgerFile, planFile] = await Promise.all([
    readImmutableArtifact(configuration.universePath, "successor universe"),
    readImmutableArtifact(configuration.reviewLedgerPath, "pair-review ledger"),
    readImmutableArtifact(configuration.planPath, "successor executable plan"),
  ]);
  assertPinnedInput(planFile.value.inputs?.universe, universeFile.evidence,
    UNIVERSE_RELATIVE, "Universe input");
  assertPinnedInput(planFile.value.inputs?.reviewLedger, ledgerFile.evidence,
    REVIEW_LEDGER_RELATIVE, "Review-ledger input");
  const validated = validateSuccessorBundle({
    universe: universeFile.value,
    reviewLedger: ledgerFile.value,
    plan: planFile.value,
  });
  if (requireBuilderValidator) {
    const builder = builderModule
      ?? await import("./build-fla-swf-counterpart-successor-plan.mjs");
    invariant(typeof builder.assertExecutablePlan === "function",
      "Successor plan builder does not export assertExecutablePlan");
    invariant(typeof builder.validateReviewLedger === "function",
      "Successor plan builder does not export validateReviewLedger");
    invariant(typeof builder.expectedQuiescenceAllowlist === "function",
      "Successor plan builder does not export expectedQuiescenceAllowlist");
    invariant(typeof builder.loadTrustedReviewerRegistry === "function"
      && typeof builder.assertReviewerAuthorizedByRegistry === "function",
    "Successor plan builder does not export trusted-reviewer registry validators");
    invariant(typeof builder.scanRelevantProcessCensus === "function",
      "Successor plan builder does not export the relevant-process scanner");
    invariant(typeof builder.loadFirstSnapshotState === "function",
      "Successor plan builder does not export the first-snapshot-state validator");
    invariant(typeof builder.verifyImplementationBaselineCurrent === "function",
      "Successor plan builder does not export the implementation-baseline validator");
    const universeIdentity = {
      path: UNIVERSE_RELATIVE,
      bytes: universeFile.evidence.bytes,
      sha256: universeFile.evidence.sha256,
    };
    const trustedReviewerRegistry = await builder.loadTrustedReviewerRegistry({
      root: configuration.projectRoot,
      universeIdentity,
    });
    assertPinnedInput(
      planFile.value.inputs?.trustedReviewerRegistry,
      trustedReviewerRegistry.identity,
      TRUSTED_REVIEWER_REGISTRY_RELATIVE,
      "Trusted-reviewer-registry input",
    );
    const firstSnapshotState = await builder.loadFirstSnapshotState({
      root: configuration.projectRoot,
      firstSnapshotReference: planFile.value.inputs?.quiescenceSnapshots?.[0],
    });
    assertPinnedInput(
      planFile.value.inputs?.quiescenceFirstSnapshotState,
      firstSnapshotState.identity,
      QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE,
      "Quiescence first-snapshot-state input",
    );
    const implementationBaseline =
      await builder.verifyImplementationBaselineCurrent({
        root: configuration.projectRoot,
        reference: planFile.value.inputs?.repositoryBaseline
          ?.implementationVerificationReceipt,
      });
    assertPinnedInput(
      planFile.value.inputs?.repositoryBaseline
        ?.implementationVerificationCompletion,
      implementationBaseline.completionIdentity,
      IMPLEMENTATION_BASELINE_COMPLETION_RELATIVE,
      "Implementation-baseline completion input",
    );
    await builder.validateReviewLedger(ledgerFile.value, {
      universe: universeFile.value,
      universeIdentity,
      root: configuration.projectRoot,
      requireTerminal: true,
      verifyExternalArtifacts: true,
      trustedReviewerRegistry,
    });
    await builder.assertExecutablePlan(planFile.value, {
      universe: universeFile.value,
      reviewLedger: ledgerFile.value,
      expectedCatalogProfile: planFile.value.expectedCatalogProfile,
      trustedReviewerRegistryIdentity: trustedReviewerRegistry.identity,
      quiescenceFirstSnapshotStateIdentity: {
        path: QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE,
        bytes: firstSnapshotState.identity.bytes,
        sha256: firstSnapshotState.identity.sha256,
      },
      implementationBaselineIdentity: implementationBaseline.identity,
      implementationBaselineCompletionIdentity:
        implementationBaseline.completionIdentity,
    });
    const expectedQuiescenceAllowlist = await builder.expectedQuiescenceAllowlist({
      universe: universeFile.value,
      universeIdentity: {
        path: UNIVERSE_RELATIVE,
        bytes: universeFile.evidence.bytes,
        sha256: universeFile.evidence.sha256,
      },
      reviewLedger: ledgerFile.value,
      reviewLedgerIdentity: {
        path: REVIEW_LEDGER_RELATIVE,
        bytes: ledgerFile.evidence.bytes,
        sha256: ledgerFile.evidence.sha256,
      },
      additionalProjectArtifacts: [
        planFile.value.inputs.provisionalPostStateObservation,
        implementationBaseline.identity,
        implementationBaseline.completionIdentity,
      ],
      root: configuration.projectRoot,
    });
    invariant(planFile.value.inputs.quiescenceScope?.records
      === expectedQuiescenceAllowlist.length
      && planFile.value.inputs.quiescenceScope?.identitySha256
        === quiescenceAllowlistIdentitySha256(expectedQuiescenceAllowlist),
    "Plan quiescence scope differs from the builder-rederived fixed allowlist");
    validated.expectedQuiescenceAllowlist = expectedQuiescenceAllowlist;
    validated.trustedReviewerRegistry = trustedReviewerRegistry;
    validated.quiescenceFirstSnapshotState = firstSnapshotState;
    validated.implementationBaseline = implementationBaseline;
    validated.scanRelevantProcessCensus = builder.scanRelevantProcessCensus;
    if (requireCurrentUniverse) {
      invariant(typeof builder.assertCurrentUniverse === "function",
        "Successor universe builder does not export assertCurrentUniverse");
      await builder.assertCurrentUniverse(universeFile.value, {
        projectRoot: configuration.projectRoot,
      });
    }
  }
  return {
    universe: universeFile.value,
    reviewLedger: ledgerFile.value,
    plan: planFile.value,
    universeEvidence: universeFile.evidence,
    ledgerEvidence: ledgerFile.evidence,
    planEvidence: planFile.evidence,
    validated,
    profile: embeddedProfileBytes(planFile.value),
  };
}

async function verifyPrivateInputs(bundle) {
  const roots = bundle.universe.sourceRootBindings;
  invariant(roots && typeof roots === "object" && !Array.isArray(roots),
    "Universe lacks sourceRootBindings");
  const rootEvidence = {};
  for (const rootRef of new Set(bundle.validated.approved
    .map((record) => record.sourceBinding?.rootRef))) {
    invariant(typeof rootRef === "string" && roots[rootRef],
      `Approved record has an unknown source root: ${rootRef}`);
    const binding = roots[rootRef];
    invariant(path.isAbsolute(binding.absolutePath), `Source root is not absolute: ${rootRef}`);
    const information = await lstat(binding.absolutePath);
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `Private source root is unsafe: ${rootRef}`);
    invariant(await realpath(binding.absolutePath) === binding.absolutePath,
      `Private source root traverses a symlink: ${rootRef}`);
    const custody = {};
    for (const [name, reference] of Object.entries(binding.custody ?? {})) {
      const artifact = await resolveContainedExistingFile(
        binding.absolutePath,
        reference.path,
        `${rootRef} custody ${name}`,
      );
      custody[name] = await inspectRegularFileNoFollow(artifact, {
        expectedBytes: reference.bytes,
        expectedSha256: reference.sha256,
      });
    }
    rootEvidence[rootRef] = { absolutePath: binding.absolutePath, custody };
  }
  const sourceFiles = [];
  for (const record of bundle.validated.approved) {
    const binding = roots[record.sourceBinding.rootRef];
    const sourcePath = await resolveContainedExistingFile(
      binding.absolutePath,
      record.sourceBinding.quarantineRelativePath,
      `approved source ${record.canonicalPath}`,
    );
    const evidence = await inspectRegularFileNoFollow(sourcePath, {
      expectedBytes: record.bytes,
      expectedSha256: record.sha256,
    });
    sourceFiles.push({ recordId: record.recordId, sourcePath, evidence });
  }
  return { roots, rootEvidence, sourceFiles };
}

async function verifySignatureArtifacts(configuration, bundle) {
  const references = [];
  for (const envelope of bundle.reviewLedger.attestation.signatureEnvelopes) {
    if (envelope?.artifact) references.push(envelope.artifact);
  }
  for (const record of bundle.validated.currentHolds) {
    const review = bundle.validated.ledgerById.get(record.recordId);
    references.push(review.manualHoldReview.receipt);
  }
  invariant(references.length > 0, "Signed ledger has no physical signature artifact references");
  const evidence = [];
  for (const reference of references) {
    portableRelativePath(reference.path, "signature artifact path");
    const filePath = path.join(configuration.projectRoot, reference.path);
    invariant(path.relative(configuration.projectRoot, filePath)
      && !path.relative(configuration.projectRoot, filePath).startsWith(".."),
    `Signature artifact escapes the project: ${reference.path}`);
    evidence.push({
      path: reference.path,
      evidence: await inspectRegularFileNoFollow(filePath, {
        expectedBytes: reference.bytes,
        expectedSha256: reference.sha256,
        requireSingleLink: true,
        requireReadOnly: true,
      }),
    });
  }
  return evidence;
}

function quiescenceRecordProjection(record) {
  portableRelativePath(record.path, "quiescence allowlist path");
  invariant(!/[\u0000-\u001f\u007f]/u.test(record.path),
    `Quiescence allowlist path contains a control character: ${JSON.stringify(record.path)}`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0,
    `Invalid quiescence bytes: ${record.path}`);
  invariant(SHA256_PATTERN.test(record.sha256),
    `Invalid quiescence SHA-256: ${record.path}`);
  invariant(typeof record.dev === "string" && /^\d+$/.test(record.dev)
    && typeof record.ino === "string" && /^\d+$/.test(record.ino),
  `Invalid quiescence inode identity: ${record.path}`);
  invariant(Number.isInteger(record.mode) && record.mode >= 0 && record.mode <= 0o7777,
    `Invalid quiescence mode: ${record.path}`);
  invariant(typeof record.mtimeNs === "string" && /^\d+$/.test(record.mtimeNs),
    `Invalid quiescence mtimeNs: ${record.path}`);
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    dev: record.dev,
    ino: record.ino,
    mode: record.mode,
    mtimeNs: record.mtimeNs,
  };
}

function quiescenceAllowlistIdentitySha256(records) {
  return sha256Bytes(Buffer.from([...records]
    .sort((left, right) => compareText(left.path, right.path))
    .map((record) => `${record.path}\t${record.bytes}\t${record.sha256}\n`)
    .join(""), "utf8"));
}

async function resolveQuiescenceVirtualPath(configuration, universe, virtualPath) {
  const safe = portableRelativePath(virtualPath, "quiescence virtual path");
  const separator = safe.indexOf("/");
  invariant(separator > 0 && separator < safe.length - 1,
    `Quiescence path lacks a namespace and relative path: ${safe}`);
  const namespace = safe.slice(0, separator);
  const relativePath = safe.slice(separator + 1);
  if (namespace === "project") {
    return resolveContainedExistingFile(
      configuration.projectRoot,
      relativePath,
      `project quiescence path ${safe}`,
    );
  }
  const binding = universe?.sourceRootBindings?.[namespace];
  invariant(binding && typeof binding.absolutePath === "string"
    && path.isAbsolute(binding.absolutePath),
  `Quiescence path has an unknown source-root namespace: ${namespace}`);
  return resolveContainedExistingFile(
    binding.absolutePath,
    relativePath,
    `private quiescence path ${safe}`,
  );
}

function parseLsofWriteHandles(output) {
  const writers = [];
  let processId = null;
  let descriptor = null;
  let access = null;
  for (const line of output.split("\n")) {
    const prefix = line[0];
    const value = line.slice(1);
    if (prefix === "p") {
      processId = value;
      descriptor = null;
      access = null;
    } else if (prefix === "f") {
      descriptor = value;
      access = null;
    } else if (prefix === "a") {
      access = value;
    } else if (prefix === "n" && ["w", "u"].includes(access)) {
      writers.push({ processId, descriptor, access, path: value });
    }
  }
  return writers;
}

async function scanLiveWriteHandles(filePaths) {
  const writers = [];
  for (let offset = 0; offset < filePaths.length; offset += 100) {
    const batch = filePaths.slice(offset, offset + 100);
    try {
      const result = await execFile("/usr/sbin/lsof", ["-F", "pafn", "--", ...batch], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      });
      writers.push(...parseLsofWriteHandles(result.stdout));
    } catch (error) {
      if (error.code === 1 && !String(error.stdout ?? "").trim()) continue;
      throw new Error(`Live lsof quiescence scan failed closed: ${error.message}`);
    }
  }
  return writers;
}

function assertRelevantProcessCensus(value, label) {
  assertObjectKeys(value, [
    "tools", "observerProcesses", "unexpectedRelevantProcesses",
  ], label);
  assertObjectKeys(value.tools, ["ps", "lsofCwd"], `${label}.tools`);
  invariant(value.tools.ps === "/bin/ps -axo pid=,ppid=,command="
    && value.tools.lsofCwd === "/usr/sbin/lsof -n -P -a -d cwd -F pRcn",
  `${label} tool command contract changed`);
  for (const [field, observer] of [
    ["observerProcesses", true],
    ["unexpectedRelevantProcesses", false],
  ]) {
    const collection = value[field];
    assertObjectKeys(collection, ["count", "records"], `${label}.${field}`);
    invariant(Number.isSafeInteger(collection.count) && collection.count >= 0
      && Array.isArray(collection.records)
      && collection.count === collection.records.length,
    `${label}.${field} count changed`);
    for (const [index, record] of collection.records.entries()) {
      const recordLabel = `${label}.${field}.records[${index}]`;
      assertObjectKeys(record, [
        "pid", "ppid", "command", "cwd", "relevance", "observerRelationship",
      ], recordLabel);
      invariant(typeof record.pid === "string" && /^\d+$/.test(record.pid)
        && typeof record.ppid === "string" && /^\d+$/.test(record.ppid)
        && typeof record.command === "string" && record.command.length > 0
        && (record.cwd === null
          || (typeof record.cwd === "string" && path.isAbsolute(record.cwd)))
        && Array.isArray(record.relevance)
        && record.relevance.every((item) => typeof item === "string" && item.length > 0)
        && new Set(record.relevance).size === record.relevance.length,
      `${recordLabel} is invalid`);
      invariant(observer
        ? ["observer", "ancestor"].includes(record.observerRelationship)
        : record.observerRelationship === "none",
      `${recordLabel}.observerRelationship is invalid`);
    }
  }
  invariant(value.observerProcesses.count > 0
    && value.observerProcesses.records.some(
      (record) => record.observerRelationship === "observer",
    ), `${label} lacks its observer process`);
  invariant(value.unexpectedRelevantProcesses.count === 0,
    `${label} observed an unexpected relevant process`);
  return value;
}

async function inspectSnapshotBirthtimeNs(filePath, evidence) {
  const information = await lstat(filePath, { bigint: true });
  invariant(information.isFile() && !information.isSymbolicLink()
    && sameNode(nodeIdentity(information), evidence.node)
    && information.birthtimeNs > 0n,
  `Quiescence snapshot birthtime is unavailable or changed: ${filePath}`);
  return String(information.birthtimeNs);
}

async function verifyQuiescenceSnapshots(configuration, plan, {
  universe = { sourceRootBindings: {} },
  expectedAllowlist,
  scanOpenWriters = scanLiveWriteHandles,
  scanProcesses,
  inspectSnapshotBirthtime = inspectSnapshotBirthtimeNs,
} = {}) {
  const references = plan.inputs?.quiescenceSnapshots;
  invariant(Array.isArray(references) && references.length === 2,
    "Executable plan must bind exactly two scoped quiescence snapshots");
  const snapshots = [];
  for (const [index, reference] of references.entries()) {
    portableRelativePath(reference.path, `quiescence snapshot ${index + 1} path`);
    const absolutePath = path.join(configuration.projectRoot, reference.path);
    const relative = path.relative(configuration.projectRoot, absolutePath);
    invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative),
      `Quiescence snapshot escapes the project: ${reference.path}`);
    const file = await readJsonArtifactNoFollow(absolutePath, {
      expectedBytes: reference.bytes,
      expectedSha256: reference.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    });
    assertObjectKeys(file.value, [
      "schemaVersion", "artifactType", "capturedAt", "scope", "allowlist",
      "openWriteHandles", "processCensus",
    ], `Quiescence snapshot ${reference.path}`);
    invariant(file.value.schemaVersion
      === "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1"
      && file.value.artifactType
        === "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
    `Wrong quiescence snapshot schema/type: ${reference.path}`);
    invariant(Array.isArray(file.value.allowlist) && file.value.allowlist.length > 0,
      `Quiescence snapshot lacks an allowlist: ${reference.path}`);
    const allowlist = file.value.allowlist.map(quiescenceRecordProjection)
      .sort((left, right) => compareText(left.path, right.path));
    invariant(new Set(allowlist.map((record) => record.path)).size === allowlist.length,
      `Quiescence snapshot has duplicate paths: ${reference.path}`);
    assertObjectKeys(file.value.scope, [
      "recordSetSha256", "sourceBoundRecordSetSha256", "records", "identitySha256",
    ], `Quiescence snapshot scope ${reference.path}`);
    invariant(SHA256_PATTERN.test(file.value.scope.recordSetSha256)
      && SHA256_PATTERN.test(file.value.scope.sourceBoundRecordSetSha256)
      && file.value.scope.records === allowlist.length
      && file.value.scope.identitySha256
        === quiescenceAllowlistIdentitySha256(allowlist),
    `Quiescence snapshot scope identity drift: ${reference.path}`);
    if (universe?.digests) {
      invariant(file.value.scope.recordSetSha256 === universe.digests.recordSetSha256
        && file.value.scope.sourceBoundRecordSetSha256
          === universe.digests.sourceBoundRecordSetSha256,
      `Quiescence snapshot universe scope drift: ${reference.path}`);
    }
    invariant(file.value.openWriteHandles?.count === 0
      && Array.isArray(file.value.openWriteHandles.records)
      && file.value.openWriteHandles.records.length === 0,
    `Quiescence snapshot observed open write handles: ${reference.path}`);
    assertRelevantProcessCensus(
      file.value.processCensus,
      `Quiescence snapshot process census ${reference.path}`,
    );
    const capturedAt = Date.parse(file.value.capturedAt);
    invariant(Number.isFinite(capturedAt),
      `Quiescence snapshot capturedAt is invalid: ${reference.path}`);
    const birthtimeNs = await inspectSnapshotBirthtime(
      absolutePath,
      file.evidence,
      index,
    );
    invariant(typeof birthtimeNs === "string" && /^\d+$/.test(birthtimeNs),
      `Quiescence snapshot birthtime is invalid: ${reference.path}`);
    snapshots.push({ reference, file, allowlist, capturedAt, birthtimeNs });
  }
  invariant(snapshots[1].capturedAt - snapshots[0].capturedAt >= 60_000,
    "Scoped quiescence snapshots must be at least 60 seconds apart");
  invariant(BigInt(snapshots[1].birthtimeNs) - BigInt(snapshots[0].birthtimeNs)
    >= 60_000_000_000n,
  "Scoped quiescence snapshot files must be physically created at least 60 seconds apart");
  invariant(JSON.stringify(snapshots[0].allowlist) === JSON.stringify(snapshots[1].allowlist),
    "Scoped quiescence allowlist drift invalidates the executable plan");
  invariant(snapshots[0].reference.sha256 !== snapshots[1].reference.sha256,
    "Scoped quiescence snapshots must be distinct immutable receipts");
  const scope = plan.inputs?.quiescenceScope;
  invariant(scope?.records === snapshots[1].allowlist.length
    && scope?.identitySha256
      === quiescenceAllowlistIdentitySha256(snapshots[1].allowlist)
    && scope?.algorithm
      === "sha256(sorted path<TAB>bytes<TAB>sha256<LF>); exact paths include all canonical source files, all 620 private candidate files, pinned catalog inputs, README, universe, trusted reviewer registry, signed review ledger, and direct review evidence",
  "Scoped quiescence allowlist differs from the plan-bound deterministic full scope");
  invariant(isDeepStrictEqual(scope.selfReferentialExclusions, [
    {
      artifact: PLAN_RELATIVE,
      reason: "the plan hash cannot be included in snapshots that are themselves inputs to that plan",
    },
    {
      artifact: "two-quiescence-snapshot-receipts",
      reason: "each snapshot is directly bound by immutable path/bytes/SHA-256 in plan.inputs.quiescenceSnapshots",
    },
    {
      artifact: QUIESCENCE_FIRST_SNAPSHOT_STATE_RELATIVE,
      reason: "created after the first snapshot; directly bound by immutable path/bytes/SHA-256 and enforces the producer-owned physical not-before",
    },
  ]), "Scoped quiescence self-referential exclusions changed");
  if (expectedAllowlist) {
    const observedIdentity = snapshots[1].allowlist
      .map(({ path: relativePath, bytes, sha256 }) => ({
        path: relativePath, bytes, sha256,
      }));
    invariant(JSON.stringify(observedIdentity) === JSON.stringify(expectedAllowlist),
      "Scoped quiescence allowlist differs from the builder-rederived fixed allowlist");
  }
  const currentPaths = [];
  for (const record of snapshots[1].allowlist) {
    const absolutePath = await resolveQuiescenceVirtualPath(
      configuration,
      universe,
      record.path,
    );
    const evidence = await inspectRegularFileNoFollow(absolutePath, {
      expectedBytes: record.bytes,
      expectedSha256: record.sha256,
    });
    invariant(evidence.node.dev === record.dev && evidence.node.ino === record.ino,
      `Current quiescence inode drift invalidates the plan: ${record.path}`);
    invariant(evidence.mode === record.mode,
      `Current quiescence mode drift invalidates the plan: ${record.path}`);
    invariant(evidence.mtimeNs === record.mtimeNs,
      `Current quiescence mtime drift invalidates the plan: ${record.path}`);
    currentPaths.push(absolutePath);
  }
  const currentWriteHandles = await scanOpenWriters(currentPaths);
  invariant(Array.isArray(currentWriteHandles) && currentWriteHandles.length === 0,
    "Current live write handles invalidate the quiescence plan");
  const processScanner = scanProcesses
    ?? (await import("./build-fla-swf-counterpart-successor-plan.mjs"))
      .scanRelevantProcessCensus;
  invariant(typeof processScanner === "function",
    "Current relevant-process scanner is unavailable");
  const currentProcessCensus = assertRelevantProcessCensus(
    await processScanner({
      universe,
      root: configuration.projectRoot,
    }),
    "Current relevant-process census",
  );
  return snapshots.map(({ reference, file, allowlist, birthtimeNs }) => ({
    path: reference.path,
    bytes: file.evidence.bytes,
    sha256: file.evidence.sha256,
    capturedAt: file.value.capturedAt,
    birthtimeNs,
    allowlistCount: allowlist.length,
    openWriteHandles: 0,
    observerProcesses: file.value.processCensus.observerProcesses.count,
    unexpectedRelevantProcesses:
      file.value.processCensus.unexpectedRelevantProcesses.count,
    currentFilesystemReverified: reference === snapshots[1].reference,
    currentOpenWriteHandles: reference === snapshots[1].reference ? 0 : null,
    currentObserverProcesses: reference === snapshots[1].reference
      ? currentProcessCensus.observerProcesses.count
      : null,
    currentUnexpectedRelevantProcesses: reference === snapshots[1].reference
      ? currentProcessCensus.unexpectedRelevantProcesses.count
      : null,
  }));
}

function expectedBaseSource(plan) {
  const source = plan.inputs?.repositoryBaseline?.source;
  invariant(source && Number.isSafeInteger(source.fileCount)
    && Number.isSafeInteger(source.totalBytes)
    && SHA256_PATTERN.test(source.manifestSha256),
  "Plan lacks a complete repositoryBaseline.source binding");
  return source;
}

async function validateCatalogWithProfile({
  dependencies,
  sourceRoot,
  catalogRoot,
  profilePath,
  profileSha256,
  check,
}) {
  const result = await dependencies.buildCatalog({
    source: sourceRoot,
    output: catalogRoot,
    concurrency: 8,
    verifyKnownCounts: true,
    check,
    expectedProfile: profilePath,
    expectedProfileSha256: profileSha256,
  });
  const profile = (await readJsonArtifactNoFollow(profilePath, {
      expectedSha256: profileSha256,
      requireSingleLink: true,
    })).value;
  const lessonReleasePath = path.join(catalogRoot, "lesson-releases.json");
  const lessonReleaseArtifact = await readJsonArtifactNoFollow(lessonReleasePath, {
    requireSingleLink: true,
  });
  const releases = lessonReleaseArtifact.value.releases.map((release) => ({
    releaseId: release.releaseId,
    memberCount: release.members.length,
  }));
  const observedLessonReleases = {
    outputSha256: lessonReleaseArtifact.evidence.sha256,
    releaseCount: releases.length,
    totalMembers: releases.reduce((sum, release) => sum + release.memberCount, 0),
    releases,
  };
  const observed = assertCatalogSummaryMatchesProfile(result.summary, profile, {
    lessonReleases: observedLessonReleases,
  });
  return { observed, summary: result.summary, check };
}

async function strictPreflight(configuration, {
  dependencies = defaultDependencies,
  allowActiveTransaction = false,
  requireBuilderValidator = true,
  scanProcesses,
  inspectSnapshotBirthtime,
} = {}) {
  invariant(await pathKind(configuration.sourceRoot) === "directory",
    "Canonical source root is missing or unsafe");
  invariant(await pathKind(configuration.catalogRoot) === "directory",
    "Catalog root is missing or unsafe");
  if (!allowActiveTransaction) {
    invariant(await pathKind(configuration.activeRoot) === "missing",
      "An active successor transaction already exists");
  }
  invariant(await pathKind(configuration.receiptPath) === "missing",
    "Immutable successor applied receipt already exists");
  const bundle = await loadAndValidateBundle(configuration, { requireBuilderValidator });
  const nativeBuildRequired = requireBuilderValidator
    || bundle.validated.approved.length > 0;
  const nativeSwapBuildContract = expectedNativeSwapBuildContract(bundle, {
    required: nativeBuildRequired,
  });
  if (nativeBuildRequired) {
    invariant(typeof dependencies.describeNativeBuildContract === "function",
      "Preflight lacks the native-helper source/toolchain observer");
    const observedNativeBuildContract =
      await dependencies.describeNativeBuildContract();
    invariant(isDeepStrictEqual(
      observedNativeBuildContract,
      nativeSwapBuildContract,
    ), "Native-helper source/toolchain drift invalidates the executable plan");
  }
  const nativeSwapSourceSha256 = nativeSwapBuildContract?.source.sha256 ?? null;
  const signatureEvidence = await verifySignatureArtifacts(configuration, bundle);
  const quiescenceSnapshots = await verifyQuiescenceSnapshots(configuration, bundle.plan, {
    universe: bundle.universe,
    expectedAllowlist: bundle.validated.expectedQuiescenceAllowlist,
    scanProcesses: scanProcesses ?? bundle.validated.scanRelevantProcessCensus,
    inspectSnapshotBirthtime,
  });
  const privateInputs = await verifyPrivateInputs(bundle);
  for (const record of bundle.validated.approved) {
    await assertMissingContainedDestination(
      configuration.sourceRoot,
      record.canonicalPath,
      `canonical destination ${record.canonicalPath}`,
    );
  }
  const base = expectedBaseSource(bundle.plan);
  const baseFreeze = await dependencies.verifyFreeze(configuration.sourceRoot, {
    catalogRoot: configuration.catalogRoot,
    defaultPaths: configuration.defaultProject,
  });
  invariant(baseFreeze.fileCount === base.fileCount
    && baseFreeze.totalBytes === base.totalBytes
    && baseFreeze.manifestSha256 === base.manifestSha256,
  "Live base source differs from the executable plan");
  const currentProfileReference = bundle.plan.inputs.repositoryBaseline.currentSourceProfile;
  const currentProfile = await readJsonArtifactNoFollow(configuration.currentProfilePath, {
    expectedBytes: currentProfileReference?.bytes,
    expectedSha256: currentProfileReference?.sha256,
    requireSingleLink: true,
  });
  validateExpectedCatalogProfile(currentProfile.value);
  const baseCatalog = await validateCatalogWithProfile({
    dependencies,
    sourceRoot: configuration.sourceRoot,
    catalogRoot: configuration.catalogRoot,
    profilePath: configuration.currentProfilePath,
    profileSha256: currentProfile.evidence.sha256,
    check: true,
  });
  const [catalogInventory, reportingPreconditions] = await Promise.all([
    inventoryDirectory(configuration.catalogRoot),
    inspectReportingPreconditions(configuration),
  ]);
  return {
    bundle,
    nativeSwapBuildContract,
    nativeSwapSourceSha256,
    signatureEvidence,
    quiescenceSnapshots,
    privateInputs,
    baseFreeze,
    baseCatalog,
    currentProfile,
    catalogInventory,
    currentReadme: reportingPreconditions.currentReadme,
    reportingPreconditions,
    summary: {
      status: bundle.validated.approved.length === 0
        ? "terminal-reviewed-no-copy-preflight-passed-no-transaction"
        : "preflight-passed-no-mutation",
      frozenUniverseRecords: 620,
      approvedCopyRecords: bundle.validated.approved.length,
      withheldRecords: bundle.validated.withheld.length,
      currentHolds: 71,
      automaticHoldApprovals: 0,
      planSha256: bundle.planEvidence.sha256,
      expectedProfileSha256: bundle.profile.reference.sha256,
      quiescenceSnapshots: quiescenceSnapshots.length,
      liveMutationPerformed: false,
    },
  };
}

async function snapshotParentModes(configuration) {
  const parents = [...new Set([
    path.dirname(configuration.sourceRoot),
    path.dirname(configuration.catalogRoot),
  ])].sort(compareText);
  return Promise.all(parents.map(async (parent) => {
    const information = await lstat(parent, { bigint: true });
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `Transaction parent is unsafe: ${parent}`);
    return {
      path: parent,
      node: nodeIdentity(information),
      mode: Number(information.mode & 0o7777n),
    };
  }));
}

async function setParentMutation(snapshots, enabled) {
  for (const snapshot of enabled ? snapshots : [...snapshots].reverse()) {
    const information = await lstat(snapshot.path, { bigint: true });
    invariant(information.isDirectory() && !information.isSymbolicLink()
      && sameNode(snapshot.node, nodeIdentity(information)),
    `Transaction parent identity changed: ${snapshot.path}`);
    const observedMode = Number(information.mode & 0o7777n);
    const writableMode = snapshot.mode | 0o200;
    if (enabled) {
      invariant(observedMode === snapshot.mode,
        `Transaction parent mode drifted before enabling mutation: ${snapshot.path}`);
    } else {
      invariant(observedMode === writableMode || observedMode === snapshot.mode,
        `Transaction parent mode drifted before restoring mutation boundary: ${snapshot.path}`);
      if (observedMode === snapshot.mode) continue;
    }
    const targetMode = enabled ? writableMode : snapshot.mode;
    if (observedMode !== targetMode) await chmod(snapshot.path, targetMode);
    await fsyncDirectory(snapshot.path);
    const after = await lstat(snapshot.path, { bigint: true });
    invariant(after.isDirectory() && !after.isSymbolicLink()
      && sameNode(snapshot.node, nodeIdentity(after))
      && Number(after.mode & 0o7777n) === targetMode,
    `Transaction parent identity or mode changed during mutation transition: ${snapshot.path}`);
  }
}

function pathsOverlap(left, right) {
  const leftAbsolute = path.resolve(left);
  const rightAbsolute = path.resolve(right);
  const leftToRight = path.relative(leftAbsolute, rightAbsolute);
  const rightToLeft = path.relative(rightAbsolute, leftAbsolute);
  const contains = (relative) => relative === ""
    || (!relative.startsWith(`..${path.sep}`)
      && relative !== ".."
      && !path.isAbsolute(relative));
  return contains(leftToRight) || contains(rightToLeft);
}

async function assertProspectiveDirectoryPathHasNoSymlink(target, label) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  invariant(absolute !== parsed.root, `${label} cannot be a filesystem root`);
  let current = parsed.root;
  const segments = absolute.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (const segment of segments) {
    current = path.join(current, segment);
    let information;
    try {
      information = await lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
    invariant(!information.isSymbolicLink(),
      `${label} traverses a symbolic link: ${current}`);
    invariant(information.isDirectory(),
      `${label} existing component is not a directory: ${current}`);
    invariant(await realpath(current) === current,
      `${label} existing component resolves through a symbolic link: ${current}`);
  }
  return absolute;
}

async function ensureTransactionRoot(configuration) {
  const expectedProductionRoot = path.join(
    configuration.projectRoot,
    TRANSACTION_ROOT_RELATIVE,
  );
  if (configuration.defaultProject) {
    invariant(configuration.transactionRoot === expectedProductionRoot,
      "Production transaction root must use the fixed project-relative path");
  }
  invariant(!pathsOverlap(configuration.transactionRoot, configuration.sourceRoot)
    && !pathsOverlap(configuration.transactionRoot, configuration.catalogRoot),
  "Transaction root must be disjoint from live source and catalog roots");
  await assertProspectiveDirectoryPathHasNoSymlink(
    configuration.transactionRoot,
    "Transaction root",
  );
  await mkdir(configuration.transactionRoot, { recursive: true, mode: 0o700 });
  const information = await lstat(configuration.transactionRoot);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    "Transaction root is unsafe");
  invariant(await realpath(configuration.transactionRoot) === configuration.transactionRoot,
    "Transaction root traverses a symbolic link");
}

async function beginTransaction(configuration, preflightEvidence, {
  now = new Date(),
  uuid = randomUUID(),
} = {}) {
  await ensureTransactionRoot(configuration);
  invariant(await pathKind(configuration.activeRoot) === "missing",
    "Active transaction already exists");
  await mkdir(configuration.activeRoot, { mode: 0o700 });
  await fsyncDirectory(configuration.transactionRoot);
  const transactionId = transactionIdentifier(now, uuid);
  const paths = transactionPaths(configuration, transactionId);
  for (const candidate of [paths.sourceRecovery, paths.catalogRecovery]) {
    invariant(await pathKind(candidate) === "missing",
      `Transaction recovery path already exists: ${candidate}`);
  }
  const [sourceRootNode, catalogRootNode] = await Promise.all([
    snapshotDirectoryNode(configuration.sourceRoot, "base live source root"),
    snapshotDirectoryNode(configuration.catalogRoot, "base live catalog root"),
  ]);
  const journal = {
    schemaVersion: SCHEMA.transaction,
    artifactType: SCHEMA.transactionType,
    transactionId,
    phase: "locked",
    startedAt: now.toISOString(),
    plan: {
      path: PLAN_RELATIVE,
      bytes: preflightEvidence.bundle.planEvidence.bytes,
      sha256: preflightEvidence.bundle.planEvidence.sha256,
    },
    paths: {
      projectRoot: configuration.projectRoot,
      sourceLive: configuration.sourceRoot,
      catalogLive: configuration.catalogRoot,
      receipt: configuration.receiptPath,
      ...paths,
    },
    base: {
      freeze: preflightEvidence.baseFreeze,
      catalogTreeSha256: preflightEvidence.catalogInventory.treeSha256,
      currentProfileSha256: preflightEvidence.currentProfile.evidence.sha256,
      readme: {
        bytes: preflightEvidence.currentReadme.bytes,
        sha256: preflightEvidence.currentReadme.sha256,
        mode: preflightEvidence.currentReadme.mode,
        node: preflightEvidence.currentReadme.node,
      },
      reportDestination: preflightEvidence.reportingPreconditions.reportDestination,
      implementationVerificationCompletion: {
        ...preflightEvidence.bundle.plan.inputs.repositoryBaseline
          .implementationVerificationCompletion,
      },
      nativeSwapSourceSha256: preflightEvidence.nativeSwapSourceSha256,
      nativeSwapBuildContract: preflightEvidence.nativeSwapBuildContract,
      sourceRootNode: sourceRootNode.node,
      catalogRootNode: catalogRootNode.node,
    },
    parentModes: [],
    directoryNodesBeforeSwap: null,
    swapReceipts: {},
  };
  await writeJournalAtomic(paths.journalPath, journal);
  return { journal, paths };
}

async function persistJournal(transaction, patch) {
  transaction.journal = { ...transaction.journal, ...patch };
  await writeJournalAtomic(transaction.paths.journalPath, transaction.journal);
}

function assertPostFreeze(freeze, plan) {
  const expected = plan.expectedPostState?.source;
  invariant(expected && freeze.fileCount === expected.fileCount
    && freeze.totalBytes === expected.totalBytes
    && freeze.manifestSha256 === expected.manifestSha256,
  "Post-promotion freeze does not match expectedPostState.source");
  invariant(freeze.readOnlyEnforced === true && freeze.writableEntriesAfterFreeze === 0,
    "Post-promotion source tree is not frozen read-only");
  return freeze;
}

async function verifyPromotedRecordClosure(sourceRoot, records) {
  const verified = [];
  for (const record of records) {
    const filePath = await resolveContainedExistingFile(sourceRoot, record.canonicalPath,
      `promoted canonical source ${record.canonicalPath}`);
    verified.push({
      recordId: record.recordId,
      canonicalPath: record.canonicalPath,
      evidence: await inspectRegularFileNoFollow(filePath, {
        expectedBytes: record.bytes,
        expectedSha256: record.sha256,
      }),
    });
  }
  return verified;
}

async function verifyWithheldRemainAbsent(sourceRoot, records) {
  for (const record of records) {
    await assertMissingContainedDestination(sourceRoot, record.canonicalPath,
      `withheld canonical destination ${record.canonicalPath}`);
  }
  return { checked: records.length, unexpectedlyPresent: 0 };
}

function expectedCatalogArtifactBindings(plan) {
  const artifacts = plan.expectedPostState?.catalogArtifacts;
  assertObjectKeys(artifacts, [
    "outputs", "currentSourceProfile", "sourceManifest", "sourceFreeze",
  ], "expectedPostState.catalogArtifacts");
  invariant(Array.isArray(artifacts.outputs) && artifacts.outputs.length === 17,
    "Expected catalog artifacts must bind exactly 17 outputs");
  const outputs = new Map();
  for (const reference of artifacts.outputs) {
    assertObjectKeys(reference, ["path", "bytes", "sha256"],
      "expected catalog output reference");
    portableRelativePath(reference.path, "expected catalog output path");
    invariant(Number.isSafeInteger(reference.bytes) && reference.bytes >= 0
      && SHA256_PATTERN.test(reference.sha256) && !outputs.has(reference.path),
    `Invalid or duplicate expected catalog output: ${reference.path}`);
    outputs.set(reference.path, reference);
  }
  invariant(JSON.stringify([...outputs.keys()].sort(compareText))
    === JSON.stringify([...CATALOG_OUTPUTS].sort(compareText)),
  "Expected catalog output path set differs from the exact 17-output contract");
  for (const [key, expectedPath] of [
    ["currentSourceProfile", "current-source-profile.json"],
    ["sourceManifest", "source-manifest.sha256"],
    ["sourceFreeze", "source-freeze.json"],
  ]) {
    const reference = artifacts[key];
    assertObjectKeys(reference, ["path", "bytes", "sha256"],
      `expected catalog ${key}`);
    invariant(reference.path === expectedPath && Number.isSafeInteger(reference.bytes)
      && reference.bytes >= 0 && SHA256_PATTERN.test(reference.sha256),
    `Expected catalog ${key} binding drift`);
  }
  return { artifacts, outputs };
}

async function verifyCatalogEvidenceClosure(catalogRoot, observedProfile, plan) {
  const expected = expectedCatalogArtifactBindings(plan);
  const outputs = {};
  for (const filename of CATALOG_OUTPUTS) {
    outputs[filename] = await inspectRegularFileNoFollow(path.join(catalogRoot, filename), {
      expectedBytes: expected.outputs.get(filename).bytes,
      expectedSha256: expected.outputs.get(filename).sha256,
      requireSingleLink: true,
    });
  }
  invariant(Object.keys(outputs).length === 17,
    "Catalog evidence closure must bind exactly 17 deterministic outputs");
  const [summary, animations, flaOnly, sourceFiles] = await Promise.all([
    readJsonArtifactNoFollow(path.join(catalogRoot, "summary.json"), { requireSingleLink: true }),
    readJsonArtifactNoFollow(path.join(catalogRoot, "animations.json"), { requireSingleLink: true }),
    readJsonArtifactNoFollow(path.join(catalogRoot, "fla-only.json"), { requireSingleLink: true }),
    readJsonArtifactNoFollow(path.join(catalogRoot, "source-files.json"), { requireSingleLink: true }),
  ]);
  const paired = animations.value.animations
    .filter((animation) => animation.pairedFla !== null).length;
  const swfOnly = animations.value.animations.length - paired;
  invariant(summary.value.pairing?.pairedSwfFla === paired
    && summary.value.pairing?.swfOnly === swfOnly,
  "summary.json and animations.json pairing counts disagree");
  invariant(summary.value.pairing?.flaOnly === flaOnly.value.count
    && flaOnly.value.count === flaOnly.value.files.length,
  "summary.json and fla-only.json counts disagree");
  invariant(paired === observedProfile.pairedSwfFla
    && swfOnly === observedProfile.swfOnly
    && flaOnly.value.count === observedProfile.flaOnly,
  "Independent pairing reconciliation differs from the expected profile");
  invariant(sourceFiles.value.fileCount === summary.value.source.fileCount
    && sourceFiles.value.totalBytes === summary.value.source.totalBytes
    && sourceFiles.value.checksumSetSha256 === summary.value.source.checksumSetSha256,
  "source-files.json and summary.json source identities disagree");
  const checksumSet = await inspectRegularFileNoFollow(
    path.join(catalogRoot, "source-files.sha256"),
    {
      expectedSha256: summary.value.source.checksumSetSha256,
      requireSingleLink: true,
    },
  );
  const sourceManifest = await inspectRegularFileNoFollow(
    path.join(catalogRoot, "source-manifest.sha256"),
    {
      expectedBytes: expected.artifacts.sourceManifest.bytes,
      expectedSha256: expected.artifacts.sourceManifest.sha256,
      requireSingleLink: true,
    },
  );
  const sourceFreeze = await inspectRegularFileNoFollow(
    path.join(catalogRoot, "source-freeze.json"),
    {
      expectedBytes: expected.artifacts.sourceFreeze.bytes,
      expectedSha256: expected.artifacts.sourceFreeze.sha256,
      requireSingleLink: true,
    },
  );
  const currentSourceProfile = await inspectRegularFileNoFollow(
    path.join(catalogRoot, "current-source-profile.json"),
    {
      expectedBytes: expected.artifacts.currentSourceProfile.bytes,
      expectedSha256: expected.artifacts.currentSourceProfile.sha256,
      requireSingleLink: true,
    },
  );
  return {
    outputCount: 17,
    outputs,
    sourceManifest,
    sourceFreeze,
    currentSourceProfile,
    sourceFilesArtifact: sourceFiles.evidence,
    checksumSet,
    independentPairing: { pairedSwfFla: paired, swfOnly, flaOnly: flaOnly.value.count },
    boundArtifacts: expected.artifacts,
  };
}

async function postcheckTree(configuration, preflightEvidence, {
  sourceRoot = configuration.sourceRoot,
  catalogRoot = configuration.catalogRoot,
  defaultPaths = false,
  dependencies = defaultDependencies,
} = {}) {
  const profilePath = path.join(catalogRoot, "current-source-profile.json");
  const profileEvidence = await inspectRegularFileNoFollow(profilePath, {
    expectedBytes: preflightEvidence.bundle.profile.reference.bytes,
    expectedSha256: preflightEvidence.bundle.profile.reference.sha256,
    requireSingleLink: true,
  });
  const freeze = assertPostFreeze(
    await dependencies.verifyFreeze(sourceRoot, { catalogRoot, defaultPaths }),
    preflightEvidence.bundle.plan,
  );
  const catalog = await validateCatalogWithProfile({
    dependencies,
    sourceRoot,
    catalogRoot,
    profilePath,
    profileSha256: profileEvidence.sha256,
    check: true,
  });
  const promoted = await verifyPromotedRecordClosure(
    sourceRoot,
    preflightEvidence.bundle.validated.approved,
  );
  const withheld = await verifyWithheldRemainAbsent(
    sourceRoot,
    preflightEvidence.bundle.validated.withheld,
  );
  const catalogEvidenceClosure = await verifyCatalogEvidenceClosure(
    catalogRoot,
    catalog.observed,
    preflightEvidence.bundle.plan,
  );
  invariant(catalogEvidenceClosure.sourceManifest.sha256 === freeze.manifestSha256,
    "source-manifest.sha256 artifact does not bind the verified freeze manifest");
  return {
    freeze,
    catalog,
    profileEvidence,
    promoted,
    withheld,
    catalogEvidenceClosure,
  };
}

async function stageTransaction({ configuration, preflightEvidence, transaction, dependencies }) {
  const approved = preflightEvidence.bundle.validated.approved;
  const withheldUniverseRecords = preflightEvidence.bundle.validated.withheld
    .map((record) => preflightEvidence.bundle.validated.byId.get(record.recordId));
  const approvedClosureSha256 = recordIdentityClosureSha256(approved);
  const withheldClosureSha256 = recordIdentityClosureSha256(withheldUniverseRecords);
  const sourceRoots = preflightEvidence.bundle.universe.sourceRootBindings;
  const rootRefs = [...new Set(approved.map((record) => record.sourceBinding.rootRef))];
  invariant(rootRefs.length === 1,
    "One transaction must use exactly one sourceRootBinding");
  const privateSourceRoot = sourceRoots[rootRefs[0]].absolutePath;

  await persistJournal(transaction, { phase: "creating-byte-identical-working-copy" });
  const workingCopy = await createWorkingCopy({
    records: approved,
    sourceRoot: privateSourceRoot,
    workingRoot: transaction.paths.workingRoot,
    planSha256: preflightEvidence.bundle.planEvidence.sha256,
  });
  await persistJournal(transaction, {
    phase: "cloning-source",
    workingCopy: {
      receiptPath: workingCopy.receiptPath,
      receiptSha256: workingCopy.receiptEvidence.sha256,
      recordCount: workingCopy.receipt.recordCount,
      recordSetSha256: workingCopy.receipt.recordSetSha256,
    },
  });
  const sourceClone = await dependencies.cloneTree(
    configuration.sourceRoot,
    transaction.paths.sourceRecovery,
  );
  await persistJournal(transaction, { phase: "copying-approved-working-set", sourceClone });
  const copied = await copyWorkingSetToStagedSource({
    records: approved,
    workingCopyReceiptPath: workingCopy.receiptPath,
    workingCopyReceiptSha256: workingCopy.receiptEvidence.sha256,
    planSha256: preflightEvidence.bundle.planEvidence.sha256,
    sourceRoot: privateSourceRoot,
    workingRoot: transaction.paths.workingRoot,
    stagedSourceRoot: transaction.paths.sourceRecovery,
  });
  invariant(copied.recordSetSha256 === promotionRecordSetSha256(approved),
    "Staged copy record-set digest drift");

  await persistJournal(transaction, { phase: "cloning-catalog", copied });
  const catalogClone = await dependencies.cloneTree(
    configuration.catalogRoot,
    transaction.paths.catalogRecovery,
  );
  const clonedCatalog = await inventoryDirectory(transaction.paths.catalogRecovery);
  invariant(clonedCatalog.treeSha256 === preflightEvidence.catalogInventory.treeSha256,
    "Staged catalog clone differs from the preflight catalog tree");

  const stagedProfilePath = path.join(
    transaction.paths.catalogRecovery,
    "current-source-profile.json",
  );
  await persistJournal(transaction, { phase: "installing-staged-expected-profile", catalogClone });
  const stagedProfile = await replaceStagedBytesAtomically(
    stagedProfilePath,
    preflightEvidence.bundle.profile.contents,
    {
      expectedExisting: {
        bytes: preflightEvidence.currentProfile.evidence.bytes,
        sha256: preflightEvidence.currentProfile.evidence.sha256,
      },
      mode: 0o444,
      label: "staged current-source-profile",
    },
  );

  await persistJournal(transaction, { phase: "building-staged-catalog", stagedProfile });
  const builtCatalog = await validateCatalogWithProfile({
    dependencies,
    sourceRoot: transaction.paths.sourceRecovery,
    catalogRoot: transaction.paths.catalogRecovery,
    profilePath: stagedProfilePath,
    profileSha256: stagedProfile.sha256,
    check: false,
  });
  await persistJournal(transaction, { phase: "freezing-staged-source", builtCatalog });
  assertPostFreeze(
    await dependencies.writeFreeze(transaction.paths.sourceRecovery, {
      catalogRoot: transaction.paths.catalogRecovery,
      defaultPaths: false,
    }),
    preflightEvidence.bundle.plan,
  );
  await persistJournal(transaction, { phase: "checking-staged-source-and-catalog" });
  const stagedPostcheck = await postcheckTree(configuration, preflightEvidence, {
    sourceRoot: transaction.paths.sourceRecovery,
    catalogRoot: transaction.paths.catalogRecovery,
    dependencies,
  });

  invariant(typeof dependencies.buildNativeWitness === "function",
    "Prepared transaction lacks the deterministic native-helper witness builder");
  await persistJournal(transaction, {phase: "building-native-helper-witness"});
  const nativeSwapBuildWitness = await dependencies.buildNativeWitness({
    expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256,
    expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract,
  });
  const nativeSwapBuildWitnessIdentity = nativeBuildReceiptIdentity(
    nativeSwapBuildWitness,
    preflightEvidence.nativeSwapBuildContract,
    "prepared native swap build witness",
  );
  await persistJournal(transaction, {
    phase: "native-helper-witness-frozen",
    nativeSwapBuildWitness,
    nativeSwapBuildWitnessIdentity,
  });

  const preparedName = `${PREFIX}-prepared-${transaction.journal.transactionId}.json`;
  const preparedRelativePath = `source-promotions/${preparedName}`;
  const prepared = {
    schemaVersion: SCHEMA.receipt,
    artifactType: SCHEMA.receiptType,
    lifecycle: "prepared",
    applied: false,
    preparedAt: new Date().toISOString(),
    transactionId: transaction.journal.transactionId,
    claim: "source-promotion-only",
    plan: transaction.journal.plan,
    inputArtifacts: {
      universe: preflightEvidence.bundle.plan.inputs.universe,
      reviewLedger: preflightEvidence.bundle.plan.inputs.reviewLedger,
      trustedReviewerRegistry:
        preflightEvidence.bundle.plan.inputs.trustedReviewerRegistry,
      implementationVerificationReceipt:
        preflightEvidence.bundle.plan.inputs.repositoryBaseline
          .implementationVerificationReceipt,
      implementationVerificationCompletion:
        preflightEvidence.bundle.plan.inputs.repositoryBaseline
          .implementationVerificationCompletion,
      quiescenceFirstSnapshotState:
        preflightEvidence.bundle.plan.inputs.quiescenceFirstSnapshotState,
      provisionalPostStateObservation:
        preflightEvidence.bundle.plan.inputs.provisionalPostStateObservation,
      quiescenceSnapshots:
        preflightEvidence.bundle.plan.inputs.quiescenceSnapshots,
      expectedCatalogProfile:
        preflightEvidence.bundle.plan.inputs.expectedCatalogProfile,
    },
    nativeSwapBuildContract:
      preflightEvidence.bundle.plan.executionContract.nativeAtomicSwapHelper,
    nativeSwapBuildWitness,
    nativeSwapBuildWitnessIdentity,
    exactUniverse: {
      records: 620,
      priorDisposition: { ordinary: 551, historicalCustodyHold: 61, placementAliasHold: 8 },
      currentDisposition: { ordinary: 549, historicalCustodyHold: 61, placementAliasHold: 10 },
      currentHolds: 71,
      automaticApprovals: 0,
    },
    exactPromotion: {
      approvedCopyRecords: approved.length,
      withheldRecords: preflightEvidence.bundle.validated.withheld.length,
      copyBytes: copied.copiedBytes,
      recordSetSha256: copied.recordSetSha256,
      workingCopyReceiptSha256: workingCopy.receiptEvidence.sha256,
      approvedClosureSha256,
      withheldClosureSha256,
    },
    expectedCatalogProfile: {
      path: "current-source-profile.json",
      bytes: stagedProfile.bytes,
      sha256: stagedProfile.sha256,
      status: "staged-observed-not-canonical-until-live-postcheck",
    },
    expectedCatalogArtifacts: preflightEvidence.bundle.plan.expectedPostState.catalogArtifacts,
    observedCatalogArtifacts: stagedPostcheck.catalogEvidenceClosure.boundArtifacts,
    stagedVerification: stagedPostcheck,
    catalogPathClosure: {
      baseInventory: preflightEvidence.catalogInventory,
      allowedChangedPaths: [...CATALOG_ALLOWED_CHANGED_PATHS],
      preparedReceipt: {
        path: preparedRelativePath,
        identityBinding: "physical immutable artifact plus transaction journal",
      },
      appliedReceipt: null,
      exactPathSetRequired: true,
    },
    evidenceBoundary: preflightEvidence.bundle.plan.evidenceBoundary,
    reportingGate: {
      canonicalCountsReportable: false,
      observedCanonical: false,
      publicationAllowed: false,
      publicationScope: "canonical-source-inventory-counts-only",
      reason: "prepared receipt precedes both live directory swaps and live postchecks",
    },
    swaps: { source: "pending", catalog: "pending" },
    postchecks: null,
    retainedRecoveryRoots: null,
  };
  const preparedPath = path.join(
    transaction.paths.catalogRecovery,
    "source-promotions",
    preparedName,
  );
  const preparedEvidence = await publishImmutableJsonNoClobber(preparedPath, prepared, {
    mode: 0o444,
    label: "prepared successor receipt",
  });
  await persistJournal(transaction, { phase: "durability-syncing-staged-trees" });
  const [sourceDurability, catalogDurability] = await Promise.all([
    dependencies.syncTree(transaction.paths.sourceRecovery),
    dependencies.syncTree(transaction.paths.catalogRecovery),
  ]);
  const stagedCatalogInventory = await inventoryDirectory(transaction.paths.catalogRecovery);
  const stagedCatalogPathClosure = assertCatalogPathClosure({
    baseInventory: preflightEvidence.catalogInventory,
    currentInventory: stagedCatalogInventory,
    preparedReceipt: {
      path: preparedRelativePath,
      bytes: preparedEvidence.bytes,
      sha256: preparedEvidence.sha256,
    },
  });
  const [stagedSourceRootNode, stagedCatalogRootNode] = await Promise.all([
    snapshotDirectoryNode(transaction.paths.sourceRecovery, "staged source root"),
    snapshotDirectoryNode(transaction.paths.catalogRecovery, "staged catalog root"),
  ]);
  await persistJournal(transaction, {
    phase: "staged-and-verified",
    staged: {
      workingCopy: transaction.journal.workingCopy,
      copied,
      profile: stagedProfile,
      postcheck: stagedPostcheck,
      preparedRelativePath: `source-promotions/${preparedName}`,
      preparedBytes: preparedEvidence.bytes,
      preparedSha256: preparedEvidence.sha256,
      reviewBindings: {
        transactionId: transaction.journal.transactionId,
        planSha256: preflightEvidence.bundle.planEvidence.sha256,
        trustedReviewerRegistrySha256:
          preflightEvidence.bundle.plan.inputs.trustedReviewerRegistry.sha256,
        preparedReceiptSha256: preparedEvidence.sha256,
        stagedManifestSha256: stagedPostcheck.freeze.manifestSha256,
        stagedProfileSha256: stagedProfile.sha256,
        stagedCatalogTreeSha256: stagedCatalogInventory.treeSha256,
        stagedSourceRootNode: stagedSourceRootNode.node,
        stagedCatalogRootNode: stagedCatalogRootNode.node,
        workingCopyReceiptSha256: workingCopy.receiptEvidence.sha256,
        approvedClosureSha256,
        withheldClosureSha256,
        nativeSwapBuildWitnessSha256: nativeSwapBuildWitnessIdentity.sha256,
        nativeSwapExecutableBytes: nativeSwapBuildWitnessIdentity.executableBytes,
        nativeSwapExecutableSha256: nativeSwapBuildWitnessIdentity.executableSha256,
        journalPhase: "awaiting-independent-review",
      },
      stagedCatalogInventory,
      catalogPathClosure: stagedCatalogPathClosure,
      rootNodes: {
        source: stagedSourceRootNode.node,
        catalog: stagedCatalogRootNode.node,
      },
      durability: { source: sourceDurability, catalog: catalogDurability },
    },
  });
  return { prepared, preparedEvidence, stagedPostcheck, stagedCatalogInventory };
}

async function verifyBaseState(configuration, journal, dependencies) {
  const freeze = await dependencies.verifyFreeze(configuration.sourceRoot, {
    catalogRoot: configuration.catalogRoot,
    defaultPaths: configuration.defaultProject,
  });
  invariant(freeze.fileCount === journal.base.freeze.fileCount
    && freeze.totalBytes === journal.base.freeze.totalBytes
    && freeze.manifestSha256 === journal.base.freeze.manifestSha256,
  "Recovered source differs from the journaled base");
  const catalog = await inventoryDirectory(configuration.catalogRoot);
  invariant(catalog.treeSha256 === journal.base.catalogTreeSha256,
    "Recovered catalog differs from the journaled base");
  return { freeze, catalog };
}

function finalReceipt(prepared, {
  transaction,
  sourceSwap,
  catalogSwap,
  livePostcheck,
  reportingPreimage,
}) {
  return {
    ...prepared,
    lifecycle: "final",
    applied: true,
    completedAt: new Date().toISOString(),
    swaps: { source: sourceSwap, catalog: catalogSwap },
    postchecks: { live: livePostcheck },
    catalogPathClosure: {
      ...prepared.catalogPathClosure,
      preparedReceipt: {
        path: transaction.journal.staged.preparedRelativePath,
        bytes: transaction.journal.staged.preparedBytes,
        sha256: transaction.journal.staged.preparedSha256,
      },
      appliedReceipt: {
        path: RECEIPT_RELATIVE.replace(/^catalog\//u, ""),
        identityBinding: "physical immutable artifact plus committed transaction journal",
      },
    },
    reportingGate: {
      canonicalCountsReportable: true,
      observedCanonical: true,
      publicationAllowed: true,
      publicationScope: "canonical-source-inventory-counts-only",
      source: "live rebuilt catalog after freeze/profile/check closure",
      observedPairing: livePostcheck.catalog.observed,
    },
    reportingPreimage,
    retainedRecoveryRoots: {
      source: transaction.paths.sourceRecovery,
      catalog: transaction.paths.catalogRecovery,
      deletionPolicy: "retained; this executor never deletes pre-promotion roots",
    },
  };
}

function assertNativeBuildReceipt(value, expectedContract, label) {
  assertNativeBuildContract(expectedContract, `${label} expected contract`);
  assertObjectKeys(value, [
    "schemaVersion", "source", "compiler", "compile", "executable",
  ], label);
  invariant(value.schemaVersion
    === "help-math-darwin-atomic-directory-swap-native-build/v1",
  `${label} schema changed`);
  assertObjectKeys(value.executable, ["bytes", "sha256"], `${label}.executable`);
  invariant(Number.isSafeInteger(value.executable.bytes)
    && value.executable.bytes > 0
    && SHA256_PATTERN.test(value.executable.sha256),
  `${label} executable identity is invalid`);
  const expectedProjection = {
    source: expectedContract.source,
    compiler: expectedContract.compiler,
    compile: {
      driver: expectedContract.compile.driver,
      sdk: expectedContract.compile.sdk,
      arguments: expectedContract.compile.arguments,
    },
  };
  invariant(isDeepStrictEqual({
    source: value.source,
    compiler: value.compiler,
    compile: value.compile,
  }, expectedProjection), `${label} differs from the frozen plan/toolchain contract`);
  return value;
}

function nativeBuildReceiptIdentity(value, expectedContract,
  label = "native build witness") {
  assertNativeBuildReceipt(value, expectedContract, label);
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  return {
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    executableBytes: value.executable.bytes,
    executableSha256: value.executable.sha256,
  };
}

function assertAtomicSwapReceipt(receipt, {
  allowedParent,
  firstDirectory,
  secondDirectory,
  before,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
  label = "atomic directory swap receipt",
} = {}) {
  assertObjectKeys(receipt, [
    "status", "allowedParent", "firstDirectory", "secondDirectory", "before",
    "after", "native", "nativeSourceSha256", "nativeBuild", "cleanupWarning",
  ], label);
  invariant(receipt.status === "swapped-and-parent-fsynced"
    && path.isAbsolute(receipt.allowedParent)
    && path.isAbsolute(receipt.firstDirectory)
    && path.isAbsolute(receipt.secondDirectory)
    && path.dirname(receipt.firstDirectory) === receipt.allowedParent
    && path.dirname(receipt.secondDirectory) === receipt.allowedParent
    && receipt.firstDirectory !== receipt.secondDirectory,
  `${label} paths or status are invalid`);
  if (allowedParent !== undefined) {
    invariant(receipt.allowedParent === allowedParent
      && receipt.firstDirectory === firstDirectory
      && receipt.secondDirectory === secondDirectory,
    `${label} path binding drift`);
  }
  const validateNode = (node, nodeLabel) => {
    assertObjectKeys(node, ["dev", "ino"], nodeLabel);
    invariant(typeof node.dev === "string" && /^\d+$/.test(node.dev)
      && typeof node.ino === "string" && /^\d+$/.test(node.ino),
    `${nodeLabel} is invalid`);
    return node;
  };
  assertObjectKeys(receipt.before, ["first", "second"], `${label}.before`);
  assertObjectKeys(receipt.after, ["first", "second"], `${label}.after`);
  validateNode(receipt.before.first, `${label}.before.first`);
  validateNode(receipt.before.second, `${label}.before.second`);
  validateNode(receipt.after.first, `${label}.after.first`);
  validateNode(receipt.after.second, `${label}.after.second`);
  invariant(!sameNode(receipt.before.first, receipt.before.second)
    && sameNode(receipt.after.first, receipt.before.second)
    && sameNode(receipt.after.second, receipt.before.first),
  `${label} does not prove an inode exchange`);
  if (before !== undefined) {
    invariant(isDeepStrictEqual(receipt.before, {
      first: before.live,
      second: before.staged,
    }), `${label} pre-swap inode binding drift`);
  }
  assertObjectKeys(receipt.native, ["status", "parentFsynced"], `${label}.native`);
  invariant(receipt.native.status === "swapped"
    && receipt.native.parentFsynced === true
    && SHA256_PATTERN.test(receipt.nativeSourceSha256)
    && (expectedNativeSourceSha256 === undefined
      || receipt.nativeSourceSha256 === expectedNativeSourceSha256)
    && receipt.cleanupWarning === null,
  `${label} native durability/source binding is invalid`);
  assertNativeBuildReceipt(
    receipt.nativeBuild,
    expectedNativeBuildContract,
    `${label}.nativeBuild`,
  );
  invariant(receipt.nativeSourceSha256 === receipt.nativeBuild.source.sha256,
    `${label} native source/build SHA-256 binding drift`);
  if (expectedNativeBuildReceipt !== undefined) {
    assertNativeBuildReceipt(
      expectedNativeBuildReceipt,
      expectedNativeBuildContract,
      `${label}.expectedNativeBuildReceipt`,
    );
    invariant(isDeepStrictEqual(receipt.nativeBuild, expectedNativeBuildReceipt),
      `${label} compiled executable differs from the prepared witness`);
  }
  return receipt;
}

function independentReviewPayloadProjection(value) {
  return {
    schemaVersion: value.schemaVersion,
    artifactType: value.artifactType,
    role: value.role,
    reviewer: value.reviewer,
    reviewedAt: value.reviewedAt,
    decision: value.decision,
    findings: value.findings,
    bindings: value.bindings,
  };
}

function independentReviewPayloadSha256(value) {
  return sha256Bytes(Buffer.from(canonicalJson(
    independentReviewPayloadProjection(value),
  ), "utf8"));
}

function decodeCanonicalBase64(value, label) {
  invariant(typeof value === "string" && value.length > 0
    && /^[A-Za-z0-9+/]+={0,2}$/.test(value), `${label} is not canonical base64`);
  const bytes = Buffer.from(value, "base64");
  invariant(bytes.length > 0 && bytes.toString("base64") === value,
    `${label} is not canonical base64`);
  return bytes;
}

function verifyIndependentReviewCryptographicEnvelope(value, label) {
  assertObjectKeys(value.reviewer, [
    "subjectId", "fullName", "role", "publicKeySpkiSha256",
  ], `${label}.reviewer`);
  invariant(typeof value.reviewer.subjectId === "string"
    && value.reviewer.subjectId.trim() === value.reviewer.subjectId
    && value.reviewer.subjectId.length > 0
    && typeof value.reviewer.fullName === "string"
    && value.reviewer.fullName.trim() === value.reviewer.fullName
    && value.reviewer.fullName.length > 0
    && value.reviewer.role === value.role
    && SHA256_PATTERN.test(value.reviewer.publicKeySpkiSha256),
  `${label} has an invalid reviewer identity`);
  const payloadSha256 = independentReviewPayloadSha256(value);
  invariant(value.signedPayloadSha256 === payloadSha256,
    `${label} signed payload digest drift`);
  const envelope = value.signatureEnvelope;
  assertObjectKeys(envelope, [
    "algorithm", "reviewerSubjectId", "publicKeySpkiSha256", "publicKeySpkiDerBase64",
    "signedPayloadSha256", "signedAt", "signatureBase64",
  ], `${label}.signatureEnvelope`);
  invariant(envelope.algorithm === "Ed25519"
    && envelope.reviewerSubjectId === value.reviewer.subjectId
    && envelope.publicKeySpkiSha256 === value.reviewer.publicKeySpkiSha256
    && envelope.signedPayloadSha256 === payloadSha256
    && Number.isFinite(Date.parse(envelope.signedAt))
    && Date.parse(envelope.signedAt) >= Date.parse(value.reviewedAt),
  `${label} signature envelope identity or timestamp drift`);
  const publicKeyDer = decodeCanonicalBase64(
    envelope.publicKeySpkiDerBase64,
    `${label}.signatureEnvelope.publicKeySpkiDerBase64`,
  );
  invariant(sha256Bytes(publicKeyDer) === value.reviewer.publicKeySpkiSha256,
    `${label} public-key fingerprint drift`);
  let publicKey;
  try {
    publicKey = createPublicKey({ key: publicKeyDer, format: "der", type: "spki" });
  } catch (error) {
    throw new Error(`${label} public key is invalid: ${error.message}`);
  }
  invariant(publicKey.asymmetricKeyType === "ed25519",
    `${label} public key is not Ed25519`);
  const signature = decodeCanonicalBase64(
    envelope.signatureBase64,
    `${label}.signatureEnvelope.signatureBase64`,
  );
  invariant(verifyCryptographicSignature(
    null,
    Buffer.from(payloadSha256, "utf8"),
    publicKey,
    signature,
  ), `${label} detached Ed25519 signature is invalid`);
  return {
    payloadSha256,
    publicKeySpkiSha256: value.reviewer.publicKeySpkiSha256,
    signatureSha256: sha256Bytes(signature),
  };
}

async function verifyIndependentPreparedReviews(configuration, transaction, preflightEvidence) {
  invariant(transaction.journal.phase === "awaiting-independent-review",
    "Independent prepared reviews require the awaiting-independent-review journal phase");
  const reviewRoot = path.join(configuration.activeRoot, "independent-reviews");
  invariant(await pathKind(reviewRoot) === "directory",
    "Prepared transaction lacks the independent-review directory");
  const entries = (await readdir(reviewRoot, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  invariant(entries.length === 2
    && entries.every((entry) => entry.isFile() && entry.name.endsWith(".json")),
  "Prepared transaction requires exactly two immutable independent-review JSON receipts");
  const preparedPath = path.join(
    transaction.paths.catalogRecovery,
    transaction.journal.staged.preparedRelativePath,
  );
  const preparedEvidence = await inspectRegularFileNoFollow(preparedPath, {
    expectedSha256: transaction.journal.staged.preparedSha256,
    requireSingleLink: true,
    requireReadOnly: true,
  });
  const preparedValue = await readJsonArtifactNoFollow(preparedPath, {
    expectedBytes: preparedEvidence.bytes,
    expectedSha256: preparedEvidence.sha256,
    requireSingleLink: true,
    requireReadOnly: true,
  });
  const preparedAt = Date.parse(preparedValue.value.preparedAt);
  const preparedNativeWitnessIdentity = nativeBuildReceiptIdentity(
    preparedValue.value.nativeSwapBuildWitness,
    preparedValue.value.nativeSwapBuildContract,
    "prepared receipt native swap build witness",
  );
  invariant(isDeepStrictEqual(
    preparedNativeWitnessIdentity,
    preparedValue.value.nativeSwapBuildWitnessIdentity,
  ) && isDeepStrictEqual(
    preparedValue.value.nativeSwapBuildWitness,
    transaction.journal.nativeSwapBuildWitness,
  ) && isDeepStrictEqual(
    preparedValue.value.nativeSwapBuildWitnessIdentity,
    transaction.journal.nativeSwapBuildWitnessIdentity,
  ), "Prepared native-helper witness differs from the transaction journal");
  const reviewOpenedAt = Date.parse(transaction.journal.independentReview?.openedAt);
  invariant(Number.isFinite(preparedAt) && Number.isFinite(reviewOpenedAt)
    && reviewOpenedAt >= preparedAt,
  "Independent-review journal lacks a fresh prepared-review opening timestamp");
  const currentStagedCatalogInventory = await inventoryDirectory(
    transaction.paths.catalogRecovery,
  );
  invariant(currentStagedCatalogInventory.treeSha256
    === transaction.journal.staged.stagedCatalogInventory.treeSha256,
  "Staged catalog tree changed after prepared review boundary");
  const requiredRoles = new Set(["schema-reviewer", "transaction-adversarial-reviewer"]);
  const expectedBindings = transaction.journal.staged.reviewBindings;
  assertObjectKeys(expectedBindings, [
    "transactionId", "planSha256", "trustedReviewerRegistrySha256",
    "preparedReceiptSha256", "stagedManifestSha256",
    "stagedProfileSha256", "stagedCatalogTreeSha256", "workingCopyReceiptSha256",
    "stagedSourceRootNode", "stagedCatalogRootNode", "approvedClosureSha256",
    "withheldClosureSha256", "nativeSwapBuildWitnessSha256",
    "nativeSwapExecutableBytes", "nativeSwapExecutableSha256", "journalPhase",
  ], "journaled independent-review bindings");
  const receipts = [];
  for (const entry of entries) {
    const file = await readJsonArtifactNoFollow(path.join(reviewRoot, entry.name), {
      requireSingleLink: true,
      requireReadOnly: true,
    });
    const value = file.value;
    assertObjectKeys(value, [
      "schemaVersion", "artifactType", "role", "reviewer", "reviewedAt",
      "decision", "findings", "bindings", "signedPayloadSha256", "signatureEnvelope",
    ], `Independent prepared review ${entry.name}`);
    invariant(value.schemaVersion
      === "help-math-fla-swf-counterpart-prepared-independent-review/v1"
      && value.artifactType
        === "help-math-fla-swf-counterpart-prepared-independent-review",
    `Wrong prepared-review schema/type: ${entry.name}`);
    invariant(value.decision === "FINAL_GO",
      `Independent prepared review is not FINAL_GO: ${entry.name}`);
    invariant(requiredRoles.has(value.role),
      `Independent prepared review has an invalid role: ${entry.name}`);
    assertObjectKeys(value.findings, ["P0", "P1", "P2"],
      `Independent prepared review findings ${entry.name}`);
    invariant(value.findings?.P0 === 0 && value.findings?.P1 === 0 && value.findings?.P2 === 0,
      `Independent prepared review has P0/P1/P2 findings: ${entry.name}`);
    invariant(Number.isFinite(Date.parse(value.reviewedAt))
      && Date.parse(value.reviewedAt) >= preparedAt
      && Date.parse(value.reviewedAt) >= reviewOpenedAt,
    `Independent prepared review is invalid or stale: ${entry.name}`);
    assertObjectKeys(value.bindings, Object.keys(expectedBindings),
      `Independent prepared review bindings ${entry.name}`);
    invariant(isDeepStrictEqual(value.bindings, expectedBindings)
      && value.bindings.transactionId === transaction.journal.transactionId
      && value.bindings.planSha256 === preflightEvidence.bundle.planEvidence.sha256
      && value.bindings.trustedReviewerRegistrySha256
        === preflightEvidence.bundle.plan.inputs.trustedReviewerRegistry.sha256
      && value.bindings.preparedReceiptSha256 === preparedEvidence.sha256
      && value.bindings.stagedManifestSha256
        === transaction.journal.staged.postcheck.freeze.manifestSha256
      && value.bindings.stagedProfileSha256
        === transaction.journal.staged.profile.sha256
      && value.bindings.stagedCatalogTreeSha256
        === currentStagedCatalogInventory.treeSha256
      && value.bindings.workingCopyReceiptSha256
        === transaction.journal.workingCopy.receiptSha256
      && value.bindings.nativeSwapBuildWitnessSha256
        === transaction.journal.nativeSwapBuildWitnessIdentity.sha256
      && value.bindings.nativeSwapExecutableBytes
        === transaction.journal.nativeSwapBuildWitness.executable.bytes
      && value.bindings.nativeSwapExecutableSha256
        === transaction.journal.nativeSwapBuildWitness.executable.sha256
      && value.bindings.journalPhase === "awaiting-independent-review",
    `Independent prepared review binding drift: ${entry.name}`);
    const signature = verifyIndependentReviewCryptographicEnvelope(
      value,
      `Independent prepared review ${entry.name}`,
    );
    const registry = preflightEvidence.bundle.validated.trustedReviewerRegistry;
    invariant(registry && registry.identity.sha256
      === value.bindings.trustedReviewerRegistrySha256,
    `Independent prepared review registry binding drift: ${entry.name}`);
    const builder = await import("./build-fla-swf-counterpart-successor-plan.mjs");
    invariant(typeof builder.assertReviewerAuthorizedByRegistry === "function",
      "Trusted-reviewer authorization validator is unavailable");
    builder.assertReviewerAuthorizedByRegistry(
      value.reviewer,
      registry,
      `Independent prepared reviewer ${entry.name}`,
    );
    receipts.push({ name: entry.name, value, evidence: file.evidence });
    receipts[receipts.length - 1].signature = signature;
  }
  invariant(new Set(receipts.map(({ value }) => value.reviewer.subjectId)).size === 2,
    "Independent prepared reviews must come from two distinct reviewer subjects");
  invariant(new Set(receipts.map(({ signature }) => signature.publicKeySpkiSha256)).size === 2,
    "Independent prepared reviews must use two distinct Ed25519 public keys");
  invariant(new Set(receipts.map(({ value }) => value.role)).size === 2
    && receipts.every(({ value }) => requiredRoles.has(value.role)),
  "Independent prepared reviews must include exactly one required reviewer role each");
  return receipts.map(({ name, value, evidence, signature }) => ({
    name,
    role: value.role,
    reviewerSubjectId: value.reviewer.subjectId,
    reviewerFullName: value.reviewer.fullName,
    publicKeySpkiSha256: signature.publicKeySpkiSha256,
    reviewedAt: value.reviewedAt,
    bytes: evidence.bytes,
    sha256: evidence.sha256,
    signedPayloadSha256: signature.payloadSha256,
    signatureSha256: signature.signatureSha256,
    findings: value.findings,
  }));
}

function assertCatalogInventorySelfConsistent(inventory, label) {
  assertObjectKeys(inventory, ["fileCount", "totalBytes", "treeSha256", "records"], label);
  invariant(Array.isArray(inventory.records), `${label}.records must be an array`);
  const records = inventory.records.map((record, index) => {
    assertObjectKeys(record, ["path", "bytes", "sha256"], `${label}.records[${index}]`);
    portableRelativePath(record.path, `${label}.records[${index}].path`);
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256_PATTERN.test(record.sha256),
    `${label}.records[${index}] has an invalid identity`);
    return record;
  });
  invariant(new Set(records.map((record) => record.path)).size === records.length,
    `${label} contains duplicate paths`);
  invariant(isDeepStrictEqual(records.map((record) => record.path),
    records.map((record) => record.path).sort(compareText)),
  `${label}.records are not in deterministic path order`);
  invariant(inventory.fileCount === records.length
    && inventory.totalBytes === records.reduce((sum, record) => sum + record.bytes, 0)
    && inventory.treeSha256 === sha256Bytes(Buffer.from(records
      .map((record) => `${record.path}\t${record.bytes}\t${record.sha256}\n`)
      .join(""), "utf8")),
  `${label} counts or tree SHA-256 are not self-consistent`);
  return inventory;
}

function expectedFinalInputArtifacts(plan) {
  return {
    universe: plan.inputs.universe,
    reviewLedger: plan.inputs.reviewLedger,
    trustedReviewerRegistry: plan.inputs.trustedReviewerRegistry,
    implementationVerificationReceipt:
      plan.inputs.repositoryBaseline.implementationVerificationReceipt,
    implementationVerificationCompletion:
      plan.inputs.repositoryBaseline.implementationVerificationCompletion,
    quiescenceFirstSnapshotState: plan.inputs.quiescenceFirstSnapshotState,
    provisionalPostStateObservation: plan.inputs.provisionalPostStateObservation,
    quiescenceSnapshots: plan.inputs.quiescenceSnapshots,
    expectedCatalogProfile: plan.inputs.expectedCatalogProfile,
  };
}

function assertPreparedReceiptBundleBindings(receipt, receiptEvidence,
  preflightEvidence, transaction) {
  const bundle = preflightEvidence?.bundle;
  const plan = bundle?.plan;
  const approved = bundle?.validated?.approved;
  const withheld = bundle?.validated?.withheld;
  const byId = bundle?.validated?.byId;
  invariant(plan && Array.isArray(approved) && Array.isArray(withheld)
    && byId instanceof Map,
  "Prepared receipt verification requires the fully validated executable bundle");
  invariant(transaction?.journal?.staged,
    "Prepared receipt verification requires the staged transaction journal");
  const journal = transaction.journal;
  const withheldUniverseRecords = withheld.map((record) => byId.get(record.recordId));

  assertObjectKeys(receipt, [
    "schemaVersion", "artifactType", "lifecycle", "applied", "preparedAt",
    "transactionId", "claim", "plan", "inputArtifacts", "nativeSwapBuildContract",
    "nativeSwapBuildWitness", "nativeSwapBuildWitnessIdentity", "exactUniverse",
    "exactPromotion", "expectedCatalogProfile", "expectedCatalogArtifacts",
    "observedCatalogArtifacts", "stagedVerification", "catalogPathClosure",
    "evidenceBoundary", "reportingGate", "swaps", "postchecks",
    "retainedRecoveryRoots",
  ], "Prepared receipt");
  invariant(receipt.schemaVersion === SCHEMA.receipt
    && receipt.artifactType === SCHEMA.receiptType
    && receipt.lifecycle === "prepared"
    && receipt.applied === false
    && receipt.claim === "source-promotion-only"
    && receipt.transactionId === journal.transactionId
    && /^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/.test(receipt.transactionId)
    && Number.isFinite(Date.parse(receipt.preparedAt)),
  "Prepared successor receipt has an invalid identity");
  assertObjectKeys(receipt.plan, ["path", "bytes", "sha256"], "Prepared receipt plan");
  invariant(isDeepStrictEqual(receipt.plan, {
    path: PLAN_RELATIVE,
    bytes: bundle.planEvidence.bytes,
    sha256: bundle.planEvidence.sha256,
  }) && isDeepStrictEqual(receipt.plan, journal.plan),
  "Prepared receipt plan binding drift");
  invariant(isDeepStrictEqual(receipt.inputArtifacts, expectedFinalInputArtifacts(plan)),
    "Prepared receipt input-artifact binding drift");
  invariant(isDeepStrictEqual(
    receipt.inputArtifacts.implementationVerificationCompletion,
    journal.base.implementationVerificationCompletion,
  ), "Prepared receipt implementation-baseline completion journal binding drift");

  assertNativeBuildContract(receipt.nativeSwapBuildContract,
    "Prepared receipt native swap build contract");
  invariant(isDeepStrictEqual(receipt.nativeSwapBuildContract,
    plan.executionContract.nativeAtomicSwapHelper)
    && isDeepStrictEqual(receipt.nativeSwapBuildContract,
      journal.base.nativeSwapBuildContract),
  "Prepared receipt native build contract drift");
  const nativeWitnessIdentity = nativeBuildReceiptIdentity(
    receipt.nativeSwapBuildWitness,
    receipt.nativeSwapBuildContract,
    "Prepared receipt native swap build witness",
  );
  invariant(isDeepStrictEqual(nativeWitnessIdentity,
    receipt.nativeSwapBuildWitnessIdentity)
    && isDeepStrictEqual(receipt.nativeSwapBuildWitness,
      journal.nativeSwapBuildWitness)
    && isDeepStrictEqual(receipt.nativeSwapBuildWitnessIdentity,
      journal.nativeSwapBuildWitnessIdentity),
  "Prepared receipt native build witness drift");

  assertObjectKeys(receipt.exactUniverse, [
    "records", "priorDisposition", "currentDisposition", "currentHolds",
    "automaticApprovals",
  ], "Prepared receipt exactUniverse");
  invariant(isDeepStrictEqual(receipt.exactUniverse, {
    records: 620,
    priorDisposition: { ordinary: 551, historicalCustodyHold: 61, placementAliasHold: 8 },
    currentDisposition: { ordinary: 549, historicalCustodyHold: 61, placementAliasHold: 10 },
    currentHolds: 71,
    automaticApprovals: 0,
  }), "Prepared receipt exact-universe binding drift");
  assertObjectKeys(receipt.exactPromotion, [
    "approvedCopyRecords", "withheldRecords", "copyBytes", "recordSetSha256",
    "workingCopyReceiptSha256", "approvedClosureSha256", "withheldClosureSha256",
  ], "Prepared receipt exactPromotion");
  invariant(receipt.exactPromotion.approvedCopyRecords === approved.length
    && receipt.exactPromotion.withheldRecords === withheld.length
    && receipt.exactPromotion.copyBytes
      === approved.reduce((sum, record) => sum + record.bytes, 0)
    && receipt.exactPromotion.recordSetSha256 === promotionRecordSetSha256(approved)
    && receipt.exactPromotion.workingCopyReceiptSha256
      === journal.workingCopy.receiptSha256
    && receipt.exactPromotion.approvedClosureSha256
      === recordIdentityClosureSha256(approved)
    && receipt.exactPromotion.withheldClosureSha256
      === recordIdentityClosureSha256(withheldUniverseRecords),
  "Prepared receipt exact-promotion binding drift");

  assertObjectKeys(receipt.expectedCatalogProfile, [
    "path", "bytes", "sha256", "status",
  ], "Prepared receipt expectedCatalogProfile");
  invariant(isDeepStrictEqual(receipt.expectedCatalogProfile, {
    path: "current-source-profile.json",
    bytes: bundle.profile.reference.bytes,
    sha256: bundle.profile.reference.sha256,
    status: "staged-observed-not-canonical-until-live-postcheck",
  }), "Prepared receipt expected-profile binding drift");
  invariant(isDeepStrictEqual(receipt.expectedCatalogArtifacts,
    plan.expectedPostState.catalogArtifacts)
    && isDeepStrictEqual(receipt.observedCatalogArtifacts,
      plan.expectedPostState.catalogArtifacts)
    && isDeepStrictEqual(receipt.stagedVerification, journal.staged.postcheck)
    && receipt.stagedVerification?.freeze?.fileCount
      === plan.expectedPostState.source.fileCount
    && receipt.stagedVerification?.freeze?.totalBytes
      === plan.expectedPostState.source.totalBytes
    && receipt.stagedVerification?.freeze?.manifestSha256
      === plan.expectedPostState.source.manifestSha256
    && isDeepStrictEqual(receipt.stagedVerification?.catalogEvidenceClosure?.boundArtifacts,
      plan.expectedPostState.catalogArtifacts),
  "Prepared receipt staged post-state binding drift");

  assertObjectKeys(receipt.catalogPathClosure, [
    "baseInventory", "allowedChangedPaths", "preparedReceipt", "appliedReceipt",
    "exactPathSetRequired",
  ], "Prepared receipt catalogPathClosure");
  assertCatalogInventorySelfConsistent(receipt.catalogPathClosure.baseInventory,
    "Prepared receipt base catalog inventory");
  assertObjectKeys(receipt.catalogPathClosure.preparedReceipt,
    ["path", "identityBinding"], "Prepared receipt catalogPathClosure.preparedReceipt");
  invariant(isDeepStrictEqual(receipt.catalogPathClosure.baseInventory,
    journal.staged.catalogPathClosure.baseInventory)
    && isDeepStrictEqual(receipt.catalogPathClosure.allowedChangedPaths,
      CATALOG_ALLOWED_CHANGED_PATHS)
    && receipt.catalogPathClosure.preparedReceipt.path
      === journal.staged.preparedRelativePath
    && receipt.catalogPathClosure.preparedReceipt.identityBinding
      === "physical immutable artifact plus transaction journal"
    && receipt.catalogPathClosure.appliedReceipt === null
    && receipt.catalogPathClosure.exactPathSetRequired === true,
  "Prepared receipt catalog-path closure drift");

  invariant(isDeepStrictEqual(receipt.evidenceBoundary, plan.evidenceBoundary),
    "Prepared receipt evidence boundary drift");
  const acceptanceEffects = receipt.evidenceBoundary?.acceptanceEffects;
  invariant(acceptanceEffects && Object.keys(acceptanceEffects).length > 0
    && Object.values(acceptanceEffects).every((value) => value === false),
  "Prepared receipt expands a product/runtime/release acceptance boundary");
  assertObjectKeys(receipt.reportingGate, [
    "canonicalCountsReportable", "observedCanonical", "publicationAllowed",
    "publicationScope", "reason",
  ], "Prepared receipt reportingGate");
  invariant(receipt.reportingGate.canonicalCountsReportable === false
    && receipt.reportingGate.observedCanonical === false
    && receipt.reportingGate.publicationAllowed === false
    && receipt.reportingGate.publicationScope
      === "canonical-source-inventory-counts-only"
    && typeof receipt.reportingGate.reason === "string"
    && receipt.reportingGate.reason.length > 0,
  "Prepared receipt reporting gate changed");
  assertObjectKeys(receipt.swaps, ["source", "catalog"], "Prepared receipt swaps");
  invariant(receipt.swaps.source === "pending" && receipt.swaps.catalog === "pending"
    && receipt.postchecks === null && receipt.retainedRecoveryRoots === null,
  "Prepared receipt claims a swap, postcheck, or retained recovery root prematurely");

  invariant(Number.isSafeInteger(receiptEvidence?.bytes) && receiptEvidence.bytes > 0
    && SHA256_PATTERN.test(receiptEvidence.sha256)
    && receiptEvidence.bytes === journal.staged.preparedBytes
    && receiptEvidence.sha256 === journal.staged.preparedSha256,
  "Prepared receipt physical/journal identity drift");
  return receipt;
}

async function readAndValidatePreparedReceipt(configuration, preflightEvidence,
  transaction) {
  const prepared = await readJsonArtifactNoFollow(
    path.join(
      transaction.paths.catalogRecovery,
      transaction.journal.staged.preparedRelativePath,
    ),
    {
      expectedBytes: transaction.journal.staged.preparedBytes,
      expectedSha256: transaction.journal.staged.preparedSha256,
      requireSingleLink: true,
      requireReadOnly: true,
    },
  );
  assertPreparedReceiptBundleBindings(
    prepared.value,
    prepared.evidence,
    preflightEvidence,
    transaction,
  );
  return prepared;
}

function assertIndependentReviewSummaries(reviews, label) {
  invariant(Array.isArray(reviews) && reviews.length === 2,
    `${label} must contain exactly two reviews`);
  const roles = new Set();
  const subjects = new Set();
  for (const [index, review] of reviews.entries()) {
    assertObjectKeys(review, [
      "name", "role", "reviewerSubjectId", "reviewerFullName", "publicKeySpkiSha256",
      "reviewedAt", "bytes", "sha256", "signedPayloadSha256", "signatureSha256", "findings",
    ], `${label}[${index}]`);
    portableRelativePath(review.name, `${label}[${index}].name`);
    invariant(["schema-reviewer", "transaction-adversarial-reviewer"].includes(review.role),
      `${label}[${index}] has an invalid role`);
    invariant(typeof review.reviewerSubjectId === "string"
      && review.reviewerSubjectId.length > 0
      && typeof review.reviewerFullName === "string"
      && review.reviewerFullName.length > 0
      && SHA256_PATTERN.test(review.publicKeySpkiSha256)
      && Number.isFinite(Date.parse(review.reviewedAt))
      && Number.isSafeInteger(review.bytes) && review.bytes > 0
      && SHA256_PATTERN.test(review.sha256)
      && SHA256_PATTERN.test(review.signedPayloadSha256)
      && SHA256_PATTERN.test(review.signatureSha256),
    `${label}[${index}] has an invalid reviewer or artifact identity`);
    assertObjectKeys(review.findings, ["P0", "P1", "P2"], `${label}[${index}].findings`);
    invariant(review.findings.P0 === 0 && review.findings.P1 === 0
      && review.findings.P2 === 0,
    `${label}[${index}] has unresolved findings`);
    roles.add(review.role);
    subjects.add(review.reviewerSubjectId);
  }
  invariant(roles.size === 2 && subjects.size === 2,
    `${label} must contain distinct roles and reviewer subjects`);
  invariant(new Set(reviews.map((review) => review.publicKeySpkiSha256)).size === 2,
    `${label} must contain distinct reviewer public keys`);
  return reviews;
}

function assertFinalReceiptBundleBindings(receipt, receiptEvidence, preflightEvidence,
  configuration) {
  const bundle = preflightEvidence.bundle;
  const nativeSwapSourceSha256 = expectedNativeSwapSourceSha256(bundle);
  const plan = bundle.plan;
  const approved = bundle.validated.approved;
  const withheldUniverseRecords = bundle.validated.withheld
    .map((record) => bundle.validated.byId.get(record.recordId));
  assertObjectKeys(receipt, [
    "schemaVersion", "artifactType", "lifecycle", "applied", "preparedAt", "transactionId", "claim",
    "plan", "inputArtifacts", "exactUniverse", "exactPromotion", "expectedCatalogProfile",
    "expectedCatalogArtifacts", "observedCatalogArtifacts", "stagedVerification",
    "catalogPathClosure", "evidenceBoundary", "reportingGate", "reportingPreimage",
    "swaps", "postchecks", "retainedRecoveryRoots", "completedAt",
    "independentPreparedReviews", "nativeSwapBuildContract", "nativeSwapBuildWitness",
    "nativeSwapBuildWitnessIdentity",
  ], "Applied receipt");
  invariant(receipt.schemaVersion === SCHEMA.receipt
    && receipt.artifactType === SCHEMA.receiptType
    && receipt.lifecycle === "final"
    && receipt.applied === true
    && receipt.claim === "source-promotion-only"
    && /^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/.test(receipt.transactionId)
    && Number.isFinite(Date.parse(receipt.preparedAt))
    && Number.isFinite(Date.parse(receipt.completedAt))
    && Date.parse(receipt.completedAt) >= Date.parse(receipt.preparedAt),
  "Applied successor receipt has an invalid final identity");
  assertObjectKeys(receipt.plan, ["path", "bytes", "sha256"], "Applied receipt plan");
  invariant(isDeepStrictEqual(receipt.plan, {
    path: PLAN_RELATIVE,
    bytes: bundle.planEvidence.bytes,
    sha256: bundle.planEvidence.sha256,
  }), "Applied receipt plan binding drift");
  invariant(isDeepStrictEqual(receipt.inputArtifacts, expectedFinalInputArtifacts(plan)),
    "Applied receipt universe/review/provisional/quiescence input binding drift");
  assertNativeBuildContract(receipt.nativeSwapBuildContract,
    "Applied receipt native swap build contract");
  invariant(isDeepStrictEqual(
    receipt.nativeSwapBuildContract,
    plan.executionContract.nativeAtomicSwapHelper,
  ), "Applied receipt native build contract differs from the executable plan");
  const observedWitnessIdentity = nativeBuildReceiptIdentity(
    receipt.nativeSwapBuildWitness,
    receipt.nativeSwapBuildContract,
    "Applied receipt native swap build witness",
  );
  invariant(isDeepStrictEqual(
    observedWitnessIdentity,
    receipt.nativeSwapBuildWitnessIdentity,
  ), "Applied receipt native swap build witness identity drift");
  assertObjectKeys(receipt.exactUniverse, [
    "records", "priorDisposition", "currentDisposition", "currentHolds",
    "automaticApprovals",
  ], "Applied receipt exactUniverse");
  invariant(isDeepStrictEqual(receipt.exactUniverse, {
    records: 620,
    priorDisposition: { ordinary: 551, historicalCustodyHold: 61, placementAliasHold: 8 },
    currentDisposition: { ordinary: 549, historicalCustodyHold: 61, placementAliasHold: 10 },
    currentHolds: 71,
    automaticApprovals: 0,
  }), "Applied receipt exact-universe binding drift");
  assertObjectKeys(receipt.exactPromotion, [
    "approvedCopyRecords", "withheldRecords", "copyBytes", "recordSetSha256",
    "workingCopyReceiptSha256", "approvedClosureSha256", "withheldClosureSha256",
  ], "Applied receipt exactPromotion");
  invariant(receipt.exactPromotion.approvedCopyRecords === approved.length
    && receipt.exactPromotion.withheldRecords === bundle.validated.withheld.length
    && receipt.exactPromotion.copyBytes
      === approved.reduce((sum, record) => sum + record.bytes, 0)
    && receipt.exactPromotion.recordSetSha256 === promotionRecordSetSha256(approved)
    && SHA256_PATTERN.test(receipt.exactPromotion.workingCopyReceiptSha256)
    && receipt.exactPromotion.approvedClosureSha256
      === recordIdentityClosureSha256(approved)
    && receipt.exactPromotion.withheldClosureSha256
      === recordIdentityClosureSha256(withheldUniverseRecords),
  "Applied receipt exact-promotion closure drift");
  assertObjectKeys(receipt.expectedCatalogProfile, [
    "path", "bytes", "sha256", "status",
  ], "Applied receipt expectedCatalogProfile");
  invariant(isDeepStrictEqual(receipt.expectedCatalogProfile, {
    path: "current-source-profile.json",
    bytes: bundle.profile.reference.bytes,
    sha256: bundle.profile.reference.sha256,
    status: "staged-observed-not-canonical-until-live-postcheck",
  }), "Applied receipt expected-profile binding drift");
  invariant(isDeepStrictEqual(receipt.expectedCatalogArtifacts,
    plan.expectedPostState.catalogArtifacts)
    && isDeepStrictEqual(receipt.observedCatalogArtifacts,
      plan.expectedPostState.catalogArtifacts),
  "Applied receipt expected/observed catalog-artifact closure drift");
  invariant(isDeepStrictEqual(receipt.evidenceBoundary, plan.evidenceBoundary),
    "Applied receipt evidence boundary differs from the executable plan");
  invariant(receipt.stagedVerification?.freeze?.fileCount
      === plan.expectedPostState.source.fileCount
    && receipt.stagedVerification?.freeze?.totalBytes
      === plan.expectedPostState.source.totalBytes
    && receipt.stagedVerification?.freeze?.manifestSha256
      === plan.expectedPostState.source.manifestSha256
    && isDeepStrictEqual(receipt.stagedVerification?.catalogEvidenceClosure?.boundArtifacts,
      plan.expectedPostState.catalogArtifacts),
  "Applied receipt staged post-state binding drift");
  assertCatalogInventorySelfConsistent(
    receipt.catalogPathClosure?.baseInventory,
    "Applied receipt base catalog inventory",
  );
  assertObjectKeys(receipt.catalogPathClosure, [
    "baseInventory", "allowedChangedPaths", "preparedReceipt", "appliedReceipt",
    "exactPathSetRequired",
  ], "Applied receipt catalogPathClosure");
  assertObjectKeys(receipt.catalogPathClosure.preparedReceipt,
    ["path", "bytes", "sha256"],
    "Applied receipt catalogPathClosure.preparedReceipt");
  assertObjectKeys(receipt.catalogPathClosure.appliedReceipt,
    ["path", "identityBinding"],
    "Applied receipt catalogPathClosure.appliedReceipt");
  invariant(isDeepStrictEqual(receipt.catalogPathClosure.allowedChangedPaths,
    CATALOG_ALLOWED_CHANGED_PATHS)
    && receipt.catalogPathClosure.exactPathSetRequired === true
    && receipt.catalogPathClosure.preparedReceipt?.path
      === `source-promotions/${PREFIX}-prepared-${receipt.transactionId}.json`
    && Number.isSafeInteger(receipt.catalogPathClosure.preparedReceipt?.bytes)
    && SHA256_PATTERN.test(receipt.catalogPathClosure.preparedReceipt?.sha256)
    && receipt.catalogPathClosure.appliedReceipt?.path
      === RECEIPT_RELATIVE.replace(/^catalog\//u, "")
    && receipt.catalogPathClosure.appliedReceipt?.identityBinding
      === "physical immutable artifact plus committed transaction journal",
  "Applied receipt catalog closure binding drift");
  assertObjectKeys(receipt.reportingGate, [
    "canonicalCountsReportable", "observedCanonical", "publicationAllowed",
    "publicationScope", "source", "observedPairing",
  ], "Applied receipt reportingGate");
  invariant(receipt.reportingGate?.canonicalCountsReportable === true
    && receipt.reportingGate?.observedCanonical === true
    && receipt.reportingGate?.publicationAllowed === true
    && receipt.reportingGate?.publicationScope
      === "canonical-source-inventory-counts-only"
    && receipt.reportingGate.source
      === "live rebuilt catalog after freeze/profile/check closure"
    && isDeepStrictEqual(receipt.reportingGate.observedPairing,
      receipt.postchecks?.live?.catalog?.observed),
  "Applied receipt lacks the exact canonical observation/publication gate");
  assertObjectKeys(receipt.reportingPreimage, [
    "liveReadme", "retainedBaseBackup", "exchangeSemantics",
  ], "Applied receipt reportingPreimage");
  assertObjectKeys(receipt.reportingPreimage.liveReadme, [
    "path", "bytes", "sha256", "mode", "node",
  ], "Applied receipt reportingPreimage.liveReadme");
  assertObjectKeys(receipt.reportingPreimage.liveReadme.node,
    ["dev", "ino"], "Applied receipt reportingPreimage.liveReadme.node");
  assertObjectKeys(receipt.reportingPreimage.retainedBaseBackup, [
    "path", "bytes", "sha256", "mode", "nlink", "node",
    "distinctFromExpectedBaseInode", "retentionPolicy",
  ], "Applied receipt reportingPreimage.retainedBaseBackup");
  assertObjectKeys(receipt.reportingPreimage.retainedBaseBackup.node,
    ["dev", "ino"], "Applied receipt reportingPreimage.retainedBaseBackup.node");
  const expectedReadme = preflightEvidence.currentReadme
    ?? receipt.reportingPreimage.liveReadme;
  invariant(isDeepStrictEqual(receipt.reportingPreimage.liveReadme, {
    path: "README.md",
    bytes: expectedReadme.bytes,
    sha256: expectedReadme.sha256,
    mode: expectedReadme.mode,
    node: expectedReadme.node,
  })
    && receipt.reportingPreimage.retainedBaseBackup.path
      === readmeBaseBackupRelativePath(receipt.transactionId)
    && receipt.reportingPreimage.retainedBaseBackup.bytes === expectedReadme.bytes
    && receipt.reportingPreimage.retainedBaseBackup.sha256 === expectedReadme.sha256
    && receipt.reportingPreimage.retainedBaseBackup.mode === 0o444
    && receipt.reportingPreimage.retainedBaseBackup.nlink === 1
    && receipt.reportingPreimage.retainedBaseBackup.distinctFromExpectedBaseInode === true
    && !sameNode(receipt.reportingPreimage.retainedBaseBackup.node, expectedReadme.node)
    && receipt.reportingPreimage.retainedBaseBackup.retentionPolicy
      === "retained; this executor never deletes the transaction-bound README base backup"
    && receipt.reportingPreimage.exchangeSemantics
      === "pathname exchange after an independently retained base preimage; an indeterminate final race is forward-only manual reconciliation, not a kernel inode CAS",
  "Applied receipt README reporting-preimage binding drift");
  const acceptanceEffects = receipt.evidenceBoundary?.acceptanceEffects;
  invariant(acceptanceEffects && Object.keys(acceptanceEffects).length > 0
    && Object.values(acceptanceEffects).every((value) => value === false),
  "Applied receipt expands a product/runtime/release acceptance boundary");
  assertObjectKeys(receipt.swaps, ["source", "catalog"], "Applied receipt swaps");
  assertAtomicSwapReceipt(receipt.swaps?.source, {
    label: "Applied receipt source swap",
    expectedNativeSourceSha256: nativeSwapSourceSha256,
    expectedNativeBuildContract: receipt.nativeSwapBuildContract,
    expectedNativeBuildReceipt: receipt.nativeSwapBuildWitness,
  });
  assertAtomicSwapReceipt(receipt.swaps?.catalog, {
    label: "Applied receipt catalog swap",
    expectedNativeSourceSha256: nativeSwapSourceSha256,
    expectedNativeBuildContract: receipt.nativeSwapBuildContract,
    expectedNativeBuildReceipt: receipt.nativeSwapBuildWitness,
  });
  invariant(isDeepStrictEqual(
    receipt.swaps.source.nativeBuild,
    receipt.swaps.catalog.nativeBuild,
  ), "Applied receipt source/catalog swaps used different compiled helper bytes");
  assertObjectKeys(receipt.postchecks, ["live"], "Applied receipt postchecks");
  invariant(receipt.postchecks.live && typeof receipt.postchecks.live === "object",
    "Applied receipt lacks live postchecks");
  assertIndependentReviewSummaries(
    receipt.independentPreparedReviews,
    "Applied receipt independent prepared reviews",
  );
  const retained = transactionPaths({
    sourceRoot: configuration.sourceRoot,
    catalogRoot: configuration.catalogRoot,
    activeRoot: configuration.activeRoot,
  }, receipt.transactionId);
  assertObjectKeys(receipt.retainedRecoveryRoots, [
    "source", "catalog", "deletionPolicy",
  ], "Applied receipt retainedRecoveryRoots");
  invariant(receipt.retainedRecoveryRoots?.source === retained.sourceRecovery
    && receipt.retainedRecoveryRoots?.catalog === retained.catalogRecovery
    && receipt.retainedRecoveryRoots?.deletionPolicy
      === "retained; this executor never deletes pre-promotion roots",
  "Applied receipt retained-recovery-root binding drift");
  invariant(Number.isSafeInteger(receiptEvidence.bytes) && receiptEvidence.bytes > 0
    && SHA256_PATTERN.test(receiptEvidence.sha256),
  "Applied receipt physical identity is invalid");
  return receipt;
}

function assertFinalReceiptJournalBindings(receipt, receiptEvidence, transaction) {
  const journal = transaction?.journal;
  invariant(journal && transaction.paths, "Final receipt journal verification requires context");
  invariant(SHA256_PATTERN.test(journal.base?.nativeSwapSourceSha256),
    "Final receipt journal lacks the plan-bound native swap source SHA-256");
  assertNativeBuildContract(journal.base?.nativeSwapBuildContract,
    "Final receipt journal native swap build contract");
  invariant(isDeepStrictEqual(
    receipt.nativeSwapBuildContract,
    journal.base.nativeSwapBuildContract,
  ), "Applied receipt native build contract differs from the transaction journal");
  invariant(isDeepStrictEqual(
    receipt.nativeSwapBuildWitness,
    journal.nativeSwapBuildWitness,
  ) && isDeepStrictEqual(
    receipt.nativeSwapBuildWitnessIdentity,
    journal.nativeSwapBuildWitnessIdentity,
  ), "Applied receipt native build witness differs from the transaction journal");
  invariant(receipt.transactionId === journal.transactionId
    && isDeepStrictEqual(receipt.plan, journal.plan)
    && receiptEvidence.bytes === journal.receiptDraft?.bytes
    && receiptEvidence.sha256 === journal.receiptDraft?.sha256,
  "Applied receipt draft/transaction/plan binding drift");
  invariant(receipt.exactPromotion.workingCopyReceiptSha256
      === journal.workingCopy?.receiptSha256
    && receipt.exactPromotion.recordSetSha256 === journal.staged?.copied?.recordSetSha256
    && receipt.exactPromotion.approvedClosureSha256
      === journal.staged?.reviewBindings?.approvedClosureSha256
    && receipt.exactPromotion.withheldClosureSha256
      === journal.staged?.reviewBindings?.withheldClosureSha256,
  "Applied receipt journal binding drift for working-copy or approved/withheld closure");
  invariant(receipt.inputArtifacts.trustedReviewerRegistry?.sha256
      === journal.staged?.reviewBindings?.trustedReviewerRegistrySha256,
  "Applied receipt trusted-reviewer registry journal binding drift");
  invariant(isDeepStrictEqual(
    receipt.inputArtifacts.implementationVerificationCompletion,
    journal.base?.implementationVerificationCompletion,
  ), "Applied receipt implementation-baseline completion journal binding drift");
  invariant(receipt.catalogPathClosure.preparedReceipt.bytes === journal.staged?.preparedBytes
    && receipt.catalogPathClosure.preparedReceipt.sha256 === journal.staged?.preparedSha256
    && receipt.catalogPathClosure.preparedReceipt.path === journal.staged?.preparedRelativePath
    && isDeepStrictEqual(receipt.stagedVerification, journal.staged?.postcheck)
    && isDeepStrictEqual(receipt.observedCatalogArtifacts,
      journal.staged?.postcheck?.catalogEvidenceClosure?.boundArtifacts),
  "Applied receipt prepared/staged post-state journal binding drift");
  invariant(isDeepStrictEqual(receipt.independentPreparedReviews,
    journal.independentReviews)
    && isDeepStrictEqual(receipt.swaps, journal.swapReceipts)
    && isDeepStrictEqual(receipt.postchecks.live, journal.livePostcheck)
    && isDeepStrictEqual(receipt.reportingPreimage, journal.reportingPreimage)
    && isDeepStrictEqual(receipt.reportingPreimage.liveReadme, {
      path: "README.md",
      bytes: journal.base?.readme?.bytes,
      sha256: journal.base?.readme?.sha256,
      mode: journal.base?.readme?.mode,
      node: journal.base?.readme?.node,
    })
    && isDeepStrictEqual(receipt.catalogPathClosure.baseInventory,
      journal.staged?.catalogPathClosure?.baseInventory)
    && receipt.retainedRecoveryRoots.source === transaction.paths.sourceRecovery
    && receipt.retainedRecoveryRoots.catalog === transaction.paths.catalogRecovery,
  "Applied receipt independent-review/swap/live/recovery journal binding drift");
  assertAtomicSwapReceipt(receipt.swaps.source, {
    allowedParent: transaction.paths.sourceParent,
    firstDirectory: transaction.journal.paths.sourceLive,
    secondDirectory: transaction.paths.sourceRecovery,
    before: transaction.journal.directoryNodesBeforeSwap?.source,
    expectedNativeSourceSha256: transaction.journal.base.nativeSwapSourceSha256,
    expectedNativeBuildContract:
      transaction.journal.base.nativeSwapBuildContract,
    expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
    label: "Journal-bound source swap receipt",
  });
  assertAtomicSwapReceipt(receipt.swaps.catalog, {
    allowedParent: transaction.paths.catalogParent,
    firstDirectory: transaction.journal.paths.catalogLive,
    secondDirectory: transaction.paths.catalogRecovery,
    before: transaction.journal.directoryNodesBeforeSwap?.catalog,
    expectedNativeSourceSha256: transaction.journal.base.nativeSwapSourceSha256,
    expectedNativeBuildContract:
      transaction.journal.base.nativeSwapBuildContract,
    expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
    label: "Journal-bound catalog swap receipt",
  });
  return receipt;
}

export async function reconcileInterruptedFinalReceiptPublication(
  configuration,
  preflightEvidence,
  transaction,
) {
  invariant(transaction?.journal?.receiptDraft
    && Number.isSafeInteger(transaction.journal.receiptDraft.bytes)
    && SHA256_PATTERN.test(transaction.journal.receiptDraft.sha256),
  "Interrupted final-receipt reconciliation lacks the journaled receipt draft identity");
  const observed = await inspectRegularFileNoFollow(configuration.receiptPath, {
    expectedBytes: transaction.journal.receiptDraft.bytes,
    expectedSha256: transaction.journal.receiptDraft.sha256,
    requireReadOnly: true,
  });
  if (observed.nlink === 1) return {status: "already-single-link", evidence: observed};
  invariant(observed.nlink === 2 && observed.mode === 0o444,
    "Interrupted final receipt is not the exact read-only nlink-2 publication state");
  const physical = await readJsonArtifactNoFollow(configuration.receiptPath, {
    expectedBytes: observed.bytes,
    expectedSha256: observed.sha256,
    requireReadOnly: true,
  });
  assertFinalReceiptBundleBindings(
    physical.value,
    physical.evidence,
    preflightEvidence,
    configuration,
  );
  assertFinalReceiptJournalBindings(
    physical.value,
    physical.evidence,
    transaction,
  );
  const exactBytes = Buffer.from(`${JSON.stringify(physical.value, null, 2)}\n`, "utf8");
  invariant(exactBytes.length === transaction.journal.receiptDraft.bytes
    && sha256Bytes(exactBytes) === transaction.journal.receiptDraft.sha256,
  "Interrupted final receipt bytes are not the canonical transaction-bound draft");
  const reconciled = await publishImmutableBytesNoClobber(
    configuration.receiptPath,
    exactBytes,
    {mode: 0o444, label: "interrupted final successor applied receipt"},
  );
  invariant(reconciled.nlink === 1 && reconciled.mode === 0o444,
    "Interrupted final receipt publication did not reconcile to one immutable link");
  return {status: "exact-preparing-link-reconciled", evidence: reconciled};
}

async function verifyFinalReceipt(configuration, preflightEvidence,
  dependencies = defaultDependencies, { transaction = null } = {}) {
  if (transaction) {
    await reconcileInterruptedFinalReceiptPublication(
      configuration,
      preflightEvidence,
      transaction,
    );
  }
  await fsyncDirectory(path.dirname(configuration.receiptPath));
  let receipt = await readJsonArtifactNoFollow(configuration.receiptPath, {
    requireSingleLink: true,
    requireReadOnly: true,
  });
  await fsyncDirectory(path.dirname(configuration.receiptPath));
  const durableReceipt = await readJsonArtifactNoFollow(configuration.receiptPath, {
    expectedBytes: receipt.evidence.bytes,
    expectedSha256: receipt.evidence.sha256,
    requireSingleLink: true,
    requireReadOnly: true,
  });
  invariant(sameNode(receipt.evidence.node, durableReceipt.evidence.node)
    && isDeepStrictEqual(receipt.value, durableReceipt.value),
  "Applied receipt changed during parent durability reconciliation");
  receipt = durableReceipt;
  assertFinalReceiptBundleBindings(
    receipt.value,
    receipt.evidence,
    preflightEvidence,
    configuration,
  );
  if (transaction) {
    assertFinalReceiptJournalBindings(receipt.value, receipt.evidence, transaction);
  }
  await verifyReadmeBaseBackup(
    configuration,
    receipt.value.transactionId,
    receipt.value.reportingPreimage.liveReadme,
    receipt.value.reportingPreimage.retainedBaseBackup,
  );
  const preparedReference = receipt.value.catalogPathClosure.preparedReceipt;
  const prepared = await readJsonArtifactNoFollow(
    path.join(configuration.catalogRoot, preparedReference.path),
    {
      expectedBytes: preparedReference.bytes,
      expectedSha256: preparedReference.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    },
  );
  invariant(prepared.value.lifecycle === "prepared"
    && prepared.value.applied === false
    && prepared.value.transactionId === receipt.value.transactionId
    && isDeepStrictEqual(prepared.value.plan, receipt.value.plan)
    && isDeepStrictEqual(prepared.value.inputArtifacts, receipt.value.inputArtifacts)
    && isDeepStrictEqual(prepared.value.exactUniverse, receipt.value.exactUniverse)
    && isDeepStrictEqual(prepared.value.exactPromotion, receipt.value.exactPromotion)
    && isDeepStrictEqual(prepared.value.expectedCatalogProfile,
      receipt.value.expectedCatalogProfile)
    && isDeepStrictEqual(prepared.value.expectedCatalogArtifacts,
      receipt.value.expectedCatalogArtifacts)
    && isDeepStrictEqual(prepared.value.observedCatalogArtifacts,
      receipt.value.observedCatalogArtifacts)
    && isDeepStrictEqual(prepared.value.stagedVerification,
      receipt.value.stagedVerification)
    && isDeepStrictEqual(prepared.value.evidenceBoundary,
      receipt.value.evidenceBoundary),
  "Final receipt is not derived from the exact physical prepared receipt");
  const postcheck = await postcheckTree(configuration, preflightEvidence, {
    defaultPaths: configuration.defaultProject,
    dependencies,
  });
  invariant(isDeepStrictEqual(receipt.value.postchecks.live, postcheck)
    && isDeepStrictEqual(receipt.value.reportingGate.observedPairing,
      postcheck.catalog.observed),
  "Applied receipt live postcheck or observed pairing differs from current canonical state");
  const closure = receipt.value.catalogPathClosure;
  const currentCatalogInventory = await inventoryDirectory(configuration.catalogRoot);
  const catalogPathClosure = assertCatalogPathClosure({
    baseInventory: closure.baseInventory,
    currentInventory: currentCatalogInventory,
    preparedReceipt: closure.preparedReceipt,
    appliedReceipt: {
      path: closure.appliedReceipt.path,
      bytes: receipt.evidence.bytes,
      sha256: receipt.evidence.sha256,
    },
  });
  return { receipt, postcheck, catalogPathClosure };
}

function successorReportBytes({ receipt, receiptEvidence, bundle }) {
  const observed = receipt.reportingGate.observedPairing;
  const confirmedPublicationLineage = bundle.reviewLedger.records
    .filter((record) => record.review?.terminal === true
      && record.review?.decision === "confirmed-publication-lineage").length;
  const confirmedButWithheld = confirmedPublicationLineage
    - receipt.exactPromotion.approvedCopyRecords;
  const universe = receipt.inputArtifacts.universe;
  const reviewLedger = receipt.inputArtifacts.reviewLedger;
  const prepared = receipt.catalogPathClosure.preparedReceipt;
  const acceptanceEffects = Object.entries(receipt.evidenceBoundary.acceptanceEffects)
    .map(([name, value]) => `- ${name}: ${value}`)
    .join("\n");
  const text = `# FLA/SWF Counterpart Successor Promotion — 2026-08-07

## Applied result

Transaction \`${receipt.transactionId}\` reached its forward-only applied commit
point at \`${receipt.completedAt}\`. Live source-freeze and catalog fail-closed
postchecks passed before this report was generated.

| Measure | Observed canonical value |
|---|---:|
| Canonical files | ${observed.files.toLocaleString("en-US")} |
| Canonical bytes | ${observed.totalBytes.toLocaleString("en-US")} |
| Structurally paired FLA/SWF placements | ${observed.pairedSwfFla.toLocaleString("en-US")} |
| SWF-only placements | ${observed.swfOnly.toLocaleString("en-US")} |
| FLA-only files | ${observed.flaOnly.toLocaleString("en-US")} |
| Approved byte-identical copies | ${receipt.exactPromotion.approvedCopyRecords.toLocaleString("en-US")} |
| Withheld records | ${receipt.exactPromotion.withheldRecords.toLocaleString("en-US")} |
| Confirmed publication-lineage reviews | ${confirmedPublicationLineage.toLocaleString("en-US")} |
| Confirmed lineage but withheld | ${confirmedButWithheld.toLocaleString("en-US")} |
| Automatic custody/placement-hold copies | 0 |

The structural \`paired\` number is a full-relative-path catalog relationship.
It is not a count of distinct binaries, a publication-lineage attestation, or
evidence of Flash fidelity or migration completion.

## Immutable closure

- Universe: \`${universe.path}\`, ${universe.bytes.toLocaleString("en-US")} bytes,
  SHA-256 \`${universe.sha256}\`.
- Pair-review ledger: \`${reviewLedger.path}\`,
  ${reviewLedger.bytes.toLocaleString("en-US")} bytes, SHA-256
  \`${reviewLedger.sha256}\`.
- Executable plan: \`${receipt.plan.path}\`, ${receipt.plan.bytes.toLocaleString("en-US")} bytes,
  SHA-256 \`${receipt.plan.sha256}\`.
- Working-copy receipt SHA-256:
  \`${receipt.exactPromotion.workingCopyReceiptSha256}\`.
- Prepared receipt: \`${prepared.path}\`, ${prepared.bytes.toLocaleString("en-US")} bytes,
  SHA-256 \`${prepared.sha256}\`.
- Applied receipt: \`${RECEIPT_RELATIVE}\`, ${receiptEvidence.bytes.toLocaleString("en-US")} bytes,
  SHA-256 \`${receiptEvidence.sha256}\`.
- Transaction-bound README base backup:
  \`${receipt.reportingPreimage.retainedBaseBackup.path}\`,
  ${receipt.reportingPreimage.retainedBaseBackup.bytes.toLocaleString("en-US")} bytes,
  SHA-256 \`${receipt.reportingPreimage.retainedBaseBackup.sha256}\`.
- Live source manifest SHA-256:
  \`${receipt.postchecks.live.freeze.manifestSha256}\`.
- Live catalog checksum-set SHA-256:
  \`${observed.checksumSetSha256}\`.

The original pre-promotion source and catalog trees remain at the exact
transaction-specific recovery paths recorded in the applied receipt. This
executor never deletes them.

## Acceptance boundary

This transaction changes source custody and the derived catalog inventory
only. Its acceptance effects remain:

${acceptanceEffects}

No statement in this report authorizes JavaScript implementation,
original-runtime fidelity, audio acceptance, human visual approval, owner
acceptance, strict completion, lesson release, or publication.
`;
  return Buffer.from(text, "utf8");
}

function readmeSuccessorBlock({ receipt, receiptEvidence }) {
  const observed = receipt.reportingGate.observedPairing;
  return `${README_SUCCESSOR_BEGIN}
The reviewed 2026-08-07 FLA/SWF counterpart successor transaction
\`${receipt.transactionId}\` is applied and live-verified. It copied
${receipt.exactPromotion.approvedCopyRecords.toLocaleString("en-US")} of the 620 reviewed
counterpart records and withheld ${receipt.exactPromotion.withheldRecords.toLocaleString("en-US")};
all 71 current custody/placement holds had zero automatic copies. The rebuilt
canonical catalog now reports ${observed.pairedSwfFla.toLocaleString("en-US")} structural pairs,
${observed.swfOnly.toLocaleString("en-US")} SWF-only placements, and
${observed.flaOnly.toLocaleString("en-US")} FLA-only files. See
[\`reports/fla-swf-counterpart-successor-2026-08-07.md\`](reports/fla-swf-counterpart-successor-2026-08-07.md)
and applied receipt SHA-256 \`${receiptEvidence.sha256}\`. Structural pairing
does not prove publication lineage, Flash fidelity, or migration completion.
${README_SUCCESSOR_END}`;
}

async function publishOrVerifyImmutableBytes(filePath, contents, label) {
  const kind = await pathKind(filePath);
  if (kind === "missing") {
    return publishImmutableBytesNoClobber(filePath, contents, {
      mode: 0o444,
      label,
    });
  }
  invariant(kind === "file", `${label} path is unsafe: ${kind}`);
  const before = await inspectRegularFileNoFollow(filePath, {
    expectedBytes: contents.length,
    expectedSha256: sha256Bytes(contents),
    requireSingleLink: true,
    requireReadOnly: true,
  });
  await fsyncDirectory(path.dirname(filePath));
  const after = await inspectRegularFileNoFollow(filePath, {
    expectedBytes: contents.length,
    expectedSha256: sha256Bytes(contents),
    requireSingleLink: true,
    requireReadOnly: true,
  });
  invariant(sameNode(before.node, after.node),
    `${label} changed during parent durability reconciliation`);
  return after;
}

function readmePreimageRelativePath(transactionId) {
  invariant(/^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/u.test(transactionId),
    "Invalid transaction identifier for README compare-and-swap");
  return `.README.md.fla-swf-counterpart-successor-preimage-${transactionId}`;
}

function readmeBaseBackupRelativePath(transactionId) {
  invariant(/^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/u.test(transactionId),
    "Invalid transaction identifier for README base-backup retention");
  return `.README.md.fla-swf-counterpart-successor-base-backup-${transactionId}`;
}

function assertReadmeBaseIdentity(observed, expected, label = "README") {
  invariant(observed.bytes === expected.bytes
    && observed.sha256 === expected.sha256
    && observed.mode === expected.mode
    && sameNode(observed.node, expected.node),
  `${label} differs from the transaction-bound preimage`);
}

async function prepareReadmeBaseBackup({
  configuration,
  transactionId,
  expectedBase,
  syncParent = fsyncDirectory,
}) {
  const readmePath = path.join(configuration.projectRoot, "README.md");
  const relativePath = readmeBaseBackupRelativePath(transactionId);
  const backupPath = path.join(configuration.projectRoot, relativePath);
  const readmeBefore = await inspectRegularFileNoFollow(readmePath, {
    expectedBytes: expectedBase.bytes,
    expectedSha256: expectedBase.sha256,
    requireSingleLink: true,
  });
  assertReadmeBaseIdentity(readmeBefore, expectedBase);
  const backupKind = await pathKind(backupPath);
  invariant(["missing", "file"].includes(backupKind),
    `README base-backup path is unsafe: ${backupKind}`);
  let backup;
  if (backupKind === "missing") {
    const copy = await copyRegularFileExclusive({
      sourcePath: readmePath,
      destinationPath: backupPath,
      bytes: expectedBase.bytes,
      sha256: expectedBase.sha256,
      destinationMode: 0o444,
      label: "README transaction-bound base backup",
    });
    invariant(sameNode(copy.source.node, expectedBase.node),
      "README changed while retaining the transaction-bound base backup");
    backup = copy.destination;
  } else {
    backup = await inspectRegularFileNoFollow(backupPath, {
      expectedBytes: expectedBase.bytes,
      expectedSha256: expectedBase.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    });
  }
  invariant(!sameNode(backup.node, expectedBase.node)
    && backup.mode === 0o444 && backup.nlink === 1,
  "README base backup must be an independent, single-link, read-only inode");
  await syncParent(configuration.projectRoot);
  const durableBackup = await inspectRegularFileNoFollow(backupPath, {
    expectedBytes: expectedBase.bytes,
    expectedSha256: expectedBase.sha256,
    requireSingleLink: true,
    requireReadOnly: true,
  });
  invariant(sameNode(durableBackup.node, backup.node),
    "README base backup changed during parent durability reconciliation");
  return {
    path: relativePath,
    bytes: durableBackup.bytes,
    sha256: durableBackup.sha256,
    mode: durableBackup.mode,
    nlink: durableBackup.nlink,
    node: durableBackup.node,
    distinctFromExpectedBaseInode: true,
    retentionPolicy: "retained; this executor never deletes the transaction-bound README base backup",
  };
}

async function verifyReadmeBaseBackup(configuration, transactionId, expectedBase,
  expectedBackup) {
  const expectedPath = readmeBaseBackupRelativePath(transactionId);
  invariant(expectedBackup?.path === expectedPath
    && expectedBackup.bytes === expectedBase.bytes
    && expectedBackup.sha256 === expectedBase.sha256
    && expectedBackup.mode === 0o444
    && expectedBackup.nlink === 1
    && expectedBackup.distinctFromExpectedBaseInode === true
    && expectedBackup.retentionPolicy
      === "retained; this executor never deletes the transaction-bound README base backup",
  "README base-backup receipt binding is invalid");
  const observed = await inspectRegularFileNoFollow(
    path.join(configuration.projectRoot, expectedPath),
    {
      expectedBytes: expectedBackup.bytes,
      expectedSha256: expectedBackup.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    },
  );
  invariant(observed.mode === expectedBackup.mode
    && observed.nlink === expectedBackup.nlink
    && sameNode(observed.node, expectedBackup.node)
    && !sameNode(observed.node, expectedBase.node),
  "README base-backup physical identity differs from its receipt binding");
  return expectedBackup;
}

export async function replaceReadmeStatusCompareAndSwap({
  configuration,
  transactionId,
  expectedBase,
  replacementBytes,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
  expectedBaseBackup = null,
  atomicFileSwap = atomicSwapSiblingRegularFilesDarwin,
  syncParent = fsyncDirectory,
}) {
  invariant(Buffer.isBuffer(replacementBytes),
    "README compare-and-swap replacement must be bytes");
  invariant(SHA256_PATTERN.test(expectedNativeSourceSha256),
    "README exchange requires the plan-bound native helper SHA-256");
  assertNativeBuildContract(expectedNativeBuildContract,
    "README exchange native-helper build contract");
  invariant(expectedNativeBuildContract.source.sha256
    === expectedNativeSourceSha256,
  "README exchange native source/build contract drift");
  assertNativeBuildReceipt(
    expectedNativeBuildReceipt,
    expectedNativeBuildContract,
    "README exchange prepared native-helper witness",
  );
  const readmePath = path.join(configuration.projectRoot, "README.md");
  const preimageRelativePath = readmePreimageRelativePath(transactionId);
  const preimagePath = path.join(configuration.projectRoot, preimageRelativePath);
  const replacementSha256 = sha256Bytes(replacementBytes);
  const readmeBefore = await inspectRegularFileNoFollow(readmePath, {
    requireSingleLink: true,
  });
  let baseBackup = expectedBaseBackup;
  if (!baseBackup) {
    if (readmeBefore.bytes === replacementBytes.length
      && readmeBefore.sha256 === replacementSha256) {
      const backupPath = readmeBaseBackupRelativePath(transactionId);
      const observedBackup = await inspectRegularFileNoFollow(
        path.join(configuration.projectRoot, backupPath),
        {
          expectedBytes: expectedBase.bytes,
          expectedSha256: expectedBase.sha256,
          requireSingleLink: true,
          requireReadOnly: true,
        },
      );
      baseBackup = {
        path: backupPath,
        bytes: observedBackup.bytes,
        sha256: observedBackup.sha256,
        mode: observedBackup.mode,
        nlink: observedBackup.nlink,
        node: observedBackup.node,
        distinctFromExpectedBaseInode: true,
        retentionPolicy:
          "retained; this executor never deletes the transaction-bound README base backup",
      };
    } else {
      baseBackup = await prepareReadmeBaseBackup({
        configuration,
        transactionId,
        expectedBase,
        syncParent,
      });
    }
  }
  await verifyReadmeBaseBackup(
    configuration,
    transactionId,
    expectedBase,
    baseBackup,
  );
  const preimageKind = await pathKind(preimagePath);

  if (readmeBefore.bytes === replacementBytes.length
    && readmeBefore.sha256 === replacementSha256) {
    invariant(preimageKind === "file",
      "README replacement is present without its retained transaction preimage");
    const retainedPreimage = await inspectRegularFileNoFollow(preimagePath, {
      expectedBytes: expectedBase.bytes,
      expectedSha256: expectedBase.sha256,
      requireSingleLink: true,
    });
    assertReadmeBaseIdentity(retainedPreimage, expectedBase,
      "Retained README transaction preimage");
    invariant(readmeBefore.mode === expectedBase.mode,
      "Committed README mode differs from the transaction-bound mode");
    await syncParent(configuration.projectRoot);
    const readmeAfterDurabilitySync = await inspectRegularFileNoFollow(readmePath, {
      expectedBytes: replacementBytes.length,
      expectedSha256: replacementSha256,
      requireSingleLink: true,
    });
    const preimageAfterDurabilitySync = await inspectRegularFileNoFollow(preimagePath, {
      expectedBytes: expectedBase.bytes,
      expectedSha256: expectedBase.sha256,
      requireSingleLink: true,
    });
    invariant(sameNode(readmeAfterDurabilitySync.node, readmeBefore.node)
      && sameNode(preimageAfterDurabilitySync.node, retainedPreimage.node),
    "README exchange identities changed during reconciliation durability sync");
    return {
      status: "already-swapped-and-reconciled",
      readme: readmeAfterDurabilitySync,
      retainedPreimage: {
        path: preimageRelativePath,
        ...preimageAfterDurabilitySync,
      },
      retainedBaseBackup: baseBackup,
      swapReceipt: null,
      nativeBuildWitness: expectedNativeBuildReceipt,
      invocationProvenance:
        "reconciled from the pre-swap journal/applied-receipt native-helper witness",
      parentFsynced: true,
    };
  }

  assertReadmeBaseIdentity(readmeBefore, expectedBase);
  invariant(["missing", "file"].includes(preimageKind),
    `README transaction preimage path is unsafe: ${preimageKind}`);
  const preparedReplacement = preimageKind === "missing"
    ? await publishImmutableBytesNoClobber(preimagePath, replacementBytes, {
      mode: expectedBase.mode,
      label: "README compare-and-swap replacement",
    })
    : await inspectRegularFileNoFollow(preimagePath, {
      expectedBytes: replacementBytes.length,
      expectedSha256: replacementSha256,
      requireSingleLink: true,
    });
  invariant(preparedReplacement.mode === expectedBase.mode,
    "README compare-and-swap replacement mode differs from the base mode");

  // Re-read the content immediately before the native inode CAS. A path
  // replacement is then rejected again inside the native helper before swap.
  const readmeAtCommit = await inspectRegularFileNoFollow(readmePath, {
    expectedBytes: expectedBase.bytes,
    expectedSha256: expectedBase.sha256,
    requireSingleLink: true,
  });
  assertReadmeBaseIdentity(readmeAtCommit, expectedBase);
  await verifyReadmeBaseBackup(
    configuration,
    transactionId,
    expectedBase,
    baseBackup,
  );
  const swapReceipt = await atomicFileSwap({
    allowedParent: configuration.projectRoot,
    firstFile: readmePath,
    secondFile: preimagePath,
    expectedFirstNode: expectedBase.node,
    expectedSecondNode: preparedReplacement.node,
    expectedNativeSourceSha256,
    expectedNativeBuildContract,
    expectedNativeBuildReceipt,
  });
  invariant(swapReceipt?.status === "swapped-and-parent-fsynced"
    && swapReceipt.allowedParent === configuration.projectRoot
    && swapReceipt.firstFile === readmePath
    && swapReceipt.secondFile === preimagePath
    && sameNode(swapReceipt.before?.first, expectedBase.node)
    && sameNode(swapReceipt.before?.second, preparedReplacement.node)
    && sameNode(swapReceipt.after?.first, preparedReplacement.node)
    && sameNode(swapReceipt.after?.second, expectedBase.node)
    && swapReceipt.native?.status === "swapped"
    && swapReceipt.native?.parentFsynced === true
    && swapReceipt.nativeSourceSha256 === expectedNativeSourceSha256,
  "README compare-and-swap returned a forged or incomplete receipt");
  assertNativeBuildReceipt(
    swapReceipt.nativeBuild,
    expectedNativeBuildContract,
    "README compare-and-swap native build receipt",
  );
  invariant(isDeepStrictEqual(swapReceipt.nativeBuild, expectedNativeBuildReceipt),
    "README compare-and-swap helper differs from the prepared witness");

  const readmeAfter = await inspectRegularFileNoFollow(readmePath, {
    expectedBytes: replacementBytes.length,
    expectedSha256: replacementSha256,
    requireSingleLink: true,
  });
  const retainedPreimage = await inspectRegularFileNoFollow(preimagePath, {
    expectedBytes: expectedBase.bytes,
    expectedSha256: expectedBase.sha256,
    requireSingleLink: true,
  });
  invariant(sameNode(readmeAfter.node, preparedReplacement.node)
    && sameNode(retainedPreimage.node, expectedBase.node),
  "README compare-and-swap postcondition differs from the bound inode exchange");
  return {
    status: "swapped-and-parent-fsynced",
    readme: readmeAfter,
    retainedPreimage: {path: preimageRelativePath, ...retainedPreimage},
    retainedBaseBackup: baseBackup,
    swapReceipt,
    nativeBuildWitness: expectedNativeBuildReceipt,
    invocationProvenance:
      "actual swap receipt matched the pre-swap journal/applied-receipt native-helper witness",
    parentFsynced: true,
  };
}

async function finalizePostCommitReporting(configuration, preflightEvidence,
  transaction, committed, dependencies = defaultDependencies) {
  const receipt = committed.receipt.value;
  const receiptEvidence = committed.receipt.evidence;
  const reportPath = path.join(configuration.projectRoot, REPORT_RELATIVE);
  const reportContents = successorReportBytes({
    receipt,
    receiptEvidence,
    bundle: preflightEvidence.bundle,
  });
  const reportEvidence = await publishOrVerifyImmutableBytes(
    reportPath,
    reportContents,
    "successor promotion report",
  );
  const readmePath = path.join(configuration.projectRoot, "README.md");
  const readmeObserved = await inspectRegularFileNoFollow(readmePath, {
    requireSingleLink: true,
  });
  const base = transaction.journal.base.readme;
  let baseReadPath = readmePath;
  let baseReadEvidence = readmeObserved;
  if (!(readmeObserved.bytes === base.bytes
    && readmeObserved.sha256 === base.sha256
    && readmeObserved.mode === base.mode
    && sameNode(readmeObserved.node, base.node))) {
    const retainedRelative = readmePreimageRelativePath(
      transaction.journal.transactionId,
    );
    baseReadPath = path.join(configuration.projectRoot, retainedRelative);
    baseReadEvidence = await inspectRegularFileNoFollow(baseReadPath, {
      expectedBytes: base.bytes,
      expectedSha256: base.sha256,
      requireSingleLink: true,
    });
    assertReadmeBaseIdentity(baseReadEvidence, base,
      "Retained README transaction preimage");
  }
  const baseReadmeText = await readStableUtf8FileNoFollow(
    baseReadPath,
    baseReadEvidence,
    "transaction-bound README preimage",
  );
  const { begin, end } = successorReadmeMarkerPositions(baseReadmeText);
  const block = readmeSuccessorBlock({ receipt, receiptEvidence });
  const readmeAfterText = `${baseReadmeText.slice(0, begin)}${block}${baseReadmeText.slice(
    end + README_SUCCESSOR_END.length,
  )}`;
  const readmeAfterBytes = Buffer.from(readmeAfterText, "utf8");
  const expectedNativeBuildReceipt = transaction.journal.nativeSwapBuildWitness;
  const expectedNativeBuildReceiptIdentity = nativeBuildReceiptIdentity(
    expectedNativeBuildReceipt,
    receipt.nativeSwapBuildContract,
    "post-commit README native-helper witness",
  );
  invariant(isDeepStrictEqual(
    expectedNativeBuildReceipt,
    receipt.nativeSwapBuildWitness,
  ) && isDeepStrictEqual(
    expectedNativeBuildReceiptIdentity,
    receipt.nativeSwapBuildWitnessIdentity,
  ), "Post-commit README witness differs from the applied receipt");
  await persistJournal(transaction, {
    phase: "committed-reporting-readme-swap-authorized",
    postCommitReportingProgress: {
      report: {path: REPORT_RELATIVE, ...reportEvidence},
      readmeSwapInvocation: {
        status: "authorized-before-native-invocation",
        replacementBytes: readmeAfterBytes.length,
        replacementSha256: sha256Bytes(readmeAfterBytes),
        nativeSwapBuildWitness: expectedNativeBuildReceipt,
        nativeSwapBuildWitnessIdentity: expectedNativeBuildReceiptIdentity,
      },
    },
  });
  const readmeCompareAndSwap = await replaceReadmeStatusCompareAndSwap({
    configuration,
    transactionId: transaction.journal.transactionId,
    expectedBase: base,
    replacementBytes: readmeAfterBytes,
    expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256
      ?? expectedNativeSwapSourceSha256(preflightEvidence.bundle),
    expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract
      ?? expectedNativeSwapBuildContract(preflightEvidence.bundle),
    expectedNativeBuildReceipt,
    expectedBaseBackup: receipt.reportingPreimage.retainedBaseBackup,
    atomicFileSwap: dependencies.atomicFileSwap
      ?? atomicSwapSiblingRegularFilesDarwin,
  });
  const readmeEvidence = readmeCompareAndSwap.readme;
  return {
    report: { path: REPORT_RELATIVE, ...reportEvidence },
    readme: { path: "README.md", ...readmeEvidence },
    readmeCompareAndSwap,
    source: "verified applied receipt and live rebuilt catalog only",
  };
}

export function receiptPublicationMayHaveCommitted(journal) {
  return journal?.receiptCommitPointPresent === true
    || Boolean(journal?.finalReceipt)
    || [
      "publishing-receipt",
      "receipt-published",
      "committed",
      "committed-and-reported",
    ].includes(journal?.phase);
}

function assertPreparedBaseUnchanged(preflightEvidence, journal, {
  currentSourceNode,
  currentCatalogNode,
}) {
  invariant(preflightEvidence.baseFreeze.fileCount === journal.base.freeze.fileCount
    && preflightEvidence.baseFreeze.totalBytes === journal.base.freeze.totalBytes
    && preflightEvidence.baseFreeze.manifestSha256 === journal.base.freeze.manifestSha256
    && preflightEvidence.catalogInventory.treeSha256 === journal.base.catalogTreeSha256
    && preflightEvidence.currentProfile.evidence.sha256 === journal.base.currentProfileSha256
    && preflightEvidence.currentReadme.bytes === journal.base.readme.bytes
    && preflightEvidence.currentReadme.sha256 === journal.base.readme.sha256
    && preflightEvidence.currentReadme.mode === journal.base.readme.mode
    && sameNode(preflightEvidence.currentReadme.node, journal.base.readme.node)
    && sameNode(currentSourceNode, journal.base.sourceRootNode)
    && sameNode(currentCatalogNode, journal.base.catalogRootNode),
  "Live source/catalog drift after staging invalidates the prepared transaction");
}

async function finalizeNoCopyClosure(configuration, preflightEvidence) {
  const {bundle} = preflightEvidence;
  invariant(bundle.validated.approved.length === 0
    && bundle.validated.withheld.length === 620,
  "No-copy closure requires the exact 0 approved / 620 withheld partition");
  const generatedOutputs = preflightEvidence.catalogInventory.records
    .filter((record) => CATALOG_OUTPUTS.includes(record.path));
  invariant(generatedOutputs.length === CATALOG_OUTPUTS.length
    && isDeepStrictEqual(
      generatedOutputs.map((record) => record.path).sort(compareText),
      [...CATALOG_OUTPUTS].sort(compareText),
    ),
  "No-copy closure requires all 17 live generated catalog outputs");
  const closure = {
    schemaVersion: "help-math-fla-swf-counterpart-successor-no-copy-closure/v1",
    artifactType: "help-math-fla-swf-counterpart-successor-no-copy-closure",
    lifecycle: "final-reviewed-no-copy",
    applied: false,
    claim: "review-closure-only-no-source-promotion",
    plan: {
      path: PLAN_RELATIVE,
      bytes: bundle.planEvidence.bytes,
      sha256: bundle.planEvidence.sha256,
    },
    inputArtifacts: expectedFinalInputArtifacts(bundle.plan),
    exactUniverse: {
      records: 620,
      bytes: bundle.universe.records.reduce((sum, record) => sum + record.bytes, 0),
      recordSetSha256: bundle.universe.digests.recordSetSha256,
      pathSetSha256: bundle.universe.digests.pathSetSha256,
      sourceBoundRecordSetSha256: bundle.universe.digests.sourceBoundRecordSetSha256,
    },
    exactDisposition: {
      prior: {ordinary: 551, historicalCustodyHold: 61, placementAliasHold: 8},
      current: {ordinary: 549, historicalCustodyHold: 61, placementAliasHold: 10},
      currentHolds: 71,
      currentHoldsAutomaticallyCopied: 0,
    },
    exactNoCopyClosure: {
      approvedCopyRecords: 0,
      withheldRecords: 620,
      approvedClosureSha256: recordIdentityClosureSha256(bundle.validated.approved),
      withheldClosureSha256: recordIdentityClosureSha256(
        bundle.validated.withheld.map((record) => bundle.validated.byId.get(record.recordId)),
      ),
      canonicalDestinationsUnexpectedlyPresent: 0,
      workingCopyCreated: false,
      sourceSwapped: false,
      catalogSwapped: false,
      appliedReceiptPublished: false,
    },
    liveVerification: {
      source: {
        fileCount: preflightEvidence.baseFreeze.fileCount,
        totalBytes: preflightEvidence.baseFreeze.totalBytes,
        manifestSha256: preflightEvidence.baseFreeze.manifestSha256,
      },
      currentSourceProfile: {
        path: CURRENT_PROFILE_RELATIVE,
        bytes: preflightEvidence.currentProfile.evidence.bytes,
        sha256: preflightEvidence.currentProfile.evidence.sha256,
      },
      catalogGeneratedOutputs: generatedOutputs,
      verifySourcesPassed: true,
      catalogFailClosedCheckPassed: true,
      quiescenceSnapshotsPassed: preflightEvidence.quiescenceSnapshots.length,
    },
    reportingGate: {
      observedCanonical: false,
      canonicalCountsReportableAsNewPromotionResult: false,
      publicationAllowed: false,
      statement: "No source promotion occurred; this closure does not publish new canonical pairing numbers.",
    },
    evidenceBoundary: {
      sourceCustodyOnly: true,
      javascriptImplementation: false,
      originalRuntimeFidelity: false,
      audioAcceptance: false,
      humanVisualApproval: false,
      ownerAcceptance: false,
      strictCompletion: false,
      lessonRelease: false,
      publication: false,
    },
  };
  const closureBytes = Buffer.from(`${JSON.stringify(closure, null, 2)}\n`, "utf8");
  const closureEvidence = await publishOrVerifyImmutableBytes(
    configuration.noCopyClosurePath,
    closureBytes,
    "successor terminal no-copy closure",
  );
  return {
    status: "terminal-reviewed-all-withheld-no-copy-no-transaction",
    frozenUniverseRecords: 620,
    approvedCopyRecords: 0,
    withheldRecords: 620,
    sourceCopyPerformed: false,
    workingCopyCreated: false,
    sourceSwapped: false,
    catalogSwapped: false,
    appliedReceiptPublished: false,
    noCopyClosure: {path: NO_COPY_CLOSURE_RELATIVE, ...closureEvidence},
    observedCanonical: false,
    publicationAllowed: false,
    reason: "A signed all-withheld ledger is closed by an immutable no-copy receipt; no promotion transaction is created.",
  };
}

async function resumePreparedPromotion(configuration, {
  dependencies = defaultDependencies,
  requireBuilderValidator = true,
  scanProcesses,
  inspectSnapshotBirthtime,
} = {}) {
  const transaction = await loadJournal(configuration);
  invariant(transaction.journal.phase === "awaiting-independent-review",
    `Active transaction is not awaiting independent review: ${transaction.journal.phase}`);
  const preflightEvidence = await strictPreflight(configuration, {
    dependencies,
    allowActiveTransaction: true,
    requireBuilderValidator,
    scanProcesses,
    inspectSnapshotBirthtime,
  });
  if (preflightEvidence.bundle.validated.approved.length === 0) {
    throw new Error(
      "A zero-approved closure must not have an active promotion transaction; manual intervention required",
    );
  }
  invariant(preflightEvidence.bundle.planEvidence.sha256 === transaction.journal.plan.sha256,
    "Prepared transaction plan SHA-256 drift");
  const [currentSourceNode, currentCatalogNode] = await Promise.all([
    snapshotDirectoryNode(configuration.sourceRoot, "live source root before resume"),
    snapshotDirectoryNode(configuration.catalogRoot, "live catalog root before resume"),
  ]);
  assertPreparedBaseUnchanged(preflightEvidence, transaction.journal, {
    currentSourceNode: currentSourceNode.node,
    currentCatalogNode: currentCatalogNode.node,
  });
  let preparedFile = await readAndValidatePreparedReceipt(
    configuration,
    preflightEvidence,
    transaction,
  );
  const independentReviews = await verifyIndependentPreparedReviews(
    configuration,
    transaction,
    preflightEvidence,
  );
  const stagedPostcheck = await postcheckTree(configuration, preflightEvidence, {
    sourceRoot: transaction.paths.sourceRecovery,
    catalogRoot: transaction.paths.catalogRecovery,
    dependencies,
  });
  const parentModes = transaction.journal.parentModes;
  let result;
  let primaryError;
  try {
    await setParentMutation(parentModes, true);
    const finalLiveBase = await verifyBaseState(
      configuration,
      transaction.journal,
      dependencies,
    );
    const finalLiveProfile = await inspectRegularFileNoFollow(
      configuration.currentProfilePath,
      {
        expectedSha256: transaction.journal.base.currentProfileSha256,
        requireSingleLink: true,
      },
    );
    const finalStagedCatalogInventory = await inventoryDirectory(
      transaction.paths.catalogRecovery,
    );
    invariant(finalStagedCatalogInventory.treeSha256
      === transaction.journal.staged.stagedCatalogInventory.treeSha256,
    "Staged catalog drift immediately before swap invalidates the transaction");
    const [sourceLive, sourceStaged, catalogLive, catalogStaged] = await Promise.all([
      snapshotDirectoryNode(configuration.sourceRoot, "live source before reviewed swap"),
      snapshotDirectoryNode(transaction.paths.sourceRecovery, "reviewed staged source"),
      snapshotDirectoryNode(configuration.catalogRoot, "live catalog before reviewed swap"),
      snapshotDirectoryNode(transaction.paths.catalogRecovery, "reviewed staged catalog"),
    ]);
    invariant(sameNode(sourceLive.node, transaction.journal.base.sourceRootNode)
      && sameNode(catalogLive.node, transaction.journal.base.catalogRootNode)
      && sameNode(sourceStaged.node, transaction.journal.staged.rootNodes.source)
      && sameNode(catalogStaged.node, transaction.journal.staged.rootNodes.catalog),
    "Live or staged root identity drift immediately before swap invalidates the transaction");
    const directoryNodesBeforeSwap = {
      source: { live: sourceLive.node, staged: sourceStaged.node },
      catalog: { live: catalogLive.node, staged: catalogStaged.node },
    };
    await persistJournal(transaction, {
      phase: "ready-to-swap-after-independent-review",
      independentReviews,
      independentReviewStagedPostcheck: stagedPostcheck,
      finalLiveBase,
      finalLiveProfile,
      finalStagedCatalogInventory,
      directoryNodesBeforeSwap,
    });
    preparedFile = await readAndValidatePreparedReceipt(
      configuration,
      preflightEvidence,
      transaction,
    );
    const sourceSwap = await dependencies.atomicSwap({
      allowedParent: transaction.paths.sourceParent,
      firstDirectory: configuration.sourceRoot,
      secondDirectory: transaction.paths.sourceRecovery,
      expectedFirstNode: directoryNodesBeforeSwap.source.live,
      expectedSecondNode: directoryNodesBeforeSwap.source.staged,
      expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256,
      expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract,
      expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
    });
    assertAtomicSwapReceipt(sourceSwap, {
      allowedParent: transaction.paths.sourceParent,
      firstDirectory: configuration.sourceRoot,
      secondDirectory: transaction.paths.sourceRecovery,
      before: directoryNodesBeforeSwap.source,
      expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256,
      expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract,
      expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
      label: "source atomic directory swap receipt",
    });
    await persistJournal(transaction, {
      phase: "source-swapped",
      swapReceipts: { source: sourceSwap },
    });
    const catalogSwap = await dependencies.atomicSwap({
      allowedParent: transaction.paths.catalogParent,
      firstDirectory: configuration.catalogRoot,
      secondDirectory: transaction.paths.catalogRecovery,
      expectedFirstNode: directoryNodesBeforeSwap.catalog.live,
      expectedSecondNode: directoryNodesBeforeSwap.catalog.staged,
      expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256,
      expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract,
      expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
    });
    assertAtomicSwapReceipt(catalogSwap, {
      allowedParent: transaction.paths.catalogParent,
      firstDirectory: configuration.catalogRoot,
      secondDirectory: transaction.paths.catalogRecovery,
      before: directoryNodesBeforeSwap.catalog,
      expectedNativeSourceSha256: preflightEvidence.nativeSwapSourceSha256,
      expectedNativeBuildContract: preflightEvidence.nativeSwapBuildContract,
      expectedNativeBuildReceipt: transaction.journal.nativeSwapBuildWitness,
      label: "catalog atomic directory swap receipt",
    });
    invariant(isDeepStrictEqual(sourceSwap.nativeBuild, catalogSwap.nativeBuild),
      "Source/catalog swaps produced different compiled native-helper bytes");
    await persistJournal(transaction, {
      phase: "catalog-swapped",
      swapReceipts: { source: sourceSwap, catalog: catalogSwap },
    });
    const livePostcheck = await postcheckTree(configuration, preflightEvidence, {
      defaultPaths: configuration.defaultProject,
      dependencies,
    });
    const liveCatalogInventoryBeforeReceipt = await inventoryDirectory(
      configuration.catalogRoot,
    );
    const liveCatalogPathClosureBeforeReceipt = assertCatalogPathClosure({
      baseInventory: preflightEvidence.catalogInventory,
      currentInventory: liveCatalogInventoryBeforeReceipt,
      preparedReceipt: {
        path: transaction.journal.staged.preparedRelativePath,
        bytes: transaction.journal.staged.preparedBytes,
        sha256: transaction.journal.staged.preparedSha256,
      },
    });
    await persistJournal(transaction, {
      phase: "postchecks-passed",
      livePostcheck,
      liveCatalogPathClosureBeforeReceipt,
    });
    const reportingPrecommit = await inspectReportingPreconditions(configuration, {
      expectedReadme: transaction.journal.base.readme,
    });
    invariant(isDeepStrictEqual(
      reportingPrecommit.reportDestination,
      transaction.journal.base.reportDestination,
    ), "Successor report destination drifted before receipt commit");
    const retainedBaseBackup = await prepareReadmeBaseBackup({
      configuration,
      transactionId: transaction.journal.transactionId,
      expectedBase: transaction.journal.base.readme,
    });
    const reportingPreimage = {
      liveReadme: {
        path: "README.md",
        bytes: transaction.journal.base.readme.bytes,
        sha256: transaction.journal.base.readme.sha256,
        mode: transaction.journal.base.readme.mode,
        node: transaction.journal.base.readme.node,
      },
      retainedBaseBackup,
      exchangeSemantics:
        "pathname exchange after an independently retained base preimage; an indeterminate final race is forward-only manual reconciliation, not a kernel inode CAS",
    };
    await persistJournal(transaction, {
      phase: "reporting-preimage-retained",
      reportingPrecommit,
      reportingPreimage,
    });
    const final = finalReceipt(preparedFile.value, {
      transaction,
      sourceSwap,
      catalogSwap,
      livePostcheck,
      reportingPreimage,
    });
    final.independentPreparedReviews = independentReviews;
    const finalBytes = Buffer.from(`${JSON.stringify(final, null, 2)}\n`, "utf8");
    const receiptDraftEvidence = {
      bytes: finalBytes.length,
      sha256: sha256Bytes(finalBytes),
    };
    assertFinalReceiptBundleBindings(
      final,
      receiptDraftEvidence,
      preflightEvidence,
      configuration,
    );
    assertFinalReceiptJournalBindings(
      final,
      receiptDraftEvidence,
      {
        ...transaction,
        journal: {
          ...transaction.journal,
          receiptDraft: receiptDraftEvidence,
        },
      },
    );
    await persistJournal(transaction, {
      phase: "ready-to-publish-receipt",
      receiptDraft: receiptDraftEvidence,
      reportingPrecommit,
    });
    assertFinalReceiptJournalBindings(final, receiptDraftEvidence, transaction);
    await persistJournal(transaction, {
      phase: "publishing-receipt",
      receiptPublicationAttemptedAt: new Date().toISOString(),
    });
    const receiptEvidence = await publishImmutableJsonNoClobber(
      configuration.receiptPath,
      final,
      { mode: 0o444, label: "final successor applied receipt" },
    );
    await persistJournal(transaction, {
      phase: "receipt-published",
      receiptCommitPointPresent: true,
      finalReceipt: receiptEvidence,
    });
    const committed = await verifyFinalReceipt(
      configuration,
      preflightEvidence,
      dependencies,
      { transaction },
    );
    await persistJournal(transaction, {
      phase: "committed",
      committedAt: final.completedAt,
      finalReceipt: receiptEvidence,
    });
    const postCommitReporting = await finalizePostCommitReporting(
      configuration,
      preflightEvidence,
      transaction,
      committed,
      dependencies,
    );
    await persistJournal(transaction, {
      phase: "committed-and-reported",
      postCommitReporting,
    });
    result = {
      status: "committed-after-independent-review-and-verified",
      transactionId: transaction.journal.transactionId,
      independentReviews,
      finalReceipt: receiptEvidence,
      postchecks: committed.postcheck,
      postCommitReporting,
      retainedRecoveryRoots: final.retainedRecoveryRoots,
    };
  } catch (error) {
    primaryError = error;
    const receiptKind = await pathKind(configuration.receiptPath).catch(() => "indeterminate");
    if (receiptKind === "file") {
      try {
        const committed = await verifyFinalReceipt(
          configuration,
          preflightEvidence,
          dependencies,
          { transaction },
        );
        await persistJournal(transaction, {
          phase: "committed",
          commitReconciledAt: new Date().toISOString(),
          reconciledFromError: error.message,
        });
        const postCommitReporting = await finalizePostCommitReporting(
          configuration,
          preflightEvidence,
          transaction,
          committed,
          dependencies,
        );
        await persistJournal(transaction, {
          phase: "committed-and-reported",
          postCommitReporting,
        });
        result = {
          status: "committed-receipt-reconciled-and-verified",
          transactionId: transaction.journal.transactionId,
          postchecks: committed.postcheck,
          postCommitReporting,
        };
        primaryError = undefined;
      } catch (reconcileError) {
        primaryError = new AggregateError([error, reconcileError],
          "Applied receipt exists but forward reconciliation failed");
        await persistJournal(transaction, {
          phase: "manual-intervention-required",
          receiptCommitPointPresent: true,
          reconciliationError: reconcileError.message,
        }).catch(() => {});
      }
    } else if (receiptKind === "missing") {
      if (receiptPublicationMayHaveCommitted(transaction.journal)) {
        await persistJournal(transaction, {
          phase: "manual-intervention-required",
          receiptCommitPointPresent: true,
          receiptState: "missing-after-or-during-publication",
          forwardOnly: true,
        }).catch(() => {});
      } else {
        try {
          const rollbackSwapActions = await rollbackCatalogThenSource({
            configuration,
            journal: transaction.journal,
            swap: dependencies.atomicSwap,
            expectedNativeSourceSha256:
              transaction.journal.base.nativeSwapSourceSha256,
            expectedNativeBuildContract:
              transaction.journal.base.nativeSwapBuildContract,
            expectedNativeBuildReceipt:
              transaction.journal.nativeSwapBuildWitness,
          });
          const base = await verifyBaseState(configuration, transaction.journal, dependencies);
          await persistJournal(transaction, {
            phase: "rolled-back",
            rolledBackAt: new Date().toISOString(),
            rollback: base,
            rollbackSwapActions,
          });
          primaryError.rollback = base;
        } catch (rollbackError) {
          primaryError.rollbackError = rollbackError.message;
          await persistJournal(transaction, {
            phase: "manual-intervention-required",
            rollbackError: rollbackError.message,
          }).catch(() => {});
        }
      }
    } else {
      await persistJournal(transaction, {
        phase: "manual-intervention-required",
        receiptState: receiptKind,
      }).catch(() => {});
    }
  } finally {
    try {
      await setParentMutation(parentModes, false);
    } catch (modeError) {
      if (primaryError) primaryError.parentModeRestoreError = modeError.message;
      else primaryError = modeError;
    }
  }
  if (primaryError) throw primaryError;
  return result;
}

async function executePromotion(configuration, {
  dependencies = defaultDependencies,
  requireBuilderValidator = true,
  scanProcesses,
  inspectSnapshotBirthtime,
} = {}) {
  if (await pathKind(configuration.activeRoot) === "directory") {
    return resumePreparedPromotion(configuration, {
      dependencies,
      requireBuilderValidator,
      scanProcesses,
      inspectSnapshotBirthtime,
    });
  }
  const preflightEvidence = await strictPreflight(configuration, {
    dependencies,
    requireBuilderValidator,
    scanProcesses,
    inspectSnapshotBirthtime,
  });
  if (preflightEvidence.bundle.validated.approved.length === 0) {
    return finalizeNoCopyClosure(configuration, preflightEvidence);
  }
  let transaction;
  let parentModes = [];
  let result;
  let primaryError;
  try {
    transaction = await beginTransaction(configuration, preflightEvidence);
    parentModes = await snapshotParentModes(configuration);
    await persistJournal(transaction, { phase: "parent-modes-pinned", parentModes });
    await setParentMutation(parentModes, true);
    const staged = await stageTransaction({
      configuration,
      preflightEvidence,
      transaction,
      dependencies,
    });
    await readAndValidatePreparedReceipt(
      configuration,
      preflightEvidence,
      transaction,
    );
    const independentReviewOpenedAt = new Date().toISOString();
    await persistJournal(transaction, {
      phase: "awaiting-independent-review",
      independentReview: {
        openedAt: independentReviewOpenedAt,
        requiredReceiptCount: 2,
        requiredRoles: ["schema-reviewer", "transaction-adversarial-reviewer"],
        receiptDirectory: path.join(configuration.activeRoot, "independent-reviews"),
        requiredFindingCounts: { P0: 0, P1: 0, P2: 0 },
        preparedReceiptSha256: staged.preparedEvidence.sha256,
        planSha256: preflightEvidence.bundle.planEvidence.sha256,
        stagedCatalogTreeSha256: staged.stagedCatalogInventory.treeSha256,
        reviewBindings: transaction.journal.staged.reviewBindings,
      },
    });
    result = {
      status: "awaiting-independent-prepared-review-no-live-mutation",
      transactionId: transaction.journal.transactionId,
      preparedReceipt: {
        relativePath: transaction.journal.staged.preparedRelativePath,
        bytes: staged.preparedEvidence.bytes,
        sha256: staged.preparedEvidence.sha256,
      },
      requiredReviewerReceipts: 2,
      requiredReviewerRoles: ["schema-reviewer", "transaction-adversarial-reviewer"],
      requiredFindingCounts: { P0: 0, P1: 0, P2: 0 },
      sourceSwapped: false,
      catalogSwapped: false,
      appliedReceiptPublished: false,
    };
    return result;
  } catch (error) {
    primaryError = error;
    if (transaction) {
      const receiptKind = await pathKind(configuration.receiptPath).catch(() => "indeterminate");
      if (receiptKind === "file") {
        try {
          const committed = await verifyFinalReceipt(
            configuration,
            preflightEvidence,
            dependencies,
            { transaction },
          );
          await persistJournal(transaction, {
            phase: "committed",
            commitReconciledAt: new Date().toISOString(),
            reconciledFromError: error.message,
          });
          const postCommitReporting = await finalizePostCommitReporting(
            configuration,
            preflightEvidence,
            transaction,
            committed,
            dependencies,
          );
          await persistJournal(transaction, {
            phase: "committed-and-reported",
            postCommitReporting,
          });
          result = {
            status: "committed-receipt-reconciled-and-verified",
            transactionId: transaction.journal.transactionId,
            postchecks: committed.postcheck,
            postCommitReporting,
          };
          primaryError = undefined;
        } catch (reconcileError) {
          primaryError = new AggregateError([error, reconcileError],
            "Applied receipt exists but forward reconciliation failed");
          await persistJournal(transaction, {
            phase: "manual-intervention-required",
            receiptCommitPointPresent: true,
            reconciliationError: reconcileError.message,
          }).catch(() => {});
        }
      } else if (receiptKind === "missing") {
        const possibleReceiptCommitPoint = receiptPublicationMayHaveCommitted(
          transaction.journal,
        );
        if (possibleReceiptCommitPoint) {
          await persistJournal(transaction, {
            phase: "manual-intervention-required",
            receiptCommitPointPresent: true,
            receiptState: "missing-after-or-during-publication",
            forwardOnly: true,
          }).catch(() => {});
        } else {
          try {
            let rollbackSwapActions = [];
            if (transaction.journal.directoryNodesBeforeSwap) {
              rollbackSwapActions = await rollbackCatalogThenSource({
                configuration,
                journal: transaction.journal,
                swap: dependencies.atomicSwap,
                expectedNativeSourceSha256:
                  transaction.journal.base.nativeSwapSourceSha256,
                expectedNativeBuildContract:
                  transaction.journal.base.nativeSwapBuildContract,
                expectedNativeBuildReceipt:
                  transaction.journal.nativeSwapBuildWitness,
              });
            }
            const base = await verifyBaseState(configuration, transaction.journal, dependencies);
            await persistJournal(transaction, {
              phase: "rolled-back",
              rolledBackAt: new Date().toISOString(),
              rollback: base,
              rollbackSwapActions,
            });
            primaryError.rollback = base;
          } catch (rollbackError) {
            primaryError.rollbackError = rollbackError.message;
            await persistJournal(transaction, {
              phase: "manual-intervention-required",
              rollbackError: rollbackError.message,
            }).catch(() => {});
          }
        }
      } else {
        await persistJournal(transaction, {
          phase: "manual-intervention-required",
          receiptState: receiptKind,
        }).catch(() => {});
      }
    }
  } finally {
    try {
      await setParentMutation(parentModes, false);
    } catch (modeError) {
      if (primaryError) primaryError.parentModeRestoreError = modeError.message;
      else primaryError = modeError;
    }
  }
  if (primaryError) throw primaryError;
  return result;
}

async function loadJournal(configuration) {
  const file = await readJsonArtifactNoFollow(path.join(configuration.activeRoot, "journal.json"), {
    requireSingleLink: true,
  });
  invariant(file.value.schemaVersion === SCHEMA.transaction
    && file.value.artifactType === SCHEMA.transactionType,
  "Wrong successor transaction journal schema/type");
  const computedPaths = transactionPaths(configuration, file.value.transactionId);
  invariant(file.value.paths?.projectRoot === configuration.projectRoot
    && file.value.paths?.sourceLive === configuration.sourceRoot
    && file.value.paths?.catalogLive === configuration.catalogRoot
    && file.value.paths?.receipt === configuration.receiptPath
    && Object.entries(computedPaths)
      .every(([key, value]) => file.value.paths?.[key] === value),
  "Successor transaction journal path binding drift");
  return { journal: file.value, paths: computedPaths };
}

async function recoverPromotion(configuration, {
  dependencies = defaultDependencies,
  requireBuilderValidator = true,
  bundleLoader = loadAndValidateBundle,
} = {}) {
  const activeKind = await pathKind(configuration.activeRoot);
  if (activeKind === "missing") {
    invariant(await pathKind(configuration.receiptPath) === "file",
      "No active successor transaction or applied receipt exists");
    const bundle = await bundleLoader(configuration, {
      requireBuilderValidator: false,
      requireCurrentUniverse: false,
    });
    await verifyFinalReceipt(
      configuration,
      { bundle },
      dependencies,
    );
    throw new Error(
      "Applied receipt is present and the live committed state is self-consistent, "
      + "but the active transaction journal is missing; forward-only manual intervention is required",
    );
  }
  invariant(activeKind === "directory", `Active transaction is unsafe: ${activeKind}`);
  const transaction = await loadJournal(configuration);
  const planFile = await readImmutableArtifact(configuration.planPath, "successor executable plan");
  invariant(planFile.evidence.sha256 === transaction.journal.plan.sha256
    && planFile.evidence.bytes === transaction.journal.plan.bytes,
  "Transaction plan binding drift during recovery");
  const receiptKind = await pathKind(configuration.receiptPath);
  let sourceState = "unchanged";
  let catalogState = "unchanged";
  if (transaction.journal.directoryNodesBeforeSwap) {
    [sourceState, catalogState] = (await Promise.all([
      observeSwapPair({
        livePath: configuration.sourceRoot,
        recoveryPath: transaction.journal.paths.sourceRecovery,
        before: transaction.journal.directoryNodesBeforeSwap.source,
        label: "source",
      }),
      observeSwapPair({
        livePath: configuration.catalogRoot,
        recoveryPath: transaction.journal.paths.catalogRecovery,
        before: transaction.journal.directoryNodesBeforeSwap.catalog,
        label: "catalog",
      }),
    ])).map(({ state }) => state);
  }
  const action = decideRecoveryAction({
    receiptKind,
    phase: transaction.journal.phase,
    sourceState,
    catalogState,
    receiptCommitPointPresent:
      transaction.journal.receiptCommitPointPresent === true
      || Boolean(transaction.journal.finalReceipt),
  });
  if (action === "manual-intervention") {
    await persistJournal(transaction, {
      phase: "manual-intervention-required",
      recoveryObservation: { receiptKind, sourceState, catalogState },
    });
    throw new Error("Successor recovery state is indeterminate; manual intervention required");
  }
  if (action === "reconcile-forward-commit") {
    const bundle = await bundleLoader(configuration, {
      requireBuilderValidator: false,
      requireCurrentUniverse: false,
    });
    const preflightEvidence = { bundle };
    const verified = await verifyFinalReceipt(
      configuration,
      preflightEvidence,
      dependencies,
      { transaction },
    );
    await persistJournal(transaction, {
      phase: "committed",
      commitReconciledAt: new Date().toISOString(),
    });
    const postCommitReporting = await finalizePostCommitReporting(
      configuration,
      preflightEvidence,
      transaction,
      verified,
      dependencies,
    );
    await persistJournal(transaction, {
      phase: "committed-and-reported",
      postCommitReporting,
    });
    return {
      status: "committed-receipt-reconciled-and-verified",
      postchecks: verified.postcheck,
      postCommitReporting,
    };
  }
  let parentModes = transaction.journal.parentModes ?? [];
  try {
    await setParentMutation(parentModes, true);
    let rollbackSwapActions = [];
    if (action === "rollback-catalog-then-source") {
      rollbackSwapActions = await rollbackCatalogThenSource({
        configuration,
        journal: transaction.journal,
        swap: dependencies.atomicSwap,
        expectedNativeSourceSha256:
          transaction.journal.base.nativeSwapSourceSha256,
        expectedNativeBuildContract:
          transaction.journal.base.nativeSwapBuildContract,
        expectedNativeBuildReceipt:
          transaction.journal.nativeSwapBuildWitness,
      });
    }
    const base = await verifyBaseState(configuration, transaction.journal, dependencies);
    await persistJournal(transaction, {
      phase: "recovered-to-base",
      recoveredAt: new Date().toISOString(),
      recoveryAction: action,
      base,
      rollbackSwapActions,
    });
    return {
      status: "recovered-to-base-and-verified",
      recoveryAction: action,
      base,
      rollbackSwapActions,
    };
  } finally {
    await setParentMutation(parentModes, false);
  }
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const configuration = createConfiguration(options);
  if (options.mode === "preflight") {
    const evidence = await strictPreflight(configuration);
    process.stdout.write(`${JSON.stringify(evidence.summary, null, 2)}\n`);
  } else if (options.mode === "recover") {
    process.stdout.write(`${JSON.stringify(await recoverPromotion(configuration), null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(await executePromotion(configuration), null, 2)}\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`FLA/SWF counterpart successor promotion failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

export {
  CURRENT_PROFILE_RELATIVE,
  CATALOG_ALLOWED_CHANGED_PATHS,
  CATALOG_OUTPUTS,
  DISPOSITION,
  NO_COPY_CLOSURE_RELATIVE,
  PLAN_RELATIVE,
  PREFIX,
  RECEIPT_RELATIVE,
  REVIEW_LEDGER_RELATIVE,
  SCHEMA,
  UNIVERSE_RELATIVE,
  assertPreparedReceiptBundleBindings,
  assertFinalReceiptBundleBindings,
  assertFinalReceiptJournalBindings,
  assertAtomicSwapReceipt,
  createConfiguration,
  assertCatalogPathClosure,
  assertPreparedBaseUnchanged,
  executePromotion,
  ensureTransactionRoot,
  independentReviewPayloadSha256,
  inspectReportingPreconditions,
  loadAndValidateBundle,
  parseArguments,
  recoverPromotion,
  setParentMutation,
  strictPreflight,
  validateSuccessorBundle,
  verifyIndependentPreparedReviews,
  verifyQuiescenceSnapshots,
};
