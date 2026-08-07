#!/usr/bin/env node

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createWriteStream} from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {execFile} from "node:child_process";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_VERSION = "1.0.0";
const DEFAULT_PROFILES = "catalog/current-state-snapshot-profiles.json";
const SNAPSHOT_SCHEMA = "schemas/current-state-snapshot-v1.schema.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const LOGICAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function resolveProjectPath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const absolute = path.resolve(projectRoot, relativePath);
  const normalized = portable(path.relative(projectRoot, absolute));
  invariant(normalized && normalized !== ".." && !normalized.startsWith("../"), `${label} escapes the project root`);
  invariant(normalized === relativePath, `${label} must be normalized as ${normalized}`);
  return absolute;
}

export async function ordinaryFileMetadata(absolutePath, label) {
  const metadata = await lstat(absolutePath, {bigint: true});
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be an ordinary file`);
  invariant(metadata.nlink === 1n, `${label} must not be hard-linked`);
  return metadata;
}

async function artifactBinding(definition, label) {
  invariant(isObject(definition), `${label} must be an object`);
  invariant(LOGICAL_ID_PATTERN.test(definition.logicalId || ""), `${label}.logicalId is invalid`);
  invariant(LOGICAL_ID_PATTERN.test(definition.artifactType || ""), `${label}.artifactType is invalid`);
  const absolute = resolveProjectPath(definition.path, `${label}.path`);
  const metadata = await ordinaryFileMetadata(absolute, label);
  const bytes = await readFile(absolute);
  return {
    descriptor: {
      logicalId: definition.logicalId,
      artifactType: definition.artifactType,
      path: definition.path,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    identity: {
      device: String(metadata.dev),
      inode: String(metadata.ino),
      size: String(metadata.size),
      modifiedNs: String(metadata.mtimeNs),
      changedNs: String(metadata.ctimeNs),
    },
    bytes,
  };
}

async function fixedArtifactBinding(relativePath, logicalId, artifactType, label) {
  return artifactBinding({path: relativePath, logicalId, artifactType}, label);
}

function bindingSetIdentity(bindings) {
  return stableJson(bindings.map(({descriptor, identity}) => ({descriptor, identity})));
}

function descriptors(bindings) {
  return bindings.map(({descriptor}) => descriptor);
}

function parseJsonBinding(binding, label) {
  try {
    return JSON.parse(binding.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export function selectSnapshotProfile(catalog, releaseId) {
  invariant(catalog?.schemaVersion === 1 && Array.isArray(catalog.profiles), "snapshot profile catalog is malformed");
  const matches = catalog.profiles.filter((profile) => profile?.releaseId === releaseId);
  invariant(matches.length === 1, `expected one snapshot profile for ${releaseId}, found ${matches.length}`);
  const profile = matches[0];
  invariant(LOGICAL_ID_PATTERN.test(profile.snapshotId || ""), `${releaseId}: snapshotId is invalid`);
  invariant(LOGICAL_ID_PATTERN.test(profile.capturePhase || ""), `${releaseId}: capturePhase is invalid`);
  invariant(
    typeof profile.outputDirectory === "string" &&
      profile.outputDirectory.startsWith("reports/current-state-snapshots/"),
    `${releaseId}: outputDirectory must stay below reports/current-state-snapshots/`,
  );
  resolveProjectPath(profile.outputDirectory, `${releaseId}: outputDirectory`);
  invariant(
    /^\d{4}-\d{2}-\d{2}$/.test(profile.temporalBoundary?.requestedBaselineDate || "") &&
      Array.isArray(profile.temporalBoundary?.preExistingWork) &&
      profile.temporalBoundary.preExistingWork.length > 0 &&
      typeof profile.temporalBoundary?.statement === "string" &&
      profile.temporalBoundary.statement.length > 0,
    `${releaseId}: temporalBoundary is incomplete`,
  );
  invariant(Array.isArray(profile.inputArtifacts) && profile.inputArtifacts.length > 0, `${releaseId}: inputArtifacts are missing`);
  invariant(
    new Set(profile.inputArtifacts.map(({logicalId}) => logicalId)).size === profile.inputArtifacts.length,
    `${releaseId}: inputArtifacts contain duplicate logical IDs`,
  );
  invariant(Array.isArray(profile.diagnosticCommands) && profile.diagnosticCommands.length > 0, `${releaseId}: diagnosticCommands are missing`);
  invariant(
    new Set(profile.diagnosticCommands.map(({commandId}) => commandId)).size === profile.diagnosticCommands.length,
    `${releaseId}: diagnosticCommands contain duplicate command IDs`,
  );
  for (const [index, command] of profile.diagnosticCommands.entries()) {
    invariant(LOGICAL_ID_PATTERN.test(command.commandId || ""), `${releaseId}: diagnosticCommands[${index}].commandId is invalid`);
    invariant(LOGICAL_ID_PATTERN.test(command.scope || ""), `${releaseId}: diagnosticCommands[${index}].scope is invalid`);
    invariant(
      Array.isArray(command.argv) &&
        command.argv.length > 0 &&
        command.argv.every((value) => typeof value === "string" && value.length > 0 && value.length <= 512),
      `${releaseId}: diagnosticCommands[${index}].argv is invalid`,
    );
    invariant(
      command.argv.every((value) => !path.isAbsolute(value) && !value.includes("/Volumes/") && !value.includes("/Users/")),
      `${releaseId}: diagnosticCommands[${index}] exposes an absolute path`,
    );
  }
  if (profile.observedStateSource !== undefined) {
    const source = profile.observedStateSource;
    invariant(isObject(source), `${releaseId}: observedStateSource must be an object`);
    invariant(source.mode === "fail-closed-planning", `${releaseId}: observedStateSource.mode is unsupported`);
    invariant(Number.isSafeInteger(source.expectedMemberCount) && source.expectedMemberCount > 0, `${releaseId}: expectedMemberCount is invalid`);
    invariant(Number.isSafeInteger(source.structuralRootFrameCount) && source.structuralRootFrameCount > 0, `${releaseId}: structuralRootFrameCount is invalid`);
    const inputIds = new Set(profile.inputArtifacts.map(({logicalId}) => logicalId));
    for (const key of [
      "workspaceLogicalId",
      "sourceScopeLogicalId",
      "releaseLedgerLogicalId",
      "runtimePlanningLogicalId",
      "authoringReadinessLogicalId",
    ]) {
      invariant(LOGICAL_ID_PATTERN.test(source[key] || ""), `${releaseId}: observedStateSource.${key} is invalid`);
      invariant(inputIds.has(source[key]), `${releaseId}: observedStateSource.${key} is not an input artifact`);
    }
  }
  return profile;
}

async function runSmall(command, args, {allowFailure = false} = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: safeEnvironment(),
    });
    return {exitCode: 0, stdout: result.stdout, stderr: result.stderr};
  } catch (error) {
    const result = {
      exitCode: Number.isInteger(error?.code) ? error.code : 1,
      stdout: String(error?.stdout || ""),
      stderr: String(error?.stderr || error?.message || ""),
    };
    if (!allowFailure) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr.trim()}`);
    return result;
  }
}

