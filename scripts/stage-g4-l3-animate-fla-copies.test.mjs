import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, stat, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {parseArguments, stageG4L3AnimateFlaCopies} from "./stage-g4-l3-animate-fla-copies.mjs";

const OLE = Buffer.from("d0cf11e0a1b11ae1", "hex");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function put(root, relative, bytes, mode) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-animate-prepare-"));
  const sourceA = Buffer.concat([OLE, Buffer.from("legacy-fla-a")]);
  const sourceB = Buffer.concat([OLE, Buffer.from("legacy-fla-b")]);
  const sources = [
    {
      animationId: "course-g04-l03-vb-002",
      relative: "HELP_COURSES/ELMGR4/L3/VB/L3VB02.fla",
      bytes: sourceA,
      batchOrdinal: 5,
    },
    {
      animationId: "course-g04-l03-in-003",
      relative: "HELP_COURSES/ELMGR4/L3/IN/L3IN03.fla",
      bytes: sourceB,
      batchOrdinal: 14,
    },
  ];
  for (const source of sources) {
    await put(root, `source-assets/flash/HELP MATH_ORIGINAL FILES/${source.relative}`, source.bytes);
  }
  await put(root, "catalog/source-manifest.sha256", Buffer.from(
    sources.map((source) => `${sha256(source.bytes)}  ${source.relative}`).join("\n") + "\n",
  ));

  const preflight = {
    schemaVersion: 1,
    reportType: "g4-l3-complete-lesson-automation-preflight",
    lesson: {grade: 4, lesson: 3},
    acceptance: {acceptanceNeutral: true},
    strictGateSnapshot: {strictComplete: 0},
    summary: {canonicalItems: 2, activePages: 2, flaBacked: 2, swfOnly: 0, existingDeclaredRenderers: 0},
    items: sources.map((source) => ({
      animationId: source.animationId,
      batch: {batchId: "batch-001", batchOrdinal: source.batchOrdinal, releasePart: 1, releasePartCount: 1},
      source: {
        fla: {
          path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${source.relative}`,
          sha256: sha256(source.bytes),
          bytes: source.bytes.length,
          physicalHashVerified: true,
        },
        swf: {
          path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${source.relative.replace(/\.fla$/u, ".swf")}`,
          sha256: "a".repeat(64),
          bytes: 100,
          physicalHashVerified: true,
        },
      },
    })),
  };
  const preflightFile = await put(root, "reports/g4-l3-automation-preflight.json", Buffer.from(`${JSON.stringify(preflight, null, 2)}\n`));
  await put(root, "catalog/toolchain.json", Buffer.from(JSON.stringify({
    authoringEvidence: {
      adobeAnimateDetected: true,
      productVersion: "21.0.7",
      applicationPath: path.join(root, "Applications", "Adobe Animate 2021"),
    },
  })));
  await put(root, "scripts/animate-audit-current-document.jsfl", Buffer.from([
    "function timelineSummary(timeline) {}",
    "function librarySummary(library) {}",
    "recursiveLibraryTimelineAudit: true",
    "document.exportPNG(pngURI, true, true)",
    "actionScriptLength:",
  ].join("\n")));
  await put(root, "scripts/run-assisted-animate-authoring-audit.mjs", Buffer.from([
    "async function runAssistedAudit() {}",
    "finalized = await finalize(options.animationId, runDir, root, options.workingCopyRoot)",
    '"adobe-animate-fla-only-dependency-authoring-audit"',
    "Because this dependency is FLA-only",
    '"--paired-swf"',
    '"--paired-swf-sha256"',
    '"adobe-animate-paired-fla-swf-authoring-audit"',
    "neither executes it nor proves FLA/SWF",
    'if (options.mode === "dependency-fla" && options.prepareOnly)',
    'const args = ["--run-jsfl", "-o", controllerFile]',
  ].join("\n")));
  await put(root, "scripts/stage-g4-l3-animate-fla-copies.mjs", Buffer.from("fixture generator"));

  const animateBinary = await put(
    root,
    "Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021",
    Buffer.from("animate executable"),
    0o755,
  );
  await put(root, "Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/Info.plist", Buffer.from(
    "<plist><dict>" +
    "<key>Adobe Product Build</key><string>21.0.7.42652</string>" +
    "<key>CFBundleShortVersionString</key><string>21.0.7</string>" +
    "</dict></plist>",
  ));
  const jsflBytes = await readFile(path.join(root, "scripts/animate-audit-current-document.jsfl"));

  const historicalReceiptBytes = Buffer.from("historical pass receipt");
  await put(root, "work/animate/jsfl-cli-probes/run-old/probe-result.json", historicalReceiptBytes);
  await put(root, "reports/pilot-animate-authoring-audit.json", Buffer.from(JSON.stringify({
    animateProbe: {
      status: "passed",
      scope: "disposable-blank-document",
      animateVersion: "MAC 21,0,7,42652",
      executable: animateBinary,
      executableSha256: sha256(Buffer.from("animate executable")),
      receipt: {
        file: "work/animate/jsfl-cli-probes/run-old/probe-result.json",
        sha256: sha256(historicalReceiptBytes),
      },
      auditScript: {file: "scripts/animate-audit-current-document.jsfl", sha256: sha256(jsflBytes)},
    },
  })));

  const currentProbeFiles = [];
  for (const [index, timeout] of [60_000, 120_000].entries()) {
    const run = `work/animate/jsfl-cli-probes/run-failed-${index + 1}`;
    const artifacts = {
      generatedAudit: {file: `${run}/generated.jsfl`, bytes: Buffer.from(`generated-${index}`)},
      controller: {file: `${run}/controller.jsfl`, bytes: Buffer.from(`controller-${index}`)},
      stdout: {file: `${run}/stdout.log`, bytes: Buffer.alloc(0)},
      stderr: {file: `${run}/stderr.log`, bytes: Buffer.from(`timeout-${index}`)},
    };
    for (const artifact of Object.values(artifacts)) await put(root, artifact.file, artifact.bytes);
    const receipt = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-jsfl-cli-probe",
      status: "failed",
      scope: "disposable-blank-document",
      command: {executable: animateBinary, executableSha256: sha256(Buffer.from("animate executable"))},
      scripts: {
        auditTemplate: {file: "scripts/animate-audit-current-document.jsfl", sha256: sha256(jsflBytes)},
        generatedAudit: {file: artifacts.generatedAudit.file, sha256: sha256(artifacts.generatedAudit.bytes)},
        controller: {file: artifacts.controller.file, sha256: sha256(artifacts.controller.bytes)},
      },
      process: {
        exitCode: null,
        signal: "SIGTERM",
        timedOut: true,
        durationMs: timeout,
        stdout: {file: artifacts.stdout.file, sha256: sha256(artifacts.stdout.bytes)},
        stderr: {file: artifacts.stderr.file, sha256: sha256(artifacts.stderr.bytes)},
      },
      artifacts: null,
      failure: `Animate JSFL probe timed out after ${timeout} ms`,
    };
    const receiptFile = `${run}/probe-result.json`;
    await put(root, receiptFile, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`));
    currentProbeFiles.push(receiptFile);
  }

  return {
    root,
    sources,
    preflightFile,
    outputRoot: path.join(root, "work", "animate", "g4-l3-read-only-fla-copies"),
    jsonReport: path.join(root, "reports", "g4-l3-animate-prepare-readiness.json"),
    markdownReport: path.join(root, "reports", "g4-l3-animate-prepare-readiness.md"),
    animateBinary,
    currentProbeFiles,
    expectedFlaCount: 2,
  };
}

test("CLI exposes staging/check inputs but no launch, dialog, finalize, or acceptance controls", () => {
  const parsed = parseArguments([
    "--check",
    "--preflight", "/tmp/preflight.json",
    "--output-root", "/tmp/output",
    "--json-report", "/tmp/report.json",
    "--markdown-report", "/tmp/report.md",
    "--animate-binary", "/tmp/Animate",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.animateBinary, "/tmp/Animate");
  for (const forbidden of ["--launch", "--dialog-operator", "--finalize", "--approve", "--publish"]) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/);
  }
});

test("stages byte-identical 0444 copies and binds a content-addressed acceptance-neutral manifest", async () => {
  const context = await fixture();
  const result = await stageG4L3AnimateFlaCopies(context);
  assert.equal(result.report.summary.flaBackedItems, 2);
  assert.equal(result.report.summary.copiesReady, 2);
  assert.equal(result.report.summary.currentAutomatedAnimateProbePassed, false);
  assert.equal(result.report.summary.animateGuiExecutions, 0);
  assert.equal(result.report.summary.authoringAuditsCompleted, 0);
  assert.equal(result.report.summary.strictAcceptanceEffect, false);
  assert.equal(result.report.toolBindings.currentAutomatedDisposableDocumentProbe.attempts.length, 2);
  assert.equal(result.report.toolBindings.currentAutomatedDisposableDocumentProbe.passed, false);
  assert.equal(
    result.report.toolBindings.existingAssistRunner.compatibilityAudit.pairedFlaSwfMode.compatibleWithPairedFlaAndSwfItems,
    true,
  );
  assert.equal(
    result.report.toolBindings.existingAssistRunner.compatibilityAudit.pairedFlaSwfMode.shippedSwfExecutedByAuthoringAudit,
    false,
  );
  assert.match(result.report.contentAddressedManifest.file, new RegExp(`${result.manifestSha256}\\.json$`, "u"));
  assert.equal(sha256(await readFile(result.manifestFile)), result.manifestSha256);
  assert.equal((await stat(result.manifestFile)).mode & 0o222, 0);
  for (const entry of result.manifest.entries) {
    const source = await readFile(path.join(context.root, entry.source.file));
    const working = await readFile(path.join(context.root, entry.workingCopy.file));
    assert.deepEqual(working, source);
    assert.equal((await stat(path.join(context.root, entry.workingCopy.file))).mode & 0o222, 0);
    assert.equal(entry.animateAuthoringAudit.status, "not-run");
  }
  await stageG4L3AnimateFlaCopies({...context, check: true});
});

test("check mode fails closed for a writable or changed working copy", async () => {
  const context = await fixture();
  const result = await stageG4L3AnimateFlaCopies(context);
  const copy = path.join(context.root, result.manifest.entries[0].workingCopy.file);
  await chmod(copy, 0o644);
  await assert.rejects(stageG4L3AnimateFlaCopies({...context, check: true}), /working copy mode is not exactly 0444/);
  await chmod(copy, 0o400);
  await assert.rejects(stageG4L3AnimateFlaCopies({...context, check: true}), /working copy mode is not exactly 0444/);
  await chmod(copy, 0o644);
  await writeFile(copy, "changed");
  await chmod(copy, 0o444);
  await assert.rejects(stageG4L3AnimateFlaCopies({...context, check: true}), /working copy differs from the source FLA/);
});

test("fails closed when a current failed-probe artifact hash or source-freeze binding is stale", async () => {
  const probeContext = await fixture();
  await writeFile(path.join(probeContext.root, "work/animate/jsfl-cli-probes/run-failed-2/stderr.log"), "tampered");
  await assert.rejects(stageG4L3AnimateFlaCopies(probeContext), /stderr hash is stale/);

  const sourceContext = await fixture();
  await writeFile(path.join(sourceContext.root, "catalog/source-manifest.sha256"), "0".repeat(64) + "  wrong.fla\n");
  await assert.rejects(stageG4L3AnimateFlaCopies(sourceContext), /source freeze manifest binding is missing or stale/);
});

test("rejects output/report escapes and symbolic-link staging paths before copying", async () => {
  const escapeContext = await fixture();
  await assert.rejects(
    stageG4L3AnimateFlaCopies({...escapeContext, outputRoot: path.join(escapeContext.root, "outside")}),
    /output root must be a child/,
  );
  await assert.rejects(
    stageG4L3AnimateFlaCopies({...escapeContext, jsonReport: path.join(escapeContext.root, "migration.json")}),
    /JSON readiness report must be a child/,
  );

  const linkContext = await fixture();
  await mkdir(path.join(linkContext.root, "work", "animate"), {recursive: true});
  await symlink(path.join(linkContext.root, "reports"), linkContext.outputRoot);
  await assert.rejects(stageG4L3AnimateFlaCopies(linkContext), /symbolic-link path component|real directory/);
});

test("implementation has no process-launch dependency", async () => {
  const file = fileURLToPath(new URL("./stage-g4-l3-animate-fla-copies.mjs", import.meta.url));
  const source = await readFile(file, "utf8");
  assert.doesNotMatch(source, /node:child_process|from\s+["']child_process["']|\bspawn\s*\(/u);
  assert.match(source, /launchedByThisCommand: false/u);
  assert.match(source, /migrationStatusReviewApprovalStrictWritesAllowed: false/u);
});

test("Git ignores exactly the work-only G4 L3 staging root, not all Animate evidence", async () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const lines = (await readFile(path.join(projectRoot, ".gitignore"), "utf8")).split(/\r?\n/u);
  assert.equal(lines.filter((line) => line === "work/animate/g4-l3-read-only-fla-copies/").length, 1);
  assert.equal(lines.includes("work/animate/"), false);
  assert.equal(lines.includes("work/animate/jsfl-cli-probes/"), true);
});
