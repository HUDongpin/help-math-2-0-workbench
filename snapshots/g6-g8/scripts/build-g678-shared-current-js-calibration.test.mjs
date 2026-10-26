import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  ACCEPTANCE_EFFECTS,
  CALIBRATION_ID,
  FREEZE_PATH,
  FRAGMENT_PATH,
  OUTPUT_ROOT,
  PROJECT_ROOT,
  parseArguments,
  runCalibration,
} from "./build-g678-shared-current-js-calibration.mjs";

const ADVANCED = Object.freeze([
  "shared-dat001-l05-p040",
  "shared-geo001-l01-p001",
  "shared-nms002-l11-p030",
]);

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(PROJECT_ROOT, relativePath),
    "utf8"));
}

test("generator CLI is create-or-check only", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /usage/u);
  assert.throws(() => parseArguments(["--check", "extra"]), /usage/u);
});

test("check reproduces the exact 13 shared / 3 advanced local-only calibration", async () => {
  const result = await runCalibration({check: true});
  assert.equal(result.calibrationId, CALIBRATION_ID);
  assert.equal(result.frozenPlacementCount, 16);
  assert.equal(result.registrationCandidatePlacementCount, 13);
  assert.equal(result.advancedManualPendingCount, 3);
  assert.equal(result.scaleOutAuthorized, false);
  assert.equal(result.engineeringPreviewReady, false);
  assert.deepEqual(result.acceptanceEffects, ACCEPTANCE_EFFECTS);

  const [freeze, fragment, run] = await Promise.all([
    readJson(FREEZE_PATH),
    readJson(FRAGMENT_PATH),
    readJson(`${OUTPUT_ROOT}/run-manifest.json`),
  ]);
  assert.equal(freeze.schemaVersion, 1);
  assert.equal(freeze.calibrationId, CALIBRATION_ID);
  assert.equal(freeze.deploymentScope, "local-only");
  assert.equal(freeze.status,
    "private-current-js-calibration-candidates-generated");
  assert.equal(freeze.frozenCalibrationPlacementCount, 16);
  assert.equal(freeze.registrationCandidatePlacementCount, 13);
  assert.equal(freeze.scaleOutAuthorized, false);
  assert.equal(freeze.productCalibrationPassed, false);
  assert.equal(freeze.engineeringPreviewReady, false);
  assert.deepEqual(freeze.acceptanceEffects, ACCEPTANCE_EFFECTS);
  assert.equal(freeze.inputs.sourceStaticCanvasHostAdapter.path,
    "packages/demos/src/source-static-canvas-candidate.tsx");
  assert.equal(freeze.selectedPages.length, 13);
  assert.deepEqual(freeze.pendingAdvancedManualPlacements
    .map(({animationId}) => animationId).sort(), [...ADVANCED]);
  for (const page of freeze.selectedPages) {
    for (const key of ["animationId", "placementId", "stableLessonKey",
      "moduleCode", "lessonNumber", "globalPageOrdinal", "sectionCode",
      "sectionPageOrdinal", "complexityLane", "sourceSha256", "assetId",
      "runtime", "runtimeEvidenceBoundary"]) {
      assert.ok(Object.hasOwn(page, key), `${page.animationId}: missing ${key}`);
    }
    assert.equal(page.animationId, page.placementId);
    assert.equal(page.productCalibrationPassed, false);
    assert.equal(page.engineeringPreviewReady, false);
    assert.equal(page.runtime.language, "fixed-en");
    assert.equal(page.runtime.scenario, "source-static-frame");
    assert.equal(page.runtime.seed, "0");
    assert.deepEqual(page.runtime.stage, {width: 800, height: 600});
    assert.match(page.runtime.canvasRenderer.url,
      new RegExp(`^/flash-assets/g678-local/${page.animationId}/canvas-renderer\\.js$`));
    assert.ok(page.productBlockers.length > 0, page.animationId);
  }

  assert.equal(fragment.schemaVersion, 1);
  assert.equal(fragment.calibration.calibrationId, CALIBRATION_ID);
  assert.equal(fragment.calibration.deploymentScope, "local-only");
  assert.equal(fragment.calibration.entries.length, 13);
  assert.equal(fragment.descriptorProjection.registrationCandidatePlacementCount,
    13);
  assert.equal(Object.hasOwn(fragment.descriptorProjection,
    "registeredPlacementCount"), false);
  assert.equal(fragment.descriptorProjection.engineeringPreviewReady, false);
  assert.deepEqual(fragment.acceptanceEffects, ACCEPTANCE_EFFECTS);
  assert.equal(run.sourceRoot.environmentVariable,
    "HELP_MATH_G678_SOURCE_ROOT");
  assert.equal(run.sourceRoot.relativeRoot, "G6-G8-shared");
  assert.equal(run.scope.compiledSharedAdapterPlacementCount, 13);
  assert.equal(run.scope.pendingAdvancedManualPlacementCount, 3);
  assert.equal(run.licenseBoundary.productBundleAdmission,
    "blocked-pending-reviewed-license-boundary");
  assert.equal(run.scaleOutAuthorized, false);
  assert.equal(run.engineeringPreviewReady, false);
  assert.equal(run.productCalibrationPassed, false);
});

test("source root is mandatory and cannot silently fall back to a machine path", async () => {
  const original = process.env.HELP_MATH_G678_SOURCE_ROOT;
  delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  try {
    await assert.rejects(runCalibration({check: true}),
      /HELP_MATH_G678_SOURCE_ROOT is required/u);
  } finally {
    if (original === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = original;
  }
});
