import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  EXACT_PID_V13_PROGRESS_ANCHORS,
  assertExactV13DiffArtifactSet,
  buildG4L3Ts006ExactPidImplementationComparisonV13,
  parseArguments,
  validateExactPidV13Inputs,
  validateV13CapturePathColorDiagnostics,
  validateV13ImplementationClosureDelta,
  writeG4L3Ts006ExactPidImplementationComparisonV13,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v13.mjs";

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
    json("reports/g4-l3-ts006-exact-pid-implementation-comparison-v12.json"),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/"
      + "diagnostic-entry-state.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/"
      + "en-diagnostic/capture-manifest.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v12/"
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

test("v13 inherits the bounded v12 progress anchors unchanged", () => {
  assert.deepEqual(
    EXACT_PID_V13_PROGRESS_ANCHORS.map(
      ({candidateFrame, widthPixels}) => [candidateFrame, widthPixels],
    ),
    [
      [1, 0], [8, 4], [13, 7], [55, 41], [58, 43],
      [74, 55], [77, 57], [125, 94], [127, 97], [128, 98],
    ],
  );
});

test("v13 inputs bind a bounded, acceptance-neutral layout increment", async () => {
  const inputs = await liveInputs();
  assert.equal(validateExactPidV13Inputs(inputs), true);

  const promoted = structuredClone(inputs);
  promoted.entryState.authority.authoritativeBaseline = true;
  assert.throws(
    () => validateExactPidV13Inputs(promoted),
    /entry-state identity, anchors, or authority/,
  );

  const rasterSubstitution = structuredClone(inputs);
  rasterSubstitution.entryState.diagnosticCandidateIncrement
    .wholeFrameOrRegionAssetUsed = true;
  assert.throws(
    () => validateExactPidV13Inputs(rasterSubstitution),
    /layout-convergence increment drifted/,
  );

  const sourceStaticContamination = structuredClone(inputs);
  sourceStaticContamination.entryState.diagnosticCandidateIncrement
    .sourceStaticPathAffected = true;
  assert.throws(
    () => validateExactPidV13Inputs(sourceStaticContamination),
    /layout-convergence increment drifted/,
  );
});

test("v13 closure changes only the frozen diagnostic renderer and timeline", async () => {
  const {previousImplementation, implementation} = await liveInputs();
  assert.deepEqual(
    validateV13ImplementationClosureDelta({
      previousImplementation,
      implementation,
    }),
    {
      added: [],
      removed: [],
      changed: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
      ],
      diagnosticLayoutImplementationFiles: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
      ],
      unchangedCurrentJavascriptManifest: {
        path:
          "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
        sha256:
          "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b",
        layoutConvergenceAcceptanceEffect: "none",
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
    () => validateV13ImplementationClosureDelta({
      previousImplementation,
      implementation: prohibited,
    }),
    /must not add implementation artifacts/,
  );
});

test("v13 retains the acceptance-neutral capture-path color diagnostic", async () => {
  const {windowIdCapture, displayExactPidCapture} = await liveInputs();
  assert.equal(
    validateV13CapturePathColorDiagnostics({
      windowIdCapture,
      displayExactPidCapture,
    }),
    true,
  );
});

test("v13 report is deterministic and improves every paired full/header/footer", async () => {
  const first = await buildG4L3Ts006ExactPidImplementationComparisonV13();
  const second = await buildG4L3Ts006ExactPidImplementationComparisonV13();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.boundedIncrement.sourceStaticPathAffected, false);
  assert.equal(first.report.boundedIncrement.colorCalibrationChanged, false);
  assert.equal(first.report.boundedIncrement.progressGeometryChanged, false);
  assert.equal(first.report.boundedIncrement.implementationAssetsAdded, false);
  assert.equal(
    first.report.boundedIncrement.prohibitedRasterSubstitution
      .wholeFrameOrRegionAssetUsed,
    false,
  );
  assert.deepEqual(
    {
      full: first.report.summary.regions.full.mean,
      header: first.report.summary.regions.header.mean,
      footer: first.report.summary.regions.footer.mean,
    },
    {
      full: 0.083940790689,
      header: 0.04588487381,
      footer: 0.122968988318,
    },
  );
  for (const region of ["full", "header", "footer"]) {
    assert.equal(first.report.v12Delta.regions[region].improved, true);
    assert.ok(
      first.report.v12Delta.regions[region].relativeReductionPercent >= 1,
    );
  }
  assert.equal(first.report.v12Delta.regions.body.absoluteReduction, 0);
  assert.ok(
    first.report.v12Delta.perFrame.every(
      (item) =>
        item.full.current <= item.full.previous
        && item.header.current <= item.header.previous
        && item.footer.current <= item.footer.previous,
    ),
  );
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.equal(
    first.report.summary.fourChannelRgbaDiagnostic.acceptanceMetric,
    false,
  );
});

test("checked-in v13 report and full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV13({check: true});
  const report = await json(
    "reports/g4-l3-ts006-exact-pid-implementation-comparison-v13.json",
  );
  const diffNames = report.comparisons.map(
    ({fullFrameDiff}) => fullFrameDiff.file.split("/").at(-1),
  );
  assert.equal(
    assertExactV13DiffArtifactSet(
      diffNames,
      report.comparisons.map(({fullFrameDiff}) => fullFrameDiff),
    ),
    true,
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "ce6c78b3d32e3e5b2e1bd518ec18988dd2e8d8d13a9c2166679a5fd535861f20",
  );
});

test("v13 CLI remains build/check only and rejects promotion modes", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
});
