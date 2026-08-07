import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {PNG} from "pngjs";

import {
  EXACT_PID_V10_KEYFRAME_PAIRS,
  EXACT_PID_V10_REGIONS,
  assertExactDiffArtifactSet,
  assertFixedRegionContract,
  buildG4L3Ts006ExactPidImplementationComparisonV10,
  compareRgbRegionFixed,
  parseArguments,
  validateExactPidV10Inputs,
  writeG4L3Ts006ExactPidImplementationComparisonV10,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v10.mjs";
import {
  IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
  IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION,
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  implementationArtifactRowsSha256,
} from "./implementation-artifact-closure.mjs";

const ENTRY_SHA =
  "77d2066a534b7902e295549fb4c0062e72fe3cefa4c588b656a684c93e111975";

function falseAuthority() {
  return {
    authorizedNaturalTraceEstablished: false,
    replayInputCausalityEstablished: false,
    sourcePlayheadMappingEstablished: false,
    authoritativeOriginalRuntimeTrace: false,
    authoritativeBaseline: false,
    strictMigrationComplete: false,
    publicRelease: false,
  };
}

function inputFixtures() {
  const analysis = {
    reportType: "g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10",
    animationId: "course-g04-l03-ts-006",
    status: "verified-acceptance-neutral-diagnostic-not-promotion-eligible",
    strictAcceptanceEffect: "none",
    authority: falseAuthority(),
    primaryCapture: {
      frames: {
        count: 537,
        completeFrameCount: 537,
        width: 800,
        height: 600,
        droppedOrIncompleteFrameCount: 0,
      },
      horizontalRegistration: {
        noHorizontalRegistrationDriftDetected: true,
        detectedLeftStageOffsetsPixels: [0],
      },
    },
    replayDiagnostic: {
      observedRevealAnimation: {firstOrdinal: 31, lastOrdinal: 261},
      terminalLikeSuffix: {firstOrdinal: 262},
      sourcePlayheadMappingEstablished: false,
    },
  };
  const source = {
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    configuration: {
      cursor: "excluded",
      sourceKind: "waited-first-window-exact-pid",
      resolvedDisplaySourceRect: "0.0,58.0,800.0,600.0",
      outputWidth: "800",
      outputHeight: "600",
      fps: "12",
    },
    display: {includedProcessID: 97581},
    droppedOrIncompleteFrameCount: 0,
    frames: Array.from({length: 537}, (_, index) => ({
      ordinal: index + 1,
      status: "complete",
      width: 800,
      height: 600,
      file: `frames/frame-${String(index + 1).padStart(6, "0")}.png`,
      sha256: "a".repeat(64),
    })),
  };
  const entryState = {
    stateId:
      "course-g04-l03-ts-006-exact-pid-v10-tentative-piecewise-capture-context",
    animationId: "course-g04-l03-ts-006",
    classification:
      "acceptance-neutral-diagnostic-entry-context-not-original-runtime-entry-state",
    mapping: {
      method: "operator-selected-piecewise-diagnostic-anchors",
      status: "tentative-not-trace-bound-not-source-playhead-authority",
      interpolationAuthorized: false,
      anchors: EXACT_PID_V10_KEYFRAME_PAIRS.map((pair) => ({...pair})),
    },
    authority: falseAuthority(),
    strictAcceptanceEffect: "none",
  };
  const closureArtifacts = [{
    path: "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
    bytes: 1,
    sha256: "c".repeat(64),
  }];
  const closureProjections = [];
  const implementation = {
    schemaVersion: IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
    status: "complete",
    animationId: "course-g04-l03-ts-006",
    sourceUrl:
      "http://127.0.0.1:3214/en/animations/course-g04-l03-ts-006",
    frameDomainId: "sprite-23",
    requirementId: "diagnostic:ts006:exact-pid-v10:en",
    traceId: "diagnostic:exact-pid-v10:tentative-piecewise:en:seed-0",
    entryStateSha256: ENTRY_SHA,
    scenario: "manual-runtime-diagnostic-observation",
    language: "en",
    seed: "0",
    viewport: {width: 800, height: 600, deviceScaleFactor: 1},
    generatorProvenance: {
      schemaVersion: 1,
      script: {
        path: "scripts/capture-animation-keyframes.mjs",
        sha256: "d".repeat(64),
      },
      playwright: {
        package: "@playwright/test",
        version: "1.61.1",
        packageJsonPath: "node_modules/@playwright/test/package.json",
        packageJsonSha256: "e".repeat(64),
      },
      browser: {type: "chromium", version: "149.0.7827.55"},
    },
    implementationArtifactClosure: {
      schemaVersion: IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION,
      algorithm: IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
      artifactCount: closureArtifacts.length,
      projectionCount: closureProjections.length,
      totalBytes: 1,
      aggregateSha256: implementationArtifactRowsSha256(
        closureArtifacts,
        closureProjections,
      ),
      artifacts: closureArtifacts,
      projections: closureProjections,
    },
    captured: EXACT_PID_V10_KEYFRAME_PAIRS.map(({candidateFrame}) => ({
      frame: candidateFrame,
      reportedFrame: candidateFrame,
      reportedAnimationId: "course-g04-l03-ts-006",
      frameDomainId: "sprite-23",
      rootFrame: 6,
      requirementId: "diagnostic:ts006:exact-pid-v10:en",
      traceId: "diagnostic:exact-pid-v10:tentative-piecewise:en:seed-0",
      entryStateSha256: ENTRY_SHA,
      scenario: "manual-runtime-diagnostic-observation",
      language: "en",
      seed: "0",
      flashContextIdentityComplete: true,
      width: 800,
      height: 600,
      reportedRenderState: "ready",
      file: `frame-${String(candidateFrame).padStart(3, "0")}.png`,
      sha256: "b".repeat(64),
      url:
        `http://127.0.0.1:3214/en/animations/course-g04-l03-ts-006`
        + `?frame=${candidateFrame}`
        + `&frameDomain=sprite-23`
        + `&requirementId=diagnostic%3Ats006%3Aexact-pid-v10%3Aen`
        + `&trace=diagnostic%3Aexact-pid-v10%3Atentative-piecewise%3Aen%3Aseed-0`
        + `&entryStateSha256=${ENTRY_SHA}`
        + `&scenario=manual-runtime-diagnostic-observation`
        + `&lang=en&seed=0&capture=1`,
      visualTarget: {
        reportedRenderState: "ready",
        animationId: "course-g04-l03-ts-006",
        reportedFrame: candidateFrame,
        frameDomainId: "sprite-23",
        rootFrame: 6,
        requirementId: "diagnostic:ts006:exact-pid-v10:en",
        traceId: "diagnostic:exact-pid-v10:tentative-piecewise:en:seed-0",
        entryStateSha256: ENTRY_SHA,
        scenario: "manual-runtime-diagnostic-observation",
        language: "en",
        seed: "0",
        flashContextIdentityComplete: true,
      },
    })),
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  return {analysis, source, entryState, implementation};
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

test("v10 pins ten one-based tentative piecewise anchors", () => {
  assert.equal(validateExactPidV10Inputs(inputFixtures()), true);
  assert.deepEqual(
    EXACT_PID_V10_KEYFRAME_PAIRS.map(
      ({candidateFrame, sourceCaptureOrdinal}) => [
        candidateFrame,
        sourceCaptureOrdinal,
      ],
    ),
    [
      [1, 18],
      [8, 31],
      [13, 38],
      [55, 120],
      [58, 125],
      [74, 156],
      [77, 161],
      [125, 253],
      [127, 261],
      [128, 262],
    ],
  );
});

test("v10 rejects authority promotion in the source or diagnostic context", () => {
  const promotedAnalysis = inputFixtures();
  promotedAnalysis.analysis.authority.sourcePlayheadMappingEstablished = true;
  assert.throws(
    () => validateExactPidV10Inputs(promotedAnalysis),
    /authority must remain entirely false/,
  );

  const promotedEntry = inputFixtures();
  promotedEntry.entryState.authority.authoritativeBaseline = true;
  assert.throws(
    () => validateExactPidV10Inputs(promotedEntry),
    /entry-state authority must remain entirely false/,
  );

  const promotedCapture = inputFixtures();
  promotedCapture.source.runtimeAuthorityClaimed = true;
  assert.throws(
    () => validateExactPidV10Inputs(promotedCapture),
    /raw, non-authoritative/,
  );
});

test("v10 requires schema-4 loopback provenance and artifact closure", () => {
  const oldSchema = inputFixtures();
  oldSchema.implementation.schemaVersion = 3;
  assert.throws(
    () => validateExactPidV10Inputs(oldSchema),
    /capture identity drifted/,
  );

  const remote = inputFixtures();
  remote.implementation.sourceUrl =
    "https://example.com/en/animations/course-g04-l03-ts-006";
  assert.throws(
    () => validateExactPidV10Inputs(remote),
    /capture identity drifted/,
  );

  const badProvenance = inputFixtures();
  badProvenance.implementation.generatorProvenance.script.sha256 = "bad";
  assert.throws(
    () => validateExactPidV10Inputs(badProvenance),
    /generator provenance is invalid/,
  );

  const noClosure = inputFixtures();
  delete noClosure.implementation.implementationArtifactClosure;
  assert.throws(
    () => validateExactPidV10Inputs(noClosure),
    /artifact closure is invalid/,
  );
});

test("v10 rejects registration drift, reordered anchors, and frame path escape", () => {
  const drift = inputFixtures();
  drift.analysis.primaryCapture.horizontalRegistration
    .detectedLeftStageOffsetsPixels = [25];
  assert.throws(
    () => validateExactPidV10Inputs(drift),
    /stable zero-pixel/,
  );

  const reordered = inputFixtures();
  reordered.entryState.mapping.anchors.reverse();
  assert.throws(
    () => validateExactPidV10Inputs(reordered),
    /piecewise anchors drifted/,
  );

  const escapedSource = inputFixtures();
  escapedSource.source.frames[17].file = "../frame-000018.png";
  assert.throws(
    () => validateExactPidV10Inputs(escapedSource),
    /source capture frame paths/,
  );

  const escapedImplementation = inputFixtures();
  escapedImplementation.implementation.captured[0].file = "../frame-001.png";
  assert.throws(
    () => validateExactPidV10Inputs(escapedImplementation),
    /implementation keyframes/,
  );
});

test("header, body, and footer partition every native pixel without a mask", () => {
  assert.equal(assertFixedRegionContract(), true);
  assert.deepEqual(EXACT_PID_V10_REGIONS, {
    full: {x: 0, y: 0, width: 800, height: 600},
    header: {x: 0, y: 0, width: 800, height: 108},
    body: {x: 0, y: 108, width: 800, height: 416},
    footer: {x: 0, y: 524, width: 800, height: 76},
  });
  assert.equal(
    ["header", "body", "footer"].reduce(
      (sum, id) =>
        sum + EXACT_PID_V10_REGIONS[id].width
          * EXACT_PID_V10_REGIONS[id].height,
      0,
    ),
    800 * 600,
  );
});

test("fixed RGB RMSE never translates, clips, or excludes pixels", () => {
  const source = solidPng(8, 4, [0, 0, 0]);
  const implementation = solidPng(8, 4, [255, 0, 0]);
  const comparison = compareRgbRegionFixed(
    source,
    implementation,
    {x: 0, y: 0, width: 8, height: 4},
  );
  assert.ok(
    Math.abs(comparison.normalizedRmse - 1 / Math.sqrt(3)) < 1e-12,
  );
  assert.equal(comparison.comparedPixels, 32);
  assert.equal(comparison.mismatchedPixels, 32);
  assert.equal(comparison.excludedPixelCount, 0);
  assert.deepEqual(comparison.registrationOffset, {x: 0, y: 0});
  assert.deepEqual(comparison.sourceRect, comparison.implementationRect);
});

test("transparent pixels remain spatially included in RGB RMSE", () => {
  const source = solidPng(2, 1, [0, 0, 0]);
  const implementation = solidPng(2, 1, [255, 0, 0]);
  source.data[3] = 0;
  implementation.data[3] = 0;
  const comparison = compareRgbRegionFixed(
    source,
    implementation,
    {x: 0, y: 0, width: 2, height: 1},
  );
  assert.ok(comparison.normalizedRmse > 0);
  assert.equal(comparison.comparedPixels, 2);
  assert.equal(comparison.mismatchedPixels, 2);
  assert.equal(comparison.excludedPixelCount, 0);
});

test("v10 rejects stale or unexpected full-stage diff artifacts", () => {
  const expected = EXACT_PID_V10_KEYFRAME_PAIRS.map((pair) => ({
    file:
      `output/playwright/g4-l3-ts006-exact-pid-comparison-v10/diffs/`
      + `source-${String(pair.sourceCaptureOrdinal).padStart(6, "0")}`
      + `-implementation-${String(pair.candidateFrame).padStart(3, "0")}.png`,
  }));
  const exactNames = expected.map(({file}) => file.split("/").at(-1));
  assert.equal(assertExactDiffArtifactSet(exactNames, expected), true);
  assert.throws(
    () => assertExactDiffArtifactSet(
      [...exactNames, "source-000030-implementation-001.png"],
      expected,
    ),
    /stale, missing, or unexpected/,
  );
});

test("live v10 report is fixed-registration, zero-mask, and acceptance-neutral", async () => {
  const first =
    await buildG4L3Ts006ExactPidImplementationComparisonV10();
  const second =
    await buildG4L3Ts006ExactPidImplementationComparisonV10();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.originalRuntimeAuthorityClaimed, false);
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.sourcePlayheadMappingClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.authority.coverageChanged, false);
  assert.equal(first.report.authority.completionLedgerChanged, false);
  assert.equal(first.report.authority.releaseLedgerChanged, false);
  assert.equal(first.report.authority.protectedPinsChanged, false);
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.equal(
    first.report.comparisonContract.masking.spatialPixelMaskApplied,
    false,
  );
  assert.deepEqual(
    first.report.comparisonContract.masking.excludedRectangles,
    [],
  );
  assert.deepEqual(
    first.report.comparisonContract.fixedRegistration.sourceOffset,
    {x: 0, y: 0},
  );
  assert.equal(
    first.report.bindings.diagnosticEntryState.sha256,
    first.report.implementationIdentity.entryStateSha256,
  );
  for (const comparison of first.report.comparisons) {
    assert.equal(comparison.pixelMaskApplied, false);
    assert.equal(comparison.excludedPixelCount, 0);
    assert.deepEqual(comparison.registrationOffset, {x: 0, y: 0});
    for (const region of ["full", "body", "header", "footer"]) {
      const metric = comparison.rmse[region];
      assert.ok(metric.normalizedRmse >= 0 && metric.normalizedRmse <= 1);
      assert.equal(metric.excludedPixelCount, 0);
      assert.deepEqual(metric.sourceRect, metric.implementationRect);
    }
  }
});

test("checked-in v10 reports and full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV10({check: true});
  const report = JSON.parse(
    await readFile(
      new URL(
        "../reports/g4-l3-ts006-exact-pid-implementation-comparison-v10.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    report.bindings.sourceCaptureManifest.sha256,
    "2e2154fd5af712a388fead07e91303c017167152ca1aa7db9f96a31ce6e3c313",
  );
  assert.equal(report.summary.comparedFrames, 10);
  assert.equal(report.summary.implementationBrowserCaptureClean, true);
});

test("v10 CLI exposes only build and fail-closed check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--baseline-authority"]),
    /Unknown option/,
  );
});
