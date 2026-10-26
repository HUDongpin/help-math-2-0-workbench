import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {algL6P001Descriptor} from '../lib/g678-alg-l06-p001.server';
import {algL6P003HostProbeDescriptor, algL6P003ProbeAudioBase64,
  algL6P003ProbeCanvas} from '../lib/g678-alg-l06-p003-host-probe.server';
import {ALG_L6_P003_CANVAS_SHA256, ALG_L6_P003_ID} from '../lib/g678-alg-l06-p003-probe-access';
import {hasLocalOnlyAnimationModule} from '../../../packages/demos/src/local-only-animation-registry-metadata';

const ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

test('P003 host probe keeps official registry unchanged and binds the exact third page', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = ROOT;
  try {
    const official = algL6P001Descriptor(), probe = algL6P003HostProbeDescriptor();
    assert.equal(hasLocalOnlyAnimationModule(ALG_L6_P003_ID), false);
    assert.equal(official.pages[2]?.rendererAvailability.kind, 'unavailable');
    assert.equal(probe.pages[2]?.rendererAvailability.kind, 'registered');
    assert.equal(probe.pages[2]?.presentation?.pageInteractionCompanionTargetIdSuffix, 'p003-source-readable');
    assert.equal(probe.productBridge.registeredAnimationCount,
      official.productBridge.registeredAnimationCount + 1);
    assert.deepEqual(probe.productBridge.selectedAnimationIds.slice(0, 3),
      ['shared-alg001-l06-p001', 'shared-alg001-l06-p002', ALG_L6_P003_ID]);
    assert.equal(probe.pages[2]?.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
    assert.match(probe.descriptorId, /unregistered-host-probe/u);
    assert.equal(sha(algL6P003ProbeCanvas()), ALG_L6_P003_CANVAS_SHA256);
    assert.deepEqual(algL6P003ProbeAudioBase64().map(value => sha(Buffer.from(value, 'base64'))), [
      'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70',
      '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db',
    ]);
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('P003 host probe is fail-closed without exact source-root binding', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH 2.0/source-assets';
  try {assert.throws(() => algL6P003HostProbeDescriptor(), /real local source root/u);}
  finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});
