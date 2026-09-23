import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildSpanishHostAudioCandidate,
  generateG4L3Ts006CurrentJsCandidate,
  parseArguments,
  runtimeProtocolAuthorityBoundary,
  validateSpanishHostAudioCandidateBoundary,
  validateG4L3Ts006CurrentJsCandidate,
} from "./build-g4-l3-ts006-current-js-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT,
  "reports/g4-l3-ts006-current-javascript-candidate.json");
const MANIFEST = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json");
const RUNTIME = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js");
const SOURCE_SPANISH_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3";
const PUBLIC_SPANISH_AUDIO =
  "public/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3";
const PUBLIC_AUDIO_MANIFEST = "public/flash-assets/audio/courses/manifest.json";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("TS006 candidate CLI keeps the tool surface explicit", () => {
  assert.deepEqual(parseArguments(["--check"]), {check: true, ffdec: "ffdec"});
  assert.equal(parseArguments(["--ffdec", "/opt/homebrew/bin/ffdec"]).ffdec,
    "/opt/homebrew/bin/ffdec");
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("TS006 checked-in report is acceptance-neutral", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  assert.equal(validateG4L3Ts006CurrentJsCandidate(report), report);
  assert.equal(report.disposition.currentJavaScriptCandidate, true);
  assert.equal(report.disposition.candidateRenderabilityOnly, true);
  assert.equal(report.disposition.prototypeRegistryOnly, true);
  assert.equal(report.disposition.spanishHostAudioEngineeringCandidate, true);
  assert.equal(report.hostAudioCandidate.activation, "user");
  assert.equal(report.hostAudioCandidate.publicAsset.exactSourceBytes, true);
  assert.equal(report.hostAudioCandidate.embeddedAudioEnabled, false);
  assert.equal(report.hostAudioCandidate.sourceMediaMatchEstablished, false);
  assert.equal(report.hostAudioCandidate.authoritativeListeningComplete, false);
  assert.equal(report.hostAudioCandidate.audioAccepted, false);
  assert.ok(Object.values(report.authorization).every((value) => value === false));
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.writeScope.protectedBefore.files.some(
    (entry) => entry.path === "catalog/completion-ledger.json"), false);
  assert.equal(report.writeScope.protectedBefore.files.some(
    (entry) => entry.path ===
      "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json"), false);
  assert.equal(report.evidenceBindings.runtimeProtocol.bindingMode,
    "draft-authority-boundary-projection-v1");
  assert.match(report.evidenceBindings.runtimeProtocol.authorityBoundarySha256,
    /^[a-f0-9]{64}$/);
  assert.equal(
    report.evidenceBindings.runtimeProtocol.exactProtocolBytesBound,
    false,
  );
  assert.equal(report.evidenceBindings.sourceAudit.sha256,
    "e27f043f7c2153896128cdd780a67b1d2c0e87557af9a622d42d4c0b76f41cfc");
  assert.equal(
    report.evidenceBindings.sourceAuditRebindReceipt.transitionFromSha256,
    "6b09c03c708f35fcd1fdb1cde365d41d21a1a8296d5f687c2f4ab6ef11c93fb1",
  );
  assert.equal(
    report.evidenceBindings.sourceAuditRebindReceipt.transitionToSha256,
    report.evidenceBindings.sourceAudit.sha256,
  );
  assert.equal(
    report.evidenceBindings.sourceAuditRebindReceipt
      .fullHistoricalByteDiffPerformed,
    false,
  );
  assert.equal(
    report.evidenceBindings.sourceAuditRebindReceipt.strictAcceptanceEffect,
    "none",
  );
});

test("TS006 Spanish host-audio candidate is exact-byte but never an authorization", async () => {
  const [sourceContents, publicContents, manifestContents] = await Promise.all([
    readFile(path.join(ROOT, SOURCE_SPANISH_AUDIO)),
    readFile(path.join(ROOT, PUBLIC_SPANISH_AUDIO)),
    readFile(path.join(ROOT, PUBLIC_AUDIO_MANIFEST)),
  ]);
  const binding = (bindingPath, contents) => ({
    path: bindingPath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  });
  const candidate = buildSpanishHostAudioCandidate({
    sourceAssociatedAudio: binding(SOURCE_SPANISH_AUDIO, sourceContents),
    publicAssociatedAudio: binding(PUBLIC_SPANISH_AUDIO, publicContents),
    publicAudioManifest: binding(PUBLIC_AUDIO_MANIFEST, manifestContents),
  });
  assert.equal(validateSpanishHostAudioCandidateBoundary(candidate), candidate);
  assert.equal(candidate.status,
    "same-origin-user-activated-spanish-host-track-engineering-candidate-only");
  assert.equal(candidate.publicAsset.exactSourceBytes, true);
  assert.equal(candidate.implementationAuthorized, false);
  assert.equal(candidate.audioAccepted, false);
  const promoted = {...candidate, audioAccepted: true};
  assert.throws(() => validateSpanishHostAudioCandidateBoundary(promoted),
    /cannot promote audioAccepted/);
});