function safeEnvironment() {
  return {
    PATH: process.env.PATH || "/usr/bin:/bin:/usr/sbin:/sbin",
    HOME: process.env.HOME || projectRoot,
    TMPDIR: process.env.TMPDIR || "/tmp",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    CI: "1",
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    npm_config_update_notifier: "false",
    npm_config_fund: "false",
    npm_config_audit: "false",
  };
}

function outputPaths(profile) {
  const directory = resolveProjectPath(profile.outputDirectory, "snapshot output directory");
  return {
    directory,
    json: path.join(directory, "snapshot.json"),
    markdown: path.join(directory, "snapshot.md"),
    relativeJson: `${profile.outputDirectory}/snapshot.json`,
    relativeMarkdown: `${profile.outputDirectory}/snapshot.md`,
  };
}

async function pathExists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function normalizePorcelainRecords(buffer, excludedPaths = []) {
  const exclusions = new Set(excludedPaths);
  const records = buffer.toString("utf8").split("\0").filter(Boolean);
  const normalized = [];
  for (const record of records) {
    invariant(record.length >= 4 && record[2] === " ", `unexpected git status record`);
    const status = record.slice(0, 2);
    const file = portable(record.slice(3));
    if (exclusions.has(file)) continue;
    normalized.push(`${status} ${file}`);
  }
  normalized.sort((left, right) => left.localeCompare(right));
  const serialized = Buffer.from(normalized.join("\0"), "utf8");
  const untrackedEntryCount = normalized.filter((record) => record.startsWith("?? ")).length;
  return {
    records: normalized,
    summary: {
      dirty: normalized.length > 0,
      statusEntryCount: normalized.length,
      trackedEntryCount: normalized.length - untrackedEntryCount,
      untrackedEntryCount,
      statusSha256: sha256(serialized),
    },
  };
}

async function gitRepositoryState(excludedPaths) {
  const [head, branch, status] = await Promise.all([
    runSmall("git", ["rev-parse", "--verify", "HEAD"], {allowFailure: true}),
    runSmall("git", ["symbolic-ref", "--quiet", "--short", "HEAD"]),
    execFileAsync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames"], {
      cwd: projectRoot,
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      env: safeEnvironment(),
    }),
  ]);
  const branchName = branch.stdout.trim();
  invariant(LOGICAL_ID_PATTERN.test(branchName), `git branch name is not portable`);
  const normalized = normalizePorcelainRecords(status.stdout, excludedPaths);
  const attached = head.exitCode === 0;
  const headSha = attached ? head.stdout.trim() : null;
  invariant(!attached || /^[a-f0-9]{40}$/.test(headSha), "git HEAD is malformed");
  return {
    headState: attached ? "attached" : "unborn",
    headSha,
    branch: branchName,
    ...normalized.summary,
    excludedSnapshotOutputCount: excludedPaths.length,
    pathsWithheld: true,
  };
}

async function toolVersions() {
  const [npmVersion, gitVersion] = await Promise.all([
    runSmall("npm", ["--version"]),
    runSmall("git", ["--version"]),
  ]);
  const values = [
    {name: "node", version: process.version},
    {name: "npm", version: npmVersion.stdout.trim()},
    {name: "git", version: gitVersion.stdout.trim()},
    {name: "current-state-snapshot-generator", version: GENERATOR_VERSION},
  ];
  invariant(values.every(({version}) => version && version.length <= 256 && !version.includes("\n")), "tool version output is invalid");
  return values;
}

async function streamDigest(readable, outputFile) {
  const hash = createHash("sha256");
  let bytes = 0;
  const digesting = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      bytes += chunk.length;
      callback(null, chunk);
    },
  });
  const output = createWriteStream(outputFile, {flags: "wx", mode: 0o600});
  await pipeline(readable, digesting, output);
  return {bytes, sha256: hash.digest("hex")};
}

