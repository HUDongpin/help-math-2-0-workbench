import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {PNG} from "pngjs";

import {
  EXACT_PID_V14_PROGRESS_ANCHORS,
  assertExactV14DiffArtifactSet,
  buildG4L3Ts006ExactPidImplementationComparisonV14,
  parseArguments,
  validateExactPidV14Inputs,
  validateV14ImplementationClosureDelta,
  writeG4L3Ts006ExactPidImplementationComparisonV14,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v14.mjs";

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
  ] = await Promise.all([
    json("reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json"),
    json(
      "artifacts/full-frame/g4-l3/"
      + "ts006-en-exact-pid-replay-complete-diagnostic-20260726T220817+0800/"
      + "capture-manifest.json",
    ),
    json("reports/g4-l3-ts006-exact-pid-implementation-comparison-v13.json"),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/"
      + "diagnostic-entry-state.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/"
      + "en-diagnostic/capture-manifest.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v13/"
      + "en-diagnostic/capture-manifest.json",
    ),
  ]);
  return {
    analysis,
    source,
    previousReport,
    entryState,
    implementation,
    previousImplementation,
  };
}

function rgbaAt(png, x, y) {
  const offset = ((y * png.width) + x) * 4;
  return [...png.data.subarray(offset, offset + 4)];
}

test("v14 inherits the ten one-indexed sprite-23 progress anchors", () => {
  assert.deepEqual(
    EXACT_PID_V14_PROGRESS_ANCHORS.map(
      ({candidateFrame, widthPixels}) => [candidateFrame, widthPixels],
    ),
    [
      [1, 0], [8, 4], [13, 7], [55, 41], [58, 43],
      [74, 55], [77, 57], [125, 94], [127, 97], [128, 98],
    ],
  );
});

test("v14 inputs bind only the observed strip and table-panel fill changes", async () => {
  const inputs = await liveInputs();
  assert.equal(validateExactPidV14Inputs(inputs), true);

  const inferredOrdinal = structuredClone(inputs);
  inferredOrdinal.entryState.diagnosticCandidateIncrement
    .statusStrip.activeOrdinal = 5;
  assert.throws(
    () => validateExactPidV14Inputs(inferredOrdinal),
    /two-change scope/,
  );

  const promoted = structuredClone(inputs);
  promoted.entryState.authority.authoritativeBaseline = true;
  assert.throws(
    () => validateExactPidV14Inputs(promoted),
    /authority drifted/,
  );

  const rasterSubstitution = structuredClone(inputs);
  rasterSubstitution.entryState.diagnosticCandidateIncrement
    .wholeFrameOrRegionAssetUsed = true;
  assert.throws(
    () => validateExactPidV14Inputs(rasterSubstitution),
    /two-change scope/,
  );

  const domainDrift = structuredClone(inputs);
  domainDrift.entryState.implementationContext.frameDomain = "root";
  assert.throws(
    () => validateExactPidV14Inputs(domainDrift),
    /two-change scope/,
  );
});

test("v14 closure isolates two renderer files from the documented pre-existing manifest drift", async () => {
  const {previousImplementation, implementation} = await liveInputs();
  assert.deepEqual(
    validateV14ImplementationClosureDelta({
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
      boundedImplementationFiles: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
      ],
      preExistingCurrentJavascriptManifestDrift: {
        path:
          "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
        v13HistoricalSha256:
          "55bf13bb3f88270a57d49d2704057bd64880bc927e978c4e0b6d8259678b328b",
        sha256:
          "6d27769d685dcb37b1177d97300311eb3f981929d1f9bbebc1f7cb430fba7063",
        modifiedByV14: false,
        strictAcceptanceEffect: "none",
      },
    },
  );

  const prohibited = structuredClone(implementation);
  prohibited.implementationArtifactClosure.artifacts.push({
    path: "public/flash-assets/ts006-footer-region-strip.png",
    bytes: 1,
    sha256: "a".repeat(64),
  });
  assert.throws(
    () => validateV14ImplementationClosureDelta({
      previousImplementation,
      implementation: prohibited,
    }),
    /must change only/,
  );
});

