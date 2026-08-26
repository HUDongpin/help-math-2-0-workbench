import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  INPUTS,
  JSON_REPORT_RELATIVE,
  MARKDOWN_REPORT_RELATIVE,
  RELEASE_ID,
  REPORT_TYPE,
  buildReport,
  parseArguments,
  renderMarkdown,
  validateReport,
} from "./build-g4-l10-formal-migration-continuation-v2.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("requires an explicit write or check mode", () => {
  assert.deepEqual(parseArguments(["--write"]), {write: true, check: false});
  assert.deepEqual(parseArguments(["--check"]), {write: false, check: true});
  assert.throws(() => parseArguments([]), /--write\|--check/);
  assert.throws(() => parseArguments(["--write", "--check"]), /--write\|--check/);
});

test("binds v1 and the immutable VB003 manifest, producer, and test", async () => {
  const report = await buildReport();
  assert.equal(report.reportType, REPORT_TYPE);
  assert.equal(report.releaseId, RELEASE_ID);
  assert.equal(report.predecessor.continuationV1Json.sha256,
    INPUTS.continuationV1Json.sha256);
  assert.equal(report.predecessor.continuationV1Markdown.sha256,
    INPUTS.continuationV1Markdown.sha256);
  assert.equal(report.evidenceBindings.vb003CurrentJavascriptDiagnostic.sha256,
    INPUTS.vb003Diagnostic.sha256);
  assert.equal(report.evidenceBindings.vb003Producer.sha256,
    INPUTS.vb003Producer.sha256);
  assert.equal(report.evidenceBindings.vb003FocusedTests.sha256,
    INPUTS.vb003Tests.sha256);
});

test("records the exact 203-frame current-JS census with zero formal effect", async () => {
  const report = await buildReport();
  const delta = report.machineProgressDelta.vb003CurrentJavascriptFullDomainDiagnostic;
  assert.deepEqual({
    frames: delta.diagnosticFramesCaptured,
    files: delta.artifactFileCount,
    pngBytes: delta.totalPngBytes,
    changed: delta.changedConsecutivePairCount,
    identical: delta.identicalConsecutivePairCount,
    unique: delta.uniqueRgbaRasterCount,
  }, {frames: 203, files: 204, pngBytes: 5_148_744, changed: 147, identical: 55, unique: 148});
  assert.equal(delta.formalCapturedFrameCountEffect, 0);
  assert.equal(delta.formalCoverageRequirementEffect, 0);
  assert.equal(delta.formalRendererRegistrationEffect, 0);
  assert.equal(delta.strictCompletionEffect, 0);
  assert.equal(delta.releaseAdmittedMemberEffect, 0);
  assert.equal(delta.formalPublicationEffect, false);
});

test("preserves 47, 44,488, and 520 denominators with every acceptance false", async () => {
  const report = await buildReport();
  const gates = report.formalGateInvariance.gates;
  assert.equal(gates.canonicalReleaseMembership.required, 47);
  assert.equal(gates.authoritativeCapturedCoverageFrames.required, 44_488);
  assert.equal(gates.fullFrameRmseRequirements.required, 520);
  assert.ok(Object.values(report.formalGateInvariance.mutations).every((value) => value === false));
  assert.ok(Object.values(report.authority.acceptanceClaims).every((value) => value === false));
  assert.equal(validateReport(report), true);
});

test("checked-in v2 JSON and Markdown exactly match the deterministic builder", async () => {
  const report = await buildReport();
  const [json, markdown, jsonStat, markdownStat] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE), "utf8"),
    readFile(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE), "utf8"),
    stat(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE)),
    stat(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE)),
  ]);
  assert.equal(json, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(markdown, renderMarkdown(report));
  assert.equal(jsonStat.mode & 0o777, 0o444);
  assert.equal(markdownStat.mode & 0o777, 0o444);
});