export async function runDiagnosticCommand(command, index, logsDirectory) {
  const startedAt = new Date().toISOString();
  const base = `${String(index + 1).padStart(2, "0")}-${command.commandId}`;
  const stdoutFile = path.join(logsDirectory, `${base}.stdout`);
  const stderrFile = path.join(logsDirectory, `${base}.stderr`);
  const child = spawn(command.argv[0], command.argv.slice(1), {
    cwd: projectRoot,
    env: safeEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdoutPromise = streamDigest(child.stdout, stdoutFile);
  const stderrPromise = streamDigest(child.stderr, stderrFile);
  const processResult = await new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    child.once("error", () => settle({exitCode: 127, signal: null}));
    child.once("close", (code, signal) => settle({
      exitCode: Number.isInteger(code) ? Math.min(255, Math.max(0, code)) : 128,
      signal: signal || null,
    }));
  });
  const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
  const endedAt = new Date().toISOString();
  return {
    commandId: command.commandId,
    scope: command.scope,
    argv: command.argv,
    startedAt,
    endedAt,
    exitCode: processResult.exitCode,
    signal: processResult.signal,
    outcome: processResult.exitCode === 0 && processResult.signal === null ? "passed" : "failed",
    stdoutBytes: stdout.bytes,
    stdoutSha256: stdout.sha256,
    stderrBytes: stderr.bytes,
    stderrSha256: stderr.sha256,
  };
}

function selectRelease(manifest, releaseId) {
  invariant(manifest?.schemaVersion === 1 && Array.isArray(manifest.releases), "lesson release manifest is malformed");
  const matches = manifest.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, `expected one lesson release ${releaseId}, found ${matches.length}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: publication mode is not atomic`);
  invariant(release.members?.length === release.expectedCounts?.members, `${releaseId}: member count is incomplete`);
  invariant(release.members.every((member, index) => member.ordinal === index + 1), `${releaseId}: ordinals are not contiguous`);
  return release;
}

function selectReleaseLedgerEntry(ledger, release) {
  invariant(ledger?.schemaVersion === 1 && Array.isArray(ledger.releases), "lesson release ledger is malformed");
  const matches = ledger.releases.filter((entry) => entry?.releaseId === release.releaseId);
  invariant(matches.length === 1, `expected one lesson release ledger entry ${release.releaseId}, found ${matches.length}`);
  const entry = matches[0];
  invariant(entry.publicationMode === release.publicationMode, `${release.releaseId}: ledger publication mode differs`);
  invariant(entry.expectedMemberCount === release.expectedCounts.members, `${release.releaseId}: ledger member count differs`);
  invariant(Array.isArray(entry.members) && entry.members.length === release.members.length, `${release.releaseId}: ledger members are incomplete`);
  const identity = (members) => members.map(({ordinal, animationId, assetId, releaseRole}) => ({
    ordinal,
    animationId,
    assetId,
    releaseRole,
  }));
  invariant(
    stableJson(identity(entry.members)) === stableJson(identity(release.members)),
    `${release.releaseId}: ledger member identities differ from the release definition`,
  );
  return entry;
}

function bindingValueByLogicalId(bindings, logicalId) {
  const matches = bindings.filter(({descriptor}) => descriptor.logicalId === logicalId);
  invariant(matches.length === 1, `expected one ${logicalId} input binding, found ${matches.length}`);
  return parseJsonBinding(matches[0], logicalId);
}

export function deriveObservedState({
  release,
  workspace,
  sourceScope,
  m0 = null,
  releaseLedger = null,
  runtimePlanning = null,
  authoringReadiness = null,
  commands,
}) {
  const commandById = new Map(commands.map((command) => [command.commandId, command]));
  const completionLedgerCurrent = commandById.get("check-protected-completion-ledger")?.outcome === "passed";
  const releaseLedgerCurrent = commandById.get("check-lesson-release-ledger")?.outcome === "passed";
  const passedDiagnosticCommandCount = commands.filter(({outcome}) => outcome === "passed").length;
  const releaseLedgerEntry = releaseLedger ? selectReleaseLedgerEntry(releaseLedger, release) : null;
  if (releaseLedgerEntry) {
    invariant(
      releaseLedgerEntry.strictCompleteCount === sourceScope.summary.strictCompleteCount,
      `${release.releaseId}: source-scope and release-ledger strict counts differ`,
    );
    invariant(
      releaseLedgerEntry.published === (sourceScope.summary.publishedCount === 1),
      `${release.releaseId}: source-scope and release-ledger publication states differ`,
    );
  }

  let runtime;
  let authoringAudits;
  let audioAccepted;
  let ownerDecisions;
  let namedRoleAssignments;
  let machinePacketReadyForOwnerReview;
  let m0ExitReady;
  let m1Authorized;
  if (m0) {
    runtime = m0.machinePacket.runtime.authoritativeSessions;
    authoringAudits = m0.machinePacket.authoring.authoringAudits;
    audioAccepted = m0.machinePacket.audio.accepted;
    ownerDecisions = m0.summary.ownerDecisionReceiptCount;
    namedRoleAssignments = m0.summary.namedRoleAssignmentReceiptCount;
    machinePacketReadyForOwnerReview = m0.summary.machinePacketReadyForOwnerReview;
    m0ExitReady = m0.summary.m0ExitReady;
    m1Authorized = m0.summary.m1StartAuthorized;
  } else {
    invariant(runtimePlanning?.identity?.releaseId === release.releaseId, `${release.releaseId}: runtime planning identity differs`);
    invariant(runtimePlanning?.scope?.releaseMemberCount === release.expectedCounts.members, `${release.releaseId}: runtime planning release scope differs`);
    invariant(runtimePlanning?.summary?.selectedMemberCount === release.expectedCounts.members, `${release.releaseId}: runtime planning member coverage differs`);
    invariant(authoringReadiness?.release?.releaseId === release.releaseId, `${release.releaseId}: authoring readiness identity differs`);
    invariant(authoringReadiness?.summary?.selectedMembers === release.expectedCounts.members, `${release.releaseId}: authoring readiness member coverage differs`);
    invariant(sourceScope?.acceptanceEffects?.audioAccepted === false, `${release.releaseId}: source scope claims accepted audio`);
    invariant(runtimePlanning?.gates?.audioRuntimeListeningComplete === false, `${release.releaseId}: runtime planning claims completed audio listening`);
    runtime = runtimePlanning.summary.runtimeSessionCount;
    authoringAudits = authoringReadiness.summary.authoringAuditsEstablished;
    audioAccepted = 0;
    ownerDecisions = authoringReadiness.summary.ownerAcceptancesEstablished;
    namedRoleAssignments = runtimePlanning.summary.namedOperatorRoleAssignmentReceiptCount;
    machinePacketReadyForOwnerReview = false;
    m0ExitReady = false;
    m1Authorized = runtimePlanning.gates.implementationAuthorized;
  }
  return {
    expectedMemberCount: release.expectedCounts.members,
    draftValidWorkspaceCount: workspace.summary.draftValidationPassCount,
    implementationStartedCount: workspace.summary.implementationStartedCount,
    strictCompleteCount: releaseLedgerEntry?.strictCompleteCount ?? sourceScope.summary.strictCompleteCount,
    published: releaseLedgerEntry?.published ?? sourceScope.summary.publishedCount === 1,
    publicRoutesOpen: false,
    authoritativeRuntimeSessionCount: runtime,
    authoringAuditCount: authoringAudits,
    audioAcceptedFileCount: audioAccepted,
    ownerDecisionReceiptCount: ownerDecisions,
    namedRoleAssignmentReceiptCount: namedRoleAssignments,
    completionLedgerCurrent,
    releaseLedgerCurrent,
    diagnosticCommandCount: commands.length,
    passedDiagnosticCommandCount,
    failedDiagnosticCommandCount: commands.length - passedDiagnosticCommandCount,
    machinePacketReadyForOwnerReview,
    m0ExitReady,
    m1Authorized,
  };
}

