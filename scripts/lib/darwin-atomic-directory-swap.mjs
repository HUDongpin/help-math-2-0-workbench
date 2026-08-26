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
import {isDeepStrictEqual, promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NATIVE_SOURCE_PATH = path.join(
  MODULE_DIRECTORY,
  "darwin-atomic-directory-swap-native.c",
);
const NATIVE_BUILD_PREFIX = "helpmath-darwin-directory-swap-";
const NATIVE_SOURCE_RELATIVE_PATH =
  "scripts/lib/darwin-atomic-directory-swap-native.c";
const NATIVE_BUILD_CONTRACT_SCHEMA =
  "help-math-darwin-atomic-directory-swap-native-build-contract/v1";
const NATIVE_BUILD_RECEIPT_SCHEMA =
  "help-math-darwin-atomic-directory-swap-native-build/v1";
const NATIVE_COMPILE_ARGUMENTS = Object.freeze([
  "-std=c17",
  "-O2",
  "-Wall",
  "-Wextra",
  "-Werror",
]);
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

async function snapshotRegularFile(candidate, label) {
  const before = await lstat(candidate, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n) {
    throw coded(
      `${label} must be a real, single-link regular file`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  const resolved = await realpath(candidate);
  const after = await lstat(candidate, {bigint: true});
  if (
    !after.isFile() ||
    after.isSymbolicLink() ||
    after.nlink !== 1n ||
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

async function preflight({
  allowedParent,
  firstDirectory,
  secondDirectory,
  expectedFirstNode,
  expectedSecondNode,
}) {
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
  if ((expectedFirstNode && !sameNode(first.node, expectedFirstNode))
    || (expectedSecondNode && !sameNode(second.node, expectedSecondNode))) {
    throw coded(
      "a directory swap target differs from its transaction-bound inode",
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

async function preflightRegularFiles({
  allowedParent,
  firstFile,
  secondFile,
  expectedFirstNode,
  expectedSecondNode,
}) {
  const parentPath = normalizedAbsolute(allowedParent, "allowedParent");
  const firstPath = normalizedAbsolute(firstFile, "firstFile");
  const secondPath = normalizedAbsolute(secondFile, "secondFile");
  if (parentPath === path.parse(parentPath).root) {
    throw coded(
      "allowedParent cannot be a filesystem root",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  if (path.dirname(firstPath) !== parentPath || path.dirname(secondPath) !== parentPath) {
    throw coded(
      "both file swap targets must be direct siblings under the explicit allowedParent",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  if (firstPath === secondPath) {
    throw coded(
      "file swap targets must be two distinct paths",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  const parent = await snapshotDirectory(parentPath, "allowedParent");
  const first = await snapshotRegularFile(firstPath, "firstFile");
  const second = await snapshotRegularFile(secondPath, "secondFile");
  const firstName = path.basename(firstPath);
  const secondName = path.basename(secondPath);
  if (first.resolved !== path.join(parent.resolved, firstName)
    || second.resolved !== path.join(parent.resolved, secondName)) {
    throw coded(
      "a file swap target resolves outside its explicit allowedParent",
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
      "file swap targets resolve to the same inode",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  if ((expectedFirstNode && !sameNode(first.node, expectedFirstNode))
    || (expectedSecondNode && !sameNode(second.node, expectedSecondNode))) {
    throw coded(
      "a file swap target differs from its compare-and-swap inode",
      DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
    );
  }
  return {parent, first, second, firstName, secondName};
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

function normalizedAbsoluteToolPath(value, label) {
  const candidate = String(value ?? "").trim();
  if (!candidate || !path.isAbsolute(candidate) || path.normalize(candidate) !== candidate) {
    throw coded(
      `${label} is not a normalized absolute path`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  return candidate;
}

async function nativeToolchainObservation() {
  const options = {
    encoding: "utf8",
    env: CLEAN_ENVIRONMENT,
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  };
  const [{stdout: compilerOutput}, {stdout: sdkOutput}] = await Promise.all([
    execFile("/usr/bin/xcrun", ["--sdk", "macosx", "--find", "clang"], options),
    execFile("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"], options),
  ]);
  const compilerPath = normalizedAbsoluteToolPath(compilerOutput, "native-helper compiler path");
  const sdkPath = normalizedAbsoluteToolPath(sdkOutput, "native-helper SDK path");
  const {stdout: versionOutput} = await execFile(compilerPath, ["--version"], options);
  const version = String(versionOutput ?? "").trim();
  if (!version) {
    throw coded(
      "native-helper compiler version is empty",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  return {path: compilerPath, version, sdkPath};
}

export async function describeDarwinAtomicDirectorySwapBuildContract() {
  assertDarwinAtomicDirectorySwapSupported(process.platform);
  const [sourceBytes, compiler] = await Promise.all([
    readNativeSource(),
    nativeToolchainObservation(),
  ]);
  return Object.freeze({
    schemaVersion: NATIVE_BUILD_CONTRACT_SCHEMA,
    source: Object.freeze({
      path: NATIVE_SOURCE_RELATIVE_PATH,
      bytes: sourceBytes.length,
      sha256: createHash("sha256").update(sourceBytes).digest("hex"),
    }),
    compiler: Object.freeze({...compiler}),
    compile: Object.freeze({
      driver: "/usr/bin/xcrun",
      sdk: "macosx",
      arguments: Object.freeze([...NATIVE_COMPILE_ARGUMENTS]),
      executableSha256Policy:
        "prepared-witness-and-identical-across-source-catalog-rollback-and-readme-swaps",
    }),
  });
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

async function inspectNativeBuildArtifact(candidate, {
  expectedNode,
  expectedSha256,
  expectedMode,
  label,
}) {
  const atPathBefore = await lstat(candidate, {bigint: true});
  if (!atPathBefore.isFile() || atPathBefore.isSymbolicLink()
    || atPathBefore.nlink !== 1n
    || !sameNode(nodeIdentity(atPathBefore), expectedNode)) {
    throw coded(
      `${label} path identity differs from the compiled helper binding`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  const handle = await open(candidate, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const openedBefore = await handle.stat({bigint: true});
    if (!openedBefore.isFile() || openedBefore.nlink !== 1n
      || !sameNode(nodeIdentity(openedBefore), expectedNode)) {
      throw coded(
        `${label} opened identity differs from the compiled helper binding`,
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    const bytes = await handle.readFile();
    const openedAfter = await handle.stat({bigint: true});
    const atPathAfter = await lstat(candidate, {bigint: true});
    const observedSha256 = createHash("sha256").update(bytes).digest("hex");
    const observedMode = Number(openedAfter.mode & 0o7777n);
    if (!sameNode(nodeIdentity(openedBefore), nodeIdentity(openedAfter))
      || !sameNode(nodeIdentity(openedBefore), nodeIdentity(atPathAfter))
      || openedBefore.size !== openedAfter.size
      || openedBefore.mtimeNs !== openedAfter.mtimeNs
      || observedSha256 !== expectedSha256
      || observedMode !== expectedMode) {
      throw coded(
        `${label} bytes, mode, or identity drifted`,
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    return {node: nodeIdentity(openedAfter), sha256: observedSha256, mode: observedMode};
  } finally {
    await handle.close();
  }
}

async function validateNativeBuildArtifacts(build) {
  const directory = await lstat(build.buildDirectory, {bigint: true});
  if (!directory.isDirectory() || directory.isSymbolicLink()
    || !sameNode(nodeIdentity(directory), build.directoryNode)) {
    throw coded(
      "native-helper build directory identity drifted",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  const entries = await readdir(build.buildDirectory, {withFileTypes: true});
  if (entries.length !== 2
    || entries.some((entry) => !entry.isFile()
      || !["swap.c", "swap-native"].includes(entry.name))) {
    throw coded(
      "native-helper build directory contains an unexpected entry set",
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
    );
  }
  const [sourceCopy, executable] = await Promise.all([
    inspectNativeBuildArtifact(build.sourceCopy, {
      expectedNode: build.sourceNode,
      expectedSha256: build.sourceSha256,
      expectedMode: 0o600,
      label: "native-helper source copy",
    }),
    inspectNativeBuildArtifact(build.executable, {
      expectedNode: build.executableNode,
      expectedSha256: build.executableSha256,
      expectedMode: 0o500,
      label: "native-helper executable",
    }),
  ]);
  return {sourceCopy, executable};
}

async function buildNativeHelper({
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
} = {}) {
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
    const observedBuildContract =
      await describeDarwinAtomicDirectorySwapBuildContract();
    if (expectedNativeBuildContract !== undefined
      && !isDeepStrictEqual(observedBuildContract, expectedNativeBuildContract)) {
      throw coded(
        "native swap build contract differs from the frozen plan contract",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    const sourceBytes = await readNativeSource();
    build.sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
    if (expectedNativeSourceSha256 !== undefined
      && (!/^[a-f0-9]{64}$/u.test(expectedNativeSourceSha256)
        || build.sourceSha256 !== expectedNativeSourceSha256)) {
      throw coded(
        "native swap source differs from its frozen expected SHA-256",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    if (sourceBytes.length !== observedBuildContract.source.bytes
      || build.sourceSha256 !== observedBuildContract.source.sha256) {
      throw coded(
        "native swap source changed after build-contract observation",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    build.sourceNode = await writeSyncedExclusive(sourceCopy, sourceBytes, 0o600);
    await execFile(
      "/usr/bin/xcrun",
      [
        "--sdk",
        "macosx",
        "clang",
        ...NATIVE_COMPILE_ARGUMENTS,
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
    const executableBytes = await readFile(executable);
    build.executableSha256 = createHash("sha256").update(executableBytes).digest("hex");
    const afterBuildContract =
      await describeDarwinAtomicDirectorySwapBuildContract();
    if (!isDeepStrictEqual(afterBuildContract, observedBuildContract)) {
      throw coded(
        "native swap source or toolchain changed while compiling the helper",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    build.nativeBuild = Object.freeze({
      schemaVersion: NATIVE_BUILD_RECEIPT_SCHEMA,
      source: Object.freeze({...observedBuildContract.source}),
      compiler: Object.freeze({...observedBuildContract.compiler}),
      compile: Object.freeze({
        driver: observedBuildContract.compile.driver,
        sdk: observedBuildContract.compile.sdk,
        arguments: Object.freeze([...observedBuildContract.compile.arguments]),
      }),
      executable: Object.freeze({
        bytes: executableBytes.length,
        sha256: build.executableSha256,
      }),
    });
    if (expectedNativeBuildReceipt !== undefined
      && !isDeepStrictEqual(build.nativeBuild, expectedNativeBuildReceipt)) {
      throw coded(
        "compiled native swap helper differs from the prepared executable witness",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
    }
    await validateNativeBuildArtifacts(build);
    return build;
  } catch (error) {
    const cleanupWarning = await cleanupNativeHelper(build);
    if (cleanupWarning) error.cleanupWarning = cleanupWarning;
    if (!error.code) error.code = DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE;
    throw error;
  }
}

export async function buildDarwinAtomicDirectorySwapNativeWitness({
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
} = {}) {
  assertDarwinAtomicDirectorySwapSupported(process.platform);
  let build;
  let result;
  let buildError;
  try {
    build = await buildNativeHelper({
      expectedNativeSourceSha256,
      expectedNativeBuildContract,
    });
    result = build.nativeBuild;
  } catch (error) {
    buildError = error;
  }
  const cleanupWarning = await cleanupNativeHelper(build);
  if (cleanupWarning) {
    const cleanupError = coded(
      `native-helper witness cleanup identity is uncertain: ${cleanupWarning}`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      buildError ? {cause: buildError} : undefined,
    );
    cleanupError.cleanupWarning = cleanupWarning;
    throw cleanupError;
  }
  if (buildError) throw buildError;
  return result;
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

async function observeRegularFileSwapState(bound) {
  try {
    const first = await snapshotRegularFile(
      path.join(bound.parent.resolved, bound.firstName),
      "post-swap firstFile",
    );
    const second = await snapshotRegularFile(
      path.join(bound.parent.resolved, bound.secondName),
      "post-swap secondFile",
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

export function nativeFailureCodeForObservedState(state) {
  return state === "unchanged"
    ? DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE
    : DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN;
}

async function invokeNativeHelper(build, bound, {
  entryKind = "directory",
  observe = observeSwapState,
} = {}) {
  await validateNativeBuildArtifacts(build);
  let stdout;
  let executionError;
  try {
    ({stdout} = await execFile(
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
        entryKind,
      ],
      {
        encoding: "utf8",
        env: CLEAN_ENVIRONMENT,
        maxBuffer: 64 * 1024,
        timeout: 30_000,
      },
    ));
  } catch (error) {
    executionError = error;
  }
  let postExecutionValidationError;
  try {
    await validateNativeBuildArtifacts(build);
  } catch (error) {
    postExecutionValidationError = error;
  }
  if (executionError || postExecutionValidationError) {
    const observed = await observe(bound);
    // Only an exact unchanged observation proves that the native helper did
    // not commit. Any swapped or indeterminate observation is forward-uncertain
    // and must never be retried as though no mutation occurred.
    const code = postExecutionValidationError
      ? DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN
      : nativeFailureCodeForObservedState(observed.state);
    const stderr = typeof executionError?.stderr === "string"
      ? executionError.stderr.trim()
      : "";
    const wrapped = coded(
      `native Darwin directory swap failed; observed state=${observed.state}`
        + `${postExecutionValidationError
          ? `; helper identity after execution: ${postExecutionValidationError.message}`
          : ""}${stderr ? `; ${stderr}` : ""}`,
      code,
      {cause: executionError ?? postExecutionValidationError},
    );
    wrapped.observedState = observed;
    throw wrapped;
  }
  let receipt;
  try {
    receipt = JSON.parse(stdout);
  } catch (error) {
    const observed = await observe(bound);
    const wrapped = coded(
      `native Darwin directory swap returned invalid JSON; observed state=${observed.state}`,
      nativeFailureCodeForObservedState(observed.state),
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
  expectedFirstNode,
  expectedSecondNode,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
} = {}) {
  assertDarwinAtomicDirectorySwapSupported(process.platform);
  const bound = await preflight({
    allowedParent,
    firstDirectory,
    secondDirectory,
    expectedFirstNode,
    expectedSecondNode,
  });
  let build;
  let operationResult;
  let operationError;
  try {
    build = await buildNativeHelper({
      expectedNativeSourceSha256,
      expectedNativeBuildContract,
      expectedNativeBuildReceipt,
    });
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
      nativeBuild: build.nativeBuild,
    };
  } catch (error) {
    operationError = error;
  }

  const cleanupWarning = await cleanupNativeHelper(build);
  if (cleanupWarning) {
    const cleanupError = coded(
      `native-helper cleanup identity is uncertain: ${cleanupWarning}`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
      operationError ? {cause: operationError} : undefined,
    );
    cleanupError.cleanupWarning = cleanupWarning;
    throw cleanupError;
  }
  if (operationError) {
    throw operationError;
  }
  return Object.freeze({...operationResult, cleanupWarning: null});
}

/**
 * Atomically exchanges exactly two existing sibling single-link regular files.
 * Expected inode identities are checked during JS and native preflight, and
 * the exact exchanged identities are verified after renameatx_np. Darwin does
 * not expose an inode-comparison operand on RENAME_SWAP, so a replacement in
 * the final pathname race window is reported as commit-uncertain after the
 * exchange; both inodes remain retained at the two explicit paths.
 */
export async function atomicSwapSiblingRegularFilesDarwin({
  allowedParent,
  firstFile,
  secondFile,
  expectedFirstNode,
  expectedSecondNode,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
} = {}) {
  assertDarwinAtomicDirectorySwapSupported(process.platform);
  const bound = await preflightRegularFiles({
    allowedParent,
    firstFile,
    secondFile,
    expectedFirstNode,
    expectedSecondNode,
  });
  let build;
  let operationResult;
  let operationError;
  try {
    build = await buildNativeHelper({
      expectedNativeSourceSha256,
      expectedNativeBuildContract,
      expectedNativeBuildReceipt,
    });
    const nativeReceipt = await invokeNativeHelper(build, bound, {
      entryKind: "regular-file",
      observe: observeRegularFileSwapState,
    });
    const observed = await observeRegularFileSwapState(bound);
    if (observed.state !== "swapped") {
      const error = coded(
        `Darwin regular-file swap postcondition failed; observed state=${observed.state}`,
        DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
      );
      error.observedState = observed;
      throw error;
    }
    operationResult = {
      status: "swapped-and-parent-fsynced",
      allowedParent: bound.parent.resolved,
      firstFile: path.join(bound.parent.resolved, bound.firstName),
      secondFile: path.join(bound.parent.resolved, bound.secondName),
      before: {first: bound.first.node, second: bound.second.node},
      after: {first: observed.first.node, second: observed.second.node},
      native: nativeReceipt,
      nativeSourceSha256: build.sourceSha256,
      nativeBuild: build.nativeBuild,
    };
  } catch (error) {
    operationError = error;
  }
  const cleanupWarning = await cleanupNativeHelper(build);
  if (cleanupWarning) {
    const cleanupError = coded(
      `native-helper cleanup identity is uncertain: ${cleanupWarning}`,
      DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
      operationError ? {cause: operationError} : undefined,
    );
    cleanupError.cleanupWarning = cleanupWarning;
    throw cleanupError;
  }
  if (operationError) {
    throw operationError;
  }
  return Object.freeze({...operationResult, cleanupWarning: null});
}

export const DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH =
  NATIVE_SOURCE_PATH;
