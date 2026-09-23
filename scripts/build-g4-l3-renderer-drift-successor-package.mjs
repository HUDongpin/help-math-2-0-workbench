#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ZERO_SHA256 = "0".repeat(64);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const RELEASE_ID = "lesson-g04-l03-negative-numbers";

const PROTECTED_PATHS = Object.freeze([
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
  ".gitignore",
  ".vercelignore",
]);

export const PRODUCTION_TRANSITION = Object.freeze({
  transitionId: "g4-l3-renderer-live-drift-2026-07-29-v2",
  outputRelative:
    "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v2.json",
  transactionRootRelative:
    "work/g4-l3-renderer-live-drift-successor-transactions",
  predecessor: Object.freeze({
    path:
      "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json",
    bytes: 24088,
    sha256:
      "72778cc6825230b3c745a393b5b81bc4319bb7da2ca2687127642356d64404d8",
  }),
  files: Object.freeze([
    Object.freeze({
      role: "renderer-member-audit",
      animationId: "course-g04-l03-ir-001-341242cc",
      path:
        "migrations/course-g04-l03-ir-001-341242cc/audit/renderer-frame-domain-support.json",
      preimage: Object.freeze({
        bytes: 19159,
        mode: 0o644,
        sha256:
          "7d658df16bd288f587732d6aeec0607ca50f9d4467b9e50bae9c9a03ad409687",
      }),
      postimage: Object.freeze({
        bytes: 19159,
        mode: 0o644,
        sha256:
          "28cadc3aa452a88315c6a60a3c05901742e9a57e20cb043a06228ba21180eeb3",
      }),
    }),
    Object.freeze({
      role: "renderer-member-audit",
      animationId: "course-g04-l03-ti-003",
      path:
        "migrations/course-g04-l03-ti-003/audit/renderer-frame-domain-support.json",
      preimage: Object.freeze({
        bytes: 31775,
        mode: 0o644,
        sha256:
          "9f30351b2964cb56e06a3b08bb63dfc394b602513c1884a8cfd6af1ecb81fb83",
      }),
      postimage: Object.freeze({
        bytes: 31775,
        mode: 0o644,
        sha256:
          "702e72d243ce9f3ae2e00a9305571c2fa72b60bc1342729ed5c07a3bb01a4ab0",
      }),
    }),
    Object.freeze({
      role: "renderer-support-index",
      path: "reports/g4-l3-renderer-frame-domain-support-index.json",
      preimage: Object.freeze({
        bytes: 18527,
        mode: 0o644,
        sha256:
          "14c9ecc45fcca2594d5775c741e392729e3f6d817d9cf2175b80da8ac6b7518d",
      }),
      postimage: Object.freeze({
        bytes: 18527,
        mode: 0o644,
        sha256:
          "29c90cae6af13584cdd1611ac821e198f4511c37a9b8da6a3091787203fbe46c",
      }),
    }),
    Object.freeze({
      role: "renderer-gap-report",
      path: "reports/g4-l3-renderer-gap-closure.json",
      preimage: Object.freeze({
        bytes: 168536,
        mode: 0o644,
        sha256:
          "eaa8cd11853ab29c98018ddce0ce553c8763bfe2c0b86e99007266f312e31151",
      }),
      postimage: Object.freeze({
        bytes: 168536,
        mode: 0o644,
        sha256:
          "c0c18d2a134e3cb932713749d022c7920a69bebdf7d58ce40f46b4aaf6c49d11",
      }),
    }),
  ]),
  protectedPaths: PROTECTED_PATHS,
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function assertSafeRelative(relativePath, label = "path") {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0") &&
      !path.isAbsolute(relativePath),
    `${label} must be a safe project-relative path`,
  );
  const segments = relativePath.split("/");
  invariant(
    segments.every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    ),
    `${label} contains an unsafe path segment`,
  );
  invariant(
    portable(path.normalize(relativePath)) === relativePath,
    `${label} is not normalized`,
  );
  return relativePath;
}

function binding(relativePath, bytes, mode) {
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode,
  };
}

function identity(metadata) {
  return {
    device: metadata.dev,
    inode: metadata.ino,
    linkCount: metadata.nlink,
    size: metadata.size,
    mode: metadata.mode & 0o777,
    modifiedMs: metadata.mtimeMs,
    changedMs: metadata.ctimeMs,
  };
}

