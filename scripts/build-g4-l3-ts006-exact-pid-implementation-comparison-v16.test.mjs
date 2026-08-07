import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EXACT_PID_V16_FILTER_COMPOSITING_SPILLOVER_POINTS,
  EXACT_PID_V16_PROGRESS_REGIONS,
  buildG4L3Ts006ExactPidImplementationComparisonV16,
  parseArguments,
  writeG4L3Ts006ExactPidImplementationComparisonV16,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v16.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("v16 exposes the fixed progress regions and fail-closed CLI", () => {
  assert.deepEqual(EXACT_PID_V16_PROGRESS_REGIONS, {
    progressRect: { x: 588, y: 540, width: 117, height: 8 },
    progressWide: { x: 580, y: 532, width: 135, height: 20 },
  });
  assert.equal(EXACT_PID_V16_FILTER_COMPOSITING_SPILLOVER_POINTS.length, 14);
  assert.deepEqual(parseArguments([]), { check: false });
  assert.deepEqual(parseArguments(["--check"]), { check: true });
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/u);
});

test("v16 binds only the inverse-gamma progress refinement and quantifies all ten frames", async () => {
  const { report, markdown, diffArtifacts } =
    await buildG4L3Ts006ExactPidImplementationComparisonV16();

  assert.equal(
    report.reportType,
    "g4-l3-ts006-exact-pid-implementation-comparison-v16",
  );
  assert.equal(report.animationId, "course-g04-l03-ts-006");
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.boundedIncrement.rendererChanged, true);
  assert.equal(report.boundedIncrement.timelineChanged, true);
  assert.equal(report.boundedIncrement.progressThumbChanged, false);
  assert.equal(report.boundedIncrement.progressMappingChanged, false);
  assert.equal(report.boundedIncrement.bodyChanged, false);
  assert.equal(report.boundedIncrement.tableChanged, false);
  assert.equal(report.boundedIncrement.implementationAssetsAdded, false);
  assert.equal(
    report.boundedIncrement.frozenGlobalCurrentJavascriptReportsRefreshed,
    false,
  );
  assert.deepEqual(report.boundedIncrement.implementationClosureDelta.changed, [
    "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
    "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
  ]);
  assert.deepEqual(
    report.boundedIncrement.implementationClosureDelta.added,
    [],
  );
  assert.deepEqual(
    report.boundedIncrement.implementationClosureDelta.removed,
    [],
  );

  assert.deepEqual(report.colorProjection.semanticOutputColors, {
    fill: "#28A4FF",
    track: "#717171",
  });
  assert.deepEqual(report.colorProjection.filterInputColors, {
    fill: "#1C96FF",
    track: "#606060",
  });
  assert.equal(
    report.colorProjection.progressRectanglesRemainInsideFilter,
    true,
  );
  assert.equal(report.colorProjection.thumbChanged, false);
  assert.equal(report.colorProjection.mappingChanged, false);
  assert.equal(
    report.colorProjection.originalRuntimeColorPipelineEstablished,
    false,
  );

  assert.equal(report.summary.comparedFrames, 10);
  assert.equal(report.summary.fullStrictNumericalNonRegressionFrames, 10);
  assert.equal(report.summary.headerPixelIdenticalFrames, 10);
  assert.equal(report.summary.bodyPixelIdenticalFrames, 5);
  assert.equal(report.summary.bodyStrictNumericalNonRegressionFrames, 5);
  assert.equal(
    report.summary.bodyNonRegressionWithinBoundedToleranceFrames,
    10,
  );
  assert.equal(report.summary.footerStrictNumericalNonRegressionFrames, 10);
  assert.equal(
    report.summary.progressRectStrictNumericalNonRegressionFrames,
    10,
  );
  assert.equal(
    report.summary.progressWideStrictNumericalNonRegressionFrames,
    10,
  );
  assert.equal(report.summary.maximumOutsideProgressRectChangedPixels, 14);
  assert.equal(report.summary.maximumOutsideProgressRectChannelDelta, 5);
  assert.equal(
    report.summary.allTenFramesNonRegressedWithinDocumentedContract,
    true,
  );
  assert.equal(
    report.summary.currentImplementationArtifactClosureVerified,
    true,
  );
  assert.equal(report.summary.implementationBrowserCaptureClean, true);
  assert.equal(report.summary.frozenGlobalReportsRefreshed, false);

  assert.equal(report.summary.regions.full.mean, 0.075641807244);
  assert.equal(report.summary.regions.header.mean, 0.04588487381);
  assert.equal(report.summary.regions.body.mean, 0.080463650384);
  assert.equal(report.summary.regions.footer.mean, 0.074466203496);
  assert.equal(report.summary.regions.progressRect.mean, 0.093271873975);
  assert.equal(report.summary.regions.progressWide.mean, 0.080213961063);

  assert.equal(report.v15Delta.regions.full.absoluteReduction, 0.000041423061);
  assert.equal(report.v15Delta.regions.header.absoluteReduction, 0);
  assert.equal(report.v15Delta.regions.body.absoluteReduction, -4.2843e-8);
  assert.equal(report.v15Delta.regions.body.tolerance, 2e-7);
  assert.equal(report.v15Delta.regions.body.nonRegressedWithinTolerance, true);
  assert.equal(
    report.v15Delta.regions.footer.absoluteReduction,
    0.000276431847,
  );
  assert.equal(
    report.v15Delta.regions.progressRect.absoluteReduction,
    0.015863929938,
  );
  assert.equal(
    report.v15Delta.regions.progressWide.absoluteReduction,
    0.00597111622,
  );

  assert.deepEqual(
    report.comparisons.map(
      ({ implementationDelta }) => implementationDelta.changedPixels,
    ),
    [872, 848, 848, 848, 848, 861, 862, 862, 862, 862],
  );
  assert.deepEqual(
    report.comparisons.map(
      ({ implementationDelta }) =>
        implementationDelta.outsideProgressRectChangedPixels,
    ),
    [0, 0, 0, 0, 0, 13, 14, 14, 14, 14],
  );
  assert.ok(
    report.comparisons.every(
      ({ implementationDelta }) =>
        implementationDelta.progressRectChangedPixels > 0 &&
        implementationDelta.headerChangedPixels === 0,
    ),
  );

  assert.equal(
    report.bindings.renderer.sha256,
    "6dd72bfefad560d4164414f25d884ba630426b3edfd27d0065bbcdea328c2d54",
  );
  assert.equal(
    report.bindings.timeline.sha256,
    "c80e7ce77f59d47eadbaf8dd999ba463354311320865f3eacd38b85e614eaf8f",
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "c2e60858fe00525fabf402ab629f1f3e5a29566b58a9bcff337555ac6e2bc2a4",
  );
  assert.equal(
    report.implementationIdentity.entryStateSha256,
    "be1151efe4484e171f608558b0e87cb150c96d568efd91debbd7e6ccb17b80ce",
  );
  assert.equal(
    report.implementationIdentity.requirementId,
    "diagnostic:ts006:exact-pid-v16:en",
  );
  assert.equal(
    report.implementationIdentity.traceId,
    "diagnostic:exact-pid-v16:progress-inverse-gamma:en:seed-0",
  );
  assert.equal(report.authority.authoritativeBaselineClaimed, false);
  assert.equal(report.authority.implementationCandidatePromoted, false);
  assert.equal(report.authority.strictMigrationComplete, false);
  assert.equal(report.authority.publicRelease, false);
  assert.equal(diffArtifacts.length, 10);
  assert.match(markdown, /Strict acceptance effect: \*\*none\*\*/u);
  assert.match(markdown, /13–14 antialiased edge pixels/u);
});

test("v16 generated evidence is current and v15 evidence remains byte-bound", async () => {
  const [v15Report, v15Manifest, v15EntryState] = await Promise.all([
    readFile(
      "reports/g4-l3-ts006-exact-pid-implementation-comparison-v15.json",
    ),
    readFile(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/en-diagnostic/capture-manifest.json",
    ),
    readFile(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/diagnostic-entry-state.json",
    ),
  ]);
  assert.equal(
    sha256(v15Report),
    "054a15afba0ec36ff2b800e97258d994ba73fa2ae0f527a4ec881df450af3c4b",
  );
  assert.equal(
    sha256(v15Manifest),
    "1b38b0007c5f273ccc30d6c1a788412404c4d82940ed8b35115b814d7ef381eb",
  );
  assert.equal(
    sha256(v15EntryState),
    "a14e060d9f13b7e9f31991c1c24d79beacf4869802df897f9fdbb2eeed2f47d6",
  );

  const result = await writeG4L3Ts006ExactPidImplementationComparisonV16({
    check: true,
  });
  assert.equal(result.status, "checked");
  assert.equal(result.report.strictAcceptanceEffect, "none");
});
