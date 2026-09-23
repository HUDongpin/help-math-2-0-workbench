import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";

import {
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CAPTURE_STYLE_ID,
  DEV_OVERLAY_CONTROL_SELECTOR,
  devOverlaySuppressionPass,
} from "./qa-next-dev-overlay.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("shared QA overlay guard rejects missing metadata and visible Next controls", () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /candidate-qa-hide-next-dev-overlay/);
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
  const hidden = { ...before, hiddenPortalCount: 1, visibleControlCount: 0 };
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
    const malformed = { ...hidden };
    delete malformed[field];
    assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: malformed }), false, field);
  }
  assert.equal(devOverlaySuppressionPass({ ...clean, afterSuppression: { ...hidden, visibleControlCount: 1 } }), false);
  assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: { ...hidden, hiddenPortalCount: 0 } }), false);
  assert.equal(devOverlaySuppressionPass({ ...clean, afterCapture: { ...hidden, hiddenScriptOverlayCount: 0 } }), false);
});

test("IR and IN candidate QA reports bind every declared overlay-clean capture without acceptance escalation", async () => {
  for (const [animationId, reportName] of [
    ["course-g04-l01-ir-001", "nextjs-native-candidate-qa.json"],
    ["course-g04-l03-in-009", "native-canvas-candidate-qa.json"],
  ]) {
    const report = JSON.parse(await readFile(path.join(projectRoot, "migrations", animationId, "evidence", reportName), "utf8"));
    assert.equal(report.status, "pass", animationId);
    assert.equal(report.acceptanceEffect, "none", animationId);
    assert.equal(report.strictAcceptanceEffect, false, animationId);
    for (const field of ["audioParity", "spanishParity", "humanVisualReview", "ownerAcceptance", "strictMigrationCompletion"]) {
      assert.equal(report.authorityBoundary[field], false, `${animationId}:${field}`);
    }
    const strictRmseField = Object.keys(report.authorityBoundary).find((field) => /strict.*rmse/i.test(field));
    assert.ok(strictRmseField, `${animationId}:strict-rmse-boundary`);
    assert.equal(report.authorityBoundary[strictRmseField], false, `${animationId}:${strictRmseField}`);
    const allowedTrue = animationId === "course-g04-l01-ir-001"
      ? new Set([
          "authoritativeRootStandaloneBaseline",
          "rootStandaloneCandidateFullFrameRmseComplete",
          "sourceSharedUntranslatedVisual",
        ])
      : new Set(["consumesExistingAuthoritativeRootBaseline"]);
    for (const [field, value] of Object.entries(report.authorityBoundary)) {
      if (value === true) assert.equal(allowedTrue.has(field), true, `${animationId}:${field}`);
    }
    if (animationId === "course-g04-l01-ir-001") {
      assert.equal(report.authorityBoundary.authoritativeRootStandaloneBaseline, true, animationId);
      assert.equal(report.authorityBoundary.rootStandaloneCandidateFullFrameRmseComplete, true, animationId);
      assert.equal(report.authorityBoundary.sourceSharedUntranslatedVisual, true, animationId);
      assert.equal(report.authorityBoundary.spanishParity, false, animationId);
      assert.equal(report.authorityBoundary.audioParity, false, animationId);
      assert.equal(report.authorityBoundary.originalHostParity, false, animationId);
    }
    for (const descriptor of [report.generatedBy, report.captureGuard]) {
      const relative = descriptor.script || descriptor.path;
      const expected = descriptor.scriptSha256 || descriptor.sha256;
      assert.equal(sha256(await readFile(path.join(projectRoot, relative))), expected, `${animationId}:${relative}`);
    }
    const overlayAssertion = report.assertions.find(({ id }) => id === "next-dev-overlay-suppressed-before-and-after-every-screenshot");
    assert.equal(overlayAssertion?.pass, true, animationId);
    assert.equal(overlayAssertion.details.captureCount, overlayAssertion.details.captures.length, animationId);
    assert.ok(overlayAssertion.details.captureCount >= 6, animationId);
    if (animationId === "course-g04-l01-ir-001") {
      assert.equal(overlayAssertion.details.captureCount, 17, animationId);
    }
    for (const capture of overlayAssertion.details.captures) {
      const bytes = await readFile(path.join(projectRoot, capture.path));
      assert.equal(sha256(bytes), capture.sha256, capture.path);
      const png = PNG.sync.read(bytes);
      assert.ok(png.width > 0 && png.height > 0, capture.path);
      assert.equal(devOverlaySuppressionPass(capture.devOverlaySuppression), true, capture.path);
      assert.equal(capture.devOverlaySuppression.afterSuppression.visibleControlCount, 0, capture.path);
      assert.equal(capture.devOverlaySuppression.afterCapture.visibleControlCount, 0, capture.path);
    }
    for (const capture of [report.mobile.screenshot, report.reducedMotion.screenshot]) {
      assert.ok(capture.path.includes("mobile") || capture.path.includes("reduced-motion"), `${animationId}:${capture.path}`);
      assert.equal(devOverlaySuppressionPass(capture.devOverlaySuppression), true, capture.path);
    }
  }
});
