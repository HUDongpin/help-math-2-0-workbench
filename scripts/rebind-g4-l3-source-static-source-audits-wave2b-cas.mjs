import {createHash, randomBytes} from "node:crypto";
import {constants as FS_CONSTANTS} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";

const ABSENT = Symbol("absent");
const WAVE2B_LOCK_DESCRIPTOR_SCHEMA = "wave2b-lock-descriptor-v1";
const WAVE2B_LOCK_BINDING_SCHEMA = "wave2b-lock-persisted-binding-v1";
const WAVE2B_LOCK_OWNER_SCHEMA = "wave2b-lock-owner-v1";
const WAVE2B_RECOVERY_ADOPTION_SCHEMA =
  "wave2b-lock-recovery-adoption-v1";
const WAVE2B_RECOVERY_JOURNAL_SCHEMA =
  "wave2b-lock-recovery-journal-event-v1";
const WAVE2B_LOCK_KIND_ACQUIRED = "acquired";
const WAVE2B_LOCK_KIND_ADOPTED = "recovery-adopted";
const WAVE2B_OWNER_ENTRY = "owner.json";
const WAVE2B_ADOPTION_ENTRY = "recovery-adoption.json";

export const CAS_STATES = Object.freeze({
  PREIMAGE: "S0_PREIMAGE",
  TEMP_OWNERSHIP_READY: "W0_TEMP_OWNERSHIP_READY",
  OWNED_TEMP_PARTIAL: "W1P_OWNED_TEMP_PARTIAL",
  OWNED_TEMP_COMPLETE: "W1C_OWNED_TEMP_COMPLETE",
  TEMP_READY: "S1_TEMP_READY",
  PREIMAGE_QUARANTINE_LINKED: "S1Q_PREIMAGE_QUARANTINE_LINKED",
  TARGET_QUARANTINED: "S2_TARGET_QUARANTINED",
  TARGET_LINKED: "S3_TARGET_LINKED",
  TEMP_UNLINKED: "S4_TEMP_UNLINKED",
  QUARANTINE_FROZEN: "S5_QUARANTINE_FROZEN",
  VERIFIED: "S6_VERIFIED",
  RECOVERY_POST_LINKED: "R1_RECOVERY_POST_LINKED",
  RECOVERY_POST_ARCHIVED: "R2_RECOVERY_POST_ARCHIVED",
  RECOVERY_PREIMAGE_LINKED: "R3_RECOVERY_PREIMAGE_LINKED",
  RECOVERY_FINALIZE: "R4_RECOVERY_FINALIZE",
  RECOVERED: "R0_RECOVERED",
  FOREIGN: "FOREIGN",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

class Wave2bMemberSnapshotDriftError extends Error {
  constructor(message, {cause = null} = {}) {
    super(message);
    this.name = "Wave2bMemberSnapshotDriftError";
    this.code = "WAVE2B_MEMBER_SNAPSHOT_DRIFT";
    if (cause !== null) this.cause = cause;
  }
}

function containsMemberSnapshotDrift(error, seen = new Set()) {
  if (
    error instanceof Wave2bMemberSnapshotDriftError ||
    error?.code === "WAVE2B_MEMBER_SNAPSHOT_DRIFT"
  ) return true;
  if (
    error === null ||
    (typeof error !== "object" && typeof error !== "function") ||
    seen.has(error)
  ) return false;
  seen.add(error);
  if (
    error instanceof AggregateError &&
    error.errors.some((child) =>
      containsMemberSnapshotDrift(child, seen))
  ) return true;
  return containsMemberSnapshotDrift(error.cause, seen);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function modeBits(metadata) {
  return metadata.mode & 0o777;
}

function normalizedAbsolute(value, label) {
  invariant(
    typeof value === "string" &&
      path.isAbsolute(value) &&
      path.normalize(value) === value &&
      !value.includes("\0"),
    `${label} must be a normalized absolute path`,
  );
  return value;
}

function relativeWithin(rootPath, candidatePath, label) {
  normalizedAbsolute(rootPath, "wave2b rootPath");
  normalizedAbsolute(candidatePath, label);
  const relative = path.relative(rootPath, candidatePath);
  invariant(
    relative.length > 0 &&
      !path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`),
    `${label} escapes the wave2b root allowlist`,
  );
  return relative;
}

function insideRealRoot(rootRealPath, candidateRealPath) {
  const relative = path.relative(rootRealPath, candidateRealPath);
  return relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`));
}

function canonicalComparisonKey(candidatePath) {
  return path.normalize(candidatePath).normalize("NFC").toLowerCase();
}

function strictPathOverlap(leftPath, rightPath) {
  if (leftPath === rightPath) return true;
  const leftToRight = path.relative(leftPath, rightPath);
  const rightToLeft = path.relative(rightPath, leftPath);
  return (
    leftToRight.length > 0 &&
    !path.isAbsolute(leftToRight) &&
    leftToRight !== ".." &&
    !leftToRight.startsWith(`..${path.sep}`)
  ) || (
    rightToLeft.length > 0 &&
    !path.isAbsolute(rightToLeft) &&
    rightToLeft !== ".." &&
    !rightToLeft.startsWith(`..${path.sep}`)
  );
}

async function resolveSafeRoot(rootPath) {
  normalizedAbsolute(rootPath, "wave2b rootPath");
  const metadata = await lstat(rootPath);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    "wave2b rootPath must be a real directory",
  );
  const realPath = await realpath(rootPath);
  return {
    lexicalPath: rootPath,
    realPath,
  };
}

async function inspectSafeParent(rootPath, candidatePath, {
  create = false,
} = {}) {
  const root = await resolveSafeRoot(rootPath);
  const relative = relativeWithin(
    root.lexicalPath,
    candidatePath,
    "wave2b member path",
  );
  const segments = relative.split(path.sep);
  const parentSegments = segments.slice(0, -1);
  let lexicalCursor = root.lexicalPath;
  let realCursor = root.realPath;

  for (let index = 0; index < parentSegments.length; index += 1) {
    const segment = parentSegments[index];
    lexicalCursor = path.join(lexicalCursor, segment);
    let metadata;
    try {
      metadata = await lstat(lexicalCursor);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (!create) {
        const remaining = parentSegments.slice(index);
        return {
          root,
          canonicalPath: path.join(
            realCursor,
            ...remaining,
            segments.at(-1),
          ),
          missingParent: lexicalCursor,
        };
      }
      try {
        await mkdir(lexicalCursor, {recursive: false, mode: 0o700});
      } catch (mkdirError) {
        if (mkdirError.code !== "EEXIST") throw mkdirError;
      }
      await chmod(lexicalCursor, 0o700);
      metadata = await lstat(lexicalCursor);
      await syncFilesystemObject(lexicalCursor);
      await syncDirectory(path.dirname(lexicalCursor));
    }
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `${lexicalCursor}: wave2b parent must be a real directory`,
    );
    realCursor = await realpath(lexicalCursor);
    invariant(
      insideRealRoot(root.realPath, realCursor),
      `${lexicalCursor}: wave2b parent escapes the realpath allowlist`,
    );
  }

  return {
    root,
    canonicalPath: path.join(realCursor, segments.at(-1)),
    missingParent: null,
  };
}

async function exists(target) {
  return lstat(target).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

function stableMetadata(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mode === right.mode &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs;
}

function preservePrimaryError(primaryError, secondaryError, label) {
  if (primaryError === null) return secondaryError;
  return new AggregateError(
    [primaryError, secondaryError],
    label,
  );
}

async function withHandleClosePreservingError(
  handle,
  operation,
  label,
  {afterClose = null} = {},
) {
  const close = handle.close.bind(handle);
  let result;
  let operationError = null;
  try {
    result = await operation();
  } catch (error) {
    operationError = error;
  }
  try {
    await close();
  } catch (closeError) {
    operationError = preservePrimaryError(
      operationError,
      closeError,
      label,
    );
  }
  if (afterClose !== null) {
    try {
      await afterClose();
    } catch (afterCloseError) {
      operationError = preservePrimaryError(
        operationError,
        afterCloseError,
        label,
      );
    }
  }
  if (operationError !== null) throw operationError;
  return result;
}

async function syncFilesystemObject(target) {
  let pathMetadata;
  try {
    pathMetadata = await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  invariant(
    !pathMetadata.isSymbolicLink() &&
      (pathMetadata.isFile() || pathMetadata.isDirectory()),
    `${target}: durability sync refuses a non-file object`,
  );
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW),
    "O_NOFOLLOW is unavailable; durability sync is unsupported",
  );
  const handle = await open(
    target,
    FS_CONSTANTS.O_RDONLY | FS_CONSTANTS.O_NOFOLLOW,
  );
  await withHandleClosePreservingError(
    handle,
    async () => {
    const before = await handle.stat();
    await handle.sync();
    const after = await handle.stat();
    invariant(
      before.dev === after.dev &&
        before.ino === after.ino &&
        after.dev === pathMetadata.dev &&
        after.ino === pathMetadata.ino,
      `${target}: filesystem object changed during durability sync`,
    );
    },
    `${target}: durability operation and handle close both failed`,
  );
  return true;
}

async function syncDirectory(directoryPath) {
  const metadata = await lstat(directoryPath);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    `${directoryPath}: durability parent is not a real directory`,
  );
  await syncFilesystemObject(directoryPath);
}

function itemMutationPaths(item) {
  return [
    item.targetPath,
    item.tempOwnershipPath,
    item.tempPath,
    item.quarantinePath,
    item.postArchivePath,
  ];
}

async function syncMutationDurability(item) {
  const parentPaths = new Set();
  for (const memberPath of itemMutationPaths(item)) {
    await inspectSafeParent(item.rootPath, memberPath);
    await syncFilesystemObject(memberPath);
    const parentPath = path.dirname(memberPath);
    if (await exists(parentPath)) parentPaths.add(parentPath);
  }
  for (const parentPath of [...parentPaths].sort()) {
    await syncDirectory(parentPath);
  }
}

async function inspectRegularFile(target) {
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW) &&
      Number.isInteger(FS_CONSTANTS.O_NONBLOCK),
    "O_NOFOLLOW or O_NONBLOCK is unavailable; secure wave2b reads are unsupported",
  );
  let handle;
  try {
    handle = await open(
      target,
      FS_CONSTANTS.O_RDONLY |
        FS_CONSTANTS.O_NOFOLLOW |
        FS_CONSTANTS.O_NONBLOCK,
    );
  } catch (error) {
    if (error.code === "ENOENT") return ABSENT;
    if (error.code === "ELOOP" || error.code === "EMLINK") {
      return {
        kind: "foreign",
        reason: `no-follow open rejected ${error.code}`,
      };
    }
    throw error;
  }

  return withHandleClosePreservingError(
    handle,
    async () => {
    const before = await handle.stat();
    if (!before.isFile()) {
      return {
        kind: "foreign",
        reason: "opened object is not a regular file",
        metadata: before,
      };
    }
    const contents = await handle.readFile();
    const after = await handle.stat();
    let pathMetadata;
    try {
      pathMetadata = await lstat(target);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          kind: "foreign",
          reason: "path disappeared during secure read",
          metadata: after,
        };
      }
      throw error;
    }
    if (
      pathMetadata.isSymbolicLink() ||
      !pathMetadata.isFile() ||
      !stableMetadata(before, after) ||
      after.dev !== pathMetadata.dev ||
      after.ino !== pathMetadata.ino
    ) {
      return {
        kind: "foreign",
        reason: "file identity changed during secure read",
        metadata: pathMetadata,
      };
    }
    return {
      kind: "file",
      bytes: contents.length,
      contents,
      sha256: sha256(contents),
      mode: modeBits(after),
      nlink: after.nlink,
      dev: after.dev,
      ino: after.ino,
    };
    },
    `${target}: secure read and handle close both failed`,
  );
}

