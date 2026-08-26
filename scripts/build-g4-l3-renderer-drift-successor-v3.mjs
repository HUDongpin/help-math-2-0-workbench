#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const TRANSITION_ID = "g4-l3-renderer-live-drift-2026-07-29-v3";
const OUTPUT_PATH =
  "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v3.json";
const TRANSACTION_ROOT =
  "work/g4-l3-renderer-live-drift-successor-v3-transactions";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

const CURRENT_INPUTS = Object.freeze([
  Object.freeze({
    id: "rendererIndex",
    path: "reports/g4-l3-renderer-frame-domain-support-index.json",
    mode: 0o644,
  }),
  Object.freeze({
    id: "rendererGap",
    path: "reports/g4-l3-renderer-gap-closure.json",
    mode: 0o644,
  }),
  Object.freeze({
    id: "completionLedger",
    path: "catalog/completion-ledger.json",
    mode: 0o644,
  }),
  Object.freeze({
    id: "lessonReleaseLedger",
    path: "catalog/lesson-release-ledger.json",
    mode: 0o644,
  }),
  Object.freeze({
    id: "preimageSnapshot",
    path: "reports/g4-l3-p0-preimage-snapshot-2026-07-29.json",
    mode: 0o444,
  }),
]);

const LEGACY_ARTIFACTS = Object.freeze([
  Object.freeze({
    generation: "v1",
    transactionId:
      "ea7472bdd963a44c9880a2531200985f665c54bf496247621fbc2d39bfa5ba05",
    bytes: 330166,
    sha256:
      "cf783074b6505c9deb9edd54d4c0485c36192aa5c0236340c45ffd158ef99fac",
    reportPath:
      "reports/g4-l3-renderer-live-drift-successor-2026-07-29.json",
    preparedPath:
      "work/g4-l3-renderer-live-drift-successor-transactions/ea7472bdd963a44c9880a2531200985f665c54bf496247621fbc2d39bfa5ba05/prepared/successor-package.json",
  }),
  Object.freeze({
    generation: "v2",
    transactionId:
      "d4a74c91e19052f27e2be7e00b23570588f158080f85931760c9f53ba2be37ae",
    bytes: 330447,
    sha256:
      "eaf536d92e61a225376775c644554df3c8a59ecfd39df018684d736ef82ec3b7",
    reportPath:
      "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v2.json",
    preparedPath:
      "work/g4-l3-renderer-live-drift-successor-transactions/d4a74c91e19052f27e2be7e00b23570588f158080f85931760c9f53ba2be37ae/prepared/successor-package.json",
  }),
]);

