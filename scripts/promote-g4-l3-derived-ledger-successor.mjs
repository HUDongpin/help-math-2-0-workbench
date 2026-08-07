#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import {hostname} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  generateCompletionLedger,
} from "./build-completion-ledger.mjs";
import {
  generateLessonReleaseLedger,
} from "./build-lesson-release-ledger.mjs";
import {
  CAS_STATES,
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  applyWave2bCasBatch,
  assertWave2bLock,
  inspectWave2bCasItem,
  recoverWave2bCasBatch,
  releaseWave2bLock,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const COMPLETION_PATH = "catalog/completion-ledger.json";
const RELEASE_PATH = "catalog/lesson-release-ledger.json";
const RELEASE_MANIFEST_PATH = "catalog/lesson-releases.json";
const MIGRATIONS_PATH = "migrations";
const WORK_PARENT =
  "work/g4-l3-derived-ledger-successor-transactions";
const RECEIPT_PREFIX =
  "reports/g4-l3-derived-ledger-successor";
const SHA256 = /^[a-f0-9]{64}$/u;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

const AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  derivedLedgerRefreshOnly: true,
  originalRuntimeAuthorityCreated: false,
  authoritativeRuntimeTraceCreated: false,
  visualParityOrRmseCreated: false,
  audioAcceptanceCreated: false,
  independentHumanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  publicReleaseAuthorized: false,
  protectedHistoricalReceiptRewritten: false,
  protectedPinConstantRewritten: false,
  strictAcceptanceEffect: "none",
  releaseEffect: "none",
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
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
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

function relative(root, candidate) {
  return portable(path.relative(root, candidate));
}

function inside(candidate, root) {
  const rel = path.relative(root, candidate);
  return rel === "" ||
    (!path.isAbsolute(rel) && rel !== ".." &&
      !rel.startsWith(`..${path.sep}`));
}

function projectAbsolute(root, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.posix.isAbsolute(relativePath) &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.split("/").includes("..") &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0"),
    `unsafe project-relative path: ${relativePath}`,
  );
  const result = path.join(root, ...relativePath.split("/"));
  invariant(inside(result, root) && result !== root,
    `path escapes project root: ${relativePath}`);
  return result;
}

async function canonicalRoot(root) {
  const absolute = path.resolve(root);
  const metadata = await lstat(absolute);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
    "project root must be a real directory");
  invariant(await realpath(absolute) === absolute,
    "project root must be canonical");
  return absolute;
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

async function ensureDirectory(root, relativePath, mode = 0o700) {
  const absolute = projectAbsolute(root, relativePath);
  const parentRelative = path.posix.dirname(relativePath);
  if (parentRelative !== ".") {
    const segments = parentRelative.split("/");
    let cursor = root;
    for (const segment of segments) {
      cursor = path.join(cursor, segment);
      let metadata;
      try {
        metadata = await lstat(cursor);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        await mkdir(cursor, {recursive: false, mode});
        await fsyncDirectory(path.dirname(cursor));
        metadata = await lstat(cursor);
      }
      invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
        `${relative(root, cursor)} must be a real directory`);
      invariant(inside(await realpath(cursor), root),
        `${relative(root, cursor)} escapes the realpath allowlist`);
    }
  }
  let metadata;
  try {
    metadata = await lstat(absolute);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(absolute, {recursive: false, mode});
    await fsyncDirectory(path.dirname(absolute));
    metadata = await lstat(absolute);
  }
  invariant(
    metadata.isDirectory() &&
      !metadata.isSymbolicLink() &&
      (metadata.mode & 0o777) === mode &&
      inside(await realpath(absolute), root),
    `${relativePath} directory identity or mode drifted`,
  );
  return absolute;
}

async function secureRead(root, relativePath, {
  mode = null,
  nlink = 1,
  expected = null,
} = {}) {
  const absolute = projectAbsolute(root, relativePath);
  invariant(inside(await realpath(path.dirname(absolute)), root),
    `${relativePath} parent escapes the project root`);
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  let before;
  let bytes;
  let after;
  try {
    before = await handle.stat();
    invariant(before.isFile() && before.nlink === nlink,
      `${relativePath} must be a regular ${nlink}-link file`);
    if (mode !== null) {
      invariant((before.mode & 0o777) === mode,
        `${relativePath} mode drifted`);
    }
    bytes = await handle.readFile();
    after = await handle.stat();
  } finally {
    await handle.close();
  }
  const atPath = await lstat(absolute);
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
    `${relativePath} identity changed while reading`,
  );
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: before.mode & 0o777,
    nlink: before.nlink,
    dev: String(before.dev),
    ino: String(before.ino),
    contents: bytes,
  };
  if (expected) {
    invariant(
      binding.bytes === expected.bytes &&
        binding.sha256 === expected.sha256 &&
        (expected.mode === undefined || binding.mode === expected.mode),
      `${relativePath} differs from its immutable binding`,
    );
  }
  return binding;
}

