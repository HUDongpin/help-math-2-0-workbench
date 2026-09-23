import { createHash, randomUUID } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  constants as fsConstants,
} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";

import { atomicSwapSiblingDirectoriesDarwin } from
  "./darwin-atomic-directory-swap.mjs";

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const execFile = promisify(execFileCallback);
const CLEAN_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Text(text) {
  return sha256Bytes(Buffer.from(text, "utf8"));
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === ""
    || (!relative.startsWith(`..${path.sep}`)
      && relative !== ".."
      && !path.isAbsolute(relative));
}

function portableRelativePath(value, label = "path") {
  invariant(typeof value === "string" && value.length > 0,
    `${label} must be a non-empty relative path`);
  invariant(!value.includes("\0") && !value.includes("\\"),
    `${label} contains a forbidden character`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(path.posix.normalize(value) === value,
    `${label} must already be POSIX-normalized`);
  invariant(value !== "." && value !== ".." && !value.startsWith("../"),
    `${label} escapes its root`);
  return value;
}

function caseFoldPathSegment(value) {
  return value.normalize("NFC").toLowerCase();
}

async function assertNoCaseFoldAlias(parent, segment, label) {
  const names = await readdir(parent);
  const wanted = caseFoldPathSegment(segment);
  const alias = names.find((name) => name !== segment
    && caseFoldPathSegment(name) === wanted);
  invariant(alias === undefined,
    `${label} has a case-insensitive path conflict: ${alias} versus ${segment}`);
}

function nodeIdentity(information) {
  return { dev: String(information.dev), ino: String(information.ino) };
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

async function pathKind(target) {
  try {
    const information = await lstat(target);
    if (information.isSymbolicLink()) return "symlink";
    if (information.isDirectory()) return "directory";
    if (information.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function fsyncDirectory(directory) {
  const handle = await open(directory, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function sha256Handle(handle) {
  const digest = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (true) {
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
    if (bytesRead === 0) break;
    digest.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return { sha256: digest.digest("hex"), bytes: position };
}

async function inspectRegularFileNoFollow(filePath, {
  expectedBytes,
  expectedSha256,
  requireSingleLink = false,
  requireReadOnly = false,
} = {}) {
  const atPathBefore = await lstat(filePath, { bigint: true });
  invariant(atPathBefore.isFile() && !atPathBefore.isSymbolicLink(),
    `Expected a real regular file: ${filePath}`);
  if (requireSingleLink) {
    invariant(atPathBefore.nlink === 1n, `Expected a single-link file: ${filePath}`);
  }
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const openedBefore = await handle.stat({ bigint: true });
    invariant(openedBefore.isFile()
      && sameNode(nodeIdentity(atPathBefore), nodeIdentity(openedBefore)),
    `File identity changed before hashing: ${filePath}`);
    const digest = await sha256Handle(handle);
    const openedAfter = await handle.stat({ bigint: true });
    const atPathAfter = await lstat(filePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(openedBefore), nodeIdentity(openedAfter))
      && sameNode(nodeIdentity(openedBefore), nodeIdentity(atPathAfter))
      && openedBefore.size === openedAfter.size
      && openedBefore.mtimeNs === openedAfter.mtimeNs,
      `File identity changed while hashing: ${filePath}`,
    );
    if (expectedBytes !== undefined) {
      invariant(digest.bytes === expectedBytes, `Byte mismatch: ${filePath}`);
    }
    if (expectedSha256 !== undefined) {
      invariant(digest.sha256 === expectedSha256, `SHA-256 mismatch: ${filePath}`);
    }
    const mode = Number(openedAfter.mode & 0o7777n);
    if (requireReadOnly) {
      invariant((mode & 0o222) === 0, `Expected a read-only file: ${filePath}`);
    }
    return {
      bytes: digest.bytes,
      sha256: digest.sha256,
      mode,
      mtimeNs: String(openedAfter.mtimeNs),
      nlink: Number(openedAfter.nlink),
      node: nodeIdentity(openedAfter),
    };
  } finally {
    await handle.close();
  }
}

function assertJsonArtifactReadPathStable({
  evidence,
  before,
  after,
  atPathAfter,
  filePath,
}) {
  invariant(sameNode(evidence.node, nodeIdentity(after))
    && sameNode(evidence.node, nodeIdentity(atPathAfter))
    && before.size === after.size
    && before.size === atPathAfter.size
    && before.mtimeNs === after.mtimeNs
    && before.mtimeNs === atPathAfter.mtimeNs
    && Number(after.mode & 0o7777n) === evidence.mode
    && Number(atPathAfter.mode & 0o7777n) === evidence.mode
    && Number(after.nlink) === evidence.nlink
    && Number(atPathAfter.nlink) === evidence.nlink,
  `JSON artifact changed while reading: ${filePath}`);
  return true;
}

async function readJsonArtifactNoFollow(filePath, options = {}) {
  const evidence = await inspectRegularFileNoFollow(filePath, options);
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({ bigint: true });
    invariant(sameNode(evidence.node, nodeIdentity(before)),
      `JSON artifact identity changed before read: ${filePath}`);
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    const atPathAfter = await lstat(filePath, { bigint: true });
    assertJsonArtifactReadPathStable({
      evidence,
      before,
      after,
      atPathAfter,
      filePath,
    });
    invariant(bytes.length === evidence.bytes && sha256Bytes(bytes) === evidence.sha256,
      `JSON artifact bytes changed after hashing: ${filePath}`);
    return {
      value: JSON.parse(bytes.toString("utf8")),
      text: bytes.toString("utf8"),
      evidence,
    };
  } finally {
    await handle.close();
  }
}

async function resolveContainedExistingFile(root, relative, label = "source file") {
  const safe = portableRelativePath(relative, label);
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} root is not a real directory`);
  const rootReal = await realpath(root);
  let current = rootReal;
  for (const [index, segment] of safe.split("/").entries()) {
    await assertNoCaseFoldAlias(current, segment, label);
    current = path.join(current, segment);
    const information = await lstat(current);
    invariant(!information.isSymbolicLink(), `${label} traverses a symbolic link: ${current}`);
    if (index < safe.split("/").length - 1) {
      invariant(information.isDirectory(), `${label} parent is not a directory: ${current}`);
    } else {
      invariant(information.isFile(), `${label} is not a regular file: ${current}`);
    }
  }
  const resolved = await realpath(current);
  invariant(isWithin(rootReal, resolved), `${label} resolves outside its root`);
  return current;
}

async function ensureContainedParent(root, relative, {
  directoryMode = 0o700,
  label = "destination",
} = {}) {
  const safe = portableRelativePath(relative, label);
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} root is not a real directory`);
  const rootReal = await realpath(root);
  const segments = safe.split("/");
  const filename = segments.pop();
  let current = rootReal;
  for (const segment of segments) {
    const currentInformation = await lstat(current);
    invariant(currentInformation.isDirectory() && !currentInformation.isSymbolicLink(),
      `${label} parent is unsafe: ${current}`);
    if ((currentInformation.mode & 0o200) === 0) {
      await chmod(current, (currentInformation.mode & 0o7777) | 0o200);
    }
    await assertNoCaseFoldAlias(current, segment, label);
    const next = path.join(current, segment);
    const kind = await pathKind(next);
    if (kind === "missing") {
      await mkdir(next, { mode: directoryMode });
      await fsyncDirectory(current);
    } else {
      invariant(kind === "directory", `${label} parent is not a real directory: ${next}`);
    }
    const information = await lstat(next);
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `${label} parent is unsafe: ${next}`);
    current = next;
  }
  const leafParentInformation = await lstat(current);
  if ((leafParentInformation.mode & 0o200) === 0) {
    await chmod(current, (leafParentInformation.mode & 0o7777) | 0o200);
  }
  const destination = path.join(current, filename);
  await assertNoCaseFoldAlias(current, filename, label);
  invariant(isWithin(rootReal, destination), `${label} escapes its root`);
  invariant(await pathKind(destination) === "missing",
    `${label} already exists; no-overwrite policy applies: ${safe}`);
  return destination;
}

async function assertMissingContainedDestination(root, relative, label = "destination") {
  const safe = portableRelativePath(relative, label);
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} root is not a real directory`);
  const rootReal = await realpath(root);
  let current = rootReal;
  const segments = safe.split("/");
  for (const [index, segment] of segments.entries()) {
    await assertNoCaseFoldAlias(current, segment, label);
    current = path.join(current, segment);
    const kind = await pathKind(current);
    if (kind === "missing") {
      return { state: "missing", path: current, firstMissingSegment: index };
    }
    invariant(kind !== "symlink", `${label} traverses a symbolic link: ${current}`);
    if (index < segments.length - 1) {
      invariant(kind === "directory", `${label} parent is not a directory: ${current}`);
    } else {
      throw new Error(`${label} already exists; no-overwrite policy applies: ${safe}`);
    }
  }
  invariant(isWithin(rootReal, current), `${label} escapes its root`);
  throw new Error(`${label} has an indeterminate state: ${safe}`);
}

async function copyRegularFileExclusive({
  sourcePath,
  destinationPath,
  bytes,
  sha256,
  destinationMode = 0o444,
  label = "copy",
}) {
  invariant(Number.isSafeInteger(bytes) && bytes >= 0, `${label} has invalid bytes`);
  invariant(SHA256_PATTERN.test(sha256), `${label} has invalid SHA-256`);
  const sourceAtPath = await lstat(sourcePath, { bigint: true });
  invariant(sourceAtPath.isFile() && !sourceAtPath.isSymbolicLink(),
    `${label} source is not a regular file`);
  invariant(Number(sourceAtPath.size) === bytes, `${label} source byte mismatch`);
  const sourceHandle = await open(sourcePath, fsConstants.O_RDONLY | NOFOLLOW);
  let destinationHandle;
  try {
    const sourceBefore = await sourceHandle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(sourceAtPath), nodeIdentity(sourceBefore)),
      `${label} source identity changed`);
    destinationHandle = await open(
      destinationPath,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
      0o600,
    );
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let readPosition = 0;
    let writePosition = 0;
    while (true) {
      const { bytesRead } = await sourceHandle.read(buffer, 0, buffer.length, readPosition);
      if (bytesRead === 0) break;
      digest.update(buffer.subarray(0, bytesRead));
      readPosition += bytesRead;
      let offset = 0;
      while (offset < bytesRead) {
        const { bytesWritten } = await destinationHandle.write(
          buffer,
          offset,
          bytesRead - offset,
          writePosition,
        );
        invariant(bytesWritten > 0, `${label} produced a zero-byte write`);
        offset += bytesWritten;
        writePosition += bytesWritten;
      }
    }
    invariant(readPosition === bytes, `${label} copied byte total drift`);
    invariant(digest.digest("hex") === sha256, `${label} source SHA-256 drift`);
    await destinationHandle.chmod(destinationMode);
    await destinationHandle.sync();
    const destinationInformation = await destinationHandle.stat({ bigint: true });
    invariant(destinationInformation.isFile()
      && destinationInformation.nlink === 1n
      && Number(destinationInformation.size) === bytes,
    `${label} destination identity mismatch`);
    const sourceAfter = await sourceHandle.stat({ bigint: true });
    const sourceAfterPath = await lstat(sourcePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(sourceBefore), nodeIdentity(sourceAfter))
      && sameNode(nodeIdentity(sourceBefore), nodeIdentity(sourceAfterPath))
      && sourceBefore.size === sourceAfter.size
      && sourceBefore.mtimeNs === sourceAfter.mtimeNs,
      `${label} source changed during transfer`,
    );
  } finally {
    if (destinationHandle) await destinationHandle.close();
    await sourceHandle.close();
  }
  await fsyncDirectory(path.dirname(destinationPath));
  const destinationEvidence = await inspectRegularFileNoFollow(destinationPath, {
    expectedBytes: bytes,
    expectedSha256: sha256,
    requireSingleLink: true,
    requireReadOnly: (destinationMode & 0o222) === 0,
  });
  invariant(!sameNode(nodeIdentity(sourceAtPath), destinationEvidence.node),
    `${label} destination aliases the source inode`);
  return {
    source: {
      bytes,
      sha256,
      node: nodeIdentity(sourceAtPath),
    },
    destination: destinationEvidence,
    byteIdentical: true,
    separateRegularFile: true,
  };
}

function promotionRecordSetSha256(records) {
  return sha256Text(
    [...records]
      .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
      .map((record) => [
        portableRelativePath(record.canonicalPath, "record canonicalPath"),
        portableRelativePath(
          record.sourceBinding?.quarantineRelativePath,
          "record quarantineRelativePath",
        ),
        record.bytes,
        record.sha256,
        record.sourceBindingSha256,
        record.priorDisposition,
        record.currentDisposition,
        record.approvalBasis,
      ].join("\t") + "\n")
      .join(""),
  );
}

async function publishImmutableBytesNoClobber(finalPath, contents, {
  mode = 0o444,
  label = "immutable artifact",
} = {}) {
  invariant(Buffer.isBuffer(contents), `${label} contents must be a Buffer`);
  const parent = path.dirname(finalPath);
  const parentInformation = await lstat(parent);
  invariant(parentInformation.isDirectory() && !parentInformation.isSymbolicLink(),
    `${label} parent is unsafe`);
  const finalKind = await pathKind(finalPath);
  if (finalKind === "file") {
    const interrupted = await inspectRegularFileNoFollow(finalPath, {
      expectedBytes: contents.length,
      expectedSha256: sha256Bytes(contents),
      requireReadOnly: (mode & 0o222) === 0,
    });
    invariant(interrupted.mode === mode && interrupted.nlink === 2,
      `${label} already exists`);
    const preparingPrefix = `.${path.basename(finalPath)}.`;
    const preparingSuffix = ".preparing";
    const aliases = [];
    for (const entry of await readdir(parent, {withFileTypes: true})) {
      if (!entry.name.startsWith(preparingPrefix)
        || !entry.name.endsWith(preparingSuffix)) continue;
      const candidate = path.join(parent, entry.name);
      const candidateInformation = await lstat(candidate, {bigint: true});
      if (candidateInformation.isFile() && !candidateInformation.isSymbolicLink()
        && sameNode(nodeIdentity(candidateInformation), interrupted.node)) {
        aliases.push(candidate);
      }
    }
    invariant(aliases.length === 1,
      `${label} interrupted publication has an ambiguous preparing-link closure`);
    await fsyncDirectory(parent);
    const beforeUnlink = await inspectRegularFileNoFollow(finalPath, {
      expectedBytes: contents.length,
      expectedSha256: sha256Bytes(contents),
      requireReadOnly: (mode & 0o222) === 0,
    });
    const aliasInformation = await lstat(aliases[0], {bigint: true});
    invariant(beforeUnlink.mode === mode && beforeUnlink.nlink === 2
      && sameNode(beforeUnlink.node, interrupted.node)
      && sameNode(nodeIdentity(aliasInformation), interrupted.node),
    `${label} interrupted publication changed before reconciliation`);
    await unlink(aliases[0]);
    await fsyncDirectory(parent);
    return inspectRegularFileNoFollow(finalPath, {
      expectedBytes: contents.length,
      expectedSha256: sha256Bytes(contents),
      requireSingleLink: true,
      requireReadOnly: (mode & 0o222) === 0,
    });
  }
  invariant(finalKind === "missing", `${label} already exists`);
  const temporary = path.join(
    parent,
    `.${path.basename(finalPath)}.${process.pid}.${randomUUID()}.preparing`,
  );
  let handle;
  try {
    handle = await open(
      temporary,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
      0o600,
    );
    await handle.writeFile(contents);
    await handle.chmod(mode);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await link(temporary, finalPath);
    await fsyncDirectory(parent);
    await unlink(temporary);
    await fsyncDirectory(parent);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
  return inspectRegularFileNoFollow(finalPath, {
    expectedBytes: contents.length,
    expectedSha256: sha256Bytes(contents),
    requireSingleLink: true,
    requireReadOnly: (mode & 0o222) === 0,
  });
}

async function publishImmutableJsonNoClobber(finalPath, value, options = {}) {
  const contents = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  return publishImmutableBytesNoClobber(finalPath, contents, options);
}

async function replaceStagedBytesAtomically(finalPath, contents, {
  expectedExisting,
  mode = 0o444,
  label = "staged artifact",
} = {}) {
  invariant(Buffer.isBuffer(contents), `${label} contents must be a Buffer`);
  const parent = path.dirname(finalPath);
  const parentInformation = await lstat(parent);
  invariant(parentInformation.isDirectory() && !parentInformation.isSymbolicLink(),
    `${label} parent is unsafe`);
  const kind = await pathKind(finalPath);
  invariant(["missing", "file"].includes(kind), `${label} target is unsafe: ${kind}`);
  if (kind === "file") {
    invariant(expectedExisting, `${label} replacement lacks a pinned staged preimage`);
    await inspectRegularFileNoFollow(finalPath, {
      expectedBytes: expectedExisting.bytes,
      expectedSha256: expectedExisting.sha256,
      requireSingleLink: true,
    });
  }
  const temporary = path.join(
    parent,
    `.${path.basename(finalPath)}.${process.pid}.${randomUUID()}.preparing`,
  );
  let handle;
  try {
    handle = await open(
      temporary,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
      0o600,
    );
    await handle.writeFile(contents);
    await handle.chmod(mode);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, finalPath);
    await fsyncDirectory(parent);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
  return inspectRegularFileNoFollow(finalPath, {
    expectedBytes: contents.length,
    expectedSha256: sha256Bytes(contents),
    requireSingleLink: true,
    requireReadOnly: (mode & 0o222) === 0,
  });
}

async function writeJournalAtomic(journalPath, value) {
  const parent = path.dirname(journalPath);
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const existingKind = await pathKind(journalPath);
  invariant(["missing", "file"].includes(existingKind),
    `Transaction journal is unsafe: ${existingKind}`);
  if (existingKind === "file") {
    await inspectRegularFileNoFollow(journalPath, { requireSingleLink: true });
  }
  const contents = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  const temporary = path.join(
    parent,
    `.${path.basename(journalPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(
      temporary,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
      0o600,
    );
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, journalPath);
    await fsyncDirectory(parent);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
  return inspectRegularFileNoFollow(journalPath, {
    expectedBytes: contents.length,
    expectedSha256: sha256Bytes(contents),
    requireSingleLink: true,
  });
}

async function createWorkingCopy({
  records,
  sourceRoot,
  workingRoot,
  planSha256,
}) {
  invariant(Array.isArray(records) && records.length > 0,
    "Working-copy records must be a non-empty array");
  invariant(SHA256_PATTERN.test(planSha256), "Working-copy plan SHA-256 is invalid");
  invariant(await pathKind(workingRoot) === "missing", "Working-copy root already exists");
  await mkdir(workingRoot, { mode: 0o700 });
  await fsyncDirectory(path.dirname(workingRoot));
  const filesRoot = path.join(workingRoot, "files");
  await mkdir(filesRoot, { mode: 0o700 });
  const copies = [];
  for (const record of [...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))) {
    portableRelativePath(record.canonicalPath, "working-copy canonicalPath");
    const sourceRelative = portableRelativePath(
      record.sourceBinding?.quarantineRelativePath,
      "working-copy sourceRelativePath",
    );
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0,
      `Invalid bytes for ${record.canonicalPath}`);
    invariant(SHA256_PATTERN.test(record.sha256),
      `Invalid SHA-256 for ${record.canonicalPath}`);
    const sourcePath = await resolveContainedExistingFile(
      sourceRoot,
      sourceRelative,
      `working-copy source ${record.canonicalPath}`,
    );
    const destinationPath = await ensureContainedParent(
      filesRoot,
      record.canonicalPath,
      { label: `working-copy destination ${record.canonicalPath}` },
    );
    const copy = await copyRegularFileExclusive({
      sourcePath,
      destinationPath,
      bytes: record.bytes,
      sha256: record.sha256,
      destinationMode: 0o444,
      label: `working copy ${record.canonicalPath}`,
    });
    copies.push({
      recordId: record.recordId,
      canonicalPath: record.canonicalPath,
      sourceRelativePath: sourceRelative,
      workingRelativePath: `files/${record.canonicalPath}`,
      bytes: record.bytes,
      sha256: record.sha256,
      sourceNode: copy.source.node,
      workingNode: copy.destination.node,
      mode: "0444",
      nlink: copy.destination.nlink,
      byteIdentical: true,
      separateRegularFile: true,
    });
  }
  const receipt = {
    schemaVersion: "help-math-fla-swf-counterpart-working-copy-receipt/v1",
    artifactType: "help-math-fla-swf-counterpart-working-copy-receipt",
    planSha256,
    recordCount: copies.length,
    recordSetSha256: promotionRecordSetSha256(records),
    sourceRoot,
    workingRoot,
    requirements: {
      noFollow: true,
      noOverwrite: true,
      readOnlyMode: "0444",
      singleLink: true,
      separateInode: true,
      byteIdentical: true,
    },
    copies,
  };
  const receiptPath = path.join(workingRoot, "working-copy-receipt.json");
  const receiptEvidence = await publishImmutableJsonNoClobber(receiptPath, receipt, {
    mode: 0o444,
    label: "working-copy receipt",
  });
  await fsyncDirectory(filesRoot);
  await fsyncDirectory(workingRoot);
  return { filesRoot, receiptPath, receipt, receiptEvidence };
}