async function inspectOwnershipMarker(target) {
  let before;
  try {
    before = await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return ABSENT;
    throw error;
  }
  if (!before.isDirectory() || before.isSymbolicLink()) {
    return {
      kind: "foreign",
      reason: "ownership marker is not a real directory",
      metadata: before,
    };
  }
  const entries = await readdir(target);
  const after = await lstat(target);
  if (
    !after.isDirectory() ||
    after.isSymbolicLink() ||
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    entries.length !== 0
  ) {
    return {
      kind: "foreign",
      reason: "ownership marker identity or contents changed",
      metadata: after,
    };
  }
  return {
    kind: "ownership",
    mode: modeBits(after),
    nlink: after.nlink,
    dev: after.dev,
    ino: after.ino,
    entries: entries.length,
  };
}

function sameBytes(observed, expected) {
  return observed !== ABSENT &&
    observed.kind === "file" &&
    observed.bytes === expected.bytes &&
    observed.sha256 === expected.sha256;
}

function exactFile(observed, expected, {
  mode = null,
  nlink = 1,
} = {}) {
  return sameBytes(observed, expected) &&
    observed.nlink === nlink &&
    (mode === null || observed.mode === mode);
}

function publicObservation(observed) {
  if (observed === ABSENT) return {kind: "absent"};
  if (observed.kind === "ownership") {
    return {
      kind: "ownership",
      mode: observed.mode,
      nlink: observed.nlink,
      dev: String(observed.dev),
      ino: String(observed.ino),
      entries: observed.entries,
    };
  }
  if (observed.kind !== "file") {
    return {
      kind: "foreign",
      reason: observed.reason,
      mode: observed.metadata ? modeBits(observed.metadata) : null,
      nlink: observed.metadata?.nlink ?? null,
    };
  }
  return {
    kind: "file",
    bytes: observed.bytes,
    sha256: observed.sha256,
    mode: observed.mode,
    nlink: observed.nlink,
    dev: String(observed.dev),
    ino: String(observed.ino),
  };
}

function validatePlanItem(item, index) {
  invariant(item && typeof item === "object",
    `wave2b item ${index} must be an object`);
  for (const field of [
    "id",
    "rootPath",
    "targetPath",
    "tempOwnershipPath",
    "tempPath",
    "quarantinePath",
    "postArchivePath",
  ]) {
    invariant(typeof item[field] === "string" && item[field].length > 0,
      `wave2b item ${index} ${field} is missing`);
  }
  normalizedAbsolute(item.rootPath, `${item.id}: rootPath`);
  const memberPaths = [
    item.targetPath,
    item.tempOwnershipPath,
    item.tempPath,
    item.quarantinePath,
    item.postArchivePath,
  ];
  for (const memberPath of memberPaths) {
    relativeWithin(item.rootPath, memberPath, `${item.id}: member path`);
  }
  invariant(
    new Set(memberPaths).size === memberPaths.length,
    `${item.id}: wave2b paths must be distinct`,
  );
  for (const descriptor of ["preimage", "postimage"]) {
    const value = item[descriptor];
    invariant(
      value &&
        Number.isSafeInteger(value.bytes) &&
        value.bytes >= 0 &&
        /^[a-f0-9]{64}$/u.test(value.sha256 ?? ""),
      `${item.id}: ${descriptor} descriptor is invalid`,
    );
  }
  invariant(
    item.preimage.sha256 !== item.postimage.sha256,
    `${item.id}: preimage and postimage must differ`,
  );
  invariant(
    Buffer.isBuffer(item.postBytes) &&
      item.postBytes.length === item.postimage.bytes &&
      sha256(item.postBytes) === item.postimage.sha256,
    `${item.id}: postBytes differ from postimage`,
  );
  invariant(
    item.originalMode === 0o644,
    `${item.id}: original mode must be the verified 0644 wave2 spec mode`,
  );
  return item;
}

function clonePlanItems(items) {
  const cloned = items.map((item, index) => {
    validatePlanItem(item, index);
    const clone = {
      ...item,
      preimage: Object.freeze({...item.preimage}),
      postimage: Object.freeze({...item.postimage}),
      postBytes: Buffer.from(item.postBytes),
    };
    validatePlanItem(clone, index);
    return Object.freeze(clone);
  });
  return Object.freeze(cloned);
}

function recoveryItemFingerprint(item, index = 0) {
  validatePlanItem(item, index);
  return sha256(canonicalJsonBytes({
    schema: "wave2b-recovery-item-v1",
    id: item.id,
    rootPath: item.rootPath,
    targetPath: item.targetPath,
    tempOwnershipPath: item.tempOwnershipPath,
    tempPath: item.tempPath,
    quarantinePath: item.quarantinePath,
    postArchivePath: item.postArchivePath,
    preimage: {
      bytes: item.preimage.bytes,
      sha256: item.preimage.sha256,
    },
    postimage: {
      bytes: item.postimage.bytes,
      sha256: item.postimage.sha256,
    },
    originalMode: item.originalMode,
  }));
}

function recoveryPlanBinding(items) {
  invariant(
    Array.isArray(items) && items.length > 0,
    "wave2b recovery plan binding requires plan items",
  );
  const recoveryItemSha256s = items.map(
    (item, index) => recoveryItemFingerprint(item, index),
  );
  invariant(
    new Set(recoveryItemSha256s).size === recoveryItemSha256s.length,
    "wave2b recovery plan contains duplicate item identities",
  );
  return {
    recoveryItemSha256s,
    recoveryPlanSha256: sha256(canonicalJsonBytes({
      schema: "wave2b-recovery-plan-v1",
      recoveryItemSha256s,
    })),
  };
}

async function validateBatchPaths(items, {createParents = false} = {}) {
  const canonicalPaths = new Map();
  for (const [index, item] of items.entries()) {
    validatePlanItem(item, index);
    for (const [role, memberPath] of Object.entries({
      target: item.targetPath,
      tempOwnership: item.tempOwnershipPath,
      temporary: item.tempPath,
      quarantine: item.quarantinePath,
      postArchive: item.postArchivePath,
    })) {
      const inspection = await inspectSafeParent(
        item.rootPath,
        memberPath,
        {create: createParents},
      );
      const comparisonKey = canonicalComparisonKey(
        inspection.canonicalPath,
      );
      const prior = canonicalPaths.get(comparisonKey);
      invariant(
        prior === undefined,
        `${item.id}:${role} aliases ${prior ?? "another wave2b path"}`,
      );
      for (const [priorPath, priorLabel] of canonicalPaths.entries()) {
        invariant(
          !strictPathOverlap(priorPath, comparisonKey),
          `${item.id}:${role} has an ancestor/descendant alias with ${
            priorLabel
          }`,
        );
      }
      canonicalPaths.set(comparisonKey, `${item.id}:${role}`);
    }
  }
}

async function observeItem(item) {
  const [
    target,
    tempOwnership,
    temporary,
    quarantine,
    postArchive,
  ] = await Promise.all([
    inspectRegularFile(item.targetPath),
    inspectOwnershipMarker(item.tempOwnershipPath),
    inspectRegularFile(item.tempPath),
    inspectRegularFile(item.quarantinePath),
    inspectRegularFile(item.postArchivePath),
  ]);
  return {
    target,
    tempOwnership,
    temporary,
    quarantine,
    postArchive,
  };
}

function fileRole(observed, item, allowedRoles) {
  if (observed === ABSENT) return "absent";
  if (observed.kind !== "file") return "foreign";
  if (allowedRoles.includes("pre") && sameBytes(observed, item.preimage)) {
    return "pre";
  }
  if (allowedRoles.includes("post") && sameBytes(observed, item.postimage)) {
    return "post";
  }
  return "foreign";
}

function identityGroupIsClosed(files) {
  if (files.length === 0) return true;
  const [first] = files;
  return files.every((file) =>
    file.dev === first.dev &&
    file.ino === first.ino &&
    file.nlink === files.length);
}

function classifyObservation(item, observed) {
  if (observed.tempOwnership !== ABSENT) {
    if (
      observed.tempOwnership.kind !== "ownership" ||
      observed.tempOwnership.mode !== 0o700 ||
      !exactFile(observed.target, item.preimage, {
        mode: item.originalMode,
      }) ||
      observed.quarantine !== ABSENT ||
      observed.postArchive !== ABSENT
    ) {
      return CAS_STATES.FOREIGN;
    }
    if (observed.temporary === ABSENT) {
      return CAS_STATES.TEMP_OWNERSHIP_READY;
    }
    if (
      observed.temporary.kind !== "file" ||
      observed.temporary.nlink !== 1 ||
      ![0o600, 0o644].includes(observed.temporary.mode)
    ) {
      return CAS_STATES.FOREIGN;
    }
    return sameBytes(observed.temporary, item.postimage)
      ? CAS_STATES.OWNED_TEMP_COMPLETE
      : CAS_STATES.OWNED_TEMP_PARTIAL;
  }

  const roles = {
    target: fileRole(observed.target, item, ["pre", "post"]),
    temporary: fileRole(observed.temporary, item, ["post"]),
    quarantine: fileRole(observed.quarantine, item, ["pre"]),
    postArchive: fileRole(observed.postArchive, item, ["post"]),
  };
  if (Object.values(roles).includes("foreign")) return CAS_STATES.FOREIGN;

  const preFiles = Object.entries(roles)
    .filter(([, role]) => role === "pre")
    .map(([name]) => observed[name]);
  const postFiles = Object.entries(roles)
    .filter(([, role]) => role === "post")
    .map(([name]) => observed[name]);
  if (
    preFiles.length === 0 ||
    !identityGroupIsClosed(preFiles) ||
    !identityGroupIsClosed(postFiles)
  ) {
    return CAS_STATES.FOREIGN;
  }
  if (!preFiles.every((file) =>
    file.mode === item.originalMode || file.mode === 0o444)) {
    return CAS_STATES.FOREIGN;
  }
  const hasActivePost =
    roles.target === "post" || roles.temporary === "post";
  if (!postFiles.every((file) =>
    file.mode === 0o644 ||
      (!hasActivePost && file.mode === 0o444))) {
    return CAS_STATES.FOREIGN;
  }

  const signature = [
    roles.target,
    roles.temporary,
    roles.quarantine,
    roles.postArchive,
  ].join("|");
  if (roles.postArchive === "absent") {
    if (
      signature === "pre|absent|absent|absent" &&
      exactFile(observed.target, item.preimage, {
        mode: item.originalMode,
      })
    ) return CAS_STATES.PREIMAGE;
    if (
      signature === "pre|post|absent|absent" &&
      observed.target.mode === item.originalMode
    ) return CAS_STATES.TEMP_READY;
    if (
      signature === "pre|post|pre|absent" &&
      observed.target.mode === item.originalMode
    ) return CAS_STATES.PREIMAGE_QUARANTINE_LINKED;
    if (
      signature === "absent|post|pre|absent" &&
      observed.quarantine.mode === item.originalMode
    ) return CAS_STATES.TARGET_QUARANTINED;
    if (
      signature === "post|post|pre|absent" &&
      observed.quarantine.mode === item.originalMode
    ) return CAS_STATES.TARGET_LINKED;
    if (
      signature === "post|absent|pre|absent" &&
      observed.quarantine.mode === item.originalMode
    ) return CAS_STATES.TEMP_UNLINKED;
    if (signature === "post|absent|pre|absent") {
      return CAS_STATES.QUARANTINE_FROZEN;
    }
    return CAS_STATES.FOREIGN;
  }

  if (hasActivePost) return CAS_STATES.RECOVERY_POST_LINKED;
  if (signature === "absent|absent|pre|post") {
    return CAS_STATES.RECOVERY_POST_ARCHIVED;
  }
  if (signature === "pre|absent|pre|post") {
    return CAS_STATES.RECOVERY_PREIMAGE_LINKED;
  }
  if (signature === "pre|absent|absent|post") {
    if (
      observed.target.mode === item.originalMode &&
      observed.postArchive.mode === 0o444
    ) return CAS_STATES.RECOVERED;
    return CAS_STATES.RECOVERY_FINALIZE;
  }
  return CAS_STATES.FOREIGN;
}

