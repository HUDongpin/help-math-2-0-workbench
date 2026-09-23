#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const DEFAULT_READINESS = path.join(ROOT, "reports", "g4-l3-animate-prepare-readiness.json");
const DEFAULT_ASSIST_ROOT = path.join(ROOT, "work", "animate", "dependency-authoring-audits");
const DEFAULT_JSON_REPORT = path.join(ROOT, "reports", "g4-l3-animate-authoring-operator-queue.json");
const DEFAULT_MARKDOWN_REPORT = path.join(ROOT, "reports", "g4-l3-animate-authoring-operator-queue.md");
const DEFAULT_CURRENT_PROBE = path.join(ROOT, "work", "animate", "jsfl-cli-probes", "run-erw427", "probe-result.json");
const EXPECTED_COUNT = 29;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
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

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
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
    if (!information) continue;
    invariant(!information.isSymbolicLink(), `${label} contains a symbolic-link path component: ${cursor}`);
  }
}

async function fileIdentity(file, label, {mode = null, readOnly = false} = {}) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  if (mode != null) {
    invariant((information.mode & 0o777) === mode,
      `${label} mode must be exactly ${mode.toString(8).padStart(4, "0")}`);
  }
  if (readOnly) invariant((information.mode & 0o222) === 0, `${label} must be read-only`);
  const bytes = await readFile(file);
  return {
    information,
    bytes,
    binding: {
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
    },
  };
}

async function projectFile(root, relativePath, label, options = {}) {
  invariant(typeof relativePath === "string" && !path.isAbsolute(relativePath), `${label} path must be project-relative`);
  const file = path.resolve(root, relativePath);
  invariant(isInside(root, file), `${label} escapes the project root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label, options);
  return {
    file,
    bytes: identity.bytes,
    information: identity.information,
    binding: {file: relativePath.split(path.sep).join("/"), ...identity.binding},
  };
}

function parseSourceManifest(bytes) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line) continue;
    const match = /^([0-9a-f]{64})  (.+)$/u.exec(line);
    invariant(match, `source manifest line ${index + 1} is malformed`);
    invariant(!entries.has(match[2]), `source manifest contains a duplicate path: ${match[2]}`);
    entries.set(match[2], match[1]);
  }
  return entries;
}

function archiveRelative(sourcePath) {
  invariant(sourcePath.startsWith(`${SOURCE_PREFIX}/`), `source path is outside the canonical archive: ${sourcePath}`);
  return sourcePath.slice(`${SOURCE_PREFIX}/`.length);
}

function verifyDeclaredIdentity(actual, declared, label) {
  invariant(declared && SHA256_PATTERN.test(declared.sha256 || ""), `${label} has no valid SHA-256 binding`);
  invariant(Number.isInteger(declared.bytes) && declared.bytes > 0, `${label} has no valid byte binding`);
  invariant(actual.binding.sha256 === declared.sha256, `${label} SHA-256 is stale`);
  invariant(actual.binding.bytes === declared.bytes, `${label} byte length is stale`);
}

function verifyHistoricalBinding(declared, label) {
  invariant(declared?.file && typeof declared.file === "string" && !path.isAbsolute(declared.file),
    `${label} has no valid project-relative file binding`);
  invariant(SHA256_PATTERN.test(declared.sha256 || ""), `${label} has no valid SHA-256 binding`);
  invariant(Number.isInteger(declared.bytes) && declared.bytes > 0, `${label} has no valid byte binding`);
  return {file: declared.file.split(path.sep).join("/"), sha256: declared.sha256, bytes: declared.bytes};
}

function sameFileIdentity(left, right) {
  return left?.file === right?.file && left?.sha256 === right?.sha256 && left?.bytes === right?.bytes;
}

async function verifySource({root, sourceRealRoot, sourceManifest, declared, extension, label}) {
  invariant(declared?.file && path.extname(declared.file).toLowerCase() === extension, `${label} has the wrong extension`);
  const file = path.resolve(root, declared.file);
  invariant(isInside(path.join(root, SOURCE_PREFIX), file), `${label} escapes the canonical archive`);
  await rejectSymlinkComponents(root, file, label);
  const real = await realpath(file);
  invariant(isInside(sourceRealRoot, real), `${label} resolves outside the canonical archive`);
  const identity = await fileIdentity(file, label);
  verifyDeclaredIdentity(identity, declared, label);
  const relative = archiveRelative(declared.file);
  invariant(sourceManifest.get(relative) === identity.binding.sha256, `${label} source-freeze binding is missing or stale`);
  return {file, identity, binding: {...declared, sourceFreezeManifestPath: relative, sourceFreezeBound: true}};
}

async function verifyCopy({root, declared, expected, parent, label, exactMode = true}) {
  invariant(declared?.file && !path.isAbsolute(declared.file), `${label} path must be project-relative`);
  const file = path.resolve(root, declared.file);
  invariant(isInside(parent, file), `${label} escapes its staging root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label, exactMode ? {mode: 0o444} : {readOnly: true});
  verifyDeclaredIdentity(identity, declared, label);
  invariant(identity.information.nlink === 1, `${label} must have exactly one hard link`);
  invariant(identity.binding.sha256 === expected.identity.binding.sha256 && identity.binding.bytes === expected.identity.binding.bytes,
    `${label} differs from its source`);
  invariant(identity.information.dev !== expected.identity.information.dev || identity.information.ino !== expected.identity.information.ino,
    `${label} aliases its source inode`);
  return {file, identity, binding: {...declared, mode: identity.binding.mode, readOnly: true, byteIdenticalToSource: true, separateRegularFile: true}};
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
  return parseAnimateProcessTable(output, animateBinary);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/gu, `'"'"'`)}'`;
}