function assertReceiptNode(value, label) {
  invariant(value && typeof value.dev === "string" && /^\d+$/.test(value.dev)
    && typeof value.ino === "string" && /^\d+$/.test(value.ino),
  `${label} has an invalid inode identity`);
}

async function validateWorkingCopyReceipt({
  records,
  receiptPath,
  receiptSha256,
  planSha256,
  sourceRoot,
  workingRoot,
}) {
  invariant(Array.isArray(records) && records.length > 0,
    "Working-copy receipt validation requires approved records");
  invariant(SHA256_PATTERN.test(receiptSha256),
    "Working-copy receipt SHA-256 is invalid");
  invariant(path.resolve(receiptPath) === path.join(path.resolve(workingRoot),
    "working-copy-receipt.json"), "Working-copy receipt path drift");
  const file = await readJsonArtifactNoFollow(receiptPath, {
    expectedSha256: receiptSha256,
    requireSingleLink: true,
    requireReadOnly: true,
  });
  const receipt = file.value;
  exactObjectKeys(receipt, [
    "schemaVersion", "artifactType", "planSha256", "recordCount", "recordSetSha256",
    "sourceRoot", "workingRoot", "requirements", "copies",
  ], "working-copy receipt");
  invariant(receipt.schemaVersion
    === "help-math-fla-swf-counterpart-working-copy-receipt/v1"
    && receipt.artifactType === "help-math-fla-swf-counterpart-working-copy-receipt",
  "Working-copy receipt schema/type drift");
  invariant(receipt.planSha256 === planSha256,
    "Working-copy receipt plan binding drift");
  invariant(receipt.sourceRoot === sourceRoot && receipt.workingRoot === workingRoot,
    "Working-copy receipt root binding drift");
  invariant(receipt.recordCount === records.length
    && receipt.recordSetSha256 === promotionRecordSetSha256(records),
  "Working-copy receipt approved-record closure drift");
  exactObjectKeys(receipt.requirements, [
    "noFollow", "noOverwrite", "readOnlyMode", "singleLink", "separateInode",
    "byteIdentical",
  ], "working-copy receipt requirements");
  invariant(receipt.requirements.noFollow === true
    && receipt.requirements.noOverwrite === true
    && receipt.requirements.readOnlyMode === "0444"
    && receipt.requirements.singleLink === true
    && receipt.requirements.separateInode === true
    && receipt.requirements.byteIdentical === true,
  "Working-copy receipt weakens copy requirements");
  invariant(Array.isArray(receipt.copies) && receipt.copies.length === records.length,
    "Working-copy receipt copy count drift");
  const recordsById = new Map(records.map((record) => [record.recordId, record]));
  invariant(recordsById.size === records.length, "Approved records contain duplicate IDs");
  const seen = new Set();
  const copies = [];
  for (const copy of receipt.copies) {
    exactObjectKeys(copy, [
      "recordId", "canonicalPath", "sourceRelativePath", "workingRelativePath", "bytes",
      "sha256", "sourceNode", "workingNode", "mode", "nlink", "byteIdentical",
      "separateRegularFile",
    ], "working-copy receipt copy");
    const record = recordsById.get(copy.recordId);
    invariant(record && !seen.has(copy.recordId),
      `Working-copy receipt has an unknown or duplicate record: ${copy.recordId}`);
    seen.add(copy.recordId);
    invariant(copy.canonicalPath === record.canonicalPath
      && copy.sourceRelativePath === record.sourceBinding.quarantineRelativePath
      && copy.workingRelativePath === `files/${record.canonicalPath}`
      && copy.bytes === record.bytes
      && copy.sha256 === record.sha256,
    `Working-copy receipt record identity drift: ${copy.recordId}`);
    invariant(copy.mode === "0444" && copy.nlink === 1
      && copy.byteIdentical === true && copy.separateRegularFile === true,
    `Working-copy receipt copy requirements drift: ${copy.recordId}`);
    assertReceiptNode(copy.sourceNode, `Working-copy source ${copy.recordId}`);
    assertReceiptNode(copy.workingNode, `Working-copy file ${copy.recordId}`);
    const sourcePath = await resolveContainedExistingFile(
      workingRoot,
      copy.workingRelativePath,
      `receipt-bound working copy ${copy.canonicalPath}`,
    );
    const evidence = await inspectRegularFileNoFollow(sourcePath, {
      expectedBytes: copy.bytes,
      expectedSha256: copy.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    });
    invariant(sameNode(copy.workingNode, evidence.node),
      `Working-copy file inode differs from immutable receipt: ${copy.canonicalPath}`);
    copies.push({ copy, record, sourcePath, evidence });
  }
  invariant(seen.size === records.length,
    "Working-copy receipt does not cover the exact approved record set");
  invariant(JSON.stringify(receipt.copies.map((copy) => copy.canonicalPath))
    === JSON.stringify([...receipt.copies]
      .map((copy) => copy.canonicalPath).sort(compareText)),
  "Working-copy receipt copies are not in canonical path order");
  return { receipt, evidence: file.evidence, copies };
}

