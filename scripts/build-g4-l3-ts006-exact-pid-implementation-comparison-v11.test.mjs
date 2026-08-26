import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  EXACT_PID_V11_PROGRESS_ANCHORS,
  assertExactV11DiffArtifactSet,
  buildG4L3Ts006ExactPidImplementationComparisonV11,
  parseArguments,
  validateExactPidV11Inputs,
  validateV11ImplementationClosureDelta,
  writeG4L3Ts006ExactPidImplementationComparisonV11,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v11.mjs";

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
    json("reports/g4-l3-ts006-exact-pid-implementation-comparison-v10.json"),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/"
      + "diagnostic-entry-state.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v11/"
      + "en-diagnostic/capture-manifest.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v10/"
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

test("v11 pins the bounded progress anchors and keeps frame 128 at 98 px", () => {
  assert.deepEqual(
    EXACT_PID_V11_PROGRESS_ANCHORS.map(
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

test("v11 live inputs retain non-authority and the bounded footer contract", async () => {
  const inputs = await liveInputs();
  assert.equal(validateExactPidV11Inputs(inputs), true);

  const promoted = structuredClone(inputs);
  promoted.entryState.authority.authoritativeBaseline = true;
  assert.throws(
    () => validateExactPidV11Inputs(promoted),
    /entry-state identity, anchors, or authority/,
  );

  const playAtTerminal = structuredClone(inputs);
  playAtTerminal.entryState.diagnosticCandidateIncrement
    .terminalLikePlaybackVisual = "play";
  assert.throws(
    () => validateExactPidV11Inputs(playAtTerminal),
    /footer-convergence increment drifted/,
  );

  const dirtyBrowser = structuredClone(inputs);
  dirtyBrowser.implementation.consoleErrors.push("synthetic failure");
  assert.throws(
    () => validateExactPidV11Inputs(dirtyBrowser),
    /browser or network errors/,
  );
});

test("v11 closure adds only the source-structural thumb assets", async () => {
  const {previousImplementation, implementation} = await liveInputs();
  assert.deepEqual(
    validateV11ImplementationClosureDelta({
      previousImplementation,
      implementation,
    }),
    {
      added: [
        "public/flash-assets/courses/shell-course-g04-l03-index-local/"
        + "sprite-112/manifest.json",
        "public/flash-assets/courses/shell-course-g04-l03-index-local/"
        + "sprite-112/visual-001-0b930c4cdd4b.png",
      ],
      removed: [],
      changed: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
      ],
    },
  );

  const prohibited = structuredClone(implementation);
  prohibited.implementationArtifactClosure.artifacts.push({
    path: "public/flash-assets/ts006-footer-strip.png",
    bytes: 1,
    sha256: "a".repeat(64),
  });
  assert.throws(
    () => validateV11ImplementationClosureDelta({
      previousImplementation,
      implementation: prohibited,
    }),
    /add only the source-structural thumb/,
  );
});

test("v11 report is deterministic, improved, and acceptance-neutral", async () => {
  const first = await buildG4L3Ts006ExactPidImplementationComparisonV11();
  const second = await buildG4L3Ts006ExactPidImplementationComparisonV11();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.boundedIncrement.wholeFrameOrFooterStripAssetUsed, false);
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.ok(first.report.summary.regions.full.mean < 0.095047628928);
  assert.ok(first.report.summary.regions.header.mean < 0.086709016205);
  assert.ok(first.report.summary.regions.footer.mean < 0.136120751039);
  assert.equal(first.report.summary.informationalFullFrameThresholdPasses, 3);
  for (const region of Object.values(first.report.v10Delta.regions)) {
    assert.equal(region.improved, true);
    assert.ok(region.absoluteReduction > 0);
  }
});

test("checked-in v11 report and full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV11({check: true});
  const report = await json(
    "reports/g4-l3-ts006-exact-pid-implementation-comparison-v11.json",
  );
  const diffNames = report.comparisons.map(
    ({fullFrameDiff}) => fullFrameDiff.file.split("/").at(-1),
  );
  assert.equal(
    assertExactV11DiffArtifactSet(
      diffNames,
      report.comparisons.map(({fullFrameDiff}) => fullFrameDiff),
    ),
    true,
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "63a4877e7514dace52340a92fb64cc0098a143d4326c2af5130693a4c04a9cf5",
  );
});

test("v11 CLI remains build/check only and rejects promotion modes", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--baseline-authority"]),
    /Unknown option/,
  );
});
