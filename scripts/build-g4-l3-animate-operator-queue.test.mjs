import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG4L3AnimateOperatorQueue,
  parseAnimateProcessTable,
  parseArguments,
} from "./build-g4-l3-animate-operator-queue.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function put(root, relative, bytes, mode = null) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

async function fixture({running = false, runnerUpdatedAfterPreparation = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-animate-queue-"));
  const sourcePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES";
  const stageRoot = "work/animate/g4-l3-read-only-fla-copies";
  const assistRootRelative = "work/animate/dependency-authoring-audits";
  const animateRelative = "Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
  const animateBinary = await put(root, animateRelative, Buffer.from("animate-binary"), 0o755);
  const historicalRunnerBytes = Buffer.from("paired source runner");
  const currentRunnerBytes = runnerUpdatedAfterPreparation
    ? Buffer.from("paired source runner with a post-preparation repair")
    : historicalRunnerBytes;
  const jsflBytes = Buffer.from("recursive JSFL audit");
  const runner = {
    file: "scripts/run-assisted-animate-authoring-audit.mjs",
    sha256: sha256(historicalRunnerBytes),
    bytes: historicalRunnerBytes.length,
  };
  const jsfl = {file: "scripts/animate-audit-current-document.jsfl", sha256: sha256(jsflBytes), bytes: jsflBytes.length};
  await put(root, runner.file, currentRunnerBytes);
  await put(root, jsfl.file, jsflBytes);
  await put(root, "scripts/build-g4-l3-animate-operator-queue.mjs", Buffer.from("fixture queue generator"));

  const manifestLines = [];
  const entries = [];
  for (let index = 0; index < 29; index += 1) {
    const number = String(index + 1).padStart(2, "0");
    const animationId = `course-g04-l03-fixture-${number}`;
    const basename = `L3FX${number}`;
    const archiveDir = `HELP_COURSES/ELMGR4/L3/FX/${basename}`;
    const flaArchive = `${archiveDir}.fla`;
    const swfArchive = `${archiveDir}.swf`;
    const flaBytes = Buffer.from(`fixture-fla-${number}`);
    const swfBytes = Buffer.from(`FWS-fixture-swf-${number}`);
    const flaHash = sha256(flaBytes);
    const swfHash = sha256(swfBytes);
    const flaSource = `${sourcePrefix}/${flaArchive}`;
    const swfSource = `${sourcePrefix}/${swfArchive}`;
    await put(root, flaSource, flaBytes);
    await put(root, swfSource, swfBytes);
    manifestLines.push(`${flaHash}  ${flaArchive}`, `${swfHash}  ${swfArchive}`);

    const batchCopy = `${stageRoot}/files/${animationId}/${basename}.fla`;
    const assistFla = `${assistRootRelative}/${animationId}/working-copy/${basename}.fla`;
    const assistSwf = `${assistRootRelative}/${animationId}/runtime-source/${basename}.swf`;
    const sourceBindingFile = `${assistRootRelative}/${animationId}/source-binding.json`;
    await put(root, batchCopy, flaBytes, 0o444);
    await put(root, assistFla, flaBytes, 0o444);
    await put(root, assistSwf, swfBytes, 0o444);
    const sourceBinding = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-read-only-paired-fla-swf-binding",
      evidenceId: animationId,
      sourceKind: "paired-fla-swf",
      acceptanceEffect: "none; work-only authoring evidence preparation",
      source: {file: flaSource, sha256: flaHash, bytes: flaBytes.length},
      workingCopy: {
        file: assistFla,
        sha256: flaHash,
        bytes: flaBytes.length,
        mode: "0444",
        readOnly: true,
        byteIdenticalToSource: true,
        separateRegularFile: true,
      },
      shippedSwf: {
        source: {file: swfSource, sha256: swfHash, bytes: swfBytes.length},
        workingCopy: {
          file: assistSwf,
          sha256: swfHash,
          bytes: swfBytes.length,
          mode: "0444",
          readOnly: true,
          byteIdenticalToSource: true,
          separateRegularFile: true,
        },
      },
      intendedAudit: {
        captureFrame: 1,
        recursiveRootAndLibraryTimelines: true,
        frameAndInstanceScriptInventory: true,
        nativeStagePng: true,
        saveOrPublishAllowed: false,
      },
      generatedBy: {file: runner.file, sha256: runner.sha256},
    };
    const sourceBindingBytes = Buffer.from(`${JSON.stringify(sourceBinding, null, 2)}\n`);
    await put(root, sourceBindingFile, sourceBindingBytes, 0o444);

    const releasePart = index < 25 ? 1 : 2;
    const batchOrdinal = index < 25 ? index + 1 : index - 24;
    entries.push({
      animationId,
      batch: {
        batchId: releasePart === 1 ? "batch-001" : "batch-002",
        batchOrdinal,
        releasePart,
        releasePartCount: 2,
      },
      source: {
        file: flaSource,
        sha256: flaHash,
        bytes: flaBytes.length,
        sourceFreezeManifestPath: flaArchive,
        pairedSwf: {file: swfSource, sha256: swfHash, bytes: swfBytes.length},
      },
      workingCopy: {
        file: batchCopy,
        sha256: flaHash,
        bytes: flaBytes.length,
        mode: "0444",
        readOnly: true,
        byteIdenticalToSource: true,
        separateRegularFile: true,
      },
      animateAuthoringAudit: {status: "not-run"},
    });
  }
  await put(root, "catalog/source-manifest.sha256", Buffer.from(`${manifestLines.join("\n")}\n`));

  const animateBinding = {file: animateBinary, sha256: sha256(Buffer.from("animate-binary")), bytes: 14, executable: true};
  const stagingManifest = {
    schemaVersion: 1,
    evidenceKind: "g4-l3-adobe-animate-prepare-only-fla-staging",
    authorityBoundary: {
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    toolBindings: {
      adobeAnimate: {executable: animateBinding},
      existingAssistRunner: runner,
      jsflAuditTemplate: jsfl,
    },
    summary: {
      flaBackedItems: 29,
      animateGuiExecutions: 0,
      authoringAuditsCompleted: 0,
      strictAcceptanceEffect: false,
    },
    entries,
  };
  const stagingBytes = Buffer.from(`${JSON.stringify(stagingManifest, null, 2)}\n`);
  const stagingHash = sha256(stagingBytes);
  const stagingFile = `${stageRoot}/manifests/sha256/${stagingHash}.json`;
  await put(root, stagingFile, stagingBytes, 0o444);
  const readiness = {
    schemaVersion: 1,
    reportType: "g4-l3-adobe-animate-prepare-only-readiness",
    authorityBoundary: {
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    contentAddressedManifest: {file: stagingFile, sha256: stagingHash, bytes: stagingBytes.length, readOnly: true},
    toolBindings: {existingAssistRunner: runner},
    summary: {flaBackedItems: 29, copiesReady: 29, authoringAuditsCompleted: 0, strictAcceptanceEffect: false},
  };
  const readinessFile = await put(root, "reports/g4-l3-animate-prepare-readiness.json",
    Buffer.from(`${JSON.stringify(readiness, null, 2)}\n`));

  const probeRoot = "work/animate/jsfl-cli-probes/run-current";
  const probeArtifacts = {
    generatedAudit: {file: `${probeRoot}/generated.jsfl`, bytes: Buffer.from("generated")},
    controller: {file: `${probeRoot}/controller.jsfl`, bytes: Buffer.from("controller")},
    stdout: {file: `${probeRoot}/stdout.log`, bytes: Buffer.from("stdout")},
    stderr: {file: `${probeRoot}/stderr.log`, bytes: Buffer.alloc(0)},
    marker: {file: `${probeRoot}/controller-result.json`, bytes: Buffer.from("marker")},
    report: {file: `${probeRoot}/Untitled-1-authoring-audit.json`, bytes: Buffer.from("blank report")},
    png: {file: `${probeRoot}/Untitled-1-frame-1.png`, bytes: Buffer.from("png")},
  };
  for (const artifact of Object.values(probeArtifacts)) await put(root, artifact.file, artifact.bytes);
  const probeReceipt = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-jsfl-cli-probe",
    status: "passed",
    scope: "disposable-blank-document",
    command: {
      executable: animateBinary,
      executableSha256: animateBinding.sha256,
      intentionallyOmitsQuitFlag: true,
    },
    scripts: {
      auditTemplate: {file: jsfl.file, sha256: jsfl.sha256},
      generatedAudit: {file: probeArtifacts.generatedAudit.file, sha256: sha256(probeArtifacts.generatedAudit.bytes)},
      controller: {file: probeArtifacts.controller.file, sha256: sha256(probeArtifacts.controller.bytes)},
    },
    process: {
      exitCode: 0,
      signal: null,
      timedOut: false,
      durationMs: 10,
      stdout: {file: probeArtifacts.stdout.file, sha256: sha256(probeArtifacts.stdout.bytes)},
      stderr: {file: probeArtifacts.stderr.file, sha256: sha256(probeArtifacts.stderr.bytes)},
    },
    artifacts: {
      marker: {file: probeArtifacts.marker.file, sha256: sha256(probeArtifacts.marker.bytes)},
      report: {
        file: probeArtifacts.report.file,
        sha256: sha256(probeArtifacts.report.bytes),
        animateVersion: "MAC 21,0,7,42652",
        documentName: "Untitled-1",
        stage: {width: 550, height: 400},
        fps: 24,
        frameCount: 1,
      },
      png: {
        file: probeArtifacts.png.file,
        sha256: sha256(probeArtifacts.png.bytes),
        width: 550,
        height: 400,
      },
    },
    failure: null,
  };
  const currentProbeFile = await put(root, `${probeRoot}/probe-result.json`,
    Buffer.from(`${JSON.stringify(probeReceipt, null, 2)}\n`));

  return {
    root,
    readinessFile,
    assistRoot: path.join(root, assistRootRelative),
    currentProbeFile,
    jsonReport: path.join(root, "reports/g4-l3-animate-authoring-operator-queue.json"),
    markdownReport: path.join(root, "reports/g4-l3-animate-authoring-operator-queue.md"),
    processTableText: running ? `100 ${animateBinary}\n101 /some/helper ${animateBinary}\n` : "101 /other/process\n",
    animateBinary,
  };
}

test("process parsing matches only the exact Animate executable command prefix", () => {
  const binary = "/Applications/Adobe Animate/Animate";
  const parsed = parseAnimateProcessTable([
    `5 /helper --parent ${binary}`,
    `7 ${binary}`,
    `9 ${binary} --run-jsfl controller.jsfl`,
    `11 ${binary}-helper`,
  ].join("\n"), binary);
  assert.deepEqual(parsed.map(({pid}) => pid), [7, 9]);
});

test("builds and checks a 29-item hash-bound queue while preserving every acceptance gate", async () => {
  const context = await fixture();
  const result = await buildG4L3AnimateOperatorQueue(context);
  assert.equal(result.report.summary.totalItems, 29);
  assert.equal(result.report.summary.sourcePairsVerified, 29);
  assert.equal(result.report.summary.batchFlaCopiesVerified, 29);
  assert.equal(result.report.summary.pairedAssistPackagesVerified, 29);
  assert.equal(result.report.processGate.state, "closed-awaiting-named-human-operator");
  assert.equal(result.report.currentBlankDocumentProbe.status, "passed");
  assert.equal(result.report.currentBlankDocumentProbe.reusedAsG4L3FlaEvidence, false);
  assert.equal(result.report.authorityBoundary.adobeAnimateAuthoringAudit, false);
  assert.equal(result.report.authorityBoundary.originalRuntimeBehavior, false);
  assert.equal(result.report.authorityBoundary.humanReview, false);
  assert.equal(result.report.authorityBoundary.ownerAcceptance, false);
  assert.equal(result.report.authorityBoundary.strictAcceptance, false);
  assert.equal(result.report.queue[0].currentState, "ready-for-named-human-one-item-run");
  assert.equal(result.report.queue[0].queueOrdinal, 1);
  assert.equal(result.report.queue[28].queueOrdinal, 29);
  assert.equal(result.report.queue[0].pairedAssistPreparation.flaWorkingCopy.mode, "0444");
  assert.equal(result.report.queue[0].pairedAssistPreparation.swfWorkingCopy.mode, "0444");
  assert.deepEqual(result.report.queue[0].command.humanAssistedRun.argvTemplate.slice(-2), [
    "--dialog-operator", "<HUMAN-NAME-OR-STABLE-ID>",
  ]);
  assert.equal(result.report.queue[0].command.humanAssistedRun.exactAfterSingleDeclaredSubstitution, true);
  assert.equal(result.report.queue[0].evidenceState.authoringAudit, false);
  assert.equal(result.report.queue[0].evidenceState.migrationComplete, false);
  assert.equal(result.report.inputs.assistRunnerTransition.state, "unchanged-since-preparation");
  assert.equal(result.report.inputs.historicalPreparationAssistRunner.sha256,
    result.report.inputs.currentExecutionAssistRunner.sha256);
  assert.equal(result.report.inputs.historicalPreparationAssistRunner.bytes,
    result.report.inputs.currentExecutionAssistRunner.bytes);
  assert.match(await readFile(context.markdownReport, "utf8"), /currently closed/u);
  await buildG4L3AnimateOperatorQueue({...context, check: true});
});

test("preserves an immutable historical preparation binding while hash-binding the updated execution runner", async () => {
  const context = await fixture({runnerUpdatedAfterPreparation: true});
  const result = await buildG4L3AnimateOperatorQueue(context);
  const transition = result.report.inputs.assistRunnerTransition;
  assert.equal(transition.state, "current-execution-runner-updated-after-immutable-preparation");
  assert.equal(transition.sameBytes, false);
  assert.equal(transition.immutableSourceBindingsRewritten, false);
  assert.equal(transition.currentCommandsUseCurrentExecutionRunner, true);
  assert.notEqual(transition.historicalPreparationRunner.sha256, transition.currentExecutionRunner.sha256);
  assert.equal(result.report.queue.every((entry) =>
    entry.pairedAssistPreparation.historicalPreparationRunner.sha256
      === transition.historicalPreparationRunner.sha256), true);
  await buildG4L3AnimateOperatorQueue({...context, check: true});
});

test("records an already-running Animate process as a fail-closed global blocker", async () => {
  const context = await fixture({running: true});
  const result = await buildG4L3AnimateOperatorQueue(context);
  assert.equal(result.report.processGate.animateRunning, true);
  assert.equal(result.report.processGate.matchingProcessCount, 1);
  assert.equal(result.report.processGate.state, "blocked-animate-already-running");
  assert.equal(result.report.processGate.humanAssistedRunAllowedNow, false);
  assert.equal(result.report.queue.every((entry) => entry.currentState.startsWith("blocked-")), true);
});

test("fails closed for source, read-only-copy, probe, or paired-binding drift", async () => {
  const sourceContext = await fixture();
  await writeFile(
    path.join(sourceContext.root, "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FX/L3FX01.swf"),
    "tampered",
  );
  await assert.rejects(buildG4L3AnimateOperatorQueue(sourceContext), /source SWF SHA-256 is stale/);

  const copyContext = await fixture();
  const copy = path.join(copyContext.root,
    "work/animate/g4-l3-read-only-fla-copies/files/course-g04-l03-fixture-01/L3FX01.fla");
  await chmod(copy, 0o644);
  await assert.rejects(buildG4L3AnimateOperatorQueue(copyContext), /mode must be exactly 0444/);

  const probeContext = await fixture();
  const probe = JSON.parse(await readFile(probeContext.currentProbeFile, "utf8"));
  probe.status = "failed";
  await writeFile(probeContext.currentProbeFile, `${JSON.stringify(probe, null, 2)}\n`);
  await assert.rejects(buildG4L3AnimateOperatorQueue(probeContext), /not a passing disposable-document receipt/);

  const bindingContext = await fixture();
  const bindingFile = path.join(bindingContext.assistRoot, "course-g04-l03-fixture-01", "source-binding.json");
  await chmod(bindingFile, 0o644);
  const binding = JSON.parse(await readFile(bindingFile, "utf8"));
  binding.acceptanceEffect = "approved";
  await writeFile(bindingFile, `${JSON.stringify(binding, null, 2)}\n`);
  await chmod(bindingFile, 0o444);
  await assert.rejects(buildG4L3AnimateOperatorQueue(bindingContext), /claims acceptance authority/);
});

test("CLI exposes report/check inputs and no launch, dialog, save, publish, or approval controls", async () => {
  const parsed = parseArguments([
    "--check",
    "--readiness", "/tmp/readiness.json",
    "--assist-root", "/tmp/assist",
    "--current-probe", "/tmp/probe.json",
    "--json-report", "/tmp/queue.json",
    "--markdown-report", "/tmp/queue.md",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.currentProbeFile, "/tmp/probe.json");
  for (const forbidden of ["--launch", "--dialog-operator", "--save", "--publish", "--approve"]) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/);
  }
  const source = await readFile(fileURLToPath(new URL("./build-g4-l3-animate-operator-queue.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /\bspawn\s*\(/u);
  assert.match(source, /execFile\("ps", \["-axo", "pid=,command="\]\)/u);
  assert.equal((await stat(fileURLToPath(new URL("./build-g4-l3-animate-operator-queue.mjs", import.meta.url)))).isFile(), true);
});