function buildCommand({sourceFla, sourceSwf, evidenceId, captureFrame}) {
  const operatorToken = "<HUMAN-NAME-OR-STABLE-ID>";
  const fixedArgs = [
    "run", "audit:animate:assist", "--",
    "--dependency-fla", sourceFla.file,
    "--evidence-id", evidenceId,
    "--source-sha256", sourceFla.sha256,
    "--capture-frame", String(captureFrame),
    "--paired-swf", sourceSwf.file,
    "--paired-swf-sha256", sourceSwf.sha256,
  ];
  const prepareArgs = [...fixedArgs, "--prepare-only"];
  const fullArgs = [...fixedArgs, "--dialog-operator", operatorToken];
  return {
    prepareOnlyVerification: {
      program: "npm",
      argv: prepareArgs,
      shell: ["npm", ...prepareArgs].map(shellQuote).join(" "),
      animateLaunches: false,
      status: "already-prepared-and-verified-by-this-queue",
    },
    humanAssistedRun: {
      program: "npm",
      argvTemplate: fullArgs,
      shellTemplate: ["npm", ...fullArgs].map(shellQuote).join(" "),
      substitution: {
        token: operatorToken,
        field: "dialogOperator",
        required: true,
        validation: "A named human or stable human identity, 2-128 characters, containing a letter; never Codex, automation, bot, unknown, none, or n/a.",
      },
      exactAfterSingleDeclaredSubstitution: true,
      oneFreshAnimateProcessForThisItemOnly: true,
    },
  };
}

async function loadBoundReport(root, file, label) {
  invariant(isInside(path.join(root, "reports"), file), `${label} must be under reports/`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label);
  return {identity, value: JSON.parse(identity.bytes.toString("utf8"))};
}

