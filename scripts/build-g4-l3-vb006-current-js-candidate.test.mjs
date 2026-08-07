import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  generateG4L3Vb006CurrentJsCandidate,
  parseArguments,
  validateG4L3Vb006CurrentJsCandidate,
  validateVb006HotspotEvidence,
} from "./build-g4-l3-vb006-current-js-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT,
  "reports/g4-l3-vb006-current-javascript-candidate.json");
const MANIFEST = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-006/manifest.json");
const RUNTIME = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-006/canvas-renderer.js");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

test("VB006 candidate CLI keeps the write/tool surface explicit", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    ffmpeg: "ffmpeg",
    ffprobe: "ffprobe",
  });
  assert.equal(parseArguments(["--ffdec", "/opt/homebrew/bin/ffdec"]).ffdec,
    "/opt/homebrew/bin/ffdec");
  assert.throws(() => parseArguments(["--python"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("VB006 checked-in report is fingerprinted and semantically fail-closed", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  assert.equal(validateG4L3Vb006CurrentJsCandidate(report), report);
  assert.equal(report.disposition.currentJavaScriptCandidate, true);
  assert.equal(report.disposition.candidateRenderabilityOnly, true);
  assert.equal(report.disposition.prototypeRegistryOnly, true);
  assert.ok(Object.values(report.authorization).every((value) => value === false));
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.writeScope.protectedBefore.critical.files.some(
    (entry) => entry.path === "catalog/completion-ledger.json"), false);
  assert.equal(
    report.writeScope.protectedBefore.migrationMutationGuard.comparisonMode,
    "transient-exact-before-after-sha256-v1",
  );
  assert.equal(
    report.writeScope.protectedBefore.migrationMutationGuard
      .exactSnapshotSerialized,
    false,
  );
  assert.equal("migrations" in report.writeScope.protectedBefore, false);

  const promoted = structuredClone(report);
  promoted.authorization.audioEnablementAuthorized = true;
  const projection = {...promoted};
  delete projection.reportFingerprintSha256;
  promoted.reportFingerprintSha256 = sha256(stableJson(projection));
  assert.throws(() => validateG4L3Vb006CurrentJsCandidate(promoted),
    /authorization fields must all remain false/);

  const accepted = structuredClone(report);
  accepted.acceptance.ownerAccepted = true;
  const acceptedProjection = {...accepted};
  delete acceptedProjection.reportFingerprintSha256;
  accepted.reportFingerprintSha256 = sha256(stableJson(acceptedProjection));
  assert.throws(() => validateG4L3Vb006CurrentJsCandidate(accepted),
    /acceptance fields must all remain false/);
});

test("VB006 report records all four exact hit-only glossary placements", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  assert.equal(validateVb006HotspotEvidence(report.hotspotEvidence),
    report.hotspotEvidence);
  assert.deepEqual(report.hotspotEvidence.hotspots.map((hotspot) => ({
    characterId: hotspot.characterId,
    keyAttribute: hotspot.keyAttribute,
    first: hotspot.frameInterval.first,
    last: hotspot.frameInterval.lastInclusive,
    depth: hotspot.placement.depth,
    shape: hotspot.hitState.shapeObjectId,
    visible: Object.values(hotspot.hitState.visibleStates).some(Boolean),
    enabled: hotspot.pointerEventsEnabledByCandidate,
  })), [
    {characterId: 11, keyAttribute: "Zero", first: 1, last: 163, depth: 5, shape: 10, visible: false, enabled: false},
    {characterId: 12, keyAttribute: "Value", first: 1, last: 163, depth: 7, shape: 10, visible: false, enabled: false},
    {characterId: 42, keyAttribute: "Positive number", first: 116, last: 163, depth: 67, shape: 10, visible: false, enabled: false},
    {characterId: 43, keyAttribute: "Negative number", first: 116, last: 163, depth: 69, shape: 10, visible: false, enabled: false},
  ]);
});

