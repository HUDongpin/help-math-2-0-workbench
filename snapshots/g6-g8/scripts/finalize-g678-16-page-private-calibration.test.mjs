import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  REGISTERED_FRAGMENT,
  REGISTERED_FREEZE,
  finalize,
  validateAdvancedRegistrationAuthority,
} from './finalize-g678-16-page-private-calibration.mjs';

test('registered calibration finalizer reproduces the exact current 16-page artifacts', async () => {
  const result = await finalize({check: true});
  assert.equal(result.registrationCandidatePlacementCount, 16);
  assert.equal(result.wholeLessonEngineeringPreviewCount, 0);
  assert.equal(result.productCalibrationPassed, false);
  assert.equal(result.scaleOutAuthorized, false);
  assert.equal(result.freeze.path, REGISTERED_FREEZE);
  assert.equal(result.fragment.path, REGISTERED_FRAGMENT);
});

test('registered freeze keeps full playback endpoints separate from interactive stops', async () => {
  const freeze = JSON.parse(await readFile(new URL(
    `../${REGISTERED_FREEZE}`,
    import.meta.url,
  )));
  assert.equal(freeze.selectedPages.length, 16);
  assert.equal(new Set(freeze.selectedPages.map((page) => page.animationId)).size,
    16);
  assert.equal(new Set(freeze.selectedPages.map((page) => page.stableLessonKey)).size,
    16);
  const nms = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-nms002-l11-p030');
  const dat = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-dat001-l05-p040');
  assert.equal(nms.runtime.livePlaybackEndFrame, 356);
  assert.equal(nms.runtime.interactiveStops[0].stopFrame, 97);
  assert.equal(dat.runtime.livePlaybackEndFrame, 254);
  assert.equal(dat.runtime.interactiveStops[0].stopFrame, 238);
  assert.equal(freeze.productCalibrationPassed, false);
  assert.equal(freeze.engineeringPreviewReady, false);
});

test('advanced registration authority rejects a substituted product-host hash', async () => {
  const fragmentValue = JSON.parse(await readFile(new URL(
    '../catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
    import.meta.url,
  )));
  const runValue = JSON.parse(await readFile(new URL(
    '../work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/run-manifest.json',
    import.meta.url,
  )));
  const substituted = structuredClone(fragmentValue);
  substituted.inputs.productHost.animationRuntime.sha256 = '0'.repeat(64);
  await assert.rejects(
    validateAdvancedRegistrationAuthority({value: substituted},
      {value: runValue}),
    /advancedFragment\.inputs\.productHost\.animationRuntime binding drifted/u,
  );
});

test('registered predecessor continuously rehashes every declared shared input', async () => {
  const source = await readFile(new URL(
    './finalize-g678-16-page-private-calibration.mjs', import.meta.url), 'utf8');
  assert.match(source,
    /verifyDescriptorTree\(sharedFreeze\.value\.inputs, 'sharedFreeze\.inputs'\)/u);
  assert.match(source, /validateAdvancedRegistrationAuthority/u);
});