async function loadPreparation({root, readinessFile}) {
  const readiness = await loadBoundReport(root, readinessFile, "G4 L3 Animate preparation report");
  const value = readiness.value;
  invariant(value.schemaVersion === 1 && value.reportType === "g4-l3-adobe-animate-prepare-only-readiness",
    "unexpected G4 L3 Animate preparation report schema");
  invariant(value.summary?.flaBackedItems === EXPECTED_COUNT && value.summary?.copiesReady === EXPECTED_COUNT,
    `G4 L3 Animate preparation must contain exactly ${EXPECTED_COUNT} ready FLA copies`);
  invariant(value.summary?.authoringAuditsCompleted === 0 && value.summary?.strictAcceptanceEffect === false,
    "G4 L3 Animate preparation is no longer acceptance-neutral and pending");
  invariant(value.authorityBoundary?.adobeAnimateAuthoringAudit === false
    && value.authorityBoundary?.originalRuntimeBehavior === false
    && value.authorityBoundary?.humanReview === false
    && value.authorityBoundary?.ownerAcceptance === false
    && value.authorityBoundary?.strictAcceptanceEffect === false,
  "G4 L3 Animate preparation authority boundary changed");

  const manifestReference = value.contentAddressedManifest;
  invariant(manifestReference?.file && SHA256_PATTERN.test(manifestReference.sha256 || ""),
    "G4 L3 Animate preparation has no content-addressed manifest binding");
  const manifest = await projectFile(root, manifestReference.file, "G4 L3 content-addressed staging manifest", {mode: 0o444});
  verifyDeclaredIdentity(manifest, manifestReference, "G4 L3 content-addressed staging manifest");
  invariant(path.basename(manifest.file) === `${manifest.binding.sha256}.json`,
    "G4 L3 staging manifest filename is not content-addressed by its bytes");
  const manifestValue = JSON.parse(manifest.bytes.toString("utf8"));
  invariant(manifestValue.schemaVersion === 1
    && manifestValue.evidenceKind === "g4-l3-adobe-animate-prepare-only-fla-staging",
  "unexpected G4 L3 staging manifest schema");
  invariant(manifestValue.summary?.flaBackedItems === EXPECTED_COUNT && manifestValue.entries?.length === EXPECTED_COUNT,
    `G4 L3 staging manifest must contain exactly ${EXPECTED_COUNT} entries`);
  invariant(manifestValue.summary?.animateGuiExecutions === 0
    && manifestValue.summary?.authoringAuditsCompleted === 0
    && manifestValue.summary?.strictAcceptanceEffect === false,
  "G4 L3 staging manifest no longer describes prepare-only work");
  return {
    readiness: {
      file: portable(root, readinessFile),
      sha256: readiness.identity.binding.sha256,
      bytes: readiness.identity.binding.bytes,
    },
    readinessValue: value,
    manifest: manifest.binding,
    manifestValue,
  };
}

async function verifyCurrentBlankDocumentProbe({root, probeFile, animateBinary, animate, jsfl}) {
  invariant(isInside(path.join(root, "work", "animate", "jsfl-cli-probes"), probeFile),
    "current Animate probe receipt must remain under work/animate/jsfl-cli-probes/");
  await rejectSymlinkComponents(root, probeFile, "current Animate blank-document probe receipt");
  const receiptIdentity = await fileIdentity(probeFile, "current Animate blank-document probe receipt");
  const value = JSON.parse(receiptIdentity.bytes.toString("utf8"));
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-jsfl-cli-probe",
    "current Animate blank-document probe schema changed");
  invariant(value.status === "passed" && value.scope === "disposable-blank-document" && value.failure == null,
    "current Animate blank-document probe is not a passing disposable-document receipt");
  invariant(value.command?.executable === animateBinary
    && value.command?.executableSha256 === animate.binding.sha256
    && value.command?.intentionallyOmitsQuitFlag === true,
  "current Animate blank-document probe executable binding changed");
  invariant(value.scripts?.auditTemplate?.file === jsfl.binding.file
    && value.scripts?.auditTemplate?.sha256 === jsfl.binding.sha256,
  "current Animate blank-document probe JSFL binding changed");
  invariant(value.process?.exitCode === 0 && value.process?.signal == null && value.process?.timedOut === false,
    "current Animate blank-document probe process did not exit cleanly");
  invariant(value.artifacts?.report?.animateVersion === "MAC 21,0,7,42652"
    && value.artifacts?.report?.documentName === "Untitled-1"
    && value.artifacts?.report?.stage?.width === 550
    && value.artifacts?.report?.stage?.height === 400
    && value.artifacts?.report?.fps === 24
    && value.artifacts?.report?.frameCount === 1,
  "current Animate blank-document probe report summary changed");
  invariant(value.artifacts?.png?.width === 550 && value.artifacts?.png?.height === 400,
    "current Animate blank-document probe PNG dimensions changed");

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
      `current Animate blank-document probe ${name} binding is malformed`);
    const artifact = await projectFile(root, reference.file, `current Animate blank-document probe ${name}`);
    invariant(artifact.binding.sha256 === reference.sha256,
      `current Animate blank-document probe ${name} SHA-256 is stale`);
    artifacts[name] = artifact.binding;
  }
  return {
    receipt: {file: portable(root, probeFile), ...receiptIdentity.binding},
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
    reusedAsG4L3FlaEvidence: false,
    authoringAuditEffect: false,
    acceptanceEffect: false,
  };
}

