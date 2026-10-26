import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  expectedPureLinearScaleoutKeys,
} from './finalize-g678-pure-linear-registration.mjs';

const REPRESENTATIVE = 'shared-alg001-l06-p040';

function authority() {
  return {
    authorizedPlacementIds: [REPRESENTATIVE,
      ...Array.from({length: 156}, (_, index) =>
        `shared-test-l01-p${String(index + 1).padStart(3, '0')}`)],
  };
}

test('172 finalizer derives the exact scaleout set from reviewed authority minus predecessor', () => {
  const predecessor = {selectedPages: [
    {animationId: REPRESENTATIVE},
    ...Array.from({length: 15}, (_, index) => ({
      animationId: `shared-predecessor-l01-p${String(index + 1).padStart(3, '0')}`,
    })),
  ]};
  const keys = expectedPureLinearScaleoutKeys(authority(), predecessor);
  assert.equal(keys.length, 156);
  assert.equal(keys.includes(REPRESENTATIVE), false);
  assert.throws(() => expectedPureLinearScaleoutKeys(authority(), {
    selectedPages: predecessor.selectedPages.slice(1),
  }), /predecessor overlap drifted/u);
  assert.throws(() => expectedPureLinearScaleoutKeys({
    authorizedPlacementIds: authority().authorizedPlacementIds.slice(0, -1),
  }, predecessor), /placement authority drifted/u);
});

test('172 finalizer closes predecessor, authority, run, and member identity bindings', async () => {
  const source = await readFile(new URL(
    './finalize-g678-pure-linear-registration.mjs', import.meta.url),
  'utf8');
  assert.match(source, /predecessorFragment\.value\.freeze/u);
  assert.match(source, /scaleFragment\.value\.reviewedInventory/u);
  assert.match(source, /run\.value\.inputs\.predecessorFreeze/u);
  assert.match(source, /reviewed authority\/fragment\/run member set drifted/u);
  assert.match(source, /manifest\.value\.animationId === entry\.key/u);
  assert.match(source, /validateAdvancedRegistrationAuthority/u);
  assert.match(source, /verifyDescriptorTree\(run\.value\.inputs, 'pureLinearRun\.inputs'\)/u);
  assert.match(source, /verifyDescriptorTree\(predecessorFreeze\.value\.inputs/u);
});
