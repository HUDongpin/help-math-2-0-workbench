import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {classifyBrowserRequest} from
  "./probe-g4-l10-vb003-original-host-ruffle-successor-v2.mjs";
import {
  KEYTERM_XML_REQUEST_PATH,
  SUCCESSOR_V6_OUTPUT_RELATIVE,
  analyzeDomInputEvents,
  buildFailClosedAuthority,
  buildInputAttemptPlans,
  buildPreRuffleInputObserverSource,
  buildRuffleHardwareModalContract,
  traceReferencesExpectedPath,
} from "./probe-g4-l10-vb003-original-host-ruffle-successor-v6.mjs";

const ORIGIN = "http://127.0.0.1:43123";
const RESULT_PATH = `${SUCCESSOR_V6_OUTPUT_RELATIVE}/diagnostic.json`;
const V2_PATH =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v2/diagnostic.json";
const V3_PATH =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v3/diagnostic.json";
const V4_PATH =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v4/diagnostic.json";
const V5_PATH =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v5/diagnostic.json";
const SCRIPT_PATH =
  "scripts/probe-g4-l10-vb003-original-host-ruffle-successor-v6.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("v6 orders two fresh-context attempts without mixing causal axes", () => {
  const plans = buildInputAttemptPlans();
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((plan) => plan.keytermXmlPolicy), [
    "blocked-before-network-as-in-v2",
    "allow-exact-hash-bound-get",
  ]);
  assert.ok(plans.every((plan) => plan.freshContext));
  assert.ok(plans.every((plan) => plan.transport === "page.mouse move/down/up"));
  assert.ok(plans.every((plan) => plan.hoverSettleMs >= 200));
  assert.ok(plans.every((plan) => plan.pointerDownHoldMs >= 200));
});

