import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {test} from 'node:test';
import {g678PartialCalibrationSnapshot} from '../lib/g678-calibration-product-bridge.server';
import {DAT_L02_P002_ID, datL02P002HostProbeDescriptor} from
  '../lib/g678-dat-l02-p002-host-probe.server';
import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';

const root = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('DAT P002 host probe binds one exact page without changing official admission', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = root;
  try {
    const snapshot = g678PartialCalibrationSnapshot();
    const official = snapshot.descriptors.find(item =>
      item.course.moduleCode === 'DAT001' && item.course.lesson === 2);
    assert.equal(snapshot.status, 'ready', snapshot.error ?? 'calibration baseline');
    assert.ok(official);
    const probe = datL02P002HostProbeDescriptor();
    assert.equal(hasLocalOnlyAnimationModule(DAT_L02_P002_ID), false);
    assert.equal(official.pages[1]?.rendererAvailability.kind, 'unavailable');
    assert.equal(probe.pages[1]?.rendererAvailability.kind, 'registered');
    assert.equal(probe.pages.length, 53);
    assert.equal(probe.pages[1]?.source.assetId,
      'swf-b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16');
    assert.equal(probe.productBridge.registeredAnimationCount,
      official.productBridge.registeredAnimationCount + 1);
    assert.equal(probe.pages[1]?.runtimeEvidenceBoundary?.audioAcceptance,
      'not-established');
    assert.match(probe.descriptorId, /unregistered-host-probe/u);
    assert.notEqual(probe.persistence.storageKey, official.persistence.storageKey);
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('DAT P002 host probe fails closed with the compatibility source root', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH 2.0/source-assets';
  try {assert.throws(() => datL02P002HostProbeDescriptor(), /exact physical source root/u);}
  finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('DAT P002 host probe refuses production even with the exact source root', () => {
  const child = spawnSync(process.execPath,
    ['--conditions=react-server', '--import', 'tsx', '--input-type=module', '-e',
      `import {datL02P002HostProbeDescriptor} from './lib/g678-dat-l02-p002-host-probe.server.ts';
       try {datL02P002HostProbeDescriptor(); process.exitCode=1;}
       catch (error) {if (!String(error).includes('local-only')) process.exitCode=1;}`],
    {cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8', timeout: 30_000,
      env: {...process.env, NODE_ENV: 'production', HELP_MATH_G678_SOURCE_ROOT: root}});
  assert.equal(child.status, 0, child.stderr);
});
