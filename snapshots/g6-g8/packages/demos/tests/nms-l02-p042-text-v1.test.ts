import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { P042_TEXT_BINDING, p042TextSnapshot } from '../src/nms-l02-p042-text-v1';
import { p042ModuleFrame } from '../src/nms-l02-p042-frame-v1';
test('every bound source ID exists in the exact extracted source catalog', () => {
  const catalog = JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p042/audit/source-text-catalog-v1.json', import.meta.url), 'utf8'));
  assert.equal(catalog.sourceSha256, P042_TEXT_BINDING.sourceSwfSha256);
  const texts = new Set(catalog.textDefinitions.map((t: { sourceTextId: string }) => t.sourceTextId));
  const shapes = new Set(catalog.shapeDefinitions.map((s: { characterId: number }) => s.characterId));
  for (const block of P042_TEXT_BINDING.blocks) {
    for (const id of block.sourceTextIds) assert.ok(texts.has(id), id);
    for (const id of block.sourceShapeIds ?? []) assert.ok(shapes.has(id), String(id));
  }
});
test('all root/child frames in both languages have complete source-bound text snapshots', () => {
  for (const lang of ['en', 'es'] as const) for (const [frameDomain, count] of [['root', 10], ['sprite-261', 626]] as const) for (let frame = 1; frame <= count; frame++) {
    const state = p042ModuleFrame(frame, { frame, frameDomain, scenario: 'source-explanation', lang, seed: 0 });
    const snapshot = p042TextSnapshot(state);
    assert.equal(snapshot.status, 'ready'); assert.deepEqual(snapshot.blockers, []);
    assert.equal(snapshot.blocks.length, 37);
    assert.ok(snapshot.blocks.every(b => b.visible === !(frameDomain === 'root' && frame < 6)));
    if (frameDomain === 'sprite-261' && frame === 365) assert.equal(snapshot.blocks.find(b => b.id === 'fraction-value-2')?.text, '3/10');
    if (frameDomain === 'sprite-261' && frame === 624) assert.equal(snapshot.blocks.find(b => b.id === 'percent-value-0')?.text, '—');
  }
});