async function copyWorkingSetToStagedSource({
  records,
  workingCopyReceiptPath,
  workingCopyReceiptSha256,
  planSha256,
  sourceRoot,
  workingRoot,
  stagedSourceRoot,
}) {
  const validated = await validateWorkingCopyReceipt({
    records,
    receiptPath: workingCopyReceiptPath,
    receiptSha256: workingCopyReceiptSha256,
    planSha256,
    sourceRoot,
    workingRoot,
  });
  const copies = [];
  for (const { copy: receiptCopy, record, sourcePath } of validated.copies) {
    const sourceEvidence = await inspectRegularFileNoFollow(sourcePath, {
      expectedBytes: receiptCopy.bytes,
      expectedSha256: receiptCopy.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    });
    invariant(sameNode(receiptCopy.workingNode, sourceEvidence.node),
      `Working-copy file changed after receipt validation: ${record.canonicalPath}`);
    const destinationPath = await ensureContainedParent(
      stagedSourceRoot,
      record.canonicalPath,
      { directoryMode: 0o700, label: `canonical destination ${record.canonicalPath}` },
    );
    const copied = await copyRegularFileExclusive({
      sourcePath,
      destinationPath,
      bytes: record.bytes,
      sha256: record.sha256,
      destinationMode: 0o444,
      label: `canonical staged copy ${record.canonicalPath}`,
    });
    invariant(sameNode(sourceEvidence.node, copied.source.node),
      `Working-copy source identity drift: ${record.canonicalPath}`);
    copies.push({
      recordId: record.recordId,
      canonicalPath: record.canonicalPath,
      bytes: record.bytes,
      sha256: record.sha256,
      workingNode: sourceEvidence.node,
      stagedNode: copied.destination.node,
    });
  }
  return {
    copiedFileCount: copies.length,
    copiedBytes: copies.reduce((sum, record) => sum + record.bytes, 0),
    recordSetSha256: promotionRecordSetSha256(records),
    workingCopyReceiptSha256: validated.evidence.sha256,
    copies,
  };
}

