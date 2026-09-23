#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const EXPECTED_FLA_COUNT = 29;
const DEFAULT_PREFLIGHT = path.join(ROOT, "reports", "g4-l3-automation-preflight.json");
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, "work", "animate", "g4-l3-read-only-fla-copies");
const DEFAULT_JSON_REPORT = path.join(ROOT, "reports", "g4-l3-animate-prepare-readiness.json");
const DEFAULT_MARKDOWN_REPORT = path.join(ROOT, "reports", "g4-l3-animate-prepare-readiness.md");
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const DEFAULT_CURRENT_PROBE_FILES = Object.freeze([
  "work/animate/jsfl-cli-probes/run-tQ3kYA/probe-result.json",
  "work/animate/jsfl-cli-probes/run-k7g1FO/probe-result.json",
]);
const OLE_COMPOUND_HEADER = "d0cf11e0a1b11ae1";
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

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

async function regularFileIdentity(file, label) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  const bytes = await readFile(file);
  return {
    information,
    bytes,
    identity: {
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
    },
  };
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

async function assertSafeOutputRoot(root, outputRoot) {
  const workAnimateRoot = path.join(root, "work", "animate");
  invariant(isInside(workAnimateRoot, outputRoot), `output root must be a child of ${workAnimateRoot}`);
  await rejectSymlinkComponents(root, outputRoot, "output root");
  if (await exists(outputRoot)) {
    const information = await lstat(outputRoot);
    invariant(information.isDirectory() && !information.isSymbolicLink(), "output root must be a real directory");
    const realWork = await realpath(workAnimateRoot);
    const realOutput = await realpath(outputRoot);
    invariant(isInside(realWork, realOutput), "output root resolves outside work/animate");
  }
}

