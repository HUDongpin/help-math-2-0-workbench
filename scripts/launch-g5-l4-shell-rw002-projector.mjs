#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {access, lstat, open, readdir, realpath, statfs} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  G5_L4_FORBIDDEN_RUNTIME_REQUESTS,
  G5_L4_HOST_TREE_MANIFEST_NAME,
  G5_L4_TRACE_SCOPED_RESOURCES,
  buildG5L4HostTreePlan,
  sha256Bytes,
  stableJson,
  validateG5L4HostTreeManifest,
  verifyG5L4HostTree,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";
import {
  G5_L4_MINIMUM_SESSION_FREE_BYTES,
  G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS,
  profileEnvironment,
  validateG5L4DisposableProfileManifest,
} from "./prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";
import {
  g5L4HostIdSha256,
  verifyG5L4PerSessionAuthorization,
} from "./lib/g5-l4-per-session-authorization-consumer.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ROOT = path.join(ROOT, "source-assets/flash/HELP MATH_ORIGINAL FILES");
const RW002_SOURCE_PATH = "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf";
const RW002_SOURCE_SHA256 = "eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c";
const ACTION_ID = "projector.shell-rw002-natural-trace";
const ALLOWED_ACTION_IDS = Object.freeze([
  "projector.empty-start",
  "projector.file-open-exact-shell",
  "shell.navigate-ir-next-rw002",
  "projector.replay",
  "projector.exit",
]);
const HASH = /^[a-f0-9]{64}$/u;
const CONTAINMENT_RECEIPT_OPTIONS = Object.freeze([
  Object.freeze({key: "approvalManifest", pathOption: "approvalManifestPath", shaOption: "approvalManifestSha256", cli: "approval-manifest"}),
  Object.freeze({key: "liveNoEgressPreflight", pathOption: "liveNoEgressPreflightPath", shaOption: "liveNoEgressPreflightSha256", cli: "live-no-egress-preflight"}),
  Object.freeze({key: "liveCapacityPreflight", pathOption: "liveCapacityPreflightPath", shaOption: "liveCapacityPreflightSha256", cli: "live-capacity-preflight"}),
  Object.freeze({key: "liveCodesignPreflight", pathOption: "liveCodesignPreflightPath", shaOption: "liveCodesignPreflightSha256", cli: "live-codesign-preflight"}),
]);
export const G5_L4_PROJECTOR_EXECUTION_ENABLED = false;
export const G5_L4_PROJECTOR_EXECUTION_DISABLED_CODE =
  "G5_L4_PROJECTOR_OBSERVER_SUPERVISOR_NOT_IMPLEMENTED";

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 Projector successor: ${message}`);
}

async function bindFile(file, label, {readOnly = false, executable = false} = {}) {
  invariant(typeof file === "string" && path.isAbsolute(file), `${label} path must be absolute`);
  const before = await lstat(file, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label} must be one ordinary non-linked file`);
  if (readOnly) invariant((before.mode & 0o222n) === 0n, `${label} must be read-only`);
  if (executable) invariant((before.mode & 0o111n) !== 0n, `${label} must be executable`);
  invariant(await realpath(file) === file, `${label} may not resolve through symbolic links`);
  const handle = await open(file, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let contents;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(descriptorBefore.isFile() && descriptorBefore.nlink === 1n
      && descriptorBefore.dev === before.dev && descriptorBefore.ino === before.ino,
    `${label} path changed before its descriptor was pinned`);
    contents = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  invariant(descriptorAfter.dev === descriptorBefore.dev && descriptorAfter.ino === descriptorBefore.ino
    && descriptorAfter.size === BigInt(contents.length) && descriptorAfter.mtimeNs === descriptorBefore.mtimeNs,
  `${label} descriptor changed while read`);
  const after = await lstat(file, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() && after.dev === descriptorBefore.dev
    && after.ino === descriptorBefore.ino && after.size === BigInt(contents.length)
    && after.mtimeNs === descriptorBefore.mtimeNs && await realpath(file) === file,
  `${label} path changed while its pinned descriptor was read`);
  return {
    path: file,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
    identity: Object.freeze({device: after.dev.toString(), inode: after.ino.toString()}),
  };
}

async function defaultRunCommand(executable, args, options = {}) {
  try {
    const result = await execFile(executable, args, {encoding: "utf8", timeout: 15_000, ...options});
    return {exitCode: 0, stdout: result.stdout, stderr: result.stderr};
  } catch (error) {
    return {
      exitCode: Number.isInteger(error.code) ? error.code : null,
      signal: error.signal ?? null,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message ?? "",
    };
  }
}

