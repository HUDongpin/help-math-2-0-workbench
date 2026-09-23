#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildG4L3AnimateAuthoringRelocationReceipt,
  relocationAttemptKey,
} from "./build-g4-l3-animate-authoring-relocation-receipt.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_QUEUE = path.join(ROOT, "reports", "g4-l3-animate-authoring-operator-queue.json");
const DEFAULT_ASSIST_ROOT = path.join(ROOT, "work", "animate", "dependency-authoring-audits");
const DEFAULT_JSON = path.join(ROOT, "reports", "g4-l3-animate-authoring-audit-index.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "g4-l3-animate-authoring-audit-index.md");
const DEFAULT_RELOCATION_RECEIPT = path.join(ROOT, "reports", "g4-l3-animate-authoring-relocation-receipt.json");
const EXPECTED_COUNT = 29;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const DEFAULT_REPAIR_EVIDENCE_IDS = Object.freeze({
  "course-g04-l03-gs-002": ["course-g04-l03-gs-002-sharded-v2"],
});

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
    if (!information) continue;
    invariant(!information.isSymbolicLink(), `${label} contains a symbolic-link path component: ${cursor}`);
  }
}

async function fileIdentity(file, label, {mode = null, readOnly = false} = {}) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  invariant(information.nlink === 1, `${label} must have exactly one hard link`);
  if (mode != null) {
    invariant((information.mode & 0o777) === mode,
      `${label} mode must be exactly ${mode.toString(8).padStart(4, "0")}`);
  }
  if (readOnly) invariant((information.mode & 0o222) === 0, `${label} must be read-only`);
  const bytes = await readFile(file);
  return {
    bytes,
    information,
    binding: {
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
    },
  };
}