function evidenceRecord(file) {
  return {...file.binding, identity: file.identity};
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function withFingerprint(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return {...value, [field]: sha256(stableJson(copy))};
}

async function resolvedRoot(candidate, label) {
  const resolved = await realpath(path.resolve(candidate));
  const metadata = await lstat(resolved);
  invariant(metadata.isDirectory(), `${label} is not a directory`);
  return resolved;
}

function pathWithin(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function secureRead(root, relativePath, options = {}) {
  assertSafeRelative(relativePath);
  const rootReal = await resolvedRoot(root, options.rootLabel || "root");
  const absolutePath = path.join(rootReal, ...relativePath.split("/"));
  invariant(pathWithin(rootReal, absolutePath), `${relativePath}: path escaped root`);
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected a regular non-symlink file`,
  );
  if (!options.allowHardlink) {
    invariant(
      metadata.nlink === 1,
      `${relativePath}: hard-linked control or evidence file is forbidden`,
    );
  }
  const resolved = await realpath(absolutePath);
  invariant(
    resolved === absolutePath && pathWithin(rootReal, resolved),
    `${relativePath}: realpath escaped or changed identity`,
  );
  const bytes = await readFile(absolutePath);
  const observed = {
    path: relativePath,
    absolutePath,
    bytes,
    binding: binding(relativePath, bytes, metadata.mode & 0o777),
    identity: identity(metadata),
  };
  if (options.expected) {
    invariant(
      observed.binding.bytes === options.expected.bytes &&
        observed.binding.sha256 === options.expected.sha256 &&
        (options.expected.mode === undefined ||
          observed.binding.mode === options.expected.mode),
      `${relativePath}: exact binding drifted`,
    );
  }
  if (options.expectedMode !== undefined) {
    invariant(
      observed.binding.mode === options.expectedMode,
      `${relativePath}: mode drifted`,
    );
  }
  return observed;
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function ensureSafeDirectory(root, relativePath) {
  assertSafeRelative(relativePath, "directory path");
  const rootReal = await resolvedRoot(root, "project root");
  let current = rootReal;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    try {
      const metadata = await lstat(current);
      invariant(
        metadata.isDirectory() && !metadata.isSymbolicLink(),
        `${portable(path.relative(rootReal, current))}: unsafe directory`,
      );
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await mkdir(current, {mode: 0o755});
    }
    invariant(
      (await realpath(current)) === current,
      `${portable(path.relative(rootReal, current))}: directory realpath drifted`,
    );
  }
  return current;
}

async function writeExclusiveImmutable(absolutePath, bytes) {
  const handle = await open(absolutePath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(absolutePath, 0o444);
}

function validateTransition(transition) {
  invariant(
    transition &&
      /^[a-z0-9][a-z0-9-]*$/.test(transition.transitionId) &&
      Array.isArray(transition.files) &&
      transition.files.length === 4,
    "renderer successor transition identity or file count drifted",
  );
  assertSafeRelative(transition.outputRelative, "successor output");
  assertSafeRelative(
    transition.transactionRootRelative,
    "successor transaction root",
  );
  invariant(
    transition.outputRelative.startsWith("reports/") &&
      transition.outputRelative.endsWith(".json"),
    "successor output must be a named JSON report",
  );
  invariant(
    transition.transactionRootRelative.startsWith("work/"),
    "successor transaction root must remain under work/",
  );
  const expectedRoles = [
    "renderer-member-audit",
    "renderer-member-audit",
    "renderer-support-index",
    "renderer-gap-report",
  ];
  invariant(
    sameJson(
      transition.files.map(({role}) => role),
      expectedRoles,
    ),
    "renderer successor role order drifted",
  );
  invariant(
    new Set(transition.files.map(({path: itemPath}) => itemPath)).size === 4,
    "renderer successor paths repeat",
  );
  for (const item of transition.files) {
    assertSafeRelative(item.path, "transition file");
    for (const image of [item.preimage, item.postimage]) {
      invariant(
        Number.isSafeInteger(image?.bytes) &&
          image.bytes > 0 &&
          Number.isSafeInteger(image.mode) &&
          image.mode === 0o644 &&
          SHA256_PATTERN.test(image.sha256),
        `${item.path}: invalid transition binding`,
      );
    }
    invariant(
      item.preimage.sha256 !== item.postimage.sha256,
      `${item.path}: transition is a no-op`,
    );
  }
  invariant(
    sameJson(transition.protectedPaths, PROTECTED_PATHS),
    "protected path allowlist drifted",
  );
  invariant(
    transition.predecessor?.path ===
      "reports/g4-l3-source-static-source-audit-wave2b-derived-refresh-receipt.json" &&
      Number.isSafeInteger(transition.predecessor.bytes) &&
      SHA256_PATTERN.test(transition.predecessor.sha256),
    "predecessor receipt binding is invalid",
  );
  return transition;
}

function validateAudit(document, item, label) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType === "renderer-frame-domain-support-audit" &&
      document.animationId === item.animationId &&
      document.status === "renderer-frame-domain-support-incomplete" &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${label}: renderer audit semantics drifted or promoted`,
  );
  invariant(
    document.summary?.renderableCount +
        document.summary?.blockedCount ===
      document.summary?.probeCount,
    `${label}: renderer audit probe partition drifted`,
  );
}

function validateIndex(document, transition, label) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "course-shell-pilot-renderer-frame-domain-support-index" &&
      document.scope === "explicit-animation-id-selection" &&
      document.status === "renderer-frame-domain-support-incomplete" &&
      document.pilotCount === 40 &&
      document.reports?.length === 40 &&
      document.fullyRenderablePilotCount === 2 &&
      document.totalProbeCount === 1046 &&
      document.totalRenderableCount === 232 &&
      document.totalBlockedCount === 814 &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${label}: renderer index semantics drifted or promoted`,
  );
  invariant(
    new Set(document.reports.map(({animationId}) => animationId)).size === 40,
    `${label}: renderer index contains duplicate members`,
  );
  for (const item of transition.files.filter(
    ({role}) => role === "renderer-member-audit",
  )) {
    const row = document.reports.find(
      ({animationId}) => animationId === item.animationId,
    );
    invariant(
      row?.path === item.path && SHA256_PATTERN.test(row.sha256),
      `${label}: ${item.animationId} binding is absent`,
    );
  }
}

function validateGap(document, label) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "g4-l3-renderer-gap-closure" &&
      document.scope?.releaseId === RELEASE_ID &&
      document.scope?.releaseMembers === 40 &&
      document.summary?.declaredFrameDomains === 261 &&
      document.summary?.fullyRenderableFrameDomains === 36 &&
      document.summary?.renderableExactProbes === 232 &&
      document.summary?.blockedOrMismatchedProbes === 814 &&
      document.summary?.safeRendererOnlyImplementationDomainsNow === 0 &&
      Object.values(document.acceptance || {}).every((value) => value === false) &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${label}: renderer gap semantics drifted or promoted`,
  );
}