async function writeImmutableNoReplace(
  root,
  relativePath,
  bytes,
  mode = 0o444,
) {
  invariant(
    Number.isInteger(fsConstants.O_NOFOLLOW) &&
      Number.isInteger(fsConstants.O_EXCL),
    "O_NOFOLLOW/O_EXCL unavailable; immutable publication is unsupported",
  );
  const absolute = projectAbsolute(root, relativePath);
  invariant(inside(await realpath(path.dirname(absolute)), root),
    `${relativePath} parent escapes the project root`);
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
      `${relativePath} new inode is unsafe`);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fsyncDirectory(path.dirname(absolute));
  const observed = await secureRead(root, relativePath, {
    mode,
    expected: {bytes: bytes.length, sha256: sha256(bytes), mode},
  });
  invariant(
    observed.dev === String(opened.dev) &&
      observed.ino === String(opened.ino),
    `${relativePath} inode changed after close`,
  );
  return observed;
}

async function ensureImmutable(root, relativePath, bytes) {
  try {
    return await writeImmutableNoReplace(root, relativePath, bytes);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const observed = await secureRead(root, relativePath, {mode: 0o444});
    invariant(observed.contents.equals(bytes),
      `${relativePath} is an immutable foreign collision`);
    return observed;
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

function parseJson(file, label) {
  try {
    return JSON.parse(file.contents.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function g4Release(ledger) {
  const release = ledger.releases?.find(({releaseId}) =>
    releaseId === RELEASE_ID
  );
  invariant(release, `${RELEASE_ID} is missing from lesson-release ledger`);
  return release;
}

function assertAcceptanceNeutral(completion, release, label) {
  invariant(
    completion?.summary?.strictComplete === 0 &&
      Array.isArray(completion.entries) &&
      completion.entries.length === 0,
    `${label} completion ledger is not strict-zero`,
  );
  const g4 = g4Release(release);
  invariant(
    g4.expectedMemberCount === 40 &&
      g4.strictCompleteCount === 0 &&
      g4.published === false &&
      g4.status === "unpublished" &&
      release?.summary?.publishedReleaseCount === 0,
    `${label} lesson release state is not strict-zero and unpublished`,
  );
  return g4;
}

function transitionTransactionId(transitions) {
  return sha256(Buffer.from(canonicalJson({
    schemaVersion: 1,
    transactionType: "g4-l3-derived-ledger-successor",
    transitions: transitions.map(
      ({id, path: target, preimage, postimage}) => ({
        id,
        path: target,
        preimage,
        postimage,
      }),
    ),
    authorityBoundary: AUTHORITY_BOUNDARY,
  })));
}

async function buildStateFromCandidates({
  projectRoot,
  completionCandidate,
  releaseCandidate,
}) {
  const [completionPreimage, releasePreimage] = await Promise.all([
    secureRead(projectRoot, COMPLETION_PATH, {mode: 0o644}),
    secureRead(projectRoot, RELEASE_PATH, {mode: 0o644}),
  ]);
  const completionBefore = parseJson(
    completionPreimage,
    "completion ledger preimage",
  );
  const releaseBefore = parseJson(
    releasePreimage,
    "lesson-release ledger preimage",
  );
  assertAcceptanceNeutral(completionBefore, releaseBefore, "preimage");

  const completionBytes = Buffer.from(stableJson(completionCandidate));
  const releaseBytes = Buffer.from(stableJson(releaseCandidate));
  const g4Candidate = assertAcceptanceNeutral(
    completionCandidate,
    releaseCandidate,
    "candidate",
  );
  invariant(
    releaseCandidate.sources?.completionLedger?.path === COMPLETION_PATH &&
      releaseCandidate.sources?.completionLedger?.sha256 ===
        sha256(completionBytes),
    "candidate lesson-release ledger is not bound to canonical completion-ledger bytes",
  );

  const transitions = [
    {
      id: "completion-ledger",
      path: COMPLETION_PATH,
      preimage: {
        bytes: completionPreimage.bytes,
        sha256: completionPreimage.sha256,
        mode: completionPreimage.mode,
      },
      postimage: {
        bytes: completionBytes.length,
        sha256: sha256(completionBytes),
        mode: 0o644,
      },
      postBytes: completionBytes,
    },
    {
      id: "lesson-release-ledger",
      path: RELEASE_PATH,
      preimage: {
        bytes: releasePreimage.bytes,
        sha256: releasePreimage.sha256,
        mode: releasePreimage.mode,
      },
      postimage: {
        bytes: releaseBytes.length,
        sha256: sha256(releaseBytes),
        mode: 0o644,
      },
      postBytes: releaseBytes,
    },
  ];
  const changed = transitions.some(({preimage, postimage}) =>
    preimage.sha256 !== postimage.sha256
  );
  const transactionId = transitionTransactionId(transitions);
  const transactionRoot = `${WORK_PARENT}/${transactionId}`;
  const receiptPath = `${RECEIPT_PREFIX}-${transactionId}.json`;

  return {
    projectRoot,
    transactionId,
    changed,
    transactionRoot,
    receiptPath,
    completionCandidate,
    releaseCandidate,
    transitions,
    semanticState: {
      completion: {
        strictComplete: completionCandidate.summary.strictComplete,
        strictFailed: completionCandidate.summary.strictFailed,
        migrationDirectories:
          completionCandidate.summary.migrationDirectories,
        generatedMarker: completionCandidate.generatedMarker,
      },
      g4LessonRelease: {
        releaseId: g4Candidate.releaseId,
        expectedMemberCount: g4Candidate.expectedMemberCount,
        strictCompleteCount: g4Candidate.strictCompleteCount,
        published: g4Candidate.published,
        status: g4Candidate.status,
      },
    },
  };
}

export async function generateDerivedLedgerSuccessorStateFromCandidates({
  root,
  completionCandidate,
  releaseCandidate,
}) {
  const projectRoot = await canonicalRoot(root);
  return buildStateFromCandidates({
    projectRoot,
    completionCandidate,
    releaseCandidate,
  });
}

export async function generateDerivedLedgerSuccessorState({
  root = DEFAULT_ROOT,
} = {}) {
  const projectRoot = await canonicalRoot(root);
  const completionAbsolute = projectAbsolute(projectRoot, COMPLETION_PATH);
  const migrationsRoot = projectAbsolute(projectRoot, MIGRATIONS_PATH);
  const releasesPath = projectAbsolute(projectRoot, RELEASE_MANIFEST_PATH);

  const completionCandidate = await generateCompletionLedger({
    migrationsRoot,
  });
  const completionBytes = Buffer.from(stableJson(completionCandidate));
  const completionExpected = {
    ok: true,
    reason: "current",
    outputPath: completionAbsolute,
    ledger: completionCandidate,
    expected: completionBytes.toString("utf8"),
    actual: completionBytes.toString("utf8"),
  };
  const candidateRead = async (candidate) => {
    if (path.resolve(candidate) === completionAbsolute) {
      return Buffer.from(completionBytes);
    }
    return readFile(candidate);
  };
  const releaseCandidate = await generateLessonReleaseLedger({
    releasesPath,
    completionLedgerPath: completionAbsolute,
    migrationsRoot,
    read: candidateRead,
    completionLedgerCheck: async () => completionExpected,
  });
  return buildStateFromCandidates({
    projectRoot,
    completionCandidate,
    releaseCandidate,
  });
}

function transactionPaths(state) {
  const base = state.transactionRoot;
  return {
    root: base,
    attempts: `${base}/attempts`,
    copies: `${base}/copies`,
    journal: `${base}/journal`,
    lock: `${base}/lock`,
    lockBindings: `${base}/lock-bindings`,
    plan: `${base}/transaction-plan.json`,
  };
}

function attemptPaths(state, acquisitionId) {
  invariant(SHA256.test(acquisitionId ?? ""),
    "transaction attempt acquisitionId is invalid");
  const paths = transactionPaths(state);
  return {
    active: `${paths.attempts}/${acquisitionId}`,
    lockBinding: `${paths.lockBindings}/${acquisitionId}.json`,
  };
}

function transactionPlan(state) {
  const paths = transactionPaths(state);
  return {
    schemaVersion: 1,
    planType: "g4-l3-derived-ledger-successor-transaction",
    transactionId: state.transactionId,
    paths: {
      transactionRoot: paths.root,
      canonicalReceipt: state.receiptPath,
    },
    transitions: state.transitions.map(
      ({id, path: target, preimage, postimage}, index) => ({
        ordinal: index + 1,
        id,
        target,
        preimage,
        postimage,
        immutablePreimageCopy:
          `${paths.copies}/${index}.preimage.bin`,
        immutablePostimageCopy:
          `${paths.copies}/${index}.postimage.bin`,
      }),
    ),
    semanticState: state.semanticState,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
}

function receiptDocument(state, planBinding) {
  const base = {
    schemaVersion: 1,
    reportType: "g4-l3-derived-ledger-successor-receipt",
    transactionId: state.transactionId,
    status:
      "verified-acceptance-neutral-ledger-successor-strict-zero-unpublished",
    plan: contentBinding(planBinding),
    transitions: state.transitions.map(
      ({id, path: target, preimage, postimage}, index) => ({
        ordinal: index + 1,
        id,
        target,
        preimage,
        postimage,
        immutablePreimageCopy:
          `${state.transactionRoot}/copies/${index}.preimage.bin`,
        immutablePostimageCopy:
          `${state.transactionRoot}/copies/${index}.postimage.bin`,
      }),
    ),
    semanticState: state.semanticState,
    preservation: {
      oldLedgerBytesStoredOutsideGit: true,
      historicalReceiptsModified: false,
      protectedPinConstantsModified: false,
      sourceAssetsModified: false,
      canonicalWrites: 2,
      writeMode:
        "locked-multi-file-compare-and-swap-with-preimage-quarantine",
      defaultMode: "dry-run",
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    limitations: [
      "This transaction refreshes derived ledgers only and preserves strict completion at zero.",
      "It creates no original-runtime, RMSE, audio-listening, independent-human, owner, strict-completion, or release authority.",
      "The G4 L3 atomic release remains unpublished at 0/40.",
    ],
  };
  return {
    ...base,
    receiptFingerprintSha256: sha256(Buffer.from(canonicalJson(base))),
  };
}

function validateReceipt(receipt, state) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.reportType ===
        "g4-l3-derived-ledger-successor-receipt" &&
      receipt.transactionId === state.transactionId &&
      receipt.status ===
        "verified-acceptance-neutral-ledger-successor-strict-zero-unpublished" &&
      receipt.semanticState?.completion?.strictComplete === 0 &&
      receipt.semanticState?.g4LessonRelease?.strictCompleteCount === 0 &&
      receipt.semanticState?.g4LessonRelease?.published === false &&
      receipt.authorityBoundary?.strictAcceptanceEffect === "none" &&
      receipt.authorityBoundary?.releaseEffect === "none",
    "derived-ledger successor receipt semantics drifted",
  );
  const base = structuredClone(receipt);
  delete base.receiptFingerprintSha256;
  invariant(
    receipt.receiptFingerprintSha256 ===
      sha256(Buffer.from(canonicalJson(base))),
    "derived-ledger successor receipt fingerprint drifted",
  );
}

function casItems(state, acquisitionId) {
  const paths = attemptPaths(state, acquisitionId);
  return state.transitions.map((transition, index) => ({
    id: transition.id,
    rootPath: state.projectRoot,
    targetPath: projectAbsolute(state.projectRoot, transition.path),
    tempOwnershipPath: projectAbsolute(
      state.projectRoot,
      `${paths.active}/${index}.temp-owner`,
    ),
    tempPath: projectAbsolute(
      state.projectRoot,
      `${paths.active}/${index}.post.tmp`,
    ),
    quarantinePath: projectAbsolute(
      state.projectRoot,
      `${paths.active}/${index}.pre.quarantine`,
    ),
    postArchivePath: projectAbsolute(
      state.projectRoot,
      `${paths.active}/${index}.post.archive`,
    ),
    preimage: {
      bytes: transition.preimage.bytes,
      sha256: transition.preimage.sha256,
    },
    postimage: {
      bytes: transition.postimage.bytes,
      sha256: transition.postimage.sha256,
    },
    postBytes: Buffer.from(transition.postBytes),
    originalMode: 0o644,
  }));
}

async function journalRecords(root, state) {
  const directory = projectAbsolute(
    root,
    transactionPaths(state).journal,
  );
  let entries;
  try {
    entries = (await readdir(directory)).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const records = [];
  let previousRecordSha256 = null;
  for (let index = 0; index < entries.length; index += 1) {
    const expectedPrefix = `${String(index + 1).padStart(6, "0")}-`;
    invariant(
      entries[index].startsWith(expectedPrefix) &&
        entries[index].endsWith(".json"),
      "derived-ledger journal sequence drifted",
    );
    const relativePath =
      `${transactionPaths(state).journal}/${entries[index]}`;
    const file = await secureRead(root, relativePath, {mode: 0o444});
    const record = parseJson(file, `journal record ${index + 1}`);
    invariant(
      record.schemaVersion === 1 &&
        record.transactionId === state.transactionId &&
        record.sequence === index + 1 &&
        record.previousRecordSha256 === previousRecordSha256,
      "derived-ledger journal chain drifted",
    );
    const base = structuredClone(record);
    delete base.recordFingerprintSha256;
    invariant(
      record.recordFingerprintSha256 ===
        sha256(Buffer.from(canonicalJson(base))),
      "derived-ledger journal record fingerprint drifted",
    );
    invariant(
      entries[index] ===
        `${expectedPrefix}${record.recordFingerprintSha256}.json`,
      "derived-ledger journal filename fingerprint drifted",
    );
    previousRecordSha256 = file.sha256;
    records.push(record);
  }
  return records;
}

async function appendJournal(root, state, event, data) {
  const records = await journalRecords(root, state);
  const base = {
    schemaVersion: 1,
    transactionId: state.transactionId,
    sequence: records.length + 1,
    previousRecordSha256:
      records.length === 0
        ? null
        : sha256(Buffer.from(stableJson(records.at(-1)))),
    event,
    data,
  };
  const record = {
    ...base,
    recordFingerprintSha256: sha256(Buffer.from(canonicalJson(base))),
  };
  const filename =
    `${String(record.sequence).padStart(6, "0")}-` +
    `${record.recordFingerprintSha256}.json`;
  await writeImmutableNoReplace(
    root,
    `${transactionPaths(state).journal}/${filename}`,
    Buffer.from(stableJson(record)),
  );
  return record;
}

async function prepareTransaction(state) {
  const root = state.projectRoot;
  const paths = transactionPaths(state);
  await ensureDirectory(root, WORK_PARENT);
  await ensureDirectory(root, paths.root);
  await ensureDirectory(root, paths.attempts);
  await ensureDirectory(root, paths.copies);
  await ensureDirectory(root, paths.journal);
  await ensureDirectory(root, paths.lockBindings);

  const copyBindings = [];
  for (const [index, transition] of state.transitions.entries()) {
    const preimage = await secureRead(root, transition.path, {
      mode: 0o644,
      expected: transition.preimage,
    });
    const preCopy = await ensureImmutable(
      root,
      `${paths.copies}/${index}.preimage.bin`,
      preimage.contents,
    );
    const postCopy = await ensureImmutable(
      root,
      `${paths.copies}/${index}.postimage.bin`,
      transition.postBytes,
    );
    copyBindings.push({
      id: transition.id,
      preimage: contentBinding(preCopy),
      postimage: contentBinding(postCopy),
    });
  }
  const plan = transactionPlan(state);
  const planBinding = await ensureImmutable(
    root,
    paths.plan,
    Buffer.from(stableJson(plan)),
  );
  return {paths, plan, planBinding, copyBindings};
}

async function verifyInstalled(state) {
  const installed = [];
  for (const transition of state.transitions) {
    const file = await secureRead(state.projectRoot, transition.path, {
      mode: 0o644,
      expected: transition.postimage,
    });
    installed.push(contentBinding(file));
  }
  const completion = parseJson(
    await secureRead(state.projectRoot, COMPLETION_PATH, {mode: 0o644}),
    "installed completion ledger",
  );
  const release = parseJson(
    await secureRead(state.projectRoot, RELEASE_PATH, {mode: 0o644}),
    "installed lesson-release ledger",
  );
  assertAcceptanceNeutral(completion, release, "installed");
  invariant(
    release.sources?.completionLedger?.sha256 === installed[0].sha256 &&
      release.sources?.completionLedger?.path === COMPLETION_PATH,
    "installed lesson-release ledger does not bind installed completion ledger",
  );
  return installed;
}

function processAlive(pid) {
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

async function readPersistedLock(state) {
  const ownerFile = await secureRead(
    state.projectRoot,
    `${transactionPaths(state).lock}/owner.json`,
    {mode: 0o444},
  );
  const owner = parseJson(ownerFile, "derived-ledger lock owner");
  invariant(
    owner?.transactionId === state.transactionId &&
      SHA256.test(owner?.acquisitionId ?? ""),
    "derived-ledger lock owner identity drifted",
  );
  const bindingPath =
    attemptPaths(state, owner.acquisitionId).lockBinding;
  const file = await secureRead(
    state.projectRoot,
    bindingPath,
    {mode: 0o444},
  );
  return {
    acquisitionId: owner.acquisitionId,
    persistedBinding: parseJson(
      file,
      "persisted derived-ledger lock binding",
    ),
  };
}

async function receiptIfPresent(state) {
  try {
    const file = await secureRead(
      state.projectRoot,
      state.receiptPath,
      {mode: 0o444},
    );
    const receipt = parseJson(file, "derived-ledger successor receipt");
    validateReceipt(receipt, state);
    return {file, receipt};
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function recoverStaleTransaction(state) {
  const root = state.projectRoot;
  const paths = transactionPaths(state);
  const persisted = await readPersistedLock(state);
  const items = casItems(state, persisted.acquisitionId);
  const journal = (event) =>
    appendJournal(root, state, "cas-recovery-event", event);
  const adopted = await adoptWave2bLockForRecovery({
    rootPath: root,
    lockPath: projectAbsolute(root, paths.lock),
    items,
    persistedBinding: persisted.persistedBinding,
    decideOwnerLiveness: async (subject) => {
      invariant(
        subject.owner?.hostname === hostname(),
        "cannot establish liveness for a lock owned on another host",
      );
      return processAlive(subject.owner.processId) ? "alive" : "dead";
    },
    journal,
  });
  const receipt = await receiptIfPresent(state);
  if (receipt) {
    await verifyInstalled(state);
    await appendJournal(root, state, "recovery-commit-verified", {
      receipt: contentBinding(receipt.file),
    });
    await releaseWave2bLock(adopted);
    return {status: "recovered-committed", receipt};
  }
  const recovered = await recoverWave2bCasBatch({
    items,
    journal,
    lock: adopted,
  });
  await appendJournal(root, state, "recovery-rollback-complete", recovered);
  await releaseWave2bLock(adopted);
  return {status: "recovered-rolled-back", recovered};
}

async function lockExists(state) {
  try {
    const metadata = await lstat(
      projectAbsolute(state.projectRoot, transactionPaths(state).lock),
    );
    return metadata.isDirectory() && !metadata.isSymbolicLink();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function stateFromTransactionPlan(projectRoot, transactionId) {
  invariant(SHA256.test(transactionId),
    "outstanding transaction directory name is invalid");
  const transactionRoot = `${WORK_PARENT}/${transactionId}`;
  const planPath = `${transactionRoot}/transaction-plan.json`;
  const planFile = await secureRead(projectRoot, planPath, {mode: 0o444});
  const plan = parseJson(planFile, "outstanding transaction plan");
  invariant(
    plan?.schemaVersion === 1 &&
      plan.planType === "g4-l3-derived-ledger-successor-transaction" &&
      plan.transactionId === transactionId &&
      plan.paths?.transactionRoot === transactionRoot &&
      typeof plan.paths?.canonicalReceipt === "string" &&
      plan.paths.canonicalReceipt.startsWith(
        `${RECEIPT_PREFIX}-${transactionId}`,
      ) &&
      Array.isArray(plan.transitions) &&
      plan.transitions.length === 2 &&
      plan.semanticState?.completion?.strictComplete === 0 &&
      plan.semanticState?.g4LessonRelease?.strictCompleteCount === 0 &&
      plan.semanticState?.g4LessonRelease?.published === false &&
      plan.authorityBoundary?.strictAcceptanceEffect === "none" &&
      plan.authorityBoundary?.releaseEffect === "none",
    "outstanding transaction plan semantics drifted",
  );
  const transitions = [];
  for (const [index, planned] of plan.transitions.entries()) {
    invariant(
      planned.ordinal === index + 1 &&
        typeof planned.id === "string" &&
        [COMPLETION_PATH, RELEASE_PATH].includes(planned.target) &&
        Number.isSafeInteger(planned.preimage?.bytes) &&
        SHA256.test(planned.preimage?.sha256 ?? "") &&
        planned.preimage?.mode === 0o644 &&
        Number.isSafeInteger(planned.postimage?.bytes) &&
        SHA256.test(planned.postimage?.sha256 ?? "") &&
        planned.postimage?.mode === 0o644 &&
        planned.immutablePreimageCopy ===
          `${transactionRoot}/copies/${index}.preimage.bin` &&
        planned.immutablePostimageCopy ===
          `${transactionRoot}/copies/${index}.postimage.bin`,
      `outstanding transition ${index + 1} drifted`,
    );
    const [preimageCopy, postimageCopy] = await Promise.all([
      secureRead(projectRoot, planned.immutablePreimageCopy, {
        mode: 0o444,
        expected: {
          bytes: planned.preimage.bytes,
          sha256: planned.preimage.sha256,
        },
      }),
      secureRead(projectRoot, planned.immutablePostimageCopy, {
        mode: 0o444,
        expected: {
          bytes: planned.postimage.bytes,
          sha256: planned.postimage.sha256,
        },
      }),
    ]);
    invariant(
      preimageCopy.sha256 !== postimageCopy.sha256,
      `outstanding transition ${index + 1} has identical images`,
    );
    transitions.push({
      id: planned.id,
      path: planned.target,
      preimage: structuredClone(planned.preimage),
      postimage: structuredClone(planned.postimage),
      postBytes: Buffer.from(postimageCopy.contents),
    });
  }
  invariant(
    transitionTransactionId(transitions) === transactionId,
    "outstanding transactionId does not bind its transitions",
  );
  return {
    projectRoot,
    transactionId,
    changed: true,
    transactionRoot,
    receiptPath: plan.paths.canonicalReceipt,
    transitions,
    semanticState: structuredClone(plan.semanticState),
  };
}

async function outstandingTransactionStates(projectRoot) {
  const parent = projectAbsolute(projectRoot, WORK_PARENT);
  let entries;
  try {
    entries = await readdir(parent, {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const states = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    invariant(
      entry.isDirectory() && !entry.isSymbolicLink() &&
        SHA256.test(entry.name),
      `foreign entry in ${WORK_PARENT}: ${entry.name}`,
    );
    const state = await stateFromTransactionPlan(
      projectRoot,
      entry.name,
    );
    if (await lockExists(state)) states.push(state);
  }
  return states;
}

async function recoverOutstandingTransactions(projectRoot) {
  const outstanding = await outstandingTransactionStates(projectRoot);
  invariant(
    outstanding.length <= 1,
    "multiple outstanding derived-ledger transactions require manual review",
  );
  const results = [];
  for (const state of outstanding) {
    results.push(await recoverStaleTransaction(state));
  }
  return results;
}

export async function dryRunDerivedLedgerSuccessor({
  root = DEFAULT_ROOT,
  stateFactory = generateDerivedLedgerSuccessorState,
} = {}) {
  const state = await stateFactory({root});
  const outstanding = await outstandingTransactionStates(
    state.projectRoot,
  );
  return {
    mode: "dry-run",
    status: outstanding.length > 0
      ? "outstanding-transaction-no-write"
      : state.changed
        ? "ready-no-write"
        : "already-current-no-write",
    outstandingTransactionCount: outstanding.length,
    transactionId: state.transactionId,
    receiptPath: state.receiptPath,
    transitions: state.transitions.map(
      ({id, path: target, preimage, postimage}) => ({
        id,
        path: target,
        preimage,
        postimage,
      }),
    ),
    semanticState: state.semanticState,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
}

export async function checkDerivedLedgerSuccessor({
  root = DEFAULT_ROOT,
  stateFactory = generateDerivedLedgerSuccessorState,
} = {}) {
  const state = await stateFactory({root});
  invariant(
    (await outstandingTransactionStates(state.projectRoot)).length === 0,
    "an outstanding derived-ledger transaction requires recovery",
  );
  invariant(!state.changed,
    "derived completion/release ledgers are stale");
  const receipts = (await readdir(projectAbsolute(
    state.projectRoot,
    "reports",
  )))
    .filter((name) =>
      name.startsWith("g4-l3-derived-ledger-successor-") &&
      name.endsWith(".json")
    );
  invariant(receipts.length > 0,
    "no derived-ledger successor receipt exists");
  return {
    mode: "check",
    status: "current-strict-zero-unpublished",
    completion: state.transitions[0].preimage,
    lessonRelease: state.transitions[1].preimage,
    receiptCount: receipts.length,
    semanticState: state.semanticState,
    authorityBoundary: AUTHORITY_BOUNDARY,
  };
}

export async function applyDerivedLedgerSuccessor({
  root = DEFAULT_ROOT,
  hooks = {},
  stateFactory = generateDerivedLedgerSuccessorState,
} = {}) {
  const projectRoot = await canonicalRoot(root);
  const recoveries = await recoverOutstandingTransactions(projectRoot);
  let state = await stateFactory({root: projectRoot});
  if (!state.changed) {
    const checked = await checkDerivedLedgerSuccessor({
      root: state.projectRoot,
      stateFactory,
    });
    return {...checked, recoveries};
  }
  const prepared = await prepareTransaction(state);
  if (await lockExists(state)) {
    const recovery = await recoverStaleTransaction(state);
    if (recovery.status === "recovered-committed") {
      return {
        mode: "apply",
        status: recovery.status,
        transactionId: state.transactionId,
        receipt: contentBinding(recovery.receipt.file),
        semanticState: state.semanticState,
        authorityBoundary: AUTHORITY_BOUNDARY,
        recoveries,
      };
    }
    state = await stateFactory({
      root: state.projectRoot,
    });
    invariant(state.changed,
      "rollback recovery unexpectedly changed derived-ledger inputs");
  }

  const rootPath = state.projectRoot;
  const paths = transactionPaths(state);
  const lock = await acquireWave2bLock({
    rootPath,
    lockPath: projectAbsolute(rootPath, paths.lock),
    owner: {
      schemaVersion: 1,
      transactionId: state.transactionId,
      processId: process.pid,
      hostname: hostname(),
      actorKind: "software-process",
      authority:
        "single-writer-acceptance-neutral-derived-ledger-refresh-only",
      strictAcceptanceAuthorityClaimed: false,
      releaseAuthorityClaimed: false,
    },
  });
  const acquisitionId = lock.persistedBinding.acquisitionId;
  const attempt = attemptPaths(state, acquisitionId);
  await ensureDirectory(rootPath, attempt.active);
  await writeImmutableNoReplace(
    rootPath,
    attempt.lockBinding,
    Buffer.from(stableJson(lock.persistedBinding)),
  );
  const items = casItems(state, acquisitionId);
  const journal = (event) =>
    appendJournal(rootPath, state, "cas-event", event);
  await appendJournal(rootPath, state, "transaction-locked", {
    plan: contentBinding(prepared.planBinding),
    lockDescriptorSha256: lock.descriptorSha256,
    acquisitionId,
    copyBindings: prepared.copyBindings,
  });

  try {
    await assertWave2bLock(lock, items);
    if (hooks.afterLockedSnapshot) await hooks.afterLockedSnapshot(state);
    const applied = await applyWave2bCasBatch({
      items,
      journal,
      lock,
      hooks: hooks.cas ?? null,
      leaveInterruptedForTest:
        hooks.leaveInterruptedForTest === true,
    });
    const installed = await verifyInstalled(state);
    await appendJournal(rootPath, state, "canonical-ledgers-verified", {
      applied,
      installed,
    });

    const receipt = receiptDocument(state, prepared.planBinding);
    const receiptBytes = Buffer.from(stableJson(receipt));
    const receiptFile = await writeImmutableNoReplace(
      rootPath,
      state.receiptPath,
      receiptBytes,
    );
    validateReceipt(
      parseJson(receiptFile, "new derived-ledger successor receipt"),
      state,
    );
    if (hooks.afterReceiptDurable) {
      await hooks.afterReceiptDurable({
        transactionId: state.transactionId,
        receipt: contentBinding(receiptFile),
      });
    }
    await appendJournal(rootPath, state, "receipt-durable", {
      receipt: contentBinding(receiptFile),
    });
    await appendJournal(rootPath, state, "committed", {
      strictComplete: 0,
      g4LessonStrictComplete: 0,
      published: false,
      strictAcceptanceEffect: "none",
      releaseEffect: "none",
    });
    await releaseWave2bLock(lock);
    return {
      mode: "apply",
      status: "created-and-verified",
      transactionId: state.transactionId,
      receipt: contentBinding(receiptFile),
      installed,
      semanticState: state.semanticState,
      authorityBoundary: AUTHORITY_BOUNDARY,
      recoveries,
    };
  } catch (error) {
    try {
      await appendJournal(rootPath, state, "transaction-error", {
        name: error.name,
        code: error.code ?? null,
        message: error.message,
      });
    } catch {
      // Preserve the primary error and all uncertain transaction state.
    }
    let inspections = [];
    try {
      inspections = await Promise.all(
        items.map((item, index) => inspectWave2bCasItem(item, index)),
      );
    } catch {
      throw error;
    }
    const safelyPreimage = inspections.every(({state: observed}) =>
      observed === CAS_STATES.PREIMAGE ||
      observed === CAS_STATES.RECOVERED
    );
    if (safelyPreimage) {
      await releaseWave2bLock(lock);
    }
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {
    mode: "dry-run",
    root: DEFAULT_ROOT,
    help: false,
  };
  let selected = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(!selected,
        "--dry-run, --apply, and --check are mutually exclusive");
      selected = true;
      options.mode = argument.slice(2);
    } else if (argument === "--root") {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"),
        "--root requires a value");
      options.root = path.resolve(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function help() {
  return "Usage: node scripts/promote-g4-l3-derived-ledger-successor.mjs " +
    "[--dry-run|--apply|--check] [--root PATH]\n\n" +
    "Refreshes the completion and lesson-release ledgers through a locked, " +
    "preimage-preserving, journaled CAS transaction. It refuses any strict " +
    "completion or publication transition. Default: dry-run.\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  const result = options.mode === "apply"
    ? await applyDerivedLedgerSuccessor(options)
    : options.mode === "check"
      ? await checkDerivedLedgerSuccessor(options)
      : await dryRunDerivedLedgerSuccessor(options);
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
