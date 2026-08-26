#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, lstat, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  buildControllerJsfl,
  buildGeneratedAuditScript,
  validateProbeArtifacts,
} from "./probe-animate-jsfl-cli.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const DEFAULT_INFO_PLIST =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/Info.plist";
const DEFAULT_HISTORICAL_RECEIPT =
  "work/animate/jsfl-cli-probes/run-pbVdi8/probe-result.json";
const DEFAULT_FAILED_RECEIPTS = Object.freeze([
  "work/animate/jsfl-cli-probes/run-tQ3kYA/probe-result.json",
  "work/animate/jsfl-cli-probes/run-k7g1FO/probe-result.json",
]);
const DEFAULT_JSON = path.join(ROOT, "reports", "animate-jsfl-probe-regression-diagnostic.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "animate-jsfl-probe-regression-diagnostic.md");
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

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
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
    ? relative.split(path.sep).join("/")
    : file;
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

async function fileIdentity(file, label, {executable = false} = {}) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  if (executable) await access(file, fsConstants.X_OK);
  const bytes = await readFile(file);
  return {
    bytes,
    binding: {
      file,
      sha256: sha256(bytes),
      bytes: bytes.length,
      ...(executable ? {executable: true} : {}),
    },
  };
}

async function projectFile(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label} must use a project-relative path`);
  const file = path.resolve(root, relativePath);
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label} escapes the project root`);
  const result = await fileIdentity(file, label);
  result.binding.file = relative.split(path.sep).join("/");
  return result;
}

async function boundReference(root, reference, label) {
  invariant(reference?.file && SHA256_PATTERN.test(reference.sha256 || ""), `${label} binding is malformed`);
  const result = await projectFile(root, reference.file, label);
  invariant(result.binding.sha256 === reference.sha256, `${label} hash is stale`);
  return result;
}

function normalizeGeneratedAudit(text) {
  const pattern = /var OUTPUT_ROOT = "[^"]+";/gu;
  const matches = text.match(pattern) || [];
  invariant(matches.length === 1, `generated audit has ${matches.length} OUTPUT_ROOT declarations`);
  return text.replace(pattern, 'var OUTPUT_ROOT = "<RUN_OUTPUT_ROOT_URI>";');
}

