import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CAPTURE_STYLE_ID,
  DEV_OVERLAY_CONTROL_SELECTOR,
  buildFormulaQaIdentity,
  devOverlaySuppressionPass,
  normalizeServerMode,
  replayResetIdentityPass,
} from "./qa-formula-pilot-engineering.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PILOTS = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
]);

const cleanSnapshot = Object.freeze({
  scriptOverlayCount: 1,
  hiddenScriptOverlayCount: 1,
  portalCount: 1,
  hiddenPortalCount: 1,
  shadowRootCount: 1,
  controlCount: 2,
  visibleControlCount: 0,
});

const absentSnapshot = Object.freeze({
  scriptOverlayCount: 0,
  hiddenScriptOverlayCount: 0,
  portalCount: 0,
  hiddenPortalCount: 0,
  shadowRootCount: 0,
  controlCount: 0,
  visibleControlCount: 0,
});

function suppressionRecord(serverMode = "development") {
  return {
    capturePageOnly: true,
    styleInstalled: true,
    serverMode,
    beforeSuppression: serverMode === "production" ? absentSnapshot : {...cleanSnapshot, hiddenPortalCount: 0, visibleControlCount: 2},
    afterSuppression: cleanSnapshot,
    afterCapture: cleanSnapshot,
  };
}

function runtime(animationId, identity, frame) {
  return {
    animationId,
    frame: String(frame),
    rootFrame: String(frame),
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    traceId: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: "default",
    language: "en",
    seed: "0",
  };
}

test("formula engineering screenshots fail closed on missing or visible Next dev-overlay evidence", () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /formula-engineering-qa-hide-next-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /script\[data-nextjs-dev-overlay\]/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /nextjs-portal/);
  assert.match(DEV_OVERLAY_CONTROL_SELECTOR, /button/);
  const clean = suppressionRecord();
  assert.equal(devOverlaySuppressionPass(clean), true);
  for (const field of ["beforeSuppression", "afterSuppression", "afterCapture"]) {
    const malformed = {...clean};
    delete malformed[field];
    assert.equal(devOverlaySuppressionPass(malformed), false, field);
  }
  assert.equal(devOverlaySuppressionPass({...clean, capturePageOnly: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, styleInstalled: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, afterSuppression: {...cleanSnapshot, visibleControlCount: 1}}), false);
  assert.equal(devOverlaySuppressionPass({...clean, afterCapture: {...cleanSnapshot, visibleControlCount: 1}}), false);
  const missingCount = {...cleanSnapshot};
  delete missingCount.controlCount;
  assert.equal(devOverlaySuppressionPass({...clean, afterCapture: missingCount}), false);
});

test("formula production-mode screenshots require the development overlay to be entirely absent", () => {
  assert.equal(normalizeServerMode("development"), "development");
  assert.equal(normalizeServerMode("production"), "production");
  assert.throws(() => normalizeServerMode("auto"), /development or production/);
  assert.equal(devOverlaySuppressionPass(suppressionRecord("production")), true);
  assert.equal(devOverlaySuppressionPass({
    ...suppressionRecord("production"),
    beforeSuppression: cleanSnapshot,
  }), false);
});

test("formula Replay evidence binds and resets the complete deterministic identity", () => {
  const pilot = {animationId: PILOTS[0]};
  const identity = buildFormulaQaIdentity(pilot, "unit-replay", "en", 0);
  const proof = {
    pilot,
    identity,
    before: {replay: 0, runtime: runtime(pilot.animationId, identity, 7), candidate: {frame: "7", language: null}},
    reset: {replay: 1, runtime: runtime(pilot.animationId, identity, 1), candidate: {frame: "1", language: null}},
    resumed: {replay: 1, runtime: runtime(pilot.animationId, identity, 2), candidate: {frame: "2", language: null}},
  };
  assert.equal(replayResetIdentityPass(proof), true);
  for (const [part, field, value] of [
    ["reset", "frameDomain", "sprite-1"],
    ["reset", "requirementId", "wrong"],
    ["reset", "traceId", "wrong"],
    ["reset", "entryStateSha256", "f".repeat(64)],
    ["resumed", "scenario", "other"],
    ["resumed", "language", "es"],
    ["before", "seed", "9"],
  ]) {
    const changed = {
      ...proof,
      [part]: {...proof[part], runtime: {...proof[part].runtime, [field]: value}},
    };
    assert.equal(replayResetIdentityPass(changed), false, `${part}.${field}`);
  }
  assert.equal(replayResetIdentityPass({...proof, reset: {...proof.reset, replay: 2}}), false);
  assert.equal(replayResetIdentityPass({...proof, reset: {...proof.reset, candidate: {frame: "2", language: null}}}), false);
});

test("generated formula engineering QA is hash-current, overlay-clean, and acceptance-neutral", async () => {
  const scriptBytes = await readFile(path.join(ROOT, "scripts", "qa-formula-pilot-engineering.mjs"));
  const helperBytes = await readFile(path.join(ROOT, "scripts", "formula-qa-dev-overlay.mjs"));
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  for (const animationId of PILOTS) {
    const evidenceRoot = path.join(ROOT, "migrations", animationId, "evidence");
    const product = JSON.parse(await readFile(path.join(evidenceRoot, "formula-engineering-product-qa.json"), "utf8"));
    const behavior = JSON.parse(await readFile(path.join(evidenceRoot, "formula-engineering-behavior-qa.json"), "utf8"));
    const audioBytes = await readFile(path.join(evidenceRoot, "product-audio-controls-qa.json"));
    assert.equal(product.generator.sha256, digest(scriptBytes), animationId);
    assert.equal(product.generator.dependencies[0].sha256, digest(helperBytes), animationId);
    assert.equal(product.relatedAudioControlQa.sha256, digest(audioBytes), animationId);
    assert.equal(product.acceptanceEffect, "none", animationId);
    assert.equal(product.strictAcceptanceEffect, false, animationId);
    assert.equal(product.authorityBoundary.authoritativeAudioListening, false, animationId);
    assert.equal(product.authorityBoundary.humanVisualReview, false, animationId);
    assert.equal(product.authorityBoundary.ownerAcceptance, false, animationId);
    assert.equal(product.authorityBoundary.strictMigrationCompletion, false, animationId);
    assert.equal(product.engineeringProductQaPassed, true, animationId);
    for (const view of product.responsiveViews) {
      assert.equal(devOverlaySuppressionPass(view.screenshot.devOverlaySuppression), true, `${animationId}:${view.viewport.id}`);
    }
    const overlayCheck = behavior.checks.find(({id}) => id === "native-language-screenshots-have-no-visible-dev-overlay");
    assert.equal(overlayCheck?.pass, true, animationId);
    const replayCheck = behavior.checks.find(({id}) => id === "replay-mouse-enter-space-complete-identity-reset");
    assert.equal(replayCheck?.pass, true, animationId);
    assert(replayCheck.details.activations.every(({pass}) => pass), animationId);
  }
});
