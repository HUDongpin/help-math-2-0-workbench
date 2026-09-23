import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {
  SUCCESSOR_OUTPUT_RELATIVE,
  buildSuccessorTransitionPlan,
  classifyBrowserRequest,
  deliveryIsComplete,
  deriveSuccessorWaitPolicy,
} from "./probe-g4-l10-vb003-original-host-ruffle-successor-v2.mjs";

const ORIGIN = "http://127.0.0.1:43123";
const LEGACY_RESULT =
  "output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic/diagnostic.json";
const SUCCESSOR_RESULT = `${SUCCESSOR_OUTPUT_RELATIVE}/diagnostic.json`;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("successor network classifier preserves exact GET-only loopback containment", () => {
  const allowed = new Set([
    "/",
    "/ruffle/ruffle.js",
    "/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf",
  ]);
  assert.deepEqual(
    classifyBrowserRequest(`${ORIGIN}/`, "GET", ORIGIN, allowed),
    {allowed: true, disposition: "allowed-exact-loopback-get"},
  );
  assert.deepEqual(
    classifyBrowserRequest(
      "blob:http://127.0.0.1:43123/id",
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: true, disposition: "in-memory-non-network"},
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
  assert.deepEqual(
    classifyBrowserRequest(
      `${ORIGIN}/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf`,
      "POST",
      ORIGIN,
      allowed,
    ),
    {allowed: false, disposition: "blocked-loopback-non-get"},
  );
  assert.deepEqual(
    classifyBrowserRequest(
      `${ORIGIN}/ruffle/ruffle.js?v=1`,
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: false, disposition: "blocked-loopback-unallowlisted"},
  );
  assert.deepEqual(
    classifyBrowserRequest(
      `${ORIGIN}/favicon.ico`,
      "GET",
      ORIGIN,
      allowed,
    ),
    {allowed: false, disposition: "blocked-loopback-unallowlisted"},
  );
});

test("IR001 and host-preloader waits are conservatively derived from exact frame domains", () => {
  const policy = deriveSuccessorWaitPolicy({
    initialChildFrameCount: 136,
    initialChildFps: 12,
    hostPreloaderFrameCount: 28,
    shellFps: 12,
  });
  assert.equal(policy.initialChild.timelineId, "sprite-31");
  assert.equal(policy.initialChild.frameCount, 136);
  assert.equal(policy.initialChild.nominalDurationMs, 136 / 12 * 1000);
  assert.equal(policy.initialChild.minimumWaitMs, 12_000);
  assert.equal(policy.initialChild.plannedWaitMs, 12_334);
  assert.equal(policy.hostPreloader.frameCount, 28);
  assert.equal(policy.hostPreloader.plannedWaitMs, 3_084);
});

test("the current antecedent yields the exact static seven-Next chain", async () => {
  const report = JSON.parse(await readFile(
    "reports/g4-l10-vb003-host-entry-antecedent.json",
    "utf8",
  ));
  const plan = buildSuccessorTransitionPlan(report);
  assert.deepEqual(plan.map(({expectedPath}) => expectedPath), [
    "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf",
    "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
  ]);
  assert.equal(plan.at(-1).target, true);
});

test("a child delivery requires request, HTTP 200, and exact server service", () => {
  assert.equal(deliveryIsComplete({
    newAllowedRequestCount: 1,
    newHttp200ResponseCount: 1,
    newServerServedCount: 1,
  }), true);
  assert.equal(deliveryIsComplete({
    newAllowedRequestCount: 1,
    newHttp200ResponseCount: 0,
    newServerServedCount: 1,
  }), false);
  assert.equal(deliveryIsComplete({
    newAllowedRequestCount: 1,
    newHttp200ResponseCount: 1,
    newServerServedCount: 0,
  }), false);
});

test("versioned successor result preserves the legacy diagnostic and stays fail-closed", async () => {
  assert.notEqual(SUCCESSOR_RESULT, LEGACY_RESULT);
  const [successorBytes, legacyBytes] = await Promise.all([
    readFile(SUCCESSOR_RESULT),
    readFile(LEGACY_RESULT),
  ]);
  const result = JSON.parse(successorBytes);
  assert.equal(result.schemaVersion, 2);
  assert.equal(
    result.reportType,
    "g4-l10-vb003-contained-original-host-ruffle-successor-v2-diagnostic",
  );
  assert.equal(result.probe.outputPath, SUCCESSOR_RESULT);
  assert.equal(result.probe.overwritesLegacyDiagnostic, false);
  assert.equal(
    result.lineage.legacyDiagnosticPreserved.before.sha256,
    sha256(legacyBytes),
  );
  assert.deepEqual(
    result.lineage.legacyDiagnosticPreserved.before,
    result.lineage.legacyDiagnosticPreserved.after,
  );
  assert.equal(result.lineage.legacyDiagnosticPreserved.unchanged, true);
  assert.equal(
    result.lineage.staticAntecedent.sha256,
    result.lineage.staticAntecedent.archivedCopy.sha256,
  );
  assert.equal(
    result.lineage.ir001CompletionWindowEvidence.timelineId,
    "sprite-31",
  );
  assert.equal(
    result.lineage.ir001CompletionWindowEvidence.frameCount,
    136,
  );
  assert.ok(
    result.observation.initialCompletionWait == null ||
      result.observation.initialCompletionWait.actualWaitMs >= 12_334,
  );
  assert.ok(result.observation.sourceProvenNextReleaseAttempts <= 7);
  for (let index = 0; index < result.observation.transitions.length; index += 1) {
    const transition = result.observation.transitions[index];
    assert.equal(transition.step, index + 1);
    assert.equal(transition.click.priorExpectedDeliveryComplete, true);
    assert.equal(transition.click.priorSettleComplete, true);
    if (transition.delivery.complete) {
      assert.equal(deliveryIsComplete(transition.delivery), true);
      assert.equal(transition.preloaderSettle.completed, true);
      assert.ok(transition.preloaderSettle.actualWaitMs >= 3_084);
    } else {
      assert.equal(index, result.observation.transitions.length - 1);
      assert.equal(transition.preloaderSettle, null);
    }
  }
  assert.equal(result.containment.containmentBreached, false);
  assert.equal(result.containment.serverUnknownRequestCount, 0);
  assert.equal(result.authority.ruffleForensicReferenceOnly, true);
  assert.equal(result.authority.authoritativeOriginalRuntime, false);
  assert.equal(result.authority.originalRuntimeNaturalTrace, false);
  assert.equal(result.authority.originalRuntimeBaseline, false);
  assert.equal(result.authority.targetBeginHandshakeProven, false);
  assert.equal(result.authority.targetChildDomainEntryProven, false);
  assert.equal(result.authority.audioListeningOrSynchronization, false);
  assert.equal(result.authority.visualFidelity, false);
  assert.equal(result.authority.humanReview, false);
  assert.equal(result.authority.ownerReview, false);
  assert.equal(result.authority.strictCompletion, false);
  assert.equal(result.authority.releaseOrPublication, false);
  assert.equal(result.authority.strictAcceptanceEffect, "none");
  for (const screenshot of result.observation.screenshots) {
    const bytes = await readFile(screenshot.path);
    assert.equal(bytes.length, screenshot.bytes);
    assert.equal(sha256(bytes), screenshot.sha256);
    assert.equal(screenshot.width, 800);
    assert.equal(screenshot.height, 600);
  }
  const metadata = await stat(SUCCESSOR_RESULT);
  assert.equal(metadata.mode & 0o777, 0o444);
});
