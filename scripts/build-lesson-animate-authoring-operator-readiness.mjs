#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {stageDependencyFla} from "./run-assisted-animate-authoring-audit.mjs";
import {stageAnimateReleaseFlaCopies} from "./stage-animate-release-fla-copies.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const DEFAULT_PROBE = path.join(
  ROOT,
  "work",
  "animate",
  "jsfl-cli-probes",
  "run-erw427",
  "probe-result.json",
);
const ASSIST_ROOT_RELATIVE = "work/animate/dependency-authoring-audits";
const RUNNER_RELATIVE = "scripts/run-assisted-animate-authoring-audit.mjs";
const JSFL_RELATIVE = "scripts/animate-audit-current-document.jsfl";
const TOOLCHAIN_RELATIVE = "catalog/toolchain.json";
const GENERATOR_RELATIVE = "scripts/build-lesson-animate-authoring-operator-readiness.mjs";
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const OPERATOR_SENTINEL = "none";
const execFile = promisify(execFileCallback);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function rejectSymlinkComponents(base, candidate, label) {
  const resolvedBase = path.resolve(base);
  const resolvedCandidate = path.resolve(candidate);
  invariant(resolvedCandidate === resolvedBase || isInside(resolvedBase, resolvedCandidate),
    `${label} escapes ${resolvedBase}`);
  let cursor = resolvedBase;
  const relative = path.relative(resolvedBase, resolvedCandidate);
  for (const component of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (information) invariant(!information.isSymbolicLink(), `${label} contains a symbolic-link path component: ${cursor}`);
  }
}

async function fileIdentity(file, label, {mode = null, readOnly = false, executable = false} = {}) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  if (mode != null) {
    invariant((information.mode & 0o777) === mode,
      `${label} mode must be exactly ${mode.toString(8).padStart(4, "0")}`);
  }
  if (readOnly) invariant((information.mode & 0o222) === 0, `${label} must be read-only`);
  if (executable) await access(file, fsConstants.X_OK);
  const bytes = await readFile(file);
  return {
    information,
    bytes,
    binding: {
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
      ...(executable ? {executable: true} : {}),
    },
  };
}

async function projectFile(root, relativePath, label, options = {}) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath),
    `${label} path must be project-relative`);
  const file = path.resolve(root, relativePath);
  invariant(isInside(root, file), `${label} escapes the project root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label, options);
  return {
    file,
    information: identity.information,
    bytes: identity.bytes,
    binding: {file: relativePath.split(path.sep).join("/"), ...identity.binding},
  };
}

async function loadNamedOperatorAssignment(root, relativePath, releaseId) {
  if (relativePath == null) return null;
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      relativePath.split(path.sep).join("/") === relativePath &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.split("/").includes(".."),
    "operator assignment receipt path must be normalized, project-relative, and portable",
  );
  const record = await projectFile(root, relativePath, "named operator assignment receipt");
  invariant(record.information.nlink === 1, "named operator assignment receipt must not be hard-linked");
  const receipt = JSON.parse(record.bytes.toString("utf8"));
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.evidenceType === "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      receipt.releaseId === releaseId,
    "named operator assignment receipt schema, type, or release identity drifted",
  );
  invariant(
    receipt.ownerStatement?.exactUtf8 === "原始运行时／Animate 的具名人工操作员是Dr. Peter Hu",
    "named operator assignment statement drifted",
  );
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8, "utf8");
  invariant(
    receipt.ownerStatement.byteLength === statementBytes.length &&
      receipt.ownerStatement.sha256 === sha256(statementBytes),
    "named operator assignment statement byte binding drifted",
  );
  invariant(
    receipt.assignment?.roleId === "authorized-original-runtime-operator" &&
      receipt.assignment.slot === "primary" &&
      receipt.assignment.assigneeFullName === "Dr. Peter Hu" &&
      receipt.assignment.samePersonAsOwner === true &&
      receipt.assignment.explicit === true,
    "named operator role, slot, assignee, or explicit assignment drifted",
  );
  invariant(
    receipt.assigningAuthority?.ownerFullName === "Dr. Peter Hu" &&
      receipt.assigningAuthority.ownerRole === "Owner" &&
      receipt.assigningAuthority.externalSubjectId === null,
    "named operator assigning authority drifted",
  );
  const expectedDuties = new Set([
    "authorized-original-runtime-human-operator",
    "adobe-animate-human-dialog-operator",
  ]);
  invariant(
    Array.isArray(receipt.assignment.duties) &&
      receipt.assignment.duties.length === expectedDuties.size &&
      new Set(receipt.assignment.duties).size === receipt.assignment.duties.length &&
      receipt.assignment.duties.every((duty) => expectedDuties.has(duty)),
    "named operator duties drifted",
  );
  invariant(
    receipt.capacity?.minimumRequiredHoursPerWeek === 20 &&
      receipt.capacity.committedHoursPerWeek === null &&
      receipt.capacity.status === "not-stated",
    "named operator receipt fabricated weekly capacity",
  );
  invariant(
    receipt.externalSignatureEnvelope === null &&
      receipt.authorityBoundary?.assignmentUserAttested === true &&
      receipt.authorityBoundary.assigneeIdentityCryptographicallyVerified === false &&
      receipt.authorityBoundary.namedHumanRoleAssignmentEstablished === true &&
      receipt.authorityBoundary.namedRoleSlotCountEffect === 1 &&
      receipt.authorityBoundary.strictAcceptanceEffect === "named-primary-operator-role-only",
    "named operator receipt identity or role boundary drifted",
  );
  for (const field of [
    "weeklyCapacityCommitmentEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "animateGuiExecutionAuthorizedByThisReceiptAlone",
    "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
    "actualAnimateExecutionEstablished",
    "actualOriginalRuntimeSessionEstablished",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) {
    invariant(receipt.authorityBoundary[field] === false, `named operator receipt crossed ${field}`);
  }
  return {
    document: receipt,
    binding: {
      file: relativePath,
      sha256: record.binding.sha256,
      bytes: record.binding.bytes,
    },
  };
}

function verifyDeclaredIdentity(actual, declared, label) {
  invariant(declared && SHA256_PATTERN.test(declared.sha256 || ""), `${label} has no valid SHA-256 binding`);
  invariant(Number.isSafeInteger(declared.bytes) && declared.bytes >= 0, `${label} has no valid byte binding`);
  invariant(actual.binding.sha256 === declared.sha256, `${label} SHA-256 is stale`);
  invariant(actual.binding.bytes === declared.bytes, `${label} byte length is stale`);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/gu, `'"'"'`)}'`;
}

