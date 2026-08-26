#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_RELATIVE = "scripts/build-lesson-animate-authoring-audit-index.mjs";
const DEFAULT_ASSIST_ROOT_RELATIVE = "work/animate/dependency-authoring-audits";
const STAGING_ROOT_RELATIVE = "work/animate/release-read-only-fla-copies";
const SESSION_AUTH_ROOT_RELATIVE = "work/animate/session-authorizations";
const CANONICAL_RELEASE_INPUT_PATHS = Object.freeze({
  lessonReleases: "catalog/lesson-releases.json",
  animations: "catalog/animations.json",
  sourceFreezeManifest: "catalog/source-manifest.sha256",
});
const PASSING_RECEIPT_ADMISSION_ENABLED = false;
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/u;
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
  invariant(file === path.resolve(inside) || isInside(inside, file), `${label} escapes its allowed root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await fileIdentity(file, label, {mode, readOnly});
  invariant(identity.binding.sha256 === reference.sha256, `${label} SHA-256 is stale`);
  if (reference.bytes != null) invariant(identity.binding.bytes === reference.bytes, `${label} byte length is stale`);
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

function sameRelease(actual, expected) {
  const keys = ["releaseId", "grade", "lesson", "titleDisplay", "publicationMode", "shardId",
    "selectedMemberCount", "fullReleaseMemberCount"];
  return keys.every((key) => actual?.[key] === expected?.[key]);
}

function validateDialogOperator(value, label) {
  const name = typeof value === "string" ? value.trim() : "";
  invariant(name.length >= 2 && name.length <= 128 && /\p{L}/u.test(name)
    && !/[\u0000-\u001f\u007f]/u.test(name), `${label} must name the human dialog operator`);
  invariant(!/(?:^|[^\p{L}\p{N}])(?:codex|automation|automated|bot|agent|unknown|none|n\/?a)(?:$|[^\p{L}\p{N}])/iu.test(name),
    `${label} must be a named human, not Codex or automation`);
  return name;
}

function pngDimensions(bytes, label) {
  try {
    invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
      `${label} has no PNG signature/IHDR prefix`);
    const declaredWidth = bytes.readUInt32BE(16);
    const declaredHeight = bytes.readUInt32BE(20);
    invariant(declaredWidth > 0 && declaredHeight > 0
      && declaredWidth <= 32768 && declaredHeight <= 32768
      && declaredWidth * declaredHeight <= 100_000_000,
    `${label} declares unsafe dimensions`);
    const decoded = PNG.sync.read(bytes, {checkCRC: true});
    invariant(Number.isInteger(decoded.width) && decoded.width > 0
      && Number.isInteger(decoded.height) && decoded.height > 0, `${label} has invalid dimensions`);
    return {width: decoded.width, height: decoded.height};
  } catch (error) {
    throw new Error(`${label} is not a fully decodable CRC-valid PNG: ${error.message}`);
  }
}

function validateTimelineCardinality(timeline, label) {
  invariant(Number.isInteger(timeline?.frameCount) && timeline.frameCount >= 1,
    `${label} frameCount is invalid`);
  invariant(Number.isInteger(timeline?.layerCount) && Array.isArray(timeline.layers)
    && timeline.layerCount === timeline.layers.length,
  `${label} layerCount differs from its materialized layers`);
  for (const [layerIndex, layer] of timeline.layers.entries()) {
    invariant(layer?.index === layerIndex, `${label} layer indices are not exact and contiguous`);
    invariant(Number.isInteger(layer.frameCount) && layer.frameCount === timeline.frameCount,
      `${label} layer ${layerIndex} frameCount differs from its timeline`);
    invariant(Array.isArray(layer.keyframes), `${label} layer ${layerIndex} has no keyframe array`);
    let previousStart = -1;
    for (const keyframe of layer.keyframes) {
      invariant(Number.isInteger(keyframe?.index) && keyframe.index > previousStart
        && keyframe.startFrame === keyframe.index && keyframe.flashFrame === keyframe.index + 1,
      `${label} layer ${layerIndex} keyframe indices are invalid`);
      invariant(Number.isInteger(keyframe.duration) && keyframe.duration >= 1
        && keyframe.index + keyframe.duration <= layer.frameCount,
      `${label} layer ${layerIndex} keyframe duration escapes the layer`);
      invariant(Number.isInteger(keyframe.elementCount) && Array.isArray(keyframe.elements)
        && keyframe.elementCount === keyframe.elements.length,
      `${label} layer ${layerIndex} keyframe elementCount differs from its elements`);
      for (const [elementIndex, element] of keyframe.elements.entries()) {
        invariant(element?.index === elementIndex,
          `${label} layer ${layerIndex} keyframe element indices are not exact and contiguous`);
      }
      previousStart = keyframe.index;
    }
  }
}

function validateRawReportCardinality(report, label) {
  invariant(Number.isInteger(report.document?.libraryItemCount) && Array.isArray(report.library)
    && report.document.libraryItemCount === report.library.length,
  `${label} libraryItemCount differs from its materialized library`);
  validateTimelineCardinality(report.timeline, `${label} root timeline`);
  const names = new Set();
  for (const [index, item] of report.library.entries()) {
    invariant(item?.index === index, `${label} library indices are not exact and contiguous`);
    invariant(typeof item.name === "string" && item.name.length > 0 && !names.has(item.name),
      `${label} library names are missing or duplicated`);
    names.add(item.name);
    if (item.timeline != null) validateTimelineCardinality(item.timeline, `${label} library item ${item.name}`);
  }
}

function decodeFileUri(uri, label) {
  invariant(typeof uri === "string" && uri.startsWith("file:"), `${label} has an invalid file URI`);
  try {
    return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/u, "");
  } catch (error) {
    throw new Error(`${label} has an invalid encoded file URI: ${error.message}`);
  }
}

function verifyDocumentPath({root, uri, workingCopy, label}) {
  const decoded = path.resolve(decodeFileUri(uri, label));
  const current = path.resolve(root, workingCopy.file);
  invariant(decoded === current, `${label} opened an unexpected FLA; no relocation receipt is permitted by this index`);
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
          const attachedLength = typeof element.attachedActionScript === "string" ? element.attachedActionScript.length : 0;
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
  operator,
  sourceFla,
  sourceSwf,
  sourceBinding,
  workingCopy,
  stagedSwf,
  artifacts,
  scripts,
  sessionAuthorization,
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
  invariant(value.humanDialogBoundary?.required === true
    && value.humanDialogBoundary?.designatedOperator === operator
    && value.humanDialogBoundary?.operatorNameIsNotReviewOrApproval === true
    && value.humanDialogBoundary?.automatedDialogInteractionUsed === false,
  `${label} dialog-operator authority boundary differs`);
  invariant(sameIdentity(value.sessionAuthorizationReceipt, sessionAuthorization),
    `${label} one-row session authorization binding differs`);
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

async function verifyAttempt({
  root,
  assistRoot,
  runDir,
  queueEntry,
  expectedOperator,
  rowSessionAuthorizations,
  absoluteIdentityCache,
}) {
  const evidenceId = queueEntry.animationId;
  const label = `${queueEntry.animationId}/${path.basename(runDir)}`;
  const evidenceRoot = path.join(assistRoot, evidenceId);
  invariant(isInside(assistRoot, evidenceRoot), `${label} evidence root escapes the assist root`);
  invariant(isInside(path.join(evidenceRoot, "runs"), runDir), `${label} run directory escapes its evidence root`);
  const receiptFile = path.join(runDir, "assisted-run-result.json");
  const receiptDocument = await fileIdentity(receiptFile, `${label} receipt`);
  const receiptBinding = {file: portable(root, receiptFile), ...receiptDocument.binding};
  const receipt = parseJson(receiptDocument.bytes, `${label} receipt`);
  invariant(receipt.schemaVersion === 1
    && receipt.evidenceKind === "human-assisted-adobe-animate-dependency-authoring-audit-run",
  `${label} receipt schema changed`);
  invariant(receipt.evidenceId === evidenceId && receipt.sourceKind === "paired-fla-swf", `${label} receipt identity changed`);
  invariant(receipt.status === "passed" || receipt.status === "failed", `${label} has an unsupported status`);
  invariant(receipt.acceptanceEffect === "none; work-only dependency/paired-source authoring audit",
    `${label} receipt claims acceptance authority`);
  const operator = validateDialogOperator(receipt.humanActionBoundary?.designatedOperator, `${label} dialog operator`);
  invariant(receipt.humanActionBoundary?.required === true
    && receipt.humanActionBoundary?.automatedDialogInteractionUsed === false
    && receipt.humanActionBoundary?.reviewOrOwnerDecisionRecorded === false,
  `${label} human-action authority boundary differs`);
  if (expectedOperator) invariant(operator === expectedOperator, `${label} dialog operator differs from the bound assignment`);
  const authorizationKey = `${evidenceId}/${path.basename(runDir)}`;
  const sessionAuthorization = rowSessionAuthorizations.get(authorizationKey) || null;
  if (receipt.status === "passed") {
    invariant(expectedOperator, `${label} passing receipt requires a bound named operator assignment`);
    invariant(sessionAuthorization, `${label} passing receipt requires an immutable exact one-row session authorization`);
    invariant(sameIdentity(receipt.sessionAuthorizationReceipt, sessionAuthorization.binding),
      `${label} passing receipt session authorization binding differs`);
  }
  invariant(receipt.migrationOrApprovalWrites === false, `${label} records migration or approval writes`);

  const sourceFla = queueEntry.sourcePair.fla;
  const sourceSwf = queueEntry.sourcePair.swf;
  invariant(sameIdentity(receipt.source, sourceFla), `${label} FLA source differs from the queue`);
  invariant(sameIdentity(receipt.shippedSwf?.source, sourceSwf), `${label} SWF source differs from the queue`);
  const workingCopy = await verifyBoundCopy(root, receipt.workingCopy, sourceFla, evidenceRoot,
    "working-copy", `${label} FLA copy`);
  const stagedSwf = await verifyBoundCopy(root, receipt.shippedSwf.workingCopy, sourceSwf, evidenceRoot,
    "runtime-source", `${label} SWF copy`);

  const sourceBindingDocument = await projectReference(root, receipt.sourceBinding, `${label} source binding`, {
    inside: evidenceRoot,
    mode: 0o444,
  });
  const sourceBinding = parseJson(sourceBindingDocument.bytes, `${label} source binding`);
  validateSourceBinding(sourceBinding, {evidenceId, sourceFla, sourceSwf}, `${label} source binding`);
  invariant(sourceBinding.workingCopy?.file === workingCopy.file && sourceBinding.workingCopy?.sha256 === workingCopy.sha256
    && sourceBinding.workingCopy?.bytes === workingCopy.bytes, `${label} source-binding FLA copy differs`);
  invariant(sourceBinding.shippedSwf?.workingCopy?.file === stagedSwf.file
    && sourceBinding.shippedSwf?.workingCopy?.sha256 === stagedSwf.sha256
    && sourceBinding.shippedSwf?.workingCopy?.bytes === stagedSwf.bytes,
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
    await rejectSymlinkComponents(path.parse(receipt.command.executable).root, receipt.command.executable,
      `${label} Animate executable`);
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
    role: "primary",
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
    declaredDialogOperator: operator,
    sessionAuthorizationReceipt: sessionAuthorization?.binding || null,
    operatorIdentityCryptographicallyVerified: false,
    operatorNameIsNotReviewOrApproval: true,
    automatedDialogInteractionUsed: false,
    reviewOrOwnerDecisionRecorded: false,
    migrationOrApprovalWrites: false,
    acceptanceEffect: false,
  };

  if (receipt.status === "failed") {
    invariant(receipt.artifacts == null && receipt.workEvidence == null,
      `${label} failed receipt unexpectedly claims artifacts`);
    invariant(typeof receipt.failure === "string" && receipt.failure.length > 0,
      `${label} failed receipt has no failure`);
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
      verifyDocumentPath({root, uri: marker.documentPathURI, workingCopy,
        label: `${label} failed controller diagnostic`});
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
      failureDisposition: processFailed
        ? "animate-process-failed-or-terminated"
        : "post-process-artifact-validation-failed",
      failureDiagnostic,
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
  verifyDocumentPath({root, uri: marker.documentPathURI, workingCopy, label: `${label} controller marker`});
  invariant(report.schemaVersion === 1 && report.evidenceKind === "adobe-animate-authoring-audit",
    `${label} raw authoring report schema changed`);
  invariant(report.animateVersion === marker.animateVersion && report.document?.name === path.basename(workingCopy.file),
    `${label} raw authoring report identity differs`);
  verifyDocumentPath({root, uri: report.document?.pathURI, workingCopy, label: `${label} raw authoring report`});
  invariant(report.timeline?.currentFlashFrame === 1 && Number.isInteger(report.timeline?.frameCount)
    && report.timeline.frameCount >= 1, `${label} raw authoring timeline is invalid`);
  invariant(Number.isInteger(report.document?.width) && report.document.width > 0
    && Number.isInteger(report.document?.height) && report.document.height > 0
    && typeof report.document?.frameRate === "number" && report.document.frameRate > 0,
  `${label} raw authoring native metadata is invalid`);
  invariant(Number.isFinite(Date.parse(report.capturedAt || "")), `${label} raw authoring capturedAt is invalid`);
  const capturedAt = Date.parse(report.capturedAt);
  invariant(capturedAt >= sessionAuthorization.authorizedAt && capturedAt <= sessionAuthorization.notAfter,
    `${label} passing receipt falls outside its one-row authorization window`);
  validateRawReportCardinality(report, `${label} raw authoring report`);
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
    operator,
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
    sessionAuthorization: sessionAuthorization.binding,
    evidenceRoot,
    root,
  }, `${label} work evidence`);
  invariant(JSON.stringify(workEvidence.nativeMovie) === JSON.stringify(expectedSummary),
    `${label} work-evidence movie summary differs`);
  invariant(workEvidence.capturedAuthoringFrame?.width === dimensions.width
    && workEvidence.capturedAuthoringFrame?.height === dimensions.height,
  `${label} work-evidence PNG dimensions differ`);
  invariant(PASSING_RECEIPT_ADMISSION_ENABLED,
    `${label} passing receipt admission remains closed until a reviewed L10 runner/authorization/one-time-consumption successor is implemented`);

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
  };
}

async function listRunDirectories(root, assistRoot, animationId) {
  const evidenceRoot = path.join(assistRoot, animationId);
  invariant(isInside(assistRoot, evidenceRoot), `${animationId}: evidence root escapes the assist root`);
  const runsRoot = path.join(evidenceRoot, "runs");
  if (!(await exists(runsRoot))) return {runDirectories: [], incompleteRunDirectories: []};
  await rejectSymlinkComponents(root, runsRoot, `${animationId}: runs root`);
  const information = await lstat(runsRoot);
  invariant(information.isDirectory() && !information.isSymbolicLink(), `${animationId}: runs root must be a directory`);
  const entries = await readdir(runsRoot, {withFileTypes: true});
  const runDirectories = [];
  const incompleteRunDirectories = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    invariant(!entry.isSymbolicLink(), `${animationId}: run entry is a symbolic link: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    invariant(/^run-[A-Za-z0-9_-]+$/u.test(entry.name), `${animationId}: malformed run directory: ${entry.name}`);
    const runDir = path.join(runsRoot, entry.name);
    if (await exists(path.join(runDir, "assisted-run-result.json"))) runDirectories.push(runDir);
    else incompleteRunDirectories.push(portable(root, runDir));
  }
  return {runDirectories, incompleteRunDirectories};
}

