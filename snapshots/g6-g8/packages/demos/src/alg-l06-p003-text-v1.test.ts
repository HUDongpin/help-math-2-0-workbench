import assert from 'node:assert/strict';
import {test} from 'node:test';
import module from './modules/g678-alg-l06-p003-source-candidate-v1';
import {ALG_L06_P003_TEXT_BINDING, algL06P003TextSnapshot} from './alg-l06-p003-text-v1';

function at(frame: number, lang: 'en' | 'es' = 'en') {
  const state = module.getFrameState(frame, {frame, frameDomain: 'sprite-154', rootFrame: 6,
    scenario: 'source-static-frame', lang, seed: 0});
  return algL06P003TextSnapshot(state);
}

test('P003 source-readable text binds the exact placement and teaching text', () => {
  assert.equal(ALG_L06_P003_TEXT_BINDING.placementId, 'shared-alg001-l06-p003');
  assert.equal(ALG_L06_P003_TEXT_BINDING.sourceSwfSha256,
    'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766');
  const snapshot = at(1);
  assert.equal(snapshot.status, 'ready');
  assert.deepEqual(snapshot.blocks.filter(block => block.visible).map(block => [block.id, block.text]), [
    ['title', 'Understanding Functions: Real World Activity'],
    ['orange', 'Orange'], ['lemon', 'lemon'],
    ['lemonade-price', 'Lemonade: 50¢ per cup'],
    ['orange-juice-price', 'orange juice: 75¢ per cup'],
  ]);
});

test('P003 separate glyph equation arrives at 520, full text takes over at 531, Replay hides both', () => {
  for (const frame of [1, 519]) {
    assert.equal(at(frame).blocks.find(block => block.id === 'equation')?.visible, false);
    assert.equal(at(frame).blocks.find(block => block.id === 'equation-build')?.visible, false);
  }
  for (const frame of [520, 525, 530]) {
    assert.equal(at(frame).blocks.find(block => block.id === 'equation-build')?.text, 'M = $0.50 x C');
    assert.equal(at(frame).blocks.find(block => block.id === 'equation-build')?.visible, true);
    assert.equal(at(frame).blocks.find(block => block.id === 'equation')?.visible, false);
  }
  for (const frame of [531, 544, 719]) {
    assert.equal(at(frame).blocks.find(block => block.id === 'equation')?.text, 'M = $0.50 ∙ C');
    assert.equal(at(frame).blocks.find(block => block.id === 'equation')?.visible, true);
    assert.equal(at(frame).blocks.find(block => block.id === 'equation-build')?.visible, false);
  }
  assert.equal(at(1).blocks.find(block => block.id === 'equation')?.visible, false);
  assert.equal(at(1).blocks.find(block => block.id === 'equation-build')?.visible, false);
  assert.equal(at(531, 'es').status, 'blocked', 'source English is not a Spanish translation');
});
