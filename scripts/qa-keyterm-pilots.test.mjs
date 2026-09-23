import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";

import {
  AUTHORITY_CLAIM_KEYS,
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CAPTURE_STYLE_ID,
  DEV_OVERLAY_CONTROL_SELECTOR,
  allClaimsFalse,
  buildKeytermQaIdentity,
  classifyKeytermFailedRequest,
  devOverlaySuppressionPass,
  isExactComputeReplayHoverAsset,
  normalizeLoopbackBaseUrl,
  parseArguments,
  replayResetIdentityPass,
} from "./qa-keyterm-pilots.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pilots = Object.freeze([
  Object.freeze({ animationId: "keyterm-elementary-acute-angle", replayCount: 3 }),
  Object.freeze({ animationId: "keyterm-elementary-computeghgh", replayCount: 6 }),
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("keyterm QA CLI accepts only unembellished loopback origins", () => {
  assert.equal(normalizeLoopbackBaseUrl("http://localhost:3213"), "http://localhost:3213");
  assert.equal(normalizeLoopbackBaseUrl("http://127.0.0.1:3213/"), "http://127.0.0.1:3213");
  assert.equal(normalizeLoopbackBaseUrl("http://[::1]:3213"), "http://[::1]:3213");
  assert.deepEqual(parseArguments(["--help"]), { baseUrl: "http://localhost:3213", ids: [], help: true });
  assert.equal(parseArguments(["--base-url", "http://localhost:4000"]).baseUrl, "http://localhost:4000");
  assert.throws(() => normalizeLoopbackBaseUrl("https://example.com"), /loopback/);
  assert.throws(() => normalizeLoopbackBaseUrl("file:///tmp/report"), /http or https/);
  assert.throws(() => normalizeLoopbackBaseUrl("http://localhost:3213/path"), /without credentials/);
  assert.throws(() => normalizeLoopbackBaseUrl("http://user@localhost:3213"), /without credentials/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("keyterm QA separates only superseded same-origin acute frame images from real request failures", () => {
  const baseOrigin = "http://localhost:3427";
  assert.equal(classifyKeytermFailedRequest({
    url: `${baseOrigin}/flash-assets/keyterms/acute-angle/frames/28.png`,
    error: "net::ERR_ABORTED",
    resourceType: "image",
  }, baseOrigin), "superseded-frame-image");
  for (const record of [
    { url: `${baseOrigin}/flash-assets/keyterms/acute-angle/frames/0.png`, error: "net::ERR_ABORTED", resourceType: "image" },
    { url: `${baseOrigin}/flash-assets/keyterms/acute-angle/frames/61.png`, error: "net::ERR_ABORTED", resourceType: "image" },
    { url: `${baseOrigin}/flash-assets/keyterms/acute-angle/frames/28.png`, error: "net::ERR_FAILED", resourceType: "image" },
    { url: `${baseOrigin}/flash-assets/keyterms/acute-angle/frames/28.png`, error: "net::ERR_ABORTED", resourceType: "script" },
    { url: `${baseOrigin}/flash-assets/keyterms/computeghgh/frame.png`, error: "net::ERR_ABORTED", resourceType: "image" },
    { url: "https://example.test/flash-assets/keyterms/acute-angle/frames/28.png", error: "net::ERR_ABORTED", resourceType: "image" },
  ]) {
    assert.equal(classifyKeytermFailedRequest(record, baseOrigin), "failure", record.url);
  }
});

test("keyterm QA waits only for the exact same-origin compute Replay hover asset", () => {
  const baseOrigin = "http://127.0.0.1:3427";
  assert.equal(
    isExactComputeReplayHoverAsset(
      `${baseOrigin}/flash-assets/keyterms/computeghgh/buttons/over.svg`,
      baseOrigin,
    ),
    true,
  );
  for (const url of [
    `${baseOrigin}/flash-assets/keyterms/computeghgh/buttons/up.svg`,
    `${baseOrigin}/flash-assets/keyterms/computeghgh/buttons/down.svg`,
    `${baseOrigin}/flash-assets/keyterms/computeghgh/buttons/over.svg?cache=1`,
    "http://localhost:3427/flash-assets/keyterms/computeghgh/buttons/over.svg",
    "https://example.test/flash-assets/keyterms/computeghgh/buttons/over.svg",
    "not a url",
  ]) {
    assert.equal(isExactComputeReplayHoverAsset(url, baseOrigin), false, url);
  }
});

test("keyterm deterministic identities bind the complete root-domain capture contract", () => {
  const pilot = pilots[0];
  const request = { purpose: "unit", frame: 60, scenario: "default", language: "es", seed: 7 };
  const identity = buildKeytermQaIdentity(pilot, request);
  assert.equal(identity.frameDomain, "root");
  assert.equal(identity.requirementId, `qa:keyterm:${pilot.animationId}:unit:default:es`);
  assert.equal(identity.traceId, `qa-trace:keyterm:${pilot.animationId}:unit:default:es:seed-7`);
  assert.deepEqual(identity.entryState, {
    kind: "keyterm-engineering-candidate-product-qa",
    animationId: pilot.animationId,
    purpose: "unit",
    frameDomain: "root",
    frame: 60,
    scenario: "default",
    language: "es",
    seed: 7,
  });
  assert.equal(identity.entryStateSha256, sha256(JSON.stringify(identity.entryState)));
  assert.equal(buildKeytermQaIdentity(pilot, request).entryStateSha256, identity.entryStateSha256);
});

test("keyterm screenshot evidence rejects missing metadata and every visible overlay state", () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /keyterm-qa-hide-next-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /script\[data-nextjs-dev-overlay\]/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /nextjs-portal/);
  assert.match(DEV_OVERLAY_CONTROL_SELECTOR, /button/);
  const before = {
    scriptOverlayCount: 1,
    hiddenScriptOverlayCount: 1,
    portalCount: 1,
    hiddenPortalCount: 0,
    shadowRootCount: 1,
    controlCount: 2,
    visibleControlCount: 1,
  };
  const hidden = {
    ...before,
    hiddenPortalCount: 1,
    visibleControlCount: 0,
  };
  const clean = {
    capturePageOnly: true,
    styleInstalled: true,
    beforeSuppression: before,
    afterSuppression: hidden,
    afterCapture: hidden,
  };
  assert.equal(devOverlaySuppressionPass(clean), true);
  for (const field of ["beforeSuppression", "afterSuppression", "afterCapture"]) {
    const malformed = { ...clean };
    delete malformed[field];
    assert.equal(devOverlaySuppressionPass(malformed), false, field);
  }
  for (const field of ["capturePageOnly", "styleInstalled"]) {
    assert.equal(devOverlaySuppressionPass({ ...clean, [field]: false }), false, field);
  }
  for (const field of ["scriptOverlayCount", "hiddenScriptOverlayCount", "portalCount", "hiddenPortalCount", "shadowRootCount", "controlCount", "visibleControlCount"]) {
    const malformedState = { ...hidden };
    delete malformedState[field];
    assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: malformedState }), false, field);
  }
  assert.equal(devOverlaySuppressionPass({ ...clean, afterSuppression: { ...hidden, visibleControlCount: 1 } }), false);
  assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: { ...hidden, hiddenPortalCount: 0 } }), false);
  assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: { ...hidden, hiddenScriptOverlayCount: 0 } }), false);
});