function validateProtectedDocuments(files, transition) {
  const byPath = new Map(files.map((entry) => [entry.path, entry]));
  invariant(
    byPath.size === transition.protectedPaths.length,
    "protected binding set drifted",
  );
  const completion = parseJson(
    byPath.get("catalog/completion-ledger.json").bytes,
    "completion ledger",
  );
  invariant(
    completion.summary?.declaredComplete === 0 &&
      completion.summary?.strictComplete === 0 &&
      Array.isArray(completion.entries) &&
      completion.entries.length === 0,
    "completion ledger is not strict-zero",
  );
  const releaseLedger = parseJson(
    byPath.get("catalog/lesson-release-ledger.json").bytes,
    "lesson release ledger",
  );
  const release = releaseLedger.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    releaseLedger.summary?.publishedReleaseCount === 0 &&
      releaseLedger.summary?.strictCompleteMemberCount === 0 &&
      release?.expectedMemberCount === 40 &&
      release.strictCompleteCount === 0 &&
      release.published === false &&
      release.gate?.open === false,
    "lesson release ledger is not strict-zero and unpublished",
  );
  const releases = parseJson(
    byPath.get("catalog/lesson-releases.json").bytes,
    "lesson release declaration",
  );
  const declaration = releases.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    declaration?.publicationMode === "atomic" &&
      declaration.members?.length === 40,
    "G4 L3 release declaration drifted",
  );
  const predecessor = byPath.get(transition.predecessor.path);
  invariant(
    predecessor.binding.bytes === transition.predecessor.bytes &&
      predecessor.binding.sha256 === transition.predecessor.sha256,
    "predecessor receipt exact binding drifted",
  );
  const predecessorDocument = parseJson(
    predecessor.bytes,
    "predecessor receipt",
  );
  invariant(
    predecessorDocument.authorityBoundary?.strictAcceptanceEffect === "none" &&
      predecessorDocument.authorityBoundary?.releaseEffect === "none" &&
      predecessorDocument.semanticState?.completionLedger?.strictComplete === 0 &&
      predecessorDocument.semanticState?.lessonReleaseLedger?.published === false,
    "predecessor receipt authority or semantic state drifted",
  );
  return {
    strictComplete: 0,
    publishedReleaseCount: 0,
    g4L3Published: false,
  };
}

