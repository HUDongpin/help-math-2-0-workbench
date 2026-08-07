import childProcess from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";

import {
  assertValidatedLessonAnimateExecutionCodeClosureStillBound,
  getValidatedLessonAnimateExecutionCodeClosureContext,
  getValidatedLessonAnimateReplayLockHelperDescriptor,
} from "./lesson-animate-execution-code-closure.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
} from "./lesson-animate-production-trust.mjs";

export const LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES = 1_048_576;
export const LESSON_ANIMATE_REPLAY_LOCK_ATOMIC_PRIMITIVE =
  "openat(O_CREAT|O_EXCL|O_NOFOLLOW|O_CLOEXEC)";
export const LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS = 5_000;
export const LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS = 500;
export const LESSON_ANIMATE_REPLAY_LOCK_HELPER_KILL_CONFIRM_MS = 1_000;

const INPUT_KEYS = Object.freeze([
  "receiptBytes",
  "replayRoot",
  "validatedCodeClosureToken",
]);
const RESULT_PATTERN =
  /^\{"bytes":(0|[1-9][0-9]*),"device":"(0|[1-9][0-9]*)","inode":"(0|[1-9][0-9]*)"\}\n$/u;
const MAX_STDOUT_BYTES = 4_096;
const MAX_STDERR_BYTES = 65_536;
const INHERITED_HELPER_FD = 3;
const PRODUCTION_TRUSTED_ANCESTOR = "/Library";
const execFileAsync = promisify(childProcess.execFile);

// These codes are part of the native-helper protocol. Error classification is
// never inferred from locale-dependent stderr text.
const HELPER_EXIT_CODES = Object.freeze(new Map([
  [64, "EHELPERUSAGE"],
  [65, "ERECEIPT"],
  [73, "EEXIST"],
  [74, "EATOMICREPLAYIO"],
  [75, "EREPLAYROOT"],
  [76, "EATOMICREPLAYCOMMIT"],
  [77, "EHELPERBINDING"],
]));

