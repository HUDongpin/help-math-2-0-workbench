import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import LAYOUT from '../src/generated/geo001-l07-p003-visual-layout-v1.json';
import {geoL07P003MainState} from '../src/geo-l07-p003-display-state-v1';
import {geoL07P003VisualPlan} from '../src/geo-l07-p003-visual-plan-v1';

const context = {frame: 1, frameDomain: 'sprite-140', scenario: 'default',
  lang: 'en' as const, seed: 0, replay: 0};
const at = (frame: number) => geoL07P003VisualPlan(frame, {...context, frame});

test('layout copy is source-bound and preserves all placed symbol identities', () => {
  const source = readFileSync(new URL('../../../migrations/shared-geo001-l07-p003/audit/source-visual-layout-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),
    '7b1c537e4f599ca22634d51ecdc78705483fe99c6dc3f64a5699d60d662fc34c');
  assert.deepEqual(JSON.parse(source.toString()), LAYOUT);
  assert.deepEqual(LAYOUT.counts, {boundSymbols: 135, placedSymbols: 132, unplacedSymbols: 3});
  assert.equal(LAYOUT.mainSprite.translateX, 412.4);
  assert.equal(LAYOUT.mainSprite.translateY, 303.3);
});

test('direct-frame source layers have valid assets, depth order, masks and native transforms', () => {
  const ids = new Set(LAYOUT.symbols.map(symbol => symbol.characterId));
  for (let frame = 1; frame <= 1274; frame++) {
    const state = geoL07P003MainState(frame, {...context, frame});
    const plan = at(frame);
    assert.equal(plan.frame, frame);
    assert.equal(plan.layers.length, state.objects.length);
    assert.deepEqual(plan.layers.map(layer => layer.depth), state.objects.map(object => object.depth));
    for (const layer of plan.layers) {
      assert.ok(ids.has(layer.characterId));
      assert.match(layer.sourceSvgSha256, /^[a-f0-9]{64}$/);
      assert.ok(layer.sourceSvgPath.startsWith('audit/ffdec-26.2.1/'));
      assert.equal(layer.interactive, false);
      assert.ok(layer.stageMatrix.every(Number.isFinite));
      assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
      for (const maskDepth of layer.maskDepths) {
        const mask = plan.layers.find(candidate => candidate.depth === maskDepth);
        assert.equal(mask?.renderMode, 'mask');
        assert.ok(maskDepth < layer.depth && layer.depth <= mask.clipDepth!);
      }
    }
  }
  const first = at(1);
  assert.equal(first.layers[0].renderMode, 'mask');
  assert.deepEqual(first.layers[0].stageMatrix, [1, 0, 0, 1, 412.4, 303.3]);
  assert.deepEqual(first.layers.find(layer => layer.depth === 2)?.maskDepths, [1]);
  assert.equal(first.layers.find(layer => layer.depth === 40)?.opacity, 154 / 256);
  assert.equal(at(413).layers.find(layer => layer.depth === 45)?.clipDepth, 50);
  assert.equal(at(886).layers.find(layer => layer.depth === 51)?.clipDepth, 55);
});

test('glossary placements remain noninteractive and identity changes do not invent translation', () => {
  assert.deepEqual(at(421).layers.filter(layer => layer.glossaryKey), []);
  assert.deepEqual([...new Set(at(1274).layers.map(layer => layer.glossaryKey).filter(Boolean))].sort(),
    ['Cubic foot', 'Cubic unit', 'Figure', 'Measurement', 'Three dimensional', 'Unit', 'volume'].sort());
  const english = at(943);
  const spanish = geoL07P003VisualPlan(943, {...context, frame: 943, lang: 'es', replay: 2});
  assert.deepEqual(spanish.layers, english.layers);
  assert.equal(spanish.language, 'es');
  assert.equal(spanish.replay, 2);
  assert.equal(spanish.glossaryHostResolved, false);
  assert.equal(spanish.originalRuntimeVisualVerified, false);
  assert.equal(spanish.currentJsRegistered, false);
});
