import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {classifyBrowserRequest} from
  "./probe-g4-l10-vb003-original-host-ruffle-successor-v2.mjs";
import {
  KEYTERM_XML_REQUEST_PATH,
  SUCCESSOR_V3_OUTPUT_RELATIVE,
  analyzeDomInputEvents,
  buildFailClosedAuthority,
  buildInputAttemptPlans,
  traceReferencesExpectedPath,
} from "./probe-g4-l10-vb003-original-host-ruffle-successor-v3.mjs";

const ORIGIN = "http://127.0.0.1:43123";
const RESULT_PATH = `${SUCCESSOR_V3_OUTPUT_RELATIVE}/diagnostic.json`;
const V2_PATH =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v2/diagnostic.json";
const SCRIPT_PATH =
  "scripts/probe-g4-l10-vb003-original-host-ruffle-successor-v3.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("v3 orders two fresh-context attempts without mixing causal axes", () => {
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
  const complete = analyzeDomInputEvents([
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
      clientX: 768,
      clientY: 558,
    },
  ], bounds);
  assert.equal(complete.completeTrustedReleaseSequence, true);
  assert.equal(complete.pointerDownInsideMappedHitBounds, true);
  assert.equal(complete.pointerUpInsideMappedHitBounds, true);

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

test("checked-in v3 preserves its immutable pointer-phase instrumentation failure", async () => {
  const [resultBytes, v2Bytes, scriptBytes] = await Promise.all([
    readFile(RESULT_PATH),
    readFile(V2_PATH),
    readFile(SCRIPT_PATH),
  ]);
  const result = JSON.parse(resultBytes);
  assert.equal(result.schemaVersion, 3);
  assert.equal(
    result.reportType,
    "g4-l10-vb003-contained-original-host-ruffle-successor-v3-diagnostic",
  );
  assert.equal(result.probe.outputPath, RESULT_PATH);
  assert.equal(result.probe.sha256, sha256(scriptBytes));
  assert.equal(result.probe.overwritesV2Diagnostic, false);
  assert.equal(result.lineage.predecessorV2.before.sha256, sha256(v2Bytes));
  assert.deepEqual(
    result.lineage.predecessorV2.before,
    result.lineage.predecessorV2.after,
  );
  assert.equal(result.lineage.predecessorV2.unchanged, true);
  assert.equal(
    result.lineage.keytermXml.source.sha256,
    "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
  );
  assert.equal(result.lineage.keytermXml.source.bytes, 378783);
  assert.equal(result.lineage.keytermXml.sourceUnchangedAfterProbe, true);
  assert.ok(result.observation.attemptCount >= 1);
  assert.ok(result.observation.attemptCount <= 2);
  assert.equal(
    result.status,
    "complete-dom-release-observed-rw002-not-requested-in-ruffle-forensic-only",
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
      false,
    );
    assert.equal(
      transition.input.domSequence.trustedPointerDownObserved,
      false,
    );
    assert.equal(
      transition.input.domSequence.trustedPointerUpObserved,
      false,
    );
    assert.equal(transition.evidenceLayers.domPointerSequenceComplete, false);
    assert.equal(transition.delivery.complete, false);
    assert.equal(
      transition.evidenceLayers.httpDeliveryComplete,
      transition.delivery.complete,
    );
    assert.equal(transition.preloaderSettle, null);
    assert.equal(
      attempt.blocker.kind,
      "input-geometry-focus-or-pointer-phase-blocker",
    );
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
  assert.equal(result.observation.target.attempted, false);
  assert.equal(result.observation.target.swfHttpDeliveryObserved, false);
  // The immutable v3 status string overstates the observation. The checked
  // event payload above is the controlling evidence; v4 is the versioned
  // successor that repairs listener placement without rewriting v3.
  assert.equal(result.containment.containmentBreached, false);
  assert.equal(result.containment.serverUnknownRequestCount, 0);
  assert.deepEqual(result.authority, buildFailClosedAuthority());
  const [resultMetadata, outputMetadata] = await Promise.all([
    stat(RESULT_PATH),
    stat(SUCCESSOR_V3_OUTPUT_RELATIVE),
  ]);
  assert.equal(resultMetadata.mode & 0o777, 0o444);
  assert.equal(outputMetadata.mode & 0o777, 0o555);
});
