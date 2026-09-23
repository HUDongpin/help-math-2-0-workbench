import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  EXACT_PID_V12_PROGRESS_ANCHORS,
  assertExactV12DiffArtifactSet,
  buildG4L3Ts006ExactPidImplementationComparisonV12,
  parseArguments,
  validateExactPidV12Inputs,
  validateV12CapturePathColorDiagnostics,
  validateV12ImplementationClosureDelta,
  writeG4L3Ts006ExactPidImplementationComparisonV12,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v12.mjs";

const ROOT = new URL("../", import.meta.url);

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, ROOT), "utf8"));
}

async function liveInputs() {
  const [
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
    previousImplementation,
    windowIdCapture,
    displayExactPidCapture,
  ] = await Promise.all([
    json("reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json"),
    json(
      "artifacts/full-frame/g4-l3/"
      + "ts006-en-exact-pid-replay-complete-diagnostic-20260726T220817+0800/"
      + "capture-manifest.json",
    ),
    json("reports/g4-l3-ts006-exact-pid-implementation-comparison-v11.json"),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v12/"
      + "diagnostic-entry-state.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v12/"
      + "en-diagnostic/capture-manifest.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/"
      + "en-diagnostic/capture-manifest.json",
    ),
    json(
      "artifacts/full-frame/g4-l3/"
      + "ts006-terminal-window-id-diagnostic-pointer-parked-v3/"
      + "capture-manifest.json",
    ),
    json(
      "artifacts/full-frame/g4-l3/"
      + "ts006-terminal-exact-pid-diagnostic-pointer-parked-v4/"
      + "capture-manifest.json",
    ),
  ]);
  return {
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
    previousImplementation,
    windowIdCapture,
    displayExactPidCapture,
  };
}

test("v12 inherits the bounded v11 progress anchors without changing them", () => {
  assert.deepEqual(
    EXACT_PID_V12_PROGRESS_ANCHORS.map(
      ({candidateFrame, widthPixels}) => [candidateFrame, widthPixels],
    ),
    [
      [1, 0],
      [8, 4],
      [13, 7],
      [55, 41],
      [58, 43],
      [74, 55],
      [77, 57],
      [125, 94],
      [127, 97],
      [128, 98],
    ],
  );
});

test("v12 live inputs retain non-authority and bind the diagnostic color contract", async () => {
  const inputs = await liveInputs();
  assert.equal(validateExactPidV12Inputs(inputs), true);

  const promoted = structuredClone(inputs);
  promoted.entryState.authority.authoritativeBaseline = true;
  assert.throws(
    () => validateExactPidV12Inputs(promoted),
    /entry-state identity, anchors, or authority/,
  );

  const authoritativeColor = structuredClone(inputs);
  authoritativeColor.entryState.diagnosticCandidateIncrement
    .originalRuntimeColorPipelineEstablished = true;
  assert.throws(
    () => validateExactPidV12Inputs(authoritativeColor),
    /color-convergence increment drifted/,
  );

  const sourceStaticContamination = structuredClone(inputs);
  sourceStaticContamination.entryState.diagnosticCandidateIncrement
    .sourceStaticPathAffected = true;
  assert.throws(
    () => validateExactPidV12Inputs(sourceStaticContamination),
    /color-convergence increment drifted/,
  );

  const dirtyBrowser = structuredClone(inputs);
  dirtyBrowser.implementation.consoleErrors.push("synthetic failure");
  assert.throws(
    () => validateExactPidV12Inputs(dirtyBrowser),
    /browser or network errors/,
  );
});

test("v12 closure changes only diagnostic code plus the separately rebound current-JS manifest", async () => {
  const {previousImplementation, implementation} = await liveInputs();
  assert.deepEqual(
    validateV12ImplementationClosureDelta({
      previousImplementation,
      implementation,
    }),
    {
      added: [],
      removed: [],
      changed: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
        "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
      ],
      diagnosticColorImplementationFiles: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
      ],
      separatelyReboundCurrentJavascriptManifest: {
        path: "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
        sha256:
          "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b",
        colorCalibrationAcceptanceEffect: "none",
      },
    },
  );

  const prohibited = structuredClone(implementation);
  prohibited.implementationArtifactClosure.artifacts.push({
    path: "public/flash-assets/ts006-footer-strip.png",
    bytes: 1,
    sha256: "a".repeat(64),
  });
  assert.throws(
    () => validateV12ImplementationClosureDelta({
      previousImplementation,
      implementation: prohibited,
    }),
    /must not add implementation artifacts/,
  );
});

