#!/usr/bin/env node

/**
 * Gate 0A production-five successor freeze and producer inventory.
 *
 * This tool never creates the independent/apply-consumable provenance receipt.
 * It freezes the current candidate/Gate0A code and all family evidence, then
 * aggregates exactly 284 source-first records for independent review.
 */

import {execFile as execFileCallback} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CANONICAL_PROJECT_ROOT = "/Volumes/WestWorld/HELP MATH 2.0";
const CANONICAL_SOURCE_ROOT = path.join(
  CANONICAL_PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES",
);
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const PARENT_FREEZE_PATH =
  "work/adaptive-canvas-production-five.gate0a-freeze.v1.json";
const SUCCESSOR_FREEZE_PATH =
  "work/adaptive-canvas-production-five.gate0a-freeze.v2.json";
const INVENTORY_PATH =
  "work/adaptive-canvas-production-five.source-first-regeneration-inventory.v2.json";
const WRAPPER_TEST = "scripts/build-adaptive-canvas-gate0a-successor.test.mjs";

const FAMILY_RECEIPT_PATHS = Object.freeze([
  "work/gate0a/g3-l2-regeneration-provenance.v1.json",
  "work/gate0a/g4-l3-regeneration-provenance.v1.json",
  "work/gate0a/g5-l3-regeneration-provenance.v1.json",
  "work/gate0a/g5-l4-regeneration-provenance.v1.json",
  "work/gate0a/g5-l5-regeneration-provenance.v1.json",
]);

const FAMILY_CONTROL_PATHS = Object.freeze([
  "work/gate0a/g3-l2-family-receipt-freeze.v1.json",
  "work/gate0a/g4-l3-authoring-evidence-canonicalization.v1.json",
  "work/gate0a/g4-l3-family-receipt-freeze.v1.json",
  "work/gate0a/g5-l3-runtime-run-freeze.v2.json",
  "work/gate0a/g5-l3-source-first-run-freeze.v1.json",
  "work/gate0a/g5-l3-toolchain-canonicalization.v1.json",
  "work/gate0a/g5-l4-family-receipt-freeze.v1.json",
  "work/gate0a/g5-l5-family-receipt-freeze.v2.json",
  "work/gate0a/g5-l5-source-first-run-freeze.v1.json",
  "work/gate0a/g5-l5-toolchain-canonicalization.v3.json",
  "work/gate0a/in009-root-baseline-evidence-canonicalization.v1.json",
]);

const GATE0A_TOOL_PATHS = Object.freeze([
  "scripts/build-adaptive-canvas-gate0a-successor.mjs",
  "scripts/build-adaptive-canvas-gate0a-successor.test.mjs",
  "scripts/build-adaptive-canvas-regeneration-provenance-review.mjs",
  "scripts/build-adaptive-canvas-regeneration-provenance-review.test.mjs",
  "scripts/build-g3-l2-current-js-candidates.mjs",
  "scripts/build-g3-l2-current-js-candidates.test.mjs",
  "scripts/build-g3-l2-ffdec-canvas-pcode-factory.mjs",
  "scripts/build-g3-l2-ffdec-canvas-pcode-factory.test.mjs",
  "scripts/build-g5-l3-gate0a-source-crosscheck.mjs",
  "scripts/build-g5-l3-gate0a-source-crosscheck.test.mjs",
  "scripts/build-g5-l3-source-static-product-slice.mjs",
  "scripts/build-g5-l5-gate0a-source-first.mjs",
  "scripts/build-g5-l5-gate0a-source-first.test.mjs",
  "scripts/build-g5-l5-private-current-js.mjs",
  "scripts/canonicalize-gate0a-g4-l3-authoring-evidence.mjs",
  "scripts/canonicalize-gate0a-g5-l3-toolchain.mjs",
  "scripts/canonicalize-gate0a-g5-l5-toolchain.mjs",
  "scripts/canonicalize-gate0a-in009-root-baseline-evidence.mjs",
  "scripts/run-g3-l2-gate0a-runtime-regeneration.mjs",
  "scripts/run-g3-l2-gate0a-runtime-regeneration.test.mjs",
  "scripts/run-g4-l3-gate0a-runtime-regeneration.mjs",
  "scripts/run-g4-l3-gate0a-runtime-regeneration.test.mjs",
  "scripts/run-g5-l3-gate0a-runtime-regeneration.mjs",
  "scripts/run-g5-l3-gate0a-runtime-regeneration.test.mjs",
  "scripts/run-g5-l4-gate0a-runtime-regeneration.mjs",
  "scripts/run-g5-l4-gate0a-runtime-regeneration.test.mjs",
  "scripts/run-g5-l5-gate0a-runtime-regeneration.mjs",
  "scripts/run-g5-l5-gate0a-runtime-regeneration.test.mjs",
]);