function normalizeController(text) {
  const replacements = [
    [/var auditScriptUri = "[^"]+";/gu, 'var auditScriptUri = "<RUN_AUDIT_SCRIPT_URI>";'],
    [/var outputRootUri = "[^"]+";/gu, 'var outputRootUri = "<RUN_OUTPUT_ROOT_URI>";'],
    [/var markerUri = "[^"]+";/gu, 'var markerUri = "<RUN_MARKER_URI>";'],
  ];
  let normalized = text;
  for (const [pattern, replacement] of replacements) {
    const matches = normalized.match(pattern) || [];
    invariant(matches.length === 1, `controller has ${matches.length} declarations matching ${pattern}`);
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

function stderrSignals(text) {
  const lines = text.split(/\r?\n/u).filter(Boolean);
  return {
    lineCount: lines.length,
    duplicateObjectiveCClassWarnings: lines.filter((line) => line.includes("Class ") && line.includes("implemented in both")).length,
    crashReporterInitialized: lines.some((line) => line.includes("AdobeCrashReporterInitialize")),
    crashDaemonPreferenceObserved: lines.some((line) => line.includes("CR dialog Preference for force quit")),
    crashDaemonExitStatusZeroObserved: lines.some((line) => line.includes("exitStatus: 0")),
    coreTextFontAssetWarningObserved: lines.some((line) => line.includes("CoreText failed to get font asset")),
    illegalReflectiveAccessWarningObserved: lines.some((line) => line.includes("illegal reflective access")),
    controllerOrJsflErrorObserved: lines.some((line) => /\bJSFL\b|JavaScript Error|controller\.jsfl/iu.test(line)),
  };
}

function plistValue(text, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = new RegExp(`<key>${escaped}</key>\\s*<string>([^<]+)</string>`, "u").exec(text);
  invariant(match, `Animate Info.plist is missing ${key}`);
  return match[1];
}

async function loadRun({root, receiptPath, expectedStatus, animate, auditTemplate}) {
  const receiptFile = await projectFile(root, receiptPath, `${expectedStatus} probe receipt`);
  const receipt = JSON.parse(receiptFile.bytes.toString("utf8"));
  invariant(receipt.schemaVersion === 1, `${receiptPath}: unexpected schemaVersion`);
  invariant(receipt.evidenceKind === "adobe-animate-jsfl-cli-probe", `${receiptPath}: unexpected evidenceKind`);
  invariant(receipt.scope === "disposable-blank-document", `${receiptPath}: unexpected scope`);
  invariant(receipt.status === expectedStatus, `${receiptPath}: expected status ${expectedStatus}, got ${receipt.status}`);
  invariant(receipt.command?.executable === animate.binding.file, `${receiptPath}: Animate executable path differs`);
  invariant(receipt.command?.executableSha256 === animate.binding.sha256, `${receiptPath}: Animate executable hash differs`);
  invariant(receipt.command?.intentionallyOmitsQuitFlag === true, `${receiptPath}: probe must omit the CLI --quit flag`);
  invariant(Array.isArray(receipt.command?.args) && receipt.command.args[0] === "--run-jsfl"
    && receipt.command.args[1] === "-o" && receipt.command.args.length === 3,
  `${receiptPath}: unexpected Animate invocation shape`);
  invariant(receipt.scripts?.auditTemplate?.sha256 === auditTemplate.binding.sha256,
    `${receiptPath}: audit-template hash differs from the current template`);

  const generatedAudit = await boundReference(root, receipt.scripts?.generatedAudit, `${receiptPath}: generated audit`);
  const controller = await boundReference(root, receipt.scripts?.controller, `${receiptPath}: controller`);
  const stdout = await boundReference(root, receipt.process?.stdout, `${receiptPath}: stdout`);
  const stderr = await boundReference(root, receipt.process?.stderr, `${receiptPath}: stderr`);
  const runDir = path.dirname(path.resolve(root, receiptPath));
  const outputRootUri = pathToFileURL(runDir).href;
  const generatedAuditPath = path.join(runDir, "animate-audit-current-document.generated.jsfl");
  const controllerPath = path.join(runDir, "controller.jsfl");
  const markerPath = path.join(runDir, "controller-result.json");
  invariant(path.resolve(root, receipt.scripts.generatedAudit.file) === generatedAuditPath,
    `${receiptPath}: generated-audit path is not the canonical run path`);
  invariant(path.resolve(root, receipt.scripts.controller.file) === controllerPath,
    `${receiptPath}: controller path is not the canonical run path`);
  const expectedAudit = buildGeneratedAuditScript(auditTemplate.bytes.toString("utf8"), outputRootUri);
  const expectedController = buildControllerJsfl({
    auditScriptUri: pathToFileURL(generatedAuditPath).href,
    outputRootUri,
    markerUri: pathToFileURL(markerPath).href,
  });
  const generatedAuditText = generatedAudit.bytes.toString("utf8");
  const controllerText = controller.bytes.toString("utf8");
  invariant(generatedAuditText === expectedAudit, `${receiptPath}: current generator does not reproduce generated audit exactly`);
  invariant(controllerText === expectedController, `${receiptPath}: current generator does not reproduce controller exactly`);

  const files = await readdir(runDir);
  const result = {
    receipt: receiptFile.binding,
    status: receipt.status,
    command: {
      executableSha256: receipt.command.executableSha256,
      args: receipt.command.args,
      intentionallyOmitsQuitFlag: receipt.command.intentionallyOmitsQuitFlag,
    },
    scripts: {
      auditTemplateSha256: receipt.scripts.auditTemplate.sha256,
      generatedAudit: generatedAudit.binding,
      controller: controller.binding,
      currentGeneratorExactAuditMatch: true,
      currentGeneratorExactControllerMatch: true,
      normalizedGeneratedAuditSha256: sha256(normalizeGeneratedAudit(generatedAuditText)),
      normalizedControllerSha256: sha256(normalizeController(controllerText)),
    },
    process: {
      exitCode: receipt.process?.exitCode ?? null,
      signal: receipt.process?.signal ?? null,
      timedOut: receipt.process?.timedOut === true,
      durationMs: receipt.process?.durationMs,
      stdout: stdout.binding,
      stderr: stderr.binding,
      stdoutEmpty: stdout.bytes.length === 0,
      stderrSignals: stderrSignals(stderr.bytes.toString("utf8")),
    },
  };

  if (expectedStatus === "passed") {
    invariant(receipt.process?.exitCode === 0 && receipt.process?.signal == null && receipt.process?.timedOut === false,
      `${receiptPath}: historical pass lacks a clean process exit`);
    invariant(receipt.failure == null, `${receiptPath}: historical pass unexpectedly records a failure`);
    const validated = await validateProbeArtifacts(runDir);
    invariant(receipt.artifacts?.marker?.sha256 === validated.marker.sha256, `${receiptPath}: marker binding differs`);
    invariant(receipt.artifacts?.report?.sha256 === validated.report.sha256, `${receiptPath}: audit report binding differs`);
    invariant(receipt.artifacts?.png?.sha256 === validated.png.sha256, `${receiptPath}: PNG binding differs`);
    result.artifacts = {
      controllerMarker: receipt.artifacts.marker,
      authoringAudit: receipt.artifacts.report,
      nativeStagePng: receipt.artifacts.png,
      hashAndStructureValidated: true,
    };
    result.failure = null;
  } else {
    invariant(receipt.process?.exitCode == null && receipt.process?.signal === "SIGTERM" && receipt.process?.timedOut === true,
      `${receiptPath}: failed probe is not a bounded SIGTERM timeout`);
    invariant(receipt.artifacts == null, `${receiptPath}: failed probe unexpectedly claims artifacts`);
    invariant(typeof receipt.failure === "string" && /timed out after \d+ ms/iu.test(receipt.failure),
      `${receiptPath}: missing bounded-timeout failure`);
    invariant(!(await exists(markerPath)), `${receiptPath}: an unbound controller marker exists`);
    const unexpectedRuntimeArtifacts = files.filter((name) =>
      name === "controller-result.json" || /-authoring-audit\.json$|-frame-\d+\.png$/u.test(name));
    invariant(unexpectedRuntimeArtifacts.length === 0,
      `${receiptPath}: unexpected unbound runtime artifacts: ${unexpectedRuntimeArtifacts.join(", ")}`);
    result.artifacts = {
      controllerMarkerProduced: false,
      authoringAuditProduced: false,
      nativeStagePngProduced: false,
    };
    result.failure = receipt.failure;
  }
  return result;
}

function allSame(values) {
  return values.length > 0 && new Set(values).size === 1;
}

async function buildDiagnostic({
  root = ROOT,
  animateBinary = DEFAULT_ANIMATE_BINARY,
  infoPlist = DEFAULT_INFO_PLIST,
  historicalReceipt = DEFAULT_HISTORICAL_RECEIPT,
  failedReceipts = DEFAULT_FAILED_RECEIPTS,
} = {}) {
  invariant(Array.isArray(failedReceipts) && failedReceipts.length >= 2,
    "At least two current failed receipts are required to classify a repeated regression");
  const [animate, animateInfo, toolchain, runner, auditTemplate] = await Promise.all([
    fileIdentity(animateBinary, "Adobe Animate executable", {executable: true}),
    fileIdentity(infoPlist, "Adobe Animate Info.plist"),
    projectFile(root, "catalog/toolchain.json", "toolchain"),
    projectFile(root, "scripts/probe-animate-jsfl-cli.mjs", "probe runner"),
    projectFile(root, "scripts/animate-audit-current-document.jsfl", "audit template"),
  ]);
  animate.binding.file = animateBinary;
  animateInfo.binding.file = infoPlist;
  const toolchainValue = JSON.parse(toolchain.bytes.toString("utf8"));
  invariant(toolchainValue.authoringEvidence?.adobeAnimateDetected === true, "toolchain does not detect Adobe Animate");
  invariant(toolchainValue.authoringEvidence?.productVersion === "21.0.7", "toolchain Animate version differs");
  const infoPlistText = animateInfo.bytes.toString("utf8");
  const productVersion = plistValue(infoPlistText, "CFBundleShortVersionString");
  const productBuild = plistValue(infoPlistText, "Adobe Product Build");
  invariant(productVersion === toolchainValue.authoringEvidence.productVersion,
    "Animate Info.plist and toolchain product versions differ");

  const historical = await loadRun({
    root,
    receiptPath: historicalReceipt,
    expectedStatus: "passed",
    animate,
    auditTemplate,
  });
  const failed = [];
  for (const receiptPath of failedReceipts) {
    failed.push(await loadRun({root, receiptPath, expectedStatus: "failed", animate, auditTemplate}));
  }
  const runs = [historical, ...failed];
  const normalizedGeneratedAuditSame = allSame(runs.map((run) => run.scripts.normalizedGeneratedAuditSha256));
  const normalizedControllerSame = allSame(runs.map((run) => run.scripts.normalizedControllerSha256));
  invariant(normalizedGeneratedAuditSame, "run-directory-normalized generated audits differ");
  invariant(normalizedControllerSame, "run-directory-normalized controllers differ");
  const currentAttemptsTimedOutWithoutArtifacts = failed.every((run) =>
    run.process.timedOut && run.process.signal === "SIGTERM"
      && !run.artifacts.controllerMarkerProduced
      && !run.artifacts.authoringAuditProduced
      && !run.artifacts.nativeStagePngProduced);
  invariant(currentAttemptsTimedOutWithoutArtifacts, "current attempts do not form the expected repeated no-artifact timeout set");

  return {
    schemaVersion: 1,
    reportType: "adobe-animate-blank-document-jsfl-probe-regression-diagnostic",
    scope: "Hash-bound comparison of one historical pass and two current failed disposable-document probes; no Animate launch or UI operation",
    authorityBoundary: {
      toolAndReceiptIntegrityDiagnostic: true,
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      javascriptImplementation: false,
      visualOrBehavioralParity: false,
      audioListening: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    toolchain: {
      catalog: toolchain.binding,
      adobeAnimate: animate.binding,
      infoPlist: animateInfo.binding,
      productVersion,
      productBuild,
      probeRunner: runner.binding,
      auditTemplate: auditTemplate.binding,
    },
    runs: {
      historicalPass: historical,
      currentFailures: failed,
    },
    comparison: {
      sameAnimateExecutableSha256AcrossReceiptsAndCurrentTool: true,
      sameAuditTemplateSha256AcrossReceiptsAndCurrentTool: true,
      currentGeneratorExactlyReproducesAllGeneratedAudits: runs.every((run) => run.scripts.currentGeneratorExactAuditMatch),
      currentGeneratorExactlyReproducesAllControllers: runs.every((run) => run.scripts.currentGeneratorExactControllerMatch),
      runDirectoryNormalizedGeneratedAuditSame: normalizedGeneratedAuditSame,
      runDirectoryNormalizedControllerSame: normalizedControllerSame,
      stdoutEmptyAcrossAllRuns: runs.every((run) => run.process.stdoutEmpty),
      commonAnimateStartupSignalsAcrossAllStderrLogs: runs.every((run) =>
        run.process.stderrSignals.crashReporterInitialized
          && run.process.stderrSignals.crashDaemonPreferenceObserved
          && run.process.stderrSignals.crashDaemonExitStatusZeroObserved
          && run.process.stderrSignals.coreTextFontAssetWarningObserved
          && run.process.stderrSignals.duplicateObjectiveCClassWarnings > 0),
      controllerOrJsflErrorAbsentAcrossAllStderrLogs: runs.every((run) =>
        !run.process.stderrSignals.controllerOrJsflErrorObserved),
      historicalOnlyIllegalReflectiveAccessWarningObserved:
        historical.process.stderrSignals.illegalReflectiveAccessWarningObserved
          && failed.every((run) => !run.process.stderrSignals.illegalReflectiveAccessWarningObserved),
      historicalProcessExitedCleanlyWithValidatedArtifacts: historical.process.exitCode === 0
        && historical.process.signal == null && historical.artifacts.hashAndStructureValidated,
      currentAttemptsTimedOutWithoutControllerMarkerOrAuditArtifacts: currentAttemptsTimedOutWithoutArtifacts,
      longerSecondTimeoutChangedOutcome: false,
      deterministicRepositoryCodeDefectProven: false,
      rootCauseClassification: "undetermined-animate-runtime-ui-or-host-environment-state",
      interpretation: "The same current generator reproduces the historical and failed run scripts exactly after substituting each run directory. The executable and audit-template hashes also match. Both current attempts entered a bounded Animate process but produced no controller marker before SIGTERM, including the 120-second attempt. These receipts prove a current execution regression, but they do not identify a deterministic repository-code defect or a specific modal/UI cause.",
    },
    executionReadiness: {
      currentUnattendedDisposableDocumentJsflReady: false,
      status: "not-ready-repeated-timeout-without-controller-marker",
      batchAnimateAuditMayProceed: false,
      retryAutomatically: false,
      nextEvidenceNeeded: "A separately authorized, observed cold-start diagnostic must identify the actual Animate UI/runtime state and produce a new hash-bound controller marker, audit JSON, native-stage PNG, and clean process exit. Do not infer readiness from the historical pass.",
    },
    acceptance: {
      reportIsAcceptanceNeutral: true,
      migrationStatusWrites: 0,
      reviewOrApprovalWrites: 0,
      strictAcceptanceEffect: false,
    },
  };
}

function renderMarkdown(report) {
  const historical = report.runs.historicalPass;
  const failed = report.runs.currentFailures;
  return [
    "# Adobe Animate blank-JSFL probe regression diagnostic",
    "",
    "This is an acceptance-neutral, hash-bound diagnostic. It did not launch or operate Adobe Animate and has no migration, review, approval, parity, or strict-acceptance effect.",
    "",
    "## Outcome",
    "",
    "- Current unattended disposable-document JSFL readiness: **false**",
    `- Status: \`${report.executionReadiness.status}\``,
    "- Deterministic repository-code defect proven: **false**",
    `- Root-cause classification: \`${report.comparison.rootCauseClassification}\``,
    "- Automatic retry authorized: **false**",
    "",
    "## Bound comparison",
    "",
    `- Historical pass: \`${historical.receipt.file}\`; ${historical.process.durationMs} ms; exit 0; marker/audit/PNG validated.`,
    ...failed.map((run) => `- Current failure: \`${run.receipt.file}\`; ${run.process.durationMs} ms; ${run.failure}; no marker/audit/PNG.`),
    `- Animate executable SHA-256: \`${report.toolchain.adobeAnimate.sha256}\``,
    `- Audit-template SHA-256: \`${report.toolchain.auditTemplate.sha256}\``,
    `- Probe-runner SHA-256: \`${report.toolchain.probeRunner.sha256}\``,
    `- Animate version/build: \`${report.toolchain.productVersion}\` / \`${report.toolchain.productBuild}\``,
    `- Run-directory-normalized generated JSFL identical: ${report.comparison.runDirectoryNormalizedGeneratedAuditSame}`,
    `- Run-directory-normalized controller JSFL identical: ${report.comparison.runDirectoryNormalizedControllerSame}`,
    `- Current generator exactly reproduces all three stored generated scripts: ${report.comparison.currentGeneratorExactlyReproducesAllGeneratedAudits && report.comparison.currentGeneratorExactlyReproducesAllControllers}`,
    `- Common Animate startup signals present in all stderr logs: ${report.comparison.commonAnimateStartupSignalsAcrossAllStderrLogs}`,
    `- Controller/JSFL error absent from all stderr logs: ${report.comparison.controllerOrJsflErrorAbsentAcrossAllStderrLogs}`,
    "",
    "## Interpretation",
    "",
    report.comparison.interpretation,
    "",
    "## Next evidence",
    "",
    report.executionReadiness.nextEvidenceNeeded,
    "",
  ].join("\n");
}

function parseArguments(argv) {
  const options = {check: false, json: DEFAULT_JSON, markdown: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = path.resolve(argv[++index] || invariant(false, "--json requires a path"));
    else if (value === "--markdown") options.markdown = path.resolve(argv[++index] || invariant(false, "--markdown requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-animate-jsfl-probe-regression-diagnostic.mjs [--check] [--json <path>] [--markdown <path>]",
    "",
    "Builds or checks the acceptance-neutral, hash-bound comparison of the historical",
    "blank-document JSFL pass and the two current no-artifact timeout receipts.",
    "It never launches or controls Adobe Animate.",
  ].join("\n");
}

async function writeOrCheck({report, jsonFile, markdownFile, check}) {
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(await readFile(jsonFile, "utf8") === json, `${portable(ROOT, jsonFile)} is stale`);
    invariant(await readFile(markdownFile, "utf8") === markdown, `${portable(ROOT, markdownFile)} is stale`);
  } else {
    await writeFile(jsonFile, json);
    await writeFile(markdownFile, markdown);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const report = await buildDiagnostic();
  await writeOrCheck({
    report,
    jsonFile: options.json,
    markdownFile: options.markdown,
    check: options.check,
  });
  console.log(JSON.stringify({
    status: report.executionReadiness.status,
    currentUnattendedDisposableDocumentJsflReady:
      report.executionReadiness.currentUnattendedDisposableDocumentJsflReady,
    historicalPasses: 1,
    currentFailures: report.runs.currentFailures.length,
    deterministicRepositoryCodeDefectProven: report.comparison.deterministicRepositoryCodeDefectProven,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  buildDiagnostic,
  normalizeController,
  normalizeGeneratedAudit,
  parseArguments,
  renderMarkdown,
  sha256,
  stderrSignals,
  writeOrCheck,
};