const PROFILE_EXPECTED_KEYS = Object.freeze([
  "files", "totalBytes", "checksumSetSha256", "sourceExtensions", "swf", "fla", "mp3", "xml",
  "courseXml", "swfByCollection", "uniqueSwfAssets", "duplicatePlacements", "duplicateGroups",
  "pairedSwfFla", "swfOnly", "flaOnly", "compoundBinaryFla", "zipArchiveFla",
  "unrecognizedFla", "swfFrames", "swfHeader", "courseShells", "courseReferences",
  "keytermReferences", "lessonReleases", "xmlWithBareAmpersands",
]);

function exactObjectKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  invariant(JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} has missing or unexpected keys`);
}

function nonnegativeSafeInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value >= 0, `${label} must be a nonnegative safe integer`);
  return value;
}

function validateReferenceProfile(value, label) {
  exactObjectKeys(value, ["unique", "resolved", "missing", "unreferenced"], label);
  for (const key of Object.keys(value)) nonnegativeSafeInteger(value[key], `${label}.${key}`);
  invariant(value.resolved <= value.unique, `${label}.resolved exceeds unique`);
  invariant(value.missing <= value.unique, `${label}.missing exceeds unique`);
}

function validateExpectedCatalogProfile(profile) {
  invariant(profile?.schemaVersion === 1, "Unsupported expected-profile schemaVersion");
  invariant(profile?.artifactType === "help-math-current-source-profile",
    "Wrong expected-profile artifactType");
  exactObjectKeys(profile, ["schemaVersion", "artifactType", "expected"], "expected profile");
  exactObjectKeys(profile.expected, PROFILE_EXPECTED_KEYS, "expected profile values");
  for (const [key, value] of Object.entries(profile.expected)) {
    if ([
      "checksumSetSha256", "sourceExtensions", "swfByCollection", "swfHeader",
      "courseReferences", "keytermReferences", "lessonReleases",
    ].includes(key)) continue;
    nonnegativeSafeInteger(value, `expected.${key}`);
  }
  invariant(SHA256_PATTERN.test(profile.expected.checksumSetSha256),
    "expected.checksumSetSha256 is invalid");
  exactObjectKeys(profile.expected.sourceExtensions,
    Object.keys(profile.expected.sourceExtensions).sort(compareText),
    "expected.sourceExtensions");
  invariant(Object.keys(profile.expected.sourceExtensions).length > 0,
    "expected.sourceExtensions must not be empty");
  const extensionKeys = Object.keys(profile.expected.sourceExtensions);
  invariant(extensionKeys.every((extension) => extension === ""
    || /^[a-z0-9][a-z0-9._-]*$/.test(extension)),
  "expected.sourceExtensions contains an invalid key");
  invariant(JSON.stringify(extensionKeys) === JSON.stringify([...extensionKeys].sort(compareText)),
    "expected.sourceExtensions keys must use Unicode code-point order");
  for (const [extension, count] of Object.entries(profile.expected.sourceExtensions)) {
    nonnegativeSafeInteger(count, `expected.sourceExtensions.${JSON.stringify(extension)}`);
  }
  exactObjectKeys(profile.expected.swfByCollection, ["course", "keyterm", "formula", "unknown"],
    "expected.swfByCollection");
  for (const [key, value] of Object.entries(profile.expected.swfByCollection)) {
    nonnegativeSafeInteger(value, `expected.swfByCollection.${key}`);
  }
  validateReferenceProfile(profile.expected.courseReferences, "expected.courseReferences");
  validateReferenceProfile(profile.expected.keytermReferences, "expected.keytermReferences");
  exactObjectKeys(profile.expected.swfHeader,
    ["signatures", "fpsValues", "headerParseErrors"], "expected.swfHeader");
  invariant(Array.isArray(profile.expected.swfHeader.signatures)
    && profile.expected.swfHeader.signatures.every((signature) => /^[A-Z]{3}$/.test(signature))
    && new Set(profile.expected.swfHeader.signatures).size
      === profile.expected.swfHeader.signatures.length
    && JSON.stringify(profile.expected.swfHeader.signatures)
      === JSON.stringify([...profile.expected.swfHeader.signatures].sort(compareText)),
  "expected.swfHeader.signatures are invalid or unsorted");
  invariant(Array.isArray(profile.expected.swfHeader.fpsValues)
    && profile.expected.swfHeader.fpsValues.every((fps) => Number.isFinite(fps) && fps > 0)
    && new Set(profile.expected.swfHeader.fpsValues).size
      === profile.expected.swfHeader.fpsValues.length
    && JSON.stringify(profile.expected.swfHeader.fpsValues)
      === JSON.stringify([...profile.expected.swfHeader.fpsValues].sort((left, right) => left - right)),
  "expected.swfHeader.fpsValues are invalid or unsorted");
  nonnegativeSafeInteger(profile.expected.swfHeader.headerParseErrors,
    "expected.swfHeader.headerParseErrors");
  exactObjectKeys(profile.expected.lessonReleases,
    ["outputSha256", "releaseCount", "totalMembers", "releases"],
    "expected.lessonReleases");
  invariant(SHA256_PATTERN.test(profile.expected.lessonReleases.outputSha256),
    "expected.lessonReleases.outputSha256 is invalid");
  nonnegativeSafeInteger(profile.expected.lessonReleases.releaseCount,
    "expected.lessonReleases.releaseCount");
  nonnegativeSafeInteger(profile.expected.lessonReleases.totalMembers,
    "expected.lessonReleases.totalMembers");
  invariant(Array.isArray(profile.expected.lessonReleases.releases),
    "expected.lessonReleases.releases must be an array");
  const releaseIds = new Set();
  for (const release of profile.expected.lessonReleases.releases) {
    exactObjectKeys(release, ["releaseId", "memberCount"], "expected lesson release");
    invariant(typeof release.releaseId === "string" && release.releaseId.length > 0
      && !releaseIds.has(release.releaseId), "Expected lesson release IDs must be unique");
    releaseIds.add(release.releaseId);
    nonnegativeSafeInteger(release.memberCount, "expected lesson release memberCount");
  }
  invariant(Object.values(profile.expected.sourceExtensions)
    .reduce((sum, value) => sum + value, 0) === profile.expected.files,
  "Expected source-extension counts do not sum to expected.files");
  invariant(profile.expected.sourceExtensions.swf === profile.expected.swf
    && profile.expected.sourceExtensions.fla === profile.expected.fla
    && profile.expected.sourceExtensions.mp3 === profile.expected.mp3
    && profile.expected.sourceExtensions.xml === profile.expected.xml,
  "Expected source-extension typed counts drift");
  invariant(Object.values(profile.expected.swfByCollection)
    .reduce((sum, value) => sum + value, 0) === profile.expected.swf,
  "Expected SWF collection counts do not sum to expected.swf");
  invariant(profile.expected.pairedSwfFla + profile.expected.swfOnly === profile.expected.swf,
    "Expected paired + SWF-only does not equal SWF count");
  invariant(profile.expected.pairedSwfFla + profile.expected.flaOnly === profile.expected.fla,
    "Expected paired + FLA-only does not equal FLA count");
  invariant(profile.expected.compoundBinaryFla
    + profile.expected.zipArchiveFla
    + profile.expected.unrecognizedFla === profile.expected.fla,
  "Expected FLA container counts do not equal FLA count");
  invariant(profile.expected.uniqueSwfAssets + profile.expected.duplicatePlacements
    === profile.expected.swf, "Expected unique + duplicate SWFs does not equal SWF count");
  invariant(profile.expected.duplicateGroups <= profile.expected.duplicatePlacements,
    "Expected duplicateGroups exceeds duplicatePlacements");
  invariant(profile.expected.courseReferences.resolved + profile.expected.courseReferences.missing
    === profile.expected.courseReferences.unique,
  "Expected course reference resolution does not equal unique count");
  invariant(profile.expected.keytermReferences.resolved + profile.expected.keytermReferences.missing
    === profile.expected.keytermReferences.unique,
  "Expected keyterm reference resolution does not equal unique count");
  invariant(profile.expected.lessonReleases.releases.length
    === profile.expected.lessonReleases.releaseCount,
  "Expected lesson release list length drift");
  invariant(profile.expected.lessonReleases.releases
    .reduce((sum, release) => sum + release.memberCount, 0)
      === profile.expected.lessonReleases.totalMembers,
  "Expected lesson release member total drift");
  return profile;
}

function catalogSummaryProjection(summary, lessonReleases) {
  return {
    files: summary?.source?.fileCount,
    totalBytes: summary?.source?.totalBytes,
    checksumSetSha256: summary?.source?.checksumSetSha256,
    sourceExtensions: summary?.source?.extensions,
    swf: summary?.source?.extensions?.swf,
    fla: summary?.source?.extensions?.fla,
    mp3: summary?.source?.extensions?.mp3,
    xml: summary?.source?.extensions?.xml,
    courseXml: summary?.xml?.courseFiles,
    swfByCollection: {
      course: summary?.swf?.byCollection?.course,
      keyterm: summary?.swf?.byCollection?.keyterm,
      formula: summary?.swf?.byCollection?.formula,
      unknown: summary?.swf?.byCollection?.unknown,
    },
    uniqueSwfAssets: summary?.swf?.uniqueAssets,
    duplicatePlacements: summary?.swf?.duplicatePlacements,
    duplicateGroups: summary?.swf?.duplicateGroups,
    pairedSwfFla: summary?.pairing?.pairedSwfFla,
    swfOnly: summary?.pairing?.swfOnly,
    flaOnly: summary?.pairing?.flaOnly,
    compoundBinaryFla: summary?.fla?.compoundBinary,
    zipArchiveFla: summary?.fla?.zipArchive,
    unrecognizedFla: summary?.fla?.unrecognized,
    swfFrames: summary?.swf?.totalFrames,
    swfHeader: {
      signatures: summary?.swf?.signatures,
      fpsValues: summary?.swf?.fpsValues,
      headerParseErrors: summary?.swf?.headerParseErrors,
    },
    courseShells: summary?.swf?.courseShells,
    courseReferences: {
      unique: summary?.references?.course?.unique,
      resolved: summary?.references?.course?.resolved,
      missing: summary?.references?.course?.missing,
      unreferenced: summary?.references?.course?.unreferencedExisting,
    },
    keytermReferences: {
      unique: summary?.references?.keyterm?.unique,
      resolved: summary?.references?.keyterm?.resolved,
      missing: summary?.references?.keyterm?.missing,
      unreferenced: summary?.references?.keyterm?.unreferencedExisting,
    },
    lessonReleases,
    xmlWithBareAmpersands: summary?.xml?.filesWithBareAmpersands,
  };
}

function assertCatalogSummaryMatchesProfile(summary, profile, { lessonReleases } = {}) {
  validateExpectedCatalogProfile(profile);
  const observed = catalogSummaryProjection(summary, lessonReleases);
  invariant(isDeepStrictEqual(observed, profile.expected),
    "Catalog summary does not match the plan-bound expected profile");
  return observed;
}

async function inventoryDirectory(root) {
  const information = await lstat(root);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `Inventory root is unsafe: ${root}`);
  const records = [];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const entryInformation = await lstat(absolutePath);
      invariant(!entryInformation.isSymbolicLink(),
        `Inventory refuses a symbolic link: ${absolutePath}`);
      if (entryInformation.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else {
        invariant(entryInformation.isFile(), `Inventory found an unsupported entry: ${absolutePath}`);
        const evidence = await inspectRegularFileNoFollow(absolutePath);
        records.push({ path: relativePath, bytes: evidence.bytes, sha256: evidence.sha256 });
      }
    }
  }
  await visit(root);
  records.sort((left, right) => compareText(left.path, right.path));
  return {
    fileCount: records.length,
    totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
    treeSha256: sha256Text(records
      .map((record) => `${record.path}\t${record.bytes}\t${record.sha256}\n`)
      .join("")),
    records,
  };
}

async function syncTreeDurably(root) {
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `Durability root is unsafe: ${root}`);
  let fileCount = 0;
  let directoryCount = 0;
  let totalBytes = 0;
  async function visit(directory) {
    const information = await lstat(directory);
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `Durability sync refuses a non-directory: ${directory}`);
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const entryInformation = await lstat(absolutePath);
      invariant(!entryInformation.isSymbolicLink(),
        `Durability sync refuses a symbolic link: ${absolutePath}`);
      if (entryInformation.isDirectory()) {
        await visit(absolutePath);
      } else {
        invariant(entryInformation.isFile(),
          `Durability sync found an unsupported entry: ${absolutePath}`);
        invariant(entryInformation.nlink === 1,
          `Durability sync refuses a multi-link file: ${absolutePath}`);
        const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
        try {
          await handle.sync();
        } finally {
          await handle.close();
        }
        fileCount += 1;
        totalBytes += entryInformation.size;
      }
    }
    await fsyncDirectory(directory);
    directoryCount += 1;
  }
  await visit(root);
  return { fileCount, directoryCount, totalBytes };
}

async function cloneStructure(root, { requireSingleLinkFiles = false } = {}) {
  const rootInformation = await lstat(root, { bigint: true });
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `Clone root is unsafe: ${root}`);
  const records = [];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const information = await lstat(absolutePath, { bigint: true });
      invariant(!information.isSymbolicLink(),
        `Copy-on-write clone refuses a symbolic link: ${absolutePath}`);
      if (information.isDirectory()) {
        records.push({
          path: relativePath,
          type: "directory",
          mode: Number(information.mode & 0o7777n),
        });
        await visit(absolutePath, relativePath);
      } else {
        invariant(information.isFile(),
          `Copy-on-write clone encountered an unsupported entry: ${absolutePath}`);
        if (requireSingleLinkFiles) {
          invariant(information.nlink === 1n,
            `Copy-on-write clone destination is not a single-link file: ${absolutePath}`);
        }
        records.push({
          path: relativePath,
          type: "file",
          mode: Number(information.mode & 0o7777n),
          bytes: Number(information.size),
        });
      }
    }
  }
  await visit(root);
  return {
    recordCount: records.length,
    fileCount: records.filter(({ type }) => type === "file").length,
    directoryCount: records.filter(({ type }) => type === "directory").length,
    totalBytes: records.reduce((sum, record) => sum + (record.bytes ?? 0), 0),
    structureSha256: sha256Text(records
      .map((record) => `${record.type}\t${record.path}\t${record.mode}\t${record.bytes ?? ""}\n`)
      .join("")),
  };
}

async function cloneTreeCopyOnWrite(sourceRoot, destinationRoot) {
  invariant(await pathKind(sourceRoot) === "directory",
    `Clone source is not a real directory: ${sourceRoot}`);
  invariant(await pathKind(destinationRoot) === "missing",
    `Clone destination already exists: ${destinationRoot}`);
  invariant(path.dirname(sourceRoot) === path.dirname(destinationRoot),
    "Copy-on-write clone endpoints must be direct siblings");
  const [sourceBefore, parentInformation] = await Promise.all([
    lstat(sourceRoot, { bigint: true }),
    lstat(path.dirname(destinationRoot), { bigint: true }),
  ]);
  invariant(sourceBefore.isDirectory() && !sourceBefore.isSymbolicLink()
    && parentInformation.isDirectory() && !parentInformation.isSymbolicLink(),
  "Copy-on-write clone endpoints must be real directories");
  invariant(sourceBefore.dev === parentInformation.dev,
    "Copy-on-write clone endpoints must be on one device");
  const sourceStructureBefore = await cloneStructure(sourceRoot);
  try {
    await execFile(
      "/bin/cp",
      ["-c", "-R", "-p", "-P", sourceRoot, destinationRoot],
      {
        encoding: "utf8",
        env: CLEAN_ENVIRONMENT,
        maxBuffer: 1024 * 1024,
        timeout: 10 * 60 * 1000,
      },
    );
  } catch (error) {
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    throw new Error(`Native APFS clone failed${stderr ? `: ${stderr}` : `: ${error.message}`}`,
      { cause: error });
  }
  const [sourceStructureAfter, destinationStructure] = await Promise.all([
    cloneStructure(sourceRoot),
    cloneStructure(destinationRoot, { requireSingleLinkFiles: true }),
  ]);
  invariant(sourceStructureAfter.structureSha256 === sourceStructureBefore.structureSha256,
    "Clone source structure changed during native APFS clone");
  invariant(destinationStructure.structureSha256 === sourceStructureBefore.structureSha256,
    "Native APFS clone structure differs from its source");
  const sourceAfter = await lstat(sourceRoot, { bigint: true });
  invariant(sameNode(nodeIdentity(sourceBefore), nodeIdentity(sourceAfter)),
    "Clone source identity changed during native APFS clone");
  await fsyncDirectory(path.dirname(destinationRoot));
  return {
    backend: "/bin/cp -c -R -p -P",
    sourceStructure: sourceStructureBefore,
    destinationStructure,
    destinationParentFsynced: true,
  };
}

function transactionIdentifier(now = new Date(), uuid = randomUUID()) {
  const timestamp = now.toISOString().replaceAll(/[-:.]/g, "");
  const suffix = uuid.replaceAll("-", "").slice(0, 12).toLowerCase();
  invariant(/^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/.test(`${timestamp}-${suffix}`),
    "Invalid generated transaction identifier");
  return `${timestamp}-${suffix}`;
}

function transactionPaths(configuration, transactionId) {
  invariant(/^[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$/.test(transactionId),
    "Invalid transaction identifier");
  const sourceParent = path.dirname(configuration.sourceRoot);
  const catalogParent = path.dirname(configuration.catalogRoot);
  return {
    sourceParent,
    catalogParent,
    sourceRecovery: path.join(
      sourceParent,
      `.HELP MATH_ORIGINAL FILES.fla-swf-counterpart-successor-recovery-${transactionId}`,
    ),
    catalogRecovery: path.join(
      catalogParent,
      `.catalog.fla-swf-counterpart-successor-recovery-${transactionId}`,
    ),
    workingRoot: path.join(configuration.activeRoot, "working-copy"),
    journalPath: path.join(configuration.activeRoot, "journal.json"),
  };
}

async function snapshotDirectoryNode(directory, label) {
  const information = await lstat(directory, { bigint: true });
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${label} is not a real directory`);
  return { path: directory, node: nodeIdentity(information) };
}

