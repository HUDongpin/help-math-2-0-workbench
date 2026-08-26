import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, realpath, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {
  buildG4L3AnimateAuthoringAuditIndex,
  parseArguments,
} from "./build-g4-l3-animate-authoring-audit-index.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function put(root, relative, bytes, mode = null) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

function portable(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function reference(root, file, bytes) {
  return {file: portable(root, file), sha256: sha256(bytes), bytes: bytes.length};
}

function png(width, height) {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function createAttempt({root, queueEntry, evidenceId, runId, status, executable, auditTemplate,
  cleanProcessFailure = false}) {
  const evidenceRoot = path.join(root, "work", "animate", "dependency-authoring-audits", evidenceId);
  const runDir = path.join(evidenceRoot, "runs", runId);
  const flaBytes = await readFile(path.join(root, queueEntry.sourcePair.fla.file));
  const swfBytes = await readFile(path.join(root, queueEntry.sourcePair.swf.file));
  const flaCopyFile = await put(root, portable(root, path.join(evidenceRoot, "working-copy", path.basename(queueEntry.sourcePair.fla.file))),
    flaBytes, 0o444);
  const swfCopyFile = await put(root, portable(root, path.join(evidenceRoot, "runtime-source", path.basename(queueEntry.sourcePair.swf.file))),
    swfBytes, 0o444);
  const flaCopy = {...reference(root, flaCopyFile, flaBytes), mode: "0444", readOnly: true,
    byteIdenticalToSource: true, separateRegularFile: true};
  const swfCopy = {...reference(root, swfCopyFile, swfBytes), mode: "0444", readOnly: true,
    byteIdenticalToSource: true, separateRegularFile: true};
  const sourceBinding = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-read-only-paired-fla-swf-binding",
    evidenceId,
    sourceKind: "paired-fla-swf",
    acceptanceEffect: "none; work-only authoring evidence preparation",
    source: queueEntry.sourcePair.fla,
    workingCopy: flaCopy,
    shippedSwf: {source: queueEntry.sourcePair.swf, workingCopy: swfCopy},
    intendedAudit: {
      captureFrame: 1,
      recursiveRootAndLibraryTimelines: true,
      frameAndInstanceScriptInventory: true,
      nativeStagePng: true,
      saveOrPublishAllowed: false,
    },
    generatedBy: {file: "scripts/run-assisted-animate-authoring-audit.mjs", sha256: "a".repeat(64)},
  };
  const sourceBindingBytes = Buffer.from(`${JSON.stringify(sourceBinding, null, 2)}\n`);
  const sourceBindingFile = await put(root, portable(root, path.join(evidenceRoot, "source-binding.json")), sourceBindingBytes, 0o444);
  const sourceBindingRef = reference(root, sourceBindingFile, sourceBindingBytes);

  const generatedBytes = Buffer.from(`generated ${evidenceId}`);
  const controllerBytes = Buffer.from(`controller ${evidenceId}`);
  const stdoutBytes = Buffer.from("");
  const stderrBytes = status === "passed" ? Buffer.from("warning") : Buffer.from("terminated");
  const generatedFile = await put(root, portable(root, path.join(runDir, "generated.jsfl")), generatedBytes);
  const controllerFile = await put(root, portable(root, path.join(runDir, "controller.jsfl")), controllerBytes);
  const stdoutFile = await put(root, portable(root, path.join(runDir, "stdout.log")), stdoutBytes);
  const stderrFile = await put(root, portable(root, path.join(runDir, "stderr.log")), stderrBytes);
  const scripts = {
    auditTemplate: reference(root, auditTemplate.file, auditTemplate.bytes),
    generatedAudit: reference(root, generatedFile, generatedBytes),
    controller: reference(root, controllerFile, controllerBytes),
  };
  const process = {
    exitCode: status === "passed" || cleanProcessFailure ? 0 : null,
    signal: status === "passed" || cleanProcessFailure ? null : "SIGTERM",
    timedOut: false,
    durationMs: 100,
    stdout: reference(root, stdoutFile, stdoutBytes),
    stderr: reference(root, stderrFile, stderrBytes),
  };
  let artifacts = null;
  let workEvidenceRef = null;

  if (status === "failed" && cleanProcessFailure) {
    const failedMarker = {
      status: "failed",
      animateVersion: "MAC 21,0,7,42652",
      documentName: path.basename(flaCopyFile),
      documentPathURI: pathToFileURL(flaCopyFile).href,
      captureFrame: 1,
      message: "Audit JSFL did not create the authoring report",
    };
    await put(root, portable(root, path.join(runDir, "controller-result.json")),
      Buffer.from(`${JSON.stringify(failedMarker, null, 2)}\n`));
  }

  if (status === "passed") {
    const width = 800;
    const height = 600;
    const report = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-authoring-audit",
      recursiveLibraryTimelineAudit: true,
      animateVersion: "MAC 21,0,7,42652",
      capturedAt: "Fri, 24 Jul 2026 08:19:40 GMT",
      document: {
        name: path.basename(flaCopyFile),
        pathURI: pathToFileURL(flaCopyFile).href,
        width,
        height,
        frameRate: 12,
        backgroundColor: "#FFFFFF",
        libraryItemCount: 0,
      },
      timeline: {
        frameCount: 1,
        layerCount: 1,
        currentFlashFrame: 1,
        layers: [{
          keyframes: [{
            actionScript: "stop();",
            actionScriptLength: 7,
            elements: [{attachedActionScript: null, attachedActionScriptLength: 0}],
          }],
        }],
      },
      library: [],
    };
    const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    const reportFile = await put(root, portable(root, path.join(runDir, `${path.basename(flaCopyFile)}-authoring-audit.json`)), reportBytes);
    const pngBytes = png(width, height);
    const pngFile = await put(root, portable(root, path.join(runDir, `${path.basename(flaCopyFile)}-frame-1.png`)), pngBytes);
    const marker = {
      status: "passed",
      animateVersion: report.animateVersion,
      documentName: path.basename(flaCopyFile),
      documentPathURI: pathToFileURL(flaCopyFile).href,
      captureFrame: 1,
    };
    const markerBytes = Buffer.from(`${JSON.stringify(marker, null, 2)}\n`);
    const markerFile = await put(root, portable(root, path.join(runDir, "controller-result.json")), markerBytes);
    const summary = {
      capturedAt: report.capturedAt,
      stage: {width, height},
      fps: 12,
      frameCount: 1,
      backgroundColor: "#FFFFFF",
      rootLayerCount: 1,
      libraryItemCount: 0,
      frameScriptsPresent: 1,
      attachedScriptsPresent: 0,
      scriptBodiesRequired: true,
    };
    artifacts = {
      marker: reference(root, markerFile, markerBytes),
      report: reference(root, reportFile, reportBytes),
      png: {...reference(root, pngFile, pngBytes), width, height},
      animateVersion: report.animateVersion,
      reportSummary: summary,
    };
    const workEvidence = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-paired-fla-swf-authoring-audit",
      status: "verified-work-only-authoring-audit",
      evidenceId,
      sourceKind: "paired-fla-swf",
      acceptanceEffect: "none; not migration status, human review, owner acceptance, runtime behavior, audio, fidelity, or completion evidence",
      sourceBinding: {file: sourceBindingRef.file, sha256: sourceBindingRef.sha256,
        source: queueEntry.sourcePair.fla, sourceUnchangedAfterAudit: true},
      workingCopy: {...flaCopy, readOnlyAfterAudit: true, byteIdenticalToSourceAfterAudit: true},
      shippedSwfBinding: {
        source: queueEntry.sourcePair.swf,
        stagedCopy: swfCopy,
        sourceUnchangedAfterAudit: true,
        stagedCopyReadOnlyAfterAudit: true,
        stagedCopyByteIdenticalAfterAudit: true,
        executedByThisAuthoringAudit: false,
      },
      humanDialogBoundary: {
        required: true,
        designatedOperator: "Dr. Peter Hu",
        operatorNameIsNotReviewOrApproval: true,
        automatedDialogInteractionUsed: false,
      },
      protocol: {
        oneFlaPerColdStartProcess: true,
        openedOnlyWorkingCopy: true,
        openedSourceDirectly: false,
        saveAllowed: false,
        publishAllowed: false,
        closeWithoutSaving: true,
        recursiveRootAndLibraryTimelines: true,
        nativeStagePng: true,
        shippedSwfExecuted: false,
      },
      scripts: {
        auditTemplate: {file: scripts.auditTemplate.file, sha256: scripts.auditTemplate.sha256},
        generatedDependencyAudit: {file: scripts.generatedAudit.file, sha256: scripts.generatedAudit.sha256},
        controller: {file: scripts.controller.file, sha256: scripts.controller.sha256},
      },
      nativeMovie: summary,
      capturedAuthoringFrame: {flashFrame: 1, file: artifacts.png.file, sha256: artifacts.png.sha256, width, height},
      rawAudit: {file: artifacts.report.file, sha256: artifacts.report.sha256},
      controllerMarker: {file: artifacts.marker.file, sha256: artifacts.marker.sha256},
      writeBoundary: {
        root: portable(root, evidenceRoot),
        workOnly: true,
        migrationFilesWritten: false,
        statusFilesWritten: false,
        approvalFilesWritten: false,
      },
    };
    const workEvidenceBytes = Buffer.from(`${JSON.stringify(workEvidence, null, 2)}\n`);
    const workEvidenceFile = await put(root, portable(root, path.join(runDir, "dependency-authoring-audit-evidence.json")), workEvidenceBytes);
    workEvidenceRef = reference(root, workEvidenceFile, workEvidenceBytes);
  }

  const executableBytes = await readFile(executable);
  const receipt = {
    schemaVersion: 1,
    evidenceKind: "human-assisted-adobe-animate-dependency-authoring-audit-run",
    status,
    evidenceId,
    acceptanceEffect: "none; work-only dependency/paired-source authoring audit",
    sourceKind: "paired-fla-swf",
    humanActionBoundary: {
      required: true,
      designatedOperator: "Dr. Peter Hu",
      automatedDialogInteractionUsed: false,
      reviewOrOwnerDecisionRecorded: false,
    },
    source: queueEntry.sourcePair.fla,
    workingCopy: flaCopy,
    shippedSwf: {source: queueEntry.sourcePair.swf, workingCopy: swfCopy},
    sourceBinding: {file: sourceBindingRef.file, sha256: sourceBindingRef.sha256},
    captureFrame: 1,
    command: {
      executable,
      executableSha256: sha256(executableBytes),
      args: ["--run-jsfl", "-o", scripts.controller.file],
      spawnedAnimateProcessCount: 1,
      intentionallyOmitsQuitFlag: true,
    },
    scripts,
    process,
    artifacts,
    workEvidence: workEvidenceRef,
    postRunVerification: {
      sourceSha256: queueEntry.sourcePair.fla.sha256,
      workingCopySha256: queueEntry.sourcePair.fla.sha256,
      workingCopyReadOnly: true,
      sourceSwfSha256: queueEntry.sourcePair.swf.sha256,
      stagedSwfSha256: queueEntry.sourcePair.swf.sha256,
      stagedSwfReadOnly: true,
    },
    migrationOrApprovalWrites: false,
    failure: status === "passed" ? null : `${evidenceId}: Animate exited with code null (SIGTERM)`,
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  const receiptFile = await put(root, portable(root, path.join(runDir, "assisted-run-result.json")), receiptBytes);
  return {receiptFile, reportFile: artifacts ? path.join(root, artifacts.report.file) : null};
}

