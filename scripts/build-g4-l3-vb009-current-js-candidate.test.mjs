import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  generateG4L3Vb009CurrentJsCandidate,
  parseArguments,
} from "./build-g4-l3-vb009-current-js-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(
  ROOT,
  "reports/g4-l3-vb009-current-javascript-candidate.json",
);
const MANIFEST = path.join(
  ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-009/manifest.json",
);
const RUNTIME = path.join(
  ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-009/canvas-renderer.js",
);

test("VB009 candidate CLI is explicit and fail-closed", () => {
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
  assert.throws(
    () => parseArguments(["--accept"], {root: ROOT}),
    /Unknown argument/,
  );
});

test("VB009 checked-in outputs reproduce from fresh hash-bound extraction", async () => {
  const result = await generateG4L3Vb009CurrentJsCandidate({check: true});
  assert.equal(result.animationId, "course-g04-l03-vb-009");
  assert.equal(result.outputScript.bytes, 667_359);
  assert.equal(
    result.outputScript.sha256,
    "d2a45c952b9c33b630d4ab319c8d6f901ac0c685592540c21d427416aa627da9",
  );
  assert.equal(result.frameDomain.timelineId, "sprite-24");
  assert.equal(result.frameDomain.frameCount, 175);
  assert.equal(result.status.prototypeRegistryOnly, true);
  assert.equal(result.status.publicLibraryAdmitted, false);
  assert.equal(result.status.productionAdmission, false);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.ok(Object.values(result.acceptance).every((value) => value === false));
});

test("VB009 manifest and report keep behavior and every authority gate closed", async () => {
  const [report, manifest, runtime] = await Promise.all([
    readFile(REPORT, "utf8").then(JSON.parse),
    readFile(MANIFEST, "utf8").then(JSON.parse),
    readFile(RUNTIME, "utf8"),
  ]);
  assert.equal(report.reportType, "current-javascript-engineering-candidate");
  assert.equal(report.disposition.currentJavaScriptCandidate, true);
  assert.equal(report.disposition.prototypeRegistryOnly, true);
  assert.equal(report.disposition.migrationScaffoldCreated, false);
  assert.equal(report.disposition.strictLedgerChanged, false);
  assert.equal(report.disposition.publicLibraryAdmitted, false);
  assert.equal(report.disposition.productionAdmission, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.timeline.root.renderable, false);
  assert.equal(report.timeline.local.timelineId, "sprite-24");
  assert.equal(report.timeline.local.frameCount, 175);
  assert.equal(report.timeline.companion.timelineId, "sprite-5");
  assert.equal(report.timeline.companion.renderable, false);
  assert.equal(report.evidence.interaction.renderedAsControls, false);
  assert.equal(report.evidence.interaction.pointerEventsEnabled, false);
  assert.equal(report.evidence.interaction.legacyActionScriptExecuted, false);
  assert.deepEqual(
    report.evidence.interaction.sourceButtons.map((button) => button.keyAttribute),
    ["Pattern", "Symbol", "Set", "Rule"],
  );
  assert.equal(report.evidence.embeddedAudio.rendered, false);
  assert.equal(report.evidence.embeddedAudio.accepted, false);
  assert.equal(report.evidence.associatedCatalogAudio.rendered, false);
  assert.equal(report.evidence.associatedCatalogAudio.listeningAccepted, false);

  assert.equal(
    manifest.status,
    "source-static-current-javascript-engineering-candidate-only",
  );
  assert.equal(manifest.sourcePreaudit.formalMigrationAuthorized, false);
  assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.safety.interactiveControlsEnabled, false);
  assert.equal(manifest.safety.audioRendered, false);
  assert.ok(Object.values(manifest.acceptance).every((value) => value === false));
  assert.equal(manifest.strictAcceptanceEffect, "none");

  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(
    runtime,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
  );
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(runtime, /DoHyperLinks|KeyAttribute|InternalPreloader/);
  assert.match(runtime, /unsupported source-proven language/);
  assert.match(runtime, /HELP_MATH_CANVAS_ASSETS/);
});
