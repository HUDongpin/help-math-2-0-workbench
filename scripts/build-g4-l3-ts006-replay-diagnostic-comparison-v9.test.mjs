import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {PNG} from "pngjs";

import {
  NEXT_BUTTON_NEUTRAL_PROBE,
  REPLAY_DIAGNOSTIC_FRAME_PAIRS,
  buildG4L3Ts006ReplayDiagnosticComparisonV9,
  classifyNextButtonState,
  compareRgbRegion,
  detectLeftStageOffset,
  parseArguments,
  validateReplayDiagnosticInputs,
  writeG4L3Ts006ReplayDiagnosticComparisonV9,
} from "./build-g4-l3-ts006-replay-diagnostic-comparison-v9.mjs";

function manifestFixtures() {
  const source = {
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    configuration: {
      cursor: "excluded",
      outputWidth: "800",
      outputHeight: "600",
      fps: "12",
    },
    droppedOrIncompleteFrameCount: 0,
    frames: Array.from({length: 477}, (_, index) => ({
      ordinal: index + 1,
      status: "complete",
      width: 800,
      height: 600,
      sha256: "a".repeat(64),
    })),
  };
  const implementation = {
    status: "complete",
    animationId: "course-g04-l03-ts-006",
    frameDomainId: "sprite-23",
    scenario: "manual-runtime-diagnostic-observation",
    language: "en",
    seed: "0",
    captured: REPLAY_DIAGNOSTIC_FRAME_PAIRS.map(({sourceLocalFrame}) => ({
      frame: sourceLocalFrame,
      reportedFrame: sourceLocalFrame,
      reportedAnimationId: "course-g04-l03-ts-006",
      frameDomainId: "sprite-23",
      width: 800,
      height: 600,
      sha256: "b".repeat(64),
    })),
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  return {source, implementation};
}

function solidPng(width, height, [red, green, blue]) {
  const png = new PNG({width, height});
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = red;
    png.data[index + 1] = green;
    png.data[index + 2] = blue;
    png.data[index + 3] = 255;
  }
  return png;
}

test("v9 Replay comparison pins the tentative +162 mapping without promoting it", () => {
  assert.equal(validateReplayDiagnosticInputs(manifestFixtures()), true);
  assert.deepEqual(
    REPLAY_DIAGNOSTIC_FRAME_PAIRS.map(
      ({sourceLocalFrame, captureOrdinal}) => [sourceLocalFrame, captureOrdinal],
    ),
    [
      [1, 163],
      [8, 170],
      [13, 175],
      [55, 217],
      [58, 220],
      [74, 236],
      [77, 239],
      [125, 287],
      [127, 289],
      [128, 290],
    ],
  );
});

test("v9 Replay comparison rejects cursor inclusion and authority promotion", () => {
  const cursorIncluded = manifestFixtures();
  cursorIncluded.source.configuration.cursor = "included";
  assert.throws(
    () => validateReplayDiagnosticInputs(cursorIncluded),
    /cursor excluded/,
  );

  const promoted = manifestFixtures();
  promoted.source.runtimeAuthorityClaimed = true;
  assert.throws(
    () => validateReplayDiagnosticInputs(promoted),
    /acceptance-neutral/,
  );
});

test("stage registration detection and diagnostic alignment are deterministic", () => {
  const source = solidPng(8, 4, [0, 0, 0]);
  const implementation = solidPng(8, 4, [50, 60, 70]);
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 2; x < source.width; x += 1) {
      const index = (y * source.width + x) * 4;
      source.data[index] = 50;
      source.data[index + 1] = 60;
      source.data[index + 2] = 70;
    }
  }
  assert.equal(detectLeftStageOffset(source), 2);
  const raw = compareRgbRegion(source, implementation, {
    x: 0,
    y: 0,
    width: 8,
    height: 4,
  });
  const registered = compareRgbRegion(
    source,
    implementation,
    {x: 0, y: 0, width: 8, height: 4},
    {sourceOffsetX: 2},
  );
  assert.ok(raw.normalizedRmse > 0);
  assert.equal(registered.normalizedRmse, 0);
  assert.equal(registered.comparedPixels, 24);
});

