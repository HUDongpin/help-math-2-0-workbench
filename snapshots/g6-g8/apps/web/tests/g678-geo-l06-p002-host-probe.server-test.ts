import assert from 'node:assert/strict';
import {test} from 'node:test';
import {geoL06P001Descriptor} from '../lib/g678-geo-l06-p001.server';
import {GEO_L06_P002_ID, geoL06P002HostProbeDescriptor} from
  '../lib/g678-geo-l06-p002-host-probe.server';
import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';

const root = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('host probe preserves the official registry count and exact lesson order', () => {
  const before = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = root;
  try {
    const official = geoL06P001Descriptor();
    const probe = geoL06P002HostProbeDescriptor();
    assert.equal(hasLocalOnlyAnimationModule(GEO_L06_P002_ID), false);
    assert.equal(official.pages[1]?.rendererAvailability.kind, 'unavailable');
    assert.equal(probe.pages[1]?.rendererAvailability.kind, 'registered');
    assert.equal(probe.productBridge.registeredAnimationCount,
      official.productBridge.registeredAnimationCount + 1);
    assert.equal(probe.productBridge.selectedAnimationIds[0], 'shared-geo001-l06-p001');
    assert.equal(probe.productBridge.selectedAnimationIds[1], GEO_L06_P002_ID);
    assert.match(probe.descriptorId, /unregistered-host-probe/);
    assert.deepEqual(probe.glossary.map(entry => entry.id).sort(),
      ['area', 'figure', 'surface', 'two-dimensional']);
    assert.equal(probe.pages[1]?.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
  } finally {
    if (before === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = before;
  }
});