export async function inspectWave2bCasItem(item, index = 0) {
  validatePlanItem(item, index);
  await validateBatchPaths([item]);
  const observed = await observeItem(item);
  return {
    id: item.id,
    index,
    state: classifyObservation(item, observed),
    paths: {
      targetPath: item.targetPath,
      tempOwnershipPath: item.tempOwnershipPath,
      tempPath: item.tempPath,
      quarantinePath: item.quarantinePath,
      postArchivePath: item.postArchivePath,
    },
    observed: Object.fromEntries(
      Object.entries(observed).map(([key, value]) =>
        [key, publicObservation(value)]),
    ),
  };
}

async function assertState(item, expected, index) {
  const inspection = await inspectWave2bCasItem(item, index);
  invariant(
    inspection.state === expected ||
      (expected === CAS_STATES.VERIFIED &&
        inspection.state === CAS_STATES.QUARANTINE_FROZEN),
    `${item.id}: expected ${expected}, observed ${inspection.state}`,
  );
  return {
    ...inspection,
    state: expected,
  };
}

async function record(journal, event, item, index, {
  state = null,
  inspection = null,
} = {}) {
  if (!journal) return;
  await journal({
    event,
    id: item.id,
    index,
    state,
    paths: {
      targetPath: item.targetPath,
      tempOwnershipPath: item.tempOwnershipPath,
      tempPath: item.tempPath,
      quarantinePath: item.quarantinePath,
      postArchivePath: item.postArchivePath,
    },
    ...(inspection ? {observed: inspection.observed} : {}),
  });
}

function inspectionSnapshot(inspection) {
  invariant(
    inspection &&
      typeof inspection.state === "string" &&
      inspection.paths &&
      inspection.observed,
    "wave2b inspection snapshot is invalid",
  );
  return JSON.stringify({
    state: inspection.state === CAS_STATES.VERIFIED
      ? CAS_STATES.QUARANTINE_FROZEN
      : inspection.state,
    paths: inspection.paths,
    observed: inspection.observed,
  });
}

async function assertExactMemberSnapshot(
  item,
  index,
  expectedSnapshot,
  label,
) {
  let current;
  try {
    current = await inspectWave2bCasItem(item, index);
  } catch (cause) {
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: member snapshot could not be verified ${label}`,
      {cause},
    );
  }
  if (inspectionSnapshot(current) !== expectedSnapshot) {
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: member snapshot changed ${label}; observed ${current.state}`,
    );
  }
  return current;
}

async function captureExactMemberSnapshots(items, label) {
  const snapshots = [];
  for (const [index, item] of items.entries()) {
    const inspection = await inspectWave2bCasItem(item, index);
    invariant(
      inspection.state !== CAS_STATES.FOREIGN,
      `${item.id}: ${label} refuses foreign member state`,
    );
    snapshots.push(inspectionSnapshot(inspection));
  }
  return Object.freeze(snapshots);
}

async function assertExactMemberSnapshots(items, snapshots, label) {
  invariant(
    Array.isArray(items) &&
      Array.isArray(snapshots) &&
      items.length === snapshots.length,
    "wave2b exact member snapshot set is invalid",
  );
  for (const [index, item] of items.entries()) {
    await assertExactMemberSnapshot(
      item,
      index,
      snapshots[index],
      label,
    );
  }
}

function createBatchMemberSnapshotGuard(items, inspections) {
  invariant(
    Array.isArray(items) &&
      Array.isArray(inspections) &&
      items.length > 0 &&
      items.length === inspections.length,
    "wave2b batch member snapshot guard is invalid",
  );
  const snapshots = inspections.map((inspection) =>
    inspectionSnapshot(inspection));
  return Object.freeze({
    update(index, inspection) {
      invariant(
        Number.isSafeInteger(index) &&
          index >= 0 &&
          index < snapshots.length,
        "wave2b batch member snapshot update index is invalid",
      );
      snapshots[index] = inspectionSnapshot(inspection);
    },
    async assert(label, {excludeIndex = null} = {}) {
      invariant(
        excludeIndex === null ||
          (Number.isSafeInteger(excludeIndex) &&
            excludeIndex >= 0 &&
            excludeIndex < snapshots.length),
        "wave2b batch member snapshot exclusion is invalid",
      );
      for (const [index, item] of items.entries()) {
        if (index === excludeIndex) continue;
        await assertExactMemberSnapshot(
          item,
          index,
          snapshots[index],
          `${label} at batch index ${index}`,
        );
      }
    },
  });
}

function inspectionProjectionSnapshot(inspection, excludedRoles = []) {
  invariant(
    inspection &&
      inspection.paths &&
      inspection.observed &&
      Array.isArray(excludedRoles),
    "wave2b inspection projection snapshot is invalid",
  );
  const excluded = new Set(excludedRoles);
  return JSON.stringify({
    paths: inspection.paths,
    observed: Object.fromEntries(
      Object.entries(inspection.observed).filter(
        ([role]) => !excluded.has(role),
      ),
    ),
  });
}

async function assertExactMemberProjection(
  item,
  index,
  expectedSnapshot,
  excludedRoles,
  label,
) {
  let current;
  try {
    current = await inspectWave2bCasItem(item, index);
  } catch (cause) {
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: member projection could not be verified ${label}`,
      {cause},
    );
  }
  if (
    inspectionProjectionSnapshot(current, excludedRoles) !==
      expectedSnapshot
  ) {
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: member projection changed ${label}; observed ${
        current.state
      }`,
    );
  }
  return current;
}