async function assertSafeReportOutput(root, file, label) {
  const reportsRoot = path.join(root, "reports");
  invariant(isInside(reportsRoot, file), `${label} must be a child of ${reportsRoot}`);
  await rejectSymlinkComponents(root, file, label);
  if (await exists(file)) {
    const information = await lstat(file);
    invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular file`);
    invariant(information.nlink === 1, `${label} must not be hard-linked`);
  }
}

async function boundProjectFile(root, relativePath, label) {
  invariant(!path.isAbsolute(relativePath), `${label} path must be project-relative`);
  const file = path.resolve(root, relativePath);
  invariant(isInside(root, file), `${label} escapes the project root`);
  await rejectSymlinkComponents(root, file, label);
  const {bytes, identity} = await regularFileIdentity(file, label);
  return {
    file,
    bytes,
    binding: {file: relativePath.split(path.sep).join("/"), sha256: identity.sha256, bytes: identity.bytes},
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

function plistValue(text, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = new RegExp(`<key>${escaped}</key>\\s*<string>([^<]+)</string>`, "u").exec(text);
  invariant(match, `Animate Info.plist is missing ${key}`);
  return match[1];
}

function validateJsflContract(text) {
  const required = [
    "function timelineSummary(timeline)",
    "function librarySummary(library)",
    "recursiveLibraryTimelineAudit: true",
    "document.exportPNG(pngURI, true, true)",
    "actionScriptLength:",
  ];
  for (const token of required) invariant(text.includes(token), `JSFL audit contract is missing: ${token}`);
  return {
    recursiveRootAndLibraryTimelines: true,
    frameAndInstanceElementInventory: true,
    actionScriptPresenceInventory: true,
    nativeStagePngExport: true,
  };
}

function auditExistingAssistRunner(text) {
  const required = [
    "async function runAssistedAudit(",
    "finalized = await finalize(options.animationId, runDir, root, options.workingCopyRoot)",
    '"adobe-animate-fla-only-dependency-authoring-audit"',
    "Because this dependency is FLA-only",
    '"--paired-swf"',
    '"--paired-swf-sha256"',
    '"adobe-animate-paired-fla-swf-authoring-audit"',
    "neither executes it nor proves FLA/SWF",
    'if (options.mode === "dependency-fla" && options.prepareOnly)',
    'const args = ["--run-jsfl", "-o", controllerFile]',
  ];
  for (const token of required) invariant(text.includes(token), `Animate assist contract is missing: ${token}`);
  return {
    registeredPilotMode: {
      compatibleWithUnscaffoldedG4L3Batch: false,
      reason: "The registered-pilot path invokes the migration authoring-audit finalizer and is limited to the pilot registry.",
    },
    dependencyFlaMode: {
      compatibleWithPairedFlaAndSwfItems: false,
      reason: "The dependency path explicitly asserts FLA-only evidence and missing shipped-SWF corroboration; using it here would be false provenance.",
    },
    pairedFlaSwfMode: {
      compatibleWithPairedFlaAndSwfItems: true,
      implementation: "scripts/run-assisted-animate-authoring-audit.mjs",
      prepareOnlyAvailable: true,
      requiresExactFlags: ["--paired-swf", "--paired-swf-sha256"],
      fullRunRequiresNamedHumanDialogOperator: true,
      automatedDialogInteractionAllowed: false,
      authoringAuditIsAcceptanceNeutral: true,
      shippedSwfExecutedByAuthoringAudit: false,
      reason: "The paired-source path binds independent read-only FLA and shipped-SWF copies without falsely claiming that the SWF was executed or that FLA/SWF equivalence was proven.",
    },
    prepareOnlyBatchStaging: {
      compatible: true,
      implementation: "scripts/stage-g4-l3-animate-fla-copies.mjs",
      guiRequired: false,
    },
    nextSafeAuthoringStep: {
      status: "paired-prepare-only-available-full-run-still-human-assisted",
      requirement: "Use the paired-source mode with --prepare-only to bind each selected FLA/SWF pair. A full cold-start authoring audit still requires a named human to acknowledge only the legacy conversion warning; the current unattended blank-document probe remains not ready.",
    },
  };
}

async function loadCurrentFailedProbe({root, receiptPath, animateBinary, animateSha256, jsflSha256}) {
  const receipt = await boundProjectFile(root, receiptPath, "current failed Animate probe receipt");
  const value = JSON.parse(receipt.bytes.toString("utf8"));
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-jsfl-cli-probe",
    `${receiptPath}: unexpected Animate probe schema`);
  invariant(value.status === "failed", `${receiptPath}: current probe is not a recorded failure`);
  invariant(value.scope === "disposable-blank-document", `${receiptPath}: unexpected probe scope`);
  invariant(value.command?.executable === animateBinary, `${receiptPath}: Animate executable path differs`);
  invariant(value.command?.executableSha256 === animateSha256, `${receiptPath}: Animate executable hash differs`);
  invariant(value.scripts?.auditTemplate?.sha256 === jsflSha256, `${receiptPath}: JSFL audit-template hash differs`);
  invariant(value.process?.timedOut === true && value.process?.signal === "SIGTERM",
    `${receiptPath}: expected a bounded timeout terminated by SIGTERM`);
  invariant(value.artifacts == null, `${receiptPath}: failed probe unexpectedly claims artifacts`);
  invariant(typeof value.failure === "string" && /timed out/iu.test(value.failure),
    `${receiptPath}: missing timeout failure description`);
  const artifactRefs = {
    generatedAudit: value.scripts.generatedAudit,
    controller: value.scripts.controller,
    stdout: value.process.stdout,
    stderr: value.process.stderr,
  };
  const artifacts = {};
  for (const [name, reference] of Object.entries(artifactRefs)) {
    invariant(reference?.file && SHA256_PATTERN.test(reference.sha256 || ""),
      `${receiptPath}: ${name} binding is malformed`);
    const binding = await boundProjectFile(root, reference.file, `${receiptPath}: ${name}`);
    invariant(binding.binding.sha256 === reference.sha256, `${receiptPath}: ${name} hash is stale`);
    artifacts[name] = binding.binding;
  }
  return {
    receipt: receipt.binding,
    status: value.status,
    scope: value.scope,
    failure: value.failure,
    process: {
      exitCode: value.process.exitCode,
      signal: value.process.signal,
      timedOut: value.process.timedOut,
      durationMs: value.process.durationMs,
    },
    artifactsProduced: false,
    boundRunFiles: artifacts,
  };
}

async function loadToolBindings({root, animateBinary, currentProbeFiles}) {
  const [toolchain, jsfl, assistedRunner, pilotIndex, generator, nodeExecutable] = await Promise.all([
    boundProjectFile(root, "catalog/toolchain.json", "toolchain"),
    boundProjectFile(root, "scripts/animate-audit-current-document.jsfl", "Animate JSFL audit template"),
    boundProjectFile(root, "scripts/run-assisted-animate-authoring-audit.mjs", "Animate assist runner"),
    boundProjectFile(root, "reports/pilot-animate-authoring-audit.json", "pilot Animate authoring index"),
    boundProjectFile(root, "scripts/stage-g4-l3-animate-fla-copies.mjs", "G4 L3 staging generator"),
    regularFileIdentity(process.execPath, "Node.js executable"),
  ]);
  const toolchainValue = JSON.parse(toolchain.bytes.toString("utf8"));
  const pilotIndexValue = JSON.parse(pilotIndex.bytes.toString("utf8"));
  const jsflContract = validateJsflContract(jsfl.bytes.toString("utf8"));
  const assistCompatibility = auditExistingAssistRunner(assistedRunner.bytes.toString("utf8"));

  const animate = await regularFileIdentity(animateBinary, "Adobe Animate executable");
  await access(animateBinary, fsConstants.X_OK);
  const infoPlist = path.resolve(path.dirname(animateBinary), "..", "Info.plist");
  const info = await regularFileIdentity(infoPlist, "Adobe Animate Info.plist");
  const infoText = info.bytes.toString("utf8");
  const productVersion = plistValue(infoText, "CFBundleShortVersionString");
  const productBuild = plistValue(infoText, "Adobe Product Build");
  const configured = toolchainValue.authoringEvidence;
  invariant(configured?.adobeAnimateDetected === true, "toolchain does not declare Adobe Animate ready");
  invariant(configured.productVersion === productVersion,
    `Animate version differs from toolchain (${productVersion} != ${configured.productVersion})`);
  invariant(path.resolve(animateBinary).startsWith(`${path.resolve(configured.applicationPath)}${path.sep}`),
    "Animate executable is outside the toolchain-declared application");

  const probe = pilotIndexValue.animateProbe;
  invariant(probe?.status === "passed", "the pinned disposable-document Animate probe is not passing");
  invariant(probe.executable === animateBinary, "Animate probe executable path differs from this staging tool");
  invariant(probe.executableSha256 === animate.identity.sha256, "Animate probe executable hash is stale");
  invariant(probe.auditScript?.sha256 === jsfl.binding.sha256, "Animate probe JSFL hash is stale");
  invariant(probe.animateVersion === `MAC ${productBuild.replace(/\./gu, ",")}`,
    `Animate probe version differs from Info.plist (${probe.animateVersion} != ${productBuild})`);
  const receipt = await boundProjectFile(root, probe.receipt.file, "Animate probe receipt");
  invariant(receipt.binding.sha256 === probe.receipt.sha256, "Animate probe receipt hash is stale");
  invariant(Array.isArray(currentProbeFiles) && currentProbeFiles.length >= 1,
    "at least one current failed Animate probe receipt is required");
  const currentAttempts = [];
  for (const receiptPath of currentProbeFiles) {
    currentAttempts.push(await loadCurrentFailedProbe({
      root,
      receiptPath,
      animateBinary,
      animateSha256: animate.identity.sha256,
      jsflSha256: jsfl.binding.sha256,
    }));
  }

  return {
    adobeAnimate: {
      product: "Adobe Animate 2021",
      productVersion,
      productBuild,
      executable: {
        file: animateBinary,
        sha256: animate.identity.sha256,
        bytes: animate.identity.bytes,
        executable: true,
      },
      infoPlist: {file: infoPlist, sha256: info.identity.sha256, bytes: info.identity.bytes},
      coldStartInvocationShape: ["--run-jsfl", "-o", "<absolute-controller.jsfl>"],
      launchedByThisCommand: false,
    },
    jsflAuditTemplate: {...jsfl.binding, contract: jsflContract, executedByThisCommand: false},
    existingAssistRunner: {...assistedRunner.binding, compatibilityAudit: assistCompatibility, executedByThisCommand: false},
    historicalDisposableDocumentProbe: {
      index: pilotIndex.binding,
      receipt: receipt.binding,
      status: probe.status,
      animateVersion: probe.animateVersion,
      scope: probe.scope,
      reusedAsLessonEvidence: false,
    },
    currentAutomatedDisposableDocumentProbe: {
      passed: false,
      status: "blocked-by-repeated-timeout-without-artifacts",
      attempts: currentAttempts,
      implication: "Do not represent unattended Animate/JSFL execution as currently ready; no batch GUI audit is authorized or launched by this preparation.",
    },
    toolchain: toolchain.binding,
    generator: generator.binding,
    node: {
      version: process.version,
      executable: {
        file: process.execPath,
        sha256: nodeExecutable.identity.sha256,
        bytes: nodeExecutable.identity.bytes,
      },
    },
  };
}

function selectFlaItems(preflight, expectedFlaCount) {
  invariant(preflight.schemaVersion === 1, "unsupported G4 L3 preflight schema");
  invariant(preflight.reportType === "g4-l3-complete-lesson-automation-preflight",
    "unexpected G4 L3 preflight report type");
  invariant(preflight.lesson?.grade === 4 && preflight.lesson?.lesson === 3,
    "preflight is not G4 L3");
  invariant(preflight.acceptance?.acceptanceNeutral === true,
    "G4 L3 preflight is not acceptance-neutral");
  invariant(preflight.strictGateSnapshot?.strictComplete === 0,
    "staging assumptions changed: strict pilot completion is no longer zero");
  invariant(Array.isArray(preflight.items), "G4 L3 preflight has no items array");
  const items = preflight.items.filter((item) => item.source?.fla != null);
  invariant(items.length === expectedFlaCount,
    `expected ${expectedFlaCount} FLA-backed G4 L3 items, received ${items.length}`);
  if (expectedFlaCount === EXPECTED_FLA_COUNT) {
    invariant(preflight.summary?.canonicalItems === 40 && preflight.summary?.activePages === 39,
      "G4 L3 lesson cardinality changed");
    invariant(preflight.summary?.flaBacked === EXPECTED_FLA_COUNT,
      "G4 L3 preflight FLA count changed");
    invariant(preflight.summary?.swfOnly === 11, "G4 L3 preflight SWF-only count changed");
  }
  const ids = new Set();
  const sources = new Set();
  for (const item of items) {
    invariant(ID_PATTERN.test(item.animationId || ""), `invalid animation ID: ${item.animationId}`);
    invariant(!ids.has(item.animationId), `duplicate animation ID: ${item.animationId}`);
    ids.add(item.animationId);
    const source = item.source.fla;
    invariant(source.physicalHashVerified === true, `${item.animationId}: preflight did not physically verify the FLA`);
    invariant(SHA256_PATTERN.test(source.sha256 || ""), `${item.animationId}: invalid FLA SHA-256`);
    invariant(Number.isInteger(source.bytes) && source.bytes > 0, `${item.animationId}: invalid FLA byte length`);
    invariant(typeof source.path === "string" && source.path.startsWith(`${SOURCE_PREFIX}/`),
      `${item.animationId}: FLA is outside the canonical archive`);
    invariant(!sources.has(source.path), `duplicate FLA source path: ${source.path}`);
    sources.add(source.path);
    invariant(item.source.swf?.physicalHashVerified === true,
      `${item.animationId}: paired SWF is missing or not physically verified`);
  }
  return items.sort((left, right) => {
    const part = Number(left.batch?.releasePart || 0) - Number(right.batch?.releasePart || 0);
    if (part) return part;
    const ordinal = Number(left.batch?.batchOrdinal || 0) - Number(right.batch?.batchOrdinal || 0);
    if (ordinal) return ordinal;
    return left.animationId.localeCompare(right.animationId, "en");
  });
}

async function stageOne({root, outputRoot, item, sourceManifest, check}) {
  const sourceRelative = item.source.fla.path;
  const sourceFile = path.resolve(root, sourceRelative);
  invariant(isInside(path.join(root, SOURCE_PREFIX), sourceFile), `${item.animationId}: source escapes the canonical archive`);
  await rejectSymlinkComponents(root, sourceFile, `${item.animationId}: source FLA`);
  const sourceRealRoot = await realpath(path.join(root, SOURCE_PREFIX));
  const sourceReal = await realpath(sourceFile);
  invariant(isInside(sourceRealRoot, sourceReal), `${item.animationId}: source FLA resolves outside the canonical archive`);
  const source = await regularFileIdentity(sourceFile, `${item.animationId}: source FLA`);
  invariant(source.identity.sha256 === item.source.fla.sha256,
    `${item.animationId}: source FLA hash differs from the preflight`);
  invariant(source.identity.bytes === item.source.fla.bytes,
    `${item.animationId}: source FLA byte length differs from the preflight`);
  invariant(source.bytes.subarray(0, 8).toString("hex") === OLE_COMPOUND_HEADER,
    `${item.animationId}: source is not a legacy OLE compound-binary FLA`);
  const archiveRelative = sourceRelative.slice(`${SOURCE_PREFIX}/`.length);
  invariant(sourceManifest.get(archiveRelative) === source.identity.sha256,
    `${item.animationId}: source freeze manifest binding is missing or stale`);

  const destination = path.join(outputRoot, "files", item.animationId, path.basename(sourceFile));
  await rejectSymlinkComponents(outputRoot, destination, `${item.animationId}: working copy`);
  if (!(await exists(destination))) {
    invariant(!check, `${item.animationId}: staged working copy is missing`);
    await mkdir(path.dirname(destination), {recursive: true});
    try {
      await copyFile(sourceFile, destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const working = await regularFileIdentity(destination, `${item.animationId}: staged working copy`);
  invariant((working.information.mode & 0o777) === 0o444,
    `${item.animationId}: staged working copy mode is not exactly 0444`);
  invariant(working.information.nlink === 1, `${item.animationId}: staged working copy must not be hard-linked`);
  invariant(!(working.information.dev === source.information.dev && working.information.ino === source.information.ino),
    `${item.animationId}: staged working copy aliases the source inode`);
  invariant(working.identity.sha256 === source.identity.sha256 && working.identity.bytes === source.identity.bytes,
    `${item.animationId}: staged working copy differs from the source FLA`);

  return {
    animationId: item.animationId,
    batch: {
      batchId: item.batch.batchId,
      batchOrdinal: item.batch.batchOrdinal,
      releasePart: item.batch.releasePart,
      releasePartCount: item.batch.releasePartCount,
    },
    source: {
      file: sourceRelative,
      sha256: source.identity.sha256,
      bytes: source.identity.bytes,
      sourceFreezeManifestPath: archiveRelative,
      legacyOleCompoundBinaryHeaderVerified: true,
      pairedSwf: {
        file: item.source.swf.path,
        sha256: item.source.swf.sha256,
        bytes: item.source.swf.bytes,
      },
    },
    workingCopy: {
      file: portable(root, destination),
      sha256: working.identity.sha256,
      bytes: working.identity.bytes,
      mode: "0444",
      readOnly: true,
      byteIdenticalToSource: true,
      separateRegularFile: true,
    },
    animateAuthoringAudit: {
      status: "not-run",
      captureFrame: "not-yet-selected-from-authoring-evidence",
      guiLaunchRequiredForThisPreparation: false,
    },
  };
}

function buildMarkdown(report) {
  const lines = [
    "# G4 L3 Adobe Animate prepare-only readiness",
    "",
    "This is acceptance-neutral source preparation. It is not an Adobe Animate authoring audit, original-runtime baseline, JavaScript fidelity result, human review, owner approval, or strict migration completion.",
    "",
    "## Result",
    "",
    `- FLA-backed lesson items: ${report.summary.flaBackedItems}`,
    `- Byte-identical read-only copies ready: ${report.summary.copiesReady}`,
    `- Source bytes staged: ${report.summary.sourceBytes}`,
    `- Content-addressed manifest: \`${report.contentAddressedManifest.file}\``,
    `- Manifest SHA-256: \`${report.contentAddressedManifest.sha256}\``,
    `- Animate/JSFL GUI executions: ${report.summary.animateGuiExecutions}`,
    `- Current automated Animate probe passed: ${report.summary.currentAutomatedAnimateProbePassed}`,
    `- Current failed probe receipts bound: ${report.toolBindings.currentAutomatedDisposableDocumentProbe.attempts.length}`,
    `- Authoring audits completed by this preparation: ${report.summary.authoringAuditsCompleted}`,
    `- Strict acceptance effect: ${report.summary.strictAcceptanceEffect}`,
    "",
    "## Existing-tool audit",
    "",
    `- Registered pilot mode is not reusable for this unscaffolded batch: ${report.toolBindings.existingAssistRunner.compatibilityAudit.registeredPilotMode.reason}`,
    `- FLA-only dependency mode is not reusable for these paired FLA+SWF items: ${report.toolBindings.existingAssistRunner.compatibilityAudit.dependencyFlaMode.reason}`,
    `- Paired FLA+SWF mode is available: ${report.toolBindings.existingAssistRunner.compatibilityAudit.pairedFlaSwfMode.reason}`,
    `- Next safe authoring step: ${report.toolBindings.existingAssistRunner.compatibilityAudit.nextSafeAuthoringStep.requirement}`,
    "",
    "No GUI was launched, no legacy dialog was acknowledged, and no file was saved, published, exported, or written under `source-assets/`, `migrations/`, the completion ledger, review records, approval records, or strict-acceptance records.",
    "",
  ];
  return lines.join("\n");
}

