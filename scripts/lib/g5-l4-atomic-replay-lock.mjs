import {execFile as execFileCallback, spawn} from "node:child_process";
import {lstat, mkdtemp, readFile, realpath, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NATIVE_SOURCE = path.resolve(MODULE_DIRECTORY, "../native/g5-l4-atomic-replay-lock.c");

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 atomic replay lock: ${message}`);
}

function sameIdentity(left, right) {
  return left.device === right.device && left.inode === right.inode;
}

async function rootIdentity(root) {
  const absolute = path.resolve(root);
  invariant(await realpath(absolute) === absolute, "replay-lock root contains a symbolic-link ancestor");
  const info = await lstat(absolute, {bigint: true});
  invariant(info.isDirectory() && !info.isSymbolicLink() && (info.mode & 0o777n) === 0o700n,
    "replay-lock root must be one real 0700 directory");
  return Object.freeze({device: info.dev.toString(), inode: info.ino.toString()});
}

async function compileNativeHelper() {
  invariant(process.platform === "darwin", "openat(O_EXCL) helper is available only on macOS");
  const sourceBefore = await lstat(NATIVE_SOURCE, {bigint: true});
  invariant(sourceBefore.isFile() && !sourceBefore.isSymbolicLink() && sourceBefore.nlink === 1n,
    "native replay-lock source must be one ordinary non-linked file");
  const sourceBytes = await readFile(NATIVE_SOURCE);
  const sourceAfter = await lstat(NATIVE_SOURCE, {bigint: true});
  invariant(sourceAfter.dev === sourceBefore.dev && sourceAfter.ino === sourceBefore.ino
    && sourceAfter.size === BigInt(sourceBytes.length) && sourceAfter.mtimeNs === sourceBefore.mtimeNs,
  "native replay-lock source changed while read");
  const buildRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l4-replay-lock-"));
  const executable = path.join(buildRoot, "create-replay-lock");
  try {
    await execFile("/usr/bin/cc", [
      "-std=c11", "-Wall", "-Wextra", "-Werror", "-Os", NATIVE_SOURCE, "-o", executable,
    ], {encoding: "utf8", timeout: 30_000});
    return {buildRoot, executable};
  } catch (error) {
    await rm(buildRoot, {recursive: true, force: true}).catch(() => {});
    throw error;
  }
}

function runNativeHelper(executable, args, bytes) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {stdio: ["pipe", "pipe", "pipe"]});
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      const output = Buffer.concat(stdout).toString("utf8");
      const errorOutput = Buffer.concat(stderr).toString("utf8").trim();
      if (code !== 0) {
        const error = new Error(
          `native openat(O_EXCL) CAS failed closed: ${errorOutput || `code=${code} signal=${signal}`}`,
        );
        error.code = errorOutput.includes("File exists") ? "EEXIST" : "EREPLAYROOT";
        reject(error);
      } else resolve(output);
    });
    child.stdin.end(bytes);
  });
}

export async function snapshotReplayRootIdentity(root) {
  return rootIdentity(root);
}

export async function createAtomicReplayLock({
  replayRoot,
  lockLeaf,
  bytes,
  expectedRootIdentity,
  beforeCommitHook = null,
}) {
  invariant(Buffer.isBuffer(bytes) && bytes.length > 0, "replay-lock bytes must be a non-empty Buffer");
  invariant(/^[a-f0-9]{64}\.lock\.json$/u.test(lockLeaf || ""), "replay-lock leaf is invalid");
  const rootBefore = await rootIdentity(replayRoot);
  invariant(sameIdentity(rootBefore, expectedRootIdentity), "replay-lock root changed before native CAS");
  const native = await compileNativeHelper();
  try {
    if (beforeCommitHook) await beforeCommitHook({replayRoot, rootIdentity: rootBefore, lockLeaf});
    const output = await runNativeHelper(native.executable, [
      replayRoot,
      lockLeaf,
      rootBefore.device,
      rootBefore.inode,
    ], bytes);
    const result = JSON.parse(output);
    invariant(result.bytes === bytes.length, "native replay-lock byte count drifted");
    const rootAfter = await rootIdentity(replayRoot);
    invariant(sameIdentity(rootAfter, rootBefore), "replay-lock root changed during native CAS");
    return Object.freeze({
      primitive: "openat(O_CREAT|O_EXCL|O_NOFOLLOW)",
      rootIdentity: rootAfter,
      lockIdentity: Object.freeze({device: result.device, inode: result.inode}),
      bytes: result.bytes,
    });
  } finally {
    await rm(native.buildRoot, {recursive: true, force: true}).catch(() => {});
  }
}