function selectPassingAttempt(attempts) {
  const passing = attempts.filter(({status}) => status === "passed");
  passing.sort((left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt)
    || left.receipt.file.localeCompare(right.receipt.file));
  return passing[0] || null;
}

function validateContentAddress(binding, file, label) {
  invariant(path.basename(file) === `${binding.sha256}.json`, `${label} filename is not its SHA-256 content address`);
}

async function loadNamedAssignment(root, readiness, releaseId) {
  const reference = readiness.inputs?.namedOperatorAssignmentReceipt;
  if (reference == null) {
    invariant(readiness.operatorAssignment?.assigneeFullName == null, "readiness has an unbound named operator");
    return null;
  }
  const document = await projectReference(root, reference, "named operator assignment receipt");
  const value = parseJson(document.bytes, "named operator assignment receipt");
  const operator = validateDialogOperator(value.assignment?.assigneeFullName, "named operator assignment");
  invariant(value.schemaVersion === 1 && value.releaseId === releaseId
    && value.assignment?.roleId === "authorized-original-runtime-operator"
    && value.assignment?.explicit === true, "named operator assignment receipt schema changed");
  invariant(readiness.operatorAssignment?.assigneeFullName === operator
    && sameIdentity(readiness.operatorAssignment?.receipt, document.binding),
  "readiness named operator assignment binding differs");
  invariant(value.authorityBoundary?.animateGuiExecutionAuthorizedByThisReceiptAlone === false
    && value.authorityBoundary?.originalRuntimeExecutionAuthorizedByThisReceiptAlone === false
    && value.authorityBoundary?.humanReviewAccepted === false
    && value.authorityBoundary?.ownerFidelityAcceptanceEstablished === false
    && value.authorityBoundary?.publicationAuthorized === false,
  "named operator assignment exceeds role-only authority");
  return {operator, binding: document.binding};
}