function releaseDescriptor(release) {
  const memberIdentities = release.members.map((member) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
  }));
  return {
    title: release.titleDisplay,
    definitionSha256: sha256(stableJson(release)),
    memberIdentitySetSha256: sha256(stableJson(memberIdentities)),
    expectedMemberCount: release.expectedCounts.members,
    activePageCount: release.expectedCounts.activeXmlReferencedPages,
    shellCount: release.expectedCounts.courseShells,
    publicationMode: release.publicationMode,
  };
}

export function attachIntegrity(payload) {
  const withoutIntegrity = structuredClone(payload);
  delete withoutIntegrity.integrity;
  return {
    ...payload,
    integrity: {
      inputSetSha256: sha256(stableJson(payload.inputs)),
      commandSetSha256: sha256(stableJson(payload.commands)),
      snapshotPayloadSha256: sha256(stableJson(withoutIntegrity)),
    },
  };
}

export function validateSnapshot(snapshot) {
  invariant(isObject(snapshot), "snapshot must be an object");
  invariant(snapshot.schemaVersion === 1, "snapshot schemaVersion must be 1");
  invariant(snapshot.evidenceType === "help-math-current-state-snapshot-v1", "snapshot evidenceType is invalid");
  invariant(LOGICAL_ID_PATTERN.test(snapshot.snapshotId || ""), "snapshotId is invalid");
  invariant(LOGICAL_ID_PATTERN.test(snapshot.releaseId || ""), "releaseId is invalid");
  invariant(!Number.isNaN(Date.parse(snapshot.capturedAt)), "capturedAt is invalid");
  invariant(LOGICAL_ID_PATTERN.test(snapshot.capturePhase || ""), "capturePhase is invalid");
  invariant(snapshot.repository?.headState === (snapshot.repository?.headSha ? "attached" : "unborn"), "repository HEAD state is inconsistent");
  invariant(snapshot.repository?.pathsWithheld === true, "worktree paths must be withheld");
  invariant(snapshot.repository?.excludedSnapshotOutputCount === 2, "exactly two public snapshot outputs must be excluded");
  invariant(Array.isArray(snapshot.inputs) && snapshot.inputs.length > 0, "snapshot inputs are missing");
  invariant(Array.isArray(snapshot.commands) && snapshot.commands.length > 0, "snapshot commands are missing");
  invariant(new Set(snapshot.inputs.map(({logicalId}) => logicalId)).size === snapshot.inputs.length, "snapshot inputs contain duplicate logical IDs");
  invariant(new Set(snapshot.commands.map(({commandId}) => commandId)).size === snapshot.commands.length, "snapshot commands contain duplicate command IDs");
  for (const artifact of [snapshot.schema, snapshot.generator, ...snapshot.inputs]) {
    invariant(LOGICAL_ID_PATTERN.test(artifact?.logicalId || ""), "snapshot artifact logicalId is invalid");
    invariant(LOGICAL_ID_PATTERN.test(artifact?.artifactType || ""), "snapshot artifact type is invalid");
    invariant(
      typeof artifact?.path === "string" &&
        artifact.path.length > 0 &&
        !path.isAbsolute(artifact.path) &&
        !artifact.path.includes("\\") &&
        !artifact.path.split("/").includes(".."),
      "snapshot artifact path is not safe",
    );
    invariant(Number.isSafeInteger(artifact.bytes) && artifact.bytes >= 0, "snapshot artifact bytes are invalid");
    invariant(SHA256_PATTERN.test(artifact.sha256 || ""), "snapshot artifact SHA-256 is invalid");
  }
  for (const command of snapshot.commands) {
    invariant(LOGICAL_ID_PATTERN.test(command.commandId || ""), "snapshot command ID is invalid");
    invariant(LOGICAL_ID_PATTERN.test(command.scope || ""), "snapshot command scope is invalid");
    invariant(Array.isArray(command.argv) && command.argv.length > 0, "snapshot command argv is invalid");
    invariant(Number.isInteger(command.exitCode) && command.exitCode >= 0 && command.exitCode <= 255, "snapshot command exitCode is invalid");
    invariant(command.outcome === (command.exitCode === 0 && command.signal === null ? "passed" : "failed"), "snapshot command outcome is inconsistent");
    invariant(SHA256_PATTERN.test(command.stdoutSha256 || "") && SHA256_PATTERN.test(command.stderrSha256 || ""), "snapshot command output hash is invalid");
  }
  const observed = snapshot.observedState;
  invariant(observed.expectedMemberCount === snapshot.release.expectedMemberCount, "observed release member count differs");
  invariant(observed.strictCompleteCount <= observed.expectedMemberCount, "strict count exceeds release members");
  invariant(observed.passedDiagnosticCommandCount + observed.failedDiagnosticCommandCount === observed.diagnosticCommandCount, "diagnostic counts are inconsistent");
  invariant(observed.diagnosticCommandCount === snapshot.commands.length, "diagnostic command count differs");
  invariant(observed.published === false && observed.publicRoutesOpen === false, "current-state snapshot cannot open this unpublished release");
  invariant(
    Object.values(snapshot.acceptanceEffects || {}).every((value) => value === false),
    "current-state snapshot must not have acceptance effects",
  );
  invariant(
    snapshot.privacy?.exportClass === "public-hash-metadata-only" &&
      Object.entries(snapshot.privacy).every(([key, value]) => key === "exportClass" || value === false),
    "snapshot privacy declaration is invalid",
  );
  const expectedInputSet = sha256(stableJson(snapshot.inputs));
  const expectedCommandSet = sha256(stableJson(snapshot.commands));
  const withoutIntegrity = structuredClone(snapshot);
  delete withoutIntegrity.integrity;
  const expectedPayload = sha256(stableJson(withoutIntegrity));
  invariant(snapshot.integrity?.inputSetSha256 === expectedInputSet, "snapshot input set integrity is invalid");
  invariant(snapshot.integrity?.commandSetSha256 === expectedCommandSet, "snapshot command set integrity is invalid");
  invariant(snapshot.integrity?.snapshotPayloadSha256 === expectedPayload, "snapshot payload integrity is invalid");
  const serialized = JSON.stringify(snapshot);
  const forbidden = [
    /\/Volumes\//,
    /\/Users\//,
    /file:\/\//i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  ];
  invariant(forbidden.every((pattern) => !pattern.test(serialized)), "snapshot exposes a private path or contact identifier");
  return snapshot;
}

export function renderMarkdown(snapshot) {
  const head = snapshot.repository.headState === "attached" ? snapshot.repository.headSha : "unborn";
  const commandRows = snapshot.commands.map((command) =>
    `| \`${command.commandId}\` | ${command.outcome} | ${command.exitCode} | ${command.stdoutBytes} / \`${command.stdoutSha256}\` | ${command.stderrBytes} / \`${command.stderrSha256}\` |`,
  ).join("\n");
  const inputRows = snapshot.inputs.map((input) =>
    `| \`${input.logicalId}\` | \`${input.path}\` | ${input.bytes} | \`${input.sha256}\` |`,
  ).join("\n");
  return `# ${snapshot.releaseId} CurrentStateSnapshotV1\n\n` +
    `> ${snapshot.authority}\n\n` +
    `- Snapshot: \`${snapshot.snapshotId}\`\n` +
    `- Captured: \`${snapshot.capturedAt}\`\n` +
    `- Phase: \`${snapshot.capturePhase}\`\n` +
    `- HEAD: \`${head}\`; branch: \`${snapshot.repository.branch}\`; dirty: **${snapshot.repository.dirty}**\n` +
    `- Worktree fingerprint: ${snapshot.repository.statusEntryCount} withheld paths, SHA-256 \`${snapshot.repository.statusSha256}\`\n` +
    `- Snapshot payload SHA-256: \`${snapshot.integrity.snapshotPayloadSha256}\`\n\n` +
    `## Temporal boundary\n\n${snapshot.temporalBoundary.statement}\n\n` +
    `${snapshot.temporalBoundary.preExistingWork.map((item) => `- ${item}`).join("\n")}\n\n` +
    `## Observed release state\n\n` +
    `- Draft-valid workspaces: **${snapshot.observedState.draftValidWorkspaceCount}/${snapshot.observedState.expectedMemberCount}**\n` +
    `- Implementation started: **${snapshot.observedState.implementationStartedCount}**\n` +
    `- Strict complete: **${snapshot.observedState.strictCompleteCount}/${snapshot.observedState.expectedMemberCount}**\n` +
    `- Published/public routes: **${snapshot.observedState.published}/${snapshot.observedState.publicRoutesOpen}**\n` +
    `- Authoritative runtime sessions: **${snapshot.observedState.authoritativeRuntimeSessionCount}**\n` +
    `- Authoring audits: **${snapshot.observedState.authoringAuditCount}**\n` +
    `- Accepted audio files: **${snapshot.observedState.audioAcceptedFileCount}**\n` +
    `- Owner decisions: **${snapshot.observedState.ownerDecisionReceiptCount}**; named role assignments: **${snapshot.observedState.namedRoleAssignmentReceiptCount}**\n` +
    `- Protected completion ledger current: **${snapshot.observedState.completionLedgerCurrent}**\n` +
    `- Lesson release ledger current: **${snapshot.observedState.releaseLedgerCurrent}**\n` +
    `- M0 exit ready / M1 authorized: **${snapshot.observedState.m0ExitReady}/${snapshot.observedState.m1Authorized}**\n\n` +
    `## Diagnostic commands\n\n| Command | Outcome | Exit | stdout bytes / SHA-256 | stderr bytes / SHA-256 |\n|---|---|---:|---|---|\n${commandRows}\n\n` +
    `Raw command output is preserved only below the ignored private work root. This public projection stores hashes and byte counts, not output bytes.\n\n` +
    `## Input bindings\n\n| Logical input | Repository path | Bytes | SHA-256 |\n|---|---|---:|---|\n${inputRows}\n\n` +
    `## Known boundaries\n\n${snapshot.knownBoundaries.map((boundary) => `- ${boundary}`).join("\n")}\n\n` +
    `All acceptance effects in this receipt are false. This is not an EvidenceReceiptV1 and cannot authorize strict completion or publication.\n`;
}

function privateEvidencePaths(profile) {
  const relative = `work/current-state-snapshots/${profile.snapshotId}`;
  return {relative, absolute: resolveProjectPath(relative, "private evidence directory")};
}

function attemptDirectory(profile) {
  const attemptId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
  const relative = `work/current-state-snapshots/.attempts/${profile.snapshotId}/${attemptId}`;
  return {relative, absolute: resolveProjectPath(relative, "capture attempt directory")};
}

export async function compareCaptureState({
  startBindings,
  endBindings,
  startRepository,
  endRepository,
}) {
  invariant(bindingSetIdentity(startBindings) === bindingSetIdentity(endBindings), "snapshot input drifted during capture");
  invariant(stableJson(startRepository) === stableJson(endRepository), "repository state drifted during capture");
}

async function prepareBindings(profile, profilesPath) {
  const configured = profile.inputArtifacts.map((artifact) => {
    if (artifact.logicalId === "snapshot-profile") {
      return {...artifact, path: profilesPath};
    }
    return artifact;
  });
  const [schemaBinding, generatorBinding, ...inputBindings] = await Promise.all([
    fixedArtifactBinding(SNAPSHOT_SCHEMA, "current-state-snapshot-v1-schema", "json-schema", "snapshot schema"),
    fixedArtifactBinding(
      portable(path.relative(projectRoot, scriptPath)),
      "current-state-snapshot-generator",
      "generator-script",
      "snapshot generator",
    ),
    ...configured.map((artifact, index) => artifactBinding(artifact, `inputArtifacts[${index}]`)),
  ]);
  return {schemaBinding, generatorBinding, inputBindings};
}

function buildSnapshot({
  profile,
  capturedAt,
  schemaBinding,
  generatorBinding,
  inputBindings,
  repository,
  tools,
  commands,
}) {
  const releaseManifest = bindingValueByLogicalId(inputBindings, "lesson-release-definition");
  const release = selectRelease(releaseManifest, profile.releaseId);
  const stateSource = profile.observedStateSource;
  let observedState;
  let structuralRootFrameCount;
  let planningBoundary = null;
  if (stateSource?.mode === "fail-closed-planning") {
    const workspace = bindingValueByLogicalId(inputBindings, stateSource.workspaceLogicalId);
    const sourceScope = bindingValueByLogicalId(inputBindings, stateSource.sourceScopeLogicalId);
    const releaseLedger = bindingValueByLogicalId(inputBindings, stateSource.releaseLedgerLogicalId);
    const runtimePlanning = bindingValueByLogicalId(inputBindings, stateSource.runtimePlanningLogicalId);
    const authoringReadiness = bindingValueByLogicalId(inputBindings, stateSource.authoringReadinessLogicalId);
    invariant(workspace.releaseId === profile.releaseId, `${profile.releaseId}: workspace readiness identity differs`);
    invariant(sourceScope.releaseId === profile.releaseId, `${profile.releaseId}: source-scope identity differs`);
    observedState = deriveObservedState({
      release,
      workspace,
      sourceScope,
      releaseLedger,
      runtimePlanning,
      authoringReadiness,
      commands,
    });
    invariant(observedState.expectedMemberCount === stateSource.expectedMemberCount, `${profile.releaseId}: expected member count drifted`);
    invariant(observedState.draftValidWorkspaceCount === stateSource.expectedMemberCount, `${profile.releaseId}: draft-valid workspace coverage drifted`);
    invariant(observedState.implementationStartedCount === 0, `${profile.releaseId}: implementation has started`);
    invariant(observedState.authoritativeRuntimeSessionCount === 0, `${profile.releaseId}: authoritative runtime sessions are no longer zero`);
    invariant(observedState.authoringAuditCount === 0, `${profile.releaseId}: authoring audits are no longer zero`);
    invariant(observedState.audioAcceptedFileCount === 0, `${profile.releaseId}: accepted audio is no longer zero`);
    invariant(observedState.ownerDecisionReceiptCount === 0, `${profile.releaseId}: owner decisions are no longer zero`);
    invariant(observedState.namedRoleAssignmentReceiptCount === 0, `${profile.releaseId}: named role assignments are no longer zero`);
    invariant(observedState.m0ExitReady === false && observedState.m1Authorized === false, `${profile.releaseId}: planning evidence crossed an authorization boundary`);
    structuralRootFrameCount = stateSource.structuralRootFrameCount;
    planningBoundary = "This snapshot consumes no G5 L4 M0/M1 packet, receipt, role assignment, or authorization; its G5 L5 state is independently derived from the exact release, release ledger, source/workspace reports, runtime plan, and authoring-readiness report.";
  } else {
    const workspace = bindingValueByLogicalId(inputBindings, "g5-l4-workspace-readiness");
    const sourceScope = bindingValueByLogicalId(inputBindings, "g5-l4-source-scope");
    const m0 = bindingValueByLogicalId(inputBindings, "g5-l4-m0-machine-packet");
    observedState = deriveObservedState({release, workspace, sourceScope, m0, commands});
    invariant(observedState.expectedMemberCount === 55, `${profile.releaseId}: expected member count drifted`);
    invariant(observedState.draftValidWorkspaceCount === 55, `${profile.releaseId}: draft-valid workspace coverage drifted`);
    structuralRootFrameCount = 590;
  }
  invariant(observedState.strictCompleteCount === 0 && observedState.published === false, `${profile.releaseId}: snapshot crossed a release boundary`);
  return attachIntegrity({
    schemaVersion: 1,
    evidenceType: "help-math-current-state-snapshot-v1",
    snapshotId: profile.snapshotId,
    releaseId: profile.releaseId,
    capturedAt,
    capturePhase: profile.capturePhase,
    authority: "Unsigned diagnostic receipt only. It binds an observed repository state and command outputs but grants no original-runtime authority, fidelity finding, review decision, Owner acceptance, strict completion, promotion, or publication.",
    temporalBoundary: profile.temporalBoundary,
    schema: schemaBinding.descriptor,
    generator: generatorBinding.descriptor,
    repository,
    tools,
    release: releaseDescriptor(release),
    inputs: descriptors(inputBindings),
    commands,
    observedState,
    knownBoundaries: [
      "The protected completion and Lesson release ledgers are deliberately preserved even when their currentness checks fail; this snapshot never refreshes them.",
      "A passing source, workspace, product, typecheck, or build command is current-JavaScript or machine-readiness evidence only.",
      "Failed diagnostics are recorded as failures and are not rewritten as passing receipts.",
      `The ${structuralRootFrameCount} root frames remain a structural root-timeline count, not full nested/interactive/audio coverage.`,
      ...(planningBoundary ? [planningBoundary] : []),
      "No authorized original-runtime trace, authoritative baseline, paired full-frame RMSE result, audio listening decision, human review, or Owner decision is created here.",
      "Public command output is hash-only; raw stdout and stderr stay under the ignored private work root and outside Git and deployments.",
      "Input inode/hash and withheld worktree fingerprints were stable across the capture command window; any concurrent drift would have rejected this receipt.",
    ],
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      promotionAuthorized: false,
      published: false,
    },
    privacy: {
      exportClass: "public-hash-metadata-only",
      containsRawFrames: false,
      containsRawAudio: false,
      containsPrivatePaths: false,
      containsContactInformation: false,
      containsStudentData: false,
      containsSecrets: false,
      storesCommandOutput: false,
    },
  });
}

