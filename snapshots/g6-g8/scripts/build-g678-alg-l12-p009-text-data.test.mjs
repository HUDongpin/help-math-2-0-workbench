import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {collectP009TextData} from './build-g678-alg-l12-p009-text-data.mjs';

const bytes = readFileSync(new URL('../migrations/shared-alg001-l12-p009/audit/source-input.swf', import.meta.url));
const audit = JSON.parse(readFileSync(new URL('../migrations/shared-alg001-l12-p009/audit/typography-source-inventory-v1.json', import.meta.url)));

test('P009 extraction preserves reused negative signs and distinct flash generations', () => {
  const data = collectP009TextData(bytes, audit);
  const minus = data.instances.filter(item => item.characterId === 18);
  assert.equal(minus.length, 10);
  assert.equal(new Set(minus.map(item => item.instanceId)).size, 10);
  assert.deepEqual(data.instances.filter(item => item.characterId === 60).map(item => [item.firstFrame, item.lastFrameExclusive]),
    [[353, 354], [355, 356], [357, 358]]);
  assert.deepEqual(data.instances.filter(item => item.characterId === 61).map(item => [item.firstFrame, item.lastFrameExclusive]),
    [[383, 384], [385, 386], [387, 388]]);
  assert.equal(data.definitions.find(item => item.characterId === 59).runs.map(run => run.text).join(''), '(4,2)');
});

test('P009 native reveal rejects source or glyph-mask evidence drift', () => {
  const drifted = Buffer.from(bytes); drifted[100] ^= 1;
  assert.throws(() => collectP009TextData(drifted, audit));
  const changed = structuredClone(audit);
  changed.runInstanceVisibilitySummary.find(item => item.sourceTextId === 'character-4/run-1').firstAllInkBoundsContainedFrame = 12;
  assert.throws(() => collectP009TextData(bytes, changed));
});