async function fixture() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "g4-l3-authoring-index-")));
  await put(root, "scripts/build-g4-l3-animate-authoring-audit-index.mjs", Buffer.from("fixture generator"));
  const auditTemplateBytes = Buffer.from("audit template");
  const auditTemplateFile = await put(root, "scripts/animate-audit-current-document.jsfl", auditTemplateBytes);
  const executable = await put(root, "Applications/Adobe Animate", Buffer.from("animate"), 0o755);
  const queueEntries = [];
  for (let index = 0; index < 2; index += 1) {
    const number = index + 1;
    const animationId = `fixture-${number.toString().padStart(2, "0")}`;
    const flaBytes = Buffer.from(`fla-${number}`);
    const swfBytes = Buffer.from(`swf-${number}`);
    const flaFile = await put(root, `source-assets/flash/HELP MATH_ORIGINAL FILES/L3/F${number}.fla`, flaBytes);
    const swfFile = await put(root, `source-assets/flash/HELP MATH_ORIGINAL FILES/L3/F${number}.swf`, swfBytes);
    queueEntries.push({
      queueOrdinal: number,
      animationId,
      batch: {batchId: "batch-001", batchOrdinal: number, releasePart: 1},
      sourcePair: {
        sourceKind: "fla+swf",
        fla: reference(root, flaFile, flaBytes),
        swf: reference(root, swfFile, swfBytes),
        bothSourceFreezeBound: true,
        flaSwfEquivalenceProven: false,
        shippedSwfExecutedByAuthoringAudit: false,
      },
    });
  }
  const queue = {
    schemaVersion: 1,
    reportType: "g4-l3-adobe-animate-human-assisted-authoring-operator-queue",
    authorityBoundary: {adobeAnimateAuthoringAudit: false, originalRuntimeBehavior: false, strictAcceptance: false},
    summary: {totalItems: 2},
    queue: queueEntries,
  };
  const queueFile = await put(root, "reports/g4-l3-animate-authoring-operator-queue.json",
    Buffer.from(`${JSON.stringify(queue, null, 2)}\n`));
  const auditTemplate = {file: auditTemplateFile, bytes: auditTemplateBytes};
  const passed = await createAttempt({root, queueEntry: queueEntries[0], evidenceId: "fixture-01", runId: "run-pass",
    status: "passed", executable, auditTemplate});
  await createAttempt({root, queueEntry: queueEntries[1], evidenceId: "fixture-02", runId: "run-fail",
    status: "failed", executable, auditTemplate});
  await createAttempt({root, queueEntry: queueEntries[1], evidenceId: "fixture-02-repair", runId: "run-repair",
    status: "failed", executable, auditTemplate, cleanProcessFailure: true});
  return {
    root,
    queueFile,
    assistRoot: path.join(root, "work", "animate", "dependency-authoring-audits"),
    jsonReport: path.join(root, "reports", "g4-l3-animate-authoring-audit-index.json"),
    markdownReport: path.join(root, "reports", "g4-l3-animate-authoring-audit-index.md"),
    expectedCount: 2,
    repairEvidenceIds: {"fixture-02": ["fixture-02-repair"]},
    passed,
  };
}

