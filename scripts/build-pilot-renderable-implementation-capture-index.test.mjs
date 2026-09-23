import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  buildReport,
  renderMarkdown,
  writeOrCheckPilotReports,
} from "./build-pilot-renderable-implementation-capture-index.mjs";

const reportPromise = buildReport();
const execFileAsync = promisify(execFile);

test("re-hashes all currently fully-renderable pilot implementation captures at native size", async () => {
  const report = await reportPromise;
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.evidenceType, "pilot-renderable-current-javascript-implementation-capture-index");
  assert.equal(report.summary.pilotCount, 16);
  assert.equal(report.summary.coverageRequirementCount, 99);
  assert.equal(report.summary.fullyRenderableRequirementCount, 68);
  assert.equal(report.summary.fullyRenderableCapturedRequirementCount, 68);
  assert.equal(report.summary.fullyRenderableFrameCount, 10_790);
  assert.deepEqual(report.summary.fullyRenderableLanguageCounts, {en: 35, es: 33});
  assert.equal(report.summary.allFullyRenderableRequirementsCaptured, true);
  assert.equal(report.summary.validationErrorCount, 0);

  const complete = report.pilots.flatMap(({completeRequirements}) => completeRequirements);
  assert.equal(complete.length, 68);
  assert.equal(complete.reduce((sum, requirement) => sum + requirement.frameSet.frames.length, 0), 10_790);
  for (const requirement of complete) {
    assert.equal(requirement.classification, "fully-renderable-current-javascript-requirement");
    assert.equal(requirement.captureManifest.status, "complete");
    assert.equal(requirement.captureManifest.sha256, requirement.captureManifest.declaredByCoverageSha256);
    assert.equal(requirement.identityVerification.exactFrameRows, requirement.frameSet.frameCount);
    assert.equal(requirement.identityVerification.exactVisualTargetRows, requirement.frameSet.frameCount);
    assert.equal(requirement.identityVerification.readyRenderRows, requirement.frameSet.frameCount);
    assert.deepEqual(requirement.diagnostics, {
      consoleErrors: 0,
      failedRequests: 0,
      httpErrors: 0,
      unexpectedRequests: 0,
      captureError: null,
    });
    assert.equal(requirement.implementationArtifactClosure.currentAndCaptureExact, true);
    assert.equal(requirement.frameSet.frames.length, requirement.selectedRange.lastFrame - requirement.selectedRange.firstFrame + 1);
    for (const frame of requirement.frameSet.frames) {
      assert.equal(frame.width, requirement.nativeStage.width);
      assert.equal(frame.height, requirement.nativeStage.height);
      assert.match(frame.sha256, /^[a-f0-9]{64}$/u);
    }
  }
});

test("keeps the GS002 partial capture separate from the 68 complete requirements", async () => {
  const report = await reportPromise;
  assert.equal(report.summary.partialRequirementCount, 1);
  assert.equal(report.summary.partialFrameCount, 641);
  assert.equal(report.summary.blockedRequirementCount, 30);
  assert.equal(report.summary.captureManifestCountRehashed, 69);
  assert.equal(report.summary.pngCountRehashed, 11_431);

  const partials = report.pilots.flatMap((pilot) =>
    pilot.partialRequirements.map((requirement) => ({animationId: pilot.animationId, ...requirement})));
  assert.equal(partials.length, 1);
  const partial = partials[0];
  assert.equal(partial.animationId, "course-g04-l09-gs-002");
  assert.equal(partial.requirementId, "req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641");
  assert.equal(partial.classification, "supplemental-partial-current-javascript-capture");
  assert.equal(partial.frameSet.frameCount, 641);
  assert.deepEqual(partial.unresolvedFrames, {
    firstFrame: 642,
    lastFrame: 653,
    status: "unresolved",
    reason: "Frames 642 through 653 require AVM1 initialization, question/final state, and host behavior that the static source-drawing adapter does not execute.",
  });
  assert.equal(
    report.pilots.flatMap(({completeRequirements}) => completeRequirements)
      .some(({requirementId}) => requirementId === partial.requirementId),
    false,
  );
});