export async function currentExactHostIdentifier({runCommand = defaultRunCommand} = {}) {
  const result = await runCommand("/usr/sbin/ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"]);
  invariant(result.exitCode === 0, `cannot read current host identity: ${result.stderr}`);
  const match = result.stdout.match(/"IOPlatformUUID"\s*=\s*"([0-9A-Fa-f-]{36})"/u);
  invariant(match, "IOPlatformUUID is unavailable");
  return `IOPlatformUUID:${match[1].toUpperCase()}`;
}

function parsePinnedJson(binding, label) {
  try {
    return JSON.parse(binding.contents.toString("utf8"));
  } catch (error) {
    throw new Error(`G5 L4 Projector successor: ${label} JSON is invalid: ${error.message}`);
  }
}

export async function verifyG5L4FullHostTreeBinding({profileManifest, expectedManifestSha256 = null}) {
  const hostTreeRoot = profileManifest.hostTree.root;
  const hostManifestPath = profileManifest.hostTree.manifestPath;
  invariant(hostManifestPath === path.join(hostTreeRoot, G5_L4_HOST_TREE_MANIFEST_NAME),
    "profile host-tree manifest path escapes or differs from the exact host-tree root");
  const manifestBefore = await bindFile(hostManifestPath, "host-tree manifest", {readOnly: true});
  if (expectedManifestSha256 !== null) {
    invariant(manifestBefore.sha256 === expectedManifestSha256,
      "host-tree manifest differs from the signed expected binding");
  }
  const hostManifest = validateG5L4HostTreeManifest(parsePinnedJson(manifestBefore, "host-tree manifest"));
  invariant(manifestBefore.sha256 === profileManifest.hostTree.manifestSha256
    && hostManifest.fileSetSha256 === profileManifest.hostTree.fileSetSha256,
  "profile/host-tree manifest binding drifted");
  const hostPlan = await buildG5L4HostTreePlan({projectRoot: ROOT, outputRoot: hostTreeRoot});
  const verified = await verifyG5L4HostTree(hostPlan);
  invariant(verified.files === G5_L4_TRACE_SCOPED_RESOURCES.length
    && verified.manifestSha256 === manifestBefore.sha256
    && verified.fileSetSha256 === hostManifest.fileSetSha256,
  "full host-tree verification differs from the pinned manifest");
  for (const expected of G5_L4_TRACE_SCOPED_RESOURCES) {
    const resource = await bindFile(path.join(hostTreeRoot, expected.path), `host resource ${expected.path}`, {readOnly: true});
    invariant(resource.bytes === expected.bytes && resource.sha256 === expected.sha256,
      `${expected.path}: pinned host resource bytes drifted`);
  }
  const manifestAfter = await bindFile(hostManifestPath, "host-tree manifest", {readOnly: true});
  invariant(manifestAfter.sha256 === manifestBefore.sha256
    && manifestAfter.identity.device === manifestBefore.identity.device
    && manifestAfter.identity.inode === manifestBefore.identity.inode,
  "host-tree manifest changed while all seven resources were rehashed");
  return {manifestBinding: manifestBefore, manifest: hostManifest, verified};
}

function expectedAuthorizationBinding({
  language,
  exactHostIdentifier,
  hostManifestPath,
  hostManifestSha256,
  hostManifest,
  profileManifestPath,
  profileManifestSha256,
  profileManifest,
  projector,
  ownerPublicKeyPath,
  ownerPublicKeySha256,
  containment,
}) {
  return {
    purpose: "projector-original-runtime",
    language,
    member: {
      ordinal: 2,
      animationId: "course-g05-l04-rw-002",
      assetId: `swf-${RW002_SOURCE_SHA256}`,
      sourcePath: RW002_SOURCE_PATH,
      sourceAbsolutePath: path.join(SOURCE_ROOT, RW002_SOURCE_PATH),
      sourceSha256: RW002_SOURCE_SHA256,
    },
    host: {
      exactHostIdentifier,
      hostIdSha256: g5L4HostIdSha256(exactHostIdentifier),
    },
    hostTree: {
      manifestPath: hostManifestPath,
      manifestSha256: hostManifestSha256,
      fileSetSha256: hostManifest.fileSetSha256,
    },
    profile: {
      manifestPath: profileManifestPath,
      manifestSha256: profileManifestSha256,
      sessionRoot: profileManifest.sessionRoot,
    },
    tool: {
      kind: "adobe-projector",
      path: projector.path,
      sha256: projector.sha256,
    },
    actionId: ACTION_ID,
    allowedActionIds: [...ALLOWED_ACTION_IDS],
    ownerPublicKeyPath,
    ownerPublicKeySha256,
    replayLockRoot: profileManifest.authorityState.replayLockRoot,
    containment: Object.fromEntries(CONTAINMENT_RECEIPT_OPTIONS.map(({key}) => [key, {...containment[key]}])),
  };
}