const AUTHORITY_BOUNDARY = Object.freeze({
  animateExecution: false,
  originalRuntimeBehavior: false,
  ruffleBaseline: false,
  audioCueAcceptance: false,
  javascriptFidelity: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
  wholeLessonIntegration: false,
  publication: false,
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`Lesson Animate prebuilt atomic replay lock: ${message}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function errorWithCode(message, code) {
  const error = new Error(`Lesson Animate prebuilt atomic replay lock: ${message}`);
  error.code = code;
  return error;
}

function assertExactPlainObject(value, expectedKeys, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  invariant(Object.getPrototypeOf(value) === Object.prototype,
    `${label} must be a plain object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  invariant(actual.length === expected.length
    && actual.every((key, index) => key === expected[index]),
  `${label} keys do not match the fixed schema`);
}

function snapshotReceipt(options, label) {
  // This function is intentionally synchronous. The mutable caller-owned
  // Buffer is copied before this module reaches its first await.
  assertExactPlainObject(options, INPUT_KEYS, label);
  const {receiptBytes} = options;
  invariant(Buffer.isBuffer(receiptBytes), "receiptBytes must be a Buffer");
  invariant(!(typeof SharedArrayBuffer === "function"
    && receiptBytes.buffer instanceof SharedArrayBuffer),
  "receiptBytes may not be backed by SharedArrayBuffer");
  const snapshot = Buffer.from(receiptBytes);
  invariant(snapshot.length > 0, "receiptBytes must not be empty");
  invariant(snapshot.length <= LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES,
    `receiptBytes exceeds ${LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES} bytes`);
  return snapshot;
}

function identityAndVersion(info) {
  return Object.freeze({
    device: info.dev,
    inode: info.ino,
    size: info.size,
    mode: info.mode,
    links: info.nlink,
    uid: info.uid,
    gid: info.gid,
    mtimeNs: info.mtimeNs,
    ctimeNs: info.ctimeNs,
  });
}

function sameIdentityAndVersion(left, right) {
  return left.device === right.device
    && left.inode === right.inode
    && left.size === right.size
    && left.mode === right.mode
    && left.links === right.links
    && left.uid === right.uid
    && left.gid === right.gid
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs;
}

function stableRootIdentity(info) {
  return Object.freeze({
    device: info.dev.toString(),
    inode: info.ino.toString(),
    mode: Number(info.mode & 0o7777n).toString(8).padStart(4, "0"),
    links: info.nlink.toString(),
    uid: info.uid.toString(),
    gid: info.gid.toString(),
  });
}

function sameRootIdentity(left, right) {
  return left.device === right.device
    && left.inode === right.inode
    && left.mode === right.mode
    && left.uid === right.uid
    && left.gid === right.gid;
}

function assertRootMetadata(info) {
  invariant(info.isDirectory() && !info.isSymbolicLink(),
    "replay root must be one real directory");
  invariant((info.mode & 0o7777n) === 0o700n,
    "replay root must have exact mode 0700");
  invariant(info.nlink >= 1n, "replay root link metadata is invalid");
}

async function stableReplayRoot(replayRoot, {aclProbe} = {}) {
  invariant(typeof replayRoot === "string" && path.isAbsolute(replayRoot),
    "replayRoot must be absolute");
  invariant(path.resolve(replayRoot) === replayRoot,
    "replayRoot must be normalized");
  invariant(Number.isInteger(fsConstants.O_DIRECTORY)
    && Number.isInteger(fsConstants.O_NOFOLLOW),
  "required directory no-follow flags are unavailable");

  const rootRealBefore = await realpath(replayRoot);
  invariant(rootRealBefore === replayRoot,
    "replay root or one of its ancestors is a symbolic link");
  const before = await lstat(replayRoot, {bigint: true});
  assertRootMetadata(before);

  const handle = await open(
    replayRoot,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
  );
  try {
    const descriptorBefore = await handle.stat({bigint: true});
    assertRootMetadata(descriptorBefore);
    invariant(sameIdentityAndVersion(identityAndVersion(before),
      identityAndVersion(descriptorBefore)),
      "replay root changed between lstat and descriptor open");

    if (aclProbe !== undefined) await assertNoExtendedAcl(replayRoot, aclProbe);

    const descriptorAfter = await handle.stat({bigint: true});
    assertRootMetadata(descriptorAfter);
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorBefore),
      identityAndVersion(descriptorAfter)),
    "replay root changed while its ACL was inspected");
    const after = await lstat(replayRoot, {bigint: true});
    assertRootMetadata(after);
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorAfter),
      identityAndVersion(after)),
    "replay root changed while its descriptor was verified");
    invariant(await realpath(replayRoot) === replayRoot,
      "replay root became or acquired a symbolic-link ancestor");
    return stableRootIdentity(after);
  } finally {
    await handle.close();
  }
}

function assertDisjointPaths(left, right, label) {
  const leftToRight = path.relative(left, right);
  const rightToLeft = path.relative(right, left);
  const contains = (relative) => relative === ""
    || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
  invariant(!contains(leftToRight) && !contains(rightToLeft), label);
}

function validateHelperDescriptor(descriptor, {production}) {
  assertExactPlainObject(descriptor, ["bytes", "file", "mode", "sha256"],
    "replay helper descriptor");
  invariant(typeof descriptor.file === "string" && descriptor.file.length > 0,
    "replay helper descriptor file is missing");
  if (production) {
    invariant(descriptor.file === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
      "production replay helper is not the fixed external helper path");
    invariant(descriptor.mode === "0555",
      "production replay helper descriptor mode must be exactly 0555");
  } else {
    invariant(!descriptor.file.includes("\\") && !path.posix.isAbsolute(descriptor.file),
      "diagnostic replay helper descriptor must be project-relative and portable");
    invariant(path.posix.normalize(descriptor.file) === descriptor.file
      && descriptor.file !== "." && descriptor.file !== ".."
      && !descriptor.file.startsWith("../") && !descriptor.file.includes("/../"),
    "diagnostic replay helper descriptor escapes the project");
  }
  invariant(Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0,
    "replay helper descriptor byte count is invalid");
  invariant(/^[a-f0-9]{64}$/u.test(descriptor.sha256),
    "replay helper descriptor SHA-256 is invalid");
  invariant(/^[0-7]{4}$/u.test(descriptor.mode),
    "replay helper descriptor mode is invalid");
  invariant((Number.parseInt(descriptor.mode, 8) & 0o111) !== 0,
    "replay helper descriptor is not executable");
}