async function writeCaptureFailure(attempt, error) {
  const failure = {
    schemaVersion: 1,
    evidenceType: "help-math-current-state-snapshot-capture-failure",
    failedAt: new Date().toISOString(),
    error: String(error?.message || error).replaceAll(projectRoot, "<project-root>"),
  };
  await writeFile(path.join(attempt.absolute, "capture-failed.json"), stableJson(failure), {flag: "wx", mode: 0o600})
    .catch(() => {});
}

async function reserveDirectory(absolutePath, label) {
  invariant(!(await pathExists(absolutePath)), `${label} already exists; snapshots are no-replace artifacts`);
  await mkdir(absolutePath, {recursive: false, mode: 0o755});
}

export async function captureSnapshot({releaseId, profilesPath = DEFAULT_PROFILES}) {
  const profilesBinding = await fixedArtifactBinding(
    profilesPath,
    "snapshot-profile",
    "current-state-snapshot-profile",
    "snapshot profile catalog",
  );
  const profile = selectSnapshotProfile(parseJsonBinding(profilesBinding, "snapshot profile catalog"), releaseId);
  const outputs = outputPaths(profile);
  const privateEvidence = privateEvidencePaths(profile);
  invariant(!(await pathExists(outputs.directory)), `${profile.snapshotId}: public snapshot output already exists`);
  invariant(!(await pathExists(privateEvidence.absolute)), `${profile.snapshotId}: private command evidence already exists`);

  const attempt = attemptDirectory(profile);
  await mkdir(path.join(attempt.absolute, "commands"), {recursive: true, mode: 0o700});
  try {
    const excludedPaths = [outputs.relativeJson, outputs.relativeMarkdown];
    const capturedAt = new Date().toISOString();
    const start = await prepareBindings(profile, profilesPath);
    const [startRepository, tools] = await Promise.all([
      gitRepositoryState(excludedPaths),
      toolVersions(),
    ]);
    const commands = [];
    for (const [index, command] of profile.diagnosticCommands.entries()) {
      process.stdout.write(`CAPTURE ${index + 1}/${profile.diagnosticCommands.length}: ${command.commandId}\n`);
      const receipt = await runDiagnosticCommand(command, index, path.join(attempt.absolute, "commands"));
      commands.push(receipt);
      process.stdout.write(`CAPTURE ${command.commandId}: ${receipt.outcome} (exit ${receipt.exitCode})\n`);
    }
    const end = await prepareBindings(profile, profilesPath);
    const endRepository = await gitRepositoryState(excludedPaths);
    await compareCaptureState({
      startBindings: [start.schemaBinding, start.generatorBinding, ...start.inputBindings],
      endBindings: [end.schemaBinding, end.generatorBinding, ...end.inputBindings],
      startRepository,
      endRepository,
    });
    const snapshot = validateSnapshot(buildSnapshot({
      profile,
      capturedAt,
      schemaBinding: start.schemaBinding,
      generatorBinding: start.generatorBinding,
      inputBindings: start.inputBindings,
      repository: startRepository,
      tools,
      commands,
    }));
    const markdown = renderMarkdown(snapshot);
    await mkdir(path.dirname(privateEvidence.absolute), {recursive: true, mode: 0o700});
    invariant(!(await pathExists(privateEvidence.absolute)), `${profile.snapshotId}: private evidence appeared concurrently`);
    await rename(attempt.absolute, privateEvidence.absolute);
    await mkdir(path.dirname(outputs.directory), {recursive: true});
    await reserveDirectory(outputs.directory, "public snapshot output directory");
    await writeFile(outputs.json, stableJson(snapshot), {flag: "wx", mode: 0o644});
    await writeFile(outputs.markdown, markdown, {flag: "wx", mode: 0o644});
    return {profile, snapshot, outputs, privateEvidence};
  } catch (error) {
    await writeCaptureFailure(attempt, error);
    throw error;
  }
}