function validatePostimageRelations(preimages, postimages, protectedFiles, transition) {
  const preByPath = new Map(preimages.map((entry) => [entry.path, entry]));
  const postByPath = new Map(postimages.map((entry) => [entry.path, entry]));
  const memberItems = transition.files.filter(
    ({role}) => role === "renderer-member-audit",
  );
  for (const item of memberItems) {
    const before = parseJson(preByPath.get(item.path).bytes, `${item.path} preimage`);
    const after = parseJson(postByPath.get(item.path).bytes, `${item.path} postimage`);
    validateAudit(before, item, `${item.path} preimage`);
    validateAudit(after, item, `${item.path} postimage`);
    invariant(
      before.status === after.status &&
        sameJson(before.summary, after.summary) &&
        before.strictAcceptanceEffect === after.strictAcceptanceEffect,
      `${item.path}: successor changed renderer outcomes or authority`,
    );
  }
  const indexItem = transition.files.find(
    ({role}) => role === "renderer-support-index",
  );
  const beforeIndex = parseJson(
    preByPath.get(indexItem.path).bytes,
    "renderer index preimage",
  );
  const afterIndex = parseJson(
    postByPath.get(indexItem.path).bytes,
    "renderer index postimage",
  );
  validateIndex(beforeIndex, transition, "renderer index preimage");
  validateIndex(afterIndex, transition, "renderer index postimage");
  invariant(
    beforeIndex.status === afterIndex.status &&
      beforeIndex.fullyRenderablePilotCount === afterIndex.fullyRenderablePilotCount &&
      beforeIndex.totalProbeCount === afterIndex.totalProbeCount &&
      beforeIndex.totalRenderableCount === afterIndex.totalRenderableCount &&
      beforeIndex.totalBlockedCount === afterIndex.totalBlockedCount &&
      beforeIndex.strictAcceptanceEffect === afterIndex.strictAcceptanceEffect,
    "renderer index successor changed aggregate outcomes or authority",
  );
  const changedRows = [];
  for (let index = 0; index < beforeIndex.reports.length; index += 1) {
    const before = beforeIndex.reports[index];
    const after = afterIndex.reports[index];
    invariant(
      before.animationId === after.animationId && before.path === after.path,
      "renderer index membership or ordering changed",
    );
    if (!sameJson(before, after)) changedRows.push(after.animationId);
  }
  invariant(
    sameJson(
      changedRows,
      memberItems.map(({animationId}) => animationId),
    ),
    "renderer index changed outside the two audit bindings",
  );
  for (const item of memberItems) {
    const row = afterIndex.reports.find(
      ({animationId}) => animationId === item.animationId,
    );
    invariant(
      row.sha256 === item.postimage.sha256,
      `${item.animationId}: renderer index does not bind the exact postimage`,
    );
  }
  const gapItem = transition.files.find(
    ({role}) => role === "renderer-gap-report",
  );
  const beforeGap = parseJson(
    preByPath.get(gapItem.path).bytes,
    "renderer gap preimage",
  );
  const afterGap = parseJson(
    postByPath.get(gapItem.path).bytes,
    "renderer gap postimage",
  );
  validateGap(beforeGap, "renderer gap preimage");
  validateGap(afterGap, "renderer gap postimage");
  invariant(
    sameJson(beforeGap.summary, afterGap.summary) &&
      sameJson(beforeGap.categoryCounts, afterGap.categoryCounts) &&
      sameJson(beforeGap.decision, afterGap.decision) &&
      sameJson(beforeGap.acceptance, afterGap.acceptance) &&
      beforeGap.strictAcceptanceEffect === afterGap.strictAcceptanceEffect,
    "renderer gap successor changed decisions, outcomes, or authority",
  );
  const protectedByPath = new Map(
    protectedFiles.map((entry) => [entry.path, entry]),
  );
  invariant(
    afterGap.bindings?.rendererSupportIndex?.sha256 ===
      indexItem.postimage.sha256 &&
      afterGap.bindings?.rendererSupportIndex?.bytes ===
        indexItem.postimage.bytes &&
      afterGap.bindings?.lessonRelease?.sha256 ===
        protectedByPath.get("catalog/lesson-releases.json").binding.sha256 &&
      afterGap.bindings?.lessonRelease?.bytes ===
        protectedByPath.get("catalog/lesson-releases.json").binding.bytes,
    "renderer gap postimage does not bind the exact index and lesson release",
  );
}

function makeJournal(receipt) {
  const events = [
    {
      event: "PLAN_SEALED",
      payload: {
        transitionId: receipt.transitionId,
        transactionId: receipt.transactionId,
      },
    },
    {
      event: "PREIMAGE_PREPUBLISH_RECHECK_EXPECTED",
      payload: {
        preimageSetSha256: sha256(stableJson(receipt.preimages)),
      },
    },
    {
      event: "POSTIMAGES_VERIFIED",
      payload: {
        postimageSetSha256: sha256(stableJson(receipt.postimages)),
      },
    },
    {
      event: "READY_FOR_ATOMIC_NO_REPLACE_PUBLISH",
      payload: {
        output: receipt.output,
        receiptFingerprintSha256: receipt.receiptFingerprintSha256,
      },
    },
  ];
  const journal = [];
  let previousRecordSha256 = ZERO_SHA256;
  for (let index = 0; index < events.length; index += 1) {
    const base = {
      sequence: index + 1,
      previousRecordSha256,
      ...events[index],
    };
    const record = {
      ...base,
      recordSha256: sha256(stableJson(base)),
    };
    journal.push(record);
    previousRecordSha256 = record.recordSha256;
  }
  return journal;
}

function validateJournal(journal, receipt) {
  invariant(
    sameJson(journal, makeJournal(receipt)),
    "successor journal hash chain or event set drifted",
  );
}

function buildReceipt({
  transition,
  generator,
  preimages,
  postimages,
  protectedFiles,
  semanticState,
}) {
  const preimageBindings = preimages.map(evidenceRecord);
  const postimageBindings = postimages.map(evidenceRecord);
  const protectedBindings = protectedFiles.map(evidenceRecord);
  const transactionId = sha256(
    stableJson({
      transitionId: transition.transitionId,
      generator,
      preimages: preimageBindings,
      postimages: postimageBindings,
      protectedBindings,
    }),
  );
  const receipt = {
    schemaVersion: 1,
    receiptType: "g4-l3-renderer-live-drift-successor-receipt",
    status: "prepared-successor-candidate",
    transitionId: transition.transitionId,
    transactionId,
    output: {
      path: transition.outputRelative,
      publicationMode: "trusted-local-leaf-hard-link-no-replace",
      canonicalReportsReplaced: false,
      postimagesInstalled: false,
    },
    generatedBy: generator,
    predecessor: protectedBindings.find(
      ({path: itemPath}) => itemPath === transition.predecessor.path,
    ),
    preimages: preimageBindings,
    postimages: postimageBindings,
    protectedBindings,
    semanticState,
    preservation: {
      canonicalRendererReportsModified: false,
      postimagesInstalled: false,
      completionLedgerWritten: false,
      lessonReleaseLedgerWritten: false,
      lessonReleaseDeclarationWritten: false,
      runtimeSessionWritten: false,
      publicationStateWritten: false,
    },
    authorityBoundary: {
      structuralEvidenceEffect: "records-current-javascript-audit-postimages-only",
      originalRuntimeEffect: "none",
      audioAcceptanceEffect: "none",
      humanReviewEffect: "none",
      ownerAcceptanceEffect: "none",
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    },
    securityBoundary: {
      workspaceTrustModel:
        "trusted-local-bounded-writer with a non-atomic external-writer boundary",
      leafNoReplace: true,
      prepublishExactContentAndIdentityRecheck: true,
      externalWriterAtomicity: false,
      ancestorPathRaceClosed: false,
      canonicalReportWriteCapability: false,
    },
    receiptFingerprintSha256: "",
  };
  return withFingerprint(receipt, "receiptFingerprintSha256");
}