async function loadRowSessionAuthorizations({root, readiness, releaseId, assignment, queueBinding, stagingBinding, items}) {
  const references = readiness.inputs?.perRowSessionAuthorizationReceipts ?? [];
  invariant(Array.isArray(references), "per-row session authorization references must be an array");
  if (!references.length) return new Map();
  invariant(assignment, "per-row session authorizations require a bound named operator assignment");
  invariant(readiness.operatorProtocol?.immutablePerRowSessionAuthorizationPresent === true
    && readiness.operatorProtocol?.assignedOperatorBindingEnforcedByRunner === true,
  "readiness does not declare runner-enforced immutable per-row session authorization");
  const itemsById = new Map(items.map((item) => [item.animationId, item]));
  const authorizations = new Map();
  const authorizationRoot = path.join(root, SESSION_AUTH_ROOT_RELATIVE);
  for (const [index, reference] of references.entries()) {
    const document = await projectReference(root, reference, `per-row session authorization ${index + 1}`, {
      inside: authorizationRoot,
      mode: 0o444,
    });
    validateContentAddress(document.binding, document.file, `per-row session authorization ${index + 1}`);
    const value = parseJson(document.bytes, `per-row session authorization ${index + 1}`);
    invariant(value.schemaVersion === 1
      && value.evidenceKind === "lesson-release-adobe-animate-one-row-session-authorization",
    `per-row session authorization ${index + 1} schema changed`);
    const identity = value.identity;
    const item = itemsById.get(identity?.animationId);
    invariant(item && identity.releaseId === releaseId
      && identity.releaseOrdinal === item.releaseOrdinal
      && identity.queueOrdinal === item.queueOrdinal
      && typeof identity.runId === "string" && /^run-[A-Za-z0-9_-]+$/u.test(identity.runId),
    `per-row session authorization ${index + 1} identity differs from the exact queue row`);
    invariant(sameIdentity(value.bindings?.releasePrepareOnlyQueue, queueBinding)
      && sameIdentity(value.bindings?.releaseStagingManifest, stagingBinding)
      && sameIdentity(value.bindings?.namedOperatorAssignmentReceipt, assignment.binding),
    `per-row session authorization ${index + 1} input binding differs`);
    invariant(validateDialogOperator(value.operator?.assigneeFullName,
      `per-row session authorization ${index + 1} operator`) === assignment.operator
      && value.operator?.consentToConfirmLegacyActionScriptConversionDialog === true
      && value.operator?.consentToCloseWithoutSaving === true,
    `per-row session authorization ${index + 1} operator consent differs`);
    const authorizedAt = Date.parse(value.authorization?.authorizedAt || "");
    const notAfter = Date.parse(value.authorization?.notAfter || "");
    invariant(value.authorization?.state === "authorized-one-row-one-run"
      && value.authorization?.oneTimeUseRequired === true
      && value.authorization?.animateGuiExecutionAuthorized === true
      && value.authorization?.saveAllowed === false
      && value.authorization?.publishAllowed === false
      && Number.isFinite(authorizedAt) && Number.isFinite(notAfter) && authorizedAt < notAfter,
    `per-row session authorization ${index + 1} execution boundary differs`);
    invariant(value.authorityBoundary?.originalRuntimeBehavior === false
      && value.authorityBoundary?.humanVisualReview === false
      && value.authorityBoundary?.ownerAcceptance === false
      && value.authorityBoundary?.strictAcceptance === false
      && value.authorityBoundary?.publication === false,
    `per-row session authorization ${index + 1} exceeds work-only authority`);
    const key = `${identity.animationId}/${identity.runId}`;
    invariant(!authorizations.has(key), `duplicate per-row session authorization: ${key}`);
    authorizations.set(key, {
      binding: document.binding,
      identity,
      authorizedAt,
      notAfter,
      operator: assignment.operator,
    });
  }
  return authorizations;
}

function parseSourceFreezeManifest(bytes, label) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line) continue;
    const match = /^([0-9a-f]{64})  (.+)$/u.exec(line);
    invariant(match, `${label} line ${index + 1} is malformed`);
    invariant(!entries.has(match[2]), `${label} contains a duplicate path: ${match[2]}`);
    entries.set(match[2], match[1]);
  }
  invariant(entries.size > 0, `${label} is empty`);
  return entries;
}

