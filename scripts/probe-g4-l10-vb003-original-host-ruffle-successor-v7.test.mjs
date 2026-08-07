import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {
  analyzeDomInputEvents,
  buildFailClosedAuthority,
  buildInputAttemptPlans,
  preflightSuccessorV7,
  SOURCE_DECLARED_TRANSITION_WINDOWS,
} from "./probe-g4-l10-vb003-original-host-ruffle-successor-v7.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v7";
const RESULT_RELATIVE = `${OUTPUT_RELATIVE}/diagnostic.json`;
const RESULT_SHA256 =
  "eb2e458f3654a4420f35727bafd8c6eae314b619bdcb19737b1c8749b9145f06";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function checkedResult() {
  const bytes = await readFile(path.join(PROJECT_ROOT, RESULT_RELATIVE));
  assert.equal(sha256(bytes), RESULT_SHA256);
  return JSON.parse(bytes.toString("utf8"));
}

test("v7 has one bounded XML-blocked full-chain attempt", () => {
  const plans = buildInputAttemptPlans();
  assert.equal(plans.length, 1);
  assert.equal(plans[0].freshContext, true);
  assert.equal(plans[0].keytermXmlPolicy, "blocked-before-network-as-in-v2");
  assert.match(plans[0].id, /seven-source-window-staged-releases/);
});

test("v7 binds all seven exact successor paths and conservative arithmetic", () => {
  assert.equal(SOURCE_DECLARED_TRANSITION_WINDOWS.length, 7);
  assert.deepEqual(
    SOURCE_DECLARED_TRANSITION_WINDOWS.map(({step, expectedPath}) => [step, expectedPath]),
    [
      [1, "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf"],
      [2, "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf"],
      [3, "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf"],
      [4, "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf"],
      [5, "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf"],
      [6, "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf"],
      [7, "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf"],
    ],
  );
  for (const entry of SOURCE_DECLARED_TRANSITION_WINDOWS) {
    assert.equal(
      entry.plannedWaitMs,
      3_084 + Math.ceil(entry.frameCount / 12 * 1_000) + 1_000,
    );
  }
  assert.equal(SOURCE_DECLARED_TRANSITION_WINDOWS[4].timelineId, "sprite-31");
  assert.equal(SOURCE_DECLARED_TRANSITION_WINDOWS[4].frameCount, 136);
  assert.equal(SOURCE_DECLARED_TRANSITION_WINDOWS[4].plannedWaitMs, 15_418);
});

test("v7 preflight rehashes v6, VB001, all timing evidence, and remains fail closed", async () => {
  const preflight = await preflightSuccessorV7();
  assert.equal(
    preflight.predecessorV6.sha256,
    "60fe292caedb7b2e5347568c22edb8b423b4822966ce50d2af8fde32790be112",
  );
  assert.equal(
    preflight.vb001HostChainAudit.sha256,
    "cad80412082823298acddd7fcc69b4fb9e43f23cf00f9f9deeb6fffdd4025e11",
  );
  assert.equal(preflight.transitionPlan.length, 7);
  assert.equal(preflight.timingBindings.length, 7);
  assert.ok(preflight.timingBindings.every((entry) =>
    entry.entryState.authoritativeRuntimeEntryEstablished === false));
  assert.equal(preflight.authority.ruffleForensicReferenceOnly, true);
  assert.equal(preflight.authority.authoritativeOriginalRuntime, false);
  assert.equal(preflight.authority.originalRuntimeNaturalTrace, false);
  assert.equal(preflight.authority.fullFrameBaseline, false);
  assert.equal(preflight.authority.humanReview, false);
  assert.equal(preflight.authority.ownerReview, false);
  assert.equal(preflight.authority.strictCompletion, false);
  assert.equal(preflight.authority.wholeLessonIntegration, false);
  assert.equal(preflight.authority.releaseOrPublication, false);
  assert.equal(preflight.authority.strictAcceptanceEffect, "none");
});

test("trusted release admission requires ordered same-pointer canvas events inside bounds", () => {
  const bounds = {left: 746, right: 790, top: 536, bottom: 580};
  const base = {
    observerTarget: "pre-ruffle-window",
    listenerPhase: "capture",
    isTrusted: true,
    clientX: 768.05,
    clientY: 558,
    pointerId: 1,
    pointerType: "mouse",
    composedPath: ["CANVAS", "DIV", "RUFFLE-PLAYER", "BODY", "WINDOW"],
  };
  const admitted = analyzeDomInputEvents([
    {...base, type: "pointerdown", button: 0, buttons: 1},
    {...base, type: "pointerup", button: 0, buttons: 0},
  ], bounds);
  assert.equal(admitted.completeTrustedReleaseSequence, true);
  const cancelled = analyzeDomInputEvents([
    {...base, type: "pointerdown", button: 0, buttons: 1},
    {...base, type: "pointercancel", button: 0, buttons: 0},
    {...base, type: "pointerup", button: 0, buttons: 0},
  ], bounds);
  assert.equal(cancelled.completeTrustedReleaseSequence, false);
});