async function writeOrCheck(file, bytes, {check, label, readOnly = false, writeOnce = false}) {
  if (check) {
    invariant(await exists(file), `${label} is missing`);
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} is stale`);
    if (readOnly) {
      const information = await lstat(file);
      invariant((information.mode & 0o777) === 0o444, `${label} mode is not exactly 0444`);
    }
    return "checked";
  }
  await mkdir(path.dirname(file), {recursive: true});
  if (writeOnce || readOnly) {
    if (await exists(file)) {
      const existing = await readFile(file);
      invariant(existing.equals(bytes), `${label} already exists with different bytes`);
    } else {
      await writeFile(file, bytes, {flag: "wx"});
    }
  } else {
    await writeFile(file, bytes);
  }
  if (readOnly) await chmod(file, 0o444);
  if (readOnly) {
    const information = await lstat(file);
    invariant((information.mode & 0o777) === 0o444, `${label} mode is not exactly 0444`);
  }
  return "written";
}

export async function stageG4L3AnimateFlaCopies({
  root = ROOT,
  preflightFile = path.join(root, path.relative(ROOT, DEFAULT_PREFLIGHT)),
  outputRoot = path.join(root, path.relative(ROOT, DEFAULT_OUTPUT_ROOT)),
  jsonReport = path.join(root, path.relative(ROOT, DEFAULT_JSON_REPORT)),
  markdownReport = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN_REPORT)),
  animateBinary = DEFAULT_ANIMATE_BINARY,
  currentProbeFiles = DEFAULT_CURRENT_PROBE_FILES,
  expectedFlaCount = EXPECTED_FLA_COUNT,
  check = false,
} = {}) {
  invariant(isInside(path.join(root, "reports"), preflightFile),
    "G4 L3 preflight must be a child of the project reports directory");
  await rejectSymlinkComponents(root, preflightFile, "G4 L3 preflight");
  await assertSafeOutputRoot(root, outputRoot);
  await assertSafeReportOutput(root, jsonReport, "JSON readiness report");
  await assertSafeReportOutput(root, markdownReport, "Markdown readiness report");
  if (!check) await mkdir(outputRoot, {recursive: true});

  const [preflight, sourceManifestFile, toolBindings] = await Promise.all([
    regularFileIdentity(preflightFile, "G4 L3 preflight"),
    boundProjectFile(root, "catalog/source-manifest.sha256", "source freeze manifest"),
    loadToolBindings({root, animateBinary, currentProbeFiles}),
  ]);
  const preflightValue = JSON.parse(preflight.bytes.toString("utf8"));
  const items = selectFlaItems(preflightValue, expectedFlaCount);
  const sourceManifest = parseSourceManifest(sourceManifestFile.bytes);
  const entries = [];
  for (const item of items) {
    entries.push(await stageOne({root, outputRoot, item, sourceManifest, check}));
  }

  const manifest = {
    schemaVersion: 1,
    evidenceKind: "g4-l3-adobe-animate-prepare-only-fla-staging",
    lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
    scope: "Byte-identical read-only working copies and exact tool bindings only; no GUI execution or acceptance authority",
    authorityBoundary: {
      sourcePreparation: true,
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      javascriptImplementation: false,
      audioListening: false,
      visualOrBehavioralParity: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    inputs: {
      preflight: {file: portable(root, preflightFile), sha256: preflight.identity.sha256, bytes: preflight.identity.bytes},
      sourceFreezeManifest: sourceManifestFile.binding,
    },
    toolBindings,
    safetyContract: {
      prepareOnly: true,
      animateGuiLaunchAllowed: false,
      dialogInteractionAllowed: false,
      savePublishExportAllowed: false,
      sourceAssetWritesAllowed: false,
      migrationStatusReviewApprovalStrictWritesAllowed: false,
    },
    summary: {
      lessonCanonicalItems: preflightValue.summary.canonicalItems,
      activePages: preflightValue.summary.activePages,
      flaBackedItems: entries.length,
      swfOnlyItemsNotStaged: preflightValue.summary.swfOnly,
      sourceBytes: entries.reduce((sum, entry) => sum + entry.source.bytes, 0),
      copiesReady: entries.length,
      allReadOnly: entries.every((entry) => entry.workingCopy.readOnly),
      allByteIdentical: entries.every((entry) => entry.workingCopy.byteIdenticalToSource),
      allSourceFreezeBound: entries.every((entry) => entry.source.sourceFreezeManifestPath),
      animateGuiExecutions: 0,
      currentAutomatedAnimateProbePassed: false,
      authoringAuditsCompleted: 0,
      migrationOrAcceptanceWrites: 0,
      strictAcceptanceEffect: false,
    },
    entries,
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  const manifestSha256 = sha256(manifestBytes);
  const manifestFile = path.join(outputRoot, "manifests", "sha256", `${manifestSha256}.json`);
  await rejectSymlinkComponents(outputRoot, manifestFile, "content-addressed manifest");
  await writeOrCheck(manifestFile, manifestBytes, {
    check,
    label: "content-addressed staging manifest",
    readOnly: true,
    writeOnce: true,
  });

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-adobe-animate-prepare-only-readiness",
    scope: manifest.scope,
    authorityBoundary: manifest.authorityBoundary,
    contentAddressedManifest: {
      file: portable(root, manifestFile),
      sha256: manifestSha256,
      bytes: manifestBytes.length,
      address: `sha256:${manifestSha256}`,
      readOnly: true,
    },
    toolBindings,
    safetyContract: manifest.safetyContract,
    summary: manifest.summary,
    pending: {
      perItemCaptureFrameSelection: entries.length,
      animateAuthoringAudits: entries.length,
      originalRuntimeBaselines: preflightValue.summary.canonicalItems,
      javascriptImplementations: preflightValue.summary.canonicalItems - Number(preflightValue.summary.existingDeclaredRenderers || 0),
      note: "Staging does not open either closed migration batch gate and does not scaffold migrations.",
    },
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(buildMarkdown(report));
  await writeOrCheck(jsonReport, jsonBytes, {check, label: "JSON readiness report"});
  await writeOrCheck(markdownReport, markdownBytes, {check, label: "Markdown readiness report"});
  return {manifest, manifestFile, manifestSha256, report, jsonReport, markdownReport};
}

export function parseArguments(argv) {
  const options = {
    check: false,
    preflightFile: DEFAULT_PREFLIGHT,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    jsonReport: DEFAULT_JSON_REPORT,
    markdownReport: DEFAULT_MARKDOWN_REPORT,
    animateBinary: DEFAULT_ANIMATE_BINARY,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--preflight") options.preflightFile = path.resolve(argv[++index] || invariant(false, "--preflight requires a path"));
    else if (value === "--output-root") options.outputRoot = path.resolve(argv[++index] || invariant(false, "--output-root requires a path"));
    else if (value === "--json-report") options.jsonReport = path.resolve(argv[++index] || invariant(false, "--json-report requires a path"));
    else if (value === "--markdown-report") options.markdownReport = path.resolve(argv[++index] || invariant(false, "--markdown-report requires a path"));
    else if (value === "--animate-binary") options.animateBinary = path.resolve(argv[++index] || invariant(false, "--animate-binary requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/stage-g4-l3-animate-fla-copies.mjs [options]",
    "",
    "Stages all 29 G4 L3 FLA-backed pages as byte-identical mode-0444 work-only",
    "copies and writes a content-addressed manifest plus acceptance-neutral",
    "readiness report. This command never launches Adobe Animate.",
    "",
    "Options:",
    "  --check                    Verify all copies, bindings, manifest, and reports without writing",
    "  --preflight <file>         G4 L3 automation preflight JSON",
    "  --output-root <dir>        Child directory under work/animate/",
    "  --json-report <file>       Child file under reports/",
    "  --markdown-report <file>   Child file under reports/",
    "  --animate-binary <file>    Executable to bind by hash; never launched",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await stageG4L3AnimateFlaCopies(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "prepared",
    flaBackedItems: result.report.summary.flaBackedItems,
    copiesReady: result.report.summary.copiesReady,
    manifest: result.report.contentAddressedManifest,
    animateLaunched: false,
    migrationOrAcceptanceWrites: false,
    strictAcceptanceEffect: false,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