async function projectReference(root, reference, label, {inside = root, mode = null, readOnly = false} = {}) {
  invariant(reference?.file && typeof reference.file === "string" && !path.isAbsolute(reference.file),
    `${label} has no valid project-relative file binding`);
  invariant(SHA256_PATTERN.test(reference.sha256 || ""), `${label} has no valid SHA-256 binding`);
  const file = path.resolve(root, reference.file);
  invariant(isInside(inside, file), `${label} escapes its allowed root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label, {mode, readOnly});
  invariant(identity.binding.sha256 === reference.sha256, `${label} SHA-256 is stale`);
  if (reference.bytes != null) {
    invariant(identity.binding.bytes === reference.bytes, `${label} byte length is stale`);
  }
  return {file, bytes: identity.bytes, binding: {file: portable(root, file), ...identity.binding}};
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function sameIdentity(actual, expected) {
  return actual?.file === expected?.file && actual?.sha256 === expected?.sha256 && actual?.bytes === expected?.bytes;
}

function pngDimensions(bytes, label) {
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `${label} is not a PNG`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function decodeFileUri(uri, label) {
  invariant(typeof uri === "string" && uri.startsWith("file:"), `${label} has an invalid file URI`);
  try {
    return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/u, "");
  } catch (error) {
    throw new Error(`${label} has an invalid encoded file URI: ${error.message}`);
  }
}

function verifyDocumentPathOrRelocation({
  root,
  uri,
  label,
  artifact,
  artifactBinding,
  evidenceId,
  runId,
  workingCopy,
  receiptBinding,
  relocation,
}) {
  const decoded = path.resolve(decodeFileUri(uri, label));
  const current = path.resolve(root, workingCopy.file);
  if (decoded === current) return {used: false, key: null};
  const key = relocationAttemptKey(evidenceId, runId);
  const entry = relocation?.lookup.get(key);
  invariant(entry, `${label} opened an unexpected FLA and has no verified relocation receipt`);
  invariant(path.resolve(entry.relocation.oldAbsolutePath) === decoded
    && path.resolve(entry.relocation.newAbsolutePath) === current,
  `${label} relocation roots do not match the recorded/current FLA`);
  invariant(entry.workingCopy.file === workingCopy.file
    && entry.workingCopy.sha256 === workingCopy.sha256
    && entry.workingCopy.bytes === workingCopy.bytes,
  `${label} relocation working-copy binding differs`);
  invariant(entry.runReceipt.file === receiptBinding.file
    && entry.runReceipt.sha256 === receiptBinding.sha256
    && entry.runReceipt.bytes === receiptBinding.bytes,
  `${label} relocation run-receipt binding differs`);
  const pathRecord = entry.relocation.documentPaths.find((candidate) => candidate.artifact === artifact);
  invariant(pathRecord?.uri === uri && pathRecord.artifactSha256 === artifactBinding.sha256,
    `${label} relocation artifact binding differs`);
  return {used: true, key, receiptSha256: relocation.jsonBinding.sha256};
}

function countAuthoringScripts(report, label) {
  invariant(report.recursiveLibraryTimelineAudit === true, `${label} is not a recursive authoring audit`);
  invariant(Array.isArray(report.timeline?.layers), `${label} root timeline has no layers`);
  invariant(Array.isArray(report.library), `${label} has no materialized library array`);
  let frameScriptsPresent = 0;
  let attachedScriptsPresent = 0;
  const timelines = [report.timeline, ...report.library.filter((item) => item.timeline).map((item) => item.timeline)];
  for (const timeline of timelines) {
    invariant(Array.isArray(timeline.layers), `${label} contains a timeline without layers`);
    for (const layer of timeline.layers) {
      invariant(Array.isArray(layer.keyframes), `${label} contains a layer without keyframes`);
      for (const keyframe of layer.keyframes) {
        invariant(Array.isArray(keyframe.elements), `${label} contains a keyframe without elements`);
        invariant(typeof keyframe.actionScriptLength === "number" && typeof keyframe.actionScript === "string",
          `${label} contains a keyframe without a script body inventory`);
        invariant(keyframe.actionScript.length === keyframe.actionScriptLength,
          `${label} contains a keyframe script length/body mismatch`);
        if (keyframe.actionScriptLength > 0) frameScriptsPresent += 1;
        for (const element of keyframe.elements) {
          invariant(Object.hasOwn(element, "attachedActionScript")
            && typeof element.attachedActionScriptLength === "number",
          `${label} contains an element without an attached-script body inventory`);
          const attachedLength = typeof element.attachedActionScript === "string"
            ? element.attachedActionScript.length
            : 0;
          invariant(attachedLength === element.attachedActionScriptLength,
            `${label} contains an attached-script length/body mismatch`);
          if (element.attachedActionScriptLength > 0) attachedScriptsPresent += 1;
        }
      }
    }
  }
  return {frameScriptsPresent, attachedScriptsPresent};
}

function validateSourceBinding(value, {evidenceId, sourceFla, sourceSwf}, label) {
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding",
    `${label} schema changed`);
  invariant(value.evidenceId === evidenceId && value.sourceKind === "paired-fla-swf", `${label} identity changed`);
  invariant(value.acceptanceEffect === "none; work-only authoring evidence preparation",
    `${label} claims acceptance authority`);
  invariant(sameIdentity(value.source, sourceFla), `${label} FLA source binding differs`);
  invariant(sameIdentity(value.shippedSwf?.source, sourceSwf), `${label} SWF source binding differs`);
  invariant(value.intendedAudit?.captureFrame === 1
    && value.intendedAudit?.recursiveRootAndLibraryTimelines === true
    && value.intendedAudit?.frameAndInstanceScriptInventory === true
    && value.intendedAudit?.nativeStagePng === true
    && value.intendedAudit?.saveOrPublishAllowed === false,
  `${label} intended-audit contract changed`);
  invariant(value.generatedBy?.file === "scripts/run-assisted-animate-authoring-audit.mjs"
    && SHA256_PATTERN.test(value.generatedBy?.sha256 || ""), `${label} has no valid historical generator binding`);
}

async function verifyBoundCopy(root, reference, expectedSource, evidenceRoot, directory, label) {
  invariant(reference?.mode === "0444" && reference.readOnly === true
    && reference.byteIdenticalToSource === true && reference.separateRegularFile === true,
  `${label} declared read-only/copy contract changed`);
  const result = await projectReference(root, reference, label, {
    inside: path.join(evidenceRoot, directory),
    mode: 0o444,
  });
  invariant(result.binding.sha256 === expectedSource.sha256 && result.binding.bytes === expectedSource.bytes,
    `${label} differs from its canonical source`);
  return result.binding;
}

async function verifyRunReference(root, reference, runDir, label) {
  return projectReference(root, reference, label, {inside: runDir});
}

function validatePostRun(receipt, sourceFla, sourceSwf, label) {
  const post = receipt.postRunVerification;
  invariant(post?.sourceSha256 === sourceFla.sha256 && post.workingCopySha256 === sourceFla.sha256
    && post.workingCopyReadOnly === true, `${label} post-run FLA verification differs`);
  invariant(post?.sourceSwfSha256 === sourceSwf.sha256 && post.stagedSwfSha256 === sourceSwf.sha256
    && post.stagedSwfReadOnly === true, `${label} post-run SWF verification differs`);
}

function validateWorkEvidence(value, {
  evidenceId,
  sourceFla,
  sourceSwf,
  sourceBinding,
  workingCopy,
  stagedSwf,
  artifacts,
  scripts,
  evidenceRoot,
  root,
}, label) {
  invariant(value.schemaVersion === 1 && value.evidenceKind === "adobe-animate-paired-fla-swf-authoring-audit",
    `${label} schema changed`);
  invariant(value.status === "verified-work-only-authoring-audit" && value.evidenceId === evidenceId
    && value.sourceKind === "paired-fla-swf", `${label} identity/status changed`);
  invariant(typeof value.acceptanceEffect === "string" && value.acceptanceEffect.startsWith("none;"),
    `${label} claims acceptance authority`);
  invariant(value.sourceBinding?.file === sourceBinding.file && value.sourceBinding?.sha256 === sourceBinding.sha256
    && sameIdentity(value.sourceBinding?.source, sourceFla) && value.sourceBinding?.sourceUnchangedAfterAudit === true,
  `${label} source binding differs`);
  invariant(value.workingCopy?.file === workingCopy.file && value.workingCopy?.sha256 === workingCopy.sha256
    && value.workingCopy?.bytes === workingCopy.bytes && value.workingCopy?.mode === "0444"
    && value.workingCopy?.readOnlyAfterAudit === true && value.workingCopy?.byteIdenticalToSourceAfterAudit === true,
  `${label} FLA working-copy evidence differs`);
  invariant(sameIdentity(value.shippedSwfBinding?.source, sourceSwf)
    && value.shippedSwfBinding?.stagedCopy?.file === stagedSwf.file
    && value.shippedSwfBinding?.stagedCopy?.sha256 === stagedSwf.sha256
    && value.shippedSwfBinding?.stagedCopy?.bytes === stagedSwf.bytes
    && value.shippedSwfBinding?.stagedCopy?.mode === "0444"
    && value.shippedSwfBinding?.sourceUnchangedAfterAudit === true
    && value.shippedSwfBinding?.stagedCopyReadOnlyAfterAudit === true
    && value.shippedSwfBinding?.stagedCopyByteIdenticalAfterAudit === true
    && value.shippedSwfBinding?.executedByThisAuthoringAudit === false,
  `${label} SWF binding or non-execution boundary differs`);
  invariant(value.humanDialogBoundary?.designatedOperator === "Dr. Peter Hu"
    && value.humanDialogBoundary?.operatorNameIsNotReviewOrApproval === true
    && value.humanDialogBoundary?.automatedDialogInteractionUsed === false,
  `${label} dialog-operator authority boundary differs`);
  invariant(value.protocol?.oneFlaPerColdStartProcess === true
    && value.protocol?.openedOnlyWorkingCopy === true
    && value.protocol?.openedSourceDirectly === false
    && value.protocol?.saveAllowed === false
    && value.protocol?.publishAllowed === false
    && value.protocol?.closeWithoutSaving === true
    && value.protocol?.recursiveRootAndLibraryTimelines === true
    && value.protocol?.nativeStagePng === true
    && value.protocol?.shippedSwfExecuted === false,
  `${label} audit protocol changed`);
  invariant(value.scripts?.auditTemplate?.file === scripts.auditTemplate.file
    && value.scripts?.auditTemplate?.sha256 === scripts.auditTemplate.sha256
    && value.scripts?.generatedDependencyAudit?.file === scripts.generatedAudit.file
    && value.scripts?.generatedDependencyAudit?.sha256 === scripts.generatedAudit.sha256
    && value.scripts?.controller?.file === scripts.controller.file
    && value.scripts?.controller?.sha256 === scripts.controller.sha256,
  `${label} script bindings differ`);
  invariant(value.capturedAuthoringFrame?.file === artifacts.png.file
    && value.capturedAuthoringFrame?.sha256 === artifacts.png.sha256
    && value.capturedAuthoringFrame?.flashFrame === 1
    && value.rawAudit?.file === artifacts.report.file && value.rawAudit?.sha256 === artifacts.report.sha256
    && value.controllerMarker?.file === artifacts.marker.file && value.controllerMarker?.sha256 === artifacts.marker.sha256,
  `${label} artifact bindings differ`);
  invariant(value.writeBoundary?.root === portable(root, evidenceRoot) && value.writeBoundary?.workOnly === true
    && value.writeBoundary?.migrationFilesWritten === false && value.writeBoundary?.statusFilesWritten === false
    && value.writeBoundary?.approvalFilesWritten === false, `${label} write boundary changed`);
}

async function verifyAttempt({root, assistRoot, evidenceId, role, runDir, queueEntry, absoluteIdentityCache, relocation}) {
  const label = `${queueEntry.animationId}/${evidenceId}/${path.basename(runDir)}`;
  const evidenceRoot = path.join(assistRoot, evidenceId);
  invariant(isInside(assistRoot, evidenceRoot), `${label} evidence root escapes the assist root`);
  invariant(isInside(path.join(evidenceRoot, "runs"), runDir), `${label} run directory escapes its evidence root`);
  const receiptFile = path.join(runDir, "assisted-run-result.json");
  const receiptDocument = await fileIdentity(receiptFile, `${label} receipt`);
  const receiptBinding = {file: portable(root, receiptFile), ...receiptDocument.binding};
  const receipt = parseJson(receiptDocument.bytes, `${label} receipt`);
  const relocationUses = [];
  invariant(receipt.schemaVersion === 1
    && receipt.evidenceKind === "human-assisted-adobe-animate-dependency-authoring-audit-run",
  `${label} receipt schema changed`);
  invariant(receipt.evidenceId === evidenceId && receipt.sourceKind === "paired-fla-swf", `${label} receipt identity changed`);
  invariant(receipt.status === "passed" || receipt.status === "failed", `${label} has an unsupported status`);
  invariant(receipt.acceptanceEffect === "none; work-only dependency/paired-source authoring audit",
    `${label} receipt claims acceptance authority`);
  invariant(receipt.humanActionBoundary?.designatedOperator === "Dr. Peter Hu"
    && receipt.humanActionBoundary?.automatedDialogInteractionUsed === false
    && receipt.humanActionBoundary?.reviewOrOwnerDecisionRecorded === false,
  `${label} human-action authority boundary differs`);
  invariant(receipt.migrationOrApprovalWrites === false, `${label} records migration or approval writes`);

  const sourceFla = queueEntry.sourcePair.fla;
  const sourceSwf = queueEntry.sourcePair.swf;
  invariant(sameIdentity(receipt.source, sourceFla), `${label} FLA source differs from the queue`);
  invariant(sameIdentity(receipt.shippedSwf?.source, sourceSwf), `${label} SWF source differs from the queue`);
  const workingCopy = await verifyBoundCopy(root, receipt.workingCopy, sourceFla, evidenceRoot, "working-copy", `${label} FLA copy`);
  const stagedSwf = await verifyBoundCopy(root, receipt.shippedSwf.workingCopy, sourceSwf, evidenceRoot,
    "runtime-source", `${label} SWF copy`);

  const sourceBindingDocument = await projectReference(root, receipt.sourceBinding, `${label} source binding`, {
    inside: evidenceRoot,
    mode: 0o444,
  });
  const sourceBinding = parseJson(sourceBindingDocument.bytes, `${label} source binding`);
  validateSourceBinding(sourceBinding, {evidenceId, sourceFla, sourceSwf}, `${label} source binding`);
  invariant(sourceBinding.workingCopy?.file === workingCopy.file && sourceBinding.workingCopy?.sha256 === workingCopy.sha256,
    `${label} source-binding FLA copy differs`);
  invariant(sourceBinding.shippedSwf?.workingCopy?.file === stagedSwf.file
    && sourceBinding.shippedSwf?.workingCopy?.sha256 === stagedSwf.sha256,
  `${label} source-binding SWF copy differs`);

  invariant(receipt.captureFrame === 1, `${label} capture frame changed`);
  invariant(receipt.command?.spawnedAnimateProcessCount === 1 && receipt.command?.intentionallyOmitsQuitFlag === true,
    `${label} process-isolation command contract changed`);
  invariant(Array.isArray(receipt.command?.args) && receipt.command.args.length === 3
    && receipt.command.args[0] === "--run-jsfl" && receipt.command.args[1] === "-o"
    && receipt.command.args[2] === receipt.scripts?.controller?.file,
  `${label} Animate command/controller binding differs`);
  invariant(path.isAbsolute(receipt.command.executable) && SHA256_PATTERN.test(receipt.command.executableSha256 || ""),
    `${label} Animate executable binding is malformed`);
  let executable = absoluteIdentityCache.get(receipt.command.executable);
  if (!executable) {
    await rejectSymlinkComponents(path.parse(receipt.command.executable).root, receipt.command.executable, `${label} Animate executable`);
    executable = await fileIdentity(receipt.command.executable, `${label} Animate executable`);
    absoluteIdentityCache.set(receipt.command.executable, executable);
  }
  invariant(executable.binding.sha256 === receipt.command.executableSha256,
    `${label} Animate executable SHA-256 is stale`);

  const auditTemplate = await projectReference(root, receipt.scripts?.auditTemplate, `${label} audit template`);
  const generatedAudit = await verifyRunReference(root, receipt.scripts?.generatedAudit, runDir, `${label} generated audit`);
  const controller = await verifyRunReference(root, receipt.scripts?.controller, runDir, `${label} controller`);
  const stdout = await verifyRunReference(root, receipt.process?.stdout, runDir, `${label} stdout`);
  const stderr = await verifyRunReference(root, receipt.process?.stderr, runDir, `${label} stderr`);
  validatePostRun(receipt, sourceFla, sourceSwf, label);

  const base = {
    role,
    evidenceId,
    runId: path.basename(runDir),
    status: receipt.status,
    receipt: receiptBinding,
    sourceBinding: sourceBindingDocument.binding,
    workingCopy,
    stagedSwf,
    scripts: {
      auditTemplate: auditTemplate.binding,
      generatedAudit: generatedAudit.binding,
      controller: controller.binding,
    },
    process: {
      exitCode: receipt.process.exitCode,
      signal: receipt.process.signal,
      timedOut: receipt.process.timedOut,
      durationMs: receipt.process.durationMs,
      stdout: stdout.binding,
      stderr: stderr.binding,
    },
    dialogOperator: receipt.humanActionBoundary.designatedOperator,
    automatedDialogInteractionUsed: false,
    reviewOrOwnerDecisionRecorded: false,
    migrationOrApprovalWrites: false,
    acceptanceEffect: false,
  };

  if (receipt.status === "failed") {
    invariant(receipt.artifacts == null && receipt.workEvidence == null, `${label} failed receipt unexpectedly claims artifacts`);
    invariant(typeof receipt.failure === "string" && receipt.failure.length > 0, `${label} failed receipt has no failure`);
    const processFailed = receipt.process?.exitCode !== 0 || receipt.process?.signal || receipt.process?.timedOut === true;
    let failureDiagnostic = null;
    if (!processFailed) {
      invariant(receipt.process?.exitCode === 0 && receipt.process?.signal == null && receipt.process?.timedOut === false,
        `${label} failed receipt has an invalid process disposition`);
      const markerFile = path.join(runDir, "controller-result.json");
      invariant(await exists(markerFile), `${label} clean-process failure has no controller diagnostic`);
      const markerDocument = await fileIdentity(markerFile, `${label} failed controller diagnostic`);
      const marker = parseJson(markerDocument.bytes, `${label} failed controller diagnostic`);
      invariant(marker.status === "failed" && typeof marker.message === "string" && marker.message.length > 0,
        `${label} clean-process failure controller diagnostic is not failed`);
      invariant(marker.captureFrame === 1, `${label} clean-process failure diagnostic capture frame changed`);
      relocationUses.push(verifyDocumentPathOrRelocation({
        root,
        uri: marker.documentPathURI,
        label: `${label} failed controller diagnostic`,
        artifact: "failureDiagnostic",
        artifactBinding: markerDocument.binding,
        evidenceId,
        runId: path.basename(runDir),
        workingCopy,
        receiptBinding,
        relocation,
      }));
      failureDiagnostic = {
        file: portable(root, markerFile),
        ...markerDocument.binding,
        status: marker.status,
        message: marker.message,
      };
    }
    return {
      ...base,
      failure: receipt.failure,
      failureDisposition: processFailed ? "animate-process-failed-or-terminated" : "post-process-artifact-validation-failed",
      failureDiagnostic,
      pathRelocation: relocationUses.some(({used}) => used)
        ? relocationUses.find(({used}) => used)
        : null,
      artifacts: null,
      workEvidence: null,
    };
  }

  invariant(receipt.process?.exitCode === 0 && receipt.process?.signal == null && receipt.process?.timedOut === false,
    `${label} passing receipt did not exit cleanly`);
  invariant(receipt.failure == null && receipt.artifacts && receipt.workEvidence, `${label} passing receipt is incomplete`);
  const markerDocument = await verifyRunReference(root, receipt.artifacts.marker, runDir, `${label} controller marker`);
  const reportDocument = await verifyRunReference(root, receipt.artifacts.report, runDir, `${label} raw authoring report`);
  const pngDocument = await verifyRunReference(root, receipt.artifacts.png, runDir, `${label} authoring PNG`);
  const evidenceDocument = await verifyRunReference(root, receipt.workEvidence, runDir, `${label} work evidence`);
  const marker = parseJson(markerDocument.bytes, `${label} controller marker`);
  const report = parseJson(reportDocument.bytes, `${label} raw authoring report`);
  const workEvidence = parseJson(evidenceDocument.bytes, `${label} work evidence`);

  invariant(marker.status === "passed" && marker.captureFrame === 1
    && marker.animateVersion === receipt.artifacts.animateVersion, `${label} controller marker differs`);
  relocationUses.push(verifyDocumentPathOrRelocation({
    root,
    uri: marker.documentPathURI,
    label: `${label} controller marker`,
    artifact: "controllerMarker",
    artifactBinding: markerDocument.binding,
    evidenceId,
    runId: path.basename(runDir),
    workingCopy,
    receiptBinding,
    relocation,
  }));
  invariant(report.schemaVersion === 1 && report.evidenceKind === "adobe-animate-authoring-audit",
    `${label} raw authoring report schema changed`);
  invariant(report.animateVersion === marker.animateVersion && report.document?.name === path.basename(workingCopy.file),
    `${label} raw authoring report identity differs`);
  relocationUses.push(verifyDocumentPathOrRelocation({
    root,
    uri: report.document?.pathURI,
    label: `${label} raw authoring report`,
    artifact: "rawAuthoringReport",
    artifactBinding: reportDocument.binding,
    evidenceId,
    runId: path.basename(runDir),
    workingCopy,
    receiptBinding,
    relocation,
  }));
  invariant(report.timeline?.currentFlashFrame === 1 && Number.isInteger(report.timeline?.frameCount)
    && report.timeline.frameCount >= 1, `${label} raw authoring timeline is invalid`);
  const scriptCounts = countAuthoringScripts(report, `${label} raw authoring report`);
  const dimensions = pngDimensions(pngDocument.bytes, `${label} authoring PNG`);
  invariant(dimensions.width === report.document.width && dimensions.height === report.document.height,
    `${label} authoring PNG is not at native stage size`);
  invariant(receipt.artifacts.png.width === dimensions.width && receipt.artifacts.png.height === dimensions.height,
    `${label} receipt PNG dimensions differ`);
  const expectedSummary = {
    capturedAt: report.capturedAt,
    stage: {width: report.document.width, height: report.document.height},
    fps: report.document.frameRate,
    frameCount: report.timeline.frameCount,
    backgroundColor: report.document.backgroundColor,
    rootLayerCount: report.timeline.layerCount,
    libraryItemCount: report.document.libraryItemCount,
    ...scriptCounts,
    scriptBodiesRequired: true,
  };
  invariant(JSON.stringify(receipt.artifacts.reportSummary) === JSON.stringify(expectedSummary),
    `${label} report summary differs from the raw authoring audit`);
  validateWorkEvidence(workEvidence, {
    evidenceId,
    sourceFla,
    sourceSwf,
    sourceBinding: sourceBindingDocument.binding,
    workingCopy,
    stagedSwf,
    artifacts: {
      marker: markerDocument.binding,
      report: reportDocument.binding,
      png: {...pngDocument.binding, ...dimensions},
    },
    scripts: {
      auditTemplate: auditTemplate.binding,
      generatedAudit: generatedAudit.binding,
      controller: controller.binding,
    },
    evidenceRoot,
    root,
  }, `${label} work evidence`);
  invariant(JSON.stringify(workEvidence.nativeMovie) === JSON.stringify(expectedSummary),
    `${label} work-evidence movie summary differs`);
  invariant(workEvidence.capturedAuthoringFrame?.width === dimensions.width
    && workEvidence.capturedAuthoringFrame?.height === dimensions.height,
  `${label} work-evidence PNG dimensions differ`);

  return {
    ...base,
    failure: null,
    capturedAt: report.capturedAt,
    animateVersion: report.animateVersion,
    reportSummary: expectedSummary,
    artifacts: {
      marker: markerDocument.binding,
      report: reportDocument.binding,
      png: {...pngDocument.binding, ...dimensions},
    },
    workEvidence: evidenceDocument.binding,
    pathRelocation: relocationUses.some(({used}) => used)
      ? relocationUses.find(({used}) => used)
      : null,
  };
}

async function listRunDirectories(evidenceRoot) {
  const runsRoot = path.join(evidenceRoot, "runs");
  if (!(await exists(runsRoot))) return [];
  const entries = await readdir(runsRoot, {withFileTypes: true});
  const directories = [];
  for (const entry of entries) {
    invariant(!entry.isSymbolicLink(), `${evidenceRoot}: run entry is a symbolic link: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    invariant(/^run-[A-Za-z0-9_-]+$/u.test(entry.name), `${evidenceRoot}: malformed run directory: ${entry.name}`);
    const runDir = path.join(runsRoot, entry.name);
    if (await exists(path.join(runDir, "assisted-run-result.json"))) directories.push(runDir);
  }
  return directories.sort((left, right) => left.localeCompare(right));
}

