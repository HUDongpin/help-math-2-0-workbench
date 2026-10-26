import assert from 'node:assert/strict';
import test from 'node:test';
import {p009GraphLabels, p009TextSnapshot} from '../src/alg-l12-p009-typography';

const context = (frame: number) => ({frame, frameDomain: 'sprite-62', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en' as const, seed: 0, replay: 0});
const block = (frame: number, depth: number) => p009TextSnapshot(context(frame)).blocks
  .find(item => item.id === `sprite-62/depth-${depth}/generation-1`)!;

test('P009 source masks govern whole-run prose reveal', () => {
  assert.equal(block(14, 3).visible, false);
  assert.equal(block(15, 3).text, 'An ');
  assert.equal(block(24, 3).text, 'An ');
  assert.equal(block(25, 3).text, 'An ordered pair');
  assert.equal(block(84, 15).visible, false);
  assert.equal(block(85, 15).text, 'coordinate plane');
  assert.equal(block(211, 23).text, 'In an ordered pair, the x-coordinate is the first number and the');
  assert.equal(block(212, 23).text, 'In an ordered pair, the x-coordinate is the first number and the y-coordinate');
  assert.equal(block(222, 30).visible, false);
  assert.equal(block(223, 30).text, ' is the second number.  ');
});

test('P009 source graph keeps all reused signs and fade boundaries', () => {
  assert.equal(p009GraphLabels(13).length, 0);
  const invisible = p009GraphLabels(14);
  assert.equal(invisible.length, 33);
  assert(invisible.every(label => label.alpha === 0));
  const visible = p009GraphLabels(26);
  assert.equal(visible.filter(label => label.text === '-').length, 10);
  assert.equal(new Set(visible.map(label => label.id)).size, 33);
  assert(visible.every(label => label.alpha === 1 && Number.isFinite(label.x) && Number.isFinite(label.y)));
  assert.equal(p009GraphLabels(284).find(label => label.characterId === 59)?.alpha, 0);
  assert.equal(p009GraphLabels(291).find(label => label.characterId === 59)?.alpha, 1);
});

test('P009 single-frame overlays and active suppression follow source generations', () => {
  for (const [before, on, after, character] of [[352, 353, 354, 60], [382, 383, 384, 61]]) {
    assert(!p009GraphLabels(before).some(label => label.characterId === character));
    assert(p009GraphLabels(on).some(label => label.characterId === character));
    assert(!p009GraphLabels(after).some(label => label.characterId === character));
    assert.equal(p009TextSnapshot(context(on)).suppressedInstances.length,
      p009TextSnapshot(context(before)).suppressedInstances.length + 1);
  }
  const initial = p009TextSnapshot(context(1));
  assert.equal(initial.suppressedInstances.length, 1);
  assert.deepEqual(p009TextSnapshot({...context(1), replay: 7}).blocks, initial.blocks);
});

test('P009 rejects unsupported context and keeps current frame identity', () => {
  for (const frame of [0, 395, 1.5]) assert.equal(p009TextSnapshot(context(frame)).status, 'blocked');
  assert.equal(p009TextSnapshot({...context(1), lang: 'es'}).status, 'blocked');
  assert.equal(p009TextSnapshot({...context(1), rootFrame: 1}).status, 'blocked');
  for (const frame of [12, 72]) for (const replay of [-1, NaN]) {
    const blocked = p009TextSnapshot({...context(frame), replay});
    assert.equal(blocked.status, 'blocked');
    assert.deepEqual(blocked.suppressedInstances, []);
  }
  const end = p009TextSnapshot({...context(394), replay: 3});
  assert.equal(end.status, 'ready');
  assert.equal(end.identity.frame, 394);
  assert.equal(end.identity.replay, 3);
  assert.equal(new Set(end.suppressedInstances.map(item => item.id)).size, end.suppressedInstances.length);
});
