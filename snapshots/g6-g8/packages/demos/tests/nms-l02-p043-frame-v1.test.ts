import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { p043ModuleFrame, P043_FRAME_DOMAINS } from '../src/nms-l02-p043-frame-v1';
import type { RuntimeContext } from '../src/contract';
const query = (frame: number, options: Partial<RuntimeContext> = {}) => p043ModuleFrame(frame, { frame, scenario: 'source-inspection', lang: 'en', seed: 0, ...options });
test('declared frame domains match extracted source; root placement and stopped inspection stay separate', () => {
  const source = JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p043/audit/source-structure-v1.json', import.meta.url), 'utf8'));
  for (const [id, count] of Object.entries(P043_FRAME_DOMAINS)) assert.equal(source.timelines.find((t: {timelineId: string}) => t.timelineId === id).frames, count);
  assert.equal(query(5, {frameDomain: 'root'}).mainFrame, null);
  assert.equal(query(6, {frameDomain: 'root'}).mainFrame, 1);
  assert.equal(query(222).matching.phase, 'intro');
  assert.equal(query(223).matching.phase, 'ready');
  assert.equal(query(225).postStopInspection, true);
  assert.equal(query(225).matching.matched.length, 0);
  assert.equal(query(225).matching.phase, 'ready');
});
test('explicit traces reconstruct wrong, correct and all five seeded completion variants in both locales', () => {
  for (const lang of ['en', 'es'] as const) {
    const wrong = query(15, {frameDomain: 'sprite-245', scenario: 'wrong-fraction-row1', lang});
    assert.equal(wrong.matching.phase, 'wrong-feedback'); assert.deepEqual(wrong.matching.matched, []);
    const correct = query(20, {frameDomain: 'sprite-249', scenario: 'correct-fraction-row2', lang});
    assert.deepEqual(correct.matching.matched, ['fraction']);
    for (let seed = 0; seed < 5; seed++) {
      const frameDomain = `sprite-${[143,171,183,204,232][seed]}`;
      const options = {frameDomain, scenario: 'four-matches-completion', seed, lang, replay: 2};
      const a = query(1, options); assert.equal(a.matching.phase, 'completion-feedback');
      assert.equal(a.matching.matched.length, 4); assert.equal(a.matching.replay, 2);
      assert.deepEqual(query(1, options), a);
      assert.equal(query(224, {...options, frameDomain: 'sprite-250'}).matching.phase, 'completion-feedback');
      assert.equal(query(225, {...options, frameDomain: 'sprite-250'}).matching.phase, 'complete');
      assert.equal(query(1, {seed, replay: 3}).matching.matched.length, 0);
    }
  }
});
test('cross-domain, invalid identity and unmatched completion seed queries fail closed', () => {
  for (const f of [0,226,1.5,NaN]) assert.throws(() => query(f));
  for (const options of [{rootFrame: 7}, {seed: -1}, {replay: -1}, {scenario: 'unknown'}, {frameDomain: 'sprite-245'},
    {scenario: 'four-matches-completion', frameDomain: 'sprite-143', seed: 1},
    {scenario: 'four-matches-completion', frameDomain: 'sprite-250'}]) assert.throws(() => query(1, options));
});