export function parseAnimateProcessTable(output, animateBinary) {
  return String(output)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d+)\s+(.*)$/u.exec(line);
      return match ? {pid: Number(match[1]), command: match[2]} : null;
    })
    .filter((entry) => entry && (entry.command === animateBinary || entry.command.startsWith(`${animateBinary} `)))
    .sort((left, right) => left.pid - right.pid);
}

async function inspectAnimateProcesses(animateBinary, processTableText) {
  const output = processTableText == null
    ? (await execFile("ps", ["-axo", "pid=,command="])).stdout
    : processTableText;
  const matches = parseAnimateProcessTable(output, animateBinary);
  const normalized = matches.map(({pid, command}) => `${pid} ${command}\n`).join("");
  return {matches, normalizedSha256: sha256(Buffer.from(normalized))};
}

function dependencyOptions(entry, animateBinary) {
  return {
    mode: "dependency-fla",
    evidenceSourceKind: "paired-fla-swf",
    dependencyFla: entry.sourceFla.file,
    pairedSwf: entry.sourceSwf.file,
    pairedSwfSha256: entry.sourceSwf.sha256,
    evidenceId: entry.animationId,
    sourceSha256: entry.sourceFla.sha256,
    captureFrame: 1,
    dialogOperator: null,
    prepareOnly: true,
    animateBinary,
    timeoutMs: 900_000,
  };
}

export function buildRunnerCommand({nodeExecutable, runnerFile, entry}) {
  const fixed = [
    runnerFile,
    "--dependency-fla", entry.sourceFla.file,
    "--evidence-id", entry.animationId,
    "--source-sha256", entry.sourceFla.sha256,
    "--capture-frame", "1",
    "--paired-swf", entry.sourceSwf.file,
    "--paired-swf-sha256", entry.sourceSwf.sha256,
  ];
  const prepareArgv = [...fixed, "--prepare-only"];
  const runArgv = [...fixed, "--dialog-operator", OPERATOR_SENTINEL];
  return {
    workingDirectory: ".",
    prepareOnly: {
      program: nodeExecutable,
      argv: prepareArgv,
      shell: [nodeExecutable, ...prepareArgv].map(shellQuote).join(" "),
      animateLaunches: false,
      dialogOperatorAccepted: false,
      status: "prepared-and-reverified-by-this-builder",
    },
    humanAssistedRun: {
      program: nodeExecutable,
      argvTemplate: runArgv,
      shellTemplate: [nodeExecutable, ...runArgv].map(shellQuote).join(" "),
      substitution: {
        token: OPERATOR_SENTINEL,
        field: "dialogOperator",
        requiredAtExecution: true,
        exactSingleSubstitutionOnly: true,
        unchangedTemplateFailsRunnerValidationBeforeAnimateLaunch: true,
        validation: "Supply one actual named human or stable human identity; never Codex, automation, bot, unknown, none, or n/a.",
      },
      oneFreshAnimateProcessForThisRowOnly: true,
      automatedDialogInteractionAllowed: false,
      documentSavePublishOrConversionAllowed: false,
    },
  };
}

function validateSourceBindingDocument(value, entry, historicalRunnerSha256) {
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding",
    `${entry.animationId}: paired assist binding schema changed`);
  invariant(value.evidenceId === entry.animationId && value.sourceKind === "paired-fla-swf",
    `${entry.animationId}: paired assist identity changed`);
  invariant(value.acceptanceEffect === "none; work-only authoring evidence preparation",
    `${entry.animationId}: paired assist binding claims acceptance authority`);
  invariant(value.source?.file === entry.sourceFla.file
    && value.source?.sha256 === entry.sourceFla.sha256
    && value.source?.bytes === entry.sourceFla.bytes,
  `${entry.animationId}: paired assist FLA source binding differs`);
  invariant(value.shippedSwf?.source?.file === entry.sourceSwf.file
    && value.shippedSwf?.source?.sha256 === entry.sourceSwf.sha256
    && value.shippedSwf?.source?.bytes === entry.sourceSwf.bytes,
  `${entry.animationId}: paired assist SWF source binding differs`);
  invariant(value.intendedAudit?.captureFrame === 1
    && value.intendedAudit?.recursiveRootAndLibraryTimelines === true
    && value.intendedAudit?.frameAndInstanceScriptInventory === true
    && value.intendedAudit?.nativeStagePng === true
    && value.intendedAudit?.saveOrPublishAllowed === false,
  `${entry.animationId}: paired assist intended-audit contract changed`);
  invariant(value.generatedBy?.file === RUNNER_RELATIVE && SHA256_PATTERN.test(value.generatedBy?.sha256 || ""),
    `${entry.animationId}: paired assist historical runner binding is invalid`);
  invariant(value.generatedBy.sha256 === historicalRunnerSha256,
    `${entry.animationId}: paired assist binding bytes and declared historical runner disagree`);
}

