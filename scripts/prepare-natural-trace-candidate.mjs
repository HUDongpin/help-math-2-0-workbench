#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {link, lstat, mkdir, open, readFile, realpath, readdir, rmdir, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  CAPTURE_SESSION_AUTHORITY_NOTE,
  CANDIDATE_AUTHORITY,
  CANDIDATE_STATUS,
  MAX_ROOT_FRAME_DECODED_TOTAL_BYTES,
  MAX_ROOT_FRAME_PNG_TOTAL_BYTES,
  PROMOTION_REQUIRED,
  assertExactKeys,
  assertNoExistingSymlinkComponents,
  assertObject,
  assertSha256,
  assertString,
  digest,
  ensureRealOutputDirectory,
  exists,
  isLexicallyInside,
  isPlainObject,
  orderedFrameSetSha256,
  parseSessionTime,
  portable,
  readJson,
  readJsonLines,
  recordHash,
  renderJson,
  requirementIdentity,
  requireProjection,
  resolveFixedOutputPath,
  resolveInputPath,
  specIdentity,
  validateNamedHuman,
  validateRootFramePngBytes,
  verifyReceipt,
  writeNewAtomic,
} from "./prepare-root-capture-candidate.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
export const NATURAL_TRACE_PROOF_MODE = "natural-trace-ordered-events";
const PROOF_MODE = NATURAL_TRACE_PROOF_MODE;
const APPROVED_RUNTIME = Object.freeze({
  runtimeId: "adobe-flash-player-projector",
  name: "Adobe Flash Player Projector",
  version: "32.0.0.414",
  executableSha256: "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30",
});
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT = "本人声明这些自然播放帧、源动作、状态、目标解析和 PNG 均在同一个 Adobe Flash Player 会话中现场生成，未事后补写；此声明不等同于运行时来源的独立证明";
export const NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE = `${CAPTURE_SESSION_AUTHORITY_NOTE} 本候选工具不会把自然轨迹证据提升为权威 baseline。`;
export const NATURAL_ENVIRONMENT_ISOLATION_STATEMENT = "本人确认本次 Adobe Flash 会话运行在独立、可丢弃且未复用的 macOS VM 快照或一次性登录账户中，使用该账户真实独立 home 下正常可读写且会话前为空的 Flash profile，并已在会话后重置或销毁";
export const NATURAL_PROJECTOR_LAUNCH_PROTOCOL = "two-stage-empty-projector-then-named-human-file-open";
export const NATURAL_HOST_OPEN_METHOD = "named-human-gui-file-open";
export const NATURAL_HOST_OPEN_MENU_PATH = Object.freeze(["File", "Open File…"]);
export const NATURAL_LAUNCH_RECEIPT_STATEMENT = "本人确认 hash-bound kit 自检通过后，launcher 只启动未带 SWF 参数的空 Adobe Projector；随后我本人通过 File → Open File… 选择所列 staged original host，并确认 Player 内容窗口出现；未直接启动 source-assets 或 child SWF，也未声称命令行已打开 SWF";

