import assert from 'node:assert/strict';
import test from 'node:test';

import {
  animationModuleRegistration,
  loadAnimationModule,
  registeredPrivateCurrentJsAnimationKeys,
} from '../src/animation-registry';
import {G4_L5_PRODUCT_CANDIDATES} from '../src/g4-l5-product-candidates.generated';

const selected = [
  'course-g04-l05-rw-002',
  'course-g04-l05-vb-008',
  'course-g04-l05-in-013',
  'course-g04-l05-ti-002',
  'course-g04-l05-gs-003',
  'course-g04-l05-fq-002',
];

test('six preserved G4 L5 product modules remain private Current-JS registrations', async () => {
  assert.deepEqual(
    G4_L5_PRODUCT_CANDIDATES.map((candidate) => candidate.animationId),
    selected,
  );
  for (const key of selected) {
    assert.ok(registeredPrivateCurrentJsAnimationKeys.includes(key));
    assert.deepEqual(animationModuleRegistration(key), {
      maturity: 'private-current-js',
      scope: 'private-engineering',
      calibrationId: 'g4-l5-page-only-current-js-53-v1',
    });
    const module = await loadAnimationModule(key);
    assert.ok(module);
    assert.equal(module.key, key);
    assert.equal(module.maturity, 'private-current-js');
    assert.equal(module.runtime?.frameCount, 10);
    assert.equal(module.runtime?.stage.width, 800);
    assert.equal(module.runtime?.stage.height, 600);
    assert.equal(module.scenarios[0]?.id, 'product-candidate');
    const state = module.getFrameState(1, {
      frame: 1,
      frameDomain: module.runtime?.defaultFrameDomain,
      rootFrame: 1,
      scenario: 'product-candidate',
      lang: 'en',
      seed: 0,
      replay: 0,
    }) as {acceptance?: unknown; animationId?: unknown};
    assert.equal(state.acceptance, 'engineering-only');
    assert.equal(state.animationId, key);
  }
});

test('only exact page-local assets expose shared unverified audio', async () => {
  for (const [index, key] of selected.entries()) {
    const module = await loadAnimationModule(key);
    assert.ok(module);
    const assets = module.interactiveAudioAssets ?? [];
    assert.equal(assets.length, index < 4 ? 1 : 0);
    for (const asset of assets) {
      assert.equal(asset.language, 'shared');
      assert.equal(asset.spokenLanguage, 'undetermined');
      assert.match(asset.sha256, /^[a-f0-9]{64}$/u);
      assert.equal(asset.source, `/flash-assets/courses/${key}/audio/source-narration-undetermined.mp3?sha256=${asset.sha256}`);
    }
  }
});
