import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildQuestionAtlasCandidates,
  parseArguments,
  validateQuestionAtlasSpec,
} from "./build-g5-l4-fq23-question-atlas-candidates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IDS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const RUNTIME_HASHES = Object.freeze({
  "course-g05-l04-fq-002":
    "73f1525997c667b351031d6f3e8ec09130970aee57dbe9211735844634b9e809",
  "course-g05-l04-fq-003":
    "6ec31edd28e18b384cc6bd207da94d6480857d5e6e01dc5637c6cb2726a67de8",
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function paths(animationId) {
  return {
    spec: path.join(
      ROOT,
      `migrations/${animationId}/audit/question-atlas-current-js-candidate-spec.json`,
    ),
    runtime: path.join(
      ROOT,
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
    ),
    manifest: path.join(
      ROOT,
      `public/flash-assets/courses/${animationId}/manifest.json`,
    ),
    report: path.join(
      ROOT,
      `migrations/${animationId}/evidence/question-atlas-current-js-candidate.json`,
    ),
  };
}

test("FQ002/FQ003 dedicated CLI and specifications stay bounded", async () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    specs: [
      "migrations/course-g05-l04-fq-002/audit/question-atlas-current-js-candidate-spec.json",
      "migrations/course-g05-l04-fq-003/audit/question-atlas-current-js-candidate-spec.json",
    ],
  });
  assert.deepEqual(parseArguments([
    "--check",
    "--ffdec", "/opt/homebrew/bin/ffdec",
    "--spec",
    "migrations/course-g05-l04-fq-002/audit/question-atlas-current-js-candidate-spec.json",
  ]), {
    check: true,
    ffdec: "/opt/homebrew/bin/ffdec",
    specs: [
      "migrations/course-g05-l04-fq-002/audit/question-atlas-current-js-candidate-spec.json",
    ],
  });
  assert.throws(() => parseArguments(["--publish"]), /unknown argument/);
  assert.throws(() => parseArguments(["--spec"]), /requires one value/);

  for (const animationId of IDS) {
    const spec = validateQuestionAtlasSpec(
      JSON.parse(await readFile(paths(animationId).spec, "utf8")),
    );
    assert.deepEqual(spec.timeline.stage, {
      width: 800,
      height: 600,
      backgroundColor: "#b8d8f7",
    });
    assert.equal(spec.timeline.fps, 12);
    assert.equal(spec.timeline.root.frameCount, 10);
    assert.equal(spec.timeline.root.beginFrame, 6);
    assert.equal(spec.timeline.local.timelineId, "sprite-694");
    assert.equal(spec.timeline.local.frameCount, 56);
    assert.deepEqual(spec.runtimeContract.publicQuestionAtlas, {
      frameDomain: "sprite-694-question-atlas",
      frameCount: 18,
      firstFrame: 1,
      lastFrame: 18,
      sourceTimelineId: "sprite-694",
      sourceFirstFrame: 2,
      sourceLastFrame: 19,
      mapping: "source-frame-equals-atlas-frame-plus-one",
      labels: Array.from({length: 18}, (_, index) => `Q${index + 1}`),
    });
    assert.deepEqual(spec.runtimeContract.sourceStaticStructure, {
      sourceTimelineId: "sprite-694",
      sourceFrameCount: 56,
      doActionFrames: [1, 21, 37],
      placeObject2Count: 861,
      removeObject2Count: 637,
      livePlaybackEndFrame: 1,
      sequentialPlaybackPermitted: false,
    });
    assert.equal(spec.runtimeContract.legacyActionScriptExecuted, false);
    assert.equal(spec.runtimeContract.answerControlsEnabled, false);
    assert.equal(spec.runtimeContract.audioEnabled, false);
    assert.equal(spec.runtimeContract.reportingNetworkEnabled, false);
    assert.ok(Object.values(spec.acceptanceEffects).every((value) => value === false));
    assert.equal(spec.strictAcceptanceEffect, "none");
  }
});

