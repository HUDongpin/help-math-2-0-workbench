import assert from 'node:assert/strict';
import test from 'node:test';
import {P012_TEXT_DATA} from '../src/generated/alg-l12-p012-text-data';
import {p012TextSnapshot} from '../src/alg-l12-p012-text';
import {P012_TEXT_BINDING, p012LessonTextSnapshot} from '../src/alg-l12-p012-text-binding';
import {p012FrameState} from '../src/timelines/shared-alg001-l12-p012';
import {reduceP012Lesson, type P012LessonState} from '../src/alg-l12-p012-lesson';
import {validateLessonTextBinding} from '../src/lesson-text-snapshot';
import {p012TypographySuppressions} from '../src/alg-l12-p012-typography-renderer';

const context = (frame: number) => ({frame, frameDomain: 'sprite-86', rootFrame: 6,
  scenario: 'ordered-pairs-interaction', lang: 'en' as const, seed: 0});
const snapshot = (frame: number) => p012LessonTextSnapshot(p012FrameState(frame, context(frame)), context(frame));
const block = (frame: number, id: string) => snapshot(frame).blocks.find(item => item.id === id)!;
const sourceId = (path: readonly {timelineId: string; depth: number; generation: number}[]) => {
  const leaf = path.at(-1)!;
  return `${leaf.timelineId}/depth-${leaf.depth}/generation-${leaf.generation}`;
};

test('binding is source-hash and exact instance-bound, including reused axis characters', () => {
  assert.equal(validateLessonTextBinding(P012_TEXT_BINDING), P012_TEXT_BINDING);
  assert.equal(P012_TEXT_BINDING.sourceSwfSha256, P012_TEXT_DATA.source.swfSha256);
  assert.equal(P012_TEXT_BINDING.version, 'p012-source-native-text-v1');
  assert.equal(P012_TEXT_BINDING.blocks.length, P012_TEXT_DATA.instances.length + 1);
  const axis4 = P012_TEXT_BINDING.blocks.filter(item => item.sourceTextIds.includes('character-4/run-0'));
  assert.equal(axis4.length, 2);
  assert.notEqual(axis4[0].instance?.id, axis4[1].instance?.id);
  assert.deepEqual(P012_TEXT_BINDING.blocks.find(item => item.id === 'title')?.sourceShapeIds, [1]);
  assert.deepEqual(P012_TEXT_BINDING.blocks.find(item => item.id === 'button-71/record-4')?.sourceTextIds,
    ['character-66/run-0']);
});

test('native snapshot tracks the source masks through intro and swaps the coordinate instance at hold', () => {
  for (const frame of [1, 31, 32, 34, 100, 101, 112, 119]) {
    const result = snapshot(frame);
    assert.equal(result.status, 'ready', `frame ${frame}: ${result.blockers.join(', ')}`);
    assert.equal(result.sourceSwfSha256, P012_TEXT_DATA.source.swfSha256);
    assert.equal(result.blocks.filter(item => item.visible && item.role === 'body')
      .map(item => item.text).join(''), p012TextSnapshot(frame).introText);
    assert.equal(new Set(result.suppressedInstances.map(item => item.id)).size,
      result.suppressedInstances.length);
  }
  assert.equal(block(32, 'sprite-86/depth-3/generation-1').visible, false);
  assert.equal(block(34, 'sprite-86/depth-3/generation-1').text, 'Cl');
  assert.equal(block(119, 'sprite-86/depth-8/generation-1').text, 'Next to continue.');
  assert.equal(block(118, 'sprite-86/depth-68/generation-1').visible, true);
  assert.equal(block(119, 'sprite-86/depth-68/generation-1').visible, false);
  assert.equal(block(119, 'sprite-61/depth-2/generation-1').visible, true);
  assert.equal(block(119, 'sprite-61/depth-2/generation-1').text, '(0,0)');
});

test('standard suppression identities correspond to every active native adapter identity', () => {
  for (const frame of [1, 9, 10, 31, 32, 119]) {
    const lesson = p012FrameState(frame, context(frame)).lesson!;
    const standard = snapshot(frame).suppressedInstances.map(item => sourceId(item.path));
    assert.deepEqual(new Set(standard), new Set(p012TypographySuppressions(lesson)));
  }
});

function move(lesson: P012LessonState) {
  let next = lesson;
  for (const kind of ['press', 'release'] as const)
    next = reduceP012Lesson(next, {kind: 'interaction', action: {kind, button: 'MoveBtn8'}});
  for (let tick = 0; tick < 23; tick++) next = reduceP012Lesson(next, {kind: 'tick'});
  return next;
}

test('held coordinate and feedback come from the canonical reducer, including its invalid move branch', () => {
  const entry = p012FrameState(119, context(119));
  let lesson = move(entry.lesson!);
  let result = p012LessonTextSnapshot({...entry, lesson}, context(119));
  assert.equal(lesson.interaction.coordinateText, '(3,0)');
  assert.equal(result.blocks.find(item => item.id === 'sprite-61/depth-2/generation-1')?.text, '(3,0)');
  assert.equal(result.blocks.find(item => item.id === 'sprite-74/depth-10/generation-1')?.visible, false);
  lesson = move(move(lesson)); // x = 9; the fourth +3 is rejected by source bounds.
  lesson = reduceP012Lesson(lesson, {kind: 'interaction', action: {kind: 'press', button: 'MoveBtn8'}});
  lesson = reduceP012Lesson(lesson, {kind: 'interaction', action: {kind: 'release', button: 'MoveBtn8'}});
  assert.equal(lesson.interaction.popup.visible, true);
  result = p012LessonTextSnapshot({...entry, lesson}, context(119));
  assert.equal(result.status, 'ready');
  assert.equal(result.blocks.find(item => item.id === 'sprite-61/depth-2/generation-1')?.text, '(9,0)');
  assert.equal(result.blocks.find(item => item.id === 'sprite-74/depth-10/generation-1')?.text,
    'Keep the spider on the ceiling. Try again.');
  assert.equal(result.blocks.find(item => item.id === 'sprite-74/depth-10/generation-1')?.visible, true);
  assert.equal(result.blocks.find(item => item.id === 'button-71/record-4')?.text, 'Close');
  assert.equal(result.blocks.find(item => item.id === 'button-71/record-4')?.visible, true);
  // The shared contract cannot encode button-state timeline segments. Its
  // exact label suppression remains in the native adapter.
  const standard = result.suppressedInstances.map(item => sourceId(item.path));
  assert.deepEqual(new Set([...standard, 'button-71/record-4']),
    new Set(p012TypographySuppressions(lesson)));
});

test('unsupported contexts and timeline state fail closed', () => {
  const entry = p012FrameState(119, context(119));
  for (const changed of [{lang: 'es' as const}, {frameDomain: 'root'}, {rootFrame: 7}, {seed: 1}]) {
    const result = p012LessonTextSnapshot(entry, {...context(119), ...changed});
    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blocks, []);
    assert.deepEqual(result.suppressedInstances, []);
  }
  assert.equal(p012LessonTextSnapshot(p012FrameState(118, context(118)), context(119)).status, 'blocked');
});
