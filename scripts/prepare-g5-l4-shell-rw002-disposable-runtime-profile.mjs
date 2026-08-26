#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  statfs,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  atomicPublishDirectoryNoReplace,
  assertRealDirectoryAncestors,
  ensureRealDirectoryPathFromNearestExistingAncestor,
} from "./lib/g5-l4-atomic-directory-publish.mjs";

import {
  DEFAULT_G5_L4_HOST_TREE_ROOT,
  G5_L4_FORBIDDEN_RUNTIME_REQUESTS,
  G5_L4_HOST_TREE_MANIFEST_NAME,
  G5_L4_TRACE_SCOPED_RESOURCES,
  buildG5L4HostTreePlan,
  sha256Bytes,
  stableJson,
  verifyG5L4HostTree,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const G5_L4_PROJECTOR_EXECUTABLE =
  "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";
export const G5_L4_PROJECTOR_SHA256 =
  "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
export const G5_L4_MINIMUM_SESSION_FREE_BYTES = 4 * 1024 * 1024 * 1024;
export const G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS = Object.freeze([35572]);
export const G5_L4_SESSION_ID_PATTERN =
  /^g5-l4-shell-rw002-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;

const PROFILE_DIRECTORIES = Object.freeze([
  "home",
  "home/Library",
  "home/Library/Preferences",
  "home/Library/Preferences/Macromedia",
  "home/Library/Preferences/Macromedia/Flash Player",
  "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
  "home/Library/Application Support",
  "home/Library/Application Support/Macromedia",
  "home/Library/Application Support/Macromedia/Flash Player",
  "tmp",
  "cache",
  "config",
  "data",
  "evidence",
  "evidence/logs",
  "evidence/network",
  "evidence/resource-requests",
  "evidence/frames",
  "evidence/audio",
]);
const RUNTIME_WRITABLE_RELATIVES = Object.freeze(["home", "tmp", "cache", "config", "data"]);
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 disposable-profile successor: ${message}`);
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function sbplLiteral(value) {
  return JSON.stringify(value);
}

export function profileEnvironment(profileRoot) {
  const home = path.join(profileRoot, "home");
  return Object.freeze({
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
    HOME: home,
    CFFIXED_USER_HOME: home,
    TMPDIR: `${path.join(profileRoot, "tmp")}${path.sep}`,
    XDG_CACHE_HOME: path.join(profileRoot, "cache"),
    XDG_CONFIG_HOME: path.join(profileRoot, "config"),
    XDG_DATA_HOME: path.join(profileRoot, "data"),
    USER: process.env.USER || "peter",
    LOGNAME: process.env.LOGNAME || process.env.USER || "peter",
    LANG: "en_US.UTF-8",
    LC_ALL: "en_US.UTF-8",
  });
}

export function renderG5L4SandboxProfile({
  projectorExecutable,
  hostTreeRoot,
  sessionRoot,
  replayLockRoot = path.join(path.dirname(sessionRoot), "authority-replay-locks"),
  allowedPaths = G5_L4_TRACE_SCOPED_RESOURCES.map(({path: relativePath}) => relativePath),
  currentHome = os.homedir(),
}) {
  for (const [label, value] of Object.entries({
    projectorExecutable,
    hostTreeRoot,
    sessionRoot,
    replayLockRoot,
    currentHome,
  })) {
    invariant(typeof value === "string" && path.isAbsolute(value), `${label} must be absolute`);
  }
  invariant(!isContained(sessionRoot, replayLockRoot) && !isContained(replayLockRoot, sessionRoot),
    "replay-lock authority root must be disjoint from the runtime-writable session root");
  invariant(Array.isArray(allowedPaths) && allowedPaths.length >= 1
    && new Set(allowedPaths).size === allowedPaths.length,
  "sandbox host-resource allowlist must be one non-empty unique array");
  const exactHostReads = allowedPaths.map((relativePath) => {
    invariant(typeof relativePath === "string" && !path.isAbsolute(relativePath)
      && portable(path.normalize(relativePath)) === relativePath,
    `sandbox host-resource path is not normalized: ${relativePath}`);
    const absolute = path.resolve(hostTreeRoot, relativePath);
    invariant(isContained(hostTreeRoot, absolute) && absolute !== hostTreeRoot,
      `sandbox host-resource path escapes the host tree: ${relativePath}`);
    invariant(!G5_L4_FORBIDDEN_RUNTIME_REQUESTS.includes(relativePath),
      `sandbox forbidden missing XML may not enter the read allowlist: ${relativePath}`);
    return absolute;
  });
  const metadataReads = new Set([hostTreeRoot]);
  for (const file of exactHostReads) {
    let cursor = path.dirname(file);
    while (isContained(hostTreeRoot, cursor)) {
      metadataReads.add(cursor);
      if (cursor === hostTreeRoot) break;
      cursor = path.dirname(cursor);
    }
  }
  const sessionWriteAllowlist = RUNTIME_WRITABLE_RELATIVES.map((relativePath) =>
    path.join(sessionRoot, "runtime-profile", relativePath));
  const missingXmlDenies = G5_L4_FORBIDDEN_RUNTIME_REQUESTS.map((request) =>
    `(deny file-read* (literal ${sbplLiteral(path.join(hostTreeRoot, request))}))`);
  return [
    "(version 1)",
    "(deny default)",
    "(deny network*)",
    "(deny appleevent-send)",
    `(allow process-exec (literal ${sbplLiteral(projectorExecutable)}))`,
    `(allow file-read-data file-read-metadata (literal ${sbplLiteral(projectorExecutable)}))`,
    `(deny file-write* (subpath ${sbplLiteral(hostTreeRoot)}))`,
    `(deny file-read* (subpath ${sbplLiteral(currentHome)}))`,
    `(deny file-read* file-write* (subpath ${sbplLiteral(replayLockRoot)}))`,
    `(allow file-read-metadata ${[...metadataReads].map((value) =>
      `(literal ${sbplLiteral(value)})`).join(" ")})`,
    `(allow file-read-data file-read-metadata ${exactHostReads.map((value) =>
      `(literal ${sbplLiteral(value)})`).join(" ")})`,
    ...missingXmlDenies,
    `(allow file-read* file-write* ${sessionWriteAllowlist.map((value) =>
      `(subpath ${sbplLiteral(value)})`).join(" ")})`,
    "",
  ].join("\n");
}

async function stableRegularFile(file, label, {executable = false} = {}) {
  const before = await lstat(file);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be one ordinary non-linked file`);
  if (executable) invariant((before.mode & 0o111) !== 0, `${label} must be executable`);
  const bytes = await readFile(file);
  const after = await lstat(file);
  invariant(after.dev === before.dev && after.ino === before.ino && after.size === bytes.length
    && after.mtimeMs === before.mtimeMs, `${label} changed while read`);
  return {
    path: file,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    mode: (after.mode & 0o777).toString(8).padStart(4, "0"),
  };
}