async function assertOpenedTempIdentity(item, target, opened, label) {
  let metadata;
  try {
    metadata = await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Wave2bMemberSnapshotDriftError(
        `${item.id}: opened temp path disappeared ${label}`,
      );
    }
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: opened temp path could not be verified ${label}`,
      {cause: error},
    );
  }
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.dev !== opened.dev ||
    metadata.ino !== opened.ino ||
    metadata.nlink !== 1
  ) {
    throw new Wave2bMemberSnapshotDriftError(
      `${item.id}: opened temp path identity changed ${label}`,
    );
  }
}

async function awaitCallbackAndRevalidate(
  callback,
  revalidate,
  label,
) {
  let callbackFailed = false;
  let callbackError;
  let result;
  try {
    result = await callback();
  } catch (error) {
    callbackFailed = true;
    callbackError = error;
  }

  let validationFailed = false;
  let validationError;
  try {
    await revalidate();
  } catch (error) {
    validationFailed = true;
    validationError = error;
  }

  if (callbackFailed && validationFailed) {
    throw new AggregateError(
      [callbackError, validationError],
      `${label} failed and post-callback validation detected drift`,
    );
  }
  if (validationFailed) throw validationError;
  if (callbackFailed) throw callbackError;
  return result;
}

async function notifyValidatedState(
  item,
  index,
  inspection,
  state,
  hooks,
  revalidate = null,
) {
  if (hooks?.afterState) {
    await awaitCallbackAndRevalidate(
      () => hooks.afterState({
        id: item.id,
        index,
        state,
        paths: inspection.paths,
        observed: inspection.observed,
      }),
      () => revalidate?.("after afterState hook"),
      `${item.id}: afterState hook`,
    );
  }
  if (hooks?.afterValidatedState) {
    await awaitCallbackAndRevalidate(
      () => hooks.afterValidatedState({
        id: item.id,
        index,
        state,
        paths: inspection.paths,
        observed: inspection.observed,
      }),
      () => revalidate?.("after afterValidatedState hook"),
      `${item.id}: afterValidatedState hook`,
    );
  }
}

async function transition({
  operation,
  item,
  index,
  expectedBefore,
  action,
  accept,
  reportedState = null,
  journal,
  hooks,
  lock,
  batchGuard,
}) {
  const expectedBeforeSnapshot = inspectionSnapshot(expectedBefore);
  const lockOptions = lock?.kind === WAVE2B_LOCK_KIND_ADOPTED
    ? {recoveryIndexes: [index]}
    : undefined;
  await assertWave2bLock(lock, [item], lockOptions);
  await batchGuard.assert(`before ${operation} intent`);
  await assertExactMemberSnapshot(
    item,
    index,
    expectedBeforeSnapshot,
    `before ${operation} intent`,
  );
  await awaitCallbackAndRevalidate(
    () => record(journal, `${operation}-intent`, item, index),
    async () => {
      await batchGuard.assert(`during ${operation} intent`);
      await assertWave2bLock(lock, [item], lockOptions);
      await assertExactMemberSnapshot(
        item,
        index,
        expectedBeforeSnapshot,
        `during ${operation} intent`,
      );
    },
    `${item.id}: ${operation} intent journal`,
  );
  await action();
  await syncMutationDurability(item);
  const inspection = await inspectWave2bCasItem(item, index);
  invariant(
    inspection.state !== CAS_STATES.FOREIGN &&
      accept(inspection.state, inspection),
    `${item.id}: ${operation} produced ${inspection.state}`,
  );
  await batchGuard.assert(
    `after ${operation} action`,
    {excludeIndex: index},
  );
  batchGuard.update(index, inspection);
  const validatedSnapshot = inspectionSnapshot(inspection);
  await assertWave2bLock(lock, [item], lockOptions);
  await batchGuard.assert(`before ${operation} validated callbacks`);
  const state = reportedState ?? inspection.state;
  const revalidate = async (label) => {
    await batchGuard.assert(`${label} for ${operation}`);
    await assertWave2bLock(lock, [item], lockOptions);
    return assertExactMemberSnapshot(
      item,
      index,
      validatedSnapshot,
      `${label} for ${operation}`,
    );
  };
  await awaitCallbackAndRevalidate(
    () => record(
      journal,
      `${operation}-state-validated`,
      item,
      index,
      {state, inspection},
    ),
    () => revalidate(
      `during ${operation} state-validated journal`,
    ),
    `${item.id}: ${operation} state-validated journal`,
  );
  await notifyValidatedState(
    item,
    index,
    inspection,
    state,
    hooks,
    revalidate,
  );
  return revalidate(`after ${operation} callbacks`);
}

async function writeNoReplace(item, target, bytes, mode, {
  hooks = null,
  index = null,
  batchGuard,
} = {}) {
  await batchGuard.assert("before temp path creation");
  const beforeOpen = await inspectWave2bCasItem(item, index);
  const stableProjection = inspectionProjectionSnapshot(
    beforeOpen,
    ["temporary"],
  );
  await inspectSafeParent(item.rootPath, target, {create: true});
  const handle = await open(target, "wx", 0o600);
  const handleStat = handle.stat.bind(handle);
  const handleSync = handle.sync.bind(handle);
  const handleChmod = handle.chmod.bind(handle);
  const handleWriteFile = handle.writeFile.bind(handle);
  const writeTempFile = hooks?.writeTempFile ?? null;
  const afterTempHandleClose = hooks?.afterTempHandleClose ?? null;
  invariant(
    writeTempFile === null || typeof writeTempFile === "function",
    `${item.id}: writeTempFile hook must be a function`,
  );
  invariant(
    afterTempHandleClose === null ||
      typeof afterTempHandleClose === "function",
    `${item.id}: afterTempHandleClose hook must be a function`,
  );
  let opened = null;
  let writeError = null;
  let revalidateWriteCallback = null;
  try {
    await withHandleClosePreservingError(
      handle,
      async () => {
        opened = await handleStat();
        revalidateWriteCallback = async (label) => {
          await batchGuard.assert(label, {excludeIndex: index});
          await assertExactMemberProjection(
            item,
            index,
            stableProjection,
            ["temporary"],
            label,
          );
          await assertOpenedTempIdentity(
            item,
            target,
            opened,
            label,
          );
        };
        if (writeTempFile !== null) {
          await revalidateWriteCallback("before writeTempFile hook");
          await awaitCallbackAndRevalidate(
            () => writeTempFile({
              handle,
              bytes: Buffer.from(bytes),
              id: item.id,
              index,
              target,
            }),
            () => revalidateWriteCallback("after writeTempFile hook"),
            `${item.id}: writeTempFile hook`,
          );
        } else {
          await handleWriteFile(bytes);
        }
        await handleSync();
        await handleChmod(mode);
        await handleSync();
        const finalized = await handleStat();
        if (
          finalized.dev !== opened.dev ||
          finalized.ino !== opened.ino ||
          finalized.nlink !== 1 ||
          modeBits(finalized) !== mode
        ) {
          throw new Wave2bMemberSnapshotDriftError(
            `${item.id}: opened temp inode changed before finalization`,
          );
        }
      },
      `${item.id}: temp write and handle close both failed`,
      {
        afterClose: afterTempHandleClose === null
          ? null
          : () => afterTempHandleClose(Object.freeze({
            id: item.id,
            index,
            target,
          })),
      },
    );
  } catch (error) {
    writeError = error;
  }
  if (opened !== null && revalidateWriteCallback !== null) {
    try {
      await revalidateWriteCallback("after temp handle close");
    } catch (validationError) {
      const primaryMessage =
        writeError?.message ?? validationError.message;
      writeError = preservePrimaryError(
        writeError,
        validationError,
        `${item.id}: temp close validation failed; ${primaryMessage}`,
      );
    }
  }
  if (writeError && opened === null) throw writeError;
  if (!writeError) {
    try {
      const observed = await inspectRegularFile(target);
      if (
        !exactFile(observed, {
          bytes: bytes.length,
          sha256: sha256(bytes),
        }, {mode, nlink: 1}) ||
        !observed.contents.equals(bytes) ||
        observed.dev !== opened.dev ||
        observed.ino !== opened.ino
      ) {
        throw new Wave2bMemberSnapshotDriftError(
          `${item.id}: finalized temp path differs from its opened inode`,
        );
      }
      return;
    } catch (error) {
      writeError = error;
    }
  }
  if (writeError) {
    let pathMetadata;
    try {
      pathMetadata = await lstat(target);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw preservePrimaryError(
          writeError,
          error,
          `${item.id}: temp cleanup inspection failed`,
        );
      }
      pathMetadata = null;
    }
    if (
      pathMetadata &&
      pathMetadata.isFile() &&
      !pathMetadata.isSymbolicLink() &&
      pathMetadata.dev === opened.dev &&
      pathMetadata.ino === opened.ino &&
      pathMetadata.nlink === 1
    ) {
      try {
        await unlink(target);
        await syncDirectory(path.dirname(target));
      } catch (cleanupError) {
        throw preservePrimaryError(
          writeError,
          cleanupError,
          `${item.id}: owned temp cleanup failed`,
        );
      }
    } else if (pathMetadata) {
      const driftError = new Wave2bMemberSnapshotDriftError(
        `${item.id}: partial temp write identity changed; cleanup refused`,
      );
      throw new AggregateError(
        [writeError, driftError],
        `${item.id}: partial temp write identity changed; cleanup refused`,
      );
    }
    throw writeError;
  }
}

async function installOne(
  item,
  index,
  {hooks, journal, lock, batchGuard},
) {
  const runTransition = (options) =>
    transition({...options, lock, batchGuard});
  let inspection = await assertState(item, CAS_STATES.PREIMAGE, index);
  await batchGuard.assert(`${item.id} before install`);

  inspection = await runTransition({
    operation: "temp-ownership-marker-create",
    item,
    index,
    expectedBefore: inspection,
    action: async () => {
      await inspectSafeParent(item.rootPath, item.tempOwnershipPath, {
        create: true,
      });
      await mkdir(item.tempOwnershipPath, {
        recursive: false,
        mode: 0o700,
      });
      await chmod(item.tempOwnershipPath, 0o700);
    },
    accept: (state) => state === CAS_STATES.TEMP_OWNERSHIP_READY,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "temp-write",
    item,
    index,
    expectedBefore: inspection,
    action: () => writeNoReplace(
      item,
      item.tempPath,
      item.postBytes,
      0o644,
      {hooks, index, batchGuard},
    ),
    accept: (state) => state === CAS_STATES.OWNED_TEMP_COMPLETE,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "temp-ownership-marker-release",
    item,
    index,
    expectedBefore: inspection,
    action: () => rmdir(item.tempOwnershipPath),
    accept: (state) => state === CAS_STATES.TEMP_READY,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "preimage-quarantine-link",
    item,
    index,
    expectedBefore: inspection,
    action: async () => {
      await inspectSafeParent(item.rootPath, item.quarantinePath, {
        create: true,
      });
      await link(item.targetPath, item.quarantinePath);
    },
    accept: (state) => state === CAS_STATES.PREIMAGE_QUARANTINE_LINKED,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "target-preimage-unlink",
    item,
    index,
    expectedBefore: inspection,
    action: () => unlink(item.targetPath),
    accept: (state) => state === CAS_STATES.TARGET_QUARANTINED,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "postimage-target-link",
    item,
    index,
    expectedBefore: inspection,
    action: () => link(item.tempPath, item.targetPath),
    accept: (state) => state === CAS_STATES.TARGET_LINKED,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "temp-postimage-unlink",
    item,
    index,
    expectedBefore: inspection,
    action: () => unlink(item.tempPath),
    accept: (state) => state === CAS_STATES.TEMP_UNLINKED,
    journal,
    hooks,
  });
  inspection = await runTransition({
    operation: "quarantine-freeze",
    item,
    index,
    expectedBefore: inspection,
    action: () => chmod(item.quarantinePath, 0o444),
    accept: (state) => state === CAS_STATES.QUARANTINE_FROZEN,
    journal,
    hooks,
  });

  await assertWave2bLock(lock, [item]);
  await batchGuard.assert("before final-verify intent");
  const finalIntentSnapshot = inspectionSnapshot(inspection);
  await awaitCallbackAndRevalidate(
    () => record(journal, "final-verify-intent", item, index),
    async () => {
      await batchGuard.assert("during final-verify intent");
      await assertWave2bLock(lock, [item]);
      await assertExactMemberSnapshot(
        item,
        index,
        finalIntentSnapshot,
        "during final-verify intent",
      );
    },
    `${item.id}: final-verify intent journal`,
  );
  await syncMutationDurability(item);
  const verified = await assertState(item, CAS_STATES.VERIFIED, index);
  batchGuard.update(index, verified);
  const verifiedSnapshot = inspectionSnapshot(verified);
  await assertWave2bLock(lock, [item]);
  await batchGuard.assert("before final-verify validated callbacks");
  const revalidate = async (label) => {
    await batchGuard.assert(`${label} for final-verify`);
    await assertWave2bLock(lock, [item]);
    await assertExactMemberSnapshot(
      item,
      index,
      verifiedSnapshot,
      `${label} for final-verify`,
    );
  };
  await awaitCallbackAndRevalidate(
    () => record(
      journal,
      "final-verify-state-validated",
      item,
      index,
      {state: CAS_STATES.VERIFIED, inspection: verified},
    ),
    () => revalidate(
      "during final-verify state-validated journal",
    ),
    `${item.id}: final-verify state-validated journal`,
  );
  await notifyValidatedState(
    item,
    index,
    verified,
    CAS_STATES.VERIFIED,
    hooks,
    revalidate,
  );
  await revalidate("after final-verify callbacks");
}

async function classifyBatch(items) {
  await validateBatchPaths(items);
  const analyses = [];
  for (const [index, item] of items.entries()) {
    const inspection = await inspectWave2bCasItem(item, index);
    analyses.push({item, index, inspection});
  }
  const foreign = analyses.filter(
    ({inspection}) => inspection.state === CAS_STATES.FOREIGN,
  );
  if (foreign.length > 0) {
    throw new AggregateError(
      foreign.map(({item, inspection}) =>
        new Error(
          `${item.id}: foreign wave2b CAS state ${JSON.stringify(inspection.observed)}`,
        )),
      "wave2b recovery refused foreign filesystem drift without mutation",
    );
  }
  return analyses;
}

function publicRole(observed, descriptor) {
  if (observed.kind === "absent") return "absent";
  if (
    observed.kind === "file" &&
    observed.bytes === descriptor.bytes &&
    observed.sha256 === descriptor.sha256
  ) return "match";
  return "foreign";
}

function knownRecoveryState(state) {
  return state !== CAS_STATES.FOREIGN &&
    state !== CAS_STATES.PREIMAGE;
}

async function recoverOne(
  item,
  index,
  journal,
  hooks,
  lock,
  batchGuard,
) {
  const runTransition = (options) =>
    transition({...options, lock, batchGuard});
  const lockOptions = lock?.kind === WAVE2B_LOCK_KIND_ADOPTED
    ? {recoveryIndexes: [index]}
    : undefined;
  const validateTerminalJournal = async (
    event,
    state,
    inspection,
  ) => {
    const expectedSnapshot = inspectionSnapshot(inspection);
    await assertWave2bLock(lock, [item], lockOptions);
    await batchGuard.assert(`before ${event} journal`);
    await awaitCallbackAndRevalidate(
      () => record(
        journal,
        event,
        item,
        index,
        {state, inspection},
      ),
      async () => {
        await batchGuard.assert(`during ${event} journal`);
        await assertWave2bLock(lock, [item], lockOptions);
        await assertExactMemberSnapshot(
          item,
          index,
          expectedSnapshot,
          `during ${event} journal`,
        );
      },
      `${item.id}: ${event} journal`,
    );
  };
  let inspection = await inspectWave2bCasItem(item, index);
  await batchGuard.assert(`${item.id} before recovery`);
  if (inspection.state === CAS_STATES.PREIMAGE) {
    await syncMutationDurability(item);
    await validateTerminalJournal(
      "recovered-preimage-state-validated",
      CAS_STATES.PREIMAGE,
      inspection,
    );
    return false;
  }
  if (inspection.state === CAS_STATES.RECOVERED) {
    await syncMutationDurability(item);
    await validateTerminalJournal(
      "recovered-state-validated",
      CAS_STATES.RECOVERED,
      inspection,
    );
    return false;
  }
  const recoveryIntentSnapshot = inspectionSnapshot(inspection);
  await assertWave2bLock(lock, [item], lockOptions);
  await batchGuard.assert("before recovery-intent journal");
  await assertExactMemberSnapshot(
    item,
    index,
    recoveryIntentSnapshot,
    "before recovery-intent journal",
  );
  await awaitCallbackAndRevalidate(
    () => record(
      journal,
      "recovery-intent",
      item,
      index,
      {state: inspection.state, inspection},
    ),
    async () => {
      await batchGuard.assert("during recovery-intent journal");
      await assertWave2bLock(lock, [item], lockOptions);
      await assertExactMemberSnapshot(
        item,
        index,
        recoveryIntentSnapshot,
        "during recovery-intent journal",
      );
    },
    `${item.id}: recovery-intent journal`,
  );

  for (let step = 0; step < 16; step += 1) {
    inspection = await inspectWave2bCasItem(item, index);
    invariant(
      inspection.state !== CAS_STATES.FOREIGN,
      `${item.id}: recovery encountered foreign drift`,
    );
    if (inspection.state === CAS_STATES.RECOVERED) {
      await syncMutationDurability(item);
      await validateTerminalJournal(
        "recovered-state-validated",
        CAS_STATES.RECOVERED,
        inspection,
      );
      return true;
    }
    if (inspection.state === CAS_STATES.PREIMAGE) {
      await syncMutationDurability(item);
      await validateTerminalJournal(
        "recovered-preimage-state-validated",
        CAS_STATES.PREIMAGE,
        inspection,
      );
      return true;
    }
    if (inspection.state === CAS_STATES.OWNED_TEMP_PARTIAL) {
      inspection = await runTransition({
        operation: "recovery-owned-partial-temp-unlink",
        item,
        index,
        expectedBefore: inspection,
        action: () => unlink(item.tempPath),
        accept: (state) => state === CAS_STATES.TEMP_OWNERSHIP_READY,
        journal,
        hooks,
      });
      continue;
    }
    if (inspection.state === CAS_STATES.OWNED_TEMP_COMPLETE) {
      if (inspection.observed.temporary.mode !== 0o644) {
        inspection = await runTransition({
          operation: "recovery-owned-temp-mode-normalize",
          item,
          index,
          expectedBefore: inspection,
          action: () => chmod(item.tempPath, 0o644),
          accept: (state) => state === CAS_STATES.OWNED_TEMP_COMPLETE,
          journal,
          hooks,
        });
      } else {
        inspection = await runTransition({
          operation: "recovery-temp-ownership-marker-release",
          item,
          index,
          expectedBefore: inspection,
          action: () => rmdir(item.tempOwnershipPath),
          accept: (state) => state === CAS_STATES.TEMP_READY,
          journal,
          hooks,
        });
      }
      continue;
    }
    if (inspection.state === CAS_STATES.TEMP_OWNERSHIP_READY) {
      inspection = await runTransition({
        operation: "recovery-empty-temp-ownership-marker-release",
        item,
        index,
        expectedBefore: inspection,
        action: () => rmdir(item.tempOwnershipPath),
        accept: (state) => state === CAS_STATES.PREIMAGE,
        journal,
        hooks,
      });
      continue;
    }

    const targetPost =
      publicRole(inspection.observed.target, item.postimage) === "match";
    const targetPre =
      publicRole(inspection.observed.target, item.preimage) === "match";
    const tempPost =
      publicRole(inspection.observed.temporary, item.postimage) === "match";
    const quarantinePre =
      publicRole(inspection.observed.quarantine, item.preimage) === "match";
    const archivePost =
      publicRole(inspection.observed.postArchive, item.postimage) === "match";

    if (!archivePost) {
      const sourcePath = tempPost
        ? item.tempPath
        : targetPost
          ? item.targetPath
          : null;
      invariant(sourcePath, `${item.id}: recovery has no postimage source`);
      inspection = await runTransition({
        operation: "recovery-post-archive-link",
        item,
        index,
        expectedBefore: inspection,
        action: async () => {
          await inspectSafeParent(item.rootPath, item.postArchivePath, {
            create: true,
          });
          await link(sourcePath, item.postArchivePath);
        },
        accept: (state) => state === CAS_STATES.RECOVERY_POST_LINKED,
        journal,
        hooks,
      });
      continue;
    }
    if (targetPost) {
      inspection = await runTransition({
        operation: "recovery-target-post-unlink",
        item,
        index,
        expectedBefore: inspection,
        action: () => unlink(item.targetPath),
        accept: knownRecoveryState,
        journal,
        hooks,
      });
      continue;
    }
    if (tempPost) {
      inspection = await runTransition({
        operation: "recovery-temp-post-unlink",
        item,
        index,
        expectedBefore: inspection,
        action: () => unlink(item.tempPath),
        accept: knownRecoveryState,
        journal,
        hooks,
      });
      continue;
    }
    if (inspection.observed.postArchive.mode !== 0o444) {
      inspection = await runTransition({
        operation: "recovery-post-archive-freeze",
        item,
        index,
        expectedBefore: inspection,
        action: () => chmod(item.postArchivePath, 0o444),
        accept: knownRecoveryState,
        journal,
        hooks,
      });
      continue;
    }
    if (!targetPre && quarantinePre) {
      inspection = await runTransition({
        operation: "recovery-preimage-target-link",
        item,
        index,
        expectedBefore: inspection,
        action: () => link(item.quarantinePath, item.targetPath),
        accept: (state) =>
          state === CAS_STATES.RECOVERY_PREIMAGE_LINKED,
        journal,
        hooks,
      });
      continue;
    }
    if (targetPre && quarantinePre) {
      inspection = await runTransition({
        operation: "recovery-quarantine-preimage-unlink",
        item,
        index,
        expectedBefore: inspection,
        action: () => unlink(item.quarantinePath),
        accept: knownRecoveryState,
        journal,
        hooks,
      });
      continue;
    }
    if (targetPre && inspection.observed.target.mode !== item.originalMode) {
      inspection = await runTransition({
        operation: "recovery-preimage-mode-restore",
        item,
        index,
        expectedBefore: inspection,
        action: () => chmod(item.targetPath, item.originalMode),
        accept: (state) => state === CAS_STATES.RECOVERED,
        journal,
        hooks,
      });
      continue;
    }
    invariant(false, `${item.id}: recovery made no progress from ${
      inspection.state
    }`);
  }
  throw new Error(`${item.id}: recovery exceeded the bounded transition count`);
}

export async function recoverWave2bCasBatch({
  items,
  journal = null,
  hooks = null,
  lock = null,
} = {}) {
  invariant(Array.isArray(items) && items.length > 0,
    "wave2b recovery requires plan items");
  invariant(
    typeof journal === "function",
    "wave2b recovery requires a durable journal callback",
  );
  const planItems = clonePlanItems(items);
  const exactRecoveryOptions = lock?.kind === WAVE2B_LOCK_KIND_ADOPTED
    ? {requireExactRecoveryPlan: true}
    : undefined;
  await assertWave2bLock(lock, planItems, exactRecoveryOptions);
  await classifyBatch(planItems);
  await validateBatchPaths(planItems, {createParents: true});
  await assertWave2bLock(lock, planItems, exactRecoveryOptions);
  const guardedAnalyses = await classifyBatch(planItems);
  const batchGuard = createBatchMemberSnapshotGuard(
    planItems,
    guardedAnalyses.map(({inspection}) => inspection),
  );
  let restoredCount = 0;
  for (const {item, index} of [...guardedAnalyses].reverse()) {
    if (
      await recoverOne(
        item,
        index,
        journal,
        hooks,
        lock,
        batchGuard,
      )
    ) {
      restoredCount += 1;
    }
  }
  for (const [index, item] of planItems.entries()) {
    const inspection = await inspectWave2bCasItem(item, index);
    invariant(
      inspection.state === CAS_STATES.PREIMAGE ||
        inspection.state === CAS_STATES.RECOVERED,
      `${item.id}: recovery left ${inspection.state}`,
    );
  }
  await batchGuard.assert("before recovery completion");
  await assertWave2bLock(lock, planItems, exactRecoveryOptions);
  return {
    restoredCount,
    itemCount: planItems.length,
    foreignCount: 0,
  };
}

export async function applyWave2bCasBatch({
  items,
  hooks = null,
  journal = null,
  lock = null,
  leaveInterruptedForTest = false,
} = {}) {
  invariant(Array.isArray(items) && items.length > 0,
    "wave2b apply requires plan items");
  invariant(
    typeof journal === "function",
    "wave2b apply requires a durable journal callback",
  );
  const lockBinding = validateRuntimeLockDescriptor(lock);
  invariant(
    lockBinding.kind === WAVE2B_LOCK_KIND_ACQUIRED,
    "wave2b recovery-adopted lock is recovery-only and cannot authorize apply",
  );
  const planItems = clonePlanItems(items);
  await assertWave2bLock(lock, planItems);
  const preflight = await classifyBatch(planItems);
  invariant(
    preflight.every(({inspection}) =>
      inspection.state === CAS_STATES.PREIMAGE),
    "wave2b apply requires every item at the exact preimage state",
  );
  await validateBatchPaths(planItems, {createParents: true});
  await assertWave2bLock(lock, planItems);
  const secondPreflight = await classifyBatch(planItems);
  invariant(
    secondPreflight.every(({inspection}) =>
      inspection.state === CAS_STATES.PREIMAGE),
    "wave2b preimage changed while preparing safe parents",
  );
  const batchGuard = createBatchMemberSnapshotGuard(
    planItems,
    secondPreflight.map(({inspection}) => inspection),
  );
  try {
    for (const [index, item] of planItems.entries()) {
      await installOne(
        item,
        index,
        {hooks, journal, lock, batchGuard},
      );
    }
    for (const [index, item] of planItems.entries()) {
      await assertState(item, CAS_STATES.VERIFIED, index);
    }
    await batchGuard.assert("before apply completion");
    await assertWave2bLock(lock, planItems);
    return {
      installedCount: planItems.length,
      itemCount: planItems.length,
    };
  } catch (error) {
    if (
      leaveInterruptedForTest ||
      containsMemberSnapshotDrift(error)
    ) throw error;
    try {
      const recovered = await recoverWave2bCasBatch({
        items: planItems,
        journal,
        lock,
      });
      throw new AggregateError(
        [error],
        `wave2b CAS failed and restored ${recovered.restoredCount} item(s)`,
      );
    } catch (recoveryError) {
      if (
        recoveryError instanceof AggregateError &&
        recoveryError.errors?.[0] === error
      ) {
        throw recoveryError;
      }
      throw new AggregateError(
        [error, recoveryError],
        "wave2b CAS failed and recovery preserved a conflict",
      );
    }
  }
}

export function safeWave2bRelative(value) {
  const segments = typeof value === "string" ? value.split("/") : [];
  invariant(
    typeof value === "string" &&
      value.length > 0 &&
      !path.isAbsolute(value) &&
      path.posix.normalize(value) === value &&
      segments.every((segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== "..") &&
      !value.startsWith("../") &&
      !value.includes("/../") &&
      !value.includes("\0"),
    `wave2b path is not a normalized project-relative path: ${value}`,
  );
  return value;
}

async function inspectLockDirectory(rootPath, lockPath, {
  expectedEntries = [WAVE2B_OWNER_ENTRY],
} = {}) {
  relativeWithin(rootPath, lockPath, "wave2b lock path");
  await inspectSafeParent(rootPath, path.join(lockPath, WAVE2B_OWNER_ENTRY));
  invariant(
    Array.isArray(expectedEntries) &&
      expectedEntries.every((entry) =>
        typeof entry === "string" &&
        entry.length > 0 &&
        !entry.includes(path.sep)),
    "wave2b lock expected entries are invalid",
  );
  const before = await lstat(lockPath);
  invariant(
    before.isDirectory() &&
      !before.isSymbolicLink() &&
      modeBits(before) === 0o700,
    "wave2b lock directory identity or mode changed",
  );
  const entries = (await readdir(lockPath)).sort();
  const after = await lstat(lockPath);
  invariant(
    after.isDirectory() &&
      !after.isSymbolicLink() &&
      modeBits(after) === 0o700 &&
      before.dev === after.dev &&
      before.ino === after.ino,
    "wave2b lock directory identity or mode changed",
  );
  const sortedExpectedEntries = [...expectedEntries].sort();
  invariant(
    entries.length === sortedExpectedEntries.length &&
      entries.every((entry, index) =>
        entry === sortedExpectedEntries[index]),
    "wave2b lock directory entries changed",
  );
  return after;
}

function exactObjectKeys(value, expectedKeys) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().every(
      (key, index) => key === [...expectedKeys].sort()[index],
    ) &&
    Object.keys(value).length === expectedKeys.length;
}

function deepFreeze(value) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function cloneJsonObject(value, label) {
  let encoded;
  try {
    encoded = JSON.stringify(value);
  } catch (error) {
    throw new Error(`${label} must be JSON serializable`, {cause: error});
  }
  invariant(
    typeof encoded === "string",
    `${label} must be JSON serializable`,
  );
  const cloned = JSON.parse(encoded);
  invariant(
    cloned !== null &&
      typeof cloned === "object" &&
      !Array.isArray(cloned),
    `${label} must be a JSON object`,
  );
  return cloned;
}

function canonicalJsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`);
}