const EXPECTED_FAMILY_COUNTS = Object.freeze(new Map([
  ["lesson-g03-l02-addition-subtraction-page-only-current-js", 70],
  ["lesson-g04-l03-negative-numbers", 40],
  ["lesson-g05-l03-exponents-prime-factorizations-page-only", 64],
  ["lesson-g05-l04-number-lines", 54],
  ["lesson-g05-l05-add-subtract-negative-numbers", 56],
]));

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonical(value[key]),
    ]));
  }
  return value;
}

function canonicalCompactBytes(value) {
  return Buffer.from(JSON.stringify(canonical(value)));
}

function canonicalBytes(value) {
  return Buffer.from(`${JSON.stringify(canonical(value), null, 2)}\n`);
}

function isSafeRelativePath(value) {
  return typeof value === "string" && value.length > 0 &&
    !path.isAbsolute(value) && !value.includes("\0") &&
    !value.split(/[\\/]/u).includes("..");
}

function projectPath(relativePath, label) {
  invariant(isSafeRelativePath(relativePath),
    `${label}: safe project-relative path required`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label}: path escapes worktree`);
  return resolved;
}

function evidenceAbsolutePath(relativePath, label) {
  invariant(isSafeRelativePath(relativePath),
    `${label}: safe evidence path required`);
  if (relativePath.startsWith("source-assets/")) {
    const resolved = path.resolve(CANONICAL_PROJECT_ROOT, relativePath);
    invariant(resolved.startsWith(`${CANONICAL_PROJECT_ROOT}${path.sep}`),
      `${label}: canonical project path escaped`);
    return {absolutePath: resolved, storageRoot: "canonical-project"};
  }
  if (relativePath.startsWith("HELP_COURSES/") ||
      relativePath.startsWith("HELP_KEYTERMS/")) {
    const resolved = path.resolve(CANONICAL_SOURCE_ROOT, relativePath);
    invariant(resolved.startsWith(`${CANONICAL_SOURCE_ROOT}${path.sep}`),
      `${label}: canonical source path escaped`);
    return {absolutePath: resolved, storageRoot: "canonical-source"};
  }
  return {
    absolutePath: projectPath(relativePath, label),
    storageRoot: "isolated-worktree",
  };
}

async function stableRead(absolutePath, label, expected = null) {
  const info = await lstat(absolutePath);
  invariant(info.isFile() && !info.isSymbolicLink(),
    `${label}: ordinary file required`);
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(before[key] === after[key], `${label}: unstable read (${key})`);
    }
    const identity = {bytes: bytes.length, sha256: sha256(bytes)};
    if (expected) {
      invariant(
        identity.bytes === expected.bytes &&
          identity.sha256 === expected.sha256,
        `${label}: bytes/SHA-256 mismatch`,
      );
    }
    return {
      bytes,
      identity,
      mode: (Number(before.mode) & 0o777).toString(8).padStart(3, "0"),
      physical: {
        dev: String(before.dev),
        ino: String(before.ino),
        size: String(before.size),
        mtimeNs: String(before.mtimeNs),
        ctimeNs: String(before.ctimeNs),
      },
    };
  } finally {
    await handle.close();
  }
}

async function readProject(relativePath, label, expected = null) {
  return stableRead(projectPath(relativePath, label), label, expected);
}

async function readProjectJson(relativePath, label, expected = null) {
  const observed = await readProject(relativePath, label, expected);
  return {
    value: JSON.parse(observed.bytes.toString("utf8")),
    path: relativePath,
    ...observed.identity,
    mode: observed.mode,
    physical: observed.physical,
  };
}

async function writeExclusive(relativePath, bytes, label) {
  const target = projectPath(relativePath, label);
  await mkdir(path.dirname(target), {recursive: true});
  const handle = await open(target, "wx", 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(target, 0o444);
  return readProject(relativePath, label, {
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

function validateCanonicalDocument(document, label) {
  invariant(document?.schemaVersion === 1 && typeof document.payload === "object",
    `${label}: schema/payload invalid`);
  const candidates = [
    sha256(canonicalCompactBytes(document.payload)),
    sha256(Buffer.from(`${JSON.stringify(canonical(document.payload))}\n`)),
    sha256(Buffer.from(`${JSON.stringify(canonical(document.payload), null, 2)}\n`)),
  ];
  invariant(candidates.includes(document.payloadSha256),
    `${label}: payload SHA-256 mismatch`);
}

function sameJson(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

async function identitySet(paths, label) {
  const uniquePaths = [...new Set(paths)].sort();
  invariant(uniquePaths.length === paths.length,
    `${label}: duplicate path in explicit set`);
  const rows = [];
  for (const relativePath of uniquePaths) {
    const observed = await readProject(relativePath, `${label}: ${relativePath}`);
    rows.push({
      path: relativePath,
      ...observed.identity,
      mode: observed.mode,
    });
  }
  return {
    count: rows.length,
    totalBytes: rows.reduce((sum, {bytes}) => sum + bytes, 0),
    checksumSetSha256: sha256(canonicalCompactBytes(rows)),
    rows,
  };
}

function collectIdentityObjects(value, output, context = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectIdentityObjects(item, output, `${context}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (
    isSafeRelativePath(value.path) &&
    Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
    /^[a-f0-9]{64}$/u.test(value.sha256 ?? "")
  ) {
    const existing = output.get(value.path);
    if (existing) {
      invariant(
        existing.bytes === value.bytes && existing.sha256 === value.sha256,
        `${context}: conflicting identity for ${value.path}`,
      );
    } else {
      output.set(value.path, {
        path: value.path,
        bytes: value.bytes,
        sha256: value.sha256,
      });
    }
  }
  for (const [key, child] of Object.entries(value)) {
    // Family receipts may retain an explicitly labelled historical binding to
    // explain why a source contract was canonicalized. It is evidence inside
    // the immutable family receipt, but it is not the identity of the current
    // path and therefore must not enter the current-file closure.
    if (/^stale/u.test(key)) continue;
    collectIdentityObjects(child, output, `${context}.${key}`);
  }
}

