#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
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
  rmdir,
  symlink,
  unlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {pathToFileURL, fileURLToPath} from "node:url";

import {
  materializeG4L3WorkspaceInventories,
} from "./materialize-g4-l3-workspace-inventories.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const MATERIALIZER_RELATIVE_PATH =
  "scripts/materialize-g4-l3-workspace-inventories.mjs";
const WRAPPER_RELATIVE_PATH =
  "scripts/refresh-g4-l3-workspace-inventories-safely.mjs";
const RELEASE_RELATIVE_PATH = "catalog/lesson-releases.json";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const PREIMAGE_ROOT_RELATIVE_PATH =
  "work/g4-l3-workspace-inventory-refresh-preimages";
const LOCK_RELATIVE_PATH = `${PREIMAGE_ROOT_RELATIVE_PATH}/.refresh.lock`;
const TRANSACTIONS_RELATIVE_PATH =
  `${PREIMAGE_ROOT_RELATIVE_PATH}/transactions`;
const SETS_RELATIVE_PATH = `${PREIMAGE_ROOT_RELATIVE_PATH}/sets`;
const MACHINE_NAMES = Object.freeze([
  "audit/machine/g4-l3-swf-definition-inventory.csv",
  "audit/machine/g4-l3-audio-source-candidates.csv",
  "audit/machine/g4-l3-inventory-materialization.json",
]);
const CANONICAL_NAMES = Object.freeze([
  "asset-inventory.csv",
  "audio-inventory.csv",
]);
const STAGING_SHARED_FILES = Object.freeze([
  RELEASE_RELATIVE_PATH,
  "reports/g4-l3-swf-asset-definition-census.json",
  "reports/g4-l3-embedded-audio-archive.json",
  "reports/g4-l3-catalog-audio-media-probe.json",
  "reports/g4-l3-audio-cas-media-probe.json",
  "templates/flash-migration/asset-inventory.csv",
  MATERIALIZER_RELATIVE_PATH,
]);
const ACCEPTANCE_NEUTRAL = Object.freeze({
  authoritativeRuntimeComplete: false,
  audioAccepted: false,
  independentHumanVisualReviewComplete: false,
  ownerAccepted: false,
  strictComplete: false,
  releasePublished: false,
  effect: "none",
});
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function safeRelative(relativePath, label = "path") {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      portable(path.normalize(relativePath)) === relativePath &&
      relativePath !== ".." &&
      !relativePath.startsWith("../") &&
      !relativePath.includes("/../") &&
      !relativePath.includes("\0"),
    `${label} is not a normalized project-relative path: ${relativePath}`,
  );
  return relativePath;
}

function bindingDigest(bindings) {
  return sha256(Buffer.from(stableJson(bindings.map((binding) => ({
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  })))));
}

function exactRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release manifest schema is invalid",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "G4 L3 atomic release must occur exactly once");
  const release = matches[0];
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 40 &&
      Array.isArray(release.members) &&
      release.members.length === 40,
    "G4 L3 release is not the exact atomic 40-member release",
  );
  const ids = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(
      member?.ordinal === index + 1 &&
        typeof member.animationId === "string" &&
        /^[a-z0-9][a-z0-9-]+$/.test(member.animationId) &&
        typeof member.assetId === "string" &&
        member.assetId.length > 0 &&
        typeof member.source?.path === "string" &&
        /^[a-f0-9]{64}$/.test(member.source?.sha256 || ""),
      `G4 L3 release member ${index + 1} is malformed`,
    );
    invariant(!ids.has(member.animationId), "G4 L3 release has duplicate animation IDs");
    invariant(!assetIds.has(member.assetId), "G4 L3 release has duplicate asset IDs");
    ids.add(member.animationId);
    assetIds.add(member.assetId);
  }
  return release;
}

export function enumerateInventoryRefreshScope(release) {
  const machinePaths = [];
  const canonicalPaths = [];
  for (const member of release.members) {
    for (const name of MACHINE_NAMES) {
      machinePaths.push(
        safeRelative(`migrations/${member.animationId}/${name}`, "machine output"),
      );
    }
    for (const name of CANONICAL_NAMES) {
      canonicalPaths.push(
        safeRelative(`migrations/${member.animationId}/${name}`, "canonical inventory"),
      );
    }
  }
  invariant(
    machinePaths.length === 120 && new Set(machinePaths).size === 120,
    "machine output scope must contain exactly 120 unique paths",
  );
  invariant(
    canonicalPaths.length === 80 && new Set(canonicalPaths).size === 80,
    "canonical inventory scope must contain exactly 80 unique paths",
  );
  return {machinePaths, canonicalPaths};
}

async function exists(filePath) {
  return lstat(filePath).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  const rootReal = await realpath(root);
  let cursor = rootReal;
  for (const segment of safeRelative(
    relativeDirectory || ".",
    "directory",
  ).split("/")) {
    if (segment === ".") continue;
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    invariant(
      info.isDirectory() && !info.isSymbolicLink(),
      `directory component must be a real directory: ${portable(path.relative(rootReal, cursor))}`,
    );
  }
  return cursor;
}