export function validateSourceBindingShape(value, entry) {
  validateSourceBindingDocument(value, entry, value?.generatedBy?.sha256);
  return true;
}

async function verifyIndependentCopy({root, declared, source, parent, label}) {
  invariant(declared?.file && !path.isAbsolute(declared.file), `${label} path must be project-relative`);
  const copyFile = path.resolve(root, declared.file);
  invariant(isInside(parent, copyFile), `${label} escapes its expected root`);
  await rejectSymlinkComponents(root, copyFile, label);
  const [copy, sourceIdentity] = await Promise.all([
    fileIdentity(copyFile, label, {mode: 0o444}),
    projectFile(root, source.file, `${label} source`),
  ]);
  verifyDeclaredIdentity(copy, declared, label);
  verifyDeclaredIdentity(sourceIdentity, source, `${label} source`);
  invariant(copy.binding.sha256 === sourceIdentity.binding.sha256 && copy.binding.bytes === sourceIdentity.binding.bytes,
    `${label} differs from its source`);
  invariant(copy.information.nlink === 1, `${label} must have exactly one hard link`);
  invariant(copy.information.dev !== sourceIdentity.information.dev || copy.information.ino !== sourceIdentity.information.ino,
    `${label} aliases its source inode`);
  return {...declared, mode: "0444", readOnly: true, byteIdenticalToSource: true, separateRegularFile: true};
}

async function verifyAssistPackage({root, entry, currentRunner}) {
  const assistRoot = path.join(root, ASSIST_ROOT_RELATIVE);
  const evidenceRoot = path.join(assistRoot, entry.animationId);
  invariant(isInside(assistRoot, evidenceRoot), `${entry.animationId}: paired assist root escapes the allowlist`);
  await rejectSymlinkComponents(root, evidenceRoot, `${entry.animationId}: paired assist root`);
  const bindingFile = path.join(evidenceRoot, "source-binding.json");
  const bindingIdentity = await fileIdentity(bindingFile, `${entry.animationId}: paired assist source binding`, {mode: 0o444});
  const value = JSON.parse(bindingIdentity.bytes.toString("utf8"));
  validateSourceBindingDocument(value, entry, value.generatedBy?.sha256);
  const [flaWorkingCopy, swfWorkingCopy] = await Promise.all([
    verifyIndependentCopy({
      root,
      declared: value.workingCopy,
      source: entry.sourceFla,
      parent: path.join(evidenceRoot, "working-copy"),
      label: `${entry.animationId}: paired assist FLA working copy`,
    }),
    verifyIndependentCopy({
      root,
      declared: value.shippedSwf.workingCopy,
      source: entry.sourceSwf,
      parent: path.join(evidenceRoot, "runtime-source"),
      label: `${entry.animationId}: paired assist SWF working copy`,
    }),
  ]);
  const historicalRunner = {
    file: value.generatedBy.file,
    sha256: value.generatedBy.sha256,
  };
  return {
    evidenceId: entry.animationId,
    sourceBinding: {
      file: portable(root, bindingFile),
      ...bindingIdentity.binding,
      readOnly: true,
    },
    flaWorkingCopy,
    swfWorkingCopy,
    historicalPreparationRunner: historicalRunner,
    currentExecutionRunner: currentRunner,
    runnerTransition: historicalRunner.sha256 === currentRunner.sha256
      ? "same-hash-current-runner"
      : "immutable-preparation-binds-historical-runner-current-execution-runner-differs",
    prepared: true,
    authoringAuditRun: false,
    workOnly: true,
    acceptanceEffect: false,
  };
}

function pngDimensions(bytes, label) {
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    `${label} is not a PNG`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function verifyProbe({root, probeFile, animateBinary, animateIdentity, jsfl}) {
  const probeRoot = path.join(root, "work", "animate", "jsfl-cli-probes");
  invariant(isInside(probeRoot, probeFile), "blank-document probe receipt must remain under work/animate/jsfl-cli-probes/");
  await rejectSymlinkComponents(root, probeFile, "blank-document probe receipt");
  const receipt = await fileIdentity(probeFile, "blank-document probe receipt");
  const value = JSON.parse(receipt.bytes.toString("utf8"));
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-jsfl-cli-probe",
    "blank-document probe schema changed");
  invariant(value.status === "passed" && value.scope === "disposable-blank-document" && value.failure == null,
    "blank-document probe is not a passing disposable-document receipt");
  invariant(value.command?.executable === animateBinary
    && value.command?.executableSha256 === animateIdentity.sha256
    && value.command?.intentionallyOmitsQuitFlag === true,
  "blank-document probe Animate executable binding changed");
  invariant(value.scripts?.auditTemplate?.file === jsfl.file
    && value.scripts?.auditTemplate?.sha256 === jsfl.sha256,
  "blank-document probe JSFL binding changed");
  invariant(value.process?.exitCode === 0 && value.process?.signal == null && value.process?.timedOut === false,
    "blank-document probe process did not exit cleanly");
  invariant(value.artifacts?.report?.animateVersion === "MAC 21,0,7,42652"
    && value.artifacts?.report?.documentName === "Untitled-1"
    && value.artifacts?.report?.stage?.width === 550
    && value.artifacts?.report?.stage?.height === 400
    && value.artifacts?.report?.fps === 24
    && value.artifacts?.report?.frameCount === 1,
  "blank-document probe report summary changed");

  const references = {
    generatedAudit: value.scripts.generatedAudit,
    controller: value.scripts.controller,
    stdout: value.process.stdout,
    stderr: value.process.stderr,
    marker: value.artifacts.marker,
    report: value.artifacts.report,
    png: value.artifacts.png,
  };
  const artifacts = {};
  for (const [name, reference] of Object.entries(references)) {
    invariant(reference?.file && SHA256_PATTERN.test(reference.sha256 || ""),
      `blank-document probe ${name} binding is malformed`);
    const artifact = await projectFile(root, reference.file, `blank-document probe ${name}`);
    invariant(artifact.binding.sha256 === reference.sha256,
      `blank-document probe ${name} SHA-256 is stale`);
    artifacts[name] = artifact.binding;
  }
  const actualPng = pngDimensions((await projectFile(root, value.artifacts.png.file, "blank-document probe PNG")).bytes,
    "blank-document probe PNG");
  invariant(actualPng.width === value.artifacts.png.width && actualPng.height === value.artifacts.png.height,
    "blank-document probe PNG dimensions are stale");
  return {
    receipt: {file: portable(root, probeFile), ...receipt.binding},
    status: "passed",
    scope: "disposable-blank-document",
    animateVersion: value.artifacts.report.animateVersion,
    process: {
      exitCode: value.process.exitCode,
      signal: value.process.signal,
      timedOut: value.process.timedOut,
      durationMs: value.process.durationMs,
    },
    artifacts,
    provesCurrentColdStartJsflOnGeneratedBlankDocument: true,
    provesAnyLegacyFlaCanOpenOrBeAudited: false,
    reusedAsReleaseFlaEvidence: false,
    authoringAuditEffect: false,
    acceptanceEffect: false,
  };
}