test("keyterm Replay proof rejects drift in frameDomain, requirement, trace, entry state, scenario, language, or seed", () => {
  const pilot = pilots[1];
  const scenario = "default";
  const language = "en";
  const seed = 7;
  const identity = buildKeytermQaIdentity(pilot, { purpose: "replay-unit", frame: 1, scenario, language, seed });
  const runtime = (frame) => ({
    animationId: pilot.animationId,
    frame: String(frame),
    rootFrame: String(frame),
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    traceId: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario,
    language,
    seed: String(seed),
  });
  const candidate = (frame) => ({ frame: String(frame), language });
  const proof = {
    pilot,
    identity,
    scenario,
    language,
    seed,
    before: { replay: 0, runtime: runtime(4), candidate: candidate(4) },
    reset: { replay: 1, runtime: runtime(1), candidate: candidate(1) },
    resumed: { replay: 1, runtime: runtime(2), candidate: candidate(2) },
  };
  assert.equal(replayResetIdentityPass(proof), true);
  for (const [part, field, value] of [
    ["reset", "frameDomain", "sprite-1"],
    ["reset", "requirementId", "wrong"],
    ["reset", "traceId", "wrong"],
    ["reset", "entryStateSha256", "f".repeat(64)],
    ["resumed", "scenario", "other"],
    ["resumed", "language", "es"],
    ["before", "seed", "8"],
  ]) {
    const changed = {
      ...proof,
      [part]: { ...proof[part], runtime: { ...proof[part].runtime, [field]: value } },
    };
    assert.equal(replayResetIdentityPass(changed), false, `${part}.${field}`);
  }
  assert.equal(replayResetIdentityPass({ ...proof, reset: { ...proof.reset, replay: 2 } }), false);
  assert.equal(replayResetIdentityPass({ ...proof, reset: { ...proof.reset, candidate: { frame: "2", language } } }), false);
});

test("authority helper accepts exactly the declared all-false engineering boundary", () => {
  const claims = Object.fromEntries(AUTHORITY_CLAIM_KEYS.map((key) => [key, false]));
  assert.equal(allClaimsFalse(claims), true);
  assert.equal(allClaimsFalse({ ...claims, ownerAcceptance: true }), false);
  assert.equal(allClaimsFalse({ ...claims, inventedClaim: false }), false);
  const { audioParity: _removed, ...missing } = claims;
  assert.equal(allClaimsFalse(missing), false);
  assert.equal(allClaimsFalse(null), false);
});