function assertOrdinarySingleLinkExecutable(info, {production}) {
  invariant(info.isFile() && !info.isSymbolicLink(),
    "replay helper must be an ordinary file");
  invariant(info.nlink === 1n, "replay helper must have exactly one physical link");
  invariant((info.mode & 0o111n) !== 0n, "replay helper must remain executable");
  if (production) {
    invariant(info.uid === 0n, "production replay helper must be owned by root");
    invariant((info.mode & 0o7777n) === 0o555n,
      "production replay helper must have exact mode 0555");
  }
}

function productionPathChain() {
  const relative = path.relative(
    PRODUCTION_TRUSTED_ANCESTOR,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  );
  invariant(relative && !path.isAbsolute(relative)
    && relative !== ".." && !relative.startsWith(`..${path.sep}`),
  "fixed production replay helper escapes /Library");
  const result = [PRODUCTION_TRUSTED_ANCESTOR];
  let cursor = PRODUCTION_TRUSTED_ANCESTOR;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    result.push(cursor);
  }
  return result;
}

function aclOutputHasExtendedAcl(output, candidate) {
  invariant(typeof output === "string", `ACL inspection output is invalid for ${candidate}`);
  const lines = output.split(/\r?\n/u);
  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
  invariant(firstLineIndex >= 0, `ACL inspection returned no record for ${candidate}`);
  const firstLine = lines[firstLineIndex];
  const modeToken = firstLine.trimStart().split(/\s+/u)[0];
  invariant(/^[dl-][rwxstST-]{9}[@+]?$/u.test(modeToken),
    `ACL inspection returned an unrecognized mode for ${candidate}`);
  // Darwin may expose an ACL either through the trailing '+' mode marker or
  // through numbered entries on subsequent `ls -ldeO` lines. A bare '@'
  // marks extended attributes, not an ACL by itself.
  return modeToken.endsWith("+")
    || lines.slice(firstLineIndex + 1).some((line) => /^\s*\d+:\s/u.test(line));
}

/** Diagnostic-only pure parser used to pin ACL-probe edge cases in tests. */
export function lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic(output) {
  return aclOutputHasExtendedAcl(output, "diagnostic ACL fixture");
}

async function assertNoExtendedAcl(candidate, aclProbe) {
  invariant(aclProbe === await realpath("/bin/ls"),
    "closure ACL probe is not the fixed /bin/ls realpath");
  const {stdout, stderr} = await execFileAsync(aclProbe, ["-ldeO", candidate], {
    encoding: "utf8",
    env: {LC_ALL: "C", LANG: "C", PATH: "/usr/bin:/bin"},
    maxBuffer: 65_536,
    timeout: 5_000,
  });
  invariant(stderr === "", `ACL inspection failed for ${candidate}`);
  invariant(!aclOutputHasExtendedAcl(stdout, candidate),
    `${candidate} may not carry an extended ACL`);
}

async function assertFixedProductionHelperPath(aclProbe) {
  const chain = productionPathChain();
  for (const [index, candidate] of chain.entries()) {
    const info = await lstat(candidate, {bigint: true});
    invariant(!info.isSymbolicLink(),
      `production replay helper chain contains a symbolic link: ${candidate}`);
    invariant(info.uid === 0n,
      `production replay helper chain is not root-owned: ${candidate}`);
    if (index === chain.length - 1) {
      assertOrdinarySingleLinkExecutable(info, {production: true});
    } else {
      invariant(info.isDirectory(),
        `production replay helper ancestor is not a directory: ${candidate}`);
      invariant((info.mode & 0o022n) === 0n,
        `production replay helper ancestor is group- or world-writable: ${candidate}`);
    }
    await assertNoExtendedAcl(candidate, aclProbe);
  }
  invariant(await realpath(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH)
    === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  "production replay helper path contains symbolic indirection");
}

async function readExactDescriptorBytes(handle, expectedSize) {
  invariant(Number.isSafeInteger(expectedSize) && expectedSize >= 0,
    "replay helper descriptor size is not safely readable");
  const bytes = Buffer.alloc(expectedSize);
  let offset = 0;
  while (offset < bytes.length) {
    const {bytesRead} = await handle.read(bytes, offset, bytes.length - offset, offset);
    invariant(bytesRead > 0, "replay helper ended before its descriptor size");
    offset += bytesRead;
  }
  const probe = Buffer.alloc(1);
  const {bytesRead: excess} = await handle.read(probe, 0, 1, expectedSize);
  invariant(excess === 0, "replay helper exceeds its descriptor size");
  return bytes;
}