export async function buildG5L4ProjectorLaunchPlan({
  language,
  profileManifestPath,
  authorizationPath,
  ownerPublicKeyPath,
  ownerPublicKeySha256,
  approvalManifestPath,
  approvalManifestSha256,
  liveNoEgressPreflightPath,
  liveNoEgressPreflightSha256,
  liveCapacityPreflightPath,
  liveCapacityPreflightSha256,
  liveCodesignPreflightPath,
  liveCodesignPreflightSha256,
  exactHostIdentifier: exactHostIdentifierOption = null,
  now = Date.now(),
  runCommand = defaultRunCommand,
} = {}) {
  invariant(["en", "es"].includes(language), "language must be en or es");
  for (const [label, value] of Object.entries({profileManifestPath, authorizationPath, ownerPublicKeyPath})) {
    invariant(typeof value === "string" && path.isAbsolute(value), `${label} must be absolute`);
  }
  invariant(HASH.test(ownerPublicKeySha256 || ""), "owner public-key SHA-256 is required");
  const containment = Object.fromEntries(CONTAINMENT_RECEIPT_OPTIONS.map(({key, pathOption, shaOption}) => {
    const receiptPath = {
      approvalManifestPath,
      liveNoEgressPreflightPath,
      liveCapacityPreflightPath,
      liveCodesignPreflightPath,
    }[pathOption];
    const receiptSha256 = {
      approvalManifestSha256,
      liveNoEgressPreflightSha256,
      liveCapacityPreflightSha256,
      liveCodesignPreflightSha256,
    }[shaOption];
    invariant(typeof receiptPath === "string" && path.isAbsolute(receiptPath) && HASH.test(receiptSha256 || ""),
      `${key} requires an absolute physical receipt path and exact SHA-256`);
    return [key, {path: receiptPath, sha256: receiptSha256}];
  }));
  const profileBinding = await bindFile(profileManifestPath, "profile manifest", {readOnly: true});
  const profileManifest = validateG5L4DisposableProfileManifest(parsePinnedJson(profileBinding, "profile manifest"));
  invariant(profileManifest.language === language, "profile language differs from requested launch language");
  const hostVerification = await verifyG5L4FullHostTreeBinding({profileManifest});
  const hostManifestPath = profileManifest.hostTree.manifestPath;
  const hostBinding = hostVerification.manifestBinding;
  const hostManifest = hostVerification.manifest;
  const projector = await bindFile(profileManifest.projector.path, "Adobe Projector", {executable: true});
  invariant(projector.sha256 === profileManifest.projector.sha256, "Projector/profile binding drifted");
  const exactHostIdentifier = exactHostIdentifierOption || await currentExactHostIdentifier({runCommand});
  const expected = expectedAuthorizationBinding({
    language,
    exactHostIdentifier,
    hostManifestPath,
    hostManifestSha256: hostBinding.sha256,
    hostManifest,
    profileManifestPath,
    profileManifestSha256: profileBinding.sha256,
    profileManifest,
    projector,
    ownerPublicKeyPath,
    ownerPublicKeySha256,
    containment,
  });
  const authorization = await verifyG5L4PerSessionAuthorization({authorizationPath, expected, now});
  const shell = hostManifest.files.find(({role}) => role === "lesson-shell");
  const plan = {
    schemaVersion: 1,
    planType: "g5-l4-shell-rw002-hash-authorized-empty-projector-launch-plan",
    status: "authorization-verified-not-consumed-not-launched",
    diagnosticOnly: true,
    executionAvailable: false,
    releaseId: "lesson-g05-l04-number-lines",
    targetAnimationId: "course-g05-l04-rw-002",
    language,
    sessionId: authorization.sessionId,
    operator: {
      roleId: "authorized-original-runtime-operator",
      fullName: "Dr. Peter Hu",
      automationMayPerformHumanActions: false,
    },
    authorization: {
      path: authorizationPath,
      sha256: authorization.authorizationSha256,
      ownerSignatureVerified: true,
      oneTimeUseRequired: true,
      consumed: false,
      expiresAt: authorization.expiresAt,
    },
    expectedAuthorizationBinding: expected,
    profileManifest,
    hostManifest,
    executable: projector.path,
    sandboxExecutable: "/usr/bin/sandbox-exec",
    arguments: ["-f", profileManifest.sandbox.path, projector.path],
    workingDirectory: profileManifest.hostTree.root,
    environment: profileEnvironment(profileManifest.profileRoot),
    launchBoundary: {
      projectorStartsEmpty: true,
      commandLineSwfArgumentUsed: false,
      shellOpenedByLauncher: false,
      directChildSwfOpenForbidden: true,
      humanFileOpenRequired: true,
      exactShellPath: path.join(profileManifest.hostTree.root, shell.path),
      exactShellSha256: shell.sha256,
      naturalNavigationRequired: ["Shell", "IR/L4RW01.swf", "Next", "RW/L4RW02.swf"],
      replayMustBeHumanOperatedAndObserved: true,
      flashRuntimeDependencyReadAllowlistComplete: false,
      runtimeRunnable: false,
    },
    observers: {
      processScopedNetwork: ["/usr/sbin/lsof", "/usr/bin/nettop"],
      processScopedResourceRequests: "/usr/bin/fs_usage",
      forbiddenRequests: [...G5_L4_FORBIDDEN_RUNTIME_REQUESTS],
      exactAllowedPaths: hostManifest.requestPolicy.allowedPaths,
      exactPathBoundaryRequired: true,
      outsideHostRequestsForbidden: true,
      observerFailureIsStopCondition: true,
    },
    executionGate: {
      livePreflightPassed: false,
      authorizationConsumed: false,
      projectorLaunched: false,
      runtimeSessionExecuted: false,
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
  return validateG5L4ProjectorLaunchPlan(plan);
}

export function validateG5L4ProjectorLaunchPlan(plan) {
  invariant(plan?.schemaVersion === 1
    && plan.planType === "g5-l4-shell-rw002-hash-authorized-empty-projector-launch-plan"
    && plan.status === "authorization-verified-not-consumed-not-launched"
    && plan.diagnosticOnly === true
    && plan.executionAvailable === false
    && plan.targetAnimationId === "course-g05-l04-rw-002"
    && ["en", "es"].includes(plan.language),
  "launch plan identity drifted");
  invariant(plan.authorization?.ownerSignatureVerified === true
    && plan.authorization?.oneTimeUseRequired === true
    && plan.authorization?.consumed === false
    && HASH.test(plan.authorization?.sha256 || ""),
  "launch plan lacks verified unconsumed authorization");
  invariant(plan.sandboxExecutable === "/usr/bin/sandbox-exec"
    && plan.arguments?.length === 3 && plan.arguments[0] === "-f"
    && plan.arguments[2] === plan.executable
    && !plan.arguments.some((value) => /\.swf$/iu.test(value)),
  "launch plan must start an empty sandboxed Projector");
  invariant(plan.launchBoundary?.projectorStartsEmpty === true
    && plan.launchBoundary?.commandLineSwfArgumentUsed === false
    && plan.launchBoundary?.shellOpenedByLauncher === false
    && plan.launchBoundary?.directChildSwfOpenForbidden === true
    && plan.launchBoundary?.humanFileOpenRequired === true
    && plan.launchBoundary?.flashRuntimeDependencyReadAllowlistComplete === false
    && plan.launchBoundary?.runtimeRunnable === false
    && plan.launchBoundary?.exactShellPath.endsWith("/HELP_COURSES/ELMGR5/L4/index_local.swf")
    && plan.launchBoundary?.exactShellSha256 === G5_L4_TRACE_SCOPED_RESOURCES[0].sha256,
  "empty Projector/human natural-navigation boundary drifted");
  invariant(JSON.stringify(plan.observers?.forbiddenRequests) === JSON.stringify(G5_L4_FORBIDDEN_RUNTIME_REQUESTS)
    && plan.observers?.exactPathBoundaryRequired === true
    && plan.observers?.outsideHostRequestsForbidden === true
    && plan.observers?.observerFailureIsStopCondition === true,
  "request observer fail-closed boundary drifted");
  invariant(Object.values(plan.executionGate || {}).every((value) => value === false)
    && Object.values(plan.acceptanceEffects || {}).every((value) => value === false),
  "launch plan improperly claims execution or acceptance");
  return plan;
}

export function parseProjectorProcessTable(stdout, executablePath) {
  const rows = [];
  for (const line of String(stdout).split(/\r?\n/u)) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/u);
    if (!match) continue;
    const pid = Number(match[1]);
    const command = match[3];
    if (command.includes(executablePath) || /\/Flash Player(?:\s|$)/u.test(command)) rows.push({pid, command});
  }
  return rows;
}

