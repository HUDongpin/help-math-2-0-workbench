import assert from 'node:assert/strict';
import test from 'node:test';

import {
  animationModuleRegistration,
  loadAnimationModule,
  registeredPrivateCurrentJsAnimationKeys,
} from '../src/animation-registry';

const lessonKeys = registeredPrivateCurrentJsAnimationKeys.filter((key) =>
  key.startsWith('course-g04-l05-'),
);

test('G4 L5 exposes 53 unique runnable private Current-JS page modules', async () => {
  assert.equal(lessonKeys.length, 53);
  assert.equal(new Set(lessonKeys).size, 53);
  for (const key of lessonKeys) {
    assert.deepEqual(animationModuleRegistration(key), {
      maturity: 'private-current-js',
      scope: 'private-engineering',
      calibrationId: 'g4-l5-page-only-current-js-53-v1',
    });
    const module = await loadAnimationModule(key);
    assert.ok(module, `${key} did not load`);
    assert.equal(module.key, key);
    assert.equal(module.maturity, 'private-current-js');
    const frameDomains = module.runtime?.frameDomains;
    assert.ok(frameDomains);
    assert.ok(frameDomains.length > 0);
    assert.ok(frameDomains.every((domain) =>
      domain.frameCount > 0 &&
      (domain.fps ?? module.runtime?.fps ?? module.movie.fps) > 0));
  }
});
