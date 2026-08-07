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
  devOverlaySuppressionPass,
  normalizeServerMode,
} from "./qa-formula-audio-controls.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PILOTS = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
]);
const hidden = Object.freeze({
  scriptOverlayCount: 1,
  hiddenScriptOverlayCount: 1,
  portalCount: 1,
  hiddenPortalCount: 1,
  shadowRootCount: 1,
  controlCount: 2,
  visibleControlCount: 0,
});

function record() {
  return {
    capturePageOnly: true,
    styleInstalled: true,
    serverMode: "development",
    beforeSuppression: {...hidden, hiddenPortalCount: 0, visibleControlCount: 2},
    afterSuppression: hidden,
    afterCapture: hidden,
  };
}

test("formula audio screenshots reject missing suppression metadata and visible shadow controls", () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /formula-audio-qa-hide-next-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /script\[data-nextjs-dev-overlay\]/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /nextjs-portal/);
  assert.match(DEV_OVERLAY_CONTROL_SELECTOR, /button/);
  const clean = record();
  assert.equal(devOverlaySuppressionPass(clean), true);
  for (const field of ["beforeSuppression", "afterSuppression", "afterCapture"]) {
    const malformed = {...clean};
    delete malformed[field];
    assert.equal(devOverlaySuppressionPass(malformed), false, field);
  }
  assert.equal(devOverlaySuppressionPass({...clean, afterSuppression: {...hidden, visibleControlCount: 1}}), false);
  assert.equal(devOverlaySuppressionPass({...clean, afterCapture: {...hidden, visibleControlCount: 1}}), false);
  assert.equal(devOverlaySuppressionPass({...clean, capturePageOnly: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, styleInstalled: false}), false);
  const malformed = {...hidden};
  delete malformed.portalCount;
  assert.equal(devOverlaySuppressionPass({...clean, afterCapture: malformed}), false);
});

test("formula audio production-mode contract rejects every development-overlay node", () => {
  assert.equal(normalizeServerMode("production"), "production");
  const absent = {
    scriptOverlayCount: 0,
    hiddenScriptOverlayCount: 0,
    portalCount: 0,
    hiddenPortalCount: 0,
    shadowRootCount: 0,
    controlCount: 0,
    visibleControlCount: 0,
  };
  assert.equal(devOverlaySuppressionPass({...record(), serverMode: "production", beforeSuppression: absent, afterSuppression: absent, afterCapture: absent}), true);
  assert.equal(devOverlaySuppressionPass({...record(), serverMode: "production"}), false);
});

test("generated formula audio-control QA is hash-current, overlay-clean, and keeps authoritative listening blocked", async () => {
  const scriptBytes = await readFile(path.join(ROOT, "scripts", "qa-formula-audio-controls.mjs"));
  const helperBytes = await readFile(path.join(ROOT, "scripts", "formula-qa-dev-overlay.mjs"));
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  for (const animationId of PILOTS) {
    const report = JSON.parse(await readFile(path.join(ROOT, "migrations", animationId, "evidence", "product-audio-controls-qa.json"), "utf8"));
    assert.equal(report.generatedBy.scriptSha256, digest(scriptBytes), animationId);
    assert.equal(report.generatedBy.dependencies[0].sha256, digest(helperBytes), animationId);
    assert.equal(report.acceptanceEffect, "none", animationId);
    assert.equal(report.strictAcceptanceEffect, false, animationId);
    assert.equal(report.productQaPassed, true, animationId);
    assert.equal(report.authoritativeAudioListeningGate.status, "blocked", animationId);
    assert.equal(report.authoritativeAudioListeningGate.passed, false, animationId);
    assert.equal(report.assetSync.status, "pass", animationId);
    assert.equal(report.assetSync.passed, true, animationId);
    assert.match(report.assetSync.note, /does not prove authoritative listening/i, animationId);
    assert(Object.values(report.authorityBoundary).every((value) => value === false), animationId);
    for (const [view, screenshot] of Object.entries(report.screenshots)) {
      assert.equal(devOverlaySuppressionPass(screenshot.devOverlaySuppression), true, `${animationId}:${view}`);
    }
    const overlayCheck = report.assertions.find(({id}) => id === "all-evidence-screenshots-have-no-visible-dev-overlay");
    assert.equal(overlayCheck?.pass, true, animationId);
    assert(report.remainingStrictGates.includes("authoritative original indexELM host listening comparison"), animationId);
  }
});
