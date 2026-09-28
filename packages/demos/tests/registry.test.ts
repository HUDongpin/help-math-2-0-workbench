import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

import {animationModuleRegistration, hasAnimationModule, loadAnimationModule, privateRegisteredAnimationKeys, registeredAnimationKeys} from '../src/animation-registry';

test('generated registry preserves the declared prototype and private memberships without granting strict acceptance', async () => {
  const prototypes = JSON.parse(await readFile(new URL('../prototype-registry.json', import.meta.url), 'utf8'));
  const privateRegistry = JSON.parse(await readFile(new URL('../private-current-js-registry.json', import.meta.url), 'utf8'));
  const prototypeKeys = prototypes.entries.map((entry: {key: string}) => entry.key);
  const privateKeys = privateRegistry.calibrations.flatMap((calibration: {entries: {key: string}[]}) => calibration.entries.map((entry) => entry.key));
  const expectedKeys = [...prototypeKeys, ...privateKeys].sort();
  assert.equal(new Set(expectedKeys).size, expectedKeys.length);
  assert.deepEqual([...registeredAnimationKeys].sort(), expectedKeys);
  assert.deepEqual([...privateRegisteredAnimationKeys].sort(), [...privateKeys].sort());
  for (const key of prototypeKeys) assert.equal(animationModuleRegistration(key)?.scope, 'prototype');
  for (const key of privateKeys) {
    assert.equal(animationModuleRegistration(key)?.scope, 'private-engineering');
    assert.equal(animationModuleRegistration(key)?.maturity, 'private-current-js');
  }
  assert.equal(hasAnimationModule('conversion-1-2'), true);
  assert.equal(hasAnimationModule('not-a-module'), false);
  const gallon = await loadAnimationModule('conversion-1-2');
  assert.equal(gallon?.key, 'conversion-1-2');
  assert.equal(gallon?.maturity, 'legacy-prototype');
  assert.equal(await loadAnimationModule('not-a-module'), undefined);
});