function canonicalBase64(value, label) {
  invariant(
    typeof value === "string" &&
      value.length > 0 &&
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u
        .test(value),
    `${label} is not canonical base64`,
  );
  const bytes = Buffer.from(value, "base64");
  invariant(
    bytes.length > 0 && bytes.toString("base64") === value,
    `${label} is not canonical base64`,
  );
  return bytes;
}

function canonicalJsonObjectFromBytes(bytes, label, expectedKeys) {
  invariant(
    Buffer.isBuffer(bytes) &&
      bytes.length > 1 &&
      bytes.at(-1) === 0x0a,
    `${label} must be newline-terminated canonical JSON`,
  );
  let parsed;
  try {
    parsed = JSON.parse(bytes.subarray(0, -1).toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, {cause: error});
  }
  invariant(
    exactObjectKeys(parsed, expectedKeys) &&
      canonicalJsonBytes(parsed).equals(bytes),
    `${label} is not canonical JSON with the expected fields`,
  );
  return parsed;
}

const ACQUIRED_BINDING_KEYS = Object.freeze([
  "schema",
  "kind",
  "rootPath",
  "rootRealPath",
  "rootDev",
  "rootIno",
  "lockPath",
  "lockRealPath",
  "transactionId",
  "acquisitionId",
  "ownerBytesBase64",
  "ownerSha256",
  "directoryDev",
  "directoryIno",
  "ownerDev",
  "ownerIno",
  "descriptorSha256",
]);

