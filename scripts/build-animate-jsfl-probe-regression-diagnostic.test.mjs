import assert from "node:assert/strict";
import {chmod, mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {
  buildDiagnostic,
  normalizeController,
  normalizeGeneratedAudit,
  parseArguments,
  renderMarkdown,
  sha256,
  stderrSignals,
  writeOrCheck,
} from "./build-animate-jsfl-probe-regression-diagnostic.mjs";
import {
  buildControllerJsfl,
  buildGeneratedAuditScript,
} from "./probe-animate-jsfl-cli.mjs";

async function put(root, relative, bytes, mode) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

function pngHeader(width, height) {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png, 0);
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png;
}

function ref(file, bytes) {
  return {file, sha256: sha256(bytes)};
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-jsfl-regression-"));
  const animateBytes = Buffer.from("fake animate executable");
  const animateBinary = await put(root, "Applications/Animate", animateBytes, 0o755);
  const infoPlist = await put(root, "Applications/Info.plist", Buffer.from([
    "<plist><dict>",
    "<key>CFBundleShortVersionString</key><string>21.0.7</string>",
    "<key>Adobe Product Build</key><string>21.0.7.42652</string>",
    "</dict></plist>",
  ].join("")));
  const runnerBytes = Buffer.from("probe runner fixture");
  await put(root, "scripts/probe-animate-jsfl-cli.mjs", runnerBytes);
  const auditTemplateBytes = Buffer.from('(function () {\n  var OUTPUT_ROOT = "file:///old";\n})();\n');
  await put(root, "scripts/animate-audit-current-document.jsfl", auditTemplateBytes);
  await put(root, "catalog/toolchain.json", Buffer.from(`${JSON.stringify({
    authoringEvidence: {adobeAnimateDetected: true, productVersion: "21.0.7"},
  })}\n`));

  async function createRun({name, status, timeoutMs}) {
    const runRelative = `work/animate/jsfl-cli-probes/${name}`;
    const runDir = path.join(root, runRelative);
    await mkdir(runDir, {recursive: true});
    const outputRootUri = pathToFileURL(runDir).href;
    const generatedRelative = `${runRelative}/animate-audit-current-document.generated.jsfl`;
    const controllerRelative = `${runRelative}/controller.jsfl`;
    const markerRelative = `${runRelative}/controller-result.json`;
    const generatedFile = path.join(root, generatedRelative);
    const controllerFile = path.join(root, controllerRelative);
    const generatedBytes = Buffer.from(buildGeneratedAuditScript(auditTemplateBytes.toString("utf8"), outputRootUri));
    const controllerBytes = Buffer.from(buildControllerJsfl({
      auditScriptUri: pathToFileURL(generatedFile).href,
      outputRootUri,
      markerUri: pathToFileURL(path.join(root, markerRelative)).href,
    }));
    await put(root, generatedRelative, generatedBytes);
    await put(root, controllerRelative, controllerBytes);
    const stdoutBytes = Buffer.alloc(0);
    const stderrBytes = Buffer.from([
      "objc[123]: Class Example is implemented in both A and B.",
      "AdobeCrashReporterInitialize: executionTime = 0.01 seconds",
      "AdobeCRDaemon CR dialog Preference for force quit 1",
      "CoreText failed to get font asset: 0 - (null)",
      "AdobeCRDaemon exitStatus: 0",
    ].join("\n"));
    const stdoutRelative = `${runRelative}/stdout.log`;
    const stderrRelative = `${runRelative}/stderr.log`;
    await put(root, stdoutRelative, stdoutBytes);
    await put(root, stderrRelative, stderrBytes);
    const receipt = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-jsfl-cli-probe",
      status,
      scope: "disposable-blank-document",
      command: {
        executable: animateBinary,
        executableSha256: sha256(animateBytes),
        args: ["--run-jsfl", "-o", controllerRelative],
        intentionallyOmitsQuitFlag: true,
      },
      scripts: {
        auditTemplate: ref("scripts/animate-audit-current-document.jsfl", auditTemplateBytes),
        generatedAudit: ref(generatedRelative, generatedBytes),
        controller: ref(controllerRelative, controllerBytes),
      },
      process: {
        exitCode: status === "passed" ? 0 : null,
        signal: status === "passed" ? null : "SIGTERM",
        timedOut: status !== "passed",
        durationMs: status === "passed" ? 23_469 : timeoutMs,
        stdout: ref(stdoutRelative, stdoutBytes),
        stderr: ref(stderrRelative, stderrBytes),
      },
      artifacts: null,
      failure: status === "passed" ? null : `Animate JSFL probe timed out after ${timeoutMs} ms`,
    };
    if (status === "passed") {
      const markerBytes = Buffer.from(JSON.stringify({
        status: "passed",
        animateVersion: "MAC 21,0,7,42652",
        documentName: "Untitled-1",
        message: "blank-document audit completed",
      }));
      const reportBytes = Buffer.from(JSON.stringify({
        evidenceKind: "adobe-animate-authoring-audit",
        animateVersion: "MAC 21,0,7,42652",
        capturedAt: "Wed, 22 Jul 2026 07:09:08 GMT",
        document: {name: "Untitled-1", pathURI: null, width: 550, height: 400, frameRate: 24},
        timeline: {currentFlashFrame: 1, frameCount: 1},
      }));
      const pngBytes = pngHeader(550, 400);
      const reportRelative = `${runRelative}/Untitled-1-authoring-audit.json`;
      const pngRelative = `${runRelative}/Untitled-1-frame-1.png`;
      await put(root, markerRelative, markerBytes);
      await put(root, reportRelative, reportBytes);
      await put(root, pngRelative, pngBytes);
      receipt.artifacts = {
        marker: ref(markerRelative, markerBytes),
        report: {...ref(reportRelative, reportBytes), capturedAt: "Wed, 22 Jul 2026 07:09:08 GMT"},
        png: {...ref(pngRelative, pngBytes), width: 550, height: 400},
      };
    }
    const receiptRelative = `${runRelative}/probe-result.json`;
    await put(root, receiptRelative, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`));
    return {receiptRelative, controllerRelative};
  }

  const historical = await createRun({name: "run-pass", status: "passed"});
  const failed60 = await createRun({name: "run-failed-60", status: "failed", timeoutMs: 60_000});
  const failed120 = await createRun({name: "run-failed-120", status: "failed", timeoutMs: 120_000});
  return {
    root,
    animateBinary,
    infoPlist,
    historicalReceipt: historical.receiptRelative,
    failedReceipts: [failed60.receiptRelative, failed120.receiptRelative],
    failedController: failed120.controllerRelative,
  };
}

test("normalizers remove only per-run URI declarations", () => {
  const auditA = '(function(){ var OUTPUT_ROOT = "file:///run-a"; })();';
  const auditB = '(function(){ var OUTPUT_ROOT = "file:///run-b"; })();';
  assert.equal(normalizeGeneratedAudit(auditA), normalizeGeneratedAudit(auditB));
  const controllerA = [
    '(function () {',
    'var auditScriptUri = "file:///a/audit.jsfl";',
    'var outputRootUri = "file:///a";',
    'var markerUri = "file:///a/marker.json";',
    '})();',
  ].join("\n");
  const controllerB = controllerA.replaceAll("file:///a", "file:///b");
  assert.equal(normalizeController(controllerA), normalizeController(controllerB));
  assert.throws(() => normalizeGeneratedAudit("var x = 1;"), /0 OUTPUT_ROOT declarations/);
});

test("buildDiagnostic binds the pass and both no-artifact timeouts and fails readiness closed", async () => {
  const context = await fixture();
  const report = await buildDiagnostic(context);
  assert.equal(report.runs.historicalPass.status, "passed");
  assert.equal(report.runs.currentFailures.length, 2);
  assert.deepEqual(report.runs.currentFailures.map((run) => run.process.durationMs), [60_000, 120_000]);
  assert.equal(report.comparison.runDirectoryNormalizedGeneratedAuditSame, true);
  assert.equal(report.comparison.runDirectoryNormalizedControllerSame, true);
  assert.equal(report.comparison.currentGeneratorExactlyReproducesAllControllers, true);
  assert.equal(report.comparison.commonAnimateStartupSignalsAcrossAllStderrLogs, true);
  assert.equal(report.comparison.controllerOrJsflErrorAbsentAcrossAllStderrLogs, true);
  assert.equal(report.comparison.historicalOnlyIllegalReflectiveAccessWarningObserved, false);
  assert.equal(report.comparison.deterministicRepositoryCodeDefectProven, false);
  assert.equal(report.executionReadiness.currentUnattendedDisposableDocumentJsflReady, false);
  assert.equal(report.executionReadiness.batchAnimateAuditMayProceed, false);
  assert.equal(report.executionReadiness.retryAutomatically, false);
  assert.equal(report.acceptance.strictAcceptanceEffect, false);
  assert.match(renderMarkdown(report), /Current unattended disposable-document JSFL readiness: \*\*false\*\*/u);
});

test("buildDiagnostic rejects stale generated/controller evidence", async () => {
  const context = await fixture();
  await writeFile(path.join(context.root, context.failedController), "tampered");
  await assert.rejects(buildDiagnostic(context), /controller hash is stale/);
});

test("writeOrCheck detects stale reports without changing readiness", async () => {
  const context = await fixture();
  const report = await buildDiagnostic(context);
  const jsonFile = path.join(context.root, "reports", "diagnostic.json");
  const markdownFile = path.join(context.root, "reports", "diagnostic.md");
  await mkdir(path.dirname(jsonFile), {recursive: true});
  await writeOrCheck({report, jsonFile, markdownFile, check: false});
  await writeOrCheck({report, jsonFile, markdownFile, check: true});
  await writeFile(markdownFile, "stale\n");
  await assert.rejects(writeOrCheck({report, jsonFile, markdownFile, check: true}), /is stale/);
  assert.equal(JSON.parse(await readFile(jsonFile, "utf8")).executionReadiness.currentUnattendedDisposableDocumentJsflReady, false);
});

test("CLI has only report/check controls and stderr parsing does not invent a cause", () => {
  assert.deepEqual(parseArguments(["--check", "--json", "/tmp/a.json", "--markdown", "/tmp/a.md"]), {
    check: true,
    json: "/tmp/a.json",
    markdown: "/tmp/a.md",
  });
  for (const forbidden of ["--launch", "--click", "--kill", "--approve", "--strict"] ) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/);
  }
  const signals = stderrSignals([
    "AdobeCrashReporterInitialize: ok",
    "AdobeCRDaemon exitStatus: 0",
    "CoreText failed to get font asset",
  ].join("\n"));
  assert.equal(signals.crashReporterInitialized, true);
  assert.equal(signals.crashDaemonExitStatusZeroObserved, true);
  assert.equal(signals.controllerOrJsflErrorObserved, false);
});