async function observeSwapPair({ livePath, recoveryPath, before, label }) {
  try {
    const [live, recovery] = await Promise.all([
      lstat(livePath, { bigint: true }),
      lstat(recoveryPath, { bigint: true }),
    ]);
    if (!live.isDirectory() || live.isSymbolicLink()
      || !recovery.isDirectory() || recovery.isSymbolicLink()) {
      return { state: "indeterminate", label, error: "a swap endpoint is not a real directory" };
    }
    const liveNode = nodeIdentity(live);
    const recoveryNode = nodeIdentity(recovery);
    if (sameNode(liveNode, before.live) && sameNode(recoveryNode, before.staged)) {
      return { state: "unchanged", label, liveNode, recoveryNode };
    }
    if (sameNode(liveNode, before.staged) && sameNode(recoveryNode, before.live)) {
      return { state: "swapped", label, liveNode, recoveryNode };
    }
    return { state: "indeterminate", label, liveNode, recoveryNode };
  } catch (error) {
    return { state: "indeterminate", label, error: error.message };
  }
}

function decideRecoveryAction({
  receiptKind,
  phase,
  sourceState,
  catalogState,
  receiptCommitPointPresent = false,
}) {
  if (receiptKind === "file") return "reconcile-forward-commit";
  if (receiptKind !== "missing") return "manual-intervention";
  if (receiptCommitPointPresent || [
    "publishing-receipt",
    "receipt-published",
    "committed",
    "committed-and-reported",
  ].includes(phase)) return "manual-intervention";
  if (["rolled-back", "recovered-to-base"].includes(phase)) return "verify-base";
  if ([sourceState, catalogState].includes("indeterminate")) return "manual-intervention";
  invariant(["unchanged", "swapped"].includes(sourceState), "Invalid source swap state");
  invariant(["unchanged", "swapped"].includes(catalogState), "Invalid catalog swap state");
  if (sourceState === "unchanged" && catalogState === "unchanged") {
    return "verify-base-and-mark-recovered";
  }
  return "rollback-catalog-then-source";
}