test("TS006 runtime protocol binding ignores incidental evidence hashes", async () => {
  const protocolPath = path.join(ROOT,
    "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json");
  const protocol = JSON.parse(await readFile(protocolPath, "utf8"));
  const drifted = structuredClone(protocol);
  const firstBinding = Object.values(drifted.sourceBindings ?? {})
    .find((entry) => entry && typeof entry === "object");
  assert.ok(firstBinding, "fixture must contain a source binding");
  firstBinding.sha256 = "0".repeat(64);
  assert.deepEqual(
    runtimeProtocolAuthorityBoundary(drifted),
    runtimeProtocolAuthorityBoundary(protocol),
  );
});

test("TS006 runtime protocol authority projection changes on promotion", async () => {
  const protocolPath = path.join(ROOT,
    "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json");
  const protocol = JSON.parse(await readFile(protocolPath, "utf8"));
  const promoted = structuredClone(protocol);
  promoted.executionGate.originalRuntimeExecutionReady = true;
  assert.notDeepEqual(
    runtimeProtocolAuthorityBoundary(promoted),
    runtimeProtocolAuthorityBoundary(protocol),
  );
});

test("TS006 browser evidence executes 128 source-static frames and fails closed", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  const evidence = report.candidateRenderability;
  assert.equal(evidence.executedFrameCount, 128);
  assert.equal(evidence.pngEncodedFrameCount, 128);
  assert.equal(evidence.uniqueVisualFrameCount, 1);
  assert.deepEqual(evidence.negativeProbes.map(({name, blocked}) => [name, blocked]), [
    ["spanish", true],
    ["root", true],
    ["sprite-3", true],
    ["audio", true],
    ["replay", true],
    ["out-of-range", true],
  ]);
  assert.equal(evidence.originalRuntimeBaselineUsed, false);
  assert.equal(evidence.rmseComputed, false);
  assert.equal(evidence.visualParityClaimed, false);
  assert.equal(evidence.behaviorParityClaimed, false);
});

test("TS006 manifest keeps Canvas audio disabled and declares only the separate host candidate", async () => {
  const [report, manifest, runtimeBytes, manifestBytes] = await Promise.all([
    readFile(REPORT, "utf8").then(JSON.parse),
    readFile(MANIFEST, "utf8").then(JSON.parse),
    readFile(RUNTIME),
    readFile(MANIFEST),
  ]);
  assert.equal(sha256(runtimeBytes), report.outputs.canvasRuntime.sha256);
  assert.equal(runtimeBytes.length, report.outputs.canvasRuntime.bytes);
  assert.equal(sha256(manifestBytes), report.outputs.canvasManifest.sha256);
  assert.equal(manifest.runtime.boundedScope.frameDomain, "sprite-23");
  assert.deepEqual(manifest.runtime.boundedScope.frames,
    {first: 1, lastInclusive: 128});
  assert.equal(manifest.runtime.blocked.root, true);
  assert.equal(manifest.runtime.blocked["sprite-3"], true);
  assert.equal(manifest.runtime.blocked.spanish, true);
  assert.equal(manifest.runtime.blocked.embeddedAudio, true);
  assert.equal(manifest.runtime.blocked.associatedAudioInCanvasRuntime, true);
  assert.equal(manifest.runtime.blocked.associatedAudio, true);
  assert.equal(manifest.safety.pointerEventsEnabled, false);
  assert.equal(manifest.safety.audioRendered, false);
  assert.equal(manifest.safety.scope, "generated-canvas-runtime-only");
  assert.equal(manifest.hostAudioCandidate.activation, "user");
  assert.equal(manifest.hostAudioCandidate.publicAsset.exactSourceBytes, true);
  assert.equal(manifest.hostAudioCandidate.embeddedAudioEnabled, false);
  assert.equal(manifest.source.embeddedAudio.technicalDurationMs, 10_632);
  assert.equal(manifest.hostAudioCandidate.implementationAuthorized, false);
  assert.equal(manifest.hostAudioCandidate.audioAccepted, false);
  assert.ok(Object.values(manifest.authorization).every((value) => value === false));
  assert.ok(Object.values(manifest.acceptance).every((value) => value === false));
  const runtime = runtimeBytes.toString("utf8");
  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.match(runtime, /unsupported source-proven language/);
  assert.match(runtime, /HELP_MATH_CANVAS_ASSETS/);
});

test("TS006 checked-in outputs reproduce from fresh extraction", async () => {
  const result = await generateG4L3Ts006CurrentJsCandidate({check: true});
  assert.equal(result.animationId, "course-g04-l03-ts-006");
  assert.equal(result.candidateRenderability.executedFrameCount, 128);
  assert.equal(result.candidateRenderability.uniqueVisualFrameCount, 1);
  assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed, false);
  assert.ok(Object.values(result.acceptance).every((value) => value === false));
  assert.equal(result.strictAcceptanceEffect, "none");
});