test("DOM release validator requires trusted ordered same-pointer in-bounds phases", () => {
  const bounds = {left: 746, right: 790, top: 536, bottom: 580};
  const down = (observerTarget = undefined) => ({
    observerTarget,
    listenerPhase: "capture",
    type: "pointerdown",
    isTrusted: true,
    pointerId: 1,
    clientX: 768,
    clientY: 558,
    button: 0,
    buttons: 1,
    composedPath: ["CANVAS", "RUFFLE-PLAYER"],
  });
  const up = (observerTarget = undefined) => ({
    observerTarget,
    listenerPhase: "capture",
    type: "pointerup",
    isTrusted: true,
    pointerId: 1,
    clientX: 768,
    clientY: 558,
    button: 0,
    buttons: 0,
    composedPath: ["CANVAS", "RUFFLE-PLAYER"],
  });
  const complete = analyzeDomInputEvents([
    down(),
    up(),
  ], bounds);
  assert.equal(complete.completeTrustedReleaseSequence, true);
  assert.equal(complete.pointerDownInsideMappedHitBounds, true);
  assert.equal(complete.pointerUpInsideMappedHitBounds, true);

  const windowPreferred = analyzeDomInputEvents([
    {
      observerTarget: "canvas",
      listenerPhase: "capture",
      type: "pointermove",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
    down("window"),
    up("window"),
  ], bounds);
  assert.equal(windowPreferred.observerTarget, "window");
  assert.equal(windowPreferred.capturePointerEventCount, 2);
  assert.equal(windowPreferred.completeTrustedReleaseSequence, true);

  const preRufflePreferred = analyzeDomInputEvents([
    {
      observerTarget: "window",
      listenerPhase: "capture",
      type: "pointermove",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
    down("pre-ruffle-window"),
    up("pre-ruffle-window"),
  ], bounds);
  assert.equal(preRufflePreferred.observerTarget, "pre-ruffle-window");
  assert.equal(preRufflePreferred.capturePointerEventCount, 2);
  assert.equal(preRufflePreferred.completeTrustedReleaseSequence, true);

  const cancelled = analyzeDomInputEvents([
    {
      listenerPhase: "capture",
      type: "pointerdown",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
    {
      listenerPhase: "capture",
      type: "pointercancel",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
    {
      listenerPhase: "capture",
      type: "pointerup",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
  ], bounds);
  assert.equal(cancelled.pointerCancelBetweenDownAndUp, true);
  assert.equal(cancelled.completeTrustedReleaseSequence, false);

  const outside = analyzeDomInputEvents([
    {
      listenerPhase: "capture",
      type: "pointerdown",
      isTrusted: true,
      pointerId: 1,
      clientX: 768,
      clientY: 558,
    },
    {
      listenerPhase: "capture",
      type: "pointerup",
      isTrusted: true,
      pointerId: 1,
      clientX: 700,
      clientY: 500,
    },
  ], bounds);
  assert.equal(outside.pointerUpInsideMappedHitBounds, false);
  assert.equal(outside.completeTrustedReleaseSequence, false);
});

test("exact XML GET may be allowlisted while query, POST, and external traffic stay blocked", () => {
  const allowed = new Set(["/", KEYTERM_XML_REQUEST_PATH]);
  assert.deepEqual(
    classifyBrowserRequest(
      `${ORIGIN}${KEYTERM_XML_REQUEST_PATH}`,
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: true, disposition: "allowed-exact-loopback-get"},
  );
  assert.deepEqual(
    classifyBrowserRequest(
      `${ORIGIN}${KEYTERM_XML_REQUEST_PATH}?v=1`,
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: false, disposition: "blocked-loopback-unallowlisted"},
  );
  assert.deepEqual(
    classifyBrowserRequest(`${ORIGIN}/`, "POST", ORIGIN, allowed),
    {allowed: false, disposition: "blocked-loopback-non-get"},
  );
  assert.deepEqual(
    classifyBrowserRequest(
      "https://legacy.example.invalid/report",
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: false, disposition: "blocked-non-loopback-or-external"},
  );
});

test("trace helper is supporting evidence only and matches either served or source-relative path", () => {
  const expected = "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf";
  assert.equal(traceReferencesExpectedPath([
    {arguments: ["http://127.0.0.1:43123/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf"]},
  ], expected), true);
  assert.equal(traceReferencesExpectedPath([
    {arguments: ["unrelated trace"]},
  ], expected), false);
});

test("authority builder cannot promote a forensic Ruffle diagnostic", () => {
  const authority = buildFailClosedAuthority();
  assert.equal(authority.ruffleForensicReferenceOnly, true);
  assert.equal(authority.authoritativeOriginalRuntime, false);
  assert.equal(authority.originalRuntimeNaturalTrace, false);
  assert.equal(authority.originalRuntimeBaseline, false);
  assert.equal(authority.fullFrameBaseline, false);
  assert.equal(authority.audioListeningOrSynchronization, false);
  assert.equal(authority.humanReview, false);
  assert.equal(authority.ownerReview, false);
  assert.equal(authority.strictCompletion, false);
  assert.equal(authority.wholeLessonIntegration, false);
  assert.equal(authority.releaseOrPublication, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});

test("pre-Ruffle init observer is installed before page scripts and records trusted phases without claiming authority", () => {
  const source = buildPreRuffleInputObserverSource();
  assert.match(source, /__preRuffleInputObserverInstalled/);
  assert.match(source, /pre-ruffle-window/);
  assert.match(source, /window\.addEventListener\(type, record, true\)/);
  assert.doesNotMatch(source, /dispatchEvent|new PointerEvent/);
  assert.doesNotMatch(source, /if \(!canvas\) return/);
  assert.match(source, /isTrusted: event\.isTrusted/);
  assert.match(source, /pointerover/);
  assert.match(source, /mouseover/);
});

test("pinned Ruffle bundle proves the one-shot hardware-warning UI contract", async () => {
  const ruffleJs = await readFile("public/ruffle/ruffle.js");
  const contract = buildRuffleHardwareModalContract(ruffleJs);
  assert.equal(contract.modalSelector, "#hardware-acceleration-modal");
  assert.equal(
    contract.closeSelector,
    "#hardware-acceleration-modal .close-modal",
  );
  assert.equal(contract.anchorCount, 5);
  assert.match(contract.trigger, /once on container mouseover/);
  assert.equal(contract.openEffect, "remove hidden class");
  assert.equal(contract.trustedCloseEffect, "close-modal click adds hidden class");
});

test("checked-in v6 clears Ruffle chrome before trusted target evidence without rewriting v5", async () => {
  const [resultBytes, v2Bytes, v3Bytes, v4Bytes, v5Bytes, scriptBytes] = await Promise.all([
    readFile(RESULT_PATH),
    readFile(V2_PATH),
    readFile(V3_PATH),
    readFile(V4_PATH),
    readFile(V5_PATH),
    readFile(SCRIPT_PATH),
  ]);
  const result = JSON.parse(resultBytes);
  assert.equal(result.schemaVersion, 6);
  assert.equal(
    result.reportType,
    "g4-l10-vb003-contained-original-host-ruffle-successor-v6-diagnostic",
  );
  assert.equal(result.probe.outputPath, RESULT_PATH);
  assert.equal(result.probe.sha256, sha256(scriptBytes));
  assert.equal(result.probe.overwritesV2Diagnostic, false);
  assert.equal(result.probe.overwritesV3Diagnostic, false);
  assert.equal(result.probe.overwritesV4Diagnostic, false);
  assert.equal(result.probe.overwritesV5Diagnostic, false);
  assert.equal(result.lineage.predecessorV2.before.sha256, sha256(v2Bytes));
  assert.deepEqual(
    result.lineage.predecessorV2.before,
    result.lineage.predecessorV2.after,
  );
  assert.equal(result.lineage.predecessorV2.unchanged, true);
  assert.equal(result.lineage.predecessorV3.before.sha256, sha256(v3Bytes));
  assert.deepEqual(
    result.lineage.predecessorV3.before,
    result.lineage.predecessorV3.after,
  );
  assert.equal(result.lineage.predecessorV3.unchanged, true);
  assert.equal(
    result.lineage.predecessorV3.completeTrustedReleaseSequenceObserved,
    false,
  );
  assert.equal(result.lineage.predecessorV4.before.sha256, sha256(v4Bytes));
  assert.deepEqual(
    result.lineage.predecessorV4.before,
    result.lineage.predecessorV4.after,
  );
  assert.equal(result.lineage.predecessorV4.unchanged, true);
  assert.equal(
    result.lineage.predecessorV4.completeTrustedReleaseSequenceObserved,
    false,
  );
  assert.equal(result.lineage.predecessorV5.before.sha256, sha256(v5Bytes));
  assert.deepEqual(
    result.lineage.predecessorV5.before,
    result.lineage.predecessorV5.after,
  );
  assert.equal(result.lineage.predecessorV5.unchanged, true);
  assert.equal(
    result.lineage.predecessorV5.completeTrustedCanvasReleaseObserved,
    false,
  );
  assert.equal(
    result.lineage.keytermXml.source.sha256,
    "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
  );
  assert.equal(result.lineage.keytermXml.source.bytes, 378783);
  assert.equal(result.lineage.keytermXml.sourceUnchangedAfterProbe, true);
  assert.ok(result.observation.attemptCount >= 1);
  assert.ok(result.observation.attemptCount <= 2);
  assert.notEqual(
    result.status,
    "trusted-canvas-release-not-observed-after-ruffle-chrome-clear-probe-remains-input-limited",
  );
  assert.equal(result.observation.attempts[0].plan.keytermXmlPolicy,
    "blocked-before-network-as-in-v2");
  if (result.observation.attempts.length === 2) {
    assert.equal(result.observation.attempts[1].plan.keytermXmlPolicy,
      "allow-exact-hash-bound-get");
  }
  for (const attempt of result.observation.attempts) {
    assert.equal(attempt.fatalError, null);
    assert.equal(attempt.freshContextClosed, true);
    assert.equal(attempt.initialDelivery.complete, true);
    assert.ok(attempt.initialCompletionWait.actualWaitMs >= 12_334);
    assert.equal(attempt.transitions.length, 1);
    const transition = attempt.transitions[0];
    assert.equal(transition.step, 1);
    assert.equal(
      transition.expectedPath,
      "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
    );
    assert.equal(
      transition.input.domSequence.completeTrustedReleaseSequence,
      true,
    );
    assert.equal(
      transition.input.domSequence.trustedPointerDownObserved,
      true,
    );
    assert.equal(
      transition.input.domSequence.trustedPointerUpObserved,
      true,
    );
    assert.equal(
      transition.input.domSequence.observerTarget,
      "pre-ruffle-window",
    );
    assert.equal(
      transition.input.domSequence.pointerDownPathIncludesCanvas,
      true,
    );
    assert.equal(
      transition.input.domSequence.pointerUpPathIncludesCanvas,
      true,
    );
    assert.equal(
      transition.input.domSequence.pointerDownPathIncludesPlayer,
      true,
    );
    assert.equal(
      transition.input.domSequence.pointerUpPathIncludesPlayer,
      true,
    );
    assert.equal(transition.input.domSequence.primaryButtonState, true);
    assert.equal(transition.evidenceLayers.domPointerSequenceComplete, true);
    const chromeSetup = transition.input.ruffleChromeSetup;
    assert.equal(chromeSetup.modalObserved, true);
    assert.equal(chromeSetup.trustedClosePerformed, true);
    assert.equal(chromeSetup.cleared, true);
    assert.equal(chromeSetup.targetEvidenceStartsAfterSetup, true);
    assert.equal(chromeSetup.final.allModalsHidden, true);
    assert.equal(chromeSetup.final.targetElement.isCanvas, true);
    assert.equal(chromeSetup.final.canvas.pointerEvents, "auto");
    assert.ok(chromeSetup.setupEvents.some((entry) =>
      entry.type === "mouseover" && entry.pathIncludesCanvas === true));
    assert.ok(chromeSetup.setupEvents.some((entry) =>
      entry.type === "click" && entry.pathIncludesCanvas === false));
    assert.deepEqual(
      transition.input.browserInputCommandReceipts.map((entry) => entry.command),
      [
        "move-to-inert-stage-point",
        "move-to-next-with-steps",
        "left-button-down",
        "left-button-up",
      ],
    );
    assert.ok(transition.input.browserInputCommandReceipts.every((entry) =>
      entry.completedWithoutProtocolError === true &&
      entry.provesTrustedDomDelivery === false));
    assert.equal(
      transition.evidenceLayers.httpDeliveryComplete,
      transition.delivery.complete,
    );
    if (transition.delivery.complete) {
      assert.equal(
        transition.evidenceLayers.deliveryNotBeforePointerUpDispatch,
        true,
      );
      assert.equal(transition.preloaderSettle.completed, true);
      assert.ok(transition.preloaderSettle.actualWaitMs >= 3_084);
    } else {
      assert.equal(transition.preloaderSettle, null);
      assert.equal(
        attempt.blocker.kind,
        "ruffle-avm1-release-or-handler-execution-not-observed",
      );
    }
    assert.equal(attempt.containment.containmentBreached, false);
    assert.equal(attempt.containment.serverUnknownRequestCount, 0);
    assert.ok(attempt.containment.blockedRequests.some((entry) =>
      entry.method === "POST" && entry.disposition === "blocked-loopback-non-get"));
    assert.ok(attempt.containment.serverRequests.every((entry) =>
      entry.method === "GET"));
    for (const screenshot of attempt.screenshots) {
      const [bytes, metadata] = await Promise.all([
        readFile(screenshot.path),
        stat(screenshot.path),
      ]);
      assert.equal(bytes.length, screenshot.bytes);
      assert.equal(sha256(bytes), screenshot.sha256);
      assert.equal(screenshot.width, 800);
      assert.equal(screenshot.height, 600);
      assert.equal(metadata.mode & 0o777, 0o444);
    }
  }
  if (result.observation.attemptCount === 2) {
    assert.equal(result.observation.keytermXml.exactGetDeliveryObserved, true);
  }
  assert.ok(result.observation.ruffleChrome.attemptSetups.every((setup) =>
    setup.modalObserved === true &&
    setup.trustedClosePerformed === true &&
    setup.clearedBeforeTargetEvidence === true &&
    setup.targetHitCanvasAfterClear === true &&
    setup.allModalsHiddenAfterClear === true));
  assert.equal(result.observation.target.attempted, false);
  assert.equal(result.observation.target.swfHttpDeliveryObserved, false);
  assert.equal(result.containment.containmentBreached, false);
  assert.equal(result.containment.serverUnknownRequestCount, 0);
  assert.deepEqual(result.authority, buildFailClosedAuthority());
  const [resultMetadata, outputMetadata] = await Promise.all([
    stat(RESULT_PATH),
    stat(SUCCESSOR_V6_OUTPUT_RELATIVE),
  ]);
  assert.equal(resultMetadata.mode & 0o777, 0o444);
  assert.equal(outputMetadata.mode & 0o777, 0o555);
});