function selectPassingAttempt(attempts) {
  const passing = attempts.filter(({status}) => status === "passed");
  passing.sort((left, right) => {
    const leftTime = Date.parse(left.capturedAt || "");
    const rightTime = Date.parse(right.capturedAt || "");
    const safeLeft = Number.isFinite(leftTime) ? leftTime : -1;
    const safeRight = Number.isFinite(rightTime) ? rightTime : -1;
    return safeRight - safeLeft || left.receipt.file.localeCompare(right.receipt.file);
  });
  return passing[0] || null;
}

async function loadQueue(root, queueFile, expectedCount) {
  invariant(isInside(path.join(root, "reports"), queueFile), "operator queue must be under reports/");
  await rejectSymlinkComponents(root, queueFile, "G4 L3 Animate operator queue");
  const document = await fileIdentity(queueFile, "G4 L3 Animate operator queue");
  const value = parseJson(document.bytes, "G4 L3 Animate operator queue");
  invariant(value.schemaVersion === 1
    && value.reportType === "g4-l3-adobe-animate-human-assisted-authoring-operator-queue",
  "unexpected G4 L3 Animate operator-queue schema");
  invariant(value.summary?.totalItems === expectedCount && value.queue?.length === expectedCount,
    `operator queue must contain exactly ${expectedCount} entries`);
  invariant(value.authorityBoundary?.adobeAnimateAuthoringAudit === false
    && value.authorityBoundary?.originalRuntimeBehavior === false
    && value.authorityBoundary?.strictAcceptance === false,
  "operator queue authority boundary changed");
  return {
    value,
    binding: {file: portable(root, queueFile), ...document.binding},
  };
}