async function pinnedProjectReference(root, reference, label) {
  const result = await projectReference(root, reference, label);
  if (reference?.mode != null) {
    invariant(result.binding.mode === reference.mode, `${label} mode is stale`);
  }
  return result;
}

function validateCanonicalRelease(document, releaseId) {
  invariant(document?.schemaVersion === 1 && Array.isArray(document.releases),
    "canonical lesson-release catalog is malformed");
  const matches = document.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1,
    matches.length ? `canonical lesson release is duplicated: ${releaseId}` : `canonical lesson release is missing: ${releaseId}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: canonical publicationMode must remain atomic`);
  invariant(Number.isSafeInteger(release.expectedCounts?.members) && release.expectedCounts.members > 0
    && Array.isArray(release.members) && release.members.length === release.expectedCounts.members,
  `${releaseId}: canonical release membership is incomplete`);
  invariant(Array.isArray(release.shards) && release.shards.length === release.expectedCounts?.shards,
    `${releaseId}: canonical release shards are incomplete`);
  const shardIds = new Set();
  for (const [index, shard] of release.shards.entries()) {
    invariant(ID_PATTERN.test(shard?.shardId || "") && !shardIds.has(shard.shardId)
      && shard.ordinal === index + 1 && Number.isSafeInteger(shard.memberCount) && shard.memberCount > 0,
    `${releaseId}: canonical shard declaration is invalid`);
    shardIds.add(shard.shardId);
  }
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member?.ordinal === index + 1, `${releaseId}: canonical member ordinals are not contiguous`);
    invariant(ID_PATTERN.test(member.animationId || "") && !animationIds.has(member.animationId),
      `${releaseId}: canonical animation ID is invalid or duplicated`);
    invariant(SHA256_PATTERN.test(member.source?.sha256 || "")
      && typeof member.source?.path === "string" && member.source.path.length > 0
      && !path.isAbsolute(member.source.path) && !member.source.path.split(/[\\/]/u).includes(".."),
    `${member.animationId}: canonical SWF source binding is invalid`);
    invariant(member.assetId === `swf-${member.source.sha256}` && !assetIds.has(member.assetId),
      `${member.animationId}: canonical asset ID is invalid or duplicated`);
    invariant(typeof member.releaseRole === "string" && member.releaseRole.length > 0
      && shardIds.has(member.shardId), `${member.animationId}: canonical release placement is invalid`);
    animationIds.add(member.animationId);
    assetIds.add(member.assetId);
  }
  for (const shard of release.shards) {
    invariant(release.members.filter((member) => member.shardId === shard.shardId).length === shard.memberCount,
      `${releaseId}/${shard.shardId}: canonical member count is stale`);
  }
  return release;
}

async function loadCanonicalReleaseAnchors(root, staging, releaseId) {
  for (const [key, expectedFile] of Object.entries(CANONICAL_RELEASE_INPUT_PATHS)) {
    invariant(staging.inputs?.[key]?.file === expectedFile,
      `${key} must bind the exact current canonical path ${expectedFile}`);
  }
  const lessonReleasesDocument = await pinnedProjectReference(root, staging.inputs?.lessonReleases,
    "canonical lesson-release catalog");
  const animationsDocument = await pinnedProjectReference(root, staging.inputs?.animations,
    "canonical animation catalog");
  const sourceFreezeDocument = await pinnedProjectReference(root, staging.inputs?.sourceFreezeManifest,
    "canonical source-freeze manifest");
  const lessonReleases = parseJson(lessonReleasesDocument.bytes, "canonical lesson-release catalog");
  const animations = parseJson(animationsDocument.bytes, "canonical animation catalog");
  const release = validateCanonicalRelease(lessonReleases, releaseId);
  invariant(animations?.schemaVersion === 1 && Array.isArray(animations.animations),
    "canonical animation catalog is malformed");
  const animationById = new Map();
  for (const animation of animations.animations) {
    invariant(ID_PATTERN.test(animation?.animationId || "") && !animationById.has(animation.animationId),
      `canonical animation catalog contains a duplicate or invalid ID: ${animation?.animationId}`);
    animationById.set(animation.animationId, animation);
  }
  const sourceFreezeEntries = parseSourceFreezeManifest(sourceFreezeDocument.bytes, "canonical source-freeze manifest");
  return {
    release,
    animationById,
    sourceFreezeEntries,
    bindings: {
      lessonReleases: lessonReleasesDocument.binding,
      animations: animationsDocument.binding,
      sourceFreezeManifest: sourceFreezeDocument.binding,
    },
  };
}

function sameMemberPlacement(canonical, staged) {
  return staged?.releaseOrdinal === canonical.ordinal
    && staged.animationId === canonical.animationId
    && staged.assetId === canonical.assetId
    && staged.releaseRole === canonical.releaseRole
    && staged.shardId === canonical.shardId;
}

function validateCanonicalMemberBinding({canonical, staged, animation, sourceFreezeEntries, flaApplicable}) {
  invariant(animation && animation.assetId === canonical.assetId
    && animation.source?.path === canonical.source.path
    && animation.source?.sha256 === canonical.source.sha256,
  `${canonical.animationId}: canonical release/animation SWF binding differs`);
  invariant(sameMemberPlacement(canonical, staged),
    `${canonical.animationId}: staging placement differs from the canonical release`);
  invariant(staged.sourceSwf?.sourceFreezeManifestPath === canonical.source.path
    && staged.sourceSwf?.sha256 === canonical.source.sha256
    && sourceFreezeEntries.get(canonical.source.path) === canonical.source.sha256,
  `${canonical.animationId}: staged SWF is not exact-current source-freeze-bound`);
  if (flaApplicable) {
    invariant(animation.pairedFla?.path && SHA256_PATTERN.test(animation.pairedFla.sha256 || "")
      && staged.sourceFla?.sourceFreezeManifestPath === animation.pairedFla.path
      && staged.sourceFla?.sha256 === animation.pairedFla.sha256
      && staged.sourceFla?.bytes === animation.pairedFla.bytes
      && sourceFreezeEntries.get(animation.pairedFla.path) === animation.pairedFla.sha256,
    `${canonical.animationId}: staged FLA is not the exact canonical paired/source-freeze-bound FLA`);
  } else {
    invariant(!animation.pairedFla?.path, `${canonical.animationId}: SWF-only disposition conflicts with canonical paired FLA`);
  }
}

async function verifySource(root, declared, label, {sourceFreezeEntries, expectedPath}) {
  invariant(declared?.sourceFreezeBound === true && typeof declared.sourceFreezeManifestPath === "string",
    `${label} is not source-freeze-bound`);
  invariant(declared.sourceFreezeManifestPath === expectedPath
    && sourceFreezeEntries.get(expectedPath) === declared.sha256,
  `${label} source-freeze path or SHA-256 is stale`);
  const result = await projectReference(root, declared, label, {inside: path.join(root, "source-assets")});
  return {file: result.binding.file, sha256: result.binding.sha256, bytes: result.binding.bytes};
}