test("generated runtimes and browser QA expose only the 18-page atlas", async () => {
  const frameHashes = [];
  for (const animationId of IDS) {
    const target = paths(animationId);
    const [runtimeBytes, manifest, report] = await Promise.all([
      readFile(target.runtime),
      readFile(target.manifest, "utf8").then(JSON.parse),
      readFile(target.report, "utf8").then(JSON.parse),
    ]);
    const runtime = runtimeBytes.toString("utf8");
    assert.equal(sha256(runtimeBytes), RUNTIME_HASHES[animationId]);
    assert.equal(manifest.output.sha256, RUNTIME_HASHES[animationId]);
    assert.equal(report.output.sha256, RUNTIME_HASHES[animationId]);
    assert.doesNotMatch(
      runtime,
      /place\("sprite16",canvas,ctx,\[0\.05,0\.0,0\.0,0\.05,-158\.25,-58\.05\]/,
    );
    for (const forbidden of [
      "setInterval(",
      "setTimeout(",
      "requestAnimationFrame(",
      "fetch(",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
    ]) assert.equal(runtime.includes(forbidden), false, forbidden);

    const qa = manifest.browserQa;
    assert.match(qa.browser, /^Chromium /);
    assert.equal(qa.renderedAtlasFrameCount, 18);
    assert.deepEqual(qa.renderedSourceFrameRange, [2, 19]);
    assert.equal(qa.frames.length, 18);
    assert.equal(qa.rejectedRequestCount, 8);
    assert.equal(qa.rejectedOperationCount, 16);
    assert.equal(qa.consoleErrorCount, 0);
    assert.equal(qa.pageErrorCount, 0);
    assert.equal(qa.unexpectedNetworkRequestCount, 0);
    assert.equal(qa.productQaComplete, false);
    assert.equal(qa.strictAcceptanceEffect, "none");
    for (const [index, frame] of qa.frames.entries()) {
      assert.equal(frame.atlasFrame, index + 1);
      assert.equal(frame.sourceFrame, index + 2);
      assert.equal(frame.sourceExportFrame, index + 1);
      assert.equal(frame.questionLabel, `Q${index + 1}`);
      assert.equal(frame.opaquePixelCount, 800 * 600);
      assert.match(frame.rgbaFnv1a32, /^[a-f0-9]{8}$/);
      assert.match(frame.pngSha256, /^[a-f0-9]{64}$/);
      assert.ok(frame.pngBytes > 0);
    }
    assert.equal(new Set(qa.frames.map((frame) => frame.pngSha256)).size, 18);
    assert.deepEqual(report.browserQa, qa);
    assert.ok(
      Object.values(manifest.acceptanceEffects).every((value) => value === false),
    );
    assert.ok(
      Object.values(report.acceptanceEffects).every((value) => value === false),
    );
    assert.equal(manifest.strictAcceptanceEffect, "none");
    assert.equal(report.strictAcceptanceEffect, "none");
    frameHashes.push(qa.frames.map((frame) => frame.pngSha256));
  }
  assert.deepEqual(frameHashes[0], frameHashes[1]);
});

test("canonical completion and lesson-release ledgers remain unpromoted", async () => {
  const [completion, release] = await Promise.all([
    readFile(path.join(ROOT, "catalog/completion-ledger.json"), "utf8")
      .then(JSON.parse),
    readFile(path.join(ROOT, "catalog/lesson-release-ledger.json"), "utf8")
      .then(JSON.parse),
  ]);
  for (const animationId of IDS) {
    const completionEntry = completion.diagnostics.find(
      (entry) => entry.animationId === animationId,
    );
    const releaseEntry = release.releases
      .flatMap((lesson) => lesson.members)
      .find(
      (entry) => entry.animationId === animationId,
      );
    assert.equal(completionEntry.status, "preserved");
    assert.ok(completionEntry.errorCount > 0);
    assert.equal(releaseEntry.strictComplete, false);
    assert.equal(releaseEntry.status, "missing");
    assert.equal(releaseEntry.workspace, null);
    assert.equal(releaseEntry.manifestSha256, null);
  }
});

test("checked-in FQ002/FQ003 candidates are deterministic and current", {
  timeout: 60_000,
}, async () => {
  const result = await buildQuestionAtlasCandidates({check: true});
  assert.equal(result.ffdec, "JPEXS Free Flash Decompiler v.26.2.1");
  assert.match(result.chromium, /^Chromium /);
  assert.equal(result.siblingAtlasPixelsEqual, true);
  assert.deepEqual(
    result.results.map((item) => item.animationId),
    IDS,
  );
  assert.ok(result.results.every((item) =>
    item.questionAtlasFrames === 18 &&
    item.browserQa.renderedAtlasFrameCount === 18 &&
    item.browserQa.consoleErrorCount === 0 &&
    item.browserQa.unexpectedNetworkRequestCount === 0 &&
    item.strictAcceptanceEffect === "none"));
});
