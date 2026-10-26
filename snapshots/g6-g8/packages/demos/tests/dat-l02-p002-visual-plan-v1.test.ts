import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import LAYOUT from '../src/generated/dat001-l02-p002-visual-layout-v1.json';
import {datL02P002VisualPlan} from '../src/dat-l02-p002-visual-plan-v1';

const context = {frameDomain: 'sprite-113', scenario: 'default', lang: 'en' as const,
  seed: 0, replay: 0};
const at = (frame: number) => datL02P002VisualPlan(frame, {...context, frame});

test('the audit and product layout copies are byte-bound, with no invented bitmap layer', () => {
  const source = readFileSync(new URL('../../../migrations/shared-dat001-l02-p002/audit/source-visual-layout-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),
    'bfdc2f54900629ad6bec77da79e00a602fb69ee8f2c69e9cf6a73ff12ba60a0e');
  assert.deepEqual(JSON.parse(source.toString()), LAYOUT);
  assert.deepEqual(LAYOUT.counts, {
    visualSymbols: 107, sourceMorphStates: 66, bitmapDefinitionsNotDirectlyPlaced: 4,
  });
});

test('all 276 parent frames resolve ordered, unique, source-bound leaf layers', () => {
  for (let frame = 1; frame <= 276; frame++) {
    const plan = at(frame);
    assert.equal(plan.frame, frame);
    assert.equal(plan.frameDomain, 'sprite-113');
    assert.ok(plan.layers.length > 0);
    assert.equal(new Set(plan.layers.map(layer => layer.instancePath)).size, plan.layers.length);
    assert.equal(plan.layers.at(-1)?.instancePath, 'root/413');
    assert.equal(plan.sourceDeclaredSamplesThroughFrame > 0, true);
    for (const layer of plan.layers) {
      assert.ok(layer.stageMatrix.every(Number.isFinite));
      assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
      assert.match(layer.sourceSvgSha256, /^[a-f0-9]{64}$/);
      assert.match(layer.sourceSvgPath, /^migrations\/shared-dat001-l02-p002\/audit\//);
      assert.equal(layer.sourceSvgPath.endsWith('.svg'), true);
      for (const maskPath of layer.maskPaths) {
        const mask = plan.layers.find(candidate => candidate.instancePath === maskPath);
        assert.equal(mask?.renderMode, 'mask');
        assert.ok(plan.layers.indexOf(mask) < plan.layers.indexOf(layer));
      }
    }
    assert.equal(plan.originalHostTraceEstablished, false);
    assert.equal(plan.originalRuntimeVisualVerified, false);
    assert.equal(plan.audioSynchronizationAccepted, false);
    assert.equal(plan.currentJsRegistered, false);
  }
});

test('nested clocks, affine matrices, and geometric masks cross source boundaries', () => {
  assert.equal(at(1).projectedChildCount, 3);
  assert.equal(at(42).projectedChildCount, 3);
  assert.equal(at(43).projectedChildCount, 1);
  assert.equal(at(59).projectedChildCount, 1);
  assert.equal(at(60).projectedChildCount, 3);
  assert.equal(at(276).projectedChildCount, 3);
  const first = at(1);
  assert.deepEqual(first.layers.find(layer => layer.instancePath === 'root/1/1')?.stageMatrix,
    [1, 0, 0, 1, 360.95, 273]);
  assert.deepEqual(first.layers.find(layer => layer.instancePath === 'root/411/1')?.stageMatrix,
    [1, 0, 0, 1, 417.2, 43.45]);
  assert.deepEqual(first.layers.find(layer => layer.instancePath === 'root/1/3')?.maskPaths,
    ['root/1/1']);
  const later = at(126);
  assert.deepEqual(later.layers.find(layer => layer.instancePath === 'root/1/397')?.maskPaths,
    ['root/1/1', 'root/1/396']);
  const morph = later.layers.find(layer => layer.instancePath === 'root/1/399');
  assert.equal(morph?.characterId, 107);
  assert.equal(morph?.renderMode, 'mask');
  assert.match(morph!.sourceSvgPath, /107-00000\.svg$/);
});

test('language and replay do not fabricate translation, visual approval, or host traces', () => {
  const en = at(276);
  const es = datL02P002VisualPlan(276, {...context, frame: 276, lang: 'es', replay: 2});
  assert.deepEqual(es.layers, en.layers);
  assert.equal(es.language, 'es');
  assert.equal(es.replay, 2);
  assert.throws(() => datL02P002VisualPlan(0, {...context, frame: 0}),
    /DAT_L02_P002_INVALID_FRAME_IDENTITY/);
  assert.throws(() => datL02P002VisualPlan(1, {...context, frame: 1, frameDomain: 'root'}),
    /DAT_L02_P002_VISUAL_LAYOUT_DRIFT/);
});
