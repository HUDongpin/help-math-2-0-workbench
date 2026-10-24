import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId, shouldSuppressLessonTextInstance, validateLessonTextBinding} from './lesson-text-snapshot';

const path = [{timelineId: 'root', depth: 3, generation: 0, characterId: 10}, {timelineId: 'sprite-10', depth: 7, generation: 1, characterId: 12}] as const;
const binding: LessonTextBinding = {
  schemaVersion: 1, version: 'test-v1', placementId: 'g04-l03-placement-013',
  animationId: 'course-g04-l03-in-002', sourceSwfSha256: 'a'.repeat(64), template: 'explanation',
  blocks: [
    {id: 'question', sourceTextIds: ['character-12/run-0'], role: 'question', language: 'en', readingOrder: 0, valueSource: 'source-static', instance: {id: lessonTextInstanceId(path), path}},
    {id: 'feedback', sourceTextIds: ['character-13/run-0'], role: 'feedback', language: 'en', readingOrder: 1, valueSource: 'maintained-page-state'},
  ],
};
const context: RuntimeContext = Object.freeze({frame: 25, frameDomain: 'sprite-10', rootFrame: 6, scenario: 'question', lang: 'en', seed: 42, replay: 0});
const initial = {question: {text: 'Which number is less than 0?', visible: true}, feedback: {text: 'Correct.', visible: false}};

test('question and feedback reveal consume the supplied state without a second clock', () => {
  const before = buildLessonTextSnapshot(binding, context, initial);
  assert.equal(before.status, 'ready');
  assert.equal(before.blocks[1]!.visible, false);
  const after = buildLessonTextSnapshot(binding, context, {...initial, feedback: {text: 'Correct.', visible: true}});
  assert.equal(after.blocks[1]!.visible, true);
  assert.deepEqual(after.identity, before.identity);
  assert.deepEqual(buildLessonTextSnapshot(binding, {...context, replay: 1}, initial).blocks, before.blocks);
});

test('same character at another depth or after replacement is not suppressed', () => {
  const snapshot = buildLessonTextSnapshot(binding, context, initial);
  assert.equal(shouldSuppressLessonTextInstance(snapshot, path), true);
  for (const last of [{...path[1], depth: 8}, {...path[1], generation: 2}]) {
    const other: readonly LessonTextInstanceSegment[] = [path[0], last];
    assert.equal(shouldSuppressLessonTextInstance(snapshot, other), false);
  }
});

test('unresolved dynamic state never removes original text or reveals a guessed answer', () => {
  const snapshot = buildLessonTextSnapshot(binding, context, {question: initial.question});
  assert.equal(snapshot.status, 'blocked');
  assert.deepEqual(snapshot.blocks, []);
  assert.deepEqual(snapshot.suppressedInstances, []);
  assert.equal(shouldSuppressLessonTextInstance(snapshot, path), false);
});

test('language and signed mathematical text remain explicit source values', () => {
  const snapshot = buildLessonTextSnapshot(binding, {...context, lang: 'es'}, {...initial, question: {text: '−10 < −2; ½ × 4 = 2', visible: true}});
  assert.equal(snapshot.identity.language, 'es');
  assert.equal(snapshot.blocks[0]!.language, 'en');
  assert.equal(snapshot.blocks[0]!.text, '−10 < −2; ½ × 4 = 2');
});

test('invalid instance identity and duplicate blocks fail at the binding boundary', () => {
  assert.throws(() => validateLessonTextBinding({...binding, blocks: [...binding.blocks, binding.blocks[0]!]}), /duplicate/);
  assert.throws(() => validateLessonTextBinding({...binding, blocks: [{...binding.blocks[0]!, instance: {id: 'text12', path}}]}), /instance id/);
});

test('incomplete frame identity and unexpected values keep both presentation layers unchanged', () => {
  assert.equal(buildLessonTextSnapshot(binding, {...context, rootFrame: undefined}, initial).status, 'blocked');
  assert.equal(buildLessonTextSnapshot(binding, context, {...initial, surprise: {text: 'answer', visible: true}}).status, 'blocked');
});


test('bitmap-only teaching text accepts exact positive IDs and rejects absent or malformed source bindings', () => {
  const bitmap = {...binding, blocks: [{...binding.blocks[0]!, sourceTextIds: [], sourceBitmapIds: [183]}]};
  assert.equal(validateLessonTextBinding(bitmap), bitmap);
  const snapshot = buildLessonTextSnapshot(bitmap, context, {question: {text: '$5', visible: true}});
  assert.equal(snapshot.status, 'ready');
  for (const sourceBitmapIds of [[], [0], [-1], [1.5], [Number.NaN], [Number.MAX_SAFE_INTEGER + 1]]) {
    assert.throws(() => validateLessonTextBinding({...bitmap, blocks: [{...bitmap.blocks[0]!, sourceBitmapIds}]}), /missing source binding/);
  }
  assert.throws(() => validateLessonTextBinding({...binding, blocks: [{...binding.blocks[0]!, sourceBitmapIds: [0]}]}), /missing source binding/);
});