function nodeIdentity(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNodeIdentity(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return info.mode & 0o777;
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoExistingSymlinkComponents(root, directory, label);
  const before = await lstat(directory);
  if (!before.isDirectory() || before.isSymbolicLink()) throw new Error(`${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const after = await lstat(directory);
  if (
    !after.isDirectory() || after.isSymbolicLink() ||
    !sameNodeIdentity(nodeIdentity(before), nodeIdentity(after))
  ) throw new Error(`${label} identity changed while it was inspected`);
  if (actualDirectory !== path.resolve(actualRoot, path.relative(root, directory))) {
    throw new Error(`${label} resolves outside its fixed lexical path`);
  }
  return {node: nodeIdentity(after), realPath: actualDirectory, mode: permissionMode(after)};
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  if (observed.realPath !== expected.realPath || !sameNodeIdentity(observed.node, expected.node)) {
    throw new Error(`${label} identity changed during natural candidate preparation`);
  }
  return observed;
}

async function captureProtectedFile(root, candidate, label) {
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const before = await lstat(candidate);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error(`${label} must be a regular non-symbolic-link file`);
  if (before.nlink !== 1) throw new Error(`${label} must not be hard-linked`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate);
  if (
    !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 ||
    !sameNodeIdentity(nodeIdentity(before), nodeIdentity(after)) ||
    after.size !== before.size || permissionMode(after) !== permissionMode(before)
  ) throw new Error(`${label} identity changed while it was captured`);
  return {
    path: candidate,
    label,
    node: nodeIdentity(after),
    size: after.size,
    mode: permissionMode(after),
    sha256: digest(bytes),
  };
}

async function assertProtectedFileUnchanged(root, snapshot, phase) {
  await assertNoExistingSymlinkComponents(root, snapshot.path, snapshot.label);
  const before = await lstatIfPresent(snapshot.path);
  if (
    !before?.isFile() || before.isSymbolicLink() || before.nlink !== 1 ||
    !sameNodeIdentity(nodeIdentity(before), snapshot.node) || before.size !== snapshot.size ||
    permissionMode(before) !== snapshot.mode
  ) throw new Error(`${snapshot.label} inode/mode/link identity changed ${phase}`);
  const bytes = await readFile(snapshot.path);
  const after = await lstatIfPresent(snapshot.path);
  if (
    !after?.isFile() || after.isSymbolicLink() || after.nlink !== 1 ||
    !sameNodeIdentity(nodeIdentity(after), snapshot.node) || after.size !== snapshot.size ||
    permissionMode(after) !== snapshot.mode || digest(bytes) !== snapshot.sha256
  ) throw new Error(`${snapshot.label} bytes or identity changed ${phase}`);
}

async function assertProtectedInputsUnchanged(root, snapshots, phase) {
  for (const snapshot of snapshots) await assertProtectedFileUnchanged(root, snapshot, phase);
}

function pathsOverlap(left, right) {
  return isLexicallyInside(left, right) || isLexicallyInside(right, left);
}

async function verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink = true}) {
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const before = await lstat(candidate);
  if (
    !before.isFile() || before.isSymbolicLink() ||
    (requireSingleLink && before.nlink !== 1) ||
    !sameNodeIdentity(nodeIdentity(before), ownership.node) ||
    permissionMode(before) !== ownership.mode
  ) throw new Error(`${label} ownership/inode/mode/link identity changed`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate);
  if (
    !after.isFile() || after.isSymbolicLink() ||
    (requireSingleLink && after.nlink !== 1) ||
    !sameNodeIdentity(nodeIdentity(after), ownership.node) ||
    after.size !== before.size || permissionMode(after) !== ownership.mode ||
    digest(bytes) !== ownership.sha256
  ) throw new Error(`${label} changed while it was verified`);
  return after;
}

async function writeOwnedExclusive({root, parent, parentIdentity, candidate, bytes, label, collection, key = path.basename(candidate)}) {
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, 0o444);
  let ownership;
  try {
    const initial = await handle.stat();
    ownership = {node: nodeIdentity(initial), sha256: digest(bytes), mode: 0o444};
    collection?.set(key, ownership);
    await handle.writeFile(bytes);
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: true});
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  return ownership;
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    const info = await lstatIfPresent(candidate);
    if (
      !info?.isFile() || info.isSymbolicLink() || info.nlink !== 1 ||
      !sameNodeIdentity(nodeIdentity(info), ownership?.node) || permissionMode(info) !== ownership?.mode ||
      digest(await readFile(candidate)) !== ownership?.sha256
    ) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function removeOwnedEmptyDirectory(directory, ownership) {
  try {
    const info = await lstatIfPresent(directory);
    if (
      !info?.isDirectory() || info.isSymbolicLink() ||
      !sameNodeIdentity(nodeIdentity(info), ownership?.node) || (await readdir(directory)).length !== 0
    ) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function createOwnedDirectory(root, directory, label, mode = 0o700) {
  await assertNoExistingSymlinkComponents(root, directory, label);
  if (await lstatIfPresent(directory)) throw new Error(`${label} already exists; refusing replacement`);
  const parent = path.dirname(directory);
  const parentIdentity = await captureDirectoryIdentity(root, parent, `${label} parent`);
  await mkdir(directory, {recursive: false, mode});
  const identity = await captureDirectoryIdentity(root, directory, label);
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  return {path: directory, identity, files: new Map()};
}

async function cleanupOwnedDirectory(transaction) {
  if (!transaction) return false;
  for (const [basename, ownership] of [...transaction.files.entries()].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(transaction.path, basename), ownership);
  }
  return removeOwnedEmptyDirectory(transaction.path, transaction.identity);
}

async function publishOwnedArchive({root, archiveParent, archiveParentIdentity, stagedTransaction, archiveDirectory}) {
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "pending natural archive parent");
  await assertDirectoryIdentity(root, stagedTransaction.path, stagedTransaction.identity, "natural staged candidate archive");
  await assertNoExistingSymlinkComponents(root, archiveDirectory, "natural candidate archive");
  if (await lstatIfPresent(archiveDirectory)) throw new Error("natural archive output already exists; append-only publication refuses replacement");
  await mkdir(archiveDirectory, {recursive: false, mode: 0o755});
  const archiveTransaction = {
    path: archiveDirectory,
    identity: await captureDirectoryIdentity(root, archiveDirectory, "natural candidate archive"),
    files: new Map(),
  };
  try {
    for (const [basename, ownership] of [...stagedTransaction.files.entries()]) {
      await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "pending natural archive parent");
      await assertDirectoryIdentity(root, stagedTransaction.path, stagedTransaction.identity, "natural staged candidate archive");
      await assertDirectoryIdentity(root, archiveDirectory, archiveTransaction.identity, "natural candidate archive");
      const source = path.join(stagedTransaction.path, basename);
      const destination = path.join(archiveDirectory, basename);
      await verifyOwnedRegularFile({root, candidate: source, ownership, label: `natural staged ${basename}`, requireSingleLink: true});
      await link(source, destination);
      archiveTransaction.files.set(basename, ownership);
      await verifyOwnedRegularFile({root, candidate: destination, ownership, label: `natural archived ${basename}`, requireSingleLink: false});
      const sourceInfo = await lstat(source);
      if (!sameNodeIdentity(nodeIdentity(sourceInfo), ownership.node) || sourceInfo.nlink !== 2) {
        throw new Error(`natural staged ${basename} link identity changed during publication`);
      }
      await unlink(source);
      stagedTransaction.files.delete(basename);
      await verifyOwnedRegularFile({root, candidate: destination, ownership, label: `natural archived ${basename}`, requireSingleLink: true});
    }
    const entries = await readdir(archiveDirectory, {withFileTypes: true});
    if (
      entries.length !== archiveTransaction.files.size || entries.some((entry) => !entry.isFile()) ||
      !same(entries.map(({name}) => name).sort(), [...archiveTransaction.files.keys()].sort())
    ) throw new Error("natural candidate archive inventory changed during publication");
    return archiveTransaction;
  } catch (error) {
    await cleanupOwnedDirectory(archiveTransaction);
    throw error;
  }
}

async function verifyOwnedArchive(root, transaction) {
  await assertDirectoryIdentity(root, transaction.path, transaction.identity, "natural candidate archive");
  const entries = await readdir(transaction.path, {withFileTypes: true});
  if (
    entries.length !== transaction.files.size || entries.some((entry) => !entry.isFile()) ||
    !same(entries.map(({name}) => name).sort(), [...transaction.files.keys()].sort())
  ) throw new Error("natural candidate archive contains a foreign, missing, or replaced entry");
  for (const [basename, ownership] of transaction.files) {
    await verifyOwnedRegularFile({
      root,
      candidate: path.join(transaction.path, basename),
      ownership,
      label: `natural candidate archive ${basename}`,
      requireSingleLink: true,
    });
  }
}

async function capturePublishedOwnership(root, candidate, expectedSha256, label) {
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const info = await lstat(candidate);
  if (
    !info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || permissionMode(info) !== 0o444 ||
    digest(await readFile(candidate)) !== expectedSha256
  ) throw new Error(`${label} changed immediately after append-only publication`);
  return {node: nodeIdentity(info), sha256: expectedSha256, mode: 0o444};
}

function usage() {
  return `Usage: node scripts/prepare-natural-trace-candidate.mjs [options]

FAIL-CLOSED PREPARER ONLY: verifies and archives a named-human-attested natural
trace candidate. It never launches Flash Player, invents evidence, or promotes a
candidate into canonical acceptance evidence.

Required:
  --spec <file>                        Current indexed ready natural trace spec
  --operation-log <file>               Hash-chained frame/action JSONL
  --frames <directory>                 Exactly every declared 800x600 PNG
  --state-snapshots <file>              Hash-chained per-frame state JSONL
  --source-target-resolutions <file>    Hash-chained per-step target JSONL
  --host-entry-log <file>               Hash-chained original-host entry JSONL
  --environment-isolation-receipt <file> Named-human disposable-environment receipt
  --launch-receipt <file>               Hash-bound original-host launch receipt
  --toolchain-receipt <file>            Session-bound Adobe receipt
  --capture-session-attestation <file>  Named-human same-session attestation

Options:
  --project-root <directory>            Project root (default: repository root)
  -h, --help                            Show this help

Only Adobe Flash Player Projector 32.0.0.414 with executable SHA-256
${APPROVED_RUNTIME.executableSha256} is accepted. Outputs are fixed under
pending-natural-trace-capture and pending-human-owner-natural-trace. Existing
outputs, symlink escapes, canonical baseline/execution destinations, coverage
updates, review changes, and promotion/adoption flags are rejected.`;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function assertObservedState(expected, observed, label) {
  assertObject(expected, `${label} expected state`);
  assertObject(observed, `${label} observed state`);
  const visit = (wanted, actual, cursor) => {
    if (Array.isArray(wanted)) {
      if (!Array.isArray(actual) || !same(wanted, actual)) throw new Error(`${cursor} differs from the source-specified expected state`);
      return;
    }
    if (isPlainObject(wanted)) {
      if (!isPlainObject(actual)) throw new Error(`${cursor} must be an object matching the source-specified expected state`);
      for (const [key, value] of Object.entries(wanted)) {
        if (!Object.hasOwn(actual, key)) throw new Error(`${cursor}.${key} is missing from the observed state`);
        visit(value, actual[key], `${cursor}.${key}`);
      }
      return;
    }
    if (!Object.is(wanted, actual)) throw new Error(`${cursor} differs from the source-specified expected state`);
  };
  visit(expected, observed, label);
}

function stateSha256(value) {
  return sha256Text(canonicalJson(value));
}

export function naturalOperationEventSha256(record) {
  return recordHash(record, "eventSha256");
}

export function naturalStateRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function naturalTargetResolutionSha256(record) {
  return recordHash(record, "recordSha256");
}

export function naturalCaptureSessionAttestationSha256(attestation) {
  return recordHash(attestation, "attestationSha256");
}

export function naturalEnvironmentIsolationReceiptSha256(receipt) {
  return recordHash(receipt, "receiptSha256");
}

export function naturalLaunchReceiptSha256(receipt) {
  return recordHash(receipt, "receiptSha256");
}

export function naturalHostEntryRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

function candidateResultSha256(record) {
  return recordHash(record, "resultSha256");
}

function scheduleBinding(spec) {
  return {
    orderedStepsSha256: stateSha256(spec.schedule.orderedSteps),
    stateCheckpointsSha256: stateSha256(spec.schedule.stateCheckpoints),
    playbackSegmentsSha256: stateSha256(spec.schedule.playbackSegments),
    terminalExpectedStateSha256: stateSha256(spec.schedule.terminalSemantics.expectedState),
  };
}

function validateSchedule(spec) {
  const {schedule, frameDomain, identity} = spec;
  if (
    schedule?.status !== "source-evidenced-executable" || schedule.noActionsRequired !== false ||
    !Array.isArray(schedule.orderedSteps) || !schedule.orderedSteps.length ||
    !Array.isArray(schedule.stateCheckpoints) || !schedule.stateCheckpoints.length ||
    !Array.isArray(schedule.playbackSegments) || !schedule.playbackSegments.length ||
    schedule.terminalSemantics?.status !== "source-evidenced"
  ) throw new Error("natural trace specification does not contain a complete source-evidenced executable schedule");
  if ((schedule.executedSteps || []).length) throw new Error("trace specification executedSteps must remain empty before authoritative execution");
  const first = identity.requiredRange?.firstFrame;
  const last = identity.requiredRange?.lastFrame;
  if (first !== 1 || last !== frameDomain.frameCount || !Number.isInteger(last) || last < 2) {
    throw new Error("natural trace specification must exhaust local frames 1..N");
  }
  if (
    schedule.exhaustiveFrameCapturePlan?.indexing !== "one-indexed" ||
    schedule.exhaustiveFrameCapturePlan?.firstFrame !== 1 ||
    schedule.exhaustiveFrameCapturePlan?.lastFrame !== last ||
    schedule.exhaustiveFrameCapturePlan?.frameCount !== last
  ) throw new Error("natural trace exhaustive frame capture plan differs from frameDomain 1..N");

  const checkpoints = new Map();
  for (const [index, checkpoint] of schedule.stateCheckpoints.entries()) {
    assertString(checkpoint?.id, `schedule.stateCheckpoints[${index}].id`);
    assertObject(checkpoint.expectedState, `schedule.stateCheckpoints[${index}].expectedState`);
    if (checkpoints.has(checkpoint.id)) throw new Error(`duplicate state checkpoint ${checkpoint.id}`);
    checkpoints.set(checkpoint.id, checkpoint);
  }
  for (const [index, step] of schedule.orderedSteps.entries()) {
    if (step?.order !== index + 1) throw new Error("natural trace orderedSteps must use contiguous one-indexed order");
    for (const field of ["action", "sourceTarget", "preStateCheckpoint", "postStateCheckpoint"]) {
      assertObject(step[field], `schedule.orderedSteps[${index}].${field}`);
    }
    const pre = checkpoints.get(step.preStateCheckpoint.checkpointId);
    const post = checkpoints.get(step.postStateCheckpoint.checkpointId);
    if (!pre || !post) throw new Error(`ordered step ${step.order} references an unknown state checkpoint`);
    if (!same(pre.expectedState, step.preStateCheckpoint.expectedState) || !same(post.expectedState, step.postStateCheckpoint.expectedState)) {
      throw new Error(`ordered step ${step.order} pre/post checkpoint state differs from the canonical schedule checkpoint`);
    }
    const preFrame = pre.expectedState.localFrame;
    const postFrame = post.expectedState.localFrame;
    if (!Number.isInteger(preFrame) || postFrame !== preFrame + 1) {
      throw new Error(`ordered step ${step.order} must bridge one observed local frame to the immediately following frame`);
    }
    if (!Array.isArray(step.evidence) || !step.evidence.length) throw new Error(`ordered step ${step.order} has no source evidence`);
  }

  const frameOwners = new Array(last + 1).fill(null);
  for (const [index, segment] of schedule.playbackSegments.entries()) {
    const start = segment?.requiredRange?.firstFrame;
    const end = segment?.requiredRange?.lastFrame;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > last) {
      throw new Error(`playback segment ${index + 1} has an invalid required range`);
    }
    assertObject(segment.expectedState, `playback segment ${segment.id || index + 1}.expectedState`);
    for (let frame = start; frame <= end; frame += 1) {
      if (frameOwners[frame]) throw new Error(`playback segments overlap at local frame ${frame}`);
      frameOwners[frame] = segment;
    }
  }
  for (let frame = 1; frame <= last; frame += 1) {
    if (!frameOwners[frame]) throw new Error(`playback segments do not cover local frame ${frame}`);
  }
  assertObject(schedule.terminalSemantics.expectedState, "schedule.terminalSemantics.expectedState");
  return {checkpoints, frameOwners};
}

async function verifyScheduleDerivation(root, workspace, spec) {
  const derivation = spec.sourceBindings?.scheduleDerivation;
  if (derivation?.status !== "hash-bound-static-source-derivation-not-runtime-execution" || derivation.executionEvidenceCreated !== false) {
    throw new Error("natural schedule derivation binding is absent or already claims execution evidence");
  }
  const descriptors = [derivation.generator, derivation.geometryParser];
  for (const [index, descriptor] of descriptors.entries()) {
    assertString(descriptor?.path, `schedule derivation tool ${index + 1}.path`);
    assertSha256(descriptor.sha256, `schedule derivation tool ${index + 1}.sha256`);
    const candidate = await resolveInputPath({root, workspace, declared: descriptor.path, label: `schedule derivation tool ${index + 1}`, bases: [root]});
    if (digest(await readFile(candidate)) !== descriptor.sha256) throw new Error(`schedule derivation tool ${index + 1} SHA-256 is stale`);
  }
  for (const [key, descriptor] of Object.entries(derivation.sourceArtifacts || {})) {
    if (!descriptor?.path || !descriptor?.sha256) continue;
    const candidate = await resolveInputPath({root, workspace, declared: descriptor.path, label: `schedule derivation source ${key}`, bases: [workspace, root]});
    if (digest(await readFile(candidate)) !== descriptor.sha256) throw new Error(`schedule derivation source ${key} SHA-256 is stale`);
  }
}

export async function loadOriginalHostEvidence({root, workspace, spec, originalHostSwf}) {
  const definitions = [
    ["entryContract", "audit/original-host-entry-contract.json", "help-math-original-host-entry-contract"],
    ["minimalTree", "audit/original-host-minimal-tree.json", "help-math-original-host-minimal-lesson-tree-manifest"],
    ["sideEffectDenyList", "audit/original-host-side-effect-deny-list.json", "help-math-original-host-side-effect-deny-list"],
    ["placementProof", "audit/original-host-placement-proof.json", "help-math-original-host-structural-placement-proof"],
  ];
  const evidence = {};
  const documents = {};
  for (const [key, relative, artifactType] of definitions) {
    const candidate = path.join(workspace, relative);
    await assertNoExistingSymlinkComponents(root, candidate, `original-host ${key}`);
    const document = await readJson(candidate, `original-host ${key}`);
    if (document.value?.schemaVersion !== 1 || document.value?.artifactType !== artifactType || document.value?.animationId !== spec.animationId) {
      throw new Error(`original-host ${key} identity/type is invalid`);
    }
    const generator = document.value.generatedBy;
    assertString(generator?.path, `original-host ${key}.generatedBy.path`);
    assertSha256(generator.sha256, `original-host ${key}.generatedBy.sha256`);
    const generatorPath = await resolveInputPath({root, workspace, declared: generator.path, label: `original-host ${key} generator`, bases: [root]});
    await assertNoExistingSymlinkComponents(root, generatorPath, `original-host ${key} generator`);
    if (digest(await readFile(generatorPath)) !== generator.sha256) throw new Error(`original-host ${key} generator SHA-256 is stale`);
    evidence[key] = {file: portable(path.relative(root, candidate)), sha256: document.sha256};
    documents[key] = document.value;
  }
  const {entryContract, minimalTree, sideEffectDenyList, placementProof} = documents;
  const expectedTree = [
    {path: originalHostSwf.path, role: "unmodified-original-lesson-host"},
    {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf", role: "source-script-proven-default-startup-child"},
    {path: spec.sourceBindings.sourceSwf.path, role: "target-animation-child"},
    {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3", role: "source-script-derived-spanish-user-activated-track"},
    {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", role: "automatic-english-keyterm-xml-read-at-host-root-frame-50"},
  ];
  if (
    !same({path: entryContract.sourceHost?.path, sha256: entryContract.sourceHost?.sha256}, originalHostSwf) ||
    !same({path: entryContract.targetChild?.path, sha256: entryContract.targetChild?.sha256}, spec.sourceBindings.sourceSwf) ||
    entryContract.sourceHost?.header?.nativeStage?.width !== 800 || entryContract.sourceHost?.header?.nativeStage?.height !== 600 ||
    entryContract.sourceHost?.header?.fps !== 12 || entryContract.authority?.sourceDerivationComplete !== true ||
    entryContract.authority?.originalRuntimeExecutedByThisArtifact !== false || entryContract.authority?.baselineAuthorityClaimed !== false ||
    entryContract.authority?.naturalTraceFramesCapturedByThisArtifact !== 0 ||
    entryContract.contracts?.childLoad?.status !== "source-proven" ||
    entryContract.contracts?.internalPreloaderEntryHandoff?.status !== "source-proven" ||
    entryContract.contracts?.targetNavigationInventory?.status !== "source-proven-clean-start-next-control-runtime-navigation-still-to-be-executed" ||
    entryContract.contracts?.automaticEnglishKeytermRead?.status !== "source-proven-request-chain-runtime-load-and-parse-result-pending" ||
    !same(entryContract.contracts?.automaticEnglishKeytermRead?.structuralPlacementProof, {
      path: evidence.placementProof.file,
      sha256: evidence.placementProof.sha256,
    })
  ) throw new Error("original-host entry contract does not prove the bounded source entry while keeping runtime authority false");
  if (
    minimalTree.selectionPolicy?.failClosed !== true || minimalTree.selectionPolicy?.sourceTreeCopiedByThisGenerator !== false ||
    minimalTree.validation?.allRequiredFilesExist !== true || minimalTree.validation?.allRequiredHashesMatch !== true ||
    minimalTree.validation?.layoutDerivedFromSourceScripts !== true || minimalTree.validation?.wholeLessonTreeRequired !== false ||
    minimalTree.validation?.automaticKeytermRequestRuntimeResultPending !== true ||
    !same(minimalTree.structuralPlacementProof, {path: evidence.placementProof.file, sha256: evidence.placementProof.sha256}) ||
    minimalTree.requiredFileCount !== 5 || !Array.isArray(minimalTree.requiredFiles) || minimalTree.requiredFiles.length !== minimalTree.requiredFileCount ||
    !same(minimalTree.expectedRelativeLayoutFromArchiveRoot, expectedTree.map((item) => item.path.replace("source-assets/flash/HELP MATH_ORIGINAL FILES/", ""))) ||
    !same(minimalTree.requiredFiles.map(({path: file, role}) => ({path: file, role})), expectedTree) ||
    !minimalTree.requiredFiles.some((item) => item.path === originalHostSwf.path && item.sha256 === originalHostSwf.sha256) ||
    !minimalTree.requiredFiles.some((item) => item.path === spec.sourceBindings.sourceSwf.path && item.sha256 === spec.sourceBindings.sourceSwf.sha256)
  ) throw new Error("original-host minimal-tree manifest is incomplete or authority-escalating");
  const spanishTreeItem = minimalTree.requiredFiles[3];
  const keytermTreeItem = minimalTree.requiredFiles[4];
  if (
    !same(entryContract.contracts?.spanishAudioStopResume?.expectedResolvedTrack, {
      path: spanishTreeItem.path,
      sha256: spanishTreeItem.sha256,
      bytes: spanishTreeItem.bytes,
      role: spanishTreeItem.role,
    }) ||
    !same(entryContract.contracts?.automaticEnglishKeytermRead?.expectedResolvedFile, {
      path: keytermTreeItem.path,
      sha256: keytermTreeItem.sha256,
      bytes: keytermTreeItem.bytes,
      role: keytermTreeItem.role,
    })
  ) throw new Error("original-host entry contract resolved Spanish/XML dependencies differ from the exact five-file tree");
  let totalBytes = 0;
  for (const [index, item] of minimalTree.requiredFiles.entries()) {
    assertString(item.path, `original-host minimalTree.requiredFiles[${index}].path`);
    assertSha256(item.sha256, `original-host minimalTree.requiredFiles[${index}].sha256`);
    const candidate = await resolveInputPath({root, workspace, declared: item.path, label: `original-host minimal-tree file ${index + 1}`, bases: [root]});
    await assertNoExistingSymlinkComponents(root, candidate, `original-host minimal-tree file ${index + 1}`);
    const bytes = await readFile(candidate);
    if (bytes.length !== item.bytes || digest(bytes) !== item.sha256) throw new Error(`original-host minimal-tree file ${index + 1} bytes/SHA-256 are stale`);
    totalBytes += bytes.length;
  }
  if (totalBytes !== minimalTree.requiredTotalBytes) throw new Error("original-host minimal-tree requiredTotalBytes is stale");
  const definitionsById = new Map((placementProof.structuralChain?.definitions || []).map((item) => [item.objectId, item]));
  const placements = placementProof.structuralChain?.placements || [];
  if (
    !same({path: placementProof.sourceHost?.path, sha256: placementProof.sourceHost?.sha256}, originalHostSwf) ||
    definitionsById.get(696)?.frameCount !== 1 || definitionsById.get(697)?.frameCount !== 1 ||
    !placements.some((item) => item.timelineId === "root" && item.frame === 50 && item.objectId === 697 && item.instanceName === "glossary") ||
    !placements.some((item) => item.timelineId === "sprite-697" && item.frame === 1 && item.objectId === 696 && item.instanceName === "keyterms") ||
    typeof placementProof.runtimeQualification !== "string" || !placementProof.runtimeQualification.includes("not XML parse success")
  ) throw new Error("original-host structural placement proof does not establish the automatic keyterm request boundary");
  if (
    sideEffectDenyList.defaultPolicy !== "deny-all-external-effects-and-dynamic-loads-except-hash-bound-local-read-allowlist" ||
    sideEffectDenyList.authority?.sandboxEnforcedByThisArtifact !== false ||
    sideEffectDenyList.authority?.sideEffectsExecutedByThisArtifact !== false ||
    !Array.isArray(sideEffectDenyList.localReadAllowlist) ||
    !same(
      sideEffectDenyList.localReadAllowlist.map(({path: file, sha256, bytes, role}) => ({path: file, sha256, bytes, role})),
      minimalTree.requiredFiles.map(({path: file, sha256, bytes, role}) => ({path: file, sha256, bytes, role})),
    )
  ) throw new Error("original-host side-effect deny list differs from the fail-closed minimal-tree allowlist");
  return evidence;
}

async function listRuntimeTreeFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`natural runtime tree contains a forbidden symbolic link: ${relative}`);
    if (entry.isDirectory()) files.push(...await listRuntimeTreeFiles(candidate, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`natural runtime tree contains an unsupported filesystem entry: ${relative}`);
  }
  return files.sort();
}

async function verifyRuntimeTreeManifest({root, bound, descriptor}) {
  assertExactKeys(descriptor, ["file", "sha256"], "natural capture-session runtimeTreeManifest");
  const expectedFile = portable(path.join(
    "work",
    "natural-trace-capture-kits",
    bound.spec.animationId,
    safeRequirementId(bound.spec.requirementId),
    "runtime-tree-manifest.json",
  ));
  if (descriptor.file !== expectedFile) throw new Error("natural capture-session runtimeTreeManifest is not the fixed checked-kit manifest");
  const manifestPath = await resolveInputPath({
    root,
    workspace: bound.workspace,
    declared: descriptor.file,
    label: "natural runtime-tree manifest",
    bases: [root],
  });
  await assertNoExistingSymlinkComponents(root, manifestPath, "natural runtime-tree manifest");
  const document = await readJson(manifestPath, "natural runtime-tree manifest");
  if (document.sha256 !== descriptor.sha256) throw new Error("natural runtime-tree manifest SHA-256 differs from the signed attestation");
  const manifest = document.value;
  if (
    manifest?.schemaVersion !== 1 || manifest?.artifactType !== "unsigned-hash-bound-original-host-runtime-tree" ||
    manifest?.templateStatus !== "unsigned-template-only-not-evidence" || manifest?.notEvidence !== true ||
    manifest?.animationId !== bound.spec.animationId || manifest?.requirementId !== bound.spec.requirementId ||
    !same(manifest.sourceManifest, bound.originalHostEvidence.minimalTree) ||
    manifest.sourceArchiveRoot !== "source-assets/flash/HELP MATH_ORIGINAL FILES" || manifest.stagedRoot !== "runtime-tree"
  ) throw new Error("natural runtime-tree manifest identity/source binding is invalid");
  const minimalTree = (await readJson(path.join(root, bound.originalHostEvidence.minimalTree.file), "original-host minimal-tree manifest")).value;
  if (
    !Array.isArray(manifest.files) || manifest.files.length !== minimalTree.requiredFileCount ||
    manifest.fileCount !== minimalTree.requiredFileCount || manifest.totalBytes !== minimalTree.requiredTotalBytes ||
    manifest.isolation?.sourceAssetsLaunchedDirectly !== false || manifest.isolation?.onlyManifestedCourseContentPresent !== true ||
    manifest.isolation?.relativeLayoutPreservedFromArchiveRoot !== true || manifest.isolation?.sourceFilesCopiedByteForByte !== true ||
    manifest.isolation?.sourceFilesModified !== false
  ) throw new Error("natural runtime-tree manifest does not declare an exact isolated byte-preserved tree");
  const runtimeRoot = path.join(path.dirname(manifestPath), "runtime-tree");
  const actualRuntimeRoot = await realpath(runtimeRoot).catch(() => {
    throw new Error("natural runtime tree is missing");
  });
  const expectedFiles = [];
  for (const [index, item] of minimalTree.requiredFiles.entries()) {
    const archiveRelativePath = portable(path.relative(path.join(root, manifest.sourceArchiveRoot), path.join(root, item.path)));
    const expected = {
      sourcePath: item.path,
      archiveRelativePath,
      stagedFile: `runtime-tree/${archiveRelativePath}`,
      sha256: item.sha256,
      bytes: item.bytes,
      role: item.role,
    };
    if (!same(manifest.files[index], expected)) throw new Error(`natural runtime-tree manifest file ${index + 1} differs from the audited minimal tree`);
    const stagedPath = await resolveInputPath({root, workspace: bound.workspace, declared: path.join(path.dirname(descriptor.file), expected.stagedFile), label: `natural staged runtime file ${index + 1}`, bases: [root]});
    await assertNoExistingSymlinkComponents(root, stagedPath, `natural staged runtime file ${index + 1}`);
    if (!isLexicallyInside(await realpath(stagedPath), actualRuntimeRoot)) throw new Error(`natural staged runtime file ${index + 1} escapes the runtime tree`);
    const bytes = await readFile(stagedPath);
    if (bytes.length !== expected.bytes || digest(bytes) !== expected.sha256) throw new Error(`natural staged runtime file ${index + 1} bytes/SHA-256 are stale`);
    expectedFiles.push(archiveRelativePath);
  }
  if (!same(await listRuntimeTreeFiles(runtimeRoot), expectedFiles.sort())) {
    throw new Error("natural staged runtime tree contains missing or unmanifested files");
  }
  const expectedHost = manifest.files.find((item) => item.sourcePath === bound.originalHostSwf.path);
  if (!expectedHost || !same(manifest.launchHost, {
    sourcePath: expectedHost.sourcePath,
    stagedFile: expectedHost.stagedFile,
    sha256: expectedHost.sha256,
    bytes: expectedHost.bytes,
  })) throw new Error("natural runtime-tree launch host differs from the preserved original host");
  return {...document, manifest, path: manifestPath};
}

async function verifyCaptureKit({root, bound, descriptor, runtimeTreeManifestDocument, receiptDocument}) {
  assertExactKeys(descriptor, ["kitManifest", "launcher", "sandboxProfile", "runtimeTreeManifest", "nodeExecutable"], "natural capture-session captureKit");
  const kitRootRelative = portable(path.join("work", "natural-trace-capture-kits", bound.spec.animationId, safeRequirementId(bound.spec.requirementId)));
  const expectedFiles = {
    kitManifest: `${kitRootRelative}/kit-manifest.json`,
    launcher: `${kitRootRelative}/launch-original-host-sandboxed.sh`,
    sandboxProfile: `${kitRootRelative}/sandbox.sb`,
  };
  const documents = {};
  for (const key of ["kitManifest", "launcher", "sandboxProfile"]) {
    assertExactKeys(descriptor[key], ["file", "sha256"], `natural capture-session captureKit.${key}`);
    if (descriptor[key].file !== expectedFiles[key]) throw new Error(`natural capture-session captureKit.${key} is not at the fixed checked-kit path`);
    const candidate = await resolveInputPath({root, workspace: bound.workspace, declared: descriptor[key].file, label: `natural capture kit ${key}`, bases: [root]});
    await assertNoExistingSymlinkComponents(root, candidate, `natural capture kit ${key}`);
    const bytes = await readFile(candidate);
    if (digest(bytes) !== descriptor[key].sha256) throw new Error(`natural capture kit ${key} SHA-256 differs from the signed attestation`);
    documents[key] = {path: candidate, bytes, sha256: descriptor[key].sha256};
  }
  assertExactKeys(descriptor.nodeExecutable, ["path", "sha256"], "natural capture-session captureKit.nodeExecutable");
  assertSha256(descriptor.nodeExecutable.sha256, "natural capture-session captureKit.nodeExecutable.sha256");
  if (descriptor.nodeExecutable.path !== process.execPath || digest(await readFile(process.execPath)) !== descriptor.nodeExecutable.sha256) {
    throw new Error("natural capture kit Node executable differs from the local hash-bound launcher runtime");
  }
  if (!same(descriptor.runtimeTreeManifest, {
    file: portable(path.relative(root, runtimeTreeManifestDocument.path)),
    sha256: runtimeTreeManifestDocument.sha256,
  })) throw new Error("natural capture kit runtime-tree binding differs from the signed runtime-tree manifest");
  let manifest;
  try {
    manifest = JSON.parse(documents.kitManifest.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`natural capture kit manifest is invalid JSON: ${error.message}`);
  }
  if (
    manifest?.schemaVersion !== 1 || manifest?.artifactType !== "rw-natural-trace-capture-operator-kit" ||
    manifest?.status !== "unsigned-template-only-not-evidence" || manifest?.strictAcceptanceEffect !== false ||
    manifest?.animationId !== bound.spec.animationId || manifest?.requirementId !== bound.spec.requirementId ||
    !same(manifest.bindings?.originalHostEvidence, bound.originalHostEvidence) ||
    !same(manifest.originalHostLaunch?.stagedRuntimeTreeManifest, descriptor.runtimeTreeManifest) ||
    manifest.originalHostLaunch?.sourceTreeLaunchedDirectly !== false || manifest.originalHostLaunch?.launchesChildAlone !== false ||
    manifest.originalHostLaunch?.authority !== "safety-probe-only-not-authoritative-clean-profile" ||
    manifest.originalHostLaunch?.authoritativeCapturePermittedByThisLauncher !== false ||
    manifest.originalHostLaunch?.launchProtocol !== NATURAL_PROJECTOR_LAUNCH_PROTOCOL ||
    manifest.originalHostLaunch?.launcherStartsEmptyProjector !== true ||
    manifest.originalHostLaunch?.commandLineSwfArgumentProvided !== false ||
    manifest.originalHostLaunch?.commandLineHostOpenClaimed !== false ||
    manifest.originalHostLaunch?.hostOpen?.method !== NATURAL_HOST_OPEN_METHOD ||
    !same(manifest.originalHostLaunch?.hostOpen?.menuPath, NATURAL_HOST_OPEN_MENU_PATH) ||
    !same(manifest.originalHostLaunch?.hostOpen?.selectedHost, manifest.originalHostLaunch?.stagedHost) ||
    manifest.originalHostLaunch?.hostOpen?.requiresNamedHumanObservation !== true ||
    !same(manifest.runtime?.launcherNodeExecutable, descriptor.nodeExecutable) ||
    !same({runtimeId: manifest.runtime?.runtimeId, name: manifest.runtime?.name, version: manifest.runtime?.version}, receiptDocument.receipt.runtime)
  ) throw new Error("natural capture kit manifest identity, runtime, or non-authority boundary is invalid");
  const launcher = documents.launcher.bytes.toString("utf8");
  for (const required of [
    descriptor.nodeExecutable.path,
    scriptPath,
    "--check",
    bound.specRelative,
    manifest.runtime.appPath,
    manifest.originalHostLaunch.stagedHost.file,
    "/usr/bin/sandbox-exec",
    "PROCESS LAUNCH ONLY — NOT HOST-OPEN EVIDENCE.",
    "PROJECTOR_START_MODE=empty-no-swf-argument",
    "HOST_OPEN_MODE=named-human-gui-file-open",
  ]) {
    if (!launcher.includes(required)) throw new Error("natural capture kit launcher omits a required hash-bound launch component");
  }
  if (launcher.includes("source-assets/")) throw new Error("natural capture kit launcher must not launch directly from source-assets");
  const projectorExecLine = launcher.split(/\r?\n/).find((line) => line.startsWith("exec /usr/bin/sandbox-exec "));
  if (
    !projectorExecLine || !projectorExecLine.includes(manifest.runtime.executablePath) ||
    projectorExecLine.includes(manifest.originalHostLaunch.stagedHost.file) ||
    !projectorExecLine.trim().endsWith(`'${manifest.runtime.executablePath.replaceAll("'", `'\"'\"'`)}'`)
  ) throw new Error("natural capture kit launcher must start an empty Projector without a SWF argument");
  const sandbox = documents.sandboxProfile.bytes.toString("utf8");
  for (const required of ["(deny network*)", "(deny appleevent-send)", "Library/Preferences/Macromedia/Flash Player", "(deny file-write*"]) {
    if (!sandbox.includes(required)) throw new Error("natural capture kit sandbox omits a required safety-probe restriction");
  }
  return {descriptor, manifest, documents};
}

async function readBoundDescriptor({root, workspace, descriptor, label}) {
  assertExactKeys(descriptor, ["file", "sha256"], label);
  assertSha256(descriptor.sha256, `${label}.sha256`);
  const candidate = await resolveInputPath({root, workspace, declared: descriptor.file, label: `${label}.file`, bases: [root]});
  await assertNoExistingSymlinkComponents(root, candidate, `${label}.file`);
  const bytes = await readFile(candidate);
  if (digest(bytes) !== descriptor.sha256) throw new Error(`${label} SHA-256 mismatch`);
  return {path: candidate, bytes, sha256: descriptor.sha256};
}

async function verifyEnvironmentIsolationReceipt({root, bound, descriptor, expectedPath, attestation, startedAtMs, endedAtMs}) {
  if (descriptor?.file !== portable(path.relative(root, expectedPath))) {
    throw new Error("natural environment-isolation receipt path differs from the supplied evidence path");
  }
  const document = await readBoundDescriptor({root, workspace: bound.workspace, descriptor, label: "natural environment-isolation receipt"});
  let receipt;
  try {
    receipt = JSON.parse(document.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`natural environment-isolation receipt is invalid JSON: ${error.message}`);
  }
  assertExactKeys(receipt, [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "isolationMode",
    "operatingSystem", "account", "profile", "preflight", "runtimeObservations", "postflight",
    "operator", "startedAt", "endedAt", "signedAt", "statement", "receiptSha256",
  ], "natural environment-isolation receipt");
  if (
    receipt.schemaVersion !== 1 || receipt.evidenceType !== "named-human-disposable-flash-runtime-environment-receipt" ||
    receipt.sessionId !== attestation.sessionId || receipt.animationId !== bound.spec.animationId || receipt.requirementId !== bound.spec.requirementId ||
    !new Set(["restored-disposable-macos-vm-snapshot", "dedicated-one-time-macos-login-account"]).has(receipt.isolationMode) ||
    receipt.statement !== NATURAL_ENVIRONMENT_ISOLATION_STATEMENT ||
    receipt.receiptSha256 !== naturalEnvironmentIsolationReceiptSha256(receipt)
  ) throw new Error("natural environment-isolation receipt identity/type/signature is invalid");
  validateNamedHuman(receipt.operator);
  if (!same(receipt.operator, attestation.operator)) throw new Error("natural environment-isolation operator differs from the capture-session operator");
  assertExactKeys(receipt.operatingSystem, ["productVersion", "buildVersion", "architecture"], "natural environment operatingSystem");
  for (const field of ["productVersion", "buildVersion", "architecture"]) assertString(receipt.operatingSystem[field], `natural environment operatingSystem.${field}`);
  assertExactKeys(receipt.account, ["userName", "uid", "homeDirectory", "realOsAccount", "dedicatedToCapture"], "natural environment account");
  assertString(receipt.account.userName, "natural environment account.userName");
  if (!Number.isInteger(receipt.account.uid) || receipt.account.uid < 0 || !path.isAbsolute(receipt.account.homeDirectory) || receipt.account.realOsAccount !== true || receipt.account.dedicatedToCapture !== true) {
    throw new Error("natural environment account must be a real dedicated OS account with an absolute independent home");
  }
  assertExactKeys(receipt.profile, ["identifier", "createdForSession", "reused", "normalSharedObjectReadWriteSemantics", "resetOrDestroyedAfterSession"], "natural environment profile");
  assertString(receipt.profile.identifier, "natural environment profile.identifier");
  if (
    receipt.profile.createdForSession !== true || receipt.profile.reused !== false ||
    receipt.profile.normalSharedObjectReadWriteSemantics !== true || receipt.profile.resetOrDestroyedAfterSession !== true
  ) throw new Error("natural environment profile is not disposable, unreused, and normal-semantics");
  assertExactKeys(receipt.preflight, [
    "runningFlashProcessCount", "sharedObjectFileCount", "cookienameFileCount", "incomingCookieKeyCount",
    "bookmarkState", "dtfBMID", "inventory",
  ], "natural environment preflight");
  if (
    receipt.preflight.runningFlashProcessCount !== 0 || receipt.preflight.sharedObjectFileCount !== 0 ||
    receipt.preflight.cookienameFileCount !== 0 || receipt.preflight.incomingCookieKeyCount !== 0 ||
    receipt.preflight.bookmarkState !== "absent-or-false" || receipt.preflight.dtfBMID !== ""
  ) throw new Error("natural environment preflight does not prove an empty, inactive Flash profile");
  const preflightInventory = await readBoundDescriptor({root, workspace: bound.workspace, descriptor: receipt.preflight.inventory, label: "natural environment preflight inventory"});
  assertExactKeys(receipt.runtimeObservations, [
    "sharedObjectGetLocalReturnedObject", "bookmarkBranchTaken", "defaultStartupIrObserved", "targetRwNavigationObserved",
    "automaticEnglishKeytermRequested", "automaticEnglishKeytermLoadSucceeded", "automaticEnglishKeytermParseSucceeded",
  ], "natural environment runtimeObservations");
  if (
    receipt.runtimeObservations.sharedObjectGetLocalReturnedObject !== true || receipt.runtimeObservations.bookmarkBranchTaken !== false ||
    receipt.runtimeObservations.defaultStartupIrObserved !== true || receipt.runtimeObservations.targetRwNavigationObserved !== true ||
    receipt.runtimeObservations.automaticEnglishKeytermRequested !== true ||
    receipt.runtimeObservations.automaticEnglishKeytermLoadSucceeded !== true ||
    receipt.runtimeObservations.automaticEnglishKeytermParseSucceeded !== true
  ) throw new Error("natural environment runtime observations do not prove normal clean-start host traversal");
  assertExactKeys(receipt.postflight, ["unexpectedProfileFileCount", "unexpectedMutations", "profileResetOrDestroyed", "inventory"], "natural environment postflight");
  if (
    receipt.postflight.unexpectedProfileFileCount !== 0 || !Array.isArray(receipt.postflight.unexpectedMutations) ||
    receipt.postflight.unexpectedMutations.length || receipt.postflight.profileResetOrDestroyed !== true
  ) throw new Error("natural environment postflight contains unexpected mutations or was not destroyed/reset");
  const postflightInventory = await readBoundDescriptor({root, workspace: bound.workspace, descriptor: receipt.postflight.inventory, label: "natural environment postflight inventory"});
  const receiptStartedAt = parseSessionTime(receipt.startedAt, "natural environment startedAt");
  const receiptEndedAt = parseSessionTime(receipt.endedAt, "natural environment endedAt");
  const receiptSignedAt = parseSessionTime(receipt.signedAt, "natural environment signedAt");
  if (receiptStartedAt > startedAtMs || receiptEndedAt < endedAtMs || receiptSignedAt < receiptEndedAt || receiptSignedAt - receiptEndedAt > 30 * 60 * 1000) {
    throw new Error("natural environment receipt does not enclose and promptly sign the capture session");
  }
  return {...document, receipt, preflightInventory, postflightInventory};
}

async function verifyLaunchReceipt({root, bound, descriptor, expectedPath, attestation, captureKitDocument, environmentDocument, receiptDocument, startedAtMs, endedAtMs}) {
  if (descriptor?.file !== portable(path.relative(root, expectedPath))) {
    throw new Error("natural launch receipt path differs from the supplied evidence path");
  }
  const document = await readBoundDescriptor({root, workspace: bound.workspace, descriptor, label: "natural launch receipt"});
  let receipt;
  try {
    receipt = JSON.parse(document.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`natural launch receipt is invalid JSON: ${error.message}`);
  }
  assertExactKeys(receipt, [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "proofMode",
    "captureKit", "environmentIsolation", "runtime", "workingDirectory", "kitCheck", "launchProtocol",
    "projectorStart", "hostOpen", "endedAt", "operator", "statement", "receiptSha256",
  ], "natural launch receipt");
  if (
    receipt.schemaVersion !== 2 || receipt.evidenceType !== "named-human-hash-bound-original-host-launch-receipt" ||
    receipt.sessionId !== attestation.sessionId || receipt.animationId !== bound.spec.animationId || receipt.requirementId !== bound.spec.requirementId ||
    receipt.proofMode !== PROOF_MODE || receipt.statement !== NATURAL_LAUNCH_RECEIPT_STATEMENT ||
    receipt.receiptSha256 !== naturalLaunchReceiptSha256(receipt) || !same(receipt.captureKit, captureKitDocument.descriptor) ||
    !same(receipt.environmentIsolation, {file: portable(path.relative(root, environmentDocument.path)), sha256: environmentDocument.sha256}) ||
    !same(receipt.runtime, receiptDocument.receipt.runtime)
  ) throw new Error("natural launch receipt identity/runtime/signature binding is invalid");
  validateNamedHuman(receipt.operator);
  if (!same(receipt.operator, attestation.operator)) throw new Error("natural launch receipt operator differs from the capture-session operator");
  const kitRootRelative = portable(path.join("work", "natural-trace-capture-kits", bound.spec.animationId, safeRequirementId(bound.spec.requirementId)));
  assertExactKeys(receipt.projectorStart, ["executablePath", "swfArgument", "processId", "startedAt"], "natural launch receipt projectorStart");
  assertExactKeys(receipt.hostOpen, ["method", "menuPath", "selectedHost", "openedAt", "playerWindowObserved"], "natural launch receipt hostOpen");
  if (
    receipt.workingDirectory !== `${kitRootRelative}/runtime-tree` ||
    receipt.launchProtocol !== NATURAL_PROJECTOR_LAUNCH_PROTOCOL ||
    receipt.projectorStart.executablePath !== captureKitDocument.manifest.runtime.executablePath ||
    receipt.projectorStart.swfArgument !== null ||
    !Number.isInteger(receipt.projectorStart.processId) || receipt.projectorStart.processId <= 0 ||
    receipt.hostOpen.method !== NATURAL_HOST_OPEN_METHOD ||
    !same(receipt.hostOpen.menuPath, NATURAL_HOST_OPEN_MENU_PATH) ||
    !same(receipt.hostOpen.selectedHost, captureKitDocument.manifest.originalHostLaunch.stagedHost) ||
    receipt.hostOpen.playerWindowObserved !== true
  ) throw new Error("natural launch receipt two-stage Projector start/GUI host-open identity is invalid");
  const kitCheck = await readBoundDescriptor({root, workspace: bound.workspace, descriptor: receipt.kitCheck, label: "natural launch kit-check receipt"});
  let kitCheckValue;
  try {
    kitCheckValue = JSON.parse(kitCheck.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`natural launch kit-check receipt is invalid JSON: ${error.message}`);
  }
  if (
    kitCheckValue.status !== "verified-unsigned-template-only" || kitCheckValue.animationId !== bound.spec.animationId ||
    kitCheckValue.requirementId !== bound.spec.requirementId || kitCheckValue.traceSpecSha256 !== bound.specDocument.sha256 ||
    kitCheckValue.sourceSwfSha256 !== bound.spec.sourceBindings.sourceSwf.sha256 ||
    kitCheckValue.originalHostSwfSha256 !== bound.originalHostSwf.sha256 ||
    kitCheckValue.runtimeExecutableSha256 !== APPROVED_RUNTIME.executableSha256 ||
    kitCheckValue.captureKitManifestSha256 !== captureKitDocument.descriptor.kitManifest.sha256 ||
    kitCheckValue.launcherSha256 !== captureKitDocument.descriptor.launcher.sha256 ||
    kitCheckValue.sandboxProfileSha256 !== captureKitDocument.descriptor.sandboxProfile.sha256 ||
    kitCheckValue.runtimeTreeManifestSha256 !== captureKitDocument.descriptor.runtimeTreeManifest.sha256 ||
    kitCheckValue.nodeExecutableSha256 !== captureKitDocument.descriptor.nodeExecutable.sha256 ||
    kitCheckValue.strictAcceptanceEffect !== false || kitCheckValue.migrationStatusChanged !== false
  ) throw new Error("natural launch kit-check receipt does not prove the exact current kit");
  const launchedAt = parseSessionTime(receipt.projectorStart.startedAt, "natural launch receipt projectorStart.startedAt");
  const openedAt = parseSessionTime(receipt.hostOpen.openedAt, "natural launch receipt hostOpen.openedAt");
  const receiptEndedAt = parseSessionTime(receipt.endedAt, "natural launch receipt endedAt");
  if (openedAt < launchedAt || openedAt > startedAtMs || receiptEndedAt < endedAtMs) {
    throw new Error("natural launch receipt does not prove empty Projector start followed by GUI host open before the capture session");
  }
  return {...document, receipt, kitCheck};
}

async function verifyHostEntryLog({root, bound, descriptor, logPath, attestationDocument, environmentDocument, launchDocument}) {
  const attestation = attestationDocument.attestation;
  assertDescriptor(descriptor, {
    label: "natural capture-session hostEntryLog",
    file: portable(path.relative(root, logPath)),
    sha256: null,
    chainField: "finalRecordSha256",
    countField: "recordCount",
  });
  const log = await readJsonLines(logPath, "natural host-entry log");
  const minimalTree = (await readJson(path.join(root, bound.originalHostEvidence.minimalTree.file), "original-host minimal-tree manifest")).value;
  const byRole = new Map(minimalTree.requiredFiles.map((item) => [item.role, item]));
  const ir = byRole.get("source-script-proven-default-startup-child");
  const rw = byRole.get("target-animation-child");
  const xml = byRole.get("automatic-english-keyterm-xml-read-at-host-root-frame-50");
  const expected = [
    ["clean-profile-observed", {
      sharedObjectGetLocalReturnedObject: true,
      incomingCookieKeyCount: 0,
      bookmarkState: "absent-or-false",
      dtfBMID: "",
    }],
    ["host-root-frame-observed", {hostRootFrame: 50, hostPlayState: "stopped"}],
    ["automatic-keyterm-xml-result", {
      resolvedPath: xml.path,
      sha256: xml.sha256,
      loadSucceeded: true,
      parseSucceeded: true,
    }],
    ["default-ir-child-load", {resolvedPath: ir.path, sha256: ir.sha256, loadSucceeded: true}],
    ["next-navigation-action", {
      control: "original-host-next",
      event: "release",
      sectionBefore: 1,
      slideBefore: 2,
      sectionAfter: 2,
      slideAfter: 1,
    }],
    ["target-rw-child-load", {resolvedPath: rw.path, sha256: rw.sha256, loadSucceeded: true}],
    ["nested-entry-observed", {
      childRootFrame: bound.spec.frameDomain.parentEntryFrame,
      childRootPlayState: "stopped",
      frameDomainId: bound.spec.frameDomain.id,
      localFrame: bound.spec.frameDomain.localEntryFrame,
    }],
    ["side-effect-summary", {
      unexpectedLocalLoads: [],
      networkAttempts: [],
      appleEvents: [],
      persistentWritesOutsideDisposableProfile: [],
      sandboxDenials: [],
    }],
  ];
  if (log.records.length !== expected.length) throw new Error(`natural host-entry log must contain exactly ${expected.length} source-bound records`);
  const commonKeys = [
    "schemaVersion", "evidenceType", "eventKind", "sessionId", "animationId", "requirementId", "proofMode",
    "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256",
    "environmentIsolationReceiptSha256", "launchReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs",
    "operator", "details", "previousRecordSha256", "recordSha256",
  ];
  let previousHash = null;
  let previousMonotonic = -1;
  let previousWall = -Infinity;
  for (const [index, item] of log.records.entries()) {
    const record = item.record;
    assertExactKeys(record, commonKeys, `natural host-entry record ${index + 1}`);
    if (
      record.schemaVersion !== 1 || record.evidenceType !== "attested-original-host-entry-observation" ||
      record.eventKind !== expected[index][0] || record.sequence !== index + 1 ||
      record.sessionId !== attestation.sessionId || record.animationId !== bound.spec.animationId ||
      record.requirementId !== bound.spec.requirementId || record.proofMode !== PROOF_MODE ||
      record.traceSpecSha256 !== bound.specDocument.sha256 || record.sourceSwfSha256 !== bound.spec.sourceBindings.sourceSwf.sha256 ||
      record.originalHostSwfSha256 !== bound.originalHostSwf.sha256 ||
      record.captureKitManifestSha256 !== attestation.captureKit.kitManifest.sha256 ||
      record.environmentIsolationReceiptSha256 !== environmentDocument.sha256 || record.launchReceiptSha256 !== launchDocument.sha256 ||
      !same(record.operator, attestation.operator) || !same(record.details, expected[index][1]) ||
      record.previousRecordSha256 !== previousHash || record.recordSha256 !== naturalHostEntryRecordSha256(record)
    ) throw new Error(`natural host-entry record ${index + 1} differs from the exact source-bound entry protocol`);
    validateBoundTime(record, {
      label: `natural host-entry record ${index + 1}`,
      priorMonotonic: previousMonotonic,
      priorWall: previousWall,
      attestationDocument,
    });
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = Date.parse(record.occurredAt);
  }
  if (
    descriptor.sha256 !== log.sha256 || descriptor.recordCount !== log.records.length ||
    descriptor.finalRecordSha256 !== previousHash
  ) throw new Error("natural host-entry log bytes/count/final chain differ from the capture-session attestation");
  return {...log, records: log.records.map((item) => item.record), finalRecordSha256: previousHash};
}

async function loadBoundNaturalTrace({root, specPath}) {
  const specDocument = await readJson(specPath, "natural trace specification");
  const spec = specDocument.value;
  if (
    spec.schemaVersion !== 1 || spec.artifactType !== "course-pilot-original-runtime-trace-specification" ||
    spec.traceSpecStatus !== "source-schedule-ready-for-authoritative-execution" ||
    spec.traceModel?.kind !== "stateful-natural-trace" || spec.traceModel?.naturalPlaybackClaimed !== true ||
    spec.frameDomain?.kind !== "nested" || spec.identity?.frameDomainId !== spec.frameDomain?.id ||
    spec.identity?.baselineAuthorityRequirement !== "original-runtime-natural-trace"
  ) throw new Error("only a ready indexed stateful natural trace specification can be prepared as a candidate");
  if (spec.frameDomain.nativeStage?.width !== 800 || spec.frameDomain.nativeStage?.height !== 600 || spec.frameDomain.fps !== 12) {
    throw new Error("natural capture candidate requires the declared HELP Math 800x600 stage at 12 FPS");
  }
  const scheduleModel = validateSchedule(spec);
  const expectedSpecBasename = `${safeRequirementId(spec.requirementId)}.json`;
  const expectedRelative = portable(path.join("migrations", spec.animationId, "audit", "trace-specs", expectedSpecBasename));
  const specRelative = portable(path.relative(root, specPath));
  if (specRelative !== expectedRelative) throw new Error(`trace specification path must be ${expectedRelative}`);
  const workspace = path.join(root, "migrations", spec.animationId);
  const [manifestDocument, coverageDocument, inventoryDocument] = await Promise.all([
    readJson(path.join(workspace, "migration.json"), "migration manifest"),
    readJson(path.join(workspace, "evidence", "full-frame-coverage.json"), "full-frame coverage"),
    readJson(path.join(workspace, "audit", "scenario-inventory.json"), "scenario inventory"),
  ]);
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  if (manifest.animationId !== spec.animationId || coverage.animationId !== spec.animationId || inventory.animationId !== spec.animationId) {
    throw new Error("natural trace specification and current migration documents have different animation identities");
  }
  if (
    manifest.runtime?.stage?.width !== 800 || manifest.runtime?.stage?.height !== 600 || manifest.runtime?.fps !== 12 ||
    manifest.source?.swf !== spec.sourceBindings?.sourceSwf?.path || manifest.source?.swfSha256 !== spec.sourceBindings?.sourceSwf?.sha256
  ) throw new Error("natural trace source/runtime binding differs from migration.json");
  const coverageHash = traceCoverageSha256(coverage);
  requireProjection(spec.sourceBindings?.migrationManifest, {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
    excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
  }, "natural trace migration manifest");
  requireProjection(spec.sourceBindings?.fullFrameCoverage, {
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: coverageHash,
    includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
  }, "natural trace coverage");
  requireProjection(spec.sourceBindings?.scenarioInventory, {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    sha256: scenarioInventorySha256(inventory),
    excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
  }, "natural trace scenario inventory");
  const requirements = (coverage.requirements || []).filter((item) => item.requirementId === spec.requirementId);
  if (requirements.length === 1) {
    assertStrictFullDomainRequirement(
      requirements[0],
      spec.frameDomain.frameCount,
      `${spec.animationId}/${spec.requirementId} natural original-runtime candidate`,
    );
  }
  if (requirements.length !== 1 || !same(requirementIdentity(requirements[0]), specIdentity(spec))) {
    throw new Error("natural trace identity differs from the unique current coverage requirement");
  }
  const indexPath = path.join(root, "migrations", "course-shell-pilot-trace-spec-index.json");
  const index = (await readJson(indexPath, "course/shell trace-spec index")).value;
  const indexedPilot = (index.pilots || []).find((item) => item.animationId === spec.animationId);
  const indexedSpecs = (indexedPilot?.traceSpecs || []).filter((item) => item.requirementId === spec.requirementId);
  if (
    indexedSpecs.length !== 1 || indexedSpecs[0].file !== specRelative || indexedSpecs[0].sha256 !== specDocument.sha256 ||
    indexedSpecs[0].status !== spec.traceSpecStatus || indexedSpecs[0].traceModel !== "stateful-natural-trace"
  ) throw new Error("natural trace specification is not the exact current indexed specification");
  const expectedExecution = portable(path.relative(root, path.join(workspace, spec.executionEvidence?.expectedExecutionReportPath || "")));
  if (indexedSpecs[0].expectedExecutionReport !== expectedExecution) throw new Error("indexed execution-report path differs from the natural trace specification");
  const sourcePath = await resolveInputPath({root, workspace, declared: manifest.source.swf, label: "bound source SWF", bases: [root]});
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  if (!isLexicallyInside(sourcePath, preservedRoot) || digest(await readFile(sourcePath)) !== manifest.source.swfSha256) {
    throw new Error("bound source SWF is outside the preserved archive or its SHA-256 is stale");
  }
  const lessonDirectory = path.dirname(path.dirname(sourcePath));
  const originalHostPath = await resolveInputPath({
    root,
    workspace,
    declared: path.join(lessonDirectory, "index_local.swf"),
    label: "original lesson host SWF",
    bases: [root],
  });
  if (!isLexicallyInside(originalHostPath, preservedRoot)) throw new Error("original lesson host SWF is outside the preserved archive");
  const originalHostSwf = {
    path: portable(path.relative(root, originalHostPath)),
    sha256: digest(await readFile(originalHostPath)),
  };
  const originalHostEvidence = await loadOriginalHostEvidence({root, workspace, spec, originalHostSwf});
  await verifyScheduleDerivation(root, workspace, spec);
  return {
    spec,
    specDocument,
    specRelative,
    workspace,
    manifest,
    coverage,
    coverageHash,
    requirement: requirements[0],
    sourcePath,
    originalHostPath,
    originalHostSwf,
    originalHostEvidence,
    expectedExecution,
    ...scheduleModel,
  };
}

async function verifyApprovedReceipt({root, workspace, receiptPath}) {
  const document = await verifyReceipt({
    root,
    workspace,
    receiptPath,
    captureSessionBindingFields: [
      "sessionId", "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256",
      "captureKitManifestSha256", "sandboxProfileSha256", "environmentIsolationReceiptSha256", "launchReceiptSha256",
    ],
  });
  if (!same(document.receipt.runtime, {
    runtimeId: APPROVED_RUNTIME.runtimeId,
    name: APPROVED_RUNTIME.name,
    version: APPROVED_RUNTIME.version,
  })) throw new Error("natural trace candidates require the approved Adobe Flash Player Projector 32.0.0.414 runtime");
  const executableReceipts = document.receipt.identityArtifacts.filter((item) => item.kind === "executable-sha256-receipt");
  if (!executableReceipts.length) throw new Error("toolchain receipt must include an executable-sha256-receipt identity artifact");
  let approvedHashObserved = false;
  for (const [index, artifact] of executableReceipts.entries()) {
    const artifactPath = await resolveInputPath({root, workspace, declared: artifact.file, label: `executable receipt ${index + 1}`, bases: [workspace, root]});
    const text = (await readFile(artifactPath)).toString("utf8");
    const match = text.match(/(?:^|\n)executable_sha256=([a-f0-9]{64})(?:\n|$)/);
    if (!match) throw new Error(`executable receipt ${index + 1} does not declare executable_sha256`);
    if (match[1] !== APPROVED_RUNTIME.executableSha256) throw new Error(`executable receipt ${index + 1} is not bound to the approved Flash Player executable SHA-256`);
    approvedHashObserved = true;
  }
  if (!approvedHashObserved) throw new Error("approved Flash Player executable SHA-256 was not observed");
  return document;
}

function assertDescriptor(value, {label, file, sha256, chainField, countField}) {
  assertExactKeys(value, ["file", "sha256", chainField, countField], label);
  if (value.file !== file) throw new Error(`${label}.file differs from the supplied evidence path`);
  assertSha256(value.sha256, `${label}.sha256`);
  assertSha256(value[chainField], `${label}.${chainField}`);
  if (!Number.isInteger(value[countField]) || value[countField] < 1) throw new Error(`${label}.${countField} must be a positive integer`);
}

async function verifyNaturalCaptureSessionAttestation({
  root,
  bound,
  attestationPath,
  operationLogPath,
  stateSnapshotsPath,
  targetResolutionsPath,
  hostEntryLogPath,
  environmentIsolationReceiptPath,
  launchReceiptPath,
  framesDirectory,
  receiptPath,
  receiptDocument,
}) {
  const document = await readJson(attestationPath, "natural capture-session attestation");
  const attestation = document.value;
  assertExactKeys(attestation, [
    "schemaVersion",
    "evidenceType",
    "sessionId",
    "animationId",
    "requirementId",
    "proofMode",
    "traceSpec",
    "sourceSwf",
    "originalHostSwf",
    "originalHostEvidence",
    "runtimeTreeManifest",
    "captureKit",
    "environmentIsolation",
    "launchReceipt",
    "hostEntryLog",
    "toolchainReceipt",
    "operationLog",
    "sourceTargetResolutions",
    "stateSnapshots",
    "frameSet",
    "scheduleBinding",
    "startedAt",
    "endedAt",
    "signedAt",
    "monotonicTimeOrigin",
    "operator",
    "unexpectedEvents",
    "statement",
    "notes",
    "attestationSha256",
  ], "natural capture-session attestation");
  if (
    attestation.schemaVersion !== 1 ||
    attestation.evidenceType !== "named-human-natural-trace-capture-session-attestation" ||
    attestation.proofMode !== PROOF_MODE
  ) throw new Error("natural capture-session attestation schema/type/proofMode is invalid");
  if (!UUID_PATTERN.test(attestation.sessionId || "")) throw new Error("natural capture-session attestation sessionId must be a UUID");
  if (attestation.animationId !== bound.spec.animationId || attestation.requirementId !== bound.spec.requirementId) {
    throw new Error("natural capture-session attestation animation/requirement identity mismatch");
  }
  if (attestation.attestationSha256 !== naturalCaptureSessionAttestationSha256(attestation)) {
    throw new Error("natural capture-session attestation SHA-256 does not match its canonical content");
  }
  if (attestation.statement !== NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT) {
    throw new Error("natural capture-session first-person statement is missing or changed");
  }
  if (attestation.notes !== NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE) {
    throw new Error("natural capture-session authority limitation note is missing or changed");
  }
  if (attestation.monotonicTimeOrigin !== "milliseconds-since-session-start") {
    throw new Error("natural capture-session monotonicTimeOrigin must be milliseconds-since-session-start");
  }
  if (!Array.isArray(attestation.unexpectedEvents) || attestation.unexpectedEvents.length) {
    throw new Error("natural capture-session unexpectedEvents must be an explicitly empty array");
  }
  validateNamedHuman(attestation.operator);
  const startedAtMs = parseSessionTime(attestation.startedAt, "natural capture-session startedAt");
  const endedAtMs = parseSessionTime(attestation.endedAt, "natural capture-session endedAt");
  const signedAtMs = parseSessionTime(attestation.signedAt, "natural capture-session signedAt");
  if (endedAtMs <= startedAtMs) throw new Error("natural capture-session endedAt must be later than startedAt");
  if (signedAtMs < endedAtMs || signedAtMs - endedAtMs > 30 * 60 * 1000) {
    throw new Error("natural capture-session signedAt must be at or within 30 minutes after endedAt");
  }
  const relative = (candidate) => portable(path.relative(root, candidate));
  assertExactKeys(attestation.traceSpec, ["file", "sha256"], "natural capture-session traceSpec");
  if (attestation.traceSpec.file !== bound.specRelative || attestation.traceSpec.sha256 !== bound.specDocument.sha256) {
    throw new Error("natural capture-session traceSpec differs from the exact current indexed trace spec");
  }
  assertExactKeys(attestation.sourceSwf, ["path", "sha256"], "natural capture-session sourceSwf");
  if (!same(attestation.sourceSwf, bound.spec.sourceBindings.sourceSwf)) {
    throw new Error("natural capture-session source SWF differs from the bound preserved source");
  }
  assertExactKeys(attestation.originalHostSwf, ["path", "sha256"], "natural capture-session originalHostSwf");
  if (!same(attestation.originalHostSwf, bound.originalHostSwf)) {
    throw new Error("natural capture-session original host SWF differs from the preserved lesson host");
  }
  assertExactKeys(attestation.originalHostEvidence, ["entryContract", "minimalTree", "sideEffectDenyList", "placementProof"], "natural capture-session originalHostEvidence");
  for (const key of ["entryContract", "minimalTree", "sideEffectDenyList", "placementProof"]) {
    assertExactKeys(attestation.originalHostEvidence[key], ["file", "sha256"], `natural capture-session originalHostEvidence.${key}`);
  }
  if (!same(attestation.originalHostEvidence, bound.originalHostEvidence)) {
    throw new Error("natural capture-session original-host evidence differs from the current hash-bound audit reports");
  }
  const runtimeTreeManifestDocument = await verifyRuntimeTreeManifest({root, bound, descriptor: attestation.runtimeTreeManifest});
  const captureKitDocument = await verifyCaptureKit({
    root,
    bound,
    descriptor: attestation.captureKit,
    runtimeTreeManifestDocument,
    receiptDocument,
  });
  const environmentDocument = await verifyEnvironmentIsolationReceipt({
    root,
    bound,
    descriptor: attestation.environmentIsolation,
    expectedPath: environmentIsolationReceiptPath,
    attestation,
    startedAtMs,
    endedAtMs,
  });
  const launchDocument = await verifyLaunchReceipt({
    root,
    bound,
    descriptor: attestation.launchReceipt,
    expectedPath: launchReceiptPath,
    attestation,
    captureKitDocument,
    environmentDocument,
    receiptDocument,
    startedAtMs,
    endedAtMs,
  });
  assertExactKeys(attestation.toolchainReceipt, ["file", "sha256", "runtime", "captureSessionBinding"], "natural capture-session toolchainReceipt");
  assertExactKeys(attestation.toolchainReceipt.runtime, ["runtimeId", "name", "version"], "natural capture-session toolchainReceipt.runtime");
  assertExactKeys(attestation.toolchainReceipt.captureSessionBinding, [
    "sessionId", "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256",
    "captureKitManifestSha256", "sandboxProfileSha256", "environmentIsolationReceiptSha256", "launchReceiptSha256",
  ], "natural capture-session toolchainReceipt.captureSessionBinding");
  if (
    attestation.toolchainReceipt.file !== relative(receiptPath) ||
    attestation.toolchainReceipt.sha256 !== receiptDocument.sha256 ||
    !same(attestation.toolchainReceipt.runtime, receiptDocument.receipt.runtime) ||
    !same(attestation.toolchainReceipt.captureSessionBinding, receiptDocument.receipt.captureSessionBinding) ||
    attestation.toolchainReceipt.captureSessionBinding.sessionId !== attestation.sessionId ||
    attestation.toolchainReceipt.captureSessionBinding.traceSpecSha256 !== bound.specDocument.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.sourceSwfSha256 !== bound.spec.sourceBindings.sourceSwf.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.originalHostSwfSha256 !== bound.originalHostSwf.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.captureKitManifestSha256 !== attestation.captureKit.kitManifest.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.sandboxProfileSha256 !== attestation.captureKit.sandboxProfile.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.environmentIsolationReceiptSha256 !== environmentDocument.sha256 ||
    attestation.toolchainReceipt.captureSessionBinding.launchReceiptSha256 !== launchDocument.sha256
  ) throw new Error("natural capture-session toolchain receipt path/hash/runtime/session binding mismatch");
  const receiptCapturedAtMs = parseSessionTime(receiptDocument.receipt.capturedAt, "natural toolchain receipt capturedAt");
  if (receiptCapturedAtMs < startedAtMs || receiptCapturedAtMs > endedAtMs) {
    throw new Error("natural toolchain receipt capturedAt must fall inside the attested session window");
  }
  assertDescriptor(attestation.operationLog, {
    label: "natural capture-session operationLog",
    file: relative(operationLogPath),
    sha256: null,
    chainField: "finalEventSha256",
    countField: "eventCount",
  });
  assertDescriptor(attestation.sourceTargetResolutions, {
    label: "natural capture-session sourceTargetResolutions",
    file: relative(targetResolutionsPath),
    sha256: null,
    chainField: "finalRecordSha256",
    countField: "recordCount",
  });
  assertDescriptor(attestation.stateSnapshots, {
    label: "natural capture-session stateSnapshots",
    file: relative(stateSnapshotsPath),
    sha256: null,
    chainField: "finalRecordSha256",
    countField: "recordCount",
  });
  const hostEntryLog = await verifyHostEntryLog({
    root,
    bound,
    descriptor: attestation.hostEntryLog,
    logPath: hostEntryLogPath,
    attestationDocument: {
      attestation,
      startedAtMs,
      endedAtMs,
      durationMs: endedAtMs - startedAtMs,
    },
    environmentDocument,
    launchDocument,
  });
  assertExactKeys(attestation.scheduleBinding, [
    "orderedStepsSha256",
    "stateCheckpointsSha256",
    "playbackSegmentsSha256",
    "terminalExpectedStateSha256",
  ], "natural capture-session scheduleBinding");
  if (!same(attestation.scheduleBinding, scheduleBinding(bound.spec))) {
    throw new Error("natural capture-session scheduleBinding differs from the current source-evidenced schedule");
  }
  assertExactKeys(attestation.frameSet, ["algorithm", "frameCount", "frames", "sha256"], "natural capture-session frameSet");
  if (attestation.frameSet.algorithm !== "ordered-frame-path-sha256-v1") throw new Error("natural capture-session frameSet algorithm is invalid");
  const expectedCount = bound.spec.frameDomain.frameCount;
  if (!Array.isArray(attestation.frameSet.frames) || attestation.frameSet.frames.length !== expectedCount || attestation.frameSet.frameCount !== expectedCount) {
    throw new Error("natural capture-session frameSet must contain every one-indexed local frame");
  }
  for (const [index, frame] of attestation.frameSet.frames.entries()) {
    assertExactKeys(frame, ["frame", "file", "sha256"], `natural capture-session frameSet.frames[${index}]`);
    if (frame.frame !== index + 1) throw new Error("natural capture-session frameSet must be one-indexed and ordered without gaps");
    assertSha256(frame.sha256, `natural capture-session frameSet.frames[${index}].sha256`);
    const framePath = await resolveInputPath({root, workspace: bound.workspace, declared: frame.file, label: `natural frameSet frame ${index + 1}`, bases: [root]});
    if (!isLexicallyInside(await realpath(framePath), await realpath(framesDirectory))) {
      throw new Error(`natural capture-session frameSet frame ${index + 1} escapes the supplied frames directory`);
    }
  }
  if (attestation.frameSet.sha256 !== orderedFrameSetSha256(attestation.frameSet.frames)) {
    throw new Error("natural capture-session frameSet SHA-256 mismatch");
  }
  return {
    ...document,
    attestation,
    startedAtMs,
    endedAtMs,
    signedAtMs,
    durationMs: endedAtMs - startedAtMs,
    runtimeTreeManifestDocument,
    captureKitDocument,
    environmentDocument,
    launchDocument,
    hostEntryLog,
  };
}

function validateBoundTime(record, {label, priorMonotonic, priorWall, attestationDocument}) {
  if (
    !Number.isFinite(record.monotonicTimeMs) || record.monotonicTimeMs <= priorMonotonic || record.monotonicTimeMs < 0 ||
    record.monotonicTimeMs > attestationDocument.durationMs
  ) throw new Error(`${label} monotonicTimeMs is not strictly increasing within the session window`);
  const wall = Date.parse(record.occurredAt || "");
  if (
    !Number.isFinite(wall) || wall < priorWall || wall < attestationDocument.startedAtMs || wall > attestationDocument.endedAtMs
  ) throw new Error(`${label} occurredAt is invalid, non-monotonic, or outside the session window`);
  if (Math.abs((wall - attestationDocument.startedAtMs) - record.monotonicTimeMs) > 1) {
    throw new Error(`${label} wall-clock and monotonic times do not identify the same session instant`);
  }
  return wall;
}

function commonSessionBinding(attestation) {
  return {
    sessionId: attestation.sessionId,
    traceSpecSha256: attestation.traceSpec.sha256,
    sourceSwfSha256: attestation.sourceSwf.sha256,
    originalHostSwfSha256: attestation.originalHostSwf.sha256,
    captureKitManifestSha256: attestation.captureKit.kitManifest.sha256,
    sandboxProfileSha256: attestation.captureKit.sandboxProfile.sha256,
    environmentIsolationReceiptSha256: attestation.environmentIsolation.sha256,
    launchReceiptSha256: attestation.launchReceipt.sha256,
    toolchainReceiptSha256: attestation.toolchainReceipt.sha256,
  };
}

function validateRecordIdentity(record, {spec, binding, operator, label}) {
  if (
    record.schemaVersion !== 1 || record.animationId !== spec.animationId || record.requirementId !== spec.requirementId ||
    record.proofMode !== PROOF_MODE || record.sessionId !== binding.sessionId ||
    record.traceSpecSha256 !== binding.traceSpecSha256 || record.sourceSwfSha256 !== binding.sourceSwfSha256 ||
    record.originalHostSwfSha256 !== binding.originalHostSwfSha256 ||
    record.captureKitManifestSha256 !== binding.captureKitManifestSha256 ||
    record.sandboxProfileSha256 !== binding.sandboxProfileSha256 ||
    record.environmentIsolationReceiptSha256 !== binding.environmentIsolationReceiptSha256 ||
    record.launchReceiptSha256 !== binding.launchReceiptSha256 ||
    record.toolchainReceiptSha256 !== binding.toolchainReceiptSha256
  ) throw new Error(`${label} session/spec/source/receipt identity binding is invalid`);
  if (!same(record.operator, operator)) throw new Error(`${label} operator differs from the named-human session attestation`);
}

function segmentExpectedState(segment, frame) {
  const expected = structuredClone(segment.expectedState);
  if (expected.localFrameRange) {
    const range = expected.localFrameRange;
    if (frame < range.firstFrame || frame > range.lastFrame) throw new Error(`local frame ${frame} falls outside its playback-segment state range`);
    delete expected.localFrameRange;
    expected.localFrame = frame;
  }
  return expected;
}

async function verifyNaturalEvidenceInputs({
  root,
  bound,
  operationLogPath,
  framesDirectory,
  stateSnapshotsPath,
  targetResolutionsPath,
  attestationDocument,
}) {
  const {spec} = bound;
  const attestation = attestationDocument.attestation;
  const binding = commonSessionBinding(attestation);
  const [operationLog, stateLog, targetLog] = await Promise.all([
    readJsonLines(operationLogPath, "natural operation log"),
    readJsonLines(stateSnapshotsPath, "natural state snapshot log"),
    readJsonLines(targetResolutionsPath, "natural source-target resolution log"),
  ]);
  const frameCount = spec.frameDomain.frameCount;
  const stepCount = spec.schedule.orderedSteps.length;
  if (operationLog.records.length !== frameCount + stepCount) {
    throw new Error(`natural operation log must contain exactly ${frameCount} frame observations plus ${stepCount} source action dispatches`);
  }
  if (stateLog.records.length !== frameCount) throw new Error(`natural state snapshot log must contain exactly ${frameCount} records`);
  if (targetLog.records.length !== stepCount) throw new Error(`natural source-target resolution log must contain exactly ${stepCount} records`);
  const framesDirectoryIdentity = await captureDirectoryIdentity(root, framesDirectory, "natural frames directory");
  const directoryEntries = await readdir(framesDirectory, {withFileTypes: true});
  if (directoryEntries.length !== frameCount || directoryEntries.some((item) => !item.isFile() || !item.name.toLowerCase().endsWith(".png"))) {
    throw new Error(`frames directory must contain exactly ${frameCount} regular PNG files and no other entries`);
  }
  const frameDirectoryNames = directoryEntries.map(({name}) => name).sort();

  const checkpointByFrame = new Map();
  for (const checkpoint of spec.schedule.stateCheckpoints) {
    const frame = checkpoint.expectedState.localFrame;
    if (!Number.isInteger(frame) || frame < 1 || frame > frameCount) throw new Error(`checkpoint ${checkpoint.id} has no valid localFrame`);
    const list = checkpointByFrame.get(frame) || [];
    list.push(checkpoint);
    checkpointByFrame.set(frame, list);
  }
  const stateItems = [];
  const seenPngPaths = new Set();
  let priorStateHash = null;
  let priorStateMonotonic = -Infinity;
  let priorStateWall = -Infinity;
  let totalCompressedPngBytes = 0;
  let totalDecodedPngBytes = 0;
  const frameSnapshots = [];
  for (let index = 0; index < frameCount; index += 1) {
    const frame = index + 1;
    const item = stateLog.records[index];
    const state = assertObject(item.record, `natural state snapshot line ${item.lineNumber}`);
    assertExactKeys(state, [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256",
      "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256", "sandboxProfileSha256",
      "environmentIsolationReceiptSha256", "launchReceiptSha256", "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs", "operator",
      "frameDomainId", "observedRootFrame", "observedLocalFrame", "observedState", "observedStateSha256",
      "screenshotFile", "screenshotSha256", "previousRecordSha256", "recordSha256",
    ], `natural state snapshot frame ${frame}`);
    validateRecordIdentity(state, {spec, binding, operator: attestation.operator, label: `natural state snapshot frame ${frame}`});
    if (
      state.evidenceType !== "attested-natural-trace-state-snapshot" || state.sequence !== frame ||
      state.frameDomainId !== spec.frameDomain.id || state.observedRootFrame !== spec.frameDomain.parentEntryFrame ||
      state.observedLocalFrame !== frame || state.previousRecordSha256 !== priorStateHash ||
      state.recordSha256 !== naturalStateRecordSha256(state)
    ) throw new Error(`natural state snapshot hash/identity/frame chain is invalid at local frame ${frame}`);
    const wall = validateBoundTime(state, {
      label: `natural state snapshot frame ${frame}`,
      priorMonotonic: priorStateMonotonic,
      priorWall: priorStateWall,
      attestationDocument,
    });
    assertObject(state.observedState, `natural state snapshot frame ${frame}.observedState`);
    if (
      state.observedStateSha256 !== stateSha256(state.observedState) ||
      state.observedState.rootFrame !== state.observedRootFrame || state.observedState.localFrame !== state.observedLocalFrame ||
      state.observedState.language !== spec.identity.language || String(state.observedState.seed) !== String(spec.identity.seed)
    ) throw new Error(`natural state snapshot observed state/hash/language/seed is invalid at local frame ${frame}`);
    assertObservedState(segmentExpectedState(bound.frameOwners[frame], frame), state.observedState, `playback segment frame ${frame}`);
    for (const checkpoint of checkpointByFrame.get(frame) || []) {
      assertObservedState(checkpoint.expectedState, state.observedState, `checkpoint ${checkpoint.id}`);
    }
    if (frame === frameCount) assertObservedState(spec.schedule.terminalSemantics.expectedState, state.observedState, "terminal state");
    assertSha256(state.screenshotSha256, `natural state snapshot frame ${frame}.screenshotSha256`);
    const screenshotPath = await resolveInputPath({
      root,
      workspace: bound.workspace,
      declared: state.screenshotFile,
      label: `natural state snapshot frame ${frame}.screenshotFile`,
      bases: [root],
    });
    const actualFramesDirectory = await realpath(framesDirectory);
    const actualScreenshot = await realpath(screenshotPath);
    if (!isLexicallyInside(actualScreenshot, actualFramesDirectory)) throw new Error(`natural frame ${frame} screenshot escapes the declared frames directory`);
    if (seenPngPaths.has(actualScreenshot)) throw new Error(`natural state snapshots reuse a PNG at local frame ${frame}`);
    seenPngPaths.add(actualScreenshot);
    const screenshotSnapshot = await captureProtectedFile(root, screenshotPath, `natural frame ${frame} screenshot`);
    const pngBytes = await readFile(screenshotPath);
    if (digest(pngBytes) !== state.screenshotSha256) throw new Error(`natural frame ${frame} screenshot SHA-256 mismatch`);
    const png = validateRootFramePngBytes(pngBytes, `natural frame ${frame} screenshot`);
    totalCompressedPngBytes += png.compressedBytes;
    totalDecodedPngBytes += png.decodedBytes;
    if (totalCompressedPngBytes > MAX_ROOT_FRAME_PNG_TOTAL_BYTES) {
      throw new Error("natural frame set exceeds the total compressed PNG byte limit");
    }
    if (totalDecodedPngBytes > MAX_ROOT_FRAME_DECODED_TOTAL_BYTES) {
      throw new Error("natural frame set exceeds the total decoded PNG byte limit");
    }
    const attestedFrame = attestation.frameSet.frames[index];
    if (attestedFrame.frame !== frame || attestedFrame.file !== state.screenshotFile || attestedFrame.sha256 !== state.screenshotSha256) {
      throw new Error(`natural frame ${frame} differs from the attested ordered frame set`);
    }
    frameSnapshots.push(screenshotSnapshot);
    stateItems.push({...item, state, wall, screenshotPath, screenshotSnapshot});
    priorStateHash = state.recordSha256;
    priorStateMonotonic = state.monotonicTimeMs;
    priorStateWall = wall;
  }
  if (seenPngPaths.size !== directoryEntries.length) throw new Error("frames directory contains PNG files not uniquely bound to state snapshots");
  await assertDirectoryIdentity(root, framesDirectory, framesDirectoryIdentity, "natural frames directory");
  const confirmedFrameNames = (await readdir(framesDirectory, {withFileTypes: true})).map(({name}) => name).sort();
  if (!same(frameDirectoryNames, confirmedFrameNames)) throw new Error("natural frames directory inventory changed during validation");

  const targetItems = [];
  let priorTargetHash = null;
  let priorTargetMonotonic = -Infinity;
  let priorTargetWall = -Infinity;
  for (let index = 0; index < stepCount; index += 1) {
    const step = spec.schedule.orderedSteps[index];
    const item = targetLog.records[index];
    const target = assertObject(item.record, `natural source-target resolution line ${item.lineNumber}`);
    assertExactKeys(target, [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256",
      "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256", "sandboxProfileSha256",
      "environmentIsolationReceiptSha256", "launchReceiptSha256", "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs", "operator",
      "scheduleStepOrder", "action", "expectedSourceTarget", "resolvedSourceTarget", "resolution",
      "previousRecordSha256", "recordSha256",
    ], `natural source-target resolution ${index + 1}`);
    validateRecordIdentity(target, {spec, binding, operator: attestation.operator, label: `natural source-target resolution ${index + 1}`});
    if (
      target.evidenceType !== "attested-natural-source-target-resolution" || target.sequence !== index + 1 ||
      target.scheduleStepOrder !== step.order || !same(target.action, step.action) ||
      !same(target.expectedSourceTarget, step.sourceTarget) || !same(target.resolvedSourceTarget, step.sourceTarget) ||
      target.resolution !== "resolved-exactly-to-bound-source-target" || target.previousRecordSha256 !== priorTargetHash ||
      target.recordSha256 !== naturalTargetResolutionSha256(target)
    ) throw new Error(`natural source-target resolution ${index + 1} differs from the exact source schedule or hash chain`);
    const wall = validateBoundTime(target, {
      label: `natural source-target resolution ${index + 1}`,
      priorMonotonic: priorTargetMonotonic,
      priorWall: priorTargetWall,
      attestationDocument,
    });
    targetItems.push({...item, target, wall});
    priorTargetHash = target.recordSha256;
    priorTargetMonotonic = target.monotonicTimeMs;
    priorTargetWall = wall;
  }

  const stepsAfterFrame = new Map();
  for (const step of spec.schedule.orderedSteps) {
    const frame = bound.checkpoints.get(step.preStateCheckpoint.checkpointId).expectedState.localFrame;
    const list = stepsAfterFrame.get(frame) || [];
    list.push(step);
    stepsAfterFrame.set(frame, list);
  }
  const expectedPlan = [];
  for (let frame = 1; frame <= frameCount; frame += 1) {
    expectedPlan.push({kind: "frame-observation", frame});
    for (const step of stepsAfterFrame.get(frame) || []) expectedPlan.push({kind: "source-action-dispatch", step});
  }
  const eventItems = [];
  let priorEventHash = null;
  let priorEventMonotonic = -Infinity;
  let priorEventWall = -Infinity;
  for (const [index, expected] of expectedPlan.entries()) {
    const item = operationLog.records[index];
    const event = assertObject(item.record, `natural operation log line ${item.lineNumber}`);
    const baseKeys = [
      "schemaVersion", "evidenceType", "eventKind", "animationId", "requirementId", "proofMode", "sessionId",
      "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256", "sandboxProfileSha256",
      "environmentIsolationReceiptSha256", "launchReceiptSha256", "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs",
      "operator", "previousEventSha256", "eventSha256",
    ];
    const frameKeys = [
      ...baseKeys, "frameDomainId", "observedRootFrame", "observedLocalFrame", "screenshotFile", "screenshotSha256",
      "stateSnapshotRecordSha256",
    ];
    const actionKeys = [
      ...baseKeys, "scheduleStepOrder", "action", "sourceTarget", "preCheckpointId", "postCheckpointId",
      "preStateSnapshotRecordSha256", "postStateSnapshotRecordSha256", "sourceTargetResolutionRecordSha256",
    ];
    assertExactKeys(event, expected.kind === "frame-observation" ? frameKeys : actionKeys, `natural operation event ${index + 1}`);
    validateRecordIdentity(event, {spec, binding, operator: attestation.operator, label: `natural operation event ${index + 1}`});
    if (
      event.evidenceType !== "attested-natural-trace-operation" || event.eventKind !== expected.kind || event.sequence !== index + 1 ||
      event.previousEventSha256 !== priorEventHash || event.eventSha256 !== naturalOperationEventSha256(event)
    ) throw new Error(`natural operation event hash/identity/sequence chain is invalid at sequence ${index + 1}`);
    const wall = validateBoundTime(event, {
      label: `natural operation event ${index + 1}`,
      priorMonotonic: priorEventMonotonic,
      priorWall: priorEventWall,
      attestationDocument,
    });
    if (expected.kind === "frame-observation") {
      const stateItem = stateItems[expected.frame - 1];
      if (
        event.frameDomainId !== spec.frameDomain.id || event.observedRootFrame !== spec.frameDomain.parentEntryFrame ||
        event.observedLocalFrame !== expected.frame || event.screenshotFile !== stateItem.state.screenshotFile ||
        event.screenshotSha256 !== stateItem.state.screenshotSha256 ||
        event.stateSnapshotRecordSha256 !== stateItem.state.recordSha256
      ) throw new Error(`natural frame observation ${expected.frame} differs from its state snapshot or PNG`);
      if (event.monotonicTimeMs > stateItem.state.monotonicTimeMs || wall > stateItem.wall) {
        throw new Error(`natural frame observation ${expected.frame} must occur no later than its state snapshot`);
      }
    } else {
      const step = expected.step;
      const pre = bound.checkpoints.get(step.preStateCheckpoint.checkpointId);
      const post = bound.checkpoints.get(step.postStateCheckpoint.checkpointId);
      const preStateItem = stateItems[pre.expectedState.localFrame - 1];
      const postStateItem = stateItems[post.expectedState.localFrame - 1];
      const targetItem = targetItems[step.order - 1];
      if (
        event.scheduleStepOrder !== step.order || !same(event.action, step.action) || !same(event.sourceTarget, step.sourceTarget) ||
        event.preCheckpointId !== pre.id || event.postCheckpointId !== post.id ||
        event.preStateSnapshotRecordSha256 !== preStateItem.state.recordSha256 ||
        event.postStateSnapshotRecordSha256 !== postStateItem.state.recordSha256 ||
        event.sourceTargetResolutionRecordSha256 !== targetItem.target.recordSha256
      ) throw new Error(`natural source action dispatch ${step.order} differs from the exact ordered schedule or checkpoint bindings`);
      if (
        preStateItem.state.monotonicTimeMs >= targetItem.target.monotonicTimeMs || targetItem.target.monotonicTimeMs > event.monotonicTimeMs ||
        event.monotonicTimeMs >= postStateItem.state.monotonicTimeMs ||
        preStateItem.wall >= targetItem.wall || targetItem.wall > wall || wall >= postStateItem.wall
      ) throw new Error(`natural source action dispatch ${step.order} is not ordered strictly between its pre/post checkpoints`);
    }
    eventItems.push({...item, event, wall, expected});
    priorEventHash = event.eventSha256;
    priorEventMonotonic = event.monotonicTimeMs;
    priorEventWall = wall;
  }
  for (const [index, item] of eventItems.entries()) {
    if (item.expected.kind !== "frame-observation") continue;
    const nextEvent = eventItems[index + 1];
    const stateItem = stateItems[item.expected.frame - 1];
    if (nextEvent && (stateItem.state.monotonicTimeMs >= nextEvent.event.monotonicTimeMs || stateItem.wall >= nextEvent.wall)) {
      throw new Error(`natural frame ${item.expected.frame} state snapshot must precede the next operation event`);
    }
  }
  if (
    attestation.operationLog.sha256 !== operationLog.sha256 || attestation.operationLog.eventCount !== operationLog.records.length ||
    attestation.operationLog.finalEventSha256 !== priorEventHash
  ) throw new Error("natural operation log bytes/count/final chain differ from the capture-session attestation");
  if (
    attestation.stateSnapshots.sha256 !== stateLog.sha256 || attestation.stateSnapshots.recordCount !== stateLog.records.length ||
    attestation.stateSnapshots.finalRecordSha256 !== priorStateHash
  ) throw new Error("natural state snapshots bytes/count/final chain differ from the capture-session attestation");
  if (
    attestation.sourceTargetResolutions.sha256 !== targetLog.sha256 ||
    attestation.sourceTargetResolutions.recordCount !== targetLog.records.length ||
    attestation.sourceTargetResolutions.finalRecordSha256 !== priorTargetHash
  ) throw new Error("natural source-target resolutions bytes/count/final chain differ from the capture-session attestation");
  const nestedEntry = attestationDocument.hostEntryLog.records[6];
  const sideEffectSummary = attestationDocument.hostEntryLog.records[7];
  const firstOperation = eventItems[0];
  const finalEvidence = [eventItems.at(-1), stateItems.at(-1), targetItems.at(-1)]
    .filter(Boolean)
    .map((item) => ({monotonicTimeMs: item.event?.monotonicTimeMs ?? item.state?.monotonicTimeMs ?? item.target?.monotonicTimeMs, wall: item.wall}));
  if (
    nestedEntry.monotonicTimeMs > firstOperation.event.monotonicTimeMs || Date.parse(nestedEntry.occurredAt) > firstOperation.wall ||
    finalEvidence.some((item) => sideEffectSummary.monotonicTimeMs < item.monotonicTimeMs || Date.parse(sideEffectSummary.occurredAt) < item.wall)
  ) throw new Error("natural host-entry/nested-entry/side-effect records do not enclose the captured trace evidence");
  return {
    operationLog,
    stateLog,
    targetLog,
    eventItems,
    stateItems,
    targetItems,
    frameSnapshots,
    framesDirectoryIdentity,
    frameDirectoryNames,
    operator: attestation.operator,
    capturedAt: attestation.endedAt,
  };
}

async function verifyNaturalPublicationPathIdentity({
  root,
  workspace,
  pendingDirectory,
  archiveDirectory,
  candidateManifestPath,
  candidateReportPath,
  canonicalBaselinePath,
  canonicalExecutionPath,
}) {
  for (const [candidate, label] of [
    [pendingDirectory, "pending natural requirement directory"],
    [archiveDirectory, "pending natural archive output"],
    [candidateManifestPath, "natural candidate manifest output"],
    [candidateReportPath, "natural candidate report output"],
  ]) await assertNoExistingSymlinkComponents(root, candidate, label);
  const actualRoot = await realpath(root);
  const expectedPending = path.resolve(actualRoot, path.relative(root, pendingDirectory));
  const actualPending = await realpath(pendingDirectory);
  if (actualPending !== expectedPending) throw new Error("resolved candidate parent is not the real fixed pending-natural-trace-capture directory");
  for (const candidate of [candidateManifestPath, candidateReportPath]) {
    if (await realpath(path.dirname(candidate)) !== actualPending) throw new Error("natural candidate output real parent differs from the fixed pending directory");
  }
  for (const canonicalDirectory of [path.dirname(canonicalBaselinePath), path.dirname(canonicalExecutionPath)]) {
    if (!(await exists(canonicalDirectory))) continue;
    const actualCanonical = await realpath(canonicalDirectory);
    if (isLexicallyInside(actualPending, actualCanonical)) throw new Error("resolved natural candidate parent falls inside a canonical baseline/execution directory");
  }
  const actualArchiveParent = await realpath(path.dirname(archiveDirectory));
  const expectedArchiveParent = path.resolve(actualRoot, path.relative(root, path.dirname(archiveDirectory)));
  if (actualArchiveParent !== expectedArchiveParent) throw new Error("resolved natural archive parent differs from its fixed lexical path");
  const canonicalArchiveDirectory = path.join(path.dirname(archiveDirectory), "original-runtime");
  if (await exists(canonicalArchiveDirectory)) {
    const actualCanonicalArchive = await realpath(canonicalArchiveDirectory);
    const intendedArchive = path.join(actualArchiveParent, path.basename(archiveDirectory));
    if (intendedArchive === actualCanonicalArchive || isLexicallyInside(intendedArchive, actualCanonicalArchive)) {
      throw new Error("resolved natural archive output falls inside the canonical original-runtime archive");
    }
  }
  const actualWorkspace = await realpath(workspace);
  if (!isLexicallyInside(actualPending, actualWorkspace)) throw new Error("resolved natural candidate parent escapes the migration workspace");
}

export function parseArguments(argumentsList) {
  const options = {projectRoot: repositoryRoot};
  const valueOptions = new Set([
    "--spec",
    "--operation-log",
    "--frames",
    "--state-snapshots",
    "--source-target-resolutions",
    "--host-entry-log",
    "--environment-isolation-receipt",
    "--launch-receipt",
    "--toolchain-receipt",
    "--capture-session-attestation",
    "--project-root",
  ]);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (valueOptions.has(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      const key = {
        "--spec": "spec",
        "--operation-log": "operationLog",
        "--frames": "frames",
        "--state-snapshots": "stateSnapshots",
        "--source-target-resolutions": "sourceTargetResolutions",
        "--host-entry-log": "hostEntryLog",
        "--environment-isolation-receipt": "environmentIsolationReceipt",
        "--launch-receipt": "launchReceipt",
        "--toolchain-receipt": "toolchainReceipt",
        "--capture-session-attestation": "captureSessionAttestation",
        "--project-root": "projectRoot",
      }[value];
      options[key] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export async function prepareNaturalTraceCandidate(options, {hooks = {}} = {}) {
  for (const field of [
    "archiveOutput",
    "candidateManifestOutput",
    "candidateReportOutput",
    "baselineOutput",
    "executionOutput",
    "updateCoverage",
    "promote",
    "adopt",
    "ownerReview",
    "humanReview",
  ]) {
    if (Object.hasOwn(options, field)) throw new Error(`${field} is unsupported; natural candidate outputs and acceptance state are fixed`);
  }
  const root = path.resolve(options.projectRoot || repositoryRoot);
  for (const [field, label] of [
    ["spec", "--spec"],
    ["operationLog", "--operation-log"],
    ["frames", "--frames"],
    ["stateSnapshots", "--state-snapshots"],
    ["sourceTargetResolutions", "--source-target-resolutions"],
    ["hostEntryLog", "--host-entry-log"],
    ["environmentIsolationReceipt", "--environment-isolation-receipt"],
    ["launchReceipt", "--launch-receipt"],
    ["toolchainReceipt", "--toolchain-receipt"],
    ["captureSessionAttestation", "--capture-session-attestation"],
  ]) assertString(options[field], label);
  const specPath = await resolveInputPath({root, workspace: root, declared: options.spec, label: "--spec", bases: [root]});
  const bound = await loadBoundNaturalTrace({root, specPath});
  const {spec, workspace} = bound;
  const operationLogPath = await resolveInputPath({root, workspace, declared: options.operationLog, label: "--operation-log", bases: [root]});
  const framesDirectory = await resolveInputPath({root, workspace, declared: options.frames, label: "--frames", type: "directory", bases: [root]});
  const stateSnapshotsPath = await resolveInputPath({root, workspace, declared: options.stateSnapshots, label: "--state-snapshots", bases: [root]});
  const targetResolutionsPath = await resolveInputPath({root, workspace, declared: options.sourceTargetResolutions, label: "--source-target-resolutions", bases: [root]});
  const hostEntryLogPath = await resolveInputPath({root, workspace, declared: options.hostEntryLog, label: "--host-entry-log", bases: [root]});
  const environmentIsolationReceiptPath = await resolveInputPath({root, workspace, declared: options.environmentIsolationReceipt, label: "--environment-isolation-receipt", bases: [root]});
  const launchReceiptPath = await resolveInputPath({root, workspace, declared: options.launchReceipt, label: "--launch-receipt", bases: [root]});
  const receiptPath = await resolveInputPath({root, workspace, declared: options.toolchainReceipt, label: "--toolchain-receipt", bases: [root]});
  const attestationPath = await resolveInputPath({root, workspace, declared: options.captureSessionAttestation, label: "--capture-session-attestation", bases: [root]});
  const protectedInputSnapshots = [];
  for (const [candidate, label] of [
    [specPath, "natural trace specification"],
    [operationLogPath, "natural operation log"],
    [stateSnapshotsPath, "natural state snapshots"],
    [targetResolutionsPath, "natural source-target resolutions"],
    [hostEntryLogPath, "natural host-entry log"],
    [environmentIsolationReceiptPath, "natural environment-isolation receipt"],
    [launchReceiptPath, "natural launch receipt"],
    [receiptPath, "natural toolchain receipt"],
    [attestationPath, "natural capture-session attestation"],
  ]) protectedInputSnapshots.push(await captureProtectedFile(root, candidate, label));
  const receiptDocument = await verifyApprovedReceipt({root, workspace, receiptPath});
  const attestationDocument = await verifyNaturalCaptureSessionAttestation({
    root,
    bound,
    attestationPath,
    operationLogPath,
    stateSnapshotsPath,
    targetResolutionsPath,
    hostEntryLogPath,
    environmentIsolationReceiptPath,
    launchReceiptPath,
    framesDirectory,
    receiptPath,
    receiptDocument,
  });
  const protectedDependencyPaths = [
    ...Object.entries(bound.originalHostEvidence).map(([key, descriptor]) => [path.join(root, descriptor.file), `original-host ${key}`]),
    [attestationDocument.runtimeTreeManifestDocument.path, "natural runtime-tree manifest"],
    ...Object.entries(attestationDocument.captureKitDocument.documents).map(([key, document]) => [document.path, `natural capture-kit ${key}`]),
    [attestationDocument.environmentDocument.preflightInventory.path, "natural environment preflight inventory"],
    [attestationDocument.environmentDocument.postflightInventory.path, "natural environment postflight inventory"],
    [attestationDocument.launchDocument.kitCheck.path, "natural launch kit-check receipt"],
  ];
  for (const [index, artifact] of receiptDocument.receipt.identityArtifacts.entries()) {
    protectedDependencyPaths.push([
      await resolveInputPath({
        root,
        workspace,
        declared: artifact.file,
        label: `toolchain receipt identity artifact ${index + 1}`,
        bases: [workspace, root],
      }),
      `toolchain receipt identity artifact ${index + 1}`,
    ]);
  }
  const alreadyProtected = new Set(protectedInputSnapshots.map(({path: candidate}) => candidate));
  for (const [candidate, label] of protectedDependencyPaths) {
    if (alreadyProtected.has(candidate)) continue;
    protectedInputSnapshots.push(await captureProtectedFile(root, candidate, label));
    alreadyProtected.add(candidate);
  }
  const verified = await verifyNaturalEvidenceInputs({
    root,
    bound,
    operationLogPath,
    framesDirectory,
    stateSnapshotsPath,
    targetResolutionsPath,
    attestationDocument,
  });
  protectedInputSnapshots.push(...verified.frameSnapshots);
  const preservedSourceSnapshots = [];
  for (const [index, item] of attestationDocument.runtimeTreeManifestDocument.manifest.files.entries()) {
    const sourcePath = await resolveInputPath({
      root,
      workspace,
      declared: item.sourcePath,
      label: `preserved runtime-tree source ${index + 1}`,
      bases: [root],
    });
    const snapshot = await captureProtectedFile(root, sourcePath, `preserved runtime-tree source ${index + 1}`);
    if (snapshot.sha256 !== item.sha256) throw new Error(`preserved runtime-tree source ${index + 1} SHA-256 is stale`);
    preservedSourceSnapshots.push(snapshot);
    protectedInputSnapshots.push(snapshot);
  }
  const assertPreservedSourcesUnchanged = async (phase) => {
    for (const item of preservedSourceSnapshots) {
      try {
        await assertProtectedFileUnchanged(root, item, phase);
      } catch {
        throw new Error(`a preserved original-host runtime-tree source changed ${phase} natural candidate preparation`);
      }
    }
  };
  const safeId = safeRequirementId(spec.requirementId);
  const defaultArchive = path.join(
    root,
    "artifacts",
    "full-frame",
    "pilot-baselines",
    spec.animationId,
    safeId,
    "pending-human-owner-natural-trace",
  );
  const archiveDirectory = await resolveFixedOutputPath(root, defaultArchive, "natural archive output");
  const pendingDirectory = path.join(workspace, "evidence", "pending-natural-trace-capture", safeId);
  const candidateManifestPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-manifest.json"), "natural candidate manifest output");
  const candidateReportPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-report.json"), "natural candidate report output");
  const canonicalBaselinePath = path.join(workspace, "baseline", "original-runtime", `${safeId}.json`);
  const canonicalExecutionPath = path.join(workspace, spec.executionEvidence.expectedExecutionReportPath);
  if (
    candidateManifestPath === canonicalBaselinePath || candidateManifestPath === canonicalExecutionPath ||
    candidateReportPath === canonicalBaselinePath || candidateReportPath === canonicalExecutionPath
  ) throw new Error("natural candidate outputs must never target canonical baseline or execution evidence");
  for (const snapshot of protectedInputSnapshots) {
    for (const output of [archiveDirectory, pendingDirectory, candidateManifestPath, candidateReportPath]) {
      if (pathsOverlap(snapshot.path, output)) {
        throw new Error(`${snapshot.label} overlaps a fixed natural candidate output path`);
      }
    }
  }
  if (pathsOverlap(framesDirectory, archiveDirectory) || pathsOverlap(framesDirectory, pendingDirectory)) {
    throw new Error("natural frames directory overlaps a fixed natural candidate output path");
  }
  for (const [candidate, label] of [
    [archiveDirectory, "natural archive output"],
    [candidateManifestPath, "natural candidate manifest output"],
    [candidateReportPath, "natural candidate report output"],
  ]) {
    if (await exists(candidate)) throw new Error(`${label} already exists; candidate evidence is append-only and will not be overwritten`);
  }
  await ensureRealOutputDirectory(root, pendingDirectory, "pending natural requirement directory");
  await ensureRealOutputDirectory(root, path.dirname(archiveDirectory), "pending natural archive parent");
  await verifyNaturalPublicationPathIdentity({
    root,
    workspace,
    pendingDirectory,
    archiveDirectory,
    candidateManifestPath,
    candidateReportPath,
    canonicalBaselinePath,
    canonicalExecutionPath,
  });

  const assertAllInputsUnchanged = async (phase) => {
    await assertProtectedInputsUnchanged(root, protectedInputSnapshots, phase);
    await assertDirectoryIdentity(root, framesDirectory, verified.framesDirectoryIdentity, `natural frames directory ${phase}`);
    const names = (await readdir(framesDirectory, {withFileTypes: true})).map(({name}) => name).sort();
    if (!same(names, verified.frameDirectoryNames)) throw new Error(`natural frames directory inventory changed ${phase}`);
  };

  await assertPreservedSourcesUnchanged("before");
  await assertAllInputsUnchanged("before publication");
  const archiveRelative = portable(path.relative(root, archiveDirectory));
  const candidateManifestRelative = portable(path.relative(root, candidateManifestPath));
  const candidateReportRelative = portable(path.relative(root, candidateReportPath));
  const archiveParent = path.dirname(archiveDirectory);
  const stagedArchive = path.join(archiveParent, `.tmp-${path.basename(archiveDirectory)}-${process.pid}-${Date.now()}`);
  const archiveParentIdentity = await captureDirectoryIdentity(root, archiveParent, "pending natural archive parent");
  const pendingIdentity = await captureDirectoryIdentity(root, pendingDirectory, "pending natural requirement directory");
  const stagedTransaction = await createOwnedDirectory(root, stagedArchive, "natural staged candidate archive");
  let archiveTransaction = null;
  let candidateManifestOwnership = null;
  let candidateReportOwnership = null;
  try {
    const frameDescriptors = [];
    const frameDigits = Math.max(4, String(spec.frameDomain.frameCount).length);
    for (const item of verified.stateItems) {
      const frame = item.state.observedLocalFrame;
      const basename = `frame-${String(frame).padStart(frameDigits, "0")}.png`;
      const archivedFramePath = path.join(stagedArchive, basename);
      await assertProtectedFileUnchanged(root, item.screenshotSnapshot, `before archival of natural frame ${frame}`);
      const frameBytes = await readFile(item.screenshotPath);
      const png = validateRootFramePngBytes(frameBytes, `natural frame ${frame} archival input`);
      if (digest(frameBytes) !== item.state.screenshotSha256) throw new Error(`natural frame ${frame} changed between validation and candidate archival`);
      await writeOwnedExclusive({
        root,
        parent: stagedArchive,
        parentIdentity: stagedTransaction.identity,
        candidate: archivedFramePath,
        bytes: frameBytes,
        label: `natural staged frame ${frame}`,
        collection: stagedTransaction.files,
        key: basename,
      });
      frameDescriptors.push({
        animationId: spec.animationId,
        requirementId: spec.requirementId,
        frameDomainId: spec.identity.frameDomainId,
        traceId: spec.identity.traceId,
        entryStateSha256: spec.identity.entryStateSha256,
        frame,
        file: `${archiveRelative}/${basename}`,
        sha256: item.state.screenshotSha256,
        width: png.width,
        height: png.height,
      });
    }
    const operationBasename = "operation-log.jsonl";
    const stateBasename = "state-snapshots.jsonl";
    const targetBasename = "source-target-resolutions.jsonl";
    const receiptBasename = "toolchain-receipt.json";
    const attestationBasename = "capture-session-attestation.json";
    const environmentReceiptBasename = "environment-isolation-receipt.json";
    const environmentPreflightBasename = "environment-preflight-inventory.json";
    const environmentPostflightBasename = "environment-postflight-inventory.json";
    const launchReceiptBasename = "original-host-launch-receipt.json";
    const launchKitCheckBasename = "original-host-launch-kit-check.json";
    const hostEntryLogBasename = "original-host-entry-log.jsonl";
    const runtimeTreeManifestBasename = "runtime-tree-manifest.json";
    const captureKitBasenames = {
      kitManifest: "capture-kit-manifest.json",
      launcher: "capture-kit-launcher.sh",
      sandboxProfile: "capture-kit-sandbox.sb",
    };
    const hostEvidenceArchive = {};
    const dependencyWrites = [];
    for (const [key, descriptor] of Object.entries(bound.originalHostEvidence)) {
      const basename = `original-host-${key}.json`;
      const sourcePath = path.join(root, descriptor.file);
      const bytes = await readFile(sourcePath);
      if (digest(bytes) !== descriptor.sha256) throw new Error(`original-host ${key} changed before candidate archival`);
      dependencyWrites.push({basename, bytes});
      hostEvidenceArchive[key] = {file: `${archiveRelative}/${basename}`, sha256: descriptor.sha256};
    }
    const captureKitArchive = {};
    for (const [key, basename] of Object.entries(captureKitBasenames)) {
      const document = attestationDocument.captureKitDocument.documents[key];
      dependencyWrites.push({basename, bytes: document.bytes});
      captureKitArchive[key] = {file: `${archiveRelative}/${basename}`, sha256: document.sha256};
    }
    const receiptIdentityArchive = [];
    for (const [index, artifact] of receiptDocument.receipt.identityArtifacts.entries()) {
      const sourcePath = await resolveInputPath({root, workspace, declared: artifact.file, label: `toolchain receipt identity artifact ${index + 1}`, bases: [workspace, root]});
      const bytes = await readFile(sourcePath);
      if (digest(bytes) !== artifact.sha256) throw new Error(`toolchain receipt identity artifact ${index + 1} changed before candidate archival`);
      const basename = `toolchain-identity-${index + 1}${path.extname(sourcePath) || ".bin"}`;
      dependencyWrites.push({basename, bytes});
      receiptIdentityArchive.push({kind: artifact.kind, file: `${archiveRelative}/${basename}`, sha256: artifact.sha256});
    }
    const environmentIsolationArchive = {
      receipt: {file: `${archiveRelative}/${environmentReceiptBasename}`, sha256: attestationDocument.environmentDocument.sha256},
      preflightInventory: {file: `${archiveRelative}/${environmentPreflightBasename}`, sha256: attestationDocument.environmentDocument.preflightInventory.sha256},
      postflightInventory: {file: `${archiveRelative}/${environmentPostflightBasename}`, sha256: attestationDocument.environmentDocument.postflightInventory.sha256},
    };
    const launchReceiptArchive = {
      receipt: {file: `${archiveRelative}/${launchReceiptBasename}`, sha256: attestationDocument.launchDocument.sha256},
      kitCheck: {file: `${archiveRelative}/${launchKitCheckBasename}`, sha256: attestationDocument.launchDocument.kitCheck.sha256},
    };
    const hostEntryLogArchive = {
      file: `${archiveRelative}/${hostEntryLogBasename}`,
      sha256: attestationDocument.hostEntryLog.sha256,
      recordCount: attestationDocument.hostEntryLog.records.length,
      finalRecordSha256: attestationDocument.hostEntryLog.finalRecordSha256,
    };
    const archiveInputs = [
      [operationBasename, verified.operationLog.bytes],
      [stateBasename, verified.stateLog.bytes],
      [targetBasename, verified.targetLog.bytes],
      [receiptBasename, receiptDocument.bytes],
      [attestationBasename, attestationDocument.bytes],
      [environmentReceiptBasename, attestationDocument.environmentDocument.bytes],
      [environmentPreflightBasename, attestationDocument.environmentDocument.preflightInventory.bytes],
      [environmentPostflightBasename, attestationDocument.environmentDocument.postflightInventory.bytes],
      [launchReceiptBasename, attestationDocument.launchDocument.bytes],
      [launchKitCheckBasename, attestationDocument.launchDocument.kitCheck.bytes],
      [hostEntryLogBasename, attestationDocument.hostEntryLog.bytes],
      [runtimeTreeManifestBasename, attestationDocument.runtimeTreeManifestDocument.bytes],
      ...dependencyWrites.map(({basename, bytes}) => [basename, bytes]),
    ];
    for (const [basename, bytes] of archiveInputs) {
      await writeOwnedExclusive({
        root,
        parent: stagedArchive,
        parentIdentity: stagedTransaction.identity,
        candidate: path.join(stagedArchive, basename),
        bytes,
        label: `natural staged archive ${basename}`,
        collection: stagedTransaction.files,
        key: basename,
      });
    }
    const operationDescriptor = {file: `${archiveRelative}/${operationBasename}`, sha256: verified.operationLog.sha256};
    const stateDescriptor = {file: `${archiveRelative}/${stateBasename}`, sha256: verified.stateLog.sha256};
    const targetDescriptor = {file: `${archiveRelative}/${targetBasename}`, sha256: verified.targetLog.sha256};
    const receiptDescriptor = {file: `${archiveRelative}/${receiptBasename}`, sha256: receiptDocument.sha256};
    const attestationDescriptor = {file: `${archiveRelative}/${attestationBasename}`, sha256: attestationDocument.sha256};
    const runtimeTreeManifestDescriptor = {
      file: `${archiveRelative}/${runtimeTreeManifestBasename}`,
      sha256: attestationDocument.runtimeTreeManifestDocument.sha256,
    };
    captureKitArchive.runtimeTreeManifest = runtimeTreeManifestDescriptor;
    captureKitArchive.nodeExecutable = attestationDocument.captureKitDocument.descriptor.nodeExecutable;
    const entryProtocolClaim = `The named human and the verified disposable-environment, launch, and host-entry records claim the checked, byte-identical staged copy of preserved original lesson host ${bound.originalHostSwf.path} loaded only the hash-bound minimal runtime tree, loaded the exact child SWF, naturally handed it to root frame ${spec.frameDomain.parentEntryFrame}, entered ${spec.frameDomain.id}, captured every local frame 1..${spec.frameDomain.frameCount}, and dispatched only the ${spec.schedule.orderedSteps.length} source-specified action(s).`;
    const candidateManifest = {
      schemaVersion: 1,
      evidenceType: "attested-natural-trace-candidate-manifest",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      frameDomainId: spec.identity.frameDomainId,
      traceId: spec.identity.traceId,
      entryStateSha256: spec.identity.entryStateSha256,
      scenario: spec.identity.scenario,
      language: spec.identity.language,
      seed: String(spec.identity.seed),
      capturedAtClaim: verified.capturedAt,
      source: {
        swf: spec.sourceBindings.sourceSwf.path,
        swfSha256: spec.sourceBindings.sourceSwf.sha256,
        originalHostSwf: bound.originalHostSwf,
        originalHostEvidence: bound.originalHostEvidence,
        archivedOriginalHostEvidence: hostEvidenceArchive,
        runtimeTreeManifest: runtimeTreeManifestDescriptor,
        captureKit: captureKitArchive,
        environmentIsolation: environmentIsolationArchive,
        launchReceipt: launchReceiptArchive,
        hostEntryLog: hostEntryLogArchive,
        toolchainIdentityArtifacts: receiptIdentityArchive,
      },
      declaredRuntimeFacts: {
        stage: {width: 800, height: 600},
        fps: 12,
        rootEntryFrame: spec.frameDomain.parentEntryFrame,
        localFrameCount: spec.frameDomain.frameCount,
        frameNumbering: "one-indexed",
      },
      scheduleBinding: scheduleBinding(spec),
      attestedCaptureClaim: {
        sessionId: attestationDocument.attestation.sessionId,
        namedHuman: verified.operator,
        claimedTool: receiptDocument.receipt.runtime,
        claimedExecutableSha256: APPROVED_RUNTIME.executableSha256,
        proofMode: PROOF_MODE,
        entryProtocolClaim,
        operationSequenceChainSha256: verified.eventItems.at(-1).event.eventSha256,
        stateSequenceChainSha256: verified.stateItems.at(-1).state.recordSha256,
        sourceTargetSequenceChainSha256: verified.targetItems.at(-1).target.recordSha256,
        hostEntrySequenceChainSha256: attestationDocument.hostEntryLog.finalRecordSha256,
        environmentIsolation: environmentIsolationArchive,
        launchReceipt: launchReceiptArchive,
        hostEntryLog: hostEntryLogArchive,
        toolchainReceipt: receiptDescriptor,
        captureSessionAttestation: attestationDescriptor,
        limitation: NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE,
      },
      frames: frameDescriptors,
    };
    const candidateManifestBytes = Buffer.from(renderJson(candidateManifest));
    const candidateManifestDescriptor = {file: candidateManifestRelative, sha256: digest(candidateManifestBytes)};
    let previousResultSha256 = null;
    const frameResults = verified.stateItems.map((item, index) => {
      const frameDescriptor = frameDescriptors[index];
      const operation = verified.eventItems.find((candidate) => candidate.expected.kind === "frame-observation" && candidate.expected.frame === item.state.observedLocalFrame);
      const result = {
        frame: item.state.observedLocalFrame,
        observedRootFrame: item.state.observedRootFrame,
        observedLocalFrame: item.state.observedLocalFrame,
        operationSequence: operation.event.sequence,
        stateSnapshotRecordSha256: item.state.recordSha256,
        observedStateSha256: item.state.observedStateSha256,
        screenshotFile: frameDescriptor.file,
        screenshotSha256: frameDescriptor.sha256,
        width: 800,
        height: 600,
        previousResultSha256,
        result: "candidate-natural-observation-bound",
      };
      result.resultSha256 = candidateResultSha256(result);
      previousResultSha256 = result.resultSha256;
      return result;
    });
    const orderedStepResults = spec.schedule.orderedSteps.map((step) => {
      const operation = verified.eventItems.find((item) => item.expected.kind === "source-action-dispatch" && item.expected.step.order === step.order);
      const target = verified.targetItems[step.order - 1];
      return {
        order: step.order,
        result: "candidate-exact-source-step-observed",
        action: step.action,
        sourceTarget: step.sourceTarget,
        operationSequence: operation.event.sequence,
        operationEventSha256: operation.event.eventSha256,
        sourceTargetResolutionRecordSha256: target.target.recordSha256,
        preCheckpointId: step.preStateCheckpoint.checkpointId,
        postCheckpointId: step.postStateCheckpoint.checkpointId,
      };
    });
    const checkpointResults = spec.schedule.stateCheckpoints.map((checkpoint) => {
      const item = verified.stateItems[checkpoint.expectedState.localFrame - 1];
      return {
        checkpointId: checkpoint.id,
        localFrame: checkpoint.expectedState.localFrame,
        expectedStateSha256: stateSha256(checkpoint.expectedState),
        observedState: item.state.observedState,
        observedStateSha256: item.state.observedStateSha256,
        stateSnapshotRecordSha256: item.state.recordSha256,
        result: "candidate-expected-state-semantics-observed",
      };
    });
    const terminalItem = verified.stateItems.at(-1);
    const candidateReport = {
      schemaVersion: 1,
      evidenceType: "attested-natural-trace-candidate-report",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      proofMode: PROOF_MODE,
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      identity: {
        frameDomainId: spec.identity.frameDomainId,
        traceId: spec.identity.traceId,
        entryStateSha256: spec.identity.entryStateSha256,
        scenario: spec.identity.scenario,
        language: spec.identity.language,
        seed: String(spec.identity.seed),
      },
      traceSpecBinding: {file: bound.specRelative, sha256: bound.specDocument.sha256},
      originalHostEvidence: bound.originalHostEvidence,
      archivedOriginalHostEvidence: hostEvidenceArchive,
      runtimeTreeManifest: runtimeTreeManifestDescriptor,
      captureKit: captureKitArchive,
      environmentIsolation: environmentIsolationArchive,
      launchReceipt: launchReceiptArchive,
      hostEntryLog: hostEntryLogArchive,
      scheduleBinding: scheduleBinding(spec),
      captureSessionAttestation: attestationDescriptor,
      claimedRuntime: {
        runtimeId: receiptDocument.receipt.runtime.runtimeId,
        name: receiptDocument.receipt.runtime.name,
        version: receiptDocument.receipt.runtime.version,
        build: receiptDocument.receipt.runtime.version,
        claimedExecutableSha256: APPROVED_RUNTIME.executableSha256,
        claimedLaunchProtocol: entryProtocolClaim,
        authority: CANDIDATE_AUTHORITY,
        sourceSwfSha256: spec.sourceBindings.sourceSwf.sha256,
        originalHostSwf: bound.originalHostSwf,
        originalHostEvidence: bound.originalHostEvidence,
        runtimeTreeManifest: runtimeTreeManifestDescriptor,
        captureKit: captureKitArchive,
        environmentIsolation: environmentIsolationArchive,
        launchReceipt: launchReceiptArchive,
        hostEntryLog: hostEntryLogArchive,
        toolchainReceipt: receiptDescriptor,
        toolchainIdentityArtifacts: receiptIdentityArchive,
        sessionId: attestationDocument.attestation.sessionId,
        namedHumanOperator: attestationDocument.attestation.operator,
        captureSessionAttestation: attestationDescriptor,
        authorityStatement: "Named-human accountability claim only; this preparer verifies bindings and semantics but cannot independently prove runtime provenance.",
        authorityLimitations: [NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE],
      },
      rawEventLog: {...operationDescriptor, eventCount: verified.eventItems.length, dispatchedActionCount: orderedStepResults.length},
      sourceTargetResolutionLog: {...targetDescriptor, recordCount: verified.targetItems.length},
      stateSnapshotArchive: {...stateDescriptor, recordCount: verified.stateItems.length},
      candidateManifest: candidateManifestDescriptor,
      frameResults,
      orderedStepResults,
      checkpointResults,
      terminalResult: {
        expectedStateSha256: stateSha256(spec.schedule.terminalSemantics.expectedState),
        observedState: terminalItem.state.observedState,
        observedStateSha256: terminalItem.state.observedStateSha256,
        stateSnapshotRecordSha256: terminalItem.state.recordSha256,
        result: "candidate-terminal-semantics-observed",
      },
      unexpectedEvents: [],
      candidateSequenceChainSha256: previousResultSha256,
    };
    const candidateReportBytes = Buffer.from(renderJson(candidateReport));
    const candidateReportDescriptor = {file: candidateReportRelative, sha256: digest(candidateReportBytes)};
    for (const descriptor of frameDescriptors) {
      if (digest(await readFile(path.join(stagedArchive, path.basename(descriptor.file)))) !== descriptor.sha256) {
        throw new Error(`archived natural frame ${descriptor.frame} changed before candidate publication`);
      }
    }
    for (const descriptor of [
      ...Object.values(hostEvidenceArchive),
      ...Object.values(captureKitArchive).filter((item) => item?.file),
      ...Object.values(environmentIsolationArchive),
      ...Object.values(launchReceiptArchive),
      hostEntryLogArchive,
      ...receiptIdentityArchive,
      runtimeTreeManifestDescriptor,
    ]) {
      if (digest(await readFile(path.join(stagedArchive, path.basename(descriptor.file)))) !== descriptor.sha256) {
        throw new Error("an archived natural-capture dependency changed before candidate publication");
      }
    }
    await assertPreservedSourcesUnchanged("during");
    await assertAllInputsUnchanged("after staging");
    await hooks.afterStaging?.({stagedArchive, archiveDirectory, pendingDirectory, framesDirectory});
    await assertAllInputsUnchanged("after staging hook");
    await verifyOwnedArchive(root, stagedTransaction);
    await verifyNaturalPublicationPathIdentity({
      root,
      workspace,
      pendingDirectory,
      archiveDirectory,
      candidateManifestPath,
      candidateReportPath,
      canonicalBaselinePath,
      canonicalExecutionPath,
    });
    await hooks.beforeArchivePublish?.({stagedArchive, archiveDirectory, pendingDirectory, archiveParent, framesDirectory});
    await assertAllInputsUnchanged("immediately before archive publication");
    archiveTransaction = await publishOwnedArchive({
      root,
      archiveParent,
      archiveParentIdentity,
      stagedTransaction,
      archiveDirectory,
    });
    await removeOwnedEmptyDirectory(stagedTransaction.path, stagedTransaction.identity);
    await hooks.afterArchive?.({archiveDirectory, pendingDirectory, candidateManifestPath, candidateReportPath});
    await verifyNaturalPublicationPathIdentity({
      root,
      workspace,
      pendingDirectory,
      archiveDirectory,
      candidateManifestPath,
      candidateReportPath,
      canonicalBaselinePath,
      canonicalExecutionPath,
    });
    await verifyOwnedArchive(root, archiveTransaction);
    for (const descriptor of frameDescriptors) {
      const bytes = await readFile(path.join(root, descriptor.file));
      if (digest(bytes) !== descriptor.sha256) throw new Error(`final archived natural frame ${descriptor.frame} SHA-256 changed`);
      validateRootFramePngBytes(bytes, `final archived natural frame ${descriptor.frame}`);
    }
    await writeNewAtomic(candidateManifestPath, candidateManifestBytes);
    candidateManifestOwnership = await capturePublishedOwnership(
      root,
      candidateManifestPath,
      candidateManifestDescriptor.sha256,
      "natural candidate manifest",
    );
    await hooks.afterManifest?.({candidateManifestPath, candidateReportPath, archiveDirectory, pendingDirectory});
    await verifyNaturalPublicationPathIdentity({
      root,
      workspace,
      pendingDirectory,
      archiveDirectory,
      candidateManifestPath,
      candidateReportPath,
      canonicalBaselinePath,
      canonicalExecutionPath,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: candidateManifestOwnership, label: "natural candidate manifest", requireSingleLink: true});
    await verifyOwnedArchive(root, archiveTransaction);
    await writeNewAtomic(candidateReportPath, candidateReportBytes);
    candidateReportOwnership = await capturePublishedOwnership(
      root,
      candidateReportPath,
      candidateReportDescriptor.sha256,
      "natural candidate report",
    );
    await hooks.afterReport?.({candidateManifestPath, candidateReportPath, archiveDirectory, pendingDirectory});
    await verifyNaturalPublicationPathIdentity({
      root,
      workspace,
      pendingDirectory,
      archiveDirectory,
      candidateManifestPath,
      candidateReportPath,
      canonicalBaselinePath,
      canonicalExecutionPath,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: candidateManifestOwnership, label: "natural candidate manifest", requireSingleLink: true});
    await verifyOwnedRegularFile({root, candidate: candidateReportPath, ownership: candidateReportOwnership, label: "natural candidate report", requireSingleLink: true});
    await verifyOwnedArchive(root, archiveTransaction);
    await assertAllInputsUnchanged("after final publication");
    await assertPreservedSourcesUnchanged("after");
    return {
      animationId: spec.animationId,
      requirementId: spec.requirementId,
      proofMode: PROOF_MODE,
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      frameCount: spec.frameDomain.frameCount,
      orderedStepCount: spec.schedule.orderedSteps.length,
      candidateManifest: candidateManifestDescriptor,
      candidateReport: candidateReportDescriptor,
      captureSessionAttestation: attestationDescriptor,
      environmentIsolation: environmentIsolationArchive,
      launchReceipt: launchReceiptArchive,
      hostEntryLog: hostEntryLogArchive,
      runtimeTreeManifest: runtimeTreeManifestDescriptor,
      archiveDirectory: archiveRelative,
      coverageChanged: false,
      statusChanged: false,
      reviewsChanged: false,
      sourceChanged: false,
    };
  } catch (error) {
    if (candidateReportOwnership) await removeOwnedFileIfUnchanged(candidateReportPath, candidateReportOwnership);
    if (candidateManifestOwnership) await removeOwnedFileIfUnchanged(candidateManifestPath, candidateManifestOwnership);
    if (archiveTransaction) await cleanupOwnedDirectory(archiveTransaction);
    await cleanupOwnedDirectory(stagedTransaction);
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else process.stdout.write(`${JSON.stringify(await prepareNaturalTraceCandidate(options), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
