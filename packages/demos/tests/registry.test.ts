import assert from 'node:assert/strict';
import test from 'node:test';

import {hasAnimationModule, loadAnimationModule, registeredAnimationKeys} from '../src/animation-registry';

test('generated registry lazily resolves the two legacy prototypes', async () => {
  assert.deepEqual(registeredAnimationKeys, ['conversion-1-2', 'conversion-1-4']);
  assert.equal(hasAnimationModule('conversion-1-2'), true);
  assert.equal(hasAnimationModule('not-a-module'), false);
  const gallon = await loadAnimationModule('conversion-1-2');
  assert.equal(gallon?.key, 'conversion-1-2');
  assert.equal(gallon?.maturity, 'legacy-prototype');
  assert.equal(await loadAnimationModule('not-a-module'), undefined);
});
