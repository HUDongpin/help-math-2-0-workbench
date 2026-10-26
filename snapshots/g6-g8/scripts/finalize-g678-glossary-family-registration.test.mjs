import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const FREEZE = new URL(
  '../catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.json',
  import.meta.url,
);

test('post-browser freeze binds exactly 45 glossary product-host calibrations without broadening acceptance', async () => {
  const freeze = JSON.parse(await readFile(FREEZE, 'utf8'));
  assert.equal(freeze.registrationCandidatePlacementCount, 261);
  assert.equal(freeze.selectedPages.length, 261);
  assert.equal(freeze.productHostCalibration.familyCalibratedPlacementCount, 45);
  const glossaryPages = freeze.selectedPages.filter((page) =>
    /^ts0[234]-l1-glossary-source-static$/u.test(page.adapterFamily));
  assert.equal(glossaryPages.length, 45);
  assert.equal(glossaryPages.every((page) =>
    page.implementation.familyVisualPlaybackCalibrationPassed === true &&
    page.implementation.typedBilingualGlossaryProductHostCalibrationPassed ===
      true &&
    page.implementation.productCalibrationPassed === false &&
    page.productBlockers.every((blocker) =>
      !blocker.includes('browser-product-calibration-pending'))), true);
  assert.equal(freeze.engineeringPreviewReady, false);
  assert.equal(freeze.productCalibrationPassed, false);
  assert.equal(Object.values(freeze.acceptanceEffects).every((value) =>
    value === false), true);
});