async function verifyPrivateCommandLogs(snapshot, profile) {
  const privateEvidence = privateEvidencePaths(profile);
  const commandsDirectory = path.join(privateEvidence.absolute, "commands");
  for (const [index, command] of snapshot.commands.entries()) {
    const base = `${String(index + 1).padStart(2, "0")}-${command.commandId}`;
    for (const stream of ["stdout", "stderr"]) {
      const file = path.join(commandsDirectory, `${base}.${stream}`);
      await ordinaryFileMetadata(file, `${command.commandId} ${stream}`);
      const bytes = await readFile(file);
      invariant(bytes.length === command[`${stream}Bytes`], `${command.commandId} ${stream} byte count drifted`);
      invariant(sha256(bytes) === command[`${stream}Sha256`], `${command.commandId} ${stream} SHA-256 drifted`);
    }
  }
}

export async function checkSnapshot({releaseId, profilesPath = DEFAULT_PROFILES, publicOnly = false}) {
  const profilesBinding = await fixedArtifactBinding(
    profilesPath,
    "snapshot-profile",
    "current-state-snapshot-profile",
    "snapshot profile catalog",
  );
  const profile = selectSnapshotProfile(parseJsonBinding(profilesBinding, "snapshot profile catalog"), releaseId);
  const outputs = outputPaths(profile);
  await ordinaryFileMetadata(outputs.json, "snapshot JSON");
  await ordinaryFileMetadata(outputs.markdown, "snapshot Markdown");
  const snapshot = validateSnapshot(JSON.parse(await readFile(outputs.json, "utf8")));
  invariant(snapshot.releaseId === profile.releaseId && snapshot.snapshotId === profile.snapshotId, "snapshot identity differs from profile");
  invariant(await readFile(outputs.markdown, "utf8") === renderMarkdown(snapshot), "snapshot Markdown projection is stale");
  const current = await prepareBindings(profile, profilesPath);
  invariant(stableJson(snapshot.schema) === stableJson(current.schemaBinding.descriptor), "snapshot schema binding drifted");
  invariant(stableJson(snapshot.generator) === stableJson(current.generatorBinding.descriptor), "snapshot generator binding drifted");
  invariant(stableJson(snapshot.inputs) === stableJson(descriptors(current.inputBindings)), "snapshot input bindings drifted");
  const repository = await gitRepositoryState([outputs.relativeJson, outputs.relativeMarkdown]);
  invariant(stableJson(snapshot.repository) === stableJson(repository), "snapshot repository state drifted");
  if (!publicOnly) await verifyPrivateCommandLogs(snapshot, profile);
  return {profile, snapshot, outputs};
}

