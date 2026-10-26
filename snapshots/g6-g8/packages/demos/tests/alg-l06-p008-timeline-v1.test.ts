import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P008_TIMELINE, p008FrameState} from '../src/alg-l06-p008-timeline-v1';

test('child windows bind exact source instances and reset on each new placement', () => {
  const raw = readFileSync(new URL('../../../migrations/shared-alg001-l06-p008/audit/source-v1/source-composition-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'), P008_TIMELINE.sourceCompositionSha256);
  const source = JSON.parse(raw.toString());
  assert.deepEqual(source.main.nestedSprites.map(({instance}: {instance: Record<string, number>}) => ({
    characterId: instance.characterId, depth: instance.depth,
    firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive,
  })), P008_TIMELINE.children);
  for (const [first, last, id] of [[1,18,20],[449,463,20],[636,645,194],[936,938,20]]) {
    assert.deepEqual(p008FrameState(first).children.map(c => [c.characterId,c.frame]), [[id,1]]);
    assert.equal(p008FrameState(last).children[0].frame, last-first+1);
    if (first > 1) assert.equal(p008FrameState(first-1).children.length, 0);
    if (last < 938) assert.equal(p008FrameState(last+1).children.length, 0);
  }
  assert.equal(p008FrameState(938).children[0].frame, 3);
  assert.equal(p008FrameState(1).children[0].frame, 1, 'Replay projects initial instance');
  assert.equal(p008FrameState(938).terminal, true);
  assert.equal(p008FrameState(937).terminal, false);
  for (const bad of [0,939,1.5,NaN,Infinity]) assert.throws(() => p008FrameState(bad));
});