export function validateG5L4DisposableProfileManifest(manifest) {
  assertExactKeys(manifest, [
    "schemaVersion", "manifestType", "releaseId", "targetAnimationId", "language",
    "sessionId", "status", "sessionRoot", "profileRoot", "languageIsolation",
    "accountIsolation", "hostTree", "projector", "sandbox", "authorityState", "emptyStores",
    "preflightContract", "postflightContract", "executionGate", "acceptanceEffects",
    "manifestFingerprintSha256",
  ], "profile manifest");
  invariant(manifest?.schemaVersion === 1
    && manifest.manifestType === "g5-l4-shell-rw002-disposable-runtime-profile"
    && manifest.releaseId === "lesson-g05-l04-number-lines"
    && manifest.targetAnimationId === "course-g05-l04-rw-002"
    && ["en", "es"].includes(manifest.language)
    && G5_L4_SESSION_ID_PATTERN.test(manifest.sessionId || "")
    && manifest.sessionId.startsWith(`g5-l4-shell-rw002-${manifest.language}-`)
    && manifest.status === "empty-profile-candidate-not-authorized-not-launched",
  "profile manifest identity drifted");
  assertExactKeys(manifest.languageIsolation, [
    "profileReuseAcrossLanguagesForbidden", "freshProcessRequired",
    "separateMutableProfilePerLanguage",
  ], "profile language isolation");
  invariant(manifest.languageIsolation?.profileReuseAcrossLanguagesForbidden === true
    && manifest.languageIsolation?.freshProcessRequired === true
    && manifest.languageIsolation?.separateMutableProfilePerLanguage === true,
  "language isolation contract drifted");
  assertExactKeys(manifest.accountIsolation, ["mode", "environment", "userCreationOrDeletionRequired"],
    "profile account isolation");
  assertExactKeys(manifest.accountIsolation.environment, [
    "PATH", "HOME", "CFFIXED_USER_HOME", "TMPDIR", "XDG_CACHE_HOME", "XDG_CONFIG_HOME",
    "XDG_DATA_HOME", "USER", "LOGNAME", "LANG", "LC_ALL",
  ], "profile environment");
  assertExactKeys(manifest.hostTree, [
    "root", "manifestPath", "manifestSha256", "fileSetSha256", "readOnlyVerified",
    "exactAllowlistVerified", "sourceGapExceptionPreserved",
  ], "profile host tree");
  invariant(HASH.test(manifest.hostTree?.manifestSha256 || "")
    && HASH.test(manifest.hostTree?.fileSetSha256 || "")
    && manifest.hostTree?.readOnlyVerified === true
    && manifest.hostTree?.exactAllowlistVerified === true
    && manifest.hostTree?.sourceGapExceptionPreserved === true,
  "host-tree binding drifted");
  assertExactKeys(manifest.projector, [
    "path", "bytes", "sha256", "mode", "expectedSha256", "commandLineSwfArgumentForbidden",
    "startsEmpty",
  ], "profile Projector");
  invariant(manifest.projector?.path && HASH.test(manifest.projector?.sha256 || "")
    && manifest.projector?.expectedSha256 === manifest.projector.sha256,
  "Projector binding drifted");
  assertExactKeys(manifest.sandbox, [
    "executable", "path", "bytes", "sha256", "policy", "noEgressPolicyDeclared",
    "liveNoEgressVerified", "appleEventsDenied", "hostTreeWritesDenied",
    "unallowlistedProcessExecDenied", "forbiddenMissingXmlReadsDenied", "defaultDeny",
    "readAllowlist", "sessionOnlyWrites", "globalTemporaryWritesDenied",
    "arbitraryHostReadsDenied", "replayAuthorityWritesDenied",
  ], "profile sandbox");
  invariant(manifest.sandbox?.executable === "/usr/bin/sandbox-exec"
    && manifest.sandbox?.noEgressPolicyDeclared === true
    && manifest.sandbox?.liveNoEgressVerified === false
    && manifest.sandbox?.appleEventsDenied === true
    && manifest.sandbox?.hostTreeWritesDenied === true
    && manifest.sandbox?.unallowlistedProcessExecDenied === true
    && manifest.sandbox?.forbiddenMissingXmlReadsDenied === true
    && manifest.sandbox?.defaultDeny === true
    && Array.isArray(manifest.sandbox?.readAllowlist)
    && manifest.sandbox.readAllowlist.length >= 1
    && Array.isArray(manifest.sandbox?.sessionOnlyWrites)
    && manifest.sandbox.sessionOnlyWrites.length === RUNTIME_WRITABLE_RELATIVES.length
    && manifest.sandbox?.globalTemporaryWritesDenied === true
    && manifest.sandbox?.arbitraryHostReadsDenied === true
    && manifest.sandbox?.replayAuthorityWritesDenied === true
    && manifest.sandbox.policy.startsWith("(version 1)\n(deny default)\n")
    && !manifest.sandbox.policy.includes("(allow default)")
    && !manifest.sandbox.policy.includes('(subpath "/private/tmp")')
    && !manifest.sandbox.policy.includes('(subpath "/private/var/folders")')
    && HASH.test(manifest.sandbox?.sha256 || ""),
  "sandbox contract drifted");
  assertExactKeys(manifest.authorityState, [
    "replayLockRoot", "materializedByProfileArtifact", "runtimeWritable",
    "externalAuthorityRequired", "disjointFromSessionRoot",
  ], "profile authority state");
  invariant(path.isAbsolute(manifest.authorityState?.replayLockRoot || "")
    && !isContained(manifest.sessionRoot, manifest.authorityState.replayLockRoot)
    && !isContained(manifest.authorityState.replayLockRoot, manifest.sessionRoot)
    && manifest.authorityState.materializedByProfileArtifact === false
    && manifest.authorityState.runtimeWritable === false
    && manifest.authorityState.externalAuthorityRequired === true
    && manifest.authorityState.disjointFromSessionRoot === true
    && manifest.sandbox.policy.includes(
      `(deny file-read* file-write* (subpath ${sbplLiteral(manifest.authorityState.replayLockRoot)}))`,
    ),
  "authority-state isolation contract drifted");
  assertExactKeys(manifest.emptyStores, [
    "sharedObjects", "frames", "audio", "logs", "requestAudit",
  ], "profile empty stores");
  assertExactKeys(manifest.preflightContract, [
    "mustRunAfterAuthorizationVerificationAndBeforeAuthorizationConsumption", "capacity",
    "codesign", "processAbsence", "network", "resourceRequests", "profileEmptiness",
  ], "profile preflight contract");
  assertExactKeys(manifest.preflightContract.capacity,
    ["path", "minimumFreeBytes", "mustRunImmediatelyBeforeLaunch"],
    "profile capacity preflight");
  assertExactKeys(manifest.preflightContract.codesign,
    ["command", "expectedExecutableSha256", "successRequired"],
    "profile codesign preflight");
  assertExactKeys(manifest.preflightContract.processAbsence, [
    "command", "freshProjectorProcessRequired", "freshAnimateProcessRequiredForAnimateSessions",
    "mustNotSignalExistingProcesses", "protectedDoNotSignalPids", "protectedPidIdentityVerified",
    "protectedPidMayBeStaleOrReused",
  ], "profile process-absence preflight");
  assertExactKeys(manifest.preflightContract.network, [
    "sandboxNoEgressPolicyHashRevalidationRequired",
    "liveNoEgressVerificationRequiredImmediatelyBeforeLaunch",
    "liveNoEgressVerifiedByProfileArtifact", "lsofCommandTemplate", "nettopCommandTemplate",
    "successfulOutboundConnectionsAllowed",
  ], "profile network preflight");
  assertExactKeys(manifest.preflightContract.resourceRequests, [
    "observerCommandTemplate", "allowedPaths", "forbiddenRequests", "abortOnForbiddenMissingXml",
    "abortOnUnallowlistedLocalResource", "observerMustRemainLiveForWholeProcess",
  ], "profile resource-request preflight");
  const expectedReadAllowlist = manifest.preflightContract.resourceRequests.allowedPaths.map((relativePath) =>
    path.join(manifest.hostTree.root, relativePath));
  const expectedSessionWrites = RUNTIME_WRITABLE_RELATIVES.map((relativePath) =>
    path.join(manifest.profileRoot, relativePath));
  invariant(JSON.stringify(manifest.sandbox.readAllowlist) === JSON.stringify(expectedReadAllowlist)
    && JSON.stringify(manifest.sandbox.sessionOnlyWrites) === JSON.stringify(expectedSessionWrites)
    && manifest.sandbox.readAllowlist.every((value) => path.isAbsolute(value)
      && isContained(manifest.hostTree.root, value) && value !== manifest.hostTree.root)
    && manifest.sandbox.sessionOnlyWrites.every((value) => path.isAbsolute(value)
      && isContained(manifest.sessionRoot, value)
      && !isContained(value, manifest.authorityState.replayLockRoot))
    && manifest.sandbox.bytes === Buffer.byteLength(manifest.sandbox.policy)
    && manifest.sandbox.sha256 === sha256Bytes(Buffer.from(manifest.sandbox.policy))
    && !manifest.sandbox.policy.includes(
      `(allow file-read* (subpath ${sbplLiteral(manifest.hostTree.root)}))`,
    )
    && !manifest.sandbox.policy.includes(
      `(allow file-read* file-write* (subpath ${sbplLiteral(manifest.sessionRoot)}))`,
    ),
  "sandbox exact-read/session-write allowlists drifted");
  assertExactKeys(manifest.preflightContract.profileEmptiness,
    ["requiredEmptyPaths", "emptyImmediatelyBeforeLaunchRequired"],
    "profile emptiness preflight");
  invariant(manifest.preflightContract?.capacity?.minimumFreeBytes === G5_L4_MINIMUM_SESSION_FREE_BYTES
    && manifest.preflightContract?.capacity?.mustRunImmediatelyBeforeLaunch === true
    && manifest.preflightContract?.codesign?.command?.join(" ") ===
      `/usr/bin/codesign --verify --deep --strict ${manifest.projector.path}`
    && manifest.preflightContract?.processAbsence?.freshProjectorProcessRequired === true
    && manifest.preflightContract?.processAbsence?.mustNotSignalExistingProcesses === true
    && JSON.stringify(manifest.preflightContract?.processAbsence?.protectedDoNotSignalPids) ===
      JSON.stringify(G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS)
    && manifest.preflightContract?.processAbsence?.protectedPidIdentityVerified === false
    && manifest.preflightContract?.processAbsence?.protectedPidMayBeStaleOrReused === true
    && manifest.preflightContract?.network?.sandboxNoEgressPolicyHashRevalidationRequired === true
    && manifest.preflightContract?.network?.liveNoEgressVerificationRequiredImmediatelyBeforeLaunch === true
    && manifest.preflightContract?.network?.liveNoEgressVerifiedByProfileArtifact === false
    && manifest.preflightContract?.network?.successfulOutboundConnectionsAllowed === 0
    && manifest.preflightContract?.resourceRequests?.abortOnForbiddenMissingXml === true,
  "preflight contract drifted");
  assertExactKeys(manifest.postflightContract, [
    "completeProjectorExitRequired", "successfulOutboundConnectionsAllowed",
    "persistentSharedObjectsAllowed", "sourceAndTreeRehashRequired", "codesignRecheckRequired",
    "capacityRecheckRequired", "forbiddenRequestCountAllowed", "unallowlistedRequestCountAllowed",
    "profilePreservedUntilCandidateAuditCompletes", "acceptancePromotionByPostflight",
  ], "profile postflight contract");
  invariant(manifest.postflightContract?.completeProjectorExitRequired === true
    && manifest.postflightContract?.successfulOutboundConnectionsAllowed === 0
    && manifest.postflightContract?.persistentSharedObjectsAllowed === 0
    && manifest.postflightContract?.sourceAndTreeRehashRequired === true
    && manifest.postflightContract?.codesignRecheckRequired === true
    && manifest.postflightContract?.capacityRecheckRequired === true
    && manifest.postflightContract?.forbiddenRequestCountAllowed === 0,
  "postflight contract drifted");
  assertExactKeys(manifest.executionGate, [
    "runtimeAuthorized", "projectorLaunched", "runtimeSessionExecuted",
    "immutableOneTimeAuthorizationConsumed", "runnableByThisArtifactAlone",
  ], "profile execution gate");
  assertExactKeys(manifest.acceptanceEffects, [
    "authoritativeOriginalRuntime", "audioAccepted", "humanVisualAccepted", "ownerAccepted",
    "strictComplete", "published",
  ], "profile acceptance effects");
  invariant(manifest.executionGate?.runtimeAuthorized === false
    && manifest.executionGate?.projectorLaunched === false
    && manifest.executionGate?.runtimeSessionExecuted === false
    && manifest.executionGate?.immutableOneTimeAuthorizationConsumed === false
    && manifest.executionGate?.runnableByThisArtifactAlone === false
    && Object.values(manifest.acceptanceEffects || {}).every((value) => value === false),
  "profile manifest improperly claims execution or acceptance");
  const {manifestFingerprintSha256, ...withoutFingerprint} = manifest;
  invariant(HASH.test(manifestFingerprintSha256 || "")
    && manifestFingerprintSha256 === sha256Bytes(Buffer.from(stableJson(withoutFingerprint))),
  "profile manifest fingerprint drifted");
  return manifest;
}