test("indexes one passing item and one fail-closed item without promoting acceptance", async () => {
  const context = await fixture();
  const result = await buildG4L3AnimateAuthoringAuditIndex(context);
  assert.equal(result.report.summary.queueItems, 2);
  assert.equal(result.report.summary.primaryRowsTouched, 2);
  assert.equal(result.report.summary.totalAttemptReceipts, 3);
  assert.equal(result.report.summary.verifiedWorkOnlyAuthoringAudits, 1);
  assert.equal(result.report.summary.failedAttemptReceipts, 2);
  assert.equal(result.report.summary.pendingAuthoringAudits, 1);
  assert.deepEqual(result.report.pendingAnimationIds, ["fixture-02"]);
  assert.equal(result.report.authorityBoundary.originalRuntimeBehavior, false);
  assert.equal(result.report.authorityBoundary.ownerAcceptance, false);
  assert.equal(result.report.authorityBoundary.strictAcceptance, false);
  assert.equal(result.report.items[0].selectedPassingAudit.nativeMovie.frameScriptsPresent, 1);
  assert.equal(result.report.items[1].selectedPassingAudit, null);
  assert.equal(result.report.items[1].attempts.find(({role}) => role === "repair").failureDisposition,
    "post-process-artifact-validation-failed");
  await buildG4L3AnimateAuthoringAuditIndex({...context, check: true});
});

test("fails closed when a bound raw authoring report is tampered", async () => {
  const context = await fixture();
  await writeFile(context.passed.reportFile, "tampered");
  await assert.rejects(buildG4L3AnimateAuthoringAuditIndex(context), /raw authoring report SHA-256 is stale/u);
});

test("CLI exposes read-only report inputs and rejects execution or approval controls", () => {
  const parsed = parseArguments([
    "--check",
    "--queue", "/tmp/queue.json",
    "--assist-root", "/tmp/assist",
    "--json-report", "/tmp/index.json",
    "--markdown-report", "/tmp/index.md",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.queueFile, "/tmp/queue.json");
  for (const forbidden of ["--launch", "--click", "--save", "--publish", "--approve"]) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/u);
  }
});