function buildPackage({transition, receipt, postimages}) {
  const successorPackage = {
    schemaVersion: 1,
    packageType: "g4-l3-renderer-live-drift-successor-package",
    status: "prepared-successor-candidate",
    transactionId: receipt.transactionId,
    receipt,
    journal: makeJournal(receipt),
    postimagePayloads: postimages.map(({path: itemPath, bytes, binding: item}) => ({
      path: itemPath,
      encoding: "base64",
      bytes: item.bytes,
      sha256: item.sha256,
      mode: item.mode,
      contentBase64: bytes.toString("base64"),
    })),
    limitations: [
      "This package does not replace canonical renderer reports.",
      "The four embedded postimages are not installed by this transaction.",
      "Embedded postimages are acceptance-neutral current-JavaScript engineering evidence only.",
      "No original-runtime, audio, visual, human, owner, strict-completion, or release gate is advanced.",
      "The writer performs honest prepublish exact content and identity rechecks under a trusted-local, non-atomic external-writer boundary.",
      "Leaf no-replace publication does not provide dirfd/openat-grade adversarial ancestor path-race safety or atomicity against an independent external writer.",
    ],
    packageFingerprintSha256: "",
  };
  return withFingerprint(successorPackage, "packageFingerprintSha256");
}

function validatePackage(successorPackage, transition) {
  invariant(
    successorPackage?.schemaVersion === 1 &&
      successorPackage.packageType ===
        "g4-l3-renderer-live-drift-successor-package" &&
      successorPackage.status ===
        "prepared-successor-candidate" &&
      successorPackage.transactionId ===
        successorPackage.receipt?.transactionId,
    "successor package identity drifted",
  );
  invariant(
    withFingerprint(
      {...successorPackage, packageFingerprintSha256: ""},
      "packageFingerprintSha256",
    ).packageFingerprintSha256 === successorPackage.packageFingerprintSha256,
    "successor package fingerprint drifted",
  );
  const receipt = successorPackage.receipt;
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.receiptType ===
        "g4-l3-renderer-live-drift-successor-receipt" &&
      receipt.status === "prepared-successor-candidate" &&
      receipt.transitionId === transition.transitionId &&
      receipt.output?.path === transition.outputRelative &&
      receipt.output?.canonicalReportsReplaced === false &&
      receipt.output?.postimagesInstalled === false &&
      receipt.semanticState?.strictComplete === 0 &&
      receipt.semanticState?.publishedReleaseCount === 0 &&
      receipt.semanticState?.g4L3Published === false &&
      Object.values(receipt.preservation || {}).every((value) => value === false) &&
      receipt.authorityBoundary?.strictAcceptanceEffect === "none" &&
      receipt.authorityBoundary?.releaseEffect === "none" &&
      receipt.securityBoundary?.leafNoReplace === true &&
      receipt.securityBoundary?.prepublishExactContentAndIdentityRecheck ===
        true &&
      receipt.securityBoundary?.externalWriterAtomicity === false &&
      receipt.securityBoundary?.ancestorPathRaceClosed === false &&
      receipt.securityBoundary?.canonicalReportWriteCapability === false,
    "successor receipt semantics drifted or promoted",
  );
  const expectedTransactionId = sha256(
    stableJson({
      transitionId: receipt.transitionId,
      generator: receipt.generatedBy,
      preimages: receipt.preimages,
      postimages: receipt.postimages,
      protectedBindings: receipt.protectedBindings,
    }),
  );
  invariant(
    receipt.transactionId === expectedTransactionId,
    "successor transaction identity drifted",
  );
  invariant(
    withFingerprint(
      {...receipt, receiptFingerprintSha256: ""},
      "receiptFingerprintSha256",
    ).receiptFingerprintSha256 === receipt.receiptFingerprintSha256,
    "successor receipt fingerprint drifted",
  );
  for (const item of [
    ...(receipt.preimages || []),
    ...(receipt.postimages || []),
    ...(receipt.protectedBindings || []),
  ]) {
    invariant(
      typeof item.path === "string" &&
        Number.isSafeInteger(item.bytes) &&
        item.bytes > 0 &&
        SHA256_PATTERN.test(item.sha256) &&
        Number.isSafeInteger(item.mode) &&
        item.identity &&
        Number.isSafeInteger(item.identity.device) &&
        Number.isSafeInteger(item.identity.inode) &&
        item.identity.linkCount === 1 &&
        item.identity.size === item.bytes &&
        item.identity.mode === item.mode &&
        Number.isFinite(item.identity.modifiedMs) &&
        Number.isFinite(item.identity.changedMs),
      `${item.path || "unknown"}: successor evidence identity drifted`,
    );
  }
  const expectedPreimages = transition.files.map(({path: itemPath, preimage}) => ({
    path: itemPath,
    bytes: preimage.bytes,
    mode: preimage.mode,
    sha256: preimage.sha256,
  }));
  const expectedPostimages = transition.files.map(({path: itemPath, postimage}) => ({
    path: itemPath,
    bytes: postimage.bytes,
    mode: postimage.mode,
    sha256: postimage.sha256,
  }));
  invariant(
    sameJson(
      receipt.preimages.map(({path: itemPath, bytes, mode, sha256: digest}) => ({
        path: itemPath,
        bytes,
        mode,
        sha256: digest,
      })),
      expectedPreimages,
    ) &&
      sameJson(
        receipt.postimages.map(({path: itemPath, bytes, mode, sha256: digest}) => ({
          path: itemPath,
          bytes,
          mode,
          sha256: digest,
        })),
        expectedPostimages,
      ),
    "successor receipt transition bindings drifted",
  );
  invariant(
    successorPackage.postimagePayloads?.length === transition.files.length,
    "successor postimage payload count drifted",
  );
  for (let index = 0; index < transition.files.length; index += 1) {
    const expected = transition.files[index];
    const payload = successorPackage.postimagePayloads[index];
    invariant(
      payload.path === expected.path &&
        payload.encoding === "base64" &&
        payload.bytes === expected.postimage.bytes &&
        payload.mode === expected.postimage.mode &&
        payload.sha256 === expected.postimage.sha256,
      `${expected.path}: embedded postimage binding drifted`,
    );
    const decoded = Buffer.from(payload.contentBase64, "base64");
    invariant(
      decoded.toString("base64") === payload.contentBase64 &&
        decoded.length === payload.bytes &&
        sha256(decoded) === payload.sha256,
      `${expected.path}: embedded postimage payload drifted`,
    );
  }
  validateJournal(successorPackage.journal, receipt);
  return successorPackage;
}