async function verifyAssistBinding({root, assistRoot, entry, sourceFla, sourceSwf, historicalRunner}) {
  const evidenceId = entry.animationId;
  const bindingFile = path.join(assistRoot, evidenceId, "source-binding.json");
  invariant(isInside(assistRoot, bindingFile), `${evidenceId}: source binding escapes the paired-audit root`);
  await rejectSymlinkComponents(root, bindingFile, `${evidenceId}: paired-audit source binding`);
  const bindingIdentity = await fileIdentity(bindingFile, `${evidenceId}: paired-audit source binding`, {mode: 0o444});
  const value = JSON.parse(bindingIdentity.bytes.toString("utf8"));
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding",
    `${evidenceId}: paired-audit binding schema changed`);
  invariant(value.evidenceId === evidenceId && value.sourceKind === "paired-fla-swf",
    `${evidenceId}: paired-audit identity changed`);
  invariant(value.acceptanceEffect === "none; work-only authoring evidence preparation",
    `${evidenceId}: paired-audit binding claims acceptance authority`);
  invariant(value.intendedAudit?.captureFrame === 1
    && value.intendedAudit?.recursiveRootAndLibraryTimelines === true
    && value.intendedAudit?.frameAndInstanceScriptInventory === true
    && value.intendedAudit?.nativeStagePng === true
    && value.intendedAudit?.saveOrPublishAllowed === false,
  `${evidenceId}: paired-audit intended-audit contract changed`);
  invariant(value.generatedBy?.file === historicalRunner.file && value.generatedBy?.sha256 === historicalRunner.sha256,
    `${evidenceId}: paired-audit historical preparation-runner binding differs`);
  invariant(value.source?.file === sourceFla.binding.file
    && value.source?.sha256 === sourceFla.binding.sha256
    && value.source?.bytes === sourceFla.binding.bytes,
  `${evidenceId}: paired-audit FLA source binding differs`);
  invariant(value.shippedSwf?.source?.file === sourceSwf.binding.file
    && value.shippedSwf?.source?.sha256 === sourceSwf.binding.sha256
    && value.shippedSwf?.source?.bytes === sourceSwf.binding.bytes,
  `${evidenceId}: paired-audit SWF source binding differs`);
  const flaCopy = await verifyCopy({
    root,
    declared: value.workingCopy,
    expected: sourceFla,
    parent: path.join(assistRoot, evidenceId, "working-copy"),
    label: `${evidenceId}: paired-audit FLA working copy`,
  });
  const swfCopy = await verifyCopy({
    root,
    declared: value.shippedSwf.workingCopy,
    expected: sourceSwf,
    parent: path.join(assistRoot, evidenceId, "runtime-source"),
    label: `${evidenceId}: paired-audit SWF working copy`,
  });
  return {
    evidenceId,
    sourceBinding: {file: portable(root, bindingFile), ...bindingIdentity.binding, readOnly: true},
    captureFrame: value.intendedAudit.captureFrame,
    flaWorkingCopy: flaCopy.binding,
    swfWorkingCopy: swfCopy.binding,
    historicalPreparationRunner: historicalRunner,
    prepared: true,
    authoringAuditRun: false,
    workOnly: true,
    acceptanceEffect: false,
  };
}