async function verifyReleaseWorkingCopy(root, declared, expectedSource, releaseRoot, label) {
  invariant(declared?.mode === "0444" && declared.readOnly === true
    && declared.byteIdenticalToSource === true && declared.separateRegularFile === true,
  `${label} declared copy contract changed`);
  const result = await projectReference(root, declared, label, {inside: releaseRoot, mode: 0o444});
  invariant(result.binding.sha256 === expectedSource.sha256 && result.binding.bytes === expectedSource.bytes,
    `${label} differs from its source`);
  return result.binding;
}

async function loadStableReleaseInputs({root, releaseId, readinessFile}) {
  invariant(isInside(path.join(root, "reports"), readinessFile), "operator readiness locator must be under reports/");
  await rejectSymlinkComponents(root, readinessFile, "operator readiness locator");
  const readinessDocument = await fileIdentity(readinessFile, "operator readiness locator");
  const readiness = parseJson(readinessDocument.bytes, "operator readiness locator");
  invariant(readiness.schemaVersion === 2
    && readiness.reportType === "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness",
  "unexpected lesson Animate operator-readiness schema");
  invariant(readiness.release?.releaseId === releaseId && readiness.release?.shardId == null,
    "operator readiness does not select the exact full release");
  invariant(readiness.authorityBoundary?.sourceAndReadOnlyPreparation === true
    && readiness.authorityBoundary?.adobeAnimateAuthoringAudit === false
    && readiness.authorityBoundary?.originalRuntimeBehavior === false
    && readiness.authorityBoundary?.humanVisualReview === false
    && readiness.authorityBoundary?.ownerAcceptance === false
    && readiness.authorityBoundary?.strictAcceptance === false
    && readiness.authorityBoundary?.publication === false,
  "operator readiness authority boundary changed");

  const stagingRoot = path.join(root, STAGING_ROOT_RELATIVE);
  const queueDocument = await projectReference(root, readiness.inputs?.releasePrepareOnlyQueue,
    "content-addressed release prepare-only queue", {inside: stagingRoot, mode: 0o444});
  validateContentAddress(queueDocument.binding, queueDocument.file, "release prepare-only queue");
  const stagingDocument = await projectReference(root, readiness.inputs?.releaseStagingManifest,
    "content-addressed release staging manifest", {inside: stagingRoot, mode: 0o444});
  validateContentAddress(stagingDocument.binding, stagingDocument.file, "release staging manifest");
  const queue = parseJson(queueDocument.bytes, "release prepare-only queue");
  const staging = parseJson(stagingDocument.bytes, "release staging manifest");
  invariant(queue.schemaVersion === 1
    && queue.evidenceKind === "lesson-release-adobe-animate-prepare-only-operator-queue",
  "unexpected release prepare-only queue schema");
  invariant(staging.schemaVersion === 1
    && staging.evidenceKind === "lesson-release-adobe-animate-prepare-only-fla-staging",
  "unexpected release staging-manifest schema");
  const canonical = await loadCanonicalReleaseAnchors(root, staging, releaseId);
  const canonicalReleaseIdentity = {
    releaseId: canonical.release.releaseId,
    grade: canonical.release.grade,
    lesson: canonical.release.lesson,
    titleDisplay: canonical.release.titleDisplay,
    publicationMode: canonical.release.publicationMode,
    shardId: null,
    selectedMemberCount: canonical.release.members.length,
    fullReleaseMemberCount: canonical.release.members.length,
  };
  invariant(readiness.release?.publicationMode === "atomic" && readiness.release?.shardId == null
    && readiness.release?.selectedMemberCount === readiness.release?.fullReleaseMemberCount
    && readiness.release?.fullReleaseMemberCount === canonical.release.members.length
    && sameRelease(readiness.release, canonicalReleaseIdentity),
  "operator readiness is not bound to the exact canonical full atomic release");
  invariant(sameRelease(queue.release, readiness.release) && sameRelease(staging.release, readiness.release),
    "release identity differs across readiness, queue, and staging manifest");
  invariant(queue.stagingManifest?.file === stagingDocument.binding.file
    && queue.stagingManifest?.sha256 === stagingDocument.binding.sha256
    && queue.stagingManifest?.bytes === stagingDocument.binding.bytes,
  "release queue staging-manifest binding differs");
  invariant(Array.isArray(queue.queue) && Array.isArray(queue.noFlaDispositions)
    && Array.isArray(staging.entries) && Array.isArray(staging.noFlaDispositions),
  "release preparation arrays are missing");
  invariant(queue.summary?.preparedFlaItems === queue.queue.length
    && queue.summary?.noFlaDispositions === queue.noFlaDispositions.length
    && queue.summary?.authoringAuditsCompleted === 0
    && queue.summary?.strictAcceptanceEffect === false,
  "release prepare-only queue summary changed");
  invariant(staging.summary?.selectedMembers === readiness.release.selectedMemberCount
    && staging.summary?.flaBackedItems === staging.entries.length
    && staging.summary?.swfOnlyItems === staging.noFlaDispositions.length
    && staging.summary?.copiesReady === staging.entries.length
    && staging.summary?.allCopiesReadOnly === true
    && staging.summary?.allCopiesByteIdentical === true
    && staging.summary?.animateGuiExecutions === 0
    && staging.summary?.authoringAuditsCompleted === 0
    && staging.summary?.strictAcceptanceEffect === false,
  "release staging summary changed");
  invariant(queue.safety?.executableCommands?.length === 0 && queue.safety?.animateGuiLaunches === 0
    && queue.safety?.dialogInteractions === 0 && queue.safety?.operatorIdentityCollected === false
    && queue.safety?.sourceOrWorkspaceWrites === 0,
  "release prepare-only safety boundary changed");
  invariant(queue.authorityBoundary?.workingCopiesPrepared === true
    && queue.authorityBoundary?.animateAuthoringAudit === false
    && queue.authorityBoundary?.originalRuntimeEvidence === false
    && queue.authorityBoundary?.humanOrOwnerReview === false
    && queue.authorityBoundary?.strictCompletion === false
    && queue.authorityBoundary?.publication === false,
  "release prepare-only authority boundary changed");

  const stageById = new Map(staging.entries.map((entry) => [entry.animationId, entry]));
  invariant(stageById.size === staging.entries.length, "duplicate FLA-backed staging animation ID");
  const releaseRoot = path.join(stagingRoot, releaseId);
  const items = [];
  const ids = new Set();
  let lastFlaOrdinal = 0;
  for (const [index, entry] of queue.queue.entries()) {
    invariant(entry.queueOrdinal === index + 1, `${entry.animationId}: queue ordinal changed`);
    invariant(ID_PATTERN.test(entry.animationId || "") && !ids.has(entry.animationId),
      `duplicate or invalid queue animation ID: ${entry.animationId}`);
    ids.add(entry.animationId);
    invariant(Number.isInteger(entry.releaseOrdinal) && entry.releaseOrdinal > lastFlaOrdinal,
      `${entry.animationId}: FLA queue is not in strict release order`);
    lastFlaOrdinal = entry.releaseOrdinal;
    const staged = stageById.get(entry.animationId);
    invariant(staged && staged.releaseOrdinal === entry.releaseOrdinal && staged.shardId === entry.shardId,
      `${entry.animationId}: queue/staging placement differs`);
    invariant(sameIdentity(entry.sourceFla, staged.sourceFla) && sameIdentity(entry.sourceSwf, staged.sourceSwf)
      && sameIdentity(entry.workingCopy, staged.workingCopy), `${entry.animationId}: queue/staging source binding differs`);
    const canonicalMember = canonical.release.members[entry.releaseOrdinal - 1];
    const canonicalAnimation = canonical.animationById.get(entry.animationId);
    validateCanonicalMemberBinding({
      canonical: canonicalMember,
      staged,
      animation: canonicalAnimation,
      sourceFreezeEntries: canonical.sourceFreezeEntries,
      flaApplicable: true,
    });
    const sourceFla = await verifySource(root, entry.sourceFla, `${entry.animationId}: source FLA`, {
      sourceFreezeEntries: canonical.sourceFreezeEntries,
      expectedPath: canonicalAnimation.pairedFla.path,
    });
    const sourceSwf = await verifySource(root, entry.sourceSwf, `${entry.animationId}: source SWF`, {
      sourceFreezeEntries: canonical.sourceFreezeEntries,
      expectedPath: canonicalMember.source.path,
    });
    const releaseWorkingCopy = await verifyReleaseWorkingCopy(root, entry.workingCopy, sourceFla,
      releaseRoot, `${entry.animationId}: release FLA copy`);
    items.push({
      queueOrdinal: entry.queueOrdinal,
      releaseOrdinal: entry.releaseOrdinal,
      animationId: entry.animationId,
      assetId: staged.assetId,
      releaseRole: staged.releaseRole,
      shardId: entry.shardId,
      sourcePair: {
        sourceKind: "fla+swf",
        fla: sourceFla,
        swf: sourceSwf,
        bothSourceFilesReverified: true,
        shippedSwfExecutedByTheseAudits: false,
        flaSwfEquivalenceProven: false,
      },
      releaseWorkingCopy,
    });
  }
  invariant(stageById.size === items.length, "release queue does not cover every staged FLA-backed item");

  const stageNoFlaById = new Map(staging.noFlaDispositions.map((entry) => [entry.animationId, entry]));
  invariant(stageNoFlaById.size === staging.noFlaDispositions.length, "duplicate SWF-only staging animation ID");
  const noFlaDispositions = [];
  for (const entry of queue.noFlaDispositions) {
    invariant(ID_PATTERN.test(entry.animationId || "") && !ids.has(entry.animationId),
      `duplicate or invalid SWF-only animation ID: ${entry.animationId}`);
    ids.add(entry.animationId);
    const staged = stageNoFlaById.get(entry.animationId);
    invariant(staged && staged.releaseOrdinal === entry.releaseOrdinal && staged.shardId === entry.shardId
      && sameIdentity(entry.sourceSwf, staged.sourceSwf), `${entry.animationId}: SWF-only queue/staging binding differs`);
    invariant(entry.disposition === "swf-only-no-fla-in-catalog-or-workspace"
      && entry.authoringAuditApplicability === "not-applicable-no-fla-source"
      && entry.inferredAuthoringStructureAllowed === false
      && entry.strictAcceptanceEffect === false, `${entry.animationId}: SWF-only disposition changed`);
    const canonicalMember = canonical.release.members[entry.releaseOrdinal - 1];
    const canonicalAnimation = canonical.animationById.get(entry.animationId);
    validateCanonicalMemberBinding({
      canonical: canonicalMember,
      staged,
      animation: canonicalAnimation,
      sourceFreezeEntries: canonical.sourceFreezeEntries,
      flaApplicable: false,
    });
    const sourceSwf = await verifySource(root, entry.sourceSwf, `${entry.animationId}: SWF-only source`, {
      sourceFreezeEntries: canonical.sourceFreezeEntries,
      expectedPath: canonicalMember.source.path,
    });
    noFlaDispositions.push({...entry, sourceSwf});
  }
  invariant(stageNoFlaById.size === noFlaDispositions.length,
    "release queue does not cover every staged SWF-only disposition");
  const ordinals = [...items, ...noFlaDispositions].map(({releaseOrdinal}) => releaseOrdinal).sort((a, b) => a - b);
  invariant(ordinals.length === readiness.release.selectedMemberCount
    && ordinals.every((ordinal, index) => ordinal === index + 1),
  "combined FLA-backed and SWF-only release ordinals are not exact and contiguous");
  const stagedByOrdinal = [...staging.entries, ...staging.noFlaDispositions]
    .sort((left, right) => left.releaseOrdinal - right.releaseOrdinal);
  invariant(stagedByOrdinal.length === canonical.release.members.length
    && stagedByOrdinal.every((entry, index) => sameMemberPlacement(canonical.release.members[index], entry)),
  "staging membership is not exact-equal to the canonical full release");
  invariant(items.length === readiness.summary?.flaBackedItems
    && noFlaDispositions.length === readiness.summary?.swfOnlyItems,
  "readiness release counts differ from the content-addressed queue");

  const assignment = await loadNamedAssignment(root, readiness, releaseId);
  const rowSessionAuthorizations = await loadRowSessionAuthorizations({
    root,
    readiness,
    releaseId,
    assignment,
    queueBinding: queueDocument.binding,
    stagingBinding: stagingDocument.binding,
    items,
  });
  return {
    release: readiness.release,
    readinessLocator: portable(root, readinessFile),
    queueBinding: queueDocument.binding,
    stagingBinding: stagingDocument.binding,
    canonicalBindings: canonical.bindings,
    items,
    noFlaDispositions,
    expectedOperator: assignment?.operator || null,
    operatorAssignment: assignment?.binding || null,
    rowSessionAuthorizations,
    rowSessionAuthorizationBindings: [...rowSessionAuthorizations.values()]
      .map(({binding}) => binding)
      .sort((left, right) => left.file.localeCompare(right.file, "en")),
    expectedResultIndex: readiness.resultIndexBoundary?.expectedIndependentResultIndex,
  };
}

