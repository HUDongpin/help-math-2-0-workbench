import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NATIVE_SOURCE_PATH = path.join(
  MODULE_DIRECTORY,
  "darwin-atomic-directory-swap-native.c",
);
const NATIVE_BUILD_PREFIX = "helpmath-darwin-directory-swap-";
const CLEAN_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin",
});
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;

export const DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED =
  "DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED";
export const DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE =
  "DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE";
export const DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE =
  "DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE";
export const DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN =
  "DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN";

function coded(message, code, options = undefined) {
  const error = new Error(message, options);
  error.code = code;
  return error;
}

function nodeIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
  };
}

function sameNode(left, right) {
  return Boolean(
    left && right && left.dev === right.dev && left.ino === right.ino,
  );
}

function normalizedAbsolute(value, label) {
  if (typeof value !== "string" || !value || !path.isAbsolute(value)) {
    throw coded(
      `${label} must be an explicit absolute path`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  const normalized = path.normalize(value);
  if (normalized !== value || value.includes("\0")) {
    throw coded(
      `${label} must already be normalized and contain no NUL byte`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  return normalized;
}

async function snapshotDirectory(candidate, label) {
  const before = await lstat(candidate, {bigint: true});
  if (!before.isDirectory() || before.isSymbolicLink()) {
    throw coded(
      `${label} must be a real, non-symbolic-link directory`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  const resolved = await realpath(candidate);
  const after = await lstat(candidate, {bigint: true});
  if (
    !after.isDirectory() ||
    after.isSymbolicLink() ||
    !sameNode(nodeIdentity(before), nodeIdentity(after))
  ) {
    throw coded(
      `${label} identity changed during preflight`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  return {
    path: candidate,
    resolved,
    node: nodeIdentity(after),
  };
}

export function assertDarwinAtomicDirectorySwapSupported(
  platform = process.platform,
) {
  if (platform !== "darwin") {
    throw coded(
      `atomic directory exchange requires Darwin renameatx_np(RENAME_SWAP); received ${platform}`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED,
    );
  }
  return true;
}

export function assertAtomicDirectorySwapSameDevice({parent, first, second}) {
  if (
    !parent?.dev ||
    !first?.dev ||
    !second?.dev ||
    parent.dev !== first.dev ||
    parent.dev !== second.dev
  ) {
    throw coded(
      "allowed parent and both child directories must be on the same device",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  return true;
}

async function preflight({allowedParent, firstDirectory, secondDirectory}) {
  const parentPath = normalizedAbsolute(allowedParent, "allowedParent");
  const firstPath = normalizedAbsolute(firstDirectory, "firstDirectory");
  const secondPath = normalizedAbsolute(secondDirectory, "secondDirectory");
  if (parentPath === path.parse(parentPath).root) {
    throw coded(
      "allowedParent cannot be a filesystem root",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  if (path.dirname(firstPath) !== parentPath || path.dirname(secondPath) !== parentPath) {
    throw coded(
      "both swap targets must be direct siblings under the explicit allowedParent",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  if (firstPath === secondPath) {
    throw coded(
      "swap targets must be two distinct directory paths",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }

  const parent = await snapshotDirectory(parentPath, "allowedParent");
  const first = await snapshotDirectory(firstPath, "firstDirectory");
  const second = await snapshotDirectory(secondPath, "secondDirectory");
  const firstName = path.basename(firstPath);
  const secondName = path.basename(secondPath);
  if (
    first.resolved !== path.join(parent.resolved, firstName) ||
    second.resolved !== path.join(parent.resolved, secondName)
  ) {
    throw coded(
      "a swap target resolves outside its explicit allowedParent",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  assertAtomicDirectorySwapSameDevice({
    parent: parent.node,
    first: first.node,
    second: second.node,
  });
  if (sameNode(first.node, second.node)) {
    throw coded(
      "swap targets resolve to the same directory inode",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  return {
    parent,
    first,
    second,
    firstName,
    secondName,
  };
}

async function trustedDarwinTemporaryRoot() {
  const {stdout} = await execFile(
    "/usr/bin/getconf",
    ["DARWIN_USER_TEMP_DIR"],
    {
      encoding: "utf8",
      env: CLEAN_ENVIRONMENT,
      maxBuffer: 64 * 1024,
      timeout: 10_000,
    },
  );
  const candidate = stdout.trim();
  if (!path.isAbsolute(candidate)) {
    throw coded(
      "DARWIN_USER_TEMP_DIR is not absolute",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  const resolved = await realpath(candidate);
  const information = await lstat(resolved, {bigint: true});
  if (!information.isDirectory() || information.isSymbolicLink()) {
    throw coded(
      "DARWIN_USER_TEMP_DIR is not a real directory",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  if (typeof process.getuid === "function" && information.uid !== BigInt(process.getuid())) {
    throw coded(
      "DARWIN_USER_TEMP_DIR is not owned by the current user",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  return resolved;
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

async function readNativeSource() {
  const handle = await open(NATIVE_SOURCE_PATH, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    if (!before.isFile() || before.nlink !== 1n) {
      throw new Error("native swap source must be a single-link regular file");
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPath = await lstat(NATIVE_SOURCE_PATH, {bigint: true});
    if (
      !atPath.isFile() ||
      atPath.isSymbolicLink() ||
      !sameNode(nodeIdentity(before), nodeIdentity(after)) ||
      !sameNode(nodeIdentity(before), nodeIdentity(atPath))
    ) {
      throw new Error("native swap source identity changed while reading");
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function writeSyncedExclusive(candidate, bytes, mode) {
  const handle = await open(
    candidate,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    mode,
  );
  try {
    await handle.writeFile(bytes);
    await handle.chmod(mode);
    await handle.sync();
    return nodeIdentity(await handle.stat({bigint: true}));
  } finally {
    await handle.close();
  }
}

async function buildNativeHelper() {
  const temporaryRoot = await trustedDarwinTemporaryRoot();
  const buildDirectory = await mkdtemp(path.join(temporaryRoot, NATIVE_BUILD_PREFIX));
  await chmod(buildDirectory, 0o700);
  const sourceCopy = path.join(buildDirectory, "swap.c");
  const executable = path.join(buildDirectory, "swap-native");
  const directoryInformation = await lstat(buildDirectory, {bigint: true});
  const build = {
    buildDirectory,
    directoryNode: nodeIdentity(directoryInformation),
    executable,
    sourceCopy,
    temporaryRoot,
  };
  try {
    const sourceBytes = await readNativeSource();
    build.sourceNode = await writeSyncedExclusive(sourceCopy, sourceBytes, 0o600);
    await execFile(
      "/usr/bin/xcrun",
      [
        "--sdk",
        "macosx",
        "clang",
        "-std=c17",
        "-O2",
        "-Wall",
        "-Wextra",
        "-Werror",
        sourceCopy,
        "-o",
        executable,
      ],
      {
        encoding: "utf8",
        env: CLEAN_ENVIRONMENT,
        maxBuffer: 1024 * 1024,
        timeout: 30_000,
      },
    );
    const compiled = await lstat(executable, {bigint: true});
    if (!compiled.isFile() || compiled.isSymbolicLink() || compiled.nlink !== 1n) {
      throw coded(
        "compiled native swap helper is not a single-link regular file",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    build.executableNode = nodeIdentity(compiled);
    await chmod(executable, 0o500);
    const executableHandle = await open(executable, fsConstants.O_RDONLY | NOFOLLOW);
    try {
      const opened = await executableHandle.stat({bigint: true});
      if (!sameNode(build.executableNode, nodeIdentity(opened))) {
        throw new Error("compiled native swap helper identity changed before fsync");
      }
      await executableHandle.sync();
    } finally {
      await executableHandle.close();
    }
    await fsyncDirectory(buildDirectory);
    build.sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
    return build;
  } catch (error) {
    const cleanupWarning = await cleanupNativeHelper(build);
    if (cleanupWarning) error.cleanupWarning = cleanupWarning;
    if (!error.code) error.code = DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE;
    throw error;
  }
}

async function cleanupNativeHelper(build) {
  if (!build) return null;
  if (
    path.dirname(build.buildDirectory) !== build.temporaryRoot ||
    !path.basename(build.buildDirectory).startsWith(NATIVE_BUILD_PREFIX)
  ) {
    return "refused to remove an unexpected native-helper build directory";
  }
  try {
    const information = await lstat(build.buildDirectory, {bigint: true});
    if (
      !information.isDirectory() ||
      information.isSymbolicLink() ||
      !sameNode(build.directoryNode, nodeIdentity(information))
    ) {
      return "refused to remove a replaced native-helper build directory";
    }
    const expected = new Map([
      ["swap.c", build.sourceNode],
      ["swap-native", build.executableNode],
    ]);
    const entries = await readdir(build.buildDirectory, {withFileTypes: true});
    if (entries.some((entry) => !expected.has(entry.name))) {
      return "refused to remove a native-helper build directory with foreign entries";
    }
    for (const entry of entries) {
      const candidate = path.join(build.buildDirectory, entry.name);
      const observed = await lstat(candidate, {bigint: true});
      const expectedNode = expected.get(entry.name);
      if (
        !observed.isFile() ||
        observed.isSymbolicLink() ||
        observed.nlink !== 1n ||
        (expectedNode && !sameNode(expectedNode, nodeIdentity(observed)))
      ) {
        return `refused to remove replaced native-helper file ${entry.name}`;
      }
      await unlink(candidate);
    }
    await rmdir(build.buildDirectory);
    await fsyncDirectory(build.temporaryRoot);
    return null;
  } catch (error) {
    return `native-helper cleanup failed: ${error.message}`;
  }
}

async function observeSwapState(bound) {
  try {
    const first = await snapshotDirectory(
      path.join(bound.parent.resolved, bound.firstName),
      "post-swap firstDirectory",
    );
    const second = await snapshotDirectory(
      path.join(bound.parent.resolved, bound.secondName),
      "post-swap secondDirectory",
    );
    if (sameNode(first.node, bound.second.node) && sameNode(second.node, bound.first.node)) {
      return {state: "swapped", first, second};
    }
    if (sameNode(first.node, bound.first.node) && sameNode(second.node, bound.second.node)) {
      return {state: "unchanged", first, second};
    }
    return {state: "indeterminate", first, second};
  } catch (error) {
    return {state: "indeterminate", observationError: error.message};
  }
}

async function invokeNativeHelper(build, bound) {
  let receipt;
  try {
    const {stdout} = await execFile(
      build.executable,
      [
        bound.parent.resolved,
        bound.firstName,
        bound.secondName,
        bound.parent.node.dev,
        bound.parent.node.ino,
        bound.first.node.dev,
        bound.first.node.ino,
        bound.second.node.dev,
        bound.second.node.ino,
      ],
      {
        encoding: "utf8",
        env: CLEAN_ENVIRONMENT,
        maxBuffer: 64 * 1024,
        timeout: 30_000,
      },
    );
    receipt = JSON.parse(stdout);
  } catch (error) {
    const observed = await observeSwapState(bound);
    const code = observed.state === "swapped"
      ? DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN
      : DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE;
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    const wrapped = coded(
      `native Darwin directory swap failed; observed state=${observed.state}${stderr ? `; ${stderr}` : ""}`,
      code,
      {cause: error},
    );
    wrapped.observedState = observed;
    throw wrapped;
  }
  if (receipt?.status !== "swapped" || receipt.parentFsynced !== true) {
    throw coded(
      "native Darwin directory swap returned a non-canonical success receipt",
      DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
    );
  }
  return receipt;
}

/**
 * Atomically exchanges exactly two existing sibling directories under one
 * explicit parent. This primitive performs no selection, copying, deletion,
 * catalog mutation, or fallback rename sequence. Callers remain responsible
 * for an enclosing transaction lock and for validating the trees' contents.
 */
export async function atomicSwapSiblingDirectoriesDarwin({
  allowedParent,
  firstDirectory,
  secondDirectory,
} = {}) {
  assertDarwinAtomicDirectorySwapSupported(process.platform);
  const bound = await preflight({allowedParent, firstDirectory, secondDirectory});
  let build;
  let operationResult;
  let operationError;
  try {
    build = await buildNativeHelper();
    const nativeReceipt = await invokeNativeHelper(build, bound);
    const observed = await observeSwapState(bound);
    if (observed.state !== "swapped") {
      const error = coded(
        `Darwin swap postcondition failed; observed state=${observed.state}`,
        DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
      );
      error.observedState = observed;
      throw error;
    }
    operationResult = {
      status: "swapped-and-parent-fsynced",
      allowedParent: bound.parent.resolved,
      firstDirectory: path.join(bound.parent.resolved, bound.firstName),
      secondDirectory: path.join(bound.parent.resolved, bound.secondName),
      before: {
        first: bound.first.node,
        second: bound.second.node,
      },
      after: {
        first: observed.first.node,
        second: observed.second.node,
      },
      native: nativeReceipt,
      nativeSourceSha256: build.sourceSha256,
    };
  } catch (error) {
    operationError = error;
  }

  const cleanupWarning = await cleanupNativeHelper(build);
  if (operationError) {
    if (cleanupWarning) operationError.cleanupWarning = cleanupWarning;
    throw operationError;
  }
  return Object.freeze({...operationResult, cleanupWarning});
}

export const DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH =
  NATIVE_SOURCE_PATH;