async function collectState({root, postimageRoot, transition}) {
  validateTransition(transition);
  invariant(postimageRoot, "--postimage-root is required");
  const [generatorBytes, preimages, postimages, protectedFiles] =
    await Promise.all([
      readFile(SCRIPT_PATH),
      Promise.all(
        transition.files.map(async (item) => {
          const file = await secureRead(root, item.path, {
            expected: item.preimage,
            rootLabel: "project root",
          });
          return {...file, path: item.path};
        }),
      ),
      Promise.all(
        transition.files.map(async (item) => {
          const file = await secureRead(postimageRoot, item.path, {
            expected: item.postimage,
            rootLabel: "postimage root",
          });
          return {...file, path: item.path};
        }),
      ),
      Promise.all(
        transition.protectedPaths.map(async (itemPath) => {
          const expected =
            itemPath === transition.predecessor.path
              ? transition.predecessor
              : undefined;
          const file = await secureRead(root, itemPath, {
            expected,
            rootLabel: "project root",
          });
          return {...file, path: itemPath};
        }),
      ),
    ]);
  const semanticState = validateProtectedDocuments(protectedFiles, transition);
  validatePostimageRelations(
    preimages,
    postimages,
    protectedFiles,
    transition,
  );
  const generator = {
    path: "scripts/build-g4-l3-renderer-drift-successor-package.mjs",
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  };
  const receipt = buildReceipt({
    transition,
    generator,
    preimages,
    postimages,
    protectedFiles,
    semanticState,
  });
  const successorPackage = buildPackage({transition, receipt, postimages});
  validatePackage(successorPackage, transition);
  const packageBytes = Buffer.from(stableJson(successorPackage));
  return {
    transition,
    generator,
    preimages,
    postimages,
    protectedFiles,
    semanticState,
    receipt,
    successorPackage,
    packageBytes,
  };
}

async function assertOutputAbsent(root, transition) {
  const rootReal = await resolvedRoot(root, "project root");
  const absolutePath = path.join(
    rootReal,
    ...transition.outputRelative.split("/"),
  );
  invariant(
    !(await pathExists(absolutePath)),
    "no-replace successor output already exists",
  );
  return absolutePath;
}

function stateIdentity(state) {
  return {
    transactionId: state.receipt.transactionId,
    packageBytes: state.packageBytes.length,
    packageSha256: sha256(state.packageBytes),
    packageFingerprintSha256:
      state.successorPackage.packageFingerprintSha256,
  };
}

async function assertStateUnchanged(initial, options) {
  const current = await collectState(options);
  invariant(
    sameJson(stateIdentity(current), stateIdentity(initial)),
    "successor inputs changed after the transaction plan was sealed",
  );
  return current;
}

function journalBytes(journal) {
  return Buffer.from(
    journal.map((record) => JSON.stringify(record)).join("\n") + "\n",
  );
}

