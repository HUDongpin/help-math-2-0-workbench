import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import type {RuntimeContext} from '../src/contract';
import {p006TextSnapshot, P006_TITLE, P006_QUESTION, P006_TEXT_BINDING,
  P006_TITLE_INSTANCE, P006_QUESTION_INSTANCE, P006_QUESTION_UNDERLINE_INSTANCE,
  P006_QUESTION_PAPER_INSTANCE} from '../src/alg-l12-p006-typography';
import {shouldSuppressLessonTextInstance} from '../src/lesson-text-snapshot';

const context = (frame: number, replay = 0): RuntimeContext => ({frame, frameDomain: 'sprite-53',
  rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay});
const source = JSON.parse(readFileSync(new URL('../../../output/p006-typography-source/question-reveal.json', import.meta.url), 'utf8'));

test('native question is never ahead of exact source glyph/mask geometry at any frame', () => {
  assert.equal(source.sourceSha256, P006_TEXT_BINDING.sourceSwfSha256);
  assert.equal(source.text, P006_QUESTION);
  for (let frame = 1; frame <= 342; frame++) {
    const mask = source.frames.find((row: {frame: number}) => row.frame === frame);
    const words = source.words.filter((word: {charStart: number; charEndExclusive: number}) => mask &&
      source.characters.slice(word.charStart, word.charEndExclusive).every((char: {glyphBoundsTwips: null | {
        left: number; right: number; top: number; bottom: number;
      }}) => !char.glyphBoundsTwips ||
        char.glyphBoundsTwips.left >= source.maskLeftRelativeToTextTwips &&
        char.glyphBoundsTwips.right <= mask.clipRightRelativeToTextTwips &&
        char.glyphBoundsTwips.top >= source.maskTopRelativeToTextTwips &&
        char.glyphBoundsTwips.bottom <= source.maskBottomRelativeToTextTwips));
    const snapshot = p006TextSnapshot(context(frame));
    assert.equal(snapshot.status, 'ready');
    const question = snapshot.blocks.find(block => block.id === 'question')!;
    assert.equal(question.text, words.map((word: {word: string}) => word.word).join(' '), `frame ${frame}`);
    assert.equal(question.visible, words.length > 0);
    assert.deepEqual(snapshot.suppressedInstances.map(instance => instance.id), [P006_TITLE_INSTANCE.id,
      ...(frame >= 242 ? [P006_QUESTION_PAPER_INSTANCE.id] : []),
      ...(frame >= 249 ? [P006_QUESTION_INSTANCE.id, P006_QUESTION_UNDERLINE_INSTANCE.id] : [])]);
  }
});
test('source title, complete question, exact instances and Replay remain coherent', () => {
  const end = p006TextSnapshot(context(342));
  assert.deepEqual(end.blocks.map(block => [block.text, block.language, block.readingOrder]),
    [[P006_TITLE, 'en', 0], [P006_QUESTION, 'en', 1]]);
  assert.equal(p006TextSnapshot(context(337)).blocks[1].text.endsWith('inequalities?'), false);
  assert.equal(p006TextSnapshot(context(338)).blocks[1].text, P006_QUESTION);
  const reset = p006TextSnapshot(context(1, 2));
  assert.equal(reset.identity.replay, 2); assert.equal(reset.blocks[1].visible, false);
  assert.equal(reset.blocks[0].text, P006_TITLE);
  assert.equal(shouldSuppressLessonTextInstance(end, P006_QUESTION_INSTANCE.path), true);
  assert.equal(shouldSuppressLessonTextInstance(end, [{timelineId: 'root', depth: 64, generation: 1, characterId: 54}]), false);
  assert.equal(shouldSuppressLessonTextInstance(end, P006_QUESTION_INSTANCE.path.map(segment =>
    segment.timelineId === 'sprite-53' ? {...segment, generation: 2} : segment)), false);
});
test('unsupported domains/language/time never remove original text', () => {
  const invalid = [context(0), context(343), context(3.5), {...context(1), lang: 'es' as const},
    {...context(1), rootFrame: 1}, {...context(1), frameDomain: 'root'},
    {...context(1), scenario: 'other'}, {...context(1), seed: 2}];
  for (const request of invalid) {
    const state = p006TextSnapshot(request);
    assert.equal(state.status, 'blocked'); assert.deepEqual(state.blocks, []);
    assert.deepEqual(state.suppressedInstances, []);
  }
});