async function openStableHelper(context, descriptor, {production}) {
  validateHelperDescriptor(descriptor, {production});
  const absolute = production
    ? LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH
    : path.resolve(context.projectRoot, ...descriptor.file.split("/"));
  if (!production) {
    const relative = path.relative(context.projectRoot, absolute).split(path.sep).join("/");
    invariant(relative === descriptor.file,
      "diagnostic replay helper descriptor does not resolve canonically below projectRoot");
  }
  invariant(await realpath(absolute) === absolute,
    "replay helper or one of its ancestors is a symbolic link");
  if (production) {
    const aclProbe = context.toolchainDescriptors?.aclProbe?.file;
    await assertFixedProductionHelperPath(aclProbe);
  }

  const before = await lstat(absolute, {bigint: true});
  assertOrdinarySingleLinkExecutable(before, {production});
  const handle = await open(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const descriptorBefore = await handle.stat({bigint: true});
    assertOrdinarySingleLinkExecutable(descriptorBefore, {production});
    invariant(sameIdentityAndVersion(identityAndVersion(before),
      identityAndVersion(descriptorBefore)),
    "replay helper changed between pathname and descriptor open");

    const bytes = await readExactDescriptorBytes(handle, descriptor.bytes);
    const descriptorAfter = await handle.stat({bigint: true});
    assertOrdinarySingleLinkExecutable(descriptorAfter, {production});
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorBefore),
      identityAndVersion(descriptorAfter)),
    "replay helper changed while descriptor bytes were read");

    const after = await lstat(absolute, {bigint: true});
    assertOrdinarySingleLinkExecutable(after, {production});
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorAfter),
      identityAndVersion(after)),
    "replay helper changed between descriptor read and final pathname check");
    invariant(await realpath(absolute) === absolute,
      "replay helper became or acquired a symbolic-link ancestor");

    const actualMode = Number(after.mode & 0o7777n).toString(8).padStart(4, "0");
    invariant(bytes.length === descriptor.bytes,
      "replay helper byte count differs from the rebound descriptor");
    invariant(sha256(bytes) === descriptor.sha256,
      "replay helper SHA-256 differs from the rebound descriptor");
    invariant(actualMode === descriptor.mode,
      "replay helper mode differs from the rebound descriptor");
    return Object.freeze({
      absolute,
      handle,
      production,
      descriptor,
      identity: identityAndVersion(after),
      aclProbe: context.toolchainDescriptors?.aclProbe?.file,
    });
  } catch (error) {
    await handle.close().catch(() => {});
    throw error;
  }
}

async function assertOpenedHelperStillBound(helper, phase) {
  const descriptorInfo = await helper.handle.stat({bigint: true});
  assertOrdinarySingleLinkExecutable(descriptorInfo, {production: helper.production});
  invariant(sameIdentityAndVersion(helper.identity, identityAndVersion(descriptorInfo)),
    `replay helper descriptor changed ${phase}`);
  const pathInfo = await lstat(helper.absolute, {bigint: true});
  assertOrdinarySingleLinkExecutable(pathInfo, {production: helper.production});
  invariant(sameIdentityAndVersion(helper.identity, identityAndVersion(pathInfo)),
    `replay helper pathname no longer identifies the opened helper ${phase}`);
  invariant(await realpath(helper.absolute) === helper.absolute,
    `replay helper acquired symbolic indirection ${phase}`);
  if (helper.production) await assertFixedProductionHelperPath(helper.aclProbe);
}

function helperExitError(code, signal, stderrText) {
  const protocolCode = Number.isInteger(code)
    ? (HELPER_EXIT_CODES.get(code) || "EHELPERUNKNOWNEXIT")
    : "EHELPERSIGNAL";
  const suffix = stderrText.length > 0 ? `; diagnostic stderr: ${stderrText}` : "";
  const error = errorWithCode(
    `native CAS failed closed (exit=${code ?? "null"}, signal=${signal ?? "null"})${suffix}`,
    protocolCode,
  );
  error.helperExitCode = code;
  error.helperSignal = signal;
  return error;
}

