import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildControllerJsfl,
  buildGeneratedAuditScript,
  parseArgs,
  parseProcessTable,
  runProbe,
  sha256,
  validateProbeArtifacts,
} from "./probe-animate-jsfl-cli.mjs";

function pngHeader(width, height) {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png, 0);
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png;
}

async function writeArtifactFixture(runDir, { pngWidth = 550, status = "passed" } = {}) {
  await mkdir(runDir, { recursive: true });
  await writeFile(
    path.join(runDir, "controller-result.json"),
    JSON.stringify({
      status,
      animateVersion: "MAC 21,0,7,42652",
      documentName: "Untitled-1",
      message: status === "passed" ? "blank-document audit completed" : "failed fixture",
    }),
  );
  await writeFile(
    path.join(runDir, "Untitled-1-authoring-audit.json"),
    JSON.stringify({
      evidenceKind: "adobe-animate-authoring-audit",
      animateVersion: "MAC 21,0,7,42652",
      capturedAt: "Tue, 21 Jul 2026 00:00:00 GMT",
      document: {
        name: "Untitled-1",
        pathURI: null,
        width: 550,
        height: 400,
        frameRate: 24,
      },
      timeline: { currentFlashFrame: 1, frameCount: 1 },
    }),
  );
  await writeFile(path.join(runDir, "Untitled-1-frame-1.png"), pngHeader(pngWidth, 400));
}

test("parseArgs accepts explicit probe paths and validates timeout bounds", () => {
  assert.deepEqual(
    parseArgs([
      "--animate-binary",
      "/tmp/Animate",
      "--work-root",
      "/tmp/probes",
      "--timeout-ms",
      "9000",
      "--skip-running-check",
    ]),
    {
      animateBinary: "/tmp/Animate",
      workRoot: "/tmp/probes",
      timeoutMs: 9000,
      skipRunningCheck: true,
    },
  );
  assert.throws(() => parseArgs(["--timeout-ms", "4999"]), /5000 through 300000/);
});

test("buildGeneratedAuditScript redirects exactly one output root", () => {
  const template = '(function () { var OUTPUT_ROOT = "file:///old"; })();\n';
  const generated = buildGeneratedAuditScript(template, "file:///new%20root");
  assert.match(generated, /var OUTPUT_ROOT = "file:\/\/\/new%20root";/);
  assert.doesNotMatch(generated, /file:\/\/\/old/);
  assert.throws(
    () => buildGeneratedAuditScript("var other = 1;", "file:///new"),
    /exactly one OUTPUT_ROOT declaration/,
  );
});

test("controller owns the close-and-quit JSFL lifecycle", () => {
  const controller = buildControllerJsfl({
    auditScriptUri: "file:///audit.jsfl",
    outputRootUri: "file:///output",
    markerUri: "file:///marker.json",
  });
  assert.match(controller, /fl\.createDocument\(\)/);
  assert.match(controller, /fl\.runScript\(auditScriptUri\)/);
  assert.match(controller, /fl\.closeDocument\(document, false\)/);
  assert.match(controller, /fl\.quit\(false\)/);
  assert.doesNotMatch(controller, /saveDocument|document\.save/);
});

test("parseProcessTable matches only the exact Animate executable", () => {
  const binary = "/Applications/Adobe Animate 2021/Animate";
  const output = [
    `  101 ${binary}`,
    `  102 ${binary} --run-jsfl -o /tmp/controller.jsfl`,
    "  103 /Library/AdobeIPCBroker --launchedbyvulcan /Applications/Adobe Animate 2021/Animate",
  ].join("\n");
  assert.deepEqual(parseProcessTable(output, binary).map((entry) => entry.pid), [101, 102]);
});

test("validateProbeArtifacts binds the report and PNG to the blank document", async () => {
  const runDir = await mkdtemp(path.join(os.tmpdir(), "animate-jsfl-probe-artifacts-"));
  await writeArtifactFixture(runDir);
  const evidence = await validateProbeArtifacts(runDir);
  assert.equal(evidence.report.animateVersion, "MAC 21,0,7,42652");
  assert.deepEqual(evidence.report.stage, { width: 550, height: 400 });
  assert.equal(evidence.png.sha256, sha256(pngHeader(550, 400)));
});

test("validateProbeArtifacts rejects a PNG with the wrong stage", async () => {
  const runDir = await mkdtemp(path.join(os.tmpdir(), "animate-jsfl-probe-bad-stage-"));
  await writeArtifactFixture(runDir, { pngWidth: 551 });
  await assert.rejects(validateProbeArtifacts(runDir), /PNG stage mismatch/);
});

test("runProbe uses --run-jsfl -o without --quit and writes hashed evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-jsfl-probe-run-"));
  const fakeAnimate = path.join(root, "fake-animate.mjs");
  const fakeSource = `#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

if (process.argv[2] !== "--run-jsfl" || process.argv[3] !== "-o" || !process.argv[4] || process.argv.includes("--quit")) {
  process.exit(41);
}
const controller = await readFile(process.argv[4], "utf8");
const outputMatch = controller.match(/var outputRootUri = ("[^"]+")/);
const markerMatch = controller.match(/var markerUri = ("[^"]+")/);
if (!outputMatch || !markerMatch) process.exit(42);
const outputRoot = fileURLToPath(JSON.parse(outputMatch[1]));
const marker = fileURLToPath(JSON.parse(markerMatch[1]));
await writeFile(marker, JSON.stringify({status:"passed",animateVersion:"FAKE 1.0",documentName:"Untitled-1",message:"ok"}));
await writeFile(outputRoot + "/Untitled-1-authoring-audit.json", JSON.stringify({
  evidenceKind:"adobe-animate-authoring-audit",
  animateVersion:"FAKE 1.0",
  capturedAt:"Tue, 21 Jul 2026 00:00:00 GMT",
  document:{name:"Untitled-1",pathURI:null,width:550,height:400,frameRate:24},
  timeline:{currentFlashFrame:1,frameCount:1}
}));
const png = Buffer.alloc(24);
Buffer.from("89504e470d0a1a0a", "hex").copy(png, 0);
png.writeUInt32BE(550, 16);
png.writeUInt32BE(400, 20);
await writeFile(outputRoot + "/Untitled-1-frame-1.png", png);
`;
  await writeFile(fakeAnimate, fakeSource);
  await chmod(fakeAnimate, 0o755);

  const result = await runProbe({
    animateBinary: fakeAnimate,
    workRoot: path.join(root, "runs"),
    timeoutMs: 5_000,
    skipRunningCheck: true,
  });
  assert.equal(result.status, "passed");
  assert.deepEqual(result.command.args.slice(0, 2), ["--run-jsfl", "-o"]);
  assert.equal(result.command.args.includes("--quit"), false);
  assert.equal(result.artifacts.report.animateVersion, "FAKE 1.0");
  const stored = JSON.parse(await readFile(result.resultPath, "utf8"));
  assert.equal(stored.status, "passed");
  assert.match(stored.artifacts.png.sha256, /^[a-f0-9]{64}$/);
});