async function bindHostTree({projectRoot, hostTreeRoot}) {
  const plan = await buildG5L4HostTreePlan({projectRoot, outputRoot: hostTreeRoot});
  const verified = await verifyG5L4HostTree(plan);
  const manifestBytes = await readFile(path.join(hostTreeRoot, G5_L4_HOST_TREE_MANIFEST_NAME));
  return {
    plan,
    verified,
    manifestSha256: sha256Bytes(manifestBytes),
    fileSetSha256: plan.manifest.fileSetSha256,
  };
}

export async function buildG5L4DisposableProfilePlan({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  language,
  sessionId,
  sessionRoot: sessionRootOption = null,
  hostTreeRoot: hostTreeRootOption = DEFAULT_G5_L4_HOST_TREE_ROOT,
  projectorExecutable = G5_L4_PROJECTOR_EXECUTABLE,
  expectedProjectorSha256 = G5_L4_PROJECTOR_SHA256,
  authorityReplayLockRoot: authorityReplayLockRootOption = null,
  currentHome = os.homedir(),
} = {}) {
  invariant(["en", "es"].includes(language), "language must be en or es");
  invariant(G5_L4_SESSION_ID_PATTERN.test(sessionId || "")
    && sessionId.startsWith(`g5-l4-shell-rw002-${language}-`),
  "sessionId must be a language-bound G5 L4 UUID session ID");
  invariant(HASH.test(expectedProjectorSha256 || ""), "expected Projector SHA-256 is invalid");
  const projectRoot = path.resolve(projectRootOption);
  const hostTreeRoot = path.resolve(hostTreeRootOption);
  const sessionRoot = path.resolve(sessionRootOption || path.join(
    projectRoot,
    "artifacts/full-frame/g5-l4/runtime-sessions",
    sessionId,
  ));
  const authorityReplayLockRoot = path.resolve(authorityReplayLockRootOption || path.join(
    path.dirname(sessionRoot),
    ".g5-l4-authorization-state",
    sessionId,
    "replay-locks",
  ));
  invariant(!isContained(hostTreeRoot, sessionRoot) && !isContained(sessionRoot, hostTreeRoot),
    "session root and read-only host tree must be disjoint");
  invariant(!isContained(sessionRoot, authorityReplayLockRoot)
    && !isContained(authorityReplayLockRoot, sessionRoot)
    && !isContained(hostTreeRoot, authorityReplayLockRoot)
    && !isContained(authorityReplayLockRoot, hostTreeRoot),
  "authority replay-lock root must be disjoint from runtime-writable and read-only host-tree roots");
  const [hostTree, projector] = await Promise.all([
    bindHostTree({projectRoot, hostTreeRoot}),
    stableRegularFile(projectorExecutable, "Adobe Projector", {executable: true}),
  ]);
  invariant(projector.sha256 === expectedProjectorSha256, "Adobe Projector SHA-256 drifted");
  const profileRoot = path.join(sessionRoot, "runtime-profile");
  const sandboxPath = path.join(profileRoot, "sandbox.sb");
  const readAllowlist = hostTree.plan.manifest.requestPolicy.allowedPaths.map((relativePath) =>
    path.join(hostTreeRoot, relativePath));
  const sessionOnlyWrites = RUNTIME_WRITABLE_RELATIVES.map((relativePath) =>
    path.join(profileRoot, relativePath));
  const sandboxPolicy = renderG5L4SandboxProfile({
    projectorExecutable,
    hostTreeRoot,
    sessionRoot,
    replayLockRoot: authorityReplayLockRoot,
    allowedPaths: hostTree.plan.manifest.requestPolicy.allowedPaths,
    currentHome,
  });
  const base = {
    schemaVersion: 1,
    manifestType: "g5-l4-shell-rw002-disposable-runtime-profile",
    releaseId: "lesson-g05-l04-number-lines",
    targetAnimationId: "course-g05-l04-rw-002",
    language,
    sessionId,
    status: "empty-profile-candidate-not-authorized-not-launched",
    sessionRoot,
    profileRoot,
    languageIsolation: {
      profileReuseAcrossLanguagesForbidden: true,
      freshProcessRequired: true,
      separateMutableProfilePerLanguage: true,
    },
    accountIsolation: {
      mode: "same-account-separate-disposable-process-profile",
      environment: profileEnvironment(profileRoot),
      userCreationOrDeletionRequired: false,
    },
    hostTree: {
      root: hostTreeRoot,
      manifestPath: hostTree.verified.manifestPath,
      manifestSha256: hostTree.manifestSha256,
      fileSetSha256: hostTree.fileSetSha256,
      readOnlyVerified: true,
      exactAllowlistVerified: true,
      sourceGapExceptionPreserved: true,
    },
    projector: {
      ...projector,
      expectedSha256: expectedProjectorSha256,
      commandLineSwfArgumentForbidden: true,
      startsEmpty: true,
    },
    sandbox: {
      executable: "/usr/bin/sandbox-exec",
      path: sandboxPath,
      bytes: Buffer.byteLength(sandboxPolicy),
      sha256: sha256Bytes(Buffer.from(sandboxPolicy)),
      policy: sandboxPolicy,
      noEgressPolicyDeclared: true,
      liveNoEgressVerified: false,
      appleEventsDenied: true,
      hostTreeWritesDenied: true,
      unallowlistedProcessExecDenied: true,
      forbiddenMissingXmlReadsDenied: true,
      defaultDeny: true,
      readAllowlist,
      sessionOnlyWrites,
      globalTemporaryWritesDenied: true,
      arbitraryHostReadsDenied: true,
      replayAuthorityWritesDenied: true,
    },
    authorityState: {
      replayLockRoot: authorityReplayLockRoot,
      materializedByProfileArtifact: false,
      runtimeWritable: false,
      externalAuthorityRequired: true,
      disjointFromSessionRoot: true,
    },
    emptyStores: {
      sharedObjects: path.join(profileRoot, "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects"),
      frames: path.join(profileRoot, "evidence/frames"),
      audio: path.join(profileRoot, "evidence/audio"),
      logs: path.join(profileRoot, "evidence/logs"),
      requestAudit: path.join(profileRoot, "evidence/resource-requests"),
    },
    preflightContract: {
      mustRunAfterAuthorizationVerificationAndBeforeAuthorizationConsumption: true,
      capacity: {
        path: sessionRoot,
        minimumFreeBytes: G5_L4_MINIMUM_SESSION_FREE_BYTES,
        mustRunImmediatelyBeforeLaunch: true,
      },
      codesign: {
        command: ["/usr/bin/codesign", "--verify", "--deep", "--strict", projectorExecutable],
        expectedExecutableSha256: expectedProjectorSha256,
        successRequired: true,
      },
      processAbsence: {
        command: ["/bin/ps", "-axo", "pid=,ppid=,lstart=,command="],
        freshProjectorProcessRequired: true,
        freshAnimateProcessRequiredForAnimateSessions: true,
        mustNotSignalExistingProcesses: true,
        protectedDoNotSignalPids: [...G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS],
        protectedPidIdentityVerified: false,
        protectedPidMayBeStaleOrReused: true,
      },
      network: {
        sandboxNoEgressPolicyHashRevalidationRequired: true,
        liveNoEgressVerificationRequiredImmediatelyBeforeLaunch: true,
        liveNoEgressVerifiedByProfileArtifact: false,
        lsofCommandTemplate: ["/usr/sbin/lsof", "-nP", "-a", "-p", "<fresh-pid>", "-i"],
        nettopCommandTemplate: ["/usr/bin/nettop", "-n", "-x", "-L", "0", "-p", "<fresh-pid>"],
        successfulOutboundConnectionsAllowed: 0,
      },
      resourceRequests: {
        observerCommandTemplate: ["/usr/bin/fs_usage", "-w", "-f", "filesys", "-p", "<fresh-pid>"],
        allowedPaths: hostTree.plan.manifest.requestPolicy.allowedPaths,
        forbiddenRequests: [...G5_L4_FORBIDDEN_RUNTIME_REQUESTS],
        abortOnForbiddenMissingXml: true,
        abortOnUnallowlistedLocalResource: true,
        observerMustRemainLiveForWholeProcess: true,
      },
      profileEmptiness: {
        requiredEmptyPaths: Object.values({
          ...{
            sharedObjects: path.join(profileRoot, "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects"),
            frames: path.join(profileRoot, "evidence/frames"),
            audio: path.join(profileRoot, "evidence/audio"),
            logs: path.join(profileRoot, "evidence/logs"),
            requestAudit: path.join(profileRoot, "evidence/resource-requests"),
          },
        }),
        emptyImmediatelyBeforeLaunchRequired: true,
      },
    },
    postflightContract: {
      completeProjectorExitRequired: true,
      successfulOutboundConnectionsAllowed: 0,
      persistentSharedObjectsAllowed: 0,
      sourceAndTreeRehashRequired: true,
      codesignRecheckRequired: true,
      capacityRecheckRequired: true,
      forbiddenRequestCountAllowed: 0,
      unallowlistedRequestCountAllowed: 0,
      profilePreservedUntilCandidateAuditCompletes: true,
      acceptancePromotionByPostflight: false,
    },
    executionGate: {
      runtimeAuthorized: false,
      projectorLaunched: false,
      runtimeSessionExecuted: false,
      immutableOneTimeAuthorizationConsumed: false,
      runnableByThisArtifactAlone: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  const manifest = {
    ...base,
    manifestFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base))),
  };
  validateG5L4DisposableProfileManifest(manifest);
  return {projectRoot, sessionRoot, profileRoot, sandboxPath, sandboxPolicy, manifest};
}