async function observeRunReceipts(root, animationId) {
  const runsRoot = path.join(root, ASSIST_ROOT_RELATIVE, animationId, "runs");
  if (!(await exists(runsRoot))) return {runDirectories: 0, receiptFiles: []};
  await rejectSymlinkComponents(root, runsRoot, `${animationId}: assisted-run receipt root`);
  const rootInfo = await lstat(runsRoot);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `${animationId}: assisted-run receipt root must be a real directory`);
  const entries = (await readdir(runsRoot, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  const receiptFiles = [];
  let runDirectories = 0;
  for (const entry of entries) {
    invariant(!entry.isSymbolicLink(), `${animationId}: assisted-run receipt root contains a symlink`);
    if (!entry.isDirectory()) continue;
    runDirectories += 1;
    const receiptFile = path.join(runsRoot, entry.name, "assisted-run-result.json");
    if (!(await exists(receiptFile))) continue;
    const information = await lstat(receiptFile);
    invariant(information.isFile() && !information.isSymbolicLink(), `${animationId}: run receipt must be a regular file`);
    receiptFiles.push(portable(root, receiptFile));
  }
  return {runDirectories, receiptFiles};
}

async function writeOrCheck(file, bytes, {root, check, label}) {
  invariant(isInside(path.join(root, "reports"), file), `${label} must be under reports/`);
  await rejectSymlinkComponents(root, file, label);
  if (check) {
    const current = await readFile(file);
    invariant(current.equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp-${process.pid}`;
  await rejectSymlinkComponents(root, temporary, `${label} temporary file`);
  try {
    await writeFile(temporary, bytes, {flag: "wx"});
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

function defaultReportFiles(root, release, shardId) {
  const prefix = `g${release.grade}-l${release.lesson}-animate-authoring-operator-readiness${shardId ? `-${shardId}` : ""}`;
  return {
    jsonReport: path.join(root, "reports", `${prefix}.json`),
    markdownReport: path.join(root, "reports", `${prefix}.md`),
    expectedResultIndex: `reports/g${release.grade}-l${release.lesson}-animate-authoring-audit-index.json`,
  };
}

function buildMarkdown(report, jsonIdentity) {
  const rows = report.queue.map((entry) => [
    entry.queueOrdinal,
    entry.releaseOrdinal,
    `\`${entry.animationId}\``,
    `\`${entry.shardId}\``,
    `\`${path.basename(entry.sourcePair.fla.file)}\``,
    entry.currentState,
  ].join(" | "));
  return [
    `# G${report.release.grade} L${report.release.lesson} Animate authoring operator readiness`,
    "",
    report.operatorAssignment.assigneeFullName
      ? `This is a release-driven, acceptance-neutral preparation and operator queue. It records ${report.operatorAssignment.assigneeFullName} as a user-attested named primary operator role, but launches no GUI, clicks no dialog, saves or publishes no document, records no actual session attestation or reviewer decision, and grants no execution or acceptance authority.`
      : "This is a release-driven, acceptance-neutral preparation and operator queue. It launches no GUI, clicks no dialog, saves or publishes no document, records no reviewer or owner identity, and grants no acceptance authority.",
    "",
    "## Current evidence state",
    "",
    `- Release: \`${report.release.releaseId}\``,
    `- Selected shard: \`${report.release.shardId ?? "all"}\``,
    `- Queue JSON: \`${jsonIdentity.file}\``,
    `- Queue JSON SHA-256: \`${jsonIdentity.sha256}\``,
    `- Release FLA/SWF pairs and exact 0444 release copies: ${report.summary.releaseStagingCopiesVerified}/${report.summary.flaBackedItems}`,
    `- Independent paired assist packages at exact 0444: ${report.summary.pairedAssistPackagesVerified}/${report.summary.flaBackedItems}`,
    `- SWF-only dispositions: ${report.summary.swfOnlyItems}`,
    `- Passing disposable blank-document probe: ${report.currentBlankDocumentProbe.status} (capability only; not legacy-FLA evidence)`,
    `- Matching Animate processes: ${report.processGate.matchingProcessCount}`,
    `- Process gate: **${report.processGate.state}**`,
    `- Named primary operator role: **${report.operatorAssignment.assigneeFullName ?? "not supplied"}**; actual session operator attestations: **${report.summary.actualSessionOperatorAttestationsRecorded}**`,
    `- Observed actual run receipts: ${report.resultIndexBoundary.observedAttemptReceiptFiles}`,
    `- Validated authoring audits: **${report.summary.authoringAuditsEstablished}/${report.summary.flaBackedItems}**`,
    `- Strict acceptance effect: **${report.summary.strictAcceptanceEffect}**`,
    "",
    "Prepared copies and commands are not authoring audits. Only a later, independently hash-valid result index may count actual append-only run receipts.",
    "",
    "## Operator protocol",
    "",
    `1. Fully quit Adobe Animate and rerun \`${report.operatorProtocol.preRunCheck}\` immediately before selecting a row.`,
    "2. Select exactly one queue row. Do not run rows concurrently or skip past a failure.",
    report.operatorAssignment.assigneeFullName
      ? `3. Only after a separate immutable one-row execution authorization, replace the single \`none\` sentinel with the exact assigned human \`${report.operatorAssignment.assigneeFullName}\`. The role receipt alone does not permit launch, and the unchanged template fails runner validation before launch.`
      : "3. In that row's `humanAssistedRun.argvTemplate`, replace the single `none` sentinel with the actual named dialog operator. The unchanged template fails runner validation before launch.",
    "4. The named human may acknowledge only the legacy ActionScript conversion warning. Do not automate or interact with any other dialog.",
    "5. Do not save, convert, publish, or export the document. The runner may write only bounded work evidence, closes without saving, and quits.",
    "6. Confirm Animate is fully gone before the next row. Preserve failed receipts; do not rewrite them as passing.",
    "7. Validate actual receipts with a separate result-index workflow before making any authoring-coverage statement.",
    "",
    "## Queue",
    "",
    "Queue | Release | Animation | Shard | FLA | State",
    "---: | ---: | --- | --- | --- | ---",
    ...rows,
    "",
    "## Boundaries",
    "",
    ...report.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

export async function buildLessonAnimateAuthoringOperatorReadiness({
  root = ROOT,
  releaseId,
  shardId = null,
  check = false,
  probeFile = null,
  animateBinary = DEFAULT_ANIMATE_BINARY,
  operatorAssignmentReceipt = null,
  jsonReport = null,
  markdownReport = null,
  processTableText = null,
  persist = true,
} = {}) {
  invariant(ID_PATTERN.test(releaseId || ""), "--release-id must be a safe release ID");
  invariant(shardId == null || ID_PATTERN.test(shardId), "--shard-id must be a safe shard ID");
  const effectiveProbe = probeFile
    ? (path.isAbsolute(probeFile) ? path.resolve(probeFile) : path.resolve(root, probeFile))
    : path.join(root, path.relative(ROOT, DEFAULT_PROBE));
  const effectiveAnimateBinary = path.resolve(animateBinary);

  const stage = await stageAnimateReleaseFlaCopies({root, releaseId, shardId, check});
  const release = stage.manifest.release;
  const namedOperator = await loadNamedOperatorAssignment(
    root,
    operatorAssignmentReceipt,
    releaseId,
  );
  invariant(stage.manifest.schemaVersion === 1
    && stage.manifest.evidenceKind === "lesson-release-adobe-animate-prepare-only-fla-staging",
  `${releaseId}: unexpected release staging manifest`);
  invariant(stage.manifest.summary?.flaBackedItems === stage.manifest.entries.length
    && stage.manifest.summary?.swfOnlyItems === stage.manifest.noFlaDispositions.length,
  `${releaseId}: release staging counts are stale`);
  invariant(stage.manifest.summary?.authoringAuditsCompleted === 0
    && stage.manifest.summary?.strictAcceptanceEffect === false,
  `${releaseId}: release staging no longer describes acceptance-neutral preparation`);
  invariant(stage.manifest.entries.every((entry, index, entries) => index === 0 || entry.releaseOrdinal > entries[index - 1].releaseOrdinal),
    `${releaseId}: FLA staging entries are not in strict release order`);

  const reportDefaults = defaultReportFiles(root, release, shardId);
  const effectiveJsonReport = jsonReport ? path.resolve(jsonReport) : reportDefaults.jsonReport;
  const effectiveMarkdownReport = markdownReport ? path.resolve(markdownReport) : reportDefaults.markdownReport;

  const [runner, jsfl, toolchain, generator, nodeExecutable] = await Promise.all([
    projectFile(root, RUNNER_RELATIVE, "Animate assist runner"),
    projectFile(root, JSFL_RELATIVE, "recursive Animate JSFL audit template"),
    projectFile(root, TOOLCHAIN_RELATIVE, "toolchain catalog"),
    projectFile(root, GENERATOR_RELATIVE, "lesson Animate operator-readiness generator"),
    fileIdentity(process.execPath, "Node.js executable", {executable: true}),
  ]);
  const toolchainValue = JSON.parse(toolchain.bytes.toString("utf8"));
  invariant(toolchainValue.schemaVersion === 1
    && toolchainValue.authoringEvidence?.adobeAnimateDetected === true
    && toolchainValue.authoringEvidence?.application === "Adobe Animate 2021"
    && toolchainValue.authoringEvidence?.productVersion === "21.0.7",
  "toolchain does not declare the expected licensed Adobe Animate 2021 capability");
  const declaredApplicationRoot = path.resolve(toolchainValue.authoringEvidence.applicationPath);
  invariant(effectiveAnimateBinary.startsWith(`${declaredApplicationRoot}${path.sep}`),
    "Animate executable is outside the toolchain-declared application root");
  const animate = await fileIdentity(effectiveAnimateBinary, "Adobe Animate executable", {executable: true});
  const infoPlistFile = path.resolve(path.dirname(effectiveAnimateBinary), "..", "Info.plist");
  const infoPlist = await fileIdentity(infoPlistFile, "Adobe Animate Info.plist");
  const probe = await verifyProbe({
    root,
    probeFile: effectiveProbe,
    animateBinary: effectiveAnimateBinary,
    animateIdentity: animate.binding,
    jsfl: jsfl.binding,
  });
  const processSnapshot = await inspectAnimateProcesses(effectiveAnimateBinary, processTableText);

  const assistPackages = [];
  const receiptObservations = [];
  for (const entry of stage.manifest.entries) {
    if (!check) await stageDependencyFla(dependencyOptions(entry, effectiveAnimateBinary), {root});
    const assistPackage = await verifyAssistPackage({root, entry, currentRunner: runner.binding});
    assistPackages.push(assistPackage);
    receiptObservations.push({animationId: entry.animationId, ...(await observeRunReceipts(root, entry.animationId))});
  }
  const observedReceiptFiles = receiptObservations.reduce((total, item) => total + item.receiptFiles.length, 0);
  const observedRunDirectories = receiptObservations.reduce((total, item) => total + item.runDirectories, 0);
  const processBlocked = processSnapshot.matches.length > 0;

  const queue = stage.manifest.entries.map((entry, index) => {
    const assistPackage = assistPackages[index];
    return {
      queueOrdinal: index + 1,
      releaseOrdinal: entry.releaseOrdinal,
      animationId: entry.animationId,
      assetId: entry.assetId,
      releaseRole: entry.releaseRole,
      shardId: entry.shardId,
      sourcePair: {
        sourceKind: "fla+swf",
        fla: entry.sourceFla,
        swf: entry.sourceSwf,
        bothSourceFreezeBound: true,
        shippedSwfExecutedByAuthoringAudit: false,
        flaSwfEquivalenceProven: false,
      },
      releaseStagingCopy: entry.workingCopy,
      pairedAssistPreparation: assistPackage,
      command: buildRunnerCommand({
        nodeExecutable: process.execPath,
        runnerFile: RUNNER_RELATIVE,
        entry,
      }),
      operatorInputs: {
        captureFrame: {
          value: 1,
          flashFrameIndexing: "one-indexed",
          purpose: "native authoring PNG only; recursive JSFL inventories root and library timelines independently",
          originalRuntimeEvidence: false,
        },
        dialogOperator: {
          status: namedOperator
            ? "named-role-bound-session-substitution-and-execution-authorization-pending"
            : "not-supplied",
          namedRoleAssignee: namedOperator
            ? namedOperator.document.assignment.assigneeFullName
            : null,
          requiredAtExecution: true,
          onlyAuthorizedAction: "acknowledge the legacy ActionScript conversion warning for this one FLA",
          reviewerOrOwnerAuthority: false,
        },
      },
      resultObservation: receiptObservations[index],
      currentState: processBlocked
        ? namedOperator
          ? "blocked-animate-already-running-named-role-bound-session-execution-unauthorized"
          : "blocked-animate-already-running-and-awaiting-named-human"
        : namedOperator
          ? "prepared-named-operator-bound-session-execution-authorization-pending"
          : "prepared-awaiting-explicit-named-human-one-row-run",
      evidenceState: {
        sourceAndPreparation: true,
        authoringAudit: false,
        originalRuntimeBehavior: false,
        javascriptFidelity: false,
        rmse: false,
        audioAcceptance: false,
        humanReview: false,
        ownerAcceptance: false,
        strictAcceptance: false,
        migrationComplete: false,
        publication: false,
      },
    };
  });

  const stageManifestIdentity = await fileIdentity(stage.manifestFile, "release FLA staging manifest", {mode: 0o444});
  const stageQueueIdentity = await fileIdentity(stage.queueFile, "release prepare-only queue", {mode: 0o444});
  const resultIndexPresent = await exists(path.join(root, reportDefaults.expectedResultIndex));
  const preRunCheck = [
    "node",
    GENERATOR_RELATIVE,
    "--release-id",
    releaseId,
    ...(shardId ? ["--shard-id", shardId] : []),
    "--check",
  ].map(shellQuote).join(" ");
  const report = {
    schemaVersion: 2,
    reportType: "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness",
    release,
    scope: `Hash-bound, ordered operator readiness for ${queue.length} FLA-backed release members; preparation/check only, no GUI execution and no acceptance authority`,
    authorityBoundary: {
      sourceAndReadOnlyPreparation: true,
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      javascriptImplementationOrFidelity: false,
      rmse: false,
      audioListeningOrSynchronization: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
    },
    inputs: {
      releaseStagingManifest: {
        file: portable(root, stage.manifestFile),
        ...stageManifestIdentity.binding,
        contentAddressVerified: path.basename(stage.manifestFile) === `${stage.manifestSha256}.json`,
      },
      releasePrepareOnlyQueue: {
        file: portable(root, stage.queueFile),
        ...stageQueueIdentity.binding,
        contentAddressVerified: path.basename(stage.queueFile) === `${stage.queueSha256}.json`,
      },
      recursiveJsflAuditTemplate: jsfl.binding,
      assistRunner: runner.binding,
      toolchain: toolchain.binding,
      node: {
        version: process.version,
        executable: {file: process.execPath, ...nodeExecutable.binding},
      },
      adobeAnimate: {
        product: toolchainValue.authoringEvidence.application,
        productVersion: toolchainValue.authoringEvidence.productVersion,
        executable: {file: effectiveAnimateBinary, ...animate.binding},
        infoPlist: {file: infoPlistFile, ...infoPlist.binding},
        coldStartInvocationShape: ["--run-jsfl", "-o", "<absolute-controller.jsfl>"],
        launchedByThisBuilder: false,
      },
      currentBlankDocumentProbeReceipt: probe.receipt,
      generator: generator.binding,
      namedOperatorAssignmentReceipt: namedOperator
        ? namedOperator.binding
        : null,
    },
    operatorAssignment: namedOperator
      ? {
          status: "named-primary-role-bound-session-execution-unauthorized",
          roleId: namedOperator.document.assignment.roleId,
          slot: namedOperator.document.assignment.slot,
          assigneeFullName: namedOperator.document.assignment.assigneeFullName,
          duties: namedOperator.document.assignment.duties,
          identityEvidence: "user-attested-current-codex-task",
          cryptographicallyVerified: false,
          weeklyCapacityEstablished: false,
          hostApproved: false,
          containmentApproved: false,
          immutableSessionAuthorizationEstablished: false,
          animateGuiExecutionAuthorized: false,
          originalRuntimeExecutionAuthorized: false,
          actualSessionOperatorAttestationPresent: false,
          receipt: namedOperator.binding,
        }
      : {
          status: "not-supplied",
          roleId: "authorized-original-runtime-operator",
          slot: null,
          assigneeFullName: null,
          duties: [],
          identityEvidence: null,
          cryptographicallyVerified: false,
          weeklyCapacityEstablished: false,
          hostApproved: false,
          containmentApproved: false,
          immutableSessionAuthorizationEstablished: false,
          animateGuiExecutionAuthorized: false,
          originalRuntimeExecutionAuthorized: false,
          actualSessionOperatorAttestationPresent: false,
          receipt: null,
        },
    safetyContract: {
      builderLaunchesOrInteractsWithAnimate: false,
      automatedDialogClicks: 0,
      operatorIdentityRecordedByBuilder: false,
      namedRoleIdentityRecordedFromReceipt: namedOperator !== null,
      actualSessionOperatorIdentityRecordedByBuilder: false,
      documentSaveConvertPublishOrExportActions: 0,
      sourceAssetWrites: false,
      migrationStatusReviewLedgerOrAcceptanceWrites: false,
      workOnlyReadOnlyCopyAndBindingWritesAllowedInPreparationMode: true,
      checkModeWritesNothing: true,
      oneItemPerFreshAnimateProcess: true,
      concurrency: 1,
      onlyAllowedHumanInteraction: "The supplied named human may acknowledge only the legacy ActionScript conversion warning for the one selected FLA; leave every other dialog untouched.",
      requiredCloseDisposition: "Close without saving and fully quit Animate before the next row.",
      actualReceiptsRequireIndependentResultIndex: true,
    },
    processGate: {
      inspection: {
        program: "ps",
        argv: ["-axo", "pid=,command="],
        parser: "exact executable or exact executable-plus-arguments prefix only",
        recordedSnapshot: "matching Animate processes only; unrelated process rows are not retained",
        matchingRowsSha256: processSnapshot.normalizedSha256,
        launchesOrInteractsWithAnimate: false,
      },
      animateExecutable: {file: effectiveAnimateBinary, sha256: animate.binding.sha256, bytes: animate.binding.bytes},
      matchingProcessCount: processSnapshot.matches.length,
      matchingProcesses: processSnapshot.matches,
      animateRunning: processBlocked,
      state: processBlocked
        ? "blocked-animate-already-running"
        : namedOperator
          ? "closed-named-operator-bound-session-execution-authorization-required"
          : "closed-awaiting-explicit-named-human-one-row-run",
      humanAssistedRunAllowedNow: false,
      reason: processBlocked
        ? "An exact Adobe Animate executable process is already open; every row requires a fresh, exclusive cold start."
        : namedOperator
          ? "Static prerequisites and a user-attested named primary operator role are bound, but weekly capacity, per-row session authorization, host/containment controls, and GUI execution authority remain absent."
          : "Static prerequisites are ready, but this report supplies no named human and authorizes no GUI execution.",
      resumeCondition: namedOperator
        ? "Bind the approved host/containment context and immutable one-row session authorization, then fully quit Animate, rerun the exact --check command, and replace the unchanged none sentinel with the same named human only for that authorized row."
        : "Fully quit Animate, rerun the exact --check command, select one row, and supply one real named dialog operator to that row only.",
    },
    currentBlankDocumentProbe: probe,
    resultIndexBoundary: {
      assistRoot: ASSIST_ROOT_RELATIVE,
      observedRunDirectories,
      observedAttemptReceiptFiles: observedReceiptFiles,
      observedReceiptPaths: receiptObservations.flatMap((item) => item.receiptFiles),
      receiptsValidatedByThisReadinessBuilder: 0,
      authoringAuditsEstablishedByThisReadinessBuilder: 0,
      expectedIndependentResultIndex: reportDefaults.expectedResultIndex,
      resultIndexPresent,
      currentState: observedReceiptFiles === 0
        ? "no-actual-run-receipts-authoring-coverage-zero"
        : "actual-receipts-observed-but-unvalidated-separate-result-index-required",
      rule: "Prepared packages and observed receipt filenames never count as authoring audits. A separate result index must re-hash and validate every source binding, receipt, process result, script, report, PNG, and work-evidence closure.",
    },
    summary: {
      selectedMembers: stage.manifest.summary.selectedMembers,
      flaBackedItems: queue.length,
      swfOnlyItems: stage.manifest.noFlaDispositions.length,
      sourcePairsVerified: queue.length,
      releaseStagingCopiesVerified: queue.length,
      pairedAssistPackagesVerified: assistPackages.length,
      exactPrepareOnlyCommandsRecorded: queue.length,
      exactHumanAssistedCommandTemplatesRecorded: queue.length,
      namedPrimaryOperatorRoleAssignmentsRecorded: namedOperator ? 1 : 0,
      actualSessionOperatorAttestationsRecorded: 0,
      pendingHumanAssistedRuns: queue.length,
      observedAttemptReceiptFiles: observedReceiptFiles,
      animateGuiExecutionsByThisBuilder: 0,
      authoringAuditsEstablished: 0,
      originalRuntimeBaselinesEstablished: 0,
      humanVisualReviewsEstablished: 0,
      ownerAcceptancesEstablished: 0,
      strictAcceptancesEstablished: 0,
      strictAcceptanceEffect: false,
    },
    operatorProtocol: {
      queueOrder: "ascending releaseOrdinal over the selected release/shard FLA-backed members",
      preRunCheck,
      concurrency: 1,
      freshAnimateProcessPerItem: true,
      namedDialogOperatorRequiredAtExecution: true,
      assignedOperatorBindingEnforcedByRunner: false,
      immutablePerRowSessionAuthorizationPresent: false,
      unchangedOperatorSentinelRejectedBeforeLaunch: true,
      doNotSkipAheadAfterFailure: true,
      successfulWorkEvidenceStillRequiresIndependentResultIndex: true,
      noReviewOwnerStrictOrPublicationAuthority: true,
    },
    noFlaDispositions: stage.manifest.noFlaDispositions,
    queue,
    limitations: [
      "The release-staged and paired-assist copies prove byte identity and read-only preparation only; they are not authoring audits.",
      "The paired-source runner opens only the staged FLA. It does not execute the shipped SWF or prove FLA/SWF equivalence.",
      "The passing blank-document probe proves cold-start JSFL capability on a generated document only; it is never reused as legacy-FLA evidence.",
      "Animate 2021 can alter or remove legacy ActionScript during in-memory conversion; shipped SWF bytecode remains authoritative for runtime scripts.",
      namedOperator
        ? "This report records one user-attested named primary operator role only. It records no actual session operator attestation, reviewer decision, weekly capacity, host/containment approval, immutable session authorization, or GUI execution authority."
        : "This report intentionally records no dialog operator, reviewer, or owner identity and cannot authorize a GUI session.",
      "An authoring report and PNG do not establish original-runtime behavior, interaction, branches, localization, audio, Replay, RMSE, human review, owner acceptance, strict completion, or publication.",
    ],
  };

  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {
    file: portable(root, effectiveJsonReport),
    sha256: sha256(jsonBytes),
    bytes: jsonBytes.length,
  };
  const markdownBytes = Buffer.from(buildMarkdown(report, jsonIdentity));
  if (persist) {
    await writeOrCheck(effectiveJsonReport, jsonBytes, {root, check, label: "lesson Animate operator-readiness JSON"});
    await writeOrCheck(effectiveMarkdownReport, markdownBytes, {root, check, label: "lesson Animate operator-readiness Markdown"});
  }
  return {
    report,
    jsonIdentity,
    jsonReport: effectiveJsonReport,
    markdownReport: effectiveMarkdownReport,
  };
}

export function parseArguments(argv) {
  const options = {
    releaseId: null,
    shardId: null,
    check: false,
    probeFile: null,
    animateBinary: DEFAULT_ANIMATE_BINARY,
    operatorAssignmentReceipt: null,
    jsonReport: null,
    markdownReport: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--release-id") options.releaseId = argv[++index] || invariant(false, "--release-id requires a value");
    else if (value === "--shard-id") options.shardId = argv[++index] || invariant(false, "--shard-id requires a value");
    else if (value === "--probe") options.probeFile = argv[++index] || invariant(false, "--probe requires a path");
    else if (value === "--animate-binary") options.animateBinary = argv[++index] || invariant(false, "--animate-binary requires a path");
    else if (value === "--operator-assignment-receipt") options.operatorAssignmentReceipt = argv[++index] || invariant(false, "--operator-assignment-receipt requires a path");
    else if (value === "--json-report") options.jsonReport = argv[++index] || invariant(false, "--json-report requires a path");
    else if (value === "--markdown-report") options.markdownReport = argv[++index] || invariant(false, "--markdown-report requires a path");
    else if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(options.help || ID_PATTERN.test(options.releaseId || ""), "--release-id is required and must be a safe release ID");
  invariant(options.help || options.shardId == null || ID_PATTERN.test(options.shardId), "--shard-id must be a safe shard ID");
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-lesson-animate-authoring-operator-readiness.mjs --release-id <id> [options]",
    "",
    "Verifies exact release/shard/source identities, exact-mode-0444 release staging",
    "and independent paired assist packages, the recursive JSFL, assist runner,",
    "Animate/Node tool identities, a passing disposable-document probe, and the",
    "live Animate process gate. It writes an ordered, acceptance-neutral operator",
    "queue. It never launches or interacts with Adobe Animate.",
    "",
    "Normal mode may create only work/animate/dependency-authoring-audits read-only",
    "paired FLA/SWF copies and immutable source-binding files. --check writes nothing.",
    "Neither mode writes migration, status, review, ledger, source, or acceptance data.",
    "",
    "Options:",
    "  --release-id <id>       Exact catalog/lesson-releases.json releaseId",
    "  --shard-id <id>         Optional exact release shard",
    "  --probe <file>          Passing disposable blank-document probe receipt",
    "  --animate-binary <file> Exact Adobe Animate executable",
    "  --operator-assignment-receipt <file>  Optional project-relative named-human role receipt; never session execution authority",
    "  --json-report <file>    Output JSON under reports/",
    "  --markdown-report <file> Output Markdown under reports/",
    "  --check                 Recompute and compare reports; create nothing",
    "  -h, --help              Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildLessonAnimateAuthoringOperatorReadiness(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "prepared",
    releaseId: result.report.release.releaseId,
    shardId: result.report.release.shardId,
    summary: result.report.summary,
    processGate: result.report.processGate.state,
    resultIndexBoundary: result.report.resultIndexBoundary.currentState,
    animateLaunched: false,
    dialogInteraction: false,
    authoringAuditsEstablished: 0,
    strictAcceptanceEffect: false,
    report: result.jsonIdentity,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
