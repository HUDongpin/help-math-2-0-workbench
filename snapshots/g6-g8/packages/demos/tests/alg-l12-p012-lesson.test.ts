import assert from 'node:assert/strict';
import test from 'node:test';
import {initialP012Lesson, reduceP012Lesson, type P012LessonState} from '../src/alg-l12-p012-lesson';

const ticks = (initial: P012LessonState, count: number) => {
  let state = initial;
  for (let i = 0; i < count; i++) state = reduceP012Lesson(state, {kind: 'tick'});
  return state;
};
const move = (state: P012LessonState) => reduceP012Lesson(
  reduceP012Lesson(state, {kind: 'interaction', action: {kind: 'press', button: 'MoveBtn7'}}),
  {kind: 'interaction', action: {kind: 'release', button: 'MoveBtn7'}});

test('source stopped frame retains live movement without advancing the main frame', () => {
  const initial = initialP012Lesson(42);
  assert.equal(ticks(initial, 200), initial);
  const intro = ticks(reduceP012Lesson(initial, {kind: 'play'}), 117);
  assert.equal(intro.frame, 118);
  assert.deepEqual(move(intro), intro);
  const ready = ticks(intro, 1);
  assert.equal(ready.phase, 'interaction');
  const moving = ticks(move(ready), 7);
  assert.equal(moving.interaction.spider.x, 147.8);
  assert.equal(moving.interaction.coordinateText, '(0,0)');
  const settled = ticks(moving, 2);
  assert.equal(settled.frame, 119);
  assert.equal(settled.interaction.coordinateText, '(1,0)');
  assert.equal(settled.interaction.controlsEnabled, true);
});

test('host pause preserves partial movement and glossary close never autoplays', () => {
  let state = reduceP012Lesson(initialP012Lesson(7, true), {kind: 'play'});
  state = ticks(move(state), 3);
  const stopped = reduceP012Lesson(state, {kind: 'open-coordinate'});
  assert.equal(stopped.glossaryOpen, true);
  assert.equal(ticks(stopped, 50), stopped);
  assert.equal(reduceP012Lesson(stopped, {kind: 'play'}), stopped);
  const closed = reduceP012Lesson(stopped, {kind: 'close-coordinate'});
  assert.equal(closed.paused, true);
  const settled = ticks(reduceP012Lesson(closed, {kind: 'play'}), 6);
  assert.equal(settled.interaction.coordinateText, '(1,0)');
});

test('glossary has source visibility boundary and Replay resets complete interaction', () => {
  let state = reduceP012Lesson(initialP012Lesson(23), {kind: 'play'});
  state = ticks(state, 30);
  assert.equal(state.frame, 31);
  assert.equal(reduceP012Lesson(state, {kind: 'open-coordinate'}), state);
  state = ticks(state, 1);
  assert.equal(reduceP012Lesson(state, {kind: 'open-coordinate'}).glossaryOpen, true);
  state = ticks(state, 87);
  state = ticks(move(state), 9);
  const replayed = reduceP012Lesson(state, {kind: 'replay'});
  assert.deepEqual(replayed, {...initialP012Lesson(23), replay: 1});
});

test('navigation terminates source and coach updates, reduced motion keeps interaction available', () => {
  let state = reduceP012Lesson(initialP012Lesson(2, true), {kind: 'play'});
  for (let i = 0; i < 10; i++) state = ticks(move(state), 9);
  state = move(state);
  assert.equal(state.interaction.popup.visible, true);
  assert.equal(state.interaction.coach.playing, true);
  const left = reduceP012Lesson(state, {kind: 'navigation'});
  assert.equal(left.interaction.coach.playing, false);
  assert.equal(left.interaction.controlsEnabled, false);
  assert.equal(ticks(left, 100), left);
  assert.equal(reduceP012Lesson(left, {kind: 'play'}), left);
});
