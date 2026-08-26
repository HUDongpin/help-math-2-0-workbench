import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildReport,
  INPUT_REPORT_SHA256,
  JSON_REPORT_RELATIVE,
  MARKDOWN_REPORT_RELATIVE,
  renderMarkdown,
} from "./analyze-g4-l10-vb003-ruffle-v7-target-stability.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("stability analysis binds the immutable seven-step v7 diagnostic", async () => {
  const report = await buildReport();
  assert.equal(report.input.diagnostic.sha256, INPUT_REPORT_SHA256);
  assert.equal(report.input.sevenStepDeliveryObserved, true);
  assert.equal(report.input.targetPath, "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf");
  assert.equal(report.input.intervalMs, 2_082);
});

test("stability analysis confines all target-pair changes to host chrome", async () => {
  const report = await buildReport();
  assert.equal(report.regions.fullPlayer.exactRgbaDifferentPixels, 2_520);
  assert.equal(report.regions.targetContentAboveHostChrome.exactRgbaDifferentPixels, 0);
  assert.equal(report.regions.targetLessonBody.exactRgbaDifferentPixels, 0);
  assert.equal(report.regions.hostChrome.exactRgbaDifferentPixels, 2_520);
  assert.equal(report.regions.targetContentAboveHostChrome.normalizedRgbRmse, 0);
  assert.equal(report.interpretation.allObservedPixelChangeConfinedToHostChrome, true);
});

test("stability analysis does not promote terminal, fidelity, or acceptance", async () => {
  const report = await buildReport();
  assert.equal(report.interpretation.provesRuffleRuntimeTerminal, false);
  assert.equal(report.interpretation.provesBeginHandshake, false);
  assert.equal(report.interpretation.provesChildFrameDomainEntry, false);
  assert.equal(report.interpretation.provesAdobeOriginalRuntime, false);
  assert.equal(report.interpretation.comparesOriginalRuntimeToJavaScript, false);
  assert.equal(report.authority.formalRmseComparison, false);
  assert.equal(report.authority.visualFidelity, false);
  assert.equal(report.authority.humanReview, false);
  assert.equal(report.authority.ownerReview, false);
  assert.equal(report.authority.strictCompletion, false);
  assert.equal(report.authority.wholeLessonIntegration, false);
  assert.equal(report.authority.releaseOrPublication, false);
  assert.equal(report.authority.strictAcceptanceEffect, "none");
});

test("checked-in stability reports are current", async () => {
  const report = await buildReport();
  assert.deepEqual(
    JSON.parse(await readFile(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE), "utf8")),
    report,
  );
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE), "utf8"),
    renderMarkdown(report),
  );
});