export function classifyG5L4ResourceAudit(text, {hostTreeRoot, allowedPaths}) {
  invariant(typeof hostTreeRoot === "string" && path.isAbsolute(hostTreeRoot),
    "resource audit host-tree root must be absolute");
  invariant(Array.isArray(allowedPaths) && allowedPaths.length >= 1,
    "resource audit exact allowlist must be non-empty");
  const normalizedHostRoot = path.resolve(hostTreeRoot);
  const lines = String(text).split(/\r?\n/u).filter(Boolean);
  const absoluteAllowed = allowedPaths.map((resource) => {
    invariant(typeof resource === "string" && !path.isAbsolute(resource)
      && resource.split(path.sep).join("/") === path.normalize(resource).split(path.sep).join("/"),
    `resource audit allowlist path is not normalized: ${resource}`);
    const absolute = path.resolve(normalizedHostRoot, resource);
    invariant(absolute !== normalizedHostRoot && isPathContained(normalizedHostRoot, absolute),
      `resource audit allowlist path escapes the host tree: ${resource}`);
    return absolute;
  });
  invariant(new Set(absoluteAllowed).size === absoluteAllowed.length,
    "resource audit exact allowlist contains duplicates");
  const absoluteForbidden = G5_L4_FORBIDDEN_RUNTIME_REQUESTS.map((request) =>
    path.join(normalizedHostRoot, request));

  const forbidden = [];
  const unallowlisted = [];
  const outsideHost = [];
  for (const line of lines) {
    const requestedPath = parseResourceAuditPath(line);
    const hasHostRequest = requestedPath
      ? isPathContained(normalizedHostRoot, requestedPath)
      : hasRootPathOccurrence(line, normalizedHostRoot);
    const exactAllowed = requestedPath
      ? absoluteAllowed.includes(requestedPath)
      : absoluteAllowed.some((allowed) => hasExactPathOccurrence(line, allowed));
    const isForbidden = requestedPath
      ? absoluteForbidden.includes(requestedPath)
        || G5_L4_FORBIDDEN_RUNTIME_REQUESTS.some((request) => path.basename(requestedPath) === path.basename(request))
      : absoluteForbidden.some((request) => hasExactPathOccurrence(line, request))
        || G5_L4_FORBIDDEN_RUNTIME_REQUESTS.some((request) =>
          hasExactPathOccurrence(line, path.basename(request)));
    if (isForbidden) forbidden.push(line);
    if (hasHostRequest && !exactAllowed) unallowlisted.push(line);
    if (requestedPath && !isPathContained(normalizedHostRoot, requestedPath)) outsideHost.push(line);
  }
  return {
    lineCount: lines.length,
    forbiddenRequestCount: forbidden.length,
    unallowlistedRequestCount: unallowlisted.length,
    outsideHostRequestCount: outsideHost.length,
    forbidden,
    unallowlisted,
    outsideHost,
    passed: forbidden.length === 0 && unallowlisted.length === 0 && outsideHost.length === 0,
  };
}

function isPathContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isPathBoundaryCharacter(value) {
  return value === undefined || /[\s'"(),:;=\[\]]/u.test(value);
}

function hasExactPathOccurrence(line, candidate) {
  let from = 0;
  while (from <= line.length) {
    const index = line.indexOf(candidate, from);
    if (index === -1) return false;
    const before = index === 0 ? undefined : line[index - 1];
    const after = line[index + candidate.length];
    if (isPathBoundaryCharacter(before) && isPathBoundaryCharacter(after)) return true;
    from = index + 1;
  }
  return false;
}

function hasRootPathOccurrence(line, root) {
  let from = 0;
  while (from <= line.length) {
    const index = line.indexOf(root, from);
    if (index === -1) return false;
    const before = index === 0 ? undefined : line[index - 1];
    const after = line[index + root.length];
    if (isPathBoundaryCharacter(before) && (after === path.sep || isPathBoundaryCharacter(after))) return true;
    from = index + 1;
  }
  return false;
}

function parseResourceAuditPath(line) {
  const match = String(line).match(/^\s*(?:open|open_nocancel|read|stat|lstat|access)\s+(.+?)\s*$/iu);
  if (!match) return null;
  let value = match[1].trim();
  if ((value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  if (!path.isAbsolute(value) || value.includes("\0")) return null;
  return path.normalize(value);
}

export function renderG5L4LiveNoEgressProbePolicy(plan) {
  validateG5L4ProjectorLaunchPlan(plan);
  const exactProjectorRule = `(allow process-exec (literal ${JSON.stringify(plan.executable)}))`;
  const probeRule = `(allow process-exec (literal ${JSON.stringify("/usr/bin/perl")}))`;
  const policy = plan.profileManifest.sandbox.policy;
  invariant(policy.includes(exactProjectorRule), "sandbox policy lacks the exact Projector process rule");
  invariant(policy.startsWith("(version 1)\n(deny default)\n")
    && plan.profileManifest.sandbox.defaultDeny === true,
  "live probe requires the exact default-deny sandbox candidate");
  const probeRuntimeRules = [
    `(allow file-read* (literal ${JSON.stringify("/usr/bin/perl")})`,
    `  (subpath ${JSON.stringify("/System/Library/Perl")})`,
    `  (subpath ${JSON.stringify("/System/Library/Frameworks")})`,
    `  (subpath ${JSON.stringify("/usr/lib")})`,
    `  (subpath ${JSON.stringify("/Library/Perl")}))`,
    `(allow file-read-data (literal ${JSON.stringify("/")}))`,
    `(allow file-read* file-write* (literal ${JSON.stringify("/dev/null")}))`,
    "(allow sysctl-read)",
    "(allow mach-lookup (global-name \"com.apple.system.opendirectoryd.libinfo\"))",
  ].join("\n");
  const probePolicy = policy.replace(exactProjectorRule, `${probeRule}\n${probeRuntimeRules}`);
  invariant(probePolicy !== policy && !probePolicy.includes(exactProjectorRule),
    "cannot derive the live no-egress probe policy");
  return probePolicy;
}

export async function runG5L4LiveNoEgressProbe(plan, {runCommand = defaultRunCommand} = {}) {
  const probePolicy = renderG5L4LiveNoEgressProbePolicy(plan);
  const allowedRead = plan.profileManifest.sandbox.readAllowlist[0];
  const allowedEvil = `${allowedRead}.evil`;
  const sessionWritePrefix = path.join(plan.profileManifest.sandbox.sessionOnlyWrites[0], ".containment-probe-");
  const globalTempWritePrefix = "/private/tmp/g5-l4-containment-probe-";
  const arbitraryHostRead = "/etc/hosts";
  const authorityWritePrefix = path.join(
    plan.profileManifest.authorityState.replayLockRoot,
    ".runtime-probe-",
  );
  const probeProgram = [
    "socket(S, PF_INET, SOCK_STREAM, getprotobyname('tcp'));",
    "$r=connect(S, sockaddr_in(9, inet_aton('127.0.0.1')));",
    "$network_errno=0+$!;",
    "sub can_read { my($p)=@_; return open(my $f,'<',$p) ? (close($f),1) : 0; }",
    "sub can_write { my($p)=@_; my $ok=open(my $f,'>',$p); if($ok){print $f 'probe';close($f);unlink($p);} return $ok?1:0; }",
    "$allowed_read=can_read($ARGV[0]);",
    "$evil_denied=!can_read($ARGV[1]);",
    "$session_write=can_write($ARGV[2].$$);",
    "$global_tmp_denied=!can_write($ARGV[3].$$);",
    "$outside_host_denied=!can_read($ARGV[4]);",
    "$authority_write_denied=!can_write($ARGV[5].$$);",
    "print 'network_errno='.$network_errno.' allowed_read='.$allowed_read.' evil_denied='.$evil_denied.' session_write='.$session_write.' global_tmp_denied='.$global_tmp_denied.' outside_host_denied='.$outside_host_denied.' authority_write_denied='.$authority_write_denied.qq{\\n};",
    "$network_denied=(!$r && ($network_errno==1 || $network_errno==13));",
    "exit(($network_denied && $allowed_read && $evil_denied && $session_write && $global_tmp_denied && $outside_host_denied && $authority_write_denied) ? 0 : 17);",
  ].join("");
  const result = await runCommand("/usr/bin/sandbox-exec", [
    "-p",
    probePolicy,
    "/usr/bin/perl",
    "-MSocket",
    "-e",
    probeProgram,
    "--",
    allowedRead,
    allowedEvil,
    sessionWritePrefix,
    globalTempWritePrefix,
    arbitraryHostRead,
    authorityWritePrefix,
  ], {
    env: {
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      HOME: plan.profileManifest.sandbox.sessionOnlyWrites[0],
      TMPDIR: `${plan.profileManifest.sandbox.sessionOnlyWrites[0]}${path.sep}`,
      LANG: "C",
      LC_ALL: "C",
    },
  });
  const output = result.stdout || "";
  invariant(result.exitCode === 0
    && /network_errno=(?:1|13)\s/u.test(output)
    && /allowed_read=1\s/u.test(output)
    && /evil_denied=1\s/u.test(output)
    && /session_write=1\s/u.test(output)
    && /global_tmp_denied=1\s/u.test(output)
    && /outside_host_denied=1\s/u.test(output)
    && /authority_write_denied=1(?:\s|$)/u.test(output),
  `live containment probe did not prove every required denial/allowance: ${result.stderr || result.stdout}`);
  return Object.freeze({
    sandboxPolicySha256: plan.profileManifest.sandbox.sha256,
    probePolicySha256: sha256Bytes(Buffer.from(probePolicy)),
    target: "loopback-tcp-127.0.0.1:9",
    successfulConnectionsObserved: 0,
    denialErrno: Number(output.match(/network_errno=(\d+)/u)?.[1]),
    liveNoEgressVerified: true,
    exactAllowedReadVerified: true,
    suffixedAllowlistEscapeDenied: true,
    sessionWriteVerified: true,
    globalTemporaryWriteDenied: true,
    arbitraryHostReadDenied: true,
    replayAuthorityWriteDenied: true,
    projectorLaunched: false,
  });
}

async function assertDirectoryEmpty(directory, label) {
  invariant((await readdir(directory)).length === 0, `${label} must be empty immediately before launch`);
}

export async function runG5L4ProjectorPreflight(
  plan,
  {runCommand = defaultRunCommand, now = Date.now()} = {},
) {
  validateG5L4ProjectorLaunchPlan(plan);
  await verifyG5L4PerSessionAuthorization({
    authorizationPath: plan.authorization.path,
    expected: plan.expectedAuthorizationBinding,
    now,
  });
  const profileBinding = await bindFile(
    plan.expectedAuthorizationBinding.profile.manifestPath,
    "profile manifest",
    {readOnly: true},
  );
  invariant(profileBinding.sha256 === plan.expectedAuthorizationBinding.profile.manifestSha256,
    "profile manifest differs from the signed expected binding at live preflight");
  const profileManifest = validateG5L4DisposableProfileManifest(parsePinnedJson(profileBinding, "profile manifest"));
  invariant(stableJson(profileManifest) === stableJson(plan.profileManifest),
    "profile manifest object differs from the authorization-verified launch plan");
  const hostVerification = await verifyG5L4FullHostTreeBinding({
    profileManifest,
    expectedManifestSha256: plan.expectedAuthorizationBinding.hostTree.manifestSha256,
  });
  const projector = await bindFile(plan.executable, "Adobe Projector", {executable: true});
  invariant(projector.sha256 === plan.expectedAuthorizationBinding.tool.sha256,
    "Projector differs from the signed expected binding at live preflight");
  const capacity = await statfs(profileManifest.sessionRoot);
  const freeBytes = Number(capacity.bavail) * Number(capacity.bsize);
  invariant(freeBytes >= G5_L4_MINIMUM_SESSION_FREE_BYTES, "live capacity is below the session floor");
  const codesign = await runCommand("/usr/bin/codesign", ["--verify", "--deep", "--strict", plan.executable]);
  invariant(codesign.exitCode === 0, `Projector codesign verification failed: ${codesign.stderr}`);
  const processTable = await runCommand("/bin/ps", ["-axo", "pid=,ppid=,command="]);
  invariant(processTable.exitCode === 0, "cannot inspect the process table");
  const existingProjectors = parseProjectorProcessTable(processTable.stdout, plan.executable);
  invariant(existingProjectors.length === 0,
    `fresh Projector absence failed; do not signal existing PID(s): ${existingProjectors.map(({pid}) => pid).join(",")}`);
  for (const tool of [
    plan.sandboxExecutable,
    "/usr/bin/perl",
    "/usr/sbin/lsof",
    "/usr/bin/nettop",
    "/usr/bin/fs_usage",
  ]) {
    await access(tool);
  }
  const sandbox = await bindFile(profileManifest.sandbox.path, "sandbox policy", {readOnly: true});
  invariant(sandbox.sha256 === profileManifest.sandbox.sha256
    && profileManifest.sandbox.noEgressPolicyDeclared === true
    && profileManifest.sandbox.liveNoEgressVerified === false,
  "sandbox policy-candidate binding drifted");
  const liveNoEgress = await runG5L4LiveNoEgressProbe(plan, {runCommand});
  for (const [name, directory] of Object.entries(profileManifest.emptyStores)) {
    await assertDirectoryEmpty(directory, name);
  }
  const base = {
    schemaVersion: 1,
    receiptType: "g5-l4-shell-rw002-live-projector-preflight",
    status: "diagnostic-preflight-passed-launch-disabled",
    diagnosticOnly: true,
    executionAvailable: false,
    sessionId: plan.sessionId,
    language: plan.language,
    capturedAt: new Date().toISOString(),
    hostIdSha256: plan.expectedAuthorizationBinding.host.hostIdSha256,
    authorizationSha256: plan.authorization.sha256,
    hostTreeManifestSha256: plan.expectedAuthorizationBinding.hostTree.manifestSha256,
    hostTreeResourceFilesVerified: hostVerification.verified.files,
    profileManifestSha256: plan.expectedAuthorizationBinding.profile.manifestSha256,
    projectorSha256: plan.expectedAuthorizationBinding.tool.sha256,
    sandboxSha256: sandbox.sha256,
    sandboxNoEgressPolicyHashVerified: true,
    liveNoEgress,
    liveNoEgressVerified: true,
    capacity: {freeBytes, minimumFreeBytes: G5_L4_MINIMUM_SESSION_FREE_BYTES, sufficient: true},
    codesignPassed: true,
    existingProjectorPids: [],
    protectedDoNotSignalPids: [...G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS],
    protectedPidIdentityVerified: false,
    protectedPidMayBeStaleOrReused: true,
    requestObserverToolsPresent: true,
    authorizationConsumed: false,
    projectorLaunched: false,
    acceptanceEffect: "none",
  };
  return {...base, receiptFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base)))};
}