export async function dryRunRendererDriftSuccessor({
  root = PROJECT_ROOT,
  postimageRoot,
  transition = PRODUCTION_TRANSITION,
} = {}) {
  const state = await collectState({root, postimageRoot, transition});
  await assertOutputAbsent(root, transition);
  return {
    mode: "dry-run",
    status: "verified-no-write",
    output: transition.outputRelative,
    ...stateIdentity(state),
    changedFileCount: transition.files.length,
    strictComplete: 0,
    published: false,
  };
}

export async function applyRendererDriftSuccessor({
  root = PROJECT_ROOT,
  postimageRoot,
  transition = PRODUCTION_TRANSITION,
  hooks = {},
} = {}) {
  const options = {root, postimageRoot, transition};
  const state = await collectState(options);
  const outputPath = await assertOutputAbsent(root, transition);
  const transactionRoot = await ensureSafeDirectory(
    root,
    transition.transactionRootRelative,
  );
  const transactionDirectory = path.join(
    transactionRoot,
    state.receipt.transactionId,
  );
  await mkdir(transactionDirectory, {mode: 0o755});
  const preparedDirectory = path.join(transactionDirectory, "prepared");
  await mkdir(preparedDirectory, {mode: 0o755});
  const preparedPackagePath = path.join(
    preparedDirectory,
    "successor-package.json",
  );
  const preparedPackageRelative = portable(
    path.relative(
      await resolvedRoot(root, "project root"),
      preparedPackagePath,
    ),
  );
  const planPath = path.join(transactionDirectory, "plan.json");
  const journalPath = path.join(transactionDirectory, "journal.jsonl");
  const plan = withFingerprint(
    {
      schemaVersion: 1,
      planType: "g4-l3-renderer-live-drift-successor-plan",
      transitionId: transition.transitionId,
      transactionId: state.receipt.transactionId,
      output: {
        path: transition.outputRelative,
        mode: 0o444,
        publicationMode: "trusted-local-leaf-hard-link-no-replace",
      },
      preparedPackage: {
        path: preparedPackageRelative,
        bytes: state.packageBytes.length,
        sha256: sha256(state.packageBytes),
      },
      preimages: state.receipt.preimages,
      postimages: state.receipt.postimages,
      protectedBindings: state.receipt.protectedBindings,
      planFingerprintSha256: "",
    },
    "planFingerprintSha256",
  );
  await writeExclusiveImmutable(planPath, Buffer.from(stableJson(plan)));
  await writeExclusiveImmutable(preparedPackagePath, state.packageBytes);
  await writeExclusiveImmutable(
    journalPath,
    journalBytes(state.successorPackage.journal),
  );
  await assertStateUnchanged(state, options);
  if (hooks.beforePublish) {
    await hooks.beforePublish({
      outputPath,
      transactionDirectory,
      preparedPackagePath,
    });
  }
  await assertStateUnchanged(state, options);
  await assertOutputAbsent(root, transition);
  await link(preparedPackagePath, outputPath);
  const [publishedFile, preparedFile] = await Promise.all([
    secureRead(root, transition.outputRelative, {
      expectedMode: 0o444,
      allowHardlink: true,
    }),
    secureRead(root, preparedPackageRelative, {
      expectedMode: 0o444,
      allowHardlink: true,
    }),
  ]);
  assertPublishedPreparedIdentity(publishedFile, preparedFile);
  return {
    mode: "apply",
    status: "published-no-replace-candidate-package-only",
    output: transition.outputRelative,
    transactionDirectory: portable(
      path.relative(await resolvedRoot(root, "project root"), transactionDirectory),
    ),
    ...stateIdentity(state),
    changedFileCount: transition.files.length,
    canonicalReportsReplaced: false,
    strictComplete: 0,
    published: false,
  };
}

function assertPublishedPreparedIdentity(publishedFile, preparedFile) {
  invariant(
    publishedFile.identity.device === preparedFile.identity.device &&
      publishedFile.identity.inode === preparedFile.identity.inode &&
      publishedFile.identity.linkCount === 2 &&
      preparedFile.identity.linkCount === 2 &&
      publishedFile.binding.mode === 0o444 &&
      preparedFile.binding.mode === 0o444 &&
      publishedFile.binding.bytes === preparedFile.binding.bytes &&
      publishedFile.binding.sha256 === preparedFile.binding.sha256,
    "published output does not share the exact prepared package inode and two-link identity",
  );
}