async function verifyQueueSource(root, declared, label) {
  invariant(declared?.file && !path.isAbsolute(declared.file) && SHA256_PATTERN.test(declared.sha256 || "")
    && Number.isInteger(declared.bytes) && declared.bytes > 0, `${label} binding is malformed`);
  const result = await projectReference(root, declared, label);
  return {file: result.binding.file, sha256: result.binding.sha256, bytes: result.binding.bytes};
}

export async function buildG4L3AnimateAuthoringAuditIndex({
  root = ROOT,
  queueFile = path.join(root, path.relative(ROOT, DEFAULT_QUEUE)),
  assistRoot = path.join(root, path.relative(ROOT, DEFAULT_ASSIST_ROOT)),
  jsonReport = path.join(root, path.relative(ROOT, DEFAULT_JSON)),
  markdownReport = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN)),
  relocationReceipt = path.join(root, path.relative(ROOT, DEFAULT_RELOCATION_RECEIPT)),
  expectedCount = EXPECTED_COUNT,
  repairEvidenceIds = DEFAULT_REPAIR_EVIDENCE_IDS,
  check = false,
} = {}) {
  invariant(Number.isInteger(expectedCount) && expectedCount > 0, "expectedCount must be a positive integer");
  invariant(isInside(path.join(root, "work", "animate"), assistRoot), "assist root must be under work/animate/");
  await rejectSymlinkComponents(root, assistRoot, "G4 L3 Animate assist root");
  const queue = await loadQueue(root, queueFile, expectedCount);
  const relocation = await exists(relocationReceipt)
    ? await buildG4L3AnimateAuthoringRelocationReceipt({root, jsonOutput: relocationReceipt, check: true})
    : null;
  const generator = await projectReference(root, {
    file: "scripts/build-g4-l3-animate-authoring-audit-index.mjs",
    sha256: sha256(await readFile(path.join(root, "scripts", "build-g4-l3-animate-authoring-audit-index.mjs"))),
  }, "G4 L3 Animate result-index generator");
  const ids = new Set();
  const absoluteIdentityCache = new Map();
  const items = [];

  for (const [index, queueEntry] of queue.value.queue.entries()) {
    const animationId = queueEntry.animationId;
    invariant(queueEntry.queueOrdinal === index + 1, `${animationId}: queue ordinal changed`);
    invariant(animationId && !ids.has(animationId), `duplicate queue animation ID: ${animationId}`);
    ids.add(animationId);
    invariant(queueEntry.sourcePair?.sourceKind === "fla+swf"
      && queueEntry.sourcePair?.bothSourceFreezeBound === true
      && queueEntry.sourcePair?.flaSwfEquivalenceProven === false
      && queueEntry.sourcePair?.shippedSwfExecutedByAuthoringAudit === false,
    `${animationId}: source-pair authority boundary changed`);
    const sourceFla = await verifyQueueSource(root, queueEntry.sourcePair.fla, `${animationId}: source FLA`);
    const sourceSwf = await verifyQueueSource(root, queueEntry.sourcePair.swf, `${animationId}: source SWF`);
    const repairs = repairEvidenceIds[animationId] || [];
    const evidenceRoutes = [
      {evidenceId: animationId, role: "primary"},
      ...repairs.map((evidenceId) => ({evidenceId, role: "repair"})),
    ];
    const routeIds = new Set();
    const attempts = [];
    for (const route of evidenceRoutes) {
      invariant(route.evidenceId && !routeIds.has(route.evidenceId), `${animationId}: duplicate evidence route`);
      routeIds.add(route.evidenceId);
      const evidenceRoot = path.join(assistRoot, route.evidenceId);
      invariant(isInside(assistRoot, evidenceRoot), `${animationId}: evidence route escapes the assist root`);
      const runs = await listRunDirectories(evidenceRoot);
      if (route.role === "primary") invariant(runs.length > 0, `${animationId}: primary run receipt is missing`);
      for (const runDir of runs) {
        attempts.push(await verifyAttempt({
          root,
          assistRoot,
          evidenceId: route.evidenceId,
          role: route.role,
          runDir,
          queueEntry: {...queueEntry, sourcePair: {...queueEntry.sourcePair, fla: sourceFla, swf: sourceSwf}},
          absoluteIdentityCache,
          relocation,
        }));
      }
    }
    const selected = selectPassingAttempt(attempts);
    items.push({
      queueOrdinal: queueEntry.queueOrdinal,
      animationId,
      batch: queueEntry.batch,
      sourcePair: {
        sourceKind: "fla+swf",
        fla: sourceFla,
        swf: sourceSwf,
        bothSourceFilesReverified: true,
        shippedSwfExecutedByTheseAudits: false,
        flaSwfEquivalenceProven: false,
      },
      evidenceRoutes,
      status: selected ? "verified-work-only-authoring-audit" : "pending-after-failed-audit-attempts",
      attempts,
      selectedPassingAudit: selected ? {
        evidenceId: selected.evidenceId,
        runId: selected.runId,
        receipt: selected.receipt,
        workEvidence: selected.workEvidence,
        artifacts: selected.artifacts,
        animateVersion: selected.animateVersion,
        capturedAt: selected.capturedAt,
        nativeMovie: selected.reportSummary,
        authority: "work-only Adobe Animate authoring structure",
        acceptanceEffect: false,
      } : null,
      pendingReason: selected ? null : "No hash-valid passing work-only authoring-audit receipt exists for the declared evidence routes.",
      originalRuntimeBehaviorEstablished: false,
      humanVisualReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictAcceptanceEffect: false,
    });
  }

  const attempts = items.flatMap((item) => item.attempts);
  const passedItems = items.filter(({selectedPassingAudit}) => selectedPassingAudit);
  const pendingItems = items.filter(({selectedPassingAudit}) => !selectedPassingAudit);
  const failedAttempts = attempts.filter(({status}) => status === "failed");
  const primaryAttempts = attempts.filter(({role}) => role === "primary");
  const repairAttempts = attempts.filter(({role}) => role === "repair");
  invariant(primaryAttempts.length >= expectedCount, "one or more queue rows have no primary run receipt");
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-adobe-animate-authoring-audit-result-index",
    lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
    scope: "Hash-validated work-only Adobe Animate authoring-audit run results for the 29 FLA-backed G4 L3 items",
    authorityBoundary: {
      sourcePairsReverified: true,
      adobeAnimateAuthoringStructureForPassingItems: true,
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
      operatorQueue: queue.binding,
      assistRoot: portable(root, assistRoot),
      repairEvidenceIds,
      generator: generator.binding,
      relocationReceipt: relocation ? relocation.jsonBinding : null,
    },
    summary: {
      queueItems: items.length,
      sourcePairsReverified: items.length,
      primaryRowsTouched: items.filter((item) => item.attempts.some(({role}) => role === "primary")).length,
      totalAttemptReceipts: attempts.length,
      primaryAttemptReceipts: primaryAttempts.length,
      repairAttemptReceipts: repairAttempts.length,
      passedAttemptReceipts: attempts.filter(({status}) => status === "passed").length,
      failedAttemptReceipts: failedAttempts.length,
      verifiedWorkOnlyAuthoringAudits: passedItems.length,
      pendingAuthoringAudits: pendingItems.length,
      authoringCoverageComplete: pendingItems.length === 0,
      originalRuntimeBaselinesEstablished: 0,
      humanVisualReviewsEstablished: 0,
      ownerAcceptancesEstablished: 0,
      strictAcceptancesEstablished: 0,
      strictAcceptanceEffect: false,
    },
    pendingAnimationIds: pendingItems.map(({animationId}) => animationId),
    items,
    limitations: [
      "These audits inspect FLA authoring structure after Animate 2021's in-memory legacy conversion; the original shipped SWF remains authoritative for runtime bytecode and behavior.",
      "A failed receipt proves only that the bounded run failed closed with no accepted artifacts. It does not machine-prove the content of a GUI dialog observed during that run.",
      "The paired SWFs are hash-bound but not executed by these authoring audits, so FLA/SWF equivalence is not established.",
      "Authoring PNGs and inventories do not establish branch, interaction, localization, scoring, navigation, Replay, audio, RMSE, human-review, owner-acceptance, strict-completion, or publication gates.",
    ],
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {file: portable(root, jsonReport), sha256: sha256(jsonBytes), bytes: jsonBytes.length};
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonIdentity));
  await writeOrCheck(root, jsonReport, jsonBytes, {check, label: "G4 L3 Animate result-index JSON"});
  await writeOrCheck(root, markdownReport, markdownBytes, {check, label: "G4 L3 Animate result-index Markdown"});
  return {report, jsonIdentity, jsonReport, markdownReport};
}