async function walkTree(root) {
  const files = [];
  const directories = [];
  async function visit(directory, relative = "") {
    const info = await lstat(directory);
    invariant(info.isDirectory() && !info.isSymbolicLink(), `${relative || "."}: expected a real directory`);
    directories.push({path: portable(relative), absolutePath: directory, mode: info.mode & 0o777});
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const child = path.join(directory, entry.name);
      const childRelative = portable(path.join(relative, entry.name));
      const childInfo = await lstat(child);
      invariant(!childInfo.isSymbolicLink(), `${childRelative}: symbolic links are forbidden`);
      if (childInfo.isDirectory()) await visit(child, childRelative);
      else {
        invariant(childInfo.isFile() && childInfo.nlink === 1, `${childRelative}: expected one ordinary file`);
        files.push({path: childRelative, absolutePath: child, mode: childInfo.mode & 0o777});
      }
    }
  }
  await visit(root);
  return {files, directories};
}

async function assertEmpty(directory, label) {
  invariant((await readdir(directory)).length === 0, `${label} must remain empty`);
}

export async function verifyG5L4DisposableProfile(
  plan,
  {physicalSessionRoot: physicalSessionRootOption = plan.sessionRoot} = {},
) {
  const physicalSessionRoot = path.resolve(physicalSessionRootOption);
  await assertRealDirectoryAncestors(physicalSessionRoot);
  const tree = await walkTree(physicalSessionRoot);
  const expectedFiles = ["profile-manifest.json", "runtime-profile/sandbox.sb"];
  invariant(JSON.stringify(tree.files.map(({path: file}) => file).sort()) === JSON.stringify(expectedFiles.sort()),
    "profile contains an unexpected file");
  invariant(tree.directories.every(({mode}) => mode === 0o700), "profile directories must remain 0700");
  invariant(tree.files.every(({mode}) => mode === 0o400), "profile files must remain 0400");
  const manifestBytes = await readFile(path.join(physicalSessionRoot, "profile-manifest.json"));
  const manifest = validateG5L4DisposableProfileManifest(JSON.parse(manifestBytes));
  invariant(manifestBytes.equals(Buffer.from(stableJson(plan.manifest))), "profile manifest bytes drifted");
  const sandbox = await readFile(path.join(physicalSessionRoot, "runtime-profile/sandbox.sb"));
  invariant(sandbox.toString("utf8") === plan.sandboxPolicy
    && sha256Bytes(sandbox) === manifest.sandbox.sha256,
  "sandbox policy bytes drifted");
  for (const declaredEmptyPath of Object.values(manifest.emptyStores)) {
    invariant(isContained(plan.sessionRoot, declaredEmptyPath),
      `declared empty store escapes the final session root: ${declaredEmptyPath}`);
    const physicalEmptyPath = path.join(
      physicalSessionRoot,
      path.relative(plan.sessionRoot, declaredEmptyPath),
    );
    await assertEmpty(physicalEmptyPath, declaredEmptyPath);
  }
  return {
    status: "verified-empty-profile-candidate-not-launched",
    sessionId: manifest.sessionId,
    language: manifest.language,
    manifestPath: path.join(physicalSessionRoot, "profile-manifest.json"),
    manifestSha256: sha256Bytes(manifestBytes),
    sandboxSha256: manifest.sandbox.sha256,
    projectorLaunched: false,
    runtimeSessionExecuted: false,
    acceptanceEffect: "none",
  };
}