test("neutral Next classifier distinguishes orange from hover-blue", () => {
  const neutral = solidPng(800, 600, [10, 30, 80]);
  const hover = solidPng(800, 600, [10, 30, 80]);
  for (
    let y = NEXT_BUTTON_NEUTRAL_PROBE.centerY - NEXT_BUTTON_NEUTRAL_PROBE.radius;
    y <= NEXT_BUTTON_NEUTRAL_PROBE.centerY + NEXT_BUTTON_NEUTRAL_PROBE.radius;
    y += 1
  ) {
    for (
      let x = NEXT_BUTTON_NEUTRAL_PROBE.centerX - NEXT_BUTTON_NEUTRAL_PROBE.radius;
      x <= NEXT_BUTTON_NEUTRAL_PROBE.centerX + NEXT_BUTTON_NEUTRAL_PROBE.radius;
      x += 1
    ) {
      if (
        (x - NEXT_BUTTON_NEUTRAL_PROBE.centerX) ** 2
          + (y - NEXT_BUTTON_NEUTRAL_PROBE.centerY) ** 2
        > NEXT_BUTTON_NEUTRAL_PROBE.radius ** 2
      ) continue;
      const index = (y * 800 + x) * 4;
      neutral.data[index] = 220;
      neutral.data[index + 1] = 120;
      neutral.data[index + 2] = 20;
      hover.data[index] = 20;
      hover.data[index + 1] = 100;
      hover.data[index + 2] = 210;
    }
  }
  assert.equal(classifyNextButtonState(neutral).state, "neutral-orange");
  assert.equal(classifyNextButtonState(hover).state, "not-verified-neutral");
});

test("live v9 report is acceptance-neutral, regional, cursor-free, and reproducible", async () => {
  const first = await buildG4L3Ts006ReplayDiagnosticComparisonV9();
  const second = await buildG4L3Ts006ReplayDiagnosticComparisonV9();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.originalRuntimeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.authority.coverageChanged, false);
  assert.equal(first.report.authority.ledgerChanged, false);
  assert.equal(
    first.report.summary.cursorExclusion.captureConfiguration,
    "excluded",
  );
  assert.equal(first.report.summary.cursorExclusion.cursorPixelMaskApplied, false);
  assert.equal(first.report.summary.nextButtonNeutral.allSelectedFramesNeutral, true);
  assert.deepEqual(
    first.report.summary.sourceStageRegistration.distinctLeftOffsetsPixels,
    [0, 25],
  );
  for (const comparison of first.report.comparisons) {
    for (const family of ["rawFixedCoordinates", "stageRegisteredDiagnostic"]) {
      for (const region of ["fullFrame", "bodyContent", "header", "footer"]) {
        const metric = comparison.rmse[family][region];
        assert.ok(metric.normalizedRmse >= 0 && metric.normalizedRmse <= 1);
        assert.ok(metric.comparedPixels > 0);
      }
    }
    assert.equal(comparison.nextButton.source.state, "neutral-orange");
    assert.equal(comparison.nextButton.implementation.state, "neutral-orange");
  }
});

test("checked-in v9 report matches the bound source inputs and generator", async () => {
  await writeG4L3Ts006ReplayDiagnosticComparisonV9({check: true});
  const report = JSON.parse(
    await readFile(
      new URL(
        "../reports/g4-l3-ts006-replay-diagnostic-comparison-v9.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    report.bindings.sourceCaptureManifest.path,
    "artifacts/full-frame/g4-l3/ts006-en-native-replay-diagnostic-20260726T213100+0800/capture-manifest.json",
  );
  assert.equal(report.summary.nextButtonNeutral.sourceNeutralFrames, 10);
  assert.equal(report.summary.nextButtonNeutral.implementationNeutralFrames, 10);
});

test("v9 CLI accepts only the fail-closed check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