async function secureReadBinding(root, relativePath, {require0444 = false} = {}) {
  safeRelative(relativePath);
  const rootReal = await realpath(root);
  const parent = await assertRealDirectoryChain(rootReal, path.posix.dirname(relativePath));
  const absolutePath = path.join(parent, path.posix.basename(relativePath));
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | NOFOLLOW,
  );
  try {
    const info = await handle.stat({bigint: true});
    invariant(info.isFile(), `${relativePath} must be a regular file`);
    invariant(info.nlink === 1n, `${relativePath} must not have multiple hard links`);
    if (require0444) {
      invariant(
        Number(info.mode & 0o777n) === 0o444,
        `${relativePath} must have mode 0444`,
      );
    }
    const bytes = await handle.readFile();
    return {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      stat: {
        dev: info.dev.toString(),
        ino: info.ino.toString(),
        size: info.size.toString(),
        mtimeNs: info.mtimeNs.toString(),
        ctimeNs: info.ctimeNs.toString(),
        mode: Number(info.mode & 0o777n),
        nlink: Number(info.nlink),
      },
      content: bytes,
    };
  } finally {
    await handle.close();
  }
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    stat: binding.stat,
  };
}

function sameContent(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function sameIdentity(left, right) {
  return sameContent(left, right) &&
    left?.stat?.dev === right?.stat?.dev &&
    left?.stat?.ino === right?.stat?.ino &&
    left?.stat?.size === right?.stat?.size &&
    left?.stat?.mtimeNs === right?.stat?.mtimeNs &&
    left?.stat?.ctimeNs === right?.stat?.ctimeNs &&
    left?.stat?.nlink === 1 &&
    right?.stat?.nlink === 1;
}

function sameMovedIdentity(left, right) {
  return left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256 &&
    left?.stat?.dev === right?.stat?.dev &&
    left?.stat?.ino === right?.stat?.ino &&
    left?.stat?.size === right?.stat?.size &&
    left?.stat?.nlink === 1 &&
    right?.stat?.nlink === 1;
}

async function readBindings(root, relativePaths, options) {
  return Promise.all(
    relativePaths.map((relativePath) =>
      secureReadBinding(root, relativePath, options)),
  );
}

function assertBindingsUnchanged(before, after, label, {identity = false} = {}) {
  invariant(before.length === after.length, `${label} count changed`);
  for (let index = 0; index < before.length; index += 1) {
    const unchanged = identity
      ? sameIdentity(before[index], after[index])
      : sameContent(before[index], after[index]);
    invariant(unchanged, `${label} drifted: ${before[index].path}`);
  }
}

function assertNeutralMaterializerSummary(summary, {check, dryRun}) {
  invariant(
    summary &&
      summary.members === 40 &&
      summary.outputs === 120 &&
      summary.canonicalInventoryRestorations === 0 &&
      summary.canonicalInventoryFilesChanged === false &&
      summary.strictAcceptanceEffect === "none" &&
      summary.check === check &&
      summary.dryRun === dryRun,
    "materializer summary is not exact, canonical-preserving, and acceptance-neutral",
  );
  const stack = [summary];
  while (stack.length > 0) {
    const value = stack.pop();
    if (!value || typeof value !== "object") continue;
    for (const [key, child] of Object.entries(value)) {
      if (
        /(accepted|authorized|complete|published|promoted|established)$/i.test(key)
      ) {
        invariant(child === false, `materializer promoted acceptance: ${key}`);
      }
      if (child && typeof child === "object") stack.push(child);
    }
  }
  return summary;
}

async function readReleaseBinding(root) {
  const binding = await secureReadBinding(root, RELEASE_RELATIVE_PATH);
  return {
    binding,
    release: exactRelease(JSON.parse(binding.content.toString("utf8"))),
  };
}

async function writeNoReplace(filePath, bytes, {mode = 0o444} = {}) {
  await mkdir(path.dirname(filePath), {recursive: true});
  const handle = await open(
    filePath,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function copyBindingNoReplace(root, destinationRoot, binding) {
  const destination = path.join(destinationRoot, binding.path);
  await writeNoReplace(destination, binding.content, {mode: 0o444});
  const observed = await secureReadBinding(destinationRoot, binding.path, {
    require0444: true,
  });
  invariant(sameContent(binding, observed), `copy verification failed: ${binding.path}`);
}

async function listFilesRecursively(root, relative = ".") {
  const absolute = relative === "." ? root : path.join(root, relative);
  const entries = await readdir(absolute, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const child = relative === "." ? entry.name : `${relative}/${entry.name}`;
    invariant(!entry.isSymbolicLink(), `immutable tree contains a symlink: ${child}`);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(root, child));
    else {
      invariant(entry.isFile(), `immutable tree contains a non-file: ${child}`);
      files.push(portable(child));
    }
  }
  return files;
}

async function archiveMachinePreimages(root, machineBindings) {
  const digest = bindingDigest(machineBindings);
  const relativeRoot = `${SETS_RELATIVE_PATH}/${digest}`;
  const absoluteRoot = path.join(root, relativeRoot);
  const manifest = {
    schemaVersion: 1,
    reportType: "g4-l3-workspace-inventory-machine-preimage-set",
    preimageSetSha256: digest,
    memberCount: 40,
    fileCount: 120,
    files: machineBindings.map(({path: relativePath, bytes, sha256: fileSha256}) => ({
      path: relativePath,
      bytes,
      sha256: fileSha256,
    })),
    acceptance: ACCEPTANCE_NEUTRAL,
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  if (await exists(absoluteRoot)) {
    const observedManifest = await secureReadBinding(
      root,
      `${relativeRoot}/manifest.json`,
      {require0444: true},
    );
    invariant(
      observedManifest.content.equals(manifestBytes),
      "content-addressed preimage manifest is tampered or colliding",
    );
    for (const binding of machineBindings) {
      const archived = await secureReadBinding(
        root,
        `${relativeRoot}/files/${binding.path}`,
        {require0444: true},
      );
      invariant(
        archived.bytes === binding.bytes && archived.sha256 === binding.sha256,
        `content-addressed preimage is tampered: ${binding.path}`,
      );
    }
    const actualFiles = await listFilesRecursively(absoluteRoot);
    const expectedFiles = [
      "manifest.json",
      ...machineBindings.map(({path: relativePath}) => `files/${relativePath}`),
    ].sort((a, b) => a.localeCompare(b, "en"));
    invariant(
      JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
      "content-addressed preimage tree has unexpected members",
    );
    return {relativeRoot, digest, reused: true, manifest};
  }
  await mkdir(path.dirname(absoluteRoot), {recursive: true});
  await assertRealDirectoryChain(root, SETS_RELATIVE_PATH);
  await mkdir(absoluteRoot, {recursive: false});
  for (const binding of machineBindings) {
    await copyBindingNoReplace(
      root,
      path.join(absoluteRoot, "files"),
      binding,
    );
  }
  await writeNoReplace(path.join(absoluteRoot, "manifest.json"), manifestBytes);
  return {relativeRoot, digest, reused: false, manifest};
}

async function acquireLock(root, transactionId, {recover = false} = {}) {
  const base = path.join(root, PREIMAGE_ROOT_RELATIVE_PATH);
  await mkdir(base, {recursive: true});
  await assertRealDirectoryChain(root, PREIMAGE_ROOT_RELATIVE_PATH);
  const lockPath = path.join(root, LOCK_RELATIVE_PATH);
  try {
    await mkdir(lockPath, {recursive: false});
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const ownerPath = path.join(lockPath, "owner.json");
    const owner = JSON.parse((await readFile(ownerPath)).toString("utf8"));
    let alive = true;
    try {
      process.kill(owner.pid, 0);
    } catch (probeError) {
      if (probeError.code === "ESRCH") alive = false;
      else throw probeError;
    }
    invariant(
      recover && !alive,
      `inventory refresh lock is held by pid ${owner.pid} transaction ${owner.transactionId}`,
    );
    const stalePath = `${lockPath}.stale-${owner.transactionId}-${randomBytes(4).toString("hex")}`;
    await rename(lockPath, stalePath);
    await mkdir(lockPath, {recursive: false});
  }
  const owner = {
    schemaVersion: 1,
    transactionId,
    pid: process.pid,
    host: os.hostname(),
    acquiredAt: new Date().toISOString(),
  };
  await writeNoReplace(path.join(lockPath, "owner.json"), Buffer.from(stableJson(owner)));
  return {lockPath, owner};
}

async function releaseLock(lock) {
  if (!lock) return;
  const ownerPath = path.join(lock.lockPath, "owner.json");
  const observed = JSON.parse((await readFile(ownerPath)).toString("utf8"));
  invariant(
    observed.transactionId === lock.owner.transactionId &&
      observed.pid === lock.owner.pid,
    "refusing to release a lock whose owner changed",
  );
  await unlink(ownerPath);
  await rmdir(lock.lockPath);
}

async function appendJournalEvent(transactionRoot, sequence, event) {
  let previousEventSha256 = null;
  if (sequence > 1) {
    const previousName = `events/${String(sequence - 1).padStart(6, "0")}.json`;
    const previous = await secureReadBinding(
      transactionRoot,
      previousName,
      {require0444: true},
    );
    previousEventSha256 = previous.sha256;
  }
  const document = {
    schemaVersion: 1,
    sequence,
    previousEventSha256,
    recordedAt: new Date().toISOString(),
    ...event,
    acceptance: ACCEPTANCE_NEUTRAL,
  };
  const relativeName = `events/${String(sequence).padStart(6, "0")}.json`;
  await writeNoReplace(
    path.join(transactionRoot, relativeName),
    Buffer.from(stableJson(document)),
  );
  return sequence + 1;
}

async function readJournalEvents(transactionRoot) {
  const eventsRoot = path.join(transactionRoot, "events");
  if (!await exists(eventsRoot)) return [];
  const names = (await readdir(eventsRoot)).sort();
  invariant(
    names.every((name) => /^\d{6}\.json$/.test(name)),
    "transaction journal has an unexpected member",
  );
  const events = [];
  let previousSha256 = null;
  for (const [index, name] of names.entries()) {
    const relativeName = `events/${name}`;
    const eventBinding = await secureReadBinding(
      transactionRoot,
      relativeName,
      {require0444: true},
    );
    const document = JSON.parse(eventBinding.content.toString("utf8"));
    invariant(
      document.sequence === index + 1 &&
        document.previousEventSha256 === previousSha256 &&
        document.acceptance?.effect === "none" &&
        document.acceptance?.strictComplete === false,
      `transaction journal is invalid at ${name}`,
    );
    events.push(document);
    previousSha256 = eventBinding.sha256;
  }
  return events;
}

async function preflight({
  root,
  materializer,
}) {
  const {binding: releaseBinding, release} = await readReleaseBinding(root);
  const scope = enumerateInventoryRefreshScope(release);
  const [machineBindings, canonicalBindings, materializerBinding, wrapperBinding] =
    await Promise.all([
      readBindings(root, scope.machinePaths),
      readBindings(root, scope.canonicalPaths),
      secureReadBinding(root, MATERIALIZER_RELATIVE_PATH),
      secureReadBinding(root, WRAPPER_RELATIVE_PATH),
    ]);
  const dryRunSummary = assertNeutralMaterializerSummary(
    await materializer({root, dryRun: true}),
    {check: false, dryRun: true},
  );
  const afterDryRunMachine = await readBindings(root, scope.machinePaths);
  const afterDryRunCanonical = await readBindings(root, scope.canonicalPaths);
  assertBindingsUnchanged(
    machineBindings,
    afterDryRunMachine,
    "machine output during materializer dry-run",
    {identity: true},
  );
  assertBindingsUnchanged(
    canonicalBindings,
    afterDryRunCanonical,
    "canonical inventory during materializer dry-run",
    {identity: true},
  );
  return {
    releaseBinding,
    release,
    scope,
    machineBindings,
    canonicalBindings,
    materializerBinding,
    wrapperBinding,
    dryRunSummary,
  };
}

async function stageDesiredMachineOutputs({
  root,
  transactionRoot,
  plan,
}) {
  const stagingRoot = path.join(transactionRoot, "staging");
  await mkdir(stagingRoot, {recursive: false});
  for (const relativePath of STAGING_SHARED_FILES) {
    const binding = await secureReadBinding(root, relativePath);
    await copyBindingNoReplace(root, stagingRoot, binding);
    await chmod(path.join(stagingRoot, relativePath), 0o644);
  }
  for (const member of plan.release.members) {
    for (const name of ["migration.json", ...CANONICAL_NAMES]) {
      const relativePath = `migrations/${member.animationId}/${name}`;
      const binding = await secureReadBinding(root, relativePath);
      await copyBindingNoReplace(root, stagingRoot, binding);
      await chmod(path.join(stagingRoot, relativePath), 0o644);
    }
  }
  const sourceLink = path.join(stagingRoot, "source-assets");
  await symlink(path.join(root, "source-assets"), sourceLink, "dir");
  const stagedScript = path.join(stagingRoot, MATERIALIZER_RELATIVE_PATH);
  const imported = await import(
    `${pathToFileURL(stagedScript).href}?transaction=${plan.transactionId}`
  );
  const writeSummary = assertNeutralMaterializerSummary(
    await imported.materializeG4L3WorkspaceInventories({root: stagingRoot}),
    {check: false, dryRun: false},
  );
  const checkSummary = assertNeutralMaterializerSummary(
    await imported.materializeG4L3WorkspaceInventories({
      root: stagingRoot,
      check: true,
    }),
    {check: true, dryRun: false},
  );
  const stagedCanonical = await readBindings(stagingRoot, plan.scope.canonicalPaths);
  assertBindingsUnchanged(
    plan.canonicalBindings,
    stagedCanonical,
    "staged canonical inventory",
  );
  const desiredBindings = await readBindings(stagingRoot, plan.scope.machinePaths);
  const desiredRoot = path.join(transactionRoot, "desired");
  await mkdir(desiredRoot, {recursive: false});
  for (const binding of desiredBindings) {
    await copyBindingNoReplace(root, desiredRoot, binding);
  }
  await unlink(sourceLink);
  return {
    desiredBindings,
    desiredRoot,
    writeSummary,
    checkSummary,
  };
}

async function verifyDesiredTree(transactionRoot, planDocument) {
  const desiredRoot = path.join(transactionRoot, "desired");
  const bindings = [];
  for (const expected of planDocument.desiredMachineOutputs) {
    const observed = await secureReadBinding(
      desiredRoot,
      expected.path,
      {require0444: true},
    );
    invariant(
      sameContent(expected, observed),
      `desired transaction output is tampered: ${expected.path}`,
    );
    bindings.push(observed);
  }
  return bindings;
}

async function writeTemporary(filePath, bytes) {
  const temporary = `${filePath}.inventory-refresh-${process.pid}-${randomBytes(6).toString("hex")}`;
  await writeNoReplace(temporary, bytes, {mode: 0o644});
  return temporary;
}

async function installNoReplace(temporary, target) {
  await link(temporary, target);
  await unlink(temporary);
}

async function restoreMovedNoReplace(moved, target) {
  try {
    await link(moved, target);
    await unlink(moved);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        `concurrent drift occupies ${portable(target)}; moved bytes preserved at ${portable(moved)}`,
      );
    }
    throw error;
  }
}

async function casReplace({
  root,
  transactionRoot,
  relativePath,
  expected,
  replacement,
  quarantineKind,
  ordinal,
  hook,
}) {
  const observed = await secureReadBinding(root, relativePath);
  invariant(
    sameIdentity(expected, observed),
    `CAS precondition failed before replacement: ${relativePath}`,
  );
  if (sameContent(expected, replacement)) return {changed: false, observed};
  if (hook) await hook({phase: "before-quarantine", relativePath, ordinal});
  const target = path.join(root, relativePath);
  const quarantineRelative =
    `quarantine/${quarantineKind}/${String(ordinal).padStart(3, "0")}-${sha256(relativePath).slice(0, 16)}.bin`;
  const quarantine = path.join(transactionRoot, quarantineRelative);
  await mkdir(path.dirname(quarantine), {recursive: true});
  invariant(!await exists(quarantine), `quarantine replay detected: ${quarantineRelative}`);
  const temporary = await writeTemporary(target, replacement.content);
  try {
    await rename(target, quarantine);
    const moved = await secureReadBinding(
      transactionRoot,
      quarantineRelative,
    );
    if (!sameMovedIdentity(expected, moved)) {
      await restoreMovedNoReplace(quarantine, target);
      throw new Error(`concurrent drift detected while quarantining ${relativePath}`);
    }
    if (hook) await hook({phase: "after-quarantine", relativePath, ordinal});
    try {
      await installNoReplace(temporary, target);
    } catch (error) {
      if (error.code === "EEXIST") {
        throw new Error(`concurrent drift appeared while installing ${relativePath}`);
      }
      throw error;
    }
    const installed = await secureReadBinding(root, relativePath);
    invariant(
      sameContent(replacement, installed),
      `installed bytes do not match desired output: ${relativePath}`,
    );
    await chmod(quarantine, 0o444);
    return {changed: true, observed: installed, quarantineRelative};
  } catch (error) {
    if (await exists(temporary)) await unlink(temporary);
    if (!await exists(target) && await exists(quarantine)) {
      await restoreMovedNoReplace(quarantine, target);
    }
    throw error;
  } finally {
    if (await exists(temporary)) await unlink(temporary);
  }
}

async function restorePreimage({
  root,
  transactionRoot,
  planDocument,
  currentExpected,
  preimage,
  ordinal,
  hook,
}) {
  if (sameContent(currentExpected, preimage)) return {changed: false};
  const archiveRoot = path.join(root, planDocument.preimageArchive.relativeRoot, "files");
  const archived = await secureReadBinding(
    archiveRoot,
    preimage.path,
    {require0444: true},
  );
  invariant(
    sameContent(preimage, archived),
    `rollback preimage is tampered: ${preimage.path}`,
  );
  return casReplace({
    root,
    transactionRoot,
    relativePath: preimage.path,
    expected: currentExpected,
    replacement: archived,
    quarantineKind: "rollback",
    ordinal,
    hook,
  });
}

async function rollbackUncommitted({
  root,
  transactionRoot,
  planDocument,
  hook,
}) {
  const conflicts = [];
  const restored = [];
  for (let index = planDocument.machinePreimages.length - 1; index >= 0; index -= 1) {
    const preimage = planDocument.machinePreimages[index];
    let current;
    try {
      current = await secureReadBinding(root, preimage.path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        conflicts.push({path: preimage.path, reason: error.message});
        continue;
      }
      const archiveRoot = path.join(root, planDocument.preimageArchive.relativeRoot, "files");
      const archived = await secureReadBinding(
        archiveRoot,
        preimage.path,
        {require0444: true},
      );
      const target = path.join(root, preimage.path);
      const temporary = await writeTemporary(target, archived.content);
      try {
        await installNoReplace(temporary, target);
        restored.push(preimage.path);
      } catch (installError) {
        conflicts.push({path: preimage.path, reason: installError.message});
      }
      continue;
    }
    if (sameContent(current, preimage)) continue;
    const desired = planDocument.desiredMachineOutputs.find(
      ({path: desiredPath}) => desiredPath === preimage.path,
    );
    if (!desired || !sameContent(current, desired)) {
      conflicts.push({
        path: preimage.path,
        reason: "current bytes are neither the preimage nor the transaction desired output",
        observedSha256: current.sha256,
      });
      continue;
    }
    try {
      if (hook) await hook({phase: "before-rollback", relativePath: preimage.path, ordinal: index + 1});
      const result = await restorePreimage({
        root,
        transactionRoot,
        planDocument,
        currentExpected: current,
        preimage,
        ordinal: index + 1,
        hook,
      });
      if (result.changed) restored.push(preimage.path);
    } catch (error) {
      conflicts.push({path: preimage.path, reason: error.message});
    }
  }
  const canonicals = await readBindings(
    root,
    planDocument.scope.canonicalPaths,
  );
  const canonicalDrift = [];
  for (let index = 0; index < canonicals.length; index += 1) {
    if (!sameContent(canonicals[index], planDocument.canonicalPreimages[index])) {
      canonicalDrift.push({
        path: canonicals[index].path,
        expectedSha256: planDocument.canonicalPreimages[index].sha256,
        observedSha256: canonicals[index].sha256,
      });
    }
  }
  return {restored, conflicts, canonicalDrift};
}

function transactionIdFor(preflightResult, requested) {
  if (requested) {
    invariant(
      /^[a-f0-9]{64}$/.test(requested),
      "transaction ID must be a lowercase SHA-256",
    );
    return requested;
  }
  return sha256(Buffer.from(stableJson({
    release: preflightResult.releaseBinding.sha256,
    machine: bindingDigest(preflightResult.machineBindings),
    canonical: bindingDigest(preflightResult.canonicalBindings),
    wrapper: preflightResult.wrapperBinding.sha256,
    materializer: preflightResult.materializerBinding.sha256,
    nonce: randomBytes(32).toString("hex"),
  })));
}

function publicPreflight(preflightResult) {
  return {
    release: publicBinding(preflightResult.releaseBinding),
    memberCount: preflightResult.release.members.length,
    machineOutputCount: preflightResult.machineBindings.length,
    canonicalInventoryCount: preflightResult.canonicalBindings.length,
    machineOutputSetSha256: bindingDigest(preflightResult.machineBindings),
    canonicalInventorySetSha256: bindingDigest(preflightResult.canonicalBindings),
    wrapper: publicBinding(preflightResult.wrapperBinding),
    materializer: publicBinding(preflightResult.materializerBinding),
    dryRunSummary: preflightResult.dryRunSummary,
    acceptance: ACCEPTANCE_NEUTRAL,
  };
}

export function parseArguments(argv) {
  const options = {mode: "dry-run", root: PROJECT_ROOT};
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (["--dry-run", "--check", "--apply"].includes(value)) {
      invariant(!explicitMode, "choose exactly one mode");
      options.mode = value.slice(2);
      explicitMode = true;
    } else if (value === "--recover") {
      invariant(!explicitMode, "choose exactly one mode");
      invariant(argv[index + 1], "--recover requires a transaction ID");
      options.mode = "recover";
      options.transactionId = argv[index + 1];
      explicitMode = true;
      index += 1;
    } else if (value === "--transaction-id") {
      invariant(argv[index + 1], "--transaction-id requires a value");
      options.transactionId = argv[index + 1];
      index += 1;
    } else if (value === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  invariant(
    options.mode === "apply" || options.transactionId === undefined ||
      options.mode === "recover",
    "--transaction-id is only valid with --apply or --recover",
  );
  return options;
}

export async function recoverInventoryRefreshTransaction({
  root = PROJECT_ROOT,
  transactionId,
  hooks = {},
} = {}) {
  invariant(/^[a-f0-9]{64}$/.test(transactionId || ""), "valid transaction ID is required");
  const transactionRoot = path.join(root, TRANSACTIONS_RELATIVE_PATH, transactionId);
  invariant(await exists(transactionRoot), `transaction does not exist: ${transactionId}`);
  invariant(!await exists(path.join(transactionRoot, "receipt.json")),
    "committed transaction cannot be replayed or recovered");
  const lock = await acquireLock(root, transactionId, {recover: true});
  let sequence = 1;
  try {
    const planBinding = await secureReadBinding(
      transactionRoot,
      "plan.json",
      {require0444: true},
    );
    const planDocument = JSON.parse(planBinding.content.toString("utf8"));
    invariant(
      planDocument.transactionId === transactionId &&
        planDocument.acceptance?.effect === "none" &&
        planDocument.machinePreimages?.length === 120 &&
        planDocument.desiredMachineOutputs?.length === 120 &&
        planDocument.canonicalPreimages?.length === 80,
      "transaction recovery plan is invalid",
    );
    await verifyDesiredTree(transactionRoot, planDocument);
    const events = await readJournalEvents(transactionRoot);
    invariant(
      events[0]?.event === "prepared" &&
        events[0].planSha256 === planBinding.sha256,
      "transaction journal does not bind the immutable recovery plan",
    );
    sequence = events.length + 1;
    const rollback = await rollbackUncommitted({
      root,
      transactionRoot,
      planDocument,
      hook: hooks.onCasBoundary,
    });
    sequence = await appendJournalEvent(transactionRoot, sequence, {
      event: "recovery-finished",
      rollback,
    });
    invariant(
      rollback.conflicts.length === 0,
      `recovery preserved ${rollback.conflicts.length} concurrent-drift conflict(s)`,
    );
    const current = await readBindings(root, planDocument.scope.machinePaths);
    assertBindingsUnchanged(
      planDocument.machinePreimages,
      current,
      "recovered machine output",
    );
    return {
      mode: "recover",
      transactionId,
      restored: rollback.restored.length,
      conflicts: 0,
      canonicalInventoryDrift: rollback.canonicalDrift,
      strictAcceptanceEffect: "none",
      acceptance: ACCEPTANCE_NEUTRAL,
    };
  } finally {
    await releaseLock(lock);
  }
}

export async function refreshG4L3WorkspaceInventoriesSafely({
  root = PROJECT_ROOT,
  mode = "dry-run",
  transactionId: requestedTransactionId,
  materializer = materializeG4L3WorkspaceInventories,
  desiredBuilder = stageDesiredMachineOutputs,
  hooks = {},
  testOnlyLeaveInterrupted = false,
} = {}) {
  invariant(
    ["dry-run", "check", "apply"].includes(mode),
    `unsupported inventory refresh mode: ${mode}`,
  );
  if (mode !== "apply") {
    const before = await preflight({root, materializer});
    if (mode === "dry-run") {
      return {
        mode,
        ...publicPreflight(before),
        writesPlanned: 120,
        writesPerformed: 0,
        archiveCreated: false,
        strictAcceptanceEffect: "none",
      };
    }
    const checkSummary = assertNeutralMaterializerSummary(
      await materializer({root, check: true}),
      {check: true, dryRun: false},
    );
    const machineAfter = await readBindings(root, before.scope.machinePaths);
    const canonicalAfter = await readBindings(root, before.scope.canonicalPaths);
    assertBindingsUnchanged(before.machineBindings, machineAfter, "checked machine output", {identity: true});
    assertBindingsUnchanged(before.canonicalBindings, canonicalAfter, "checked canonical inventory", {identity: true});
    return {
      mode,
      ...publicPreflight(before),
      checkSummary,
      writesPerformed: 0,
      strictAcceptanceEffect: "none",
    };
  }

  const initial = await preflight({root, materializer});
  const transactionId = transactionIdFor(initial, requestedTransactionId);
  const lock = await acquireLock(root, transactionId);
  const transactionRoot = path.join(root, TRANSACTIONS_RELATIVE_PATH, transactionId);
  let sequence = 1;
  let planDocument;
  try {
    invariant(!await exists(transactionRoot), `transaction replay detected: ${transactionId}`);
    const locked = await preflight({root, materializer});
    assertBindingsUnchanged(
      initial.machineBindings,
      locked.machineBindings,
      "machine output between initial and locked preflight",
      {identity: true},
    );
    assertBindingsUnchanged(
      initial.canonicalBindings,
      locked.canonicalBindings,
      "canonical inventory between initial and locked preflight",
      {identity: true},
    );
    const archive = await archiveMachinePreimages(root, locked.machineBindings);
    await mkdir(path.dirname(transactionRoot), {recursive: true});
    await assertRealDirectoryChain(root, TRANSACTIONS_RELATIVE_PATH);
    await mkdir(transactionRoot, {recursive: false});
    const provisionalPlan = {
      transactionId,
      release: locked.release,
      scope: locked.scope,
      canonicalBindings: locked.canonicalBindings,
    };
    const desired = await desiredBuilder({
      root,
      transactionRoot,
      plan: provisionalPlan,
      materializer,
    });
    invariant(
      desired.desiredBindings?.length === 120,
      "desired builder must produce exactly 120 outputs",
    );
    for (let index = 0; index < 120; index += 1) {
      invariant(
        desired.desiredBindings[index].path === locked.machineBindings[index].path,
        "desired output order/scope drifted",
      );
    }
    planDocument = {
      schemaVersion: 1,
      reportType: "g4-l3-workspace-inventory-safe-refresh-plan",
      transactionId,
      createdAt: new Date().toISOString(),
      release: locked.release,
      scope: locked.scope,
      preflight: publicPreflight(locked),
      preimageArchive: {
        relativeRoot: archive.relativeRoot,
        preimageSetSha256: archive.digest,
        reused: archive.reused,
      },
      machinePreimages: locked.machineBindings.map(publicBinding),
      desiredMachineOutputs: desired.desiredBindings.map(publicBinding),
      desiredMachineOutputSetSha256: bindingDigest(desired.desiredBindings),
      canonicalPreimages: locked.canonicalBindings.map(publicBinding),
      canonicalInventorySetSha256: bindingDigest(locked.canonicalBindings),
      stagedMaterializer: {
        writeSummary: desired.writeSummary,
        checkSummary: desired.checkSummary,
      },
      acceptance: ACCEPTANCE_NEUTRAL,
      strictAcceptanceEffect: "none",
    };
    await writeNoReplace(
      path.join(transactionRoot, "plan.json"),
      Buffer.from(stableJson(planDocument)),
    );
    const planBinding = await secureReadBinding(
      transactionRoot,
      "plan.json",
      {require0444: true},
    );
    sequence = await appendJournalEvent(transactionRoot, sequence, {
      event: "prepared",
      planSha256: planBinding.sha256,
      preimageSetSha256: archive.digest,
      desiredMachineOutputSetSha256: planDocument.desiredMachineOutputSetSha256,
    });
    await verifyDesiredTree(transactionRoot, planDocument);
    const beforeWritesCanonical = await readBindings(root, locked.scope.canonicalPaths);
    assertBindingsUnchanged(
      locked.canonicalBindings,
      beforeWritesCanonical,
      "canonical inventory before writes",
      {identity: true},
    );
    let writes = 0;
    for (let index = 0; index < 120; index += 1) {
      const result = await casReplace({
        root,
        transactionRoot,
        relativePath: locked.machineBindings[index].path,
        expected: locked.machineBindings[index],
        replacement: desired.desiredBindings[index],
        quarantineKind: "apply",
        ordinal: index + 1,
        hook: hooks.onCasBoundary,
      });
      if (result.changed) writes += 1;
      sequence = await appendJournalEvent(transactionRoot, sequence, {
        event: "machine-output-installed",
        ordinal: index + 1,
        path: locked.machineBindings[index].path,
        changed: result.changed,
        preimageSha256: locked.machineBindings[index].sha256,
        desiredSha256: desired.desiredBindings[index].sha256,
      });
      if (hooks.afterMachineWrite) {
        await hooks.afterMachineWrite({
          ordinal: index + 1,
          path: locked.machineBindings[index].path,
          changed: result.changed,
          transactionId,
        });
      }
    }
    const canonicalAfterWrites = await readBindings(root, locked.scope.canonicalPaths);
    assertBindingsUnchanged(
      locked.canonicalBindings,
      canonicalAfterWrites,
      "canonical inventory after writes",
      {identity: true},
    );
    const checkSummary = assertNeutralMaterializerSummary(
      await materializer({root, check: true}),
      {check: true, dryRun: false},
    );
    const [machineAfterCheck, canonicalAfterCheck] = await Promise.all([
      readBindings(root, locked.scope.machinePaths),
      readBindings(root, locked.scope.canonicalPaths),
    ]);
    assertBindingsUnchanged(desired.desiredBindings, machineAfterCheck, "post-check machine output");
    assertBindingsUnchanged(
      locked.canonicalBindings,
      canonicalAfterCheck,
      "post-check canonical inventory",
      {identity: true},
    );
    const receipt = {
      schemaVersion: 1,
      reportType: "g4-l3-workspace-inventory-safe-refresh-receipt",
      transactionId,
      committedAt: new Date().toISOString(),
      planSha256: planBinding.sha256,
      memberCount: 40,
      machineOutputCount: 120,
      canonicalInventoryCount: 80,
      machinePreimageSetSha256: archive.digest,
      machinePostimageSetSha256: bindingDigest(machineAfterCheck),
      canonicalPreimageSetSha256: bindingDigest(locked.canonicalBindings),
      canonicalPostimageSetSha256: bindingDigest(canonicalAfterCheck),
      canonicalInventoriesUnchanged: true,
      writesPerformed: writes,
      materializerCheck: checkSummary,
      publicationChanged: false,
      registryChanged: false,
      releaseLedgerChanged: false,
      completionLedgerChanged: false,
      acceptance: ACCEPTANCE_NEUTRAL,
      strictAcceptanceEffect: "none",
    };
    await writeNoReplace(
      path.join(transactionRoot, "receipt.json"),
      Buffer.from(stableJson(receipt)),
    );
    sequence = await appendJournalEvent(transactionRoot, sequence, {
      event: "committed",
      receiptSha256: sha256(Buffer.from(stableJson(receipt))),
    });
    return {
      mode,
      transactionId,
      transactionRoot: portable(path.relative(root, transactionRoot)),
      memberCount: 40,
      machineOutputCount: 120,
      canonicalInventoryCount: 80,
      writesPerformed: writes,
      canonicalInventoriesUnchanged: true,
      archive: planDocument.preimageArchive,
      checkSummary,
      acceptance: ACCEPTANCE_NEUTRAL,
      strictAcceptanceEffect: "none",
    };
  } catch (error) {
    if (planDocument && testOnlyLeaveInterrupted) {
      error.transactionId = transactionId;
      throw error;
    }
    if (planDocument) {
      const events = await readJournalEvents(transactionRoot);
      sequence = events.length + 1;
      sequence = await appendJournalEvent(transactionRoot, sequence, {
        event: "failure-observed",
        error: {name: error.name, message: error.message},
      });
      const rollback = await rollbackUncommitted({
        root,
        transactionRoot,
        planDocument,
        hook: hooks.onCasBoundary,
      });
      await appendJournalEvent(transactionRoot, sequence, {
        event: "rollback-finished",
        rollback,
      });
      if (rollback.conflicts.length > 0) {
        const aggregate = new AggregateError(
          [error, ...rollback.conflicts.map(({path: conflictPath, reason}) =>
            new Error(`${conflictPath}: ${reason}`))],
          "inventory refresh failed; concurrent drift was preserved and requires recovery",
        );
        aggregate.transactionId = transactionId;
        throw aggregate;
      }
    }
    error.transactionId = transactionId;
    throw error;
  } finally {
    await releaseLock(lock);
  }
}

function usage() {
  return [
    "Usage: node scripts/refresh-g4-l3-workspace-inventories-safely.mjs [mode] [options]",
    "",
    "Modes:",
    "  --dry-run                 Exact 40/120/80 preflight only (default)",
    "  --check                   Preflight, then invoke the materializer in check mode",
    "  --apply                   Stage desired outputs, archive preimages, CAS-install, and verify",
    "  --recover <transaction>   Roll back an interrupted uncommitted transaction",
    "",
    "Options:",
    "  --transaction-id <sha256> Supply a unique transaction ID for an apply",
    "  --root <dir>              Override the repository root (test fixtures)",
    "",
    "The wrapper never changes canonical inventories or acceptance. Apply is explicit.",
    "Desired bytes are generated by the unchanged materializer in an isolated staging root;",
    "the real workspace receives only 120 machine outputs through compare-and-swap writes.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = options.mode === "recover"
    ? await recoverInventoryRefreshTransaction(options)
    : await refreshG4L3WorkspaceInventoriesSafely(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    if (error.transactionId) {
      process.stderr.write(`transactionId=${error.transactionId}\n`);
    }
    process.exitCode = 1;
  });
}