export async function prepareG5L4DisposableProfile(options = {}) {
  const plan = await buildG5L4DisposableProfilePlan(options);
  const existing = await lstat(plan.sessionRoot).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) {
    invariant(existing.isDirectory() && !existing.isSymbolicLink(), "existing session root is not a real directory");
    return {...await verifyG5L4DisposableProfile(plan), changed: 0};
  }
  invariant(options.check !== true, `disposable profile is missing: ${plan.sessionRoot}`);
  const parent = path.dirname(plan.sessionRoot);
  await ensureRealDirectoryPathFromNearestExistingAncestor(parent);
  const temporary = await mkdtemp(path.join(parent, ".g5-l4-profile-"));
  try {
    const temporaryProfile = path.join(temporary, "runtime-profile");
    for (const directory of PROFILE_DIRECTORIES) {
      await mkdir(path.join(temporaryProfile, directory), {recursive: true, mode: 0o700});
    }
    await writeFile(path.join(temporaryProfile, "sandbox.sb"), plan.sandboxPolicy, {flag: "wx", mode: 0o400});
    await writeFile(path.join(temporary, "profile-manifest.json"), stableJson(plan.manifest), {flag: "wx", mode: 0o400});
    await verifyG5L4DisposableProfile(plan, {physicalSessionRoot: temporary});
    await atomicPublishDirectoryNoReplace({
      temporaryPath: temporary,
      targetPath: plan.sessionRoot,
      beforePublishHook: options.beforePublishHook,
    });
  } catch (error) {
    throw new Error(
      `${error.message}; staged profile was deliberately preserved because pathname-safe recursive cleanup is outside this transaction`,
      {cause: error},
    );
  }
  return {...await verifyG5L4DisposableProfile(plan), changed: 1};
}

