import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  EXPECTED_FINAL354_REGISTRY,
  validateFinal354RegistrySnapshotBytes,
} from './freeze-g678-final354-private-current-js-registry-witness.mjs';

test('final354 witness is the exact immutable predecessor registry byte set', async () => {
  const bytes = await readFile(new URL(
    '../catalog/product-bridge-calibrations/' +
      'g678-final354-private-current-js-registry-witness-v1.json',
    import.meta.url));
  assert.equal(bytes.length, EXPECTED_FINAL354_REGISTRY.bytes);
  assert.equal(validateFinal354RegistrySnapshotBytes(bytes), true);
  assert.throws(() => validateFinal354RegistrySnapshotBytes(
    Buffer.concat([bytes, Buffer.from('\n')])), /witness bytes drifted/u);
  const changed = Buffer.from(bytes);
  changed[changed.length - 2] ^= 1;
  assert.throws(() => validateFinal354RegistrySnapshotBytes(changed),
    /witness bytes drifted/u);
});