const ADOPTED_BINDING_KEYS = Object.freeze([
  ...ACQUIRED_BINDING_KEYS.filter((key) =>
    key !== "descriptorSha256"),
  "recoveryAdoptionId",
  "recoveryAdoptionBytesBase64",
  "recoveryAdoptionSha256",
  "recoveryAdoptionDev",
  "recoveryAdoptionIno",
  "recoveryPlanSha256",
  "recoveryItemSha256s",
  "descriptorSha256",
]);

function bindingKeysForKind(kind) {
  if (kind === WAVE2B_LOCK_KIND_ACQUIRED) return ACQUIRED_BINDING_KEYS;
  if (kind === WAVE2B_LOCK_KIND_ADOPTED) return ADOPTED_BINDING_KEYS;
  invariant(false, "wave2b lock binding kind is invalid");
}

function bindingFingerprint(binding) {
  const payload = {};
  for (const key of bindingKeysForKind(binding.kind)) {
    if (key !== "descriptorSha256") payload[key] = binding[key];
  }
  return sha256(canonicalJsonBytes(payload));
}

function validateOwnerRecord(ownerBytes, binding) {
  const ownerRecord = canonicalJsonObjectFromBytes(
    ownerBytes,
    "wave2b lock owner bytes",
    ["schema", "acquisitionId", "transactionId", "owner"],
  );
  invariant(
    ownerRecord.schema === WAVE2B_LOCK_OWNER_SCHEMA &&
      ownerRecord.acquisitionId === binding.acquisitionId &&
      ownerRecord.transactionId === binding.transactionId &&
      ownerRecord.owner !== null &&
      typeof ownerRecord.owner === "object" &&
      !Array.isArray(ownerRecord.owner) &&
      ownerRecord.owner.transactionId === binding.transactionId,
    "wave2b lock owner record does not match its persisted binding",
  );
  return ownerRecord;
}

function validateRecoveryAdoptionRecord(adoptionBytes, binding) {
  const adoptionRecord = canonicalJsonObjectFromBytes(
    adoptionBytes,
    "wave2b recovery-adoption bytes",
    [
      "schema",
      "recoveryAdoptionId",
      "transactionId",
      "acquisitionId",
      "priorDescriptorSha256",
      "ownerSha256",
      "recoveryPlanSha256",
    ],
  );
  const acquiredView = {};
  for (const key of ACQUIRED_BINDING_KEYS) {
    if (key === "descriptorSha256") continue;
    acquiredView[key] = key === "kind"
      ? WAVE2B_LOCK_KIND_ACQUIRED
      : binding[key];
  }
  invariant(
    adoptionRecord.schema === WAVE2B_RECOVERY_ADOPTION_SCHEMA &&
      adoptionRecord.recoveryAdoptionId === binding.recoveryAdoptionId &&
      adoptionRecord.transactionId === binding.transactionId &&
      adoptionRecord.acquisitionId === binding.acquisitionId &&
      adoptionRecord.ownerSha256 === binding.ownerSha256 &&
      adoptionRecord.recoveryPlanSha256 === binding.recoveryPlanSha256 &&
      adoptionRecord.priorDescriptorSha256 ===
        bindingFingerprint(acquiredView),
    "wave2b recovery-adoption record does not match its persisted binding",
  );
  return adoptionRecord;
}

function cloneAndValidatePersistedBinding(value, {
  requiredKind = null,
} = {}) {
  const binding = cloneJsonObject(
    value,
    "wave2b persisted lock binding",
  );
  invariant(
    binding.schema === WAVE2B_LOCK_BINDING_SCHEMA &&
      (binding.kind === WAVE2B_LOCK_KIND_ACQUIRED ||
        binding.kind === WAVE2B_LOCK_KIND_ADOPTED) &&
      (requiredKind === null || binding.kind === requiredKind) &&
      exactObjectKeys(binding, bindingKeysForKind(binding.kind)),
    "wave2b persisted lock binding schema, kind, or fields are invalid",
  );
  normalizedAbsolute(binding.rootPath, "wave2b lock binding rootPath");
  normalizedAbsolute(
    binding.rootRealPath,
    "wave2b lock binding rootRealPath",
  );
  normalizedAbsolute(binding.lockPath, "wave2b lock binding lockPath");
  normalizedAbsolute(
    binding.lockRealPath,
    "wave2b lock binding lockRealPath",
  );
  relativeWithin(
    binding.rootPath,
    binding.lockPath,
    "wave2b lock binding lockPath",
  );
  invariant(
    insideRealRoot(binding.rootRealPath, binding.lockRealPath),
    "wave2b lock binding real path escapes its bound root",
  );
  invariant(
    typeof binding.transactionId === "string" &&
      binding.transactionId.length > 0 &&
      binding.transactionId.length <= 512 &&
      !binding.transactionId.includes("\0") &&
      /^[a-f0-9]{64}$/u.test(binding.acquisitionId ?? "") &&
      [
        binding.rootDev,
        binding.rootIno,
        binding.directoryDev,
        binding.directoryIno,
        binding.ownerDev,
        binding.ownerIno,
      ].every((identity) => /^(?:0|[1-9][0-9]*)$/u.test(identity ?? "")) &&
      /^[a-f0-9]{64}$/u.test(binding.ownerSha256 ?? "") &&
      /^[a-f0-9]{64}$/u.test(binding.descriptorSha256 ?? ""),
    "wave2b persisted lock binding identity fields are invalid",
  );
  const ownerBytes = canonicalBase64(
    binding.ownerBytesBase64,
    "wave2b ownerBytesBase64",
  );
  invariant(
    sha256(ownerBytes) === binding.ownerSha256,
    "wave2b persisted owner bytes do not match ownerSha256",
  );
  validateOwnerRecord(ownerBytes, binding);

  if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
    invariant(
      /^[a-f0-9]{64}$/u.test(binding.recoveryAdoptionId ?? "") &&
        /^[a-f0-9]{64}$/u.test(
          binding.recoveryAdoptionSha256 ?? "",
        ) &&
        /^(?:0|[1-9][0-9]*)$/u.test(
          binding.recoveryAdoptionDev ?? "",
        ) &&
        /^(?:0|[1-9][0-9]*)$/u.test(
          binding.recoveryAdoptionIno ?? "",
        ) &&
        /^[a-f0-9]{64}$/u.test(binding.recoveryPlanSha256 ?? "") &&
        Array.isArray(binding.recoveryItemSha256s) &&
        binding.recoveryItemSha256s.length > 0 &&
        binding.recoveryItemSha256s.every((itemSha256) =>
          /^[a-f0-9]{64}$/u.test(itemSha256)) &&
        new Set(binding.recoveryItemSha256s).size ===
          binding.recoveryItemSha256s.length &&
        sha256(canonicalJsonBytes({
          schema: "wave2b-recovery-plan-v1",
          recoveryItemSha256s: binding.recoveryItemSha256s,
        })) === binding.recoveryPlanSha256,
      "wave2b persisted recovery-adoption identity is invalid",
    );
    const adoptionBytes = canonicalBase64(
      binding.recoveryAdoptionBytesBase64,
      "wave2b recoveryAdoptionBytesBase64",
    );
    invariant(
      sha256(adoptionBytes) === binding.recoveryAdoptionSha256,
      "wave2b persisted recovery-adoption bytes do not match their hash",
    );
    validateRecoveryAdoptionRecord(adoptionBytes, binding);
  }

  invariant(
    bindingFingerprint(binding) === binding.descriptorSha256,
    "wave2b persisted lock descriptor fingerprint does not match",
  );
  return deepFreeze(binding);
}

function createPersistedBinding(fields) {
  const withoutFingerprint = {
    schema: WAVE2B_LOCK_BINDING_SCHEMA,
    ...fields,
  };
  return cloneAndValidatePersistedBinding({
    ...withoutFingerprint,
    descriptorSha256: bindingFingerprint(withoutFingerprint),
  });
}

function lockDescriptorFromBinding(persistedBinding) {
  const binding = cloneAndValidatePersistedBinding(persistedBinding);
  const descriptor = {
    schema: WAVE2B_LOCK_DESCRIPTOR_SCHEMA,
    kind: binding.kind,
    rootPath: binding.rootPath,
    rootRealPath: binding.rootRealPath,
    rootDev: binding.rootDev,
    rootIno: binding.rootIno,
    lockPath: binding.lockPath,
    lockRealPath: binding.lockRealPath,
    transactionId: binding.transactionId,
    acquisitionId: binding.acquisitionId,
    ownerBytes: Buffer.from(binding.ownerBytesBase64, "base64"),
    ownerSha256: binding.ownerSha256,
    directoryDev: binding.directoryDev,
    directoryIno: binding.directoryIno,
    ownerDev: binding.ownerDev,
    ownerIno: binding.ownerIno,
    descriptorSha256: binding.descriptorSha256,
    persistedBinding: binding,
  };
  if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
    Object.assign(descriptor, {
      recoveryAdoptionId: binding.recoveryAdoptionId,
      recoveryAdoptionBytes: Buffer.from(
        binding.recoveryAdoptionBytesBase64,
        "base64",
      ),
      recoveryAdoptionSha256: binding.recoveryAdoptionSha256,
      recoveryAdoptionDev: binding.recoveryAdoptionDev,
      recoveryAdoptionIno: binding.recoveryAdoptionIno,
      recoveryPlanSha256: binding.recoveryPlanSha256,
      recoveryItemSha256s: Object.freeze([
        ...binding.recoveryItemSha256s,
      ]),
    });
  }
  return Object.freeze(descriptor);
}

function validateRuntimeLockDescriptor(lock) {
  invariant(
    lock !== null &&
      typeof lock === "object" &&
    lock.schema === WAVE2B_LOCK_DESCRIPTOR_SCHEMA &&
      (lock.kind === WAVE2B_LOCK_KIND_ACQUIRED ||
        lock.kind === WAVE2B_LOCK_KIND_ADOPTED),
    "wave2b lock descriptor is invalid: schema or kind",
  );
  const binding = cloneAndValidatePersistedBinding(lock.persistedBinding, {
    requiredKind: lock.kind,
  });
  const scalarFields = [
    "rootPath",
    "rootRealPath",
    "rootDev",
    "rootIno",
    "lockPath",
    "lockRealPath",
    "transactionId",
    "acquisitionId",
    "ownerSha256",
    "directoryDev",
    "directoryIno",
    "ownerDev",
    "ownerIno",
    "descriptorSha256",
  ];
  invariant(
    scalarFields.every((field) => lock[field] === binding[field]) &&
      Buffer.isBuffer(lock.ownerBytes) &&
      lock.ownerBytes.equals(
        Buffer.from(binding.ownerBytesBase64, "base64"),
      ),
    "wave2b lock descriptor differs from its persisted binding",
  );
  if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
    invariant(
      [
        "recoveryAdoptionId",
        "recoveryAdoptionSha256",
        "recoveryAdoptionDev",
        "recoveryAdoptionIno",
        "recoveryPlanSha256",
      ].every((field) => lock[field] === binding[field]) &&
        Buffer.isBuffer(lock.recoveryAdoptionBytes) &&
        lock.recoveryAdoptionBytes.equals(
          Buffer.from(binding.recoveryAdoptionBytesBase64, "base64"),
        ) &&
        Array.isArray(lock.recoveryItemSha256s) &&
        lock.recoveryItemSha256s.length ===
          binding.recoveryItemSha256s.length &&
        lock.recoveryItemSha256s.every(
          (itemSha256, index) =>
            itemSha256 === binding.recoveryItemSha256s[index],
        ),
      "wave2b adopted lock descriptor differs from its persisted binding",
    );
  }
  return binding;
}