function superviseHelper(child) {
  let sendReceipt;
  const promise = new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let forcedFailure = null;
    let settled = false;
    let termTimer = null;
    let killConfirmTimer = null;

    const releaseChildResources = ({unrefHandle = false} = {}) => {
      for (const stream of [child.stdin, child.stdout, child.stderr]) {
        try {
          stream?.destroy?.();
        } catch {
          // Resource release is best-effort, but must not prevent bounded
          // rejection of an already kill-unconfirmed helper.
        }
      }
      if (unrefHandle) {
        try {
          child.unref?.();
        } catch {
          // Preserve the fail-closed terminal error even for a nonstandard
          // ChildProcess implementation that cannot be unrefed.
        }
      }
    };

    const clearTimers = () => {
      clearTimeout(timeoutTimer);
      if (termTimer) clearTimeout(termTimer);
      if (killConfirmTimer) clearTimeout(killConfirmTimer);
    };
    const rejectOnce = (error, {unrefHandle = false} = {}) => {
      if (settled) return;
      settled = true;
      clearTimers();
      releaseChildResources({unrefHandle});
      reject(error);
    };
    const terminate = (error) => {
      if (forcedFailure) return;
      forcedFailure = error;
      error.helperTerminationSignals = ["SIGTERM", "SIGKILL"];
      child.kill("SIGTERM");
      termTimer = setTimeout(() => {
        if (settled) return;
        child.kill("SIGKILL");
        killConfirmTimer = setTimeout(() => {
          const unconfirmed = errorWithCode(
            "helper did not confirm exit after SIGTERM and SIGKILL",
            "EHELPERKILLUNCONFIRMED",
          );
          unconfirmed.helperTerminationSignals = ["SIGTERM", "SIGKILL"];
          rejectOnce(unconfirmed, {unrefHandle: true});
        }, LESSON_ANIMATE_REPLAY_LOCK_HELPER_KILL_CONFIRM_MS);
        killConfirmTimer.unref?.();
      }, LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS);
      termTimer.unref?.();
    };
    const timeoutTimer = setTimeout(() => {
      terminate(errorWithCode(
        `helper exceeded fixed ${LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS} ms timeout`,
        "EHELPERTIMEOUT",
      ));
    }, LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS);
    timeoutTimer.unref?.();

    child.once("error", (error) => rejectOnce(error));
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_STDOUT_BYTES) {
        terminate(errorWithCode("helper stdout exceeds its fixed limit", "EHELPEROUTPUT"));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_STDERR_BYTES) {
        terminate(errorWithCode("helper stderr exceeds its fixed limit", "EHELPEROUTPUT"));
        return;
      }
      stderr.push(chunk);
    });
    child.stdin.on("error", (error) => {
      const wrapped = errorWithCode(`helper stdin failed: ${error.message}`, "EHELPERSTDIN");
      terminate(wrapped);
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8").trim();
      if (forcedFailure) return rejectOnce(forcedFailure);
      if (code !== 0) return rejectOnce(helperExitError(code, signal, stderrText));
      if (stderrText.length > 0) {
        return rejectOnce(errorWithCode(
          `successful helper emitted stderr: ${stderrText}`,
          "EHELPERPROTOCOL",
        ));
      }
      settled = true;
      clearTimers();
      resolve(stdoutText);
    });

    sendReceipt = (receiptBytes) => {
      if (settled || forcedFailure) return;
      try {
        child.stdin.end(receiptBytes);
      } catch (error) {
        terminate(errorWithCode(`helper stdin write failed: ${error.message}`, "EHELPERSTDIN"));
      }
    };
  });
  return Object.freeze({promise, sendReceipt: (bytes) => sendReceipt(bytes)});
}

/**
 * Diagnostic-only supervisor seam for deterministic child-lifecycle tests.
 * It grants no replay, execution, trust, or acceptance authority.
 */
export function superviseLessonAnimateReplayHelperDiagnostic(child) {
  return superviseHelper(child);
}