test("v7 authority builder never promotes Ruffle navigation", () => {
  const authority = buildFailClosedAuthority();
  assert.equal(authority.ruffleForensicReferenceOnly, true);
  for (const key of [
    "authoritativeOriginalRuntime",
    "originalRuntimeNaturalTrace",
    "originalRuntimeBaseline",
    "fullFrameBaseline",
    "targetBeginHandshakeProven",
    "targetChildDomainEntryProven",
    "audioListeningOrSynchronization",
    "visualFidelity",
    "humanReview",
    "ownerReview",
    "strictCompletion",
    "wholeLessonIntegration",
    "releaseOrPublication",
  ]) assert.equal(authority[key], false, key);
  assert.equal(authority.strictAcceptanceEffect, "none");
});

test("immutable v7 result proves seven ordered Ruffle deliveries and no future prefetch", async () => {
  const report = await checkedResult();
  assert.equal(report.schemaVersion, 7);
  assert.equal(
    report.status,
    "vb003-http-delivery-observed-after-seven-complete-dom-releases-and-source-declared-elapsed-windows-in-ruffle-forensic-only",
  );
  assert.equal(report.observation.attemptCount, 1);
  const attempt = report.observation.attempts[0];
  assert.equal(attempt.fatalError, null);
  assert.equal(attempt.blocker, null);
  assert.equal(attempt.successfulExpectedChildTransitions, 7);
  assert.equal(attempt.targetDeliveryObserved, true);
  assert.equal(attempt.allSevenExpectedChildTransitionsObserved, true);
  assert.equal(attempt.transitions.length, 7);
  for (const [index, transition] of attempt.transitions.entries()) {
    const expected = SOURCE_DECLARED_TRANSITION_WINDOWS[index];
    assert.equal(transition.step, expected.step);
    assert.equal(transition.expectedPath, expected.expectedPath);
    assert.equal(transition.input.domSequence.completeTrustedReleaseSequence, true);
    assert.equal(transition.input.domSequence.pointerId, 1);
    assert.equal(transition.delivery.complete, true);
    assert.equal(transition.evidenceLayers.deliveryNotBeforePointerUpDispatch, true);
    assert.equal(transition.unexpectedChildRequests.length, 0);
    assert.equal(transition.futurePrefetchesDuringElapsedWindow.length, 0);
    assert.equal(transition.sourceDeclaredElapsedWindow.plannedWaitMs, expected.plannedWaitMs);
    assert.equal(transition.sourceDeclaredElapsedWindow.completed, true);
    assert.ok(
      transition.sourceDeclaredElapsedWindow.actualWaitMs >= expected.plannedWaitMs,
    );
    assert.equal(
      transition.sourceDeclaredElapsedWindow.evidence.provesNaturalRuntimeEntry,
      false,
    );
    assert.equal(
      transition.sourceDeclaredElapsedWindow.evidence.provesNaturalRuntimeTerminal,
      false,
    );
  }
});

test("v7 containment admits only exact local GETs and records expected blocked failures", async () => {
  const report = await checkedResult();
  const attempt = report.observation.attempts[0];
  assert.equal(report.containment.containmentBreached, false);
  assert.equal(report.containment.serverUnknownRequestCount, 0);
  assert.equal(report.containment.legacyEndpointExecutionObserved, false);
  assert.equal(report.containment.allWebSocketsBlocked, true);
  assert.equal(attempt.containment.websocketAttemptCount, 0);
  assert.equal(attempt.containment.blockedRequestCount, 9);
  assert.equal(attempt.diagnostics.failedRequestCount, 9);
  assert.equal(attempt.diagnostics.pageErrors.length, 0);
  assert.deepEqual(
    attempt.containment.requestCountsByDisposition,
    {
      "allowed-exact-loopback-get": 17,
      "blocked-loopback-non-get": 8,
      "blocked-loopback-unallowlisted": 1,
    },
  );
  const blockedXml = attempt.containment.blockedRequests.filter((entry) =>
    entry.method === "GET" &&
      entry.path === "/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml");
  assert.equal(blockedXml.length, 1);
  const blockedTelemetry = attempt.containment.blockedRequests.filter((entry) =>
    entry.method === "POST" && entry.path === "/");
  assert.equal(blockedTelemetry.length, 8);
  assert.ok(attempt.containment.serverRequests.every((entry) =>
    entry.served === true && entry.method === "GET" && entry.query === ""));
});