export async function launchG5L4Projector(plan) {
  validateG5L4ProjectorLaunchPlan(plan);
  const error = new Error(
    "G5 L4 Projector execution is deliberately unavailable: a live observer supervisor must attach, monitor, abort, drain, and verify network/resource requests before any launch",
  );
  error.code = G5_L4_PROJECTOR_EXECUTION_DISABLED_CODE;
  throw error;
}

export function parseArguments(argv) {
  const options = {
    mode: null,
    language: null,
    profileManifestPath: null,
    authorizationPath: null,
    ownerPublicKeyPath: null,
    ownerPublicKeySha256: null,
    approvalManifestPath: null,
    approvalManifestSha256: null,
    liveNoEgressPreflightPath: null,
    liveNoEgressPreflightSha256: null,
    liveCapacityPreflightPath: null,
    liveCapacityPreflightSha256: null,
    liveCodesignPreflightPath: null,
    liveCodesignPreflightSha256: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--plan" || value === "--launch") {
      invariant(options.mode === null, "choose exactly one of --plan or --launch");
      options.mode = value.slice(2);
    } else if (value === "--language") options.language = argv[++index];
    else if (value === "--profile-manifest") options.profileManifestPath = path.resolve(argv[++index] || "");
    else if (value === "--authorization") options.authorizationPath = path.resolve(argv[++index] || "");
    else if (value === "--owner-public-key") options.ownerPublicKeyPath = path.resolve(argv[++index] || "");
    else if (value === "--owner-public-key-sha256") options.ownerPublicKeySha256 = argv[++index];
    else if (value === "--approval-manifest") options.approvalManifestPath = path.resolve(argv[++index] || "");
    else if (value === "--approval-manifest-sha256") options.approvalManifestSha256 = argv[++index];
    else if (value === "--live-no-egress-preflight") options.liveNoEgressPreflightPath = path.resolve(argv[++index] || "");
    else if (value === "--live-no-egress-preflight-sha256") options.liveNoEgressPreflightSha256 = argv[++index];
    else if (value === "--live-capacity-preflight") options.liveCapacityPreflightPath = path.resolve(argv[++index] || "");
    else if (value === "--live-capacity-preflight-sha256") options.liveCapacityPreflightSha256 = argv[++index];
    else if (value === "--live-codesign-preflight") options.liveCodesignPreflightPath = path.resolve(argv[++index] || "");
    else if (value === "--live-codesign-preflight-sha256") options.liveCodesignPreflightSha256 = argv[++index];
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help) {
    invariant(["plan", "launch"].includes(options.mode), "--plan or --launch is required");
    invariant(["en", "es"].includes(options.language), "--language en|es is required");
    invariant(options.profileManifestPath && options.authorizationPath && options.ownerPublicKeyPath
      && HASH.test(options.ownerPublicKeySha256 || ""),
    "profile, authorization, owner public key and exact key SHA-256 are required");
    invariant(CONTAINMENT_RECEIPT_OPTIONS.every(({pathOption, shaOption}) =>
      options[pathOption] && HASH.test(options[shaOption] || "")),
    "all four physical containment receipts and exact SHA-256 values are required");
    invariant(options.mode !== "launch",
      "--launch is deliberately unavailable until the live observer supervisor is implemented");
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/launch-g5-l4-shell-rw002-projector.mjs (--plan|--launch) --language en|es --profile-manifest <path> --authorization <path> --owner-public-key <path> --owner-public-key-sha256 <sha256> --approval-manifest <path> --approval-manifest-sha256 <sha256> --live-no-egress-preflight <path> --live-no-egress-preflight-sha256 <sha256> --live-capacity-preflight <path> --live-capacity-preflight-sha256 <sha256> --live-codesign-preflight <path> --live-codesign-preflight-sha256 <sha256>\n");
    return;
  }
  const plan = await buildG5L4ProjectorLaunchPlan(options);
  if (options.mode === "plan") {
    process.stdout.write(stableJson({...plan, expectedAuthorizationBinding: "hash-bound-redacted-from-cli-output"}));
    return;
  }
  process.stdout.write(stableJson(await launchG5L4Projector(plan)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