test("binds current coverage, renderer audits, implementation closures, and every capture manifest", async () => {
  const report = await reportPromise;
  for (const pilot of report.pilots) {
    assert.match(pilot.bindings.manifest.sha256, /^[a-f0-9]{64}$/u);
    assert.match(pilot.bindings.coverage.sha256, /^[a-f0-9]{64}$/u);
    assert.match(pilot.bindings.rendererAudit.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(pilot.bindings.rendererAudit.sourceBindingsRehashed.length >= 7);
    assert.match(pilot.bindings.implementationArtifactClosure.aggregateSha256, /^[a-f0-9]{64}$/u);
    assert.equal(
      pilot.summary.coverageRequirementCount,
      pilot.summary.fullyRenderableRequirementCount
        + pilot.summary.partialRequirementCount
        + pilot.summary.blockedRequirementCount,
    );
  }
  assert.match(report.aggregateEvidence.fullyRenderableFrameRowsSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.aggregateEvidence.partialFrameRowsSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.aggregateEvidence.allRehashedFrameRowsSha256, /^[a-f0-9]{64}$/u);
});

test("remains acceptance-neutral in JSON and Markdown", async () => {
  const report = await reportPromise;
  assert.equal(report.strictAcceptanceEffect, false);
  assert.deepEqual(new Set(Object.values(report.authorityEffects)), new Set([false]));
  for (const pilot of report.pilots) {
    assert.deepEqual(pilot.authority, {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
    });
  }
  const markdown = renderMarkdown(report);
  assert.match(markdown, /68\/68/u);
  assert.match(markdown, /10,790/u);
  assert.match(markdown, /GS002 partial path|course-g04-l09-gs-002/u);
  assert.match(markdown, /original-runtime baseline, RMSE, audio, behavior, product, human, owner/u);
});

test("report publication rejects path escapes, source paths, wrong types, links, and check-mode overwrites", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "pilot-capture-report-output-"));
  t.after(() => rm(fixture, {recursive: true, force: true}));
  const root = path.join(fixture, "project");
  const reports = path.join(root, "reports");
  const sources = path.join(root, "source-assets");
  const outside = path.join(fixture, "outside");
  await Promise.all([
    mkdir(reports, {recursive: true}),
    mkdir(sources, {recursive: true}),
    mkdir(outside, {recursive: true}),
  ]);

  const safeMarkdown = path.join(reports, "safe.md");
  const publish = (jsonOutput, overrides = {}) => writeOrCheckPilotReports({
    projectRoot: root,
    jsonOutput,
    markdownOutput: safeMarkdown,
    expectedJson: "replacement-json\n",
    expectedMarkdown: "replacement-markdown\n",
    ...overrides,
  });

  const outsideSentinel = path.join(outside, "sentinel.json");
  await writeFile(outsideSentinel, "outside sentinel\n");
  await assert.rejects(publish(outsideSentinel), /inside .*reports/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const parentEscape = ["reports", "..", "source-assets", "parent-escape.json"].join(path.sep);
  await assert.rejects(publish(parentEscape), /inside .*reports/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const sourceSentinel = path.join(sources, "source-sentinel.json");
  await writeFile(sourceSentinel, "source sentinel\n");
  await assert.rejects(publish(sourceSentinel), /inside .*reports/u);
  assert.equal(await readFile(sourceSentinel, "utf8"), "source sentinel\n");

  await assert.rejects(publish(path.join(reports, "wrong-extension.md")), /must end in \.json/u);

  await symlink(outside, path.join(reports, "linked-directory"));
  await assert.rejects(
    publish(path.join(reports, "linked-directory", "escaped.json")),
    /symbolic-link path component/u,
  );
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const symlinkTarget = path.join(reports, "symlink-target.json");
  await symlink(outsideSentinel, symlinkTarget);
  await assert.rejects(publish(symlinkTarget), /symbolic-link path component/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const hardlinkSentinel = path.join(outside, "hardlink-sentinel.json");
  const hardlinkTarget = path.join(reports, "hardlink-target.json");
  await writeFile(hardlinkSentinel, "hardlink sentinel\n");
  await link(hardlinkSentinel, hardlinkTarget);
  await assert.rejects(publish(hardlinkTarget), /must not be hard-linked/u);
  assert.equal(await readFile(hardlinkSentinel, "utf8"), "hardlink sentinel\n");

  const fifoTarget = path.join(reports, "fifo-target.json");
  await execFileAsync("mkfifo", [fifoTarget]);
  await assert.rejects(publish(fifoTarget), /existing regular file/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const checkedJson = path.join(reports, "checked.json");
  const checkedMarkdown = path.join(reports, "checked.md");
  await Promise.all([
    writeFile(checkedJson, "checked json sentinel\n"),
    writeFile(checkedMarkdown, "checked markdown sentinel\n"),
  ]);
  await assert.rejects(
    publish(checkedJson, {markdownOutput: checkedMarkdown, check: true}),
    /missing or stale/u,
  );
  assert.equal(await readFile(checkedJson, "utf8"), "checked json sentinel\n");
  assert.equal(await readFile(checkedMarkdown, "utf8"), "checked markdown sentinel\n");
});