test("v7 target content is two-second pixel-stable while host chrome remains dynamic", async () => {
  const report = await checkedResult();
  const target = report.observation.target;
  assert.equal(target.attempted, true);
  assert.equal(target.swfHttpDeliveryObserved, true);
  assert.equal(target.exactDeliveryOrderedAfterTrustedPointerRelease, true);
  assert.equal(target.sourceDeclaredElapsedWindowCompleted, true);
  assert.equal(target.beginHandshakeActuallyObserved, false);
  assert.equal(target.childFrameDomainActuallyObserved, false);
  assert.equal(target.naturalPlaybackProven, false);
  assert.equal(target.twoSecondPixelStabilityCandidate.byteIdenticalPng, false);
  const [firstBytes, secondBytes] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, target.twoSecondPixelStabilityCandidate.first.path)),
    readFile(path.join(PROJECT_ROOT, target.twoSecondPixelStabilityCandidate.second.path)),
  ]);
  assert.equal(sha256(firstBytes), target.twoSecondPixelStabilityCandidate.first.sha256);
  assert.equal(sha256(secondBytes), target.twoSecondPixelStabilityCandidate.second.sha256);
  const first = PNG.sync.read(firstBytes);
  const second = PNG.sync.read(secondBytes);
  let contentDifferentPixels = 0;
  let hostDifferentPixels = 0;
  for (let y = 0; y < first.height; y += 1) {
    for (let x = 0; x < first.width; x += 1) {
      const offset = (y * first.width + x) * 4;
      const different = [0, 1, 2, 3].some((channel) =>
        first.data[offset + channel] !== second.data[offset + channel]);
      if (!different) continue;
      if (y < 500) contentDifferentPixels += 1;
      else hostDifferentPixels += 1;
    }
  }
  assert.equal(contentDifferentPixels, 0);
  assert.equal(hostDifferentPixels, 2_520);
  assert.equal(target.twoSecondPixelStabilityCandidate.provesRuntimeTerminal, false);
  assert.equal(target.twoSecondPixelStabilityCandidate.provesVisualFidelity, false);
});

test("v7 output is immutable, rehashes every screenshot, and preserves all authority gates", async () => {
  const report = await checkedResult();
  const outputRoot = path.join(PROJECT_ROOT, OUTPUT_RELATIVE);
  const rootStat = await lstat(outputRoot);
  assert.equal((rootStat.mode & 0o777).toString(8), "555");
  const entries = await readdir(outputRoot, {withFileTypes: true});
  assert.equal(entries.filter((entry) => entry.name.endsWith(".png")).length, 45);
  assert.ok(entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()));
  for (const entry of entries) {
    const metadata = await lstat(path.join(outputRoot, entry.name));
    assert.equal((metadata.mode & 0o777).toString(8), "444", entry.name);
  }
  for (const screenshot of report.observation.attempts[0].screenshots) {
    const bytes = await readFile(path.join(PROJECT_ROOT, screenshot.path));
    assert.equal(sha256(bytes), screenshot.sha256, screenshot.path);
    const png = PNG.sync.read(bytes);
    assert.equal(png.width, 800, screenshot.path);
    assert.equal(png.height, 600, screenshot.path);
  }
  const producer = await readFile(path.join(PROJECT_ROOT, report.probe.path));
  assert.equal(sha256(producer), report.probe.sha256);
  assert.equal(report.authority.ruffleForensicReferenceOnly, true);
  assert.equal(report.authority.authoritativeOriginalRuntime, false);
  assert.equal(report.authority.originalRuntimeNaturalTrace, false);
  assert.equal(report.authority.originalRuntimeBaseline, false);
  assert.equal(report.authority.fullFrameBaseline, false);
  assert.equal(report.authority.audioListeningOrSynchronization, false);
  assert.equal(report.authority.visualFidelity, false);
  assert.equal(report.authority.humanReview, false);
  assert.equal(report.authority.ownerReview, false);
  assert.equal(report.authority.strictCompletion, false);
  assert.equal(report.authority.wholeLessonIntegration, false);
  assert.equal(report.authority.releaseOrPublication, false);
  assert.equal(report.authority.strictAcceptanceEffect, "none");
});