export async function liveCapacitySnapshot(targetPath) {
  const stats = await statfs(targetPath);
  const freeBytes = Number(stats.bavail) * Number(stats.bsize);
  invariant(Number.isSafeInteger(freeBytes) && freeBytes >= 0, "capacity result is not a safe byte count");
  return {
    path: targetPath,
    freeBytes,
    minimumFreeBytes: G5_L4_MINIMUM_SESSION_FREE_BYTES,
    sufficient: freeBytes >= G5_L4_MINIMUM_SESSION_FREE_BYTES,
  };
}

export function parseArguments(argv) {
  const options = {check: false, language: null, sessionId: null, sessionRoot: null, hostTreeRoot: DEFAULT_G5_L4_HOST_TREE_ROOT};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--language") options.language = argv[++index];
    else if (value === "--session-id") options.sessionId = argv[++index];
    else if (value === "--session-root") options.sessionRoot = path.resolve(argv[++index] || "");
    else if (value === "--host-tree-root") options.hostTreeRoot = path.resolve(argv[++index] || "");
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help) {
    invariant(["en", "es"].includes(options.language), "--language en|es is required");
    invariant(G5_L4_SESSION_ID_PATTERN.test(options.sessionId || ""), "--session-id is required and must match the G5 L4 UUID contract");
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs --language en|es --session-id <g5-l4-shell-rw002-lang-uuid> [--session-root path] [--host-tree-root path] [--check]\n");
    return;
  }
  process.stdout.write(stableJson(await prepareG5L4DisposableProfile(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
