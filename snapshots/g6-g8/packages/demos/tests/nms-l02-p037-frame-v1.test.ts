import assert from 'node:assert/strict';
import test from 'node:test';
import {p037ModuleFrame, P037_FRAME_DOMAINS, P037_SCENARIOS} from '../src/nms-l02-p037-frame-v1';
const query = (frame: number, frameDomain = 'sprite-80', scenario = 'source-practice') =>
  p037ModuleFrame(frame, {frame, frameDomain, scenario, lang: 'en', seed: 0});
test('553 local source frames retain query identity and immutable deterministic state across all scenarios', () => {
  assert.equal(Object.values<number>(P037_FRAME_DOMAINS).reduce((a, b) => a + b), 553);
  let count = 0;
  for (const [frameDomain, length] of Object.entries(P037_FRAME_DOMAINS))
    for (let frame = 1; frame <= length; frame++) for (const {id: scenario} of P037_SCENARIOS)
      for (const lang of ['en', 'es'] as const) for (const seed of [0, 4294967295]) for (const replay of [0, 3]) {
        const c = {frame, frameDomain, scenario, lang, seed, replay};
        const a = p037ModuleFrame(frame, c), b = p037ModuleFrame(frame, c);
        assert.deepEqual(a, b); assert(Object.isFrozen(a) && Object.isFrozen(a.state));
        assert.equal(a.state.seed, seed); assert.equal(a.state.replay, replay);
        assert.equal(a.frame, frame); assert.equal(a.frameDomain, frameDomain);
        assert.equal(a.state.term !== null, a.termAvailable);
        assert(a.state.matchedMask >= 0 && a.state.matchedMask <= 31);
        if (a.mainFrame !== null && a.mainFrame > 442) {
          assert.equal(a.state.matchedMask, 31); assert.equal(a.state.popupVisible, false);
          assert.equal(a.state.coachFrame, null); assert.equal(a.state.sourcesEnabled, false);
        }
        count++;
      }
  assert.equal(count, 44240);
});
test('source stop, child reset, root entry and late feedback are explicit', () => {
  assert.equal(query(5, 'root').mainFrame, null); assert.equal(query(6, 'root').mainFrame, 1);
  assert.equal(query(442).state.mainPlaying, false);
  assert.equal(query(483).state.mainPlaying, false);
  assert.equal(query(20, 'sprite-52').state.sourcesEnabled, true);
  const end = query(25, 'sprite-58'); assert.equal(end.state.successFrame, 1);
  assert.equal(end.state.mainFrame, 442); assert.equal(end.state.mainPlaying, true);
  assert.equal(end.actionDisposition, 'post-action-reset-to-1');
  const late = query(2, 'sprite-58', 'late-distractor');
  assert(late.state.popupPlaying && late.state.successPlaying);
  assert.equal(query(15, 'sprite-79').state.popupPlaying, false);
  assert.equal(query(1, 'sprite-80', 'fraction-glossary').termAvailable, false);
  assert.equal(query(442, 'sprite-80', 'fraction-glossary').termAvailable, true);
});
test('identity failures do not silently select a valid source frame', () => {
  for (const frame of [0, 484, NaN, 2.5]) assert.throws(() => query(frame));
  assert.throws(() => query(1, '__proto__')); assert.throws(() => query(1, 'sprite-54'));
  assert.throws(() => query(1, 'sprite-80', 'invented'));
  const c = {frame: 1, scenario: 'source-practice', lang: 'en' as const, seed: 0};
  assert.throws(() => p037ModuleFrame(2, c));
  assert.throws(() => p037ModuleFrame(1, {...c, rootFrame: 7}));
  assert.throws(() => p037ModuleFrame(1, {...c, seed: -1}));
  assert.throws(() => p037ModuleFrame(1, {...c, replay: -1}));
});
