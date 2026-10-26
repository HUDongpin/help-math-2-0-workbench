import test from 'node:test';
import assert from 'node:assert/strict';
import { p043ClockInitial, p043ClockDomain, p043ClockDuration, p043ClockPlay, p043ClockPause, p043ClockSync, p043ClockMatch, p043ClockCloseWrong, p043ClockReplay, p043ClockMainFrame } from '../src/nms-l02-p043-clock-v1';
import { P043_TARGETS, type P043Term } from '../src/nms-l02-p043-matching-v1';
test('intro pause preserves fractional time and enters matching only at223', () => {
  let c = p043ClockPause(p043ClockPlay(p043ClockInitial(), 10), 10.125);
  assert.equal(c.elapsed, .125); assert.equal(p043ClockSync(c, 100), c);
  c = p043ClockSync(p043ClockPlay(c, 100), 118.375);
  assert.equal(c.state.phase, 'ready'); assert.equal(p043ClockMainFrame(c), 223);
});
test('correct feedback retains nonzero tail and all five seeded final clips finish before225', () => {
  const seen = new Set();
  for (let seed = 0; seed < 5; seed++) {
    let c = p043ClockSync(p043ClockPlay(p043ClockInitial(seed), 0), 18.5);
    for (const term of Object.keys(P043_TARGETS) as P043Term[]) {
      c = p043ClockMatch(c, term, P043_TARGETS[term]);
      assert.equal(p043ClockDomain(c), '249'); assert.ok(p043ClockDuration(c) > 18 / 12);
      const duration = p043ClockDuration(c), playing = p043ClockPlay(c, 20);
      assert.equal(p043ClockSync(playing, 20 + duration - .001).state.phase, 'correct-feedback');
      c = p043ClockSync(playing, 20 + duration + .001);
    }
    assert.equal(c.state.phase, 'completion-feedback'); seen.add(p043ClockDomain(c));
    assert.equal(p043ClockMainFrame(c), 223);
    const finished = p043ClockSync(p043ClockPlay(c, 30), 30 + p043ClockDuration(c) + .001);
    assert.equal(finished.state.phase, 'complete'); assert.equal(p043ClockMainFrame(finished), 225);
    const replay = p043ClockReplay(finished); assert.equal(replay.state.phase, 'intro'); assert.equal(replay.seed, seed); assert.equal(replay.state.matched.length, 0);
  }
  assert.equal(seen.size, 5);
});
test('wrong feedback holds until close; invalid or reversed clocks fail', () => {
  let c = p043ClockSync(p043ClockPlay(p043ClockInitial(), 0), 18.5);
  c = p043ClockMatch(c, 'fraction', 1); c = p043ClockSync(p043ClockPlay(c, 20), 100);
  assert.equal(c.state.phase, 'wrong-feedback'); assert.equal(c.anchor, null);
  assert.equal(p043ClockCloseWrong(c).state.phase, 'ready');
  assert.throws(() => p043ClockInitial(-1), /SEED/);
  assert.throws(() => p043ClockSync(p043ClockPlay(p043ClockInitial(), 10), 9), /REVERSED/);
});