async function restoreSwapPair({
  allowedParent,
  livePath,
  recoveryPath,
  before,
  label,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
  expectedNativeBuildReceipt,
  swap = atomicSwapSiblingDirectoriesDarwin,
}) {
  const observedBefore = await observeSwapPair({ livePath, recoveryPath, before, label });
  if (observedBefore.state === "unchanged") {
    return { label, action: "already-base", observedBefore };
  }
  invariant(observedBefore.state === "swapped",
    `${label} swap state is indeterminate; refusing a blind rollback`);
  const swapReceipt = await swap({
    allowedParent,
    firstDirectory: livePath,
    secondDirectory: recoveryPath,
    expectedFirstNode: observedBefore.liveNode,
    expectedSecondNode: observedBefore.recoveryNode,
    expectedNativeSourceSha256,
    expectedNativeBuildContract,
    expectedNativeBuildReceipt,
  });
  invariant(swapReceipt?.status === "swapped-and-parent-fsynced"
    && swapReceipt.native?.status === "swapped"
    && swapReceipt.native?.parentFsynced === true
    && swapReceipt.nativeSourceSha256 === expectedNativeSourceSha256
    && swapReceipt.nativeBuild?.source?.sha256 === expectedNativeSourceSha256
    && isDeepStrictEqual(swapReceipt.nativeBuild?.source,
      expectedNativeBuildContract?.source)
    && isDeepStrictEqual(swapReceipt.nativeBuild?.compiler,
      expectedNativeBuildContract?.compiler)
    && isDeepStrictEqual(swapReceipt.nativeBuild?.compile, {
      driver: expectedNativeBuildContract?.compile?.driver,
      sdk: expectedNativeBuildContract?.compile?.sdk,
      arguments: expectedNativeBuildContract?.compile?.arguments,
    })
    && Number.isSafeInteger(swapReceipt.nativeBuild?.executable?.bytes)
    && swapReceipt.nativeBuild.executable.bytes > 0
    && SHA256_PATTERN.test(swapReceipt.nativeBuild?.executable?.sha256)
    && isDeepStrictEqual(swapReceipt.nativeBuild, expectedNativeBuildReceipt),
  `${label} rollback swap receipt lacks the frozen native-helper binding`);
  const observedAfter = await observeSwapPair({ livePath, recoveryPath, before, label });
  invariant(observedAfter.state === "unchanged",
    `${label} rollback did not restore base identities`);
  return { label, action: "swapped-back-to-base", observedBefore, observedAfter, swapReceipt };
}

