#!/usr/bin/env node

import { spawn, execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants, createReadStream } from "node:fs";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const DEFAULT_WORK_ROOT = path.join(ROOT, "work", "animate", "jsfl-cli-probes");
const AUDIT_SCRIPT = path.join(ROOT, "scripts", "animate-audit-current-document.jsfl");
const OUTPUT_ROOT_PATTERN = /var OUTPUT_ROOT = "[^"]+";/;
const execFile = promisify(execFileCallback);

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {
    animateBinary: DEFAULT_ANIMATE_BINARY,
    workRoot: DEFAULT_WORK_ROOT,
    timeoutMs: 60_000,
    skipRunningCheck: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--animate-binary") {
      options.animateBinary = path.resolve(argv[++index] || fail("--animate-binary requires a path"));
    } else if (value === "--work-root") {
      options.workRoot = path.resolve(argv[++index] || fail("--work-root requires a path"));
    } else if (value === "--timeout-ms") {
      const timeoutMs = Number(argv[++index]);
      if (!Number.isInteger(timeoutMs) || timeoutMs < 5_000 || timeoutMs > 300_000) {
        fail("--timeout-ms must be an integer from 5000 through 300000");
      }
      options.timeoutMs = timeoutMs;
    } else if (value === "--skip-running-check") {
      options.skipRunningCheck = true;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else {
      fail(`Unknown option: ${value}`);
    }
  }

  return options;
}

function help() {
  return [
    "Usage: node scripts/probe-animate-jsfl-cli.mjs [options]",
    "",
    "Cold-starts Adobe Animate, creates a disposable blank document, runs the",
    "project authoring-audit JSFL, closes without saving, and verifies hashed",
    "JSON/PNG output. It never opens or writes a file under source-assets/.",
    "",
    "Options:",
    `  --animate-binary <path>  Animate executable (default: ${DEFAULT_ANIMATE_BINARY})`,
    `  --work-root <path>       Unique probe-run parent (default: ${DEFAULT_WORK_ROOT})`,
    "  --timeout-ms <ms>        5000-300000 (default: 60000)",
    "  --skip-running-check     Advanced/test-only; do not require a cold start",
    "  -h, --help               Show this help",
    "",
    "Animate 2021 macOS requires: --run-jsfl -o <controller.jsfl>",
    "Do not add --quit: that exits before the JSFL is processed. The controller",
    "closes its disposable document without saving and calls fl.quit(false).",
  ].join("\n");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(file) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function jsflString(value) {
  return JSON.stringify(String(value));
}

function buildGeneratedAuditScript(template, outputRootUri) {
  const matches = template.match(new RegExp(OUTPUT_ROOT_PATTERN.source, "g")) || [];
  if (matches.length !== 1) {
    fail(`Expected exactly one OUTPUT_ROOT declaration in the audit JSFL; found ${matches.length}`);
  }
  return template.replace(
    OUTPUT_ROOT_PATTERN,
    `var OUTPUT_ROOT = ${jsflString(outputRootUri)};`,
  );
}

function buildControllerJsfl({ auditScriptUri, outputRootUri, markerUri }) {
  return String.raw`(function () {
  var auditScriptUri = ${jsflString(auditScriptUri)};
  var outputRootUri = ${jsflString(outputRootUri)};
  var markerUri = ${jsflString(markerUri)};
  var document = null;

  function safeName(value) {
    return String(value || "untitled").replace(/[^A-Za-z0-9._-]+/g, "-");
  }

  function escapeJSON(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  function writeMarker(status, documentName, message) {
    var payload = "{\"status\":\"" + escapeJSON(status) +
      "\",\"animateVersion\":\"" + escapeJSON(fl.version) +
      "\",\"documentName\":\"" + escapeJSON(documentName || "") +
      "\",\"message\":\"" + escapeJSON(message || "") + "\"}";
    FLfile.write(markerUri, payload);
  }

  try {
    document = fl.createDocument();
    if (!document) {
      throw new Error("fl.createDocument returned no document");
    }
    fl.runScript(auditScriptUri);
    var reportUri = outputRootUri + "/" + safeName(document.name) + "-authoring-audit.json";
    if (!FLfile.exists(reportUri)) {
      throw new Error("Audit JSFL did not create " + reportUri);
    }
    writeMarker("passed", document.name, "blank-document audit completed");
  } catch (error) {
    writeMarker(
      "failed",
      document ? document.name : "",
      String(error && error.message ? error.message : error)
    );
  }

  if (document) {
    fl.closeDocument(document, false);
  }
  fl.quit(false);
})();
`;
}

function parseProcessTable(output, animateBinary) {
  const prefix = `${animateBinary}`;
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      return match ? { pid: Number(match[1]), command: match[2] } : null;
    })
    .filter((entry) => entry && (entry.command === prefix || entry.command.startsWith(`${prefix} `)));
}