function defaultReadiness(root, releaseId) {
  const match = /^lesson-g0*([1-9][0-9]*)-l0*([1-9][0-9]*)-/u.exec(releaseId);
  invariant(match, "--release-id must begin with lesson-gNN-lNN-");
  return path.join(root, "reports", `g${Number(match[1])}-l${Number(match[2])}-animate-authoring-operator-readiness.json`);
}

function defaultReports(root, release) {
  const prefix = `g${release.grade}-l${release.lesson}-animate-authoring-audit-index`;
  return {
    jsonReport: path.join(root, "reports", `${prefix}.json`),
    markdownReport: path.join(root, "reports", `${prefix}.md`),
  };
}

export async function buildLessonAnimateAuthoringAuditIndex({
  root = ROOT,
  releaseId,
  readinessFile = null,
  assistRoot = path.join(root, DEFAULT_ASSIST_ROOT_RELATIVE),
  jsonReport = null,
  markdownReport = null,
  check = false,
  persist = true,
} = {}) {
  invariant(ID_PATTERN.test(releaseId || ""), "--release-id must be a safe release ID");
  const effectiveReadiness = readinessFile
    ? (path.isAbsolute(readinessFile) ? path.resolve(readinessFile) : path.resolve(root, readinessFile))
    : defaultReadiness(root, releaseId);
  invariant(isInside(path.join(root, "work", "animate"), assistRoot), "assist root must be under work/animate/");
  await rejectSymlinkComponents(root, assistRoot, "lesson Animate assist root");
  const stable = await loadStableReleaseInputs({root, releaseId, readinessFile: effectiveReadiness});
  const defaults = defaultReports(root, stable.release);
  const effectiveJsonReport = jsonReport ? path.resolve(jsonReport) : defaults.jsonReport;
  const effectiveMarkdownReport = markdownReport ? path.resolve(markdownReport) : defaults.markdownReport;
  invariant(stable.expectedResultIndex === portable(root, effectiveJsonReport),
    "result-index output differs from the readiness-declared independent result path");
  invariant(path.extname(effectiveJsonReport) === ".json", "result-index JSON path must end in .json");
  const requiredMarkdownReport = effectiveJsonReport.slice(0, -".json".length) + ".md";
  invariant(effectiveMarkdownReport === requiredMarkdownReport && effectiveMarkdownReport !== effectiveJsonReport,
    "result-index Markdown path must be the distinct same-stem .md sibling of the readiness-declared JSON path");
  const generatorFile = path.join(root, GENERATOR_RELATIVE);
  const generator = await fileIdentity(generatorFile, "lesson Animate result-index generator");
  const generatorBinding = {file: GENERATOR_RELATIVE, ...generator.binding};
  const absoluteIdentityCache = new Map();
  const items = [];
  for (const entry of stable.items) {
    const runs = await listRunDirectories(root, assistRoot, entry.animationId);
    const attempts = [];
    for (const runDir of runs.runDirectories) {
      attempts.push(await verifyAttempt({
        root,
        assistRoot,
        runDir,
        queueEntry: entry,
        expectedOperator: stable.expectedOperator,
        rowSessionAuthorizations: stable.rowSessionAuthorizations,
        absoluteIdentityCache,
      }));
    }
    const selected = selectPassingAttempt(attempts);
    const status = selected
      ? "verified-work-only-authoring-audit"
      : attempts.length > 0
        ? "pending-after-failed-audit-attempts"
        : "pending-no-run-receipt";
    items.push({
      ...entry,
      evidenceRoutes: [{evidenceId: entry.animationId, role: "primary"}],
      status,
      attempts,
      incompleteRunDirectories: runs.incompleteRunDirectories,
      selectedPassingAudit: selected ? {
        evidenceId: selected.evidenceId,
        runId: selected.runId,
        receipt: selected.receipt,
        workEvidence: selected.workEvidence,
        artifacts: selected.artifacts,
        animateVersion: selected.animateVersion,
        capturedAt: selected.capturedAt,
        nativeMovie: selected.reportSummary,
        declaredDialogOperator: selected.declaredDialogOperator,
        sessionAuthorizationReceipt: selected.sessionAuthorizationReceipt,
        operatorIdentityCryptographicallyVerified: false,
        authority: "work-only Adobe Animate authoring structure",
        acceptanceEffect: false,
      } : null,
      pendingReason: selected
        ? null
        : attempts.length > 0
          ? "No hash-valid passing work-only authoring-audit receipt exists among the preserved failed attempts."
          : "No assisted-run receipt exists for this FLA-applicable release member.",
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
  const rowsTouched = items.filter(({attempts: itemAttempts}) => itemAttempts.length > 0);
  const incompleteRuns = items.flatMap(({incompleteRunDirectories}) => incompleteRunDirectories);
  const report = {
    schemaVersion: 3,
    reportType: "lesson-release-adobe-animate-authoring-audit-result-index",
    release: stable.release,
    scope: `Hash-validated work-only Adobe Animate authoring-audit results for ${items.length} FLA-applicable members; ${stable.noFlaDispositions.length} SWF-only release members are not applicable`,
    authorityBoundary: {
      sourcePairsReverified: true,
      adobeAnimateAuthoringStructureForPassingItems: false,
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
    passingReceiptAdmission: {
      enabled: PASSING_RECEIPT_ADMISSION_ENABLED,
      state: "closed-awaiting-reviewed-runner-authorization-and-one-time-consumption-successor",
      currentPassingReceiptEffect: "fail-closed; no passing receipt can enter authoring coverage",
    },
    inputs: {
      operatorReadinessLocator: {
        file: stable.readinessLocator,
        hashBound: false,
        use: "locator-only for the independently hash-validated content-addressed preparation inputs",
      },
      releasePrepareOnlyQueue: stable.queueBinding,
      releaseStagingManifest: stable.stagingBinding,
      canonicalLessonReleases: stable.canonicalBindings.lessonReleases,
      canonicalAnimations: stable.canonicalBindings.animations,
      canonicalSourceFreezeManifest: stable.canonicalBindings.sourceFreezeManifest,
      assistRoot: portable(root, assistRoot),
      evidenceRoutes: "primary evidenceId equals animationId; unbound repair roots are not scanned",
      namedOperatorAssignmentReceipt: stable.operatorAssignment,
      perRowSessionAuthorizationReceipts: stable.rowSessionAuthorizationBindings,
      generator: generatorBinding,
    },
    summary: {
      selectedReleaseMembers: stable.release.selectedMemberCount,
      flaApplicableItems: items.length,
      swfOnlyNotApplicableItems: stable.noFlaDispositions.length,
      sourcePairsReverified: items.length,
      releaseReadOnlyFlaCopiesReverified: items.length,
      primaryRowsTouched: rowsTouched.length,
      observedIncompleteRunDirectories: incompleteRuns.length,
      totalAttemptReceipts: attempts.length,
      passedAttemptReceipts: attempts.filter(({status}) => status === "passed").length,
      failedAttemptReceipts: failedAttempts.length,
      verifiedWorkOnlyAuthoringAudits: passedItems.length,
      pendingApplicableAuthoringAudits: pendingItems.length,
      flaApplicableAuthoringCoverageComplete: pendingItems.length === 0,
      originalRuntimeBaselinesEstablished: 0,
      humanVisualReviewsEstablished: 0,
      ownerAcceptancesEstablished: 0,
      strictAcceptancesEstablished: 0,
      strictAcceptanceEffect: false,
    },
    pendingAnimationIds: pendingItems.map(({animationId}) => animationId),
    incompleteRunDirectories: incompleteRuns,
    noFlaDispositions: stable.noFlaDispositions,
    items,
    limitations: [
      "The denominator for Animate authoring coverage is the FLA-applicable subset, not every release member; SWF-only members remain separate forensic obligations.",
      "These audits inspect FLA authoring structure after Animate 2021's in-memory legacy conversion; the shipped SWF remains authoritative for runtime bytecode and behavior.",
      "A failed receipt proves only that the bounded run failed closed with no accepted artifacts. It does not machine-prove the content of a GUI dialog.",
      "The paired SWFs are hash-bound but not executed by these authoring audits, so FLA/SWF equivalence is not established.",
      "A bound assignment and immutable one-row authorization permit only the named work-only run; they are not cryptographic identity, human visual review, owner acceptance, or fidelity acceptance.",
      "Passing-receipt admission is intentionally closed until the L10 runner consumes exact signed/one-time authorization and emits an independently immutable run/consumption closure.",
      "Authoring PNGs and inventories do not establish interaction, localization, scoring, navigation, Replay, audio, RMSE, strict completion, or publication.",
    ],
  };
  const jsonTarget = {file: portable(root, effectiveJsonReport)};
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonTarget));
  const markdownIdentity = {
    file: portable(root, effectiveMarkdownReport),
    sha256: sha256(markdownBytes),
    bytes: markdownBytes.length,
  };
  report.outputs = {
    markdown: markdownIdentity,
    pairCommit: {
      protocol: "stage-both-write-markdown-then-authoritative-json-v1",
      authoritativeCommitMarker: jsonTarget.file,
      markdownBoundByAuthoritativeJsonSha256: true,
    },
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {...jsonTarget, sha256: sha256(jsonBytes), bytes: jsonBytes.length};
  if (persist) {
    await writePairOrCheck(root, {
      json: {file: effectiveJsonReport, bytes: jsonBytes, label: "lesson Animate result-index JSON"},
      markdown: {file: effectiveMarkdownReport, bytes: markdownBytes, label: "lesson Animate result-index Markdown"},
    }, {check});
  }
  return {report, jsonIdentity, jsonReport: effectiveJsonReport, markdownReport: effectiveMarkdownReport};
}

export function renderMarkdown(report, jsonTarget) {
  const rows = report.items.map((item) => {
    const attempts = item.attempts.length
      ? item.attempts.map(({evidenceId, runId, status}) => `${evidenceId}/${runId}=${status}`).join("<br>")
      : "none";
    const native = item.selectedPassingAudit?.nativeMovie;
    const movie = native
      ? `${native.stage.width}x${native.stage.height} @ ${native.fps} fps, root ${native.frameCount}f`
      : "PENDING";
    return `| ${item.queueOrdinal} | ${item.releaseOrdinal} | \`${item.animationId}\` | \`${item.status}\` | ${attempts} | ${movie} |`;
  });
  return [
    `# G${report.release.grade} L${report.release.lesson} Adobe Animate authoring-audit result index`,
    "",
    "This index validates work-only authoring evidence. It does not establish original-runtime behavior, JavaScript fidelity, audio, RMSE, human review, owner acceptance, strict completion, or publication.",
    "",
    "## Summary",
    "",
    `- Release: \`${report.release.releaseId}\``,
    `- Authoritative JSON commit marker: \`${jsonTarget.file}\``,
    "- The authoritative JSON is written last and binds this Markdown by SHA-256.",
    `- Release members: ${report.summary.selectedReleaseMembers}`,
    `- FLA-applicable authoring denominator: ${report.summary.flaApplicableItems}`,
    `- SWF-only not applicable to Animate authoring audit: ${report.summary.swfOnlyNotApplicableItems}`,
    `- Queue rows touched: ${report.summary.primaryRowsTouched}/${report.summary.flaApplicableItems}`,
    `- Verified work-only authoring audits: ${report.summary.verifiedWorkOnlyAuthoringAudits}/${report.summary.flaApplicableItems}`,
    `- Pending applicable authoring audits: ${report.summary.pendingApplicableAuthoringAudits}`,
    `- Attempt receipts: ${report.summary.totalAttemptReceipts} (${report.summary.failedAttemptReceipts} failed)`,
    `- Strict acceptance effect: ${report.summary.strictAcceptanceEffect}`,
    "",
    "## Pending FLA-applicable items",
    "",
    report.pendingAnimationIds.length
      ? report.pendingAnimationIds.map((id) => `- \`${id}\``).join("\n")
      : "None.",
    "",
    "## Evidence matrix",
    "",
    "| Queue | Release | Animation | Work-only status | Validated attempts | Native authoring metadata |",
    "|---:|---:|---|---|---|---|",
    ...rows,
    "",
    "Failed attempts remain fail-closed and contribute no authoring audit. Missing receipts remain pending. SWF-only dispositions are not silently added to the FLA-applicable denominator.",
    "",
  ].join("\n");
}

async function preflightOutputTarget(root, file, label) {
  invariant(isInside(path.join(root, "reports"), file), `${label} must be under reports/`);
  await rejectSymlinkComponents(root, file, label);
  if (await exists(file)) {
    const information = await lstat(file);
    invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
      `${label} must be a plain, singly-linked file`);
  }
}

async function writePairOrCheck(root, pair, {check}) {
  invariant(pair.json.file !== pair.markdown.file, "result-index JSON and Markdown targets must be distinct");
  await preflightOutputTarget(root, pair.json.file, pair.json.label);
  await preflightOutputTarget(root, pair.markdown.file, pair.markdown.label);
  if (check) {
    invariant(await exists(pair.json.file), `${pair.json.label} is missing`);
    invariant(await exists(pair.markdown.file), `${pair.markdown.label} is missing`);
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(pair.json.file),
      readFile(pair.markdown.file),
    ]);
    invariant(currentJson.equals(pair.json.bytes), `${pair.json.label} is stale`);
    invariant(currentMarkdown.equals(pair.markdown.bytes), `${pair.markdown.label} is stale`);
    return;
  }
  await Promise.all([
    mkdir(path.dirname(pair.json.file), {recursive: true}),
    mkdir(path.dirname(pair.markdown.file), {recursive: true}),
  ]);
  const jsonTemporary = `${pair.json.file}.tmp-${process.pid}`;
  const markdownTemporary = `${pair.markdown.file}.tmp-${process.pid}`;
  await rejectSymlinkComponents(root, jsonTemporary, `${pair.json.label} temporary file`);
  await rejectSymlinkComponents(root, markdownTemporary, `${pair.markdown.label} temporary file`);
  try {
    await Promise.all([
      writeFile(jsonTemporary, pair.json.bytes, {flag: "wx"}),
      writeFile(markdownTemporary, pair.markdown.bytes, {flag: "wx"}),
    ]);
    await rename(markdownTemporary, pair.markdown.file);
    await rename(jsonTemporary, pair.json.file);
  } finally {
    await Promise.all([jsonTemporary, markdownTemporary].map((temporary) => unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    })));
  }
}

