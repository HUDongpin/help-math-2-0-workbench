import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {test} from 'node:test';
import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';
import {g678PartialCalibrationSnapshot} from '../lib/g678-calibration-product-bridge.server';
import {GEO_L07_P001_ID, geoL07P001Descriptor, readGeoL07P001Packet} from
  '../lib/g678-geo-l07-p001.server';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('GEO L7 P001 is one source-bound private registration in the real lesson order', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try {
    const before = g678PartialCalibrationSnapshot();
    const base = before.descriptors.find(descriptor =>
      descriptor.course.moduleCode === 'GEO001' && descriptor.course.lesson === 7);
    assert.equal(before.status, 'ready');
    assert.ok(base);
    assert.equal(base.pages[0]?.rendererAvailability.kind, 'unavailable');
    const packet = readGeoL07P001Packet();
    const actual = geoL07P001Descriptor();
    assert.equal(hasLocalOnlyAnimationModule(GEO_L07_P001_ID), true);
    assert.equal(packet.selectedPages.length, 1);
    assert.equal(packet.productCalibrationPassed, false);
    assert.equal(packet.scaleOutAuthorized, false);
    assert.equal(actual.pages.length, 63);
    assert.equal(actual.course.activePageCount, 63);
    assert.equal(actual.pages[0]?.animationId, GEO_L07_P001_ID);
    assert.equal(actual.pages[0]?.nextPlacementId, 'shared-geo001-l07-p002');
    assert.equal(actual.pages[0]?.rendererAvailability.kind, 'registered');
    assert.equal(actual.productBridge.registeredAnimationCount,
      base.productBridge.registeredAnimationCount + 1);
    assert.equal(actual.productBridge.registeredAnimationCount, 5);
    assert.equal(actual.productBridge.selectedAnimationIds[0], GEO_L07_P001_ID);
    assert.equal(actual.pages[0]?.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
    assert.equal(actual.pages[0]?.runtimeEvidenceBoundary?.naturalTraceValidation, 'not-established');
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('exact-source mismatch and production mode deny the private packet', () => {
  const previousRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  try {
    process.env.HELP_MATH_G678_SOURCE_ROOT = '/tmp/not-the-authorized-source';
    assert.throws(() => readGeoL07P001Packet(), /exact source root/);
  } finally {
    if (previousRoot === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previousRoot;
  }
  const child = spawnSync(process.execPath,
    ['--conditions=react-server', '--import', 'tsx', '--input-type=module', '-e',
      `import {readGeoL07P001Packet} from './lib/g678-geo-l07-p001.server.ts';
       try { readGeoL07P001Packet(); process.exitCode = 1; }
       catch (error) { if (!String(error).includes('production closed')) process.exitCode = 1; }`],
    {cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8', timeout: 30_000,
      env: {...process.env, NODE_ENV: 'production', HELP_MATH_G678_SOURCE_ROOT: sourceRoot}});
  assert.equal(child.status, 0, child.stderr);
});