test("generated keyterm browser QA is hash-current, overlay-clean, identity-complete, and fail-closed", async () => {
  for (const pilot of pilots) {
    const workspace = path.join(projectRoot, "migrations", pilot.animationId);
    const reportPath = path.join(workspace, "evidence", "keyterm-engineering-qa.json");
    const reportBytes = await readFile(reportPath);
    const report = JSON.parse(reportBytes);
    assert.equal(report.schemaVersion, 2, pilot.animationId);
    assert.equal(report.evidenceKind, "keyterm-engineering-candidate-product-qa", pilot.animationId);
    assert.equal(report.status, "pass", pilot.animationId);
    assert.equal(report.acceptanceEffect, "none", pilot.animationId);
    assert.equal(report.strictAcceptanceEffect, false, pilot.animationId);
    assert.equal(report.migrationStatusChanged, false, pilot.animationId);
    assert.equal(report.migrationStatusBefore, report.migrationStatusAfter, pilot.animationId);
    assert.equal(report.scope.evidenceClass, "candidate/engineering only", pilot.animationId);
    assert.equal(allClaimsFalse(report.claims), true, pilot.animationId);
    assert.ok(Object.values(report.authorityBoundary).every((value) => value === false), pilot.animationId);
    assert.ok(report.assertions.length >= 22, pilot.animationId);
    assert.ok(report.assertions.every(({ pass }) => pass === true), pilot.animationId);

    const generatedBytes = await readFile(path.join(projectRoot, report.generatedBy.script));
    assert.equal(sha256(generatedBytes), report.generatedBy.scriptSha256, pilot.animationId);
    const sourceBytes = await readFile(path.join(projectRoot, report.source.path));
    assert.equal(sha256(sourceBytes), report.source.sha256, pilot.animationId);
    assert.equal(report.source.sha256, report.source.expectedSha256, pilot.animationId);
    for (const dependency of report.implementation) {
      const bytes = await readFile(path.join(projectRoot, dependency.path));
      assert.equal(sha256(bytes), dependency.sha256, dependency.path);
      assert.equal(bytes.length, dependency.bytes, dependency.path);
    }

    assert.equal(report.behavior.replay.length, pilot.replayCount, pilot.animationId);
    for (const replay of report.behavior.replay) {
      assert.equal(replay.pass, true, `${pilot.animationId}:${replay.control}:${replay.input}`);
      assert.equal(replayResetIdentityPass({
        pilot,
        before: replay.before,
        reset: replay.reset,
        resumed: replay.resumed,
        identity: replay.identity,
        scenario: replay.expectedContext.scenario,
        language: replay.expectedContext.language,
        seed: replay.expectedContext.seed,
      }), true, `${pilot.animationId}:${replay.control}:${replay.input}`);
    }
    assert.ok(report.responsive.every((entry) => entry.pass && entry.identityMatched), pilot.animationId);
    assert.equal(report.reducedMotion.pass, true, pilot.animationId);
    assert.deepEqual(report.diagnostics.consoleErrors, [], pilot.animationId);
    assert.deepEqual(report.diagnostics.pageErrors, [], pilot.animationId);
    assert.deepEqual(report.diagnostics.failedRequests, [], pilot.animationId);
    assert.ok(Array.isArray(report.diagnostics.supersededFrameRequests), pilot.animationId);
    for (const request of report.diagnostics.supersededFrameRequests) {
      assert.equal(classifyKeytermFailedRequest(request, report.browser.baseUrl), "superseded-frame-image", request.url);
    }
    assert.deepEqual(report.diagnostics.httpErrors, [], pilot.animationId);
    assert.deepEqual(report.diagnostics.unexpectedRequests, [], pilot.animationId);
    assert.deepEqual(report.diagnostics.audioRequests, [], pilot.animationId);

    for (const required of ["desktop", "tablet", "mobile", "native", "reducedMotion"]) {
      assert.ok(report.screenshots[required], `${pilot.animationId}:${required}`);
    }
    const captures = Object.values(report.screenshots);
    for (const capture of captures) {
      const bytes = await readFile(path.join(projectRoot, capture.path));
      assert.equal(sha256(bytes), capture.sha256, capture.path);
      const png = PNG.sync.read(bytes);
      assert.equal(png.width, capture.width, capture.path);
      assert.equal(png.height, capture.height, capture.path);
      assert.equal(devOverlaySuppressionPass(capture.devOverlaySuppression), true, capture.path);
      assert.equal(capture.devOverlaySuppression.afterSuppression.visibleControlCount, 0, capture.path);
      assert.equal(capture.devOverlaySuppression.afterCapture.visibleControlCount, 0, capture.path);
    }

    const reportHash = sha256(reportBytes);
    for (const qaName of ["behavior-qa.json", "product-qa.json"]) {
      const qa = JSON.parse(await readFile(path.join(workspace, "evidence", qaName), "utf8"));
      assert.equal(qa.status, "pass", `${pilot.animationId}:${qaName}`);
      assert.equal(qa.strictAcceptanceEffect, false, `${pilot.animationId}:${qaName}`);
      assert.ok(Object.values(qa.authorityBoundary).every((value) => value === false), `${pilot.animationId}:${qaName}`);
      for (const check of qa.checks) {
        for (const evidence of check.evidence) {
          if (evidence.path === "evidence/keyterm-engineering-qa.json") {
            assert.equal(evidence.sha256, reportHash, `${pilot.animationId}:${qaName}:${check.id}`);
          }
        }
      }
    }
  }
});