test("v12 distinguishes window-ID color diagnostics from display exact-PID diagnostics", async () => {
  const {windowIdCapture, displayExactPidCapture} = await liveInputs();
  assert.equal(
    validateV12CapturePathColorDiagnostics({
      windowIdCapture,
      displayExactPidCapture,
    }),
    true,
  );

  const promoted = structuredClone(displayExactPidCapture);
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(
    () => validateV12CapturePathColorDiagnostics({
      windowIdCapture,
      displayExactPidCapture: promoted,
    }),
    /display exact-PID color diagnostic identity/,
  );
});

test("v12 report is deterministic, improved, and acceptance-neutral", async () => {
  const first = await buildG4L3Ts006ExactPidImplementationComparisonV12();
  const second = await buildG4L3Ts006ExactPidImplementationComparisonV12();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(
    first.report.boundedIncrement.scope,
    "diagnostic-composite-only",
  );
  assert.equal(
    first.report.boundedIncrement.browserImplementation.primitive,
    "svg-feComponentTransfer",
  );
  assert.equal(
    first.report.boundedIncrement.browserImplementation.exponent,
    5 / 6,
  );
  assert.equal(first.report.boundedIncrement.sourceStaticPathAffected, false);
  assert.equal(
    first.report.boundedIncrement.prohibitedRasterSubstitution
      .wholeFrameOrRegionAssetUsed,
    false,
  );
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.ok(first.report.summary.regions.full.mean < 0.091056090);
  assert.ok(first.report.summary.regions.full.mean > 0.05);
  assert.equal(first.report.v11Delta.regions.full.improved, true);
  assert.ok(first.report.v11Delta.regions.full.absoluteReduction > 0);
  assert.ok(
    Math.abs(
      first.report.summary.fourChannelRgbaDiagnostic.mean
        - 0.074735241325,
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(
      first.report.summary.fourChannelRgbaDiagnostic.frame1
        - 0.052173433639,
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(
      first.report.summary.fourChannelRgbaDiagnostic.frame128
        - 0.098308955642,
    ) < 1e-12,
  );
  assert.equal(
    first.report.summary.fourChannelRgbaDiagnostic.acceptanceMetric,
    false,
  );
  assert.equal(
    first.report.capturePathColorDiagnostic.samples.body.windowIdCapture,
    "#b8d8f7",
  );
  assert.equal(
    first.report.capturePathColorDiagnostic.samples.body.displayExactPidCapture,
    "#c2ddfa",
  );
  assert.equal(
    first.report.capturePathColorDiagnostic.samples.footer.windowIdCapture,
    "#1457c7",
  );
  assert.equal(
    first.report.capturePathColorDiagnostic.samples.footer
      .displayExactPidCapture,
    "#1e64d2",
  );
  assert.equal(
    first.report.capturePathColorDiagnostic.authoritativeBaselineEstablished,
    false,
  );
});

test("checked-in v12 report and full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV12({check: true});
  const report = await json(
    "reports/g4-l3-ts006-exact-pid-implementation-comparison-v12.json",
  );
  const diffNames = report.comparisons.map(
    ({fullFrameDiff}) => fullFrameDiff.file.split("/").at(-1),
  );
  assert.equal(
    assertExactV12DiffArtifactSet(
      diffNames,
      report.comparisons.map(({fullFrameDiff}) => fullFrameDiff),
    ),
    true,
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "a258c5b67df0a5393ca2538639b9ab530f6560fad1e0877d122f530b16364d65",
  );
});

test("v12 CLI remains build/check only and rejects promotion modes", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--baseline-authority"]),
    /Unknown option/,
  );
});