function buildMarkdown(report, jsonIdentity) {
  const rows = report.queue.map((entry) => [
    entry.queueOrdinal,
    `\`${entry.animationId}\``,
    `\`${entry.batch.batchId}/${entry.batch.batchOrdinal}\``,
    `\`${path.basename(entry.sourcePair.fla.file)}\``,
    `\`${path.basename(entry.sourcePair.swf.file)}\``,
    entry.currentState,
  ].join(" | "));
  return [
    "# G4 L3 Adobe Animate authoring-audit operator queue",
    "",
    "This package is a deterministic, acceptance-neutral queue for 29 pending human-assisted FLA authoring audits. It launches nothing and grants no review or acceptance authority.",
    "",
    "## Current gate",
    "",
    `- Queue JSON: \`${jsonIdentity.file}\``,
    `- Queue JSON SHA-256: \`${jsonIdentity.sha256}\``,
    `- Source FLA/SWF pairs verified: ${report.summary.sourcePairsVerified}/${report.summary.totalItems}`,
    `- Batch FLA copies verified at exact mode 0444: ${report.summary.batchFlaCopiesVerified}/${report.summary.totalItems}`,
    `- Paired assist FLA/SWF copies verified at exact mode 0444: ${report.summary.pairedAssistPackagesVerified}/${report.summary.totalItems}`,
    `- Assist-runner provenance: ${report.inputs.assistRunnerTransition.state}`,
    `- Running Animate processes: ${report.processGate.matchingProcessCount}`,
    `- Process gate: **${report.processGate.state}**`,
    `- Current blank-document cold-start probe: ${report.currentBlankDocumentProbe.status} (not reused as FLA evidence)`,
    `- Human-assisted runs performed by this builder: ${report.summary.animateGuiExecutions}`,
    `- Authoring audits established: ${report.summary.authoringAuditsEstablished}`,
    `- Strict acceptance effect: ${report.summary.strictAcceptanceEffect}`,
    "",
    report.processGate.animateRunning
      ? "Adobe Animate is currently open, so every row remains blocked. Fully quit Animate before the operator substitutes one named human identity and executes exactly one row. Re-run the queue check immediately before each row."
      : "Adobe Animate is currently closed and the blank-document cold-start probe passed. The queue is still waiting for a named human dialog operator; this report does not authorize an unattended run. Re-run the queue check immediately before each row.",
    "",
    "## Operator boundary",
    "",
    "1. Execute rows in `queueOrdinal` order, one row per fresh Animate process.",
    "2. The named human may acknowledge only the legacy ActionScript conversion warning.",
    "3. Do not click any other dialog; do not save, publish, export, or edit.",
    "4. The controller must close without saving and Animate must fully quit before the next row.",
    "5. A successful work-only audit still does not prove original-runtime behavior, FLA/SWF equivalence, JavaScript fidelity, audio, RMSE, human review, owner acceptance, or migration completion.",
    "",
    "## Queue",
    "",
    "Order | Animation | Batch/order | FLA | SWF | Current state",
    "---: | --- | --- | --- | --- | ---",
    ...rows,
    "",
    "Each row's exact `npm` argv template, immutable hashes, read-only working-copy bindings, capture frame, and sole operator substitution are in the JSON report.",
    "",
  ].join("\n");
}

async function writeOrCheck(file, bytes, {root, check, label}) {
  invariant(isInside(path.join(root, "reports"), file), `${label} must be under reports/`);
  await rejectSymlinkComponents(root, file, label);
  if (check) {
    invariant(await exists(file), `${label} is missing`);
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  if (await exists(file)) {
    const information = await lstat(file);
    invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
      `${label} must be a plain, singly-linked file`);
  }
  await writeFile(file, bytes);
}