async function findRunningAnimate(animateBinary) {
  const { stdout } = await execFile("ps", ["-axo", "pid=,command="]);
  return parseProcessTable(stdout, animateBinary);
}

function runChild(binary, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    let killTimer = null;
    let settled = false;

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
    }, timeoutMs);

    child.on("exit", (code, signal) => {
      // Animate-launched Adobe helper processes can inherit the stdout/stderr
      // descriptors after the Animate process exits, so Node's `close` event
      // may never arrive. Give the pipes a short flush window, then bind the
      // result to the foreground Animate process's `exit` event.
      setTimeout(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (killTimer) clearTimeout(killTimer);
        child.stdout.destroy();
        child.stderr.destroy();
        resolve({
          code,
          signal,
          timedOut,
          durationMs: Date.now() - startedAt,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
        });
      }, 250);
    });
  });
}

function relativeOrAbsolute(file, root = ROOT) {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : file;
}

async function validateProbeArtifacts(runDir) {
  const markerPath = path.join(runDir, "controller-result.json");
  const markerBytes = await readFile(markerPath);
  const marker = JSON.parse(markerBytes.toString("utf8"));
  if (marker.status !== "passed") {
    fail(`Animate controller reported ${marker.status}: ${marker.message || "no message"}`);
  }
  if (!marker.documentName) fail("Animate controller did not report a document name");
  if (!marker.animateVersion) fail("Animate controller did not report its version");

  const safeDocumentName = marker.documentName.replace(/[^A-Za-z0-9._-]+/g, "-");
  const reportPath = path.join(runDir, `${safeDocumentName}-authoring-audit.json`);
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8"));
  if (report.evidenceKind !== "adobe-animate-authoring-audit") {
    fail(`Unexpected audit evidenceKind: ${report.evidenceKind}`);
  }
  if (report.animateVersion !== marker.animateVersion) {
    fail(`Animate version mismatch (${report.animateVersion} != ${marker.animateVersion})`);
  }
  if (report.document?.name !== marker.documentName || report.document?.pathURI != null) {
    fail("Probe audit is not bound to the disposable unsaved document");
  }

  const frame = report.timeline?.currentFlashFrame;
  if (!Number.isInteger(frame) || frame < 1 || frame > report.timeline?.frameCount) {
    fail(`Invalid currentFlashFrame: ${frame}`);
  }
  const pngPath = path.join(runDir, `${safeDocumentName}-frame-${frame}.png`);
  const png = await readFile(pngPath);
  if (png.length < 24 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${path.basename(pngPath)} is not a decodable PNG header`);
  }
  const pngWidth = png.readUInt32BE(16);
  const pngHeight = png.readUInt32BE(20);
  if (pngWidth !== report.document?.width || pngHeight !== report.document?.height) {
    fail(
      `PNG stage mismatch (${pngWidth}x${pngHeight} != ${report.document?.width}x${report.document?.height})`,
    );
  }

  return {
    marker: {
      file: relativeOrAbsolute(markerPath),
      sha256: sha256(markerBytes),
    },
    report: {
      file: relativeOrAbsolute(reportPath),
      sha256: sha256(reportBytes),
      capturedAt: report.capturedAt,
      animateVersion: report.animateVersion,
      documentName: report.document.name,
      stage: { width: report.document.width, height: report.document.height },
      fps: report.document.frameRate,
      frameCount: report.timeline.frameCount,
    },
    png: {
      file: relativeOrAbsolute(pngPath),
      sha256: sha256(png),
      width: pngWidth,
      height: pngHeight,
    },
  };
}

async function runProbe(options) {
  await access(options.animateBinary, fsConstants.X_OK);
  await access(AUDIT_SCRIPT, fsConstants.R_OK);

  if (!options.skipRunningCheck) {
    const running = await findRunningAnimate(options.animateBinary);
    if (running.length > 0) {
      fail(
        `Adobe Animate is already running (${running.map((entry) => entry.pid).join(", ")}); ` +
          "quit it before a cold-start JSFL probe",
      );
    }
  }

  await mkdir(options.workRoot, { recursive: true });
  const runDir = await mkdtemp(path.join(options.workRoot, "run-"));
  const outputRootUri = pathToFileURL(runDir).href;
  const templateBytes = await readFile(AUDIT_SCRIPT);
  const generatedAudit = buildGeneratedAuditScript(templateBytes.toString("utf8"), outputRootUri);
  const generatedAuditPath = path.join(runDir, "animate-audit-current-document.generated.jsfl");
  const controllerPath = path.join(runDir, "controller.jsfl");
  const markerPath = path.join(runDir, "controller-result.json");
  const controller = buildControllerJsfl({
    auditScriptUri: pathToFileURL(generatedAuditPath).href,
    outputRootUri,
    markerUri: pathToFileURL(markerPath).href,
  });
  await writeFile(generatedAuditPath, generatedAudit);
  await writeFile(controllerPath, controller);

  const args = ["--run-jsfl", "-o", controllerPath];
  let processResult = null;
  let artifactEvidence = null;
  let failure = null;
  try {
    processResult = await runChild(options.animateBinary, args, options.timeoutMs);
    await writeFile(path.join(runDir, "stdout.log"), processResult.stdout);
    await writeFile(path.join(runDir, "stderr.log"), processResult.stderr);
    if (processResult.timedOut) fail(`Animate JSFL probe timed out after ${options.timeoutMs} ms`);
    if (processResult.code !== 0) {
      fail(`Animate exited with code ${processResult.code}${processResult.signal ? ` (${processResult.signal})` : ""}`);
    }
    artifactEvidence = await validateProbeArtifacts(runDir);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  const stdoutPath = path.join(runDir, "stdout.log");
  const stderrPath = path.join(runDir, "stderr.log");
  const result = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-jsfl-cli-probe",
    status: failure ? "failed" : "passed",
    scope: "disposable-blank-document",
    limitations: [
      "This proves cold-start JSFL execution and the authoring-audit script on a generated blank document only.",
      "It does not prove that a legacy HELP Math FLA can open unattended; legacy ActionScript conversion dialogs can require a human acknowledgement.",
      "It does not establish runtime, localization, interaction, audio, or visual fidelity for any migration.",
    ],
    command: {
      executable: options.animateBinary,
      executableSha256: await sha256File(options.animateBinary),
      args: ["--run-jsfl", "-o", relativeOrAbsolute(controllerPath)],
      intentionallyOmitsQuitFlag: true,
    },
    scripts: {
      auditTemplate: {
        file: relativeOrAbsolute(AUDIT_SCRIPT),
        sha256: sha256(templateBytes),
      },
      generatedAudit: {
        file: relativeOrAbsolute(generatedAuditPath),
        sha256: sha256(generatedAudit),
      },
      controller: {
        file: relativeOrAbsolute(controllerPath),
        sha256: sha256(controller),
      },
    },
    process: processResult
      ? {
          exitCode: processResult.code,
          signal: processResult.signal,
          timedOut: processResult.timedOut,
          durationMs: processResult.durationMs,
          stdout: {
            file: relativeOrAbsolute(stdoutPath),
            sha256: sha256(processResult.stdout),
          },
          stderr: {
            file: relativeOrAbsolute(stderrPath),
            sha256: sha256(processResult.stderr),
          },
        }
      : null,
    artifacts: artifactEvidence,
    failure,
  };
  const resultPath = path.join(runDir, "probe-result.json");
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);

  if (failure) {
    const error = new Error(`${failure}; evidence: ${relativeOrAbsolute(resultPath)}`);
    error.resultPath = resultPath;
    throw error;
  }
  return { ...result, resultPath };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await runProbe(options);
  console.log(
    JSON.stringify(
      {
        status: result.status,
        animateVersion: result.artifacts.report.animateVersion,
        reportSha256: result.artifacts.report.sha256,
        pngSha256: result.artifacts.png.sha256,
        result: relativeOrAbsolute(result.resultPath),
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  buildControllerJsfl,
  buildGeneratedAuditScript,
  parseArgs,
  parseProcessTable,
  runProbe,
  sha256,
  validateProbeArtifacts,
};