async function validateTransactionFiles(
  root,
  successorPackage,
  transition,
  publishedFile,
) {
  const rootReal = await resolvedRoot(root, "project root");
  const transactionRelative = `${transition.transactionRootRelative}/${successorPackage.transactionId}`;
  const planFile = await secureRead(rootReal, `${transactionRelative}/plan.json`, {
    expectedMode: 0o444,
    allowHardlink: false,
  });
  const preparedFile = await secureRead(
    rootReal,
    `${transactionRelative}/prepared/successor-package.json`,
    {
      expectedMode: 0o444,
      allowHardlink: true,
    },
  );
  const journalFile = await secureRead(
    rootReal,
    `${transactionRelative}/journal.jsonl`,
    {
      expectedMode: 0o444,
      allowHardlink: false,
    },
  );
  invariant(
    preparedFile.bytes.length === stableJson(successorPackage).length &&
      preparedFile.binding.sha256 === sha256(stableJson(successorPackage)),
    "prepared successor package drifted",
  );
  assertPublishedPreparedIdentity(publishedFile, preparedFile);
  invariant(
    journalFile.bytes.equals(journalBytes(successorPackage.journal)),
    "transaction journal differs from sealed package journal",
  );
  const plan = parseJson(planFile.bytes, "successor transaction plan");
  invariant(
    plan.schemaVersion === 1 &&
      plan.planType === "g4-l3-renderer-live-drift-successor-plan" &&
      plan.transitionId === transition.transitionId &&
      plan.transactionId === successorPackage.transactionId &&
      plan.output?.path === transition.outputRelative &&
      plan.output?.mode === 0o444 &&
      plan.preparedPackage?.bytes === preparedFile.bytes.length &&
      plan.preparedPackage?.sha256 === preparedFile.binding.sha256,
    "successor transaction plan drifted",
  );
  invariant(
    withFingerprint(
      {...plan, planFingerprintSha256: ""},
      "planFingerprintSha256",
    ).planFingerprintSha256 === plan.planFingerprintSha256,
    "successor transaction plan fingerprint drifted",
  );
  return {
    plan: planFile.binding,
    preparedPackage: preparedFile.binding,
    journal: journalFile.binding,
  };
}

export async function checkRendererDriftSuccessor({
  root = PROJECT_ROOT,
  transition = PRODUCTION_TRANSITION,
} = {}) {
  validateTransition(transition);
  const output = await secureRead(root, transition.outputRelative, {
    expectedMode: 0o444,
    allowHardlink: true,
  });
  const successorPackage = validatePackage(
    parseJson(output.bytes, "renderer successor package"),
    transition,
  );
  const [preimages, protectedFiles, generatorBytes] = await Promise.all([
    Promise.all(
      transition.files.map((item) =>
        secureRead(root, item.path, {expected: item.preimage}),
      ),
    ),
    Promise.all(
      transition.protectedPaths.map((itemPath) =>
        secureRead(root, itemPath, {
          expected:
            itemPath === transition.predecessor.path
              ? transition.predecessor
              : successorPackage.receipt.protectedBindings.find(
                ({path: protectedPath}) => protectedPath === itemPath,
              ),
        }),
      ),
    ),
    readFile(SCRIPT_PATH),
  ]);
  invariant(
    sameJson(
      preimages.map(evidenceRecord),
      successorPackage.receipt.preimages,
    ),
    "canonical preimage identity no longer matches the package",
  );
  invariant(
    sameJson(
      protectedFiles.map(evidenceRecord),
      successorPackage.receipt.protectedBindings,
    ),
    "protected bindings no longer match the package",
  );
  validateProtectedDocuments(
    protectedFiles.map((file, index) => ({
      ...file,
      path: transition.protectedPaths[index],
    })),
    transition,
  );
  invariant(
    successorPackage.receipt.generatedBy.bytes === generatorBytes.length &&
      successorPackage.receipt.generatedBy.sha256 === sha256(generatorBytes),
    "successor writer binding drifted",
  );
  const transaction = await validateTransactionFiles(
    root,
    successorPackage,
    transition,
    output,
  );
  return {
    mode: "check",
    status: "verified-no-replace-package",
    output: output.binding,
    transaction,
    transactionId: successorPackage.transactionId,
    packageFingerprintSha256:
      successorPackage.packageFingerprintSha256,
    canonicalReportsReplaced: false,
    strictComplete: 0,
    published: false,
  };
}

export function parseArguments(argv) {
  const options = {
    mode: "dry-run",
    root: PROJECT_ROOT,
    postimageRoot: null,
    help: false,
  };
  let selectedMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(!selectedMode, "operation modes are mutually exclusive");
      selectedMode = true;
      options.mode = argument.slice(2);
    } else if (argument === "--root") {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), "--root requires a value");
      options.root = path.resolve(value);
    } else if (argument === "--postimage-root") {
      const value = argv[++index];
      invariant(
        value && !value.startsWith("--"),
        "--postimage-root requires a value",
      );
      options.postimageRoot = path.resolve(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help && options.mode !== "check") {
    invariant(options.postimageRoot, "--postimage-root is required");
  }
  if (!options.help && options.mode === "check") {
    invariant(
      options.postimageRoot === null,
      "--check does not accept --postimage-root",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g4-l3-renderer-drift-successor-package.mjs \\
    [--dry-run|--apply|--check] [--root PATH] [--postimage-root PATH]

Default mode is --dry-run. --dry-run and --apply require the exact verified
postimage root. --apply writes only a new immutable successor package and its
work/ transaction plan/journal. It never replaces canonical reports or writes
completion/release ledgers, runtime evidence, or publication state.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    const common = {
      root: options.root,
      postimageRoot: options.postimageRoot,
    };
    const result =
      options.mode === "apply"
        ? await applyRendererDriftSuccessor(common)
        : options.mode === "check"
          ? await checkRendererDriftSuccessor({root: options.root})
          : await dryRunRendererDriftSuccessor(common);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)
) {
  await main();
}