async function runStableHelper({helper, replayRoot, lockLeaf, rootIdentity, receiptBytes}) {
  invariant(process.platform === "darwin",
    "native replay helper execution is supported only on Darwin");
  let child;
  let supervisor;
  try {
    child = childProcess.spawn(helper.absolute, [
      replayRoot,
      lockLeaf,
      rootIdentity.device,
      rootIdentity.inode,
      helper.identity.device.toString(),
      helper.identity.inode.toString(),
      helper.identity.size.toString(),
      helper.descriptor.sha256,
    ], {
      cwd: path.parse(replayRoot).root,
      env: Object.freeze({LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"}),
      // fd 3 is the already-opened and hashed helper. The native binary
      // validates this descriptor before the CAS. Darwin fdescfs does not
      // permit Mach-O execution through /dev/fd, so production additionally
      // requires the fixed root-owned, no-ACL, non-writable pathname chain.
      stdio: ["pipe", "pipe", "pipe", helper.handle.fd],
    });
    supervisor = superviseHelper(child);
    // spawn(2)/posix_spawn(2) has synchronously selected the executable by the
    // time spawn returns. Do not release receipt bytes until path and fd still
    // identify the exact pre-opened object.
    await assertOpenedHelperStillBound(helper, "immediately after spawn");
    supervisor.sendReceipt(receiptBytes);
    const result = await supervisor.promise;
    await assertOpenedHelperStillBound(helper, "after helper exit");
    return result;
  } catch (error) {
    if (child && supervisor) {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"),
        LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS).unref?.();
      await supervisor.promise.catch(() => {});
    }
    throw error;
  } finally {
    await helper.handle.close().catch(() => {});
  }
}

function parseExactHelperResult(output, expectedBytes) {
  const match = RESULT_PATTERN.exec(output);
  invariant(match, "helper result is not the exact result JSON schema");
  const byteCount = Number(match[1]);
  invariant(Number.isSafeInteger(byteCount) && byteCount === expectedBytes,
    "helper result byte count differs from the receipt");
  return Object.freeze({
    bytes: byteCount,
    device: match[2],
    inode: match[3],
  });
}

async function verifyCommittedLock({replayRoot, lockLeaf, receiptBytes, helperResult}) {
  const lockPath = path.join(replayRoot, lockLeaf);
  invariant(path.dirname(lockPath) === replayRoot, "replay-lock leaf escapes replayRoot");
  invariant(await realpath(lockPath) === lockPath,
    "committed replay lock or one of its ancestors is a symbolic link");
  const before = await lstat(lockPath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(),
    "committed replay lock must be an ordinary file");
  invariant(before.nlink === 1n, "committed replay lock must have exactly one physical link");
  invariant((before.mode & 0o7777n) === 0o400n,
    "committed replay lock must have exact mode 0400");

  const handle = await open(lockPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const descriptorBefore = await handle.stat({bigint: true});
    invariant(sameIdentityAndVersion(identityAndVersion(before),
      identityAndVersion(descriptorBefore)),
    "committed replay lock changed between pathname and descriptor open");
    const actualBytes = await readExactDescriptorBytes(handle, receiptBytes.length);
    const descriptorAfter = await handle.stat({bigint: true});
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorBefore),
      identityAndVersion(descriptorAfter)),
    "committed replay lock changed while descriptor bytes were read");
    invariant(actualBytes.equals(receiptBytes),
      "committed replay lock bytes differ from the requested receipt");

    const after = await lstat(lockPath, {bigint: true});
    invariant(sameIdentityAndVersion(identityAndVersion(descriptorAfter),
      identityAndVersion(after)),
    "committed replay lock changed after descriptor verification");
    invariant(after.dev.toString() === helperResult.device
      && after.ino.toString() === helperResult.inode,
    "committed replay lock identity differs from helper result");
    return Object.freeze({
      path: lockPath,
      leaf: lockLeaf,
      device: after.dev.toString(),
      inode: after.ino.toString(),
      mode: "0400",
      links: "1",
      bytes: actualBytes.length,
      sha256: sha256(actualBytes),
    });
  } finally {
    await handle.close();
  }
}

function conservativeFailure(error, replayRoot, lockLeaf) {
  const failure = error instanceof Error ? error : new Error(String(error));
  Object.defineProperties(failure, {
    replayLockPath: {value: path.join(replayRoot, lockLeaf), enumerable: true},
    replayLockLeaf: {value: lockLeaf, enumerable: true},
    replayLockDisposition: {
      value: "if-created-sealed-never-delete-or-overwrite",
      enumerable: true,
    },
    retrySameLeafAllowed: {value: false, enumerable: true},
  });
  return failure;
}