async function captureRootIdentity(rootPath) {
  const before = await lstat(rootPath);
  invariant(
    before.isDirectory() && !before.isSymbolicLink(),
    "wave2b rootPath must be a real directory",
  );
  const rootRealPath = await realpath(rootPath);
  const after = await lstat(rootPath);
  invariant(
    after.isDirectory() &&
      !after.isSymbolicLink() &&
      before.dev === after.dev &&
      before.ino === after.ino,
    "wave2b rootPath identity changed",
  );
  return {
    rootRealPath,
    rootDev: String(after.dev),
    rootIno: String(after.ino),
  };
}

async function assertBoundRoot(binding) {
  const observed = await captureRootIdentity(binding.rootPath);
  invariant(
    observed.rootRealPath === binding.rootRealPath &&
      observed.rootDev === binding.rootDev &&
      observed.rootIno === binding.rootIno,
    "wave2b lock root identity was replaced",
  );
}

async function assertBoundLockDirectory(binding, expectedEntries) {
  await assertBoundRoot(binding);
  const directory = await inspectLockDirectory(
    binding.rootPath,
    binding.lockPath,
    {expectedEntries},
  );
  invariant(
    String(directory.dev) === binding.directoryDev &&
      String(directory.ino) === binding.directoryIno &&
      await realpath(binding.lockPath) === binding.lockRealPath,
    "wave2b lock directory was replaced",
  );
  return directory;
}

async function assertBoundOwner(binding) {
  const ownerPath = path.join(binding.lockPath, WAVE2B_OWNER_ENTRY);
  const owner = await inspectRegularFile(ownerPath);
  const ownerBytes = Buffer.from(binding.ownerBytesBase64, "base64");
  invariant(
    exactFile(owner, {
      bytes: ownerBytes.length,
      sha256: binding.ownerSha256,
    }, {mode: 0o444, nlink: 1}) &&
      owner.contents.equals(ownerBytes) &&
      String(owner.dev) === binding.ownerDev &&
      String(owner.ino) === binding.ownerIno,
    "wave2b lock owner was replaced",
  );
  return owner;
}

async function assertBoundRecoveryAdoption(binding) {
  invariant(
    binding.kind === WAVE2B_LOCK_KIND_ADOPTED,
    "wave2b recovery-adoption validation requires an adopted lock",
  );
  const adoptionPath = path.join(
    binding.lockPath,
    WAVE2B_ADOPTION_ENTRY,
  );
  const adoption = await inspectRegularFile(adoptionPath);
  const adoptionBytes = Buffer.from(
    binding.recoveryAdoptionBytesBase64,
    "base64",
  );
  invariant(
    exactFile(adoption, {
      bytes: adoptionBytes.length,
      sha256: binding.recoveryAdoptionSha256,
    }, {mode: 0o444, nlink: 1}) &&
      adoption.contents.equals(adoptionBytes) &&
      String(adoption.dev) === binding.recoveryAdoptionDev &&
      String(adoption.ino) === binding.recoveryAdoptionIno,
    "wave2b recovery-adoption marker was replaced",
  );
  return adoption;
}

export async function assertWave2bLock(lock, items = null, {
  requireExactRecoveryPlan = false,
  recoveryIndexes = null,
} = {}) {
  const binding = validateRuntimeLockDescriptor(lock);
  const expectedEntries = binding.kind === WAVE2B_LOCK_KIND_ADOPTED
    ? [WAVE2B_OWNER_ENTRY, WAVE2B_ADOPTION_ENTRY]
    : [WAVE2B_OWNER_ENTRY];
  await assertBoundLockDirectory(binding, expectedEntries);
  await assertBoundOwner(binding);
  if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
    await assertBoundRecoveryAdoption(binding);
  }
  await assertBoundRoot(binding);

  if (items) {
    invariant(Array.isArray(items) && items.length > 0,
      "wave2b lock coverage requires plan items");
    if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
      const itemSha256s = items.map(
        (item, index) => recoveryItemFingerprint(item, index),
      );
      if (requireExactRecoveryPlan) {
        invariant(
          recoveryIndexes === null &&
            itemSha256s.length ===
              binding.recoveryItemSha256s.length &&
            itemSha256s.every(
              (itemSha256, index) =>
                itemSha256 === binding.recoveryItemSha256s[index],
            ),
          "wave2b adopted lock does not bind the exact ordered recovery plan",
        );
      } else {
        invariant(
          Array.isArray(recoveryIndexes) &&
            recoveryIndexes.length === itemSha256s.length &&
            recoveryIndexes.every((planIndex, inputIndex) =>
              Number.isSafeInteger(planIndex) &&
              planIndex >= 0 &&
              planIndex < binding.recoveryItemSha256s.length &&
              binding.recoveryItemSha256s[planIndex] ===
                itemSha256s[inputIndex]),
          "wave2b adopted lock item is not authorized at its recovery index",
        );
      }
    } else {
      invariant(
        !requireExactRecoveryPlan && recoveryIndexes === null,
        "wave2b acquired lock cannot use recovery-plan assertions",
      );
    }
    const lockKey = canonicalComparisonKey(
      await realpath(binding.lockPath),
    );
    for (const [index, item] of items.entries()) {
      validatePlanItem(item, index);
      const itemRoot = await resolveSafeRoot(item.rootPath);
      invariant(
        itemRoot.realPath === binding.rootRealPath,
        `${item.id}: wave2b lock does not cover the item root`,
      );
      for (const memberPath of itemMutationPaths(item)) {
        const member = await inspectSafeParent(
          item.rootPath,
          memberPath,
        );
        const memberKey = canonicalComparisonKey(member.canonicalPath);
        invariant(
          !strictPathOverlap(lockKey, memberKey),
          `${item.id}: wave2b lock path overlaps a member path`,
        );
      }
    }
    await assertBoundRoot(binding);
  }
  return true;
}

async function writeImmutableNoReplace(target, bytes, {
  hook = null,
  hookContext = null,
  afterClose = null,
  postCloseValidate = null,
} = {}) {
  invariant(
    Number.isInteger(FS_CONSTANTS.O_NOFOLLOW) &&
      Number.isInteger(FS_CONSTANTS.O_EXCL),
    "O_NOFOLLOW or O_EXCL is unavailable; immutable lock writes are unsupported",
  );
  const handle = await open(
    target,
    FS_CONSTANTS.O_WRONLY |
      FS_CONSTANTS.O_CREAT |
      FS_CONSTANTS.O_EXCL |
      FS_CONSTANTS.O_NOFOLLOW,
    0o600,
  );
  const handleStat = handle.stat.bind(handle);
  const handleSync = handle.sync.bind(handle);
  const handleChmod = handle.chmod.bind(handle);
  const handleWriteFile = handle.writeFile.bind(handle);
  let opened = null;
  let writeError = null;
  try {
    await withHandleClosePreservingError(
      handle,
      async () => {
        opened = await handleStat();
        if (hook) {
          await hook({
            handle,
            bytes: Buffer.from(bytes),
            ...hookContext,
          });
        } else {
          await handleWriteFile(bytes);
        }
        await handleSync();
        await handleChmod(0o444);
        await handleSync();
      },
      `${target}: immutable write and handle close both failed`,
      {afterClose},
    );
  } catch (error) {
    writeError = error;
  }

  let validationError = null;
  if (postCloseValidate !== null) {
    try {
      await postCloseValidate({opened});
    } catch (error) {
      validationError = error;
    }
  }
  let observed = null;
  try {
    observed = await inspectRegularFile(target);
    invariant(
      opened !== null &&
        exactFile(observed, {
          bytes: bytes.length,
          sha256: sha256(bytes),
        }, {mode: 0o444, nlink: 1}) &&
        observed.contents.equals(bytes) &&
        observed.dev === opened.dev &&
        observed.ino === opened.ino,
      `${target}: immutable no-replace write failed verification`,
    );
  } catch (error) {
    validationError = preservePrimaryError(
      validationError,
      error,
      `${target}: immutable post-close validations failed`,
    );
  }
  if (validationError !== null) {
    const primaryMessage = writeError?.message ?? validationError.message;
    writeError = preservePrimaryError(
      writeError,
      validationError,
      `${target}: immutable write or post-close validation failed; ${
        primaryMessage
      }`,
    );
  }
  if (writeError !== null) throw writeError;
  return observed;
}

export async function acquireWave2bLock({
  rootPath,
  lockPath,
  owner,
} = {}) {
  normalizedAbsolute(rootPath, "wave2b lock rootPath");
  normalizedAbsolute(lockPath, "wave2b lock path");
  relativeWithin(rootPath, lockPath, "wave2b lock path");
  const ownerSnapshot = cloneJsonObject(owner, "wave2b lock owner");
  invariant(
    typeof ownerSnapshot.transactionId === "string" &&
      ownerSnapshot.transactionId.length > 0 &&
      ownerSnapshot.transactionId.length <= 512 &&
      !ownerSnapshot.transactionId.includes("\0"),
    "wave2b lock owner requires a bounded transactionId",
  );
  const transactionId = ownerSnapshot.transactionId;
  const acquisitionId = randomBytes(32).toString("hex");
  const ownerBytes = canonicalJsonBytes({
    schema: WAVE2B_LOCK_OWNER_SCHEMA,
    acquisitionId,
    transactionId,
    owner: ownerSnapshot,
  });

  const rootIdentity = await captureRootIdentity(rootPath);
  await inspectSafeParent(rootPath, lockPath, {create: true});
  await mkdir(lockPath, {recursive: false, mode: 0o700});
  let directory = null;
  let observedOwner = null;
  try {
    await chmod(lockPath, 0o700);
    await syncFilesystemObject(lockPath);
    await syncDirectory(path.dirname(lockPath));
    directory = await inspectLockDirectory(
      rootPath,
      lockPath,
      {expectedEntries: []},
    );
    const lockRealPath = await realpath(lockPath);
    const ownerPath = path.join(lockPath, WAVE2B_OWNER_ENTRY);
    observedOwner = await writeImmutableNoReplace(ownerPath, ownerBytes);
    await syncDirectory(lockPath);
    const binding = createPersistedBinding({
      kind: WAVE2B_LOCK_KIND_ACQUIRED,
      rootPath,
      ...rootIdentity,
      lockPath,
      lockRealPath,
      transactionId,
      acquisitionId,
      ownerBytesBase64: ownerBytes.toString("base64"),
      ownerSha256: sha256(ownerBytes),
      directoryDev: String(directory.dev),
      directoryIno: String(directory.ino),
      ownerDev: String(observedOwner.dev),
      ownerIno: String(observedOwner.ino),
    });
    const descriptor = lockDescriptorFromBinding(binding);
    await assertWave2bLock(descriptor);
    return descriptor;
  } catch (error) {
    if (directory && observedOwner) {
      try {
        const currentDirectory = await lstat(lockPath);
        const currentOwner = await lstat(
          path.join(lockPath, WAVE2B_OWNER_ENTRY),
        );
        const entries = await readdir(lockPath);
        if (
          currentDirectory.isDirectory() &&
          !currentDirectory.isSymbolicLink() &&
          currentDirectory.dev === directory.dev &&
          currentDirectory.ino === directory.ino &&
          entries.length === 1 &&
          entries[0] === WAVE2B_OWNER_ENTRY &&
          currentOwner.isFile() &&
          !currentOwner.isSymbolicLink() &&
          currentOwner.dev === observedOwner.dev &&
          currentOwner.ino === observedOwner.ino &&
          currentOwner.nlink === 1
        ) {
          await unlink(path.join(lockPath, WAVE2B_OWNER_ENTRY));
          await syncDirectory(lockPath);
          await rmdir(lockPath);
          await syncDirectory(path.dirname(lockPath));
        }
      } catch {
        // Leave uncertain acquisition residue in place for manual recovery.
      }
    }
    throw error;
  }
}