export function parseArguments(argv) {
  const options = {releaseId: null, readinessFile: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--release-id") options.releaseId = argv[++index] || invariant(false, "--release-id requires a value");
    else if (value === "--readiness") options.readinessFile = path.resolve(argv[++index] || invariant(false, "--readiness requires a path"));
    else if (value === "--json-report") options.jsonReport = path.resolve(argv[++index] || invariant(false, "--json-report requires a path"));
    else if (value === "--markdown-report") options.markdownReport = path.resolve(argv[++index] || invariant(false, "--markdown-report requires a path"));
    else if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-lesson-animate-authoring-audit-index.mjs --release-id <id> [options]",
    "",
    "Hash-validates existing work-only Adobe Animate authoring-audit receipts for",
    "the exact content-addressed full-release preparation queue. It never launches",
    "or interacts with Adobe Animate and grants no review or acceptance authority.",
    "",
    "Options:",
    "  --release-id <id>          Exact full lesson release ID",
    "  --readiness <file>         Readiness locator under reports/",
    "  --json-report <file>       Output JSON under reports/",
    "  --markdown-report <file>   Output Markdown under reports/",
    "  --check                    Recompute and compare without writing",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildLessonAnimateAuthoringAuditIndex(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "built",
    releaseId: result.report.release.releaseId,
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