async function createReplayLock(options, {production}) {
  // snapshotReceipt executes synchronously before the first await in this
  // async call, closing the mutable-Buffer race.
  const receiptBytes = snapshotReceipt(options,
    production ? "production replay-lock input" : "diagnostic replay-lock input");
  const {validatedCodeClosureToken, replayRoot} = options;
  const receiptSha256 = sha256(receiptBytes);
  const lockLeaf = `${receiptSha256}.lock.json`;

  if (production) {
    invariant(replayRoot === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
      "production replayRoot must be the fixed external replay root");
  }
  const reboundToken = await assertValidatedLessonAnimateExecutionCodeClosureStillBound(
    validatedCodeClosureToken,
  );
  const context = getValidatedLessonAnimateExecutionCodeClosureContext(reboundToken);
  if (production) {
    invariant(context.productionReplayLockHelperBound === true,
      "production execution requires a closure bound to the fixed production replay helper");
  } else {
    invariant(context.productionReplayLockHelperBound === false,
      "diagnostic entry requires a project-relative diagnostic replay helper");
  }
  const helperDescriptor = getValidatedLessonAnimateReplayLockHelperDescriptor(reboundToken);
  const aclProbe = context.toolchainDescriptors?.aclProbe?.file;
  const rootBefore = await stableReplayRoot(replayRoot, {aclProbe});
  assertDisjointPaths(context.projectRoot, replayRoot,
    "replayRoot and projectRoot must be external and disjoint");
  const helper = await openStableHelper(context, helperDescriptor, {production});

  let spawnAttempted = false;
  try {
    spawnAttempted = true;
    const output = await runStableHelper({
      helper,
      replayRoot,
      lockLeaf,
      rootIdentity: rootBefore,
      receiptBytes,
    });
    const helperResult = parseExactHelperResult(output, receiptBytes.length);
    const rootAfter = await stableReplayRoot(replayRoot, {aclProbe});
    invariant(sameRootIdentity(rootAfter, rootBefore),
      "replay root identity changed during native CAS");
    const lockIdentity = await verifyCommittedLock({
      replayRoot,
      lockLeaf,
      receiptBytes,
      helperResult,
    });
    const postCommitToken =
      await assertValidatedLessonAnimateExecutionCodeClosureStillBound(reboundToken);
    const postCommitContext =
      getValidatedLessonAnimateExecutionCodeClosureContext(postCommitToken);
    invariant(postCommitContext.productionReplayLockHelperBound === production,
      "closure helper authority changed after replay-lock commit");
    const postCommitHelperDescriptor =
      getValidatedLessonAnimateReplayLockHelperDescriptor(postCommitToken);
    return Object.freeze({
      ok: true,
      production,
      diagnosticOnly: !production,
      primitive: LESSON_ANIMATE_REPLAY_LOCK_ATOMIC_PRIMITIVE,
      bytes: receiptBytes.length,
      receiptSha256,
      replayRootIdentity: rootAfter,
      replayLockIdentity: lockIdentity,
      helperDescriptor: postCommitHelperDescriptor,
      helperExecutionBinding: production
        ? "fixed-root-owned-path+inherited-verified-fd+pre/post-spawn-identity"
        : "diagnostic-project-path+inherited-verified-fd+pre/post-spawn-identity",
      validatedCodeClosureToken: postCommitToken,
      authorityBoundary: AUTHORITY_BOUNDARY,
    });
  } catch (error) {
    if (spawnAttempted) throw conservativeFailure(error, replayRoot, lockLeaf);
    throw error;
  }
}

export async function createLessonAnimatePrebuiltAtomicReplayLock(options) {
  // The production function has no caller-selected helper or lock leaf and is
  // unusable with a diagnostic closure token.
  return createReplayLock(options, {production: true});
}

/**
 * Test/integration preparation only. This explicitly named diagnostic entry
 * can exercise a project-relative fixture helper, but every returned authority
 * bit is false and the result is permanently marked diagnosticOnly.
 */
export async function createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(options) {
  return createReplayLock(options, {production: false});
}