export function parseArguments(argv) {
  const options = {
    releaseId: null,
    profilesPath: DEFAULT_PROFILES,
    check: false,
    publicOnly: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--public-only") options.publicOnly = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--release-id" || argument === "--profiles") {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      if (argument === "--release-id") options.releaseId = value;
      else options.profilesPath = value;
    } else {
      throw new Error(`unknown option: ${argument}`);
    }
  }
  if (!options.help) invariant(LOGICAL_ID_PATTERN.test(options.releaseId || ""), "--release-id is required and must be portable");
  invariant(!options.publicOnly || options.check, "--public-only requires --check");
  return options;
}

function usage() {
  return `Usage:
  node scripts/capture-lesson-current-state-snapshot-v1.mjs --release-id <id>
  node scripts/capture-lesson-current-state-snapshot-v1.mjs --release-id <id> --check [--public-only]

Capture writes a no-replace CurrentStateSnapshotV1 plus ignored private command
logs. Failed diagnostics are recorded rather than promoted to success. The
capture aborts if any input or the withheld worktree fingerprint drifts while
commands run. --check never reruns diagnostics.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.check) {
    const result = await checkSnapshot(options);
    process.stdout.write(
      `PASS: ${result.snapshot.snapshotId} current bindings and ${options.publicOnly ? "public receipt" : "private command logs"} verified; ` +
      `${result.snapshot.observedState.passedDiagnosticCommandCount}/${result.snapshot.observedState.diagnosticCommandCount} diagnostics passed; ` +
      `strict ${result.snapshot.observedState.strictCompleteCount}/${result.snapshot.observedState.expectedMemberCount}; published false\n`,
    );
    return;
  }
  const result = await captureSnapshot(options);
  process.stdout.write(
    `WROTE: ${result.snapshot.snapshotId}; ${result.snapshot.observedState.passedDiagnosticCommandCount}/${result.snapshot.observedState.diagnosticCommandCount} diagnostics passed; ` +
    `strict ${result.snapshot.observedState.strictCompleteCount}/${result.snapshot.observedState.expectedMemberCount}; M0 exit false; published false\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
