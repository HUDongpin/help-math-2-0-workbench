import assert from 'node:assert/strict';
import test from 'node:test';
import {getCourseG04L03Ti005FrameState} from '../src/modules/course-g04-l03-ti-005';
import {getTi005TextSnapshot} from '../src/modern-lessons/g4-l3-ti005-text';
import {createCourseG04L03Ti005InteractionState, reduceCourseG04L03Ti005Interaction} from '../src/timelines/course-g04-l03-ti-005-pattern-quiz-interaction';
const context = (frame: number) => ({frame, frameDomain: 'sprite-208', rootFrame: 6, scenario: 'source-static-frame', lang: 'en' as const, seed: 0});
const snapshot = (frame: number, interaction = createCourseG04L03Ti005InteractionState(0)) => getTi005TextSnapshot(getCourseG04L03Ti005FrameState(frame, context(frame)), context(frame), interaction);

test('TI005 intro signs remain visible while future answers and interactive fields stay hidden', () => {
  const s = snapshot(160);
  assert.equal(s.status, 'ready');
  assert.deepEqual(s.blocks.filter(b => /^pattern-\d$/.test(b.id) && b.visible).map(b => b.text), ['−3,', '−5,', '−7,', '−9,']);
  assert.equal(s.blocks.filter(b => ['first-answer', 'second-answer', 'wrong-feedback'].includes(b.id) && b.visible).length, 0);
  assert(!s.blocks.some(b => b.visible && /-11|-13/.test(b.text)));
});

test('TI005 question and wrong feedback read the existing reducer without revealing solutions', () => {
  const initial = createCourseG04L03Ti005InteractionState(0);
  const ready = snapshot(209, initial);
  assert.equal(ready.status, 'ready');
  assert.equal(ready.blocks.find(b => b.id === 'question-pattern')?.text, '-3, -5, -7, -9,');
  assert.equal(ready.blocks.find(b => b.id === 'first-answer')?.text, '');
  const wrong = reduceCourseG04L03Ti005Interaction(initial, {type: 'check'});
  const rejected = snapshot(209, wrong);
  assert.equal(rejected.blocks.find(b => b.id === 'wrong-feedback')?.visible, true);
  assert.equal(rejected.blocks.find(b => b.id === 'wrong-feedback')?.text, 'Each number decreases by 2.  Try again!');
  const retry = reduceCourseG04L03Ti005Interaction(wrong, {type: 'close-feedback'});
  assert.equal(snapshot(209, retry).blocks.find(b => b.id === 'wrong-feedback')?.visible, false);
});

test('TI005 snapshot fails closed on missing interaction, changed source, mismatched clock and evidence context', () => {
  const c = context(209), s = getCourseG04L03Ti005FrameState(209, c), initial = createCourseG04L03Ti005InteractionState(0);
  assert(getTi005TextSnapshot(s, c).blockers.includes('interaction-state-required'));
  for (const invalid of [{...s, sourceSwfSha256: 'wrong'}, {...s, rootFrame: 7}, {...s, frame: 208}, {...s, seed: 1}, {...s, scenario: 'wrong'}]) {
    const result = getTi005TextSnapshot(invalid, c, initial);
    assert.equal(result.status, 'blocked'); assert.deepEqual(result.blocks, []);
  }
  assert.equal(getTi005TextSnapshot(s, {...c, entryStateSha256: 'a'.repeat(64)}, initial).status, 'blocked');
  assert.equal(getTi005TextSnapshot(s, {...c, lang: 'es'}, initial).status, 'blocked');
});
