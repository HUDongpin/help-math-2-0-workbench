import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  animationModuleRegistration,
  loadAnimationModule,
} from '../src/animation-registry';

test('G4 L11 loads all 43 private Current-JS page modules in frozen order', async () => {
  const registry = JSON.parse(await readFile(new URL(
    '../private-current-js-registry.json',
    import.meta.url,
  ), 'utf8')) as {
    calibrations: Array<{
      calibrationId: string;
      entries: Array<{key: string}>;
    }>;
  };
  const calibration = registry.calibrations.find(({calibrationId}) =>
    calibrationId === 'g4-l11-page-only-current-js-43-v1'
  )!;
  assert.equal(calibration.calibrationId,
    'g4-l11-page-only-current-js-43-v1');
  assert.equal(calibration.entries.length, 43);
  assert.equal(new Set(calibration.entries.map(({key}) => key)).size, 43);

  for (const {key} of calibration.entries) {
    const module = await loadAnimationModule(key);
    assert.ok(module, `${key}: module did not load`);
    assert.equal(module.key, key);
    assert.equal(module.maturity, 'private-current-js');
    assert.deepEqual(animationModuleRegistration(key), {
      maturity: 'private-current-js',
      scope: 'private-engineering',
      calibrationId: calibration.calibrationId,
    });
  }
});