async function observedEvidenceSet(familyReceipts) {
  const identities = new Map();
  for (const receipt of familyReceipts) {
    collectIdentityObjects(receipt.value.payload, identities, receipt.path);
  }
  for (const pathValue of [V9_PLAN_PATH, ...FAMILY_RECEIPT_PATHS,
    ...FAMILY_CONTROL_PATHS]) {
    const observed = await readProject(pathValue, `evidence seed ${pathValue}`);
    identities.set(pathValue, {path: pathValue, ...observed.identity});
  }
  const rows = [];
  for (const identity of [...identities.values()].sort((left, right) =>
    left.path.localeCompare(right.path, "en"))) {
    const resolved = evidenceAbsolutePath(identity.path, identity.path);
    const observed = await stableRead(
      resolved.absolutePath,
      `referenced evidence ${identity.path}`,
      identity,
    );
    rows.push({
      path: identity.path,
      storageRoot: resolved.storageRoot,
      ...observed.identity,
      mode: observed.mode,
    });
  }
  return {
    count: rows.length,
    totalBytes: rows.reduce((sum, {bytes}) => sum + bytes, 0),
    checksumSetSha256: sha256(canonicalCompactBytes(rows)),
    rows,
  };
}

async function loadCoreInputs() {
  const [plan, parentFreeze, ...familyReceipts] = await Promise.all([
    readProjectJson(V9_PLAN_PATH, "v9 plan"),
    readProjectJson(PARENT_FREEZE_PATH, "parent Gate 0A freeze"),
    ...FAMILY_RECEIPT_PATHS.map((receiptPath) =>
      readProjectJson(receiptPath, `family receipt ${receiptPath}`)),
  ]);
  validateCanonicalDocument(plan.value, "v9 plan");
  validateCanonicalDocument(parentFreeze.value, "parent Gate 0A freeze");
  for (const receipt of familyReceipts) {
    validateCanonicalDocument(receipt.value, receipt.path);
  }
  return {plan, parentFreeze, familyReceipts};
}