export function renderMarkdown(report, jsonIdentity) {
  const rows = report.items.map((item) => {
    const attempts = item.attempts.map(({role, evidenceId, runId, status}) =>
      `${role}:${evidenceId}/${runId}=${status}`).join("<br>");
    const native = item.selectedPassingAudit?.nativeMovie;
    const movie = native ? `${native.stage.width}x${native.stage.height} @ ${native.fps} fps, root ${native.frameCount}f` : "PENDING";
    return `| ${item.queueOrdinal} | \`${item.animationId}\` | \`${item.status}\` | ${attempts} | ${movie} |`;
  });
  return [
    "# G4 L3 Adobe Animate authoring-audit result index",
    "",
    "This index validates work-only authoring evidence. It does not establish original-runtime behavior, JavaScript fidelity, audio, RMSE, human review, owner acceptance, strict completion, or publication.",
    "",
    "## Summary",
    "",
    `- JSON: \`${jsonIdentity.file}\``,
    `- JSON SHA-256: \`${jsonIdentity.sha256}\``,
    `- Queue rows touched: ${report.summary.primaryRowsTouched}/${report.summary.queueItems}`,
    `- Verified work-only authoring audits: ${report.summary.verifiedWorkOnlyAuthoringAudits}/${report.summary.queueItems}`,
    `- Pending authoring audits: ${report.summary.pendingAuthoringAudits}`,
    `- Attempt receipts: ${report.summary.totalAttemptReceipts} (${report.summary.failedAttemptReceipts} failed, ${report.summary.repairAttemptReceipts} repair)`,
    `- Strict acceptance effect: ${report.summary.strictAcceptanceEffect}`,
    "",
    "## Pending items",
    "",
    report.pendingAnimationIds.length
      ? report.pendingAnimationIds.map((id) => `- \`${id}\``).join("\n")
      : "None.",
    "",
    "## Evidence matrix",
    "",
    "| Order | Animation | Work-only status | Validated attempts | Native authoring metadata |",
    "|---:|---|---|---|---|",
    ...rows,
    "",
    "Failed attempts remain fail-closed and contribute no authoring audit. GUI-observed failure causes are not promoted to machine evidence by this index.",
    "",
  ].join("\n");
}

