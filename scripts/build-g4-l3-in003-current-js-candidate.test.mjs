import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  generateG4L3In003CurrentJsCandidate,
  parseArguments,
} from "./build-g4-l3-in003-current-js-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(
  ROOT,
  "reports/g4-l3-in003-current-javascript-candidate.json",
);
const MANIFEST = path.join(
  ROOT,
  "public/flash-assets/courses/course-g04-l03-in-003/manifest.json",
);
const RUNTIME = path.join(
  ROOT,
  "public/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js",
);

test("IN003 candidate CLI is explicit and rejects unknown arguments", () => {
  assert.deepEqual(parseArguments(["--check"], {root: ROOT}), {
    check: true,
    ffdec: "ffdec",
    python: "python3",
    swfmill: "swfmill",
    root: ROOT,
  });
  assert.equal(
    parseArguments(["--ffdec", "/opt/tools/ffdec"], {root: ROOT}).ffdec,
    "/opt/tools/ffdec",
  );
  assert.throws(() => parseArguments(["--python"], {root: ROOT}), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"], {root: ROOT}), /Unknown argument/);
});

test("IN003 checked-in outputs reproduce from fresh hash-bound source extraction", async () => {
  const result = await generateG4L3In003CurrentJsCandidate({check: true});
  assert.equal(result.animationId, "course-g04-l03-in-003");
  assert.equal(result.outputScript.bytes, 2_283_733);
  assert.equal(
    result.outputScript.sha256,
    "e88b494315788ea3d1682d399b882651766a4a9764dbe20ba36fe51b0c1e94b7",
  );
  assert.equal(result.frameDomain.timelineId, "sprite-84");
  assert.equal(result.frameDomain.frameCount, 472);
  assert.equal(result.status.prototypeRegistryOnly, true);
  assert.equal(result.status.publicLibraryAdmitted, false);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.ok(Object.values(result.acceptance).every((value) => value === false));
});

test("IN003 manifest and report keep safety and acceptance boundaries fail-closed", async () => {
  const [report, manifest, runtime] = await Promise.all([
    readFile(REPORT, "utf8").then(JSON.parse),
    readFile(MANIFEST, "utf8").then(JSON.parse),
    readFile(RUNTIME, "utf8"),
  ]);
  assert.equal(report.reportType, "current-javascript-engineering-candidate");
  assert.equal(report.disposition.currentJavaScriptCandidate, true);
  assert.equal(report.disposition.migrationScaffoldCreated, false);
  assert.equal(report.disposition.strictLedgerChanged, false);
  assert.equal(report.disposition.publicLibraryAdmitted, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.timeline.root.renderable, false);
  assert.equal(report.timeline.local.timelineId, "sprite-84");
  assert.equal(report.timeline.local.language, "en");
  assert.equal(report.evidence.embeddedAudio.rendered, false);
  assert.equal(report.evidence.embeddedAudio.accepted, false);
  assert.equal(report.evidence.associatedSpanishAudio.rendered, false);
  assert.equal(report.evidence.associatedSpanishAudio.listeningAccepted, false);

  assert.equal(
    manifest.status,
    "source-static-current-javascript-engineering-candidate-only",
  );
  assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.safety.audioRendered, false);
  assert.ok(Object.values(manifest.acceptance).every((value) => value === false));
  assert.equal(manifest.strictAcceptanceEffect, "none");

  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.match(runtime, /unsupported source-proven language/);
  assert.match(runtime, /HELP_MATH_CANVAS_ASSETS/);
});