function recoveryLivenessSubject(binding) {
  const ownerBytes = Buffer.from(binding.ownerBytesBase64, "base64");
  const ownerRecord = validateOwnerRecord(ownerBytes, binding);
  return deepFreeze({
    schema: "wave2b-lock-liveness-subject-v1",
    transactionId: binding.transactionId,
    acquisitionId: binding.acquisitionId,
    ownerSha256: binding.ownerSha256,
    descriptorSha256: binding.descriptorSha256,
    rootPath: binding.rootPath,
    rootRealPath: binding.rootRealPath,
    lockPath: binding.lockPath,
    lockRealPath: binding.lockRealPath,
    owner: cloneJsonObject(
      ownerRecord.owner,
      "wave2b lock liveness owner",
    ),
  });
}

function recoveryJournalEvent(event, fields) {
  return deepFreeze({
    schema: WAVE2B_RECOVERY_JOURNAL_SCHEMA,
    event,
    ...fields,
  });
}

async function assertRecoveryAdoptionInProgress(binding) {
  await assertBoundLockDirectory(
    binding,
    [WAVE2B_OWNER_ENTRY, WAVE2B_ADOPTION_ENTRY],
  );
  await assertBoundOwner(binding);
  await assertBoundRoot(binding);
}

export async function adoptWave2bLockForRecovery({
  rootPath,
  lockPath,
  items,
  persistedBinding,
  decideOwnerLiveness,
  journal,
  hooks = null,
} = {}) {
  invariant(
    typeof decideOwnerLiveness === "function",
    "wave2b recovery adoption requires an owner-liveness callback",
  );
  invariant(
    typeof journal === "function",
    "wave2b recovery adoption requires a durable journal callback",
  );
  const writeRecoveryAdoptionMarker =
    hooks?.writeRecoveryAdoptionMarker ?? null;
  const afterRecoveryAdoptionMarkerClose =
    hooks?.afterRecoveryAdoptionMarkerClose ?? null;
  invariant(
    writeRecoveryAdoptionMarker === null ||
      typeof writeRecoveryAdoptionMarker === "function",
    "wave2b recovery-adoption marker hook must be a function",
  );
  invariant(
    afterRecoveryAdoptionMarkerClose === null ||
      typeof afterRecoveryAdoptionMarkerClose === "function",
    "wave2b recovery-adoption marker close hook must be a function",
  );
  normalizedAbsolute(rootPath, "wave2b recovery lock rootPath");
  normalizedAbsolute(lockPath, "wave2b recovery lock path");
  const binding = cloneAndValidatePersistedBinding(persistedBinding, {
    requiredKind: WAVE2B_LOCK_KIND_ACQUIRED,
  });
  invariant(
    rootPath === binding.rootPath && lockPath === binding.lockPath,
    "wave2b recovery paths differ from the persisted lock binding",
  );
  invariant(
    Array.isArray(items) && items.length > 0,
    "wave2b recovery adoption requires plan items",
  );
  const planItems = clonePlanItems(items);
  const acquiredDescriptor = lockDescriptorFromBinding(binding);
  const livenessSubject = recoveryLivenessSubject(binding);
  const recoveryPlan = recoveryPlanBinding(planItems);

  await validateBatchPaths(planItems);
  await assertWave2bLock(acquiredDescriptor, planItems);
  const memberSnapshots = await captureExactMemberSnapshots(
    planItems,
    "recovery adoption",
  );
  const revalidateAcquiredMembers = async (label) => {
    await assertExactMemberSnapshots(planItems, memberSnapshots, label);
    await assertWave2bLock(acquiredDescriptor, planItems);
  };
  await revalidateAcquiredMembers("before owner-liveness callback");
  const liveness = await awaitCallbackAndRevalidate(
    () => decideOwnerLiveness(livenessSubject),
    () => revalidateAcquiredMembers(
      "during owner-liveness callback",
    ),
    "wave2b recovery-adoption owner-liveness callback",
  );
  invariant(
    liveness === "dead",
    "wave2b recovery adoption requires an exact dead owner-liveness result",
  );

  const recoveryAdoptionId = randomBytes(32).toString("hex");
  const adoptionRecord = {
    schema: WAVE2B_RECOVERY_ADOPTION_SCHEMA,
    recoveryAdoptionId,
    transactionId: binding.transactionId,
    acquisitionId: binding.acquisitionId,
    priorDescriptorSha256: binding.descriptorSha256,
    ownerSha256: binding.ownerSha256,
    recoveryPlanSha256: recoveryPlan.recoveryPlanSha256,
  };
  const adoptionBytes = canonicalJsonBytes(adoptionRecord);
  const adoptionSha256 = sha256(adoptionBytes);
  const adoptionPath = path.join(lockPath, WAVE2B_ADOPTION_ENTRY);

  await awaitCallbackAndRevalidate(
    () => journal(recoveryJournalEvent(
      "lock-recovery-adoption-intent",
      {
        transactionId: binding.transactionId,
        acquisitionId: binding.acquisitionId,
        priorDescriptorSha256: binding.descriptorSha256,
        persistedBinding: binding,
        recoveryPlanSha256: recoveryPlan.recoveryPlanSha256,
        recoveryAdoption: {
          recoveryAdoptionId,
          path: adoptionPath,
          bytes: adoptionBytes.length,
          sha256: adoptionSha256,
        },
      },
    )),
    () => revalidateAcquiredMembers(
      "during lock-recovery-adoption-intent journal",
    ),
    "wave2b lock-recovery-adoption-intent journal",
  );

  const guardedWriteRecoveryAdoptionMarker =
    writeRecoveryAdoptionMarker === null
      ? null
      : (context) => awaitCallbackAndRevalidate(
        () => writeRecoveryAdoptionMarker(context),
        async () => {
          await assertExactMemberSnapshots(
            planItems,
            memberSnapshots,
            "during recovery-adoption marker hook",
          );
          await assertRecoveryAdoptionInProgress(binding);
        },
        "wave2b recovery-adoption marker hook",
      );
  let observedAdoption;
  try {
    observedAdoption = await writeImmutableNoReplace(
      adoptionPath,
      adoptionBytes,
      {
        hook: guardedWriteRecoveryAdoptionMarker,
        hookContext: {
          transactionId: binding.transactionId,
          acquisitionId: binding.acquisitionId,
          recoveryAdoptionId,
          target: adoptionPath,
        },
        afterClose: afterRecoveryAdoptionMarkerClose === null
          ? null
          : () => afterRecoveryAdoptionMarkerClose(deepFreeze({
            transactionId: binding.transactionId,
            acquisitionId: binding.acquisitionId,
            recoveryAdoptionId,
            target: adoptionPath,
          })),
        postCloseValidate: async () => {
          await assertExactMemberSnapshots(
            planItems,
            memberSnapshots,
            "after recovery-adoption marker close",
          );
          await assertRecoveryAdoptionInProgress(binding);
        },
      },
    );
  } catch (error) {
    try {
      await syncDirectory(lockPath);
    } catch (syncError) {
      throw new AggregateError(
        [error, syncError],
        "wave2b recovery-adoption marker failure left durability uncertain",
      );
    }
    throw error;
  }
  await syncDirectory(lockPath);

  const adoptedBinding = createPersistedBinding({
    kind: WAVE2B_LOCK_KIND_ADOPTED,
    rootPath: binding.rootPath,
    rootRealPath: binding.rootRealPath,
    rootDev: binding.rootDev,
    rootIno: binding.rootIno,
    lockPath: binding.lockPath,
    lockRealPath: binding.lockRealPath,
    transactionId: binding.transactionId,
    acquisitionId: binding.acquisitionId,
    ownerBytesBase64: binding.ownerBytesBase64,
    ownerSha256: binding.ownerSha256,
    directoryDev: binding.directoryDev,
    directoryIno: binding.directoryIno,
    ownerDev: binding.ownerDev,
    ownerIno: binding.ownerIno,
    recoveryAdoptionId,
    recoveryAdoptionBytesBase64: adoptionBytes.toString("base64"),
    recoveryAdoptionSha256: adoptionSha256,
    recoveryAdoptionDev: String(observedAdoption.dev),
    recoveryAdoptionIno: String(observedAdoption.ino),
    recoveryPlanSha256: recoveryPlan.recoveryPlanSha256,
    recoveryItemSha256s: recoveryPlan.recoveryItemSha256s,
  });
  const adoptedDescriptor = lockDescriptorFromBinding(adoptedBinding);
  const revalidateAdoptedMembers = async (label) => {
    await assertExactMemberSnapshots(planItems, memberSnapshots, label);
    await assertWave2bLock(adoptedDescriptor, planItems, {
      requireExactRecoveryPlan: true,
    });
  };
  await revalidateAdoptedMembers(
    "during recovery-adoption marker creation",
  );
  await awaitCallbackAndRevalidate(
    () => journal(recoveryJournalEvent(
      "lock-recovery-adoption-state-validated",
      {
        transactionId: binding.transactionId,
        acquisitionId: binding.acquisitionId,
        priorDescriptorSha256: binding.descriptorSha256,
        persistedBinding: adoptedBinding,
        recoveryPlanSha256: recoveryPlan.recoveryPlanSha256,
        recoveryAdoption: {
          recoveryAdoptionId,
          path: adoptionPath,
          bytes: adoptionBytes.length,
          sha256: adoptionSha256,
        },
      },
    )),
    () => revalidateAdoptedMembers(
      "during lock-recovery-adoption-state-validated journal",
    ),
    "wave2b lock-recovery-adoption-state-validated journal",
  );
  return adoptedDescriptor;
}

async function assertAdoptionMarkerOnly(binding) {
  await assertBoundLockDirectory(binding, [WAVE2B_ADOPTION_ENTRY]);
  await assertBoundRecoveryAdoption(binding);
  await assertBoundRoot(binding);
}

async function assertEmptyBoundLockDirectory(binding) {
  const directory = await assertBoundLockDirectory(binding, []);
  invariant(
    String(directory.dev) === binding.directoryDev &&
      String(directory.ino) === binding.directoryIno,
    "wave2b empty lock directory was replaced",
  );
  await assertBoundRoot(binding);
}

export async function releaseWave2bLock(lock) {
  const binding = validateRuntimeLockDescriptor(lock);
  await assertWave2bLock(lock);
  const ownerPath = path.join(binding.lockPath, WAVE2B_OWNER_ENTRY);
  await unlink(ownerPath);
  await syncDirectory(binding.lockPath);

  if (binding.kind === WAVE2B_LOCK_KIND_ADOPTED) {
    await assertAdoptionMarkerOnly(binding);
    const adoptionPath = path.join(
      binding.lockPath,
      WAVE2B_ADOPTION_ENTRY,
    );
    await unlink(adoptionPath);
    await syncDirectory(binding.lockPath);
  }

  await assertEmptyBoundLockDirectory(binding);
  await rmdir(binding.lockPath);
  await syncDirectory(path.dirname(binding.lockPath));
  await assertBoundRoot(binding);
  invariant(
    !await exists(binding.lockPath),
    "wave2b lock was not released",
  );
}