async function writeOrCheck(root, file, bytes, {check, label}) {
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

export function parseArguments(argv) {
  const options = {
    check: false,
    queueFile: DEFAULT_QUEUE,
    assistRoot: DEFAULT_ASSIST_ROOT,
    jsonReport: DEFAULT_JSON,
    markdownReport: DEFAULT_MARKDOWN,
    relocationReceipt: DEFAULT_RELOCATION_RECEIPT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--queue") options.queueFile = path.resolve(argv[++index] || invariant(false, "--queue requires a path"));
    else if (value === "--assist-root") options.assistRoot = path.resolve(argv[++index] || invariant(false, "--assist-root requires a path"));
    else if (value === "--json-report") options.jsonReport = path.resolve(argv[++index] || invariant(false, "--json-report requires a path"));
    else if (value === "--markdown-report") options.markdownReport = path.resolve(argv[++index] || invariant(false, "--markdown-report requires a path"));
    else if (value === "--relocation-receipt") options.relocationReceipt = path.resolve(argv[++index] || invariant(false, "--relocation-receipt requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-g4-l3-animate-authoring-audit-index.mjs [options]",
    "",
    "Hash-validates actual G4 L3 Adobe Animate work-only authoring-audit run",
    "receipts and their source, script, process, report, PNG, and evidence bindings.",
    "This command never launches or interacts with Adobe Animate.",
    "",
    "Options:",
    "  --check                    Recompute and compare both reports without writing",
    "  --queue <file>             Operator-queue JSON under reports/",
    "  --assist-root <dir>        Paired-source evidence root under work/animate/",
    "  --json-report <file>       Output JSON under reports/",
    "  --markdown-report <file>   Output Markdown under reports/",
    "  --relocation-receipt <file>  Verified old-root to WestWorld path receipt",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildG4L3AnimateAuthoringAuditIndex(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "built",
    ...result.report.summary,
    pendingAnimationIds: result.report.pendingAnimationIds,
    report: result.jsonIdentity,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