const AUTHORITY = Object.freeze({
  originalRuntimeAccepted: false,
  authoritativeRuntimeTraceCreated: false,
  visualParityAccepted: false,
  rmseAccepted: false,
  audioAccepted: false,
  independentHumanReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicReleaseAuthorized: false,
  published: false,
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

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`))
  );
}

function projectPath(root, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.posix.isAbsolute(relativePath) &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0") &&
      relativePath.split("/").every((segment) =>
        segment.length > 0 && segment !== "." && segment !== ".."
      ),
    `unsafe project-relative path: ${relativePath}`,
  );
  const absolutePath = path.join(root, ...relativePath.split("/"));
  invariant(
    absolutePath !== root && isInside(root, absolutePath),
    `path escapes project root: ${relativePath}`,
  );
  return absolutePath;
}

async function canonicalRoot(candidate) {
  const root = path.resolve(candidate);
  const metadata = await lstat(root);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    "project root must be a real directory",
  );
  invariant(
    (await realpath(root)) === root,
    "project root must be canonical",
  );
  return root;
}

function contentBinding(file) {
  return {
    path: file.path,
    bytes: file.bytes.length,
    sha256: sha256(file.bytes),
    mode: file.mode,
  };
}

function parseJson(file, label) {
  try {
    return JSON.parse(file.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

async function secureRead(root, relativePath, {
  mode,
  nlink = 1,
  bytes,
  digest,
} = {}) {
  const absolutePath = projectPath(root, relativePath);
  const parent = path.dirname(absolutePath);
  invariant(
    isInside(root, await realpath(parent)),
    `${relativePath}: parent escapes project root`,
  );
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | NOFOLLOW,
  );
  let before;
  let contents;
  let after;
  try {
    before = await handle.stat();
    invariant(
      before.isFile() && before.nlink === nlink,
      `${relativePath}: expected a regular ${nlink}-link file`,
    );
    if (mode !== undefined) {
      invariant(
        (before.mode & 0o777) === mode,
        `${relativePath}: mode drifted`,
      );
    }
    contents = await handle.readFile();
    after = await handle.stat();
  } finally {
    await handle.close();
  }
  const atPath = await lstat(absolutePath);
  invariant(
    atPath.isFile() &&
      !atPath.isSymbolicLink() &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.dev === atPath.dev &&
      before.ino === atPath.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
    `${relativePath}: identity changed while reading`,
  );
  const observedDigest = sha256(contents);
  if (bytes !== undefined) {
    invariant(contents.length === bytes, `${relativePath}: byte size drifted`);
  }
  if (digest !== undefined) {
    invariant(observedDigest === digest, `${relativePath}: SHA-256 drifted`);
  }
  return {
    path: relativePath,
    absolutePath,
    bytes: contents,
    mode: before.mode & 0o777,
    identity: {
      device: before.dev,
      inode: before.ino,
      linkCount: before.nlink,
    },
  };
}

function noneEffect(value) {
  return value === "none" ||
    (typeof value === "string" && value.startsWith("none;"));
}

function validateRendererIndex(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceType ===
        "course-shell-pilot-renderer-frame-domain-support-index" &&
      document.scope === "explicit-animation-id-selection" &&
      document.status === "renderer-frame-domain-support-incomplete" &&
      document.pilotCount === 40 &&
      document.reports?.length === 40 &&
      new Set(document.reports.map(({animationId}) => animationId)).size ===
        40 &&
      document.totalRenderableCount + document.totalBlockedCount ===
        document.totalProbeCount &&
      noneEffect(document.strictAcceptanceEffect),
    "renderer index semantics or strict-acceptance effect drifted",
  );
}

function validateRendererGap(document, indexBinding) {
  const acceptanceValues = Object.values(document?.acceptance || {});
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "g4-l3-renderer-gap-closure" &&
      document.scope?.releaseId === RELEASE_ID &&
      document.scope?.releaseMembers === 40 &&
      document.bindings?.rendererSupportIndex?.path === indexBinding.path &&
      document.bindings?.rendererSupportIndex?.bytes === indexBinding.bytes &&
      document.bindings?.rendererSupportIndex?.sha256 === indexBinding.sha256 &&
      acceptanceValues.length > 0 &&
      acceptanceValues.every((value) => value === false) &&
      document.decision?.runtimeLaunchAuthorized === false &&
      document.decision?.safeRendererOnlyImplementationAvailable === false &&
      document.summary?.safeRendererOnlyImplementationDomainsNow === 0 &&
      noneEffect(document.strictAcceptanceEffect),
    "renderer gap semantics, acceptance flags, or index binding drifted",
  );
}

function validateCompletionLedger(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.summary?.declaredComplete === 0 &&
      document.summary?.strictComplete === 0 &&
      Array.isArray(document.entries) &&
      document.entries.length === 0,
    "completion ledger is not strict-zero",
  );
}

function validateReleaseLedger(document) {
  const release = document?.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    document?.schemaVersion === 1 &&
      document.summary?.publishedReleaseCount === 0 &&
      document.summary?.strictCompleteMemberCount === 0 &&
      release?.expectedMemberCount === 40 &&
      release.strictCompleteCount === 0 &&
      release.missingCount === 40 &&
      release.published === false &&
      release.status === "unpublished" &&
      release.gate?.open === false,
    "G4 L3 release is not 0/40 strict and unpublished",
  );
  return release;
}

function validatePreimageSnapshot(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "g4-l3-p0-preimage-snapshot" &&
      document.mutationEffect === "none-on-snapshotted-targets" &&
      Number.isSafeInteger(document.targetCount) &&
      document.targetCount > 0 &&
      document.targets?.length === document.targetCount,
    "P0 preimage snapshot semantics drifted",
  );
}

async function validateLegacyArtifacts(root) {
  const records = [];
  for (const legacy of LEGACY_ARTIFACTS) {
    const [report, prepared] = await Promise.all([
      secureRead(root, legacy.reportPath, {
        mode: 0o444,
        nlink: 2,
        bytes: legacy.bytes,
        digest: legacy.sha256,
      }),
      secureRead(root, legacy.preparedPath, {
        mode: 0o444,
        nlink: 2,
        bytes: legacy.bytes,
        digest: legacy.sha256,
      }),
    ]);
    invariant(
      report.identity.device === prepared.identity.device &&
        report.identity.inode === prepared.identity.inode &&
        report.bytes.equals(prepared.bytes),
      `${legacy.generation}: legacy report/prepared hard-link identity drifted`,
    );
    records.push({
      generation: legacy.generation,
      status: "historical-stale",
      transactionId: legacy.transactionId,
      report: contentBinding(report),
      prepared: contentBinding(prepared),
      verifiedLegacyRelationship: {
        regularFiles: true,
        mode0444: true,
        linkCount2: true,
        sameDeviceAndInode: true,
        exactBytesAndSha256: true,
      },
    });
  }
  return records;
}

async function collectState(rootCandidate = PROJECT_ROOT) {
  const root = await canonicalRoot(rootCandidate);
  const inputFiles = await Promise.all(
    CURRENT_INPUTS.map(({path: inputPath, mode}) =>
      secureRead(root, inputPath, {mode, nlink: 1})
    ),
  );
  const generatorFile = await secureRead(
    root,
    portable(path.relative(root, SCRIPT_PATH)),
    {mode: 0o644, nlink: 1},
  );
  const byId = Object.fromEntries(
    CURRENT_INPUTS.map((input, index) => [input.id, inputFiles[index]]),
  );
  const inputBindings = Object.fromEntries(
    CURRENT_INPUTS.map((input) => [input.id, contentBinding(byId[input.id])]),
  );
  const indexDocument = parseJson(byId.rendererIndex, "renderer index");
  const gapDocument = parseJson(byId.rendererGap, "renderer gap report");
  const completionDocument = parseJson(
    byId.completionLedger,
    "completion ledger",
  );
  const releaseDocument = parseJson(
    byId.lessonReleaseLedger,
    "lesson release ledger",
  );
  const snapshotDocument = parseJson(
    byId.preimageSnapshot,
    "P0 preimage snapshot",
  );
  validateRendererIndex(indexDocument);
  validateRendererGap(gapDocument, inputBindings.rendererIndex);
  validateCompletionLedger(completionDocument);
  const release = validateReleaseLedger(releaseDocument);
  validatePreimageSnapshot(snapshotDocument);
  const legacyArtifacts = await validateLegacyArtifacts(root);
  const generator = contentBinding(generatorFile);
  const rendererGapAcceptance = structuredClone(gapDocument.acceptance);
  invariant(
    Object.values(AUTHORITY).every((value) => value === false) &&
      Object.values(rendererGapAcceptance).every((value) => value === false),
    "authority and renderer-gap acceptance must remain all false",
  );
  const semanticState = {
    renderer: {
      indexStatus: indexDocument.status,
      gapAcceptance: rendererGapAcceptance,
      strictAcceptanceEffect: "none",
    },
    completionLedger: {
      declaredComplete: 0,
      strictComplete: 0,
    },
    g4L3Release: {
      expectedMemberCount: release.expectedMemberCount,
      strictCompleteCount: release.strictCompleteCount,
      missingCount: release.missingCount,
      published: release.published,
      status: release.status,
      gateOpen: release.gate.open,
    },
  };
  return {
    root,
    inputBindings,
    generator,
    legacyArtifacts,
    semanticState,
  };
}

function transactionMaterial(state) {
  return {
    schemaVersion: 1,
    transitionId: TRANSITION_ID,
    outputPath: OUTPUT_PATH,
    inputBindings: state.inputBindings,
    generator: state.generator,
    legacyArtifacts: state.legacyArtifacts,
    semanticState: state.semanticState,
    authority: AUTHORITY,
    effects: {
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    },
  };
}

function buildPackage(state) {
  const transactionId = sha256(
    Buffer.from(canonicalJson(transactionMaterial(state))),
  );
  invariant(SHA256_PATTERN.test(transactionId), "transaction ID is invalid");
  const preparedPath =
    `${TRANSACTION_ROOT}/${transactionId}/prepared/successor-package.json`;
  const successorPackage = {
    schemaVersion: 1,
    packageType: "g4-l3-renderer-live-drift-successor-v3",
    status: "current-bound-successor-with-historical-stale-legacy",
    transitionId: TRANSITION_ID,
    transactionId,
    output: {
      reportPath: OUTPUT_PATH,
      preparedPath,
      publicationMode: "independent-no-replace-immutable-files",
      exactSameBytesRequired: true,
      separateInodesRequired: true,
      linkCountRequired: 1,
      mode: 0o444,
    },
    inputBindings: state.inputBindings,
    generator: state.generator,
    legacyArtifacts: state.legacyArtifacts,
    semanticState: state.semanticState,
    authority: AUTHORITY,
    effects: {
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    },
    preservation: {
      legacyArtifactsModified: false,
      rendererReportsModified: false,
      completionLedgerModified: false,
      lessonReleaseLedgerModified: false,
      originalRuntimeCaptureStarted: false,
      publicDeploymentStarted: false,
    },
    limitations: [
      "This package binds current JavaScript renderer evidence only.",
      "Legacy v1/v2 hard-linked artifacts are verified and retained as historical-stale; they are not modified.",
      "No original-runtime, audio, visual-parity, human, owner, strict-completion, or publication gate is advanced.",
    ],
    packageFingerprintSha256: "",
  };
  successorPackage.packageFingerprintSha256 = sha256(
    Buffer.from(stableJson(successorPackage)),
  );
  validatePackage(successorPackage, state);
  return {
    successorPackage,
    bytes: Buffer.from(stableJson(successorPackage)),
  };
}

function validatePackage(successorPackage, state) {
  invariant(
    successorPackage?.schemaVersion === 1 &&
      successorPackage.packageType ===
        "g4-l3-renderer-live-drift-successor-v3" &&
      successorPackage.status ===
        "current-bound-successor-with-historical-stale-legacy" &&
      successorPackage.transitionId === TRANSITION_ID &&
      successorPackage.output?.reportPath === OUTPUT_PATH &&
      successorPackage.output?.publicationMode ===
        "independent-no-replace-immutable-files" &&
      successorPackage.output?.exactSameBytesRequired === true &&
      successorPackage.output?.separateInodesRequired === true &&
      successorPackage.output?.linkCountRequired === 1 &&
      successorPackage.output?.mode === 0o444,
    "v3 package identity or independent-file contract drifted",
  );
  const expectedTransactionId = sha256(
    Buffer.from(canonicalJson(transactionMaterial(state))),
  );
  invariant(
    successorPackage.transactionId === expectedTransactionId &&
      successorPackage.output.preparedPath ===
        `${TRANSACTION_ROOT}/${expectedTransactionId}/prepared/successor-package.json`,
    "v3 transaction identity is not hash-bound to current inputs",
  );
  invariant(
    JSON.stringify(successorPackage.inputBindings) ===
        JSON.stringify(state.inputBindings) &&
      JSON.stringify(successorPackage.generator) ===
        JSON.stringify(state.generator) &&
      JSON.stringify(successorPackage.legacyArtifacts) ===
        JSON.stringify(state.legacyArtifacts) &&
      JSON.stringify(successorPackage.semanticState) ===
        JSON.stringify(state.semanticState),
    "v3 package bindings drifted from current state",
  );
  invariant(
    Object.values(successorPackage.authority || {}).length ===
        Object.keys(AUTHORITY).length &&
      Object.values(successorPackage.authority).every(
        (value) => value === false,
      ) &&
      Object.values(
        successorPackage.semanticState?.renderer?.gapAcceptance || {},
      ).every((value) => value === false) &&
      successorPackage.semanticState?.renderer?.strictAcceptanceEffect ===
        "none" &&
      successorPackage.semanticState?.g4L3Release?.expectedMemberCount === 40 &&
      successorPackage.semanticState?.g4L3Release?.strictCompleteCount === 0 &&
      successorPackage.semanticState?.g4L3Release?.published === false &&
      successorPackage.semanticState?.g4L3Release?.status === "unpublished" &&
      successorPackage.effects?.strictAcceptanceEffect === "none" &&
      successorPackage.effects?.releaseEffect === "none" &&
      Object.values(successorPackage.preservation || {}).every(
        (value) => value === false,
      ),
    "v3 package authority, acceptance, or release boundary was promoted",
  );
  invariant(
    successorPackage.legacyArtifacts?.length === 2 &&
      successorPackage.legacyArtifacts.every(
        ({status}) => status === "historical-stale",
      ),
    "legacy artifacts must only be recorded as historical-stale",
  );
  const fingerprintSource = structuredClone(successorPackage);
  fingerprintSource.packageFingerprintSha256 = "";
  invariant(
    successorPackage.packageFingerprintSha256 ===
      sha256(Buffer.from(stableJson(fingerprintSource))),
    "v3 package fingerprint is not hash-bound",
  );
}

async function pathExists(root, relativePath) {
  try {
    await lstat(projectPath(root, relativePath));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function fsyncDirectory(directory) {
  const handle = await open(
    directory,
    fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW,
  );
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function ensureDirectory(root, relativePath, createdDirectories) {
  let cursor = root;
  for (const segment of relativePath.split("/")) {
    cursor = path.join(cursor, segment);
    const cursorRelative = portable(path.relative(root, cursor));
    let metadata;
    try {
      metadata = await lstat(cursor);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await mkdir(cursor, {mode: 0o755});
      metadata = await lstat(cursor);
      createdDirectories.push({
        path: cursorRelative,
        device: metadata.dev,
        inode: metadata.ino,
      });
      await fsyncDirectory(path.dirname(cursor));
    }
    invariant(
      metadata.isDirectory() &&
        !metadata.isSymbolicLink() &&
        isInside(root, await realpath(cursor)),
      `${cursorRelative}: unsafe transaction directory`,
    );
  }
}

async function writeImmutableNoReplace(
  root,
  relativePath,
  bytes,
  createdFiles,
) {
  const absolutePath = projectPath(root, relativePath);
  invariant(
    isInside(root, await realpath(path.dirname(absolutePath))),
    `${relativePath}: output parent escapes project root`,
  );
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  const opened = await handle.stat();
  createdFiles.push({
    path: relativePath,
    device: opened.dev,
    inode: opened.ino,
  });
  try {
    invariant(
      opened.isFile() && opened.nlink === 1,
      `${relativePath}: new output inode is unsafe`,
    );
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fsyncDirectory(path.dirname(absolutePath));
  return secureRead(root, relativePath, {
    mode: 0o444,
    nlink: 1,
    bytes: bytes.length,
    digest: sha256(bytes),
  });
}

async function verifyIndependentPair(root, preparedPath, expectedBytes) {
  const expectedDigest = sha256(expectedBytes);
  const [report, prepared] = await Promise.all([
    secureRead(root, OUTPUT_PATH, {
      mode: 0o444,
      nlink: 1,
      bytes: expectedBytes.length,
      digest: expectedDigest,
    }),
    secureRead(root, preparedPath, {
      mode: 0o444,
      nlink: 1,
      bytes: expectedBytes.length,
      digest: expectedDigest,
    }),
  ]);
  invariant(
    report.bytes.equals(prepared.bytes) &&
      !(
        report.identity.device === prepared.identity.device &&
        report.identity.inode === prepared.identity.inode
      ),
    "v3 report and prepared package must have exact bytes but different inodes",
  );
  return {
    report: contentBinding(report),
    prepared: contentBinding(prepared),
    exactSameBytes: true,
    separateInodes: true,
    linkCount: 1,
  };
}

function stateBytes(state) {
  return buildPackage(state).bytes;
}

async function rollbackOwnCreations(root, createdFiles, createdDirectories) {
  for (const created of [...createdFiles].reverse()) {
    const absolutePath = projectPath(root, created.path);
    try {
      const metadata = await lstat(absolutePath);
      if (
        metadata.isFile() &&
        !metadata.isSymbolicLink() &&
        metadata.dev === created.device &&
        metadata.ino === created.inode
      ) {
        await unlink(absolutePath);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        // Preserve the original transaction error and never remove a foreign inode.
      }
    }
  }
  for (const created of [...createdDirectories].reverse()) {
    const absolutePath = projectPath(root, created.path);
    try {
      const metadata = await lstat(absolutePath);
      if (
        metadata.isDirectory() &&
        !metadata.isSymbolicLink() &&
        metadata.dev === created.device &&
        metadata.ino === created.inode
      ) {
        await rmdir(absolutePath);
      }
    } catch (error) {
      if (!["ENOENT", "ENOTEMPTY"].includes(error?.code)) {
        // Preserve the original transaction error and never recurse.
      }
    }
  }
}

export async function applyRendererDriftSuccessorV3({
  root: rootCandidate = PROJECT_ROOT,
} = {}) {
  const initialState = await collectState(rootCandidate);
  const root = initialState.root;
  const {successorPackage, bytes} = buildPackage(initialState);
  const preparedPath = successorPackage.output.preparedPath;
  const transactionDirectory = path.posix.dirname(
    path.posix.dirname(preparedPath),
  );
  invariant(
    !(await pathExists(root, OUTPUT_PATH)),
    `${OUTPUT_PATH}: no-replace output already exists`,
  );
  invariant(
    !(await pathExists(root, transactionDirectory)),
    `${transactionDirectory}: no-replace transaction already exists`,
  );
  const createdFiles = [];
  const createdDirectories = [];
  try {
    await ensureDirectory(
      root,
      path.posix.dirname(preparedPath),
      createdDirectories,
    );
    await writeImmutableNoReplace(root, preparedPath, bytes, createdFiles);
    const prepublishState = await collectState(root);
    invariant(
      stateBytes(prepublishState).equals(bytes),
      "current bindings changed after v3 transaction planning",
    );
    await writeImmutableNoReplace(root, OUTPUT_PATH, bytes, createdFiles);
    const postpublishState = await collectState(root);
    invariant(
      stateBytes(postpublishState).equals(bytes),
      "current bindings changed during v3 no-replace publication",
    );
    const pair = await verifyIndependentPair(root, preparedPath, bytes);
    return {
      mode: "apply",
      status: "published-independent-no-replace-current-bound-successor",
      transactionId: successorPackage.transactionId,
      packageFingerprintSha256:
        successorPackage.packageFingerprintSha256,
      pair,
      strictComplete: 0,
      expectedMemberCount: 40,
      published: false,
      legacyDisposition: "historical-stale-retained-unmodified",
    };
  } catch (error) {
    await rollbackOwnCreations(root, createdFiles, createdDirectories);
    throw error;
  }
}

export async function checkRendererDriftSuccessorV3({
  root: rootCandidate = PROJECT_ROOT,
} = {}) {
  const state = await collectState(rootCandidate);
  const root = state.root;
  const {successorPackage, bytes} = buildPackage(state);
  const pair = await verifyIndependentPair(
    root,
    successorPackage.output.preparedPath,
    bytes,
  );
  const parsedReport = parseJson(
    await secureRead(root, OUTPUT_PATH, {
      mode: 0o444,
      nlink: 1,
      bytes: bytes.length,
      digest: sha256(bytes),
    }),
    "v3 successor report",
  );
  validatePackage(parsedReport, state);
  return {
    mode: "check",
    status: "verified-independent-no-replace-current-bound-successor",
    transactionId: successorPackage.transactionId,
    packageFingerprintSha256:
      successorPackage.packageFingerprintSha256,
    pair,
    strictComplete: 0,
    expectedMemberCount: 40,
    published: false,
    legacyDisposition: "historical-stale-retained-unmodified",
  };
}

function parseMode(argv) {
  invariant(
    argv.length === 1 && ["--apply", "--check"].includes(argv[0]),
    "Usage: node scripts/build-g4-l3-renderer-drift-successor-v3.mjs --apply|--check",
  );
  return argv[0].slice(2);
}

async function main() {
  try {
    const mode = parseMode(process.argv.slice(2));
    const result = mode === "apply"
      ? await applyRendererDriftSuccessorV3()
      : await checkRendererDriftSuccessorV3();
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