test("VB006 browser evidence executes all 163 source-static frames without parity claims", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  const evidence = report.candidateRenderability;
  assert.equal(evidence.executedFrameCount, 163);
  assert.equal(evidence.pngEncodedFrameCount, 163);
  assert.deepEqual(evidence.frames.map((entry) => entry.frame),
    Array.from({length: 163}, (_, index) => index + 1));
  assert.equal(evidence.frameManifestSha256, sha256(stableJson(evidence.frames)));
  assert.deepEqual(evidence.negativeProbes.map(({name, blocked}) => [name, blocked]), [
    ["spanish", true],
    ["root", true],
    ["sprite-5", true],
    ["audio", true],
    ["replay", true],
    ["out-of-range", true],
  ]);
  assert.equal(evidence.originalRuntimeBaselineUsed, false);
  assert.equal(evidence.rmseComputed, false);
  assert.equal(evidence.visualParityClaimed, false);
  assert.equal(evidence.behaviorParityClaimed, false);
});

test("VB006 manifest binds runtime, tools, source, scope, and disabled behavior", async () => {
  const [report, manifest, runtimeBytes] = await Promise.all([
    readFile(REPORT, "utf8").then(JSON.parse),
    readFile(MANIFEST, "utf8").then(JSON.parse),
    readFile(RUNTIME),
  ]);
  const manifestBytes = await readFile(MANIFEST);
  assert.equal(sha256(runtimeBytes), report.outputs.canvasRuntime.sha256);
  assert.equal(runtimeBytes.length, report.outputs.canvasRuntime.bytes);
  assert.equal(sha256(manifestBytes), report.outputs.canvasManifest.sha256);
  assert.equal(manifestBytes.length, report.outputs.canvasManifest.bytes);
  assert.equal(manifest.source.swf.sha256,
    "e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168");
  assert.equal(manifest.runtime.boundedScope.frameDomain, "sprite-44");
  assert.deepEqual(manifest.runtime.boundedScope.frames, {first: 1, lastInclusive: 163});
  assert.equal(manifest.runtime.blocked.root, true);
  assert.equal(manifest.runtime.blocked["sprite-5"], true);
  assert.equal(manifest.runtime.blocked.spanish, true);
  assert.equal(manifest.runtime.blocked.audio, true);
  assert.equal(manifest.runtime.blocked.replayParity, true);
  assert.equal(manifest.runtime.blocked.hostActionScript, true);
  assert.equal(manifest.safety.pointerEventsEnabled, false);
  assert.equal(manifest.safety.audioRendered, false);
  assert.ok(Object.values(manifest.authorization).every((value) => value === false));
  assert.ok(Object.values(manifest.acceptance).every((value) => value === false));
  assert.equal(manifest.writeScope.verifiedAfterWrite, true);
  assert.equal(manifest.writeScope.protectedBefore.combinedManifestSha256,
    manifest.writeScope.protectedAfter.combinedManifestSha256);

  const runtime = runtimeBytes.toString("utf8");
  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(runtime, /\b(?:addEventListener|removeEventListener)\s*\(/);
  assert.match(runtime, /unsupported source-proven language/);
  assert.match(runtime, /HELP_MATH_CANVAS_ASSETS/);

  for (const [name, expected] of Object.entries({
    ffdec: ["/opt/homebrew/bin/ffdec", "JPEXS Free Flash Decompiler v.26.2.1", "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab"],
    swfmill: ["/opt/homebrew/bin/swfmill", "swfmill 0.3.6", "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311"],
    python: ["/opt/anaconda3/bin/python3", "Python 3.12.7", "14caa9d0a57ad2bceb66f778e13ad9483e79e3812ae7fa2385d2b854ce419fb5"],
    ffmpeg: ["/opt/homebrew/bin/ffmpeg", "ffmpeg version 8.1.2", "dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c"],
    ffprobe: ["/opt/homebrew/bin/ffprobe", "ffprobe version 8.1.2", "cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00"],
  })) {
    assert.equal(report.toolchain[name].invokedPath, expected[0]);
    assert.equal(report.toolchain[name].version, expected[1]);
    assert.equal(report.toolchain[name].executableSha256, expected[2]);
  }
});

test("VB006 checked-in outputs reproduce from fresh extraction and 163-frame browser execution", async () => {
  const result = await generateG4L3Vb006CurrentJsCandidate({
    check: true,
    python: "/opt/anaconda3/bin/python3",
  });
  assert.equal(result.animationId, "course-g04-l03-vb-006");
  assert.equal(result.candidateRenderability.executedFrameCount, 163);
  assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed, false);
  assert.equal(result.candidateRenderability.rmseComputed, false);
  assert.ok(Object.values(result.acceptance).every((value) => value === false));
  assert.equal(result.strictAcceptanceEffect, "none");
});