async function currentHead() {
  const {stdout} = await execFile("git", ["rev-parse", "HEAD"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  const commit = stdout.trim();
  invariant(/^[a-f0-9]{40}$/u.test(commit), "current Git HEAD is invalid");
  return commit;
}

async function buildFreeze() {
  const core = await loadCoreInputs();
  const oldCandidatePaths = core.parentFreeze.value.payload
    ?.candidateFileSet?.files?.map(({path: candidatePath}) => candidatePath) ?? [];
  invariant(oldCandidatePaths.length === 56,
    "parent Gate 0A candidate path denominator drifted");
  const candidatePaths = [...new Set([
    ...oldCandidatePaths,
    ...GATE0A_TOOL_PATHS,
  ])];
  const [candidateCodeSet, familyControlSet, familyReceiptSet,
    referencedEvidenceSet, headCommit] = await Promise.all([
      identitySet(candidatePaths, "successor candidate code"),
      identitySet(FAMILY_CONTROL_PATHS, "family control evidence"),
      identitySet(FAMILY_RECEIPT_PATHS, "family receipt"),
      observedEvidenceSet(core.familyReceipts),
      currentHead(),
    ]);
  const payload = {
    status: "frozen-before-independent-regeneration-provenance-review",
    branch: "codex/help-math-adaptive-canvas-v2-20260823",
    headCommit,
    v9Plan: {
      path: core.plan.path,
      bytes: core.plan.bytes,
      sha256: core.plan.sha256,
      payloadSha256: core.plan.value.payloadSha256,
    },
    parentGate0aFreeze: {
      path: core.parentFreeze.path,
      bytes: core.parentFreeze.bytes,
      sha256: core.parentFreeze.sha256,
      payloadSha256: core.parentFreeze.value.payloadSha256,
    },
    candidateCodeSet,
    familyControlSet,
    familyReceiptSet,
    referencedEvidenceSet,
    boundaries: {
      browserStarted: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applySentinelUpdated: false,
      applyAuthorization: false,
    },
  };
  const document = {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-production-five-gate0a-freeze-v2",
    payloadSha256: sha256(canonicalCompactBytes(payload)),
    payload,
  };
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(
    SUCCESSOR_FREEZE_PATH,
    bytes,
    "successor Gate 0A freeze",
  );
  return {
    path: SUCCESSOR_FREEZE_PATH,
    ...written.identity,
    payloadSha256: document.payloadSha256,
    summary: {
      candidateCodeFileCount: candidateCodeSet.count,
      familyReceiptCount: familyReceiptSet.count,
      referencedEvidenceFileCount: referencedEvidenceSet.count,
      referencedEvidenceBytes: referencedEvidenceSet.totalBytes,
    },
  };
}

async function verifyIdentitySet(set, label) {
  invariant(
    Array.isArray(set?.rows) && set.count === set.rows.length &&
      new Set(set.rows.map(({path: rowPath}) => rowPath)).size === set.count,
    `${label}: invalid denominator`,
  );
  const rows = [];
  for (const row of set.rows) {
    const resolved = row.storageRoot
      ? evidenceAbsolutePath(row.path, `${label}: ${row.path}`)
      : {absolutePath: projectPath(row.path, `${label}: ${row.path}`)};
    if (row.storageRoot) {
      invariant(resolved.storageRoot === row.storageRoot,
        `${label}: ${row.path} storage root changed`);
    }
    const observed = await stableRead(
      resolved.absolutePath,
      `${label}: ${row.path}`,
      row,
    );
    rows.push({
      path: row.path,
      ...(row.storageRoot ? {storageRoot: row.storageRoot} : {}),
      ...observed.identity,
      mode: observed.mode,
    });
  }
  invariant(
    set.totalBytes === rows.reduce((sum, {bytes}) => sum + bytes, 0) &&
      set.checksumSetSha256 === sha256(canonicalCompactBytes(rows)),
    `${label}: checksum set drifted`,
  );
  return rows;
}

async function verifySuccessorFreeze(core) {
  const freeze = await readProjectJson(
    SUCCESSOR_FREEZE_PATH,
    "successor Gate 0A freeze",
  );
  validateCanonicalDocument(freeze.value, "successor Gate 0A freeze");
  const payload = freeze.value.payload;
  invariant(
    payload.status ===
      "frozen-before-independent-regeneration-provenance-review" &&
      payload.v9Plan?.sha256 === core.plan.sha256 &&
      payload.parentGate0aFreeze?.sha256 === core.parentFreeze.sha256,
    "successor Gate 0A freeze core identity drifted",
  );
  await verifyIdentitySet(payload.candidateCodeSet, "candidate code set");
  await verifyIdentitySet(payload.familyControlSet, "family control set");
  await verifyIdentitySet(payload.familyReceiptSet, "family receipt set");
  await verifyIdentitySet(payload.referencedEvidenceSet,
    "referenced evidence set");
  invariant(
    Object.values(payload.boundaries ?? {}).every((value) => value === false),
    "successor freeze boundaries are not all false",
  );
  return freeze;
}

export function runtimeSetIdentity(records) {
  invariant(Array.isArray(records) && records.length === 284,
    "runtime set must contain exactly 284 records");
  const inputRows = [];
  const outputRows = [];
  for (const record of records) {
    inputRows.push(
      `${record.input.sha256} ${record.input.bytes} ${record.animationId} ${record.assetPath}`,
    );
    outputRows.push(
      `${record.output.sha256} ${record.output.bytes} ${record.animationId} ${record.assetPath}`,
    );
  }
  inputRows.sort();
  outputRows.sort();
  return {
    totalRuntimeCount: records.length,
    pageRendererCount: records.filter(({pageRenderer}) => pageRenderer).length,
    loadedHostCount: records.filter(({pageRenderer}) => !pageRenderer).length,
    inputChecksumSetSha256: sha256(Buffer.from(inputRows.join("\n"))),
    outputChecksumSetSha256: sha256(Buffer.from(outputRows.join("\n"))),
  };
}

function receiptGeneratorIdentity(receipt) {
  const generator = receipt.value.payload?.inputs?.wrapper;
  invariant(
    isSafeRelativePath(generator?.path) &&
      Number.isSafeInteger(generator?.bytes) && generator.bytes > 0 &&
      /^[a-f0-9]{64}$/u.test(generator?.sha256 ?? ""),
    `${receipt.path}: wrapper generator identity missing`,
  );
  return {path: generator.path, bytes: generator.bytes,
    sha256: generator.sha256};
}

function validateFamilyReceipt(receipt, v9ById) {
  const payload = receipt.value.payload;
  invariant(
    payload.status === "pass" &&
      payload.provenancePolicy ===
        "source-first-or-canonical-advanced-manual-v1" &&
      payload.summary?.sourceFirstPassCount === payload.records?.length &&
      payload.summary?.advancedManualPassCount === 0 &&
      payload.summary?.noGoCount === 0 &&
      Object.values(payload.boundaries ?? {}).every((value) => value === false),
    `${receipt.path}: family receipt is not a closed source-first PASS`,
  );
  const releaseIds = new Set(payload.records.map(({releaseId}) => releaseId));
  invariant(releaseIds.size === 1, `${receipt.path}: release ID denominator drifted`);
  const releaseId = [...releaseIds][0];
  invariant(
    EXPECTED_FAMILY_COUNTS.get(releaseId) === payload.records.length,
    `${receipt.path}: family runtime denominator drifted`,
  );
  const generator = receiptGeneratorIdentity(receipt);
  const formalRecords = [];
  for (const record of payload.records) {
    const v9 = v9ById.get(record.animationId);
    invariant(v9, `${record.animationId}: missing v9 runtime`);
    for (const field of ["animationId", "metadataAnimationId", "pageRenderer",
      "assetPath", "relativePath", "releaseId", "family", "lane"]) {
      invariant(record[field] === v9[field],
        `${record.animationId}: ${field} differs from v9`);
    }
    invariant(sameJson(record.input, v9.input) && sameJson(record.output, v9.output),
      `${record.animationId}: input/output differs from v9`);
    invariant(
      record.provenanceClass === "source-first-regeneration" &&
        record.browserStarted === false && record.exactV9InputMatch === true &&
        record.regeneratedRuntime?.bytes === v9.input.bytes &&
        record.regeneratedRuntime?.sha256 === v9.input.sha256 &&
        record.observedV1Materialization?.bytes === v9.input.bytes &&
        record.observedV1Materialization?.sha256 === v9.input.sha256,
      `${record.animationId}: source-first materialization proof is incomplete`,
    );
    invariant(
      isSafeRelativePath(record.source?.path) &&
        Number.isSafeInteger(record.source?.bytes) && record.source.bytes > 0 &&
        /^[a-f0-9]{64}$/u.test(record.source?.sha256 ?? ""),
      `${record.animationId}: canonical source identity missing`,
    );
    formalRecords.push({
      animationId: record.animationId,
      pageRenderer: record.pageRenderer,
      assetPath: record.assetPath,
      lane: record.lane,
      input: record.input,
      output: record.output,
      provenanceClass: "source-first-regeneration",
      sourceEvidence: [
        {role: "canonical-swf", path: record.source.path,
          bytes: record.source.bytes, sha256: record.source.sha256},
        {role: "source-regeneration-receipt", path: receipt.path,
          bytes: receipt.bytes, sha256: receipt.sha256},
      ],
      generator,
      producerEvidence: {
        familyReceipt: {path: receipt.path, bytes: receipt.bytes,
          sha256: receipt.sha256},
        familyRecordSha256: sha256(canonicalCompactBytes(record)),
        placements: record.placements,
      },
    });
  }
  return formalRecords;
}

async function buildInventory() {
  const core = await loadCoreInputs();
  const freeze = await verifySuccessorFreeze(core);
  const v9Rows = core.plan.value.payload?.runtimes ?? [];
  invariant(
    v9Rows.length === 284 &&
      v9Rows.filter(({pageRenderer}) => pageRenderer).length === 283 &&
      v9Rows.filter(({pageRenderer}) => !pageRenderer).length === 1,
    "v9 production-five runtime denominator drifted",
  );
  const v9ById = new Map(v9Rows.map((row) => [row.animationId, row]));
  invariant(v9ById.size === 284, "v9 runtime IDs are not unique");
  const producerById = new Map();
  for (const receipt of core.familyReceipts) {
    for (const record of validateFamilyReceipt(receipt, v9ById)) {
      invariant(!producerById.has(record.animationId),
        `${record.animationId}: duplicate family provenance record`);
      producerById.set(record.animationId, record);
    }
  }
  invariant(producerById.size === 284,
    `producer provenance denominator drifted: ${producerById.size}`);
  const records = v9Rows.map((v9) => {
    const record = producerById.get(v9.animationId);
    invariant(record, `${v9.animationId}: family provenance missing`);
    return record;
  });
  const placementCount = records.reduce(
    (sum, {producerEvidence}) =>
      sum + (producerEvidence.placements?.length ?? 0),
    0,
  );
  const in028 = records.find(
    ({animationId}) => animationId === "course-g05-l03-in-028",
  );
  invariant(
    placementCount === 284 && in028?.producerEvidence?.placements?.length === 2,
    "production placement denominator or G5 L3 IN028 duplicate binding drifted",
  );
  const runtimeSet = runtimeSetIdentity(records);
  invariant(runtimeSet.pageRendererCount === 283 && runtimeSet.loadedHostCount === 1,
    "producer runtime-set page/host denominator drifted");
  const familyReceipts = core.familyReceipts.map((receipt) => ({
    path: receipt.path,
    bytes: receipt.bytes,
    sha256: receipt.sha256,
    payloadSha256: receipt.value.payloadSha256,
    recordCount: receipt.value.payload.records.length,
  }));
  const payload = {
    status: "candidate-pass-awaiting-independent-review",
    authorityClass: "producer-family-source-first-aggregation",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    successorFreeze: {
      path: freeze.path,
      bytes: freeze.bytes,
      sha256: freeze.sha256,
      payloadSha256: freeze.value.payloadSha256,
    },
    v9Plan: {
      path: core.plan.path,
      bytes: core.plan.bytes,
      sha256: core.plan.sha256,
      payloadSha256: core.plan.value.payloadSha256,
    },
    runtimeSet,
    summary: {
      recordCount: 284,
      pageRendererCount: 283,
      loadedHostCount: 1,
      placementCount: 284,
      sourceFirstPassCount: 284,
      advancedManualPassCount: 0,
      noGoCount: 0,
      familyReceiptCount: 5,
      independentReviewCompleted: false,
      applyAuthorization: false,
    },
    familyReceipts,
    records,
    boundaries: {
      browserStarted: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applySentinelUpdated: false,
      applyAuthorization: false,
      formalReceiptWrittenByProducer: false,
    },
  };
  const document = {
    schemaVersion: 2,
    receiptType:
      "adaptive-canvas-production-five-source-first-regeneration-inventory-v2",
    payloadSha256: sha256(canonicalCompactBytes(payload)),
    payload,
  };
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(
    INVENTORY_PATH,
    bytes,
    "source-first regeneration inventory v2",
  );
  return {
    path: INVENTORY_PATH,
    ...written.identity,
    payloadSha256: document.payloadSha256,
    summary: payload.summary,
    runtimeSet,
  };
}

async function checkArtifacts() {
  const core = await loadCoreInputs();
  const freeze = await verifySuccessorFreeze(core);
  const inventory = await readProjectJson(INVENTORY_PATH,
    "source-first regeneration inventory v2");
  invariant(
    inventory.value?.schemaVersion === 2 &&
      inventory.value?.receiptType ===
        "adaptive-canvas-production-five-source-first-regeneration-inventory-v2" &&
      inventory.value.payloadSha256 ===
        sha256(canonicalCompactBytes(inventory.value.payload)) &&
      canonicalBytes(inventory.value).equals(
        await readProject(INVENTORY_PATH, "inventory canonical bytes")
          .then(({bytes}) => bytes)),
    "source-first regeneration inventory v2 is not canonical",
  );
  invariant(
    inventory.value.payload?.successorFreeze?.sha256 === freeze.sha256 &&
      inventory.value.payload?.summary?.recordCount === 284 &&
      inventory.value.payload?.summary?.sourceFirstPassCount === 284 &&
      inventory.value.payload?.summary?.noGoCount === 0 &&
      inventory.value.payload?.summary?.independentReviewCompleted === false &&
      inventory.value.payload?.summary?.applyAuthorization === false,
    "source-first regeneration inventory v2 status drifted",
  );
  return {
    status: "pass-read-only-check",
    freeze: {path: freeze.path, bytes: freeze.bytes, sha256: freeze.sha256},
    inventory: {
      path: inventory.path,
      bytes: inventory.bytes,
      sha256: inventory.sha256,
      payloadSha256: inventory.value.payloadSha256,
    },
    recordCount: 284,
    browserStarted: false,
    applyAuthorization: false,
  };
}

export function parseArguments(argv) {
  invariant(
    argv.length === 1,
    "usage: build-adaptive-canvas-gate0a-successor.mjs --freeze|--inventory|--check",
  );
  if (argv[0] === "--freeze") return {mode: "freeze"};
  if (argv[0] === "--inventory") return {mode: "inventory"};
  if (argv[0] === "--check") return {mode: "check"};
  throw new Error(
    "usage: build-adaptive-canvas-gate0a-successor.mjs --freeze|--inventory|--check",
  );
}

async function main(argv = process.argv.slice(2)) {
  const {mode} = parseArguments(argv);
  const result = mode === "freeze" ? {freeze: await buildFreeze()}
    : mode === "inventory" ? {inventory: await buildInventory()}
      : await checkArtifacts();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