export async function buildG4L3AnimateOperatorQueue({
  root = ROOT,
  readinessFile = path.join(root, path.relative(ROOT, DEFAULT_READINESS)),
  assistRoot = path.join(root, path.relative(ROOT, DEFAULT_ASSIST_ROOT)),
  jsonReport = path.join(root, path.relative(ROOT, DEFAULT_JSON_REPORT)),
  markdownReport = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN_REPORT)),
  currentProbeFile = path.join(root, path.relative(ROOT, DEFAULT_CURRENT_PROBE)),
  processTableText = null,
  expectedCount = EXPECTED_COUNT,
  check = false,
} = {}) {
  invariant(expectedCount === EXPECTED_COUNT, `production queue cardinality is fixed at ${EXPECTED_COUNT}`);
  invariant(isInside(path.join(root, "work", "animate"), assistRoot), "paired-audit root must be under work/animate/");
  await rejectSymlinkComponents(root, assistRoot, "paired-audit root");
  const preparation = await loadPreparation({root, readinessFile});
  const sourceManifest = await projectFile(root, "catalog/source-manifest.sha256", "source freeze manifest");
  const sourceEntries = parseSourceManifest(sourceManifest.bytes);
  const sourceRoot = path.join(root, SOURCE_PREFIX);
  const sourceRealRoot = await realpath(sourceRoot);

  const toolBindings = preparation.manifestValue.toolBindings;
  const historicalRunner = verifyHistoricalBinding(
    toolBindings.existingAssistRunner,
    "paired-source historical preparation runner",
  );
  const readinessHistoricalRunner = verifyHistoricalBinding(
    preparation.readinessValue.toolBindings?.existingAssistRunner,
    "readiness historical preparation runner",
  );
  invariant(sameFileIdentity(historicalRunner, readinessHistoricalRunner),
    "readiness and content-addressed manifest historical preparation-runner bindings differ");
  const currentRunner = await projectFile(root, historicalRunner.file, "current paired-source Animate execution runner");
  const runnerTransition = {
    state: sameFileIdentity(historicalRunner, currentRunner.binding)
      ? "unchanged-since-preparation"
      : "current-execution-runner-updated-after-immutable-preparation",
    historicalPreparationRunner: historicalRunner,
    currentExecutionRunner: currentRunner.binding,
    sameBytes: sameFileIdentity(historicalRunner, currentRunner.binding),
    immutableSourceBindingsRewritten: false,
    currentCommandsUseCurrentExecutionRunner: true,
  };
  const jsfl = await projectFile(root, toolBindings.jsflAuditTemplate.file, "recursive Animate JSFL audit template");
  verifyDeclaredIdentity(jsfl, toolBindings.jsflAuditTemplate, "recursive Animate JSFL audit template");
  const generator = await projectFile(root, "scripts/build-g4-l3-animate-operator-queue.mjs", "G4 L3 Animate operator-queue generator");
  const animateBinary = toolBindings.adobeAnimate?.executable?.file;
  invariant(path.isAbsolute(animateBinary || ""), "Animate executable binding must be absolute");
  const animate = await fileIdentity(animateBinary, "Adobe Animate executable");
  verifyDeclaredIdentity(animate, toolBindings.adobeAnimate.executable, "Adobe Animate executable");
  const currentBlankDocumentProbe = await verifyCurrentBlankDocumentProbe({
    root,
    probeFile: currentProbeFile,
    animateBinary,
    animate,
    jsfl,
  });

  const stageRoot = path.resolve(root, "work", "animate", "g4-l3-read-only-fla-copies");
  const ids = new Set();
  const orderKeys = new Set();
  const queue = [];
  for (const [index, entry] of preparation.manifestValue.entries.entries()) {
    const animationId = entry.animationId;
    invariant(animationId && !ids.has(animationId), `duplicate queue animation ID: ${animationId}`);
    ids.add(animationId);
    invariant(entry.animateAuthoringAudit?.status === "not-run", `${animationId}: authoring audit is not pending`);
    invariant(entry.source?.pairedSwf, `${animationId}: staged entry has no paired SWF binding`);
    const orderKey = `${entry.batch.releasePart}:${entry.batch.batchOrdinal}`;
    invariant(!orderKeys.has(orderKey), `${animationId}: duplicate release/batch order ${orderKey}`);
    orderKeys.add(orderKey);
    if (index > 0) {
      const previous = preparation.manifestValue.entries[index - 1];
      invariant(entry.batch.releasePart > previous.batch.releasePart
        || (entry.batch.releasePart === previous.batch.releasePart && entry.batch.batchOrdinal > previous.batch.batchOrdinal),
      `${animationId}: staging manifest order is not strictly release-part/batch-ordinal ordered`);
    }

    const sourceFla = await verifySource({
      root,
      sourceRealRoot,
      sourceManifest: sourceEntries,
      declared: {file: entry.source.file, sha256: entry.source.sha256, bytes: entry.source.bytes},
      extension: ".fla",
      label: `${animationId}: source FLA`,
    });
    const sourceSwf = await verifySource({
      root,
      sourceRealRoot,
      sourceManifest: sourceEntries,
      declared: entry.source.pairedSwf,
      extension: ".swf",
      label: `${animationId}: source SWF`,
    });
    invariant(path.basename(sourceFla.file, ".fla").toLowerCase() === path.basename(sourceSwf.file, ".swf").toLowerCase(),
      `${animationId}: source FLA/SWF basenames differ`);
    const batchCopy = await verifyCopy({
      root,
      declared: entry.workingCopy,
      expected: sourceFla,
      parent: path.join(stageRoot, "files", animationId),
      label: `${animationId}: batch-staged FLA copy`,
    });
    const pairedPreparation = await verifyAssistBinding({
      root,
      assistRoot,
      entry,
      sourceFla,
      sourceSwf,
      historicalRunner,
    });
    const command = buildCommand({
      sourceFla: sourceFla.binding,
      sourceSwf: sourceSwf.binding,
      evidenceId: pairedPreparation.evidenceId,
      captureFrame: pairedPreparation.captureFrame,
    });
    queue.push({
      queueOrdinal: index + 1,
      animationId,
      batch: entry.batch,
      sourcePair: {
        sourceKind: "fla+swf",
        fla: sourceFla.binding,
        swf: sourceSwf.binding,
        basenamePairVerified: true,
        bothSourceFreezeBound: true,
        flaSwfEquivalenceProven: false,
        shippedSwfExecutedByAuthoringAudit: false,
      },
      batchStagingCopy: batchCopy.binding,
      pairedAssistPreparation: pairedPreparation,
      command,
      operatorInputs: {
        captureFrame: {
          value: pairedPreparation.captureFrame,
          flashFrameIndexing: "one-indexed",
          purpose: "authoring PNG only; the recursive JSFL inventories root and library timelines independently",
          runtimeEvidence: false,
        },
        dialogOperator: {
          status: "not-supplied",
          requiredAtExecution: true,
          authority: "acknowledge only the legacy ActionScript conversion warning",
          reviewerOrOwnerAuthority: false,
        },
      },
      currentState: "pending-process-snapshot-and-named-human",
      evidenceState: {
        sourcePreparation: true,
        authoringAudit: false,
        originalRuntimeBehavior: false,
        javascriptFidelity: false,
        rmse: false,
        audioAcceptance: false,
        humanReview: false,
        ownerAcceptance: false,
        strictAcceptance: false,
        migrationComplete: false,
      },
    });
  }
  invariant(queue.length === expectedCount, `expected ${expectedCount} queue entries, received ${queue.length}`);

  const running = await inspectAnimateProcesses(animateBinary, processTableText);
  const processGate = {
    inspection: {
      program: "ps",
      argv: ["-axo", "pid=,command="],
      parser: "exact executable or executable-plus-arguments prefix only",
      launchesOrInteractsWithAnimate: false,
    },
    animateExecutable: {file: animateBinary, sha256: animate.binding.sha256, bytes: animate.binding.bytes},
    matchingProcessCount: running.length,
    matchingProcesses: running,
    animateRunning: running.length > 0,
    state: running.length > 0 ? "blocked-animate-already-running" : "closed-awaiting-named-human-operator",
    humanAssistedRunAllowedNow: false,
    reason: running.length > 0
      ? "At least one exact Adobe Animate executable process is already open. The one-FLA cold-start contract requires every Animate process to be fully closed."
      : "The cold-start process prerequisite is clear, but this report cannot supply the required named human dialog operator or authorize a GUI run.",
    resumeCondition: "Fully quit every Adobe Animate process, rerun this queue in --check mode, then substitute one named human identity into exactly one queue row.",
  };
  for (const entry of queue) {
    entry.currentState = running.length > 0
      ? "blocked-animate-already-running-and-awaiting-named-human"
      : "ready-for-named-human-one-item-run";
  }

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-adobe-animate-human-assisted-authoring-operator-queue",
    lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
    scope: "Hash-bound, ordered operator package for 29 pending paired FLA/SWF authoring audits; no GUI execution and no acceptance authority",
    authorityBoundary: {
      sourcePreparation: true,
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      javascriptImplementationOrFidelity: false,
      rmse: false,
      audioListeningOrSynchronization: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
    },
    inputs: {
      preparationReport: preparation.readiness,
      contentAddressedStagingManifest: preparation.manifest,
      sourceFreezeManifest: sourceManifest.binding,
      historicalPreparationAssistRunner: historicalRunner,
      currentExecutionAssistRunner: currentRunner.binding,
      assistRunnerTransition: runnerTransition,
      recursiveJsflAuditTemplate: jsfl.binding,
      currentBlankDocumentProbeReceipt: currentBlankDocumentProbe.receipt,
      generator: generator.binding,
    },
    safetyContract: {
      builderLaunchesAnimate: false,
      builderClicksDialogs: false,
      builderSavesPublishesOrExports: false,
      sourceAssetWrites: false,
      captureOrApprovalWrites: false,
      oneItemPerFreshAnimateProcess: true,
      onlyAllowedHumanInteraction: "Acknowledge the legacy ActionScript conversion warning for the one queued FLA; leave every other dialog untouched.",
      requiredCloseDisposition: "Close without saving and fully quit Animate before the next queue row.",
    },
    processGate,
    currentBlankDocumentProbe,
    summary: {
      totalItems: queue.length,
      sourcePairsVerified: queue.length,
      batchFlaCopiesVerified: queue.length,
      pairedAssistPackagesVerified: queue.length,
      exactCommandsRecorded: queue.length,
      pendingHumanAssistedRuns: queue.length,
      animateGuiExecutions: 0,
      authoringAuditsEstablished: 0,
      originalRuntimeBaselinesEstablished: 0,
      humanReviewsEstablished: 0,
      ownerAcceptancesEstablished: 0,
      strictAcceptancesEstablished: 0,
      strictAcceptanceEffect: false,
    },
    operatorProtocol: {
      queueOrder: "ascending queueOrdinal, derived from releasePart then batchOrdinal",
      preRunCheck: "npm run audit:animate:g4-l3:operator-queue:check",
      concurrency: 1,
      freshAnimateProcessPerItem: true,
      doNotSkipAheadAfterFailure: true,
      successfulWorkEvidenceStillRequiresSeparateValidationAndCanonicalAdoption: true,
    },
    queue,
    limitations: [
      "The paired-source authoring runner opens only the staged FLA. It does not execute the shipped SWF or prove FLA/SWF equivalence.",
      "Animate 2021 can alter or remove legacy ActionScript during in-memory conversion; shipped SWF bytecode remains authoritative for runtime scripts.",
      "A recursive authoring audit and authoring PNG are not original-runtime, interaction, branch, localization, audio, Replay, visual-parity, human-review, owner-acceptance, or completion evidence.",
      "This report intentionally records no dialog operator identity; only the user may supply the named human at execution time.",
    ],
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {
    file: portable(root, jsonReport),
    sha256: sha256(jsonBytes),
    bytes: jsonBytes.length,
  };
  const markdownBytes = Buffer.from(buildMarkdown(report, jsonIdentity));
  await writeOrCheck(jsonReport, jsonBytes, {root, check, label: "G4 L3 Animate operator-queue JSON"});
  await writeOrCheck(markdownReport, markdownBytes, {root, check, label: "G4 L3 Animate operator-queue Markdown"});
  return {report, jsonIdentity, jsonReport, markdownReport};
}