test("v14 capture contains the exact observed strip pixels and corrected panel output color", async () => {
  const [firstFrameBytes, terminalFrameBytes] = await Promise.all([
    readFile(new URL(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/"
      + "en-diagnostic/frame-001.png",
      ROOT,
    )),
    readFile(new URL(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/"
      + "en-diagnostic/frame-128.png",
      ROOT,
    )),
  ]);
  const firstFrame = PNG.sync.read(firstFrameBytes);
  const terminalFrame = PNG.sync.read(terminalFrameBytes);
  const blocks = [
    [9, [249, 113, 0, 255]],
    [49, [249, 113, 0, 255]],
    [89, [249, 113, 0, 255]],
    [129, [249, 113, 0, 255]],
    [169, [250, 205, 0, 255]],
    [209, [255, 255, 255, 255]],
    [249, [255, 255, 255, 255]],
    [289, [255, 255, 255, 255]],
  ];
  for (const [x, color] of blocks) {
    assert.deepEqual(rgbaAt(firstFrame, x, 535), color);
    assert.deepEqual(rgbaAt(firstFrame, x + 13, 535), color);
    assert.deepEqual(rgbaAt(firstFrame, x + 1, 529), color);
    assert.deepEqual(rgbaAt(firstFrame, x + 12, 529), color);
    assert.deepEqual(rgbaAt(firstFrame, x + 1, 540), color);
    assert.deepEqual(rgbaAt(firstFrame, x + 12, 540), color);
    assert.notDeepEqual(rgbaAt(firstFrame, x, 529), color);
    assert.notDeepEqual(rgbaAt(firstFrame, x + 13, 529), color);
    assert.notDeepEqual(rgbaAt(firstFrame, x, 540), color);
    assert.notDeepEqual(rgbaAt(firstFrame, x + 13, 540), color);
  }
  assert.deepEqual(rgbaAt(terminalFrame, 400, 435), [255, 246, 245, 255]);
  assert.deepEqual(rgbaAt(terminalFrame, 500, 462), [255, 246, 245, 255]);
});

test("v14 report is deterministic and non-regresses every region on all ten frames", async () => {
  const first = await buildG4L3Ts006ExactPidImplementationComparisonV14();
  const second = await buildG4L3Ts006ExactPidImplementationComparisonV14();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.authority.pageOrdinalAuthorityClaimed, false);
  assert.equal(first.report.authority.pageOrdinalMeaning, "unresolved");
  assert.equal(first.report.boundedIncrement.sourceStaticPathAffected, false);
  assert.equal(first.report.boundedIncrement.colorCalibrationChanged, false);
  assert.equal(first.report.boundedIncrement.progressGeometryChanged, false);
  assert.equal(first.report.boundedIncrement.implementationAssetsAdded, false);
  assert.equal(first.report.boundedIncrement.rootOrNestedFrameDomainChanged, false);
  assert.equal(first.report.boundedIncrement.oneBasedFrameContractChanged, false);
  assert.equal(
    first.report.boundedIncrement.prohibitedRasterSubstitution
      .wholeFrameOrRegionAssetUsed,
    false,
  );
  assert.deepEqual(
    {
      full: first.report.summary.regions.full.mean,
      header: first.report.summary.regions.header.mean,
      body: first.report.summary.regions.body.mean,
      footer: first.report.summary.regions.footer.mean,
    },
    {
      full: 0.075683230305,
      header: 0.04588487381,
      body: 0.080463607541,
      footer: 0.074742635343,
    },
  );
  assert.deepEqual(
    {
      full: first.report.v13Delta.regions.full.absoluteReduction,
      header: first.report.v13Delta.regions.header.absoluteReduction,
      body: first.report.v13Delta.regions.body.absoluteReduction,
      footer: first.report.v13Delta.regions.footer.absoluteReduction,
    },
    {
      full: 0.008257560384,
      header: 0,
      body: 0.000096648233,
      footer: 0.048226352975,
    },
  );
  assert.equal(first.report.summary.nonRegressionFrames, 10);
  assert.equal(first.report.summary.allTenFramesNonRegressed, true);
  for (const item of first.report.v13Delta.perFrame) {
    for (const region of ["full", "header", "body", "footer"]) {
      assert.equal(item[region].nonRegressed, true);
    }
    assert.equal(item.full.improved, true);
    assert.equal(item.footer.improved, true);
    assert.equal(item.body.improved, true);
    assert.equal(item.header.improved, false);
  }
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.equal(first.report.summary.implementationBrowserCaptureClean, true);
});

test("checked-in v14 report and full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV14({check: true});
  const report = await json(
    "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.json",
  );
  const diffNames = report.comparisons.map(
    ({fullFrameDiff}) => fullFrameDiff.file.split("/").at(-1),
  );
  assert.equal(
    assertExactV14DiffArtifactSet(
      diffNames,
      report.comparisons.map(({fullFrameDiff}) => fullFrameDiff),
    ),
    true,
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "c719c18f57b89d2f797a2feca24e96fba3c3805fcc75b6731afaf8191c133547",
  );
  assert.equal(
    report.bindings.diagnosticEntryState.sha256,
    "df4d451158585f3497d51b438ca0bf803c1e6a18297b39974f10946c67533d2f",
  );
});

test("v14 CLI remains build/check only and rejects promotion modes", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
  assert.throws(() => parseArguments(["--release"]), /Unknown option/);
});