async function rollbackCatalogThenSource({
  configuration,
  journal,
  swap,
  expectedNativeSourceSha256 = journal?.base?.nativeSwapSourceSha256,
  expectedNativeBuildContract = journal?.base?.nativeSwapBuildContract,
  expectedNativeBuildReceipt = journal?.nativeSwapBuildWitness,
}) {
  invariant(journal.directoryNodesBeforeSwap, "Transaction lacks pre-swap directory identities");
  invariant(SHA256_PATTERN.test(expectedNativeSourceSha256),
    "Transaction lacks the frozen native-helper SHA-256 for rollback");
  invariant(expectedNativeBuildContract?.source?.sha256
    === expectedNativeSourceSha256,
  "Transaction lacks the frozen native-helper build contract for rollback");
  invariant(expectedNativeBuildReceipt?.source?.sha256 === expectedNativeSourceSha256
    && Number.isSafeInteger(expectedNativeBuildReceipt?.executable?.bytes)
    && expectedNativeBuildReceipt.executable.bytes > 0
    && SHA256_PATTERN.test(expectedNativeBuildReceipt?.executable?.sha256),
  "Transaction lacks the prepared native-helper executable witness for rollback");
  const actions = [];
  for (const descriptor of [
    {
      label: "catalog",
      allowedParent: path.dirname(configuration.catalogRoot),
      livePath: configuration.catalogRoot,
      recoveryPath: journal.paths.catalogRecovery,
      before: journal.directoryNodesBeforeSwap.catalog,
    },
    {
      label: "source",
      allowedParent: path.dirname(configuration.sourceRoot),
      livePath: configuration.sourceRoot,
      recoveryPath: journal.paths.sourceRecovery,
      before: journal.directoryNodesBeforeSwap.source,
    },
  ]) {
    actions.push(await restoreSwapPair({
      ...descriptor,
      swap,
      expectedNativeSourceSha256,
      expectedNativeBuildContract,
      expectedNativeBuildReceipt,
    }));
  }
  const rollbackBuilds = actions
    .map((action) => action.swapReceipt?.nativeBuild)
    .filter(Boolean);
  if (rollbackBuilds.length > 1) {
    invariant(rollbackBuilds.slice(1).every((receipt) =>
      isDeepStrictEqual(receipt, rollbackBuilds[0])),
    "Catalog/source rollback swaps used different compiled helper bytes");
  }
  invariant(rollbackBuilds.every((receipt) =>
    isDeepStrictEqual(receipt, expectedNativeBuildReceipt)),
  "A rollback swap used helper bytes different from the prepared witness");
  return actions;
}

export {
  SHA256_PATTERN,
  assertCatalogSummaryMatchesProfile,
  assertJsonArtifactReadPathStable,
  assertMissingContainedDestination,
  cloneTreeCopyOnWrite,
  compareText,
  copyRegularFileExclusive,
  copyWorkingSetToStagedSource,
  createWorkingCopy,
  decideRecoveryAction,
  fsyncDirectory,
  inspectRegularFileNoFollow,
  inventoryDirectory,
  invariant,
  isWithin,
  nodeIdentity,
  observeSwapPair,
  pathKind,
  portableRelativePath,
  promotionRecordSetSha256,
  publishImmutableBytesNoClobber,
  publishImmutableJsonNoClobber,
  readJsonArtifactNoFollow,
  resolveContainedExistingFile,
  replaceStagedBytesAtomically,
  rollbackCatalogThenSource,
  sameNode,
  sha256Bytes,
  sha256Text,
  snapshotDirectoryNode,
  syncTreeDurably,
  transactionIdentifier,
  transactionPaths,
  validateWorkingCopyReceipt,
  validateExpectedCatalogProfile,
  writeJournalAtomic,
};
