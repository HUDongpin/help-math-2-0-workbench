import {execFile as execFileCallback} from "node:child_process";
import {lstat, mkdir, mkdtemp, readFile, realpath, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NATIVE_SOURCE = path.resolve(
  MODULE_DIRECTORY,
  "../native/g5-l4-atomic-directory-publish.c",
);

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 atomic directory publication: ${message}`);
}

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function lstatOrNull(target) {
  return lstat(target, {bigint: true}).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
}

function identityFromStat(info) {
  return Object.freeze({device: info.dev.toString(), inode: info.ino.toString()});
}

function sameIdentity(left, right) {
  return left.device === right.device && left.inode === right.inode;
}

export async function assertRealDirectoryAncestors(directory) {
  const absolute = path.resolve(directory);
  invariant(path.isAbsolute(absolute), "directory must be absolute");
  const parsed = path.parse(absolute);
  let cursor = parsed.root;
  const components = absolute.slice(parsed.root.length).split(path.sep).filter(Boolean);
  const rootInfo = await lstat(cursor, {bigint: true});
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), "filesystem root is not a real directory");
  for (const component of components) {
    cursor = path.join(cursor, component);
    const info = await lstat(cursor, {bigint: true});
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      `ancestor is missing, non-directory, or symbolic link: ${cursor}`);
  }
  const resolved = await realpath(absolute);
  invariant(resolved === absolute, `directory contains an aliased or symbolic-link ancestor: ${absolute}`);
  const finalInfo = await lstat(absolute, {bigint: true});
  return identityFromStat(finalInfo);
}

export async function ensureRealDirectoryPath({anchorDirectory, directory, mode = 0o700}) {
  const anchor = path.resolve(anchorDirectory);
  const target = path.resolve(directory);
  invariant(isContained(anchor, target), `directory escapes its creation anchor: ${target}`);
  await assertRealDirectoryAncestors(anchor);
  const relative = path.relative(anchor, target);
  let cursor = anchor;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let info = await lstatOrNull(cursor);
    if (!info) {
      try {
        await mkdir(cursor, {mode});
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      info = await lstatOrNull(cursor);
    }
    invariant(info?.isDirectory() && !info.isSymbolicLink(),
      `created path component is not one real directory: ${cursor}`);
  }
  return assertRealDirectoryAncestors(target);
}

export async function ensureRealDirectoryPathFromNearestExistingAncestor(directory, mode = 0o700) {
  const target = path.resolve(directory);
  let anchor = target;
  while (await lstatOrNull(anchor) === null) {
    const next = path.dirname(anchor);
    invariant(next !== anchor, `cannot find an existing creation anchor for ${target}`);
    anchor = next;
  }
  await assertRealDirectoryAncestors(anchor);
  return ensureRealDirectoryPath({anchorDirectory: anchor, directory: target, mode});
}

async function compileNativePublisher() {
  invariant(process.platform === "darwin", "RENAME_EXCL publisher is available only on macOS");
  const sourceInfo = await lstat(NATIVE_SOURCE, {bigint: true});
  invariant(sourceInfo.isFile() && !sourceInfo.isSymbolicLink() && sourceInfo.nlink === 1n,
    "native publisher source must be one ordinary non-linked file");
  const sourceBytes = await readFile(NATIVE_SOURCE);
  const sourceAfter = await lstat(NATIVE_SOURCE, {bigint: true});
  invariant(sourceAfter.dev === sourceInfo.dev && sourceAfter.ino === sourceInfo.ino
    && sourceAfter.size === BigInt(sourceBytes.length) && sourceAfter.mtimeNs === sourceInfo.mtimeNs,
  "native publisher source changed while read");
  const buildRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l4-atomic-publish-"));
  const executable = path.join(buildRoot, "publish-directory");
  try {
    await execFile("/usr/bin/cc", [
      "-std=c11",
      "-Wall",
      "-Wextra",
      "-Werror",
      "-Os",
      NATIVE_SOURCE,
      "-o",
      executable,
    ], {encoding: "utf8", timeout: 30_000});
    const executableInfo = await lstat(executable, {bigint: true});
    invariant(executableInfo.isFile() && !executableInfo.isSymbolicLink()
      && executableInfo.nlink === 1n && (executableInfo.mode & 0o111n) !== 0n,
    "compiled native publisher is not one executable ordinary file");
    return {buildRoot, executable};
  } catch (error) {
    await rm(buildRoot, {recursive: true, force: true}).catch(() => {});
    throw error;
  }
}

export async function atomicPublishDirectoryNoReplace({
  temporaryPath,
  targetPath,
  beforePublishHook = null,
}) {
  const temporary = path.resolve(temporaryPath);
  const target = path.resolve(targetPath);
  const parent = path.dirname(target);
  invariant(path.dirname(temporary) === parent,
    "staged and target directories must be direct children of the same parent");
  const temporaryLeaf = path.basename(temporary);
  const targetLeaf = path.basename(target);
  invariant(!["", ".", ".."].includes(temporaryLeaf) && !["", ".", ".."].includes(targetLeaf),
    "staged and target leaves must be safe");
  const parentIdentity = await assertRealDirectoryAncestors(parent);
  const parentInfo = await lstat(parent, {bigint: true});
  invariant(parentInfo.uid === BigInt(process.geteuid()) && (parentInfo.mode & 0o077n) === 0n,
    "publication parent must be owned by the current effective user and inaccessible to group/other writers");
  const temporaryInfo = await lstat(temporary, {bigint: true});
  invariant(temporaryInfo.isDirectory() && !temporaryInfo.isSymbolicLink(),
    "staged source must be one real directory");
  invariant(temporaryInfo.uid === BigInt(process.geteuid()) && (temporaryInfo.mode & 0o022n) === 0n,
    "staged source must be owned by the current effective user and not writable by group/other users");
  const temporaryIdentity = identityFromStat(temporaryInfo);
  invariant(await lstatOrNull(target) === null, "publication target already exists");

  const native = await compileNativePublisher();
  try {
    if (beforePublishHook) await beforePublishHook({parent, parentIdentity, temporary, target});
    let result;
    try {
      result = await execFile(native.executable, [
        parent,
        temporaryLeaf,
        targetLeaf,
        parentIdentity.device,
        parentIdentity.inode,
        temporaryIdentity.device,
        temporaryIdentity.inode,
      ], {encoding: "utf8", timeout: 30_000});
    } catch (error) {
      const detail = String(error.stderr || error.message || error).trim();
      throw new Error(`native RENAME_EXCL commit failed closed: ${detail}`);
    }
    const committedIdentity = JSON.parse(result.stdout);
    invariant(sameIdentity(committedIdentity, temporaryIdentity),
      "native publisher returned a different committed directory identity");
    const parentAfter = await assertRealDirectoryAncestors(parent);
    invariant(sameIdentity(parentAfter, parentIdentity), "publication parent changed during commit");
    const targetInfo = await lstat(target, {bigint: true});
    invariant(targetInfo.isDirectory() && !targetInfo.isSymbolicLink()
      && sameIdentity(identityFromStat(targetInfo), temporaryIdentity),
    "committed target does not preserve the staged directory identity");
    invariant(await lstatOrNull(temporary) === null, "staged leaf still exists after commit");
    return Object.freeze({
      primitive: "renameatx_np(RENAME_EXCL)",
      parentIdentity,
      committedIdentity: identityFromStat(targetInfo),
    });
  } finally {
    await rm(native.buildRoot, {recursive: true, force: true}).catch(() => {});
  }
}

export async function directoryIdentityStillMatches(directory, expectedIdentity) {
  try {
    const actual = await assertRealDirectoryAncestors(directory);
    return sameIdentity(actual, expectedIdentity);
  } catch {
    return false;
  }
}