export function parseArguments(argv) {
  const options = {
    check: false,
    readinessFile: DEFAULT_READINESS,
    assistRoot: DEFAULT_ASSIST_ROOT,
    currentProbeFile: DEFAULT_CURRENT_PROBE,
    jsonReport: DEFAULT_JSON_REPORT,
    markdownReport: DEFAULT_MARKDOWN_REPORT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--readiness") options.readinessFile = path.resolve(argv[++index] || invariant(false, "--readiness requires a path"));
    else if (value === "--assist-root") options.assistRoot = path.resolve(argv[++index] || invariant(false, "--assist-root requires a path"));
    else if (value === "--current-probe") options.currentProbeFile = path.resolve(argv[++index] || invariant(false, "--current-probe requires a path"));
    else if (value === "--json-report") options.jsonReport = path.resolve(argv[++index] || invariant(false, "--json-report requires a path"));
    else if (value === "--markdown-report") options.markdownReport = path.resolve(argv[++index] || invariant(false, "--markdown-report requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-g4-l3-animate-operator-queue.mjs [options]",
    "",
    "Verifies all 29 G4 L3 FLA/SWF source pairs, exact-mode-0444 staging",
    "copies, paired-source assist packages, current Animate process state, and",
    "writes an ordered acceptance-neutral human-assisted authoring-audit queue.",
    "This command never launches or interacts with Adobe Animate.",
    "",
    "Options:",
    "  --check                    Recompute and compare both reports without writing",
    "  --readiness <file>         G4 L3 Animate prepare-only readiness JSON",
    "  --assist-root <dir>        Existing paired-source preparation root under work/animate/",
    "  --current-probe <file>     Current passing disposable-document probe receipt",
    "  --json-report <file>       Output JSON under reports/",
    "  --markdown-report <file>   Output Markdown under reports/",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildG4L3AnimateOperatorQueue(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "built",
    queueItems: result.report.summary.totalItems,
    sourcePairsVerified: result.report.summary.sourcePairsVerified,
    copiesVerified: result.report.summary.batchFlaCopiesVerified,
    pairedAssistPackagesVerified: result.report.summary.pairedAssistPackagesVerified,
    processGate: result.report.processGate.state,
    animateLaunched: false,
    authoringAuditsEstablished: false,
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
